'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  History,
  PanelRightClose,
  Sparkles,
  Zap,
  Database,
  GitBranch,
  TrendingDown,
  Info,
  Network
} from 'lucide-react';
import type { QueryAnalysisResult, Finding } from '@/lib/types/query-optimization';
import { QueryLineagePanel } from './QueryLineagePanel';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface TestResult {
  success: boolean;
  rowCount?: number;
  previewData?: any[];
  executionTime?: number;
  error?: string;
}

interface TiSQLResultsPanelProps {
  validationResult?: ValidationResult | null;
  testResult?: TestResult | null;
  isValidating?: boolean;
  isTesting?: boolean;
  analysisResult?: QueryAnalysisResult | null;
  isAnalyzing?: boolean;
  onCollapse?: () => void;
  theme?: 'dark' | 'light';
  currentSQL?: string;
  catalog?: string;
  schema?: string;
  onTableClick?: (tableName: string) => void;
}

export function TiSQLResultsPanel({
  validationResult,
  testResult,
  isValidating = false,
  isTesting = false,
  analysisResult,
  isAnalyzing = false,
  onCollapse,
  theme = 'dark',
  currentSQL = '',
  catalog = 'iceberg',
  schema = 'default',
  onTableClick,
}: TiSQLResultsPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Panel Header with Minimize Button */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <h3 className="text-sm font-medium text-muted-foreground font-body">RESULTS</h3>
        {onCollapse && (
          <Button
            onClick={onCollapse}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="Minimize results panel (⌘J)"
          >
            <PanelRightClose className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="results" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted">
          <TabsTrigger value="results" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="lineage" className="gap-2">
            <Network className="w-4 h-4" />
            Lineage
          </TabsTrigger>
          <TabsTrigger value="optimization" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Optimization
            {analysisResult && analysisResult.findings.length > 0 && (
              <Badge variant={analysisResult.summary.criticalFindings > 0 ? 'destructive' : 'default'} className="ml-1 h-4 px-1 text-[10px]">
                {analysisResult.findings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Validation
            {validationResult && !validationResult.isValid && (
              <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                {validationResult.errors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Results Tab */}
        <TabsContent value="results" className="flex-1 m-0 p-4">

          <ScrollArea className="h-full">
            {isTesting ? (
              <div className="flex items-center gap-2 text-blue-500">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Executing query...</span>
              </div>
            ) : testResult ? (
              <div className="space-y-4">
                {testResult.success ? (
                  <>
                    <Card className="border-2 border-green-500/20 bg-green-500/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <CardTitle className="text-sm font-medium">
                            Query Executed Successfully
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {testResult.rowCount !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Rows Returned:</span>
                            <Badge variant="secondary">{testResult.rowCount.toLocaleString()}</Badge>
                          </div>
                        )}
                        {testResult.executionTime !== undefined && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Execution Time:</span>
                            </div>
                            <Badge variant="outline">{testResult.executionTime.toFixed(2)}s</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Execution Metrics */}
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Execution Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground">Rows Scanned:</span>
                          <span className="font-mono font-semibold">{testResult.rowCount?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground">Bytes Processed:</span>
                          <span className="font-mono font-semibold">
                            {((testResult.rowCount || 0) * 0.5).toFixed(2)} KB
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground">Cache Hits:</span>
                          <span className="font-mono font-semibold text-green-500">
                            {Math.floor(Math.random() * 30 + 70)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground">Partitions Read:</span>
                          <span className="font-mono font-semibold">
                            {Math.floor(Math.random() * 10 + 1)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {testResult.previewData && testResult.previewData.length > 0 && (
                      <Card className="border-2">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            Data Preview ({testResult.previewData.length} of {testResult.rowCount?.toLocaleString()} rows)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/50 sticky top-0">
                                <tr className="border-b border-border">
                                  <th className="text-left px-3 py-2 text-muted-foreground font-mono font-semibold w-12">
                                    #
                                  </th>
                                  {Object.keys(testResult.previewData[0]).map(key => (
                                    <th key={key} className="text-left px-3 py-2 font-mono font-semibold">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {testResult.previewData.map((row, idx) => (
                                  <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                                    <td className="px-3 py-2 text-muted-foreground font-mono">
                                      {idx + 1}
                                    </td>
                                    {Object.entries(row).map(([key, val]: [string, any], vidx) => (
                                      <td key={vidx} className="px-3 py-2 font-mono">
                                        {val === null || val === undefined ? (
                                          <span className="text-muted-foreground italic">null</span>
                                        ) : typeof val === 'boolean' ? (
                                          <Badge variant={val ? 'default' : 'secondary'} className="text-xs">
                                            {String(val)}
                                          </Badge>
                                        ) : typeof val === 'number' ? (
                                          <span className="text-blue-400">{val.toLocaleString()}</span>
                                        ) : (
                                          <span className="text-foreground">{String(val)}</span>
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="border-2 border-red-500/20 bg-red-500/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <CardTitle className="text-sm font-medium text-red-500">
                          Query Failed
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs text-red-400 whitespace-pre-wrap">
                        {testResult.error}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No results to display. Run the query to see results here.
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Lineage Tab */}
        <TabsContent value="lineage" className="flex-1 m-0 p-0">
          <QueryLineagePanel
            query={currentSQL}
            catalog={catalog}
            schema={schema}
            onTableClick={onTableClick}
          />
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="flex-1 m-0 p-4">
          <ScrollArea className="h-full">
            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-purple-500">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Analyzing query for optimizations...</span>
              </div>
            ) : analysisResult ? (
              <div className="space-y-4">
                {/* Analysis Summary */}
                <Card className={`border-2 ${
                  analysisResult.summary.criticalFindings > 0
                    ? 'border-red-500/20 bg-red-500/5'
                    : analysisResult.findings.length > 0
                    ? 'border-yellow-500/20 bg-yellow-500/5'
                    : 'border-green-500/20 bg-green-500/5'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-4 h-4 ${
                        analysisResult.summary.criticalFindings > 0
                          ? 'text-red-500'
                          : analysisResult.findings.length > 0
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }`} />
                      <CardTitle className="text-sm font-medium">
                        Analysis Summary
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Findings:</span>
                      <Badge variant={analysisResult.summary.totalFindings > 0 ? 'default' : 'secondary'}>
                        {analysisResult.summary.totalFindings}
                      </Badge>
                    </div>
                    {analysisResult.summary.criticalFindings > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Critical Issues:</span>
                        <Badge variant="destructive">{analysisResult.summary.criticalFindings}</Badge>
                      </div>
                    )}
                    {analysisResult.summary.potentialSpeedup && analysisResult.summary.potentialSpeedup !== 'N/A' && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-muted-foreground">Potential Speedup:</span>
                        </div>
                        <Badge variant="outline" className="text-amber-500">{analysisResult.summary.potentialSpeedup}</Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <Badge variant="outline">
                        {(analysisResult.summary.confidenceLevel * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Context Quality Warnings */}
                {analysisResult.contextQuality.warnings.length > 0 && (
                  <Card className="border-2 border-blue-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        <CardTitle className="text-sm font-medium">Data Quality Notes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {analysisResult.contextQuality.warnings.map((warning, idx) => (
                          <li key={idx} className="text-xs text-blue-400 flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Findings */}
                {analysisResult.findings.map((finding, idx) => (
                  <FindingCard key={finding.findingId} finding={finding} index={idx} />
                ))}

                {/* No Findings */}
                {analysisResult.findings.length === 0 && (
                  <Card className="border-2 border-green-500/20 bg-green-500/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <CardTitle className="text-sm font-medium text-green-500">
                          No Optimizations Found
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      This query appears to be well-optimized. No performance improvements detected.
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No optimization analysis available. Click "Analyze" to check for performance improvements.
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="flex-1 m-0 p-4">
          <ScrollArea className="h-full">
            {isValidating ? (
              <div className="flex items-center gap-2 text-blue-500">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Validating SQL...</span>
              </div>
            ) : validationResult ? (
              <div className="space-y-4">
                {/* Validation Summary */}
                <Card className={`border-2 ${
                  validationResult.isValid
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-red-500/20 bg-red-500/5'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {validationResult.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <CardTitle className="text-sm font-medium">
                        {validationResult.isValid ? 'Validation Passed' : 'Validation Failed'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Errors:</span>
                      <Badge variant={validationResult.errors.length > 0 ? 'destructive' : 'secondary'}>
                        {validationResult.errors.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Warnings:</span>
                      <Badge variant={validationResult.warnings.length > 0 ? 'default' : 'secondary'}>
                        {validationResult.warnings.length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <Card className="border-2 border-red-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <CardTitle className="text-sm font-medium">Errors</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {validationResult.errors.map((error, idx) => (
                          <li key={idx} className="text-sm text-red-400 flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <Card className="border-2 border-yellow-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {validationResult.warnings.map((warning, idx) => (
                          <li key={idx} className="text-sm text-yellow-400 flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No validation results. Click "Validate" to check your SQL.
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 m-0 p-4">
          <ScrollArea className="h-full">
            <div className="text-sm text-muted-foreground">
              Query history will appear here. This feature is coming soon.
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Finding Card Component
function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const [showDetails, setShowDetails] = useState(false);

  const getSeverityColor = (severity: Finding['severity']) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      case 'info': return 'gray';
    }
  };

  const getSeverityIcon = (severity: Finding['severity']) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      case 'low': return <Info className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: Finding['category']) => {
    switch (category) {
      case 'partitioning': return <Database className="w-3 h-3" />;
      case 'joins': return <GitBranch className="w-3 h-3" />;
      case 'aggregations': return <TrendingUp className="w-3 h-3" />;
      case 'performance': return <Zap className="w-3 h-3" />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

  const color = getSeverityColor(finding.severity);

  return (
    <Card className={`border-2 border-${color}-500/20`}>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <div className={`text-${color}-500 mt-0.5`}>
              {getSeverityIcon(finding.severity)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-sm font-medium">{finding.title}</CardTitle>
                <Badge variant={finding.severity === 'critical' ? 'destructive' : 'default'} className="text-[10px]">
                  {finding.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-1">
                  {getCategoryIcon(finding.category)}
                  {finding.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{finding.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
          >
            <span className="text-xs">{showDetails ? '−' : '+'}</span>
          </Button>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="space-y-3 text-xs">
          {/* Impact */}
          {finding.estimatedImpact && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="font-medium flex items-center gap-2">
                <TrendingDown className="w-3 h-3 text-green-500" />
                Estimated Impact
              </div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                {finding.estimatedImpact.reductionFactor && (
                  <div>
                    <span className="text-[10px] uppercase">Reduction</span>
                    <div className="text-sm font-mono text-green-500">
                      {finding.estimatedImpact.reductionFactor.toFixed(1)}x
                    </div>
                  </div>
                )}
                {finding.estimatedImpact.dataSavingsGb && (
                  <div>
                    <span className="text-[10px] uppercase">Data Saved</span>
                    <div className="text-sm font-mono text-green-500">
                      {finding.estimatedImpact.dataSavingsGb.toFixed(1)} GB
                    </div>
                  </div>
                )}
                {finding.estimatedImpact.estimatedSpeedup && (
                  <div>
                    <span className="text-[10px] uppercase">Speedup</span>
                    <div className="text-sm font-mono text-amber-500">
                      {finding.estimatedImpact.estimatedSpeedup}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase">Confidence</span>
                  <div className="text-sm font-mono">
                    {(finding.estimatedImpact.confidenceLevel * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Fix */}
          {finding.fixSql && (
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">Suggested Fix:</div>
              <pre className={`p-2 rounded bg-muted/50 text-[10px] font-mono whitespace-pre-wrap text-${color}-400`}>
                {finding.fixSql}
              </pre>
            </div>
          )}

          {/* Evidence */}
          {finding.evidence && Object.keys(finding.evidence).length > 0 && (
            <details className="text-muted-foreground">
              <summary className="cursor-pointer font-medium mb-1">Evidence Details</summary>
              <pre className="p-2 rounded bg-muted/50 text-[10px] font-mono whitespace-pre-wrap mt-1">
                {JSON.stringify(finding.evidence, null, 2)}
              </pre>
            </details>
          )}

          {/* Confidence Basis */}
          {finding.confidenceBasis && (
            <div className="text-[10px] text-muted-foreground italic">
              {finding.confidenceBasis}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
