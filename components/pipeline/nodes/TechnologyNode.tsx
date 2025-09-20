'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Activity,
  Database,
  Zap,
  Server,
  Code,
  FileText,
  Package,
  Globe
} from 'lucide-react';

interface TechnologyNodeData {
  label: string;
  technology: {
    type: string;
    version?: string;
    icon: string;
    color: string;
  };
  config: Record<string, any>;
  status?: 'running' | 'success' | 'failed' | 'pending';
  metrics?: {
    recordsProcessed?: number;
    duration?: number;
    errorRate?: number;
    throughput?: number;
  };
  style?: Record<string, any>;
  isConfigured?: boolean;
}

const StatusIndicator = ({ status }: { status?: string }) => {
  switch (status) {
    case 'running':
      return (
        <div className="relative">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      );
    case 'success':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    case 'pending':
      return <Clock className="h-3 w-3 text-yellow-500" />;
    default:
      return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
  }
};

const TechnologyIcon = ({ type, size = 'sm' }: { type: string; size?: 'sm' | 'md' }) => {
  const iconSize = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  
  switch (type) {
    case 'postgres':
      return <Database className={cn(iconSize, 'text-blue-600')} />;
    case 'spark':
      return <Zap className={cn(iconSize, 'text-orange-600')} />;
    case 'kafka':
      return <Activity className={cn(iconSize, 'text-gray-800')} />;
    case 'trino':
      return <Server className={cn(iconSize, 'text-pink-600')} />;
    case 'python':
      return <Code className={cn(iconSize, 'text-blue-500')} />;
    case 'snowflake':
      return <Package className={cn(iconSize, 'text-blue-400')} />;
    case 's3':
      return <Package className={cn(iconSize, 'text-orange-500')} />;
    case 'api':
      return <Globe className={cn(iconSize, 'text-purple-600')} />;
    default:
      return <FileText className={cn(iconSize, 'text-gray-600')} />;
  }
};

const formatMetrics = (metrics?: TechnologyNodeData['metrics']) => {
  if (!metrics) return [];
  
  const formatted = [];
  if (metrics.recordsProcessed !== undefined) {
    const records = metrics.recordsProcessed >= 1000 
      ? `${(metrics.recordsProcessed / 1000).toFixed(1)}K` 
      : metrics.recordsProcessed.toString();
    formatted.push(`${records} records`);
  }
  
  if (metrics.duration !== undefined) {
    const duration = metrics.duration >= 1000 
      ? `${(metrics.duration / 1000).toFixed(1)}s` 
      : `${metrics.duration}ms`;
    formatted.push(duration);
  }
  
  if (metrics.throughput !== undefined) {
    formatted.push(`${metrics.throughput.toFixed(1)}/s`);
  }
  
  if (metrics.errorRate !== undefined) {
    formatted.push(`${(metrics.errorRate * 100).toFixed(1)}% errors`);
  }
  
  return formatted;
};

export const TechnologyNode: React.FC<NodeProps<TechnologyNodeData>> = ({ data, selected }) => {
  const metrics = formatMetrics(data.metrics);
  
  return (
    <div
      className={cn(
        "relative border-2 rounded-lg shadow-sm bg-white min-w-[160px]",
        selected && "ring-2 ring-blue-500 ring-offset-2",
        !data.isConfigured && "border-dashed"
      )}
      style={{
        borderColor: data.style?.borderColor || data.technology.color,
        borderStyle: data.isConfigured ? 'solid' : 'dashed'
      }}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
      
      {/* Node Header */}
      <div 
        className="px-3 py-2 rounded-t-md"
        style={{ backgroundColor: data.technology.color }}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <TechnologyIcon type={data.technology.type} size="sm" />
            <span className="font-medium text-sm truncate">
              {data.label}
            </span>
          </div>
          <StatusIndicator status={data.status} />
        </div>
      </div>
      
      {/* Node Body */}
      <div className="px-3 py-2 bg-white rounded-b-md">
        {/* Technology Details */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-600">
              {data.technology.type.charAt(0).toUpperCase() + data.technology.type.slice(1)}
            </span>
            {data.technology.version && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                v{data.technology.version}
              </Badge>
            )}
          </div>
          {!data.isConfigured && (
            <Badge variant="secondary" className="text-xs">
              Config needed
            </Badge>
          )}
        </div>
        
        {/* Metrics */}
        {metrics.length > 0 && (
          <div className="space-y-1">
            {metrics.slice(0, 2).map((metric, idx) => (
              <div key={idx} className="text-xs text-gray-500">
                {metric}
              </div>
            ))}
          </div>
        )}
        
        {/* Error State */}
        {data.status === 'failed' && (
          <div className="mt-2 p-1 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Processing failed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Specific node components for different technology types
export const SourcePostgresNode: React.FC<NodeProps<TechnologyNodeData>> = (props) => (
  <TechnologyNode {...props} />
);

export const SourceKafkaNode: React.FC<NodeProps<TechnologyNodeData>> = (props) => (
  <TechnologyNode {...props} />
);

export const TransformSparkNode: React.FC<NodeProps<TechnologyNodeData>> = (props) => (
  <TechnologyNode {...props} />
);

export const TransformPythonNode: React.FC<NodeProps<TechnologyNodeData>> = (props) => (
  <TechnologyNode {...props} />
);

export const TransformTrinoNode: React.FC<NodeProps<TechnologyNodeData>> = (props) => (
  <TechnologyNode {...props} />
);

export const SinkSnowflakeNode: React.FC<NodeProps<TechnologyNodeData>> = (props) => (
  <TechnologyNode {...props} />
);

export const SinkS3Node: React.FC<NodeProps<TechnologyNodeData>> = (props) => (
  <TechnologyNode {...props} />
);

export const SinkKafkaNode: React.FC<NodeProps<TechnologyNodeData>> = (props) => (
  <TechnologyNode {...props} />
);

// Node types registry
export const nodeTypes = {
  'source-postgres': SourcePostgresNode,
  'source-kafka': SourceKafkaNode,
  'transform-spark': TransformSparkNode,
  'transform-python': TransformPythonNode,
  'transform-trino': TransformTrinoNode,
  'sink-snowflake': SinkSnowflakeNode,
  'sink-s3': SinkS3Node,
  'sink-kafka': SinkKafkaNode,
  // Fallback
  'default': TechnologyNode
};

export default TechnologyNode;