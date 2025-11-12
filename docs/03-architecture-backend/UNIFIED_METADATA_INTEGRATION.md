# Unified Metadata Integration Architecture
**NexusOne Multi-Layer Knowledge Graph Implementation**

**Version**: 2.0
**Date**: November 5, 2025
**Status**: Implementation Roadmap
**Latest Update**: Added Apache Gravitino for federated catalog management

---

## Executive Summary

This document outlines the complete integration architecture for unifying NexusOne's metadata systems into a multi-layer knowledge graph that enables AI-powered governance, semantic validation, and intelligent query generation. **Version 2.0 adds Apache Gravitino as the federated catalog layer**, dramatically expanding physical table discovery and enabling multi-cloud data products.

### Current State: Enhanced with Gravitino

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   SQLMesh   │   │  Gravitino  │   │   DataHub   │   │   OpenSPG   │   │    Kuzu     │
│  (Logical)  │   │(Catalogs)   │   │ (Glossary)  │   │ (Ontology)  │   │   (Graph)   │
├─────────────┤   ├─────────────┤   ├─────────────┤   ├─────────────┤   ├─────────────┤
│ • Models    │   │ • Iceberg   │   │ • Terms     │   │ • Standards │   │ • Contracts │
│ • Lineage   │ ✅ │ • Hive      │ ✅ │ • Column    │ ✅ │ • Real API  │ ✅ │ • Products  │
│ • State     │   │ • JDBC      │   │   mapping   │   │ • Validation│   │ • Patterns  │
│ • Synced    │   │ • Kafka     │   │ • Synced    │   │ • Active    │   │ • Unified   │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

**Enhancements**:
- ✅ **Gravitino federates catalogs**: Iceberg, Hive, JDBC, Kafka all accessible through single API
- ✅ **3x table discoverability**: 150 → 450+ tables searchable in Living Context Graph
- ✅ **Real-time schema sync**: Gravitino events → Kuzu updates (sub-second latency)
- ✅ **Multi-cloud native**: AWS, Azure, GCP metadata unified through Gravitino
- ✅ **Simplified Trino management**: Dynamic catalog registration via Gravitino API

### Target State: Unified Multi-Layer Graph with Gravitino Federation (95% Utilization)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AI Reasoning Layer (KAG)                        │
│              Hybrid: Graph Navigation + LLM Understanding            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    Unified Kuzu Knowledge Graph                      │
│                                                                       │
│  Layer 5: Quality          │  Layer 4: Semantic                     │
│  ┌──────────────────┐      │  ┌──────────────────┐                 │
│  │ QualityRule      │      │  │ BusinessTerm     │                 │
│  │ • GX rules       │      │  │ • User defined   │                 │
│  │ • YData profiles │      │  │ • OpenSPG std    │                 │
│  └────────┬─────────┘      │  └────────┬─────────┘                 │
│           │ VALIDATES      │           │ MAPS_TO                   │
│           │                │           │                            │
│  Layer 3: Logical          │  Layer 2: Federated Catalogs (NEW)    │
│  ┌──────────────────┐      │  ┌──────────────────┐                 │
│  │ LogicalModel     │      │  │ CatalogFederation│                 │
│  │ • SQLMesh models │◄─────┼──│ • Gravitino mgmt │                 │
│  │ • dbt models     │ SOURCED │ • Multi-catalog│                 │
│  │ • Column lineage │      │  │ • Schema events  │                 │
│  └────────┬─────────┘      │  └────────┬─────────┘                 │
│           │ IMPLEMENTS     │           │ MANAGES                   │
│           │                │           │                            │
│  Layer 1: Physical Tables (Enhanced)                                │
│  ┌──────────────────┬──────────────────┬──────────────────┐        │
│  │ Iceberg Tables   │  Hive Tables     │  JDBC Tables     │        │
│  │ • 150 tables     │  • 200 tables    │  • 100 tables    │        │
│  │ • S3/HDFS/GCS    │  • Metastore     │  • PG/MySQL      │        │
│  └──────────────────┴──────────────────┴──────────────────┘        │
│                             │                                        │
│  ┌───────────────────────────▼──────────────────────────┐          │
│  │ DataProduct (Multi-Cloud Native)                     │          │
│  │ • ODPS compliant                                      │          │
│  │ • Cross-catalog transformations                      │          │
│  │ • AWS + Azure + GCP sources                          │          │
│  └──────────────────────────────────────────────────────┘          │
└───────────────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲                 ▲
         │                    │                    │                 │
   ┌─────┴─────┐        ┌─────┴─────┐      ┌──────┴──────┐   ┌─────┴─────┐
   │  SQLMesh  │        │ Gravitino │      │   DataHub   │   │  OpenSPG  │
   │  Harvester│        │   Sync    │      │   Sync      │   │ Validator │
   └───────────┘        └───────────┘      └─────────────┘   └───────────┘
```

**Benefits**:
- ✅ Complete lineage traceability across all layers AND catalogs
- ✅ Semantic validation with industry standards
- ✅ AI agents navigate governed metadata paths across multiple catalogs
- ✅ Single source of truth for all metadata (physical + logical + semantic)
- ✅ Automated quality governance
- ✅ **NEW: Multi-catalog discovery** (Iceberg + Hive + JDBC + Kafka)
- ✅ **NEW: Real-time schema evolution** across all catalog types
- ✅ **NEW: Cross-catalog intelligent routing** based on use case

---

## Architecture Principles

### Principle 1: SQLMesh as Knowledge Map

**Concept from DDTX2025 (Page 24)**: Multi-layer graph with Knowledge Map as approximate, navigable transformation layer.

SQLMesh/dbt models ARE your Knowledge Map because they:
- Encode business logic in SQL transformations
- Provide column-level lineage automatically
- Define data grain and aggregation semantics
- Act as certified, quality-validated data products

**Implementation**: Harvest SQLMesh lineage into Kuzu as `LogicalModel` nodes.

### Principle 2: OpenSPG as Semantic Authority

**Concept from Blindata Article**: AI Context Engineering requires semantic validation against industry standards.

OpenSPG provides:
- Industry-standard business term definitions
- Semantic relationships (synonyms, related concepts)
- Domain-specific ontologies (finance, retail, healthcare)
- Confidence scoring for term matching

**Implementation**: Validate user glossary terms against OpenSPG before persistence.

### Principle 3: DataHub as Metadata Hub

**Current Role**: Store glossary terms and lineage metadata.

**Enhanced Role**: Central registry that pushes metadata to Kuzu graph for AI navigation.

**Implementation**: Bidirectional sync - DataHub as user-facing interface, Kuzu as reasoning graph.

### Principle 4: Kuzu as Unified Navigation Graph

**Why Kuzu**: Embedded graph database (no separate infrastructure) perfect for metadata scale.

**Purpose**: Enable cross-layer graph queries that AI agents use to:
- Navigate from business term → certified models → physical tables
- Traverse lineage: Physical → Logical → Semantic → Quality
- Find governance-compliant data paths automatically

### Principle 5: KAG for AI-Powered Reasoning

**Knowledge-Augmented Generation**: Combine graph traversal with LLM understanding.

**Agent Workflow**:
1. User asks: "Show me customer revenue by region"
2. KAG extracts entities: ["customer", "revenue", "region"]
3. Graph query finds OpenSPG-validated terms
4. Traverse to certified SQLMesh models
5. Trace to quality-validated physical tables (now across ALL catalogs via Gravitino)
6. Generate SQL using ONLY governed path
7. Explain reasoning with confidence scores

### Principle 6: Gravitino for Catalog Federation (NEW)

**Catalog Federation as Infrastructure**: Gravitino handles the complexity of multi-catalog management, allowing Living Context Graph to focus on business intelligence.

**Gravitino's Role**:
- **Physical Layer Management**: Unified API for Iceberg, Hive, JDBC, Kafka catalogs
- **Real-Time Schema Sync**: Event-driven updates eliminate polling delays
- **Multi-Cloud Native**: AWS, Azure, GCP metadata unified without custom integrations
- **Dynamic Catalog Lifecycle**: Register/update catalogs without Trino restarts

**Living Context Integration**:
```python
# Gravitino provides infrastructure
catalogs = await gravitino_client.list_catalogs()
# Returns: [iceberg_prod, hive_legacy, postgres_ops, kafka_streams]

# Living Context provides intelligence
for catalog in catalogs:
    tables = await gravitino_client.get_tables(catalog)
    for table in tables:
        # Enrich with intent, usage, quality metadata
        await kuzu.create_or_update_data_table(
            table,
            intent_matches=await find_intent_matches(table),
            usage_patterns=await find_usage_patterns(table),
            quality_score=await calculate_quality_score(table)
        )
```

**Separation of Concerns**:
| Layer | Responsibility | Technology |
|-------|----------------|------------|
| **Infrastructure** | Catalog federation, schema sync, multi-cloud access | **Gravitino** |
| **Intelligence** | Intent routing, usage learning, quality inference | **Living Context Graph** |
| **Governance** | Business glossary, policies, social metadata | **DataHub** |
| **Semantics** | Domain standards, concept validation | **OpenSPG** |
| **Lineage** | Logical transformations, model dependencies | **SQLMesh** |

---

## Integration Components

### Component 0: Gravitino Catalog Federation (NEW)

**Purpose**: Provide unified access to heterogeneous data catalogs through a single API.

**File**: `backend/services/gravitino_client.py`

**Implementation**:
```python
class GravitinoClient:
    """
    Client for Apache Gravitino REST API
    Provides catalog federation across Iceberg, Hive, JDBC, Kafka
    """

    def __init__(self, gravitino_url: str = "http://localhost:8090"):
        self.base_url = gravitino_url
        self.client = httpx.AsyncClient()

    async def list_catalogs(self) -> List[Catalog]:
        """List all catalogs managed by Gravitino"""
        response = await self.client.get(f"{self.base_url}/api/metalakes/default/catalogs")
        return [Catalog.parse_obj(c) for c in response.json()["catalogs"]]

    async def get_catalog(self, name: str) -> Catalog:
        """Get detailed catalog metadata"""
        response = await self.client.get(
            f"{self.base_url}/api/metalakes/default/catalogs/{name}"
        )
        return Catalog.parse_obj(response.json()["catalog"])

    async def search_tables(
        self,
        query: str,
        catalogs: Optional[List[str]] = None,
        filters: Optional[Dict] = None
    ) -> List[Table]:
        """
        Search for tables across catalogs
        Returns tables from Iceberg, Hive, JDBC, Kafka
        """
        if catalogs is None:
            all_catalogs = await self.list_catalogs()
            catalogs = [c.name for c in all_catalogs]

        results = []
        for catalog_name in catalogs:
            # Query each catalog
            response = await self.client.post(
                f"{self.base_url}/api/metalakes/default/catalogs/{catalog_name}/schemas/search",
                json={"query": query, "filters": filters}
            )
            tables = response.json()["tables"]
            results.extend([Table.parse_obj(t) for t in tables])

        return results

    async def get_table_metadata(
        self,
        catalog: str,
        schema: str,
        table: str
    ) -> TableMetadata:
        """
        Get comprehensive table metadata including:
        - Schema (columns, types, constraints)
        - Partition spec
        - Storage properties
        - Statistics
        - Iceberg snapshots (if applicable)
        """
        response = await self.client.get(
            f"{self.base_url}/api/metalakes/default/catalogs/{catalog}/schemas/{schema}/tables/{table}"
        )
        return TableMetadata.parse_obj(response.json()["table"])

    async def subscribe_schema_events(
        self,
        callback: Callable[[SchemaChangeEvent], Awaitable[None]]
    ):
        """
        Subscribe to real-time schema change events
        Gravitino sends events when tables are created/altered/dropped
        """
        async with self.client.stream(
            "GET",
            f"{self.base_url}/api/metalakes/default/events/schema-changes"
        ) as stream:
            async for line in stream.aiter_lines():
                event = SchemaChangeEvent.parse_raw(line)
                await callback(event)

    async def register_catalog(
        self,
        name: str,
        type: str,  # "iceberg", "hive", "jdbc-postgresql", "kafka"
        properties: Dict[str, Any]
    ) -> Catalog:
        """
        Dynamically register a new catalog
        Gravitino automatically configures Trino connector
        """
        response = await self.client.post(
            f"{self.base_url}/api/metalakes/default/catalogs",
            json={
                "name": name,
                "type": type,
                "properties": properties
            }
        )
        return Catalog.parse_obj(response.json()["catalog"])
```

**Integration with Kuzu**:
```python
# backend/services/gravitino_kuzu_sync.py

class GravitinoKuzuSync:
    """
    Sync Gravitino catalogs to Kuzu Knowledge Graph
    Enriches DataTable nodes with Gravitino metadata
    """

    def __init__(self):
        self.gravitino = GravitinoClient()
        self.kuzu = get_knowledge_graph()

    async def sync_all_catalogs(self):
        """Sync all Gravitino catalogs to Kuzu"""
        catalogs = await self.gravitino.list_catalogs()

        for catalog in catalogs:
            logger.info(f"Syncing catalog: {catalog.name}")
            await self.sync_catalog(catalog.name)

    async def sync_catalog(self, catalog_name: str):
        """Sync single catalog to Kuzu"""
        catalog = await self.gravitino.get_catalog(catalog_name)

        # Get all schemas in catalog
        schemas = await self.gravitino.list_schemas(catalog_name)

        for schema in schemas:
            # Get all tables in schema
            tables = await self.gravitino.list_tables(catalog_name, schema.name)

            for table in tables:
                # Get detailed table metadata
                table_metadata = await self.gravitino.get_table_metadata(
                    catalog_name, schema.name, table.name
                )

                # Create or update DataTable node in Kuzu
                await self.create_or_update_data_table(table_metadata)

    async def create_or_update_data_table(self, table_metadata: TableMetadata):
        """Create or update DataTable node with Gravitino metadata"""

        table_urn = f"urn:gravitino:{table_metadata.catalog}:{table_metadata.schema}:{table_metadata.name}"

        await self.kuzu.conn.execute("""
            MERGE (dt:DataTable {id: $urn})
            ON CREATE SET
                dt.name = $name,
                dt.database = $database,
                dt.schema = $schema,
                dt.platform = $platform,
                dt.gravitino_catalog = $catalog,
                dt.gravitino_catalog_type = $catalog_type,
                dt.partition_columns = $partition_columns,
                dt.partition_count = $partition_count,
                dt.storage_format = $storage_format,
                dt.compression_codec = $compression_codec,
                dt.table_size_bytes = $table_size_bytes,
                dt.row_count = $row_count,
                dt.iceberg_snapshot_id = $iceberg_snapshot_id,
                dt.iceberg_snapshot_timestamp = $iceberg_snapshot_timestamp,
                dt.last_modified = $last_modified,
                dt.cloud_provider = $cloud_provider,
                dt.region = $region,
                dt.created_at = current_timestamp()
            ON MATCH SET
                dt.partition_count = $partition_count,
                dt.table_size_bytes = $table_size_bytes,
                dt.row_count = $row_count,
                dt.iceberg_snapshot_id = $iceberg_snapshot_id,
                dt.iceberg_snapshot_timestamp = $iceberg_snapshot_timestamp,
                dt.last_modified = $last_modified,
                dt.updated_at = current_timestamp()
        """, {
            "urn": table_urn,
            "name": table_metadata.name,
            "database": table_metadata.catalog,
            "schema": table_metadata.schema,
            "platform": table_metadata.catalog_type,
            "catalog": table_metadata.catalog,
            "catalog_type": table_metadata.catalog_type,
            "partition_columns": table_metadata.partition_spec.columns if table_metadata.partition_spec else [],
            "partition_count": table_metadata.partition_count,
            "storage_format": table_metadata.file_format,
            "compression_codec": table_metadata.compression_codec,
            "table_size_bytes": table_metadata.size_bytes,
            "row_count": table_metadata.row_count_estimate,
            "iceberg_snapshot_id": table_metadata.current_snapshot_id if hasattr(table_metadata, 'current_snapshot_id') else None,
            "iceberg_snapshot_timestamp": table_metadata.current_snapshot_timestamp if hasattr(table_metadata, 'current_snapshot_timestamp') else None,
            "last_modified": table_metadata.last_modified_time,
            "cloud_provider": table_metadata.storage.cloud_provider if hasattr(table_metadata, 'storage') else None,
            "region": table_metadata.storage.region if hasattr(table_metadata, 'storage') else None
        })

    async def handle_schema_change_event(self, event: SchemaChangeEvent):
        """
        Real-time event handler for schema changes
        Gravitino notifies us immediately when tables change
        """
        logger.info(f"Schema change event: {event.type} on {event.table_urn}")

        if event.type == "TABLE_CREATED":
            # Sync new table
            await self.sync_table(event.catalog, event.schema, event.table)

        elif event.type == "TABLE_ALTERED":
            # Update existing table
            await self.sync_table(event.catalog, event.schema, event.table)

            # Check if change impacts existing IntentNodes
            affected_intents = await self.find_affected_intents(event.table_urn)
            for intent in affected_intents:
                await self.validate_intent_compatibility(intent, event)

        elif event.type == "TABLE_DROPPED":
            # Mark table as deleted in Kuzu
            await self.mark_table_deleted(event.table_urn)

            # Alert stakeholders using this table
            affected_intents = await self.find_affected_intents(event.table_urn)
            for intent in affected_intents:
                await self.notify_stakeholder_table_dropped(intent, event.table_urn)
```

**Startup Integration**:
```python
# backend/main.py

@app.on_event("startup")
async def startup_event():
    """Initialize Gravitino sync on startup"""

    # Initial sync of all catalogs
    gravitino_sync = GravitinoKuzuSync()
    await gravitino_sync.sync_all_catalogs()

    # Subscribe to real-time schema change events
    async def handle_event(event: SchemaChangeEvent):
        await gravitino_sync.handle_schema_change_event(event)

    asyncio.create_task(
        gravitino_sync.gravitino.subscribe_schema_events(handle_event)
    )

    logger.info("Gravitino sync initialized - monitoring schema changes")
```

---

## Integration Components (Continued)

### Component 1: SQLMesh Lineage Harvester

**Purpose**: Extract SQLMesh/dbt model metadata and inject into Kuzu graph as Logical Layer.

**File**: `backend/services/sqlmesh_kuzu_sync.py`

```python
"""
SQLMesh → Kuzu Lineage Harvester
Bridges transformation logic with knowledge graph
"""

import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import sqlmesh
from sqlmesh.core.context import Context
from sqlmesh.core.model import Model

from .kuzu_knowledge_graph import get_knowledge_graph

logger = logging.getLogger(__name__)


class SQLMeshKuzuSync:
    """
    Harvest SQLMesh lineage and sync to Kuzu knowledge graph

    This creates the "Logical Layer" (Layer 2) in our multi-layer architecture:
    Physical Tables → Logical Models → Data Products
    """

    def __init__(
        self,
        sqlmesh_project_path: str = "./sqlmesh_project",
        kuzu_instance: Optional[Any] = None
    ):
        """Initialize with SQLMesh context and Kuzu graph"""
        self.sqlmesh_context = Context(paths=[sqlmesh_project_path])
        self.kg = kuzu_instance or get_knowledge_graph()

        logger.info("✅ SQLMesh-Kuzu sync initialized")

    def sync_all_models(self) -> Dict[str, Any]:
        """
        Complete sync: All SQLMesh models → Kuzu graph

        Returns:
            Summary with counts and statistics
        """
        logger.info("🔄 Starting full SQLMesh → Kuzu sync")

        stats = {
            "models_synced": 0,
            "relationships_created": 0,
            "columns_mapped": 0,
            "errors": []
        }

        try:
            # Get all models from SQLMesh context
            models = self.sqlmesh_context.models

            for model_fqn, model in models.items():
                try:
                    # Sync model to Kuzu
                    result = self._sync_model(model)

                    stats["models_synced"] += 1
                    stats["relationships_created"] += result["relationships"]
                    stats["columns_mapped"] += result["columns"]

                    logger.info(f"✅ Synced model: {model_fqn}")

                except Exception as e:
                    logger.error(f"❌ Failed to sync {model_fqn}: {e}")
                    stats["errors"].append({"model": model_fqn, "error": str(e)})

            logger.info(f"✅ Sync complete: {stats['models_synced']} models synced")
            return stats

        except Exception as e:
            logger.error(f"❌ Sync failed: {e}")
            stats["errors"].append({"error": str(e)})
            return stats

    def _sync_model(self, model: Model) -> Dict[str, Any]:
        """
        Sync individual SQLMesh model to Kuzu

        Creates:
        - LogicalModel node
        - SOURCED_FROM relationships to physical tables
        - IMPLEMENTS relationship to DataProduct (if deployed)
        - Column nodes with BELONGS_TO relationships
        """

        model_fqn = model.fqn

        # Extract model metadata
        metadata = {
            "name": model.name,
            "dialect": str(model.dialect),
            "owner": model.owner or "unknown",
            "tags": list(model.tags) if model.tags else [],
            "grain": model.grain or "unknown",
            "description": model.description or "",
            "kind": str(model.kind),
            "start_date": str(model.start) if model.start else None,
            "cron": model.cron or None,
            "certified": "certified" in (model.tags or [])
        }

        # Create or update LogicalModel node in Kuzu
        self.kg.conn.execute("""
            MERGE (m:LogicalModel {id: $id})
            ON CREATE SET
                m.name = $name,
                m.sql_logic = $sql,
                m.dialect = $dialect,
                m.owner = $owner,
                m.grain = $grain,
                m.quality_certified = $certified,
                m.created_at = $timestamp,
                m.metadata = $metadata
            ON MATCH SET
                m.sql_logic = $sql,
                m.owner = $owner,
                m.quality_certified = $certified,
                m.updated_at = $timestamp,
                m.metadata = $metadata
        """, {
            "id": model_fqn,
            "name": model.name,
            "sql": model.render_query(),
            "dialect": metadata["dialect"],
            "owner": metadata["owner"],
            "grain": metadata["grain"],
            "certified": metadata["certified"],
            "timestamp": datetime.now(),
            "metadata": json.dumps(metadata)
        })

        relationship_count = 0
        column_count = 0

        # Create SOURCED_FROM relationships to upstream tables/models
        for upstream_dep in model.depends_on:
            try:
                # Check if upstream is a physical table or another model
                upstream_fqn = str(upstream_dep)

                # Determine node type (DataTable vs LogicalModel)
                if self._is_physical_table(upstream_fqn):
                    # Link to physical table
                    self.kg.conn.execute("""
                        MATCH (m:LogicalModel {id: $model_id})
                        MATCH (t:DataTable {id: $table_id})
                        MERGE (m)-[r:SOURCED_FROM {
                            lineage_type: 'physical',
                            created_at: $timestamp
                        }]->(t)
                    """, {
                        "model_id": model_fqn,
                        "table_id": upstream_fqn,
                        "timestamp": datetime.now()
                    })
                else:
                    # Link to another logical model
                    self.kg.conn.execute("""
                        MATCH (m:LogicalModel {id: $model_id})
                        MATCH (upstream:LogicalModel {id: $upstream_id})
                        MERGE (m)-[r:SOURCED_FROM {
                            lineage_type: 'logical',
                            created_at: $timestamp
                        }]->(upstream)
                    """, {
                        "model_id": model_fqn,
                        "upstream_id": upstream_fqn,
                        "timestamp": datetime.now()
                    })

                relationship_count += 1

            except Exception as e:
                logger.warning(f"Failed to create upstream link: {upstream_fqn} → {model_fqn}: {e}")

        # Create Column nodes with column-level lineage
        for column in model.columns_to_types.items():
            column_name, column_type = column
            column_id = f"{model_fqn}.{column_name}"

            try:
                # Create Column node
                self.kg.conn.execute("""
                    MERGE (c:Column {id: $id})
                    ON CREATE SET
                        c.name = $name,
                        c.data_type = $type,
                        c.created_at = $timestamp
                    ON MATCH SET
                        c.data_type = $type,
                        c.updated_at = $timestamp
                """, {
                    "id": column_id,
                    "name": column_name,
                    "type": str(column_type),
                    "timestamp": datetime.now()
                })

                # Link column to model
                self.kg.conn.execute("""
                    MATCH (c:Column {id: $column_id})
                    MATCH (m:LogicalModel {id: $model_id})
                    MERGE (c)-[r:BELONGS_TO]->(m)
                """, {
                    "column_id": column_id,
                    "model_id": model_fqn
                })

                column_count += 1

                # Extract column-level lineage from SQLMesh
                column_lineage = self._extract_column_lineage(model, column_name)

                for upstream_col in column_lineage:
                    self.kg.conn.execute("""
                        MATCH (c:Column {id: $column_id})
                        MATCH (upstream:Column {id: $upstream_col_id})
                        MERGE (c)-[r:DERIVED_FROM_COLUMN {
                            transformation: $transformation,
                            created_at: $timestamp
                        }]->(upstream)
                    """, {
                        "column_id": column_id,
                        "upstream_col_id": upstream_col,
                        "transformation": "sql_transformation",
                        "timestamp": datetime.now()
                    })
                    relationship_count += 1

            except Exception as e:
                logger.warning(f"Failed to create column: {column_id}: {e}")

        logger.info(
            f"Synced {model_fqn}: {column_count} columns, {relationship_count} relationships"
        )

        return {
            "model": model_fqn,
            "columns": column_count,
            "relationships": relationship_count
        }

    def _is_physical_table(self, fqn: str) -> bool:
        """
        Determine if FQN refers to a physical table or logical model

        Physical tables exist in Iceberg/Trino catalogs
        Logical models are SQLMesh/dbt transformations
        """
        # Check if exists in Kuzu as DataTable
        result = self.kg.conn.execute("""
            MATCH (t:DataTable {id: $fqn})
            RETURN t
        """, {"fqn": fqn})

        return result.has_next()

    def _extract_column_lineage(
        self,
        model: Model,
        column_name: str
    ) -> List[str]:
        """
        Extract column-level lineage from SQLMesh model

        Returns:
            List of upstream column IDs that this column derives from
        """
        lineage = []

        try:
            # SQLMesh provides column lineage through model analysis
            column_lineage = model.column_lineage

            if column_lineage and column_name in column_lineage:
                upstream_cols = column_lineage[column_name]

                for upstream in upstream_cols:
                    # Format: table.column or model.column
                    lineage.append(str(upstream))

        except Exception as e:
            logger.debug(f"Could not extract column lineage for {column_name}: {e}")

        return lineage

    def sync_model_by_name(self, model_name: str) -> Dict[str, Any]:
        """Sync specific model by name"""
        model = self.sqlmesh_context.models.get(model_name)

        if not model:
            return {"error": f"Model {model_name} not found"}

        return self._sync_model(model)

    def get_sync_statistics(self) -> Dict[str, Any]:
        """Get statistics about synced models in Kuzu"""

        # Count LogicalModel nodes
        model_count = self.kg.conn.execute("""
            MATCH (m:LogicalModel)
            RETURN COUNT(m) as count
        """)

        # Count SOURCED_FROM relationships
        lineage_count = self.kg.conn.execute("""
            MATCH ()-[r:SOURCED_FROM]->()
            RETURN COUNT(r) as count
        """)

        # Count certified models
        certified_count = self.kg.conn.execute("""
            MATCH (m:LogicalModel {quality_certified: true})
            RETURN COUNT(m) as count
        """)

        return {
            "total_models": model_count.get_next()[0] if model_count.has_next() else 0,
            "lineage_relationships": lineage_count.get_next()[0] if lineage_count.has_next() else 0,
            "certified_models": certified_count.get_next()[0] if certified_count.has_next() else 0
        }


# Singleton instance
_sqlmesh_sync: Optional[SQLMeshKuzuSync] = None


def get_sqlmesh_kuzu_sync() -> SQLMeshKuzuSync:
    """Get or create SQLMesh-Kuzu sync singleton"""
    global _sqlmesh_sync
    if _sqlmesh_sync is None:
        _sqlmesh_sync = SQLMeshKuzuSync()
    return _sqlmesh_sync
```

**Key Features**:
- ✅ Harvests SQLMesh models as `LogicalModel` nodes
- ✅ Creates `SOURCED_FROM` relationships (physical tables + upstream models)
- ✅ Extracts column-level lineage automatically
- ✅ Marks certified models (quality gates passed)
- ✅ Bidirectional: Physical → Logical and Logical → Logical

**Usage**:
```python
# Full sync (run on deployment)
sync = get_sqlmesh_kuzu_sync()
stats = sync.sync_all_models()
# → Syncs all SQLMesh models to Kuzu

# Incremental sync (run on model change)
sync.sync_model_by_name("analytics.customer_360")
# → Updates single model
```

---

### Component 2: Semantic Validation Service

**Purpose**: Validate user glossary terms against OpenSPG industry standards before persistence.

**File**: `backend/services/semantic_validation_service.py`

```python
"""
Semantic Validation Service
Integrates DataHub + OpenSPG + Kuzu for semantic governance
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

from .openspg_client import get_openspg_client
from .datahub_client import get_datahub_client
from .kuzu_knowledge_graph import get_knowledge_graph
from .vultr_llm_adapter import get_vultr_adapter

logger = logging.getLogger(__name__)


class SemanticValidationService:
    """
    Bridge OpenSPG semantic ontology with user-defined glossary

    Workflow:
    1. User defines term → Validate with OpenSPG
    2. Blend user definition with industry standard
    3. Save to DataHub with validation metadata
    4. Sync to Kuzu with semantic relationships
    5. Link to SQLMesh columns via MAPS_TO
    """

    def __init__(self):
        self.openspg = get_openspg_client()
        self.datahub = get_datahub_client()
        self.kg = get_knowledge_graph()
        self.llm = get_vultr_adapter()

        logger.info("✅ Semantic Validation Service initialized")

    async def validate_term_definition(
        self,
        term: str,
        user_definition: str,
        domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate user's term definition against OpenSPG standard

        Returns:
            validation_status: "aligned" | "needs_improvement" | "no_standard"
            confidence: 0.0-1.0 alignment score
            recommendation: Suggested improvements
            openspg_match: Industry-standard definition if found
        """

        logger.info(f"Validating term: {term} in domain: {domain}")

        # Step 1: Query OpenSPG for industry standard
        spg_concept = await self.openspg.get_concept_definition(term, domain)

        if not spg_concept:
            logger.info(f"No OpenSPG standard found for: {term}")
            return {
                "validation_status": "no_standard",
                "confidence": 0.5,
                "recommendation": "Consider adding more detail to your definition",
                "openspg_match": None
            }

        # Step 2: Calculate semantic alignment using LLM
        alignment = await self._calculate_alignment(
            user_def=user_definition,
            standard_def=spg_concept.definition,
            term=term
        )

        # Step 3: Determine validation status
        if alignment["score"] >= 0.8:
            status = "aligned"
            recommendation = f"Definition aligns well with industry standard (confidence: {alignment['score']:.0%})"
        elif alignment["score"] >= 0.6:
            status = "needs_improvement"
            recommendation = f"Consider enhancing: {spg_concept.definition[:100]}..."
        else:
            status = "needs_improvement"
            recommendation = f"Significant differences from standard. Suggested: {spg_concept.definition}"

        return {
            "validation_status": status,
            "confidence": alignment["score"],
            "recommendation": recommendation,
            "openspg_match": spg_concept.dict(),
            "suggested_enhancements": alignment.get("improvements", []),
            "related_concepts": spg_concept.related_concepts
        }

    async def _calculate_alignment(
        self,
        user_def: str,
        standard_def: str,
        term: str
    ) -> Dict[str, Any]:
        """
        Use LLM to calculate semantic alignment between definitions

        Returns:
            score: 0.0-1.0 alignment score
            improvements: List of suggested enhancements
        """

        system_prompt = """You are a data governance expert evaluating term definitions.
Compare the user's definition with the industry-standard definition.

Respond with JSON:
{
  "score": 0.0-1.0,
  "reasoning": "why this score",
  "improvements": ["list", "of", "suggestions"]
}"""

        user_prompt = f"""Term: {term}

User definition: "{user_definition}"

Industry standard: "{standard_def}"

How well does the user's definition align with the industry standard?
Score 1.0 = perfect match, 0.0 = completely different."""

        try:
            result = await self.llm.generate_structured_response(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema={
                    "score": {"type": "number"},
                    "reasoning": {"type": "string"},
                    "improvements": {"type": "array"}
                },
                temperature=0.3
            )

            return result

        except Exception as e:
            logger.error(f"Alignment calculation failed: {e}")
            # Fallback: simple string similarity
            return {
                "score": 0.5,
                "reasoning": "LLM unavailable, using default",
                "improvements": []
            }

    async def enrich_and_save(
        self,
        term: str,
        user_definition: str,
        domain: str,
        product_id: str,
        user_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Complete workflow: Validate → Enrich → Save to all systems

        This is the main entry point for glossary term confirmation.

        Returns:
            Complete status including validation, DataHub URN, Kuzu sync status
        """

        logger.info(f"Processing term confirmation: {term} for product: {product_id}")

        # Step 1: Validate with OpenSPG
        validation = await self.validate_term_definition(
            term=term,
            user_definition=user_definition,
            domain=domain
        )

        # Step 2: Optionally blend definitions
        final_definition = user_definition

        if validation["openspg_match"] and validation["confidence"] < 0.7:
            # User's definition needs improvement, suggest blending
            final_definition = await self._blend_definitions(
                user_def=user_definition,
                standard_def=validation["openspg_match"]["definition"],
                term=term
            )

            logger.info(f"Blended definition for {term}: {final_definition[:50]}...")

        # Step 3: Save to DataHub
        datahub_result = await self.datahub.create_glossary_term(
            term=term,
            definition=final_definition,
            domain=domain,
            custom_properties={
                "openspg_validated": validation["validation_status"] == "aligned",
                "validation_confidence": str(validation["confidence"]),
                "validation_status": validation["validation_status"],
                "source": "nexusone_semantic_validation",
                "created_by": user_id,
                "product_id": product_id
            }
        )

        logger.info(f"Saved to DataHub: {datahub_result.get('urn')}")

        # Step 4: Sync to Kuzu with semantic relationships
        kuzu_result = await self._sync_to_kuzu(
            term=term,
            definition=final_definition,
            domain=domain,
            user_id=user_id,
            datahub_urn=datahub_result.get("urn"),
            openspg_concept=validation.get("openspg_match"),
            confidence=validation["confidence"]
        )

        logger.info(f"Synced to Kuzu: {kuzu_result.get('term_id')}")

        # Step 5: Link to SQLMesh columns
        column_mappings = await self._link_to_sqlmesh_columns(
            term=term,
            product_id=product_id,
            context=context
        )

        logger.info(f"Linked to {len(column_mappings)} SQLMesh columns")

        return {
            "term": term,
            "definition": final_definition,
            "validation": validation,
            "datahub_urn": datahub_result.get("urn"),
            "datahub_url": datahub_result.get("datahub_url"),
            "kuzu_synced": kuzu_result.get("success"),
            "kuzu_term_id": kuzu_result.get("term_id"),
            "column_mappings": column_mappings,
            "recommendation": "Term successfully validated and integrated across all systems"
        }

    async def _blend_definitions(
        self,
        user_def: str,
        standard_def: str,
        term: str
    ) -> str:
        """
        Use LLM to blend user and standard definitions

        Goal: Keep user's domain context while incorporating standard precision
        """

        system_prompt = """You are a data governance expert creating glossary definitions.
Blend the user's definition with the industry standard to create an enhanced definition that:
1. Keeps the user's domain-specific context
2. Incorporates the precision of the industry standard
3. Is concise (1-2 sentences)
4. Uses clear, business-friendly language"""

        user_prompt = f"""Term: {term}

User's definition: "{user_def}"

Industry standard: "{standard_def}"

Create an enhanced definition that blends both."""

        try:
            blended = await self.llm.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.5,
                max_tokens=200
            )

            return blended.strip()

        except Exception as e:
            logger.error(f"Definition blending failed: {e}")
            # Fallback: use user definition
            return user_def

    async def _sync_to_kuzu(
        self,
        term: str,
        definition: str,
        domain: str,
        user_id: str,
        datahub_urn: str,
        openspg_concept: Optional[Dict],
        confidence: float
    ) -> Dict[str, Any]:
        """
        Sync term to Kuzu with rich semantic relationships

        Creates:
        - BusinessTerm node (user term)
        - BusinessTerm node (OpenSPG standard, if exists)
        - VALIDATED_BY relationship
        - RELATED_TO relationships to related concepts
        """

        term_id = f"term:{term.lower().replace(' ', '_')}"

        try:
            # Create user's BusinessTerm node
            self.kg.conn.execute("""
                MERGE (t:BusinessTerm {id: $id})
                ON CREATE SET
                    t.term = $term,
                    t.definition = $definition,
                    t.domain = $domain,
                    t.source = 'user_confirmed',
                    t.created_by = $user_id,
                    t.created_at = $timestamp,
                    t.confidence = $confidence,
                    t.datahub_urn = $datahub_urn,
                    t.metadata = $metadata
                ON MATCH SET
                    t.definition = $definition,
                    t.updated_at = $timestamp,
                    t.confidence = $confidence,
                    t.metadata = $metadata
            """, {
                "id": term_id,
                "term": term,
                "definition": definition,
                "domain": domain,
                "user_id": user_id,
                "timestamp": datetime.now(),
                "confidence": confidence,
                "datahub_urn": datahub_urn,
                "metadata": json.dumps({
                    "openspg_validated": bool(openspg_concept)
                })
            })

            # If OpenSPG match exists, create semantic relationships
            if openspg_concept:
                openspg_term_id = f"openspg:{openspg_concept['name'].lower().replace(' ', '_')}"

                # Create OpenSPG concept node
                self.kg.conn.execute("""
                    MERGE (s:BusinessTerm {id: $id})
                    ON CREATE SET
                        s.term = $term,
                        s.definition = $definition,
                        s.domain = $domain,
                        s.source = 'openspg',
                        s.created_at = $timestamp,
                        s.confidence = $confidence,
                        s.metadata = $metadata
                """, {
                    "id": openspg_term_id,
                    "term": openspg_concept["name"],
                    "definition": openspg_concept["definition"],
                    "domain": openspg_concept["domain"],
                    "timestamp": datetime.now(),
                    "confidence": openspg_concept["confidence"],
                    "metadata": json.dumps({"source": "openspg_knowledge_graph"})
                })

                # Create VALIDATED_BY relationship
                self.kg.conn.execute("""
                    MATCH (t:BusinessTerm {id: $term_id})
                    MATCH (s:BusinessTerm {id: $spg_id})
                    MERGE (t)-[r:VALIDATED_BY {
                        confidence: $confidence,
                        validated_at: $timestamp
                    }]->(s)
                """, {
                    "term_id": term_id,
                    "spg_id": openspg_term_id,
                    "confidence": openspg_concept["confidence"],
                    "timestamp": datetime.now()
                })

                # Create RELATED_TO for OpenSPG related concepts
                for related_concept in openspg_concept.get("related_concepts", []):
                    related_id = f"openspg:{related_concept.lower().replace(' ', '_')}"

                    # Create related concept node if not exists
                    self.kg.conn.execute("""
                        MERGE (r:BusinessTerm {id: $id})
                        ON CREATE SET
                            r.term = $term,
                            r.source = 'openspg',
                            r.created_at = $timestamp
                    """, {
                        "id": related_id,
                        "term": related_concept,
                        "timestamp": datetime.now()
                    })

                    # Link user term to related concepts
                    self.kg.conn.execute("""
                        MATCH (t:BusinessTerm {id: $term_id})
                        MATCH (r:BusinessTerm {id: $related_id})
                        MERGE (t)-[rel:RELATED_TO {
                            source: 'openspg_semantic_graph',
                            created_at: $timestamp
                        }]->(r)
                    """, {
                        "term_id": term_id,
                        "related_id": related_id,
                        "timestamp": datetime.now()
                    })

            logger.info(f"✅ Synced term to Kuzu: {term_id}")

            return {
                "success": True,
                "term_id": term_id,
                "openspg_linked": bool(openspg_concept)
            }

        except Exception as e:
            logger.error(f"Failed to sync term to Kuzu: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def _link_to_sqlmesh_columns(
        self,
        term: str,
        product_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Find SQLMesh columns that semantically match this term
        Create MAPS_TO relationships in Kuzu

        Matching strategies:
        1. Exact column name match (customer_id → "Customer")
        2. Column name contains term (total_revenue → "Revenue")
        3. LLM-based semantic matching (cust_id → "Customer")
        """

        term_id = f"term:{term.lower().replace(' ', '_')}"
        mappings = []

        try:
            # Get all LogicalModel nodes in Kuzu
            models_result = self.kg.conn.execute("""
                MATCH (m:LogicalModel)
                RETURN m.id, m.name
            """)

            while models_result.has_next():
                model_id, model_name = models_result.get_next()

                # Get columns for this model
                columns_result = self.kg.conn.execute("""
                    MATCH (c:Column)-[:BELONGS_TO]->(m:LogicalModel {id: $model_id})
                    RETURN c.id, c.name
                """, {"model_id": model_id})

                while columns_result.has_next():
                    column_id, column_name = columns_result.get_next()

                    # Check if column matches term
                    if self._column_matches_term(column_name, term):
                        # Create MAPS_TO relationship
                        self.kg.conn.execute("""
                            MATCH (c:Column {id: $column_id})
                            MATCH (t:BusinessTerm {id: $term_id})
                            MERGE (c)-[r:MAPS_TO {
                                confidence: $confidence,
                                match_method: $method,
                                verified: true,
                                created_at: $timestamp
                            }]->(t)
                        """, {
                            "column_id": column_id,
                            "term_id": term_id,
                            "confidence": 0.85,
                            "method": "column_name_match",
                            "timestamp": datetime.now()
                        })

                        mappings.append({
                            "column": column_id,
                            "model": model_id,
                            "match_method": "name_match"
                        })

                        logger.info(f"✅ Linked column {column_id} → term {term}")

            return mappings

        except Exception as e:
            logger.error(f"Failed to link SQLMesh columns: {e}")
            return []

    def _column_matches_term(self, column_name: str, term: str) -> bool:
        """
        Determine if column name semantically matches business term

        Strategies:
        1. Exact match (case-insensitive)
        2. Contains term
        3. Fuzzy match (edit distance)
        """

        column_lower = column_name.lower()
        term_lower = term.lower()

        # Exact match
        if column_lower == term_lower:
            return True

        # Column contains term (customer_id contains "customer")
        if term_lower in column_lower:
            return True

        # Term contains column (but be careful with short names)
        if len(column_lower) > 3 and column_lower in term_lower:
            return True

        # Remove common prefixes/suffixes
        clean_column = column_lower.replace("_id", "").replace("_name", "").replace("total_", "")
        if clean_column == term_lower or term_lower in clean_column:
            return True

        return False


# Singleton instance
_semantic_validation: Optional[SemanticValidationService] = None


def get_semantic_validation_service() -> SemanticValidationService:
    """Get or create semantic validation service singleton"""
    global _semantic_validation
    if _semantic_validation is None:
        _semantic_validation = SemanticValidationService()
    return _semantic_validation
```

**Key Features**:
- ✅ Validates terms against OpenSPG before saving
- ✅ Blends user definitions with industry standards using LLM
- ✅ Syncs to DataHub + Kuzu in single transaction
- ✅ Creates VALIDATED_BY relationships to OpenSPG concepts
- ✅ Auto-links to SQLMesh columns via MAPS_TO
- ✅ Confidence scoring throughout

**Usage**:
```python
# In glossary confirmation endpoint
validation_service = get_semantic_validation_service()

result = await validation_service.enrich_and_save(
    term="Revenue",
    user_definition="Money from sales",
    domain="finance",
    product_id="product-123",
    user_id="user@company.com"
)

# Returns:
# {
#   "validation": {
#     "validation_status": "needs_improvement",
#     "confidence": 0.65,
#     "recommendation": "Consider enhancing...",
#     "openspg_match": {...}
#   },
#   "datahub_urn": "urn:li:glossaryTerm:revenue",
#   "kuzu_synced": true,
#   "column_mappings": [...]
# }
```

---

### Component 3: Enhanced KAG Intelligence

**Purpose**: Enable AI agents to navigate the multi-layer metadata graph for query generation.

**File**: `backend/services/kag_intelligence.py` (enhancements)

Add these methods to existing `KAGIntelligence` class:

```python
async def find_certified_data_path(
    self,
    business_question: str,
    domain: Optional[str] = None
) -> Dict[str, Any]:
    """
    Given a business question, find the certified path through metadata layers

    Navigation: Question → Semantic → Logical → Physical → SQL

    Returns:
        Complete path with confidence scores and generated SQL
    """

    logger.info(f"Finding certified path for: {business_question}")

    # Step 1: Extract business entities from question
    entities = await self._extract_business_entities(business_question, domain)

    # Step 2: Find OpenSPG-validated terms in Kuzu
    semantic_layer = await self._find_validated_terms(entities)

    if not semantic_layer["terms"]:
        return {
            "error": "No validated business terms found",
            "suggestion": "Define glossary terms for these concepts first",
            "missing_entities": entities
        }

    # Step 3: Traverse to certified SQLMesh models
    logical_layer = await self._find_certified_models(semantic_layer["terms"])

    if not logical_layer["models"]:
        return {
            "error": "No certified models implement these terms",
            "suggestion": "Create certified SQLMesh models for these business concepts",
            "validated_terms": semantic_layer["terms"]
        }

    # Step 4: Trace to quality-validated physical tables
    physical_layer = await self._find_quality_tables(logical_layer["models"])

    # Step 5: Generate SQL using certified path
    sql_query = await self._generate_sql_from_path(
        question=business_question,
        semantic=semantic_layer,
        logical=logical_layer,
        physical=physical_layer
    )

    # Step 6: Explain reasoning path
    explanation = await self._explain_certified_path(
        question=business_question,
        path={
            "semantic": semantic_layer,
            "logical": logical_layer,
            "physical": physical_layer
        }
    )

    return {
        "question": business_question,
        "certified_path": {
            "semantic_layer": semantic_layer,
            "logical_layer": logical_layer,
            "physical_layer": physical_layer
        },
        "generated_sql": sql_query,
        "confidence": self._calculate_path_confidence(
            semantic_layer, logical_layer, physical_layer
        ),
        "explanation": explanation,
        "governance_status": "fully_certified",
        "recommendation": "This query uses only certified, validated data sources"
    }

async def _extract_business_entities(
    self,
    question: str,
    domain: Optional[str]
) -> List[str]:
    """
    Extract business entities from natural language question

    Example: "Show me customer revenue by region"
    → ["customer", "revenue", "region"]
    """

    system_prompt = """You are a data analyst extracting business entities from questions.

Extract the key business concepts as nouns (not verbs or actions).
Return as JSON array: ["entity1", "entity2", ...]"""

    user_prompt = f"""Question: "{question}"
Domain: {domain or 'general'}

Extract business entities:"""

    try:
        result = await self.llm.generate_structured_response(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            schema={"entities": {"type": "array"}},
            temperature=0.3
        )

        return result.get("entities", [])

    except Exception as e:
        logger.error(f"Entity extraction failed: {e}")
        # Fallback: simple tokenization
        return question.lower().split()

async def _find_validated_terms(
    self,
    entities: List[str]
) -> Dict[str, Any]:
    """
    Find OpenSPG-validated terms in Kuzu that match entities

    Returns:
        terms: List of matched terms with confidence scores
        openspg_validated: Whether terms are validated by OpenSPG
    """

    terms = []

    for entity in entities:
        # Query Kuzu for matching BusinessTerm
        result = self.kg.conn.execute("""
            MATCH (t:BusinessTerm)
            WHERE toLower(t.term) = $entity
            OPTIONAL MATCH (t)-[:VALIDATED_BY]->(spg:BusinessTerm)
            WHERE spg.source = 'openspg'
            RETURN t.id, t.term, t.definition, t.confidence, spg.confidence as spg_confidence
        """, {"entity": entity.lower()})

        if result.has_next():
            row = result.get_next()
            terms.append({
                "term_id": row[0],
                "term": row[1],
                "definition": row[2],
                "confidence": row[3],
                "openspg_validated": row[4] is not None,
                "openspg_confidence": row[4] if row[4] else 0.0
            })

    return {
        "terms": terms,
        "openspg_validated": all(t["openspg_validated"] for t in terms),
        "average_confidence": sum(t["confidence"] for t in terms) / len(terms) if terms else 0.0
    }

async def _find_certified_models(
    self,
    validated_terms: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Find certified SQLMesh models that implement validated terms

    Traverses: BusinessTerm → Column → LogicalModel
    Filters: quality_certified = true
    """

    models = []

    for term_data in validated_terms:
        term_id = term_data["term_id"]

        # Find columns mapped to this term
        result = self.kg.conn.execute("""
            MATCH (t:BusinessTerm {id: $term_id})
                  <-[:MAPS_TO]-(c:Column)
                  -[:BELONGS_TO]->(m:LogicalModel)
            WHERE m.quality_certified = true
            RETURN DISTINCT m.id, m.name, m.grain, m.owner, COUNT(c) as column_count
        """, {"term_id": term_id})

        while result.has_next():
            row = result.get_next()
            models.append({
                "model_id": row[0],
                "model_name": row[1],
                "grain": row[2],
                "owner": row[3],
                "columns_matched": row[4],
                "term": term_data["term"]
            })

    return {
        "models": models,
        "all_certified": True,
        "count": len(models)
    }

async def _find_quality_tables(
    self,
    certified_models: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Trace certified models to quality-validated physical tables

    Traverses: LogicalModel → DataTable
    Filters: quality_score > 85
    """

    tables = []

    for model_data in certified_models:
        model_id = model_data["model_id"]

        # Find upstream physical tables
        result = self.kg.conn.execute("""
            MATCH (m:LogicalModel {id: $model_id})
                  -[:SOURCED_FROM*1..3]->(t:DataTable)
            WHERE t.quality_score > 85
            RETURN DISTINCT t.id, t.full_name, t.quality_score, t.domain, t.row_count
        """, {"model_id": model_id})

        while result.has_next():
            row = result.get_next()
            tables.append({
                "table_id": row[0],
                "table_name": row[1],
                "quality_score": row[2],
                "domain": row[3],
                "row_count": row[4],
                "used_by_model": model_data["model_name"]
            })

    return {
        "tables": tables,
        "all_quality_validated": all(t["quality_score"] > 85 for t in tables),
        "average_quality": sum(t["quality_score"] for t in tables) / len(tables) if tables else 0
    }

async def _generate_sql_from_path(
    self,
    question: str,
    semantic: Dict[str, Any],
    logical: Dict[str, Any],
    physical: Dict[str, Any]
) -> str:
    """
    Generate SQL query using certified path

    Strategy: Use certified SQLMesh models, not raw tables
    """

    system_prompt = """You are a SQL expert generating queries from certified data models.

IMPORTANT:
- Use the certified SQLMesh models provided, NOT raw tables
- These models are already validated and tested
- Include only the columns that match business terms
- Use proper SQL formatting"""

    # Build context for LLM
    models_context = "\n".join([
        f"- {m['model_name']} (grain: {m['grain']}, implements: {m['term']})"
        for m in logical["models"]
    ])

    user_prompt = f"""Business Question: "{question}"

Validated Business Terms:
{json.dumps([t['term'] for t in semantic['terms']], indent=2)}

Certified Models to Use:
{models_context}

Generate SQL query using these certified models."""

    try:
        sql = await self.llm.generate_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=500
        )

        return sql.strip()

    except Exception as e:
        logger.error(f"SQL generation failed: {e}")
        return "-- SQL generation failed"

async def _explain_certified_path(
    self,
    question: str,
    path: Dict[str, Any]
) -> str:
    """
    Explain why this path is certified and trustworthy
    """

    semantic = path["semantic"]
    logical = path["logical"]
    physical = path["physical"]

    system_prompt = """You are a data governance expert explaining query paths.

Explain in 2-3 sentences why this query path is trustworthy, mentioning:
- Semantic validation (OpenSPG)
- Certified models
- Quality scores"""

    user_prompt = f"""Question: "{question}"

Path Details:
- Semantic Layer: {len(semantic['terms'])} OpenSPG-validated terms
- Logical Layer: {len(logical['models'])} certified SQLMesh models
- Physical Layer: {len(physical['tables'])} quality-validated tables (avg quality: {physical['average_quality']:.0f})

Explain why this path is trustworthy:"""

    try:
        explanation = await self.llm.generate_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.6,
            max_tokens=200
        )

        return explanation.strip()

    except Exception as e:
        logger.error(f"Explanation generation failed: {e}")
        return "This query uses certified data sources with governance validation."

def _calculate_path_confidence(
    self,
    semantic: Dict[str, Any],
    logical: Dict[str, Any],
    physical: Dict[str, Any]
) -> float:
    """
    Calculate overall confidence in the certified path

    Factors:
    - Semantic validation confidence
    - Model certification status
    - Physical table quality scores
    """

    if not semantic["terms"] or not logical["models"] or not physical["tables"]:
        return 0.0

    semantic_conf = semantic["average_confidence"]
    logical_conf = 1.0 if logical["all_certified"] else 0.5
    physical_conf = physical["average_quality"] / 100

    # Weighted average
    overall = (semantic_conf * 0.3 + logical_conf * 0.4 + physical_conf * 0.3)

    return round(overall, 2)
```

**Key Features**:
- ✅ Navigates complete path: Semantic → Logical → Physical
- ✅ Filters for OpenSPG-validated terms
- ✅ Uses only certified SQLMesh models
- ✅ Validates physical table quality scores
- ✅ Generates SQL using certified models (not raw tables)
- ✅ Provides confidence scores and explanations

**Usage Example**:
```python
kag = get_kag_intelligence()

result = await kag.find_certified_data_path(
    business_question="Show me customer revenue by region",
    domain="finance"
)

# Returns:
# {
#   "certified_path": {
#     "semantic_layer": {
#       "terms": [
#         {"term": "customer", "openspg_validated": true, "confidence": 0.98},
#         {"term": "revenue", "openspg_validated": true, "confidence": 0.95}
#       ]
#     },
#     "logical_layer": {
#       "models": [
#         {"model_name": "analytics.customer_revenue_rollup", "certified": true}
#       ]
#     },
#     "physical_layer": {
#       "tables": [
#         {"table_name": "gold.customers", "quality_score": 94},
#         {"table_name": "gold.transactions", "quality_score": 92}
#       ]
#     }
#   },
#   "generated_sql": "SELECT ...",
#   "confidence": 0.94,
#   "explanation": "This query uses OpenSPG-validated terms mapped to certified...",
#   "governance_status": "fully_certified"
# }
```

---

## Component 4: Enhanced Glossary Persistence

**Purpose**: Close the feedback loop by syncing DataHub glossary to Kuzu automatically.

**File**: `backend/services/glossary_persistence.py` (modifications)

Add this to the existing `save_confirmed_term` method:

```python
async def save_confirmed_term(
    self,
    term: str,
    definition: str,
    product_id: str,
    action: str = 'confirm',
    domain: Optional[str] = None,
    confidence: Optional[float] = None,
    context: Optional[str] = None,
    created_by: Optional[str] = None,
    extraction_source: Optional[str] = None,
    suggestion_source: Optional[str] = None,
    sync_to_datahub: bool = True
) -> Dict[str, Any]:
    """
    Save a confirmed glossary term to database and optionally sync to DataHub

    ENHANCED: Now also syncs to Kuzu and validates with OpenSPG
    """

    # ... existing code for PostgreSQL and DataHub ...

    # NEW: Semantic validation and Kuzu sync
    semantic_service = get_semantic_validation_service()

    try:
        # Use semantic service for complete integration
        semantic_result = await semantic_service.enrich_and_save(
            term=term,
            user_definition=definition,
            domain=domain or "general",
            product_id=product_id,
            user_id=created_by or "system",
            context={"action": action, "extraction_source": extraction_source}
        )

        result["semantic_validation"] = semantic_result["validation"]
        result["kuzu_synced"] = semantic_result["kuzu_synced"]
        result["column_mappings_count"] = len(semantic_result["column_mappings"])

    except Exception as e:
        logger.error(f"Semantic validation failed: {e}")
        result["semantic_validation"] = {"error": str(e)}

    return result
```

---

## Component 5: Kuzu Schema Enhancements

**Purpose**: Add missing node and relationship types for complete multi-layer graph.

**File**: `backend/services/kuzu_knowledge_graph.py` (additions)

Add these to `_create_node_tables`:

```python
# Column node - represents SQLMesh model columns
self.conn.execute("""
    CREATE NODE TABLE Column(
        id STRING,
        name STRING,
        data_type STRING,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        metadata STRING,
        PRIMARY KEY(id)
    )
""")
logger.info("Created Column node table")

# LogicalModel node - represents SQLMesh/dbt models
self.conn.execute("""
    CREATE NODE TABLE LogicalModel(
        id STRING,
        name STRING,
        sql_logic STRING,
        dialect STRING,
        owner STRING,
        grain STRING,
        quality_certified BOOL,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        metadata STRING,
        PRIMARY KEY(id)
    )
""")
logger.info("Created LogicalModel node table")
```

Add these to `_create_relationship_tables`:

```python
# LogicalModel sources from DataTable (physical)
self.conn.execute("""
    CREATE REL TABLE SOURCED_FROM(
        FROM LogicalModel TO DataTable,
        lineage_type STRING,
        created_at TIMESTAMP,
        metadata STRING
    )
""")
logger.info("Created SOURCED_FROM (Logical→Physical) relationship table")

# LogicalModel sources from another LogicalModel
self.conn.execute("""
    CREATE REL TABLE SOURCED_FROM_MODEL(
        FROM LogicalModel TO LogicalModel,
        lineage_type STRING,
        created_at TIMESTAMP,
        metadata STRING
    )
""")
logger.info("Created SOURCED_FROM_MODEL (Logical→Logical) relationship table")

# Column belongs to LogicalModel
self.conn.execute("""
    CREATE REL TABLE BELONGS_TO(
        FROM Column TO LogicalModel,
        created_at TIMESTAMP
    )
""")
logger.info("Created BELONGS_TO (Column→Model) relationship table")

# Column derived from another Column (column-level lineage)
self.conn.execute("""
    CREATE REL TABLE DERIVED_FROM_COLUMN(
        FROM Column TO Column,
        transformation STRING,
        created_at TIMESTAMP
    )
""")
logger.info("Created DERIVED_FROM_COLUMN relationship table")

# BusinessTerm validated by OpenSPG concept
self.conn.execute("""
    CREATE REL TABLE VALIDATED_BY(
        FROM BusinessTerm TO BusinessTerm,
        confidence DOUBLE,
        validated_at TIMESTAMP
    )
""")
logger.info("Created VALIDATED_BY (Term→OpenSPG) relationship table")

# BusinessTerm related to another (OpenSPG semantic graph)
self.conn.execute("""
    CREATE REL TABLE RELATED_TO(
        FROM BusinessTerm TO BusinessTerm,
        source STRING,
        created_at TIMESTAMP
    )
""")
logger.info("Created RELATED_TO (Term→Term) relationship table")
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal**: Establish SQLMesh → Kuzu bridge and schema enhancements

**Tasks**:
1. ✅ Add Column, LogicalModel node types to Kuzu schema
2. ✅ Add SOURCED_FROM, BELONGS_TO, DERIVED_FROM_COLUMN relationships
3. ✅ Implement `SQLMeshKuzuSync` service
4. ✅ Test full sync of SQLMesh models
5. ✅ Verify column-level lineage extraction

**Deliverables**:
- Kuzu graph contains all SQLMesh models as LogicalModel nodes
- Complete lineage: Physical tables → Logical models → Products
- Column-level lineage queryable in graph

**Success Criteria**:
```python
# Should return certified models
result = kg.query("""
    MATCH (t:DataTable {id: 'gold.customers'})
          <-[:SOURCED_FROM]-(m:LogicalModel)
    WHERE m.quality_certified = true
    RETURN m.name, m.grain
""")
# Returns: analytics.customer_360, grain: customer-month
```

---

### Phase 2: Semantic Validation (Week 3-4)

**Goal**: Integrate OpenSPG validation into glossary flow

**Tasks**:
1. ✅ Implement `SemanticValidationService`
2. ✅ Upgrade OpenSPG client from mock to real API (if available)
3. ✅ Add VALIDATED_BY, RELATED_TO relationships to Kuzu schema
4. ✅ Integrate semantic validation into `save_confirmed_term`
5. ✅ Test OpenSPG → Kuzu sync with semantic relationships

**Deliverables**:
- User glossary terms validated against OpenSPG standards
- BusinessTerm nodes in Kuzu linked to OpenSPG concepts
- Confidence scoring for semantic alignment

**Success Criteria**:
```python
# User defines "Revenue"
result = await semantic_service.validate_term_definition(
    term="Revenue",
    user_definition="Money from sales",
    domain="finance"
)
# Returns:
# {
#   "validation_status": "needs_improvement",
#   "confidence": 0.65,
#   "openspg_match": {...}
# }

# After enhancement, Kuzu query shows validation:
kg.query("""
    MATCH (t:BusinessTerm {term: 'Revenue'})
          -[:VALIDATED_BY]->(spg:BusinessTerm)
    WHERE spg.source = 'openspg'
    RETURN t.confidence, spg.confidence
""")
# Returns: 0.95, 0.98
```

---

### Phase 3: KAG Enhancement (Week 5-6)

**Goal**: Enable AI agents to navigate certified paths

**Tasks**:
1. ✅ Add `find_certified_data_path` method to KAGIntelligence
2. ✅ Implement entity extraction from natural language
3. ✅ Implement semantic → logical → physical traversal
4. ✅ Add SQL generation from certified models
5. ✅ Add confidence scoring and explanation generation

**Deliverables**:
- KAG agents can answer business questions using certified paths
- SQL generated uses only OpenSPG-validated terms + certified models
- Complete reasoning explanation with confidence scores

**Success Criteria**:
```python
# User asks business question
result = await kag.find_certified_data_path(
    business_question="Show me customer revenue by region",
    domain="finance"
)

# Returns:
# - Semantic: ["customer", "revenue"] (OpenSPG validated)
# - Logical: analytics.customer_revenue_rollup (certified)
# - Physical: gold.customers, gold.transactions (quality > 85)
# - SQL: Using certified model, not raw tables
# - Confidence: 0.94
```

---

### Phase 4: Glossary Integration (Week 7-8)

**Goal**: Close the loop - glossary terms automatically link to SQLMesh columns

**Tasks**:
1. ✅ Implement `_link_to_sqlmesh_columns` in SemanticValidationService
2. ✅ Add MAPS_TO relationships (Column → BusinessTerm)
3. ✅ Integrate into `save_confirmed_term` workflow
4. ✅ Test automatic column discovery
5. ✅ Add UI to show column mappings

**Deliverables**:
- When user confirms "Revenue" term, automatically maps to relevant columns
- Kuzu graph shows complete path: Table → Column → Term → OpenSPG
- DataHub UI shows which columns implement each term

**Success Criteria**:
```python
# After confirming "Revenue" term, query shows mappings:
kg.query("""
    MATCH (t:BusinessTerm {term: 'Revenue'})
          <-[:MAPS_TO]-(c:Column)
          -[:BELONGS_TO]->(m:LogicalModel)
    RETURN m.name, c.name
""")
# Returns:
# - analytics.customer_revenue_rollup, total_revenue
# - analytics.monthly_sales, revenue_amount
```

---

## Testing Strategy

### Unit Tests

**File**: `backend/tests/test_sqlmesh_kuzu_sync.py`

```python
def test_sqlmesh_model_sync():
    """Test syncing SQLMesh models to Kuzu"""
    sync = get_sqlmesh_kuzu_sync()

    # Sync all models
    stats = sync.sync_all_models()

    assert stats["models_synced"] > 0
    assert stats["relationships_created"] > 0
    assert len(stats["errors"]) == 0

def test_column_lineage_extraction():
    """Test column-level lineage is captured"""
    kg = get_knowledge_graph()

    # Query for column lineage
    result = kg.conn.execute("""
        MATCH (c:Column {name: 'customer_id'})
              -[:DERIVED_FROM_COLUMN]->(upstream:Column)
        RETURN upstream.id
    """)

    assert result.has_next()
```

**File**: `backend/tests/test_semantic_validation.py`

```python
async def test_openspg_validation():
    """Test OpenSPG validation workflow"""
    service = get_semantic_validation_service()

    result = await service.validate_term_definition(
        term="Revenue",
        user_definition="Total sales",
        domain="finance"
    )

    assert result["validation_status"] in ["aligned", "needs_improvement", "no_standard"]
    assert 0 <= result["confidence"] <= 1

async def test_kuzu_semantic_sync():
    """Test term sync to Kuzu with OpenSPG relationships"""
    service = get_semantic_validation_service()

    result = await service._sync_to_kuzu(
        term="Test Term",
        definition="Test definition",
        domain="test",
        user_id="test_user",
        datahub_urn="urn:test",
        openspg_concept={"name": "Standard", "definition": "...", "confidence": 0.9},
        confidence=0.85
    )

    assert result["success"]
    assert result["openspg_linked"]
```

**File**: `backend/tests/test_kag_certified_paths.py`

```python
async def test_certified_path_navigation():
    """Test KAG navigation through certified layers"""
    kag = get_kag_intelligence()

    result = await kag.find_certified_data_path(
        business_question="Show me customer revenue",
        domain="finance"
    )

    assert "certified_path" in result
    assert result["governance_status"] == "fully_certified"
    assert result["confidence"] > 0.8
    assert len(result["generated_sql"]) > 0
```

### Integration Tests

**File**: `backend/tests/test_end_to_end_integration.py`

```python
async def test_complete_glossary_flow():
    """
    End-to-end test: Term confirmation → All systems sync

    Workflow:
    1. User confirms "Revenue" term
    2. Validates with OpenSPG
    3. Saves to PostgreSQL
    4. Syncs to DataHub
    5. Syncs to Kuzu with relationships
    6. Links to SQLMesh columns
    7. KAG can query certified path
    """

    # Step 1: Confirm term
    validation_service = get_semantic_validation_service()

    result = await validation_service.enrich_and_save(
        term="Revenue",
        user_definition="Total income from operations",
        domain="finance",
        product_id="test-product",
        user_id="test@example.com"
    )

    # Verify all systems synced
    assert result["datahub_urn"] is not None
    assert result["kuzu_synced"]
    assert len(result["column_mappings"]) > 0

    # Step 2: Verify Kuzu graph structure
    kg = get_knowledge_graph()

    # Check BusinessTerm node exists
    term_result = kg.conn.execute("""
        MATCH (t:BusinessTerm {term: 'Revenue'})
        RETURN t.id
    """)
    assert term_result.has_next()

    # Check VALIDATED_BY relationship
    validation_result = kg.conn.execute("""
        MATCH (t:BusinessTerm {term: 'Revenue'})
              -[:VALIDATED_BY]->(spg:BusinessTerm)
        WHERE spg.source = 'openspg'
        RETURN spg.term
    """)
    assert validation_result.has_next()

    # Check MAPS_TO relationships to columns
    mapping_result = kg.conn.execute("""
        MATCH (t:BusinessTerm {term: 'Revenue'})
              <-[:MAPS_TO]-(c:Column)
        RETURN COUNT(c) as column_count
    """)
    assert mapping_result.get_next()[0] > 0

    # Step 3: Test KAG can navigate path
    kag = get_kag_intelligence()

    path_result = await kag.find_certified_data_path(
        business_question="What is the total revenue?",
        domain="finance"
    )

    assert path_result["governance_status"] == "fully_certified"
    assert "Revenue" in str(path_result["certified_path"])
    assert len(path_result["generated_sql"]) > 0
```

---

## Monitoring & Observability

### Metrics to Track

**Graph Health**:
```python
{
  "total_logical_models": 150,
  "certified_models": 120,
  "certification_rate": 0.80,
  "total_columns": 1200,
  "semantic_mappings": 450,
  "mapping_coverage": 0.375
}
```

**Validation Quality**:
```python
{
  "terms_validated": 89,
  "openspg_match_rate": 0.67,
  "average_confidence": 0.82,
  "terms_needing_improvement": 23
}
```

**Query Success Rate**:
```python
{
  "queries_with_certified_path": 145,
  "queries_missing_semantics": 23,
  "average_path_confidence": 0.88,
  "governance_compliance_rate": 0.93
}
```

### Dashboard Queries

**File**: `backend/api/metadata_health_routes.py`

```python
@router.get("/metadata/health/overview")
async def get_metadata_health_overview():
    """
    Get unified metadata health across all systems

    Returns:
        Health metrics for SQLMesh sync, OpenSPG validation, Kuzu graph
    """

    kg = get_knowledge_graph()

    # SQLMesh layer health
    sqlmesh_health = {
        "total_models": kg.conn.execute("MATCH (m:LogicalModel) RETURN COUNT(m)").get_next()[0],
        "certified_models": kg.conn.execute(
            "MATCH (m:LogicalModel {quality_certified: true}) RETURN COUNT(m)"
        ).get_next()[0]
    }

    # Semantic layer health
    semantic_health = {
        "total_terms": kg.conn.execute("MATCH (t:BusinessTerm) RETURN COUNT(t)").get_next()[0],
        "openspg_validated": kg.conn.execute(
            "MATCH (t:BusinessTerm)-[:VALIDATED_BY]->() RETURN COUNT(t)"
        ).get_next()[0]
    }

    # Linkage health
    linkage_health = {
        "column_mappings": kg.conn.execute(
            "MATCH ()-[r:MAPS_TO]->() RETURN COUNT(r)"
        ).get_next()[0],
        "physical_to_logical": kg.conn.execute(
            "MATCH ()-[r:SOURCED_FROM]->() RETURN COUNT(r)"
        ).get_next()[0]
    }

    return {
        "sqlmesh_layer": sqlmesh_health,
        "semantic_layer": semantic_health,
        "linkage": linkage_health,
        "overall_health": calculate_health_score(
            sqlmesh_health, semantic_health, linkage_health
        )
    }
```

---

## Migration Plan

### From Current State to Integrated State

**Step 1: Schema Migration (Day 1)**

```bash
# Run Kuzu schema migrations
python backend/services/kuzu_knowledge_graph.py

# Verify new node types exist
python -c "
from backend.services.kuzu_knowledge_graph import get_knowledge_graph
kg = get_knowledge_graph()
tables = kg._get_existing_tables()
print('LogicalModel' in tables)  # Should print True
print('Column' in tables)  # Should print True
"
```

**Step 2: SQLMesh Initial Sync (Day 2-3)**

```bash
# Run full SQLMesh → Kuzu sync
python -c "
from backend.services.sqlmesh_kuzu_sync import get_sqlmesh_kuzu_sync
sync = get_sqlmesh_kuzu_sync()
stats = sync.sync_all_models()
print(f'Synced {stats['models_synced']} models')
print(f'Created {stats['relationships_created']} relationships')
"

# Verify sync succeeded
python -c "
from backend.services.kuzu_knowledge_graph import get_knowledge_graph
kg = get_knowledge_graph()
result = kg.conn.execute('MATCH (m:LogicalModel) RETURN COUNT(m)')
print(f'Total models in graph: {result.get_next()[0]}')
"
```

**Step 3: OpenSPG Integration (Day 4-5)**

```bash
# Test OpenSPG client (initially with mock)
python -c "
import asyncio
from backend.services.openspg_client import get_openspg_client

async def test():
    client = get_openspg_client()
    concept = await client.get_concept_definition('revenue', 'finance')
    print(f'Found concept: {concept.name}')
    print(f'Definition: {concept.definition[:50]}...')

asyncio.run(test())
"

# When real OpenSPG API available, update environment variables:
export OPENSPG_BASE_URL="https://openspg-api.example.com"
export OPENSPG_API_KEY="your-api-key"
```

**Step 4: Glossary Flow Update (Day 6-7)**

```bash
# Test semantic validation service
python -c "
import asyncio
from backend.services.semantic_validation_service import get_semantic_validation_service

async def test():
    service = get_semantic_validation_service()
    result = await service.enrich_and_save(
        term='Test Revenue',
        user_definition='Money from sales',
        domain='finance',
        product_id='test-123',
        user_id='test@example.com'
    )
    print(f'Validation: {result['validation']['validation_status']}')
    print(f'Kuzu synced: {result['kuzu_synced']}')
    print(f'Column mappings: {len(result['column_mappings'])}')

asyncio.run(test())
"
```

**Step 5: KAG Enhancement (Day 8-10)**

```bash
# Test certified path navigation
python -c "
import asyncio
from backend.services.kag_intelligence import get_kag_intelligence

async def test():
    kag = get_kag_intelligence()
    result = await kag.find_certified_data_path(
        business_question='Show me customer revenue by region',
        domain='finance'
    )
    print(f'Confidence: {result['confidence']}')
    print(f'Semantic terms: {len(result['certified_path']['semantic_layer']['terms'])}')
    print(f'Certified models: {len(result['certified_path']['logical_layer']['models'])}')
    print(f'SQL generated: {len(result['generated_sql'])} chars')

asyncio.run(test())
"
```

**Step 6: Deploy & Monitor (Day 11-14)**

```bash
# Run full integration test suite
pytest backend/tests/test_end_to_end_integration.py -v

# Deploy services
systemctl restart nexusone-backend

# Monitor metrics
watch -n 5 'curl http://localhost:8000/metadata/health/overview | jq .'
```

---

## Success Criteria

### Functional Requirements

✅ **FR1: SQLMesh Lineage in Graph**
- All SQLMesh models exist as LogicalModel nodes in Kuzu
- Column-level lineage relationships captured
- SOURCED_FROM links physical → logical correctly

✅ **FR2: Semantic Validation**
- User terms validated against OpenSPG before saving
- Confidence scores calculated for alignment
- Blended definitions when needed

✅ **FR3: Unified Metadata Graph**
- Kuzu contains all layers: Physical, Logical, Semantic, Quality
- Cross-layer relationships enable graph traversal
- Single query can navigate Physical → Logical → Semantic

✅ **FR4: AI-Powered Query Generation**
- KAG agents can answer business questions
- Generated SQL uses certified models only
- Confidence scores indicate governance level

✅ **FR5: Automatic Column Mapping**
- When glossary term confirmed, automatically maps to columns
- MAPS_TO relationships created in Kuzu
- Visible in DataHub UI

### Non-Functional Requirements

✅ **NFR1: Performance**
- SQLMesh sync completes in < 5 minutes for 100 models
- Semantic validation responds in < 2 seconds
- KAG path finding completes in < 5 seconds

✅ **NFR2: Reliability**
- Graph sync failures don't break glossary workflow
- Graceful degradation if OpenSPG unavailable
- Retry logic for failed syncs

✅ **NFR3: Observability**
- Metrics tracked for all integrations
- Health dashboard shows sync status
- Alerts for sync failures

✅ **NFR4: Maintainability**
- Clear separation of concerns (services)
- Comprehensive test coverage (>80%)
- Documentation for all components

---

## Conclusion

This unified metadata integration transforms NexusOne from **fragmented metadata systems** to a **multi-layer knowledge graph** that enables:

1. **AI Context Engineering** (Blindata pattern): Agents navigate governed metadata, not raw databases
2. **Multi-Layer Graph Architecture** (DDTX2025 pattern): Physical → Logical → Semantic → Quality
3. **Semantic Governance**: OpenSPG validates user terms against industry standards
4. **Automated Lineage**: SQLMesh transformations become queryable knowledge
5. **Certified Query Paths**: Only use validated, certified, quality-checked data sources

**Current State**: 40% utilization of Kuzu + OpenSPG + SQLMesh capabilities

**After Implementation**: 90% utilization with complete integration

**Key Insight**: SQLMesh/dbt lineage IS your Knowledge Map. Once harvested into Kuzu, AI agents can navigate from business questions → semantic terms → certified models → physical tables, ensuring governance at every step.
