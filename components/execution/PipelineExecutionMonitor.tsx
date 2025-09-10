import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  BarChart3,
  Terminal,
  Download,
  Maximize2,
  Eye,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  PipelineExecution, 
  NodeExecution, 
  ExecutionLog, 
  ExecutionMetrics,
  HybridExecutionEngine 
} from '@/lib/services/HybridExecutionEngine';

interface PipelineExecutionMonitorProps {
  runId: string;
  executionEngine: HybridExecutionEngine;
  onCancel?: (runId: string) => void;
  onRetry?: (runId: string) => void;
  onViewLogs?: (runId: string, nodeId?: string) => void;
  onExportLogs?: (runId: string) => void;
  refreshInterval?: number;
}

export const PipelineExecutionMonitor: React.FC<PipelineExecutionMonitorProps> = ({
  runId,
  executionEngine,
  onCancel,
  onRetry,
  onViewLogs,
  onExportLogs,
  refreshInterval = 5000
}) => {
  const [execution, setExecution] = useState<PipelineExecution | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [logsLevel, setLogsLevel] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh execution data
  useEffect(() => {
    const fetchExecution = () => {
      const executionData = executionEngine.getExecutionStatus(runId);
      setExecution(executionData);
    };

    fetchExecution();

    let interval: NodeJS.Timeout;
    if (autoRefresh && execution?.status === 'running') {
      interval = setInterval(fetchExecution, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [runId, executionEngine, autoRefresh, execution?.status, refreshInterval]);

  // Calculate execution progress
  const executionProgress = useMemo(() => {
    if (!execution) return { completed: 0, total: 0, percentage: 0 };

    const nodes = Array.from(execution.nodes.values());
    const total = nodes.length;
    const completed = nodes.filter(n => 
      n.status === 'success' || n.status === 'failed' || n.status === 'skipped'
    ).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }, [execution]);

  // Get status badge
  const getStatusBadge = (status: string, className?: string) => {
    const badges = {
      pending: <Badge variant="outline" className={cn('text-gray-600', className)}>Pending</Badge>,
      running: <Badge className={cn('bg-blue-100 text-blue-800 animate-pulse', className)}>Running</Badge>,
      success: <Badge className={cn('bg-green-100 text-green-800', className)}>Success</Badge>,
      failed: <Badge className={cn('bg-red-100 text-red-800', className)}>Failed</Badge>,
      cancelled: <Badge className={cn('bg-gray-100 text-gray-800', className)}>Cancelled</Badge>,
      skipped: <Badge className={cn('bg-yellow-100 text-yellow-800', className)}>Skipped</Badge>
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  // Get status icon
  const getStatusIcon = (status: string, className = "w-4 h-4") => {
    const icons = {
      pending: <Clock className={cn('text-gray-500', className)} />,
      running: <Activity className={cn('text-blue-500 animate-pulse', className)} />,
      success: <CheckCircle className={cn('text-green-500', className)} />,
      failed: <XCircle className={cn('text-red-500', className)} />,
      cancelled: <Square className={cn('text-gray-500', className)} />,
      skipped: <AlertTriangle className={cn('text-yellow-500', className)} />
    };
    return icons[status as keyof typeof icons] || icons.pending;
  };

  // Format duration
  const formatDuration = (duration?: number) => {
    if (!duration) return '0s';
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format metrics
  const formatMetric = (value: number, unit: string) => {
    if (unit === 'bytes') {
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)}GB`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}MB`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}KB`;
      return `${value}B`;
    }
    
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  };

  // Filter logs by level
  const filterLogsByLevel = (logs: ExecutionLog[]) => {
    if (logsLevel === 'all') return logs;
    return logs.filter(log => log.level === logsLevel);
  };

  if (!execution) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-gray-500">Loading execution data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pipeline Execution</h2>
          <p className="text-gray-600">Run ID: {runId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', autoRefresh && 'animate-spin')} />
            Auto Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExportLogs?.(runId)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          {execution.status === 'running' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onCancel?.(runId)}
            >
              <Square className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          {(execution.status === 'failed' || execution.status === 'cancelled') && (
            <Button
              size="sm"
              onClick={() => onRetry?.(runId)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(execution.status)}
              <span>Execution Overview</span>
            </div>
            {getStatusBadge(execution.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-2xl font-bold">
                {executionProgress.completed}/{executionProgress.total}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Duration</div>
              <div className="text-2xl font-bold">
                {formatDuration(execution.duration || 
                  (execution.status === 'running' ? 
                    Date.now() - new Date(execution.startTime).getTime() : 0)
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Started</div>
              <div className="text-sm">
                {new Date(execution.startTime).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Triggered By</div>
              <div className="text-sm">{execution.context.triggeredBy}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(executionProgress.percentage)}%</span>
            </div>
            <Progress value={executionProgress.percentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Detailed View */}
      <Tabs defaultValue="nodes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="graph">Execution Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="space-y-4">
          <div className="grid gap-3">
            {Array.from(execution.nodes.entries()).map(([nodeId, nodeExecution]) => (
              <Card 
                key={nodeId}
                className={cn(
                  'cursor-pointer transition-all duration-200',
                  selectedNode === nodeId && 'ring-2 ring-blue-400',
                  nodeExecution.status === 'failed' && 'border-red-300 bg-red-50',
                  nodeExecution.status === 'running' && 'border-blue-300 bg-blue-50'
                )}
                onClick={() => setSelectedNode(selectedNode === nodeId ? null : nodeId)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(nodeExecution.status)}
                      <div>
                        <div className="font-medium">{nodeId}</div>
                        <div className="text-sm text-gray-500">
                          {nodeExecution.duration ? formatDuration(nodeExecution.duration) : '0s'}
                          {nodeExecution.retryCount && nodeExecution.retryCount > 0 && (
                            <span className="ml-2 text-yellow-600">
                              • {nodeExecution.retryCount} retries
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(nodeExecution.status, 'text-xs')}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewLogs?.(runId, nodeId);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Node Details */}
                  {selectedNode === nodeId && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {nodeExecution.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded">
                          <div className="text-sm font-medium text-red-800">Error</div>
                          <div className="text-sm text-red-700">{nodeExecution.error}</div>
                        </div>
                      )}

                      {nodeExecution.metrics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {nodeExecution.metrics.cpuUsage && (
                            <div className="flex items-center gap-2">
                              <Cpu className="w-4 h-4 text-blue-500" />
                              <div>
                                <div className="text-xs text-gray-500">CPU</div>
                                <div className="text-sm font-medium">
                                  {nodeExecution.metrics.cpuUsage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          )}
                          {nodeExecution.metrics.memoryUsage && (
                            <div className="flex items-center gap-2">
                              <MemoryStick className="w-4 h-4 text-green-500" />
                              <div>
                                <div className="text-xs text-gray-500">Memory</div>
                                <div className="text-sm font-medium">
                                  {formatMetric(nodeExecution.metrics.memoryUsage, 'bytes')}
                                </div>
                              </div>
                            </div>
                          )}
                          {nodeExecution.metrics.recordsProcessed && (
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-purple-500" />
                              <div>
                                <div className="text-xs text-gray-500">Records</div>
                                <div className="text-sm font-medium">
                                  {formatMetric(nodeExecution.metrics.recordsProcessed, '')}
                                </div>
                              </div>
                            </div>
                          )}
                          {nodeExecution.metrics.dataSize && (
                            <div className="flex items-center gap-2">
                              <HardDrive className="w-4 h-4 text-orange-500" />
                              <div>
                                <div className="text-xs text-gray-500">Data Size</div>
                                <div className="text-sm font-medium">
                                  {formatMetric(nodeExecution.metrics.dataSize, 'bytes')}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {nodeExecution.outputs && (
                        <div>
                          <div className="text-sm font-medium mb-2">Outputs</div>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(nodeExecution.outputs, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  <span>Execution Logs</span>
                </div>
                <Select value={logsLevel} onValueChange={(value: any) => setLogsLevel(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-auto">
                {filterLogsByLevel(execution.globalLogs).map((log, index) => (
                  <div 
                    key={index}
                    className={cn(
                      'flex items-start gap-3 p-2 rounded text-sm',
                      log.level === 'error' && 'bg-red-50 text-red-800',
                      log.level === 'warn' && 'bg-yellow-50 text-yellow-800',
                      log.level === 'info' && 'bg-blue-50 text-blue-800',
                      log.level === 'debug' && 'bg-gray-50 text-gray-800'
                    )}
                  >
                    <div className="text-xs text-gray-500 min-w-[80px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.level.toUpperCase()}
                    </Badge>
                    <div className="flex-1">{log.message}</div>
                  </div>
                ))}
                {filterLogsByLevel(execution.globalLogs).length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No logs available for selected level
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {execution.globalMetrics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {execution.globalMetrics.cpuUsage && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {execution.globalMetrics.cpuUsage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">CPU Usage</div>
                    </div>
                  )}
                  {execution.globalMetrics.memoryUsage && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatMetric(execution.globalMetrics.memoryUsage, 'bytes')}
                      </div>
                      <div className="text-sm text-gray-500">Memory Usage</div>
                    </div>
                  )}
                  {execution.globalMetrics.recordsProcessed && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatMetric(execution.globalMetrics.recordsProcessed, '')}
                      </div>
                      <div className="text-sm text-gray-500">Records Processed</div>
                    </div>
                  )}
                  {execution.globalMetrics.dataSize && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatMetric(execution.globalMetrics.dataSize, 'bytes')}
                      </div>
                      <div className="text-sm text-gray-500">Data Processed</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No global metrics available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graph" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                <span>Execution Graph</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Execution Order</div>
                  <div className="space-y-2">
                    {execution.executionGraph.executionOrder.map((level, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Level {index + 1}
                        </Badge>
                        <div className="flex gap-2">
                          {level.map(nodeId => {
                            const nodeExecution = execution.nodes.get(nodeId);
                            return (
                              <div key={nodeId} className="flex items-center gap-1">
                                {nodeExecution && getStatusIcon(nodeExecution.status, 'w-3 h-3')}
                                <span className="text-sm">{nodeId}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Critical Path</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {execution.executionGraph.criticalPath.map((nodeId, index) => (
                      <React.Fragment key={nodeId}>
                        <div className="flex items-center gap-1">
                          {execution.nodes.get(nodeId) && 
                            getStatusIcon(execution.nodes.get(nodeId)!.status, 'w-3 h-3')
                          }
                          <span className="text-sm font-medium">{nodeId}</span>
                        </div>
                        {index < execution.executionGraph.criticalPath.length - 1 && (
                          <span className="text-gray-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};