import { BaseAgent } from './BaseAgent';
import {
  AgentRequest,
  AgentResponse,
  AgentTask,
  AgentInsight,
  AgentCapability
} from './types';
import { VultrLLMService } from '@/lib/services/vultr-llm.service';
import { dataCatalogService } from '@/lib/services/DataCatalogService';

interface ConversationInput {
  userQuery: string;
  routingDecision?: any;
  context?: any;
}

/**
 * ConversationalAgent - Generates natural language responses for user interactions
 * Takes routing decisions and creates helpful, conversational responses
 */
export class ConversationalAgent extends BaseAgent {
  private llmService: VultrLLMService;
  private systemPrompt: string;

  constructor() {
    super('conversational', 'Conversational Agent', 'Generates natural, helpful responses for user interactions with data engineering tasks');
    this.llmService = new VultrLLMService();
    const contextSummary = dataCatalogService.getAgentContextSummary();
    
    this.systemPrompt = `You are a professional AI assistant for the NexusOne Data Engineering Platform. Your role is to provide clear, professional responses to users who need help with data engineering tasks.

${contextSummary}

Your capabilities include:
- SQL query generation using actual available tables and schemas
- Data quality assessment based on real data catalog information
- Data pipeline design leveraging connected systems (Trino, DataHub, Airflow, Kafka, NiFi)
- Business analysis using domain-specific knowledge

Communication Guidelines:
1. Maintain a professional, helpful tone
2. Provide specific, actionable guidance with clear explanations
3. Use actual table names, column names, and business context when relevant
4. Reference available data sources and their schemas
5. Ask specific clarifying questions when needed, but leverage existing data knowledge
6. Keep responses focused and structured
7. Never use emojis or casual language
8. Be direct and concise while remaining helpful

Data-Driven Responses:
- When asked about customer analysis, reference customer.master_table, sales.order_history, analytics.customer_engagement
- For churn analysis, use the business definition: customers with no purchases in 90+ days and no login in 60+ days
- Always mention actual column names like customer_id, customer_email, churn_risk_score
- Provide SQL examples using real schemas when applicable
- Reference connected systems (Trino for queries, DataHub for metadata, Airflow for pipelines)

Intent Recognition:
- System/Meta queries: "is this working", "test", "hello", "help" - Acknowledge system status and offer assistance
- SQL queries: Generate queries using actual table schemas and business logic
- Data Quality: Reference real quality metrics and validation approaches
- Pipelines: Discuss actual pipeline architectures and connected systems
- Analysis requests: Provide domain-specific guidance using available data

When users request analysis, immediately leverage available data context rather than asking basic questions about table availability.`;
  }

  protected defineCapabilities(): AgentCapability[] {
    return [
      {
        name: 'natural_response',
        description: 'Generate natural language responses to user queries',
        requiredContext: ['userQuery']
      },
      {
        name: 'contextual_help',
        description: 'Provide contextual help based on routing decisions',
        requiredContext: ['userQuery', 'routingDecision']
      },
      {
        name: 'explain_concepts',
        description: 'Explain data engineering concepts conversationally',
        requiredContext: ['userQuery']
      }
    ];
  }

  protected async executeTask(task: AgentTask): Promise<any> {
    const input = task.input as ConversationInput;
    
    try {
      // Generate natural language response
      const response = await this.generateResponse(input.userQuery, input.routingDecision, input.context);
      
      return {
        response,
        conversational: true,
        helpful: true
      };
    } catch (error) {
      // Fallback to helpful response if LLM fails
      return {
        response: this.generateFallbackResponse(input.userQuery, input.routingDecision),
        conversational: true,
        helpful: true
      };
    }
  }

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      const input = request.task?.input as ConversationInput;
      const result = await this.executeTask({
        title: request.task?.title || 'Generate Response',
        description: request.task?.description || input.userQuery,
        input,
        createdAt: new Date()
      });

      return {
        requestId: request.id,
        status: 'success',
        result: result.response,
        insights: [],
        metrics: {
          processingTime: Date.now() - (request.task?.createdAt?.getTime() || Date.now()),
          tokensUsed: 0,
          confidence: 0.9
        }
      };
    } catch (error) {
      return {
        requestId: request.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to generate response',
        result: null
      };
    }
  }

  private async generateResponse(userQuery: string, routingDecision?: any, context?: any): Promise<string> {
    // Check if this is a system/meta query first
    const lowerQuery = userQuery.toLowerCase().trim();
    const isSystemQuery = ['is this working', 'test', 'hello', 'hi', 'help', 'status'].some(phrase => 
      lowerQuery === phrase
    ) || (lowerQuery.includes('working') && lowerQuery.length < 20);
    
    if (isSystemQuery) {
      // Handle system queries directly without relying on routing decision
      return this.handleSystemQuery(userQuery);
    }
    
    let prompt = `User query: "${userQuery}"`;
    
    // Add data catalog context for analysis requests
    if (lowerQuery.includes('churn') || lowerQuery.includes('customer') || lowerQuery.includes('analysis')) {
      const relevantTables = dataCatalogService.getTablesForAnalysis(userQuery);
      if (relevantTables.length > 0) {
        prompt += `\n\nRelevant tables available: ${relevantTables.map(t => t.fullName).join(', ')}`;
        
        // Add specific context for churn analysis
        if (lowerQuery.includes('churn')) {
          const churnSuggestions = dataCatalogService.getQuerySuggestions('churn');
          if (churnSuggestions.length > 0) {
            prompt += `\n\nChurn analysis context: Use tables ${churnSuggestions[0].tables.join(', ')} with business definition: ${dataCatalogService.getBusinessContext().churnDefinition}`;
          }
        }
      }
    }
    
    // Include routing context if relevant
    if (routingDecision && routingDecision.confidence > 0.7) {
      prompt += `\n\nRouting analysis suggests this relates to: ${routingDecision.intent}`;
      if (routingDecision.requiredAgents) {
        prompt += `\nRelevant capabilities: ${routingDecision.requiredAgents.join(', ')}`;
      }
    } else if (routingDecision && routingDecision.confidence <= 0.7) {
      prompt += `\n\nNote: The routing analysis has low confidence (${routingDecision.confidence}). The user's intent may not be clear.`;
    }
    
    prompt += `\n\nProvide a professional, helpful response that addresses their request. Use actual table names and column names from our data catalog when relevant. If this is an analysis request, provide specific SQL examples or guidance using the available schemas.`;

    try {
      const response = await this.llmService.analyze({
        systemPrompt: this.systemPrompt,
        userPrompt: prompt,
        temperature: 0.3, // Lower temperature for more consistent professional responses
        maxTokens: 500
      });

      return response.trim();
    } catch (error) {
      throw error;
    }
  }

  private handleSystemQuery(query: string): string {
    const lowerQuery = query.toLowerCase().trim();
    
    if (lowerQuery.includes('working') || lowerQuery === 'test') {
      return 'The AI assistant is functioning properly and ready to help with your data engineering tasks. I can assist with SQL query generation, data quality assessment, pipeline design, and general data engineering guidance. What specific task would you like help with?';
    }
    
    if (lowerQuery === 'hello' || lowerQuery === 'hi') {
      return 'Hello. I am your data engineering assistant for the NexusOne platform. I can help you with SQL queries, data quality rules, pipeline design, and other data engineering tasks. What would you like to work on?';
    }
    
    if (lowerQuery === 'help') {
      return 'I can assist you with:\n\n• SQL query generation and optimization\n• Data quality rule creation and validation\n• Data pipeline architecture and design\n• General data engineering best practices\n\nPlease describe the specific task you need help with, and I will provide detailed guidance.';
    }
    
    return 'The system is operational. Please let me know what data engineering task you need assistance with.';
  }

  private generateFallbackResponse(userQuery: string, routingDecision?: any): string {
    // Check if this is a system query first
    const lowerQuery = userQuery.toLowerCase().trim();
    const isSystemQuery = ['is this working', 'test', 'hello', 'hi', 'help', 'status'].some(phrase => 
      lowerQuery === phrase
    ) || (lowerQuery.includes('working') && lowerQuery.length < 20);
    
    if (isSystemQuery) {
      return this.handleSystemQuery(userQuery);
    }
    
    if (routingDecision) {
      switch (routingDecision.requiredAgents?.[0]) {
        case 'sql_generator':
          return `I can assist with SQL query development. ${this.getSQLGuidance(userQuery)}`;
        case 'data_quality':
          return `I can help with data quality assessment. ${this.getQualityGuidance(userQuery)}`;
        case 'pipeline_orchestrator':
          return `I can assist with pipeline design and architecture. ${this.getPipelineGuidance(userQuery)}`;
        default:
          return `I understand you need help with: "${routingDecision.intent}". Please provide more specific details about what you're trying to accomplish.`;
      }
    }

    // Generic professional response
    return `I can assist with data engineering tasks including SQL queries, data quality validation, and pipeline design. Please provide more details about what specific task you need help with.`;
  }

  private getSQLGuidance(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('top') || lowerQuery.includes('best') || lowerQuery.includes('highest')) {
      return `To retrieve top results, use ORDER BY with LIMIT:\n\`\`\`sql\nSELECT customer_id, total_revenue\nFROM customer_summary\nORDER BY total_revenue DESC\nLIMIT 10;\n\`\`\`\nWhat specific metrics or tables are you working with?`;
    }
    
    if (lowerQuery.includes('join') || lowerQuery.includes('combine')) {
      return `To combine data from multiple tables, you will need JOIN operations. The type of JOIN (INNER, LEFT, RIGHT, FULL) depends on your data requirements. What tables do you need to combine?`;
    }
    
    return `Please specify the tables, columns, and criteria for your SQL query so I can provide targeted assistance.`;
  }

  private getQualityGuidance(query: string): string {
    return `Data quality assessment involves completeness, accuracy, consistency, and timeliness validation. Please specify which data quality dimensions you need to address and which tables or datasets require validation.`;
  }

  private getPipelineGuidance(query: string): string {
    return `Pipeline design requires understanding your data sources, transformation requirements, and target systems. Please specify your data sources, expected data volume, and processing requirements for detailed architectural guidance.`;
  }
}