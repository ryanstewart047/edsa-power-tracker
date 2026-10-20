/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo } from 'react';
import {
  X,
  Zap,
  CreditCard,
  BarChart2,
  Copy,
  Check,
  Edit3,
  VolumeX,
  BatteryCharging
} from 'lucide-react';
import type { MeterProfile, StoredToken } from '@/lib/vaultStorage';

interface MeterBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  meter: MeterProfile | null;
  tokens: StoredToken[];
  onEditNickname: (meter: MeterProfile) => void;
  onRechargeMeter: (meter: MeterProfile) => void;
  onOpenMeterAssistant?: () => void;
  onSetActive?: (meterId: string) => void;
  isActive?: boolean;
}

export default function MeterBreakdownModal({
  isOpen,
  onClose,
  meter,
  tokens,
  onEditNickname,
  onRechargeMeter,
  onOpenMeterAssistant,
  onSetActive,
  isActive = false
}: MeterBreakdownModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'weeks' | 'months'>('weeks');
  const [dailyKwhRate, setDailyKwhRate] = useState<number>(6.5);

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  // 1. Filter tokens exclusively for this meter
  const meterTokens = useMemo(() => {
    if (!meter) return [];
    const cleanNum = meter.meterNumber.replace(/\D/g, '');
    return tokens.filter((t) => {
      const tNum = (t.meterNumber || '').replace(/\D/g, '');
      return tNum === cleanNum;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meter, tokens]);

  // 2. Financial Metrics: This Week, This Month, Last Month, All Time
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Start of this week (Monday)
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // Last month index and year
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let weekNle = 0;
    let weekUnits = 0;
    let weekCount = 0;

    let monthNle = 0;
    let monthUnits = 0;
    let monthCount = 0;

    let lastMonthNle = 0;
    let lastMonthUnits = 0;
    let lastMonthCount = 0;

    let allTimeNle = 0;
    let allTimeUnits = 0;

    meterTokens.forEach((t) => {
      const d = new Date(t.date);
      const nle = t.amountNle || 0;
      const kwh = t.kwhUnits || 0;

      allTimeNle += nle;
      allTimeUnits += kwh;

      // This week
      if (d >= startOfWeek) {
        weekNle += nle;
        weekUnits += kwh;
        weekCount += 1;
      }

      // This month
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthNle += nle;
        monthUnits += kwh;
        monthCount += 1;
      }

      // Last month
      if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
        lastMonthNle += nle;
        lastMonthUnits += kwh;
        lastMonthCount += 1;
      }
    });

    const averageTopUp = meterTokens.length > 0 ? Math.round(allTimeNle / meterTokens.length) : 0;

    return {
      week: { nle: weekNle, units: weekUnits, count: weekCount },
      month: { nle: monthNle, units: monthUnits, count: monthCount },
      lastMonth: { nle: lastMonthNle, units: lastMonthUnits, count: lastMonthCount },
      allTime: { nle: allTimeNle, units: allTimeUnits, count: meterTokens.length },
      averageTopUp
    };
  }, [meterTokens]);

  // 3. Weekly breakdown of the current month (Weeks 1 to 4+)
  const weeklyChartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const weeks = [
      { label: 'Week 1 (1–7)', nle: 0, units: 0 },
      { label: 'Week 2 (8–14)', nle: 0, units: 0 },
      { label: 'Week 3 (15–21)', nle: 0, units: 0 },
      { label: 'Week 4+ (22–End)', nle: 0, units: 0 }
    ];

    meterTokens.forEach((t) => {
      const d = new Date(t.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const day = d.getDate();
        const nle = t.amountNle || 0;
        const units = t.kwhUnits || 0;

        if (day <= 7) {
          weeks[0].nle += nle;
          weeks[0].units += units;
        } else if (day <= 14) {
          weeks[1].nle += nle;
          weeks[1].units += units;
        } else if (day <= 21) {
          weeks[2].nle += nle;
          weeks[2].units += units;
        } else {
          weeks[3].nle += nle;
          weeks[3].units += units;
        }
      }
    });

    const maxNle = Math.max(1, ...weeks.map((w) => w.nle));
    return { weeks, maxNle };
  }, [meterTokens]);

  // 4. Monthly spend comparison (last 3 months)
  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const months = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        label: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
        nle: 0,
        units: 0
      });
    }

    meterTokens.forEach((t) => {
      const d = new Date(t.date);
      const mIdx = d.getMonth();
      const y = d.getFullYear();

      months.forEach((m) => {
        if (m.monthIndex === mIdx && m.year === y) {
          m.nle += t.amountNle || 0;
          m.units += t.kwhUnits || 0;
        }
      });
    });

    const maxNle = Math.max(1, ...months.map((m) => m.nle));
    return { months, maxNle };
  }, [meterTokens]);

  // 5. Estimated days remaining for this specific meter
  const latestToken = meterTokens[0] || null;
  const estimatedDaysRemaining = useMemo(() => {
    if (!latestToken || !latestToken.kwhUnits) return 0;
    const daysSince = Math.max(
      0,
      Math.floor((Date.now() - new Date(latestToken.date).getTime()) / (1000 * 60 * 60 * 24))
    );
    const consumed = daysSince * dailyKwhRate;
    const remainingUnits = Math.max(0, latestToken.kwhUnits - consumed);
    return Math.round((remainingUnits / dailyKwhRate) * 10) / 10;
  }, [latestToken, dailyKwhRate]);

  if (!isOpen || !meter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-5 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header with Nickname and Edit Button */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {meter.name}
                </h2>
                <button
                  type="button"
                  onClick={() => onEditNickname(meter)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 transition-colors"
                  title="Edit meter nickname"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {isActive && (
                  <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                    Active Target
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm font-black text-emerald-600 tracking-wider">
                  {meter.meterNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(meter.meterNumber, 'breakdown-meter-num')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                  title="Copy meter number"
                >
                  {copiedKey === 'breakdown-meter-num' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
              This Week
            </span>
            <p className="text-lg sm:text-xl font-black text-blue-950 mt-0.5">
              NLe {stats.week.nle.toLocaleString()}
            </p>
            <p className="text-[10px] font-semibold text-blue-700/80 mt-0.5">
              {stats.week.units.toFixed(1)} kWh • {stats.week.count} token{stats.week.count !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              This Month
            </span>
            <p className="text-lg sm:text-xl font-black text-indigo-950 mt-0.5">
              NLe {stats.month.nle.toLocaleString()}
            </p>
            <p className="text-[10px] font-semibold text-indigo-700/80 mt-0.5">
              {stats.month.units.toFixed(1)} kWh • {stats.month.count} token{stats.month.count !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Last Month
            </span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              NLe {stats.lastMonth.nle.toLocaleString()}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
              {stats.lastMonth.units.toFixed(1)} kWh • {stats.lastMonth.count} token{stats.lastMonth.count !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              All Time Total
            </span>
            <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              NLe {stats.allTime.nle.toLocaleString()}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
              {stats.allTime.units.toFixed(1)} kWh • {stats.allTime.count} token{stats.allTime.count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Graphical Spend Visualization Section */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Expenditure Visual Breakdown
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveChartTab('weeks')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeChartTab === 'weeks'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly (This Month)
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('months')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeChartTab === 'months'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Trend
              </button>
            </div>
          </div>

          {/* Chart Canvas: Pure CSS / SVG Bars */}
          {activeChartTab === 'weeks' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 sm:gap-3 items-end h-36 pt-6 pb-2 px-2 bg-white rounded-2xl border border-slate-200/80">
                {weeklyChartData.weeks.map((week, idx) => {
                  const heightPercent = week.nle > 0
                    ? Math.max(12, Math.round((week.nle / weeklyChartData.maxNle) * 100))
                    : 6;

                  return (
                    <div key={week.label} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-700 font-mono mb-1">
                        {week.nle > 0 ? `NLe ${week.nle}` : '0'}
                      </span>
                      <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-700 ${
                            week.nle > 0
                              ? idx === 0
                                ? 'bg-gradient-to-t from-blue-700 to-blue-500'
                                : idx === 1
                                ? 'bg-gradient-to-t from-indigo-700 to-indigo-500'
                                : idx === 2
                                ? 'bg-gradient-to-t from-sky-700 to-sky-500'
                                : 'bg-gradient-to-t from-emerald-700 to-emerald-500'
                              : 'bg-slate-200'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 mt-2 truncate max-w-full text-center">
                        {week.label.split(' ')[0]} {week.label.split(' ')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Visualizing top-ups purchased for <strong>{meter.name}</strong> across current month weeks.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 items-end h-36 pt-6 pb-2 px-4 bg-white rounded-2xl border border-slate-200/80">
                {monthlyChartData.months.map((m) => {
                  const heightPercent = m.nle > 0
                    ? Math.max(12, Math.round((m.nle / monthlyChartData.maxNle) * 100))
                    : 6;

                  return (
                    <div key={m.label} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[11px] font-bold text-slate-800 font-mono mb-1">
                        {m.nle > 0 ? `NLe ${m.nle}` : '0'}
                      </span>
                      <div className="w-full max-w-[56px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-700 ${
                            m.nle > 0
                              ? 'bg-gradient-to-t from-blue-600 via-indigo-600 to-blue-400'
                              : 'bg-slate-200'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 mt-2">
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                3-Month financial comparison for meter <strong>{meter.meterNumber}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Meter Burn Rate & Estimated Days Left */}
        {latestToken && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4 text-blue-600" />
                Estimated Power Left for {meter.name}
              </span>
              <span className="font-mono font-bold text-emerald-600">
                ~{estimatedDaysRemaining} days remaining
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  estimatedDaysRemaining <= 2
                    ? 'bg-rose-500'
                    : estimatedDaysRemaining <= 5
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(5, (estimatedDaysRemaining / 14) * 100))}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Latest top-up: {new Date(latestToken.date).toLocaleDateString()}</span>
              <span>Avg draw: {dailyKwhRate} kWh/day</span>
            </div>
          </div>
        )}

        {/* Tokens History for this meter */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Tokens Saved for this Meter ({meterTokens.length})
            </h4>
            <span className="text-[11px] text-slate-500">
              Avg: NLe {stats.averageTopUp} / top-up
            </span>
          </div>

          {meterTokens.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              No top-up tokens have been saved for {meter.name} yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {meterTokens.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 tracking-wider">
                        {t.token}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(t.token, `token-${t.id}`)}
                        className="text-slate-400 hover:text-slate-700"
                        title="Copy token"
                      >
                        {copiedKey === `token-${t.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(t.date).toLocaleDateString()} • {t.kwhUnits ? `${t.kwhUnits} kWh` : 'Units unrecorded'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 font-mono">
                      NLe {t.amountNle}
                    </span>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      {t.loaded ? 'Loaded' : 'Saved'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onRechargeMeter(meter)}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>Top-Up This Meter Now</span>
          </button>

          {onOpenMeterAssistant && (
            <button
              type="button"
              onClick={onOpenMeterAssistant}
              className="py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <VolumeX className="w-4 h-4 text-amber-600" />
              <span>Mute Beeper</span>
            </button>
          )}

          {!isActive && onSetActive && (
            <button
              type="button"
              onClick={() => onSetActive(meter.id)}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors active:scale-95"
            >
              Set Active
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
