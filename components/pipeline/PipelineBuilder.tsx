import React, { useCallback, useState, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  Connection,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  ReactFlowInstance,
  NodeTypes,
  Panel,
  getRectOfNodes,
  getTransformForBounds
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Save, 
  Play, 
  Download, 
  Upload, 
  Layout, 
  CheckCircle, 
  AlertCircle,
  Maximize2,
  Grid3x3,
  GitBranch,
  FileCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';

interface PipelineBuilderProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  nodeTypes?: NodeTypes;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onValidate?: (nodes: Node[], edges: Edge[]) => { valid: boolean; errors: string[] };
  className?: string;
}

export const PipelineBuilder: React.FC<PipelineBuilderProps> = ({
  initialNodes = [],
  initialEdges = [],
  nodeTypes = {},
  onSave,
  onValidate,
  className
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [validationStatus, setValidationStatus] = useState<{ valid: boolean; errors: string[] } | null>(null);

  // Stage boundaries for guided layout
  const stageBoundaries = {
    ingest: { x: 50, y: 100, width: 200 },
    transform: { x: 300, y: 100, width: 300 },
    store: { x: 650, y: 100, width: 200 },
    consume: { x: 900, y: 100, width: 200 }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      // Validate connection based on node types and stages
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (sourceNode && targetNode) {
        // Add validation logic here based on data types and stages
        setEdges((eds) => addEdge({
          ...params,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 }
        }, eds));
      }
    },
    [setEdges, nodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const componentData = event.dataTransfer.getData('componentData');
      if (!componentData) return;

      const component = JSON.parse(componentData);
      const bounds = reactFlowWrapper.current.getBoundingClientRect();

      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      // Snap to stage boundaries
      const stage = component.stage;
      const stageBoundary = stageBoundaries[stage as keyof typeof stageBoundaries];
      if (stageBoundary) {
        // Snap to stage column
        if (position.x < stageBoundary.x) {
          position.x = stageBoundary.x;
        } else if (position.x > stageBoundary.x + stageBoundary.width) {
          position.x = stageBoundary.x + stageBoundary.width / 2;
        }
      }

      const newNode: Node = {
        id: `${component.id}-${Date.now()}`,
        type: component.type,
        position,
        data: {
          label: component.name,
          ...component,
          status: 'idle',
          config: {}
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleValidate = useCallback(() => {
    if (onValidate) {
      const result = onValidate(nodes, edges);
      setValidationStatus(result);
    } else {
      // Default validation
      const errors: string[] = [];
      
      // Check for disconnected nodes
      const connectedNodeIds = new Set<string>();
      edges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });
      
      nodes.forEach(node => {
        if (!connectedNodeIds.has(node.id) && nodes.length > 1) {
          errors.push(`Node "${node.data.label}" is not connected`);
        }
      });

      // Check for cycles
      // Add cycle detection logic here if needed

      setValidationStatus({
        valid: errors.length === 0,
        errors
      });
    }
  }, [nodes, edges, onValidate]);

  const handleSave = useCallback(() => {
    handleValidate();
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave, handleValidate]);

  const handleAutoLayout = useCallback(() => {
    // Group nodes by stage
    const nodesByStage: Record<string, Node[]> = {
      ingest: [],
      transform: [],
      store: [],
      consume: []
    };

    nodes.forEach(node => {
      const stage = node.data.stage || 'transform';
      if (!nodesByStage[stage]) {
        nodesByStage[stage] = [];
      }
      nodesByStage[stage].push(node);
    });

    // Layout nodes in columns by stage
    const updatedNodes = nodes.map(node => {
      const stage = node.data.stage || 'transform';
      const stageNodes = nodesByStage[stage];
      const index = stageNodes.indexOf(node);
      const stageBoundary = stageBoundaries[stage as keyof typeof stageBoundaries];

      if (stageBoundary) {
        return {
          ...node,
          position: {
            x: stageBoundary.x + (stageBoundary.width / 2) - 100,
            y: stageBoundary.y + (index * 120)
          }
        };
      }
      return node;
    });

    setNodes(updatedNodes);
  }, [nodes, setNodes]);

  const handleExportPNG = useCallback(() => {
    if (!reactFlowWrapper.current) return;

    const nodesBounds = getRectOfNodes(nodes);
    const transform = getTransformForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
      2
    );

    toPng(reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement, {
      backgroundColor: '#1a1a1a',
      width: nodesBounds.width,
      height: nodesBounds.height,
      style: {
        width: `${nodesBounds.width}px`,
        height: `${nodesBounds.height}px`,
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    }).then(dataUrl => {
      const a = document.createElement('a');
      a.setAttribute('download', 'pipeline.png');
      a.setAttribute('href', dataUrl);
      a.click();
    });
  }, [nodes]);

  const handleExportJSON = useCallback(() => {
    const pipelineData = {
      nodes,
      edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    const dataStr = JSON.stringify(pipelineData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const a = document.createElement('a');
    a.setAttribute('href', dataUri);
    a.setAttribute('download', 'pipeline.json');
    a.click();
  }, [nodes, edges]);

  return (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoLayout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background rounded-md hover:bg-muted transition-colors"
            title="Auto-layout pipeline"
          >
            <Layout className="w-4 h-4" />
            Auto Layout
          </button>
          <button
            onClick={handleValidate}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background rounded-md hover:bg-muted transition-colors"
            title="Validate pipeline"
          >
            <CheckCircle className="w-4 h-4" />
            Validate
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Validation Status */}
          {validationStatus && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md",
              validationStatus.valid 
                ? "bg-green-500/10 text-green-500" 
                : "bg-red-500/10 text-red-500"
            )}>
              {validationStatus.valid ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Valid Pipeline</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationStatus.errors.length} Issues</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPNG}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title="Export as Image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportJSON}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title="Export as JSON"
            >
              <FileCode className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Pipeline
            </button>
            <button
              className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Deploy
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-background"
        >
          {/* Stage Guides */}
          <Panel position="top-left" className="bg-transparent pointer-events-none">
            <div className="flex gap-8 mt-4 ml-12">
              <div className="text-center">
                <div className="text-blue-500 text-2xl mb-1">📥</div>
                <div className="text-sm font-medium text-blue-500">Ingest</div>
              </div>
              <div className="text-center ml-24">
                <div className="text-purple-500 text-2xl mb-1">⚙️</div>
                <div className="text-sm font-medium text-purple-500">Transform</div>
              </div>
              <div className="text-center ml-32">
                <div className="text-green-500 text-2xl mb-1">💾</div>
                <div className="text-sm font-medium text-green-500">Store</div>
              </div>
              <div className="text-center ml-24">
                <div className="text-orange-500 text-2xl mb-1">📤</div>
                <div className="text-sm font-medium text-orange-500">Consume</div>
              </div>
            </div>
          </Panel>

          <Background 
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            className="bg-background"
          />
          <Controls 
            className="bg-card border"
            showInteractive={false}
          />
        </ReactFlow>

        {/* Validation Errors Overlay */}
        {validationStatus && !validationStatus.valid && (
          <div className="absolute bottom-4 left-4 max-w-sm bg-card border rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Pipeline Issues</span>
            </div>
            <ul className="space-y-1">
              {validationStatus.errors.map((error, index) => (
                <li key={index} className="text-xs text-muted-foreground">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground">
              <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Start Building Your Pipeline</p>
              <p className="text-sm mt-1">Drag components from the catalog to begin</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-card text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Components: {nodes.length}</span>
          <span>Connections: {edges.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            Ingest: {nodes.filter(n => n.data.stage === 'ingest').length}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            Transform: {nodes.filter(n => n.data.stage === 'transform').length}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Store: {nodes.filter(n => n.data.stage === 'store').length}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            Consume: {nodes.filter(n => n.data.stage === 'consume').length}
          </span>
        </div>
      </div>
    </div>
  );
};