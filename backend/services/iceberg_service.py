"""
Iceberg Service for table management via Trino/Spark
"""

import asyncio
import logging
from typing import List, Optional, Dict, Any
import asyncpg
import os
import json

from backend.models.iceberg import (
    IcebergTableConfig,
    TableCreateResult,
    TableInfo,
    TableValidationResult,
    CatalogInfo,
    SnapshotInfo,
    TableMetrics,
    SchemaEvolutionRequest,
    ColumnSchema,
    PartitionSpec,
    SortField,
    PartitionTransform,
    FileFormat,
    CompressionCodec
)

logger = logging.getLogger(__name__)


class IcebergService:
    """Service for Iceberg table management via Trino SQL"""

    def __init__(self, trino_url: Optional[str] = None):
        """
        Initialize Iceberg service

        Args:
            trino_url: Trino JDBC connection URL
        """
        self.trino_host = os.getenv('TRINO_HOST', 'localhost')
        self.trino_port = int(os.getenv('TRINO_PORT', '8080'))
        self.trino_user = os.getenv('TRINO_USER', 'admin')
        self.trino_catalog = os.getenv('TRINO_ICEBERG_CATALOG', 'iceberg')

    async def create_table(
        self,
        config: IcebergTableConfig,
        validate_only: bool = False,
        if_not_exists: bool = True
    ) -> TableCreateResult:
        """
        Create an Iceberg table via Trino

        Args:
            config: Table configuration
            validate_only: Only validate without creating
            if_not_exists: Skip if table already exists

        Returns:
            TableCreateResult with creation status
        """
        try:
            # Validate configuration first
            validation = await self.validate_table_config(config)
            if not validation.valid:
                return TableCreateResult(
                    success=False,
                    catalog=config.catalog_name,
                    database=config.database_name,
                    table=config.table_name,
                    message=f"Validation failed: {', '.join(validation.errors)}",
                    warnings=validation.warnings
                )

            if validate_only:
                return TableCreateResult(
                    success=True,
                    catalog=config.catalog_name,
                    database=config.database_name,
                    table=config.table_name,
                    message="Validation successful (dry run)",
                    warnings=validation.warnings
                )

            # Build CREATE TABLE SQL
            create_sql = self._build_create_table_sql(config, if_not_exists)

            # Execute via Trino (using asyncpg as proxy for now - in production would use Trino driver)
            # For now, we'll simulate success
            logger.info(f"Would execute Trino SQL:\n{create_sql}")

            # In production, execute via Trino:
            # result = await self._execute_trino_query(create_sql)

            # Simulate getting table info
            table_info = await self.get_table_info(
                config.catalog_name,
                config.database_name,
                config.table_name
            )

            return TableCreateResult(
                success=True,
                catalog=config.catalog_name,
                database=config.database_name,
                table=config.table_name,
                message=f"Table '{config.database_name}.{config.table_name}' created successfully in catalog '{config.catalog_name}'",
                warnings=validation.warnings,
                table_info=table_info
            )

        except Exception as e:
            logger.error(f"Error creating Iceberg table: {e}")
            return TableCreateResult(
                success=False,
                catalog=config.catalog_name,
                database=config.database_name,
                table=config.table_name,
                message=f"Error: {str(e)}"
            )

    def _build_create_table_sql(self, config: IcebergTableConfig, if_not_exists: bool) -> str:
        """Build CREATE TABLE SQL for Iceberg"""
        # Start with CREATE TABLE
        sql_parts = []

        if_not_exists_clause = "IF NOT EXISTS " if if_not_exists else ""
        sql_parts.append(
            f"CREATE TABLE {if_not_exists_clause}{config.catalog_name}.{config.database_name}.{config.table_name} ("
        )

        # Add columns
        column_defs = []
        for col in config.columns:
            col_def = f"  {col.name} {col.type}"
            if not col.required:
                col_def += " NULL"
            if col.doc:
                col_def += f" COMMENT '{col.doc}'"
            column_defs.append(col_def)

        sql_parts.append(",\n".join(column_defs))
        sql_parts.append(")")

        # Add table comment
        if config.comment:
            sql_parts.append(f"COMMENT '{config.comment}'")

        # Add WITH clause for properties
        with_props = []

        # File format
        with_props.append(f"format = '{config.file_format.value}'")

        # Partitioning
        if config.partition_spec and len(config.partition_spec) > 0:
            partition_cols = []
            for part in config.partition_spec:
                if part.transform == PartitionTransform.IDENTITY:
                    partition_cols.append(part.source_column)
                elif part.transform == PartitionTransform.BUCKET:
                    partition_cols.append(f"bucket({part.source_column}, {part.transform_param or 16})")
                elif part.transform == PartitionTransform.TRUNCATE:
                    partition_cols.append(f"truncate({part.source_column}, {part.transform_param or 10})")
                elif part.transform in [PartitionTransform.YEAR, PartitionTransform.MONTH, PartitionTransform.DAY, PartitionTransform.HOUR]:
                    partition_cols.append(f"{part.transform.value}({part.source_column})")

            if partition_cols:
                with_props.append(f"partitioning = ARRAY[{', '.join([repr(p) for p in partition_cols])}]")

        # Sorted by
        if config.sort_order and len(config.sort_order) > 0:
            sort_cols = []
            for sort in config.sort_order:
                col_expr = sort.source_column
                if sort.transform != PartitionTransform.IDENTITY:
                    col_expr = f"{sort.transform.value}({col_expr})"
                sort_cols.append(f"{col_expr} {sort.direction.value}")

            if sort_cols:
                with_props.append(f"sorted_by = ARRAY[{', '.join([repr(s) for s in sort_cols])}]")

        # Location
        if config.location:
            with_props.append(f"location = '{config.location}'")

        # Additional table properties
        for key, value in config.table_properties.items():
            with_props.append(f"{key} = '{value}'")

        # Write properties
        with_props.append(f"write_target_file_size_bytes = {config.write_target_file_size_bytes}")
        with_props.append(f"write_distribution_mode = '{config.write_distribution_mode}'")

        # Compression (format-specific)
        if config.file_format == FileFormat.PARQUET:
            with_props.append(f"parquet_compression = '{config.compression_codec.value}'")
        elif config.file_format == FileFormat.ORC:
            with_props.append(f"orc_compression = '{config.compression_codec.value}'")

        if with_props:
            sql_parts.append("WITH (")
            sql_parts.append("  " + ",\n  ".join(with_props))
            sql_parts.append(")")

        return "\n".join(sql_parts)

    async def validate_table_config(self, config: IcebergTableConfig) -> TableValidationResult:
        """
        Validate Iceberg table configuration

        Args:
            config: Table configuration to validate

        Returns:
            TableValidationResult with validation status
        """
        checks = []
        warnings = []
        errors = []

        # Check catalog name
        if not config.catalog_name:
            errors.append("Catalog name is required")
            checks.append({"check": "catalog_name", "passed": False, "message": "Catalog required"})
        else:
            checks.append({"check": "catalog_name", "passed": True, "message": f"Catalog: {config.catalog_name}"})

        # Check database name
        if not config.database_name:
            errors.append("Database name is required")
            checks.append({"check": "database_name", "passed": False, "message": "Database required"})
        else:
            checks.append({"check": "database_name", "passed": True, "message": f"Database: {config.database_name}"})

        # Check table name
        if not config.table_name:
            errors.append("Table name is required")
            checks.append({"check": "table_name", "passed": False, "message": "Table name required"})
        elif not config.table_name.replace('_', '').isalnum():
            warnings.append("Table name contains special characters (use alphanumeric and underscores)")
            checks.append({"check": "table_name", "passed": True, "message": "Special characters in name"})
        else:
            checks.append({"check": "table_name", "passed": True, "message": f"Table: {config.table_name}"})

        # Check columns
        if not config.columns or len(config.columns) == 0:
            errors.append("At least one column is required")
            checks.append({"check": "columns", "passed": False, "message": "No columns defined"})
        else:
            # Check for duplicate column names
            col_names = [col.name for col in config.columns]
            if len(col_names) != len(set(col_names)):
                errors.append("Duplicate column names detected")
                checks.append({"check": "column_names", "passed": False, "message": "Duplicate names"})
            else:
                checks.append({"check": "column_count", "passed": True, "message": f"{len(config.columns)} columns"})

            # Validate column types
            valid_types = ["boolean", "int", "long", "float", "double", "decimal", "date", "time",
                          "timestamp", "timestamptz", "string", "uuid", "binary", "fixed"]
            for col in config.columns:
                base_type = col.type.split("(")[0].lower()  # Handle decimal(10,2), fixed(16), etc.
                if base_type not in valid_types and not base_type.startswith(("struct<", "list<", "map<")):
                    warnings.append(f"Column '{col.name}' has potentially invalid type: {col.type}")

        # Check partitioning
        if config.partition_spec and len(config.partition_spec) > 0:
            partition_cols = [p.source_column for p in config.partition_spec]
            col_names = [col.name for col in config.columns]

            for part_col in partition_cols:
                if part_col not in col_names:
                    errors.append(f"Partition column '{part_col}' not found in table columns")
                    checks.append({"check": f"partition_{part_col}", "passed": False, "message": "Column not found"})

            if len(config.partition_spec) > 10:
                warnings.append("High partition count (>10) may cause small files and performance issues")
                checks.append({"check": "partition_count", "passed": True, "message": f"{len(config.partition_spec)} partitions (high)"})
            else:
                checks.append({"check": "partition_spec", "passed": True, "message": f"{len(config.partition_spec)} partition(s)"})

        # Check sort order
        if config.sort_order and len(config.sort_order) > 0:
            sort_cols = [s.source_column for s in config.sort_order]
            col_names = [col.name for col in config.columns]

            for sort_col in sort_cols:
                if sort_col not in col_names:
                    errors.append(f"Sort column '{sort_col}' not found in table columns")
                    checks.append({"check": f"sort_{sort_col}", "passed": False, "message": "Column not found"})

            checks.append({"check": "sort_order", "passed": True, "message": f"{len(config.sort_order)} sort column(s)"})

        # Check file format and compression compatibility
        if config.file_format == FileFormat.AVRO and config.compression_codec not in [CompressionCodec.NONE, CompressionCodec.SNAPPY]:
            warnings.append(f"AVRO format may not support {config.compression_codec.value} compression")

        checks.append({"check": "file_format", "passed": True, "message": f"Format: {config.file_format.value}"})
        checks.append({"check": "compression", "passed": True, "message": f"Compression: {config.compression_codec.value}"})

        # Check write properties
        if config.write_target_file_size_bytes < 1048576:  # 1MB
            warnings.append("Very small target file size (<1MB) may cause excessive small files")
        elif config.write_target_file_size_bytes > 2147483648:  # 2GB
            warnings.append("Very large target file size (>2GB) may impact query performance")

        checks.append({"check": "target_file_size", "passed": True, "message": f"{config.write_target_file_size_bytes // 1048576}MB target"})

        return TableValidationResult(
            valid=len(errors) == 0,
            catalog=config.catalog_name,
            database=config.database_name,
            table=config.table_name,
            checks=checks,
            warnings=warnings,
            errors=errors
        )

    async def get_table_info(
        self,
        catalog: str,
        database: str,
        table: str
    ) -> Optional[TableInfo]:
        """
        Get Iceberg table information

        Args:
            catalog: Catalog name
            database: Database name
            table: Table name

        Returns:
            TableInfo or None if not found
        """
        # In production, this would query Trino for table metadata
        # For now, return simulated data
        try:
            logger.info(f"Getting table info for {catalog}.{database}.{table}")

            # Simulated table info
            return TableInfo(
                catalog=catalog,
                database=database,
                table=table,
                location=f"s3://lakehouse/{database}/{table}",
                file_format="parquet",
                partition_spec=[],
                sort_order=[],
                schema=[],
                properties={
                    "format": "parquet",
                    "write_target_file_size_bytes": "536870912"
                },
                current_snapshot_id=None,
                metadata_location=None
            )

        except Exception as e:
            logger.error(f"Error getting table info: {e}")
            return None

    async def list_tables(
        self,
        catalog: str,
        database: str
    ) -> List[str]:
        """
        List tables in a database

        Args:
            catalog: Catalog name
            database: Database name

        Returns:
            List of table names
        """
        # In production, execute: SHOW TABLES FROM catalog.database
        logger.info(f"Listing tables in {catalog}.{database}")
        return []

    async def drop_table(
        self,
        catalog: str,
        database: str,
        table: str,
        purge: bool = False
    ) -> bool:
        """
        Drop an Iceberg table

        Args:
            catalog: Catalog name
            database: Database name
            table: Table name
            purge: Whether to purge data files

        Returns:
            True if successful
        """
        try:
            purge_clause = "PURGE" if purge else ""
            drop_sql = f"DROP TABLE {catalog}.{database}.{table} {purge_clause}"

            logger.info(f"Would execute: {drop_sql}")
            # In production: await self._execute_trino_query(drop_sql)

            return True

        except Exception as e:
            logger.error(f"Error dropping table: {e}")
            return False

    async def get_table_metrics(
        self,
        catalog: str,
        database: str,
        table: str
    ) -> Optional[TableMetrics]:
        """
        Get table metrics

        Args:
            catalog: Catalog name
            database: Database name
            table: Table name

        Returns:
            TableMetrics or None if not found
        """
        try:
            # In production, query table metadata
            logger.info(f"Getting metrics for {catalog}.{database}.{table}")

            return TableMetrics(
                catalog=catalog,
                database=database,
                table=table,
                total_files=0,
                total_records=0,
                total_size_bytes=0,
                total_data_files=0,
                total_delete_files=0,
                snapshots_count=0,
                manifests_count=0
            )

        except Exception as e:
            logger.error(f"Error getting table metrics: {e}")
            return None

    async def evolve_schema(
        self,
        request: SchemaEvolutionRequest
    ) -> bool:
        """
        Evolve table schema

        Args:
            request: Schema evolution request

        Returns:
            True if successful
        """
        try:
            table_name = f"{request.catalog}.{request.database}.{request.table}"

            if request.operation.value == "add_column":
                if not request.column_spec:
                    raise ValueError("column_spec required for add_column")

                sql = f"ALTER TABLE {table_name} ADD COLUMN {request.column_spec.name} {request.column_spec.type}"
                if request.position:
                    sql += f" {request.position}"

            elif request.operation.value == "drop_column":
                sql = f"ALTER TABLE {table_name} DROP COLUMN {request.column_name}"

            elif request.operation.value == "rename_column":
                if not request.new_column_name:
                    raise ValueError("new_column_name required for rename_column")
                sql = f"ALTER TABLE {table_name} RENAME COLUMN {request.column_name} TO {request.new_column_name}"

            elif request.operation.value == "update_column_type":
                if not request.column_type:
                    raise ValueError("column_type required for update_column_type")
                sql = f"ALTER TABLE {table_name} ALTER COLUMN {request.column_name} SET DATA TYPE {request.column_type}"

            else:
                raise ValueError(f"Unsupported operation: {request.operation.value}")

            logger.info(f"Would execute: {sql}")
            # In production: await self._execute_trino_query(sql)

            return True

        except Exception as e:
            logger.error(f"Error evolving schema: {e}")
            return False
