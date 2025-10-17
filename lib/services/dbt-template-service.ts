/**
 * DBT Template Service
 *
 * Provides intelligent dbt model template recommendations based on:
 * - User intent (from product definition)
 * - Domain knowledge (from Living Context Graph)
 * - Selected data sources
 * - Common dbt patterns and best practices
 */

export interface DbtConfig {
  materialized: 'table' | 'view' | 'incremental' | 'ephemeral';
  schema?: string;
  tags?: string[];
  partition_by?: {
    field: string;
    data_type: string;
    granularity?: string;
  };
  unique_key?: string;
  on_schema_change?: 'fail' | 'append_new_columns' | 'sync_all_columns' | 'ignore';
}

export interface DbtTemplate {
  id: string;
  name: string;
  description: string;
  category: 'staging' | 'intermediate' | 'mart' | 'snapshot' | 'metric' | 'quality';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  useCases: string[];

  // dbt Model Files
  modelSql: string;
  schemaYml: string;
  sourcesYml?: string;
  config: DbtConfig;

  // Metadata
  explanation: string;
  bestPractices: string[];
  requiredTables?: number;
  suggestedFor?: {
    domains?: string[];
    intents?: string[];
    tablePatterns?: string[];
  };
}

export interface DbtTemplateRecommendation {
  template: DbtTemplate;
  relevanceScore: number;
  reasoning: string;
}

/**
 * Analyze context and recommend relevant dbt templates
 */
export async function recommendDbtTemplates(context: {
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
}): Promise<DbtTemplateRecommendation[]> {
  const templates = getAllDbtTemplates();
  const recommendations: DbtTemplateRecommendation[] = [];

  for (const template of templates) {
    const relevance = calculateDbtRelevance(template, context);

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
 * Calculate relevance score for a dbt template
 */
function calculateDbtRelevance(
  template: DbtTemplate,
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
    reasoning: reasons.join(', ') || 'General dbt template',
  };
}

/**
 * Get all available dbt templates
 */
function getAllDbtTemplates(): DbtTemplate[] {
  return [
    // Staging Models
    {
      id: 'stg-customers',
      name: 'Staging: Customer Data',
      description: 'Clean and standardize raw customer data with basic transformations',
      category: 'staging',
      difficulty: 'beginner',
      useCases: ['Data cleaning', 'Standardization', 'Source normalization'],
      modelSql: `{{
  config(
    materialized='view',
    tags=['staging', 'customer']
  )
}}

with source as (

    select * from {{ source('raw', 'customers') }}

),

renamed as (

    select
        -- Primary Key
        customer_id,

        -- Customer Information
        lower(trim(email)) as email,
        initcap(trim(first_name)) as first_name,
        initcap(trim(last_name)) as last_name,
        phone_number,

        -- Address
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,

        -- Metadata
        customer_segment,
        signup_date,
        created_at,
        updated_at,

        -- Data Quality
        case
            when email is null or email = '' then false
            when email not like '%@%' then false
            else true
        end as is_valid_email

    from source
    where deleted_at is null  -- Exclude soft-deleted records

)

select * from renamed`,
      schemaYml: `version: 2

models:
  - name: stg_customers
    description: Staging model for customer data with basic cleaning and standardization
    columns:
      - name: customer_id
        description: Unique identifier for each customer
        tests:
          - unique
          - not_null

      - name: email
        description: Customer email address (lowercase, trimmed)
        tests:
          - not_null

      - name: first_name
        description: Customer first name (title case)

      - name: last_name
        description: Customer last name (title case)

      - name: signup_date
        description: Date when customer signed up
        tests:
          - not_null

      - name: is_valid_email
        description: Flag indicating if email is valid format
        tests:
          - accepted_values:
              values: [true, false]`,
      sourcesYml: `version: 2

sources:
  - name: raw
    description: Raw data from source systems
    database: production
    schema: raw
    tables:
      - name: customers
        description: Raw customer data from CRM
        columns:
          - name: customer_id
            description: Primary key
            tests:
              - unique
              - not_null`,
      config: {
        materialized: 'view',
        tags: ['staging', 'customer'],
      },
      explanation: 'Staging models are the foundation of your dbt project. They clean and standardize raw data, applying naming conventions, data type conversions, and basic quality checks. Always materialize staging models as views to keep them lightweight.',
      bestPractices: [
        'Use views for staging models (they re-run downstream)',
        'Apply consistent naming conventions (lowercase, snake_case)',
        'Add data quality flags (is_valid_email, etc.)',
        'Reference sources using {{ source() }} macro',
        'Filter out deleted/invalid records early',
        'Document all columns with descriptions',
      ],
      requiredTables: 1,
      suggestedFor: {
        domains: ['any'],
        intents: ['staging', 'clean', 'standardize', 'source'],
        tablePatterns: ['customer', 'user', 'raw'],
      },
    },

    // Intermediate Models
    {
      id: 'int-customer-orders',
      name: 'Intermediate: Customer Orders Joined',
      description: 'Join customer and order data with aggregated metrics',
      category: 'intermediate',
      difficulty: 'intermediate',
      useCases: ['Data joining', 'Aggregation', 'Feature engineering'],
      modelSql: `{{
  config(
    materialized='ephemeral',
    tags=['intermediate', 'customer', 'orders']
  )
}}

with customers as (

    select * from {{ ref('stg_customers') }}

),

orders as (

    select * from {{ ref('stg_orders') }}

),

order_metrics as (

    select
        customer_id,
        count(distinct order_id) as total_orders,
        sum(order_amount) as lifetime_value,
        avg(order_amount) as avg_order_value,
        min(order_date) as first_order_date,
        max(order_date) as most_recent_order_date,
        max(order_date) < current_date - interval '90 days' as is_dormant

    from orders
    where order_status = 'completed'
    group by 1

),

joined as (

    select
        c.customer_id,
        c.email,
        c.first_name,
        c.last_name,
        c.customer_segment,
        c.signup_date,

        -- Order Metrics
        coalesce(om.total_orders, 0) as total_orders,
        coalesce(om.lifetime_value, 0) as lifetime_value,
        coalesce(om.avg_order_value, 0) as avg_order_value,
        om.first_order_date,
        om.most_recent_order_date,

        -- Calculated Fields
        datediff('day', c.signup_date, om.first_order_date) as days_to_first_order,
        coalesce(om.is_dormant, false) as is_dormant,

        -- Customer Status
        case
            when om.total_orders = 0 then 'Never Purchased'
            when om.is_dormant then 'Dormant'
            when om.total_orders = 1 then 'One-Time Buyer'
            when om.total_orders >= 5 then 'VIP'
            else 'Active'
        end as customer_status

    from customers c
    left join order_metrics om
        on c.customer_id = om.customer_id

)

select * from joined`,
      schemaYml: `version: 2

models:
  - name: int_customer_orders
    description: Intermediate model joining customer and order data
    columns:
      - name: customer_id
        description: Unique customer identifier
        tests:
          - unique
          - not_null

      - name: total_orders
        description: Total number of completed orders

      - name: lifetime_value
        description: Total revenue from customer

      - name: customer_status
        description: Current customer lifecycle status
        tests:
          - accepted_values:
              values: ['Never Purchased', 'Dormant', 'One-Time Buyer', 'VIP', 'Active']`,
      config: {
        materialized: 'ephemeral',
        tags: ['intermediate', 'customer', 'orders'],
      },
      explanation: 'Intermediate models contain reusable business logic that can be used by multiple downstream models. They join and aggregate data, calculate derived fields, and implement business rules. Materialize as ephemeral to avoid unnecessary table creation.',
      bestPractices: [
        'Use ephemeral materialization for simple transformations',
        'Break complex logic into multiple intermediate models',
        'Implement business logic here (customer segmentation, etc.)',
        'Use CTEs for readability',
        'Add clear column descriptions',
        'Reference staging models with {{ ref() }}',
      ],
      requiredTables: 2,
      suggestedFor: {
        domains: ['marketing', 'sales', 'analytics'],
        intents: ['join', 'aggregate', 'customer', 'order'],
        tablePatterns: ['customer', 'order', 'user'],
      },
    },

    // Mart Models
    {
      id: 'mart-customer-360',
      name: 'Mart: Customer 360 View',
      description: 'Complete customer profile with all metrics and attributes',
      category: 'mart',
      difficulty: 'intermediate',
      useCases: ['Analytics', 'BI dashboards', 'Customer segmentation'],
      modelSql: `{{
  config(
    materialized='table',
    schema='analytics',
    tags=['mart', 'customer', 'daily']
  )
}}

with customer_base as (

    select * from {{ ref('int_customer_orders') }}

),

customer_interactions as (

    select
        customer_id,
        count(*) as total_interactions,
        max(interaction_date) as last_interaction_date
    from {{ ref('stg_interactions') }}
    group by 1

),

customer_support as (

    select
        customer_id,
        count(*) as total_support_tickets,
        avg(case when status = 'resolved' then 1 else 0 end) as support_satisfaction_rate
    from {{ ref('stg_support_tickets') }}
    group by 1

),

final as (

    select
        cb.*,

        -- Interaction Metrics
        coalesce(ci.total_interactions, 0) as total_interactions,
        ci.last_interaction_date,

        -- Support Metrics
        coalesce(cs.total_support_tickets, 0) as total_support_tickets,
        coalesce(cs.support_satisfaction_rate, 0) as support_satisfaction_rate,

        -- Engagement Score (0-100)
        least(100, greatest(0,
            (cb.total_orders * 10) +
            (coalesce(ci.total_interactions, 0) * 2) +
            (case when cb.is_dormant then -20 else 0 end) +
            (coalesce(cs.support_satisfaction_rate, 0) * 30)
        )) as engagement_score,

        -- Customer Tier
        case
            when cb.lifetime_value >= 10000 then 'Platinum'
            when cb.lifetime_value >= 5000 then 'Gold'
            when cb.lifetime_value >= 1000 then 'Silver'
            else 'Bronze'
        end as customer_tier,

        -- Metadata
        current_timestamp() as dbt_updated_at

    from customer_base cb
    left join customer_interactions ci
        on cb.customer_id = ci.customer_id
    left join customer_support cs
        on cb.customer_id = cs.customer_id

)

select * from final`,
      schemaYml: `version: 2

models:
  - name: mart_customer_360
    description: >
      Complete customer 360 view combining profile, orders, interactions, and support data.
      Updated daily. Use for customer analytics, segmentation, and BI dashboards.

    config:
      tags: ['daily']

    columns:
      - name: customer_id
        description: Unique customer identifier
        tests:
          - unique
          - not_null

      - name: email
        description: Customer email address

      - name: customer_status
        description: Lifecycle status

      - name: customer_tier
        description: Value-based tier (Platinum/Gold/Silver/Bronze)
        tests:
          - accepted_values:
              values: ['Platinum', 'Gold', 'Silver', 'Bronze']

      - name: engagement_score
        description: Composite engagement score (0-100)
        tests:
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 100

      - name: lifetime_value
        description: Total customer revenue
        tests:
          - not_null

      - name: dbt_updated_at
        description: Timestamp when record was last updated`,
      config: {
        materialized: 'table',
        schema: 'analytics',
        tags: ['mart', 'customer', 'daily'],
      },
      explanation: 'Mart models are your final analytical models designed for consumption by BI tools and analysts. They combine multiple data sources, apply complex business logic, and are optimized for query performance. Always materialize as tables.',
      bestPractices: [
        'Materialize as tables for query performance',
        'Include dbt_updated_at timestamp',
        'Add comprehensive tests',
        'Use descriptive column names',
        'Document intended use cases',
        'Consider partitioning for large datasets',
      ],
      requiredTables: 2,
      suggestedFor: {
        domains: ['marketing', 'sales', 'analytics', 'crm'],
        intents: ['customer', '360', 'profile', 'analytics'],
        tablePatterns: ['customer', 'order', 'interaction', 'user'],
      },
    },

    // Incremental Models
    {
      id: 'inc-daily-events',
      name: 'Incremental: Daily Events',
      description: 'Efficiently process large event streams with incremental loading',
      category: 'mart',
      difficulty: 'advanced',
      useCases: ['Event processing', 'Large datasets', 'Performance optimization'],
      modelSql: `{{
  config(
    materialized='incremental',
    unique_key='event_id',
    on_schema_change='append_new_columns',
    partition_by={
      'field': 'event_date',
      'data_type': 'date',
      'granularity': 'day'
    },
    tags=['incremental', 'events', 'hourly']
  )
}}

with source_events as (

    select * from {{ source('raw', 'events') }}

    {% if is_incremental() %}
    -- Only process new events since last run
    where event_timestamp > (select max(event_timestamp) from {{ this }})
    {% endif %}

),

enriched_events as (

    select
        -- Primary Key
        event_id,

        -- Event Details
        event_type,
        event_timestamp,
        date(event_timestamp) as event_date,

        -- User Information
        user_id,
        session_id,

        -- Event Properties
        page_url,
        referrer_url,
        device_type,
        browser,

        -- Derived Fields
        case
            when event_type in ('page_view', 'product_view') then 'Browse'
            when event_type in ('add_to_cart', 'remove_from_cart') then 'Cart'
            when event_type in ('purchase', 'checkout') then 'Conversion'
            else 'Other'
        end as event_category,

        -- Metadata
        current_timestamp() as dbt_processed_at

    from source_events

)

select * from enriched_events

{% if is_incremental() %}
  -- Ensure idempotency by deduping on unique_key
  qualify row_number() over (
    partition by event_id
    order by event_timestamp desc
  ) = 1
{% endif %}`,
      schemaYml: `version: 2

models:
  - name: inc_daily_events
    description: >
      Incrementally loaded event stream data. Partitioned by date for performance.
      Runs hourly to process new events.

    config:
      tags: ['hourly', 'incremental']

    columns:
      - name: event_id
        description: Unique event identifier
        tests:
          - unique
          - not_null

      - name: event_date
        description: Date partition key
        tests:
          - not_null

      - name: event_type
        description: Type of event

      - name: user_id
        description: User who triggered event

      - name: event_category
        description: High-level event category
        tests:
          - accepted_values:
              values: ['Browse', 'Cart', 'Conversion', 'Other']`,
      config: {
        materialized: 'incremental',
        unique_key: 'event_id',
        partition_by: {
          field: 'event_date',
          data_type: 'date',
          granularity: 'day',
        },
        on_schema_change: 'append_new_columns',
        tags: ['incremental', 'events', 'hourly'],
      },
      explanation: 'Incremental models only process new data since the last run, making them ideal for large event streams or append-only datasets. Use unique_key for idempotency and partition_by for query performance.',
      bestPractices: [
        'Always specify unique_key for deduplication',
        'Use is_incremental() to filter new records',
        'Partition large tables by date',
        'Add qualify for deduplication',
        'Test incrementality thoroughly',
        'Consider backfill strategies',
      ],
      requiredTables: 1,
      suggestedFor: {
        domains: ['analytics', 'product', 'growth'],
        intents: ['event', 'incremental', 'stream', 'clickstream'],
        tablePatterns: ['event', 'log', 'activity', 'interaction'],
      },
    },

    // Metric Models
    {
      id: 'metric-revenue-daily',
      name: 'Metric: Daily Revenue',
      description: 'Daily revenue metrics with period-over-period comparisons',
      category: 'metric',
      difficulty: 'intermediate',
      useCases: ['KPI tracking', 'Financial reporting', 'Executive dashboards'],
      modelSql: `{{
  config(
    materialized='table',
    schema='metrics',
    tags=['metric', 'revenue', 'daily']
  )
}}

with daily_orders as (

    select
        date(order_date) as metric_date,
        count(distinct order_id) as order_count,
        count(distinct customer_id) as unique_customers,
        sum(order_amount) as total_revenue,
        avg(order_amount) as avg_order_value

    from {{ ref('stg_orders') }}
    where order_status = 'completed'
    group by 1

),

with_comparisons as (

    select
        metric_date,
        order_count,
        unique_customers,
        total_revenue,
        avg_order_value,

        -- Day-over-Day
        lag(total_revenue, 1) over (order by metric_date) as prev_day_revenue,

        -- Week-over-Week
        lag(total_revenue, 7) over (order by metric_date) as prev_week_revenue,

        -- Year-over-Year
        lag(total_revenue, 365) over (order by metric_date) as prev_year_revenue,

        -- Moving Averages
        avg(total_revenue) over (
            order by metric_date
            rows between 6 preceding and current row
        ) as revenue_7day_ma,

        avg(total_revenue) over (
            order by metric_date
            rows between 29 preceding and current row
        ) as revenue_30day_ma

    from daily_orders

),

final as (

    select
        metric_date,
        order_count,
        unique_customers,
        total_revenue,
        avg_order_value,

        -- Growth Rates
        round(
            100.0 * (total_revenue - prev_day_revenue) / nullif(prev_day_revenue, 0),
            2
        ) as revenue_dod_pct,

        round(
            100.0 * (total_revenue - prev_week_revenue) / nullif(prev_week_revenue, 0),
            2
        ) as revenue_wow_pct,

        round(
            100.0 * (total_revenue - prev_year_revenue) / nullif(prev_year_revenue, 0),
            2
        ) as revenue_yoy_pct,

        -- Moving Averages
        round(revenue_7day_ma, 2) as revenue_7day_ma,
        round(revenue_30day_ma, 2) as revenue_30day_ma,

        -- Metadata
        current_timestamp() as dbt_updated_at

    from with_comparisons

)

select * from final
order by metric_date desc`,
      schemaYml: `version: 2

models:
  - name: metric_revenue_daily
    description: >
      Daily revenue metrics with period-over-period growth rates and moving averages.
      Used for executive dashboards and financial reporting.

    columns:
      - name: metric_date
        description: Date of metric
        tests:
          - unique
          - not_null

      - name: total_revenue
        description: Total revenue for the day
        tests:
          - not_null

      - name: revenue_dod_pct
        description: Day-over-day revenue growth percentage

      - name: revenue_wow_pct
        description: Week-over-week revenue growth percentage

      - name: revenue_yoy_pct
        description: Year-over-year revenue growth percentage`,
      config: {
        materialized: 'table',
        schema: 'metrics',
        tags: ['metric', 'revenue', 'daily'],
      },
      explanation: 'Metric models calculate KPIs and business metrics from your data. They often include period-over-period comparisons, moving averages, and other statistical aggregations. Designed for executive dashboards and reporting.',
      bestPractices: [
        'Use window functions for comparisons',
        'Handle division by zero with nullif()',
        'Round percentages to 2 decimal places',
        'Include multiple time comparisons (DoD, WoW, YoY)',
        'Add moving averages to smooth volatility',
        'Document metric definitions clearly',
      ],
      requiredTables: 1,
      suggestedFor: {
        domains: ['finance', 'analytics', 'business-intelligence'],
        intents: ['revenue', 'metric', 'kpi', 'reporting'],
        tablePatterns: ['order', 'transaction', 'sale'],
      },
    },

    // Data Quality Models
    {
      id: 'quality-customer-checks',
      name: 'Quality: Customer Data Validation',
      description: 'Comprehensive data quality checks with automated alerting',
      category: 'quality',
      difficulty: 'beginner',
      useCases: ['Data quality', 'Monitoring', 'Data governance'],
      modelSql: `{{
  config(
    materialized='view',
    schema='quality',
    tags=['quality', 'validation', 'daily']
  )
}}

with customer_data as (

    select * from {{ ref('stg_customers') }}

),

quality_checks as (

    select
        'customer_data' as table_name,
        current_date() as check_date,

        -- Row Counts
        count(*) as total_rows,
        count(distinct customer_id) as unique_customers,

        -- Completeness Checks
        count(*) - count(email) as null_emails,
        count(*) - count(first_name) as null_first_names,
        count(*) - count(signup_date) as null_signup_dates,

        -- Validity Checks
        sum(case when not is_valid_email then 1 else 0 end) as invalid_email_count,
        sum(case when signup_date > current_date() then 1 else 0 end) as future_signup_dates,

        -- Duplicate Checks
        count(*) - count(distinct customer_id) as duplicate_customer_ids,
        count(*) - count(distinct email) as duplicate_emails,

        -- Freshness Check
        max(created_at) as most_recent_record,
        datediff('hour', max(created_at), current_timestamp()) as hours_since_last_record

    from customer_data

),

quality_summary as (

    select
        *,

        -- Calculate Quality Score (0-100)
        greatest(0, least(100,
            100
            - (null_emails::float / nullif(total_rows, 0) * 100 * 2)
            - (invalid_email_count::float / nullif(total_rows, 0) * 100 * 3)
            - (duplicate_customer_ids::float / nullif(total_rows, 0) * 100 * 5)
            - (case when hours_since_last_record > 24 then 10 else 0 end)
        )) as quality_score,

        -- Overall Status
        case
            when duplicate_customer_ids > 0 then 'CRITICAL'
            when invalid_email_count > total_rows * 0.05 then 'FAIL'
            when null_emails > total_rows * 0.1 then 'WARNING'
            when hours_since_last_record > 24 then 'STALE'
            else 'PASS'
        end as quality_status

    from quality_checks

)

select * from quality_summary`,
      schemaYml: `version: 2

models:
  - name: quality_customer_checks
    description: >
      Data quality validation for customer data. Checks completeness, validity,
      uniqueness, and freshness. Run daily and alert on failures.

    tests:
      - dbt_utils.expression_is_true:
          expression: "quality_status != 'CRITICAL'"
          config:
            severity: error

      - dbt_utils.expression_is_true:
          expression: "quality_score >= 80"
          config:
            severity: warn

    columns:
      - name: check_date
        description: Date quality check was run

      - name: total_rows
        description: Total number of customer records

      - name: quality_score
        description: Overall quality score (0-100)

      - name: quality_status
        description: Quality assessment status
        tests:
          - accepted_values:
              values: ['PASS', 'WARNING', 'FAIL', 'CRITICAL', 'STALE']`,
      config: {
        materialized: 'view',
        schema: 'quality',
        tags: ['quality', 'validation', 'daily'],
      },
      explanation: 'Quality models monitor data health and alert when issues are detected. They check completeness, validity, uniqueness, and freshness. Use dbt tests to fail builds when critical issues are found.',
      bestPractices: [
        'Create one quality model per important table',
        'Calculate quality scores (0-100)',
        'Use dbt tests to alert on failures',
        'Check completeness, validity, uniqueness, freshness',
        'Set appropriate severity levels',
        'Document expected quality thresholds',
      ],
      requiredTables: 1,
      suggestedFor: {
        domains: ['governance', 'quality', 'data-engineering'],
        intents: ['quality', 'validation', 'check', 'monitor'],
        tablePatterns: ['customer', 'user', 'order', '*'],
      },
    },
  ];
}
