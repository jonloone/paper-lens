/**
 * Mock Column Profile Provider
 *
 * Generates realistic column statistics for query analysis
 * Simulates what would come from data profiling or ANALYZE TABLE
 */

import type { ColumnProfile } from '@/lib/types/query-optimization';

const MOCK_COLUMN_PROFILES: Record<string, Partial<ColumnProfile>[]> = {
  'customers': [
    {
      columnName: 'customer_id',
      totalRows: 150000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 150000,
      distinctPercentage: 100,
      cardinalityClass: 'very_high',
      dataType: 'BIGINT',
      isUnique: true,
      isPrimaryKey: true,
      isForeignKey: false
    },
    {
      columnName: 'email',
      totalRows: 150000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 150000,
      distinctPercentage: 100,
      cardinalityClass: 'very_high',
      dataType: 'VARCHAR',
      isUnique: true,
      isPrimaryKey: false,
      isForeignKey: false
    },
    {
      columnName: 'country',
      totalRows: 150000,
      nullCount: 500,
      nullPercentage: 0.33,
      distinctCount: 45,
      distinctPercentage: 0.03,
      cardinalityClass: 'low',
      dataType: 'VARCHAR',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: false,
      topValues: [
        { value: 'USA', count: 60000 },
        { value: 'UK', count: 25000 },
        { value: 'Canada', count: 15000 }
      ]
    },
    {
      columnName: 'created_at',
      totalRows: 150000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 120000,
      distinctPercentage: 80,
      cardinalityClass: 'very_high',
      dataType: 'TIMESTAMP',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: false
    }
  ],

  'orders': [
    {
      columnName: 'order_id',
      totalRows: 2500000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 2500000,
      distinctPercentage: 100,
      cardinalityClass: 'very_high',
      dataType: 'BIGINT',
      isUnique: true,
      isPrimaryKey: true,
      isForeignKey: false
    },
    {
      columnName: 'customer_id',
      totalRows: 2500000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 150000,
      distinctPercentage: 6,
      cardinalityClass: 'high',
      dataType: 'BIGINT',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: true
    },
    {
      columnName: 'order_date',
      totalRows: 2500000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 365,
      distinctPercentage: 0.015,
      cardinalityClass: 'low',
      dataType: 'DATE',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: false
    },
    {
      columnName: 'status',
      totalRows: 2500000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 5,
      distinctPercentage: 0.0002,
      cardinalityClass: 'low',
      dataType: 'VARCHAR',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: false,
      topValues: [
        { value: 'completed', count: 2000000 },
        { value: 'pending', count: 300000 },
        { value: 'cancelled', count: 150000 },
        { value: 'refunded', count: 50000 }
      ]
    },
    {
      columnName: 'total_amount',
      totalRows: 2500000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 50000,
      distinctPercentage: 2,
      cardinalityClass: 'medium',
      dataType: 'DECIMAL',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: false
    }
  ],

  'events': [
    {
      columnName: 'event_id',
      totalRows: 100000000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 100000000,
      distinctPercentage: 100,
      cardinalityClass: 'very_high',
      dataType: 'BIGINT',
      isUnique: true,
      isPrimaryKey: true,
      isForeignKey: false
    },
    {
      columnName: 'user_id',
      totalRows: 100000000,
      nullCount: 5000000,
      nullPercentage: 5,
      distinctCount: 2000000,
      distinctPercentage: 2,
      cardinalityClass: 'very_high',
      dataType: 'BIGINT',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: true
    },
    {
      columnName: 'event_type',
      totalRows: 100000000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 50,
      distinctPercentage: 0.00005,
      cardinalityClass: 'low',
      dataType: 'VARCHAR',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: false,
      topValues: [
        { value: 'page_view', count: 60000000 },
        { value: 'click', count: 25000000 },
        { value: 'scroll', count: 10000000 }
      ]
    },
    {
      columnName: 'event_date',
      totalRows: 100000000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 365,
      distinctPercentage: 0.000365,
      cardinalityClass: 'low',
      dataType: 'DATE',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: false
    },
    {
      columnName: 'timestamp',
      totalRows: 100000000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 90000000,
      distinctPercentage: 90,
      cardinalityClass: 'very_high',
      dataType: 'TIMESTAMP',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: false
    }
  ],

  'satellite_telemetry': [
    {
      columnName: 'telemetry_id',
      totalRows: 50000000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 50000000,
      distinctPercentage: 100,
      cardinalityClass: 'very_high',
      dataType: 'BIGINT',
      isUnique: true,
      isPrimaryKey: true,
      isForeignKey: false
    },
    {
      columnName: 'satellite_id',
      totalRows: 50000000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 50,
      distinctPercentage: 0.0001,
      cardinalityClass: 'low',
      dataType: 'VARCHAR',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: true
    },
    {
      columnName: 'timestamp',
      totalRows: 50000000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 25000000,
      distinctPercentage: 50,
      cardinalityClass: 'very_high',
      dataType: 'TIMESTAMP',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: false
    },
    {
      columnName: 'metric_name',
      totalRows: 50000000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 200,
      distinctPercentage: 0.0004,
      cardinalityClass: 'low',
      dataType: 'VARCHAR',
      isUnique: false,
      isPrimaryKey: false,
      isForeignKey: false
    }
  ]
};

export function getMockColumnProfiles(tableName: string): ColumnProfile[] | undefined {
  const mockProfiles = MOCK_COLUMN_PROFILES[tableName.toLowerCase()];

  if (!mockProfiles) {
    return generateEstimatedProfiles(tableName);
  }

  const now = new Date();
  const profiledAt = new Date(now.getTime() - 7200000); // 2 hours ago

  return mockProfiles.map(profile => {
    const fullProfile: ColumnProfile = {
      profileId: `prof_${tableName}_${profile.columnName}_${Date.now()}`,
      tableFqn: `iceberg.production.${tableName}`,
      columnName: profile.columnName || 'unknown',
      totalRows: profile.totalRows,
      nullCount: profile.nullCount,
      nullPercentage: profile.nullPercentage,
      distinctCount: profile.distinctCount,
      distinctPercentage: profile.distinctPercentage,
      cardinalityClass: profile.cardinalityClass || 'medium',
      topValues: profile.topValues,
      dataType: profile.dataType || 'VARCHAR',
      isUnique: profile.isUnique || false,
      isPrimaryKey: profile.isPrimaryKey || false,
      isForeignKey: profile.isForeignKey || false,
      source: 'mock_profiling',
      profiledAt,
      stalenessHours: 2,
      sampleSize: profile.totalRows,
      isSampled: false,
      validUntil: new Date(now.getTime() + 86400000), // Valid for 24 hours
      isValid: true
    };

    return fullProfile;
  });
}

function generateEstimatedProfiles(tableName: string): ColumnProfile[] {
  const now = new Date();

  // Generate basic estimated profiles
  const profiles: ColumnProfile[] = [
    {
      profileId: `prof_${tableName}_id_${Date.now()}`,
      tableFqn: `iceberg.production.${tableName}`,
      columnName: 'id',
      totalRows: 100000,
      nullCount: 0,
      nullPercentage: 0,
      distinctCount: 100000,
      distinctPercentage: 100,
      cardinalityClass: 'very_high',
      dataType: 'BIGINT',
      isUnique: true,
      isPrimaryKey: true,
      isForeignKey: false,
      source: 'estimated_heuristic',
      profiledAt: now,
      stalenessHours: 0,
      isSampled: true,
      sampleSize: 10000,
      validUntil: new Date(now.getTime() + 3600000),
      isValid: true
    }
  ];

  return profiles;
}

/**
 * Get all mock column profiles as a Map
 */
export function getAllMockColumnProfiles(tableNames: string[]): Map<string, ColumnProfile[]> {
  const profilesMap = new Map<string, ColumnProfile[]>();

  for (const tableName of tableNames) {
    const profiles = getMockColumnProfiles(tableName);
    if (profiles) {
      profilesMap.set(tableName.toLowerCase(), profiles);
    }
  }

  return profilesMap;
}
