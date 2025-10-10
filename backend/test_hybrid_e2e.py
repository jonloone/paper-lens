"""
End-to-End Hybrid Query System Demo
Tests complete flow: Business Context → Unstructured Data → Hybrid Queries

This script demonstrates the full capabilities of the business-first hybrid query system:
1. Create business objectives and metrics
2. Ingest unstructured documents with entity extraction
3. Execute hybrid queries spanning all data layers
4. Show entity profiles across structured + unstructured data

Run: python backend/test_hybrid_e2e.py

Date: October 10, 2025
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).parent))

from services.business_context_enrichment import BusinessContextEnrichmentService
from services.unstructured_data_ingestion import UnstructuredIngestionService
from services.unified_data_access import UnifiedDataAccessService


# Sample business objectives
BUSINESS_OBJECTIVES = [
    {
        "title": "Reduce Customer Churn by 25%",
        "description": "Decrease customer churn rate from 20% to 15% by end of Q4 2025",
        "department": "Customer Success",
        "stakeholders": ["VP Customer Success", "Head of Product", "Data Team"],
        "success_criteria": "Churn rate below 15% for 3 consecutive months",
        "business_value": "$2M annual revenue retention",
        "priority": "P0"
    },
    {
        "title": "Improve Product Adoption",
        "description": "Increase active usage of Enterprise Analytics Platform by 40%",
        "department": "Product",
        "stakeholders": ["CPO", "Product Managers", "Customer Success"],
        "success_criteria": "40% increase in MAU, 60% feature adoption",
        "business_value": "$1.5M in expansion revenue",
        "priority": "P1"
    }
]

# Sample business metrics
BUSINESS_METRICS = [
    {
        "metric_name": "Customer Churn Rate",
        "description": "Percentage of customers who cancel service each month",
        "metric_type": "percentage",
        "current_value": 20.0,
        "target_value": 15.0,
        "unit": "percent",
        "frequency": "monthly",
        "owner": "VP Customer Success"
    },
    {
        "metric_name": "Monthly Active Users",
        "description": "Number of unique users active in the platform each month",
        "metric_type": "count",
        "current_value": 5000.0,
        "target_value": 7000.0,
        "unit": "users",
        "frequency": "monthly",
        "owner": "CPO"
    }
]

# Sample business questions
BUSINESS_QUESTIONS = [
    {
        "question_text": "Why are customers churning?",
        "domain": "customer_success",
        "frequency": "daily",
        "stakeholder_role": "VP Customer Success"
    },
    {
        "question_text": "Which features are customers using most?",
        "domain": "product",
        "frequency": "weekly",
        "stakeholder_role": "Product Manager"
    },
    {
        "question_text": "What are the main customer complaints?",
        "domain": "customer_success",
        "frequency": "daily",
        "stakeholder_role": "Support Lead"
    }
]

# Sample unstructured documents (support tickets, meeting notes, etc.)
SAMPLE_DOCUMENTS = [
    {
        "content": """
        Customer: Acme Corporation
        Issue: Platform Performance Issues

        Acme Corp reported significant performance degradation over the past week.
        Their Enterprise Analytics Platform queries are timing out, causing major
        disruption to their daily reporting workflows.

        Root cause: Increased data volume (5x growth) without infrastructure scaling.

        Resolution: Upgraded to Premium tier with dedicated resources.
        Customer satisfied with resolution speed.

        Contact: john.smith@acmecorp.com
        """,
        "document_type": "support_ticket",
        "title": "TICKET-1001: Performance Issues - Acme Corp",
        "source": "zendesk",
        "author": "support_agent_01"
    },
    {
        "content": """
        Customer: TechStart Industries
        Issue: Feature Request - Data Integration

        Sarah Johnson from TechStart requested additional connectors:
        - Salesforce CRM connector
        - MongoDB connector
        - Real-time Kafka streaming

        This would enable TechStart to integrate customer data from multiple sources
        and improve their analytics capabilities.

        Product team evaluating for Q2 release.

        Contact: s.johnson@techstart.com
        """,
        "document_type": "support_ticket",
        "title": "TICKET-1002: Feature Request - TechStart",
        "source": "zendesk",
        "author": "support_agent_02"
    },
    {
        "content": """
        Customer: Global Solutions Ltd
        Issue: Churn Risk - Contract Renewal

        Global Solutions contract expires in 30 days. Account shows warning signs:
        - Login frequency decreased 60% over last quarter
        - Support tickets increased 3x
        - Executive sponsor changed (new CTO)

        Pain points identified:
        - Slow query performance (related to data volume growth)
        - Missing integrations with their data warehouse
        - Lack of advanced analytics features

        Action plan:
        - Technical deep-dive with new CTO
        - Performance optimization workshop
        - Custom integration proposal
        - Premium tier discount offer

        Renewal probability: 40% (at risk)
        """,
        "document_type": "account_review",
        "title": "ACCOUNT-2001: Renewal Risk - Global Solutions",
        "source": "salesforce",
        "author": "account_manager_01"
    },
    {
        "content": """
        Product Usage Analysis - Enterprise Analytics Platform
        Date: October 2025

        Top 5 Most Used Features:
        1. SQL Workbench (85% of users)
        2. Dashboard Builder (70% of users)
        3. Data Catalog (65% of users)
        4. Query History (60% of users)
        5. Scheduled Reports (45% of users)

        Features with Low Adoption (<20%):
        - Advanced Analytics (12%)
        - Data Quality Monitoring (15%)
        - Collaborative Workspaces (18%)

        Customer Feedback Themes:
        - Performance is top concern (mentioned in 45% of tickets)
        - Need more connectors (mentioned in 30% of feature requests)
        - UI complexity for advanced features (mentioned in 25% of feedback)

        Churn Correlation Analysis:
        - Customers using <3 features: 35% churn rate
        - Customers using 3-5 features: 18% churn rate
        - Customers using 6+ features: 8% churn rate

        Recommendation: Focus on feature adoption to reduce churn.
        """,
        "document_type": "product_analysis",
        "title": "ANALYSIS-3001: Product Usage and Churn Analysis",
        "source": "internal_analytics",
        "author": "data_team"
    },
    {
        "content": """
        Customer Success Meeting Notes - Acme Corporation
        Date: October 10, 2025

        Attendees: John Smith (Acme CTO), Sarah Johnson (TechStart CEO - wrong meeting),
                   Account Manager, Solutions Architect

        Discussion Topics:
        1. Recent performance issues - RESOLVED with Premium tier upgrade
        2. Upcoming renewal - Acme very satisfied, committing to 3-year contract
        3. Expansion opportunities - Adding 50 more users
        4. Feature requests - Real-time alerts, better data lineage visualization

        Account Health: GREEN
        - NPS Score: 9/10
        - Product adoption: High (using 8 out of 10 major features)
        - Support satisfaction: 95%

        Next Steps:
        - Finalize 3-year contract with 20% discount
        - Schedule training for new users
        - Roadmap discussion for Q1 2026

        Key Quote from John: "After the performance fix, this is now our most critical
        platform. We're building our entire data strategy around it."
        """,
        "document_type": "meeting_notes",
        "title": "MEETING-4001: Acme Corp Quarterly Review",
        "source": "google_docs",
        "author": "account_manager_01"
    }
]


async def test_complete_hybrid_system():
    """Test complete hybrid query system end-to-end"""
    print("\n" + "="*80)
    print("HYBRID QUERY SYSTEM END-TO-END DEMO")
    print("Business-First Data Products with Unstructured Data Support")
    print("="*80 + "\n")

    # Initialize services
    print("📦 Initializing services...")
    business_service = BusinessContextEnrichmentService()
    ingestion_service = UnstructuredIngestionService()
    hybrid_service = UnifiedDataAccessService()
    print("✅ All services initialized\n")

    # ========================================================================
    # PHASE 1: Business Context Layer
    # ========================================================================
    print("="*80)
    print("PHASE 1: Building Business Context Layer")
    print("="*80 + "\n")

    # 1.1 Create business objectives
    print("Step 1: Creating Business Objectives")
    print("-" * 40)
    objective_ids = []
    for obj_data in BUSINESS_OBJECTIVES:
        obj_id = await business_service.create_business_objective(**obj_data)
        objective_ids.append(obj_id)
        print(f"✓ Created: {obj_data['title']}")
        print(f"  ID: {obj_id}")
        print(f"  Priority: {obj_data['priority']}")
        print(f"  Business Value: {obj_data['business_value']}\n")

    # 1.2 Create business metrics
    print("\nStep 2: Creating Business Metrics")
    print("-" * 40)
    metric_ids = []
    for metric_data in BUSINESS_METRICS:
        metric_id = await business_service.create_business_metric(**metric_data)
        metric_ids.append(metric_id)
        print(f"✓ Created: {metric_data['metric_name']}")
        print(f"  ID: {metric_id}")
        print(f"  Current: {metric_data['current_value']} {metric_data['unit']}")
        print(f"  Target: {metric_data['target_value']} {metric_data['unit']}\n")

    # 1.3 Link metrics to objectives
    print("\nStep 3: Linking Metrics to Objectives")
    print("-" * 40)
    await business_service.link_metric_to_objective(
        metric_ids[0],  # Churn Rate
        objective_ids[0],  # Reduce Churn objective
        relationship_type="measures_progress"
    )
    print(f"✓ Linked 'Customer Churn Rate' to 'Reduce Customer Churn by 25%'\n")

    await business_service.link_metric_to_objective(
        metric_ids[1],  # MAU
        objective_ids[1],  # Product Adoption objective
        relationship_type="measures_progress"
    )
    print(f"✓ Linked 'Monthly Active Users' to 'Improve Product Adoption'\n")

    # 1.4 Capture business questions
    print("\nStep 4: Capturing Business Questions")
    print("-" * 40)
    question_ids = []
    for question_data in BUSINESS_QUESTIONS:
        question_id = await business_service.capture_business_question(**question_data)
        question_ids.append(question_id)
        print(f"✓ Captured: {question_data['question_text']}")
        print(f"  ID: {question_id}")
        print(f"  Domain: {question_data['domain']}\n")

    print(f"\n✅ Phase 1 Complete: Created {len(objective_ids)} objectives, "
          f"{len(metric_ids)} metrics, {len(question_ids)} questions\n")

    # ========================================================================
    # PHASE 2: Unstructured Data Layer
    # ========================================================================
    print("="*80)
    print("PHASE 2: Ingesting Unstructured Data")
    print("="*80 + "\n")

    print("Step 5: Ingesting Documents with Entity Extraction")
    print("-" * 40)
    document_ids = []
    for doc_data in SAMPLE_DOCUMENTS:
        doc_id = await ingestion_service.ingest_document(**doc_data)
        document_ids.append(doc_id)
        print(f"✓ Ingested: {doc_data['title']}")
        print(f"  ID: {doc_id}")
        print(f"  Type: {doc_data['document_type']}")

        # Get extracted entities
        entities = await ingestion_service.get_document_entities(doc_id)
        print(f"  Extracted {len(entities)} entities:")
        for entity in entities[:3]:  # Show first 3
            print(f"    - {entity['mention_text']} ({entity['entity_type']}) "
                  f"→ {entity['canonical_name']}")
        if len(entities) > 3:
            print(f"    ... and {len(entities) - 3} more")
        print()

    print(f"\n✅ Phase 2 Complete: Ingested {len(document_ids)} documents\n")

    # Get ingestion stats
    stats = await ingestion_service.get_stats()
    print("📊 Unstructured Data Statistics:")
    print(f"  Total Documents: {stats['total_documents']}")
    print(f"  Total Entities: {stats['total_entities']}")
    print(f"  Total Mentions: {stats['total_mentions']}\n")

    # ========================================================================
    # PHASE 3: Hybrid Queries
    # ========================================================================
    print("="*80)
    print("PHASE 3: Executing Hybrid Queries")
    print("="*80 + "\n")

    # 3.1 Query by business question
    print("Step 6: Query by Business Question")
    print("-" * 40)
    print("Question: 'Why are customers churning?'\n")

    result = await hybrid_service.query_by_business_question(
        question_text="Why are customers churning?",
        include_documents=True,
        include_structured=True,
        max_results=10
    )

    print(f"Query ID: {result.query_id}")
    print(f"Execution Time: {result.execution_time_ms:.2f}ms")
    print(f"Confidence: {result.confidence:.2%}\n")

    print("📋 Business Context:")
    print(f"  Related Questions: {len(result.business_context.get('related_questions', []))}")
    print(f"  Related Objectives: {len(result.business_context.get('related_objectives', []))}")
    for obj in result.business_context.get('related_objectives', [])[:2]:
        print(f"    - {obj.get('title')}")
    print()

    print("📊 Structured Data:")
    print(f"  Data Products Found: {len(result.structured_data)}")
    for product in result.structured_data[:2]:
        print(f"    - {product.get('product_name')}")
    print()

    print("📄 Unstructured Data:")
    print(f"  Documents Found: {len(result.unstructured_data)}")
    for doc in result.unstructured_data[:3]:
        print(f"    - {doc.get('title')}")
        print(f"      Type: {doc.get('document_type')}")
        print(f"      Entities: {len(doc.get('entities', []))}")
    print()

    print("💡 Insights Generated:")
    for i, insight in enumerate(result.insights, 1):
        print(f"  {i}. {insight}")
    print()

    # 3.2 Get entity profile
    print("\nStep 7: Get Unified Entity Profile")
    print("-" * 40)
    print("Entity: 'Acme Corporation'\n")

    profile = await hybrid_service.get_entity_profile(
        entity_identifier="Acme Corporation",
        entity_type="organization"
    )

    if profile:
        print(f"Entity ID: {profile.entity_id}")
        print(f"Canonical Name: {profile.canonical_name}")
        print(f"Type: {profile.entity_type}\n")

        print("📊 Statistics:")
        stats = profile.statistics
        print(f"  Total Mentions: {stats.get('total_mentions', 0)}")
        print(f"  Documents: {stats.get('total_documents', 0)}")
        print(f"  Structured References: {stats.get('total_structured_refs', 0)}")
        print(f"  Related Products: {stats.get('total_related_products', 0)}")
        print(f"  Related Objectives: {stats.get('total_related_objectives', 0)}\n")

        print("📄 Document Mentions:")
        for mention in profile.unstructured_mentions[:3]:
            print(f"  - {mention.get('document_title')}")
            print(f"    Mentioned as: '{mention.get('mention_text')}'")
            print(f"    Type: {mention.get('document_type')}")
        if len(profile.unstructured_mentions) > 3:
            print(f"  ... and {len(profile.unstructured_mentions) - 3} more mentions")
        print()
    else:
        print("⚠️  Entity profile not found\n")

    # 3.3 Cross-layer search
    print("\nStep 8: Cross-Layer Search")
    print("-" * 40)
    print("Search Term: 'performance'\n")

    search_results = await hybrid_service.search_across_layers(
        search_term="performance",
        layers=["business", "structured", "unstructured"],
        max_results_per_layer=5
    )

    for layer, results in search_results.items():
        print(f"📂 {layer.upper()} Layer: {len(results)} results")
        for result_item in results[:2]:
            if 'title' in result_item:
                print(f"  - {result_item.get('title')}")
            elif 'name' in result_item:
                print(f"  - {result_item.get('name')}")
        if len(results) > 2:
            print(f"  ... and {len(results) - 2} more")
        print()

    # 3.4 Get overall statistics
    print("\nStep 9: Overall System Statistics")
    print("-" * 40)

    system_stats = await hybrid_service.get_stats()

    print("📊 Unified Data Layer Statistics:")
    print("\n  Business Layer:")
    print(f"    Objectives: {system_stats.get('business_objectives', 0)}")
    print(f"    Metrics: {system_stats.get('business_metrics', 0)}")
    print(f"    Questions: {system_stats.get('business_questions', 0)}")

    print("\n  Structured Layer:")
    print(f"    Data Tables: {system_stats.get('data_tables', 0)}")
    print(f"    Data Products: {system_stats.get('data_products', 0)}")

    print("\n  Unstructured Layer:")
    print(f"    Documents: {system_stats.get('documents', 0)}")
    print(f"    Entities: {system_stats.get('entities', 0)}")
    print(f"    Entity Mentions: {system_stats.get('entity_mentions', 0)}")
    print()

    # ========================================================================
    # FINAL SUMMARY
    # ========================================================================
    print("="*80)
    print("✅ END-TO-END DEMO COMPLETE")
    print("="*80 + "\n")

    print("Summary of Capabilities Demonstrated:")
    print("--------------------------------------")
    print("✓ Business Context Layer")
    print("  - Created business objectives with ROI tracking")
    print("  - Defined business metrics with targets")
    print("  - Captured common business questions")
    print("  - Linked metrics to objectives")
    print()
    print("✓ Unstructured Data Layer")
    print("  - Ingested documents (tickets, notes, analysis)")
    print("  - Extracted entities automatically")
    print("  - Resolved entities to canonical forms")
    print("  - Linked entities across documents")
    print()
    print("✓ Hybrid Query Capabilities")
    print("  - Answered business questions using all data layers")
    print("  - Created unified entity profiles (structured + unstructured)")
    print("  - Searched across business context, data, and documents")
    print("  - Generated insights from combined sources")
    print()
    print("Business Value Delivered:")
    print("------------------------")
    print("• Ask questions in business terms, not technical queries")
    print("• Automatic entity linking across structured and unstructured data")
    print("• Complete context for decision-making (metrics + documents + lineage)")
    print("• ROI tracking from objectives to data products to outcomes")
    print()
    print("What This Enables:")
    print("-----------------")
    print("1. VP asks: 'Why are customers churning?'")
    print("   → Gets: Churn metrics + support tickets + account reviews + insights")
    print()
    print("2. Product Manager asks: 'How is Acme Corp using our platform?'")
    print("   → Gets: Usage data + support history + meeting notes + health score")
    print()
    print("3. Data Team asks: 'What data products support churn reduction?'")
    print("   → Gets: Linked products + business objectives + ROI + lineage")
    print()
    print("="*80 + "\n")

    print("Next Steps:")
    print("----------")
    print("1. Try the API endpoints:")
    print("   POST http://localhost:8000/api/hybrid/query")
    print("   GET  http://localhost:8000/api/hybrid/entity/Acme%20Corporation")
    print()
    print("2. View API documentation:")
    print("   http://localhost:8000/docs")
    print()
    print("3. Explore example queries:")
    print("   GET http://localhost:8000/api/hybrid/examples")
    print()
    print("="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(test_complete_hybrid_system())
