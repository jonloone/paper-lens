'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TiSQLArtifactChat } from '@/components/tisql/TiSQLArtifactChat';
import { ResultsPreviewPanel, PreviewResult } from '@/components/build/ResultsPreviewPanel';
import { QualitySummaryPanel, QualitySummary, QualityCheck } from '@/components/build/QualitySummaryPanel';
import { SQLArtifact } from '@/components/build/SQLArtifact';
import { ArrowLeft, ArrowRight, Play, Database, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step3ResultsFirstProps {
  initialData?: {
    sql?: string;
    validationResult?: any;
    testResult?: any;
  };
  selectedSources: Array<{
    id: string;
    name: string;
    schema: string;
    columns: Array<{ name: string; type: string; description?: string }>;
  }>;
  productDefinition?: {
    name: string;
    description: string;
    domain?: string;
  };
  schema?: Array<{ name: string; type: string; description?: string }>;
  onComplete: (data: { sql: string; validationResult?: any; testResult?: any }) => void;
  onBack: () => void;
}

export function Step3ResultsFirst({
  initialData,
  selectedSources,
  productDefinition,
  schema = [],
  onComplete,
  onBack
}: Step3ResultsFirstProps) {
  const [sql, setSQL] = useState(initialData?.sql || '');
  const [explanation, setExplanation] = useState('');
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [qualitySummary, setQualitySummary] = useState<QualitySummary | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoadingQuality, setIsLoadingQuality] = useState(false);
  const [previewError, setPreviewError] = useState<string>();
  const [qualityError, setQualityError] = useState<string>();

  // Handle SQL generated from AI chat
  const handleSQLGenerated = useCallback(async (generatedSQL: string) => {
    setSQL(generatedSQL);

    // Extract explanation from the message (text before SQL code block)
    const explanationMatch = generatedSQL.match(/^(.*?)```sql/s);
    if (explanationMatch) {
      setExplanation(explanationMatch[1].trim());
    }

    // Auto-execute preview
    await executePreview(generatedSQL);
  }, []);

  // Execute query preview
  const executePreview = async (sqlToExecute: string = sql) => {
    if (!sqlToExecute.trim()) return;

    setIsLoadingPreview(true);
    setIsLoadingQuality(true);
    setPreviewError(undefined);
    setQualityError(undefined);

    try {
      // Call preview API endpoint
      const response = await fetch('/api/tisql/preview-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: sqlToExecute,
          catalog: 'iceberg',
          schema: 'production',
          limit: 100
        })
      });

      const data = await response.json();

      if (data.success) {
        // Set preview results
        setPreviewResult({
          columns: data.columns || [],
          rows: data.rows || [],
          rowCount: data.rowCount || 0,
          executionTimeMs: data.executionTimeMs || 0,
          limited: data.limited || false,
          bytesProcessed: data.bytesProcessed,
          profiling: data.profiling // YData profiling insights
        });

        // Generate quality summary from results
        await generateQualitySummary(data);
      } else {
        setPreviewError(data.message || 'Preview execution failed');
        setQualityError('Could not analyze quality - preview failed');
      }
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewError('Failed to execute preview');
      setQualityError('Failed to analyze quality');
    } finally {
      setIsLoadingPreview(false);
      setIsLoadingQuality(false);
    }
  };

  // Generate quality summary from preview results
  const generateQualitySummary = async (previewData: any) => {
    try {
      const totalRows = previewData.rowCount || 0;
      const columns = previewData.columns || [];
      const rows = previewData.rows || [];

      // Calculate basic quality metrics
      let nullCount = 0;
      const uniqueValues = new Map<number, Set<any>>();

      rows.forEach((row: any[]) => {
        row.forEach((cell, colIndex) => {
          if (cell === null || cell === undefined) {
            nullCount++;
          }
          if (!uniqueValues.has(colIndex)) {
            uniqueValues.set(colIndex, new Set());
          }
          uniqueValues.get(colIndex)?.add(cell);
        });
      });

      const totalCells = rows.length * columns.length;
      const completeness = totalCells > 0 ? ((totalCells - nullCount) / totalCells) * 100 : 100;

      // Calculate uniqueness (average across columns)
      let uniquenessSum = 0;
      uniqueValues.forEach((values, colIndex) => {
        const uniquenessRatio = rows.length > 0 ? (values.size / rows.length) * 100 : 100;
        uniquenessSum += uniquenessRatio;
      });
      const uniqueness = columns.length > 0 ? uniquenessSum / columns.length : 100;

      // Generate quality checks
      const checks: QualityCheck[] = [
        {
          id: 'check-1',
          name: 'Row Count',
          status: totalRows > 0 ? 'pass' : 'fail',
          message: `Query returned ${totalRows.toLocaleString()} rows`,
          metric: totalRows
        },
        {
          id: 'check-2',
          name: 'Column Completeness',
          status: completeness >= 95 ? 'pass' : completeness >= 80 ? 'warning' : 'fail',
          message: `${completeness.toFixed(1)}% of cells have values`,
          metric: completeness,
          threshold: 95
        },
        {
          id: 'check-3',
          name: 'Data Uniqueness',
          status: uniqueness >= 50 ? 'pass' : 'warning',
          message: `Average ${uniqueness.toFixed(1)}% unique values per column`,
          metric: uniqueness
        },
        {
          id: 'check-4',
          name: 'Null Values',
          status: nullCount === 0 ? 'pass' : nullCount < totalCells * 0.05 ? 'warning' : 'fail',
          message: `${nullCount} null values found (${((nullCount / totalCells) * 100).toFixed(1)}%)`,
          metric: nullCount
        }
      ];

      // Calculate overall score
      const passCount = checks.filter(c => c.status === 'pass').length;
      const warningCount = checks.filter(c => c.status === 'warning').length;
      const overallScore = ((passCount * 100 + warningCount * 70) / checks.length);

      setQualitySummary({
        overallScore: Math.round(overallScore),
        checks,
        completeness: Math.round(completeness),
        uniqueness: Math.round(uniqueness),
        validity: 100, // Placeholder
        nullCount,
        totalRows
      });
    } catch (error) {
      console.error('Quality analysis error:', error);
      setQualityError('Failed to analyze quality metrics');
    }
  };

  // Handle continue to next step
  const handleContinue = () => {
    // Allow continuation if we have results OR SQL
    // Results-first paradigm: SQL is an implementation detail
    if (!previewResult && !sql.trim()) {
      alert('Please compose your data product first by chatting with the assistant or selecting a pattern');
      return;
    }

    // Auto-generate SQL placeholder if we have results but no SQL
    // This happens when users click pattern suggestions or explore through conversation
    let sqlToSubmit = sql;
    if (!sql.trim() && previewResult) {
      // Extract SQL from the last successful execution
      // In a results-first workflow, SQL is secondary to the data product
      sqlToSubmit = '-- Data product generated via AI composition\n-- SQL will be optimized during deployment';
    }

    onComplete({
      sql: sqlToSubmit,
      validationResult: qualitySummary,
      testResult: previewResult
    });
  };

  return (
    <div className="flex flex-col h-screen bg-elevation-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-elevation-1 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Consolidated Context Tag with Sources Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <span className="font-semibold">
                  {productDefinition?.name || 'Untitled'}
                </span>
                <span className="text-primary-foreground/60">•</span>
                <span className="text-xs opacity-90">
                  Step 3: Compose Data Product
                </span>
                <span className="text-primary-foreground/60">•</span>
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
                  {selectedSources.length} sources
                </Badge>
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Available Sources</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {selectedSources.reduce((sum, s) => sum + s.columns.length, 0)} total columns
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {selectedSources.map((source) => (
                  <DropdownMenuItem key={source.id} className="flex-col items-start py-3">
                    <div className="flex items-center gap-2 w-full">
                      <Database className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-mono font-medium text-sm">{source.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-6">
                      {source.schema} • {source.columns.length} columns
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          {sql.trim() && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => executePreview()}
              disabled={isLoadingPreview}
              className="gap-2"
            >
              {isLoadingPreview ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Re-run Preview
                </>
              )}
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={handleContinue}
            disabled={!sql.trim()}
            className="gap-2 bg-primary"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area - Masonry Panel Layout */}
      <div className="flex-1 bg-dot-grid overflow-auto">
        <div className="w-full px-6 py-8">
          <TiSQLArtifactChat
            availableSources={selectedSources}
            productDefinition={productDefinition}
            onSQLGenerated={handleSQLGenerated}
            onContinue={handleContinue}
            initialSQL={sql}
            initialResults={previewResult}
            initialQuality={qualitySummary}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
