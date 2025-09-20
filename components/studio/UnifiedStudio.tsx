'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Hammer,
  Wrench,
  Shield,
  Activity,
  TrendingUp,
  ChevronLeft,
  HelpCircle,
  Command,
  Play,
  Save,
  RefreshCw,
  Clock,
  Download,
  Upload,
  Settings,
  AlertCircle,
  CheckCircle,
  Zap,
  GitBranch,
  Eye,
  RotateCcw,
  FileText,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Terminal,
  History,
  Sparkles,
  XCircle,
  AlertTriangle,
  Database,
  Lightbulb
} from 'lucide-react';

import 'reactflow/dist/style.css';

export type StudioMode = 'build' | 'operate' | 'quality' | 'monitor' | 'analyze';

interface StudioModeConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  primaryColor: string;
  nodeStyles: {
    default: string;
    hover: string;
    selected: string;
    error?: string;
    warning?: string;
    success?: string;
  };
  showMiniMap: boolean;
  showBackground: boolean;
  defaultZoom: number;
}

const modeConfigs: Record<StudioMode, StudioModeConfig> = {
  build: {
    name: 'Build',
    icon: Hammer,
    description: 'Create and edit pipelines',
    primaryColor: 'blue',
    nodeStyles: {
      default: 'bg-background border-border',
      hover: 'bg-muted/50 border-primary',
      selected: 'bg-primary/10 border-primary border-2',
    },
    showMiniMap: true,
    showBackground: true,
    defaultZoom: 1,
  },
  operate: {
    name: 'Operate',
    icon: Wrench,
    description: 'Debug and fix issues',
    primaryColor: 'orange',
    nodeStyles: {
      default: 'bg-background border-border',
      hover: 'bg-muted/50 border-orange-500',
      selected: 'bg-orange-500/10 border-orange-500 border-2',
      error: 'bg-red-500/10 border-red-500 border-2',
      warning: 'bg-yellow-500/10 border-yellow-500',
      success: 'bg-green-500/10 border-green-500',
    },
    showMiniMap: false,
    showBackground: false,
    defaultZoom: 0.85,
  },
  quality: {
    name: 'Quality',
    icon: Shield,
    description: 'Monitor data quality',
    primaryColor: 'purple',
    nodeStyles: {
      default: 'bg-background border-border',
      hover: 'bg-muted/50 border-purple-500',
      selected: 'bg-purple-500/10 border-purple-500 border-2',
      error: 'bg-red-500/10 border-red-500',
      warning: 'bg-yellow-500/10 border-yellow-500',
      success: 'bg-green-500/10 border-green-500',
    },
    showMiniMap: true,
    showBackground: true,
    defaultZoom: 0.9,
  },
  monitor: {
    name: 'Monitor',
    icon: Activity,
    description: 'Real-time metrics',
    primaryColor: 'green',
    nodeStyles: {
      default: 'bg-background border-border',
      hover: 'bg-muted/50 border-green-500',
      selected: 'bg-green-500/10 border-green-500 border-2',
    },
    showMiniMap: true,
    showBackground: true,
    defaultZoom: 0.7,
  },
  analyze: {
    name: 'Analyze',
    icon: TrendingUp,
    description: 'Patterns and insights',
    primaryColor: 'yellow',
    nodeStyles: {
      default: 'bg-background border-border',
      hover: 'bg-muted/50 border-yellow-500',
      selected: 'bg-yellow-500/10 border-yellow-500 border-2',
    },
    showMiniMap: false,
    showBackground: true,
    defaultZoom: 0.8,
  },
};

// Mode-aware node component
const UnifiedNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const mode = data.mode || 'build';
  const config = modeConfigs[mode as StudioMode];
  
  // Determine node state
  let nodeState = 'default';
  if (selected) nodeState = 'selected';
  else if (data.hasError && config.nodeStyles.error) nodeState = 'error';
  else if (data.hasWarning && config.nodeStyles.warning) nodeState = 'warning';
  else if (data.isRunning && config.nodeStyles.success) nodeState = 'success';
  
  const baseClasses = "rounded-lg border-2 transition-all duration-200 min-w-[180px]";
  const stateClasses = config.nodeStyles[nodeState as keyof typeof config.nodeStyles] || config.nodeStyles.default;
  
  return (
    <div className={cn(baseClasses, stateClasses)}>
      <div className="p-3">
        {/* Mode-specific header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {data.icon && <data.icon className="h-4 w-4 text-muted-foreground" />}
            <span className="font-medium text-sm">{data.label}</span>
          </div>
          {mode === 'operate' && data.status && (
            <StatusIndicator status={data.status} />
          )}
        </div>
        
        {/* Mode-specific content */}
        {mode === 'build' && (
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Type: {data.type || 'transform'}</div>
            {data.resourceLevel && (
              <div className="flex items-center gap-1">
                Resources: <ResourceBadge level={data.resourceLevel} />
              </div>
            )}
          </div>
        )}
        
        {mode === 'operate' && data.error && (
          <Alert className="mt-2 p-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {data.error}
            </AlertDescription>
          </Alert>
        )}
        
        {mode === 'quality' && data.qualityScore !== undefined && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs">
              <span>Quality</span>
              <span className={cn(
                "font-medium",
                data.qualityScore >= 90 ? "text-green-600" :
                data.qualityScore >= 70 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {data.qualityScore}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div 
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  data.qualityScore >= 90 ? "bg-green-500" :
                  data.qualityScore >= 70 ? "bg-yellow-500" :
                  "bg-red-500"
                )}
                style={{ width: `${data.qualityScore}%` }}
              />
            </div>
          </div>
        )}
        
        {mode === 'monitor' && data.metrics && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Rate:</span>
              <span className="ml-1 font-medium">{data.metrics.rate}/s</span>
            </div>
            <div>
              <span className="text-muted-foreground">Latency:</span>
              <span className="ml-1 font-medium">{data.metrics.latency}ms</span>
            </div>
          </div>
        )}
        
        {mode === 'analyze' && data.patterns && (
          <div className="mt-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-yellow-600">
              {data.patterns.length} patterns detected
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components
const StatusIndicator = ({ status }: { status: string }) => {
  const icons = {
    running: <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    idle: <div className="h-2 w-2 rounded-full bg-gray-400" />,
  };
  
  return icons[status as keyof typeof icons] || icons.idle;
};

const ResourceBadge = ({ level }: { level: string }) => {
  const colors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  
  return (
    <Badge variant="outline" className={cn("text-xs px-1 py-0", colors[level as keyof typeof colors])}>
      {level}
    </Badge>
  );
};

// Mode bar component
interface ModeBarProps {
  currentMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  pipelineName?: string;
  issueCount?: number;
  qualityScore?: number;
}

const ModeBar = ({ 
  currentMode, 
  onModeChange, 
  pipelineName = 'New Pipeline',
  issueCount = 0,
  qualityScore = 95
}: ModeBarProps) => {
  return (
    <div className="h-12 border-b bg-background/95 backdrop-blur px-4">
      <div className="h-full flex items-center justify-between">
        {/* Left: Pipeline name and navigation */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-medium">{pipelineName}</h2>
        </div>
        
        {/* Center: Mode switcher */}
        <div className="flex items-center">
          <div className="inline-flex items-center rounded-lg bg-muted p-1">
            {Object.entries(modeConfigs).map(([mode, config]) => {
              const Icon = config.icon;
              const isActive = currentMode === mode;
              
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode as StudioMode)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{config.name}</span>
                  {mode === 'operate' && issueCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                      {issueCount}
                    </Badge>
                  )}
                  {mode === 'quality' && (
                    <span className={cn(
                      "ml-1 text-xs font-normal",
                      qualityScore >= 90 ? "text-green-600" :
                      qualityScore >= 70 ? "text-yellow-600" :
                      "text-red-600"
                    )}>
                      {qualityScore}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Command className="h-4 w-4" />
            <span className="ml-1 text-xs text-muted-foreground">⌘K</span>
          </Button>
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Mode-specific context bars
const BuildContextBar = ({ onAction }: { onAction: (action: string) => void }) => (
  <>
    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" onClick={() => onAction('run')}>
        <Play className="h-4 w-4 mr-1" />
        Run
      </Button>
      <Button variant="outline" size="sm" onClick={() => onAction('save')}>
        <Save className="h-4 w-4 mr-1" />
        Save
      </Button>
      <Button variant="outline" size="sm" onClick={() => onAction('validate')}>
        <CheckCircle className="h-4 w-4 mr-1" />
        Validate
      </Button>
    </div>
    
    <div className="flex items-center gap-4 text-sm">
      <span className="text-muted-foreground">
        Nodes: <span className="font-medium text-foreground">12</span>
      </span>
      <span className="text-muted-foreground">•</span>
      <span className="text-muted-foreground">
        Resources: <ResourceBadge level="medium" />
      </span>
    </div>
    
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm">
        <Upload className="h-4 w-4 mr-1" />
        Import
      </Button>
      <Button variant="ghost" size="sm">
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
    </div>
  </>
);

const OperateContextBar = ({ onAction }: { onAction: (action: string) => void }) => (
  <>
    <div className="flex items-center gap-2">
      <Button variant="destructive" size="sm" onClick={() => onAction('fix-all')}>
        <AlertCircle className="h-4 w-4 mr-1" />
        Fix All Issues
      </Button>
      <Button variant="outline" size="sm" onClick={() => onAction('restart')}>
        <RotateCcw className="h-4 w-4 mr-1" />
        Restart Failed
      </Button>
    </div>
    
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-muted-foreground">Running:</span>
        <span className="font-medium">3</span>
      </span>
      <span className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-muted-foreground">Failed:</span>
        <span className="font-medium text-destructive">1</span>
      </span>
    </div>
    
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => onAction('logs')}>
        <Terminal className="h-4 w-4 mr-1" />
        Logs
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onAction('history')}>
        <History className="h-4 w-4 mr-1" />
        History
      </Button>
    </div>
  </>
);

const ModeContextBar = ({ mode, onAction }: { mode: StudioMode; onAction: (action: string) => void }) => {
  return (
    <motion.div
      key={mode}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-14 border-t bg-background/95 backdrop-blur"
    >
      <div className="h-full px-4 flex items-center justify-between">
        {mode === 'build' && <BuildContextBar onAction={onAction} />}
        {mode === 'operate' && <OperateContextBar onAction={onAction} />}
        {/* Add other mode context bars as needed */}
      </div>
    </motion.div>
  );
};

// Main UnifiedStudio component
interface UnifiedStudioProps {
  initialMode?: StudioMode;
  pipelineId?: string;
  pipelineName?: string;
  onModeChange?: (mode: StudioMode) => void;
}

export function UnifiedStudio({ 
  initialMode = 'build',
  pipelineId,
  pipelineName = 'New Pipeline',
  onModeChange: onModeChangeProp
}: UnifiedStudioProps) {
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const config = modeConfigs[mode];
  const nodeTypes = useMemo(() => ({ unified: UnifiedNode }), []);
  
  // Update nodes when mode changes
  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          mode,
        },
      }))
    );
  }, [mode, setNodes]);
  
  // Load initial data based on pipeline
  useEffect(() => {
    if (pipelineId) {
      // Load pipeline data
      // For demo, create sample nodes
      const sampleNodes: Node[] = [
        {
          id: '1',
          type: 'unified',
          position: { x: 100, y: 100 },
          data: { 
            label: 'Source: Customer DB',
            type: 'source',
            icon: Database,
            resourceLevel: 'low',
            mode,
            status: 'running',
            qualityScore: 95,
            metrics: { rate: 1200, latency: 45 }
          },
        },
        {
          id: '2',
          type: 'unified',
          position: { x: 350, y: 100 },
          data: { 
            label: 'Transform: Enrich',
            type: 'transform',
            resourceLevel: 'medium',
            mode,
            status: 'running',
            qualityScore: 88,
            metrics: { rate: 1150, latency: 120 }
          },
        },
        {
          id: '3',
          type: 'unified',
          position: { x: 600, y: 100 },
          data: { 
            label: 'Quality Check',
            type: 'quality',
            icon: Shield,
            resourceLevel: 'low',
            mode,
            status: 'failed',
            error: 'Null values detected in email field',
            hasError: true,
            qualityScore: 65,
            metrics: { rate: 800, latency: 200 }
          },
        },
        {
          id: '4',
          type: 'unified',
          position: { x: 850, y: 100 },
          data: { 
            label: 'Sink: Warehouse',
            type: 'sink',
            icon: Database,
            resourceLevel: 'high',
            mode,
            status: 'idle',
            qualityScore: 92,
            metrics: { rate: 0, latency: 0 }
          },
        },
      ];
      
      const sampleEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' },
      ];
      
      setNodes(sampleNodes);
      setEdges(sampleEdges);
    }
  }, [pipelineId, mode, setNodes, setEdges]);
  
  const handleModeChange = (newMode: StudioMode) => {
    setMode(newMode);
    onModeChangeProp?.(newMode);
  };
  
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
  
  return (
    <div className="flex flex-col h-full">
      {/* Mode switcher bar */}
      <ModeBar
        currentMode={mode}
        onModeChange={handleModeChange}
        pipelineName={pipelineName}
        issueCount={mode === 'operate' ? 1 : 0}
        qualityScore={88}
      />
      
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
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          defaultViewport={{ x: 0, y: 0, zoom: config.defaultZoom }}
          fitView
        >
          {config.showBackground && <Background />}
          <Controls position="bottom-left" />
          {config.showMiniMap && (
            <MiniMap 
              position="top-right"
              nodeColor={n => {
                if (n.data?.hasError) return '#ef4444';
                if (n.data?.status === 'running') return '#10b981';
                return '#94a3b8';
              }}
            />
          )}
          
          {/* Mode-specific overlays */}
          {mode === 'operate' && nodes.some(n => n.data?.hasError) && (
            <Panel position="top-center">
              <Alert className="bg-background/95 backdrop-blur">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  1 pipeline issue detected. Click the node to investigate.
                </AlertDescription>
              </Alert>
            </Panel>
          )}
          
          {mode === 'analyze' && (
            <Panel position="bottom-right">
              <div className="bg-background/95 backdrop-blur border rounded-lg p-3 max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-sm">Pattern Detected</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This pipeline structure matches 85% with successful patterns in your organization.
                </p>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
      
      {/* Mode-specific context bar */}
      <ModeContextBar mode={mode} onAction={handleAction} />
    </div>
  );
}

// Export wrapped with ReactFlowProvider
export default function UnifiedStudioWrapper(props: UnifiedStudioProps) {
  return (
    <ReactFlowProvider>
      <UnifiedStudio {...props} />
    </ReactFlowProvider>
  );
}