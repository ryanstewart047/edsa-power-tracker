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
    icon: <AlertCircle className="w-8 h-8 text-red-400" />,
  },
  {
    title: 'Damaged Power Lines',
    description: 'Fallen, sparking, or severely damaged power lines pose electrocution and fire hazards.',
    icon: <AlertCircle className="w-8 h-8 text-red-400" />,
  },
  {
    title: 'Unsecured Poles',
    description: 'Poles that are leaning, cracked, or at risk of falling endanger lives and infrastructure.',
    icon: <AlertCircle className="w-8 h-8 text-red-400" />,
  },
  {
    title: 'Overloaded Networks',
    description: 'Too many connections on a single pole can cause fires, overheating, and system failures.',
    icon: <AlertCircle className="w-8 h-8 text-red-400" />,
  },
];

const allowed: GuidelineItem[] = [
  {
    title: 'Authorized Connections',
    description: 'Licensed electrical work performed by qualified technicians with proper permits and metering.',
    icon: <CheckCircle className="w-8 h-8 text-green-400" />,
  },
  {
    title: 'Maintenance Work',
    description: 'Routine inspections, repairs, and upgrades performed by EDSA or contracted maintenance teams.',
    icon: <CheckCircle className="w-8 h-8 text-green-400" />,
  },
  {
    title: 'Safety Infrastructure',
    description: 'Proper grounding, fuses, circuit breakers, and insulation to protect against electrical hazards.',
    icon: <CheckCircle className="w-8 h-8 text-green-400" />,
  },
  {
    title: 'Public Reporting',
    description: 'Citizens can report hazards anonymously through this platform to help keep communities safe.',
    icon: <CheckCircle className="w-8 h-8 text-green-400" />,
  },
];

export default function SafetyGuidelines() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-white">Safety & Compliance Guidelines</h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Help keep Freetown safe by understanding what&apos;s prohibited and what&apos;s allowed in electrical infrastructure management.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-red-500 rounded-full"></div>
            <h3 className="text-2xl font-bold text-red-400">Prohibited Actions</h3>
          </div>

          <div className="space-y-6">
            {prohibited.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-green-500 rounded-full"></div>
            <h3 className="text-2xl font-bold text-green-400">Allowed & Best Practices</h3>
          </div>

          <div className="space-y-6">
            {allowed.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/5 p-8 text-center">
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          <span className="font-bold text-yellow-300">If you see a hazard:</span> Use the Live Tracker to report it with photos and location details. Your report helps EDSA respond quickly and keeps your community safe.
        </p>
      </div>
    </section>
  );
}
