import { NextRequest, NextResponse } from 'next/server';
import { resetAdminPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token || !password || password.length < 8) {
      return NextResponse.json(
        { error: 'A valid token and a password with at least 8 characters are required.' },
        { status: 400 },
      );
    }

    const result = await resetAdminPassword(token, password);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('POST /api/admin/auth/reset-password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password.' },
      { status: 500 },
    );
  }
}
