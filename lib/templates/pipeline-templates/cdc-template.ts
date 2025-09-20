import { PipelineTemplate } from './types';

export const cdcTemplate: PipelineTemplate = {
  id: 'cdc-database-to-lake',
  name: 'CDC: Database to Data Lake',
  description: 'Capture changes from operational database and sync to data lake',
  category: 'etl',
  tags: ['cdc', 'database', 'data-lake', 's3', 'postgres', 'mysql'],
  icon: '🔄',
  
  popularity: 95,
  usageCount: 342,
  lastUsed: new Date('2025-01-09'),
  createdBy: 'Platform Team',
  sharedWith: ['all'],
  
  estimatedBuildTime: '5 minutes',
  estimatedRunTime: 'Continuous',
  
  parameters: [
    {
      id: 'source_database',
      name: 'Source Database',
      description: 'Database to capture changes from',
      type: 'select',
      required: true,
      options: [
        { label: 'PostgreSQL Production', value: 'postgres_prod' },
        { label: 'MySQL Analytics', value: 'mysql_analytics' },
        { label: 'Oracle ERP', value: 'oracle_erp' },
        { label: 'SQL Server CRM', value: 'sqlserver_crm' }
      ]
    },
    {
      id: 'source_table',
      name: 'Source Table',
      description: 'Table name to sync (use schema.table format)',
      type: 'string',
      required: true,
      validation: {
        pattern: '^[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)?$',
        message: 'Invalid table name format'
      }
    },
    {
      id: 'target_location',
      name: 'Target S3 Location',
      description: 'S3 path for data lake storage',
      type: 'string',
      required: true,
      defaultValue: 's3://data-lake/raw/',
      validation: {
        pattern: '^s3://[a-z0-9.-]+/.*$',
        message: 'Must be a valid S3 path'
      }
    },
    {
      id: 'sync_frequency',
      name: 'Sync Frequency',
      description: 'How often to sync changes',
      type: 'select',
      required: true,
      defaultValue: 'realtime',
      options: [
        { label: 'Real-time (< 1 min)', value: 'realtime' },
        { label: 'Near real-time (5 min)', value: 'near_realtime' },
        { label: 'Micro-batch (15 min)', value: 'micro_batch' },
        { label: 'Hourly', value: 'hourly' },
        { label: 'Daily', value: 'daily' }
      ]
    },
    {
      id: 'format',
      name: 'Output Format',
      description: 'File format in data lake',
      type: 'select',
      required: true,
      defaultValue: 'parquet',
      options: [
        { label: 'Parquet (Recommended)', value: 'parquet' },
        { label: 'Delta Lake', value: 'delta' },
        { label: 'JSON', value: 'json' },
        { label: 'Avro', value: 'avro' }
      ]
    },
    {
      id: 'enable_schema_evolution',
      name: 'Enable Schema Evolution',
      description: 'Automatically handle schema changes',
      type: 'boolean',
      required: false,
      defaultValue: true
    }
  ],
  
  generates: {
    airflowDag: true,
    sqlQueries: true,
    dataHubMetadata: true,
    greatExpectations: true
  },
  
  codeTemplates: {
    airflow: `from airflow import DAG
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.amazon.aws.transfers.sql_to_s3 import SqlToS3Operator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-platform',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'cdc_{{source_database}}_{{source_table}}_to_s3',
    default_args=default_args,
    description='CDC from {{source_database}} to S3',
    schedule_interval='{{schedule}}',
    catchup=False,
    tags=['cdc', 'data-lake']
)

# Extract changed records
extract_changes = SqlToS3Operator(
    task_id='extract_changes',
    sql="""
        SELECT * FROM {{source_table}}
        WHERE updated_at > '{{ ts }}'
        OR created_at > '{{ ts }}'
    """,
    s3_bucket='{{s3_bucket}}',
    s3_key='{{s3_key}}/{{ ds }}/data.{{format}}',
    sql_conn_id='{{source_database}}',
    file_format='{{format}}',
    dag=dag
)

# Update metadata
update_metadata = PostgresOperator(
    task_id='update_metadata',
    sql="""
        INSERT INTO cdc_metadata (table_name, last_sync, record_count)
        VALUES ('{{source_table}}', '{{ ts }}', {{ ti.xcom_pull(task_ids='extract_changes') }})
    """,
    postgres_conn_id='metadata_db',
    dag=dag
)

extract_changes >> update_metadata`,
    
    sql: `-- Create CDC tracking table
CREATE TABLE IF NOT EXISTS cdc_tracking_{{table_name}} (
    id SERIAL PRIMARY KEY,
    operation VARCHAR(10),
    changed_at TIMESTAMP,
    record_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB
);

-- Create trigger for CDC
CREATE OR REPLACE FUNCTION track_changes_{{table_name}}()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO cdc_tracking_{{table_name}}(operation, changed_at, record_id, new_values)
        VALUES ('INSERT', NOW(), NEW.id::TEXT, row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO cdc_tracking_{{table_name}}(operation, changed_at, record_id, old_values, new_values)
        VALUES ('UPDATE', NOW(), NEW.id::TEXT, row_to_json(OLD), row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO cdc_tracking_{{table_name}}(operation, changed_at, record_id, old_values)
        VALUES ('DELETE', NOW(), OLD.id::TEXT, row_to_json(OLD));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to source table
CREATE TRIGGER cdc_trigger_{{table_name}}
AFTER INSERT OR UPDATE OR DELETE ON {{source_table}}
FOR EACH ROW EXECUTE FUNCTION track_changes_{{table_name}}();`,

    config: '# CDC Pipeline Configuration\nsource:\n  type: {{source_database}}\n  connection:\n    host: <DATABASE_HOST>\n    port: <DATABASE_PORT>\n    database: <DATABASE_NAME>\n    username: <DATABASE_USER>\n  table: {{source_table}}\n  \ntarget:\n  type: s3\n  bucket: {{s3_bucket}}\n  prefix: {{s3_prefix}}\n  format: {{format}}\n  \ncdc:\n  method: {{sync_frequency}}\n  batch_size: 10000\n  checkpoint_interval: 1000\n  \nquality:\n  enable_validation: true\n  sample_rate: 0.1\n  alert_on_schema_change: {{enable_schema_evolution}}\n  \nmonitoring:\n  metrics_enabled: true\n  log_level: INFO'
  },
  
  sourceRequirements: [
    {
      type: 'database',
      schema: {
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'created_at', type: 'timestamp', required: true },
          { name: 'updated_at', type: 'timestamp', required: true }
        ]
      }
    }
  ],
  
  targetRequirements: [
    {
      type: 'file',
      format: 'parquet'
    }
  ],
  
  qualityChecks: [
    {
      name: 'Record Count Validation',
      type: 'completeness',
      threshold: 99,
      action: 'warn'
    },
    {
      name: 'Primary Key Uniqueness',
      type: 'uniqueness',
      threshold: 100,
      action: 'fail'
    },
    {
      name: 'Timestamp Validity',
      type: 'validity',
      threshold: 100,
      action: 'fail'
    }
  ],
  
  monitoring: {
    metrics: [
      'records_processed',
      'sync_latency',
      'error_rate',
      'schema_changes'
    ],
    alerts: [
      {
        condition: 'sync_latency',
        threshold: 300,
        action: 'alert'
      },
      {
        condition: 'error_rate',
        threshold: 0.01,
        action: 'page'
      }
    ],
    sla: {
      completionTime: '5 minutes',
      dataFreshness: '10 minutes'
    }
  },
  
  performanceHints: [
    'Use partitioning on timestamp columns for better query performance',
    'Consider using Delta Lake format for ACID transactions',
    'Enable compression for Parquet files to reduce storage costs',
    'Implement incremental processing using watermarks'
  ],
  
  optimizationSuggestions: [
    'Add index on updated_at column for faster CDC queries',
    'Use connection pooling for database connections',
    'Batch small files into larger ones for better S3 performance'
  ]
};