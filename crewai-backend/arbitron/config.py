"""
Arbitron Configuration for Vultr Inference API
Defines models, routing strategies, and optimization parameters
"""

import os
from typing import Dict, Any, List
from dataclasses import dataclass
from enum import Enum

class TaskType(Enum):
    """Types of tasks for model selection"""
    CLASSIFICATION = "classification"
    ANALYSIS = "analysis"
    GENERATION = "generation"
    REASONING = "reasoning"
    SUMMARIZATION = "summarization"
    EXTRACTION = "extraction"
    VALIDATION = "validation"
    OPTIMIZATION = "optimization"

@dataclass
class ModelConfig:
    """Configuration for a single model"""
    id: str
    name: str
    cost_per_1k_tokens: float
    speed: str  # fast, medium, slow
    context_window: int
    best_for: List[str]
    max_output_tokens: int = 4096
    temperature_range: tuple = (0.0, 1.0)

@dataclass
class RoutingStrategy:
    """Routing strategy configuration"""
    name: str
    strategy_type: str  # speed_optimized, cost_optimized, accuracy_optimized, balanced
    model_preference: List[str]
    max_latency_ms: int = None
    max_cost_per_call: float = None
    min_confidence: float = None
    fallback_enabled: bool = True
    cache_enabled: bool = True

class ArbitronConfig:
    """Main Arbitron configuration"""
    
    def __init__(self):
        self.api_key = os.environ.get("VULTR_API_KEY", "NQCHCWXPSWQ3JL6IM5NT5EBD4FNOK5S7AEZA")
        self.base_url = "https://api.vultrinference.com/v1"
        self.models = self._init_models()
        self.strategies = self._init_strategies()
        self.daily_budget_limit = float(os.environ.get("DAILY_BUDGET_LIMIT", "50.0"))
        self.cache_ttl_seconds = int(os.environ.get("CACHE_TTL_SECONDS", "3600"))
        
    def _init_models(self) -> Dict[str, ModelConfig]:
        """Initialize available models"""
        return {
            "mistral-nemo": ModelConfig(
                id="mistral-nemo-instruct-2407",
                name="Mistral Nemo Instruct",
                cost_per_1k_tokens=0.2,  # $0.0002 per token
                speed="fast",
                context_window=8192,
                best_for=["simple_analysis", "quick_decisions", "status_checks", "classification"],
                max_output_tokens=2048
            ),
            "mixtral-8x7b": ModelConfig(
                id="mixtral-8x7b-instruct",
                name="Mixtral 8x7B Instruct",
                cost_per_1k_tokens=0.5,  # $0.0005 per token
                speed="medium",
                context_window=32768,
                best_for=["detailed_analysis", "multi_step_reasoning", "code_review", "extraction"],
                max_output_tokens=4096
            ),
            "llama3-70b": ModelConfig(
                id="llama3-70b-instruct",
                name="Llama 3 70B Instruct",
                cost_per_1k_tokens=1.0,  # $0.001 per token
                speed="slow",
                context_window=8192,
                best_for=["complex_reasoning", "architecture_decisions", "deep_analysis", "optimization"],
                max_output_tokens=4096
            ),
            "deepseek-coder": ModelConfig(
                id="deepseek-coder-33b-instruct",
                name="DeepSeek Coder 33B",
                cost_per_1k_tokens=0.8,
                speed="medium",
                context_window=16384,
                best_for=["code_generation", "code_analysis", "technical_documentation"],
                max_output_tokens=4096
            )
        }
    
    def _init_strategies(self) -> Dict[str, RoutingStrategy]:
        """Initialize routing strategies for different crew types"""
        return {
            "system_health": RoutingStrategy(
                name="System Health Strategy",
                strategy_type="speed_optimized",
                model_preference=["mistral-nemo", "mixtral-8x7b"],
                max_latency_ms=500,
                fallback_enabled=True,
                cache_enabled=True
            ),
            "performance_analysis": RoutingStrategy(
                name="Performance Analysis Strategy",
                strategy_type="balanced",
                model_preference=["mixtral-8x7b", "llama3-70b"],
                max_cost_per_call=0.05,
                fallback_enabled=True,
                cache_enabled=True
            ),
            "quality_priority": RoutingStrategy(
                name="Quality Priority Strategy",
                strategy_type="accuracy_optimized",
                model_preference=["llama3-70b", "mixtral-8x7b"],
                min_confidence=0.85,
                fallback_enabled=True,
                cache_enabled=False  # Don't cache quality decisions
            ),
            "architecture_selection": RoutingStrategy(
                name="Architecture Selection Strategy",
                strategy_type="accuracy_optimized",
                model_preference=["llama3-70b", "deepseek-coder"],
                min_confidence=0.9,
                fallback_enabled=True,
                cache_enabled=True
            ),
            "query_optimization": RoutingStrategy(
                name="Query Optimization Strategy",
                strategy_type="balanced",
                model_preference=["mixtral-8x7b", "deepseek-coder"],
                max_cost_per_call=0.03,
                fallback_enabled=True,
                cache_enabled=True
            )
        }
    
    def get_model(self, model_key: str) -> ModelConfig:
        """Get model configuration by key"""
        return self.models.get(model_key)
    
    def get_strategy(self, strategy_key: str) -> RoutingStrategy:
        """Get routing strategy by key"""
        return self.strategies.get(strategy_key)
    
    def get_models_for_task(self, task_type: TaskType) -> List[str]:
        """Get recommended models for a task type"""
        task_model_mapping = {
            TaskType.CLASSIFICATION: ["mistral-nemo", "mixtral-8x7b"],
            TaskType.ANALYSIS: ["mixtral-8x7b", "llama3-70b"],
            TaskType.GENERATION: ["mixtral-8x7b", "deepseek-coder"],
            TaskType.REASONING: ["llama3-70b", "mixtral-8x7b"],
            TaskType.SUMMARIZATION: ["mistral-nemo", "mixtral-8x7b"],
            TaskType.EXTRACTION: ["mixtral-8x7b", "mistral-nemo"],
            TaskType.VALIDATION: ["mistral-nemo", "mixtral-8x7b"],
            TaskType.OPTIMIZATION: ["llama3-70b", "deepseek-coder"]
        }
        return task_model_mapping.get(task_type, ["mixtral-8x7b"])

# Global instances
VULTR_CONFIG = ArbitronConfig()
ROUTING_STRATEGIES = VULTR_CONFIG.strategies