"""
KAG (Knowledge-Augmented Generation) Intelligence Service
Combines Kuzu graph reasoning with Vultr LLM for intelligent recommendations
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from cachetools import TTLCache

from .kuzu_knowledge_graph import get_knowledge_graph, KuzuKnowledgeGraph
from .vultr_llm_adapter import get_vultr_adapter, VultrLLMAdapter

logger = logging.getLogger(__name__)


class KAGIntelligence:
    """
    Knowledge-Augmented Generation service
    Hybrid reasoning: Graph traversal + LLM understanding
    """

    def __init__(
        self,
        knowledge_graph: Optional[KuzuKnowledgeGraph] = None,
        llm_adapter: Optional[VultrLLMAdapter] = None
    ):
        """Initialize KAG with graph database and LLM"""
        self.kg: KuzuKnowledgeGraph = knowledge_graph or get_knowledge_graph()
        self.llm: VultrLLMAdapter = llm_adapter or get_vultr_adapter()

        # Cache for reasoning results (5 minute TTL)
        self.cache = TTLCache(maxsize=100, ttl=300)

        logger.info("✅ KAG Intelligence initialized")

    # ========================================================================
    # Core Reasoning Methods
    # ========================================================================

    async def query_with_reasoning(
        self,
        query: str,
        domain: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Query knowledge graph with LLM-powered reasoning

        Args:
            query: Natural language query
            domain: Domain to focus on (retail, finance, etc.)
            context: Additional context for the query

        Returns:
            Dict with results, reasoning path, and confidence
        """
        # Check cache
        cache_key = f"{query}:{domain}"
        if cache_key in self.cache:
            logger.info("✅ Cache hit for query")
            return self.cache[cache_key]

        try:
            # Step 1: Use LLM to understand the query intent
            intent = await self._analyze_query_intent(query, domain)

            # Step 2: Execute graph queries based on intent
            graph_results = await self._execute_graph_queries(intent, domain)

            # Step 3: Use LLM to synthesize results with reasoning
            synthesis = await self._synthesize_with_reasoning(
                query=query,
                intent=intent,
                graph_results=graph_results,
                context=context
            )

            result = {
                "query": query,
                "intent": intent,
                "graph_results": graph_results,
                "synthesis": synthesis,
                "reasoning_path": self._generate_reasoning_path(intent, graph_results),
                "confidence": self._calculate_confidence(graph_results, synthesis),
                "timestamp": datetime.now().isoformat()
            }

            # Cache result
            self.cache[cache_key] = result

            logger.info(f"✅ Query completed with confidence {result['confidence']:.2f}")
            return result

        except Exception as e:
            logger.error(f"Query with reasoning failed: {e}")
            return {
                "query": query,
                "error": str(e),
                "fallback_mode": True,
                "confidence": 0.0
            }

    async def find_similar_with_explanation(
        self,
        item_type: str,
        attributes: Dict[str, Any],
        domain: Optional[str] = None,
        min_similarity: float = 0.7
    ) -> Dict[str, Any]:
        """
        Find similar items in graph with LLM explanation

        Args:
            item_type: Type of item (contract, product, pattern)
            attributes: Attributes to match
            domain: Domain filter
            min_similarity: Minimum similarity threshold

        Returns:
            Similar items with explanations
        """
        try:
            # Query graph for similar items
            if item_type == "contract":
                schema_fields = attributes.get("schema_fields", [])
                similar = self.kg.find_similar_contracts(
                    domain=domain or "general",
                    schema_fields=schema_fields,
                    min_success_rate=0.8,
                    limit=5
                )
            elif item_type == "pattern":
                similar = self.kg.find_applicable_patterns(
                    domain=domain or "general",
                    use_case=attributes.get("use_case"),
                    data_sources=attributes.get("data_sources"),
                    limit=5
                )
            else:
                similar = []

            # Filter by similarity threshold
            similar = [s for s in similar if s.get("similarity_score", 0) >= min_similarity]

            if not similar:
                return {
                    "similar_items": [],
                    "explanation": f"No similar {item_type}s found in {domain} domain",
                    "confidence": 0.0
                }

            # Generate explanation for why these are similar
            explanation = await self._explain_similarity(
                item_type=item_type,
                query_attributes=attributes,
                similar_items=similar,
                domain=domain
            )

            return {
                "similar_items": similar,
                "explanation": explanation,
                "count": len(similar),
                "confidence": self._calculate_average_confidence(similar)
            }

        except Exception as e:
            logger.error(f"Find similar failed: {e}")
            return {
                "similar_items": [],
                "error": str(e),
                "confidence": 0.0
            }

    async def analyze_impact_with_reasoning(
        self,
        contract_id: str,
        proposed_changes: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze impact of changes with LLM reasoning

        Args:
            contract_id: Contract to analyze
            proposed_changes: Description of proposed changes

        Returns:
            Impact analysis with reasoning
        """
        try:
            # Get impact from graph
            graph_impact = self.kg.analyze_contract_impact(contract_id, max_depth=3)

            # Use LLM to explain business impact
            business_impact = await self._explain_business_impact(
                contract_id=contract_id,
                proposed_changes=proposed_changes,
                graph_impact=graph_impact
            )

            # Generate migration recommendations
            migration_plan = await self._generate_migration_plan(
                graph_impact=graph_impact,
                proposed_changes=proposed_changes
            )

            return {
                "contract_id": contract_id,
                "proposed_changes": proposed_changes,
                "technical_impact": graph_impact,
                "business_impact": business_impact,
                "migration_plan": migration_plan,
                "risk_level": graph_impact.get("risk_level", "unknown"),
                "confidence": 0.85,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Impact analysis failed: {e}")
            return {
                "contract_id": contract_id,
                "error": str(e),
                "risk_level": "unknown",
                "confidence": 0.0
            }

    # ========================================================================
    # Private Helper Methods
    # ========================================================================

    async def _analyze_query_intent(
        self,
        query: str,
        domain: Optional[str]
    ) -> Dict[str, Any]:
        """Use LLM to understand query intent"""
        system_prompt = """You are an expert at analyzing data engineering queries.
Determine the user's intent and extract key information.

Respond with JSON containing:
- intent_type: search, recommend, analyze, or explain
- entities: list of entities mentioned (contracts, patterns, products)
- domain: data domain if mentioned
- action: what the user wants to do
- key_terms: important keywords for graph search"""

        user_prompt = f"""Analyze this query: "{query}"
Domain context: {domain or 'not specified'}

What is the user trying to accomplish?"""

        try:
            intent = await self.llm.generate_structured_response(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema={
                    "intent_type": {"type": "string"},
                    "entities": {"type": "array"},
                    "domain": {"type": "string"},
                    "action": {"type": "string"},
                    "key_terms": {"type": "array"}
                },
                temperature=0.3  # Lower temperature for consistent intent detection
            )
            return intent

        except Exception as e:
            logger.error(f"Intent analysis failed: {e}")
            return {
                "intent_type": "search",
                "entities": [],
                "domain": domain or "general",
                "action": "find",
                "key_terms": query.split()[:5]
            }

    async def _execute_graph_queries(
        self,
        intent: Dict[str, Any],
        domain: Optional[str]
    ) -> Dict[str, Any]:
        """Execute graph queries based on intent"""
        results = {}

        intent_type = intent.get("intent_type", "search")
        query_domain = domain or intent.get("domain", "general")

        try:
            # Search for contracts
            if "contract" in intent.get("entities", []):
                results["contracts"] = self.kg.find_similar_contracts(
                    domain=query_domain,
                    schema_fields=intent.get("key_terms", []),
                    limit=3
                )

            # Search for patterns
            if "pattern" in intent.get("entities", []) or intent_type == "recommend":
                results["patterns"] = self.kg.find_applicable_patterns(
                    domain=query_domain,
                    limit=5
                )

            # Get graph statistics
            results["stats"] = self.kg.get_graph_statistics()

        except Exception as e:
            logger.error(f"Graph queries failed: {e}")
            results["error"] = str(e)

        return results

    async def _synthesize_with_reasoning(
        self,
        query: str,
        intent: Dict[str, Any],
        graph_results: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> str:
        """Use LLM to synthesize graph results with reasoning"""
        system_prompt = """You are a data engineering expert who explains technical concepts clearly.
Synthesize the graph query results into a clear, actionable response.

Focus on:
1. Answering the user's specific question
2. Explaining why certain recommendations are made
3. Providing confidence based on evidence
4. Being concise but complete"""

        # Prepare context for LLM
        graph_summary = self._summarize_graph_results(graph_results)

        user_prompt = f"""Original query: "{query}"

Intent: {intent.get('action', 'unknown')}

Graph results:
{graph_summary}

Additional context: {json.dumps(context or {}, indent=2)}

Provide a clear, helpful response that:
1. Directly answers the query
2. Explains the reasoning behind recommendations
3. Cites specific evidence from the graph
4. Suggests next steps if appropriate

Keep response to 2-3 paragraphs."""

        try:
            response = await self.llm.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.7,
                max_tokens=500
            )
            return response

        except Exception as e:
            logger.error(f"Synthesis failed: {e}")
            return "Unable to generate synthesis. Please check API configuration."

    async def _explain_similarity(
        self,
        item_type: str,
        query_attributes: Dict[str, Any],
        similar_items: List[Dict[str, Any]],
        domain: Optional[str]
    ) -> str:
        """Generate explanation for why items are similar"""
        system_prompt = f"""You are a data engineering expert explaining why certain {item_type}s are similar.
Be specific about what attributes match and why that matters."""

        top_similar = similar_items[:3]  # Focus on top 3

        user_prompt = f"""Query attributes: {json.dumps(query_attributes, indent=2)}

Found {len(similar_items)} similar {item_type}s in {domain} domain.

Top matches:
{json.dumps(top_similar, indent=2)}

Explain in 2-3 sentences why these are good matches and what they have in common."""

        try:
            explanation = await self.llm.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.6,
                max_tokens=200
            )
            return explanation

        except Exception as e:
            logger.error(f"Similarity explanation failed: {e}")
            return f"Found {len(similar_items)} similar {item_type}s based on attribute matching."

    async def _explain_business_impact(
        self,
        contract_id: str,
        proposed_changes: Dict[str, Any],
        graph_impact: Dict[str, Any]
    ) -> str:
        """Explain business impact in plain language"""
        system_prompt = """You are a business analyst explaining technical changes to stakeholders.
Translate technical impacts into business terms focusing on:
- Which business processes are affected
- What stakeholders need to know
- Timeline and urgency
- Potential risks"""

        user_prompt = f"""Contract: {contract_id}

Proposed changes: {json.dumps(proposed_changes, indent=2)}

Technical impact:
- {graph_impact.get('total_affected_count', 0)} items affected
- Affected domains: {', '.join(graph_impact.get('affected_domains', []))}
- Risk level: {graph_impact.get('risk_level', 'unknown')}
- Breaking change: {graph_impact.get('is_breaking', False)}

Explain the business impact in 2-3 sentences for non-technical stakeholders."""

        try:
            impact = await self.llm.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.5,
                max_tokens=300
            )
            return impact

        except Exception as e:
            logger.error(f"Business impact explanation failed: {e}")
            return f"Changes affect {graph_impact.get('total_affected_count', 0)} downstream items."

    async def _generate_migration_plan(
        self,
        graph_impact: Dict[str, Any],
        proposed_changes: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate migration plan steps"""
        if graph_impact.get('total_affected_count', 0) == 0:
            return []

        system_prompt = """You are a data engineering expert creating migration plans.
Generate specific, actionable steps for implementing changes safely."""

        user_prompt = f"""Impact analysis:
{json.dumps(graph_impact, indent=2)}

Proposed changes:
{json.dumps(proposed_changes, indent=2)}

Create a migration plan with 4-6 specific steps. Each step should have:
- action: what to do
- order: sequence number
- duration: estimated time

Return as JSON array."""

        try:
            plan = await self.llm.generate_structured_response(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema={
                    "steps": {
                        "type": "array",
                        "items": {
                            "action": {"type": "string"},
                            "order": {"type": "number"},
                            "duration": {"type": "string"}
                        }
                    }
                },
                temperature=0.4
            )
            return plan.get("steps", [])

        except Exception as e:
            logger.error(f"Migration plan generation failed: {e}")
            return [
                {"action": "Review affected items", "order": 1, "duration": "1 hour"},
                {"action": "Test changes", "order": 2, "duration": "2 hours"},
                {"action": "Deploy to production", "order": 3, "duration": "1 hour"}
            ]

    # ========================================================================
    # Utility Methods
    # ========================================================================

    def _generate_reasoning_path(
        self,
        intent: Dict[str, Any],
        graph_results: Dict[str, Any]
    ) -> List[str]:
        """Generate human-readable reasoning path"""
        path = []

        path.append(f"1. Analyzed query intent: {intent.get('action', 'unknown')}")

        if "contracts" in graph_results:
            count = len(graph_results["contracts"])
            path.append(f"2. Found {count} similar contracts in graph")

        if "patterns" in graph_results:
            count = len(graph_results["patterns"])
            path.append(f"3. Identified {count} applicable patterns")

        path.append("4. Synthesized results with LLM reasoning")

        return path

    def _calculate_confidence(
        self,
        graph_results: Dict[str, Any],
        synthesis: str
    ) -> float:
        """Calculate confidence score for the result"""
        confidence = 0.5  # Base confidence

        # Boost for graph results
        if graph_results.get("contracts"):
            confidence += 0.2
        if graph_results.get("patterns"):
            confidence += 0.2

        # Reduce for errors
        if "error" in graph_results:
            confidence -= 0.3

        # Boost if synthesis is substantial
        if len(synthesis) > 100:
            confidence += 0.1

        return max(0.0, min(1.0, confidence))

    def _calculate_average_confidence(self, items: List[Dict[str, Any]]) -> float:
        """Calculate average confidence from similar items"""
        if not items:
            return 0.0

        scores = [item.get("similarity_score", 0.5) for item in items]
        return sum(scores) / len(scores)

    def _summarize_graph_results(self, graph_results: Dict[str, Any]) -> str:
        """Create concise summary of graph results"""
        summary_parts = []

        if "contracts" in graph_results:
            contracts = graph_results["contracts"]
            summary_parts.append(f"- {len(contracts)} similar contracts found")
            if contracts:
                top = contracts[0]
                summary_parts.append(
                    f"  Top match: {top['name']} (similarity: {top.get('similarity_score', 0):.2f})"
                )

        if "patterns" in graph_results:
            patterns = graph_results["patterns"]
            summary_parts.append(f"- {len(patterns)} applicable patterns found")
            if patterns:
                top = patterns[0]
                summary_parts.append(
                    f"  Top pattern: {top['name']} (success rate: {top.get('avg_success_rate', 0):.2f})"
                )

        if "stats" in graph_results:
            stats = graph_results["stats"]
            summary_parts.append(f"- Graph contains: {stats}")

        return "\n".join(summary_parts) if summary_parts else "No specific results found"


# Singleton instance
_kag_instance: Optional[KAGIntelligence] = None


def get_kag_intelligence() -> KAGIntelligence:
    """Get or create singleton KAG intelligence instance"""
    global _kag_instance
    if _kag_instance is None:
        _kag_instance = KAGIntelligence()
    return _kag_instance
