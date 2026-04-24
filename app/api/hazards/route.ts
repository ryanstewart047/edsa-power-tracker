import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FREETOWN_AREAS } from '@/lib/areas';

export const dynamic = 'force-dynamic';

const MAX_DISTANCE_KM = 10;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/hazards — returns recent hazard reports
export async function GET() {
  try {
    const hazards = await prisma.hazardReport.findMany({
      orderBy: { reportedAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(hazards);
  } catch (error) {
    console.error('GET /api/hazards error:', error);
    return NextResponse.json({ error: 'Failed to fetch hazards' }, { status: 500 });
  }
}

// POST /api/hazards — submit a hazard report (falling poles, sparking cables)
export async function POST(req: NextRequest) {
  try {
    const { type, description, streetName, houseNumber, imageUrl, area, lat, lng, deviceId } = await req.json();

    if (!type || !area) {
      return NextResponse.json({ error: 'Type and area are required' }, { status: 400 });
    }

    const validArea = FREETOWN_AREAS.find(a => a.name === area);
    if (!validArea) {
      return NextResponse.json({ error: 'Unknown area' }, { status: 400 });
    }

    // Mandatory Location Validation
    if (!lat || !lng) {
      return NextResponse.json({ 
        error: 'Location required', 
        message: 'GPS location is required to verify the hazard location.' 
      }, { status: 403 });
    }

    const distance = calculateDistance(lat, lng, validArea.lat, validArea.lng);
    if (distance > MAX_DISTANCE_KM) {
      return NextResponse.json({ 
        error: 'Location mismatch', 
        message: `You are too far from ${area} to report a hazard. (Distance: ${distance.toFixed(2)}km)` 
      }, { status: 403 });
    }

    const hazard = await prisma.hazardReport.create({
      data: {
        type,
        description,
        streetName,
        houseNumber,
        imageUrl,
        area,
        city: 'Freetown',
        lat,
        lng,
        deviceId,
      },
    });

    return NextResponse.json({ success: true, hazard });
  } catch (error) {
    console.error('POST /api/hazards error:', error);
    return NextResponse.json({ error: 'Failed to submit hazard report' }, { status: 500 });
  }
}
