import { NextRequest, NextResponse } from 'next/server';

// Types for pipeline operations
interface Pipeline {
  id: string;
  name: string;
  template: string;
  config: {
    source: string;
    destination: string;
    transformations: any[];
    qualityRules: QualityRule[];
    outputFormats: string[];
  };
  status: 'draft' | 'running' | 'completed' | 'failed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  metrics?: PipelineMetrics;
}

interface QualityRule {
  id: string;
  name: string;
  type: 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'uniqueness' | 'timeliness';
  threshold: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  field?: string;
  condition: string;
}

interface PipelineMetrics {
  recordsProcessed: number;
  recordsFailed: number;
  duration: number;
  qualityScore: number;
  qualityChecks: {
    passed: number;
    failed: number;
    total: number;
  };
}

// In-memory storage for demo (replace with database in production)
const pipelines = new Map<string, Pipeline>();

// GET /api/pipelines - List all pipelines
// GET /api/pipelines?id=xxx - Get specific pipeline
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const pipeline = pipelines.get(id);
      if (!pipeline) {
        return NextResponse.json(
          { error: 'Pipeline not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(pipeline);
    }
    
    // Return all pipelines
    const allPipelines = Array.from(pipelines.values());
    return NextResponse.json(allPipelines);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

// POST /api/pipelines - Create new pipeline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.template || !body.config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new pipeline
    const pipeline: Pipeline = {
      id: `pipeline-${Date.now()}`,
      name: body.name,
      template: body.template,
      config: body.config,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Store pipeline
    pipelines.set(pipeline.id, pipeline);
    
    // In production, this would:
    // 1. Store in database
    // 2. Create Airflow DAG
    // 3. Set up monitoring
    
    return NextResponse.json(pipeline, { status: 201 });
  } catch (error) {
    console.error('Error creating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}

// PUT /api/pipelines - Update pipeline
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Pipeline ID required' },
        { status: 400 }
      );
    }
    
    const pipeline = pipelines.get(body.id);
    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    // Update pipeline
    const updatedPipeline = {
      ...pipeline,
      ...body,
      updatedAt: new Date(),
    };
    
    pipelines.set(body.id, updatedPipeline);
    
    return NextResponse.json(updatedPipeline);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to update pipeline' },
      { status: 500 }
    );
  }
}

// DELETE /api/pipelines?id=xxx - Delete pipeline
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Pipeline ID required' },
        { status: 400 }
      );
    }
    
    if (!pipelines.has(id)) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    pipelines.delete(id);
    
    return NextResponse.json(
      { message: 'Pipeline deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to delete pipeline' },
      { status: 500 }
    );
  }
}