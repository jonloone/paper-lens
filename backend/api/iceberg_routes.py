"""
Iceberg API routes for table management
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
import logging

from backend.models.iceberg import (
    IcebergTableConfig,
    TableCreateRequest,
    TableCreateResult,
    TableInfo,
    TableValidationResult,
    TableMetrics,
    SchemaEvolutionRequest
)
from backend.services.iceberg_service import IcebergService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/iceberg", tags=["iceberg"])


def get_iceberg_service() -> IcebergService:
    """Dependency to get Iceberg service"""
    return IcebergService()


@router.post("/tables", response_model=TableCreateResult)
async def create_table(
    request: TableCreateRequest,
    service: IcebergService = Depends(get_iceberg_service)
):
    """
    Create a new Iceberg table

    Args:
        request: Table creation request with configuration
        service: Iceberg service instance

    Returns:
        TableCreateResult with creation status
    """
    try:
        result = await service.create_table(
            request.config,
            validate_only=request.validate_only,
            if_not_exists=request.if_not_exists
        )
        return result
    except Exception as e:
        logger.error(f"Error creating table: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tables/validate", response_model=TableValidationResult)
async def validate_table_config(
    config: IcebergTableConfig,
    service: IcebergService = Depends(get_iceberg_service)
):
    """
    Validate table configuration without creating

    Args:
        config: Table configuration to validate
        service: Iceberg service instance

    Returns:
        TableValidationResult with validation status
    """
    try:
        result = await service.validate_table_config(config)
        return result
    except Exception as e:
        logger.error(f"Error validating table config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables/{catalog}/{database}", response_model=List[str])
async def list_tables(
    catalog: str,
    database: str,
    service: IcebergService = Depends(get_iceberg_service)
):
    """
    List tables in a database

    Args:
        catalog: Catalog name
        database: Database name
        service: Iceberg service instance

    Returns:
        List of table names
    """
    try:
        tables = await service.list_tables(catalog, database)
        return tables
    except Exception as e:
        logger.error(f"Error listing tables: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables/{catalog}/{database}/{table}", response_model=TableInfo)
async def get_table_info(
    catalog: str,
    database: str,
    table: str,
    service: IcebergService = Depends(get_iceberg_service)
):
    """
    Get detailed table information

    Args:
        catalog: Catalog name
        database: Database name
        table: Table name
        service: Iceberg service instance

    Returns:
        TableInfo with table details
    """
    try:
        info = await service.get_table_info(catalog, database, table)
        if not info:
            raise HTTPException(
                status_code=404,
                detail=f"Table '{catalog}.{database}.{table}' not found"
            )
        return info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting table info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tables/{catalog}/{database}/{table}")
async def drop_table(
    catalog: str,
    database: str,
    table: str,
    purge: bool = Query(False, description="Purge data files"),
    service: IcebergService = Depends(get_iceberg_service)
):
    """
    Drop an Iceberg table

    Args:
        catalog: Catalog name
        database: Database name
        table: Table name
        purge: Whether to purge data files
        service: Iceberg service instance

    Returns:
        Success message
    """
    try:
        success = await service.drop_table(catalog, database, table, purge=purge)
        if not success:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to drop table '{catalog}.{database}.{table}'"
            )
        return {"message": f"Table '{catalog}.{database}.{table}' dropped successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error dropping table: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables/{catalog}/{database}/{table}/metrics", response_model=TableMetrics)
async def get_table_metrics(
    catalog: str,
    database: str,
    table: str,
    service: IcebergService = Depends(get_iceberg_service)
):
    """
    Get table metrics

    Args:
        catalog: Catalog name
        database: Database name
        table: Table name
        service: Iceberg service instance

    Returns:
        TableMetrics with table statistics
    """
    try:
        metrics = await service.get_table_metrics(catalog, database, table)
        if not metrics:
            raise HTTPException(
                status_code=404,
                detail=f"Metrics for table '{catalog}.{database}.{table}' not found"
            )
        return metrics
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting table metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tables/evolve-schema")
async def evolve_schema(
    request: SchemaEvolutionRequest,
    service: IcebergService = Depends(get_iceberg_service)
):
    """
    Evolve table schema

    Args:
        request: Schema evolution request
        service: Iceberg service instance

    Returns:
        Success message
    """
    try:
        success = await service.evolve_schema(request)
        if not success:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to evolve schema for table '{request.catalog}.{request.database}.{request.table}'"
            )
        return {
            "message": f"Schema evolved successfully for '{request.catalog}.{request.database}.{request.table}'",
            "operation": request.operation.value
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evolving schema: {e}")
        raise HTTPException(status_code=500, detail=str(e))
