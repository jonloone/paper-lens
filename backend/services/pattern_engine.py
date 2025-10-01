"""
Pattern Recommendation Engine using KAG Intelligence
Discovers, recommends, and learns from data engineering patterns
"""

from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import json

from .kuzu_knowledge_graph import KuzuKnowledgeGraph, get_knowledge_graph
from .kag_intelligence import KAGIntelligence, get_kag_intelligence

logger = logging.getLogger(__name__)


class PatternRecommendationEngine:
    """
    AI-powered pattern recommendation engine
    Uses graph traversal and KAG intelligence to discover and recommend patterns
    """

    def __init__(
        self,
        knowledge_graph: Optional[KuzuKnowledgeGraph] = None,
        kag_intelligence: Optional[KAGIntelligence] = None
    ):
        """Initialize Pattern Engine with KAG components"""
        self.kg = knowledge_graph or get_knowledge_graph()
        self.kag = kag_intelligence or get_kag_intelligence()

    async def recommend_patterns(
        self,
        domain: str,
        use_case: str,
        data_sources: Optional[List[str]] = None,
        categories: Optional[List[str]] = None,
        min_confidence: float = 0.5
    ) -> Dict[str, Any]:
        """
        Recommend patterns based on domain, use case, and available data sources

        Args:
            domain: Domain (retail, financial, healthcare, etc.)
            use_case: Natural language description of use case
            data_sources: Available data sources
            categories: Filter by categories (business, analytics, security, etc.)
            min_confidence: Minimum confidence threshold

        Returns:
            {
                "patterns": [...],  # Recommended patterns
                "combinations": [...],  # Pattern combinations
                "confidence": 0.85,
                "reasoning": {...}
            }
        """
        logger.info(f"Finding patterns for domain: {domain}, use case: {use_case}")

        data_sources = data_sources or []

        # Step 1: Find applicable patterns via graph search
        patterns = await self._find_applicable_patterns(
            domain=domain,
            categories=categories
        )

        # Step 2: Score patterns by relevance to use case
        scored_patterns = await self._score_pattern_relevance(
            patterns=patterns,
            use_case=use_case,
            data_sources=data_sources
        )

        # Step 3: Find pattern combinations
        combinations = await self._find_common_combinations(
            patterns=scored_patterns
        )

        # Step 4: Calculate overall confidence
        confidence = self._calculate_recommendation_confidence(
            patterns=scored_patterns,
            data_sources=data_sources
        )

        # Step 5: Build reasoning explanation
        reasoning = self._build_recommendation_reasoning(
            patterns=scored_patterns,
            use_case=use_case,
            data_sources=data_sources,
            combinations=combinations
        )

        return {
            "patterns": scored_patterns,
            "combinations": combinations,
            "confidence": confidence,
            "reasoning": reasoning
        }

    async def _find_applicable_patterns(
        self,
        domain: str,
        categories: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Find patterns applicable to domain and categories"""
        if not domain:
            return []

        patterns = self.kg.find_applicable_patterns(
            domain=domain,
            limit=10
        )

        # Filter by categories if specified
        if categories:
            patterns = [
                p for p in patterns
                if p.get("category") in categories
            ]

        return patterns

    async def _score_pattern_relevance(
        self,
        patterns: List[Dict[str, Any]],
        use_case: str,
        data_sources: List[str]
    ) -> List[Dict[str, Any]]:
        """Score each pattern's relevance to the use case and data sources"""
        scored_patterns = []

        for pattern in patterns:
            # Calculate relevance score
            relevance_score = 0.0

            # Factor 1: Data source matching (0-0.5)
            template = pattern.get("template", {})
            if isinstance(template, str):
                try:
                    template = json.loads(template)
                except:
                    template = {}

            required_sources = template.get("required_sources", [])
            if required_sources and data_sources:
                matching_sources = set(required_sources) & set(data_sources)
                source_score = len(matching_sources) / len(required_sources)
                relevance_score += source_score * 0.5
            elif not required_sources:
                # No source requirements, give partial credit
                relevance_score += 0.25

            # Factor 2: Use case keyword matching (0-0.3)
            use_case_lower = use_case.lower()
            pattern_name = pattern.get("name", "").lower()
            pattern_desc = pattern.get("description", "").lower()

            # Simple keyword matching
            keywords = ["customer", "churn", "analytics", "prediction", "recommendation", "fraud", "detection"]
            matched_keywords = sum(1 for kw in keywords if kw in use_case_lower and (kw in pattern_name or kw in pattern_desc))
            if matched_keywords > 0:
                relevance_score += min(matched_keywords * 0.1, 0.3)

            # Factor 3: Pattern category relevance (0-0.2)
            category = pattern.get("category", "")
            if "analytics" in use_case_lower and category == "analytics":
                relevance_score += 0.2
            elif "security" in use_case_lower and category == "security":
                relevance_score += 0.2
            elif "business" in use_case_lower and category == "business":
                relevance_score += 0.2
            else:
                relevance_score += 0.1  # Partial credit

            # Add relevance score to pattern
            pattern_copy = pattern.copy()
            pattern_copy["relevance_score"] = round(min(relevance_score, 1.0), 2)
            scored_patterns.append(pattern_copy)

        # Sort by relevance score
        scored_patterns.sort(key=lambda x: x["relevance_score"], reverse=True)

        return scored_patterns

    async def _find_common_combinations(
        self,
        patterns: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Find patterns commonly used together"""
        # TODO: Implement graph traversal to find pattern combinations
        # For now, return empty list
        return []

    def _calculate_recommendation_confidence(
        self,
        patterns: List[Dict[str, Any]],
        data_sources: List[str]
    ) -> float:
        """Calculate overall confidence in recommendations"""
        if not patterns:
            return 0.0

        # Factor 1: Number of patterns found (0-0.3)
        pattern_factor = min(len(patterns) / 5.0, 1.0) * 0.3

        # Factor 2: Average relevance score (0-0.5)
        avg_relevance = sum(p.get("relevance_score", 0.0) for p in patterns) / len(patterns)
        relevance_factor = avg_relevance * 0.5

        # Factor 3: Data source availability (0-0.2)
        source_factor = 0.2 if data_sources else 0.1

        total_confidence = pattern_factor + relevance_factor + source_factor

        return round(total_confidence, 2)

    def _build_recommendation_reasoning(
        self,
        patterns: List[Dict[str, Any]],
        use_case: str,
        data_sources: List[str],
        combinations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Build explainable reasoning for recommendations"""
        reasoning_steps = []

        # Step 1: Pattern discovery
        if patterns:
            reasoning_steps.append({
                "step": 1,
                "action": "Found applicable patterns via graph search",
                "details": f"Discovered {len(patterns)} patterns matching the domain",
                "pattern_ids": [p.get("id") for p in patterns[:5]]
            })
        else:
            reasoning_steps.append({
                "step": 1,
                "action": "No patterns found",
                "details": "No existing patterns match the domain and use case"
            })

        # Step 2: Relevance scoring
        if patterns:
            top_pattern = patterns[0]
            reasoning_steps.append({
                "step": 2,
                "action": "Scored patterns by relevance",
                "details": f"Top pattern: {top_pattern.get('name')} (score: {top_pattern.get('relevance_score', 0.0)})",
                "scoring_factors": ["data_sources", "use_case_keywords", "category_match"]
            })

        # Step 3: Data source matching
        if data_sources:
            reasoning_steps.append({
                "step": 3,
                "action": "Matched available data sources",
                "details": f"Found {len(data_sources)} available data sources",
                "data_sources": data_sources
            })

        # Step 4: Combinations
        if combinations:
            reasoning_steps.append({
                "step": 4,
                "action": "Identified pattern combinations",
                "details": f"Found {len(combinations)} common pattern combinations"
            })

        return {
            "steps": reasoning_steps,
            "use_case_analysis": {
                "use_case": use_case,
                "matched_patterns": len(patterns),
                "data_sources_provided": len(data_sources)
            }
        }

    async def find_pattern_combinations(
        self,
        pattern_id: str
    ) -> Dict[str, Any]:
        """
        Find patterns commonly used together with the given pattern

        Args:
            pattern_id: Pattern to find combinations for

        Returns:
            {
                "combinations": [...],  # Patterns used together
                "usage_count": int
            }
        """
        # TODO: Implement graph traversal query
        # MATCH (p1:Pattern {id: $pattern_id})
        # MATCH (p2:Pattern)
        # MATCH (dp:DataProduct)-[:USES_PATTERN]->(p1)
        # MATCH (dp)-[:USES_PATTERN]->(p2)
        # WHERE p1.id <> p2.id
        # RETURN p2, COUNT(dp) as usage_count

        return {
            "combinations": [],
            "usage_count": 0
        }

    async def find_pattern_dependencies(
        self,
        pattern_id: str
    ) -> Dict[str, Any]:
        """
        Find patterns that depend on the given pattern

        Args:
            pattern_id: Pattern to find dependencies for

        Returns:
            {
                "dependencies": [...],  # Dependent patterns
                "dependency_type": str
            }
        """
        # TODO: Implement graph traversal query
        # MATCH (p1:Pattern {id: $pattern_id})
        # MATCH (p2:Pattern)-[:DEPENDS_ON]->(p1)
        # RETURN p2

        return {
            "dependencies": [],
            "dependency_type": "none"
        }

    async def extract_pattern_from_contract(
        self,
        contract_id: str,
        min_success_rate: float = 0.85
    ) -> Dict[str, Any]:
        """
        Extract a new pattern from a successful contract implementation

        Args:
            contract_id: Contract to extract pattern from
            min_success_rate: Minimum success rate to extract pattern

        Returns:
            {
                "success": bool,
                "pattern_extracted": bool,
                "pattern_id": str (if extracted)
            }
        """
        logger.info(f"Attempting to extract pattern from contract: {contract_id}")

        # TODO: Implement pattern extraction
        # 1. Query contract details
        # 2. Check success_rate >= min_success_rate
        # 3. Extract schema structure as template
        # 4. Create new pattern node
        # 5. Link to contract with DERIVED_FROM relationship

        return {
            "success": True,
            "pattern_extracted": False,
            "reason": "Pattern extraction not yet implemented"
        }

    async def record_pattern_usage(
        self,
        pattern_id: str,
        implementation_success: bool,
        success_rate: float
    ) -> Dict[str, Any]:
        """
        Record pattern usage and update metrics

        Args:
            pattern_id: Pattern that was used
            implementation_success: Whether implementation was successful
            success_rate: Success rate of implementation

        Returns:
            {
                "success": bool,
                "metrics_updated": bool
            }
        """
        logger.info(
            f"Recording pattern usage: {pattern_id}, "
            f"success: {implementation_success}, rate: {success_rate}"
        )

        # TODO: Implement metrics update
        # 1. Increment reuse_count
        # 2. Update avg_success_rate (running average)
        # 3. Update last_used timestamp
        # 4. If low success rate, mark for deprecation

        return {
            "success": True,
            "metrics_updated": False,
            "reason": "Metrics update not yet implemented"
        }


# Singleton instance
_engine_instance: Optional[PatternRecommendationEngine] = None


def get_pattern_engine() -> PatternRecommendationEngine:
    """Get or create the singleton PatternRecommendationEngine instance"""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = PatternRecommendationEngine()
    return _engine_instance
