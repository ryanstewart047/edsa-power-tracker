'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MessageSquareHeart, 
  Send, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowLeft,
  Loader2
} from 'lucide-react';

const CATEGORIES = [
  { id: 'experience', label: 'App Experience & UI', icon: '💡' },
  { id: 'outage-accuracy', label: 'Power Status Accuracy', icon: '⚡' },
  { id: 'hazard-reporting', label: 'Hazard & Safety Reports', icon: '🚨' },
  { id: 'ai-assistant', label: 'AI Chatbot Performance', icon: '🤖' },
  { id: 'bug-report', label: 'Bug or Glitch Report', icon: '🐛' },
  { id: 'feature-request', label: 'Feature Request', icon: '🌟' },
];

export default function FeedbackPage() {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('experience');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const contactEmail = 'support@itservicesfreetown.com';
  const contactPhone = '+23233399391';
  const whatsappUrl = `https://wa.me/23233399391?text=${encodeURIComponent(
    `Hello BridgeTech Team, I have feedback regarding EDSA Power Tracker:\n\nRating: ${rating}/5\nCategory: ${category}\nArea: ${area || 'Freetown'}\n\n${message || 'Great app!'}`
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a brief message or description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          area: area.trim() || undefined,
          category,
          rating,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setRefId(data.refId || `FB-${Date.now().toString(36).toUpperCase()}`);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 px-4 py-12 md:py-20 relative overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-100/60 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed top-1/2 -right-40 w-96 h-96 bg-indigo-50/70 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-10 relative z-10">

        {/* Back Link */}
        <div className="scroll-reveal">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tracker
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3 border-b border-slate-200 pb-8 scroll-reveal">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest">
            <MessageSquareHeart className="w-3.5 h-3.5 text-blue-600" /> Tester & User Feedback
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            Share Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Feedback</span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl">
            Help us improve EDSA Power Tracker. Whether you are testing internal releases on Google Play or tracking daily power in your neighborhood, we appreciate your thoughts.
          </p>
        </div>

        {!submitted && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center space-y-3 shadow-sm scroll-reveal">
            <p className="text-xs font-bold text-slate-700">
              ⚡ Short on time? Tap an emoji for a quick 1-tap reaction:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('open-emoji-feedback'));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <span className="text-xl">😞</span>
                <span>Sad / Issues</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('open-emoji-feedback'));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <span className="text-xl">😊</span>
                <span>Happy / Good</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('open-emoji-feedback'));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <span className="text-xl">🤩</span>
                <span>Excited / Loving it</span>
              </button>
            </div>
          </div>
        )}

        {submitted ? (
          /* Submission Success State */
          <div className="bg-slate-50 border border-emerald-300 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">Thank You!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your feedback has been received and logged directly with our engineering team at BridgeTech IT Services.
              </p>
              {refId && (
                <p className="text-xs text-blue-600 font-mono pt-2">
                  Reference ID: <span className="font-bold">{refId}</span>
                </p>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Submit Another Response
              </button>
              <Link
                href="/tracker"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
              >
                Return to Live Tracker
              </Link>
            </div>
          </div>
        ) : (
          /* Feedback Form */
          <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100 scroll-reveal">

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Star Rating */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Overall Experience Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-xl border transition-all ${
                      rating >= star
                        ? 'border-blue-300 bg-blue-50 text-blue-600 scale-105'
                        : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Star className={`w-6 h-6 ${rating >= star ? 'fill-blue-600' : ''}`} />
                  </button>
                ))}
                <span className="ml-3 text-xs font-bold text-blue-600">
                  {rating === 5 && 'Outstanding ⭐⭐⭐⭐⭐'}
                  {rating === 4 && 'Good Experience ⭐⭐⭐⭐'}
                  {rating === 3 && 'Average / Fair ⭐⭐⭐'}
                  {rating === 2 && 'Needs Improvement ⭐⭐'}
                  {rating === 1 && 'Poor Experience ⭐'}
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                What is your feedback about?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                      category === cat.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Area / Community */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Community or Area in Freetown <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Lumley, Wellington, Aberdeen, Wilberforce, Central"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Your Feedback or Suggestions <span className="text-blue-600">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you like, what is not working, or what features you want to see next..."
                rows={5}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
              />
            </div>

            {/* Contact Details (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Your Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohamed Kamara"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Your Email <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. mohamed@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Feedback
                  </>
                )}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                💬 Chat on WhatsApp
              </a>
            </div>
          </form>
        )}

        {/* Developer Contact Box */}
        <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm scroll-reveal">
          <h2 className="text-base font-black uppercase tracking-tight text-blue-600">
            Direct Developer & Support Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <Mail className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Email Support</p>
                <a href={`mailto:${contactEmail}`} className="text-xs text-slate-900 hover:text-blue-600 underline break-all">
                  {contactEmail}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Phone / WhatsApp</p>
                <a href={`tel:${contactPhone}`} className="text-xs text-slate-900 hover:text-blue-600">
                  {contactPhone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <MapPin className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Location</p>
                <p className="text-xs text-slate-900">BridgeTech IT Services, Freetown</p>
              </div>
            </div>
          </div>
        </section>

        {/* Legal & Support Links */}
        <section className="border-t border-slate-200 pt-8 space-y-3 scroll-reveal">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Related Legal & Support</p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/privacy" className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-blue-600 font-semibold transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-blue-600 font-semibold transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/data-deletion" className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-blue-600 font-semibold transition-colors">
              Data Deletion
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
