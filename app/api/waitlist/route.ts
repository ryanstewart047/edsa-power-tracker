import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { saveOptIn, getAllOptIns, markOptInNotified } from '@/lib/optInStorage';

const PLAY_STORE_LINK =
  process.env.PLAY_STORE_URL ||
  'https://play.google.com/store/apps/details?id=com.bridgetech.edsapowertracker';

const PLAY_TESTING_OPTIN_LINK =
  process.env.PLAY_TESTING_OPTIN_URL ||
  'https://play.google.com/apps/testing/com.bridgetech.edsapowertracker';

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
        subject: '⚡ EDSA Power Tracker Testing Invite (Please allow 15 min for activation)',
        text: `Hi ${displayName},\n\nThank you for opting in to test the EDSA Power Tracker app for Sierra Leone!\n\nIMPORTANT: Please wait at least 15 minutes before opening the links below. Our team is currently adding your email (${cleanEmail}) to the Google Play Closed Testing list. Google takes about 15 minutes to activate new tester accounts.\n\nAfter 15 minutes, use these links:\n\n1. Join on Web (Accept Invite):\n${PLAY_TESTING_OPTIN_LINK}\n\n2. Join on Android (Download from Play Store):\n${PLAY_STORE_LINK}\n\nIf you see "Item not available" or "App not found", please wait a few more minutes and ensure you are logged into Google Play with ${cleanEmail}.\n\nBest regards,\nEDSA Power Tracker Team`,
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
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;font-weight:bold;">Sierra Leone Closed Testing Program</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="color:#e2e8f0;font-size:16px;margin:0 0 12px;font-weight:bold;">Hi ${displayName},</p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px;">
                Thank you for opting in to test the EDSA Power Tracker! Your email has been received by our testing team.
              </p>

              <!-- 15-Minute Warning Banner -->
              <div style="background:#451a03;border:1.5px solid #f97316;border-radius:16px;padding:18px;margin-bottom:24px;">
                <p style="color:#fb923c;font-size:12px;font-weight:900;text-transform:uppercase;margin:0 0 6px;letter-spacing:0.8px;">
                  ⏱️ Please wait at least 15 minutes before opening
                </p>
                <p style="color:#fdba74;font-size:13px;line-height:1.6;margin:0;">
                  Our team is manually adding your email (<strong>${cleanEmail}</strong>) to the Google Play Console tester list right now. Google takes about <strong>15 minutes</strong> to sync and activate new testers.
                </p>
              </div>

              <!-- Step 1 & 2 Instructions -->
              <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:20px;">
                <p style="color:#60a5fa;font-size:12px;font-weight:bold;text-transform:uppercase;margin:0 0 8px;letter-spacing:1px;">Step 1: Join on Web (Accept Invite)</p>
                <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0 0 14px;">
                  After 15 minutes, click below with your Google account (<strong>${cleanEmail}</strong>) and tap <strong>&quot;Become a tester&quot;</strong>:
                </p>
                <div style="text-align:center;">
                  <a href="${PLAY_TESTING_OPTIN_LINK}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:12px;">
                    👉 Join on Web (Accept Invite)
                  </a>
                </div>
              </div>

              <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:24px;">
                <p style="color:#34d399;font-size:12px;font-weight:bold;text-transform:uppercase;margin:0 0 8px;letter-spacing:1px;">Step 2: Join on Android (Download App)</p>
                <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0 0 14px;">
                  Once opted in, tap below to install the app directly from Google Play:
                </p>
                <div style="text-align:center;">
                  <a href="${PLAY_STORE_LINK}" style="display:inline-block;background:#2607d5;color:#ffffff;text-decoration:none;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;">
                    📲 Join on Android (Google Play)
                  </a>
                </div>
              </div>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;" />
              <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0;">
                If Google Play shows &quot;Item isn&apos;t available in your country&quot; or &quot;App not found&quot;, please wait a few more minutes for Google&apos;s servers to sync, and ensure you are logged into Google Play with <strong>${cleanEmail}</strong>.<br><br>
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
        subject: `⚡ [ACTION REQUIRED: Add Tester in Play Console] ${cleanEmail}`,
        text: `ACTION REQUIRED: Add this tester to your Google Play Console Closed Testing track now!\n\nTester Email: ${cleanEmail}\nTester Name: ${record.name || 'Not provided'}\nSource: ${record.source}\nTime: ${record.createdAt}\n\nNote: The user was told to wait 15 minutes while you add them to the closed tester list in Google Play Console.`,
        html: `
<div style="font-family:sans-serif;max-width:560px;padding:24px;background:#0f172a;color:#f8fafc;border-radius:16px;border:1px solid #334155;">
  <div style="background:#7c2d12;border:1px solid #ea580c;padding:12px 16px;border-radius:10px;margin-bottom:16px;">
    <h3 style="color:#fdba74;margin:0;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">⚠️ ACTION REQUIRED in Google Play Console</h3>
    <p style="color:#fed7aa;font-size:12px;margin:4px 0 0;">Add this tester's email to your Closed Testing track right now!</p>
  </div>
  <h2 style="color:#38bdf8;margin-top:0;">⚡ New Closed Tester Opt-In Captured</h2>
  <div style="background:#1e293b;padding:16px;border-radius:12px;margin:16px 0;">
    <p style="margin:4px 0;"><strong>Tester Email:</strong> <span style="color:#38bdf8;font-family:monospace;font-weight:bold;font-size:15px;">${cleanEmail}</span></p>
    <p style="margin:4px 0;"><strong>Tester Name:</strong> ${record.name || 'Not provided'}</p>
    <p style="margin:4px 0;"><strong>Status:</strong> ${isNew ? 'New Sign-up' : 'Re-sent testing links'}</p>
    <p style="margin:4px 0;"><strong>Timestamp:</strong> ${new Date(record.createdAt).toLocaleString()}</p>
  </div>
  <p style="font-size:13px;color:#cbd5e1;line-height:1.6;">
    The user was automatically emailed the testing links and advised to <strong>wait at least 15 minutes</strong> for you to add their email to the Google Play Console list.
  </p>
  <div style="margin-top:20px;padding-top:16px;border-top:1px solid #334155;">
    <a href="https://play.google.com/console" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;padding:10px 20px;border-radius:10px;">
      Open Google Play Console
    </a>
    <a href="${APP_SITE_URL}/admin/waitlist" style="display:inline-block;background:#334155;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;padding:10px 20px;border-radius:10px;margin-left:10px;">
      View All in Admin Waitlist
    </a>
  </div>
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
        ? 'Success! Your email has been captured. Please allow 15 minutes for your access to be activated in Google Play.'
        : 'Welcome back! We have resent your testing links. Please allow 15 minutes for access activation.',
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
