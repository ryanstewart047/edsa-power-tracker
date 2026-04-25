import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AreaStatus, FREETOWN_AREAS, AreaWithStatus, FREETOWN_CITY } from '@/lib/areas';
import {
  DUPLICATE_WINDOW_HOURS,
  MIN_REPORTS_TO_CONFIRM,
  RECENT_REPORT_WINDOW_MINUTES,
  REPORT_EXPIRY_HOURS,
  normalizePowerStatus,
  parseDeviceId,
  validateReporterLocation,
} from '@/lib/reporting';

export const dynamic = 'force-dynamic';

// GET /api/status — returns all Freetown areas with their current status
export async function GET() {
  try {
    const statuses = await prisma.areaStatus.findMany({
      where: { city: FREETOWN_CITY },
    });

    const statusLookup = new Map(statuses.map((status) => [status.area, status]));

    const areas: AreaWithStatus[] = FREETOWN_AREAS.map(area => {
      const record = statusLookup.get(area.name);
      return {
        name: area.name,
        lat: area.lat,
        lng: area.lng,
        status: ((record?.status) ?? 'unknown') as 'on' | 'out' | 'unknown',
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
    return NextResponse.json({ 
      error: 'Failed to fetch status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST /api/status — submit a power report for an area
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const status = normalizePowerStatus(body.status);

    if (status !== 'on' && status !== 'out') {
      return NextResponse.json(
        {
          error: 'Invalid status',
          message: 'Power reports must be submitted as either "on" or "out".',
        },
        { status: 400 },
      );
    }

    const locationValidation = validateReporterLocation(body.area, body.lat, body.lng);
    if (!locationValidation.ok) {
      return NextResponse.json(locationValidation.body, { status: locationValidation.status });
    }

    const area = locationValidation.area;
    const deviceId = parseDeviceId(body.deviceId);

    if (deviceId) {
      const recentSameStatusReport = await prisma.outageReport.findFirst({
        where: {
          deviceId,
          area,
          status,
          reportedAt: {
            gte: new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000)
          }
        }
      });

      if (recentSameStatusReport) {
        return NextResponse.json(
          {
            error: 'Duplicate report',
            message: `You already reported Power ${status.toUpperCase()} for ${area} recently. If the situation changed, please wait a little and try again.`,
          },
          { status: 429 },
        );
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + REPORT_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.outageReport.create({
      data: {
        area,
        city: FREETOWN_CITY,
        status,
        expiresAt,
        deviceId,
        reporterLat: locationValidation.lat,
        reporterLng: locationValidation.lng,
      },
    });

    const recentWindow = new Date(now.getTime() - RECENT_REPORT_WINDOW_MINUTES * 60 * 1000);
    const [recentReportGroups, existingAreaStatus] = await Promise.all([
      prisma.outageReport.groupBy({
        by: ['status'],
        where: {
          area,
          reportedAt: { gte: recentWindow },
          expiresAt: { gte: now },
        },
        _count: { _all: true },
      }),
      prisma.areaStatus.findUnique({ where: { area } }),
    ]);

    const counts: Record<'on' | 'out', number> = { on: 0, out: 0 };
    for (const group of recentReportGroups) {
      if (group.status === 'on' || group.status === 'out') {
        counts[group.status] = group._count._all;
      }
    }

    const competingStatus: Exclude<AreaStatus, 'unknown'> = status === 'on' ? 'out' : 'on';
    const submittedCount = counts[status];
    const competingCount = counts[competingStatus];
    const leadingStatus: Exclude<AreaStatus, 'unknown'> =
      submittedCount >= competingCount ? status : competingStatus;
    const leadingCount = Math.max(submittedCount, competingCount);
    const isConfirmed = submittedCount >= MIN_REPORTS_TO_CONFIRM && submittedCount > competingCount;
    const currentStatus = isConfirmed
      ? status
      : (existingAreaStatus?.status as AreaStatus | undefined) ?? 'unknown';
    const confidence = Math.min(
      100,
      Math.round((leadingCount / MIN_REPORTS_TO_CONFIRM) * 100),
    );

    await prisma.areaStatus.upsert({
      where: { area },
      create: {
        area,
        city: FREETOWN_CITY,
        status: currentStatus,
        confidence,
        reportCount: leadingCount,
        lastUpdated: now,
        confirmedAt: isConfirmed ? now : null,
      },
      update: {
        status: currentStatus,
        confidence,
        reportCount: leadingCount,
        lastUpdated: now,
        confirmedAt: isConfirmed ? now : existingAreaStatus?.confirmedAt ?? null,
      },
    });

    const reportsNeeded = Math.max(0, MIN_REPORTS_TO_CONFIRM - submittedCount);
    const statusLabel = `Power ${status.toUpperCase()}`;
    const message = isConfirmed
      ? `${area} is now marked as ${statusLabel}.`
      : competingCount > submittedCount
        ? `Your report was saved, but Power ${competingStatus.toUpperCase()} currently has more recent reports in ${area}.`
        : `Your report was saved. ${reportsNeeded} more ${statusLabel} report${reportsNeeded === 1 ? '' : 's'} needed to update ${area}.`;

    return NextResponse.json({
      success: true,
      confirmed: isConfirmed,
      currentStatus,
      pendingStatus: isConfirmed ? null : leadingStatus,
      reportsNeeded,
      totalReports: submittedCount,
      competingReports: competingCount,
      distanceKm: locationValidation.distanceKm,
      closestArea: locationValidation.closestAreaName,
      message,
    });
  } catch (error) {
    console.error('POST /api/status error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit report',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
