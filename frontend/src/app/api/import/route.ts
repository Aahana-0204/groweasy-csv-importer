import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

// ─── Types ────────────────────────────────────────────────────────────────────

interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

interface SkippedRecord {
  row: number;
  reason: string;
  data: Record<string, string>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ROWS = 500;
const BATCH_SIZE = 20;
const CONCURRENT = 4;
const MAX_RETRIES = 2;

const VALID_STATUSES = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
const VALID_SOURCES = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(buffer: Buffer): { headers: string[]; rows: Record<string, string>[] } {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  if (!records.length) return { headers: [], rows: [] };
  return { headers: Object.keys(records[0]), rows: records };
}

// ─── Rule-based fallback mapper ───────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().replace(/[\s_\-().]+/g, '');
}

function findVal(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const nk = norm(k);
    for (const [col, val] of Object.entries(row)) {
      if (norm(col).includes(nk) || nk.includes(norm(col))) {
        if (val && val.trim()) return val.trim();
      }
    }
  }
  return '';
}

function mapStatusRule(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes('sale') || r.includes('deal') || r.includes('closed') || r.includes('done') || r.includes('won')) return 'SALE_DONE';
  if (r.includes('bad') || r.includes('not interest') || r.includes('invalid') || r.includes('spam')) return 'BAD_LEAD';
  if (r.includes('not connect') || r.includes('not pick') || r.includes('no answer') || r.includes('busy') || r.includes('switch')) return 'DID_NOT_CONNECT';
  return 'GOOD_LEAD_FOLLOW_UP';
}

function mapSourceRule(raw: string): string {
  const r = raw.toLowerCase();
  for (const s of VALID_SOURCES) {
    if (r.includes(s.replace(/_/g, ' ')) || r.includes(s)) return s;
  }
  if (r.includes('demand') || r.includes('lead')) return 'leads_on_demand';
  return '';
}

function cleanPhone(raw: string): string {
  return raw.replace(/[\s\-\+\(\)]/g, '').replace(/^91(\d{10})$/, '$1').replace(/^\+91/, '');
}

function ruleBasedMap(row: Record<string, string>, rowIndex: number): CRMRecord | null {
  const email = findVal(row, 'email', 'email address', 'mail');
  const rawPhone = findVal(row, 'phone', 'mobile', 'cell', 'contact number', 'phone number', 'mobile number', 'telephone', 'tel');
  if (!email && !rawPhone) return null;

  const statusRaw = findVal(row, 'status', 'lead status', 'crm status', 'state');
  const sourceRaw = findVal(row, 'source', 'lead source', 'data source', 'datasource');
  const noteFields = [findVal(row, 'note', 'notes', 'remark', 'remarks', 'comment', 'comments')];

  return {
    created_at: findVal(row, 'date', 'created at', 'date submitted', 'timestamp', 'created', 'submission date') || new Date().toISOString(),
    name: findVal(row, 'name', 'full name', 'lead name', 'contact name', 'first name', 'client name'),
    email,
    country_code: findVal(row, 'country code', 'dial code', 'isd') || '+91',
    mobile_without_country_code: cleanPhone(rawPhone),
    company: findVal(row, 'company', 'organization', 'org', 'business', 'firm', 'employer'),
    city: findVal(row, 'city', 'location city', 'town'),
    state: findVal(row, 'state', 'province', 'region', 'state province'),
    country: findVal(row, 'country') || 'India',
    lead_owner: findVal(row, 'owner', 'assigned to', 'sales rep', 'agent', 'assigned', 'lead owner'),
    crm_status: statusRaw ? mapStatusRule(statusRaw) : 'GOOD_LEAD_FOLLOW_UP',
    crm_note: noteFields.filter(Boolean).join(' | '),
    data_source: sourceRaw ? mapSourceRule(sourceRaw) : '',
    possession_time: findVal(row, 'possession', 'possession time', 'handover'),
    description: findVal(row, 'description', 'additional', 'extra info', 'details'),
  };
}

// ─── AI Extractor ─────────────────────────────────────────────────────────────

const AI_PROMPT = `You are a CRM data extraction assistant for GrowEasy. Map CSV rows into GrowEasy CRM format regardless of column names.

CRM Fields: created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description

Rules:
- crm_status must be one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE
- data_source must be one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots (or empty string)
- mobile_without_country_code: digits only, no country code
- Skip rows with neither email nor mobile — put in skipped[]
- Multiple emails: first in email, rest in crm_note
- Multiple phones: first in mobile, rest in crm_note
- Return ONLY raw JSON, no markdown`;

async function aiExtractBatch(
  rows: Record<string, string>[],
  headers: string[],
  offset: number
): Promise<{ records: CRMRecord[]; skipped: SkippedRecord[] }> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `${AI_PROMPT}

Headers: ${JSON.stringify(headers)}
Rows: ${JSON.stringify(rows)}

Return: {"records":[...mapped CRM records...],"skipped":[{"row":<0-based>,"reason":"...","data":{}}]}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  const parsed = JSON.parse(text);
  return {
    records: (parsed.records || []).map((r: CRMRecord) => ({
      ...r,
      crm_status: VALID_STATUSES.includes(r.crm_status) ? r.crm_status : 'GOOD_LEAD_FOLLOW_UP',
      data_source: VALID_SOURCES.includes(r.data_source) ? r.data_source : '',
    })),
    skipped: (parsed.skipped || []).map((s: SkippedRecord) => ({ ...s, row: offset + s.row })),
  };
}

async function processBatch(
  batch: Record<string, string>[],
  headers: string[],
  batchIndex: number,
  useAI: boolean
): Promise<{ records: CRMRecord[]; skipped: SkippedRecord[] }> {
  const offset = batchIndex * BATCH_SIZE;

  if (useAI) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await aiExtractBatch(batch, headers, offset);
      } catch (err) {
        console.error(`AI batch ${batchIndex} attempt ${attempt}:`, err);
        if (attempt === MAX_RETRIES) break;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
    // AI failed — fall through to rule-based
    console.log(`Batch ${batchIndex}: AI failed, using rule-based fallback`);
  }

  // Rule-based mapping
  const records: CRMRecord[] = [];
  const skipped: SkippedRecord[] = [];
  batch.forEach((row, i) => {
    const mapped = ruleBasedMap(row, offset + i);
    if (mapped) {
      records.push(mapped);
    } else {
      skipped.push({ row: offset + i, reason: 'No email or mobile found', data: row });
    }
  });
  return { records, skipped };
}

async function processAll(
  rows: Record<string, string>[],
  headers: string[]
): Promise<{ records: CRMRecord[]; skipped: SkippedRecord[] }> {
  const useAI = !!process.env.GEMINI_API_KEY;
  const batches: Record<string, string>[][] = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) batches.push(rows.slice(i, i + BATCH_SIZE));

  const allRecords: CRMRecord[] = [];
  const allSkipped: SkippedRecord[] = [];

  for (let i = 0; i < batches.length; i += CONCURRENT) {
    const chunk = batches.slice(i, i + CONCURRENT);
    const results = await Promise.all(
      chunk.map((batch, j) => processBatch(batch, headers, i + j, useAI))
    );
    results.forEach(r => { allRecords.push(...r.records); allSkipped.push(...r.skipped); });
  }

  return { records: allRecords, skipped: allSkipped };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!file.name.toLowerCase().endsWith('.csv'))
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const { headers, rows } = parseCSV(buffer);
    if (!rows.length) return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });

    const truncated = rows.length > MAX_ROWS;
    const processRows = truncated ? rows.slice(0, MAX_ROWS) : rows;
    const { records, skipped } = await processAll(processRows, headers);

    return NextResponse.json({
      success: true,
      total_rows: rows.length,
      processed_rows: processRows.length,
      imported: records.length,
      skipped: skipped.length,
      truncated,
      records,
      skipped_records: skipped,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('Import error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
