'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  History
} from 'lucide-react';

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
  theme?: 'dark' | 'light';
}

export function TiSQLResultsPanel({
  validationResult,
  testResult,
  isValidating = false,
  isTesting = false,
  theme = 'dark'
}: TiSQLResultsPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="results" className="flex-1 flex flex-col">
        <TabsList className={`w-full justify-start rounded-none border-b ${
          theme === 'dark' ? 'border-gray-700 bg-[#252525]' : 'border-gray-200 bg-gray-50'
        }`}>
          <TabsTrigger value="results" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Results
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
                            <Badge variant="secondary">{testResult.rowCount}</Badge>
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

                    {testResult.previewData && testResult.previewData.length > 0 && (
                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">
                            Preview ({testResult.previewData.length} rows)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b">
                                  {Object.keys(testResult.previewData[0]).map(key => (
                                    <th key={key} className="text-left p-2 font-mono">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {testResult.previewData.map((row, idx) => (
                                  <tr key={idx} className="border-b">
                                    {Object.values(row).map((val: any, vidx) => (
                                      <td key={vidx} className="p-2 font-mono">
                                        {String(val)}
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
