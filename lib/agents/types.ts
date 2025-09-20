/**
 * Core types for the CrewAI-inspired agent system
 */

export type AgentRole = 
  | 'planning'
  | 'sql_generator'
  | 'data_quality'
  | 'pipeline_orchestrator'
  | 'optimizer'
  | 'documentation'
  | 'coordinator';

export type TaskStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'delegated';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AgentContext {
  workspaceId: string;
  userId: string;
  sessionId: string;
  selectedTables?: string[];
  currentPipeline?: string;
  organizationPatterns?: OrganizationPattern[];
  previousDecisions?: Decision[];
}

export interface OrganizationPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  category: string;
}

export interface Decision {
  timestamp: Date;
  agent: AgentRole;
  action: string;
  confidence: number;
  outcome?: 'success' | 'failure' | 'pending';
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  assignedTo: AgentRole;
  delegatedFrom?: AgentRole;
  status: TaskStatus;
  priority: TaskPriority;
  context: AgentContext;
  input: any;
  output?: any;
  error?: string;
  confidence?: number;
  startedAt?: Date;
  completedAt?: Date;
  subtasks?: AgentTask[];
}

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema?: any;
  outputSchema?: any;
  requiredContext?: string[];
}

export interface AgentMessage {
  id: string;
  from: AgentRole;
  to: AgentRole | 'user';
  type: 'request' | 'response' | 'delegation' | 'notification';
  content: string;
  data?: any;
  timestamp: Date;
}

export interface AgentInsight {
  id: string;
  agent: AgentRole;
  type: 'optimization' | 'warning' | 'recommendation' | 'pattern';
  title: string;
  description: string;
  confidence: number;
  actions?: AgentAction[];
  relatedTasks?: string[];
}

export interface AgentAction {
  label: string;
  action: string;
  params?: any;
  impact?: 'high' | 'medium' | 'low';
}

export interface AgentPerformance {
  agent: AgentRole;
  tasksCompleted: number;
  successRate: number;
  avgResponseTime: number;
  confidence: number;
  specializations: string[];
}

export interface AgentCollaboration {
  id: string;
  leadAgent: AgentRole;
  participants: AgentRole[];
  objective: string;
  tasks: AgentTask[];
  status: TaskStatus;
  startedAt: Date;
  completedAt?: Date;
  outcome?: any;
}

// Mock tool integrations (simulating real tool APIs)
export interface ToolIntegration {
  name: string;
  type: 'datahub' | 'airflow' | 'datadog' | 'ranger' | 'custom';
  status: 'connected' | 'disconnected' | 'error';
  capabilities: string[];
  mockData?: any;
}

export interface ExecutionPlan {
  id: string;
  title: string;
  description: string;
  steps: ExecutionStep[];
  estimatedDuration: number; // in seconds
  requiredAgents: AgentRole[];
  confidence: number;
}

export interface ExecutionStep {
  id: string;
  order: number;
  action: string;
  agent: AgentRole;
  input: any;
  expectedOutput?: any;
  dependencies?: string[]; // IDs of other steps
  parallel?: boolean;
}

// Agent Communication Protocol
export interface AgentRequest {
  id: string;
  type: 'execute' | 'analyze' | 'recommend' | 'validate';
  agent: AgentRole;
  task: Partial<AgentTask>;
  timeout?: number; // in milliseconds
  callback?: (response: AgentResponse) => void;
}

export interface AgentResponse {
  requestId: string;
  agent: AgentRole;
  status: 'success' | 'failure' | 'partial';
  result?: any;
  error?: string;
  confidence: number;
  insights?: AgentInsight[];
  delegations?: AgentRequest[];
  duration: number; // in milliseconds
}

// Workflow orchestration types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'scheduled' | 'event';
  agents: AgentRole[];
  tasks: AgentTask[];
  status: TaskStatus;
  created: Date;
  lastRun?: Date;
  metrics?: WorkflowMetrics;
}

export interface WorkflowMetrics {
  executions: number;
  successRate: number;
  avgDuration: number;
  lastSuccess?: Date;
  lastFailure?: Date;
  costEstimate?: number;
}