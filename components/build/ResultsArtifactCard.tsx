'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Table,
  Download,
  Maximize2,
  Code2,
  Copy,
  Check,
  Play,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PreviewResult } from './ResultsPreviewPanel';
import { QualitySummary } from './QualitySummaryPanel';

interface ResultsArtifactCardProps {
  results: PreviewResult;
  sql?: string;
  quality?: QualitySummary | null;
  personaConfig?: {
    sqlVisibility: 'expanded' | 'collapsed' | 'hidden';
    resultsFirst: boolean;
  };
  onExecute?: () => void;
  onViewQuality?: () => void;
  onEditSQL?: () => void;
  className?: string;
}

export function ResultsArtifactCard({
  results,
  sql,
  quality,
  personaConfig = {
    sqlVisibility: 'collapsed',
    resultsFirst: true
  },
  onExecute,
  onViewQuality,
  onEditSQL,
  className
}: ResultsArtifactCardProps) {
  const [showSQL, setShowSQL] = useState(personaConfig.sqlVisibility === 'expanded');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (sql) {
      navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayColumns = results.columns.slice(0, 6);
  const displayRows = results.rows.slice(0, 5);

  return (
    <div className={cn(
      "rounded-2xl bg-white dark:bg-gray-950 border border-border overflow-hidden",
      "shadow-lg hover:shadow-xl transition-shadow duration-200",
      className
    )}>
      {/* Results Preview Section (Always Visible) */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
              <Table className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Query Results
                <Sparkles className="w-3 h-3 text-primary" />
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {results.rowCount.toLocaleString()} rows
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {results.executionTimeMs}ms
                </span>
                {quality && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <button
                      onClick={onViewQuality}
                      disabled={!onViewQuality}
                      className={cn(
                        "transition-all",
                        onViewQuality && "hover:scale-105 cursor-pointer"
                      )}
                    >
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          quality.overallScore >= 90 ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" :
                          quality.overallScore >= 70 ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" :
                          "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                        )}
                      >
                        {quality.overallScore}% Quality {onViewQuality && "→"}
                      </Badge>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
              <Download className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Compact Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-elevation-1">
              <tr className="border-b border-border">
                {displayColumns.map((col, i) => (
                  <th
                    key={i}
                    className="text-left p-2 font-medium text-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
                {results.columns.length > 6 && (
                  <th className="text-left p-2 text-muted-foreground text-xs">
                    +{results.columns.length - 6} more
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-950">
              {displayRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
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
                  {results.columns.length > 6 && <td />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Showing 5 of {results.rowCount.toLocaleString()} rows • {results.columns.length} columns
          </span>
          <Button variant="link" size="sm" className="text-xs h-auto p-0">
            Show all data →
          </Button>
        </div>
      </div>

      {/* SQL Toggle Section */}
      {personaConfig.sqlVisibility !== 'hidden' && sql && (
        <>
          <div className="border-t border-border bg-elevation-0 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSQL(!showSQL)}
              className="w-full justify-between hover:bg-elevation-1"
            >
              <span className="flex items-center gap-2">
                <Code2 className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {showSQL ? 'Hide SQL Query' : 'Show SQL Query'}
                </span>
              </span>
              {showSQL ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>

          {/* Collapsible SQL Section with smooth transition */}
          <div
            className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden",
              showSQL ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="border-t border-border bg-gray-50 dark:bg-gray-900/50 p-4">
              {/* SQL Code Block */}
              <div className="relative rounded-lg overflow-hidden border border-border bg-black/5 dark:bg-black/20">
                <pre className="p-4 overflow-x-auto">
                  <code className="text-xs font-mono text-foreground leading-relaxed">
                    {sql}
                  </code>
                </pre>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-1.5 h-7 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </Button>

                {onEditSQL && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEditSQL}
                    className="gap-1.5 h-7 text-xs"
                  >
                    <Code2 className="w-3 h-3" />
                    Edit SQL
                  </Button>
                )}

                {onExecute && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onExecute}
                    className="gap-1.5 h-7 text-xs bg-primary"
                  >
                    <Play className="w-3 h-3" />
                    Run Again
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
