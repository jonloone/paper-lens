'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Panel, 
  PanelGroup, 
  PanelResizeHandle 
} from 'react-resizable-panels';
import { ChevronRight, ChevronDown, Database, Table, Columns, X, Plus, FileText, Search, Moon, Sun, Play, Bot, Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import '@/styles/workstation.css';
import { NexusOneLogo } from '@/components/ui/logo';

interface SQLFile {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
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
  
  
  return `-- Database Context: ${catalog}.${schema}
-- use ${catalog}.${schema};
-- Environment: ${environment.toUpperCase()}
-- Catalog: ${catalog} | Schema: ${schema}
-- ===========================================
-- Welcome to NexusOne Trino Editor
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
    const { aiWidget } = await import('@tidbcloud/codemirror-extension-ai-widget');
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
          aiWidget({
            // Provide database context to bypass "use{db}" requirement
            getDbNameFromDoc: () => {
              const env = AVAILABLE_ENVIRONMENTS.find(e => e.value === selectedEnvironment);
              const defaultSchema = env?.schemas[0] || 'production';
              return `${selectedCatalog}.${defaultSchema}`;
            },
            getCurrentDb: () => selectedCatalog,
            // Return empty array to disable auto-add use statement feature
            getDbList: () => [],
            chat: async (view, chatId, req) => {
              try {
                // Show AI status panel
                setShowAiStatus(true);
                setAiStatus({
                  isProcessing: true,
                  currentStep: 'Analyzing your request...',
                  agents: [],
                  backend: 'CrewAI',
                  startTime: Date.now()
                });

                // Simulate status updates
                setTimeout(() => {
                  setAiStatus(prev => ({
                    ...prev,
                    currentStep: 'Routing to CrewAI multi-agent system...',
                    agents: ['SQL Generation Specialist']
                  }));
                }, 500);

                setTimeout(() => {
                  setAiStatus(prev => ({
                    ...prev,
                    currentStep: 'Optimizing query performance...',
                    agents: [...prev.agents, 'Performance Tuning Expert']
                  }));
                }, 1000);

                setTimeout(() => {
                  setAiStatus(prev => ({
                    ...prev,
                    currentStep: 'Analyzing cost and recommendations...',
                    agents: [...prev.agents, 'Cost Estimation Analyst']
                  }));
                }, 1500);

                // Inject database context into the prompt if not already present
                const env = AVAILABLE_ENVIRONMENTS.find(e => e.value === selectedEnvironment);
                const defaultSchema = env?.schemas[0] || 'production';
                const dbContext = `${selectedCatalog}.${defaultSchema}`;
                
                // Enhance prompt with context
                const enhancedPrompt = req.prompt.toLowerCase().includes('use ') 
                  ? req.prompt 
                  : `Using database ${dbContext}: ${req.prompt}`;
                
                const response = await fetch('/api/tisql-ai', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    prompt: enhancedPrompt,
                    refContent: req.refContent || `-- Current database: ${dbContext}`,
                    databases: env?.schemas || ['production', 'analytics'],
                    catalog: selectedCatalog,
                    environment: selectedEnvironment
                  })
                });

                const data = await response.json();
                
                // Update status with completion
                setAiStatus(prev => ({
                  ...prev,
                  isProcessing: false,
                  currentStep: 'SQL generation complete!',
                  confidence: data.extra?.confidence || 0.9,
                  agents: [...prev.agents, 'Documentation Specialist']
                }));

                // Hide status after a delay
                setTimeout(() => {
                  setShowAiStatus(false);
                }, 3000);

                return {
                  status: data.status as 'success' | 'error',
                  message: data.message,
                  extra: data.extra
                };
              } catch (error) {
                console.error('AI Chat Error:', error);
                
                setAiStatus({
                  isProcessing: false,
                  currentStep: 'Error occurred - using fallback generator',
                  agents: [],
                  backend: 'Fallback',
                  startTime: undefined
                });
                
                setTimeout(() => {
                  setShowAiStatus(false);
                }, 3000);
                
                return {
                  status: 'error',
                  message: `-- Error: Unable to generate SQL\n-- ${error instanceof Error ? error.message : 'Network error'}`
                };
              }
            },
            cancelChat: (chatId) => {
              console.log('Cancelling chat:', chatId);
            },
            promptInputPlaceholderNormal: 'Ask AI to generate SQL (Ctrl+I)...',
            promptInputTipsNormal: 'Describe what data you need',
            tooltipHintElement: 'AI SQL Assistant - Powered by CrewAI Multi-Agent System'
          }),
          saveHelper({
            save: (view) => {
              console.log('Saving file:', activeFile?.name);
            }
          })
        ];
        return exts;
      }, [activeFile, selectedCatalog, selectedEnvironment, setShowAiStatus, setAiStatus]);

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

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

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
    </div>
  );
}