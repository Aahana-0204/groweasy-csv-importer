import { GoogleGenerativeAI } from '@google/generative-ai';
import { CRMRecord, CRMStatus, DataSource, SkippedRecord } from '../types/crm';

const CRM_STATUS_VALUES: CRMStatus[] = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
  '',
];

const DATA_SOURCE_VALUES: DataSource[] = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
  '',
];

const SYSTEM_PROMPT = `You are a CRM data extraction assistant for GrowEasy.
Your task is to map CSV rows with arbitrary column names into GrowEasy CRM format.

CRM Fields:
- created_at: Lead creation date (must be JS new Date() compatible, e.g., "2026-05-13 14:20:48" or ISO string)
- name: Full name of the lead
- email: Primary email address
- country_code: Country dialing code (e.g., "+91", "+1")
- mobile_without_country_code: Mobile number without country code (digits only, no spaces/dashes)
- company: Company name
- city: City
- state: State/Province
- country: Country name
- lead_owner: Person responsible for the lead (usually an email)
- crm_status: ONLY one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE (map similar values; if none match, use GOOD_LEAD_FOLLOW_UP)
- crm_note: Combine remarks, follow-up notes, extra emails, extra phone numbers, any additional info
- data_source: ONLY one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots (or empty string if none match)
- possession_time: Property possession time if present
- description: Additional description

Rules:
1. If a record has neither email nor mobile, mark it as SKIP with reason.
2. For multiple emails: use first as email, append rest to crm_note.
3. For multiple mobiles: use first as mobile, append rest to crm_note.
4. mobile_without_country_code: digits only, no spaces, dashes, or brackets.
5. Keep crm_note as plain text, no line breaks (use \\n if needed).
6. Map column names intelligently (e.g., "Phone Number", "Contact", "Cell" -> mobile; "Full Name", "Contact Name" -> name).
7. Return a valid JSON object only - no markdown, no explanation.
8. Preserve source meaning; do not invent business facts beyond normalization defaults.`;

interface AIResult {
  records?: unknown;
  skipped?: unknown;
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

function safeParseAIResponse(text: string): AIResult {
  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned) as AIResult;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as AIResult;
    }
    throw new Error(`Unable to parse AI response as JSON: ${cleaned.slice(0, 300)}`);
  }
}

function ensureString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function normalizeStatus(value: unknown): CRMStatus {
  const normalized = ensureString(value).toUpperCase();
  if (CRM_STATUS_VALUES.includes(normalized as CRMStatus)) {
    return normalized as CRMStatus;
  }

  if (!normalized) {
    return '';
  }
  if (normalized.includes('SALE')) {
    return 'SALE_DONE';
  }
  if (normalized.includes('BAD')) {
    return 'BAD_LEAD';
  }
  if (normalized.includes('CONNECT')) {
    return 'DID_NOT_CONNECT';
  }
  return 'GOOD_LEAD_FOLLOW_UP';
}

function normalizeDataSource(value: unknown): DataSource {
  const normalized = ensureString(value).toLowerCase().replace(/[\s-]+/g, '_');
  if (DATA_SOURCE_VALUES.includes(normalized as DataSource)) {
    return normalized as DataSource;
  }
  return '';
}

function normalizeDate(value: unknown): string {
  const raw = ensureString(value);
  if (!raw) {
    return new Date().toISOString();
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

function normalizeEmail(value: unknown): string {
  const raw = ensureString(value);
  if (!raw) {
    return '';
  }

  const parts = raw
    .split(/[;,/|\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.find((item) => item.includes('@')) ?? raw;
}

function normalizeMobile(value: unknown): { country_code: string; mobile_without_country_code: string } {
  const raw = ensureString(value);
  if (!raw) {
    return { country_code: '', mobile_without_country_code: '' };
  }

  const plusMatch = raw.match(/\+\d{1,4}/);
  const countryCode = plusMatch?.[0] ?? '';
  let digits = raw.replace(/\D/g, '');

  if (countryCode) {
    const codeDigits = countryCode.replace(/\D/g, '');
    if (digits.startsWith(codeDigits)) {
      digits = digits.slice(codeDigits.length);
    }
  }

  return {
    country_code: countryCode,
    mobile_without_country_code: digits,
  };
}

function normalizeNote(value: unknown): string {
  return ensureString(value).replace(/\r?\n/g, ' \\n ').replace(/\s+/g, ' ').trim();
}

function normalizeRecord(record: unknown): CRMRecord {
  const source = (record ?? {}) as Record<string, unknown>;
  const mobile = normalizeMobile(source.mobile_without_country_code ?? source.mobile ?? '');
  const explicitCountryCode = ensureString(source.country_code);

  return {
    created_at: normalizeDate(source.created_at),
    name: ensureString(source.name),
    email: normalizeEmail(source.email),
    country_code: explicitCountryCode || mobile.country_code,
    mobile_without_country_code: mobile.mobile_without_country_code,
    company: ensureString(source.company),
    city: ensureString(source.city),
    state: ensureString(source.state),
    country: ensureString(source.country),
    lead_owner: ensureString(source.lead_owner),
    crm_status: normalizeStatus(source.crm_status),
    crm_note: normalizeNote(source.crm_note),
    data_source: normalizeDataSource(source.data_source),
    possession_time: ensureString(source.possession_time),
    description: ensureString(source.description),
  };
}

function normalizeSkipped(skipped: unknown): SkippedRecord[] {
  if (!Array.isArray(skipped)) {
    return [];
  }

  return skipped.map((item, index) => {
    const value = (item ?? {}) as Record<string, unknown>;
    const data = value.data;
    const normalizedData: Record<string, string> = {};

    if (data && typeof data === 'object') {
      for (const [key, raw] of Object.entries(data as Record<string, unknown>)) {
        normalizedData[key] = ensureString(raw);
      }
    }

    return {
      row: typeof value.row === 'number' ? value.row : index,
      reason: ensureString(value.reason) || 'Skipped by AI',
      data: normalizedData,
    };
  });
}

export async function extractWithAI(
  rows: Record<string, string>[],
  headers: string[]
): Promise<{ records: CRMRecord[]; skipped: SkippedRecord[] }> {
  const model = getModel();

  const prompt = `${SYSTEM_PROMPT}

CSV Headers: ${JSON.stringify(headers)}

Rows to process (JSON array, each element is one CSV row):
${JSON.stringify(rows, null, 2)}

Return a JSON object with this exact structure:
{
  "records": [ ...successfully mapped CRM records... ],
  "skipped": [ { "row": <0-based index>, "reason": "<why skipped>", "data": <original row object> } ]
}

Only include in "records" rows that have at least email OR mobile. Skip rows with neither.
Return ONLY the raw JSON object. No markdown code blocks. No explanation.`;

  const result = await model.generateContent(prompt);
  const parsed = safeParseAIResponse(result.response.text());

  const records = Array.isArray(parsed.records) ? parsed.records.map(normalizeRecord) : [];
  const skipped = normalizeSkipped(parsed.skipped);

  const validRecords: CRMRecord[] = [];
  const derivedSkipped: SkippedRecord[] = [];

  records.forEach((record, index) => {
    if (!record.email && !record.mobile_without_country_code) {
      derivedSkipped.push({
        row: index,
        reason: 'Missing both email and mobile after normalization',
        data: rows[index] ?? {},
      });
      return;
    }

    validRecords.push(record);
  });

  return {
    records: validRecords,
    skipped: [...skipped, ...derivedSkipped],
  };
}
