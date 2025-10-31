"""
SQL Generation Service
Generates SQL queries from intent + selected sources
Specialized for Trino dialect with best practices
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
from .intent_analysis_service import ExtractedIntent
from .source_recommendation_service import SourceRecommendation
from .vultr_llm_service import get_llm_service

logger = logging.getLogger(__name__)


class GeneratedSQL(BaseModel):
    """Generated SQL with metadata"""
    sql: str
    dialect: str  # "trino"
    explanation: str
    estimated_rows: Optional[int] = None
    joins_used: List[str] = []
    filters_applied: List[str] = []
    aggregations: List[str] = []


class SQLGenerationService:
    """
    Generates SQL queries from structured intent and selected sources
    Optimized for Trino SQL dialect
    """

    def __init__(self):
        self.llm = get_llm_service()

    async def generate_sql(
        self,
        intent: ExtractedIntent,
        selected_sources: List[SourceRecommendation]
    ) -> GeneratedSQL:
        """
        Generate Trino SQL from intent and sources

        Strategy:
        1. Identify primary table (highest score)
        2. Determine join strategy if multiple sources
        3. Apply filters from intent
        4. Add aggregations based on metrics
        5. Format for Trino dialect
        """

        if not selected_sources:
            raise ValueError("No sources provided for SQL generation")

        system_prompt = """You are a Trino SQL expert generating queries.

Rules:
1. Use Trino SQL syntax (not PostgreSQL)
2. Always use qualified table names (catalog.schema.table)
3. Add comments explaining each section
4. Use CTEs for complex queries
5. Include WHERE clauses for filters
6. Add GROUP BY for aggregations
7. Use proper date functions (date_trunc for Trino)
8. Limit to 1000 rows by default
9. Use CAST for type conversions
10. For time dimensions, use appropriate date_trunc('day'|'month', date_column)

Format:
-- Purpose: [what this query does]
-- Sources: [tables used]

WITH source_data AS (
  SELECT ...
  FROM catalog.schema.table
  WHERE ...
)
SELECT ...
FROM source_data
GROUP BY ...
ORDER BY ...
LIMIT 1000;
"""

        # Build context for LLM
        sources_context = "\n".join([
            f"- {s.catalog}.{s.schema}.{s.table} (quality: {s.quality_score:.0%}, "
            f"matches: {', '.join(s.match_entities)})"
            for s in selected_sources
        ])

        # Build column context if available
        column_hints = []
        for source in selected_sources:
            if source.match_entities:
                column_hints.append(
                    f"Table {source.table} likely contains columns for: {', '.join(source.match_entities)}"
                )

        user_prompt = f"""User Intent: "{intent.raw_query}"

Structured Requirements:
- Entities: {', '.join(intent.primary_entities)}
- Metrics: {', '.join(intent.metrics)}
- Time Dimension: {intent.time_dimension or 'None'}
- Filters: {', '.join(intent.filters) if intent.filters else 'None'}
- Aggregation Level: {intent.aggregation_level}
- Use Case: {intent.use_case}

Available Sources:
{sources_context}

Column Hints:
{chr(10).join(column_hints) if column_hints else 'No specific hints'}

Generate Trino SQL query:"""

        try:
            # Generate SQL using LLM
            sql_response = await self.llm.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.3,
                max_tokens=800
            )

            # Parse SQL (extract from markdown if needed)
            sql = self._extract_sql(sql_response)

            # Generate explanation
            explanation = f"This query {self._summarize_intent(intent)} using {len(selected_sources)} source(s)"

            # Extract query metadata
            joins_used = self._extract_joins(sql)
            filters_applied = self._extract_filters(sql)
            aggregations = self._extract_aggregations(sql)

            return GeneratedSQL(
                sql=sql,
                dialect="trino",
                explanation=explanation,
                estimated_rows=None,  # TODO: Add cardinality estimation
                joins_used=joins_used,
                filters_applied=filters_applied,
                aggregations=aggregations
            )

        except Exception as e:
            logger.error(f"SQL generation failed: {e}")
            # Fallback: Generate basic SELECT
            return self._generate_fallback_sql(intent, selected_sources)

    def _extract_sql(self, response: str) -> str:
        """Extract SQL from LLM response (may be in markdown)"""
        # Check if SQL is in code block
        if "```sql" in response:
            start = response.find("```sql") + 6
            end = response.find("```", start)
            if end > start:
                return response[start:end].strip()
        elif "```" in response:
            start = response.find("```") + 3
            end = response.find("```", start)
            if end > start:
                return response[start:end].strip()
        else:
            return response.strip()

    def _summarize_intent(self, intent: ExtractedIntent) -> str:
        """Generate human-readable intent summary"""
        parts = []

        if intent.metrics:
            parts.append(f"calculates {', '.join(intent.metrics)}")

        if intent.primary_entities:
            parts.append(f"for {', '.join(intent.primary_entities)}")

        if intent.aggregation_level:
            parts.append(f"grouped by {intent.aggregation_level}")

        if intent.time_dimension:
            parts.append(f"at {intent.time_dimension} level")

        return " ".join(parts)

    def _extract_joins(self, sql: str) -> List[str]:
        """Extract JOIN clauses from SQL"""
        joins = []
        sql_upper = sql.upper()

        if "JOIN" in sql_upper:
            lines = sql.split('\n')
            for line in lines:
                if "JOIN" in line.upper():
                    joins.append(line.strip())

        return joins

    def _extract_filters(self, sql: str) -> List[str]:
        """Extract WHERE clauses from SQL"""
        filters = []
        sql_upper = sql.upper()

        if "WHERE" in sql_upper:
            lines = sql.split('\n')
            capture = False
            for line in lines:
                if "WHERE" in line.upper():
                    capture = True
                    filters.append(line.strip())
                elif capture and ("AND" in line.upper() or "OR" in line.upper()):
                    filters.append(line.strip())
                elif capture and any(keyword in line.upper() for keyword in ["GROUP", "ORDER", "LIMIT", "HAVING"]):
                    break

        return filters

    def _extract_aggregations(self, sql: str) -> List[str]:
        """Extract aggregation functions from SQL"""
        aggregations = []
        agg_funcs = ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX', 'STDDEV', 'VARIANCE']

        sql_upper = sql.upper()
        for func in agg_funcs:
            if func + '(' in sql_upper:
                aggregations.append(func)

        return aggregations

    def _generate_fallback_sql(
        self,
        intent: ExtractedIntent,
        sources: List[SourceRecommendation]
    ) -> GeneratedSQL:
        """Generate basic SQL if LLM fails"""

        if not sources:
            raise ValueError("No sources provided for SQL generation")

        primary_source = sources[0]

        # Basic SELECT with optional time filter
        time_filter = ""
        if intent.time_dimension:
            # Try to guess a date column name
            date_col = "created_at"  # Default guess
            if intent.time_dimension == "daily":
                time_filter = f"\n  AND DATE_TRUNC('day', {date_col}) >= CURRENT_DATE - INTERVAL '30' DAY"
            elif intent.time_dimension == "monthly":
                time_filter = f"\n  AND DATE_TRUNC('month', {date_col}) >= CURRENT_DATE - INTERVAL '6' MONTH"

        sql = f"""-- Purpose: {intent.raw_query}
-- Source: {primary_source.table_name}
-- Generated: Fallback query (LLM generation failed)

SELECT *
FROM {primary_source.catalog}.{primary_source.schema}.{primary_source.table}
WHERE 1=1{time_filter}
LIMIT 1000;
"""

        return GeneratedSQL(
            sql=sql,
            dialect="trino",
            explanation=f"Basic query from {primary_source.table_name} (fallback mode)",
            estimated_rows=1000,
            joins_used=[],
            filters_applied=[time_filter] if time_filter else [],
            aggregations=[]
        )


# Singleton instance
_sql_generation_service = None

def get_sql_generation_service() -> SQLGenerationService:
    """Get or create singleton SQL generation service instance"""
    global _sql_generation_service
    if _sql_generation_service is None:
        _sql_generation_service = SQLGenerationService()
    return _sql_generation_service
