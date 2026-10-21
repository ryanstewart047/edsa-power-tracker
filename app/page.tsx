'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, BarChart3, AlertTriangle, ChevronRight, Activity, Smartphone, KeyRound, MapPin } from 'lucide-react';
import SafetyGuidelines from '@/app/components/SafetyGuidelines';
import WorkSlider from '@/components/WorkSlider';
import NewsEventsSlider from '@/components/NewsEventsSlider';
import AdUnit from '@/components/AdUnit';

const highlights = [
  {
    icon: Zap,
    title: 'Live Community Signals',
    description: 'Track power and hazards across Sierra Leone in real time with location-aware reporting.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border border-blue-200/60',
  },
  {
    icon: AlertTriangle,
    title: 'Hazard Escalation',
    description: 'Capture dangerous lines, poles, and illegal connections with evidence and exact local details.',
    color: 'text-rose-600',
    bg: 'bg-rose-50 border border-rose-200/60',
  },
  {
    icon: ShieldCheck,
    title: 'Admin Control Center',
    description: 'Review incidents, resolve them quickly, and export clean operational reports for stakeholders.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border border-indigo-200/60',
  },
];

const featurePills = [
  { label: 'GPS-Verified', href: '/tracker', icon: MapPin },
  { label: 'Meter Top-Up', href: '/topup?tab=buy', icon: Smartphone },
  { label: 'Token Vault', href: '/topup?tab=vault', icon: KeyRound },
  { label: 'Hazard Evidence', href: '/tracker', icon: AlertTriangle },
  { label: 'Real-Time Status', href: '/tracker', icon: Activity },
];

export default function WelcomePage() {
  return (
    <main className="min-h-screen relative text-slate-900 bg-white selection:bg-blue-600/20 selection:text-blue-900 overflow-x-hidden">
      {/* Clean ambient radial gradient for light theme */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(37,99,235,0.08),rgba(255,255,255,0))] pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_70%,rgba(99,102,241,0.05),rgba(255,255,255,0))] pointer-events-none" />

      <section className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-16 lg:py-24">
        {/* Mobile-First Hero */}
        <div className="flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">EDSA Native Platform</p>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black leading-[1.1] tracking-tight text-slate-900">
              Sierra Leone Power & Hazard <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800">Operations.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl">
              Professional mobile control surface for electricity status reporting, hazard escalation, and operational oversight across Sierra Leone.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/tracker"
                className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-8 py-4 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-600/25"
              >
                Launch Live Tracker
                <div className="bg-white/20 rounded-lg p-1 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>

              <div className="flex flex-wrap gap-2 items-center">
                {featurePills.map((pill) => (
                  <Link
                    key={pill.label}
                    href={pill.href}
                    className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <pill.icon className="h-3 w-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span>{pill.label}</span>
                    <ChevronRight className="h-2.5 w-2.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Featured Visual Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="rounded-[2.5rem] overflow-hidden border border-slate-200/90 bg-white shadow-2xl p-2.5">
              <WorkSlider />
            </div>
            {/* Ambient Glow */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
          </motion.div>
        </div>

        {/* Action Cards with Scroll-Driven Reveal */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            className="scroll-reveal group p-8 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Activity className="h-7 w-7 text-blue-600" />
                </div>
                <Zap className="h-5 w-5 text-blue-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Live Tracker</h3>
              <p className="text-slate-600 leading-relaxed mb-8 text-sm">
                Designed for field agents and citizens to report outages and dangers with automatic GPS area detection.
              </p>
            </div>
            <Link href="/tracker" className="inline-flex items-center gap-2 text-blue-600 font-bold group-hover:gap-3 transition-all text-sm">
              Access Tracker <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            className="scroll-reveal group p-8 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Smartphone className="h-7 w-7 text-emerald-600" />
                </div>
                <KeyRound className="h-5 w-5 text-emerald-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Meter Top-Up & Vault</h3>
              <p className="text-slate-600 leading-relaxed mb-8 text-sm">
                Instant USSD quick-dial for Orange & Afrimoney, kWh units calculator, and offline 20-digit token storage.
              </p>
            </div>
            <Link href="/topup" className="inline-flex items-center gap-2 text-emerald-600 font-bold group-hover:gap-3 transition-all text-sm">
              Meter Top-Up & Vault <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            className="scroll-reveal group p-8 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <BarChart3 className="h-7 w-7 text-indigo-600" />
                </div>
                <ShieldCheck className="h-5 w-5 text-indigo-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Admin Command</h3>
              <p className="text-slate-600 leading-relaxed mb-8 text-sm">
                Operational dashboard for reviewing hazard reports, managing community status, and exporting data.
              </p>
            </div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-indigo-600 font-bold group-hover:gap-3 transition-all text-sm">
              Admin Portal <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        {/* EDSA News & Events Section (Sliding Cards with Pop-Up) */}
        <div className="mt-20 scroll-reveal">
          <NewsEventsSlider />
        </div>

        {/* Highlights Section with Scroll-Driven Reveal */}
        <section className="mt-24 scroll-reveal">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Key Capabilities</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                key={h.title}
                className="scroll-reveal p-6 rounded-[1.75rem] bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all shadow-sm"
              >
                <div className={`h-12 w-12 rounded-xl ${h.bg} flex items-center justify-center mb-5`}>
                  <h.icon className={`h-5 w-5 ${h.color}`} />
                </div>
                <h4 className="font-bold text-lg mb-2 text-slate-900">{h.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{h.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Safety Guidelines with dynamic scroll reveal */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 scroll-reveal"
        >
          <SafetyGuidelines />
        </motion.div>

        <div className="mt-12 scroll-reveal">
          <AdUnit />
        </div>
      </section>
    </main>
  );
}
