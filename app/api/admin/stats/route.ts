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
    console.error('Admin Stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
