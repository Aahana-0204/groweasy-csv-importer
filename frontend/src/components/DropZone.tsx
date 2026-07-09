'use client';

import clsx from 'clsx';
import { AlertCircle, FileText, Upload } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  error?: string;
}

export default function DropZone({ onFileAccepted, error }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'group cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300',
        isDragActive && !isDragReject
          ? 'scale-[1.02] border-green-500 bg-green-50 dark:bg-green-900/20'
          : isDragReject
            ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : error
              ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
              : 'border-gray-300 hover:border-green-500 hover:bg-green-50 dark:border-gray-600 dark:hover:bg-green-900/10'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {isDragReject || error ? (
          <AlertCircle size={48} className="text-red-400" />
        ) : (
          <div
            className={clsx(
              'flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300',
              isDragActive
                ? 'scale-110 bg-green-500 text-white'
                : 'bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600 dark:bg-gray-800'
            )}
          >
            <Upload size={32} />
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {isDragActive ? 'Drop your CSV here!' : 'Drag & drop your CSV file'}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            or <span className="font-medium text-green-600 dark:text-green-400">click to browse</span> - max 10MB
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs text-gray-400 dark:bg-gray-800">
          <FileText size={14} />
          Supports: Facebook Ads, Google Ads, Excel exports, Real Estate CRMs & more
        </div>
        {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}
      </div>
    </div>
  );
}
