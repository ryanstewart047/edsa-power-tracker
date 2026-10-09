'use client';

import { useState, useEffect } from 'react';
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
  borderGlow: string;
}

const EMOJI_OPTIONS: EmojiOption[] = [
  {
    type: 'sad',
    emoji: '😞',
    label: 'Sad',
    rating: 1,
    badge: 'Issues / Needs Work',
    colorClass: 'text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30',
    selectedClass: 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-rose-500/20',
    borderGlow: 'from-rose-500/20 to-transparent',
  },
  {
    type: 'happy',
    emoji: '😊',
    label: 'Happy',
    rating: 4,
    badge: 'Good / Satisfied',
    colorClass: 'text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30',
    selectedClass: 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-emerald-500/20',
    borderGlow: 'from-emerald-500/20 to-transparent',
  },
  {
    type: 'excited',
    emoji: '🤩',
    label: 'Excited',
    rating: 5,
    badge: 'Loved it! / Excellent',
    colorClass: 'text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/30',
    selectedClass: 'bg-yellow-400/20 border-yellow-400 text-yellow-300 shadow-yellow-400/20',
    borderGlow: 'from-yellow-400/20 to-transparent',
  },
];

export default function EmojiFeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiType | null>(null);
  const [note, setNote] = useState('');
  const [area, setArea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);

  // Load saved area & check if user previously submitted feedback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load primary area if saved
    try {
      const savedArea = localStorage.getItem('edsa_primary_area');
      if (savedArea) setArea(savedArea);
    } catch {
      // Ignore
    }

    // Listen to manual open event from buttons/links
    const handleOpenEvent = () => {
      setSubmitted(false);
      setIsOpen(true);
    };

    window.addEventListener('open-emoji-feedback', handleOpenEvent);

    // Auto-prompt after 18 seconds on first session if not submitted in past 5 days
    const lastSubmitted = localStorage.getItem('edsa_feedback_last_submitted_v1');
    const now = Date.now();
    const cooldownDays = 5 * 24 * 60 * 60 * 1000;

    if (!lastSubmitted || now - Number(lastSubmitted) > cooldownDays) {
      const timer = setTimeout(() => {
        if (!hasAutoPrompted) {
          setIsOpen(true);
          setHasAutoPrompted(true);
        }
      }, 18000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('open-emoji-feedback', handleOpenEvent);
      };
    }

    return () => {
      window.removeEventListener('open-emoji-feedback', handleOpenEvent);
    };
  }, [hasAutoPrompted]);

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
        localStorage.setItem('edsa_feedback_last_submitted_v1', Date.now().toString());

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
    <>
      {/* Floating launcher trigger pill at bottom-right */}
      {!isOpen && (
        <aside aria-label="Feedback launcher" className="fixed bottom-20 right-4 z-40 md:bottom-24 md:right-6">
          <motion.button
            onClick={() => {
              setSubmitted(false);
              setIsOpen(true);
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-white border border-yellow-400/30 hover:border-yellow-400/60 shadow-xl backdrop-blur-xl transition-all group"
            title="Give quick feedback"
            aria-label="Give quick feedback"
          >
            <span className="text-base group-hover:scale-125 transition-transform duration-200">😊</span>
            <span className="text-xs font-bold text-yellow-300">Feedback</span>
          </motion.button>
        </aside>
      )}

      {/* Main Modal Popup */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-center overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="Close feedback modal"
              >
                <X className="w-5 h-5" />
              </button>

              {submitted ? (
                /* Success State */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-8 space-y-4 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white">Thank You!</h3>
                    <p className="text-xs text-gray-300 max-w-xs mx-auto">
                      Your reaction has been sent directly to the EDSA Tracker operations inbox.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-block text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Feedback Recorded ✓
                    </span>
                  </div>
                </motion.div>
              ) : (
                /* Interactive Form State */
                <div className="space-y-6">
                  {/* Header Badge */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-[10px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Citizen Pulse</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      How is your experience?
                    </h2>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Tap an emoji to rate your experience with EDSA Tracker today.
                    </p>
                  </div>

                  {/* 3 Large Emojis: Sad, Happy, Excited */}
                  <div className="grid grid-cols-3 gap-3">
                    {EMOJI_OPTIONS.map((opt) => {
                      const isSelected = selectedEmoji === opt.type;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => handleSelectEmoji(opt.type)}
                          className={`group relative p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 active:scale-95 ${
                            isSelected
                              ? `${opt.selectedClass} shadow-xl scale-105`
                              : `bg-white/5 border-white/10 ${opt.colorClass}`
                          }`}
                        >
                          <span className={`text-4xl sm:text-5xl transition-transform duration-200 ${isSelected ? 'scale-110 animate-bounce' : 'group-hover:scale-110'}`}>
                            {opt.emoji}
                          </span>
                          <span className="text-xs font-black tracking-wide">
                            {opt.label}
                          </span>
                          <span className="text-[9px] text-gray-400 font-semibold leading-tight text-center">
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
                      className="space-y-3.5 text-left pt-1"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-300">
                          Add a quick note <span className="text-gray-500 font-normal">(optional)</span>
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-yellow-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-yellow-400" />
                          <span>Your Community / Area</span>
                          <span className="text-gray-500 font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          maxLength={80}
                          placeholder="e.g. Lumley, Aberdeen, Kissy, Bo..."
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-yellow-400"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 active:scale-95 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
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

                  {!selectedEmoji && (
                    <p className="text-[11px] text-gray-500">
                      Tap one of the emojis above to send your quick rating.
                    </p>
                  )}

                  <div className="pt-2 border-t border-white/5">
                    <a
                      href="/feedback"
                      onClick={() => setIsOpen(false)}
                      className="text-[11px] text-gray-400 hover:text-yellow-300 underline transition-colors"
                    >
                      Want to submit a detailed report or suggestion? Open full form →
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
