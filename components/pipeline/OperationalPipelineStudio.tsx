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
  Panel
} from 'reactflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  Code,
  Settings,
  BarChart3,
  FileText,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Maximize2,
  Thermometer,
  Gauge,
  Search,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import our services and types
import PipelineLoadingService from '@/lib/services/pipelineLoadingService';
import { LoadingState } from '@/lib/types/pipeline';
import { useKeyboardShortcuts } from '@/components/pipeline/hooks/useKeyboardShortcuts';

import 'reactflow/dist/style.css';

interface OperationalPipelineStudioProps {
  pipelineId: string;
}

// Operational Node Component - Larger, Information-Dense
const OperationalNode: React.FC<any> = ({ data, selected }) => {
  const status = data.status || 'unknown';
  const metrics = data.metrics || {};
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'success': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4 text-white animate-pulse" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-white" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-white" />;
      case 'pending': return <Clock className="h-4 w-4 text-white" />;
      default: return null;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div
      className={cn(
        "bg-white border-2 rounded-lg shadow-sm min-w-[160px] cursor-pointer hover:shadow-md transition-all",
        selected ? "ring-2 ring-blue-500 ring-offset-2" : "hover:border-blue-300",
        status === 'failed' && "border-red-300 bg-red-50",
        status === 'running' && "border-green-300 bg-green-50"
      )}
    >
      {/* Status Bar */}
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-t-lg", getStatusColor(status))}>
        {getStatusIcon(status)}
        <span className="text-white font-medium text-sm">{data.technology?.type || 'Unknown'}</span>
        <div className="ml-auto">
          <Badge variant="outline" className="text-xs text-white border-white/50">
            {data.technology?.version}
          </Badge>
        </div>
      </div>
      
      {/* Node Content */}
      <div className="p-3 space-y-2">
        <div className="font-medium text-sm">{data.label}</div>
        
        {/* Key Metrics - Always Visible */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {metrics.recordsProcessed && (
            <div className="flex justify-between">
              <span className="text-gray-600">Records:</span>
              <span className="font-medium">{formatNumber(metrics.recordsProcessed)}</span>
            </div>
          )}
          {metrics.throughput && (
            <div className="flex justify-between">
              <span className="text-gray-600">Rate:</span>
              <span className="font-medium">{metrics.throughput.toFixed(1)}/s</span>
            </div>
          )}
          {metrics.duration && (
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{metrics.duration < 1000 ? `${metrics.duration}ms` : `${(metrics.duration/1000).toFixed(1)}s`}</span>
            </div>
          )}
          {metrics.errorRate && (
            <div className="flex justify-between">
              <span className="text-gray-600">Errors:</span>
              <span className={cn("font-medium", metrics.errorRate > 0.05 ? "text-red-600" : "text-green-600")}>
                {(metrics.errorRate * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1 pt-1">
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
            <Eye className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
            <BarChart3 className="h-3 w-3" />
          </Button>
          {status === 'failed' && (
            <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-red-600">
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Context Panel Component
const ContextPanel = ({ selectedNode, onClose }: { selectedNode: any; onClose: () => void }) => {
  if (!selectedNode) return null;

  return (
    <div className="w-96 bg-white border-l shadow-lg flex flex-col h-full">
      {/* Panel Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{selectedNode.data.label}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={selectedNode.data.status === 'running' ? 'default' : 'destructive'}>
            {selectedNode.data.status}
          </Badge>
          <span className="text-sm text-gray-600">{selectedNode.data.technology?.type}</span>
        </div>
      </div>

      {/* Panel Content */}
      <Tabs defaultValue="metrics" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 m-2">
          <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
          <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
          <TabsTrigger value="config" className="text-xs">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="flex-1 p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Performance</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            
            {selectedNode.data.metrics && (
              <div className="grid gap-3">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-600 mb-1">Records Processed</div>
                  <div className="text-xl font-bold">{(selectedNode.data.metrics.recordsProcessed || 0).toLocaleString()}</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-600 mb-1">Throughput</div>
                  <div className="text-xl font-bold">{(selectedNode.data.metrics.throughput || 0).toFixed(1)}/s</div>
                </div>
                
                {selectedNode.data.metrics.errorRate !== undefined && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600 mb-1">Error Rate</div>
                    <div className={cn(
                      "text-xl font-bold",
                      selectedNode.data.metrics.errorRate > 0.05 ? "text-red-600" : "text-green-600"
                    )}>
                      {(selectedNode.data.metrics.errorRate * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-600 mb-1">Avg Duration</div>
                  <div className="text-xl font-bold">
                    {selectedNode.data.metrics.duration < 1000 
                      ? `${selectedNode.data.metrics.duration}ms` 
                      : `${(selectedNode.data.metrics.duration/1000).toFixed(1)}s`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="flex-1 p-4">
          <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-64 overflow-y-auto">
            <div>[2024-01-20 14:22:15] INFO: Processing batch 1245...</div>
            <div>[2024-01-20 14:22:16] INFO: Records validated: 45,231</div>
            <div>[2024-01-20 14:22:17] WARN: Slow join detected in transformation</div>
            <div>[2024-01-20 14:22:18] ERROR: Memory pressure on executor-2</div>
            <div className="text-red-400">[2024-01-20 14:22:19] ERROR: Task failed with OOM exception</div>
            <div>[2024-01-20 14:22:20] INFO: Retrying with increased memory...</div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 p-4">
          <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm h-64 overflow-y-auto">
            <div className="text-blue-400"># Transformation Logic</div>
            <div className="text-green-400">def transform(df):</div>
            <div className="ml-4 text-yellow-400"># Validate email format</div>
            <div className="ml-4">validated_df = df.filter(</div>
            <div className="ml-8">col(<span className="text-red-400">"email"</span>).rlike(<span className="text-red-400">r"^[\w\.-]+@[\w\.-]+\.\w+$"</span>)</div>
            <div className="ml-4">)</div>
            <div className="ml-4 text-yellow-400"># Apply business logic</div>
            <div className="ml-4">return validated_df.select(*columns)</div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="flex-1 p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Executors:</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Memory:</span>
              <span className="font-medium">16GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Batch Size:</span>
              <span className="font-medium">10,000</span>
            </div>
          </div>
        </TabsContent>

        {/* Action Buttons */}
        <div className="border-t p-4 space-y-2">
          <Button className="w-full" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View in Spark UI
          </Button>
          <Button variant="outline" className="w-full" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart Node
          </Button>
          <Button variant="outline" className="w-full" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Optimize Performance
          </Button>
        </div>
      </Tabs>
    </div>
  );
};

// Quick Actions Bar
const QuickActionsBar = ({ pipelineStatus, pipelineMetrics }: any) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-10">
      <Card className="shadow-lg">
        {!expanded ? (
          // Collapsed View - Summary Stats
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", 
                    pipelineStatus === 'active' ? 'bg-green-500' : 'bg-red-500')} />
                  <span className="font-medium">{pipelineStatus || 'Unknown'}</span>
                </div>
                <span>3 nodes</span>
                <span>2.3k rec/s</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  $12/hr
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        ) : (
          // Expanded View - Actions
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">Pipeline Actions</div>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
                ×
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Play className="h-3 w-3" />
                Run Now
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Pause className="h-3 w-3" />
                Pause
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <FileText className="h-3 w-3" />
                Full Logs
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Zap className="h-3 w-3" />
                Optimize
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

// Performance Overlay Component
const PerformanceOverlay = ({ nodes, visible }: { nodes: any[]; visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {nodes.map(node => {
        const performance = node.data?.metrics?.throughput || 0;
        const intensity = Math.min(1, performance / 100); // Scale to 0-1
        const hue = intensity > 0.7 ? 0 : intensity > 0.4 ? 60 : 120; // Red, yellow, green
        
        return (
          <div
            key={node.id}
            className="absolute rounded-lg border-2"
            style={{
              left: node.position.x,
              top: node.position.y,
              width: 160,
              height: 120,
              backgroundColor: `hsla(${hue}, 70%, 50%, ${intensity * 0.3})`,
              borderColor: `hsla(${hue}, 70%, 40%, 0.8)`,
            }}
          />
        );
      })}
      
      {/* Performance Legend */}
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

// Keyboard Shortcuts Help
const ShortcutsHelp = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Keyboard Shortcuts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-1">Navigation</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Toggle panel</span>
                  <Badge variant="outline">Space</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Search</span>
                  <Badge variant="outline">/</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Refresh</span>
                  <Badge variant="outline">R</Badge>
                </div>
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Actions</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Run pipeline</span>
                  <Badge variant="outline">⌘R</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Show logs</span>
                  <Badge variant="outline">⌘L</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Show metrics</span>
                  <Badge variant="outline">M</Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="font-medium mb-1">Overlays</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Performance heat map</span>
                <Badge variant="outline">P</Badge>
              </div>
              <div className="flex justify-between">
                <span>Cost overlay</span>
                <Badge variant="outline">$</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Operational Studio Component
export const OperationalPipelineStudio: React.FC<OperationalPipelineStudioProps> = ({
  pipelineId
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [pipelineInfo, setPipelineInfo] = useState<any>({});
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const pipelineService = PipelineLoadingService.getInstance();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onTogglePanel: () => setShowContextPanel(!showContextPanel),
    onEditSelected: () => {
      if (selectedNode) {
        console.log('Edit node:', selectedNode.id);
      }
    },
    onRunPipeline: () => {
      console.log('Run pipeline:', pipelineId);
    },
    onShowLogs: () => {
      if (selectedNode) {
        setShowContextPanel(true);
        // Set logs tab active (would need tab state)
      }
    },
    onShowMetrics: () => {
      if (selectedNode) {
        setShowContextPanel(true);
        // Set metrics tab active (would need tab state)  
      }
    },
    onSearch: () => {
      console.log('Search nodes');
    },
    onRefresh: () => {
      loadPipeline();
    }
  });

  // Load pipeline with operational focus
  const loadPipeline = useCallback(async () => {
    setLoadingState('loading');
    
    try {
      const pipeline = await pipelineService.fetchPipelineDefinition(pipelineId);
      setPipelineInfo({
        name: pipeline.name,
        status: pipeline.status,
        version: pipeline.version
      });

      // Transform nodes to operational format
      const { nodes: flowNodes, edges: flowEdges } = pipelineService.transformToReactFlow(pipeline);
      
      // Override with operational node component
      const operationalNodes = flowNodes.map(node => ({
        ...node,
        type: 'operational'
      }));

      setNodes(operationalNodes);
      setEdges(flowEdges);
      setLoadingState('ready');
      
    } catch (err) {
      setLoadingState('error');
    }
  }, [pipelineId, setNodes, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowContextPanel(true);
  }, []);

  useEffect(() => {
    if (pipelineId) {
      loadPipeline();
    }
  }, [pipelineId, loadPipeline]);

  const nodeTypes = {
    operational: OperationalNode
  };

  if (loadingState === 'loading') {
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
    <div className="h-full flex bg-gray-50">
      {/* Main Canvas */}
      <div className={cn("flex-1 transition-all", showContextPanel ? "mr-96" : "mr-0")}>
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
            className="operational-flow"
          >
            <Background gap={20} size={1} className="opacity-30" />
            <Controls className="bg-white shadow-lg rounded" />
            
            {/* Performance Overlay */}
            <PerformanceOverlay nodes={nodes} visible={showPerformanceOverlay} />
            
            {/* Overlay Controls */}
            <Panel position="top-right">
              <div className="bg-white p-2 rounded shadow-lg space-y-2">
                <div className="text-xs font-medium text-gray-600">Overlays</div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant={showPerformanceOverlay ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPerformanceOverlay(!showPerformanceOverlay)}
                    className="text-xs h-7"
                  >
                    <Thermometer className="h-3 w-3 mr-1" />
                    Performance
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShortcutsHelp(true)}
                    className="text-xs h-7"
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Shortcuts
                  </Button>
                </div>
              </div>
            </Panel>
            
            {/* Pipeline Status Panel */}
            <Panel position="top-left">
              <Card className="w-80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pipelineInfo.name}</CardTitle>
                    <Badge variant={pipelineInfo.status === 'active' ? 'default' : 'destructive'}>
                      {pipelineInfo.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Nodes</div>
                      <div className="font-semibold">{nodes.length}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Version</div>
                      <div className="font-semibold">v{pipelineInfo.version}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Health</div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="font-semibold text-green-600">Good</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost/hr</div>
                      <div className="font-semibold">$12.40</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Context Panel */}
      {showContextPanel && (
        <ContextPanel 
          selectedNode={selectedNode} 
          onClose={() => setShowContextPanel(false)} 
        />
      )}

      {/* Quick Actions Bar */}
      <QuickActionsBar 
        pipelineStatus={pipelineInfo.status}
        pipelineMetrics={{}}
      />

      {/* Keyboard Shortcuts Help */}
      <ShortcutsHelp 
        visible={showShortcutsHelp} 
        onClose={() => setShowShortcutsHelp(false)} 
      />
    </div>
  );
};

export default OperationalPipelineStudio;