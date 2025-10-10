"""
Business Context Enrichment Service
Links technical data products to business objectives, metrics, and questions

Purpose:
- Create and manage business objectives with ROI estimates
- Track business metrics (targets vs current values)
- Capture common business questions with semantic embeddings
- Enable business-first data product discovery

Date: October 10, 2025
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import kuzu
import uuid

logger = logging.getLogger(__name__)


class BusinessContextEnricher:
    """
    Service for enriching data products with business context
    Enables business-first approach to data product creation
    """

    def __init__(self, kuzu_conn: kuzu.Connection, llm_service=None):
        """
        Initialize business context enrichment service

        Args:
            kuzu_conn: Active Kuzu connection
            llm_service: Optional LLM service for embeddings (Ollama)
        """
        self.kuzu = kuzu_conn
        self.llm = llm_service

    # ============================================================
    # Business Objective Management
    # ============================================================

    async def create_business_objective(
        self,
        title: str,
        description: str,
        department: str,
        stakeholders: List[str],
        success_criteria: str,
        business_value: str,
        priority: str = "P1",
        deadline: Optional[datetime] = None,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Create a new business objective

        Args:
            title: Objective title (e.g., "Reduce customer churn by 15%")
            description: Detailed description
            department: Department owning this objective
            stakeholders: List of stakeholder names/roles
            success_criteria: How to measure success
            business_value: ROI or business value estimate
            priority: P0, P1, P2, P3
            deadline: Target completion date
            metadata: Additional metadata

        Returns:
            objective_id: Created objective ID
        """
        objective_id = f"obj_{uuid.uuid4().hex[:12]}"

        logger.info(f"Creating business objective: {title}")

        self.kuzu.execute("""
            CREATE (obj:BusinessObjective {
                objective_id: $objective_id,
                title: $title,
                description: $description,
                department: $department,
                stakeholders: $stakeholders,
                success_criteria: $success_criteria,
                business_value: $business_value,
                priority: $priority,
                status: $status,
                created_at: $created_at,
                deadline: $deadline,
                metadata: $metadata
            })
        """, {
            "objective_id": objective_id,
            "title": title,
            "description": description,
            "department": department,
            "stakeholders": json.dumps(stakeholders),
            "success_criteria": success_criteria,
            "business_value": business_value,
            "priority": priority,
            "status": "active",
            "created_at": datetime.now(),
            "deadline": deadline or datetime(2099, 12, 31),
            "metadata": json.dumps(metadata or {})
        })

        logger.info(f"✓ Created objective: {objective_id}")
        return objective_id

    async def link_objective_to_product(
        self,
        objective_id: str,
        product_id: str,
        priority: str = "P1",
        justification: str = "",
        estimated_roi: str = ""
    ) -> bool:
        """
        Link business objective to data product

        Args:
            objective_id: Business objective ID
            product_id: Data product ID
            priority: Priority of this relationship
            justification: Why this product addresses the objective
            estimated_roi: Expected ROI from this product

        Returns:
            bool: Success status
        """
        logger.info(f"Linking objective {objective_id} → product {product_id}")

        self.kuzu.execute("""
            MATCH (obj:BusinessObjective {objective_id: $objective_id})
            MATCH (dp:DataProduct {product_id: $product_id})
            CREATE (obj)-[:REQUIRES {
                priority: $priority,
                deadline: $deadline,
                created_at: $created_at,
                justification: $justification,
                estimated_roi: $estimated_roi,
                metadata: $metadata
            }]->(dp)
        """, {
            "objective_id": objective_id,
            "product_id": product_id,
            "priority": priority,
            "deadline": datetime.now(),
            "created_at": datetime.now(),
            "justification": justification,
            "estimated_roi": estimated_roi,
            "metadata": "{}"
        })

        logger.info(f"✓ Linked objective to product")
        return True

    async def get_objectives_for_product(self, product_id: str) -> List[Dict]:
        """
        Get all business objectives requiring a data product

        Args:
            product_id: Data product ID

        Returns:
            List of objectives with relationship metadata
        """
        result = self.kuzu.execute("""
            MATCH (obj:BusinessObjective)-[r:REQUIRES]->(dp:DataProduct {product_id: $product_id})
            RETURN
                obj.objective_id,
                obj.title,
                obj.description,
                obj.business_value,
                obj.priority,
                obj.status,
                r.justification,
                r.estimated_roi
        """, {"product_id": product_id})

        objectives = []
        while result.has_next():
            row = result.get_next()
            objectives.append({
                "objective_id": row[0],
                "title": row[1],
                "description": row[2],
                "business_value": row[3],
                "priority": row[4],
                "status": row[5],
                "justification": row[6],
                "estimated_roi": row[7]
            })

        return objectives

    # ============================================================
    # Business Metric Management
    # ============================================================

    async def create_business_metric(
        self,
        metric_name: str,
        definition: str,
        calculation_logic: str,
        target_value: float,
        current_value: float = 0.0,
        unit: str = "",
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Create a new business metric

        Args:
            metric_name: Metric name (e.g., "Monthly Churn Rate")
            definition: Business definition
            calculation_logic: How to calculate
            target_value: Target value to achieve
            current_value: Current value
            unit: Unit of measurement ("%", "$", "count", etc.)
            metadata: Additional metadata

        Returns:
            metric_id: Created metric ID
        """
        metric_id = f"metric_{uuid.uuid4().hex[:12]}"

        # Determine trend
        if current_value < target_value:
            trend = "needs_improvement"
        elif current_value == target_value:
            trend = "on_target"
        else:
            trend = "exceeding_target"

        logger.info(f"Creating business metric: {metric_name}")

        self.kuzu.execute("""
            CREATE (m:BusinessMetric {
                metric_id: $metric_id,
                metric_name: $metric_name,
                definition: $definition,
                calculation_logic: $calculation_logic,
                target_value: $target_value,
                current_value: $current_value,
                trend: $trend,
                unit: $unit,
                created_at: $created_at,
                last_updated: $last_updated,
                metadata: $metadata
            })
        """, {
            "metric_id": metric_id,
            "metric_name": metric_name,
            "definition": definition,
            "calculation_logic": calculation_logic,
            "target_value": target_value,
            "current_value": current_value,
            "trend": trend,
            "unit": unit,
            "created_at": datetime.now(),
            "last_updated": datetime.now(),
            "metadata": json.dumps(metadata or {})
        })

        logger.info(f"✓ Created metric: {metric_id}")
        return metric_id

    async def link_metric_to_column(
        self,
        metric_id: str,
        column_fqn: str,
        aggregation: str,
        filters: str = "",
        confidence: float = 1.0
    ) -> bool:
        """
        Link business metric to data column that measures it

        Args:
            metric_id: Business metric ID
            column_fqn: Fully qualified column name
            aggregation: Aggregation function (AVG, SUM, COUNT, etc.)
            filters: SQL filters applied
            confidence: Confidence in this measurement (0.0-1.0)

        Returns:
            bool: Success status
        """
        logger.info(f"Linking metric {metric_id} → column {column_fqn}")

        # Create example calculation
        calculation_example = f"{aggregation}({column_fqn})"
        if filters:
            calculation_example += f" WHERE {filters}"

        self.kuzu.execute("""
            MATCH (m:BusinessMetric {metric_id: $metric_id})
            MATCH (c:DataColumn {column_fqn: $column_fqn})
            CREATE (m)-[:MEASURED_BY {
                aggregation: $aggregation,
                filters: $filters,
                confidence: $confidence,
                calculation_example: $calculation_example,
                metadata: $metadata
            }]->(c)
        """, {
            "metric_id": metric_id,
            "column_fqn": column_fqn,
            "aggregation": aggregation,
            "filters": filters,
            "confidence": confidence,
            "calculation_example": calculation_example,
            "metadata": "{}"
        })

        logger.info(f"✓ Linked metric to column")
        return True

    async def update_metric_value(
        self,
        metric_id: str,
        current_value: float
    ) -> bool:
        """
        Update current value of a business metric

        Args:
            metric_id: Business metric ID
            current_value: New current value

        Returns:
            bool: Success status
        """
        # Get target value to determine trend
        result = self.kuzu.execute("""
            MATCH (m:BusinessMetric {metric_id: $metric_id})
            RETURN m.target_value
        """, {"metric_id": metric_id})

        if not result.has_next():
            logger.error(f"Metric {metric_id} not found")
            return False

        target_value = result.get_next()[0]

        # Determine trend
        if current_value < target_value:
            trend = "needs_improvement"
        elif current_value == target_value:
            trend = "on_target"
        else:
            trend = "exceeding_target"

        # Update metric
        self.kuzu.execute("""
            MATCH (m:BusinessMetric {metric_id: $metric_id})
            SET m.current_value = $current_value,
                m.trend = $trend,
                m.last_updated = $last_updated
        """, {
            "metric_id": metric_id,
            "current_value": current_value,
            "trend": trend,
            "last_updated": datetime.now()
        })

        logger.info(f"✓ Updated metric {metric_id}: {current_value} (trend: {trend})")
        return True

    # ============================================================
    # Business Question Management
    # ============================================================

    async def capture_business_question(
        self,
        question_text: str,
        personas: List[str],
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Capture a common business question with semantic embedding

        Args:
            question_text: The business question
            personas: Who typically asks this (e.g., ["VP Sales", "Analyst"])
            metadata: Additional metadata

        Returns:
            question_id: Created question ID
        """
        question_id = f"q_{uuid.uuid4().hex[:12]}"

        # Generate embedding if LLM service available
        embedding_str = ""
        if self.llm:
            try:
                embedding = await self.llm.embed(question_text)
                embedding_str = json.dumps(embedding.tolist())
            except Exception as e:
                logger.warning(f"Could not generate embedding: {e}")
                embedding_str = "[]"
        else:
            embedding_str = "[]"

        logger.info(f"Capturing business question: {question_text}")

        self.kuzu.execute("""
            CREATE (q:BusinessQuestion {
                question_id: $question_id,
                question_text: $question_text,
                embedding: $embedding,
                frequency: $frequency,
                personas: $personas,
                created_at: $created_at,
                last_asked: $last_asked,
                metadata: $metadata
            })
        """, {
            "question_id": question_id,
            "question_text": question_text,
            "embedding": embedding_str,
            "frequency": 1,
            "personas": json.dumps(personas),
            "created_at": datetime.now(),
            "last_asked": datetime.now(),
            "metadata": json.dumps(metadata or {})
        })

        logger.info(f"✓ Captured question: {question_id}")
        return question_id

    async def link_question_to_product(
        self,
        question_id: str,
        product_id: str,
        confidence: float,
        example_sql: str = "",
        typical_response_time_ms: int = 0
    ) -> bool:
        """
        Link business question to data product that answers it

        Args:
            question_id: Business question ID
            product_id: Data product ID
            confidence: Confidence this product answers the question (0.0-1.0)
            example_sql: Example SQL query
            typical_response_time_ms: Typical response time in milliseconds

        Returns:
            bool: Success status
        """
        logger.info(f"Linking question {question_id} → product {product_id}")

        self.kuzu.execute("""
            MATCH (q:BusinessQuestion {question_id: $question_id})
            MATCH (dp:DataProduct {product_id: $product_id})
            CREATE (q)-[:ANSWERED_BY {
                confidence: $confidence,
                example_sql: $example_sql,
                typical_response_time_ms: $typical_response_time_ms,
                success_rate: $success_rate,
                created_at: $created_at,
                metadata: $metadata
            }]->(dp)
        """, {
            "question_id": question_id,
            "product_id": product_id,
            "confidence": confidence,
            "example_sql": example_sql,
            "typical_response_time_ms": typical_response_time_ms,
            "success_rate": 1.0,
            "created_at": datetime.now(),
            "metadata": "{}"
        })

        logger.info(f"✓ Linked question to product")
        return True

    async def find_products_for_question(
        self,
        question_text: str,
        top_k: int = 5
    ) -> List[Dict]:
        """
        Find data products that can answer a business question
        Uses semantic search if embeddings available

        Args:
            question_text: Business question
            top_k: Number of top results to return

        Returns:
            List of matching data products with confidence scores
        """
        # For now, use simple text matching
        # In production, would use semantic similarity with embeddings

        result = self.kuzu.execute("""
            MATCH (q:BusinessQuestion)-[r:ANSWERED_BY]->(dp:DataProduct)
            WHERE q.question_text CONTAINS $search_term
            RETURN
                dp.product_id,
                dp.product_name,
                q.question_text,
                r.confidence,
                r.example_sql,
                r.typical_response_time_ms
            ORDER BY r.confidence DESC
            LIMIT $top_k
        """, {
            "search_term": question_text.split()[0],  # Simple first-word match
            "top_k": top_k
        })

        products = []
        while result.has_next():
            row = result.get_next()
            products.append({
                "product_id": row[0],
                "product_name": row[1],
                "matched_question": row[2],
                "confidence": row[3],
                "example_sql": row[4],
                "typical_response_time_ms": row[5]
            })

        return products

    # ============================================================
    # Impact Tracking
    # ============================================================

    async def link_product_impact_to_metric(
        self,
        product_id: str,
        metric_id: str,
        impact_type: str,
        estimated_impact: float,
        validated: bool = False
    ) -> bool:
        """
        Track how a data product impacts a business metric

        Args:
            product_id: Data product ID
            metric_id: Business metric ID
            impact_type: "increases", "decreases", "stabilizes"
            estimated_impact: Estimated impact value
            validated: Whether impact has been validated

        Returns:
            bool: Success status
        """
        logger.info(f"Linking product {product_id} impact → metric {metric_id}")

        self.kuzu.execute("""
            MATCH (dp:DataProduct {product_id: $product_id})
            MATCH (m:BusinessMetric {metric_id: $metric_id})
            CREATE (dp)-[:IMPACTS {
                impact_type: $impact_type,
                estimated_impact: $estimated_impact,
                validated: $validated,
                validation_date: $validation_date,
                metadata: $metadata
            }]->(m)
        """, {
            "product_id": product_id,
            "metric_id": metric_id,
            "impact_type": impact_type,
            "estimated_impact": estimated_impact,
            "validated": validated,
            "validation_date": datetime.now() if validated else None,
            "metadata": "{}"
        })

        logger.info(f"✓ Linked product impact to metric")
        return True

    # ============================================================
    # Query & Discovery
    # ============================================================

    async def get_business_context_for_product(
        self,
        product_id: str
    ) -> Dict[str, Any]:
        """
        Get complete business context for a data product

        Args:
            product_id: Data product ID

        Returns:
            Dictionary with objectives, metrics, questions, and impacts
        """
        context = {
            "product_id": product_id,
            "objectives": [],
            "metrics_impacted": [],
            "questions_answered": []
        }

        # Get objectives requiring this product
        obj_result = self.kuzu.execute("""
            MATCH (obj:BusinessObjective)-[r:REQUIRES]->(dp:DataProduct {product_id: $product_id})
            RETURN
                obj.objective_id,
                obj.title,
                obj.business_value,
                obj.priority,
                r.estimated_roi
        """, {"product_id": product_id})

        while obj_result.has_next():
            row = obj_result.get_next()
            context["objectives"].append({
                "objective_id": row[0],
                "title": row[1],
                "business_value": row[2],
                "priority": row[3],
                "estimated_roi": row[4]
            })

        # Get metrics impacted
        metric_result = self.kuzu.execute("""
            MATCH (dp:DataProduct {product_id: $product_id})-[r:IMPACTS]->(m:BusinessMetric)
            RETURN
                m.metric_id,
                m.metric_name,
                m.current_value,
                m.target_value,
                r.impact_type,
                r.estimated_impact
        """, {"product_id": product_id})

        while metric_result.has_next():
            row = metric_result.get_next()
            context["metrics_impacted"].append({
                "metric_id": row[0],
                "metric_name": row[1],
                "current_value": row[2],
                "target_value": row[3],
                "impact_type": row[4],
                "estimated_impact": row[5]
            })

        # Get questions answered
        question_result = self.kuzu.execute("""
            MATCH (q:BusinessQuestion)-[r:ANSWERED_BY]->(dp:DataProduct {product_id: $product_id})
            RETURN
                q.question_id,
                q.question_text,
                r.confidence,
                q.frequency
        """, {"product_id": product_id})

        while question_result.has_next():
            row = question_result.get_next()
            context["questions_answered"].append({
                "question_id": row[0],
                "question_text": row[1],
                "confidence": row[2],
                "frequency": row[3]
            })

        return context

    # ============================================================
    # List and Query Methods
    # ============================================================

    async def list_business_objectives(self, filters: Optional[Dict] = None) -> List[Dict]:
        """
        List all business objectives with optional filters

        Args:
            filters: Optional filters (department, priority, status)

        Returns:
            List of business objectives
        """
        where_clauses = []
        params = {}

        if filters:
            if "department" in filters:
                where_clauses.append("obj.department = $department")
                params["department"] = filters["department"]
            if "priority" in filters:
                where_clauses.append("obj.priority = $priority")
                params["priority"] = filters["priority"]
            if "status" in filters:
                where_clauses.append("obj.status = $status")
                params["status"] = filters["status"]

        where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"

        query = f"""
            MATCH (obj:BusinessObjective)
            WHERE {where_clause}
            RETURN
                obj.objective_id,
                obj.title,
                obj.description,
                obj.department,
                obj.stakeholders,
                obj.success_criteria,
                obj.business_value,
                obj.priority,
                obj.status,
                obj.created_at,
                obj.deadline,
                obj.metadata
            ORDER BY obj.created_at DESC
        """

        result = self.kuzu.execute(query, params)
        objectives = []

        while result.has_next():
            row = result.get_next()
            stakeholders_str = row[4] if row[4] else "[]"
            stakeholders = json.loads(stakeholders_str) if isinstance(stakeholders_str, str) else stakeholders_str

            metadata_str = row[11] if row[11] else "{}"
            metadata = json.loads(metadata_str) if isinstance(metadata_str, str) else metadata_str

            objectives.append({
                "objective_id": row[0],
                "title": row[1],
                "description": row[2],
                "department": row[3],
                "stakeholders": stakeholders,
                "success_criteria": row[5],
                "business_value": row[6],
                "priority": row[7],
                "status": row[8],
                "created_at": row[9],
                "deadline": row[10],
                "metadata": metadata
            })

        return objectives

    async def get_business_objective(self, objective_id: str) -> Optional[Dict]:
        """
        Get a single business objective by ID

        Args:
            objective_id: Objective identifier

        Returns:
            Business objective details or None
        """
        result = self.kuzu.execute("""
            MATCH (obj:BusinessObjective {objective_id: $objective_id})
            RETURN
                obj.objective_id,
                obj.title,
                obj.description,
                obj.department,
                obj.stakeholders,
                obj.success_criteria,
                obj.business_value,
                obj.priority,
                obj.status,
                obj.created_at,
                obj.deadline,
                obj.metadata
        """, {"objective_id": objective_id})

        if not result.has_next():
            return None

        row = result.get_next()
        stakeholders_str = row[4] if row[4] else "[]"
        stakeholders = json.loads(stakeholders_str) if isinstance(stakeholders_str, str) else stakeholders_str

        metadata_str = row[11] if row[11] else "{}"
        metadata = json.loads(metadata_str) if isinstance(metadata_str, str) else metadata_str

        return {
            "objective_id": row[0],
            "title": row[1],
            "description": row[2],
            "department": row[3],
            "stakeholders": stakeholders,
            "success_criteria": row[5],
            "business_value": row[6],
            "priority": row[7],
            "status": row[8],
            "created_at": row[9],
            "deadline": row[10],
            "metadata": metadata
        }

    async def get_products_for_objective(self, objective_id: str) -> List[Dict]:
        """
        Get all data products linked to an objective

        Args:
            objective_id: Objective identifier

        Returns:
            List of data products with relationship metadata
        """
        result = self.kuzu.execute("""
            MATCH (obj:BusinessObjective {objective_id: $objective_id})-[r:REQUIRES]->(dp:DataProduct)
            RETURN
                dp.product_id,
                dp.product_name,
                r.priority,
                r.deadline,
                r.justification,
                r.estimated_roi,
                r.created_at
            ORDER BY r.priority
        """, {"objective_id": objective_id})

        products = []
        while result.has_next():
            row = result.get_next()
            products.append({
                "product_id": row[0],
                "product_name": row[1],
                "priority": row[2],
                "deadline": row[3],
                "justification": row[4],
                "estimated_roi": row[5],
                "linked_at": row[6]
            })

        return products

    async def list_business_metrics(self, filters: Optional[Dict] = None) -> List[Dict]:
        """
        List all business metrics with optional filters

        Args:
            filters: Optional filters (trend)

        Returns:
            List of business metrics
        """
        where_clauses = []
        params = {}

        if filters and "trend" in filters:
            where_clauses.append("m.trend = $trend")
            params["trend"] = filters["trend"]

        where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"

        query = f"""
            MATCH (m:BusinessMetric)
            WHERE {where_clause}
            RETURN
                m.metric_id,
                m.metric_name,
                m.definition,
                m.calculation_logic,
                m.target_value,
                m.current_value,
                m.trend,
                m.unit,
                m.created_at,
                m.last_updated,
                m.metadata
            ORDER BY m.created_at DESC
        """

        result = self.kuzu.execute(query, params)
        metrics = []

        while result.has_next():
            row = result.get_next()
            metadata_str = row[10] if row[10] else "{}"
            metadata = json.loads(metadata_str) if isinstance(metadata_str, str) else metadata_str

            metrics.append({
                "metric_id": row[0],
                "metric_name": row[1],
                "definition": row[2],
                "calculation_logic": row[3],
                "target_value": row[4],
                "current_value": row[5],
                "trend": row[6],
                "unit": row[7],
                "created_at": row[8],
                "last_updated": row[9],
                "metadata": metadata
            })

        return metrics

    async def get_business_metric(self, metric_id: str) -> Optional[Dict]:
        """
        Get a single business metric by ID

        Args:
            metric_id: Metric identifier

        Returns:
            Business metric details or None
        """
        result = self.kuzu.execute("""
            MATCH (m:BusinessMetric {metric_id: $metric_id})
            RETURN
                m.metric_id,
                m.metric_name,
                m.definition,
                m.calculation_logic,
                m.target_value,
                m.current_value,
                m.trend,
                m.unit,
                m.created_at,
                m.last_updated,
                m.metadata
        """, {"metric_id": metric_id})

        if not result.has_next():
            return None

        row = result.get_next()
        metadata_str = row[10] if row[10] else "{}"
        metadata = json.loads(metadata_str) if isinstance(metadata_str, str) else metadata_str

        return {
            "metric_id": row[0],
            "metric_name": row[1],
            "definition": row[2],
            "calculation_logic": row[3],
            "target_value": row[4],
            "current_value": row[5],
            "trend": row[6],
            "unit": row[7],
            "created_at": row[8],
            "last_updated": row[9],
            "metadata": metadata
        }

    async def list_business_questions(self, filters: Optional[Dict] = None) -> List[Dict]:
        """
        List all business questions with optional filters

        Args:
            filters: Optional filters (persona)

        Returns:
            List of business questions
        """
        where_clauses = []
        params = {}

        if filters and "persona" in filters:
            where_clauses.append("q.personas CONTAINS $persona")
            params["persona"] = filters["persona"]

        where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"

        query = f"""
            MATCH (q:BusinessQuestion)
            WHERE {where_clause}
            RETURN
                q.question_id,
                q.question_text,
                q.frequency,
                q.personas,
                q.created_at,
                q.last_asked,
                q.metadata
            ORDER BY q.frequency DESC
        """

        result = self.kuzu.execute(query, params)
        questions = []

        while result.has_next():
            row = result.get_next()
            personas_str = row[3] if row[3] else "[]"
            personas = json.loads(personas_str) if isinstance(personas_str, str) else personas_str

            metadata_str = row[6] if row[6] else "{}"
            metadata = json.loads(metadata_str) if isinstance(metadata_str, str) else metadata_str

            questions.append({
                "question_id": row[0],
                "question_text": row[1],
                "frequency": row[2],
                "personas": personas,
                "created_at": row[4],
                "last_asked": row[5],
                "metadata": metadata
            })

        return questions

    async def get_stats(self) -> Dict[str, int]:
        """
        Get statistics about business context data

        Returns:
            Dictionary with counts of objectives, metrics, questions
        """
        stats = {
            "objectives": 0,
            "metrics": 0,
            "questions": 0,
            "objective_product_links": 0,
            "metric_column_links": 0,
            "question_product_links": 0
        }

        # Count objectives
        result = self.kuzu.execute("MATCH (obj:BusinessObjective) RETURN COUNT(*)")
        if result.has_next():
            stats["objectives"] = result.get_next()[0]

        # Count metrics
        result = self.kuzu.execute("MATCH (m:BusinessMetric) RETURN COUNT(*)")
        if result.has_next():
            stats["metrics"] = result.get_next()[0]

        # Count questions
        result = self.kuzu.execute("MATCH (q:BusinessQuestion) RETURN COUNT(*)")
        if result.has_next():
            stats["questions"] = result.get_next()[0]

        # Count relationships
        result = self.kuzu.execute("MATCH ()-[r:REQUIRES]->() RETURN COUNT(*)")
        if result.has_next():
            stats["objective_product_links"] = result.get_next()[0]

        result = self.kuzu.execute("MATCH ()-[r:MEASURED_BY]->() RETURN COUNT(*)")
        if result.has_next():
            stats["metric_column_links"] = result.get_next()[0]

        result = self.kuzu.execute("MATCH ()-[r:ANSWERED_BY]->() RETURN COUNT(*)")
        if result.has_next():
            stats["question_product_links"] = result.get_next()[0]

        return stats


# ============================================================
# FastAPI-compatible Service Wrapper
# ============================================================

class BusinessContextEnrichmentService:
    """
    Standalone service wrapper for FastAPI integration
    Manages its own Kuzu connection
    """

    def __init__(self, kuzu_db_path: str = "./data/nexusone_knowledge.kuzu"):
        """Initialize service with Kuzu database connection"""
        self.db = kuzu.Database(kuzu_db_path)
        self.conn = kuzu.Connection(self.db)
        self.enricher = BusinessContextEnricher(self.conn, llm_service=None)

    # Delegate all methods to the enricher
    async def create_business_objective(self, *args, **kwargs):
        return await self.enricher.create_business_objective(*args, **kwargs)

    async def link_objective_to_product(self, *args, **kwargs):
        return await self.enricher.link_objective_to_product(*args, **kwargs)

    async def get_objectives_for_product(self, *args, **kwargs):
        return await self.enricher.get_objectives_for_product(*args, **kwargs)

    async def list_business_objectives(self, *args, **kwargs):
        return await self.enricher.list_business_objectives(*args, **kwargs)

    async def get_business_objective(self, *args, **kwargs):
        return await self.enricher.get_business_objective(*args, **kwargs)

    async def get_products_for_objective(self, *args, **kwargs):
        return await self.enricher.get_products_for_objective(*args, **kwargs)

    async def create_business_metric(self, *args, **kwargs):
        return await self.enricher.create_business_metric(*args, **kwargs)

    async def link_metric_to_column(self, *args, **kwargs):
        return await self.enricher.link_metric_to_column(*args, **kwargs)

    async def update_metric_value(self, *args, **kwargs):
        return await self.enricher.update_metric_value(*args, **kwargs)

    async def list_business_metrics(self, *args, **kwargs):
        return await self.enricher.list_business_metrics(*args, **kwargs)

    async def get_business_metric(self, *args, **kwargs):
        return await self.enricher.get_business_metric(*args, **kwargs)

    async def capture_business_question(self, *args, **kwargs):
        return await self.enricher.capture_business_question(*args, **kwargs)

    async def link_question_to_product(self, *args, **kwargs):
        return await self.enricher.link_question_to_product(*args, **kwargs)

    async def find_products_for_question(self, *args, **kwargs):
        return await self.enricher.find_products_for_question(*args, **kwargs)

    async def list_business_questions(self, *args, **kwargs):
        return await self.enricher.list_business_questions(*args, **kwargs)

    async def link_product_impact_to_metric(self, *args, **kwargs):
        return await self.enricher.link_product_impact_to_metric(*args, **kwargs)

    async def get_business_context_for_product(self, *args, **kwargs):
        return await self.enricher.get_business_context_for_product(*args, **kwargs)

    async def get_stats(self, *args, **kwargs):
        return await self.enricher.get_stats(*args, **kwargs)
