'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  Search,
  Plus,
  Play,
  Clock,
  AlertCircle,
  Grid3x3,
  List,
  Star,
  Copy,
  Edit,
  Archive,
  Package,
  Zap,
  Activity
} from 'lucide-react';

// Simplified SavedQuery interface
interface SavedQuery {
  id: string;
  name: string;
  description: string;
  sql: string;
  catalog: string;
  schema: string;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  starred: boolean;
  status: 'active' | 'archived';
  executionCount: number;
  avgExecutionTime: number; // in ms
  usedInPipelines: string[];
}

type ViewMode = 'grid' | 'list';

export default function QueryWorkbenchPage() {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [playgroundWindow, setPlaygroundWindow] = useState<Window | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [sortBy, setSortBy] = useState('updated');

  // Load realistic mock data
  useEffect(() => {
    const mockQueries: SavedQuery[] = [
      {
        id: '1',
        name: 'Customer Revenue Analysis',
        description: 'Monthly revenue breakdown by customer segment',
        sql: 'SELECT customer_segment, DATE_TRUNC(\'month\', order_date) as month, SUM(revenue) as total_revenue FROM sales.orders GROUP BY customer_segment, month ORDER BY month DESC',
        catalog: 'warehouse',
        schema: 'sales',
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date('2024-09-20'),
        tags: ['revenue', 'customer', 'monthly'],
        author: 'john.doe',
        starred: true,
        status: 'active',
        executionCount: 342,
        avgExecutionTime: 1200,
        usedInPipelines: ['daily-revenue-etl', 'customer-360']
      },
      {
        id: '2',
        name: 'Product Performance',
        description: 'Top selling products by quantity and revenue',
        sql: 'WITH product_sales AS (SELECT product_id, product_name, COUNT(*) as units_sold, SUM(sale_amount) as revenue FROM sales.transactions GROUP BY product_id, product_name) SELECT * FROM product_sales ORDER BY revenue DESC LIMIT 100',
        catalog: 'warehouse',
        schema: 'sales',
        createdAt: new Date('2024-09-05'),
        updatedAt: new Date('2024-09-18'),
        tags: ['product', 'sales'],
        author: 'jane.smith',
        starred: false,
        status: 'active',
        executionCount: 156,
        avgExecutionTime: 2500,
        usedInPipelines: ['product-analytics']
      },
      {
        id: '3',
        name: 'User Activity Metrics',
        description: 'Daily active users and engagement metrics',
        sql: 'SELECT DATE(event_time) as day, COUNT(DISTINCT user_id) as daily_active_users, COUNT(*) as total_events FROM events.user_activity WHERE event_time >= CURRENT_DATE - INTERVAL \'30 days\' GROUP BY DATE(event_time)',
        catalog: 'analytics',
        schema: 'events',
        createdAt: new Date('2024-08-20'),
        updatedAt: new Date('2024-09-10'),
        tags: ['user', 'engagement', 'daily'],
        author: 'alice.wong',
        starred: true,
        status: 'active',
        executionCount: 890,
        avgExecutionTime: 450,
        usedInPipelines: ['user-metrics-daily', 'executive-dashboard', 'retention-analysis']
      },
      {
        id: '4',
        name: 'Inventory Levels',
        description: 'Current inventory levels by warehouse',
        sql: 'SELECT warehouse_id, sku, quantity_on_hand, reorder_point FROM inventory.stock_levels WHERE quantity_on_hand < reorder_point * 1.5',
        catalog: 'operations',
        schema: 'inventory',
        createdAt: new Date('2024-07-15'),
        updatedAt: new Date('2024-08-30'),
        tags: ['inventory', 'warehouse'],
        author: 'bob.chen',
        starred: false,
        status: 'archived',
        executionCount: 45,
        avgExecutionTime: 8000,
        usedInPipelines: []
      },
      {
        id: '5',
        name: 'Order Fulfillment Time',
        description: 'Average time from order to delivery by region',
        sql: 'SELECT shipping_region, AVG(EXTRACT(EPOCH FROM (delivered_at - ordered_at))/3600) as avg_hours_to_deliver, COUNT(*) as order_count FROM orders.fulfillment WHERE delivered_at IS NOT NULL GROUP BY shipping_region',
        catalog: 'operations',
        schema: 'orders',
        createdAt: new Date('2024-09-19'),
        updatedAt: new Date('2024-09-21'),
        tags: ['fulfillment', 'shipping', 'kpi'],
        author: 'ops.team',
        starred: false,
        status: 'active',
        executionCount: 78,
        avgExecutionTime: 1800,
        usedInPipelines: ['ops-dashboard', 'fulfillment-sla']
      },
      {
        id: '6',
        name: 'Marketing Campaign ROI',
        description: 'Return on investment for marketing campaigns',
        sql: 'SELECT campaign_id, campaign_name, SUM(attributed_revenue) as revenue, SUM(campaign_cost) as cost, (SUM(attributed_revenue) - SUM(campaign_cost)) / NULLIF(SUM(campaign_cost), 0) as roi FROM marketing.campaigns GROUP BY campaign_id, campaign_name',
        catalog: 'marketing',
        schema: 'campaigns',
        createdAt: new Date('2024-09-15'),
        updatedAt: new Date('2024-09-20'),
        tags: ['marketing', 'roi', 'campaign'],
        author: 'marketing.analytics',
        starred: true,
        status: 'active',
        executionCount: 234,
        avgExecutionTime: 3200,
        usedInPipelines: ['marketing-performance', 'weekly-exec-report']
      }
    ];
    setSavedQueries(mockQueries);
  }, []);

  // Filter and sort queries
  const filteredQueries = useMemo(() => {
    let filtered = savedQueries.filter(query => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matches = 
          query.name.toLowerCase().includes(search) ||
          query.description.toLowerCase().includes(search) ||
          query.tags.some(tag => tag.toLowerCase().includes(search)) ||
          query.author.toLowerCase().includes(search);
        if (!matches) return false;
      }

      if (statusFilter !== 'all' && query.status !== statusFilter) {
        return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.executionCount - a.executionCount;
        case 'performance':
          return a.avgExecutionTime - b.avgExecutionTime;
        case 'updated':
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });

    return filtered;
  }, [savedQueries, searchTerm, statusFilter, sortBy]);

  // Launch playground
  const launchPlayground = (query?: SavedQuery) => {
    const params = new URLSearchParams();
    params.set('from', 'workbench');
    if (query) {
      params.set('query', encodeURIComponent(query.sql));
      params.set('catalog', query.catalog);
      params.set('schema', query.schema);
      params.set('queryId', query.id);
    }

    const playground = window.open(
      `/playground?${params.toString()}`,
      'tisql-playground',
      'width=1400,height=900,menubar=no,toolbar=no,location=no,status=no'
    );

    if (playground) {
      setPlaygroundWindow(playground);
    }
  };

  // Get performance indicator
  const getPerformanceIndicator = (time: number) => {
    if (time < 1000) return { color: 'text-green-600', icon: Zap, label: 'Fast' };
    if (time < 3000) return { color: 'text-yellow-600', icon: Activity, label: 'Normal' };
    return { color: 'text-red-600', icon: AlertCircle, label: 'Slow' };
  };

  // Pipeline usage data for the second tab
  const pipelineUsage = useMemo(() => {
    const pipelineMap = new Map<string, SavedQuery[]>();
    
    savedQueries.forEach(query => {
      query.usedInPipelines.forEach(pipeline => {
        if (!pipelineMap.has(pipeline)) {
          pipelineMap.set(pipeline, []);
        }
        pipelineMap.get(pipeline)!.push(query);
      });
    });

    return Array.from(pipelineMap.entries()).map(([pipeline, queries]) => ({
      pipeline,
      queries,
      queryCount: queries.length
    }));
  }, [savedQueries]);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Simplified Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Query Workbench</h1>
        
        <Button
          size="lg"
          onClick={() => launchPlayground()}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          New Query
        </Button>
      </div>

      {/* Main Tabs - Reduced to 2 */}
      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Query Library</TabsTrigger>
          <TabsTrigger value="pipelines">Pipeline Usage</TabsTrigger>
        </TabsList>

        {/* Query Library Tab */}
        <TabsContent value="library" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search queries by name, description, tags, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="usage">Most Used</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1 border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {filteredQueries.length} {filteredQueries.length === 1 ? 'query' : 'queries'} found
          </div>

          {/* Query Cards/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-4">
              {filteredQueries.map(query => {
                const perfIndicator = getPerformanceIndicator(query.avgExecutionTime);
                const PerfIcon = perfIndicator.icon;
                
                return (
                  <Card key={query.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg truncate">{query.name}</CardTitle>
                            {query.starred && <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />}
                          </div>
                          <CardDescription className="mt-1 line-clamp-2">
                            {query.description}
                          </CardDescription>
                        </div>
                        {query.status === 'archived' && (
                          <Badge variant="secondary" className="ml-2">
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* Simple Metrics */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Play className="h-3 w-3 text-muted-foreground" />
                          <span>{query.executionCount} runs</span>
                        </div>
                        <div className={`flex items-center gap-1 ${perfIndicator.color}`}>
                          <PerfIcon className="h-3 w-3" />
                          <span>{query.avgExecutionTime}ms</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {query.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {query.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {query.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{query.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Pipeline Usage */}
                      {query.usedInPipelines.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>Used in {query.usedInPipelines.length} pipeline{query.usedInPipelines.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
                        <span>{query.catalog}.{query.schema}</span>
                        <span>•</span>
                        <span>{query.author}</span>
                        <span>•</span>
                        <span>{new Date(query.updatedAt).toLocaleDateString()}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => launchPlayground(query)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(query.sql)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQueries.map(query => {
                const perfIndicator = getPerformanceIndicator(query.avgExecutionTime);
                const PerfIcon = perfIndicator.icon;
                
                return (
                  <Card key={query.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{query.name}</h3>
                              {query.starred && <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />}
                              {query.status === 'archived' && (
                                <Badge variant="secondary">
                                  <Archive className="h-3 w-3 mr-1" />
                                  Archived
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {query.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                {query.catalog}.{query.schema}
                              </span>
                              <span>{query.author}</span>
                              <span>{new Date(query.updatedAt).toLocaleDateString()}</span>
                              {query.usedInPipelines.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {query.usedInPipelines.length} pipeline{query.usedInPipelines.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <p className="font-medium">{query.executionCount}</p>
                              <p className="text-xs text-muted-foreground">Runs</p>
                            </div>
                            <div className={`text-center ${perfIndicator.color}`}>
                              <p className="font-medium flex items-center gap-1">
                                <PerfIcon className="h-3 w-3" />
                                {query.avgExecutionTime}ms
                              </p>
                              <p className="text-xs text-muted-foreground">{perfIndicator.label}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => launchPlayground(query)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(query.sql)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredQueries.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No queries found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Create your first query to get started'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pipeline Usage Tab */}
        <TabsContent value="pipelines" className="space-y-4">
          {pipelineUsage.length > 0 ? (
            <div className="space-y-4">
              {pipelineUsage.map(({ pipeline, queries }) => (
                <Card key={pipeline}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{pipeline}</CardTitle>
                      </div>
                      <Badge variant="outline">
                        {queries.length} {queries.length === 1 ? 'query' : 'queries'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {queries.map(query => {
                        const perfIndicator = getPerformanceIndicator(query.avgExecutionTime);
                        
                        return (
                          <div key={query.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">{query.name}</h4>
                                {query.starred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {query.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>{query.catalog}.{query.schema}</span>
                                <span className={`flex items-center gap-1 ${perfIndicator.color}`}>
                                  <Clock className="h-3 w-3" />
                                  {query.avgExecutionTime}ms
                                </span>
                                <span>{query.executionCount} runs</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => launchPlayground(query)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No pipeline integrations yet</p>
                <p className="text-sm text-muted-foreground">
                  Queries used in pipelines will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}