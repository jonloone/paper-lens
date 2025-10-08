/**
 * High Cardinality GROUP BY Rule
 *
 * Detects when GROUP BY uses very high cardinality columns which can cause
 * memory pressure and slow aggregation performance
 *
 * Evidence-based: Uses column profiles to determine cardinality
 */

import type { Finding, Rule, ColumnProfile } from '@/lib/types/query-optimization';
import type { ParsedQuery, AnalysisContext } from '../query-analysis-engine';

const HIGH_CARDINALITY_THRESHOLD = 1000000; // 1M+ distinct values
const VERY_HIGH_CARDINALITY_THRESHOLD = 10000000; // 10M+ distinct values

export async function checkHighCardinalityGroupBy(
  parsedQuery: ParsedQuery,
  context: AnalysisContext,
  sessionId: string,
  rule: Rule
): Promise<Finding | null> {

  // Only applies to SELECT queries with GROUP BY
  if (parsedQuery.queryType !== 'SELECT' || !parsedQuery.hasGroupBy) {
    return null;
  }

  const findings: Finding[] = [];

  // Check each GROUP BY column
  for (const groupByExpr of parsedQuery.groupByColumns) {
    // Extract column name (simplified - handles "table.column" or just "column")
    const columnName = groupByExpr.split('.').pop()?.trim() || groupByExpr.trim();

    // Find column profile across all tables
    let columnProfile: ColumnProfile | undefined;
    let tableName: string | undefined;

    for (const table of parsedQuery.tables) {
      const profiles = context.columnProfiles.get(table);
      if (!profiles) continue;

      const profile = profiles.find(p =>
        p.columnName.toLowerCase() === columnName.toLowerCase()
      );

      if (profile) {
        columnProfile = profile;
        tableName = table;
        break;
      }
    }

    if (!columnProfile || !tableName) {
      // No profile data - skip
      continue;
    }

    const distinctCount = columnProfile.distinctCount || 0;

    // Check cardinality class
    if (columnProfile.cardinalityClass !== 'very_high' && distinctCount < HIGH_CARDINALITY_THRESHOLD) {
      // Acceptable cardinality
      continue;
    }

    // FINDING: High cardinality GROUP BY
    const findingId = `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const severity: Finding['severity'] =
      distinctCount >= VERY_HIGH_CARDINALITY_THRESHOLD || columnProfile.cardinalityClass === 'very_high' ? 'high' :
      'medium';

    // Calculate estimated memory impact
    // Rough heuristic: each distinct group requires ~1KB in memory
    const estimatedMemoryMb = (distinctCount / 1000) * 1; // KB to MB
    const estimatedMemoryGb = estimatedMemoryMb / 1024;

    // Suggest alternatives
    const alternatives: string[] = [];

    // Check if there's a lower cardinality column that could be used
    const lowCardCols = context.columnProfiles.get(tableName)?.filter(
      p => p.cardinalityClass === 'low' || p.cardinalityClass === 'medium'
    ) || [];

    if (lowCardCols.length > 0) {
      alternatives.push(`Use lower cardinality column: ${lowCardCols[0].columnName}`);
    }

    // Check if it's a timestamp that could be truncated
    if (columnProfile.dataType.toLowerCase().includes('timestamp') ||
        columnProfile.dataType.toLowerCase().includes('date')) {
      alternatives.push(`Use DATE_TRUNC to reduce cardinality: DATE_TRUNC('day', ${columnName})`);
      alternatives.push(`Or: DATE_TRUNC('hour', ${columnName}) for hourly aggregation`);
    }

    // Check if it's a unique ID that could be avoided
    if (columnProfile.isUnique || columnProfile.isPrimaryKey) {
      alternatives.push('Avoid grouping by unique ID - consider if aggregation is necessary');
    }

    const finding: Finding = {
      findingId,
      sessionId,
      ruleId: rule.ruleId,
      severity,
      category: 'aggregations',
      title: `High Cardinality GROUP BY on ${columnName}`,
      description: `GROUP BY column "${columnName}" has ${distinctCount.toLocaleString()} distinct values (${columnProfile.cardinalityClass} cardinality). This will create ${distinctCount.toLocaleString()} groups, requiring ~${estimatedMemoryGb.toFixed(1)}GB memory for aggregation.`,
      locationInQuery: `GROUP BY ${groupByExpr}`,

      evidence: {
        columnName,
        tableName,
        distinctCount,
        cardinalityClass: columnProfile.cardinalityClass,
        dataType: columnProfile.dataType,
        isUnique: columnProfile.isUnique,
        isPrimaryKey: columnProfile.isPrimaryKey,
        nullPercentage: columnProfile.nullPercentage,
        estimatedMemoryGb: estimatedMemoryGb.toFixed(2)
      },
      evidenceSource: 'column_profile',

      currentState: {
        groupByColumn: columnName,
        distinctGroups: distinctCount,
        cardinalityClass: columnProfile.cardinalityClass,
        memoryRequirementGb: estimatedMemoryGb
      },

      recommendedState: {
        alternatives,
        suggestion: alternatives[0] || 'Consider pre-aggregating data or using approximate algorithms'
      },

      estimatedImpact: {
        reductionFactor: 2, // Conservative estimate
        estimatedSpeedup: '1.5-2x',
        confidenceLevel: columnProfile.isSampled ? 0.6 : 0.8
      },

      fixTemplate: alternatives.length > 0
        ? 'Use alternative aggregation strategy'
        : 'Consider pre-aggregation or sampling',
      fixSql: generateHighCardinalityFix(columnName, columnProfile, alternatives),
      canAutoApply: false, // Requires business logic understanding

      confidenceScore: columnProfile.isSampled ? 0.6 : 0.8,
      confidenceBasis: columnProfile.isSampled
        ? `Based on sampled column profile (${columnProfile.sampleSize} rows)`
        : 'Based on complete column profile',

      priorityScore: (distinctCount / 1000000) * (severity === 'high' ? 5 : 2),

      createdAt: new Date()
    };

    findings.push(finding);
  }

  // Return highest priority finding
  if (findings.length === 0) {
    return null;
  }

  return findings.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))[0];
}

function generateHighCardinalityFix(
  columnName: string,
  profile: ColumnProfile,
  alternatives: string[]
): string {
  if (alternatives.length === 0) {
    return `-- Consider these strategies:
-- 1. Pre-aggregate data in a materialized view
-- 2. Use approximate aggregation (e.g., HyperLogLog for COUNT DISTINCT)
-- 3. Sample the data if exact results not required`;
  }

  const isTimestamp = profile.dataType.toLowerCase().includes('timestamp') ||
                      profile.dataType.toLowerCase().includes('date');

  if (isTimestamp) {
    return `-- Reduce cardinality by truncating timestamp:
GROUP BY DATE_TRUNC('day', ${columnName})  -- Daily aggregation
-- Or: DATE_TRUNC('hour', ${columnName})  -- Hourly aggregation
-- Or: DATE_TRUNC('week', ${columnName})  -- Weekly aggregation`;
  }

  if (profile.isUnique) {
    return `-- Column "${columnName}" is unique - grouping creates one group per row
-- Consider:
-- 1. Remove GROUP BY if you need row-level data
-- 2. Aggregate by a different, lower-cardinality column
-- 3. Pre-filter data before aggregating`;
  }

  return `-- ${alternatives[0]}

-- Alternative strategies:
${alternatives.slice(1).map(a => `-- - ${a}`).join('\n')}`;
}
