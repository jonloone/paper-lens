/**
 * Mock Partition Metadata Provider
 *
 * Generates realistic partition metadata for query analysis
 * Simulates Iceberg partition specs and distribution info
 */

import type { PartitionMetadata } from '@/lib/types/query-optimization';

const MOCK_PARTITION_META: Record<string, Partial<PartitionMetadata>> = {
  'orders': {
    partitionColumns: ['order_date'],
    partitionTransform: ['day'],
    totalPartitions: 365,
    avgPartitionSizeGb: 0.33, // 120GB / 365 partitions
    maxPartitionSizeGb: 0.8,
    minPartitionSizeGb: 0.1,
    isTemporal: true,
    temporalColumn: 'order_date',
    temporalGranularity: 'day'
  },

  'order_items': {
    partitionColumns: ['order_date'],
    partitionTransform: ['day'],
    totalPartitions: 365,
    avgPartitionSizeGb: 0.22, // 80GB / 365 partitions
    maxPartitionSizeGb: 0.5,
    minPartitionSizeGb: 0.05,
    isTemporal: true,
    temporalColumn: 'order_date',
    temporalGranularity: 'day'
  },

  'satellite_telemetry': {
    partitionColumns: ['timestamp'],
    partitionTransform: ['hour'],
    totalPartitions: 720, // 30 days * 24 hours
    avgPartitionSizeGb: 0.35, // 250GB / 720 partitions
    maxPartitionSizeGb: 0.6,
    minPartitionSizeGb: 0.15,
    isTemporal: true,
    temporalColumn: 'timestamp',
    temporalGranularity: 'hour'
  },

  'satellite_passes': {
    partitionColumns: ['pass_date'],
    partitionTransform: ['day'],
    totalPartitions: 90,
    avgPartitionSizeGb: 0.17, // 15GB / 90 partitions
    maxPartitionSizeGb: 0.3,
    minPartitionSizeGb: 0.05,
    isTemporal: true,
    temporalColumn: 'pass_date',
    temporalGranularity: 'day'
  },

  'events': {
    partitionColumns: ['event_date'],
    partitionTransform: ['day'],
    totalPartitions: 365,
    avgPartitionSizeGb: 1.37, // 500GB / 365 partitions
    maxPartitionSizeGb: 2.5,
    minPartitionSizeGb: 0.5,
    isTemporal: true,
    temporalColumn: 'event_date',
    temporalGranularity: 'day'
  },

  'user_sessions': {
    partitionColumns: ['session_date'],
    partitionTransform: ['day'],
    totalPartitions: 90,
    avgPartitionSizeGb: 2.0, // 180GB / 90 partitions
    maxPartitionSizeGb: 3.5,
    minPartitionSizeGb: 0.8,
    isTemporal: true,
    temporalColumn: 'session_date',
    temporalGranularity: 'day'
  },

  'page_views': {
    partitionColumns: ['view_date'],
    partitionTransform: ['day'],
    totalPartitions: 180,
    avgPartitionSizeGb: 4.17, // 750GB / 180 partitions
    maxPartitionSizeGb: 6.0,
    minPartitionSizeGb: 2.0,
    isTemporal: true,
    temporalColumn: 'view_date',
    temporalGranularity: 'day'
  }
};

export function getMockPartitionMetadata(tableName: string): PartitionMetadata | undefined {
  const mockData = MOCK_PARTITION_META[tableName.toLowerCase()];

  if (!mockData) {
    // Check if table name suggests it's partitioned
    if (tableName.toLowerCase().includes('event') ||
        tableName.toLowerCase().includes('log') ||
        tableName.toLowerCase().includes('fact')) {
      return generateEstimatedPartitionMeta(tableName);
    }
    return undefined;
  }

  const now = new Date();
  const collectedAt = new Date(now.getTime() - 3600000); // 1 hour ago

  const meta: PartitionMetadata = {
    partitionId: `part_${tableName}_${Date.now()}`,
    tableFqn: `iceberg.production.${tableName}`,
    snapshotId: Math.floor(Math.random() * 1000000),
    partitionSpecId: 1,
    partitionSpec: {
      fields: mockData.partitionColumns?.map((col, idx) => ({
        sourceId: idx + 1,
        fieldId: 1000 + idx,
        name: col,
        transform: mockData.partitionTransform?.[idx] || 'identity'
      })) || []
    },
    partitionColumns: mockData.partitionColumns || [],
    partitionTransform: mockData.partitionTransform || [],
    totalPartitions: mockData.totalPartitions || 1,
    avgPartitionSizeGb: mockData.avgPartitionSizeGb,
    maxPartitionSizeGb: mockData.maxPartitionSizeGb,
    minPartitionSizeGb: mockData.minPartitionSizeGb,
    isTemporal: mockData.isTemporal || false,
    temporalColumn: mockData.temporalColumn,
    temporalGranularity: mockData.temporalGranularity,
    source: 'mock_iceberg_metadata',
    collectedAt,
    stalenessHours: 1,
    validUntil: new Date(now.getTime() + 86400000), // Valid for 24 hours
    isValid: true
  };

  return meta;
}

function generateEstimatedPartitionMeta(tableName: string): PartitionMetadata {
  const now = new Date();

  // Estimate based on table name
  let temporalColumn = 'event_date';
  let temporalGranularity: PartitionMetadata['temporalGranularity'] = 'day';
  let totalPartitions = 90;
  let avgPartitionSizeGb = 1;

  if (tableName.includes('hourly') || tableName.includes('telemetry')) {
    temporalColumn = 'timestamp';
    temporalGranularity = 'hour';
    totalPartitions = 720; // 30 days
    avgPartitionSizeGb = 0.5;
  } else if (tableName.includes('monthly')) {
    temporalColumn = 'month';
    temporalGranularity = 'month';
    totalPartitions = 12;
    avgPartitionSizeGb = 10;
  }

  return {
    partitionId: `part_${tableName}_${Date.now()}`,
    tableFqn: `iceberg.production.${tableName}`,
    partitionSpec: {
      fields: [{
        sourceId: 1,
        fieldId: 1000,
        name: temporalColumn,
        transform: temporalGranularity
      }]
    },
    partitionColumns: [temporalColumn],
    partitionTransform: [temporalGranularity],
    totalPartitions,
    avgPartitionSizeGb,
    maxPartitionSizeGb: avgPartitionSizeGb * 2,
    minPartitionSizeGb: avgPartitionSizeGb * 0.3,
    isTemporal: true,
    temporalColumn,
    temporalGranularity,
    source: 'estimated_heuristic',
    collectedAt: now,
    stalenessHours: 0,
    validUntil: new Date(now.getTime() + 3600000), // Valid for 1 hour
    isValid: true
  };
}

/**
 * Get all mock partition metadata as a Map
 */
export function getAllMockPartitionMetadata(tableNames: string[]): Map<string, PartitionMetadata> {
  const metaMap = new Map<string, PartitionMetadata>();

  for (const tableName of tableNames) {
    const meta = getMockPartitionMetadata(tableName);
    if (meta) {
      metaMap.set(tableName.toLowerCase(), meta);
    }
  }

  return metaMap;
}
