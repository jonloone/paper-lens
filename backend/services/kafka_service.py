"""
Kafka Service for topic management and administration
"""

import asyncio
import logging
from typing import List, Optional, Dict, Any
from kafka import KafkaAdminClient
from kafka.admin import NewTopic, ConfigResource, ConfigResourceType
from kafka.errors import TopicAlreadyExistsError, KafkaError
import os

from backend.models.kafka import (
    TopicConfig,
    TopicCreateResult,
    TopicInfo,
    TopicValidationResult,
    KafkaClusterInfo,
    ConsumerGroupInfo,
    CompressionType,
    CleanupPolicy
)

logger = logging.getLogger(__name__)


class KafkaService:
    """Service for Kafka topic management and administration"""

    def __init__(self, bootstrap_servers: Optional[str] = None):
        """
        Initialize Kafka service

        Args:
            bootstrap_servers: Kafka bootstrap servers (comma-separated)
        """
        self.bootstrap_servers = bootstrap_servers or os.getenv(
            'KAFKA_BOOTSTRAP_SERVERS',
            'localhost:9092'
        )
        self.admin_client = None

    def _get_admin_client(self) -> KafkaAdminClient:
        """Get or create Kafka admin client"""
        if self.admin_client is None:
            self.admin_client = KafkaAdminClient(
                bootstrap_servers=self.bootstrap_servers,
                client_id='nexusone-kafka-admin',
                request_timeout_ms=30000,
                api_version_auto_timeout_ms=10000
            )
        return self.admin_client

    async def create_topic(self, topic_config: TopicConfig, validate_only: bool = False) -> TopicCreateResult:
        """
        Create a Kafka topic with specified configuration

        Args:
            topic_config: Topic configuration
            validate_only: Only validate without creating

        Returns:
            TopicCreateResult with creation status
        """
        try:
            # Validate configuration first
            validation = await self.validate_topic_config(topic_config)
            if not validation.valid:
                return TopicCreateResult(
                    success=False,
                    topic_name=topic_config.name,
                    partitions=topic_config.partitions,
                    replication_factor=topic_config.replication_factor,
                    message=f"Validation failed: {', '.join(validation.errors)}",
                    warnings=validation.warnings
                )

            if validate_only:
                return TopicCreateResult(
                    success=True,
                    topic_name=topic_config.name,
                    partitions=topic_config.partitions,
                    replication_factor=topic_config.replication_factor,
                    message="Validation successful (dry run)",
                    warnings=validation.warnings
                )

            # Build topic configuration
            topic_configs = {
                'compression.type': topic_config.compression_type.value,
                'cleanup.policy': topic_config.cleanup_policy.value,
                'min.insync.replicas': str(topic_config.min_insync_replicas),
            }

            if topic_config.retention_ms:
                topic_configs['retention.ms'] = str(topic_config.retention_ms)
            if topic_config.retention_bytes:
                topic_configs['retention.bytes'] = str(topic_config.retention_bytes)
            if topic_config.segment_ms:
                topic_configs['segment.ms'] = str(topic_config.segment_ms)
            if topic_config.max_message_bytes:
                topic_configs['max.message.bytes'] = str(topic_config.max_message_bytes)

            # Add any additional configs
            if topic_config.additional_config:
                topic_configs.update({k: str(v) for k, v in topic_config.additional_config.items()})

            # Create NewTopic object
            new_topic = NewTopic(
                name=topic_config.name,
                num_partitions=topic_config.partitions,
                replication_factor=topic_config.replication_factor,
                topic_configs=topic_configs
            )

            # Create topic using admin client
            admin = self._get_admin_client()
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: admin.create_topics([new_topic], validate_only=False)
            )

            # Verify topic was created
            topic_info = await self.get_topic_info(topic_config.name)

            return TopicCreateResult(
                success=True,
                topic_name=topic_config.name,
                partitions=topic_config.partitions,
                replication_factor=topic_config.replication_factor,
                message=f"Topic '{topic_config.name}' created successfully",
                warnings=validation.warnings,
                topic_info=topic_info
            )

        except TopicAlreadyExistsError:
            logger.warning(f"Topic {topic_config.name} already exists")
            topic_info = await self.get_topic_info(topic_config.name)
            return TopicCreateResult(
                success=False,
                topic_name=topic_config.name,
                partitions=topic_config.partitions,
                replication_factor=topic_config.replication_factor,
                message=f"Topic '{topic_config.name}' already exists",
                warnings=["Topic already exists, consider using update instead"],
                topic_info=topic_info
            )

        except KafkaError as e:
            logger.error(f"Kafka error creating topic {topic_config.name}: {e}")
            return TopicCreateResult(
                success=False,
                topic_name=topic_config.name,
                partitions=topic_config.partitions,
                replication_factor=topic_config.replication_factor,
                message=f"Kafka error: {str(e)}"
            )

        except Exception as e:
            logger.error(f"Error creating topic {topic_config.name}: {e}")
            return TopicCreateResult(
                success=False,
                topic_name=topic_config.name,
                partitions=topic_config.partitions,
                replication_factor=topic_config.replication_factor,
                message=f"Error: {str(e)}"
            )

    async def validate_topic_config(self, topic_config: TopicConfig) -> TopicValidationResult:
        """
        Validate topic configuration

        Args:
            topic_config: Topic configuration to validate

        Returns:
            TopicValidationResult with validation status
        """
        checks = []
        warnings = []
        errors = []

        # Check topic name
        if not topic_config.name:
            errors.append("Topic name is required")
            checks.append({"check": "topic_name", "passed": False, "message": "Name is required"})
        elif len(topic_config.name) > 249:
            errors.append("Topic name too long (max 249 characters)")
            checks.append({"check": "topic_name_length", "passed": False, "message": "Name exceeds 249 characters"})
        elif not all(c.isalnum() or c in '._-' for c in topic_config.name):
            errors.append("Topic name contains invalid characters (use alphanumeric, dots, underscores, hyphens)")
            checks.append({"check": "topic_name_chars", "passed": False, "message": "Invalid characters in name"})
        else:
            checks.append({"check": "topic_name", "passed": True, "message": "Valid topic name"})

        # Check partitions
        if topic_config.partitions < 1:
            errors.append("Partitions must be >= 1")
            checks.append({"check": "partitions_min", "passed": False, "message": "Partitions < 1"})
        elif topic_config.partitions > 100:
            warnings.append("High partition count (>100) may impact performance")
            checks.append({"check": "partitions_count", "passed": True, "message": f"{topic_config.partitions} partitions (high)"})
        else:
            checks.append({"check": "partitions_count", "passed": True, "message": f"{topic_config.partitions} partitions"})

        # Check replication factor
        cluster_info = await self.get_cluster_info()
        if cluster_info and topic_config.replication_factor > cluster_info.broker_count:
            errors.append(f"Replication factor ({topic_config.replication_factor}) exceeds broker count ({cluster_info.broker_count})")
            checks.append({"check": "replication_factor", "passed": False, "message": "Exceeds broker count"})
        elif topic_config.replication_factor < 2:
            warnings.append("Low replication factor (<2) reduces fault tolerance")
            checks.append({"check": "replication_factor", "passed": True, "message": f"Replication factor {topic_config.replication_factor} (low)"})
        else:
            checks.append({"check": "replication_factor", "passed": True, "message": f"Replication factor {topic_config.replication_factor}"})

        # Check min.insync.replicas
        if topic_config.min_insync_replicas >= topic_config.replication_factor:
            warnings.append("min.insync.replicas should be < replication_factor to allow writes during broker failures")
            checks.append({"check": "min_insync_replicas", "passed": True, "message": "May prevent writes during failures"})
        else:
            checks.append({"check": "min_insync_replicas", "passed": True, "message": f"Min in-sync replicas: {topic_config.min_insync_replicas}"})

        # Check retention
        if topic_config.retention_ms and topic_config.retention_ms < 60000:
            warnings.append("Very short retention (<1 minute) may cause data loss")
            checks.append({"check": "retention_time", "passed": True, "message": "Very short retention"})
        elif topic_config.retention_ms:
            checks.append({"check": "retention_time", "passed": True, "message": f"Retention: {topic_config.retention_ms}ms"})

        # Check if topic already exists
        try:
            existing_topic = await self.get_topic_info(topic_config.name)
            if existing_topic:
                errors.append(f"Topic '{topic_config.name}' already exists")
                checks.append({"check": "topic_exists", "passed": False, "message": "Topic already exists"})
        except:
            checks.append({"check": "topic_exists", "passed": True, "message": "Topic does not exist"})

        return TopicValidationResult(
            valid=len(errors) == 0,
            topic_name=topic_config.name,
            checks=checks,
            warnings=warnings,
            errors=errors
        )

    async def get_topic_info(self, topic_name: str) -> Optional[TopicInfo]:
        """
        Get information about a topic

        Args:
            topic_name: Topic name

        Returns:
            TopicInfo or None if not found
        """
        try:
            admin = self._get_admin_client()

            # Get topic metadata
            metadata = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: admin.describe_topics([topic_name])
            )

            if not metadata or topic_name not in metadata:
                return None

            topic_metadata = metadata[topic_name]

            # Get topic configuration
            config_resource = ConfigResource(ConfigResourceType.TOPIC, topic_name)
            configs = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: admin.describe_configs([config_resource])
            )

            topic_config = {}
            if config_resource in configs:
                for config_entry in configs[config_resource]:
                    topic_config[config_entry.name] = config_entry.value

            # Build partition details
            partition_details = []
            for partition in topic_metadata['partitions']:
                partition_details.append({
                    'partition_id': partition['partition'],
                    'leader': partition['leader'],
                    'replicas': partition['replicas'],
                    'isr': partition['isr']
                })

            return TopicInfo(
                name=topic_name,
                partitions=len(topic_metadata['partitions']),
                replication_factor=len(topic_metadata['partitions'][0]['replicas']) if topic_metadata['partitions'] else 0,
                config=topic_config,
                partition_details=partition_details,
                is_internal=topic_metadata.get('is_internal', False)
            )

        except Exception as e:
            logger.error(f"Error getting topic info for {topic_name}: {e}")
            return None

    async def list_topics(self, include_internal: bool = False) -> List[str]:
        """
        List all topics in the cluster

        Args:
            include_internal: Include internal Kafka topics

        Returns:
            List of topic names
        """
        try:
            admin = self._get_admin_client()
            topics = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: admin.list_topics()
            )

            if not include_internal:
                topics = [t for t in topics if not t.startswith('_')]

            return sorted(topics)

        except Exception as e:
            logger.error(f"Error listing topics: {e}")
            return []

    async def delete_topic(self, topic_name: str) -> bool:
        """
        Delete a topic

        Args:
            topic_name: Topic name to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            admin = self._get_admin_client()
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: admin.delete_topics([topic_name])
            )
            logger.info(f"Topic {topic_name} deleted successfully")
            return True

        except Exception as e:
            logger.error(f"Error deleting topic {topic_name}: {e}")
            return False

    async def get_cluster_info(self) -> Optional[KafkaClusterInfo]:
        """
        Get Kafka cluster information

        Returns:
            KafkaClusterInfo or None if error
        """
        try:
            admin = self._get_admin_client()

            # Get cluster metadata
            metadata = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: admin._client.cluster
            )

            # Get broker list
            brokers = []
            for broker in metadata.brokers():
                brokers.append({
                    'id': broker.nodeId,
                    'host': broker.host,
                    'port': broker.port,
                    'rack': getattr(broker, 'rack', None)
                })

            # Count topics and partitions
            topics = await self.list_topics(include_internal=False)
            total_partitions = 0
            for topic in topics:
                topic_info = await self.get_topic_info(topic)
                if topic_info:
                    total_partitions += topic_info.partitions

            return KafkaClusterInfo(
                cluster_id=metadata.cluster_id() or "unknown",
                controller_id=metadata.controller().nodeId if metadata.controller() else -1,
                broker_count=len(brokers),
                topic_count=len(topics),
                partition_count=total_partitions,
                brokers=brokers,
                version=None  # Kafka admin client doesn't provide version directly
            )

        except Exception as e:
            logger.error(f"Error getting cluster info: {e}")
            return None

    async def get_consumer_group_info(self, group_id: str) -> Optional[ConsumerGroupInfo]:
        """
        Get consumer group information

        Args:
            group_id: Consumer group ID

        Returns:
            ConsumerGroupInfo or None if not found
        """
        try:
            admin = self._get_admin_client()

            # Get consumer group details
            groups = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: admin.describe_consumer_groups([group_id])
            )

            if not groups or group_id not in groups:
                return None

            group = groups[group_id]

            # Extract topics from members
            topics = set()
            for member in group.members:
                if hasattr(member, 'member_assignment'):
                    assignment = member.member_assignment
                    if hasattr(assignment, 'assignment'):
                        for topic, partitions in assignment.assignment:
                            topics.add(topic)

            return ConsumerGroupInfo(
                group_id=group_id,
                state=group.state,
                members=len(group.members),
                lag=None,  # Would need to calculate from offsets
                topics=sorted(list(topics))
            )

        except Exception as e:
            logger.error(f"Error getting consumer group info for {group_id}: {e}")
            return None

    def close(self):
        """Close admin client connection"""
        if self.admin_client:
            self.admin_client.close()
            self.admin_client = None
