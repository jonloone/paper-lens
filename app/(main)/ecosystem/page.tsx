'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Zap,
  Square,
  Database,
  GitBranch,
  Activity,
  TrendingUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SystemStatus {
  id: string;
  name: string;
  category: string;
  status: 'healthy' | 'degraded' | 'down';
  metrics: {
    name: string;
    value: string | number;
  }[];
  url?: string;
}

interface CriticalIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  system: string;
  time: string;
  quickAction?: {
    label: string;
    action: () => void;
  };
}

interface Activity {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  time: string;
  icon?: React.ReactNode;
}

export default function EcosystemDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Mock data - in production, this would come from APIs
  const [systemHealth, setSystemHealth] = useState({
    healthy: 8,
    degraded: 2,
    down: 1
  });

  const [criticalIssues, setCriticalIssues] = useState<CriticalIssue[]>([
    {
      id: '1',
      severity: 'critical',
      title: 'ML Training Pipeline',
      description: 'Spark cluster down',
      system: 'Spark',
      time: '30 min ago',
      quickAction: {
        label: 'Restart Cluster',
        action: () => console.log('Restarting Spark cluster...')
      }
    },
    {
      id: '2',
      severity: 'warning',
      title: 'Customer ETL Slow',
      description: 'NiFi backpressure detected',
      system: 'NiFi',
      time: '2 hours ago',
      quickAction: {
        label: 'Scale Up',
        action: () => console.log('Scaling up NiFi...')
      }
    },
    {
      id: '3',
      severity: 'warning',
      title: 'dbt Models Failed',
      description: '3 test failures',
      system: 'dbt',
      time: '1 hour ago',
      quickAction: {
        label: 'Skip and Continue',
        action: () => console.log('Skipping failed tests...')
      }
    }
  ]);

  const [connectedSystems, setConnectedSystems] = useState<SystemStatus[]>([
    {
      id: 'nifi',
      name: 'NiFi',
      category: 'Processing',
      status: 'degraded',
      metrics: [
        { name: 'Flows', value: '47 active' },
        { name: 'CPU', value: '78%' },
        { name: 'Queue', value: '1.2M' }
      ],
      url: '/nifi'
    },
    {
      id: 'airflow',
      name: 'Airflow',
      category: 'Orchestration',
      status: 'healthy',
      metrics: [
        { name: 'DAGs', value: '23 active' },
        { name: 'Failed', value: '2' },
        { name: 'Success', value: '98%' }
      ],
      url: '/airflow'
    },
    {
      id: 'snowflake',
      name: 'Snowflake',
      category: 'Storage',
      status: 'healthy',
      metrics: [
        { name: 'Uptime', value: '99.9%' },
        { name: 'Query', value: '1.2s avg' },
        { name: 'Credits', value: '82/100' }
      ],
      url: '/snowflake'
    },
    {
      id: 'tableau',
      name: 'Tableau',
      category: 'Analytics',
      status: 'healthy',
      metrics: [
        { name: 'Dashboards', value: '12' },
        { name: 'Updated', value: '5m ago' },
        { name: 'Users', value: '45 active' }
      ],
      url: '/tableau'
    },
    {
      id: 'kafka',
      name: 'Kafka',
      category: 'Streaming',
      status: 'healthy',
      metrics: [
        { name: 'Topics', value: '12' },
        { name: 'Lag', value: '<100ms' },
        { name: 'Throughput', value: '50K/s' }
      ],
      url: '/kafka'
    },
    {
      id: 'mlflow',
      name: 'MLflow',
      category: 'ML/AI',
      status: 'down',
      metrics: [
        { name: 'Status', value: 'Cluster off' },
        { name: 'Models', value: '0 active' },
        { name: 'Experiments', value: 'N/A' }
      ],
      url: '/mlflow'
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      category: 'Databases',
      status: 'healthy',
      metrics: [
        { name: 'Connections', value: '89/100' },
        { name: 'Size', value: '2.3TB' },
        { name: 'QPS', value: '1.2K' }
      ],
      url: '/postgres'
    },
    {
      id: 'datadog',
      name: 'Datadog',
      category: 'Monitoring',
      status: 'healthy',
      metrics: [
        { name: 'Monitors', value: '45 active' },
        { name: 'Alerts', value: '3 open' },
        { name: 'Coverage', value: '100%' }
      ],
      url: '/datadog'
    }
  ]);

  const [recentActivity, setRecentActivity] = useState<Activity[]>([
    {
      id: '1',
      type: 'success',
      message: 'Restarted customer-etl pipeline (auto-recovery successful)',
      time: '15:23',
      icon: <RotateCcw className="h-4 w-4" />
    },
    {
      id: '2',
      type: 'info',
      message: 'dbt customer_360 model completed (47K records processed)',
      time: '15:15',
      icon: <Database className="h-4 w-4" />
    },
    {
      id: '3',
      type: 'warning',
      message: 'Kafka lag increased on user-events topic (now resolved)',
      time: '15:02',
      icon: <AlertCircle className="h-4 w-4" />
    },
    {
      id: '4',
      type: 'info',
      message: 'Airflow financial_reports DAG triggered manually',
      time: '14:45',
      icon: <RefreshCw className="h-4 w-4" />
    }
  ]);

  const [systemMetrics, setSystemMetrics] = useState({
    processingVolume: '2.3M records/hour',
    averageLatency: '4.2 minutes',
    latencyChange: '+30%',
    successRate: '97.8%',
    activePipelines: 23
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleRestartAllFailed = async () => {
    console.log('Restarting all failed pipelines...');
    // Implementation would go here
  };

  const handleScaleUp = async () => {
    console.log('Scaling up processing capacity...');
    // Implementation would go here
  };

  const handleEmergencyStop = async () => {
    console.log('Initiating emergency stop...');
    // Implementation would go here
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'down':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500';
      case 'warning':
        return 'border-yellow-500';
      case 'info':
        return 'border-blue-500';
      default:
        return 'border-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Global Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search systems, pipelines, errors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* System Health Overview */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>System Health Status</AlertTitle>
        <AlertDescription>
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-4">
              <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                {systemHealth.healthy} Healthy
              </Badge>
              <Badge variant="default" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                <AlertCircle className="h-3 w-3 mr-1" />
                {systemHealth.degraded} Degraded
              </Badge>
              <Badge variant="default" className="bg-red-500/10 text-red-600 border-red-500/20">
                <XCircle className="h-3 w-3 mr-1" />
                {systemHealth.down} Down
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Critical Issues</CardTitle>
            <CardDescription>Issues requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalIssues.map(issue => (
              <div key={issue.id} className={cn("border-l-4 pl-4", getSeverityColor(issue.severity))}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {issue.severity}
                      </Badge>
                      <h4 className="font-semibold">{issue.title}</h4>
                      <span className="text-sm text-muted-foreground">{issue.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline">Investigate</Button>
                  {issue.quickAction && (
                    <Button size="sm" onClick={issue.quickAction.action}>
                      {issue.quickAction.label}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Issues (7 total)
            </Button>
          </CardContent>
        </Card>

        {/* System Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium">Processing Volume</span>
                <span className="text-2xl font-bold">{systemMetrics.processingVolume}</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium">Average Latency</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{systemMetrics.averageLatency}</span>
                  <span className="text-sm text-red-500">↑ {systemMetrics.latencyChange}</span>
                </div>
              </div>
              <Progress value={42} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-2xl font-bold">{systemMetrics.successRate}</span>
              </div>
              <Progress value={97.8} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium">Active Operations</span>
                <span className="text-2xl font-bold">{systemMetrics.activePipelines} pipelines</span>
              </div>
              <Progress value={23} max={30} className="h-2" />
            </div>
            <Button variant="outline" className="w-full">
              Detailed Performance Metrics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Connected Systems Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Systems</CardTitle>
          <CardDescription>Status of all integrated tools and platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {connectedSystems.map(system => (
              <Card key={system.id} className={cn(
                "relative overflow-hidden",
                system.status === 'down' && "border-red-500/50",
                system.status === 'degraded' && "border-yellow-500/50"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{system.name}</CardTitle>
                    {getStatusIcon(system.status)}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", getStatusColor(system.status))}
                  >
                    {system.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {system.metrics.map((metric, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{metric.name}:</span>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-3"
                    disabled={system.status === 'down'}
                  >
                    {system.status === 'down' ? 'Start Service' : 'Open UI'}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common operations across your ecosystem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRestartAllFailed}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart All Failed
            </Button>
            <Button onClick={handleScaleUp}>
              <Zap className="h-4 w-4 mr-2" />
              Scale Up Processing
            </Button>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Run Health Check
            </Button>
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Deploy to Staging
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Dashboards
            </Button>
            <Button variant="destructive" onClick={handleEmergencyStop}>
              <Square className="h-4 w-4 mr-2" />
              Emergency Stop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest events across your data ecosystem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                <div className={cn("flex-shrink-0", getActivityIcon(activity.type))}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View Full Activity Log
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}