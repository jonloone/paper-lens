/**
 * CDC Wizard Types
 * Type definitions for the 5-step CDC pipeline deployment wizard
 */

// Source selection (Step 1)
export interface SourceSummary {
  id: string;
  name: string;
  type: string;
  connection_mode: 'federated' | 'cdc' | 'batch' | 'streaming';
  domain: string;
  status: 'active' | 'paused' | 'failed' | 'configuring' | 'deploying';
  health_score: number;
  owner_email: string;
  created_at: string;
  table_count: number;
}

// Kafka configuration (Step 2)
export type CompressionType = 'none' | 'gzip' | 'snappy' | 'lz4' | 'zstd';
export type CleanupPolicy = 'delete' | 'compact' | 'compact,delete';

export interface KafkaTopicConfig {
  name: string;
  partitions: number;
  replication_factor: number;
  retention_ms?: number;
  retention_bytes?: number;
  compression_type: CompressionType;
  cleanup_policy: CleanupPolicy;
  min_insync_replicas: number;
  segment_ms?: number;
  max_message_bytes?: number;
  additional_config?: Record<string, any>;
}

// Debezium configuration (Step 3)
export type SnapshotMode = 'initial' | 'initial_only' | 'when_needed' | 'never' | 'schema_only' | 'schema_only_recovery';
export type ConnectorType =
  | 'io.debezium.connector.postgresql.PostgresConnector'
  | 'io.debezium.connector.mysql.MySqlConnector'
  | 'io.debezium.connector.mongodb.MongoDbConnector'
  | 'io.debezium.connector.sqlserver.SqlServerConnector'
  | 'io.debezium.connector.oracle.OracleConnector'
  | 'io.debezium.connector.db2.Db2Connector';

export interface DebeziumConnectorConfig {
  name: string;
  connector_class: ConnectorType;
  database_hostname: string;
  database_port: number;
  database_user: string;
  database_password: string;
  database_dbname: string;
  database_server_name: string;
  snapshot_mode: SnapshotMode;
  kafka_topic_prefix: string;
  schema_include_list?: string;
  table_include_list?: string;
  schema_exclude_list?: string;
  table_exclude_list?: string;
  column_include_list?: string;
  column_exclude_list?: string;
  max_batch_size: number;
  max_queue_size: number;
  poll_interval_ms: number;
  heartbeat_interval_ms: number;
  heartbeat_topics_prefix?: string;
  tombstones_on_delete: boolean;
  decimal_handling_mode: string;
  binary_handling_mode: string;
  slot_name?: string;
  publication_name?: string;
  plugin_name?: string;
  tasks_max: number;
  additional_config?: Record<string, any>;
}

// Iceberg configuration (Step 4)
export type FileFormat = 'parquet' | 'orc' | 'avro';
export type CompressionCodec = 'none' | 'snappy' | 'gzip' | 'zstd' | 'lz4';
export type PartitionTransform = 'identity' | 'year' | 'month' | 'day' | 'hour' | 'bucket' | 'truncate';
export type SortOrder = 'asc' | 'desc';

export interface ColumnSchema {
  name: string;
  type: string;
  required: boolean;
  doc?: string;
  default?: any;
}

export interface PartitionSpec {
  source_column: string;
  transform: PartitionTransform;
  name?: string;
  transform_param?: number;
}

export interface SortField {
  source_column: string;
  transform: PartitionTransform;
  direction: SortOrder;
  null_order: string;
}

export interface IcebergTableConfig {
  catalog_name: string;
  database_name: string;
  table_name: string;
  columns: ColumnSchema[];
  partition_spec?: PartitionSpec[];
  sort_order?: SortField[];
  file_format: FileFormat;
  compression_codec: CompressionCodec;
  location?: string;
  table_properties?: Record<string, string>;
  write_target_file_size_bytes: number;
  write_distribution_mode: string;
  comment?: string;
}

// Complete CDC deployment request (Step 5)
export interface CDCDeploymentRequest {
  source_id: string;
  kafka_topic_config: KafkaTopicConfig;
  debezium_config: DebeziumConnectorConfig;
  iceberg_configs: IcebergTableConfig[];
  dry_run: boolean;
  skip_existing: boolean;
  auto_rollback: boolean;
}

// Deployment result
export type DeploymentPhase =
  | 'validation'
  | 'kafka_topic_creation'
  | 'debezium_deployment'
  | 'iceberg_table_creation'
  | 'verification'
  | 'monitoring_setup';

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface PhaseResult {
  phase: DeploymentPhase;
  status: PhaseStatus;
  message: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  warnings: string[];
  errors: string[];
  artifacts?: Record<string, any>;
}

export interface CDCDeploymentResult {
  deployment_id: string;
  source_id: string;
  source_name: string;
  status: string;
  message: string;
  phases: PhaseResult[];
  started_at: string;
  completed_at?: string;
  total_duration_seconds?: number;
  kafka_topic?: string;
  debezium_connector?: string;
  iceberg_tables: string[];
  validation_checks: Array<{
    check: string;
    passed: boolean;
    message: string;
  }>;
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  warnings_count: number;
}

// Wizard state
export interface CDCWizardState {
  currentStep: number;
  selectedSource?: SourceSummary;
  kafkaConfig?: KafkaTopicConfig;
  debeziumConfig?: DebeziumConnectorConfig;
  icebergConfigs?: IcebergTableConfig[];
  validationResults?: {
    kafka?: any;
    debezium?: any;
    iceberg?: any[];
  };
  deploymentResult?: CDCDeploymentResult;
  isDeploying: boolean;
  isDryRun: boolean;
}

// Validation results
export interface ValidationResult {
  valid: boolean;
  checks: Array<{
    check: string;
    passed: boolean;
    message: string;
  }>;
  warnings: string[];
  errors: string[];
}
