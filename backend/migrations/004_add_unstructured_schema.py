"""
Kuzu Schema Migration 004: Unstructured Data Layer
Adds support for documents, entities, and entity mentions in knowledge graph

Purpose:
- Store unstructured documents (support tickets, logs, etc.)
- Extract and track entity mentions from documents
- Link entities to structured data (entity resolution)
- Enable hybrid queries across structured + unstructured data

Date: October 10, 2025
"""

import sys
import logging
from pathlib import Path
import kuzu
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class UnstructuredDataMigration:
    """Migration for unstructured data schema in Kuzu"""

    def __init__(self, kuzu_db_path: str = "./data/nexusone_knowledge.kuzu"):
        self.db_path = kuzu_db_path
        self.db = kuzu.Database(self.db_path)
        self.conn = kuzu.Connection(self.db)

    def up(self):
        """Apply migration: Create unstructured data schema"""
        logger.info("=" * 80)
        logger.info("MIGRATION 004: Adding Unstructured Data Schema")
        logger.info("=" * 80)

        try:
            # 1. Create Volume node table (Unity Catalog Volumes)
            logger.info("\n1. Creating Volume node table...")
            self.conn.execute("""
                CREATE NODE TABLE Volume(
                    volume_id STRING PRIMARY KEY,
                    volume_name STRING,
                    catalog_name STRING,
                    schema_name STRING,
                    storage_location STRING,
                    volume_type STRING,
                    created_at TIMESTAMP,
                    created_by STRING,
                    metadata STRING
                )
            """)
            logger.info("✓ Volume table created")

            # 2. Create Document node table
            logger.info("\n2. Creating Document node table...")
            self.conn.execute("""
                CREATE NODE TABLE Document(
                    document_id STRING PRIMARY KEY,
                    document_type STRING,
                    title STRING,
                    content STRING,
                    source STRING,
                    author STRING,
                    created_at TIMESTAMP,
                    ingested_at TIMESTAMP,
                    file_path STRING,
                    file_size INT64,
                    embedding STRING,
                    metadata STRING
                )
            """)
            logger.info("✓ Document table created")

            # 3. Create Entity node table
            logger.info("\n3. Creating Entity node table...")
            self.conn.execute("""
                CREATE NODE TABLE Entity(
                    entity_id STRING PRIMARY KEY,
                    entity_type STRING,
                    canonical_name STRING,
                    confidence DOUBLE,
                    first_seen TIMESTAMP,
                    last_seen TIMESTAMP,
                    mention_count INT64,
                    metadata STRING
                )
            """)
            logger.info("✓ Entity table created")

            # 4. Create EntityMention node table
            logger.info("\n4. Creating EntityMention node table...")
            self.conn.execute("""
                CREATE NODE TABLE EntityMention(
                    mention_id STRING PRIMARY KEY,
                    mention_text STRING,
                    entity_type STRING,
                    start_position INT64,
                    end_position INT64,
                    confidence DOUBLE,
                    context STRING,
                    extracted_at TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ EntityMention table created")

            # 5. Create relationship: Document → Volume
            logger.info("\n5. Creating STORED_IN relationship (Document → Volume)...")
            self.conn.execute("""
                CREATE REL TABLE STORED_IN(
                    FROM Document TO Volume,
                    relative_path STRING,
                    storage_format STRING,
                    compression STRING,
                    created_at TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ STORED_IN relationship created")

            # 6. Create relationship: EntityMention → Document
            logger.info("\n6. Creating MENTIONED_IN relationship (EntityMention → Document)...")
            self.conn.execute("""
                CREATE REL TABLE MENTIONED_IN(
                    FROM EntityMention TO Document,
                    sentence_number INT64,
                    paragraph_number INT64,
                    extraction_method STRING,
                    created_at TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ MENTIONED_IN relationship created")

            # 7. Create relationship: EntityMention → Entity
            logger.info("\n7. Creating REFERS_TO relationship (EntityMention → Entity)...")
            self.conn.execute("""
                CREATE REL TABLE REFERS_TO(
                    FROM EntityMention TO Entity,
                    confidence DOUBLE,
                    resolution_method STRING,
                    resolved_at TIMESTAMP,
                    verified BOOL,
                    metadata STRING
                )
            """)
            logger.info("✓ REFERS_TO relationship created")

            # 8. Create relationship: Entity → DataColumn (entity resolution)
            logger.info("\n8. Creating STORED_IN_ROW relationship (Entity → DataColumn)...")
            self.conn.execute("""
                CREATE REL TABLE STORED_IN_ROW(
                    FROM Entity TO DataColumn,
                    row_identifier STRING,
                    match_score DOUBLE,
                    match_method STRING,
                    validated BOOL,
                    validation_date TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ STORED_IN_ROW relationship created")

            # 9. Create relationship: Document → BusinessQuestion
            logger.info("\n9. Creating DISCUSSES relationship (Document → BusinessQuestion)...")
            self.conn.execute("""
                CREATE REL TABLE DISCUSSES(
                    FROM Document TO BusinessQuestion,
                    relevance_score DOUBLE,
                    key_phrases STRING,
                    sentiment STRING,
                    created_at TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ DISCUSSES relationship created")

            # 10. Create relationship: Document → DataTable (document relates to table)
            logger.info("\n10. Creating REFERENCES_TABLE relationship (Document → DataTable)...")
            self.conn.execute("""
                CREATE REL TABLE REFERENCES_TABLE(
                    FROM Document TO DataTable,
                    reference_type STRING,
                    confidence DOUBLE,
                    context STRING,
                    created_at TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ REFERENCES_TABLE relationship created")

            logger.info("\n" + "=" * 80)
            logger.info("✅ Migration 004 completed successfully!")
            logger.info("=" * 80)

            self._print_summary()

        except Exception as e:
            logger.error(f"\n✗ Migration failed: {e}", exc_info=True)
            raise

    def down(self):
        """Rollback migration: Drop unstructured data schema"""
        logger.info("=" * 80)
        logger.info("ROLLBACK MIGRATION 004: Removing Unstructured Data Schema")
        logger.info("=" * 80)

        try:
            # Drop in reverse order (relationships first, then nodes)

            logger.info("\n1. Dropping relationships...")

            try:
                self.conn.execute("DROP TABLE REFERENCES_TABLE")
                logger.info("✓ REFERENCES_TABLE dropped")
            except:
                logger.warning("REFERENCES_TABLE table not found, skipping")

            try:
                self.conn.execute("DROP TABLE DISCUSSES")
                logger.info("✓ DISCUSSES dropped")
            except:
                logger.warning("DISCUSSES table not found, skipping")

            try:
                self.conn.execute("DROP TABLE STORED_IN_ROW")
                logger.info("✓ STORED_IN_ROW dropped")
            except:
                logger.warning("STORED_IN_ROW table not found, skipping")

            try:
                self.conn.execute("DROP TABLE REFERS_TO")
                logger.info("✓ REFERS_TO dropped")
            except:
                logger.warning("REFERS_TO table not found, skipping")

            try:
                self.conn.execute("DROP TABLE MENTIONED_IN")
                logger.info("✓ MENTIONED_IN dropped")
            except:
                logger.warning("MENTIONED_IN table not found, skipping")

            try:
                self.conn.execute("DROP TABLE STORED_IN")
                logger.info("✓ STORED_IN dropped")
            except:
                logger.warning("STORED_IN table not found, skipping")

            logger.info("\n2. Dropping node tables...")

            try:
                self.conn.execute("DROP TABLE EntityMention")
                logger.info("✓ EntityMention dropped")
            except:
                logger.warning("EntityMention table not found, skipping")

            try:
                self.conn.execute("DROP TABLE Entity")
                logger.info("✓ Entity dropped")
            except:
                logger.warning("Entity table not found, skipping")

            try:
                self.conn.execute("DROP TABLE Document")
                logger.info("✓ Document dropped")
            except:
                logger.warning("Document table not found, skipping")

            try:
                self.conn.execute("DROP TABLE Volume")
                logger.info("✓ Volume dropped")
            except:
                logger.warning("Volume table not found, skipping")

            logger.info("\n" + "=" * 80)
            logger.info("✅ Rollback 004 completed successfully!")
            logger.info("=" * 80)

        except Exception as e:
            logger.error(f"\n✗ Rollback failed: {e}", exc_info=True)
            raise

    def _print_summary(self):
        """Print migration summary"""
        logger.info("\nMigration Summary:")
        logger.info("------------------")
        logger.info("Node Tables Created:")
        logger.info("  1. Volume - Unity Catalog Volumes for unstructured storage")
        logger.info("  2. Document - Unstructured documents (tickets, logs, etc.)")
        logger.info("  3. Entity - Resolved entities with canonical names")
        logger.info("  4. EntityMention - Entity mentions extracted from documents")
        logger.info("\nRelationships Created:")
        logger.info("  1. STORED_IN: Document → Volume")
        logger.info("  2. MENTIONED_IN: EntityMention → Document")
        logger.info("  3. REFERS_TO: EntityMention → Entity")
        logger.info("  4. STORED_IN_ROW: Entity → DataColumn (entity resolution)")
        logger.info("  5. DISCUSSES: Document → BusinessQuestion")
        logger.info("  6. REFERENCES_TABLE: Document → DataTable")
        logger.info("\nWhat this enables:")
        logger.info("  ✓ Ingest unstructured documents into knowledge graph")
        logger.info("  ✓ Extract entities from documents using LLM")
        logger.info("  ✓ Resolve entities to structured data rows")
        logger.info("  ✓ Link documents to business questions")
        logger.info("  ✓ Hybrid queries across structured + unstructured data")
        logger.info("  ✓ Unity Catalog Volumes integration")

    def verify(self):
        """Verify migration was applied correctly"""
        logger.info("\nVerifying migration...")

        # Check node tables exist
        result = self.conn.execute("CALL show_tables() RETURN *;")
        tables = []
        while result.has_next():
            tables.append(result.get_next()[0])

        expected_tables = [
            "Volume",
            "Document",
            "Entity",
            "EntityMention",
            "STORED_IN",
            "MENTIONED_IN",
            "REFERS_TO",
            "STORED_IN_ROW",
            "DISCUSSES",
            "REFERENCES_TABLE"
        ]

        found_tables = [t for t in expected_tables if t in tables]
        missing_tables = [t for t in expected_tables if t not in tables]

        logger.info(f"\nFound tables: {len(found_tables)}/{len(expected_tables)}")
        for table in found_tables:
            logger.info(f"  ✓ {table}")

        if missing_tables:
            logger.warning(f"\nMissing tables:")
            for table in missing_tables:
                logger.warning(f"  ✗ {table}")
        else:
            logger.info("\n✅ All expected tables found!")

        return len(missing_tables) == 0


def main():
    """Main execution"""
    import sys

    migration = UnstructuredDataMigration()

    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        migration.down()
    else:
        migration.up()
        migration.verify()


if __name__ == "__main__":
    main()
