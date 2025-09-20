'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Node } from 'reactflow';
import { 
  Play,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  MoreHorizontal,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
  Activity,
  AlertCircle
} from 'lucide-react';

interface NodeData {
  label: string;
  description?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  metrics?: {
    throughput?: string;
    latency?: string;
    errors?: number;
    cost?: string;
  };
}

interface ContextualBottomBarProps {
  selectedNodes: Node<NodeData>[];
  totalNodes: number;
  onRun: () => void;
  onSave: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onOpenCommandPalette: () => void;
  isRunning?: boolean;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

interface MetricProps {
  label: string;
  value: string;
  trend?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
}

const Metric = ({ label, value, trend, status, icon }: MetricProps) => {
  const statusColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600', 
    error: 'text-red-600',
    info: 'text-blue-600'
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-md">
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-slate-600">{label}</span>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-medium ${status ? statusColors[status] : 'text-slate-900'}`}>
            {value}
          </span>
          {trend && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {trend}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export function ContextualBottomBar({
  selectedNodes,
  totalNodes,
  onRun,
  onSave,
  onZoomIn,
  onZoomOut,
  onFitView,
  onOpenCommandPalette,
  isRunning = false,
  isSaving = false,
  hasUnsavedChanges = false
}: ContextualBottomBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  
  // Context-aware run button text
  const runButtonText = useMemo(() => {
    if (selectedNodes.length > 1) {
      return `Run Selected (${selectedNodes.length})`;
    } else if (selectedNode) {
      return `Run ${selectedNode.data.label}`;
    } else {
      return 'Run Full Pipeline';
    }
  }, [selectedNodes, selectedNode]);

  // Pipeline-level metrics (when no selection)
  const pipelineMetrics = useMemo(() => [
    { 
      label: 'Total Nodes', 
      value: totalNodes.toString(), 
      icon: <Activity className="h-3 w-3" />
    },
    { 
      label: 'Est. Runtime', 
      value: '3.4min', 
      icon: <Clock className="h-3 w-3" />
    },
    { 
      label: 'Dependencies', 
      value: 'Valid', 
      status: 'success' as const,
      icon: <CheckCircle className="h-3 w-3" />
    }
  ], [totalNodes]);

  // Node-specific metrics (when single node selected)
  const nodeMetrics = useMemo(() => {
    if (!selectedNode?.data.metrics) return [];
    
    const metrics = [];
    const data = selectedNode.data.metrics;
    
    if (data.throughput) {
      metrics.push({
        label: 'Records/sec',
        value: data.throughput,
        trend: '+5%',
        icon: <TrendingUp className="h-3 w-3" />
      });
    }
    
    if (data.latency) {
      metrics.push({
        label: 'Runtime',
        value: data.latency,
        status: 'success' as const,
        icon: <Clock className="h-3 w-3" />
      });
    }
    
    if (data.cost) {
      metrics.push({
        label: 'Cost',
        value: data.cost,
        icon: <DollarSign className="h-3 w-3" />
      });
    }
    
    if (data.errors !== undefined) {
      metrics.push({
        label: 'Errors',
        value: data.errors.toString(),
        status: data.errors > 0 ? 'error' as const : 'success' as const,
        icon: data.errors > 0 ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />
      });
    }
    
    return metrics;
  }, [selectedNode]);

  // Multi-selection metrics
  const multiSelectionMetrics = useMemo(() => {
    if (selectedNodes.length <= 1) return [];
    
    const runningCount = selectedNodes.filter(n => n.data.status === 'running').length;
    const errorCount = selectedNodes.filter(n => n.data.status === 'error').length;
    
    return [
      {
        label: 'Selected',
        value: selectedNodes.length.toString(),
        icon: <Activity className="h-3 w-3" />
      },
      {
        label: 'Status',
        value: errorCount > 0 ? 'Has Errors' : runningCount > 0 ? 'Running' : 'Ready',
        status: errorCount > 0 ? 'error' as const : runningCount > 0 ? 'info' as const : 'success' as const,
        icon: errorCount > 0 ? <AlertCircle className="h-3 w-3" /> : 
              runningCount > 0 ? <RefreshCw className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />
      }
    ];
  }, [selectedNodes]);

  const currentMetrics = selectedNodes.length > 1 ? multiSelectionMetrics : 
                       selectedNode ? nodeMetrics : 
                       pipelineMetrics;

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isHovered ? 1.02 : 1
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.2 }}
    >
      <Card className="shadow-lg border backdrop-blur-sm bg-background/95 overflow-hidden">
        <div className="flex items-center">
          {/* LEFT: Primary Actions */}
          <div className="flex items-center gap-2 px-4 py-3">
            <Button 
              size="sm" 
              variant="default"
              onClick={onRun}
              disabled={isRunning}
              className="gap-2 font-normal"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <AnimatePresence mode="wait">
                <motion.span
                  key={runButtonText}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                >
                  {runButtonText}
                </motion.span>
              </AnimatePresence>
            </Button>
            
            <Button 
              size="sm" 
              variant={hasUnsavedChanges ? "outline" : "ghost"}
              onClick={onSave}
              disabled={isSaving}
              className="gap-2 font-normal relative"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
              {hasUnsavedChanges && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* CENTER: Context Indicators */}
          <div className="flex items-center gap-3 px-4 py-3 min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedNodes.length}-${selectedNode?.id || 'none'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 overflow-x-auto"
              >
                {currentMetrics.map((metric, index) => (
                  <Metric key={`${metric.label}-${index}`} {...metric} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <Separator orientation="vertical" className="h-8" />
          
          {/* RIGHT: View Controls */}
          <div className="flex items-center gap-1 px-4 py-3">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onZoomIn}
              title="Zoom In (⌘+)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onZoomOut}
              title="Zoom Out (⌘-)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onFitView}
              title="Fit View (⌘0)"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onOpenCommandPalette}
              title="More Options (⌘K)"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}