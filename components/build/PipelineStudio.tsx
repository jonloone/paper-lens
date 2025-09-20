'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { QuerySelectionModal } from './QuerySelectionModal';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cloud,
  Database,
  Download,
  FileCode,
  GitBranch,
  HardDrive,
  Loader2,
  MoreVertical,
  Package,
  Plus,
  RefreshCw,
  Save,
  Server,
  Sparkles,
  Upload,
  Zap
} from 'lucide-react';

type StepCategory = 'source' | 'transform' | 'sink' | 'orchestration';
type StepType = 
  // Sources
  | 'database_cdc' | 'kafka_source' | 's3_source' | 'api_source' | 'file_upload'
  // Transforms  
  | 'sql_query' | 'dbt_model' | 'spark_job' | 'python_script' | 'data_quality'
  // Sinks
  | 'data_warehouse' | 'kafka_sink' | 's3_sink' | 'database_sink' | 'api_sink'
  // Orchestration
  | 'airflow_schedule' | 'nifi_flow' | 'trigger';

interface PipelineStep {
  id: string;
  category: StepCategory;
  type: StepType;
  name: string;
  config: Record<string, any>;
  status?: 'configured' | 'incomplete' | 'error';
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  schedule?: string;
  tags: string[];
  lastModified: Date;
}

const STEP_DEFINITIONS = {
  // Sources
  database_cdc: {
    name: 'Database CDC',
    icon: Database,
    description: 'Change data capture from database',
    category: 'source' as StepCategory,
    requiredConfig: ['connection', 'tables', 'cdcType']
  },
  kafka_source: {
    name: 'Kafka Topic',
    icon: Zap,
    description: 'Stream from Kafka topic',
    category: 'source' as StepCategory,
    requiredConfig: ['topic', 'consumerGroup', 'bootstrapServers']
  },
  s3_source: {
    name: 'S3 Bucket',
    icon: Cloud,
    description: 'Read files from S3',
    category: 'source' as StepCategory,
    requiredConfig: ['bucket', 'prefix', 'format']
  },
  api_source: {
    name: 'API Endpoint',
    icon: Server,
    description: 'Fetch data from REST API',
    category: 'source' as StepCategory,
    requiredConfig: ['url', 'method', 'headers']
  },
  file_upload: {
    name: 'File Upload',
    icon: Upload,
    description: 'Upload local files',
    category: 'source' as StepCategory,
    requiredConfig: ['path', 'format']
  },
  
  // Transforms
  sql_query: {
    name: 'SQL Query',
    icon: Database,
    description: 'Transform with SQL',
    category: 'transform' as StepCategory,
    requiredConfig: ['query', 'catalog', 'schema']
  },
  dbt_model: {
    name: 'dbt Model',
    icon: Database,
    description: 'dbt transformation',
    category: 'transform' as StepCategory,
    requiredConfig: ['project', 'models', 'target']
  },
  spark_job: {
    name: 'Spark Job',
    icon: Sparkles,
    description: 'Spark processing',
    category: 'transform' as StepCategory,
    requiredConfig: ['jobName', 'jarPath', 'mainClass']
  },
  python_script: {
    name: 'Python Script',
    icon: FileCode,
    description: 'Custom Python processing',
    category: 'transform' as StepCategory,
    requiredConfig: ['script', 'requirements']
  },
  data_quality: {
    name: 'Data Quality',
    icon: CheckCircle2,
    description: 'Quality checks and validation',
    category: 'transform' as StepCategory,
    requiredConfig: ['rules', 'action']
  },
  
  // Sinks
  data_warehouse: {
    name: 'Data Warehouse',
    icon: Database,
    description: 'Load to warehouse',
    category: 'sink' as StepCategory,
    requiredConfig: ['connection', 'table', 'writeMode']
  },
  kafka_sink: {
    name: 'Kafka Topic',
    icon: Zap,
    description: 'Publish to Kafka',
    category: 'sink' as StepCategory,
    requiredConfig: ['topic', 'bootstrapServers']
  },
  s3_sink: {
    name: 'S3 Bucket',
    icon: Cloud,
    description: 'Write to S3',
    category: 'sink' as StepCategory,
    requiredConfig: ['bucket', 'prefix', 'format']
  },
  database_sink: {
    name: 'Database',
    icon: Database,
    description: 'Insert into database',
    category: 'sink' as StepCategory,
    requiredConfig: ['connection', 'table', 'mode']
  },
  api_sink: {
    name: 'API Endpoint',
    icon: Server,
    description: 'Send to REST API',
    category: 'sink' as StepCategory,
    requiredConfig: ['url', 'method', 'headers']
  },
  
  // Orchestration
  airflow_schedule: {
    name: 'Airflow Schedule',
    icon: Cloud,
    description: 'Schedule with Airflow',
    category: 'orchestration' as StepCategory,
    requiredConfig: ['schedule', 'dagId']
  },
  nifi_flow: {
    name: 'NiFi Flow',
    icon: GitBranch,
    description: 'NiFi processor group',
    category: 'orchestration' as StepCategory,
    requiredConfig: ['processorGroup', 'schedule']
  },
  trigger: {
    name: 'Event Trigger',
    icon: Zap,
    description: 'Event-based trigger',
    category: 'orchestration' as StepCategory,
    requiredConfig: ['eventType', 'condition']
  }
};

export function PipelineStudio() {
  const [pipeline, setPipeline] = useState<Pipeline>({
    id: 'new-pipeline',
    name: '',
    description: '',
    steps: [],
    tags: [],
    lastModified: new Date()
  });

  const [expandedCategory, setExpandedCategory] = useState<StepCategory | null>('source');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [isQuerySelectorOpen, setIsQuerySelectorOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const addStep = (type: StepType) => {
    const definition = STEP_DEFINITIONS[type];
    const newStep: PipelineStep = {
      id: `step-${Date.now()}`,
      category: definition.category,
      type,
      name: definition.name,
      config: {},
      status: 'incomplete'
    };

    setPipeline(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
      lastModified: new Date()
    }));

    // Open query selector for SQL query steps
    if (type === 'sql_query') {
      setEditingStepId(newStep.id);
      setIsQuerySelectorOpen(true);
    } else {
      setSelectedStep(newStep.id);
    }
  };

  const updateStep = (stepId: string, updates: Partial<PipelineStep>) => {
    setPipeline(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ),
      lastModified: new Date()
    }));
  };

  const removeStep = (stepId: string) => {
    setPipeline(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId),
      lastModified: new Date()
    }));
  };

  const handleQuerySelect = (query: any) => {
    if (editingStepId) {
      updateStep(editingStepId, {
        config: {
          queryId: query.id,
          queryName: query.name,
          query: query.sql,
          catalog: query.catalog,
          schema: query.schema
        },
        status: 'configured'
      });
    }
    setIsQuerySelectorOpen(false);
    setEditingStepId(null);
  };

  const handleCreateNewQuery = () => {
    // Redirect to Query Studio with context
    window.open(`/query?returnTo=${encodeURIComponent('/build')}&context=pipeline`, '_blank');
    setIsQuerySelectorOpen(false);
    setEditingStepId(null);
  };

  const exportPipeline = () => {
    const config = {
      version: '1.0',
      pipeline: {
        name: pipeline.name,
        description: pipeline.description,
        schedule: pipeline.schedule,
        steps: pipeline.steps.map(s => ({
          category: s.category,
          type: s.type,
          name: s.name,
          config: s.config
        }))
      }
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pipeline.name || 'pipeline'}.json`;
    a.click();
  };

  const getCategorySteps = (category: StepCategory) => {
    return pipeline.steps.filter(s => s.category === category);
  };

  const getCategoryIcon = (category: StepCategory) => {
    switch (category) {
      case 'source': return Database;
      case 'transform': return RefreshCw;
      case 'sink': return Download;
      case 'orchestration': return Cloud;
    }
  };

  const getCategoryDescription = (category: StepCategory) => {
    switch (category) {
      case 'source': return 'Where data comes from - databases, files, streams';
      case 'transform': return 'Process and transform your data';
      case 'sink': return 'Where processed data goes';
      case 'orchestration': return 'Schedule and trigger pipeline execution';
    }
  };

  return (
    <div className="space-y-4">
      {/* Pipeline Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pipeline Configuration</CardTitle>
              <CardDescription>
                Build data pipelines using the Source → Transform → Sink pattern
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/query', '_blank')}
              >
                <Database className="h-4 w-4 mr-2" />
                Query Studio
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button 
                size="sm" 
                onClick={exportPipeline}
                disabled={pipeline.steps.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pipeline Name</Label>
              <Input
                placeholder="e.g., customer-revenue-etl"
                value={pipeline.name}
                onChange={(e) => setPipeline(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Schedule (Cron)</Label>
              <Input
                placeholder="e.g., 0 0 * * * (optional)"
                value={pipeline.schedule}
                onChange={(e) => setPipeline(prev => ({ ...prev, schedule: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label>Description</Label>
            <Textarea
              placeholder="What does this pipeline do?"
              value={pipeline.description}
              onChange={(e) => setPipeline(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Builder */}
      <div className="space-y-4">
        {(['source', 'transform', 'sink', 'orchestration'] as StepCategory[]).map((category) => {
          const CategoryIcon = getCategoryIcon(category);
          const isExpanded = expandedCategory === category;
          const categorySteps = getCategorySteps(category);
          const categoryTypes = Object.entries(STEP_DEFINITIONS)
            .filter(([_, def]) => def.category === category);

          return (
            <Card key={category}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CategoryIcon className="h-5 w-5" />
                    <div>
                      <CardTitle className="capitalize">{category}</CardTitle>
                      <CardDescription>
                        {getCategoryDescription(category)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {categorySteps.length} configured
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Existing Steps */}
                  {categorySteps.length > 0 && (
                    <div className="space-y-2">
                      {categorySteps.map((step, index) => {
                        const StepIcon = STEP_DEFINITIONS[step.type].icon;
                        return (
                          <div
                            key={step.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <StepIcon className="h-4 w-4" />
                            <div className="flex-1">
                              <div className="font-medium">{step.name}</div>
                              {step.config.queryName && (
                                <div className="text-xs text-muted-foreground">
                                  Query: {step.config.queryName}
                                </div>
                              )}
                              {step.config.catalog && step.config.schema && (
                                <div className="text-xs text-muted-foreground">
                                  {step.config.catalog}.{step.config.schema}
                                </div>
                              )}
                            </div>
                            <Badge 
                              variant={
                                step.status === 'configured' ? 'default' : 
                                step.status === 'error' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {step.status}
                            </Badge>
                            {index < categorySteps.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Step Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categoryTypes.map(([type, def]) => {
                      const Icon = def.icon;
                      return (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => addStep(type as StepType)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {def.name}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Pipeline Summary */}
      {pipeline.steps.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pipeline has {pipeline.steps.length} steps configured. Export to save as JSON for version control or import into your orchestration tool.
          </AlertDescription>
        </Alert>
      )}

      {/* Query Selection Modal */}
      <QuerySelectionModal
        isOpen={isQuerySelectorOpen}
        onClose={() => {
          setIsQuerySelectorOpen(false);
          setEditingStepId(null);
        }}
        onSelectQuery={handleQuerySelect}
        onCreateNew={handleCreateNewQuery}
      />
    </div>
  );
}