/**
 * Mock Table Statistics Provider
 *
 * Generates realistic table statistics for query analysis
 * WITHOUT requiring actual Trino/Iceberg connections
 *
 * Simulates what would come from Iceberg table metadata or SHOW STATS
 */

import type { TableStatistics } from '@/lib/types/query-optimization';

// Pre-defined mock statistics for common tables
const MOCK_STATS: Record<string, Partial<TableStatistics>> = {
  // E-commerce tables
  'customers': {
    rowCount: 150000,
    totalSizeBytes: 50 * 1024 * 1024, // 50MB
    totalSizeGb: 0.05,
    fileCount: 5,
    isPartitioned: false,
    source: 'mock_metadata',
    isEstimated: false,
    confidenceLevel: 1.0,
    isValid: true
  },

  'orders': {
    rowCount: 2500000,
    totalSizeBytes: 120 * 1024 * 1024 * 1024, // 120GB
    totalSizeGb: 120,
    fileCount: 450,
    isPartitioned: true,
    partitionColumn: 'order_date',
    partitionCount: 365,
    source: 'mock_metadata',
    isEstimated: false,
    confidenceLevel: 1.0,
    isValid: true
  },

  'order_items': {
    rowCount: 8000000,
    totalSizeBytes: 80 * 1024 * 1024 * 1024, // 80GB
    totalSizeGb: 80,
    fileCount: 320,
    isPartitioned: true,
    partitionColumn: 'order_date',
    partitionCount: 365,
    source: 'mock_metadata',
    isEstimated: false,
    confidenceLevel: 1.0,
    isValid: true
  },

  'products': {
    rowCount: 50000,
    totalSizeBytes: 25 * 1024 * 1024, // 25MB
    totalSizeGb: 0.025,
    fileCount: 2,
    isPartitioned: false,
    source: 'mock_metadata',
    isEstimated: false,
    confidenceLevel: 1.0,
    isValid: true
  },

  // Satellite tables
  'satellite_telemetry': {
    rowCount: 50000000,
    totalSizeBytes: 250 * 1024 * 1024 * 1024, // 250GB
    totalSizeGb: 250,
    fileCount: 1000,
    isPartitioned: true,
    partitionColumn: 'timestamp',
    partitionCount: 720, // 30 days of hourly partitions
    source: 'mock_metadata',
    isEstimated: false,
    confidenceLevel: 1.0,
    isValid: true
  },

  'ground_stations': {
    rowCount: 50,
    totalSizeBytes: 100 * 1024, // 100KB
    totalSizeGb: 0.0001,
    fileCount: 1,
    isPartitioned: false,
    source: 'mock_metadata',
    isEstimated: false,
    confidenceLevel: 1.0,
    isValid: true
  },

  'satellite_passes': {
    rowCount: 1000000,
    totalSizeBytes: 15 * 1024 * 1024 * 1024, // 15GB
    totalSizeGb: 15,
    fileCount: 60,
    isPartitioned: true,
    partitionColumn: 'pass_date',
    partitionCount: 90,
    source: 'mock_metadata',
    isEstimated: false,
    confidenceLevel: 1.0,
    isValid: true
  },

  // Analytics tables (larger fact tables)
  'events': {
    rowCount: 100000000,
    totalSizeBytes: 500 * 1024 * 1024 * 1024, // 500GB
    totalSizeGb: 500,
    fileCount: 2000,
    isPartitioned: true,
    partitionColumn: 'event_date',
    partitionCount: 365,
    source: 'mock_metadata',
    isEstimated: false,
    confidenceLevel: 1.0,
    isValid: true
  },

  'user_sessions': {
    rowCount: 25000000,
    totalSizeBytes: 180 * 1024 * 1024 * 1024, // 180GB
    totalSizeGb: 180,
    fileCount: 720,
    isPartitioned: true,
    partitionColumn: 'session_date',
    partitionCount: 90,
    source: 'mock_metadata',
    isEstimated: false,
    confidenceLevel: 1.0,
    isValid: true
  },

  'page_views': {
    rowCount: 500000000,
    totalSizeBytes: 750 * 1024 * 1024 * 1024, // 750GB
    totalSizeGb: 750,
    fileCount: 3000,
    isPartitioned: true,
    partitionColumn: 'view_date',
    partitionCount: 180,
    source: 'mock_metadata',
    isEstimated: false,
    confidenceLevel: 1.0,
    isValid: true
  }
};

export function getMockTableStats(tableName: string): TableStatistics | undefined {
  const mockData = MOCK_STATS[tableName.toLowerCase()];

  if (!mockData) {
    // Generate estimated stats for unknown tables
    return generateEstimatedStats(tableName);
  }

  const now = new Date();
  const collectedAt = new Date(now.getTime() - 3600000); // 1 hour ago

  const stats: TableStatistics = {
    statId: `stat_${tableName}_${Date.now()}`,
    tableFqn: `iceberg.production.${tableName}`,
    rowCount: mockData.rowCount,
    totalSizeBytes: mockData.totalSizeBytes,
    totalSizeGb: mockData.totalSizeGb,
    fileCount: mockData.fileCount,
    isPartitioned: mockData.isPartitioned || false,
    partitionColumn: mockData.partitionColumn,
    partitionCount: mockData.partitionCount,
    source: mockData.source || 'mock_metadata',
    collectedAt,
    sourceTimestamp: collectedAt,
    stalenessHours: 1,
    isEstimated: mockData.isEstimated || false,
    confidenceLevel: mockData.confidenceLevel || 1.0,
    validUntil: new Date(now.getTime() + 86400000), // Valid for 24 hours
    isValid: mockData.isValid !== false,
    metadata: {
      mockGenerated: true,
      tableType: guessTableType(tableName)
    }
  };

  return stats;
}

function generateEstimatedStats(tableName: string): TableStatistics {
  // Generate reasonable estimates based on table name
  const tableType = guessTableType(tableName);
  const now = new Date();

  let rowCount = 100000; // Default
  let sizeGb = 1; // Default
  let isPartitioned = false;
  let partitionColumn: string | undefined;
  let partitionCount: number | undefined;

  // Heuristics based on table name
  if (tableName.includes('event') || tableName.includes('log')) {
    rowCount = 10000000;
    sizeGb = 50;
    isPartitioned = true;
    partitionColumn = 'event_date';
    partitionCount = 90;
  } else if (tableName.includes('fact') || tableName.includes('transaction')) {
    rowCount = 5000000;
    sizeGb = 30;
    isPartitioned = true;
    partitionColumn = 'transaction_date';
    partitionCount = 180;
  } else if (tableName.includes('dim') || tableName.includes('reference')) {
    rowCount = 50000;
    sizeGb = 0.1;
    isPartitioned = false;
  }

  return {
    statId: `stat_${tableName}_${Date.now()}`,
    tableFqn: `iceberg.production.${tableName}`,
    rowCount,
    totalSizeBytes: sizeGb * 1024 * 1024 * 1024,
    totalSizeGb: sizeGb,
    fileCount: Math.ceil(sizeGb * 4), // ~4 files per GB
    isPartitioned,
    partitionColumn,
    partitionCount,
    source: 'estimated_heuristic',
    collectedAt: now,
    sourceTimestamp: now,
    stalenessHours: 0,
    isEstimated: true,
    confidenceLevel: 0.5, // Low confidence for estimates
    validUntil: new Date(now.getTime() + 3600000), // Valid for 1 hour
    isValid: true,
    metadata: {
      mockGenerated: true,
      estimatedByHeuristic: true,
      tableType
    }
  };
}

function guessTableType(tableName: string): string {
  const lower = tableName.toLowerCase();

  if (lower.includes('dim_') || lower.includes('dimension')) return 'dimension';
  if (lower.includes('fact_')) return 'fact';
  if (lower.includes('event') || lower.includes('log')) return 'event';
  if (lower.includes('transaction') || lower.includes('order')) return 'transactional';
  if (lower.includes('agg_') || lower.includes('summary')) return 'aggregate';
  if (lower.includes('ref_') || lower.includes('reference')) return 'reference';

  return 'unknown';
}

/**
 * Get all mock table stats as a Map
 */
export function getAllMockTableStats(tableNames: string[]): Map<string, TableStatistics> {
  const statsMap = new Map<string, TableStatistics>();

  for (const tableName of tableNames) {
    const stats = getMockTableStats(tableName);
    if (stats) {
      statsMap.set(tableName.toLowerCase(), stats);
    }
  }

  return statsMap;
}
