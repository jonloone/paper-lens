"""
KAG Intelligence API Routes
Exposes graph-enhanced reasoning services to TypeScript frontend
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime

from ..services.kuzu_knowledge_graph import KuzuKnowledgeGraph, get_knowledge_graph
from ..services.kag_intelligence import KAGIntelligence, get_kag_intelligence
from ..services.contract_assistant import ContractAssistant
from ..services.pattern_engine import PatternRecommendationEngine
from ..services.domain_accelerators import get_domain_accelerator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kag", tags=["KAG Intelligence"])


# ============================================================================
# Request Models
# ============================================================================

class ParseRequestModel(BaseModel):
    """Request for KAG-enhanced parsing"""
    description: str = Field(..., description="Natural language description")
    domain: str = Field(..., description="Business domain (retail, financial, healthcare)")
    requester: str = Field(..., description="Requester email")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")


class ContractSuggestionRequest(BaseModel):
    """Request for contract suggestion"""
    requirements: str = Field(..., description="Business requirements")
    domain: str = Field(..., description="Business domain")
    critical_fields: List[str] = Field(default=[], description="Must-have fields")
    min_confidence: float = Field(default=0.5, description="Minimum confidence threshold")
    base_contract: Optional[Dict[str, Any]] = Field(default=None, description="Existing contract to enhance")


class PatternSearchRequest(BaseModel):
    """Request for pattern discovery"""
    requirements: Dict[str, Any] = Field(..., description="Structured requirements")
    domain: str = Field(..., description="Business domain")
    contract: Optional[Dict[str, Any]] = Field(default=None, description="Contract context")


class ImpactAnalysisRequest(BaseModel):
    """Request for impact analysis"""
    contract_id: str = Field(..., description="Contract identifier")
    proposed_changes: Dict[str, Any] = Field(..., description="Proposed schema/rule changes")


class SimilarContractsRequest(BaseModel):
    """Request for similar contract search"""
    contract: Optional[Dict[str, Any]] = Field(default=None, description="Contract to match")
    domain: str = Field(..., description="Domain to search within")
    description: Optional[str] = Field(default=None, description="Alternative: description to match")
    min_similarity: float = Field(default=0.7, description="Minimum similarity score")


class DetectIntentRequest(BaseModel):
    """Request for AI-powered product type detection"""
    description: str = Field(..., description="Natural language description of what to build")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")


# ============================================================================
# Enhanced Request Parsing
# ============================================================================

@router.post("/parse-request")
async def parse_with_kag(request: ParseRequestModel) -> Dict[str, Any]:
    """
    Enhanced request parsing using KAG hybrid reasoning

    Combines graph-based similarity search with LLM understanding
    to provide richer context than simple pattern matching
    """
    try:
        kag = get_kag_intelligence()
        kg = get_knowledge_graph()

        # Step 1: Use KAG for hybrid reasoning
        understanding = await kag.hybrid_query(
            question=f"""
            Analyze this data product request:

            Description: {request.description}
            Domain: {request.domain}
            Requester: {request.requester}

            Extract:
            1. Business objectives
            2. Technical requirements
            3. Implicit constraints
            4. Suggested data sources
            5. Quality expectations
            """,
            reasoning_mode="hybrid",
            context=request.context or {}
        )

        # Step 2: Find similar contracts in graph
        similar_contracts = []
        if understanding.get("confidence", 0) > 0.5:
            similar_contracts = await kg.find_similar_contracts(
                domain=request.domain,
                description=request.description,
                min_similarity=0.6
            )

        # Step 3: Get domain accelerator insights
        try:
            accelerator = get_domain_accelerator(request.domain)
            domain_patterns = accelerator.get_recommended_patterns(request.description)
        except Exception as e:
            logger.warning(f"Domain accelerator unavailable: {e}")
            domain_patterns = []

        return {
            "success": True,
            "understanding": {
                "business_objectives": understanding.get("business_objectives", []),
                "technical_requirements": understanding.get("technical_requirements", {}),
                "constraints": understanding.get("constraints", []),
                "suggested_sources": understanding.get("suggested_sources", []),
                "quality_expectations": understanding.get("quality_expectations", {})
            },
            "similar_contracts": similar_contracts[:5],  # Top 5
            "domain_patterns": domain_patterns[:3],  # Top 3
            "confidence": understanding.get("confidence", 0.5),
            "reasoning_path": understanding.get("reasoning_path", []),
            "graph_insights": {
                "total_similar": len(similar_contracts),
                "avg_similarity": sum(c.get("similarity", 0) for c in similar_contracts) / max(len(similar_contracts), 1)
            }
        }

    except Exception as e:
        logger.error(f"KAG parsing failed: {e}")
        raise HTTPException(status_code=500, detail=f"KAG parsing error: {str(e)}")


# ============================================================================
# Contract Suggestion
# ============================================================================

@router.post("/contract/suggest")
async def suggest_contract(request: ContractSuggestionRequest) -> Dict[str, Any]:
    """
    Generate intelligent contract suggestion using Contract Assistant

    Leverages graph patterns, domain knowledge, and successful examples
    to create high-quality contract suggestions
    """
    try:
        assistant = ContractAssistant()

        # Generate suggestion
        suggestion = await assistant.suggest_contract(
            requirements=request.requirements,
            domain=request.domain,
            critical_fields=request.critical_fields,
            min_confidence=request.min_confidence
        )

        # If base contract provided, enhance it
        if request.base_contract:
            suggestion = await assistant.enhance_contract(
                base_contract=request.base_contract,
                requirements=request.requirements
            )

        return {
            "success": True,
            "contract": suggestion.get("contract", {}),
            "similar_contracts": suggestion.get("similar_contracts", []),
            "applied_patterns": suggestion.get("applied_patterns", []),
            "quality_rules_generated": len(suggestion.get("contract", {}).get("quality", [])),
            "confidence": suggestion.get("confidence", 0.0),
            "reasoning": suggestion.get("reasoning", ""),
            "suggestions": suggestion.get("suggestions", []),
            "warnings": suggestion.get("warnings", [])
        }

    except Exception as e:
        logger.error(f"Contract suggestion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Contract suggestion error: {str(e)}")


# ============================================================================
# Pattern Discovery
# ============================================================================

@router.post("/patterns/find")
async def find_patterns(request: PatternSearchRequest) -> Dict[str, Any]:
    """
    Discover applicable patterns using graph traversal

    Finds patterns based on:
    - Graph relationships (what's used together successfully)
    - Domain expertise (pre-built accelerators)
    - Success metrics (what works)
    """
    try:
        engine = PatternRecommendationEngine()

        # Find patterns via graph
        patterns = await engine.find_patterns(
            requirements=request.requirements,
            domain=request.domain
        )

        # Score and rank patterns
        scored_patterns = []
        for pattern in patterns:
            score = await engine.score_pattern_match(
                pattern=pattern,
                requirements=request.requirements
            )

            scored_patterns.append({
                "pattern": pattern,
                "score": score.get("score", 0.0),
                "confidence": score.get("confidence", 0.0),
                "reasoning": score.get("reasoning", ""),
                "success_rate": pattern.get("success_rate", 0.0),
                "implementations": pattern.get("implementations", 0),
                "estimated_effort": score.get("estimated_effort", "medium")
            })

        # Sort by score
        scored_patterns.sort(key=lambda x: x["score"], reverse=True)

        # Find pattern combinations
        combinations = []
        if len(scored_patterns) > 0:
            primary_pattern = scored_patterns[0]["pattern"]
            combinations = await engine.recommend_combinations(primary_pattern)

        return {
            "success": True,
            "patterns": scored_patterns[:10],  # Top 10
            "combinations": combinations[:5],  # Top 5 combinations
            "total_found": len(patterns),
            "domain": request.domain,
            "recommendations": [
                {
                    "pattern_name": p["pattern"].get("name", ""),
                    "reason": p["reasoning"],
                    "confidence": p["confidence"]
                }
                for p in scored_patterns[:3]
            ]
        }

    except Exception as e:
        logger.error(f"Pattern discovery failed: {e}")
        raise HTTPException(status_code=500, detail=f"Pattern discovery error: {str(e)}")


# ============================================================================
# Impact Analysis
# ============================================================================

@router.post("/impact/analyze")
async def analyze_impact(request: ImpactAnalysisRequest) -> Dict[str, Any]:
    """
    Analyze impact of contract changes using graph lineage

    Traverses graph to find:
    - Directly dependent products
    - Downstream contracts (derived data)
    - Breaking vs non-breaking changes
    - Migration effort estimation
    """
    try:
        kg = get_knowledge_graph()

        # Analyze impact through graph
        impact = await kg.analyze_impact(
            contract_id=request.contract_id,
            proposed_changes=request.proposed_changes
        )

        return {
            "success": True,
            "contract_id": request.contract_id,
            "directly_affected": impact.get("directly_affected", []),
            "downstream_affected": impact.get("downstream_affected", []),
            "total_affected": (
                len(impact.get("directly_affected", [])) +
                len(impact.get("downstream_affected", []))
            ),
            "is_breaking": impact.get("is_breaking", False),
            "affected_domains": impact.get("affected_domains", []),
            "migration_effort": impact.get("migration_effort", "unknown"),
            "migration_plan": impact.get("migration_plan", []),
            "recommendations": impact.get("recommendations", [])
        }

    except Exception as e:
        logger.error(f"Impact analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Impact analysis error: {str(e)}")


# ============================================================================
# Similar Contracts Search
# ============================================================================

@router.post("/contracts/similar")
async def find_similar_contracts(request: SimilarContractsRequest) -> Dict[str, Any]:
    """
    Find similar contracts using graph similarity search

    Matches based on:
    - Schema similarity
    - Domain alignment
    - Pattern usage
    - Success metrics
    """
    try:
        kg = get_knowledge_graph()

        # Find similar contracts
        if request.contract:
            similar = await kg.find_similar_contracts_by_contract(
                contract=request.contract,
                min_similarity=request.min_similarity
            )
        elif request.description:
            similar = await kg.find_similar_contracts(
                domain=request.domain,
                description=request.description,
                min_similarity=request.min_similarity
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Either 'contract' or 'description' must be provided"
            )

        return {
            "success": True,
            "similar_contracts": similar,
            "total_found": len(similar),
            "avg_similarity": sum(c.get("similarity", 0) for c in similar) / max(len(similar), 1),
            "domain": request.domain
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Similar contracts search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


# ============================================================================
# Domain Accelerators
# ============================================================================

@router.get("/domain/{domain}/patterns")
async def get_domain_patterns(domain: str) -> Dict[str, Any]:
    """
    Get pre-built patterns for a specific domain
    """
    try:
        accelerator = get_domain_accelerator(domain)
        patterns = accelerator.get_all_patterns()

        return {
            "success": True,
            "domain": domain,
            "patterns": patterns,
            "total_patterns": len(patterns)
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Domain patterns retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Domain error: {str(e)}")


@router.get("/domain/{domain}/terms")
async def get_domain_terms(domain: str) -> Dict[str, Any]:
    """
    Get business glossary terms for a domain
    """
    try:
        accelerator = get_domain_accelerator(domain)
        terms = accelerator.get_business_terms()

        return {
            "success": True,
            "domain": domain,
            "terms": terms,
            "total_terms": len(terms)
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Domain terms retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Domain error: {str(e)}")


@router.post("/domain/{domain}/load")
async def load_domain_accelerator(domain: str) -> Dict[str, Any]:
    """
    Load complete domain accelerator knowledge
    """
    try:
        accelerator = get_domain_accelerator(domain)
        kg = get_knowledge_graph()

        # Load domain knowledge into graph
        load_result = await accelerator.load_into_graph(kg)

        return {
            "success": True,
            "domain": domain,
            "patterns_loaded": load_result.get("patterns_loaded", 0),
            "terms_loaded": load_result.get("terms_loaded", 0),
            "relationships_created": load_result.get("relationships_created", 0),
            "typical_sources": accelerator.get_typical_sources(),
            "common_quality_rules": accelerator.get_common_quality_rules()
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Domain loading failed: {e}")
        raise HTTPException(status_code=500, detail=f"Domain loading error: {str(e)}")


# ============================================================================
# Health Check
# ============================================================================

@router.post("/detect-intent")
async def detect_product_type(request: DetectIntentRequest) -> Dict[str, Any]:
    """
    AI-powered product type detection from natural language description

    Analyzes user intent and recommends Foundation, Domain, or Solution product type
    """
    try:
        description = request.description.lower()
        confidence = 0.0
        detected_type = "solution"  # Default
        reasoning = []

        # Enhanced keyword-based detection with confidence scoring
        foundation_keywords = ["connect", "stream", "database", "source", "sync", "ingest", "kafka", "mysql", "postgres", "api", "s3"]
        domain_keywords = ["customer", "product", "order", "entity", "profile", "model", "unified", "360", "canonical"]
        solution_keywords = ["predict", "churn", "score", "analytics", "metric", "dashboard", "insight", "recommendation", "forecast"]

        foundation_score = sum(1 for k in foundation_keywords if k in description)
        domain_score = sum(1 for k in domain_keywords if k in description)
        solution_score = sum(1 for k in solution_keywords if k in description)

        # Determine type and confidence
        if foundation_score > domain_score and foundation_score > solution_score:
            detected_type = "source"
            confidence = min(0.95, 0.6 + (foundation_score * 0.1))
            reasoning.append(f"Detected {foundation_score} foundation-related keywords")
            reasoning.append("User intent suggests connecting to a new data source")

        elif domain_score > foundation_score and domain_score > solution_score:
            detected_type = "entity"
            confidence = min(0.95, 0.6 + (domain_score * 0.1))
            reasoning.append(f"Detected {domain_score} domain entity keywords")
            reasoning.append("User intent suggests modeling a business entity")

        else:
            detected_type = "solution"
            confidence = min(0.95, 0.5 + (solution_score * 0.1)) if solution_score > 0 else 0.65
            reasoning.append(f"Detected {solution_score} solution-related keywords")
            reasoning.append("User intent suggests building an analytical solution")

        # Extract suggested fields based on type
        suggested_fields = {}

        if detected_type == "source":
            suggested_fields = {
                "sync_frequency": "hourly" if "batch" in description else "realtime",
                "connector_type": next((k for k in ["mysql", "kafka", "postgres", "s3"] if k in description), "mysql")
            }

        elif detected_type == "entity":
            suggested_fields = {
                "entity_type": next((k for k in ["customer", "product", "order"] if k in description), "customer"),
                "resolution_key": "id"
            }

        else:
            suggested_fields = {
                "business_problem": request.description[:200],
                "output_type": "dashboard" if "dashboard" in description else "api"
            }

        return {
            "success": True,
            "detected_type": detected_type,
            "confidence": round(confidence, 2),
            "reasoning": reasoning,
            "suggested_fields": suggested_fields,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Intent detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Check KAG services health
    """
    try:
        kg = get_knowledge_graph()
        kag = get_kag_intelligence()

        # Check graph connectivity
        graph_stats = await kg.get_statistics()

        # Check KAG availability
        kag_status = await kag.check_health()

        return {
            "success": True,
            "status": "healthy",
            "services": {
                "knowledge_graph": {
                    "status": "online",
                    "contracts": graph_stats.get("contracts", 0),
                    "products": graph_stats.get("products", 0),
                    "patterns": graph_stats.get("patterns", 0)
                },
                "kag_intelligence": {
                    "status": "online" if kag_status else "degraded",
                    "reasoning_mode": "hybrid"
                }
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "success": False,
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
