import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export interface BulletinItem {
  id: string;
  type: 'official' | 'maintenance' | 'community' | 'hazard';
  title: string;
  message: string;
  area: string;
  author: string;
  timestamp: string;
  verified?: boolean;
}

/**
 * Normalizes a community name for exact matching and storage partition.
 * e.g. "Lumley" -> "lumley", "Aberdeen Creek" -> "aberdeen_creek"
 */
function normalizeCommunity(areaName: string): string {
  if (!areaName || !areaName.trim()) return 'general';
  return areaName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
}

// Memory fallback cache per normalized community (ensures zero downtime even during DB blips)
const memoryCommunityCache: Record<string, BulletinItem[]> = {};

/**
 * Load persisted community notes from database for an exact community
 */
async function getPersistedCommunityNotes(normalizedCommunity: string): Promise<BulletinItem[]> {
  const settingKey = `bulletin_area_${normalizedCommunity}`;
  try {
    const record = await prisma.appSetting.findUnique({
      where: { key: settingKey }
    });

    if (record && record.value) {
      const parsed = JSON.parse(record.value);
      if (Array.isArray(parsed)) {
        memoryCommunityCache[normalizedCommunity] = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`Failed to read community notes from DB for ${normalizedCommunity}:`, err);
  }

  return memoryCommunityCache[normalizedCommunity] || [];
}

/**
 * Save community notes to database for an exact community
 */
async function saveCommunityNotes(normalizedCommunity: string, notes: BulletinItem[]): Promise<boolean> {
  memoryCommunityCache[normalizedCommunity] = notes;
  const settingKey = `bulletin_area_${normalizedCommunity}`;

  try {
    await prisma.appSetting.upsert({
      where: { key: settingKey },
      update: {
        value: JSON.stringify(notes),
        updatedAt: new Date(),
        updatedBy: 'community_sync'
      },
      create: {
        key: settingKey,
        value: JSON.stringify(notes),
        updatedAt: new Date(),
        updatedBy: 'community_sync'
      }
    });
    return true;
  } catch (err) {
    console.warn(`Failed to persist community notes for ${normalizedCommunity}:`, err);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const area = req.nextUrl.searchParams.get('area') || 'Freetown';
    const cleanArea = area.trim();
    const normalized = normalizeCommunity(cleanArea);

    // 1. Fetch official EDSA central announcements (filtered if targeted)
    let officialNotices: BulletinItem[] = [];
    try {
      const announcements = await prisma.announcement.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      officialNotices = announcements.map((a) => ({
        id: `ann-${a.id}`,
        type: 'official' as const,
        title: a.title,
        message: a.message,
        area: 'EDSA Grid Operations',
        author: 'EDSA Central Desk',
        timestamp: a.createdAt.toISOString(),
        verified: true
      }));
    } catch {
      // Graceful fallback
    }

    // 2. Fetch scheduled maintenance outages targeted to this area or all areas
    const maintenanceNotices: BulletinItem[] = [];
    try {
      const scheduled = await prisma.scheduledOutage.findMany({
        where: {
          active: true,
          endsAt: { gte: new Date() }
        },
        orderBy: { startsAt: 'asc' },
        take: 3
      });

      scheduled.forEach((s) => {
        // Show if outage explicitly targets this community or is system-wide
        const isTargeted =
          !s.area ||
          s.area.toLowerCase() === 'all areas' ||
          normalizeCommunity(s.area) === normalized;

        if (isTargeted) {
          maintenanceNotices.push({
            id: `sch-${s.id}`,
            type: 'maintenance',
            title: s.title,
            message: s.message,
            area: s.area || cleanArea,
            author: 'EDSA Maintenance',
            timestamp: s.createdAt.toISOString(),
            verified: true
          });
        }
      });
    } catch {
      // Graceful fallback
    }

    // 3. Fetch STRICTLY ISOLATED community notes for this exact community only!
    const communityNotes = await getPersistedCommunityNotes(normalized);

    // Filter strictly: only notes whose normalized area equals THIS exact community
    const exactCommunityNotes = communityNotes.filter(
      (item) => normalizeCommunity(item.area) === normalized
    );

    // Combine: official notices + exact community neighbor notes
    const combined: BulletinItem[] = [
      ...officialNotices,
      ...maintenanceNotices,
      ...exactCommunityNotes
    ];

    // Sort newest first
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      area: cleanArea,
      normalizedCommunity: normalized,
      communityNotesCount: exactCommunityNotes.length,
      bulletins: combined
    });
  } catch (err) {
    console.error('Error fetching community bulletin:', err);
    return NextResponse.json(
      {
        success: false,
        bulletins: []
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, area, author } = body;

    if (!message || message.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Message content is required (min 3 characters).' },
        { status: 400 }
      );
    }

    const cleanArea = (area && area.trim()) || 'Freetown';
    const normalized = normalizeCommunity(cleanArea);

    const newBulletin: BulletinItem = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'community',
      title: title?.trim() || `Field Report (${cleanArea})`,
      message: message.trim(),
      area: cleanArea,
      author: author?.trim() || 'Community Resident',
      timestamp: new Date().toISOString(),
      verified: false
    };

    // Load current community notes for this exact community
    const currentNotes = await getPersistedCommunityNotes(normalized);

    // Prepend new note and cap at 100 notes per community
    const updatedNotes = [newBulletin, ...currentNotes].slice(0, 100);

    // Persist permanently to PostgreSQL
    await saveCommunityNotes(normalized, updatedNotes);

    return NextResponse.json({
      success: true,
      bulletin: newBulletin,
      communityNotesCount: updatedNotes.length
    });
  } catch (err) {
    console.error('Error posting community bulletin note:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to post community bulletin note.' },
      { status: 500 }
    );
  }
}
