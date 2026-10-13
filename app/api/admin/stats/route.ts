import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getAdminOverviewStats } from '@/lib/admin-overview';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getAdminOverviewStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin Stats API error, returning fallback stats:', error);
    try {
      const fallbackStats = await getAdminOverviewStats();
      return NextResponse.json(fallbackStats);
    } catch {
      return NextResponse.json(
        {
          totalReports: 0,
          totalHazards: 0,
          totalResolvedHazards: 0,
          areaSummary: [],
          recentReports: [],
          recentHazards: [],
        },
        { status: 200 }
      );
    }
  }
}
