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
}

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let incidents: IncidentItem[] = [];
    let outages: OutageItem[] = [];

    // 1. Try to fetch hazard reports defensively
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

    // 2. Try to fetch outages defensively
    try {
      outages = await prisma.scheduledOutage.findMany({
        orderBy: { startsAt: 'asc' },
        take: 50,
      });
    } catch (outageErr) {
      console.warn('ScheduledOutage table not available or unmigrated, returning empty outages:', outageErr);
      outages = [];
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

    if (body.action === 'create-outage') {
      const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
      const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
      const area = typeof body.area === 'string' ? body.area.trim().slice(0, 120) || null : null;
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
        console.warn('Cannot create outage (table not migrated):', dbErr);
        return NextResponse.json({ error: 'Scheduled outages database table is not migrated yet.' }, { status: 500 });
      }
    }

    if (body.action === 'set-outage-status' && typeof body.id === 'string' && typeof body.active === 'boolean') {
      try {
        await prisma.scheduledOutage.update({ where: { id: body.id }, data: { active: body.active } });
        await auditAdminAction(admin.email, body.active ? 'scheduled_outage_enabled' : 'scheduled_outage_disabled', body.id);
        return NextResponse.json({ success: true });
      } catch (dbErr) {
        console.warn('Cannot update outage:', dbErr);
        return NextResponse.json({ error: 'Scheduled outage not found or unmigrated.' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/admin/incidents error:', error);
    return NextResponse.json({ error: 'Could not update the incident queue. Please try again.' }, { status: 500 });
  }
}
