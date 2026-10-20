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
  MapPin
} from 'lucide-react';

interface SafetySlide {
  id: string;
  badge: string;
  badgeTone: 'rose' | 'amber' | 'blue' | 'purple' | 'emerald';
  speaker: string;
  speakerRole: string;
  avatarIcon: typeof HardHat;
  avatarBg: string;
  title: string;
  guidance: string;
  keyPoints: string[];
  actionLabel: string;
  actionUrl: string;
}

const SAFETY_SLIDES: SafetySlide[] = [
  {
    id: 'fallen-wires',
    badge: 'Immediate Danger',
    badgeTone: 'rose',
    speaker: 'Eng. Osman Kamara',
    speakerRole: 'EDSA High-Voltage Safety Lead',
    avatarIcon: HardHat,
    avatarBg: 'from-rose-500 to-amber-500',
    title: 'Fallen Cables & Ground Voltage Shock',
    guidance:
      'Never step near or touch a fallen power line. High voltage can electrify the ground in ripples up to 10 meters (33 feet) away. If caught nearby, keep your feet touching and shuffle away slowly without lifting your feet.',
    keyPoints: [
      'Maintain at least 10 meters (33 ft) safety perimeter',
      'Shuffle feet together — never take wide steps',
      'Never touch vehicles or metal in contact with wires'
    ],
    actionLabel: 'Call EDSA Emergency Hotline',
    actionUrl: 'tel:112'
  },
  {
    id: 'flooding-rain',
    badge: 'Weather & Storm Safety',
    badgeTone: 'blue',
    speaker: 'Mariama Sesay',
    speakerRole: 'Disaster Prevention Officer',
    avatarIcon: CloudRain,
    avatarBg: 'from-blue-500 to-cyan-500',
    title: 'Water Conductance & Flooded Utility Poles',
    guidance:
      'During heavy tropical rains or flash floods, water acts as a live electrical conductor. Stay well clear of submerged utility poles, outdoor meter boxes, and sagging service drops. Turn off your main indoor breaker if water enters your home.',
    keyPoints: [
      'Never wade through puddles near leaning poles',
      'Shut off the main electrical breaker before flooding rises',
      'Do not touch damp electrical appliances or switches'
    ],
    actionLabel: 'Report Flooded Cable on Map',
    actionUrl: '/tracker'
  },
  {
    id: 'transformer-sparks',
    badge: 'Substation Hazard',
    badgeTone: 'amber',
    speaker: 'Technician Foday Bangura',
    speakerRole: 'Substation Inspector',
    avatarIcon: Flame,
    avatarBg: 'from-amber-500 to-orange-500',
    title: 'Smoking Transformers & Arcing Poles',
    guidance:
      'If you hear loud buzzing or see smoke and sparks erupting from a transformer, never attempt to extinguish it with water or sand. Substation transformers contain high-pressure dielectric oil. Evacuate 30 meters immediately.',
    keyPoints: [
      'Never throw water on electrical transformer flames',
      'Keep crowds 30 meters away from loud buzzing units',
      'Log GPS coordinates to dispatch rapid repair crews'
    ],
    actionLabel: 'Report Transformer Failure',
    actionUrl: '/tracker'
  },
  {
    id: 'illegal-taps',
    badge: 'Community Protection',
    badgeTone: 'purple',
    speaker: 'Insp. Aminata Koroma',
    speakerRole: 'Grid Safety Enforcement',
    avatarIcon: ShieldAlert,
    avatarBg: 'from-purple-500 to-indigo-500',
    title: 'Spider-Web Illegal Taps & Exposed Joints',
    guidance:
      'Uninsulated makeshift hookups bypass safety fuses and carry unstable current that spikes into neighboring homes. These unauthorized wires cause over 80% of urban residential electrical fires in Sierra Leone.',
    keyPoints: [
      'Exposed overhead wire splices ignite tin roofs',
      'Bypassed fuses overload neighborhood distribution lines',
      'Report exposed joints confidentially to protect lives'
    ],
    actionLabel: 'Report Dangerous Illegal Wire',
    actionUrl: '/tracker'
  },
  {
    id: 'shock-first-aid',
    badge: 'Life-Saving First Aid',
    badgeTone: 'emerald',
    speaker: 'Dr. Alie Mansaray',
    speakerRole: 'Emergency First Response',
    avatarIcon: HeartPulse,
    avatarBg: 'from-emerald-500 to-teal-500',
    title: 'Electric Shock Rescue & CPR Protocol',
    guidance:
      'Never touch a person who is currently in contact with a live electrical current, or you will be shocked too! Cut the main circuit breaker first. If unreachable, use a dry wooden stick or dry plastic to push the wire clear.',
    keyPoints: [
      'Break electrical contact with dry non-conductive wood only',
      'Check breathing immediately once victim is clear',
      'Administer CPR and call for emergency ambulance'
    ],
    actionLabel: 'Dial Emergency Rescue (112)',
    actionUrl: 'tel:112'
  }
];

const TONE_STYLES = {
  rose: {
    accent: 'from-rose-500 via-amber-500 to-rose-600',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    bullet: 'bg-rose-100 text-rose-700',
    border: 'border-rose-200/80',
    indicator: 'bg-rose-500'
  },
  amber: {
    accent: 'from-amber-400 via-orange-500 to-amber-600',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    bullet: 'bg-amber-100 text-amber-800',
    border: 'border-amber-200/80',
    indicator: 'bg-amber-500'
  },
  blue: {
    accent: 'from-blue-500 via-cyan-500 to-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    bullet: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200/80',
    indicator: 'bg-blue-500'
  },
  purple: {
    accent: 'from-purple-500 via-fuchsia-500 to-purple-600',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    bullet: 'bg-purple-100 text-purple-700',
    border: 'border-purple-200/80',
    indicator: 'bg-purple-500'
  },
  emerald: {
    accent: 'from-emerald-500 via-teal-500 to-emerald-600',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bullet: 'bg-emerald-100 text-emerald-800',
    border: 'border-emerald-200/80',
    indicator: 'bg-emerald-500'
  }
};

export default function EmergencySafetyCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = slide from right to left, -1 = reverse
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeSlide = SAFETY_SLIDES[currentIndex];
  const activeTone = TONE_STYLES[activeSlide.badgeTone];

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SAFETY_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SAFETY_SLIDES.length) % SAFETY_SLIDES.length);
  }, []);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-play sliding every 6.5 seconds (right to left)
  useEffect(() => {
    if (isPaused) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 6500);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPaused, nextSlide]);

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

  const IconComponent = activeSlide.avatarIcon;

  return (
    <aside
      className="relative rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-md shadow-slate-900/5 overflow-hidden transition-all scroll-reveal"
      aria-label="Electrical emergency safety guidance and education"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Dynamic top gradient accent strip */}
      <div
        className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${activeTone.accent} transition-all duration-500`}
      />

      {/* Header bar: Safety beacon, title, and carousel navigation controls */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
          </span>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span>Electrical Hazard Education</span>
            <span className="text-[10px] font-bold text-slate-400">({currentIndex + 1}/{SAFETY_SLIDES.length})</span>
          </h2>
        </div>

        {/* Carousel controls: Prev, Pause/Play, Next */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={prevSlide}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-white transition-all active:scale-95 cursor-pointer"
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
            {isPaused ? <Play className="w-3 h-3 fill-slate-700 text-slate-700" /> : <Pause className="w-3 h-3 fill-slate-500 text-slate-500" />}
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-white transition-all active:scale-95 cursor-pointer"
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
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${activeSlide.avatarBg} p-0.5 shadow-md shadow-slate-900/10 flex items-center justify-center`}
                >
                  <div className="w-full h-full bg-white rounded-[0.875rem] flex items-center justify-center relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${activeSlide.avatarBg} opacity-15`} />
                    <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-slate-900 relative z-10" />
                  </div>
                </div>
                {/* Micro badge indicator */}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-slate-200">
                  <div className={`w-3.5 h-3.5 rounded-full ${activeTone.indicator} flex items-center justify-center text-[8px] text-white font-black`}>
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
                  Life-Saving Field Protocol
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                {activeSlide.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {activeSlide.guidance}
              </p>

              {/* Three key bullet points */}
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {activeSlide.keyPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 p-2 rounded-xl"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer bar: Emergency actions & clickable slide pagination dots */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Clickable pagination dots */}
        <div className="flex items-center gap-1.5 order-2 sm:order-1" role="tablist" aria-label="Slide indicators">
          {SAFETY_SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
                onClick={() => goToSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? `w-7 ${activeTone.indicator}`
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            );
          })}
        </div>

        {/* Quick Emergency Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
          <a
            href={activeSlide.actionUrl}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95"
          >
            {activeSlide.actionUrl.startsWith('tel:') ? (
              <Phone className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{activeSlide.actionLabel}</span>
          </a>

          <a
            href="tel:112"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
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
