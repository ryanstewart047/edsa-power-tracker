'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, CheckCircle2, Loader2, MapPin } from 'lucide-react';

export type EmojiType = 'sad' | 'happy' | 'excited';

interface EmojiOption {
  type: EmojiType;
  emoji: string;
  label: string;
  rating: number;
  badge: string;
  colorClass: string;
  selectedClass: string;
}

const EMOJI_OPTIONS: EmojiOption[] = [
  {
    type: 'sad',
    emoji: '😞',
    label: 'Sad',
    rating: 1,
    badge: 'Issues / Needs Work',
    colorClass: 'text-rose-600 hover:bg-rose-50 hover:border-rose-300',
    selectedClass: 'bg-rose-50 border-rose-400 text-rose-700 shadow-rose-500/10',
  },
  {
    type: 'happy',
    emoji: '😊',
    label: 'Happy',
    rating: 4,
    badge: 'Good / Satisfied',
    colorClass: 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300',
    selectedClass: 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-emerald-500/10',
  },
  {
    type: 'excited',
    emoji: '🤩',
    label: 'Excited',
    rating: 5,
    badge: 'Loved it! / Great',
    colorClass: 'text-blue-600 hover:bg-blue-50 hover:border-blue-300',
    selectedClass: 'bg-blue-50 border-blue-500 text-blue-700 shadow-blue-500/10',
  },
];

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const AUTO_PROMPT_DELAY_MS = 60 * 1000; // 60 seconds browsing delay

export default function EmojiFeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiType | null>(null);
  const [note, setNote] = useState('');
  const [area, setArea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Close handler: records timestamp so it will not show again for the next 8 hours
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedEmoji(null);
    setNote('');
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('edsa_feedback_closed_at', Date.now().toString());
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load saved primary area if available
    try {
      const savedArea = localStorage.getItem('edsa_primary_area');
      if (savedArea) setArea(savedArea);
    } catch {
      // Ignore
    }

    // Allow manual open when explicitly requested (e.g. from footer or feedback page)
    const handleOpenEvent = () => {
      setSubmitted(false);
      setIsOpen(true);
    };

    window.addEventListener('open-emoji-feedback', handleOpenEvent);

    // Check if within 8-hour cooldown
    let inCooldown = false;
    try {
      const lastClosed = localStorage.getItem('edsa_feedback_closed_at');
      const lastSubmitted = localStorage.getItem('edsa_feedback_last_submitted_v1');
      const now = Date.now();

      if (lastClosed && now - Number(lastClosed) < EIGHT_HOURS_MS) {
        inCooldown = true;
      }
      if (lastSubmitted && now - Number(lastSubmitted) < EIGHT_HOURS_MS) {
        inCooldown = true;
      }
    } catch {
      // Ignore
    }

    // Popup animatively after at least 60 seconds of browsing if not in cooldown
    let timer: NodeJS.Timeout | null = null;
    if (!inCooldown) {
      timer = setTimeout(() => {
        setSubmitted(false);
        setIsOpen(true);
      }, AUTO_PROMPT_DELAY_MS);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('open-emoji-feedback', handleOpenEvent);
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedEmoji) return;

    const option = EMOJI_OPTIONS.find((opt) => opt.type === selectedEmoji);
    if (!option) return;

    setIsSubmitting(true);

    try {
      const formattedMessage = note.trim()
        ? `${option.emoji} ${option.label}: ${note.trim()}`
        : `${option.emoji} ${option.label} (${option.badge}) reaction submitted`;

      const payload = {
        rating: option.rating,
        category: `Emoji: ${option.label}`,
        message: formattedMessage,
        area: area.trim() || 'Sierra Leone',
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
        try {
          const now = Date.now().toString();
          localStorage.setItem('edsa_feedback_last_submitted_v1', now);
          localStorage.setItem('edsa_feedback_closed_at', now);
        } catch {
          // Ignore
        }

        // Close after 2.5 seconds
        setTimeout(() => {
          setIsOpen(false);
          setSelectedEmoji(null);
          setNote('');
          setSubmitted(false);
        }, 2500);
      }
    } catch (err) {
      console.error('Failed to submit emoji feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectEmoji = (type: EmojiType) => {
    setSelectedEmoji(type);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[999] p-3 sm:p-5 flex justify-center pointer-events-none">
          {/* Subtle backdrop overlay with click-to-close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs pointer-events-auto -z-10"
            onClick={handleClose}
          />

          {/* Animated bottom popup card */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="pointer-events-auto relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl md:rounded-[2rem] p-5 sm:p-7 shadow-[0_-10px_50px_rgba(0,0,0,0.12)] text-center overflow-hidden"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Close feedback popup"
              title="Close (remind in 8 hours)"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              /* Success State */
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-6 space-y-3 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">Thank You!</h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Your reaction has been sent directly to the EDSA Tracker operations inbox.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-block text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Feedback Recorded ✓
                  </span>
                </div>
              </motion.div>
            ) : (
              /* Interactive Feedback Form */
              <div className="space-y-5">
                {/* Header Badge */}
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Citizen Pulse</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    How is your experience?
                  </h2>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Tap an emoji to rate EDSA Power Tracker today.
                  </p>
                </div>

                {/* 3 Large Emojis: Sad, Happy, Excited */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {EMOJI_OPTIONS.map((opt) => {
                    const isSelected = selectedEmoji === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => handleSelectEmoji(opt.type)}
                        className={`group relative p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${
                          isSelected
                            ? `${opt.selectedClass} shadow-md scale-105`
                            : `bg-slate-50 border-slate-200 ${opt.colorClass}`
                        }`}
                      >
                        <span className={`text-3xl sm:text-5xl transition-transform duration-200 ${isSelected ? 'scale-110 animate-bounce' : 'group-hover:scale-110'}`}>
                          {opt.emoji}
                        </span>
                        <span className="text-xs font-black tracking-wide text-slate-900">
                          {opt.label}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold leading-tight text-center">
                          {opt.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Optional Note & Community Area */}
                {selectedEmoji && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={handleSubmit}
                    className="space-y-3 text-left pt-1"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700">
                        Add a quick note <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={300}
                        placeholder={
                          selectedEmoji === 'sad'
                            ? 'What went wrong or was inaccurate?'
                            : selectedEmoji === 'happy'
                            ? 'What worked well for you?'
                            : 'What do you love most about the app?'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span>Your Community / Area</span>
                        <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        maxLength={80}
                        placeholder="e.g. Lumley, Aberdeen, Kissy, Bo..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Sending Feedback...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Reaction to Operations</span>
                        </>
                      )}
                    </button>
                  </motion.form>
                )}

                {/* Footer Controls: Dismiss / Remind in 8 hours */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="hover:text-slate-800 transition-colors"
                  >
                    Not now (remind in 8 hrs)
                  </button>
                  <a
                    href="/feedback"
                    onClick={handleClose}
                    className="text-blue-600 hover:text-blue-700 underline transition-colors font-medium"
                  >
                    Open detailed form →
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
