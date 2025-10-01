"""
Retail Domain Accelerator
Pre-loaded patterns, business terms, and best practices for retail domain
"""

from typing import Dict, List, Any

# ========================================================================
# Retail Patterns
# ========================================================================

RETAIL_PATTERNS = {
    "customer_360": {
        "name": "Customer 360 View",
        "description": "Unified customer view combining all customer touchpoints and interactions",
        "category": "business",
        "required_sources": ["crm", "transactions", "support", "web_analytics"],
        "core_fields": ["customer_id", "lifetime_value", "segment", "engagement_score"],
        "transformations": [
            "join_customer_data",
            "calculate_ltv",
            "assign_segment",
            "calculate_engagement"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "customer_id"},
            {"rule": "completeness", "field": "customer_id", "threshold": 0.99},
            {"rule": "completeness", "field": "lifetime_value", "threshold": 0.95},
            {"rule": "positive_value", "field": "lifetime_value"},
            {"rule": "valid_values", "field": "segment", "values": ["high_value", "medium_value", "low_value", "at_risk"]}
        ],
        "success_rate": 0.89,
        "implementations": 45,
        "avg_build_time_hours": 24
    },

    "churn_prediction": {
        "name": "Customer Churn Prediction",
        "description": "Predict customer churn risk using behavioral and transactional data",
        "category": "analytics",
        "required_sources": ["transactions", "engagement", "support", "product_usage"],
        "core_fields": ["customer_id", "churn_score", "risk_factors", "predicted_churn_date"],
        "transformations": [
            "feature_engineering",
            "calculate_recency_frequency",
            "model_scoring",
            "risk_classification"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "customer_id"},
            {"rule": "score_bounds", "field": "churn_score", "min": 0.0, "max": 1.0},
            {"rule": "completeness", "field": "risk_factors", "threshold": 0.90},
            {"rule": "freshness", "field": "last_updated", "max_age_hours": 24}
        ],
        "success_rate": 0.84,
        "implementations": 23,
        "avg_build_time_hours": 32
    },

    "product_recommendation": {
        "name": "Product Recommendation Engine",
        "description": "Personalized product recommendations using collaborative and content-based filtering",
        "category": "analytics",
        "required_sources": ["transactions", "product_catalog", "customer_preferences", "browsing_history"],
        "core_fields": ["customer_id", "recommended_products", "confidence_scores", "recommendation_reason"],
        "transformations": [
            "collaborative_filtering",
            "content_based_filtering",
            "hybrid_recommendation",
            "rank_recommendations"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "customer_id"},
            {"rule": "list_not_empty", "field": "recommended_products"},
            {"rule": "score_bounds", "field": "confidence_scores", "min": 0.0, "max": 1.0},
            {"rule": "freshness", "field": "generated_at", "max_age_hours": 6}
        ],
        "success_rate": 0.81,
        "implementations": 18,
        "avg_build_time_hours": 40
    },

    "inventory_optimization": {
        "name": "Inventory Optimization",
        "description": "Optimize inventory levels based on demand forecasting and supply chain data",
        "category": "operations",
        "required_sources": ["inventory", "sales", "supply_chain", "seasonality"],
        "core_fields": ["product_id", "optimal_stock_level", "reorder_point", "forecast_demand"],
        "transformations": [
            "demand_forecasting",
            "calculate_safety_stock",
            "optimize_reorder_point",
            "seasonal_adjustment"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "product_id"},
            {"rule": "positive_value", "field": "optimal_stock_level"},
            {"rule": "positive_value", "field": "reorder_point"},
            {"rule": "freshness", "field": "forecast_updated", "max_age_hours": 24}
        ],
        "success_rate": 0.86,
        "implementations": 15,
        "avg_build_time_hours": 36
    },

    "customer_segmentation": {
        "name": "Customer Segmentation",
        "description": "Segment customers based on behavior, demographics, and purchase patterns",
        "category": "analytics",
        "required_sources": ["crm", "transactions", "demographics", "behavior"],
        "core_fields": ["customer_id", "segment", "segment_score", "segment_attributes"],
        "transformations": [
            "rfm_analysis",
            "clustering",
            "segment_assignment",
            "segment_profiling"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "customer_id"},
            {"rule": "valid_values", "field": "segment", "values": ["champions", "loyal", "at_risk", "lost", "new"]},
            {"rule": "completeness", "field": "segment", "threshold": 0.98}
        ],
        "success_rate": 0.88,
        "implementations": 31,
        "avg_build_time_hours": 20
    }
}


# ========================================================================
# Retail Business Terms
# ========================================================================

RETAIL_BUSINESS_TERMS = {
    "Customer Lifetime Value (CLV)": {
        "definition": "Predicted total revenue that a customer will generate during their entire relationship with the business",
        "aliases": ["LTV", "Lifetime Value", "Customer Value"],
        "related_fields": ["clv", "ltv", "lifetime_value", "customer_value"],
        "calculation": "Sum of discounted future purchases minus acquisition and retention costs",
        "importance": "high",
        "typical_range": "$0 - $10,000"
    },

    "Churn Rate": {
        "definition": "Percentage of customers who stop doing business with the company during a specific time period",
        "aliases": ["Attrition Rate", "Customer Churn"],
        "related_fields": ["churn_rate", "attrition_rate", "customer_retention"],
        "calculation": "(Customers Lost / Total Customers at Start) * 100",
        "importance": "high",
        "typical_range": "2% - 20% annually"
    },

    "RFM Score": {
        "definition": "Customer segmentation model based on Recency, Frequency, and Monetary value",
        "aliases": ["RFM Analysis", "RFM Segmentation"],
        "related_fields": ["rfm_score", "recency", "frequency", "monetary"],
        "calculation": "Composite score from recency of purchase, frequency of purchases, and total spend",
        "importance": "high",
        "typical_range": "111 - 555"
    },

    "Average Order Value (AOV)": {
        "definition": "Average dollar amount spent each time a customer places an order",
        "aliases": ["AOV", "Average Transaction Value"],
        "related_fields": ["aov", "avg_order_value", "average_purchase"],
        "calculation": "Total Revenue / Number of Orders",
        "importance": "medium",
        "typical_range": "$20 - $500"
    },

    "Customer Acquisition Cost (CAC)": {
        "definition": "Total cost of acquiring a new customer, including marketing and sales expenses",
        "aliases": ["CAC", "Acquisition Cost"],
        "related_fields": ["cac", "acquisition_cost", "customer_cost"],
        "calculation": "Total Marketing & Sales Costs / Number of New Customers",
        "importance": "high",
        "typical_range": "$10 - $500"
    },

    "Net Promoter Score (NPS)": {
        "definition": "Measure of customer loyalty and satisfaction based on likelihood to recommend",
        "aliases": ["NPS", "Promoter Score"],
        "related_fields": ["nps", "promoter_score", "loyalty_score"],
        "calculation": "% Promoters (9-10) - % Detractors (0-6)",
        "importance": "high",
        "typical_range": "-100 to +100"
    },

    "Cart Abandonment Rate": {
        "definition": "Percentage of online shopping carts that are abandoned before purchase completion",
        "aliases": ["Abandonment Rate", "Cart Drop-off"],
        "related_fields": ["cart_abandonment", "abandonment_rate", "incomplete_purchases"],
        "calculation": "(Abandoned Carts / Total Carts Created) * 100",
        "importance": "medium",
        "typical_range": "60% - 80%"
    }
}


# ========================================================================
# Retail Data Quality Rules
# ========================================================================

RETAIL_QUALITY_RULES = {
    "customer_data": [
        {"rule": "unique", "field": "customer_id", "priority": "critical"},
        {"rule": "email_format", "field": "email", "priority": "high"},
        {"rule": "phone_format", "field": "phone", "priority": "medium"},
        {"rule": "completeness", "field": "email", "threshold": 0.95, "priority": "high"},
        {"rule": "no_duplicates", "field": "email", "priority": "high"}
    ],

    "transaction_data": [
        {"rule": "unique", "field": "transaction_id", "priority": "critical"},
        {"rule": "positive_value", "field": "amount", "priority": "critical"},
        {"rule": "valid_date", "field": "transaction_date", "priority": "critical"},
        {"rule": "foreign_key", "field": "customer_id", "references": "customers", "priority": "high"},
        {"rule": "freshness", "field": "created_at", "max_age_hours": 24, "priority": "high"}
    ],

    "product_data": [
        {"rule": "unique", "field": "product_id", "priority": "critical"},
        {"rule": "positive_value", "field": "price", "priority": "critical"},
        {"rule": "completeness", "field": "product_name", "threshold": 1.0, "priority": "critical"},
        {"rule": "valid_values", "field": "category", "priority": "medium"}
    ]
}


# ========================================================================
# Retail Domain Accelerator Class
# ========================================================================

class RetailDomainAccelerator:
    """
    Retail domain accelerator with pre-loaded knowledge
    Provides instant access to retail patterns, terms, and best practices
    """

    @staticmethod
    def get_patterns() -> Dict[str, Any]:
        """Get all retail patterns"""
        return RETAIL_PATTERNS

    @staticmethod
    def get_business_terms() -> Dict[str, Any]:
        """Get all retail business terms"""
        return RETAIL_BUSINESS_TERMS

    @staticmethod
    def get_quality_rules() -> Dict[str, Any]:
        """Get retail-specific quality rules"""
        return RETAIL_QUALITY_RULES

    @staticmethod
    def get_pattern(pattern_id: str) -> Dict[str, Any]:
        """Get a specific pattern by ID"""
        return RETAIL_PATTERNS.get(pattern_id, {})

    @staticmethod
    def get_term(term: str) -> Dict[str, Any]:
        """Get a specific business term"""
        return RETAIL_BUSINESS_TERMS.get(term, {})

    @staticmethod
    def search_patterns(use_case: str) -> List[Dict[str, Any]]:
        """Search patterns by use case keywords"""
        use_case_lower = use_case.lower()
        results = []

        for pattern_id, pattern in RETAIL_PATTERNS.items():
            name_lower = pattern["name"].lower()
            desc_lower = pattern["description"].lower()

            if any(keyword in name_lower or keyword in desc_lower
                   for keyword in use_case_lower.split()):
                pattern_copy = pattern.copy()
                pattern_copy["id"] = pattern_id
                results.append(pattern_copy)

        # Sort by success rate
        results.sort(key=lambda x: x.get("success_rate", 0.0), reverse=True)
        return results

    @staticmethod
    def get_recommended_data_sources(pattern_id: str) -> List[str]:
        """Get recommended data sources for a pattern"""
        pattern = RETAIL_PATTERNS.get(pattern_id, {})
        return pattern.get("required_sources", [])

    @staticmethod
    def estimate_build_time(pattern_id: str) -> int:
        """Estimate build time in hours for a pattern"""
        pattern = RETAIL_PATTERNS.get(pattern_id, {})
        return pattern.get("avg_build_time_hours", 40)

    @staticmethod
    def get_domain_summary() -> Dict[str, Any]:
        """Get summary of retail domain knowledge"""
        return {
            "domain": "retail",
            "patterns_count": len(RETAIL_PATTERNS),
            "terms_count": len(RETAIL_BUSINESS_TERMS),
            "avg_success_rate": sum(p["success_rate"] for p in RETAIL_PATTERNS.values()) / len(RETAIL_PATTERNS),
            "total_implementations": sum(p["implementations"] for p in RETAIL_PATTERNS.values()),
            "categories": list(set(p["category"] for p in RETAIL_PATTERNS.values()))
        }
