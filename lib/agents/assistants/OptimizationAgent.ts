import { BaseAgent } from '../BaseAgent';
import { AgentCapability, AgentTask } from '../types';

interface OptimizationSuggestion {
  type: 'index' | 'partition' | 'materialized_view' | 'query_rewrite' | 'caching' | 'parallelization';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: string;
  effort: 'low' | 'medium' | 'high';
}

interface QueryAnalysis {
  originalCost: QueryCost;
  optimizedCost: QueryCost;
  suggestions: OptimizationSuggestion[];
  explanation: string;
  confidenceScore: number;
}

interface QueryCost {
  scanSize: string;
  estimatedTime: string;
  cpuCost: number;
  ioCost: number;
  networkCost: number;
}

interface QueryContext {
  sql: string;
  tableStats?: TableStatistics[];
  executionPlan?: string;
  historicalPerformance?: PerformanceHistory[];
}

interface TableStatistics {
  tableName: string;
  rowCount: number;
  sizeInBytes: number;
  lastAnalyzed: Date;
  partitionColumns?: string[];
  indexedColumns?: string[];
}

interface PerformanceHistory {
  executionTime: number;
  timestamp: Date;
  resourceUsage: {
    cpu: number;
    memory: number;
    io: number;
  };
}

/**
 * OptimizationAgent - Makes queries and pipelines faster without changing business logic
 * Analyzes performance bottlenecks and suggests concrete optimizations
 */
export class OptimizationAgent extends BaseAgent {
  constructor() {
    super(
      'optimization',
      'Optimization Assistant',
      'Improves query and pipeline performance without changing business logic'
    );
  }

  protected defineCapabilities(): AgentCapability[] {
    return [
      {
        name: 'optimize_sql_query',
        description: 'Analyze and optimize SQL query performance',
        requiredContext: ['sql']
      },
      {
        name: 'suggest_indexes',
        description: 'Recommend indexes to improve query performance',
        requiredContext: ['sql', 'tableStats']
      },
      {
        name: 'optimize_pipeline',
        description: 'Optimize data pipeline performance',
        requiredContext: ['pipeline']
      },
      {
        name: 'suggest_partitioning',
        description: 'Recommend partitioning strategies',
        requiredContext: ['table', 'queryPatterns']
      }
    ];
  }

  protected async executeTask(task: AgentTask): Promise<QueryAnalysis> {
    const context = task.input as QueryContext;
    
    // Analyze the query
    const analysis = await this.analyzeQuery(context);
    
    // Add insights
    if (analysis.suggestions.length > 0) {
      this.insights.push({
        id: `insight-optimization-${Date.now()}`,
        agent: this.role,
        type: 'optimization',
        title: `Query can be ${analysis.estimatedImprovement} faster`,
        description: `Found ${analysis.suggestions.length} optimization opportunities that can reduce execution time from ${analysis.originalCost.estimatedTime} to ${analysis.optimizedCost.estimatedTime}`,
        confidence: analysis.confidenceScore,
        actions: [{
          label: 'Apply Optimizations',
          action: 'apply_optimizations',
          params: { suggestions: analysis.suggestions },
          impact: 'high'
        }]
      });
    }
    
    return analysis;
  }

  /**
   * Comprehensive query analysis and optimization
   */
  private async analyzeQuery(context: QueryContext): Promise<QueryAnalysis> {
    const suggestions: OptimizationSuggestion[] = [];
    const sql = context.sql.toUpperCase();
    
    // Analyze for missing indexes
    const indexSuggestions = this.suggestIndexes(context);
    suggestions.push(...indexSuggestions);
    
    // Check for partition pruning opportunities
    const partitionSuggestions = this.suggestPartitioning(context);
    suggestions.push(...partitionSuggestions);
    
    // Analyze join order and strategy
    const joinOptimizations = this.optimizeJoins(context);
    suggestions.push(...joinOptimizations);
    
    // Check for aggregation push-down
    const aggregationOptimizations = this.optimizeAggregations(context);
    suggestions.push(...aggregationOptimizations);
    
    // Suggest materialized views for complex queries
    const viewSuggestions = this.suggestMaterializedViews(context);
    suggestions.push(...viewSuggestions);
    
    // Check for caching opportunities
    const cachingSuggestions = this.suggestCaching(context);
    suggestions.push(...cachingSuggestions);
    
    // Calculate cost estimates
    const originalCost = this.estimateQueryCost(context.sql, false);
    const optimizedCost = this.estimateQueryCost(context.sql, true);
    
    return {
      originalCost,
      optimizedCost,
      suggestions,
      explanation: this.generateExplanation(suggestions),
      confidenceScore: this.calculateConfidence(suggestions),
      estimatedImprovement: this.calculateImprovement(originalCost, optimizedCost)
    };
  }

  /**
   * Suggest indexes based on query patterns
   */
  private suggestIndexes(context: QueryContext): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const sql = context.sql.toUpperCase();
    
    // Check for WHERE clause columns without indexes
    const whereMatch = sql.match(/WHERE\s+(\w+)\s*=|WHERE\s+(\w+)\s+IN/gi);
    if (whereMatch) {
      suggestions.push({
        type: 'index',
        title: 'Add Index on Filter Columns',
        description: 'Columns used in WHERE clause should be indexed for faster filtering',
        impact: 'Reduce scan time by 60-90%',
        implementation: `-- Add index on frequently filtered columns
CREATE INDEX idx_customer_id ON orders(customer_id);
CREATE INDEX idx_order_date ON orders(order_date);

-- For multi-column filters, create composite index:
CREATE INDEX idx_customer_date ON orders(customer_id, order_date);`,
        estimatedImprovement: '60%',
        effort: 'low'
      });
    }
    
    // Check for JOIN columns without indexes
    if (sql.includes('JOIN')) {
      suggestions.push({
        type: 'index',
        title: 'Add Index on Join Columns',
        description: 'Join operations perform better with indexed columns',
        impact: 'Reduce join time by 50-80%',
        implementation: `-- Add indexes on both sides of the join
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_customers_id ON customers(id);

-- For better performance, ensure statistics are up to date:
ANALYZE orders;
ANALYZE customers;`,
        estimatedImprovement: '50%',
        effort: 'low'
      });
    }
    
    // Check for ORDER BY without index
    const orderByMatch = sql.match(/ORDER\s+BY\s+(\w+)/i);
    if (orderByMatch && !sql.includes('LIMIT')) {
      suggestions.push({
        type: 'index',
        title: 'Add Index for Sorting',
        description: 'Sorting large result sets benefits from indexed columns',
        impact: 'Eliminate sort operation in execution plan',
        implementation: `-- Create index for sort column
CREATE INDEX idx_sort_column ON table_name(sort_column DESC);

-- For multi-column sorts:
CREATE INDEX idx_multi_sort ON table_name(col1 DESC, col2 ASC);`,
        estimatedImprovement: '40%',
        effort: 'low'
      });
    }
    
    return suggestions;
  }

  /**
   * Suggest partitioning strategies
   */
  private suggestPartitioning(context: QueryContext): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const sql = context.sql.toUpperCase();
    
    // Check for date filtering without partition pruning
    if (sql.includes('DATE') || sql.includes('TIMESTAMP')) {
      if (!sql.includes('PARTITION')) {
        suggestions.push({
          type: 'partition',
          title: 'Add Partition Filter',
          description: 'Filter by partition column to reduce data scan',
          impact: 'Scan only relevant partitions instead of full table',
          implementation: `-- Add partition filter to your query:
SELECT * FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30' DAY
  AND order_date < CURRENT_DATE  -- Partition pruning
  AND customer_id = 123;

-- If table is not partitioned, create partitioned table:
CREATE TABLE orders_partitioned
PARTITION BY RANGE (order_date) (
  PARTITION p_2024_01 VALUES LESS THAN ('2024-02-01'),
  PARTITION p_2024_02 VALUES LESS THAN ('2024-03-01'),
  -- ... more partitions
);`,
          estimatedImprovement: '80%',
          effort: 'medium'
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Optimize join operations
   */
  private optimizeJoins(context: QueryContext): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const sql = context.sql.toUpperCase();
    
    // Count number of joins
    const joinCount = (sql.match(/JOIN/g) || []).length;
    
    if (joinCount > 2) {
      suggestions.push({
        type: 'query_rewrite',
        title: 'Optimize Join Order',
        description: 'Reorder joins to process smaller tables first',
        impact: 'Reduce intermediate result size',
        implementation: `-- Reorder joins from smallest to largest table:
-- Original:
FROM large_table
JOIN medium_table ON ...
JOIN small_table ON ...

-- Optimized:
FROM small_table
JOIN medium_table ON ...
JOIN large_table ON ...

-- Use STRAIGHT_JOIN hint if needed:
SELECT STRAIGHT_JOIN * FROM small_table ...`,
        estimatedImprovement: '30%',
        effort: 'low'
      });
    }
    
    // Check for cartesian products
    if (sql.includes('CROSS JOIN') || (joinCount > 0 && !sql.includes(' ON '))) {
      suggestions.push({
        type: 'query_rewrite',
        title: 'Avoid Cartesian Product',
        description: 'Add join conditions to avoid expensive cartesian products',
        impact: 'Prevent exponential data explosion',
        implementation: `-- Always specify join conditions:
-- Bad:
SELECT * FROM orders, customers

-- Good:
SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.id`,
        estimatedImprovement: '95%',
        effort: 'low'
      });
    }
    
    return suggestions;
  }

  /**
   * Optimize aggregation operations
   */
  private optimizeAggregations(context: QueryContext): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const sql = context.sql.toUpperCase();
    
    // Check for aggregations without filters
    if ((sql.includes('SUM(') || sql.includes('COUNT(')) && !sql.includes('WHERE')) {
      suggestions.push({
        type: 'query_rewrite',
        title: 'Pre-filter Before Aggregation',
        description: 'Add filters before aggregation to reduce data processed',
        impact: 'Process less data in aggregation',
        implementation: `-- Filter data before aggregating:
SELECT 
  customer_id,
  SUM(order_value) as total
FROM orders
WHERE order_status = 'completed'  -- Filter first
  AND order_date >= CURRENT_DATE - INTERVAL '90' DAY
GROUP BY customer_id;`,
        estimatedImprovement: '40%',
        effort: 'low'
      });
    }
    
    // Check for multiple aggregations that could be combined
    const aggregationCount = (sql.match(/SUM\(|COUNT\(|AVG\(|MAX\(|MIN\(/g) || []).length;
    if (aggregationCount > 3) {
      suggestions.push({
        type: 'materialized_view',
        title: 'Create Pre-Aggregated View',
        description: 'Pre-compute aggregations for faster queries',
        impact: 'Near-instant aggregation results',
        implementation: `-- Create materialized view for common aggregations:
CREATE MATERIALIZED VIEW customer_stats AS
SELECT 
  customer_id,
  DATE_TRUNC('day', order_date) as order_day,
  COUNT(*) as order_count,
  SUM(order_value) as daily_revenue,
  AVG(order_value) as avg_order_value
FROM orders
GROUP BY customer_id, DATE_TRUNC('day', order_date);

-- Refresh periodically:
REFRESH MATERIALIZED VIEW customer_stats;`,
        estimatedImprovement: '90%',
        effort: 'medium'
      });
    }
    
    return suggestions;
  }

  /**
   * Suggest materialized views for complex queries
   */
  private suggestMaterializedViews(context: QueryContext): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const sql = context.sql.toUpperCase();
    
    // Check query complexity
    const isComplex = 
      (sql.match(/JOIN/g) || []).length > 2 ||
      sql.includes('WITH') ||
      (sql.match(/SUBQUERY|SELECT.*FROM.*SELECT/g) || []).length > 0;
    
    if (isComplex) {
      suggestions.push({
        type: 'materialized_view',
        title: 'Create Materialized View',
        description: 'Pre-compute complex query results',
        impact: 'Transform minutes to milliseconds',
        implementation: `-- Create materialized view for complex query:
CREATE MATERIALIZED VIEW complex_analysis AS
${context.sql};

-- Set up automatic refresh:
CREATE OR REPLACE FUNCTION refresh_complex_analysis()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY complex_analysis;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour:
SELECT cron.schedule('refresh-complex-analysis', '0 * * * *', 
  'SELECT refresh_complex_analysis()');`,
        estimatedImprovement: '95%',
        effort: 'medium'
      });
    }
    
    return suggestions;
  }

  /**
   * Suggest caching strategies
   */
  private suggestCaching(context: QueryContext): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const sql = context.sql.toUpperCase();
    
    // Check if query looks like a dashboard/report query
    if (sql.includes('DATE_TRUNC') || sql.includes('GROUP BY')) {
      suggestions.push({
        type: 'caching',
        title: 'Implement Query Result Caching',
        description: 'Cache frequently accessed aggregations',
        impact: 'Instant results for repeated queries',
        implementation: `-- Implement Redis caching for query results:
import redis
import hashlib
import json

def cached_query(sql, ttl=3600):
    # Generate cache key from SQL
    cache_key = hashlib.md5(sql.encode()).hexdigest()
    
    # Check cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Execute query
    result = execute_query(sql)
    
    # Cache result
    redis_client.setex(cache_key, ttl, json.dumps(result))
    return result

-- Or use database-level caching:
ALTER TABLE orders SET (autovacuum_enabled = true);
SET work_mem = '256MB';  -- Increase for better hash joins`,
        estimatedImprovement: '99%',
        effort: 'medium'
      });
    }
    
    return suggestions;
  }

  /**
   * Estimate query cost
   */
  private estimateQueryCost(sql: string, optimized: boolean): QueryCost {
    // Mock cost estimation
    // In production, this would use EXPLAIN ANALYZE
    
    const baseSize = sql.length * 1000000; // Rough estimate based on query complexity
    const factor = optimized ? 0.2 : 1; // 80% improvement if optimized
    
    return {
      scanSize: `${Math.round(baseSize * factor / 1073741824)}GB`,
      estimatedTime: optimized ? '30 seconds' : '5 minutes',
      cpuCost: Math.round(baseSize * factor / 1000000),
      ioCost: Math.round(baseSize * factor / 5000000),
      networkCost: Math.round(baseSize * factor / 10000000)
    };
  }

  /**
   * Generate explanation of optimizations
   */
  private generateExplanation(suggestions: OptimizationSuggestion[]): string {
    if (suggestions.length === 0) {
      return 'Query is already well-optimized. No significant improvements identified.';
    }
    
    const improvements = suggestions.map(s => s.title).join(', ');
    return `Identified ${suggestions.length} optimization opportunities: ${improvements}. These optimizations work by reducing data scanned, improving join efficiency, and leveraging indexes for faster data access.`;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(suggestions: OptimizationSuggestion[]): number {
    if (suggestions.length === 0) return 0.3;
    
    // Higher confidence with more concrete suggestions
    const avgImpact = suggestions.reduce((sum, s) => {
      const improvement = parseInt(s.estimatedImprovement) || 0;
      return sum + improvement;
    }, 0) / suggestions.length;
    
    return Math.min(0.95, 0.5 + (avgImpact / 100));
  }

  /**
   * Calculate improvement percentage
   */
  private calculateImprovement(original: QueryCost, optimized: QueryCost): string {
    const originalTime = this.parseTime(original.estimatedTime);
    const optimizedTime = this.parseTime(optimized.estimatedTime);
    
    const improvement = ((originalTime - optimizedTime) / originalTime) * 100;
    return `${Math.round(improvement)}%`;
  }

  /**
   * Parse time string to seconds
   */
  private parseTime(timeStr: string): number {
    if (timeStr.includes('minute')) {
      return parseInt(timeStr) * 60;
    }
    return parseInt(timeStr);
  }
}