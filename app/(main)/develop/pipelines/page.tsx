'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GitBranch,
  Plus,
  Upload,
  Layers,
  Clock,
  Zap,
  Database,
  Filter,
  ArrowRight,
  Sparkles,
  FileCode,
  Package,
  Search,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  Grid3x3,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TemplateCustomizer } from '@/components/pipeline/TemplateCustomizer';
import { NodeTypeRegistry } from '@/lib/services/NodeTypeRegistry';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  popularity: number;
  timeToImplement: string;
  stages: {
    ingest: string[];
    transform: string[];
    store: string[];
    consume: string[];
  };
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  type: 'ETL' | 'ELT' | 'Streaming' | 'ML' | 'Real-time';
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  components: number;
  stages: {
    ingest: number;
    transform: number;
    store: number;
    consume: number;
  };
  lastModified: string;
  owner: string;
  runs: number;
  successRate: number;
}

const templates: Template[] = [
  {
    id: 'daily-etl',
    name: 'Daily ETL',
    description: 'Standard extract, transform, load pattern for batch processing',
    category: 'ETL',
    icon: Clock,
    popularity: 95,
    timeToImplement: '5 min',
    stages: {
      ingest: ['airbyte-postgres-source', 'nifi-getfile'],
      transform: ['dbt-model', 'great-expectations'],
      store: ['snowflake-destination'],
      consume: ['tableau-connector']
    }
  },
  {
    id: 'stream-processing',
    name: 'Stream Processing',
    description: 'Real-time event processing with Kafka and Spark',
    category: 'Streaming',
    icon: Zap,
    popularity: 88,
    timeToImplement: '10 min',
    stages: {
      ingest: ['kafka-consumer', 'kinesis-source'],
      transform: ['spark-streaming', 'flink-window'],
      store: ['timescale-destination', 's3-destination'],
      consume: ['grafana-dashboard']
    }
  },
  {
    id: 'data-quality',
    name: 'Data Quality Check',
    description: 'Automated validation and quality monitoring',
    category: 'Quality',
    icon: Filter,
    popularity: 92,
    timeToImplement: '5 min',
    stages: {
      ingest: ['airbyte-postgres-source'],
      transform: ['great-expectations', 'soda-checks', 'data-profiler'],
      store: ['postgres-destination'],
      consume: ['grafana-dashboard', 'alert-manager']
    }
  },
  {
    id: 'cdc-pipeline',
    name: 'CDC Pipeline',
    description: 'Change data capture for incremental updates',
    category: 'CDC',
    icon: Database,
    popularity: 76,
    timeToImplement: '15 min',
    stages: {
      ingest: ['debezium-source', 'postgres-wal'],
      transform: ['schema-registry', 'data-masker'],
      store: ['postgres-destination', 'audit-log'],
      consume: ['sync-monitor']
    }
  },
  {
    id: 'ml-feature',
    name: 'ML Feature Pipeline',
    description: 'Feature engineering and preparation for ML models',
    category: 'ML',
    icon: Sparkles,
    popularity: 71,
    timeToImplement: '10 min',
    stages: {
      ingest: ['airbyte-postgres-source', 'feature-store'],
      transform: ['spark-batch', 'feature-engineering'],
      store: ['feast-store', 'mlflow-registry'],
      consume: ['training-pipeline', 'model-serving']
    }
  },
  {
    id: 'data-product',
    name: 'Data Product Builder',
    description: 'Complete data product with documentation and SLAs',
    category: 'Product',
    icon: Package,
    popularity: 64,
    timeToImplement: '20 min',
    stages: {
      ingest: ['airbyte-api-source', 'airbyte-postgres-source'],
      transform: ['dbt-model', 'spark-batch'],
      store: ['postgres-destination', 'datahub-metadata'],
      consume: ['api-gateway', 'documentation-portal']
    }
  }
];

const existingPipelines: Pipeline[] = [
  {
    id: 'pl-001',
    name: 'Customer Data ETL',
    description: 'Daily customer data synchronization from CRM to data warehouse',
    type: 'ETL',
    status: 'active',
    components: 12,
    stages: { ingest: 3, transform: 5, store: 2, consume: 2 },
    lastModified: '2024-01-15T10:30:00Z',
    owner: 'data-team',
    runs: 1250,
    successRate: 98.5
  },
  {
    id: 'pl-002',
    name: 'Real-time Event Processing',
    description: 'Process streaming events from Kafka to analytics dashboard',
    type: 'Streaming',
    status: 'active',
    components: 8,
    stages: { ingest: 2, transform: 3, store: 2, consume: 1 },
    lastModified: '2024-01-14T14:20:00Z',
    owner: 'streaming-team',
    runs: 15420,
    successRate: 99.2
  },
  {
    id: 'pl-003',
    name: 'ML Feature Pipeline',
    description: 'Feature engineering pipeline for recommendation models',
    type: 'ML',
    status: 'maintenance',
    components: 15,
    stages: { ingest: 4, transform: 7, store: 3, consume: 1 },
    lastModified: '2024-01-13T09:15:00Z',
    owner: 'ml-team',
    runs: 450,
    successRate: 94.3
  }
];

export default function PipelineHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pipelines');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [userEntitlements, setUserEntitlements] = useState<string[]>([]);
  
  // Load user entitlements on mount
  useEffect(() => {
    // In production, this would fetch from API based on user permissions
    // For now, simulate with common tools
    setUserEntitlements(['airbyte', 'nifi', 'spark', 'dbt', 'kafka', 'snowflake']);
  }, []);

  // Filter existing pipelines
  const filteredPipelines = useMemo(() => {
    return existingPipelines.filter(pipeline => {
      const matchesSearch = pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pipeline.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || pipeline.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || pipeline.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, selectedType, selectedStatus]);

  const handleNewPipeline = () => {
    router.push('/develop/pipelines/studio?view=builder');
  };

  const handleTemplateSelect = (template: Template) => {
    // Show customizer for template
    setSelectedTemplate(template);
    setShowCustomizer(true);
  };
  
  const handleCustomizedTemplate = (customizedTemplate: any) => {
    // Navigate to builder with customized template
    const templateData = encodeURIComponent(JSON.stringify(customizedTemplate));
    router.push(`/develop/pipelines/studio?template=${customizedTemplate.id}&customized=${templateData}&view=builder`);
    setShowCustomizer(false);
    setSelectedTemplate(null);
  };
  
  const handleCancelCustomization = () => {
    setShowCustomizer(false);
    setSelectedTemplate(null);
  };

  const handlePipelineSelect = (pipeline: Pipeline) => {
    router.push(`/develop/pipelines/studio?id=${pipeline.id}&view=builder`);
  };

  const handleImport = () => {
    console.log('Import pipeline');
  };

  const handleBrowseAllTemplates = () => {
    router.push('/develop/pipelines/studio?view=templates');
  };

  const getStatusColor = (status: Pipeline['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTypeIcon = (type: Pipeline['type']) => {
    switch (type) {
      case 'ETL':
        return <Database className="w-4 h-4" />;
      case 'ELT':
        return <GitBranch className="w-4 h-4" />;
      case 'Streaming':
        return <Activity className="w-4 h-4" />;
      case 'ML':
        return <TrendingUp className="w-4 h-4" />;
      case 'Real-time':
        return <Activity className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Template Customizer Modal */}
      {showCustomizer && selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-background border rounded-lg shadow-lg overflow-auto">
            <TemplateCustomizer
              template={selectedTemplate}
              availableTools={userEntitlements}
              onCustomize={handleCustomizedTemplate}
              onCancel={handleCancelCustomization}
            />
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Pipelines</h1>
              <p className="text-muted-foreground mt-1">
                Manage your data pipelines and create new ones
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={handleNewPipeline}>
                <Plus className="h-4 w-4 mr-2" />
                New Pipeline
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pipelines" className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              My Pipelines
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* My Pipelines Tab */}
          <TabsContent value="pipelines" className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search pipelines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                <option value="ETL">ETL</option>
                <option value="ELT">ELT</option>
                <option value="Streaming">Streaming</option>
                <option value="ML">ML</option>
                <option value="Real-time">Real-time</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            {/* Pipeline Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPipelines.map(pipeline => (
                <Card
                  key={pipeline.id}
                  onClick={() => handlePipelineSelect(pipeline)}
                  className="cursor-pointer hover:shadow-lg transition-all group"
                >
                  {/* Pipeline Header */}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(pipeline.type)}
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {pipeline.name}
                          </CardTitle>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {pipeline.description}
                        </CardDescription>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <Badge className={cn("border", getStatusColor(pipeline.status))}>
                        {pipeline.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {pipeline.type}
                      </Badge>
                    </div>

                    {/* Pipeline Stages */}
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-blue-500/20 rounded-full h-2 relative overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                          style={{ width: `${(pipeline.stages.ingest / pipeline.components) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-purple-500/20 rounded-full h-2 relative overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-purple-500 rounded-full"
                          style={{ width: `${(pipeline.stages.transform / pipeline.components) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-green-500/20 rounded-full h-2 relative overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                          style={{ width: `${(pipeline.stages.store / pipeline.components) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-orange-500/20 rounded-full h-2 relative overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                          style={{ width: `${(pipeline.stages.consume / pipeline.components) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-semibold">{pipeline.components}</div>
                        <div className="text-xs text-muted-foreground">Components</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{pipeline.runs.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Runs</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{pipeline.successRate}%</div>
                        <div className="text-xs text-muted-foreground">Success</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{pipeline.owner}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(pipeline.lastModified)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPipelines.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Database className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No pipelines found</p>
                <p className="text-sm mt-1">Try adjusting your filters or create a new pipeline</p>
                <Button className="mt-4" onClick={handleNewPipeline}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Pipeline
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Create New Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50"
                onClick={handleNewPipeline}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Blank Pipeline</CardTitle>
                  <CardDescription>
                    Start with an empty canvas and build from scratch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="default">
                    Start Building
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500/50"
                onClick={() => setActiveTab('templates')}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                    <Layers className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle>Use Template</CardTitle>
                  <CardDescription>
                    Start with proven patterns and customize for your needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Browse Templates
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-500/50"
                onClick={handleImport}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle>Import Pipeline</CardTitle>
                  <CardDescription>
                    Import from Airflow DAG, dbt model, or YAML
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Import Code
                    <Upload className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Team Pipelines */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Team Patterns
                </CardTitle>
                <CardDescription>
                  Pipelines recently created by your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">customer_revenue_aggregation</p>
                        <p className="text-xs text-muted-foreground">Created by Sarah, 2 days ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Use as Template
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">product_inventory_sync</p>
                        <p className="text-xs text-muted-foreground">Created by Mike, 1 week ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Use as Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Pipeline Templates</h2>
                <p className="text-muted-foreground">
                  Pre-configured pipelines with best practices built in
                </p>
              </div>
              <Button variant="outline" onClick={handleBrowseAllTemplates}>
                View All Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-all group"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {template.popularity}% use this
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Component Preview */}
                      {template.components && (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-muted-foreground">Ingest: {template.components.ingest.length} sources</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span className="text-muted-foreground">Transform: {template.components.transform.length} steps</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-muted-foreground">Store: {template.components.store.length} destinations</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.timeToImplement}
                          </Badge>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}