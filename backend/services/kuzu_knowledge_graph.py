"""
Kuzu Knowledge Graph Service for NexusOne
Embedded graph database for contracts, products, patterns, and relationships
"""

import kuzu
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class KuzuKnowledgeGraph:
    """
    Lightweight knowledge graph using Kuzu embedded database
    No separate server needed - just a local database file
    """

    def __init__(self, db_path: str = "./data/nexusone_knowledge.kuzu"):
        """Initialize Kuzu database connection"""
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            self.db = kuzu.Database(str(self.db_path))
            self.conn = kuzu.Connection(self.db)
            logger.info(f"✅ Kuzu database initialized at {self.db_path}")

            # Initialize schema if needed
            self._init_schema()

        except Exception as e:
            logger.error(f"Failed to initialize Kuzu database: {e}")
            raise

    def _init_schema(self):
        """Initialize the knowledge graph schema"""
        try:
            # Check if schema already exists
            existing_tables = self._get_existing_tables()

            if "DataContract" in existing_tables:
                logger.info("Schema already initialized")
                return

            logger.info("Initializing Kuzu schema...")

            # Create node tables
            self._create_node_tables()

            # Create relationship tables
            self._create_relationship_tables()

            logger.info("✅ Kuzu schema initialized successfully")

        except Exception as e:
            logger.error(f"Schema initialization failed: {e}")
            raise

    def _get_existing_tables(self) -> List[str]:
        """Get list of existing tables"""
        try:
            result = self.conn.execute("CALL show_tables() RETURN *;")
            tables = []
            while result.has_next():
                row = result.get_next()
                tables.append(row[0])  # Table name is first column
            return tables
        except Exception:
            return []

    def _create_node_tables(self):
        """Create node type tables"""

        # DataContract node - represents ODCS contracts
        self.conn.execute("""
            CREATE NODE TABLE DataContract(
                id STRING,
                name STRING,
                domain STRING,
                version STRING,
                schema STRING,
                quality_rules STRING,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                created_by STRING,
                success_rate DOUBLE,
                usage_count INT64,
                metadata STRING,
                PRIMARY KEY(id)
            )
        """)
        logger.info("Created DataContract node table")

        # DataProduct node - represents ODPS products
        self.conn.execute("""
            CREATE NODE TABLE DataProduct(
                id STRING,
                name STRING,
                contract_id STRING,
                delivery_type STRING,
                implementation STRING,
                created_at TIMESTAMP,
                deployed_at TIMESTAMP,
                usage_count INT64,
                avg_performance DOUBLE,
                status STRING,
                metadata STRING,
                PRIMARY KEY(id)
            )
        """)
        logger.info("Created DataProduct node table")

        # Pattern node - represents reusable patterns
        self.conn.execute("""
            CREATE NODE TABLE Pattern(
                id STRING,
                name STRING,
                category STRING,
                domain STRING,
                template STRING,
                description STRING,
                success_metrics STRING,
                reuse_count INT64,
                created_at TIMESTAMP,
                last_used_at TIMESTAMP,
                avg_success_rate DOUBLE,
                metadata STRING,
                PRIMARY KEY(id)
            )
        """)
        logger.info("Created Pattern node table")

        # BusinessTerm node - business glossary
        self.conn.execute("""
            CREATE NODE TABLE BusinessTerm(
                id STRING,
                term STRING,
                definition STRING,
                domain STRING,
                related_fields STRING,
                synonyms STRING,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                metadata STRING,
                PRIMARY KEY(id)
            )
        """)
        logger.info("Created BusinessTerm node table")

        # QualityRule node - reusable quality rules
        self.conn.execute("""
            CREATE NODE TABLE QualityRule(
                id STRING,
                rule_type STRING,
                expectation_type STRING,
                description STRING,
                parameters STRING,
                severity STRING,
                domain STRING,
                reuse_count INT64,
                success_rate DOUBLE,
                metadata STRING,
                PRIMARY KEY(id)
            )
        """)
        logger.info("Created QualityRule node table")

    def _create_relationship_tables(self):
        """Create relationship type tables"""

        # Product implements Contract
        self.conn.execute("""
            CREATE REL TABLE IMPLEMENTS(
                FROM DataProduct TO DataContract,
                implementation_date TIMESTAMP,
                conformance_score DOUBLE,
                metadata STRING
            )
        """)
        logger.info("Created IMPLEMENTS relationship table")

        # Product uses Pattern
        self.conn.execute("""
            CREATE REL TABLE USES_PATTERN(
                FROM DataProduct TO Pattern,
                confidence DOUBLE,
                applied_date TIMESTAMP,
                success BOOL,
                metadata STRING
            )
        """)
        logger.info("Created USES_PATTERN relationship table")

        # Contract derived from another Contract
        self.conn.execute("""
            CREATE REL TABLE DERIVED_FROM(
                FROM DataContract TO DataContract,
                relationship_type STRING,
                similarity_score DOUBLE,
                metadata STRING
            )
        """)
        logger.info("Created DERIVED_FROM relationship table")

        # Contract maps to Business Term
        self.conn.execute("""
            CREATE REL TABLE MAPS_TO(
                FROM DataContract TO BusinessTerm,
                field_name STRING,
                confidence DOUBLE,
                verified BOOL,
                metadata STRING
            )
        """)
        logger.info("Created MAPS_TO relationship table")

        # Pattern depends on other Pattern
        self.conn.execute("""
            CREATE REL TABLE DEPENDS_ON(
                FROM Pattern TO Pattern,
                dependency_type STRING,
                is_required BOOL,
                metadata STRING
            )
        """)
        logger.info("Created DEPENDS_ON relationship table")

        # Contract uses Quality Rule
        self.conn.execute("""
            CREATE REL TABLE USES_QUALITY_RULE(
                FROM DataContract TO QualityRule,
                applied_date TIMESTAMP,
                pass_rate DOUBLE,
                is_active BOOL,
                metadata STRING
            )
        """)
        logger.info("Created USES_QUALITY_RULE relationship table")

    # ========================================================================
    # Data Contract Operations
    # ========================================================================

    def create_contract(
        self,
        contract_id: str,
        name: str,
        domain: str,
        schema: Dict[str, Any],
        quality_rules: List[Dict[str, Any]],
        version: str = "1.0.0",
        created_by: str = "system",
        success_rate: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new data contract node"""
        try:
            # Extract success_rate from metadata if not provided directly
            if success_rate is None and metadata and "success_rate" in metadata:
                success_rate = float(metadata.get("success_rate", 0.0))
            elif success_rate is None:
                success_rate = 0.0

            self.conn.execute(
                """
                CREATE (c:DataContract {
                    id: $id,
                    name: $name,
                    domain: $domain,
                    version: $version,
                    schema: $schema,
                    quality_rules: $quality_rules,
                    created_at: $created_at,
                    updated_at: $updated_at,
                    created_by: $created_by,
                    success_rate: $success_rate,
                    usage_count: $usage_count,
                    metadata: $metadata
                })
                """,
                {
                    "id": contract_id,
                    "name": name,
                    "domain": domain,
                    "version": version,
                    "schema": json.dumps(schema),
                    "quality_rules": json.dumps(quality_rules),
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "created_by": created_by,
                    "success_rate": success_rate,
                    "usage_count": 0,
                    "metadata": json.dumps(metadata or {})
                }
            )

            logger.info(f"✅ Created contract: {name} ({contract_id})")
            return {"success": True, "contract_id": contract_id}

        except Exception as e:
            logger.error(f"Failed to create contract: {e}")
            raise

    def find_similar_contracts(
        self,
        domain: str,
        schema_fields: List[str],
        min_success_rate: float = 0.8,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find similar successful contracts in the domain
        Uses simple field overlap for MVP - can be enhanced with embeddings later
        """
        try:
            result = self.conn.execute(
                """
                MATCH (c:DataContract)
                WHERE c.domain = $domain AND c.success_rate >= $min_success_rate
                RETURN c.id, c.name, c.domain, c.schema, c.quality_rules, c.success_rate,
                       c.usage_count, c.version
                ORDER BY c.success_rate DESC, c.usage_count DESC
                LIMIT $limit
                """,
                {
                    "domain": domain,
                    "min_success_rate": min_success_rate,
                    "limit": limit
                }
            )

            contracts = []
            while result.has_next():
                row = result.get_next()
                contract = {
                    "id": row[0],
                    "name": row[1],
                    "domain": row[2],
                    "schema": json.loads(row[3]) if row[3] else {},
                    "quality_rules": json.loads(row[4]) if row[4] else [],
                    "success_rate": row[5],
                    "usage_count": row[6],
                    "version": row[7],
                    "similarity_score": self._calculate_similarity(
                        schema_fields,
                        json.loads(row[3]) if row[3] else {}
                    )
                }
                contracts.append(contract)

            # Sort by similarity score
            contracts.sort(key=lambda x: x["similarity_score"], reverse=True)

            logger.info(f"Found {len(contracts)} similar contracts in {domain}")
            return contracts

        except Exception as e:
            logger.error(f"Failed to find similar contracts: {e}")
            return []

    def _calculate_similarity(
        self,
        fields1: List[str],
        schema2: Dict[str, Any]
    ) -> float:
        """
        Calculate field overlap similarity
        Simple Jaccard similarity for MVP
        """
        if not fields1 or not schema2:
            return 0.0

        fields2 = list(schema2.get("properties", {}).keys())
        if not fields2:
            return 0.0

        set1 = set(fields1)
        set2 = set(fields2)

        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))

        return intersection / union if union > 0 else 0.0

    # ========================================================================
    # Pattern Operations
    # ========================================================================

    def create_pattern(
        self,
        pattern_id: str,
        name: str,
        category: str,
        domain: str,
        template: Dict[str, Any],
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new pattern node"""
        try:
            self.conn.execute(
                """
                CREATE (p:Pattern {
                    id: $id,
                    name: $name,
                    category: $category,
                    domain: $domain,
                    template: $template,
                    description: $description,
                    success_metrics: $success_metrics,
                    reuse_count: $reuse_count,
                    created_at: $created_at,
                    last_used_at: $last_used_at,
                    avg_success_rate: $avg_success_rate,
                    metadata: $metadata
                })
                """,
                {
                    "id": pattern_id,
                    "name": name,
                    "category": category,
                    "domain": domain,
                    "template": json.dumps(template),
                    "description": description,
                    "success_metrics": json.dumps({}),
                    "reuse_count": 0,
                    "created_at": datetime.now(),
                    "last_used_at": datetime.now(),
                    "avg_success_rate": 0.0,
                    "metadata": json.dumps(metadata or {})
                }
            )

            logger.info(f"✅ Created pattern: {name} ({pattern_id})")
            return {"success": True, "pattern_id": pattern_id}

        except Exception as e:
            logger.error(f"Failed to create pattern: {e}")
            raise

    def find_applicable_patterns(
        self,
        domain: str,
        use_case: Optional[str] = None,
        data_sources: Optional[List[str]] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find patterns applicable to the given requirements
        """
        try:
            # Build query based on criteria
            where_clauses = ["p.domain = $domain"]
            params = {"domain": domain, "limit": limit}

            result = self.conn.execute(
                f"""
                MATCH (p:Pattern)
                WHERE {" AND ".join(where_clauses)}
                RETURN p.id, p.name, p.category, p.domain, p.template, p.description,
                       p.reuse_count, p.avg_success_rate
                ORDER BY p.avg_success_rate DESC, p.reuse_count DESC
                LIMIT $limit
                """,
                params
            )

            patterns = []
            while result.has_next():
                row = result.get_next()
                pattern = {
                    "id": row[0],
                    "name": row[1],
                    "category": row[2],
                    "domain": row[3],
                    "template": json.loads(row[4]) if row[4] else {},
                    "description": row[5],
                    "reuse_count": row[6],
                    "avg_success_rate": row[7],
                    "match_score": 0.8  # Placeholder for more sophisticated matching
                }
                patterns.append(pattern)

            logger.info(f"Found {len(patterns)} applicable patterns for {domain}")
            return patterns

        except Exception as e:
            logger.error(f"Failed to find applicable patterns: {e}")
            return []

    def find_pattern_combinations(
        self,
        pattern_id: str,
        max_depth: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Find patterns that are commonly used together with the given pattern
        """
        try:
            result = self.conn.execute(
                """
                MATCH (p1:Pattern {id: $pattern_id})
                MATCH (p2:Pattern)
                MATCH (dp:DataProduct)-[:USES_PATTERN]->(p1)
                MATCH (dp)-[:USES_PATTERN]->(p2)
                WHERE p1.id <> p2.id
                RETURN p2.id, p2.name, p2.domain, COUNT(dp) as usage_count
                ORDER BY usage_count DESC
                LIMIT 5
                """,
                {"pattern_id": pattern_id}
            )

            combinations = []
            while result.has_next():
                row = result.get_next()
                combinations.append({
                    "pattern_id": row[0],
                    "pattern_name": row[1],
                    "domain": row[2],
                    "usage_count": row[3]
                })

            logger.info(f"Found {len(combinations)} pattern combinations")
            return combinations

        except Exception as e:
            logger.error(f"Failed to find pattern combinations: {e}")
            return []

    # ========================================================================
    # Impact Analysis
    # ========================================================================

    def analyze_contract_impact(
        self,
        contract_id: str,
        max_depth: int = 3
    ) -> Dict[str, Any]:
        """
        Analyze the impact of changes to a contract
        Traverses graph to find all dependent products and downstream contracts
        """
        try:
            # Find directly affected products
            directly_affected = self.conn.execute(
                """
                MATCH (c:DataContract {id: $contract_id})
                MATCH (p:DataProduct)-[:IMPLEMENTS]->(c)
                RETURN p.id, p.name, p.delivery_type, p.status
                """,
                {"contract_id": contract_id}
            )

            direct_products = []
            while directly_affected.has_next():
                row = directly_affected.get_next()
                direct_products.append({
                    "product_id": row[0],
                    "product_name": row[1],
                    "delivery_type": row[2],
                    "status": row[3]
                })

            # Find downstream contracts
            downstream = self.conn.execute(
                f"""
                MATCH (c1:DataContract {{id: $contract_id}})
                MATCH (c2:DataContract)-[:DERIVED_FROM*1..{max_depth}]->(c1)
                RETURN c2.id, c2.name, c2.domain
                """,
                {"contract_id": contract_id}
            )

            downstream_contracts = []
            while downstream.has_next():
                row = downstream.get_next()
                downstream_contracts.append({
                    "contract_id": row[0],
                    "contract_name": row[1],
                    "domain": row[2]
                })

            # Calculate impact summary
            impact = {
                "directly_affected_products": direct_products,
                "downstream_contracts": downstream_contracts,
                "total_affected_count": len(direct_products) + len(downstream_contracts),
                "affected_domains": list(set(dc["domain"] for dc in downstream_contracts)),
                "is_breaking": len(direct_products) > 0,
                "risk_level": "high" if len(direct_products) > 3 else "medium" if len(direct_products) > 0 else "low"
            }

            logger.info(f"Impact analysis for {contract_id}: {impact['total_affected_count']} affected items")
            return impact

        except Exception as e:
            logger.error(f"Failed to analyze contract impact: {e}")
            return {
                "error": str(e),
                "directly_affected_products": [],
                "downstream_contracts": [],
                "total_affected_count": 0
            }

    # ========================================================================
    # Utility Methods
    # ========================================================================

    def get_graph_statistics(self) -> Dict[str, Any]:
        """Get statistics about the knowledge graph"""
        try:
            stats = {}

            # Count nodes by type
            for node_type in ["DataContract", "DataProduct", "Pattern", "BusinessTerm", "QualityRule"]:
                result = self.conn.execute(
                    f"MATCH (n:{node_type}) RETURN COUNT(n) as count"
                )
                if result.has_next():
                    stats[f"{node_type}_count"] = result.get_next()[0]

            # Count relationships
            for rel_type in ["IMPLEMENTS", "USES_PATTERN", "DERIVED_FROM", "MAPS_TO", "DEPENDS_ON"]:
                result = self.conn.execute(
                    f"MATCH ()-[r:{rel_type}]->() RETURN COUNT(r) as count"
                )
                if result.has_next():
                    stats[f"{rel_type}_count"] = result.get_next()[0]

            return stats

        except Exception as e:
            logger.error(f"Failed to get graph statistics: {e}")
            return {}

    def close(self):
        """Close database connection and release resources"""
        try:
            # Close connection and database to release file locks
            if hasattr(self, "conn") and self.conn is not None:
                del self.conn
                self.conn = None

            if hasattr(self, "db") and self.db is not None:
                del self.db
                self.db = None

            logger.info("✅ Kuzu connection and database closed")
        except Exception as e:
            logger.error(f"Error closing Kuzu connection: {e}")


# Singleton instance for application-wide use
_kg_instance: Optional[KuzuKnowledgeGraph] = None


def get_knowledge_graph() -> KuzuKnowledgeGraph:
    """Get or create the singleton Kuzu knowledge graph instance"""
    global _kg_instance
    if _kg_instance is None:
        _kg_instance = KuzuKnowledgeGraph()
    return _kg_instance
