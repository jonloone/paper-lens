/**
 * Query Analysis API Endpoint
 *
 * POST /api/analyze-query
 *
 * Accepts SQL query and returns optimization findings based on:
 * - SQL parsing
 * - Rule execution
 * - Mock context data (table stats, partition metadata, column profiles)
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuery, type AnalysisContext } from '@/lib/services/query-analysis-engine';
import { getAllMockTableStats } from '@/lib/services/mock-context/mock-table-stats';
import { getAllMockPartitionMetadata } from '@/lib/services/mock-context/mock-partition-metadata';
import { getAllMockColumnProfiles } from '@/lib/services/mock-context/mock-column-profiles';
import type { QueryAnalysisResult } from '@/lib/types/query-optimization';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, userId = 'anonymous' } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }

    console.log('[Analyze API] Analyzing query:', sql.substring(0, 100) + '...');

    // Extract table names from SQL (simple regex - the engine will do better parsing)
    const tableNames = extractTableNames(sql);
    console.log('[Analyze API] Detected tables:', tableNames);

    // Build mock context
    const context: AnalysisContext = {
      tableStats: getAllMockTableStats(tableNames),
      partitionMeta: getAllMockPartitionMetadata(tableNames),
      columnProfiles: getAllMockColumnProfiles(tableNames)
    };

    console.log('[Analyze API] Context built:', {
      tableStats: context.tableStats.size,
      partitionMeta: context.partitionMeta.size,
      columnProfiles: context.columnProfiles.size
    });

    // Run analysis
    const result: QueryAnalysisResult = await analyzeQuery(sql, context, userId);

    console.log('[Analyze API] Analysis complete:', {
      sessionId: result.session.sessionId,
      findingsCount: result.findings.length,
      criticalCount: result.summary.criticalFindings,
      status: result.session.status
    });

    // Return results
    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('[Analyze API] Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Analysis failed',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Simple table name extraction (fallback - engine does better)
 */
function extractTableNames(sql: string): string[] {
  const tables = new Set<string>();

  // Match FROM and JOIN clauses
  const fromRegex = /FROM\s+(?:{{?\s*ref\('([^']+)'\)\s*}}?|([a-zA-Z_][a-zA-Z0-9_.]*))/gi;
  const joinRegex = /JOIN\s+(?:{{?\s*ref\('([^']+)'\)\s*}}?|([a-zA-Z_][a-zA-Z0-9_.]*))/gi;

  let match;
  while ((match = fromRegex.exec(sql)) !== null) {
    const tableName = match[1] || match[2];
    if (tableName && !['LATERAL', 'UNNEST', 'VALUES'].includes(tableName.toUpperCase())) {
      // Remove alias and schema prefix
      const cleanTable = tableName.split(/\s+AS\s+/i)[0].trim();
      const parts = cleanTable.split('.');
      tables.add(parts[parts.length - 1]);
    }
  }

  while ((match = joinRegex.exec(sql)) !== null) {
    const tableName = match[1] || match[2];
    if (tableName) {
      const cleanTable = tableName.split(/\s+AS\s+/i)[0].trim();
      const parts = cleanTable.split('.');
      tables.add(parts[parts.length - 1]);
    }
  }

  return Array.from(tables);
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'query-analysis',
    version: '1.0.0',
    capabilities: [
      'sql_parsing',
      'partition_optimization',
      'join_order_analysis',
      'cardinality_detection',
      'full_scan_detection'
    ]
  });
}
