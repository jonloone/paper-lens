"""
API routes for source management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import EmailStr

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


@router.post("/recommend")
async def recommend_sources(
    intent: str = Query(..., description="User intent describing what data they need"),
    domain: Optional[str] = Query(None, description="Filter by business domain"),
    limit: int = Query(5, le=20, description="Maximum recommendations to return"),
    service: SourcesService = Depends(get_sources_service)
):
    """
    Get AI-powered source recommendations based on user intent.

    This endpoint uses LLM to semantically match the user's intent with available
    source-aligned data products that were productized through the Connect flow.

    Query Parameters:
    - intent: Natural language description of what data is needed
      (e.g., "Customer purchase history and website activity")
    - domain: Optional domain filter (Marketing, Sales, Product, etc.)
    - limit: Maximum number of recommendations (default 5, max 20)

    Returns:
    - List of recommended sources ranked by relevance
    - Each recommendation includes:
      - source: Full source details
      - score: Relevance score (0.0 to 1.0)
      - reasoning: Explanation of why this source matches the intent
      - trust_signals: Quality indicators (health score, freshness, etc.)

    Example Request:
    ```
    POST /api/v1/sources/recommend?intent=Customer%20purchase%20data&domain=Sales&limit=3
    ```

    Example Response:
    ```json
    {
      "recommendations": [
        {
          "source": {...},
          "score": 0.95,
          "reasoning": "This source contains complete customer purchase transactions...",
          "trust_signals": {
            "health_score": 92,
            "last_updated": "2 hours ago",
            "owner": "data-eng@company.com",
            "usage_count": 45
          }
        }
      ],
      "total_sources_considered": 12,
      "intent": "Customer purchase data"
    }
    ```
    """
    from backend.services.vultr_llm_adapter import get_vultr_adapter
    import json

    try:
        # Get active sources with optional domain filter
        sources = await service.list_sources(
            status="active",
            domain=domain,
            limit=100  # Consider up to 100 sources for ranking
        )

        if not sources:
            return {
                "recommendations": [],
                "total_sources_considered": 0,
                "intent": intent,
                "message": "No active sources found"
            }

        # Prepare source information for LLM
        source_summaries = []
        for source in sources:
            summary = {
                "id": str(source.id),
                "name": source.name,
                "description": source.description or "",
                "domain": source.domain,
                "tags": source.tags or [],
                "connection_mode": source.connection_mode,
                "health_score": source.health_score if hasattr(source, 'health_score') else None,
                "table_count": len(source.tables) if hasattr(source, 'tables') else 0
            }
            source_summaries.append(summary)

        # Get LLM adapter
        llm = get_vultr_adapter()

        # Create ranking prompt
        system_prompt = """You are an expert data engineer helping users find relevant data sources.
Your task is to rank data sources by how well they match the user's intent.

Consider:
1. Semantic similarity between intent and source description
2. Relevance of domain and tags
3. Data quality indicators (health score)
4. Breadth of data (table count)

Respond with a JSON object containing a "recommendations" array.
Each recommendation must have:
- source_id: The ID of the source
- score: Relevance score from 0.0 to 1.0 (1.0 = perfect match)
- reasoning: Brief explanation (1-2 sentences) of why this source matches

Only include sources with score >= 0.4
Rank by score descending."""

        user_prompt = f"""User Intent: "{intent}"

Available Sources:
{json.dumps(source_summaries, indent=2)}

Rank these sources by relevance to the user's intent.
Return JSON with format:
{{
  "recommendations": [
    {{
      "source_id": "uuid",
      "score": 0.95,
      "reasoning": "explanation"
    }}
  ]
}}"""

        # Get LLM rankings
        response_json = await llm.generate_structured_response(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            schema={
                "recommendations": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "source_id": {"type": "string"},
                            "score": {"type": "number"},
                            "reasoning": {"type": "string"}
                        }
                    }
                }
            },
            temperature=0.3,  # Lower temperature for more consistent rankings
            max_tokens=2000
        )

        # Map LLM recommendations back to full source objects
        recommendations = []
        source_map = {str(s.id): s for s in sources}

        for rec in response_json.get("recommendations", [])[:limit]:
            source_id = rec.get("source_id")
            if source_id in source_map:
                source = source_map[source_id]

                # Build trust signals
                trust_signals = {
                    "health_score": source.health_score if hasattr(source, 'health_score') else None,
                    "last_updated": source.updated_at.isoformat() if hasattr(source, 'updated_at') else None,
                    "owner": source.owner_email,
                    "domain": source.domain,
                    "table_count": len(source.tables) if hasattr(source, 'tables') else 0
                }

                recommendations.append({
                    "source": source,
                    "score": rec.get("score", 0.5),
                    "reasoning": rec.get("reasoning", "Relevant to your intent"),
                    "trust_signals": trust_signals
                })

        return {
            "recommendations": recommendations,
            "total_sources_considered": len(sources),
            "intent": intent,
            "model_used": "qwen2.5-coder-32b-instruct"
        }

    except Exception as e:
        # Log error but return graceful fallback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to generate recommendations: {str(e)}")

        # Return basic list without AI ranking as fallback
        sources = await service.list_sources(
            status="active",
            domain=domain,
            limit=limit
        )

        return {
            "recommendations": [
                {
                    "source": source,
                    "score": 0.5,
                    "reasoning": "AI ranking unavailable - showing active sources",
                    "trust_signals": {
                        "health_score": source.health_score if hasattr(source, 'health_score') else None,
                        "owner": source.owner_email,
                        "domain": source.domain
                    }
                }
                for source in sources
            ],
            "total_sources_considered": len(sources),
            "intent": intent,
            "fallback_mode": True
        }


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


# ============================================================================
# File Upload Endpoints (NEW)
# ============================================================================

@router.post("/files/analyze")
async def analyze_file(
    file: UploadFile = File(...),
    auto_detect_schema: bool = Form(True),
):
    """
    Analyze a file and detect its schema without uploading it.

    This endpoint is used in the file upload wizard to preview the schema
    before the user completes the configuration.

    Form Parameters:
    - file: Binary file upload (CSV, JSON, Parquet, Avro)
    - auto_detect_schema: Auto-detect schema from file (default: True)

    Returns:
    - row_count: Number of rows in file
    - column_count: Number of columns
    - file_format: Detected file format
    - delimiter: CSV delimiter (if applicable)
    - has_headers: Whether CSV has headers (if applicable)
    - schema: Detected schema fields
    - sample_data: Sample rows from the file

    Example Response:
    ```json
    {
      "row_count": 10234,
      "column_count": 5,
      "file_format": "csv",
      "delimiter": ",",
      "has_headers": true,
      "schema": {
        "fields": [
          {"name": "id", "type": "INTEGER", "nullable": false},
          {"name": "name", "type": "VARCHAR", "nullable": false}
        ]
      },
      "sample_data": [...]
    }
    ```
    """
    from backend.services.file_storage_service import FileStorageService

    try:
        # Initialize file storage service
        file_service = FileStorageService()

        # Detect schema
        schema_info = await file_service.detect_schema(file, sample_rows=1000)

        return {
            "row_count": schema_info.get("row_count", 0),
            "column_count": schema_info.get("column_count", 0),
            "file_format": schema_info.get("file_format", "unknown"),
            "delimiter": schema_info.get("delimiter"),
            "has_headers": schema_info.get("has_headers", True),
            "schema": {
                "fields": schema_info.get("fields", [])
            },
            "sample_data": schema_info.get("sample_data", [])
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze file: {str(e)}"
        )


@router.post("/files/upload")
async def upload_file_source(
    file: UploadFile = File(...),
    source_name: str = Form(...),
    description: Optional[str] = Form(None),
    target_schema: str = Form("default"),
    target_table: Optional[str] = Form(None),
    domain: str = Form("default"),
    owner_email: EmailStr = Form(...),
    refresh_schedule: Optional[str] = Form(None),
    auto_detect_schema: bool = Form(True),
    service: SourcesService = Depends(get_sources_service)
):
    """
    Upload a file and create it as a persistent data source.

    This endpoint:
    1. Uploads file to S3 or local storage
    2. Auto-detects schema (CSV, JSON, Parquet)
    3. Registers file as external table in Trino catalog
    4. Saves source metadata to database
    5. Optionally schedules periodic file refresh

    Form Parameters:
    - file: Binary file upload (CSV, JSON, Parquet, Avro)
    - source_name: Name for the data source
    - description: Optional description
    - target_schema: Target Trino schema (default: "default")
    - target_table: Target table name (default: source_name)
    - domain: Business domain (default: "default")
    - owner_email: Email of source owner
    - refresh_schedule: Optional cron expression for refresh
    - auto_detect_schema: Auto-detect schema from file (default: True)

    Returns:
    - source_id: UUID of created source
    - source_name: Name of source
    - trino_table: Fully qualified table name
    - s3_url: Location of uploaded file
    - row_count: Number of rows in file
    - file_size_mb: File size in megabytes
    - schema: Detected schema fields
    - status: Source status
    - queryable: Whether source is ready to query

    Example Response:
    ```json
    {
      "source_id": "uuid",
      "source_name": "customer_data",
      "trino_table": "files.default.customer_data",
      "s3_url": "s3://nx1-data/files/customer_data_20251021.csv",
      "row_count": 10234,
      "file_size_mb": 2.4,
      "schema": {...},
      "status": "active",
      "queryable": true
    }
    ```
    """
    from backend.services.file_storage_service import FileStorageService
    from backend.models.sources import SourceCreate, ConnectionMode, FileSourceConfig, FileFormat

    try:
        # Initialize file storage service
        file_service = FileStorageService()

        # Get file size
        file_size_bytes, file_size_mb = await file_service.get_file_size(file)

        # Detect schema
        schema_info = await file_service.detect_schema(file, sample_rows=1000)

        # Upload file to storage
        storage_url = await file_service.upload_file(
            file=file,
            source_name=source_name,
            prefix="files"
        )

        # Determine target table name
        if not target_table:
            target_table = source_name.replace("-", "_").replace(" ", "_").lower()

        # Create file metadata
        file_metadata = {
            "file_format": schema_info.get("file_format"),
            "file_size_bytes": file_size_bytes,
            "file_size_mb": file_size_mb,
            "row_count": schema_info.get("row_count"),
            "column_count": schema_info.get("column_count"),
            "fields": schema_info.get("fields", []),
            "delimiter": schema_info.get("delimiter", ","),
            "has_headers": schema_info.get("has_headers", True),
            "trino_schema": target_schema,
            "trino_table": target_table,
            "partition_columns": []
        }

        # Register in Trino catalog
        await service.register_trino_file_table(
            catalog="files",
            schema=target_schema,
            table=target_table,
            location=storage_url,
            file_format=schema_info.get("file_format"),
            schema_fields=schema_info.get("fields", []),
            has_headers=schema_info.get("has_headers", True),
            delimiter=schema_info.get("delimiter", ",")
        )

        # Create source record
        source_create = SourceCreate(
            name=source_name,
            description=description,
            type=f"file_{schema_info.get('file_format')}",
            connection_mode=ConnectionMode.FEDERATED,
            domain=domain,
            owner_email=owner_email,
            tags=["file", schema_info.get("file_format")],
            file_config=FileSourceConfig(
                s3_url=storage_url,
                file_format=FileFormat(schema_info.get("file_format")),
                file_size_bytes=file_size_bytes,
                file_size_mb=file_size_mb,
                row_count=schema_info.get("row_count"),
                column_count=schema_info.get("column_count"),
                schema_fields=schema_info.get("fields", []),
                delimiter=schema_info.get("delimiter", ","),
                has_headers=schema_info.get("has_headers", True),
                refresh_schedule=refresh_schedule,
                trino_catalog="files",
                trino_schema=target_schema,
                trino_table=target_table
            )
        )

        # Create source
        source_id = await service.create_file_source(
            source=source_create,
            file_storage_url=storage_url,
            file_metadata=file_metadata
        )

        # Schedule refresh if needed
        if refresh_schedule:
            await service.schedule_file_refresh(source_id, refresh_schedule)

        return {
            "source_id": str(source_id),
            "source_name": source_name,
            "trino_table": f"files.{target_schema}.{target_table}",
            "s3_url": storage_url,
            "row_count": schema_info.get("row_count"),
            "file_size_mb": file_size_mb,
            "schema": {
                "fields": schema_info.get("fields", []),
                "file_format": schema_info.get("file_format")
            },
            "status": "active",
            "queryable": True
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file source: {str(e)}"
        )


@router.post("/{source_id}/refresh")
async def refresh_file_source(
    source_id: UUID,
    service: SourcesService = Depends(get_sources_service)
):
    """
    Refresh a file source with latest data.

    This endpoint triggers a file source refresh, which:
    1. Re-downloads file from source (if URL-based)
    2. Validates schema matches existing
    3. Updates Trino table data
    4. Updates row count and metadata

    Path Parameters:
    - source_id: UUID of the file source

    Returns:
    - success: Whether refresh was successful
    - message: Status message
    - updated_at: Timestamp of refresh
    """
    try:
        success = await service.refresh_file_source(source_id)

        if success:
            return {
                "success": True,
                "message": "File source refreshed successfully",
                "updated_at": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to refresh file source"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh file source: {str(e)}"
        )
