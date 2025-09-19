'use client';

import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import { nodeTypes, type NodeData } from '@/components/pipeline/custom-nodes';
import { ContextualBottomBar } from '@/components/pipeline/contextual-bottom-bar';
import { CommandPalette } from '@/components/pipeline/command-palette';

import { 
  ArrowLeft,
  Search,
  MoreVertical,
  Sparkles,
  Settings,
  BarChart3,
  Lightbulb,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Activity
} from 'lucide-react';

// Initial nodes data with React Flow format
const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: 'source',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Customer Transactions',
      businessName: 'Customer Transactions',
      technicalId: 'analytics.customer_transactions',
      description: 'Real-time customer transaction data from PostgreSQL',
      status: 'success',
      systemDetails: {
        outputTable: 'analytics.customer_transactions',
        pipelineId: 'customer_tx_extract_v3',
        schedule: 'Every 5 minutes',
        owner: 'data-platform'
      },
      businessContext: {
        purpose: 'Revenue Analytics',
        stakeholders: ['Finance', 'Product', 'Analytics'],
        businessValue: 'Real-time revenue tracking and fraud detection',
        usedBy: ['Revenue Dashboard', 'Fraud Detection', 'Customer 360']
      },
      metrics: { throughput: '1.2k/s', cost: '$0.15' }
    },
  },
  {
    id: '2',
    type: 'transform',
    position: { x: 400, y: 100 },
    data: { 
      label: 'Incremental Processing',
      businessName: 'Changed Records Only',
      technicalId: 'incremental_filter_job',
      description: 'Process only changed records using watermarks',
      status: 'running',
      systemDetails: {
        pipelineId: 'incremental_filter_job',
        inputTable: 'analytics.customer_transactions',
        outputTable: 'staging.tx_incremental',
        dagId: 'customer_etl_dag',
        schedule: 'Triggered by upstream'
      },
      businessContext: {
        purpose: 'Cost Optimization',
        stakeholders: ['Data Engineering', 'FinOps'],
        businessValue: 'Reduce processing costs by 80% through incremental updates'
      },
      metrics: { latency: '45ms', cost: '$0.08' }
    },
  },
  {
    id: '3',
    type: 'transform',
    position: { x: 700, y: 100 },
    data: { 
      label: 'Quality Validation',
      businessName: 'Data Quality Checks',
      technicalId: 'dq_validation_spark_job',
      description: 'Schema validation and business rule checks',
      status: 'success',
      systemDetails: {
        pipelineId: 'dq_validation_spark_job',
        inputTable: 'staging.tx_incremental',
        outputTable: 'curated.validated_transactions',
        schedule: 'Triggered by upstream'
      },
      businessContext: {
        purpose: 'Data Trust',
        stakeholders: ['Data Governance', 'Analytics', 'Finance'],
        businessValue: 'Ensure 99.9% data accuracy for business decisions',
        usedBy: ['Executive Dashboards', 'Regulatory Reports']
      },
      metrics: { latency: '23ms', cost: '$0.04' }
    },
  },
  {
    id: '4',
    type: 'sink',
    position: { x: 1000, y: 100 },
    data: { 
      label: 'Analytics Data Lake',
      businessName: 'Customer Analytics Store',
      technicalId: 's3://company-datalake/curated/transactions/',
      description: 'Curated transaction data in S3 for analytics',
      status: 'success',
      systemDetails: {
        outputTable: 's3://company-datalake/curated/transactions/',
        pipelineId: 'curated_tx_sink',
        schedule: 'Triggered by upstream'
      },
      businessContext: {
        purpose: 'Self-Service Analytics',
        stakeholders: ['Analytics', 'Data Science', 'Product'],
        businessValue: 'Enable fast, self-service access to trusted customer data',
        usedBy: ['Tableau', 'Looker', 'Jupyter Notebooks', 'ML Pipelines']
      },
      metrics: { errors: 0, cost: '$0.23' }
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
];

// Main Studio Component
function StudioWorkspace() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  
  // UI state
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const reactFlowInstance = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (event.metaKey || event.ctrlKey) {
      // Multi-select with Cmd/Ctrl
      setSelectedNodes(prev => {
        const isAlreadySelected = prev.some(n => n.id === node.id);
        if (isAlreadySelected) {
          return prev.filter(n => n.id !== node.id);
        } else {
          return [...prev, node];
        }
      });
    } else {
      // Single select
      setSelectedNode(node);
      setSelectedNodes([node]);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedNodes([]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAiPanelOpen(true);
      }
      if (e.key === 'm' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setMetricsOpen(true);
      }
      if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedNodes([]);
        setAiPanelOpen(false);
        setMetricsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Action handlers
  const handleRun = async () => {
    setIsRunning(true);
    // Simulate running
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsRunning(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleLayout = () => {
    // Auto-layout nodes (could integrate dagre here)
    setNodes(nds => nds.map(node => ({
      ...node,
      position: { 
        x: Math.random() * 800, 
        y: Math.random() * 400 
      }
    })));
  };

  const handleAddNode = (type: 'source' | 'transform' | 'sink') => {
    const newNode: Node<NodeData> = {
      id: `${nodes.length + 1}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `New ${type} node`,
        description: 'Configure this node',
        status: 'idle'
      },
    };
    setNodes(nds => [...nds, newNode]);
    setCommandOpen(false);
  };

  const aiSuggestions = [
    { text: 'Add deduplication step before sink', impact: 'Prevent duplicates', confidence: 94 },
    { text: 'Include error handling with DLQ', impact: 'Improve reliability', confidence: 89 },
    { text: 'Add compression before S3', impact: 'Reduce storage 60%', confidence: 96 },
    { text: 'Parallelize processing', impact: 'Speed up 3x', confidence: 91 }
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
      {/* Minimal Header - 40px */}
      <div className="h-10 flex items-center justify-between px-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-normal text-base">Incremental Load with Watermarks</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCommandOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* React Flow Canvas - Takes remaining space */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="hidden"
        >
          <Controls className="bg-white shadow-lg border" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>

        {/* Node Details Popover */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-10">
            <Card className="w-80 shadow-lg">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedNode.data.status === 'success' ? 'bg-green-500' :
                    selectedNode.data.status === 'running' ? 'bg-blue-500' :
                    selectedNode.data.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <h3 className="font-normal text-base">{selectedNode.data.label}</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedNode(null)}
                    className="ml-auto"
                  >
                    ×
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedNode.data.description}
                </p>
                
                <div className="flex gap-2 mb-4">
                  <Button size="sm" variant="outline">Configure</Button>
                  <Button size="sm" variant="outline">Test</Button>
                  <Button size="sm" variant="outline">Metrics</Button>
                </div>

                {selectedNode.data.metrics && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-normal">Metrics</p>
                    {selectedNode.data.metrics.throughput && (
                      <div className="flex justify-between text-xs">
                        <span>Throughput</span>
                        <span>{selectedNode.data.metrics.throughput}</span>
                      </div>
                    )}
                    {selectedNode.data.metrics.latency && (
                      <div className="flex justify-between text-xs">
                        <span>Latency</span>
                        <span>{selectedNode.data.metrics.latency}</span>
                      </div>
                    )}
                    {selectedNode.data.metrics.errors !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span>Errors</span>
                        <span>{selectedNode.data.metrics.errors}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onSelectPattern={() => {}}
        onRunPattern={handleRun}
        onSavePattern={handleSave}
        onOpenMetrics={() => setMetricsOpen(true)}
        onOpenAI={() => setAiPanelOpen(true)}
        onAddNode={handleAddNode}
      />

      {/* Contextual Bottom Bar */}
      <ContextualBottomBar
        selectedNodes={selectedNodes}
        totalNodes={nodes.length}
        onRun={handleRun}
        onSave={handleSave}
        onZoomIn={() => reactFlowInstance.zoomIn()}
        onZoomOut={() => reactFlowInstance.zoomOut()}
        onFitView={() => reactFlowInstance.fitView()}
        onOpenCommandPalette={() => setCommandOpen(true)}
        isRunning={isRunning}
        isSaving={isSaving}
        hasUnsavedChanges={true} // Mock for demo
      />

      {/* AI Assistant Sheet */}
      <Sheet open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Assistant
            </SheetTitle>
            <SheetDescription>
              Get intelligent suggestions for your pipeline
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div>
              <h4 className="text-base font-normal mb-3">Suggested Improvements</h4>
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <p className="text-sm font-normal">{suggestion.text}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.impact}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        Apply
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />
            
            <div className="space-y-3">
              <h4 className="text-base font-normal">Ask AI</h4>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Describe what you want to change..."
                  className="flex-1"
                  rows={3}
                />
                <Button size="icon">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Metrics Sheet */}
      <Sheet open={metricsOpen} onOpenChange={setMetricsOpen}>
        <SheetContent side="bottom" className="h-96">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Pipeline Metrics
            </SheetTitle>
            <SheetDescription>
              Performance and health metrics for your pattern
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-normal">Throughput</span>
              </div>
              <p className="text-2xl font-bold mt-2">1.2k/s</p>
              <p className="text-xs text-muted-foreground">records processed</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-normal">Latency</span>
              </div>
              <p className="text-2xl font-bold mt-2">45ms</p>
              <p className="text-xs text-muted-foreground">avg processing time</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-normal">Success Rate</span>
              </div>
              <p className="text-2xl font-bold mt-2">99.9%</p>
              <p className="text-xs text-muted-foreground">last 24 hours</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-normal">Errors</span>
              </div>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-xs text-muted-foreground">in last hour</p>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Main component with ReactFlow provider
export default function PatternRemixStudio() {
  return (
    <ReactFlowProvider>
      <StudioWorkspace />
    </ReactFlowProvider>
  );
}