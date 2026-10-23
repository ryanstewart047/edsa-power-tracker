import { prisma } from '@/lib/prisma';

export interface NewsEventItem {
  id: string;
  title: string;
  category: 'News' | 'Event' | 'Maintenance' | 'Press Release' | 'Community';
  summary: string;
  content: string;
  imageUrl: string;
  eventDate?: string;
  eventLocation?: string;
  author: string;
  publishedAt: string;
  enabled: boolean;
  featured?: boolean;
  readTime?: string;
}

export const DEFAULT_NEWS_EVENTS: NewsEventItem[] = [
  {
    id: 'news-1',
    title: 'Kassiri & Kambia 33kV Substation Commissioning',
    category: 'Event',
    summary: 'EDSA executive leadership and Ministry of Energy officials officially commission the high-voltage transmission extension to expand rural access.',
    content: `In a landmark achievement for regional power stability and rural electrification, the Electricity Distribution and Supply Authority (EDSA) in collaboration with the Ministry of Energy is commissioning the new 33kV distribution line connecting Kassiri, Rosinor, and Kambia Central.\n\nThe project incorporates modern SF6 switchgear, automated reclosers, and reinforced concrete poles to withstand heavy coastal rains. Over 45,000 residents and businesses in commercial border trading hubs will gain direct access to continuous grid electricity.\n\nKey Highlights:\n- 48 kilometers of new 33kV aluminum conductor steel-reinforced (ACSR) lines\n- 8 new distribution step-down transformers (33kV to 11kV/400V)\n- Dedicated supply feeder for Kambia Government Hospital and cold-chain vaccine storage\n\nAll community stakeholders, local chiefs, and commercial traders are invited to the open commissioning ceremony at the Kambia Central Substation grounds.`,
    imageUrl: '/assets/slide1.png',
    eventDate: 'Saturday, Nov 7, 2026',
    eventLocation: 'Kambia Central Substation, Northern Province',
    author: 'EDSA Corporate Communications',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    enabled: true,
    featured: true,
    readTime: '3 min read'
  },
  {
    id: 'news-2',
    title: 'Prepaid STS KRN2 Token Rollover Upgrade Drive',
    category: 'News',
    summary: 'Important notice for all EDSA prepaid meter customers: ensure your meter is upgraded to STS Key Revision Number 2 to avoid token lockouts.',
    content: `The Electricity Distribution and Supply Authority (EDSA) reminds all residential and commercial customers across the Western Area, Bo, Kenema, and Makeni that the Standard Transfer Specification (STS) Key Revision Number 2 (KRN2) rollover is actively underway.\n\nAll STS prepaid meters worldwide require this mandatory cryptographic firmware key update. Meters that have not loaded the 2x 20-digit Key Change Tokens (KCT) will soon reject newly purchased electricity tokens.\n\nHow to check your meter today:\n1. On Conlog meters: Enter 005 and press the blue Enter (↵) key. If the LCD displays 02, your meter is fully updated.\n2. On Hexing meters: Enter 01 and press Enter (↵) to view status.\n3. If your meter displays 01, you still need your free pair of Key Change Tokens.\n\nTokens can be generated automatically upon your next recharge or requested at any EDSA customer care service center. Field technicians are also visiting neighborhoods with free on-site assistance.`,
    imageUrl: '/assets/slide2.png',
    author: 'EDSA Metering Services Directorate',
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    enabled: true,
    featured: true,
    readTime: '4 min read'
  },
  {
    id: 'news-3',
    title: 'Bumbuna Hydro Reservoir Water Level & Grid Balancing',
    category: 'News',
    summary: 'Grid Operations Center report on current Bumbuna Dam water levels and the scheduled dry-season thermal generation transition protocol.',
    content: `EDSA Grid Dispatch Center in Kingtom has released its seasonal hydrological and dispatch overview for the Western Area interconnected system.\n\nWater intake levels at the Bumbuna Hydroelectric Dam in Tonkolili District remain optimal following late rains, generating steady base-load power. As seasonal inflows gradually reduce over coming months, EDSA will ramp up supplementary generation from the Freetown thermal plant and the offshore Karpowership vessel.\n\nKey Grid Commitments:\n- Phase voltage stabilization across Lumley, Goderich, and Regent transmission lines\n- Priority feeder protection for water pumping stations at Guma Valley Dam\n- Reduction of peak-hour industrial shedding through coordinated time-of-use tariffs\n\nCustomers are encouraged to report power surges or transformer oil leaks immediately via the EDSA Power Tracker hazard reporting tool.`,
    imageUrl: '/assets/slide3.png',
    author: 'EDSA Grid Operations & Dispatch',
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    enabled: true,
    featured: false,
    readTime: '2 min read'
  },
  {
    id: 'news-4',
    title: 'Western Area Community Townhall on Illegal Hook-Ups',
    category: 'Event',
    summary: 'Open stakeholder meeting between EDSA senior safety engineers, community leaders, and residents to address power theft and fire hazards.',
    content: `In response to repeated transformer overloads and hazardous low-hanging makeshift cables, EDSA is hosting a series of community-led townhalls on electricity safety and legal compliance.\n\nIllegal power taps and unmetered bypasses cause dangerous voltage drops, household electrical fires, and sudden transformer blowouts that plunge entire neighborhoods into darkness.\n\nTownhall Agenda:\n1. Dangers of illegal secondary wiring and fallen lines during rainstorms\n2. Streamlined fast-track process for acquiring subsidized prepaid meters\n3. Anonymous citizen reporting of power theft and vandalized equipment\n4. Question & answer session with EDSA safety enforcement inspectors\n\nComplimentary refreshments will be served. All residents and youth leaders are encouraged to attend.`,
    imageUrl: '/assets/hero-bg.png',
    eventDate: 'Thursday, Nov 12, 2026',
    eventLocation: 'City Hall Auditorium, Wallace Johnson Street, Freetown',
    author: 'EDSA Public Relations & Safety Enforcement',
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    enabled: true,
    featured: false,
    readTime: '3 min read'
  }
];

const SETTING_KEY = 'edsa_news_events_v1';

// In-memory fallback if database connection is unavailable
let memoryNewsEventsCache: NewsEventItem[] = [...DEFAULT_NEWS_EVENTS];

/**
 * Fetch all news and event items from database (with in-memory fallback)
 */
export async function getAllNewsEvents(): Promise<NewsEventItem[]> {
  try {
    const record = await prisma.appSetting.findUnique({
      where: { key: SETTING_KEY }
    });

    if (record && record.value) {
      const parsed = JSON.parse(record.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryNewsEventsCache = parsed;
        return parsed;
      }
    }

    // First time initialization: seed default items into database
    await saveNewsEvents(DEFAULT_NEWS_EVENTS);
    return DEFAULT_NEWS_EVENTS;
  } catch (err) {
    console.warn('Failed to read news from DB, using memory cache:', err);
    return memoryNewsEventsCache;
  }
}

/**
 * Save all news and event items to database
 */
export async function saveNewsEvents(items: NewsEventItem[]): Promise<boolean> {
  memoryNewsEventsCache = items;
  try {
    await prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: JSON.stringify(items),
        updatedAt: new Date(),
        updatedBy: 'admin'
      },
      create: {
        key: SETTING_KEY,
        value: JSON.stringify(items),
        updatedAt: new Date(),
        updatedBy: 'admin'
      }
    });
    return true;
  } catch (err) {
    console.warn('Failed to write news to DB:', err);
    return false;
  }
}
