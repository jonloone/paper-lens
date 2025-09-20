'use client';

import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { 
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react';

interface NodeData {
  label: string;
  description?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  metrics?: {
    throughput?: string;
    latency?: string;
    errors?: number;
  };
}

interface NodeHoverCardProps {
  children: ReactNode;
  data: NodeData;
  nodeType: 'source' | 'transform' | 'sink';
}

const getStatusInfo = (status?: string) => {
  switch (status) {
    case 'running':
      return {
        icon: <Activity className="h-3 w-3 animate-pulse" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        text: 'Currently running'
      };
    case 'success':
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50', 
        borderColor: 'border-green-200',
        text: 'Healthy'
      };
    case 'error':
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        text: 'Needs attention'
      };
    default:
      return {
        icon: <Clock className="h-3 w-3" />,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        text: 'Idle'
      };
  }
};

const getTypeInfo = (nodeType: string) => {
  switch (nodeType) {
    case 'source':
      return { color: 'text-blue-600', bgColor: 'bg-blue-50' };
    case 'transform':
      return { color: 'text-green-600', bgColor: 'bg-green-50' };
    case 'sink':
      return { color: 'text-purple-600', bgColor: 'bg-purple-50' };
    default:
      return { color: 'text-slate-600', bgColor: 'bg-slate-50' };
  }
};

// Mock function to simulate last run / next run times
const getScheduleInfo = (nodeType: string) => {
  const schedules = {
    source: { last: '2 hours ago', next: 'in 4 hours' },
    transform: { last: '2 hours ago', next: 'in 4 hours' },
    sink: { last: '2 hours ago', next: 'in 4 hours' }
  };
  return schedules[nodeType as keyof typeof schedules] || schedules.source;
};

export function NodeHoverCard({ children, data, nodeType }: NodeHoverCardProps) {
  const statusInfo = getStatusInfo(data.status);
  const typeInfo = getTypeInfo(nodeType);
  const scheduleInfo = getScheduleInfo(nodeType);
  const hasIssues = data.status === 'error' || (data.metrics?.errors && data.metrics.errors > 0);

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 p-4" 
        side="top"
        align="center"
        sideOffset={10}
      >
        <div className="space-y-3">
          {/* Header with title and status */}
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-normal text-base leading-none truncate">
                  {data.label}
                </h4>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
                  {statusInfo.icon}
                  <span className={statusInfo.color}>{statusInfo.text}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Last run: {scheduleInfo.last} • Next: {scheduleInfo.next}
              </p>
            </div>
          </div>

          {/* Description if available */}
          {data.description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {data.description}
            </p>
          )}

          {/* Metrics badges */}
          <div className="flex flex-wrap gap-2">
            {/* Node type badge */}
            <Badge variant="outline" className="text-xs">
              {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
            </Badge>

            {/* Performance metrics */}
            {data.metrics?.throughput && (
              <Badge variant="secondary" className="text-xs gap-1">
                <TrendingUp className="h-3 w-3" />
                {data.metrics.throughput}
              </Badge>
            )}

            {data.metrics?.latency && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Zap className="h-3 w-3" />
                {data.metrics.latency}
              </Badge>
            )}

            {/* Success rate badge */}
            <Badge variant="secondary" className="text-xs">
              99.9% success
            </Badge>

            {/* Status badge */}
            <Badge 
              variant={hasIssues ? "destructive" : "secondary"} 
              className="text-xs"
            >
              {hasIssues ? "Needs attention" : "Healthy"}
            </Badge>
          </div>

          {/* Quick action hint */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Click for details • Double-click to configure
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}