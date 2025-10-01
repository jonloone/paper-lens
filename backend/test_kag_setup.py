"""
Test script for KAG + Kuzu setup
Validates that all components are working
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from services.kuzu_knowledge_graph import get_knowledge_graph
from services.vultr_llm_adapter import get_vultr_adapter
from services.kag_intelligence import get_kag_intelligence


async def test_kuzu_setup():
    """Test Kuzu graph database"""
    print("\n" + "="*60)
    print("🧪 Testing Kuzu Knowledge Graph")
    print("="*60)

    try:
        kg = get_knowledge_graph()
        print("✅ Kuzu database initialized")

        stats = kg.get_graph_statistics()
        print(f"✅ Graph statistics: {stats}")

        # Test creating a sample contract
        result = kg.create_contract(
            contract_id="test_contract_001",
            name="Test Customer Contract",
            domain="retail",
            schema={
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string"},
                    "email": {"type": "string"},
                    "lifetime_value": {"type": "number"}
                }
            },
            quality_rules=[
                {"rule": "unique", "field": "customer_id"},
                {"rule": "not_null", "field": "email"}
            ],
            metadata={"test": True}
        )
        print(f"✅ Created test contract: {result}")

        # Test finding similar contracts
        similar = kg.find_similar_contracts(
            domain="retail",
            schema_fields=["customer_id", "email"],
            limit=3
        )
        print(f"✅ Found {len(similar)} similar contracts")

        return True

    except Exception as e:
        print(f"❌ Kuzu test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_vultr_adapter():
    """Test Vultr LLM adapter"""
    print("\n" + "="*60)
    print("🧪 Testing Vultr LLM Adapter")
    print("="*60)

    try:
        llm = get_vultr_adapter()
        print("✅ Vultr adapter initialized")

        # Test API key configuration
        if llm.api_key:
            print(f"✅ API key configured (length: {len(llm.api_key)})")
        else:
            print("⚠️  No API key configured - will use fallback mode")

        # Test connection
        connected = await llm.test_connection()
        if connected:
            print("✅ Vultr API connection successful")
        else:
            print("⚠️  Vultr API connection failed - using fallback mode")

        # Test simple completion
        response = await llm.generate_completion(
            system_prompt="You are a helpful data engineering assistant.",
            user_prompt="What is a data contract?",
            max_tokens=100
        )
        print(f"✅ Generated response ({len(response)} chars)")
        print(f"   Preview: {response[:100]}...")

        return True

    except Exception as e:
        print(f"❌ Vultr adapter test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_kag_intelligence():
    """Test KAG intelligence service"""
    print("\n" + "="*60)
    print("🧪 Testing KAG Intelligence Service")
    print("="*60)

    try:
        kag = get_kag_intelligence()
        print("✅ KAG intelligence initialized")

        # Test query with reasoning
        result = await kag.query_with_reasoning(
            query="Find contracts for customer data in retail domain",
            domain="retail"
        )

        print(f"✅ Query completed")
        print(f"   Intent: {result.get('intent', {}).get('intent_type')}")
        print(f"   Confidence: {result.get('confidence', 0):.2f}")
        print(f"   Reasoning path: {len(result.get('reasoning_path', []))} steps")

        if "synthesis" in result:
            synthesis = result["synthesis"]
            print(f"   Synthesis: {synthesis[:150]}...")

        # Test similarity search
        similar_result = await kag.find_similar_with_explanation(
            item_type="contract",
            attributes={
                "schema_fields": ["customer_id", "email", "lifetime_value"]
            },
            domain="retail"
        )

        print(f"✅ Similarity search completed")
        print(f"   Found: {similar_result.get('count', 0)} similar items")
        print(f"   Confidence: {similar_result.get('confidence', 0):.2f}")

        return True

    except Exception as e:
        print(f"❌ KAG intelligence test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def run_all_tests():
    """Run all component tests"""
    print("\n" + "="*60)
    print("🚀 NexusOne Backend: KAG + Kuzu Setup Tests")
    print("="*60)

    results = {}

    # Test Kuzu
    results["kuzu"] = await test_kuzu_setup()

    # Test Vultr adapter
    results["vultr"] = await test_vultr_adapter()

    # Test KAG intelligence
    results["kag"] = await test_kag_intelligence()

    # Summary
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60)

    for component, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{component.upper():20} {status}")

    all_passed = all(results.values())
    print("\n" + "="*60)
    if all_passed:
        print("🎉 All tests passed!")
        print("\n✅ Backend is ready for development")
        print("\nNext steps:")
        print("  1. Set VULTR_API_KEY environment variable")
        print("  2. Implement Contract Assistant")
        print("  3. Build Pattern Recommendation Engine")
    else:
        print("⚠️  Some tests failed")
        print("\nTroubleshooting:")
        if not results["kuzu"]:
            print("  - Check Kuzu installation: pip install kuzu==0.0.12")
        if not results["vultr"]:
            print("  - Set VULTR_API_KEY environment variable")
            print("  - Check Vultr API access")
        if not results["kag"]:
            print("  - Ensure Kuzu and Vultr are working")

    print("="*60 + "\n")

    return all_passed


if __name__ == "__main__":
    # Run tests
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
