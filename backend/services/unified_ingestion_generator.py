"""
Unified Ingestion Configuration Generator (POC)

This service generates configuration artifacts for different ingestion methods:
- Federated: Trino catalog properties
- Incremental: Spark jobs + Airflow DAGs
- CDC: Debezium connector configs + Kafka topics + Flink/Spark streaming jobs

Key architectural insight: Multiple catalogs per connection to support mixed methods
Example: prod_postgres_federated + prod_postgres_replicated
"""

from typing import List, Dict, Any, Literal
from dataclasses import dataclass, field
from datetime import datetime
import json


IngestionMethod = Literal["federated", "incremental_query", "batch_cdc", "streaming_cdc"]


@dataclass
class TableIngestionConfig:
    """Per-table ingestion configuration"""
    schema_name: str
    table_name: str
    ingestion_method: IngestionMethod

    # Incremental-specific
    timestamp_column: str | None = None
    schedule: str | None = None  # cron expression
    watermark_offset: str | None = None

    # CDC-specific
    primary_key_columns: List[str] = field(default_factory=list)
    snapshot_mode: str | None = None
    capture_deletes: bool = True

    # Common
    enabled: bool = True
    estimated_row_count: int = 0


@dataclass
class ConnectionConfig:
    """Source connection configuration"""
    name: str
    type: str  # postgresql, mysql, etc.
    host: str
    port: int
    database: str
    username: str
    # password handled via secrets

    # Default method for this connection
    default_method: IngestionMethod

    # Per-table configurations
    tables: List[TableIngestionConfig] = field(default_factory=list)


class UnifiedIngestionGenerator:
    """
    POC: Generates ingestion artifacts based on per-table method selection.

    Key Innovation: Supports mixed ingestion methods within a single connection
    by generating multiple Trino catalogs and appropriate replication pipelines.
    """

    def __init__(self, connection_config: ConnectionConfig):
        self.config = connection_config

    def generate_all_artifacts(self) -> Dict[str, Any]:
        """
        Generate all necessary artifacts for this connection.
        Returns a dictionary showing what would be deployed.
        """
        # Group tables by ingestion method
        tables_by_method = self._group_tables_by_method()

        artifacts = {
            "connection_name": self.config.name,
            "source_type": self.config.type,
            "deployment_summary": self._generate_deployment_summary(tables_by_method),
            "trino_catalogs": self._generate_trino_catalogs(tables_by_method),
            "replication_pipelines": {},
        }

        # Generate method-specific artifacts
        if "federated" in tables_by_method:
            # Federated tables just need Trino catalog (already in trino_catalogs)
            pass

        if "incremental_query" in tables_by_method:
            artifacts["replication_pipelines"]["incremental_sync"] = {
                "spark_jobs": self._generate_spark_incremental_jobs(tables_by_method["incremental_query"]),
                "airflow_dags": self._generate_airflow_dag_incremental(tables_by_method["incremental_query"]),
                "iceberg_tables": self._generate_iceberg_table_schemas(tables_by_method["incremental_query"]),
            }

        if "batch_cdc" in tables_by_method or "streaming_cdc" in tables_by_method:
            cdc_tables = tables_by_method.get("batch_cdc", []) + tables_by_method.get("streaming_cdc", [])
            artifacts["replication_pipelines"]["cdc"] = {
                "debezium_connector": self._generate_debezium_config(cdc_tables),
                "kafka_topics": self._generate_kafka_topics(cdc_tables),
                "processing_jobs": self._generate_cdc_processing_jobs(
                    tables_by_method.get("batch_cdc", []),
                    tables_by_method.get("streaming_cdc", [])
                ),
                "iceberg_tables": self._generate_iceberg_table_schemas(cdc_tables),
            }

        return artifacts

    def _group_tables_by_method(self) -> Dict[IngestionMethod, List[TableIngestionConfig]]:
        """Group tables by their ingestion method"""
        grouped = {}
        for table in self.config.tables:
            if not table.enabled:
                continue
            method = table.ingestion_method
            if method not in grouped:
                grouped[method] = []
            grouped[method].append(table)
        return grouped

    def _generate_deployment_summary(self, tables_by_method: Dict) -> Dict[str, Any]:
        """High-level summary of what will be deployed"""
        total_tables = sum(len(tables) for tables in tables_by_method.values())

        return {
            "total_tables": total_tables,
            "methods_used": list(tables_by_method.keys()),
            "catalogs_required": len(tables_by_method),  # One catalog per method
            "breakdown": {
                method: {
                    "table_count": len(tables),
                    "tables": [f"{t.schema_name}.{t.table_name}" for t in tables]
                }
                for method, tables in tables_by_method.items()
            },
            "architecture_notes": [
                "Each ingestion method requires a separate Trino catalog",
                f"Federated catalog: {self.config.name}_federated (direct query to source)",
                f"Replicated catalog: {self.config.name}_replicated (queries Iceberg tables)",
                "Per-table method selection is achieved through catalog routing",
            ]
        }

    def _generate_trino_catalogs(self, tables_by_method: Dict) -> List[Dict[str, Any]]:
        """
        Generate Trino catalog configurations.

        Key Insight: One catalog per ingestion method (cannot mix federated and replicated).
        """
        catalogs = []

        # Federated catalog (if any tables use federated method)
        if "federated" in tables_by_method:
            catalogs.append({
                "catalog_name": f"{self.config.name}_federated",
                "connector_type": self.config.type,
                "access_pattern": "federated",
                "properties": self._generate_jdbc_catalog_properties(),
                "tables_accessible": [f"{t.schema_name}.{t.table_name}" for t in tables_by_method["federated"]],
                "notes": "Direct JDBC connection to source database. Zero replication latency."
            })

        # Replicated catalog (for incremental and CDC tables)
        replicated_methods = ["incremental_query", "batch_cdc", "streaming_cdc"]
        replicated_tables = []
        for method in replicated_methods:
            if method in tables_by_method:
                replicated_tables.extend(tables_by_method[method])

        if replicated_tables:
            catalogs.append({
                "catalog_name": f"{self.config.name}_replicated",
                "connector_type": "iceberg",
                "access_pattern": "replicated",
                "properties": self._generate_iceberg_catalog_properties(),
                "tables_accessible": [f"{t.schema_name}.{t.table_name}" for t in replicated_tables],
                "notes": "Queries replicated data in Iceberg tables. Isolation from source system."
            })

        return catalogs

    def _generate_jdbc_catalog_properties(self) -> Dict[str, str]:
        """Generate Trino JDBC catalog properties for federated access"""
        return {
            "connector.name": self.config.type,
            "connection-url": f"jdbc:{self.config.type}://{self.config.host}:{self.config.port}/{self.config.database}",
            "connection-user": self.config.username,
            "connection-password": "${ENV:DB_PASSWORD}",  # Secret reference
            "case-insensitive-name-matching": "true",
        }

    def _generate_iceberg_catalog_properties(self) -> Dict[str, str]:
        """Generate Trino Iceberg catalog properties for replicated data access"""
        return {
            "connector.name": "iceberg",
            "iceberg.catalog.type": "hive_metastore",
            "hive.metastore.uri": "thrift://hive-metastore:9083",
            "iceberg.file-format": "PARQUET",
            "iceberg.compression-codec": "ZSTD",
        }

    def _generate_spark_incremental_jobs(self, tables: List[TableIngestionConfig]) -> List[Dict[str, Any]]:
        """
        Generate Spark job configurations for incremental sync.

        Each table gets a PySpark job that:
        1. Reads from source using timestamp watermark
        2. Writes to Iceberg table with merge logic
        """
        jobs = []

        for table in tables:
            job_name = f"incremental_sync_{self.config.name}_{table.schema_name}_{table.table_name}"

            jobs.append({
                "job_name": job_name,
                "job_type": "spark_incremental_sync",
                "source": {
                    "type": self.config.type,
                    "host": self.config.host,
                    "port": self.config.port,
                    "database": self.config.database,
                    "schema": table.schema_name,
                    "table": table.table_name,
                },
                "sync_config": {
                    "timestamp_column": table.timestamp_column,
                    "watermark_offset": table.watermark_offset or "1 hour",
                    "merge_strategy": "upsert",  # based on primary key
                },
                "target": {
                    "format": "iceberg",
                    "catalog": f"{self.config.name}_replicated",
                    "schema": table.schema_name,
                    "table": table.table_name,
                    "partition_by": [table.timestamp_column] if table.timestamp_column else [],
                },
                "pyspark_code_preview": self._generate_spark_job_preview(table),
            })

        return jobs

    def _generate_spark_job_preview(self, table: TableIngestionConfig) -> str:
        """Generate preview of PySpark code for incremental sync"""
        return f"""
# Incremental Sync Job: {table.schema_name}.{table.table_name}

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, max as spark_max

spark = SparkSession.builder \\
    .appName("incremental_sync_{table.table_name}") \\
    .config("spark.sql.catalog.{self.config.name}_replicated", "org.apache.iceberg.spark.SparkCatalog") \\
    .config("spark.sql.catalog.{self.config.name}_replicated.type", "hive") \\
    .getOrCreate()

# Get last watermark from target Iceberg table
last_watermark = spark.sql(\"\"\"
    SELECT MAX({table.timestamp_column}) as max_ts
    FROM {self.config.name}_replicated.{table.schema_name}.{table.table_name}
\"\"\").collect()[0]["max_ts"]

# Read incremental data from source
incremental_df = spark.read \\
    .format("jdbc") \\
    .option("url", "jdbc:{self.config.type}://{self.config.host}:{self.config.port}/{self.config.database}") \\
    .option("dbtable", "{table.schema_name}.{table.table_name}") \\
    .option("user", "{self.config.username}") \\
    .option("password", "${{DB_PASSWORD}}") \\
    .load() \\
    .where(col("{table.timestamp_column}") > last_watermark)

# Merge into Iceberg table
incremental_df.writeTo("{self.config.name}_replicated.{table.schema_name}.{table.table_name}") \\
    .using("iceberg") \\
    .tableProperty("write.merge.mode", "merge-on-read") \\
    .option("mergeSchema", "true") \\
    .append()

spark.stop()
"""

    def _generate_airflow_dag_incremental(self, tables: List[TableIngestionConfig]) -> Dict[str, Any]:
        """
        Generate Airflow DAG for orchestrating incremental sync jobs.

        Groups tables by schedule to minimize DAG complexity.
        """
        # Group tables by schedule
        by_schedule = {}
        for table in tables:
            schedule = table.schedule or "0 */6 * * *"  # Default: every 6 hours
            if schedule not in by_schedule:
                by_schedule[schedule] = []
            by_schedule[schedule].append(table)

        dags = []
        for schedule, scheduled_tables in by_schedule.items():
            dag_id = f"{self.config.name}_incremental_sync_{schedule.replace(' ', '_')}"

            dags.append({
                "dag_id": dag_id,
                "schedule": schedule,
                "table_count": len(scheduled_tables),
                "tables": [f"{t.schema_name}.{t.table_name}" for t in scheduled_tables],
                "tasks": [
                    {
                        "task_id": f"sync_{t.schema_name}_{t.table_name}",
                        "operator": "SparkSubmitOperator",
                        "application": f"/jobs/incremental_sync_{self.config.name}_{t.schema_name}_{t.table_name}.py",
                    }
                    for t in scheduled_tables
                ],
                "dag_code_preview": self._generate_airflow_dag_preview(dag_id, schedule, scheduled_tables),
            })

        return dags

    def _generate_airflow_dag_preview(self, dag_id: str, schedule: str, tables: List[TableIngestionConfig]) -> str:
        """Generate preview of Airflow DAG code"""
        tasks = "\n    ".join([
            f"{t.schema_name}_{t.table_name} = SparkSubmitOperator(task_id='sync_{t.schema_name}_{t.table_name}', ...)"
            for t in tables
        ])

        return f"""
from airflow import DAG
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from datetime import datetime

with DAG(
    dag_id="{dag_id}",
    schedule_interval="{schedule}",
    start_date=datetime(2025, 1, 1),
    catchup=False,
) as dag:
    {tasks}

    # Tasks run in parallel (no dependencies for incremental sync)
"""

    def _generate_debezium_config(self, tables: List[TableIngestionConfig]) -> Dict[str, Any]:
        """
        Generate Debezium connector configuration for CDC.

        Key: table.include.list parameter filters to selected tables only.
        """
        table_whitelist = ",".join([f"{t.schema_name}.{t.table_name}" for t in tables])

        return {
            "name": f"{self.config.name}_cdc_connector",
            "config": {
                "connector.class": self._get_debezium_connector_class(),
                "database.hostname": self.config.host,
                "database.port": str(self.config.port),
                "database.user": self.config.username,
                "database.password": "${DB_PASSWORD}",
                "database.dbname": self.config.database,
                "database.server.name": self.config.name,

                # Per-table filtering - KEY CAPABILITY
                "table.include.list": table_whitelist,

                # Snapshot configuration
                "snapshot.mode": tables[0].snapshot_mode or "initial",

                # Kafka configuration
                "topic.prefix": f"{self.config.name}_cdc",
                "key.converter": "org.apache.kafka.connect.json.JsonConverter",
                "value.converter": "org.apache.kafka.connect.json.JsonConverter",

                # Schema evolution
                "schema.history.internal.kafka.bootstrap.servers": "kafka:9092",
                "schema.history.internal.kafka.topic": f"{self.config.name}_schema_history",
            },
            "notes": [
                f"Captures changes from {len(tables)} tables",
                "Uses table.include.list for per-table CDC selection",
                f"Publishes to Kafka topics: {self.config.name}_cdc.<schema>.<table>",
            ]
        }

    def _get_debezium_connector_class(self) -> str:
        """Get Debezium connector class based on database type"""
        connectors = {
            "postgresql": "io.debezium.connector.postgresql.PostgresConnector",
            "mysql": "io.debezium.connector.mysql.MySqlConnector",
            "sqlserver": "io.debezium.connector.sqlserver.SqlServerConnector",
            "oracle": "io.debezium.connector.oracle.OracleConnector",
        }
        return connectors.get(self.config.type, connectors["postgresql"])

    def _generate_kafka_topics(self, tables: List[TableIngestionConfig]) -> List[Dict[str, Any]]:
        """Generate Kafka topic configurations for CDC events"""
        topics = []

        for table in tables:
            topic_name = f"{self.config.name}_cdc.{table.schema_name}.{table.table_name}"
            topics.append({
                "topic_name": topic_name,
                "partitions": 3,
                "replication_factor": 3,
                "config": {
                    "retention.ms": "604800000",  # 7 days
                    "compression.type": "zstd",
                    "cleanup.policy": "delete",
                },
                "notes": f"CDC events for {table.schema_name}.{table.table_name}"
            })

        return topics

    def _generate_cdc_processing_jobs(
        self,
        batch_cdc_tables: List[TableIngestionConfig],
        streaming_cdc_tables: List[TableIngestionConfig]
    ) -> Dict[str, Any]:
        """
        Generate processing jobs for CDC events.

        - Batch CDC: Spark jobs that process CDC events in batches
        - Streaming CDC: Flink jobs that process CDC events continuously
        """
        jobs = {
            "batch_processors": [],
            "streaming_processors": [],
        }

        # Batch CDC processors (Spark Structured Streaming with trigger intervals)
        for table in batch_cdc_tables:
            jobs["batch_processors"].append({
                "job_name": f"cdc_batch_{table.schema_name}_{table.table_name}",
                "type": "spark_structured_streaming",
                "source_topic": f"{self.config.name}_cdc.{table.schema_name}.{table.table_name}",
                "target_table": f"{self.config.name}_replicated.{table.schema_name}.{table.table_name}",
                "trigger": "5 minutes",  # Process every 5 minutes
                "code_preview": "# Spark Structured Streaming job with 5-minute microbatches"
            })

        # Streaming CDC processors (Flink SQL or Spark Continuous mode)
        for table in streaming_cdc_tables:
            jobs["streaming_processors"].append({
                "job_name": f"cdc_streaming_{table.schema_name}_{table.table_name}",
                "type": "flink_sql",
                "source_topic": f"{self.config.name}_cdc.{table.schema_name}.{table.table_name}",
                "target_table": f"{self.config.name}_replicated.{table.schema_name}.{table.table_name}",
                "mode": "continuous",
                "code_preview": "# Flink SQL job for continuous CDC processing"
            })

        return jobs

    def _generate_iceberg_table_schemas(self, tables: List[TableIngestionConfig]) -> List[Dict[str, Any]]:
        """
        Generate Iceberg table DDL for replicated tables.

        Note: In production, these would be created automatically by Spark/Flink jobs.
        """
        iceberg_tables = []

        for table in tables:
            iceberg_tables.append({
                "catalog": f"{self.config.name}_replicated",
                "schema": table.schema_name,
                "table": table.table_name,
                "full_name": f"{self.config.name}_replicated.{table.schema_name}.{table.table_name}",
                "format": "iceberg",
                "partitioning": self._infer_partitioning(table),
                "notes": f"Replicated from {self.config.type} via {table.ingestion_method}"
            })

        return iceberg_tables

    def _infer_partitioning(self, table: TableIngestionConfig) -> List[str]:
        """Infer optimal partitioning strategy based on table configuration"""
        partitions = []

        if table.ingestion_method == "incremental_query" and table.timestamp_column:
            partitions.append(f"DAY({table.timestamp_column})")
        elif table.ingestion_method in ["batch_cdc", "streaming_cdc"]:
            partitions.append("HOUR(_commit_timestamp)")  # CDC event timestamp

        return partitions


def demonstrate_poc():
    """
    POC Demonstration: Show how per-table method selection works
    """
    # Example: Connection with mixed ingestion methods
    config = ConnectionConfig(
        name="prod_postgres",
        type="postgresql",
        host="prod-db.company.com",
        port=5432,
        database="production",
        username="readonly_user",
        default_method="incremental_query",
        tables=[
            # Small reference tables → Federated (direct query)
            TableIngestionConfig(
                schema_name="public",
                table_name="products",
                ingestion_method="federated",
                estimated_row_count=5000,
            ),
            TableIngestionConfig(
                schema_name="public",
                table_name="categories",
                ingestion_method="federated",
                estimated_row_count=100,
            ),

            # Medium table with timestamp → Incremental
            TableIngestionConfig(
                schema_name="public",
                table_name="customers",
                ingestion_method="incremental_query",
                timestamp_column="updated_at",
                schedule="0 */6 * * *",  # Every 6 hours
                watermark_offset="1 hour",
                estimated_row_count=125000,
            ),

            # Large high-change table → Batch CDC
            TableIngestionConfig(
                schema_name="public",
                table_name="orders",
                ingestion_method="batch_cdc",
                primary_key_columns=["order_id"],
                snapshot_mode="initial",
                capture_deletes=True,
                estimated_row_count=2500000,
            ),

            # Critical real-time table → Streaming CDC
            TableIngestionConfig(
                schema_name="analytics",
                table_name="user_events",
                ingestion_method="streaming_cdc",
                primary_key_columns=["event_id"],
                snapshot_mode="schema_only",
                capture_deletes=False,
                estimated_row_count=10000000,
            ),
        ]
    )

    generator = UnifiedIngestionGenerator(config)
    artifacts = generator.generate_all_artifacts()

    print("=" * 80)
    print("POC: Unified Ingestion Generator - Per-Table Method Selection")
    print("=" * 80)
    print()
    print(json.dumps(artifacts, indent=2, default=str))

    return artifacts


if __name__ == "__main__":
    demonstrate_poc()
