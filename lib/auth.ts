import { randomBytes, createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE_NAME = 'edsa_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_KEY_LENGTH = 64;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 60;

type SessionPayload = {
  adminId: string;
  email: string;
  exp: number;
  version: number;
};

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  updatedAt: Date;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured.');
  }

  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signValue(value: string) {
  return createHmac('sha256', getAuthSecret()).update(value).digest('base64url');
}

function parseSignedPayload(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.adminId || !payload.email || !payload.exp || !payload.version) {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function createSessionToken(admin: AuthenticatedAdmin) {
  const payload: SessionPayload = {
    adminId: admin.id,
    email: admin.email,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    version: admin.updatedAt.getTime(),
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${signValue(encodedPayload)}`;
}

function hashToken(token: string) {
  return createHmac('sha256', getAuthSecret()).update(token).digest('hex');
}

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(':');
  if (!salt || !expectedHash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(derivedKey, 'hex');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

async function sendResetEmail(to: string, resetUrl: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    return { sent: false };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: false, // Use TLS (not SSL) for port 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpUser,
      to,
      subject: 'Reset your EDSA admin password',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h2>Reset your EDSA admin password</h2>
          <p>We received a request to reset your admin password.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#facc15;color:#111827;text-decoration:none;border-radius:12px;font-weight:700;">Reset password</a></p>
          <p>If you did not request this, you can ignore this message.</p>
          <p>This link expires in 1 hour.</p>
        </div>
      `,
      text: `Reset your EDSA admin password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    });

    return { sent: true };
  } catch (error) {
    console.error('Failed to send reset email:', error);
    return { sent: false };
  }
}

export async function ensureBootstrapAdminUser() {
  const existingAdminCount = await prisma.adminUser.count();
  if (existingAdminCount > 0) {
    return;
  }

  const email = process.env.ADMIN_EMAIL_EDSA;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return;
  }

  await prisma.adminUser.create({
    data: {
      email: normalizeAdminEmail(email),
      passwordHash: hashPassword(password),
      isSuperAdmin: true,
    },
  });
}

export async function loginAdmin(email: string, password: string) {
  await ensureBootstrapAdminUser();

  const normalizedEmail = normalizeAdminEmail(email);
  const admin = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, isSuperAdmin: true, passwordHash: true, updatedAt: true },
  });

  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    isSuperAdmin: admin.isSuperAdmin,
    updatedAt: admin.updatedAt,
  } satisfies AuthenticatedAdmin;
}

export async function createPasswordReset(email: string, origin: string) {
  await ensureBootstrapAdminUser();

  const normalizedEmail = normalizeAdminEmail(email);
  const admin = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  if (!admin) {
    return {
      success: true,
      emailSent: false,
      previewResetUrl: null,
    };
  }

  await prisma.passwordResetToken.deleteMany({
    where: {
      adminId: admin.id,
      OR: [
        { expiresAt: { lte: new Date() } },
        { usedAt: null },
      ],
    },
  });

  const rawToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      adminId: admin.id,
      tokenHash: hashToken(rawToken),
      expiresAt,
    },
  });

  const resetUrl = `${origin}/admin/reset-password?token=${rawToken}`;
  const emailResult = await sendResetEmail(admin.email, resetUrl).catch((error) => {
    console.error('Failed to send reset email', error);
    return { sent: false };
  });

  return {
    success: true,
    emailSent: emailResult.sent,
    previewResetUrl: process.env.NODE_ENV === 'production' ? null : resetUrl,
  };
}

export async function resetAdminPassword(token: string, nextPassword: string) {
  const tokenHash = hashToken(token);
  const now = new Date();

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      admin: {
        select: { id: true },
      },
    },
  });

  if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt <= now) {
    return { success: false as const, error: 'This reset link is invalid or has expired.' };
  }

  const passwordHash = hashPassword(nextPassword);

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: resetRecord.admin.id },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        adminId: resetRecord.admin.id,
        id: { not: resetRecord.id },
      },
    }),
  ]);

  return { success: true as const };
}

export function attachAdminSessionCookie(response: NextResponse, admin: AuthenticatedAdmin) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: createSessionToken(admin),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getAdminSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = parseSignedPayload(token);
  if (!payload) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.adminId },
    select: { id: true, email: true, isSuperAdmin: true, updatedAt: true },
  });

  if (!admin || admin.email !== payload.email || admin.updatedAt.getTime() !== payload.version) {
    return null;
  }

  return admin satisfies AuthenticatedAdmin;
}

export async function requireAdminSession() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect('/admin/login');
  }

  return admin;
}

// Admin management functions
export async function listAllAdmins() {
  return prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      isSuperAdmin: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createAdminUser(email: string, password: string, isSuperAdmin: boolean = false) {
  const normalizedEmail = normalizeAdminEmail(email);
  
  // Check if admin already exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });
  
  if (existingAdmin) {
    return { success: false, error: 'Admin with this email already exists' };
  }

  const passwordHash = hashPassword(password);
  
  try {
    const admin = await prisma.adminUser.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        isSuperAdmin,
      },
      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
        createdAt: true,
      },
    });

    return { success: true, admin };
  } catch (error) {
    console.error('Failed to create admin:', error);
    return { success: false, error: 'Failed to create admin user' };
  }
}

export async function deleteAdminUser(adminId: string) {
  try {
    await prisma.adminUser.delete({
      where: { id: adminId },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to delete admin:', error);
    return { success: false, error: 'Failed to delete admin user' };
  }
}

export async function updateAdminPassword(adminId: string, newPassword: string) {
  const passwordHash = hashPassword(newPassword);
  
  try {
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { passwordHash },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to update admin password:', error);
    return { success: false, error: 'Failed to update admin password' };
  }
}
