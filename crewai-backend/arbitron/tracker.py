"""
Usage Tracker for Arbitron
Tracks model usage, costs, and performance metrics
"""

import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from collections import defaultdict
import structlog

logger = structlog.get_logger()

class UsageTracker:
    """
    Track LLM usage metrics for cost optimization and monitoring
    """
    
    def __init__(self):
        self.usage_data = defaultdict(lambda: {
            "calls": 0,
            "tokens": 0,
            "cost": 0.0,
            "cache_hits": 0,
            "failures": 0,
            "total_latency": 0.0
        })
        
        self.daily_usage = defaultdict(lambda: defaultdict(float))
        self.hourly_usage = defaultdict(lambda: defaultdict(int))
        self.crew_usage = defaultdict(lambda: defaultdict(float))
        
    def record_usage(
        self,
        model: str,
        tokens: int,
        cost: float,
        latency: float,
        success: bool = True,
        crew: str = None
    ):
        """Record usage metrics for a model call"""
        # Update cumulative stats
        self.usage_data[model]["calls"] += 1
        self.usage_data[model]["tokens"] += tokens
        self.usage_data[model]["cost"] += cost
        self.usage_data[model]["total_latency"] += latency
        
        if not success:
            self.usage_data[model]["failures"] += 1
        
        # Update daily usage
        today = datetime.now().date().isoformat()
        self.daily_usage[today]["cost"] += cost
        self.daily_usage[today]["tokens"] += tokens
        self.daily_usage[today]["calls"] += 1
        
        # Update hourly usage
        current_hour = datetime.now().strftime("%Y-%m-%d %H:00")
        self.hourly_usage[current_hour][model] += 1
        
        # Track crew-specific usage
        if crew:
            self.crew_usage[crew]["cost"] += cost
            self.crew_usage[crew]["calls"] += 1
            self.crew_usage[crew]["tokens"] += tokens
        
        logger.info(
            "Usage recorded",
            model=model,
            tokens=tokens,
            cost=cost,
            latency=latency,
            success=success,
            crew=crew
        )
    
    def record_cache_hit(self, model: str):
        """Record a cache hit"""
        self.usage_data[model]["cache_hits"] += 1
        logger.debug(f"Cache hit recorded for {model}")
    
    def get_daily_spend(self, date: str = None) -> float:
        """Get total spend for a specific day (default: today)"""
        if date is None:
            date = datetime.now().date().isoformat()
        
        return self.daily_usage[date]["cost"]
    
    def get_model_stats(self, model: str) -> Dict:
        """Get statistics for a specific model"""
        stats = self.usage_data[model]
        
        if stats["calls"] > 0:
            return {
                "total_calls": stats["calls"],
                "total_tokens": stats["tokens"],
                "total_cost": stats["cost"],
                "cache_hit_rate": stats["cache_hits"] / stats["calls"],
                "failure_rate": stats["failures"] / stats["calls"],
                "avg_latency": stats["total_latency"] / stats["calls"],
                "avg_tokens_per_call": stats["tokens"] / stats["calls"]
            }
        
        return {
            "total_calls": 0,
            "total_tokens": 0,
            "total_cost": 0.0,
            "cache_hit_rate": 0.0,
            "failure_rate": 0.0,
            "avg_latency": 0.0,
            "avg_tokens_per_call": 0.0
        }
    
    def get_crew_stats(self, crew: str) -> Dict:
        """Get statistics for a specific crew"""
        stats = self.crew_usage[crew]
        
        if stats["calls"] > 0:
            return {
                "total_calls": stats["calls"],
                "total_cost": stats["cost"],
                "total_tokens": stats["tokens"],
                "avg_cost_per_call": stats["cost"] / stats["calls"],
                "avg_tokens_per_call": stats["tokens"] / stats["calls"]
            }
        
        return {
            "total_calls": 0,
            "total_cost": 0.0,
            "total_tokens": 0,
            "avg_cost_per_call": 0.0,
            "avg_tokens_per_call": 0.0
        }
    
    def get_cost_breakdown(self) -> Dict[str, float]:
        """Get cost breakdown by model"""
        breakdown = {}
        for model, stats in self.usage_data.items():
            breakdown[model] = stats["cost"]
        
        return breakdown
    
    def get_hourly_pattern(self, hours: int = 24) -> Dict[str, Dict[str, int]]:
        """Get usage pattern for the last N hours"""
        cutoff = datetime.now() - timedelta(hours=hours)
        pattern = {}
        
        for hour_key, usage in self.hourly_usage.items():
            hour_dt = datetime.strptime(hour_key, "%Y-%m-%d %H:00")
            if hour_dt >= cutoff:
                pattern[hour_key] = dict(usage)
        
        return pattern
    
    def get_optimization_recommendations(self) -> List[str]:
        """Generate optimization recommendations based on usage patterns"""
        recommendations = []
        
        # Check for high-cost models being overused
        total_cost = sum(stats["cost"] for stats in self.usage_data.values())
        if total_cost > 0:
            for model, stats in self.usage_data.items():
                cost_ratio = stats["cost"] / total_cost
                if cost_ratio > 0.7 and model in ["llama3-70b", "deepseek-coder"]:
                    recommendations.append(
                        f"Consider using lighter models - {model} accounts for {cost_ratio*100:.1f}% of costs"
                    )
        
        # Check cache hit rates
        for model, stats in self.usage_data.items():
            if stats["calls"] > 10:
                cache_hit_rate = stats["cache_hits"] / stats["calls"]
                if cache_hit_rate < 0.2:
                    recommendations.append(
                        f"Low cache hit rate for {model} ({cache_hit_rate*100:.1f}%) - consider enabling semantic caching"
                    )
        
        # Check failure rates
        for model, stats in self.usage_data.items():
            if stats["calls"] > 10:
                failure_rate = stats["failures"] / stats["calls"]
                if failure_rate > 0.1:
                    recommendations.append(
                        f"High failure rate for {model} ({failure_rate*100:.1f}%) - consider using fallback models"
                    )
        
        # Check latency
        for model, stats in self.usage_data.items():
            if stats["calls"] > 0:
                avg_latency = stats["total_latency"] / stats["calls"]
                if avg_latency > 5.0:
                    recommendations.append(
                        f"High latency for {model} ({avg_latency:.1f}s) - consider using faster models for time-sensitive tasks"
                    )
        
        return recommendations
    
    def export_metrics(self) -> Dict:
        """Export all metrics for monitoring"""
        return {
            "timestamp": datetime.now().isoformat(),
            "models": {
                model: self.get_model_stats(model)
                for model in self.usage_data.keys()
            },
            "daily_spend": self.get_daily_spend(),
            "cost_breakdown": self.get_cost_breakdown(),
            "recommendations": self.get_optimization_recommendations()
        }
    
    def reset_daily_metrics(self):
        """Reset daily metrics (call at start of new day)"""
        yesterday = (datetime.now() - timedelta(days=1)).date().isoformat()
        
        # Archive yesterday's data (in production, save to database)
        archived_data = {
            "date": yesterday,
            "data": dict(self.daily_usage[yesterday])
        }
        
        logger.info(f"Archiving daily metrics: {archived_data}")
        
        # Clear old hourly data (keep last 48 hours)
        cutoff = datetime.now() - timedelta(hours=48)
        hours_to_remove = []
        for hour_key in self.hourly_usage.keys():
            hour_dt = datetime.strptime(hour_key, "%Y-%m-%d %H:00")
            if hour_dt < cutoff:
                hours_to_remove.append(hour_key)
        
        for hour_key in hours_to_remove:
            del self.hourly_usage[hour_key]