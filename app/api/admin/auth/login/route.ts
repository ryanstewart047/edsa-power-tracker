import { NextRequest, NextResponse } from 'next/server';
import { attachAdminSessionCookie, loginAdmin, checkAdminEmailVerification } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const admin = await loginAdmin(email, password);
    if (!admin) {
      // Check if email exists but is not verified
      const emailStatus = await checkAdminEmailVerification(email);
      
      if (!emailStatus.exists) {
        return NextResponse.json(
          { error: 'Email not found in our database.' },
          { status: 401 },
        );
      }

      if (emailStatus.exists && !emailStatus.verified) {
        return NextResponse.json(
          { error: 'Please verify your email before logging in. Check your email for a verification link.' },
          { status: 401 },
        );
      }

      return NextResponse.json(
        { error: 'Invalid admin email or password.' },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      admin: { email: admin.email },
    });
    attachAdminSessionCookie(response, admin);
    return response;
  } catch (error) {
    console.error('POST /api/admin/auth/login error:', error);
    return NextResponse.json(
      { error: 'Failed to sign in.' },
      { status: 500 },
    );
  }
}
