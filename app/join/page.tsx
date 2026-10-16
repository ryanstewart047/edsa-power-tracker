'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Mail,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Users,
  Star,
  Clock,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

const PLAY_STORE_LINK = 'https://play.google.com/store/apps/details?id=com.bridgetech.edsapowertracker';
const PLAY_TESTING_OPTIN_LINK = 'https://play.google.com/apps/testing/com.bridgetech.edsapowertracker';

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
    <main className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-100/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-50/70 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tracker
          </Link>
        </div>

        {/* Logo & Branding */}
        <div className="text-center mb-8 scroll-reveal">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Zap className="w-7 h-7 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-slate-900">
            EDSA Power Tracker
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xs mx-auto">
            Real-time electricity outage tracking, token vault &amp; prepaid alerts — built for Freetown.
          </p>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-5 mb-6 text-xs text-slate-500 scroll-reveal">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Free for Sierra Leone
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            Android App
          </span>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100 scroll-reveal">
          {success ? (
            /* Success state with 15-minute wait time guidance */
            <div className="space-y-5 text-left">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Email Captured!</h2>
                <p className="text-slate-600 text-xs">
                  Your email has been sent to our developer team for enrollment.
                </p>
              </div>

              {/* 15-minute callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Please wait at least 15 minutes</span>
                </div>
                <p className="text-amber-800/90 text-xs leading-relaxed">
                  We need to manually add your email to the Google Play Console closed tester list. Google Play takes about <strong>15 minutes</strong> to sync and activate access.
                </p>
                <p className="text-amber-700 text-[11px]">
                  ⚠️ If you tap the links immediately before 15 minutes, Google may show <em>&quot;Item isn&apos;t available in your country&quot;</em>.
                </p>
              </div>

              {/* Action Buttons for after 15 min */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  After 15 minutes, open these links:
                </div>

                <a
                  href={PLAY_TESTING_OPTIN_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between shadow-md shadow-blue-500/20 active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-black">1</span>
                    <span>Join on Web (Accept Invite)</span>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <a
                  href={PLAY_STORE_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between shadow-md active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-black">2</span>
                    <span>Join on Android (Play Store)</span>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="text-center pt-2 border-t border-slate-200 space-y-2">
                <p className="text-slate-500 text-[11px]">
                  We also sent these instructions and direct links to your inbox.
                </p>
                <button
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="text-blue-600 text-xs font-semibold hover:underline"
                >
                  Register another email
                </button>
              </div>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full mb-3">
                  <Mail className="w-3 h-3 text-blue-600" />
                  Closed Testing Access
                </div>
                <h2 className="text-xl font-black text-slate-900">Join Closed Testing</h2>
                <p className="text-slate-600 text-xs mt-1">
                  Enter your Google Play email to be added to our official tester list.
                </p>
              </div>

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Your name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mohamed Kamara"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Google Play Email address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <p className="text-[11px] text-slate-500">
                  Use the email logged into your Android Google Play Store.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting email...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Email for Testing</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-slate-500 text-[11px]">
                You will be notified as soon as you submit. Please allow 15 min for Google Play activation.
              </p>
            </form>
          )}
        </div>

        {/* Feature bullets */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center scroll-reveal">
          {[
            { icon: '🗺️', label: 'Live outage map for Freetown' },
            { icon: '⚡', label: 'Token vault for prepaid codes' },
            { icon: '🔔', label: 'Area outage alerts' },
          ].map((f) => (
            <div key={f.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1 shadow-sm">
              <div className="text-xl">{f.icon}</div>
              <p className="text-[11px] text-slate-600 leading-tight font-medium">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
