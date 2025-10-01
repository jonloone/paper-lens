"""
Contract Generation Assistant using KAG Intelligence
Provides AI-powered contract suggestions based on business requirements
"""

from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import json

from services.kuzu_knowledge_graph import KuzuKnowledgeGraph, get_knowledge_graph
from services.kag_intelligence import KAGIntelligence, get_kag_intelligence

logger = logging.getLogger(__name__)


class ContractAssistant:
    """
    AI-powered assistant for generating data contract suggestions
    Uses KAG (Knowledge-Augmented Generation) with graph reasoning
    """

    def __init__(
        self,
        knowledge_graph: Optional[KuzuKnowledgeGraph] = None,
        kag_intelligence: Optional[KAGIntelligence] = None
    ):
        """Initialize Contract Assistant with KAG components"""
        self.kg = knowledge_graph or get_knowledge_graph()
        self.kag = kag_intelligence or get_kag_intelligence()

    async def suggest_contract(
        self,
        requirements: str,
        domain: str,
        critical_fields: List[str],
        min_confidence: float = 0.5
    ) -> Dict[str, Any]:
        """
        Generate intelligent contract suggestion based on requirements

        Args:
            requirements: Natural language business requirements
            domain: Domain (retail, financial, healthcare, etc.)
            critical_fields: Fields that must be included
            min_confidence: Minimum confidence threshold

        Returns:
            {
                "contract": {...},  # Suggested contract
                "similar_contracts": [...],  # Similar successful contracts
                "confidence": 0.85,  # Confidence score
                "reasoning": {...}  # Explainable reasoning
            }
        """
        # Validate inputs
        if not requirements or not requirements.strip():
            raise ValueError("Requirements cannot be empty")

        logger.info(f"Generating contract suggestion for domain: {domain}")

        # Step 1: Find similar successful contracts via graph search
        similar_contracts = await self._find_similar_contracts(
            domain=domain,
            critical_fields=critical_fields
        )

        # Step 2: Extract common patterns from similar contracts
        patterns = self._extract_patterns(similar_contracts, critical_fields)

        # Step 3: Use KAG to synthesize requirements with graph knowledge
        synthesis = await self._synthesize_with_kag(
            requirements=requirements,
            domain=domain,
            critical_fields=critical_fields,
            similar_contracts=similar_contracts,
            patterns=patterns
        )

        # Step 4: Generate contract suggestion
        contract = self._generate_contract(
            requirements=requirements,
            domain=domain,
            critical_fields=critical_fields,
            patterns=patterns,
            synthesis=synthesis
        )

        # Step 5: Recommend quality rules
        quality_rules = self._recommend_quality_rules(
            critical_fields=critical_fields,
            similar_contracts=similar_contracts,
            patterns=patterns
        )
        contract["quality_rules"] = quality_rules

        # Step 6: Calculate confidence score
        confidence = self._calculate_confidence(
            similar_contracts=similar_contracts,
            patterns=patterns,
            critical_fields=critical_fields,
            synthesis=synthesis
        )

        # Step 7: Build reasoning explanation
        reasoning = self._build_reasoning(
            requirements=requirements,
            similar_contracts=similar_contracts,
            patterns=patterns,
            critical_fields=critical_fields,
            synthesis=synthesis
        )

        return {
            "contract": contract,
            "similar_contracts": similar_contracts,
            "confidence": confidence,
            "reasoning": reasoning,
            "requires_approval": True  # Always require human approval
        }

    async def _find_similar_contracts(
        self,
        domain: str,
        critical_fields: List[str]
    ) -> List[Dict[str, Any]]:
        """Find similar successful contracts via graph search"""
        if not domain:
            return []

        # Query knowledge graph for similar contracts
        similar = self.kg.find_similar_contracts(
            domain=domain,
            schema_fields=critical_fields,
            min_success_rate=0.7,  # Only high-performing contracts
            limit=5
        )

        return similar

    def _extract_patterns(
        self,
        similar_contracts: List[Dict[str, Any]],
        critical_fields: List[str]
    ) -> Dict[str, Any]:
        """Extract common patterns from similar contracts"""
        if not similar_contracts:
            return {
                "common_fields": set(critical_fields),
                "common_quality_rules": [],
                "avg_success_rate": 0.0,
                "field_frequency": {}
            }

        # Analyze field frequency across similar contracts
        field_frequency = {}
        all_quality_rules = []

        for contract in similar_contracts:
            schema = contract.get("schema", {})
            properties = schema.get("properties", {})

            for field_name in properties.keys():
                field_frequency[field_name] = field_frequency.get(field_name, 0) + 1

            # Collect quality rules
            quality_rules = contract.get("quality_rules", [])
            all_quality_rules.extend(quality_rules)

        # Find most common fields
        common_fields = set(critical_fields)
        for field, freq in field_frequency.items():
            if freq >= len(similar_contracts) * 0.5:  # In >50% of contracts
                common_fields.add(field)

        # Find common quality rule patterns
        rule_patterns = {}
        for rule in all_quality_rules:
            rule_type = rule.get("rule")
            if rule_type:
                rule_patterns[rule_type] = rule_patterns.get(rule_type, 0) + 1

        common_quality_rules = [
            {"rule": rule_type, "frequency": count}
            for rule_type, count in rule_patterns.items()
            if count >= len(similar_contracts) * 0.3  # In >30% of contracts
        ]

        # Calculate average success rate
        success_rates = [c.get("success_rate", 0.0) for c in similar_contracts]
        avg_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0.0

        return {
            "common_fields": common_fields,
            "common_quality_rules": common_quality_rules,
            "avg_success_rate": avg_success_rate,
            "field_frequency": field_frequency
        }

    async def _synthesize_with_kag(
        self,
        requirements: str,
        domain: str,
        critical_fields: List[str],
        similar_contracts: List[Dict[str, Any]],
        patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Use KAG to synthesize requirements with graph knowledge"""
        # Build context for KAG
        context = {
            "similar_contracts_count": len(similar_contracts),
            "common_fields": list(patterns["common_fields"]),
            "avg_success_rate": patterns["avg_success_rate"]
        }

        # Query KAG for reasoning
        try:
            kag_result = await self.kag.query_with_reasoning(
                query=f"Analyze requirements for {domain} domain: {requirements}",
                domain=domain,
                context=context
            )

            return {
                "synthesis": kag_result.get("synthesis", ""),
                "confidence": kag_result.get("confidence", 0.5),
                "reasoning_path": kag_result.get("reasoning_path", [])
            }
        except Exception as e:
            logger.warning(f"KAG synthesis failed, using fallback: {e}")
            return {
                "synthesis": f"Generated contract for {domain} domain based on similar contracts",
                "confidence": 0.6,
                "reasoning_path": []
            }

    def _generate_contract(
        self,
        requirements: str,
        domain: str,
        critical_fields: List[str],
        patterns: Dict[str, Any],
        synthesis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate contract suggestion from patterns and synthesis"""
        # Build schema properties
        properties = {}

        # Add critical fields
        for field in critical_fields:
            properties[field] = {
                "type": "string",
                "description": f"Required field: {field}"
            }

        # Add common fields from patterns
        for field in patterns["common_fields"]:
            if field not in properties:
                # Infer type based on field name
                field_type = self._infer_field_type(field)
                properties[field] = {
                    "type": field_type,
                    "description": f"Recommended from similar contracts"
                }

        # Build schema
        schema = {
            "type": "object",
            "properties": properties,
            "required": critical_fields
        }

        # Generate contract
        contract = {
            "name": f"{domain.title()} Data Contract",
            "domain": domain,
            "version": "1.0.0",
            "schema": schema,
            "description": requirements,
            "generated_at": datetime.now().isoformat(),
            "generated_by": "ContractAssistant"
        }

        return contract

    def _infer_field_type(self, field_name: str) -> str:
        """Infer field type from field name"""
        field_lower = field_name.lower()

        if any(keyword in field_lower for keyword in ["count", "total", "quantity", "number"]):
            return "integer"
        elif any(keyword in field_lower for keyword in ["amount", "value", "price", "rate", "score"]):
            return "number"
        elif any(keyword in field_lower for keyword in ["date", "time", "timestamp"]):
            return "string"  # With format annotation
        elif any(keyword in field_lower for keyword in ["is_", "has_", "active", "enabled"]):
            return "boolean"
        else:
            return "string"

    def _recommend_quality_rules(
        self,
        critical_fields: List[str],
        similar_contracts: List[Dict[str, Any]],
        patterns: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Recommend quality rules based on similar contracts"""
        recommended_rules = []

        # Add uniqueness for ID fields
        for field in critical_fields:
            if "id" in field.lower():
                recommended_rules.append({
                    "rule": "unique",
                    "field": field,
                    "description": "Ensure unique identifiers"
                })

        # Add completeness rules for critical fields
        for field in critical_fields:
            recommended_rules.append({
                "rule": "completeness",
                "field": field,
                "threshold": 0.95,
                "description": "Ensure high data completeness"
            })

        # Add rules from common patterns
        for rule_pattern in patterns["common_quality_rules"]:
            rule_type = rule_pattern["rule"]
            # Apply to relevant fields
            for field in critical_fields:
                if self._is_rule_applicable(rule_type, field):
                    recommended_rules.append({
                        "rule": rule_type,
                        "field": field,
                        "source": "similar_contracts"
                    })

        # Deduplicate rules
        unique_rules = []
        seen = set()
        for rule in recommended_rules:
            key = (rule["rule"], rule["field"])
            if key not in seen:
                seen.add(key)
                unique_rules.append(rule)

        return unique_rules

    def _is_rule_applicable(self, rule_type: str, field_name: str) -> bool:
        """Check if a quality rule is applicable to a field"""
        field_lower = field_name.lower()

        rule_applicability = {
            "email_format": ["email", "mail"],
            "positive_value": ["amount", "value", "price", "count", "quantity"],
            "date_format": ["date", "time", "timestamp"],
            "phone_format": ["phone", "mobile", "telephone"]
        }

        if rule_type in rule_applicability:
            keywords = rule_applicability[rule_type]
            return any(keyword in field_lower for keyword in keywords)

        return False

    def _calculate_confidence(
        self,
        similar_contracts: List[Dict[str, Any]],
        patterns: Dict[str, Any],
        critical_fields: List[str],
        synthesis: Dict[str, Any]
    ) -> float:
        """Calculate confidence score for the suggestion"""
        confidence_factors = []

        # Factor 1: Number of similar contracts found (0-0.3)
        if similar_contracts:
            contract_factor = min(len(similar_contracts) / 5.0, 1.0) * 0.3
            confidence_factors.append(contract_factor)
        else:
            confidence_factors.append(0.0)

        # Factor 2: Average success rate of similar contracts (0-0.3)
        avg_success = patterns.get("avg_success_rate", 0.0)
        confidence_factors.append(avg_success * 0.3)

        # Factor 3: Field coverage (0-0.2)
        if critical_fields:
            coverage = len(patterns["common_fields"]) / (len(critical_fields) + 5)
            confidence_factors.append(min(coverage, 1.0) * 0.2)
        else:
            confidence_factors.append(0.1)

        # Factor 4: KAG synthesis confidence (0-0.2)
        kag_confidence = synthesis.get("confidence", 0.5)
        confidence_factors.append(kag_confidence * 0.2)

        # Total confidence
        total_confidence = sum(confidence_factors)

        return round(total_confidence, 2)

    def _build_reasoning(
        self,
        requirements: str,
        similar_contracts: List[Dict[str, Any]],
        patterns: Dict[str, Any],
        critical_fields: List[str],
        synthesis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build explainable reasoning for the suggestion"""
        reasoning_steps = []

        # Step 1: Similar contract discovery
        if similar_contracts:
            reasoning_steps.append({
                "step": 1,
                "action": "Found similar contracts via graph search",
                "details": f"Discovered {len(similar_contracts)} similar contracts in the domain",
                "contracts": [c.get("id") for c in similar_contracts]
            })
        else:
            reasoning_steps.append({
                "step": 1,
                "action": "No similar contracts found",
                "details": "Generated contract from requirements and best practices"
            })

        # Step 2: Pattern extraction
        reasoning_steps.append({
            "step": 2,
            "action": "Extracted common patterns",
            "details": f"Identified {len(patterns['common_fields'])} common fields",
            "common_fields": list(patterns["common_fields"])
        })

        # Step 3: KAG synthesis
        reasoning_steps.append({
            "step": 3,
            "action": "Applied AI reasoning",
            "details": synthesis.get("synthesis", ""),
            "confidence": synthesis.get("confidence", 0.0)
        })

        # Step 4: Quality rules
        reasoning_steps.append({
            "step": 4,
            "action": "Recommended quality rules",
            "details": f"Applied {len(patterns['common_quality_rules'])} quality rule patterns"
        })

        # Build similarity analysis
        similarity_analysis = {
            "matched_fields": list(patterns["common_fields"]),
            "field_frequency": patterns["field_frequency"],
            "avg_success_rate": patterns["avg_success_rate"]
        }

        return {
            "steps": reasoning_steps,
            "similarity_analysis": similarity_analysis,
            "reasoning_path": synthesis.get("reasoning_path", [])
        }


# Singleton instance
_assistant_instance: Optional[ContractAssistant] = None


def get_contract_assistant() -> ContractAssistant:
    """Get or create the singleton ContractAssistant instance"""
    global _assistant_instance
    if _assistant_instance is None:
        _assistant_instance = ContractAssistant()
    return _assistant_instance
