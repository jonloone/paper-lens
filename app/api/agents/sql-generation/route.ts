import { NextRequest, NextResponse } from 'next/server';
import { SQLGenerationAgent } from '@/lib/agents/SQLGenerationAgent';
import { AgentRequest, AgentContext } from '@/lib/agents/types';

// Create singleton agent instance
let sqlAgent: SQLGenerationAgent | null = null;

function getSQLAgent(): SQLGenerationAgent {
  if (!sqlAgent) {
    sqlAgent = new SQLGenerationAgent();
  }
  return sqlAgent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, tables, businessContext, performanceRequirements, context } = body;
    
    const agent = getSQLAgent();
    
    // Set context if provided
    if (context) {
      const agentContext: AgentContext = {
        workspaceId: context.workspaceId || 'default',
        userId: context.userId || 'anonymous',
        sessionId: context.sessionId || `session-${Date.now()}`,
        selectedTables: tables,
        organizationPatterns: context.organizationPatterns || [
          {
            pattern: 'customer_segmentation',
            frequency: 0.75,
            successRate: 0.93,
            category: 'analytics'
          }
        ]
      };
      agent.setContext(agentContext);
    }
    
    // Create agent request
    const agentRequest: AgentRequest = {
      id: `sql-gen-${Date.now()}`,
      type: 'execute',
      agent: 'sql_generator',
      task: {
        title: 'SQL Generation',
        description,
        priority: 'high',
        context: context || {
          workspaceId: 'default',
          userId: 'anonymous',
          sessionId: `session-${Date.now()}`
        },
        input: {
          description,
          tables,
          businessContext,
          performanceRequirements
        }
      }
    };
    
    // Process request
    const response = await agent.processRequest(agentRequest);
    
    return NextResponse.json({
      success: response.status === 'success',
      sql: response.result?.sql,
      explanation: response.result?.explanation,
      performance: response.result?.performance,
      alternativeQueries: response.result?.alternativeQueries,
      insights: response.insights,
      confidence: response.confidence,
      processingTime: response.duration
    });
    
  } catch (error) {
    console.error('SQL generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'SQL generation failed'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for SQL validation or explanation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sql = searchParams.get('sql');
    
    if (!action || !sql) {
      return NextResponse.json(
        { error: 'Action and SQL parameters are required' },
        { status: 400 }
      );
    }
    
    const agent = getSQLAgent();
    
    // Create validation/explanation request
    const agentRequest: AgentRequest = {
      id: `sql-${action}-${Date.now()}`,
      type: action as 'analyze' | 'validate',
      agent: 'sql_generator',
      task: {
        title: `SQL ${action}`,
        description: `${action} SQL query`,
        priority: 'medium',
        context: {
          workspaceId: 'default',
          userId: 'anonymous',
          sessionId: `session-${Date.now()}`
        },
        input: {
          sql,
          action
        }
      }
    };
    
    const response = await agent.processRequest(agentRequest);
    
    return NextResponse.json({
      success: response.status === 'success',
      result: response.result,
      insights: response.insights
    });
    
  } catch (error) {
    console.error('SQL analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'SQL analysis failed'
      },
      { status: 500 }
    );
  }
}