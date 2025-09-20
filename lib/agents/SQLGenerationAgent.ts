import { BaseAgent } from './BaseAgent';
import { AgentCapability, AgentTask, AgentInsight } from './types';
import { dataCatalogService } from '@/lib/services/DataCatalogService';

interface SQLGenerationInput {
  description: string;
  tables?: string[];
  businessContext?: string;
  performanceRequirements?: {
    maxExecutionTime?: number;
    targetRows?: number;
  };
}

interface SQLGenerationOutput {
  sql: string;
  explanation: string;
  performance: {
    estimatedRows: number;
    estimatedTime: string;
    optimizations: string[];
  };
  alternativeQueries?: Array<{
    sql: string;
    tradeoff: string;
  }>;
}

export class SQLGenerationAgent extends BaseAgent {
  constructor() {
    super(
      'sql_generator',
      'SQL Generation Agent',
      'Transforms natural language descriptions into optimized SQL queries with business context awareness'
    );
  }

  protected defineCapabilities(): AgentCapability[] {
    return [
      {
        name: 'generate_sql',
        description: 'Generate SQL from natural language description',
        requiredContext: ['tables', 'description']
      },
      {
        name: 'optimize_sql',
        description: 'Optimize existing SQL queries for performance',
        requiredContext: ['sql']
      },
      {
        name: 'explain_sql',
        description: 'Provide detailed explanation of SQL query',
        requiredContext: ['sql']
      },
      {
        name: 'validate_sql',
        description: 'Validate SQL syntax and logic',
        requiredContext: ['sql', 'tables']
      }
    ];
  }

  protected async executeTask(task: AgentTask): Promise<SQLGenerationOutput> {
    const input = task.input as SQLGenerationInput;
    
    // Analyze the natural language description
    const queryIntent = this.analyzeQueryIntent(input.description);
    
    // Generate the main SQL query
    const sql = this.generateSQL(input, queryIntent);
    
    // Generate explanation
    const explanation = this.generateExplanation(queryIntent, input);
    
    // Estimate performance
    const performance = this.estimatePerformance(sql, input.tables || []);
    
    // Generate alternative queries if applicable
    const alternativeQueries = this.generateAlternatives(queryIntent, input);
    
    // Add insights based on the generation
    await this.addGenerationInsights(queryIntent, performance);
    
    return {
      sql,
      explanation,
      performance,
      alternativeQueries: alternativeQueries.length > 0 ? alternativeQueries : undefined
    };
  }

  private analyzeQueryIntent(description: string): {
    type: 'aggregation' | 'join' | 'filter' | 'complex' | 'churn' | 'customer_analysis';
    entities: string[];
    operations: string[];
    timeframe?: string;
    tables?: string[];
  } {
    const lower = description.toLowerCase();
    
    // Check for specific analysis types first
    if (lower.includes('churn')) {
      return {
        type: 'churn',
        entities: ['customers', 'orders'],
        operations: [],
        tables: ['customer.master_table', 'sales.order_history', 'analytics.customer_engagement']
      };
    }
    
    if (lower.includes('customer') && (lower.includes('analysis') || lower.includes('analyze'))) {
      return {
        type: 'customer_analysis',
        entities: ['customers'],
        operations: [],
        tables: dataCatalogService.getTablesForAnalysis('customer').map(t => t.fullName)
      };
    }
    
    // Determine query type
    let type: 'aggregation' | 'join' | 'filter' | 'complex' | 'churn' | 'customer_analysis' = 'filter';
    if (lower.includes('total') || lower.includes('sum') || lower.includes('average') || lower.includes('count')) {
      type = 'aggregation';
    } else if (lower.includes('combine') || lower.includes('join') || lower.includes('merge')) {
      type = 'join';
    } else if (lower.includes('group by') || lower.includes('partition')) {
      type = 'complex';
    }
    
    // Extract entities with actual table mapping
    const entities: string[] = [];
    const tables: string[] = [];
    if (lower.includes('customer')) {
      entities.push('customers');
      tables.push('customer.master_table');
    }
    if (lower.includes('order')) {
      entities.push('orders');
      tables.push('sales.order_history');
    }
    if (lower.includes('engagement')) {
      entities.push('engagement');
      tables.push('analytics.customer_engagement');
    }
    if (lower.includes('revenue')) {
      entities.push('revenue');
      tables.push('sales.order_history');
    }
    
    // Extract operations
    const operations: string[] = [];
    if (lower.includes('sum')) operations.push('SUM');
    if (lower.includes('average') || lower.includes('avg')) operations.push('AVG');
    if (lower.includes('count')) operations.push('COUNT');
    if (lower.includes('max')) operations.push('MAX');
    if (lower.includes('min')) operations.push('MIN');
    
    // Extract timeframe
    let timeframe: string | undefined;
    if (lower.includes('daily')) timeframe = 'day';
    if (lower.includes('monthly')) timeframe = 'month';
    if (lower.includes('yearly') || lower.includes('annual')) timeframe = 'year';
    if (lower.includes('last 30 days')) timeframe = 'last_30_days';
    if (lower.includes('last 90 days')) timeframe = 'last_90_days';
    if (lower.includes('last quarter')) timeframe = 'last_quarter';
    
    return { type, entities, operations, timeframe, tables };
  }

  private generateSQL(input: SQLGenerationInput, queryIntent: any): string {
    const { type, operations, timeframe, tables: intentTables } = queryIntent;
    const tables = intentTables || input.tables || ['customer.master_table'];
    
    // Generate specialized SQL for specific analysis types
    if (type === 'churn') {
      return this.generateChurnAnalysisSQL();
    } else if (type === 'customer_analysis') {
      return this.generateCustomerAnalysisSQL(input.description);
    } else if (type === 'aggregation') {
      return this.generateAggregationSQL(tables, operations, timeframe, input.description);
    } else if (type === 'join') {
      return this.generateJoinSQL(tables, input.description);
    } else if (type === 'complex') {
      return this.generateComplexSQL(tables, operations, timeframe, input.description);
    } else {
      return this.generateSimpleSQL(tables[0], input.description);
    }
  }
  
  private generateChurnAnalysisSQL(): string {
    // Get actual churn query from data catalog
    const churnSuggestions = dataCatalogService.getQuerySuggestions('churn');
    if (churnSuggestions.length > 0) {
      return churnSuggestions[0].sql;
    }
    
    // Fallback churn query using actual schema
    return `-- Customer Churn Analysis using NexusOne Data Catalog
-- Business Definition: ${dataCatalogService.getBusinessContext().churnDefinition}
WITH customer_orders AS (
  SELECT 
    customer_id,
    MAX(order_date) as last_order_date,
    COUNT(*) as total_orders,
    SUM(order_total) as lifetime_value
  FROM sales.order_history
  WHERE order_status = 'completed'
  GROUP BY customer_id
),
customer_engagement AS (
  SELECT 
    customer_id,
    MAX(date) as last_engagement_date,
    SUM(page_views) as total_page_views,
    SUM(email_opens) as total_email_opens
  FROM analytics.customer_engagement
  WHERE date >= CURRENT_DATE - INTERVAL '90' DAY
  GROUP BY customer_id
)
SELECT 
  c.customer_id,
  c.customer_email,
  c.first_name,
  c.last_name,
  c.last_login_date,
  co.last_order_date,
  co.total_orders,
  co.lifetime_value,
  ce.last_engagement_date,
  c.churn_risk_score,
  CASE 
    WHEN c.last_login_date < CURRENT_DATE - INTERVAL '60' DAY 
         AND co.last_order_date < CURRENT_DATE - INTERVAL '90' DAY 
    THEN 'High Risk'
    WHEN c.last_login_date < CURRENT_DATE - INTERVAL '30' DAY 
         OR co.last_order_date < CURRENT_DATE - INTERVAL '60' DAY 
    THEN 'Medium Risk'
    ELSE 'Low Risk'
  END as churn_risk_category
FROM customer.master_table c
LEFT JOIN customer_orders co ON c.customer_id = co.customer_id
LEFT JOIN customer_engagement ce ON c.customer_id = ce.customer_id
WHERE c.created_at < CURRENT_DATE - INTERVAL '90' DAY
ORDER BY c.churn_risk_score DESC NULLS LAST
LIMIT 100;`;
  }
  
  private generateCustomerAnalysisSQL(description: string): string {
    const lower = description.toLowerCase();
    
    // Determine specific customer analysis type
    if (lower.includes('segment')) {
      return `-- Customer Segmentation Analysis
SELECT 
  c.customer_id,
  c.customer_email,
  c.total_orders,
  c.total_spent,
  CASE 
    WHEN c.total_spent > 1000 AND c.total_orders > 10 THEN 'VIP'
    WHEN c.total_spent > 500 THEN 'High Value'
    WHEN c.total_orders > 5 THEN 'Regular'
    ELSE 'New'
  END as customer_segment,
  c.city,
  c.state
FROM customer.master_table c
WHERE c.total_orders > 0
ORDER BY c.total_spent DESC;`;
    }
    
    // Default customer analysis
    return `-- Customer Profile Analysis
SELECT 
  c.customer_id,
  c.customer_email,
  c.first_name,
  c.last_name,
  c.total_orders,
  c.total_spent,
  ROUND(c.total_spent / NULLIF(c.total_orders, 0), 2) as avg_order_value,
  c.last_login_date,
  DATEDIFF('day', c.last_login_date, CURRENT_DATE) as days_since_login
FROM customer.master_table c
ORDER BY c.total_spent DESC
LIMIT 100;`;
  }

  private generateAggregationSQL(
    tables: string[], 
    operations: string[], 
    timeframe: string | undefined,
    description: string
  ): string {
    const baseTable = tables[0] || 'orders';
    const joinTable = tables[1];
    
    let sql = `-- Generated SQL for: ${description}\n`;
    sql += `WITH aggregated_data AS (\n`;
    sql += `  SELECT\n`;
    
    if (timeframe) {
      sql += `    DATE_TRUNC('${timeframe}', created_at) AS period,\n`;
    }
    
    sql += `    customer_id,\n`;
    sql += `    product_category,\n`;
    
    // Add operations
    if (operations.includes('SUM')) {
      sql += `    SUM(order_value) AS total_revenue,\n`;
    }
    if (operations.includes('COUNT')) {
      sql += `    COUNT(DISTINCT order_id) AS order_count,\n`;
    }
    if (operations.includes('AVG')) {
      sql += `    AVG(order_value) AS avg_order_value,\n`;
    }
    
    sql = sql.slice(0, -2) + '\n'; // Remove last comma
    sql += `  FROM ${baseTable}\n`;
    
    if (joinTable) {
      sql += `  JOIN ${joinTable} ON ${baseTable}.customer_id = ${joinTable}.customer_id\n`;
    }
    
    sql += `  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'\n`;
    sql += `  GROUP BY ${timeframe ? 'period, ' : ''}customer_id, product_category\n`;
    sql += `)\n`;
    sql += `SELECT * FROM aggregated_data\n`;
    sql += `ORDER BY ${operations.includes('SUM') ? 'total_revenue' : 'order_count'} DESC\n`;
    sql += `LIMIT 100;`;
    
    return sql;
  }

  private generateJoinSQL(tables: string[], description: string): string {
    return `-- Generated SQL for: ${description}
SELECT 
  t1.*,
  t2.related_field_1,
  t2.related_field_2,
  t2.related_metric
FROM ${tables[0]} t1
LEFT JOIN ${tables[1] || 'related_table'} t2
  ON t1.id = t2.foreign_id
WHERE t1.status = 'active'
  AND t2.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY t1.created_at DESC
LIMIT 1000;`;
  }

  private generateComplexSQL(
    tables: string[], 
    operations: string[], 
    timeframe: string | undefined,
    description: string
  ): string {
    return `-- Generated SQL for: ${description}
WITH customer_metrics AS (
  SELECT 
    customer_id,
    segment,
    DATE_TRUNC('${timeframe || 'month'}', order_date) AS period,
    COUNT(DISTINCT order_id) AS order_count,
    SUM(order_value) AS total_revenue,
    AVG(order_value) AS avg_order_value
  FROM ${tables[0] || 'orders'}
  WHERE order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
  GROUP BY customer_id, segment, period
),
ranked_customers AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (PARTITION BY segment ORDER BY total_revenue DESC) AS revenue_rank,
    NTILE(4) OVER (ORDER BY total_revenue) AS revenue_quartile
  FROM customer_metrics
)
SELECT 
  segment,
  period,
  COUNT(DISTINCT customer_id) AS customer_count,
  SUM(total_revenue) AS segment_revenue,
  AVG(avg_order_value) AS avg_segment_order_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_revenue) AS median_revenue
FROM ranked_customers
WHERE revenue_rank <= 100
GROUP BY segment, period
ORDER BY period DESC, segment_revenue DESC;`;
  }

  private generateSimpleSQL(table: string, description: string): string {
    return `-- Generated SQL for: ${description}
SELECT *
FROM ${table}
WHERE status = 'active'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;`;
  }

  private generateExplanation(queryIntent: any, input: SQLGenerationInput): string {
    const { type, entities, operations, timeframe } = queryIntent;
    
    let explanation = `This query ${type === 'aggregation' ? 'aggregates' : type === 'join' ? 'joins' : 'filters'} data `;
    
    if (entities.length > 0) {
      explanation += `from ${entities.join(', ')} `;
    }
    
    if (operations.length > 0) {
      explanation += `using ${operations.join(', ')} operations `;
    }
    
    if (timeframe) {
      explanation += `grouped by ${timeframe} `;
    }
    
    explanation += `to ${input.description.toLowerCase()}. `;
    explanation += `The query is optimized for readability and performance with appropriate indexing hints.`;
    
    return explanation;
  }

  private estimatePerformance(sql: string, tables: string[]): {
    estimatedRows: number;
    estimatedTime: string;
    optimizations: string[];
  } {
    // Mock performance estimation
    const hasJoins = sql.toLowerCase().includes('join');
    const hasAggregation = sql.toLowerCase().includes('group by');
    const hasSubquery = sql.toLowerCase().includes('with');
    
    let estimatedRows = 1000;
    let estimatedTimeMs = 100;
    const optimizations: string[] = [];
    
    if (hasJoins) {
      estimatedRows *= 10;
      estimatedTimeMs *= 3;
      optimizations.push('Consider adding indexes on join columns');
    }
    
    if (hasAggregation) {
      estimatedRows = Math.floor(estimatedRows / 10);
      estimatedTimeMs *= 2;
      optimizations.push('Materialized view could improve aggregation performance');
    }
    
    if (hasSubquery) {
      estimatedTimeMs *= 1.5;
      optimizations.push('CTE is used for better readability and potential optimization');
    }
    
    if (tables.length > 2) {
      optimizations.push('Consider denormalizing frequently joined tables');
    }
    
    return {
      estimatedRows,
      estimatedTime: estimatedTimeMs < 1000 ? `${estimatedTimeMs}ms` : `${(estimatedTimeMs / 1000).toFixed(1)}s`,
      optimizations
    };
  }

  private generateAlternatives(queryIntent: any, input: SQLGenerationInput): Array<{
    sql: string;
    tradeoff: string;
  }> {
    const alternatives: Array<{ sql: string; tradeoff: string }> = [];
    
    if (queryIntent.type === 'aggregation') {
      alternatives.push({
        sql: `-- Incremental aggregation approach
CREATE MATERIALIZED VIEW mv_${queryIntent.entities[0]}_metrics AS
${this.generateAggregationSQL(input.tables || [], queryIntent.operations, queryIntent.timeframe, input.description)}`,
        tradeoff: 'Pre-computed results for faster queries, but requires refresh schedule'
      });
    }
    
    if (queryIntent.operations.includes('COUNT')) {
      alternatives.push({
        sql: `-- Approximate count for faster results
SELECT APPROX_COUNT_DISTINCT(customer_id) AS approx_customers
FROM ${input.tables?.[0] || 'orders'}
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';`,
        tradeoff: 'Much faster execution (~10x) with ~2% margin of error'
      });
    }
    
    return alternatives;
  }

  private async addGenerationInsights(queryIntent: any, performance: any): Promise<void> {
    // Add performance insight
    if (performance.estimatedRows > 10000) {
      this.insights.push({
        id: `insight-perf-${Date.now()}`,
        agent: this.role,
        type: 'optimization',
        title: 'Large Result Set Detected',
        description: `Query will return approximately ${performance.estimatedRows} rows. Consider adding pagination or more specific filters.`,
        confidence: 0.85,
        actions: [{
          label: 'Add Pagination',
          action: 'add_pagination',
          params: { limit: 1000, offset: 0 },
          impact: 'high'
        }]
      });
    }
    
    // Add pattern insight
    if (queryIntent.type === 'aggregation' && queryIntent.timeframe) {
      this.insights.push({
        id: `insight-pattern-${Date.now()}`,
        agent: this.role,
        type: 'recommendation',
        title: 'Time-Series Pattern Detected',
        description: `This appears to be a time-series analysis. Consider using time-series specific optimizations or specialized storage.`,
        confidence: 0.75,
        actions: [{
          label: 'Enable Time-Series Optimization',
          action: 'enable_timeseries',
          params: { table: queryIntent.entities[0], timeColumn: 'created_at' },
          impact: 'medium'
        }]
      });
    }
  }
}