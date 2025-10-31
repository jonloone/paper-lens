#!/usr/bin/env python3
"""
Seed Kuzu Knowledge Graph with sample semantic data for discovery.
Creates BusinessTerms, DataColumns, DataTables, and relationships.
"""

import logging
from datetime import datetime
from backend.services.kuzu_knowledge_graph import get_knowledge_graph

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_semantic_data():
    """Seed sample semantic data for testing discovery"""

    logger.info("🌱 Starting semantic data seeding...")
    kg = get_knowledge_graph()

    # Sample DataTables (source-aligned products)
    tables = [
        {
            "id": "tbl_customers",
            "full_name": "analytics.warehouse.customers",
            "domain": "customer_analytics",
            "row_count": 150000,
            "completeness": 0.95,
            "quality_score": 0.92,
            "last_profiled_at": datetime.now()
        },
        {
            "id": "tbl_transactions",
            "full_name": "analytics.warehouse.transactions",
            "domain": "sales",
            "row_count": 5000000,
            "completeness": 0.98,
            "quality_score": 0.89,
            "last_profiled_at": datetime.now()
        },
        {
            "id": "tbl_products",
            "full_name": "analytics.warehouse.products",
            "domain": "product_catalog",
            "row_count": 25000,
            "completeness": 0.97,
            "quality_score": 0.94,
            "last_profiled_at": datetime.now()
        },
        {
            "id": "tbl_orders",
            "full_name": "analytics.sales.orders",
            "domain": "sales",
            "row_count": 2000000,
            "completeness": 0.96,
            "quality_score": 0.91,
            "last_profiled_at": datetime.now()
        },
        {
            "id": "tbl_regions",
            "full_name": "analytics.geo.regions",
            "domain": "geography",
            "row_count": 500,
            "completeness": 1.0,
            "quality_score": 0.99,
            "last_profiled_at": datetime.now()
        }
    ]

    # Sample BusinessTerms
    business_terms = [
        {"id": "term_customer", "term": "customer", "definition": "Individual or organization purchasing products/services", "domain": "customer_analytics"},
        {"id": "term_revenue", "term": "revenue", "definition": "Total income from sales", "domain": "finance"},
        {"id": "term_region", "term": "region", "definition": "Geographic area for sales/operations", "domain": "geography"},
        {"id": "term_product", "term": "product", "definition": "Item or service sold to customers", "domain": "product_catalog"},
        {"id": "term_transaction", "term": "transaction", "definition": "Individual sale or purchase event", "domain": "sales"},
        {"id": "term_order", "term": "order", "definition": "Customer request for products/services", "domain": "sales"},
        {"id": "term_sales", "term": "sales", "definition": "Revenue from selling products/services", "domain": "finance"},
        {"id": "term_amount", "term": "amount", "definition": "Monetary value", "domain": "finance"},
        {"id": "term_date", "term": "date", "definition": "Temporal dimension", "domain": "time"}
    ]

    # Sample DataColumns
    columns = [
        # Customers table columns
        {"id": "col_cust_id", "name": "customer_id", "table_id": "tbl_customers", "data_type": "INTEGER", "description": "Unique customer identifier"},
        {"id": "col_cust_name", "name": "customer_name", "table_id": "tbl_customers", "data_type": "STRING", "description": "Customer full name"},
        {"id": "col_cust_region", "name": "region_code", "table_id": "tbl_customers", "data_type": "STRING", "description": "Customer's geographic region"},
        {"id": "col_cust_segment", "name": "customer_segment", "table_id": "tbl_customers", "data_type": "STRING", "description": "Customer category"},

        # Transactions table columns
        {"id": "col_txn_id", "name": "transaction_id", "table_id": "tbl_transactions", "data_type": "INTEGER", "description": "Unique transaction identifier"},
        {"id": "col_txn_cust", "name": "customer_id", "table_id": "tbl_transactions", "data_type": "INTEGER", "description": "Customer who made transaction"},
        {"id": "col_txn_amount", "name": "amount", "table_id": "tbl_transactions", "data_type": "DECIMAL", "description": "Transaction monetary value"},
        {"id": "col_txn_date", "name": "transaction_date", "table_id": "tbl_transactions", "data_type": "TIMESTAMP", "description": "When transaction occurred"},
        {"id": "col_txn_product", "name": "product_id", "table_id": "tbl_transactions", "data_type": "INTEGER", "description": "Product sold in transaction"},

        # Products table columns
        {"id": "col_prod_id", "name": "product_id", "table_id": "tbl_products", "data_type": "INTEGER", "description": "Unique product identifier"},
        {"id": "col_prod_name", "name": "product_name", "table_id": "tbl_products", "data_type": "STRING", "description": "Product name"},
        {"id": "col_prod_price", "name": "unit_price", "table_id": "tbl_products", "data_type": "DECIMAL", "description": "Product selling price"},
        {"id": "col_prod_category", "name": "category", "table_id": "tbl_products", "data_type": "STRING", "description": "Product category"},

        # Orders table columns
        {"id": "col_order_id", "name": "order_id", "table_id": "tbl_orders", "data_type": "INTEGER", "description": "Unique order identifier"},
        {"id": "col_order_cust", "name": "customer_id", "table_id": "tbl_orders", "data_type": "INTEGER", "description": "Customer who placed order"},
        {"id": "col_order_total", "name": "order_total", "table_id": "tbl_orders", "data_type": "DECIMAL", "description": "Total order amount"},
        {"id": "col_order_date", "name": "order_date", "table_id": "tbl_orders", "data_type": "TIMESTAMP", "description": "When order was placed"},

        # Regions table columns
        {"id": "col_region_code", "name": "region_code", "table_id": "tbl_regions", "data_type": "STRING", "description": "Region identifier"},
        {"id": "col_region_name", "name": "region_name", "table_id": "tbl_regions", "data_type": "STRING", "description": "Region display name"}
    ]

    # Semantic mappings (Column -> BusinessTerm)
    semantic_mappings = [
        # Customer mappings
        ("col_cust_id", "term_customer", 1.0),
        ("col_cust_name", "term_customer", 0.9),
        ("col_txn_cust", "term_customer", 0.95),
        ("col_order_cust", "term_customer", 0.95),

        # Revenue/Amount mappings
        ("col_txn_amount", "term_revenue", 0.85),
        ("col_txn_amount", "term_amount", 1.0),
        ("col_order_total", "term_revenue", 0.9),
        ("col_order_total", "term_sales", 0.9),
        ("col_prod_price", "term_amount", 0.8),

        # Region mappings
        ("col_cust_region", "term_region", 1.0),
        ("col_region_code", "term_region", 1.0),
        ("col_region_name", "term_region", 0.95),

        # Product mappings
        ("col_prod_id", "term_product", 1.0),
        ("col_prod_name", "term_product", 0.9),
        ("col_txn_product", "term_product", 0.95),

        # Transaction/Order mappings
        ("col_txn_id", "term_transaction", 1.0),
        ("col_order_id", "term_order", 1.0),

        # Date mappings
        ("col_txn_date", "term_date", 0.9),
        ("col_order_date", "term_date", 0.9)
    ]

    # Insert DataTables
    logger.info("Inserting DataTables...")
    for table in tables:
        try:
            kg.conn.execute("""
                MERGE (t:DataTable {id: $id})
                ON MATCH SET
                    t.full_name = $full_name,
                    t.domain = $domain,
                    t.row_count = $row_count,
                    t.completeness = $completeness,
                    t.quality_score = $quality_score,
                    t.last_profiled_at = $last_profiled_at
                ON CREATE SET
                    t.full_name = $full_name,
                    t.domain = $domain,
                    t.row_count = $row_count,
                    t.completeness = $completeness,
                    t.quality_score = $quality_score,
                    t.last_profiled_at = $last_profiled_at,
                    t.metadata = '{}'
            """, {
                "id": table["id"],
                "full_name": table["full_name"],
                "domain": table["domain"],
                "row_count": table["row_count"],
                "completeness": table["completeness"],
                "quality_score": table["quality_score"],
                "last_profiled_at": table["last_profiled_at"]
            })
            logger.info(f"  ✓ {table['full_name']}")
        except Exception as e:
            logger.error(f"  ✗ Failed to insert table {table['id']}: {e}")

    # Insert BusinessTerms
    logger.info("Inserting BusinessTerms...")
    for term in business_terms:
        try:
            kg.conn.execute("""
                MERGE (t:BusinessTerm {id: $id})
                ON MATCH SET
                    t.term = $term,
                    t.definition = $definition,
                    t.domain = $domain
                ON CREATE SET
                    t.term = $term,
                    t.definition = $definition,
                    t.domain = $domain,
                    t.created_at = $created_at,
                    t.updated_at = $created_at,
                    t.metadata = '{}'
            """, {
                "id": term["id"],
                "term": term["term"],
                "definition": term["definition"],
                "domain": term["domain"],
                "created_at": datetime.now()
            })
            logger.info(f"  ✓ {term['term']}")
        except Exception as e:
            logger.error(f"  ✗ Failed to insert term {term['id']}: {e}")

    # Insert DataColumns
    logger.info("Inserting DataColumns...")
    for col in columns:
        try:
            kg.conn.execute("""
                MERGE (c:DataColumn {id: $id})
                ON MATCH SET
                    c.name = $name,
                    c.table_id = $table_id,
                    c.data_type = $data_type,
                    c.description = $description
                ON CREATE SET
                    c.name = $name,
                    c.table_id = $table_id,
                    c.data_type = $data_type,
                    c.description = $description,
                    c.is_nullable = true,
                    c.sample_values = [],
                    c.distinct_count = 0,
                    c.null_percentage = 0.0,
                    c.semantic_tags = [],
                    c.created_at = $created_at
            """, {
                "id": col["id"],
                "name": col["name"],
                "table_id": col["table_id"],
                "data_type": col["data_type"],
                "description": col["description"],
                "created_at": datetime.now()
            })
        except Exception as e:
            logger.error(f"  ✗ Failed to insert column {col['id']}: {e}")
    logger.info(f"  ✓ Inserted {len(columns)} columns")

    # Create BELONGS_TO relationships (Column -> DataTable)
    logger.info("Creating BELONGS_TO relationships...")
    for idx, col in enumerate(columns):
        try:
            kg.conn.execute("""
                MATCH (c:DataColumn {id: $col_id})
                MATCH (t:DataTable {id: $table_id})
                MERGE (c)-[r:BELONGS_TO]->(t)
                ON CREATE SET
                    r.position = $position,
                    r.is_primary_key = false,
                    r.is_foreign_key = false,
                    r.created_at = $created_at
            """, {
                "col_id": col["id"],
                "table_id": col["table_id"],
                "position": idx,
                "created_at": datetime.now()
            })
        except Exception as e:
            logger.error(f"  ✗ Failed to create BELONGS_TO for {col['id']}: {e}")
    logger.info(f"  ✓ Created {len(columns)} BELONGS_TO relationships")

    # Create MAPS_TO_TERM relationships (Column -> BusinessTerm)
    logger.info("Creating MAPS_TO_TERM relationships...")
    for col_id, term_id, confidence in semantic_mappings:
        try:
            kg.conn.execute("""
                MATCH (c:DataColumn {id: $col_id})
                MATCH (t:BusinessTerm {id: $term_id})
                MERGE (c)-[r:MAPS_TO_TERM]->(t)
                ON CREATE SET
                    r.confidence = $confidence,
                    r.mapping_source = 'seed_data',
                    r.verified = true,
                    r.verified_by = 'system',
                    r.verified_at = $verified_at,
                    r.created_at = $verified_at
            """, {
                "col_id": col_id,
                "term_id": term_id,
                "confidence": confidence,
                "verified_at": datetime.now()
            })
        except Exception as e:
            logger.error(f"  ✗ Failed to create MAPS_TO_TERM {col_id} -> {term_id}: {e}")
    logger.info(f"  ✓ Created {len(semantic_mappings)} MAPS_TO_TERM relationships")

    # Verify seeding
    logger.info("Verifying semantic graph...")
    try:
        # Count nodes
        result = kg.conn.execute("MATCH (t:DataTable) RETURN count(*) as count")
        table_count = result.get_next()[0] if result.has_next() else 0

        result = kg.conn.execute("MATCH (c:DataColumn) RETURN count(*) as count")
        column_count = result.get_next()[0] if result.has_next() else 0

        result = kg.conn.execute("MATCH (t:BusinessTerm) RETURN count(*) as count")
        term_count = result.get_next()[0] if result.has_next() else 0

        # Count relationships
        result = kg.conn.execute("MATCH ()-[r:BELONGS_TO]->() RETURN count(*) as count")
        belongs_count = result.get_next()[0] if result.has_next() else 0

        result = kg.conn.execute("MATCH ()-[r:MAPS_TO_TERM]->() RETURN count(*) as count")
        maps_count = result.get_next()[0] if result.has_next() else 0

        logger.info(f"""
✅ Semantic Graph Seeded Successfully!

Nodes:
  - DataTables: {table_count}
  - DataColumns: {column_count}
  - BusinessTerms: {term_count}

Relationships:
  - BELONGS_TO: {belongs_count}
  - MAPS_TO_TERM: {maps_count}

Sample Query Test:
  Try: "I need daily customer revenue by region"
  Expected: Should find transactions, customers, and orders tables
        """)

    except Exception as e:
        logger.error(f"Verification failed: {e}")

    logger.info("🎉 Semantic data seeding complete!")


if __name__ == "__main__":
    seed_semantic_data()
