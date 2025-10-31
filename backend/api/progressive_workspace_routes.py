"""
Progressive Workspace API
Endpoints for intent analysis, source recommendation, and SQL generation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

from backend.services.intent_analysis_service import (
    IntentAnalysisService,
    ExtractedIntent
)
from backend.services.source_recommendation_service import (
    SourceRecommendationService,
    SourceRecommendation,
    get_recommendation_service
)
from backend.services.sql_generation_service import (
    SQLGenerationService,
    GeneratedSQL,
    get_sql_generation_service
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/progressive", tags=["progressive-workspace"])


# ============================================================================
# Request/Response Models
# ============================================================================

class AnalyzeIntentRequest(BaseModel):
    """Request to analyze user intent"""
    query: str
    user_context: Optional[Dict[str, Any]] = None


class AnalyzeIntentResponse(BaseModel):
    """Response with extracted intent"""
    intent: ExtractedIntent
    message: str


class RecommendSourcesRequest(BaseModel):
    """Request to recommend sources"""
    intent: ExtractedIntent
    limit: int = 5
    min_quality: float = 0.70


class RecommendSourcesResponse(BaseModel):
    """Response with recommended sources"""
    sources: List[SourceRecommendation]
    count: int
    message: str


class GenerateSQLRequest(BaseModel):
    """Request to generate SQL"""
    intent: ExtractedIntent
    selected_sources: List[SourceRecommendation]


class GenerateSQLResponse(BaseModel):
    """Response with generated SQL"""
    sql: GeneratedSQL
    message: str


class DiscoverAndRecommendRequest(BaseModel):
    """Request for complete flow: analyze + recommend"""
    query: str
    user_context: Optional[Dict[str, Any]] = None
    limit: int = 5
    min_quality: float = 0.70


class DiscoverAndRecommendResponse(BaseModel):
    """Response with intent + sources"""
    intent: ExtractedIntent
    sources: List[SourceRecommendation]
    message: str


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/analyze-intent", response_model=AnalyzeIntentResponse)
async def analyze_intent(request: AnalyzeIntentRequest) -> AnalyzeIntentResponse:
    """
    Analyze user's natural language query to extract structured intent

    Example:
        POST /api/progressive/analyze-intent
        {
          "query": "I need daily customer revenue by region",
          "user_context": {"department": "finance", "team": "analytics"}
        }
    """

    try:
        service = IntentAnalysisService()
        intent = await service.analyze_intent(
            user_query=request.query,
            user_context=request.user_context
        )

        return AnalyzeIntentResponse(
            intent=intent,
            message=f"Extracted intent with {intent.confidence:.0%} confidence"
        )

    except Exception as e:
        logger.error(f"Intent analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend-sources", response_model=RecommendSourcesResponse)
async def recommend_sources(request: RecommendSourcesRequest) -> RecommendSourcesResponse:
    """
    Recommend data sources based on extracted intent

    Example:
        POST /api/progressive/recommend-sources
        {
          "intent": {...},
          "limit": 5,
          "min_quality": 0.70
        }
    """

    try:
        service = get_recommendation_service()
        sources = await service.recommend_sources(
            intent=request.intent,
            limit=request.limit,
            min_quality=request.min_quality
        )

        return RecommendSourcesResponse(
            sources=sources,
            count=len(sources),
            message=f"Found {len(sources)} recommended sources"
        )

    except Exception as e:
        logger.error(f"Source recommendation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-sql", response_model=GenerateSQLResponse)
async def generate_sql(request: GenerateSQLRequest) -> GenerateSQLResponse:
    """
    Generate SQL query from intent and selected sources

    Example:
        POST /api/progressive/generate-sql
        {
          "intent": {...},
          "selected_sources": [...]
        }
    """

    try:
        service = get_sql_generation_service()
        sql = await service.generate_sql(
            intent=request.intent,
            selected_sources=request.selected_sources
        )

        return GenerateSQLResponse(
            sql=sql,
            message="SQL generated successfully"
        )

    except Exception as e:
        logger.error(f"SQL generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Combined Endpoint (One-Shot)
# ============================================================================

@router.post("/discover", response_model=DiscoverAndRecommendResponse)
async def discover_and_recommend(
    request: DiscoverAndRecommendRequest
) -> DiscoverAndRecommendResponse:
    """
    One-shot: Analyze intent AND recommend sources

    This combines analyze-intent + recommend-sources for faster UX.
    This is the primary endpoint used by the Discovery Canvas.

    Example:
        POST /api/progressive/discover
        {
          "query": "I need daily customer revenue by region",
          "user_context": {"department": "finance"},
          "limit": 5,
          "min_quality": 0.70
        }
    """

    try:
        # Step 1: Analyze intent
        intent_service = IntentAnalysisService()
        intent = await intent_service.analyze_intent(
            user_query=request.query,
            user_context=request.user_context
        )

        logger.info(f"Intent extracted with confidence {intent.confidence:.2f}")

        # Step 2: Recommend sources
        source_service = get_recommendation_service()
        sources = await source_service.recommend_sources(
            intent=intent,
            limit=request.limit,
            min_quality=request.min_quality
        )

        logger.info(f"Found {len(sources)} recommended sources")

        return DiscoverAndRecommendResponse(
            intent=intent,
            sources=sources,
            message=f"Found {len(sources)} sources based on your request"
        )

    except Exception as e:
        logger.error(f"Discovery failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "progressive-workspace",
        "version": "1.0.0"
    }
