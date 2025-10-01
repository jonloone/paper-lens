'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Users,
  BarChart3,
  GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface CriticalIssue {
  id: string;
  pipeline: string;
  error: string;
  blockedPipelines: number;
  status: 'critical' | 'warning';
}

interface PipelineStatus {
  domain: string;
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  quality: number | null;
  latency: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
}

interface Incident {
  id: string;
  time: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
}

interface SystemResource {
  name: string;
  usage: number;
  status: 'normal' | 'warning' | 'critical';
}

// ============================================================================
// Mock Data
// ============================================================================

const mockCriticalIssues: CriticalIssue[] = [
  {
    id: '1',
    pipeline: 'customer_churn',
    error: 'OOM Error',
    blockedPipelines: 8,
    status: 'critical'
  },
  {
    id: '2',
    pipeline: 'financial_report',
    error: 'Schema mismatch',
    blockedPipelines: 3,
    status: 'critical'
  }
];

const mockPipelines: PipelineStatus[] = [
  { domain: 'Customer', name: 'churn_model', status: 'failed', quality: null, latency: '--', trend: 'down', trendValue: '12%' },
  { domain: 'Customer', name: 'segmentation', status: 'degraded', quality: 92, latency: '+45m', trend: 'down', trendValue: '5%' },
  { domain: 'Customer', name: 'daily_aggregate', status: 'healthy', quality: 96, latency: '12m', trend: 'stable', trendValue: '0%' },
  { domain: 'Customer', name: 'retention_calc', status: 'healthy', quality: 94, latency: '8m', trend: 'up', trendValue: '2%' },
  { domain: 'Financial', name: 'revenue_forecast', status: 'healthy', quality: 97, latency: '22m', trend: 'stable', trendValue: '0%' },
  { domain: 'Financial', name: 'expense_report', status: 'healthy', quality: 98, latency: '15m', trend: 'stable', trendValue: '0%' },
];

const mockIncidents: Incident[] = [
  { id: '1', time: '14:32', message: 'Spark job failure → 3 retries', type: 'error' },
  { id: '2', time: '14:28', message: 'Slow query detected in Trino', type: 'warning' },
  { id: '3', time: '14:15', message: 'Schema evolution completed', type: 'success' },
  { id: '4', time: '13:45', message: 'Backfill started (45% done)', type: 'info' },
  { id: '5', time: '13:30', message: 'Pattern applied successfully', type: 'success' },
];

const mockSystemResources: SystemResource[] = [
  { name: 'Spark', usage: 85, status: 'warning' },
  { name: 'Trino', usage: 42, status: 'normal' },
  { name: 'Airflow', usage: 71, status: 'normal' },
  { name: 'Storage', usage: 93, status: 'critical' },
  { name: 'Network', usage: 31, status: 'normal' },
];

// ============================================================================
// Components
// ============================================================================

function TrendIndicator({ trend, value }: { trend: string; value: string }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const colorClass = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-1">
      <Icon className={cn("h-3 w-3", colorClass)} />
      <span className={cn("text-sm font-medium", colorClass)}>{value}</span>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: string;
  description: string;
  icon: React.ReactNode;
}

function MetricCard({ title, value, trend, description, icon }: MetricCardProps) {
  const trendIsPositive = trend.startsWith('+');
  const trendIsNeutral = trend.startsWith('→') || trend === '0%';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <div className="flex items-center pt-1">
          <span className={cn(
            "text-xs font-medium",
            trendIsPositive ? "text-green-600" :
            trendIsNeutral ? "text-muted-foreground" :
            "text-red-600"
          )}>
            {trend} from last period
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function OverviewPage() {
  const criticalCount = 2;
  const degradedCount = 5;
  const healthyCount = 135;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Alert Bar */}
      <Alert variant={criticalCount > 0 ? "destructive" : "default"}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <span className="font-medium">{criticalCount} Critical</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{degradedCount} Degraded</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-muted-foreground">{healthyCount} Healthy</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Last sync: 30s ago
          </span>
        </AlertDescription>
      </Alert>

      {/* Main Grid Layout - 12 column system */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        {/* Critical Issues - 3 columns */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <Badge variant="destructive">{mockCriticalIssues.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCriticalIssues.map((issue) => (
                <div key={issue.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{issue.pipeline}</p>
                      <p className="text-xs text-muted-foreground">{issue.error}</p>
                      <p className="text-xs text-muted-foreground">
                        {issue.blockedPipelines} pipelines blocked
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs">
                      Apply Fix
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Details
                    </Button>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Status - 9 columns */}
        <Card className="col-span-full lg:col-span-9">
          <CardHeader>
            <CardTitle>Pipeline Status</CardTitle>
            <CardDescription>Real-time health across all domains</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead className="text-right">24h Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPipelines.map((pipeline, idx) => (
                  <TableRow key={`${pipeline.domain}-${pipeline.name}`}>
                    <TableCell className="font-medium">{pipeline.domain}</TableCell>
                    <TableCell className="font-mono text-xs">{pipeline.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          pipeline.status === 'failed' ? 'destructive' :
                          pipeline.status === 'degraded' ? 'secondary' :
                          'outline'
                        }
                      >
                        {pipeline.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pipeline.quality ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{pipeline.quality}%</span>
                          <Progress value={pipeline.quality} className="w-[60px] h-2" />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">{pipeline.latency}</TableCell>
                    <TableCell className="text-right">
                      <TrendIndicator trend={pipeline.trend} value={pipeline.trendValue} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        {/* Active Incidents - 7 columns */}
        <Card className="col-span-full lg:col-span-7">
          <CardHeader>
            <CardTitle>Active Incidents</CardTitle>
            <CardDescription>Recent activity and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between py-2 hover:bg-muted/50 rounded-lg px-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono min-w-[42px]">
                      {incident.time}
                    </span>
                    <span className="text-sm">{incident.message}</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {incident.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Resources - 5 columns */}
        <Card className="col-span-full lg:col-span-5">
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
            <CardDescription>Current utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockSystemResources.map((resource) => (
              <div key={resource.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{resource.name}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    resource.status === 'critical' ? 'text-red-600' :
                    resource.status === 'warning' ? 'text-amber-600' :
                    'text-muted-foreground'
                  )}>
                    {resource.usage}%
                  </span>
                </div>
                <Progress
                  value={resource.usage}
                  className={cn(
                    "h-2",
                    resource.status === 'critical' && "[&>div]:bg-red-600",
                    resource.status === 'warning' && "[&>div]:bg-amber-500"
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Pattern Library"
          value={23}
          trend="+15%"
          description="Patterns used this week"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          title="Team Activity"
          value={47}
          trend="+8%"
          description="Actions completed"
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Quality Score"
          value="94%"
          trend="+2%"
          description="Average across domains"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MetricCard
          title="Recent Changes"
          value={156}
          trend="→ 0%"
          description="In the last 24 hours"
          icon={<GitBranch className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
