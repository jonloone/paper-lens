"""
Vultr LLM Service
High-level service wrapper for Vultr LLM with structured response generation
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from .vultr_llm_adapter import VultrLLMAdapter

logger = logging.getLogger(__name__)


class VultrLLMService:
    """
    Service wrapper for Vultr LLM providing high-level capabilities
    including structured response generation for intent analysis and SQL generation
    """

    def __init__(self):
        """Initialize Vultr LLM service"""
        self.adapter = VultrLLMAdapter()
        self.default_model = "qwen2.5-coder-32b-instruct"  # Good for structured tasks

    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        model: Optional[str] = None
    ) -> str:
        """
        Generate text completion

        Args:
            system_prompt: System instruction
            user_prompt: User query
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            model: Model name (optional)

        Returns:
            Generated text response
        """
        return await self.adapter.generate_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            model=model or self.default_model
        )

    async def generate_structured_response(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 800
    ) -> Dict[str, Any]:
        """
        Generate structured JSON response from LLM

        Used for intent extraction and other structured tasks where we need
        the LLM to return JSON that we can parse programmatically.

        Args:
            system_prompt: System instruction (should specify JSON format)
            user_prompt: User query
            temperature: Lower temperature for more consistent structure
            max_tokens: Maximum tokens to generate

        Returns:
            Parsed JSON response as dictionary

        Raises:
            ValueError: If response is not valid JSON
        """
        try:
            # Generate completion
            response_text = await self.adapter.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                model=self.default_model
            )

            # Try to extract JSON from response
            json_response = self._extract_json(response_text)

            if not json_response:
                raise ValueError(f"Could not extract valid JSON from response: {response_text[:200]}")

            return json_response

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response was: {response_text[:500]}")
            raise ValueError(f"LLM did not return valid JSON: {e}")
        except Exception as e:
            logger.error(f"Structured response generation failed: {e}")
            raise

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extract JSON from LLM response

        Handles cases where JSON is wrapped in markdown code blocks or
        has explanatory text before/after.
        """
        # Try to find JSON in code blocks first
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            if end > start:
                json_str = text[start:end].strip()
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass

        # Try to find JSON in generic code blocks
        if "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            if end > start:
                json_str = text[start:end].strip()
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass

        # Try to parse entire response as JSON
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass

        # Try to find JSON object pattern (starts with { and ends with })
        start_idx = text.find('{')
        if start_idx >= 0:
            # Find matching closing brace
            brace_count = 0
            for i in range(start_idx, len(text)):
                if text[i] == '{':
                    brace_count += 1
                elif text[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        json_str = text[start_idx:i+1]
                        try:
                            return json.loads(json_str)
                        except json.JSONDecodeError:
                            break

        return None

    async def generate_sql(
        self,
        prompt: str,
        dialect: str = "trino",
        temperature: float = 0.3,
        max_tokens: int = 1000
    ) -> str:
        """
        Generate SQL query

        Specialized method for SQL generation with appropriate prompting
        and temperature settings.

        Args:
            prompt: Description of what SQL should do
            dialect: SQL dialect (trino, postgres, mysql, etc.)
            temperature: Lower for more consistent SQL
            max_tokens: Maximum tokens for SQL

        Returns:
            Generated SQL query
        """
        system_prompt = f"""You are an expert {dialect.upper()} SQL developer.
Generate syntactically correct {dialect.upper()} SQL queries.

Rules:
1. Use {dialect.upper()} specific syntax
2. Include comments explaining complex logic
3. Use CTEs for clarity when appropriate
4. Always use qualified table names (catalog.schema.table)
5. Add appropriate indexes hints if needed
6. Return ONLY the SQL query, no explanations before or after

Format:
```sql
-- Query purpose
SELECT ...
FROM ...
WHERE ...
```
"""

        response = await self.adapter.generate_completion(
            system_prompt=system_prompt,
            user_prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            model=self.default_model
        )

        # Extract SQL from response
        sql = self._extract_sql(response)
        return sql

    def _extract_sql(self, text: str) -> str:
        """Extract SQL from LLM response"""
        # Check if SQL is in code block
        if "```sql" in text:
            start = text.find("```sql") + 6
            end = text.find("```", start)
            if end > start:
                return text[start:end].strip()
        elif "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            if end > start:
                return text[start:end].strip()

        # Return entire response if no code block found
        return text.strip()


# Singleton instance
_llm_service = None

def get_llm_service() -> VultrLLMService:
    """Get or create singleton LLM service instance"""
    global _llm_service
    if _llm_service is None:
        _llm_service = VultrLLMService()
    return _llm_service
