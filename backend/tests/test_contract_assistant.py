"""
TDD Tests for Contract Generation Assistant
Test-first approach for Phase 3 implementation
"""

import pytest
import sys
import os
from datetime import datetime
import json

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.contract_assistant import ContractAssistant
from services.kuzu_knowledge_graph import KuzuKnowledgeGraph
import asyncio


@pytest.fixture
def kg():
    """Create a fresh knowledge graph with sample data"""
    test_db_path = "./tests/data/test_contract_assistant.kuzu"
    import shutil
    import time

    if os.path.exists(test_db_path):
        if os.path.isdir(test_db_path):
            shutil.rmtree(test_db_path)
        else:
            os.remove(test_db_path)

    kg = KuzuKnowledgeGraph(db_path=test_db_path)

    # Add sample retail contracts for testing
    kg.create_contract(
        contract_id="retail_customer_base_v1",
        name="Customer Base Contract",
        domain="retail",
        schema={
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Unique customer identifier"},
                "email": {"type": "string", "description": "Customer email address"},
                "phone": {"type": "string", "description": "Customer phone number"},
                "segment": {"type": "string", "description": "Customer segment"}
            },
            "required": ["customer_id", "email"]
        },
        quality_rules=[
            {"rule": "unique", "field": "customer_id"},
            {"rule": "email_format", "field": "email"},
            {"rule": "completeness", "field": "email", "threshold": 0.95}
        ],
        version="1.0.0",
        success_rate=0.92,
        metadata={"implementations": 15, "average_quality_score": 0.89}
    )

    kg.create_contract(
        contract_id="retail_customer_360_v1",
        name="Customer 360 Contract",
        domain="retail",
        schema={
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "email": {"type": "string"},
                "lifetime_value": {"type": "number"},
                "total_purchases": {"type": "integer"},
                "last_purchase_date": {"type": "string", "format": "date"}
            },
            "required": ["customer_id", "email", "lifetime_value"]
        },
        quality_rules=[
            {"rule": "unique", "field": "customer_id"},
            {"rule": "positive_value", "field": "lifetime_value"},
            {"rule": "completeness", "field": "email", "threshold": 0.98}
        ],
        version="2.0.0",
        success_rate=0.88,
        metadata={"implementations": 8, "average_quality_score": 0.91}
    )

    # Add a financial domain contract for domain filtering
    kg.create_contract(
        contract_id="financial_transaction_v1",
        name="Transaction Contract",
        domain="financial",
        schema={
            "type": "object",
            "properties": {
                "transaction_id": {"type": "string"},
                "amount": {"type": "number"},
                "timestamp": {"type": "string", "format": "date-time"}
            }
        },
        quality_rules=[
            {"rule": "unique", "field": "transaction_id"}
        ],
        version="1.0.0",
        success_rate=0.95
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
def assistant(kg):
    """Create ContractAssistant with test knowledge graph"""
    # Import here to avoid circular import
    from services.kag_intelligence import KAGIntelligence
    from services.vultr_llm_adapter import get_vultr_adapter

    # Create KAG instance that uses our test knowledge graph
    kag = KAGIntelligence(knowledge_graph=kg, llm_adapter=get_vultr_adapter())

    return ContractAssistant(knowledge_graph=kg, kag_intelligence=kag)


class TestContractSuggestion:
    """Test contract suggestion from business requirements"""

    @pytest.mark.asyncio
    async def test_suggest_contract_basic(self, assistant):
        """Test basic contract suggestion"""
        result = await assistant.suggest_contract(
            requirements="Customer segmentation for retail",
            domain="retail",
            critical_fields=["customer_id", "segment"]
        )

        # Verify result structure
        assert "contract" in result
        assert "similar_contracts" in result
        assert "confidence" in result
        assert "reasoning" in result

        # Verify contract structure
        contract = result["contract"]
        assert contract["domain"] == "retail"
        assert "schema" in contract
        assert "quality_rules" in contract

        # Verify critical fields are included
        schema_props = contract["schema"]["properties"]
        assert "customer_id" in schema_props
        assert "segment" in schema_props

    @pytest.mark.asyncio
    async def test_suggest_contract_uses_similar_contracts(self, assistant):
        """Test that suggestion uses similar successful contracts"""
        result = await assistant.suggest_contract(
            requirements="Need customer data with email and purchase history",
            domain="retail",
            critical_fields=["customer_id", "email"]
        )

        # Should find similar contracts in graph
        assert len(result["similar_contracts"]) > 0

        # Should have high confidence due to similar contracts
        assert result["confidence"] >= 0.6

        # Similar contracts should be from same domain
        for similar in result["similar_contracts"]:
            assert similar["domain"] == "retail"

    @pytest.mark.asyncio
    async def test_suggest_contract_confidence_scoring(self, assistant):
        """Test confidence scoring based on similar contracts"""
        result = await assistant.suggest_contract(
            requirements="Customer email and ID tracking",
            domain="retail",
            critical_fields=["customer_id", "email"]
        )

        # Should have confidence score between 0 and 1
        assert 0.0 <= result["confidence"] <= 1.0

        # High similarity to existing contracts should give high confidence
        assert result["confidence"] > 0.7

    @pytest.mark.asyncio
    async def test_suggest_contract_no_similar_contracts(self, assistant):
        """Test suggestion when no similar contracts exist"""
        result = await assistant.suggest_contract(
            requirements="New experimental feature",
            domain="healthcare",  # No healthcare contracts in test data
            critical_fields=["patient_id"]
        )

        # Should still generate a contract
        assert "contract" in result

        # Should have lower confidence
        assert result["confidence"] < 0.7

        # Should indicate no similar contracts found
        assert len(result["similar_contracts"]) == 0


class TestQualityRuleRecommendation:
    """Test quality rule recommendations"""

    @pytest.mark.asyncio
    async def test_recommend_quality_rules_from_similar(self, assistant):
        """Test that quality rules are recommended from similar contracts"""
        result = await assistant.suggest_contract(
            requirements="Customer data management",
            domain="retail",
            critical_fields=["customer_id", "email"]
        )

        quality_rules = result["contract"]["quality_rules"]

        # Should recommend quality rules
        assert len(quality_rules) > 0

        # Should include uniqueness rule for customer_id (from similar contracts)
        rule_fields = [rule["field"] for rule in quality_rules if rule["rule"] == "unique"]
        assert "customer_id" in rule_fields

    @pytest.mark.asyncio
    async def test_recommend_quality_rules_for_critical_fields(self, assistant):
        """Test quality rules for critical fields"""
        result = await assistant.suggest_contract(
            requirements="Order tracking system",
            domain="retail",
            critical_fields=["order_id", "customer_id", "total_amount"]
        )

        quality_rules = result["contract"]["quality_rules"]
        rule_fields = [rule["field"] for rule in quality_rules]

        # Critical fields should have quality rules
        assert "order_id" in rule_fields
        assert "customer_id" in rule_fields


class TestReasoningExplanation:
    """Test explainable reasoning"""

    @pytest.mark.asyncio
    async def test_reasoning_path_included(self, assistant):
        """Test that reasoning path is included"""
        result = await assistant.suggest_contract(
            requirements="Customer analytics",
            domain="retail",
            critical_fields=["customer_id"]
        )

        reasoning = result["reasoning"]

        # Should include reasoning steps
        assert isinstance(reasoning, dict)
        assert "steps" in reasoning
        assert len(reasoning["steps"]) > 0

    @pytest.mark.asyncio
    async def test_reasoning_explains_similar_contracts(self, assistant):
        """Test reasoning explains why contracts are similar"""
        result = await assistant.suggest_contract(
            requirements="Customer email management",
            domain="retail",
            critical_fields=["customer_id", "email"]
        )

        # Should explain similarity
        assert "similarity_analysis" in result["reasoning"]

        # Should list matched fields
        similarity = result["reasoning"]["similarity_analysis"]
        assert "matched_fields" in similarity


class TestDomainFiltering:
    """Test domain-specific suggestions"""

    @pytest.mark.asyncio
    async def test_only_returns_same_domain_contracts(self, assistant):
        """Test that similar contracts are from same domain only"""
        result = await assistant.suggest_contract(
            requirements="Customer data",
            domain="retail",
            critical_fields=["customer_id"]
        )

        # All similar contracts should be retail
        for similar in result["similar_contracts"]:
            assert similar["domain"] == "retail"

        # Should not include financial contracts
        contract_ids = [c["id"] for c in result["similar_contracts"]]
        assert "financial_transaction_v1" not in contract_ids


class TestPerformance:
    """Test performance requirements"""

    @pytest.mark.asyncio
    async def test_suggestion_performance(self, assistant):
        """Test that suggestions are generated quickly"""
        import time

        start = time.time()
        result = await assistant.suggest_contract(
            requirements="Customer data",
            domain="retail",
            critical_fields=["customer_id"]
        )
        elapsed = time.time() - start

        # Should complete in under 2 seconds (target from requirements)
        assert elapsed < 2.0

        # Should return valid result
        assert result is not None
        assert "contract" in result


class TestEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_empty_requirements(self, assistant):
        """Test handling of empty requirements"""
        with pytest.raises(ValueError):
            await assistant.suggest_contract(
                requirements="",
                domain="retail",
                critical_fields=[]
            )

    @pytest.mark.asyncio
    async def test_invalid_domain(self, assistant):
        """Test handling of invalid domain"""
        result = await assistant.suggest_contract(
            requirements="Some requirements",
            domain="",
            critical_fields=["field1"]
        )

        # Should still work but with lower confidence
        assert result is not None
        assert result["confidence"] < 0.5

    @pytest.mark.asyncio
    async def test_no_critical_fields(self, assistant):
        """Test suggestion without critical fields"""
        result = await assistant.suggest_contract(
            requirements="General customer data",
            domain="retail",
            critical_fields=[]
        )

        # Should still generate contract
        assert "contract" in result

        # Should recommend fields from similar contracts
        assert len(result["contract"]["schema"]["properties"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
