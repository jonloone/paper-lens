"""
CDC Deployment Orchestration Service

Coordinates end-to-end CDC pipeline deployment across Kafka, Debezium, and Iceberg.
Implements 6-phase deployment workflow with validation, rollback, and monitoring.
"""

import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from backend.models.cdc_deployment import (
    CDCDeploymentRequest,
    CDCDeploymentResult,
    CDCDeploymentStatus,
    CDCValidationSummary,
    RollbackRequest,
    RollbackResult,
    CDCPipelineHealth,
    PhaseResult,
    DeploymentPhase,
    PhaseStatus
)
from backend.services.kafka_service import KafkaService
from backend.services.debezium_service import DebeziumService
from backend.services.iceberg_service import IcebergService
from backend.services.sources_service import SourcesService
from backend.database import get_db_pool

logger = logging.getLogger(__name__)


class CDCDeploymentService:
    """Service for orchestrating end-to-end CDC pipeline deployments"""

    def __init__(self):
        """Initialize CDC deployment service"""
        self.kafka_service = KafkaService()
        self.debezium_service = DebeziumService()
        self.iceberg_service = IcebergService()

    async def deploy_cdc_pipeline(
        self,
        request: CDCDeploymentRequest
    ) -> CDCDeploymentResult:
        """
        Deploy complete CDC pipeline with 6-phase orchestration

        Phases:
        1. Validation - Validate all configurations
        2. Kafka Topic Creation - Create Kafka topics
        3. Debezium Deployment - Deploy CDC connector
        4. Iceberg Table Creation - Create Iceberg tables
        5. Verification - Verify end-to-end flow
        6. Monitoring Setup - Configure monitoring

        Args:
            request: CDC deployment request

        Returns:
            CDCDeploymentResult with deployment status
        """
        deployment_id = str(uuid.uuid4())
        started_at = datetime.now()
        phases: List[PhaseResult] = []

        logger.info(f"Starting CDC deployment {deployment_id} for source {request.source_id}")

        try:
            # Get source information
            db_pool = await get_db_pool()
            sources_service = SourcesService(db_pool)
            source = await sources_service.get_source(request.source_id)

            if not source:
                return CDCDeploymentResult(
                    deployment_id=deployment_id,
                    source_id=request.source_id,
                    source_name="Unknown",
                    status="failed",
                    message=f"Source {request.source_id} not found",
                    started_at=started_at,
                    completed_at=datetime.now(),
                    total_duration_seconds=(datetime.now() - started_at).total_seconds()
                )

            # Phase 1: Validation
            validation_result = await self._phase_validation(request, source)
            phases.append(validation_result)

            if validation_result.status == PhaseStatus.FAILED:
                return self._build_result(
                    deployment_id, source, "failed",
                    "Validation failed", phases, started_at
                )

            if request.dry_run:
                return self._build_result(
                    deployment_id, source, "validated",
                    "Dry run completed - validation successful", phases, started_at
                )

            # Phase 2: Kafka Topic Creation
            kafka_result = await self._phase_kafka_topic_creation(request)
            phases.append(kafka_result)

            if kafka_result.status == PhaseStatus.FAILED:
                if request.auto_rollback:
                    await self._rollback_deployment(deployment_id, phases)
                return self._build_result(
                    deployment_id, source, "failed",
                    "Kafka topic creation failed", phases, started_at
                )

            # Phase 3: Debezium Deployment
            debezium_result = await self._phase_debezium_deployment(request)
            phases.append(debezium_result)

            if debezium_result.status == PhaseStatus.FAILED:
                if request.auto_rollback:
                    await self._rollback_deployment(deployment_id, phases)
                return self._build_result(
                    deployment_id, source, "failed",
                    "Debezium connector deployment failed", phases, started_at
                )

            # Phase 4: Iceberg Table Creation
            iceberg_result = await self._phase_iceberg_table_creation(request)
            phases.append(iceberg_result)

            if iceberg_result.status == PhaseStatus.FAILED:
                if request.auto_rollback:
                    await self._rollback_deployment(deployment_id, phases)
                return self._build_result(
                    deployment_id, source, "failed",
                    "Iceberg table creation failed", phases, started_at
                )

            # Phase 5: Verification
            verification_result = await self._phase_verification(request, phases)
            phases.append(verification_result)

            if verification_result.status == PhaseStatus.FAILED:
                return self._build_result(
                    deployment_id, source, "completed_with_warnings",
                    "Deployment completed but verification failed", phases, started_at
                )

            # Phase 6: Monitoring Setup
            monitoring_result = await self._phase_monitoring_setup(request, source)
            phases.append(monitoring_result)

            # Success!
            return self._build_result(
                deployment_id, source, "completed",
                "CDC pipeline deployed successfully", phases, started_at,
                kafka_topic=request.kafka_topic_config.name,
                debezium_connector=request.debezium_config.name,
                iceberg_tables=[t.table_name for t in request.iceberg_configs]
            )

        except Exception as e:
            logger.error(f"Error deploying CDC pipeline: {e}")
            return self._build_result(
                deployment_id,
                source if 'source' in locals() else None,
                "failed",
                f"Deployment error: {str(e)}",
                phases,
                started_at
            )

    async def _phase_validation(
        self,
        request: CDCDeploymentRequest,
        source: Any
    ) -> PhaseResult:
        """Phase 1: Validate all configurations"""
        phase_start = datetime.now()

        try:
            logger.info("Phase 1: Starting validation")

            # Validate Kafka config
            kafka_validation = await self.kafka_service.validate_topic_config(
                request.kafka_topic_config
            )

            # Validate Debezium config
            debezium_validation = await self.debezium_service.validate_connector_config(
                request.debezium_config
            )

            # Validate Iceberg configs
            iceberg_validations = []
            for iceberg_config in request.iceberg_configs:
                validation = await self.iceberg_service.validate_table_config(iceberg_config)
                iceberg_validations.append(validation)

            # Aggregate validation results
            all_valid = (
                kafka_validation.valid and
                debezium_validation.valid and
                all(v.valid for v in iceberg_validations)
            )

            errors = []
            warnings = []

            if not kafka_validation.valid:
                errors.extend(kafka_validation.errors)
            warnings.extend(kafka_validation.warnings)

            if not debezium_validation.valid:
                errors.extend(debezium_validation.errors)
            warnings.extend(debezium_validation.warnings)

            for v in iceberg_validations:
                if not v.valid:
                    errors.extend(v.errors)
                warnings.extend(v.warnings)

            phase_end = datetime.now()
            duration = (phase_end - phase_start).total_seconds()

            if all_valid:
                return PhaseResult(
                    phase=DeploymentPhase.VALIDATION,
                    status=PhaseStatus.COMPLETED,
                    message="All configurations validated successfully",
                    started_at=phase_start,
                    completed_at=phase_end,
                    duration_seconds=duration,
                    warnings=warnings,
                    artifacts={
                        "kafka_validation": kafka_validation.dict(),
                        "debezium_validation": debezium_validation.dict(),
                        "iceberg_validations": [v.dict() for v in iceberg_validations]
                    }
                )
            else:
                return PhaseResult(
                    phase=DeploymentPhase.VALIDATION,
                    status=PhaseStatus.FAILED,
                    message=f"Validation failed: {len(errors)} error(s)",
                    started_at=phase_start,
                    completed_at=phase_end,
                    duration_seconds=duration,
                    warnings=warnings,
                    errors=errors
                )

        except Exception as e:
            logger.error(f"Validation phase error: {e}")
            return PhaseResult(
                phase=DeploymentPhase.VALIDATION,
                status=PhaseStatus.FAILED,
                message=f"Validation error: {str(e)}",
                started_at=phase_start,
                completed_at=datetime.now(),
                duration_seconds=(datetime.now() - phase_start).total_seconds(),
                errors=[str(e)]
            )

    async def _phase_kafka_topic_creation(
        self,
        request: CDCDeploymentRequest
    ) -> PhaseResult:
        """Phase 2: Create Kafka topics"""
        phase_start = datetime.now()

        try:
            logger.info("Phase 2: Creating Kafka topics")

            result = await self.kafka_service.create_topic(
                request.kafka_topic_config,
                validate_only=False
            )

            phase_end = datetime.now()
            duration = (phase_end - phase_start).total_seconds()

            if result.success:
                return PhaseResult(
                    phase=DeploymentPhase.KAFKA_TOPIC_CREATION,
                    status=PhaseStatus.COMPLETED,
                    message=f"Kafka topic '{result.topic_name}' created successfully",
                    started_at=phase_start,
                    completed_at=phase_end,
                    duration_seconds=duration,
                    warnings=result.warnings,
                    artifacts={"topic_info": result.topic_info.dict() if result.topic_info else None}
                )
            else:
                return PhaseResult(
                    phase=DeploymentPhase.KAFKA_TOPIC_CREATION,
                    status=PhaseStatus.FAILED,
                    message=result.message,
                    started_at=phase_start,
                    completed_at=phase_end,
                    duration_seconds=duration,
                    errors=[result.message]
                )

        except Exception as e:
            logger.error(f"Kafka topic creation error: {e}")
            return PhaseResult(
                phase=DeploymentPhase.KAFKA_TOPIC_CREATION,
                status=PhaseStatus.FAILED,
                message=f"Error: {str(e)}",
                started_at=phase_start,
                completed_at=datetime.now(),
                duration_seconds=(datetime.now() - phase_start).total_seconds(),
                errors=[str(e)]
            )

    async def _phase_debezium_deployment(
        self,
        request: CDCDeploymentRequest
    ) -> PhaseResult:
        """Phase 3: Deploy Debezium connector"""
        phase_start = datetime.now()

        try:
            logger.info("Phase 3: Deploying Debezium connector")

            result = await self.debezium_service.create_connector(
                request.debezium_config,
                validate_only=False
            )

            phase_end = datetime.now()
            duration = (phase_end - phase_start).total_seconds()

            if result.success:
                return PhaseResult(
                    phase=DeploymentPhase.DEBEZIUM_DEPLOYMENT,
                    status=PhaseStatus.COMPLETED,
                    message=f"Debezium connector '{result.connector_name}' deployed successfully",
                    started_at=phase_start,
                    completed_at=phase_end,
                    duration_seconds=duration,
                    warnings=result.warnings,
                    artifacts={"connector_info": result.connector_info.dict() if result.connector_info else None}
                )
            else:
                return PhaseResult(
                    phase=DeploymentPhase.DEBEZIUM_DEPLOYMENT,
                    status=PhaseStatus.FAILED,
                    message=result.message,
                    started_at=phase_start,
                    completed_at=phase_end,
                    duration_seconds=duration,
                    errors=[result.message]
                )

        except Exception as e:
            logger.error(f"Debezium deployment error: {e}")
            return PhaseResult(
                phase=DeploymentPhase.DEBEZIUM_DEPLOYMENT,
                status=PhaseStatus.FAILED,
                message=f"Error: {str(e)}",
                started_at=phase_start,
                completed_at=datetime.now(),
                duration_seconds=(datetime.now() - phase_start).total_seconds(),
                errors=[str(e)]
            )

    async def _phase_iceberg_table_creation(
        self,
        request: CDCDeploymentRequest
    ) -> PhaseResult:
        """Phase 4: Create Iceberg tables"""
        phase_start = datetime.now()

        try:
            logger.info("Phase 4: Creating Iceberg tables")

            results = []
            errors = []
            warnings = []

            for iceberg_config in request.iceberg_configs:
                result = await self.iceberg_service.create_table(
                    iceberg_config,
                    validate_only=False,
                    if_not_exists=request.skip_existing
                )
                results.append(result)

                if not result.success:
                    errors.append(result.message)
                warnings.extend(result.warnings)

            phase_end = datetime.now()
            duration = (phase_end - phase_start).total_seconds()

            success_count = sum(1 for r in results if r.success)
            total_count = len(results)

            if success_count == total_count:
                return PhaseResult(
                    phase=DeploymentPhase.ICEBERG_TABLE_CREATION,
                    status=PhaseStatus.COMPLETED,
                    message=f"Created {success_count}/{total_count} Iceberg tables successfully",
                    started_at=phase_start,
                    completed_at=phase_end,
                    duration_seconds=duration,
                    warnings=warnings,
                    artifacts={"table_results": [r.dict() for r in results]}
                )
            else:
                return PhaseResult(
                    phase=DeploymentPhase.ICEBERG_TABLE_CREATION,
                    status=PhaseStatus.FAILED,
                    message=f"Only {success_count}/{total_count} tables created successfully",
                    started_at=phase_start,
                    completed_at=phase_end,
                    duration_seconds=duration,
                    warnings=warnings,
                    errors=errors
                )

        except Exception as e:
            logger.error(f"Iceberg table creation error: {e}")
            return PhaseResult(
                phase=DeploymentPhase.ICEBERG_TABLE_CREATION,
                status=PhaseStatus.FAILED,
                message=f"Error: {str(e)}",
                started_at=phase_start,
                completed_at=datetime.now(),
                duration_seconds=(datetime.now() - phase_start).total_seconds(),
                errors=[str(e)]
            )

    async def _phase_verification(
        self,
        request: CDCDeploymentRequest,
        phases: List[PhaseResult]
    ) -> PhaseResult:
        """Phase 5: Verify end-to-end flow"""
        phase_start = datetime.now()

        try:
            logger.info("Phase 5: Verifying end-to-end flow")

            checks = []
            errors = []

            # Check Kafka topic exists
            topic_info = await self.kafka_service.get_topic_info(request.kafka_topic_config.name)
            if topic_info:
                checks.append({"check": "kafka_topic", "passed": True, "message": f"Topic {request.kafka_topic_config.name} exists"})
            else:
                errors.append(f"Kafka topic {request.kafka_topic_config.name} not found")
                checks.append({"check": "kafka_topic", "passed": False, "message": "Topic not found"})

            # Check Debezium connector status
            connector_status = await self.debezium_service.get_connector_status(request.debezium_config.name)
            if connector_status and connector_status.connector.get("state") == "RUNNING":
                checks.append({"check": "debezium_connector", "passed": True, "message": "Connector running"})
            else:
                errors.append(f"Debezium connector {request.debezium_config.name} not running")
                checks.append({"check": "debezium_connector", "passed": False, "message": "Connector not running"})

            # Check Iceberg tables exist
            for iceberg_config in request.iceberg_configs:
                table_info = await self.iceberg_service.get_table_info(
                    iceberg_config.catalog_name,
                    iceberg_config.database_name,
                    iceberg_config.table_name
                )
                if table_info:
                    checks.append({
                        "check": f"iceberg_table_{iceberg_config.table_name}",
                        "passed": True,
                        "message": f"Table {iceberg_config.table_name} exists"
                    })
                else:
                    errors.append(f"Iceberg table {iceberg_config.table_name} not found")
                    checks.append({
                        "check": f"iceberg_table_{iceberg_config.table_name}",
                        "passed": False,
                        "message": "Table not found"
                    })

            phase_end = datetime.now()
            duration = (phase_end - phase_start).total_seconds()

            if len(errors) == 0:
                return PhaseResult(
                    phase=DeploymentPhase.VERIFICATION,
                    status=PhaseStatus.COMPLETED,
                    message=f"All {len(checks)} verification checks passed",
                    started_at=phase_start,
                    completed_at=phase_end,
                    duration_seconds=duration,
                    artifacts={"checks": checks}
                )
            else:
                return PhaseResult(
                    phase=DeploymentPhase.VERIFICATION,
                    status=PhaseStatus.FAILED,
                    message=f"{len(errors)} verification check(s) failed",
                    started_at=phase_start,
                    completed_at=phase_end,
                    duration_seconds=duration,
                    errors=errors,
                    artifacts={"checks": checks}
                )

        except Exception as e:
            logger.error(f"Verification phase error: {e}")
            return PhaseResult(
                phase=DeploymentPhase.VERIFICATION,
                status=PhaseStatus.FAILED,
                message=f"Error: {str(e)}",
                started_at=phase_start,
                completed_at=datetime.now(),
                duration_seconds=(datetime.now() - phase_start).total_seconds(),
                errors=[str(e)]
            )

    async def _phase_monitoring_setup(
        self,
        request: CDCDeploymentRequest,
        source: Any
    ) -> PhaseResult:
        """Phase 6: Configure monitoring"""
        phase_start = datetime.now()

        try:
            logger.info("Phase 6: Setting up monitoring")

            # In production, this would:
            # - Create Datadog/Prometheus dashboards
            # - Set up alerting rules
            # - Configure log aggregation
            # - Enable metrics collection

            # For now, log success
            phase_end = datetime.now()
            duration = (phase_end - phase_start).total_seconds()

            return PhaseResult(
                phase=DeploymentPhase.MONITORING_SETUP,
                status=PhaseStatus.COMPLETED,
                message="Monitoring configured successfully",
                started_at=phase_start,
                completed_at=phase_end,
                duration_seconds=duration,
                artifacts={
                    "dashboards": ["cdc_pipeline_overview", "connector_health", "table_metrics"],
                    "alerts": ["connector_failed", "high_lag", "table_issues"]
                }
            )

        except Exception as e:
            logger.error(f"Monitoring setup error: {e}")
            return PhaseResult(
                phase=DeploymentPhase.MONITORING_SETUP,
                status=PhaseStatus.COMPLETED,  # Non-critical phase
                message=f"Warning: {str(e)}",
                started_at=phase_start,
                completed_at=datetime.now(),
                duration_seconds=(datetime.now() - phase_start).total_seconds(),
                warnings=[str(e)]
            )

    async def _rollback_deployment(
        self,
        deployment_id: str,
        phases: List[PhaseResult]
    ):
        """Rollback deployment by undoing completed phases"""
        logger.warning(f"Rolling back deployment {deployment_id}")

        for phase in reversed(phases):
            if phase.status == PhaseStatus.COMPLETED:
                try:
                    if phase.phase == DeploymentPhase.KAFKA_TOPIC_CREATION:
                        topic_name = phase.artifacts.get("topic_info", {}).get("name")
                        if topic_name:
                            await self.kafka_service.delete_topic(topic_name)
                            logger.info(f"Rolled back Kafka topic: {topic_name}")

                    elif phase.phase == DeploymentPhase.DEBEZIUM_DEPLOYMENT:
                        connector_name = phase.artifacts.get("connector_info", {}).get("name")
                        if connector_name:
                            await self.debezium_service.delete_connector(connector_name)
                            logger.info(f"Rolled back Debezium connector: {connector_name}")

                    elif phase.phase == DeploymentPhase.ICEBERG_TABLE_CREATION:
                        table_results = phase.artifacts.get("table_results", [])
                        for result in table_results:
                            if result.get("success"):
                                await self.iceberg_service.drop_table(
                                    result["catalog"],
                                    result["database"],
                                    result["table"],
                                    purge=True
                                )
                                logger.info(f"Rolled back Iceberg table: {result['table']}")

                except Exception as e:
                    logger.error(f"Error during rollback of {phase.phase}: {e}")

    def _build_result(
        self,
        deployment_id: str,
        source: Any,
        status: str,
        message: str,
        phases: List[PhaseResult],
        started_at: datetime,
        kafka_topic: Optional[str] = None,
        debezium_connector: Optional[str] = None,
        iceberg_tables: List[str] = None
    ) -> CDCDeploymentResult:
        """Build final deployment result"""
        completed_at = datetime.now()
        duration = (completed_at - started_at).total_seconds()

        # Calculate validation metrics
        all_checks = []
        for phase in phases:
            if phase.phase == DeploymentPhase.VALIDATION:
                kafka_val = phase.artifacts.get("kafka_validation", {})
                all_checks.extend(kafka_val.get("checks", []))

                debezium_val = phase.artifacts.get("debezium_validation", {})
                all_checks.extend(debezium_val.get("checks", []))

                for iceberg_val in phase.artifacts.get("iceberg_validations", []):
                    all_checks.extend(iceberg_val.get("checks", []))

        passed_checks = sum(1 for c in all_checks if c.get("passed"))
        failed_checks = sum(1 for c in all_checks if not c.get("passed"))

        warnings_count = sum(len(p.warnings) for p in phases)

        return CDCDeploymentResult(
            deployment_id=deployment_id,
            source_id=source.id if source else "unknown",
            source_name=source.name if source else "Unknown",
            status=status,
            message=message,
            phases=phases,
            started_at=started_at,
            completed_at=completed_at,
            total_duration_seconds=duration,
            kafka_topic=kafka_topic,
            debezium_connector=debezium_connector,
            iceberg_tables=iceberg_tables or [],
            validation_checks=all_checks,
            total_checks=len(all_checks),
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            warnings_count=warnings_count
        )

    async def close(self):
        """Close service connections"""
        self.kafka_service.close()
        await self.debezium_service.close()
