import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, deleteAdminUser, updateAdminPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await getAdminSession();
    if (!admin || !admin.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Prevent self-deletion
    if (admin.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 },
      );
    }

    const result = await deleteAdminUser(params.id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await getAdminSession();
    if (!admin || !admin.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const password = typeof body.password === 'string' ? body.password : '';

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      );
    }

    const result = await updateAdminPassword(params.id, password);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/admin/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update admin password' },
      { status: 500 },
    );
  }
}
