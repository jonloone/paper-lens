import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export interface ExecutionUpdate {
  executionId: string;
  pipelineId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  stage?: string;
  progress?: number;
  message?: string;
  metrics?: any;
  qualityResults?: any[];
  timestamp: Date;
}

// Get the global io instance (set by server.js)
export const getIO = (): SocketIOServer | null => {
  if (typeof global !== 'undefined' && (global as any).io) {
    return (global as any).io;
  }
  return null;
};

// Emit execution update to specific room
export const emitExecutionUpdate = (update: ExecutionUpdate) => {
  const io = getIO();
  if (!io) return;
  
  // Emit to execution-specific room
  io.to(`execution-${update.executionId}`).emit('execution-update', update);
  
  // Also emit to pipeline room for monitoring
  io.to(`pipeline-${update.pipelineId}`).emit('pipeline-execution', update);
};

// Emit quality check results
export const emitQualityUpdate = (executionId: string, qualityResults: any) => {
  const io = getIO();
  if (!io) return;
  
  io.to(`execution-${executionId}`).emit('quality-update', {
    executionId,
    qualityResults,
    timestamp: new Date()
  });
};

// Emit stage completion
export const emitStageComplete = (executionId: string, stage: string, metrics: any) => {
  const io = getIO();
  if (!io) return;
  
  io.to(`execution-${executionId}`).emit('stage-complete', {
    executionId,
    stage,
    metrics,
    timestamp: new Date()
  });
};