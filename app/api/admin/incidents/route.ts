import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditAdminAction } from '@/lib/operations';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const incidents = await prisma.hazardReport.findMany({ orderBy: [{ resolved: 'asc' }, { slaDueAt: 'asc' }, { reportedAt: 'desc' }], take: 200 });
  const outages = await prisma.scheduledOutage.findMany({ orderBy: { startsAt: 'asc' }, take: 50 });
  return NextResponse.json({ incidents, outages });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  if (body.action === 'create-outage') {
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
    const area = typeof body.area === 'string' ? body.area.trim().slice(0, 120) || null : null;
    const startsAt = typeof body.startsAt === 'string' ? new Date(body.startsAt) : new Date('invalid');
    const endsAt = typeof body.endsAt === 'string' ? new Date(body.endsAt) : new Date('invalid');
    if (!title || !message || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) return NextResponse.json({ error: 'Provide a title, message, and valid outage time window.' }, { status: 400 });
    const outage = await prisma.scheduledOutage.create({ data: { title, message, area, startsAt, endsAt, createdBy: admin.email } });
    await auditAdminAction(admin.email, 'scheduled_outage_created', outage.id);
    return NextResponse.json({ success: true, outage });
  }
  if (body.action === 'set-outage-status' && typeof body.id === 'string' && typeof body.active === 'boolean') {
    await prisma.scheduledOutage.update({ where: { id: body.id }, data: { active: body.active } });
    await auditAdminAction(admin.email, body.active ? 'scheduled_outage_enabled' : 'scheduled_outage_disabled', body.id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
}
