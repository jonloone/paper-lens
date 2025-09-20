import { NodeTypes } from 'reactflow';
import { MCPClient } from '../mcp/MCPClient';

export interface NodeTypeDefinition {
  type: string;
  category: string;
  label: string;
  icon: string;
  configSchema?: any;
  inputs?: Array<{ name: string; type: string }>;
  outputs?: Array<{ name: string; type: string }>;
  mcpServer: string;
  mcpTools: {
    create: string;
    configure: string;
    execute: string;
    stop?: string;
    getStatus: string;
  };
}

export interface MCPCapabilities {
  name: string;
  version: string;
  processors?: any[];
  operations?: any[];
  jobConfigSchema?: any;
  streamingConfigSchema?: any;
}

export interface MCPServerInfo {
  name: string;
  url: string;
  type: string;
  enabled: boolean;
}

export class NodeTypeRegistry {
  private nodeTypes: Map<string, NodeTypeDefinition> = new Map();
  private mcpServers: Map<string, MCPClient> = new Map();
  
  // Predefined MCP servers - in production, this would come from config
  private availableServers: MCPServerInfo[] = [
    { name: 'airbyte', url: 'mcp://airbyte:3000', type: 'airbyte', enabled: true },
    { name: 'nifi', url: 'mcp://nifi:3001', type: 'nifi', enabled: true },
    { name: 'spark', url: 'mcp://spark:3002', type: 'spark', enabled: true },
    { name: 'dbt', url: 'mcp://dbt:3003', type: 'dbt', enabled: true },
    { name: 'kafka', url: 'mcp://kafka:3004', type: 'kafka', enabled: true },
    { name: 'flink', url: 'mcp://flink:3005', type: 'flink', enabled: true },
    { name: 'airflow', url: 'mcp://airflow:3006', type: 'airflow', enabled: true },
    { name: 'snowflake', url: 'mcp://snowflake:3007', type: 'snowflake', enabled: true },
    { name: 'postgres', url: 'mcp://postgres:3008', type: 'postgres', enabled: true },
    { name: 's3', url: 'mcp://s3:3009', type: 's3', enabled: true },
    { name: 'trino', url: 'mcp://trino:3010', type: 'trino', enabled: true },
  ];

  async discoverMCPServers(): Promise<void> {
    console.log('Discovering MCP servers...');
    
    for (const server of this.availableServers) {
      if (!server.enabled) continue;
      
      try {
        // For now, we'll simulate the MCP connection
        // In production, this would actually connect to the MCP server
        const client = new MCPClient(server.url);
        const capabilities = await this.getMockCapabilities(server.name);
        
        // Register MCP server
        this.mcpServers.set(server.name, client);
        
        // Generate node types from capabilities
        const nodeTypes = this.generateNodeTypes(server.name, capabilities);
        
        for (const nodeType of nodeTypes) {
          this.nodeTypes.set(nodeType.type, nodeType);
        }
        
        console.log(`Discovered ${nodeTypes.length} node types from ${server.name}`);
      } catch (error) {
        console.error(`Failed to connect to ${server.name}:`, error);
      }
    }
  }
  
  private async getMockCapabilities(serverName: string): Promise<MCPCapabilities> {
    // Mock capabilities for different MCP servers
    switch (serverName) {
      case 'airbyte':
        return {
          name: 'Airbyte MCP Server',
          version: '1.0.0',
          operations: await this.getAirbyteConnectors()
        };
        
      case 'nifi':
        return {
          name: 'NiFi MCP Server',
          version: '1.0.0',
          processors: [
            { type: 'GetFile', name: 'Get File', icon: '📁', configSchema: this.getFileConfigSchema() },
            { type: 'PutFile', name: 'Put File', icon: '💾', configSchema: this.getFileConfigSchema() },
            { type: 'GetHTTP', name: 'HTTP Get', icon: '🌐', configSchema: this.getHTTPConfigSchema() },
            { type: 'ExecuteSQL', name: 'Execute SQL', icon: '🗄️', configSchema: this.getSQLConfigSchema() },
            { type: 'ConvertRecord', name: 'Convert Record', icon: '🔄', configSchema: this.getRecordConfigSchema() },
            { type: 'PutKafka', name: 'Kafka Producer', icon: '📤', configSchema: this.getKafkaConfigSchema() },
            { type: 'GetKafka', name: 'Kafka Consumer', icon: '📥', configSchema: this.getKafkaConfigSchema() },
          ]
        };
        
      case 'spark':
        return {
          name: 'Spark MCP Server',
          version: '1.0.0',
          jobConfigSchema: this.getSparkJobConfigSchema(),
          streamingConfigSchema: this.getSparkStreamingConfigSchema()
        };
        
      case 'dbt':
        return {
          name: 'DBT MCP Server',
          version: '1.0.0',
          operations: [
            { type: 'model', name: 'DBT Model', icon: '📊' },
            { type: 'source', name: 'DBT Source', icon: '📁' },
            { type: 'seed', name: 'DBT Seed', icon: '🌱' },
            { type: 'snapshot', name: 'DBT Snapshot', icon: '📸' },
            { type: 'test', name: 'DBT Test', icon: '✅' }
          ]
        };
        
      case 'kafka':
        return {
          name: 'Kafka MCP Server',
          version: '1.0.0',
          operations: [
            { type: 'producer', name: 'Kafka Producer', icon: '📤' },
            { type: 'consumer', name: 'Kafka Consumer', icon: '📥' },
            { type: 'stream', name: 'Kafka Stream', icon: '〰️' }
          ]
        };
        
      case 'flink':
        return {
          name: 'Flink MCP Server',
          version: '1.0.0',
          operations: [
            { type: 'source', name: 'Flink Source', icon: '📥' },
            { type: 'transform', name: 'Flink Transform', icon: '⚡' },
            { type: 'sink', name: 'Flink Sink', icon: '📤' },
            { type: 'window', name: 'Window Operation', icon: '⏱️' }
          ]
        };
        
      default:
        return {
          name: `${serverName} MCP Server`,
          version: '1.0.0',
          operations: [
            { type: 'source', name: `${serverName} Source`, icon: '📥' },
            { type: 'sink', name: `${serverName} Sink`, icon: '📤' }
          ]
        };
    }
  }
  
  private validateNodeType(nodeType: Partial<NodeTypeDefinition>): NodeTypeDefinition {
    return {
      type: nodeType.type || 'unknown',
      category: nodeType.category || 'uncategorized',
      label: nodeType.label || nodeType.type || 'Unknown',
      icon: nodeType.icon || '📦',
      configSchema: nodeType.configSchema || {},
      inputs: nodeType.inputs || [],
      outputs: nodeType.outputs || [],
      mcpServer: nodeType.mcpServer || 'unknown',
      mcpTools: nodeType.mcpTools || {
        create: 'unknown_create',
        configure: 'unknown_configure',
        execute: 'unknown_execute',
        getStatus: 'unknown_status'
      }
    };
  }

  private generateNodeTypes(serverName: string, capabilities: MCPCapabilities): NodeTypeDefinition[] {
    const nodeTypes: NodeTypeDefinition[] = [];
    
    if (serverName === 'nifi' && capabilities.processors) {
      // NiFi processors become individual node types
      for (const processor of capabilities.processors) {
        nodeTypes.push({
          type: `nifi-${processor.type.toLowerCase()}`,
          category: 'nifi',
          label: processor.name,
          icon: processor.icon || '🔧',
          configSchema: processor.configSchema,
          inputs: processor.type.startsWith('Get') ? [] : [{ name: 'input', type: 'flowfile' }],
          outputs: processor.type.startsWith('Put') ? [] : [{ name: 'output', type: 'flowfile' }],
          mcpServer: serverName,
          mcpTools: {
            create: 'nifi_create_processor',
            configure: 'nifi_configure_processor',
            execute: 'nifi_start_processor',
            stop: 'nifi_stop_processor',
            getStatus: 'nifi_get_metrics'
          }
        });
      }
    } else if (serverName === 'spark') {
      nodeTypes.push({
        type: 'spark-batch',
        category: 'spark',
        label: 'Spark Batch Job',
        icon: '⚡',
        configSchema: capabilities.jobConfigSchema,
        inputs: [{ name: 'input', type: 'dataset' }],
        outputs: [{ name: 'output', type: 'dataset' }],
        mcpServer: serverName,
        mcpTools: {
          create: 'spark_submit_job',
          configure: 'spark_configure_job',
          execute: 'spark_run_job',
          stop: 'spark_kill_job',
          getStatus: 'spark_get_job_status'
        }
      });
      
      nodeTypes.push({
        type: 'spark-streaming',
        category: 'spark',
        label: 'Spark Streaming',
        icon: '〰️',
        configSchema: capabilities.streamingConfigSchema,
        inputs: [{ name: 'stream', type: 'stream' }],
        outputs: [{ name: 'output', type: 'stream' }],
        mcpServer: serverName,
        mcpTools: {
          create: 'spark_create_streaming_job',
          configure: 'spark_configure_streaming',
          execute: 'spark_start_streaming',
          stop: 'spark_stop_streaming',
          getStatus: 'spark_get_streaming_metrics'
        }
      });
    } else if (capabilities.operations) {
      // Generic operations-based node generation
      for (const op of capabilities.operations) {
        nodeTypes.push({
          type: `${serverName}-${op.type}`,
          category: serverName,
          label: op.name,
          icon: op.icon || '📦',
          configSchema: op.configSchema,
          inputs: op.type === 'source' ? [] : [{ name: 'input', type: 'data' }],
          outputs: op.type === 'sink' ? [] : [{ name: 'output', type: 'data' }],
          mcpServer: serverName,
          mcpTools: {
            create: `${serverName}_create_${op.type}`,
            configure: `${serverName}_configure_${op.type}`,
            execute: `${serverName}_execute_${op.type}`,
            stop: `${serverName}_stop_${op.type}`,
            getStatus: `${serverName}_get_status`
          }
        });
      }
    }
    
    // Validate all node types before returning
    return nodeTypes.map(nt => this.validateNodeType(nt));
  }
  
  // Configuration schemas for different node types
  private getFileConfigSchema() {
    return {
      type: 'object',
      properties: {
        directory: { type: 'string', title: 'Directory Path' },
        fileFilter: { type: 'string', title: 'File Filter (regex)' },
        recursive: { type: 'boolean', title: 'Recursive' },
        keepSourceFile: { type: 'boolean', title: 'Keep Source File' }
      },
      required: ['directory']
    };
  }
  
  private getHTTPConfigSchema() {
    return {
      type: 'object',
      properties: {
        url: { type: 'string', title: 'URL' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], title: 'Method' },
        headers: { type: 'object', title: 'Headers' },
        timeout: { type: 'number', title: 'Timeout (ms)' }
      },
      required: ['url', 'method']
    };
  }
  
  private getSQLConfigSchema() {
    return {
      type: 'object',
      properties: {
        connectionString: { type: 'string', title: 'Connection String' },
        query: { type: 'string', title: 'SQL Query' },
        fetchSize: { type: 'number', title: 'Fetch Size' }
      },
      required: ['connectionString', 'query']
    };
  }
  
  private getRecordConfigSchema() {
    return {
      type: 'object',
      properties: {
        inputFormat: { type: 'string', enum: ['JSON', 'CSV', 'AVRO', 'XML'], title: 'Input Format' },
        outputFormat: { type: 'string', enum: ['JSON', 'CSV', 'AVRO', 'XML'], title: 'Output Format' },
        schema: { type: 'string', title: 'Schema (optional)' }
      },
      required: ['inputFormat', 'outputFormat']
    };
  }
  
  private getKafkaConfigSchema() {
    return {
      type: 'object',
      properties: {
        brokers: { type: 'string', title: 'Kafka Brokers' },
        topic: { type: 'string', title: 'Topic' },
        groupId: { type: 'string', title: 'Consumer Group ID' },
        securityProtocol: { type: 'string', enum: ['PLAINTEXT', 'SSL', 'SASL_SSL'], title: 'Security Protocol' }
      },
      required: ['brokers', 'topic']
    };
  }
  
  private getSparkJobConfigSchema() {
    return {
      type: 'object',
      properties: {
        mainClass: { type: 'string', title: 'Main Class' },
        jarPath: { type: 'string', title: 'JAR Path' },
        executors: { type: 'number', title: 'Number of Executors' },
        executorMemory: { type: 'string', title: 'Executor Memory' },
        executorCores: { type: 'number', title: 'Executor Cores' },
        driverMemory: { type: 'string', title: 'Driver Memory' }
      },
      required: ['mainClass', 'jarPath']
    };
  }
  
  private getSparkStreamingConfigSchema() {
    return {
      type: 'object',
      properties: {
        batchInterval: { type: 'number', title: 'Batch Interval (seconds)' },
        checkpointPath: { type: 'string', title: 'Checkpoint Path' },
        watermark: { type: 'string', title: 'Watermark' },
        outputMode: { type: 'string', enum: ['append', 'complete', 'update'], title: 'Output Mode' }
      },
      required: ['batchInterval']
    };
  }
  
  getNodeTypes(): Map<string, NodeTypeDefinition> {
    return this.nodeTypes;
  }
  
  getMCPClient(serverName: string): MCPClient | undefined {
    return this.mcpServers.get(serverName);
  }
  
  getNodeDefinition(nodeType: string): NodeTypeDefinition | undefined {
    return this.nodeTypes.get(nodeType);
  }
  
  // Dynamically discover Airbyte connectors
  private async getAirbyteConnectors(): Promise<any[]> {
    // In production, this would call Airbyte API to get available connectors
    // For now, return common connectors
    return [
      { type: 'postgres-source', name: 'PostgreSQL Source', icon: '🐘', category: 'database' },
      { type: 'mysql-source', name: 'MySQL Source', icon: '🐬', category: 'database' },
      { type: 'mongodb-source', name: 'MongoDB Source', icon: '🍃', category: 'database' },
      { type: 'salesforce-source', name: 'Salesforce Source', icon: '☁️', category: 'saas' },
      { type: 'google-sheets-source', name: 'Google Sheets Source', icon: '📊', category: 'saas' },
      { type: 'stripe-source', name: 'Stripe Source', icon: '💳', category: 'saas' },
      { type: 'github-source', name: 'GitHub Source', icon: '🐙', category: 'saas' },
      { type: 'slack-source', name: 'Slack Source', icon: '💬', category: 'saas' },
      { type: 's3-source', name: 'Amazon S3 Source', icon: '🪣', category: 'cloud' },
      { type: 'gcs-source', name: 'Google Cloud Storage Source', icon: '☁️', category: 'cloud' },
      { type: 'azure-blob-source', name: 'Azure Blob Storage Source', icon: '☁️', category: 'cloud' },
      { type: 'api-source', name: 'REST API Source', icon: '🌐', category: 'api' },
      { type: 'file-source', name: 'File Source (CSV/JSON)', icon: '📁', category: 'file' },
      { type: 'kafka-source', name: 'Kafka Source', icon: '📨', category: 'streaming' },
      { type: 'bigquery-destination', name: 'BigQuery Destination', icon: '🗄️', category: 'warehouse' },
      { type: 'snowflake-destination', name: 'Snowflake Destination', icon: '❄️', category: 'warehouse' },
      { type: 'redshift-destination', name: 'Redshift Destination', icon: '🏢', category: 'warehouse' },
      { type: 'postgres-destination', name: 'PostgreSQL Destination', icon: '🐘', category: 'database' },
      { type: 's3-destination', name: 'Amazon S3 Destination', icon: '🪣', category: 'cloud' }
    ];
  }
  
  // Get available tools based on user entitlements
  async getAvailableTools(userEntitlements?: string[]): Promise<MCPServerInfo[]> {
    // Filter servers based on user entitlements
    if (!userEntitlements) {
      return this.availableServers;
    }
    
    return this.availableServers.filter(server => 
      userEntitlements.includes(server.name) || 
      userEntitlements.includes('all')
    );
  }
  
  // Refresh node types based on available tools
  async refreshNodeTypes(userEntitlements?: string[]): Promise<void> {
    const availableTools = await this.getAvailableTools(userEntitlements);
    
    // Clear existing node types
    this.nodeTypes.clear();
    this.mcpServers.clear();
    
    // Re-discover based on available tools
    for (const server of availableTools) {
      if (!server.enabled) continue;
      
      try {
        const client = new MCPClient(server.url);
        const capabilities = await this.getMockCapabilities(server.name);
        
        this.mcpServers.set(server.name, client);
        const nodeTypes = this.generateNodeTypes(server.name, capabilities);
        
        for (const nodeType of nodeTypes) {
          this.nodeTypes.set(nodeType.type, nodeType);
        }
      } catch (error) {
        console.error(`Failed to connect to ${server.name}:`, error);
      }
    }
  }
}