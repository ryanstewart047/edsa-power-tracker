/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  BatteryCharging,
  Sliders,
  ArrowRight,
  VolumeX
} from 'lucide-react';
import type { StoredToken } from '@/lib/vaultStorage';

interface TokenBurnRateCardProps {
  tokens: StoredToken[];
  onOpenMeterAssistant?: () => void;
  onOpenTopUp?: () => void;
}

export default function TokenBurnRateCard({
  tokens,
  onOpenMeterAssistant,
  onOpenTopUp
}: TokenBurnRateCardProps) {
  // Preset consumption tiers (kWh per day in Sierra Leone households)
  const [dailyKwhRate, setDailyKwhRate] = useState<number>(6.5); // Default ~6.5 kWh/day
  const [customUnitsBalance, setCustomUnitsBalance] = useState<string>('');

  // 1. Calculate this month's stats
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTokens = tokens.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalNle = monthTokens.reduce((sum, t) => sum + (t.amountNle || 0), 0);
    const totalUnits = monthTokens.reduce((sum, t) => sum + (t.kwhUnits || 0), 0);

    return {
      count: monthTokens.length,
      totalNle,
      totalUnits
    };
  }, [tokens]);

  // 2. Estimate most recent active token's remaining units
  const latestToken = useMemo(() => {
    if (!tokens.length) return null;
    return [...tokens].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }, [tokens]);

  // Calculate estimated days left
  const estimatedRemainingUnits = useMemo(() => {
    if (customUnitsBalance.trim() !== '') {
      const parsed = parseFloat(customUnitsBalance);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (!latestToken || !latestToken.kwhUnits) return 25; // fallback baseline
    const daysSincePurchase = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(latestToken.date).getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const consumed = daysSincePurchase * dailyKwhRate;
    return Math.max(0, Math.round((latestToken.kwhUnits - consumed) * 10) / 10);
  }, [latestToken, dailyKwhRate, customUnitsBalance]);

  const daysRemaining = useMemo(() => {
    if (dailyKwhRate <= 0) return 0;
    return Math.round((estimatedRemainingUnits / dailyKwhRate) * 10) / 10;
  }, [estimatedRemainingUnits, dailyKwhRate]);

  // Status color
  const statusConfig = useMemo(() => {
    if (daysRemaining <= 2) {
      return {
        badge: 'Critical (Recharge Soon)',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        barColor: 'bg-rose-500',
        textColor: 'text-rose-600',
        message: 'Your meter may start beeping low credit alarm at any moment!'
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
      message: 'You have plenty of electricity units at your current burn rate.'
    };
  }, [daysRemaining]);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Token Burn Rate & Monthly Spend
            </h3>
            <p className="text-xs text-slate-500">
              Predict when your electricity runs out and track spending
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusConfig.badgeBg}`}
        >
          {statusConfig.badge}
        </span>
      </div>

      {/* Main KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            This Month
          </p>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            NLe {monthlyStats.totalNle.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500">
            {monthlyStats.count} top-up{monthlyStats.count !== 1 ? 's' : ''} saved
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Units Bought
          </p>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            {monthlyStats.totalUnits.toFixed(1)}{' '}
            <span className="text-xs font-semibold text-slate-500">kWh</span>
          </p>
          <p className="text-[10px] text-slate-500">Current calendar month</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
            Burn Rate
          </p>
          <p className="text-lg sm:text-xl font-black text-blue-900 mt-0.5">
            {dailyKwhRate}{' '}
            <span className="text-xs font-semibold text-blue-600">kWh/day</span>
          </p>
          <p className="text-[10px] text-blue-700/80">
            ~NLe {(dailyKwhRate * 3.8).toFixed(1)}/day
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Est. Days Left
          </p>
          <p className={`text-lg sm:text-xl font-black mt-0.5 ${statusConfig.textColor}`}>
            ~{daysRemaining}{' '}
            <span className="text-xs font-semibold text-slate-500">days</span>
          </p>
          <p className="text-[10px] text-slate-500">
            {estimatedRemainingUnits} kWh remaining
          </p>
        </div>
      </div>

      {/* Progress Bar of current batch */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-600 flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-blue-600" />
            Estimated Credit Fuel Gauge
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

        {/* Household Burn Rate Adjuster & Custom Balance Entry */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Adjust Household Appliance Profile:
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

        {/* Action pills: Silence Beeper & Buy More */}
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
                <p className="text-xs font-bold text-blue-950">Running Low?</p>
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
