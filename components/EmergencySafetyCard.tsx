import { AlertTriangle, Phone } from 'lucide-react';

export default function EmergencySafetyCard() {
  return (
    <aside className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-sm" aria-label="Electrical emergency safety guidance">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
        <div>
          <h2 className="font-bold text-rose-950 text-sm">Live wire or immediate electrical danger</h2>
          <p className="mt-1 text-xs leading-relaxed text-rose-800">
            Keep clear, warn others, do not touch the cable or use water near it. Report the hazard with your exact GPS location. Call local emergency services for an immediate threat to life.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-rose-900">
            <Phone className="h-3.5 w-3.5 text-rose-700" />
            Use your local emergency number for urgent rescue.
          </div>
        </div>
      </div>
    </aside>
  );
}
