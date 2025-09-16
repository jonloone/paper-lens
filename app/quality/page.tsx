'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Gauge, Activity, AlertTriangle, BarChart3, Zap,
  CheckCircle, XCircle, Clock, TrendingUp, TrendingDown,
  Brain, Bot, Sparkles, ArrowRight, RefreshCw,
  Play, Pause, Settings, Eye, Download, Filter
} from 'lucide-react';
import { PrioritizedAlerts } from '@/components/monitor/PrioritizedAlerts';
import { ArbitronMetrics } from '@/components/monitor/ArbitronMetrics';
import { crewAIService } from '@/lib/services/CrewAIService';

// Types for quality metrics
interface QualityMetric {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  issues: number;
  lastCheck: Date;
}

interface PipelineHealth {
  id: string;
  name: string;
  status: 'running' | 'failed' | 'succeeded' | 'paused';
  duration: number;
  successRate: number;
  lastRun: Date;
  nextRun?: Date;
}

interface PerformanceMetric {
  resource: string;
  utilization: number;
  trend: 'up' | 'down' | 'stable';
  threshold: number;
}

export default function QualityMonitoringPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'dashboard';
  
  // State for various metrics
  const [systemHealth, setSystemHealth] = useState({
    overall: 92,
    pipelines: 87,
    quality: 94,
    performance: 89
  });

  const [qualityMetrics] = useState<QualityMetric[]>([
    { name: 'Customer Data', score: 96, trend: 'up', issues: 2, lastCheck: new Date() },
    { name: 'Sales Pipeline', score: 89, trend: 'down', issues: 5, lastCheck: new Date() },
    { name: 'Event Stream', score: 94, trend: 'stable', issues: 1, lastCheck: new Date() },
    { name: 'Product Catalog', score: 98, trend: 'up', issues: 0, lastCheck: new Date() }
  ]);

  const [pipelines] = useState<PipelineHealth[]>([
    {
      id: 'pipe-001',
      name: 'Customer ETL',
      status: 'running',
      duration: 45,
      successRate: 98.5,
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 3600000)
    },
    {
      id: 'pipe-002',
      name: 'Sales Aggregation',
      status: 'failed',
      duration: 0,
      successRate: 85.2,
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 1800000)
    },
    {
      id: 'pipe-003',
      name: 'Event Processing',
      status: 'succeeded',
      duration: 120,
      successRate: 99.1,
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 900000)
    }
  ]);

  const [performanceMetrics] = useState<PerformanceMetric[]>([
    { resource: 'Query Response Time', utilization: 250, trend: 'up', threshold: 500 },
    { resource: 'CPU Usage', utilization: 65, trend: 'stable', threshold: 80 },
    { resource: 'Memory Usage', utilization: 72, trend: 'up', threshold: 90 },
    { resource: 'Storage', utilization: 45, trend: 'up', threshold: 80 }
  ]);

  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailType, setDetailType] = useState<'alert' | 'quality' | 'performance' | null>(null);

  // Mock alerts for prioritization
  const [alerts] = useState([
    {
      id: 'alert-001',
      severity: 'critical' as const,
      type: 'pipeline_failure',
      message: 'Sales Aggregation pipeline failed',
      source: 'airflow',
      timestamp: new Date().toISOString()
    },
    {
      id: 'alert-002',
      severity: 'high' as const,
      type: 'quality_degradation',
      message: 'Data quality score dropped below threshold',
      source: 'quality_monitor',
      timestamp: new Date().toISOString()
    },
    {
      id: 'alert-003',
      severity: 'medium' as const,
      type: 'performance_warning',
      message: 'Query response time increasing',
      source: 'performance_monitor',
      timestamp: new Date().toISOString()
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'succeeded': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Main Dashboard (Left 60%) */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Gauge className="w-8 h-8" />
                Quality & Monitoring
              </h1>
              <p className="text-muted-foreground mt-1">
                Maintain confidence in data reliability and system health
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* System Health Summary */}
          <Card>
            <CardHeader>
              <CardTitle>System Health Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall</span>
                    <span className="text-2xl font-bold">{systemHealth.overall}%</span>
                  </div>
                  <Progress value={systemHealth.overall} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pipelines</span>
                    <span className="text-2xl font-bold">{systemHealth.pipelines}%</span>
                  </div>
                  <Progress value={systemHealth.pipelines} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quality</span>
                    <span className="text-2xl font-bold">{systemHealth.quality}%</span>
                  </div>
                  <Progress value={systemHealth.quality} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Performance</span>
                    <span className="text-2xl font-bold">{systemHealth.performance}%</span>
                  </div>
                  <Progress value={systemHealth.performance} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={activeTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Health Dashboard</TabsTrigger>
              <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
              <TabsTrigger value="metrics">Quality Metrics</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Quality Score Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quality Score Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {qualityMetrics.map((metric) => (
                        <div 
                          key={metric.name} 
                          className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded"
                          onClick={() => {
                            setSelectedDetail(metric);
                            setDetailType('quality');
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{metric.name}</span>
                            {getTrendIcon(metric.trend)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{metric.score}%</span>
                            {metric.issues > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {metric.issues} issues
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pipeline Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pipeline Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pipelines.map((pipeline) => (
                        <div 
                          key={pipeline.id}
                          className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded"
                          onClick={() => {
                            setSelectedDetail(pipeline);
                            setDetailType('alert');
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(pipeline.status)}
                            <span className="text-sm font-medium">{pipeline.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{pipeline.successRate}%</p>
                            <p className="text-xs text-muted-foreground">success rate</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {performanceMetrics.map((metric) => (
                      <div 
                        key={metric.resource}
                        className="space-y-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                        onClick={() => {
                          setSelectedDetail(metric);
                          setDetailType('performance');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{metric.resource}</span>
                            {getTrendIcon(metric.trend)}
                          </div>
                          <span className="text-sm font-bold">
                            {metric.resource.includes('Time') ? `${metric.utilization}ms` :
                             metric.resource.includes('Storage') ? `${metric.utilization}%` :
                             `${metric.utilization}%`}
                          </span>
                        </div>
                        <Progress 
                          value={(metric.utilization / metric.threshold) * 100} 
                          className="h-1.5"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <PrioritizedAlerts alerts={alerts} />
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Quality Metrics</CardTitle>
                  <CardDescription>
                    Comprehensive quality scoring across all data products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Quality metrics grid */}
                  <div className="grid grid-cols-1 gap-4">
                    {qualityMetrics.map((metric) => (
                      <Card key={metric.name}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{metric.name}</h3>
                            <Badge variant={metric.score > 95 ? 'default' : metric.score > 90 ? 'secondary' : 'destructive'}>
                              {metric.score}% Quality
                            </Badge>
                          </div>
                          <Progress value={metric.score} className="h-2" />
                          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                            <span>{metric.issues} quality issues</span>
                            <span>Checked {new Date(metric.lastCheck).toLocaleTimeString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                  <CardDescription>
                    System performance metrics and optimization opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Brain className="w-4 h-4" />
                    <AlertTitle>AI Performance Analysis Available</AlertTitle>
                    <AlertDescription>
                      <Button size="sm" variant="secondary" className="mt-2">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze Performance Bottlenecks
                      </Button>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              <ArbitronMetrics />
            </TabsContent>
          </Tabs>
        </div>

        {/* Detail Panel (Right 40%) */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="sticky top-20 h-[calc(100vh-6rem)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Investigation Panel</span>
                {selectedDetail && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setSelectedDetail(null);
                      setDetailType(null);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-12rem)]">
                {!selectedDetail ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select an item to investigate</p>
                    <p className="text-sm mt-2">Click on any metric, alert, or pipeline for details</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Dynamic detail content based on selection type */}
                    {detailType === 'alert' && (
                      <>
                        <Alert>
                          <AlertTriangle className="w-4 h-4" />
                          <AlertTitle>Pipeline Issue Detected</AlertTitle>
                          <AlertDescription>
                            {selectedDetail.name} is experiencing issues
                          </AlertDescription>
                        </Alert>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Root Cause Analysis</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-primary" />
                                <span className="text-sm">AI Analysis Running...</span>
                              </div>
                              <Progress value={65} className="h-1" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Recommended Actions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Button size="sm" className="w-full justify-start">
                                <Play className="w-4 h-4 mr-2" />
                                Restart Pipeline
                              </Button>
                              <Button size="sm" variant="outline" className="w-full justify-start">
                                <Settings className="w-4 h-4 mr-2" />
                                Adjust Configuration
                              </Button>
                              <Button size="sm" variant="outline" className="w-full justify-start">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                View Error Logs
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}

                    {detailType === 'quality' && (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">{selectedDetail.name} Quality Details</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Completeness</span>
                                <span className="text-sm font-medium">98.5%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Accuracy</span>
                                <span className="text-sm font-medium">96.2%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Consistency</span>
                                <span className="text-sm font-medium">94.8%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Timeliness</span>
                                <span className="text-sm font-medium">91.3%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Quality Issues</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {selectedDetail.issues > 0 ? (
                                <Alert>
                                  <AlertTriangle className="w-4 h-4" />
                                  <AlertDescription>
                                    {selectedDetail.issues} issues found requiring attention
                                  </AlertDescription>
                                </Alert>
                              ) : (
                                <Alert>
                                  <CheckCircle className="w-4 h-4" />
                                  <AlertDescription>
                                    No quality issues detected
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}

                    {detailType === 'performance' && (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">{selectedDetail.resource} Analysis</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Current</span>
                                  <span className="font-medium">
                                    {selectedDetail.resource.includes('Time') ? `${selectedDetail.utilization}ms` :
                                     `${selectedDetail.utilization}%`}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Threshold</span>
                                  <span className="font-medium">
                                    {selectedDetail.resource.includes('Time') ? `${selectedDetail.threshold}ms` :
                                     `${selectedDetail.threshold}%`}
                                  </span>
                                </div>
                                <Progress 
                                  value={(selectedDetail.utilization / selectedDetail.threshold) * 100} 
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Optimization Opportunities</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Alert>
                              <Sparkles className="w-4 h-4" />
                              <AlertDescription>
                                AI analyzing optimization opportunities...
                              </AlertDescription>
                            </Alert>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Action Bar (Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Last Update: {new Date().toLocaleTimeString()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Auto-refresh: ON
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configure Alerts
            </Button>
            <Button size="sm">
              <ArrowRight className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}