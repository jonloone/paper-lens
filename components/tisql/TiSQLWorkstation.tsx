'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TiSQLEditor } from './TiSQLEditor';
import { TiSQLContextPanel } from './TiSQLContextPanel';
import { TiSQLResultsPanel } from './TiSQLResultsPanel';
import { TiSQLAgentChat } from './TiSQLAgentChat';
import { TiSQLCopilotProvider } from './TiSQLCopilotProvider';
import { SQLWorkstationContext, SQLWorkstationContextActions } from '@/lib/copilot/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  CheckCircle2,
  ArrowLeft,
  Save,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  Code2,
  Bot
} from 'lucide-react';
import type { ProductDefinition } from '../build/steps/Step1DefineProduct';
import type { Source } from '../build/steps/Step2SelectSources';

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

interface TiSQLWorkstationProps {
  // Product context
  productDefinition?: ProductDefinition;
  selectedSources: Source[];
  outputSchema: Array<{ name: string; type: string }>;

  // SQL state
  sql: string;
  onSQLChange: (sql: string) => void;

  // Environment
  catalog?: string;
  environment?: string;

  // Actions
  onRun: () => void;
  onValidate: () => void;
  onSave?: () => void;
  onBack?: () => void;
  onContinue?: () => void;
  continueButtonText?: string;

  // Results
  validationResult?: ValidationResult | null;
  testResult?: TestResult | null;
  isValidating?: boolean;
  isTesting?: boolean;

  // Theme
  theme?: 'dark' | 'light';
}

export function TiSQLWorkstation({
  productDefinition,
  selectedSources,
  outputSchema,
  sql,
  onSQLChange,
  catalog = 'iceberg',
  environment = 'development',
  onRun,
  onValidate,
  onSave,
  onBack,
  onContinue,
  continueButtonText = 'Continue',
  validationResult,
  testResult,
  isValidating = false,
  isTesting = false,
  theme = 'dark'
}: TiSQLWorkstationProps) {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [centerView, setCenterView] = useState<'editor' | 'agent'>('editor');
  const [mounted, setMounted] = useState(false);

  // Mount portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B - Toggle left panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setLeftPanelCollapsed(prev => !prev);
      }

      // Cmd/Ctrl + J - Toggle right panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setRightPanelCollapsed(prev => !prev);
      }

      // Cmd/Ctrl + Enter - Run query
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onRun();
      }

      // Cmd/Ctrl + S - Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (onSave) onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRun, onSave]);

  const handleInsertSQL = (generatedSQL: string) => {
    onSQLChange(generatedSQL);
  };

  // Build CopilotKit context from current state
  const copilotContext: SQLWorkstationContext = {
    currentSQL: sql,
    selectedText: '',
    catalog: catalog,
    schema: selectedSources[0]?.schema || 'default',
    environment: environment as 'development' | 'staging' | 'production',
    selectedSources: selectedSources,
    productDefinition: productDefinition,
    isEditMode: true,
    lastExecutionResult: testResult ? {
      success: testResult.success,
      rowCount: testResult.rowCount,
      executionTime: testResult.executionTime,
      error: testResult.error,
    } : undefined,
  };

  // Build CopilotKit actions
  const copilotActions: SQLWorkstationContextActions = {
    onSQLChange: onSQLChange,
    onExecuteQuery: async (sql: string) => {
      onRun();
      // Return mock result for now - in production, this would return actual query results
      return {
        success: true,
        rowCount: 0,
        executionTime: 0,
        previewData: [],
      };
    },
    onInsertSQL: (sql: string, replace?: boolean) => {
      if (replace) {
        onSQLChange(sql);
      } else {
        onSQLChange(sql + '\n\n' + sql);
      }
    },
  };

  const workstationContent = (
    <div className="fixed inset-0 z-[9999] h-screen flex flex-col bg-background">
      {/* Compact Header Bar - Uses design tokens */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        {/* Left: Back + Product Context */}
        <div className="flex items-center gap-4">
          {onBack && (
            <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Button>
          )}

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-3">
            {productDefinition && (
              <>
                <span className="text-sm font-medium">{productDefinition.displayName}</span>
                <span className="text-xs text-muted-foreground">•</span>
              </>
            )}
            <Badge variant="secondary" className="text-xs">
              {environment.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {catalog}
            </Badge>
          </div>
        </div>

        {/* Center: Actions */}
        <div className="flex items-center gap-2">
          {/* Panel Toggles */}
          <Button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            variant="ghost"
            size="sm"
            title="Toggle context panel (⌘B)"
          >
            {leftPanelCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Center View Toggle - Material Style */}
          <div className="relative inline-flex items-center bg-muted rounded-full p-1 border border-border">
            {/* Sliding Background Indicator - Different colors per mode */}
            <div
              className={`absolute top-1 h-[calc(100%-8px)] rounded-full transition-all duration-300 ease-in-out shadow-sm ${
                centerView === 'editor'
                  ? 'left-1 w-[85px] bg-blue-600'
                  : 'left-[89px] w-[80px] bg-purple-600'
              }`}
            />

            {/* Buttons */}
            <button
              onClick={() => setCenterView('editor')}
              className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${
                centerView === 'editor'
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span className="text-sm font-medium">Editor</span>
            </button>

            <button
              onClick={() => setCenterView('agent')}
              className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${
                centerView === 'agent'
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm font-medium">Agent</span>
            </button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Primary Actions */}
          <Button
            onClick={onRun}
            disabled={isTesting || !sql.trim()}
            size="sm"
            className="gap-2"
          >
            {isTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span className="text-sm">Run</span>
              </>
            )}
          </Button>

          <Button
            onClick={onValidate}
            disabled={isValidating || !sql.trim()}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isValidating ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Validating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Validate</span>
              </>
            )}
          </Button>

          {onSave && (
            <Button
              onClick={onSave}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">Save</span>
            </Button>
          )}

          <div className="h-6 w-px bg-border" />

          <Button
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            variant="ghost"
            size="sm"
            title="Toggle results panel (⌘J)"
          >
            {rightPanelCollapsed ? (
              <PanelRightOpen className="w-4 h-4" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Right: Continue Button */}
        <div className="flex items-center gap-2">
          {onContinue && (
            <Button
              onClick={onContinue}
              size="sm"
              disabled={!sql.trim()}
            >
              <span className="text-sm">{continueButtonText}</span>
              <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 3-Panel Workspace - Full Height */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Context (20%) */}
          {!leftPanelCollapsed && (
            <>
              <Panel
                defaultSize={20}
                minSize={15}
                maxSize={30}
                className="transition-all duration-200"
              >
                <div className="h-full border-r border-border bg-muted/30">
                  <TiSQLContextPanel
                    productDefinition={productDefinition}
                    selectedSources={selectedSources}
                    outputSchema={outputSchema}
                    catalog={catalog}
                    environment={environment}
                    theme={theme}
                  />
                </div>
              </Panel>

              <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
            </>
          )}

          {/* Center Panel - SQL Editor or SQL Agent (50-60%) */}
          <Panel
            defaultSize={leftPanelCollapsed ? (rightPanelCollapsed ? 100 : 70) : 55}
            minSize={30}
          >
            <div className="h-full bg-background">
              {centerView === 'editor' ? (
                <TiSQLEditor
                  sql={sql}
                  onChange={onSQLChange}
                  selectedCatalog={catalog}
                  selectedEnvironment={environment}
                  schema={outputSchema}
                  onExecute={onRun}
                  theme={theme}
                />
              ) : (
                <TiSQLAgentChat
                  catalog={catalog}
                  schema={selectedSources[0]?.schema || 'production'}
                  environment={environment}
                />
              )}
            </div>
          </Panel>

          {/* Right Panel - Results (25%) */}
          {!rightPanelCollapsed && (
            <>
              <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

              <Panel
                defaultSize={25}
                minSize={20}
                maxSize={40}
                className="transition-all duration-200"
              >
                <div className="h-full border-l border-border bg-muted/30">
                  <TiSQLResultsPanel
                    validationResult={validationResult}
                    testResult={testResult}
                    isValidating={isValidating}
                    isTesting={isTesting}
                    theme={theme}
                  />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status Bar - Uses design tokens */}
      <div className="flex items-center justify-between px-6 py-2 border-t border-border bg-card text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="font-mono">
            {selectedSources.length} {selectedSources.length === 1 ? 'table' : 'tables'}
          </span>
          <span>•</span>
          <span className="font-mono">
            {outputSchema.length} {outputSchema.length === 1 ? 'column' : 'columns'}
          </span>
        </div>

        <div className="flex items-center gap-4 opacity-60">
          <span>⌘↵ Run</span>
          <span>⌘B Context</span>
          <span>⌘J Results</span>
          <span>⌘S Save</span>
        </div>
      </div>
    </div>
  );

  // Render with portal to break out of layout constraints
  if (!mounted) return null;

  return createPortal(
    <TiSQLCopilotProvider context={copilotContext} actions={copilotActions}>
      {workstationContent}
    </TiSQLCopilotProvider>,
    document.body
  );
}
