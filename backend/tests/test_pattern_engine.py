"""
TDD Tests for Pattern Recommendation Engine
Test-driven development for Phase 4 implementation
"""

import pytest
import sys
import os
from datetime import datetime
import json

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.pattern_engine import PatternRecommendationEngine
from services.kuzu_knowledge_graph import KuzuKnowledgeGraph


@pytest.fixture
def kg():
    """Create a fresh knowledge graph with sample patterns"""
    test_db_path = "./tests/data/test_pattern_engine.kuzu"
    import shutil
    import time

    if os.path.exists(test_db_path):
        if os.path.isdir(test_db_path):
            shutil.rmtree(test_db_path)
        else:
            os.remove(test_db_path)

    kg = KuzuKnowledgeGraph(db_path=test_db_path)

    # Add sample patterns for testing
    kg.create_pattern(
        pattern_id="customer_360",
        name="Customer 360 View",
        category="business",
        domain="retail",
        template={
            "required_sources": ["crm", "transactions", "support"],
            "core_fields": ["customer_id", "lifetime_value", "segment"],
            "transformations": ["join_customer_data", "calculate_ltv", "assign_segment"]
        },
        description="Unified customer view combining all touchpoints"
    )

    kg.create_pattern(
        pattern_id="churn_prediction",
        name="Churn Prediction Model",
        category="analytics",
        domain="retail",
        template={
            "required_sources": ["transactions", "engagement", "support"],
            "core_fields": ["customer_id", "churn_score", "risk_factors"],
            "transformations": ["feature_engineering", "model_scoring"]
        },
        description="Predict customer churn risk"
    )

    kg.create_pattern(
        pattern_id="product_recommendation",
        name="Product Recommendation",
        category="analytics",
        domain="retail",
        template={
            "required_sources": ["transactions", "product_catalog"],
            "core_fields": ["customer_id", "recommended_products", "confidence"],
            "transformations": ["collaborative_filtering", "content_based_filtering"]
        },
        description="Personalized product recommendations"
    )

    # Financial domain pattern
    kg.create_pattern(
        pattern_id="fraud_detection",
        name="Fraud Detection",
        category="security",
        domain="financial",
        template={
            "required_sources": ["transactions", "user_behavior"],
            "core_fields": ["transaction_id", "fraud_score", "anomaly_flags"],
            "transformations": ["anomaly_detection", "risk_scoring"]
        },
        description="Real-time fraud detection"
    )

    yield kg

    # Cleanup
    kg.close()
    time.sleep(0.2)
    if os.path.exists(test_db_path):
        try:
            if os.path.isdir(test_db_path):
                shutil.rmtree(test_db_path)
            else:
                os.remove(test_db_path)
        except Exception:
            pass


@pytest.fixture
def engine(kg):
    """Create PatternRecommendationEngine with test knowledge graph"""
    from services.kag_intelligence import KAGIntelligence
    from services.vultr_llm_adapter import get_vultr_adapter

    kag = KAGIntelligence(knowledge_graph=kg, llm_adapter=get_vultr_adapter())
    return PatternRecommendationEngine(knowledge_graph=kg, kag_intelligence=kag)


class TestPatternDiscovery:
    """Test pattern discovery and matching"""

    @pytest.mark.asyncio
    async def test_find_patterns_by_domain(self, engine):
        """Test finding patterns by domain"""
        result = await engine.recommend_patterns(
            domain="retail",
            use_case="customer analytics",
            data_sources=["crm", "transactions"]
        )

        # Should find retail patterns
        assert len(result["patterns"]) > 0

        # All patterns should be from retail domain
        for pattern in result["patterns"]:
            assert pattern["domain"] == "retail"

        # Should not include financial patterns
        pattern_ids = [p["id"] for p in result["patterns"]]
        assert "fraud_detection" not in pattern_ids

    @pytest.mark.asyncio
    async def test_find_patterns_by_category(self, engine):
        """Test filtering patterns by category"""
        result = await engine.recommend_patterns(
            domain="retail",
            use_case="predictive analytics",
            categories=["analytics"]
        )

        # Should find analytics patterns
        assert len(result["patterns"]) > 0

        # All should be analytics category
        for pattern in result["patterns"]:
            assert pattern["category"] == "analytics"

    @pytest.mark.asyncio
    async def test_rank_patterns_by_relevance(self, engine):
        """Test patterns are ranked by relevance"""
        result = await engine.recommend_patterns(
            domain="retail",
            use_case="customer lifetime value calculation",
            data_sources=["crm", "transactions", "support"]
        )

        patterns = result["patterns"]
        assert len(patterns) > 0

        # First pattern should have highest relevance score
        if len(patterns) > 1:
            assert patterns[0]["relevance_score"] >= patterns[1]["relevance_score"]


class TestPatternCombinations:
    """Test pattern combination discovery"""

    @pytest.mark.asyncio
    async def test_find_pattern_combinations(self, engine):
        """Test finding patterns commonly used together"""
        # TODO: Need to create data products with pattern relationships first
        result = await engine.find_pattern_combinations(
            pattern_id="customer_360"
        )

        # Should return combinations structure
        assert "combinations" in result
        assert isinstance(result["combinations"], list)

    @pytest.mark.asyncio
    async def test_pattern_dependencies(self, engine):
        """Test finding dependent patterns"""
        result = await engine.find_pattern_dependencies(
            pattern_id="churn_prediction"
        )

        # Should return dependencies structure
        assert "dependencies" in result
        assert isinstance(result["dependencies"], list)


class TestPatternLearning:
    """Test pattern learning from implementations"""

    @pytest.mark.asyncio
    async def test_extract_pattern_from_successful_contract(self, engine, kg):
        """Test extracting new pattern from successful implementation"""
        # Create a successful contract
        kg.create_contract(
            contract_id="successful_segmentation",
            name="Customer Segmentation Contract",
            domain="retail",
            schema={
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string"},
                    "segment": {"type": "string"},
                    "segment_score": {"type": "number"}
                }
            },
            quality_rules=[
                {"rule": "unique", "field": "customer_id"}
            ],
            success_rate=0.92,
            version="1.0.0"
        )

        # Extract pattern from this contract
        result = await engine.extract_pattern_from_contract(
            contract_id="successful_segmentation",
            min_success_rate=0.85
        )

        # Should extract pattern if success rate is high enough
        assert result["success"] is True
        if result.get("pattern_extracted"):
            assert "pattern_id" in result

    @pytest.mark.asyncio
    async def test_update_pattern_metrics(self, engine, kg):
        """Test updating pattern metrics after use"""
        # Record pattern usage
        result = await engine.record_pattern_usage(
            pattern_id="customer_360",
            implementation_success=True,
            success_rate=0.89
        )

        # Should update metrics
        assert result["success"] is True

        # Verify metrics were updated
        # TODO: Query pattern and verify avg_success_rate increased


class TestPatternRecommendation:
    """Test complete pattern recommendation flow"""

    @pytest.mark.asyncio
    async def test_recommend_with_data_sources(self, engine):
        """Test recommendations consider available data sources"""
        result = await engine.recommend_patterns(
            domain="retail",
            use_case="customer insights",
            data_sources=["crm", "transactions", "support"]
        )

        patterns = result["patterns"]

        # Should prioritize patterns that match available data sources
        if patterns:
            top_pattern = patterns[0]
            template = top_pattern.get("template", {})
            required_sources = template.get("required_sources", [])

            # At least some required sources should match
            matching_sources = set(required_sources) & set(["crm", "transactions", "support"])
            assert len(matching_sources) > 0

    @pytest.mark.asyncio
    async def test_recommend_includes_reasoning(self, engine):
        """Test recommendations include reasoning"""
        result = await engine.recommend_patterns(
            domain="retail",
            use_case="customer analytics"
        )

        # Should include reasoning
        assert "reasoning" in result
        assert isinstance(result["reasoning"], dict)
        assert "steps" in result["reasoning"]

    @pytest.mark.asyncio
    async def test_recommend_with_confidence_scores(self, engine):
        """Test each pattern has confidence score"""
        result = await engine.recommend_patterns(
            domain="retail",
            use_case="customer analytics"
        )

        patterns = result["patterns"]
        assert len(patterns) > 0

        # Each pattern should have relevance score
        for pattern in patterns:
            assert "relevance_score" in pattern
            assert 0.0 <= pattern["relevance_score"] <= 1.0


class TestEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_no_patterns_for_domain(self, engine):
        """Test handling when no patterns exist for domain"""
        result = await engine.recommend_patterns(
            domain="healthcare",  # No healthcare patterns in test data
            use_case="patient analytics"
        )

        # Should return empty list but not error
        assert "patterns" in result
        assert len(result["patterns"]) == 0
        assert result.get("confidence", 0.0) < 0.5

    @pytest.mark.asyncio
    async def test_invalid_domain(self, engine):
        """Test handling of invalid domain"""
        result = await engine.recommend_patterns(
            domain="",
            use_case="some analytics"
        )

        # Should handle gracefully
        assert "patterns" in result
        assert isinstance(result["patterns"], list)

    @pytest.mark.asyncio
    async def test_empty_data_sources(self, engine):
        """Test recommendation without data sources"""
        result = await engine.recommend_patterns(
            domain="retail",
            use_case="customer analytics",
            data_sources=[]
        )

        # Should still recommend patterns
        assert len(result["patterns"]) > 0

        # But confidence might be lower
        # (patterns without source matching)


class TestPerformance:
    """Test performance requirements"""

    @pytest.mark.asyncio
    async def test_recommendation_performance(self, engine):
        """Test recommendations are fast"""
        import time

        start = time.time()
        result = await engine.recommend_patterns(
            domain="retail",
            use_case="customer analytics"
        )
        elapsed = time.time() - start

        # Should complete in under 2 seconds
        assert elapsed < 2.0
        assert len(result["patterns"]) > 0


class TestPatternTemplate:
    """Test pattern template handling"""

    @pytest.mark.asyncio
    async def test_pattern_includes_template(self, engine):
        """Test patterns include complete template information"""
        result = await engine.recommend_patterns(
            domain="retail",
            use_case="customer analytics"
        )

        patterns = result["patterns"]
        assert len(patterns) > 0

        # First pattern should have template
        pattern = patterns[0]
        assert "template" in pattern

        template = pattern["template"]
        assert "required_sources" in template
        assert "core_fields" in template


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
