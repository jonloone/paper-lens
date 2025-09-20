import { CopilotTask } from '@copilotkit/react-core';

/**
 * CopilotKit configuration for CrewAI agent integration
 * Defines custom tasks and actions that connect to our agent orchestrator
 */

export const agentTasks: CopilotTask[] = [
  {
    instructions: "You are an AI orchestrator that coordinates multiple specialized agents for data engineering tasks. You can delegate to SQL Generation, Data Quality, and Pipeline Orchestration agents.",
    includeCopilotReadable: true,
  }
];

export const copilotConfig = {
  // API endpoint for our custom backend
  apiUrl: '/api/copilot',
  
  // Headers for authentication if needed
  headers: {},
  
  // Custom properties
  properties: {
    enableAgentOrchestration: true,
    showAgentActivity: true,
    streamResponses: true,
  }
};

// System prompts for different agent modes
export const agentSystemPrompts = {
  sql_generator: `You are a SQL Generation Agent. You transform natural language descriptions into optimized SQL queries with business context awareness. You should:
- Analyze query intent and identify required operations
- Generate efficient SQL with proper indexing hints
- Provide alternative queries when beneficial
- Include performance estimates and optimizations`,

  data_quality: `You are a Data Quality Agent. You generate, validate, and monitor data quality rules with intelligent pattern detection. You should:
- Generate comprehensive quality rules for all data dimensions
- Validate data against established rules
- Identify quality issues and suggest remediation
- Profile data for anomaly detection`,

  pipeline_orchestrator: `You are a Pipeline Orchestration Agent. You design, configure, and optimize data pipelines with intelligent scheduling and monitoring. You should:
- Design scalable pipeline architectures
- Configure optimal scheduling and dependencies
- Estimate costs and performance
- Generate monitoring and alerting configurations`,

  orchestrator: `You are the Master Orchestrator. You coordinate multiple specialized agents to solve complex data engineering problems. You should:
- Analyze user requests to determine required agents
- Delegate tasks to appropriate specialized agents
- Coordinate multi-agent collaborations
- Synthesize results from multiple agents into coherent solutions`
};

// Agent action definitions for CopilotKit
export const agentActions = [
  {
    name: "executeSQL",
    description: "Generate and execute optimized SQL queries",
    parameters: [
      {
        name: "description",
        type: "string",
        description: "Natural language description of the query",
        required: true
      },
      {
        name: "tables",
        type: "array",
        description: "Tables to query",
        required: false
      }
    ],
    handler: async ({ description, tables }: any) => {
      const response = await fetch('/api/agents/sql-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, tables })
      });
      return response.json();
    }
  },
  {
    name: "generateQualityRules",
    description: "Generate data quality validation rules",
    parameters: [
      {
        name: "table",
        type: "string",
        description: "Table to generate rules for",
        required: true
      },
      {
        name: "columns",
        type: "array",
        description: "Columns to validate",
        required: false
      }
    ],
    handler: async ({ table, columns }: any) => {
      const response = await fetch('/api/agents/quality-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, columns })
      });
      return response.json();
    }
  },
  {
    name: "designPipeline",
    description: "Design and configure a data pipeline",
    parameters: [
      {
        name: "name",
        type: "string",
        description: "Pipeline name",
        required: true
      },
      {
        name: "source",
        type: "object",
        description: "Source configuration",
        required: true
      },
      {
        name: "destination",
        type: "object",
        description: "Destination configuration",
        required: true
      }
    ],
    handler: async ({ name, source, destination }: any) => {
      const response = await fetch('/api/agents/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, source, destination })
      });
      return response.json();
    }
  },
  {
    name: "orchestrateAgents",
    description: "Orchestrate multiple agents for complex tasks",
    parameters: [
      {
        name: "task",
        type: "string",
        description: "Complex task description",
        required: true
      },
      {
        name: "context",
        type: "object",
        description: "Additional context",
        required: false
      }
    ],
    handler: async ({ task, context }: any) => {
      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: task, context })
      });
      return response.json();
    }
  }
];

// Function to format agent responses for display
export function formatAgentResponse(response: any): string {
  if (response.sql) {
    return `\`\`\`sql\n${response.sql}\n\`\`\`\n\n${response.explanation || ''}`;
  }
  
  if (response.rules) {
    const rulesList = response.rules.map((rule: any) => 
      `- **${rule.name}**: ${rule.description} (${rule.severity})`
    ).join('\n');
    return `Generated ${response.rules.length} quality rules:\n\n${rulesList}`;
  }
  
  if (response.pipeline) {
    return `Pipeline "${response.pipeline.name}" configured:\n- Schedule: ${response.pipeline.schedule.expression}\n- Estimated Cost: $${response.estimatedCost?.totalMonthlyCost || 'N/A'}/month`;
  }
  
  return JSON.stringify(response, null, 2);
}

// Function to determine which agents to use based on query
export function analyzeQueryIntent(query: string): string[] {
  const lower = query.toLowerCase();
  const agents: string[] = [];
  
  if (lower.includes('sql') || lower.includes('query') || lower.includes('select')) {
    agents.push('sql_generator');
  }
  
  if (lower.includes('quality') || lower.includes('validation') || lower.includes('check')) {
    agents.push('data_quality');
  }
  
  if (lower.includes('pipeline') || lower.includes('etl') || lower.includes('workflow')) {
    agents.push('pipeline_orchestrator');
  }
  
  // If multiple agents or complex request, use orchestrator
  if (agents.length > 1 || lower.includes('create') || lower.includes('build')) {
    return ['orchestrator'];
  }
  
  return agents.length > 0 ? agents : ['orchestrator'];
}