'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Sparkles,
  Code,
  Eye,
  Play,
  Command,
  AtSign,
  Hash,
  X,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { useHotkeys } from 'react-hotkeys-hook';
import { cn } from '@/lib/utils';
import { dataCatalogService } from '@/lib/services/DataCatalogService';

interface UnifiedQueryBarProps {
  onQueryExecute: (query: QueryResult) => void;
  onProductCreate?: (product: any) => void;
  dataContext?: any;
  userPreferences?: any;
}

interface QueryResult {
  data: any[];
  schema: any;
  executionTime: number;
  rowCount: number;
  truncated: boolean;
  cost?: any;
  metadata: any;
  sql?: string;
  naturalLanguage?: string;
}

type QueryMode = 'natural' | 'sql' | 'visual' | 'hybrid';

export function UnifiedQueryBar({ 
  onQueryExecute, 
  onProductCreate,
  dataContext,
  userPreferences 
}: UnifiedQueryBarProps) {
  const [mode, setMode] = useState<QueryMode>('natural');
  const [query, setQuery] = useState('');
  const [sqlPreview, setSqlPreview] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [lastResults, setLastResults] = useState<QueryResult | null>(null);

  // Detect query mode based on input
  useEffect(() => {
    const detectMode = () => {
      const trimmed = query.trim().toLowerCase();
      
      // Command mode detection
      if (trimmed.startsWith('/')) {
        setMode('natural'); // Command palette
        return;
      }
      
      // Visual builder trigger
      if (trimmed.startsWith('@builder') || trimmed.startsWith('@visual')) {
        setMode('visual');
        return;
      }
      
      // Reference existing data products
      if (trimmed.startsWith('#')) {
        setMode('natural'); // Data product reference
        return;
      }
      
      // SQL mode detection
      const sqlKeywords = ['select', 'with', 'insert', 'update', 'delete', 'create', 'drop', 'alter'];
      if (sqlKeywords.some(keyword => trimmed.startsWith(keyword))) {
        setMode('sql');
        return;
      }
      
      // Default to natural language
      setMode('natural');
    };
    
    detectMode();
  }, [query]);

  // Generate SQL from natural language
  const generateSQL = useCallback(async (naturalLanguage: string) => {
    if (!naturalLanguage.trim() || mode !== 'natural') return;
    
    setIsGenerating(true);
    setConfidence(null);
    
    try {
      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Generate SQL query: ${naturalLanguage}`,
          context: {
            workspaceId: dataContext?.workspaceId || 'workspace-1',
            userId: dataContext?.userId || 'user-1',
            sessionId: `query-${Date.now()}`,
            queryMode: 'sql_generation'
          }
        })
      });
      
      const data = await response.json();
      
      // Extract SQL from agent response
      if (data.sql || data.generatedSQL) {
        const generatedSQL = data.sql || data.generatedSQL;
        setSqlPreview(format(generatedSQL, { language: 'sql' }));
        setConfidence(data.confidence || 0.85);
      } else if (data.conversationalResponse) {
        // Parse SQL from conversational response if present
        const sqlMatch = data.conversationalResponse.match(/```sql\n([\s\S]+?)\n```/);
        if (sqlMatch) {
          setSqlPreview(format(sqlMatch[1], { language: 'sql' }));
          setConfidence(0.75);
        }
      }
    } catch (error) {
      console.error('Failed to generate SQL:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [mode, dataContext]);

  // Debounced SQL generation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === 'natural' && query.length > 3) {
        generateSQL(query);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query, mode, generateSQL]);

  // Execute query
  const executeQuery = async () => {
    const sqlToExecute = mode === 'sql' ? query : sqlPreview;
    
    if (!sqlToExecute.trim()) return;
    
    setIsExecuting(true);
    
    try {
      // Mock execution - replace with actual API call
      const response = await fetch('/api/query/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: sqlToExecute,
          context: dataContext,
          estimateCost: true
        })
      });
      
      // For now, create mock results
      const mockResults: QueryResult = {
        data: [
          { customer_id: '1', email: 'john@example.com', churn_risk: 0.75, last_login: '2024-01-15' },
          { customer_id: '2', email: 'jane@example.com', churn_risk: 0.32, last_login: '2024-02-28' },
          { customer_id: '3', email: 'bob@example.com', churn_risk: 0.89, last_login: '2023-12-01' },
        ],
        schema: {
          columns: [
            { name: 'customer_id', type: 'STRING' },
            { name: 'email', type: 'STRING' },
            { name: 'churn_risk', type: 'FLOAT' },
            { name: 'last_login', type: 'DATE' }
          ]
        },
        executionTime: 234,
        rowCount: 3,
        truncated: false,
        cost: { estimated: '$0.02', actual: null },
        metadata: {
          query: sqlToExecute,
          timestamp: new Date().toISOString()
        },
        sql: sqlToExecute,
        naturalLanguage: mode === 'natural' ? query : undefined
      };
      
      setLastResults(mockResults);
      onQueryExecute(mockResults);
      
    } catch (error) {
      console.error('Query execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }
    
    // Get suggestions from DataCatalog
    const tables = dataCatalogService.searchTables(input);
    const businessContext = dataCatalogService.getBusinessContext();
    
    const allSuggestions = [
      // Table suggestions
      ...tables.map(table => ({
        type: 'table',
        value: table.fullName,
        description: table.description,
        icon: '📊'
      })),
      // Common analyses
      ...businessContext.commonAnalyses
        .filter(a => a.toLowerCase().includes(input.toLowerCase()))
        .map(analysis => ({
          type: 'analysis',
          value: analysis,
          description: 'Common analysis pattern',
          icon: '📈'
        })),
      // Recent queries (mock)
      {
        type: 'recent',
        value: 'Customer churn analysis last 90 days',
        description: 'Run 2 hours ago',
        icon: '🕐'
      }
    ].slice(0, 5);
    
    setSuggestions(allSuggestions);
    setShowSuggestions(allSuggestions.length > 0);
  }, []);

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);
    fetchSuggestions(value);
  };

  // Keyboard shortcuts
  useHotkeys('cmd+enter, ctrl+enter', () => executeQuery(), [sqlPreview, query]);
  useHotkeys('cmd+k, ctrl+k', () => setIsExpanded(!isExpanded), [isExpanded]);
  useHotkeys('escape', () => setShowSuggestions(false), []);

  // Get mode icon
  const getModeIcon = () => {
    switch (mode) {
      case 'sql': return <Code className="h-4 w-4" />;
      case 'visual': return <Eye className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  // Get mode badge color
  const getModeBadgeColor = () => {
    switch (mode) {
      case 'sql': return 'bg-blue-500/10 text-blue-400 border-blue-400/30';
      case 'visual': return 'bg-purple-500/10 text-purple-400 border-purple-400/30';
      default: return 'bg-green-500/10 text-green-400 border-green-400/30';
    }
  };

  return (
    <Card className={cn(
      "relative transition-all duration-300 border-border bg-card/50 backdrop-blur-sm",
      isExpanded ? "h-[400px]" : "h-[48px]"
    )}>
      <div className="flex items-center h-[48px] px-4 gap-2">
        {/* Mode indicator */}
        <Badge variant="outline" className={cn("gap-1", getModeBadgeColor())}>
          {getModeIcon()}
          <span className="text-xs capitalize">{mode}</span>
        </Badge>

        {/* Main input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={mode === 'sql' 
              ? "Write SQL query..." 
              : "Ask a question about your data..."
            }
            className="w-full h-8 px-3 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
            onFocus={() => setIsExpanded(true)}
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 py-1">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(suggestion.value);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                >
                  <span>{suggestion.icon}</span>
                  <div className="flex-1">
                    <div className="text-foreground">{suggestion.value}</div>
                    <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Confidence indicator */}
          {confidence !== null && mode === 'natural' && (
            <Badge variant="outline" className="text-xs">
              {Math.round(confidence * 100)}% confidence
            </Badge>
          )}

          {/* Loading indicators */}
          {isGenerating && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Generating...</span>
            </div>
          )}

          {/* Execute button */}
          <Button
            size="sm"
            onClick={executeQuery}
            disabled={isExecuting || (!query.trim() && !sqlPreview.trim())}
            className="gap-1"
          >
            {isExecuting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            Run
          </Button>

          {/* Expand/Collapse */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="flex h-[calc(100%-48px)] border-t border-border">
          {/* SQL Preview/Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground">
                {mode === 'sql' ? 'SQL Editor' : 'Generated SQL'}
              </span>
              {mode === 'natural' && sqlPreview && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setQuery(sqlPreview);
                    setMode('sql');
                  }}
                  className="text-xs h-6"
                >
                  Edit SQL
                </Button>
              )}
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language="sql"
                theme="vs-dark"
                value={mode === 'sql' ? query : sqlPreview}
                onChange={(value) => {
                  if (mode === 'sql') {
                    setQuery(value || '');
                  }
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'off',
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  renderLineHighlight: 'none',
                  scrollBeyondLastLine: false,
                  readOnly: mode === 'natural',
                  wordWrap: 'on'
                }}
              />
            </div>
          </div>

          {/* Visual Builder (placeholder) */}
          {mode === 'visual' && (
            <div className="flex-1 flex items-center justify-center border-l border-border">
              <div className="text-center">
                <AtSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Visual Query Builder</p>
                <p className="text-xs text-muted-foreground mt-1">Coming soon...</p>
              </div>
            </div>
          )}

          {/* Command Palette (placeholder) */}
          {query.startsWith('/') && (
            <div className="absolute top-[48px] left-4 right-4 bg-card border border-border rounded-md shadow-lg p-4 z-50">
              <div className="flex items-center gap-2 mb-2">
                <Command className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Commands</span>
              </div>
              <div className="space-y-1">
                <button className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded">
                  /tables - Show available tables
                </button>
                <button className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded">
                  /recent - Recent queries
                </button>
                <button className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded">
                  /products - Browse data products
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}