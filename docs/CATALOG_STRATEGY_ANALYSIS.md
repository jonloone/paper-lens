# Catalog Strategy Analysis: Unity Catalog vs DataHub
## Strategic Recommendation for NexusOne's Multi-Layer Graph Architecture

**Date**: October 10, 2025
**Question**: Should we use Unity Catalog for unstructured support? DataHub + something else? Or move to Unity Catalog entirely?
**Context**: Business-first data products, multi-layer graph, tool-agnostic orchestration

---

## Executive Summary

**Recommendation**: **Keep DataHub + Add Unity Catalog for Volumes**

**Rationale**:
- DataHub is your **metadata hub** (graph-based, active metadata, 75+ connectors)
- Unity Catalog is your **access control + unstructured storage** (Volumes, governance, Iceberg REST API)
- They solve **different problems** and complement each other perfectly
- This aligns with DataHub's "Catalog of Catalogs" positioning

**Architecture**:
```
NexusOne Multi-Layer Graph (Kuzu)
  ↓ Bidirectional sync
DataHub (Metadata Hub)
  ↓ Federates metadata from
Unity Catalog (Volumes + Governance) + Gravitino (Multi-catalog) + Hive/Iceberg (Tables)
```

---

## Part 1: Detailed Comparison

### Unity Catalog

**Strengths for Your Needs**:
1. ✅ **Volumes for Unstructured Data**: Native support for images, documents, logs, videos
2. ✅ **Unified Governance**: Single access control model across structured + unstructured
3. ✅ **Iceberg REST Catalog API**: Standard interface, tool-agnostic
4. ✅ **AI/ML-Specific**: Models, functions, AI assets as first-class citizens
5. ✅ **Delta Sharing**: Cross-domain data sharing protocol
6. ✅ **Multi-format**: Delta, Iceberg, Hudi, Parquet, CSV, JSON

**Weaknesses for Your Needs**:
1. ❌ **Limited Lineage**: Basic lineage only (not column-level)
2. ❌ **No Graph-Based Metadata**: Relational model, not graph
3. ❌ **Fewer Connectors**: ~5 query engines vs DataHub's 75+ integrations
4. ❌ **Limited Discovery**: Basic search, no semantic/intelligent search
5. ❌ **No Active Metadata**: Passive catalog, not proactive orchestration
6. ❌ **OSS Maturity**: Newer project, less community maturity than DataHub

**Best Use Cases**:
- **Access control** across structured + unstructured data
- **Storage management** for unstructured files (Volumes)
- **Governance** for AI/ML assets (models, functions)
- **Table catalog** with Iceberg REST API standard

---

### DataHub

**Strengths for Your Needs**:
1. ✅ **Graph-Based Metadata**: Perfect fit for your multi-layer graph architecture
2. ✅ **75+ Connectors**: Broadest integration ecosystem (SQLMesh, Airflow, Trino, Spark, Flink, etc.)
3. ✅ **Active Metadata**: Proactive orchestration, workflow automation
4. ✅ **Column-Level Lineage**: Granular transformation tracking
5. ✅ **Intelligent Search**: Semantic search, recommendations, AI-powered discovery
6. ✅ **"Catalog of Catalogs"**: Federates metadata from multiple sources
7. ✅ **Strong Community**: 45+ contributors, mature OSS project
8. ✅ **Business Glossary**: Built-in semantic layer for business terms

**Weaknesses for Your Needs**:
1. ❌ **No Native Unstructured Storage**: Catalogs metadata but doesn't store files
2. ❌ **No Access Control Enforcement**: Metadata only, not governance engine
3. ❌ **No Volumes Concept**: Can track file metadata but not manage storage

**Best Use Cases**:
- **Metadata hub** for federated catalogs
- **Lineage tracking** across all transformation tools
- **Discovery** with semantic/intelligent search
- **Business context** linking (glossary, ownership, tags)
- **Active orchestration** of metadata workflows

---

### Gravitino (Already in Your Stack)

**Strengths for Your Needs**:
1. ✅ **Multi-Catalog Federation**: Unifies Hive, Iceberg, Trino catalogs
2. ✅ **Tag-Based Management**: Flexible metadata organization
3. ✅ **REST API**: Standard interface for metadata access

**Weaknesses for Your Needs**:
1. ❌ **No Unstructured Support**: Tables only
2. ❌ **Limited Lineage**: Basic dependencies
3. ❌ **No Business Context**: Technical metadata only

**Best Use Cases**:
- **Federate existing table catalogs** (Hive, Iceberg, Trino)
- **Unified catalog API** for query engines

---

## Part 2: Strategic Analysis

### Option 1: DataHub Only ❌ **Not Recommended**

**Pros**:
- Single metadata platform
- Graph-based architecture fits your needs

**Cons**:
- ❌ No native unstructured data storage (Volumes)
- ❌ No access control enforcement
- ❌ You'd need to build unstructured storage separately anyway

**Verdict**: DataHub is metadata-first, not storage-first. You need storage for unstructured data.

---

### Option 2: Unity Catalog Only ❌ **Not Recommended**

**Pros**:
- Unified governance across structured + unstructured
- Volumes for unstructured data

**Cons**:
- ❌ No graph-based metadata (your core architecture)
- ❌ Limited lineage tracking (not column-level)
- ❌ Fewer integrations (5 query engines vs 75+ connectors)
- ❌ No active metadata capabilities
- ❌ Weaker discovery/search
- ❌ Would require rebuilding your multi-layer graph elsewhere

**Verdict**: Unity Catalog is storage + governance first, not metadata-first. Doesn't fit your graph architecture.

---

### Option 3: DataHub + Unity Catalog ✅ **RECOMMENDED**

**Architecture**:
```
Layer 1: Kuzu (Multi-Layer Knowledge Graph)
  - Business context (objectives, metrics, questions)
  - Logical models (SQLMesh lineage)
  - Physical tables (Iceberg metadata)
  - Entities (customer, product, transaction)
  - Documents (unstructured metadata)

Layer 2: DataHub (Metadata Hub)
  - Federates metadata from all sources
  - Provides graph-based API to Kuzu
  - Handles lineage extraction (SQLMesh, Airflow, Spark, Flink)
  - Enables intelligent search and discovery
  - Active metadata orchestration

Layer 3a: Unity Catalog (Unstructured + Governance)
  - Volumes for document storage
  - Access control enforcement
  - AI/ML asset governance

Layer 3b: Gravitino (Structured Catalog Federation)
  - Federates Hive, Iceberg, Trino catalogs
  - Unified table catalog API

Layer 3c: Physical Storage
  - S3/Object Storage (files in Unity Catalog Volumes)
  - Iceberg Tables (structured data)
```

**Data Flow**:
```
1. User uploads document → Unity Catalog Volume
2. Unity Catalog publishes metadata → DataHub
3. DataHub ingests metadata → Kuzu graph
4. LLM extracts entities from document → Kuzu
5. Entity resolution links document entities → structured data
6. User queries Kuzu → unified results (structured + unstructured)
```

**Pros**:
- ✅ **Best of both worlds**: DataHub's metadata + Unity Catalog's storage
- ✅ **Graph architecture preserved**: Kuzu ← DataHub ← Multiple sources
- ✅ **Unstructured support**: Unity Catalog Volumes
- ✅ **Unified governance**: Unity Catalog access control
- ✅ **Broad integration**: DataHub's 75+ connectors
- ✅ **Active metadata**: DataHub's orchestration capabilities
- ✅ **Tool-agnostic**: Composable, customer-adaptable

**Cons**:
- ⚠️ **More complexity**: Two systems instead of one
- ⚠️ **Sync overhead**: DataHub ↔ Unity Catalog metadata sync

**Mitigation**:
- Complexity is manageable: DataHub has built-in Unity Catalog connector
- Sync is automated: DataHub ingestion recipes handle this
- Value outweighs complexity: You get both metadata richness AND unstructured storage

---

## Part 3: Implementation Recommendation

### Architecture: DataHub as Metadata Hub + Unity Catalog for Volumes

**Step 1: Deploy Unity Catalog for Unstructured Storage**

```yaml
# unity-catalog-config.yaml
catalog:
  name: nexusone_unity

volumes:
  # Unstructured data storage
  - name: support_tickets
    location: s3://nexusone-data/unstructured/support_tickets/
    access_control:
      - principal: data_engineering_team
        permissions: [READ, WRITE]
      - principal: business_users
        permissions: [READ]

  - name: email_archives
    location: s3://nexusone-data/unstructured/emails/
    access_control:
      - principal: compliance_team
        permissions: [READ, WRITE]

  - name: document_repository
    location: s3://nexusone-data/unstructured/documents/
    access_control:
      - principal: all_authenticated_users
        permissions: [READ]

schemas:
  # Also manage structured tables via Unity Catalog
  - name: gold
    tables:
      - customer_churn_risk
      - customer_segmentation
```

**Step 2: Configure DataHub to Ingest Unity Catalog Metadata**

```yaml
# datahub-ingestion-unity-catalog.yml
source:
  type: unity-catalog
  config:
    workspace_url: https://unity-catalog.nexusone.internal:8080
    token: ${UNITY_CATALOG_TOKEN}

    # Ingest volumes (unstructured)
    include_volumes: true

    # Ingest tables (structured)
    include_tables: true

    # Ingest models/functions (AI/ML)
    include_models: true
    include_functions: true

    # Extract lineage
    include_lineage: true

    # Extract access control metadata
    include_access_control: true

sink:
  type: datahub-rest
  config:
    server: http://datahub-gms.nexusone.internal:8080
```

**Step 3: Sync DataHub Metadata to Kuzu**

```python
# /backend/services/datahub_kuzu_sync.py

class DataHubKuzuSync:
    """
    Sync metadata from DataHub to Kuzu knowledge graph
    Extends existing SQLMesh → Kuzu sync
    """

    async def sync_unity_catalog_volumes(self):
        """
        Sync Unity Catalog Volumes to Kuzu as Document storage locations
        """
        # Query DataHub for Unity Catalog volumes
        volumes = await self.datahub.query("""
            query {
              search(
                input: {
                  type: CONTAINER,
                  query: "*",
                  filters: [
                    {
                      field: "platform",
                      values: ["unity-catalog"]
                    }
                  ]
                }
              ) {
                searchResults {
                  entity {
                    ... on Container {
                      urn
                      properties {
                        name
                        description
                      }
                      subTypes
                      location
                    }
                  }
                }
              }
            }
        """)

        for volume in volumes:
            # Create Volume node in Kuzu
            await self.kuzu.execute("""
                CREATE (v:Volume {
                    volume_urn: $urn,
                    volume_name: $name,
                    storage_location: $location,
                    volume_type: $type,
                    description: $description,
                    created_at: $timestamp
                })
            """, {
                "urn": volume['urn'],
                "name": volume['properties']['name'],
                "location": volume['location'],
                "type": volume['subTypes'],
                "description": volume['properties']['description'],
                "timestamp": datetime.now()
            })

    async def sync_document_from_volume(
        self,
        volume_name: str,
        file_path: str,
        metadata: dict
    ):
        """
        When document is added to Unity Catalog Volume:
        1. Unity Catalog stores file + access control
        2. DataHub ingests file metadata
        3. This service syncs to Kuzu
        4. LLM extracts entities
        5. Entity resolution links to structured data
        """

        # 1. Get volume reference
        volume_urn = await self.datahub.get_volume_urn(volume_name)

        # 2. Create Document node in Kuzu
        doc_id = generate_id()
        await self.kuzu.execute("""
            CREATE (d:Document {
                document_id: $doc_id,
                document_type: $type,
                file_path: $path,
                storage_volume: $volume,
                title: $title,
                created_at: $created_at,
                author: $author,
                size_bytes: $size,
                access_control: $access
            })
        """, {
            "doc_id": doc_id,
            "type": metadata['document_type'],
            "path": file_path,
            "volume": volume_urn,
            "title": metadata.get('title', file_path.split('/')[-1]),
            "created_at": metadata['created_at'],
            "author": metadata.get('author', 'unknown'),
            "size": metadata.get('size_bytes', 0),
            "access": json.dumps(metadata.get('access_control', []))
        })

        # 3. Link Document to Volume
        await self.kuzu.execute("""
            MATCH (d:Document {document_id: $doc_id})
            MATCH (v:Volume {volume_name: $volume_name})
            CREATE (d)-[:STORED_IN {
                file_path: $path,
                stored_at: $timestamp
            }]->(v)
        """, {
            "doc_id": doc_id,
            "volume_name": volume_name,
            "path": file_path,
            "timestamp": datetime.now()
        })

        # 4. Extract entities (async processing)
        await self.entity_extraction_pipeline.process_document(doc_id)

        return doc_id
```

**Step 4: Unified Query API**

```python
# /backend/services/unified_data_access.py

class UnifiedDataAccess:
    """
    Single API for querying structured + unstructured data
    Backed by DataHub metadata + Unity Catalog storage + Kuzu graph
    """

    def __init__(self, kuzu, datahub, unity_catalog, trino):
        self.graph = kuzu
        self.metadata = datahub
        self.volumes = unity_catalog
        self.structured = trino

    async def hybrid_query(self, question: str):
        """
        User asks business question in natural language
        System returns unified results from structured + unstructured data

        Example: "Why are high-value customers churning?"
        """

        # 1. Extract entities and intent from question
        query_context = await self.llm.parse_question(question)
        # Returns: {"entities": ["customers", "churn"], "intent": "root_cause_analysis"}

        # 2. Find relevant data products via graph
        data_products = await self.graph.query("""
            MATCH (q:BusinessQuestion)-[:ANSWERED_BY]->(dp:DataProduct)
            WHERE q.embedding SIMILAR TO $query_embedding
            RETURN dp.product_id, dp.product_name, dp.confidence
            ORDER BY similarity DESC
            LIMIT 5
        """, {"query_embedding": await self.llm.embed(question)})

        # 3. Query structured data (via Trino)
        structured_results = await self.structured.query("""
            SELECT
                c.customer_id,
                c.customer_name,
                c.lifetime_value,
                cr.churn_probability,
                cr.risk_factors
            FROM gold.customers c
            JOIN gold.customer_churn_risk cr ON c.customer_id = cr.customer_id
            WHERE cr.churn_probability > 0.7
            AND c.lifetime_value > 10000
            ORDER BY cr.churn_probability DESC
            LIMIT 20
        """)

        # 4. For each high-risk customer, find unstructured mentions
        customer_insights = []
        for customer in structured_results:
            # Query graph for entity → document links
            documents = await self.graph.query("""
                MATCH (e:Entity {canonical_name: $customer_name})
                      <-[:REFERS_TO]-(m:EntityMention)
                      -[:MENTIONED_IN]->(d:Document)
                      -[:STORED_IN]->(v:Volume)
                WHERE d.document_type = 'support_ticket'
                AND d.created_at >= $date_threshold
                RETURN d.document_id, d.title, d.file_path, v.volume_name
                ORDER BY d.created_at DESC
                LIMIT 5
            """, {
                "customer_name": customer['customer_name'],
                "date_threshold": "2025-09-01"
            })

            # 5. Fetch document content from Unity Catalog Volumes
            ticket_summaries = []
            for doc in documents:
                # Unity Catalog handles access control automatically
                content = await self.volumes.read_file(
                    volume=doc['volume_name'],
                    path=doc['file_path']
                )

                # Summarize with LLM
                summary = await self.llm.summarize(
                    content,
                    focus="customer complaints and issues"
                )

                ticket_summaries.append({
                    "title": doc['title'],
                    "summary": summary,
                    "date": doc['created_at']
                })

            customer_insights.append({
                "customer_id": customer['customer_id'],
                "customer_name": customer['customer_name'],
                "lifetime_value": customer['lifetime_value'],
                "churn_probability": customer['churn_probability'],
                "structured_risk_factors": customer['risk_factors'],
                "recent_support_tickets": ticket_summaries,
                "unstructured_insights": self._extract_themes(ticket_summaries)
            })

        # 6. Generate AI insights
        insights = await self.llm.generate_insights(
            question=question,
            structured_data=structured_results,
            unstructured_data=customer_insights
        )

        return {
            "question": question,
            "data_products_used": [dp['product_name'] for dp in data_products],
            "customer_count": len(customer_insights),
            "top_churn_risks": customer_insights[:10],
            "common_themes": insights['themes'],
            "recommended_actions": insights['actions'],
            "data_lineage": insights['lineage']
        }
```

**User Experience**:

```python
# Business user workflow:

# 1. Ask question
result = await unified_api.hybrid_query(
    "Why are high-value customers churning?"
)

# 2. Get unified insights
print(result)

# Output:
# {
#   "question": "Why are high-value customers churning?",
#   "data_products_used": ["Customer Churn Risk Model v2", "Support Ticket Analysis"],
#   "customer_count": 18,
#   "top_churn_risks": [
#     {
#       "customer_name": "Acme Corp",
#       "lifetime_value": 125000,
#       "churn_probability": 0.85,
#       "structured_risk_factors": ["low_engagement", "late_payments"],
#       "recent_support_tickets": [
#         {
#           "title": "Billing discrepancy - urgent",
#           "summary": "Customer reports $5K invoice error, contract dispute",
#           "date": "2025-10-05"
#         },
#         {
#           "title": "Performance issues",
#           "summary": "System slowness impacting operations, seeking alternatives",
#           "date": "2025-10-02"
#         }
#       ],
#       "unstructured_insights": {
#         "primary_complaint": "billing_accuracy",
#         "secondary_complaint": "performance_issues",
#         "sentiment": "frustrated",
#         "urgency": "high"
#       }
#     },
#     ... 9 more customers
#   ],
#   "common_themes": [
#     "Billing accuracy concerns (12 customers, 67%)",
#     "Performance degradation (8 customers, 44%)",
#     "Missing features (5 customers, 28%)"
#   ],
#   "recommended_actions": [
#     "Immediate: Review billing for 12 customers with discrepancy complaints",
#     "Short-term: Address performance issues (8 customer impact)",
#     "Medium-term: Product roadmap review for requested features"
#   ],
#   "data_lineage": {
#     "structured_sources": ["gold.customer_churn_risk", "gold.customers"],
#     "unstructured_sources": ["unity_catalog.support_tickets volume (23 documents)"],
#     "entity_resolution": "18 customers linked across structured + unstructured"
#   }
# }
```

---

## Part 4: Benefits of DataHub + Unity Catalog Approach

### 1. **Separation of Concerns**

| Concern | Handled By | Reason |
|---------|------------|--------|
| Metadata management | DataHub | Graph-based, active metadata, broad integrations |
| Unstructured storage | Unity Catalog | Volumes, access control, governance |
| Knowledge graph | Kuzu | Multi-layer business-first architecture |
| Structured storage | Iceberg | ACID transactions, time travel |
| Query execution | Trino/Spark/Flink | Composable compute |

### 2. **Tool-Agnostic Composability**

```
Customer A needs:
- Unity Catalog for governance
- DataHub for metadata
- Trino for queries
✅ Supported

Customer B needs:
- AWS Glue for governance
- DataHub for metadata
- Presto for queries
✅ Supported (swap Unity Catalog → Glue)

Customer C needs:
- Databricks Unity Catalog
- Databricks Lakehouse
- Databricks SQL
✅ Supported (Unity Catalog native)
```

### 3. **Multi-Layer Graph Preserved**

```cypher
// Business Layer
BusinessObjective → REQUIRES → DataProduct

// Logical Layer (from DataHub)
DataProduct → PRODUCES_MODEL → LogicalModel (SQLMesh)

// Physical Layer (from Unity Catalog + Gravitino)
LogicalModel → SOURCED_FROM → DataTable (Iceberg)
LogicalModel → READS_FROM → Volume (Unity Catalog)

// Document Layer (from Unity Catalog Volumes)
Volume → CONTAINS → Document → MENTIONED_IN ← EntityMention

// Entity Layer (entity resolution)
EntityMention → REFERS_TO → Entity → STORED_IN_ROW → DataColumn
```

### 4. **Active Metadata Workflows**

```python
# DataHub enables active metadata:

# Example 1: Automated documentation
@datahub.on_table_created
async def auto_document_table(table_metadata):
    # LLM generates table description
    description = await llm.describe_table(table_metadata)
    await datahub.update_description(table_metadata.urn, description)

    # Sync to Kuzu
    await kuzu_sync.sync_table_metadata(table_metadata)

# Example 2: Quality monitoring
@datahub.on_quality_failure
async def alert_stakeholders(quality_event):
    # Find data product impacted
    data_product = await kuzu.query("""
        MATCH (dp:DataProduct)-[:PRODUCES_MODEL]->(m:LogicalModel)
              -[:SOURCED_FROM]->(t:DataTable {urn: $table_urn})
        RETURN dp
    """, {"table_urn": quality_event.table_urn})

    # Alert business stakeholders
    await alert_service.notify(
        recipients=data_product['stakeholders'],
        message=f"Data quality issue in {data_product['name']}"
    )

# Example 3: Unstructured ingestion trigger
@unity_catalog.on_file_uploaded
async def process_new_document(file_event):
    # DataHub ingests metadata
    await datahub.ingest_unity_catalog_file(file_event)

    # Kuzu extracts entities
    await entity_pipeline.process_document(file_event.file_path)
```

---

## Part 5: Migration Path

### Phase 1: Add Unity Catalog (Weeks 1-2)

**Tasks**:
1. Deploy Unity Catalog OSS
2. Create Volumes for unstructured data
3. Configure access control
4. Migrate existing unstructured files to Volumes

**Success Metric**: 100 support tickets stored in Unity Catalog Volume

### Phase 2: DataHub ↔ Unity Catalog Integration (Weeks 3-4)

**Tasks**:
1. Configure DataHub ingestion for Unity Catalog
2. Sync Volume metadata to DataHub
3. Sync DataHub metadata to Kuzu
4. Validate end-to-end metadata flow

**Success Metric**: Unity Catalog metadata visible in Kuzu graph

### Phase 3: Hybrid Query API (Weeks 5-6)

**Tasks**:
1. Build unified query API
2. Implement entity extraction for documents
3. Link entities to structured data
4. Test hybrid queries

**Success Metric**: Query "high-risk customers" returns structured + unstructured results

### Phase 4: Production Rollout (Weeks 7-8)

**Tasks**:
1. Deploy to production
2. Onboard first business users
3. Create documentation
4. Monitor performance and usage

**Success Metric**: 10+ business users running hybrid queries

---

## Conclusion

### Strategic Recommendation: DataHub + Unity Catalog

**Why This Approach Wins**:

1. ✅ **Best Metadata Platform**: DataHub's graph-based architecture fits your multi-layer graph
2. ✅ **Best Unstructured Storage**: Unity Catalog Volumes with unified governance
3. ✅ **Tool-Agnostic**: Composable, customer-adaptable
4. ✅ **Preserves Architecture**: Kuzu ← DataHub ← Multiple sources (including Unity Catalog)
5. ✅ **Active Metadata**: DataHub orchestration + Unity Catalog governance
6. ✅ **Broad Integration**: DataHub's 75+ connectors + Unity Catalog's Iceberg REST API
7. ✅ **Clear Separation**: Metadata (DataHub) vs Storage (Unity Catalog) vs Knowledge (Kuzu)

**Why NOT Unity Catalog Only**:
- ❌ No graph-based metadata (core to your architecture)
- ❌ Limited lineage (not column-level)
- ❌ Weaker discovery/search
- ❌ No active metadata capabilities

**Why NOT DataHub Only**:
- ❌ No native unstructured storage (need Volumes)
- ❌ No access control enforcement

**The Combination**:
- DataHub = Metadata intelligence
- Unity Catalog = Storage + governance
- Kuzu = Business-first knowledge graph
- Together = Complete solution

### Next Steps:

1. Deploy Unity Catalog (Week 1)
2. Configure DataHub ingestion (Week 2)
3. Sync to Kuzu (Week 3)
4. Build hybrid queries (Weeks 4-6)
5. Demo (Week 7)

**Total Time**: 7 weeks to full hybrid structured + unstructured capability

