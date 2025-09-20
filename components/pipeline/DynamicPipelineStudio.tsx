'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  MiniMap,
  Panel,
  ReactFlowProvider
} from 'reactflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Activity,
  Zap,
  Database,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import our components
import { nodeTypes } from '@/components/pipeline/nodes/TechnologyNode';
import { DataFlowEdge } from '@/components/pipeline/edges/DataFlowEdge';
import PipelineLoadingService from '@/lib/services/pipelineLoadingService';
import { LoadingState, MCPPipelineStatus } from '@/lib/types/pipeline';

// Import CSS for React Flow
import 'reactflow/dist/style.css';

interface DynamicPipelineStudioProps {
  pipelineId: string;
  onNodeSelect?: (nodeId: string | null) => void;
}

// Loading skeleton component
const PipelineLoadingSkeleton = () => (
  <div className="h-full flex items-center justify-center bg-gray-50">
    <Card className="w-96">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <CardTitle className="text-lg">Loading Pipeline</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fetching definition...</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex justify-between text-sm">
            <span>Rendering nodes...</span>
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Connecting to MCP...</span>
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <Progress value={65} className="w-full" />
      </CardContent>
    </Card>
  </div>
);

// Error state component
const PipelineErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="h-full flex items-center justify-center bg-gray-50">
    <Card className="w-96">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Failed to Load Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={onRetry} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  </div>
);

// Edge types registry
const edgeTypes = {
  'smoothstep': DataFlowEdge,
  'default': DataFlowEdge,
};

export const DynamicPipelineStudio: React.FC<DynamicPipelineStudioProps> = ({
  pipelineId,
  onNodeSelect
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string>('');
  const [pipelineName, setPipelineName] = useState<string>('');
  const [pipelineStatus, setPipelineStatus] = useState<string>('');
  const [mcpConnected, setMcpConnected] = useState<boolean>(false);

  const pipelineService = PipelineLoadingService.getInstance();

  // Load pipeline data
  const loadPipeline = useCallback(async () => {
    setLoadingState('loading');
    setError('');
    
    try {
      // Show loading state
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      
      // Fetch pipeline definition
      const pipeline = await pipelineService.fetchPipelineDefinition(pipelineId);
      setPipelineName(pipeline.name);
      setPipelineStatus(pipeline.status);
      
      setLoadingState('rendering');
      
      // Transform to React Flow format
      const { nodes: flowNodes, edges: flowEdges } = pipelineService.transformToReactFlow(pipeline);
      
      // Set nodes and edges
      setNodes(flowNodes);
      setEdges(flowEdges);
      
      // Start MCP monitoring
      setLoadingState('connecting');
      pipelineService.startMCPMonitoring(pipelineId, handleMCPUpdate);
      setMcpConnected(true);
      
      setLoadingState('ready');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoadingState('error');
    }
  }, [pipelineId, setNodes, setEdges]);

  // Handle MCP status updates
  const handleMCPUpdate = useCallback((status: MCPPipelineStatus) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === status.nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                status: status.status,
                metrics: status.metrics || node.data.metrics
              }
            }
          : node
      )
    );
  }, [setNodes]);

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node clicks
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeSelect?.(node.id);
  }, [onNodeSelect]);

  // Load pipeline on mount or pipelineId change
  useEffect(() => {
    if (pipelineId) {
      loadPipeline();
    }
    
    // Cleanup MCP monitoring on unmount
    return () => {
      pipelineService.stopMCPMonitoring(pipelineId);
    };
  }, [pipelineId, loadPipeline]);

  // Render based on loading state
  if (loadingState === 'loading' || loadingState === 'rendering' || loadingState === 'connecting') {
    return <PipelineLoadingSkeleton />;
  }

  if (loadingState === 'error') {
    return <PipelineErrorState error={error} onRetry={loadPipeline} />;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{
            padding: 0.1,
            maxZoom: 1.2
          }}
        >
          <Background />
          <Controls />
          <MiniMap 
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              const tech = node.data?.technology?.type || 'default';
              const colors: Record<string, string> = {
                postgres: '#336791',
                spark: '#E25A1C',
                kafka: '#231F20',
                trino: '#DD00A1',
                snowflake: '#29B5E8',
                python: '#3776AB',
                s3: '#FF9900'
              };
              return colors[tech] || '#6B7280';
            }}
          />
          
          {/* Pipeline Info Panel */}
          <Panel position="top-right">
            <Card className="w-64">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{pipelineName}</CardTitle>
                  <Badge 
                    variant={pipelineStatus === 'active' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {pipelineStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Nodes:</span>
                  <span className="font-medium">{nodes.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Connections:</span>
                  <span className="font-medium">{edges.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>MCP Status:</span>
                  <div className="flex items-center gap-1">
                    {mcpConnected ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-green-600">Connected</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-red-600">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Node Status Summary */}
                <div className="pt-2 border-t">
                  <div className="text-xs font-medium mb-1">Node Status</div>
                  {['running', 'success', 'failed', 'pending'].map(status => {
                    const count = nodes.filter(n => n.data?.status === status).length;
                    if (count === 0) return null;
                    
                    return (
                      <div key={status} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          {status === 'running' && <Activity className="h-3 w-3 text-green-500" />}
                          {status === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {status === 'failed' && <AlertCircle className="h-3 w-3 text-red-500" />}
                          {status === 'pending' && <Clock className="h-3 w-3 text-yellow-500" />}
                          <span className="capitalize">{status}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Panel>

          {/* Refresh Panel */}
          <Panel position="bottom-right">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadPipeline}
                disabled={loadingState !== 'ready'}
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-1",
                  loadingState !== 'ready' && "animate-spin"
                )} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default DynamicPipelineStudio;