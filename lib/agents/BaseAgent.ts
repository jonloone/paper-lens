import {
  AgentRole,
  AgentTask,
  AgentCapability,
  AgentContext,
  AgentInsight,
  AgentRequest,
  AgentResponse,
  TaskStatus,
  AgentMessage
} from './types';

/**
 * Base class for all CrewAI-inspired agents
 * Provides common functionality and patterns for agent behavior
 */
export abstract class BaseAgent {
  protected role: AgentRole;
  protected name: string;
  protected description: string;
  protected capabilities: AgentCapability[];
  protected context: AgentContext | null = null;
  protected currentTask: AgentTask | null = null;
  protected taskHistory: AgentTask[] = [];
  protected insights: AgentInsight[] = [];
  protected collaborators: Map<AgentRole, BaseAgent> = new Map();

  constructor(role: AgentRole, name: string, description: string) {
    this.role = role;
    this.name = name;
    this.description = description;
    this.capabilities = this.defineCapabilities();
  }

  /**
   * Define the specific capabilities of this agent
   * Must be implemented by subclasses
   */
  protected abstract defineCapabilities(): AgentCapability[];

  /**
   * Main execution method for the agent
   * Must be implemented by subclasses
   */
  protected abstract executeTask(task: AgentTask): Promise<any>;

  /**
   * Analyze the task and generate insights
   * Can be overridden by subclasses for specific analysis
   */
  protected async analyzeTask(task: AgentTask): Promise<AgentInsight[]> {
    const insights: AgentInsight[] = [];
    
    // Default analysis - can be extended by subclasses
    if (task.context.organizationPatterns && task.context.organizationPatterns.length > 0) {
      const relevantPatterns = task.context.organizationPatterns
        .filter(p => p.successRate > 0.8)
        .slice(0, 3);
      
      if (relevantPatterns.length > 0) {
        insights.push({
          id: `insight-${Date.now()}`,
          agent: this.role,
          type: 'pattern',
          title: 'Organizational Pattern Detected',
          description: `Similar tasks in your organization have ${relevantPatterns[0].successRate * 100}% success rate`,
          confidence: relevantPatterns[0].successRate,
          actions: [{
            label: 'Apply Pattern',
            action: 'apply_pattern',
            params: { pattern: relevantPatterns[0].pattern },
            impact: 'high'
          }]
        });
      }
    }
    
    return insights;
  }

  /**
   * Process an agent request
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Set context
      if (request.task.context) {
        this.context = request.task.context;
      }

      // Create full task
      const task: AgentTask = {
        id: request.id,
        title: request.task.title || 'Untitled Task',
        description: request.task.description || '',
        assignedTo: this.role,
        status: 'in_progress',
        priority: request.task.priority || 'medium',
        context: this.context || request.task.context!,
        input: request.task.input,
        startedAt: new Date()
      };

      this.currentTask = task;

      // Analyze the task
      const insights = await this.analyzeTask(task);
      this.insights.push(...insights);

      // Execute the task
      const result = await this.executeTask(task);

      // Update task status
      task.status = 'completed';
      task.output = result;
      task.completedAt = new Date();
      this.taskHistory.push(task);

      // Calculate confidence based on task complexity and patterns
      const confidence = this.calculateConfidence(task, result);

      return {
        requestId: request.id,
        agent: this.role,
        status: 'success',
        result,
        confidence,
        insights,
        duration: Date.now() - startTime
      };

    } catch (error) {
      if (this.currentTask) {
        this.currentTask.status = 'failed';
        this.currentTask.error = error instanceof Error ? error.message : String(error);
        this.taskHistory.push(this.currentTask);
      }

      return {
        requestId: request.id,
        agent: this.role,
        status: 'failure',
        error: error instanceof Error ? error.message : String(error),
        confidence: 0,
        duration: Date.now() - startTime
      };
    } finally {
      this.currentTask = null;
    }
  }

  /**
   * Calculate confidence score for the result
   */
  protected calculateConfidence(task: AgentTask, result: any): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence if we have historical patterns
    if (task.context.organizationPatterns && task.context.organizationPatterns.length > 0) {
      const avgSuccessRate = task.context.organizationPatterns
        .reduce((acc, p) => acc + p.successRate, 0) / task.context.organizationPatterns.length;
      confidence = Math.min(confidence + avgSuccessRate * 0.2, 0.95);
    }

    // Increase confidence if we have previous successful decisions
    if (task.context.previousDecisions) {
      const successfulDecisions = task.context.previousDecisions
        .filter(d => d.outcome === 'success' && d.agent === this.role);
      if (successfulDecisions.length > 0) {
        confidence = Math.min(confidence + 0.1, 0.95);
      }
    }

    return confidence;
  }

  /**
   * Delegate a subtask to another agent
   */
  protected async delegateTask(
    task: Partial<AgentTask>, 
    targetAgent: AgentRole
  ): Promise<AgentResponse | null> {
    const collaborator = this.collaborators.get(targetAgent);
    
    if (!collaborator) {
      console.warn(`No collaborator found for role: ${targetAgent}`);
      return null;
    }

    const delegationRequest: AgentRequest = {
      id: `delegation-${Date.now()}`,
      type: 'execute',
      agent: targetAgent,
      task: {
        ...task,
        delegatedFrom: this.role
      }
    };

    return collaborator.processRequest(delegationRequest);
  }

  /**
   * Register a collaborator agent
   */
  registerCollaborator(agent: BaseAgent): void {
    this.collaborators.set(agent.getRole(), agent);
  }

  /**
   * Send a message to another agent or user
   */
  protected sendMessage(to: AgentRole | 'user', content: string, data?: any): AgentMessage {
    return {
      id: `msg-${Date.now()}`,
      from: this.role,
      to,
      type: 'notification',
      content,
      data,
      timestamp: new Date()
    };
  }

  /**
   * Get agent's current status
   */
  getStatus(): {
    role: AgentRole;
    name: string;
    isBusy: boolean;
    currentTask: AgentTask | null;
    completedTasks: number;
    insights: number;
  } {
    return {
      role: this.role,
      name: this.name,
      isBusy: this.currentTask !== null,
      currentTask: this.currentTask,
      completedTasks: this.taskHistory.length,
      insights: this.insights.length
    };
  }

  // Getters
  getRole(): AgentRole {
    return this.role;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  getInsights(): AgentInsight[] {
    return this.insights;
  }

  getTaskHistory(): AgentTask[] {
    return this.taskHistory;
  }

  /**
   * Clear insights (useful for resetting state)
   */
  clearInsights(): void {
    this.insights = [];
  }

  /**
   * Set context for the agent
   */
  setContext(context: AgentContext): void {
    this.context = context;
  }
}