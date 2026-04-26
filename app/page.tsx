'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Smartphone, Zap, BarChart3, AlertTriangle, ChevronRight, Activity, Map } from 'lucide-react';
import SafetyGuidelines from '@/app/components/SafetyGuidelines';
import WorkSlider from '@/components/WorkSlider';

const highlights = [
  {
    icon: Zap,
    title: 'Live Community Signals',
    description: 'Track what is happening around Freetown in real time with location-aware power reporting.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: AlertTriangle,
    title: 'Hazard Escalation',
    description: 'Capture dangerous lines, poles, and illegal connections with evidence and exact local details.',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
  {
    icon: ShieldCheck,
    title: 'Admin Control Center',
    description: 'Review incidents, resolve them quickly, and export clean operational reports for stakeholders.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
];

const featurePills = [
  'GPS-Verified',
  'Hazard Evidence',
  'Real-Time Status',
  'WhatsApp Sharing',
];

export default function WelcomePage() {
  return (
    <main className="min-h-screen relative text-white selection:bg-yellow-500/30 overflow-x-hidden bg-[#020305]">
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("/assets/hero-bg.png")',
          filter: 'brightness(0.3) saturate(1.2)',
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#020305]/80 to-[#020305]" />

      <section className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-20 lg:py-32">
        {/* Mobile-First Hero */}
        <div className="flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-300">EDSA Native Platform</p>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black leading-[1.1] tracking-tight">
              Freetown Power & Hazard <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Operations.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-xl">
              Professional mobile control surface for electricity status reporting, hazard escalation, and operational oversight.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/tracker"
                className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-yellow-400 px-8 py-4 text-sm font-black text-gray-950 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-yellow-400/20"
              >
                Launch Live Tracker
                <div className="bg-gray-950/10 rounded-lg p-1 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
              
              <div className="flex flex-wrap gap-2">
                {featurePills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 backdrop-blur-md"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Featured Visual Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-2">
              <WorkSlider />
            </div>
            {/* Ambient Glow */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-yellow-500/20 blur-[100px] rounded-full" />
          </motion.div>
        </div>

        {/* Action Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
           <motion.div 
             whileHover={{ y: -5 }}
             className="group p-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl hover:border-yellow-400/30 transition-all"
           >
              <div className="flex items-start justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                  <Activity className="h-7 w-7 text-yellow-400" />
                </div>
                <Zap className="h-5 w-5 text-yellow-300/30" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Community Interface</h3>
              <p className="text-gray-400 leading-relaxed mb-8">
                Designed for field agents and citizens to report outages and dangers with automatic GPS area detection.
              </p>
              <Link href="/tracker" className="inline-flex items-center gap-2 text-yellow-400 font-bold group-hover:gap-3 transition-all">
                Access Tracker <ChevronRight className="h-4 w-4" />
              </Link>
           </motion.div>

           <motion.div 
             whileHover={{ y: -5 }}
             className="group p-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl hover:border-blue-400/30 transition-all"
           >
              <div className="flex items-start justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="h-7 w-7 text-blue-400" />
                </div>
                <ShieldCheck className="h-5 w-5 text-blue-300/30" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Admin Command</h3>
              <p className="text-gray-400 leading-relaxed mb-8">
                Operational dashboard for reviewing hazard reports, managing community status, and exporting data.
              </p>
              <Link href="/admin" className="inline-flex items-center gap-2 text-blue-400 font-bold group-hover:gap-3 transition-all">
                Admin Portal <ChevronRight className="h-4 w-4" />
              </Link>
           </motion.div>
        </div>

        {/* Highlights Section */}
        <section className="mt-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-white/10" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">Key Capabilities</h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={h.title}
                className="p-6 rounded-[1.75rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors"
              >
                <div className={`h-12 w-12 rounded-xl ${h.bg} flex items-center justify-center mb-6`}>
                  <h.icon className={`h-5 w-5 ${h.color}`} />
                </div>
                <h4 className="font-bold text-lg mb-2">{h.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{h.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="mt-20">
          <SafetyGuidelines />
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full px-6 md:hidden">
        <Link
          href="/tracker"
          className="flex items-center justify-between w-full rounded-2xl bg-yellow-400 p-4 shadow-2xl shadow-yellow-400/40 text-gray-950"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-950 flex items-center justify-center">
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Field Ready</p>
              <p className="font-black text-sm">Open Live Tracker</p>
            </div>
          </div>
          <ChevronRight className="h-6 w-6" />
        </Link>
      </div>

      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 text-gray-500">
             <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
               <Map className="h-4 w-4" />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest">Freetown Operations Unit</p>
          </div>
          <p className="text-xs text-gray-600 font-medium tracking-tight">
            © {new Date().getFullYear()} EDSA Native Platform. Designed for daily field use.
          </p>
        </div>
      </footer>
    </main>
  );
}
