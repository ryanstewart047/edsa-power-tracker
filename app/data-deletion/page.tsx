import type { Metadata } from 'next';

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
    <main className="min-h-screen bg-[#020617] text-white px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Header */}
        <div className="space-y-2 border-b border-white/10 pb-8">
          <p className="text-xs font-black uppercase tracking-widest text-yellow-500">Google Play Compliance</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">User Data Deletion Policy & Request</h1>
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-white">{appName}</span> — Operated by {companyName}
          </p>
          <p className="text-xs text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">1. Overview</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            In accordance with Google Play&apos;s Data Safety guidelines, {companyName} provides a clear, accessible way for users of <strong>{appName}</strong> to request the deletion of any personal information or content collected during their use of the application.
          </p>
        </section>

        {/* Types of Data Collected & How They Are Handled */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">2. Types of Data & Deletion Scope</h2>
          <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="font-bold text-white mb-1">a) Community Preference (Stored Locally on Device)</h3>
              <p className="text-xs text-gray-400 mb-2">Your selected neighborhood or primary community area is stored exclusively on your device using browser local storage.</p>
              <p className="text-xs text-yellow-400 font-semibold">How to delete: Clear the app storage or cache from your device Settings &gt; Apps &gt; EDSA Tracker &gt; Clear Storage, or uninstall the app.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="font-bold text-white mb-1">b) Submitted Outage & Hazard Reports</h3>
              <p className="text-xs text-gray-400 mb-2">When you submit a power outage report or emergency hazard escalation, your report text, severity rating, timestamp, and optional GPS coordinates are recorded on our secure servers.</p>
              <p className="text-xs text-yellow-400 font-semibold">How to delete: Submit a deletion request using the instructions in Section 3 below. We will permanently delete your submitted reports from our active databases.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="font-bold text-white mb-1">c) AI Assistant Chat Messages</h3>
              <p className="text-xs text-gray-400">Chat messages sent to the AI assistant are processed in real-time and are not permanently linked to any user identity or stored on our servers after your session closes.</p>
            </div>
          </div>
        </section>

        {/* How to Request Data Deletion */}
        <section className="space-y-4">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">3. How to Request Data Deletion</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            You can request full deletion of any data associated with your submissions by contacting our data protection team via email:
          </p>

          <div className="bg-white/5 border border-yellow-500/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wide text-yellow-400">Submit a Request via Email</h3>
            <ul className="text-xs text-gray-300 space-y-2 list-disc pl-5">
              <li><strong>Send an email to:</strong> <a href={`mailto:${contactEmail}`} className="text-yellow-400 underline">{contactEmail}</a></li>
              <li><strong>Subject line:</strong> &ldquo;Data Deletion Request — EDSA Power Tracker&rdquo;</li>
              <li><strong>Information to include:</strong> Approximate date/time of any reports submitted, your reported community or area name, and any specific details to help identify your submission.</li>
            </ul>

            <div className="pt-2">
              <a
                href={`mailto:${contactEmail}?subject=Data%20Deletion%20Request%20%E2%80%94%20EDSA%20Power%20Tracker&body=Hello%20BridgeTech%20Team%2C%0A%0AI%20would%20like%20to%20request%20the%20deletion%20of%20all%20data%20associated%20with%20my%20use%20of%20the%20EDSA%20Power%20Tracker%20app.%0A%0ADetails%20(date%2C%20community%2C%20etc.)%3A%0A%0AThank%20you.`}
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-lg shadow-yellow-400/20"
              >
                Send Data Deletion Request Email
              </a>
            </div>
          </div>
        </section>

        {/* Processing Timeline & Data Retention */}
        <section className="space-y-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">4. Processing Timeline & Retention Policy</h2>
          <div className="space-y-2 text-sm text-gray-300 leading-relaxed">
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
        <section className="space-y-3 border-t border-white/10 pt-8">
          <h2 className="text-lg font-black uppercase tracking-tight text-yellow-400">5. Contact Information</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-1 text-sm">
            <p className="font-black text-white">{companyName}</p>
            <p className="text-gray-400">Email: <a href={`mailto:${contactEmail}`} className="text-yellow-400 underline">{contactEmail}</a></p>
            <p className="text-gray-400">Phone: <a href={`tel:${contactPhone}`} className="text-yellow-400 underline">{contactPhone}</a></p>
            <p className="text-gray-400">Location: Freetown, Sierra Leone</p>
          </div>
        </section>

      </div>
    </main>
  );
}
