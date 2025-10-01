"""
Vultr Inference API Adapter for Python Backend
Provides LLM capabilities using Vultr's inference service
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
import httpx
from datetime import datetime

logger = logging.getLogger(__name__)


class VultrLLMAdapter:
    """
    Adapter for Vultr's inference API
    Compatible with OpenAI-style chat completions
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        default_model: str = "qwen2.5-coder-32b-instruct"  # Vultr model - good for code/data tasks
    ):
        """Initialize Vultr LLM adapter"""
        self.api_key = api_key or os.getenv("VULTR_API_KEY", "")
        self.base_url = base_url or os.getenv(
            "VULTR_INFERENCE_URL",
            "https://api.vultrinference.com/v1"
        )
        self.default_model = default_model

        if not self.api_key:
            logger.warning("VULTR_API_KEY not configured - using fallback mode")

    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        model: Optional[str] = None
    ) -> str:
        """
        Generate text completion using Vultr inference API

        Args:
            system_prompt: System instruction for the model
            user_prompt: User query/prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            model: Model name (optional, uses default if not specified)

        Returns:
            Generated text response
        """
        if not self.api_key:
            logger.warning("Vultr API key not configured, returning fallback response")
            return self._get_fallback_response(user_prompt)

        request_data = {
            "model": model or self.default_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": 0.9,
            "stream": False
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=request_data,
                    timeout=30.0
                )

                if response.status_code != 200:
                    logger.error(f"Vultr API error: {response.status_code} {response.text}")
                    return self._get_fallback_response(user_prompt)

                data = response.json()

                if "choices" in data and len(data["choices"]) > 0:
                    content = data["choices"][0]["message"]["content"]
                    logger.info(f"✅ Vultr API response received ({len(content)} chars)")
                    return content

                raise ValueError("No completion returned from Vultr API")

        except Exception as e:
            logger.error(f"Vultr API call failed: {e}")
            return self._get_fallback_response(user_prompt)

    async def generate_structured_response(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: Dict[str, Any],
        temperature: float = 0.7,
        max_tokens: int = 1500
    ) -> Dict[str, Any]:
        """
        Generate structured JSON response matching a schema

        Args:
            system_prompt: System instruction
            user_prompt: User query
            schema: JSON schema for the expected response
            temperature: Sampling temperature
            max_tokens: Maximum tokens

        Returns:
            Parsed JSON dictionary matching schema
        """
        enhanced_system_prompt = f"""{system_prompt}

You must respond with valid JSON that matches this schema:
{json.dumps(schema, indent=2)}

Important: Return ONLY the JSON object, no additional text or markdown formatting."""

        response_text = await self.generate_completion(
            system_prompt=enhanced_system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )

        try:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(response_text)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Response text: {response_text[:500]}")
            return self._generate_default_from_schema(schema)

    async def batch_process(
        self,
        requests: List[Dict[str, Any]],
        delay_ms: int = 100
    ) -> List[str]:
        """
        Process multiple requests in parallel with rate limiting

        Args:
            requests: List of dicts with 'system_prompt', 'user_prompt', 'options'
            delay_ms: Delay between requests in milliseconds

        Returns:
            List of response strings
        """
        import asyncio

        async def process_with_delay(index: int, req: Dict[str, Any]) -> str:
            await asyncio.sleep(index * delay_ms / 1000.0)
            return await self.generate_completion(
                system_prompt=req.get("system_prompt", ""),
                user_prompt=req.get("user_prompt", ""),
                **req.get("options", {})
            )

        tasks = [process_with_delay(i, req) for i, req in enumerate(requests)]
        results = await asyncio.gather(*tasks)
        return results

    def _get_fallback_response(self, prompt: str) -> str:
        """Generate contextual fallback response when API unavailable"""
        prompt_lower = prompt.lower()

        # Contract-related queries
        if any(word in prompt_lower for word in ["contract", "schema", "odcs"]):
            return json.dumps({
                "suggestion": "Contract generation requires API access",
                "fallback_mode": True,
                "recommendation": "Configure VULTR_API_KEY environment variable"
            })

        # Pattern-related queries
        if any(word in prompt_lower for word in ["pattern", "template", "reuse"]):
            return json.dumps({
                "patterns": [],
                "message": "Pattern matching requires API access",
                "fallback_mode": True
            })

        # Impact analysis
        if any(word in prompt_lower for word in ["impact", "affected", "downstream"]):
            return json.dumps({
                "impact": "unknown",
                "affected_items": [],
                "message": "Impact analysis requires API access",
                "fallback_mode": True
            })

        # Business context
        if any(word in prompt_lower for word in ["business", "stakeholder", "revenue"]):
            return "Business impact analysis requires API access. Please configure VULTR_API_KEY."

        # Generic fallback
        return "API access required for AI-powered analysis. Please configure VULTR_API_KEY environment variable."

    def _generate_default_from_schema(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate default object structure from schema"""
        result = {}

        for key, value in schema.items():
            if isinstance(value, dict):
                if value.get("type") == "string":
                    result[key] = value.get("default", "")
                elif value.get("type") == "number":
                    result[key] = value.get("default", 0)
                elif value.get("type") == "boolean":
                    result[key] = value.get("default", False)
                elif value.get("type") == "array":
                    result[key] = []
                elif value.get("type") == "object":
                    result[key] = self._generate_default_from_schema(
                        value.get("properties", {})
                    )
            else:
                result[key] = None

        return result

    async def test_connection(self) -> bool:
        """Test connection to Vultr API"""
        if not self.api_key:
            logger.warning("No API key configured")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=10.0
                )
                success = response.status_code == 200
                if success:
                    logger.info("✅ Vultr API connection successful")
                else:
                    logger.warning(f"⚠️  Vultr API connection failed: {response.status_code}")
                return success

        except Exception as e:
            logger.error(f"Vultr API connection test failed: {e}")
            return False


# Singleton instance
_vultr_adapter: Optional[VultrLLMAdapter] = None


def get_vultr_adapter() -> VultrLLMAdapter:
    """Get or create singleton Vultr LLM adapter instance"""
    global _vultr_adapter
    if _vultr_adapter is None:
        _vultr_adapter = VultrLLMAdapter()
    return _vultr_adapter
