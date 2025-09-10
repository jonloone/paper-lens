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
import { dataHubService, type DataHubContext, type BusinessRule } from '@/lib/services/DataHubContextService';
import { RulesPanel } from './RulesPanel';

interface UnifiedQueryBarProps {
  onQueryExecute: (query: QueryResult) => void;
  onProductCreate: (product: DataProduct) => void;
  dataContext?: any;
  userPreferences?: any;
  dataHubContext?: DataHubContext;
}

interface DataProduct {
  id: string;
  name: string;
  description: string;
  icebergTables: string[];
  trinoQuery: string;
  governance: {
    piiMasking: boolean;
    accessLevel: 'public' | 'restricted' | 'confidential';
    dataClassification: string[];
  };
  consumers: {
    type: 'dashboard' | 'ml-model' | 'api' | 'export';
    name: string;
    endpoint?: string;
  }[];
  refreshSchedule?: string;
  owner: string;
  businessContext: string;
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

type QueryMode = 'intent' | 'product' | 'discovery';

export function UnifiedQueryBar({ 
  onQueryExecute, 
  onProductCreate,
  dataContext,
  userPreferences,
  dataHubContext: providedContext
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
  
  // DataHub integration
  const [showRules, setShowRules] = useState(false);
  const [dataHubContext, setDataHubContext] = useState<DataHubContext>(providedContext || {
    hasContext: false,
    piiFields: [],
    qualityScore: 100,
    glossaryTerms: [],
    businessDefinitions: {},
    tags: [],
    availableRules: [],
    qualityRules: []
  });
  const [appliedRules, setAppliedRules] = useState<BusinessRule[]>([]);
  
  // Fetch DataHub context when a table is detected
  useEffect(() => {
    const fetchDataHubContext = async () => {
      // Detect table names in query (simple regex for demo)
      const tablePattern = /FROM\s+(\w+\.?\w+)|JOIN\s+(\w+\.?\w+)/gi;
      const matches = query.matchAll(tablePattern);
      
      for (const match of matches) {
        const tableName = match[1] || match[2];
        if (tableName) {
          // Fetch DataHub context for this table
          const context = await dataHubService.getTableContext('public', tableName);
          if (context.hasContext) {
            setDataHubContext(context);
            break; // Use first table's context for now
          }
        }
      }
    };
    
    if (query.length > 10 && (mode === 'sql' || sqlPreview)) {
      fetchDataHubContext();
    }
  }, [query, sqlPreview, mode]);

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
          intent,
          discoveredTables: tables,
          icebergMetadata: metadata,
          mode: 'data_product_creation',
          context: dataCatalogService.getAgentContextSummary(),
          dataHubContext,
          userPreferences
        })
      });
      
      const result = await response.json();
      
      // Create data product preview
      const dataProduct: DataProduct = {
        id: `dp-${Date.now()}`,
        name: result.productName || `${intent} Data Product`,
        description: result.description || `Data product for: ${intent}`,
        icebergTables: tables.map((t: any) => t.fullName),
        trinoQuery: format(result.trinoQuery || result.sql, {
          language: 'trino',
          tabWidth: 2,
          keywordCase: 'upper'
        }),
        governance: {
          piiMasking: result.governance?.piiRequired || false,
          accessLevel: result.governance?.accessLevel || 'public',
          dataClassification: result.governance?.classifications || []
        },
        consumers: result.suggestedConsumers || [],
        refreshSchedule: result.refreshSchedule,
        owner: 'data-team',
        businessContext: intent
      };
      
      setProductPreview(dataProduct);
      setSqlPreview(dataProduct.trinoQuery);
      setTrinoHandoffReady(true);
      setConfidence(result.confidence || 0.8);
      setIsExpanded(true);
    } catch (error) {
      console.error('Failed to generate data product:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [mode, dataCatalogService, dataHubContext, userPreferences]);

  // Debounced data product generation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === 'intent' && query.length > 3) {
        generateDataProduct(query);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query, mode, generateDataProduct]);

  // Execute query or create data product
  const executeQuery = async () => {
    if (productPreview) {
      // Create data product
      onProductCreate(productPreview);
      return;
    }
    
    const sqlToExecute = sqlPreview || query;
    
    if (!sqlToExecute.trim()) return;
    
    setIsExecuting(true);
    
    try {
      // Preview execution via Trino (mock for now)
      const response = await fetch('/api/trino/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trinoQuery: sqlToExecute,
          icebergTables: discoveredTables.map(t => t.fullName),
          governanceRules: appliedRules,
          context: dataContext
        })
      });
      
      // For now, create mock results with preview metadata
      const mockResults: QueryResult = {
        data: [
          { customer_id: '1', email: 'john@example.com', churn_risk: 0.75, last_login: '2024-01-15' },
          { customer_id: '2', email: 'jane@example.com', churn_risk: 0.32, last_login: '2024-02-28' },
          { customer_id: '3', email: 'bob@example.com', churn_risk: 0.89, last_login: '2023-12-01' },
          { customer_id: '4', email: 'alice@example.com', churn_risk: 0.45, last_login: '2024-03-10' },
          { customer_id: '5', email: 'charlie@example.com', churn_risk: 0.61, last_login: '2024-02-20' },
        ],
        schema: {
          columns: [
            { name: 'customer_id', type: 'STRING', isPII: false },
            { name: 'email', type: 'STRING', isPII: true, piiType: 'EMAIL' },
            { name: 'churn_risk', type: 'FLOAT', isPII: false },
            { name: 'last_login', type: 'DATE', isPII: false }
          ]
        },
        executionTime: 234,
        rowCount: 5,
        truncated: false,
        cost: { estimated: '$0.02', actual: null },
        metadata: {
          query: sqlToExecute,
          timestamp: new Date().toISOString()
        },
        sql: sqlToExecute,
        naturalLanguage: mode === 'intent' ? query : undefined,
        dataProduct: productPreview,
        // Preview mode metadata
        samplingRate: 0.1, // 10% sample
        estimatedCost: 4.25, // Full query cost estimate
        estimatedSize: 2147483648, // 2GB estimated full size
        governanceRecommendations: [
          {
            type: 'pii_detected',
            severity: 'medium',
            message: 'PII detected in email column. Consider applying data masking.',
            columns: ['email']
          },
          {
            type: 'cost_warning',
            severity: 'low',
            message: 'Full query estimated at $4.25. Consider adding filters to reduce cost.',
          }
        ]
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
    <>
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
            placeholder={
              mode === 'discovery' ? "Explore available data: /discover customers, /tables iceberg" :
              mode === 'product' ? "Create data product: customer churn analysis" :
              "What data product do you need? e.g. customer churn analysis"
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
          {/* Data Product Status */}
          {productPreview && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Hash className="h-3 w-3" />
              {discoveredTables.length} tables
            </Badge>
          )}
          
          {/* Trino Handoff Button */}
          {trinoHandoffReady && (
            <Button
              size="sm"
              variant="default"
              onClick={() => window.open('https://trino.company.com:8080', '_blank')}
              className="gap-1"
            >
              <Code className="h-3 w-3" />
              Open in Trino
            </Button>
          )}
          
          {/* Governance Status */}
          <Button
            size="sm"
            variant={appliedRules.length > 0 ? "default" : "outline"}
            onClick={() => setShowRules(!showRules)}
            className="gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Governance
            {appliedRules.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {appliedRules.length}
              </Badge>
            )}
          </Button>
          
          {/* Confidence indicator */}
          {confidence !== null && mode === 'intent' && (
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
            {productPreview ? 'Create Product' : 'Preview'}
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
                  /trino - Open Trino interface
                </button>
                <button className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded">
                  /airflow - View ETL pipelines
                </button>
                <button className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded">
                  /datahub - Browse metadata catalog
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </Card>

      {/* DataHub Context Display */}
      {dataHubContext.hasContext && (
        <div className="mt-2 flex flex-wrap gap-2">
          {dataHubContext.piiFields.length > 0 && (
            <Badge variant="outline" className="text-xs bg-red-50 border-red-200">
              🔒 {dataHubContext.piiFields.length} PII fields detected
            </Badge>
          )}
          {dataHubContext.qualityScore < 80 && (
            <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200">
              ⚠️ Quality Score: {dataHubContext.qualityScore}%
            </Badge>
          )}
          {dataHubContext.classification && (
            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
              📊 {dataHubContext.classification}
            </Badge>
          )}
          {dataHubContext.domain && (
            <Badge variant="outline" className="text-xs">
              Domain: {dataHubContext.domain}
            </Badge>
          )}
        </div>
      )}
      
      {/* Rules Panel Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative max-w-4xl w-full max-h-[80vh] overflow-auto">
            <RulesPanel
              dataHubContext={dataHubContext}
              onApplyRules={(rules) => {
                setAppliedRules(rules);
                setShowRules(false);
                // TODO: Apply rules to query
              }}
              onClose={() => setShowRules(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}