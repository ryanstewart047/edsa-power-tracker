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
    <main className="min-h-screen bg-[#020617] text-white px-4 py-12 md:py-20 relative overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed top-1/2 -right-40 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-10 relative z-10">

        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-yellow-400 transition-colors p-2 rounded-xl bg-white/5 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tracker
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-xs font-bold uppercase tracking-widest">
            <MessageSquareHeart className="w-3.5 h-3.5" /> Tester & User Feedback
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Share Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Feedback</span>
          </h1>
          <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-2xl">
            Help us improve EDSA Power Tracker. Whether you are testing internal releases on Google Play or tracking daily power in your neighborhood, we appreciate your thoughts.
          </p>
        </div>

        {submitted ? (
          /* Submission Success State */
          <div className="bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-green-500/30 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-white">Thank You!</h2>
              <p className="text-sm text-gray-300 max-w-md mx-auto">
                Your feedback has been received and logged directly with our engineering team at BridgeTech IT Services.
              </p>
              {refId && (
                <p className="text-xs text-yellow-400 font-mono pt-2">
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
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Submit Another Response
              </button>
              <Link
                href="/tracker"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-yellow-400/20"
              >
                Return to Live Tracker
              </Link>
            </div>
          </div>
        ) : (
          /* Feedback Form */
          <form onSubmit={handleSubmit} className="space-y-8 bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Star Rating */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400">
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
                        ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400 scale-105'
                        : 'border-white/5 bg-white/5 text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    <Star className={`w-6 h-6 ${rating >= star ? 'fill-yellow-400' : ''}`} />
                  </button>
                ))}
                <span className="ml-3 text-xs font-bold text-yellow-400">
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
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400">
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
                        ? 'border-yellow-400 bg-yellow-400/15 text-white shadow-md shadow-yellow-400/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
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
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400">
                Community or Area in Freetown <span className="text-gray-600 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Lumley, Wellington, Aberdeen, Wilberforce, Central"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400">
                Your Feedback or Suggestions <span className="text-yellow-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you like, what is not working, or what features you want to see next..."
                rows={5}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
              />
            </div>

            {/* Contact Details (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400">
                  Your Name <span className="text-gray-600 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Samuel Kargbo"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400">
                  Your Email <span className="text-gray-600 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. samuel@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:flex-1 py-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20"
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
                className="w-full sm:w-auto px-5 py-4 rounded-xl bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2"
              >
                💬 Chat on WhatsApp
              </a>
            </div>
          </form>
        )}

        {/* Developer Contact Box */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-base font-black uppercase tracking-tight text-yellow-400">
            Direct Developer & Support Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5">
              <Mail className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Email Support</p>
                <a href={`mailto:${contactEmail}`} className="text-xs text-white hover:text-yellow-400 underline break-all">
                  {contactEmail}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5">
              <Phone className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Phone / WhatsApp</p>
                <a href={`tel:${contactPhone}`} className="text-xs text-white hover:text-yellow-400">
                  {contactPhone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5">
              <MapPin className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Location</p>
                <p className="text-xs text-white">BridgeTech IT Services, Freetown</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
