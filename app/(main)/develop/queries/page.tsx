'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Save, 
  History, 
  Database, 
  Zap, 
  ArrowLeft,
  Settings,
  FileText,
  BarChart3,
  Download,
  Share2,
  Eye,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  cost: number;
}

interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  executionTime: number;
  status: 'success' | 'failed' | 'running';
  rowCount?: number;
  cost?: number;
}

interface OptimizationSuggestion {
  type: 'performance' | 'cost' | 'readability';
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
  impact?: string;
}

export default function QueryDevelopmentPage() {
  const router = useRouter();
  const [query, setQuery] = useState(`-- Customer revenue analysis
SELECT 
    c.customer_id,
    c.customer_name,
    c.segment,
    SUM(o.order_total) as total_revenue,
    COUNT(o.order_id) as order_count,
    AVG(o.order_total) as avg_order_value,
    MAX(o.order_date) as last_order_date
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date >= '2024-01-01'
  AND o.status = 'completed'
GROUP BY c.customer_id, c.customer_name, c.segment
HAVING total_revenue > 1000
ORDER BY total_revenue DESC
LIMIT 100;`);

  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [activeTab, setActiveTab] = useState('results');

  // Mock data
  const queryHistory: QueryHistoryItem[] = [
    {
      id: 'q1',
      query: 'SELECT * FROM customers WHERE segment = "Premium" ORDER BY created_at DESC',
      timestamp: new Date(Date.now() - 300000), // 5 min ago
      executionTime: 1.2,
      status: 'success',
      rowCount: 1547,
      cost: 0.023
    },
    {
      id: 'q2', 
      query: 'SELECT customer_id, SUM(order_total) FROM orders GROUP BY customer_id',
      timestamp: new Date(Date.now() - 1800000), // 30 min ago
      executionTime: 4.8,
      status: 'success',
      rowCount: 45231,
      cost: 0.156
    },
    {
      id: 'q3',
      query: 'SELECT * FROM large_table WHERE unindexed_column LIKE "%search%"',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      executionTime: 0,
      status: 'failed',
      cost: 0
    }
  ];

  const optimizations: OptimizationSuggestion[] = [
    {
      type: 'performance',
      severity: 'medium',
      message: 'Missing partition filter detected',
      suggestion: 'Add WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY) to reduce scan',
      impact: '~80% faster execution'
    },
    {
      type: 'cost',
      severity: 'low', 
      message: 'Consider using approximate aggregation',
      suggestion: 'Use APPROX_COUNT_DISTINCT() instead of COUNT(DISTINCT) for large datasets',
      impact: '~40% cost reduction'
    },
    {
      type: 'readability',
      severity: 'low',
      message: 'Query could benefit from CTEs',
      suggestion: 'Break complex query into Common Table Expressions for better readability'
    }
  ];

  const mockResults: QueryResult = {
    columns: ['customer_id', 'customer_name', 'segment', 'total_revenue', 'order_count', 'avg_order_value', 'last_order_date'],
    rows: [
      ['CUST_001', 'Acme Corp', 'Enterprise', 45678.90, 12, 3806.58, '2024-03-15'],
      ['CUST_002', 'TechStart Inc', 'Business', 34221.45, 8, 4277.68, '2024-03-12'],
      ['CUST_003', 'Global Systems', 'Enterprise', 28956.23, 15, 1930.42, '2024-03-14'],
      ['CUST_004', 'Local Store', 'SMB', 15677.89, 25, 627.12, '2024-03-10'],
      ['CUST_005', 'Innovation Labs', 'Business', 12334.67, 6, 2055.78, '2024-03-13']
    ],
    rowCount: 847,
    executionTime: 2.34,
    cost: 0.087
  };

  const executeQuery = async () => {
    setIsExecuting(true);
    setActiveTab('results');
    
    // Simulate API call
    setTimeout(() => {
      setResults(mockResults);
      setIsExecuting(false);
    }, 2000);
  };

  const formatCost = (cost: number) => `$${cost.toFixed(3)}`;
  const formatTime = (seconds: number) => `${seconds.toFixed(2)}s`;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/develop')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Develop
            </Button>
            
            <div className="h-4 w-px bg-border" />
            
            <div>
              <h1 className="text-xl font-semibold">Query Development</h1>
              <p className="text-sm text-muted-foreground">SQL editor with MCP intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <History className="h-4 w-4" />
              History
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save Query
            </Button>
            <Button 
              size="sm" 
              className="gap-2"
              onClick={executeQuery}
              disabled={isExecuting}
            >
              <Play className="h-4 w-4" />
              {isExecuting ? 'Running...' : 'Run Query'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Query Editor - Top Half */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 border-b">
            <div className="h-full flex flex-col">
              {/* Editor Header */}
              <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-slate-300" />
                  <span className="text-sm font-medium text-slate-200">SQL Editor</span>
                  <Badge variant="secondary" className="text-xs">Trino</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    Connected
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-slate-300 hover:text-white">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Editor Content */}
              <div className="flex-1 p-4 bg-slate-900 text-slate-100 font-mono text-sm">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-full bg-transparent border-none outline-none resize-none"
                  placeholder="-- Write your SQL query here..."
                />
              </div>
              
              {/* Status Bar */}
              <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                <div>Line 1, Column 1 | SQL</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Est. Cost: $0.087
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Est. Time: ~2.3s
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    Syntax Valid
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel - Bottom Half */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger value="results" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Results
                  {results && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      {results.rowCount} rows
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="plan" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Execution Plan
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Query History
                </TabsTrigger>
                <TabsTrigger value="optimization" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Optimization
                  <Badge variant="outline" className="text-xs ml-1">
                    {optimizations.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="flex-1 p-4">
                {isExecuting ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Executing query...</p>
                    </div>
                  </div>
                ) : results ? (
                  <div className="space-y-4">
                    {/* Results Summary */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{results.rowCount} rows returned</span>
                        <span>•</span>
                        <span>{formatTime(results.executionTime)} execution</span>
                        <span>•</span>
                        <span>{formatCost(results.cost)} cost</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Download className="h-4 w-4" />
                          Export CSV
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Visualize
                        </Button>
                      </div>
                    </div>
                    
                    {/* Results Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              {results.columns.map((col) => (
                                <th key={col} className="px-4 py-3 text-left text-sm font-medium">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {results.rows.map((row, idx) => (
                              <tr key={idx} className="border-t">
                                {row.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="px-4 py-3 text-sm">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Run a query to see results</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="plan" className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Execution Plan</h3>
                    <Badge variant="outline" className="text-xs">Trino MCP</Badge>
                  </div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="p-3 bg-muted rounded">
                      1. → TableScan[customers] (est. 1.2M rows)
                    </div>
                    <div className="p-3 bg-muted rounded ml-4">
                      2. → Filter[segment = 'Premium'] (est. 450K rows)
                    </div>
                    <div className="p-3 bg-muted rounded ml-8">
                      3. → HashJoin[orders] (est. 2.1M rows)
                    </div>
                    <div className="p-3 bg-muted rounded ml-12">
                      4. → Aggregate[GROUP BY] (est. 847 rows)
                    </div>
                    <div className="p-3 bg-muted rounded ml-16">
                      5. → TopN[ORDER BY, LIMIT 100] (est. 100 rows)
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="flex-1 p-4">
                <div className="space-y-3">
                  {queryHistory.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {item.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {item.status === 'success' && (
                            <>
                              <span>{item.rowCount} rows</span>
                              <span>{formatTime(item.executionTime)}</span>
                              <span>{formatCost(item.cost!)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <pre className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                        {item.query}
                      </pre>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="optimization" className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">AI-Powered Optimization Suggestions</h3>
                    <Badge variant="outline" className="text-xs">MCP Intelligence</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {optimizations.map((opt, idx) => (
                      <Card key={idx} className={cn("border-l-4", getSeverityColor(opt.severity))}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {opt.type}
                                </Badge>
                                <Badge variant="outline" className={cn("text-xs capitalize", getSeverityColor(opt.severity))}>
                                  {opt.severity}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm">{opt.message}</p>
                              <p className="text-sm text-muted-foreground">{opt.suggestion}</p>
                              {opt.impact && (
                                <p className="text-xs text-green-600 font-medium">💡 {opt.impact}</p>
                              )}
                            </div>
                            <Button size="sm" variant="outline">
                              Apply
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}