// Reality-first node structure that reflects actual production pipelines

export type IntegrationLevel = 'mcp-full' | 'tool-direct' | 'config-only' | 'documentation';
export type PipelineSource = 'airflow' | 'nifi' | 'spark' | 'dbt' | 'kubernetes' | 'jenkins' | 'manual';
export type Environment = 'dev' | 'staging' | 'prod';
export type SyncStatus = 'synced' | 'modified' | 'unknown' | 'error';

interface RealityReference {
  source: PipelineSource;
  sourceId: string;  // DAG task ID, NiFi processor ID, etc.
  location: {
    system: string;  // Which Airflow instance, NiFi cluster, etc.
    environment: Environment;
    url?: string;    // Direct link to tool UI
    cluster?: string; // Kubernetes cluster, Spark cluster, etc.
  };
  
  // Integration level determines interaction capabilities
  integration: {
    level: IntegrationLevel;
    mcpServer?: string;
    apiEndpoint?: string;
    configPath?: string;
    toolVersion?: string;
  };
  
  // Last known state for change detection
  lastSync: {
    timestamp: string;
    status: SyncStatus;
    hash: string;  // Config hash for change detection
    error?: string;
  };
}

interface NodeConfiguration {
  actual: any;      // Real config from tool
  override?: any;   // Local modifications not yet pushed
  schema?: any;     // Expected configuration schema
  template?: any;   // Template defaults
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface ExecutionContext {
  schedule?: {
    cron?: string;
    interval?: string;
    trigger: 'manual' | 'scheduled' | 'event' | 'upstream';
  };
  runtime?: {
    engine: 'spark' | 'kubernetes' | 'lambda' | 'local' | 'airflow';
    version?: string;
  };
  resources?: {
    cpu?: string;
    memory?: string;
    executors?: number;
    storage?: string;
  };
  dependencies?: {
    upstream: string[];
    downstream: string[];
    external?: string[];  // External systems
  };
}

interface NodeMetrics {
  performance?: {
    avgDuration?: number;
    successRate?: number;
    throughput?: number;
    lastRun?: string;
  };
  health?: {
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    issues?: string[];
    lastCheck?: string;
  };
  usage?: {
    runCount?: number;
    dataProcessed?: number;
    costEstimate?: number;
  };
}

export interface RealNode {
  // Identity
  id: string;
  type: string;
  label: string;
  
  // React Flow positioning
  position: { x: number; y: number };
  
  // Reality reference - connection to actual production system
  reality: RealityReference;
  
  // Configuration (actual from tool)
  config: NodeConfiguration;
  
  // Execution context
  execution: ExecutionContext;
  
  // Real-time metrics and health
  metrics?: NodeMetrics;
  
  // UI state
  ui?: {
    selected?: boolean;
    highlighted?: boolean;
    collapsed?: boolean;
    showMetrics?: boolean;
  };
  
  // Version information
  version?: {
    current: string;
    available?: string;
    changelog?: string[];
  };
}

export interface RealEdge {
  id: string;
  source: string;
  target: string;
  
  // Reality reference
  reality?: {
    source: PipelineSource;
    type: 'dependency' | 'data-flow' | 'trigger' | 'manual';
    condition?: string;  // Conditional logic
  };
  
  // Data flow information
  dataFlow?: {
    schema?: any;
    volume?: number;
    frequency?: string;
    format?: 'json' | 'avro' | 'parquet' | 'csv' | 'binary';
  };
  
  // UI state
  animated?: boolean;
  style?: any;
}

export interface RealPipeline {
  id: string;
  name: string;
  description?: string;
  
  // Structure
  nodes: RealNode[];
  edges: RealEdge[];
  
  // Reality reference
  reality: {
    source: PipelineSource;
    sourceId: string;
    location: {
      system: string;
      environment: Environment;
      url?: string;
    };
    lastSync: {
      timestamp: string;
      status: SyncStatus;
      hash: string;
    };
  };
  
  // Version control
  version: {
    current: string;
    production?: string;
    staging?: string;
    draft?: string;
  };
  
  // Schedule and triggers
  schedule?: {
    cron?: string;
    enabled: boolean;
    timezone?: string;
  };
  
  // Pipeline metrics
  metrics?: {
    runs: {
      total: number;
      successful: number;
      failed: number;
      avgDuration: number;
    };
    health: {
      status: 'healthy' | 'warning' | 'critical';
      score: number;
      issues: string[];
    };
  };
  
  // Metadata
  metadata: {
    owner?: string;
    team?: string;
    tags?: string[];
    created: string;
    modified: string;
    fromTemplate?: string;
  };
}

// Tool capability mapping
export interface ToolCapability {
  read: boolean;
  write: boolean;
  execute: boolean;
  monitor: boolean;
  version: boolean;
}

export interface ToolIntegration {
  name: string;
  type: PipelineSource;
  level: IntegrationLevel;
  capabilities: ToolCapability;
  apiEndpoint?: string;
  mcpServer?: string;
  uiUrl?: string;
  healthCheck?: () => Promise<boolean>;
}

// Pipeline patterns for templates
export interface PipelinePattern {
  id: string;
  name: string;
  category: 'etl' | 'streaming' | 'ml' | 'orchestration' | 'custom';
  description: string;
  
  // Pattern structure
  template: {
    nodes: Partial<RealNode>[];
    edges: Partial<RealEdge>[];
    layout?: LayoutStrategy;
  };
  
  // Customization parameters
  parameters: {
    name: string;
    type: 'string' | 'number' | 'select' | 'node-type' | 'environment';
    description: string;
    default?: any;
    options?: any[];
    required: boolean;
  }[];
  
  // Requirements
  requirements: {
    tools: PipelineSource[];
    mcpServers?: string[];
    minNodes?: number;
    maxNodes?: number;
  };
  
  // Usage analytics
  usage: {
    count: number;
    lastUsed: string;
    successRate: number;
    avgSetupTime: number;
  };
}

export interface LayoutStrategy {
  algorithm: 'dagre' | 'elk' | 'force' | 'manual';
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  spacing: { x: number; y: number };
  grouping?: 'none' | 'by-stage' | 'by-tool' | 'parallel-paths';
  layering?: 'longest-path' | 'network-simplex' | 'tight-tree';
}

// Version control for pipelines
export interface PipelineVersion {
  version: string;  // Semantic versioning
  hash: string;     // Content hash
  
  changes: {
    nodes: {
      added: string[];
      modified: string[];
      removed: string[];
    };
    edges: {
      added: string[];
      removed: string[];
    };
    configs: {
      nodeId: string;
      field: string;
      oldValue: any;
      newValue: any;
    }[];
  };
  
  metadata: {
    author: string;
    timestamp: string;
    message: string;
    environment: Environment;
  };
  
  deployment: {
    status: 'draft' | 'testing' | 'staged' | 'production';
    deployedTo: string[];
    rollbackTo?: string;  // Previous version for rollback
  };
}

// Execution tracking
export interface PipelineExecution {
  id: string;
  pipelineId: string;
  version: string;
  
  status: 'running' | 'success' | 'failed' | 'cancelled' | 'pending';
  startTime: number;
  endTime?: number;
  
  nodes: Map<string, NodeExecution>;
  
  trigger: {
    type: 'manual' | 'scheduled' | 'api' | 'upstream';
    user?: string;
    reason?: string;
  };
  
  metrics: {
    duration?: number;
    dataProcessed?: number;
    cost?: number;
    resourceUsage?: any;
  };
  
  logs?: {
    level: 'info' | 'warn' | 'error';
    timestamp: number;
    message: string;
    nodeId?: string;
  }[];
}

export interface NodeExecution {
  nodeId: string;
  status: 'idle' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  
  progress?: {
    percent: number;
    message?: string;
  };
  
  metrics?: {
    recordsProcessed?: number;
    processingTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    errors?: number;
  };
  
  logs?: string[];
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

// Discovery results from external systems
export interface DiscoveredPipeline {
  source: PipelineSource;
  id: string;
  name: string;
  description?: string;
  
  nodeCount: number;
  lastRun?: string;
  status?: 'active' | 'paused' | 'draft';
  
  // Integration options
  integration: {
    available: IntegrationLevel[];
    recommended: IntegrationLevel;
    limitations?: string[];
  };
  
  // Preview data
  preview?: {
    nodes: { id: string; type: string; label: string }[];
    edges: { source: string; target: string }[];
  };
}