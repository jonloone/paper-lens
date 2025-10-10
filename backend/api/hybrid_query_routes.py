"""
Hybrid Query API Routes
REST API for unified data access across structured + unstructured data

Endpoints:
- POST /api/hybrid/query - Execute hybrid business question query
- GET /api/hybrid/entity/{entity_id} - Get unified entity profile
- POST /api/hybrid/search - Search across all data layers
- GET /api/hybrid/lineage - Trace lineage across layers
- GET /api/hybrid/stats - Get statistics about unified data layer

Date: October 10, 2025
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

from ..services.unified_data_access import (
    get_unified_service,
    HybridQueryResult,
    EntityProfile
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/hybrid", tags=["hybrid"])


# Request/Response Models

class HybridQueryRequest(BaseModel):
    """Request for hybrid query"""
    question: str = Field(..., description="Natural language business question")
    include_documents: bool = Field(True, description="Include unstructured documents")
    include_structured: bool = Field(True, description="Include structured data")
    max_results: int = Field(50, description="Maximum results per data source", ge=1, le=500)


class HybridQueryResponse(BaseModel):
    """Response from hybrid query"""
    query_id: str
    query_text: str
    business_context: Dict[str, Any]
    structured_data: List[Dict[str, Any]]
    unstructured_data: List[Dict[str, Any]]
    insights: List[str]
    lineage: Dict[str, Any]
    execution_time_ms: float
    confidence: float
    timestamp: datetime = Field(default_factory=datetime.now)


class EntityProfileResponse(BaseModel):
    """Response for entity profile"""
    entity_id: str
    canonical_name: str
    entity_type: str
    structured_references: List[Dict[str, Any]]
    unstructured_mentions: List[Dict[str, Any]]
    related_products: List[Dict[str, Any]]
    related_objectives: List[Dict[str, Any]]
    statistics: Dict[str, Any]


class SearchRequest(BaseModel):
    """Request for cross-layer search"""
    search_term: str = Field(..., description="Text to search for")
    layers: List[str] = Field(
        ["business", "structured", "unstructured"],
        description="Which layers to search"
    )
    max_results_per_layer: int = Field(20, description="Max results per layer", ge=1, le=100)


class LineageRequest(BaseModel):
    """Request for lineage trace"""
    start_node_id: str = Field(..., description="ID of starting node")
    node_type: str = Field(..., description="Type of node")
    direction: str = Field("downstream", description="upstream or downstream")
    max_depth: int = Field(5, description="Maximum traversal depth", ge=1, le=10)


# API Endpoints

@router.post("/query", response_model=HybridQueryResponse)
async def execute_hybrid_query(request: HybridQueryRequest):
    """
    Execute a hybrid query across all data layers

    This endpoint answers business questions by searching across:
    - Business context (objectives, metrics, questions)
    - Structured data (tables, products, models)
    - Unstructured documents (tickets, logs, notes)

    Example questions:
    - "Why are customers churning?"
    - "Show me data products related to customer satisfaction"
    - "What are the revenue trends for Q4?"
    """
    try:
        logger.info(f"Executing hybrid query: {request.question}")

        service = get_unified_service()

        result = await service.query_by_business_question(
            question_text=request.question,
            include_documents=request.include_documents,
            include_structured=request.include_structured,
            max_results=request.max_results
        )

        return HybridQueryResponse(
            query_id=result.query_id,
            query_text=result.query_text,
            business_context=result.business_context,
            structured_data=result.structured_data,
            unstructured_data=result.unstructured_data,
            insights=result.insights,
            lineage=result.lineage,
            execution_time_ms=result.execution_time_ms,
            confidence=result.confidence
        )

    except Exception as e:
        logger.error(f"Error executing hybrid query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to execute hybrid query: {str(e)}")


@router.get("/entity/{entity_identifier}", response_model=EntityProfileResponse)
async def get_entity_profile(
    entity_identifier: str,
    entity_type: Optional[str] = Query(None, description="Optional entity type filter")
):
    """
    Get unified profile for an entity across all data sources

    Returns:
    - Structured data references (rows in tables)
    - Unstructured mentions (documents)
    - Related data products
    - Related business objectives
    - Statistics

    Example:
    - GET /api/hybrid/entity/Acme%20Corporation
    - GET /api/hybrid/entity/cust_001?entity_type=organization
    """
    try:
        logger.info(f"Getting entity profile: {entity_identifier}")

        service = get_unified_service()

        profile = await service.get_entity_profile(
            entity_identifier=entity_identifier,
            entity_type=entity_type
        )

        if not profile:
            raise HTTPException(
                status_code=404,
                detail=f"Entity not found: {entity_identifier}"
            )

        return EntityProfileResponse(
            entity_id=profile.entity_id,
            canonical_name=profile.canonical_name,
            entity_type=profile.entity_type,
            structured_references=profile.structured_references,
            unstructured_mentions=profile.unstructured_mentions,
            related_products=profile.related_products,
            related_objectives=profile.related_objectives,
            statistics=profile.statistics
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting entity profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get entity profile: {str(e)}")


@router.post("/search", response_model=Dict[str, List[Dict[str, Any]]])
async def search_across_layers(request: SearchRequest):
    """
    Search across all data layers

    Layers:
    - business: Objectives, metrics, questions
    - structured: Products, tables, columns
    - unstructured: Documents, entities

    Example:
    ```json
    {
      "search_term": "customer churn",
      "layers": ["business", "unstructured"],
      "max_results_per_layer": 10
    }
    ```
    """
    try:
        logger.info(f"Searching across layers: {request.layers} for term: {request.search_term}")

        service = get_unified_service()

        results = await service.search_across_layers(
            search_term=request.search_term,
            layers=request.layers,
            max_results_per_layer=request.max_results_per_layer
        )

        return results

    except Exception as e:
        logger.error(f"Error searching across layers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to search: {str(e)}")


@router.post("/lineage", response_model=Dict[str, Any])
async def trace_lineage(request: LineageRequest):
    """
    Trace lineage from a starting node

    Node types:
    - DataTable, DataProduct, LogicalModel
    - BusinessObjective, BusinessMetric, BusinessQuestion
    - Document, Entity

    Example:
    ```json
    {
      "start_node_id": "product_123",
      "node_type": "DataProduct",
      "direction": "downstream",
      "max_depth": 5
    }
    ```
    """
    try:
        logger.info(f"Tracing {request.direction} lineage from {request.node_type}:{request.start_node_id}")

        service = get_unified_service()

        lineage = await service.trace_lineage(
            start_node_id=request.start_node_id,
            node_type=request.node_type,
            direction=request.direction,
            max_depth=request.max_depth
        )

        return lineage

    except Exception as e:
        logger.error(f"Error tracing lineage: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to trace lineage: {str(e)}")


@router.get("/stats", response_model=Dict[str, Any])
async def get_hybrid_stats():
    """
    Get statistics about the unified data layer

    Returns counts for:
    - Business layer: objectives, metrics, questions
    - Structured layer: tables, products, models
    - Unstructured layer: documents, entities, mentions
    """
    try:
        logger.info("Getting hybrid query statistics")

        service = get_unified_service()
        stats = await service.get_stats()

        return {
            "statistics": stats,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        service = get_unified_service()
        stats = await service.get_stats()

        return {
            "status": "healthy",
            "service": "hybrid_query",
            "timestamp": datetime.now().isoformat(),
            "data_layers": {
                "business": stats.get("business_objectives", 0) > 0,
                "structured": stats.get("data_products", 0) > 0,
                "unstructured": stats.get("documents", 0) > 0
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "service": "hybrid_query",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


# Example usage documentation

@router.get("/examples")
async def get_example_queries():
    """
    Get example hybrid queries for different use cases

    Returns a list of example queries with descriptions
    """
    return {
        "examples": [
            {
                "use_case": "Customer Churn Analysis",
                "question": "Why are customers churning?",
                "description": "Combines structured churn metrics with support ticket analysis",
                "expected_results": {
                    "business_context": "Customer retention objectives",
                    "structured_data": "Churn rates, revenue impact",
                    "unstructured_data": "Support tickets mentioning cancellation"
                }
            },
            {
                "use_case": "Product Performance",
                "question": "How is our Enterprise Analytics Platform performing?",
                "description": "Product metrics + customer feedback documents",
                "expected_results": {
                    "business_context": "Product adoption objectives",
                    "structured_data": "Usage metrics, performance data",
                    "unstructured_data": "Customer feedback, feature requests"
                }
            },
            {
                "use_case": "Customer 360 View",
                "entity_identifier": "Acme Corporation",
                "description": "Complete view of customer across all systems",
                "expected_results": {
                    "structured_references": "Customer record, transactions, contracts",
                    "unstructured_mentions": "Support tickets, meeting notes, emails",
                    "related_products": "Products used by customer",
                    "related_objectives": "Business objectives involving customer"
                }
            },
            {
                "use_case": "Cross-Layer Search",
                "search_term": "revenue growth",
                "description": "Find all mentions across business, structured, and unstructured data",
                "expected_results": {
                    "business": "Revenue growth objectives",
                    "structured": "Revenue data products",
                    "unstructured": "Documents discussing revenue"
                }
            }
        ],
        "tips": [
            "Use specific business terms for better results",
            "Include time periods in questions when relevant",
            "Entity queries work best with canonical names",
            "Combine structured and unstructured for complete insights"
        ]
    }


# Advanced query patterns

@router.post("/query/advanced", response_model=Dict[str, Any])
async def execute_advanced_query(
    question: str = Query(..., description="Business question"),
    entity_filter: Optional[List[str]] = Query(None, description="Filter by entities"),
    date_range: Optional[str] = Query(None, description="Date range (e.g., '2024-01-01:2024-12-31')"),
    confidence_threshold: float = Query(0.5, description="Minimum confidence score", ge=0.0, le=1.0),
    include_lineage: bool = Query(True, description="Include full lineage graph"),
    group_by: Optional[str] = Query(None, description="Group results by field")
):
    """
    Execute advanced hybrid query with filtering and grouping

    Additional capabilities:
    - Entity filtering
    - Date range filtering
    - Confidence thresholds
    - Result grouping
    - Optional lineage inclusion
    """
    try:
        logger.info(f"Executing advanced hybrid query: {question}")

        service = get_unified_service()

        # Execute base query
        result = await service.query_by_business_question(
            question_text=question,
            include_documents=True,
            include_structured=True,
            max_results=100
        )

        # Apply filters
        filtered_result = {
            "query_id": result.query_id,
            "query_text": result.query_text,
            "filters_applied": {
                "entity_filter": entity_filter,
                "date_range": date_range,
                "confidence_threshold": confidence_threshold
            },
            "business_context": result.business_context,
            "structured_data": result.structured_data,
            "unstructured_data": result.unstructured_data,
            "insights": result.insights,
            "execution_time_ms": result.execution_time_ms,
            "confidence": result.confidence
        }

        # Add lineage if requested
        if include_lineage:
            filtered_result["lineage"] = result.lineage

        # Apply confidence threshold
        if confidence_threshold > 0:
            if result.confidence < confidence_threshold:
                filtered_result["warning"] = f"Result confidence ({result.confidence:.2f}) below threshold ({confidence_threshold})"

        return filtered_result

    except Exception as e:
        logger.error(f"Error executing advanced query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to execute advanced query: {str(e)}")


@router.get("/suggest/questions")
async def suggest_questions(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    limit: int = Query(10, description="Number of suggestions", ge=1, le=50)
):
    """
    Get suggested business questions based on available data

    Returns popular or relevant questions that can be answered
    with current data products and documents
    """
    try:
        logger.info(f"Getting question suggestions for domain: {domain}")

        service = get_unified_service()

        # Get business context to find common questions
        # This is a simplified implementation
        suggestions = [
            {
                "question": "Why are customers churning?",
                "domain": "customer_success",
                "confidence": 0.95,
                "data_sources": ["customer_churn_metrics", "support_tickets"]
            },
            {
                "question": "What are our revenue trends?",
                "domain": "finance",
                "confidence": 0.90,
                "data_sources": ["revenue_data_product"]
            },
            {
                "question": "Which products have the most issues?",
                "domain": "product",
                "confidence": 0.85,
                "data_sources": ["product_metrics", "incident_logs"]
            }
        ]

        # Filter by domain if provided
        if domain:
            suggestions = [s for s in suggestions if s["domain"] == domain]

        return {
            "suggestions": suggestions[:limit],
            "total": len(suggestions),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting question suggestions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")
