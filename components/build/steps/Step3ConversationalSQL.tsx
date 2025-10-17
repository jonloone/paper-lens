'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Play, Sparkles, Package, Loader2 } from 'lucide-react';
import { SQLChat } from '@/components/sql/SQLChat';
import { TiSQLRightPanel } from '@/components/tisql/TiSQLRightPanel';
import { Source } from './Step2SelectSources';
import type { DbtTemplate } from '@/lib/services/dbt-template-service';

export interface Step3Data {
  sql: string;
  validationResult?: ValidationResult;
  testResult?: TestResult;
}

interface Step3ConversationalSQLProps {
  initialData?: Partial<Step3Data>;
  selectedSources: Source[];
  productDefinition?: any;
  onComplete: (data: Step3Data) => void;
  onBack: () => void;
}

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

/**
 * Step3ConversationalSQL - Conversation-Driven SQL Development
 *
 * NEW PARADIGM (Oct 16, 2025 Critical UX Audit):
 * - AI Chat is PRIMARY (40% of screen, always visible)
 * - Results are ALWAYS SHOWN (60% of screen, live preview)
 * - SQL Editor is AVAILABLE ON DEMAND (expandable drawer - future phase)
 *
 * This replaces the old editor-first approach with conversation-first.
 */
export function Step3ConversationalSQL({
  initialData,
  selectedSources,
  productDefinition,
  onComplete,
  onBack
}: Step3ConversationalSQLProps) {
  // SQL state
  const [sql, setSQL] = useState(initialData?.sql || '');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // dbt state
  const [dbtModel, setDbtModel] = useState<any | null>(null);
  const [isGeneratingDbt, setIsGeneratingDbt] = useState(false);

  // Auto-validate when SQL changes
  useEffect(() => {
    if (!sql || sql.length < 10) {
      setValidationResult(null);
      return;
    }

    const timer = setTimeout(() => {
      validateSQL(sql);
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [sql]);

  // Validate SQL
  const validateSQL = async (sqlToValidate: string) => {
    setIsValidating(true);
    try {
      // Mock validation - replace with real Trino API
      await new Promise(resolve => setTimeout(resolve, 500));

      const isValid = sqlToValidate.toLowerCase().includes('select') &&
                      sqlToValidate.toLowerCase().includes('from');

      setValidationResult({
        isValid,
        errors: isValid ? [] : ['SQL must contain SELECT and FROM'],
        warnings: []
      });
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Validation failed'],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Execute query
  const handleRunQuery = async () => {
    if (!validationResult?.isValid) {
      return;
    }

    setIsExecuting(true);
    try {
      // Mock execution - replace with real Trino API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockData: TestResult = {
        success: true,
        rowCount: Math.floor(Math.random() * 1000) + 100,
        executionTime: 0.34,
        previewData: [
          { customer_id: 1001, name: 'Acme Corp', risk_score: 'HIGH', email: 'contact@acme.com' },
          { customer_id: 1002, name: 'Beta Ltd', risk_score: 'MEDIUM', email: 'info@beta.com' },
          { customer_id: 1003, name: 'Gamma Inc', risk_score: 'LOW', email: 'hello@gamma.com' },
        ]
      };

      setTestResult(mockData);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle AI-generated SQL
  const handleInsertSQL = useCallback((generatedSQL: string) => {
    setSQL(generatedSQL);
    // Auto-execute after AI generates SQL (with slight delay for validation)
    setTimeout(() => {
      handleRunQuery();
    }, 1500);
  }, []);

  // Generate dbt model from SQL
  const handleGenerateDBT = async () => {
    if (!sql || !validationResult?.isValid) {
      return;
    }

    setIsGeneratingDbt(true);
    try {
      const response = await fetch('/api/tisql/generate-dbt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql,
          productDefinition,
          selectedSources
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate dbt model');
      }

      const dbt = await response.json();
      setDbtModel(dbt);
    } catch (error) {
      console.error('Error generating dbt model:', error);
      // TODO: Show error toast
    } finally {
      setIsGeneratingDbt(false);
    }
  };

  // Handle dbt template selection
  const handleDbtTemplateSelected = (template: DbtTemplate) => {
    // Set the dbt model from template
    setDbtModel({
      modelSql: template.modelSql,
      schemaYml: template.schemaYml,
      sourcesYml: template.sourcesYml,
      config: template.config,
    });

    // Also update SQL editor with the model SQL
    setSQL(template.modelSql);
  };

  // Calculate confidence score
  const confidenceScore = validationResult?.isValid && testResult?.success ? 95 :
                         validationResult?.isValid ? 75 : 30;

  return (
    <div className="h-screen flex flex-col bg-background hide-nav-dock">
      {/* Main 2-Panel Layout - Full Height */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANEL (40%): AI Chat - PRIMARY INTERFACE */}
        <div className="w-[40%] border-r border-border flex flex-col bg-card">
          {/* Inline Header - Compact */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-7 gap-1.5 px-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-xs">Back</span>
              </Button>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs font-medium truncate max-w-[200px]">
                {productDefinition?.name || 'Untitled'}
              </span>
            </div>
            <Button
              onClick={() => onComplete({ sql, validationResult: validationResult || undefined, testResult: testResult || undefined })}
              disabled={!validationResult?.isValid}
              size="sm"
              className="h-7 gap-1.5 px-3 text-xs"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            <SQLChat
              context={{
                catalog: selectedSources[0]?.catalog || 'iceberg',
                schema: selectedSources[0]?.schema || 'production',
                selectedTables: selectedSources.map(s => ({
                  name: s.name,
                  catalog: s.catalog || 'iceberg',
                  schema: s.schema || 'production',
                  columns: s.columns,
                })),
                currentSQL: sql,
                environment: 'development',
              }}
              onSQLGenerated={handleInsertSQL}
              placeholder="Ask me to generate SQL queries, explain code, or optimize performance..."
            />
          </div>
        </div>

        {/* RIGHT PANEL (60%): Results + dbt - TABBED */}
        <div className="w-[60%] flex flex-col bg-background">
          {/* Inline Actions Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              {validationResult?.isValid && (
                <Badge variant="outline" className="h-6 gap-1.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {confidenceScore}%
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {sql.split('\n').length} lines • {selectedSources.length} sources
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunQuery}
                disabled={!validationResult?.isValid || isExecuting}
                className="h-7 gap-1.5 px-3 text-xs"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Run
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateDBT}
                disabled={!validationResult?.isValid || isGeneratingDbt}
                className="h-7 gap-1.5 px-3 text-xs"
              >
                {isGeneratingDbt ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Package className="w-3.5 h-3.5" />
                    dbt
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <TiSQLRightPanel
              validationResult={validationResult}
              testResult={testResult}
              isValidating={isValidating}
              isTesting={isExecuting}
              currentSQL={sql}
              catalog={selectedSources[0]?.catalog || 'iceberg'}
              schema={selectedSources[0]?.schema || 'production'}
              onSQLChange={setSQL}
              onExecuteSQL={() => handleRunQuery()}
              dbtModel={dbtModel}
              onDbtTemplateSelected={handleDbtTemplateSelected}
              onDownloadDbt={() => {
                // TODO: Implement download as ZIP
                console.log('Downloading dbt model...');
              }}
              productDefinition={productDefinition}
              selectedTables={selectedSources}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
