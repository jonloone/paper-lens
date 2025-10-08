/**
 * Full Table Scan Detection Rule
 *
 * Detects when a query will perform a full table scan without leveraging
 * partition pruning, indexes, or filtering
 *
 * Evidence-based: Uses table statistics to quantify impact
 */

import type { Finding, Rule, TableStatistics } from '@/lib/types/query-optimization';
import type { ParsedQuery, AnalysisContext } from '../query-analysis-engine';

const FULL_SCAN_THRESHOLD_GB = 10; // Tables over 10GB without filtering trigger warning

export async function checkFullTableScan(
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

  // Check each table
  for (const table of parsedQuery.tables) {
    const tableStats = context.tableStats.get(table);

    if (!tableStats) {
      // No stats available - skip
      continue;
    }

    const tableSizeGb = tableStats.totalSizeGb || 0;

    // Skip small tables (full scan is acceptable)
    if (tableSizeGb < FULL_SCAN_THRESHOLD_GB) {
      continue;
    }

    // Check if query has filtering
    const hasFiltering = parsedQuery.hasWhereClause || parsedQuery.hasLimit;

    // Check if table is partitioned
    const partitionMeta = context.partitionMeta.get(table);
    const isPartitioned = partitionMeta?.isPartitioned || false;

    // Determine scan type
    let scanType: 'full_scan' | 'partial_scan' | 'filtered' = 'full_scan';
    let estimatedScanGb = tableSizeGb;

    if (hasFiltering && parsedQuery.hasLimit) {
      // Has LIMIT - will stop early
      scanType = 'partial_scan';
      // Estimate: LIMIT reduces scan (very rough heuristic)
      const limitValue = parsedQuery.limitValue || 100;
      const rowCount = tableStats.rowCount || 1000000;
      const scanRatio = Math.min(limitValue / rowCount, 1);
      estimatedScanGb = tableSizeGb * scanRatio;
    } else if (hasFiltering) {
      // Has WHERE but no LIMIT
      scanType = 'filtered';
      // Estimate: filtering reduces scan by ~90% (rough heuristic)
      estimatedScanGb = tableSizeGb * 0.1;
    }

    // If still scanning >50GB or >80% of table, flag as issue
    const scanPercentage = (estimatedScanGb / tableSizeGb) * 100;

    if (estimatedScanGb < 50 && scanPercentage < 80) {
      // Acceptable scan size
      continue;
    }

    // FINDING: Full or near-full table scan
    const findingId = `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate potential optimization
    const optimalScanGb = Math.min(estimatedScanGb * 0.05, 5); // Assume 95% reduction possible
    const reductionFactor = estimatedScanGb / optimalScanGb;

    const severity: Finding['severity'] =
      estimatedScanGb >= 100 ? 'critical' :
      estimatedScanGb >= 50 ? 'high' : 'medium';

    const finding: Finding = {
      findingId,
      sessionId,
      ruleId: rule.ruleId,
      severity,
      category: 'performance',
      title: `Full Table Scan on ${table} (${tableSizeGb.toFixed(1)}GB)`,
      description: `Query will scan ${estimatedScanGb.toFixed(1)}GB (${scanPercentage.toFixed(0)}%) of table "${table}". ${
        isPartitioned
          ? 'Table is partitioned but query does not leverage partition pruning.'
          : 'Consider adding WHERE clause to limit data scanned.'
      }`,
      locationInQuery: `FROM ${table}`,

      evidence: {
        tableName: table,
        totalSizeGb: tableSizeGb,
        rowCount: tableStats.rowCount,
        estimatedScanGb,
        scanPercentage: scanPercentage.toFixed(1),
        isPartitioned,
        hasWhereClause: parsedQuery.hasWhereClause,
        hasLimit: parsedQuery.hasLimit,
        limitValue: parsedQuery.limitValue
      },
      evidenceSource: 'table_statistics',

      currentState: {
        scanType,
        dataScannedGb: estimatedScanGb,
        percentageScanned: scanPercentage
      },

      recommendedState: {
        scanType: 'filtered',
        dataScannedGb: optimalScanGb,
        percentageScanned: (optimalScanGb / tableSizeGb) * 100,
        suggestedOptimization: isPartitioned
          ? 'Add partition filter to WHERE clause'
          : 'Add selective WHERE clause or use materialized view'
      },

      estimatedImpact: {
        reductionFactor,
        dataSavingsGb: estimatedScanGb - optimalScanGb,
        estimatedSpeedup: reductionFactor >= 10 ? '10x+' :
                          reductionFactor >= 5 ? '5-10x' :
                          reductionFactor >= 2 ? '2-5x' : '1.5-2x',
        confidenceLevel: tableStats.isEstimated ? 0.6 : 0.85
      },

      fixTemplate: isPartitioned
        ? 'Add partition filter to reduce scan'
        : 'Add WHERE clause with selective filtering',
      fixSql: generateFullScanFix(parsedQuery, table, isPartitioned, partitionMeta),
      canAutoApply: false, // Requires business logic understanding

      confidenceScore: tableStats.isEstimated ? 0.6 : 0.85,
      confidenceBasis: tableStats.isEstimated
        ? 'Based on estimated table statistics'
        : 'Based on actual table statistics',

      priorityScore: (estimatedScanGb / 10) * (severity === 'critical' ? 10 : severity === 'high' ? 5 : 2),

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

function generateFullScanFix(
  parsedQuery: ParsedQuery,
  table: string,
  isPartitioned: boolean,
  partitionMeta: PartitionMetadata | undefined
): string {
  if (isPartitioned && partitionMeta?.temporalColumn) {
    const partitionColumn = partitionMeta.temporalColumn;
    return `-- Add partition filter to WHERE clause:\nWHERE ${partitionColumn} >= CURRENT_DATE - INTERVAL '7' DAY\n-- AND <your business logic filters>`;
  }

  return `-- Add selective WHERE clause:\nWHERE <column> = <value>\n-- Example: WHERE user_id = 12345 AND created_at >= '2024-01-01'`;
}
