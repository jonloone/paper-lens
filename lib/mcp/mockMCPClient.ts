import { MOCK_MCP_SERVERS as mockMCPServers } from './mockMCPRegistry';

interface MCPRequest {
  method: string;
  params?: any;
}

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface ExecutionState {
  nodeId: string;
  status: 'idle' | 'running' | 'success' | 'error';
  progress: number;
  logs: string[];
  metrics?: Record<string, any>;
  error?: string;
}

export class MockMCPClient {
  private url: string;
  private serverType: string;
  private connected: boolean = false;
  private executionStates: Map<string, ExecutionState> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  
  constructor(url: string) {
    this.url = url;
    // Extract server type from URL (e.g., 'mcp://nifi:3000' -> 'nifi')
    const match = url.match(/mcp:\/\/([^:]+)/);
    this.serverType = match ? match[1] : 'unknown';
  }
  
  async connect(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    console.log(`[MockMCP] Connected to ${this.serverType} server at ${this.url}`);
  }
  
  async disconnect(): Promise<void> {
    this.connected = false;
    this.executionStates.clear();
    console.log(`[MockMCP] Disconnected from ${this.serverType} server`);
  }
  
  get isConnected(): boolean {
    return this.connected;
  }
  
  async request(method: string, params?: any): Promise<any> {
    if (!this.connected) {
      throw new Error(`Not connected to ${this.serverType} MCP server`);
    }
    
    console.log(`[MockMCP] ${this.serverType} -> ${method}`, params);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
    
    switch (method) {
      case 'getCapabilities':
        return this.handleGetCapabilities();
        
      case 'validateConfig':
        return this.handleValidateConfig(params);
        
      case 'testConnection':
        return this.handleTestConnection(params);
        
      case 'execute':
        return this.handleExecute(params);
        
      case 'stop':
        return this.handleStop(params);
        
      case 'getStatus':
        return this.handleGetStatus(params);
        
      case 'getLogs':
        return this.handleGetLogs(params);
        
      case 'getMetrics':
        return this.handleGetMetrics(params);
        
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }
  
  subscribe(event: string, handler: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }
  
  private emit(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
  
  private handleGetCapabilities(): any {
    const server = mockMCPServers.find(s => s.name === this.serverType);
    if (!server) {
      throw new Error(`Unknown server type: ${this.serverType}`);
    }
    
    return {
      name: server.name,
      version: server.version,
      description: server.description,
      capabilities: server.capabilities,
      nodeTypes: server.nodeTypes.map(nt => ({
        type: nt.type,
        label: nt.label,
        category: nt.category,
        icon: nt.icon,
        description: nt.description,
        inputs: nt.inputs,
        outputs: nt.outputs,
        configSchema: nt.configSchema
      }))
    };
  }
  
  private handleValidateConfig(params: any): any {
    const { nodeType, config } = params;
    
    // Find the node type definition
    const server = mockMCPServers.find(s => s.name === this.serverType);
    const nodeTypeDef = server?.nodeTypes.find(nt => nt.type === nodeType);
    
    if (!nodeTypeDef) {
      return {
        valid: false,
        errors: [`Unknown node type: ${nodeType}`]
      };
    }
    
    // Simulate validation
    const errors: string[] = [];
    
    if (nodeTypeDef.configSchema?.required) {
      for (const field of nodeTypeDef.configSchema.required) {
        if (!config[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    // Add some random validation for demo
    if (Math.random() > 0.8 && !errors.length) {
      errors.push('Connection timeout to remote server');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private handleTestConnection(params: any): any {
    const { nodeType, config } = params;
    
    // Simulate connection test with random success
    const success = Math.random() > 0.2;
    
    if (success) {
      return {
        success: true,
        message: `Successfully connected to ${this.serverType} with configuration`,
        details: {
          latency: Math.floor(Math.random() * 100) + 20,
          version: '1.0.0',
          capabilities: ['read', 'write', 'stream']
        }
      };
    } else {
      return {
        success: false,
        error: 'Connection failed: Unable to reach server',
        details: {
          host: config.host || 'localhost',
          port: config.port || 8080,
          timeout: 5000
        }
      };
    }
  }
  
  private handleExecute(params: any): any {
    const { nodeId, config } = params;
    
    // Initialize execution state
    const state: ExecutionState = {
      nodeId,
      status: 'running',
      progress: 0,
      logs: [`Starting ${this.serverType} node execution...`],
      metrics: {}
    };
    
    this.executionStates.set(nodeId, state);
    
    // Simulate execution progress
    this.simulateExecution(nodeId);
    
    return {
      success: true,
      executionId: `exec-${nodeId}-${Date.now()}`,
      message: 'Execution started'
    };
  }
  
  private async simulateExecution(nodeId: string): Promise<void> {
    const state = this.executionStates.get(nodeId);
    if (!state) return;
    
    // Emit initial status
    this.emit('status', {
      nodeId,
      status: 'running',
      progress: 0
    });
    
    // Simulate progress updates
    const steps = 5 + Math.floor(Math.random() * 5);
    const success = Math.random() > 0.2;
    
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
      
      const progress = Math.floor((i / steps) * 100);
      state.progress = progress;
      state.logs.push(`[${new Date().toISOString()}] Processing step ${i}/${steps}...`);
      
      // Update metrics
      state.metrics = {
        recordsProcessed: Math.floor(Math.random() * 10000) * i,
        processingTime: i * 1000 + Math.random() * 500,
        memoryUsage: 50 + Math.random() * 30,
        cpuUsage: 30 + Math.random() * 50
      };
      
      // Emit progress update
      this.emit('progress', {
        nodeId,
        progress,
        metrics: state.metrics
      });
      
      // Emit log
      this.emit('log', {
        nodeId,
        message: state.logs[state.logs.length - 1]
      });
      
      // Random chance of warning
      if (Math.random() > 0.7) {
        const warning = `Warning: High memory usage detected (${state.metrics.memoryUsage.toFixed(1)}%)`;
        state.logs.push(warning);
        this.emit('warning', {
          nodeId,
          message: warning
        });
      }
    }
    
    // Final status
    if (success) {
      state.status = 'success';
      state.logs.push(`[${new Date().toISOString()}] Execution completed successfully`);
      state.metrics!.totalRecords = Math.floor(Math.random() * 100000) + 10000;
      
      this.emit('status', {
        nodeId,
        status: 'success',
        progress: 100,
        metrics: state.metrics
      });
    } else {
      state.status = 'error';
      state.error = 'Processing failed: Data validation error in input stream';
      state.logs.push(`[${new Date().toISOString()}] ERROR: ${state.error}`);
      
      this.emit('status', {
        nodeId,
        status: 'error',
        error: state.error
      });
    }
  }
  
  private handleStop(params: any): any {
    const { nodeId } = params;
    const state = this.executionStates.get(nodeId);
    
    if (!state) {
      return {
        success: false,
        error: 'No execution found for node'
      };
    }
    
    if (state.status !== 'running') {
      return {
        success: false,
        error: 'Node is not running'
      };
    }
    
    state.status = 'idle';
    state.logs.push(`[${new Date().toISOString()}] Execution stopped by user`);
    
    this.emit('status', {
      nodeId,
      status: 'idle'
    });
    
    return {
      success: true,
      message: 'Execution stopped'
    };
  }
  
  private handleGetStatus(params: any): any {
    const { nodeId } = params;
    const state = this.executionStates.get(nodeId);
    
    if (!state) {
      return {
        status: 'idle',
        progress: 0
      };
    }
    
    return {
      status: state.status,
      progress: state.progress,
      metrics: state.metrics,
      error: state.error
    };
  }
  
  private handleGetLogs(params: any): any {
    const { nodeId, limit = 100 } = params;
    const state = this.executionStates.get(nodeId);
    
    if (!state) {
      return {
        logs: []
      };
    }
    
    return {
      logs: state.logs.slice(-limit)
    };
  }
  
  private handleGetMetrics(params: any): any {
    const { nodeId } = params;
    const state = this.executionStates.get(nodeId);
    
    if (!state || !state.metrics) {
      return {
        metrics: {}
      };
    }
    
    return {
      metrics: state.metrics,
      timestamp: Date.now()
    };
  }
}

// Export a factory function for creating mock clients
export function createMockMCPClient(url: string): MockMCPClient {
  return new MockMCPClient(url);
}