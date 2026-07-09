'use client';

import { Brain, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProgressBarProps {
  isProcessing: boolean;
  progress: number;
  totalRows: number;
  processedRows: number;
}

const tips = [
  'Analyzing column structures with AI...',
  'Mapping fields to CRM format...',
  'Extracting lead information...',
  'Validating email and phone fields...',
  'Normalizing data formats...',
  'Processing in batches for accuracy...',
];

export default function ProgressBar({ isProcessing, progress, totalRows, processedRows }: ProgressBarProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!isProcessing) {
      return undefined;
    }

    const interval = setInterval(() => setTipIndex((index) => (index + 1) % tips.length), 2500);
    return () => clearInterval(interval);
  }, [isProcessing]);

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
          <Brain size={32} className="animate-pulse text-green-600 dark:text-green-400" />
        </div>
      </div>
      <h3 className="mb-1 text-xl font-bold">AI Processing Your CSV</h3>
      <p className="mb-6 text-sm text-gray-500 transition-all duration-500 dark:text-gray-400">{tips[tipIndex]}</p>

      <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${Math.max(progress, 5)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          Processing...
        </span>
        <span className="font-mono font-semibold text-green-600 dark:text-green-400">
          {processedRows} / {totalRows} rows
        </span>
      </div>
    </div>
  );
}
