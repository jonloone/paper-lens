"""
NexusOne Data Product Creation MVP Backend
FastAPI application integrating real intelligence with smart infrastructure mocking
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import sys
import time
import uvicorn
from contextlib import asynccontextmanager

from .api.routes import router
from .api.overview_routes import router as overview_router
from .api.kag_routes import router as kag_router
from .api.sources_routes import router as sources_router
from .api.build_routes import router as build_router
from .api.governance_routes import router as governance_router
from .api.policy_routes import router as policy_router
from .api.tisql_routes import router as tisql_router
from .api.trino_query_routes import router as trino_query_router
from .api.operations_routes import router as operations_router
from .api.monitor_routes import router as monitor_router
from .api.glossary_routes import router as glossary_router
from .api.glossary_analytics_routes import router as glossary_analytics_router
from .api.quality_gates_routes import router as quality_gates_router
from .api.business_context_routes import router as business_context_router
from .api.hybrid_query_routes import router as hybrid_query_router
from .api.context_routes import router as context_router
from .api.recommendations_routes import router as recommendations_router
from .api.datahub_sync_routes import router as datahub_sync_router
from .api.profile_routes import router as profile_router
from .api.feedback_routes import router as feedback_router
from .api.table_analysis_routes import router as table_analysis_router
from .models import schemas  # Import to register models
from .services.pattern_aggregation_scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/tmp/nexusone_backend.log") if "/tmp" else logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    """
    # Startup
    logger.info("🚀 NexusOne Backend starting up...")
    logger.info("Real intelligence services initialized:")
    logger.info("  ✓ ydata-profiling for data analysis")
    logger.info("  ✓ CrewAI for intelligent recommendations")
    logger.info("  ✓ Great Expectations for quality validation")
    logger.info("  ✓ tiSQL AI-powered SQL assistance")
    logger.info("Smart infrastructure mocking enabled:")
    logger.info("  ✓ Airflow DAG generation")
    logger.info("  ✓ SQLMesh transformation models")
    logger.info("  ✓ Trino API schemas")
    logger.info("  ✓ Iceberg table simulation")

    # Start pattern aggregation scheduler
    logger.info("Starting usage pattern aggregation scheduler...")
    start_scheduler()

    yield

    # Shutdown
    logger.info("🛑 NexusOne Backend shutting down...")
    logger.info("Stopping pattern aggregation scheduler...")
    stop_scheduler()

# Create FastAPI application
app = FastAPI(
    title="NexusOne Data Product Creation API",
    description="""
    Backend API for NexusOne's intelligent data product creation platform.

    This MVP demonstrates real intelligence capabilities with smart infrastructure mocking:

    **Real Intelligence Services:**
    - ydata-profiling for comprehensive data analysis
    - CrewAI agents for quality and architecture recommendations
    - Great Expectations for production-ready data validation

    **Smart Infrastructure Mocking:**
    - Realistic Airflow DAG generation
    - Production-ready SQLMesh transformation models
    - Complete API schema generation
    - Iceberg table simulation

    **Key Features:**
    - 5-step guided data product creation workflow
    - AI-powered quality recommendations
    - Architecture optimization suggestions
    - Real-time deployment simulation
    - Production-ready code generation
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        "http://137.220.61.218:3000",
        "https://*.vercel.app",
        "https://*.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)
app.include_router(overview_router)
app.include_router(kag_router)
app.include_router(sources_router)
app.include_router(build_router)
app.include_router(governance_router)
app.include_router(policy_router)
app.include_router(tisql_router)
app.include_router(trino_query_router)
app.include_router(operations_router)
app.include_router(monitor_router)
app.include_router(glossary_router)
app.include_router(glossary_analytics_router)
app.include_router(quality_gates_router)
app.include_router(business_context_router)
app.include_router(hybrid_query_router)
app.include_router(context_router)
app.include_router(recommendations_router)
app.include_router(datahub_sync_router)
app.include_router(profile_router)
app.include_router(feedback_router)
app.include_router(table_analysis_router)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_type": type(exc).__name__,
            "path": str(request.url.path)
        }
    )

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with API information
    """
    return {
        "message": "NexusOne Data Product Creation API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
        "features": {
            "real_intelligence": [
                "ydata-profiling data analysis",
                "CrewAI recommendation agents",
                "Great Expectations validation"
            ],
            "smart_mocking": [
                "Airflow DAG generation",
                "SQLMesh transformation models",
                "API schema creation",
                "Deployment simulation"
            ]
        }
    }

# Additional middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all requests for debugging
    """
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.4f}s"
    )

    return response

if __name__ == "__main__":
    # Development server configuration
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )