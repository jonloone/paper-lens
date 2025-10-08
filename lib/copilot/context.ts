/**
 * CopilotKit Context Management
 *
 * Defines the shared context that the AI agent can access.
 * This includes editor state, workflow context, and user selections.
 */

import { Source } from '@/components/build/steps/Step2SelectSources';
import { ProductDefinition } from '@/components/build/steps/Step1DefineProduct';

export interface SQLWorkstationContext {
  // Editor state
  currentSQL: string;
  selectedText?: string;
  cursorPosition?: { line: number; column: number };

  // Environment
  catalog: string;
  schema: string;
  environment: 'development' | 'staging' | 'production';

  // Data sources
  selectedSources: Source[];
  availableTables?: string[];

  // Product context
  productDefinition?: ProductDefinition;
  productName?: string;
  productDescription?: string;

  // Workflow state
  workflowStep?: 'define' | 'sources' | 'transform' | 'quality' | 'delivery' | 'deploy';
  isEditMode: boolean;

  // Execution state
  lastExecutionResult?: {
    success: boolean;
    rowCount?: number;
    executionTime?: number;
    error?: string;
  };

  // Query history
  queryHistory?: Array<{
    sql: string;
    timestamp: Date;
    success: boolean;
  }>;
}

export interface SQLWorkstationContextActions {
  onSQLChange: (sql: string) => void;
  onExecuteQuery: (sql: string) => Promise<any>;
  onInsertSQL: (sql: string, replace?: boolean) => void;
}

// Helper to format context for AI consumption
export function formatContextForAI(context: SQLWorkstationContext): string {
  const parts: string[] = [];

  // Environment info
  parts.push(`Environment: ${context.environment.toUpperCase()}`);
  parts.push(`Database: ${context.catalog}.${context.schema}`);

  // Product context
  if (context.productDefinition) {
    parts.push(`\nData Product: ${context.productDefinition.displayName}`);
    if (context.productDefinition.description) {
      parts.push(`Description: ${context.productDefinition.description}`);
    }
  }

  // Current SQL
  if (context.currentSQL) {
    parts.push(`\nCurrent SQL in editor:\n\`\`\`sql\n${context.currentSQL}\n\`\`\``);
  }

  // Selected text (if any)
  if (context.selectedText) {
    parts.push(`\nSelected text:\n\`\`\`sql\n${context.selectedText}\n\`\`\``);
  }

  // Available sources
  if (context.selectedSources && context.selectedSources.length > 0) {
    parts.push(`\nSelected Data Sources:`);
    context.selectedSources.forEach(source => {
      parts.push(`  - ${source.name} (${source.catalog}.${source.schema}.${source.name})`);
      if (source.columns && source.columns.length > 0) {
        parts.push(`    Columns: ${source.columns.map(c => `${c.name} (${c.type})`).join(', ')}`);
      }
    });
  }

  // Workflow context
  if (context.workflowStep) {
    parts.push(`\nWorkflow Step: ${context.workflowStep}`);
  }

  // Last execution result
  if (context.lastExecutionResult) {
    const result = context.lastExecutionResult;
    if (result.success) {
      parts.push(`\nLast Query: Success (${result.rowCount} rows, ${result.executionTime}ms)`);
    } else {
      parts.push(`\nLast Query: Failed - ${result.error}`);
    }
  }

  return parts.join('\n');
}

// Helper to get relevant tables based on context
export function getRelevantTables(context: SQLWorkstationContext): string[] {
  const tables = new Set<string>();

  // Add from selected sources
  context.selectedSources?.forEach(source => {
    tables.add(`${source.catalog}.${source.schema}.${source.name}`);
  });

  // Add from current SQL
  if (context.currentSQL) {
    const sqlUpper = context.currentSQL.toUpperCase();
    const fromMatches = context.currentSQL.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_.]*)/gi);
    const joinMatches = context.currentSQL.match(/JOIN\s+([a-zA-Z_][a-zA-Z0-9_.]*)/gi);

    [...(fromMatches || []), ...(joinMatches || [])].forEach(match => {
      const tableName = match.split(/\s+/)[1];
      if (tableName && !['LATERAL', 'UNNEST', 'VALUES'].includes(tableName.toUpperCase())) {
        tables.add(tableName);
      }
    });
  }

  return Array.from(tables);
}

// Helper to determine user intent from context
export function inferUserIntent(context: SQLWorkstationContext): string {
  if (!context.currentSQL && context.selectedSources.length > 0) {
    return 'generate_initial_query';
  }

  if (context.selectedText) {
    return 'modify_selection';
  }

  if (context.currentSQL && context.lastExecutionResult?.success === false) {
    return 'fix_error';
  }

  if (context.currentSQL) {
    return 'refine_existing_query';
  }

  return 'general_assistance';
}
