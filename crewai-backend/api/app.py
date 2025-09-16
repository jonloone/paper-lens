"""
FastAPI server for CrewAI backend
Exposes crew execution endpoints with Arbitron metrics
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
import structlog
import uvicorn
import os

from ..arbitron import ArbitronRouter, ArbitronConfig
from ..crews.system_health_crew import SystemHealthCrew
# from ..crews.performance_crew import PerformanceAnalysisCrew
# from ..crews.quality_crew import QualityPriorityCrew

# Configure logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.dev.ConsoleRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Create FastAPI app
app = FastAPI(
    title="NexusOne CrewAI Backend",
    description="Intelligent CrewAI orchestration with Arbitron-powered LLM routing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://137.220.61.218:3000",
        "http://137.220.61.218:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Arbitron
arbitron_config = ArbitronConfig()
arbitron_router = ArbitronRouter(arbitron_config)

# Initialize Crews
crews = {
    "system_health": SystemHealthCrew(arbitron_router),
    # "performance": PerformanceAnalysisCrew(arbitron_router),
    # "quality": QualityPriorityCrew(arbitron_router)
}

# Pydantic models for requests/responses
class AlertRequest(BaseModel):
    alerts: List[Dict[str, Any]]
    context: Optional[Dict[str, Any]] = None

class PerformanceIssue(BaseModel):
    issue_type: str
    description: str
    metrics: Dict[str, Any]
    affected_systems: List[str]
    context: Optional[Dict[str, Any]] = None

class QualityProfileRequest(BaseModel):
    profiling_results: Dict[str, Any]
    dataset: str
    context: Optional[Dict[str, Any]] = None

class CrewResponse(BaseModel):
    success: bool
    result: Any
    arbitron_metrics: Dict[str, Any]
    execution_time: float
    crew: str

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "crews_available": list(crews.keys()),
        "arbitron_status": "active"
    }

# System Health Crew endpoints
@app.post("/api/crews/system-health/prioritize", response_model=CrewResponse)
async def prioritize_alerts(request: AlertRequest):
    """
    Prioritize system alerts using System Health Crew
    
    Uses consensus-based ranking with four specialized agents:
    - Urgency Agent
    - Business Impact Agent
    - Cascade Risk Agent
    - Resolution Effort Agent
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Received {len(request.alerts)} alerts for prioritization")
        
        # Execute crew
        crew = crews["system_health"]
        result = crew.prioritize_alerts(request.alerts)
        
        # Get Arbitron metrics
        arbitron_metrics = {
            "total_calls": arbitron_router.usage_tracker.get_daily_spend(),
            "model_stats": arbitron_router.get_performance_report(),
            "cache_stats": arbitron_router.cache.get_stats(),
            "recommendations": arbitron_router.usage_tracker.get_optimization_recommendations()
        }
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return CrewResponse(
            success=True,
            result=result,
            arbitron_metrics=arbitron_metrics,
            execution_time=execution_time,
            crew="system_health"
        )
        
    except Exception as e:
        logger.error(f"Alert prioritization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/crews/system-health/metrics")
async def get_system_health_metrics():
    """Get System Health Crew performance metrics"""
    crew = crews["system_health"]
    return crew.get_execution_metrics()

# Performance Analysis Crew endpoints (placeholder)
@app.post("/api/crews/performance/analyze")
async def analyze_performance(issue: PerformanceIssue):
    """Analyze performance issue using Performance Analysis Crew"""
    return {
        "message": "Performance Analysis Crew coming soon",
        "issue": issue.issue_type
    }

# Quality Priority Crew endpoints (placeholder)
@app.post("/api/crews/quality/prioritize")
async def prioritize_quality_rules(request: QualityProfileRequest):
    """Prioritize quality rules based on profiling results"""
    return {
        "message": "Quality Priority Crew coming soon",
        "dataset": request.dataset
    }

# Arbitron metrics endpoints
@app.get("/api/arbitron/metrics")
async def get_arbitron_metrics():
    """Get comprehensive Arbitron usage metrics"""
    return {
        "usage": arbitron_router.usage_tracker.export_metrics(),
        "cache": arbitron_router.cache.get_stats(),
        "hot_prompts": arbitron_router.cache.get_hot_prompts(),
        "performance": arbitron_router.get_performance_report(),
        "daily_spend": arbitron_router.usage_tracker.get_daily_spend(),
        "cost_breakdown": arbitron_router.usage_tracker.get_cost_breakdown(),
        "recommendations": arbitron_router.usage_tracker.get_optimization_recommendations()
    }

@app.get("/api/arbitron/cost/{crew_name}")
async def get_crew_cost(crew_name: str):
    """Get cost metrics for a specific crew"""
    stats = arbitron_router.usage_tracker.get_crew_stats(crew_name)
    return stats

@app.post("/api/arbitron/cache/invalidate")
async def invalidate_cache(pattern: str):
    """Invalidate cache entries matching a pattern"""
    count = arbitron_router.cache.invalidate_pattern(pattern)
    return {
        "invalidated": count,
        "pattern": pattern
    }

# Crew management endpoints
@app.get("/api/crews")
async def list_crews():
    """List available crews and their capabilities"""
    crew_info = []
    for name, crew in crews.items():
        crew_info.append({
            "name": name,
            "strategy": crew.strategy,
            "agents": len(crew.agents),
            "description": crew.__class__.__doc__.strip() if crew.__class__.__doc__ else "",
            "metrics": crew.get_execution_metrics()
        })
    
    return crew_info

@app.post("/api/crews/{crew_name}/execute")
async def execute_crew_task(crew_name: str, context: Dict[str, Any]):
    """Generic crew execution endpoint"""
    if crew_name not in crews:
        raise HTTPException(status_code=404, detail=f"Crew {crew_name} not found")
    
    crew = crews[crew_name]
    result = crew.execute_primary_task(context)
    
    return {
        "crew": crew_name,
        "result": result,
        "timestamp": datetime.now().isoformat()
    }

# Background task for cache cleanup
async def cleanup_cache():
    """Background task to clean up expired cache entries"""
    arbitron_router.cache.cleanup_expired()
    logger.info("Cache cleanup completed")

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("CrewAI backend starting up...")
    logger.info(f"Available crews: {list(crews.keys())}")
    logger.info(f"Arbitron models configured: {list(arbitron_config.models.keys())}")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("CrewAI backend shutting down...")
    # Export final metrics
    metrics = arbitron_router.usage_tracker.export_metrics()
    logger.info(f"Final metrics: {metrics}")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    port = int(os.environ.get("CREWAI_PORT", "8000"))
    host = os.environ.get("CREWAI_HOST", "0.0.0.0")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )