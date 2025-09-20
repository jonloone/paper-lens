import { PipelineTemplate } from './types';

export const aggregationTemplate: PipelineTemplate = {
  id: 'daily-aggregation-rollup',
  name: 'Daily Aggregation Rollup',
  description: 'Aggregate detailed data into daily summaries for reporting',
  category: 'batch',
  tags: ['aggregation', 'rollup', 'reporting', 'batch', 'daily'],
  icon: '📊',
  
  popularity: 88,
  usageCount: 256,
  lastUsed: new Date('2025-01-09'),
  createdBy: 'Platform Team',
  sharedWith: ['all'],
  
  estimatedBuildTime: '10 minutes',
  estimatedRunTime: '30 minutes',
  
  parameters: [
    {
      id: 'source_table',
      name: 'Source Table',
      description: 'Detailed table to aggregate',
      type: 'string',
      required: true,
      validation: {
        pattern: '^[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)?$',
        message: 'Invalid table name format'
      }
    },
    {
      id: 'target_table',
      name: 'Target Summary Table',
      description: 'Table to store aggregated results',
      type: 'string',
      required: true,
      defaultValue: '{{source_table}}_daily_summary'
    },
    {
      id: 'date_column',
      name: 'Date Column',
      description: 'Column to use for daily grouping',
      type: 'string',
      required: true,
      defaultValue: 'created_at'
    },
    {
      id: 'group_by_columns',
      name: 'Group By Columns',
      description: 'Additional columns to group by (comma-separated)',
      type: 'string',
      required: false,
      defaultValue: ''
    },
    {
      id: 'aggregations',
      name: 'Aggregations',
      description: 'Metrics to calculate',
      type: 'multiselect',
      required: true,
      defaultValue: ['count', 'sum'],
      options: [
        { label: 'Count', value: 'count' },
        { label: 'Sum', value: 'sum' },
        { label: 'Average', value: 'avg' },
        { label: 'Min', value: 'min' },
        { label: 'Max', value: 'max' },
        { label: 'Distinct Count', value: 'count_distinct' },
        { label: 'Percentiles', value: 'percentiles' }
      ]
    },
    {
      id: 'schedule',
      name: 'Schedule',
      description: 'When to run the aggregation',
      type: 'cron',
      required: true,
      defaultValue: '0 2 * * *' // 2 AM daily
    },
    {
      id: 'lookback_days',
      name: 'Lookback Days',
      description: 'Number of days to reprocess',
      type: 'number',
      required: false,
      defaultValue: 1,
      validation: {
        min: 1,
        max: 30
      }
    }
  ],
  
  generates: {
    airflowDag: true,
    sqlQueries: true,
    sparkJob: true,
    dataHubMetadata: true
  },
  
  codeTemplates: {
    sql: `-- Daily Aggregation Query for {{source_table}}
WITH daily_data AS (
  SELECT 
    DATE({{date_column}}) as date,
    {{#if group_by_columns}}
    {{group_by_columns}},
    {{/if}}
    {{#each aggregations}}
    {{#if (eq this "count")}}
    COUNT(*) as record_count,
    {{/if}}
    {{#if (eq this "sum")}}
    SUM(amount) as total_amount,
    {{/if}}
    {{#if (eq this "avg")}}
    AVG(amount) as avg_amount,
    {{/if}}
    {{#if (eq this "min")}}
    MIN(amount) as min_amount,
    {{/if}}
    {{#if (eq this "max")}}
    MAX(amount) as max_amount,
    {{/if}}
    {{#if (eq this "count_distinct")}}
    COUNT(DISTINCT user_id) as unique_users,
    {{/if}}
    {{#if (eq this "percentiles")}}
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) as p50_amount,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY amount) as p95_amount,
    {{/if}}
    {{/each}}
    COUNT(*) as row_count
  FROM {{source_table}}
  WHERE DATE({{date_column}}) >= CURRENT_DATE - INTERVAL '{{lookback_days}} days'
    AND DATE({{date_column}}) < CURRENT_DATE
  GROUP BY 
    DATE({{date_column}})
    {{#if group_by_columns}}, {{group_by_columns}}{{/if}}
)
INSERT INTO {{target_table}}
SELECT 
  *,
  CURRENT_TIMESTAMP as processed_at,
  '{{run_id}}' as batch_id
FROM daily_data
ON CONFLICT (date{{#if group_by_columns}}, {{group_by_columns}}{{/if}})
DO UPDATE SET
  {{#each aggregations}}
  {{#if (eq this "count")}}record_count = EXCLUDED.record_count,{{/if}}
  {{#if (eq this "sum")}}total_amount = EXCLUDED.total_amount,{{/if}}
  {{#if (eq this "avg")}}avg_amount = EXCLUDED.avg_amount,{{/if}}
  {{/each}}
  processed_at = EXCLUDED.processed_at,
  batch_id = EXCLUDED.batch_id;`,
    
    airflow: `from airflow import DAG
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-platform',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'email_on_failure': True,
    'retries': 2,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'daily_aggregation_{{source_table}}',
    default_args=default_args,
    description='Daily aggregation rollup for {{source_table}}',
    schedule_interval='{{schedule}}',
    catchup=False,
    tags=['aggregation', 'daily', 'rollup']
)

# Create target table if not exists
create_table = PostgresOperator(
    task_id='create_target_table',
    sql="""
        CREATE TABLE IF NOT EXISTS {{target_table}} (
            date DATE NOT NULL,
            {{#if group_by_columns}}
            {{group_by_columns}} VARCHAR(255),
            {{/if}}
            record_count BIGINT,
            total_amount DECIMAL(20,2),
            avg_amount DECIMAL(20,2),
            unique_users BIGINT,
            processed_at TIMESTAMP,
            batch_id VARCHAR(50),
            PRIMARY KEY (date{{#if group_by_columns}}, {{group_by_columns}}{{/if}})
        );
        
        CREATE INDEX IF NOT EXISTS idx_{{target_table}}_date 
        ON {{target_table}}(date);
    """,
    postgres_conn_id='data_warehouse',
    dag=dag
)

# Run aggregation
run_aggregation = PostgresOperator(
    task_id='run_daily_aggregation',
    sql='aggregation_query.sql',
    postgres_conn_id='data_warehouse',
    dag=dag
)

# Validate results
def validate_aggregation(**context):
    # Add validation logic here
    return True

validate = PythonOperator(
    task_id='validate_results',
    python_callable=validate_aggregation,
    dag=dag
)

# Update metadata
update_metadata = PostgresOperator(
    task_id='update_metadata',
    sql="""
        INSERT INTO aggregation_metadata 
        (table_name, last_run, records_processed, status)
        VALUES ('{{target_table}}', NOW(), 
                {{ ti.xcom_pull(task_ids='run_daily_aggregation') }},
                'SUCCESS');
    """,
    postgres_conn_id='metadata_db',
    dag=dag
)

create_table >> run_aggregation >> validate >> update_metadata`,

    spark: `from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from datetime import datetime, timedelta

spark = SparkSession.builder \\
    .appName("DailyAggregation_{{source_table}}") \\
    .config("spark.sql.adaptive.enabled", "true") \\
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \\
    .getOrCreate()

# Read source data
source_df = spark.read \\
    .format("delta") \\
    .load("{{source_path}}")

# Filter for date range
lookback_date = (datetime.now() - timedelta(days={{lookback_days}})).date()
filtered_df = source_df.filter(
    (col("{{date_column}}") >= lookback_date) & 
    (col("{{date_column}}") < datetime.now().date())
)

# Perform aggregations
group_cols = ["date"]
{{#if group_by_columns}}
group_cols.extend({{group_by_columns}}.split(","))
{{/if}}

agg_df = filtered_df \\
    .withColumn("date", to_date(col("{{date_column}}"))) \\
    .groupBy(group_cols) \\
    .agg(
        count("*").alias("record_count"),
        sum("amount").alias("total_amount"),
        avg("amount").alias("avg_amount"),
        min("amount").alias("min_amount"),
        max("amount").alias("max_amount"),
        countDistinct("user_id").alias("unique_users")
    ) \\
    .withColumn("processed_at", current_timestamp()) \\
    .withColumn("batch_id", lit("{{run_id}}"))

# Write results
agg_df.write \\
    .mode("overwrite") \\
    .partitionBy("date") \\
    .format("delta") \\
    .save("{{target_path}}")

spark.stop()`
  },
  
  sourceRequirements: [
    {
      type: 'database',
      schema: {
        fields: [
          { name: 'date_column', type: 'timestamp', required: true },
          { name: 'amount', type: 'numeric', required: false }
        ]
      }
    }
  ],
  
  targetRequirements: [
    {
      type: 'database',
      schema: {
        fields: [
          { name: 'date', type: 'date', required: true },
          { name: 'record_count', type: 'bigint', required: true }
        ]
      }
    }
  ],
  
  qualityChecks: [
    {
      name: 'Minimum Record Count',
      type: 'completeness',
      threshold: 1000,
      action: 'warn'
    },
    {
      name: 'Date Coverage',
      type: 'completeness',
      threshold: 95,
      action: 'warn'
    },
    {
      name: 'Aggregation Accuracy',
      type: 'accuracy',
      threshold: 99.9,
      action: 'fail'
    }
  ],
  
  monitoring: {
    metrics: [
      'rows_processed',
      'execution_time',
      'memory_usage',
      'output_rows'
    ],
    alerts: [
      {
        condition: 'execution_time',
        threshold: 3600,
        action: 'alert'
      },
      {
        condition: 'output_rows',
        threshold: 0,
        action: 'fail'
      }
    ],
    sla: {
      completionTime: '30 minutes',
      dataFreshness: '24 hours'
    }
  },
  
  performanceHints: [
    'Create indexes on group by columns for faster aggregation',
    'Use partitioning on date column for incremental processing',
    'Consider materialized views for frequently accessed aggregations',
    'Use columnar storage formats for better compression'
  ],
  
  optimizationSuggestions: [
    'Pre-aggregate at hourly level first, then roll up to daily',
    'Use approximate algorithms for distinct counts on large datasets',
    'Implement incremental aggregation to reduce processing time'
  ]
};