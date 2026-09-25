import { prisma } from '@/lib/prisma';

export const FEATURE_FLAGS = {
  powerReporting: { label: 'Power reporting', defaultValue: true },
  hazardReporting: { label: 'Hazard reporting', defaultValue: true },
} as const;

export type FeatureKey = keyof typeof FEATURE_FLAGS;

export async function getFeatureFlags() {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: Object.keys(FEATURE_FLAGS) } },
  });
  const saved = new Map(settings.map((setting) => [setting.key, setting.value === 'true']));

  return Object.fromEntries(
    Object.entries(FEATURE_FLAGS).map(([key, definition]) => [key, saved.get(key) ?? definition.defaultValue]),
  ) as Record<FeatureKey, boolean>;
}

export async function isFeatureEnabled(key: FeatureKey) {
  return (await getFeatureFlags())[key];
}

export async function getActiveAnnouncement() {
  return prisma.announcement.findFirst({
    where: {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, message: true, createdAt: true },
  });
}

export async function auditAdminAction(adminEmail: string, action: string, detail?: string) {
  return prisma.adminAuditLog.create({ data: { adminEmail, action, detail } });
}
