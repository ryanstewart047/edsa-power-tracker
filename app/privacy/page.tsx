import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — EDSA Power Tracker',
  description: 'Privacy Policy for the EDSA Power Tracker app by BridgeTech IT Services.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 18, 2026';
  const contactEmail = 'support@itservicesfreetown.com';
  const contactPhone = '+23233399391';
  const companyName = 'BridgeTech IT Services';
  const appName = 'EDSA Power Tracker';

  return (
    <main className="min-h-screen bg-white text-slate-900 px-4 py-16 md:py-24 relative overflow-hidden">
      {/* Subtle ambient gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/60 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-50/70 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto space-y-10 relative z-10">

        {/* Header */}
        <div className="space-y-2 border-b border-slate-200 pb-8 scroll-reveal">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">Legal Document</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{appName}</span> — Developed by {companyName}
          </p>
          <p className="text-xs text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Introduction */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">1. Introduction</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {companyName} (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the <strong>{appName}</strong> mobile and web application (&ldquo;the App&rdquo;). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our App. By using the App, you agree to the collection and use of information as described in this policy.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">2. Information We Collect</h2>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 mb-1">a) Location Data</h3>
              <p>We collect your approximate or precise GPS location when you submit a power outage report or hazard escalation. Location data is used solely to accurately identify the geographic area of the reported incident. We do not track your location in the background.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 mb-1">b) Community Area Selection</h3>
              <p>We store your selected primary community area locally on your device (via browser localStorage) to personalize power status displays. This data is not transmitted to our servers.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 mb-1">c) Usage Data</h3>
              <p>We may collect anonymous usage data such as pages visited, features used, and session duration to improve app performance. This data does not identify you personally.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 mb-1">d) Submitted Reports</h3>
              <p>When you submit a power outage or hazard report, we collect the content of your submission including description, severity level, and attached location coordinates. Reports may be shared with relevant EDSA operational teams.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 mb-1">e) AI Chat Messages</h3>
              <p>Messages sent to our AI assistant are processed via the Groq API to generate responses. We do not store chat conversation history on our servers after the session ends.</p>
            </div>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2 leading-relaxed">
            <li>To process and display crowdsourced power outage and hazard reports across Freetown.</li>
            <li>To provide location-specific electricity status information to users.</li>
            <li>To escalate electrical hazard reports to EDSA operational response teams.</li>
            <li>To power the AI assistant for electricity-related queries.</li>
            <li>To improve the performance, features, and usability of the App.</li>
            <li>To send push notifications about power status updates in your area (only with your permission).</li>
          </ul>
        </section>

        {/* Data Sharing */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">4. Data Sharing & Disclosure</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>We do <strong className="text-slate-900">not</strong> sell, rent, or trade your personal data to third parties for marketing purposes. We may share data in the following limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-slate-900">EDSA Operations:</strong> Verified hazard and fault reports may be forwarded to relevant EDSA teams for emergency response.</li>
              <li><strong className="text-slate-900">Service Providers:</strong> We use Groq (AI processing), Vercel (hosting), and Prisma/PostgreSQL (database). These providers are bound by their own privacy terms.</li>
              <li><strong className="text-slate-900">Legal Requirements:</strong> We may disclose information if required by law or to protect the rights, safety, or property of our users or the public.</li>
            </ul>
          </div>
        </section>

        {/* Data Retention */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">5. Data Retention</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Submitted outage and hazard reports are retained in our database for operational and statistical purposes. You may request deletion of your submitted reports by contacting us at the email address below. Community area preferences stored on your device can be cleared at any time by clearing your app data.
          </p>
        </section>

        {/* Security */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">6. Security</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We implement industry-standard security measures including HTTPS encryption, secure database connections, and environment variable protection for API keys. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        {/* Children */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">7. Children&apos;s Privacy</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The App is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.
          </p>
        </section>

        {/* Your Rights */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">8. Your Rights & Data Deletion</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You have the right to access, correct, or request deletion of personal data we hold about you. To submit a formal data deletion request or learn how your data is handled, visit our dedicated <Link href="/data-deletion" className="text-blue-600 underline font-semibold hover:text-blue-700">User Data Deletion Request Page</Link> or contact us directly at <a href={`mailto:${contactEmail}`} className="text-blue-600 underline hover:text-blue-700">{contactEmail}</a>.
          </p>
        </section>

        {/* Changes */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">9. Changes to This Policy</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Continued use of the App after changes constitutes your acceptance of the revised policy.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-3 border-t border-slate-200 pt-8 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">10. Contact Us</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            If you have questions or concerns about this Privacy Policy, please contact us:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1 text-sm shadow-sm">
            <p className="font-black text-slate-900">{companyName}</p>
            <p className="text-slate-600">Email: <a href={`mailto:${contactEmail}`} className="text-blue-600 underline hover:text-blue-700">{contactEmail}</a></p>
            <p className="text-slate-600">Phone: <a href={`tel:${contactPhone}`} className="text-blue-600 underline hover:text-blue-700">{contactPhone}</a></p>
            <p className="text-slate-600">Location: Freetown, Sierra Leone</p>
          </div>
        </section>

        {/* Legal & Support Links */}
        <section className="border-t border-slate-200 pt-8 space-y-3 scroll-reveal">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Related Legal & Support</p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/feedback" className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-blue-600 font-semibold transition-colors">
              Give Feedback
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
