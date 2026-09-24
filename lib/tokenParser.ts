export interface ParsedSmsToken {
  token: string | null;          // 20 clean digits
  formattedToken: string | null; // XXXX - XXXX - XXXX - XXXX - XXXX
  amount: number | null;         // Amount in NLe
  units: number | null;          // Units in kWh
  meterNumber: string | null;    // 11-digit meter number
  rawText: string;
  hasTokenKeyword: boolean;
}

/**
 * Extracts 20-digit EDSA prepaid token and metadata from SMS text or clipboard content.
 * Handles Orange Money, Afrimoney, direct EDSA SMS, and third-party vendor formats.
 */
export function parseTokenSms(rawText: string): ParsedSmsToken {
  if (!rawText || typeof rawText !== 'string') {
    return {
      token: null,
      formattedToken: null,
      amount: null,
      units: null,
      meterNumber: null,
      rawText: '',
      hasTokenKeyword: false,
    };
  }

  const cleanText = rawText.trim();
  const lower = cleanText.toLowerCase();
  const hasTokenKeyword = lower.includes('token') || lower.includes('edsa') || lower.includes('meter');

  // 1. Extract 20-digit token
  let token: string | null = null;

  // Pattern 1: Token near keyword "token" or "code"
  const keywordPattern = /(?:token|code|keypad|sts)[\s:=#.-]*([0-9\s-]{20,28})/i;
  const keywordMatch = cleanText.match(keywordPattern);
  if (keywordMatch) {
    const candidate = keywordMatch[1].replace(/\D/g, '');
    if (candidate.length >= 20) {
      token = candidate.slice(0, 20);
    }
  }

  // Pattern 2: Any sequence of 4-digit blocks (e.g. 1234 5678 9012 3456 7890 or with dashes)
  if (!token) {
    const chunkPattern = /\b(\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4})\b/;
    const chunkMatch = cleanText.match(chunkPattern);
    if (chunkMatch) {
      token = chunkMatch[1].replace(/\D/g, '');
    }
  }

  // Pattern 3: Any continuous 20 digits
  if (!token) {
    const continuousPattern = /\b(\d{20})\b/;
    const contMatch = cleanText.match(continuousPattern);
    if (contMatch) {
      token = contMatch[1];
    }
  }

  // Pattern 4: Fallback scan - collect all digit runs and check for 20 digits total
  if (!token) {
    const allDigits = cleanText.replace(/\D/g, '');
    // If text specifically mentions 'token', we can search for a 20-digit chunk in allDigits
    if (hasTokenKeyword && allDigits.length >= 20) {
      // Avoid phone numbers or prefixes if possible
      token = allDigits.slice(0, 20);
    }
  }

  // Format token into 5 blocks of 4 digits
  let formattedToken: string | null = null;
  if (token && token.length === 20) {
    const parts = [];
    for (let i = 0; i < 20; i += 4) {
      parts.push(token.substring(i, i + 4));
    }
    formattedToken = parts.join(' - ');
  } else {
    token = null; // Invalidate if not strictly 20 digits
  }

  // 2. Extract Meter Number (strictly 11 digits, not overlapping with token)
  let meterNumber: string | null = null;
  const meterKeywordPattern = /(?:meter|mno|acc|account)[\s:=#.-]*([0-9]{11})\b/i;
  const meterMatch = cleanText.match(meterKeywordPattern);
  if (meterMatch && meterMatch[1] !== token?.slice(0, 11)) {
    meterNumber = meterMatch[1];
  } else {
    // Search for any 11 digit standalone sequence that is not the token
    const standalone11 = cleanText.match(/\b([0-9]{11})\b/g);
    if (standalone11) {
      for (const m of standalone11) {
        if (!token || !token.includes(m)) {
          meterNumber = m;
          break;
        }
      }
    }
  }

  // 3. Extract Amount in NLe
  let amount: number | null = null;
  // Match "NLe 50" or "Amount: 50" or "Le 50.00"
  const amountPattern = /(?:nle|le|amount|amt|cost|paid|value)[\s:=#.-]*([0-9]+(?:\.[0-9]+)?)/i;
  const amountMatch = cleanText.match(amountPattern);
  if (amountMatch) {
    const parsed = parseFloat(amountMatch[1]);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 50000) {
      amount = parsed;
    }
  } else {
    // Reverse pattern: "50 NLe"
    const revAmount = cleanText.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:nle|leones|sll)\b/i);
    if (revAmount) {
      const parsed = parseFloat(revAmount[1]);
      if (!isNaN(parsed)) amount = parsed;
    }
  }

  // 4. Extract kWh Units
  let units: number | null = null;
  // Match "10.3 kWh" or "Units: 10.3"
  const unitsPattern = /(?:units?|kwh|energy)[\s:=#.-]*([0-9]+(?:\.[0-9]+)?)/i;
  const unitsMatch = cleanText.match(unitsPattern);
  if (unitsMatch) {
    const parsed = parseFloat(unitsMatch[1]);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 5000) {
      units = parsed;
    }
  } else {
    // Reverse pattern: "10.3 kWh"
    const revUnits = cleanText.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:kwh|units?)\b/i);
    if (revUnits) {
      const parsed = parseFloat(revUnits[1]);
      if (!isNaN(parsed)) units = parsed;
    }
  }

  return {
    token,
    formattedToken,
    amount,
    units,
    meterNumber,
    rawText: cleanText,
    hasTokenKeyword,
  };
}
