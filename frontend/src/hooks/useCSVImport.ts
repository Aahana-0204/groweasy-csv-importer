'use client';

import axios from 'axios';
import Papa from 'papaparse';
import { useCallback, useState } from 'react';
import { ImportResult, Step } from '@/types/crm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useCSVImport() {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileAccepted = useCallback((acceptedFile: File) => {
    setUploadError(null);
    setError(null);
    setResult(null);
    setFile(acceptedFile);

    Papa.parse<Record<string, string>>(acceptedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setUploadError('CSV file is empty or has no valid rows');
          return;
        }

        setHeaders(results.meta.fields || []);
        setRows(results.data);
        setStep(2);
      },
      error: (parseError) => {
        setUploadError(`Failed to parse CSV: ${parseError.message}`);
      },
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessedRows(0);
    setError(null);
    setStep(3);

    const totalRows = rows.length;
    let fakeProgress = 0;
    const progressInterval = window.setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 8, 85);
      setProgress(fakeProgress);
      setProcessedRows(Math.floor((fakeProgress / 100) * totalRows));
    }, 800);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<ImportResult>(`${API_URL}/api/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      window.clearInterval(progressInterval);
      setProgress(100);
      setProcessedRows(totalRows);
      setResult(response.data);
      setStep(4);
    } catch (requestError) {
      window.clearInterval(progressInterval);
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.error || requestError.message || 'Import failed. Please try again.');
      } else {
        setError('Import failed. Please try again.');
      }
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  }, [file, rows]);

  const handleReset = useCallback(() => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setRows([]);
    setIsProcessing(false);
    setProgress(0);
    setProcessedRows(0);
    setResult(null);
    setError(null);
    setUploadError(null);
  }, []);

  return {
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
  };
}
