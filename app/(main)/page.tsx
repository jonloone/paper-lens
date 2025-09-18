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
  FileWarning, Package, Layers, Network
} from 'lucide-react';

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
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight dark:text-[#f0f6fc]">
              Operations Command Center
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

        {/* Crisis Response Zone */}
        {hasIssues && (
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />
                  Active Issues Requiring Attention
                </span>
                <Badge variant="destructive">{criticalIssues.length} issues</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {criticalIssues.map(issue => (
                <div key={issue.id} className={cn(
                  "border rounded-lg p-4",
                  getSeverityColor(issue.severity)
                )}>
                  <div className="space-y-3">
                    {/* Issue Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'} className="font-semibold">
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{issue.system}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Active for {issue.duration}
                          </span>
                        </div>
                        <h3 className="font-medium mt-2">{issue.title}</h3>
                        <p className="text-sm text-destructive-foreground mt-1 flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {issue.businessImpact}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Affecting {issue.affectedPipelines} pipelines
                        </p>
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    {issue.recommendation && (
                      <div className="bg-muted rounded-lg p-3 border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">AI Recommendation</span>
                            <Badge variant="outline" className="text-xs">
                              {issue.recommendation.confidence}% confidence
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {issue.recommendation.successRate}% success rate
                          </Badge>
                        </div>
                        
                        <p className="text-sm font-medium mb-1">
                          {issue.recommendation.action}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {issue.recommendation.reasoning}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Est. {issue.recommendation.estimatedTime} to resolve
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => router.push(`/investigate?issue=${issue.id}`)}
                            >
                              Investigate Manually
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleAIRecommendation(issue)}
                              disabled={aiProcessing}
                            >
                              {aiProcessing ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Zap className="h-3 w-3 mr-1" />
                              )}
                              Apply AI Solution
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* System Health Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              Infrastructure Health
            </CardTitle>
            <CardDescription>Real-time status of critical systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {systemHealthMetrics.map(metric => (
                <div 
                  key={metric.system}
                  className={cn(
                    "border rounded-lg p-3",
                    metric.status === 'critical' && "border-destructive/50 bg-destructive/5",
                    metric.status === 'degraded' && "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{metric.system}</span>
                    <span className={cn("text-xs", getHealthColor(metric.status))}>
                      {metric.status}
                    </span>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-semibold">
                        {metric.metrics.current}
                        <span className="text-xs text-muted-foreground ml-1">
                          {metric.metrics.unit}
                        </span>
                      </p>
                    </div>
                    <div className={cn(
                      "flex items-center text-xs",
                      metric.metrics.trend === 'up' && metric.status === 'critical' ? 'text-destructive' :
                      metric.metrics.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                      metric.metrics.trend === 'down' ? 'text-amber-600 dark:text-amber-400' :
                      'text-gray-500'
                    )}>
                      {getTrendIcon(metric.metrics.trend)}
                    </div>
                  </div>

                  {metric.prediction && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {metric.prediction}
                    </p>
                  )}

                  {metric.metrics.threshold && (
                    <Progress 
                      value={(metric.metrics.current / metric.metrics.threshold) * 100} 
                      className="h-1 mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Operational Intelligence Dashboard */}
        <div className="grid grid-cols-3 gap-6">
          {/* Pipeline Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Pipeline Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pipelineHealth.map(metric => (
                <div key={metric.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      metric.status === 'warning' && "text-amber-600 dark:text-amber-400",
                      metric.status === 'critical' && "text-destructive"
                    )}>
                      {metric.value}
                    </span>
                    {metric.change !== undefined && (
                      <span className={cn(
                        "text-xs flex items-center",
                        metric.trend === 'up' && metric.status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                        metric.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                        'text-destructive'
                      )}>
                        {metric.trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(metric.change)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <Separator className="my-2" />
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push('/pipelines')}
              >
                View All Pipelines
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Resource Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Resource Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resourceMetrics.map(metric => (
                <div key={metric.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      metric.status === 'warning' && "text-amber-600 dark:text-amber-400"
                    )}>
                      {metric.value}
                    </span>
                    {metric.change !== undefined && (
                      <span className={cn(
                        "text-xs flex items-center",
                        (metric.label === 'Cost Today' && metric.trend === 'down') || 
                        (metric.label !== 'Cost Today' && metric.trend === 'up') ? 'text-green-600 dark:text-green-400' : 
                        'text-amber-600 dark:text-amber-400'
                      )}>
                        {metric.trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(metric.change)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <Separator className="my-2" />
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push('/monitor')}
              >
                Optimization Insights
                <Sparkles className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Team Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamQueue.map(task => (
                <div key={task.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTaskIcon(task.type)}
                    <span className="text-sm text-muted-foreground capitalize">
                      {task.type}s
                    </span>
                    {task.urgent && (
                      <Badge variant="destructive" className="text-xs h-4">
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    task.urgent && "text-amber-600 dark:text-amber-400",
                    task.count === 0 && "text-muted-foreground"
                  )}>
                    {task.count}
                  </span>
                </div>
              ))}
              <Separator className="my-2" />
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push('/tasks')}
              >
                View All Tasks
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI-Powered Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI-Powered Actions
            </CardTitle>
            <CardDescription>Contextual recommendations based on current system state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant="outline"
                className="justify-start h-auto py-3 px-4"
                onClick={() => router.push('/investigate?ai=true')}
              >
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 mt-0.5 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Smart Investigation</div>
                    <div className="text-xs text-muted-foreground">
                      AI-guided root cause analysis
                    </div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="justify-start h-auto py-3 px-4"
                onClick={() => router.push('/optimize?ai=true')}
              >
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Optimize Performance</div>
                    <div className="text-xs text-muted-foreground">
                      Find bottlenecks & improvements
                    </div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="justify-start h-auto py-3 px-4"
                onClick={() => router.push('/predict?ai=true')}
              >
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Predictive Alerts</div>
                    <div className="text-xs text-muted-foreground">
                      Prevent issues before they occur
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