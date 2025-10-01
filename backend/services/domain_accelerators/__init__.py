"""
Domain Accelerators for NexusOne
Pre-loaded domain knowledge for rapid data product development
"""

from .retail import RetailDomainAccelerator
from .financial import FinancialDomainAccelerator
from .healthcare import HealthcareDomainAccelerator
from .base import DomainAcceleratorService

__all__ = [
    "RetailDomainAccelerator",
    "FinancialDomainAccelerator",
    "HealthcareDomainAccelerator",
    "DomainAcceleratorService",
    "get_domain_accelerator"
]


def get_domain_accelerator(domain: str) -> DomainAcceleratorService:
    """
    Get domain accelerator instance for specified domain

    Args:
        domain: Domain name (retail, financial, healthcare)

    Returns:
        Domain accelerator instance

    Raises:
        ValueError: If domain not supported
    """
    domain_map = {
        "retail": RetailDomainAccelerator,
        "financial": FinancialDomainAccelerator,
        "healthcare": HealthcareDomainAccelerator
    }

    domain_lower = domain.lower()
    if domain_lower not in domain_map:
        raise ValueError(
            f"Domain '{domain}' not supported. "
            f"Available domains: {', '.join(domain_map.keys())}"
        )

    return domain_map[domain_lower]()
