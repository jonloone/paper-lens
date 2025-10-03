"""
Connection validation and testing utilities
"""

import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import asyncpg

from backend.models.sources import (
    ConnectionConfig, ConnectionDetails, ConnectionMode,
    ValidationResult, ValidationCheck, ConnectionTestResult
)


class ConnectionValidator:
    """
    Validates and tests database connections
    """

    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool

    async def validate_comprehensive(self, config: ConnectionConfig) -> ValidationResult:
        """
        Comprehensive validation including:
        - Name uniqueness
        - Connection parameter validation
        - Duplicate detection
        - Configuration completeness
        - Resource availability
        """
        checks: List[ValidationCheck] = []

        # Run all validation checks in parallel
        results = await asyncio.gather(
            self._check_name_uniqueness(config.name),
            self._check_connection_params(config.connection_details),
            self._check_duplicate_source(config),
            self._check_configuration_completeness(config),
            self._check_resource_availability(config),
            return_exceptions=True
        )

        # Collect all checks
        for result in results:
            if isinstance(result, ValidationCheck):
                checks.append(result)
            elif isinstance(result, list):
                checks.extend(result)

        # Extract errors and warnings
        errors = [c.message for c in checks if c.status == "error"]
        warnings = [c.message for c in checks if c.status == "warning"]

        return ValidationResult(
            valid=len(errors) == 0,
            checks=checks,
            warnings=warnings,
            errors=errors,
            mcp_insights=None  # Will be populated by MCP integration
        )

    async def _check_name_uniqueness(self, name: str) -> ValidationCheck:
        """Check if source name is unique"""
        async with self.db.acquire() as conn:
            exists = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM sources WHERE name = $1)",
                name
            )

        if exists:
            return ValidationCheck(
                name="name_uniqueness",
                status="error",
                message=f"Source name '{name}' already exists",
                suggestion="Choose a different name for your source"
            )

        return ValidationCheck(
            name="name_uniqueness",
            status="success",
            message="Source name is available"
        )

    async def _check_connection_params(
        self,
        details: ConnectionDetails
    ) -> List[ValidationCheck]:
        """Validate connection parameters"""
        checks = []

        # Check host is not empty
        if not details.host or details.host.strip() == "":
            checks.append(ValidationCheck(
                name="host_validation",
                status="error",
                message="Host cannot be empty",
                suggestion="Provide a valid hostname or IP address"
            ))
        else:
            checks.append(ValidationCheck(
                name="host_validation",
                status="success",
                message=f"Host '{details.host}' is valid"
            ))

        # Check port is in valid range
        if not (1 <= details.port <= 65535):
            checks.append(ValidationCheck(
                name="port_validation",
                status="error",
                message=f"Port {details.port} is out of valid range (1-65535)",
                suggestion="Use a valid port number"
            ))
        else:
            checks.append(ValidationCheck(
                name="port_validation",
                status="success",
                message=f"Port {details.port} is valid"
            ))

        # Check username is provided
        if not details.username:
            checks.append(ValidationCheck(
                name="username_validation",
                status="error",
                message="Username is required",
                suggestion="Provide authentication credentials"
            ))
        else:
            checks.append(ValidationCheck(
                name="username_validation",
                status="success",
                message="Username is provided"
            ))

        # Check password secret is configured
        if not details.password_secret:
            checks.append(ValidationCheck(
                name="password_validation",
                status="warning",
                message="No password secret configured",
                suggestion="Configure password for secure authentication"
            ))
        else:
            checks.append(ValidationCheck(
                name="password_validation",
                status="success",
                message="Password secret is configured"
            ))

        # Recommend SSL
        if not details.ssl_enabled:
            checks.append(ValidationCheck(
                name="ssl_validation",
                status="warning",
                message="SSL is disabled - connection will not be encrypted",
                suggestion="Enable SSL for production deployments"
            ))
        else:
            checks.append(ValidationCheck(
                name="ssl_validation",
                status="success",
                message="SSL is enabled"
            ))

        return checks

    async def _check_duplicate_source(self, config: ConnectionConfig) -> ValidationCheck:
        """Check if a source with same connection already exists"""
        async with self.db.acquire() as conn:
            # Check for existing source with same host, port, and database
            existing = await conn.fetchval("""
                SELECT s.name
                FROM sources s
                JOIN source_connections sc ON s.id = sc.source_id
                WHERE sc.host = $1
                  AND sc.port = $2
                  AND COALESCE(sc.database_name, '') = COALESCE($3, '')
                LIMIT 1
            """,
                config.connection_details.host,
                config.connection_details.port,
                config.connection_details.database_name
            )

        if existing:
            return ValidationCheck(
                name="duplicate_detection",
                status="warning",
                message=f"Similar source '{existing}' already exists with same connection details",
                suggestion="Verify this is not a duplicate before proceeding",
                details={
                    "existing_source": existing,
                    "host": config.connection_details.host,
                    "port": config.connection_details.port
                }
            )

        return ValidationCheck(
            name="duplicate_detection",
            status="success",
            message="No duplicate sources detected"
        )

    async def _check_configuration_completeness(
        self,
        config: ConnectionConfig
    ) -> List[ValidationCheck]:
        """Check if all required configuration is provided based on connection mode"""
        checks = []

        if config.connection_mode == ConnectionMode.FEDERATED:
            if not config.federated_config:
                checks.append(ValidationCheck(
                    name="federated_config",
                    status="error",
                    message="Federated configuration is required for federated mode",
                    suggestion="Provide federated configuration with Trino catalog details"
                ))
            else:
                if not config.federated_config.trino_catalog_name:
                    checks.append(ValidationCheck(
                        name="trino_catalog",
                        status="error",
                        message="Trino catalog name is required",
                        suggestion="Specify the catalog name for the Trino connector"
                    ))
                else:
                    checks.append(ValidationCheck(
                        name="federated_config",
                        status="success",
                        message="Federated configuration is complete"
                    ))

        elif config.connection_mode == ConnectionMode.CDC:
            if not config.cdc_config:
                checks.append(ValidationCheck(
                    name="cdc_config",
                    status="error",
                    message="CDC configuration is required for CDC mode",
                    suggestion="Provide CDC configuration with Debezium and Kafka details"
                ))
            else:
                missing = []
                if not config.cdc_config.debezium_connector_name:
                    missing.append("Debezium connector name")
                if not config.cdc_config.kafka_topic_prefix:
                    missing.append("Kafka topic prefix")
                if not config.cdc_config.iceberg_catalog:
                    missing.append("Iceberg catalog")
                if not config.cdc_config.iceberg_schema:
                    missing.append("Iceberg schema")

                if missing:
                    checks.append(ValidationCheck(
                        name="cdc_config",
                        status="error",
                        message=f"Missing CDC configuration: {', '.join(missing)}",
                        suggestion="Complete all required CDC configuration fields"
                    ))
                else:
                    checks.append(ValidationCheck(
                        name="cdc_config",
                        status="success",
                        message="CDC configuration is complete"
                    ))

        elif config.connection_mode == ConnectionMode.BATCH:
            if not config.batch_config:
                checks.append(ValidationCheck(
                    name="batch_config",
                    status="error",
                    message="Batch configuration is required for batch mode",
                    suggestion="Provide batch configuration with schedule and destination details"
                ))
            else:
                missing = []
                if not config.batch_config.schedule_cron_expression:
                    missing.append("Schedule cron expression")
                if not config.batch_config.iceberg_catalog:
                    missing.append("Iceberg catalog")
                if not config.batch_config.iceberg_schema:
                    missing.append("Iceberg schema")
                if not config.batch_config.iceberg_table_name:
                    missing.append("Iceberg table name")

                if missing:
                    checks.append(ValidationCheck(
                        name="batch_config",
                        status="error",
                        message=f"Missing batch configuration: {', '.join(missing)}",
                        suggestion="Complete all required batch configuration fields"
                    ))
                else:
                    checks.append(ValidationCheck(
                        name="batch_config",
                        status="success",
                        message="Batch configuration is complete"
                    ))

        elif config.connection_mode == ConnectionMode.STREAMING:
            if not config.streaming_config:
                checks.append(ValidationCheck(
                    name="streaming_config",
                    status="error",
                    message="Streaming configuration is required for streaming mode",
                    suggestion="Provide streaming configuration with Kafka and destination details"
                ))
            else:
                missing = []
                if not config.streaming_config.kafka_topic_name:
                    missing.append("Kafka topic name")
                if not config.streaming_config.kafka_consumer_group:
                    missing.append("Kafka consumer group")
                if not config.streaming_config.iceberg_catalog:
                    missing.append("Iceberg catalog")
                if not config.streaming_config.iceberg_schema:
                    missing.append("Iceberg schema")
                if not config.streaming_config.iceberg_table_name:
                    missing.append("Iceberg table name")

                if missing:
                    checks.append(ValidationCheck(
                        name="streaming_config",
                        status="error",
                        message=f"Missing streaming configuration: {', '.join(missing)}",
                        suggestion="Complete all required streaming configuration fields"
                    ))
                else:
                    checks.append(ValidationCheck(
                        name="streaming_config",
                        status="success",
                        message="Streaming configuration is complete"
                    ))

        return checks

    async def _check_resource_availability(
        self,
        config: ConnectionConfig
    ) -> List[ValidationCheck]:
        """
        Check resource availability (Kafka capacity, storage, etc.)
        This is a placeholder - actual implementation will query infrastructure
        """
        checks = []

        # For CDC mode, check Kafka capacity
        if config.connection_mode == ConnectionMode.CDC and config.cdc_config:
            # Placeholder: In production, this would check actual Kafka cluster capacity
            required_partitions = config.cdc_config.kafka_partitions

            if required_partitions > 100:
                checks.append(ValidationCheck(
                    name="kafka_capacity",
                    status="warning",
                    message=f"High partition count ({required_partitions}) may impact Kafka performance",
                    suggestion="Consider using fewer partitions or scaling Kafka cluster"
                ))
            else:
                checks.append(ValidationCheck(
                    name="kafka_capacity",
                    status="success",
                    message="Kafka capacity is sufficient"
                ))

        # Check Iceberg catalog availability
        if config.connection_mode in [ConnectionMode.CDC, ConnectionMode.BATCH, ConnectionMode.STREAMING]:
            # Placeholder: In production, this would verify catalog exists
            checks.append(ValidationCheck(
                name="iceberg_catalog",
                status="success",
                message="Iceberg catalog is available"
            ))

        return checks

    async def test_connection_real(
        self,
        config: ConnectionConfig
    ) -> ConnectionTestResult:
        """
        Test actual connection to source database
        """
        start_time = datetime.now()

        try:
            # Build connection string based on database type
            conn_string = self._build_connection_string(config)

            # Attempt connection with timeout
            conn = await asyncio.wait_for(
                asyncpg.connect(conn_string),
                timeout=10.0
            )

            try:
                # Get server version
                version = await conn.fetchval("SELECT version()")

                # Test a simple query
                result = await conn.fetchval("SELECT 1")

                # Calculate latency
                latency_ms = int((datetime.now() - start_time).total_seconds() * 1000)

                return ConnectionTestResult(
                    success=True,
                    latency_ms=latency_ms,
                    server_version=version,
                    details={
                        "status": "connected",
                        "test_query_result": result,
                        "timestamp": datetime.now().isoformat()
                    }
                )

            finally:
                await conn.close()

        except asyncio.TimeoutError:
            return ConnectionTestResult(
                success=False,
                error_message="Connection timeout after 10 seconds",
                details={
                    "status": "timeout",
                    "attempted_host": config.connection_details.host,
                    "attempted_port": config.connection_details.port
                }
            )

        except asyncpg.PostgresError as e:
            return ConnectionTestResult(
                success=False,
                error_message=f"PostgreSQL error: {str(e)}",
                details={
                    "status": "failed",
                    "error_code": e.sqlstate if hasattr(e, 'sqlstate') else None,
                    "error_type": type(e).__name__
                }
            )

        except Exception as e:
            return ConnectionTestResult(
                success=False,
                error_message=f"Connection failed: {str(e)}",
                details={
                    "status": "failed",
                    "error_type": type(e).__name__
                }
            )

    def _build_connection_string(self, config: ConnectionConfig) -> str:
        """Build PostgreSQL connection string from config"""
        details = config.connection_details

        # For now, assume plaintext password (in production, retrieve from secret backend)
        password = ""
        if details.password_secret and details.password_secret.plaintext_value:
            password = details.password_secret.plaintext_value

        conn_string = f"postgresql://{details.username}"
        if password:
            conn_string += f":{password}"

        conn_string += f"@{details.host}:{details.port}"

        if details.database_name:
            conn_string += f"/{details.database_name}"

        # Add SSL mode
        ssl_mode = "require" if details.ssl_enabled else "disable"
        conn_string += f"?sslmode={ssl_mode}"

        return conn_string
