import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — EDSA Power Tracker',
  description: 'Privacy Policy for the EDSA Power Tracker app by BridgeTech IT Services.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 18, 2026';
  const contactEmail = 'itservicesfreetown@gmail.com';
  const companyName = 'BridgeTech IT Services';
  const appName = 'EDSA Power Tracker';

  return (
    <main className="min-h-screen bg-[#020617] text-white px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Header */}
        <div className="space-y-2 border-b border-white/10 pb-8">
          <p className="text-xs font-black uppercase tracking-widest text-yellow-500">Legal Document</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-white">{appName}</span> — Developed by {companyName}
          </p>
          <p className="text-xs text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Introduction */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">1. Introduction</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            {companyName} (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the <strong>{appName}</strong> mobile and web application (&ldquo;the App&rdquo;). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our App. By using the App, you agree to the collection and use of information as described in this policy.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">2. Information We Collect</h2>
          <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
            <div>
              <h3 className="font-bold text-white mb-1">a) Location Data</h3>
              <p>We collect your approximate or precise GPS location when you submit a power outage report or hazard escalation. Location data is used solely to accurately identify the geographic area of the reported incident. We do not track your location in the background.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">b) Community Area Selection</h3>
              <p>We store your selected primary community area locally on your device (via browser localStorage) to personalize power status displays. This data is not transmitted to our servers.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">c) Usage Data</h3>
              <p>We may collect anonymous usage data such as pages visited, features used, and session duration to improve app performance. This data does not identify you personally.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">d) Submitted Reports</h3>
              <p>When you submit a power outage or hazard report, we collect the content of your submission including description, severity level, and attached location coordinates. Reports may be shared with relevant EDSA operational teams.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">e) AI Chat Messages</h3>
              <p>Messages sent to our AI assistant are processed via the Groq API to generate responses. We do not store chat conversation history on our servers after the session ends.</p>
            </div>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2 leading-relaxed">
            <li>To process and display crowdsourced power outage and hazard reports across Freetown.</li>
            <li>To provide location-specific electricity status information to users.</li>
            <li>To escalate electrical hazard reports to EDSA operational response teams.</li>
            <li>To power the AI assistant for electricity-related queries.</li>
            <li>To improve the performance, features, and usability of the App.</li>
            <li>To send push notifications about power status updates in your area (only with your permission).</li>
          </ul>
        </section>

        {/* Data Sharing */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">4. Data Sharing & Disclosure</h2>
          <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
            <p>We do <strong className="text-white">not</strong> sell, rent, or trade your personal data to third parties for marketing purposes. We may share data in the following limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">EDSA Operations:</strong> Verified hazard and fault reports may be forwarded to relevant EDSA teams for emergency response.</li>
              <li><strong className="text-white">Service Providers:</strong> We use Groq (AI processing), Vercel (hosting), and Prisma/PostgreSQL (database). These providers are bound by their own privacy terms.</li>
              <li><strong className="text-white">Legal Requirements:</strong> We may disclose information if required by law or to protect the rights, safety, or property of our users or the public.</li>
            </ul>
          </div>
        </section>

        {/* Data Retention */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">5. Data Retention</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Submitted outage and hazard reports are retained in our database for operational and statistical purposes. You may request deletion of your submitted reports by contacting us at the email address below. Community area preferences stored on your device can be cleared at any time by clearing your app data.
          </p>
        </section>

        {/* Security */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">6. Security</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            We implement industry-standard security measures including HTTPS encryption, secure database connections, and environment variable protection for API keys. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        {/* Children */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">7. Children&apos;s Privacy</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            The App is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.
          </p>
        </section>

        {/* Your Rights */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">8. Your Rights</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            You have the right to access, correct, or request deletion of personal data we hold about you. To exercise these rights, contact us at <a href={`mailto:${contactEmail}`} className="text-yellow-400 underline">{contactEmail}</a>.
          </p>
        </section>

        {/* Changes */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">9. Changes to This Policy</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Continued use of the App after changes constitutes your acceptance of the revised policy.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-3 border-t border-white/10 pt-8">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">10. Contact Us</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            If you have questions or concerns about this Privacy Policy, please contact us:
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-1 text-sm">
            <p className="font-black text-white">{companyName}</p>
            <p className="text-gray-400">Email: <a href={`mailto:${contactEmail}`} className="text-yellow-400 underline">{contactEmail}</a></p>
            <p className="text-gray-400">Location: Freetown, Sierra Leone</p>
          </div>
        </section>

      </div>
    </main>
  );
}
