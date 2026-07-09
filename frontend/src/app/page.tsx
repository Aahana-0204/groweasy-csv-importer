'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, FileText, RefreshCw, Sparkles, Wifi, WifiOff, Loader } from 'lucide-react';
import CSVPreviewTable from '@/components/CSVPreviewTable';
import DropZone from '@/components/DropZone';
import ProgressBar from '@/components/ProgressBar';
import ResultsTable from '@/components/ResultsTable';
import StepIndicator from '@/components/StepIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import { useCSVImport } from '@/hooks/useCSVImport';

const API_URL = '';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(10000) });
        setBackendStatus(res.ok ? 'online' : 'offline');
      } catch {
        setBackendStatus('offline');
      }
    };
    ping();
    const interval = setInterval(ping, 9 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const {
    step,
    file,
    headers,
    rows,
    isProcessing,
    progress,
    processedRows,
    result,
    error,
    uploadError,
    handleFileAccepted,
    handleConfirm,
    handleReset,
  } = useCSVImport();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-green-950/20">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">GrowEasy</span>
              <span className="ml-2 text-sm text-gray-400">CSV Importer</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Backend status indicator */}
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              backendStatus === 'online'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : backendStatus === 'offline'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
            }`}>
              {backendStatus === 'online'
                ? <><Wifi size={12} /> API Ready</>
                : backendStatus === 'offline'
                ? <><WifiOff size={12} /> API Offline</>
                : <><Loader size={12} className="animate-spin" /> Warming up...</>
              }
            </div>
            {step > 1 ? (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                type="button"
              >
                <RefreshCw size={14} />
                Start Over
              </button>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        {step === 1 ? (
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <Sparkles size={14} />
              AI-Powered Field Mapping
            </div>
            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              Import Any CSV into
              <br />
              <span className="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">
                GrowEasy CRM
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-500 dark:text-gray-400">
              Upload CSVs from Facebook Ads, Google Ads, Excel, Real Estate CRMs, or any format. AI automatically
              maps fields to GrowEasy CRM format.
            </p>
          </div>
        ) : null}

        <StepIndicator currentStep={step} />

        {error ? (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            Warning: {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mx-auto max-w-2xl">
            <DropZone onFileAccepted={handleFileAccepted} error={uploadError || undefined} />
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {['Facebook Lead Ads', 'Google Ads Export', 'Real Estate CRM', 'Excel Spreadsheet', 'Sales Report', 'Marketing CSV'].map((format) => (
                <div
                  key={format}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900"
                >
                  <FileText size={14} className="flex-shrink-0 text-green-500" />
                  {format}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 && file ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">CSV Preview</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                  {' | '}
                  {rows.length} rows | {headers.length} columns
                </p>
              </div>
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-2.5 font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:scale-105 hover:from-green-600 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                type="button"
              >
                <Sparkles size={16} />
                Import with AI
                <ChevronRight size={16} />
              </button>
            </div>
            {rows.length > 500 ? (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                âš ï¸ Your CSV has <strong>{rows.length} rows</strong>. Only the first <strong>500 rows</strong> will be processed by AI to ensure a fast, reliable response.
              </div>
            ) : null}
            <CSVPreviewTable headers={headers} rows={rows} />
            <p className="text-center text-xs text-gray-400">
              Showing all {rows.length} rows | AI will map {headers.length} columns to CRM fields
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mx-auto max-w-xl">
            <ProgressBar
              isProcessing={isProcessing}
              progress={progress}
              totalRows={rows.length}
              processedRows={processedRows}
            />
          </div>
        ) : null}

        {step === 4 && result ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <span className="text-green-500">âœ“</span> Import Complete
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">AI successfully processed and mapped your CSV data</p>
              </div>
            </div>
            {result.truncated ? (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                â„¹ï¸ Your file had <strong>{result.total_rows} rows</strong>. The first <strong>{result.processed_rows} rows</strong> were processed.
              </div>
            ) : null}
            <ResultsTable
              records={result.records}
              skippedRecords={result.skipped_records}
              totalRows={result.processed_rows}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}

