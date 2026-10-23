/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo } from 'react';
import {
  VolumeX,
  Search,
  Wrench,
  HelpCircle,
  Copy,
  Check,
  X,
  Lightbulb,
  CornerDownLeft,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import {
  METER_CODES_DATA,
  METER_BRANDS,
  SIERRA_LEONE_KEYPAD_TYPES,
  type MeterBrand,
  type KeypadType,
  type MeterCategory,
  type MeterCodeItem
} from '@/lib/meterCodes';

interface MeterTroubleshooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: MeterCategory;
  defaultBrand?: MeterBrand | 'All';
}

export default function MeterTroubleshooterModal({
  isOpen,
  onClose,
  defaultCategory = 'beeper',
  defaultBrand = 'All'
}: MeterTroubleshooterModalProps) {
  const [selectedBrand, setSelectedBrand] = useState<MeterBrand | 'All'>(defaultBrand);
  const [selectedKeypadType, setSelectedKeypadType] = useState<KeypadType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<MeterCategory>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showKeypadGuide, setShowKeypadGuide] = useState(true);

  const filteredCodes = useMemo(() => {
    return METER_CODES_DATA.filter((item: MeterCodeItem) => {
      const matchBrand =
        selectedBrand === 'All' ||
        item.meterBrand === selectedBrand ||
        item.meterBrand === 'Universal';

      const matchKeypad =
        selectedKeypadType === 'all' || item.keypadType === selectedKeypadType;

      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        (item.rawDigits && item.rawDigits.toLowerCase().includes(q)) ||
        (item.alternativeStarHashCode && item.alternativeStarHashCode.toLowerCase().includes(q)) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.meterBrand.toLowerCase().includes(q);

      return matchBrand && matchKeypad && matchCategory && matchSearch;
    });
  }, [selectedBrand, selectedKeypadType, selectedCategory, searchQuery]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl sm:rounded-[2rem] border border-slate-200 shadow-2xl p-5 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>Sierra Leone Meter Keypad Assistant</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  No * / # Required
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verified shortcodes for Conlog, Hexing, Inhemeter, Chint &amp; Landis+Gyr meters using standard <strong>0-9 &amp; ↵ Enter</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0"
            aria-label="Close meter assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sierra Leone Keypad Fact & Visual Guide Card */}
        {showKeypadGuide && (
          <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 p-4 sm:p-5 relative overflow-hidden">
            <button
              type="button"
              onClick={() => setShowKeypadGuide(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              title="Dismiss guide"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-2 pr-6">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <span>Why do most meters in Sierra Leone have NO * or #?</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                    EDSA meters (Conlog, Hexing, Inhemeter, Chint) use the international <strong>STS Standard (IEC 62055)</strong>. 
                    Their keypads have only numbers <strong>0 to 9</strong>, an <strong>Enter button (↵ / Blue key)</strong>, and a <strong>Backspace (⌫ / C)</strong>. You do NOT need * or #!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-800 text-xs font-medium">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 border border-blue-200/60 shadow-2xs">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm shrink-0">
                      ↵
                    </span>
                    <div>
                      <strong className="block text-[11px] font-black text-slate-900">Enter / Blue Key</strong>
                      <span className="text-[10px] text-slate-500">Press to confirm code</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 border border-blue-200/60 shadow-2xs">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm shrink-0">
                      ⌫
                    </span>
                    <div>
                      <strong className="block text-[11px] font-black text-slate-900">Backspace / C Key</strong>
                      <span className="text-[10px] text-slate-500">Erases mistake or hold to mute</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 border border-blue-200/60 shadow-2xs">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                      0-9
                    </span>
                    <div>
                      <strong className="block text-[11px] font-black text-slate-900">Digits + ↵</strong>
                      <span className="text-[10px] text-slate-500">e.g. Type 812 then press ↵</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick-Action: Mute Alarm Banner */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 shadow-sm shadow-rose-600/30">
              <VolumeX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>Stop Beeping Meter Alarm</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                  Top Shortcut
                </span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                On <strong className="text-slate-900">Conlog</strong>: Press &amp; hold <strong>0 for 3 seconds</strong> or type <strong>030 + ↵</strong>. On <strong className="text-slate-900">Hexing</strong>: Type <strong>812 + ↵</strong>. On <strong className="text-slate-900">Inhemeter</strong>: Type <strong>803 + ↵</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('beeper');
              setSearchQuery('');
            }}
            className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Mute Beeper Codes</span>
          </button>
        </div>

        {/* Keypad Type Filters (No * / # focus) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Keypad Configuration:</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">Filter by how your physical keypad behaves</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedKeypadType('all')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedKeypadType === 'all'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black">All Keypad Styles</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">All</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Show all standard and legacy codes</p>
            </button>

            {SIERRA_LEONE_KEYPAD_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedKeypadType(type.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedKeypadType === type.id
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1">
                    <span>{type.icon}</span>
                    <span>{type.name}</span>
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                    type.id === 'no_star_hash'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {type.badge}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
          {([
            { id: 'all', label: 'All Shortcodes' },
            { id: 'beeper', label: '🔇 Silence Beeper' },
            { id: 'balance', label: '⚡ Check Balance (kWh)' },
            { id: 'diagnostic', label: '📊 Live Load & Voltage (kW/V)' },
            { id: 'error', label: '⚠️ Error Decoder (Con_FAIL, Loc)' },
            { id: 'token', label: '🔢 Rejected Token Help' }
          ] as const).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as MeterCategory)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Brand Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code or error (e.g. 812, 008, 030, Con_FAIL, lockout)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brand:</span>
            {METER_BRANDS.slice(0, 5).map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => setSelectedBrand(brand.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  selectedBrand === brand.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {brand.id}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {filteredCodes.length > 0 ? (
            filteredCodes.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Primary Code Display */}
                      <span className="font-mono text-sm sm:text-base font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1.5">
                        {item.code}
                      </span>

                      {/* Keypad Type Badge */}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        item.keypadType === 'no_star_hash'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.keypadType === 'press_and_hold'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {item.keypadType === 'no_star_hash'
                          ? 'Uses ↵ (No * / #)'
                          : item.keypadType === 'press_and_hold'
                          ? 'Hold 3-5 Sec'
                          : 'Keypad with #'}
                      </span>

                      {/* Brand Badge */}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                        {item.meterBrand}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 pt-0.5">{item.title}</h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.rawDigits || item.code)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold transition-all active:scale-95 shrink-0"
                    title="Copy code to clipboard"
                  >
                    {copiedCode === (item.rawDigits || item.code) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Digits</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                {/* Step-by-Step Keypad Instruction */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                    <span className="uppercase tracking-wider">How to enter on keypad:</span>
                    <span className="text-blue-600 font-semibold flex items-center gap-1">
                      <CornerDownLeft className="w-3 h-3" />
                      <span>{item.enterKeyEquivalent}</span>
                    </span>
                  </div>
                  <p className="leading-relaxed font-normal text-slate-800">{item.action}</p>

                  {item.alternativeStarHashCode && (
                    <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                      <span>If your keypad has a hash key, you can also type: </span>
                      <strong className="text-slate-800 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {item.alternativeStarHashCode}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">No matching codes found for &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedBrand('All');
                  setSelectedKeypadType('all');
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Standard Sierra Leone meters: Just type the numbers and press the blue or arrow (↵) Enter key.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
