"""
Arbitron Router - Intelligent model selection and routing
"""

import time
import json
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import structlog
from openai import OpenAI

from .config import ArbitronConfig, TaskType, ModelConfig, RoutingStrategy
from .tracker import UsageTracker
from .cache import SemanticCache

logger = structlog.get_logger()

class ArbitronRouter:
    """
    Intelligent router for LLM model selection
    Optimizes for cost, speed, and accuracy based on task requirements
    """
    
    def __init__(self, config: ArbitronConfig = None):
        self.config = config or ArbitronConfig()
        self.usage_tracker = UsageTracker()
        self.cache = SemanticCache()
        
        # Initialize OpenAI client with Vultr endpoint
        self.client = OpenAI(
            api_key=self.config.api_key,
            base_url=self.config.base_url
        )
        
        # Fallback chains for each model
        self.fallback_chains = {
            "mistral-nemo": ["mixtral-8x7b", "llama3-70b"],
            "mixtral-8x7b": ["llama3-70b", "mistral-nemo"],
            "llama3-70b": ["mixtral-8x7b", "deepseek-coder"],
            "deepseek-coder": ["mixtral-8x7b", "llama3-70b"]
        }
        
        # Track model performance
        self.performance_stats = {}
    
    def get_llm(
        self,
        strategy: str,
        task_type: str = "analysis",
        context: Dict[str, Any] = None,
        use_cache: bool = True
    ):
        """
        Get an LLM instance configured with optimal model selection
        
        Args:
            strategy: The routing strategy to use
            task_type: Type of task (classification, analysis, etc.)
            context: Additional context for routing decisions
            use_cache: Whether to use cached responses
        
        Returns:
            Configured LLM instance
        """
        # Get routing strategy
        routing_strategy = self.config.get_strategy(strategy)
        if not routing_strategy:
            routing_strategy = self.config.get_strategy("performance_analysis")
        
        # Check for budget constraints
        if self._is_budget_constrained():
            logger.info("Budget constrained - using cost-optimized model")
            model_key = "mistral-nemo"
        # Check for time sensitivity
        elif self._is_time_sensitive(context):
            logger.info("Time sensitive request - using fastest model")
            model_key = self._get_fastest_model(routing_strategy.model_preference)
        # Check for accuracy requirements
        elif self._is_accuracy_critical(context, routing_strategy):
            logger.info("Accuracy critical request - using best model")
            model_key = self._get_best_model(routing_strategy.model_preference)
        else:
            # Use strategy preference
            model_key = self._select_by_strategy(routing_strategy, task_type)
        
        model_config = self.config.get_model(model_key)
        
        # Create LLM wrapper with fallback support
        return ArbitronLLM(
            client=self.client,
            model_config=model_config,
            fallback_chain=self.fallback_chains.get(model_key, []),
            cache=self.cache if use_cache else None,
            usage_tracker=self.usage_tracker,
            router=self
        )
    
    def _is_budget_constrained(self) -> bool:
        """Check if approaching daily budget limit"""
        daily_spend = self.usage_tracker.get_daily_spend()
        limit = self.config.daily_budget_limit
        
        # Alert at 80% of budget
        if daily_spend > limit * 0.8:
            logger.warning(f"Approaching daily budget limit: ${daily_spend:.2f} of ${limit:.2f}")
            return True
        return False
    
    def _is_time_sensitive(self, context: Dict) -> bool:
        """Check if request needs fast response"""
        if not context:
            return False
        
        # Check various indicators of urgency
        urgency_indicators = [
            context.get("priority") == "urgent",
            context.get("sla_deadline") and context["sla_deadline"] < 1000,  # Less than 1 second
            context.get("alert_severity") in ["critical", "high"],
            context.get("real_time") == True
        ]
        
        return any(urgency_indicators)
    
    def _is_accuracy_critical(self, context: Dict, strategy: RoutingStrategy) -> bool:
        """Check if request requires high accuracy"""
        if strategy.min_confidence and strategy.min_confidence > 0.85:
            return True
        
        if not context:
            return False
        
        accuracy_indicators = [
            context.get("requires_validation") == True,
            context.get("compliance_check") == True,
            context.get("production_decision") == True,
            context.get("financial_impact") == "high"
        ]
        
        return any(accuracy_indicators)
    
    def _get_fastest_model(self, preference_list: List[str]) -> str:
        """Get the fastest available model from preference list"""
        speed_ranking = {"fast": 1, "medium": 2, "slow": 3}
        
        models = [(m, self.config.get_model(m)) for m in preference_list]
        models.sort(key=lambda x: speed_ranking.get(x[1].speed, 3))
        
        return models[0][0] if models else "mistral-nemo"
    
    def _get_best_model(self, preference_list: List[str]) -> str:
        """Get the most capable model from preference list"""
        # Generally, larger models are more capable
        return preference_list[0] if preference_list else "llama3-70b"
    
    def _select_by_strategy(self, strategy: RoutingStrategy, task_type: str) -> str:
        """Select model based on strategy and task type"""
        # Get task-appropriate models
        task_models = self.config.get_models_for_task(TaskType[task_type.upper()])
        
        # Find intersection with strategy preference
        preferred_models = [m for m in strategy.model_preference if m in task_models]
        
        if preferred_models:
            return preferred_models[0]
        
        # Fallback to strategy preference
        return strategy.model_preference[0] if strategy.model_preference else "mixtral-8x7b"
    
    def track_performance(self, model_key: str, latency: float, success: bool, tokens_used: int):
        """Track model performance for optimization"""
        if model_key not in self.performance_stats:
            self.performance_stats[model_key] = {
                "calls": 0,
                "successes": 0,
                "total_latency": 0,
                "total_tokens": 0
            }
        
        stats = self.performance_stats[model_key]
        stats["calls"] += 1
        if success:
            stats["successes"] += 1
        stats["total_latency"] += latency
        stats["total_tokens"] += tokens_used
    
    def get_performance_report(self) -> Dict:
        """Get performance report for all models"""
        report = {}
        for model_key, stats in self.performance_stats.items():
            if stats["calls"] > 0:
                report[model_key] = {
                    "success_rate": stats["successes"] / stats["calls"],
                    "avg_latency": stats["total_latency"] / stats["calls"],
                    "avg_tokens": stats["total_tokens"] / stats["calls"],
                    "total_calls": stats["calls"]
                }
        return report


class ArbitronLLM:
    """
    LLM wrapper with Arbitron features
    Provides caching, fallback, and usage tracking
    """
    
    def __init__(
        self,
        client: OpenAI,
        model_config: ModelConfig,
        fallback_chain: List[str],
        cache: Optional[SemanticCache],
        usage_tracker: UsageTracker,
        router: ArbitronRouter
    ):
        self.client = client
        self.model_config = model_config
        self.fallback_chain = fallback_chain
        self.cache = cache
        self.usage_tracker = usage_tracker
        self.router = router
    
    def invoke(self, prompt: str, temperature: float = 0.7, max_tokens: int = None) -> str:
        """
        Invoke the LLM with automatic fallback and caching
        
        Args:
            prompt: The prompt to send to the model
            temperature: Temperature for generation
            max_tokens: Maximum tokens to generate
        
        Returns:
            Generated response text
        """
        # Check cache first
        if self.cache:
            cached_response = self.cache.get(prompt, self.model_config.id)
            if cached_response:
                logger.info(f"Cache hit for model {self.model_config.id}")
                self.usage_tracker.record_cache_hit(self.model_config.id)
                return cached_response
        
        # Try primary model and fallbacks
        models_to_try = [self.model_config.id] + self.fallback_chain
        
        for model_id in models_to_try:
            try:
                start_time = time.time()
                
                response = self.client.chat.completions.create(
                    model=model_id,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=max_tokens or self.model_config.max_output_tokens,
                    stream=False
                )
                
                latency = time.time() - start_time
                result = response.choices[0].message.content
                
                # Track usage
                tokens_used = response.usage.total_tokens if hasattr(response, 'usage') else 0
                cost = self._calculate_cost(tokens_used)
                
                self.usage_tracker.record_usage(
                    model=model_id,
                    tokens=tokens_used,
                    cost=cost,
                    latency=latency,
                    success=True
                )
                
                self.router.track_performance(model_id, latency, True, tokens_used)
                
                # Cache successful response
                if self.cache and result:
                    self.cache.set(prompt, self.model_config.id, result)
                
                logger.info(f"Successfully used model {model_id} (latency: {latency:.2f}s, cost: ${cost:.4f})")
                
                return result
                
            except Exception as e:
                logger.error(f"Model {model_id} failed: {str(e)}")
                self.router.track_performance(model_id, 0, False, 0)
                
                # Try next model in fallback chain
                if model_id != models_to_try[-1]:
                    logger.info(f"Falling back to next model...")
                    continue
                else:
                    # All models failed
                    raise Exception(f"All models failed. Last error: {str(e)}")
    
    def _calculate_cost(self, tokens: int) -> float:
        """Calculate cost for token usage"""
        return (tokens / 1000) * self.model_config.cost_per_1k_tokens
    
    def batch_invoke(self, prompts: List[str], temperature: float = 0.7) -> List[str]:
        """Batch invoke for multiple prompts"""
        results = []
        for prompt in prompts:
            try:
                result = self.invoke(prompt, temperature)
                results.append(result)
            except Exception as e:
                logger.error(f"Batch invoke failed for prompt: {str(e)}")
                results.append("")
        
        return results