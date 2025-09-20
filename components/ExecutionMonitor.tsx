'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, AlertCircle, XCircle, Loader2 } from 'lucide-react';

interface ExecutionMonitorProps {
  executionId?: string;
  pipelineId?: string;
}

export function ExecutionMonitor({ executionId, pipelineId }: ExecutionMonitorProps) {
  const { 
    connected, 
    joinExecution, 
    leaveExecution, 
    joinPipeline,
    onExecutionUpdate,
    onQualityUpdate,
    onStageComplete
  } = useWebSocket();

  const [currentExecution, setCurrentExecution] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [qualityResults, setQualityResults] = useState<any[]>([]);

  useEffect(() => {
    if (executionId && connected) {
      joinExecution(executionId);
      
      const unsubExecution = onExecutionUpdate((update) => {
        if (update.executionId === executionId) {
          setCurrentExecution(update);
          if (update.message) {
            setLogs(prev => [...prev, {
              timestamp: update.timestamp,
              message: update.message,
              stage: update.stage
            }]);
          }
        }
      });

      const unsubQuality = onQualityUpdate((update) => {
        if (update.executionId === executionId) {
          setQualityResults(update.qualityResults);
        }
      });

      const unsubStage = onStageComplete((update) => {
        if (update.executionId === executionId) {
          setStages(prev => [...prev, update]);
        }
      });

      return () => {
        leaveExecution(executionId);
        unsubExecution?.();
        unsubQuality?.();
        unsubStage?.();
      };
    }
  }, [executionId, connected, joinExecution, leaveExecution, onExecutionUpdate, onQualityUpdate, onStageComplete]);

  useEffect(() => {
    if (pipelineId && connected) {
      joinPipeline(pipelineId);
    }
  }, [pipelineId, connected, joinPipeline]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'queued':
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
      completed: 'success',
      running: 'default',
      failed: 'destructive',
      queued: 'secondary'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (!connected) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting to real-time updates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentExecution && !executionId) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No active execution
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Execution Status */}
      {currentExecution && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Execution Status</CardTitle>
              {getStatusBadge(currentExecution.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">{currentExecution.progress || 0}%</span>
              </div>
              <Progress value={currentExecution.progress || 0} className="h-2" />
            </div>
            
            {currentExecution.stage && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Current Stage:</span>
                <span className="text-sm font-medium">{currentExecution.stage}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stage Progress */}
      {stages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['extract', 'validate', 'transform', 'load'].map((stageName) => {
                const stage = stages.find(s => s.stage === stageName);
                const isComplete = !!stage;
                const isCurrent = currentExecution?.stage === stageName;
                
                return (
                  <div key={stageName} className="flex items-center space-x-3">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={`text-sm capitalize ${isComplete ? 'font-medium' : 'text-muted-foreground'}`}>
                      {stageName}
                    </span>
                    {stage?.metrics && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {stage.metrics.recordsProcessed} records
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Results */}
      {qualityResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quality Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {qualityResults.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {result.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm">{result.rule}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${result.passed ? 'text-green-600' : 'text-yellow-600'}`}>
                      {result.score}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {result.threshold}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 w-full">
              <div className="space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx} className="text-xs font-mono">
                    <span className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {log.stage && (
                      <span className="ml-2 text-blue-600">[{log.stage}]</span>
                    )}
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}