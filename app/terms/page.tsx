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
    <main className="min-h-screen bg-[#020617] text-white px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Header */}
        <div className="space-y-2 border-b border-white/10 pb-8">
          <p className="text-xs font-black uppercase tracking-widest text-yellow-500">Legal Agreement</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Terms and Conditions</h1>
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-white">{appName}</span> — Operated by {companyName}
          </p>
          <p className="text-xs text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        {/* 1. Acceptance */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">1. Acceptance of Terms</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            By downloading, installing, accessing, or using the <strong>{appName}</strong> mobile application or web platform (&ldquo;the App&rdquo;), you agree to be bound by these Terms and Conditions (&ldquo;Terms&rdquo;) and our{' '}
            <Link href="/privacy" className="text-yellow-400 underline hover:text-yellow-300">
              Privacy Policy
            </Link>. If you do not agree to these Terms, do not install or use the App.
          </p>
        </section>

        {/* 2. Nature of the App */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">2. Service Description & Community Purpose</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            {appName} is a community-driven electricity tracking and civic reporting platform developed by {companyName} for residents, businesses, and public service personnel in Freetown, Sierra Leone. The App provides crowdsourced power grid visibility, AI-assisted consumer guidance, and emergency electrical hazard escalation.
          </p>
        </section>

        {/* 3. User Conduct & Reporting Integrity */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">3. User Conduct & Reporting Rules</h2>
          <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
            <p>To maintain safety and grid data integrity for all citizens, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>
                <strong className="text-white">Submit Accurate Reports:</strong> Only submit power outage reports or restoration confirmations that genuinely reflect the electrical status of your current community.
              </li>
              <li>
                <strong className="text-white">Emergency & Hazard Escalation:</strong> Only use the hazard reporting tool for real, observable electrical emergencies (e.g. fallen power cables, transformer explosions, smoking poles, low-hanging high-voltage wires).
              </li>
              <li>
                <strong className="text-white">No False Alarms or Spam:</strong> Submitting fabricated, prank, or maliciously misleading outage or hazard reports is strictly prohibited. We reserve the right to ban offending devices and IP addresses from the network.
              </li>
              <li>
                <strong className="text-white">Lawful Use:</strong> Use the App only for lawful civic, personal, and commercial purposes within the Republic of Sierra Leone and applicable international law.
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Location & Device Permissions */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">4. Location & Device Permissions</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            To anchor power reports and hazard dispatches to the correct geographic feeder zone, the App may request one-time access to your device&rsquo;s GPS location when reporting. Location data is processed strictly in accordance with our{' '}
            <Link href="/privacy" className="text-yellow-400 underline hover:text-yellow-300">
              Privacy Policy
            </Link>
            . We do not track your background location.
          </p>
        </section>

        {/* 5. AI Assistant & Guidance Disclaimer */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">5. AI Assistant & Advisory Disclaimer</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            The integrated AI chatbot provides general electricity advice, tariff information, and electrical safety suggestions. Responses are generated through automated artificial intelligence and are provided for informational purposes only. In the event of severe electrical hazards or fire, always contact emergency services and national utility hotlines immediately.
          </p>
        </section>

        {/* 6. Disclaimers & Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">6. Disclaimers & Limitation of Liability</h2>
          <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
            <p>
              The App is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. While {companyName} takes diligent measures to verify crowdsourced data and maintain platform uptime, we do not warrant that grid status reports are 100% error-free, uninterrupted, or real-time up to the second.
            </p>
            <p>
              {companyName}, its developers, and affiliates shall not be liable for any direct, indirect, incidental, or consequential damages resulting from power supply disruptions, electrical equipment failure, or reliance on community-reported data.
            </p>
          </div>
        </section>

        {/* 7. Changes to Terms */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">7. Changes to Terms</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            We reserve the right to revise or replace these Terms at any time. When changes are made, the &ldquo;Last updated&rdquo; date at the top of this document will be updated. Continued use of the App following any changes constitutes acceptance of the new Terms.
          </p>
        </section>

        {/* 8. Contact Information */}
        <section className="space-y-3 border-t border-white/10 pt-8">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">8. Contact Us</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            If you have any questions or feedback regarding these Terms and Conditions, please contact us:
          </p>
          <div className="space-y-1.5 text-sm text-gray-300">
            <p><strong className="text-white">Organization:</strong> {companyName}</p>
            <p><strong className="text-white">Email:</strong>{' '}
              <a href={`mailto:${contactEmail}`} className="text-yellow-400 underline hover:text-yellow-300">
                {contactEmail}
              </a>
            </p>
            <p><strong className="text-white">Phone:</strong>{' '}
              <a href={`tel:${contactPhone}`} className="text-yellow-400 underline hover:text-yellow-300">
                {contactPhone}
              </a>
            </p>
            <p><strong className="text-white">Location:</strong> Freetown, Western Area, Sierra Leone</p>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-gray-400">
          <Link href="/" className="hover:text-yellow-400 transition-colors">
            ← Return to Home
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-yellow-400 transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/data-deletion" className="hover:text-yellow-400 transition-colors">
            Data Deletion
          </Link>
        </div>

      </div>
    </main>
  );
}
