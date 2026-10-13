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

    const existingHazard = await prisma.hazardReport.findUnique({
      where: { id: hazardId },
      select: { id: true, type: true, area: true, areaName: true },
    });

    if (!existingHazard) {
      return NextResponse.json({ error: 'Hazard report not found.' }, { status: 404 });
    }

    // Mark as resolved instead of deleting
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
    await auditAdminAction(admin.email, 'incident_resolved', existingHazard.id);

    return NextResponse.json({
      success: true,
      message: `${existingHazard.type} in ${existingHazard.areaName || existingHazard.area} marked as resolved.`,
      hazard: updated,
    });
  } catch (error) {
    console.error('DELETE /api/hazards/[id] error:', error);
    return NextResponse.json({ error: 'Failed to resolve hazard report.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const incidentStatus = typeof body.incidentStatus === 'string' ? body.incidentStatus : undefined;
    const severity = typeof body.severity === 'string' ? body.severity : undefined;
    const assignedTo = typeof body.assignedTo === 'string' ? body.assignedTo.trim().slice(0, 160) || null : undefined;
    const resolutionNote = typeof body.resolutionNote === 'string' ? body.resolutionNote.trim().slice(0, 500) || null : undefined;
    const resolutionImageInput = typeof body.resolutionImageUrl === 'string'
      ? body.resolutionImageUrl
      : undefined;
    const hasResolutionImage = resolutionImageInput !== undefined;
    const resolutionImageUrl = hasResolutionImage
      ? normalizeHazardImage(resolutionImageInput)
      : undefined;
    if (resolutionImageInput?.trim() && !resolutionImageUrl) {
      return NextResponse.json({ error: 'Resolution photo must be a valid image or secure image URL.' }, { status: 400 });
    }
    if (incidentStatus && !['received', 'reviewing', 'dispatched', 'resolved'].includes(incidentStatus)) return NextResponse.json({ error: 'Invalid incident status' }, { status: 400 });
    if (severity && !['low', 'medium', 'high', 'critical'].includes(severity)) return NextResponse.json({ error: 'Invalid severity' }, { status: 400 });
    const resolved = incidentStatus === 'resolved';
    const hazard = await prisma.hazardReport.update({
      where: { id: params.id },
      data: {
        ...(incidentStatus ? { incidentStatus, resolved, resolvedAt: resolved ? new Date() : null, resolvedBy: resolved ? admin.email : null } : {}),
        ...(severity ? { severity } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
        ...(resolutionNote !== undefined ? { resolutionNote } : {}),
        ...(resolutionImageUrl !== undefined ? { resolutionImageUrl } : {}),
        statusUpdatedAt: new Date(),
      },
    });
    await auditAdminAction(admin.email, 'incident_updated', `${hazard.referenceCode}:${hazard.incidentStatus}`);
    return NextResponse.json({ success: true, hazard });
  } catch (error) {
    console.error('PATCH /api/hazards/[id] error:', error);
    return NextResponse.json({ error: 'Could not update incident.' }, { status: 500 });
  }
}
