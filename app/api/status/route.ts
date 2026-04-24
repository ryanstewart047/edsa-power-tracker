import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FREETOWN_AREAS, AreaWithStatus } from '@/lib/areas';

export const dynamic = 'force-dynamic';

const EXPIRY_HOURS = 6;
const MIN_REPORTS_TO_CONFIRM = 3; // Updated to 3 reports as requested
const DUPLICATE_WINDOW_HOURS = 2; 
const MAX_DISTANCE_KM = 3; // Reverted to 3km as requested

// Haversine formula to calculate distance between two points in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/status — returns all Freetown areas with their current status
export async function GET() {
  try {
    const statuses = await prisma.areaStatus.findMany({
      where: { city: 'Freetown' },
    });

    const statusLookup: Record<string, typeof statuses[0]> = {};
    for (const s of statuses) {
      statusLookup[s.area] = s;
    }

    const areas: AreaWithStatus[] = FREETOWN_AREAS.map(area => {
      const record = statusLookup[area.name];
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
    const { area, status, deviceId, lat, lng } = await req.json();

    if (!area || !['on', 'out'].includes(status)) {
      return NextResponse.json({ error: 'Invalid area or status' }, { status: 400 });
    }

    const validArea = FREETOWN_AREAS.find(a => a.name === area);
    if (!validArea) {
      return NextResponse.json({ error: 'Unknown area' }, { status: 400 });
    }

    // 1. MANDATORY Location Validation
    if (!lat || !lng) {
      return NextResponse.json({ 
        error: 'Location required', 
        message: 'Your GPS location is required to verify your report.' 
      }, { status: 403 });
    }

    const distance = calculateDistance(lat, lng, validArea.lat, validArea.lng);
    if (distance > MAX_DISTANCE_KM) {
      return NextResponse.json({ 
        error: 'Location mismatch', 
        message: `You appear to be too far from ${area} to submit a report. (Distance: ${distance.toFixed(2)}km, Max: ${MAX_DISTANCE_KM}km)` 
      }, { status: 403 });
    }

    // 2. Device Validation (Duplicate Check for SAME status)
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
        return NextResponse.json({ 
          error: 'Duplicate report', 
          message: `You have already reported "${status === 'on' ? 'Power ON' : 'Power OUT'}" recently. If the status changed, please try again.` 
        }, { status: 429 });
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);

    // Record the individual report
    await prisma.outageReport.create({
      data: { 
        area, 
        city: 'Freetown', 
        status, 
        expiresAt,
        deviceId,
        reporterLat: lat,
        reporterLng: lng
      },
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

    // Consensus Logic: Only update public status if reports >= MIN_REPORTS_TO_CONFIRM
    const isConfirmed = recentReports >= MIN_REPORTS_TO_CONFIRM;
    const confidence = Math.min(100, recentReports * 33); // Updated to match 3 reports (33% each)

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
    return NextResponse.json({ 
      error: 'Failed to submit report',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
