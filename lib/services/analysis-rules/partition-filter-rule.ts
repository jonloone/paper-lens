/**
 * Partition Filter Missing Rule
 *
 * Detects when a query scans a partitioned table without filtering on partition column
 * This can result in massive data scans and poor performance
 *
 * Evidence-based: Uses actual partition metadata to determine impact
 */

import type { Finding, Rule, PartitionMetadata } from '@/lib/types/query-optimization';
import type { ParsedQuery, AnalysisContext } from '../query-analysis-engine';

export async function checkPartitionFilterMissing(
  parsedQuery: ParsedQuery,
  context: AnalysisContext,
  sessionId: string,
  rule: Rule
): Promise<Finding | null> {

  // Only applies to SELECT queries
  if (parsedQuery.queryType !== 'SELECT') {
    return null;
  }

  const findings: Finding[] = [];

  // Check each table for partition metadata
  for (const table of parsedQuery.tables) {
    const partitionMeta = context.partitionMeta.get(table);

    if (!partitionMeta) {
      // No partition metadata - skip (or warn about missing context)
      continue;
    }

    if (!partitionMeta.isTemporal) {
      // Not a time-partitioned table - skip
      continue;
    }

    const partitionColumn = partitionMeta.temporalColumn;

    if (!partitionColumn) {
      continue;
    }

    // Check if WHERE clause filters on partition column
    const hasPartitionFilter = parsedQuery.whereConditions.some(cond =>
      cond.toLowerCase().includes(partitionColumn.toLowerCase())
    );

    if (hasPartitionFilter) {
      // Partition filter present - no issue
      continue;
    }

    // FINDING: Missing partition filter
    const findingId = `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate impact based on partition count
    const totalPartitions = partitionMeta.totalPartitions;
    const avgPartitionSizeGb = partitionMeta.avgPartitionSizeGb || 1;
    const totalDataGb = totalPartitions * avgPartitionSizeGb;

    // Estimate typical query would scan ~7 days if temporal
    const estimatedOptimalPartitions = partitionMeta.temporalGranularity === 'day' ? 7 :
                                      partitionMeta.temporalGranularity === 'hour' ? 168 :
                                      partitionMeta.temporalGranularity === 'month' ? 1 : 30;

    const optimalDataGb = estimatedOptimalPartitions * avgPartitionSizeGb;
    const reductionFactor = totalDataGb / optimalDataGb;

    const finding: Finding = {
      findingId,
      sessionId,
      ruleId: rule.ruleId,
      severity: 'critical',
      category: 'partitioning',
      title: `Missing Partition Filter on ${table}`,
      description: `Query scans partitioned table "${table}" without filtering on partition column "${partitionColumn}". This will scan all ${totalPartitions} partitions (${totalDataGb.toFixed(1)}GB) instead of necessary subset.`,
      locationInQuery: `FROM ${table}`,

      evidence: {
        partitionColumn,
        totalPartitions,
        avgPartitionSizeGb,
        totalDataGb: totalDataGb.toFixed(2),
        hasWhereClause: parsedQuery.hasWhereClause,
        whereConditions: parsedQuery.whereConditions
      },
      evidenceSource: 'partition_metadata',

      currentState: {
        scannedPartitions: totalPartitions,
        scannedDataGb: totalDataGb,
        hasPartitionFilter: false
      },

      recommendedState: {
        scannedPartitions: estimatedOptimalPartitions,
        scannedDataGb: optimalDataGb,
        hasPartitionFilter: true,
        suggestedFilter: `${partitionColumn} >= CURRENT_DATE - INTERVAL '7' DAY`
      },

      estimatedImpact: {
        reductionFactor,
        dataSavingsGb: totalDataGb - optimalDataGb,
        estimatedSpeedup: reductionFactor >= 10 ? '10x+' :
                          reductionFactor >= 5 ? '5-10x' :
                          reductionFactor >= 2 ? '2-5x' : '1.5-2x',
        confidenceLevel: partitionMeta.isValid ? 0.95 : 0.7
      },

      fixTemplate: `Add partition filter to WHERE clause`,
      fixSql: generatePartitionFilterFix(parsedQuery, table, partitionColumn, partitionMeta),
      canAutoApply: true,

      confidenceScore: partitionMeta.isValid ? 0.95 : 0.7,
      confidenceBasis: partitionMeta.isValid
        ? 'Based on real partition metadata'
        : 'Based on estimated partition metadata',

      priorityScore: reductionFactor * 10, // Higher reduction = higher priority

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

function generatePartitionFilterFix(
  parsedQuery: ParsedQuery,
  table: string,
  partitionColumn: string,
  partitionMeta: PartitionMetadata
): string {
  const originalSQL = parsedQuery.tables.join(', '); // Simplified

  // Generate suggested filter based on temporal granularity
  let suggestedFilter = '';

  switch (partitionMeta.temporalGranularity) {
    case 'day':
      suggestedFilter = `${partitionColumn} >= CURRENT_DATE - INTERVAL '7' DAY`;
      break;
    case 'hour':
      suggestedFilter = `${partitionColumn} >= CURRENT_TIMESTAMP - INTERVAL '24' HOUR`;
      break;
    case 'month':
      suggestedFilter = `${partitionColumn} >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3' MONTH)`;
      break;
    case 'year':
      suggestedFilter = `${partitionColumn} >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1' YEAR)`;
      break;
    default:
      suggestedFilter = `${partitionColumn} >= CURRENT_DATE - INTERVAL '7' DAY`;
  }

  // Build fix SQL
  if (parsedQuery.hasWhereClause) {
    return `-- Add partition filter to existing WHERE clause:\n-- WHERE ${suggestedFilter} AND ...`;
  } else {
    return `-- Add WHERE clause with partition filter:\nWHERE ${suggestedFilter}`;
  }
}
