"""
Pydantic models for source connection management
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class ConnectionMode(str, Enum):
    """Type of data connection"""
    FEDERATED = "federated"
    CDC = "cdc"
    BATCH = "batch"
    STREAMING = "streaming"


class SourceStatus(str, Enum):
    """Operational status of source"""
    ACTIVE = "active"
    PAUSED = "paused"
    FAILED = "failed"
    CONFIGURING = "configuring"
    DEPLOYING = "deploying"


class DeploymentStatus(str, Enum):
    """Status of deployment process"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class SecretStorageType(str, Enum):
    """Type of secret management system"""
    ENVIRONMENT = "environment"
    K8S_SECRET = "k8s_secret"
    VAULT = "vault"
    AWS_SECRETS = "aws_secrets"
    FILE = "file"
    PLAINTEXT = "plaintext"


class DeploymentTarget(str, Enum):
    """Where to deploy the source configuration"""
    KUBERNETES = "kubernetes"
    SELF_HOSTED = "self-hosted"
    CLOUD_MANAGED = "cloud-managed"


# ============================================================================
# Base Models
# ============================================================================

class SecretReference(BaseModel):
    """Reference to a secret in a secret management system"""
    type: SecretStorageType
    reference: str  # e.g., "POSTGRES_PASSWORD" for env, "/secrets/db-pass" for file
    plaintext_value: Optional[str] = None  # Only if type is 'plaintext'


class ConnectionDetails(BaseModel):
    """Database connection details"""
    host: str
    port: int
    database_name: Optional[str] = None
    schema_name: Optional[str] = None
    username: str
    password_secret: Optional[SecretReference] = None
    ssl_enabled: bool = True
    additional_params: Optional[Dict[str, Any]] = None


class TableInfo(BaseModel):
    """Information about a discovered table"""
    schema: str
    table: str
    row_count: Optional[int] = None
    size_mb: Optional[float] = None
    primary_key_columns: List[str] = []
    column_count: Optional[int] = None


# ============================================================================
# Configuration Models (by connection mode)
# ============================================================================

class FederatedConfig(BaseModel):
    """Configuration for federated (virtual catalog) sources"""
    trino_catalog_name: str
    connection_pool_size: int = 10
    connection_pool_min_size: int = 2
    connection_pool_max_size: int = 20
    query_timeout_seconds: int = 60
    connection_timeout_ms: int = 30000
    idle_timeout_ms: int = 600000
    max_lifetime_ms: int = 1800000
    leak_detection_threshold_ms: int = 60000
    validation_timeout_ms: int = 5000
    validation_query: str = "SELECT 1"
    case_insensitive_matching: bool = False
    allow_drop_table: bool = False
    allow_rename_table: bool = False


class CDCConfig(BaseModel):
    """Configuration for CDC (Change Data Capture) sources"""
    debezium_connector_name: str
    snapshot_mode: str = "initial"  # 'initial', 'schema_only', 'never'
    kafka_topic_prefix: str
    kafka_partitions: int = 12
    kafka_replication_factor: int = 3
    selected_tables: List[TableInfo]

    # Iceberg destination
    iceberg_catalog: str
    iceberg_schema: str
    iceberg_partition_spec: Optional[List[Dict[str, Any]]] = None
    iceberg_file_format: str = "parquet"
    iceberg_compression: str = "snappy"


class BatchConfig(BaseModel):
    """Configuration for batch ingestion sources"""
    nifi_process_group_id: Optional[str] = None
    schedule_cron_expression: str  # e.g., "0 2 * * *" for daily at 2am
    batch_size: Optional[int] = None

    # Iceberg destination
    iceberg_catalog: str
    iceberg_schema: str
    iceberg_table_name: str
    write_mode: str = "append"  # 'append' or 'overwrite'


class StreamingConfig(BaseModel):
    """Configuration for streaming sources (Kafka topics)"""
    kafka_topic_name: str
    kafka_consumer_group: str
    kafka_offset_reset: str = "earliest"  # 'earliest' or 'latest'

    # Iceberg destination
    iceberg_catalog: str
    iceberg_schema: str
    iceberg_table_name: str
    iceberg_partition_spec: Optional[List[Dict[str, Any]]] = None


# ============================================================================
# Source Models
# ============================================================================

class SourceBase(BaseModel):
    """Base model for source creation/update"""
    name: str
    description: Optional[str] = None
    type: str  # 'postgresql', 'mysql', 'mongodb', etc.
    connection_mode: ConnectionMode
    domain: str
    owner_email: EmailStr
    team: Optional[str] = None
    tags: List[str] = []


class SourceCreate(SourceBase):
    """Model for creating a new source"""
    connection_details: ConnectionDetails

    # Configuration based on connection mode
    federated_config: Optional[FederatedConfig] = None
    cdc_config: Optional[CDCConfig] = None
    batch_config: Optional[BatchConfig] = None
    streaming_config: Optional[StreamingConfig] = None

    # Deployment
    deployment_target: DeploymentTarget = DeploymentTarget.KUBERNETES
    deployment_namespace: Optional[str] = "nexusone"
    schedule_for: Optional[datetime] = None  # If deployment should be scheduled


class SourceUpdate(BaseModel):
    """Model for updating an existing source"""
    description: Optional[str] = None
    owner_email: Optional[EmailStr] = None
    team: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[SourceStatus] = None


class Source(SourceBase):
    """Complete source model"""
    id: UUID
    status: SourceStatus
    health_score: Optional[int] = None
    last_health_check: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deployed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SourceSummary(BaseModel):
    """Abbreviated source info for list views"""
    id: UUID
    name: str
    type: str
    connection_mode: ConnectionMode
    domain: str
    status: SourceStatus
    health_score: Optional[int] = None
    owner_email: str
    created_at: datetime
    table_count: int = 0
    query_count_30d: Optional[int] = None
    error_message: Optional[str] = None


class SourceDetail(Source):
    """Detailed source information including related data"""
    connection_details: Optional[ConnectionDetails] = None
    configuration: Optional[Dict[str, Any]] = None
    tables: List[TableInfo] = []
    recent_metrics: Optional[Dict[str, Any]] = None
    deployment_history: List['DeploymentSummary'] = []


# ============================================================================
# Deployment Models
# ============================================================================

class DeploymentPhase(BaseModel):
    """Individual phase of deployment"""
    name: str
    status: str  # 'pending', 'in_progress', 'completed', 'failed'
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class DeploymentCreate(BaseModel):
    """Model for creating a deployment"""
    source_id: UUID
    deployment_config: Dict[str, Any]
    created_by: str


class Deployment(BaseModel):
    """Complete deployment model"""
    id: UUID
    source_id: UUID
    status: DeploymentStatus
    progress: int = 0
    deployment_config: Optional[Dict[str, Any]] = None
    artifacts: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None
    error_message: Optional[str] = None
    error_phase: Optional[str] = None
    deployment_logs: List[Dict[str, Any]] = []
    created_at: datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True


class DeploymentSummary(BaseModel):
    """Abbreviated deployment info"""
    id: UUID
    status: DeploymentStatus
    progress: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    created_by: Optional[str] = None


# ============================================================================
# Validation Models
# ============================================================================

class ValidationCheck(BaseModel):
    """Individual validation check result"""
    name: str
    status: str  # 'success', 'warning', 'error'
    message: str
    details: Optional[Dict[str, Any]] = None
    suggestion: Optional[str] = None


class ValidationResult(BaseModel):
    """Complete validation result"""
    valid: bool
    checks: List[ValidationCheck] = []
    warnings: List[str] = []
    errors: List[str] = []
    mcp_insights: Optional[Dict[str, Any]] = None


class ConnectionTestResult(BaseModel):
    """Result of connection test"""
    success: bool
    latency_ms: Optional[int] = None
    server_version: Optional[str] = None
    error_message: Optional[str] = None
    details: Dict[str, Any] = {}


# ============================================================================
# Metrics Models
# ============================================================================

class SourceMetrics(BaseModel):
    """Source performance metrics"""
    source_id: UUID

    # Federated metrics
    query_count_30d: Optional[int] = None
    avg_query_latency_ms: Optional[int] = None

    # CDC metrics
    replication_lag_seconds: Optional[int] = None
    throughput_mb_per_sec: Optional[float] = None
    kafka_consumer_lag: Optional[int] = None

    # Batch metrics
    last_run_at: Optional[datetime] = None
    last_run_status: Optional[str] = None
    last_run_duration_seconds: Optional[int] = None
    success_rate_30d: Optional[float] = None

    # Storage metrics
    storage_gb: Optional[float] = None
    row_count: Optional[int] = None

    recorded_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Dashboard Models
# ============================================================================

class SourcesOverview(BaseModel):
    """Dashboard overview of all sources"""
    total: int
    by_status: Dict[str, int]
    by_mode: Dict[str, int]
    by_domain: Dict[str, int]
    issues_count: int
    recent_deployments: List[DeploymentSummary] = []


class HealthStatus(BaseModel):
    """Health status for a source"""
    overall: str  # 'healthy', 'degraded', 'unhealthy'
    score: int  # 0-100
    issues: List[str] = []
    last_check: datetime
    checks: Dict[str, bool] = {}  # connectivity, permissions, lag, etc.


# ============================================================================
# MCP Integration Models
# ============================================================================

class MCPRecommendation(BaseModel):
    """Recommendation from MCP servers"""
    type: str  # 'connection_mode', 'partition_strategy', 'cost_optimization', etc.
    recommendation: str
    reasoning: str
    confidence: float  # 0-1
    details: Optional[Dict[str, Any]] = None


class CostEstimate(BaseModel):
    """Cost estimation for a source configuration"""
    storage_gb: float
    storage_cost_monthly: float
    compute_cost_monthly: float
    total_cost_monthly: float
    breakdown: Dict[str, str]
    comparison: Optional[Dict[str, str]] = None


# ============================================================================
# Configuration Request Models
# ============================================================================

class ConnectionConfig(BaseModel):
    """Complete configuration for creating a source"""
    # Basic info
    name: str
    description: Optional[str] = None
    type: str
    connection_mode: ConnectionMode
    domain: str
    owner_email: EmailStr
    team: Optional[str] = None
    tags: List[str] = []

    # Connection
    connection_details: ConnectionDetails

    # Mode-specific config
    federated_config: Optional[FederatedConfig] = None
    cdc_config: Optional[CDCConfig] = None
    batch_config: Optional[BatchConfig] = None
    streaming_config: Optional[StreamingConfig] = None

    # Deployment
    deployment_target: DeploymentTarget = DeploymentTarget.KUBERNETES
    deployment_namespace: Optional[str] = "nexusone"
    schedule_for: Optional[datetime] = None


# Update forward references
SourceDetail.model_rebuild()
