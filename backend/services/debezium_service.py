"""
Debezium Service for CDC connector management
"""

import asyncio
import logging
import httpx
from typing import List, Optional, Dict, Any
import os
import json

from backend.models.debezium import (
    DebeziumConnectorConfig,
    ConnectorCreateResult,
    ConnectorInfo,
    ConnectorStatusInfo,
    ConnectorValidationResult,
    ConnectorMetrics,
    KafkaConnectClusterInfo,
    ConnectorOffsets,
    TaskInfo,
    ConnectorStatus,
    SnapshotMode
)

logger = logging.getLogger(__name__)


class DebeziumService:
    """Service for Debezium connector management via Kafka Connect REST API"""

    def __init__(self, kafka_connect_url: Optional[str] = None):
        """
        Initialize Debezium service

        Args:
            kafka_connect_url: Kafka Connect REST API URL
        """
        self.kafka_connect_url = kafka_connect_url or os.getenv(
            'KAFKA_CONNECT_URL',
            'http://localhost:8083'
        )
        self.client = httpx.AsyncClient(timeout=30.0)

    async def create_connector(
        self,
        config: DebeziumConnectorConfig,
        validate_only: bool = False
    ) -> ConnectorCreateResult:
        """
        Create a Debezium connector

        Args:
            config: Connector configuration
            validate_only: Only validate without creating

        Returns:
            ConnectorCreateResult with creation status
        """
        try:
            # Validate configuration first
            validation = await self.validate_connector_config(config)
            if not validation.valid:
                return ConnectorCreateResult(
                    success=False,
                    connector_name=config.name,
                    message=f"Validation failed: {', '.join(validation.errors)}",
                    warnings=validation.warnings
                )

            if validate_only:
                return ConnectorCreateResult(
                    success=True,
                    connector_name=config.name,
                    message="Validation successful (dry run)",
                    warnings=validation.warnings
                )

            # Build connector configuration for Kafka Connect
            connector_config = self._build_connector_config(config)

            # Create connector via Kafka Connect REST API
            response = await self.client.post(
                f"{self.kafka_connect_url}/connectors",
                json={
                    "name": config.name,
                    "config": connector_config
                }
            )

            if response.status_code == 201:
                # Get connector info
                connector_info = await self.get_connector_info(config.name)

                return ConnectorCreateResult(
                    success=True,
                    connector_name=config.name,
                    message=f"Connector '{config.name}' created successfully",
                    warnings=validation.warnings,
                    connector_info=connector_info
                )
            elif response.status_code == 409:
                return ConnectorCreateResult(
                    success=False,
                    connector_name=config.name,
                    message=f"Connector '{config.name}' already exists",
                    warnings=["Connector already exists, consider updating instead"]
                )
            else:
                error_detail = response.json() if response.text else response.text
                return ConnectorCreateResult(
                    success=False,
                    connector_name=config.name,
                    message=f"Failed to create connector: {error_detail}"
                )

        except httpx.HTTPError as e:
            logger.error(f"HTTP error creating connector {config.name}: {e}")
            return ConnectorCreateResult(
                success=False,
                connector_name=config.name,
                message=f"HTTP error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error creating connector {config.name}: {e}")
            return ConnectorCreateResult(
                success=False,
                connector_name=config.name,
                message=f"Error: {str(e)}"
            )

    def _build_connector_config(self, config: DebeziumConnectorConfig) -> Dict[str, Any]:
        """Build Kafka Connect connector configuration from Debezium config"""
        connector_config = {
            "connector.class": config.connector_class.value,
            "tasks.max": str(config.tasks_max),

            # Database connection
            "database.hostname": config.database_hostname,
            "database.port": str(config.database_port),
            "database.user": config.database_user,
            "database.password": config.database_password,
            "database.dbname": config.database_dbname,
            "database.server.name": config.database_server_name,

            # Snapshot
            "snapshot.mode": config.snapshot_mode.value,

            # Kafka topic
            "topic.prefix": config.kafka_topic_prefix,

            # Performance
            "max.batch.size": str(config.max_batch_size),
            "max.queue.size": str(config.max_queue_size),
            "poll.interval.ms": str(config.poll_interval_ms),

            # Heartbeat
            "heartbeat.interval.ms": str(config.heartbeat_interval_ms),

            # Tombstones
            "tombstones.on.delete": str(config.tombstones_on_delete).lower(),

            # Data type handling
            "decimal.handling.mode": config.decimal_handling_mode,
            "binary.handling.mode": config.binary_handling_mode,
        }

        # Optional schema/table filters
        if config.schema_include_list:
            connector_config["schema.include.list"] = config.schema_include_list
        if config.table_include_list:
            connector_config["table.include.list"] = config.table_include_list
        if config.schema_exclude_list:
            connector_config["schema.exclude.list"] = config.schema_exclude_list
        if config.table_exclude_list:
            connector_config["table.exclude.list"] = config.table_exclude_list

        # Optional column filters
        if config.column_include_list:
            connector_config["column.include.list"] = config.column_include_list
        if config.column_exclude_list:
            connector_config["column.exclude.list"] = config.column_exclude_list

        # Optional heartbeat prefix
        if config.heartbeat_topics_prefix:
            connector_config["heartbeat.topics.prefix"] = config.heartbeat_topics_prefix

        # PostgreSQL specific
        if config.slot_name:
            connector_config["slot.name"] = config.slot_name
        if config.publication_name:
            connector_config["publication.name"] = config.publication_name
        if config.plugin_name:
            connector_config["plugin.name"] = config.plugin_name

        # Additional custom config
        if config.additional_config:
            connector_config.update({k: str(v) for k, v in config.additional_config.items()})

        return connector_config

    async def validate_connector_config(
        self,
        config: DebeziumConnectorConfig
    ) -> ConnectorValidationResult:
        """
        Validate connector configuration

        Args:
            config: Connector configuration to validate

        Returns:
            ConnectorValidationResult with validation status
        """
        checks = []
        warnings = []
        errors = []

        # Check connector name
        if not config.name:
            errors.append("Connector name is required")
            checks.append({"check": "connector_name", "passed": False, "message": "Name is required"})
        elif len(config.name) > 255:
            errors.append("Connector name too long (max 255 characters)")
            checks.append({"check": "connector_name_length", "passed": False, "message": "Name exceeds 255 characters"})
        else:
            checks.append({"check": "connector_name", "passed": True, "message": "Valid connector name"})

        # Check database connection
        if not config.database_hostname:
            errors.append("Database hostname is required")
            checks.append({"check": "db_hostname", "passed": False, "message": "Hostname required"})
        else:
            checks.append({"check": "db_hostname", "passed": True, "message": f"Host: {config.database_hostname}"})

        if config.database_port < 1 or config.database_port > 65535:
            errors.append("Invalid database port")
            checks.append({"check": "db_port", "passed": False, "message": "Port must be 1-65535"})
        else:
            checks.append({"check": "db_port", "passed": True, "message": f"Port: {config.database_port}"})

        # Check credentials
        if not config.database_user:
            errors.append("Database user is required")
            checks.append({"check": "db_user", "passed": False, "message": "User required"})
        else:
            checks.append({"check": "db_user", "passed": True, "message": "User provided"})

        if not config.database_password:
            errors.append("Database password is required")
            checks.append({"check": "db_password", "passed": False, "message": "Password required"})
        else:
            checks.append({"check": "db_password", "passed": True, "message": "Password provided"})

        # Check snapshot mode
        if config.snapshot_mode == SnapshotMode.NEVER:
            warnings.append("Snapshot mode 'never' will skip initial data - ensure you want this")
            checks.append({"check": "snapshot_mode", "passed": True, "message": "No initial snapshot"})
        else:
            checks.append({"check": "snapshot_mode", "passed": True, "message": f"Snapshot: {config.snapshot_mode.value}"})

        # Check topic prefix
        if not config.kafka_topic_prefix:
            errors.append("Kafka topic prefix is required")
            checks.append({"check": "topic_prefix", "passed": False, "message": "Topic prefix required"})
        else:
            checks.append({"check": "topic_prefix", "passed": True, "message": f"Topic prefix: {config.kafka_topic_prefix}"})

        # Check tasks
        if config.tasks_max < 1:
            errors.append("tasks.max must be >= 1")
            checks.append({"check": "tasks_max", "passed": False, "message": "Tasks < 1"})
        elif config.tasks_max > 10:
            warnings.append("High task count (>10) may impact performance")
            checks.append({"check": "tasks_max", "passed": True, "message": f"{config.tasks_max} tasks (high)"})
        else:
            checks.append({"check": "tasks_max", "passed": True, "message": f"{config.tasks_max} task(s)"})

        # Check if connector already exists
        try:
            existing = await self.get_connector_info(config.name)
            if existing:
                errors.append(f"Connector '{config.name}' already exists")
                checks.append({"check": "connector_exists", "passed": False, "message": "Connector already exists"})
        except:
            checks.append({"check": "connector_exists", "passed": True, "message": "Connector does not exist"})

        # Check Kafka Connect availability
        try:
            cluster_info = await self.get_cluster_info()
            if cluster_info:
                checks.append({"check": "kafka_connect", "passed": True, "message": f"Kafka Connect available (v{cluster_info.version})"})
            else:
                warnings.append("Could not verify Kafka Connect availability")
                checks.append({"check": "kafka_connect", "passed": True, "message": "Kafka Connect status unknown"})
        except:
            warnings.append("Could not connect to Kafka Connect")
            checks.append({"check": "kafka_connect", "passed": True, "message": "Kafka Connect unreachable"})

        return ConnectorValidationResult(
            valid=len(errors) == 0,
            connector_name=config.name,
            checks=checks,
            warnings=warnings,
            errors=errors
        )

    async def get_connector_info(self, connector_name: str) -> Optional[ConnectorInfo]:
        """
        Get connector information

        Args:
            connector_name: Connector name

        Returns:
            ConnectorInfo or None if not found
        """
        try:
            response = await self.client.get(
                f"{self.kafka_connect_url}/connectors/{connector_name}"
            )

            if response.status_code == 404:
                return None

            response.raise_for_status()
            data = response.json()

            # Get tasks
            tasks = []
            if "tasks" in data:
                for task in data["tasks"]:
                    tasks.append(TaskInfo(
                        id=task.get("task", 0),
                        state=task.get("state", "UNKNOWN"),
                        worker_id=task.get("worker_id", "unknown"),
                        trace=task.get("trace")
                    ))

            return ConnectorInfo(
                name=data.get("name", connector_name),
                config=data.get("config", {}),
                tasks=tasks,
                type=data.get("type", "unknown")
            )

        except httpx.HTTPError as e:
            logger.error(f"HTTP error getting connector info for {connector_name}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting connector info for {connector_name}: {e}")
            return None

    async def get_connector_status(self, connector_name: str) -> Optional[ConnectorStatusInfo]:
        """
        Get connector status

        Args:
            connector_name: Connector name

        Returns:
            ConnectorStatusInfo or None if not found
        """
        try:
            response = await self.client.get(
                f"{self.kafka_connect_url}/connectors/{connector_name}/status"
            )

            if response.status_code == 404:
                return None

            response.raise_for_status()
            data = response.json()

            return ConnectorStatusInfo(
                name=data.get("name", connector_name),
                connector=data.get("connector", {}),
                tasks=data.get("tasks", []),
                type=data.get("type", "unknown")
            )

        except Exception as e:
            logger.error(f"Error getting connector status for {connector_name}: {e}")
            return None

    async def list_connectors(self) -> List[str]:
        """
        List all connectors

        Returns:
            List of connector names
        """
        try:
            response = await self.client.get(f"{self.kafka_connect_url}/connectors")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error listing connectors: {e}")
            return []

    async def pause_connector(self, connector_name: str) -> bool:
        """
        Pause a connector

        Args:
            connector_name: Connector name

        Returns:
            True if successful
        """
        try:
            response = await self.client.put(
                f"{self.kafka_connect_url}/connectors/{connector_name}/pause"
            )
            response.raise_for_status()
            logger.info(f"Connector {connector_name} paused successfully")
            return True
        except Exception as e:
            logger.error(f"Error pausing connector {connector_name}: {e}")
            return False

    async def resume_connector(self, connector_name: str) -> bool:
        """
        Resume a paused connector

        Args:
            connector_name: Connector name

        Returns:
            True if successful
        """
        try:
            response = await self.client.put(
                f"{self.kafka_connect_url}/connectors/{connector_name}/resume"
            )
            response.raise_for_status()
            logger.info(f"Connector {connector_name} resumed successfully")
            return True
        except Exception as e:
            logger.error(f"Error resuming connector {connector_name}: {e}")
            return False

    async def restart_connector(self, connector_name: str) -> bool:
        """
        Restart a connector

        Args:
            connector_name: Connector name

        Returns:
            True if successful
        """
        try:
            response = await self.client.post(
                f"{self.kafka_connect_url}/connectors/{connector_name}/restart"
            )
            response.raise_for_status()
            logger.info(f"Connector {connector_name} restarted successfully")
            return True
        except Exception as e:
            logger.error(f"Error restarting connector {connector_name}: {e}")
            return False

    async def delete_connector(self, connector_name: str) -> bool:
        """
        Delete a connector

        Args:
            connector_name: Connector name

        Returns:
            True if successful
        """
        try:
            response = await self.client.delete(
                f"{self.kafka_connect_url}/connectors/{connector_name}"
            )
            response.raise_for_status()
            logger.info(f"Connector {connector_name} deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Error deleting connector {connector_name}: {e}")
            return False

    async def get_cluster_info(self) -> Optional[KafkaConnectClusterInfo]:
        """
        Get Kafka Connect cluster information

        Returns:
            KafkaConnectClusterInfo or None if error
        """
        try:
            response = await self.client.get(f"{self.kafka_connect_url}/")
            response.raise_for_status()
            data = response.json()

            # Get connectors
            connectors = await self.list_connectors()

            return KafkaConnectClusterInfo(
                version=data.get("version", "unknown"),
                commit=data.get("commit", "unknown"),
                kafka_cluster_id=data.get("kafka_cluster_id", "unknown"),
                connectors=connectors,
                connector_count=len(connectors)
            )

        except Exception as e:
            logger.error(f"Error getting cluster info: {e}")
            return None

    async def get_connector_offsets(self, connector_name: str) -> Optional[ConnectorOffsets]:
        """
        Get connector offsets

        Args:
            connector_name: Connector name

        Returns:
            ConnectorOffsets or None if not found
        """
        try:
            response = await self.client.get(
                f"{self.kafka_connect_url}/connectors/{connector_name}/offsets"
            )

            if response.status_code == 404:
                return None

            response.raise_for_status()
            data = response.json()

            return ConnectorOffsets(
                connector_name=connector_name,
                offsets=data.get("offsets", {})
            )

        except Exception as e:
            logger.error(f"Error getting connector offsets for {connector_name}: {e}")
            return None

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
