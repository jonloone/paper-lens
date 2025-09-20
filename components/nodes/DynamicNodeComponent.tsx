import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Settings, Play, Square, AlertCircle, Activity, Loader2 } from 'lucide-react';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { NodeTypeDefinition } from '@/lib/services/NodeTypeRegistry';
import { ConfigurationModal } from './ConfigurationModal';
import { cn } from '@/lib/utils';

interface DynamicNodeData {
  label: string;
  status: 'idle' | 'running' | 'success' | 'error';
  config?: any;
  metrics?: Record<string, any>;
  error?: string;
}

export function createDynamicNodeComponent(definition: NodeTypeDefinition) {
  const DynamicNode = memo(({ id, data, selected }: NodeProps<DynamicNodeData>) => {
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const { sendMCPRequest } = useMCPConnection(definition.mcpServer);
    
    const handleConfigure = useCallback(() => {
      setIsConfigOpen(true);
    }, []);
    
    const handleExecute = useCallback(async () => {
      if (!data.config) {
        alert('Please configure the node first');
        return;
      }
      
      setIsExecuting(true);
      try {
        await sendMCPRequest(definition.mcpTools.execute, {
          nodeId: id,
          config: data.config
        });
        // In production, this would update the node status through a state management system
      } catch (error) {
        console.error('Execution failed:', error);
      } finally {
        setIsExecuting(false);
      }
    }, [id, data.config, sendMCPRequest, definition.mcpTools.execute]);
    
    const handleStop = useCallback(async () => {
      if (definition.mcpTools.stop) {
        await sendMCPRequest(definition.mcpTools.stop, { nodeId: id });
      }
    }, [id, sendMCPRequest, definition.mcpTools.stop]);
    
    const getCategoryColor = () => {
      const colors: Record<string, string> = {
        nifi: 'bg-blue-50 border-blue-400 hover:border-blue-500',
        spark: 'bg-orange-50 border-orange-400 hover:border-orange-500',
        dbt: 'bg-teal-50 border-teal-400 hover:border-teal-500',
        kafka: 'bg-purple-50 border-purple-400 hover:border-purple-500',
        flink: 'bg-indigo-50 border-indigo-400 hover:border-indigo-500',
        airflow: 'bg-pink-50 border-pink-400 hover:border-pink-500',
        snowflake: 'bg-cyan-50 border-cyan-400 hover:border-cyan-500',
        postgres: 'bg-green-50 border-green-400 hover:border-green-500',
        s3: 'bg-yellow-50 border-yellow-400 hover:border-yellow-500',
        trino: 'bg-rose-50 border-rose-400 hover:border-rose-500'
      };
      return colors[definition.category] || 'bg-gray-50 border-gray-400 hover:border-gray-500';
    };
    
    const getStatusIndicator = () => {
      switch (data.status) {
        case 'running':
          return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
        case 'success':
          return <div className="w-2 h-2 bg-green-500 rounded-full" />;
        case 'error':
          return <AlertCircle className="w-4 h-4 text-red-500" />;
        default:
          return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
      }
    };
    
    return (
      <>
        <div className={cn(
          "relative px-4 py-3 rounded-lg border-2 min-w-[260px] transition-all duration-200",
          getCategoryColor(),
          selected && "shadow-xl ring-2 ring-blue-400",
          data.status === 'error' && "border-red-500 bg-red-50"
        )}>
          {/* Input Handles */}
          {definition.inputs?.map((input, idx) => (
            <Handle
              key={`input-${input.name}`}
              type="target"
              position={Position.Left}
              id={input.name}
              style={{ 
                top: `${50 + idx * 25}%`,
                left: -6,
                background: '#6b7280',
                width: 12,
                height: 12,
                border: '2px solid white'
              }}
              title={`${input.name} (${input.type})`}
            />
          ))}
          
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg" title={definition.category}>
                {definition.icon}
              </span>
              <span className="font-medium text-sm truncate max-w-[180px]" title={data.label}>
                {data.label || definition.label}
              </span>
            </div>
            {getStatusIndicator()}
          </div>
          
          {/* Category Badge */}
          <div className="text-xs text-gray-600 mb-2 font-mono">
            {definition.category.toUpperCase()} • {definition.type}
          </div>
          
          {/* Metrics Display */}
          {data.metrics && Object.keys(data.metrics).length > 0 && (
            <div className="text-xs space-y-1 bg-white bg-opacity-60 rounded p-2 mb-2">
              {Object.entries(data.metrics).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-mono font-medium">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </span>
                </div>
              ))}
              {Object.keys(data.metrics).length > 3 && (
                <div className="text-gray-500 text-center">...</div>
              )}
            </div>
          )}
          
          {/* Configuration Status */}
          <div className="text-xs mb-3">
            {data.config ? (
              <span className="text-green-600 font-medium">✓ Configured</span>
            ) : (
              <span className="text-orange-600 font-medium">⚠ Not configured</span>
            )}
          </div>
          
          {/* Error Message */}
          {data.error && (
            <div className="text-xs text-red-600 bg-red-50 rounded p-1 mb-2">
              {data.error}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleConfigure}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-white rounded hover:bg-gray-100 transition-colors"
              title="Configure node"
            >
              <Settings className="w-3 h-3" />
              Config
            </button>
            
            {data.status === 'running' ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                title="Stop execution"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleExecute}
                disabled={isExecuting || !data.config}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={!data.config ? "Configure node first" : "Run node"}
              >
                {isExecuting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                {isExecuting ? 'Starting...' : 'Run'}
              </button>
            )}
          </div>
          
          {/* Output Handles */}
          {definition.outputs?.map((output, idx) => (
            <Handle
              key={`output-${output.name}`}
              type="source"
              position={Position.Right}
              id={output.name}
              style={{ 
                top: `${50 + idx * 25}%`,
                right: -6,
                background: '#6b7280',
                width: 12,
                height: 12,
                border: '2px solid white'
              }}
              title={`${output.name} (${output.type})`}
            />
          ))}
          
          {/* Status Badge */}
          {data.status === 'running' && (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full animate-pulse">
              Running
            </div>
          )}
          {data.status === 'error' && (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              Error
            </div>
          )}
        </div>
        
        {/* Configuration Modal */}
        {isConfigOpen && (
          <ConfigurationModal
            nodeId={id}
            definition={definition}
            currentConfig={data.config}
            onSave={(newConfig) => {
              // In production, this would update the node data through state management
              console.log('Saving config:', newConfig);
              setIsConfigOpen(false);
            }}
            onClose={() => setIsConfigOpen(false)}
          />
        )}
      </>
    );
  });
  
  DynamicNode.displayName = `DynamicNode_${definition.type}`;
  return DynamicNode;
}