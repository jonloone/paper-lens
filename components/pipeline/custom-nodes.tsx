'use client';

import { Handle, Position } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Image from 'next/image';
import { NodeHoverCard } from './node-hover-card';
import { BalancedNameDisplay } from './balanced-name-display';

export interface NodeData {
  // Legacy label for compatibility
  label: string;
  description?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  
  // Enhanced naming system
  businessName?: string;
  technicalId?: string;
  
  // System details for technical disclosure
  systemDetails?: {
    pipelineId?: string;
    outputTable?: string;
    inputTable?: string;
    dagId?: string;
    jobName?: string;
    schedule?: string;
    owner?: string;
  };
  
  // Business context
  businessContext?: {
    purpose?: string;
    stakeholders?: string[];
    businessValue?: string;
    usedBy?: string[];
  };
  
  metrics?: {
    throughput?: string;
    latency?: string;
    errors?: number;
    cost?: string;
  };
}

// Source Node Component
export function SourceNode({ data, viewMode = 'hybrid' }: { data: NodeData; viewMode?: 'business' | 'hybrid' | 'technical' }) {
  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return 'border-blue-500 bg-blue-50';
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-slate-300 bg-white';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running': return <Activity className="h-3 w-3 text-blue-500 animate-pulse" />;
      case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-slate-500" />;
    }
  };

  return (
    <Card className={`w-48 ${getStatusColor()} border-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Image src="/logos/postgresql.svg" alt="PostgreSQL" width={18} height={18} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <BalancedNameDisplay data={data} viewMode={viewMode} variant="compact" />
            </div>
            {getStatusIcon()}
          </div>
        
        {data.description && (
          <p className="text-xs text-slate-600 mb-2 line-clamp-2">{data.description}</p>
        )}
        
        <div className="flex gap-1">
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">Source</Badge>
          {data.metrics?.throughput && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {data.metrics.throughput}
            </Badge>
          )}
        </div>
        </div>
        
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-600" />
      </Card>
  );
}

// Transform Node Component
export function TransformNode({ data, viewMode = 'hybrid' }: { data: NodeData; viewMode?: 'business' | 'hybrid' | 'technical' }) {
  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return 'border-green-500 bg-green-50';
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-slate-300 bg-white';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running': return <RefreshCw className="h-3 w-3 text-green-500 animate-spin" />;
      case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-slate-500" />;
    }
  };

  return (
    <Card className={`w-48 ${getStatusColor()} border-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-600" />
        
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Image src="/logos/spark.svg" alt="Apache Spark" width={18} height={18} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <BalancedNameDisplay data={data} viewMode={viewMode} variant="compact" />
            </div>
            {getStatusIcon()}
          </div>
        
        {data.description && (
          <p className="text-xs text-slate-600 mb-2 line-clamp-2">{data.description}</p>
        )}
        
        <div className="flex gap-1">
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">Transform</Badge>
          {data.metrics?.latency && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {data.metrics.latency}
            </Badge>
          )}
        </div>
        </div>
        
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-600" />
      </Card>
  );
}

// Sink Node Component
export function SinkNode({ data, viewMode = 'hybrid' }: { data: NodeData; viewMode?: 'business' | 'hybrid' | 'technical' }) {
  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return 'border-purple-500 bg-purple-50';
      case 'success': return 'border-purple-500 bg-purple-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-slate-300 bg-white';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running': return <Activity className="h-3 w-3 text-purple-500 animate-pulse" />;
      case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-slate-500" />;
    }
  };

  return (
    <Card className={`w-48 ${getStatusColor()} border-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-600" />
        
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Image src="/logos/s3.svg" alt="Amazon S3" width={18} height={18} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <BalancedNameDisplay data={data} viewMode={viewMode} variant="compact" />
            </div>
            {getStatusIcon()}
          </div>
        
        {data.description && (
          <p className="text-xs text-slate-600 mb-2 line-clamp-2">{data.description}</p>
        )}
        
        <div className="flex gap-1">
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">Sink</Badge>
          {data.metrics?.errors !== undefined && (
            <Badge 
              variant={data.metrics.errors > 0 ? "destructive" : "secondary"} 
              className="text-xs px-1.5 py-0.5"
            >
              {data.metrics.errors} errors
            </Badge>
          )}
        </div>
        </div>
      </Card>
  );
}

// Export node types for ReactFlow
export const nodeTypes = {
  source: SourceNode,
  transform: TransformNode,
  sink: SinkNode,
};