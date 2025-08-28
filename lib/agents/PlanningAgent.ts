import { BaseAgent } from './BaseAgent';
import {
  AgentRequest,
  AgentResponse,
  AgentRole,
  AgentTask,
  AgentInsight,
  AgentContext,
  AgentCapability
} from './types';
import { VultrLLMService } from '@/lib/services/vultr-llm.service';

interface RoutingDecision {
  intent: string;
  requiredAgents: AgentRole[];
  tasks: Array<{
    agent: AgentRole;
    description: string;
    priority: 'high' | 'medium' | 'low';
    dependencies?: string[];
  }>;
  confidence: number;
  reasoning: string;
}

/**
 * PlanningAgent - Understands natural language and routes to appropriate agents
 * Uses LLM for intent analysis and intelligent task delegation
 */
export class PlanningAgent extends BaseAgent {
  private llmService: VultrLLMService;
  private systemPrompt: string;

  constructor() {
    super('planning', 'Planning Agent', 'Natural language understanding and intelligent routing of user requests to specialized agents');
    this.llmService = new VultrLLMService();
    this.systemPrompt = `You are a Planning Agent for the NexusOne Data Engineering Platform. Your role is to understand natural language requests and route them to the appropriate specialized agents.

IMPORTANT: First classify the request type:

1. SYSTEM/META QUERIES (DO NOT route to technical agents):
   - "is this working", "test", "hello", "hi", "help", "status"
   - Questions about the system itself or general greetings
   - For these queries, return: {"intent": "system_query", "requiredAgents": [], "tasks": [], "confidence": 0.95, "reasoning": "System/meta query - no technical routing needed"}

2. TECHNICAL REQUESTS (route to appropriate agents):

Available technical agents:
- SQL Generator Agent (sql_generator): SQL queries, data analysis, optimization
- Data Quality Agent (data_quality): Quality rules, validation, data checks
- Pipeline Orchestrator Agent (pipeline_orchestrator): ETL/ELT workflows, pipeline architecture

For technical requests, return a JSON object:
{
  "intent": "Brief description of what the user wants",
  "requiredAgents": ["agent_role_1"],
  "tasks": [
    {
      "agent": "agent_role",
      "description": "Specific task for this agent",
      "priority": "high|medium|low",
      "dependencies": []
    }
  ],
  "confidence": 0.95,
  "reasoning": "Brief explanation of your routing decision"
}

Guidelines:
- ALWAYS check if the request is a system/meta query first
- For unclear technical requests, use lower confidence (0.3-0.6) and ask for clarification
- Be specific in task descriptions
- If genuinely unsure about technical intent, return confidence < 0.7`;
  }

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      // Set context if provided
      if (request.context) {
        this.context = request.context;
      }

      // Analyze the request using LLM
      const routingDecision = await this.analyzeRequest(request.task?.description || '');

      // Create insights about the routing decision
      const insight: AgentInsight = {
        type: 'routing_analysis',
        title: 'Request Analysis and Routing',
        description: routingDecision.reasoning,
        data: {
          intent: routingDecision.intent,
          agents: routingDecision.requiredAgents,
          taskCount: routingDecision.tasks.length,
          confidence: routingDecision.confidence
        },
        confidence: routingDecision.confidence,
        timestamp: new Date()
      };

      this.insights.push(insight);

      // Return the routing decision as the result
      return {
        requestId: request.id,
        status: 'success',
        result: routingDecision,
        insights: [insight],
        metrics: {
          processingTime: Date.now() - (request.task?.createdAt?.getTime() || Date.now()),
          tokensUsed: 0, // Would be tracked by LLM service
          confidence: routingDecision.confidence
        }
      };

    } catch (error) {
      return {
        requestId: request.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        result: null
      };
    }
  }

  /**
   * Analyze request using LLM to determine routing
   */
  private async analyzeRequest(description: string): Promise<RoutingDecision> {
    try {
      // Use LLM to analyze the request
      const llmResponse = await this.llmService.analyze({
        systemPrompt: this.systemPrompt,
        userPrompt: description,
        temperature: 0.3, // Lower temperature for more consistent routing
        maxTokens: 500,
        responseFormat: 'json'
      });

      // Parse the LLM response
      const decision = JSON.parse(llmResponse) as RoutingDecision;

      // Validate the decision structure
      if (!decision.requiredAgents || !Array.isArray(decision.requiredAgents)) {
        throw new Error('Invalid routing decision: missing required agents');
      }

      return decision;

    } catch (error) {
      // Fallback to keyword-based routing if LLM fails
      console.warn('LLM routing failed, falling back to keyword analysis:', error);
      return this.fallbackRouting(description);
    }
  }

  /**
   * Fallback routing based on keywords if LLM fails
   */
  private fallbackRouting(description: string): RoutingDecision {
    const lower = description.toLowerCase().trim();
    
    // Check for system/meta queries first
    const isSystemQuery = ['is this working', 'test', 'hello', 'hi', 'help', 'status'].some(phrase => 
      lower === phrase || lower.includes(phrase)
    );
    
    if (isSystemQuery) {
      return {
        intent: 'system_query',
        requiredAgents: [],
        tasks: [],
        confidence: 0.95,
        reasoning: 'System/meta query - no technical routing needed'
      };
    }
    
    const agents: AgentRole[] = [];
    const tasks: RoutingDecision['tasks'] = [];

    // Check for SQL-related keywords
    if (
      lower.includes('sql') || 
      lower.includes('query') || 
      lower.includes('select') ||
      lower.includes('aggregate') ||
      lower.includes('join')
    ) {
      agents.push('sql_generator');
      tasks.push({
        agent: 'sql_generator',
        description: 'Generate optimized SQL query',
        priority: 'high'
      });
    }

    // Check for quality-related keywords
    if (
      lower.includes('quality') || 
      lower.includes('validation') || 
      lower.includes('rule') ||
      lower.includes('check') ||
      lower.includes('clean')
    ) {
      agents.push('data_quality');
      tasks.push({
        agent: 'data_quality',
        description: 'Create data quality rules',
        priority: 'high'
      });
    }

    // Check for pipeline-related keywords
    if (
      lower.includes('pipeline') || 
      lower.includes('workflow') || 
      lower.includes('etl') ||
      lower.includes('ingestion') ||
      lower.includes('schedule')
    ) {
      agents.push('pipeline_orchestrator');
      tasks.push({
        agent: 'pipeline_orchestrator',
        description: 'Design data pipeline',
        priority: 'high'
      });
    }

    // If no specific agents identified and not a system query, ask for clarification
    if (agents.length === 0) {
      return {
        intent: 'unclear_request',
        requiredAgents: [],
        tasks: [],
        confidence: 0.3,
        reasoning: 'Request is unclear - need more specific information about data engineering task'
      };
    }

    return {
      intent: `Process request: ${description.substring(0, 100)}...`,
      requiredAgents: agents,
      tasks,
      confidence: 0.7, // Lower confidence for fallback
      reasoning: 'Routing based on keyword analysis (LLM unavailable)'
    };
  }

  protected defineCapabilities(): AgentCapability[] {
    return [
      {
        name: 'analyze_intent',
        description: 'Analyze natural language request to understand user intent',
        requiredContext: ['description']
      },
      {
        name: 'route_request',
        description: 'Route request to appropriate specialized agents',
        requiredContext: ['description']
      },
      {
        name: 'plan_workflow',
        description: 'Plan multi-agent workflow for complex requests',
        requiredContext: ['description', 'context']
      }
    ];
  }

  protected async executeTask(task: AgentTask): Promise<any> {
    // The PlanningAgent doesn't execute tasks directly
    // It only analyzes and routes
    return {
      routing: await this.analyzeRequest(task.description),
      status: 'routed'
    };
  }

  protected validateRequest(request: AgentRequest): boolean {
    // Planning agent accepts all requests for analysis
    return true;
  }

  protected generateInsights(result: any): AgentInsight[] {
    // Insights are generated during processRequest
    return this.insights;
  }
}