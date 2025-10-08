/**
 * Inefficient Join Order Rule
 *
 * Detects when large tables are joined before filtering, causing
 * unnecessary data shuffling and memory consumption
 *
 * Evidence-based: Uses table statistics to determine optimal join order
 */

import type { Finding, Rule, TableStatistics } from '@/lib/types/query-optimization';
import type { ParsedQuery, AnalysisContext } from '../query-analysis-engine';

export async function checkJoinOrder(
  parsedQuery: ParsedQuery,
  context: AnalysisContext,
  sessionId: string,
  rule: Rule
): Promise<Finding | null> {

  // Only applies to SELECT queries with JOINs
  if (parsedQuery.queryType !== 'SELECT' || !parsedQuery.hasJoin) {
    return null;
  }

  // Need at least 2 tables
  if (parsedQuery.tables.length < 2) {
    return null;
  }

  // Get table sizes
  const tableSizes = new Map<string, number>();
  let hasAllStats = true;

  for (const table of parsedQuery.tables) {
    const stats = context.tableStats.get(table);
    if (!stats) {
      hasAllStats = false;
      continue;
    }
    tableSizes.set(table, stats.totalSizeGb || 0);
  }

  if (!hasAllStats || tableSizes.size < 2) {
    // Cannot determine join order without stats
    return null;
  }

  // Sort tables by size (ascending)
  const sortedTables = Array.from(tableSizes.entries())
    .sort((a, b) => a[1] - b[1]);

  const smallestTable = sortedTables[0];
  const largestTable = sortedTables[sortedTables.length - 1];

  // Check if largest table appears first in FROM clause
  const firstTable = parsedQuery.tables[0];
  const isLargestFirst = firstTable === largestTable[0];

  // Check if there's a significant size difference
  const sizeDifference = largestTable[1] / smallestTable[1];

  if (!isLargestFirst || sizeDifference < 5) {
    // Join order is acceptable or size difference is not significant
    return null;
  }

  // FINDING: Inefficient join order
  const findingId = `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate impact
  // Rough heuristic: joining large table first can cause 2-10x more shuffling
  const shuffleMultiplier = Math.min(sizeDifference / 2, 10);
  const currentShuffleGb = largestTable[1] * shuffleMultiplier;
  const optimalShuffleGb = smallestTable[1] * 1.5; // Smaller table + some overhead
  const reductionFactor = currentShuffleGb / optimalShuffleGb;

  const severity: Finding['severity'] =
    reductionFactor >= 10 ? 'critical' :
    reductionFactor >= 5 ? 'high' : 'medium';

  const finding: Finding = {
    findingId,
    sessionId,
    ruleId: rule.ruleId,
    severity,
    category: 'joins',
    title: `Inefficient Join Order: ${largestTable[0]} (${largestTable[1].toFixed(1)}GB) First`,
    description: `Query starts with largest table "${largestTable[0]}" (${largestTable[1].toFixed(1)}GB) instead of smallest table "${smallestTable[0]}" (${smallestTable[1].toFixed(1)}GB). This causes ${sizeDifference.toFixed(1)}x more data shuffling. Join smaller tables first to reduce intermediate result size.`,
    locationInQuery: `FROM ${firstTable}`,

    evidence: {
      tableOrder: parsedQuery.tables,
      tableSizes: Object.fromEntries(tableSizes),
      largestTable: largestTable[0],
      largestTableSizeGb: largestTable[1],
      smallestTable: smallestTable[0],
      smallestTableSizeGb: smallestTable[1],
      sizeDifferenceRatio: sizeDifference.toFixed(1)
    },
    evidenceSource: 'table_statistics',

    currentState: {
      firstTable,
      estimatedShuffleGb: currentShuffleGb.toFixed(1),
      joinOrder: 'largest_first'
    },

    recommendedState: {
      firstTable: smallestTable[0],
      estimatedShuffleGb: optimalShuffleGb.toFixed(1),
      joinOrder: 'smallest_first',
      suggestedOrder: sortedTables.map(t => t[0]).join(' → ')
    },

    estimatedImpact: {
      reductionFactor,
      dataSavingsGb: currentShuffleGb - optimalShuffleGb,
      estimatedSpeedup: reductionFactor >= 10 ? '10x+' :
                        reductionFactor >= 5 ? '5-10x' :
                        reductionFactor >= 2 ? '2-5x' : '1.5-2x',
      confidenceLevel: 0.75 // Moderate confidence - depends on data distribution
    },

    fixTemplate: 'Reorder joins to start with smallest table',
    fixSql: generateJoinOrderFix(parsedQuery, sortedTables),
    canAutoApply: false, // Requires understanding of join semantics

    confidenceScore: 0.75,
    confidenceBasis: 'Based on table size statistics. Actual impact depends on join selectivity and data distribution.',

    priorityScore: reductionFactor * (severity === 'critical' ? 10 : severity === 'high' ? 5 : 2),

    createdAt: new Date()
  };

  return finding;
}

function generateJoinOrderFix(
  parsedQuery: ParsedQuery,
  sortedTables: [string, number][]
): string {
  // Generate suggested join order
  const optimalOrder = sortedTables.map(t => t[0]);

  return `-- Reorder joins from smallest to largest table:
-- Optimal order: ${optimalOrder.join(' → ')}

-- Example:
FROM {{ ref('${optimalOrder[0]}') }}  -- Start with smallest (${sortedTables[0][1].toFixed(1)}GB)
${optimalOrder.slice(1).map((table, idx) => {
  const size = sortedTables[idx + 1][1];
  return `JOIN {{ ref('${table}') }} ON <join_condition>  -- ${size.toFixed(1)}GB`;
}).join('\n')}`;
}
