"""
tiSQL API Routes
Provides AI-powered SQL assistance endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from ..services.tisql_service import TiSQLService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tisql", tags=["tiSQL"])

# Initialize tiSQL service
tisql_service = TiSQLService()


# Request/Response Models

class Source(BaseModel):
    """Source table schema for SQL generation"""
    id: str
    name: str
    schema: str
    database: Optional[str] = None
    columns: List[Dict[str, Any]] = []


class NLToSQLRequest(BaseModel):
    """Request for natural language to SQL conversion"""
    natural_language: str = Field(..., description="Natural language description of desired query")
    available_sources: List[Source] = Field(default=[], description="Available tables/sources")
    business_context: Optional[Dict[str, Any]] = Field(default=None, description="Business context")


class OptimizeSQLRequest(BaseModel):
    """Request for SQL optimization"""
    sql: str = Field(..., description="SQL query to optimize")
    execution_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Execution context (row counts, execution time, etc.)"
    )


class DebugSQLRequest(BaseModel):
    """Request for SQL debugging"""
    sql: str = Field(..., description="SQL query to debug")
    error_message: Optional[str] = Field(default=None, description="Error message from execution")


class DBTRecommendationRequest(BaseModel):
    """Request for dbt recommendations"""
    sql: str = Field(..., description="SQL query to convert to dbt model")
    model_type: Optional[str] = Field(default=None, description="Model type hint (incremental, snapshot, etc.)")


# API Endpoints

@router.post("/generate-sql")
async def generate_sql_from_nl(request: NLToSQLRequest):
    """
    Generate SQL from natural language description

    This endpoint uses the tiSQL SQL Generation Agent to convert natural language
    requirements into SQL queries.

    Example request:
    ```json
    {
        "natural_language": "Show me all customers who made purchases in the last 30 days with their total spend",
        "available_sources": [
            {
                "id": "customers",
                "name": "customers",
                "schema": "sales",
                "columns": [
                    {"name": "customer_id", "type": "string"},
                    {"name": "email", "type": "string"}
                ]
            },
            {
                "id": "orders",
                "name": "orders",
                "schema": "sales",
                "columns": [
                    {"name": "order_id", "type": "string"},
                    {"name": "customer_id", "type": "string"},
                    {"name": "total_amount", "type": "decimal"},
                    {"name": "order_date", "type": "timestamp"}
                ]
            }
        ]
    }
    ```
    """
    try:
        # Convert Pydantic models to dicts
        sources = [source.model_dump() for source in request.available_sources]

        result = await tisql_service.generate_sql_from_nl(
            natural_language=request.natural_language,
            available_sources=sources,
            business_context=request.business_context
        )

        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in generate_sql_from_nl: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize-sql")
async def optimize_sql(request: OptimizeSQLRequest):
    """
    Optimize SQL query for performance

    This endpoint uses the tiSQL Optimization Agent to analyze and optimize
    SQL queries for better performance.

    Example request:
    ```json
    {
        "sql": "SELECT * FROM {{ ref('orders') }} o JOIN {{ ref('customers') }} c ON o.customer_id = c.customer_id WHERE o.order_date >= '2025-01-01'",
        "execution_context": {
            "row_count": 1000000,
            "execution_time_ms": 5000,
            "table_sizes": {
                "orders": 10000000,
                "customers": 500000
            }
        }
    }
    ```
    """
    try:
        result = await tisql_service.optimize_sql(
            sql=request.sql,
            execution_context=request.execution_context
        )

        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in optimize_sql: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/debug-sql")
async def debug_sql(request: DebugSQLRequest):
    """
    Debug SQL query and identify issues

    This endpoint uses the tiSQL Debugging Agent to identify syntax errors,
    logical issues, and provide fixes.

    Example request:
    ```json
    {
        "sql": "SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id HAVING SUM(total) > 1000",
        "error_message": "Column 'total' does not exist"
    }
    ```
    """
    try:
        result = await tisql_service.debug_sql(
            sql=request.sql,
            error_message=request.error_message
        )

        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in debug_sql: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dbt-recommendations")
async def get_dbt_recommendations(request: DBTRecommendationRequest):
    """
    Get dbt-specific recommendations and configurations

    This endpoint uses the tiSQL dbt Agent to provide dbt model configurations,
    tests, documentation, and best practices.

    Example request:
    ```json
    {
        "sql": "SELECT customer_id, MAX(order_date) as last_order FROM {{ ref('orders') }} GROUP BY customer_id",
        "model_type": "incremental"
    }
    ```
    """
    try:
        result = await tisql_service.get_dbt_recommendations(
            sql=request.sql,
            model_type=request.model_type
        )

        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in get_dbt_recommendations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint for tiSQL service
    """
    return {
        "status": "healthy",
        "service": "tiSQL AI-Powered SQL Intelligence",
        "agents": [
            "SQL Generation Agent",
            "Optimization Agent",
            "Debugging Agent",
            "dbt Agent",
            "Schema Agent"
        ],
        "llm_model": "qwen2.5-coder-32b-instruct",
        "timestamp": datetime.now().isoformat()
    }
