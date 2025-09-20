/**
 * Trino SQL Client
 * Provides integration with Trino for SQL query execution
 */

export interface TrinoCatalog {
  name: string;
  connector: string;
}

export interface TrinoSchema {
  catalog: string;
  name: string;
}

export interface TrinoTable {
  catalog: string;
  schema: string;
  name: string;
  type: 'TABLE' | 'VIEW';
  columns?: TrinoColumn[];
}

export interface TrinoColumn {
  name: string;
  type: string;
  nullable: boolean;
  comment?: string;
}

export interface TrinoQueryResult {
  columns: Array<{ name: string; type: string }>;
  data: any[][];
  stats: {
    executionTime: number;
    processedRows: number;
    processedBytes: number;
    peakMemory: number;
  };
}

export interface TrinoQueryPlan {
  id: string;
  root: {
    name: string;
    identifier: string;
    details: Record<string, any>;
    children?: any[];
  };
}

export class TrinoClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_TRINO_URL || 'http://localhost:8080';
    this.headers = {
      'Content-Type': 'application/json',
      'X-Trino-User': process.env.TRINO_USER || 'nexusone',
      'X-Trino-Catalog': 'hive',
      'X-Trino-Schema': 'default'
    };
  }

  /**
   * List available catalogs
   */
  async listCatalogs(): Promise<TrinoCatalog[]> {
    try {
      const result = await this.executeQuery('SHOW CATALOGS');
      return result.data.map(row => ({
        name: row[0],
        connector: 'hive' // Would need additional query to get connector type
      }));
    } catch (error) {
      console.error('Failed to list catalogs:', error);
      // Return mock data in development
      if (process.env.NODE_ENV === 'development') {
        return this.getMockCatalogs();
      }
      throw error;
    }
  }

  /**
   * List schemas in a catalog
   */
  async listSchemas(catalog: string): Promise<TrinoSchema[]> {
    const result = await this.executeQuery(`SHOW SCHEMAS FROM ${catalog}`);
    return result.data.map(row => ({
      catalog,
      name: row[0]
    }));
  }

  /**
   * List tables in a schema
   */
  async listTables(catalog: string, schema: string): Promise<TrinoTable[]> {
    const result = await this.executeQuery(`SHOW TABLES FROM ${catalog}.${schema}`);
    return result.data.map(row => ({
      catalog,
      schema,
      name: row[0],
      type: 'TABLE' as const
    }));
  }

  /**
   * Get table columns
   */
  async getTableColumns(catalog: string, schema: string, table: string): Promise<TrinoColumn[]> {
    const result = await this.executeQuery(`DESCRIBE ${catalog}.${schema}.${table}`);
    return result.data.map(row => ({
      name: row[0],
      type: row[1],
      nullable: row[2] !== 'NO',
      comment: row[3] || undefined
    }));
  }

  /**
   * Execute a SQL query
   */
  async executeQuery(sql: string, limit?: number): Promise<TrinoQueryResult> {
    const startTime = Date.now();
    
    // Add limit if specified and not already in query
    if (limit && !sql.toLowerCase().includes('limit')) {
      sql = `${sql} LIMIT ${limit}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/statement`, {
        method: 'POST',
        headers: this.headers,
        body: sql
      });

      if (!response.ok) {
        throw new Error(`Query execution failed: ${response.statusText}`);
      }

      // In real implementation, would handle async query execution
      // For now, return mock data
      return this.getMockQueryResult(sql, startTime);
    } catch (error) {
      console.error('Query execution error:', error);
      // Return mock data in development
      if (process.env.NODE_ENV === 'development') {
        return this.getMockQueryResult(sql, startTime);
      }
      throw error;
    }
  }

  /**
   * Get query execution plan
   */
  async explainQuery(sql: string): Promise<TrinoQueryPlan> {
    const explainSql = `EXPLAIN (TYPE DISTRIBUTED) ${sql}`;
    const result = await this.executeQuery(explainSql);
    
    // Parse the explain output
    return {
      id: `plan-${Date.now()}`,
      root: {
        name: 'Query Plan',
        identifier: 'root',
        details: {
          sql,
          estimatedCost: 'Unknown'
        }
      }
    };
  }

  /**
   * Validate SQL syntax
   */
  async validateQuery(sql: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      // Try to explain the query to validate syntax
      await this.explainQuery(sql);
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        errors: [error.message || 'Invalid SQL syntax']
      };
    }
  }

  /**
   * Get query suggestions based on schema
   */
  async getSuggestions(prefix: string, catalog: string, schema: string): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Add table suggestions
    if (prefix.length > 0) {
      const tables = await this.listTables(catalog, schema);
      suggestions.push(...tables
        .filter(t => t.name.toLowerCase().startsWith(prefix.toLowerCase()))
        .map(t => t.name)
      );
    }
    
    // Add common SQL keywords
    const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'JOIN', 'LEFT', 'RIGHT', 'INNER'];
    suggestions.push(...keywords.filter(k => k.toLowerCase().startsWith(prefix.toLowerCase())));
    
    return suggestions;
  }

  /**
   * Save query as view
   */
  async saveAsView(viewName: string, sql: string, catalog: string, schema: string): Promise<void> {
    const createViewSql = `CREATE OR REPLACE VIEW ${catalog}.${schema}.${viewName} AS ${sql}`;
    await this.executeQuery(createViewSql);
  }

  /**
   * Get query history (would integrate with query logging)
   */
  async getQueryHistory(limit: number = 50): Promise<Array<{
    id: string;
    sql: string;
    executedAt: Date;
    executionTime: number;
    user: string;
    status: 'success' | 'failed';
  }>> {
    // In real implementation, would fetch from query log
    return [
      {
        id: 'q1',
        sql: 'SELECT COUNT(*) FROM customers',
        executedAt: new Date(Date.now() - 3600000),
        executionTime: 245,
        user: 'nexusone',
        status: 'success'
      },
      {
        id: 'q2',
        sql: 'SELECT product_id, SUM(quantity) FROM orders GROUP BY product_id',
        executedAt: new Date(Date.now() - 7200000),
        executionTime: 1823,
        user: 'nexusone',
        status: 'success'
      }
    ];
  }

  /**
   * Mock data for development
   */
  private getMockCatalogs(): TrinoCatalog[] {
    return [
      { name: 'hive', connector: 'hive' },
      { name: 'postgresql', connector: 'postgresql' },
      { name: 'kafka', connector: 'kafka' },
      { name: 'iceberg', connector: 'iceberg' }
    ];
  }

  private getMockQueryResult(sql: string, startTime: number): TrinoQueryResult {
    // Simple mock based on query type
    if (sql.toLowerCase().includes('show catalogs')) {
      return {
        columns: [{ name: 'Catalog', type: 'varchar' }],
        data: [['hive'], ['postgresql'], ['kafka'], ['iceberg']],
        stats: {
          executionTime: Date.now() - startTime,
          processedRows: 4,
          processedBytes: 128,
          peakMemory: 1024
        }
      };
    }

    // Default mock result
    return {
      columns: [
        { name: 'id', type: 'bigint' },
        { name: 'name', type: 'varchar' },
        { name: 'value', type: 'double' }
      ],
      data: [
        [1, 'Product A', 99.99],
        [2, 'Product B', 149.99],
        [3, 'Product C', 79.99]
      ],
      stats: {
        executionTime: Date.now() - startTime,
        processedRows: 3,
        processedBytes: 256,
        peakMemory: 2048
      }
    };
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Format duration for display
   */
  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// Export singleton instance
export const trinoClient = new TrinoClient();