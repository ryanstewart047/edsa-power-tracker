import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, listAllAdmins, createAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const admins = await listAllAdmins();
    return NextResponse.json({ admins });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      );
    }

    const result = await createAdminUser(email, password);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create admin' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      admin: result.admin,
    });
  } catch (error) {
    console.error('POST /api/admin/users error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 },
    );
  }
}
