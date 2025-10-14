'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Code, Star, BarChart3, Clock, Zap } from 'lucide-react';

interface UsageTabProps {
  product: any;
}

export function UsageTab({ product }: UsageTabProps) {
  const topUsers = [
    { name: 'Maria Rodriguez', team: 'Marketing Analytics', queries: 842, usage: 'Daily dashboards' },
    { name: 'James Chen', team: 'Data Science', queries: 634, usage: 'ML model training' },
    { name: 'Sarah Kim', team: 'Product Analytics', queries: 512, usage: 'Product usage reports' },
  ];

  const commonQueries = [
    {
      name: 'Customer Segmentation',
      uses: 1234,
      query: 'SELECT segment, COUNT(*), AVG(total_revenue)\nFROM customer_360\nGROUP BY segment'
    },
    {
      name: 'High-Value Customers',
      uses: 987,
      query: 'SELECT customer_id, email, total_revenue\nFROM customer_360\nWHERE total_revenue > 10000\nORDER BY total_revenue DESC'
    },
  ];

  // Mock usage data for trends (30 days)
  const activeUsersData = [1842, 1923, 2001, 2089, 2156, 2234, 2298, 2401, 2467, 2523, 2589, 2634, 2701, 2778, 2845, 2923, 2989, 3045, 3123, 3189, 3245, 3298, 3367, 3423, 3489, 3545, 3623, 3689, 3745, 3798];
  const queryVolumeData = [42567, 43234, 44123, 43567, 44890, 45234, 46123, 45678, 47234, 46890, 48123, 47567, 48890, 48234, 49123, 48678, 50234, 49890, 51123, 50567, 51890, 51234, 52123, 51678, 53234, 52890, 54123, 53567, 54890, 54234];
  const dataConsumedData = [0.82, 0.85, 0.88, 0.91, 0.94, 0.97, 1.01, 1.04, 1.07, 1.10, 1.13, 1.16, 1.19, 1.22, 1.25, 1.28, 1.31, 1.34, 1.37, 1.40, 1.43, 1.46, 1.49, 1.52, 1.55, 1.58, 1.61, 1.64, 1.67, 1.70];

  const renderMiniChart = (data: number[], color: string = 'bg-primary') => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-0.5 h-8 mt-2">
        {data.slice(-14).map((value, i) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={i}
              className={`flex-1 ${color} rounded-t-sm opacity-70 hover:opacity-100 transition-opacity`}
              style={{ height: `${Math.max(height, 10)}%` }}
              title={`${value}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Usage Overview - Enhanced with Mini Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active Users</span>
              </div>
              <div className="text-2xl font-bold">{product.usage.uniqueConsumers.toLocaleString()}</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>↑ 12% this month</span>
              </div>
              {renderMiniChart(activeUsersData, 'bg-blue-500')}
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">Queries (30 days)</div>
              <div className="text-2xl font-bold">{product.usage.queriesPerDay.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                avg {Math.round(product.usage.queriesPerDay / 30).toLocaleString()}/day
              </div>
              {renderMiniChart(queryVolumeData, 'bg-green-500')}
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">Data Consumed</div>
              <div className="text-2xl font-bold">1.7 TB</div>
              <div className="text-xs text-muted-foreground mt-1">via queries + API calls</div>
              {renderMiniChart(dataConsumedData, 'bg-purple-500')}
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Method Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Access Method Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>SQL Queries</span>
                <span className="font-medium">75%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>REST API</span>
                <span className="font-medium">18%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '18%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Kafka Stream</span>
                <span className="font-medium">5%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '5%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>File Download</span>
                <span className="font-medium">2%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '2%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle>Top Users (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topUsers.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.team}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{user.queries} queries</div>
                <div className="text-xs text-muted-foreground">{user.usage}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Query Pattern Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Query Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Avg Query Time</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold">2.3s</span>
              </div>
              <div className="text-xs text-green-600 mt-1">↓ 15% vs last week</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Peak Usage</div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold">9-11 AM</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">EST</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Cache Hit Rate</div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold">67%</span>
              </div>
              <div className="text-xs text-green-600 mt-1">↑ 8% vs last week</div>
            </div>
          </div>

          {/* Top Query Patterns */}
          <div>
            <h4 className="text-sm font-medium mb-3">Most Common Query Patterns</h4>
            {commonQueries.map((pattern, index) => (
              <div key={index} className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{pattern.name}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{pattern.uses.toLocaleString()} uses</Badge>
                    <Badge variant="outline">Avg 1.8s</Badge>
                  </div>
                </div>
                <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                  {pattern.query}
                </pre>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Code className="mr-2 h-3 w-3" />
                    Copy Query
                  </Button>
                  <Button variant="outline" size="sm">
                    View Execution Plan
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Query Complexity Distribution */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Query Complexity Distribution</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Simple SELECT (1-2 joins)</span>
                  <span className="font-medium">62%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '62%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Moderate (3-5 joins, aggregations)</span>
                  <span className="font-medium">28%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '28%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Complex (6+ joins, window functions)</span>
                  <span className="font-medium">10%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '10%' }} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>User Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="font-medium">{product.rating}/5.0</span>
            <span className="text-sm text-muted-foreground">
              (based on {product.reviews} reviews)
            </span>
          </div>

          <Button variant="outline" size="sm">
            View All Reviews
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
