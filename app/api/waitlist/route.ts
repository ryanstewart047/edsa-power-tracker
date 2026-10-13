import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const PLAY_STORE_LINK =
  process.env.PLAY_STORE_URL ||
  'https://play.google.com/store/apps/details?id=com.edsa.powertracker';

const APP_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://edsa-power-tracker.vercel.app';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, source } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase().slice(0, 320);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Upsert — if already exists just resend the link
    const existing = await prisma.waitlistSignup.findUnique({ where: { email: cleanEmail } });

    if (!existing) {
      await prisma.waitlistSignup.create({
        data: {
          email: cleanEmail,
          name: typeof name === 'string' ? name.trim().slice(0, 120) || null : null,
          source: typeof source === 'string' ? source.trim().slice(0, 80) || 'join-page' : 'join-page',
        },
      });
    }

    // Send confirmation email with the Play Store link
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: smtpUser, pass: smtpPass },
        });

        const displayName = (typeof name === 'string' && name.trim()) ? name.trim() : 'there';

        await transporter.sendMail({
          from: `"EDSA Power Tracker" <${smtpUser}>`,
          to: cleanEmail,
          subject: '⚡ Your EDSA Power Tracker Download Link',
          text: `Hi ${displayName},\n\nThank you for signing up! You can now download the EDSA Power Tracker app:\n\n${PLAY_STORE_LINK}\n\nIf you have any trouble, reply to this email and we'll help you.\n\nBest,\nEDSA Power Tracker Team`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020305;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020305;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2607d5,#1d05aa);padding:36px 32px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">⚡</div>
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px;">EDSA Power Tracker</h1>
              <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">Real-time electricity for Freetown</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="color:#e2e8f0;font-size:16px;margin:0 0 12px;">Hi ${displayName},</p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px;">
                Thank you for signing up! Your download link is ready. Tap the button below to install the EDSA Power Tracker on your Android device.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${PLAY_STORE_LINK}"
                       style="display:inline-block;background:#2607d5;color:#ffffff;text-decoration:none;font-weight:900;font-size:15px;padding:16px 36px;border-radius:14px;letter-spacing:0.3px;">
                      📲 Download on Google Play
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#64748b;font-size:12px;text-align:center;margin:20px 0 0;">
                Or copy this link: <a href="${PLAY_STORE_LINK}" style="color:#6d8ef0;">${PLAY_STORE_LINK}</a>
              </p>
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:32px 0;" />
              <p style="color:#475569;font-size:13px;line-height:1.6;margin:0;">
                Having trouble? Just reply to this email and we'll help you get set up.<br>
                — The EDSA Power Tracker Team
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0a0e1a;padding:20px 32px;text-align:center;">
              <p style="color:#334155;font-size:11px;margin:0;">
                You're receiving this because you signed up at
                <a href="${APP_SITE_URL}" style="color:#4466bb;">${APP_SITE_URL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        });

        // Mark as notified
        await prisma.waitlistSignup.update({
          where: { email: cleanEmail },
          data: { notified: true },
        });
      } catch (mailError) {
        console.warn('[Waitlist Email Error - Non-fatal]:', mailError);
      }
    }

    return NextResponse.json({
      success: true,
      alreadyRegistered: !!existing,
      message: existing
        ? 'You were already on the list — we just sent your link again!'
        : 'You\'re in! Check your inbox for the download link.',
    });
  } catch (error) {
    console.error('[Waitlist signup error]:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// Admin read endpoint (protected by secret header)
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const signups = await prisma.waitlistSignup.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, source: true, notified: true, createdAt: true },
  });

  return NextResponse.json({ total: signups.length, signups });
}
