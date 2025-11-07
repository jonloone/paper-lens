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
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SegmentedControl } from '@/components/ui/segmented-control';

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
      {/* Unified Top Navigation Bar */}
      <div className="h-14 border-b border-border flex items-center px-4 bg-card/50 flex-shrink-0">
        {/* Left Section - Menu & Logo */}
        <div className="flex items-center gap-3 flex-1">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/')}>
                Home
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/connect')}>
                Connect
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/explore')}>
                <Badge variant="secondary" className="mr-2">Current</Badge>
                Explore
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/discover')}>
                Discover
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/operations')}>
                Operations
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* NexusOne Logo */}
          <svg
            width="180"
            height="31"
            viewBox="0 0 180 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-auto"
          >
            <path
              d="M15.3045 7.50396e-06L30.609 15.3045L15.3045 30.609L8.50266 23.8072L17.0053 15.3045L8.50266 6.80184L15.3045 7.50396e-06ZM22.1071 15.3045L13.6044 23.8072L15.3045 25.5073L25.5072 15.3045L15.3045 5.10176L13.6044 6.80184L22.1071 15.3045Z"
              className="fill-primary"
            />
            <path
              d="M13.7741 15.3045L6.88708 22.1916L4.5913 19.8958L9.18254 15.3045L4.5913 10.7133L6.88708 8.41751L13.7741 15.3045Z"
              className="fill-primary"
            />
            <path
              d="M3.06114 12.2434L6.12227 15.3045L3.06114 18.3656L1.53022 16.8347L3.06045 15.3045L1.53022 13.7743L3.06114 12.2434Z"
              className="fill-primary"
            />
            <path
              d="M58.7244 5.07193C57.2959 5.16933 56.257 5.59139 56.257 7.5718V26.3045H54.8609L41.972 8.5133V23.3177C41.972 25.363 43.2707 25.7851 45.2511 25.8825V26.3045H38.4333V25.85C39.8618 25.7526 40.9007 25.363 40.9007 23.3177V7.5718C40.9007 5.59139 39.9592 5.13687 37.9463 5.03947V4.61741H42.1668L55.1856 22.5385V7.5718C55.1856 5.59139 53.887 5.13687 51.9066 5.03947V4.61741H58.7244V5.07193ZM67.2294 9.61714C71.1577 9.61714 73.1706 13.2533 73.1706 17.1817H61.8076C61.905 21.8243 64.2101 24.8111 67.7164 24.8111C70.1188 24.8111 71.5798 23.4151 72.6836 22.0191L73.0407 22.1814C72.1966 24.7462 69.8591 26.7591 66.7749 26.7591C62.6192 26.7591 59.7623 23.0904 59.7623 18.6426C59.7623 12.9286 62.9439 9.61714 67.2294 9.61714ZM61.8401 16.2726H70.8331C70.6058 13.1234 69.5994 10.656 66.7099 10.656C63.5932 10.656 62.1323 13.026 61.8401 16.2726ZM83.4247 25.8825C85.6648 25.7526 85.7622 25.3306 84.8857 24.0319L81.5417 19.1296L77.7432 24.1943C77.0614 25.0708 77.4835 25.7851 79.4314 25.8825V26.3045H74.0746V25.8825C75.0161 25.6877 75.9251 25.2007 76.7692 24.0644L81.0222 18.3504L76.6069 11.8248C76.1848 11.1755 75.7628 10.6885 74.4966 10.4937V10.0717H81.0222V10.4937C78.8146 10.6236 78.6847 11.0456 79.5613 12.3443L82.5157 16.6947L85.8921 12.1819C86.5414 11.3054 86.1518 10.5911 84.2039 10.4937V10.0717H89.5607V10.4937C88.6192 10.6885 87.7102 11.1755 86.8661 12.3118L83.0351 17.4414L87.8725 24.5514C88.2946 25.1682 88.6517 25.7202 89.9503 25.8825V26.3045H83.4247V25.8825ZM94.6089 21.2723C94.6089 23.9995 96.0699 25.1033 98.0503 25.1033C99.771 25.1033 101.264 24.1943 102.855 22.2139V13.4481C102.855 12.117 102.401 11.3378 100.745 11.3703H100.453V10.9158L104.446 9.61714H104.901V22.9606C104.901 24.2592 105.355 25.0384 107.043 25.0384H107.271V25.4604L103.31 26.7591H102.855V23.0255C100.972 25.6228 99.219 26.7591 97.3036 26.7591C94.9011 26.7591 92.5636 25.0708 92.5636 21.4022V13.4481C92.5636 12.117 92.109 11.3378 90.4533 11.3703H90.1611V10.9158L94.1544 9.61714H94.6089V21.2723ZM114.907 26.7591C112.407 26.7591 110.037 25.5903 108.771 23.48L111.044 22.1489C111.693 24.3891 113.219 25.8175 115.134 25.8175C117.407 25.8175 118.835 24.2917 118.803 22.6684C118.771 21.1425 117.764 20.1036 116.303 19.4867L113.186 18.1881C111.206 17.344 109.42 16.3051 109.388 14.1299C109.355 11.4028 111.466 9.61714 114.712 9.61714C118.413 9.61714 119.972 11.3054 120.589 12.3118L118.413 13.6429C117.732 11.7923 116.433 10.5586 114.615 10.5586C112.505 10.5586 111.206 11.6949 111.206 13.3507C111.206 14.9091 112.407 15.6558 113.966 16.3051L117.212 17.6362C119.128 18.4154 120.556 19.5192 120.621 21.7918C120.686 24.5189 118.446 26.7591 114.907 26.7591ZM133.414 4.16289C140.037 4.16289 143.933 9.13015 143.933 15.0065C143.933 22.2139 138.965 26.7591 133.252 26.7591C126.596 26.7591 122.7 21.7918 122.7 15.9155C122.7 8.7081 127.667 4.16289 133.414 4.16289ZM125.265 15.5259C125.362 20.2659 127.732 25.7526 133.836 25.6552C139.095 25.5578 141.53 20.8178 141.368 15.3636C141.271 10.4612 138.738 5.16933 132.797 5.26673C127.538 5.36413 125.135 9.9418 125.265 15.5259ZM150.349 23.9345C150.349 25.3955 151.518 25.6877 152.752 25.8825V26.3045H145.901V25.8825C147.135 25.6877 148.304 25.3955 148.304 23.9345V13.4481C148.304 12.117 147.849 11.3378 146.193 11.3703H145.901V10.9158L149.895 9.61714H150.349V13.3507C152.232 10.7534 153.985 9.61714 155.901 9.61714C158.303 9.61714 160.641 11.3054 160.641 14.974V23.9345C160.641 25.3955 161.809 25.6877 163.043 25.8825V26.3045H156.193V25.8825C157.427 25.6877 158.595 25.3955 158.595 23.9345V15.1039C158.595 12.3767 157.134 11.2729 155.154 11.2729C153.433 11.2729 151.94 12.1819 150.349 14.1623V23.9345ZM171.855 9.61714C175.784 9.61714 177.797 13.2533 177.797 17.1817H166.434C166.531 21.8243 168.836 24.8111 172.342 24.8111C174.745 24.8111 176.206 23.4151 177.31 22.0191L177.667 22.1814C176.823 24.7462 174.485 26.7591 171.401 26.7591C167.245 26.7591 164.388 23.0904 164.388 18.6426C164.388 12.9286 167.57 9.61714 171.855 9.61714ZM166.466 16.2726H175.459C175.232 13.1234 174.225 10.656 171.336 10.656C168.219 10.656 166.758 13.026 166.466 16.2726Z"
              fill="currentColor" className="text-foreground"
            />
          </svg>
        </div>

      </div>

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
    </div>
  );
}
