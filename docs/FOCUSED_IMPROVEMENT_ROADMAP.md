# NexusOne: Focused Improvement Roadmap
## Business-First Data Products via Multi-Layer Graph + Unstructured Data Integration

**Date**: October 10, 2025
**Context**: Tool-agnostic, composable compute, business-first data products
**Focus**: Multi-layer graph refinement for AI/ML-driven value creation

---

## Strategic Reframe

### What We Got Wrong in Initial Audit
❌ **Tool consolidation concerns** - You're intentionally tool-agnostic and composable
❌ **Tool overlap as problem** - Flexibility and customer adaptability is the goal
❌ **Infrastructure focus** - Real focus is business-first data product creation

### What Actually Matters
✅ **Multi-layer graph as core differentiator** - Bronze → Silver → Gold → Product refinement
✅ **Business context preservation** - Technical transformations tied to business value
✅ **Unstructured data integration** - Critical missing piece for complete knowledge graph
✅ **Entity resolution** - Zingg for production, mock for demo (smart approach)
✅ **AI/ML enablement** - Graph enables certified data paths for model training and inference

---

## Part 1: Core Focus Areas (Priority Order)

### 1. Complete the Multi-Layer Graph Foundation
**Priority**: 🔴 **CRITICAL** - Foundation for everything else
**Current State**: POC complete for structured data (SQLMesh → Kuzu)
**Gap**: Graph doesn't yet capture business context systematically

#### What to Build Next:

**A. Business Context Layer in Graph**

Your current graph has technical layers (Bronze/Silver/Gold), but missing the **business intent** layer.

```cypher
// Current schema (technical):
LogicalModel → SOURCED_FROM → DataTable
DataColumn → BELONGS_TO → LogicalModel

// Need to add (business):
BusinessObjective → REQUIRES → DataProduct → PRODUCES_MODEL → LogicalModel
BusinessMetric → MEASURED_BY → DataColumn
BusinessQuestion → ANSWERED_BY → DataProduct
```

**Implementation**:

```python
# /backend/services/business_context_enrichment.py

class BusinessContextEnricher:
    """
    Links technical transformations to business objectives
    Enables business-first data product creation
    """

    def enrich_data_product_with_business_context(
        self,
        data_product_id: str,
        business_metadata: dict
    ):
        """
        When data engineer creates a data product, capture:
        - What business problem does it solve?
        - What business metrics does it impact?
        - Who are the stakeholders?
        - What decisions does it enable?
        """

        # 1. Create BusinessObjective node
        self.kuzu.execute("""
            CREATE (obj:BusinessObjective {
                objective_id: $obj_id,
                title: $title,
                description: $description,
                department: $department,
                stakeholders: $stakeholders,
                success_criteria: $criteria,
                business_value: $value
            })
        """, {
            "obj_id": business_metadata['objective_id'],
            "title": "Reduce customer churn by 15%",
            "description": "Identify at-risk customers for proactive retention",
            "department": "Customer Success",
            "stakeholders": ["VP Customer Success", "Head of Analytics"],
            "criteria": "Churn rate < 5%, Retention cost < $50/customer",
            "value": "$2.5M annual revenue protection"
        })

        # 2. Link to DataProduct
        self.kuzu.execute("""
            MATCH (obj:BusinessObjective {objective_id: $obj_id})
            MATCH (dp:DataProduct {product_id: $product_id})
            CREATE (obj)-[:REQUIRES {
                priority: $priority,
                deadline: $deadline,
                created_at: $timestamp
            }]->(dp)
        """, {
            "obj_id": business_metadata['objective_id'],
            "product_id": data_product_id,
            "priority": "P0",
            "deadline": "2025-11-01",
            "timestamp": datetime.now()
        })

        # 3. Link BusinessMetrics to DataColumns
        for metric in business_metadata['metrics']:
            self.kuzu.execute("""
                CREATE (m:BusinessMetric {
                    metric_id: $metric_id,
                    metric_name: $name,
                    definition: $definition,
                    calculation_logic: $logic,
                    target_value: $target,
                    current_value: $current
                })
            """, {
                "metric_id": metric['id'],
                "name": "Monthly Churn Rate",
                "definition": "% of customers who cancel in a given month",
                "logic": "churned_customers / total_active_customers",
                "target": 0.05,
                "current": 0.08
            })

            # Link metric to the columns that measure it
            self.kuzu.execute("""
                MATCH (m:BusinessMetric {metric_id: $metric_id})
                MATCH (c:DataColumn {column_fqn: $column_fqn})
                CREATE (m)-[:MEASURED_BY {
                    aggregation: $agg,
                    filters: $filters
                }]->(c)
            """, {
                "metric_id": metric['id'],
                "column_fqn": "gold.customer_churn_risk.churn_probability",
                "agg": "AVG",
                "filters": "WHERE prediction_date >= CURRENT_DATE - 30"
            })

    def link_business_question_to_product(
        self,
        question: str,
        data_product_id: str,
        confidence: float
    ):
        """
        Capture common business questions and link to data products
        Enables semantic search for data products by business need
        """

        # Store question with semantic embedding
        embedding = await self.llm.embed(question)

        self.kuzu.execute("""
            CREATE (q:BusinessQuestion {
                question_id: $q_id,
                question_text: $text,
                embedding: $embedding,
                frequency: $freq,
                personas: $personas
            })
        """, {
            "q_id": generate_id(),
            "text": question,
            "embedding": embedding.tolist(),
            "freq": 1,
            "personas": ["VP Sales", "Customer Success Manager"]
        })

        # Link to data product
        self.kuzu.execute("""
            MATCH (q:BusinessQuestion {question_text: $text})
            MATCH (dp:DataProduct {product_id: $product_id})
            CREATE (q)-[:ANSWERED_BY {
                confidence: $confidence,
                example_sql: $sql,
                typical_response_time_ms: $time
            }]->(dp)
        """, {
            "text": question,
            "product_id": data_product_id,
            "confidence": confidence,
            "sql": "SELECT * FROM gold.customer_churn_risk WHERE churn_probability > 0.7",
            "time": 250
        })
```

**Graph Schema Extension**:

```cypher
// Business layer nodes
CREATE NODE TABLE BusinessObjective(
    objective_id STRING PRIMARY KEY,
    title STRING,
    description STRING,
    department STRING,
    stakeholders STRING,  // JSON array
    success_criteria STRING,
    business_value STRING,
    priority STRING,
    status STRING,  // "active", "completed", "on-hold"
    created_at TIMESTAMP,
    deadline TIMESTAMP
)

CREATE NODE TABLE BusinessMetric(
    metric_id STRING PRIMARY KEY,
    metric_name STRING,
    definition STRING,
    calculation_logic STRING,
    target_value DOUBLE,
    current_value DOUBLE,
    trend STRING,  // "improving", "declining", "stable"
    last_updated TIMESTAMP
)

CREATE NODE TABLE BusinessQuestion(
    question_id STRING PRIMARY KEY,
    question_text STRING,
    embedding STRING,  // Vector embedding for semantic search
    frequency INT64,  // How often asked
    personas STRING,  // JSON array of user personas
    last_asked TIMESTAMP
)

// Business relationships
CREATE REL TABLE REQUIRES(
    FROM BusinessObjective TO DataProduct,
    priority STRING,
    deadline TIMESTAMP,
    created_at TIMESTAMP
)

CREATE REL TABLE MEASURED_BY(
    FROM BusinessMetric TO DataColumn,
    aggregation STRING,  // AVG, SUM, COUNT, etc.
    filters STRING,
    confidence DOUBLE
)

CREATE REL TABLE ANSWERED_BY(
    FROM BusinessQuestion TO DataProduct,
    confidence DOUBLE,
    example_sql STRING,
    typical_response_time_ms INT64,
    success_rate DOUBLE
)

CREATE REL TABLE IMPACTS(
    FROM DataProduct TO BusinessMetric,
    impact_type STRING,  // "increases", "decreases", "stabilizes"
    estimated_impact DOUBLE,
    validated BOOL
)
```

**User Experience**:

```python
# Business user workflow (no SQL knowledge needed):

# 1. User asks business question
user_question = "Which customers are likely to churn next month?"

# 2. System finds matching data products by business intent
results = await graph_search.find_data_products_for_question(user_question)

# Returns:
# {
#   "data_product": "Customer Churn Risk Model v2",
#   "confidence": 0.95,
#   "business_value": "$2.5M annual revenue protection",
#   "stakeholders": ["VP Customer Success", "Head of Analytics"],
#   "typical_response_time": "250ms",
#   "example_insights": [
#     "145 customers (12%) with >70% churn probability",
#     "Top risk factors: low engagement + late payments",
#     "Recommended action: Proactive outreach campaign"
#   ],
#   "technical_details": {
#     "source_tables": ["gold.customer_churn_risk"],
#     "data_quality": "98%",
#     "last_refreshed": "2 minutes ago",
#     "lineage_depth": 4
#   }
# }

# 3. System automatically generates insights (no manual SQL)
insights = await data_product.generate_insights(
    question=user_question,
    filters={"risk_threshold": 0.7}
)
```

**Why This Matters for Business-First Approach**:
- ✅ Business objectives drive data product creation (not technical curiosity)
- ✅ ROI and business value tracked at graph level
- ✅ Business users can discover products by **problem to solve**, not technical name
- ✅ AI agents understand **why** a data product exists, not just **what** it contains

---

### 2. Unstructured Data Integration
**Priority**: 🔴 **CRITICAL** - 80% of enterprise data is unstructured
**Current State**: Graph only handles structured data (tables, columns)
**Gap**: Support tickets, emails, documents, logs not accessible to graph

#### Strategy: Hybrid Graph Architecture

**Goal**: Unified graph where structured and unstructured data are **first-class citizens**, not separate systems.

**Architecture**:

```
Structured Data (Iceberg/Trino)
  ↓ SQLMesh lineage → Kuzu LogicalModel nodes

Unstructured Data (S3/Object Storage)
  ↓ LLM-powered processing → Kuzu Document nodes

Entity Layer (Kuzu)
  ↓ Links both → Unified entity graph

Query Layer
  ↓ Single API → Hybrid results (structured + unstructured)
```

**Implementation**:

```python
# /backend/services/unstructured_data_ingestion.py

class UnstructuredDataIngestion:
    """
    Ingest unstructured data into knowledge graph
    Extract entities, relationships, and semantic meaning
    """

    def __init__(self, kuzu, s3, ollama, vector_store):
        self.graph = kuzu
        self.storage = s3
        self.llm = ollama
        self.vectors = vector_store

    async def ingest_document(
        self,
        document_path: str,
        document_type: str,  # "support_ticket", "email", "pdf", "log"
        metadata: dict
    ):
        """
        1. Store document in object storage
        2. Extract text and metadata
        3. Generate embeddings
        4. Extract entities with LLM
        5. Create graph nodes and relationships
        """

        # 1. Read document
        content = await self.storage.read(document_path)

        # 2. Extract structured metadata
        doc_metadata = {
            "document_id": generate_id(),
            "document_type": document_type,
            "source_path": document_path,
            "created_at": metadata.get('created_at'),
            "author": metadata.get('author'),
            "size_bytes": len(content)
        }

        # 3. Generate embedding for semantic search
        embedding = await self.llm.embed(content)
        await self.vectors.store(
            doc_id=doc_metadata['document_id'],
            embedding=embedding,
            metadata=doc_metadata
        )

        # 4. Extract entities using LLM
        entities = await self.llm.extract_entities(content, types=[
            "CUSTOMER", "PRODUCT", "ISSUE_TYPE",
            "PERSON", "ORGANIZATION", "METRIC", "DATE"
        ])

        # 5. Extract key-value pairs (for semi-structured logs)
        if document_type == "log":
            kv_pairs = self._extract_log_fields(content)
        else:
            kv_pairs = {}

        # 6. Create Document node in graph
        self.graph.execute("""
            CREATE (d:Document {
                document_id: $doc_id,
                document_type: $type,
                source_path: $path,
                title: $title,
                content_preview: $preview,
                full_content_location: $storage_location,
                created_at: $created_at,
                author: $author,
                size_bytes: $size,
                language: $language,
                sentiment: $sentiment,
                structured_fields: $kv_pairs,
                processing_status: $status
            })
        """, {
            "doc_id": doc_metadata['document_id'],
            "type": document_type,
            "path": document_path,
            "title": self._extract_title(content),
            "preview": content[:500],  # First 500 chars
            "storage_location": f"s3://nexusone-documents/{doc_metadata['document_id']}",
            "created_at": doc_metadata['created_at'],
            "author": doc_metadata['author'],
            "size": doc_metadata['size_bytes'],
            "language": await self.llm.detect_language(content),
            "sentiment": await self.llm.analyze_sentiment(content),
            "kv_pairs": json.dumps(kv_pairs),
            "status": "processed"
        })

        # 7. Create entity mentions and link to canonical entities
        for entity in entities:
            await self._link_entity_mention_to_canonical(
                document_id=doc_metadata['document_id'],
                entity=entity
            )

        # 8. Extract relationships between entities
        relationships = await self.llm.extract_relationships(content, entities)
        for rel in relationships:
            await self._create_entity_relationship(rel)

        return doc_metadata['document_id']

    async def _link_entity_mention_to_canonical(
        self,
        document_id: str,
        entity: dict
    ):
        """
        Link entity mention in document to canonical entity in graph
        Uses Zingg (production) or fuzzy matching (demo)
        """

        # Create mention node
        self.graph.execute("""
            CREATE (m:EntityMention {
                mention_id: $mention_id,
                mention_text: $text,
                entity_type: $type,
                context: $context,
                confidence: $confidence,
                char_offset_start: $start,
                char_offset_end: $end
            })
        """, {
            "mention_id": generate_id(),
            "text": entity['text'],
            "type": entity['type'],
            "context": entity['context'],
            "confidence": entity['confidence'],
            "start": entity['start'],
            "end": entity['end']
        })

        # Link mention to document
        self.graph.execute("""
            MATCH (m:EntityMention {mention_id: $mention_id})
            MATCH (d:Document {document_id: $doc_id})
            CREATE (m)-[:MENTIONED_IN]->(d)
        """, {
            "mention_id": entity['mention_id'],
            "doc_id": document_id
        })

        # Resolve to canonical entity (Zingg or mock)
        if USE_ZINGG:
            canonical_id = await self.zingg.resolve_entity(entity)
        else:
            # Demo: fuzzy matching against known entities
            canonical_id = await self._mock_entity_resolution(entity)

        # Link to canonical entity
        if canonical_id:
            self.graph.execute("""
                MATCH (m:EntityMention {mention_id: $mention_id})
                MATCH (e:Entity {entity_id: $canonical_id})
                CREATE (m)-[:REFERS_TO {
                    resolution_method: $method,
                    confidence: $confidence
                }]->(e)
            """, {
                "mention_id": entity['mention_id'],
                "canonical_id": canonical_id,
                "method": "zingg" if USE_ZINGG else "fuzzy_match",
                "confidence": entity['confidence']
            })

            # Link canonical entity to structured data if applicable
            if entity['type'] == 'CUSTOMER':
                await self._link_entity_to_customer_table(canonical_id, entity)

    async def _link_entity_to_customer_table(
        self,
        entity_id: str,
        entity: dict
    ):
        """
        Find matching customer_id in structured customer table
        Create graph relationship: Entity → DataColumn (customer_id)
        """

        # Query structured customer table
        customer_matches = await self.trino.query("""
            SELECT customer_id, customer_name, similarity_score
            FROM gold.customers,
                 LATERAL (
                     SELECT fuzzymatch(customer_name, ?) AS similarity_score
                 )
            WHERE similarity_score > 0.8
            ORDER BY similarity_score DESC
            LIMIT 1
        """, [entity['text']])

        if customer_matches:
            customer_id = customer_matches[0]['customer_id']

            # Create graph link
            self.graph.execute("""
                MATCH (e:Entity {entity_id: $entity_id})
                MATCH (c:DataColumn {column_fqn: 'gold.customers.customer_id'})
                CREATE (e)-[:STORED_IN_ROW {
                    row_pk: $customer_id,
                    confidence: $confidence,
                    linked_at: $timestamp
                }]->(c)
            """, {
                "entity_id": entity_id,
                "customer_id": str(customer_id),
                "confidence": customer_matches[0]['similarity_score'],
                "timestamp": datetime.now()
            })
```

**Graph Schema for Unstructured Data**:

```cypher
// Document nodes
CREATE NODE TABLE Document(
    document_id STRING PRIMARY KEY,
    document_type STRING,  // "support_ticket", "email", "pdf", "log", "slack_message"
    source_path STRING,
    title STRING,
    content_preview STRING,  // First 500 chars
    full_content_location STRING,  // S3 path for full content
    created_at TIMESTAMP,
    author STRING,
    size_bytes INT64,
    language STRING,
    sentiment STRING,  // "positive", "negative", "neutral"
    structured_fields STRING,  // JSON for semi-structured data
    processing_status STRING,  // "pending", "processed", "failed"
    embedding STRING  // Vector embedding (stored in vector DB, referenced here)
)

CREATE NODE TABLE EntityMention(
    mention_id STRING PRIMARY KEY,
    mention_text STRING,
    entity_type STRING,
    context STRING,  // Surrounding text for disambiguation
    confidence DOUBLE,
    char_offset_start INT64,
    char_offset_end INT64
)

// Relationships
CREATE REL TABLE MENTIONED_IN(
    FROM EntityMention TO Document,
    extraction_method STRING,  // "llm_ner", "regex", "manual"
    extraction_timestamp TIMESTAMP
)

CREATE REL TABLE REFERS_TO(
    FROM EntityMention TO Entity,
    resolution_method STRING,  // "zingg", "fuzzy_match", "manual"
    confidence DOUBLE
)

CREATE REL TABLE RELATED_TO(
    FROM Document TO Document,
    relationship_type STRING,  // "reply_to", "references", "similar_topic"
    confidence DOUBLE
)

CREATE REL TABLE DISCUSSES(
    FROM Document TO BusinessTerm,
    relevance_score DOUBLE,
    key_phrases STRING  // JSON array
)
```

**Hybrid Query Example**:

```python
# User asks: "Why are high-value customers churning?"

# Query spans BOTH structured and unstructured data:
result = kuzu.query("""
    -- 1. Find high-value customers with high churn risk (STRUCTURED)
    MATCH (c:Entity {entity_type: 'CUSTOMER'})-[:STORED_IN_ROW]->(col:DataColumn)
    WHERE col.column_fqn = 'gold.customer_churn_risk.customer_id'

    -- Get their risk scores from structured data
    MATCH (col)-[:BELONGS_TO]->(t:DataTable {table_fqn: 'gold.customer_churn_risk'})
    WHERE <risk_score> > 0.7
    AND <customer_lifetime_value> > 10000

    -- 2. Find mentions in support tickets (UNSTRUCTURED)
    MATCH (c)<-[:REFERS_TO]-(m:EntityMention)-[:MENTIONED_IN]->(d:Document)
    WHERE d.document_type = 'support_ticket'
    AND d.created_at >= timestamp('2025-09-01')

    -- 3. Extract common issues from documents
    MATCH (d)-[:DISCUSSES]->(term:BusinessTerm)

    -- 4. Return unified results
    RETURN
        c.canonical_name AS customer,
        <risk_score> AS churn_risk,
        <customer_lifetime_value> AS lifetime_value,
        count(DISTINCT d) AS support_ticket_count,
        collect(DISTINCT term.term) AS discussed_issues,
        collect(DISTINCT d.title) AS recent_tickets
    ORDER BY churn_risk DESC
    LIMIT 20
""")

# Result combines structured metrics + unstructured insights:
# {
#   "customer": "Acme Corp",
#   "churn_risk": 0.85,
#   "lifetime_value": 125000,
#   "support_ticket_count": 12,
#   "discussed_issues": ["billing_issues", "performance_problems", "missing_features"],
#   "recent_tickets": [
#     "Billing discrepancy - urgent",
#     "System performance degraded",
#     "Feature request: API rate limiting"
#   ]
# }
```

**Why This Matters**:
- ✅ **Complete knowledge graph**: Not just tables/columns, but documents/entities
- ✅ **Unified entity resolution**: "Acme Corp" in ticket = `customer_id: 12345` in table
- ✅ **Hybrid queries**: Single query spans structured + unstructured data
- ✅ **Business insights**: AI can correlate metrics with customer feedback
- ✅ **Root cause analysis**: Link churn risk to actual customer complaints

---

### 3. Demo-Ready Entity Resolution (Mock Zingg)
**Priority**: 🟡 **IMPORTANT** - For POC demonstration
**Current State**: No entity resolution implemented
**Gap**: Need mock that demonstrates capability without Zingg infrastructure

#### Mock Entity Resolution for Demo

```python
# /backend/services/mock_entity_resolution.py

class MockZinggEntityResolver:
    """
    Mock entity resolution for demo purposes
    Production: Replace with real Zingg integration

    Demonstrates:
    - Fuzzy entity matching across data sources
    - Canonical entity ID assignment
    - Confidence scoring
    """

    def __init__(self, kuzu):
        self.graph = kuzu
        self.entity_registry = {}  # In-memory cache for demo

    async def resolve_entity(
        self,
        entity_text: str,
        entity_type: str,
        context: dict = None
    ) -> str:
        """
        Resolve entity mention to canonical entity ID

        Demo behavior:
        - Fuzzy match against known entities
        - Create new canonical entity if no match
        - Return entity_id with confidence score
        """

        # 1. Search for existing entities of this type
        candidates = await self.graph.query("""
            MATCH (e:Entity {entity_type: $type})
            RETURN
                e.entity_id,
                e.canonical_name,
                e.alternate_names
            ORDER BY e.mention_count DESC
            LIMIT 20
        """, {"type": entity_type})

        # 2. Fuzzy match using Levenshtein distance
        best_match = None
        best_score = 0.0

        for candidate in candidates:
            # Check canonical name
            score = self._similarity_score(
                entity_text.lower(),
                candidate['canonical_name'].lower()
            )

            # Check alternate names
            alternate_names = json.loads(candidate['alternate_names'] or '[]')
            for alt_name in alternate_names:
                alt_score = self._similarity_score(
                    entity_text.lower(),
                    alt_name.lower()
                )
                score = max(score, alt_score)

            if score > best_score:
                best_score = score
                best_match = candidate

        # 3. If high confidence match, return existing entity
        if best_score > 0.85:
            # Update mention count
            await self.graph.execute("""
                MATCH (e:Entity {entity_id: $entity_id})
                SET e.mention_count = e.mention_count + 1,
                    e.last_mentioned = $timestamp
            """, {
                "entity_id": best_match['entity_id'],
                "timestamp": datetime.now()
            })

            return best_match['entity_id']

        # 4. If medium confidence, add as alternate name
        elif best_score > 0.70:
            alternate_names = json.loads(best_match['alternate_names'] or '[]')
            if entity_text not in alternate_names:
                alternate_names.append(entity_text)

                await self.graph.execute("""
                    MATCH (e:Entity {entity_id: $entity_id})
                    SET e.alternate_names = $names
                """, {
                    "entity_id": best_match['entity_id'],
                    "names": json.dumps(alternate_names)
                })

            return best_match['entity_id']

        # 5. If no match, create new canonical entity
        else:
            new_entity_id = f"entity_{entity_type}_{generate_id()}"

            await self.graph.execute("""
                CREATE (e:Entity {
                    entity_id: $entity_id,
                    entity_type: $type,
                    canonical_name: $name,
                    alternate_names: $alternates,
                    first_seen: $timestamp,
                    last_mentioned: $timestamp,
                    mention_count: 1,
                    confidence_score: 1.0,
                    resolution_method: 'mock_zingg'
                })
            """, {
                "entity_id": new_entity_id,
                "type": entity_type,
                "name": entity_text,
                "alternates": "[]",
                "timestamp": datetime.now()
            })

            return new_entity_id

    def _similarity_score(self, str1: str, str2: str) -> float:
        """
        Calculate similarity score using Levenshtein distance
        Returns value between 0.0 (no match) and 1.0 (exact match)
        """
        from Levenshtein import distance

        max_len = max(len(str1), len(str2))
        if max_len == 0:
            return 1.0

        edit_distance = distance(str1, str2)
        similarity = 1 - (edit_distance / max_len)

        return similarity

    async def get_entity_profile(self, entity_id: str) -> dict:
        """
        Get complete profile of entity across all data sources
        Demonstrates cross-domain entity linking
        """

        profile = {
            "entity_id": entity_id,
            "canonical_name": None,
            "entity_type": None,
            "alternate_names": [],
            "mention_count": 0,
            "structured_data": {},
            "unstructured_mentions": [],
            "related_entities": []
        }

        # 1. Get entity metadata
        entity = await self.graph.query("""
            MATCH (e:Entity {entity_id: $entity_id})
            RETURN e
        """, {"entity_id": entity_id})

        if not entity:
            return None

        profile.update(entity[0])

        # 2. Find structured data references
        structured_refs = await self.graph.query("""
            MATCH (e:Entity {entity_id: $entity_id})
                  -[:STORED_IN_ROW]->(c:DataColumn)
                  -[:BELONGS_TO]->(t:DataTable)
            RETURN
                t.table_fqn,
                c.column_name,
                e.row_pk AS primary_key
        """, {"entity_id": entity_id})

        for ref in structured_refs:
            # Query actual data from structured table
            table_data = await self.trino.query(f"""
                SELECT *
                FROM {ref['table_fqn']}
                WHERE {ref['column_name']} = '{ref['primary_key']}'
                LIMIT 1
            """)

            profile['structured_data'][ref['table_fqn']] = table_data[0] if table_data else {}

        # 3. Find unstructured mentions
        mentions = await self.graph.query("""
            MATCH (e:Entity {entity_id: $entity_id})
                  <-[:REFERS_TO]-(m:EntityMention)
                  -[:MENTIONED_IN]->(d:Document)
            RETURN
                m.mention_text,
                m.context,
                d.document_type,
                d.title,
                d.created_at
            ORDER BY d.created_at DESC
            LIMIT 10
        """, {"entity_id": entity_id})

        profile['unstructured_mentions'] = mentions

        # 4. Find related entities
        related = await self.graph.query("""
            MATCH (e1:Entity {entity_id: $entity_id})
                  <-[:REFERS_TO]-(m1:EntityMention)
                  -[:MENTIONED_IN]->(d:Document)
                  <-[:MENTIONED_IN]-(m2:EntityMention)
                  -[:REFERS_TO]->(e2:Entity)
            WHERE e1 != e2
            RETURN
                e2.entity_id,
                e2.canonical_name,
                e2.entity_type,
                count(DISTINCT d) AS cooccurrence_count
            ORDER BY cooccurrence_count DESC
            LIMIT 10
        """, {"entity_id": entity_id})

        profile['related_entities'] = related

        return profile
```

**Demo Workflow**:

```python
# Demo script showing entity resolution across structured + unstructured

# 1. Ingest support ticket (unstructured)
ticket_content = """
Subject: Billing issue - urgent
From: john.smith@acmecorp.com

We noticed a $5,000 discrepancy in our October invoice.
The contract states $15,000/month but we were charged $20,000.
Please investigate ASAP.

- John Smith
  VP Finance, ACME Corporation
"""

doc_id = await unstructured_ingestion.ingest_document(
    document_path="support_tickets/ticket_12345.txt",
    document_type="support_ticket",
    metadata={"created_at": "2025-10-05", "author": "john.smith@acmecorp.com"}
)

# LLM extracts entities:
# - "ACME Corporation" (ORGANIZATION)
# - "John Smith" (PERSON)
# - "$5,000" (MONEY)
# - "October invoice" (DATE + CONCEPT)

# 2. Resolve "ACME Corporation" to canonical entity
entity_id = await mock_zingg.resolve_entity(
    entity_text="ACME Corporation",
    entity_type="CUSTOMER",
    context={"source": "support_ticket", "author_email": "acmecorp.com"}
)

# Returns: "entity_customer_12345" (already exists in graph)

# 3. Link to structured customer table
# Graph now knows: "ACME Corporation" (in ticket) = customer_id: 12345 (in gold.customers)

# 4. Query unified profile
profile = await mock_zingg.get_entity_profile("entity_customer_12345")

# Returns:
# {
#   "entity_id": "entity_customer_12345",
#   "canonical_name": "Acme Corp",
#   "entity_type": "CUSTOMER",
#   "alternate_names": ["ACME Corporation", "Acme Inc.", "ACME"],
#   "mention_count": 47,
#   "structured_data": {
#     "gold.customers": {
#       "customer_id": 12345,
#       "customer_name": "Acme Corp",
#       "contract_value": 180000,
#       "payment_status": "current"
#     },
#     "gold.customer_churn_risk": {
#       "customer_id": 12345,
#       "churn_probability": 0.15,
#       "risk_factors": ["billing_issues"]
#     }
#   },
#   "unstructured_mentions": [
#     {
#       "mention_text": "ACME Corporation",
#       "context": "billing issue - urgent",
#       "document_type": "support_ticket",
#       "title": "Billing issue - urgent",
#       "created_at": "2025-10-05"
#     },
#     ... 9 more recent mentions
#   ],
#   "related_entities": [
#     {"entity_id": "entity_person_789", "canonical_name": "John Smith", "type": "PERSON"},
#     {"entity_id": "entity_product_456", "canonical_name": "Enterprise Plan", "type": "PRODUCT"}
#   ]
# }

# 5. AI insight generation
insight = f"""
ALERT: Customer Acme Corp (ID: 12345) mentioned in support ticket with billing complaint.

Structured Data:
- Contract value: $180,000/year
- Churn risk: 15% (LOW)
- Payment status: Current

Unstructured Data:
- 3 support tickets in last 30 days (above average)
- Billing issues mentioned 2 times
- Last contact: 2 days ago

Recommendation: Proactive outreach from account manager to resolve billing issue before churn risk increases.
"""
```

---

## Part 2: Prioritized Implementation Plan

### Phase 1: Complete Multi-Layer Graph (Weeks 1-2)

**Goal**: Add business context layer to existing technical graph

**Tasks**:
1. ✅ Extend Kuzu schema with BusinessObjective, BusinessMetric, BusinessQuestion nodes
2. Build business context enrichment service
3. Create UI for capturing business metadata during data product creation
4. Link existing data products to business objectives retroactively

**Success Metric**: Every data product has linked business objective with ROI estimate

### Phase 2: Unstructured Data Foundation (Weeks 3-4)

**Goal**: Ingest first unstructured data source into graph

**Tasks**:
1. Extend Kuzu schema with Document and EntityMention nodes
2. Build document ingestion pipeline (start with support tickets)
3. Implement LLM-powered entity extraction (Ollama)
4. Deploy mock Zingg entity resolution
5. Link entities to structured customer table

**Success Metric**: 100 support tickets ingested with entity linking to customer records

### Phase 3: Hybrid Query Capabilities (Weeks 5-6)

**Goal**: Enable queries that span structured + unstructured data

**Tasks**:
1. Build unified query API
2. Implement hybrid query examples (churn analysis with tickets)
3. Create UI for business users to ask questions
4. Generate insights automatically from hybrid queries

**Success Metric**: Business users can ask "Why are customers churning?" and get combined structured metrics + unstructured feedback

### Phase 4: Demo Preparation (Week 7)

**Goal**: Polished demo showing business-first data products

**Demo Flow**:
1. Show business objective: "Reduce churn by 15%"
2. Show data product creation with business context
3. Ingest support tickets → entity resolution → graph linking
4. Execute hybrid query: "High-risk customers with recent complaints"
5. Generate AI insights combining structured churn risk + unstructured feedback
6. Show lineage: Business objective → Data product → Models → Tables → Documents

**Success Metric**: 5-minute demo with live data showing end-to-end value

---

## Part 3: Key Differentiators (Why This Matters)

### What Makes NexusOne Different

**1. Business-First, Not Technology-First**
- Most platforms: "Here are your tables, figure out what to build"
- NexusOne: "Here's your business objective, we'll guide you to the right data"

**2. Unified Graph Across All Data Types**
- Most platforms: Structured catalog separate from document search
- NexusOne: Single graph where tables, documents, entities, metrics all connected

**3. Multi-Layer Refinement with Business Context**
- Most platforms: Bronze/Silver/Gold is technical only
- NexusOne: Every transformation linked to business value and stakeholder needs

**4. Entity-Centric, Not Table-Centric**
- Most platforms: "Query this table for customer data"
- NexusOne: "Ask about a customer, get unified profile from all sources"

**5. Composable Compute, Consistent Knowledge**
- Most platforms: Each tool has its own metadata silo
- NexusOne: Tool-agnostic orchestration with unified knowledge graph

### Value Proposition for Customers

**For Data Engineers**:
- Build data products 5x faster with business context guiding technical decisions
- Lineage automatically captured across structured + unstructured sources
- Entity resolution handles the hard problem of linking disparate data

**For Business Users**:
- Ask questions in plain English, get insights combining structured metrics + unstructured feedback
- Self-service analytics without needing to know table names or SQL
- Trust that data products solve real business problems (not technical curiosities)

**For ML/AI Teams**:
- Certified data paths ensure model training on high-quality, governed data
- Entity graph provides rich features for ML models
- Business context enables explainable AI (why this prediction matters)

---

## Part 4: Technical Implementation Details

### Integration Points

**SQLMesh → Kuzu** (✅ Complete in POC)
- Logical models, columns, lineage already synced
- Need to add: Business context enrichment

**Document Ingestion → Kuzu** (🔴 New)
```python
# Pipeline: S3 → Document Processing → Entity Extraction → Graph Storage
document_pipeline = Pipeline([
    S3DocumentReader(),
    LLMEntityExtractor(ollama),
    MockZinggResolver(),
    KuzuGraphWriter()
])
```

**Hybrid Query API** (🔴 New)
```python
# Single API handles both structured and unstructured
class HybridQueryEngine:
    async def query(self, question: str):
        # 1. Semantic search in documents
        doc_results = await self.vector_store.search(question)

        # 2. Extract entities from results
        entities = await self.entity_resolver.resolve_from_docs(doc_results)

        # 3. Query structured data
        structured_data = await self.trino.query_by_entities(entities)

        # 4. Combine and return
        return self._unified_results(doc_results, structured_data)
```

**Entity Resolution** (🔴 New - Mock for demo)
```python
# Demo: Simple fuzzy matching
# Production: Replace with Zingg API calls
entity_id = await mock_zingg.resolve_entity(
    entity_text="ACME Corp",
    entity_type="CUSTOMER"
)
```

---

## Conclusion

### Focus on These 3 Things:

1. **✅ Complete the Multi-Layer Graph with Business Context**
   - Not just technical lineage, but business objectives → data products
   - Every transformation linked to business value

2. **✅ Add Unstructured Data as First-Class Citizen**
   - Documents, tickets, logs in the graph alongside tables
   - Entity resolution linking structured + unstructured

3. **✅ Hybrid Queries Spanning Both Worlds**
   - Single API, unified results
   - AI insights from structured metrics + unstructured feedback

### Next 2 Weeks (Immediate Actions):

**Week 1**: Business context layer
- Extend Kuzu schema
- Build enrichment service
- Link existing data products to business objectives

**Week 2**: Unstructured data MVP
- Ingest 100 support tickets
- Extract entities with LLM
- Mock Zingg resolution
- Link to customer table

### Demo Pitch (30 seconds):

> "NexusOne is the only platform that unifies structured data transformations with unstructured document insights through a business-first knowledge graph. Ask 'Why are high-value customers churning?' and get back not just their churn risk score, but their actual support tickets, complaints, and feature requests - all linked through intelligent entity resolution. From business objective to certified data product to real-time insights, all guided by a multi-layer graph that preserves context at every step."

That's your differentiation. Focus there.

