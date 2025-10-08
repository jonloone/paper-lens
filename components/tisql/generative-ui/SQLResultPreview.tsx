'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface SQLResultPreviewProps {
  sql: string;
  rowCount: number;
  executionTime: number;
  previewData?: any[];
  success: boolean;
  error?: string;
  onInsertToEditor?: () => void;
  onRunFullQuery?: () => void;
}

/**
 * SQLResultPreview - Generative UI component for displaying query results
 *
 * Rendered by the AI agent when executing queries to show results inline
 * in the chat conversation with interactive actions.
 */
export function SQLResultPreview({
  sql,
  rowCount,
  executionTime,
  previewData = [],
  success,
  error,
  onInsertToEditor,
  onRunFullQuery,
}: SQLResultPreviewProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          {success ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          <div>
            <h4 className="font-semibold text-sm">
              {success ? 'Query Executed Successfully' : 'Query Failed'}
            </h4>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                {rowCount.toLocaleString()} rows
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {executionTime}ms
              </span>
            </div>
          </div>
        </div>

        {success && (
          <div className="flex gap-2">
            {onInsertToEditor && (
              <Button onClick={onInsertToEditor} variant="outline" size="sm">
                Insert to Editor
              </Button>
            )}
            {onRunFullQuery && (
              <Button onClick={onRunFullQuery} size="sm">
                Run Full Query
              </Button>
            )}
          </div>
        )}
      </div>

      {/* SQL Query */}
      <div className="px-4 py-3 border-b bg-muted/10">
        <pre className="text-xs font-mono overflow-x-auto">
          <code>{sql}</code>
        </pre>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 border-b bg-red-500/10 text-red-500 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Preview Data Table */}
      {success && previewData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                {Object.keys(previewData[0]).map((column) => (
                  <th
                    key={column}
                    className="px-4 py-2 text-left font-semibold text-xs uppercase tracking-wider"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {previewData.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/20">
                  {Object.values(row).map((value: any, colIdx) => (
                    <td key={colIdx} className="px-4 py-2 text-xs font-mono">
                      {value === null ? (
                        <span className="text-muted-foreground italic">null</span>
                      ) : typeof value === 'object' ? (
                        JSON.stringify(value)
                      ) : (
                        String(value)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-muted/10 text-xs text-muted-foreground text-center">
        {success
          ? `Showing ${previewData.length} of ${rowCount} rows`
          : 'Query execution failed'}
      </div>
    </div>
  );
}
