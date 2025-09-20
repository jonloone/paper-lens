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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
  Lightbulb,
  Plus,
  Library,
  Wand,
  File,
  GitMerge,
  TestTube,
  Check,
  MoreVertical,
  Circle,
  Timer
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import 'reactflow/dist/style.css';

type StudioMode = 'build' | 'operate' | 'optimize' | 'monitor';
export type { StudioMode };

interface Pattern {
  id: string;
  name: string;
  description: string;
  category: 'etl' | 'streaming' | 'ml' | 'quality';
  useCount: number;
  successRate: number;
  lastUsed: Date;
  preview: string;
}

interface RecentPipeline {
  id: string;
  name: string;
  lastModified: Date;
  status: 'running' | 'failed' | 'paused' | 'draft';
  owner: string;
}

interface Issue {
  id: string;
  nodeId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedFix?: string;
}

interface Optimization {
  id: string;
  nodeId: string;
  type: 'performance' | 'cost' | 'resource';
  description: string;
  impact: string;
  confidence: number;
  estimatedSavings?: string;
}

// Quick Start Components
const QuickStartView = ({ onAction }: { onAction: (action: string, data?: any) => void }) => {
  const popularPatterns: Pattern[] = [
    {
      id: 'daily-etl',
      name: 'Daily ETL',
      description: 'Standard extract, transform, load pattern',
      category: 'etl',
      useCount: 124,
      successRate: 96,
      lastUsed: new Date(Date.now() - 86400000),
      preview: 'Source → Transform → Validate → Load'
    },
    {
      id: 'stream-processing',
      name: 'Stream Processing',
      description: 'Real-time event processing',
      category: 'streaming',
      useCount: 89,
      successRate: 91,
      lastUsed: new Date(Date.now() - 3600000),
      preview: 'Kafka → Transform → Sink'
    },
    {
      id: 'quality-check',
      name: 'Data Quality Pipeline',
      description: 'Automated validation with alerts',
      category: 'quality',
      useCount: 156,
      successRate: 98,
      lastUsed: new Date(Date.now() - 7200000),
      preview: 'Source → Validate → Alert → Store'
    }
  ];

  const recentPipelines: RecentPipeline[] = [
    {
      id: '1',
      name: 'customer_etl',
      lastModified: new Date(Date.now() - 3600000),
      status: 'running',
      owner: 'You'
    },
    {
      id: '2',
      name: 'inventory_sync',
      lastModified: new Date(Date.now() - 7200000),
      status: 'draft',
      owner: 'You'
    }
  ];

  return (
    <div className="h-full flex">
      {/* Left Panel: Quick Actions */}
      <div className="w-80 border-r p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-3">Start Building</h3>
          <div className="space-y-2">
            <QuickAction
              icon={<FileText className="h-4 w-4" />}
              title="From Pattern"
              description="Start with proven patterns"
              onClick={() => onAction('open-patterns')}
              badge="Recommended"
            />
            <QuickAction
              icon={<Database className="h-4 w-4" />}
              title="From Data Source"
              description="Connect and explore data"
              onClick={() => onAction('open-catalog')}
            />
            <QuickAction
              icon={<Wand className="h-4 w-4" />}
              title="AI Assistant"
              description="Describe what you need"
              onClick={() => onAction('open-ai')}
            />
            <QuickAction
              icon={<File className="h-4 w-4" />}
              title="Blank Pipeline"
              description="Start from scratch"
              onClick={() => onAction('create-blank')}
            />
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-sm font-medium mb-3">Recent Pipelines</h3>
          <div className="space-y-1">
            {recentPipelines.map(pipeline => (
              <RecentPipelineCard
                key={pipeline.id}
                pipeline={pipeline}
                onClick={() => onAction('load-pipeline', pipeline)}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Center: Pattern Gallery */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Popular Patterns</h2>
          <p className="text-sm text-muted-foreground">
            Start with battle-tested patterns used by your team
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {popularPatterns.map(pattern => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onClick={() => onAction('load-pattern', pattern)}
            />
          ))}
        </div>
      </div>
      
      {/* Right: Contextual Help */}
      <div className="w-80 border-l p-6">
        <GettingStartedGuide />
      </div>
    </div>
  );
};

const QuickAction = ({ 
  icon, 
  title, 
  description, 
  onClick, 
  badge 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
}) => (
  <div
    className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
    onClick={onClick}
  >
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  </div>
);

const PatternCard = ({ 
  pattern, 
  onClick 
}: { 
  pattern: Pattern; 
  onClick: () => void;
}) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base">{pattern.name}</CardTitle>
        <Badge variant="outline" className="text-xs">
          {pattern.category}
        </Badge>
      </div>
      <CardDescription className="text-xs">{pattern.description}</CardDescription>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="text-xs text-muted-foreground mb-3 font-mono">
        {pattern.preview}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{pattern.useCount} uses</span>
        <span>{pattern.successRate}% success</span>
      </div>
    </CardContent>
  </Card>
);

const RecentPipelineCard = ({ 
  pipeline, 
  onClick 
}: { 
  pipeline: RecentPipeline; 
  onClick: () => void;
}) => (
  <div
    className="p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="font-mono text-sm">{pipeline.name}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(pipeline.lastModified).toLocaleDateString()}
        </p>
      </div>
      <Badge variant={pipeline.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">
        {pipeline.status}
      </Badge>
    </div>
  </div>
);

const GettingStartedGuide = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Getting Started</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm">
      <div className="flex items-start gap-2">
        <Circle className="h-2 w-2 fill-green-500 mt-2" />
        <div>
          <p className="font-medium">Choose a starting point</p>
          <p className="text-xs text-muted-foreground">Patterns are fastest for common workflows</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Circle className="h-2 w-2 fill-gray-300 mt-2" />
        <div>
          <p className="font-medium">Configure your nodes</p>
          <p className="text-xs text-muted-foreground">Click any node to configure connections and transforms</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Circle className="h-2 w-2 fill-gray-300 mt-2" />
        <div>
          <p className="font-medium">Test and deploy</p>
          <p className="text-xs text-muted-foreground">Validate with sample data before production</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Improved Mode Bar
const ImprovedModeBar = ({ 
  currentMode, 
  onModeChange, 
  pipelineName = 'New Pipeline',
  issueCount = 0,
  hasOptimizations = false,
  onAction
}: {
  currentMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  pipelineName?: string;
  issueCount?: number;
  hasOptimizations?: boolean;
  onAction: (action: string) => void;
}) => {
  return (
    <div className="h-14 border-b bg-background">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Pipeline Identity & Status */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-medium">{pipelineName}</h2>
              <Badge variant="outline">v2.3</Badge>
              <div className="flex items-center gap-1">
                <Circle className="h-2 w-2 fill-green-500" />
                <span className="text-xs text-muted-foreground">Healthy</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Last run: 2 hours ago • Next: in 4 hours
            </p>
          </div>
        </div>
        
        {/* Center: Mode Switcher with Context */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <ModeTab
            mode="build"
            icon={<Hammer className="h-4 w-4" />}
            label="Build"
            isActive={currentMode === 'build'}
            onClick={() => onModeChange('build')}
          />
          <ModeTab
            mode="operate"
            icon={<Wrench className="h-4 w-4" />}
            label="Operate"
            isActive={currentMode === 'operate'}
            onClick={() => onModeChange('operate')}
            indicator={issueCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                {issueCount}
              </Badge>
            )}
          />
          <ModeTab
            mode="optimize"
            icon={<Zap className="h-4 w-4" />}
            label="Optimize"
            isActive={currentMode === 'optimize'}
            onClick={() => onModeChange('optimize')}
            indicator={hasOptimizations && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                +23%
              </Badge>
            )}
          />
          <ModeTab
            mode="monitor"
            icon={<Activity className="h-4 w-4" />}
            label="Monitor"
            isActive={currentMode === 'monitor'}
            onClick={() => onModeChange('monitor')}
          />
        </div>
        
        {/* Right: Primary Actions for Current Mode */}
        <div className="flex items-center gap-2">
          {currentMode === 'build' && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onAction('add-source')}>
                    <Database className="h-4 w-4 mr-2" />
                    Data Source
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction('add-transform')}>
                    <GitMerge className="h-4 w-4 mr-2" />
                    Transform
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction('add-sink')}>
                    <Download className="h-4 w-4 mr-2" />
                    Sink
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAction('open-patterns')}>
                    <Library className="h-4 w-4 mr-2" />
                    From Pattern
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => onAction('open-patterns')}>
                <Library className="h-4 w-4 mr-1" />
                Patterns
              </Button>
            </>
          )}
          {currentMode === 'operate' && issueCount > 0 && (
            <Button variant="destructive" size="sm" onClick={() => onAction('fix-issues')}>
              <AlertCircle className="h-4 w-4 mr-1" />
              Fix Issues ({issueCount})
            </Button>
          )}
          {currentMode === 'optimize' && (
            <Button variant="default" size="sm" onClick={() => onAction('auto-optimize')}>
              <Sparkles className="h-4 w-4 mr-1" />
              Auto-Optimize
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ModeTab = ({ 
  mode, 
  icon, 
  label, 
  isActive, 
  onClick, 
  indicator 
}: {
  mode: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  indicator?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
      isActive 
        ? "bg-background text-foreground shadow-sm" 
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    {icon}
    <span>{label}</span>
    {indicator}
  </button>
);

// Build Mode Components
const BuildMode = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onAction 
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  onAction: (action: string, data?: any) => void;
}) => {
  const [showPatternLibrary, setShowPatternLibrary] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="h-full flex">
      {/* Collapsible Pattern Library */}
      <AnimatePresence>
        {showPatternLibrary && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r overflow-hidden"
          >
            <PatternLibrary onClose={() => setShowPatternLibrary(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow 
          nodes={nodes} 
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          connectionMode={ConnectionMode.Loose}
          fitView
        >
          <Background />
          <Controls position="bottom-left" />
          
          {/* Floating Add Button */}
          <div className="absolute top-4 left-4 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onAction('add-source')}>
                  <Database className="h-4 w-4 mr-2" />
                  Data Source
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('add-transform')}>
                  <GitMerge className="h-4 w-4 mr-2" />
                  Transform
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('add-sink')}>
                  <Download className="h-4 w-4 mr-2" />
                  Sink
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowPatternLibrary(true)}>
                  <Library className="h-4 w-4 mr-2" />
                  From Pattern
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Build Controls */}
          <Panel position="bottom-center">
            <Card className="p-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onAction('validate')}>
                  <Check className="h-4 w-4 mr-1" />
                  Validate
                </Button>
                <Button size="sm" variant="outline" onClick={() => onAction('test')}>
                  <TestTube className="h-4 w-4 mr-1" />
                  Test
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <ResourceIndicator nodes={nodes} />
              </div>
            </Card>
          </Panel>
        </ReactFlow>
      </div>
      
      {/* Context Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 384, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l"
          >
            <NodeConfiguration
              node={selectedNode}
              onUpdate={(updates) => onAction('update-node', { id: selectedNode.id, updates })}
              onDelete={() => onAction('delete-node', selectedNode.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Components
const PatternLibrary = ({ onClose }: { onClose: () => void }) => (
  <div className="h-full p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-medium">Pattern Library</h3>
      <Button variant="ghost" size="sm" onClick={onClose}>
        ×
      </Button>
    </div>
    <div className="space-y-2">
      {/* Pattern items would go here */}
      <p className="text-sm text-muted-foreground">Pattern library content...</p>
    </div>
  </div>
);

const ResourceIndicator = ({ nodes }: { nodes: Node[] }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-muted-foreground">Resources:</span>
    <Badge variant="outline" className="text-xs">
      Medium
    </Badge>
    <span className="text-muted-foreground">•</span>
    <span className="text-muted-foreground">
      {nodes.length} nodes
    </span>
  </div>
);

const NodeConfiguration = ({ 
  node, 
  onUpdate, 
  onDelete 
}: {
  node: Node;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}) => (
  <div className="h-full p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-medium">Configure Node</h3>
      <Button variant="ghost" size="sm" onClick={onDelete}>
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <input 
          className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
          value={node.data?.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </div>
      {/* More configuration options would go here */}
    </div>
  </div>
);

// Main Studio Component
interface ImprovedStudioProps {
  initialMode?: StudioMode;
  pipelineId?: string;
  pipelineName?: string;
  onModeChange?: (mode: StudioMode) => void;
}

export function ImprovedStudio({ 
  initialMode = 'build',
  pipelineId,
  pipelineName = 'New Pipeline',
  onModeChange: onModeChangeProp
}: ImprovedStudioProps) {
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hasActivePipeline, setHasActivePipeline] = useState(!!pipelineId);
  const [issues] = useState<Issue[]>([
    { id: '1', nodeId: '1', severity: 'critical', description: 'Connection failed' }
  ]);
  const [optimizations] = useState<Optimization[]>([
    { 
      id: '1', 
      nodeId: '1', 
      type: 'performance', 
      description: 'Add index to improve query performance',
      impact: '+45% faster',
      confidence: 89
    }
  ]);

  const handleModeChange = (newMode: StudioMode) => {
    setMode(newMode);
    onModeChangeProp?.(newMode);
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAction = (action: string, data?: any) => {
    console.log('Action:', action, data);
    
    switch (action) {
      case 'create-blank':
      case 'load-pattern':
      case 'load-pipeline':
        setHasActivePipeline(true);
        // Would load actual pipeline data
        break;
      
      case 'add-source':
        const sourceNode: Node = {
          id: `source-${Date.now()}`,
          type: 'default',
          position: { x: 100, y: 100 },
          data: { label: 'Data Source', type: 'source' }
        };
        setNodes((nds) => [...nds, sourceNode]);
        break;
        
      case 'add-transform':
        const transformNode: Node = {
          id: `transform-${Date.now()}`,
          type: 'default',
          position: { x: 300, y: 100 },
          data: { label: 'Transform', type: 'transform' }
        };
        setNodes((nds) => [...nds, transformNode]);
        break;
        
      case 'add-sink':
        const sinkNode: Node = {
          id: `sink-${Date.now()}`,
          type: 'default',
          position: { x: 500, y: 100 },
          data: { label: 'Sink', type: 'sink' }
        };
        setNodes((nds) => [...nds, sinkNode]);
        break;
    }
  };

  // Show Quick Start if no active pipeline and in build mode
  if (!hasActivePipeline && mode === 'build') {
    return (
      <div className="flex flex-col h-full">
        <ImprovedModeBar
          currentMode={mode}
          onModeChange={handleModeChange}
          pipelineName="Select a pipeline to begin"
          onAction={handleAction}
        />
        <div className="flex-1">
          <QuickStartView onAction={handleAction} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Improved Mode Bar */}
      <ImprovedModeBar
        currentMode={mode}
        onModeChange={handleModeChange}
        pipelineName={pipelineName}
        issueCount={issues.length}
        hasOptimizations={optimizations.length > 0}
        onAction={handleAction}
      />
      
      {/* Main Studio Content */}
      <div className="flex-1">
        {mode === 'build' && (
          <BuildMode
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onAction={handleAction}
          />
        )}
        
        {mode === 'operate' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Operate Mode</h3>
              <p className="text-muted-foreground">
                Issue detection and debugging interface coming soon
              </p>
            </div>
          </div>
        )}
        
        {mode === 'optimize' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Optimize Mode</h3>
              <p className="text-muted-foreground">
                AI-powered optimization recommendations coming soon
              </p>
            </div>
          </div>
        )}
        
        {mode === 'monitor' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Monitor Mode</h3>
              <p className="text-muted-foreground">
                Real-time monitoring and metrics coming soon
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export wrapped with ReactFlowProvider
export default function ImprovedStudioWrapper(props: ImprovedStudioProps) {
  return (
    <ReactFlowProvider>
      <ImprovedStudio {...props} />
    </ReactFlowProvider>
  );
}