'use client';

import { useState } from 'react';
import { Zap, Mail, CheckCircle2, Loader2, ArrowRight, Users, Star } from 'lucide-react';

export default function JoinPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), source: 'join-page' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSuccess(data.message);
        setEmail('');
        setName('');
      }
    } catch {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020305] text-white flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#2607d5]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[#2607d5]/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2607d5] flex items-center justify-center shadow-xl shadow-[#2607d5]/30">
              <Zap className="w-7 h-7 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            EDSA Power Tracker
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
            Real-time electricity outage tracking, token vault &amp; prepaid alerts — built for Freetown.
          </p>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-5 mb-8 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#2607d5]" />
            Free for Sierra Leone
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Android App
          </span>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">

          {success ? (
            /* Success state */
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white">You&apos;re in!</h2>
              <p className="text-gray-300 text-sm leading-relaxed">{success}</p>
              <p className="text-gray-500 text-xs">
                Check your inbox (and spam folder) for the download link.
              </p>
              <button
                onClick={() => setSuccess(null)}
                className="text-[#6d8ef0] text-xs underline underline-offset-2 hover:text-blue-300 transition-colors"
              >
                Register another email
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#6d8ef0] bg-[#2607d5]/15 border border-[#2607d5]/30 px-3 py-1.5 rounded-full mb-3">
                  <Mail className="w-3 h-3" />
                  Get the Download Link
                </div>
                <h2 className="text-xl font-black text-white">Get early access</h2>
                <p className="text-gray-400 text-xs mt-1">
                  Enter your email and we&apos;ll send you the Google Play link instantly.
                </p>
              </div>

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">Your name <span className="text-gray-600 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Mohamed Kamara"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-[#2607d5] focus:bg-white/8 transition-colors"
                />
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">Email address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-[#2607d5] focus:bg-white/8 transition-colors"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 rounded-xl bg-[#2607d5] hover:bg-[#1d05aa] text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#2607d5]/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Me the Download Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-gray-600 text-[11px]">
                We only use your email to send the download link. No spam, ever.
              </p>
            </form>
          )}
        </div>

        {/* Feature bullets */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🗺️', label: 'Live outage map for Freetown' },
            { icon: '⚡', label: 'Token vault for prepaid codes' },
            { icon: '🔔', label: 'Area outage alerts' },
          ].map((f) => (
            <div key={f.label} className="bg-white/3 border border-white/8 rounded-2xl p-3 space-y-1">
              <div className="text-xl">{f.icon}</div>
              <p className="text-[11px] text-gray-400 leading-tight">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
