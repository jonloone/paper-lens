'use client';

import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TiSQLEditor } from './TiSQLEditor';
import { TiSQLContextPanel } from './TiSQLContextPanel';
import { TiSQLResultsPanel } from './TiSQLResultsPanel';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle2, Sparkles, ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { AIChatPanel } from '@/components/playground/AIChatPanel';
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

interface TiSQLWorkspaceProps {
  // Product context (Step 1)
  productDefinition?: ProductDefinition;

  // Sources (Step 2)
  selectedSources: Source[];

  // Schema (Step 3/4)
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
  onAIChat?: () => void;

  // Results
  validationResult?: ValidationResult | null;
  testResult?: TestResult | null;
  isValidating?: boolean;
  isTesting?: boolean;

  // Theme
  theme?: 'dark' | 'light';
}

export function TiSQLWorkspace({
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
  onAIChat,
  validationResult,
  testResult,
  isValidating = false,
  isTesting = false,
  theme = 'dark'
}: TiSQLWorkspaceProps) {
  const [leftPanelSize, setLeftPanelSize] = useState(20);
  const [rightPanelSize, setRightPanelSize] = useState(30);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

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

      // Ctrl + Shift + I - Toggle AI chat
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setShowAIChat(prev => !prev);
      }

      // Cmd/Ctrl + Enter - Run query
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRun]);

  const handleInsertSQL = (generatedSQL: string) => {
    onSQLChange(generatedSQL);
    setShowAIChat(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        theme === 'dark' ? 'bg-[#252525] border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          {/* Panel Toggle Buttons */}
          <Button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            variant="ghost"
            size="sm"
            className="gap-1 h-8 px-2"
            title="Toggle context panel (Cmd/Ctrl+B)"
          >
            {leftPanelCollapsed ? <ChevronRight className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button
            onClick={onRun}
            disabled={isTesting || !sql.trim()}
            size="sm"
            className="gap-2"
          >
            {isTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run
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
                Validating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Validate
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowAIChat(true)}
            variant="secondary"
            size="sm"
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            variant="ghost"
            size="sm"
            className="gap-1 h-8 px-2"
            title="Toggle results panel (Cmd/Ctrl+J)"
          >
            {rightPanelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium">{environment.toUpperCase()}</span>
          <span>•</span>
          <span>{catalog}</span>
          <span>•</span>
          <span className="font-mono">
            {selectedSources.length} {selectedSources.length === 1 ? 'table' : 'tables'}
          </span>
          <span>•</span>
          <span className="font-mono">
            {outputSchema.length} {outputSchema.length === 1 ? 'column' : 'columns'}
          </span>
          <span className="text-[10px] opacity-60">
            Cmd+Enter: Run • Cmd+B: Context • Cmd+J: Results • Ctrl+Shift+I: AI
          </span>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Context */}
          {!leftPanelCollapsed && (
            <>
              <Panel
                defaultSize={leftPanelSize}
                minSize={15}
                maxSize={40}
                onResize={setLeftPanelSize}
                className="transition-all duration-200"
              >
                <div className={`h-full border-r ${
                  theme === 'dark' ? 'bg-[#252525] border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
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

              <PanelResizeHandle className={`w-1 ${
                theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              } transition-colors`} />
            </>
          )}

          {/* Center Panel - SQL Editor */}
          <Panel defaultSize={50} minSize={30}>
            <div className={`h-full ${
              theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'
            }`}>
              <TiSQLEditor
                sql={sql}
                onChange={onSQLChange}
                selectedCatalog={catalog}
                selectedEnvironment={environment}
                schema={outputSchema}
                onExecute={onRun}
                theme={theme}
              />
            </div>
          </Panel>

          {/* Right Panel - Results */}
          {!rightPanelCollapsed && (
            <>
              <PanelResizeHandle className={`w-1 ${
                theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              } transition-colors`} />

              <Panel
                defaultSize={rightPanelSize}
                minSize={20}
                maxSize={50}
                onResize={setRightPanelSize}
                className="transition-all duration-200"
              >
                <div className={`h-full border-l ${
                  theme === 'dark' ? 'bg-[#252525] border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <TiSQLResultsPanel
                    validationResult={validationResult}
                    testResult={testResult}
                    isValidating={isValidating}
                    isTesting={isTesting}
                    theme={theme}
                    onAIChat={() => setShowAIChat(true)}
                  />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        onInsertSQL={handleInsertSQL}
        currentSQL={sql}
        selectedText=""
        catalog={catalog}
        schema={selectedSources[0]?.name || 'production'}
        environment={environment}
      />
    </div>
  );
}
