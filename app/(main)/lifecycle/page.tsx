'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap,
  GitBranch,
  Shield,
  Database,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Settings,
  Download,
  Upload,
  ChevronRight,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for our lifecycle stages
interface LifecycleStage {
  id: string;
  name: string;
  tool: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  icon: React.ElementType;
  color: string;
  description: string;
  metrics?: {
    label: string;
    value: string | number;
  }[];
  config?: any;
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  stages: LifecycleStage[];
  overallStatus: 'healthy' | 'degraded' | 'failed';
  lastRun?: Date;
  nextRun?: Date;
  sla?: number; // in minutes
}

export default function UniversalLifecycleDAG() {
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [viewMode, setViewMode] = useState<'lifecycle' | 'impact' | 'builder'>('lifecycle');
  const [isBuilding, setIsBuilding] = useState(false);
  
  // Mock pipelines
  const pipelines: Pipeline[] = [
    {
      id: '1',
      name: 'Customer Analytics Pipeline',
      description: 'End-to-end customer data processing and analytics',
      overallStatus: 'healthy',
      lastRun: new Date(Date.now() - 3600000),
      nextRun: new Date(Date.now() + 3600000 * 23),
      sla: 120,
      stages: [
        {
          id: 'ingest',
          name: 'Data Ingestion',
          tool: 'NiFi',
          status: 'success',
          icon: Upload,
          color: 'text-blue-500',
          description: 'Streaming customer events from Kafka',
          metrics: [
            { label: 'Throughput', value: '1.2M/min' },
            { label: 'Latency', value: '<100ms' }
          ]
        },
        {
          id: 'transform',
          name: 'Transformation',
          tool: 'Airflow',
          status: 'running',
          icon: GitBranch,
          color: 'text-purple-500',
          description: 'Enriching and aggregating customer data',
          metrics: [
            { label: 'Progress', value: '67%' },
            { label: 'Est. Time', value: '12 min' }
          ]
        },
        {
          id: 'quality',
          name: 'Quality Check',
          tool: 'Great Expectations',
          status: 'idle',
          icon: Shield,
          color: 'text-green-500',
          description: 'Validating data quality rules',
          metrics: [
            { label: 'Rules', value: 24 },
            { label: 'Last Score', value: '98.5%' }
          ]
        },
        {
          id: 'catalog',
          name: 'Cataloging',
          tool: 'DataHub',
          status: 'idle',
          icon: Database,
          color: 'text-orange-500',
          description: 'Updating metadata and lineage',
          metrics: [
            { label: 'Tables', value: 3 },
            { label: 'Consumers', value: 12 }
          ]
        },
        {
          id: 'serve',
          name: 'Serving',
          tool: 'Trino',
          status: 'idle',
          icon: Activity,
          color: 'text-cyan-500',
          description: 'Making data queryable',
          metrics: [
            { label: 'Queries/hr', value: 847 },
            { label: 'Avg Latency', value: '245ms' }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Real-time Fraud Detection',
      description: 'Streaming fraud detection with ML scoring',
      overallStatus: 'degraded',
      lastRun: new Date(Date.now() - 1800000),
      sla: 5,
      stages: [
        {
          id: 'stream',
          name: 'Stream Processing',
          tool: 'Kafka + NiFi',
          status: 'success',
          icon: Zap,
          color: 'text-yellow-500',
          description: 'Processing transaction stream',
          metrics: [
            { label: 'Events/sec', value: '10K' },
            { label: 'Lag', value: '2ms' }
          ]
        },
        {
          id: 'ml-score',
          name: 'ML Scoring',
          tool: 'MLflow + Spark',
          status: 'warning',
          icon: TrendingUp,
          color: 'text-indigo-500',
          description: 'Running fraud detection model',
          metrics: [
            { label: 'Model Drift', value: '+12%' },
            { label: 'Accuracy', value: '94.2%' }
          ]
        },
        {
          id: 'alert',
          name: 'Alerting',
          tool: 'Airflow',
          status: 'success',
          icon: AlertTriangle,
          color: 'text-red-500',
          description: 'Triggering fraud alerts',
          metrics: [
            { label: 'Alerts Today', value: 23 },
            { label: 'False Positive', value: '2.1%' }
          ]
        }
      ]
    }
  ];
  
  useEffect(() => {
    setSelectedPipeline(pipelines[0]);
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-500';
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };
  
  const handleDeployPipeline = () => {
    setIsBuilding(true);
    setTimeout(() => {
      setIsBuilding(false);
      // In production, this would actually deploy to tools
    }, 2000);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Universal Lifecycle DAG</h1>
          <p className="text-muted-foreground">
            Orchestrate data products across all tools in one view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button size="sm" onClick={handleDeployPipeline} disabled={isBuilding}>
            {isBuilding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Deploy Pipeline
          </Button>
        </div>
      </div>
      
      {/* Pipeline Selector */}
      <div className="grid grid-cols-3 gap-4">
        {pipelines.map((pipeline) => (
          <Card 
            key={pipeline.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedPipeline?.id === pipeline.id && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedPipeline(pipeline)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{pipeline.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pipeline.description}
                  </p>
                </div>
                <Badge 
                  variant={
                    pipeline.overallStatus === 'healthy' ? 'secondary' :
                    pipeline.overallStatus === 'degraded' ? 'outline' : 'destructive'
                  }
                >
                  {pipeline.overallStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {pipeline.stages.map((stage, idx) => (
                  <React.Fragment key={stage.id}>
                    <div className={cn("flex items-center", getStatusColor(stage.status))}>
                      {getStatusIcon(stage.status)}
                    </div>
                    {idx < pipeline.stages.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              {pipeline.sla && (
                <div className="mt-2 text-xs text-muted-foreground">
                  SLA: {pipeline.sla} min
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="lifecycle">Lifecycle View</TabsTrigger>
          <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
          <TabsTrigger value="builder">Visual Builder</TabsTrigger>
        </TabsList>
        
        {/* Lifecycle View */}
        <TabsContent value="lifecycle">
          {selectedPipeline && (
            <Card>
              <CardHeader>
                <CardTitle>Data Product Lifecycle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Pipeline Flow */}
                  <div className="flex items-center justify-between">
                    {selectedPipeline.stages.map((stage, idx) => (
                      <React.Fragment key={stage.id}>
                        {/* Stage Node */}
                        <div className="flex flex-col items-center flex-1">
                          <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all",
                            stage.status === 'running' && "border-blue-500 bg-blue-50 animate-pulse",
                            stage.status === 'success' && "border-green-500 bg-green-50",
                            stage.status === 'warning' && "border-yellow-500 bg-yellow-50",
                            stage.status === 'error' && "border-red-500 bg-red-50",
                            stage.status === 'idle' && "border-gray-300 bg-gray-50"
                          )}>
                            <stage.icon className={cn("h-8 w-8", stage.color)} />
                          </div>
                          
                          <div className="mt-3 text-center">
                            <div className="font-medium text-sm">{stage.name}</div>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {stage.tool}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-2 max-w-[150px]">
                              {stage.description}
                            </div>
                          </div>
                          
                          {/* Metrics */}
                          {stage.metrics && (
                            <div className="mt-3 space-y-1">
                              {stage.metrics.map((metric) => (
                                <div key={metric.label} className="text-xs">
                                  <span className="text-muted-foreground">{metric.label}:</span>
                                  <span className="ml-1 font-medium">{metric.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Stage Actions */}
                          <div className="mt-3 flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2">
                              <Settings className="h-3 w-3" />
                            </Button>
                            {stage.status === 'error' && (
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Connector */}
                        {idx < selectedPipeline.stages.length - 1 && (
                          <div className="flex-shrink-0 w-12 flex items-center">
                            <div className={cn(
                              "w-full h-0.5 transition-all",
                              selectedPipeline.stages[idx].status === 'success' ? "bg-green-500" :
                              selectedPipeline.stages[idx].status === 'running' ? "bg-blue-500 animate-pulse" :
                              "bg-gray-300"
                            )}>
                              <ArrowRight className={cn(
                                "h-4 w-4 -mt-2 ml-auto",
                                selectedPipeline.stages[idx].status === 'success' ? "text-green-500" :
                                selectedPipeline.stages[idx].status === 'running' ? "text-blue-500" :
                                "text-gray-300"
                              )} />
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                
                {/* Pipeline Info */}
                <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Last Run:</span>
                      <div className="font-medium">
                        {selectedPipeline.lastRun?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next Run:</span>
                      <div className="font-medium">
                        {selectedPipeline.nextRun?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SLA:</span>
                      <div className="font-medium">
                        {selectedPipeline.sla} minutes
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="font-medium capitalize">
                        {selectedPipeline.overallStatus}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Impact Analysis View */}
        <TabsContent value="impact">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Tool Impact Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>ML Model Drift Detected</strong>
                  <div className="mt-2">
                    The fraud detection model is showing 12% drift. This impacts:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>3 downstream Airflow DAGs will produce less accurate results</li>
                      <li>Alert thresholds may need recalibration</li>
                      <li>23 Trino queries relying on scoring data</li>
                      <li>2 Superset dashboards showing fraud metrics</li>
                    </ul>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm">Retrain Model</Button>
                    <Button size="sm" variant="outline">View Affected Assets</Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Visual Builder */}
        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle>Visual Pipeline Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-lg mb-2">Drag and drop pipeline builder</div>
                <div className="text-sm">
                  Configure once, deploy to NiFi, Airflow, Great Expectations, and DataHub
                </div>
                <Button className="mt-4">
                  Start Building
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}