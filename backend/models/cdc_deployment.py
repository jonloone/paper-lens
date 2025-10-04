"""
CDC Deployment models for orchestrating end-to-end CDC pipeline creation
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from enum import Enum
from datetime import datetime

from backend.models.sources import SourceDetail
from backend.models.kafka import TopicConfig
from backend.models.debezium import DebeziumConnectorConfig
from backend.models.iceberg import IcebergTableConfig


class DeploymentPhase(str, Enum):
    """CDC deployment phases"""
    VALIDATION = "validation"
    KAFKA_TOPIC_CREATION = "kafka_topic_creation"
    DEBEZIUM_DEPLOYMENT = "debezium_deployment"
    ICEBERG_TABLE_CREATION = "iceberg_table_creation"
    VERIFICATION = "verification"
    MONITORING_SETUP = "monitoring_setup"


class PhaseStatus(str, Enum):
    """Phase execution status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class CDCDeploymentRequest(BaseModel):
    """Request to deploy complete CDC pipeline"""
    source_id: str = Field(..., description="Source system ID from sources table")

    # Kafka configuration
    kafka_topic_config: TopicConfig = Field(..., description="Kafka topic configuration")

    # Debezium configuration
    debezium_config: DebeziumConnectorConfig = Field(..., description="Debezium connector configuration")

    # Iceberg configuration
    iceberg_configs: List[IcebergTableConfig] = Field(..., description="Iceberg table configurations (one per source table)")

    # Deployment options
    dry_run: bool = Field(False, description="Validate without deploying")
    skip_existing: bool = Field(True, description="Skip if resources already exist")
    auto_rollback: bool = Field(True, description="Rollback on failure")


class PhaseResult(BaseModel):
    """Result of a deployment phase"""
    phase: DeploymentPhase
    status: PhaseStatus
    message: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    artifacts: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Phase-specific outputs")


class CDCDeploymentResult(BaseModel):
    """Result of CDC deployment"""
    deployment_id: str
    source_id: str
    source_name: str
    status: str
    message: str

    # Phase results
    phases: List[PhaseResult] = Field(default_factory=list)

    # Overall metrics
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_duration_seconds: Optional[float] = None

    # Deployment artifacts
    kafka_topic: Optional[str] = None
    debezium_connector: Optional[str] = None
    iceberg_tables: List[str] = Field(default_factory=list)

    # Validation summary
    validation_checks: List[Dict[str, Any]] = Field(default_factory=list)
    total_checks: int = 0
    passed_checks: int = 0
    failed_checks: int = 0
    warnings_count: int = 0


class CDCDeploymentStatus(BaseModel):
    """Current status of CDC deployment"""
    deployment_id: str
    source_id: str
    current_phase: DeploymentPhase
    phase_status: PhaseStatus
    progress_percentage: int = Field(ge=0, le=100)
    message: str
    started_at: datetime
    estimated_completion: Optional[datetime] = None


class CDCValidationSummary(BaseModel):
    """Summary of CDC deployment validation"""
    valid: bool
    source_id: str

    # Component validations
    kafka_validation: Dict[str, Any]
    debezium_validation: Dict[str, Any]
    iceberg_validations: List[Dict[str, Any]]

    # Overall summary
    total_checks: int
    passed_checks: int
    failed_checks: int
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class RollbackRequest(BaseModel):
    """Request to rollback a CDC deployment"""
    deployment_id: str
    reason: str
    force: bool = Field(False, description="Force rollback even if not in failed state")


class RollbackResult(BaseModel):
    """Result of rollback operation"""
    success: bool
    deployment_id: str
    message: str
    rollback_actions: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class CDCPipelineHealth(BaseModel):
    """Health status of deployed CDC pipeline"""
    deployment_id: str
    source_id: str
    overall_health: str  # healthy, degraded, unhealthy
    health_score: int = Field(ge=0, le=100)

    # Component health
    kafka_topic_health: Dict[str, Any]
    debezium_connector_health: Dict[str, Any]
    iceberg_tables_health: List[Dict[str, Any]]

    # Metrics
    records_processed: int = 0
    lag_seconds: Optional[int] = None
    throughput_records_per_sec: Optional[float] = None
    error_rate: Optional[float] = None

    last_check: datetime
    issues: List[str] = Field(default_factory=list)


class CDCDeploymentsList(BaseModel):
    """List of CDC deployments"""
    deployments: List[Dict[str, Any]]
    total: int
    page: int = 1
    page_size: int = 100
