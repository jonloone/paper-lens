'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Grid3x3, 
  BookOpen, 
  GitBranch,
  Database,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PipelineGallery } from '@/components/pipeline/PipelineGallery';
import { StageBasedCatalog, CatalogComponent } from '@/components/pipeline/StageBasedCatalog';
import { PipelineBuilder } from '@/components/pipeline/PipelineBuilder';
import { ConfigurationPanel } from '@/components/pipeline/ConfigurationPanel';
import { TemplatesLibrary, PipelineTemplate } from '@/components/pipeline/TemplatesLibrary';
import { NodeTypeRegistry } from '@/lib/services/NodeTypeRegistry';
import { createDynamicNodeComponent } from '@/components/nodes/DynamicNodeComponent';
import 'reactflow/dist/style.css';

// Dynamic import ReactFlow Provider
const ReactFlowProvider = dynamic(
  () => import('reactflow').then(mod => ({ default: mod.ReactFlowProvider })),
  { ssr: false }
);

type ViewMode = 'gallery' | 'builder' | 'templates' | 'catalog';

export default function PipelineOperationsStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL params
  const pipelineId = searchParams.get('id');
  const initialView = (searchParams.get('view') || 'gallery') as ViewMode;
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [currentPipeline, setCurrentPipeline] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [nodeTypes, setNodeTypes] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize node registry
  const nodeRegistry = new NodeTypeRegistry();

  // Navigation items
  const navigationItems = [
    { id: 'gallery', label: 'Pipeline Gallery', icon: Grid3x3 },
    { id: 'builder', label: 'Pipeline Builder', icon: GitBranch },
    { id: 'templates', label: 'Templates', icon: BookOpen },
    { id: 'catalog', label: 'Tools Catalog', icon: Database }
  ];

  // Initialize MCP system
  useEffect(() => {
    const initializeSystem = async () => {
      setIsLoading(true);
      try {
        // Discover MCP servers and node types
        await nodeRegistry.discoverMCPServers();
        const discoveredTypes = nodeRegistry.getNodeTypes();
        
        // Create dynamic node components
        const dynamicNodeTypes: any = {};
        for (const [key, nodeTypeDef] of discoveredTypes) {
          dynamicNodeTypes[nodeTypeDef.type] = createDynamicNodeComponent(nodeTypeDef);
        }
        setNodeTypes(dynamicNodeTypes);
        
        // Load pipeline if ID provided
        if (pipelineId) {
          // Load pipeline data
          setViewMode('builder');
        }
      } catch (error) {
        console.error('Failed to initialize MCP system:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSystem();
  }, [pipelineId]);

  const handleSelectPipeline = useCallback((pipeline: any) => {
    setCurrentPipeline(pipeline);
    setNodes(pipeline.nodes || []);
    setEdges(pipeline.edges || []);
    setViewMode('builder');
  }, []);

  const handleSelectTemplate = useCallback((template: PipelineTemplate) => {
    // Convert template to pipeline structure
    const pipelineFromTemplate = {
      name: template.name,
      description: template.description,
      nodes: [],
      edges: []
    };
    setCurrentPipeline(pipelineFromTemplate);
    setNodes([]);
    setEdges([]);
    setViewMode('builder');
  }, []);

  const handleSelectComponent = useCallback((component: CatalogComponent) => {
    // Open configuration panel for the selected component
    setSelectedNode({
      id: `temp-${Date.now()}`,
      type: component.type,
      name: component.name,
      data: component
    });
    setShowConfigPanel(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setCurrentPipeline(null);
    setNodes([]);
    setEdges([]);
    setViewMode('builder');
  }, []);

  const handleNodeClick = useCallback((event: any, node: any) => {
    setSelectedNode(node);
    setShowConfigPanel(true);
  }, []);

  const handleSaveNodeConfig = useCallback((config: any) => {
    // Update node configuration
    if (selectedNode) {
      const updatedNodes = nodes.map(n => 
        n.id === selectedNode.id 
          ? { ...n, data: { ...n.data, config } }
          : n
      );
      setNodes(updatedNodes);
    }
    setShowConfigPanel(false);
    setSelectedNode(null);
  }, [selectedNode, nodes]);

  const handleSavePipeline = useCallback((updatedNodes: any[], updatedEdges: any[]) => {
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    // Save to backend or local storage
    console.log('Saving pipeline:', { nodes: updatedNodes, edges: updatedEdges });
  }, []);

  // Update URL when view mode changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', viewMode);
    window.history.replaceState({}, '', url.toString());
  }, [viewMode]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing Pipeline Operations Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/develop/pipelines')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Pipelines</span>
          </button>
          
          <div className="h-6 w-px bg-border" />
          
          <h1 className="text-xl font-bold">Pipeline Operations Studio</h1>
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {navigationItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setViewMode(item.id as ViewMode)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm",
                    viewMode === item.id 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pipeline Info */}
        {currentPipeline && viewMode === 'builder' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Editing:</span>
            <span className="font-medium text-foreground">{currentPipeline.name || 'Untitled Pipeline'}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Component Catalog (for builder mode) */}
        {viewMode === 'builder' && (
          <div className={cn(
            "border-r transition-all duration-300",
            leftPanelCollapsed ? "w-12" : "w-80"
          )}>
            {leftPanelCollapsed ? (
              <button
                onClick={() => setLeftPanelCollapsed(false)}
                className="w-full h-full flex items-center justify-center hover:bg-muted/50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm font-medium">Components</span>
                  <button
                    onClick={() => setLeftPanelCollapsed(true)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <StageBasedCatalog 
                  onSelectComponent={handleSelectComponent}
                  className="border-0"
                />
              </>
            )}
          </div>
        )}

        {/* Center Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'gallery' && (
            <PipelineGallery 
              onSelectPipeline={handleSelectPipeline}
              onCreateNew={handleCreateNew}
            />
          )}

          {viewMode === 'builder' && (
            <ReactFlowProvider>
              <PipelineBuilder 
                initialNodes={nodes}
                initialEdges={edges}
                nodeTypes={nodeTypes}
                onSave={handleSavePipeline}
              />
            </ReactFlowProvider>
          )}

          {viewMode === 'templates' && (
            <TemplatesLibrary 
              onSelectTemplate={handleSelectTemplate}
            />
          )}

          {viewMode === 'catalog' && (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-2xl mx-auto p-8">
                <div className="text-center">
                  <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-2xl font-bold mb-2">Tools Catalog</h2>
                  <p className="text-muted-foreground mb-6">
                    Browse all available tools and their integration capabilities
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="font-medium">Full API Integration</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        15 tools with complete automation
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <span className="font-medium">Partial Integration</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        8 tools with guided configuration
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="font-medium">Manual Setup</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        12 tools with documentation
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="font-medium">Coming Soon</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        5 tools in development
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Configuration (for builder mode) */}
        {viewMode === 'builder' && showConfigPanel && selectedNode && (
          <ConfigurationPanel
            nodeId={selectedNode.id}
            nodeType={selectedNode.type}
            nodeName={selectedNode.name || selectedNode.data?.name || 'Component'}
            currentConfig={selectedNode.data?.config || {}}
            integrationLevel={selectedNode.data?.integrationLevel || 'manual'}
            onSave={handleSaveNodeConfig}
            onClose={() => {
              setShowConfigPanel(false);
              setSelectedNode(null);
            }}
          />
        )}
      </div>
    </div>
  );
}