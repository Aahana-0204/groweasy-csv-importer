'use client';

import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Download, XCircle } from 'lucide-react';
import { useState } from 'react';
import { CRMRecord, SkippedRecord } from '@/types/crm';

const CRM_FIELDS: (keyof CRMRecord)[] = [
  'name',
  'email',
  'mobile_without_country_code',
  'country_code',
  'company',
  'city',
  'state',
  'country',
  'crm_status',
  'data_source',
  'lead_owner',
  'crm_note',
  'created_at',
  'possession_time',
  'description',
];

const STATUS_COLORS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DID_NOT_CONNECT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  BAD_LEAD: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  SALE_DONE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

function downloadCSV(records: CRMRecord[]) {
  const headers = CRM_FIELDS.join(',');
  const rows = records.map((record) =>
    CRM_FIELDS.map((field) => {
      const value = String(record[field] || '').replace(/"/g, '""');
      return value.includes(',') || value.includes('"') || value.includes('\n') ? `"${value}"` : value;
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `groweasy_crm_export_${new Date().toISOString().split('T')[0]}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

interface ResultsTableProps {
  records: CRMRecord[];
  skippedRecords: SkippedRecord[];
  totalRows: number;
}

export default function ResultsTable({ records, skippedRecords, totalRows }: ResultsTableProps) {
  const [activeTab, setActiveTab] = useState<'imported' | 'skipped'>('imported');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Rows', value: totalRows, icon: 'Rows', color: 'text-gray-700 dark:text-gray-200' },
          { label: 'Imported', value: records.length, icon: 'OK', color: 'text-green-600' },
          { label: 'Skipped', value: skippedRecords.length, icon: 'Skip', color: 'text-yellow-600' },
          {
            label: 'Success Rate',
            value: `${totalRows > 0 ? Math.round((records.length / totalRows) * 100) : 0}%`,
            icon: 'Rate',
            color: 'text-blue-600',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-1 text-2xl">{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="mt-0.5 text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {records.length > 0 ? (
        <button
          onClick={() => downloadCSV(records)}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-green-500/20 transition-colors hover:bg-green-700"
          type="button"
        >
          <Download size={16} />
          Export {records.length} CRM Records as CSV
        </button>
      ) : null}

      <div className="w-fit rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('imported')}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
              activeTab === 'imported'
                ? 'bg-white text-green-600 shadow-sm dark:bg-gray-900'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            type="button"
          >
            <CheckCircle2 size={14} />
            Imported ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('skipped')}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
              activeTab === 'skipped'
                ? 'bg-white text-yellow-600 shadow-sm dark:bg-gray-900'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            type="button"
          >
            <XCircle size={14} />
            Skipped ({skippedRecords.length})
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="custom-scrollbar overflow-x-auto">
          <div className="custom-scrollbar overflow-y-auto" style={{ maxHeight: '500px' }}>
            {activeTab === 'imported' ? (
              <table className="w-full text-sm" style={{ minWidth: '1200px' }}>
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="w-8 border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700">
                      #
                    </th>
                    {CRM_FIELDS.map((field) => (
                      <th
                        key={field}
                        className="whitespace-nowrap border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700"
                      >
                        {field.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr
                      key={`${record.email}-${record.mobile_without_country_code}-${index}`}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{index + 1}</td>
                      {CRM_FIELDS.map((field) => (
                        <td key={field} className="max-w-xs px-3 py-2.5 text-gray-700 dark:text-gray-300">
                          {field === 'crm_status' && record[field] ? (
                            <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[record[field]] || '')}>
                              {record[field].replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="block max-w-[160px] truncate" title={record[field]}>
                              {record[field] || <span className="text-gray-300 dark:text-gray-600">-</span>}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={CRM_FIELDS.length + 1} className="py-12 text-center text-gray-400">
                        No records imported
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm" style={{ minWidth: '600px' }}>
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700">
                      Row
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700">
                      Reason Skipped
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700">
                      Data Preview
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {skippedRecords.map((skippedRecord, index) => (
                    <tr key={`${skippedRecord.row}-${index}`} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 font-mono text-sm text-gray-500">{skippedRecord.row + 1}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-sm text-yellow-600">
                          <AlertTriangle size={13} />
                          {skippedRecord.reason}
                        </span>
                      </td>
                      <td
                        className="max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-500"
                        title={JSON.stringify(skippedRecord.data)}
                      >
                        {JSON.stringify(skippedRecord.data).slice(0, 80)}...
                      </td>
                    </tr>
                  ))}
                  {skippedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-gray-400">
                        No records were skipped
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
