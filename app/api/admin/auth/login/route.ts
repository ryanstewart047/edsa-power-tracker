import { NextRequest, NextResponse } from 'next/server';
import { attachAdminSessionCookie, loginAdmin } from '@/lib/auth';

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

    const loginResult = await loginAdmin(email, password);
    
    if (loginResult.error) {
      if (loginResult.error === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Email not found in our database.' },
          { status: 401 },
        );
      }
      
      if (loginResult.error === 'UNVERIFIED') {
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
    
    const admin = loginResult.admin!;

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
