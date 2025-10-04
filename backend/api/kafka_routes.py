"""
Kafka API routes for topic management
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
import logging

from backend.models.kafka import (
    TopicConfig,
    TopicCreateRequest,
    TopicCreateResult,
    TopicInfo,
    TopicValidationResult,
    KafkaClusterInfo,
    ConsumerGroupInfo
)
from backend.services.kafka_service import KafkaService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/kafka", tags=["kafka"])


def get_kafka_service() -> KafkaService:
    """Dependency to get Kafka service"""
    return KafkaService()


@router.post("/topics", response_model=TopicCreateResult)
async def create_topic(
    request: TopicCreateRequest,
    service: KafkaService = Depends(get_kafka_service)
):
    """
    Create a new Kafka topic

    Args:
        request: Topic creation request with configuration
        service: Kafka service instance

    Returns:
        TopicCreateResult with creation status
    """
    try:
        result = await service.create_topic(
            request.topic_config,
            validate_only=request.validate_only
        )
        return result
    except Exception as e:
        logger.error(f"Error creating topic: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.post("/topics/validate", response_model=TopicValidationResult)
async def validate_topic_config(
    topic_config: TopicConfig,
    service: KafkaService = Depends(get_kafka_service)
):
    """
    Validate topic configuration without creating

    Args:
        topic_config: Topic configuration to validate
        service: Kafka service instance

    Returns:
        TopicValidationResult with validation status
    """
    try:
        result = await service.validate_topic_config(topic_config)
        return result
    except Exception as e:
        logger.error(f"Error validating topic config: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/topics", response_model=List[str])
async def list_topics(
    include_internal: bool = Query(False, description="Include internal Kafka topics"),
    service: KafkaService = Depends(get_kafka_service)
):
    """
    List all Kafka topics

    Args:
        include_internal: Include internal topics (starting with _)
        service: Kafka service instance

    Returns:
        List of topic names
    """
    try:
        topics = await service.list_topics(include_internal=include_internal)
        return topics
    except Exception as e:
        logger.error(f"Error listing topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/topics/{topic_name}", response_model=TopicInfo)
async def get_topic_info(
    topic_name: str,
    service: KafkaService = Depends(get_kafka_service)
):
    """
    Get detailed information about a topic

    Args:
        topic_name: Topic name
        service: Kafka service instance

    Returns:
        TopicInfo with topic details
    """
    try:
        topic_info = await service.get_topic_info(topic_name)
        if not topic_info:
            raise HTTPException(status_code=404, detail=f"Topic '{topic_name}' not found")
        return topic_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting topic info: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.delete("/topics/{topic_name}")
async def delete_topic(
    topic_name: str,
    service: KafkaService = Depends(get_kafka_service)
):
    """
    Delete a Kafka topic

    Args:
        topic_name: Topic name to delete
        service: Kafka service instance

    Returns:
        Success message
    """
    try:
        success = await service.delete_topic(topic_name)
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to delete topic '{topic_name}'")
        return {"message": f"Topic '{topic_name}' deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting topic: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/cluster", response_model=KafkaClusterInfo)
async def get_cluster_info(
    service: KafkaService = Depends(get_kafka_service)
):
    """
    Get Kafka cluster information

    Args:
        service: Kafka service instance

    Returns:
        KafkaClusterInfo with cluster details
    """
    try:
        cluster_info = await service.get_cluster_info()
        if not cluster_info:
            raise HTTPException(status_code=500, detail="Failed to get cluster information")
        return cluster_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cluster info: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/consumer-groups/{group_id}", response_model=ConsumerGroupInfo)
async def get_consumer_group_info(
    group_id: str,
    service: KafkaService = Depends(get_kafka_service)
):
    """
    Get consumer group information

    Args:
        group_id: Consumer group ID
        service: Kafka service instance

    Returns:
        ConsumerGroupInfo with group details
    """
    try:
        group_info = await service.get_consumer_group_info(group_id)
        if not group_info:
            raise HTTPException(status_code=404, detail=f"Consumer group '{group_id}' not found")
        return group_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting consumer group info: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()
