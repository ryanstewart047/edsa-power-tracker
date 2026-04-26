import Link from 'next/link';
import { ArrowRight, ShieldCheck, Smartphone, Zap, BarChart3, AlertTriangle } from 'lucide-react';
import SafetyGuidelines from '@/app/components/SafetyGuidelines';

const highlights = [
  {
    icon: Zap,
    title: 'Live Community Power Signals',
    description: 'Track what is happening around Freetown in real time with location-aware power reporting.',
  },
  {
    icon: AlertTriangle,
    title: 'Hazard Escalation',
    description: 'Capture dangerous lines, poles, and illegal connections with evidence and exact local details.',
  },
  {
    icon: ShieldCheck,
    title: 'Admin Control Center',
    description: 'Review incidents, resolve them quickly, and export clean operational reports for stakeholders.',
  },
];

const featurePills = [
  'Location-verified reporting',
  'Hazard evidence capture',
  'Real-time power status updates',
  'Excel export and WhatsApp sharing',
];

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_34%),linear-gradient(180deg,_#08121f_0%,_#05070d_48%,_#020305_100%)] text-white">
      <section className="max-w-6xl mx-auto px-6 py-8 sm:py-12">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/15 ring-1 ring-yellow-400/20">
                <Zap className="h-7 w-7 text-yellow-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-yellow-300/80">EDSA Native Platform</p>
                <h1 className="text-2xl font-bold sm:text-3xl">Power and hazard operations, designed for daily field use.</h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/tracker"
                className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 transition-transform hover:-translate-y-0.5 hover:bg-yellow-300"
              >
                Open Live Tracker
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="max-w-3xl text-lg leading-8 text-gray-200 sm:text-xl">
                  A professional mobile-first control surface for electricity status reporting, hazard escalation, and operational oversight across Freetown.
                </p>
                <div className="flex flex-wrap gap-2">
                  {featurePills.map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-gray-200"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Field Ready</p>
                  <p className="mt-3 text-3xl font-bold text-white">24/7</p>
                  <p className="mt-2 text-sm text-gray-400">Built for continuous monitoring and incident response.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Admin Workflow</p>
                  <p className="mt-3 text-3xl font-bold text-white">Secure</p>
                  <p className="mt-2 text-sm text-gray-400">Dedicated access control, reset flow, and reporting tools.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Distribution</p>
                  <p className="mt-3 text-3xl font-bold text-white">Fast</p>
                  <p className="mt-2 text-sm text-gray-400">Export overview reports and share operational summaries quickly.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6">
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10 text-green-300">
                  <Smartphone className="h-5 w-5" />
                </div>
                Native-style entry experience
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-[#0d1521] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Community app</p>
                    <Zap className="h-4 w-4 text-yellow-300" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Citizens and field agents can open the live tracker to report outages or hazards with GPS validation.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#0d1521] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Admin workspace</p>
                    <BarChart3 className="h-4 w-4 text-blue-300" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Authorized administrators can sign in, review incoming hazards, export overview data, and share summaries.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#0d1521] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300/80">Recommended flow</p>
                  <ol className="mt-3 space-y-3 text-sm text-gray-300">
                    <li>1. Start with the live tracker for public reporting.</li>
                    <li>2. Use admin sign-in for operations and report management.</li>
                    <li>3. Export and share the overview when leadership needs updates.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-black/20 backdrop-blur-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-yellow-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-gray-400">{description}</p>
            </article>
          ))}
        </section>

        <SafetyGuidelines />
      </section>
    </main>
  );
}
