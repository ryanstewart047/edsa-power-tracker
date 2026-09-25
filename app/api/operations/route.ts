import { NextResponse } from 'next/server';
import { getActiveAnnouncement, getFeatureFlags } from '@/lib/operations';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [flags, announcement] = await Promise.all([getFeatureFlags(), getActiveAnnouncement()]);
  return NextResponse.json({ flags, announcement });
}
