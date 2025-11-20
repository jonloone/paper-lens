-- Table Ingestion Configurations Schema
-- Stores per-table ingestion method selections and configurations
-- Supports the multi-catalog architecture for mixed ingestion methods

-- Source connections table
CREATE TABLE IF NOT EXISTS source_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- postgresql, mysql, etc.
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    database VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,

    -- Default ingestion method for this connection
    default_method VARCHAR(50) NOT NULL CHECK (default_method IN ('federated', 'incremental_query', 'batch_cdc', 'streaming_cdc')),

    -- Metadata
    description TEXT,
    team VARCHAR(255),
    owner_email VARCHAR(255),
    tags TEXT[], -- PostgreSQL array

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Table ingestion configurations (per-table method override)
CREATE TABLE IF NOT EXISTS table_ingestion_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES source_connections(id) ON DELETE CASCADE,

    -- Table identification
    schema_name VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,

    -- Ingestion method (can override connection default)
    ingestion_method VARCHAR(50) NOT NULL CHECK (ingestion_method IN ('federated', 'incremental_query', 'batch_cdc', 'streaming_cdc')),

    -- Incremental-specific configuration
    timestamp_column VARCHAR(255),
    schedule VARCHAR(255), -- cron expression
    watermark_offset VARCHAR(50), -- e.g., '1 hour', '30 minutes'

    -- CDC-specific configuration
    primary_key_columns TEXT[], -- PostgreSQL array
    snapshot_mode VARCHAR(50) CHECK (snapshot_mode IN ('initial', 'schema_only', 'never')),
    capture_deletes BOOLEAN DEFAULT TRUE,

    -- Common configuration
    enabled BOOLEAN DEFAULT TRUE,
    estimated_row_count BIGINT,
    estimated_size_gb DECIMAL(10, 2),

    -- AI recommendations (stored for audit trail)
    recommended_method VARCHAR(50),
    recommendation_reason TEXT,
    recommendation_confidence VARCHAR(20), -- high, medium, low
    recommendation_applied BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),

    -- Unique constraint: one config per table per connection
    UNIQUE(connection_id, schema_name, table_name)
);

-- Generated Trino catalogs (tracks what catalogs have been deployed)
CREATE TABLE IF NOT EXISTS trino_catalogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES source_connections(id) ON DELETE CASCADE,

    -- Catalog details
    catalog_name VARCHAR(255) NOT NULL UNIQUE,
    connector_type VARCHAR(50) NOT NULL, -- postgresql, iceberg, etc.
    access_pattern VARCHAR(50) NOT NULL CHECK (access_pattern IN ('federated', 'replicated')),

    -- Configuration (JSONB for flexibility)
    properties JSONB NOT NULL,

    -- Deployment status
    deployment_status VARCHAR(50) DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'deployed', 'failed', 'deprecated')),
    deployed_at TIMESTAMP WITH TIME ZONE,
    deployment_notes TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Replication jobs (tracks Spark/Airflow jobs)
CREATE TABLE IF NOT EXISTS replication_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES source_connections(id) ON DELETE CASCADE,
    table_config_id UUID REFERENCES table_ingestion_configs(id) ON DELETE CASCADE,

    -- Job details
    job_name VARCHAR(255) NOT NULL UNIQUE,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('spark_incremental', 'spark_cdc_batch', 'flink_cdc_stream')),

    -- Configuration (JSONB for flexibility - stores Spark config, DAG definition, etc.)
    job_config JSONB NOT NULL,

    -- Scheduling
    schedule VARCHAR(255), -- cron expression
    enabled BOOLEAN DEFAULT TRUE,

    -- Deployment status
    deployment_status VARCHAR(50) DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'deployed', 'failed', 'paused')),
    deployed_at TIMESTAMP WITH TIME ZONE,

    -- Runtime statistics
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(50),
    last_run_duration_ms INTEGER,
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CDC connectors (tracks Debezium connectors)
CREATE TABLE IF NOT EXISTS cdc_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES source_connections(id) ON DELETE CASCADE,

    -- Connector details
    connector_name VARCHAR(255) NOT NULL UNIQUE,
    connector_class VARCHAR(255) NOT NULL, -- io.debezium.connector.postgresql.PostgresConnector

    -- Configuration (JSONB stores Debezium connector config)
    connector_config JSONB NOT NULL,

    -- Tables captured by this connector (array of table names)
    tables_included TEXT[],

    -- Deployment status
    deployment_status VARCHAR(50) DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'deployed', 'running', 'paused', 'failed')),
    deployed_at TIMESTAMP WITH TIME ZONE,

    -- Runtime statistics
    last_offset JSONB, -- Debezium offset tracking
    total_events_captured BIGINT DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kafka topics (tracks CDC event topics)
CREATE TABLE IF NOT EXISTS kafka_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES source_connections(id) ON DELETE CASCADE,
    cdc_connector_id UUID REFERENCES cdc_connectors(id) ON DELETE CASCADE,

    -- Topic details
    topic_name VARCHAR(255) NOT NULL UNIQUE,
    partitions INTEGER NOT NULL DEFAULT 3,
    replication_factor INTEGER NOT NULL DEFAULT 3,

    -- Topic configuration (JSONB)
    topic_config JSONB,

    -- Deployment status
    deployment_status VARCHAR(50) DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'created', 'deleted')),
    created_at_kafka TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_table_configs_connection ON table_ingestion_configs(connection_id);
CREATE INDEX idx_table_configs_method ON table_ingestion_configs(ingestion_method);
CREATE INDEX idx_table_configs_enabled ON table_ingestion_configs(enabled);

CREATE INDEX idx_catalogs_connection ON trino_catalogs(connection_id);
CREATE INDEX idx_catalogs_status ON trino_catalogs(deployment_status);

CREATE INDEX idx_replication_jobs_connection ON replication_jobs(connection_id);
CREATE INDEX idx_replication_jobs_table_config ON replication_jobs(table_config_id);
CREATE INDEX idx_replication_jobs_status ON replication_jobs(deployment_status);
CREATE INDEX idx_replication_jobs_enabled ON replication_jobs(enabled);

CREATE INDEX idx_cdc_connectors_connection ON cdc_connectors(connection_id);
CREATE INDEX idx_cdc_connectors_status ON cdc_connectors(deployment_status);

CREATE INDEX idx_kafka_topics_connector ON kafka_topics(cdc_connector_id);

-- Materialized view: Connection deployment status summary
CREATE MATERIALIZED VIEW connection_deployment_summary AS
SELECT
    sc.id AS connection_id,
    sc.name AS connection_name,
    sc.type AS source_type,
    sc.default_method,

    -- Table configurations
    COUNT(DISTINCT tic.id) AS total_tables_configured,
    COUNT(DISTINCT tic.id) FILTER (WHERE tic.enabled) AS enabled_tables,

    -- Method breakdown
    COUNT(DISTINCT tic.id) FILTER (WHERE tic.ingestion_method = 'federated') AS federated_tables,
    COUNT(DISTINCT tic.id) FILTER (WHERE tic.ingestion_method = 'incremental_query') AS incremental_tables,
    COUNT(DISTINCT tic.id) FILTER (WHERE tic.ingestion_method = 'batch_cdc') AS batch_cdc_tables,
    COUNT(DISTINCT tic.id) FILTER (WHERE tic.ingestion_method = 'streaming_cdc') AS streaming_cdc_tables,

    -- Deployment status
    COUNT(DISTINCT tc.id) AS catalogs_deployed,
    COUNT(DISTINCT rj.id) AS replication_jobs_deployed,
    COUNT(DISTINCT cc.id) AS cdc_connectors_deployed,

    -- Runtime statistics
    SUM(rj.total_runs) AS total_replication_runs,
    SUM(rj.successful_runs) AS successful_runs,
    SUM(rj.failed_runs) AS failed_runs

FROM source_connections sc
LEFT JOIN table_ingestion_configs tic ON sc.id = tic.connection_id
LEFT JOIN trino_catalogs tc ON sc.id = tc.connection_id AND tc.deployment_status = 'deployed'
LEFT JOIN replication_jobs rj ON sc.id = rj.connection_id
LEFT JOIN cdc_connectors cc ON sc.id = cc.connection_id
GROUP BY sc.id, sc.name, sc.type, sc.default_method;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_connection_deployment_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW connection_deployment_summary;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_source_connections_updated_at BEFORE UPDATE ON source_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_configs_updated_at BEFORE UPDATE ON table_ingestion_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalogs_updated_at BEFORE UPDATE ON trino_catalogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_replication_jobs_updated_at BEFORE UPDATE ON replication_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cdc_connectors_updated_at BEFORE UPDATE ON cdc_connectors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kafka_topics_updated_at BEFORE UPDATE ON kafka_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for POC demonstration
INSERT INTO source_connections (name, type, host, port, database, username, default_method, description, team, owner_email)
VALUES (
    'prod_postgres',
    'postgresql',
    'prod-db.company.com',
    5432,
    'production',
    'readonly_user',
    'incremental_query',
    'Production PostgreSQL database',
    'Data Platform',
    'data-platform@company.com'
) ON CONFLICT (name) DO NOTHING;

-- Get the connection ID
DO $$
DECLARE
    conn_id UUID;
BEGIN
    SELECT id INTO conn_id FROM source_connections WHERE name = 'prod_postgres';

    -- Sample table configurations demonstrating mixed methods
    INSERT INTO table_ingestion_configs (
        connection_id, schema_name, table_name, ingestion_method,
        timestamp_column, schedule, watermark_offset,
        estimated_row_count, recommended_method, recommendation_reason, recommendation_confidence
    ) VALUES
        -- Small reference tables → Federated
        (conn_id, 'public', 'products', 'federated', NULL, NULL, NULL, 5000,
         'federated', 'Small table - federated query is simple and cost-effective', 'medium'),

        (conn_id, 'public', 'categories', 'federated', NULL, NULL, NULL, 100,
         'federated', 'Small table - federated query is simple and cost-effective', 'high'),

        -- Medium table with timestamp → Incremental
        (conn_id, 'public', 'customers', 'incremental_query', 'updated_at', '0 */6 * * *', '1 hour', 125000,
         'incremental_query', 'Has timestamp column - good fit for incremental sync', 'high'),

        -- Large table → Batch CDC
        (conn_id, 'public', 'orders', 'batch_cdc', NULL, NULL, NULL, 2500000,
         'batch_cdc', 'Large table with frequent changes - CDC minimizes data transfer', 'high'),

        -- Critical real-time table → Streaming CDC
        (conn_id, 'analytics', 'user_events', 'streaming_cdc', NULL, NULL, NULL, 10000000,
         'streaming_cdc', 'Very large table requiring real-time updates', 'high')
    ON CONFLICT (connection_id, schema_name, table_name) DO NOTHING;
END $$;

-- Comments for documentation
COMMENT ON TABLE source_connections IS 'Source database connections with default ingestion method';
COMMENT ON TABLE table_ingestion_configs IS 'Per-table ingestion method configurations - enables mixed methods within a single connection';
COMMENT ON TABLE trino_catalogs IS 'Deployed Trino catalogs - one per ingestion method per connection';
COMMENT ON TABLE replication_jobs IS 'Spark/Airflow jobs for incremental sync and batch CDC processing';
COMMENT ON TABLE cdc_connectors IS 'Debezium connectors for change data capture';
COMMENT ON TABLE kafka_topics IS 'Kafka topics for CDC event streaming';
COMMENT ON MATERIALIZED VIEW connection_deployment_summary IS 'Summary view of connection deployment status and statistics';
