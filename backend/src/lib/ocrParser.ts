export type OcrExtractResult = {
  trxId: string | null;
  account: string | null;
  amount: number | null;
  confidence: number; // 0-100, based on how many fields extracted
  rawText: string;
};

/**
 * Common patterns for BD payment receipts (bKash, Nagad, Rocket).
 * All extracted data is English/Latin — Bengali text is ignored.
 */

// TrxID: typically 8-15 uppercase alphanumeric chars, often prefixed by
// "TrxID:", "Trx ID", "Transaction ID", "TX ID", "Transaction No", etc.
// \b after the keyword prevents "no" matching inside "Number", etc.
// The trailing lookahead prevents truncating a longer alphanumeric token.
const TRX_PATTERNS = [
  /(?:trx\s*id|[ti1]ransaction\s*(?:id|no)|tx\s*id|[ti1]rans\s*id)\b[^\nA-Z0-9]{0,20}([A-Z0-9]{8,15})(?![A-Z0-9])/i,
  /(?:id\s*no|ref\s*no)\b[^\nA-Z0-9]{0,20}([A-Z0-9]{8,15})(?![A-Z0-9])/i,
];

// Amount: ৳500, ৳ 500.00, BDT 500, Tk 500, Amount: 500
// NOTE: separator is [^\d\n] (not [^\d]) so a value on the next line
// can never be picked up. \b keeps "tk"/"bdt"/"taka" from matching inside words.
const AMOUNT_PATTERNS = [
  /(?:৳|\b(?:bdt|tk|taka|amount)\b)[^\d\n]{0,10}([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)\s*(?:৳|\b(?:bdt|tk|taka)\b)/i,
];

// BD phone: 01712345678, +8801712345678, 8801712345678
// - capture group added
// - lookarounds stop it matching inside a longer digit run
const PHONE_PATTERN =
  /(?<!\d)(?:\+?88)?([0@OoQD]1[3-9][-\s]?\d{2}[-\s]?\d{6})(?!\d)/;

function normalizeNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "");
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100; // keep paisa, don't round to integer
}

function normalizePhone(raw: string): string | null {
  const digits = raw
    .replace(/[OoQD@]/g, "0") // OCR confusions for 0
    .replace(/\D/g, ""); // strip +, spaces, dashes

  const local =
    digits.length === 13 && digits.startsWith("88") ? digits.slice(2) : digits;

  // Must be a valid 11-digit local BD number starting with 01
  if (local.length !== 11 || !local.startsWith("01")) return null;
  return local;
}

export function parseOcrText(rawText: string): OcrExtractResult {
  const text = (rawText ?? "").trim();

  // TrxID — try each pattern
  let trxId: string | null = null;
  for (const pattern of TRX_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      trxId = match[1].toUpperCase();
      break;
    }
  }

  // Amount — try each pattern, pick first valid match
  let amount: number | null = null;
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = normalizeNumber(match[1]);
      if (parsed !== null) {
        amount = parsed;
        break;
      }
    }
  }

  // Phone / account
  const phoneMatch = text.match(PHONE_PATTERN);
  const account = phoneMatch?.[1] ? normalizePhone(phoneMatch[1]) : null;

  // Confidence: 0-100, avg of extracted fields
  const extracted = [trxId, account, amount].filter((v) => v !== null).length;
  const confidence = Math.round((extracted / 3) * 100);

  return { trxId, account, amount, confidence, rawText: text };
}
