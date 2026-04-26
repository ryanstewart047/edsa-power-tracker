import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminEmailToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token : '';

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 },
      );
    }

    const result = await verifyAdminEmailToken(token);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now login.',
    });
  } catch (error) {
    console.error('POST /api/admin/verify-email error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 },
    );
  }
}
