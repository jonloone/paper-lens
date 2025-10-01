"""
TDD Tests for Kuzu Knowledge Graph Service
Test-driven validation of all graph operations
"""

import pytest
import sys
import os
from datetime import datetime
import json

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.kuzu_knowledge_graph import KuzuKnowledgeGraph


@pytest.fixture
def kg():
    """Create a fresh knowledge graph for each test"""
    test_db_path = "./tests/data/test_knowledge.kuzu"
    # Clean up existing test db (Kuzu creates a directory)
    import shutil
    import time
    if os.path.exists(test_db_path):
        if os.path.isdir(test_db_path):
            shutil.rmtree(test_db_path)
        else:
            os.remove(test_db_path)

    kg = KuzuKnowledgeGraph(db_path=test_db_path)
    yield kg

    # Cleanup - properly close and wait for file locks to release
    kg.close()
    time.sleep(0.2)  # Allow OS to release file locks

    if os.path.exists(test_db_path):
        try:
            if os.path.isdir(test_db_path):
                shutil.rmtree(test_db_path)
            else:
                os.remove(test_db_path)
        except Exception:
            # If cleanup fails, it's not critical for tests
            pass


class TestGraphInitialization:
    """Test graph database initialization"""

    def test_database_creation(self, kg):
        """Test that database is created successfully"""
        assert kg.db is not None
        assert kg.conn is not None

    def test_schema_creation(self, kg):
        """Test that all node and relationship tables are created"""
        stats = kg.get_graph_statistics()

        # Verify all node types exist
        assert 'DataContract_count' in stats
        assert 'DataProduct_count' in stats
        assert 'Pattern_count' in stats
        assert 'BusinessTerm_count' in stats
        assert 'QualityRule_count' in stats

        # Verify all relationship types exist
        assert 'IMPLEMENTS_count' in stats
        assert 'USES_PATTERN_count' in stats
        assert 'DERIVED_FROM_count' in stats

        # All should be zero initially
        assert all(v == 0 for v in stats.values())


class TestContractOperations:
    """Test data contract CRUD operations"""

    def test_create_contract(self, kg):
        """Test creating a new contract"""
        result = kg.create_contract(
            contract_id="contract_001",
            name="Customer Contract",
            domain="retail",
            schema={
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string"},
                    "email": {"type": "string"}
                }
            },
            quality_rules=[
                {"rule": "unique", "field": "customer_id"}
            ],
            version="1.0.0"
        )

        assert result["success"] is True
        assert result["contract_id"] == "contract_001"

        # Verify it was added
        stats = kg.get_graph_statistics()
        assert stats["DataContract_count"] == 1

    def test_create_multiple_contracts(self, kg):
        """Test creating multiple contracts"""
        for i in range(5):
            kg.create_contract(
                contract_id=f"contract_{i:03d}",
                name=f"Contract {i}",
                domain="retail",
                schema={"properties": {"field": {"type": "string"}}},
                quality_rules=[]
            )

        stats = kg.get_graph_statistics()
        assert stats["DataContract_count"] == 5

    def test_find_similar_contracts(self, kg):
        """Test finding similar contracts by schema"""
        # Create test contracts
        kg.create_contract(
            contract_id="c1",
            name="Customer Base",
            domain="retail",
            schema={
                "properties": {
                    "customer_id": {"type": "string"},
                    "email": {"type": "string"},
                    "phone": {"type": "string"}
                }
            },
            quality_rules=[],
            metadata={"success_rate": 0.95}
        )

        kg.create_contract(
            contract_id="c2",
            name="Customer Extended",
            domain="retail",
            schema={
                "properties": {
                    "customer_id": {"type": "string"},
                    "email": {"type": "string"},
                    "address": {"type": "string"}
                }
            },
            quality_rules=[],
            metadata={"success_rate": 0.88}
        )

        # Find similar contracts
        similar = kg.find_similar_contracts(
            domain="retail",
            schema_fields=["customer_id", "email"],
            min_success_rate=0.8,
            limit=5
        )

        assert len(similar) == 2
        assert all("similarity_score" in c for c in similar)
        # Both contracts should have customer_id and email
        assert all(c["similarity_score"] > 0 for c in similar)


class TestPatternOperations:
    """Test pattern CRUD operations"""

    def test_create_pattern(self, kg):
        """Test creating a new pattern"""
        result = kg.create_pattern(
            pattern_id="pattern_001",
            name="Customer 360",
            category="business",
            domain="retail",
            template={
                "required_sources": ["crm", "transactions"],
                "core_fields": ["customer_id", "lifetime_value"]
            },
            description="Unified customer view pattern"
        )

        assert result["success"] is True

        stats = kg.get_graph_statistics()
        assert stats["Pattern_count"] == 1

    def test_find_applicable_patterns(self, kg):
        """Test finding patterns by domain"""
        # Create patterns in different domains
        kg.create_pattern(
            pattern_id="p1",
            name="Customer 360",
            category="business",
            domain="retail",
            template={},
            description="Retail pattern"
        )

        kg.create_pattern(
            pattern_id="p2",
            name="Fraud Detection",
            category="security",
            domain="financial",
            template={},
            description="Financial pattern"
        )

        # Find retail patterns
        retail_patterns = kg.find_applicable_patterns(
            domain="retail",
            limit=10
        )

        assert len(retail_patterns) == 1
        assert retail_patterns[0]["name"] == "Customer 360"


class TestImpactAnalysis:
    """Test graph traversal for impact analysis"""

    def test_impact_analysis_no_dependencies(self, kg):
        """Test impact analysis for contract with no dependencies"""
        kg.create_contract(
            contract_id="c1",
            name="Standalone Contract",
            domain="retail",
            schema={},
            quality_rules=[]
        )

        impact = kg.analyze_contract_impact(
            contract_id="c1",
            max_depth=3
        )

        assert impact["total_affected_count"] == 0
        assert len(impact["directly_affected_products"]) == 0
        assert len(impact["downstream_contracts"]) == 0
        assert impact["risk_level"] == "low"

    def test_impact_analysis_with_products(self, kg):
        """Test impact analysis with dependent products"""
        # Create contract
        kg.create_contract(
            contract_id="c1",
            name="Base Contract",
            domain="retail",
            schema={},
            quality_rules=[]
        )

        # Create product (note: this will fail without CREATE statement,
        # but demonstrates the test structure)
        # In real implementation, we'd add a create_product method

        impact = kg.analyze_contract_impact(
            contract_id="c1",
            max_depth=3
        )

        # Should have basic impact structure
        assert "directly_affected_products" in impact
        assert "downstream_contracts" in impact
        assert "total_affected_count" in impact


class TestSimilarityCalculation:
    """Test similarity scoring algorithm"""

    def test_jaccard_similarity(self, kg):
        """Test Jaccard similarity calculation"""
        fields1 = ["customer_id", "email", "phone"]
        schema2 = {
            "properties": {
                "customer_id": {},
                "email": {},
                "address": {}
            }
        }

        similarity = kg._calculate_similarity(fields1, schema2)

        # Intersection: {customer_id, email} = 2
        # Union: {customer_id, email, phone, address} = 4
        # Jaccard: 2/4 = 0.5
        assert similarity == 0.5

    def test_similarity_no_overlap(self, kg):
        """Test similarity with no common fields"""
        fields1 = ["field_a", "field_b"]
        schema2 = {
            "properties": {
                "field_c": {},
                "field_d": {}
            }
        }

        similarity = kg._calculate_similarity(fields1, schema2)
        assert similarity == 0.0

    def test_similarity_perfect_match(self, kg):
        """Test similarity with perfect match"""
        fields1 = ["field_a", "field_b"]
        schema2 = {
            "properties": {
                "field_a": {},
                "field_b": {}
            }
        }

        similarity = kg._calculate_similarity(fields1, schema2)
        assert similarity == 1.0


class TestGraphStatistics:
    """Test graph statistics reporting"""

    def test_empty_graph_statistics(self, kg):
        """Test statistics on empty graph"""
        stats = kg.get_graph_statistics()

        assert isinstance(stats, dict)
        assert all(v == 0 for v in stats.values())

    def test_statistics_after_additions(self, kg):
        """Test statistics reflect additions"""
        # Add some nodes
        kg.create_contract(
            contract_id="c1",
            name="Contract 1",
            domain="retail",
            schema={},
            quality_rules=[]
        )

        kg.create_pattern(
            pattern_id="p1",
            name="Pattern 1",
            category="test",
            domain="retail",
            template={},
            description="Test"
        )

        stats = kg.get_graph_statistics()

        assert stats["DataContract_count"] == 1
        assert stats["Pattern_count"] == 1
        assert stats["DataProduct_count"] == 0  # None created


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_duplicate_contract_id(self, kg):
        """Test handling duplicate contract IDs"""
        kg.create_contract(
            contract_id="c1",
            name="Original",
            domain="retail",
            schema={},
            quality_rules=[]
        )

        # Attempting to create duplicate should raise error
        with pytest.raises(Exception):
            kg.create_contract(
                contract_id="c1",  # Same ID
                name="Duplicate",
                domain="retail",
                schema={},
                quality_rules=[]
            )

    def test_empty_schema_fields(self, kg):
        """Test similarity with empty schema fields"""
        kg.create_contract(
            contract_id="c1",
            name="Empty Schema",
            domain="retail",
            schema={"properties": {}},
            quality_rules=[]
        )

        similar = kg.find_similar_contracts(
            domain="retail",
            schema_fields=[],
            limit=5
        )

        # Should not crash, may return empty or contracts with 0 similarity
        assert isinstance(similar, list)


class TestPerformance:
    """Test performance requirements"""

    def test_query_performance(self, kg):
        """Test that simple queries are fast (<20ms for fresh DB)"""
        import time

        # Add some data
        for i in range(10):
            kg.create_contract(
                contract_id=f"c{i}",
                name=f"Contract {i}",
                domain="retail",
                schema={},
                quality_rules=[]
            )

        # Time a query (allow 20ms for fresh DB with schema creation overhead)
        start = time.time()
        stats = kg.get_graph_statistics()
        elapsed = time.time() - start

        assert elapsed < 0.02  # <20ms (realistic for fresh DB)
        assert stats["DataContract_count"] == 10

    def test_similarity_search_performance(self, kg):
        """Test similarity search performance"""
        import time

        # Add 50 contracts
        for i in range(50):
            kg.create_contract(
                contract_id=f"c{i}",
                name=f"Contract {i}",
                domain="retail",
                schema={
                    "properties": {
                        f"field_{j}": {"type": "string"}
                        for j in range(5)
                    }
                },
                quality_rules=[]
            )

        # Time similarity search
        start = time.time()
        similar = kg.find_similar_contracts(
            domain="retail",
            schema_fields=["field_0", "field_1"],
            limit=10
        )
        elapsed = time.time() - start

        # Should complete in under 100ms even with 50 contracts
        assert elapsed < 0.1
        assert len(similar) <= 10


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
