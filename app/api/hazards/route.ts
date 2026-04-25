import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FREETOWN_CITY } from '@/lib/areas';
import {
  HAZARD_DUPLICATE_WINDOW_MINUTES,
  normalizeHazardImage,
  normalizeHazardType,
  parseDeviceId,
  parseOptionalText,
  validateReporterLocation,
} from '@/lib/reporting';

export const dynamic = 'force-dynamic';

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
    const body = await req.json() as Record<string, unknown>;
    const type = normalizeHazardType(body.type);
    const locationValidation = validateReporterLocation(body.area, body.lat, body.lng);
    const areaName = parseOptionalText(body.areaName, 120);
    const streetName = parseOptionalText(body.streetName, 120);
    const houseNumber = parseOptionalText(body.houseNumber, 40);
    const description = parseOptionalText(body.description, 500);
    const imageUrl = normalizeHazardImage(body.imageUrl);
    const deviceId = parseDeviceId(body.deviceId);

    if (!type) {
      return NextResponse.json(
        {
          error: 'Invalid hazard type',
          message: 'Please choose a valid hazard type before submitting.',
        },
        { status: 400 },
      );
    }

    if (!locationValidation.ok) {
      return NextResponse.json(locationValidation.body, { status: locationValidation.status });
    }

    if (!areaName) {
      return NextResponse.json(
        {
          error: 'Missing location details',
          message: 'Please enter the specific area or community name for this hazard.',
        },
        { status: 400 },
      );
    }

    if (type === 'Illegal Connection' && (!streetName || !houseNumber)) {
      return NextResponse.json(
        {
          error: 'Missing address details',
          message: 'Street name and house number are required for illegal connection reports.',
        },
        { status: 400 },
      );
    }

    if (!description && !imageUrl) {
      return NextResponse.json(
        {
          error: 'Missing evidence',
          message: 'Please add a short description or a photo so the hazard can be verified.',
        },
        { status: 400 },
      );
    }

    if (body.imageUrl && !imageUrl) {
      return NextResponse.json(
        {
          error: 'Invalid image',
          message: 'Photos must be provided as an image upload or a valid web URL.',
        },
        { status: 400 },
      );
    }

    const area = locationValidation.area;

    if (deviceId) {
      const duplicateWindow = new Date(Date.now() - HAZARD_DUPLICATE_WINDOW_MINUTES * 60 * 1000);
      const recentDuplicate = await prisma.hazardReport.findFirst({
        where: {
          deviceId,
          area,
          type,
          reportedAt: { gte: duplicateWindow },
        },
      });

      if (recentDuplicate) {
        return NextResponse.json(
          {
            error: 'Duplicate hazard',
            message: `You already reported this ${type.toLowerCase()} hazard in ${area} recently.`,
          },
          { status: 429 },
        );
      }
    }

    const hazard = await prisma.hazardReport.create({
      data: {
        type,
        description,
        streetName,
        houseNumber,
        areaName,
        imageUrl,
        area,
        city: FREETOWN_CITY,
        lat: locationValidation.lat,
        lng: locationValidation.lng,
        deviceId,
      },
    });

    return NextResponse.json({
      success: true,
      hazard,
      message: `Hazard report saved for ${area}. Authorities can now review it.`,
    });
  } catch (error) {
    console.error('POST /api/hazards error:', error);
    return NextResponse.json({ error: 'Failed to submit hazard report' }, { status: 500 });
  }
}
