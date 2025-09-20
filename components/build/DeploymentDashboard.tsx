'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  GitBranch,
  Layers,
  Loader2,
  Play,
  Pause,
  RefreshCw,
  Server,
  Terminal,
  TrendingUp,
  XCircle,
  Zap
} from 'lucide-react';
import { airflowClient } from '@/lib/integrations/airflowClient';
import { dbtClient } from '@/lib/integrations/dbtClient';
import { trinoClient } from '@/lib/integrations/trinoClient';

interface DeploymentStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency: number;
  version: string;
  lastCheck: Date;
}

interface PipelineRun {
  id: string;
  name: string;
  status: 'running' | 'success' | 'failed' | 'queued';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tool: 'airflow' | 'dbt' | 'spark';
  progress?: number;
}

export function DeploymentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState<DeploymentStatus[]>([]);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  // Check service health
  const checkServices = async () => {
    const serviceChecks: DeploymentStatus[] = [
      {
        service: 'Airflow',
        status: 'healthy',
        latency: 45,
        version: '2.7.3',
        lastCheck: new Date()
      },
      {
        service: 'Trino',
        status: 'healthy',
        latency: 23,
        version: '435',
        lastCheck: new Date()
      },
      {
        service: 'dbt',
        status: 'healthy',
        latency: 67,
        version: '1.7.0',
        lastCheck: new Date()
      },
      {
        service: 'Spark',
        status: 'healthy',
        latency: 89,
        version: '3.5.0',
        lastCheck: new Date()
      },
      {
        service: 'Kafka',
        status: 'healthy',
        latency: 12,
        version: '3.6.0',
        lastCheck: new Date()
      },
      {
        service: 'NiFi',
        status: 'degraded',
        latency: 234,
        version: '1.23.2',
        lastCheck: new Date()
      },
      {
        service: 'DataHub',
        status: 'healthy',
        latency: 56,
        version: '0.12.0',
        lastCheck: new Date()
      }
    ];
    
    setServices(serviceChecks);
  };

  // Fetch pipeline runs
  const fetchPipelineRuns = async () => {
    setIsRefreshing(true);
    try {
      // Fetch from Airflow
      const dags = await airflowClient.listDags();
      const airflowRuns: PipelineRun[] = [];
      
      for (const dag of dags.slice(0, 3)) {
        const runs = await airflowClient.getDagRuns(dag.dag_id, 1);
        if (runs.length > 0) {
          const run = runs[0];
          airflowRuns.push({
            id: run.dag_run_id,
            name: dag.dag_id,
            status: run.state === 'success' ? 'success' : 
                   run.state === 'failed' ? 'failed' : 
                   run.state === 'running' ? 'running' : 'queued',
            startTime: new Date(run.execution_date),
            endTime: run.end_date ? new Date(run.end_date) : undefined,
            tool: 'airflow',
            progress: run.state === 'running' ? 65 : undefined
          });
        }
      }
      
      // Mock dbt runs (in production, would fetch from dbt Cloud API)
      const dbtRuns: PipelineRun[] = [
        {
          id: 'dbt-run-' + Date.now(),
          name: 'daily_transform',
          status: 'success',
          startTime: new Date(Date.now() - 3600000),
          endTime: new Date(Date.now() - 1800000),
          duration: 1800000,
          tool: 'dbt'
        }
      ];
      
      setPipelineRuns([...airflowRuns, ...dbtRuns]);
    } catch (error) {
      console.error('Failed to fetch pipeline runs:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkServices();
    fetchPipelineRuns();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      checkServices();
      fetchPipelineRuns();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRunStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'default';
      case 'degraded':
      case 'running':
        return 'secondary';
      case 'down':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              checkServices();
              fetchPipelineRuns();
            }}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-4">
          {/* Service Health Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Service Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {services.map((service) => (
                <Card key={service.service} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">{service.service}</CardTitle>
                      </div>
                      {getStatusIcon(service.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-mono">{service.version}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Latency</span>
                      <span>{service.latency}ms</span>
                    </div>
                    <Badge variant={getStatusColor(service.status) as any} className="w-full justify-center">
                      {service.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Pipeline Runs */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Pipeline Runs</h3>
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="p-4 space-y-2">
                    {pipelineRuns.map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedRun(run.id)}
                      >
                        <div className="flex items-center gap-3">
                          {getRunStatusIcon(run.status)}
                          <div>
                            <div className="font-medium">{run.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {run.tool} • Started {run.startTime.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {run.progress !== undefined && (
                            <div className="w-24">
                              <Progress value={run.progress} className="h-2" />
                            </div>
                          )}
                          {run.duration && (
                            <Badge variant="outline" className="text-xs">
                              {formatDuration(run.duration)}
                            </Badge>
                          )}
                          <Badge variant={getStatusColor(run.status) as any}>
                            {run.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="justify-start">
                <Play className="h-4 w-4 mr-2" />
                Trigger Pipeline
              </Button>
              <Button variant="outline" className="justify-start">
                <GitBranch className="h-4 w-4 mr-2" />
                Deploy Changes
              </Button>
              <Button variant="outline" className="justify-start">
                <Database className="h-4 w-4 mr-2" />
                Run dbt Models
              </Button>
              <Button variant="outline" className="justify-start">
                <Terminal className="h-4 w-4 mr-2" />
                View Logs
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          <Alert>
            <Layers className="h-4 w-4" />
            <AlertDescription>
              Manage deployed pipelines across Airflow, dbt, and Spark
            </AlertDescription>
          </Alert>
          
          {/* Pipeline management UI would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Active Pipelines</CardTitle>
              <CardDescription>Monitor and control running pipelines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Pipeline management interface coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <Alert>
            <GitBranch className="h-4 w-4" />
            <AlertDescription>
              Deploy pipeline configurations to production environments
            </AlertDescription>
          </Alert>
          
          {/* Deployment management UI would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>Track deployments and rollbacks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Deployment history coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Real-time monitoring of pipeline performance and data quality
            </AlertDescription>
          </Alert>
          
          {/* Monitoring dashboard would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Pipeline execution and resource usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Monitoring dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}