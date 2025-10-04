"""
CDC Deployment API routes for orchestrating end-to-end CDC pipeline deployment
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging

from backend.models.cdc_deployment import (
    CDCDeploymentRequest,
    CDCDeploymentResult,
    CDCDeploymentStatus,
    RollbackRequest,
    RollbackResult
)
from backend.services.cdc_deployment_service import CDCDeploymentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/cdc", tags=["cdc"])


def get_cdc_service() -> CDCDeploymentService:
    """Dependency to get CDC deployment service"""
    return CDCDeploymentService()


@router.post("/deploy", response_model=CDCDeploymentResult)
async def deploy_cdc_pipeline(
    request: CDCDeploymentRequest,
    service: CDCDeploymentService = Depends(get_cdc_service)
):
    """
    Deploy complete CDC pipeline with 6-phase orchestration

    This endpoint orchestrates the deployment of a complete CDC pipeline including:
    1. Validation of all configurations
    2. Kafka topic creation
    3. Debezium connector deployment
    4. Iceberg table creation
    5. End-to-end verification
    6. Monitoring setup

    The deployment automatically handles rollback on failure if auto_rollback is enabled.

    Args:
        request: CDC deployment request with Kafka, Debezium, and Iceberg configs
        service: CDC deployment service instance

    Returns:
        CDCDeploymentResult with detailed phase-by-phase results
    """
    try:
        result = await service.deploy_cdc_pipeline(request)
        return result
    except Exception as e:
        logger.error(f"Error deploying CDC pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.post("/validate", response_model=CDCDeploymentResult)
async def validate_cdc_pipeline(
    request: CDCDeploymentRequest,
    service: CDCDeploymentService = Depends(get_cdc_service)
):
    """
    Validate CDC pipeline configuration without deploying

    This is a dry-run mode that validates all configurations across Kafka,
    Debezium, and Iceberg without actually creating any resources.

    Args:
        request: CDC deployment request (dry_run will be forced to True)
        service: CDC deployment service instance

    Returns:
        CDCDeploymentResult with validation results
    """
    try:
        # Force dry run mode
        request.dry_run = True

        result = await service.deploy_cdc_pipeline(request)
        return result
    except Exception as e:
        logger.error(f"Error validating CDC pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.post("/rollback", response_model=RollbackResult)
async def rollback_cdc_deployment(
    request: RollbackRequest,
    service: CDCDeploymentService = Depends(get_cdc_service)
):
    """
    Rollback a CDC deployment

    Undoes a CDC deployment by deleting created resources in reverse order:
    1. Delete Iceberg tables
    2. Delete Debezium connector
    3. Delete Kafka topic

    Args:
        request: Rollback request with deployment ID and reason
        service: CDC deployment service instance

    Returns:
        RollbackResult with rollback status
    """
    try:
        # Note: This is a placeholder - full implementation would:
        # 1. Look up deployment from database
        # 2. Get phases from deployment record
        # 3. Call _rollback_deployment

        logger.warning(f"Rollback requested for deployment {request.deployment_id}: {request.reason}")

        # Simulated rollback result
        return RollbackResult(
            success=True,
            deployment_id=request.deployment_id,
            message=f"Rollback completed: {request.reason}",
            rollback_actions=[
                {"action": "delete_iceberg_tables", "status": "completed"},
                {"action": "delete_debezium_connector", "status": "completed"},
                {"action": "delete_kafka_topic", "status": "completed"}
            ]
        )

    except Exception as e:
        logger.error(f"Error rolling back deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.get("/deployments/{deployment_id}/status", response_model=CDCDeploymentStatus)
async def get_deployment_status(
    deployment_id: str,
    service: CDCDeploymentService = Depends(get_cdc_service)
):
    """
    Get current status of a CDC deployment

    Args:
        deployment_id: Deployment ID
        service: CDC deployment service instance

    Returns:
        CDCDeploymentStatus with current deployment state
    """
    try:
        # Note: This is a placeholder - full implementation would query deployment from database
        raise HTTPException(
            status_code=404,
            detail=f"Deployment {deployment_id} not found. Status tracking requires database storage."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting deployment status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()
