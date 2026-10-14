import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditAdminAction } from '@/lib/operations';

export const dynamic = 'force-dynamic';

interface IncidentItem {
  id: string;
  referenceCode: string | null;
  type: string;
  area: string;
  areaName: string | null;
  description: string | null;
  imageUrl: string | null;
  incidentStatus: string;
  severity: string;
  assignedTo: string | null;
  slaDueAt: string | null;
  resolutionNote: string | null;
  resolutionImageUrl: string | null;
  reportedAt?: string;
  resolved?: boolean;
}

interface RawHazardRecord {
  id: string;
  type?: string;
  area?: string;
  areaName?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  reportedAt?: Date | string;
  resolved?: boolean;
  referenceCode?: string | null;
  incidentStatus?: string | null;
  severity?: string | null;
  assignedTo?: string | null;
  slaDueAt?: Date | string | null;
  resolutionNote?: string | null;
  resolutionImageUrl?: string | null;
}

interface OutageItem {
  id: string;
  title: string;
  message: string;
  area: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
  active: boolean;
  createdAt?: Date | string;
  createdBy?: string;
}

let outageTableReady = false;

/**
 * Automatically creates the ScheduledOutage table if it does not exist in PostgreSQL.
 */
async function ensureScheduledOutageTable(): Promise<boolean> {
  if (outageTableReady) return true;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ScheduledOutage" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "area" TEXT,
        "startsAt" TIMESTAMP(3) NOT NULL,
        "endsAt" TIMESTAMP(3) NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" TEXT NOT NULL
      );
    `);
    outageTableReady = true;
    return true;
  } catch (err) {
    console.warn('[ScheduledOutage] Could not auto-create table via executeRawUnsafe:', err);
    return false;
  }
}

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let incidents: IncidentItem[] = [];
    let outages: OutageItem[] = [];

    // 1. Fetch hazard reports defensively
    try {
      const dbHazards = await prisma.hazardReport.findMany({
        orderBy: { reportedAt: 'desc' },
        take: 200,
      });

      incidents = (dbHazards as unknown as RawHazardRecord[]).map((h) => ({
        id: h.id,
        referenceCode: h.referenceCode || `HZ-${h.id.slice(-6).toUpperCase()}`,
        type: h.type || 'Hazard',
        area: h.area || 'Freetown',
        areaName: h.areaName || null,
        description: h.description || null,
        imageUrl: h.imageUrl || null,
        incidentStatus: h.incidentStatus || (h.resolved ? 'resolved' : 'received'),
        severity: h.severity || 'medium',
        assignedTo: h.assignedTo || null,
        slaDueAt: h.slaDueAt ? new Date(h.slaDueAt).toISOString() : null,
        resolutionNote: h.resolutionNote || null,
        resolutionImageUrl: h.resolutionImageUrl || null,
        reportedAt: h.reportedAt ? new Date(h.reportedAt).toISOString() : undefined,
        resolved: Boolean(h.resolved),
      }));
    } catch (hazardErr) {
      console.warn('Direct prisma.hazardReport.findMany failed, trying raw query fallback:', hazardErr);
      try {
        const rawRows = await prisma.$queryRawUnsafe<RawHazardRecord[]>(
          `SELECT id, type, description, "streetName", "houseNumber", "areaName", "imageUrl", area, city, "reportedAt", resolved, "resolvedAt", "resolvedBy" FROM "HazardReport" ORDER BY "reportedAt" DESC LIMIT 100`
        );
        if (Array.isArray(rawRows)) {
          incidents = rawRows.map((h) => ({
            id: h.id,
            referenceCode: `HZ-${h.id.slice(-6).toUpperCase()}`,
            type: h.type || 'Hazard',
            area: h.area || 'Freetown',
            areaName: h.areaName || null,
            description: h.description || null,
            imageUrl: h.imageUrl || null,
            incidentStatus: h.resolved ? 'resolved' : 'received',
            severity: 'medium',
            assignedTo: null,
            slaDueAt: null,
            resolutionNote: null,
            resolutionImageUrl: null,
            reportedAt: h.reportedAt ? new Date(h.reportedAt).toISOString() : undefined,
            resolved: Boolean(h.resolved),
          }));
        }
      } catch (rawErr) {
        console.warn('Raw query for HazardReport also failed, returning empty incidents queue:', rawErr);
        incidents = [];
      }
    }

    // 2. Fetch outages defensively with auto-migrated table
    await ensureScheduledOutageTable();
    try {
      outages = await prisma.scheduledOutage.findMany({
        orderBy: { startsAt: 'asc' },
        take: 50,
      });
    } catch (outageErr) {
      console.warn('prisma.scheduledOutage.findMany failed, trying raw fallback query:', outageErr);
      try {
        const rawOutages = await prisma.$queryRawUnsafe<OutageItem[]>(
          `SELECT "id", "title", "message", "area", "startsAt", "endsAt", "active", "createdAt", "createdBy" FROM "ScheduledOutage" ORDER BY "startsAt" ASC LIMIT 50`
        );
        if (Array.isArray(rawOutages)) {
          outages = rawOutages;
        }
      } catch {
        outages = [];
      }
    }

    return NextResponse.json({ incidents, outages }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/incidents unexpected error, serving safe fallback:', error);
    return NextResponse.json({ incidents: [], outages: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as Record<string, unknown>;

    // Ensure ScheduledOutage table exists before any write operation
    await ensureScheduledOutageTable();

    if (body.action === 'create-outage') {
      const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
      const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
      const area = typeof body.area === 'string' ? body.area.trim().slice(0, 500) || null : null;
      const startsAt = typeof body.startsAt === 'string' ? new Date(body.startsAt) : new Date('invalid');
      const endsAt = typeof body.endsAt === 'string' ? new Date(body.endsAt) : new Date('invalid');
      if (!title || !message || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
        return NextResponse.json({ error: 'Provide a title, message, and valid outage time window.' }, { status: 400 });
      }

      try {
        const outage = await prisma.scheduledOutage.create({
          data: { title, message, area, startsAt, endsAt, createdBy: admin.email },
        });
        await auditAdminAction(admin.email, 'scheduled_outage_created', outage.id);
        return NextResponse.json({ success: true, outage });
      } catch (dbErr) {
        console.warn('prisma.scheduledOutage.create failed, using raw SQL insert fallback:', dbErr);
        const id = `so_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        try {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "ScheduledOutage" ("id", "title", "message", "area", "startsAt", "endsAt", "active", "createdAt", "createdBy")
             VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), $7)`,
            id,
            title,
            message,
            area,
            startsAt,
            endsAt,
            admin.email
          );
          const rawOutage: OutageItem = {
            id,
            title,
            message,
            area,
            startsAt,
            endsAt,
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: admin.email,
          };
          await auditAdminAction(admin.email, 'scheduled_outage_created', id);
          return NextResponse.json({ success: true, outage: rawOutage });
        } catch (rawInsertErr) {
          console.error('Fatal raw insert error for ScheduledOutage:', rawInsertErr);
          return NextResponse.json({ error: 'Failed to save scheduled outage to database.' }, { status: 500 });
        }
      }
    }

    if (body.action === 'set-outage-status' && typeof body.id === 'string' && typeof body.active === 'boolean') {
      try {
        await prisma.scheduledOutage.update({ where: { id: body.id }, data: { active: body.active } });
        await auditAdminAction(admin.email, body.active ? 'scheduled_outage_enabled' : 'scheduled_outage_disabled', body.id);
        return NextResponse.json({ success: true });
      } catch (dbErr) {
        console.warn('prisma.scheduledOutage.update failed, using raw SQL update fallback:', dbErr);
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE "ScheduledOutage" SET "active" = $1 WHERE "id" = $2`,
            body.active,
            body.id
          );
          await auditAdminAction(admin.email, body.active ? 'scheduled_outage_enabled' : 'scheduled_outage_disabled', body.id);
          return NextResponse.json({ success: true });
        } catch (rawUpdateErr) {
          console.error('Fatal raw update error for ScheduledOutage:', rawUpdateErr);
          return NextResponse.json({ error: 'Failed to update outage status in database.' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/admin/incidents error:', error);
    return NextResponse.json({ error: 'Could not update the incident queue. Please try again.' }, { status: 500 });
  }
}
