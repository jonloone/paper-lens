/**
 * Query Analysis Engine
 *
 * Deterministic, rules-based SQL analysis WITHOUT LLM guessing
 * Based on real data (or high-quality mock data) and measurable outcomes
 *
 * Philosophy:
 * - Parse SQL to understand structure
 * - Apply rules based on detected patterns
 * - Use context (table stats, partitions) for evidence
 * - Generate actionable findings with confidence scores
 */

import {
  AnalysisSession,
  Finding,
  Rule,
  RuleExecution,
  TableStatistics,
  PartitionMetadata,
  ColumnProfile,
  CostEstimate,
  QueryAnalysisResult
} from '@/lib/types/query-optimization';

// ============================================================================
// SQL PARSING (Regex-based, no external dependencies)
// ============================================================================

interface ParsedQuery {
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP';
  tables: string[];
  hasWhereClause: boolean;
  whereConditions: string[];
  hasJoin: boolean;
  joinType?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';
  hasAggregation: boolean;
  aggregationFunctions: string[];
  hasGroupBy: boolean;
  groupByColumns: string[];
  hasWindow: boolean;
  hasSubquery: boolean;
  selectColumns: string[];
  orderByColumns: string[];
  hasLimit: boolean;
  limitValue?: number;
}

export function parseSQL(sql: string): ParsedQuery {
  const upperSQL = sql.toUpperCase();

  // Query type detection
  let queryType: ParsedQuery['queryType'] = 'SELECT';
  if (upperSQL.trim().startsWith('INSERT')) queryType = 'INSERT';
  else if (upperSQL.trim().startsWith('UPDATE')) queryType = 'UPDATE';
  else if (upperSQL.trim().startsWith('DELETE')) queryType = 'DELETE';
  else if (upperSQL.trim().startsWith('CREATE')) queryType = 'CREATE';
  else if (upperSQL.trim().startsWith('DROP')) queryType = 'DROP';

  // Extract table names (FROM and JOIN clauses)
  const tables: string[] = [];

  // Match FROM clause
  const fromRegex = /FROM\s+(?:{{?\s*ref\('([^']+)'\)\s*}}?|([a-zA-Z_][a-zA-Z0-9_.]*(?:\s+AS\s+[a-zA-Z_][a-zA-Z0-9_]*)?))/gi;
  let match;
  while ((match = fromRegex.exec(sql)) !== null) {
    const tableName = match[1] || match[2];
    if (tableName && !['LATERAL', 'UNNEST', 'VALUES'].includes(tableName.toUpperCase())) {
      // Remove alias if present
      const cleanTable = tableName.split(/\s+AS\s+/i)[0].trim();
      // Extract just table name (remove catalog/schema)
      const parts = cleanTable.split('.');
      tables.push(parts[parts.length - 1]);
    }
  }

  // Match JOIN clauses
  const joinRegex = /(?:INNER\s+|LEFT\s+|RIGHT\s+|FULL\s+|CROSS\s+)?JOIN\s+(?:{{?\s*ref\('([^']+)'\)\s*}}?|([a-zA-Z_][a-zA-Z0-9_.]*(?:\s+AS\s+[a-zA-Z_][a-zA-Z0-9_]*)?))/gi;
  while ((match = joinRegex.exec(sql)) !== null) {
    const tableName = match[1] || match[2];
    if (tableName) {
      const cleanTable = tableName.split(/\s+AS\s+/i)[0].trim();
      const parts = cleanTable.split('.');
      tables.push(parts[parts.length - 1]);
    }
  }

  // WHERE clause detection
  const hasWhereClause = /\bWHERE\b/.test(upperSQL);
  const whereConditions: string[] = [];

  if (hasWhereClause) {
    // Extract WHERE conditions (simplified)
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:GROUP BY|ORDER BY|LIMIT|$)/is);
    if (whereMatch) {
      // Split by AND/OR
      const conditions = whereMatch[1].split(/\s+(?:AND|OR)\s+/i);
      whereConditions.push(...conditions.map(c => c.trim()));
    }
  }

  // JOIN detection
  const hasJoin = /\bJOIN\b/.test(upperSQL);
  let joinType: ParsedQuery['joinType'] = undefined;
  if (hasJoin) {
    if (/\bINNER\s+JOIN\b/.test(upperSQL)) joinType = 'INNER';
    else if (/\bLEFT\s+JOIN\b/.test(upperSQL)) joinType = 'LEFT';
    else if (/\bRIGHT\s+JOIN\b/.test(upperSQL)) joinType = 'RIGHT';
    else if (/\bFULL\s+JOIN\b/.test(upperSQL)) joinType = 'FULL';
    else if (/\bCROSS\s+JOIN\b/.test(upperSQL)) joinType = 'CROSS';
    else joinType = 'INNER'; // Default JOIN is INNER
  }

  // Aggregation detection
  const hasAggregation = /\b(COUNT|SUM|AVG|MIN|MAX|STDDEV|VARIANCE)\s*\(/i.test(sql);
  const aggregationFunctions: string[] = [];
  if (hasAggregation) {
    const aggMatches = sql.matchAll(/\b(COUNT|SUM|AVG|MIN|MAX|STDDEV|VARIANCE)\s*\(/gi);
    for (const m of aggMatches) {
      aggregationFunctions.push(m[1].toUpperCase());
    }
  }

  // GROUP BY detection
  const hasGroupBy = /\bGROUP\s+BY\b/.test(upperSQL);
  const groupByColumns: string[] = [];
  if (hasGroupBy) {
    const groupByMatch = sql.match(/GROUP\s+BY\s+(.+?)(?:HAVING|ORDER BY|LIMIT|$)/is);
    if (groupByMatch) {
      const cols = groupByMatch[1].split(',').map(c => c.trim());
      groupByColumns.push(...cols);
    }
  }

  // Window function detection
  const hasWindow = /\b(OVER\s*\(|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|LAST_VALUE)\b/.test(upperSQL);

  // Subquery detection
  const hasSubquery = /\(\s*SELECT\b/.test(upperSQL);

  // SELECT columns (simplified)
  const selectColumns: string[] = [];
  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/is);
  if (selectMatch) {
    const cols = selectMatch[1].split(',').map(c => c.trim());
    selectColumns.push(...cols);
  }

  // ORDER BY detection
  const orderByColumns: string[] = [];
  const orderByMatch = sql.match(/ORDER\s+BY\s+(.+?)(?:LIMIT|$)/is);
  if (orderByMatch) {
    const cols = orderByMatch[1].split(',').map(c => c.trim());
    orderByColumns.push(...cols);
  }

  // LIMIT detection
  const hasLimit = /\bLIMIT\b/.test(upperSQL);
  let limitValue: number | undefined;
  if (hasLimit) {
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      limitValue = parseInt(limitMatch[1], 10);
    }
  }

  return {
    queryType,
    tables,
    hasWhereClause,
    whereConditions,
    hasJoin,
    joinType,
    hasAggregation,
    aggregationFunctions,
    hasGroupBy,
    groupByColumns,
    hasWindow,
    hasSubquery,
    selectColumns,
    orderByColumns,
    hasLimit,
    limitValue
  };
}

// ============================================================================
// CONTEXT PROVIDERS (will use mock data for now)
// ============================================================================

export interface AnalysisContext {
  tableStats: Map<string, TableStatistics>;
  partitionMeta: Map<string, PartitionMetadata>;
  columnProfiles: Map<string, ColumnProfile[]>; // tableName -> columns
}

// ============================================================================
// RULE ENGINE
// ============================================================================

export interface RuleResult {
  triggered: boolean;
  finding?: Finding;
  executionTimeMs: number;
  error?: string;
}

export async function executeRule(
  rule: Rule,
  parsedQuery: ParsedQuery,
  context: AnalysisContext,
  sessionId: string
): Promise<RuleResult> {
  const startTime = Date.now();

  try {
    // Check if rule applies to this query type
    if (!rule.appliesToQueryTypes.includes(parsedQuery.queryType)) {
      return {
        triggered: false,
        executionTimeMs: Date.now() - startTime
      };
    }

    // Import rule implementation dynamically based on ruleId
    const ruleImpl = await getRuleImplementation(rule.ruleId);

    if (!ruleImpl) {
      return {
        triggered: false,
        executionTimeMs: Date.now() - startTime,
        error: `No implementation found for rule ${rule.ruleId}`
      };
    }

    // Execute rule
    const finding = await ruleImpl(parsedQuery, context, sessionId, rule);

    return {
      triggered: !!finding,
      finding,
      executionTimeMs: Date.now() - startTime
    };

  } catch (error) {
    return {
      triggered: false,
      executionTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function getRuleImplementation(ruleId: string): Promise<any> {
  // Dynamic rule loading based on ruleId
  try {
    switch (ruleId) {
      case 'partition-filter-missing':
        const { checkPartitionFilterMissing } = await import('./analysis-rules/partition-filter-rule');
        return checkPartitionFilterMissing;

      case 'full-table-scan':
        const { checkFullTableScan } = await import('./analysis-rules/full-scan-rule');
        return checkFullTableScan;

      case 'inefficient-join-order':
        const { checkJoinOrder } = await import('./analysis-rules/join-order-rule');
        return checkJoinOrder;

      case 'high-cardinality-groupby':
        const { checkHighCardinalityGroupBy } = await import('./analysis-rules/high-cardinality-rule');
        return checkHighCardinalityGroupBy;

      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to load rule implementation for ${ruleId}:`, error);
    return null;
  }
}

// ============================================================================
// ANALYSIS SESSION ORCHESTRATION
// ============================================================================

export async function analyzeQuery(
  sql: string,
  context: AnalysisContext,
  userId: string = 'system'
): Promise<QueryAnalysisResult> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const queryHash = hashQuery(sql);

  const session: AnalysisSession = {
    sessionId,
    queryText: sql,
    queryHash,
    userId,
    createdAt: new Date(),
    status: 'parsing',
    findingsCount: 0,
    criticalCount: 0,
    highPriorityCount: 0
  };

  try {
    // Parse SQL
    session.status = 'parsing';
    session.analysisStartedAt = new Date();

    const parsedQuery = parseSQL(sql);
    session.parsedAst = parsedQuery;
    session.queryType = parsedQuery.queryType;
    session.tablesReferenced = parsedQuery.tables;

    // Calculate complexity score (simple heuristic)
    let complexityScore = 0;
    if (parsedQuery.hasJoin) complexityScore += 2;
    if (parsedQuery.hasSubquery) complexityScore += 3;
    if (parsedQuery.hasWindow) complexityScore += 3;
    if (parsedQuery.hasAggregation) complexityScore += 1;
    if (parsedQuery.groupByColumns.length > 3) complexityScore += 2;
    session.complexityScore = complexityScore;

    // Load active rules
    session.status = 'analyzing';
    const rules = getActiveRules();

    // Execute rules
    const findings: Finding[] = [];
    const ruleExecutions: RuleExecution[] = [];

    for (const rule of rules) {
      const result = await executeRule(rule, parsedQuery, context, sessionId);

      const execution: RuleExecution = {
        executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        ruleId: rule.ruleId,
        executedAt: new Date(),
        executionTimeMs: result.executionTimeMs,
        ruleApplied: true,
        ruleTriggered: result.triggered,
        errorOccurred: !!result.error,
        errorMessage: result.error
      };

      ruleExecutions.push(execution);

      if (result.finding) {
        findings.push(result.finding);
      }
    }

    // Update session with results
    session.status = 'completed';
    session.analysisCompletedAt = new Date();
    session.analysisDurationMs = session.analysisCompletedAt.getTime() - session.analysisStartedAt.getTime();
    session.findingsCount = findings.length;
    session.criticalCount = findings.filter(f => f.severity === 'critical').length;
    session.highPriorityCount = findings.filter(f => f.severity === 'high').length;

    // Build summary
    const dataQualityWarnings: string[] = [];

    // Check context quality
    for (const table of parsedQuery.tables) {
      const stats = context.tableStats.get(table);
      if (!stats) {
        dataQualityWarnings.push(`No statistics available for table ${table}`);
      } else if (stats.isEstimated) {
        dataQualityWarnings.push(`Statistics for ${table} are estimated (confidence: ${stats.confidenceLevel})`);
      }
    }

    // Determine overall confidence
    const avgConfidence = findings.length > 0
      ? findings.reduce((sum, f) => sum + f.confidenceScore, 0) / findings.length
      : 1.0;

    const result: QueryAnalysisResult = {
      session,
      findings: findings.sort((a, b) => {
        // Sort by severity, then confidence
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.confidenceScore - a.confidenceScore;
      }),
      summary: {
        totalFindings: findings.length,
        criticalFindings: session.criticalCount,
        potentialSpeedup: estimateSpeedup(findings),
        confidenceLevel: avgConfidence,
        dataQualityWarnings
      },
      contextQuality: {
        overall: determineContextQuality(dataQualityWarnings.length, avgConfidence),
        warnings: dataQualityWarnings,
        missingContext: parsedQuery.tables.filter(t => !context.tableStats.has(t))
      }
    };

    return result;

  } catch (error) {
    session.status = 'failed';
    session.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    session.errorType = 'analysis_error';

    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function hashQuery(sql: string): string {
  // Simple hash for query deduplication
  const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `qh_${Math.abs(hash).toString(36)}`;
}

function getActiveRules(): Rule[] {
  // For now, return hardcoded rules - in production, load from database
  const now = new Date();

  return [
    {
      ruleId: 'partition-filter-missing',
      ruleVersion: 1,
      category: 'partitioning',
      name: 'Missing Partition Filter',
      description: 'Query scans partitioned table without filtering on partition column',
      severity: 'critical',
      appliesToQueryTypes: ['SELECT'],
      requiresContext: ['partition_metadata'],
      createdAt: now,
      isActive: true,
      documentationUrl: '/docs/rules/partition-filter-missing',
      exampleQuery: 'SELECT * FROM events WHERE user_id = 123',
      exampleFix: 'SELECT * FROM events WHERE event_date >= CURRENT_DATE - INTERVAL \'7\' DAY AND user_id = 123'
    },
    {
      ruleId: 'full-table-scan',
      ruleVersion: 1,
      category: 'performance',
      name: 'Full Table Scan Detected',
      description: 'Query will scan entire table without using indexes or partition pruning',
      severity: 'high',
      appliesToQueryTypes: ['SELECT'],
      requiresContext: ['table_statistics'],
      createdAt: now,
      isActive: true,
      documentationUrl: '/docs/rules/full-table-scan'
    },
    {
      ruleId: 'inefficient-join-order',
      ruleVersion: 1,
      category: 'joins',
      name: 'Inefficient Join Order',
      description: 'Large table is joined before filtering, causing unnecessary data shuffling',
      severity: 'high',
      appliesToQueryTypes: ['SELECT'],
      requiresContext: ['table_statistics'],
      createdAt: now,
      isActive: true,
      documentationUrl: '/docs/rules/inefficient-join-order'
    },
    {
      ruleId: 'high-cardinality-groupby',
      ruleVersion: 1,
      category: 'aggregations',
      name: 'High Cardinality GROUP BY',
      description: 'GROUP BY on very high cardinality column may cause memory issues',
      severity: 'medium',
      appliesToQueryTypes: ['SELECT'],
      requiresContext: ['column_profile'],
      createdAt: now,
      isActive: true,
      documentationUrl: '/docs/rules/high-cardinality-groupby'
    }
  ];
}

function estimateSpeedup(findings: Finding[]): string {
  if (findings.length === 0) return 'N/A';

  // Calculate average improvement factor
  const improvements = findings
    .map(f => f.estimatedImpact.reductionFactor)
    .filter(r => r !== undefined) as number[];

  if (improvements.length === 0) return 'N/A';

  const avgImprovement = improvements.reduce((sum, r) => sum + r, 0) / improvements.length;

  if (avgImprovement >= 10) return '10x+';
  if (avgImprovement >= 5) return '5-10x';
  if (avgImprovement >= 2) return '2-5x';
  if (avgImprovement >= 1.5) return '1.5-2x';
  return '< 1.5x';
}

function determineContextQuality(
  warningCount: number,
  avgConfidence: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (warningCount === 0 && avgConfidence >= 0.9) return 'excellent';
  if (warningCount <= 1 && avgConfidence >= 0.7) return 'good';
  if (warningCount <= 3 && avgConfidence >= 0.5) return 'fair';
  return 'poor';
}
