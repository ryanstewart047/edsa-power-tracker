import { NextResponse } from 'next/server';
import { getSafetyCardsFromDb } from '@/lib/safetyCards';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allCards = await getSafetyCardsFromDb();
    const activeCards = allCards.filter(c => c.active !== false);
    return NextResponse.json({
      cards: activeCards.length > 0 ? activeCards : allCards,
    });
  } catch (error) {
    console.error('Safety cards public API error:', error);
    return NextResponse.json({ cards: [] }, { status: 500 });
  }
}
