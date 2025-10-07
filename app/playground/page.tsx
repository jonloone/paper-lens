'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle
} from 'react-resizable-panels';
import { ChevronRight, ChevronDown, Database, Table, Columns, X, Plus, FileText, Search, Moon, Sun, Play, Bot, Loader2, CheckCircle2, AlertCircle, Users, Save, FolderOpen, Sparkles } from 'lucide-react';
import '@/styles/workstation.css';
import { NexusOneLogo } from '@/components/ui/logo';
import { AIChatPanel } from '@/components/playground/AIChatPanel';
import { useHotkeys } from 'react-hotkeys-hook';

interface SQLFile {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
  savedToLibrary?: boolean;
  tags?: string[];
  description?: string;
}

interface SchemaNode {
  name: string;
  type: 'database' | 'table' | 'column';
  children?: SchemaNode[];
  dataType?: string;
}

// Function to generate default SQL with proper context
const getDefaultSQL = (catalog: string, environment: string) => {
  const env = AVAILABLE_ENVIRONMENTS.find(e => e.value === environment);
  const schema = env?.schemas[0] || 'production';


  return `use ${catalog}.${schema};

-- Welcome to NexusOne Trino Editor
-- Environment: ${environment.toUpperCase()} | Database: ${catalog}.${schema}
-- Press Cmd/Ctrl + Enter to execute query
-- Press Ctrl + I for AI-powered SQL assistance
-- ===========================================

-- Start typing your SQL query here...
`;
};

// Mock schema data
const MOCK_SCHEMA: SchemaNode[] = [
  {
    name: 'production',
    type: 'database',
    children: [
      {
        name: 'customers',
        type: 'table',
        children: [
          { name: 'customer_id', type: 'column', dataType: 'INT PRIMARY KEY' },
          { name: 'customer_name', type: 'column', dataType: 'VARCHAR(255)' },
          { name: 'email', type: 'column', dataType: 'VARCHAR(255)' },
          { name: 'created_at', type: 'column', dataType: 'TIMESTAMP' },
        ]
      },
      {
        name: 'orders',
        type: 'table',
        children: [
          { name: 'order_id', type: 'column', dataType: 'INT PRIMARY KEY' },
          { name: 'customer_id', type: 'column', dataType: 'INT' },
          { name: 'order_amount', type: 'column', dataType: 'DECIMAL(10,2)' },
          { name: 'order_date', type: 'column', dataType: 'DATE' },
          { name: 'status', type: 'column', dataType: 'VARCHAR(50)' },
        ]
      },
      {
        name: 'products',
        type: 'table',
        children: [
          { name: 'product_id', type: 'column', dataType: 'INT PRIMARY KEY' },
          { name: 'product_name', type: 'column', dataType: 'VARCHAR(255)' },
          { name: 'category', type: 'column', dataType: 'VARCHAR(100)' },
          { name: 'price', type: 'column', dataType: 'DECIMAL(10,2)' },
        ]
      }
    ]
  },
  {
    name: 'analytics',
    type: 'database',
    children: [
      {
        name: 'events',
        type: 'table',
        children: [
          { name: 'event_id', type: 'column', dataType: 'UUID' },
          { name: 'user_id', type: 'column', dataType: 'INT' },
          { name: 'event_type', type: 'column', dataType: 'VARCHAR(100)' },
          { name: 'event_data', type: 'column', dataType: 'JSON' },
          { name: 'timestamp', type: 'column', dataType: 'TIMESTAMP' },
        ]
      }
    ]
  }
];

// Available Trino catalogs
const AVAILABLE_CATALOGS = [
  { value: 'iceberg', label: 'Iceberg', description: 'Apache Iceberg tables' },
  { value: 'hive', label: 'Hive', description: 'Hive metastore tables' },
  { value: 'delta', label: 'Delta Lake', description: 'Delta Lake tables' },
  { value: 'postgres', label: 'PostgreSQL', description: 'PostgreSQL connector' },
  { value: 'mysql', label: 'MySQL', description: 'MySQL connector' },
  { value: 'mongodb', label: 'MongoDB', description: 'MongoDB connector' },
];

// Available environments
const AVAILABLE_ENVIRONMENTS = [
  { value: 'development', label: 'Development', schemas: ['dev', 'sandbox'] },
  { value: 'staging', label: 'Staging', schemas: ['staging', 'test'] },
  { value: 'production', label: 'Production', schemas: ['production', 'analytics'] },
];

// SSR-Safe SQL Editor with AI Widget
const EnhancedSQLEditor = dynamic(
  () => import('@tidbcloud/tisqleditor-react').then(async (mod) => {
    // const { aiWidget } = await import('@tidbcloud/codemirror-extension-ai-widget'); // REMOVED - using custom AI chat panel
    const { curSqlGutter } = await import('@tidbcloud/codemirror-extension-cur-sql-gutter');
    const { sqlAutoCompletion } = await import('@tidbcloud/codemirror-extension-sql-autocomplete');
    const { saveHelper } = await import('@tidbcloud/codemirror-extension-save-helper');
    const { oneDark } = await import('@tidbcloud/codemirror-extension-themes');

    const EditorWrapper = (props: any) => {
      const { 
        doc, 
        theme, 
        selectedCatalog, 
        selectedEnvironment, 
        activeFile, 
        setShowAiStatus, 
        setAiStatus,
        editorRef
      } = props;

      const extensions = useMemo(() => {
        const exts = [
          curSqlGutter(),
          sqlAutoCompletion(),
          // aiWidget removed - using custom AI chat panel instead
          saveHelper({
            save: (view) => {
              console.log('Saving file:', activeFile?.name);
            }
          })
        ];
        return exts;
      }, [activeFile]);

      return (
        <mod.EditorCacheProvider>
          <mod.SQLEditor
            key={`editor-${activeFile?.id}`}
            editorId={`editor-${activeFile?.id}`}
            doc={doc}
            theme={theme === 'dark' ? oneDark : undefined}
            extraExts={extensions}
            className="h-full"
            ref={editorRef}
          />
        </mod.EditorCacheProvider>
      );
    };

    return { default: EditorWrapper };
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] rounded border border-dashed border-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Loading SQL Editor with AI...</p>
        </div>
      </div>
    )
  }
);


export default function PlaygroundPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [leftTab, setLeftTab] = useState<'files' | 'schemas'>('files');
  const [selectedCatalog, setSelectedCatalog] = useState('iceberg');
  const [selectedEnvironment, setSelectedEnvironment] = useState('development');
  const [files, setFiles] = useState<SQLFile[]>([
    {
      id: '1',
      name: 'query_1.sql',
      content: getDefaultSQL('iceberg', 'development'),
      lastModified: new Date()
    }
  ]);
  const [activeFileId, setActiveFileId] = useState('1');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['production', 'analytics']));
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string>('');
  const editorRef = useRef<any>(null);
  const [aiStatus, setAiStatus] = useState<{
    isProcessing: boolean;
    currentStep: string;
    agents: string[];
    backend: string;
    confidence?: number;
    startTime?: number;
  }>({ isProcessing: false, currentStep: '', agents: [], backend: '' });
  const [showAiStatus, setShowAiStatus] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFileName, setSaveFileName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveTags, setSaveTags] = useState('');

  // Check if opened from workflow
  const [isWorkflowMode, setIsWorkflowMode] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check URL params on mount
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const sql = params.get('sql');
      const returnTo = params.get('returnTo');

      if (mode === 'workflow') {
        setIsWorkflowMode(true);
        setReturnUrl(returnTo);

        // Load SQL from params if provided
        if (sql) {
          setFiles([{
            id: '1',
            name: 'workflow_query.sql',
            content: decodeURIComponent(sql),
            lastModified: new Date()
          }]);
        }
      }
    }
  }, []);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Keyboard shortcut to open AI chat
  useHotkeys('ctrl+shift+i, cmd+shift+i', (e) => {
    e.preventDefault();
    setIsChatOpen(true);
  }, { enableOnFormTags: true });

  // Function to insert SQL from AI chat into editor
  const handleInsertSQL = useCallback((sql: string) => {
    if (!activeFile) return;

    // Update the active file with the new SQL
    setFiles(prev => prev.map(f =>
      f.id === activeFileId
        ? { ...f, content: sql, lastModified: new Date() }
        : f
    ));

    // If in workflow mode, also update localStorage for return
    if (isWorkflowMode) {
      localStorage.setItem('workflowSQL', sql);
    }
  }, [activeFile, activeFileId, isWorkflowMode]);

  // Function to execute the current query
  const executeQuery = useCallback(() => {
    if (!activeFile?.content.trim()) return;
    
    setIsExecuting(true);
    setExecutionResult('');
    
    // Simulate query execution
    setTimeout(() => {
      const lines = activeFile.content.split('\n').filter(line => line.trim() && !line.trim().startsWith('--'));
      const queryPreview = lines.slice(0, 3).join(' ').substring(0, 100);
      
      setExecutionResult(`✓ Query executed successfully\n\nQuery: ${queryPreview}...\n\nRows affected: ${Math.floor(Math.random() * 100)}\nExecution time: ${(Math.random() * 2).toFixed(2)}s\n\n[Results would appear here in a real implementation]`);
      setIsExecuting(false);
    }, 1500);
  }, [activeFile]);

  // Save to library
  const saveToLibrary = useCallback(async () => {
    if (!activeFile) return;

    const libraryFile = {
      ...activeFile,
      name: saveFileName || activeFile.name,
      description: saveDescription,
      tags: saveTags.split(',').map(t => t.trim()).filter(Boolean),
      savedToLibrary: true,
      catalog: selectedCatalog,
      environment: selectedEnvironment,
      lastModified: new Date()
    };

    // Save to localStorage for persistence
    try {
      const existingLibrary = JSON.parse(localStorage.getItem('sql-library') || '[]');
      const updatedLibrary = [...existingLibrary, libraryFile];
      localStorage.setItem('sql-library', JSON.stringify(updatedLibrary));

      // Update current file
      setFiles(prev => prev.map(f =>
        f.id === activeFile.id
          ? { ...f, savedToLibrary: true, tags: libraryFile.tags, description: saveDescription }
          : f
      ));

      // Reset modal
      setShowSaveModal(false);
      setSaveFileName('');
      setSaveDescription('');
      setSaveTags('');

      // Show success message
      alert('SQL file saved to library! You can reuse this in data product creation.');
    } catch (error) {
      console.error('Error saving to library:', error);
      alert('Error saving file. Please try again.');
    }
  }, [activeFile, saveFileName, saveDescription, saveTags, selectedCatalog, selectedEnvironment]);

  // Open save modal
  const openSaveModal = useCallback(() => {
    if (activeFile) {
      setSaveFileName(activeFile.name);
      setSaveDescription(activeFile.description || '');
      setSaveTags(activeFile.tags?.join(', ') || '');
      setShowSaveModal(true);
    }
  }, [activeFile]);

  // Add new file
  const addNewFile = useCallback(() => {
    const env = AVAILABLE_ENVIRONMENTS.find(e => e.value === selectedEnvironment);
    const schema = env?.schemas[0] || 'production';
    const newFile: SQLFile = {
      id: Date.now().toString(),
      name: `query_${files.length + 1}.sql`,
      content: `-- Database Context: ${selectedCatalog}.${schema}
-- use ${selectedCatalog}.${schema};
-- Environment: ${selectedEnvironment.toUpperCase()}
-- Catalog: ${selectedCatalog} | Schema: ${schema}
-- ===========================================
-- New SQL Query
-- Press Ctrl + I for AI assistance
-- ===========================================

-- Write your SQL query here
SELECT * 
FROM ${selectedCatalog}.${schema}.your_table
WHERE 1=1
LIMIT 10;
`,
      lastModified: new Date()
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  }, [files.length, selectedCatalog, selectedEnvironment]);

  // Close file
  const closeFile = useCallback((fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length === 1) return; // Don't close last file
    
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFileId === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId);
      setActiveFileId(remainingFiles[0]?.id || '');
    }
  }, [files, activeFileId]);

  // Toggle schema node expansion
  const toggleNode = useCallback((path: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Apply to workflow - sends SQL back to the wizard
  const applyToWorkflow = useCallback(() => {
    if (!activeFile?.content.trim()) return;

    // Store SQL in localStorage to be picked up by the wizard
    localStorage.setItem('workflow_sql_return', JSON.stringify({
      sql: activeFile.content,
      timestamp: new Date().toISOString()
    }));

    // Close window and return to wizard
    if (returnUrl) {
      window.location.href = returnUrl;
    } else {
      window.close();
    }
  }, [activeFile, returnUrl]);



  // Render schema tree
  const renderSchemaNode = (node: SchemaNode, path: string = '') => {
    const fullPath = path ? `${path}.${node.name}` : node.name;
    const isExpanded = expandedNodes.has(fullPath);
    const hasChildren = node.children && node.children.length > 0;
    
    const getIcon = () => {
      if (node.type === 'database') return <Database className="w-4 h-4" />;
      if (node.type === 'table') return <Table className="w-4 h-4" />;
      return <Columns className="w-4 h-4" />;
    };

    return (
      <div key={fullPath} className="select-none">
        <div 
          className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-700 cursor-pointer text-sm ${
            theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => hasChildren && toggleNode(fullPath)}
          style={{ paddingLeft: `${(path.split('.').filter(Boolean).length * 12) + 8}px` }}
        >
          {hasChildren && (
            <span className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
          )}
          {!hasChildren && <span className="w-4" />}
          {getIcon()}
          <span className="flex-1">{node.name}</span>
          {node.dataType && (
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {node.dataType}
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderSchemaNode(child, fullPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-screen w-full flex flex-col ${theme === 'dark' ? 'workstation-background' : 'bg-white'}`}>
      {/* Minimal toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        theme === 'dark' ? 'bg-[#252525] border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <NexusOneLogo className={`h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          
          {/* Environment Selector */}
          <div className="flex items-center gap-2">
            <label className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Environment:
            </label>
            <select
              value={selectedEnvironment}
              onChange={(e) => {
                setSelectedEnvironment(e.target.value);
                // Update active file with new context when environment changes
                if (activeFile) {
                  const env = AVAILABLE_ENVIRONMENTS.find(env => env.value === e.target.value);
                  const schema = env?.schemas[0] || 'production';
                  const lines = activeFile.content.split('\n');
                  // Update or add context lines
                  if (lines[0]?.startsWith('-- Database Context:')) {
                    lines[0] = `-- Database Context: ${selectedCatalog}.${schema}`;
                    lines[1] = `-- use ${selectedCatalog}.${schema};`;
                    lines[2] = `-- Environment: ${e.target.value}`;
                  } else {
                    lines.unshift(
                      `-- Database Context: ${selectedCatalog}.${schema}`,
                      `-- use ${selectedCatalog}.${schema};`,
                      `-- Environment: ${e.target.value}`,
                      ''
                    );
                  }
                  const updatedContent = lines.join('\n');
                  setFiles(prev => prev.map(f => 
                    f.id === activeFile.id 
                      ? { ...f, content: updatedContent, lastModified: new Date() }
                      : f
                  ));
                }
              }}
              className={`px-2 py-1 text-xs rounded border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-gray-300'
                  : 'bg-white border-gray-300 text-gray-700'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {AVAILABLE_ENVIRONMENTS.map(env => (
                <option key={env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Catalog Selector */}
          <div className="flex items-center gap-2">
            <label className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Catalog:
            </label>
            <select
              value={selectedCatalog}
              onChange={(e) => {
                setSelectedCatalog(e.target.value);
                // Update active file with new context when catalog changes
                if (activeFile) {
                  const env = AVAILABLE_ENVIRONMENTS.find(env => env.value === selectedEnvironment);
                  const schema = env?.schemas[0] || 'production';
                  const lines = activeFile.content.split('\n');
                  // Update or add context lines
                  if (lines[0]?.startsWith('-- Database Context:')) {
                    lines[0] = `-- Database Context: ${e.target.value}.${schema}`;
                    lines[1] = `-- use ${e.target.value}.${schema};`;
                    lines[2] = `-- Environment: ${selectedEnvironment}`;
                  } else {
                    lines.unshift(
                      `-- Database Context: ${e.target.value}.${schema}`,
                      `-- use ${e.target.value}.${schema};`,
                      `-- Environment: ${selectedEnvironment}`,
                      ''
                    );
                  }
                  const updatedContent = lines.join('\n');
                  setFiles(prev => prev.map(f => 
                    f.id === activeFile.id 
                      ? { ...f, content: updatedContent, lastModified: new Date() }
                      : f
                  ));
                }
              }}
              className={`px-2 py-1 text-xs rounded border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-gray-300'
                  : 'bg-white border-gray-300 text-gray-700'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {AVAILABLE_CATALOGS.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
            Ctrl+Enter to execute • Ctrl+I for AI assistant • Trino SQL
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Apply to Workflow button - only show in workflow mode */}
          {isWorkflowMode && (
            <button
              onClick={applyToWorkflow}
              disabled={!activeFile?.content.trim()}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${
                !activeFile?.content.trim()
                  ? theme === 'dark'
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : theme === 'dark'
                    ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                    : 'bg-purple-500 text-white hover:bg-purple-600 active:scale-95'
              }`}
              title="Apply this SQL to your workflow and return to the wizard"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply to Workflow
            </button>
          )}

          <button
            onClick={openSaveModal}
            disabled={!activeFile?.content.trim()}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${
              !activeFile?.content.trim()
                ? theme === 'dark'
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                  : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
            }`}
            title="Save to library for reuse in data products"
          >
            <Save className="w-4 h-4" />
            {activeFile?.savedToLibrary ? 'Saved' : 'Save to Library'}
          </button>

          <button
            onClick={executeQuery}
            disabled={isExecuting || !activeFile?.content.trim()}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${
              isExecuting || !activeFile?.content.trim()
                ? theme === 'dark'
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
            }`}
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isExecuting ? 'Executing...' : 'Run Query'}
          </button>

          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main content area with resizable panels */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left sidebar */}
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <div className={`h-full flex flex-col border-r ${
            theme === 'dark' ? 'bg-[#252525] border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            {/* Tabs */}
            <div className={`flex border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setLeftTab('files')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  leftTab === 'files'
                    ? theme === 'dark' 
                      ? 'text-blue-400 border-b-2 border-blue-400' 
                      : 'text-blue-600 border-b-2 border-blue-600'
                    : theme === 'dark' 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                SQL Files
              </button>
              <button
                onClick={() => setLeftTab('schemas')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  leftTab === 'schemas'
                    ? theme === 'dark' 
                      ? 'text-blue-400 border-b-2 border-blue-400' 
                      : 'text-blue-600 border-b-2 border-blue-600'
                    : theme === 'dark' 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Schemas
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">
              {leftTab === 'files' ? (
                <div className="p-2">
                  <button
                    onClick={addNewFile}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    New SQL File
                  </button>
                  <div className="mt-2 space-y-1">
                    {files.map(file => (
                      <div
                        key={file.id}
                        onClick={() => setActiveFileId(file.id)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                          activeFileId === file.id
                            ? theme === 'dark'
                              ? 'bg-gray-700 text-white'
                              : 'bg-blue-100 text-blue-900'
                            : theme === 'dark'
                              ? 'text-gray-400 hover:bg-gray-700'
                              : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="flex-1 truncate">{file.name}</span>
                        {files.length > 1 && (
                          <button
                            onClick={(e) => closeFile(file.id, e)}
                            className={`p-0.5 rounded hover:bg-gray-600 ${
                              theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
                            }`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  {MOCK_SCHEMA.map(db => renderSchemaNode(db))}
                </div>
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className={`w-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />

        {/* Main editor area */}
        <Panel defaultSize={80}>
          <PanelGroup direction="vertical">
            {/* Editor panel */}
            <Panel defaultSize={70} minSize={30}>
              <div className="h-full flex flex-col">
                {/* File tabs */}
                <div className={`flex items-center gap-1 px-2 py-1 border-b overflow-x-auto ${
                  theme === 'dark' ? 'bg-[#2a2a2a] border-gray-700' : 'bg-gray-100 border-gray-200'
                }`}>
                  {files.map(file => (
                    <div
                      key={file.id}
                      onClick={() => setActiveFileId(file.id)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-t cursor-pointer text-sm whitespace-nowrap ${
                        activeFileId === file.id
                          ? theme === 'dark'
                            ? 'bg-[#1e1e1e] text-white'
                            : 'bg-white text-gray-900'
                          : theme === 'dark'
                            ? 'bg-[#2d2d2d] text-gray-400 hover:text-gray-200'
                            : 'bg-gray-200 text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>{file.name}</span>
                      {files.length > 1 && (
                        <button
                          onClick={(e) => closeFile(file.id, e)}
                          className={`p-0.5 rounded hover:bg-gray-600 ${
                            theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addNewFile}
                    className={`p-1 rounded hover:bg-gray-700 ${
                      theme === 'dark' ? 'text-gray-500 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* SQL Editor */}
                <div className="flex-1 relative overflow-auto">
                  <EnhancedSQLEditor
                    doc={activeFile?.content || ''}
                    theme={theme}
                    selectedCatalog={selectedCatalog}
                    selectedEnvironment={selectedEnvironment}
                    activeFile={activeFile}
                    setShowAiStatus={setShowAiStatus}
                    setAiStatus={setAiStatus}
                    editorRef={editorRef}
                  />
                  
                  {/* AI Status Panel */}
                  {showAiStatus && (
                    <div className={`absolute top-4 right-4 w-80 rounded-lg shadow-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-blue-500" />
                            <span className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>AI Processing</span>
                          </div>
                          <button
                            onClick={() => setShowAiStatus(false)}
                            className={`p-1 rounded hover:bg-gray-700 ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Current Step */}
                          <div className="flex items-start gap-2">
                            {aiStatus.isProcessing ? (
                              <Loader2 className="w-4 h-4 mt-0.5 animate-spin text-blue-500" />
                            ) : aiStatus.currentStep.includes('complete') ? (
                              <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-500" />
                            )}
                            <div className="flex-1">
                              <div className={`text-sm ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {aiStatus.currentStep}
                              </div>
                              {aiStatus.confidence && (
                                <div className={`text-xs mt-1 ${
                                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  Confidence: {Math.round(aiStatus.confidence * 100)}%
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Active Agents */}
                          {aiStatus.agents.length > 0 && (
                            <div>
                              <div className={`text-xs font-medium mb-1 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                Active Agents:
                              </div>
                              <div className="space-y-1">
                                {aiStatus.agents.map((agent, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Users className="w-3 h-3 text-blue-400" />
                                    <span className={`text-xs ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>{agent}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Backend Info */}
                          <div className={`text-xs pt-2 border-t ${
                            theme === 'dark' ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
                          }`}>
                            Backend: {aiStatus.backend} • Env: {selectedEnvironment} • Catalog: {selectedCatalog}
                            {aiStatus.startTime && aiStatus.isProcessing && (
                              <span> • {Math.round((Date.now() - aiStatus.startTime) / 1000)}s</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className={`h-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />

            {/* Results panel */}
            <Panel defaultSize={30} minSize={20}>
              <div className={`h-full p-4 overflow-auto ${
                theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'
              }`}>
                <div className={`text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Query Results
                </div>
                
                {isExecuting && (
                  <div className="flex items-center gap-2 text-blue-500">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Executing query...
                  </div>
                )}
                
                {executionResult && !isExecuting && (
                  <pre className={`text-xs p-2 rounded ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-green-400' 
                      : 'bg-gray-100 text-green-700'
                  }`}>
                    {executionResult}
                  </pre>
                )}
                
                {!isExecuting && !executionResult && (
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    No results to display. Execute a query to see results here.
                  </div>
                )}
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      {/* Save to Library Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md rounded-lg p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Save to SQL Library
              </h2>
              <button
                onClick={() => setShowSaveModal(false)}
                className={`p-1 rounded hover:bg-gray-700 ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  File Name
                </label>
                <input
                  type="text"
                  value={saveFileName}
                  onChange={(e) => setSaveFileName(e.target.value)}
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="customer_analysis.sql"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Description
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Describe what this query does and how it should be used..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={saveTags}
                  onChange={(e) => setSaveTags(e.target.value)}
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="analytics, customer, aggregation"
                />
              </div>

              <div className={`p-3 rounded text-sm ${
                theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-800'
              }`}>
                <div className="flex items-start gap-2">
                  <FolderOpen className="w-4 h-4 mt-0.5" />
                  <div>
                    <div className="font-medium">Saved queries are reusable</div>
                    <div className="text-xs opacity-80 mt-1">
                      This SQL file will be available when building data products. Catalog: {selectedCatalog}, Environment: {selectedEnvironment}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className={`flex-1 px-4 py-2 rounded text-sm font-medium ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={saveToLibrary}
                className="flex-1 px-4 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700"
              >
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Save to Library
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onInsertSQL={handleInsertSQL}
        currentSQL={activeFile?.content || ''}
        selectedText={selectedText}
        catalog={selectedCatalog}
        schema={AVAILABLE_ENVIRONMENTS.find(e => e.value === selectedEnvironment)?.schemas[0] || 'production'}
        environment={selectedEnvironment}
      />

      {/* Floating AI Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
          title="Open AI Assistant (Ctrl+Shift+I)"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}