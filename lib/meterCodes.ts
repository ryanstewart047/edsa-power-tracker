export type MeterBrand =
  | 'Conlog'
  | 'Hexing'
  | 'Inhemeter'
  | 'Chint'
  | 'Landis+Gyr'
  | 'Kaifa'
  | 'Universal';

export type KeypadType = 'no_star_hash' | 'with_star_hash' | 'press_and_hold';

export type MeterCategory = 'all' | 'beeper' | 'balance' | 'diagnostic' | 'error' | 'token';

export interface MeterCodeItem {
  id: string;
  code: string;
  rawDigits?: string;
  alternativeStarHashCode?: string;
  keypadType: KeypadType;
  meterBrand: MeterBrand;
  title: string;
  description: string;
  action: string;
  enterKeyEquivalent: '↵ (Enter / Blue button)' | '↵ (Enter / E / Red)' | 'Long Press Button' | '# (Hash Keypad)';
  category: 'beeper' | 'balance' | 'diagnostic' | 'error' | 'token';
}

export const SIERRA_LEONE_KEYPAD_TYPES = [
  {
    id: 'no_star_hash' as const,
    name: 'Standard Sierra Leone (No * or #)',
    badge: 'Most Common',
    description: 'Keypad has numbers 0-9, an Enter arrow (↵ / Blue button), and a Backspace (⌫ / C). Uses numeric codes followed by Enter ↵.',
    icon: '↵'
  },
  {
    id: 'press_and_hold' as const,
    name: 'Long-Press (Hold 3-5 Sec)',
    badge: 'Physical Buttons',
    description: 'No code typing required. Directly press and hold down the 0 key, the Backspace (⌫) key, or Clear (C) button for 3 to 5 seconds.',
    icon: '⏳'
  },
  {
    id: 'with_star_hash' as const,
    name: 'Keypads with * and #',
    badge: 'SMS / Legacy CIU',
    description: 'Split meters or older units with full telephone-style keypads featuring asterisk (*) and hash (#).',
    icon: '#'
  }
];

export const METER_BRANDS: { id: MeterBrand | 'All'; name: string; keypadNote: string }[] = [
  { id: 'All', name: 'All Brands', keypadNote: 'Browse all verified Sierra Leone EDSA meter codes' },
  { id: 'Conlog', name: 'Conlog (BEC23 / BEC44)', keypadNote: 'Blue ↵ Enter button, Backspace ⌫. No * or #' },
  { id: 'Hexing', name: 'Hexing (HXE12 / HXE110)', keypadNote: 'Enter ↵ or E, Clear C. Uses 812 for beeper' },
  { id: 'Inhemeter', name: 'Inhemeter (DDZ / DTZ)', keypadNote: 'Enter ↵, Clear C. Uses 803 for beeper' },
  { id: 'Chint', name: 'Chint (DDSY666)', keypadNote: 'Enter ↵, Clear C. Uses 52 or hold C to mute' },
  { id: 'Landis+Gyr', name: 'Landis+Gyr (Cashpower)', keypadNote: 'Red/Blue ↵, Esc ⌫. Uses 789 for beeper' },
  { id: 'Kaifa', name: 'Kaifa / Holley', keypadNote: 'Enter ↵, Clear C. Uses 812 or 555 for beeper' },
  { id: 'Universal', name: 'Universal STS Standard', keypadNote: 'Standard IEC 62055 STS codes working on all meters' }
];

export const METER_CODES_DATA: MeterCodeItem[] = [
  // =========================================================================
  // 1. BEEPER / BUZZER SILENCE CODES (NO * / # FOCUS)
  // =========================================================================
  {
    id: 'conlog-mute-hold-0',
    code: 'Press & hold 0 for 3 sec',
    rawDigits: '0',
    keypadType: 'press_and_hold',
    meterBrand: 'Conlog',
    title: 'Silence Low Credit Beeper (Conlog — Method 1)',
    description: 'The quickest way to stop the annoying continuous high-pitch alarm beep when units drop below 10 kWh on Conlog CIUs.',
    action: 'Press and hold down the 0 key on your keypad for 3 to 5 seconds continuously until you hear a single confirmation chime, then release. The beeper will silence for 24-48 hours.',
    enterKeyEquivalent: 'Long Press Button',
    category: 'beeper'
  },
  {
    id: 'conlog-mute-hold-backspace',
    code: 'Press & hold ⌫ (Backspace) for 3 sec',
    rawDigits: '⌫',
    keypadType: 'press_and_hold',
    meterBrand: 'Conlog',
    title: 'Silence Low Credit Beeper (Conlog — Method 2)',
    description: 'Alternative physical mute method for Conlog wireless keypads (BEC44) and wall-mount units.',
    action: 'Press and hold down the Left Arrow / Backspace (⌫ / ←) key for 3 seconds. The alarm buzzer will immediately cut off.',
    enterKeyEquivalent: 'Long Press Button',
    category: 'beeper'
  },
  {
    id: 'conlog-mute-code-030',
    code: '030 + ↵',
    rawDigits: '030',
    alternativeStarHashCode: '#037#',
    keypadType: 'no_star_hash',
    meterBrand: 'Conlog',
    title: 'Mute Audio Alarm Tone (Conlog Numeric Shortcode)',
    description: 'Numeric shortcode command for Conlog meters without asterisk or hash buttons.',
    action: 'Type 030 on the keypad and press the blue Enter (↵) button. The LCD screen will display "bEEp OFF" or "MUTE". (If your keypad has a hash key, #037# also works).',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'beeper'
  },
  {
    id: 'hexing-mute-812',
    code: '812 + ↵',
    rawDigits: '812',
    alternativeStarHashCode: '812#',
    keypadType: 'no_star_hash',
    meterBrand: 'Hexing',
    title: 'Silence Low Credit Buzzer (Hexing Meters)',
    description: 'Instantly silences the emergency low-balance beeper on all Hexing single-phase & three-phase meters across Sierra Leone.',
    action: 'Type 812 and press the Enter (↵ or E) button. The screen will display "bEEP OFF" and the beeping will stop immediately.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'beeper'
  },
  {
    id: 'hexing-unmute-813',
    code: '813 + ↵',
    rawDigits: '813',
    alternativeStarHashCode: '813#',
    keypadType: 'no_star_hash',
    meterBrand: 'Hexing',
    title: 'Unmute / Test Alarm Buzzer (Hexing Meters)',
    description: 'Restores the audible warning beeper on Hexing meters if you want to test whether the alarm speaker is functional.',
    action: 'Type 813 and press Enter (↵). The LCD will show "bEEP On" and emit a brief confirmation chime.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'beeper'
  },
  {
    id: 'inhemeter-mute-803',
    code: '803 + ↵',
    rawDigits: '803',
    alternativeStarHashCode: '01#',
    keypadType: 'no_star_hash',
    meterBrand: 'Inhemeter',
    title: 'Silence Low Credit Alarm (Inhemeter Keypads)',
    description: 'Mutes the low-power audio buzzer on Inhemeter split prepaid customer interface keypads.',
    action: 'Type 803 and press the Enter (↵ / OK) button. If your model does not recognize 803, press and hold down the Enter (↵) button for 5 seconds.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'beeper'
  },
  {
    id: 'chint-mute-52',
    code: '52 + ↵',
    rawDigits: '52',
    keypadType: 'no_star_hash',
    meterBrand: 'Chint',
    title: 'Silence Low Credit Buzzer (Chint Meters — Method 1)',
    description: 'Numeric shortcode to silence the warning buzzer on Chint DDSY666 and DTSY666 STS prepaid meters.',
    action: 'Type 52 and press the Enter (↵) button. The beeper will immediately turn off.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'beeper'
  },
  {
    id: 'chint-mute-hold-c',
    code: 'Press & hold C (Clear) for 4 sec',
    rawDigits: 'C',
    keypadType: 'press_and_hold',
    meterBrand: 'Chint',
    title: 'Silence Low Credit Buzzer (Chint Meters — Method 2)',
    description: 'One-touch physical silence shortcut for Chint prepaid meter keypads.',
    action: 'Press and hold down the C (Clear) key on the keypad for 4 seconds until the beeping silences.',
    enterKeyEquivalent: 'Long Press Button',
    category: 'beeper'
  },
  {
    id: 'landis-mute-789',
    code: '789 + ↵',
    rawDigits: '789',
    keypadType: 'no_star_hash',
    meterBrand: 'Landis+Gyr',
    title: 'Silence Low Credit Alarm (Landis+Gyr Cashpower)',
    description: 'Silences the audio alarm on Landis+Gyr Cashpower, Gemini, and Libra STS meters.',
    action: 'Type 789 and press the blue or red Enter (↵) button. Alternatively, press and hold the Enter (↵) button for 3 seconds.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'beeper'
  },
  {
    id: 'kaifa-mute-812',
    code: '812 + ↵',
    rawDigits: '812',
    keypadType: 'no_star_hash',
    meterBrand: 'Kaifa',
    title: 'Silence Low Credit Alarm (Kaifa & Holley Meters)',
    description: 'Mutes the low-power audio alarm on Kaifa and Holley STS keypads.',
    action: 'Type 812 and press the Enter (↵) button. If 812 is not accepted, try 555 and press Enter (↵).',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'beeper'
  },
  {
    id: 'universal-mute-100',
    code: '100 + ↵',
    rawDigits: '100',
    alternativeStarHashCode: '#103#',
    keypadType: 'no_star_hash',
    meterBrand: 'Universal',
    title: 'Universal STS Audio Alarm Silence Code',
    description: 'Generic STS-standard audio silence code supported by most EDSA customer interface units without * or #.',
    action: 'Type 100 and press Enter (↵). If your keypad has a hash key, you can also type #103#.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'beeper'
  },

  // =========================================================================
  // 2. BALANCE & LIVE USAGE CODES (NO * / # FOCUS)
  // =========================================================================
  {
    id: 'hexing-check-balance',
    code: '01 + ↵',
    rawDigits: '01',
    alternativeStarHashCode: '#01#',
    keypadType: 'no_star_hash',
    meterBrand: 'Hexing',
    title: 'Check Remaining Electricity Balance (Hexing)',
    description: 'Displays exactly how many kilowatt-hours (kWh) are remaining in your meter right now.',
    action: 'Type 01 and press Enter (↵). The LCD will show your remaining balance with a kWh indicator.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'balance'
  },
  {
    id: 'inhemeter-check-balance',
    code: '01 + ↵',
    rawDigits: '01',
    keypadType: 'no_star_hash',
    meterBrand: 'Inhemeter',
    title: 'Check Remaining Units (Inhemeter)',
    description: 'Queries the current available prepaid balance on Inhemeter units.',
    action: 'Type 01 and press the Enter (↵) key. The screen displays the remaining credit in kWh.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'balance'
  },
  {
    id: 'chint-check-balance',
    code: '01 + ↵',
    rawDigits: '01',
    keypadType: 'no_star_hash',
    meterBrand: 'Chint',
    title: 'Check Remaining Units (Chint Meters)',
    description: 'Checks the remaining credit units on Chint STS meters.',
    action: 'Type 01 and press Enter (↵). The remaining balance will show on the digital display.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'balance'
  },
  {
    id: 'conlog-check-balance',
    code: '000 + ↵',
    rawDigits: '000',
    keypadType: 'no_star_hash',
    meterBrand: 'Conlog',
    title: 'Refresh & Check Remaining Credit (Conlog)',
    description: 'Forces the wireless CIU to refresh its radio link with the pole and display current balance.',
    action: 'Type 000 and press the blue Enter (↵) button. The screen will synchronize and display your remaining units.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'balance'
  },
  {
    id: 'universal-check-balance',
    code: '01 + ↵',
    rawDigits: '01',
    keypadType: 'no_star_hash',
    meterBrand: 'Universal',
    title: 'Universal Check Remaining Balance',
    description: 'Works across Hexing, Inhemeter, Chint, Kaifa, and Landis+Gyr meters.',
    action: 'Type 01 and press Enter (↵). Displays available credit.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'balance'
  },

  // =========================================================================
  // 3. DIAGNOSTIC, LOAD & VOLTAGE CODES (NO * / # FOCUS)
  // =========================================================================
  {
    id: 'conlog-check-msn',
    code: '008 + ↵',
    rawDigits: '008',
    alternativeStarHashCode: '#100#',
    keypadType: 'no_star_hash',
    meterBrand: 'Conlog',
    title: 'Find 11-Digit Meter Serial Number (Conlog)',
    description: 'Extracts your exact 11-digit EDSA meter number needed to buy power tokens via Afrimoney or Orange Money.',
    action: 'Type 008 and press the blue Enter (↵) button. The 11-digit serial number will scroll across the screen in two parts.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'diagnostic'
  },
  {
    id: 'hexing-check-msn',
    code: '02 + ↵',
    rawDigits: '02',
    alternativeStarHashCode: '804#',
    keypadType: 'no_star_hash',
    meterBrand: 'Hexing',
    title: 'Find Meter Number (Hexing Meters)',
    description: 'Displays the meter number on the screen without having to climb up to the pole box.',
    action: 'Type 02 and press Enter (↵). (If 02 is not supported on your firmware, type 804 and press Enter).',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'diagnostic'
  },
  {
    id: 'inhemeter-check-msn',
    code: '07 + ↵',
    rawDigits: '07',
    keypadType: 'no_star_hash',
    meterBrand: 'Inhemeter',
    title: 'Find Meter Number (Inhemeter & Chint)',
    description: 'Displays the full meter serial number on Inhemeter and Chint prepaid keypads.',
    action: 'Type 07 and press Enter (↵). The digits will scroll across the screen.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'diagnostic'
  },
  {
    id: 'conlog-check-load',
    code: '007 + ↵',
    rawDigits: '007',
    alternativeStarHashCode: '#1#',
    keypadType: 'no_star_hash',
    meterBrand: 'Conlog',
    title: 'Real-Time Power Consumption in kW (Conlog)',
    description: 'See exactly how much electricity your home is pulling right now in kilowatts.',
    action: 'Type 007 and press Enter (↵). Turn off appliances one by one to find which device (AC, kettle, fridge) is consuming the most power.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'diagnostic'
  },
  {
    id: 'hexing-check-load',
    code: '03 + ↵',
    rawDigits: '03',
    keypadType: 'no_star_hash',
    meterBrand: 'Hexing',
    title: 'Live Wattage Draw in kW (Hexing & Inhemeter)',
    description: 'Shows live instantaneous electrical power in kilowatts.',
    action: 'Type 03 and press Enter (↵). Displays the exact active load currently passing through the meter.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'diagnostic'
  },
  {
    id: 'hexing-check-voltage',
    code: '04 + ↵',
    rawDigits: '04',
    keypadType: 'no_star_hash',
    meterBrand: 'Hexing',
    title: 'Check Live Grid Voltage in Volts (Hexing, Inhemeter, Chint)',
    description: 'Checks whether EDSA supply has proper voltage (standard is 220V - 240V).',
    action: 'Type 04 and press Enter (↵). If the number is below 180V, voltage is dangerously low; turn off refrigerators and ACs immediately.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'diagnostic'
  },
  {
    id: 'conlog-check-voltage',
    code: '002 + ↵',
    rawDigits: '002',
    keypadType: 'no_star_hash',
    meterBrand: 'Conlog',
    title: 'Check Grid Voltage in Volts (Conlog)',
    description: 'Measures live AC line voltage reaching your Conlog meter base.',
    action: 'Type 002 and press the blue Enter (↵) button. Screen will show voltage like "228.4 V".',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'diagnostic'
  },
  {
    id: 'hexing-check-current',
    code: '05 + ↵',
    rawDigits: '05',
    keypadType: 'no_star_hash',
    meterBrand: 'Hexing',
    title: 'Check Current Amperage in Amps (Hexing, Inhemeter, Chint)',
    description: 'Shows total electrical current in Amperes being drawn by all running appliances.',
    action: 'Type 05 and press Enter (↵). If current reaches 30A or 40A, your meter is close to an overload trip.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'diagnostic'
  },
  {
    id: 'conlog-check-cumulative',
    code: '009 + ↵',
    rawDigits: '009',
    keypadType: 'no_star_hash',
    meterBrand: 'Conlog',
    title: 'Total Cumulative Electricity Consumed (Conlog)',
    description: 'Displays the all-time total kilowatt-hours used by your household since meter installation.',
    action: 'Type 009 and press the blue Enter (↵) button. Great for landlords and tenants to verify lifetime usage.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'diagnostic'
  },
  {
    id: 'hexing-check-cumulative',
    code: '07 + ↵',
    rawDigits: '07',
    keypadType: 'no_star_hash',
    meterBrand: 'Hexing',
    title: 'Total All-Time Consumption in kWh (Hexing)',
    description: 'Total cumulative active energy registered on Hexing meters.',
    action: 'Type 07 and press Enter (↵). Shows total kilowatt-hours consumed.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'diagnostic'
  },
  {
    id: 'conlog-krn-check',
    code: '005 + ↵',
    rawDigits: '005',
    alternativeStarHashCode: '#005#',
    keypadType: 'no_star_hash',
    meterBrand: 'Conlog',
    title: 'Check Key Revision Number (KRN / TID Rollover)',
    description: 'Verifies whether your meter has been upgraded to KRN2 to prevent token rejection.',
    action: 'Type 005 and press Enter (↵). If screen shows "02", your meter is fully updated to the new STS standard. If it shows "01", you need 2 Key Change Tokens from EDSA.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'diagnostic'
  },
  {
    id: 'conlog-trip-status',
    code: '048 + ↵',
    rawDigits: '048',
    alternativeStarHashCode: '#073#',
    keypadType: 'no_star_hash',
    meterBrand: 'Conlog',
    title: 'Check Meter Trip Reason / Cut-Off Status',
    description: 'Explains why electricity went off (overload trip, tamper detection, or dead line).',
    action: 'Type 048 and press Enter (↵). "oL" = Overload (draw too high); "tA" = Tamper switch opened; "CrEd" = Zero balance.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'diagnostic'
  },
  {
    id: 'hexing-last-token',
    code: '801 + ↵',
    rawDigits: '801',
    keypadType: 'no_star_hash',
    meterBrand: 'Hexing',
    title: 'Check Last Entered 20-Digit Token (Hexing)',
    description: 'Retrieves the last token loaded into the meter to check if a purchase succeeded.',
    action: 'Type 801 and press Enter (↵). The last 20 digits loaded will display across the screen.',
    enterKeyEquivalent: '↵ (Enter / E / Red)',
    category: 'diagnostic'
  },

  // =========================================================================
  // 4. ERROR CODES & HARDWARE FIXES
  // =========================================================================
  {
    id: 'err-con-fail',
    code: 'Con_FAIL / E07',
    keypadType: 'no_star_hash',
    meterBrand: 'Conlog',
    title: 'Communication Failure (Keypad disconnected from pole)',
    description: 'The indoor Customer Interface Unit (CIU) cannot talk to the outdoor meter box on the pole.',
    action: '1. Plug the CIU into a direct wall socket on the same phase line (NEVER use extension boards or multi-plugs). 2. Make sure the main breaker switch on the pole is switched ON. 3. If wireless, bring the keypad closer to the outdoor box and re-pair with 000 + ↵.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'error'
  },
  {
    id: 'err-lockout',
    code: 'Loc / OUtP OFF',
    keypadType: 'no_star_hash',
    meterBrand: 'Universal',
    title: 'Overload Load Cut-Off Lockout',
    description: 'The meter internal breaker automatically tripped because household electrical draw exceeded 30A or 40A.',
    action: 'Immediately switch off heavy power appliances (ACs, electric boilers, hotplates, irons). Wait 60 seconds; the meter switch will reset and restore power automatically once current falls below the safe limit.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'error'
  },
  {
    id: 'err-tamper',
    code: 'tOPEN / t-CLr',
    keypadType: 'no_star_hash',
    meterBrand: 'Universal',
    title: 'Terminal Cover Open / Tamper Lockout',
    description: 'The protective cover on the meter base was loosened, moved, or opened, triggering the STS safety lockout.',
    action: 'Do not bypass wiring. Tamper lockouts require an authorized EDSA field technician reset token. Contact EDSA customer service (Call 112 or 076 892 222) with your meter serial number.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'error'
  },
  {
    id: 'err-low-voltage',
    code: 'E04 / Lo_VOLt',
    keypadType: 'no_star_hash',
    meterBrand: 'Universal',
    title: 'Severely Low Grid Voltage / Dead Phase',
    description: 'Grid voltage supplied by the EDSA substation transformer has dropped severely below safe operating thresholds.',
    action: 'Check neighboring houses. If their lights are very dim, the EDSA neighborhood transformer has a phase fault. Unplug refrigerators and air conditioners immediately to prevent motors from burning out.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'error'
  },

  // =========================================================================
  // 5. TOKEN REJECTION & STS FIXES
  // =========================================================================
  {
    id: 'token-reject-aaaaaa',
    code: 'AAAAAA / EEEEE / Err-02',
    keypadType: 'no_star_hash',
    meterBrand: 'Universal',
    title: 'Invalid Token / Token Rejected',
    description: 'The 20-digit electricity recharge token was entered incorrectly or does not match your meter.',
    action: '1. Check your SMS purchase receipt: verify that the meter number printed on the SMS matches your meter serial number exactly (tokens are cryptographically locked to one meter). 2. Press C to erase and re-type the 20 digits slowly, then press ↵. 3. Check if your meter needs KRN2 rollover tokens.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'token'
  },
  {
    id: 'token-already-used',
    code: 'OLd / Used / dUP',
    keypadType: 'no_star_hash',
    meterBrand: 'Universal',
    title: 'Token Already Used / Duplicate Entry',
    description: 'This 20-digit token has already been successfully accepted by the meter previously.',
    action: 'A 20-digit STS token can only be loaded once in history. Check your Token Vault in the app to view your remaining un-loaded tokens.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'token'
  },
  {
    id: 'token-krn-rollover',
    code: 'rEJEct (KRN Rollover)',
    keypadType: 'no_star_hash',
    meterBrand: 'Universal',
    title: 'KRN Rollover Token Required (STS Rollover)',
    description: 'Meter refuses new electricity tokens until two 20-digit Key Change Tokens (KCT) are entered in sequence.',
    action: '1. Contact EDSA with your meter number to obtain your free 2x 20-digit Key Change Tokens. 2. Enter Token 1 and press ↵. 3. Enter Token 2 and press ↵. 4. Enter your new electricity token and press ↵.',
    enterKeyEquivalent: '↵ (Enter / Blue button)',
    category: 'token'
  }
];
