'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Play,
  Settings2,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  Zap,
  Users,
  FileText,
  GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResourceBadge, calculateResourceIntensity } from './ResourceIndicator';
import { Sparkline } from '@/components/ui/sparkline';

interface MetricTileProps {
  label: string;
  value: React.ReactNode;
  trend?: string;
  status?: 'healthy' | 'warning' | 'critical';
  sparkline?: number[];
  subtext?: string;
}

function MetricTile({ label, value, trend, status, sparkline, subtext }: MetricTileProps) {
  const statusColors = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };
  
  return (
    <div className="p-2 bg-muted/30 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-semibold", status && statusColors[status])}>
          {value}
        </span>
        {trend && (
          <span className={cn("text-xs", trend.startsWith('+') ? 'text-green-600' : 'text-red-600')}>
            {trend}
          </span>
        )}
      </div>
      {sparkline && (
        <div className="mt-1 h-4">
          <Sparkline data={sparkline} />
        </div>
      )}
      {subtext && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
      )}
    </div>
  );
}

function getRecencyStatus(timeAgo: string): 'healthy' | 'warning' | 'critical' {
  const value = parseInt(timeAgo);
  const unit = timeAgo.replace(/[0-9]/g, '').trim();
  
  if (unit.startsWith('min') || unit.startsWith('h')) {
    if (value < 2 || (unit.startsWith('min') && value < 120)) return 'healthy';
    if (value < 24) return 'warning';
  }
  return 'critical';
}

interface SelectedNodeOverlayProps {
  node: any;
  onClose?: () => void;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

export function SelectedNodeOverlay({ 
  node, 
  onClose,
  position = 'right' 
}: SelectedNodeOverlayProps) {
  const resourceIntensity = calculateResourceIntensity(node);
  
  // Mock data for demonstration
  const mockSparkline = [40, 45, 38, 52, 48, 61, 55, 58, 62, 59, 65, 68];
  const throughput = '1.2k';
  const successRate = 99.9;
  const lastRun = '2h ago';
  const inputRecords = 1200000;
  const outputRecords = 980000;
  
  const positionStyles = {
    right: 'left-full ml-4',
    left: 'right-full mr-4',
    top: 'bottom-full mb-4',
    bottom: 'top-full mt-4'
  };
  
  return (
    <>
      {/* Selection ring animation */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="relative w-full h-full"
          initial={false}
          animate={{}}
        >
          <motion.div
            className="absolute inset-0 border-2 border-primary rounded-lg"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute inset-0 border border-primary/50 rounded-lg"
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
          />
        </motion.div>
      </div>

      {/* Floating context panel */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn("absolute -top-2 z-50", positionStyles[position])}
        >
          <Card className="w-80 shadow-xl border-primary/20 bg-background/95 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-sm font-semibold">
                    {node.data.businessName || node.data.label}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {node.data.technicalId || `${node.type} • ${node.id}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={node.data.status === 'running' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {node.data.status || 'Ready'}
                  </Badge>
                  {node.data.status === 'running' && (
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Quick metrics grid */}
              <div className="grid grid-cols-2 gap-2">
                <MetricTile
                  label="Throughput"
                  value={`${throughput}/s`}
                  trend="+5%"
                  sparkline={mockSparkline}
                />
                <MetricTile
                  label="Success"
                  value={`${successRate}%`}
                  status="healthy"
                />
                <MetricTile
                  label="Resource"
                  value={<ResourceBadge level={resourceIntensity.level} showIcon />}
                  subtext={resourceIntensity.estimatedTime}
                />
                <MetricTile
                  label="Last Run"
                  value={lastRun}
                  status={getRecencyStatus(lastRun)}
                />
              </div>

              {/* Data flow summary */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data Flow</Label>
                <div className="space-y-1.5 p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2 text-xs">
                    <ArrowDown className="h-3 w-3 text-blue-500" />
                    <span className="text-muted-foreground">Input:</span>
                    <span className="font-mono">{inputRecords.toLocaleString()} records</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <ArrowRight className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">Output:</span>
                    <span className="font-mono">{outputRecords.toLocaleString()} records</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span className="text-muted-foreground">Reduction:</span>
                    <span className="font-mono">
                      {((1 - outputRecords / inputRecords) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Node-specific details */}
              {node.type === 'source' && node.data.connection && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Connection Details</Label>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">System:</span>
                      <span className="font-mono">{node.data.connection.system}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Table:</span>
                      <span className="font-mono truncate ml-2" title={node.data.connection.table}>
                        {node.data.connection.table}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {node.type === 'transform' && node.data.operations && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Operations</Label>
                  <div className="flex flex-wrap gap-1">
                    {node.data.operations.map((op: string) => (
                      <Badge key={op} variant="secondary" className="text-xs">
                        {op}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance indicator */}
              {node.data.performance && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Performance</span>
                    <span className={cn(
                      "font-medium",
                      node.data.performance > 90 ? "text-green-600" :
                      node.data.performance > 70 ? "text-yellow-600" :
                      "text-red-600"
                    )}>
                      {node.data.performance}%
                    </span>
                  </div>
                  <Progress value={node.data.performance} className="h-1.5" />
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-1 pt-2 border-t">
                <Button size="sm" variant="ghost" className="flex-1 h-8">
                  <Play className="h-3 w-3 mr-1" />
                  Test
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 h-8">
                  <Settings2 className="h-3 w-3 mr-1" />
                  Config
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 h-8">
                  <Activity className="h-3 w-3 mr-1" />
                  Metrics
                </Button>
              </div>

              {/* Warnings or recommendations */}
              {(node.data.warnings || resourceIntensity.warning) && (
                <Alert className="py-2">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs ml-1">
                    {node.data.warnings?.[0] || resourceIntensity.warning}
                  </AlertDescription>
                </Alert>
              )}

              {/* Dependencies indicator */}
              {node.data.dependencies && (
                <div className="flex items-center justify-between text-xs pt-2 border-t">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GitBranch className="h-3 w-3" />
                    <span>Dependencies:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 flex items-center gap-0.5">
                      <CheckCircle className="h-3 w-3" />
                      {node.data.dependencies.ready}
                    </span>
                    {node.data.dependencies.waiting > 0 && (
                      <span className="text-yellow-600 flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {node.data.dependencies.waiting}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}