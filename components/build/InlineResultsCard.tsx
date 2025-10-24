'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Table, Download, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PreviewResult } from './ResultsPreviewPanel';
import { QualitySummary } from './QualitySummaryPanel';

interface InlineResultsCardProps {
  results: PreviewResult;
  quality?: QualitySummary | null;
  isLoading?: boolean;
  onExpand?: () => void;
  className?: string;
}

export function InlineResultsCard({
  results,
  quality,
  isLoading = false,
  className
}: InlineResultsCardProps) {
  const [expanded, setExpanded] = useState(false);

  const displayColumns = expanded ? results.columns : results.columns.slice(0, 6);
  const displayRows = expanded ? results.rows.slice(0, 100) : results.rows.slice(0, 5);

  return (
    <div className={cn(
      "mt-3 rounded-lg border border-border bg-white dark:bg-gray-950 shadow-md overflow-hidden",
      className
    )}>
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-elevation-1">
        <div className="flex items-center gap-3">
          <Table className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">
            {results.rowCount.toLocaleString()} rows
          </span>
          <span className="text-xs text-muted-foreground">
            •
          </span>
          <span className="text-xs text-muted-foreground">
            {results.executionTimeMs}ms
          </span>
          {quality && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  quality.overallScore >= 90 ? "bg-green-500/10 text-green-700 dark:text-green-400" :
                  quality.overallScore >= 70 ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" :
                  "bg-red-500/10 text-red-700 dark:text-red-400"
                )}
              >
                {quality.overallScore}% Quality
              </Badge>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
            <Download className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
            <Maximize2 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="gap-1.5 h-7 px-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span className="text-xs">Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span className="text-xs">Expand</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Compact Table Preview */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-elevation-1 z-10">
            <tr className="border-b border-border">
              {displayColumns.map((col, i) => (
                <th
                  key={i}
                  className="text-left p-2 font-medium text-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
              {!expanded && results.columns.length > 6 && (
                <th className="text-left p-2 text-muted-foreground">
                  +{results.columns.length - 6} more
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                {displayColumns.map((_, j) => (
                  <td
                    key={j}
                    className="p-2 text-muted-foreground max-w-[200px] truncate"
                    title={String(row[j])}
                  >
                    {row[j] === null ? (
                      <span className="italic text-muted-foreground/50">null</span>
                    ) : (
                      String(row[j])
                    )}
                  </td>
                ))}
                {!expanded && results.columns.length > 6 && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      {expanded && (
        <div className="px-4 py-2 border-t border-border bg-elevation-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Showing {displayRows.length} of {results.rowCount.toLocaleString()} rows
              </span>
              <span className="text-muted-foreground">
                {results.columns.length} columns
              </span>
              {results.bytesProcessed && (
                <span className="text-muted-foreground">
                  {(results.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-700 dark:text-green-400">Query successful</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed State Footer */}
      {!expanded && (
        <div className="px-4 py-2 border-t border-border bg-elevation-0 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing 5 of {results.rowCount.toLocaleString()} rows
          </span>
          <Button
            size="sm"
            variant="link"
            onClick={() => setExpanded(true)}
            className="text-xs h-auto p-0"
          >
            Show all data →
          </Button>
        </div>
      )}
    </div>
  );
}
