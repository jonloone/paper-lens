'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Activity, AlertCircle, AlertTriangle, ArrowRight, ArrowUp, ArrowDown,
  Brain, CheckCircle, ChevronRight, Clock, Cpu, Database,
  DollarSign, Flame, GitBranch, HardDrive, Loader2, MemoryStick,
  RefreshCw, Server, Shield, Sparkles, Target, TrendingDown,
  TrendingUp, Users, XCircle, Zap, Timer, Minus, Bot,
  FileWarning, Package, Layers, Network, Play, Pause, BarChart3,
  Eye, Settings, Wrench, CheckCircle2, LineChart, Calendar,
  Grid3X3, Activity as Pulse
} from 'lucide-react';

// Import VisX visualization components
import { QualityTrendsChart } from '@/components/visualizations/QualityTrendsChart';
import { SchemaDriftTimeline } from '@/components/visualizations/SchemaDriftTimeline';
import { DataCompletenessHeatmap } from '@/components/visualizations/DataCompletenessHeatmap';
import { PipelineHealthChart } from '@/components/visualizations/PipelineHealthChart';
import { mockVisualizationData } from '@/lib/mock-data/visualization-data';

// Types for operational intelligence
interface CriticalIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  system: string;
  title: string;
  businessImpact: string;
  duration: string;
  affectedPipelines: number;
  recommendation?: AIRecommendation;
}

// New Pipeline Types
interface PipelineStatus {
  id: string;
  name: string;
  domain: string;
  status: 'running' | 'paused' | 'failed' | 'warning';
  lastRun: string;
  nextRun: string;
  successRate: number;
  avgDuration: string;
  qualityScore: number;
  recordsProcessed: string;
}

interface QualityMetric {
  domain: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  issuesCount: number;
  rulesCount: number;
}

interface AIRecommendation {
  action: string;
  confidence: number;
  estimatedTime: string;
  successRate: number;
  reasoning: string;
  alternativeActions?: string[];
}

interface SystemHealth {
  system: string;
  status: 'healthy' | 'degraded' | 'critical';
  metrics: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    threshold?: number;
    unit: string;
  };
  prediction?: string;
}

interface OperationalMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
}

interface TeamTask {
  type: 'review' | 'deploy' | 'incident' | 'approval';
  count: number;
  urgent?: boolean;
}

// Mock data for intelligent operations
const criticalIssues: CriticalIssue[] = [
  {
    id: '1',
    severity: 'critical',
    system: 'Kafka',
    title: 'Consumer lag spike detected',
    businessImpact: 'Customer order processing delayed by 15+ minutes',
    duration: '32 minutes',
    affectedPipelines: 12,
    recommendation: {
      action: 'Restart Kafka consumer group with increased partition allocation',
      confidence: 92,
      estimatedTime: '3 minutes',
      successRate: 88,
      reasoning: 'Similar lag pattern resolved 8 times this month using this approach. Current lag matches signature of partition imbalance.',
      alternativeActions: [
        'Scale consumer instances (+5 pods)',
        'Increase consumer fetch size to 10MB',
      ]
    }
  },
  {
    id: '2',
    severity: 'high',
    system: 'Trino',
    title: 'Query performance degradation',
    businessImpact: 'Analytics dashboards loading 5x slower',
    duration: '1 hour 14 minutes',
    affectedPipelines: 7,
    recommendation: {
      action: 'Clear query cache and optimize table statistics',
      confidence: 78,
      estimatedTime: '10 minutes',
      successRate: 72,
      reasoning: 'Table statistics are 3 days old. Query plan shows suboptimal join strategy due to outdated cardinality estimates.',
      alternativeActions: [
        'Increase worker memory to 32GB',
        'Enable cost-based optimizer',
      ]
    }
  }
];

const systemHealthMetrics: SystemHealth[] = [
  {
    system: 'Airflow',
    status: 'healthy',
    metrics: {
      current: 89,
      trend: 'stable',
      threshold: 85,
      unit: '% tasks on time'
    }
  },
  {
    system: 'Kafka',
    status: 'critical',
    metrics: {
      current: 15000,
      trend: 'up',
      threshold: 1000,
      unit: 'msg lag'
    },
    prediction: 'OOM risk in 2 hours at current rate'
  },
  {
    system: 'Trino',
    status: 'degraded',
    metrics: {
      current: 78,
      trend: 'down',
      threshold: 60,
      unit: '% CPU'
    }
  },
  {
    system: 'DataHub',
    status: 'healthy',
    metrics: {
      current: 12,
      trend: 'stable',
      unit: 'ms latency'
    }
  },
  {
    system: 'Storage',
    status: 'healthy',
    metrics: {
      current: 72,
      trend: 'up',
      unit: '% used'
    },
    prediction: 'Capacity limit in 14 days'
  }
];

const pipelineHealth: OperationalMetric[] = [
  { label: 'Active', value: 147, status: 'good' },
  { label: 'Degraded', value: 3, change: 2, trend: 'up', status: 'warning' },
  { label: 'Failed', value: 0, status: 'good' },
  { label: 'Success Rate', value: '98.2%', change: -1.5, trend: 'down' }
];

const resourceMetrics: OperationalMetric[] = [
  { label: 'CPU Usage', value: '67%', trend: 'stable', status: 'good' },
  { label: 'Memory', value: '78%', change: 5, trend: 'up', status: 'warning' },
  { label: 'Cost Today', value: '$2,147', change: -12, trend: 'down', status: 'good' },
  { label: 'Efficiency', value: '94%', change: 3, trend: 'up', status: 'good' }
];

const teamQueue: TeamTask[] = [
  { type: 'review', count: 3, urgent: true },
  { type: 'deploy', count: 1 },
  { type: 'incident', count: 0 },
  { type: 'approval', count: 2 }
];

// Pipeline Operations Data
const activePipelines: PipelineStatus[] = [
  {
    id: 'customer-360-etl',
    name: 'Customer 360 ETL',
    domain: 'Customer',
    status: 'running',
    lastRun: '2 hours ago',
    nextRun: 'In 4 hours',
    successRate: 98.5,
    avgDuration: '12 min',
    qualityScore: 94,
    recordsProcessed: '2.3M'
  },
  {
    id: 'revenue-attribution',
    name: 'Revenue Attribution',
    domain: 'Finance',
    status: 'warning',
    lastRun: '15 min ago',
    nextRun: 'In 45 min',
    successRate: 89.2,
    avgDuration: '8 min',
    qualityScore: 87,
    recordsProcessed: '847K'
  },
  {
    id: 'product-analytics',
    name: 'Product Analytics Stream',
    domain: 'Product',
    status: 'running',
    lastRun: '1 min ago',
    nextRun: 'Continuous',
    successRate: 99.1,
    avgDuration: '3 sec',
    qualityScore: 96,
    recordsProcessed: '1.2M/hr'
  },
  {
    id: 'marketing-attribution',
    name: 'Marketing Attribution',
    domain: 'Marketing',
    status: 'paused',
    lastRun: '1 day ago',
    nextRun: 'Manual',
    successRate: 92.3,
    avgDuration: '15 min',
    qualityScore: 91,
    recordsProcessed: '654K'
  },
  {
    id: 'ops-monitoring',
    name: 'Operations Monitoring',
    domain: 'Operations',
    status: 'failed',
    lastRun: '30 min ago',
    nextRun: 'Retry in 15 min',
    successRate: 95.7,
    avgDuration: '5 min',
    qualityScore: 78,
    recordsProcessed: '0'
  }
];

// Quality Intelligence Data
const qualityMetrics: QualityMetric[] = [
  {
    domain: 'Customer',
    score: 94.2,
    trend: 'up',
    change: 2.1,
    issuesCount: 2,
    rulesCount: 15
  },
  {
    domain: 'Finance',
    score: 91.7,
    trend: 'down',
    change: -1.3,
    issuesCount: 4,
    rulesCount: 12
  },
  {
    domain: 'Product',
    score: 96.8,
    trend: 'stable',
    change: 0.2,
    issuesCount: 1,
    rulesCount: 18
  },
  {
    domain: 'Marketing',
    score: 89.4,
    trend: 'up',
    change: 3.2,
    issuesCount: 3,
    rulesCount: 10
  },
  {
    domain: 'Operations',
    score: 87.1,
    trend: 'down',
    change: -4.1,
    issuesCount: 6,
    rulesCount: 14
  }
];

// Active Issues and Opportunities
const activeIssues = [
  {
    id: 'schema-drift-customer',
    title: 'Schema drift in customer_events',
    domain: 'Customer',
    severity: 'high',
    impact: '3 downstream pipelines affected',
    action: 'Fix Schema Issues'
  },
  {
    id: 'quality-rule-failing',
    title: 'Completeness rule failing (revenue)',
    domain: 'Finance',
    severity: 'medium',
    impact: 'Revenue reports may be incomplete',
    action: 'Review Quality Rules'
  }
];

const optimizationOpportunities = [
  {
    id: 'customer-etl-perf',
    title: 'Customer ETL 40% slower than baseline',
    domain: 'Customer',
    impact: 'Potential cost savings: $340/month',
    action: 'Optimize Pipeline'
  },
  {
    id: 'unused-data-product',
    title: 'Marketing segments unused for 30+ days',
    domain: 'Marketing',
    impact: 'Storage cost reduction: $180/month',
    action: 'Archive or Sunset'
  }
];

export default function HomePage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleAIRecommendation = (issue: CriticalIssue) => {
    setAiProcessing(true);
    setTimeout(() => {
      setAiProcessing(false);
      // Navigate to investigation with context
      router.push(`/investigate?issue=${issue.id}&ai=true`);
    }, 1500);
  };

  const navigateToWorkflow = (actionType: string, context?: any) => {
    switch (actionType) {
      case 'Fix Schema Issues':
        router.push('/build?mode=schema-fix&domain=' + context?.domain);
        break;
      case 'Review Quality Rules':
        router.push('/quality-dashboard?domain=' + context?.domain);
        break;
      case 'Optimize Pipeline':
        router.push('/build?mode=optimize&pipeline=' + context?.id);
        break;
      case 'View Pipeline Details':
        router.push('/quality-dashboard?pipeline=' + context?.id);
        break;
      default:
        router.push('/build');
    }
  };

  const getPipelineStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'failed': return 'text-destructive';
      case 'paused': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getPipelineStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-3 w-3 text-green-600 dark:text-green-400" />;
      case 'warning': return <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />;
      case 'failed': return <XCircle className="h-3 w-3 text-destructive" />;
      case 'paused': return <Pause className="h-3 w-3 text-muted-foreground" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-destructive bg-destructive/5';
      case 'high': return 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20';
      case 'medium': return 'border-border';
      default: return 'border-border';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'degraded': return 'text-amber-600 dark:text-amber-400';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3" />;
      case 'down': return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'review': return <FileWarning className="h-4 w-4" />;
      case 'deploy': return <Package className="h-4 w-4" />;
      case 'incident': return <Flame className="h-4 w-4" />;
      case 'approval': return <Shield className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const hasIssues = criticalIssues.length > 0;

  return (
    <div className="w-full px-8 lg:px-12 xl:px-16 py-6">
      <div className="space-y-6 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              Data Operations Command Center
            </h1>
            <p className="text-sm dark:text-[#7d8590] mt-1">
              {mounted ? currentTime.toLocaleString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Loading...'}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {/* Data Intelligence Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Trends Over Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                Data Quality Trends
              </CardTitle>
              <CardDescription>Quality scores across domains over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <QualityTrendsChart data={mockVisualizationData.qualityTrends} />
              </div>
            </CardContent>
          </Card>

          {/* Schema Drift Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                Schema Changes
              </CardTitle>
              <CardDescription>Recent schema modifications and their impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <SchemaDriftTimeline data={mockVisualizationData.schemaDrift} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Completeness & Pipeline Health Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Data Completeness Heatmap */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-green-600" />
                Data Completeness Matrix
              </CardTitle>
              <CardDescription>Field completeness across datasets and domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <DataCompletenessHeatmap data={mockVisualizationData.completeness} />
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Health Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pulse className="h-5 w-5 text-blue-600" />
                Pipeline Health
              </CardTitle>
              <CardDescription>Real-time processing metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Throughput Chart */}
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Throughput
                </div>
                <div className="h-[120px]">
                  <PipelineHealthChart
                    data={mockVisualizationData.pipelineHealth}
                    metric="throughput"
                  />
                </div>
              </div>

              {/* Latency Chart */}
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Latency
                </div>
                <div className="h-[120px]">
                  <PipelineHealthChart
                    data={mockVisualizationData.pipelineHealth}
                    metric="latency"
                  />
                </div>
              </div>

              {/* CDC Events Chart */}
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  CDC Events
                </div>
                <div className="h-[120px]">
                  <PipelineHealthChart
                    data={mockVisualizationData.pipelineHealth}
                    metric="cdc"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health Command Strip */}
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health Overview
            </h2>
            <div className="text-sm text-muted-foreground">
              Last updated: {mounted ? new Date(Date.now() - 2 * 60 * 1000).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              }) : '...'} ago
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Pipelines</span>
                <span className="text-xs text-muted-foreground">23 active, 2 need attention</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Quality</span>
                <span className="text-xs text-muted-foreground">92.1% avg, 3 rules failing</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Processing</span>
                <span className="text-xs text-muted-foreground">2.3M records/hr, normal throughput</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Infrastructure</span>
                <span className="text-xs text-muted-foreground">All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Pipeline Operations + Quality Intelligence */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Pipeline Operations */}
          <div className="col-span-7">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Pipeline Operations
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">All Domains</Button>
                    <Button size="sm" variant="outline">Issues Only</Button>
                    <Button size="sm" variant="outline">High Usage</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activePipelines.map(pipeline => (
                    <div
                      key={pipeline.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigateToWorkflow('View Pipeline Details', pipeline)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getPipelineStatusIcon(pipeline.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{pipeline.name}</span>
                              <Badge variant="outline" className="text-xs">{pipeline.domain}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span>Last: {pipeline.lastRun}</span>
                              <span>Next: {pipeline.nextRun}</span>
                              <span>{pipeline.recordsProcessed} records</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="text-sm font-medium">{pipeline.successRate}%</div>
                            <div className="text-xs text-muted-foreground">Success</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{pipeline.qualityScore}%</div>
                            <div className="text-xs text-muted-foreground">Quality</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{pipeline.avgDuration}</div>
                            <div className="text-xs text-muted-foreground">Avg time</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push('/quality-dashboard')}
                  >
                    View All Pipelines
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Quality Intelligence */}
          <div className="col-span-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Data Quality Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Quality Score Overview */}
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold mb-1">92.1%</div>
                    <div className="text-sm text-muted-foreground">Overall Quality Score</div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <TrendingDown className="h-3 w-3 text-amber-600" />
                      <span className="text-xs text-amber-600">-0.8% from last week</span>
                    </div>
                  </div>

                  {/* Domain Quality Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Quality by Domain</h4>
                    {qualityMetrics.map(metric => (
                      <div key={metric.domain} className="flex items-center justify-between p-2 rounded border">
                        <div>
                          <div className="text-sm font-medium">{metric.domain}</div>
                          <div className="text-xs text-muted-foreground">
                            {metric.issuesCount} issues • {metric.rulesCount} rules
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{metric.score}%</span>
                            <div className={cn(
                              "flex items-center text-xs",
                              metric.trend === 'up' ? 'text-green-600' :
                              metric.trend === 'down' ? 'text-amber-600' :
                              'text-muted-foreground'
                            )}>
                              {getTrendIcon(metric.trend)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push('/quality-dashboard')}
                  >
                    Quality Dashboard
                    <Eye className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium mb-1">Optimize Customer ETL</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Pipeline running 40% slower than baseline. Potential savings: $340/month.
                    </div>
                    <Button size="sm" variant="outline" className="h-6 text-xs">
                      Apply Optimization
                    </Button>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium mb-1">Update Quality Rules</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      3 rules haven't been updated in 90+ days. Consider refresh.
                    </div>
                    <Button size="sm" variant="outline" className="h-6 text-xs">
                      Review Rules
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Issues & Opportunities */}
        <div className="grid grid-cols-2 gap-6">
          {/* Issues Requiring Attention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Issues Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeIssues.map(issue => (
                  <div key={issue.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={issue.severity === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{issue.domain}</Badge>
                        </div>
                        <div className="text-sm font-medium">{issue.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {issue.impact}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={() => navigateToWorkflow(issue.action, issue)}
                      >
                        {issue.action}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Optimization Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimizationOpportunities.map(opp => (
                  <div key={opp.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{opp.domain}</Badge>
                        </div>
                        <div className="text-sm font-medium">{opp.title}</div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {opp.impact}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={() => navigateToWorkflow(opp.action, opp)}
                      >
                        {opp.action}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Launch Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Start workflows with contextual assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <Button
                className="justify-start h-auto py-4 px-4 bg-primary hover:bg-primary/90"
                onClick={() => router.push('/build')}
              >
                <div className="flex items-start gap-3">
                  <Layers className="h-6 w-6 mt-0.5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Build Data Product</div>
                    <div className="text-xs text-primary-foreground/80">
                      Intent-driven creation
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-4"
                onClick={() => router.push('/quality-dashboard')}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Quality Monitoring</div>
                    <div className="text-xs text-muted-foreground">
                      Real-time quality dashboards
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-4"
                onClick={() => router.push('/catalog')}
              >
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 mt-0.5 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Browse Data Catalog</div>
                    <div className="text-xs text-muted-foreground">
                      Discover data assets
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-4"
                onClick={() => router.push('/sources')}
              >
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 mt-0.5 text-purple-500" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Manage Sources</div>
                    <div className="text-xs text-muted-foreground">
                      Configure connections
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}