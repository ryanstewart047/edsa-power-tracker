import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FEATURE_FLAGS, auditAdminAction, getFeatureFlags } from '@/lib/operations';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  return getAdminSession();
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [flags, feedback, announcements, logs, feedbackCount] = await Promise.all([
      getFeatureFlags(),
      prisma.feedbackSubmission.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
      prisma.feedbackSubmission.count(),
    ]);
    return NextResponse.json({ flags, definitions: FEATURE_FLAGS, feedback, announcements, logs, feedbackCount });
  } catch (error) {
    console.error('Admin operations GET error:', error);
    return NextResponse.json({ error: 'Operations data is unavailable. Confirm the latest database schema has been deployed.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  if (body.action === 'set-flag') {
    const key = body.key;
    const enabled = body.enabled;
    if (typeof key !== 'string' || !(key in FEATURE_FLAGS) || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid feature flag update' }, { status: 400 });
    }
    await prisma.appSetting.upsert({
      where: { key },
      create: { key, value: String(enabled), updatedBy: admin.email },
      update: { value: String(enabled), updatedBy: admin.email },
    });
    await auditAdminAction(admin.email, 'feature_flag_updated', `${key}=${enabled}`);
    return NextResponse.json({ success: true, flags: await getFeatureFlags() });
  }

  if (body.action === 'create-announcement') {
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
    if (!title || !message) return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    const announcement = await prisma.announcement.create({ data: { title, message, createdBy: admin.email } });
    await auditAdminAction(admin.email, 'announcement_created', announcement.id);
    return NextResponse.json({ success: true, announcement });
  }

  if (body.action === 'set-announcement-status' && typeof body.id === 'string' && typeof body.active === 'boolean') {
    await prisma.announcement.update({ where: { id: body.id }, data: { active: body.active } });
    await auditAdminAction(admin.email, body.active ? 'announcement_enabled' : 'announcement_disabled', body.id);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'update-announcement' && typeof body.id === 'string') {
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
    if (!title || !message) return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    const announcement = await prisma.announcement.update({
      where: { id: body.id },
      data: { title, message },
    });
    await auditAdminAction(admin.email, 'announcement_updated', announcement.id);
    return NextResponse.json({ success: true, announcement });
  }

  if (body.action === 'delete-announcement' && typeof body.id === 'string') {
    await prisma.announcement.delete({ where: { id: body.id } });
    await auditAdminAction(admin.email, 'announcement_deleted', body.id);
    return NextResponse.json({ success: true });
  }

    return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
  } catch (error) {
    console.error('Admin operations POST error:', error);
    return NextResponse.json({ error: 'Could not save this operations change. Confirm the latest database schema has been deployed.' }, { status: 500 });
  }
}
