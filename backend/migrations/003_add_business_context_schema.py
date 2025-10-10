"""
Kuzu Schema Migration 003: Business Context Layer
Adds business objectives, metrics, and questions to knowledge graph

Purpose:
- Link technical data products to business objectives
- Track business metrics with targets and current values
- Capture common business questions for semantic search
- Enable business-first data product creation

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


class BusinessContextMigration:
    """Migration for business context schema in Kuzu"""

    def __init__(self, kuzu_db_path: str = "./data/nexusone_knowledge.kuzu"):
        self.db_path = kuzu_db_path
        self.db = kuzu.Database(self.db_path)
        self.conn = kuzu.Connection(self.db)

    def up(self):
        """Apply migration: Create business context schema"""
        logger.info("=" * 80)
        logger.info("MIGRATION 003: Adding Business Context Schema")
        logger.info("=" * 80)

        try:
            # 1. Create BusinessObjective node table
            logger.info("\n1. Creating BusinessObjective node table...")
            self.conn.execute("""
                CREATE NODE TABLE BusinessObjective(
                    objective_id STRING PRIMARY KEY,
                    title STRING,
                    description STRING,
                    department STRING,
                    stakeholders STRING,
                    success_criteria STRING,
                    business_value STRING,
                    priority STRING,
                    status STRING,
                    created_at TIMESTAMP,
                    deadline TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ BusinessObjective table created")

            # 2. Create BusinessMetric node table
            logger.info("\n2. Creating BusinessMetric node table...")
            self.conn.execute("""
                CREATE NODE TABLE BusinessMetric(
                    metric_id STRING PRIMARY KEY,
                    metric_name STRING,
                    definition STRING,
                    calculation_logic STRING,
                    target_value DOUBLE,
                    current_value DOUBLE,
                    trend STRING,
                    unit STRING,
                    created_at TIMESTAMP,
                    last_updated TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ BusinessMetric table created")

            # 3. Create BusinessQuestion node table
            logger.info("\n3. Creating BusinessQuestion node table...")
            self.conn.execute("""
                CREATE NODE TABLE BusinessQuestion(
                    question_id STRING PRIMARY KEY,
                    question_text STRING,
                    embedding STRING,
                    frequency INT64,
                    personas STRING,
                    created_at TIMESTAMP,
                    last_asked TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ BusinessQuestion table created")

            # 4. Create relationship: BusinessObjective → DataProduct
            logger.info("\n4. Creating REQUIRES relationship (BusinessObjective → DataProduct)...")
            self.conn.execute("""
                CREATE REL TABLE REQUIRES(
                    FROM BusinessObjective TO DataProduct,
                    priority STRING,
                    deadline TIMESTAMP,
                    created_at TIMESTAMP,
                    justification STRING,
                    estimated_roi STRING,
                    metadata STRING
                )
            """)
            logger.info("✓ REQUIRES relationship created")

            # 5. Create relationship: BusinessMetric → DataColumn
            logger.info("\n5. Creating MEASURED_BY relationship (BusinessMetric → DataColumn)...")
            self.conn.execute("""
                CREATE REL TABLE MEASURED_BY(
                    FROM BusinessMetric TO DataColumn,
                    aggregation STRING,
                    filters STRING,
                    confidence DOUBLE,
                    calculation_example STRING,
                    metadata STRING
                )
            """)
            logger.info("✓ MEASURED_BY relationship created")

            # 6. Create relationship: BusinessQuestion → DataProduct
            logger.info("\n6. Creating ANSWERED_BY relationship (BusinessQuestion → DataProduct)...")
            self.conn.execute("""
                CREATE REL TABLE ANSWERED_BY(
                    FROM BusinessQuestion TO DataProduct,
                    confidence DOUBLE,
                    example_sql STRING,
                    typical_response_time_ms INT64,
                    success_rate DOUBLE,
                    created_at TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ ANSWERED_BY relationship created")

            # 7. Create relationship: DataProduct → BusinessMetric
            logger.info("\n7. Creating IMPACTS relationship (DataProduct → BusinessMetric)...")
            self.conn.execute("""
                CREATE REL TABLE IMPACTS(
                    FROM DataProduct TO BusinessMetric,
                    impact_type STRING,
                    estimated_impact DOUBLE,
                    validated BOOL,
                    validation_date TIMESTAMP,
                    metadata STRING
                )
            """)
            logger.info("✓ IMPACTS relationship created")

            # 8. Create relationship: BusinessObjective → BusinessMetric
            logger.info("\n8. Creating TRACKS relationship (BusinessObjective → BusinessMetric)...")
            self.conn.execute("""
                CREATE REL TABLE TRACKS(
                    FROM BusinessObjective TO BusinessMetric,
                    is_primary_metric BOOL,
                    target_date TIMESTAMP,
                    baseline_value DOUBLE,
                    metadata STRING
                )
            """)
            logger.info("✓ TRACKS relationship created")

            logger.info("\n" + "=" * 80)
            logger.info("✅ Migration 003 completed successfully!")
            logger.info("=" * 80)

            self._print_summary()

        except Exception as e:
            logger.error(f"\n✗ Migration failed: {e}", exc_info=True)
            raise

    def down(self):
        """Rollback migration: Drop business context schema"""
        logger.info("=" * 80)
        logger.info("ROLLBACK MIGRATION 003: Removing Business Context Schema")
        logger.info("=" * 80)

        try:
            # Drop in reverse order (relationships first, then nodes)

            logger.info("\n1. Dropping relationships...")

            try:
                self.conn.execute("DROP TABLE TRACKS")
                logger.info("✓ TRACKS dropped")
            except:
                logger.warning("TRACKS table not found, skipping")

            try:
                self.conn.execute("DROP TABLE IMPACTS")
                logger.info("✓ IMPACTS dropped")
            except:
                logger.warning("IMPACTS table not found, skipping")

            try:
                self.conn.execute("DROP TABLE ANSWERED_BY")
                logger.info("✓ ANSWERED_BY dropped")
            except:
                logger.warning("ANSWERED_BY table not found, skipping")

            try:
                self.conn.execute("DROP TABLE MEASURED_BY")
                logger.info("✓ MEASURED_BY dropped")
            except:
                logger.warning("MEASURED_BY table not found, skipping")

            try:
                self.conn.execute("DROP TABLE REQUIRES")
                logger.info("✓ REQUIRES dropped")
            except:
                logger.warning("REQUIRES table not found, skipping")

            logger.info("\n2. Dropping node tables...")

            try:
                self.conn.execute("DROP TABLE BusinessQuestion")
                logger.info("✓ BusinessQuestion dropped")
            except:
                logger.warning("BusinessQuestion table not found, skipping")

            try:
                self.conn.execute("DROP TABLE BusinessMetric")
                logger.info("✓ BusinessMetric dropped")
            except:
                logger.warning("BusinessMetric table not found, skipping")

            try:
                self.conn.execute("DROP TABLE BusinessObjective")
                logger.info("✓ BusinessObjective dropped")
            except:
                logger.warning("BusinessObjective table not found, skipping")

            logger.info("\n" + "=" * 80)
            logger.info("✅ Rollback 003 completed successfully!")
            logger.info("=" * 80)

        except Exception as e:
            logger.error(f"\n✗ Rollback failed: {e}", exc_info=True)
            raise

    def _print_summary(self):
        """Print migration summary"""
        logger.info("\nMigration Summary:")
        logger.info("------------------")
        logger.info("Node Tables Created:")
        logger.info("  1. BusinessObjective - Business objectives with stakeholders and ROI")
        logger.info("  2. BusinessMetric - Metrics with targets and current values")
        logger.info("  3. BusinessQuestion - Common questions with semantic embeddings")
        logger.info("\nRelationships Created:")
        logger.info("  1. REQUIRES: BusinessObjective → DataProduct")
        logger.info("  2. MEASURED_BY: BusinessMetric → DataColumn")
        logger.info("  3. ANSWERED_BY: BusinessQuestion → DataProduct")
        logger.info("  4. IMPACTS: DataProduct → BusinessMetric")
        logger.info("  5. TRACKS: BusinessObjective → BusinessMetric")
        logger.info("\nWhat this enables:")
        logger.info("  ✓ Business-first data product creation")
        logger.info("  ✓ ROI tracking at graph level")
        logger.info("  ✓ Semantic search for data products by business need")
        logger.info("  ✓ Link technical transformations to business value")

    def verify(self):
        """Verify migration was applied correctly"""
        logger.info("\nVerifying migration...")

        # Check node tables exist
        result = self.conn.execute("CALL show_tables() RETURN *;")
        tables = []
        while result.has_next():
            tables.append(result.get_next()[0])

        expected_tables = [
            "BusinessObjective",
            "BusinessMetric",
            "BusinessQuestion",
            "REQUIRES",
            "MEASURED_BY",
            "ANSWERED_BY",
            "IMPACTS",
            "TRACKS"
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

    migration = BusinessContextMigration()

    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        migration.down()
    else:
        migration.up()
        migration.verify()


if __name__ == "__main__":
    main()
