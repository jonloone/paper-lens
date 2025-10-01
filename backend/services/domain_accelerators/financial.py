"""
Financial Domain Accelerator
Pre-loaded patterns, business terms, and best practices for financial services
"""

from typing import Dict, List, Any

# ========================================================================
# Financial Patterns
# ========================================================================

FINANCIAL_PATTERNS = {
    "fraud_detection": {
        "name": "Real-time Fraud Detection",
        "description": "Detect fraudulent transactions using ML models and rule-based systems",
        "category": "security",
        "required_sources": ["transactions", "account_info", "device_data", "behavioral_data"],
        "core_fields": ["transaction_id", "fraud_score", "risk_indicators", "fraud_type"],
        "transformations": [
            "feature_engineering",
            "anomaly_detection",
            "rule_based_scoring",
            "ml_model_scoring"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "transaction_id"},
            {"rule": "score_bounds", "field": "fraud_score", "min": 0.0, "max": 1.0},
            {"rule": "completeness", "field": "risk_indicators", "threshold": 0.98},
            {"rule": "freshness", "field": "scored_at", "max_age_seconds": 5}
        ],
        "compliance": ["PCI-DSS", "SOX", "GDPR"],
        "success_rate": 0.91,
        "implementations": 38,
        "avg_build_time_hours": 48
    },

    "credit_risk_scoring": {
        "name": "Credit Risk Assessment",
        "description": "Assess creditworthiness and default risk for lending decisions",
        "category": "risk",
        "required_sources": ["credit_bureau", "account_history", "income_data", "market_data"],
        "core_fields": ["account_id", "credit_score", "risk_level", "default_probability"],
        "transformations": [
            "credit_history_analysis",
            "income_verification",
            "debt_ratio_calculation",
            "risk_modeling"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "account_id"},
            {"rule": "score_bounds", "field": "credit_score", "min": 300, "max": 850},
            {"rule": "score_bounds", "field": "default_probability", "min": 0.0, "max": 1.0},
            {"rule": "freshness", "field": "assessed_at", "max_age_hours": 24}
        ],
        "compliance": ["Fair Credit Reporting Act", "Equal Credit Opportunity Act"],
        "success_rate": 0.87,
        "implementations": 29,
        "avg_build_time_hours": 56
    },

    "aml_monitoring": {
        "name": "Anti-Money Laundering (AML) Monitoring",
        "description": "Monitor transactions for suspicious patterns and money laundering activities",
        "category": "compliance",
        "required_sources": ["transactions", "customer_profile", "network_analysis", "watchlist"],
        "core_fields": ["customer_id", "alert_score", "suspicious_patterns", "investigation_priority"],
        "transformations": [
            "transaction_pattern_analysis",
            "network_graph_analysis",
            "watchlist_matching",
            "risk_aggregation"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "customer_id"},
            {"rule": "completeness", "field": "suspicious_patterns", "threshold": 1.0},
            {"rule": "freshness", "field": "monitored_at", "max_age_hours": 1}
        ],
        "compliance": ["Bank Secrecy Act", "USA PATRIOT Act", "FinCEN"],
        "success_rate": 0.89,
        "implementations": 22,
        "avg_build_time_hours": 64
    },

    "portfolio_optimization": {
        "name": "Investment Portfolio Optimization",
        "description": "Optimize investment portfolios based on risk tolerance and return objectives",
        "category": "analytics",
        "required_sources": ["market_data", "portfolio_holdings", "risk_parameters", "client_goals"],
        "core_fields": ["portfolio_id", "recommended_allocation", "expected_return", "risk_metrics"],
        "transformations": [
            "risk_return_analysis",
            "correlation_calculation",
            "optimization_algorithm",
            "rebalancing_suggestions"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "portfolio_id"},
            {"rule": "sum_to_one", "field": "allocation_weights"},
            {"rule": "positive_value", "field": "expected_return"},
            {"rule": "freshness", "field": "optimized_at", "max_age_hours": 24}
        ],
        "compliance": ["Investment Advisers Act", "Fiduciary Rule"],
        "success_rate": 0.85,
        "implementations": 16,
        "avg_build_time_hours": 52
    },

    "regulatory_reporting": {
        "name": "Automated Regulatory Reporting",
        "description": "Generate regulatory reports and ensure compliance with financial regulations",
        "category": "compliance",
        "required_sources": ["transactions", "accounts", "positions", "customer_data"],
        "core_fields": ["report_id", "report_type", "filing_data", "validation_status"],
        "transformations": [
            "data_aggregation",
            "regulatory_mapping",
            "validation_checks",
            "report_generation"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "report_id"},
            {"rule": "completeness", "field": "filing_data", "threshold": 1.0},
            {"rule": "valid_values", "field": "validation_status", "values": ["passed", "failed", "pending"]},
            {"rule": "timeliness", "field": "generated_at"}
        ],
        "compliance": ["SEC", "FINRA", "CFTC", "Basel III"],
        "success_rate": 0.93,
        "implementations": 25,
        "avg_build_time_hours": 72
    }
}


# ========================================================================
# Financial Business Terms
# ========================================================================

FINANCIAL_BUSINESS_TERMS = {
    "Annual Percentage Rate (APR)": {
        "definition": "The annual rate charged for borrowing or earned through an investment, including fees",
        "aliases": ["APR", "Interest Rate"],
        "related_fields": ["apr", "interest_rate", "annual_rate"],
        "calculation": "Interest + Fees / Principal / Term * 365 * 100",
        "importance": "high",
        "typical_range": "0% - 30%"
    },

    "Debt-to-Income Ratio (DTI)": {
        "definition": "Percentage of gross monthly income that goes toward paying debts",
        "aliases": ["DTI", "Debt Ratio"],
        "related_fields": ["dti", "debt_ratio", "income_ratio"],
        "calculation": "Total Monthly Debt Payments / Gross Monthly Income * 100",
        "importance": "high",
        "typical_range": "0% - 50%"
    },

    "Value at Risk (VaR)": {
        "definition": "Maximum potential loss in portfolio value over a specific time period at a given confidence level",
        "aliases": ["VaR", "Risk Exposure"],
        "related_fields": ["var", "value_at_risk", "risk_measure"],
        "calculation": "Statistical measure based on historical returns and volatility",
        "importance": "high",
        "typical_range": "Depends on portfolio"
    },

    "Sharpe Ratio": {
        "definition": "Measure of risk-adjusted return of an investment",
        "aliases": ["Risk-Adjusted Return"],
        "related_fields": ["sharpe_ratio", "risk_adjusted_return"],
        "calculation": "(Portfolio Return - Risk-Free Rate) / Portfolio Standard Deviation",
        "importance": "high",
        "typical_range": "-1.0 to 3.0"
    },

    "Capital Adequacy Ratio (CAR)": {
        "definition": "Measure of bank's capital expressed as percentage of risk-weighted assets",
        "aliases": ["CAR", "Capital Ratio"],
        "related_fields": ["car", "capital_ratio", "tier1_ratio"],
        "calculation": "(Tier 1 Capital + Tier 2 Capital) / Risk Weighted Assets * 100",
        "importance": "critical",
        "typical_range": "8% - 20%"
    },

    "Net Interest Margin (NIM)": {
        "definition": "Difference between interest income and interest expenses as percentage of earning assets",
        "aliases": ["NIM", "Interest Margin"],
        "related_fields": ["nim", "net_interest_margin", "interest_spread"],
        "calculation": "(Interest Income - Interest Expense) / Average Earning Assets * 100",
        "importance": "high",
        "typical_range": "2% - 5%"
    }
}


# ========================================================================
# Financial Quality Rules
# ========================================================================

FINANCIAL_QUALITY_RULES = {
    "transaction_data": [
        {"rule": "unique", "field": "transaction_id", "priority": "critical"},
        {"rule": "positive_value", "field": "amount", "priority": "critical"},
        {"rule": "valid_currency", "field": "currency", "priority": "critical"},
        {"rule": "timeliness", "field": "transaction_timestamp", "priority": "critical"},
        {"rule": "referential_integrity", "field": "account_id", "priority": "high"}
    ],

    "account_data": [
        {"rule": "unique", "field": "account_id", "priority": "critical"},
        {"rule": "valid_account_type", "field": "account_type", "priority": "high"},
        {"rule": "non_negative", "field": "balance", "priority": "critical"},
        {"rule": "pii_protection", "field": "ssn", "priority": "critical"}
    ],

    "risk_data": [
        {"rule": "score_bounds", "field": "risk_score", "min": 0.0, "max": 1.0, "priority": "critical"},
        {"rule": "freshness", "field": "scored_at", "max_age_hours": 24, "priority": "high"},
        {"rule": "completeness", "field": "risk_factors", "threshold": 0.98, "priority": "high"}
    ]
}


# ========================================================================
# Financial Domain Accelerator Class
# ========================================================================

class FinancialDomainAccelerator:
    """
    Financial domain accelerator with pre-loaded knowledge
    Provides instant access to financial patterns, terms, and compliance requirements
    """

    @staticmethod
    def get_patterns() -> Dict[str, Any]:
        """Get all financial patterns"""
        return FINANCIAL_PATTERNS

    @staticmethod
    def get_business_terms() -> Dict[str, Any]:
        """Get all financial business terms"""
        return FINANCIAL_BUSINESS_TERMS

    @staticmethod
    def get_quality_rules() -> Dict[str, Any]:
        """Get financial-specific quality rules"""
        return FINANCIAL_QUALITY_RULES

    @staticmethod
    def get_pattern(pattern_id: str) -> Dict[str, Any]:
        """Get a specific pattern by ID"""
        return FINANCIAL_PATTERNS.get(pattern_id, {})

    @staticmethod
    def get_compliance_requirements(pattern_id: str) -> List[str]:
        """Get compliance requirements for a pattern"""
        pattern = FINANCIAL_PATTERNS.get(pattern_id, {})
        return pattern.get("compliance", [])

    @staticmethod
    def search_patterns(use_case: str) -> List[Dict[str, Any]]:
        """Search patterns by use case keywords"""
        use_case_lower = use_case.lower()
        results = []

        for pattern_id, pattern in FINANCIAL_PATTERNS.items():
            name_lower = pattern["name"].lower()
            desc_lower = pattern["description"].lower()

            if any(keyword in name_lower or keyword in desc_lower
                   for keyword in use_case_lower.split()):
                pattern_copy = pattern.copy()
                pattern_copy["id"] = pattern_id
                results.append(pattern_copy)

        results.sort(key=lambda x: x.get("success_rate", 0.0), reverse=True)
        return results

    @staticmethod
    def get_domain_summary() -> Dict[str, Any]:
        """Get summary of financial domain knowledge"""
        return {
            "domain": "financial",
            "patterns_count": len(FINANCIAL_PATTERNS),
            "terms_count": len(FINANCIAL_BUSINESS_TERMS),
            "avg_success_rate": sum(p["success_rate"] for p in FINANCIAL_PATTERNS.values()) / len(FINANCIAL_PATTERNS),
            "total_implementations": sum(p["implementations"] for p in FINANCIAL_PATTERNS.values()),
            "categories": list(set(p["category"] for p in FINANCIAL_PATTERNS.values())),
            "compliance_frameworks": list(set(
                comp for p in FINANCIAL_PATTERNS.values()
                for comp in p.get("compliance", [])
            ))
        }
