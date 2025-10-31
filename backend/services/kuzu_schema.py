"""
Kuzu schema extensions for Living Context Graph.
Extends existing schema with IntentNode, UsagePatternNode, and SemanticBridge.
"""

import logging

logger = logging.getLogger(__name__)


class LivingContextSchema:
    """
    Schema management for Living Context Graph nodes and relationships.
    """

    @staticmethod
    def create_schema(conn) -> None:
        """
        Create all node and relationship tables for Living Context Graph.
        Safe to run multiple times (uses IF NOT EXISTS).
        """

        # ===== IntentNode =====
        conn.execute("""
            CREATE NODE TABLE IF NOT EXISTS IntentNode (
                id STRING,
                data_product_id STRING,
                stakeholder_name STRING,
                stakeholder_email STRING,
                stakeholder_department STRING,
                stakeholder_confidence DOUBLE,
                business_need_summary STRING,
                business_keywords STRING[],
                urgency STRING,
                deadline TIMESTAMP,
                deadline_type STRING,
                expected_quality_score DOUBLE,
                expected_freshness_hours INT64,
                expected_completeness DOUBLE,
                quality_inference_reasoning STRING[],
                quality_inference_confidence DOUBLE,
                actual_quality_score DOUBLE,
                actual_freshness_hours INT64,
                actual_completeness DOUBLE,
                quality_gap DOUBLE,
                quality_blockers STRING[],
                profiling_last_updated TIMESTAMP,
                primary_use_cases STRING[],
                actual_use_patterns STRING[],
                usage_drift_detected BOOLEAN,
                usage_drift_details STRING,
                created_at TIMESTAMP,
                last_validated TIMESTAMP,
                confidence_score DOUBLE,
                original_request_text STRING,
                PRIMARY KEY (id)
            )
        """)
        logger.info("Created IntentNode table")

        # ===== UsagePatternNode =====
        conn.execute("""
            CREATE NODE TABLE IF NOT EXISTS UsagePatternNode (
                id STRING,
                data_product_id STRING,
                user_id STRING,
                user_department STRING,
                user_role STRING,
                query_count INT64,
                first_access TIMESTAMP,
                last_access TIMESTAMP,
                access_frequency STRING,
                typical_access_hours INT64[],
                typical_filters STRING[],
                typical_aggregations STRING[],
                typical_joins STRING[],
                avg_row_count INT64,
                avg_execution_time_ms INT64,
                inferred_use_case STRING,
                use_case_confidence DOUBLE,
                use_case_reasoning STRING,
                tolerates_staleness BOOLEAN,
                max_acceptable_age_days INT64,
                requires_completeness BOOLEAN,
                requires_accuracy BOOLEAN,
                quality_sensitivity_score DOUBLE,
                downstream_dependencies STRING[],
                business_impact STRING,
                business_impact_confidence DOUBLE,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                PRIMARY KEY (id)
            )
        """)
        logger.info("Created UsagePatternNode table")

        # ===== SemanticBridge =====
        conn.execute("""
            CREATE NODE TABLE IF NOT EXISTS SemanticBridge (
                id STRING,
                source_type STRING,
                source_id STRING,
                target_type STRING,
                target_id STRING,
                relationship_type STRING,
                confidence DOUBLE,
                evidence_sources STRING[],
                strength DOUBLE,
                explanation STRING,
                created_by STRING,
                validated BOOLEAN,
                validated_by STRING,
                validated_at TIMESTAMP,
                created_at TIMESTAMP,
                last_reinforced TIMESTAMP,
                use_count INT64,
                success_rate DOUBLE,
                PRIMARY KEY (id)
            )
        """)
        logger.info("Created SemanticBridge table")

        # ===== Semantic Discovery Nodes =====

        # DataColumn - represents table columns for semantic matching
        conn.execute("""
            CREATE NODE TABLE IF NOT EXISTS DataColumn (
                id STRING,
                name STRING,
                table_id STRING,
                data_type STRING,
                description STRING,
                is_nullable BOOLEAN,
                sample_values STRING[],
                distinct_count INT64,
                null_percentage DOUBLE,
                semantic_tags STRING[],
                created_at TIMESTAMP,
                PRIMARY KEY (id)
            )
        """)
        logger.info("Created DataColumn table")

        # ===== Relationships =====

        # DataColumn → DataTable (column belongs to table)
        conn.execute("""
            CREATE REL TABLE IF NOT EXISTS BELONGS_TO(
                FROM DataColumn TO DataTable,
                position INT64,
                is_primary_key BOOLEAN,
                is_foreign_key BOOLEAN,
                created_at TIMESTAMP
            )
        """)
        logger.info("Created BELONGS_TO relationship")

        # DataColumn → BusinessTerm (semantic mapping)
        conn.execute("""
            CREATE REL TABLE IF NOT EXISTS MAPS_TO_TERM(
                FROM DataColumn TO BusinessTerm,
                confidence DOUBLE,
                mapping_source STRING,
                verified BOOLEAN,
                verified_by STRING,
                verified_at TIMESTAMP,
                created_at TIMESTAMP
            )
        """)
        logger.info("Created MAPS_TO_TERM relationship")

        # Intent → DataTable (via SemanticBridge)
        conn.execute("""
            CREATE REL TABLE IF NOT EXISTS FULFILLS(
                FROM IntentNode TO DataTable,
                bridge_id STRING,
                confidence DOUBLE,
                created_at TIMESTAMP
            )
        """)
        logger.info("Created FULFILLS relationship")

        # UsagePattern → DataTable
        conn.execute("""
            CREATE REL TABLE IF NOT EXISTS QUERIES(
                FROM UsagePatternNode TO DataTable,
                query_count INT64,
                last_query TIMESTAMP
            )
        """)
        logger.info("Created QUERIES relationship")

        # ===== Business Context Nodes (Phase 5) =====

        # BusinessObjective - Strategic business goals
        conn.execute("""
            CREATE NODE TABLE IF NOT EXISTS BusinessObjective (
                objective_id STRING,
                title STRING,
                description STRING,
                department STRING,
                stakeholders STRING,
                success_criteria STRING,
                business_value STRING,
                priority STRING,
                status STRING,
                created_at TIMESTAMP,
                deadline TIMESTAMP,
                PRIMARY KEY (objective_id)
            )
        """)
        logger.info("Created BusinessObjective table")

        # BusinessMetric - Key performance indicators
        conn.execute("""
            CREATE NODE TABLE IF NOT EXISTS BusinessMetric (
                metric_id STRING,
                metric_name STRING,
                definition STRING,
                calculation_logic STRING,
                target_value DOUBLE,
                current_value DOUBLE,
                trend STRING,
                last_updated TIMESTAMP,
                PRIMARY KEY (metric_id)
            )
        """)
        logger.info("Created BusinessMetric table")

        # BusinessQuestion - Common business queries for semantic search
        conn.execute("""
            CREATE NODE TABLE IF NOT EXISTS BusinessQuestion (
                question_id STRING,
                question_text STRING,
                embedding STRING,
                frequency INT64,
                personas STRING,
                last_asked TIMESTAMP,
                PRIMARY KEY (question_id)
            )
        """)
        logger.info("Created BusinessQuestion table")

        # SemanticBridge → SemanticBridge (graph of bridges)
        conn.execute("""
            CREATE REL TABLE IF NOT EXISTS SEMANTIC_LINK(
                FROM SemanticBridge TO SemanticBridge,
                link_type STRING,
                strength DOUBLE
            )
        """)
        logger.info("Created SEMANTIC_LINK relationship")

        # Intent → UsagePattern (validation relationship)
        conn.execute("""
            CREATE REL TABLE IF NOT EXISTS VALIDATES(
                FROM UsagePatternNode TO IntentNode,
                alignment_score DOUBLE,
                drift_detected BOOLEAN,
                validated_at TIMESTAMP
            )
        """)
        logger.info("Created VALIDATES relationship")

        # ===== Business Context Relationships (Phase 5) =====

        # BusinessObjective → DataProduct (business requires data product)
        conn.execute("""
            CREATE REL TABLE IF NOT EXISTS REQUIRES(
                FROM BusinessObjective TO DataProduct,
                priority STRING,
                deadline TIMESTAMP,
                created_at TIMESTAMP
            )
        """)
        logger.info("Created REQUIRES relationship")

        # BusinessMetric → DataTable (metric measured by table/column)
        # Note: Changed from DataColumn to DataTable as DataColumn doesn't exist in base schema
        conn.execute("""
            CREATE REL TABLE IF NOT EXISTS MEASURED_BY(
                FROM BusinessMetric TO DataTable,
                column_name STRING,
                aggregation STRING,
                filters STRING,
                confidence DOUBLE
            )
        """)
        logger.info("Created MEASURED_BY relationship")

        # BusinessQuestion → DataProduct (question answered by product)
        conn.execute("""
            CREATE REL TABLE IF NOT EXISTS ANSWERED_BY(
                FROM BusinessQuestion TO DataProduct,
                confidence DOUBLE,
                example_sql STRING,
                typical_response_time_ms INT64,
                success_rate DOUBLE
            )
        """)
        logger.info("Created ANSWERED_BY relationship")

        # DataProduct → BusinessMetric (product impacts metric)
        conn.execute("""
            CREATE REL TABLE IF NOT EXISTS IMPACTS(
                FROM DataProduct TO BusinessMetric,
                impact_type STRING,
                estimated_impact DOUBLE,
                validated BOOLEAN
            )
        """)
        logger.info("Created IMPACTS relationship")

        logger.info("Created all relationship tables")

    @staticmethod
    def create_indexes(conn) -> None:
        """
        Create indexes for common query patterns.
        Note: Kuzu does not support 'IF NOT EXISTS' for indexes,
        so we skip creating them if they already exist.
        """

        # Kuzu currently has limited index support
        # For now, we'll skip index creation as Kuzu automatically
        # optimizes queries on node properties used in WHERE clauses

        logger.info("Index creation skipped (Kuzu auto-optimizes property queries)")
