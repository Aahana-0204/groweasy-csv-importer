import { CRMRecord, SkippedRecord } from '../types/crm';
import { extractWithAI } from './aiExtractor';

const BATCH_SIZE = 10;
const MAX_RETRIES = 3;

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
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const result = await extractWithAI(batch, headers);
      const offset = batchIndex * BATCH_SIZE;

      return {
        records: result.records,
        skipped: result.skipped.map((item) => ({
          ...item,
          row: offset + item.row,
        })),
      };
    } catch (error) {
      console.error(`Batch ${batchIndex} attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        return {
          records: [],
          skipped: batch.map((data, index) => ({
            row: batchIndex * BATCH_SIZE + index,
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
  const batches: Record<string, string>[][] = [];

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    batches.push(rows.slice(index, index + BATCH_SIZE));
  }

  let processed = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const result = await processBatchWithRetry(batches[batchIndex], headers, batchIndex);
    allRecords.push(...result.records);
    allSkipped.push(...result.skipped);
    processed += batches[batchIndex].length;
    onProgress?.(processed, rows.length);
  }

  return { records: allRecords, skipped: allSkipped };
}
