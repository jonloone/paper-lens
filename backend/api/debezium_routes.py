"""
Debezium API routes for CDC connector management
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import logging

from backend.models.debezium import (
    DebeziumConnectorConfig,
    ConnectorCreateRequest,
    ConnectorCreateResult,
    ConnectorInfo,
    ConnectorStatusInfo,
    ConnectorValidationResult,
    KafkaConnectClusterInfo,
    ConnectorOffsets
)
from backend.services.debezium_service import DebeziumService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/debezium", tags=["debezium"])


def get_debezium_service() -> DebeziumService:
    """Dependency to get Debezium service"""
    return DebeziumService()


@router.post("/connectors", response_model=ConnectorCreateResult)
async def create_connector(
    request: ConnectorCreateRequest,
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    Create a new Debezium CDC connector

    Args:
        request: Connector creation request with configuration
        service: Debezium service instance

    Returns:
        ConnectorCreateResult with creation status
    """
    try:
        result = await service.create_connector(
            request.config,
            validate_only=request.validate_only
        )
        return result
    except Exception as e:
        logger.error(f"Error creating connector: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.post("/connectors/validate", response_model=ConnectorValidationResult)
async def validate_connector_config(
    config: DebeziumConnectorConfig,
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    Validate connector configuration without creating

    Args:
        config: Connector configuration to validate
        service: Debezium service instance

    Returns:
        ConnectorValidationResult with validation status
    """
    try:
        result = await service.validate_connector_config(config)
        return result
    except Exception as e:
        logger.error(f"Error validating connector config: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.get("/connectors", response_model=List[str])
async def list_connectors(
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    List all Debezium connectors

    Args:
        service: Debezium service instance

    Returns:
        List of connector names
    """
    try:
        connectors = await service.list_connectors()
        return connectors
    except Exception as e:
        logger.error(f"Error listing connectors: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.get("/connectors/{connector_name}", response_model=ConnectorInfo)
async def get_connector_info(
    connector_name: str,
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    Get detailed connector information

    Args:
        connector_name: Connector name
        service: Debezium service instance

    Returns:
        ConnectorInfo with connector details
    """
    try:
        info = await service.get_connector_info(connector_name)
        if not info:
            raise HTTPException(status_code=404, detail=f"Connector '{connector_name}' not found")
        return info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting connector info: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.get("/connectors/{connector_name}/status", response_model=ConnectorStatusInfo)
async def get_connector_status(
    connector_name: str,
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    Get connector status

    Args:
        connector_name: Connector name
        service: Debezium service instance

    Returns:
        ConnectorStatusInfo with status details
    """
    try:
        status = await service.get_connector_status(connector_name)
        if not status:
            raise HTTPException(status_code=404, detail=f"Connector '{connector_name}' not found")
        return status
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting connector status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.get("/connectors/{connector_name}/offsets", response_model=ConnectorOffsets)
async def get_connector_offsets(
    connector_name: str,
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    Get connector offsets

    Args:
        connector_name: Connector name
        service: Debezium service instance

    Returns:
        ConnectorOffsets with offset information
    """
    try:
        offsets = await service.get_connector_offsets(connector_name)
        if not offsets:
            raise HTTPException(status_code=404, detail=f"Offsets for connector '{connector_name}' not found")
        return offsets
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting connector offsets: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.put("/connectors/{connector_name}/pause")
async def pause_connector(
    connector_name: str,
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    Pause a connector

    Args:
        connector_name: Connector name
        service: Debezium service instance

    Returns:
        Success message
    """
    try:
        success = await service.pause_connector(connector_name)
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to pause connector '{connector_name}'")
        return {"message": f"Connector '{connector_name}' paused successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pausing connector: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.put("/connectors/{connector_name}/resume")
async def resume_connector(
    connector_name: str,
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    Resume a paused connector

    Args:
        connector_name: Connector name
        service: Debezium service instance

    Returns:
        Success message
    """
    try:
        success = await service.resume_connector(connector_name)
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to resume connector '{connector_name}'")
        return {"message": f"Connector '{connector_name}' resumed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resuming connector: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.post("/connectors/{connector_name}/restart")
async def restart_connector(
    connector_name: str,
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    Restart a connector

    Args:
        connector_name: Connector name
        service: Debezium service instance

    Returns:
        Success message
    """
    try:
        success = await service.restart_connector(connector_name)
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to restart connector '{connector_name}'")
        return {"message": f"Connector '{connector_name}' restarted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restarting connector: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.delete("/connectors/{connector_name}")
async def delete_connector(
    connector_name: str,
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    Delete a connector

    Args:
        connector_name: Connector name
        service: Debezium service instance

    Returns:
        Success message
    """
    try:
        success = await service.delete_connector(connector_name)
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to delete connector '{connector_name}'")
        return {"message": f"Connector '{connector_name}' deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting connector: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()


@router.get("/cluster", response_model=KafkaConnectClusterInfo)
async def get_cluster_info(
    service: DebeziumService = Depends(get_debezium_service)
):
    """
    Get Kafka Connect cluster information

    Args:
        service: Debezium service instance

    Returns:
        KafkaConnectClusterInfo with cluster details
    """
    try:
        info = await service.get_cluster_info()
        if not info:
            raise HTTPException(status_code=500, detail="Failed to get cluster information")
        return info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cluster info: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await service.close()
