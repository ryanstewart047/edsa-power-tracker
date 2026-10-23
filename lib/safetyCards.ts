import { prisma } from '@/lib/prisma';

export type BadgeTone = 'blue' | 'rose' | 'amber' | 'emerald' | 'purple';

export interface SafetySlideData {
  id: string;
  badge: string;
  badgeTone: BadgeTone;
  speaker: string;
  speakerRole: string;
  avatarImage?: string | null;
  avatarIconName?: string;
  avatarBg?: string;
  title: string;
  guidance: string;
  keyPoints: string[];
  actionLabel: string;
  hazardType?: string;
  active: boolean;
  order: number;
}

export const SAFETY_CARDS_SETTING_KEY = 'safety_cards_config';

export const DEFAULT_SAFETY_SLIDES: SafetySlideData[] = [
  {
    id: 'fallen-wires',
    badge: 'Immediate Danger',
    badgeTone: 'rose',
    speaker: 'Eng. Osman Kamara',
    speakerRole: 'EDSA Grid Safety Specialist',
    avatarImage: '/assets/avatars/osman-kamara.jpg',
    avatarIconName: 'HardHat',
    avatarBg: 'from-blue-600 to-indigo-700',
    title: 'Fallen Cables & Ground Voltage Shock',
    guidance:
      'Never step near or touch a fallen power line. High voltage electrifies the ground in expanding rings up to 10 meters (33 ft) away. If caught nearby, keep feet touching and shuffle away slowly without lifting either foot.',
    keyPoints: [
      'Maintain at least 10 meters (33 ft) safety distance',
      'Shuffle feet together — never take wide walking steps',
      'Never touch vehicles or metal in contact with wires'
    ],
    actionLabel: 'Report Fallen Wire',
    hazardType: 'Cut or damaged Wires',
    active: true,
    order: 0
  },
  {
    id: 'flooding-rain',
    badge: 'Weather & Storm Safety',
    badgeTone: 'blue',
    speaker: 'Mariama Sesay',
    speakerRole: 'Disaster Prevention Officer',
    avatarImage: '/assets/avatars/mariama-sesay.jpg',
    avatarIconName: 'CloudRain',
    avatarBg: 'from-blue-500 to-cyan-600',
    title: 'Water Conductance & Flooded Utility Poles',
    guidance:
      'During heavy tropical rains or flash floods, water acts as an electrical conductor. Stay well clear of submerged utility poles, outdoor meter boxes, and sagging service drops. Turn off your main indoor breaker if water enters your home.',
    keyPoints: [
      'Never wade through puddles near leaning poles',
      'Shut off the main electrical breaker before flooding rises',
      'Do not touch damp electrical appliances or switches'
    ],
    actionLabel: 'Report Flooded Cable Danger',
    hazardType: 'Sparking Cable',
    active: true,
    order: 1
  },
  {
    id: 'transformer-sparks',
    badge: 'Substation Hazard',
    badgeTone: 'amber',
    speaker: 'Technician Foday Bangura',
    speakerRole: 'Substation Inspector',
    avatarImage: '/assets/avatars/foday-bangura.jpg',
    avatarIconName: 'Flame',
    avatarBg: 'from-amber-500 to-orange-600',
    title: 'Smoking Transformers & Arcing Poles',
    guidance:
      'If you hear loud buzzing or see smoke and sparks erupting from a transformer, never attempt to extinguish it with water or sand. Substation transformers contain high-pressure dielectric oil. Evacuate 30 meters immediately.',
    keyPoints: [
      'Never throw water on electrical transformer flames',
      'Keep crowds 30 meters away from loud buzzing units',
      'Log GPS coordinates to dispatch rapid repair crews'
    ],
    actionLabel: 'Report Transformer Danger',
    hazardType: 'Transformer Issue',
    active: true,
    order: 2
  },
  {
    id: 'illegal-taps',
    badge: 'Community Protection',
    badgeTone: 'purple',
    speaker: 'Insp. Aminata Koroma',
    speakerRole: 'Grid Safety Enforcement',
    avatarImage: '/assets/avatars/aminata-koroma.jpg',
    avatarIconName: 'ShieldAlert',
    avatarBg: 'from-purple-600 to-indigo-600',
    title: 'Spider-Web Illegal Taps & Exposed Joints',
    guidance:
      'Uninsulated makeshift hookups bypass safety fuses and carry unstable current that spikes into neighboring homes. These unauthorized wires cause over 80% of urban residential electrical fires in Sierra Leone.',
    keyPoints: [
      'Exposed overhead wire splices ignite tin roofs',
      'Bypassed fuses overload neighborhood distribution lines',
      'Report exposed joints confidentially to protect lives'
    ],
    actionLabel: 'Report Illegal Connection',
    hazardType: 'Illegal Connection',
    active: true,
    order: 3
  },
  {
    id: 'shock-first-aid',
    badge: 'Life-Saving First Aid',
    badgeTone: 'emerald',
    speaker: 'Dr. Alie Mansaray',
    speakerRole: 'Emergency First Response',
    avatarImage: '/assets/avatars/alie-mansaray.jpg',
    avatarIconName: 'HeartPulse',
    avatarBg: 'from-emerald-600 to-teal-600',
    title: 'Electric Shock Rescue & CPR Protocol',
    guidance:
      'Never touch a person who is currently in contact with a live electrical current, or you will be shocked too! Cut the main circuit breaker first. If unreachable, use a dry wooden stick or dry plastic to push the wire clear.',
    keyPoints: [
      'Break electrical contact with dry non-conductive wood only',
      'Check breathing immediately once victim is clear',
      'Administer CPR and call for emergency ambulance'
    ],
    actionLabel: 'Report Critical Danger',
    hazardType: 'Other Danger',
    active: true,
    order: 4
  }
];

export async function getSafetyCardsFromDb(): Promise<SafetySlideData[]> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: SAFETY_CARDS_SETTING_KEY },
    });
    if (!setting?.value) {
      return DEFAULT_SAFETY_SLIDES;
    }
    const parsed = JSON.parse(setting.value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return (parsed as SafetySlideData[])
        .map((c) => {
          const defaultMatch = DEFAULT_SAFETY_SLIDES.find((d) => d.id === c.id);
          return {
            ...c,
            avatarImage: c.avatarImage || defaultMatch?.avatarImage || null,
          };
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return DEFAULT_SAFETY_SLIDES;
  } catch (err) {
    console.error('Error fetching safety cards from db:', err);
    return DEFAULT_SAFETY_SLIDES;
  }
}

export async function saveSafetyCardsToDb(cards: SafetySlideData[], adminEmail: string) {
  const serialized = JSON.stringify(cards);
  return prisma.appSetting.upsert({
    where: { key: SAFETY_CARDS_SETTING_KEY },
    create: { key: SAFETY_CARDS_SETTING_KEY, value: serialized, updatedBy: adminEmail },
    update: { value: serialized, updatedBy: adminEmail },
  });
}

export async function resetSafetyCardsInDb(adminEmail: string) {
  const serialized = JSON.stringify(DEFAULT_SAFETY_SLIDES);
  return prisma.appSetting.upsert({
    where: { key: SAFETY_CARDS_SETTING_KEY },
    create: { key: SAFETY_CARDS_SETTING_KEY, value: serialized, updatedBy: adminEmail },
    update: { value: serialized, updatedBy: adminEmail },
  });
}
