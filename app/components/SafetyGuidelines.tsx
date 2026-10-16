'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';

type GuidelineItem = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const prohibited: GuidelineItem[] = [
  {
    title: 'Illegal Cable Connections',
    description: 'Unauthorized electrical connections that bypass metering are dangerous and illegal. Report immediately.',
    icon: <AlertCircle className="w-8 h-8 text-rose-500" />,
  },
  {
    title: 'Damaged Power Lines',
    description: 'Fallen, sparking, or severely damaged power lines pose electrocution and fire hazards.',
    icon: <AlertCircle className="w-8 h-8 text-rose-500" />,
  },
  {
    title: 'Unsecured Poles',
    description: 'Poles that are leaning, cracked, or at risk of falling endanger lives and infrastructure.',
    icon: <AlertCircle className="w-8 h-8 text-rose-500" />,
  },
  {
    title: 'Overloaded Networks',
    description: 'Too many connections on a single pole can cause fires, overheating, and system failures.',
    icon: <AlertCircle className="w-8 h-8 text-rose-500" />,
  },
];

const allowed: GuidelineItem[] = [
  {
    title: 'Authorized Connections',
    description: 'Licensed electrical work performed by qualified technicians with proper permits and metering.',
    icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
  },
  {
    title: 'Maintenance Work',
    description: 'Routine inspections, repairs, and upgrades performed by EDSA or contracted maintenance teams.',
    icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
  },
  {
    title: 'Safety Infrastructure',
    description: 'Proper grounding, fuses, circuit breakers, and insulation to protect against electrical hazards.',
    icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
  },
  {
    title: 'Public Reporting',
    description: 'Citizens can report hazards anonymously through this platform to help keep communities safe.',
    icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
  },
];

export default function SafetyGuidelines() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Safety & Compliance Guidelines</h2>
        <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Help keep Freetown safe by understanding what&apos;s prohibited and what&apos;s allowed in electrical infrastructure management.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-7 bg-rose-500 rounded-full"></div>
            <h3 className="text-xl sm:text-2xl font-bold text-rose-600">Prohibited Actions</h3>
          </div>

          <div className="space-y-4">
            {prohibited.map((item, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl border border-rose-200/90 bg-rose-50/60 hover:bg-rose-50 transition-colors shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5">{item.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-7 bg-emerald-500 rounded-full"></div>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-600">Allowed & Best Practices</h3>
          </div>

          <div className="space-y-4">
            {allowed.map((item, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl border border-emerald-200/90 bg-emerald-50/60 hover:bg-emerald-50 transition-colors shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5">{item.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-200/90 bg-blue-50/70 p-6 sm:p-8 text-center shadow-sm">
        <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
          <span className="font-bold text-blue-700">If you see a hazard:</span> Use the Live Tracker to report it with photos and location details. Your report helps EDSA respond quickly and keeps your community safe.
        </p>
      </div>
    </section>
  );
}
