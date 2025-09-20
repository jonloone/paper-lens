// API Gateway - Unified interface for all tool operations via MCPs

import { MCPOrchestrator } from './MCPOrchestrator';

export interface DataAPI {
  id: string;
  name: string;
  endpoint: string;
  description?: string;
  method: string;
  schema?: any;
  lastUsed?: Date;
  usageCount?: number;
}

export interface HostedApp {
  id: string;
  name: string;
  description: string;
  url: string;
  icon?: string;
  category: string;
}

export class APIGateway {
  private orchestrator: MCPOrchestrator;
  private dataAPIs: Map<string, DataAPI> = new Map();
  
  constructor() {
    this.orchestrator = new MCPOrchestrator();
    this.initializeDataAPIs();
  }
  
  private initializeDataAPIs() {
    // These would be dynamically generated from saved queries and data products
    // For now, mock some examples
    const apis = [
      {
        id: 'customer_revenue',
        name: 'Customer Revenue API',
        endpoint: '/api/data/customer_revenue',
        description: 'Get customer revenue metrics',
        method: 'GET',
        schema: {
          parameters: {
            start_date: 'string',
            end_date: 'string',
            customer_id: 'string?',
          },
        },
      },
      {
        id: 'product_inventory',
        name: 'Product Inventory API',
        endpoint: '/api/data/product_inventory',
        description: 'Get current product inventory levels',
        method: 'GET',
        schema: {
          parameters: {
            category: 'string?',
            warehouse: 'string?',
          },
        },
      },
      {
        id: 'sales_forecast',
        name: 'Sales Forecast API',
        endpoint: '/api/data/sales_forecast',
        description: 'Get sales forecast data',
        method: 'GET',
        schema: {
          parameters: {
            period: 'string',
            region: 'string?',
          },
        },
      },
    ];
    
    apis.forEach(api => {
      this.dataAPIs.set(api.id, {
        ...api,
        lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        usageCount: Math.floor(Math.random() * 1000),
      });
    });
  }
  
  async listDataAPIs(): Promise<DataAPI[]> {
    // In production, this would fetch from a registry or database
    // Could also query DataHub for datasets with API endpoints
    try {
      const datasets = await this.orchestrator.callTool('datahub', 'listDatasets', {
        filter: { hasAPI: true },
      });
      
      // Merge with local APIs
      return Array.from(this.dataAPIs.values());
    } catch (error) {
      // Fallback to local APIs if MCP call fails
      return Array.from(this.dataAPIs.values());
    }
  }
  
  async getHostedApps(): Promise<HostedApp[]> {
    // These are the integrated tools that NexusOne orchestrates
    const apps: HostedApp[] = [
      {
        id: 'datahub',
        name: 'Global Data Catalog',
        description: 'Browse and manage data assets',
        url: process.env.NEXT_PUBLIC_DATAHUB_URL || 'http://localhost:9002',
        icon: 'Database',
        category: 'catalog',
      },
      {
        id: 'airflow',
        name: 'Data Orchestration',
        description: 'Manage and monitor data pipelines',
        url: process.env.NEXT_PUBLIC_AIRFLOW_URL || 'http://localhost:8080',
        icon: 'GitBranch',
        category: 'orchestration',
      },
      {
        id: 'trino',
        name: 'Federated Query Engine',
        description: 'Query data across multiple sources',
        url: process.env.NEXT_PUBLIC_TRINO_URL || 'http://localhost:8080',
        icon: 'Search',
        category: 'query',
      },
      {
        id: 'nifi',
        name: 'NiFi Flow and Streams',
        description: 'Design and manage data flows',
        url: process.env.NEXT_PUBLIC_NIFI_URL || 'http://localhost:8443/nifi',
        icon: 'Zap',
        category: 'ingestion',
      },
      {
        id: 'ranger',
        name: 'Data Policy Engine',
        description: 'Manage data access and security policies',
        url: process.env.NEXT_PUBLIC_RANGER_URL || 'http://localhost:6080',
        icon: 'Shield',
        category: 'security',
      },
      {
        id: 'mlflow',
        name: 'Data Science Workbench',
        description: 'ML experiments and model management',
        url: process.env.NEXT_PUBLIC_MLFLOW_URL || 'http://localhost:5000',
        icon: 'Brain',
        category: 'ml',
      },
      {
        id: 'superset',
        name: 'BI Workbench',
        description: 'Create dashboards and visualizations',
        url: process.env.NEXT_PUBLIC_SUPERSET_URL || 'http://localhost:8088',
        icon: 'BarChart',
        category: 'analytics',
      },
      {
        id: 'nexusone-api',
        name: 'NexusOne API',
        description: 'Access NexusOne programmatically',
        url: '/api/docs',
        icon: 'Code',
        category: 'api',
      },
    ];
    
    // Check health of each app
    const healthPromises = apps.map(async app => {
      try {
        const health = await this.orchestrator.getServerHealth(app.id);
        return { ...app, available: health.status === 'healthy' };
      } catch {
        return { ...app, available: false };
      }
    });
    
    return await Promise.all(healthPromises);
  }
  
  async executeDataAPI(apiId: string, params: any): Promise<any> {
    const api = this.dataAPIs.get(apiId);
    if (!api) {
      throw new Error(`Data API ${apiId} not found`);
    }
    
    // Update usage stats
    api.lastUsed = new Date();
    api.usageCount = (api.usageCount || 0) + 1;
    
    // Execute the underlying query via Trino MCP
    try {
      const result = await this.orchestrator.callTool('trino', 'executeQuery', {
        sql: this.buildSQLFromAPI(api, params),
        catalog: 'hive',
        schema: 'default',
      });
      
      return {
        success: true,
        data: result,
        metadata: {
          api: apiId,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          api: apiId,
          timestamp: new Date(),
        },
      };
    }
  }
  
  private buildSQLFromAPI(api: DataAPI, params: any): string {
    // This would be more sophisticated in production
    // For now, simple template-based SQL generation
    const templates: Record<string, string> = {
      customer_revenue: `
        SELECT customer_id, SUM(amount) as revenue
        FROM orders
        WHERE order_date BETWEEN '${params.start_date}' AND '${params.end_date}'
        ${params.customer_id ? `AND customer_id = '${params.customer_id}'` : ''}
        GROUP BY customer_id
      `,
      product_inventory: `
        SELECT product_id, product_name, quantity, warehouse
        FROM inventory
        WHERE 1=1
        ${params.category ? `AND category = '${params.category}'` : ''}
        ${params.warehouse ? `AND warehouse = '${params.warehouse}'` : ''}
      `,
      sales_forecast: `
        SELECT period, region, forecast_amount
        FROM sales_forecast
        WHERE period = '${params.period}'
        ${params.region ? `AND region = '${params.region}'` : ''}
      `,
    };
    
    return templates[api.id] || 'SELECT 1';
  }
  
  // Crew/Task Management via Airflow
  async getCrewTasks(): Promise<any[]> {
    try {
      const tasks = await this.orchestrator.callTool('airflow', 'listTasks', {
        limit: 100,
      });
      
      return tasks.map((task: any) => ({
        id: task.task_id,
        type: task.operator,
        priority: task.priority_weight || 1,
        status: task.state,
        submitted: task.start_date,
      }));
    } catch (error) {
      console.error('Failed to fetch crew tasks:', error);
      return [];
    }
  }
  
  async submitCrewTask(task: {
    type: string;
    priority: number;
    config: any;
  }): Promise<any> {
    try {
      return await this.orchestrator.callTool('airflow', 'createTask', task);
    } catch (error) {
      throw new Error(`Failed to submit task: ${error}`);
    }
  }
  
  // MCP Server Management
  async getMCPServers(): Promise<any[]> {
    const health = await this.orchestrator.aggregateHealth();
    
    return health.map(h => ({
      name: h.service,
      status: h.status,
      latency: h.latency,
      lastCheck: h.lastCheck,
      details: h.details,
    }));
  }
  
  // Cross-tool workflows
  async investigatePipelineFailure(pipelineId: string): Promise<any> {
    const workflow = [
      {
        server: 'airflow',
        tool: 'getDAGRun',
        args: { dag_id: pipelineId },
      },
      {
        server: 'airflow',
        tool: 'getTaskLogs',
        args: { dag_id: pipelineId, task_id: 'failed_task' },
      },
      {
        server: 'trino',
        tool: 'checkTableHealth',
        args: { tables: ['upstream_table'] },
      },
      {
        server: 'datahub',
        tool: 'checkSchemaChanges',
        args: { dataset: pipelineId },
      },
    ];
    
    const results = await this.orchestrator.executeWorkflow(workflow);
    
    // Analyze results and provide insights
    return {
      pipeline: pipelineId,
      status: 'failed',
      rootCause: this.analyzeFailure(results),
      recommendations: this.generateRecommendations(results),
      logs: results,
    };
  }
  
  private analyzeFailure(results: any[]): string {
    // Simple analysis logic - would be more sophisticated with AI
    if (results[0]?.data?.error?.includes('connection')) {
      return 'Database connection failure';
    }
    if (results[2]?.data?.missing) {
      return 'Upstream table missing or corrupted';
    }
    if (results[3]?.data?.schemaChanged) {
      return 'Schema change detected in upstream data';
    }
    return 'Unknown failure - manual investigation required';
  }
  
  private generateRecommendations(results: any[]): string[] {
    const recommendations = [];
    
    if (results[0]?.data?.error?.includes('connection')) {
      recommendations.push('Check database credentials and network connectivity');
      recommendations.push('Verify firewall rules and security groups');
    }
    
    if (results[2]?.data?.missing) {
      recommendations.push('Re-run upstream pipeline to regenerate table');
      recommendations.push('Check source data availability');
    }
    
    if (results[3]?.data?.schemaChanged) {
      recommendations.push('Update pipeline to handle new schema');
      recommendations.push('Add schema evolution handling');
    }
    
    return recommendations;
  }
}