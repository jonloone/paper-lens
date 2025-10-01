'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Play,
  Pause,
  ExternalLink,
  Clock,
  Activity,
  GitBranch,
  Zap,
  Database,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PipelineSuccessChart,
  ResourceUsageChart,
  DataQualityChart
} from '@/components/design-system/HeroTerminalChart';

interface SystemStatus {
  overall: 'operational' | 'degraded' | 'critical';
  healthyPercent: number;
  issuesCount: number;
  lastIncident: string;
}

interface Issue {
  id: string;
  severity: 'critical' | 'warning';
  pipeline: string;
  message: string;
  timeSince: string;
  blockedPipelines: string[];
  affectedTeams: number;
  downstreamConsumers: number;
}

interface RunningPipeline {
  dag_id: string;
  progress: number;
  eta: string;
  startTime: string;
}

interface SLAStatus {
  onTime: number;
  atRisk: number;
  breached: number;
  atRiskPipelines: Array<{
    name: string;
    completion: number;
    timeNeeded: string;
  }>;
}

const AIRFLOW_URL = process.env.NEXT_PUBLIC_AIRFLOW_URL || 'http://localhost:8080';

export default function MonitorOverviewPage() {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Mock data
  const systemStatus: SystemStatus = {
    overall: 'operational',
    healthyPercent: 94,
    issuesCount: 2,
    lastIncident: '3 days ago'
  };

  const activeIssues: Issue[] = [
    {
      id: '1',
      severity: 'critical',
      pipeline: 'customer_360_pipeline',
      message: 'FAILED 15m ago - Source table not found',
      timeSince: '15m ago',
      blockedPipelines: ['marketing_dashboard', 'churn_model', 'ltv_calculator'],
      affectedTeams: 3,
      downstreamConsumers: 12
    },
    {
      id: '2',
      severity: 'warning',
      pipeline: 'revenue_metrics',
      message: 'DEGRADED - Quality: 72% (3 checks failing)',
      timeSince: '1h ago',
      blockedPipelines: [],
      affectedTeams: 1,
      downstreamConsumers: 4
    }
  ];

  const runningPipelines: RunningPipeline[] = [
    { dag_id: 'customer_churn_score', progress: 65, eta: '14m', startTime: '8:00 AM' },
    { dag_id: 'product_analytics_daily', progress: 32, eta: '28m', startTime: '8:15 AM' },
    { dag_id: 'daily_aggregation', progress: 98, eta: '1m', startTime: '8:30 AM' }
  ];

  const slaStatus: SLAStatus = {
    onTime: 43,
    atRisk: 5,
    breached: 2,
    atRiskPipelines: [
      { name: 'customer_ltv', completion: 78, timeNeeded: '45m' },
      { name: 'weekly_cohorts', completion: 45, timeNeeded: 'upstream delayed' }
    ]
  };

  const handleRefresh = () => {
    setLoading(true);
    setLastUpdated(new Date());
    setTimeout(() => setLoading(false), 1000);
  };

  const getStatusConfig = () => {
    switch (systemStatus.overall) {
      case 'operational':
        return {
          icon: CheckCircle,
          iconClass: 'text-green-600',
          text: 'All systems operational',
          bgClass: 'bg-green-50 dark:bg-green-950/20 border-l-green-600'
        };
      case 'degraded':
        return {
          icon: AlertTriangle,
          iconClass: 'text-yellow-600',
          text: 'Degraded performance',
          bgClass: 'bg-yellow-50 dark:bg-yellow-950/20 border-l-yellow-600'
        };
      case 'critical':
        return {
          icon: AlertCircle,
          iconClass: 'text-destructive',
          text: 'Critical issues detected',
          bgClass: 'bg-red-50 dark:bg-red-950/20 border-l-destructive'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen">
      <div className="max-w-[1584px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-12">

        {/* System Status Banner */}
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-16 gap-6 mb-6">
          <div className="col-span-full">
            <Card elevation="elevated-2" className={cn("border-l-4", statusConfig.bgClass)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-6 mb-2">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={cn("h-6 w-6", statusConfig.iconClass)} />
                        <h1 className="text-2xl font-bold">{statusConfig.text}</h1>
                      </div>
                      <Badge variant={systemStatus.overall === 'operational' ? 'secondary' : 'destructive'}>
                        {systemStatus.healthyPercent}% healthy
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {systemStatus.issuesCount} {systemStatus.issuesCount === 1 ? 'issue' : 'issues'} requiring attention • Last incident: {systemStatus.lastIncident}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Issues */}
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-16 gap-6 mb-6">
          <div className="col-span-full">
            <Card elevation="elevated-3">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Active Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {activeIssues.map((issue) => (
                    <Card key={issue.id} elevation="elevated-1" className="border-l-4 border-l-destructive">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={issue.severity === 'critical' ? 'destructive' : 'default'}>
                                  {issue.severity === 'critical' ? 'Critical' : 'Warning'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {issue.timeSince}
                                </span>
                              </div>
                              <h3 className="text-sm font-medium mb-2 font-mono">{issue.pipeline}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {issue.message}
                              </p>

                              {issue.blockedPipelines.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Blocked pipelines:</span> {issue.blockedPipelines.join(', ')}
                                </p>
                              )}

                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Impact:</span> {issue.affectedTeams} teams, {issue.downstreamConsumers} downstream consumers
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="default">
                              Investigate
                            </Button>
                            <Button size="sm" variant="outline">
                              Restart
                            </Button>
                            <Button size="sm" variant="outline">
                              Create incident
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pipeline Health & Live Execution */}
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-16 gap-6 mb-6">
          {/* Pipeline Health */}
          <div className="col-span-full lg:col-span-8">
            <Card elevation="elevated-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Pipeline Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PipelineSuccessChart height={280} />
              </CardContent>
            </Card>
          </div>

          {/* Live Execution */}
          <div className="col-span-full lg:col-span-8">
            <Card elevation="elevated-2" className="h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Live Execution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {runningPipelines.map((pipeline) => (
                    <div key={pipeline.dag_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono font-medium">{pipeline.dag_id}</span>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{pipeline.progress}%</Badge>
                          <span className="text-xs text-muted-foreground">ETA: {pipeline.eta}</span>
                        </div>
                      </div>
                      <Progress value={pipeline.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Started: {pipeline.startTime}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resource Usage & Data Quality */}
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-16 gap-6 mb-6">
          <div className="col-span-full lg:col-span-8">
            <Card elevation="elevated-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Infrastructure Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceUsageChart height={280} />
              </CardContent>
            </Card>
          </div>

          <div className="col-span-full lg:col-span-8">
            <Card elevation="elevated-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Data Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataQualityChart height={280} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SLA Performance */}
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-16 gap-6">
          <div className="col-span-full">
            <Card elevation="elevated-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  SLA Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">{slaStatus.onTime}</div>
                      <div className="text-sm text-muted-foreground">On-time</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    <div>
                      <div className="text-2xl font-bold">{slaStatus.atRisk}</div>
                      <div className="text-sm text-muted-foreground">At-risk</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <div>
                      <div className="text-2xl font-bold">{slaStatus.breached}</div>
                      <div className="text-sm text-muted-foreground">Breached</div>
                    </div>
                  </div>
                </div>

                {slaStatus.atRiskPipelines.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      At Risk (Next 2h)
                    </h4>
                    <div className="space-y-2">
                      {slaStatus.atRiskPipelines.map((pipeline, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm font-mono font-medium">{pipeline.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {pipeline.completion}% complete • {pipeline.timeNeeded}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
