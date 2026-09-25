import { NextResponse } from 'next/server';
import { getDirectVendingReadiness } from '@/lib/directVending';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getDirectVendingReadiness());
}

export async function POST() {
  const readiness = getDirectVendingReadiness();
  return NextResponse.json(
    {
      error: 'Direct vending is not available yet',
      message: readiness.message,
    },
    { status: 503 },
  );
}
