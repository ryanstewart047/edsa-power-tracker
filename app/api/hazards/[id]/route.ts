import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { auditAdminAction } from '@/lib/operations';
import { normalizeHazardImage } from '@/lib/reporting';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

let hazardColumnsEnsured = false;

/**
 * Ensures all incident management columns exist on the HazardReport table.
 */
async function ensureHazardColumns(): Promise<boolean> {
  if (hazardColumnsEnsured) return true;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "referenceCode" TEXT;
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "incidentStatus" TEXT NOT NULL DEFAULT 'received';
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "severity" TEXT NOT NULL DEFAULT 'medium';
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "assignedTo" TEXT;
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "slaDueAt" TIMESTAMP(3);
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "resolutionNote" TEXT;
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "resolutionImageUrl" TEXT;
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "resolved" BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
      ALTER TABLE "HazardReport" ADD COLUMN IF NOT EXISTS "resolvedBy" TEXT;
    `);
    hazardColumnsEnsured = true;
    return true;
  } catch (err) {
    console.warn('[HazardReport] ensure columns warning:', err);
    return false;
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hazardId = params.id?.trim();
    if (!hazardId) {
      return NextResponse.json({ error: 'Hazard ID is required.' }, { status: 400 });
    }

    await ensureHazardColumns();

    // Mark as resolved instead of deleting
    try {
      const updated = await prisma.hazardReport.update({
        where: { id: hazardId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: admin.email,
          incidentStatus: 'resolved',
          statusUpdatedAt: new Date(),
        },
        select: { id: true, type: true, area: true, areaName: true, resolved: true, resolvedAt: true, resolvedBy: true },
      });
      await auditAdminAction(admin.email, 'incident_resolved', hazardId);
      return NextResponse.json({
        success: true,
        message: `${updated.type} in ${updated.areaName || updated.area} marked as resolved.`,
        hazard: updated,
      });
    } catch (dbErr) {
      console.warn('prisma.hazardReport.update failed in DELETE, using raw fallback:', dbErr);
      await prisma.$executeRawUnsafe(
        `UPDATE "HazardReport" SET "resolved" = true, "resolvedAt" = NOW(), "resolvedBy" = $1, "incidentStatus" = 'resolved', "statusUpdatedAt" = NOW() WHERE "id" = $2`,
        admin.email,
        hazardId
      );
      await auditAdminAction(admin.email, 'incident_resolved', hazardId);
      return NextResponse.json({
        success: true,
        message: 'Incident marked as resolved.',
        hazard: { id: hazardId, resolved: true },
      });
    }
  } catch (error) {
    console.error('DELETE /api/hazards/[id] error:', error);
    return NextResponse.json({ error: 'Failed to resolve hazard report.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hazardId = params.id?.trim();
    if (!hazardId) {
      return NextResponse.json({ error: 'Hazard ID is required.' }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const incidentStatus = typeof body.incidentStatus === 'string' ? body.incidentStatus : undefined;
    const severity = typeof body.severity === 'string' ? body.severity : undefined;
    const assignedTo = typeof body.assignedTo === 'string' ? body.assignedTo.trim().slice(0, 160) || null : undefined;
    const resolutionNote = typeof body.resolutionNote === 'string' ? body.resolutionNote.trim().slice(0, 500) || null : undefined;
    
    let slaDueAt: Date | null | undefined = undefined;
    if (typeof body.slaDueAt === 'string') {
      const parsed = new Date(body.slaDueAt);
      if (!Number.isNaN(parsed.getTime())) slaDueAt = parsed;
    } else if (body.slaDueAt === null) {
      slaDueAt = null;
    }

    const resolutionImageInput = typeof body.resolutionImageUrl === 'string' ? body.resolutionImageUrl : undefined;
    const hasResolutionImage = resolutionImageInput !== undefined;
    const resolutionImageUrl = hasResolutionImage ? normalizeHazardImage(resolutionImageInput) : undefined;

    if (resolutionImageInput?.trim() && !resolutionImageUrl) {
      return NextResponse.json({ error: 'Resolution photo must be a valid image or secure image URL.' }, { status: 400 });
    }

    if (incidentStatus && !['received', 'reviewing', 'dispatched', 'resolved'].includes(incidentStatus)) {
      return NextResponse.json({ error: 'Invalid incident status' }, { status: 400 });
    }
    if (severity && !['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json({ error: 'Invalid severity' }, { status: 400 });
    }

    await ensureHazardColumns();

    const resolved = incidentStatus ? incidentStatus === 'resolved' : undefined;

    try {
      const hazard = await prisma.hazardReport.update({
        where: { id: hazardId },
        data: {
          ...(incidentStatus ? { incidentStatus } : {}),
          ...(resolved !== undefined ? { resolved, resolvedAt: resolved ? new Date() : null, resolvedBy: resolved ? admin.email : null } : {}),
          ...(severity ? { severity } : {}),
          ...(assignedTo !== undefined ? { assignedTo } : {}),
          ...(slaDueAt !== undefined ? { slaDueAt } : {}),
          ...(resolutionNote !== undefined ? { resolutionNote } : {}),
          ...(resolutionImageUrl !== undefined ? { resolutionImageUrl } : {}),
          statusUpdatedAt: new Date(),
        },
      });

      await auditAdminAction(admin.email, 'incident_updated', `${hazard.referenceCode || hazard.id}:${hazard.incidentStatus}`);
      return NextResponse.json({ success: true, hazard });
    } catch (dbErr) {
      console.warn('prisma.hazardReport.update failed in PATCH, trying raw SQL fallback:', dbErr);

      // Raw SQL fallback if Prisma schema metadata or client has column differences
      const setParts: string[] = ['"statusUpdatedAt" = NOW()'];
      const values: unknown[] = [];
      let idx = 1;

      if (incidentStatus !== undefined) {
        setParts.push(`"incidentStatus" = $${idx++}`);
        values.push(incidentStatus);
      }
      if (resolved !== undefined) {
        setParts.push(`"resolved" = $${idx++}`);
        values.push(resolved);
        if (resolved) {
          setParts.push(`"resolvedAt" = NOW()`);
          setParts.push(`"resolvedBy" = $${idx++}`);
          values.push(admin.email);
        } else {
          setParts.push(`"resolvedAt" = NULL`);
          setParts.push(`"resolvedBy" = NULL`);
        }
      }
      if (severity !== undefined) {
        setParts.push(`"severity" = $${idx++}`);
        values.push(severity);
      }
      if (assignedTo !== undefined) {
        setParts.push(`"assignedTo" = $${idx++}`);
        values.push(assignedTo);
      }
      if (slaDueAt !== undefined) {
        setParts.push(`"slaDueAt" = $${idx++}`);
        values.push(slaDueAt ? slaDueAt.toISOString() : null);
      }
      if (resolutionNote !== undefined) {
        setParts.push(`"resolutionNote" = $${idx++}`);
        values.push(resolutionNote);
      }
      if (resolutionImageUrl !== undefined) {
        setParts.push(`"resolutionImageUrl" = $${idx++}`);
        values.push(resolutionImageUrl);
      }

      values.push(hazardId);
      await prisma.$executeRawUnsafe(
        `UPDATE "HazardReport" SET ${setParts.join(', ')} WHERE "id" = $${idx}`,
        ...values
      );

      await auditAdminAction(admin.email, 'incident_updated', `${hazardId}:${incidentStatus || 'modified'}`);
      return NextResponse.json({ success: true, hazard: { id: hazardId, incidentStatus, severity, assignedTo } });
    }
  } catch (error) {
    console.error('PATCH /api/hazards/[id] fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update incident.' },
      { status: 500 }
    );
  }
}
