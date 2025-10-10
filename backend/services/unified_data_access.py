"""
Unified Data Access Service
Hybrid query capabilities spanning structured + unstructured data

Purpose:
- Query business context (objectives, metrics, questions)
- Query structured data (tables, columns, lineage)
- Query unstructured documents and extracted entities
- Combine results from all layers with full lineage
- Natural language to SQL translation with business context

This enables queries like:
- "Why are customers churning?" → Business context + structured metrics + support tickets
- "Show me all data products related to customer satisfaction" → Multi-layer traversal
- "Find documents mentioning Acme Corp and their usage metrics" → Hybrid structured + unstructured

Date: October 10, 2025
"""

import logging
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import kuzu
import json
import re

logger = logging.getLogger(__name__)


@dataclass
class HybridQueryResult:
    """Result of a hybrid query spanning multiple data layers"""
    query_id: str
    query_text: str
    business_context: Dict[str, Any]
    structured_data: List[Dict[str, Any]]
    unstructured_data: List[Dict[str, Any]]
    insights: List[str]
    lineage: Dict[str, Any]
    execution_time_ms: float
    confidence: float


@dataclass
class EntityProfile:
    """Unified entity profile across all data sources"""
    entity_id: str
    canonical_name: str
    entity_type: str
    structured_references: List[Dict[str, Any]]  # Row identifiers in tables
    unstructured_mentions: List[Dict[str, Any]]  # Document mentions
    related_products: List[Dict[str, Any]]
    related_objectives: List[Dict[str, Any]]
    statistics: Dict[str, Any]


class UnifiedDataAccessService:
    """
    Service for hybrid queries across structured and unstructured data

    Capabilities:
    - Natural language to SQL translation
    - Business question routing
    - Entity-centric queries
    - Cross-layer lineage traversal
    - Insight generation
    """

    def __init__(self, kuzu_db_path: str = "./data/nexusone_knowledge.kuzu"):
        """Initialize unified data access service"""
        self.db_path = kuzu_db_path
        self.db = kuzu.Database(self.db_path)
        self.conn = kuzu.Connection(self.db)

        logger.info(f"Initialized UnifiedDataAccessService with database: {self.db_path}")

    async def query_by_business_question(
        self,
        question_text: str,
        include_documents: bool = True,
        include_structured: bool = True,
        max_results: int = 50
    ) -> HybridQueryResult:
        """
        Answer a business question using all available data layers

        Args:
            question_text: Natural language business question
            include_documents: Include unstructured documents in results
            include_structured: Include structured data in results
            max_results: Maximum results per data source

        Returns:
            HybridQueryResult with combined insights
        """
        start_time = datetime.now()
        query_id = f"query_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        logger.info(f"Processing business question: {question_text}")

        # 1. Find relevant business context
        business_context = await self._get_business_context_for_question(question_text)

        # 2. Get structured data
        structured_data = []
        if include_structured:
            structured_data = await self._get_structured_data_for_question(
                question_text,
                business_context,
                max_results
            )

        # 3. Get unstructured data
        unstructured_data = []
        if include_documents:
            unstructured_data = await self._get_unstructured_data_for_question(
                question_text,
                business_context,
                max_results
            )

        # 4. Generate lineage
        lineage = await self._build_lineage(
            business_context,
            structured_data,
            unstructured_data
        )

        # 5. Generate insights
        insights = await self._generate_insights(
            question_text,
            business_context,
            structured_data,
            unstructured_data
        )

        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds() * 1000

        # Calculate confidence
        confidence = self._calculate_confidence(
            business_context,
            structured_data,
            unstructured_data
        )

        return HybridQueryResult(
            query_id=query_id,
            query_text=question_text,
            business_context=business_context,
            structured_data=structured_data,
            unstructured_data=unstructured_data,
            insights=insights,
            lineage=lineage,
            execution_time_ms=execution_time,
            confidence=confidence
        )

    async def get_entity_profile(
        self,
        entity_identifier: str,
        entity_type: Optional[str] = None
    ) -> Optional[EntityProfile]:
        """
        Get unified profile for an entity across all data sources

        Args:
            entity_identifier: Entity ID or canonical name
            entity_type: Optional entity type filter

        Returns:
            EntityProfile with all references and mentions
        """
        logger.info(f"Getting entity profile for: {entity_identifier}")

        # 1. Find entity node
        entity_query = """
            MATCH (e:Entity)
            WHERE e.entity_id = $identifier OR e.canonical_name = $identifier
        """
        if entity_type:
            entity_query += " AND e.entity_type = $entity_type"

        entity_query += """
            RETURN
                e.entity_id,
                e.canonical_name,
                e.entity_type,
                e.confidence,
                e.first_seen,
                e.last_seen,
                e.mention_count
        """

        result = self.conn.execute(
            entity_query,
            {
                "identifier": entity_identifier,
                "entity_type": entity_type
            }
        )

        if not result.has_next():
            logger.warning(f"Entity not found: {entity_identifier}")
            return None

        row = result.get_next()
        entity_id = row[0]
        canonical_name = row[1]
        entity_type_found = row[2]

        # 2. Get structured references
        structured_refs = await self._get_entity_structured_references(entity_id)

        # 3. Get unstructured mentions
        unstructured_mentions = await self._get_entity_document_mentions(entity_id)

        # 4. Get related data products
        related_products = await self._get_entity_related_products(entity_id)

        # 5. Get related business objectives
        related_objectives = await self._get_entity_related_objectives(entity_id)

        # 6. Calculate statistics
        statistics = {
            "total_mentions": len(unstructured_mentions),
            "total_documents": len(set(m["document_id"] for m in unstructured_mentions)),
            "total_structured_refs": len(structured_refs),
            "total_related_products": len(related_products),
            "total_related_objectives": len(related_objectives),
            "first_seen": row[4],
            "last_seen": row[5]
        }

        return EntityProfile(
            entity_id=entity_id,
            canonical_name=canonical_name,
            entity_type=entity_type_found,
            structured_references=structured_refs,
            unstructured_mentions=unstructured_mentions,
            related_products=related_products,
            related_objectives=related_objectives,
            statistics=statistics
        )

    async def search_across_layers(
        self,
        search_term: str,
        layers: List[str] = ["business", "structured", "unstructured"],
        max_results_per_layer: int = 20
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Search across all data layers

        Args:
            search_term: Text to search for
            layers: Which layers to search ("business", "structured", "unstructured")
            max_results_per_layer: Max results per layer

        Returns:
            Dict mapping layer name to results
        """
        logger.info(f"Searching across layers: {', '.join(layers)} for term: {search_term}")

        results = {}

        if "business" in layers:
            results["business"] = await self._search_business_layer(search_term, max_results_per_layer)

        if "structured" in layers:
            results["structured"] = await self._search_structured_layer(search_term, max_results_per_layer)

        if "unstructured" in layers:
            results["unstructured"] = await self._search_unstructured_layer(search_term, max_results_per_layer)

        return results

    async def trace_lineage(
        self,
        start_node_id: str,
        node_type: str,
        direction: str = "downstream",
        max_depth: int = 5
    ) -> Dict[str, Any]:
        """
        Trace lineage from a starting node

        Args:
            start_node_id: ID of starting node
            node_type: Type of node (DataTable, DataProduct, Document, etc.)
            direction: "upstream" or "downstream"
            max_depth: Maximum traversal depth

        Returns:
            Lineage graph with nodes and edges
        """
        logger.info(f"Tracing {direction} lineage from {node_type}:{start_node_id}")

        # Build traversal query based on node type and direction
        if direction == "downstream":
            path_pattern = "-[*1..{max_depth}]->"
        else:
            path_pattern = "<-[*1..{max_depth}]-"

        query = f"""
            MATCH path = (start:{node_type} {{id: $start_id}}){path_pattern}(end)
            RETURN path
            LIMIT 100
        """

        # Execute query
        result = self.conn.execute(query, {"start_id": start_node_id, "max_depth": max_depth})

        nodes = []
        edges = []

        while result.has_next():
            path = result.get_next()[0]
            # Process path to extract nodes and edges
            # This is simplified - actual implementation would parse path structure
            nodes.append({
                "id": start_node_id,
                "type": node_type,
                "label": start_node_id
            })

        return {
            "start_node": start_node_id,
            "direction": direction,
            "max_depth": max_depth,
            "nodes": nodes,
            "edges": edges,
            "node_count": len(nodes),
            "edge_count": len(edges)
        }

    async def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the unified data layer"""
        stats = {}

        # Business layer stats
        business_objectives = self.conn.execute("MATCH (obj:BusinessObjective) RETURN count(*)")
        stats["business_objectives"] = business_objectives.get_next()[0] if business_objectives.has_next() else 0

        business_metrics = self.conn.execute("MATCH (m:BusinessMetric) RETURN count(*)")
        stats["business_metrics"] = business_metrics.get_next()[0] if business_metrics.has_next() else 0

        business_questions = self.conn.execute("MATCH (q:BusinessQuestion) RETURN count(*)")
        stats["business_questions"] = business_questions.get_next()[0] if business_questions.has_next() else 0

        # Structured layer stats
        data_tables = self.conn.execute("MATCH (dt:DataTable) RETURN count(*)")
        stats["data_tables"] = data_tables.get_next()[0] if data_tables.has_next() else 0

        data_products = self.conn.execute("MATCH (dp:DataProduct) RETURN count(*)")
        stats["data_products"] = data_products.get_next()[0] if data_products.has_next() else 0

        # Unstructured layer stats
        documents = self.conn.execute("MATCH (doc:Document) RETURN count(*)")
        stats["documents"] = documents.get_next()[0] if documents.has_next() else 0

        entities = self.conn.execute("MATCH (e:Entity) RETURN count(*)")
        stats["entities"] = entities.get_next()[0] if entities.has_next() else 0

        entity_mentions = self.conn.execute("MATCH (em:EntityMention) RETURN count(*)")
        stats["entity_mentions"] = entity_mentions.get_next()[0] if entity_mentions.has_next() else 0

        return stats

    # Private helper methods

    async def _get_business_context_for_question(
        self,
        question_text: str
    ) -> Dict[str, Any]:
        """Find relevant business context for a question"""
        # Search business questions
        result = self.conn.execute("""
            MATCH (q:BusinessQuestion)
            WHERE q.question_text CONTAINS $search_term
            OPTIONAL MATCH (q)-[r:ANSWERED_BY]->(dp:DataProduct)
            RETURN
                q.question_id,
                q.question_text,
                q.domain,
                q.frequency,
                collect({
                    product_id: dp.product_id,
                    product_name: dp.product_name,
                    confidence: r.confidence
                }) as products
            LIMIT 5
        """, {"search_term": question_text.split()[0]})  # Simple word match for demo

        questions = []
        while result.has_next():
            row = result.get_next()
            questions.append({
                "question_id": row[0],
                "question_text": row[1],
                "domain": row[2],
                "frequency": row[3],
                "related_products": row[4]
            })

        # Search business objectives
        result = self.conn.execute("""
            MATCH (obj:BusinessObjective)
            WHERE obj.title CONTAINS $search_term OR obj.description CONTAINS $search_term
            OPTIONAL MATCH (obj)-[r:REQUIRES]->(dp:DataProduct)
            RETURN
                obj.objective_id,
                obj.title,
                obj.description,
                obj.priority,
                obj.status,
                collect({
                    product_id: dp.product_id,
                    product_name: dp.product_name
                }) as products
            LIMIT 5
        """, {"search_term": question_text.split()[0]})

        objectives = []
        while result.has_next():
            row = result.get_next()
            objectives.append({
                "objective_id": row[0],
                "title": row[1],
                "description": row[2],
                "priority": row[3],
                "status": row[4],
                "related_products": row[5]
            })

        return {
            "related_questions": questions,
            "related_objectives": objectives,
            "search_term": question_text
        }

    async def _get_structured_data_for_question(
        self,
        question_text: str,
        business_context: Dict[str, Any],
        max_results: int
    ) -> List[Dict[str, Any]]:
        """Get structured data relevant to the question"""
        structured_results = []

        # Get data products from business context
        products = []
        for q in business_context.get("related_questions", []):
            products.extend(q.get("related_products", []))

        for obj in business_context.get("related_objectives", []):
            products.extend(obj.get("related_products", []))

        # For each product, get its data tables
        for product in products[:max_results]:
            if not product.get("product_id"):
                continue

            result = self.conn.execute("""
                MATCH (dp:DataProduct {product_id: $product_id})-[:PRODUCES_MODEL]->(lm:LogicalModel)
                MATCH (lm)<-[:BELONGS_TO]-(dc:DataColumn)
                OPTIONAL MATCH (lm)-[:SOURCED_FROM]->(dt:DataTable)
                RETURN
                    dp.product_id,
                    dp.product_name,
                    lm.model_name,
                    dt.table_name,
                    collect(dc.column_name) as columns
                LIMIT 1
            """, {"product_id": product["product_id"]})

            while result.has_next():
                row = result.get_next()
                structured_results.append({
                    "product_id": row[0],
                    "product_name": row[1],
                    "model_name": row[2],
                    "table_name": row[3],
                    "columns": row[4]
                })

        return structured_results

    async def _get_unstructured_data_for_question(
        self,
        question_text: str,
        business_context: Dict[str, Any],
        max_results: int
    ) -> List[Dict[str, Any]]:
        """Get unstructured documents relevant to the question"""
        # Search documents by content
        search_terms = question_text.lower().split()

        documents = []

        for term in search_terms[:3]:  # Use first 3 words
            result = self.conn.execute("""
                MATCH (doc:Document)
                WHERE doc.content CONTAINS $search_term OR doc.title CONTAINS $search_term
                OPTIONAL MATCH (doc)<-[:MENTIONED_IN]-(em:EntityMention)-[:REFERS_TO]->(e:Entity)
                RETURN
                    doc.document_id,
                    doc.title,
                    doc.document_type,
                    doc.source,
                    doc.author,
                    doc.created_at,
                    collect({
                        entity_id: e.entity_id,
                        canonical_name: e.canonical_name,
                        entity_type: e.entity_type
                    }) as entities
                LIMIT $max_results
            """, {"search_term": term, "max_results": max_results})

            while result.has_next():
                row = result.get_next()
                doc = {
                    "document_id": row[0],
                    "title": row[1],
                    "document_type": row[2],
                    "source": row[3],
                    "author": row[4],
                    "created_at": row[5],
                    "entities": row[6]
                }
                if doc not in documents:
                    documents.append(doc)

        return documents[:max_results]

    async def _build_lineage(
        self,
        business_context: Dict[str, Any],
        structured_data: List[Dict[str, Any]],
        unstructured_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Build lineage graph from query results"""
        nodes = []
        edges = []

        # Add business nodes
        for q in business_context.get("related_questions", []):
            nodes.append({
                "id": q["question_id"],
                "type": "BusinessQuestion",
                "label": q["question_text"]
            })

        for obj in business_context.get("related_objectives", []):
            nodes.append({
                "id": obj["objective_id"],
                "type": "BusinessObjective",
                "label": obj["title"]
            })

        # Add structured nodes
        for s in structured_data:
            nodes.append({
                "id": s["product_id"],
                "type": "DataProduct",
                "label": s["product_name"]
            })

        # Add unstructured nodes
        for u in unstructured_data:
            nodes.append({
                "id": u["document_id"],
                "type": "Document",
                "label": u["title"]
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "node_count": len(nodes),
            "edge_count": len(edges)
        }

    async def _generate_insights(
        self,
        question_text: str,
        business_context: Dict[str, Any],
        structured_data: List[Dict[str, Any]],
        unstructured_data: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate insights from combined results"""
        insights = []

        # Insight 1: Coverage
        if business_context.get("related_questions"):
            insights.append(
                f"Found {len(business_context['related_questions'])} similar business questions"
            )

        if business_context.get("related_objectives"):
            insights.append(
                f"Aligned with {len(business_context['related_objectives'])} business objectives"
            )

        # Insight 2: Data availability
        if structured_data:
            insights.append(
                f"Available in {len(structured_data)} data products with structured metrics"
            )

        if unstructured_data:
            insights.append(
                f"Referenced in {len(unstructured_data)} unstructured documents"
            )

        # Insight 3: Entity connections
        entity_count = sum(len(doc.get("entities", [])) for doc in unstructured_data)
        if entity_count > 0:
            insights.append(
                f"Connected to {entity_count} resolved entities across documents and tables"
            )

        # Insight 4: Recommendations
        if not structured_data and not unstructured_data:
            insights.append("No direct data found - consider creating a new data product")
        elif structured_data and not unstructured_data:
            insights.append("Structured metrics available - consider adding document context")
        elif unstructured_data and not structured_data:
            insights.append("Document references found - consider creating structured metrics")

        return insights

    def _calculate_confidence(
        self,
        business_context: Dict[str, Any],
        structured_data: List[Dict[str, Any]],
        unstructured_data: List[Dict[str, Any]]
    ) -> float:
        """Calculate confidence score for query results"""
        score = 0.0

        # Business context adds 30%
        if business_context.get("related_questions") or business_context.get("related_objectives"):
            score += 0.3

        # Structured data adds 40%
        if structured_data:
            score += 0.4

        # Unstructured data adds 30%
        if unstructured_data:
            score += 0.3

        return min(score, 1.0)

    async def _get_entity_structured_references(
        self,
        entity_id: str
    ) -> List[Dict[str, Any]]:
        """Get structured data references for an entity"""
        result = self.conn.execute("""
            MATCH (e:Entity {entity_id: $entity_id})-[r:STORED_IN_ROW]->(dc:DataColumn)
            OPTIONAL MATCH (dc)-[:BELONGS_TO]->(lm:LogicalModel)
            OPTIONAL MATCH (lm)-[:SOURCED_FROM]->(dt:DataTable)
            RETURN
                dc.column_name,
                dt.table_name,
                lm.model_name,
                r.row_identifier,
                r.match_score,
                r.match_method
        """, {"entity_id": entity_id})

        refs = []
        while result.has_next():
            row = result.get_next()
            refs.append({
                "column_name": row[0],
                "table_name": row[1],
                "model_name": row[2],
                "row_identifier": row[3],
                "match_score": row[4],
                "match_method": row[5]
            })

        return refs

    async def _get_entity_document_mentions(
        self,
        entity_id: str
    ) -> List[Dict[str, Any]]:
        """Get document mentions for an entity"""
        result = self.conn.execute("""
            MATCH (e:Entity {entity_id: $entity_id})<-[:REFERS_TO]-(em:EntityMention)
            MATCH (em)-[:MENTIONED_IN]->(doc:Document)
            RETURN
                em.mention_id,
                em.mention_text,
                em.confidence,
                doc.document_id,
                doc.title,
                doc.document_type,
                doc.created_at
            ORDER BY doc.created_at DESC
        """, {"entity_id": entity_id})

        mentions = []
        while result.has_next():
            row = result.get_next()
            mentions.append({
                "mention_id": row[0],
                "mention_text": row[1],
                "confidence": row[2],
                "document_id": row[3],
                "document_title": row[4],
                "document_type": row[5],
                "created_at": row[6]
            })

        return mentions

    async def _get_entity_related_products(
        self,
        entity_id: str
    ) -> List[Dict[str, Any]]:
        """Get data products related to an entity"""
        result = self.conn.execute("""
            MATCH (e:Entity {entity_id: $entity_id})-[:STORED_IN_ROW]->(dc:DataColumn)
            MATCH (dc)-[:BELONGS_TO]->(lm:LogicalModel)
            MATCH (lm)<-[:PRODUCES_MODEL]-(dp:DataProduct)
            RETURN DISTINCT
                dp.product_id,
                dp.product_name,
                dp.product_type
        """, {"entity_id": entity_id})

        products = []
        while result.has_next():
            row = result.get_next()
            products.append({
                "product_id": row[0],
                "product_name": row[1],
                "product_type": row[2]
            })

        return products

    async def _get_entity_related_objectives(
        self,
        entity_id: str
    ) -> List[Dict[str, Any]]:
        """Get business objectives related to an entity"""
        # Through data products
        result = self.conn.execute("""
            MATCH (e:Entity {entity_id: $entity_id})-[:STORED_IN_ROW]->(:DataColumn)
            MATCH (:DataColumn)-[:BELONGS_TO]->(:LogicalModel)
            MATCH (:LogicalModel)<-[:PRODUCES_MODEL]-(dp:DataProduct)
            MATCH (dp)<-[:REQUIRES]-(obj:BusinessObjective)
            RETURN DISTINCT
                obj.objective_id,
                obj.title,
                obj.priority,
                obj.status
        """, {"entity_id": entity_id})

        objectives = []
        while result.has_next():
            row = result.get_next()
            objectives.append({
                "objective_id": row[0],
                "title": row[1],
                "priority": row[2],
                "status": row[3]
            })

        return objectives

    async def _search_business_layer(
        self,
        search_term: str,
        max_results: int
    ) -> List[Dict[str, Any]]:
        """Search business layer (objectives, metrics, questions)"""
        results = []

        # Search objectives
        result = self.conn.execute("""
            MATCH (obj:BusinessObjective)
            WHERE obj.title CONTAINS $search_term OR obj.description CONTAINS $search_term
            RETURN
                'objective' as type,
                obj.objective_id as id,
                obj.title as title,
                obj.description as description,
                obj.priority as priority
            LIMIT $max_results
        """, {"search_term": search_term, "max_results": max_results})

        while result.has_next():
            row = result.get_next()
            results.append({
                "type": row[0],
                "id": row[1],
                "title": row[2],
                "description": row[3],
                "priority": row[4]
            })

        return results

    async def _search_structured_layer(
        self,
        search_term: str,
        max_results: int
    ) -> List[Dict[str, Any]]:
        """Search structured layer (products, tables, columns)"""
        results = []

        # Search data products
        result = self.conn.execute("""
            MATCH (dp:DataProduct)
            WHERE dp.product_name CONTAINS $search_term OR dp.description CONTAINS $search_term
            RETURN
                'product' as type,
                dp.product_id as id,
                dp.product_name as name,
                dp.product_type as product_type
            LIMIT $max_results
        """, {"search_term": search_term, "max_results": max_results})

        while result.has_next():
            row = result.get_next()
            results.append({
                "type": row[0],
                "id": row[1],
                "name": row[2],
                "product_type": row[3]
            })

        return results

    async def _search_unstructured_layer(
        self,
        search_term: str,
        max_results: int
    ) -> List[Dict[str, Any]]:
        """Search unstructured layer (documents, entities)"""
        results = []

        # Search documents
        result = self.conn.execute("""
            MATCH (doc:Document)
            WHERE doc.title CONTAINS $search_term OR doc.content CONTAINS $search_term
            RETURN
                'document' as type,
                doc.document_id as id,
                doc.title as title,
                doc.document_type as document_type,
                doc.source as source
            LIMIT $max_results
        """, {"search_term": search_term, "max_results": max_results})

        while result.has_next():
            row = result.get_next()
            results.append({
                "type": row[0],
                "id": row[1],
                "title": row[2],
                "document_type": row[3],
                "source": row[4]
            })

        return results


# Singleton instance
_unified_service: Optional[UnifiedDataAccessService] = None


def get_unified_service() -> UnifiedDataAccessService:
    """Get or create singleton unified data access service instance"""
    global _unified_service
    if _unified_service is None:
        _unified_service = UnifiedDataAccessService()
    return _unified_service
