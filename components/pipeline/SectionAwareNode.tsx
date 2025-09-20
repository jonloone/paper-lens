import React from 'react';
import { Handle, Position } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Database, 
  Zap, 
  GitBranch, 
  Shield, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  PlayCircle,
  PauseCircle,
  Settings,
  FileCode,
  Cpu,
  HardDrive,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { ResourceBadge, calculateResourceIntensity } from './ResourceIndicator';
import { MiniSparkline } from '@/components/ui/sparkline';

export type StudioSection = 'pipelines' | 'operations' | 'monitor' | 'configure';

interface SectionAwareNodeProps {
  data: any;
  section: StudioSection;
  selected?: boolean;
}

// Status indicator component
function StatusIndicator({ status, pulse = false }: { status: string; pulse?: boolean }) {
  const statusConfig = {
    running: { color: 'bg-green-500', icon: PlayCircle },
    paused: { color: 'bg-yellow-500', icon: PauseCircle },
    stopped: { color: 'bg-gray-500', icon: CheckCircle },
    error: { color: 'bg-red-500', icon: AlertCircle },
    pending: { color: 'bg-blue-500', icon: Clock }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <div className="relative">
      <Icon className={cn("h-4 w-4", status === 'error' ? 'text-red-600' : 'text-muted-foreground')} />
      {pulse && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.color)}></span>
          <span className={cn("relative inline-flex rounded-full h-2 w-2", config.color)}></span>
        </span>
      )}
    </div>
  );
}

// Metric badge component
function MetricBadge({ value, threshold, unit = '%' }: { value: number; threshold: number; unit?: string }) {
  const status = value >= threshold ? 'success' : value >= threshold * 0.8 ? 'warning' : 'error';
  const colors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };
  
  return (
    <Badge variant="outline" className={cn("text-xs", colors[status])}>
      {value}{unit}
    </Badge>
  );
}

// Config icon component
function ConfigIcon({ type, className }: { type: string; className?: string }) {
  const icons = {
    database: Database,
    transform: Zap,
    branch: GitBranch,
    security: Shield,
    compute: Cpu,
    storage: HardDrive,
    layer: Layers,
    code: FileCode
  };
  
  const Icon = icons[type as keyof typeof icons] || Settings;
  return <Icon className={className} />;
}

// Pipeline building mode node
function PipelineNode({ data, selected }: { data: any; selected?: boolean }) {
  const resourceIntensity = calculateResourceIntensity({ type: data.type, data });
  
  return (
    <div className={cn(
      "px-4 py-3 border-2 rounded-lg bg-background transition-all",
      selected ? "border-primary shadow-lg" : "border-border hover:border-primary/50",
      data.isNew && "border-dashed"
    )}>
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">{data.label}</div>
          {data.type && (
            <Badge variant="outline" className="text-xs ml-2">
              {data.type}
            </Badge>
          )}
        </div>
        
        {data.description && (
          <div className="text-xs text-muted-foreground">
            {data.description}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {data.recordCount ? `${(data.recordCount / 1000).toFixed(0)}k records` : 'Not configured'}
          </div>
          <ResourceBadge level={resourceIntensity.level} />
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
}

// Operations debugging mode node
function OperationsNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div className={cn(
      "px-3 py-2 border-2 rounded-lg transition-all min-w-[180px]",
      selected ? "border-primary shadow-lg" : "border-border",
      data.hasError && "border-destructive bg-destructive/5",
      data.status === 'running' && "border-green-500/50 bg-green-50/50"
    )}>
      <Handle type="target" position={Position.Left} />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm truncate flex-1">{data.label}</span>
          <StatusIndicator status={data.status || 'pending'} pulse={data.status === 'running'} />
        </div>
        
        {data.error && (
          <div className="flex items-start gap-1.5 p-1.5 bg-destructive/10 rounded text-xs">
            <AlertCircle className="h-3 w-3 text-destructive mt-0.5" />
            <span className="text-destructive">{data.error.message}</span>
          </div>
        )}
        
        {data.metrics && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Success:</span>
            <MetricBadge value={data.metrics.successRate} threshold={95} />
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last: {data.lastRun || 'Never'}</span>
          {data.nextRun && (
            <>
              <span>•</span>
              <span>Next: {data.nextRun}</span>
            </>
          )}
        </div>
        
        {data.isStuck && (
          <Badge variant="destructive" className="text-xs w-full justify-center">
            Stuck - Needs attention
          </Badge>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

// Monitoring observability mode node
function MonitorNode({ data, selected }: { data: any; selected?: boolean }) {
  const mockSparkline = [40, 45, 38, 52, 48, 61, 55, 58, 62, 59, 65, 68];
  
  return (
    <div className={cn(
      "px-3 py-2 border-2 rounded-lg bg-background transition-all min-w-[160px]",
      selected ? "border-primary shadow-lg" : "border-border hover:border-primary/50"
    )}>
      <Handle type="target" position={Position.Left} />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{data.label}</span>
          <MetricBadge 
            value={data.health || 100} 
            threshold={90} 
            unit=""
          />
        </div>
        
        {data.metrics && (
          <div className="h-6">
            <MiniSparkline data={data.sparkline || mockSparkline} height={24} />
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Rate:</span>
            <span className="ml-1 font-mono">{data.throughput || '0'}/s</span>
          </div>
          <div>
            <span className="text-muted-foreground">P99:</span>
            <span className="ml-1 font-mono">{data.latency || '0'}ms</span>
          </div>
        </div>
        
        {data.alerts && data.alerts > 0 && (
          <div className="flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            <span>{data.alerts} active alert{data.alerts > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

// Configuration mode node
function ConfigureNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div className={cn(
      "px-4 py-3 border-2 rounded-lg bg-background transition-all",
      selected ? "border-primary shadow-lg" : "border-border",
      !data.isValid && "border-dashed border-warning bg-warning/5"
    )}>
      <Handle type="target" position={Position.Left} />
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ConfigIcon type={data.configType || 'settings'} className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{data.label}</span>
          {data.isRequired && (
            <Badge variant="destructive" className="text-xs ml-auto">
              Required
            </Badge>
          )}
        </div>
        
        {data.configItems && data.configItems.length > 0 && (
          <div className="space-y-1 p-2 bg-muted/30 rounded">
            {data.configItems.slice(0, 3).map((item: any) => (
              <div key={item.key} className="text-xs flex justify-between">
                <span className="text-muted-foreground">{item.key}:</span>
                <span className="font-mono ml-2 truncate" title={item.value}>
                  {item.value || '<not set>'}
                </span>
              </div>
            ))}
            {data.configItems.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{data.configItems.length - 3} more
              </div>
            )}
          </div>
        )}
        
        {!data.isValid && (
          <div className="flex items-center gap-1 text-xs text-warning">
            <AlertCircle className="h-3 w-3" />
            <span>Needs configuration</span>
          </div>
        )}
        
        {data.isValid && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>Configured</span>
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function SectionAwareNode({ data, section, selected }: SectionAwareNodeProps) {
  switch(section) {
    case 'pipelines':
      return <PipelineNode data={data} selected={selected} />;
    
    case 'operations':
      return <OperationsNode data={data} selected={selected} />;
    
    case 'monitor':
      return <MonitorNode data={data} selected={selected} />;
    
    case 'configure':
      return <ConfigureNode data={data} selected={selected} />;
    
    default:
      return <PipelineNode data={data} selected={selected} />;
  }
}

// Export individual node types for React Flow
export const sectionNodeTypes = {
  pipelines: (props: any) => <SectionAwareNode {...props} section="pipelines" />,
  operations: (props: any) => <SectionAwareNode {...props} section="operations" />,
  monitor: (props: any) => <SectionAwareNode {...props} section="monitor" />,
  configure: (props: any) => <SectionAwareNode {...props} section="configure" />,
  
  // Generic node that adapts based on data
  adaptive: (props: any) => <SectionAwareNode {...props} section={props.data.section || 'pipelines'} />
};