import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, category, rating, area, message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('[Feedback Submission Received]:', {
      timestamp: new Date().toISOString(),
      name: name || 'Anonymous',
      email: email || 'Not provided',
      category: category || 'General',
      rating: rating || 5,
      area: area || 'Freetown',
      message: message.trim(),
    });

    // Try sending email if SMTP is configured in environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"EDSA Tracker Feedback" <${smtpUser}>`,
          to: 'support@itservicesfreetown.com',
          subject: `[Feedback - ${category || 'General'}] from ${name || 'User'} (${rating || 5} Stars)`,
          text: `EDSA Power Tracker Feedback\n\nName: ${name || 'Anonymous'}\nEmail: ${email || 'Not provided'}\nArea: ${area || 'Freetown'}\nRating: ${rating || 5}/5\nCategory: ${category || 'General'}\n\nMessage:\n${message.trim()}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
              <h2 style="color: #facc15; margin-bottom: 8px;">New EDSA Tracker Feedback</h2>
              <p style="color: #94a3b8; font-size: 14px;">Received: ${new Date().toLocaleString()}</p>
              <hr style="border: none; border-top: 1px solid #334155; margin: 16px 0;" />
              <p><strong>Name:</strong> ${name || 'Anonymous'}</p>
              <p><strong>Email:</strong> ${email || 'Not provided'}</p>
              <p><strong>Area:</strong> ${area || 'Freetown'}</p>
              <p><strong>Category:</strong> ${category || 'General'}</p>
              <p><strong>Rating:</strong> ${'⭐'.repeat(Number(rating) || 5)} (${rating || 5}/5)</p>
              <hr style="border: none; border-top: 1px solid #334155; margin: 16px 0;" />
              <h3 style="color: #f8fafc; margin-bottom: 8px;">Message:</h3>
              <p style="background: #1e293b; padding: 14px; border-radius: 8px; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message.trim()}</p>
            </div>
          `,
        });
        console.log('[Feedback Email Sent Successfully]');
      } catch (mailError) {
        console.warn('[Feedback Email Error - Non-fatal]:', mailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your feedback has been received.',
      refId: `FB-${Date.now().toString(36).toUpperCase()}`,
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback. Please try again or email us directly.' },
      { status: 500 }
    );
  }
}
