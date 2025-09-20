/**
 * dbt Client
 * Provides integration with dbt for data transformation management
 */

export interface DbtProject {
  name: string;
  version: string;
  path: string;
  profile: string;
  models: number;
  tests: number;
  sources: number;
}

export interface DbtModel {
  unique_id: string;
  name: string;
  description: string;
  database: string;
  schema: string;
  alias: string;
  materialization: 'table' | 'view' | 'incremental' | 'ephemeral';
  tags: string[];
  depends_on: string[];
  config: Record<string, any>;
  sql?: string;
}

export interface DbtTest {
  unique_id: string;
  name: string;
  model: string;
  column_name?: string;
  test_type: string;
  severity: 'error' | 'warn';
  status?: 'pass' | 'fail' | 'skip';
  message?: string;
}

export interface DbtRunResult {
  run_id: string;
  status: 'success' | 'error' | 'partial';
  started_at: Date;
  completed_at: Date;
  models_run: number;
  models_passed: number;
  models_failed: number;
  execution_time: number;
  logs: string[];
}

export interface DbtManifest {
  nodes: Record<string, DbtModel>;
  sources: Record<string, any>;
  tests: Record<string, DbtTest>;
  macros: Record<string, any>;
}

export class DbtClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    // Could be dbt Cloud API or local dbt RPC server
    this.baseUrl = process.env.NEXT_PUBLIC_DBT_URL || 'http://localhost:8580';
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Token ${process.env.DBT_API_TOKEN || ''}`
    };
  }

  /**
   * List dbt projects
   */
  async listProjects(): Promise<DbtProject[]> {
    try {
      // In production, would query dbt Cloud API or scan Git repos
      return this.getMockProjects();
    } catch (error) {
      console.error('Failed to list projects:', error);
      return this.getMockProjects();
    }
  }

  /**
   * Get project manifest
   */
  async getManifest(projectPath: string): Promise<DbtManifest> {
    // In production, would parse manifest.json from project
    return {
      nodes: this.getMockModels().reduce((acc, model) => {
        acc[model.unique_id] = model;
        return acc;
      }, {} as Record<string, DbtModel>),
      sources: {},
      tests: {},
      macros: {}
    };
  }

  /**
   * List models in a project
   */
  async listModels(projectPath: string): Promise<DbtModel[]> {
    try {
      const manifest = await this.getManifest(projectPath);
      return Object.values(manifest.nodes);
    } catch (error) {
      console.error('Failed to list models:', error);
      return this.getMockModels();
    }
  }

  /**
   * Get model details including SQL
   */
  async getModel(projectPath: string, modelName: string): Promise<DbtModel> {
    const models = await this.listModels(projectPath);
    const model = models.find(m => m.name === modelName);
    
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }
    
    // In production, would read SQL file
    model.sql = this.getMockModelSQL(modelName);
    return model;
  }

  /**
   * Run dbt models
   */
  async runModels(
    projectPath: string, 
    options: {
      models?: string[];
      exclude?: string[];
      fullRefresh?: boolean;
      threads?: number;
    } = {}
  ): Promise<DbtRunResult> {
    const startTime = Date.now();
    
    // In production, would execute dbt run command via RPC or subprocess
    // For now, simulate execution
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          run_id: `run-${Date.now()}`,
          status: 'success',
          started_at: new Date(startTime),
          completed_at: new Date(),
          models_run: options.models?.length || 5,
          models_passed: options.models?.length || 5,
          models_failed: 0,
          execution_time: Date.now() - startTime,
          logs: [
            'Running dbt...',
            'Found 5 models, 3 tests, 2 sources',
            'Model staging.stg_customers... SUCCESS',
            'Model staging.stg_orders... SUCCESS',
            'Model marts.dim_customers... SUCCESS',
            'Model marts.fct_orders... SUCCESS',
            'Model analytics.customer_ltv... SUCCESS',
            'Completed successfully'
          ]
        });
      }, 2000);
    });
  }

  /**
   * Run dbt tests
   */
  async runTests(
    projectPath: string,
    options: {
      models?: string[];
      select?: string;
    } = {}
  ): Promise<DbtTest[]> {
    // In production, would execute dbt test command
    return [
      {
        unique_id: 'test.project.not_null_customers_customer_id',
        name: 'not_null_customers_customer_id',
        model: 'customers',
        column_name: 'customer_id',
        test_type: 'not_null',
        severity: 'error',
        status: 'pass'
      },
      {
        unique_id: 'test.project.unique_customers_customer_id',
        name: 'unique_customers_customer_id',
        model: 'customers',
        column_name: 'customer_id',
        test_type: 'unique',
        severity: 'error',
        status: 'pass'
      },
      {
        unique_id: 'test.project.relationships_orders_customer_id',
        name: 'relationships_orders_customer_id',
        model: 'orders',
        column_name: 'customer_id',
        test_type: 'relationships',
        severity: 'error',
        status: 'pass'
      }
    ];
  }

  /**
   * Compile dbt model SQL
   */
  async compileModel(projectPath: string, modelName: string): Promise<string> {
    // In production, would execute dbt compile for specific model
    const model = await this.getModel(projectPath, modelName);
    
    // Simulate Jinja compilation
    const compiledSql = model.sql?.replace(/\{\{.*?\}\}/g, (match) => {
      if (match.includes('ref')) {
        return 'analytics.table_name';
      }
      if (match.includes('source')) {
        return 'raw.source_table';
      }
      return match;
    });
    
    return compiledSql || '';
  }

  /**
   * Generate dbt documentation
   */
  async generateDocs(projectPath: string): Promise<{ success: boolean; url?: string }> {
    // In production, would execute dbt docs generate
    return {
      success: true,
      url: `${this.baseUrl}/docs/${projectPath}`
    };
  }

  /**
   * Create new dbt model
   */
  async createModel(
    projectPath: string,
    modelName: string,
    sql: string,
    config: {
      materialization?: 'table' | 'view' | 'incremental';
      schema?: string;
      tags?: string[];
    } = {}
  ): Promise<DbtModel> {
    // In production, would create .sql file in models directory
    const model: DbtModel = {
      unique_id: `model.project.${modelName}`,
      name: modelName,
      description: '',
      database: 'analytics',
      schema: config.schema || 'staging',
      alias: modelName,
      materialization: config.materialization || 'view',
      tags: config.tags || [],
      depends_on: [],
      config,
      sql
    };
    
    // Would write to file system or commit to Git
    console.log(`Creating model ${modelName} in ${projectPath}`);
    
    return model;
  }

  /**
   * Get lineage for a model
   */
  async getLineage(projectPath: string, modelName: string): Promise<{
    upstream: string[];
    downstream: string[];
  }> {
    // In production, would parse manifest for dependencies
    return {
      upstream: ['staging.stg_customers', 'staging.stg_orders'],
      downstream: ['analytics.customer_metrics', 'reporting.executive_dashboard']
    };
  }

  /**
   * Mock data for development
   */
  private getMockProjects(): DbtProject[] {
    return [
      {
        name: 'analytics',
        version: '1.0.0',
        path: '/projects/analytics',
        profile: 'analytics_prod',
        models: 45,
        tests: 120,
        sources: 15
      },
      {
        name: 'marketing',
        version: '1.0.0',
        path: '/projects/marketing',
        profile: 'marketing_prod',
        models: 23,
        tests: 67,
        sources: 8
      }
    ];
  }

  private getMockModels(): DbtModel[] {
    return [
      {
        unique_id: 'model.analytics.stg_customers',
        name: 'stg_customers',
        description: 'Staged customer data',
        database: 'analytics',
        schema: 'staging',
        alias: 'stg_customers',
        materialization: 'view',
        tags: ['staging', 'customers'],
        depends_on: ['source.raw.customers'],
        config: {}
      },
      {
        unique_id: 'model.analytics.dim_customers',
        name: 'dim_customers',
        description: 'Customer dimension table',
        database: 'analytics',
        schema: 'marts',
        alias: 'dim_customers',
        materialization: 'table',
        tags: ['marts', 'dimensions'],
        depends_on: ['model.analytics.stg_customers'],
        config: { sort: 'customer_id', dist: 'customer_id' }
      },
      {
        unique_id: 'model.analytics.fct_orders',
        name: 'fct_orders',
        description: 'Order fact table',
        database: 'analytics',
        schema: 'marts',
        alias: 'fct_orders',
        materialization: 'incremental',
        tags: ['marts', 'facts'],
        depends_on: ['model.analytics.stg_orders', 'model.analytics.dim_customers'],
        config: { unique_key: 'order_id', on_schema_change: 'fail' }
      }
    ];
  }

  private getMockModelSQL(modelName: string): string {
    const templates: Record<string, string> = {
      stg_customers: `
WITH source AS (
    SELECT * FROM {{ source('raw', 'customers') }}
),
renamed AS (
    SELECT
        id AS customer_id,
        email,
        first_name,
        last_name,
        created_at,
        updated_at
    FROM source
)
SELECT * FROM renamed`,
      dim_customers: `
WITH customers AS (
    SELECT * FROM {{ ref('stg_customers') }}
),
orders AS (
    SELECT * FROM {{ ref('stg_orders') }}
),
customer_orders AS (
    SELECT
        customer_id,
        COUNT(*) AS total_orders,
        SUM(amount) AS lifetime_value,
        MIN(order_date) AS first_order_date,
        MAX(order_date) AS last_order_date
    FROM orders
    GROUP BY customer_id
)
SELECT
    c.*,
    COALESCE(co.total_orders, 0) AS total_orders,
    COALESCE(co.lifetime_value, 0) AS lifetime_value,
    co.first_order_date,
    co.last_order_date
FROM customers c
LEFT JOIN customer_orders co USING (customer_id)`
    };
    
    return templates[modelName] || '-- Model SQL not found';
  }
}

// Export singleton instance
export const dbtClient = new DbtClient();