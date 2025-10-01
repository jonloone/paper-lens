"""
Healthcare Domain Accelerator
Pre-loaded patterns, business terms, and best practices for healthcare domain
"""

from typing import Dict, List, Any

# ========================================================================
# Healthcare Patterns
# ========================================================================

HEALTHCARE_PATTERNS = {
    "patient_360": {
        "name": "Patient 360 View",
        "description": "Comprehensive patient view combining clinical, administrative, and outcomes data",
        "category": "clinical",
        "required_sources": ["ehr", "lab_results", "imaging", "claims", "pharmacy"],
        "core_fields": ["patient_id", "medical_history", "current_conditions", "medications", "care_team"],
        "transformations": [
            "data_harmonization",
            "clinical_aggregation",
            "timeline_construction",
            "risk_stratification"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "patient_id"},
            {"rule": "completeness", "field": "medical_history", "threshold": 0.95},
            {"rule": "phi_protection", "field": "patient_identifiers", "priority": "critical"},
            {"rule": "data_lineage", "field": "source_systems"}
        ],
        "compliance": ["HIPAA", "HITECH", "GDPR"],
        "success_rate": 0.86,
        "implementations": 28,
        "avg_build_time_hours": 60
    },

    "readmission_prediction": {
        "name": "Hospital Readmission Prediction",
        "description": "Predict risk of hospital readmission within 30 days of discharge",
        "category": "predictive",
        "required_sources": ["ehr", "admissions", "discharge_summaries", "social_determinants"],
        "core_fields": ["patient_id", "readmission_risk", "risk_factors", "intervention_recommendations"],
        "transformations": [
            "feature_engineering",
            "comorbidity_indexing",
            "ml_model_scoring",
            "care_plan_generation"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "patient_id"},
            {"rule": "score_bounds", "field": "readmission_risk", "min": 0.0, "max": 1.0},
            {"rule": "completeness", "field": "risk_factors", "threshold": 0.90},
            {"rule": "freshness", "field": "scored_at", "max_age_hours": 6}
        ],
        "compliance": ["HIPAA", "Meaningful Use"],
        "success_rate": 0.82,
        "implementations": 19,
        "avg_build_time_hours": 48
    },

    "clinical_decision_support": {
        "name": "Clinical Decision Support System",
        "description": "Provide evidence-based recommendations at point of care",
        "category": "clinical",
        "required_sources": ["ehr", "clinical_guidelines", "drug_interactions", "patient_history"],
        "core_fields": ["encounter_id", "recommendations", "evidence_level", "contraindications"],
        "transformations": [
            "guideline_matching",
            "drug_interaction_checking",
            "contraindication_detection",
            "recommendation_ranking"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "encounter_id"},
            {"rule": "completeness", "field": "recommendations", "threshold": 1.0},
            {"rule": "valid_values", "field": "evidence_level", "values": ["A", "B", "C", "D"]},
            {"rule": "real_time", "field": "generated_at", "max_latency_ms": 500}
        ],
        "compliance": ["HIPAA", "21 CFR Part 11"],
        "success_rate": 0.88,
        "implementations": 22,
        "avg_build_time_hours": 56
    },

    "population_health_analytics": {
        "name": "Population Health Management",
        "description": "Analyze and improve health outcomes across patient populations",
        "category": "analytics",
        "required_sources": ["ehr", "claims", "registries", "social_determinants", "quality_measures"],
        "core_fields": ["population_id", "health_metrics", "risk_distribution", "care_gaps"],
        "transformations": [
            "population_stratification",
            "quality_measure_calculation",
            "care_gap_identification",
            "intervention_planning"
        ],
        "quality_rules": [
            {"rule": "completeness", "field": "health_metrics", "threshold": 0.95},
            {"rule": "statistical_validity", "field": "metrics"},
            {"rule": "freshness", "field": "calculated_at", "max_age_hours": 24}
        ],
        "compliance": ["HIPAA", "MACRA", "MIPS"],
        "success_rate": 0.85,
        "implementations": 17,
        "avg_build_time_hours": 52
    },

    "medication_adherence": {
        "name": "Medication Adherence Monitoring",
        "description": "Track and improve patient medication compliance",
        "category": "outcomes",
        "required_sources": ["pharmacy", "ehr", "claims", "patient_reported"],
        "core_fields": ["patient_id", "adherence_score", "barriers", "interventions"],
        "transformations": [
            "adherence_calculation",
            "barrier_identification",
            "intervention_recommendation",
            "outcome_tracking"
        ],
        "quality_rules": [
            {"rule": "unique", "field": "patient_id"},
            {"rule": "score_bounds", "field": "adherence_score", "min": 0.0, "max": 1.0},
            {"rule": "completeness", "field": "barriers", "threshold": 0.85},
            {"rule": "freshness", "field": "updated_at", "max_age_hours": 48}
        ],
        "compliance": ["HIPAA"],
        "success_rate": 0.79,
        "implementations": 14,
        "avg_build_time_hours": 36
    }
}


# ========================================================================
# Healthcare Business Terms
# ========================================================================

HEALTHCARE_BUSINESS_TERMS = {
    "Length of Stay (LOS)": {
        "definition": "Number of days a patient remains in the hospital from admission to discharge",
        "aliases": ["LOS", "Hospital Stay"],
        "related_fields": ["los", "length_of_stay", "hospital_days"],
        "calculation": "Discharge Date - Admission Date",
        "importance": "high",
        "typical_range": "1 - 30 days"
    },

    "Healthcare Effectiveness Data and Information Set (HEDIS)": {
        "definition": "Standardized performance measures for healthcare quality",
        "aliases": ["HEDIS", "Quality Measures"],
        "related_fields": ["hedis_measures", "quality_metrics"],
        "importance": "critical",
        "typical_range": "N/A"
    },

    "Case Mix Index (CMI)": {
        "definition": "Average relative DRG weight of hospital's Medicare patients",
        "aliases": ["CMI", "Acuity Index"],
        "related_fields": ["cmi", "case_mix", "acuity"],
        "calculation": "Sum of DRG Weights / Number of Discharges",
        "importance": "high",
        "typical_range": "0.8 - 2.0"
    },

    "Readmission Rate": {
        "definition": "Percentage of patients readmitted within specified timeframe after discharge",
        "aliases": ["30-Day Readmission", "Unplanned Readmission"],
        "related_fields": ["readmission_rate", "rehospitalization"],
        "calculation": "(Readmissions / Total Discharges) * 100",
        "importance": "high",
        "typical_range": "8% - 18%"
    },

    "Risk Adjustment Factor (RAF)": {
        "definition": "Measure of patient's expected healthcare costs based on health status",
        "aliases": ["RAF Score", "HCC Score"],
        "related_fields": ["raf_score", "hcc_score", "risk_score"],
        "calculation": "Based on Hierarchical Condition Categories (HCC)",
        "importance": "high",
        "typical_range": "0.5 - 5.0"
    }
}


# ========================================================================
# Healthcare Quality Rules
# ========================================================================

HEALTHCARE_QUALITY_RULES = {
    "patient_data": [
        {"rule": "unique", "field": "patient_id", "priority": "critical"},
        {"rule": "phi_encryption", "field": "ssn", "priority": "critical"},
        {"rule": "phi_encryption", "field": "mrn", "priority": "critical"},
        {"rule": "completeness", "field": "demographics", "threshold": 0.98, "priority": "high"},
        {"rule": "audit_logging", "field": "access_log", "priority": "critical"}
    ],

    "clinical_data": [
        {"rule": "unique", "field": "encounter_id", "priority": "critical"},
        {"rule": "valid_codes", "field": "diagnosis_codes", "standard": "ICD-10", "priority": "critical"},
        {"rule": "valid_codes", "field": "procedure_codes", "standard": "CPT", "priority": "critical"},
        {"rule": "temporal_consistency", "field": "event_timestamps", "priority": "high"}
    ],

    "outcomes_data": [
        {"rule": "completeness", "field": "outcome_measures", "threshold": 0.95, "priority": "high"},
        {"rule": "statistical_validity", "field": "calculated_metrics", "priority": "high"},
        {"rule": "freshness", "field": "measured_at", "max_age_hours": 24, "priority": "medium"}
    ]
}


# ========================================================================
# Healthcare Domain Accelerator Class
# ========================================================================

class HealthcareDomainAccelerator:
    """
    Healthcare domain accelerator with pre-loaded knowledge
    Provides instant access to healthcare patterns, terms, and compliance requirements
    """

    @staticmethod
    def get_patterns() -> Dict[str, Any]:
        """Get all healthcare patterns"""
        return HEALTHCARE_PATTERNS

    @staticmethod
    def get_business_terms() -> Dict[str, Any]:
        """Get all healthcare business terms"""
        return HEALTHCARE_BUSINESS_TERMS

    @staticmethod
    def get_quality_rules() -> Dict[str, Any]:
        """Get healthcare-specific quality rules"""
        return HEALTHCARE_QUALITY_RULES

    @staticmethod
    def get_pattern(pattern_id: str) -> Dict[str, Any]:
        """Get a specific pattern by ID"""
        return HEALTHCARE_PATTERNS.get(pattern_id, {})

    @staticmethod
    def get_compliance_requirements(pattern_id: str) -> List[str]:
        """Get compliance requirements for a pattern"""
        pattern = HEALTHCARE_PATTERNS.get(pattern_id, {})
        return pattern.get("compliance", [])

    @staticmethod
    def search_patterns(use_case: str) -> List[Dict[str, Any]]:
        """Search patterns by use case keywords"""
        use_case_lower = use_case.lower()
        results = []

        for pattern_id, pattern in HEALTHCARE_PATTERNS.items():
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
        """Get summary of healthcare domain knowledge"""
        return {
            "domain": "healthcare",
            "patterns_count": len(HEALTHCARE_PATTERNS),
            "terms_count": len(HEALTHCARE_BUSINESS_TERMS),
            "avg_success_rate": sum(p["success_rate"] for p in HEALTHCARE_PATTERNS.values()) / len(HEALTHCARE_PATTERNS),
            "total_implementations": sum(p["implementations"] for p in HEALTHCARE_PATTERNS.values()),
            "categories": list(set(p["category"] for p in HEALTHCARE_PATTERNS.values())),
            "compliance_frameworks": list(set(
                comp for p in HEALTHCARE_PATTERNS.values()
                for comp in p.get("compliance", [])
            ))
        }
