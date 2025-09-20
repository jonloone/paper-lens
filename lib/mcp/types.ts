// MCP (Model Context Protocol) Types for Tool Integration

export interface MCPConfig {
  name: string;
  type: string;
  endpoint: string;
  auth: {
    type: 'bearer' | 'basic' | 'oauth' | 'apikey';
    credentials?: any;
  };
  capabilities: string[];
  timeout?: number;
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: Date;
    duration: number;
    source: string;
  };
}

export interface MCPHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: Date;
  details?: any;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'table' | 'view' | 'stream' | 'file';
  catalog?: string;
  schema?: string;
  description?: string;
  tags?: string[];
  owner?: string;
  lastModified?: Date;
  sizeBytes?: number;
  rowCount?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  schedule?: string;
  status: 'running' | 'success' | 'failed' | 'paused';
  lastRun?: Date;
  nextRun?: Date;
  tasks?: Task[];
}

export interface Task {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime?: Date;
  endTime?: Date;
  logs?: string;
  error?: string;
}

export interface AccessPolicy {
  id: string;
  name: string;
  resource: string;
  users: string[];
  groups?: string[];
  permissions: string[];
  conditions?: any;
}

export interface DataQualityRule {
  id: string;
  name: string;
  description: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  expression: string;
  threshold?: number;
  enabled: boolean;
}

export interface QueryOptimization {
  original: string;
  optimized: string;
  improvements: {
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  estimatedSpeedup: number;
}