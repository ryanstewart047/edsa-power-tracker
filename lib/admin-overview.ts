import { prisma } from '@/lib/prisma';
import { FREETOWN_AREAS, findAreaById } from '@/lib/areas';

export type AdminOverviewStats = {
  totalReports: number;
  totalHazards: number;
  totalResolvedHazards: number;
  areaSummary: {
    name: string;
    status: 'on' | 'out' | 'unknown';
    reportCount: number;
    confidence: number;
    lastUpdated: Date | null;
  }[];
  recentReports: {
    id: string;
    area: string;
    status: string;
    reportedAt: Date;
    deviceId: string | null;
    reporterLat: number | null;
    reporterLng: number | null;
  }[];
  recentHazards: {
    id: string;
    referenceCode?: string;
    type: string;
    description: string | null;
    streetName: string | null;
    houseNumber: string | null;
    areaName: string | null;
    imageUrl: string | null;
    area: string;
    reportedAt: Date;
    lat: number | null;
    lng: number | null;
    resolved: boolean;
    resolvedBy: string | null;
    resolvedAt: Date | null;
    meterNumber: string | null;
    contactPhone: string | null;
    incidentStatus?: string;
    severity?: string;
    assignedTo?: string | null;
    slaDueAt?: Date | null;
    resolutionNote?: string | null;
  }[];
};

function getDefaultAreaSummary() {
  return FREETOWN_AREAS.map((area) => ({
    name: area.region ? `${area.name} (${area.region})` : area.name,
    status: 'unknown' as const,
    reportCount: 0,
    confidence: 0,
    lastUpdated: null,
  }));
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  let allReports: any[] = [];
  let areaStatuses: any[] = [];
  let hazardReports: any[] = [];
  let totalReports = 0;
  let totalHazards = 0;
  let totalResolvedHazards = 0;

  try {
    const results = await Promise.allSettled([
      prisma.outageReport.findMany({
        orderBy: { reportedAt: 'desc' },
        take: 100,
      }),
      prisma.areaStatus.findMany(),
      prisma.hazardReport.findMany({
        orderBy: { reportedAt: 'desc' },
        take: 50,
      }),
      prisma.outageReport.count(),
      prisma.hazardReport.count({ where: { resolved: false } }),
      prisma.hazardReport.count({ where: { resolved: true } }),
    ]);

    if (results[0].status === 'fulfilled') allReports = results[0].value;
    if (results[1].status === 'fulfilled') areaStatuses = results[1].value;
    if (results[2].status === 'fulfilled') hazardReports = results[2].value as any[];
    if (results[3].status === 'fulfilled') totalReports = results[3].value;
    if (results[4].status === 'fulfilled') totalHazards = results[4].value;
    if (results[5].status === 'fulfilled') totalResolvedHazards = results[5].value;
  } catch (err) {
    console.warn('[Admin Overview] Prisma query warning, falling back to safe defaults:', err);
  }

  const areaStatusLookup = new Map(areaStatuses.map((status) => [status.area, status]));

  const areaSummary = [
    ...FREETOWN_AREAS.map((area) => ({
      id: area.id,
      name: area.name,
      region: area.region,
    })),
    ...areaStatuses
      .filter((status) => !FREETOWN_AREAS.some((area) => area.id === status.area || area.name === status.area))
      .map((status) => {
        const area = findAreaById(status.area);
        return {
          id: status.area,
          name: area?.name ?? status.area,
          region: area?.region ?? null,
        };
      }),
  ].map((area) => {
    const status = areaStatusLookup.get(area.id) ?? areaStatusLookup.get(area.name);
    return {
      name: area.region ? `${area.name} (${area.region})` : area.name,
      status: (status?.status || 'unknown') as 'on' | 'out' | 'unknown',
      reportCount: status?.reportCount || 0,
      confidence: status?.confidence || 0,
      lastUpdated: status?.lastUpdated || null,
    };
  });

  return {
    totalReports,
    totalHazards,
    totalResolvedHazards,
    areaSummary: areaSummary.length > 0 ? areaSummary : getDefaultAreaSummary(),
    recentReports: allReports,
    recentHazards: hazardReports,
  };
}
