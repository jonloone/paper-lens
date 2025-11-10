"""
Dashboard Intelligence API Routes

Provides endpoints for CrewAI-powered intelligent dashboard generation
from SQL query results.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Any, Dict, Optional
import logging
from datetime import datetime

from ..services.crew_dashboard_intelligence import (
    generate_dashboard_with_fallback,
    CREWAI_AVAILABLE
)

router = APIRouter(prefix="/api/dashboard-intelligence", tags=["dashboard-intelligence"])
logger = logging.getLogger(__name__)


# Request/Response Models

class DashboardGenerationRequest(BaseModel):
    """Request model for dashboard generation"""
    sql: str = Field(..., description="The SQL query that generated the results")
    columns: List[str] = Field(..., description="Column names from query results")
    rows: List[List[Any]] = Field(..., description="Query result rows")
    row_count: int = Field(..., description="Total number of rows", gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "sql": "SELECT customer_id, total_orders, avg_order_value FROM customers WHERE last_order_date < DATE_SUB(NOW(), INTERVAL 90 DAY) ORDER BY total_orders DESC LIMIT 100",
                "columns": ["customer_id", "customer_name", "total_orders", "avg_order_value"],
                "rows": [
                    [1, "John Doe", 23, 145.50],
                    [2, "Jane Smith", 18, 89.99],
                    [3, "Bob Johnson", 15, 234.00]
                ],
                "row_count": 100
            }
        }


class SummaryStatistic(BaseModel):
    """Summary statistic for dashboard"""
    label: str
    value: str | int | float
    format: str = Field(default="number", pattern="^(number|currency|percentage|text)$")
    trend: Optional[Dict[str, str]] = None


class DataTransformation(BaseModel):
    """Data transformation configuration"""
    type: str = Field(..., pattern="^(histogram|topN|bottomN|pivot|aggregate|none)$")
    params: Dict[str, Any] = Field(default_factory=dict)


class DataMapping(BaseModel):
    """Data column mapping for visualization"""
    xColumn: str
    yColumns: List[str]
    groupBy: Optional[str] = None
    sortBy: Optional[str] = None
    sortOrder: Optional[str] = Field(None, pattern="^(asc|desc)$")
    limit: Optional[int] = None


class DashboardView(BaseModel):
    """Single view in a dashboard"""
    id: str
    title: str
    description: str
    chartType: str = Field(..., pattern="^(bar|line|area|pie|scatter|histogram|metric)$")
    size: str = Field(..., pattern="^(full|half|third|quarter)$")
    dataMapping: DataMapping
    transformation: DataTransformation
    reasoning: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class ValidatedDashboard(BaseModel):
    """Validated dashboard layout"""
    title: str
    description: str
    summaryStats: List[SummaryStatistic]
    views: List[DashboardView]


class ValidationError(BaseModel):
    """Validation error details"""
    viewId: str
    error: str
    severity: str = Field(..., pattern="^(error|warning)$")
    suggestion: str


class DashboardGenerationResponse(BaseModel):
    """Response model for dashboard generation"""
    success: bool
    valid: bool = True
    validatedDashboard: Optional[ValidatedDashboard] = None
    validationErrors: List[ValidationError] = Field(default_factory=list)
    reasoning: Optional[str] = None
    error: Optional[str] = None
    generationTime: Optional[float] = None
    usedCrewAI: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "valid": True,
                "validatedDashboard": {
                    "title": "Customer Churn Risk Analysis",
                    "description": "100 customers who haven't ordered in 90+ days",
                    "summaryStats": [
                        {"label": "At-Risk Customers", "value": "100", "format": "number"}
                    ],
                    "views": [
                        {
                            "id": "primary",
                            "title": "Order History Distribution",
                            "description": "Distribution of order counts among churned customers",
                            "chartType": "histogram",
                            "size": "full",
                            "dataMapping": {
                                "xColumn": "total_orders",
                                "yColumns": ["count"]
                            },
                            "transformation": {
                                "type": "histogram",
                                "params": {"column": "total_orders", "buckets": 8}
                            },
                            "reasoning": "Shows distribution of order history",
                            "confidence": 0.95
                        }
                    ]
                },
                "validationErrors": [],
                "reasoning": "Intelligent dashboard design based on churn analysis",
                "generationTime": 8.5,
                "usedCrewAI": True
            }
        }


# API Endpoints

@router.post("/generate-dashboard", response_model=DashboardGenerationResponse)
async def generate_dashboard(
    request: DashboardGenerationRequest,
    background_tasks: BackgroundTasks
) -> DashboardGenerationResponse:
    """
    Generate intelligent dashboard layout using CrewAI agents.

    This endpoint orchestrates three specialized agents:
    1. **Analyzer**: Understands data patterns and business context
    2. **Planner**: Designs optimal dashboard layout with visualizations
    3. **Validator**: Ensures dashboard is executable and error-free

    The system automatically falls back to rule-based generation if CrewAI
    is unavailable or encounters an error.

    **Note**: This operation typically takes 5-15 seconds as it involves
    multiple LLM calls for analysis, planning, and validation.
    """
    start_time = datetime.now()

    try:
        logger.info(
            f"Dashboard generation request: {request.row_count} rows, "
            f"{len(request.columns)} columns"
        )

        # Validate request data
        if not request.columns:
            raise HTTPException(
                status_code=400,
                detail="At least one column is required"
            )

        if not request.rows:
            raise HTTPException(
                status_code=400,
                detail="At least one row of data is required"
            )

        if len(request.rows[0]) != len(request.columns):
            raise HTTPException(
                status_code=400,
                detail=f"Column count mismatch: {len(request.columns)} columns but {len(request.rows[0])} values in first row"
            )

        # Generate dashboard using CrewAI (with fallback)
        result = generate_dashboard_with_fallback(
            sql=request.sql,
            columns=request.columns,
            rows=request.rows,
            row_count=request.row_count
        )

        # Calculate generation time
        generation_time = (datetime.now() - start_time).total_seconds()

        logger.info(f"Dashboard generation completed in {generation_time:.2f}s")

        # Extract validated dashboard
        validated_dashboard = result.get("validatedDashboard", {})
        validation_errors = result.get("validationErrors", [])
        valid = result.get("valid", True)
        reasoning = result.get("reasoning", "Dashboard generated successfully")

        # Log detailed dashboard structure
        if validated_dashboard:
            view_count = len(validated_dashboard.get("views", []))
            stat_count = len(validated_dashboard.get("summaryStats", []))
            logger.info(f"📊 Generated dashboard: title='{validated_dashboard.get('title')}', views={view_count}, stats={stat_count}")
            for idx, view in enumerate(validated_dashboard.get("views", [])):
                logger.info(f"  View {idx+1}: {view.get('chartType')} - {view.get('title')} (size={view.get('size')})")
        else:
            logger.warning("⚠️ No validated dashboard in result!")

        logger.info(f"✅ Response: success=True, usedCrewAI={CREWAI_AVAILABLE}, valid={valid}")

        return DashboardGenerationResponse(
            success=True,
            valid=valid,
            validatedDashboard=validated_dashboard,
            validationErrors=validation_errors,
            reasoning=reasoning,
            generationTime=generation_time,
            usedCrewAI=CREWAI_AVAILABLE
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Dashboard generation failed: {error_msg}", exc_info=True)

        generation_time = (datetime.now() - start_time).total_seconds()

        return DashboardGenerationResponse(
            success=False,
            valid=False,
            validatedDashboard=None,
            validationErrors=[],
            error=error_msg,
            generationTime=generation_time,
            usedCrewAI=False
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint for dashboard intelligence service.

    Returns service status and whether CrewAI is available.
    """
    return {
        "status": "healthy",
        "service": "dashboard-intelligence",
        "crewai_available": CREWAI_AVAILABLE,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/capabilities")
async def get_capabilities():
    """
    Get dashboard intelligence capabilities and supported features.

    Returns information about available chart types, transformations,
    and agent capabilities.
    """
    return {
        "chartTypes": [
            "bar",
            "line",
            "area",
            "pie",
            "scatter",
            "histogram",
            "metric"
        ],
        "transformations": [
            "none",
            "histogram",
            "topN",
            "bottomN",
            "pivot",
            "aggregate"
        ],
        "agents": [
            {
                "name": "Analyzer",
                "role": "Data Analysis Expert",
                "capabilities": [
                    "Data type identification",
                    "Pattern recognition",
                    "Business context understanding",
                    "Query intent analysis"
                ]
            },
            {
                "name": "Planner",
                "role": "Visualization Design Expert",
                "capabilities": [
                    "Chart type selection",
                    "Dashboard layout design",
                    "Data transformation planning",
                    "Visual storytelling"
                ]
            },
            {
                "name": "Validator",
                "role": "Data Validation Expert",
                "capabilities": [
                    "Column reference validation",
                    "Data type compatibility checking",
                    "Transformation feasibility analysis",
                    "Error handling"
                ]
            }
        ],
        "crewai_available": CREWAI_AVAILABLE
    }
