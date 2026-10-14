import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function deviceIdFrom(value: string | null) {
  return value && value.startsWith('dev_') && value.length <= 100 ? value : null;
}

let tableEnsured = false;

async function ensureAreaSubscriptionTable(): Promise<boolean> {
  if (tableEnsured) return true;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AreaSubscription" (
        "id" TEXT PRIMARY KEY,
        "deviceId" TEXT NOT NULL,
        "area" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AreaSubscription_deviceId_area_key" ON "AreaSubscription"("deviceId", "area");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AreaSubscription_area_active_idx" ON "AreaSubscription"("area", "active");
    `);
    tableEnsured = true;
    return true;
  } catch (err) {
    console.warn('[AreaSubscription] ensure table warning:', err);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureAreaSubscriptionTable();
    const deviceId = deviceIdFrom(request.nextUrl.searchParams.get('deviceId'));
    const area = request.nextUrl.searchParams.get('area')?.trim().slice(0, 120) || null;
    const now = new Date();

    let outages: unknown[] = [];
    try {
      outages = await prisma.scheduledOutage.findMany({
        where: { active: true, endsAt: { gt: now }, ...(area ? { OR: [{ area }, { area: null }] } : {}) },
        orderBy: { startsAt: 'asc' },
        take: 12,
      });
    } catch (outageErr) {
      console.warn('Outage findMany error in /api/alerts:', outageErr);
      try {
        const rawOutages = await prisma.$queryRawUnsafe(
          `SELECT "id", "title", "message", "area", "startsAt", "endsAt", "active" FROM "ScheduledOutage" WHERE "active" = true AND "endsAt" > NOW() ORDER BY "startsAt" ASC LIMIT 12`
        );
        if (Array.isArray(rawOutages)) outages = rawOutages;
      } catch {
        outages = [];
      }
    }

    let subscriptions: string[] = [];
    if (deviceId) {
      try {
        const subs = await prisma.areaSubscription.findMany({
          where: { deviceId, active: true },
          orderBy: { area: 'asc' },
        });
        subscriptions = subs.map((item) => item.area);
      } catch (subErr) {
        console.warn('AreaSubscription findMany error in /api/alerts:', subErr);
        try {
          const rawSubs = await prisma.$queryRawUnsafe<{ area: string }[]>(
            `SELECT "area" FROM "AreaSubscription" WHERE "deviceId" = $1 AND "active" = true ORDER BY "area" ASC`,
            deviceId
          );
          if (Array.isArray(rawSubs)) subscriptions = rawSubs.map((r) => r.area);
        } catch {
          subscriptions = [];
        }
      }
    }

    return NextResponse.json({ outages, subscriptions }, { status: 200 });
  } catch (error) {
    console.error('GET /api/alerts unexpected error:', error);
    return NextResponse.json({ outages: [], subscriptions: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAreaSubscriptionTable();
    const body = (await request.json()) as Record<string, unknown>;
    const rawDeviceId = typeof body.deviceId === 'string' ? body.deviceId.trim() : '';
    const deviceId = rawDeviceId.startsWith('dev_') ? rawDeviceId : `dev_${rawDeviceId || 'anon'}`;
    const area = typeof body.area === 'string' ? body.area.trim().slice(0, 120) : '';
    const active = typeof body.active === 'boolean' ? body.active : true;

    if (!deviceId || !area) {
      return NextResponse.json({ error: 'A valid device and area are required.' }, { status: 400 });
    }

    try {
      const subscription = await prisma.areaSubscription.upsert({
        where: { deviceId_area: { deviceId, area } },
        create: { deviceId, area, active },
        update: { active },
      });
      return NextResponse.json({ success: true, active: subscription.active });
    } catch (upsertErr) {
      console.warn('prisma.areaSubscription.upsert failed, trying raw SQL fallback:', upsertErr);
      const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "AreaSubscription" ("id", "deviceId", "area", "active", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT ("deviceId", "area") DO UPDATE SET "active" = $4, "updatedAt" = NOW()`,
        id,
        deviceId,
        area,
        active
      );
      return NextResponse.json({ success: true, active });
    }
  } catch (error) {
    console.error('POST /api/alerts error:', error);
    return NextResponse.json({ error: 'Failed to update area subscription.' }, { status: 500 });
  }
}
