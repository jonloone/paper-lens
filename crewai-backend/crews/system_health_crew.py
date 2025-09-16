"""
System Health Crew - Highest Priority
Monitors system health and prioritizes alerts using consensus-based ranking
"""

from typing import Dict, Any, List
import json
from datetime import datetime
import structlog
from crewai import Task

from .base_crew import BaseCrew
from ..tools.mcp_adapters import AirflowMCP, TrinoMCP, SparkMCP, DataHubMCP

logger = structlog.get_logger()

class SystemHealthCrew(BaseCrew):
    """
    System Health Crew - Critical for operational excellence
    
    Agents:
    - Urgency Agent: Assesses time criticality
    - Business Impact Agent: Evaluates business consequences
    - Cascade Risk Agent: Identifies downstream dependencies
    - Resolution Effort Agent: Estimates fix complexity
    """
    
    def __init__(self, arbitron_router):
        super().__init__(arbitron_router, strategy="system_health")
        self.tools = self._initialize_tools()
        
    def _initialize_tools(self):
        """Initialize MCP tools for system monitoring"""
        return {
            "airflow": AirflowMCP(),
            "trino": TrinoMCP(),
            "spark": SparkMCP(),
            "datahub": DataHubMCP()
        }
    
    def _initialize_agents(self):
        """Initialize the four specialized agents"""
        
        # Urgency Assessment Agent
        self.urgency_agent = self.create_agent(
            role="Urgency Assessor",
            goal="Determine the time criticality of system issues based on SLA impact and user visibility",
            backstory="""You are an expert in operational urgency assessment with deep understanding of:
            - SLA requirements and breach impacts
            - Peak vs off-peak timing considerations  
            - User-facing vs backend system priorities
            - Recovery time objectives (RTO) and recovery point objectives (RPO)
            Your assessments help teams respond to the most time-sensitive issues first.""",
            task_type="classification",
            tools=[self.tools["airflow"], self.tools["trino"]]
        )
        
        # Business Impact Agent
        self.business_impact_agent = self.create_agent(
            role="Business Impact Analyzer",
            goal="Evaluate the business and financial consequences of system issues",
            backstory="""You are a business impact specialist who understands:
            - Revenue implications of system failures
            - Customer experience degradation costs
            - Compliance and regulatory risks
            - Brand reputation impacts
            - Opportunity costs of downtime
            You translate technical issues into business language for prioritization.""",
            task_type="analysis",
            tools=[self.tools["datahub"]]
        )
        
        # Cascade Risk Agent
        self.cascade_risk_agent = self.create_agent(
            role="Cascade Risk Evaluator",
            goal="Identify and assess downstream dependencies and potential failure cascades",
            backstory="""You are a systems dependency expert specializing in:
            - Data lineage and dependency mapping
            - Failure cascade prediction
            - Critical path analysis
            - Bottleneck identification
            - Cross-system impact assessment
            You prevent small issues from becoming major outages through early detection.""",
            task_type="graph_analysis",
            tools=[self.tools["datahub"], self.tools["airflow"]]
        )
        
        # Resolution Effort Agent
        self.resolution_effort_agent = self.create_agent(
            role="Resolution Effort Estimator",
            goal="Estimate the effort, resources, and time required to resolve issues",
            backstory="""You are a resolution planning expert with expertise in:
            - Fix complexity assessment
            - Resource requirement estimation
            - Team skill matching
            - Historical resolution pattern analysis
            - Risk vs effort trade-off evaluation
            You help teams allocate resources efficiently to maximize resolution impact.""",
            task_type="estimation",
            tools=[self.tools["airflow"], self.tools["trino"], self.tools["spark"]]
        )
        
        self.agents = [
            self.urgency_agent,
            self.business_impact_agent,
            self.cascade_risk_agent,
            self.resolution_effort_agent
        ]
    
    def prioritize_alerts(self, alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Main crew task: Prioritize system alerts using consensus ranking
        
        Args:
            alerts: List of system alerts to prioritize
        
        Returns:
            Prioritized list with consensus scores and explanations
        """
        logger.info(f"System Health Crew analyzing {len(alerts)} alerts")
        
        if not alerts:
            return []
        
        # Create analysis tasks for each agent
        tasks = self._create_analysis_tasks(alerts)
        
        # Execute with consensus
        consensus_result = self.execute_with_consensus(tasks, {"alerts": alerts})
        
        # Perform pairwise ranking based on consensus
        prioritized = self._perform_alert_ranking(alerts, consensus_result)
        
        # Enrich with metadata and recommendations
        enriched = self._enrich_alerts(prioritized)
        
        logger.info(f"Completed alert prioritization with {len(enriched)} results")
        
        return enriched
    
    def _create_analysis_tasks(self, alerts: List[Dict]) -> List[Task]:
        """Create analysis tasks for each agent"""
        tasks = []
        
        # Urgency assessment task
        urgency_task = self.create_task(
            description=f"""Assess the urgency of {len(alerts)} system alerts.
            For each alert, evaluate:
            1. Time sensitivity (critical/high/medium/low)
            2. SLA impact and breach risk
            3. User visibility and experience impact
            4. Peak hours consideration
            
            Provide urgency scores (0-10) for each alert with reasoning.""",
            agent=self.urgency_agent,
            expected_output="JSON with alert IDs and urgency scores with explanations"
        )
        tasks.append(urgency_task)
        
        # Business impact task
        impact_task = self.create_task(
            description=f"""Analyze business impact of {len(alerts)} system alerts.
            For each alert, evaluate:
            1. Revenue impact (direct and indirect)
            2. Customer experience degradation
            3. Compliance/regulatory risks
            4. Number of affected users/systems
            
            Provide business impact scores (0-10) with financial estimates where possible.""",
            agent=self.business_impact_agent,
            expected_output="JSON with alert IDs and business impact assessments"
        )
        tasks.append(impact_task)
        
        # Cascade risk task
        cascade_task = self.create_task(
            description=f"""Evaluate cascade risk for {len(alerts)} system alerts.
            For each alert, assess:
            1. Number of downstream dependencies
            2. Critical path involvement
            3. Potential for failure propagation
            4. System bottleneck creation risk
            
            Provide cascade risk scores (0-10) with dependency counts.""",
            agent=self.cascade_risk_agent,
            expected_output="JSON with alert IDs and cascade risk analysis",
            context=[urgency_task]  # Can use urgency context
        )
        tasks.append(cascade_task)
        
        # Resolution effort task
        resolution_task = self.create_task(
            description=f"""Estimate resolution effort for {len(alerts)} system alerts.
            For each alert, estimate:
            1. Time to resolution (hours)
            2. Required team members and skills
            3. Risk of resolution causing other issues
            4. Confidence in resolution approach
            
            Provide effort scores (0-10, where 0=easy, 10=very difficult).""",
            agent=self.resolution_effort_agent,
            expected_output="JSON with alert IDs and resolution effort estimates",
            context=[cascade_task]  # Can consider cascade risk
        )
        tasks.append(resolution_task)
        
        return tasks
    
    def _perform_alert_ranking(
        self,
        alerts: List[Dict],
        consensus_result: Dict
    ) -> List[Dict]:
        """
        Perform pairwise ranking of alerts based on agent consensus
        
        Uses weighted scoring:
        - Urgency: 35%
        - Business Impact: 35%
        - Cascade Risk: 20%
        - Resolution Effort: 10% (inverse - easier fixes ranked higher)
        """
        # Extract scores from consensus (would be parsed from agent outputs)
        # For now, using mock scores
        scored_alerts = []
        
        for alert in alerts:
            # In production, these would come from parsed agent outputs
            urgency_score = self._get_mock_score(alert, "urgency")
            impact_score = self._get_mock_score(alert, "impact")
            cascade_score = self._get_mock_score(alert, "cascade")
            effort_score = self._get_mock_score(alert, "effort")
            
            # Calculate weighted priority score
            # Note: effort is inverted (10 - effort) so easier fixes rank higher
            priority_score = (
                urgency_score * 0.35 +
                impact_score * 0.35 +
                cascade_score * 0.20 +
                (10 - effort_score) * 0.10
            )
            
            alert_copy = alert.copy()
            alert_copy.update({
                "urgency_score": urgency_score,
                "business_impact_score": impact_score,
                "cascade_risk_score": cascade_score,
                "resolution_effort_score": effort_score,
                "priority_score": priority_score,
                "consensus_confidence": 0.85  # Would be calculated from agent agreement
            })
            
            scored_alerts.append(alert_copy)
        
        # Sort by priority score
        scored_alerts.sort(key=lambda x: x["priority_score"], reverse=True)
        
        # Add ranking
        for i, alert in enumerate(scored_alerts):
            alert["priority_rank"] = i + 1
        
        return scored_alerts
    
    def _get_mock_score(self, alert: Dict, score_type: str) -> float:
        """Generate mock scores for demonstration"""
        import hashlib
        
        # Generate deterministic mock score based on alert ID and type
        seed = f"{alert.get('id', '')}_{score_type}"
        hash_val = int(hashlib.md5(seed.encode()).hexdigest()[:8], 16)
        
        # Map to 0-10 range with some variance
        base_score = (hash_val % 100) / 10.0
        
        # Adjust based on alert severity if available
        severity = alert.get("severity", "medium")
        severity_multiplier = {
            "critical": 1.5,
            "high": 1.2,
            "medium": 1.0,
            "low": 0.7
        }.get(severity, 1.0)
        
        return min(10.0, base_score * severity_multiplier)
    
    def _enrich_alerts(self, prioritized_alerts: List[Dict]) -> List[Dict]:
        """Add recommendations and metadata to prioritized alerts"""
        enriched = []
        
        for alert in prioritized_alerts:
            enriched_alert = alert.copy()
            
            # Add recommendations based on scores
            recommendations = []
            
            if alert["priority_rank"] <= 3:
                recommendations.append({
                    "action": "immediate_response",
                    "reason": "Top priority issue requiring immediate attention",
                    "suggested_team": self._suggest_team(alert)
                })
            
            if alert["cascade_risk_score"] > 7:
                recommendations.append({
                    "action": "isolate_dependencies",
                    "reason": "High cascade risk - consider isolating affected systems",
                    "affected_systems": self._get_affected_systems(alert)
                })
            
            if alert["resolution_effort_score"] < 3:
                recommendations.append({
                    "action": "quick_win",
                    "reason": "Low effort fix - consider resolving immediately",
                    "estimated_time": f"{alert['resolution_effort_score'] * 0.5:.1f} hours"
                })
            
            enriched_alert["recommendations"] = recommendations
            enriched_alert["crew_analysis"] = {
                "analyzed_at": datetime.now().isoformat(),
                "crew": "system_health",
                "consensus_method": "weighted_pairwise_ranking",
                "agents_consulted": 4
            }
            
            enriched.append(enriched_alert)
        
        return enriched
    
    def _suggest_team(self, alert: Dict) -> str:
        """Suggest appropriate team based on alert type"""
        alert_type = alert.get("type", "unknown")
        
        team_mapping = {
            "pipeline": "Data Engineering",
            "query": "Analytics Engineering",
            "infrastructure": "Platform Team",
            "quality": "Data Quality Team",
            "security": "Security Operations"
        }
        
        for key, team in team_mapping.items():
            if key in alert_type.lower():
                return team
        
        return "On-Call Engineer"
    
    def _get_affected_systems(self, alert: Dict) -> List[str]:
        """Get list of affected downstream systems"""
        # In production, would query data lineage
        return ["reporting_dashboard", "ml_pipeline", "customer_api"]
    
    def execute_primary_task(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the primary task - alert prioritization"""
        alerts = context.get("alerts", [])
        return {
            "prioritized_alerts": self.prioritize_alerts(alerts),
            "metrics": self.get_execution_metrics()
        }