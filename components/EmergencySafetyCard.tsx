/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  AlertTriangle,
  HardHat,
  ShieldAlert,
  Flame,
  CloudRain,
  HeartPulse,
  Phone,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  CheckCircle2,
  Zap,
  ShieldCheck,
  LucideIcon
} from 'lucide-react';
import { DEFAULT_SAFETY_SLIDES, type SafetySlideData, type BadgeTone } from '@/lib/safetyCards';

const ICON_MAP: Record<string, LucideIcon> = {
  HardHat,
  CloudRain,
  Flame,
  ShieldAlert,
  HeartPulse,
  Zap,
  AlertTriangle,
  ShieldCheck
};

const TONE_STYLES: Record<
  BadgeTone,
  {
    accent: string;
    badge: string;
    indicator: string;
  }
> = {
  rose: {
    accent: 'from-rose-500 via-amber-500 to-rose-600',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
    indicator: 'bg-rose-600'
  },
  amber: {
    accent: 'from-amber-400 via-orange-500 to-amber-600',
    badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
    indicator: 'bg-amber-600'
  },
  blue: {
    accent: 'from-blue-600 via-indigo-600 to-blue-700',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    indicator: 'bg-blue-600'
  },
  purple: {
    accent: 'from-purple-500 via-indigo-500 to-purple-600',
    badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
    indicator: 'bg-purple-600'
  },
  emerald: {
    accent: 'from-emerald-500 via-teal-500 to-emerald-600',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    indicator: 'bg-emerald-600'
  }
};

interface EmergencySafetyCardProps {
  onReportHazard?: (hazardType?: string) => void;
}

export default function EmergencySafetyCard({ onReportHazard }: EmergencySafetyCardProps) {
  const [slides, setSlides] = useState<SafetySlideData[]>(DEFAULT_SAFETY_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch updated slides from public API
  useEffect(() => {
    let isMounted = true;
    async function loadCards() {
      try {
        const res = await fetch('/api/safety-cards', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.cards) && data.cards.length > 0) {
            setSlides(data.cards);
          }
        }
      } catch (err) {
        console.warn('Could not fetch custom safety cards, using built-in defaults:', err);
      }
    }
    loadCards();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalSlides = slides.length;
  const safeIndex = totalSlides > 0 ? currentIndex % totalSlides : 0;
  const activeSlide = slides[safeIndex] || DEFAULT_SAFETY_SLIDES[0];
  const activeTone = TONE_STYLES[activeSlide.badgeTone] || TONE_STYLES.blue;

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setDirection(index > safeIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-play sliding every 7 seconds (right to left)
  useEffect(() => {
    if (isPaused || totalSlides <= 1) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 7000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPaused, nextSlide, totalSlides]);

  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 280, damping: 28 },
        opacity: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 280, damping: 28 },
        opacity: { duration: 0.2 }
      }
    })
  };

  // Resolve icon component
  const IconComponent = (activeSlide.avatarIconName && ICON_MAP[activeSlide.avatarIconName]) || HardHat;

  // Handle Action button click (opens the Report Hazard modal)
  const handleActionClick = () => {
    const hazardTypeToTrigger = activeSlide.hazardType || activeSlide.title;
    if (onReportHazard) {
      onReportHazard(hazardTypeToTrigger);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('edsa:open-hazard-modal', {
          detail: { hazardType: hazardTypeToTrigger }
        })
      );
    }
  };

  return (
    <aside
      className="relative rounded-[2rem] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all overflow-hidden scroll-reveal"
      aria-label="Electrical emergency safety guidance and education"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Top accent strip matching site's blue / brand tones */}
      <div
        className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${activeTone.accent} transition-all duration-500`}
      />

      {/* Header bar: Safety beacon and carousel navigation controls (slides count is invisible) */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
          </span>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span>Electrical Hazard Education</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-200/60">
              Official EDSA Safety
            </span>
          </h2>
        </div>

        {/* Carousel controls: Prev, Pause/Play, Next */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={prevSlide}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all active:scale-95 cursor-pointer"
            aria-label="Previous safety lesson"
            title="Previous"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-all active:scale-95 cursor-pointer"
            aria-label={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? (
              <Play className="w-3 h-3 fill-slate-700 text-slate-700" />
            ) : (
              <Pause className="w-3 h-3 fill-slate-500 text-slate-500" />
            )}
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all active:scale-95 cursor-pointer"
            aria-label="Next safety lesson"
            title="Next"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slide Content Area with AnimatePresence sliding right-to-left */}
      <div className="relative min-h-[220px] sm:min-h-[190px] overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={activeSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full flex flex-col md:flex-row gap-4 items-start"
          >
            {/* Professional Educative Avatar Badge */}
            <div className="flex md:flex-col items-center gap-3 shrink-0">
              <div className="relative">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${
                    activeSlide.avatarBg || 'from-blue-600 to-indigo-700'
                  } p-0.5 shadow-sm flex items-center justify-center overflow-hidden`}
                >
                  {activeSlide.avatarImage ? (
                    <img
                      src={activeSlide.avatarImage}
                      alt={activeSlide.speaker}
                      className="w-full h-full object-cover rounded-[0.875rem] bg-white"
                    />
                  ) : (
                    <div className="w-full h-full bg-white rounded-[0.875rem] flex items-center justify-center relative overflow-hidden">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${
                          activeSlide.avatarBg || 'from-blue-600 to-indigo-700'
                        } opacity-15`}
                      />
                      <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-blue-700 relative z-10" />
                    </div>
                  )}
                </div>
                {/* Verified badge indicator */}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-slate-200">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${activeTone.indicator} flex items-center justify-center text-[8px] text-white font-black`}
                  >
                    ✓
                  </div>
                </div>
              </div>

              {/* Speaker Metadata */}
              <div className="md:text-center text-left">
                <div className="text-xs font-black text-slate-900 leading-tight">
                  {activeSlide.speaker}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 leading-tight">
                  {activeSlide.speakerRole}
                </div>
              </div>
            </div>

            {/* Educative Slide Content */}
            <div className="flex-1 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${activeTone.badge}`}
                >
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {activeSlide.badge}
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  Field Guidance
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                {activeSlide.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {activeSlide.guidance}
              </p>

              {/* Actionable bullet points */}
              {Array.isArray(activeSlide.keyPoints) && activeSlide.keyPoints.length > 0 && (
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {activeSlide.keyPoints.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 p-2 rounded-xl hover:bg-blue-50/50 hover:border-blue-200/60 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="leading-tight">{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer bar: Action buttons & clickable slide pagination dots */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Clickable pagination dots (slides count numbers are invisible) */}
        <div className="flex items-center gap-1.5 order-2 sm:order-1" role="tablist" aria-label="Slide indicators">
          {slides.map((slide, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to lesson ${idx + 1}: ${slide.title}`}
                onClick={() => goToSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'w-7 bg-blue-600'
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            );
          })}
        </div>

        {/* Quick Emergency Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
          {/* Action button: Opens the Report Hazard modal */}
          <button
            type="button"
            onClick={handleActionClick}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            title="Open hazard reporting modal"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>{activeSlide.actionLabel || 'Report Hazard Now'}</span>
          </button>

          {/* Emergency Call 112 hotline button */}
          <a
            href="tel:112"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
            title="Dial Emergency Hotline 112"
          >
            <Phone className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Emergency</span> 112
          </a>
        </div>
      </div>
    </aside>
  );
}
