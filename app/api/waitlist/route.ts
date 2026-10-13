import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { saveOptIn, getAllOptIns, markOptInNotified } from '@/lib/optInStorage';

const PLAY_STORE_LINK =
  process.env.PLAY_STORE_URL ||
  'https://play.google.com/store/apps/details?id=com.edsa.powertracker';

const PLAY_TESTING_OPTIN_LINK =
  process.env.PLAY_TESTING_OPTIN_URL ||
  'https://play.google.com/apps/testing/com.edsa.powertracker';

const APP_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://edsa-power-tracker.vercel.app';
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'itservicesfreetown@gmail.com';

function createEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpUser = process.env.SMTP_USER || 'itservicesfreetown@gmail.com';
  const smtpPass = process.env.SMTP_PASS || 'sxue cusg zikn qfzk';

  if (!smtpHost || !smtpUser || !smtpPass) return null;

  return {
    transporter: nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    }),
    smtpUser,
  };
}

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

    // 1. Save into the dedicated opt-in storage immediately
    const { isNew, record } = await saveOptIn(cleanEmail, name, source || 'join-page');

    console.log('[Closed Testing Opt-In Captured]:', {
      email: cleanEmail,
      name: record.name,
      isNew,
      timestamp: record.createdAt,
    });

    // 2. Dispatch emails via SMTP
    const mailConfig = createEmailTransporter();

    if (mailConfig) {
      const { transporter, smtpUser } = mailConfig;
      const displayName = (record.name && record.name.trim()) ? record.name.trim() : 'there';

      // (A) AUTO NOTIFICATION EMAIL TO THE USER (Tester)
      const userMailPromise = transporter.sendMail({
        from: `"EDSA Power Tracker" <${smtpUser}>`,
        to: cleanEmail,
        subject: '⚡ Your EDSA Power Tracker App Download & Testing Link',
        text: `Hi ${displayName},\n\nThank you for opting in to test the EDSA Power Tracker app for Sierra Leone!\n\nHere are your access links:\n\n1. Accept Closed Testing Invite:\n${PLAY_TESTING_OPTIN_LINK}\n\n2. Download on Google Play:\n${PLAY_STORE_LINK}\n\nIf you see "Item not available", ensure you are signed into Google Play with ${cleanEmail} and tap the invite link first.\n\nBest regards,\nEDSA Power Tracker Team`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020305;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020305;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#0f172a;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2607d5,#16038a);padding:36px 32px;text-align:center;">
              <div style="font-size:38px;margin-bottom:8px;">⚡</div>
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px;">EDSA Power Tracker</h1>
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;font-weight:bold;">Sierra Leone Prepaid & Outage Companion</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="color:#e2e8f0;font-size:16px;margin:0 0 12px;font-weight:bold;">Hi ${displayName},</p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px;">
                Thank you for joining our testing release. You now have direct access to download and test the EDSA Power Tracker app on your Android device.
              </p>

              <!-- Step 1 & 2 Instructions -->
              <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:28px;">
                <p style="color:#60a5fa;font-size:12px;font-weight:bold;text-transform:uppercase;margin:0 0 10px;letter-spacing:1px;">Step 1: Join Testing Program</p>
                <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0 0 14px;">
                  Tap the button below and confirm <strong>&quot;Become a tester&quot;</strong> with your Google Play account (<strong>${cleanEmail}</strong>):
                </p>
                <div style="text-align:center;">
                  <a href="${PLAY_TESTING_OPTIN_LINK}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:12px;">
                    👉 Accept Testing Invite
                  </a>
                </div>
              </div>

              <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:28px;">
                <p style="color:#34d399;font-size:12px;font-weight:bold;text-transform:uppercase;margin:0 0 10px;letter-spacing:1px;">Step 2: Download the App</p>
                <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0 0 14px;">
                  Once opted in, download and install the app directly from the Google Play Store:
                </p>
                <div style="text-align:center;">
                  <a href="${PLAY_STORE_LINK}" style="display:inline-block;background:#2607d5;color:#ffffff;text-decoration:none;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;">
                    📲 Download on Google Play
                  </a>
                </div>
              </div>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:28px 0;" />
              <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0;">
                If Google Play shows &quot;Item isn&apos;t available in your country&quot;, make sure you completed Step 1 using <strong>${cleanEmail}</strong>.<br><br>
                Need help? Simply reply directly to this email!
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0a0e1a;padding:20px 32px;text-align:center;">
              <p style="color:#475569;font-size:11px;margin:0;">
                EDSA Power Tracker • Freetown, Sierra Leone •
                <a href="${APP_SITE_URL}" style="color:#60a5fa;text-decoration:none;">${APP_SITE_URL}</a>
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

      // (B) IMMEDIATE ALERT EMAIL TO ADMIN
      const adminMailPromise = transporter.sendMail({
        from: `"EDSA System Alert" <${smtpUser}>`,
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `⚡ [Closed Testing Opt-In] New Tester: ${cleanEmail}`,
        text: `New Closed Tester Opt-In Captured!\n\nEmail: ${cleanEmail}\nName: ${record.name || 'Not provided'}\nSource: ${record.source}\nTime: ${record.createdAt}\n\nThe download and testing links were automatically sent to this tester.\nEnsure this email is included in your Google Play Console Closed Testing track.`,
        html: `
<div style="font-family:sans-serif;max-width:560px;padding:24px;background:#0f172a;color:#f8fafc;border-radius:16px;border:1px solid #334155;">
  <h2 style="color:#38bdf8;margin-top:0;">⚡ New Closed Tester Captured!</h2>
  <p style="color:#94a3b8;font-size:14px;">A user just entered their email on the testing opt-in page.</p>
  <div style="background:#1e293b;padding:16px;border-radius:12px;margin:16px 0;">
    <p style="margin:4px 0;"><strong>Email:</strong> <span style="color:#38bdf8;font-family:monospace;">${cleanEmail}</span></p>
    <p style="margin:4px 0;"><strong>Name:</strong> ${record.name || 'Not provided'}</p>
    <p style="margin:4px 0;"><strong>Status:</strong> ${isNew ? 'New Sign-up' : 'Re-sent download link'}</p>
    <p style="margin:4px 0;"><strong>Timestamp:</strong> ${new Date(record.createdAt).toLocaleString()}</p>
  </div>
  <p style="font-size:12px;color:#94a3b8;">
    The invite instructions and Google Play link were automatically emailed to the user.<br>
    View all signups anytime in the <a href="${APP_SITE_URL}/admin/waitlist" style="color:#38bdf8;">Admin Waitlist Console</a>.
  </p>
</div>
        `,
      });

      try {
        await Promise.all([userMailPromise, adminMailPromise]);
        await markOptInNotified(cleanEmail);
      } catch (mailErr) {
        console.warn('[Opt-In Email Warning - Non-fatal]:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      alreadyRegistered: !isNew,
      message: isNew
        ? 'Success! Your download link has been sent to your email.'
        : 'Welcome back! We have resent the download link to your email.',
    });
  } catch (error) {
    console.error('[Waitlist API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to process opt-in. Please try again.' },
      { status: 500 }
    );
  }
}

// GET: Admin list endpoint
export async function GET() {
  try {
    const signups = await getAllOptIns();
    return NextResponse.json({ total: signups.length, signups });
  } catch (error) {
    console.error('[Waitlist GET Error]:', error);
    return NextResponse.json({ total: 0, signups: [] });
  }
}
