'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw,
  Clock,
  Play,
  Search,
  ChevronRight,
  Database,
  ExternalLink,
  Bot,
  Sparkles,
  GitBranch,
  BarChart3,
  X,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { crewAIService } from '@/lib/services/CrewAIService';

// Tool URLs configuration
const TOOL_URLS = {
  airflow: process.env.NEXT_PUBLIC_AIRFLOW_URL || 'http://localhost:8080',
  trino: process.env.NEXT_PUBLIC_TRINO_URL || 'http://localhost:8080',
  datahub: process.env.NEXT_PUBLIC_DATAHUB_URL || 'http://localhost:9002',
  spark: process.env.NEXT_PUBLIC_SPARK_URL || 'http://localhost:4040'
};

// Unified pipeline with embedded issues
interface UnifiedPipeline {
  id: string;
  name: string;
  domain: 'sales' | 'marketing' | 'finance' | 'operations' | 'customer' | 'infrastructure';
  source: 'airflow' | 'custom';
  status: 'running' | 'failed' | 'success' | 'queued' | 'degraded';
  
  // Execution details
  lastRun: Date;
  nextRun: Date;
  duration: number;
  sla?: number; // SLA in minutes
  tasks: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
  recordsProcessed?: number;
  
  // Embedded issue if any
  issue?: {
    type: string;
    description: string;
    detectedAt: Date;
    severity: 'high' | 'medium' | 'low';
  };
  
  // Impact analysis
  impact: {
    blocked: number;
    affectedQueries: string[];
    delayedReports: string[];
  };
  
  // CrewAI suggestions
  aiAnalysis?: {
    rootCause?: string;
    recommendation?: string;
    confidence?: number;
  };
  
  // Historical data for trends
  history: {
    date: Date;
    status: 'success' | 'failed';
    duration: number;
  }[];
}

interface QualityMetric {
  id: string;
  name: string;
  value: number;
  threshold: number;
  status: 'pass' | 'warning' | 'fail';
  trend: 'improving' | 'stable' | 'declining';
}

export default function MonitorPage() {
  const [pipelines, setPipelines] = useState<UnifiedPipeline[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<UnifiedPipeline | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [analyzingPipeline, setAnalyzingPipeline] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  // Initialize unified pipeline data
  useEffect(() => {
    const unifiedData: UnifiedPipeline[] = [
      {
        id: 'inventory_sync',
        name: 'Inventory Sync',
        domain: 'operations',
        source: 'airflow',
        status: 'failed',
        lastRun: new Date(Date.now() - 1800000),
        nextRun: new Date(Date.now() + 3600000),
        duration: 0,
        sla: 60,
        tasks: {
          total: 10,
          completed: 3,
          failed: 1,
          running: 0
        },
        recordsProcessed: 45000,
        issue: {
          type: 'Memory Error',
          description: 'Task exceeded memory limit during transform step',
          detectedAt: new Date(Date.now() - 1800000),
          severity: 'high'
        },
        impact: {
          blocked: 3,
          affectedQueries: ['daily_inventory_report', 'stock_prediction'],
          delayedReports: ['Executive Dashboard']
        },
        aiAnalysis: {
          rootCause: 'Dataset size increased by 40% causing Spark executor OOM',
          recommendation: 'Increase executor memory to 4G or add .repartition(100)',
          confidence: 85
        },
        history: [
          { date: new Date(Date.now() - 86400000), status: 'success', duration: 45 },
          { date: new Date(Date.now() - 172800000), status: 'success', duration: 43 },
          { date: new Date(Date.now() - 259200000), status: 'failed', duration: 0 }
        ]
      },
      {
        id: 'customer_etl',
        name: 'Customer ETL',
        domain: 'customer',
        source: 'airflow',
        status: 'degraded',
        lastRun: new Date(Date.now() - 3600000),
        nextRun: new Date(Date.now() + 3600000),
        duration: 85,
        sla: 45,
        tasks: {
          total: 12,
          completed: 12,
          failed: 0,
          running: 0
        },
        recordsProcessed: 250000,
        issue: {
          type: 'Performance',
          description: 'Running 2x slower than baseline',
          detectedAt: new Date(Date.now() - 3600000),
          severity: 'medium'
        },
        impact: {
          blocked: 0,
          affectedQueries: ['customer_analytics'],
          delayedReports: []
        },
        history: [
          { date: new Date(Date.now() - 86400000), status: 'success', duration: 45 },
          { date: new Date(Date.now() - 172800000), status: 'success', duration: 44 },
          { date: new Date(Date.now() - 259200000), status: 'success', duration: 46 }
        ]
      },
      {
        id: 'sales_aggregation',
        name: 'Sales Aggregation',
        domain: 'sales',
        source: 'airflow',
        status: 'running',
        lastRun: new Date(Date.now() - 1200000),
        nextRun: new Date(Date.now() + 1800000),
        duration: 20,
        sla: 30,
        tasks: {
          total: 8,
          completed: 5,
          failed: 0,
          running: 1
        },
        recordsProcessed: 150000,
        impact: {
          blocked: 0,
          affectedQueries: [],
          delayedReports: []
        },
        history: [
          { date: new Date(Date.now() - 86400000), status: 'success', duration: 32 },
          { date: new Date(Date.now() - 172800000), status: 'success', duration: 31 },
          { date: new Date(Date.now() - 259200000), status: 'success', duration: 33 }
        ]
      },
      {
        id: 'ml_feature_pipeline',
        name: 'ML Feature Engineering',
        domain: 'operations',
        source: 'airflow',
        status: 'success',
        lastRun: new Date(Date.now() - 7200000),
        nextRun: new Date(Date.now() + 3600000),
        duration: 58,
        sla: 90,
        tasks: {
          total: 15,
          completed: 15,
          failed: 0,
          running: 0
        },
        recordsProcessed: 500000,
        impact: {
          blocked: 0,
          affectedQueries: [],
          delayedReports: []
        },
        history: [
          { date: new Date(Date.now() - 86400000), status: 'success', duration: 55 },
          { date: new Date(Date.now() - 172800000), status: 'success', duration: 57 },
          { date: new Date(Date.now() - 259200000), status: 'success', duration: 56 }
        ]
      },
      {
        id: 'financial_reporting',
        name: 'Financial Reporting',
        domain: 'finance',
        source: 'airflow',
        status: 'queued',
        lastRun: new Date(Date.now() - 86400000),
        nextRun: new Date(Date.now() + 300000),
        duration: 0,
        sla: 120,
        tasks: {
          total: 20,
          completed: 0,
          failed: 0,
          running: 0
        },
        recordsProcessed: 0,
        impact: {
          blocked: 0,
          affectedQueries: [],
          delayedReports: []
        },
        history: [
          { date: new Date(Date.now() - 86400000), status: 'success', duration: 95 },
          { date: new Date(Date.now() - 172800000), status: 'success', duration: 98 },
          { date: new Date(Date.now() - 259200000), status: 'success', duration: 93 }
        ]
      },
      {
        id: 'marketing_attribution',
        name: 'Marketing Attribution',
        domain: 'marketing',
        source: 'airflow',
        status: 'success',
        lastRun: new Date(Date.now() - 5400000),
        nextRun: new Date(Date.now() + 10800000),
        duration: 42,
        sla: 60,
        tasks: {
          total: 10,
          completed: 10,
          failed: 0,
          running: 0
        },
        recordsProcessed: 320000,
        impact: {
          blocked: 0,
          affectedQueries: [],
          delayedReports: []
        },
        history: [
          { date: new Date(Date.now() - 86400000), status: 'success', duration: 40 },
          { date: new Date(Date.now() - 172800000), status: 'success', duration: 41 },
          { date: new Date(Date.now() - 259200000), status: 'success', duration: 43 }
        ]
      },
      {
        id: 'infrastructure_metrics',
        name: 'Infrastructure Metrics',
        domain: 'infrastructure',
        source: 'custom',
        status: 'success',
        lastRun: new Date(Date.now() - 600000),
        nextRun: new Date(Date.now() + 600000),
        duration: 5,
        sla: 10,
        tasks: {
          total: 5,
          completed: 5,
          failed: 0,
          running: 0
        },
        recordsProcessed: 1000000,
        impact: {
          blocked: 0,
          affectedQueries: [],
          delayedReports: []
        },
        history: [
          { date: new Date(Date.now() - 86400000), status: 'success', duration: 5 },
          { date: new Date(Date.now() - 172800000), status: 'success', duration: 4 },
          { date: new Date(Date.now() - 259200000), status: 'success', duration: 5 }
        ]
      }
    ];
    setPipelines(unifiedData);
  }, []);

  // Initialize quality metrics
  useEffect(() => {
    const metrics: QualityMetric[] = [
      {
        id: 'completeness',
        name: 'Completeness',
        value: 98.5,
        threshold: 95,
        status: 'pass',
        trend: 'stable'
      },
      {
        id: 'freshness',
        name: 'Freshness',
        value: 89.3,
        threshold: 90,
        status: 'warning',
        trend: 'declining'
      },
      {
        id: 'accuracy',
        name: 'Accuracy',
        value: 97.2,
        threshold: 95,
        status: 'pass',
        trend: 'improving'
      }
    ];
    setQualityMetrics(metrics);
  }, []);

  // Run CrewAI analysis on a pipeline
  const analyzePipeline = async (pipelineId: string) => {
    setAnalyzingPipeline(pipelineId);
    
    try {
      // In production, this would call the actual CrewAI service
      // For now, simulate the analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pipeline = pipelines.find(p => p.id === pipelineId);
      if (pipeline && pipeline.issue) {
        // Update with more detailed analysis
        setPipelines(prev => prev.map(p => 
          p.id === pipelineId 
            ? {
                ...p,
                aiAnalysis: {
                  rootCause: 'Memory spike detected during peak processing hours. Dataset growth exceeded capacity planning.',
                  recommendation: '1. Increase Spark executor memory from 2G to 4G\n2. Implement dynamic partitioning based on input size\n3. Add monitoring alert for dataset size changes > 20%',
                  confidence: 92
                }
              }
            : p
        ));
      }
    } finally {
      setAnalyzingPipeline(null);
    }
  };

  // Filter pipelines based on search, status, and domain
  const filteredPipelines = pipelines.filter(pipeline => {
    const matchesSearch = pipeline.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pipeline.status === statusFilter;
    const matchesDomain = domainFilter === 'all' || pipeline.domain === domainFilter;
    return matchesSearch && matchesStatus && matchesDomain;
  });

  // Count pipelines by status
  const statusCounts = {
    failed: pipelines.filter(p => p.status === 'failed').length,
    degraded: pipelines.filter(p => p.status === 'degraded').length,
    running: pipelines.filter(p => p.status === 'running').length,
    success: pipelines.filter(p => p.status === 'success').length,
    queued: pipelines.filter(p => p.status === 'queued').length
  };

  // Count blocked systems
  const totalBlocked = pipelines.reduce((sum, p) => sum + p.impact.blocked, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getDomainColor = (domain: string) => {
    const colors = {
      sales: 'bg-blue-100 text-blue-800',
      marketing: 'bg-purple-100 text-purple-800',
      finance: 'bg-green-100 text-green-800',
      operations: 'bg-orange-100 text-orange-800',
      customer: 'bg-pink-100 text-pink-800',
      infrastructure: 'bg-gray-100 text-gray-800'
    };
    return colors[domain as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  };

  const openPipelineDetails = (pipeline: UnifiedPipeline) => {
    setSelectedPipeline(pipeline);
    setDetailsOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header with key metrics */}
      <div className="bg-background border-b sticky top-14 z-30 -mx-6 px-6 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Pipeline Monitor</h2>
              <p className="text-sm text-muted-foreground">Real-time pipeline health and performance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
          </div>
        </div>

        {/* Key metrics bar */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="font-medium">{statusCounts.failed} Failed</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{statusCounts.degraded} Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{statusCounts.running} Running</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="font-medium">{statusCounts.success} Healthy</span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{totalBlocked} systems blocked</span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          {qualityMetrics.map(metric => (
            <div key={metric.id} className="flex items-center gap-2">
              <span className="text-muted-foreground">{metric.name}</span>
              <span className={cn(
                "font-medium",
                metric.status === 'pass' && "text-green-600",
                metric.status === 'warning' && "text-yellow-600",
                metric.status === 'fail' && "text-red-600"
              )}>
                {metric.value}%
              </span>
              {getTrendIcon(metric.trend)}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pipelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[140px]">
              <Filter className="h-3 w-3 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="degraded">Degraded</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
            </SelectContent>
          </Select>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="h-8 w-[140px]">
              <Database className="h-3 w-3 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="infrastructure">Infrastructure</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setDomainFilter('all');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Concise pipeline table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr className="text-sm">
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Pipeline</th>
                <th className="text-left p-3 font-medium">Domain</th>
                <th className="text-left p-3 font-medium">Last Run</th>
                <th className="text-left p-3 font-medium">Duration / SLA</th>
                <th className="text-left p-3 font-medium">Issue</th>
                <th className="text-left p-3 font-medium">Impact</th>
                <th className="text-right p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPipelines.map((pipeline) => (
                <tr 
                  key={pipeline.id} 
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => openPipelineDetails(pipeline)}
                >
                  <td className="p-3">
                    {getStatusIcon(pipeline.status)}
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-sm">{pipeline.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {pipeline.tasks.completed}/{pipeline.tasks.total} tasks
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={cn("text-xs", getDomainColor(pipeline.domain))}>
                      {pipeline.domain}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      {new Date(pipeline.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      {pipeline.duration > 0 ? (
                        <span className={cn(
                          pipeline.sla && pipeline.duration > pipeline.sla && "text-red-600 font-medium"
                        )}>
                          {formatDuration(pipeline.duration)} / {pipeline.sla && formatDuration(pipeline.sla)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">- / {pipeline.sla && formatDuration(pipeline.sla)}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {pipeline.issue ? (
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            pipeline.issue.severity === 'high' ? 'destructive' :
                            pipeline.issue.severity === 'medium' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {pipeline.issue.type}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {pipeline.impact.blocked > 0 ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">{pipeline.impact.blocked} blocked</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
              {filteredPipelines.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No pipelines match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Slide-out detail panel */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          {selectedPipeline && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedPipeline.status)}
                    <SheetTitle>{selectedPipeline.name}</SheetTitle>
                  </div>
                  <Badge variant="outline" className={cn("text-xs", getDomainColor(selectedPipeline.domain))}>
                    {selectedPipeline.domain}
                  </Badge>
                </div>
                <SheetDescription>
                  Pipeline ID: {selectedPipeline.id}
                </SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Execution Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Run</span>
                            <span>{new Date(selectedPipeline.lastRun).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Next Run</span>
                            <span>{new Date(selectedPipeline.nextRun).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration</span>
                            <span>{formatDuration(selectedPipeline.duration)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SLA</span>
                            <span>{selectedPipeline.sla && formatDuration(selectedPipeline.sla)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Task Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Progress value={(selectedPipeline.tasks.completed / selectedPipeline.tasks.total) * 100} />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{selectedPipeline.tasks.completed} completed</span>
                            <span>{selectedPipeline.tasks.failed} failed</span>
                            <span>{selectedPipeline.tasks.running} running</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedPipeline.impact.blocked > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Impact Analysis</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 space-y-1">
                          <p className="font-medium">{selectedPipeline.impact.blocked} downstream systems blocked</p>
                          <p className="text-sm">Affected queries: {selectedPipeline.impact.affectedQueries.join(', ')}</p>
                          {selectedPipeline.impact.delayedReports.length > 0 && (
                            <p className="text-sm">Delayed reports: {selectedPipeline.impact.delayedReports.join(', ')}</p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Recent Run History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedPipeline.history.map((run, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {new Date(run.date).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              {run.status === 'success' ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              <span>{formatDuration(run.duration)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="diagnosis" className="space-y-4">
                  {selectedPipeline.issue && (
                    <>
                      <Alert variant={selectedPipeline.issue.severity === 'high' ? 'destructive' : 'default'}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{selectedPipeline.issue.type}</AlertTitle>
                        <AlertDescription>
                          {selectedPipeline.issue.description}
                          <div className="mt-2 text-xs text-muted-foreground">
                            Detected: {new Date(selectedPipeline.issue.detectedAt).toLocaleString()}
                          </div>
                        </AlertDescription>
                      </Alert>

                      {selectedPipeline.aiAnalysis ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                              AI Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-1">Root Cause</p>
                              <p className="text-sm text-muted-foreground">{selectedPipeline.aiAnalysis.rootCause}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Recommendation</p>
                              <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {selectedPipeline.aiAnalysis.recommendation}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <Badge variant="secondary">
                                {selectedPipeline.aiAnalysis.confidence}% confidence
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardContent className="py-6 text-center">
                            <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-3">
                              Get AI-powered root cause analysis
                            </p>
                            <Button
                              onClick={() => analyzePipeline(selectedPipeline.id)}
                              disabled={analyzingPipeline === selectedPipeline.id}
                              size="sm"
                            >
                              {analyzingPipeline === selectedPipeline.id ? (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Analyze with CrewAI
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {!selectedPipeline.issue && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm font-medium">No issues detected</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Pipeline is running within normal parameters
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.open(`${TOOL_URLS.airflow}/dags/${selectedPipeline.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in Airflow
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.open(`${TOOL_URLS.datahub}/dataset/${selectedPipeline.id}`, '_blank')}
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    View Lineage in DataHub
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.open(`${TOOL_URLS.trino}/query/${selectedPipeline.id}`, '_blank')}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Query in Trino
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.open(`${TOOL_URLS.spark}/jobs/${selectedPipeline.id}`, '_blank')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Spark Jobs
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pipeline Actions</p>
                    <Button className="w-full justify-start" variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Trigger Manual Run
                    </Button>
                    <Button className="w-full justify-start" variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Failed Tasks
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}