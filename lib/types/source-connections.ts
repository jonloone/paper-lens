/**
 * Source Connection Management Types
 *
 * Defines types for managing source connections and data ingestion pipelines
 * that land data into Iceberg tables.
 */

// ============================================================================
// Core Types
// ============================================================================

// Legacy mode (deprecated - kept for backward compatibility)
export type IngestionMode = 'federated' | 'lakehouse' | 'hybrid';

// New unified flow: per-table ingestion methods
export type IngestionMethod =
  | 'federated'           // Query in place via Trino
  | 'incremental_query'   // Spark-based incremental load (no CDC)
  | 'batch_cdc'          // Debezium snapshot + Spark batch (no Kafka)
  | 'streaming_cdc';     // Full CDC pipeline (Debezium + Kafka + Spark Streaming)

export type DatabaseType =
  // Relational JDBC
  | 'postgresql'
  | 'mysql'
  | 'mariadb'
  | 'oracle'
  | 'sqlserver'
  | 'mongodb'

  // Cloud Warehouses
  | 'snowflake'
  | 'bigquery'
  | 'redshift'
  | 'synapse'

  // Data Lakehouses
  | 'iceberg'
  | 'delta_lake'
  | 'hudi'

  // Streaming
  | 'kafka'
  | 'kinesis'

  // Analytics/Search
  | 'elasticsearch'
  | 'cassandra'
  | 'druid';

export type ConnectorType =
  | 'jdbc'         // Traditional JDBC databases (Postgres, MySQL, Oracle, SQL Server)
  | 'kafka'        // Kafka connector for streaming data
  | 'snowflake'    // Snowflake cloud data warehouse
  | 's3_iceberg'   // S3 + Iceberg tables
  | 'delta_lake'   // Delta Lake tables
  | 'bigquery'     // Google BigQuery
  | 'redshift'     // AWS Redshift
  | 'elasticsearch' // Elasticsearch/OpenSearch
  | 'cassandra'    // Apache Cassandra
  | 'druid'        // Apache Druid
  | 'kinesis'      // AWS Kinesis
  | 'hudi'         // Apache Hudi
  | 'synapse';     // Azure Synapse

export type SourceStatus =
  | 'active'      // Running normally
  | 'paused'      // Temporarily stopped
  | 'failed'      // Error state
  | 'configuring' // Being set up
  | 'deploying';  // Deployment in progress

// ============================================================================
// Base Connection
// ============================================================================

export type SecretStorageType =
  | 'plaintext'      // Not recommended for production
  | 'environment'    // ${ENV:VAR_NAME}
  | 'file'          // ${file:/path/to/secret}
  | 'vault'         // HashiCorp Vault
  | 'k8s_secret'    // Kubernetes Secret
  | 'aws_secrets';  // AWS Secrets Manager

export interface SecretReference {
  type: SecretStorageType;
  reference: string; // e.g., "POSTGRES_PASSWORD" for env, "/secrets/db-pass" for file
  plaintext_value?: string; // Only if type is 'plaintext'
}

export interface ConnectionDetails {
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string; // Deprecated - use password_secret
  password_secret?: SecretReference;
  ssl: boolean;
  additional_params?: Record<string, string>;
}

export interface SourceConnection {
  id: string;
  name: string;
  type: DatabaseType;
  mode: IngestionMode;
  connection: ConnectionDetails;

  // Ownership & metadata
  owner: string;
  team: string;
  description?: string;
  tags?: string[];

  // Timestamps
  created_at: Date;
  updated_at: Date;

  // Status
  status: SourceStatus;
  last_health_check?: Date;
  error_message?: string;
}

// ============================================================================
// Federated Source (Trino Catalog)
// ============================================================================

export interface TrinoConfig {
  catalog_name: string;
  connector_type: DatabaseType; // Support all connector types

  // Schema mapping: source_schema -> trino_schema
  schema_mapping: Record<string, string>;

  // Connection pool settings
  connection_pool_size: number;
  connection_pool_min_size?: number;
  connection_pool_max_size?: number;

  // Query settings
  query_timeout_seconds: number;

  // Pushdown configuration
  allow_drop_table?: boolean;
  allow_rename_table?: boolean;
  case_insensitive_name_matching?: boolean;

  // Connector-specific configurations
  // Cloud warehouse configs
  snowflake_account?: string;
  snowflake_warehouse?: string;
  snowflake_database?: string;
  snowflake_role?: string;

  bigquery_project_id?: string;
  bigquery_credentials_key?: string;

  redshift_cluster_id?: string;

  synapse_database_name?: string;

  // Lakehouse configs
  iceberg_catalog_type?: 'hive' | 'hadoop' | 'nessie' | 'rest';
  iceberg_warehouse_location?: string;

  delta_lake_metastore_uri?: string;

  hudi_metastore_uri?: string;

  // Streaming configs
  kafka_bootstrap_servers?: string;
  kafka_schema_registry_url?: string;

  kinesis_aws_region?: string;
  kinesis_access_key?: string;

  // Analytics/Search configs
  elasticsearch_host?: string;
  elasticsearch_port?: number;
  elasticsearch_default_schema?: string;

  cassandra_contact_points?: string;
  cassandra_native_protocol_port?: number;

  druid_broker_url?: string;

  mongodb_connection_url?: string;
}

export interface FederatedSource extends SourceConnection {
  mode: 'federated';
  trino: TrinoConfig;
}

// ============================================================================
// Lakehouse Pipeline (CDC to Iceberg)
// ============================================================================

export type SnapshotMode =
  | 'initial'      // Full snapshot + streaming
  | 'schema_only'  // DDL only, no data
  | 'never';       // Streaming only

export type DecimalHandling =
  | 'string'   // Convert to string (safe, no precision loss)
  | 'precise'  // Use BigDecimal
  | 'double';  // Convert to double (may lose precision)

export interface DebeziumConfig {
  connector_name: string;
  snapshot_mode: SnapshotMode;
  include_schema_changes: boolean;
  decimal_handling: DecimalHandling;
  tombstones_on_delete: boolean;

  // PostgreSQL specific
  slot_name?: string;
  publication_name?: string;

  // MySQL specific
  server_id?: number;

  // Advanced
  max_batch_size?: number;
  max_queue_size?: number;
  poll_interval_ms?: number;
}

export type CompressionType = 'snappy' | 'gzip' | 'lz4' | 'zstd' | 'none';

export interface KafkaConfig {
  // Topic configuration
  topic_prefix: string;
  topic_pattern: string; // e.g., "{prefix}.{schema}.{table}"

  // Partition & replication
  partitions: number;
  replication_factor: number;

  // Retention
  retention_ms: number;  // How long to keep messages
  retention_bytes?: number;

  // Compression
  compression_type: CompressionType;

  // Advanced
  min_insync_replicas?: number;
  cleanup_policy?: 'delete' | 'compact';
}

export interface SparkConfig {
  // Job identification
  job_name: string;

  // Checkpointing
  checkpoint_location: string;
  checkpoint_interval?: string; // e.g., "10 seconds"

  // Trigger
  trigger_interval: string; // e.g., "5 minutes", "30 seconds"
  trigger_mode?: 'processing-time' | 'once' | 'continuous';

  // Resources
  executor_memory: string;    // e.g., "4g"
  executor_cores: number;
  num_executors?: number;
  driver_memory?: string;

  // Parallelism
  default_parallelism?: number;
  shuffle_partitions?: number;

  // Advanced
  max_offsets_per_trigger?: number;
  min_partitions?: number;
}

export type FileFormat = 'parquet' | 'orc' | 'avro';

export type PartitionTransform =
  | 'identity'
  | 'year'
  | 'month'
  | 'day'
  | 'hour'
  | 'bucket'
  | 'truncate';

export interface PartitionSpec {
  source_field: string;
  transform: PartitionTransform;
  transform_param?: number; // For bucket (num buckets) and truncate (width)
  name?: string; // Custom partition name
}

export type MergeStrategy =
  | 'append'   // Just append new records
  | 'upsert'   // Update existing, insert new
  | 'delete';  // Handle deletes (requires primary key)

export interface IcebergConfig {
  // Catalog configuration
  catalog_name: string;
  catalog_type: 'hive' | 'hadoop' | 'nessie' | 'rest';

  // Namespace (database)
  namespace: string;

  // Table configuration
  table_prefix?: string;
  file_format: FileFormat;

  // Partitioning
  partition_spec?: PartitionSpec[];

  // Merge strategy
  merge_strategy: MergeStrategy;
  primary_key_columns?: string[]; // Required for upsert/delete

  // Compaction
  compaction_enabled?: boolean;
  compaction_schedule?: string; // Cron expression

  // Table properties
  write_format_default?: FileFormat;
  parquet_compression?: CompressionType;
  target_file_size_bytes?: number;
}

export interface PipelineConfig {
  debezium: DebeziumConfig;
  kafka: KafkaConfig;
  spark: SparkConfig;
  iceberg: IcebergConfig;
}

// ============================================================================
// Table Selection
// ============================================================================

export interface SelectedTable {
  schema: string;
  table: string;
  primary_key?: string[];

  // Metadata from discovery
  estimated_rows?: number;
  estimated_size_mb?: number;
  last_updated?: Date;

  // Column information
  columns?: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  is_primary_key?: boolean;
  default_value?: string;
}

// ============================================================================
// Pipeline Health & Monitoring
// ============================================================================

export type ComponentStatus =
  | 'running'
  | 'paused'
  | 'failed'
  | 'stopped'
  | 'deploying'
  | 'unknown';

export interface PipelineHealth {
  // Overall status
  overall_status: ComponentStatus;
  health_score: number; // 0-100

  // Component statuses
  debezium_status: ComponentStatus;
  kafka_status: ComponentStatus;
  spark_status: ComponentStatus;
  iceberg_status: ComponentStatus;

  // Metrics
  kafka_lag_messages?: number;
  kafka_lag_seconds?: number;
  spark_checkpoint_age_seconds?: number;
  last_record_timestamp?: Date;
  records_ingested_last_hour?: number;
  records_ingested_total?: number;

  // Errors
  error_count_last_hour?: number;
  last_error_message?: string;
  last_error_timestamp?: Date;

  // Performance
  avg_ingestion_rate_per_sec?: number;
  current_throughput_mb_per_sec?: number;
}

export interface LakehouseSource extends SourceConnection {
  mode: 'lakehouse';
  pipeline: PipelineConfig;
  selected_tables: SelectedTable[];
  health: PipelineHealth;
}

// ============================================================================
// Hybrid Source (Combination)
// ============================================================================

export interface HybridSource extends SourceConnection {
  mode: 'hybrid';

  // Some tables federated, some replicated
  federated_tables: string[];      // List of table names
  lakehouse_tables: SelectedTable[];

  // Both configurations present
  trino?: TrinoConfig;
  pipeline?: PipelineConfig;
  health?: PipelineHealth;
}

// ============================================================================
// Union Type
// ============================================================================

export type AnySource = FederatedSource | LakehouseSource | HybridSource;

// ============================================================================
// Schema Discovery
// ============================================================================

export interface Schema {
  name: string;
  table_count: number;
  estimated_size_mb?: number;
}

export interface Table {
  schema: string;
  name: string;
  type: 'table' | 'view' | 'materialized_view';
  row_count?: number;
  size_mb?: number;
  columns: ColumnInfo[];
  primary_keys: string[];
  indexes?: IndexInfo[];
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
}

// ============================================================================
// Testing & Validation
// ============================================================================

export interface ConnectionTestResult {
  success: boolean;
  latency_ms?: number;
  server_version?: string;
  error_message?: string;

  // Detailed checks
  checks: {
    connectivity: boolean;
    authentication: boolean;
    permissions: boolean;
    ssl_verified?: boolean;
  };
}

export interface PreflightCheckResult {
  passed: boolean;
  checks: {
    source_connectivity: boolean;
    replication_user_permissions?: boolean;
    kafka_cluster_available?: boolean;
    spark_cluster_available?: boolean;
    iceberg_catalog_accessible?: boolean;
    sufficient_storage_quota?: boolean;
  };
  warnings?: string[];
  errors?: string[];
  estimated_initial_load_gb?: number;
  estimated_duration_minutes?: number;
}

// ============================================================================
// Deployment
// ============================================================================

export type DeploymentStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'rolled_back';

export interface DeploymentStep {
  name: string;
  status: DeploymentStatus;
  start_time?: Date;
  end_time?: Date;
  error_message?: string;
}

export interface DeploymentResult {
  success: boolean;
  deployment_id: string;
  overall_status: DeploymentStatus;

  steps: DeploymentStep[];

  // Deployed component IDs
  debezium_connector_id?: string;
  kafka_topics?: string[];
  spark_job_id?: string;
  iceberg_tables?: string[];

  error_message?: string;
  started_at: Date;
  completed_at?: Date;
}

// ============================================================================
// Log Entries
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: 'debezium' | 'kafka' | 'spark' | 'iceberg' | 'system';
  message: string;
  context?: Record<string, any>;
  stack_trace?: string;
}

// ============================================================================
// Recommendation Engine
// ============================================================================

export interface IngestionRecommendation {
  recommended_mode: IngestionMode;
  confidence: number; // 0-1
  reasoning: string[];

  // If hybrid is recommended
  recommended_split?: {
    federated: string[]; // Table names
    lakehouse: string[];
  };

  // Performance estimates
  estimated_query_latency_ms?: {
    federated?: number;
    lakehouse?: number;
  };

  estimated_cost_per_month?: {
    federated?: number;
    lakehouse?: number;
  };
}

export interface TableCharacteristics {
  table_name: string;
  row_count: number;
  size_mb: number;
  update_frequency: 'static' | 'hourly' | 'daily' | 'real-time';
  query_frequency: 'rare' | 'occasional' | 'frequent' | 'very_frequent';
  join_complexity: 'simple' | 'moderate' | 'complex';
  business_criticality: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// Unified Source Ingestion Flow (New)
// ============================================================================

/**
 * Per-table ingestion configuration
 * Replaces source-level mode selection with table-level method selection
 */
export interface TableIngestionConfig {
  schema: string;
  table: string;
  method: IngestionMethod;

  // Sync state
  enabled?: boolean; // Default true. If false, table is discovered but not syncing

  // Common to all replicated methods
  primaryKey?: string[];
  partitionBy?: string[];

  // Streaming CDC specific
  streamingConfig?: {
    kafkaTopic: string;
    updateFrequency: 'real-time' | '5min' | '15min' | '30min';
    captureDeletes: boolean;
    snapshotMode: 'initial' | 'schema_only' | 'never';
  };

  // Batch CDC specific
  batchCdcConfig?: {
    schedule: 'hourly' | 'daily' | 'weekly';
    scheduleTime?: string; // e.g., "02:00" for 2 AM
    captureDeletes: boolean;
    snapshotMode: 'initial' | 'schema_only';
    batchInterval?: string; // e.g., "5 minutes", "15 minutes"
  };

  // Incremental Query specific
  incrementalConfig?: {
    timestampColumn: string;
    watermarkOffset: string; // e.g., "1 hour"
    schedule: 'hourly' | 'every_6_hours' | 'daily';
    scheduleTime?: string;
  };
}

/**
 * Complete CDC pipeline configuration
 * Encompasses Debezium, Kafka (optional), Spark, and Iceberg
 */
export interface CDCPipelineConfig {
  pipelineId: string;
  pipelineName: string;

  // Source database
  source: ConnectionDetails;

  // Tables with their ingestion configs
  tables: TableIngestionConfig[];

  // Infrastructure components (conditionally required based on methods)
  debezium?: DebeziumConfig;   // Required for: batch_cdc, streaming_cdc
  kafka?: KafkaConfig;          // Required for: streaming_cdc
  spark: SparkConfig;           // Required for: all replication methods
  iceberg: IcebergConfig;       // Required for: all replication methods

  // Deployment
  namespace: string;
  resourceLimits?: {
    debeziumMemory?: string;
    sparkExecutorMemory: string;
    sparkExecutorCores: number;
  };
}

/**
 * Unified source connection (replaces mode-specific types)
 */
export interface UnifiedSourceConnection {
  id: string;
  name: string;
  type: DatabaseType;

  // Connection details
  connection: ConnectionDetails;

  // Federated query config (Trino catalog)
  trino?: TrinoConfig;

  // Tables and their ingestion methods
  tables: TableIngestionConfig[];

  // Ownership & metadata
  owner: string;
  team: string;
  description?: string;
  tags?: string[];

  // Timestamps
  created_at: Date;
  updated_at: Date;

  // Status
  status: SourceStatus;
  last_health_check?: Date;
  error_message?: string;
}

/**
 * Smart recommendation for ingestion method per table
 */
export interface TableIngestionRecommendation {
  schema: string;
  table: string;

  // Primary recommendation
  recommendedMethod: IngestionMethod;
  confidence: number; // 0-1
  reasoning: string[];

  // Alternative methods ranked by suitability
  alternatives: Array<{
    method: IngestionMethod;
    confidence: number;
    tradeoffs: string[];
  }>;

  // Estimated costs & performance
  estimates: {
    [K in IngestionMethod]?: {
      latency: string;           // e.g., "< 1 minute", "hourly"
      infrastructure: string[];  // Required components
      monthlyCost: number;       // USD estimate
      complexity: 'low' | 'medium' | 'high';
    };
  };

  // Table analysis that informed the recommendation
  analysis: {
    rowCount: number;
    sizeMB: number;
    hasTimestampColumn: boolean;
    timestampColumnName?: string;
    primaryKeys: string[];
    updatePattern: 'append-only' | 'updates' | 'deletes' | 'unknown';
    updateFrequency: 'static' | 'hourly' | 'daily' | 'real-time';
  };
}
