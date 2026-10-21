import { NextRequest, NextResponse } from 'next/server';
import { getAllNewsEvents, saveNewsEvents, type NewsEventItem } from '@/lib/newsEvents';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const showAll = req.nextUrl.searchParams.get('all') === 'true';
    const items = await getAllNewsEvents();

    if (showAll) {
      return NextResponse.json({ success: true, items });
    }

    // Public view: only enabled cards, sorted by featured first, then published date desc
    const active = items
      .filter((item) => item.enabled)
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

    return NextResponse.json({ success: true, items: active });
  } catch (err) {
    console.error('Error fetching news events:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news events' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, summary, content, imageUrl, eventDate, eventLocation, author, featured } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!summary || !summary.trim()) {
      return NextResponse.json({ success: false, error: 'Summary is required' }, { status: 400 });
    }

    const items = await getAllNewsEvents();

    const newItem: NewsEventItem = {
      id: `news-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      category: category || 'News',
      summary: summary.trim(),
      content: content ? content.trim() : summary.trim(),
      imageUrl: imageUrl?.trim() || '/assets/slide1.png',
      eventDate: eventDate?.trim() || undefined,
      eventLocation: eventLocation?.trim() || undefined,
      author: author?.trim() || 'EDSA Communications',
      publishedAt: new Date().toISOString(),
      enabled: true,
      featured: Boolean(featured),
      readTime: '3 min read'
    };

    const updated = [newItem, ...items];
    await saveNewsEvents(updated);

    return NextResponse.json({ success: true, item: newItem, items: updated });
  } catch (err) {
    console.error('Error creating news event:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create news event card' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    const items = await getAllNewsEvents();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'News item not found' }, { status: 404 });
    }

    items[index] = {
      ...items[index],
      ...updates
    };

    await saveNewsEvents(items);

    return NextResponse.json({ success: true, item: items[index], items });
  } catch (err) {
    console.error('Error updating news event:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update news event card' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    const items = await getAllNewsEvents();
    const filtered = items.filter((item) => item.id !== id);

    if (filtered.length === items.length) {
      return NextResponse.json({ success: false, error: 'News item not found' }, { status: 404 });
    }

    await saveNewsEvents(filtered);

    return NextResponse.json({ success: true, items: filtered });
  } catch (err) {
    console.error('Error deleting news event:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete news event card' },
      { status: 500 }
    );
  }
}
