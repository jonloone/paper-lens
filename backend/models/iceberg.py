"""
Iceberg models for table management
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from enum import Enum


class FileFormat(str, Enum):
    """Iceberg file formats"""
    PARQUET = "parquet"
    ORC = "orc"
    AVRO = "avro"


class CompressionCodec(str, Enum):
    """Compression codecs"""
    NONE = "none"
    SNAPPY = "snappy"
    GZIP = "gzip"
    ZSTD = "zstd"
    LZ4 = "lz4"


class PartitionTransform(str, Enum):
    """Iceberg partition transforms"""
    IDENTITY = "identity"
    YEAR = "year"
    MONTH = "month"
    DAY = "day"
    HOUR = "hour"
    BUCKET = "bucket"
    TRUNCATE = "truncate"


class SortOrder(str, Enum):
    """Sort order"""
    ASC = "asc"
    DESC = "desc"


class ColumnType(str, Enum):
    """Iceberg column types"""
    BOOLEAN = "boolean"
    INTEGER = "int"
    LONG = "long"
    FLOAT = "float"
    DOUBLE = "double"
    DECIMAL = "decimal"
    DATE = "date"
    TIME = "time"
    TIMESTAMP = "timestamp"
    TIMESTAMPTZ = "timestamptz"
    STRING = "string"
    UUID = "uuid"
    FIXED = "fixed"
    BINARY = "binary"
    STRUCT = "struct"
    LIST = "list"
    MAP = "map"


class ColumnSchema(BaseModel):
    """Iceberg column schema"""
    name: str = Field(..., description="Column name")
    type: str = Field(..., description="Column type (Iceberg type string)")
    required: bool = Field(True, description="Whether column is required")
    doc: Optional[str] = Field(None, description="Column documentation")
    default: Optional[Any] = Field(None, description="Default value")


class PartitionSpec(BaseModel):
    """Iceberg partition specification"""
    source_column: str = Field(..., description="Source column name")
    transform: PartitionTransform = Field(..., description="Partition transform")
    name: Optional[str] = Field(None, description="Partition field name (auto-generated if not provided)")
    transform_param: Optional[int] = Field(None, description="Transform parameter (e.g., bucket count, truncate width)")


class SortField(BaseModel):
    """Iceberg sort field"""
    source_column: str = Field(..., description="Source column name")
    transform: PartitionTransform = Field(PartitionTransform.IDENTITY, description="Transform to apply")
    direction: SortOrder = Field(SortOrder.ASC, description="Sort direction")
    null_order: str = Field("nulls-first", description="Null ordering (nulls-first or nulls-last)")


class IcebergTableConfig(BaseModel):
    """Iceberg table configuration"""
    catalog_name: str = Field(..., description="Iceberg catalog name")
    database_name: str = Field(..., description="Database/schema name")
    table_name: str = Field(..., description="Table name")

    # Schema
    columns: List[ColumnSchema] = Field(..., description="Table columns")

    # Partitioning
    partition_spec: Optional[List[PartitionSpec]] = Field(default_factory=list, description="Partition specification")

    # Sorting
    sort_order: Optional[List[SortField]] = Field(default_factory=list, description="Sort order")

    # File format and compression
    file_format: FileFormat = Field(FileFormat.PARQUET, description="File format")
    compression_codec: CompressionCodec = Field(CompressionCodec.SNAPPY, description="Compression codec")

    # Table properties
    location: Optional[str] = Field(None, description="Table location (auto-generated if not provided)")
    table_properties: Optional[Dict[str, str]] = Field(default_factory=dict, description="Additional table properties")

    # Write properties
    write_target_file_size_bytes: int = Field(536870912, description="Target file size (default 512MB)")
    write_distribution_mode: str = Field("hash", description="Write distribution mode (hash, range, none)")

    # Metadata
    comment: Optional[str] = Field(None, description="Table comment/description")


class TableCreateRequest(BaseModel):
    """Request to create Iceberg table"""
    config: IcebergTableConfig
    validate_only: bool = Field(False, description="Only validate without creating")
    if_not_exists: bool = Field(True, description="Skip if table already exists")


class TableInfo(BaseModel):
    """Iceberg table information"""
    catalog: str
    database: str
    table: str
    location: str
    file_format: str
    partition_spec: List[Dict[str, Any]]
    sort_order: List[Dict[str, Any]]
    schema: List[Dict[str, Any]]
    properties: Dict[str, Any]
    current_snapshot_id: Optional[int] = None
    metadata_location: Optional[str] = None


class TableCreateResult(BaseModel):
    """Result of table creation"""
    success: bool
    catalog: str
    database: str
    table: str
    message: str
    warnings: List[str] = Field(default_factory=list)
    table_info: Optional[TableInfo] = None


class TableValidationResult(BaseModel):
    """Result of table validation"""
    valid: bool
    catalog: str
    database: str
    table: str
    checks: List[Dict[str, Any]]
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class CatalogInfo(BaseModel):
    """Iceberg catalog information"""
    name: str
    type: str
    properties: Dict[str, Any]
    databases: List[str] = Field(default_factory=list)


class SnapshotInfo(BaseModel):
    """Iceberg table snapshot information"""
    snapshot_id: int
    parent_snapshot_id: Optional[int]
    timestamp_ms: int
    manifest_list: str
    summary: Dict[str, Any]
    schema_id: Optional[int] = None


class TableMetrics(BaseModel):
    """Iceberg table metrics"""
    catalog: str
    database: str
    table: str
    total_files: int = 0
    total_records: int = 0
    total_size_bytes: int = 0
    total_data_files: int = 0
    total_delete_files: int = 0
    total_equality_deletes: int = 0
    total_position_deletes: int = 0
    snapshots_count: int = 0
    manifests_count: int = 0


class SchemaEvolutionOperation(str, Enum):
    """Schema evolution operations"""
    ADD_COLUMN = "add_column"
    DROP_COLUMN = "drop_column"
    RENAME_COLUMN = "rename_column"
    UPDATE_COLUMN_TYPE = "update_column_type"
    MAKE_COLUMN_OPTIONAL = "make_column_optional"
    MAKE_COLUMN_REQUIRED = "make_column_required"


class SchemaEvolutionRequest(BaseModel):
    """Request for schema evolution"""
    catalog: str
    database: str
    table: str
    operation: SchemaEvolutionOperation
    column_name: str
    new_column_name: Optional[str] = None
    column_type: Optional[str] = None
    column_spec: Optional[ColumnSchema] = None
    position: Optional[str] = Field(None, description="Position for new column (first, after column_name)")
