"""
API routes for source management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from backend.models.sources import (
    Source, SourceCreate, SourceUpdate, SourceSummary, SourceDetail,
    Deployment, DeploymentCreate, DeploymentSummary,
    SourceMetrics, SourcesOverview, HealthStatus,
    ValidationResult, ConnectionTestResult,
    ConnectionConfig, MCPRecommendation, CostEstimate
)
from backend.services.sources_service import SourcesService
from backend.database import get_db_pool


router = APIRouter(prefix="/api/v1/sources", tags=["sources"])


# ============================================================================
# Dependency: Get Sources Service
# ============================================================================

async def get_sources_service() -> SourcesService:
    """Get sources service instance"""
    db_pool = await get_db_pool()
    return SourcesService(db_pool)


# ============================================================================
# Source List & Summary Endpoints
# ============================================================================

@router.get("", response_model=List[SourceSummary])
async def list_sources(
    status: Optional[str] = Query(None, description="Filter by status"),
    connection_mode: Optional[str] = Query(None, description="Filter by connection mode"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    owner: Optional[str] = Query(None, description="Filter by owner email"),
    limit: int = Query(100, le=1000, description="Maximum results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    service: SourcesService = Depends(get_sources_service)
):
    """
    List all sources with optional filtering.

    Query Parameters:
    - status: Filter by source status (active, paused, failed, configuring, deploying)
    - connection_mode: Filter by connection type (federated, cdc, batch, streaming)
    - domain: Filter by business domain
    - owner: Filter by owner email
    - limit: Maximum number of results (default 100, max 1000)
    - offset: Pagination offset

    Returns:
    - List of source summaries with basic metadata
    """
    try:
        sources = await service.list_sources(
            status=status,
            connection_mode=connection_mode,
            domain=domain,
            owner=owner,
            limit=limit,
            offset=offset
        )
        return sources
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list sources: {str(e)}"
        )


@router.get("/summary", response_model=SourcesOverview)
async def get_sources_summary(
    service: SourcesService = Depends(get_sources_service)
):
    """
    Get overview statistics for sources dashboard.

    Returns:
    - Total count of sources
    - Breakdown by status, connection mode, and domain
    - Count of sources with issues
    - Recent deployments
    """
    try:
        summary = await service.get_summary()
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get summary: {str(e)}"
        )


# ============================================================================
# Source Detail Endpoints
# ============================================================================

@router.get("/{source_id}", response_model=SourceDetail)
async def get_source(
    source_id: UUID,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Get detailed information about a specific source.

    Path Parameters:
    - source_id: UUID of the source

    Returns:
    - Complete source details including:
      - Basic metadata
      - Connection configuration
      - List of tables
      - Recent metrics
      - Deployment history
    """
    try:
        source = await service.get_source(source_id)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source {source_id} not found"
            )
        return source
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get source: {str(e)}"
        )


@router.put("/{source_id}", response_model=dict)
async def update_source(
    source_id: UUID,
    update: SourceUpdate,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Update an existing source.

    Path Parameters:
    - source_id: UUID of the source

    Request Body:
    - SourceUpdate with fields to update

    Returns:
    - Success message
    """
    try:
        updated = await service.update_source(source_id, update)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source {source_id} not found or no changes applied"
            )
        return {"message": "Source updated successfully", "source_id": str(source_id)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update source: {str(e)}"
        )


@router.delete("/{source_id}", response_model=dict)
async def delete_source(
    source_id: UUID,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Delete a source and all related data.

    WARNING: This is a destructive operation. All deployments, metrics,
    and table metadata will be deleted (cascade).

    Path Parameters:
    - source_id: UUID of the source

    Returns:
    - Success message
    """
    try:
        deleted = await service.delete_source(source_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source {source_id} not found"
            )
        return {"message": "Source deleted successfully", "source_id": str(source_id)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete source: {str(e)}"
        )


# ============================================================================
# Validation & Testing Endpoints
# ============================================================================

@router.post("/validate", response_model=ValidationResult)
async def validate_connection(
    config: ConnectionConfig,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Validate connection configuration before deployment.

    This endpoint performs comprehensive validation:
    - Name uniqueness check
    - Connection parameter validation
    - MCP-powered recommendations and warnings
    - Resource availability checks (Kafka capacity, storage, etc.)
    - Duplicate source detection

    Request Body:
    - ConnectionConfig with complete source configuration

    Returns:
    - ValidationResult with checks, warnings, and errors
    """
    try:
        result = await service.validate_connection(config)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )


@router.post("/test-connection", response_model=ConnectionTestResult)
async def test_connection(
    config: ConnectionConfig,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Test connection to source database.

    This is a lightweight connectivity check:
    - Verify network connectivity
    - Test authentication
    - Check basic permissions
    - Measure latency

    Request Body:
    - ConnectionConfig with connection details

    Returns:
    - ConnectionTestResult with success status and details
    """
    try:
        result = await service.test_connection(config)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Connection test failed: {str(e)}"
        )


# ============================================================================
# Deployment Endpoints
# ============================================================================

@router.post("/deploy", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def deploy_source(
    config: ConnectionConfig,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Deploy a new source connection.

    This initiates the deployment process:
    1. Create source record
    2. Validate configuration
    3. Create deployment record
    4. Queue deployment job (async)

    The actual deployment happens asynchronously. Use the returned
    deployment_id to track progress via /deployments/{deployment_id}

    Request Body:
    - ConnectionConfig with complete source configuration

    Returns:
    - Deployment ID and source ID for tracking
    """
    try:
        # Validate first
        validation = await service.validate_connection(config)
        if not validation.valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Validation failed: {', '.join(validation.errors)}"
            )

        # Create source
        source_id = await service.create_source(
            SourceCreate(**config.dict()),
            created_by=config.owner_email
        )

        # Create deployment
        deployment_id = await service.create_deployment(
            DeploymentCreate(
                source_id=source_id,
                deployment_config=config.dict(),
                created_by=config.owner_email
            )
        )

        # TODO: Queue async deployment job here
        # await deployment_queue.enqueue(source_id, deployment_id)

        return {
            "message": "Deployment initiated",
            "source_id": str(source_id),
            "deployment_id": str(deployment_id),
            "status": "pending",
            "track_at": f"/api/v1/sources/deployments/{deployment_id}"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deployment failed: {str(e)}"
        )


@router.get("/deployments/{deployment_id}", response_model=Deployment)
async def get_deployment_status(
    deployment_id: UUID,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Get status of ongoing or completed deployment.

    Path Parameters:
    - deployment_id: UUID of the deployment

    Returns:
    - Deployment with:
      - Current status (pending, in_progress, completed, failed)
      - Progress percentage (0-100)
      - Phase-by-phase progress
      - Deployment logs
      - Created artifacts (catalogs, topics, tables, etc.)
    """
    try:
        deployment = await service.get_deployment(deployment_id)
        if not deployment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Deployment {deployment_id} not found"
            )
        return deployment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get deployment: {str(e)}"
        )


# ============================================================================
# Metrics Endpoints
# ============================================================================

@router.get("/{source_id}/metrics", response_model=List[SourceMetrics])
async def get_source_metrics(
    source_id: UUID,
    hours: int = Query(24, ge=1, le=720, description="Hours of metrics to retrieve"),
    service: SourcesService = Depends(get_sources_service)
):
    """
    Get time-series metrics for a source.

    Path Parameters:
    - source_id: UUID of the source

    Query Parameters:
    - hours: Number of hours of metrics to retrieve (default 24, max 720)

    Returns:
    - List of SourceMetrics ordered by recorded_at DESC
    """
    try:
        # TODO: Implement metrics retrieval
        # For now, return empty list
        return []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metrics: {str(e)}"
        )


@router.post("/{source_id}/metrics", response_model=dict, status_code=status.HTTP_201_CREATED)
async def record_metrics(
    source_id: UUID,
    metrics: SourceMetrics,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Record metrics for a source.

    This endpoint is typically called by monitoring systems
    to record performance and health metrics.

    Path Parameters:
    - source_id: UUID of the source

    Request Body:
    - SourceMetrics with metric values

    Returns:
    - Success message
    """
    try:
        if metrics.source_id != source_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="source_id in path must match source_id in metrics"
            )

        await service.record_metrics(metrics)
        return {"message": "Metrics recorded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record metrics: {str(e)}"
        )


# ============================================================================
# Health Check Endpoint
# ============================================================================

@router.get("/{source_id}/health", response_model=HealthStatus)
async def get_source_health(
    source_id: UUID,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Get current health status for a source.

    Path Parameters:
    - source_id: UUID of the source

    Returns:
    - HealthStatus with:
      - Overall health (healthy, degraded, unhealthy)
      - Health score (0-100)
      - List of issues
      - Individual check results
    """
    try:
        # TODO: Implement health check logic
        # For now, return placeholder
        return HealthStatus(
            overall="healthy",
            score=100,
            issues=[],
            last_check=datetime.now(),
            checks={}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get health status: {str(e)}"
        )


# ============================================================================
# MCP-Powered Recommendations (Future)
# ============================================================================

@router.post("/recommendations", response_model=List[MCPRecommendation])
async def get_recommendations(
    config: ConnectionConfig,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Get CrewAI-powered recommendations for source configuration.

    This endpoint analyzes the configuration using specialized AI agents and provides:
    - Connection mode optimization advice
    - Partition strategy recommendations
    - Cost optimization suggestions
    - Performance tuning recommendations
    - Security best practices

    Request Body:
    - ConnectionConfig with source configuration

    Returns:
    - List of MCPRecommendation objects with agent reasoning
    """
    try:
        recommendations = await service.intelligence.get_connection_recommendations(config)
        return recommendations
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.post("/cost-estimate", response_model=CostEstimate)
async def estimate_cost(
    config: ConnectionConfig,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Estimate monthly cost for a source configuration using CrewAI cost optimization agent.

    Calculates estimated costs based on:
    - Storage requirements (Iceberg tables, Kafka retention)
    - Compute resources (Kafka brokers, Debezium, NiFi, query execution)
    - Network data transfer
    - Compares costs across different connection modes

    Request Body:
    - ConnectionConfig with source configuration

    Returns:
    - CostEstimate with detailed breakdown and mode comparison
    """
    try:
        estimate = await service.intelligence.estimate_cost(config)
        return estimate
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to estimate cost: {str(e)}"
        )
