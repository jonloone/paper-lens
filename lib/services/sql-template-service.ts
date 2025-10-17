/**
 * SQL Template Service
 *
 * Provides intelligent SQL template recommendations based on:
 * - User intent (from product definition)
 * - Domain knowledge (from Living Context Graph)
 * - Selected data sources
 * - Common patterns and use cases
 */

export interface SQLTemplate {
  id: string;
  name: string;
  description: string;
  category: 'aggregation' | 'join' | 'window' | 'cte' | 'transformation' | 'quality';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  useCases: string[];
  sql: string;
  explanation: string;
  requiredTables?: number;
  suggestedFor?: {
    domains?: string[];
    intents?: string[];
    tablePatterns?: string[];
  };
}

export interface TemplateRecommendation {
  template: SQLTemplate;
  relevanceScore: number;
  reasoning: string;
}

/**
 * Analyze context and recommend relevant SQL templates
 */
export async function recommendTemplates(context: {
  productDefinition?: {
    name?: string;
    description?: string;
    domain?: string;
  };
  selectedTables: Array<{
    name: string;
    columns: Array<{ name: string; type: string }>;
  }>;
  intent?: string;
}): Promise<TemplateRecommendation[]> {
  const templates = getAllTemplates();
  const recommendations: TemplateRecommendation[] = [];

  for (const template of templates) {
    const relevance = calculateRelevance(template, context);

    if (relevance.score > 0.3) {
      recommendations.push({
        template,
        relevanceScore: relevance.score,
        reasoning: relevance.reasoning,
      });
    }
  }

  // Sort by relevance score
  recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return recommendations.slice(0, 10); // Top 10
}

/**
 * Calculate relevance score for a template
 */
function calculateRelevance(
  template: SQLTemplate,
  context: any
): { score: number; reasoning: string } {
  let score = 0;
  const reasons: string[] = [];

  // Check domain match
  const domain = context.productDefinition?.domain?.toLowerCase();
  if (domain && template.suggestedFor?.domains?.some(d => d.toLowerCase().includes(domain))) {
    score += 0.4;
    reasons.push(`Relevant for ${domain} domain`);
  }

  // Check intent match
  const description = context.productDefinition?.description?.toLowerCase() || '';
  if (template.suggestedFor?.intents) {
    for (const intent of template.suggestedFor.intents) {
      if (description.includes(intent.toLowerCase())) {
        score += 0.3;
        reasons.push(`Matches "${intent}" pattern`);
        break;
      }
    }
  }

  // Check table pattern match
  const tableNames = context.selectedTables.map((t: any) => t.name.toLowerCase());
  if (template.suggestedFor?.tablePatterns) {
    for (const pattern of template.suggestedFor.tablePatterns) {
      if (tableNames.some(t => t.includes(pattern.toLowerCase()))) {
        score += 0.2;
        reasons.push(`Matches table pattern "${pattern}"`);
      }
    }
  }

  // Check table count requirements
  if (template.requiredTables && context.selectedTables.length >= template.requiredTables) {
    score += 0.1;
    reasons.push('Sufficient tables selected');
  }

  return {
    score,
    reasoning: reasons.join(', ') || 'General template',
  };
}

/**
 * Get all available templates
 */
function getAllTemplates(): SQLTemplate[] {
  return [
    // Customer Analytics Templates
    {
      id: 'customer-360',
      name: 'Customer 360 View',
      description: 'Build a comprehensive customer profile by joining customer, order, and interaction data',
      category: 'join',
      difficulty: 'intermediate',
      useCases: ['Customer analytics', 'CRM integration', 'Marketing segmentation'],
      sql: `-- Customer 360 View
-- Comprehensive customer profile with purchase and interaction history

WITH customer_purchases AS (
  SELECT
    customer_id,
    COUNT(DISTINCT order_id) AS total_orders,
    SUM(order_total) AS lifetime_value,
    MAX(order_date) AS last_purchase_date,
    MIN(order_date) AS first_purchase_date
  FROM orders
  GROUP BY customer_id
),

customer_metrics AS (
  SELECT
    c.customer_id,
    c.name,
    c.email,
    c.segment,
    c.signup_date,
    cp.total_orders,
    cp.lifetime_value,
    cp.last_purchase_date,
    cp.first_purchase_date,
    DATE_DIFF('day', cp.last_purchase_date, CURRENT_DATE) AS days_since_last_purchase,
    DATE_DIFF('day', cp.first_purchase_date, cp.last_purchase_date) / NULLIF(cp.total_orders - 1, 0) AS avg_days_between_orders
  FROM customers c
  LEFT JOIN customer_purchases cp ON c.customer_id = cp.customer_id
)

SELECT
  *,
  CASE
    WHEN days_since_last_purchase <= 30 THEN 'Active'
    WHEN days_since_last_purchase <= 90 THEN 'At Risk'
    ELSE 'Churned'
  END AS customer_status
FROM customer_metrics
ORDER BY lifetime_value DESC`,
      explanation: 'This template creates a 360-degree view of customers by combining profile data with purchase behavior. It calculates key metrics like lifetime value, purchase frequency, and recency, then segments customers by their engagement status.',
      requiredTables: 2,
      suggestedFor: {
        domains: ['marketing', 'sales', 'crm', 'e-commerce'],
        intents: ['customer', 'profile', 'segmentation', '360'],
        tablePatterns: ['customer', 'order', 'user'],
      },
    },

    {
      id: 'cohort-analysis',
      name: 'Cohort Analysis',
      description: 'Analyze customer retention by signup cohort',
      category: 'window',
      difficulty: 'advanced',
      useCases: ['Retention analysis', 'Product analytics', 'Growth metrics'],
      sql: `-- Cohort Analysis
-- Track customer retention by signup month

WITH user_cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC('month', signup_date) AS cohort_month
  FROM users
),

user_activity AS (
  SELECT
    uc.user_id,
    uc.cohort_month,
    DATE_TRUNC('month', o.order_date) AS activity_month,
    DATE_DIFF('month', uc.cohort_month, DATE_TRUNC('month', o.order_date)) AS months_since_signup
  FROM user_cohorts uc
  INNER JOIN orders o ON uc.user_id = o.customer_id
),

cohort_sizes AS (
  SELECT
    cohort_month,
    COUNT(DISTINCT user_id) AS cohort_size
  FROM user_cohorts
  GROUP BY cohort_month
),

retention_data AS (
  SELECT
    ua.cohort_month,
    ua.months_since_signup,
    COUNT(DISTINCT ua.user_id) AS retained_users
  FROM user_activity ua
  GROUP BY ua.cohort_month, ua.months_since_signup
)

SELECT
  rd.cohort_month,
  rd.months_since_signup,
  cs.cohort_size,
  rd.retained_users,
  ROUND(100.0 * rd.retained_users / cs.cohort_size, 2) AS retention_rate
FROM retention_data rd
INNER JOIN cohort_sizes cs ON rd.cohort_month = cs.cohort_month
ORDER BY rd.cohort_month, rd.months_since_signup`,
      explanation: 'Track how customer cohorts behave over time. This analysis groups users by their signup month and measures how many remain active in subsequent months, providing insights into retention and product-market fit.',
      requiredTables: 2,
      suggestedFor: {
        domains: ['product', 'growth', 'analytics'],
        intents: ['retention', 'cohort', 'churn'],
        tablePatterns: ['user', 'order', 'event'],
      },
    },

    // Financial Analytics Templates
    {
      id: 'revenue-trends',
      name: 'Revenue Trends Analysis',
      description: 'Analyze revenue trends with period-over-period comparisons',
      category: 'aggregation',
      difficulty: 'intermediate',
      useCases: ['Financial reporting', 'Revenue analytics', 'Business intelligence'],
      sql: `-- Revenue Trends Analysis
-- Monthly revenue with YoY and MoM growth

WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', order_date) AS revenue_month,
    SUM(order_total) AS total_revenue,
    COUNT(DISTINCT order_id) AS order_count,
    COUNT(DISTINCT customer_id) AS unique_customers,
    SUM(order_total) / COUNT(DISTINCT customer_id) AS revenue_per_customer
  FROM orders
  WHERE order_status = 'completed'
  GROUP BY DATE_TRUNC('month', order_date)
),

revenue_with_comparisons AS (
  SELECT
    revenue_month,
    total_revenue,
    order_count,
    unique_customers,
    revenue_per_customer,
    LAG(total_revenue, 1) OVER (ORDER BY revenue_month) AS prev_month_revenue,
    LAG(total_revenue, 12) OVER (ORDER BY revenue_month) AS prev_year_revenue
  FROM monthly_revenue
)

SELECT
  revenue_month,
  total_revenue,
  order_count,
  unique_customers,
  ROUND(revenue_per_customer, 2) AS revenue_per_customer,
  ROUND(100.0 * (total_revenue - prev_month_revenue) / NULLIF(prev_month_revenue, 0), 2) AS mom_growth_pct,
  ROUND(100.0 * (total_revenue - prev_year_revenue) / NULLIF(prev_year_revenue, 0), 2) AS yoy_growth_pct
FROM revenue_with_comparisons
ORDER BY revenue_month DESC`,
      explanation: 'Comprehensive revenue analysis with month-over-month and year-over-year growth calculations. Includes customer metrics to understand revenue per customer trends.',
      requiredTables: 1,
      suggestedFor: {
        domains: ['finance', 'analytics', 'business-intelligence'],
        intents: ['revenue', 'financial', 'growth', 'reporting'],
        tablePatterns: ['order', 'transaction', 'sale'],
      },
    },

    // Operations Templates
    {
      id: 'inventory-turnover',
      name: 'Inventory Turnover Analysis',
      description: 'Calculate inventory turnover and identify slow-moving items',
      category: 'aggregation',
      difficulty: 'intermediate',
      useCases: ['Supply chain', 'Inventory management', 'Operations'],
      sql: `-- Inventory Turnover Analysis
-- Identify slow-moving inventory and calculate turnover rates

WITH inventory_metrics AS (
  SELECT
    p.product_id,
    p.product_name,
    p.category,
    SUM(s.quantity_sold) AS units_sold,
    AVG(i.quantity_on_hand) AS avg_inventory,
    SUM(s.quantity_sold * s.unit_price) AS total_revenue,
    MIN(i.last_restock_date) AS last_restock,
    DATE_DIFF('day', MIN(i.last_restock_date), CURRENT_DATE) AS days_since_restock
  FROM products p
  LEFT JOIN sales s ON p.product_id = s.product_id
    AND s.sale_date >= CURRENT_DATE - INTERVAL '90' DAY
  LEFT JOIN inventory i ON p.product_id = i.product_id
  GROUP BY p.product_id, p.product_name, p.category
)

SELECT
  product_id,
  product_name,
  category,
  units_sold,
  ROUND(avg_inventory, 0) AS avg_inventory,
  ROUND(total_revenue, 2) AS revenue_90d,
  ROUND(units_sold / NULLIF(avg_inventory, 0), 2) AS turnover_rate,
  days_since_restock,
  CASE
    WHEN units_sold = 0 THEN 'No Sales'
    WHEN units_sold / NULLIF(avg_inventory, 0) < 0.5 THEN 'Slow Moving'
    WHEN units_sold / NULLIF(avg_inventory, 0) < 2.0 THEN 'Normal'
    ELSE 'Fast Moving'
  END AS inventory_status
FROM inventory_metrics
ORDER BY turnover_rate ASC NULLS FIRST`,
      explanation: 'Analyzes inventory efficiency by calculating turnover rates and identifying products that need attention. Helps optimize stock levels and reduce carrying costs.',
      requiredTables: 3,
      suggestedFor: {
        domains: ['supply-chain', 'operations', 'retail'],
        intents: ['inventory', 'turnover', 'stock'],
        tablePatterns: ['product', 'inventory', 'sale'],
      },
    },

    // Data Quality Templates
    {
      id: 'data-quality-checks',
      name: 'Data Quality Validation',
      description: 'Comprehensive data quality checks for completeness, uniqueness, and validity',
      category: 'quality',
      difficulty: 'beginner',
      useCases: ['Data quality', 'Data validation', 'Data governance'],
      sql: `-- Data Quality Validation
-- Check for nulls, duplicates, and invalid values

WITH quality_metrics AS (
  SELECT
    'customers' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT customer_id) AS unique_ids,
    COUNT(*) - COUNT(DISTINCT customer_id) AS duplicate_ids,
    COUNT(*) - COUNT(email) AS null_emails,
    COUNT(*) - COUNT(phone) AS null_phones,
    SUM(CASE WHEN email NOT LIKE '%@%' THEN 1 ELSE 0 END) AS invalid_emails,
    SUM(CASE WHEN created_date > CURRENT_DATE THEN 1 ELSE 0 END) AS future_dates
  FROM customers
)

SELECT
  table_name,
  total_rows,
  unique_ids,
  ROUND(100.0 * duplicate_ids / total_rows, 2) AS duplicate_pct,
  ROUND(100.0 * null_emails / total_rows, 2) AS null_email_pct,
  ROUND(100.0 * null_phones / total_rows, 2) AS null_phone_pct,
  invalid_emails,
  future_dates,
  CASE
    WHEN duplicate_ids > 0 OR invalid_emails > 0 OR future_dates > 0 THEN 'FAIL'
    WHEN null_emails > total_rows * 0.1 THEN 'WARNING'
    ELSE 'PASS'
  END AS quality_status
FROM quality_metrics`,
      explanation: 'Performs comprehensive data quality checks including completeness, uniqueness, and validity. Identifies issues that need to be addressed before using the data for analytics.',
      requiredTables: 1,
      suggestedFor: {
        domains: ['governance', 'data-quality', 'data-engineering'],
        intents: ['quality', 'validation', 'check', 'audit'],
        tablePatterns: ['customer', 'user', 'product'],
      },
    },

    // Simple Aggregation Template
    {
      id: 'basic-aggregation',
      name: 'Basic Aggregation',
      description: 'Simple GROUP BY aggregation with common metrics',
      category: 'aggregation',
      difficulty: 'beginner',
      useCases: ['Reporting', 'Analytics', 'Dashboards'],
      sql: `-- Basic Aggregation Template
-- Group data and calculate common metrics

SELECT
  category,
  COUNT(*) AS record_count,
  COUNT(DISTINCT user_id) AS unique_users,
  SUM(amount) AS total_amount,
  AVG(amount) AS avg_amount,
  MIN(created_date) AS first_record,
  MAX(created_date) AS last_record
FROM your_table
GROUP BY category
ORDER BY total_amount DESC`,
      explanation: 'A simple starting point for aggregating data. Modify the GROUP BY columns and metrics to match your specific needs.',
      requiredTables: 1,
      suggestedFor: {
        domains: ['any'],
        intents: ['summary', 'report', 'aggregate'],
        tablePatterns: ['*'],
      },
    },

    // Join Template
    {
      id: 'two-table-join',
      name: 'Two Table Join',
      description: 'Join two related tables with proper handling of missing values',
      category: 'join',
      difficulty: 'beginner',
      useCases: ['Data enrichment', 'Combining datasets'],
      sql: `-- Two Table Join Template
-- Join related tables and handle nulls

SELECT
  a.id,
  a.name,
  a.category,
  b.related_field,
  b.metric_value,
  COALESCE(b.status, 'Unknown') AS status
FROM table_a a
LEFT JOIN table_b b ON a.id = b.foreign_key_id
WHERE a.created_date >= CURRENT_DATE - INTERVAL '30' DAY
ORDER BY a.name`,
      explanation: 'Join two tables using LEFT JOIN to preserve all records from the first table. Use COALESCE to handle missing values from the second table.',
      requiredTables: 2,
      suggestedFor: {
        domains: ['any'],
        intents: ['join', 'combine', 'enrich'],
        tablePatterns: ['*'],
      },
    },
  ];
}
