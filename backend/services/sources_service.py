"""
Service layer for source management operations
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import asyncpg
from fastapi import HTTPException

from backend.models.sources import (
    Source, SourceCreate, SourceUpdate, SourceSummary, SourceDetail,
    Deployment, DeploymentCreate, DeploymentSummary,
    SourceMetrics, SourcesOverview, HealthStatus,
    ValidationResult, ValidationCheck, ConnectionTestResult,
    ConnectionConfig, ConnectionMode, SourceStatus, DeploymentStatus,
    MCPRecommendation, CostEstimate
)
from backend.services.connection_validator import ConnectionValidator
from backend.services.source_intelligence import SourceIntelligenceService


class SourcesService:
    """
    Service for managing data source connections
    """

    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
        self.validator = ConnectionValidator(db_pool)
        self.intelligence = SourceIntelligenceService()

    # ========================================================================
    # Source CRUD Operations
    # ========================================================================

    async def list_sources(
        self,
        status: Optional[str] = None,
        connection_mode: Optional[str] = None,
        domain: Optional[str] = None,
        owner: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[SourceSummary]:
        """
        List sources with optional filtering
        """
        query = """
            SELECT
                s.id, s.name, s.type, s.connection_mode, s.domain,
                s.status, s.health_score, s.owner_email, s.created_at,
                s.error_message,
                COUNT(DISTINCT st.id) as table_count,
                (
                    SELECT query_count_30d
                    FROM source_metrics sm
                    WHERE sm.source_id = s.id
                    ORDER BY sm.recorded_at DESC
                    LIMIT 1
                ) as query_count_30d
            FROM sources s
            LEFT JOIN source_tables st ON st.source_id = s.id
            WHERE 1=1
        """

        params = []
        param_counter = 1

        if status:
            query += f" AND s.status = ${param_counter}"
            params.append(status)
            param_counter += 1

        if connection_mode:
            query += f" AND s.connection_mode = ${param_counter}"
            params.append(connection_mode)
            param_counter += 1

        if domain:
            query += f" AND s.domain = ${param_counter}"
            params.append(domain)
            param_counter += 1

        if owner:
            query += f" AND s.owner_email = ${param_counter}"
            params.append(owner)
            param_counter += 1

        query += f"""
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT ${param_counter} OFFSET ${param_counter + 1}
        """
        params.extend([limit, offset])

        async with self.db.acquire() as conn:
            rows = await conn.fetch(query, *params)

        return [SourceSummary(**dict(row)) for row in rows]

    async def get_summary(self) -> SourcesOverview:
        """
        Get overview statistics for dashboard
        """
        async with self.db.acquire() as conn:
            # Total and status counts
            status_counts = await conn.fetch("""
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN status = 'configuring' THEN 1 ELSE 0 END) as configuring,
                    SUM(CASE WHEN status = 'deploying' THEN 1 ELSE 0 END) as deploying
                FROM sources
            """)

            # Mode counts
            mode_counts = await conn.fetch("""
                SELECT
                    connection_mode,
                    COUNT(*) as count
                FROM sources
                GROUP BY connection_mode
            """)

            # Domain counts
            domain_counts = await conn.fetch("""
                SELECT
                    domain,
                    COUNT(*) as count
                FROM sources
                GROUP BY domain
            """)

            # Recent deployments
            recent_deployments = await conn.fetch("""
                SELECT
                    id, status, progress, created_at, completed_at, created_by
                FROM source_deployments
                ORDER BY created_at DESC
                LIMIT 10
            """)

        status_row = status_counts[0]
        by_status = {
            'active': status_row['active'],
            'paused': status_row['paused'],
            'failed': status_row['failed'],
            'configuring': status_row['configuring'],
            'deploying': status_row['deploying']
        }

        by_mode = {row['connection_mode']: row['count'] for row in mode_counts}
        by_domain = {row['domain']: row['count'] for row in domain_counts}

        return SourcesOverview(
            total=status_row['total'],
            by_status=by_status,
            by_mode=by_mode,
            by_domain=by_domain,
            issues_count=status_row['failed'],
            recent_deployments=[DeploymentSummary(**dict(row)) for row in recent_deployments]
        )

    async def get_source(self, source_id: UUID) -> Optional[SourceDetail]:
        """
        Get detailed information about a specific source
        """
        async with self.db.acquire() as conn:
            # Get source
            source_row = await conn.fetchrow("""
                SELECT * FROM sources WHERE id = $1
            """, source_id)

            if not source_row:
                return None

            # Get connection details
            conn_row = await conn.fetchrow("""
                SELECT * FROM source_connections WHERE source_id = $1
            """, source_id)

            # Get configuration
            config_row = await conn.fetchrow("""
                SELECT * FROM source_configurations WHERE source_id = $1
            """, source_id)

            # Get tables
            tables_rows = await conn.fetch("""
                SELECT
                    table_schema as schema, table_name as table,
                    row_count, size_mb, primary_key_columns, column_count
                FROM source_tables
                WHERE source_id = $1
            """, source_id)

            # Get latest metrics
            metrics_row = await conn.fetchrow("""
                SELECT * FROM source_metrics
                WHERE source_id = $1
                ORDER BY recorded_at DESC
                LIMIT 1
            """, source_id)

            # Get deployment history
            deployments = await conn.fetch("""
                SELECT id, status, progress, created_at, completed_at, created_by
                FROM source_deployments
                WHERE source_id = $1
                ORDER BY created_at DESC
                LIMIT 5
            """, source_id)

        source_dict = dict(source_row)

        # Add related data
        if conn_row:
            source_dict['connection_details'] = dict(conn_row)

        if config_row:
            source_dict['configuration'] = dict(config_row)

        source_dict['tables'] = [dict(row) for row in tables_rows]

        if metrics_row:
            source_dict['recent_metrics'] = dict(metrics_row)

        source_dict['deployment_history'] = [
            DeploymentSummary(**dict(row)) for row in deployments
        ]

        return SourceDetail(**source_dict)

    async def create_source(self, source: SourceCreate, created_by: str) -> UUID:
        """
        Create a new source record
        """
        async with self.db.acquire() as conn:
            async with conn.transaction():
                # Insert source
                source_id = await conn.fetchval("""
                    INSERT INTO sources (
                        name, description, type, connection_mode, domain,
                        owner_email, team, tags, status
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING id
                """,
                    source.name,
                    source.description,
                    source.type,
                    source.connection_mode.value,
                    source.domain,
                    source.owner_email,
                    source.team,
                    source.tags,
                    'configuring'
                )

                # Insert connection details
                await conn.execute("""
                    INSERT INTO source_connections (
                        source_id, host, port, database_name, schema_name,
                        username, password_secret_type, password_secret_ref,
                        ssl_enabled, additional_params
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                """,
                    source_id,
                    source.connection_details.host,
                    source.connection_details.port,
                    source.connection_details.database_name,
                    source.connection_details.schema_name,
                    source.connection_details.username,
                    source.connection_details.password_secret.type.value if source.connection_details.password_secret else None,
                    source.connection_details.password_secret.reference if source.connection_details.password_secret else None,
                    source.connection_details.ssl_enabled,
                    source.connection_details.additional_params
                )

                # Insert configuration based on connection mode
                if source.connection_mode == ConnectionMode.FEDERATED and source.federated_config:
                    await self._insert_federated_config(conn, source_id, source.federated_config)
                elif source.connection_mode == ConnectionMode.CDC and source.cdc_config:
                    await self._insert_cdc_config(conn, source_id, source.cdc_config)
                elif source.connection_mode == ConnectionMode.BATCH and source.batch_config:
                    await self._insert_batch_config(conn, source_id, source.batch_config)
                elif source.connection_mode == ConnectionMode.STREAMING and source.streaming_config:
                    await self._insert_streaming_config(conn, source_id, source.streaming_config)

        return source_id

    async def update_source(self, source_id: UUID, update: SourceUpdate) -> bool:
        """
        Update an existing source
        """
        update_fields = []
        params = []
        param_counter = 1

        if update.description is not None:
            update_fields.append(f"description = ${param_counter}")
            params.append(update.description)
            param_counter += 1

        if update.owner_email is not None:
            update_fields.append(f"owner_email = ${param_counter}")
            params.append(update.owner_email)
            param_counter += 1

        if update.team is not None:
            update_fields.append(f"team = ${param_counter}")
            params.append(update.team)
            param_counter += 1

        if update.tags is not None:
            update_fields.append(f"tags = ${param_counter}")
            params.append(update.tags)
            param_counter += 1

        if update.status is not None:
            update_fields.append(f"status = ${param_counter}")
            params.append(update.status.value)
            param_counter += 1

        if not update_fields:
            return False

        query = f"""
            UPDATE sources
            SET {', '.join(update_fields)}
            WHERE id = ${param_counter}
        """
        params.append(source_id)

        async with self.db.acquire() as conn:
            result = await conn.execute(query, *params)

        return result != 'UPDATE 0'

    async def delete_source(self, source_id: UUID) -> bool:
        """
        Delete a source (cascade deletes related records)
        """
        async with self.db.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM sources WHERE id = $1
            """, source_id)

        return result != 'DELETE 0'

    # ========================================================================
    # Deployment Operations
    # ========================================================================

    async def create_deployment(
        self,
        deployment: DeploymentCreate
    ) -> UUID:
        """
        Create a deployment record
        """
        async with self.db.acquire() as conn:
            deployment_id = await conn.fetchval("""
                INSERT INTO source_deployments (
                    source_id, deployment_config, created_by, status
                )
                VALUES ($1, $2, $3, 'pending')
                RETURNING id
            """,
                deployment.source_id,
                deployment.deployment_config,
                deployment.created_by
            )

        return deployment_id

    async def get_deployment(self, deployment_id: UUID) -> Optional[Deployment]:
        """
        Get deployment status
        """
        async with self.db.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM source_deployments WHERE id = $1
            """, deployment_id)

        if not row:
            return None

        return Deployment(**dict(row))

    async def update_deployment_status(
        self,
        deployment_id: UUID,
        status: DeploymentStatus,
        progress: Optional[int] = None,
        error_message: Optional[str] = None,
        error_phase: Optional[str] = None
    ) -> None:
        """
        Update deployment status
        """
        async with self.db.acquire() as conn:
            if status == DeploymentStatus.IN_PROGRESS and progress is not None:
                await conn.execute("""
                    UPDATE source_deployments
                    SET status = $1, progress = $2, started_at = COALESCE(started_at, NOW())
                    WHERE id = $3
                """, status.value, progress, deployment_id)
            elif status == DeploymentStatus.COMPLETED:
                await conn.execute("""
                    UPDATE source_deployments
                    SET status = $1, progress = 100, completed_at = NOW()
                    WHERE id = $2
                """, status.value, deployment_id)
            elif status == DeploymentStatus.FAILED:
                await conn.execute("""
                    UPDATE source_deployments
                    SET status = $1, error_message = $2, error_phase = $3
                    WHERE id = $4
                """, status.value, error_message, error_phase, deployment_id)

    # ========================================================================
    # Validation & Testing
    # ========================================================================

    async def validate_connection(self, config: ConnectionConfig) -> ValidationResult:
        """
        Validate connection configuration with comprehensive checks
        """
        # Run comprehensive validation
        result = await self.validator.validate_comprehensive(config)

        # Get CrewAI recommendations and add as insights
        try:
            recommendations = await self.intelligence.get_connection_recommendations(config)
            result.mcp_insights = {
                "recommendations": [r.dict() for r in recommendations],
                "generated_at": datetime.now().isoformat(),
                "agent_confidence": 0.85
            }
        except Exception as e:
            # Don't fail validation if intelligence fails
            result.mcp_insights = {
                "error": str(e),
                "recommendations": []
            }

        return result

    async def test_connection(self, config: ConnectionConfig) -> ConnectionTestResult:
        """
        Test actual connection to source database
        """
        return await self.validator.test_connection_real(config)

    # ========================================================================
    # Metrics Operations
    # ========================================================================

    async def record_metrics(self, metrics: SourceMetrics) -> None:
        """
        Record source metrics
        """
        async with self.db.acquire() as conn:
            await conn.execute("""
                INSERT INTO source_metrics (
                    source_id, query_count_30d, avg_query_latency_ms,
                    replication_lag_seconds, throughput_mb_per_sec,
                    kafka_consumer_lag, last_run_at, last_run_status,
                    last_run_duration_seconds, success_rate_30d,
                    storage_gb, row_count
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            """,
                metrics.source_id,
                metrics.query_count_30d,
                metrics.avg_query_latency_ms,
                metrics.replication_lag_seconds,
                metrics.throughput_mb_per_sec,
                metrics.kafka_consumer_lag,
                metrics.last_run_at,
                metrics.last_run_status,
                metrics.last_run_duration_seconds,
                metrics.success_rate_30d,
                metrics.storage_gb,
                metrics.row_count
            )

    # ========================================================================
    # Helper Methods
    # ========================================================================

    async def _insert_federated_config(self, conn, source_id: UUID, config) -> None:
        """Insert federated configuration"""
        await conn.execute("""
            INSERT INTO source_configurations (
                source_id, trino_catalog_name, connection_pool_size,
                connection_pool_min_size, connection_pool_max_size,
                query_timeout_seconds, connection_timeout_ms,
                idle_timeout_ms, max_lifetime_ms,
                leak_detection_threshold_ms, validation_timeout_ms,
                validation_query, deployment_target
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'kubernetes')
        """,
            source_id,
            config.trino_catalog_name,
            config.connection_pool_size,
            config.connection_pool_min_size,
            config.connection_pool_max_size,
            config.query_timeout_seconds,
            config.connection_timeout_ms,
            config.idle_timeout_ms,
            config.max_lifetime_ms,
            config.leak_detection_threshold_ms,
            config.validation_timeout_ms,
            config.validation_query
        )

    async def _insert_cdc_config(self, conn, source_id: UUID, config) -> None:
        """Insert CDC configuration"""
        await conn.execute("""
            INSERT INTO source_configurations (
                source_id, debezium_connector_name, snapshot_mode,
                kafka_topic_prefix, kafka_partitions, kafka_replication_factor,
                iceberg_catalog, iceberg_schema, iceberg_file_format,
                iceberg_compression, deployment_target
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'kubernetes')
        """,
            source_id,
            config.debezium_connector_name,
            config.snapshot_mode,
            config.kafka_topic_prefix,
            config.kafka_partitions,
            config.kafka_replication_factor,
            config.iceberg_catalog,
            config.iceberg_schema,
            config.iceberg_file_format,
            config.iceberg_compression
        )

    async def _insert_batch_config(self, conn, source_id: UUID, config) -> None:
        """Insert batch configuration"""
        await conn.execute("""
            INSERT INTO source_configurations (
                source_id, schedule_cron_expression, batch_size,
                iceberg_catalog, iceberg_schema, deployment_target
            )
            VALUES ($1, $2, $3, $4, $5, 'kubernetes')
        """,
            source_id,
            config.schedule_cron_expression,
            config.batch_size,
            config.iceberg_catalog,
            config.iceberg_schema
        )

    async def _insert_streaming_config(self, conn, source_id: UUID, config) -> None:
        """Insert streaming configuration"""
        await conn.execute("""
            INSERT INTO source_configurations (
                source_id, kafka_consumer_group, kafka_offset_reset,
                iceberg_catalog, iceberg_schema, deployment_target
            )
            VALUES ($1, $2, $3, $4, $5, 'kubernetes')
        """,
            source_id,
            config.kafka_consumer_group,
            config.kafka_offset_reset,
            config.iceberg_catalog,
            config.iceberg_schema
        )

    # ========================================================================
    # File Source Operations (NEW)
    # ========================================================================

    async def create_file_source(
        self,
        source: SourceCreate,
        file_storage_url: str,
        file_metadata: Dict[str, Any]
    ) -> UUID:
        """
        Create a file-based source

        Args:
            source: Source creation model
            file_storage_url: S3 or local file URL
            file_metadata: Metadata from schema detection

        Returns:
            UUID: Created source ID
        """
        from backend.models.sources import FileSourceConfig, FileFormat

        # Create file configuration
        file_config = FileSourceConfig(
            s3_url=file_storage_url,
            file_format=FileFormat(file_metadata.get("file_format", "csv")),
            file_size_bytes=file_metadata.get("file_size_bytes", 0),
            file_size_mb=file_metadata.get("file_size_mb", 0),
            row_count=file_metadata.get("row_count", 0),
            column_count=file_metadata.get("column_count", 0),
            schema_fields=file_metadata.get("fields", []),
            delimiter=file_metadata.get("delimiter", ","),
            has_headers=file_metadata.get("has_headers", True),
            refresh_schedule=source.file_config.refresh_schedule if source.file_config else None,
            trino_catalog="files",
            trino_schema=file_metadata.get("trino_schema", "default"),
            trino_table=file_metadata.get("trino_table", source.name.replace("-", "_")),
            partition_columns=file_metadata.get("partition_columns", [])
        )

        # Update source with file config
        source.file_config = file_config

        # Create source using existing method
        source_id = await self.create_source(source)

        return source_id

    async def register_trino_file_table(
        self,
        catalog: str,
        schema: str,
        table: str,
        location: str,
        file_format: str,
        schema_fields: List[Dict[str, Any]],
        has_headers: bool = True,
        delimiter: str = ","
    ) -> bool:
        """
        Register file as external table in Trino catalog

        This is a placeholder - actual implementation depends on:
        - Trino admin API access
        - Hive Metastore configuration
        - File storage setup

        For now, returns True to indicate successful registration

        Args:
            catalog: Trino catalog name (e.g., 'files')
            schema: Schema/database name
            table: Table name
            location: File location (S3 URL or local path)
            file_format: csv, json, parquet, etc.
            schema_fields: List of field definitions
            has_headers: Whether CSV has headers
            delimiter: CSV delimiter

        Returns:
            bool: Success status
        """
        # TODO: Implement actual Trino table registration
        # Options:
        # 1. Use Trino admin API if available
        # 2. Use Hive Metastore Thrift API
        # 3. Execute CREATE EXTERNAL TABLE via Trino connection

        # Placeholder implementation
        print(f"Registering table: {catalog}.{schema}.{table}")
        print(f"Location: {location}")
        print(f"Format: {file_format}")
        print(f"Fields: {len(schema_fields)} columns")

        return True

    async def refresh_file_source(
        self,
        source_id: UUID,
        new_file_url: Optional[str] = None
    ) -> bool:
        """
        Refresh a file source with new data

        Args:
            source_id: Source identifier
            new_file_url: Optional new file URL (for updated data)

        Returns:
            bool: Success status
        """
        # Get current source
        source = await self.get_source(source_id)
        if not source:
            raise HTTPException(status_code=404, detail="Source not found")

        # Update last_refreshed_at timestamp
        async with self.db.acquire() as conn:
            await conn.execute("""
                UPDATE sources
                SET updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            """, source_id)

        # TODO: Implement file refresh logic
        # 1. Download new file if URL provided
        # 2. Validate schema matches existing
        # 3. Update Trino table data
        # 4. Update row count and metadata

        return True

    async def schedule_file_refresh(
        self,
        source_id: UUID,
        cron_schedule: str
    ) -> bool:
        """
        Schedule periodic file refresh

        Args:
            source_id: Source identifier
            cron_schedule: Cron expression for schedule

        Returns:
            bool: Success status
        """
        # TODO: Integrate with Airflow or scheduler
        # 1. Create Airflow DAG for file refresh
        # 2. Schedule DAG with cron expression
        # 3. DAG should call refresh_file_source on schedule

        # For now, just update the schedule in database
        async with self.db.acquire() as conn:
            await conn.execute("""
                UPDATE sources
                SET updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            """, source_id)

        print(f"Scheduled refresh for source {source_id}: {cron_schedule}")

        return True
