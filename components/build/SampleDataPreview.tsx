'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SampleDataPreview as SampleDataType } from '@/lib/types/source-quality';
import { Copy, AlertCircle, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SampleDataPreviewProps {
  sample: SampleDataType;
  className?: string;
}

export function SampleDataPreview({ sample, className }: SampleDataPreviewProps) {
  const [copiedColumn, setCopiedColumn] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const copyToClipboard = async (text: string, column: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedColumn(column);
    setTimeout(() => setCopiedColumn(null), 2000);
  };

  const formatValue = (value: any): { display: string; isNull: boolean; isInvalid: boolean } => {
    if (value === null || value === undefined) {
      return { display: 'NULL', isNull: true, isInvalid: false };
    }
    if (value === '') {
      return { display: '(empty)', isNull: false, isInvalid: true };
    }
    if (typeof value === 'object') {
      return { display: JSON.stringify(value), isNull: false, isInvalid: false };
    }
    return { display: String(value), isNull: false, isInvalid: false };
  };

  const detectInconsistencies = (column: string): { hasIssue: boolean; issue?: string } => {
    const values = sample.rows.map(row => row[column]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined);

    if (nonNullValues.length === 0) return { hasIssue: false };

    // Check for case inconsistencies in strings
    if (typeof nonNullValues[0] === 'string') {
      const uniqueCaseInsensitive = new Set(nonNullValues.map(v => String(v).toLowerCase()));
      const uniqueCaseSensitive = new Set(nonNullValues.map(v => String(v)));

      if (uniqueCaseSensitive.size > uniqueCaseInsensitive.size) {
        return {
          hasIssue: true,
          issue: 'Inconsistent casing detected'
        };
      }
    }

    return { hasIssue: false };
  };

  const renderTable = (isFullScreenView: boolean = false) => (
    <>
      <div className="min-w-max">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-background z-10">
            <tr className="border-b">
              <th className="p-2 text-left font-medium text-muted-foreground w-12">#</th>
              {sample.columns.map((column) => {
                const inconsistency = detectInconsistencies(column);
                return (
                  <th key={column} className="p-2 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{column}</span>
                      {inconsistency.hasIssue && (
                        <AlertCircle className="w-3 h-3 text-yellow-600" title={inconsistency.issue} />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => {
                          const columnData = sample.rows
                            .map(row => row[column])
                            .join('\n');
                          copyToClipboard(columnData, column);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {copiedColumn === column && (
                        <span className="text-[10px] text-green-600">Copied!</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sample.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-muted/50 group">
                <td className="p-2 text-muted-foreground">{rowIndex + 1}</td>
                {sample.columns.map((column) => {
                  const { display, isNull, isInvalid } = formatValue(row[column]);
                  return (
                    <td
                      key={column}
                      className={cn(
                        "p-2 font-mono",
                        isNull && "text-red-600 bg-red-50 font-semibold",
                        isInvalid && "text-yellow-600 bg-yellow-50 italic"
                      )}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Null value legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
          <span>NULL values</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded"></div>
          <span>Empty strings</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-yellow-600" />
          <span>Inconsistent formatting</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Sample Data</CardTitle>
              <CardDescription className="text-xs">
                Showing {sample.sampleSize} of {sample.totalRows.toLocaleString()} rows
                {sample.executionTimeMs && ` · ${sample.executionTimeMs}ms`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {sample.columns.length} columns
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullScreen(true)}
              >
                <Maximize2 className="w-4 h-4 mr-1" />
                Full Screen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full">
            {renderTable()}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Full Screen Dialog */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Sample Data - Full Screen View</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {sample.sampleSize} of {sample.totalRows.toLocaleString()} rows · {sample.columns.length} columns
                  {sample.executionTimeMs && ` · ${sample.executionTimeMs}ms`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="px-6 pb-6 flex-1 min-h-0">
            <ScrollArea className="h-[calc(95vh-120px)] w-full">
              {renderTable(true)}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
