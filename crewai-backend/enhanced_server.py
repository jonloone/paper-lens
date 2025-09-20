#!/usr/bin/env python3
"""
Enhanced CrewAI Backend with Realistic Consensus Simulation
Demonstrates how agents deliberate and build consensus with Arbitron routing
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import random
import hashlib
import time

# Import Query Optimization Crew
try:
    from crews.query_optimization_crew import QueryOptimizationCrew
except ImportError:
    QueryOptimizationCrew = None

# Import ReAct SQL Crew
try:
    from crews.react_sql_crew import ReActSQLCrew, ReActQueryOptimizer
except ImportError:
    ReActSQLCrew = None
    ReActQueryOptimizer = None

# Create FastAPI app
app = FastAPI(
    title="NexusOne Enhanced CrewAI Backend",
    description="Realistic simulation of CrewAI consensus and Arbitron routing",
    version="2.0.0-enhanced"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AlertRequest(BaseModel):
    alerts: List[Dict[str, Any]]
    context: Optional[Dict[str, Any]] = None
    simulate_options: Optional[Dict[str, Any]] = None

class AgentDeliberation(BaseModel):
    agent_name: str
    role: str
    analysis: str
    scores: Dict[str, float]
    confidence: float
    reasoning: List[str]
    tools_used: List[str]
    model_used: str
    latency_ms: int

class ConsensusResult(BaseModel):
    alert_id: str
    individual_deliberations: List[AgentDeliberation]
    consensus_scores: Dict[str, float]
    final_priority: float
    confidence_level: float
    disagreement_areas: List[str]
    resolution_method: str

class ArbitronDecision(BaseModel):
    selected_model: str
    routing_strategy: str
    decision_factors: List[str]
    cost_estimate: float
    latency_estimate: int
    cache_hit: bool
    fallback_activated: bool
    budget_remaining: float

# Simulate Arbitron routing decisions
class EnhancedArbitronRouter:
    """Enhanced Arbitron router with detailed decision tracking"""
    
    def __init__(self):
        self.daily_spend = 0
        self.daily_budget = 10.0
        self.cache_store = {}
        self.model_configs = {
            "mistral-nemo": {
                "cost_per_1k": 0.0002,
                "avg_latency": 250,
                "accuracy": 0.82,
                "context_window": 8192
            },
            "mixtral-8x7b": {
                "cost_per_1k": 0.0006,
                "avg_latency": 450,
                "accuracy": 0.88,
                "context_window": 32768
            },
            "llama3-70b": {
                "cost_per_1k": 0.0015,
                "avg_latency": 750,
                "accuracy": 0.92,
                "context_window": 8192
            },
            "llama3-405b": {
                "cost_per_1k": 0.0050,
                "avg_latency": 1200,
                "accuracy": 0.96,
                "context_window": 128000
            }
        }
    
    def select_model(self, agent_role: str, task_context: Dict) -> ArbitronDecision:
        """Select optimal model based on agent role and context"""
        decision_factors = []
        cache_key = f"{agent_role}:{json.dumps(task_context, sort_keys=True)}"
        
        # Check cache first
        if cache_key in self.cache_store:
            decision_factors.append("Cache hit - returning stored result")
            return ArbitronDecision(
                selected_model="cached",
                routing_strategy="cache_first",
                decision_factors=decision_factors,
                cost_estimate=0,
                latency_estimate=5,
                cache_hit=True,
                fallback_activated=False,
                budget_remaining=self.daily_budget - self.daily_spend
            )
        
        # Check budget constraints
        if self.daily_spend >= self.daily_budget * 0.8:
            decision_factors.append(f"Budget constraint: ${self.daily_spend:.2f} of ${self.daily_budget:.2f} spent")
            selected_model = "mistral-nemo"
            routing_strategy = "cost_optimized"
        
        # Check urgency
        elif task_context.get("severity") == "critical":
            decision_factors.append("Critical severity - prioritizing speed")
            selected_model = "mixtral-8x7b"  # Balance of speed and quality
            routing_strategy = "speed_optimized"
        
        # Check accuracy requirements
        elif agent_role in ["Business Impact Analyzer", "Cascade Risk Evaluator"]:
            decision_factors.append(f"High accuracy required for {agent_role}")
            selected_model = "llama3-70b"
            routing_strategy = "accuracy_optimized"
        
        # Default balanced approach
        else:
            decision_factors.append("Standard request - using balanced model")
            selected_model = "mixtral-8x7b"
            routing_strategy = "balanced"
        
        # Simulate occasional fallback
        fallback_activated = False
        if random.random() < 0.1:  # 10% chance of primary model unavailable
            decision_factors.append(f"{selected_model} unavailable - activating fallback")
            fallback_activated = True
            selected_model = "mistral-nemo"  # Fallback to cheapest
        
        # Calculate costs
        model_config = self.model_configs[selected_model]
        cost_estimate = model_config["cost_per_1k"] * 2  # Assume 2k tokens
        self.daily_spend += cost_estimate
        
        # Store in cache for future
        self.cache_store[cache_key] = True
        
        return ArbitronDecision(
            selected_model=selected_model,
            routing_strategy=routing_strategy,
            decision_factors=decision_factors,
            cost_estimate=cost_estimate,
            latency_estimate=model_config["avg_latency"],
            cache_hit=False,
            fallback_activated=fallback_activated,
            budget_remaining=self.daily_budget - self.daily_spend
        )

# Enhanced System Health Crew with detailed deliberation
class EnhancedSystemHealthCrew:
    """Enhanced crew showing detailed agent deliberation process"""
    
    def __init__(self, arbitron: EnhancedArbitronRouter):
        self.arbitron = arbitron
        self.agents = [
            {
                "name": "urgency_agent",
                "role": "Urgency Assessor",
                "tools": ["airflow", "trino"],
                "focus": ["sla_impact", "user_visibility", "time_criticality"]
            },
            {
                "name": "impact_agent",
                "role": "Business Impact Analyzer",
                "tools": ["datahub"],
                "focus": ["revenue_impact", "customer_experience", "compliance_risk"]
            },
            {
                "name": "cascade_agent",
                "role": "Cascade Risk Evaluator",
                "tools": ["datahub", "airflow"],
                "focus": ["downstream_dependencies", "failure_propagation", "bottlenecks"]
            },
            {
                "name": "effort_agent",
                "role": "Resolution Effort Estimator",
                "tools": ["airflow", "trino", "spark"],
                "focus": ["fix_complexity", "resource_requirements", "historical_patterns"]
            }
        ]
    
    def deliberate_on_alert(self, alert: Dict) -> ConsensusResult:
        """Simulate detailed agent deliberation process"""
        deliberations = []
        
        # Each agent analyzes the alert independently
        for agent in self.agents:
            # Get Arbitron routing decision for this agent
            arbitron_decision = self.arbitron.select_model(
                agent["role"],
                {"severity": alert.get("severity", "medium")}
            )
            
            # Simulate agent analysis
            deliberation = self._simulate_agent_analysis(
                agent, 
                alert, 
                arbitron_decision.selected_model
            )
            deliberations.append(deliberation)
        
        # Build consensus from individual analyses
        consensus = self._build_consensus(deliberations, alert["id"])
        
        return consensus
    
    def _simulate_agent_analysis(self, agent: Dict, alert: Dict, model: str) -> AgentDeliberation:
        """Simulate individual agent analysis"""
        # Generate deterministic but varied scores
        alert_hash = hashlib.md5(f"{agent['name']}:{alert['id']}".encode()).hexdigest()
        base_variance = int(alert_hash[:2], 16) / 255.0
        
        # Base score from severity
        severity_scores = {
            "critical": 9.0,
            "high": 7.0,
            "medium": 5.0,
            "low": 3.0
        }
        base_score = severity_scores.get(alert.get("severity", "medium"), 5.0)
        
        # Agent-specific analysis
        if agent["name"] == "urgency_agent":
            urgency_score = base_score + base_variance
            analysis = f"Analyzing time criticality of {alert['type']}. "
            if alert.get("severity") == "critical":
                analysis += "CRITICAL: Immediate action required. SLA breach imminent."
                reasoning = [
                    "SLA deadline in < 5 minutes",
                    "Customer-facing service affected",
                    "Peak hours multiplier active"
                ]
            else:
                analysis += "Non-critical timeline, standard response acceptable."
                reasoning = [
                    "SLA buffer > 2 hours",
                    "Internal system only",
                    "Off-peak hours"
                ]
            
            scores = {
                "urgency": round(urgency_score, 2),
                "time_sensitivity": round(urgency_score * 0.9, 2),
                "sla_risk": round(urgency_score * 0.8, 2)
            }
            
        elif agent["name"] == "impact_agent":
            impact_score = base_score + base_variance * 0.8
            analysis = f"Evaluating business impact of {alert['message']}. "
            if alert.get("severity") in ["critical", "high"]:
                analysis += "HIGH IMPACT: Significant revenue and customer experience risk."
                reasoning = [
                    f"Estimated revenue impact: ${random.randint(10000, 100000)}/hour",
                    f"Affected customers: {random.randint(1000, 50000)}",
                    "Potential compliance violation risk"
                ]
            else:
                analysis += "Moderate impact, primarily internal operations."
                reasoning = [
                    "No direct revenue impact",
                    "Internal users only",
                    "No compliance concerns"
                ]
            
            scores = {
                "business_impact": round(impact_score, 2),
                "revenue_risk": round(impact_score * 0.85, 2),
                "customer_impact": round(impact_score * 0.75, 2)
            }
            
        elif agent["name"] == "cascade_agent":
            cascade_score = (base_score - 1) + base_variance * 0.6
            analysis = f"Assessing cascade risk for {alert['source']} failure. "
            
            # Simulate dependency analysis
            downstream_count = random.randint(1, 20)
            if downstream_count > 10:
                analysis += f"HIGH CASCADE RISK: {downstream_count} downstream systems affected."
                reasoning = [
                    f"{downstream_count} dependent pipelines identified",
                    "Critical path component",
                    "No redundancy available"
                ]
            else:
                analysis += f"Limited cascade risk: {downstream_count} systems affected."
                reasoning = [
                    f"Only {downstream_count} downstream dependencies",
                    "Non-critical path",
                    "Redundancy available"
                ]
            
            scores = {
                "cascade_risk": round(cascade_score, 2),
                "dependency_count": downstream_count,
                "propagation_risk": round(cascade_score * 0.7, 2)
            }
            
        else:  # effort_agent
            effort_score = 10 - base_score + base_variance
            analysis = f"Estimating resolution effort for {alert['type']}. "
            
            estimated_hours = random.uniform(0.5, 8)
            if estimated_hours < 2:
                analysis += f"Quick fix possible: ~{estimated_hours:.1f} hours."
                reasoning = [
                    "Known issue with documented fix",
                    "Single team required",
                    f"Estimated time: {estimated_hours:.1f} hours"
                ]
            else:
                analysis += f"Complex resolution required: ~{estimated_hours:.1f} hours."
                reasoning = [
                    "Novel issue requiring investigation",
                    "Cross-team coordination needed",
                    f"Estimated time: {estimated_hours:.1f} hours"
                ]
            
            scores = {
                "resolution_effort": round(effort_score, 2),
                "time_to_fix": round(estimated_hours, 1),
                "complexity": round(effort_score * 0.9, 2)
            }
        
        # Simulate confidence based on model quality
        model_accuracy = {
            "cached": 1.0,
            "mistral-nemo": 0.82,
            "mixtral-8x7b": 0.88,
            "llama3-70b": 0.92,
            "llama3-405b": 0.96
        }
        confidence = model_accuracy.get(model, 0.85) * (0.9 + base_variance * 0.1)
        
        return AgentDeliberation(
            agent_name=agent["name"],
            role=agent["role"],
            analysis=analysis,
            scores=scores,
            confidence=round(confidence, 2),
            reasoning=reasoning,
            tools_used=agent["tools"],
            model_used=model if model != "cached" else "mixtral-8x7b (cached)",
            latency_ms=random.randint(100, 500) if model != "cached" else 5
        )
    
    def _build_consensus(self, deliberations: List[AgentDeliberation], alert_id: str) -> ConsensusResult:
        """Build consensus from individual agent deliberations"""
        
        # Extract scores from each agent
        urgency_scores = []
        impact_scores = []
        cascade_scores = []
        effort_scores = []
        
        for d in deliberations:
            if d.agent_name == "urgency_agent":
                urgency_scores.append(d.scores.get("urgency", 5))
            elif d.agent_name == "impact_agent":
                impact_scores.append(d.scores.get("business_impact", 5))
            elif d.agent_name == "cascade_agent":
                cascade_scores.append(d.scores.get("cascade_risk", 5))
            else:
                effort_scores.append(d.scores.get("resolution_effort", 5))
        
        # Calculate weighted consensus scores
        consensus_scores = {
            "urgency": round(sum(urgency_scores) / len(urgency_scores) if urgency_scores else 5, 2),
            "business_impact": round(sum(impact_scores) / len(impact_scores) if impact_scores else 5, 2),
            "cascade_risk": round(sum(cascade_scores) / len(cascade_scores) if cascade_scores else 5, 2),
            "resolution_effort": round(sum(effort_scores) / len(effort_scores) if effort_scores else 5, 2)
        }
        
        # Calculate final priority using weighted formula
        final_priority = (
            consensus_scores["urgency"] * 0.35 +
            consensus_scores["business_impact"] * 0.35 +
            consensus_scores["cascade_risk"] * 0.20 +
            (10 - consensus_scores["resolution_effort"]) * 0.10
        )
        
        # Calculate confidence level (average of agent confidences)
        avg_confidence = sum(d.confidence for d in deliberations) / len(deliberations)
        
        # Identify disagreement areas
        disagreement_areas = []
        for d in deliberations:
            for score_name, score_value in d.scores.items():
                # Check if this score deviates significantly from consensus
                if abs(score_value - consensus_scores.get(score_name.split('_')[0], score_value)) > 2:
                    disagreement_areas.append(f"{d.role} disagrees on {score_name}")
        
        # Determine resolution method
        if len(disagreement_areas) > 2:
            resolution_method = "weighted_voting_with_outlier_adjustment"
        elif avg_confidence < 0.7:
            resolution_method = "low_confidence_conservative_scoring"
        else:
            resolution_method = "standard_weighted_consensus"
        
        return ConsensusResult(
            alert_id=alert_id,
            individual_deliberations=deliberations,
            consensus_scores=consensus_scores,
            final_priority=round(final_priority, 2),
            confidence_level=round(avg_confidence, 2),
            disagreement_areas=disagreement_areas[:3],  # Top 3 disagreements
            resolution_method=resolution_method
        )

# Initialize components
arbitron = EnhancedArbitronRouter()
crew = EnhancedSystemHealthCrew(arbitron)

# Initialize Query Optimization Crew if available
if QueryOptimizationCrew:
    query_crew = QueryOptimizationCrew(arbitron)
else:
    query_crew = None

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "NexusOne Enhanced CrewAI Backend",
        "status": "running",
        "version": "2.0.0-enhanced",
        "features": [
            "Detailed agent deliberation",
            "Consensus visualization",
            "Arbitron routing decisions",
            "Cost/performance tracking"
        ],
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "crews_available": ["system_health_enhanced"],
        "arbitron_status": "active",
        "mode": "enhanced_simulation"
    }

@app.post("/api/crews/system-health/deliberate")
async def deliberate_alerts(request: AlertRequest):
    """Show detailed agent deliberation process for each alert"""
    results = []
    arbitron_decisions = []
    total_cost = 0
    total_latency = 0
    
    for alert in request.alerts:
        # Get consensus result with full deliberation
        consensus = crew.deliberate_on_alert(alert)
        results.append(consensus)
        
        # Track Arbitron metrics
        for delib in consensus.individual_deliberations:
            total_latency += delib.latency_ms
    
    # Calculate total cost from Arbitron
    total_cost = arbitron.daily_spend
    
    return {
        "success": True,
        "deliberations": results,
        "arbitron_metrics": {
            "total_cost": round(total_cost, 4),
            "total_latency_ms": total_latency,
            "avg_latency_ms": total_latency // (len(request.alerts) * 4) if request.alerts else 0,
            "cache_hits": len([k for k in arbitron.cache_store]),
            "budget_remaining": round(arbitron.daily_budget - arbitron.daily_spend, 2),
            "models_used": {
                "mistral-nemo": sum(1 for r in results for d in r.individual_deliberations if "mistral-nemo" in d.model_used),
                "mixtral-8x7b": sum(1 for r in results for d in r.individual_deliberations if "mixtral-8x7b" in d.model_used),
                "llama3-70b": sum(1 for r in results for d in r.individual_deliberations if "llama3-70b" in d.model_used),
                "cached": sum(1 for r in results for d in r.individual_deliberations if "cached" in d.model_used)
            }
        },
        "execution_time": random.uniform(0.5, 2.0)
    }

@app.get("/api/arbitron/explain")
async def explain_routing():
    """Explain Arbitron routing logic"""
    return {
        "routing_strategies": [
            {
                "name": "cost_optimized",
                "description": "Minimize cost while meeting basic quality requirements",
                "triggers": ["Budget > 80% consumed", "Low priority tasks"],
                "preferred_models": ["mistral-nemo", "mixtral-8x7b"]
            },
            {
                "name": "speed_optimized",
                "description": "Minimize latency for time-critical requests",
                "triggers": ["Critical alerts", "SLA deadlines", "User-facing issues"],
                "preferred_models": ["mistral-nemo", "mixtral-8x7b"]
            },
            {
                "name": "accuracy_optimized",
                "description": "Maximum accuracy for high-stakes decisions",
                "triggers": ["Business impact analysis", "Cascade risk evaluation"],
                "preferred_models": ["llama3-70b", "llama3-405b"]
            },
            {
                "name": "balanced",
                "description": "Balance cost, speed, and accuracy",
                "triggers": ["Standard requests", "Medium priority"],
                "preferred_models": ["mixtral-8x7b"]
            }
        ],
        "model_characteristics": arbitron.model_configs,
        "cache_strategy": {
            "enabled": True,
            "ttl_seconds": 900,
            "max_size": 1000,
            "hit_rate": f"{len(arbitron.cache_store) / max(1, len(arbitron.cache_store) + 10) * 100:.1f}%"
        },
        "fallback_chain": {
            "llama3-405b": ["llama3-70b", "mixtral-8x7b", "mistral-nemo"],
            "llama3-70b": ["mixtral-8x7b", "mistral-nemo"],
            "mixtral-8x7b": ["mistral-nemo"],
            "mistral-nemo": []
        }
    }

@app.post("/api/arbitron/simulate")
async def simulate_routing(request: Dict[str, Any]):
    """Simulate different routing scenarios"""
    scenario = request.get("scenario", "standard")
    
    # Reset arbitron state for simulation
    test_arbitron = EnhancedArbitronRouter()
    
    if scenario == "budget_exhaustion":
        test_arbitron.daily_spend = 9.5  # Near budget limit
    elif scenario == "high_load":
        # Pre-populate cache
        for i in range(100):
            test_arbitron.cache_store[f"cached_{i}"] = True
    
    # Simulate routing decision
    decision = test_arbitron.select_model(
        request.get("agent_role", "Urgency Assessor"),
        request.get("context", {"severity": "medium"})
    )
    
    return {
        "scenario": scenario,
        "decision": decision,
        "simulation_metrics": {
            "cache_size": len(test_arbitron.cache_store),
            "budget_used_percent": (test_arbitron.daily_spend / test_arbitron.daily_budget) * 100,
            "projected_daily_cost": test_arbitron.daily_spend * 10  # Extrapolate
        }
    }

@app.get("/api/consensus/visualize/{alert_id}")
async def visualize_consensus(alert_id: str):
    """Get visualization data for consensus building"""
    # Generate sample visualization data
    return {
        "alert_id": alert_id,
        "consensus_timeline": [
            {"timestamp": 0, "event": "Alert received", "agents": []},
            {"timestamp": 100, "event": "Urgency Agent analyzing", "agents": ["urgency_agent"]},
            {"timestamp": 200, "event": "Business Impact Agent analyzing", "agents": ["impact_agent"]},
            {"timestamp": 300, "event": "Cascade Risk Agent analyzing", "agents": ["cascade_agent"]},
            {"timestamp": 400, "event": "Resolution Effort Agent analyzing", "agents": ["effort_agent"]},
            {"timestamp": 500, "event": "Building consensus", "agents": ["all"]},
            {"timestamp": 600, "event": "Consensus achieved", "agents": ["all"]}
        ],
        "score_evolution": {
            "urgency": [5, 6, 7, 7.5, 8, 8.2],
            "impact": [5, 5.5, 6, 7, 7.8, 8.1],
            "cascade": [5, 5, 5.5, 6, 6.5, 6.8],
            "effort": [5, 4, 3.5, 3, 2.8, 2.5]
        },
        "confidence_progression": [0.5, 0.6, 0.7, 0.75, 0.82, 0.85]
    }

# Connection Analysis Crew endpoints
@app.post("/api/crews/connection-analysis/analyze")
async def analyze_connection(request: Dict[str, Any]):
    """Analyze a data source connection for feasibility and requirements"""
    
    # Simulate Connection Analysis Crew with 4 agents
    connection_type = request.get("connection_type", "database")
    connection_details = request.get("connection_details", {})
    target_system = request.get("target_system", "data_warehouse")
    
    # Simulate Arbitron routing for each agent
    arbitron = EnhancedArbitronRouter()
    
    agents = [
        {"name": "schema_agent", "role": "Schema Discovery Specialist"},
        {"name": "compatibility_agent", "role": "Integration Compatibility Expert"},
        {"name": "security_agent", "role": "Data Security Auditor"},
        {"name": "performance_agent", "role": "Connection Performance Optimizer"}
    ]
    
    deliberations = []
    arbitron_decisions = []
    
    for agent in agents:
        # Get Arbitron routing decision
        decision = arbitron.select_model(agent["role"], {"connection_type": connection_type})
        arbitron_decisions.append(decision)
        
        # Simulate agent analysis
        if agent["name"] == "schema_agent":
            analysis = {
                "discovered_objects": {
                    "tables": random.randint(10, 50),
                    "views": random.randint(0, 10),
                    "total_columns": random.randint(50, 500),
                    "relationships": random.randint(5, 30)
                },
                "data_volume": f"{random.uniform(0.5, 10):.1f}TB",
                "complexity": random.choice(["low", "moderate", "high"])
            }
        elif agent["name"] == "compatibility_agent":
            analysis = {
                "is_compatible": random.choice([True, True, False]),
                "required_transformations": random.sample([
                    "Date format standardization",
                    "Currency conversion",
                    "Null value handling",
                    "Character encoding",
                    "Schema mapping"
                ], random.randint(1, 3)),
                "version_requirements": {
                    "source": f"{connection_type} v{random.randint(10, 15)}",
                    "target": f"{target_system} v{random.randint(300, 450)}"
                }
            }
        elif agent["name"] == "security_agent":
            analysis = {
                "risk_level": random.choice(["low", "medium", "high"]),
                "required_controls": random.sample([
                    "SSL/TLS encryption",
                    "Role-based access control",
                    "Data encryption at rest",
                    "Audit logging",
                    "IP whitelisting",
                    "MFA authentication"
                ], random.randint(2, 4)),
                "compliance_requirements": random.sample(["GDPR", "SOC2", "HIPAA", "PCI-DSS"], random.randint(1, 2))
            }
        else:  # performance_agent
            analysis = {
                "expected_throughput": f"{random.randint(100, 1000)}MB/s",
                "latency_estimate": f"{random.randint(10, 100)}ms",
                "optimization_opportunities": random.sample([
                    "Connection pooling",
                    "Parallel extraction",
                    "Compression",
                    "Incremental sync",
                    "Query caching",
                    "Batch processing"
                ], random.randint(2, 4))
            }
        
        deliberations.append({
            "agent": agent["name"],
            "role": agent["role"],
            "analysis": analysis,
            "confidence": random.uniform(0.7, 0.95),
            "model_used": decision["selected_model"],
            "latency_ms": decision["latency_estimate"]
        })
    
    # Calculate overall feasibility
    feasibility_score = random.uniform(0.6, 0.95)
    
    return {
        "success": True,
        "connection_analysis": {
            "connection_type": connection_type,
            "feasibility_score": round(feasibility_score, 2),
            "connection_strategy": "direct_connection" if feasibility_score > 0.8 else "connection_with_transformation",
            "agent_deliberations": deliberations,
            "recommendations": [
                {
                    "priority": "high",
                    "category": "security",
                    "action": "Enable SSL/TLS encryption",
                    "impact": "Critical for data security",
                    "effort": "low"
                },
                {
                    "priority": "high",
                    "category": "performance",
                    "action": "Implement connection pooling",
                    "impact": "60% reduction in connection overhead",
                    "effort": "medium"
                },
                {
                    "priority": "medium",
                    "category": "reliability",
                    "action": "Add retry logic",
                    "impact": "Improved reliability",
                    "effort": "low"
                }
            ],
            "consensus_confidence": random.uniform(0.8, 0.95)
        },
        "arbitron_metrics": {
            "routing_decisions": arbitron_decisions,
            "total_cost": sum(d["cost_estimate"] for d in arbitron_decisions),
            "total_latency": sum(d["latency_estimate"] for d in arbitron_decisions),
            "cache_hits": sum(1 for d in arbitron_decisions if d["cache_hit"]),
            "model_distribution": {}  # Would calculate distribution
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/crews/connection-analysis/compare")
async def compare_connections(request: Dict[str, Any]):
    """Compare multiple data source connections"""
    
    sources = request.get("sources", [])
    
    if not sources:
        raise HTTPException(status_code=400, detail="No sources provided")
    
    analyses = []
    for source in sources:
        # Analyze each source
        analysis_result = await analyze_connection(source)
        analyses.append({
            "source_name": source.get("name", "Unknown"),
            "connection_type": source.get("connection_type"),
            "feasibility_score": analysis_result["connection_analysis"]["feasibility_score"],
            "strategy": analysis_result["connection_analysis"]["connection_strategy"],
            "key_issues": []  # Would extract from analysis
        })
    
    # Rank sources
    ranked = sorted(analyses, key=lambda x: x["feasibility_score"], reverse=True)
    for i, analysis in enumerate(ranked):
        analysis["rank"] = i + 1
        analysis["recommendation"] = "primary" if i == 0 else "secondary" if i < 3 else "optional"
    
    return {
        "success": True,
        "comparison_results": {
            "source_count": len(sources),
            "ranked_sources": ranked,
            "recommended_approach": "unified_platform" if len(sources) > 3 else "phased_integration",
            "total_integration_effort": {
                "weeks": len(sources) * 2,
                "team_size": max(2, len(sources) // 3)
            }
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# Query Optimization Crew endpoints
@app.post("/api/crews/query-optimization/optimize")
async def optimize_query(request: Dict[str, Any]):
    """Optimize a SQL query using the Query Optimization Crew"""
    
    if not query_crew:
        # Fallback simulation if crew not available
        return {
            "success": True,
            "optimization_result": {
                "timestamp": datetime.now().isoformat(),
                "request": request,
                "generated_query": {
                    "sql": """SELECT c.customer_segment, SUM(o.amount) as total, COUNT(*) as orders
FROM orders o JOIN customers c ON o.customer_id = c.id
WHERE o.date >= '2024-01-01' GROUP BY c.customer_segment""",
                    "dialect": request.get("dialect", "trino"),
                    "complexity_score": 0.65
                },
                "performance_analysis": {
                    "current_plan": "Hash JOIN with full table scan",
                    "optimized_plan": "Index scan with nested loop join",
                    "expected_improvement": "65% reduction in execution time",
                    "recommendations": [
                        {
                            "type": "index",
                            "description": "Create composite index on (customer_id, order_date)",
                            "impact": "high",
                            "effort": "low"
                        }
                    ]
                },
                "cost_estimation": {
                    "data_scanned_gb": 45.2,
                    "estimated_time_seconds": 12.5,
                    "compute_cost_usd": 0.85,
                    "memory_required_gb": 8,
                    "optimization_potential": {
                        "current_cost": 0.85,
                        "optimized_cost": 0.32,
                        "savings_percentage": 62
                    }
                },
                "validation_status": "passed",
                "consensus_score": 0.89
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Extract query requirements from request
    query_request = {
        "business_goal": request.get("business_goal", "Analyze data"),
        "data_sources": request.get("data_sources", []),
        "filters": request.get("filters", {}),
        "aggregations": request.get("aggregations", []),
        "dialect": request.get("dialect", "trino")
    }
    
    # Use Query Optimization Crew to analyze and optimize
    result = query_crew.optimize_query(query_request)
    
    return {
        "success": True,
        "optimization_result": result,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/crews/query-optimization/validate")
async def validate_query(request: Dict[str, Any]):
    """Validate SQL syntax and identify issues"""
    
    sql = request.get("sql", "")
    dialect = request.get("dialect", "standard")
    
    if not sql:
        raise HTTPException(status_code=400, detail="No SQL provided")
    
    if not query_crew:
        # Fallback simulation
        return {
            "success": True,
            "validation": {
                "valid": True,
                "issues": [],
                "warnings": [
                    "Consider adding index on customer_id for better JOIN performance"
                ],
                "dialect": dialect,
                "validated_at": datetime.now().isoformat()
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Use Query Optimization Crew to validate
    validation_result = query_crew.validate_syntax(sql, dialect)
    
    return {
        "success": True,
        "validation": validation_result,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/crews/query-optimization/alternatives")
async def suggest_query_alternatives(request: Dict[str, Any]):
    """Suggest alternative query implementations"""
    
    sql = request.get("sql", "")
    
    if not sql:
        raise HTTPException(status_code=400, detail="No SQL provided")
    
    if not query_crew:
        # Fallback simulation
        return {
            "success": True,
            "alternatives": [
                {
                    "approach": "CTE-based implementation",
                    "sql": "WITH customer_totals AS (SELECT ...) SELECT ...",
                    "pros": ["Better readability", "Reusable CTEs"],
                    "cons": ["May materialize unnecessarily"],
                    "performance_impact": "neutral"
                },
                {
                    "approach": "Window function approach",
                    "sql": "SELECT *, SUM() OVER (PARTITION BY ...) ...",
                    "pros": ["Single table scan", "More flexible"],
                    "cons": ["Higher memory usage"],
                    "performance_impact": "positive for small datasets"
                }
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Use Query Optimization Crew to suggest alternatives
    alternatives = query_crew.suggest_alternatives(sql)
    
    return {
        "success": True,
        "alternatives": alternatives,
        "timestamp": datetime.utcnow().isoformat()
    }


# ReAct SQL Crew endpoints
@app.post("/api/crews/react-sql/generate")
async def generate_sql_react(request: Dict[str, Any]):
    """Generate SQL using ReAct (Reasoning and Acting) pattern"""
    
    natural_language = request.get("natural_language", "")
    
    if not natural_language:
        raise HTTPException(status_code=400, detail="No natural language request provided")
    
    if not ReActSQLCrew:
        # Fallback simulation showing ReAct pattern
        return {
            "success": True,
            "sql": "-- Generated via ReAct pattern simulation\nSELECT * FROM iceberg.production.customers LIMIT 10;",
            "reasoning_trace": [
                "THOUGHT: User wants to query customer data",
                "ACTION: Exploring schema to understand table structure", 
                "OBSERVATION: Found customers table with standard columns",
                "THOUGHT: Should generate simple query to start",
                "ACTION: Creating SQL with proper Trino syntax",
                "OBSERVATION: SQL generated successfully",
                "THOUGHT: Query looks good and is ready"
            ],
            "validation": {
                "valid": True,
                "errors": [],
                "warnings": []
            },
            "performance": {
                "estimated_time_ms": 250,
                "complexity_score": 2,
                "recommendations": ["Query is simple and efficient"]
            },
            "pattern": "ReAct",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Mock LLM for ReAct crew
    class MockLLM:
        def __call__(self, prompt: str) -> str:
            return "Generated response based on ReAct pattern"
    
    # Initialize ReAct SQL crew
    react_crew = ReActSQLCrew(MockLLM())
    
    # Execute ReAct workflow
    result = react_crew.generate_sql_react({
        "natural_language": natural_language,
        "target_databases": request.get("target_databases", ["production"]),
        "dialect": request.get("dialect", "trino"),
        "context": request.get("context", {})
    })
    
    return {
        "success": True,
        **result,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/crews/react-sql/optimize")
async def optimize_sql_react(request: Dict[str, Any]):
    """Optimize SQL using ReAct pattern with iterative improvement"""
    
    sql = request.get("sql", "")
    
    if not sql:
        raise HTTPException(status_code=400, detail="No SQL provided for optimization")
    
    if not ReActQueryOptimizer:
        # Fallback simulation
        return {
            "success": True,
            "original_sql": sql,
            "optimized_sql": f"-- Optimized via ReAct pattern\n{sql}",
            "reasoning_trace": [
                "THOUGHT: Analyzing query for optimization opportunities",
                "ACTION: Testing baseline performance",
                "OBSERVATION: Query executes in 2.3s with full table scan",
                "THOUGHT: Can add index hints and optimize JOIN order",
                "ACTION: Applying optimizations and re-testing",
                "OBSERVATION: Performance improved to 0.8s with index usage",
                "THOUGHT: Optimization successful"
            ],
            "improvements": [
                "Added index hints for better performance",
                "Optimized JOIN order based on cardinality",
                "Improved WHERE clause selectivity"
            ],
            "performance_gain": "65% faster execution time",
            "pattern": "ReAct Optimization",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Mock LLM for ReAct optimizer
    class MockLLM:
        def __call__(self, prompt: str) -> str:
            return "Optimization response based on ReAct pattern"
    
    # Initialize ReAct optimizer
    optimizer = ReActQueryOptimizer(MockLLM())
    
    # Execute ReAct optimization
    result = optimizer.optimize_query_react(sql, request.get("context", {}))
    
    return {
        "success": True,
        "original_sql": sql,
        **result,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/crews/react-sql/validate")
async def validate_sql_react(request: Dict[str, Any]):
    """Validate SQL using ReAct pattern with iterative checking"""
    
    sql = request.get("sql", "")
    
    if not sql:
        raise HTTPException(status_code=400, detail="No SQL provided for validation")
    
    # Use the ReAct validation tools directly
    try:
        from tools.react_sql_tools import SQLValidationTool, QueryTestingTool
        
        validator = SQLValidationTool()
        tester = QueryTestingTool()
        
        # Perform validation
        validation_result = json.loads(validator._run(sql))
        testing_result = json.loads(tester._run(sql))
        
        return {
            "success": True,
            "sql": sql,
            "validation": validation_result,
            "testing": testing_result,
            "reasoning_trace": [
                "THOUGHT: Need to validate SQL syntax and compatibility",
                "ACTION: Running SQL validation tool",
                f"OBSERVATION: Validation {'passed' if validation_result.get('valid') else 'failed'}",
                "THOUGHT: Now testing query performance and execution",
                "ACTION: Running query testing tool", 
                f"OBSERVATION: Performance score: {testing_result.get('performance_score', 'N/A')}",
                "THOUGHT: Validation complete"
            ],
            "pattern": "ReAct Validation",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except ImportError:
        # Fallback if tools not available
        return {
            "success": True,
            "sql": sql,
            "validation": {
                "valid": True,
                "errors": [],
                "warnings": ["ReAct tools not available - using basic validation"]
            },
            "pattern": "ReAct Validation (Simulated)",
            "timestamp": datetime.utcnow().isoformat()
        }


@app.get("/api/crews/react-sql/status")
async def react_sql_status():
    """Get status of ReAct SQL crew capabilities"""
    
    return {
        "react_sql_crew_available": ReActSQLCrew is not None,
        "react_optimizer_available": ReActQueryOptimizer is not None,
        "capabilities": {
            "sql_generation": True,
            "query_optimization": True,
            "syntax_validation": True,
            "schema_discovery": True,
            "performance_testing": True
        },
        "pattern": "ReAct (Reasoning and Acting)",
        "features": [
            "Iterative reasoning with tool usage",
            "Self-validation and error correction", 
            "Schema-aware query generation",
            "Performance-optimized results",
            "Transparent reasoning traces"
        ],
        "workflow": "Thought → Action → Observation → Repeat",
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    print("Starting enhanced CrewAI backend server...")
    print("Access at: http://localhost:8002")
    print("API docs: http://localhost:8002/docs")
    uvicorn.run(app, host="0.0.0.0", port=8002)