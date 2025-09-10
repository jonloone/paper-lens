import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Settings, 
  Play, 
  Stop, 
  AlertCircle, 
  Activity, 
  Loader2, 
  CheckCircle, 
  QuestionMarkCircle,
  ExternalLink,
  Sync,
  Clock,
  Zap,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RealNode, IntegrationLevel, SyncStatus } from '@/lib/types/RealNode';

interface RealNodeComponentProps extends NodeProps {
  data: RealNode['reality'] & RealNode['config'] & RealNode['execution'] & RealNode['metrics'] & {
    label: string;
    status?: 'idle' | 'running' | 'success' | 'error';
    onConfigure?: () => void;
    onExecute?: () => void;
    onSync?: () => void;
    onOpenTool?: () => void;
  };
}

export const RealNodeComponent = memo<RealNodeComponentProps>(({ 
  id, 
  data, 
  selected 
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConfigure = useCallback(() => {
    data.onConfigure?.();
  }, [data]);

  const handleExecute = useCallback(async () => {
    if (!data.actual || Object.keys(data.actual).length === 0) {
      alert('Please configure the node first');
      return;
    }

    setIsExecuting(true);
    try {
      await data.onExecute?.();
    } finally {
      setIsExecuting(false);
    }
  }, [data]);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await data.onSync?.();
    } finally {
      setIsSyncing(false);
    }
  }, [data]);

  const handleOpenTool = useCallback(() => {
    data.onOpenTool?.();
  }, [data]);

  /**
   * Get integration badge based on level
   */
  const getIntegrationBadge = () => {
    const level = data.integration?.level;
    
    switch (level) {
      case 'mcp-full':
        return (
          <Badge className=\"bg-green-100 text-green-800 border-green-300\">
            <Zap className=\"w-3 h-3 mr-1\" />
            MCP
          </Badge>
        );
      case 'tool-direct':
        return (
          <Badge className=\"bg-blue-100 text-blue-800 border-blue-300\">
            <ExternalLink className=\"w-3 h-3 mr-1\" />
            Direct
          </Badge>
        );
      case 'config-only':
        return (
          <Badge className=\"bg-yellow-100 text-yellow-800 border-yellow-300\">
            <FileText className=\"w-3 h-3 mr-1\" />
            Config
          </Badge>
        );
      case 'documentation':
        return (
          <Badge className=\"bg-gray-100 text-gray-800 border-gray-300\">
            <FileText className=\"w-3 h-3 mr-1\" />
            Manual
          </Badge>
        );
      default:
        return null;
    }
  };

  /**
   * Get sync status indicator
   */
  const getSyncStatus = () => {
    const status = data.lastSync?.status;
    const timestamp = data.lastSync?.timestamp;
    
    switch (status) {
      case 'synced':
        return (
          <div className=\"flex items-center gap-1 text-green-600\" title={`Last synced: ${timestamp}`}>
            <CheckCircle className=\"w-3 h-3\" />
            <span className=\"text-xs\">Synced</span>
          </div>
        );
      case 'modified':
        return (
          <div className=\"flex items-center gap-1 text-yellow-600\" title=\"Local changes not synced\">
            <AlertCircle className=\"w-3 h-3\" />
            <span className=\"text-xs\">Modified</span>
          </div>
        );
      case 'error':
        return (
          <div className=\"flex items-center gap-1 text-red-600\" title={data.lastSync?.error}>
            <AlertCircle className=\"w-3 h-3\" />
            <span className=\"text-xs\">Error</span>
          </div>
        );
      default:
        return (
          <div className=\"flex items-center gap-1 text-gray-500\" title=\"Sync status unknown\">
            <QuestionMarkCircle className=\"w-3 h-3\" />
            <span className=\"text-xs\">Unknown</span>
          </div>
        );
    }
  };

  /**
   * Get category-based styling
   */
  const getCategoryStyle = () => {
    const source = data.source;
    
    const styles: Record<string, string> = {
      airflow: 'bg-blue-50 border-blue-400 hover:border-blue-500',
      nifi: 'bg-purple-50 border-purple-400 hover:border-purple-500',
      spark: 'bg-orange-50 border-orange-400 hover:border-orange-500',
      kafka: 'bg-green-50 border-green-400 hover:border-green-500',
      dbt: 'bg-teal-50 border-teal-400 hover:border-teal-500',
      snowflake: 'bg-cyan-50 border-cyan-400 hover:border-cyan-500',
      postgres: 'bg-indigo-50 border-indigo-400 hover:border-indigo-500',
      kubernetes: 'bg-violet-50 border-violet-400 hover:border-violet-500',
      jenkins: 'bg-slate-50 border-slate-400 hover:border-slate-500',
      manual: 'bg-gray-50 border-gray-400 hover:border-gray-500'
    };

    return styles[source] || styles.manual;
  };

  /**
   * Get status indicator
   */
  const getStatusIndicator = () => {
    const status = data.status;
    
    switch (status) {
      case 'running':
        return <Activity className=\"w-4 h-4 text-blue-500 animate-pulse\" />;
      case 'success':
        return <CheckCircle className=\"w-4 h-4 text-green-500\" />;
      case 'error':
        return <AlertCircle className=\"w-4 h-4 text-red-500\" />;
      default:
        return <div className=\"w-2 h-2 bg-gray-400 rounded-full\" />;
    }
  };

  /**
   * Get health status
   */
  const getHealthStatus = () => {
    const health = data.health;
    
    if (!health) return null;
    
    const healthColors = {
      healthy: 'text-green-600',
      warning: 'text-yellow-600',
      critical: 'text-red-600',
      unknown: 'text-gray-500'
    };
    
    return (
      <div className={cn('text-xs', healthColors[health.status])}>
        {health.status}
      </div>
    );
  };

  return (
    <>
      <Card className={cn(
        'min-w-[280px] transition-all duration-200 cursor-pointer',
        getCategoryStyle(),
        selected && 'ring-2 ring-blue-400 shadow-xl',
        data.status === 'error' && 'border-red-500 bg-red-50'
      )}>
        <CardContent className=\"p-4\">
          {/* Header */}
          <div className=\"flex items-center justify-between mb-3\">
            <div className=\"flex items-center gap-2\">
              <div className=\"text-lg font-semibold capitalize text-gray-700\">
                {data.source}
              </div>
              {getIntegrationBadge()}
            </div>
            {getStatusIndicator()}
          </div>

          {/* Node Label */}
          <h3 className=\"font-medium text-base mb-2 text-gray-900\">{data.label}</h3>

          {/* Environment and System Info */}
          <div className=\"flex items-center gap-3 mb-3 text-xs text-gray-600\">
            <Badge variant=\"outline\" className=\"text-xs\">
              {data.location?.environment}
            </Badge>
            <span>{data.location?.system}</span>
          </div>

          {/* Sync Status */}
          <div className=\"mb-3\">
            {getSyncStatus()}
          </div>

          {/* Configuration Status */}
          <div className=\"mb-3 text-xs\">
            {data.actual && Object.keys(data.actual).length > 0 ? (
              <div className=\"flex items-center gap-1 text-green-600\">
                <CheckCircle className=\"w-3 h-3\" />
                <span>Configured</span>
              </div>
            ) : (
              <div className=\"flex items-center gap-1 text-orange-600\">
                <AlertCircle className=\"w-3 h-3\" />
                <span>Not configured</span>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          {data.performance && (
            <div className=\"mb-3 p-2 bg-white bg-opacity-60 rounded text-xs\">
              <div className=\"grid grid-cols-2 gap-2\">
                {data.performance.successRate !== undefined && (
                  <div>
                    <span className=\"text-gray-500\">Success Rate:</span>
                    <div className=\"font-medium\">{(data.performance.successRate * 100).toFixed(1)}%</div>
                  </div>
                )}
                {data.performance.avgDuration !== undefined && (
                  <div>
                    <span className=\"text-gray-500\">Avg Duration:</span>
                    <div className=\"font-medium\">{data.performance.avgDuration}ms</div>
                  </div>
                )}
                {data.performance.throughput !== undefined && (
                  <div>
                    <span className=\"text-gray-500\">Throughput:</span>
                    <div className=\"font-medium\">{data.performance.throughput}/sec</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Status */}
          {data.health && (
            <div className=\"mb-3\">
              {getHealthStatus()}
              {data.health.issues && data.health.issues.length > 0 && (
                <div className=\"text-xs text-red-600 mt-1\">
                  {data.health.issues[0]}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {data.status === 'error' && data.lastSync?.error && (
            <div className=\"mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700\">
              {data.lastSync.error}
            </div>
          )}

          {/* Action Buttons */}
          <div className=\"flex gap-2\">
            {data.integration?.level === 'mcp-full' && (
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={handleConfigure}
                className=\"flex-1\"
              >
                <Settings className=\"w-3 h-3 mr-1\" />
                Config
              </Button>
            )}

            {data.integration?.level === 'tool-direct' && data.location?.url && (
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={handleOpenTool}
                className=\"flex-1\"
              >
                <ExternalLink className=\"w-3 h-3 mr-1\" />
                Open
              </Button>
            )}

            {data.integration?.level === 'config-only' && (
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={handleConfigure}
                className=\"flex-1\"
              >
                <FileText className=\"w-3 h-3 mr-1\" />
                Edit
              </Button>
            )}

            {(data.integration?.level === 'tool-direct' || data.integration?.level === 'config-only') && (
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={handleSync}
                disabled={isSyncing}
                className=\"px-2\"
              >
                {isSyncing ? (
                  <Loader2 className=\"w-3 h-3 animate-spin\" />
                ) : (
                  <Sync className=\"w-3 h-3\" />
                )}
              </Button>
            )}

            {data.status === 'running' ? (
              <Button
                variant=\"outline\"
                size=\"sm\"
                className=\"bg-red-500 text-white border-red-500 hover:bg-red-600 px-2\"
              >
                <Stop className=\"w-3 h-3\" />
              </Button>
            ) : (
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={handleExecute}
                disabled={isExecuting || !data.actual || Object.keys(data.actual).length === 0}
                className=\"bg-green-500 text-white border-green-500 hover:bg-green-600 px-2\"
              >
                {isExecuting ? (
                  <Loader2 className=\"w-3 h-3 animate-spin\" />
                ) : (
                  <Play className=\"w-3 h-3\" />
                )}
              </Button>
            )}
          </div>

          {/* Status Badges */}
          {data.status === 'running' && (
            <div className=\"absolute -top-2 -right-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full animate-pulse\">
              Running
            </div>
          )}
          {data.status === 'error' && (
            <div className=\"absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full\">
              Error
            </div>
          )}
          {data.lastSync?.status === 'modified' && (
            <div className=\"absolute -top-2 -left-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full\">
              Modified
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input Handles */}
      <Handle
        type=\"target\"
        position={Position.Left}
        id=\"input\"
        style={{
          left: -6,
          background: '#6b7280',
          width: 12,
          height: 12,
          border: '2px solid white'
        }}
        title=\"Input connection\"
      />

      {/* Output Handles */}
      <Handle
        type=\"source\"
        position={Position.Right}
        id=\"output\"
        style={{
          right: -6,
          background: '#6b7280',
          width: 12,
          height: 12,
          border: '2px solid white'
        }}
        title=\"Output connection\"
      />
    </>
  );
});

RealNodeComponent.displayName = 'RealNodeComponent';

/**
 * Factory function to create a Real Node component with specific configuration
 */
export function createRealNodeComponent(nodeData: Partial<RealNode>) {
  return memo((props: NodeProps) => (
    <RealNodeComponent 
      {...props} 
      data={{
        ...nodeData.reality,
        ...nodeData.config,
        ...nodeData.execution,
        ...nodeData.metrics,
        label: nodeData.label || 'Unnamed Node',
        status: nodeData.ui?.selected ? 'running' : 'idle'
      }}
    />
  ));
}