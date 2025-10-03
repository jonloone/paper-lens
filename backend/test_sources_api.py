"""
Test script to validate source management API structure
"""

import sys
import json
from pathlib import Path

# Add parent directory to path so we can import backend
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_models():
    """Test that all models import correctly"""
    print("Testing models...")
    try:
        from backend.models.sources import (
            ConnectionMode,
            SourceStatus,
            DeploymentStatus,
            SecretStorageType,
            ConnectionDetails,
            SecretReference,
            FederatedConfig,
            CDCConfig,
            BatchConfig,
            StreamingConfig,
            ConnectionConfig,
            SourceCreate,
            SourceUpdate,
            SourceSummary,
            SourceDetail,
            ValidationCheck,
            ValidationResult,
            ConnectionTestResult,
            MCPRecommendation,
            CostEstimate,
            Deployment,
            DeploymentCreate,
            SourceMetrics,
            SourcesOverview,
            HealthStatus
        )
        print("✅ All models imported successfully")
        return True
    except Exception as e:
        print(f"❌ Model import failed: {e}")
        return False


def test_connection_config_validation():
    """Test Pydantic validation for connection config"""
    print("\nTesting ConnectionConfig validation...")
    try:
        from backend.models.sources import (
            ConnectionConfig,
            ConnectionMode,
            ConnectionDetails,
            SecretReference,
            SecretStorageType,
            FederatedConfig
        )

        # Create valid federated config
        config = ConnectionConfig(
            name="test-postgres",
            type="postgresql",
            connection_mode=ConnectionMode.FEDERATED,
            domain="analytics",
            owner_email="data-eng@company.com",
            connection_details=ConnectionDetails(
                host="postgres.prod.local",
                port=5432,
                database_name="analytics_prod",
                username="readonly_user",
                ssl_enabled=True,
                password_secret=SecretReference(
                    type=SecretStorageType.ENVIRONMENT,
                    reference="POSTGRES_PASSWORD"
                )
            ),
            federated_config=FederatedConfig(
                trino_catalog_name="analytics_postgres"
            )
        )

        print(f"✅ Valid config created: {config.name}")
        print(f"   Mode: {config.connection_mode}")
        print(f"   Type: {config.type}")
        print(f"   Host: {config.connection_details.host}")
        return True
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        return False


def test_services_import():
    """Test that service layers import correctly"""
    print("\nTesting service imports...")
    try:
        # Note: These will fail without DB, but we can check imports
        print("  Checking connection_validator...")
        from backend.services.connection_validator import ConnectionValidator
        print("  ✅ ConnectionValidator imported")

        print("  Checking source_intelligence...")
        from backend.services.source_intelligence import SourceIntelligenceService
        print("  ✅ SourceIntelligenceService imported")

        print("  Checking sources_service...")
        from backend.services.sources_service import SourcesService
        print("  ✅ SourcesService imported")

        return True
    except Exception as e:
        print(f"❌ Service import failed: {e}")
        return False


def test_routes_import():
    """Test that routes import correctly"""
    print("\nTesting routes import...")
    try:
        from backend.api.sources_routes import router
        print(f"✅ Routes imported, prefix: {router.prefix}")
        print(f"   Total routes: {len(router.routes)}")

        # Print all route paths
        print("\n   Available endpoints:")
        for route in router.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                methods = ', '.join(route.methods)
                print(f"   - {methods:12} {route.path}")

        return True
    except Exception as e:
        print(f"❌ Routes import failed: {e}")
        return False


def test_crewai_agents():
    """Test CrewAI agent initialization"""
    print("\nTesting CrewAI agent initialization...")
    try:
        from backend.services.source_intelligence import SourceIntelligenceService

        service = SourceIntelligenceService()
        print("✅ SourceIntelligenceService initialized")
        print(f"   - Source Config Agent: {service.source_config_agent.role}")
        print(f"   - Cost Optimization Agent: {service.cost_optimization_agent.role}")
        print(f"   - Performance Agent: {service.performance_agent.role}")
        print(f"   - Security Agent: {service.security_agent.role}")

        return True
    except Exception as e:
        print(f"❌ CrewAI initialization failed: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("NexusOne Source Management API - Structure Validation")
    print("=" * 60)

    results = []

    results.append(("Models Import", test_models()))
    results.append(("Config Validation", test_connection_config_validation()))
    results.append(("Services Import", test_services_import()))
    results.append(("Routes Import", test_routes_import()))
    results.append(("CrewAI Agents", test_crewai_agents()))

    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)

    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status:10} - {test_name}")

    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)

    print(f"\nTotal: {total_passed}/{total_tests} tests passed")

    if total_passed == total_tests:
        print("\n🎉 All tests passed! API structure is valid.")
        return 0
    else:
        print(f"\n⚠️  {total_tests - total_passed} test(s) failed.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
