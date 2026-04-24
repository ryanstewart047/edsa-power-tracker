import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FREETOWN_AREAS, AreaWithStatus } from '@/lib/areas';

const EXPIRY_HOURS = 6;
const MIN_REPORTS_TO_CONFIRM = 2;

// GET /api/status — returns all Freetown areas with their current status
export async function GET() {
  try {
    const statuses = await prisma.areaStatus.findMany({
      where: { city: 'Freetown' },
    });

    const statusMap = new Map(statuses.map(s => [s.area, s]));

    const areas: AreaWithStatus[] = FREETOWN_AREAS.map(area => {
      const record = statusMap.get(area.name);
      return {
        ...area,
        status: (record?.status ?? 'unknown') as 'on' | 'out' | 'unknown',
        confidence: record?.confidence ?? 0,
        reportCount: record?.reportCount ?? 0,
        lastUpdated: record?.lastUpdated?.toISOString() ?? null,
      };
    });

    return NextResponse.json(areas, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('GET /api/status error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

// POST /api/status — submit a power report for an area
export async function POST(req: NextRequest) {
  try {
    const { area, status } = await req.json();

    if (!area || !['on', 'out'].includes(status)) {
      return NextResponse.json({ error: 'Invalid area or status' }, { status: 400 });
    }

    const validArea = FREETOWN_AREAS.find(a => a.name === area);
    if (!validArea) {
      return NextResponse.json({ error: 'Unknown area' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);

    // Record the individual report
    await prisma.outageReport.create({
      data: { area, city: 'Freetown', status, expiresAt },
    });

    // Count recent reports for this area (last 30 minutes)
    const recentWindow = new Date(now.getTime() - 30 * 60 * 1000);
    const recentReports = await prisma.outageReport.count({
      where: {
        area,
        status,
        reportedAt: { gte: recentWindow },
        expiresAt: { gte: now },
      },
    });

    const isConfirmed = recentReports >= MIN_REPORTS_TO_CONFIRM;
    const confidence = Math.min(100, recentReports * 30);

    // Upsert the area status
    await prisma.areaStatus.upsert({
      where: { area },
      create: {
        area,
        city: 'Freetown',
        status,
        confidence,
        reportCount: recentReports,
        lastUpdated: now,
        confirmedAt: isConfirmed ? now : null,
      },
      update: {
        status,
        confidence,
        reportCount: recentReports,
        lastUpdated: now,
        confirmedAt: isConfirmed ? now : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      confirmed: isConfirmed,
      reportsNeeded: Math.max(0, MIN_REPORTS_TO_CONFIRM - recentReports),
      totalReports: recentReports,
    });
  } catch (error) {
    console.error('POST /api/status error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
