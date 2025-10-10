"""
FastAPI Routes for Business Context Management
Provides REST API for business objectives, metrics, and questions

Purpose:
- Create and manage business objectives with stakeholders and ROI
- Track business metrics with targets and current values
- Capture common business questions for semantic search
- Link business context to data products
- Enable business-first data product discovery

Date: October 10, 2025
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from backend.services.business_context_enrichment import BusinessContextEnrichmentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/business", tags=["business-context"])


# ============================================================================
# Request/Response Models
# ============================================================================

class CreateBusinessObjectiveRequest(BaseModel):
    """Request model for creating a business objective"""
    title: str = Field(..., description="Clear objective title")
    description: str = Field(..., description="Detailed description of the objective")
    department: str = Field(..., description="Owning department")
    stakeholders: List[str] = Field(..., description="List of stakeholders")
    success_criteria: str = Field(..., description="How success is measured")
    business_value: str = Field(..., description="Expected business value/ROI")
    priority: str = Field(default="P1", description="Priority: P0 (critical), P1 (high), P2 (medium), P3 (low)")
    deadline: Optional[datetime] = Field(None, description="Target completion date")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Reduce customer churn by 15%",
                "description": "Identify at-risk customers for proactive retention campaigns",
                "department": "Customer Success",
                "stakeholders": ["VP Customer Success", "Head of Analytics", "Product Manager"],
                "success_criteria": "Churn rate < 5%, Retention cost < $50/customer",
                "business_value": "$2.5M annual revenue protection",
                "priority": "P0",
                "deadline": "2025-12-31T00:00:00Z"
            }
        }


class BusinessObjectiveResponse(BaseModel):
    """Response model for business objective"""
    objective_id: str
    title: str
    description: str
    department: str
    stakeholders: List[str]
    success_criteria: str
    business_value: str
    priority: str
    status: str
    created_at: datetime
    deadline: Optional[datetime]
    metadata: Optional[Dict[str, Any]]


class LinkObjectiveToProductRequest(BaseModel):
    """Request model for linking objective to data product"""
    product_id: str = Field(..., description="Data product identifier")
    priority: str = Field(default="P1", description="Priority of this product for the objective")
    deadline: Optional[datetime] = Field(None, description="Deadline for product delivery")
    justification: str = Field(..., description="Why this product is needed for the objective")
    estimated_roi: str = Field(..., description="Expected ROI from this product")
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "dp_customer_churn_risk",
                "priority": "P0",
                "justification": "Provides daily churn risk scores for proactive intervention",
                "estimated_roi": "$800K annual revenue protection from early intervention"
            }
        }


class CreateBusinessMetricRequest(BaseModel):
    """Request model for creating a business metric"""
    metric_name: str = Field(..., description="Name of the metric")
    definition: str = Field(..., description="Clear definition of what this metric measures")
    calculation_logic: str = Field(..., description="How the metric is calculated")
    target_value: float = Field(..., description="Target value for this metric")
    current_value: float = Field(default=0.0, description="Current value (if known)")
    unit: str = Field(default="", description="Unit of measurement (%, $, count, etc.)")
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "metric_name": "Monthly Churn Rate",
                "definition": "Percentage of customers who cancel in a given month",
                "calculation_logic": "churned_customers / total_active_customers * 100",
                "target_value": 5.0,
                "current_value": 8.0,
                "unit": "%"
            }
        }


class BusinessMetricResponse(BaseModel):
    """Response model for business metric"""
    metric_id: str
    metric_name: str
    definition: str
    calculation_logic: str
    target_value: float
    current_value: float
    trend: str  # "needs_improvement", "on_target", "exceeding_target"
    unit: str
    created_at: datetime
    last_updated: datetime
    metadata: Optional[Dict[str, Any]]


class UpdateMetricValueRequest(BaseModel):
    """Request model for updating metric value"""
    current_value: float = Field(..., description="New current value")
    metadata: Optional[Dict[str, Any]] = None


class CaptureBusinessQuestionRequest(BaseModel):
    """Request model for capturing a business question"""
    question_text: str = Field(..., description="The business question in natural language")
    personas: List[str] = Field(..., description="Who typically asks this question")
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "question_text": "Which customers are likely to churn next month?",
                "personas": ["VP Sales", "Customer Success Manager", "Account Executive"]
            }
        }


class BusinessQuestionResponse(BaseModel):
    """Response model for business question"""
    question_id: str
    question_text: str
    frequency: int
    personas: List[str]
    created_at: datetime
    last_asked: datetime
    metadata: Optional[Dict[str, Any]]


class LinkQuestionToProductRequest(BaseModel):
    """Request model for linking question to data product"""
    product_id: str = Field(..., description="Data product that answers this question")
    confidence: float = Field(default=0.9, description="Confidence score (0-1)")
    example_sql: Optional[str] = Field(None, description="Example SQL query")
    typical_response_time_ms: Optional[int] = Field(None, description="Typical response time")
    metadata: Optional[Dict[str, Any]] = None


class ProductSearchResult(BaseModel):
    """Response model for product search results"""
    product_id: str
    product_name: str
    confidence: float
    example_sql: Optional[str]
    typical_response_time_ms: Optional[int]
    question_text: str


class BusinessContextResponse(BaseModel):
    """Complete business context for a data product"""
    product_id: str
    objectives: List[Dict[str, Any]]
    metrics_impacted: List[Dict[str, Any]]
    questions_answered: List[Dict[str, Any]]


# ============================================================================
# API Endpoints
# ============================================================================

# Initialize service (will be injected via dependency injection in production)
_enrichment_service: Optional[BusinessContextEnrichmentService] = None


def get_enrichment_service() -> BusinessContextEnrichmentService:
    """Get or create enrichment service instance"""
    global _enrichment_service
    if _enrichment_service is None:
        _enrichment_service = BusinessContextEnrichmentService()
    return _enrichment_service


# ============================================================================
# Business Objective Endpoints
# ============================================================================

@router.post("/objectives", response_model=Dict[str, str], status_code=201)
async def create_business_objective(request: CreateBusinessObjectiveRequest):
    """
    Create a new business objective

    Business objectives drive data product creation and prioritization.
    Link objectives to data products to track ROI and business value.
    """
    try:
        service = get_enrichment_service()
        objective_id = await service.create_business_objective(
            title=request.title,
            description=request.description,
            department=request.department,
            stakeholders=request.stakeholders,
            success_criteria=request.success_criteria,
            business_value=request.business_value,
            priority=request.priority,
            deadline=request.deadline,
            metadata=request.metadata
        )

        logger.info(f"Created business objective: {objective_id} - {request.title}")

        return {
            "objective_id": objective_id,
            "message": f"Business objective created successfully",
            "title": request.title
        }

    except Exception as e:
        logger.error(f"Failed to create business objective: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create business objective: {str(e)}")


@router.get("/objectives", response_model=List[Dict[str, Any]])
async def list_business_objectives(
    department: Optional[str] = Query(None, description="Filter by department"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """
    List all business objectives with optional filters
    """
    try:
        service = get_enrichment_service()

        # Build query filters
        filters = {}
        if department:
            filters["department"] = department
        if priority:
            filters["priority"] = priority
        if status:
            filters["status"] = status

        objectives = await service.list_business_objectives(filters)

        logger.info(f"Retrieved {len(objectives)} business objectives")

        return objectives

    except Exception as e:
        logger.error(f"Failed to list business objectives: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list business objectives: {str(e)}")


@router.get("/objectives/{objective_id}", response_model=Dict[str, Any])
async def get_business_objective(objective_id: str):
    """
    Get detailed information about a specific business objective
    """
    try:
        service = get_enrichment_service()
        objective = await service.get_business_objective(objective_id)

        if not objective:
            raise HTTPException(status_code=404, detail=f"Business objective not found: {objective_id}")

        return objective

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get business objective: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get business objective: {str(e)}")


@router.post("/objectives/{objective_id}/link-product", status_code=201)
async def link_objective_to_product(objective_id: str, request: LinkObjectiveToProductRequest):
    """
    Link a data product to a business objective

    This creates a REQUIRES relationship showing that the objective
    needs this data product to be successful.
    """
    try:
        service = get_enrichment_service()

        await service.link_objective_to_product(
            objective_id=objective_id,
            product_id=request.product_id,
            priority=request.priority,
            deadline=request.deadline,
            justification=request.justification,
            estimated_roi=request.estimated_roi,
            metadata=request.metadata
        )

        logger.info(f"Linked product {request.product_id} to objective {objective_id}")

        return {
            "message": "Product linked to objective successfully",
            "objective_id": objective_id,
            "product_id": request.product_id
        }

    except Exception as e:
        logger.error(f"Failed to link product to objective: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to link product to objective: {str(e)}")


@router.get("/objectives/{objective_id}/products", response_model=List[Dict[str, Any]])
async def get_products_for_objective(objective_id: str):
    """
    Get all data products linked to a business objective
    """
    try:
        service = get_enrichment_service()
        products = await service.get_products_for_objective(objective_id)

        logger.info(f"Retrieved {len(products)} products for objective {objective_id}")

        return products

    except Exception as e:
        logger.error(f"Failed to get products for objective: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get products for objective: {str(e)}")


# ============================================================================
# Business Metric Endpoints
# ============================================================================

@router.post("/metrics", response_model=Dict[str, str], status_code=201)
async def create_business_metric(request: CreateBusinessMetricRequest):
    """
    Create a new business metric

    Business metrics track progress towards objectives.
    Link metrics to data columns to show how they're calculated.
    """
    try:
        service = get_enrichment_service()
        metric_id = await service.create_business_metric(
            metric_name=request.metric_name,
            definition=request.definition,
            calculation_logic=request.calculation_logic,
            target_value=request.target_value,
            current_value=request.current_value,
            unit=request.unit,
            metadata=request.metadata
        )

        logger.info(f"Created business metric: {metric_id} - {request.metric_name}")

        return {
            "metric_id": metric_id,
            "message": "Business metric created successfully",
            "metric_name": request.metric_name
        }

    except Exception as e:
        logger.error(f"Failed to create business metric: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create business metric: {str(e)}")


@router.get("/metrics", response_model=List[Dict[str, Any]])
async def list_business_metrics(
    trend: Optional[str] = Query(None, description="Filter by trend")
):
    """
    List all business metrics with optional filters
    """
    try:
        service = get_enrichment_service()

        filters = {}
        if trend:
            filters["trend"] = trend

        metrics = await service.list_business_metrics(filters)

        logger.info(f"Retrieved {len(metrics)} business metrics")

        return metrics

    except Exception as e:
        logger.error(f"Failed to list business metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list business metrics: {str(e)}")


@router.get("/metrics/{metric_id}", response_model=Dict[str, Any])
async def get_business_metric(metric_id: str):
    """
    Get detailed information about a specific business metric
    """
    try:
        service = get_enrichment_service()
        metric = await service.get_business_metric(metric_id)

        if not metric:
            raise HTTPException(status_code=404, detail=f"Business metric not found: {metric_id}")

        return metric

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get business metric: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get business metric: {str(e)}")


@router.put("/metrics/{metric_id}/value", status_code=200)
async def update_metric_value(metric_id: str, request: UpdateMetricValueRequest):
    """
    Update the current value of a business metric

    This automatically recalculates the trend based on target value.
    """
    try:
        service = get_enrichment_service()

        await service.update_metric_value(
            metric_id=metric_id,
            current_value=request.current_value,
            metadata=request.metadata
        )

        logger.info(f"Updated metric {metric_id} value to {request.current_value}")

        return {
            "message": "Metric value updated successfully",
            "metric_id": metric_id,
            "current_value": request.current_value
        }

    except Exception as e:
        logger.error(f"Failed to update metric value: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update metric value: {str(e)}")


# ============================================================================
# Business Question Endpoints
# ============================================================================

@router.post("/questions", response_model=Dict[str, str], status_code=201)
async def capture_business_question(request: CaptureBusinessQuestionRequest):
    """
    Capture a common business question

    Business questions are used for semantic search to find relevant data products.
    Questions are automatically embedded for similarity matching.
    """
    try:
        service = get_enrichment_service()
        question_id = await service.capture_business_question(
            question_text=request.question_text,
            personas=request.personas,
            metadata=request.metadata
        )

        logger.info(f"Captured business question: {question_id}")

        return {
            "question_id": question_id,
            "message": "Business question captured successfully",
            "question_text": request.question_text
        }

    except Exception as e:
        logger.error(f"Failed to capture business question: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to capture business question: {str(e)}")


@router.get("/questions", response_model=List[Dict[str, Any]])
async def list_business_questions(
    persona: Optional[str] = Query(None, description="Filter by persona")
):
    """
    List all captured business questions
    """
    try:
        service = get_enrichment_service()

        filters = {}
        if persona:
            filters["persona"] = persona

        questions = await service.list_business_questions(filters)

        logger.info(f"Retrieved {len(questions)} business questions")

        return questions

    except Exception as e:
        logger.error(f"Failed to list business questions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list business questions: {str(e)}")


@router.post("/questions/{question_id}/link-product", status_code=201)
async def link_question_to_product(question_id: str, request: LinkQuestionToProductRequest):
    """
    Link a data product to a business question

    This creates an ANSWERED_BY relationship showing that the product
    can answer this business question.
    """
    try:
        service = get_enrichment_service()

        await service.link_question_to_product(
            question_id=question_id,
            product_id=request.product_id,
            confidence=request.confidence,
            example_sql=request.example_sql,
            typical_response_time_ms=request.typical_response_time_ms,
            metadata=request.metadata
        )

        logger.info(f"Linked product {request.product_id} to question {question_id}")

        return {
            "message": "Product linked to question successfully",
            "question_id": question_id,
            "product_id": request.product_id
        }

    except Exception as e:
        logger.error(f"Failed to link product to question: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to link product to question: {str(e)}")


# ============================================================================
# Product Discovery Endpoints
# ============================================================================

@router.get("/products/search", response_model=List[Dict[str, Any]])
async def search_products_by_question(
    question: str = Query(..., description="Business question in natural language"),
    top_k: int = Query(5, description="Number of results to return")
):
    """
    Find data products that can answer a business question

    Uses semantic search to find products linked to similar questions.
    Returns products ranked by confidence score.
    """
    try:
        service = get_enrichment_service()
        results = await service.find_products_for_question(
            question_text=question,
            top_k=top_k
        )

        logger.info(f"Found {len(results)} products for question: {question}")

        return results

    except Exception as e:
        logger.error(f"Failed to search products: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to search products: {str(e)}")


@router.get("/products/{product_id}/context", response_model=Dict[str, Any])
async def get_business_context_for_product(product_id: str):
    """
    Get complete business context for a data product

    Returns all objectives, metrics, and questions linked to this product.
    Useful for showing business value and justification.
    """
    try:
        service = get_enrichment_service()
        context = await service.get_business_context_for_product(product_id)

        logger.info(f"Retrieved business context for product: {product_id}")

        return context

    except Exception as e:
        logger.error(f"Failed to get business context: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get business context: {str(e)}")


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health", status_code=200)
async def health_check():
    """
    Health check endpoint for business context service
    """
    try:
        service = get_enrichment_service()

        # Verify Kuzu connection
        stats = await service.get_stats()

        return {
            "status": "healthy",
            "service": "business-context",
            "kuzu_connected": True,
            "stats": stats
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "service": "business-context",
            "error": str(e)
        }
