import { NextRequest, NextResponse } from 'next/server';
import { emitExecutionUpdate, emitQualityUpdate, emitStageComplete } from '@/lib/websocket/server';
import { qualityValidator } from '@/lib/services/qualityValidation';

// Types for pipeline execution
interface ExecutionRequest {
  pipelineId: string;
  mode: 'full' | 'sample' | 'dry-run';
  parameters?: Record<string, any>;
}

interface ExecutionResponse {
  executionId: string;
  pipelineId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  logs: ExecutionLog[];
  metrics?: ExecutionMetrics;
  qualityResults?: QualityCheckResult[];
}

interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  stage?: string;
}

interface ExecutionMetrics {
  recordsRead: number;
  recordsProcessed: number;
  recordsFailed: number;
  duration: number;
  stages: StageMetrics[];
}

interface StageMetrics {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  recordsProcessed: number;
  errors: number;
}

interface QualityCheckResult {
  rule: string;
  passed: boolean;
  score: number;
  threshold: number;
  details: {
    field?: string;
    affectedRecords?: number;
    message: string;
  };
}

// In-memory storage for executions (replace with database in production)
const executions = new Map<string, ExecutionResponse>();

// Simulate pipeline execution stages
async function simulatePipelineExecution(
  pipelineId: string,
  mode: string
): Promise<ExecutionResponse> {
  const executionId = `exec-${Date.now()}`;
  const execution: ExecutionResponse = {
    executionId,
    pipelineId,
    status: 'running',
    startTime: new Date(),
    logs: [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'Pipeline execution started',
        stage: 'initialization'
      }
    ],
    metrics: {
      recordsRead: 0,
      recordsProcessed: 0,
      recordsFailed: 0,
      duration: 0,
      stages: []
    },
    qualityResults: []
  };

  // Store initial execution
  executions.set(executionId, execution);

  // Simulate async execution
  setTimeout(async () => {
    // Emit initial running status
    emitExecutionUpdate({
      executionId,
      pipelineId,
      status: 'running',
      stage: 'extract',
      progress: 0,
      message: 'Starting data extraction',
      timestamp: new Date()
    });

    // Stage 1: Extract
    execution.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: 'Starting data extraction',
      stage: 'extract'
    });
    
    const extractMetrics = {
      name: 'extract',
      status: 'completed' as const,
      startTime: new Date(),
      endTime: new Date(Date.now() + 2000),
      recordsProcessed: mode === 'sample' ? 1000 : 50000,
      errors: 0
    };
    
    execution.metrics!.stages.push(extractMetrics);
    
    // Emit stage completion
    emitStageComplete(executionId, 'extract', extractMetrics);
    
    // Update progress
    emitExecutionUpdate({
      executionId,
      pipelineId,
      status: 'running',
      stage: 'validate',
      progress: 25,
      message: 'Extraction complete, starting validation',
      timestamp: new Date()
    });

    // Stage 2: Validate
    execution.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: 'Running quality validation',
      stage: 'validate'
    });

    // Generate sample data for validation
    const sampleData = Array.from({ length: mode === 'sample' ? 1000 : 50000 }, (_, i) => ({
      id: `record-${i}`,
      customer_id: `cust-${i}`,
      email: Math.random() > 0.02 ? `user${i}@example.com` : 'invalid-email',
      phone: Math.random() > 0.05 ? `+1555000${i.toString().padStart(4, '0')}` : '123',
      created_at: new Date(Date.now() - Math.random() * 86400000),
      updated_at: new Date(),
      price: Math.random() * 1000,
      category: ['electronics', 'clothing', 'food'][Math.floor(Math.random() * 3)]
    }));

    // Perform quality validation using the service
    const validationResult = await qualityValidator.validateData(sampleData, undefined, 85);
    
    // Convert validation results to execution format
    execution.qualityResults = validationResult.checkResults
      .slice(0, 5) // Show top 5 quality checks for demo
      .map(result => ({
        rule: result.ruleName,
        passed: result.passed,
        score: parseFloat(result.score.toFixed(1)),
        threshold: result.threshold,
        details: {
          field: result.details.field,
          affectedRecords: result.affectedRecords,
          message: result.details.message
        }
      }));

    const validateMetrics = {
      name: 'validate',
      status: 'completed' as const,
      startTime: new Date(),
      endTime: new Date(Date.now() + 3000),
      recordsProcessed: mode === 'sample' ? 1000 : 50000,
      errors: validationResult.checkResults.filter(r => !r.passed).reduce((sum, r) => sum + r.affectedRecords, 0)
    };
    
    execution.metrics!.stages.push(validateMetrics);
    
    // Emit quality update
    emitQualityUpdate(executionId, execution.qualityResults);
    emitStageComplete(executionId, 'validate', validateMetrics);
    
    // Update progress
    emitExecutionUpdate({
      executionId,
      pipelineId,
      status: 'running',
      stage: 'transform',
      progress: 50,
      message: 'Validation complete, applying transformations',
      qualityResults: execution.qualityResults,
      timestamp: new Date()
    });

    // Stage 3: Transform
    execution.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: 'Applying transformations',
      stage: 'transform'
    });

    const transformMetrics = {
      name: 'transform',
      status: 'completed' as const,
      startTime: new Date(),
      endTime: new Date(Date.now() + 4000),
      recordsProcessed: mode === 'sample' ? 1000 : 49458,
      errors: 0
    };
    
    execution.metrics!.stages.push(transformMetrics);
    emitStageComplete(executionId, 'transform', transformMetrics);
    
    // Update progress
    emitExecutionUpdate({
      executionId,
      pipelineId,
      status: 'running',
      stage: 'load',
      progress: 75,
      message: 'Transformations complete, loading to destination',
      timestamp: new Date()
    });

    // Stage 4: Load
    execution.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: 'Loading data to destination',
      stage: 'load'
    });

    const loadMetrics = {
      name: 'load',
      status: 'completed' as const,
      startTime: new Date(),
      endTime: new Date(Date.now() + 2000),
      recordsProcessed: mode === 'sample' ? 1000 : 49458,
      errors: 0
    };
    
    execution.metrics!.stages.push(loadMetrics);
    emitStageComplete(executionId, 'load', loadMetrics);

    // Final metrics
    execution.metrics!.recordsRead = mode === 'sample' ? 1000 : 50000;
    execution.metrics!.recordsProcessed = mode === 'sample' ? 1000 : 49458;
    execution.metrics!.recordsFailed = mode === 'sample' ? 0 : 542;
    execution.metrics!.duration = 11000; // 11 seconds

    // Update final status
    execution.status = execution.qualityResults.every(r => r.passed) ? 'completed' : 'completed';
    execution.endTime = new Date();
    
    execution.logs.push({
      timestamp: new Date(),
      level: execution.qualityResults.every(r => r.passed) ? 'info' : 'warning',
      message: `Pipeline execution completed with ${execution.qualityResults.filter(r => !r.passed).length} quality issues`,
      stage: 'completion'
    });

    // Update stored execution
    executions.set(executionId, execution);
    
    // Emit final completion status
    emitExecutionUpdate({
      executionId,
      pipelineId,
      status: execution.status,
      stage: 'completed',
      progress: 100,
      message: `Pipeline execution completed with ${execution.qualityResults.filter(r => !r.passed).length} quality issues`,
      metrics: execution.metrics,
      qualityResults: execution.qualityResults,
      timestamp: new Date()
    });
  }, 2000);

  return execution;
}

// POST /api/pipelines/execute - Execute a pipeline
export async function POST(request: NextRequest) {
  try {
    const body: ExecutionRequest = await request.json();
    
    // Validate request
    if (!body.pipelineId) {
      return NextResponse.json(
        { error: 'Pipeline ID required' },
        { status: 400 }
      );
    }
    
    // In production, this would:
    // 1. Trigger Airflow DAG
    // 2. Start monitoring job
    // 3. Initialize quality checks
    // 4. Set up logging
    
    // For demo, simulate execution
    const execution = await simulatePipelineExecution(
      body.pipelineId,
      body.mode || 'full'
    );
    
    return NextResponse.json(execution, { status: 202 }); // 202 Accepted
  } catch (error) {
    console.error('Error executing pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to execute pipeline' },
      { status: 500 }
    );
  }
}

// GET /api/pipelines/execute?executionId=xxx - Get execution status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');
    const pipelineId = searchParams.get('pipelineId');
    
    if (executionId) {
      const execution = executions.get(executionId);
      if (!execution) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(execution);
    }
    
    if (pipelineId) {
      // Get all executions for a pipeline
      const pipelineExecutions = Array.from(executions.values())
        .filter(e => e.pipelineId === pipelineId)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      return NextResponse.json(pipelineExecutions);
    }
    
    // Return all executions
    const allExecutions = Array.from(executions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    return NextResponse.json(allExecutions);
  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}

// DELETE /api/pipelines/execute?executionId=xxx - Cancel execution
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');
    
    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID required' },
        { status: 400 }
      );
    }
    
    const execution = executions.get(executionId);
    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }
    
    // Update execution status
    execution.status = 'failed';
    execution.endTime = new Date();
    execution.logs.push({
      timestamp: new Date(),
      level: 'warning',
      message: 'Execution cancelled by user',
      stage: 'cancellation'
    });
    
    executions.set(executionId, execution);
    
    return NextResponse.json(
      { message: 'Execution cancelled', execution },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling execution:', error);
    return NextResponse.json(
      { error: 'Failed to cancel execution' },
      { status: 500 }
    );
  }
}