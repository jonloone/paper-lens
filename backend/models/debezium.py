"""
Debezium models for CDC connector deployment
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from enum import Enum


class SnapshotMode(str, Enum):
    """Debezium snapshot modes"""
    INITIAL = "initial"
    INITIAL_ONLY = "initial_only"
    WHEN_NEEDED = "when_needed"
    NEVER = "never"
    SCHEMA_ONLY = "schema_only"
    SCHEMA_ONLY_RECOVERY = "schema_only_recovery"


class ConnectorStatus(str, Enum):
    """Debezium connector status"""
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    FAILED = "FAILED"
    UNASSIGNED = "UNASSIGNED"
    STOPPED = "STOPPED"


class ConnectorType(str, Enum):
    """Debezium connector types"""
    POSTGRESQL = "io.debezium.connector.postgresql.PostgresConnector"
    MYSQL = "io.debezium.connector.mysql.MySqlConnector"
    MONGODB = "io.debezium.connector.mongodb.MongoDbConnector"
    SQLSERVER = "io.debezium.connector.sqlserver.SqlServerConnector"
    ORACLE = "io.debezium.connector.oracle.OracleConnector"
    DB2 = "io.debezium.connector.db2.Db2Connector"


class DebeziumConnectorConfig(BaseModel):
    """Debezium connector configuration"""
    name: str = Field(..., description="Connector name (must be unique)")
    connector_class: ConnectorType = Field(..., description="Connector class")

    # Database connection
    database_hostname: str = Field(..., description="Database host")
    database_port: int = Field(..., description="Database port")
    database_user: str = Field(..., description="Database user")
    database_password: str = Field(..., description="Database password")
    database_dbname: str = Field(..., description="Database name")
    database_server_name: str = Field(..., description="Logical server name for topic prefix")

    # Snapshot configuration
    snapshot_mode: SnapshotMode = Field(SnapshotMode.INITIAL, description="Snapshot mode")

    # Kafka configuration
    kafka_topic_prefix: str = Field(..., description="Kafka topic prefix")

    # Schema configuration
    schema_include_list: Optional[str] = Field(None, description="Comma-separated list of schemas to include")
    table_include_list: Optional[str] = Field(None, description="Comma-separated list of tables to include")
    schema_exclude_list: Optional[str] = Field(None, description="Comma-separated list of schemas to exclude")
    table_exclude_list: Optional[str] = Field(None, description="Comma-separated list of tables to exclude")

    # Column configuration
    column_include_list: Optional[str] = Field(None, description="Comma-separated list of columns to include")
    column_exclude_list: Optional[str] = Field(None, description="Comma-separated list of columns to exclude")

    # Performance tuning
    max_batch_size: int = Field(2048, description="Maximum batch size")
    max_queue_size: int = Field(8192, description="Maximum queue size")
    poll_interval_ms: int = Field(1000, description="Poll interval in milliseconds")

    # Heartbeat and monitoring
    heartbeat_interval_ms: int = Field(10000, description="Heartbeat interval in milliseconds")
    heartbeat_topics_prefix: Optional[str] = Field(None, description="Heartbeat topics prefix")

    # Tombstones
    tombstones_on_delete: bool = Field(True, description="Emit tombstone on delete")

    # Decimal handling
    decimal_handling_mode: str = Field("precise", description="Decimal handling mode (precise, double, string)")

    # Binary handling
    binary_handling_mode: str = Field("bytes", description="Binary handling mode (bytes, base64, hex)")

    # Slot configuration (PostgreSQL specific)
    slot_name: Optional[str] = Field(None, description="Replication slot name (PostgreSQL)")
    publication_name: Optional[str] = Field(None, description="Publication name (PostgreSQL)")
    plugin_name: Optional[str] = Field("pgoutput", description="Logical decoding plugin (PostgreSQL)")

    # Additional properties
    tasks_max: int = Field(1, description="Maximum number of tasks")
    additional_config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional connector configs")


class ConnectorCreateRequest(BaseModel):
    """Request to create Debezium connector"""
    config: DebeziumConnectorConfig
    validate_only: bool = Field(False, description="Only validate without creating")


class TaskInfo(BaseModel):
    """Connector task information"""
    id: int
    state: str
    worker_id: str
    trace: Optional[str] = None


class ConnectorInfo(BaseModel):
    """Debezium connector information"""
    name: str
    config: Dict[str, Any]
    tasks: List[TaskInfo]
    type: str


class ConnectorStatusInfo(BaseModel):
    """Debezium connector status information"""
    name: str
    connector: Dict[str, Any]
    tasks: List[Dict[str, Any]]
    type: str


class ConnectorCreateResult(BaseModel):
    """Result of connector creation"""
    success: bool
    connector_name: str
    message: str
    warnings: List[str] = Field(default_factory=list)
    connector_info: Optional[ConnectorInfo] = None


class ConnectorValidationResult(BaseModel):
    """Result of connector validation"""
    valid: bool
    connector_name: str
    checks: List[Dict[str, Any]]
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class ConnectorMetrics(BaseModel):
    """Connector performance metrics"""
    connector_name: str
    total_records_processed: int = 0
    total_events: int = 0
    snapshot_completed: bool = False
    snapshot_running: bool = False
    streaming: bool = False
    connected: bool = False
    last_event_timestamp: Optional[str] = None
    milliseconds_since_last_event: Optional[int] = None


class KafkaConnectClusterInfo(BaseModel):
    """Kafka Connect cluster information"""
    version: str
    commit: str
    kafka_cluster_id: str
    connectors: List[str] = Field(default_factory=list)
    connector_count: int = 0


class ConnectorOffsets(BaseModel):
    """Connector offset information"""
    connector_name: str
    offsets: Dict[str, Any]
