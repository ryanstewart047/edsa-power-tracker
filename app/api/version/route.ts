import { NextResponse } from 'next/server';
import { CURRENT_RELEASE } from '@/lib/versionConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(CURRENT_RELEASE, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
