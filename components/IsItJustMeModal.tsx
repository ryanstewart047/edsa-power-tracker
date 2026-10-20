'use client';

import {
  Zap,
  ZapOff,
  AlertTriangle,
  X,
  Wrench,
  Activity,
  MapPin
} from 'lucide-react';
import type { AreaWithStatus } from '@/lib/areas';

interface IsItJustMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArea: AreaWithStatus | null;
  onOpenMeterTroubleshooter: () => void;
  onReportOutage: () => void;
  onReportHazard: () => void;
}

export default function IsItJustMeModal({
  isOpen,
  onClose,
  currentArea,
  onOpenMeterTroubleshooter,
  onReportOutage,
  onReportHazard
}: IsItJustMeModalProps) {
  if (!isOpen) return null;

  const areaName = currentArea?.name || 'Your Area';
  const status = currentArea?.status || 'unknown';
  const reportCount = currentArea?.reportCount || 0;

  // Diagnosis logic
  const isAreaOn = status === 'on';
  const isAreaOut = status === 'out';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                &ldquo;Is It Just Me?&rdquo; Diagnostic
              </h2>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span>Checking local grid signals for <strong>{areaName}</strong>{reportCount > 0 ? ` (${reportCount} recent report${reportCount > 1 ? 's' : ''})` : ''}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            aria-label="Close diagnostic"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnosis Output */}
        {isAreaOn ? (
          // Case 1: Grid is ON in the area, but user has no light
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/80 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Diagnosis: Likely Isolated to Your House
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                EDSA Power is Active in {areaName}
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Neighborhood signals and community tracking confirm that the local distribution feeder in {areaName} is currently delivering electricity. Because your power is off, the problem is most likely inside your compound or meter.
              </p>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recommended Troubleshooting Steps:
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                  <span className="font-bold text-blue-600 shrink-0">1.</span>
                  <div>
                    <strong className="text-slate-900">Check Prepaid Meter Units</strong>
                    <p className="text-slate-600 mt-0.5">Your units may have reached 0.00 kWh. If your CIU is beeping, enter the silence code or top up.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                  <span className="font-bold text-blue-600 shrink-0">2.</span>
                  <div>
                    <strong className="text-slate-900">Check Main Circuit Breaker</strong>
                    <p className="text-slate-600 mt-0.5">Heavy appliances may have tripped your indoor distribution board switch.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                  <span className="font-bold text-blue-600 shrink-0">3.</span>
                  <div>
                    <strong className="text-slate-900">Check CIU for Fault Codes</strong>
                    <p className="text-slate-600 mt-0.5">If the screen says &quot;Loc&quot; (overload) or &quot;Con_FAIL&quot;, use our meter assistant to resolve it.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMeterTroubleshooter();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Wrench className="w-3.5 h-3.5" /> Open Meter Assistant
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReportOutage();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-all border border-slate-200"
              >
                Report My Outage
              </button>
            </div>
          </div>
        ) : isAreaOut ? (
          // Case 2: Confirmed area blackout
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/80 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-rose-900">
                  Diagnosis: Confirmed Area Grid Outage
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                It&apos;s Not Just You — {areaName} is Out
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Multiple neighbors and verified community sensors confirm an active EDSA power outage across {areaName}. The substation feeder is disconnected or undergoing maintenance.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <strong className="text-slate-900 block font-bold uppercase tracking-wider text-[11px]">
                🛡️ Important Safety Precaution:
              </strong>
              <p className="text-slate-600 leading-relaxed">
                Unplug sensitive appliances (refrigerators, freezers, and TVs) now. When high-voltage electricity returns after a blackout, voltage spikes can damage compressors and power boards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReportOutage();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ZapOff className="w-3.5 h-3.5" /> Confirm Outage (+1)
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReportHazard();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-all border border-slate-200 flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Report Wire Danger
              </button>
            </div>
          </div>
        ) : (
          // Case 3: Unknown status
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Diagnosis: Awaiting Fresh Signals
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Few Recent Reports in {areaName}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We have limited reports from your exact vicinity within the last hour. Submit your current status to establish the neighborhood signal for your neighbors!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReportOutage();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <ZapOff className="w-3.5 h-3.5" /> I Have No Power
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReportOutage();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" /> I Have Power
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 font-bold hover:text-slate-800"
          >
            Close Diagnostic
          </button>
        </div>
      </div>
    </div>
  );
}
