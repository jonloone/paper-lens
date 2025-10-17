'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, Package, Code, XCircle } from 'lucide-react';
import { TiSQLEditor } from './TiSQLEditor';
import { DBTModelViewer, DbtConfig } from './dbt/DBTModelViewerSimple';

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

interface QueryAnalysisResult {
  summary: {
    totalFindings: number;
    criticalFindings: number;
    potentialSpeedup?: string;
    confidenceLevel: number;
  };
  findings: any[];
  contextQuality: {
    warnings: string[];
  };
}

interface DbtModelData {
  modelSql: string;
  schemaYml: string;
  sourcesYml?: string;
  config: DbtConfig;
}

export interface TiSQLRightPanelProps {
  // Data Preview props
  validationResult?: ValidationResult | null;
  testResult?: TestResult | null;
  isValidating?: boolean;
  isTesting?: boolean;
  analysisResult?: QueryAnalysisResult | null;
  isAnalyzing?: boolean;
  currentSQL?: string;
  catalog?: string;
  schema?: string;
  onTableClick?: (tableName: string) => void;

  // SQL Editor props
  onSQLChange?: (sql: string) => void;
  onExecuteSQL?: (sql: string) => void;

  // dbt Model props
  dbtModel?: DbtModelData | null;
  onCopyDbt?: (content: string, type: string) => void;
  onDownloadDbt?: () => void;
}

export function TiSQLRightPanel({
  // Data Preview props
  validationResult,
  testResult,
  isValidating = false,
  isTesting = false,
  analysisResult,
  isAnalyzing = false,
  currentSQL = '',
  catalog = 'iceberg',
  schema = 'default',
  onTableClick,

  // SQL Editor props
  onSQLChange,
  onExecuteSQL,

  // dbt Model props
  dbtModel,
  onCopyDbt,
  onDownloadDbt
}: TiSQLRightPanelProps) {
  const hasDbtModel = !!dbtModel;

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs defaultValue="results" className="h-full flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted">
          {/* Templates Tab */}
          <TabsTrigger value="templates" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Templates
          </TabsTrigger>

          {/* SQL Editor Tab */}
          <TabsTrigger value="editor" className="gap-2">
            <Code className="w-4 h-4" />
            SQL Editor
          </TabsTrigger>

          {/* DBT Editor Tab */}
          <TabsTrigger
            value="dbt"
            className="gap-2"
            disabled={!hasDbtModel}
          >
            <Package className="w-4 h-4" />
            DBT Editor
            {hasDbtModel && (
              <Badge
                variant="default"
                className="ml-1 h-4 px-1 text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
              >
                ready
              </Badge>
            )}
          </TabsTrigger>

          {/* Data Results Tab */}
          <TabsTrigger value="results" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Data Results
            {testResult?.success && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {testResult.rowCount?.toLocaleString()} rows
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="flex-1 m-0 p-6">
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3 max-w-md">
              <h3 className="text-sm font-semibold">Query Templates</h3>
              <p className="text-xs text-muted-foreground">
                Saved query templates will appear here. Coming soon.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* SQL Editor Tab */}
        <TabsContent value="editor" className="flex-1 m-0 h-full">
          <TiSQLEditor
            sql={currentSQL}
            onChange={onSQLChange || (() => {})}
            selectedCatalog={catalog}
            selectedEnvironment="development"
            onExecute={onExecuteSQL}
            theme="dark"
            readOnly={false}
          />
        </TabsContent>

        {/* DBT Editor Tab */}
        <TabsContent value="dbt" className="flex-1 m-0 p-6">
          {hasDbtModel ? (
            <DBTModelViewer
              modelSql={dbtModel.modelSql}
              schemaYml={dbtModel.schemaYml}
              sourcesYml={dbtModel.sourcesYml}
              config={dbtModel.config}
              onCopy={onCopyDbt}
              onDownload={onDownloadDbt}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3 max-w-md">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold">No dbt Model Generated</h3>
                <p className="text-xs text-muted-foreground">
                  Click "dbt" button in the header to convert your SQL into a production-ready
                  dbt model with tests and documentation.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Data Results Tab - Simplified, no nested tabs */}
        <TabsContent value="results" className="flex-1 m-0 p-6">
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
                    {testResult.previewData && testResult.previewData.length > 0 ? (
                      <div className="overflow-x-auto border rounded-lg">
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
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Query executed successfully but returned no data.
                      </div>
                    )}

                    {/* Row count and execution time */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {testResult.rowCount !== undefined && (
                        <span>{testResult.rowCount.toLocaleString()} rows returned</span>
                      )}
                      {testResult.executionTime !== undefined && (
                        <span>Executed in {testResult.executionTime.toFixed(2)}s</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="border-2 border-red-500/20 bg-red-500/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">Query Failed</span>
                    </div>
                    <pre className="text-xs text-red-400 whitespace-pre-wrap">
                      {testResult.error}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <h3 className="text-sm font-semibold">No Results</h3>
                  <p className="text-xs text-muted-foreground">
                    Run a query to see results here.
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
