'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataLineageVisualization } from '@/components/DataLineageVisualization';
import { 
  Wrench,
  Database,
  GitBranch,
  BarChart3,
  Zap,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Server,
  Activity,
  Layers,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Download,
  Upload
} from 'lucide-react';

// Mock Airflow DAG data
const MOCK_DAGS = [
  {
    id: 'etl_daily_revenue',
    name: 'Daily Revenue ETL',
    schedule: '0 2 * * *',
    lastRun: '2024-01-15 02:00:00',
    lastStatus: 'success',
    nextRun: '2024-01-16 02:00:00',
    avgDuration: '25m',
    successRate: 98
  },
  {
    id: 'ml_feature_pipeline',
    name: 'ML Feature Engineering',
    schedule: '*/6 * * * *',
    lastRun: '2024-01-15 18:00:00',
    lastStatus: 'running',
    nextRun: '2024-01-16 00:00:00',
    avgDuration: '45m',
    successRate: 92
  },
  {
    id: 'data_quality_checks',
    name: 'Data Quality Validation',
    schedule: '0 */4 * * *',
    lastRun: '2024-01-15 16:00:00',
    lastStatus: 'failed',
    nextRun: '2024-01-15 20:00:00',
    avgDuration: '10m',
    successRate: 95
  }
];

// Mock Spark jobs
const MOCK_SPARK_JOBS = [
  {
    id: 'spark-job-001',
    name: 'Customer Segmentation',
    applicationId: 'app-20240115-001',
    status: 'running',
    progress: 67,
    startTime: '2024-01-15 17:45:00',
    duration: '12m',
    executors: 8,
    cores: 32,
    memory: '128GB',
    stages: { completed: 5, active: 1, pending: 2 }
  },
  {
    id: 'spark-job-002',
    name: 'Product Recommendations',
    applicationId: 'app-20240115-002',
    status: 'completed',
    progress: 100,
    startTime: '2024-01-15 16:30:00',
    duration: '28m',
    executors: 12,
    cores: 48,
    memory: '192GB',
    stages: { completed: 8, active: 0, pending: 0 }
  }
];

// Mock DataHub datasets
const MOCK_DATASETS = [
  {
    urn: 'urn:li:dataset:iceberg.orders',
    name: 'orders',
    platform: 'Iceberg',
    owners: ['data-team'],
    tags: ['pii', 'critical'],
    schema: 6,
    downstream: 12,
    upstream: 3,
    lastModified: '2024-01-15',
    health: 'healthy',
    compliance: 100
  },
  {
    urn: 'urn:li:dataset:hive.raw_events',
    name: 'raw_events',
    platform: 'Hive',
    owners: ['platform-team'],
    tags: ['raw', 'streaming'],
    schema: 5,
    downstream: 8,
    upstream: 1,
    lastModified: '2024-01-14',
    health: 'warning',
    compliance: 85
  }
];

export default function ToolsIntegration() {
  const [selectedTool, setSelectedTool] = useState('airflow');
  const [selectedDag, setSelectedDag] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [showLineageModal, setShowLineageModal] = useState(false);
  const [lineageEntityId, setLineageEntityId] = useState<string>('');

  const triggerDag = (dagId: string) => {
    console.log(`Triggering DAG: ${dagId}`);
    // In production, this would make an API call to Airflow
  };

  const stopSparkJob = (jobId: string) => {
    console.log(`Stopping Spark job: ${jobId}`);
    // In production, this would make an API call to Spark
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tool Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Direct access to your enterprise data tools with intelligent orchestration
        </p>
      </div>

      <Tabs value={selectedTool} onValueChange={setSelectedTool}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="airflow" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Airflow Orchestration
          </TabsTrigger>
          <TabsTrigger value="spark" className="gap-2">
            <Zap className="h-4 w-4" />
            Spark Compute
          </TabsTrigger>
          <TabsTrigger value="datahub" className="gap-2">
            <Database className="h-4 w-4" />
            DataHub Catalog
          </TabsTrigger>
        </TabsList>

        {/* Airflow Integration */}
        <TabsContent value="airflow" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* DAG List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Active DAGs</CardTitle>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Airflow UI
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_DAGS.map((dag) => (
                    <div 
                      key={dag.id} 
                      className="border rounded-lg p-4 hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => setSelectedDag(dag)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{dag.name}</h3>
                          <p className="text-sm text-muted-foreground">ID: {dag.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {dag.lastStatus === 'success' && (
                            <Badge variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                              Success
                            </Badge>
                          )}
                          {dag.lastStatus === 'running' && (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1 text-blue-600" />
                              Running
                            </Badge>
                          )}
                          {dag.lastStatus === 'failed' && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Schedule:</span>
                          <p className="font-mono">{dag.schedule}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Duration:</span>
                          <p>{dag.avgDuration}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Run:</span>
                          <p>{dag.lastRun}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success Rate:</span>
                          <p>{dag.successRate}%</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerDag(dag.id);
                          }}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Trigger
                        </Button>
                        <Button size="sm" variant="outline">
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                        <Button size="sm" variant="outline">
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* DAG Details */}
            <div>
              {selectedDag ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">DAG Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">{selectedDag.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next Run:</span>
                          <span>{selectedDag.nextRun}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span>{selectedDag.successRate}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Recent Runs</h4>
                      <div className="flex gap-1">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-12 rounded ${
                              i === 9 && selectedDag.lastStatus === 'failed'
                                ? 'bg-red-500'
                                : i === 9 && selectedDag.lastStatus === 'running'
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Task Graph</h4>
                      <div className="border rounded p-4 bg-muted/20">
                        <div className="text-xs font-mono space-y-1">
                          <div>→ extract_data</div>
                          <div className="ml-4">→ validate_schema</div>
                          <div className="ml-8">→ transform_data</div>
                          <div className="ml-12">→ load_to_warehouse</div>
                          <div className="ml-16">→ update_metadata</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Select a DAG to view details
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Spark Integration */}
        <TabsContent value="spark" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Spark Applications</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Job
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Spark UI
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_SPARK_JOBS.map((job) => (
                    <div 
                      key={job.id}
                      className="border rounded-lg p-4 hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{job.name}</h3>
                          <p className="text-sm text-muted-foreground">App ID: {job.applicationId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.status === 'running' && (
                            <Badge variant="secondary">
                              <Activity className="h-3 w-3 mr-1 text-blue-600" />
                              Running
                            </Badge>
                          )}
                          {job.status === 'completed' && (
                            <Badge variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {job.status === 'running' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Executors:</span>
                          <p className="font-medium">{job.executors}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cores:</span>
                          <p className="font-medium">{job.cores}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Memory:</span>
                          <p className="font-medium">{job.memory}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Stages: </span>
                          <span className="text-green-600">{job.stages.completed} done</span>
                          {job.stages.active > 0 && (
                            <span className="text-blue-600 ml-2">{job.stages.active} active</span>
                          )}
                          {job.stages.pending > 0 && (
                            <span className="text-gray-600 ml-2">{job.stages.pending} pending</span>
                          )}
                        </div>
                        {job.status === 'running' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              stopSparkJob(job.id);
                            }}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Stop
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Job Details & Metrics */}
            <div>
              {selectedJob ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Job Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">{selectedJob.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start Time:</span>
                          <span>{selectedJob.startTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{selectedJob.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Resource Usage</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>CPU Usage</span>
                            <span>78%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '78%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Memory Usage</span>
                            <span>65%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: '65%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Data I/O</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Input:</span>
                          <span>2.5GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shuffle:</span>
                          <span>450MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Output:</span>
                          <span>1.2GB</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Select a job to view metrics
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* DataHub Integration */}
        <TabsContent value="datahub" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dataset List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Catalog Datasets</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Advanced Search
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open DataHub
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_DATASETS.map((dataset) => (
                    <div 
                      key={dataset.urn}
                      className="border rounded-lg p-4 hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => setSelectedDataset(dataset)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            {dataset.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{dataset.platform}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {dataset.health === 'healthy' ? (
                            <Badge variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                              Healthy
                            </Badge>
                          ) : (
                            <Badge variant="warning">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Warning
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mb-3">
                        {dataset.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Schema:</span>
                          <p className="font-medium">{dataset.schema} fields</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Upstream:</span>
                          <p className="font-medium">{dataset.upstream}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Downstream:</span>
                          <p className="font-medium">{dataset.downstream}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Compliance:</span>
                          <p className="font-medium">{dataset.compliance}%</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLineageEntityId(dataset.urn);
                            setShowLineageModal(true);
                          }}
                        >
                          <Layers className="h-3 w-3 mr-1" />
                          View Lineage
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Profiling
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3 mr-1" />
                          Properties
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Dataset Details */}
            <div>
              {selectedDataset ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dataset Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">{selectedDataset.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform:</span>
                          <span>{selectedDataset.platform}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Modified:</span>
                          <span>{selectedDataset.lastModified}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Owners:</span>
                          <span>{selectedDataset.owners.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Quality Metrics</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Completeness</span>
                            <span>98%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: '98%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Freshness</span>
                            <span>24h</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '100%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Usage Stats</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Daily Queries:</span>
                          <span>1,245</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unique Users:</span>
                          <span>42</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Response:</span>
                          <span>234ms</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Select a dataset to view details
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Lineage Modal */}
      <Dialog open={showLineageModal} onOpenChange={setShowLineageModal}>
        <DialogContent className="max-w-7xl h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Data Lineage Visualization</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <DataLineageVisualization 
              entityId={lineageEntityId}
              mode="enhanced"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}