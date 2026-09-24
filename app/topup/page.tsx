'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Smartphone, 
  Calculator, 
  KeyRound, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ExternalLink, 
  PhoneCall, 
  Info, 
  CheckCircle2, 
  Sparkles,
  Eye,
  X
} from 'lucide-react';

interface MeterProfile {
  id: string;
  name: string;
  meterNumber: string;
  isDefault?: boolean;
}

interface StoredToken {
  id: string;
  token: string;
  meterNumber: string;
  meterName?: string;
  amountNle: number;
  kwhUnits?: number;
  date: string;
  loaded: boolean;
}

export default function TopUpPage() {
  const [activeTab, setActiveTab] = useState<'buy' | 'vault' | 'calc' | 'meters'>('buy');
  
  // Meters state
  const [meters, setMeters] = useState<MeterProfile[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<string>('');
  const [newMeterName, setNewMeterName] = useState('');
  const [newMeterNumber, setNewMeterNumber] = useState('');
  const [showAddMeterModal, setShowAddMeterModal] = useState(false);

  // USSD Quick-Pay state
  const [ussdProvider, setUssdProvider] = useState<'orange' | 'africell'>('orange');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(100);
  const [calcTariffType, setCalcTariffType] = useState<'residential' | 'commercial'>('residential');

  // Token Vault state
  const [tokens, setTokens] = useState<StoredToken[]>([]);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenAmountInput, setTokenAmountInput] = useState('');
  const [tokenUnitsInput, setTokenUnitsInput] = useState('');
  const [keypadModalToken, setKeypadModalToken] = useState<StoredToken | null>(null);

  // Load meters and tokens from localStorage
  useEffect(() => {
    try {
      const savedMeters = localStorage.getItem('edsa_saved_meters_v1');
      if (savedMeters) {
        const parsed = JSON.parse(savedMeters);
        setMeters(parsed);
        if (parsed.length > 0) {
          setSelectedMeterId(parsed[0].id);
        }
      } else {
        // Sample default meter
        const defaultMeter: MeterProfile = {
          id: 'meter-1',
          name: 'Home Meter',
          meterNumber: '01423859201',
          isDefault: true,
        };
        setMeters([defaultMeter]);
        setSelectedMeterId(defaultMeter.id);
        localStorage.setItem('edsa_saved_meters_v1', JSON.stringify([defaultMeter]));
      }

      const savedTokens = localStorage.getItem('edsa_saved_tokens_v1');
      if (savedTokens) {
        setTokens(JSON.parse(savedTokens));
      }
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  // Save meters
  const saveMeters = (updated: MeterProfile[]) => {
    setMeters(updated);
    localStorage.setItem('edsa_saved_meters_v1', JSON.stringify(updated));
  };

  // Save tokens
  const saveTokens = (updated: StoredToken[]) => {
    setTokens(updated);
    localStorage.setItem('edsa_saved_tokens_v1', JSON.stringify(updated));
  };

  const selectedMeter = useMemo(() => {
    return meters.find((m) => m.id === selectedMeterId) || meters[0] || null;
  }, [meters, selectedMeterId]);

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  // Add Meter
  const handleAddMeter = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newMeterNumber.replace(/\D/g, '');
    if (!cleanNum || cleanNum.length < 9) return;

    const newMeter: MeterProfile = {
      id: `meter-${Date.now()}`,
      name: newMeterName.trim() || 'My Meter',
      meterNumber: cleanNum,
      isDefault: meters.length === 0,
    };

    const updated = [...meters, newMeter];
    saveMeters(updated);
    setSelectedMeterId(newMeter.id);
    setNewMeterName('');
    setNewMeterNumber('');
    setShowAddMeterModal(false);
  };

  // Delete Meter
  const handleDeleteMeter = (id: string) => {
    const updated = meters.filter((m) => m.id !== id);
    saveMeters(updated);
    if (selectedMeterId === id && updated.length > 0) {
      setSelectedMeterId(updated[0].id);
    }
  };

  // Format 20 digit token string
  const formatTokenDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 20);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.substring(i, i + 4));
    }
    return parts.join(' - ');
  };

  // Add Token to Vault
  const handleAddToken = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = tokenInput.replace(/\D/g, '');
    if (cleanDigits.length < 20) return;

    const newToken: StoredToken = {
      id: `token-${Date.now()}`,
      token: cleanDigits,
      meterNumber: selectedMeter ? selectedMeter.meterNumber : 'Unknown',
      meterName: selectedMeter ? selectedMeter.name : undefined,
      amountNle: Number(tokenAmountInput) || 0,
      kwhUnits: Number(tokenUnitsInput) || undefined,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      loaded: false,
    };

    const updated = [newToken, ...tokens];
    saveTokens(updated);
    setTokenInput('');
    setTokenAmountInput('');
    setTokenUnitsInput('');
    setShowAddTokenModal(false);
  };

  // Toggle Token Loaded Status
  const toggleTokenLoaded = (id: string) => {
    const updated = tokens.map((t) => (t.id === id ? { ...t, loaded: !t.loaded } : t));
    saveTokens(updated);
  };

  // Delete Token
  const handleDeleteToken = (id: string) => {
    const updated = tokens.filter((t) => t.id !== id);
    saveTokens(updated);
    if (keypadModalToken?.id === id) {
      setKeypadModalToken(null);
    }
  };

  // Tariff calculation (EDSA Sierra Leone rates estimate)
  // Residential: ~2.45 NLe / kWh average (inclusive of GST)
  // Commercial: ~3.80 NLe / kWh
  const estimatedKwh = useMemo(() => {
    if (!calcAmount || calcAmount <= 0) return 0;
    const ratePerKwh = calcTariffType === 'residential' ? 2.45 : 3.80;
    return (calcAmount / ratePerKwh).toFixed(1);
  }, [calcAmount, calcTariffType]);

  const estimatedDays = useMemo(() => {
    const kwh = Number(estimatedKwh);
    if (!kwh || kwh <= 0) return 0;
    // Typical modest Freetown household consumes ~6 kWh/day
    return Math.max(1, Math.round(kwh / 6));
  }, [estimatedKwh]);

  return (
    <main className="min-h-screen relative text-white bg-[#020305] pb-32 selection:bg-yellow-500/30 overflow-x-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-[#020305] pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#020305]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">EDSA Native</span>
                <span className="text-[10px] text-gray-500">•</span>
                <span className="text-[10px] text-gray-400 font-semibold">Prepaid Services</span>
              </div>
              <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>Meter Top-Up & Vault</span>
                <Zap className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </h1>
            </div>
          </div>

          {/* Meter selector pill */}
          {selectedMeter && (
            <button
              onClick={() => setActiveTab('meters')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-gray-200 truncate max-w-[100px]">{selectedMeter.name}</span>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-5 relative z-10">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('buy')}
            className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'buy'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Quick-Pay</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'vault'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Token Vault</span>
            {tokens.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'vault' ? 'bg-slate-950 text-yellow-400' : 'bg-white/10 text-gray-300'
              }`}>
                {tokens.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('calc')}
            className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'calc'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Estimator</span>
          </button>

          <button
            onClick={() => setActiveTab('meters')}
            className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'meters'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>My Meters</span>
          </button>
        </div>

        {/* Selected Meter Quick Banner */}
        {selectedMeter && (
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">Current Target Meter</span>
                <span className="text-[10px] text-gray-500">•</span>
                <span className="text-xs font-bold text-white">{selectedMeter.name}</span>
              </div>
              <div className="font-mono text-lg font-black tracking-widest text-emerald-400">
                {selectedMeter.meterNumber}
              </div>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(selectedMeter.meterNumber, 'meter-top-banner')}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 text-gray-200 active:scale-95"
            >
              {copiedKey === 'meter-top-banner' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 1: USSD QUICK-PAY */}
        {activeTab === 'buy' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Provider Switcher with Brand Logos */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUssdProvider('orange')}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2.5 ${
                  ussdProvider === 'orange'
                    ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden rounded-2xl shadow-md border border-white/10 bg-black">
                  <Image
                    src="/assets/orange-money-logo.png"
                    alt="Orange Money"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] sm:text-xs font-mono font-black bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
                    *144*3*1*1#
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-semibold text-center">
                  Asks for Amount
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUssdProvider('africell')}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2.5 ${
                  ussdProvider === 'africell'
                    ? 'bg-purple-500/15 border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden rounded-2xl shadow-md border border-white/10 bg-[#831843]">
                  <Image
                    src="/assets/afrimoney-logo.webp"
                    alt="AfriMoney"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] sm:text-xs font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    *161*2*2*1*1#
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-semibold text-center">
                  Asks for Meter Number
                </div>
              </button>
            </div>

            {/* Quick Dialer Action Card */}
            <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                    <Image
                      src={ussdProvider === 'orange' ? '/assets/orange-money-logo.png' : '/assets/afrimoney-logo.webp'}
                      alt={ussdProvider === 'orange' ? 'Orange Money' : 'AfriMoney'}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                      Straight USSD Launcher
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {ussdProvider === 'orange' ? '*144*3*1*1#' : '*161*2*2*1*1#'}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {ussdProvider === 'orange' 
                        ? 'Straight code: skips all menus and directly prompts for top-up amount.'
                        : 'Straight code: skips all menus and directly prompts for meter number.'}
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${ussdProvider === 'orange' ? '*144*3*1*1%23' : '*161*2*2*1*1%23'}`}
                  className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95 shrink-0 ${
                    ussdProvider === 'orange'
                      ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                  }`}
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Dial {ussdProvider === 'orange' ? '*144*3*1*1#' : '*161*2*2*1*1#'}</span>
                </a>
              </div>

              {/* Numbered Steps */}
              <div className="space-y-2.5 pt-4 border-t border-white/10">
                <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                  Keypad sequence on your phone:
                </div>

                {ussdProvider === 'orange' ? (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="font-semibold text-gray-300">1. Tap button above to dial <strong>*144*3*1*1#</strong></span>
                      <span className="text-[10px] font-mono bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-bold">START</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="font-semibold text-gray-300">2. Enter your <strong>Top-Up Amount</strong> (in NLe) & press Send</span>
                      <span className="font-mono text-gray-400 font-bold">Amount</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-yellow-400/20 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">3. Enter Meter Number:</div>
                        <div className="font-mono text-sm font-bold text-yellow-400 mt-0.5">
                          {selectedMeter?.meterNumber || 'Select a meter above'}
                        </div>
                      </div>
                      {selectedMeter && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedMeter.meterNumber, 'step-meter-orange')}
                          className="px-3 py-1.5 rounded-lg bg-yellow-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 active:scale-95"
                        >
                          {copiedKey === 'step-meter-orange' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'step-meter-orange' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="font-semibold text-gray-300">4. Enter your Orange Money Secret PIN to confirm</span>
                      <span className="font-mono text-emerald-400 font-bold">PIN</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="font-semibold text-gray-300">5. Receive SMS with your 20-digit token code</span>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">TOKEN</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="font-semibold text-gray-300">1. Tap button above to dial <strong>*161*2*2*1*1#</strong></span>
                      <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">START</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-purple-400/20 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">2. Enter Meter Number:</div>
                        <div className="font-mono text-sm font-bold text-purple-400 mt-0.5">
                          {selectedMeter?.meterNumber || 'Select a meter above'}
                        </div>
                      </div>
                      {selectedMeter && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedMeter.meterNumber, 'step-meter-africell')}
                          className="px-3 py-1.5 rounded-lg bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 active:scale-95"
                        >
                          {copiedKey === 'step-meter-africell' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'step-meter-africell' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="font-semibold text-gray-300">3. Enter Top-Up Amount (in NLe) & press Send</span>
                      <span className="font-mono text-gray-400 font-bold">Amount</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="font-semibold text-gray-300">4. Enter your Afrimoney Secret PIN to validate</span>
                      <span className="font-mono text-emerald-400 font-bold">PIN</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="font-semibold text-gray-300">5. Receive SMS with your 20-digit token code</span>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">TOKEN</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Once SMS Arrives Callout */}
              <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-start gap-3 text-xs text-yellow-200">
                <Sparkles className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white">Received your 20-digit token SMS?</div>
                  <p className="text-gray-300">
                    Save it into your <strong>Token Vault</strong> below so you can display it in huge high-contrast digits while standing at your meter keypad!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('vault');
                      setShowAddTokenModal(true);
                    }}
                    className="inline-flex items-center gap-1 font-bold text-yellow-400 hover:text-yellow-300 pt-1"
                  >
                    <span>Save token into vault now</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: TOKEN HISTORY VAULT */}
        {activeTab === 'vault' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Header & Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Your Saved Tokens</h2>
                <p className="text-xs text-gray-400">Offline vault — accessible even without data or electricity</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddTokenModal(true)}
                className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-yellow-400/20"
              >
                <Plus className="w-4 h-4" />
                <span>Save Token</span>
              </button>
            </div>

            {/* Token List */}
            {tokens.length === 0 ? (
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">No Tokens Stored Yet</div>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  When you buy electricity via mobile money or scratch card, save the 20-digit code here so you never lose an SMS.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddTokenModal(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors"
                >
                  Add Your First Token
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      token.loaded
                        ? 'bg-white/5 border-white/5 opacity-60'
                        : 'bg-slate-900 border-white/10 shadow-lg'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            token.loaded
                              ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {token.loaded ? 'Loaded into Meter' : 'Ready to Punch In'}
                          </span>
                          <span className="text-[11px] text-gray-400">{token.date}</span>
                          {token.meterName && (
                            <span className="text-[11px] text-gray-500 font-semibold">• {token.meterName}</span>
                          )}
                        </div>

                        {/* Formatted Token */}
                        <div className="font-mono text-base sm:text-lg font-black tracking-widest text-white selection:bg-yellow-400 selection:text-slate-950">
                          {formatTokenDisplay(token.token)}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {token.amountNle > 0 && <span>Paid: <strong className="text-white">NLe {token.amountNle}</strong></span>}
                          {token.kwhUnits && <span>Units: <strong className="text-emerald-400">{token.kwhUnits} kWh</strong></span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Big Keypad View */}
                        <button
                          type="button"
                          onClick={() => setKeypadModalToken(token)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-yellow-400 transition-colors"
                          title="View in large keypad mode"
                          aria-label="View large keypad mode"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Copy Token */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(token.token, `token-${token.id}`)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
                          title="Copy raw token"
                          aria-label="Copy token"
                        >
                          {copiedKey === `token-${token.id}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteToken(token.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete token"
                          aria-label="Delete token"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Loaded Toggle Button */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => toggleTokenLoaded(token.id)}
                        className={`inline-flex items-center gap-1.5 font-bold transition-colors ${
                          token.loaded ? 'text-gray-400 hover:text-white' : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{token.loaded ? 'Mark as Not Loaded' : 'Mark as Entered on Keypad'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: TARIFF ESTIMATOR */}
        {activeTab === 'calc' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 shadow-xl space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">Official EDSA Standard</span>
                <h2 className="text-xl font-black text-white">Tariff & Units Estimator</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calculate estimated electricity units (kWh) for your top-up budget.
                </p>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Top-Up Amount (NLe - New Leones)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">NLe</span>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="10"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value) || 0)}
                    className="w-full pl-14 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg focus:outline-none focus:border-yellow-400"
                    placeholder="100"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[50, 100, 200, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalcAmount(preset)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        calcAmount === preset
                          ? 'bg-yellow-400 border-yellow-400 text-slate-950 font-black'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      NLe {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tariff Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Customer Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcTariffType('residential')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      calcTariffType === 'residential'
                        ? 'bg-yellow-400/15 border-yellow-400 text-yellow-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-xs">Residential Household</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">~NLe 2.45 / kWh avg</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcTariffType('commercial')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      calcTariffType === 'commercial'
                        ? 'bg-yellow-400/15 border-yellow-400 text-yellow-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-xs">Commercial / Business</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">~NLe 3.80 / kWh avg</div>
                  </button>
                </div>
              </div>

              {/* Results Display */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Units</span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                    Includes 15% GST
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-emerald-400 tracking-tight">{estimatedKwh}</span>
                  <span className="text-lg font-bold text-gray-400">kWh</span>
                </div>

                <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-gray-400 text-[11px]">Estimated Duration</div>
                    <div className="font-bold text-white mt-0.5">~{estimatedDays} Days of Normal Use</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[11px]">Old Leones Value</div>
                    <div className="font-bold text-gray-300 mt-0.5">
                      {(calcAmount * 1000).toLocaleString()} Le
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                <span>
                  Estimates are calculated according to current EWRC / EDSA Sierra Leone multi-tier billing tariffs. Exact units on your receipt may vary slightly based on lifeline consumption tiers and municipal charges.
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: MY METERS */}
        {activeTab === 'meters' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Saved Meter Profiles</h2>
                <p className="text-xs text-gray-400">Switch target meters for fast 1-tap USSD payments</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMeterModal(true)}
                className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-yellow-400/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Meter</span>
              </button>
            </div>

            <div className="space-y-3">
              {meters.map((meter) => {
                const isSelected = meter.id === selectedMeterId;
                return (
                  <div
                    key={meter.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-yellow-400/10 border-yellow-400 shadow-lg shadow-yellow-400/10'
                        : 'bg-slate-900 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{meter.name}</span>
                          {isSelected && (
                            <span className="text-[9px] bg-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                              Active Target
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-base font-bold text-emerald-400 tracking-wider">
                          {meter.meterNumber}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isSelected && (
                          <button
                            type="button"
                            onClick={() => setSelectedMeterId(meter.id)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-colors"
                          >
                            Set Active
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => copyToClipboard(meter.meterNumber, `list-${meter.id}`)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
                          title="Copy meter number"
                          aria-label="Copy meter number"
                        >
                          {copiedKey === `list-${meter.id}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {meters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMeter(meter.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete meter"
                            aria-label="Delete meter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* MODAL 1: ADD METER */}
      <AnimatePresence>
        {showAddMeterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Add New Meter</h3>
                <button
                  type="button"
                  onClick={() => setShowAddMeterModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMeter} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Meter Nickname</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Home, Shop, Aberdeen Flat"
                    value={newMeterName}
                    onChange={(e) => setNewMeterName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Meter Number (11 or 12 digits)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01423859201"
                    value={newMeterNumber}
                    onChange={(e) => setNewMeterNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-yellow-400"
                  />
                  <span className="text-[10px] text-gray-400">Found on the barcode sticker on your wall meter</span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMeterModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-yellow-400/20"
                  >
                    Save Meter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD TOKEN TO VAULT */}
      <AnimatePresence>
        {showAddTokenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Save Token into Vault</h3>
                <button
                  type="button"
                  onClick={() => setShowAddTokenModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddToken} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">20-Digit STS Token Code</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter or paste 20 digits from SMS"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-base focus:outline-none focus:border-yellow-400 tracking-wider"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>Clean digits count:</span>
                    <span className={tokenInput.replace(/\D/g, '').length === 20 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {tokenInput.replace(/\D/g, '').length} / 20 digits
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">Amount (NLe)</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={tokenAmountInput}
                      onChange={(e) => setTokenAmountInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">Units (kWh) Optional</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 40.8"
                      value={tokenUnitsInput}
                      onChange={(e) => setTokenUnitsInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTokenModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tokenInput.replace(/\D/g, '').length !== 20}
                    className="flex-1 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-yellow-400/20 disabled:opacity-50"
                  >
                    Save Token
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: LARGE KEYPAD DISPLAY MODE */}
      <AnimatePresence>
        {keypadModalToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-yellow-400/30 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6 text-center"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                  METER KEYPAD ASSISTANT
                </span>
                <button
                  type="button"
                  onClick={() => setKeypadModalToken(null)}
                  className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">Punch into Meter Keypad</h3>
                <p className="text-xs text-gray-400 mt-1">High-contrast display for low-light meter cupboards</p>
              </div>

              {/* 5 blocks of 4 digits in high visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 py-2">
                {[0, 1, 2, 3, 4].map((chunkIdx) => {
                  const chunk = keypadModalToken.token.slice(chunkIdx * 4, chunkIdx * 4 + 4);
                  return (
                    <div
                      key={chunkIdx}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-yellow-400/40 shadow-inner flex flex-col items-center justify-center"
                    >
                      <span className="text-[9px] font-black text-gray-500 mb-1">PART {chunkIdx + 1}</span>
                      <span className="font-mono text-2xl sm:text-3xl font-black text-yellow-400 tracking-wider">
                        {chunk}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="text-left">
                  <div className="text-[10px] text-gray-400">Target Meter:</div>
                  <div className="font-mono font-bold text-white">{keypadModalToken.meterNumber}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(keypadModalToken.token, 'keypad-modal')}
                  className="px-4 py-2 rounded-xl bg-yellow-400 text-slate-950 font-bold flex items-center gap-1.5"
                >
                  {copiedKey === 'keypad-modal' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'keypad-modal' ? 'Copied' : 'Copy All'}</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleTokenLoaded(keypadModalToken.id);
                    setKeypadModalToken(null);
                  }}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5 fill-slate-950 text-emerald-500" />
                  <span>Mark as Successfully Loaded</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
