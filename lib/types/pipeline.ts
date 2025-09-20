// Pipeline dynamic loading types
export interface PipelineDefinition {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'paused' | 'failed' | 'draft';
  
  // Core pipeline structure
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  
  // Metadata
  metadata: {
    created: string;
    modified: string;
    owner: string;
    description: string;
    tags: string[];
    runtime: {
      schedule?: string;
      trigger?: 'scheduled' | 'event' | 'manual';
      resources?: ResourceRequirements;
    };
  };
}

export interface PipelineNode {
  id: string;
  type: 'source' | 'transform' | 'sink' | 'quality' | 'branch' | 'join';
  position: { x: number; y: number };
  
  data: {
    label: string;
    technology: Technology;
    config: Record<string, any>;
    status?: 'running' | 'success' | 'failed' | 'pending';
    metrics?: NodeMetrics;
  };
}

export interface Technology {
  type: 'spark' | 'kafka' | 'postgres' | 's3' | 'snowflake' | 'python' | 'sql' | 'api' | 'trino';
  version?: string;
  icon: string;
  color: string; // For visual distinction
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  
  data?: {
    label?: string;
    condition?: string; // For conditional flows
    dataFlow?: {
      records?: number;
      bytes?: number;
      latency?: number;
    };
  };
}

export interface NodeMetrics {
  recordsProcessed?: number;
  duration?: number;
  errorRate?: number;
  throughput?: number;
}

export interface ResourceRequirements {
  cpu: string;
  memory: string;
  storage?: string;
  executors?: number;
}

// MCP Integration types
export interface MCPPipelineStatus {
  nodeId: string;
  status: 'running' | 'success' | 'failed' | 'pending';
  metrics?: NodeMetrics;
}

export interface MCPConnection {
  id: string;
  name: string;
  type: 'airflow' | 'spark' | 'trino' | 'kafka';
  status: 'connected' | 'degraded' | 'disconnected';
  lastUpdate: Date;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'rendering' | 'connecting' | 'ready' | 'error';

// Technology-specific styles
export const technologyStyles: Record<string, { backgroundColor: string; icon: string; borderStyle: string }> = {
  spark: {
    backgroundColor: '#E25A1C',
    icon: '⚡',
    borderStyle: 'solid'
  },
  kafka: {
    backgroundColor: '#231F20',
    icon: '📨',
    borderStyle: 'solid'
  },
  postgres: {
    backgroundColor: '#336791',
    icon: '🐘',
    borderStyle: 'solid'
  },
  trino: {
    backgroundColor: '#DD00A1',
    icon: '🔍',
    borderStyle: 'solid'
  },
  snowflake: {
    backgroundColor: '#29B5E8',
    icon: '❄️',
    borderStyle: 'solid'
  },
  python: {
    backgroundColor: '#3776AB',
    icon: '🐍',
    borderStyle: 'dashed' // For script nodes
  },
  sql: {
    backgroundColor: '#336791',
    icon: '📊',
    borderStyle: 'solid'
  },
  api: {
    backgroundColor: '#6B4C9C',
    icon: '🔌',
    borderStyle: 'dotted' // For external calls
  },
  s3: {
    backgroundColor: '#FF9900',
    icon: '📦',
    borderStyle: 'solid'
  }
};