import { Request, Response, Router } from 'express';
import multer from 'multer';
import { processAllBatches } from '../services/batchProcessor';
import { parseCSV } from '../services/csvParser';
import { ImportResult } from '../types/crm';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
      return;
    }

    cb(new Error('Only CSV files are allowed'));
  },
});

router.post('/import', (req: Request, res: Response) => {
  upload.single('file')(req, res, async (error) => {
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const { headers, rows } = parseCSV(req.file.buffer);

      if (rows.length === 0) {
        res.status(400).json({ error: 'CSV file is empty or has no valid rows' });
        return;
      }

      const { records, skipped } = await processAllBatches(rows, headers);

      const result: ImportResult = {
        success: true,
        total_rows: rows.length,
        imported: records.length,
        skipped: skipped.length,
        records,
        skipped_records: skipped,
      };

      res.json(result);
    } catch (err) {
      console.error('Import error:', err);
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  });
});

export default router;
