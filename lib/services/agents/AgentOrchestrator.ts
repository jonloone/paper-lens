import { BaseAgent } from '@/lib/agents/BaseAgent';
import { SQLGenerationAgent } from '@/lib/agents/SQLGenerationAgent';
import { DataQualityAgent } from '@/lib/agents/DataQualityAgent';
import { PipelineOrchestrationAgent } from '@/lib/agents/PipelineOrchestrationAgent';
import { PlanningAgent } from '@/lib/agents/PlanningAgent';
import { ConversationalAgent } from '@/lib/agents/ConversationalAgent';
import {
  AgentRole,
  AgentRequest,
  AgentResponse,
  AgentTask,
  AgentCollaboration,
  TaskStatus,
  AgentContext,
  AgentMessage,
  Workflow
} from '@/lib/agents/types';

/**
 * AgentOrchestrator manages and coordinates multiple agents
 * Handles complex workflows requiring multiple agent collaborations
 */
export class AgentOrchestrator {
  private agents: Map<AgentRole, BaseAgent>;
  private activeCollaborations: Map<string, AgentCollaboration>;
  private messageQueue: AgentMessage[];
  private workflows: Map<string, Workflow>;
  private context: AgentContext | null = null;

  constructor() {
    this.agents = new Map();
    this.activeCollaborations = new Map();
    this.messageQueue = [];
    this.workflows = new Map();
    
    // Initialize agents
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Create agent instances
    const planningAgent = new PlanningAgent();
    const conversationalAgent = new ConversationalAgent();
    const sqlAgent = new SQLGenerationAgent();
    const qualityAgent = new DataQualityAgent();
    const pipelineAgent = new PipelineOrchestrationAgent();
    
    // Register agents
    this.agents.set('planning', planningAgent as any);
    this.agents.set('conversational', conversationalAgent as any);
    this.agents.set('sql_generator', sqlAgent);
    this.agents.set('data_quality', qualityAgent);
    this.agents.set('pipeline_orchestrator', pipelineAgent);
    
    // Set up inter-agent collaboration
    planningAgent.registerCollaborator(sqlAgent);
    planningAgent.registerCollaborator(qualityAgent);
    planningAgent.registerCollaborator(pipelineAgent);
    sqlAgent.registerCollaborator(qualityAgent);
    sqlAgent.registerCollaborator(pipelineAgent);
    qualityAgent.registerCollaborator(sqlAgent);
    qualityAgent.registerCollaborator(pipelineAgent);
    pipelineAgent.registerCollaborator(sqlAgent);
    pipelineAgent.registerCollaborator(qualityAgent);
  }

  /**
   * Process a complex request that may require multiple agents
   * Uses PlanningAgent for natural language understanding and routing
   */
  async processComplexRequest(description: string, context?: AgentContext): Promise<{
    success: boolean;
    results: any;
    collaboration?: AgentCollaboration;
    insights: any[];
    messages: AgentMessage[];
    routingDecision?: any;
  }> {
    // Set context
    if (context) {
      this.context = context;
      this.agents.forEach(agent => agent.setContext(context));
    }
    
    // Use PlanningAgent to analyze the request with natural language understanding
    const planningAgent = this.agents.get('planning' as AgentRole);
    if (!planningAgent) {
      // Fallback to keyword-based routing if planning agent not available
      const requiredAgents = this.analyzeRequest(description);
      return this.executeWithAgents(description, requiredAgents, context);
    }

    // Get routing decision from Planning Agent
    const planningRequest: AgentRequest = {
      id: `planning-${Date.now()}`,
      type: 'analyze',
      agent: 'planning' as AgentRole,
      task: {
        title: 'Analyze and route request',
        description,
        context: this.context || undefined
      }
    };

    const planningResponse = await planningAgent.processRequest(planningRequest);
    
    if (planningResponse.status !== 'success' || !planningResponse.result) {
      // Fallback to keyword-based routing
      const requiredAgents = this.analyzeRequest(description);
      return this.executeWithAgents(description, requiredAgents, context);
    }

    const routingDecision = planningResponse.result;
    const requiredAgents = routingDecision.requiredAgents || [];
    
    // Add planning insights to the queue
    if (planningResponse.insights) {
      this.messageQueue.push({
        id: `msg-planning-${Date.now()}`,
        from: 'planning' as AgentRole,
        to: 'coordinator' as AgentRole,
        type: 'notification',
        content: `Intent: ${routingDecision.intent}\nConfidence: ${routingDecision.confidence}`,
        data: routingDecision,
        timestamp: new Date()
      });
    }

    // Generate conversational response using the ConversationalAgent
    const conversationalAgent = this.agents.get('conversational' as AgentRole);
    let conversationalResponse = null;
    
    if (conversationalAgent) {
      const conversationalRequest: AgentRequest = {
        id: `conv-${Date.now()}`,
        type: 'respond',
        agent: 'conversational' as AgentRole,
        task: {
          title: 'Generate natural response',
          description: description,
          input: {
            userQuery: description,
            routingDecision,
            context: this.context
          },
          createdAt: new Date()
        }
      };

      const convResponse = await conversationalAgent.processRequest(conversationalRequest);
      if (convResponse.status === 'success') {
        conversationalResponse = convResponse.result;
      }
    }

    // Also try to execute with specialized agents (but don't require success)
    const result = await this.executeWithAgents(description, requiredAgents, context, routingDecision.tasks);
    
    return {
      ...result,
      routingDecision,
      conversationalResponse
    };
  }

  /**
   * Execute tasks with specified agents
   */
  private async executeWithAgents(
    description: string, 
    requiredAgents: AgentRole[], 
    context?: AgentContext,
    plannedTasks?: any[]
  ): Promise<{
    success: boolean;
    results: any;
    collaboration?: AgentCollaboration;
    insights: any[];
    messages: AgentMessage[];
  }> {
    // Create collaboration if multiple agents are needed
    if (requiredAgents.length > 1) {
      const collaboration = this.createCollaboration(description, requiredAgents);
      
      // Use planned tasks if available
      if (plannedTasks && plannedTasks.length > 0) {
        collaboration.tasks = plannedTasks.map(pt => ({
          id: `task-${Date.now()}-${pt.agent}`,
          title: pt.description,
          description: pt.description,
          assignedTo: pt.agent,
          status: 'pending',
          priority: pt.priority || 'medium',
          context: this.context || {
            workspaceId: 'default',
            userId: 'user',
            sessionId: `session-${Date.now()}`
          }
        }));
      }
      
      const results = await this.executeCollaboration(collaboration);
      
      return {
        success: collaboration.status === 'completed',
        results: results,
        collaboration,
        insights: this.collectInsights(requiredAgents),
        messages: this.messageQueue
      };
    } else if (requiredAgents.length === 1) {
      // Single agent request
      const agent = this.agents.get(requiredAgents[0]);
      if (!agent) {
        throw new Error(`Agent ${requiredAgents[0]} not found`);
      }
      
      const request: AgentRequest = {
        id: `req-${Date.now()}`,
        type: 'execute',
        agent: requiredAgents[0],
        task: {
          title: description,
          description: plannedTasks?.[0]?.description || description,
          context: this.context || undefined
        }
      };
      
      const response = await agent.processRequest(request);
      
      return {
        success: response.status === 'success',
        results: response.result,
        insights: response.insights || [],
        messages: this.messageQueue
      };
    }
    
    return {
      success: false,
      results: null,
      insights: [],
      messages: []
    };
  }

  /**
   * Analyze request to determine which agents are needed
   */
  private analyzeRequest(description: string): AgentRole[] {
    const lower = description.toLowerCase();
    const agents: AgentRole[] = [];
    
    // Check for SQL-related keywords
    if (
      lower.includes('sql') || 
      lower.includes('query') || 
      lower.includes('select') ||
      lower.includes('aggregate') ||
      lower.includes('join')
    ) {
      agents.push('sql_generator');
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
    }
    
    // Check for pipeline-related keywords
    if (
      lower.includes('pipeline') || 
      lower.includes('workflow') || 
      lower.includes('etl') ||
      lower.includes('ingestion') ||
      lower.includes('schedule') ||
      lower.includes('orchestrat')
    ) {
      agents.push('pipeline_orchestrator');
    }
    
    // If no specific agents identified, use context to decide
    if (agents.length === 0) {
      if (lower.includes('create') || lower.includes('build') || lower.includes('generate')) {
        agents.push('sql_generator'); // Default to SQL generation for create requests
      } else if (lower.includes('analyze') || lower.includes('optimize')) {
        agents.push('pipeline_orchestrator'); // Default to pipeline for optimization
      } else {
        agents.push('sql_generator'); // Ultimate fallback
      }
    }
    
    return agents;
  }

  /**
   * Create a collaboration between multiple agents
   */
  private createCollaboration(objective: string, agents: AgentRole[]): AgentCollaboration {
    const collaboration: AgentCollaboration = {
      id: `collab-${Date.now()}`,
      leadAgent: agents[0], // First agent leads
      participants: agents,
      objective,
      tasks: [],
      status: 'in_progress',
      startedAt: new Date()
    };
    
    this.activeCollaborations.set(collaboration.id, collaboration);
    return collaboration;
  }

  /**
   * Execute a multi-agent collaboration
   */
  private async executeCollaboration(collaboration: AgentCollaboration): Promise<any> {
    const results: any = {};
    
    // Create tasks for each agent
    for (const agentRole of collaboration.participants) {
      const agent = this.agents.get(agentRole);
      if (!agent) continue;
      
      const task: AgentTask = {
        id: `task-${Date.now()}-${agentRole}`,
        title: `${agentRole} task for: ${collaboration.objective}`,
        description: collaboration.objective,
        assignedTo: agentRole,
        status: 'pending',
        priority: 'high',
        context: this.context || {
          workspaceId: 'default',
          userId: 'user',
          sessionId: `session-${Date.now()}`
        },
        input: {
          objective: collaboration.objective,
          previousResults: results
        }
      };
      
      collaboration.tasks.push(task);
    }
    
    // Execute tasks sequentially (can be parallelized based on dependencies)
    for (const task of collaboration.tasks) {
      const agent = this.agents.get(task.assignedTo);
      if (!agent) continue;
      
      task.status = 'in_progress';
      
      const request: AgentRequest = {
        id: task.id,
        type: 'execute',
        agent: task.assignedTo,
        task
      };
      
      try {
        const response = await agent.processRequest(request);
        task.status = 'completed';
        task.output = response.result;
        results[task.assignedTo] = response.result;
        
        // Add message about completion
        this.messageQueue.push({
          id: `msg-${Date.now()}`,
          from: task.assignedTo,
          to: 'coordinator',
          type: 'notification',
          content: `Completed: ${task.title}`,
          data: response.result,
          timestamp: new Date()
        });
        
      } catch (error) {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : String(error);
        
        // Add error message
        this.messageQueue.push({
          id: `msg-${Date.now()}`,
          from: task.assignedTo,
          to: 'coordinator',
          type: 'notification',
          content: `Failed: ${task.title} - ${task.error}`,
          timestamp: new Date()
        });
      }
    }
    
    // Update collaboration status
    const allCompleted = collaboration.tasks.every(t => t.status === 'completed');
    collaboration.status = allCompleted ? 'completed' : 'failed';
    collaboration.completedAt = new Date();
    collaboration.outcome = results;
    
    return results;
  }

  /**
   * Collect insights from multiple agents
   */
  private collectInsights(agentRoles: AgentRole[]): any[] {
    const insights: any[] = [];
    
    for (const role of agentRoles) {
      const agent = this.agents.get(role);
      if (agent) {
        insights.push(...agent.getInsights());
      }
    }
    
    // Sort by confidence
    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Create a predefined workflow
   */
  async createWorkflow(name: string, description: string, steps: Array<{
    agent: AgentRole;
    action: string;
    input?: any;
  }>): Promise<Workflow> {
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name,
      description,
      trigger: 'manual',
      agents: steps.map(s => s.agent),
      tasks: steps.map((step, index) => ({
        id: `task-${index}`,
        title: `${step.action} by ${step.agent}`,
        description: step.action,
        assignedTo: step.agent,
        status: 'pending',
        priority: 'medium',
        context: this.context || {
          workspaceId: 'default',
          userId: 'user',
          sessionId: `session-${Date.now()}`
        },
        input: step.input
      })),
      status: 'pending',
      created: new Date()
    };
    
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * Execute a predefined workflow
   */
  async executeWorkflow(workflowId: string): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    workflow.status = 'in_progress';
    workflow.lastRun = new Date();
    
    const collaboration = this.createCollaboration(
      workflow.description,
      workflow.agents
    );
    
    collaboration.tasks = workflow.tasks;
    const results = await this.executeCollaboration(collaboration);
    
    workflow.status = collaboration.status;
    
    // Update metrics
    if (!workflow.metrics) {
      workflow.metrics = {
        executions: 0,
        successRate: 0,
        avgDuration: 0
      };
    }
    
    workflow.metrics.executions++;
    if (workflow.status === 'completed') {
      workflow.metrics.lastSuccess = new Date();
      workflow.metrics.successRate = 
        (workflow.metrics.successRate * (workflow.metrics.executions - 1) + 1) / 
        workflow.metrics.executions;
    } else {
      workflow.metrics.lastFailure = new Date();
      workflow.metrics.successRate = 
        (workflow.metrics.successRate * (workflow.metrics.executions - 1)) / 
        workflow.metrics.executions;
    }
    
    return results;
  }

  /**
   * Get status of all agents
   */
  getAgentsStatus(): Array<{
    role: AgentRole;
    status: any;
  }> {
    const statuses: Array<{ role: AgentRole; status: any }> = [];
    
    this.agents.forEach((agent, role) => {
      statuses.push({
        role,
        status: agent.getStatus()
      });
    });
    
    return statuses;
  }

  /**
   * Get active collaborations
   */
  getActiveCollaborations(): AgentCollaboration[] {
    return Array.from(this.activeCollaborations.values())
      .filter(c => c.status === 'in_progress');
  }

  /**
   * Clear all insights from agents
   */
  clearAllInsights(): void {
    this.agents.forEach(agent => agent.clearInsights());
  }

  /**
   * Get messages from queue
   */
  getMessages(count?: number): AgentMessage[] {
    if (count) {
      return this.messageQueue.slice(-count);
    }
    return this.messageQueue;
  }

  /**
   * Clear message queue
   */
  clearMessages(): void {
    this.messageQueue = [];
  }
}