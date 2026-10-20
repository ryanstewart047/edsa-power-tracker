import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export interface BulletinItem {
  id: string;
  type: 'official' | 'maintenance' | 'community' | 'hazard';
  title: string;
  message: string;
  area?: string;
  author: string;
  timestamp: string;
  verified?: boolean;
}

// In-memory fallback / cache for community field observations
let communityBulletinsCache: BulletinItem[] = [
  {
    id: 'bulletin-init-1',
    type: 'official',
    title: 'Bumbuna Hydro Grid Balancing Update',
    message: 'EDSA dispatch center balancing line load across Western Area. Fluctuation expected during peak hours (7PM - 10PM).',
    area: 'Freetown',
    author: 'EDSA Grid Operations',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    verified: true
  },
  {
    id: 'bulletin-init-2',
    type: 'community',
    title: 'EDSA Emergency Line Crew on Site',
    message: 'Field technician truck spotted replacing damaged insulator bracket near junction.',
    area: 'Lumley',
    author: 'Community Observer',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    verified: false
  }
];

export async function GET(req: NextRequest) {
  try {
    const area = req.nextUrl.searchParams.get('area') || '';
    const cleanArea = area.trim().toLowerCase();

    // 1. Fetch official announcements from database
    let announcements: { id: string; title: string; message: string; createdAt: Date }[] = [];
    try {
      announcements = await prisma.announcement.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
    } catch {
      // Graceful fallback if database unavailable
    }

    // 2. Fetch scheduled outages
    let scheduled: { id: string; title: string; message: string; area: string | null; createdAt: Date }[] = [];
    try {
      scheduled = await prisma.scheduledOutage.findMany({
        where: {
          active: true,
          endsAt: { gte: new Date() }
        },
        orderBy: { startsAt: 'asc' },
        take: 5
      });
    } catch {
      // Graceful fallback
    }

    // 3. Compile items
    const results: BulletinItem[] = [];

    announcements.forEach((a) => {
      results.push({
        id: `ann-${a.id}`,
        type: 'official',
        title: a.title,
        message: a.message,
        area: 'Western Area',
        author: 'EDSA Central Desk',
        timestamp: a.createdAt.toISOString(),
        verified: true
      });
    });

    scheduled.forEach((s) => {
      results.push({
        id: `sch-${s.id}`,
        type: 'maintenance',
        title: s.title,
        message: s.message,
        area: s.area || 'All Areas',
        author: 'EDSA Maintenance',
        timestamp: s.createdAt.toISOString(),
        verified: true
      });
    });

    // 4. Add community field notes matching area or general
    communityBulletinsCache.forEach((c) => {
      if (
        !cleanArea ||
        !c.area ||
        c.area.toLowerCase().includes(cleanArea) ||
        cleanArea.includes(c.area.toLowerCase()) ||
        c.area === 'Freetown' ||
        c.area === 'Western Area'
      ) {
        results.push(c);
      }
    });

    // Sort newest first
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      bulletins: results
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        bulletins: communityBulletinsCache
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, area, author } = body;

    if (!message || message.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Message content is required.' },
        { status: 400 }
      );
    }

    const newBulletin: BulletinItem = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'community',
      title: title?.trim() || 'Neighborhood Field Report',
      message: message.trim(),
      area: area?.trim() || 'General Area',
      author: author?.trim() || 'Community Member',
      timestamp: new Date().toISOString(),
      verified: false
    };

    // Prepend to in-memory bulletin buffer
    communityBulletinsCache = [newBulletin, ...communityBulletinsCache].slice(0, 50);

    return NextResponse.json({
      success: true,
      bulletin: newBulletin
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to post bulletin.' },
      { status: 500 }
    );
  }
}
