'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  MiniMap,
  Panel,
  ReactFlowProvider
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ArrowLeft,
  Plus,
  Library,
  RefreshCw,
  Rocket,
  GitBranch,
  Activity,
  BarChart,
  Zap,
  Database,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Eye,
  Settings,
  Save,
  History,
  ArrowUp,
  ArrowDown,
  GitCommit,
  Tag,
  FileText,
  Diff,
  ChevronRight,
  Hammer,
  Wrench
} from 'lucide-react';

// Import operational command center
import { OperationalCommandCenter } from '@/components/pipeline/OperationalCommandCenter';

// Mock pipeline data - in reality this would come from APIs
interface Pipeline {
  id: string;
  name: string;
  version: string;
  status: 'running' | 'failed' | 'idle' | 'scheduled' | 'building';
  lastRun: string;
  nextRun?: string;
  runtime: string;
  throughput?: string;
  costEstimate: string;
  issueCount?: number;
  hasIssues: boolean;
  isRunning: boolean;
  isDeployed: boolean;
  error?: string;
  description: string;
  owner: string;
  tags: string[];
  nodes?: Node[];
  edges?: Edge[];
  hasUncommittedChanges?: boolean;
  versions?: PipelineVersion[];
  environment: 'dev' | 'staging' | 'prod';
}

interface PipelineVersion {
  version: string;
  timestamp: string;
  author: string;
  description: string;
  gitCommit?: string;
  isActive: boolean;
  changesCount: number;
  definition: {
    nodes: Node[];
    edges: Edge[];
  };
  environment: 'dev' | 'staging' | 'prod';
}

const mockPipelines: Pipeline[] = [
  // Pipelines from Operations page (using underscores)
  {
    id: 'customer_360_enrichment',
    name: 'customer_360_enrichment',
    version: '3.2.1',
    status: 'failed',
    lastRun: '2 hours ago',
    nextRun: 'In 22 min',
    runtime: '~45 min',
    costEstimate: '$3.50/run',
    issueCount: 2,
    hasIssues: true,
    isRunning: false,
    isDeployed: true,
    error: 'Memory exceeded in spark executor',
    description: 'Customer 360 data enrichment and aggregation',
    owner: 'data-eng',
    tags: ['production', 'daily', 'customer-data'],
    environment: 'prod',
    hasUncommittedChanges: false
  },
  {
    id: 'payment_processing_v3',
    name: 'payment_processing_v3',
    version: '1.8.2',
    status: 'running',
    lastRun: 'Running',
    runtime: 'continuous',
    throughput: '1.2K events/sec',
    costEstimate: '$48/day',
    hasIssues: false,
    isRunning: true,
    isDeployed: true,
    description: 'Real-time payment processing and fraud detection',
    owner: 'payments-team',
    tags: ['production', 'streaming', 'payments'],
    environment: 'prod',
    hasUncommittedChanges: false
  },
  // Original pipelines (using hyphens for backward compatibility)
  {
    id: 'customer-etl-prod',
    name: 'customer_etl_prod',
    version: '2.1.4',
    status: 'failed',
    lastRun: '2 hours ago',
    nextRun: 'In 22 min',
    runtime: '~12 min',
    costEstimate: '$2.40/run',
    issueCount: 3,
    hasIssues: true,
    isRunning: false,
    isDeployed: true,
    error: 'Schema validation failed on customer.email field',
    description: 'Daily customer data ETL with validation and enrichment',
    owner: 'data-eng',
    tags: ['production', 'daily', 'customer-data'],
    environment: 'prod',
    hasUncommittedChanges: false,
    versions: [
      {
        version: '2.1.4',
        timestamp: '2 hours ago',
        author: 'sarah.chen',
        description: 'Add GDPR compliance fields',
        isActive: true,
        changesCount: 3,
        definition: { nodes: [], edges: [] },
        environment: 'prod'
      },
      {
        version: '2.1.3',
        timestamp: '1 week ago',
        author: 'mike.torres',
        description: 'Optimize memory usage',
        isActive: false,
        changesCount: 8,
        definition: { nodes: [], edges: [] },
        environment: 'prod'
      },
      {
        version: '2.1.2',
        timestamp: '2 weeks ago',
        author: 'sarah.chen',
        description: 'Fix email validation regex',
        isActive: false,
        changesCount: 1,
        definition: { nodes: [], edges: [] },
        environment: 'prod'
      }
    ]
  },
  {
    id: 'payment-stream-prod',
    name: 'payment_stream_prod',
    version: '1.8.2',
    status: 'running',
    lastRun: 'Running',
    runtime: 'continuous',
    throughput: '1.2K events/sec',
    costEstimate: '$48/day',
    hasIssues: false,
    isRunning: true,
    isDeployed: true,
    description: 'Real-time payment processing and fraud detection',
    owner: 'payments-team',
    tags: ['production', 'streaming', 'payments'],
    environment: 'prod',
    hasUncommittedChanges: false
  },
  {
    id: 'analytics-dashboard-refresh',
    name: 'analytics_dashboard_refresh',
    version: '1.0.1',
    status: 'scheduled',
    lastRun: '6 hours ago',
    nextRun: 'In 6 hours',
    runtime: '~3 min',
    costEstimate: '$0.80/run',
    hasIssues: false,
    isRunning: false,
    isDeployed: true,
    description: 'Refresh executive dashboard data',
    owner: 'analytics',
    tags: ['dashboard', 'analytics', '4x-daily'],
    environment: 'prod',
    hasUncommittedChanges: false
  },
  {
    id: 'ml-feature-pipeline',
    name: 'ml_feature_pipeline',
    version: '0.9.0',
    status: 'building',
    lastRun: 'Never deployed',
    runtime: 'Unknown',
    costEstimate: 'TBD',
    hasIssues: false,
    isRunning: false,
    isDeployed: false,
    description: 'Feature engineering pipeline for recommendation model',
    owner: 'ml-team',
    tags: ['dev', 'ml', 'features'],
    environment: 'dev',
    hasUncommittedChanges: true,
    versions: [
      {
        version: '0.9.0',
        timestamp: '3 hours ago',
        author: 'alex.kim',
        description: 'Add behavioral features',
        isActive: true,
        changesCount: 12,
        definition: { nodes: [], edges: [] },
        environment: 'dev'
      },
      {
        version: '0.8.5',
        timestamp: '1 day ago',
        author: 'alex.kim',
        description: 'Checkpoint before feature expansion',
        isActive: false,
        changesCount: 0,
        definition: { nodes: [], edges: [] },
        environment: 'dev'
      }
    ]
  }
];

// Pipeline patterns for creation
const PIPELINE_PATTERNS = {
  'daily-etl': {
    name: 'Daily ETL',
    description: 'Extract, transform, load pattern for batch processing',
    estimatedTime: '5-15 min',
    cost: '$1-5/run',
    complexity: 'Medium',
    nodes: [
      {
        id: 'source',
        type: 'default',
        position: { x: 100, y: 200 },
        data: { 
          label: 'Data Source',
          type: 'source',
          configured: true,
          config: { connection: 'postgres-prod', query: 'SELECT * FROM customers WHERE updated_at > ?' }
        },
        style: { background: '#e3f2fd', borderColor: '#1976d2', width: 150 }
      },
      {
        id: 'validate',
        type: 'default',
        position: { x: 350, y: 150 },
        data: { 
          label: 'Validate & Clean',
          type: 'transform',
          configured: true,
          config: { rules: ['not_null:email', 'format:phone', 'range:age,0,120'] }
        },
        style: { background: '#f3e5f5', borderColor: '#7b1fa2', width: 150 }
      },
      {
        id: 'transform',
        type: 'default',
        position: { x: 350, y: 250 },
        data: { 
          label: 'Business Logic',
          type: 'transform',
          configured: true,
          config: { operations: ['calculate_ltv', 'segment_customer', 'enrich_geo'] }
        },
        style: { background: '#f3e5f5', borderColor: '#7b1fa2', width: 150 }
      },
      {
        id: 'sink',
        type: 'default',
        position: { x: 600, y: 200 },
        data: { 
          label: 'Data Warehouse',
          type: 'sink',
          configured: true,
          config: { table: 'customer_gold', writeMode: 'upsert' }
        },
        style: { background: '#e8f5e8', borderColor: '#388e3c', width: 150 }
      }
    ],
    edges: [
      { id: 'e1', source: 'source', target: 'validate', type: 'default' },
      { id: 'e2', source: 'source', target: 'transform', type: 'default' },
      { id: 'e3', source: 'validate', target: 'sink', type: 'default' },
      { id: 'e4', source: 'transform', target: 'sink', type: 'default' }
    ]
  },
  'stream-processing': {
    name: 'Stream Processing',
    description: 'Real-time event processing with enrichment and routing',
    estimatedTime: 'continuous',
    cost: '$20-100/day',
    complexity: 'High',
    nodes: [
      {
        id: 'kafka',
        type: 'default',
        position: { x: 50, y: 200 },
        data: { 
          label: 'Kafka Stream',
          type: 'source',
          configured: true,
          config: { topic: 'user.events', consumerGroup: 'processor-v1' }
        },
        style: { background: '#e3f2fd', borderColor: '#1976d2', width: 120 }
      },
      {
        id: 'parse',
        type: 'default',
        position: { x: 220, y: 200 },
        data: { 
          label: 'Parse JSON',
          type: 'transform',
          configured: true,
          config: { schema: 'user_event_v2', validate: true }
        },
        style: { background: '#f3e5f5', borderColor: '#7b1fa2', width: 120 }
      },
      {
        id: 'filter',
        type: 'default',
        position: { x: 390, y: 200 },
        data: { 
          label: 'Filter Valid',
          type: 'transform',
          configured: true,
          config: { condition: 'event.user_id IS NOT NULL AND event.timestamp > now() - 1h' }
        },
        style: { background: '#f3e5f5', borderColor: '#7b1fa2', width: 120 }
      },
      {
        id: 'enrich',
        type: 'default',
        position: { x: 560, y: 200 },
        data: { 
          label: 'Enrich User',
          type: 'transform',
          configured: false,
          config: { lookupTable: null, cacheTimeout: 300 }
        },
        style: { background: '#fff3e0', borderColor: '#f57c00', width: 120, borderStyle: 'dashed' }
      },
      {
        id: 'analytics',
        type: 'default',
        position: { x: 730, y: 150 },
        data: { 
          label: 'Analytics',
          type: 'sink',
          configured: false,
          config: { destination: null, batchSize: 1000 }
        },
        style: { background: '#fff3e0', borderColor: '#f57c00', width: 120, borderStyle: 'dashed' }
      },
      {
        id: 'alerts',
        type: 'default',
        position: { x: 730, y: 250 },
        data: { 
          label: 'Alert System',
          type: 'sink',
          configured: false,
          config: { webhook: null, conditions: [] }
        },
        style: { background: '#fff3e0', borderColor: '#f57c00', width: 120, borderStyle: 'dashed' }
      }
    ],
    edges: [
      { id: 'e1', source: 'kafka', target: 'parse' },
      { id: 'e2', source: 'parse', target: 'filter' },
      { id: 'e3', source: 'filter', target: 'enrich' },
      { id: 'e4', source: 'enrich', target: 'analytics' },
      { id: 'e5', source: 'enrich', target: 'alerts' }
    ]
  },
  'ml-pipeline': {
    name: 'ML Pipeline',
    description: 'Feature engineering and model training pipeline',
    estimatedTime: '30-60 min',
    cost: '$10-25/run',
    complexity: 'High',
    nodes: [
      {
        id: 'features',
        type: 'default',
        position: { x: 100, y: 200 },
        data: { 
          label: 'Feature Store',
          type: 'source',
          configured: true,
          config: { features: ['user_profile', 'transaction_history', 'behavioral_features'] }
        },
        style: { background: '#e3f2fd', borderColor: '#1976d2', width: 140 }
      },
      {
        id: 'engineer',
        type: 'default',
        position: { x: 300, y: 200 },
        data: { 
          label: 'Feature Engineering',
          type: 'transform',
          configured: true,
          config: { transforms: ['normalize', 'encode_categorical', 'create_interactions'] }
        },
        style: { background: '#f3e5f5', borderColor: '#7b1fa2', width: 140 }
      },
      {
        id: 'split',
        type: 'default',
        position: { x: 500, y: 200 },
        data: { 
          label: 'Train/Test Split',
          type: 'transform',
          configured: true,
          config: { ratio: 0.8, stratify: 'target', randomState: 42 }
        },
        style: { background: '#f3e5f5', borderColor: '#7b1fa2', width: 140 }
      },
      {
        id: 'train',
        type: 'default',
        position: { x: 700, y: 150 },
        data: { 
          label: 'Model Training',
          type: 'compute',
          configured: false,
          config: { algorithm: null, hyperparams: {} }
        },
        style: { background: '#fff3e0', borderColor: '#f57c00', width: 140, borderStyle: 'dashed' }
      },
      {
        id: 'evaluate',
        type: 'default',
        position: { x: 700, y: 250 },
        data: { 
          label: 'Model Evaluation',
          type: 'compute',
          configured: false,
          config: { metrics: ['auc', 'precision', 'recall'], threshold: 0.5 }
        },
        style: { background: '#fff3e0', borderColor: '#f57c00', width: 140, borderStyle: 'dashed' }
      }
    ],
    edges: [
      { id: 'e1', source: 'features', target: 'engineer' },
      { id: 'e2', source: 'engineer', target: 'split' },
      { id: 'e3', source: 'split', target: 'train' },
      { id: 'e4', source: 'split', target: 'evaluate' }
    ]
  }
};

export type StudioMode = 'build' | 'operate' | 'optimize' | 'monitor';

interface ProfessionalStudioProps {
  initialMode?: StudioMode;
  pipelineId?: string | null;
  pipelineName?: string;
  onModeChange?: (mode: StudioMode) => void;
}

// Status indicator component
const StatusIndicator = ({ status }: { status: Pipeline['status'] }) => {
  switch (status) {
    case 'running':
      return (
        <div className="relative">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      );
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'scheduled':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'building':
      return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />;
    default:
      return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
  }
};

// Environment badge component
const EnvironmentBadge = ({ environment }: { environment: Pipeline['environment'] }) => {
  const colors = {
    dev: 'bg-yellow-100 text-yellow-800',
    staging: 'bg-blue-100 text-blue-800',
    prod: 'bg-green-100 text-green-800'
  };
  
  return (
    <Badge className={cn('text-xs', colors[environment])}>
      {environment.toUpperCase()}
    </Badge>
  );
};

// Version Control Component
const VersionControl = ({ pipeline }: { pipeline: Pipeline }) => {
  const [versionSelectorOpen, setVersionSelectorOpen] = useState(false);
  const currentVersion = pipeline.versions?.find(v => v.isActive) || pipeline.versions?.[0];
  
  const handleVersionChange = (version: PipelineVersion) => {
    console.log('Loading version:', version.version);
    // In reality: load pipeline definition from this version
    setVersionSelectorOpen(false);
  };
  
  const saveNewVersion = () => {
    const description = prompt('Describe your changes:');
    if (description) {
      console.log('Creating checkpoint:', description);
      // In reality: save current state as new version
    }
  };
  
  const promoteToProduction = () => {
    if (pipeline.environment === 'dev') {
      console.log('Promoting to staging first');
      // In reality: deploy to staging environment
    } else if (pipeline.environment === 'staging') {
      console.log('Promoting to production');
      // In reality: deploy to production environment
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      {/* Version Selector */}
      <Popover open={versionSelectorOpen} onOpenChange={setVersionSelectorOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-32">
            <Tag className="h-3 w-3 mr-1" />
            v{pipeline.version}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="font-medium text-sm">Version History</div>
            <div className="text-xs text-muted-foreground">
              {pipeline.environment} environment
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {pipeline.versions?.map((version, idx) => (
              <div
                key={version.version}
                className={cn(
                  "p-3 cursor-pointer hover:bg-muted/50 border-b border-gray-100 last:border-0",
                  version.isActive && "bg-blue-50"
                )}
                onClick={() => handleVersionChange(version)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3 text-blue-600" />
                    <span className="font-medium text-sm">v{version.version}</span>
                    {version.isActive && (
                      <Badge variant="default" className="text-xs px-1 py-0">
                        Current
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {version.timestamp}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {version.description}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    by {version.author}
                  </span>
                  {version.changesCount > 0 && (
                    <span className="text-xs text-blue-600">
                      {version.changesCount} changes
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => console.log('Compare versions')}
            >
              <Diff className="h-3 w-3 mr-1" />
              Compare Versions
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Checkpoint Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={saveNewVersion}
        disabled={!pipeline.hasUncommittedChanges && pipeline.environment === 'prod'}
      >
        <Save className="h-3 w-3 mr-1" />
        {pipeline.hasUncommittedChanges ? 'Save' : 'Checkpoint'}
      </Button>
      
      {/* Environment Promotion */}
      {pipeline.environment !== 'prod' && (
        <Button
          variant="default"
          size="sm"
          onClick={promoteToProduction}
          disabled={pipeline.hasUncommittedChanges || !pipeline.isDeployed}
        >
          <ArrowUp className="h-3 w-3 mr-1" />
          {pipeline.environment === 'dev' ? 'To Staging' : 'To Production'}
        </Button>
      )}
      
      {/* Rollback for failed pipelines */}
      {pipeline.hasIssues && pipeline.versions && pipeline.versions.length > 1 && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            const lastWorking = pipeline.versions?.find(v => !v.isActive);
            if (lastWorking) {
              console.log('Rolling back to', lastWorking.version);
              // In reality: rollback to this version
            }
          }}
        >
          <ArrowDown className="h-3 w-3 mr-1" />
          Rollback
        </Button>
      )}
    </div>
  );
};

const ProfessionalStudio: React.FC<ProfessionalStudioProps> = ({
  initialMode = 'build',
  pipelineId,
  pipelineName = 'New Pipeline',
  onModeChange
}) => {
  // Handle both direct ID match and name-based match for URL parameters
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(() => {
    if (!pipelineId) return null;
    
    // First try exact ID match
    const exactMatch = mockPipelines.find(p => p.id === pipelineId);
    if (exactMatch) return exactMatch;
    
    // Then try matching by name (handle both formats: customer-etl-prod and customer_etl_prod)
    const nameMatch = mockPipelines.find(p => 
      p.id === pipelineId.replace(/_/g, '-') || 
      p.name === pipelineId || 
      p.name === pipelineId.replace(/-/g, '_')
    );
    
    return nameMatch || null;
  });
  const [selectorOpen, setSelectorOpen] = useState(false);
  
  // Pipeline selector component
  const PipelineSelector = () => {
    const runningPipelines = mockPipelines.filter(p => p.isRunning);
    const failingPipelines = mockPipelines.filter(p => p.hasIssues);
    const recentPipelines = mockPipelines.filter(p => !p.isRunning && !p.hasIssues).slice(0, 3);
    
    return (
      <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-80 justify-between h-11">
            {selectedPipeline ? (
              <div className="flex items-center gap-2">
                <StatusIndicator status={selectedPipeline.status} />
                <span className="truncate font-medium">{selectedPipeline.name}</span>
                <EnvironmentBadge environment={selectedPipeline.environment} />
                <Badge variant="outline" className="ml-1 text-xs">
                  v{selectedPipeline.version}
                </Badge>
                {selectedPipeline.hasUncommittedChanges && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" title="Uncommitted changes" />
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Select pipeline...</span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search pipelines..." />
            <CommandList>
              <CommandEmpty>No pipelines found.</CommandEmpty>
              
              {/* Failing Pipelines */}
              {failingPipelines.length > 0 && (
                <CommandGroup heading="🚨 Needs Attention (Operational View Available)">
                  {failingPipelines.map(pipeline => (
                    <CommandItem
                      key={pipeline.id}
                      onSelect={() => {
                        setSelectedPipeline(pipeline);
                        setSelectorOpen(false);
                      }}
                      className="h-auto py-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <StatusIndicator status={pipeline.status} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{pipeline.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {pipeline.error}
                          </div>
                        </div>
                        <Badge variant="destructive" className="ml-2 text-xs">
                          {pipeline.issueCount}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Running Pipelines */}
              {runningPipelines.length > 0 && (
                <CommandGroup heading="▶️ Currently Running (Operational View Available)">
                  {runningPipelines.map(pipeline => (
                    <CommandItem
                      key={pipeline.id}
                      onSelect={() => {
                        setSelectedPipeline(pipeline);
                        setSelectorOpen(false);
                      }}
                      className="h-auto py-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <StatusIndicator status={pipeline.status} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{pipeline.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {pipeline.throughput && `${pipeline.throughput} • `}
                            {pipeline.costEstimate}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Recent Pipelines */}
              {recentPipelines.length > 0 && (
                <CommandGroup heading="📋 Recent">
                  {recentPipelines.map(pipeline => (
                    <CommandItem
                      key={pipeline.id}
                      onSelect={() => {
                        setSelectedPipeline(pipeline);
                        setSelectorOpen(false);
                      }}
                      className="h-auto py-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <StatusIndicator status={pipeline.status} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{pipeline.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {pipeline.lastRun} • {pipeline.costEstimate}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              <CommandSeparator />
              
              {/* Create New */}
              <CommandGroup>
                <CommandItem onSelect={() => setSelectedPipeline(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Pipeline
                </CommandItem>
                <CommandItem onSelect={() => console.log('Browse patterns')}>
                  <Library className="h-4 w-4 mr-2" />
                  Browse Patterns
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // Pipeline Hub when no pipeline is selected
  const PipelineHub = () => {
    const failingPipelines = mockPipelines.filter(p => p.hasIssues);
    const runningPipelines = mockPipelines.filter(p => p.isRunning);
    
    return (
      <div className="h-full overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto p-8">
          {/* Urgent Issues First */}
          {failingPipelines.length > 0 && (
            <Alert className="mb-8 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-800 font-semibold">
                Pipeline Failures Require Attention
              </AlertTitle>
              <AlertDescription className="text-red-700 mt-2">
                {failingPipelines.length} pipeline{failingPipelines.length > 1 ? 's' : ''} need immediate attention
              </AlertDescription>
              <div className="mt-4 space-y-2">
                {failingPipelines.map(p => (
                  <Button
                    key={p.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-3 bg-white hover:bg-red-50"
                    onClick={() => setSelectedPipeline(p)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.error}</div>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        {p.issueCount} issues
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </Alert>
          )}
          
          {/* Active Pipelines */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Active Pipelines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {runningPipelines.map(pipeline => (
                <Card
                  key={pipeline.id}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white border-green-200"
                  onClick={() => setSelectedPipeline(pipeline)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIndicator status={pipeline.status} />
                        <CardTitle className="text-base truncate">{pipeline.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        v{pipeline.version}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground mb-3">
                      {pipeline.description}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BarChart className="h-3 w-3" />
                        {pipeline.throughput}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {pipeline.costEstimate}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Create New Section */}
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Create New Pipeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(PIPELINE_PATTERNS).map(([key, pattern]) => (
                <Card 
                  key={key}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                  onClick={() => createFromPattern(key)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{pattern.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      {pattern.description}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Runtime:</span>
                        <span>{pattern.estimatedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost:</span>
                        <span>{pattern.cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Complexity:</span>
                        <Badge variant="outline" className="text-xs">
                          {pattern.complexity}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card 
                className="border-dashed border-2 cursor-pointer hover:border-solid hover:border-primary hover:shadow-md transition-all bg-gray-50"
                onClick={() => createCustomPipeline()}
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px]">
                  <Plus className="h-12 w-12 mb-4 text-muted-foreground" />
                  <span className="font-medium">Custom Pipeline</span>
                  <span className="text-xs text-muted-foreground text-center mt-2">
                    Start from scratch with empty canvas
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to create pipeline from pattern
  const createFromPattern = (patternKey: string) => {
    const pattern = PIPELINE_PATTERNS[patternKey as keyof typeof PIPELINE_PATTERNS];
    const newPipeline: Pipeline = {
      id: `new-${Date.now()}`,
      name: `new_${patternKey}_pipeline`,
      version: '0.1.0',
      status: 'building',
      lastRun: 'Never deployed',
      runtime: pattern.estimatedTime,
      costEstimate: pattern.cost,
      hasIssues: false,
      isRunning: false,
      isDeployed: false,
      description: pattern.description,
      owner: 'current-user',
      tags: ['development'],
      nodes: pattern.nodes,
      edges: pattern.edges
    };
    setSelectedPipeline(newPipeline);
  };

  const createCustomPipeline = () => {
    const newPipeline: Pipeline = {
      id: `custom-${Date.now()}`,
      name: 'custom_pipeline',
      version: '0.1.0',
      status: 'building',
      lastRun: 'Never deployed',
      runtime: 'Unknown',
      costEstimate: 'TBD',
      hasIssues: false,
      isRunning: false,
      isDeployed: false,
      description: 'Custom pipeline built from scratch',
      owner: 'current-user',
      tags: ['development'],
      nodes: [],
      edges: []
    };
    setSelectedPipeline(newPipeline);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Bar */}
      <div className="h-16 border-b bg-white px-4 flex items-center gap-4 flex-shrink-0">
        <PipelineSelector />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {selectedPipeline ? (
          <PipelineStudio pipeline={selectedPipeline} />
        ) : (
          <PipelineHub />
        )}
      </div>
    </div>
  );
};

// Canvas Components (defined before PipelineStudio to fix ordering)
const BuildCanvas = ({ pipeline }: { pipeline: Pipeline }) => {
  // Use dynamic pipeline studio for actual pipelines, fallback to static for patterns
  if (pipeline.id.startsWith('new-') || pipeline.id.startsWith('custom-')) {
    // For new pipelines, use the existing static canvas
    const [nodes, setNodes, onNodesChange] = useNodesState(pipeline.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(pipeline.edges || []);

    const onConnect = useCallback(
      (params: Connection) => setEdges((eds) => addEdge(params, eds)),
      [setEdges]
    );

    return (
      <div className="h-full">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-right">
              <div className="bg-white p-2 rounded shadow space-y-2">
                <div className="text-xs font-medium">Pipeline Status</div>
                <div className="text-xs text-muted-foreground">
                  {nodes.length} nodes • {edges.length} connections
                </div>
                <div className="text-xs text-muted-foreground">
                  {nodes.filter(n => !n.data.configured).length} need configuration
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    );
  }

  // For existing pipelines, use operational command center
  return (
    <div className="h-full">
      <OperationalCommandCenter pipelineId={pipeline.id} />
    </div>
  );
};

const OperateCanvas = ({ pipeline }: { pipeline: Pipeline }) => {
  return (
    <div className="h-full flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Pipeline Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {pipeline.error || 'Pipeline has operational issues'}
              </AlertDescription>
            </Alert>
            <Button className="w-full">
              <Wrench className="h-4 w-4 mr-2" />
              Start Troubleshooting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OptimizeCanvas = ({ pipeline }: { pipeline: Pipeline }) => {
  return (
    <div className="h-full flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Optimization Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Analyzing pipeline performance...
            </div>
            <Button className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MonitorCanvas = ({ pipeline }: { pipeline: Pipeline }) => {
  return (
    <div className="h-full flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Pipeline Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className="capitalize">{pipeline.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Run:</span>
                <span>{pipeline.lastRun}</span>
              </div>
              {pipeline.throughput && (
                <div className="flex justify-between text-sm">
                  <span>Throughput:</span>
                  <span>{pipeline.throughput}</span>
                </div>
              )}
            </div>
            <Button className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Pipeline Studio Component (placeholder for now)
const PipelineStudio = ({ pipeline }: { pipeline: Pipeline }) => {
  const [mode, setMode] = useState<StudioMode>(() => {
    if (pipeline.hasIssues) return 'operate';
    if (pipeline.isRunning) return 'monitor';
    if (!pipeline.isDeployed) return 'build';
    return 'monitor';
  });

  const getAvailableModes = (pipeline: Pipeline): StudioMode[] => {
    const modes: StudioMode[] = ['build'];
    if (pipeline.isDeployed) modes.push('monitor');
    if (pipeline.hasIssues) modes.push('operate');
    if (pipeline.isRunning || pipeline.isDeployed) modes.push('optimize');
    return modes;
  };

  const availableModes = getAvailableModes(pipeline);

  return (
    <div className="h-full flex flex-col">
      {/* Pipeline Header */}
      <div className="h-16 border-b bg-white px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div>
            <div className="flex items-center gap-2">
              <StatusIndicator status={pipeline.status} />
              <h2 className="font-semibold">{pipeline.name}</h2>
              <EnvironmentBadge environment={pipeline.environment} />
              <Badge variant="outline">v{pipeline.version}</Badge>
              {pipeline.hasUncommittedChanges && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                  Unsaved changes
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {pipeline.lastRun} • {pipeline.nextRun && `Next: ${pipeline.nextRun} • `}
              Cost: {pipeline.costEstimate}
            </div>
          </div>
        </div>
        
        {/* Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {availableModes.map(m => (
            <Button
              key={m}
              variant={mode === m ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode(m)}
              className="capitalize"
            >
              {m === 'build' && <Hammer className="h-4 w-4 mr-1" />}
              {m === 'operate' && <Wrench className="h-4 w-4 mr-1" />}
              {m === 'optimize' && <TrendingUp className="h-4 w-4 mr-1" />}
              {m === 'monitor' && <Eye className="h-4 w-4 mr-1" />}
              {m}
            </Button>
          ))}
        </div>
        
        {/* Version Control and Actions */}
        <div className="flex items-center gap-4">
          <VersionControl pipeline={pipeline} />
          
          <div className="h-6 w-px bg-border" />
          
          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            {mode === 'build' && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => {
                  if (pipeline.hasUncommittedChanges) {
                    console.log('Auto-checkpoint before deploy');
                  }
                  console.log('Deploy pipeline');
                }}
              >
                <Rocket className="h-4 w-4 mr-1" />
                Deploy
              </Button>
            )}
            {mode === 'operate' && pipeline.hasIssues && (
              <Button variant="destructive" size="sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Fix All ({pipeline.issueCount})
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 min-h-0">
        {mode === 'build' && <BuildCanvas pipeline={pipeline} />}
        {mode === 'operate' && <OperateCanvas pipeline={pipeline} />}
        {mode === 'optimize' && <OptimizeCanvas pipeline={pipeline} />}
        {mode === 'monitor' && <MonitorCanvas pipeline={pipeline} />}
      </div>
    </div>
  );
};

export default ProfessionalStudio;