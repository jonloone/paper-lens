'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  GitBranch,
  Server,
  Shield,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { datadogService } from '@/lib/services/DatadogIntegrationService';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status?: 'success' | 'warning' | 'error';
}

function MetricCard({ title, value, subValue, icon, trend, trendValue, status }: MetricCardProps) {
  const statusColors = {
    success: 'text-green-500 bg-green-100',
    warning: 'text-yellow-500 bg-yellow-100',
    error: 'text-red-500 bg-red-100',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {subValue && <p className="text-sm text-muted-foreground">{subValue}</p>}
            </div>
            {trend && trendValue && (
              <div className="flex items-center gap-1">
                {trend === 'up' && <ChevronUp className="h-4 w-4 text-green-500" />}
                {trend === 'down' && <ChevronDown className="h-4 w-4 text-red-500" />}
                <span className={`text-sm ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${
            status ? statusColors[status] : 'bg-muted'
          }`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PipelineStatusItem {
  name: string;
  status: 'running' | 'success' | 'failed' | 'queued';
  lastRun: string;
  duration: string;
  owner: string;
}

function PipelineStatus({ pipelines }: { pipelines: PipelineStatusItem[] }) {
  const statusIcons = {
    running: <Activity className="h-4 w-4 text-blue-500" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
    queued: <Clock className="h-4 w-4 text-gray-500" />,
  };

  const statusBadges = {
    running: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    queued: 'bg-gray-100 text-gray-700',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pipelines.map((pipeline, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                {statusIcons[pipeline.status]}
                <div>
                  <p className="font-medium">{pipeline.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {pipeline.lastRun}
                    <span>•</span>
                    <span>{pipeline.duration}</span>
                    <span>•</span>
                    <Users className="h-3 w-3" />
                    {pipeline.owner}
                  </div>
                </div>
              </div>
              <Badge className={statusBadges[pipeline.status]}>
                {pipeline.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface QualityMetricItem {
  domain: string;
  score: number;
  freshness: number;
  completeness: number;
  accuracy: number;
}

function DataQualityHeatmap({ metrics }: { metrics: QualityMetricItem[] }) {
  const getScoreColor = (score: number) => {
    if (score >= 95) return 'bg-green-500';
    if (score >= 90) return 'bg-green-400';
    if (score >= 85) return 'bg-yellow-400';
    if (score >= 80) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Quality by Domain</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2 text-xs font-medium text-center">
            <div>Domain</div>
            <div>Overall</div>
            <div>Freshness</div>
            <div>Completeness</div>
            <div>Accuracy</div>
          </div>
          {metrics.map((metric, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2 items-center">
              <div className="text-sm font-medium">{metric.domain}</div>
              <div className={`h-8 rounded flex items-center justify-center text-xs font-medium text-white ${getScoreColor(metric.score)}`}>
                {metric.score}%
              </div>
              <div className={`h-8 rounded flex items-center justify-center text-xs font-medium text-white ${getScoreColor(metric.freshness)}`}>
                {metric.freshness}%
              </div>
              <div className={`h-8 rounded flex items-center justify-center text-xs font-medium text-white ${getScoreColor(metric.completeness)}`}>
                {metric.completeness}%
              </div>
              <div className={`h-8 rounded flex items-center justify-center text-xs font-medium text-white ${getScoreColor(metric.accuracy)}`}>
                {metric.accuracy}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DatadogDashboard() {
  const [timeRange, setTimeRange] = useState('1h');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const data = await datadogService.getAllMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  // Mock pipeline data - would come from Datadog
  const mockPipelines: PipelineStatusItem[] = [
    { name: 'customer_360_daily', status: 'running', lastRun: '5 min ago', duration: '12m 34s', owner: 'data-team' },
    { name: 'revenue_aggregation', status: 'success', lastRun: '1 hour ago', duration: '8m 12s', owner: 'analytics' },
    { name: 'product_recommendations', status: 'failed', lastRun: '2 hours ago', duration: '15m 45s', owner: 'ml-team' },
    { name: 'inventory_sync', status: 'queued', lastRun: '3 hours ago', duration: 'pending', owner: 'ops-team' },
    { name: 'fraud_detection', status: 'running', lastRun: '30 min ago', duration: '22m 18s', owner: 'security' },
  ];

  // Mock quality metrics - would come from Datadog
  const mockQualityMetrics: QualityMetricItem[] = [
    { domain: 'Customer', score: 96, freshness: 98, completeness: 94, accuracy: 96 },
    { domain: 'Sales', score: 93, freshness: 95, completeness: 91, accuracy: 93 },
    { domain: 'Product', score: 89, freshness: 92, completeness: 86, accuracy: 89 },
    { domain: 'Finance', score: 97, freshness: 99, completeness: 95, accuracy: 97 },
    { domain: 'Marketing', score: 91, freshness: 93, completeness: 88, accuracy: 92 },
  ];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoring Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring powered by Datadog
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">Last 15m</SelectItem>
              <SelectItem value="1h">Last 1h</SelectItem>
              <SelectItem value="6h">Last 6h</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7d</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Datadog
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="System Uptime"
          value={`${metrics?.health?.uptime?.toFixed(2) || 99.9}%`}
          icon={<Server className="h-5 w-5" />}
          status="success"
          trend="stable"
          trendValue="No change"
        />
        <MetricCard
          title="Active Alerts"
          value={metrics?.health?.alertsActive || 0}
          subValue={`${metrics?.health?.servicesHealthy || 18}/${metrics?.health?.servicesTotal || 20} services healthy`}
          icon={<AlertTriangle className="h-5 w-5" />}
          status={metrics?.health?.alertsActive > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title="Pipeline Success Rate"
          value={`${Math.round(metrics?.pipeline?.successRate || 94)}%`}
          subValue={`${metrics?.pipeline?.queuedJobs || 15} queued`}
          icon={<GitBranch className="h-5 w-5" />}
          status="success"
          trend="up"
          trendValue="+2.3%"
        />
        <MetricCard
          title="Error Rate"
          value={`${(metrics?.health?.errorRate || 0.1).toFixed(2)}%`}
          icon={<AlertCircle className="h-5 w-5" />}
          status={metrics?.health?.errorRate > 0.5 ? 'warning' : 'success'}
          trend="down"
          trendValue="-0.05%"
        />
      </div>

      {/* Main Monitoring Tabs */}
      <Tabs defaultValue="pipelines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PipelineStatus pipelines={mockPipelines} />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pipeline Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active</span>
                      <span className="font-medium">{metrics?.pipeline?.activePipelines || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Failed</span>
                      <span className="font-medium text-red-600">{metrics?.pipeline?.failedPipelines || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Runtime</span>
                      <span className="font-medium">{metrics?.pipeline?.averageRuntime?.toFixed(1) || 0}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Queued</span>
                      <span className="font-medium">{metrics?.pipeline?.queuedJobs || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">customer_360_daily completed</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">product_recommendations failed</p>
                        <p className="text-xs text-muted-foreground">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Activity className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">inventory_sync started</p>
                        <p className="text-xs text-muted-foreground">30 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Overall Quality"
              value={`${Math.round(metrics?.quality?.overallScore || 94)}%`}
              icon={<Shield className="h-5 w-5" />}
              status="success"
            />
            <MetricCard
              title="Data Freshness"
              value={`${Math.round(metrics?.quality?.freshness || 96)}%`}
              icon={<Clock className="h-5 w-5" />}
              status="success"
            />
            <MetricCard
              title="Completeness"
              value={`${Math.round(metrics?.quality?.completeness || 93)}%`}
              icon={<Database className="h-5 w-5" />}
              status="warning"
            />
            <MetricCard
              title="Accuracy"
              value={`${Math.round(metrics?.quality?.accuracy || 95)}%`}
              icon={<BarChart3 className="h-5 w-5" />}
              status="success"
            />
          </div>
          
          <DataQualityHeatmap metrics={mockQualityMetrics} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Throughput"
              value={metrics?.processing?.throughput || '0TB/h'}
              subValue={`Peak: ${metrics?.processing?.peakThroughput || '0TB/h'}`}
              icon={<Zap className="h-5 w-5" />}
              status="success"
            />
            <MetricCard
              title="Records/Second"
              value={(metrics?.processing?.recordsPerSecond || 0).toLocaleString()}
              icon={<TrendingUp className="h-5 w-5" />}
              status="success"
            />
            <MetricCard
              title="Avg Latency"
              value={`${metrics?.processing?.averageLatency || 0}ms`}
              icon={<Clock className="h-5 w-5" />}
              status={metrics?.processing?.averageLatency > 200 ? 'warning' : 'success'}
            />
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm">{Math.round(metrics?.processing?.cpuUtilization || 65)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${metrics?.processing?.cpuUtilization || 65}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm">{Math.round(metrics?.processing?.memoryUtilization || 72)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${metrics?.processing?.memoryUtilization || 72}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Service Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {['Kafka', 'Snowflake', 'Airflow', 'DataHub', 'Trino', 'Redis'].map((service) => (
                    <div key={service} className="flex items-center justify-between p-2 rounded border">
                      <span className="text-sm font-medium">{service}</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}