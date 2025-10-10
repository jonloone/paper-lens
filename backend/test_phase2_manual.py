"""
Phase 2 Manual Testing Script
Test unstructured data ingestion with entity extraction and resolution

Run: python backend/test_phase2_manual.py

Date: October 10, 2025
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from services.unstructured_data_ingestion import UnstructuredIngestionService


# Sample support tickets for testing
SAMPLE_DOCUMENTS = [
    {
        "content": """
        Customer: Acme Corporation
        Issue: Data pipeline failures in Enterprise Analytics Platform

        John Smith from Acme Corp reported that their daily data loads are failing since yesterday.
        The Enterprise Analytics Platform is showing timeout errors when connecting to the database.

        Initial diagnosis suggests network connectivity issues between Acme's data center and our platform.
        Escalated to infrastructure team for resolution.

        Contact: john.smith@acmecorp.com
        """,
        "document_type": "support_ticket",
        "title": "TICKET-1001: Pipeline Failures at Acme Corp",
        "source": "zendesk",
        "author": "support_agent_01"
    },
    {
        "content": """
        Customer: TechStart Industries
        Feature Request: Data Integration Suite enhancements

        Sarah Johnson from TechStart requested additional connectors for their Data Integration Suite.
        Specifically, they need:
        - Salesforce CRM connector
        - MongoDB connector
        - Real-time streaming from Kafka

        This would help TechStart integrate customer data from multiple sources.
        Product team is evaluating feasibility for Q2 release.

        Contact: s.johnson@techstart.com
        """,
        "document_type": "support_ticket",
        "title": "TICKET-1002: Feature Request from TechStart",
        "source": "zendesk",
        "author": "support_agent_02"
    },
    {
        "content": """
        Customer: Global Solutions Ltd
        Issue: Performance degradation in Analytics Platform

        Global Solutions reported slow query performance affecting their analytics dashboards.
        Queries that normally take 2-3 seconds are now taking 30+ seconds.

        Investigation shows increased data volume (10x growth over last quarter) without
        corresponding infrastructure scaling. Recommended upgrading to Enterprise tier.

        Customer accepted recommendation and upgrade scheduled for next week.
        """,
        "document_type": "support_ticket",
        "title": "TICKET-1003: Performance Issues at Global Solutions",
        "source": "zendesk",
        "author": "support_agent_01"
    },
    {
        "content": """
        System Alert: Database connection pool exhausted

        Multiple customers reporting connection timeouts to Enterprise Analytics Platform.
        Root cause: Connection pool size (100 connections) insufficient for current load.

        Affected customers include Acme Corporation, TechStart Industries, and others.

        Resolution: Increased connection pool to 500 connections and deployed across all regions.
        All systems operational as of 14:30 UTC.
        """,
        "document_type": "incident_log",
        "title": "INCIDENT-2024-045: Connection Pool Exhaustion",
        "source": "monitoring_system",
        "author": "system"
    },
    {
        "content": """
        Customer Success Meeting Notes - Acme Corporation
        Date: October 10, 2025

        Attendees: John Smith (Acme), Sarah Johnson (TechStart - wrong meeting),
                   Account Manager, Solutions Architect

        Discussion Topics:
        1. Recent pipeline issues - resolved with network configuration fix
        2. Upcoming renewal - Acme interested in upgrading to Premium tier
        3. Training needs - Data Integration Suite advanced features
        4. Feature requests - Better error messages in Analytics Platform

        Action Items:
        - Schedule training session for Acme team (due next month)
        - Prepare Premium tier proposal with 20% discount
        - Follow up on pipeline monitoring enhancements

        Overall health: Green - customer satisfied with resolution speed
        """,
        "document_type": "meeting_notes",
        "title": "Customer Success: Acme Corp Quarterly Review",
        "source": "google_docs",
        "author": "account_manager_01"
    }
]


async def test_phase2():
    """Test Phase 2 unstructured data functionality"""
    print("\n" + "="*80)
    print("PHASE 2 TESTING: Unstructured Data Ingestion")
    print("="*80 + "\n")

    # Initialize service
    print("📦 Initializing Unstructured Ingestion Service...")
    service = UnstructuredIngestionService()
    print("✅ Service initialized\n")

    # Test 1: Ingest documents
    print("=" * 80)
    print("TEST 1: Ingest Sample Documents")
    print("=" * 80)

    document_ids = await service.ingest_batch(SAMPLE_DOCUMENTS)

    print(f"✅ Ingested {len(document_ids)} documents:")
    for i, doc_id in enumerate(document_ids, 1):
        print(f"   {i}. {doc_id} - {SAMPLE_DOCUMENTS[i-1]['title']}")
    print()

    # Test 2: Retrieve and verify documents
    print("=" * 80)
    print("TEST 2: Retrieve Document Details")
    print("=" * 80)

    doc_id = document_ids[0]
    document = await service.get_document(doc_id)

    if document:
        print(f"✅ Retrieved document: {doc_id}")
        print(f"   Title: {document['title']}")
        print(f"   Type: {document['document_type']}")
        print(f"   Author: {document['author']}")
        print(f"   Content length: {document['file_size']} characters")
    else:
        print(f"✗ Document not found: {doc_id}")
    print()

    # Test 3: Check extracted entities
    print("=" * 80)
    print("TEST 3: Extracted Entities")
    print("=" * 80)

    for i, doc_id in enumerate(document_ids[:3], 1):  # Check first 3 documents
        entities = await service.get_document_entities(doc_id)
        print(f"\nDocument {i}: {SAMPLE_DOCUMENTS[i-1]['title']}")
        print(f"   Extracted {len(entities)} entities:")

        for entity in entities:
            print(f"   - {entity['mention_text']} ({entity['entity_type']})")
            print(f"     → Resolved to: {entity['canonical_name']}")
            print(f"     → Confidence: {entity['resolution_confidence']:.2f}")
    print()

    # Test 4: Get statistics
    print("=" * 80)
    print("TEST 4: System Statistics")
    print("=" * 80)

    stats = await service.get_stats()
    print(f"📈 Unstructured Data Statistics:")
    print(f"   Total Documents: {stats['total_documents']}")
    print(f"   Total Entities: {stats['total_entities']}")
    print(f"   Total Mentions: {stats['total_mentions']}")
    print()

    # Test 5: Demonstrate entity resolution
    print("=" * 80)
    print("TEST 5: Entity Resolution Demonstration")
    print("=" * 80)

    print("Showing how entities are linked across documents:")
    print()

    # Get all entities from first document
    doc1_entities = await service.get_document_entities(document_ids[0])

    # Find "Acme" mentions
    acme_mentions = [e for e in doc1_entities if "Acme" in e['mention_text']]

    if acme_mentions:
        acme_entity = acme_mentions[0]
        print(f"Entity: {acme_entity['canonical_name']} ({acme_entity['entity_id']})")
        print(f"  Found in multiple documents:")

        # Check other documents for same entity
        for i, doc_id in enumerate(document_ids, 1):
            doc_entities = await service.get_document_entities(doc_id)
            matching = [e for e in doc_entities if e['entity_id'] == acme_entity['entity_id']]
            if matching:
                print(f"    ✓ Document {i}: {SAMPLE_DOCUMENTS[i-1]['title']}")
                for m in matching:
                    print(f"      - Mentioned as: '{m['mention_text']}'")
    print()

    # Final summary
    print("=" * 80)
    print("✅ PHASE 2 TESTING COMPLETE")
    print("=" * 80)
    print("\nSummary:")
    print(f"  ✅ Ingested {stats['total_documents']} documents")
    print(f"  ✅ Extracted {stats['total_mentions']} entity mentions")
    print(f"  ✅ Resolved to {stats['total_entities']} unique entities")
    print(f"  ✅ Demonstrated cross-document entity linking")
    print()
    print("What this enables:")
    print("  • Link unstructured documents to structured data")
    print("  • Track entities across multiple documents")
    print("  • Resolve entity mentions to canonical forms")
    print("  • Hybrid queries spanning structured + unstructured data")
    print()
    print("Next steps:")
    print("  1. Add API routes for document ingestion")
    print("  2. Build hybrid query service (Phase 3)")
    print("  3. Create demo script showing business value")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    asyncio.run(test_phase2())
