'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface CSVPreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

export default function CSVPreviewTable({ headers, rows }: CSVPreviewTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="custom-scrollbar overflow-x-auto">
        <div ref={parentRef} className="custom-scrollbar overflow-y-auto" style={{ maxHeight: '400px' }}>
          <table className="w-full text-sm" style={{ minWidth: `${Math.max(headers.length * 160, 600)}px` }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="w-12 border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700">
                  #
                </th>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    key={virtualRow.index}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <td className="w-12 px-4 py-2.5 font-mono text-xs text-gray-400">{virtualRow.index + 1}</td>
                    {headers.map((header) => (
                      <td key={header} className="max-w-xs px-4 py-2.5 text-gray-700 dark:text-gray-300">
                        <span title={row[header]}>{row[header] || '—'}</span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
