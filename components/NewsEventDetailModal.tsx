/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Share2,
  Clock,
  ShieldCheck,
  Check,
  Zap,
  Sparkles
} from 'lucide-react';
import type { NewsEventItem } from '@/lib/newsEvents';

interface NewsEventDetailModalProps {
  item: NewsEventItem | null;
  onClose: () => void;
}

export default function NewsEventDetailModal({ item, onClose }: NewsEventDetailModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [item]);

  if (!item) return null;

  const handleShare = () => {
    const shareText = `*${item.title}*\n\n${item.summary}\n\nRead more on EDSA Power Tracker:\nhttps://edsasl.com`;
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.summary,
        url: window.location.href
      }).catch(() => undefined);
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl sm:rounded-[2rem] border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container with Smooth Scroll Effect */}
        <div className="flex-1 overflow-y-auto scroll-smooth divide-y divide-slate-100">
          
          {/* Hero Image Section */}
          <div className="relative w-full h-64 sm:h-80 bg-slate-900 overflow-hidden shrink-0">
            <img
              src={item.imageUrl || '/assets/slide1.png'}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
            
            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm ${getCategoryColor(item.category)}`}>
                {item.category}
              </span>
              {item.featured && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3 fill-slate-950" />
                  Featured
                </span>
              )}
            </div>

            {/* Bottom Title on Image */}
            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
              <div className="flex items-center gap-2 text-xs text-blue-200">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(item.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                {item.readTime && (
                  <>
                    <span>•</span>
                    <span>{item.readTime}</span>
                  </>
                )}
              </div>
              <h2 id="modal-headline" className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm">
                {item.title}
              </h2>
            </div>
          </div>

          {/* Event Specific Location / Date Card */}
          {(item.eventDate || item.eventLocation) && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-indigo-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.eventDate && (
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-[11px] font-black uppercase tracking-wider text-purple-900">Event Date & Time</strong>
                      <p className="text-xs text-purple-950 font-medium">{item.eventDate}</p>
                    </div>
                  </div>
                )}
                {item.eventLocation && (
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-[11px] font-black uppercase tracking-wider text-blue-900">Event Location</strong>
                      <p className="text-xs text-blue-950 font-medium">{item.eventLocation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Article / Event Body */}
          <div className="p-6 sm:p-8 space-y-6 bg-white">
            
            {/* Author Byline */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.author}</p>
                  <p className="text-[10px] text-slate-500">Official EDSA Media Release</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>

            {/* Summary Lead Paragraph */}
            <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed bg-slate-50 border-l-4 border-blue-600 p-4 rounded-r-2xl">
              {item.summary}
            </p>

            {/* Full Story Content */}
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4 font-normal">
              {item.content.split('\n\n').map((para, i) => (
                <p key={i} className="leading-relaxed whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>

            {/* Bottom Callout / EDSA Support Banner */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between gap-3 text-xs text-blue-950">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium">Have questions about this update or grid power in your area?</span>
              </div>
              <a
                href="tel:112"
                className="shrink-0 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Call EDSA 112
              </a>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500">Electricity Distribution and Supply Authority (EDSA)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
          >
            Close Story
          </button>
        </div>
      </div>
    </div>
  );
}
