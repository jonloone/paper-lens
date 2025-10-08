'use client';

import React from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';
import {
  SQLWorkstationContext,
  SQLWorkstationContextActions,
  formatContextForAI,
  getRelevantTables,
  inferUserIntent,
} from '@/lib/copilot/context';
import {
  SQL_AGENT_ACTIONS,
  InsertSQLParams,
  ExecuteQueryParams,
  GetTableSchemaParams,
  GetSampleDataParams,
  ExplainQueryParams,
  OptimizeQueryParams,
  EstimateCostParams,
} from '@/lib/copilot/actions';
import {
  SQLResultPreview,
  TableSchemaExplorer,
  QueryOptimizationCard,
  CostEstimationCard,
} from './generative-ui';

interface TiSQLCopilotProviderProps {
  children: React.ReactNode;
  context: SQLWorkstationContext;
  actions: SQLWorkstationContextActions;
}

/**
 * Inner component that uses CopilotKit hooks
 * This must be inside the CopilotKit provider
 */
function TiSQLCopilotActions({ context, actions }: {
  context: SQLWorkstationContext;
  actions: SQLWorkstationContextActions;
}) {
  // Share context with the AI using useCopilotReadable
  useCopilotReadable({
    description: 'Current SQL Workstation Context',
    value: formatContextForAI(context),
  });

  // Share structured data for better AI understanding
  useCopilotReadable({
    description: 'SQL Editor State',
    value: {
      currentSQL: context.currentSQL,
      selectedText: context.selectedText,
      environment: context.environment,
      database: `${context.catalog}.${context.schema}`,
    },
  });

  useCopilotReadable({
    description: 'Available Data Sources',
    value: context.selectedSources.map(source => ({
      name: source.name,
      fullName: `${source.catalog}.${source.schema}.${source.name}`,
      columns: source.columns?.map(col => `${col.name} (${col.type})`),
    })),
  });

  useCopilotReadable({
    description: 'User Intent',
    value: inferUserIntent(context),
  });

  // ACTION 1: Insert SQL into editor
  useCopilotAction({
    name: SQL_AGENT_ACTIONS.INSERT_SQL,
    description: 'Insert or replace SQL in the editor. Use this when you generate SQL for the user.',
    parameters: [
      {
        name: 'sql',
        type: 'string',
        description: 'The SQL query to insert',
        required: true,
      },
      {
        name: 'replace',
        type: 'boolean',
        description: 'Whether to replace existing SQL (true) or append (false)',
        required: false,
      },
    ],
    handler: async ({ sql, replace = false }: InsertSQLParams) => {
      if (replace || !context.currentSQL) {
        actions.onSQLChange(sql);
      } else {
        actions.onSQLChange(context.currentSQL + '\n\n' + sql);
      }
      return { success: true, message: 'SQL inserted into editor' };
    },
  });

  // ACTION 2: Execute Query
  useCopilotAction({
    name: SQL_AGENT_ACTIONS.EXECUTE_QUERY,
    description: 'Execute a SQL query and return preview results. Always limit results for safety.',
    parameters: [
      {
        name: 'sql',
        type: 'string',
        description: 'The SQL query to execute',
        required: true,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum rows to return (default: 100)',
        required: false,
      },
    ],
    handler: async ({ sql, limit = 100 }: ExecuteQueryParams) => {
      try {
        // Add LIMIT if not present
        const limitedSQL = sql.toUpperCase().includes('LIMIT')
          ? sql
          : `${sql}\nLIMIT ${limit}`;

        const result = await actions.onExecuteQuery(limitedSQL);
        return {
          sql: limitedSQL,
          success: true,
          rowCount: result.rowCount,
          executionTime: result.executionTime,
          previewData: result.previewData?.slice(0, 10), // Only return first 10 for chat
        };
      } catch (error) {
        return {
          sql,
          success: false,
          error: error instanceof Error ? error.message : 'Query execution failed',
        };
      }
    },
    render: ({ status, result }) => {
      if (status === 'complete' && result) {
        return (
          <SQLResultPreview
            sql={result.sql || ''}
            rowCount={result.rowCount || 0}
            executionTime={result.executionTime || 0}
            previewData={result.previewData || []}
            success={result.success}
            error={result.error}
            onInsertToEditor={() => actions.onSQLChange(result.sql || '')}
            onRunFullQuery={() => actions.onExecuteQuery(result.sql || '')}
          />
        );
      }
      return null;
    },
  });

  // ACTION 3: Get Table Schema
  useCopilotAction({
    name: SQL_AGENT_ACTIONS.GET_TABLE_SCHEMA,
    description: 'Fetch the schema (columns, types, constraints) for a specific table.',
    parameters: [
      {
        name: 'catalog',
        type: 'string',
        description: 'The catalog name (e.g., "iceberg")',
        required: true,
      },
      {
        name: 'schema',
        type: 'string',
        description: 'The schema name (e.g., "production")',
        required: true,
      },
      {
        name: 'table',
        type: 'string',
        description: 'The table name',
        required: true,
      },
    ],
    handler: async ({ catalog, schema, table }: GetTableSchemaParams) => {
      try {
        // Mock implementation - in production, fetch from actual metadata service
        const source = context.selectedSources.find(s =>
          s.name === table && s.schema === schema && s.catalog === catalog
        );

        if (source && source.columns) {
          return {
            success: true,
            table: `${catalog}.${schema}.${table}`,
            columns: source.columns.map(col => ({
              name: col.name,
              type: col.type,
              nullable: col.nullable,
              description: col.description,
            })),
          };
        }

        // Fallback: return basic info
        return {
          success: true,
          table: `${catalog}.${schema}.${table}`,
          message: 'Schema information not available. Table exists in selected sources.',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch schema',
        };
      }
    },
  });

  // ACTION 4: Get Sample Data
  useCopilotAction({
    name: SQL_AGENT_ACTIONS.GET_SAMPLE_DATA,
    description: 'Fetch sample rows from a table to understand data structure and values.',
    parameters: [
      {
        name: 'catalog',
        type: 'string',
        description: 'The catalog name',
        required: true,
      },
      {
        name: 'schema',
        type: 'string',
        description: 'The schema name',
        required: true,
      },
      {
        name: 'table',
        type: 'string',
        description: 'The table name',
        required: true,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Number of sample rows (default: 10)',
        required: false,
      },
    ],
    handler: async ({ catalog, schema, table, limit = 10 }: GetSampleDataParams) => {
      try {
        const sampleSQL = `SELECT * FROM ${catalog}.${schema}.${table} LIMIT ${limit}`;
        const result = await actions.onExecuteQuery(sampleSQL);

        return {
          success: true,
          table: `${catalog}.${schema}.${table}`,
          sampleData: result.previewData,
          rowCount: result.rowCount,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch sample data',
        };
      }
    },
  });

  // ACTION 5: Explain Query
  useCopilotAction({
    name: SQL_AGENT_ACTIONS.EXPLAIN_QUERY,
    description: 'Analyze and explain what a SQL query does, including business logic.',
    parameters: [
      {
        name: 'sql',
        type: 'string',
        description: 'The SQL query to explain',
        required: true,
      },
    ],
    handler: async ({ sql }: ExplainQueryParams) => {
      // This action is informational - the AI will provide the explanation
      // We just acknowledge the request
      return {
        success: true,
        message: 'Query explanation generated',
        sql: sql,
      };
    },
  });

  // ACTION 6: Optimize Query
  useCopilotAction({
    name: SQL_AGENT_ACTIONS.OPTIMIZE_QUERY,
    description: 'Analyze SQL and suggest performance optimizations.',
    parameters: [
      {
        name: 'sql',
        type: 'string',
        description: 'The SQL query to optimize',
        required: true,
      },
      {
        name: 'currentPerformance',
        type: 'object',
        description: 'Current performance metrics (optional)',
        required: false,
      },
    ],
    handler: async ({ sql, currentPerformance }: OptimizeQueryParams) => {
      // This action is informational - the AI will provide optimization suggestions
      return {
        success: true,
        message: 'Optimization suggestions generated',
        sql: sql,
        currentPerformance: currentPerformance,
      };
    },
  });

  // ACTION 7: Estimate Cost
  useCopilotAction({
    name: SQL_AGENT_ACTIONS.ESTIMATE_COST,
    description: 'Estimate computational cost and data scan volume for a query.',
    parameters: [
      {
        name: 'sql',
        type: 'string',
        description: 'The SQL query to estimate',
        required: true,
      },
    ],
    handler: async ({ sql }: EstimateCostParams) => {
      // Mock implementation - in production, use Trino EXPLAIN or cost estimation API
      const estimatedDataScanned = Math.floor(Math.random() * 1000) + 100; // GB
      const estimatedCost = estimatedDataScanned * 0.01; // $0.01 per GB

      return {
        success: true,
        sql: sql,
        estimate: {
          dataScannedGB: estimatedDataScanned,
          estimatedCostUSD: estimatedCost,
          executionTimeEstimate: '2-5 seconds',
        },
      };
    },
  });

  return null; // This component doesn't render anything
}

/**
 * TiSQLCopilotProvider wraps the SQL Workstation with CopilotKit
 * Provides AI-powered chat with full context awareness and action capabilities
 */
export function TiSQLCopilotProvider({
  children,
  context,
  actions,
}: TiSQLCopilotProviderProps) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="sql_agent"
      showDevConsole={false}
    >
      <TiSQLCopilotActions context={context} actions={actions} />
      {children}
    </CopilotKit>
  );
}
