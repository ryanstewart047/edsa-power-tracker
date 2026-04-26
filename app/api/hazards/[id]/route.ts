import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hazardId = params.id?.trim();

    if (!hazardId) {
      return NextResponse.json({ error: 'Hazard ID is required.' }, { status: 400 });
    }

    const existingHazard = await prisma.hazardReport.findUnique({
      where: { id: hazardId },
      select: { id: true, type: true, area: true, areaName: true },
    });

    if (!existingHazard) {
      return NextResponse.json({ error: 'Hazard report not found.' }, { status: 404 });
    }

    // Mark as resolved instead of deleting
    const updated = await prisma.hazardReport.update({
      where: { id: hazardId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
      select: { id: true, type: true, area: true, areaName: true, resolved: true, resolvedAt: true },
    });

    return NextResponse.json({
      success: true,
      message: `${existingHazard.type} in ${existingHazard.areaName || existingHazard.area} marked as resolved.`,
      hazard: updated,
    });
  } catch (error) {
    console.error('DELETE /api/hazards/[id] error:', error);
    return NextResponse.json({ error: 'Failed to resolve hazard report.' }, { status: 500 });
  }
}
