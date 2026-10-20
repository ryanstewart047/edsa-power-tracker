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
  Plug
} from 'lucide-react';

export interface MeterCodeItem {
  code: string;
  meterBrand: 'Conlog' | 'Hexing' | 'Inhemeter' | 'Universal';
  title: string;
  description: string;
  action: string;
  category: 'beeper' | 'diagnostic' | 'error' | 'token';
}

const METER_CODES_DATA: MeterCodeItem[] = [
  // --- Beeper Silence Codes ---
  {
    code: 'Press & hold 0 for 3 sec',
    meterBrand: 'Conlog',
    title: 'Silence Low-Credit Alarm Beeper (Conlog)',
    description: 'Stops the continuous annoying high-pitched beep when your meter credit is below 10 kWh.',
    action: 'Press and hold down the 0 key on your Customer Interface Unit (CIU) for 3 to 5 seconds until it beeps once and stops.',
    category: 'beeper'
  },
  {
    code: '#037#',
    meterBrand: 'Conlog',
    title: 'Mute Audio Alarm Tone via Shortcode (Conlog)',
    description: 'Alternative shortcode for modern wireless and plug-in Conlog keypad monitors.',
    action: 'Type #037# and press the Enter (hash / blue) button. The display will show "bEEp OFF" or confirm mute.',
    category: 'beeper'
  },
  {
    code: '812#',
    meterBrand: 'Hexing',
    title: 'Silence Low Credit Beeper (Hexing Meters)',
    description: 'Mutes the low-power alarm beep on Hexing single-phase and three-phase meters.',
    action: 'Type 812 followed by the hash (#) or Enter key. The alarm buzzer will silence.',
    category: 'beeper'
  },
  {
    code: '01#',
    meterBrand: 'Inhemeter',
    title: 'Mute Beeper Sound (Inhemeter Keypads)',
    description: 'Silences the audio alarm buzzer on Inhemeter split prepaid keypads.',
    action: 'Type 01 and press #. If the alarm turns on again after 24 hours, repeat code to silence.',
    category: 'beeper'
  },
  {
    code: '#103#',
    meterBrand: 'Universal',
    title: 'Alternative Beeper Mute Code (General CIU)',
    description: 'Works on multiple EDSA-compatible split prepaid keypad units.',
    action: 'Type #103# and press Enter to disable the buzzer until next credit recharge.',
    category: 'beeper'
  },

  // --- Diagnostic Shortcodes ---
  {
    code: '#100#',
    meterBrand: 'Conlog',
    title: 'Check 11-Digit Meter Serial Number (MSN)',
    description: 'Displays the exact 11-digit meter number needed to buy EDSA electricity tokens.',
    action: 'Type #100# (or #4#) into the keypad. The 11 digits will scroll across the screen.',
    category: 'diagnostic'
  },
  {
    code: '#073#',
    meterBrand: 'Conlog',
    title: 'Check Meter Trip Reason / Cut-Off Status',
    description: 'Explains why your electricity went off (overload, tamper, earth fault, or low balance).',
    action: 'Type #073# on keypad. If it says "tA-01" = tamper cover opened; "oL-02" = excessive power draw.',
    category: 'diagnostic'
  },
  {
    code: '#1#',
    meterBrand: 'Conlog',
    title: 'Live Electricity Consumption (Kilowatts)',
    description: 'Shows exactly how much electrical power your house is using right this second.',
    action: 'Type #1# on keypad. Turn off appliances one by one to find which one is burning power fastest.',
    category: 'diagnostic'
  },
  {
    code: '#005#',
    meterBrand: 'Conlog',
    title: 'Key Revision Number (KRN Check)',
    description: 'Checks whether your meter has been updated to KRN2 (TID Rollover standard).',
    action: 'Type #005# on keypad. If screen shows "02", your meter is fully updated.',
    category: 'diagnostic'
  },
  {
    code: '#036# [Meter Number] #',
    meterBrand: 'Conlog',
    title: 'Re-Sync Wireless CIU with Outdoor Pole Meter',
    description: 'Fixes communication timeout when the indoor keypad is not talking to the pole.',
    action: 'Type #036# followed by your 11-digit meter number then #. Stand within 10 meters of the pole.',
    category: 'diagnostic'
  },
  {
    code: '#000#',
    meterBrand: 'Conlog',
    title: 'Internal Meter Trip Switch Test',
    description: 'Tests if the meter breaker contactor is mechanically functioning.',
    action: 'Type #000# and press # to trigger a brief test reset.',
    category: 'diagnostic'
  },

  // --- Error Codes & Fixes ---
  {
    code: 'Con_FAIL / E07',
    meterBrand: 'Conlog',
    title: 'Communication Failure with Meter Base',
    description: 'Keypad is unable to connect to the outdoor electrical pole box.',
    action: '1. Plug the CIU directly into a fixed wall socket (NEVER through extension cords or multi-plugs). 2. Make sure main pole breaker is ON. 3. Re-pair by typing your 11-digit meter number.',
    category: 'error'
  },
  {
    code: 'Loc (Lockout)',
    meterBrand: 'Conlog',
    title: 'Overload Load Cut-Off Lockout',
    description: 'Meter cut power because current exceeded safety threshold repeatedly in 45 seconds.',
    action: 'Immediately switch off high-draw appliances (air conditioners, electric kettles, water heaters). The meter will automatically reconnect after 45 to 60 seconds.',
    category: 'error'
  },
  {
    code: 'tOPEN',
    meterBrand: 'Conlog',
    title: 'Terminal Cover Open / Tamper Triggered',
    description: 'The protective wire terminal box was disturbed or opened, triggering tamper safety lockout.',
    action: 'Do not attempt to bypass wiring. Call EDSA support (112 or 076 892 222) to request an authorized field technician tamper reset token.',
    category: 'error'
  },
  {
    code: 'E04',
    meterBrand: 'Conlog',
    title: 'No Supply Voltage / Extreme Low Voltage',
    description: 'Grid voltage has dropped severely below operating limit or phase line is dead.',
    action: 'Check neighboring houses. If their lights are dim, EDSA transformer phase has low voltage. Unplug refrigerators immediately to prevent compressor burnout.',
    category: 'error'
  },
  {
    code: 'AAAAAA / EEEEE',
    meterBrand: 'Universal',
    title: 'Invalid Token / Rejection',
    description: 'The 20-digit electricity token was rejected by the keypad.',
    action: '1. Verify the meter number on your SMS receipt matches your meter exactly. 2. Ensure you have not entered the 20 digits out of order. 3. Enter #005# to ensure meter is not awaiting KRN update.',
    category: 'token'
  },
  {
    code: 'OLd / Used',
    meterBrand: 'Universal',
    title: 'Token Already Used / Expired',
    description: 'This 20-digit token has already been successfully loaded into the meter previously.',
    action: 'Check your Token Vault history. Once a token is loaded into a meter base, it cannot be re-used.',
    category: 'token'
  },
  {
    code: 'SEr / E12',
    meterBrand: 'Conlog',
    title: 'CIU Unpaired or Replacement Mode',
    description: 'Keypad was reset or replaced and needs to bind to the meter serial.',
    action: 'Type your 11-digit Meter Serial Number into the keypad and press Enter. The screen will display "PLC CON" with a checkmark once paired.',
    category: 'error'
  }
];

interface MeterTroubleshooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'beeper' | 'diagnostic' | 'error' | 'token';
}

export default function MeterTroubleshooterModal({
  isOpen,
  onClose,
  defaultCategory = 'beeper'
}: MeterTroubleshooterModalProps) {
  const [selectedBrand, setSelectedBrand] = useState<'All' | 'Conlog' | 'Hexing' | 'Inhemeter'>('All');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'beeper' | 'diagnostic' | 'error' | 'token'>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredCodes = useMemo(() => {
    return METER_CODES_DATA.filter((item) => {
      const matchBrand = selectedBrand === 'All' || item.meterBrand === selectedBrand || item.meterBrand === 'Universal';
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q);

      return matchBrand && matchCategory && matchSearch;
    });
  }, [selectedBrand, selectedCategory, searchQuery]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Prepaid Meter Assistant & Codes
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Shortcodes to silence beeping alarms, decode error screens, and troubleshoot Conlog & Hexing meters.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            aria-label="Close meter assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlighted Beeper Mute Card */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 shadow-sm shadow-rose-600/30">
              <VolumeX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>Mute Annoying Meter Beeper / Alarm</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                  Most Requested
                </span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                Is your keypad beeping non-stop due to low units? Press and hold <strong className="text-slate-900">0 for 3 seconds</strong>, or enter <strong className="text-slate-900">#037#</strong> (Conlog) or <strong className="text-slate-900">812#</strong> (Hexing).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('beeper');
              setSearchQuery('');
            }}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            View Beeper Codes
          </button>
        </div>

        {/* Filter Bar: Categories */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
          {[
            { id: 'all', label: 'All Codes' },
            { id: 'beeper', label: '🔇 Silence Beeper' },
            { id: 'diagnostic', label: '📊 Status & Check Codes' },
            { id: 'error', label: '⚠️ Error Decrypter (Con_FAIL, Loc)' },
            { id: 'token', label: '🔢 Rejected Token Help' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
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

        {/* Search & Brand Selector */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code or error (e.g. Con_FAIL, #100#, beep, lockout)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brand:</span>
            {(['All', 'Conlog', 'Hexing', 'Inhemeter'] as const).map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedBrand === brand
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {filteredCodes.length > 0 ? (
            filteredCodes.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                        {item.code}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                        {item.meterBrand}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 pt-1">{item.title}</h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.code)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold transition-all active:scale-95 shrink-0"
                    title="Copy code"
                  >
                    {copiedCode === item.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                    How to fix / enter:
                  </span>
                  <p className="leading-relaxed font-normal">{item.action}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">No matching codes found for &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedBrand('All');
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Always plug your CIU directly into a wall socket rather than an extension cable.</span>
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
