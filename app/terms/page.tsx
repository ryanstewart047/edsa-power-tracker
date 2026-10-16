import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions — EDSA Power Tracker',
  description: 'Terms and Conditions of use for the EDSA Power Tracker app by BridgeTech IT Services.',
};

export default function TermsAndConditionsPage() {
  const lastUpdated = 'September 20, 2026';
  const contactEmail = 'support@itservicesfreetown.com';
  const contactPhone = '+23233399391';
  const companyName = 'BridgeTech IT Services';
  const appName = 'EDSA Power Tracker';

  return (
    <main className="min-h-screen bg-white text-slate-900 px-4 py-16 md:py-24 relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/60 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-50/70 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto space-y-10 relative z-10">

        {/* Header */}
        <div className="space-y-2 border-b border-slate-200 pb-8 scroll-reveal">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">Legal Agreement</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Terms and Conditions</h1>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{appName}</span> — Operated by {companyName}
          </p>
          <p className="text-xs text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        {/* 1. Acceptance */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">1. Acceptance of Terms</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            By downloading, installing, accessing, or using the <strong>{appName}</strong> mobile application or web platform (&ldquo;the App&rdquo;), you agree to be bound by these Terms and Conditions (&ldquo;Terms&rdquo;) and our{' '}
            <Link href="/privacy" className="text-blue-600 underline hover:text-blue-700">
              Privacy Policy
            </Link>. If you do not agree to these Terms, do not install or use the App.
          </p>
        </section>

        {/* 2. Nature of the App */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">2. Service Description & Community Purpose</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {appName} is a community-driven electricity tracking and civic reporting platform developed by {companyName} for residents, businesses, and public service personnel in Freetown, Sierra Leone. The App provides crowdsourced power grid visibility, AI-assisted consumer guidance, and emergency electrical hazard escalation.
          </p>
        </section>

        {/* 3. User Conduct & Reporting Integrity */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">3. User Conduct & Reporting Rules</h2>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>To maintain safety and grid data integrity for all citizens, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-900">Submit Accurate Reports:</strong> Only submit power outage reports or restoration confirmations that genuinely reflect the electrical status of your current community.
              </li>
              <li>
                <strong className="text-slate-900">Emergency & Hazard Escalation:</strong> Only use the hazard reporting tool for real, observable electrical emergencies (e.g. fallen power cables, transformer explosions, smoking poles, low-hanging high-voltage wires).
              </li>
              <li>
                <strong className="text-slate-900">No False Alarms or Spam:</strong> Submitting fabricated, prank, or maliciously misleading outage or hazard reports is strictly prohibited. We reserve the right to ban offending devices and IP addresses from the network.
              </li>
              <li>
                <strong className="text-slate-900">Lawful Use:</strong> Use the App only for lawful civic, personal, and commercial purposes within the Republic of Sierra Leone and applicable international law.
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Location & Device Permissions */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">4. Location & Device Permissions</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            To anchor power reports and hazard dispatches to the correct geographic feeder zone, the App may request one-time access to your device&rsquo;s GPS location when reporting. Location data is processed strictly in accordance with our{' '}
            <Link href="/privacy" className="text-blue-600 underline hover:text-blue-700">
              Privacy Policy
            </Link>
            . We do not track your background location.
          </p>
        </section>

        {/* 5. AI Assistant & Guidance Disclaimer */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">5. AI Assistant & Advisory Disclaimer</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The integrated AI chatbot provides general electricity advice, tariff information, and electrical safety suggestions. Responses are generated through automated artificial intelligence and are provided for informational purposes only. In the event of severe electrical hazards or fire, always contact emergency services and national utility hotlines immediately.
          </p>
        </section>

        {/* 6. Disclaimers & Limitation of Liability */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">6. Disclaimers & Limitation of Liability</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              The App is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. While {companyName} takes diligent measures to verify crowdsourced data and maintain platform uptime, we do not warrant that grid status reports are 100% error-free, uninterrupted, or real-time up to the second.
            </p>
            <p>
              {companyName}, its developers, and affiliates shall not be liable for any direct, indirect, incidental, or consequential damages resulting from power supply disruptions, electrical equipment failure, or reliance on community-reported data.
            </p>
          </div>
        </section>

        {/* 7. Changes to Terms */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">7. Changes to Terms</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We reserve the right to revise or replace these Terms at any time. When changes are made, the &ldquo;Last updated&rdquo; date at the top of this document will be updated. Continued use of the App following any changes constitutes acceptance of the new Terms.
          </p>
        </section>

        {/* 8. Contact Information */}
        <section className="space-y-3 border-t border-slate-200 pt-8 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">8. Contact Us</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            If you have any questions or feedback regarding these Terms and Conditions, please contact us:
          </p>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-sm shadow-sm">
            <p><strong className="text-slate-900">Organization:</strong> {companyName}</p>
            <p><strong className="text-slate-900">Email:</strong>{' '}
              <a href={`mailto:${contactEmail}`} className="text-blue-600 underline hover:text-blue-700">
                {contactEmail}
              </a>
            </p>
            <p><strong className="text-slate-900">Phone:</strong>{' '}
              <a href={`tel:${contactPhone}`} className="text-blue-600 underline hover:text-blue-700">
                {contactPhone}
              </a>
            </p>
            <p><strong className="text-slate-900">Location:</strong> Freetown, Western Area, Sierra Leone</p>
          </div>
        </section>

        {/* Legal & Support Links */}
        <section className="border-t border-slate-200 pt-8 space-y-3 scroll-reveal">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Related Legal & Support</p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/feedback" className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-blue-600 font-semibold transition-colors">
              Give Feedback
            </Link>
            <Link href="/privacy" className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-blue-600 font-semibold transition-colors">
              Privacy Policy
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
