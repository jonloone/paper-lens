"""
FastAPI routes for Pattern Recommendation Engine
Provides API endpoints for pattern discovery and recommendations
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from services.pattern_engine import get_pattern_engine, PatternRecommendationEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/patterns", tags=["patterns"])


# ========================================================================
# Request/Response Models
# ========================================================================

class PatternRecommendationRequest(BaseModel):
    """Request model for pattern recommendations"""
    domain: str = Field(
        ...,
        description="Domain (retail, financial, healthcare, etc.)",
        example="retail"
    )
    use_case: str = Field(
        ...,
        description="Natural language description of use case",
        example="Customer churn prediction and prevention"
    )
    data_sources: Optional[List[str]] = Field(
        default_factory=list,
        description="Available data sources",
        example=["crm", "transactions", "support", "engagement"]
    )
    categories: Optional[List[str]] = Field(
        default=None,
        description="Filter by pattern categories",
        example=["analytics", "business"]
    )
    min_confidence: Optional[float] = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum confidence threshold"
    )


class Pattern(BaseModel):
    """Pattern model"""
    id: str
    name: str
    category: str
    domain: str
    template: Dict[str, Any]
    description: str
    reuse_count: int
    avg_success_rate: float
    relevance_score: Optional[float] = None


class PatternRecommendationResponse(BaseModel):
    """Response model for pattern recommendations"""
    patterns: List[Dict[str, Any]]
    combinations: List[Dict[str, Any]]
    confidence: float
    reasoning: Dict[str, Any]
    recommended_at: str


class PatternUsageRequest(BaseModel):
    """Request model for recording pattern usage"""
    pattern_id: str
    implementation_success: bool
    success_rate: float = Field(ge=0.0, le=1.0)
    feedback: Optional[str] = None


class PatternUsageResponse(BaseModel):
    """Response model for pattern usage recording"""
    success: bool
    metrics_updated: bool
    message: str


# ========================================================================
# API Endpoints
# ========================================================================

@router.post(
    "/recommend",
    response_model=PatternRecommendationResponse,
    summary="Get AI-powered pattern recommendations",
    description="""
    Recommend data engineering patterns based on domain, use case, and available data sources.

    The system:
    1. Finds applicable patterns via graph search
    2. Scores patterns by relevance to use case and data sources
    3. Identifies common pattern combinations
    4. Calculates confidence scores
    5. Provides explainable reasoning

    Patterns are ranked by relevance and success rate.
    """
)
async def recommend_patterns(request: PatternRecommendationRequest):
    """
    Recommend patterns for a given use case

    Args:
        request: Pattern recommendation request

    Returns:
        Recommended patterns with confidence and reasoning

    Raises:
        HTTPException: If recommendation fails
    """
    try:
        logger.info(
            f"Received pattern recommendation request for domain: {request.domain}, "
            f"use case: {request.use_case}"
        )

        # Get pattern engine
        engine: PatternRecommendationEngine = get_pattern_engine()

        # Generate recommendations
        result = await engine.recommend_patterns(
            domain=request.domain,
            use_case=request.use_case,
            data_sources=request.data_sources,
            categories=request.categories,
            min_confidence=request.min_confidence
        )

        # Add timestamp
        result["recommended_at"] = datetime.now().isoformat()

        logger.info(
            f"Recommended {len(result['patterns'])} patterns "
            f"with confidence: {result['confidence']:.2f}"
        )

        return result

    except Exception as e:
        logger.error(f"Failed to recommend patterns: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recommend patterns: {str(e)}"
        )


@router.get(
    "/{pattern_id}/combinations",
    summary="Get pattern combinations",
    description="Find patterns commonly used together with the specified pattern"
)
async def get_pattern_combinations(pattern_id: str):
    """
    Get patterns commonly used together

    Args:
        pattern_id: Pattern to find combinations for

    Returns:
        Patterns used in combination

    Raises:
        HTTPException: If query fails
    """
    try:
        logger.info(f"Finding combinations for pattern: {pattern_id}")

        engine: PatternRecommendationEngine = get_pattern_engine()

        result = await engine.find_pattern_combinations(pattern_id=pattern_id)

        return result

    except Exception as e:
        logger.error(f"Failed to find pattern combinations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find combinations: {str(e)}"
        )


@router.get(
    "/{pattern_id}/dependencies",
    summary="Get pattern dependencies",
    description="Find patterns that depend on the specified pattern"
)
async def get_pattern_dependencies(pattern_id: str):
    """
    Get dependent patterns

    Args:
        pattern_id: Pattern to find dependencies for

    Returns:
        Dependent patterns

    Raises:
        HTTPException: If query fails
    """
    try:
        logger.info(f"Finding dependencies for pattern: {pattern_id}")

        engine: PatternRecommendationEngine = get_pattern_engine()

        result = await engine.find_pattern_dependencies(pattern_id=pattern_id)

        return result

    except Exception as e:
        logger.error(f"Failed to find pattern dependencies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find dependencies: {str(e)}"
        )


@router.post(
    "/usage",
    response_model=PatternUsageResponse,
    summary="Record pattern usage",
    description="""
    Record pattern usage and update metrics for learning.

    This enables the system to:
    - Track pattern reuse
    - Update success rates
    - Learn which patterns work best
    - Deprecate low-performing patterns
    """
)
async def record_pattern_usage(request: PatternUsageRequest):
    """
    Record pattern usage for learning

    Args:
        request: Pattern usage record

    Returns:
        Usage recording confirmation

    Raises:
        HTTPException: If recording fails
    """
    try:
        logger.info(
            f"Recording usage for pattern: {request.pattern_id}, "
            f"success: {request.implementation_success}"
        )

        engine: PatternRecommendationEngine = get_pattern_engine()

        result = await engine.record_pattern_usage(
            pattern_id=request.pattern_id,
            implementation_success=request.implementation_success,
            success_rate=request.success_rate
        )

        return PatternUsageResponse(
            success=result["success"],
            metrics_updated=result.get("metrics_updated", False),
            message="Pattern usage recorded successfully"
        )

    except Exception as e:
        logger.error(f"Failed to record pattern usage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record usage: {str(e)}"
        )


@router.get(
    "/categories",
    summary="Get pattern categories",
    description="Get list of available pattern categories"
)
async def get_pattern_categories():
    """
    Get available pattern categories

    Returns:
        List of pattern categories
    """
    return {
        "categories": [
            {
                "id": "business",
                "name": "Business Patterns",
                "description": "Common business data patterns (Customer 360, Product Analytics, etc.)"
            },
            {
                "id": "analytics",
                "name": "Analytics Patterns",
                "description": "Predictive and analytical patterns (Churn, Recommendation, Segmentation)"
            },
            {
                "id": "security",
                "name": "Security Patterns",
                "description": "Security and compliance patterns (Fraud Detection, Access Control)"
            },
            {
                "id": "integration",
                "name": "Integration Patterns",
                "description": "Data integration and ETL patterns"
            }
        ]
    }


@router.get(
    "/stats",
    summary="Get pattern engine statistics",
    description="Get statistics about pattern usage and recommendations"
)
async def get_pattern_stats():
    """
    Get pattern engine statistics

    Returns:
        Statistics about patterns and usage
    """
    # TODO: Implement actual statistics from knowledge graph
    return {
        "total_patterns": 0,
        "patterns_by_domain": {},
        "patterns_by_category": {},
        "avg_reuse_count": 0.0,
        "avg_success_rate": 0.0,
        "top_patterns": []
    }
