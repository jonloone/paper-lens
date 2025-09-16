"""
Semantic Cache for Arbitron
Caches LLM responses with semantic similarity matching
"""

import json
import hashlib
import time
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
import numpy as np
from collections import OrderedDict
import structlog

logger = structlog.get_logger()

class SemanticCache:
    """
    Semantic caching for LLM responses
    Uses embeddings for similarity matching and intelligent cache invalidation
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache = OrderedDict()
        self.embeddings_cache = {}
        self.hit_count = 0
        self.miss_count = 0
        
    def _generate_key(self, prompt: str, model: str) -> str:
        """Generate a cache key from prompt and model"""
        content = f"{model}:{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity between two texts
        In production, this would use actual embeddings (e.g., from sentence-transformers)
        For now, using simple heuristics
        """
        # Simple word overlap similarity (placeholder)
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        jaccard = len(intersection) / len(union) if union else 0.0
        
        # Length similarity factor
        len_ratio = min(len(text1), len(text2)) / max(len(text1), len(text2))
        
        # Combined score
        return 0.7 * jaccard + 0.3 * len_ratio
    
    def get(self, prompt: str, model: str, similarity_threshold: float = 0.85) -> Optional[str]:
        """
        Get cached response for a prompt
        
        Args:
            prompt: The input prompt
            model: The model identifier
            similarity_threshold: Minimum similarity for cache hit
        
        Returns:
            Cached response if found and valid, None otherwise
        """
        # Try exact match first
        exact_key = self._generate_key(prompt, model)
        if exact_key in self.cache:
            entry = self.cache[exact_key]
            if self._is_valid_entry(entry):
                # Move to end (LRU)
                self.cache.move_to_end(exact_key)
                entry["hits"] += 1
                self.hit_count += 1
                logger.debug(f"Cache hit (exact): {exact_key[:8]}")
                return entry["response"]
            else:
                # Remove expired entry
                del self.cache[exact_key]
        
        # Try semantic similarity match
        best_match = self._find_similar_entry(prompt, model, similarity_threshold)
        if best_match:
            key, entry = best_match
            self.cache.move_to_end(key)
            entry["hits"] += 1
            self.hit_count += 1
            logger.debug(f"Cache hit (semantic): {key[:8]}, similarity: {entry['similarity']:.2f}")
            return entry["response"]
        
        self.miss_count += 1
        return None
    
    def set(self, prompt: str, model: str, response: str, metadata: Dict = None):
        """
        Cache a response
        
        Args:
            prompt: The input prompt
            model: The model identifier
            response: The LLM response
            metadata: Additional metadata to store
        """
        key = self._generate_key(prompt, model)
        
        # Enforce cache size limit
        if len(self.cache) >= self.max_size:
            # Remove least recently used items
            items_to_remove = len(self.cache) - self.max_size + 1
            for _ in range(items_to_remove):
                removed_key, _ = self.cache.popitem(last=False)
                logger.debug(f"Evicted from cache: {removed_key[:8]}")
        
        entry = {
            "prompt": prompt,
            "model": model,
            "response": response,
            "timestamp": time.time(),
            "hits": 0,
            "metadata": metadata or {},
            "similarity": 1.0  # Exact match
        }
        
        self.cache[key] = entry
        logger.debug(f"Cached response: {key[:8]}")
    
    def _is_valid_entry(self, entry: Dict) -> bool:
        """Check if a cache entry is still valid"""
        age = time.time() - entry["timestamp"]
        return age < self.ttl_seconds
    
    def _find_similar_entry(
        self,
        prompt: str,
        model: str,
        threshold: float
    ) -> Optional[Tuple[str, Dict]]:
        """
        Find a semantically similar cached entry
        
        Returns:
            Tuple of (key, entry) if found, None otherwise
        """
        best_match = None
        best_similarity = threshold
        
        for key, entry in self.cache.items():
            # Skip if different model or expired
            if entry["model"] != model or not self._is_valid_entry(entry):
                continue
            
            # Calculate similarity
            similarity = self._calculate_similarity(prompt, entry["prompt"])
            
            if similarity >= best_similarity:
                best_similarity = similarity
                best_match = (key, entry)
        
        if best_match:
            # Update similarity score in entry
            best_match[1]["similarity"] = best_similarity
        
        return best_match
    
    def invalidate_pattern(self, pattern: str):
        """Invalidate cache entries matching a pattern"""
        keys_to_remove = []
        
        for key, entry in self.cache.items():
            if pattern.lower() in entry["prompt"].lower():
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.cache[key]
            logger.info(f"Invalidated cache entry: {key[:8]}")
        
        return len(keys_to_remove)
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        valid_entries = sum(1 for e in self.cache.values() if self._is_valid_entry(e))
        total_hits = sum(e["hits"] for e in self.cache.values())
        
        hit_rate = self.hit_count / (self.hit_count + self.miss_count) if (self.hit_count + self.miss_count) > 0 else 0
        
        return {
            "size": len(self.cache),
            "valid_entries": valid_entries,
            "hit_count": self.hit_count,
            "miss_count": self.miss_count,
            "hit_rate": hit_rate,
            "total_hits_on_entries": total_hits,
            "memory_usage_mb": self._estimate_memory_usage() / (1024 * 1024)
        }
    
    def _estimate_memory_usage(self) -> int:
        """Estimate memory usage of cache in bytes"""
        total_size = 0
        for entry in self.cache.values():
            # Rough estimation
            total_size += len(entry["prompt"].encode())
            total_size += len(entry["response"].encode())
            total_size += 100  # Overhead for metadata
        
        return total_size
    
    def cleanup_expired(self):
        """Remove expired entries from cache"""
        keys_to_remove = []
        
        for key, entry in self.cache.items():
            if not self._is_valid_entry(entry):
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.cache[key]
        
        if keys_to_remove:
            logger.info(f"Cleaned up {len(keys_to_remove)} expired cache entries")
        
        return len(keys_to_remove)
    
    def get_hot_prompts(self, top_n: int = 10) -> List[Dict]:
        """Get the most frequently accessed prompts"""
        sorted_entries = sorted(
            self.cache.values(),
            key=lambda e: e["hits"],
            reverse=True
        )
        
        hot_prompts = []
        for entry in sorted_entries[:top_n]:
            hot_prompts.append({
                "prompt": entry["prompt"][:100] + "..." if len(entry["prompt"]) > 100 else entry["prompt"],
                "model": entry["model"],
                "hits": entry["hits"],
                "age_hours": (time.time() - entry["timestamp"]) / 3600
            })
        
        return hot_prompts
    
    def export_cache(self) -> Dict:
        """Export cache for persistence or analysis"""
        return {
            "metadata": {
                "size": len(self.cache),
                "max_size": self.max_size,
                "ttl_seconds": self.ttl_seconds,
                "stats": self.get_stats()
            },
            "entries": [
                {
                    "prompt": entry["prompt"],
                    "model": entry["model"],
                    "response": entry["response"][:500] + "..." if len(entry["response"]) > 500 else entry["response"],
                    "hits": entry["hits"],
                    "age_seconds": time.time() - entry["timestamp"]
                }
                for entry in list(self.cache.values())[:20]  # Export top 20 for review
            ]
        }
    
    def import_cache(self, data: Dict):
        """Import cache from exported data"""
        if "entries" in data:
            for entry_data in data["entries"]:
                self.set(
                    prompt=entry_data["prompt"],
                    model=entry_data["model"],
                    response=entry_data["response"]
                )
            
            logger.info(f"Imported {len(data['entries'])} cache entries")