import { parse } from 'csv-parse/sync';

export function parseCSV(buffer: Buffer): { headers: string[]; rows: Record<string, string>[] } {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[];

  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(records[0]);
  return { headers, rows: records };
}
