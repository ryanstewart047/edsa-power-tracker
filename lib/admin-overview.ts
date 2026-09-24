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
  }[];
};

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const [allReports, areaStatuses, hazardReports, totalReports, totalHazards, totalResolvedHazards] = await Promise.all([
    prisma.outageReport.findMany({
      orderBy: { reportedAt: 'desc' },
      take: 100,
    }),
    prisma.areaStatus.findMany(),
    prisma.hazardReport.findMany({
      // Fetch both resolved and unresolved so admins can see the resolution history
      orderBy: { reportedAt: 'desc' },
      take: 50,
    }),
    prisma.outageReport.count(),
    prisma.hazardReport.count({ where: { resolved: false } }), // Count only unresolved
    prisma.hazardReport.count({ where: { resolved: true } }),  // Count resolved
  ]);

  const areaStatusLookup = new Map(areaStatuses.map((status) => [status.area, status]));

  return {
    totalReports,
    totalHazards,
    totalResolvedHazards,
    areaSummary: [
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
      // Older Freetown reports used names; nationwide reports use stable location IDs.
      const status = areaStatusLookup.get(area.id) ?? areaStatusLookup.get(area.name);
      return {
        name: area.region ? `${area.name} (${area.region})` : area.name,
        status: (status?.status || 'unknown') as 'on' | 'out' | 'unknown',
        reportCount: status?.reportCount || 0,
        confidence: status?.confidence || 0,
        lastUpdated: status?.lastUpdated || null,
      };
    }),
    recentReports: allReports,
    recentHazards: hazardReports,
  };
}
