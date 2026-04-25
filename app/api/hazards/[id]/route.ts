import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
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

    await prisma.hazardReport.delete({
      where: { id: hazardId },
    });

    return NextResponse.json({
      success: true,
      message: `${existingHazard.type} in ${existingHazard.areaName || existingHazard.area} marked as resolved.`,
    });
  } catch (error) {
    console.error('DELETE /api/hazards/[id] error:', error);
    return NextResponse.json({ error: 'Failed to resolve hazard report.' }, { status: 500 });
  }
}
