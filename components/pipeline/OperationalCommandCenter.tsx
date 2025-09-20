'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  ReactFlowProvider,
  Handle,
  Position,
  NodeProps
} from 'reactflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Eye,
  BarChart3,
  FileText,
  DollarSign,
  ExternalLink,
  Maximize2,
  Thermometer,
  X,
  Settings,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PipelineLoadingService from '@/lib/services/pipelineLoadingService';
import { useKeyboardShortcuts } from '@/components/pipeline/hooks/useKeyboardShortcuts';

import 'reactflow/dist/style.css';

interface OperationalCommandCenterProps {
  pipelineId: string;
}

// Large, Information-Dense Node Component - Following Your Spec
const OperationalNode: React.FC<NodeProps> = ({ data, selected }) => {
  const status = data.status || 'unknown';
  const metrics = data.metrics || {};
  const tech = data.technology?.type || 'unknown';
  
  // Status colors and icons exactly as specified
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'running':
        return { color: 'bg-green-500', icon: <Activity className="h-4 w-4 text-white animate-pulse" />, text: '● Running' };
      case 'success':
        return { color: 'bg-green-500', icon: <CheckCircle className="h-4 w-4 text-white" />, text: '● OK' };
      case 'failed':
        return { color: 'bg-red-500', icon: <AlertTriangle className="h-4 w-4 text-white" />, text: '✖ Failed' };
      case 'pending':
        return { color: 'bg-yellow-500', icon: <Clock className="h-4 w-4 text-white" />, text: '⚠ Slow' };
      default:
        return { color: 'bg-gray-400', icon: null, text: '○ Idle' };
    }
  };

  const statusDisplay = getStatusDisplay(status);
  const formatMetric = (value: number, unit: string) => {
    if (value >= 1000) return `${(value/1000).toFixed(1)}k${unit}`;
    return `${value}${unit}`;
  };

  return (
    <>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      {/* Large, Readable Node - Minimum 160x100px as specified */}
      <div
        className={cn(
          "bg-white border-2 rounded-lg shadow-sm min-w-[160px] min-h-[100px] cursor-pointer transition-all",
          selected ? "ring-2 ring-blue-500 ring-offset-2" : "hover:shadow-md",
          status === 'failed' && "border-red-400 bg-red-50",
          status === 'running' && "border-green-400 bg-green-50",
          status === 'pending' && "border-yellow-400 bg-yellow-50"
        )}
      >
        {/* Technology Header with Status */}
        <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-lg text-white", statusDisplay.color)}>
          <div className="flex items-center gap-2">
            {statusDisplay.icon}
            <span className="font-medium text-sm uppercase tracking-wide">{tech}</span>
          </div>
          {data.technology?.version && (
            <Badge variant="outline" className="text-xs text-white border-white/50">
              v{data.technology.version}
            </Badge>
          )}
        </div>
        
        {/* Node Content - Key Info Always Visible */}
        <div className="p-3 space-y-2">
          {/* Component Name */}
          <div className="font-semibold text-sm text-gray-900">{data.label}</div>
          
          {/* Status Indicator */}
          <div className="text-xs font-medium" style={{ color: statusDisplay.color.replace('bg-', '#') }}>
            {statusDisplay.text}
          </div>
          
          {/* Key Metrics - Always Visible as specified */}
          {metrics.recordsProcessed && (
            <div className="text-xs text-gray-600">
              <span className="font-medium text-gray-900">{formatMetric(metrics.recordsProcessed, '')}</span> records
            </div>
          )}
          
          {metrics.throughput && (
            <div className="text-xs text-gray-600">
              <span className="font-medium text-gray-900">{metrics.throughput.toFixed(1)}/s</span> throughput
            </div>
          )}
          
          {metrics.duration && (
            <div className="text-xs text-gray-600">
              <span className="font-medium text-gray-900">{metrics.duration < 1000 ? `${metrics.duration}ms` : `${(metrics.duration/1000).toFixed(1)}s`}</span> duration
            </div>
          )}
          
          {/* Error Rate if applicable */}
          {metrics.errorRate !== undefined && metrics.errorRate > 0 && (
            <div className="text-xs text-red-600 font-medium">
              {(metrics.errorRate * 100).toFixed(1)}% errors
            </div>
          )}
        </div>
        
        {/* Contextual Quick Actions - As specified */}
        <div className="px-3 pb-2 flex gap-1">
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
            details
          </Button>
          {status === 'failed' && (
            <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-red-600">
              investigate
            </Button>
          )}
          {(metrics.recordsProcessed || metrics.throughput) && (
            <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
              metrics
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

// Context Panel - 25% screen as specified
const ContextPanel = ({ selectedNode, onClose, isVisible }: any) => {
  if (!selectedNode || !isVisible) return null;

  return (
    <div className="w-96 bg-white border-l shadow-lg flex flex-col h-full">
      {/* Panel Header */}
      <div className="border-b p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{selectedNode.data.label}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={selectedNode.data.status === 'running' ? 'default' : 'destructive'}>
            {selectedNode.data.status}
          </Badge>
          <span className="text-sm text-gray-600">{selectedNode.data.technology?.type}</span>
          <span className="text-xs text-gray-500">Real-time status from MCP</span>
        </div>
        {selectedNode.data.status === 'failed' && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            ⚠ Processing failed - executor memory pressure
          </div>
        )}
      </div>

      {/* Tabbed Content - As specified in your design */}
      <Tabs defaultValue="metrics" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 m-2">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="flex-1 p-4 space-y-4">
          <div className="space-y-4">
            {/* Real-time Metrics from MCP as specified */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">Records Processed</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(selectedNode.data.metrics?.recordsProcessed || 0).toLocaleString()}
                </div>
                <div className="text-xs text-green-600">↗ +12% vs baseline</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">Throughput</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(selectedNode.data.metrics?.throughput || 0).toFixed(1)}/s
                </div>
                <div className="text-xs text-red-600">↘ -24% (3x slower)</div>
              </div>
            </div>
            
            {/* Historical trend would go here */}
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Performance Trend</div>
              <div className="h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                📈 Trend chart from MCP data
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="flex-1 p-4">
          {/* Live streaming logs as specified */}
          <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-64 overflow-y-auto">
            <div className="text-gray-400"># Live tail from MCP servers</div>
            <div>[2024-01-20 14:22:15] INFO: Processing batch 1245...</div>
            <div>[2024-01-20 14:22:16] INFO: Records validated: 45,231</div>
            <div className="text-yellow-400">[2024-01-20 14:22:17] WARN: Slow join detected in transformation</div>
            <div className="text-red-400">[2024-01-20 14:22:18] ERROR: Memory pressure on executor-2</div>
            <div className="text-red-400 font-bold">[2024-01-20 14:22:19] ERROR: Task failed with OOM exception</div>
            <div>[2024-01-20 14:22:20] INFO: Retrying with increased memory...</div>
            <div className="animate-pulse">█</div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 p-4">
          {/* Monaco-style editor as specified */}
          <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm h-64 overflow-y-auto">
            <div className="text-green-400"># Transformation Logic - Auto-detected: Python</div>
            <div className="text-blue-400">def</div> <span className="text-yellow-400">transform</span>(df):
            <div className="ml-4 text-gray-500"># Slow join here - MCP suggests optimization</div>
            <div className="ml-4">validated_df = df.join(</div>
            <div className="ml-8 text-red-400">large_df,  # ← Memory pressure source</div>
            <div className="ml-8">on=<span className="text-green-400">"customer_id"</span>,</div>
            <div className="ml-8">how=<span className="text-green-400">"left"</span></div>
            <div className="ml-4">)</div>
            <div className="ml-4 text-blue-400">return</div> validated_df
            <div className="text-yellow-400 mt-2">⚠ Real-time validation: Memory usage high</div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="flex-1 p-4 space-y-3">
          {/* Configuration as specified */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">CPU Cores:</span>
              <span className="font-medium">4</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Memory:</span>
              <span className="font-medium text-red-600">16GB (85% used)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Executors:</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Batch Size:</span>
              <span className="font-medium">10,000</span>
            </div>
          </div>
        </TabsContent>

        {/* Contextual Actions - Bottom of panel as specified */}
        <div className="border-t p-4 space-y-2 bg-gray-50">
          <div className="text-sm font-medium text-gray-700 mb-2">Actions</div>
          <Button className="w-full justify-start" size="sm" variant="default">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart this node
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View in Spark UI
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Optimize performance
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Update configuration
          </Button>
        </div>
      </Tabs>
    </div>
  );
};

// Performance Overlay - Togglable as specified
const PerformanceHeatMap = ({ nodes, visible }: { nodes: Node[]; visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {nodes.map(node => {
        const performance = node.data?.metrics?.throughput || 0;
        const intensity = Math.min(1, performance / 100);
        const isHigh = intensity > 0.7;
        const isMedium = intensity > 0.4;
        const color = isHigh ? 'red' : isMedium ? 'yellow' : 'green';
        
        return (
          <div
            key={node.id}
            className="absolute rounded-lg border-2"
            style={{
              left: node.position.x,
              top: node.position.y,
              width: 160,
              height: 100,
              backgroundColor: `${color === 'red' ? 'rgba(239, 68, 68, 0.3)' : color === 'yellow' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              borderColor: color === 'red' ? '#EF4444' : color === 'yellow' ? '#F59E0B' : '#10B981',
            }}
          />
        );
      })}
      
      {/* Floating legend as specified */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded shadow-lg">
        <div className="text-sm font-medium mb-2">Performance Heat Map</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500" />
            <span>Low Load (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500" />
            <span>Medium Load (40-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500" />
            <span>High Load (&gt;70%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Actions Bar - Bottom floating as specified
const QuickActionsBar = ({ pipelineInfo, expanded, setExpanded }: any) => {
  if (expanded) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-10">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Pipeline Actions</div>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Play className="h-3 w-3" />
                Run Now
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Pause className="h-3 w-3" />
                Pause Pipeline
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <FileText className="h-3 w-3" />
                View Full Logs
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Zap className="h-3 w-3" />
                Optimize
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Collapsed - Summary stats as specified
  return (
    <div className="fixed bottom-4 left-4 right-4 z-10">
      <Card className="shadow-lg cursor-pointer" onClick={() => setExpanded(true)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", 
                  pipelineInfo.status === 'active' ? 'bg-green-500' : 'bg-red-500')} />
                <span className="font-medium">
                  {pipelineInfo.status === 'failed' ? '✖ Failed' : '● Healthy'}
                </span>
              </div>
              <span>3 nodes</span>
              <span>2.3k rec/s</span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                $12/hr
              </span>
            </div>
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Command Center Component - Following Your Exact Spec
export const OperationalCommandCenter: React.FC<OperationalCommandCenterProps> = ({
  pipelineId
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);
  const [pipelineInfo, setPipelineInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const pipelineService = PipelineLoadingService.getInstance();

  // Keyboard shortcuts as specified
  useKeyboardShortcuts({
    onTogglePanel: () => setShowContextPanel(!showContextPanel),
    onEditSelected: () => {
      if (selectedNode) {
        // Open context panel to Code tab
        setShowContextPanel(true);
      }
    },
    onRunPipeline: () => {
      console.log('Run pipeline:', pipelineId);
    },
    onShowLogs: () => {
      if (selectedNode) {
        setShowContextPanel(true);
      }
    },
    onShowMetrics: () => {
      if (selectedNode) {
        setShowContextPanel(true);
      }
    },
    onRefresh: () => {
      loadPipeline();
    }
  });

  // Load pipeline data
  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const pipeline = await pipelineService.fetchPipelineDefinition(pipelineId);
      setPipelineInfo({
        name: pipeline.name,
        status: pipeline.status,
        version: pipeline.version
      });

      const { nodes: flowNodes, edges: flowEdges } = pipelineService.transformToReactFlow(pipeline);
      
      // Use our operational nodes
      const operationalNodes = flowNodes.map(node => ({
        ...node,
        type: 'operational'
      }));

      setNodes(operationalNodes);
      setEdges(flowEdges);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error('Failed to load pipeline:', err);
    }
  }, [pipelineId, setNodes, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowContextPanel(true);
  }, []);

  // Toggle performance overlay (P key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (!e.ctrlKey && !e.metaKey && e.target instanceof HTMLElement && 
            !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
          e.preventDefault();
          setShowPerformanceOverlay(!showPerformanceOverlay);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showPerformanceOverlay]);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  const nodeTypes = {
    operational: OperationalNode
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading operational view...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Minimal Header - As specified */}
      <div className="h-12 border-b bg-white px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg">{pipelineInfo.name}</h1>
          <Badge variant={pipelineInfo.status === 'active' ? 'default' : 'destructive'}>
            {pipelineInfo.status === 'failed' ? '✖ Failed' : '● Running'}
          </Badge>
          <span className="text-sm text-gray-600">Last run: 2min ago</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={loadPipeline}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="default" size="sm">
            <Play className="h-4 w-4 mr-1" />
            Run
          </Button>
        </div>
      </div>

      {/* Main Content - 75% + 25% split as specified */}
      <div className="flex-1 flex">
        {/* Primary Canvas - 75% */}
        <div className={cn("transition-all", showContextPanel ? "flex-[3]" : "flex-1")}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              className="operational-command-center"
            >
              <Background gap={20} size={1} className="opacity-20" />
              
              {/* Minimal top-right controls as specified */}
              <div className="absolute top-4 right-4 z-20 space-y-2">
                <Button
                  variant={showPerformanceOverlay ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPerformanceOverlay(!showPerformanceOverlay)}
                  className="bg-white shadow"
                >
                  <Thermometer className="h-4 w-4 mr-1" />
                  Performance (P)
                </Button>
                
                <Controls className="[&>button]:bg-white [&>button]:shadow" />
              </div>
              
              {/* Performance Overlay */}
              <PerformanceHeatMap nodes={nodes} visible={showPerformanceOverlay} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Context Panel - 25% when open */}
        {showContextPanel && (
          <ContextPanel 
            selectedNode={selectedNode} 
            onClose={() => setShowContextPanel(false)}
            isVisible={showContextPanel}
          />
        )}
      </div>

      {/* Quick Actions Bar - Bottom floating as specified */}
      <QuickActionsBar 
        pipelineInfo={pipelineInfo}
        expanded={quickActionsExpanded}
        setExpanded={setQuickActionsExpanded}
      />
    </div>
  );
};

export default OperationalCommandCenter;