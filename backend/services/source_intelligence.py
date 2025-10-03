"""
CrewAI-powered source intelligence for validation and recommendations
Extends existing CrewAI infrastructure with source-specific agents
"""

import asyncio
import logging
from typing import List, Dict, Any
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from crewai import Agent, Task, Crew

from backend.models.sources import (
    ConnectionConfig, ConnectionMode,
    MCPRecommendation, CostEstimate
)

logger = logging.getLogger(__name__)


class SourceIntelligenceService:
    """
    CrewAI-powered intelligence service for source connection recommendations
    """

    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=2)
        self._setup_agents()

    def _setup_agents(self):
        """Initialize specialized CrewAI agents for source management"""

        # Source Configuration Agent - Expert in database connectivity
        self.source_config_agent = Agent(
            role="Senior Database Infrastructure Engineer",
            goal="Validate and optimize source connection configurations for reliability and performance",
            backstory="""You are an expert in database infrastructure with deep knowledge of PostgreSQL, MySQL,
            Kafka, Trino, and Iceberg. You understand connection pooling, network optimization, security best practices,
            and cost-performance tradeoffs for different connection modes (federated, CDC, batch, streaming).""",
            verbose=True,
            allow_delegation=False
        )

        # Cost Optimization Agent - Expert in infrastructure pricing
        self.cost_optimization_agent = Agent(
            role="Principal Cloud Cost Architect",
            goal="Estimate costs and recommend optimal configuration for cost-performance balance",
            backstory="""You are a cloud cost optimization expert who understands the pricing models for Kafka,
            Spark, storage, and network transfer. You can estimate monthly costs for different connection modes
            and recommend the most cost-effective architecture based on business requirements.""",
            verbose=True,
            allow_delegation=False
        )

        # Performance Tuning Agent - Expert in query optimization
        self.performance_agent = Agent(
            role="Senior Performance Engineer",
            goal="Recommend performance optimizations for data pipeline configurations",
            backstory="""You are a performance engineering expert specializing in distributed systems, query optimization,
            and data pipeline tuning. You know optimal connection pool sizes, partition strategies, compression settings,
            and file formats for different workload patterns.""",
            verbose=True,
            allow_delegation=False
        )

        # Security Agent - Expert in data security
        self.security_agent = Agent(
            role="Senior Security Engineer",
            goal="Ensure secure configuration of source connections with best practices",
            backstory="""You are a security engineer specializing in data platform security. You understand
            secret management, SSL/TLS configuration, network security, and compliance requirements (SOC2, GDPR, HIPAA).
            You recommend secure configurations without over-engineering.""",
            verbose=True,
            allow_delegation=False
        )

    async def get_connection_recommendations(
        self,
        config: ConnectionConfig
    ) -> List[MCPRecommendation]:
        """
        Get CrewAI-powered recommendations for source configuration
        """
        try:
            recommendations = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self._run_recommendation_crew,
                config
            )
            return recommendations
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return self._fallback_recommendations(config)

    def _run_recommendation_crew(
        self,
        config: ConnectionConfig
    ) -> List[MCPRecommendation]:
        """
        Execute CrewAI crew for source recommendations
        """

        # Task 1: Configuration validation and optimization
        config_task = Task(
            description=f"""
            Analyze source connection configuration and provide optimization recommendations.

            Source Configuration:
            - Name: {config.name}
            - Type: {config.type}
            - Connection Mode: {config.connection_mode.value}
            - Host: {config.connection_details.host}
            - Port: {config.connection_details.port}
            - SSL Enabled: {config.connection_details.ssl_enabled}
            - Domain: {config.domain}

            Mode-Specific Configuration:
            {self._extract_mode_config(config)}

            Provide recommendations for:
            1. Connection mode optimization (is this the right mode for the use case?)
            2. Performance tuning (pool sizes, timeouts, partitions)
            3. Security improvements (SSL, secret management)
            4. Cost optimization (resource allocation)

            For each recommendation, provide:
            - type: category (connection_mode/performance_tuning/security/cost_optimization)
            - recommendation: specific advice
            - reasoning: detailed explanation
            - confidence: 0.0-1.0
            - priority: 1-10
            """,
            agent=self.source_config_agent,
            expected_output="List of prioritized configuration recommendations"
        )

        # Task 2: Cost estimation
        cost_task = Task(
            description=f"""
            Estimate monthly costs for this source configuration.

            Connection Mode: {config.connection_mode.value}
            Configuration Details:
            {self._extract_mode_config(config)}

            Provide detailed cost breakdown including:
            - Infrastructure costs (Kafka, Debezium, NiFi, storage)
            - Network transfer costs
            - Compute costs
            - Comparison with alternative connection modes

            Return realistic monthly cost estimates in USD.
            """,
            agent=self.cost_optimization_agent,
            expected_output="Detailed cost estimate with monthly breakdown"
        )

        # Task 3: Performance optimization
        perf_task = Task(
            description=f"""
            Recommend performance optimizations for this configuration.

            Connection Mode: {config.connection_mode.value}
            {self._extract_perf_config(config)}

            Analyze:
            1. Connection pool settings (if federated)
            2. Kafka partition count (if CDC/streaming)
            3. File format and compression (if CDC/batch/streaming)
            4. Refresh schedule (if batch)

            Recommend specific tuning parameters with reasoning.
            """,
            agent=self.performance_agent,
            expected_output="Performance tuning recommendations"
        )

        # Task 4: Security review
        security_task = Task(
            description=f"""
            Review security configuration and recommend improvements.

            Current Security Settings:
            - SSL Enabled: {config.connection_details.ssl_enabled}
            - Secret Management: {config.connection_details.password_secret.type.value if config.connection_details.password_secret else 'none'}
            - Domain: {config.domain}

            Recommend:
            1. Secret management best practices
            2. SSL/TLS configuration
            3. Network security (IP whitelisting, VPN)
            4. Access control considerations

            Prioritize practical security improvements over perfect security.
            """,
            agent=self.security_agent,
            expected_output="Security recommendations prioritized by risk"
        )

        # Create crew
        crew = Crew(
            agents=[
                self.source_config_agent,
                self.performance_agent,
                self.cost_optimization_agent,
                self.security_agent
            ],
            tasks=[config_task, perf_task, cost_task, security_task],
            verbose=True
        )

        try:
            result = crew.kickoff()
            return self._parse_crew_recommendations(result, config)
        except Exception as e:
            logger.error(f"Source intelligence crew failed: {e}")
            return self._fallback_recommendations(config)

    async def estimate_cost(self, config: ConnectionConfig) -> CostEstimate:
        """
        Estimate monthly cost using CrewAI cost optimization agent
        """
        try:
            estimate = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self._run_cost_estimation_crew,
                config
            )
            return estimate
        except Exception as e:
            logger.error(f"Error estimating cost: {e}")
            return self._fallback_cost_estimate(config)

    def _run_cost_estimation_crew(self, config: ConnectionConfig) -> CostEstimate:
        """Execute cost estimation crew"""

        cost_task = Task(
            description=f"""
            Provide detailed monthly cost estimate for this source configuration.

            Connection Mode: {config.connection_mode.value}
            Type: {config.type}

            Configuration:
            {self._extract_mode_config(config)}

            Calculate costs for:
            - Infrastructure (Kafka brokers, Debezium, NiFi, etc.)
            - Storage (Iceberg tables, Kafka retention)
            - Compute (query execution, stream processing)
            - Network transfer

            Provide comparison with other connection modes.
            Return realistic USD estimates based on typical cloud pricing.
            """,
            agent=self.cost_optimization_agent,
            expected_output="Detailed cost breakdown in JSON format"
        )

        crew = Crew(
            agents=[self.cost_optimization_agent],
            tasks=[cost_task],
            verbose=True
        )

        try:
            result = crew.kickoff()
            return self._parse_cost_estimate(result, config)
        except Exception as e:
            logger.error(f"Cost estimation crew failed: {e}")
            return self._fallback_cost_estimate(config)

    # Helper methods

    def _extract_mode_config(self, config: ConnectionConfig) -> str:
        """Extract mode-specific configuration for agent context"""
        if config.connection_mode == ConnectionMode.FEDERATED and config.federated_config:
            return f"""
            Federated Configuration:
            - Trino Catalog: {config.federated_config.trino_catalog_name}
            - Connection Pool Size: {config.federated_config.connection_pool_size}
            - Pool Min/Max: {config.federated_config.connection_pool_min_size}/{config.federated_config.connection_pool_max_size}
            - Query Timeout: {config.federated_config.query_timeout_seconds}s
            """
        elif config.connection_mode == ConnectionMode.CDC and config.cdc_config:
            return f"""
            CDC Configuration:
            - Debezium Connector: {config.cdc_config.debezium_connector_name}
            - Kafka Topic Prefix: {config.cdc_config.kafka_topic_prefix}
            - Kafka Partitions: {config.cdc_config.kafka_partitions}
            - Replication Factor: {config.cdc_config.kafka_replication_factor}
            - Snapshot Mode: {config.cdc_config.snapshot_mode}
            - Iceberg Catalog: {config.cdc_config.iceberg_catalog}
            - File Format: {config.cdc_config.iceberg_file_format}
            - Compression: {config.cdc_config.iceberg_compression}
            """
        elif config.connection_mode == ConnectionMode.BATCH and config.batch_config:
            return f"""
            Batch Configuration:
            - Schedule: {config.batch_config.schedule_cron_expression}
            - Batch Size: {config.batch_config.batch_size}
            - Iceberg Catalog: {config.batch_config.iceberg_catalog}
            - Write Mode: {config.batch_config.write_mode}
            """
        elif config.connection_mode == ConnectionMode.STREAMING and config.streaming_config:
            return f"""
            Streaming Configuration:
            - Kafka Topic: {config.streaming_config.kafka_topic_name}
            - Consumer Group: {config.streaming_config.kafka_consumer_group}
            - Offset Reset: {config.streaming_config.kafka_offset_reset}
            - Iceberg Catalog: {config.streaming_config.iceberg_catalog}
            """
        return "No mode-specific configuration"

    def _extract_perf_config(self, config: ConnectionConfig) -> str:
        """Extract performance-relevant configuration"""
        if config.connection_mode == ConnectionMode.FEDERATED and config.federated_config:
            return f"""
            Connection Pool: {config.federated_config.connection_pool_size}
            Timeouts: connection={config.federated_config.connection_timeout_ms}ms, query={config.federated_config.query_timeout_seconds}s
            """
        elif config.connection_mode == ConnectionMode.CDC and config.cdc_config:
            return f"""
            Kafka Partitions: {config.cdc_config.kafka_partitions}
            File Format: {config.cdc_config.iceberg_file_format}
            Compression: {config.cdc_config.iceberg_compression}
            """
        return "Standard configuration"

    def _parse_crew_recommendations(
        self,
        crew_result: str,
        config: ConnectionConfig
    ) -> List[MCPRecommendation]:
        """Parse crew output into structured recommendations"""
        # In production, this would parse actual LLM output
        # For now, use intelligent fallback
        return self._fallback_recommendations(config)

    def _parse_cost_estimate(
        self,
        crew_result: str,
        config: ConnectionConfig
    ) -> CostEstimate:
        """Parse cost estimate from crew output"""
        # In production, parse actual LLM output
        return self._fallback_cost_estimate(config)

    def _fallback_recommendations(
        self,
        config: ConnectionConfig
    ) -> List[MCPRecommendation]:
        """Intelligent fallback recommendations based on configuration"""
        recommendations = []

        # Connection mode recommendation
        if config.connection_mode == ConnectionMode.FEDERATED:
            recommendations.append(MCPRecommendation(
                type="connection_mode",
                recommendation="Federated mode is optimal for infrequent ad-hoc queries",
                reasoning="No data replication overhead, query-time federation suitable for low-frequency use cases",
                confidence=0.85,
                details={"latency": "50-200ms", "cost": "minimal"}
            ))
        elif config.connection_mode == ConnectionMode.CDC:
            recommendations.append(MCPRecommendation(
                type="connection_mode",
                recommendation="CDC provides real-time data synchronization for high-frequency queries",
                reasoning="Near-real-time replication with sub-second lag, optimal for operational analytics",
                confidence=0.90,
                details={"lag": "100-500ms", "cost": "medium-high"}
            ))

        # Performance recommendations
        if config.connection_mode == ConnectionMode.FEDERATED and config.federated_config:
            pool_size = config.federated_config.connection_pool_size
            if pool_size < 5:
                recommendations.append(MCPRecommendation(
                    type="performance_tuning",
                    recommendation=f"Increase connection pool size from {pool_size} to 10-15",
                    reasoning="Current pool size may limit concurrent query capacity",
                    confidence=0.80,
                    details={"current": pool_size, "recommended": 10}
                ))

        elif config.connection_mode == ConnectionMode.CDC and config.cdc_config:
            partitions = config.cdc_config.kafka_partitions
            if partitions < 6:
                recommendations.append(MCPRecommendation(
                    type="performance_tuning",
                    recommendation=f"Increase Kafka partitions from {partitions} to 12",
                    reasoning="More partitions enable better parallelism and throughput",
                    confidence=0.75,
                    details={"current": partitions, "recommended": 12}
                ))

        # Security recommendations
        if not config.connection_details.ssl_enabled:
            recommendations.append(MCPRecommendation(
                type="security",
                recommendation="Enable SSL for production deployments",
                reasoning="SSL encryption protects data in transit and is required for compliance",
                confidence=0.95,
                details={"risk": "high", "effort": "low"}
            ))

        if config.connection_details.password_secret and config.connection_details.password_secret.type.value == "plaintext":
            recommendations.append(MCPRecommendation(
                type="security",
                recommendation="Use secure secret management (Vault, AWS Secrets Manager, K8s Secrets)",
                reasoning="Plaintext passwords pose significant security risk",
                confidence=0.95,
                details={"risk": "critical", "effort": "medium"}
            ))

        return recommendations

    def _fallback_cost_estimate(self, config: ConnectionConfig) -> CostEstimate:
        """Intelligent cost estimation based on connection mode"""

        if config.connection_mode == ConnectionMode.FEDERATED:
            return CostEstimate(
                storage_gb=0,
                storage_cost_monthly=0,
                compute_cost_monthly=75,
                total_cost_monthly=75,
                breakdown={
                    "query_execution": "$50/month",
                    "network_transfer": "$25/month"
                },
                comparison={
                    "cdc_mode": "$1000/month (13x more expensive)",
                    "batch_mode": "$300/month (4x more expensive)"
                }
            )
        elif config.connection_mode == ConnectionMode.CDC:
            return CostEstimate(
                storage_gb=500,
                storage_cost_monthly=25,
                compute_cost_monthly=975,
                total_cost_monthly=1000,
                breakdown={
                    "kafka_cluster": "$400/month (3 brokers)",
                    "debezium": "$200/month",
                    "iceberg_storage": "$25/month (500GB @ $0.05/GB)",
                    "compute_resources": "$375/month"
                },
                comparison={
                    "federated_mode": "$75/month (13x cheaper)",
                    "batch_mode": "$300/month (3x cheaper)"
                }
            )
        elif config.connection_mode == ConnectionMode.BATCH:
            return CostEstimate(
                storage_gb=400,
                storage_cost_monthly=20,
                compute_cost_monthly=280,
                total_cost_monthly=300,
                breakdown={
                    "nifi_cluster": "$150/month",
                    "iceberg_storage": "$20/month (400GB)",
                    "scheduled_compute": "$130/month"
                },
                comparison={
                    "federated_mode": "$75/month (4x cheaper)",
                    "cdc_mode": "$1000/month (3x more expensive)"
                }
            )
        else:  # STREAMING
            return CostEstimate(
                storage_gb=300,
                storage_cost_monthly=15,
                compute_cost_monthly=485,
                total_cost_monthly=500,
                breakdown={
                    "kafka_consumers": "$200/month",
                    "iceberg_storage": "$15/month (300GB)",
                    "stream_processing": "$285/month"
                },
                comparison={
                    "federated_mode": "$75/month (7x cheaper)",
                    "cdc_mode": "$1000/month (2x more expensive)"
                }
            )
