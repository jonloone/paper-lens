'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
  Panel
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Play,
  Save,
  RefreshCw,
  Clock,
  Download,
  Upload,
  Settings,
  AlertCircle,
  CheckCircle,
  Activity,
  Zap,
  Shield,
  GitBranch,
  Eye,
  RotateCcw,
  FileText,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  Maximize2
} from 'lucide-react';

import { StudioSection, sectionNodeTypes } from './SectionAwareNode';
import { SelectedNodeOverlay } from './SelectedNodeOverlay';
import { ResourceBadge, calculateTotalResource } from './ResourceIndicator';
import { patternDetectionService } from '@/lib/services/pattern-detection';

// Section layout configurations
const sectionLayouts = {
  pipelines: {
    name: 'Build',
    showLeftPanel: true,
    leftPanelWidth: 240,
    showRightPanel: false,
    rightPanelWidth: 0,
    nodeTypes: ['source', 'transform', 'quality', 'sink'],
    defaultView: { zoom: 1, x: 0, y: 0 },
    controlsPosition: 'bottom-left' as const,
    miniMapPosition: 'top-right' as const,
    bottomBarActions: ['run', 'save', 'validate', 'test'],
    primaryColor: 'blue',
    focusOn: 'creation',
    showMiniMap: true,
    showBackground: true
  },
  
  operations: {
    name: 'Operations',
    showLeftPanel: true,
    leftPanelWidth: 300,
    showRightPanel: true,
    rightPanelWidth: 400,
    nodeTypes: ['running', 'error', 'stuck', 'pending'],
    defaultView: { zoom: 0.8, x: 50, y: 50 },
    controlsPosition: 'bottom-left' as const,
    miniMapPosition: 'bottom-right' as const,
    bottomBarActions: ['investigate', 'restart', 'rollback', 'logs'],
    primaryColor: 'orange',
    focusOn: 'debugging',
    showMiniMap: false,
    showBackground: false
  },
  
  monitor: {
    name: 'Monitor',
    showLeftPanel: false,
    leftPanelWidth: 0,
    showRightPanel: true,
    rightPanelWidth: 320,
    nodeTypes: ['metric', 'alert', 'health'],
    defaultView: { zoom: 0.6, x: 100, y: 100 },
    controlsPosition: 'top-left' as const,
    miniMapPosition: 'bottom-right' as const,
    bottomBarActions: ['refresh', 'timerange', 'export', 'alert-config'],
    primaryColor: 'green',
    focusOn: 'observability',
    showMiniMap: true,
    showBackground: true
  },
  
  configure: {
    name: 'Configure',
    showLeftPanel: true,
    leftPanelWidth: 280,
    showRightPanel: true,
    rightPanelWidth: 360,
    nodeTypes: ['config', 'connection', 'validation'],
    defaultView: { zoom: 0.9, x: 0, y: 0 },
    controlsPosition: 'bottom-left' as const,
    miniMapPosition: 'top-right' as const,
    bottomBarActions: ['validate', 'apply', 'test-connection', 'rollback'],
    primaryColor: 'purple',
    focusOn: 'configuration',
    showMiniMap: false,
    showBackground: true
  }
};

// Action icons mapping
const actionIcons = {
  run: Play,
  save: Save,
  validate: CheckCircle,
  test: Zap,
  investigate: Search,
  restart: RefreshCw,
  rollback: RotateCcw,
  logs: FileText,
  refresh: RefreshCw,
  timerange: Clock,
  export: Download,
  'alert-config': AlertCircle,
  apply: CheckCircle,
  'test-connection': Activity
};

const actionLabels = {
  run: 'Run',
  save: 'Save',
  validate: 'Validate',
  test: 'Test',
  investigate: 'Investigate',
  restart: 'Restart',
  rollback: 'Rollback',
  logs: 'View Logs',
  refresh: 'Refresh',
  timerange: 'Time Range',
  export: 'Export',
  'alert-config': 'Configure Alerts',
  apply: 'Apply Changes',
  'test-connection': 'Test Connection'
};

interface SectionAwareBottomBarProps {
  section: StudioSection;
  nodes: Node[];
  onAction: (action: string) => void;
  status?: any;
}

function SectionAwareBottomBar({ section, nodes, onAction, status }: SectionAwareBottomBarProps) {
  const config = sectionLayouts[section];
  const totalResource = useMemo(() => calculateTotalResource(nodes), [nodes]);
  
  return (
    <motion.div
      className="h-14 border-t bg-background/95 backdrop-blur"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Primary actions for this section */}
        <div className="flex items-center gap-2">
          {config.bottomBarActions.slice(0, 2).map((action, index) => {
            const Icon = actionIcons[action as keyof typeof actionIcons];
            return (
              <Button
                key={action}
                size="sm"
                variant={index === 0 ? "default" : "outline"}
                onClick={() => onAction(action)}
                className="h-8"
              >
                <Icon className="h-4 w-4 mr-1" />
                {actionLabels[action as keyof typeof actionLabels]}
              </Button>
            );
          })}
        </div>
        
        {/* Center: Context info based on section */}
        <div className="flex items-center gap-4 text-sm">
          {section === 'pipelines' && (
            <>
              <span className="text-muted-foreground">
                Nodes: <span className="font-medium text-foreground">{nodes.length}</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Resources: <ResourceBadge level={totalResource} className="ml-1" />
              </span>
            </>
          )}
          
          {section === 'operations' && status && (
            <>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="text-muted-foreground">Running:</span>
                  <span className="font-medium">{status.running || 0}</span>
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="font-medium text-destructive">{status.failed || 0}</span>
                </span>
              </div>
            </>
          )}
          
          {section === 'monitor' && status && (
            <>
              <span className="text-muted-foreground">
                Uptime: <span className="font-medium text-green-600">{status.uptime || '99.9'}%</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Throughput: <span className="font-medium">{status.throughput || '1.2k'}/s</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Alerts: <span className={cn("font-medium", status.alerts > 0 ? "text-yellow-600" : "text-green-600")}>
                  {status.alerts || 0}
                </span>
              </span>
            </>
          )}
          
          {section === 'configure' && (
            <>
              <span className="text-muted-foreground">
                Configured: <span className="font-medium text-green-600">
                  {nodes.filter(n => n.data.isValid).length}/{nodes.length}
                </span>
              </span>
              {nodes.some(n => n.data.isRequired && !n.data.isValid) && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-yellow-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Required fields missing
                  </span>
                </>
              )}
            </>
          )}
        </div>
        
        {/* Right: Section-specific controls */}
        <div className="flex items-center gap-2">
          {config.bottomBarActions.slice(2).map(action => {
            const Icon = actionIcons[action as keyof typeof actionIcons];
            return (
              <Button 
                key={action} 
                size="sm" 
                variant="ghost"
                onClick={() => onAction(action)}
                className="h-8"
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Left panels for different sections
function PatternLibrary() {
  const patterns = patternDetectionService.getDiscoveredPatterns();
  
  return (
    <div className="h-full p-4 overflow-y-auto">
      <h3 className="font-semibold mb-3">Pattern Library</h3>
      <div className="space-y-2">
        {patterns.slice(0, 5).map(pattern => (
          <div key={pattern.id} className="p-2 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <div className="text-sm font-medium">{pattern.pattern}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {pattern.occurrences} uses • {pattern.confidence}% confidence
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IssuesList() {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <h3 className="font-semibold mb-3 text-destructive">Active Issues</h3>
      <div className="space-y-2">
        <div className="p-2 border border-destructive/50 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">Pipeline Stuck</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            customer_etl has been processing for 2h
          </p>
        </div>
      </div>
    </div>
  );
}

// Right panels for different sections
function LogsPanel() {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <h3 className="font-semibold mb-3">Logs</h3>
      <div className="space-y-1 font-mono text-xs">
        <div className="text-muted-foreground">[12:34:56] Starting pipeline...</div>
        <div className="text-green-600">[12:34:57] Connected to database</div>
        <div className="text-yellow-600">[12:35:01] Warning: High memory usage</div>
        <div className="text-red-600">[12:35:05] Error: Connection timeout</div>
      </div>
    </div>
  );
}

function AlertsPanel() {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <h3 className="font-semibold mb-3">Active Alerts</h3>
      <div className="space-y-2">
        <div className="p-2 border border-yellow-500/50 rounded-lg bg-yellow-50/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">High Latency</span>
            <Badge variant="outline" className="text-xs bg-yellow-100">Warning</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">P99 latency > 500ms</p>
        </div>
      </div>
    </div>
  );
}

interface SectionAwareStudioProps {
  section: StudioSection;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

export function SectionAwareStudio({
  section,
  initialNodes = [],
  initialEdges = [],
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp
}: SectionAwareStudioProps) {
  const config = sectionLayouts[section];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);
  
  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  
  const handleAction = (action: string) => {
    console.log(`Action triggered: ${action}`);
    // Implement action handlers
  };
  
  // Mock status for demo
  const mockStatus = {
    running: 3,
    failed: 1,
    uptime: '99.9',
    throughput: '1.2k',
    alerts: 2
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Main workspace */}
      <div className="flex-1 flex relative">
        {/* Conditional left panel */}
        <AnimatePresence>
          {config.showLeftPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: config.leftPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r bg-muted/30 overflow-hidden"
            >
              {section === 'pipelines' && <PatternLibrary />}
              {section === 'operations' && <IssuesList />}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={sectionNodeTypes}
            defaultViewport={config.defaultView}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            {config.showBackground && <Background />}
            <Controls position={config.controlsPosition} />
            {config.showMiniMap && (
              <MiniMap 
                position={config.miniMapPosition}
                nodeColor={n => {
                  if (n.data?.hasError) return '#ef4444';
                  if (n.data?.status === 'running') return '#10b981';
                  return '#94a3b8';
                }}
              />
            )}
            
            {/* Section-specific overlays */}
            {selectedNode && (
              <div className="absolute" style={{ 
                left: selectedNode.position.x + (selectedNode.width || 150),
                top: selectedNode.position.y
              }}>
                <SelectedNodeOverlay node={selectedNode} />
              </div>
            )}
            
            {/* Floating status panel for operations */}
            {section === 'operations' && (
              <Panel position="top-center">
                <div className="bg-background/95 backdrop-blur border rounded-lg px-4 py-2 shadow-lg">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold">Pipeline Status</span>
                    <Badge variant="destructive">1 Issue</Badge>
                    <Button size="sm" variant="outline" className="h-7">
                      View Details
                    </Button>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
        
        {/* Conditional right panel */}
        <AnimatePresence>
          {config.showRightPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: config.rightPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l bg-muted/30 overflow-hidden"
            >
              {section === 'operations' && <LogsPanel />}
              {section === 'monitor' && <AlertsPanel />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Section-aware bottom bar */}
      <SectionAwareBottomBar 
        section={section}
        nodes={nodes}
        onAction={handleAction}
        status={mockStatus}
      />
    </div>
  );
}