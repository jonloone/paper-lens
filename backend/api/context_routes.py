"""
Context API Routes
Handles intent creation, enrichment, and usage tracking.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from backend.services.quality_inference import (
    QualityInferenceEngine,
    ExtractedContext
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/context", tags=["context"])


class CreateIntentRequest(BaseModel):
    """Request body for creating IntentNode."""
    dataProductId: str
    stakeholder: Dict[str, Any]
    businessNeed: Dict[str, Any]
    deadline: Dict[str, Any]
    originalRequest: str


class CreateIntentResponse(BaseModel):
    """Response with created IntentNode ID."""
    intentId: str
    qualityExpectations: Dict[str, Any]
    reasoning: List[str]
    confidence: float


class EnrichIntentRequest(BaseModel):
    """Request body for enriching intent with profiling data."""
    intentId: str
    profilingResults: Dict[str, Any]


class QualityGapResponse(BaseModel):
    """Response with quality gap analysis."""
    qualityGap: float
    severity: str
    blockers: List[Dict[str, Any]]
    message: str


async def get_kuzu_service():
    """Dependency to get Kuzu service."""
    from backend.services.kuzu_knowledge_graph import get_knowledge_graph
    return get_knowledge_graph()


@router.post("/create-intent", response_model=CreateIntentResponse)
async def create_intent(
    request: CreateIntentRequest,
    kuzu=Depends(get_kuzu_service)
) -> CreateIntentResponse:
    """
    Create IntentNode from extracted context.
    Automatically infers quality expectations.
    """

    try:
        # Build ExtractedContext object
        context = ExtractedContext(
            stakeholder=request.stakeholder,
            businessNeed=request.businessNeed,
            deadline=request.deadline,
            originalRequest=request.originalRequest
        )

        # Infer quality expectations
        inference_engine = QualityInferenceEngine(kuzu_service=kuzu)
        expectations = await inference_engine.infer_expectations(context)

        # Generate intent ID
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        product_id_clean = request.dataProductId.replace('.', '_').replace('/', '_')
        intent_id = f"intent_{timestamp}_{product_id_clean}"

        # Parse deadline
        deadline_value = None
        if request.deadline.get('date'):
            try:
                if isinstance(request.deadline['date'], str):
                    deadline_value = datetime.fromisoformat(request.deadline['date'].replace('Z', '+00:00'))
                elif isinstance(request.deadline['date'], datetime):
                    deadline_value = request.deadline['date']
            except Exception as e:
                logger.warning(f"Could not parse deadline: {e}")

        # Create IntentNode in Kuzu
        kuzu.conn.execute("""
            CREATE (i:IntentNode {
                id: $id,
                data_product_id: $data_product_id,
                stakeholder_name: $stakeholder_name,
                stakeholder_email: $stakeholder_email,
                stakeholder_department: $stakeholder_department,
                stakeholder_confidence: $stakeholder_confidence,
                business_need_summary: $business_summary,
                business_keywords: $business_keywords,
                urgency: $urgency,
                deadline: $deadline,
                deadline_type: $deadline_type,
                expected_quality_score: $expected_quality,
                expected_freshness_hours: $expected_freshness,
                expected_completeness: $expected_completeness,
                quality_inference_reasoning: $reasoning,
                quality_inference_confidence: $confidence,
                primary_use_cases: $primary_use_cases,
                created_at: $created_at,
                confidence_score: $overall_confidence,
                original_request_text: $original_request
            })
        """, {
            'id': intent_id,
            'data_product_id': request.dataProductId,
            'stakeholder_name': request.stakeholder.get('name', ''),
            'stakeholder_email': request.stakeholder.get('email', ''),
            'stakeholder_department': request.stakeholder.get('department', ''),
            'stakeholder_confidence': request.stakeholder.get('confidence', 0.8),
            'business_summary': request.businessNeed.get('summary', ''),
            'business_keywords': request.businessNeed.get('keywords', []),
            'urgency': request.businessNeed.get('urgency', 'medium'),
            'deadline': deadline_value,
            'deadline_type': request.deadline.get('type', 'soft'),
            'expected_quality': expectations.accuracy,
            'expected_freshness': expectations.freshness_hours,
            'expected_completeness': expectations.completeness,
            'reasoning': expectations.reasoning,
            'confidence': expectations.confidence,
            'primary_use_cases': [request.businessNeed.get('summary', '')],
            'created_at': datetime.utcnow(),
            'overall_confidence': expectations.confidence,
            'original_request': request.originalRequest
        })

        logger.info(f"Created IntentNode: {intent_id}")

        return CreateIntentResponse(
            intentId=intent_id,
            qualityExpectations={
                'accuracy': expectations.accuracy,
                'freshnessHours': expectations.freshness_hours,
                'completeness': expectations.completeness
            },
            reasoning=expectations.reasoning,
            confidence=expectations.confidence
        )

    except Exception as e:
        logger.error(f"Failed to create IntentNode: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enrich-intent-with-profiling", response_model=QualityGapResponse)
async def enrich_intent_with_profiling(
    request: EnrichIntentRequest,
    kuzu=Depends(get_kuzu_service)
) -> QualityGapResponse:
    """
    Enrich IntentNode with actual quality metrics from profiling.
    Calculate quality gap and identify blockers.
    """

    try:
        # Extract quality metrics from profiling results
        actual_quality = request.profilingResults.get('quality_score', 0) / 100
        quality_issues = request.profilingResults.get('quality_issues', [])

        # Get expected quality from IntentNode
        result = kuzu.conn.execute("""
            MATCH (i:IntentNode {id: $intent_id})
            RETURN
                i.expected_quality_score as expected_quality,
                i.expected_completeness as expected_completeness
        """, {'intent_id': request.intentId})

        rows = result.get_as_pl()
        if rows.height == 0:
            raise HTTPException(
                status_code=404,
                detail=f"IntentNode {request.intentId} not found"
            )

        row_dict = rows.to_dicts()[0]
        expected_quality = row_dict['expected_quality']
        expected_completeness = row_dict['expected_completeness']

        # Calculate quality gap
        quality_gap = expected_quality - actual_quality

        # Identify blockers from quality issues
        blockers = []
        for issue in quality_issues:
            if issue.get('severity') in ['high', 'critical']:
                blockers.append({
                    'column': issue.get('column', 'unknown'),
                    'problem': issue.get('problem', ''),
                    'affectedPct': issue.get('affected_pct', 0),
                    'recommendation': issue.get('recommendation', '')
                })

        # Determine severity  (using descriptive levels for test)
        if quality_gap > 0.10:
            severity = "critical"
            gap_severity = "high"
        elif quality_gap > 0.05:
            severity = "warning"
            gap_severity = "moderate"
        else:
            severity = "none"
            gap_severity = "low"

        # Update IntentNode
        kuzu.conn.execute("""
            MATCH (i:IntentNode {id: $intent_id})
            SET
                i.actual_quality_score = $actual_quality,
                i.quality_gap = $quality_gap,
                i.quality_blockers = $blockers,
                i.profiling_last_updated = $updated_at
        """, {
            'intent_id': request.intentId,
            'actual_quality': actual_quality,
            'quality_gap': quality_gap,
            'blockers': [b['problem'] for b in blockers],
            'updated_at': datetime.utcnow()
        })

        # Generate user-friendly message
        if severity == "critical":
            blocker_list = '\n'.join(
                f"• {b['column']}: {b['problem']} ({b['affectedPct']:.0f}% affected)"
                for b in blockers
            )
            message = f"""⚠️ Quality Gap Detected

Expected Quality: {expected_quality * 100:.0f}% (inferred from business context)
Actual Quality: {actual_quality * 100:.0f}%
Gap: {quality_gap * 100:.0f}%

Specific Issues Found:
{blocker_list}

Recommendation: Address these issues in SQL transformation step or adjust stakeholder expectations.
"""
        elif severity == "warning":
            message = f"""⚠️ Minor Quality Gap

Expected: {expected_quality * 100:.0f}%, Actual: {actual_quality * 100:.0f}%
Gap: {quality_gap * 100:.0f}%

Consider addressing {len(blockers)} quality issue(s) found.
"""
        else:
            message = f"✓ Data quality ({actual_quality * 100:.0f}%) meets expectations ({expected_quality * 100:.0f}%)"

        logger.info(f"Enriched IntentNode {request.intentId} with profiling data")

        # Generate warnings list
        warnings = []
        if quality_gap > 0:
            warnings.append(f"Data quality ({actual_quality * 100:.0f}%) is below expected ({expected_quality * 100:.0f}%)")
        if len(blockers) > 0:
            warnings.append(f"{len(blockers)} high-severity data quality issues detected")

        return {
            "qualityGap": quality_gap,
            "severity": severity,
            "gapSeverity": gap_severity,
            "blockers": blockers,
            "warnings": warnings,
            "message": message
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to enrich intent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/intent/{intent_id}")
async def get_intent(
    intent_id: str,
    kuzu=Depends(get_kuzu_service)
):
    """Get IntentNode by ID with formatted response."""

    try:
        result = kuzu.conn.execute("""
            MATCH (i:IntentNode {id: $intent_id})
            RETURN i
        """, {'intent_id': intent_id})

        rows = result.get_as_pl()
        if rows.height == 0:
            raise HTTPException(
                status_code=404,
                detail=f"IntentNode {intent_id} not found"
            )

        node = rows.to_dicts()[0]['i']

        # Format the response for the test
        return {
            "intentId": node.get('id'),
            "stakeholder": {
                "name": node.get('stakeholder_name'),
                "email": node.get('stakeholder_email'),
                "department": node.get('stakeholder_department'),
                "confidence": node.get('stakeholder_confidence')
            },
            "businessNeed": {
                "summary": node.get('business_need_summary'),
                "keywords": node.get('business_keywords', []),
                "urgency": node.get('urgency')
            },
            "expectedQuality": {
                "accuracy": node.get('expected_quality_score'),
                "freshnessHours": node.get('expected_freshness_hours'),
                "completeness": node.get('expected_completeness')
            },
            "actualQuality": {
                "quality_score": node.get('actual_quality_score')
            } if node.get('actual_quality_score') is not None else None,
            "qualityGap": node.get('quality_gap'),
            "qualityBlockers": node.get('quality_blockers', []),
            "reasoning": node.get('quality_inference_reasoning', []),
            "confidence": node.get('quality_inference_confidence'),
            "originalRequest": node.get('original_request_text')
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get intent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class ChatAgentQueryRequest(BaseModel):
    """Request body for chat agent LCG queries."""
    productId: str
    domain: Optional[str] = None
    includeUsagePatterns: bool = True
    includeIntentContext: bool = True
    includeSemanticBridges: bool = True
    includeDomainKnowledge: bool = True
    limit: int = 10


class ChatAgentQueryResponse(BaseModel):
    """Response with Living Context Graph data for chat agent."""
    productId: str
    intentContext: List[Dict[str, Any]]
    usagePatterns: List[Dict[str, Any]]
    semanticBridges: List[Dict[str, Any]]
    domainKnowledge: Optional[Dict[str, Any]]
    dataQuality: Optional[Dict[str, Any]]
    metadata: Dict[str, Any]


@router.post("/chat-agent-query", response_model=ChatAgentQueryResponse)
async def query_living_context_for_chat(
    request: ChatAgentQueryRequest,
    kuzu=Depends(get_kuzu_service)
) -> ChatAgentQueryResponse:
    """
    Query Living Context Graph for chat agent context.
    Returns intent context, usage patterns, and semantic bridges for a data product.

    This endpoint provides evidence-based context to enable intelligent,
    organizationally-aware responses from the domain chat agent.
    """

    try:
        product_id = request.productId
        intent_context = []
        usage_patterns = []
        semantic_bridges = []
        domain_knowledge = None
        data_quality_summary = None

        # Query 1: Intent Context - Business expectations and quality gaps
        if request.includeIntentContext:
            try:
                intent_query = """
                    MATCH (i:IntentNode)
                    WHERE i.data_product_id = $product_id
                    RETURN
                        i.id as intent_id,
                        i.stakeholder_name as stakeholder,
                        i.stakeholder_department as department,
                        i.business_need_summary as business_need,
                        i.business_keywords as keywords,
                        i.expected_quality_score as expected_quality,
                        i.expected_freshness_hours as expected_freshness,
                        i.expected_completeness as expected_completeness,
                        i.actual_quality_score as actual_quality,
                        i.quality_gap as quality_gap,
                        i.quality_blockers as blockers,
                        i.primary_use_cases as use_cases,
                        i.created_at as created_at
                    ORDER BY i.created_at DESC
                    LIMIT $limit
                """

                intent_result = kuzu.conn.execute(intent_query, {
                    'product_id': product_id,
                    'limit': request.limit
                })

                intent_rows = intent_result.get_as_pl()
                for row_dict in intent_rows.to_dicts():
                    intent_context.append({
                        'intentId': row_dict.get('intent_id'),
                        'stakeholder': {
                            'name': row_dict.get('stakeholder'),
                            'department': row_dict.get('department')
                        },
                        'businessNeed': row_dict.get('business_need'),
                        'keywords': row_dict.get('keywords', []),
                        'expectedQuality': {
                            'qualityScore': row_dict.get('expected_quality'),
                            'freshnessHours': row_dict.get('expected_freshness'),
                            'completeness': row_dict.get('expected_completeness')
                        },
                        'actualQuality': {
                            'qualityScore': row_dict.get('actual_quality')
                        } if row_dict.get('actual_quality') is not None else None,
                        'qualityGap': row_dict.get('quality_gap'),
                        'blockers': row_dict.get('blockers', []),
                        'useCases': row_dict.get('use_cases', []),
                        'createdAt': row_dict.get('created_at').isoformat() if row_dict.get('created_at') else None
                    })

                logger.info(f"Found {len(intent_context)} intent nodes for product {product_id}")
            except Exception as e:
                logger.warning(f"Failed to query IntentNodes: {e}")

        # Query 2: Usage Patterns - How data is actually being consumed
        if request.includeUsagePatterns:
            try:
                usage_query = """
                    MATCH (u:UsagePatternNode)
                    WHERE u.data_product_id = $product_id
                    RETURN
                        u.id as pattern_id,
                        u.user_id as user_id,
                        u.user_department as department,
                        u.user_role as role,
                        u.query_count as query_count,
                        u.first_access as first_access,
                        u.last_access as last_access,
                        u.typical_filters as filters,
                        u.typical_aggregations as aggregations,
                        u.typical_joins as joins,
                        u.avg_row_count as avg_rows,
                        u.avg_execution_time_ms as avg_time_ms,
                        u.inferred_use_case as use_case,
                        u.use_case_confidence as confidence,
                        u.business_impact as impact,
                        u.downstream_dependencies as dependencies
                    ORDER BY u.query_count DESC
                    LIMIT $limit
                """

                usage_result = kuzu.conn.execute(usage_query, {
                    'product_id': product_id,
                    'limit': request.limit
                })

                usage_rows = usage_result.get_as_pl()
                for row_dict in usage_rows.to_dicts():
                    usage_patterns.append({
                        'patternId': row_dict.get('pattern_id'),
                        'user': {
                            'id': row_dict.get('user_id'),
                            'department': row_dict.get('department'),
                            'role': row_dict.get('role')
                        },
                        'queryCount': row_dict.get('query_count', 0),
                        'firstAccess': row_dict.get('first_access').isoformat() if row_dict.get('first_access') else None,
                        'lastAccess': row_dict.get('last_access').isoformat() if row_dict.get('last_access') else None,
                        'typicalFilters': row_dict.get('filters', []),
                        'typicalAggregations': row_dict.get('aggregations', []),
                        'typicalJoins': row_dict.get('joins', []),
                        'avgRowCount': row_dict.get('avg_rows'),
                        'avgExecutionTimeMs': row_dict.get('avg_time_ms'),
                        'inferredUseCase': row_dict.get('use_case'),
                        'confidence': row_dict.get('confidence'),
                        'businessImpact': row_dict.get('impact'),
                        'downstreamDependencies': row_dict.get('dependencies', [])
                    })

                logger.info(f"Found {len(usage_patterns)} usage patterns for product {product_id}")
            except Exception as e:
                logger.warning(f"Failed to query UsagePatternNodes: {e}")

        # Query 3: Semantic Bridges - Alternative product suggestions
        if request.includeSemanticBridges:
            try:
                bridge_query = """
                    MATCH (b:SemanticBridge)
                    WHERE b.source_id = $product_id OR b.target_id = $product_id
                    RETURN
                        b.id as bridge_id,
                        b.source_id as source_id,
                        b.target_id as target_id,
                        b.relationship_type as relationship,
                        b.confidence as confidence,
                        b.evidence_sources as evidence,
                        b.strength as strength,
                        b.explanation as explanation,
                        b.use_count as use_count,
                        b.success_rate as success_rate
                    ORDER BY b.confidence DESC, b.use_count DESC
                    LIMIT $limit
                """

                bridge_result = kuzu.conn.execute(bridge_query, {
                    'product_id': product_id,
                    'limit': request.limit
                })

                bridge_rows = bridge_result.get_as_pl()
                for row_dict in bridge_rows.to_dicts():
                    semantic_bridges.append({
                        'bridgeId': row_dict.get('bridge_id'),
                        'sourceId': row_dict.get('source_id'),
                        'targetId': row_dict.get('target_id'),
                        'relationshipType': row_dict.get('relationship'),
                        'confidence': row_dict.get('confidence'),
                        'evidence': row_dict.get('evidence', []),
                        'strength': row_dict.get('strength'),
                        'explanation': row_dict.get('explanation'),
                        'useCount': row_dict.get('use_count', 0),
                        'successRate': row_dict.get('success_rate')
                    })

                logger.info(f"Found {len(semantic_bridges)} semantic bridges for product {product_id}")
            except Exception as e:
                logger.warning(f"Failed to query SemanticBridges: {e}")

        # Query 4: Domain Knowledge from OpenSPG
        if request.includeDomainKnowledge and request.domain:
            try:
                from backend.services.openspg_client import get_openspg_client

                openspg = get_openspg_client()

                # Search for domain-relevant concepts
                domain_concepts = await openspg.search_concepts(
                    query=request.domain.lower(),
                    domain=request.domain.lower(),
                    limit=10
                )

                # Get key metrics and business terms related to domain
                key_metrics = []
                business_concepts = []

                for concept in domain_concepts:
                    concept_data = {
                        'name': concept.name,
                        'definition': concept.definition,
                        'relatedConcepts': concept.related_concepts,
                        'confidence': concept.confidence,
                        'source': concept.source
                    }

                    # Categorize based on concept type
                    if any(term in concept.name.lower() for term in ['rate', 'ratio', 'value', 'cost', 'revenue', 'arpu', 'ltv']):
                        key_metrics.append(concept_data)
                    else:
                        business_concepts.append(concept_data)

                # Also get related concepts for commonly used terms in this domain
                common_domain_terms = {
                    'Customer': ['churn', 'ltv', 'cac', 'cohort', 'customer'],
                    'Financial': ['revenue', 'arpu', 'mrr', 'arr', 'margin'],
                    'Product': ['dau', 'mau', 'retention', 'engagement', 'conversion'],
                    'Marketing': ['cac', 'roas', 'conversion', 'attribution'],
                    'Operations': ['sla', 'uptime', 'latency', 'throughput']
                }

                domain_terms = common_domain_terms.get(request.domain, [])
                for term in domain_terms:
                    concept = await openspg.get_concept_definition(term, request.domain.lower())
                    if concept and not any(c['name'] == concept.name for c in key_metrics + business_concepts):
                        concept_data = {
                            'name': concept.name,
                            'definition': concept.definition,
                            'relatedConcepts': concept.related_concepts,
                            'confidence': concept.confidence,
                            'source': concept.source
                        }
                        if any(term in concept.name.lower() for term in ['rate', 'ratio', 'value', 'cost', 'revenue']):
                            key_metrics.append(concept_data)
                        else:
                            business_concepts.append(concept_data)

                domain_knowledge = {
                    'domain': request.domain,
                    'keyMetrics': key_metrics[:5],  # Top 5 metrics
                    'businessConcepts': business_concepts[:8],  # Top 8 concepts
                    'source': 'openspg',
                    'retrievedAt': datetime.now().isoformat()
                }

                logger.info(f"Retrieved {len(key_metrics)} metrics and {len(business_concepts)} concepts from OpenSPG for domain {request.domain}")

            except Exception as e:
                logger.warning(f"Failed to query OpenSPG for domain knowledge: {e}")
                domain_knowledge = None

        # Query 5: Data Quality Summary from DataTable
        try:
            quality_query = """
                MATCH (t:DataTable)
                WHERE t.id = $product_id
                RETURN
                    t.row_count as row_count,
                    t.completeness as completeness,
                    t.quality_score as quality_score,
                    t.last_profiled_at as last_profiled
            """

            quality_result = kuzu.conn.execute(quality_query, {'product_id': product_id})
            quality_rows = quality_result.get_as_pl()

            if quality_rows.height > 0:
                quality_dict = quality_rows.to_dicts()[0]
                data_quality_summary = {
                    'rowCount': quality_dict.get('row_count'),
                    'completeness': quality_dict.get('completeness'),
                    'qualityScore': quality_dict.get('quality_score'),
                    'lastProfiled': quality_dict.get('last_profiled').isoformat() if quality_dict.get('last_profiled') else None
                }
        except Exception as e:
            logger.warning(f"Failed to query DataTable quality: {e}")

        # Calculate summary statistics
        total_queries = sum(p.get('queryCount', 0) for p in usage_patterns)
        unique_users = len(set(p['user']['id'] for p in usage_patterns if p.get('user', {}).get('id')))
        avg_confidence = sum(p.get('confidence', 0) for p in usage_patterns) / len(usage_patterns) if usage_patterns else 0

        # Calculate success rate from usage patterns
        success_rates = [p.get('businessImpact') for p in usage_patterns if p.get('businessImpact')]
        # Note: businessImpact is a string, so we need to infer success from other metrics
        # For now, use query_count as a proxy for success
        avg_success_rate = sum(1 for p in usage_patterns if p.get('queryCount', 0) > 5) / len(usage_patterns) * 100 if usage_patterns else 0

        return ChatAgentQueryResponse(
            productId=product_id,
            intentContext=intent_context,
            usagePatterns=usage_patterns,
            semanticBridges=semantic_bridges,
            domainKnowledge=domain_knowledge,
            dataQuality=data_quality_summary,
            metadata={
                'totalIntents': len(intent_context),
                'totalUsagePatterns': len(usage_patterns),
                'totalSemanticBridges': len(semantic_bridges),
                'totalQueries': total_queries,
                'uniqueUsers': unique_users,
                'avgConfidence': round(avg_confidence, 2),
                'estimatedSuccessRate': round(avg_success_rate, 1),
                'hasQualityData': data_quality_summary is not None,
                'hasDomainKnowledge': domain_knowledge is not None
            }
        )

    except Exception as e:
        logger.error(f"Failed to query Living Context Graph for chat agent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
