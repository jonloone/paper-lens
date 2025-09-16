#!/usr/bin/env python3
"""
Minimal FastAPI server for CrewAI backend
Works without full CrewAI/LangChain dependencies for testing
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import random
import hashlib

# Create FastAPI app
app = FastAPI(
    title="NexusOne CrewAI Backend (Minimal)",
    description="Minimal implementation for testing without full dependencies",
    version="1.0.0-minimal"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://137.220.61.218:3000",
        "http://137.220.61.218:3001",
        "*"  # Allow all for testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AlertRequest(BaseModel):
    alerts: List[Dict[str, Any]]
    context: Optional[Dict[str, Any]] = None

class CrewResponse(BaseModel):
    success: bool
    result: Any
    arbitron_metrics: Dict[str, Any]
    execution_time: float
    crew: str

# Mock System Health Crew
class MockSystemHealthCrew:
    """Mock implementation of System Health Crew"""
    
    def prioritize_alerts(self, alerts: List[Dict]) -> List[Dict]:
        """Mock alert prioritization with realistic scoring"""
        prioritized = []
        
        for i, alert in enumerate(alerts):
            # Generate deterministic scores based on alert properties
            alert_hash = hashlib.md5(json.dumps(alert, sort_keys=True).encode()).hexdigest()
            
            # Mock scoring based on severity
            severity = alert.get("severity", "medium")
            base_scores = {
                "critical": 9.0,
                "high": 7.0,
                "medium": 5.0,
                "low": 3.0
            }
            base_score = base_scores.get(severity, 5.0)
            
            # Add some variance
            variance = (int(alert_hash[:2], 16) / 255.0) * 2 - 1  # -1 to 1
            
            # Calculate individual scores
            urgency_score = min(10, max(0, base_score + variance))
            impact_score = min(10, max(0, base_score + variance * 0.8))
            cascade_score = min(10, max(0, (base_score - 1) + variance * 0.6))
            effort_score = min(10, max(0, 10 - base_score + variance))
            
            # Calculate weighted priority
            priority_score = (
                urgency_score * 0.35 +
                impact_score * 0.35 +
                cascade_score * 0.20 +
                (10 - effort_score) * 0.10
            )
            
            # Create prioritized alert
            prioritized_alert = alert.copy()
            prioritized_alert.update({
                "priority_rank": 0,  # Will be set after sorting
                "priority_score": round(priority_score, 2),
                "urgency_score": round(urgency_score, 2),
                "business_impact_score": round(impact_score, 2),
                "cascade_risk_score": round(cascade_score, 2),
                "resolution_effort_score": round(effort_score, 2),
                "consensus_confidence": 0.85,
                "recommendations": self._get_recommendations(alert, priority_score),
                "crew_analysis": {
                    "analyzed_at": datetime.now().isoformat(),
                    "crew": "system_health",
                    "consensus_method": "weighted_pairwise_ranking",
                    "agents_consulted": 4
                }
            })
            prioritized.append(prioritized_alert)
        
        # Sort by priority score
        prioritized.sort(key=lambda x: x["priority_score"], reverse=True)
        
        # Set ranks
        for i, alert in enumerate(prioritized):
            alert["priority_rank"] = i + 1
        
        return prioritized
    
    def _get_recommendations(self, alert: Dict, priority_score: float) -> List[Dict]:
        """Generate mock recommendations"""
        recommendations = []
        
        if priority_score >= 8:
            recommendations.append({
                "action": "immediate_response",
                "reason": "Critical priority requiring immediate attention",
                "suggested_team": "On-Call Engineer"
            })
        elif priority_score >= 6:
            recommendations.append({
                "action": "investigate_within_hour", 
                "reason": "High priority issue needing prompt investigation",
                "suggested_team": "Data Engineering"
            })
        else:
            recommendations.append({
                "action": "schedule_review",
                "reason": "Medium/low priority - can be addressed during normal hours",
                "suggested_team": "Platform Team"
            })
        
        return recommendations

# Mock Arbitron metrics
class MockArbitron:
    """Mock Arbitron metrics tracker"""
    
    def __init__(self):
        self.total_calls = 0
        self.models_used = []
    
    def get_metrics(self) -> Dict:
        self.total_calls += 1
        
        return {
            "total_calls": self.total_calls,
            "cost_today": round(self.total_calls * 0.005, 3),
            "cache_hit_rate": 0.3,
            "latency_p95": 450,
            "model_distribution": {
                "mistral-nemo": 60,
                "mixtral-8x7b": 30,
                "llama3-70b": 10
            },
            "recommendations": [
                "Consider enabling semantic caching to reduce costs",
                "High usage of mistral-nemo indicates good cost optimization"
            ],
            "model_used": "mistral-nemo",
            "cost": 0.005,
            "latency_ms": 350,
            "from_cache": self.total_calls % 3 == 0  # Every 3rd call is "cached"
        }

# Initialize mock components
mock_crew = MockSystemHealthCrew()
mock_arbitron = MockArbitron()

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "NexusOne CrewAI Backend (Minimal)",
        "status": "running",
        "version": "1.0.0-minimal",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "crews_available": ["system_health"],
        "arbitron_status": "active",
        "mode": "mock"
    }

@app.post("/api/crews/system-health/prioritize", response_model=CrewResponse)
async def prioritize_alerts(request: AlertRequest):
    """Prioritize system alerts using mock System Health Crew"""
    start_time = datetime.now()
    
    try:
        # Mock crew execution
        result = mock_crew.prioritize_alerts(request.alerts)
        
        # Get mock Arbitron metrics
        arbitron_metrics = mock_arbitron.get_metrics()
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return CrewResponse(
            success=True,
            result=result,
            arbitron_metrics=arbitron_metrics,
            execution_time=execution_time,
            crew="system_health"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/arbitron/metrics")
async def get_arbitron_metrics():
    """Get Arbitron usage metrics"""
    return mock_arbitron.get_metrics()

@app.get("/api/crews")
async def list_crews():
    """List available crews"""
    return [
        {
            "name": "system_health",
            "strategy": "speed_optimized",
            "agents": 4,
            "description": "Prioritizes system alerts using consensus-based ranking",
            "status": "active",
            "mode": "mock"
        }
    ]

if __name__ == "__main__":
    import uvicorn
    print("Starting minimal CrewAI backend server...")
    print("Access at: http://localhost:8000")
    print("API docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)