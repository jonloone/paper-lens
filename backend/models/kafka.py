"""
Kafka models for CDC pipeline deployment
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from enum import Enum


class CompressionType(str, Enum):
    """Kafka compression types"""
    NONE = "none"
    GZIP = "gzip"
    SNAPPY = "snappy"
    LZ4 = "lz4"
    ZSTD = "zstd"


class CleanupPolicy(str, Enum):
    """Kafka topic cleanup policies"""
    DELETE = "delete"
    COMPACT = "compact"
    COMPACT_DELETE = "compact,delete"


class TopicConfig(BaseModel):
    """Kafka topic configuration"""
    name: str = Field(..., description="Topic name")
    partitions: int = Field(12, ge=1, le=100, description="Number of partitions")
    replication_factor: int = Field(3, ge=1, le=5, description="Replication factor")
    retention_ms: Optional[int] = Field(604800000, description="Retention in milliseconds (default 7 days)")
    retention_bytes: Optional[int] = Field(None, description="Retention in bytes per partition")
    compression_type: CompressionType = Field(CompressionType.SNAPPY, description="Compression type")
    cleanup_policy: CleanupPolicy = Field(CleanupPolicy.DELETE, description="Cleanup policy")
    min_insync_replicas: int = Field(2, ge=1, description="Minimum in-sync replicas")
    segment_ms: Optional[int] = Field(86400000, description="Segment roll time (default 1 day)")
    max_message_bytes: Optional[int] = Field(1048576, description="Max message size in bytes")
    additional_config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional Kafka configs")


class TopicCreateRequest(BaseModel):
    """Request to create Kafka topic"""
    topic_config: TopicConfig
    validate_only: bool = Field(False, description="Only validate without creating")


class TopicInfo(BaseModel):
    """Kafka topic information"""
    name: str
    partitions: int
    replication_factor: int
    config: Dict[str, Any]
    partition_details: Optional[List[Dict[str, Any]]] = None
    is_internal: bool = False


class TopicCreateResult(BaseModel):
    """Result of topic creation"""
    success: bool
    topic_name: str
    partitions: int
    replication_factor: int
    message: str
    warnings: List[str] = Field(default_factory=list)
    topic_info: Optional[TopicInfo] = None


class TopicValidationResult(BaseModel):
    """Result of topic validation"""
    valid: bool
    topic_name: str
    checks: List[Dict[str, Any]]
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class KafkaClusterInfo(BaseModel):
    """Kafka cluster information"""
    cluster_id: str
    controller_id: int
    broker_count: int
    topic_count: int
    partition_count: int
    brokers: List[Dict[str, Any]]
    version: Optional[str] = None


class ConsumerGroupInfo(BaseModel):
    """Kafka consumer group information"""
    group_id: str
    state: str
    members: int
    lag: Optional[int] = None
    topics: List[str]
