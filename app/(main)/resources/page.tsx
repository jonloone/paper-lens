'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server,
  Cpu,
  HardDrive,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  Settings,
  RefreshCw,
  Scale,
  Gauge,
  Database,
  Globe,
  Layers
} from 'lucide-react';

// Mock cluster data
const CLUSTER_METRICS = {
  trino: {
    name: 'Trino Cluster',
    status: 'healthy',
    nodes: 12,
    activeQueries: 45,
    queuedQueries: 3,
    cpu: 68,
    memory: 72,
    storage: 45,
    throughput: '2.3GB/s',
    latency: '234ms',
    uptime: '99.98%'
  },
  spark: {
    name: 'Spark Cluster',
    status: 'healthy',
    nodes: 8,
    activeJobs: 12,
    executors: 32,
    cpu: 82,
    memory: 78,
    storage: 62,
    throughput: '1.8GB/s',
    shuffleRead: '450MB/s',
    uptime: '99.95%'
  },
  airflow: {
    name: 'Airflow Scheduler',
    status: 'warning',
    workers: 6,
    runningDags: 23,
    queuedTasks: 145,
    cpu: 45,
    memory: 52,
    taskSlots: 48,
    avgTaskDuration: '12m',
    successRate: '94%',
    uptime: '99.99%'
  },
  storage: {
    name: 'Data Lake Storage',
    status: 'healthy',
    totalSize: '450TB',
    used: '312TB',
    available: '138TB',
    usage: 69,
    dailyIngestion: '2.4TB',
    dailyProcessing: '8.2TB',
    replicationFactor: 3,
    compressionRatio: '3.2:1'
  }
};

const COST_BREAKDOWN = [
  { service: 'Compute (Spark/Trino)', cost: 12450, trend: 'up', change: '+8%' },
  { service: 'Storage (S3/HDFS)', cost: 8320, trend: 'stable', change: '+1%' },
  { service: 'Network Transfer', cost: 2150, trend: 'down', change: '-12%' },
  { service: 'Managed Services', cost: 3200, trend: 'stable', change: '0%' }
];

const ACTIVE_USERS = [
  { name: 'data-eng-team', queries: 234, compute: '45 core-hours' },
  { name: 'analytics-team', queries: 189, compute: '32 core-hours' },
  { name: 'ml-team', queries: 456, compute: '128 core-hours' },
  { name: 'bi-team', queries: 89, compute: '12 core-hours' }
];

export default function ResourcesDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = (value: number) => {
    if (value < 60) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Resource Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and optimize your data infrastructure resources
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={autoRefresh ? 'secondary' : 'outline'} 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', autoRefresh && 'animate-spin')} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure Alerts
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <strong>Resource Alert:</strong> Airflow task queue is backing up (145 tasks queued). 
          Consider scaling workers or optimizing DAG schedules.
        </AlertDescription>
      </Alert>

      {/* Cluster Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Trino Cluster */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">Trino Cluster</CardTitle>
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className={cn('h-3 w-3 mr-1', getStatusColor('healthy'))} />
                Healthy
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CPU Usage</span>
                <span className="font-medium">{CLUSTER_METRICS.trino.cpu}%</span>
              </div>
              <Progress value={CLUSTER_METRICS.trino.cpu} className="h-2" />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-medium">{CLUSTER_METRICS.trino.memory}%</span>
              </div>
              <Progress value={CLUSTER_METRICS.trino.memory} className="h-2" />
              
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Queries:</span>
                    <p className="font-medium">{CLUSTER_METRICS.trino.activeQueries} active</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nodes:</span>
                    <p className="font-medium">{CLUSTER_METRICS.trino.nodes} online</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spark Cluster */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">Spark Cluster</CardTitle>
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className={cn('h-3 w-3 mr-1', getStatusColor('healthy'))} />
                Healthy
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CPU Usage</span>
                <span className="font-medium">{CLUSTER_METRICS.spark.cpu}%</span>
              </div>
              <Progress value={CLUSTER_METRICS.spark.cpu} className="h-2 bg-red-500" />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-medium">{CLUSTER_METRICS.spark.memory}%</span>
              </div>
              <Progress value={CLUSTER_METRICS.spark.memory} className="h-2" />
              
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Jobs:</span>
                    <p className="font-medium">{CLUSTER_METRICS.spark.activeJobs} running</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Executors:</span>
                    <p className="font-medium">{CLUSTER_METRICS.spark.executors} active</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Airflow */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">Airflow</CardTitle>
              <Badge variant="warning" className="text-xs">
                <AlertTriangle className={cn('h-3 w-3 mr-1', getStatusColor('warning'))} />
                Warning
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CPU Usage</span>
                <span className="font-medium">{CLUSTER_METRICS.airflow.cpu}%</span>
              </div>
              <Progress value={CLUSTER_METRICS.airflow.cpu} className="h-2" />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Task Queue</span>
                <span className="font-medium text-yellow-600">{CLUSTER_METRICS.airflow.queuedTasks}</span>
              </div>
              <Progress value={75} className="h-2 bg-yellow-500" />
              
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">DAGs:</span>
                    <p className="font-medium">{CLUSTER_METRICS.airflow.runningDags} active</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Workers:</span>
                    <p className="font-medium">{CLUSTER_METRICS.airflow.workers} online</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">Data Lake</CardTitle>
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className={cn('h-3 w-3 mr-1', getStatusColor('healthy'))} />
                Healthy
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Storage Used</span>
                <span className="font-medium">{CLUSTER_METRICS.storage.usage}%</span>
              </div>
              <Progress value={CLUSTER_METRICS.storage.usage} className="h-2" />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Size</span>
                <span className="font-medium">{CLUSTER_METRICS.storage.used}/{CLUSTER_METRICS.storage.totalSize}</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Ingestion:</span>
                    <p className="font-medium">{CLUSTER_METRICS.storage.dailyIngestion}/day</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Processing:</span>
                    <p className="font-medium">{CLUSTER_METRICS.storage.dailyProcessing}/day</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics and Cost */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Query Throughput</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">2,345 queries/hour</span>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    +12%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg Query Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">1.8s</span>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingDown className="h-3 w-3 mr-1 text-green-600" />
                    -15%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Data Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">8.2TB/day</span>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    +5%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">System Uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">99.97%</span>
                  <Badge variant="secondary" className="text-xs">
                    Excellent
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Monthly Cost Analysis</CardTitle>
              <span className="text-2xl font-bold">$26,120</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {COST_BREAKDOWN.map((item) => (
                <div key={item.service} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${item.cost.toLocaleString()}</span>
                    <Badge 
                      variant={item.trend === 'up' ? 'destructive' : item.trend === 'down' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {item.change}
                    </Badge>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 mt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget Remaining</span>
                  <span className="font-medium text-green-600">$8,880 (25%)</span>
                </div>
                <Progress value={75} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Resource Consumption by Team</CardTitle>
            <Button size="sm" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              View All Users
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ACTIVE_USERS.map((user) => (
              <div key={user.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.queries} queries today</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{user.compute}</p>
                  <p className="text-sm text-muted-foreground">compute usage</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}