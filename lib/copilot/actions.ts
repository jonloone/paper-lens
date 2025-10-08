/**
 * CopilotKit Frontend Actions for SQL Agent
 *
 * These actions allow the AI agent to directly interact with the application:
 * - Insert SQL into the editor
 * - Execute queries
 * - Fetch schema information
 * - Get sample data
 * - Explain and optimize queries
 */

export interface InsertSQLParams {
  sql: string;
  replace?: boolean;
}

export interface ExecuteQueryParams {
  sql: string;
  limit?: number;
}

export interface GetTableSchemaParams {
  catalog: string;
  schema: string;
  table: string;
}

export interface GetSampleDataParams {
  catalog: string;
  schema: string;
  table: string;
  limit?: number;
}

export interface ExplainQueryParams {
  sql: string;
}

export interface OptimizeQueryParams {
  sql: string;
  currentPerformance?: {
    executionTime?: number;
    rowsScanned?: number;
  };
}

export interface EstimateCostParams {
  sql: string;
}

// Action definitions for CopilotKit
export const SQL_AGENT_ACTIONS = {
  INSERT_SQL: 'insertSQL',
  EXECUTE_QUERY: 'executeQuery',
  GET_TABLE_SCHEMA: 'getTableSchema',
  GET_SAMPLE_DATA: 'getSampleData',
  EXPLAIN_QUERY: 'explainQuery',
  OPTIMIZE_QUERY: 'optimizeQuery',
  ESTIMATE_COST: 'estimateCost',
} as const;

// Action descriptions for the AI
export const ACTION_DESCRIPTIONS = {
  [SQL_AGENT_ACTIONS.INSERT_SQL]: {
    name: 'Insert SQL',
    description: 'Insert generated SQL into the editor. Use replace=true to replace existing SQL, or false to append.',
    parameters: {
      sql: 'The SQL query to insert',
      replace: 'Whether to replace existing SQL (default: false)'
    }
  },
  [SQL_AGENT_ACTIONS.EXECUTE_QUERY]: {
    name: 'Execute Query',
    description: 'Execute a SQL query and return preview results. Automatically limits results for safety.',
    parameters: {
      sql: 'The SQL query to execute',
      limit: 'Maximum number of rows to return (default: 100)'
    }
  },
  [SQL_AGENT_ACTIONS.GET_TABLE_SCHEMA]: {
    name: 'Get Table Schema',
    description: 'Retrieve the schema (columns, types, constraints) for a specific table.',
    parameters: {
      catalog: 'The catalog name (e.g., "iceberg")',
      schema: 'The schema name (e.g., "production")',
      table: 'The table name'
    }
  },
  [SQL_AGENT_ACTIONS.GET_SAMPLE_DATA]: {
    name: 'Get Sample Data',
    description: 'Fetch sample rows from a table to understand the data structure and values.',
    parameters: {
      catalog: 'The catalog name',
      schema: 'The schema name',
      table: 'The table name',
      limit: 'Number of sample rows (default: 10)'
    }
  },
  [SQL_AGENT_ACTIONS.EXPLAIN_QUERY]: {
    name: 'Explain Query',
    description: 'Analyze a SQL query and provide an explanation of what it does, including business logic.',
    parameters: {
      sql: 'The SQL query to explain'
    }
  },
  [SQL_AGENT_ACTIONS.OPTIMIZE_QUERY]: {
    name: 'Optimize Query',
    description: 'Analyze a SQL query and suggest optimizations for better performance.',
    parameters: {
      sql: 'The SQL query to optimize',
      currentPerformance: 'Optional current performance metrics'
    }
  },
  [SQL_AGENT_ACTIONS.ESTIMATE_COST]: {
    name: 'Estimate Cost',
    description: 'Estimate the computational cost and data scan volume for a SQL query.',
    parameters: {
      sql: 'The SQL query to estimate'
    }
  },
} as const;
