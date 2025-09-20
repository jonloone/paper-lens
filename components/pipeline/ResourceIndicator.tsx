import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ResourceLevel = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface ResourceIntensity {
  level: ResourceLevel;
  label: string;
  dataVolume: string;
  computeIntensity: string;
  estimatedTime: string;
  scanRows?: number;
  memoryUsage?: string;
  cpuCores?: number;
  warning?: string;
}

const resourceLevels = {
  XS: { 
    label: "Minimal", 
    color: "bg-green-100 text-green-800 border-green-200", 
    icon: "○", 
    warning: false 
  },
  S: { 
    label: "Light", 
    color: "bg-green-100 text-green-800 border-green-200", 
    icon: "◐", 
    warning: false 
  },
  M: { 
    label: "Moderate", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    icon: "◑", 
    warning: true 
  },
  L: { 
    label: "Heavy", 
    color: "bg-orange-100 text-orange-800 border-orange-200", 
    icon: "◕", 
    warning: true 
  },
  XL: { 
    label: "Intensive", 
    color: "bg-red-100 text-red-800 border-red-200", 
    icon: "●", 
    warning: true, 
    requiresApproval: true 
  }
};

export function calculateResourceIntensity(node: any): ResourceIntensity {
  // Calculate based on node type and configuration
  const { type, data } = node;
  
  // Base calculation logic
  let level: ResourceLevel = 'S';
  let dataVolume = '< 1MB';
  let computeIntensity = 'Low';
  let estimatedTime = '< 1s';
  let scanRows = 0;
  let memoryUsage = '< 10MB';
  let cpuCores = 1;
  
  // Determine intensity based on node type
  switch (type) {
    case 'source':
      if (data.sourceType === 'database') {
        const rows = data.estimatedRows || 0;
        scanRows = rows;
        
        if (rows > 10000000) {
          level = 'XL';
          dataVolume = '> 1GB';
          computeIntensity = 'Very High';
          estimatedTime = '> 5min';
          memoryUsage = '> 1GB';
          cpuCores = 8;
        } else if (rows > 1000000) {
          level = 'L';
          dataVolume = '100MB - 1GB';
          computeIntensity = 'High';
          estimatedTime = '1-5min';
          memoryUsage = '500MB - 1GB';
          cpuCores = 4;
        } else if (rows > 100000) {
          level = 'M';
          dataVolume = '10MB - 100MB';
          computeIntensity = 'Moderate';
          estimatedTime = '10-60s';
          memoryUsage = '100MB - 500MB';
          cpuCores = 2;
        } else if (rows > 10000) {
          level = 'S';
          dataVolume = '1MB - 10MB';
          computeIntensity = 'Low';
          estimatedTime = '1-10s';
          memoryUsage = '10MB - 100MB';
          cpuCores = 1;
        } else {
          level = 'XS';
          dataVolume = '< 1MB';
          computeIntensity = 'Minimal';
          estimatedTime = '< 1s';
          memoryUsage = '< 10MB';
          cpuCores = 1;
        }
      } else if (data.sourceType === 'streaming') {
        level = 'M';
        dataVolume = 'Continuous';
        computeIntensity = 'Moderate';
        estimatedTime = 'Real-time';
        memoryUsage = 'Dynamic';
      }
      break;
      
    case 'transform':
      if (data.transformType === 'join') {
        level = 'L';
        dataVolume = 'Variable';
        computeIntensity = 'High';
        estimatedTime = '30s - 2min';
        memoryUsage = '> 500MB';
        cpuCores = 4;
      } else if (data.transformType === 'aggregate') {
        level = 'M';
        dataVolume = 'Reduced';
        computeIntensity = 'Moderate';
        estimatedTime = '10-30s';
        memoryUsage = '100MB - 500MB';
        cpuCores = 2;
      } else if (data.transformType === 'filter') {
        level = 'S';
        dataVolume = 'Filtered';
        computeIntensity = 'Low';
        estimatedTime = '< 10s';
        memoryUsage = '< 100MB';
        cpuCores = 1;
      }
      break;
      
    case 'ml':
      level = 'XL';
      dataVolume = 'Model-dependent';
      computeIntensity = 'GPU Required';
      estimatedTime = '> 10min';
      memoryUsage = '> 4GB';
      cpuCores = 8;
      break;
      
    case 'sink':
      if (data.sinkType === 'database') {
        level = 'M';
        dataVolume = 'Write throughput';
        computeIntensity = 'I/O Bound';
        estimatedTime = 'Depends on volume';
        memoryUsage = 'Buffered';
      } else if (data.sinkType === 'file') {
        level = 'S';
        dataVolume = 'File size';
        computeIntensity = 'Low';
        estimatedTime = '< 30s';
        memoryUsage = '< 100MB';
      }
      break;
      
    default:
      level = 'S';
  }
  
  // Add warnings for resource-intensive operations
  let warning: string | undefined;
  if (level === 'XL') {
    warning = 'This operation requires approval for production use';
  } else if (level === 'L') {
    warning = 'Consider scheduling during off-peak hours';
  } else if (level === 'M' && data.isProduction) {
    warning = 'Monitor resource usage in production';
  }
  
  return {
    level,
    label: resourceLevels[level].label,
    dataVolume,
    computeIntensity,
    estimatedTime,
    scanRows,
    memoryUsage,
    cpuCores,
    warning
  };
}

interface ResourceBadgeProps {
  level: ResourceLevel;
  className?: string;
  showIcon?: boolean;
}

export function ResourceBadge({ level, className, showIcon = true }: ResourceBadgeProps) {
  const config = resourceLevels[level];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.color, "text-xs font-medium", className)}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

interface ResourceIndicatorProps {
  node: any;
  className?: string;
  showDetails?: boolean;
}

export function ResourceIndicator({ node, className, showDetails = true }: ResourceIndicatorProps) {
  const intensity = calculateResourceIntensity(node);
  const config = resourceLevels[intensity.level];
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ResourceBadge level={intensity.level} />
      
      {showDetails && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="hover:opacity-80 transition-opacity">
                <Info className="h-3 w-3 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="w-64">
              <div className="space-y-2 text-xs">
                <div className="font-semibold mb-1">Resource Estimation</div>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-mono">{intensity.dataVolume}</span>
                  
                  <span className="text-muted-foreground">Compute:</span>
                  <span className="font-mono">{intensity.computeIntensity}</span>
                  
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-mono">{intensity.estimatedTime}</span>
                  
                  {intensity.scanRows > 0 && (
                    <>
                      <span className="text-muted-foreground">Rows:</span>
                      <span className="font-mono">{intensity.scanRows.toLocaleString()}</span>
                    </>
                  )}
                  
                  <span className="text-muted-foreground">Memory:</span>
                  <span className="font-mono">{intensity.memoryUsage}</span>
                  
                  <span className="text-muted-foreground">CPU:</span>
                  <span className="font-mono">{intensity.cpuCores} core{intensity.cpuCores > 1 ? 's' : ''}</span>
                </div>
                
                {intensity.warning && (
                  <div className="flex items-start gap-1 pt-2 border-t">
                    <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5" />
                    <span className="text-yellow-600">{intensity.warning}</span>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// Calculate total resource intensity for a pipeline
export function calculateTotalResource(nodes: any[]): ResourceLevel {
  const intensities = nodes.map(node => calculateResourceIntensity(node));
  const levels: ResourceLevel[] = intensities.map(i => i.level);
  
  // Find the highest intensity
  const levelOrder: ResourceLevel[] = ['XS', 'S', 'M', 'L', 'XL'];
  const maxLevelIndex = Math.max(...levels.map(l => levelOrder.indexOf(l)));
  
  // If multiple heavy operations, bump up one level
  const heavyCount = levels.filter(l => ['L', 'XL'].includes(l)).length;
  if (heavyCount > 2 && maxLevelIndex < levelOrder.length - 1) {
    return levelOrder[maxLevelIndex + 1];
  }
  
  return levelOrder[maxLevelIndex];
}