import { RealNode, RealEdge, RealPipeline, PipelineSource, IntegrationLevel } from '@/lib/types/RealNode';
import { createMockMCPClient } from '@/lib/mcp/mockMCPClient';

interface ExecutionContext {
  pipelineId: string;
  runId: string;
  startTime: string;
  environment: 'dev' | 'staging' | 'prod';
  triggeredBy: string;
  parameters?: Record<string, any>;
  dryRun?: boolean;
}

interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  logs?: ExecutionLog[];
  metrics?: ExecutionMetrics;
  error?: string;
  retryCount?: number;
  outputs?: Record<string, any>;
}

interface ExecutionLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source: 'node' | 'engine' | 'tool';
  metadata?: Record<string, any>;
}

interface ExecutionMetrics {
  cpuUsage?: number;
  memoryUsage?: number;
  networkIO?: number;
  diskIO?: number;
  recordsProcessed?: number;
  dataSize?: number;
  customMetrics?: Record<string, number>;
}

interface PipelineExecution {
  context: ExecutionContext;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  nodes: Map<string, NodeExecution>;
  startTime: string;
  endTime?: string;
  duration?: number;
  globalLogs: ExecutionLog[];
  globalMetrics?: ExecutionMetrics;
  executionGraph: ExecutionGraph;
}

interface ExecutionGraph {
  nodes: string[];
  edges: Array<{ from: string; to: string }>;
  executionOrder: string[][];
  criticalPath: string[];
}

interface ExecutionStrategy {
  mode: 'local' | 'hybrid' | 'delegated';
  parallelism: number;
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    retryableErrors: string[];
  };
  timeouts: {
    nodeTimeout: number;
    pipelineTimeout: number;
  };
  monitoring: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsInterval: number;
    healthCheckInterval: number;
  };
}

export class HybridExecutionEngine {
  private executions: Map<string, PipelineExecution> = new Map();
  private mcpClients: Map<string, any> = new Map();
  private strategy: ExecutionStrategy;

  constructor(strategy: ExecutionStrategy) {
    this.strategy = strategy;
  }

  /**
   * Execute a pipeline using hybrid approach
   */
  async executePipeline(
    pipeline: RealPipeline,
    context: Partial<ExecutionContext>
  ): Promise<string> {
    const runId = this.generateRunId();
    const executionContext: ExecutionContext = {
      pipelineId: pipeline.id,
      runId,
      startTime: new Date().toISOString(),
      environment: 'dev',
      triggeredBy: 'manual',
      ...context
    };

    // Build execution graph
    const executionGraph = this.buildExecutionGraph(pipeline);

    // Initialize pipeline execution
    const pipelineExecution: PipelineExecution = {
      context: executionContext,
      status: 'pending',
      nodes: new Map(),
      startTime: executionContext.startTime,
      globalLogs: [],
      executionGraph
    };

    // Initialize node executions
    for (const node of pipeline.nodes) {
      pipelineExecution.nodes.set(node.id, {
        nodeId: node.id,
        status: 'pending',
        logs: [],
        retryCount: 0
      });
    }

    this.executions.set(runId, pipelineExecution);

    // Start execution
    this.startPipelineExecution(pipeline, pipelineExecution);

    return runId;
  }

  /**
   * Get execution status
   */
  getExecutionStatus(runId: string): PipelineExecution | null {
    return this.executions.get(runId) || null;
  }

  /**
   * Cancel execution
   */
  async cancelExecution(runId: string): Promise<boolean> {
    const execution = this.executions.get(runId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = new Date().toISOString();
    execution.duration = Date.now() - new Date(execution.startTime).getTime();

    // Cancel running nodes
    for (const [nodeId, nodeExecution] of execution.nodes) {
      if (nodeExecution.status === 'running') {
        nodeExecution.status = 'failed';
        nodeExecution.error = 'Execution cancelled';
        nodeExecution.endTime = new Date().toISOString();
      }
    }

    this.addGlobalLog(execution, 'info', 'Pipeline execution cancelled');
    return true;
  }

  /**
   * Get execution logs
   */
  getExecutionLogs(runId: string, nodeId?: string): ExecutionLog[] {
    const execution = this.executions.get(runId);
    if (!execution) return [];

    if (nodeId) {
      const nodeExecution = execution.nodes.get(nodeId);
      return nodeExecution?.logs || [];
    }

    return execution.globalLogs;
  }

  /**
   * Get execution metrics
   */
  getExecutionMetrics(runId: string, nodeId?: string): ExecutionMetrics | null {
    const execution = this.executions.get(runId);
    if (!execution) return null;

    if (nodeId) {
      const nodeExecution = execution.nodes.get(nodeId);
      return nodeExecution?.metrics || null;
    }

    return execution.globalMetrics || null;
  }

  /**
   * Build execution graph from pipeline
   */
  private buildExecutionGraph(pipeline: RealPipeline): ExecutionGraph {
    const nodes = pipeline.nodes.map(n => n.id);
    const edges = pipeline.edges.map(e => ({ from: e.source, target: e.target }));

    // Calculate execution order using topological sort
    const executionOrder = this.calculateExecutionOrder(nodes, edges);
    
    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(nodes, edges);

    return {
      nodes,
      edges: edges.map(e => ({ from: e.from, to: e.target })),
      executionOrder,
      criticalPath
    };
  }

  /**
   * Start pipeline execution
   */
  private async startPipelineExecution(
    pipeline: RealPipeline,
    execution: PipelineExecution
  ): Promise<void> {
    execution.status = 'running';
    this.addGlobalLog(execution, 'info', 'Pipeline execution started');

    try {
      // Execute nodes in topological order
      for (const nodeGroup of execution.executionGraph.executionOrder) {
        // Execute nodes in parallel within each group
        const nodePromises = nodeGroup.map(nodeId => 
          this.executeNode(pipeline, execution, nodeId)
        );

        await Promise.all(nodePromises);

        // Check if any node failed
        const failedNodes = nodeGroup.filter(nodeId => {
          const nodeExecution = execution.nodes.get(nodeId);
          return nodeExecution?.status === 'failed';
        });

        if (failedNodes.length > 0) {
          throw new Error(`Nodes failed: ${failedNodes.join(', ')}`);
        }
      }

      // Execution completed successfully
      execution.status = 'success';
      execution.endTime = new Date().toISOString();
      execution.duration = Date.now() - new Date(execution.startTime).getTime();
      
      this.addGlobalLog(execution, 'info', 'Pipeline execution completed successfully');

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      execution.duration = Date.now() - new Date(execution.startTime).getTime();
      
      this.addGlobalLog(execution, 'error', `Pipeline execution failed: ${error}`);
    }
  }

  /**
   * Execute individual node based on integration level
   */
  private async executeNode(
    pipeline: RealPipeline,
    execution: PipelineExecution,
    nodeId: string
  ): Promise<void> {
    const node = pipeline.nodes.find(n => n.id === nodeId);
    const nodeExecution = execution.nodes.get(nodeId);
    
    if (!node || !nodeExecution) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    nodeExecution.status = 'running';
    nodeExecution.startTime = new Date().toISOString();
    
    this.addNodeLog(nodeExecution, 'info', 'Node execution started');

    try {
      switch (node.reality.integration.level) {
        case 'mcp-full':
          await this.executeMCPNode(node, nodeExecution, execution.context);
          break;
        case 'tool-direct':
          await this.executeToolDirectNode(node, nodeExecution, execution.context);
          break;
        case 'config-only':
          await this.executeConfigOnlyNode(node, nodeExecution, execution.context);
          break;
        case 'documentation':
          await this.executeDocumentationNode(node, nodeExecution, execution.context);
          break;
        default:
          throw new Error(`Unsupported integration level: ${node.reality.integration.level}`);
      }

      nodeExecution.status = 'success';
      nodeExecution.endTime = new Date().toISOString();
      nodeExecution.duration = Date.now() - new Date(nodeExecution.startTime!).getTime();
      
      this.addNodeLog(nodeExecution, 'info', 'Node execution completed successfully');

    } catch (error) {
      nodeExecution.status = 'failed';
      nodeExecution.error = String(error);
      nodeExecution.endTime = new Date().toISOString();
      nodeExecution.duration = Date.now() - new Date(nodeExecution.startTime!).getTime();
      
      this.addNodeLog(nodeExecution, 'error', `Node execution failed: ${error}`);

      // Attempt retry if configured
      if (nodeExecution.retryCount! < this.strategy.retryPolicy.maxRetries) {
        await this.retryNodeExecution(pipeline, execution, nodeId);
      } else {
        throw error;
      }
    }
  }

  /**
   * Execute MCP-enabled node
   */
  private async executeMCPNode(
    node: RealNode,
    nodeExecution: NodeExecution,
    context: ExecutionContext
  ): Promise<void> {
    const mcpServer = node.reality.integration.mcpServer;
    if (!mcpServer) {
      throw new Error('MCP server not specified for MCP-full node');
    }

    // Get or create MCP client
    let client = this.mcpClients.get(mcpServer);
    if (!client) {
      client = createMockMCPClient(`mcp://${mcpServer}:3000`);
      await client.connect();
      this.mcpClients.set(mcpServer, client);
    }

    this.addNodeLog(nodeExecution, 'info', 'Executing via MCP');

    // Execute node via MCP
    const result = await client.request('executeNode', {
      nodeType: node.type,
      nodeId: node.id,
      config: node.config?.actual,
      context: context.parameters
    });

    // Store execution results
    nodeExecution.outputs = result.outputs;
    nodeExecution.metrics = result.metrics;

    if (result.logs) {
      for (const log of result.logs) {
        this.addNodeLog(nodeExecution, log.level, log.message);
      }
    }
  }

  /**
   * Execute tool-direct node
   */
  private async executeToolDirectNode(
    node: RealNode,
    nodeExecution: NodeExecution,
    context: ExecutionContext
  ): Promise<void> {
    const apiEndpoint = node.reality.integration.apiEndpoint;
    if (!apiEndpoint) {
      throw new Error('API endpoint not configured for tool-direct node');
    }

    this.addNodeLog(nodeExecution, 'info', `Executing via ${node.reality.source} API`);

    // Execute via tool API
    const response = await fetch(`${apiEndpoint}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(node.reality.source)
      },
      body: JSON.stringify({
        nodeId: node.reality.sourceId,
        config: node.config?.actual,
        parameters: context.parameters
      })
    });

    if (!response.ok) {
      throw new Error(`Tool API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Store execution results
    nodeExecution.outputs = result.outputs;
    nodeExecution.metrics = result.metrics;

    // Poll for completion if async
    if (result.executionId) {
      await this.pollToolExecution(node, nodeExecution, result.executionId);
    }
  }

  /**
   * Execute config-only node (simulation)
   */
  private async executeConfigOnlyNode(
    node: RealNode,
    nodeExecution: NodeExecution,
    context: ExecutionContext
  ): Promise<void> {
    this.addNodeLog(nodeExecution, 'info', 'Simulating execution (config-only mode)');

    // Simulate execution based on node type
    const simulationResult = await this.simulateNodeExecution(node, context);
    
    nodeExecution.outputs = simulationResult.outputs;
    nodeExecution.metrics = simulationResult.metrics;

    // Add simulated delay
    await new Promise(resolve => setTimeout(resolve, simulationResult.duration || 1000));
  }

  /**
   * Execute documentation node (manual step)
   */
  private async executeDocumentationNode(
    node: RealNode,
    nodeExecution: NodeExecution,
    context: ExecutionContext
  ): Promise<void> {
    this.addNodeLog(nodeExecution, 'info', 'Manual execution required');
    
    // For documentation nodes, we mark as skipped unless manual confirmation
    nodeExecution.status = 'skipped';
    nodeExecution.outputs = { message: 'Manual step - requires user intervention' };
  }

  /**
   * Retry node execution
   */
  private async retryNodeExecution(
    pipeline: RealPipeline,
    execution: PipelineExecution,
    nodeId: string
  ): Promise<void> {
    const nodeExecution = execution.nodes.get(nodeId);
    if (!nodeExecution) return;

    nodeExecution.retryCount!++;
    
    // Calculate backoff delay
    const delay = this.calculateBackoffDelay(nodeExecution.retryCount!);
    this.addNodeLog(nodeExecution, 'info', `Retrying in ${delay}ms (attempt ${nodeExecution.retryCount})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Reset node status for retry
    nodeExecution.status = 'pending';
    nodeExecution.error = undefined;
    
    // Re-execute
    await this.executeNode(pipeline, execution, nodeId);
  }

  /**
   * Calculate execution order using topological sort
   */
  private calculateExecutionOrder(
    nodes: string[],
    edges: Array<{ from: string; target: string }>
  ): string[][] {
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Initialize
    for (const node of nodes) {
      inDegree.set(node, 0);
      adjacencyList.set(node, []);
    }

    // Build graph
    for (const edge of edges) {
      adjacencyList.get(edge.from)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const result: string[][] = [];
    const queue: string[] = [];

    // Find nodes with no dependencies
    for (const [node, degree] of inDegree) {
      if (degree === 0) {
        queue.push(node);
      }
    }

    while (queue.length > 0) {
      const currentLevel: string[] = [...queue];
      queue.length = 0;

      result.push(currentLevel);

      for (const node of currentLevel) {
        const neighbors = adjacencyList.get(node) || [];
        for (const neighbor of neighbors) {
          const newDegree = (inDegree.get(neighbor) || 1) - 1;
          inDegree.set(neighbor, newDegree);
          if (newDegree === 0) {
            queue.push(neighbor);
          }
        }
      }
    }

    return result;
  }

  /**
   * Calculate critical path
   */
  private calculateCriticalPath(
    nodes: string[],
    edges: Array<{ from: string; target: string }>
  ): string[] {
    // Simplified critical path calculation
    // In a real implementation, this would consider node execution times
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);
      path.push(node);

      const outgoing = edges.filter(e => e.from === node);
      if (outgoing.length > 0) {
        // For simplicity, take the first outgoing edge
        dfs(outgoing[0].target);
      }
    };

    // Start from nodes with no incoming edges
    const startNodes = nodes.filter(node => 
      !edges.some(edge => edge.target === node)
    );

    if (startNodes.length > 0) {
      dfs(startNodes[0]);
    }

    return path;
  }

  /**
   * Simulate node execution for config-only nodes
   */
  private async simulateNodeExecution(
    node: RealNode,
    context: ExecutionContext
  ): Promise<{ outputs: any; metrics: ExecutionMetrics; duration: number }> {
    // Basic simulation based on node type
    const baseMetrics: ExecutionMetrics = {
      cpuUsage: Math.random() * 50 + 10,
      memoryUsage: Math.random() * 1000 + 100,
      recordsProcessed: Math.floor(Math.random() * 10000),
      dataSize: Math.floor(Math.random() * 1000000)
    };

    const duration = Math.random() * 5000 + 1000; // 1-6 seconds

    return {
      outputs: { status: 'simulated', timestamp: new Date().toISOString() },
      metrics: baseMetrics,
      duration
    };
  }

  /**
   * Poll tool execution status
   */
  private async pollToolExecution(
    node: RealNode,
    nodeExecution: NodeExecution,
    executionId: string
  ): Promise<void> {
    const apiEndpoint = node.reality.integration.apiEndpoint;
    const maxPolls = 300; // 5 minutes with 1-second intervals
    let polls = 0;

    while (polls < maxPolls) {
      const response = await fetch(`${apiEndpoint}/status/${executionId}`, {
        headers: this.getAuthHeaders(node.reality.source)
      });

      if (!response.ok) {
        throw new Error(`Failed to poll execution status: ${response.status}`);
      }

      const status = await response.json();

      if (status.state === 'completed') {
        nodeExecution.outputs = status.outputs;
        nodeExecution.metrics = status.metrics;
        return;
      } else if (status.state === 'failed') {
        throw new Error(status.error || 'Tool execution failed');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      polls++;
    }

    throw new Error('Tool execution timeout');
  }

  /**
   * Helper methods
   */
  private generateRunId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addGlobalLog(
    execution: PipelineExecution,
    level: ExecutionLog['level'],
    message: string
  ): void {
    execution.globalLogs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      source: 'engine'
    });
  }

  private addNodeLog(
    nodeExecution: NodeExecution,
    level: ExecutionLog['level'],
    message: string
  ): void {
    nodeExecution.logs!.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      source: 'node'
    });
  }

  private getAuthHeaders(source: PipelineSource): Record<string, string> {
    // Return appropriate auth headers based on source
    // This would be configured per environment
    return {};
  }

  private calculateBackoffDelay(retryCount: number): number {
    if (this.strategy.retryPolicy.backoffStrategy === 'exponential') {
      return Math.min(1000 * Math.pow(2, retryCount - 1), 30000);
    } else {
      return 1000 * retryCount;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clean up MCP clients
    for (const [server, client] of this.mcpClients) {
      try {
        client.disconnect();
      } catch (error) {
        console.warn(`Failed to disconnect from ${server}:`, error);
      }
    }
    this.mcpClients.clear();

    // Clear executions older than 24 hours
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [runId, execution] of this.executions) {
      if (new Date(execution.startTime).getTime() < cutoff) {
        this.executions.delete(runId);
      }
    }
  }
}