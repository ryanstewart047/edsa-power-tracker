import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FREETOWN_AREAS } from '@/lib/areas';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [allReports, areaStatuses, hazardReports] = await Promise.all([
      prisma.outageReport.findMany({
        orderBy: { reportedAt: 'desc' },
        take: 100,
      }),
      prisma.areaStatus.findMany(),
      prisma.hazardReport.findMany({
        orderBy: { reportedAt: 'desc' },
        take: 50,
      }),
    ]);

    const stats = {
      totalReports: await prisma.outageReport.count(),
      totalHazards: await prisma.hazardReport.count(),
      areaSummary: FREETOWN_AREAS.map(area => {
        const status = areaStatuses.find(s => s.area === area.name);
        return {
          name: area.name,
          status: status?.status || 'unknown',
          reportCount: status?.reportCount || 0,
          confidence: status?.confidence || 0,
          lastUpdated: status?.lastUpdated || null,
        };
      }),
      recentReports: allReports,
      recentHazards: hazardReports,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin Stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
