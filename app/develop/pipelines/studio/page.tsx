'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Activity,
  Play,
  Settings,
  X,
  Terminal,
  RefreshCw,
  Pause,
  Wrench,
  Package,
  Server
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeTypeRegistry } from '@/lib/services/NodeTypeRegistry';
import { NodePalette } from '@/components/pipeline/NodePalette';
import { MCPServerPanel } from '@/components/pipeline/MCPServerPanel';
import { createDynamicNodeComponent } from '@/components/nodes/DynamicNodeComponent';

// Dynamic import ReactFlow with all required exports
const ReactFlowProvider = dynamic(
  () => import('reactflow').then(mod => ({ default: mod.ReactFlowProvider })),
  { ssr: false }
);

const ReactFlow = dynamic(
  () => import('reactflow').then(mod => ({ default: mod.default })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pipeline visualization...</p>
        </div>
      </div>
    )
  }
);

const Background = dynamic(
  () => import('reactflow').then(mod => ({ default: mod.Background })),
  { ssr: false }
);

const Controls = dynamic(
  () => import('reactflow').then(mod => ({ default: mod.Controls })),
  { ssr: false }
);

const MiniMap = dynamic(
  () => import('reactflow').then(mod => ({ default: mod.MiniMap })),
  { ssr: false }
);

// Import ReactFlow styles
import 'reactflow/dist/style.css';

// Types
type StudioMode = 'operations' | 'monitor' | 'build';
type PanelView = 'components' | 'servers' | 'layers';

interface PipelineNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    status?: 'idle' | 'running' | 'success' | 'error';
    config?: any;
    metrics?: Record<string, any>;
    error?: string;
  };
}

interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

interface ExecutionState {
  nodeId: string;
  status: 'idle' | 'running' | 'success' | 'error';
  progress: number;
  logs: string[];
  metrics?: Record<string, any>;
  error?: string;
}

// Initialize the node registry
const nodeRegistry = new NodeTypeRegistry();

// Generate mock test pipeline
const generateTestPipeline = (mode: StudioMode): { nodes: PipelineNode[], edges: PipelineEdge[] } => {
  const isFailed = mode === 'operations';
  
  const nodes: PipelineNode[] = [
    {
      id: '1',
      type: 'kafka.source',
      position: { x: 100, y: 100 },
      data: {
        label: 'Customer Events',
        status: 'running',
        config: {
          topic: 'customer-events',
          brokers: 'localhost:9092'
        },
        metrics: {
          recordsProcessed: 145234,
          processingTime: 2500,
          memoryUsage: 45.2,
          cpuUsage: 30.1
        }
      }
    },
    {
      id: '2',
      type: 'spark.transform',
      position: { x: 400, y: 100 },
      data: {
        label: 'Enrich & Validate',
        status: isFailed ? 'error' : 'running',
        config: {
          executorMemory: '8g',
          executorCores: 4
        },
        metrics: {
          recordsProcessed: isFailed ? 50000 : 142000,
          processingTime: isFailed ? 0 : 3200,
          memoryUsage: isFailed ? 95.8 : 62.3,
          cpuUsage: isFailed ? 98.2 : 55.7
        },
        error: isFailed ? 'OutOfMemoryError: Java heap space' : undefined
      }
    },
    {
      id: '3',
      type: 'snowflake.sink',
      position: { x: 700, y: 100 },
      data: {
        label: 'Customer Warehouse',
        status: isFailed ? 'idle' : 'running',
        config: {
          database: 'CUSTOMER_DB',
          schema: 'EVENTS',
          table: 'CUSTOMER_INTERACTIONS'
        },
        metrics: {
          recordsProcessed: isFailed ? 0 : 138500,
          processingTime: isFailed ? 0 : 1800
        }
      }
    }
  ];
  
  const edges: PipelineEdge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: !isFailed },
    { id: 'e2-3', source: '2', target: '3', animated: !isFailed }
  ];
  
  return { nodes, edges };
};

// Main Component
export default function PipelineStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL params
  const pipelineId = searchParams.get('id') || 'new_pipeline';
  const initialMode = (searchParams.get('mode') || 'monitor') as StudioMode;
  
  // State
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const [nodes, setNodes] = useState<PipelineNode[]>([]);
  const [edges, setEdges] = useState<PipelineEdge[]>([]);
  const [nodeTypes, setNodeTypes] = useState<any>({});
  const [availableNodeTypes, setAvailableNodeTypes] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<PipelineNode | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(mode === 'build');
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>('components');
  const [issueAlertOpen, setIssueAlertOpen] = useState(mode === 'operations');
  const [isLoading, setIsLoading] = useState(true);
  const [executionStates, setExecutionStates] = useState<Map<string, ExecutionState>>(new Map());
  
  // Initialize MCP system and load pipeline
  useEffect(() => {
    const initializeSystem = async () => {
      setIsLoading(true);
      
      try {
        // Discover MCP servers and node types
        await nodeRegistry.discoverMCPServers();
        const discoveredTypes = nodeRegistry.getNodeTypes();
        setAvailableNodeTypes(discoveredTypes);
        
        // Create dynamic node components
        const dynamicNodeTypes: any = {};
        for (const nodeTypeDef of discoveredTypes) {
          dynamicNodeTypes[nodeTypeDef.type] = createDynamicNodeComponent(nodeTypeDef);
        }
        setNodeTypes(dynamicNodeTypes);
        
        // Load or create pipeline
        if (pipelineId === 'new_pipeline' || mode === 'build') {
          // Start with empty pipeline for new/build mode
          setNodes([]);
          setEdges([]);
        } else {
          // Load test pipeline for existing pipeline
          const testPipeline = generateTestPipeline(mode);
          setNodes(testPipeline.nodes);
          setEdges(testPipeline.edges);
        }
        
        // Auto-open panels based on mode
        if (mode === 'build') {
          setLeftPanelOpen(true);
          setPanelView('components');
        } else if (mode === 'operations') {
          setIssueAlertOpen(true);
        }
        
      } catch (error) {
        console.error('Failed to initialize MCP system:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSystem();
  }, [pipelineId, mode]);
  
  // Handle node selection
  const onNodeClick = useCallback((event: any, node: PipelineNode) => {
    setSelectedNode(node);
    setRightPanelOpen(true);
  }, []);
  
  // Handle canvas click
  const onPaneClick = useCallback(() => {
    setRightPanelOpen(false);
    setSelectedNode(null);
  }, []);
  
  // Handle drag over (for node palette drops)
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle drop (add new node)
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const reactFlowBounds = (event.target as Element).getBoundingClientRect();
    const nodeType = event.dataTransfer.getData('nodeType');
    
    if (!nodeType) return;
    
    const position = {
      x: event.clientX - reactFlowBounds.left - 130, // Offset for node width
      y: event.clientY - reactFlowBounds.top - 50   // Offset for node height
    };
    
    const nodeTypeDef = availableNodeTypes.find(nt => nt.type === nodeType);
    if (!nodeTypeDef) return;
    
    const newNode: PipelineNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position,
      data: {
        label: nodeTypeDef.label,
        status: 'idle'
      }
    };
    
    setNodes(prevNodes => [...prevNodes, newNode]);
  }, [availableNodeTypes]);
  
  // Handle server status changes
  const handleServerStatusChange = useCallback((servers: any[]) => {
    // Update available node types when servers change
    const connectedServers = servers.filter(s => s.status === 'connected');
    const allNodeTypes = connectedServers.flatMap(s => s.nodeTypes || []);
    setAvailableNodeTypes(allNodeTypes);
    
    // Update dynamic node components
    const dynamicNodeTypes: any = {};
    for (const nodeTypeDef of allNodeTypes) {
      dynamicNodeTypes[nodeTypeDef.type] = createDynamicNodeComponent(nodeTypeDef);
    }
    setNodeTypes(dynamicNodeTypes);
  }, []);
  
  // Get header color based on mode
  const getHeaderStyle = () => {
    switch (mode) {
      case 'operations':
        return 'bg-red-50 border-red-200';
      case 'monitor':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-background border-border';
    }
  };
  
  const getModeIndicator = () => {
    switch (mode) {
      case 'operations':
        return <Badge variant="destructive">⚠ Issue Detected</Badge>;
      case 'monitor':
        return <Badge variant="default" className="bg-green-600">● Running</Badge>;
      case 'build':
        return <Badge variant="secondary">● Building</Badge>;
      case 'discovery':
        return <Badge variant="outline">🔍 Discovery</Badge>;
      case 'execution':
        return <Badge variant="default" className="bg-blue-600">▶ Executing</Badge>;
      case 'version':
        return <Badge variant="outline">📋 Versions</Badge>;
      default:
        return <Badge variant="secondary">● Ready</Badge>;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing MCP Pipeline Studio...</p>
          <p className="text-xs text-muted-foreground mt-1">Discovering available components</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className={cn("border-b px-4 py-3", getHeaderStyle())}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/develop/pipelines')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Pipelines
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{pipelineId}</span>
              {getModeIndicator()}
            </div>
          </div>
          
          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {mode === 'build' && (
              <>
                <Button
                  variant={leftPanelOpen ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Components
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLeftPanelOpen(true);
                    setPanelView('servers');
                  }}
                >
                  <Server className="h-4 w-4 mr-2" />
                  Servers
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm">
              <Activity className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            {mode === 'monitor' && (
              <Button variant="default" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            {mode === 'build' && (
              <Button variant="default" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Test Run
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Left Panel */}
        <div className={cn(
          "bg-background border-r transition-all duration-300 z-10",
          leftPanelOpen ? "w-80" : "w-0 overflow-hidden"
        )}>
          {leftPanelOpen && (
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Pipeline Builder</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLeftPanelOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Panel Tabs */}
                <Tabs value={panelView} onValueChange={(v) => setPanelView(v as PanelView)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="components">Components</TabsTrigger>
                    <TabsTrigger value="servers">Servers</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {panelView === 'components' && (
                  <NodePalette nodeTypes={availableNodeTypes} className="h-full" />
                )}
                {panelView === 'servers' && (
                  <div className="p-4 h-full overflow-auto">
                    <MCPServerPanel onServerStatusChange={handleServerStatusChange} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              className="bg-muted/20"
            >
              <Background />
              <Controls />
              {mode !== 'build' && <MiniMap />}
            </ReactFlow>
          </ReactFlowProvider>
          
          {/* Empty State for Build Mode */}
          {mode === 'build' && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">Start Building Your Pipeline</h3>
                <p className="text-sm max-w-md">
                  Drag components from the left panel to create your data pipeline.
                  All components are automatically discovered from connected MCP servers.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel (Node Details) */}
        <div className={cn(
          "absolute top-0 right-0 h-full w-[400px] bg-background border-l shadow-xl transition-transform duration-300 z-20",
          rightPanelOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {selectedNode && (
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedNode.type.split('.')[0]}</span>
                  <h3 className="font-semibold">{selectedNode.data.label}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightPanelOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Panel Content */}
              <div className="flex-1 overflow-auto">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full justify-start px-4 py-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                    <TabsTrigger value="config">Config</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="px-4 py-4">
                    <div className="space-y-4">
                      {/* Status */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant={selectedNode.data.status === 'running' ? 'default' : 
                                          selectedNode.data.status === 'error' ? 'destructive' : 'secondary'}>
                              {selectedNode.data.status}
                            </Badge>
                          </div>
                          {selectedNode.data.error && (
                            <p className="text-sm text-red-600">{selectedNode.data.error}</p>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Key Metrics */}
                      {selectedNode.data.metrics && Object.keys(selectedNode.data.metrics).length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Key Metrics</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(selectedNode.data.metrics).slice(0, 4).map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <div className="text-lg font-semibold">
                                    {typeof value === 'number' ? value.toLocaleString() : value}
                                  </div>
                                  <div className="text-xs text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, ' $1')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="metrics" className="px-4 py-4">
                    <div className="space-y-4">
                      {selectedNode.data.metrics && Object.entries(selectedNode.data.metrics).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </span>
                            <span className="font-medium">
                              {typeof value === 'number' ? 
                                (key.includes('Usage') || key.includes('Percent') ? `${value}%` : value.toLocaleString()) : 
                                value
                              }
                            </span>
                          </div>
                          {typeof value === 'number' && (key.includes('Usage') || key.includes('Percent')) && (
                            <Progress 
                              value={value} 
                              className={cn(
                                "h-2",
                                value > 80 && "bg-red-100",
                                value > 60 && value <= 80 && "bg-yellow-100"
                              )}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="logs" className="px-4 py-4">
                    <div className="font-mono text-xs p-3 bg-muted rounded h-64 overflow-auto">
                      [2024-01-15 10:23:45] INFO: Node initialized<br/>
                      [2024-01-15 10:23:46] INFO: Configuration loaded<br/>
                      [2024-01-15 10:23:47] INFO: Starting processing...<br/>
                      {selectedNode.data.status === 'running' && (
                        <>[2024-01-15 10:23:48] INFO: Processing in progress...<br/></>
                      )}
                      {selectedNode.data.status === 'error' && selectedNode.data.error && (
                        <>
                          [2024-01-15 10:23:49] ERROR: {selectedNode.data.error}<br/>
                          [2024-01-15 10:23:50] ERROR: Node execution failed
                        </>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="config" className="px-4 py-4">
                    <div className="space-y-3">
                      {selectedNode.data.config ? (
                        Object.entries(selectedNode.data.config).map(([key, value]) => (
                          <div key={key}>
                            <div className="text-sm text-muted-foreground mb-1 capitalize">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </div>
                            <div className="text-sm font-mono bg-muted p-2 rounded">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No configuration available</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Panel Actions */}
              <div className="p-4 border-t space-y-2">
                {selectedNode.data.status === 'error' ? (
                  <>
                    <Button className="w-full" variant="destructive">
                      <Wrench className="h-4 w-4 mr-2" />
                      Troubleshoot
                    </Button>
                    <Button className="w-full" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Terminal className="h-4 w-4 mr-2" />
                      View Logs
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Status Badge */}
        {mode !== 'build' && (
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {mode === 'operations' ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">
                  {mode === 'operations' ? 'Pipeline Failed' : 'Healthy'}
                </span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {nodes.length} nodes
                </span>
                <span className="flex items-center gap-1">
                  <Server className="h-3 w-3" />
                  {availableNodeTypes.length} components
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Issue Alert Panel */}
        {issueAlertOpen && mode === 'operations' && (
          <div className="absolute bottom-20 left-4 right-4 max-w-2xl mx-auto">
            <Alert className="border-red-200 bg-red-50 shadow-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span>Spark Transform Node Failed</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIssueAlertOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertTitle>
              <AlertDescription className="mt-3">
                <div className="space-y-3">
                  <p className="text-sm">
                    OutOfMemoryError: Java heap space - Node executor ran out of memory
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Memory:</span>
                      <div className="font-medium">8GB (95.8% used)</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Records Processed:</span>
                      <div className="font-medium">50,000 / 145,234</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Suggested Fix:</span>
                      <div className="font-medium text-green-600">Increase to 16GB</div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm">
                      <Wrench className="h-4 w-4 mr-2" />
                      Auto-Fix Configuration
                    </Button>
                    <Button size="sm" variant="outline">
                      <Terminal className="h-4 w-4 mr-2" />
                      View Full Logs
                    </Button>
                    <Button size="sm" variant="ghost">
                      Ignore
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}