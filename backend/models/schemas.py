from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from enum import Enum

# Enums
class DataSourceStatus(str, Enum):
    CONNECTED = "connected"
    DEGRADED = "degraded"
    DISCONNECTED = "disconnected"

class ProcessingEngine(str, Enum):
    SQLMESH = "sqlmesh"
    SPARK = "spark"
    HYBRID = "hybrid"

class StorageFormat(str, Enum):
    ICEBERG_TABLE = "iceberg_table"
    ICEBERG_VIEW = "iceberg_view"

class ValidationSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

class DeploymentStatus(str, Enum):
    READY = "ready"
    DEPLOYING = "deploying"
    VALIDATING = "validating"
    COMPLETED = "completed"
    FAILED = "failed"

# Request Models
class ProductDefinitionRequest(BaseModel):
    name: str = Field(..., description="Data product name")
    description: str = Field(..., description="Business purpose")
    owner: str = Field(..., description="Product owner")
    stakeholders: List[str] = Field(default=[], description="Business stakeholders")
    timeline: str = Field(..., description="Project timeline")
    business_value: str = Field(..., description="Expected business impact")

class DataSourceAnalysisRequest(BaseModel):
    source_id: str = Field(..., description="Data source identifier")
    domain_id: str = Field(..., description="Domain context")
    sample_size: Optional[int] = Field(default=10000, description="Sample size for profiling")

class QualityRecommendationRequest(BaseModel):
    profiling_results: Dict[str, Any] = Field(..., description="ydata-profiling results")
    business_context: Dict[str, Any] = Field(..., description="Business context")
    domain_context: str = Field(..., description="Domain context")

class ArchitectureRecommendationRequest(BaseModel):
    data_requirements: Dict[str, Any] = Field(..., description="Data volume and complexity")
    business_context: Dict[str, Any] = Field(..., description="Business requirements")
    selected_sources: List[str] = Field(..., description="Selected data sources")

class CreateQualitySuiteRequest(BaseModel):
    data_product_name: str = Field(..., description="Data product name")
    quality_rules: List[Dict[str, Any]] = Field(..., description="Quality validation rules")
    domain_id: str = Field(..., description="Domain context")

class ValidateDataRequest(BaseModel):
    data_product_name: str = Field(..., description="Data product name")
    source_id: str = Field(..., description="Data source to validate")

class DeployDataProductRequest(BaseModel):
    data_product_name: str = Field(..., description="Data product name")
    implementation_config: Dict[str, Any] = Field(..., description="Implementation configuration")
    quality_framework: Dict[str, Any] = Field(..., description="Quality validation setup")
    source_analysis: Dict[str, Any] = Field(..., description="Source analysis results")

# Response Models
class DataSourceInfo(BaseModel):
    id: str
    name: str
    status: DataSourceStatus
    description: str
    last_updated: datetime
    record_count: str
    health_score: int
    issues: List[str] = []

class ProfileAnalysisResponse(BaseModel):
    source_id: str
    profile_results: Dict[str, Any]
    analysis_timestamp: datetime
    recommendations: List[Dict[str, Any]]
    quality_score: float

class QualityRecommendation(BaseModel):
    rule_type: str = Field(..., description="Great Expectations rule type")
    column: str = Field(..., description="Target column")
    parameters: Dict[str, Any] = Field(..., description="Rule parameters")
    business_justification: str = Field(..., description="Why this rule matters")
    severity: ValidationSeverity = Field(..., description="Rule importance")
    priority: int = Field(..., description="Implementation priority")
    expected_pass_rate: float = Field(..., description="Expected validation pass rate")
    crew_reasoning: str = Field(..., description="AI agent reasoning")

class QualityRecommendationsResponse(BaseModel):
    recommendations: List[QualityRecommendation]
    generated_at: datetime
    agent_confidence: float
    domain_context: str

class ArchitectureRecommendation(BaseModel):
    processing_engine: ProcessingEngine
    storage_format: StorageFormat
    refresh_schedule: str
    output_formats: List[str]
    reasoning: str
    confidence_score: float
    estimated_costs: Dict[str, str]

class ArchitectureRecommendationsResponse(BaseModel):
    recommendations: ArchitectureRecommendation
    generated_at: datetime
    crew_analysis: str

class QualitySuiteResponse(BaseModel):
    suite_name: str
    expectations_count: int
    created_at: datetime
    suite_id: str

class DataValidationResponse(BaseModel):
    validation_results: Dict[str, Any]
    validated_at: datetime
    success: bool
    summary: Dict[str, Any]

class DeploymentStep(BaseModel):
    step_id: int
    name: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    logs: List[str] = []

class DeploymentResponse(BaseModel):
    deployment_id: str
    status: DeploymentStatus
    current_step: int
    total_steps: int
    steps: List[DeploymentStep]
    started_at: datetime
    estimated_completion: Optional[datetime] = None

class GeneratedCodeResponse(BaseModel):
    sqlmesh_model: str
    airflow_dag: str
    api_schema: Dict[str, Any]
    quality_tests: str
    generated_at: datetime

class DataProductStatusResponse(BaseModel):
    name: str
    status: str
    quality_score: Optional[float] = None
    deployment_status: str
    access_methods: Dict[str, str]
    created_at: datetime
    last_updated: datetime