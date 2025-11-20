'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Play,
  Loader2,
  Send,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Code,
  Table
} from 'lucide-react';
import { TiSQLArtifactChat } from '@/components/tisql/TiSQLArtifactChat';
import { DomainSelector } from '@/components/tisql/DomainSelector';
import { Domain } from '@/lib/data/tisql-domains';
import { SQLEditorView } from '@/components/build/workspace/SQLEditorView';
import { SmartResultsView } from '@/components/build/workspace/SmartResultsView';
import { EnhancedChartRenderer } from '@/components/explore/EnhancedChartRenderer';
import { useUserPhase } from '@/hooks/useUserPhase';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SegmentedControl } from '@/components/ui/segmented-control';
import TransformationRegistration from '@/components/build/TransformationRegistration';
import { generateContractFromQueryAsync, type ODCSContract } from '@/lib/services/query-productization';

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

// Demo domains for fallback/demo purposes
const DEMO_DOMAINS: Domain[] = [
  {
    id: 'all',
    name: 'All Domains',
    icon: 'Database',
    color: 'text-muted-foreground',
    description: 'Query across all available domains',
    schemas: ['lakehouse.*'],
    tableCount: 15,
    dataProductCount: 12,
    keyMetrics: ['All Metrics'],
    commonQueries: ['Show all data', 'List tables']
  },
  {
    id: 'customer',
    name: 'Customer',
    icon: 'Users',
    color: 'text-blue-500',
    description: 'Customer data and analytics',
    schemas: ['lakehouse.public.customers'],
    tableCount: 3,
    dataProductCount: 5,
    keyMetrics: ['Customer LTV', 'Churn Rate'],
    commonQueries: ['Show recent customers', 'Customer segmentation']
  },
  {
    id: 'sales',
    name: 'Sales',
    icon: 'DollarSign',
    color: 'text-green-500',
    description: 'Sales and revenue data',
    schemas: ['lakehouse.public.orders'],
    tableCount: 4,
    dataProductCount: 7,
    keyMetrics: ['Revenue', 'Order Volume'],
    commonQueries: ['Top products', 'Sales by region']
  }
];

// Available data sources for SQL editing
const AVAILABLE_SOURCES = [
  {
    id: 'customers',
    name: 'customers',
    schema: 'lakehouse.public',
    columns: [
      { name: 'id', type: 'bigint', description: 'Customer ID' },
      { name: 'name', type: 'varchar', description: 'Customer name' },
      { name: 'email', type: 'varchar', description: 'Customer email' },
      { name: 'created_at', type: 'timestamp', description: 'Account creation date' }
    ]
  },
  {
    id: 'orders',
    name: 'orders',
    schema: 'lakehouse.public',
    columns: [
      { name: 'id', type: 'bigint', description: 'Order ID' },
      { name: 'customer_id', type: 'bigint', description: 'Customer ID' },
      { name: 'total', type: 'decimal', description: 'Order total' },
      { name: 'order_date', type: 'timestamp', description: 'Order date' }
    ]
  },
  {
    id: 'products',
    name: 'products',
    schema: 'lakehouse.public',
    columns: [
      { name: 'id', type: 'bigint', description: 'Product ID' },
      { name: 'name', type: 'varchar', description: 'Product name' },
      { name: 'price', type: 'decimal', description: 'Product price' },
      { name: 'category', type: 'varchar', description: 'Product category' }
    ]
  }
];

export default function ExplorePage() {
  // TODO: Get actual user ID from auth context
  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
  const { onQueryRun } = useUserPhase(TEST_USER_ID);
  const router = useRouter();

  const [sql, setSql] = useState('-- Write your SQL query here\nSELECT * FROM lakehouse.public.customers LIMIT 100;');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [lastExecutionTime, setLastExecutionTime] = useState<number | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resultsPanelCollapsed, setResultsPanelCollapsed] = useState(false); // Always visible with tabs
  const [activeResultTab, setActiveResultTab] = useState<string>('results');
  const [useEnhancedViz, setUseEnhancedViz] = useState(true); // Use new AI-powered viz by default
  const resultsPanelRef = useRef<any>(null);

  // Productization state
  const [productizeDrawerOpen, setProductizeDrawerOpen] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<ODCSContract | null>(null);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);

  // Domain selection state
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [domains, setDomains] = useState<Domain[]>(DEMO_DOMAINS); // Start with demo domains
  const [domainsLoading, setDomainsLoading] = useState(false); // No need to wait for loading

  // Handle SQL generation from AI chat
  const handleSQLGenerated = useCallback((generatedSQL: string) => {
    console.log('[Explore] SQL generated from chat, length:', generatedSQL.length);
    console.log('[Explore] SQL preview:', generatedSQL.substring(0, 100));
    setSql(generatedSQL);
  }, []);

  // Handle query results from AI chat
  const handleQueryResults = useCallback((results: { columns: string[]; rows: any[][]; rowCount: number; executionTimeMs: number }) => {
    console.log('[Explore] Received query results from chat:', {
      columns: results.columns.length,
      rows: results.rows.length,
      rowCount: results.rowCount
    });

    setQueryResult({
      columns: results.columns,
      rows: results.rows,
      rowCount: results.rowCount,
      executionTime: results.executionTimeMs
    });

    // Switch to Results tab to show the data
    setActiveResultTab('results');
  }, []);

  // Execute SQL query
  const handleExecuteQuery = useCallback(async () => {
    if (!sql.trim() || isExecuting) return;

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      // Track query execution
      await onQueryRun();

      // Call preview-results endpoint (same one used by chat)
      const response = await fetch('/api/tisql/preview-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql,
          catalog: 'iceberg',
          schema: 'production',
          limit: 100
        }),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Query execution failed');
      }

      const executionTime = Date.now() - startTime;

      setQueryResult({
        columns: result.columns || [],
        rows: result.rows || [],
        rowCount: result.rowCount || 0,
        executionTime: result.executionTimeMs || executionTime,
      });

      setLastExecutionTime(result.executionTimeMs || executionTime);

      // Switch to Results tab when query succeeds
      console.log('[Explore] Query succeeded, switching to Results tab');
      setActiveResultTab('results');
    } catch (error) {
      console.error('Query execution failed:', error);
      alert(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  }, [sql, isExecuting, onQueryRun, resultsPanelCollapsed]);

  // Handle productization - Generate contract from query
  const handleProductize = useCallback(async () => {
    if (!sql || !queryResult) {
      console.error('[Explore] Cannot productize: missing SQL or query results');
      return;
    }

    console.log('[Explore] Starting productization...', {
      sql: sql.substring(0, 50) + '...',
      columns: queryResult.columns.length,
      rows: queryResult.rows.length
    });

    setIsGeneratingContract(true);

    try {
      // Generate contract from query using smart inference
      const contract = await generateContractFromQueryAsync({
        sql,
        queryResult: {
          columns: queryResult.columns,
          rows: queryResult.rows,
          rowCount: queryResult.rowCount,
          executionTime: queryResult.executionTime
        },
        domain: selectedDomain !== 'all' ? selectedDomain : undefined,
        chatContext: {
          userIntent: `Productize explore query with ${queryResult.rowCount} rows`,
          conversationHistory: []
        }
      });

      console.log('[Explore] Contract generated successfully:', contract);
      setGeneratedContract(contract);
      setProductizeDrawerOpen(true);
    } catch (error) {
      console.error('[Explore] Failed to generate contract:', error);
      alert(`Failed to generate contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingContract(false);
    }
  }, [sql, queryResult, selectedDomain]);

  // Handle successful deployment
  const handleDeploymentComplete = useCallback((artifacts: any) => {
    console.log('[Explore] Deployment complete!', artifacts);
    setProductizeDrawerOpen(false);

    // Show success message
    alert('🎉 Data product deployed successfully! Check /operations for monitoring.');
  }, []);

  // Fetch available domains on mount
  useEffect(() => {
    async function fetchDomains() {
      try {
        const response = await fetch('/api/tisql/domains');
        if (!response.ok) throw new Error('Failed to fetch domains');

        const data = await response.json();
        if (data.success && data.domains) {
          setDomains(data.domains);
        } else {
          // Fallback to demo domains if API fails
          setDomains(DEMO_DOMAINS);
        }
      } catch (error) {
        console.error('[Explore] Error fetching domains:', error);
        // Use demo domains for demonstration purposes
        setDomains(DEMO_DOMAINS);
      } finally {
        setDomainsLoading(false);
      }
    }

    fetchDomains();
  }, []);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Main Content - Panels */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Chat */}
          <Panel defaultSize={40} minSize={30} maxSize={60}>
            <div className="h-full flex flex-col p-4">
              {/* Chat Panel - Floating Card */}
              <div className="h-full bg-card border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
                {/* Chat Header with Title and Domain Selector - Inline */}
                <div className="border-b border-border bg-background/50 px-4 py-3 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Title */}
                    <h2 className="text-lg font-semibold text-foreground">
                      Explore
                    </h2>

                    {/* Domain Selector - Inline */}
                    {!domainsLoading && domains.length > 0 && (
                      <DomainSelector
                        selectedDomain={selectedDomain}
                        onDomainChange={setSelectedDomain}
                        domains={domains}
                        compact={true}
                        showIcon={false}
                        className="flex-1"
                      />
                    )}
                  </div>
                </div>

                {/* Chat Component */}
                <div className="flex-1 overflow-hidden">
                  <TiSQLArtifactChat
                  availableSources={AVAILABLE_SOURCES}
                  onSQLGenerated={handleSQLGenerated}
                  onQueryResults={handleQueryResults}
                  autoLoadPatterns={false}
                  showPatternsButton={true}
                  hideHeader={true}
                  chatOnly={true}
                  className="h-full"
                  initialDomain={selectedDomain}
                  activeViewMode={activeResultTab}
                  currentSQL={sql}
                  isEditorActive={activeResultTab === 'editor'}
                />
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle />

          {/* Right Panel - Results/Editor */}
          <Panel
            ref={resultsPanelRef}
            defaultSize={60}
            minSize={40}
            maxSize={70}
          >
            <div className="h-full flex flex-col p-4">
              {/* Results Panel - Floating Card */}
              <div className="h-full bg-card border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
                {/* Header with Segmented Control */}
                <div className="border-b border-border flex items-center px-4 py-3 gap-4 bg-background/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">View:</span>
                    <SegmentedControl
                      options={[
                        {
                          value: 'results',
                          label: 'Results',
                          icon: <BarChart3 className="w-4 h-4" />
                        },
                        {
                          value: 'editor',
                          label: 'Editor',
                          icon: <Code className="w-4 h-4" />
                        }
                      ]}
                      value={activeResultTab}
                      onChange={setActiveResultTab}
                    />
                    {queryResult && activeResultTab === 'results' && (
                      <Badge variant="secondary" className="text-xs">
                        {queryResult.rowCount.toLocaleString()} rows
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Results View */}
                {activeResultTab === 'results' && (
                  <div className="flex-1 overflow-auto">
                    {queryResult ? (
                      <SmartResultsView
                        result={{
                          data: queryResult.rows.map((row, idx) => {
                            const obj: any = { _rowId: idx };
                            queryResult.columns.forEach((col, colIdx) => {
                              obj[col] = row[colIdx];
                            });
                            return obj;
                          }),
                          columns: queryResult.columns.map(col => ({ name: col, type: 'string' })),
                          rowCount: queryResult.rowCount,
                          executionTime: queryResult.executionTime,
                        }}
                        sql={sql}
                        rawColumns={queryResult.columns}
                        rawRows={queryResult.rows}
                        dataSources={AVAILABLE_SOURCES.map(source => ({
                          name: source.name,
                          schema: source.schema,
                          columns: source.columns.map(c => c.name),
                          description: `${source.columns.length} columns available`
                        }))}
                        onExport={() => {
                          console.log('Export results');
                        }}
                        onProductize={handleProductize}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center space-y-2">
                          <Sparkles className="h-12 w-12 mx-auto opacity-20" />
                          <p className="text-sm">Ask a question or run a query to see results</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Editor View */}
                {activeResultTab === 'editor' && (
                  <div className="flex-1 overflow-hidden">
                    <SQLEditorView
                      sql={sql}
                      onSQLChange={setSql}
                      onExecute={handleExecuteQuery}
                      selectedSources={AVAILABLE_SOURCES}
                      isExecuting={isExecuting}
                      lastExecutionTime={lastExecutionTime}
                      hideToolbar={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Productization Drawer */}
      <Sheet open={productizeDrawerOpen} onOpenChange={setProductizeDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-5xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Productize Query</SheetTitle>
            <SheetDescription>
              Convert your explore query into a production data product with automated deployment
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {isGeneratingContract ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="text-center">
                    <div className="text-sm font-medium text-foreground">
                      Analyzing your query...
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Generating smart contract with quality rules
                    </div>
                  </div>
                </div>
              </div>
            ) : generatedContract ? (
              <TransformationRegistration
                contract={generatedContract}
                onComplete={handleDeploymentComplete}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Failed to generate contract. Please try again.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
