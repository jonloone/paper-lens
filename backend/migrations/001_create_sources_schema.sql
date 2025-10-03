-- Migration: 001_create_sources_schema
-- Description: Create tables for source connection management
-- Author: NexusOne Platform Team
-- Date: 2025-10-03

-- ============================================================================
-- Core Sources Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'postgresql', 'mysql', 'mongodb', etc.
    connection_mode VARCHAR(50) NOT NULL, -- 'federated', 'cdc', 'batch', 'streaming'

    -- Ownership
    domain VARCHAR(100) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    team VARCHAR(100),

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'configuring', -- 'active', 'paused', 'failed', 'deploying'
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    last_health_check TIMESTAMP,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deployed_at TIMESTAMP,

    -- Tags (array of strings)
    tags TEXT[],

    CONSTRAINT valid_connection_mode CHECK (connection_mode IN ('federated', 'cdc', 'batch', 'streaming')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'failed', 'configuring', 'deploying'))
);

-- ============================================================================
-- Source Connections Table (Stores connection details)
-- ============================================================================

CREATE TABLE IF NOT EXISTS source_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    -- Connection details
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    database_name VARCHAR(255),
    schema_name VARCHAR(255),
    username VARCHAR(255),

    -- Secret management
    password_secret_type VARCHAR(50), -- 'environment', 'k8s_secret', 'vault', 'aws_secrets', 'file', 'plaintext'
    password_secret_ref TEXT, -- Reference to secret (e.g., env var name, K8s secret path)

    ssl_enabled BOOLEAN DEFAULT true,

    -- Additional connection parameters (JSON)
    additional_params JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_secret_type CHECK (
        password_secret_type IN ('environment', 'k8s_secret', 'vault', 'aws_secrets', 'file', 'plaintext')
        OR password_secret_type IS NULL
    )
);

-- ============================================================================
-- Source Deployments Table (Tracks deployment history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS source_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    -- Deployment info
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'rolled_back'
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

    -- Deployment configuration snapshot
    deployment_config JSONB,

    -- Artifacts created during deployment
    artifacts JSONB, -- {trino_catalog, kafka_topics, iceberg_tables, debezium_connector, etc.}

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_completion TIMESTAMP,

    -- Errors
    error_message TEXT,
    error_phase VARCHAR(100),
    error_stack_trace TEXT,

    -- Deployment logs (array of log entries)
    deployment_logs JSONB[],

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255), -- Email of user who triggered deployment

    CONSTRAINT valid_deployment_status CHECK (
        status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')
    )
);

-- ============================================================================
-- Source Metrics Table (Time-series metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS source_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    -- Federated query metrics
    query_count_30d INTEGER,
    avg_query_latency_ms INTEGER,

    -- CDC metrics
    replication_lag_seconds INTEGER,
    throughput_mb_per_sec DECIMAL(10, 2),
    kafka_consumer_lag BIGINT,

    -- Batch metrics
    last_run_at TIMESTAMP,
    last_run_status VARCHAR(50), -- 'success', 'failed', 'running'
    last_run_duration_seconds INTEGER,
    success_rate_30d DECIMAL(5, 2), -- Percentage (0-100)

    -- Storage metrics
    storage_gb DECIMAL(12, 2),
    row_count BIGINT,

    -- Timestamp
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_last_run_status CHECK (
        last_run_status IN ('success', 'failed', 'running') OR last_run_status IS NULL
    )
);

-- ============================================================================
-- Source Tables Table (Tracks individual tables within a source)
-- ============================================================================

CREATE TABLE IF NOT EXISTS source_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    -- Source table identification
    table_schema VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,

    -- Metadata from source
    row_count BIGINT,
    size_mb DECIMAL(12, 2),
    primary_key_columns TEXT[], -- Array of column names
    column_count INTEGER,

    -- Destination information (for CDC/batch/streaming)
    iceberg_catalog VARCHAR(255),
    iceberg_schema VARCHAR(255),
    iceberg_table_name VARCHAR(255),
    kafka_topic_name VARCHAR(255),

    -- Data quality
    last_profiled_at TIMESTAMP,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    quality_issues JSONB, -- Array of quality issue objects

    -- DataHub integration
    datahub_urn TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(source_id, table_schema, table_name)
);

-- ============================================================================
-- Source Configurations Table (Stores detailed configuration by connection mode)
-- ============================================================================

CREATE TABLE IF NOT EXISTS source_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    -- Federated configuration
    trino_catalog_name VARCHAR(255),
    connection_pool_size INTEGER DEFAULT 10,
    connection_pool_min_size INTEGER DEFAULT 2,
    connection_pool_max_size INTEGER DEFAULT 20,
    query_timeout_seconds INTEGER DEFAULT 60,
    connection_timeout_ms INTEGER DEFAULT 30000,
    idle_timeout_ms INTEGER DEFAULT 600000,
    max_lifetime_ms INTEGER DEFAULT 1800000,
    leak_detection_threshold_ms INTEGER DEFAULT 60000,
    validation_timeout_ms INTEGER DEFAULT 5000,
    validation_query TEXT DEFAULT 'SELECT 1',

    -- CDC configuration
    debezium_connector_name VARCHAR(255),
    snapshot_mode VARCHAR(50), -- 'initial', 'schema_only', 'never'
    kafka_topic_prefix VARCHAR(255),
    kafka_partitions INTEGER,
    kafka_replication_factor INTEGER DEFAULT 3,

    -- Batch configuration
    nifi_process_group_id VARCHAR(255),
    schedule_cron_expression VARCHAR(100),
    batch_size INTEGER,

    -- Streaming configuration
    kafka_consumer_group VARCHAR(255),
    kafka_offset_reset VARCHAR(50), -- 'earliest', 'latest'

    -- Iceberg configuration (for CDC/batch/streaming)
    iceberg_catalog VARCHAR(255),
    iceberg_schema VARCHAR(255),
    iceberg_partition_spec JSONB, -- Array of partition column specifications
    iceberg_file_format VARCHAR(50) DEFAULT 'parquet', -- 'parquet', 'orc', 'avro'
    iceberg_compression VARCHAR(50) DEFAULT 'snappy',

    -- Deployment target
    deployment_target VARCHAR(50) DEFAULT 'kubernetes', -- 'kubernetes', 'self-hosted', 'cloud-managed'
    deployment_namespace VARCHAR(255),

    -- Full configuration blob (for complex scenarios)
    full_config JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_snapshot_mode CHECK (
        snapshot_mode IN ('initial', 'schema_only', 'never') OR snapshot_mode IS NULL
    ),
    CONSTRAINT valid_kafka_offset_reset CHECK (
        kafka_offset_reset IN ('earliest', 'latest') OR kafka_offset_reset IS NULL
    ),
    CONSTRAINT valid_deployment_target CHECK (
        deployment_target IN ('kubernetes', 'self-hosted', 'cloud-managed')
    )
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Sources table indexes
CREATE INDEX idx_sources_status ON sources(status);
CREATE INDEX idx_sources_connection_mode ON sources(connection_mode);
CREATE INDEX idx_sources_owner ON sources(owner_email);
CREATE INDEX idx_sources_domain ON sources(domain);
CREATE INDEX idx_sources_created_at ON sources(created_at DESC);

-- Source deployments indexes
CREATE INDEX idx_source_deployments_source_id ON source_deployments(source_id);
CREATE INDEX idx_source_deployments_status ON source_deployments(status);
CREATE INDEX idx_source_deployments_created_at ON source_deployments(created_at DESC);

-- Source metrics indexes
CREATE INDEX idx_source_metrics_source_id ON source_metrics(source_id);
CREATE INDEX idx_source_metrics_recorded_at ON source_metrics(recorded_at DESC);

-- Source tables indexes
CREATE INDEX idx_source_tables_source_id ON source_tables(source_id);
CREATE INDEX idx_source_tables_datahub_urn ON source_tables(datahub_urn);

-- Source connections indexes
CREATE INDEX idx_source_connections_source_id ON source_connections(source_id);

-- Source configurations indexes
CREATE INDEX idx_source_configurations_source_id ON source_configurations(source_id);

-- ============================================================================
-- Triggers for Updated_at Timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for sources table
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for source_tables table
CREATE TRIGGER update_source_tables_updated_at BEFORE UPDATE ON source_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for source_configurations table
CREATE TRIGGER update_source_configurations_updated_at BEFORE UPDATE ON source_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Initial Data / Seed (Optional)
-- ============================================================================

-- Insert example tags for demonstration (optional)
-- INSERT INTO sources (name, description, type, connection_mode, domain, owner_email, team, status, tags)
-- VALUES
--     ('example_postgres', 'Example PostgreSQL source', 'postgresql', 'federated', 'engineering', 'admin@example.com', 'data-platform', 'active', ARRAY['demo', 'postgres']);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE sources IS 'Main table tracking all data source connections in NexusOne';
COMMENT ON TABLE source_connections IS 'Stores connection details and credentials for sources';
COMMENT ON TABLE source_deployments IS 'Tracks deployment history and status for each source';
COMMENT ON TABLE source_metrics IS 'Time-series metrics for source health and performance monitoring';
COMMENT ON TABLE source_tables IS 'Individual tables discovered within each source';
COMMENT ON TABLE source_configurations IS 'Detailed configuration parameters specific to connection mode';

COMMENT ON COLUMN sources.connection_mode IS 'How data is accessed: federated (query-time), cdc (real-time replication), batch (scheduled sync), streaming (event-driven)';
COMMENT ON COLUMN sources.status IS 'Current operational status of the source connection';
COMMENT ON COLUMN sources.health_score IS 'Computed health score (0-100) based on uptime, lag, errors';

COMMENT ON COLUMN source_connections.password_secret_type IS 'Type of secret management system used for credentials';
COMMENT ON COLUMN source_connections.password_secret_ref IS 'Reference to secret (env var name, K8s secret path, Vault path, etc.)';

COMMENT ON COLUMN source_deployments.deployment_logs IS 'Array of timestamped log entries from deployment process';
COMMENT ON COLUMN source_deployments.artifacts IS 'JSON object containing IDs/names of created artifacts (catalogs, topics, tables, etc.)';

-- End of migration
