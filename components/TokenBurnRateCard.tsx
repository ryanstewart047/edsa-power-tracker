/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  BatteryCharging,
  Sliders,
  ArrowRight,
  VolumeX,
  Zap,
  Edit3,
  BarChart2
} from 'lucide-react';
import type { StoredToken, MeterProfile } from '@/lib/vaultStorage';

interface TokenBurnRateCardProps {
  tokens: StoredToken[];
  meters?: MeterProfile[];
  selectedMeterId?: string;
  onSelectMeterId?: (meterId: string) => void;
  onOpenMeterAssistant?: () => void;
  onOpenTopUp?: () => void;
  onEditMeterNickname?: (meter: MeterProfile) => void;
  onOpenMeterBreakdown?: (meter: MeterProfile) => void;
}

export default function TokenBurnRateCard({
  tokens,
  meters = [],
  selectedMeterId = 'all',
  onSelectMeterId,
  onOpenMeterAssistant,
  onOpenTopUp,
  onEditMeterNickname,
  onOpenMeterBreakdown
}: TokenBurnRateCardProps) {
  const [internalSelectedMeterId, setInternalSelectedMeterId] = useState<string>(selectedMeterId);
  const [dailyKwhRate, setDailyKwhRate] = useState<number>(6.5);
  const [customUnitsBalance, setCustomUnitsBalance] = useState<string>('');

  const currentMeterId = onSelectMeterId ? selectedMeterId : internalSelectedMeterId;
  const handleSelectMeter = (id: string) => {
    if (onSelectMeterId) {
      onSelectMeterId(id);
    } else {
      setInternalSelectedMeterId(id);
    }
  };

  const activeMeter = useMemo(() => {
    if (currentMeterId === 'all') return null;
    return meters.find((m) => m.id === currentMeterId) || null;
  }, [meters, currentMeterId]);

  // Filter tokens based on selected meter
  const filteredTokens = useMemo(() => {
    if (!activeMeter) return tokens;
    const cleanNum = activeMeter.meterNumber.replace(/\D/g, '');
    return tokens.filter((t) => {
      const tNum = (t.meterNumber || '').replace(/\D/g, '');
      return tNum === cleanNum;
    });
  }, [tokens, activeMeter]);

  // 1. Calculate this week, this month, and all time stats
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    let weekNle = 0;
    let weekUnits = 0;
    let weekCount = 0;

    let monthNle = 0;
    let monthUnits = 0;
    let monthCount = 0;

    let allTimeNle = 0;
    let allTimeUnits = 0;

    filteredTokens.forEach((t) => {
      const d = new Date(t.date);
      const nle = t.amountNle || 0;
      const kwh = t.kwhUnits || 0;

      allTimeNle += nle;
      allTimeUnits += kwh;

      if (d >= startOfWeek) {
        weekNle += nle;
        weekUnits += kwh;
        weekCount += 1;
      }

      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthNle += nle;
        monthUnits += kwh;
        monthCount += 1;
      }
    });

    return {
      week: { nle: weekNle, units: weekUnits, count: weekCount },
      month: { nle: monthNle, units: monthUnits, count: monthCount },
      allTime: { nle: allTimeNle, units: allTimeUnits, count: filteredTokens.length }
    };
  }, [filteredTokens]);

  // 2. Weekly chart for the current month
  const weeklyChart = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const weeks = [
      { label: 'Wk 1', range: '1–7', nle: 0 },
      { label: 'Wk 2', range: '8–14', nle: 0 },
      { label: 'Wk 3', range: '15–21', nle: 0 },
      { label: 'Wk 4+', range: '22+', nle: 0 }
    ];

    filteredTokens.forEach((t) => {
      const d = new Date(t.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const day = d.getDate();
        const nle = t.amountNle || 0;
        if (day <= 7) weeks[0].nle += nle;
        else if (day <= 14) weeks[1].nle += nle;
        else if (day <= 21) weeks[2].nle += nle;
        else weeks[3].nle += nle;
      }
    });

    const maxNle = Math.max(1, ...weeks.map((w) => w.nle));
    return { weeks, maxNle };
  }, [filteredTokens]);

  // 3. Most recent token & remaining estimation
  const latestToken = useMemo(() => {
    if (!filteredTokens.length) return null;
    return [...filteredTokens].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }, [filteredTokens]);

  const estimatedRemainingUnits = useMemo(() => {
    if (customUnitsBalance.trim() !== '') {
      const parsed = parseFloat(customUnitsBalance);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (!latestToken || !latestToken.kwhUnits) return 25;
    const daysSince = Math.max(
      0,
      Math.floor((Date.now() - new Date(latestToken.date).getTime()) / (1000 * 60 * 60 * 24))
    );
    const consumed = daysSince * dailyKwhRate;
    return Math.max(0, Math.round((latestToken.kwhUnits - consumed) * 10) / 10);
  }, [latestToken, dailyKwhRate, customUnitsBalance]);

  const daysRemaining = useMemo(() => {
    if (dailyKwhRate <= 0) return 0;
    return Math.round((estimatedRemainingUnits / dailyKwhRate) * 10) / 10;
  }, [estimatedRemainingUnits, dailyKwhRate]);

  const statusConfig = useMemo(() => {
    if (daysRemaining <= 2) {
      return {
        badge: 'Critical (Recharge Soon)',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        barColor: 'bg-rose-500',
        textColor: 'text-rose-600',
        message: 'Meter may start beeping low credit alarm at any moment!'
      };
    }
    if (daysRemaining <= 5) {
      return {
        badge: 'Moderate Balance',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        barColor: 'bg-amber-500',
        textColor: 'text-amber-600',
        message: 'Plan your next token recharge within the next few days.'
      };
    }
    return {
      badge: 'Healthy Balance',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      message: 'You have plenty of electricity units at current burn rate.'
    };
  }, [daysRemaining]);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                {activeMeter ? `${activeMeter.name} Financial Breakdown` : 'All Meters Financial Overview'}
              </h3>
              {activeMeter && onEditMeterNickname && (
                <button
                  type="button"
                  onClick={() => onEditMeterNickname(activeMeter)}
                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  title="Edit meter nickname"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {activeMeter
                ? `Meter: ${activeMeter.meterNumber} • Real-time spend & energy analysis`
                : 'Aggregated electricity spend and burn rate across all saved meters'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeMeter && onOpenMeterBreakdown && (
            <button
              type="button"
              onClick={() => onOpenMeterBreakdown(activeMeter)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
            >
              <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Graph</span>
            </button>
          )}

          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusConfig.badgeBg}`}
          >
            {statusConfig.badge}
          </span>
        </div>
      </div>

      {/* Meter Selector Tabs (when multiple meters exist) */}
      {meters.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => handleSelectMeter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              currentMeterId === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Meters ({tokens.length})
          </button>
          {meters.map((m) => {
            const isSelected = currentMeterId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMeter(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Zap className={`w-3 h-3 ${isSelected ? 'text-amber-300 fill-amber-300' : 'text-slate-400'}`} />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main KPI Cards: This Week, This Month, All Time, Days Left */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
            This Week
          </p>
          <p className="text-lg sm:text-xl font-black text-blue-950 mt-0.5">
            NLe {stats.week.nle.toLocaleString()}
          </p>
          <p className="text-[10px] text-blue-700/80">
            {stats.week.units.toFixed(1)} kWh • {stats.week.count} top-up{stats.week.count !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
            This Month
          </p>
          <p className="text-lg sm:text-xl font-black text-indigo-950 mt-0.5">
            NLe {stats.month.nle.toLocaleString()}
          </p>
          <p className="text-[10px] text-indigo-700/80">
            {stats.month.units.toFixed(1)} kWh • {stats.month.count} top-up{stats.month.count !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            All-Time Spend
          </p>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            NLe {stats.allTime.nle.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500">
            {stats.allTime.units.toFixed(1)} kWh total
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Est. Days Left
          </p>
          <p className={`text-lg sm:text-xl font-black mt-0.5 ${statusConfig.textColor}`}>
            ~{daysRemaining} <span className="text-xs font-semibold text-slate-500">days</span>
          </p>
          <p className="text-[10px] text-slate-500">
            {estimatedRemainingUnits} kWh remaining
          </p>
        </div>
      </div>

      {/* Graphical Spend Bar Chart for This Meter (Current Month Weeks) */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
            Weekly Expenditure Graph (Current Month)
          </span>
          <span className="text-[10px] font-semibold text-slate-500">
            Total: NLe {stats.month.nle}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 items-end h-24 pt-4 pb-1 px-2 bg-white rounded-xl border border-slate-200/70">
          {weeklyChart.weeks.map((w, idx) => {
            const heightPercent = w.nle > 0
              ? Math.max(15, Math.round((w.nle / weeklyChart.maxNle) * 100))
              : 8;

            return (
              <div key={w.label} className="flex flex-col items-center h-full justify-end">
                <span className="text-[9px] font-bold text-slate-700 font-mono mb-0.5">
                  {w.nle > 0 ? `NLe ${w.nle}` : '0'}
                </span>
                <div className="w-full max-w-[32px] bg-slate-100 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      w.nle > 0
                        ? idx === 0
                          ? 'bg-blue-600'
                          : idx === 1
                          ? 'bg-indigo-600'
                          : idx === 2
                          ? 'bg-sky-600'
                          : 'bg-emerald-600'
                        : 'bg-slate-200'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[9px] font-semibold text-slate-500 mt-1">
                  {w.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fuel Gauge Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-600 flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-blue-600" />
            Estimated Balance Gauge
          </span>
          <span className="text-slate-900 font-mono">
            {estimatedRemainingUnits} kWh (~{daysRemaining} days)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusConfig.barColor}`}
            style={{
              width: `${Math.min(100, Math.max(5, (daysRemaining / 14) * 100))}%`
            }}
          />
        </div>
        <p className="text-[11px] text-slate-500">{statusConfig.message}</p>
      </div>

      {/* Household Burn Rate Adjuster & Live CIU Screen input */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            Household Appliance Profile:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Live CIU Screen:</span>
            <input
              type="number"
              placeholder="e.g. 15.2"
              value={customUnitsBalance}
              onChange={(e) => setCustomUnitsBalance(e.target.value)}
              className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-500">kWh</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Light Flat (Bulbs + TV)', rate: 3.5 },
            { label: 'Family Flat (+ Fridge)', rate: 6.5 },
            { label: 'Heavy (+ Freezer & AC)', rate: 12.0 },
            { label: 'Office / Business', rate: 18.0 }
          ].map((profile) => (
            <button
              key={profile.label}
              type="button"
              onClick={() => setDailyKwhRate(profile.rate)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                dailyKwhRate === profile.rate
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {profile.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {onOpenMeterAssistant && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500 text-white shrink-0">
                <VolumeX className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">Meter Beeping?</p>
                <p className="text-[10px] text-amber-800">1-tap silence shortcodes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenMeterAssistant}
              className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 transition-colors shadow-xs"
            >
              Mute Beeper
            </button>
          </div>
        )}

        {onOpenTopUp && (
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-blue-950">Recharge Meter?</p>
              <p className="text-[10px] text-blue-700">Top-up via Orange / Africell</p>
            </div>
            <button
              type="button"
              onClick={onOpenTopUp}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
            >
              <span>Recharge</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
