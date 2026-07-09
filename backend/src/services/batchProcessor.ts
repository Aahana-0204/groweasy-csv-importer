import { CRMRecord, SkippedRecord } from '../types/crm';
import { extractWithAI } from './aiExtractor';

const BATCH_SIZE = 25;       // rows per AI call
const CONCURRENT = 5;        // parallel AI calls at once
const MAX_RETRIES = 3;
export const MAX_ROWS = 500; // cap to keep response times reasonable

export interface BatchResult {
  records: CRMRecord[];
  skipped: SkippedRecord[];
}

async function processBatchWithRetry(
  batch: Record<string, string>[],
  headers: string[],
  batchIndex: number,
  retries = MAX_RETRIES
): Promise<BatchResult> {
  const offset = batchIndex * BATCH_SIZE;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const result = await extractWithAI(batch, headers);
      return {
        records: result.records,
        skipped: result.skipped.map((item) => ({ ...item, row: offset + item.row })),
      };
    } catch (error) {
      console.error(`Batch ${batchIndex} attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        return {
          records: [],
          skipped: batch.map((data, index) => ({
            row: offset + index,
            reason: `AI processing failed after ${retries} retries`,
            data,
          })),
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return { records: [], skipped: [] };
}

export async function processAllBatches(
  rows: Record<string, string>[],
  headers: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<BatchResult> {
  const allRecords: CRMRecord[] = [];
  const allSkipped: SkippedRecord[] = [];

  // Split into batches
  const batches: Record<string, string>[][] = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }

  let processed = 0;

  // Process CONCURRENT batches at a time (parallel)
  for (let i = 0; i < batches.length; i += CONCURRENT) {
    const chunk = batches.slice(i, i + CONCURRENT);
    const results = await Promise.all(
      chunk.map((batch, j) => processBatchWithRetry(batch, headers, i + j))
    );

    for (let j = 0; j < results.length; j++) {
      allRecords.push(...results[j].records);
      allSkipped.push(...results[j].skipped);
      processed += chunk[j].length;
      onProgress?.(processed, rows.length);
    }
  }

  return { records: allRecords, skipped: allSkipped };
}
