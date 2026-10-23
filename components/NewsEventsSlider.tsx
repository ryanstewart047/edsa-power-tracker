/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Newspaper,
  ArrowRight
} from 'lucide-react';
import { DEFAULT_NEWS_EVENTS, type NewsEventItem } from '@/lib/newsEvents';
import NewsEventDetailModal from '@/components/NewsEventDetailModal';

export default function NewsEventsSlider() {
  const [items, setItems] = useState<NewsEventItem[]>(DEFAULT_NEWS_EVENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<NewsEventItem | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
        }
      })
      .catch(() => {
        // Fallback to pre-seeded items
      });
  }, []);

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'News') return item.category === 'News' || item.category === 'Press Release';
    if (selectedCategory === 'Events') return item.category === 'Event' || item.category === 'Community';
    return item.category === selectedCategory;
  });

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.clientWidth * 0.8;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Event':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Press Release':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (filteredItems.length === 0 && items.length === 0) return null;

  return (
    <section className="relative space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Newspaper className="w-3.5 h-3.5" />
            <span>EDSA Power News &amp; Updates</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Official Announcements &amp; Events
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time grid developments, community townhalls, and infrastructure upgrades across Sierra Leone.
          </p>
        </div>

        {/* Category Pills & Slider Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(['All', 'News', 'Events'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-2xs active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-2xs active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sliding Cards Container */}
      <div
        ref={sliderRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="w-[290px] sm:w-[340px] shrink-0 snap-start rounded-[2rem] border border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer group shadow-sm active:scale-[0.99]"
          >
            {/* Card Thumbnail Image */}
            <div className="relative w-full h-44 sm:h-48 bg-slate-100 overflow-hidden shrink-0">
              <img
                src={item.imageUrl || '/assets/slide1.png'}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

              {/* Badges on Thumbnail */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${getCategoryColor(item.category)}`}>
                  {item.category}
                </span>
                {item.featured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    Featured
                  </span>
                )}
              </div>

              {/* Event Date or Published Date Badge */}
              <div className="absolute bottom-3 left-3 right-3 text-white text-[11px] flex items-center justify-between">
                {item.eventDate ? (
                  <span className="inline-flex items-center gap-1 font-bold bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/20">
                    <Calendar className="w-3 h-3 text-purple-300" />
                    <span>{item.eventDate}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-medium bg-slate-900/60 backdrop-blur-md px-2 py-0.5 rounded-lg">
                    <Clock className="w-3 h-3 text-blue-300" />
                    <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                  </span>
                )}
                {item.readTime && (
                  <span className="text-[10px] text-slate-300">{item.readTime}</span>
                )}
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                {item.eventLocation && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 line-clamp-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{item.eventLocation}</span>
                  </div>
                )}
                <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Bottom CTA */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Read Full Story</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pop-up Modal with Scrolling Effect */}
      <NewsEventDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  );
}
