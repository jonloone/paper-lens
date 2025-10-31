"""
Source Recommendation Service
Recommends data sources based on intent analysis and usage patterns
Combines semantic matching, quality filtering, and usage statistics
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
from .intent_analysis_service import ExtractedIntent
from .recommendation_engine import RecommendationEngine
from .kuzu_knowledge_graph import get_knowledge_graph

logger = logging.getLogger(__name__)


class SourceRecommendation(BaseModel):
    """Recommended data source with reasoning"""
    table_id: str
    table_name: str
    catalog: str
    schema: str
    table: str
    score: float  # 0-100
    confidence: float  # 0-1
    reasoning: List[str]
    quality_score: float
    usage_count: int
    freshness_hours: Optional[int] = None
    row_count: Optional[int] = None
    match_entities: List[str]  # Which entities this table provides
    match_type: str  # "exact", "partial", "inferred", "semantic", "usage_pattern"


class SourceRecommendationService:
    """
    Recommends sources by combining:
    1. Intent-based semantic matching
    2. Usage pattern analysis
    3. Quality filtering
    """

    def __init__(self):
        self.kg = get_knowledge_graph()
        self.rec_engine = RecommendationEngine()

    async def recommend_sources(
        self,
        intent: ExtractedIntent,
        limit: int = 5,
        min_quality: float = 0.70
    ) -> List[SourceRecommendation]:
        """
        Recommend sources based on extracted intent

        Strategy:
        1. Find tables with matching entities (Kuzu BusinessTerm → DataTable)
        2. Get usage-based recommendations (from recommendation_engine)
        3. Filter by quality score
        4. Rank by combined score
        5. Generate reasoning for each recommendation
        """

        recommendations = []

        # Step 1: Get usage-based recommendations (existing engine)
        usage_recs = await self.rec_engine.recommend_tables_for_intent(
            business_keywords=intent.primary_entities + intent.metrics,
            user_department=intent.department,
            limit=limit * 2  # Fetch extra, will re-rank
        )

        logger.info(f"Found {len(usage_recs)} usage-based recommendations")

        # Step 2: Semantic matching via Kuzu graph
        semantic_matches = []
        for entity in intent.primary_entities:
            matches = await self._find_semantic_matches(entity, intent)
            semantic_matches.extend(matches)

        logger.info(f"Found {len(semantic_matches)} semantic matches")

        # Step 3: Convert to SourceRecommendation and deduplicate
        seen_tables = set()

        # Add semantic matches first (higher priority)
        for match in semantic_matches:
            table_id = match.get('table_id')
            if table_id and table_id not in seen_tables:
                rec = self._to_source_recommendation(match, intent)
                if rec.quality_score >= min_quality:
                    recommendations.append(rec)
                    seen_tables.add(table_id)

        # Add usage recommendations not found semantically
        for usage_rec in usage_recs:
            if usage_rec.table_id not in seen_tables:
                rec = self._from_usage_rec(usage_rec, intent)
                if rec.quality_score >= min_quality:
                    recommendations.append(rec)
                    seen_tables.add(usage_rec.table_id)

        # Step 4: Re-rank by combined confidence
        recommendations = self._rerank_by_confidence(recommendations, intent)

        # Step 5: Limit results
        final_recs = recommendations[:limit]

        logger.info(f"Returning {len(final_recs)} final recommendations")
        return final_recs

    async def _find_semantic_matches(
        self,
        entity: str,
        intent: ExtractedIntent
    ) -> List[Dict[str, Any]]:
        """
        Find tables via semantic graph traversal
        BusinessTerm ← DataColumn → DataTable
        """

        try:
            # Query Kuzu for tables with matching business terms
            # Pattern: DataColumn -> BusinessTerm, DataColumn -> DataTable
            result = self.kg.conn.execute("""
                MATCH (col:DataColumn)-[:MAPS_TO_TERM]->(term:BusinessTerm)
                MATCH (col)-[:BELONGS_TO]->(table:DataTable)
                WHERE toLower(term.term) CONTAINS $entity
                RETURN
                    table.id as table_id,
                    table.full_name as table_name,
                    table.quality_score as quality,
                    table.row_count as rows,
                    term.term as matched_term,
                    col.name as column_name
                LIMIT 10
            """, {"entity": entity.lower()})

            matches = []
            while result.has_next():
                row = result.get_next()
                matches.append({
                    "table_id": row[0],
                    "table_name": row[1],
                    "quality_score": row[2] or 0.0,
                    "row_count": row[3] or 0,
                    "matched_term": row[4],
                    "column_name": row[5],
                    "match_type": "semantic"
                })

            return matches

        except Exception as e:
            logger.error(f"Semantic matching failed for entity '{entity}': {e}")
            return []

    def _to_source_recommendation(
        self,
        match: Dict[str, Any],
        intent: ExtractedIntent
    ) -> SourceRecommendation:
        """Convert semantic match to SourceRecommendation"""

        # Parse table name (format: catalog.schema.table)
        parts = match['table_name'].split('.')
        catalog = parts[0] if len(parts) >= 3 else 'unknown'
        schema = parts[1] if len(parts) >= 3 else parts[0]
        table = parts[-1]

        # Calculate score
        quality_component = match['quality_score'] * 0.5
        semantic_component = 0.3  # Semantic match gets bonus
        score = min((quality_component + semantic_component) * 100, 100)

        # Generate reasoning
        reasoning = [
            f"Contains '{match['matched_term']}' in column '{match['column_name']}'",
            f"Quality score: {match['quality_score']:.0%}",
            f"Semantic match for entity '{match['matched_term']}'"
        ]

        if match.get('row_count', 0) > 0:
            reasoning.append(f"{match['row_count']:,} rows available")

        return SourceRecommendation(
            table_id=match['table_id'],
            table_name=match['table_name'],
            catalog=catalog,
            schema=schema,
            table=table,
            score=score,
            confidence=0.75,
            reasoning=reasoning,
            quality_score=match['quality_score'],
            usage_count=0,  # Not from usage patterns
            freshness_hours=None,
            row_count=match.get('row_count'),
            match_entities=[match['matched_term']],
            match_type="semantic"
        )

    def _from_usage_rec(
        self,
        usage_rec: Any,
        intent: ExtractedIntent
    ) -> SourceRecommendation:
        """Convert usage-based recommendation to SourceRecommendation"""

        # Parse table name
        parts = usage_rec.table_name.split('.')
        catalog = parts[0] if len(parts) >= 3 else 'unknown'
        schema = parts[1] if len(parts) >= 3 else parts[0]
        table = parts[-1]

        # Score combines quality + usage
        score = (usage_rec.quality_score * 0.5 + min(usage_rec.usage_count / 100, 0.5)) * 100

        # Reasoning from usage patterns
        reasoning = [
            f"Used {usage_rec.usage_count} times by {usage_rec.department or 'teams'}",
            f"Quality score: {usage_rec.quality_score:.0%}",
            f"Common use case: {usage_rec.use_case}"
        ]

        if hasattr(usage_rec, 'business_impact') and usage_rec.business_impact == "critical":
            reasoning.append("Critical table for business operations")

        return SourceRecommendation(
            table_id=usage_rec.table_id,
            table_name=usage_rec.table_name,
            catalog=catalog,
            schema=schema,
            table=table,
            score=score,
            confidence=usage_rec.confidence if hasattr(usage_rec, 'confidence') else 0.7,
            reasoning=reasoning,
            quality_score=usage_rec.quality_score,
            usage_count=usage_rec.usage_count,
            freshness_hours=None,
            row_count=None,
            match_entities=intent.primary_entities,  # Assume all match
            match_type="usage_pattern"
        )

    def _rerank_by_confidence(
        self,
        recommendations: List[SourceRecommendation],
        intent: ExtractedIntent
    ) -> List[SourceRecommendation]:
        """
        Re-rank recommendations by confidence score

        Confidence factors:
        - Intent confidence
        - Match type (semantic > usage)
        - Quality score
        - Usage count
        """

        def calc_final_confidence(rec: SourceRecommendation) -> float:
            base = rec.confidence

            # Boost for high intent confidence
            if intent.confidence > 0.7:
                base *= 1.1

            # Boost for semantic matches
            if rec.match_type == "semantic":
                base *= 1.15

            # Boost for high quality
            if rec.quality_score > 0.90:
                base *= 1.1

            # Boost for high usage
            if rec.usage_count > 50:
                base *= 1.05

            return min(base, 1.0)

        # Update confidence scores
        for rec in recommendations:
            rec.confidence = calc_final_confidence(rec)
            rec.score = rec.score * rec.confidence  # Adjust final score

        # Sort by score descending
        return sorted(recommendations, key=lambda r: r.score, reverse=True)


# Singleton instance
_recommendation_service = None

def get_recommendation_service() -> SourceRecommendationService:
    """Get or create singleton recommendation service instance"""
    global _recommendation_service
    if _recommendation_service is None:
        _recommendation_service = SourceRecommendationService()
    return _recommendation_service
