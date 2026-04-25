import { NextRequest, NextResponse } from 'next/server';
import { createPasswordReset } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 },
      );
    }

    const origin = new URL(request.url).origin;
    const result = await createPasswordReset(email, origin);

    return NextResponse.json({
      success: true,
      message: result.emailSent
        ? 'If the email exists, a password reset link has been sent.'
        : 'If the email exists, a password reset request has been created.',
      previewResetUrl: result.previewResetUrl,
      emailConfigured: result.emailSent,
    });
  } catch (error) {
    console.error('POST /api/admin/auth/forgot-password error:', error);
    return NextResponse.json(
      { error: 'Failed to create password reset request.' },
      { status: 500 },
    );
  }
}
