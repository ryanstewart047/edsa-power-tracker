import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'User Data Deletion Request — EDSA Power Tracker',
  description: 'Instructions and form to request deletion of your personal data from EDSA Power Tracker by BridgeTech IT Services.',
};

export default function DataDeletionPage() {
  const lastUpdated = 'September 18, 2026';
  const contactEmail = 'support@itservicesfreetown.com';
  const contactPhone = '+23233399391';
  const companyName = 'BridgeTech IT Services';
  const appName = 'EDSA Power Tracker';

  return (
    <main className="min-h-screen bg-white text-slate-900 px-4 py-16 md:py-24 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/60 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-50/70 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto space-y-10 relative z-10">

        {/* Header */}
        <div className="space-y-2 border-b border-slate-200 pb-8 scroll-reveal">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">Google Play Compliance</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">User Data Deletion Policy & Request</h1>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{appName}</span> — Operated by {companyName}
          </p>
          <p className="text-xs text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Overview */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">1. Overview</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            In accordance with Google Play&apos;s Data Safety guidelines, {companyName} provides a clear, accessible way for users of <strong>{appName}</strong> to request the deletion of any personal information or content collected during their use of the application.
          </p>
        </section>

        {/* Types of Data Collected & How They Are Handled */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">2. Types of Data & Deletion Scope</h2>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-1">a) Community Preference (Stored Locally on Device)</h3>
              <p className="text-xs text-slate-500 mb-2">Your selected neighborhood or primary community area is stored exclusively on your device using browser local storage.</p>
              <p className="text-xs text-blue-600 font-semibold">How to delete: Clear the app storage or cache from your device Settings &gt; Apps &gt; EDSA Tracker &gt; Clear Storage, or uninstall the app.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-1">b) Submitted Outage & Hazard Reports</h3>
              <p className="text-xs text-slate-500 mb-2">When you submit a power outage report or emergency hazard escalation, your report text, severity rating, timestamp, and optional GPS coordinates are recorded on our secure servers.</p>
              <p className="text-xs text-blue-600 font-semibold">How to delete: Submit a deletion request using the instructions in Section 3 below. We will permanently delete your submitted reports from our active databases.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-1">c) AI Assistant Chat Messages</h3>
              <p className="text-xs text-slate-500">Chat messages sent to the AI assistant are processed in real-time and are not permanently linked to any user identity or stored on our servers after your session closes.</p>
            </div>
          </div>
        </section>

        {/* How to Request Data Deletion */}
        <section className="space-y-4 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">3. How to Request Data Deletion</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You can request full deletion of any data associated with your submissions by contacting our data protection team via email:
          </p>

          <div className="bg-slate-50 border border-blue-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wide text-blue-600">Submit a Request via Email</h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
              <li><strong>Send an email to:</strong> <a href={`mailto:${contactEmail}`} className="text-blue-600 underline hover:text-blue-700">{contactEmail}</a></li>
              <li><strong>Subject line:</strong> &ldquo;Data Deletion Request — EDSA Power Tracker&rdquo;</li>
              <li><strong>Information to include:</strong> Approximate date/time of any reports submitted, your reported community or area name, and any specific details to help identify your submission.</li>
            </ul>

            <div className="pt-2">
              <a
                href={`mailto:${contactEmail}?subject=Data%20Deletion%20Request%20%E2%80%94%20EDSA%20Power%20Tracker&body=Hello%20BridgeTech%20Team%2C%0A%0AI%20would%20like%20to%20request%20the%20deletion%20of%20all%20data%20associated%20with%20my%20use%20of%20the%20EDSA%20Power%20Tracker%20app.%0A%0ADetails%20(date%2C%20community%2C%20etc.)%3A%0A%0AThank%20you.`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
              >
                Send Data Deletion Request Email
              </a>
            </div>
          </div>
        </section>

        {/* Processing Timeline & Data Retention */}
        <section className="space-y-3 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">4. Processing Timeline & Retention Policy</h2>
          <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
            <p>
              • <strong>Response &amp; Deletion Timeframe:</strong> All valid deletion requests will be processed within <strong>7 business days</strong> of receipt.
            </p>
            <p>
              • <strong>Confirmation:</strong> Once your records have been permanently removed from our active database and server logs, our support team will send you a confirmation email.
            </p>
            <p>
              • <strong>Data Retention Exceptions:</strong> Fully anonymized aggregate statistics (such as the total count of power outages in Freetown over a calendar year without any personal identifiers or specific user information) may be retained for historical utility research.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="space-y-3 border-t border-slate-200 pt-8 scroll-reveal">
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-600">5. Contact Information</h2>
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
            <Link href="/privacy" className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-blue-600 font-semibold transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-blue-600 font-semibold transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
