import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function deviceIdFrom(value: string | null) {
  return value?.startsWith('dev_') && value.length <= 100 ? value : null;
}

export async function GET(request: NextRequest) {
  const deviceId = deviceIdFrom(request.nextUrl.searchParams.get('deviceId'));
  const area = request.nextUrl.searchParams.get('area')?.trim().slice(0, 120) || null;
  const now = new Date();
  const [outages, subscriptions] = await Promise.all([
    prisma.scheduledOutage.findMany({
      where: { active: true, endsAt: { gt: now }, ...(area ? { OR: [{ area }, { area: null }] } : {}) },
      orderBy: { startsAt: 'asc' },
      take: 12,
    }),
    deviceId ? prisma.areaSubscription.findMany({ where: { deviceId, active: true }, orderBy: { area: 'asc' } }) : [],
  ]);
  return NextResponse.json({ outages, subscriptions: subscriptions.map((item) => item.area) });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const deviceId = typeof body.deviceId === 'string' ? deviceIdFrom(body.deviceId) : null;
  const area = typeof body.area === 'string' ? body.area.trim().slice(0, 120) : '';
  const active = typeof body.active === 'boolean' ? body.active : true;
  if (!deviceId || !area) return NextResponse.json({ error: 'A valid device and area are required.' }, { status: 400 });
  const subscription = await prisma.areaSubscription.upsert({
    where: { deviceId_area: { deviceId, area } },
    create: { deviceId, area, active },
    update: { active },
  });
  return NextResponse.json({ success: true, subscription });
}
