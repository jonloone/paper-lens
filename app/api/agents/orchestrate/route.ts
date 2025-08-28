import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/services/agents/AgentOrchestrator';
import { AgentContext } from '@/lib/agents/types';

// Create singleton orchestrator instance
let orchestrator: AgentOrchestrator | null = null;

function getOrchestrator(): AgentOrchestrator {
  if (!orchestrator) {
    orchestrator = new AgentOrchestrator();
  }
  return orchestrator;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, context, workflowId } = body;
    
    const orchestratorInstance = getOrchestrator();
    
    // Create context object
    const agentContext: AgentContext = {
      workspaceId: context?.workspaceId || 'default',
      userId: context?.userId || 'anonymous',
      sessionId: context?.sessionId || `session-${Date.now()}`,
      selectedTables: context?.selectedTables,
      currentPipeline: context?.currentPipeline,
      organizationPatterns: context?.organizationPatterns || [
        {
          pattern: 'daily_aggregation',
          frequency: 0.8,
          successRate: 0.95,
          category: 'analytics'
        },
        {
          pattern: 'incremental_load',
          frequency: 0.7,
          successRate: 0.92,
          category: 'ingestion'
        }
      ],
      previousDecisions: context?.previousDecisions || []
    };
    
    // Execute workflow if specified
    if (workflowId) {
      const results = await orchestratorInstance.executeWorkflow(workflowId);
      return NextResponse.json({
        success: true,
        workflowId,
        results,
        messages: orchestratorInstance.getMessages(10)
      });
    }
    
    // Process complex request
    const response = await orchestratorInstance.processComplexRequest(
      description,
      agentContext
    );
    
    return NextResponse.json({
      success: response.success,
      results: response.results,
      collaboration: response.collaboration,
      insights: response.insights,
      messages: response.messages,
      conversationalResponse: response.conversationalResponse,
      routingDecision: response.routingDecision,
      agentsStatus: orchestratorInstance.getAgentsStatus()
    });
    
  } catch (error) {
    console.error('Agent orchestration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const orchestratorInstance = getOrchestrator();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'status':
        return NextResponse.json({
          agents: orchestratorInstance.getAgentsStatus(),
          collaborations: orchestratorInstance.getActiveCollaborations()
        });
        
      case 'messages':
        const count = parseInt(searchParams.get('count') || '10');
        return NextResponse.json({
          messages: orchestratorInstance.getMessages(count)
        });
        
      default:
        return NextResponse.json({
          agents: orchestratorInstance.getAgentsStatus(),
          activeCollaborations: orchestratorInstance.getActiveCollaborations().length
        });
    }
    
  } catch (error) {
    console.error('Agent status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}