import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get('deviceId');
  if (!deviceId?.startsWith('dev_') || deviceId.length > 100) {
    return NextResponse.json({ reports: [] });
  }
  const reports = await prisma.hazardReport.findMany({
    where: { deviceId },
    orderBy: { reportedAt: 'desc' },
    take: 20,
    select: { id: true, referenceCode: true, type: true, area: true, areaName: true, reportedAt: true, incidentStatus: true, severity: true, statusUpdatedAt: true, resolutionNote: true, resolutionImageUrl: true },
  });
  return NextResponse.json({ reports });
}
