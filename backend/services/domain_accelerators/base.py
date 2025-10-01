"""
Domain Accelerator Service
Loads pre-built domain knowledge into knowledge graph
"""

import logging
from typing import Optional
from datetime import datetime

from services.kuzu_knowledge_graph import get_knowledge_graph, KuzuKnowledgeGraph
from .retail import RetailDomainAccelerator
from .financial import FinancialDomainAccelerator
from .healthcare import HealthcareDomainAccelerator

logger = logging.getLogger(__name__)


class DomainAcceleratorService:
    """
    Service for loading and managing domain accelerators
    Populates knowledge graph with pre-built domain knowledge
    """

    def __init__(self, knowledge_graph: Optional[KuzuKnowledgeGraph] = None):
        """Initialize domain accelerator service"""
        self.kg = knowledge_graph or get_knowledge_graph()
        self.accelerators = {
            "retail": RetailDomainAccelerator(),
            "financial": FinancialDomainAccelerator(),
            "healthcare": HealthcareDomainAccelerator()
        }

    def load_domain(self, domain_name: str) -> dict:
        """
        Load all patterns, terms, and rules for a domain into knowledge graph

        Args:
            domain_name: Domain to load (retail, financial, healthcare)

        Returns:
            Summary of loaded data
        """
        logger.info(f"Loading domain: {domain_name}")

        if domain_name not in self.accelerators:
            raise ValueError(f"Unknown domain: {domain_name}. Available: {list(self.accelerators.keys())}")

        if domain_name == "retail":
            return self._load_retail_domain()
        elif domain_name == "financial":
            return self._load_financial_domain()
        elif domain_name == "healthcare":
            return self._load_healthcare_domain()

    def _load_retail_domain(self) -> dict:
        """Load retail domain knowledge"""
        accelerator = self.accelerators["retail"]
        patterns = accelerator.get_patterns()

        loaded_patterns = 0
        for pattern_id, pattern_data in patterns.items():
            try:
                self.kg.create_pattern(
                    pattern_id=f"retail_{pattern_id}",
                    name=pattern_data["name"],
                    category=pattern_data["category"],
                    domain="retail",
                    template=pattern_data,
                    description=pattern_data["description"]
                )
                loaded_patterns += 1
            except Exception as e:
                logger.warning(f"Failed to load pattern {pattern_id}: {e}")

        logger.info(f"✅ Loaded {loaded_patterns} retail patterns")

        return {
            "domain": "retail",
            "patterns_loaded": loaded_patterns,
            "terms_available": len(accelerator.get_business_terms()),
            "quality_rules_available": len(accelerator.get_quality_rules())
        }

    def _load_financial_domain(self) -> dict:
        """Load financial domain knowledge"""
        accelerator = self.accelerators["financial"]
        patterns = accelerator.get_patterns()

        loaded_patterns = 0
        for pattern_id, pattern_data in patterns.items():
            try:
                self.kg.create_pattern(
                    pattern_id=f"financial_{pattern_id}",
                    name=pattern_data["name"],
                    category=pattern_data["category"],
                    domain="financial",
                    template=pattern_data,
                    description=pattern_data["description"]
                )
                loaded_patterns += 1
            except Exception as e:
                logger.warning(f"Failed to load pattern {pattern_id}: {e}")

        logger.info(f"✅ Loaded {loaded_patterns} financial patterns")

        return {
            "domain": "financial",
            "patterns_loaded": loaded_patterns,
            "terms_available": len(accelerator.get_business_terms()),
            "quality_rules_available": len(accelerator.get_quality_rules()),
            "compliance_frameworks": len(accelerator.get_domain_summary()["compliance_frameworks"])
        }

    def _load_healthcare_domain(self) -> dict:
        """Load healthcare domain knowledge"""
        accelerator = self.accelerators["healthcare"]
        patterns = accelerator.get_patterns()

        loaded_patterns = 0
        for pattern_id, pattern_data in patterns.items():
            try:
                self.kg.create_pattern(
                    pattern_id=f"healthcare_{pattern_id}",
                    name=pattern_data["name"],
                    category=pattern_data["category"],
                    domain="healthcare",
                    template=pattern_data,
                    description=pattern_data["description"]
                )
                loaded_patterns += 1
            except Exception as e:
                logger.warning(f"Failed to load pattern {pattern_id}: {e}")

        logger.info(f"✅ Loaded {loaded_patterns} healthcare patterns")

        return {
            "domain": "healthcare",
            "patterns_loaded": loaded_patterns,
            "terms_available": len(accelerator.get_business_terms()),
            "quality_rules_available": len(accelerator.get_quality_rules()),
            "compliance_frameworks": len(accelerator.get_domain_summary()["compliance_frameworks"])
        }

    def load_all_domains(self) -> dict:
        """Load all available domains"""
        results = {}
        for domain_name in self.accelerators.keys():
            try:
                results[domain_name] = self.load_domain(domain_name)
            except Exception as e:
                logger.error(f"Failed to load domain {domain_name}: {e}")
                results[domain_name] = {"error": str(e)}

        return {
            "loaded_domains": len([r for r in results.values() if "error" not in r]),
            "total_domains": len(self.accelerators),
            "results": results
        }

    def get_domain_summary(self, domain_name: str) -> dict:
        """Get summary of domain accelerator"""
        if domain_name not in self.accelerators:
            raise ValueError(f"Unknown domain: {domain_name}")

        return self.accelerators[domain_name].get_domain_summary()

    def get_all_domains_summary(self) -> dict:
        """Get summary of all domain accelerators"""
        return {
            domain_name: accelerator.get_domain_summary()
            for domain_name, accelerator in self.accelerators.items()
        }

    def search_patterns_across_domains(self, use_case: str) -> dict:
        """Search patterns across all domains"""
        results = {}
        for domain_name, accelerator in self.accelerators.items():
            patterns = accelerator.search_patterns(use_case)
            if patterns:
                results[domain_name] = patterns

        return results


# Singleton instance
_service_instance: Optional[DomainAcceleratorService] = None


def get_domain_service() -> DomainAcceleratorService:
    """Get or create the singleton DomainAcceleratorService instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = DomainAcceleratorService()
    return _service_instance
