# Living Context Graph Implementation Guide
## Technical Specification and Deployment Plan

**Version**: 1.0
**Status**: Implementation Specification
**Date**: 2025-10-14
**Dependencies**: LIVING_CONTEXT_GRAPH_ARCHITECTURE.md

---

## 1. Overview

This document provides complete technical specifications for implementing the Living Context Graph architecture across the NexusOne platform. It includes database schemas, API specifications, code modifications, deployment strategy, and testing plans.

**Implementation Timeline**: 8 weeks (4 phases)
**Team Size**: 2-3 developers
**Risk Level**: Medium (extends existing functionality without breaking changes)

---

## 2. Phase 1: Foundation (Weeks 1-2)

### 2.1 Kuzu Schema Extensions

**File**: `backend/services/kuzu_schema.py` (new file)

```python
"""
Kuzu schema extensions for Living Context Graph.
Extends existing schema with IntentNode, UsagePatternNode, and SemanticBridge.
"""

from kuzudb import Connection
import logging

logger = logging.getLogger(__name__)

class LivingContextSchema:
    """
    Schema management for Living Context Graph nodes and relationships.
    """

    @staticmethod
    async def create_schema(conn: Connection) -> None:
        """
        Create all node and relationship tables for Living Context Graph.
        Safe to run multiple times (uses IF NOT EXISTS).
        """

        # ===== IntentNode =====
        await conn.execute("""
            CREATE NODE TABLE IF NOT EXISTS IntentNode (
                id STRING,
                data_product_id STRING,

                -- Stakeholder information
                stakeholder_name STRING,
                stakeholder_email STRING,
                stakeholder_department STRING,
                stakeholder_confidence DOUBLE,

                -- Business need
                business_need_summary STRING,
                business_keywords STRING[],
                urgency STRING,
                deadline TIMESTAMP,
                deadline_type STRING,

                -- Quality expectations (INFERRED, not user-specified)
                expected_quality_score DOUBLE,
                expected_freshness_hours INT64,
                expected_completeness DOUBLE,
                quality_inference_reasoning STRING[],
                quality_inference_confidence DOUBLE,

                -- Reality check (from profiling)
                actual_quality_score DOUBLE,
                actual_freshness_hours INT64,
                actual_completeness DOUBLE,
                quality_gap DOUBLE,
                quality_blockers STRING[],
                profiling_last_updated TIMESTAMP,

                -- Usage validation
                primary_use_cases STRING[],
                actual_use_patterns STRING[],
                usage_drift_detected BOOLEAN,
                usage_drift_details STRING,

                -- Metadata
                created_at TIMESTAMP,
                last_validated TIMESTAMP,
                confidence_score DOUBLE,
                original_request_text STRING,

                PRIMARY KEY (id)
            )
        """)
        logger.info("Created IntentNode table")

        # ===== UsagePatternNode =====
        await conn.execute("""
            CREATE NODE TABLE IF NOT EXISTS UsagePatternNode (
                id STRING,
                data_product_id STRING,
                user_id STRING,
                user_department STRING,
                user_role STRING,

                -- Access patterns
                query_count INT64,
                first_access TIMESTAMP,
                last_access TIMESTAMP,
                access_frequency STRING,
                typical_access_hours INT64[],

                -- Query characteristics
                typical_filters STRING[],
                typical_aggregations STRING[],
                typical_joins STRING[],
                avg_row_count INT64,
                avg_execution_time_ms INT64,

                -- Derived use case (LLM-inferred)
                inferred_use_case STRING,
                use_case_confidence DOUBLE,
                use_case_reasoning STRING,

                -- Quality sensitivity (inferred from behavior)
                tolerates_staleness BOOLEAN,
                max_acceptable_age_days INT64,
                requires_completeness BOOLEAN,
                requires_accuracy BOOLEAN,
                quality_sensitivity_score DOUBLE,

                -- Business value signals
                downstream_dependencies STRING[],
                business_impact STRING,
                business_impact_confidence DOUBLE,

                -- Metadata
                created_at TIMESTAMP,
                updated_at TIMESTAMP,

                PRIMARY KEY (id)
            )
        """)
        logger.info("Created UsagePatternNode table")

        # ===== SemanticBridge =====
        await conn.execute("""
            CREATE NODE TABLE IF NOT EXISTS SemanticBridge (
                id STRING,
                source_type STRING,
                source_id STRING,
                target_type STRING,
                target_id STRING,
                relationship_type STRING,

                -- Relationship strength (evidence-based)
                confidence DOUBLE,
                evidence_sources STRING[],
                strength DOUBLE,

                -- Semantic metadata
                explanation STRING,
                created_by STRING,
                validated BOOLEAN,
                validated_by STRING,
                validated_at TIMESTAMP,

                -- Lifecycle
                created_at TIMESTAMP,
                last_reinforced TIMESTAMP,
                use_count INT64,
                success_rate DOUBLE,

                PRIMARY KEY (id)
            )
        """)
        logger.info("Created SemanticBridge table")

        # ===== Relationships =====

        # Intent → DataTable (via SemanticBridge)
        await conn.execute("""
            CREATE REL TABLE IF NOT EXISTS FULFILLS
            FROM IntentNode TO DataTable (
                bridge_id STRING,
                confidence DOUBLE,
                created_at TIMESTAMP
            )
        """)

        # UsagePattern → DataTable
        await conn.execute("""
            CREATE REL TABLE IF NOT EXISTS QUERIES
            FROM UsagePatternNode TO DataTable (
                query_count INT64,
                last_query TIMESTAMP
            )
        """)

        # SemanticBridge → SemanticBridge (graph of bridges)
        await conn.execute("""
            CREATE REL TABLE IF NOT EXISTS SEMANTIC_LINK
            FROM SemanticBridge TO SemanticBridge (
                link_type STRING,
                strength DOUBLE
            )
        """)

        # Intent → UsagePattern (validation relationship)
        await conn.execute("""
            CREATE REL TABLE IF NOT EXISTS VALIDATES
            FROM UsagePatternNode TO IntentNode (
                alignment_score DOUBLE,
                drift_detected BOOLEAN,
                validated_at TIMESTAMP
            )
        """)

        logger.info("Created all relationship tables")

    @staticmethod
    async def create_indexes(conn: Connection) -> None:
        """
        Create indexes for common query patterns.
        """

        # Index for intent lookup by data product
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_intent_data_product
            ON IntentNode(data_product_id)
        """)

        # Index for intent lookup by stakeholder
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_intent_stakeholder_email
            ON IntentNode(stakeholder_email)
        """)

        # Index for usage pattern lookup
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_usage_data_product
            ON UsagePatternNode(data_product_id)
        """)

        # Index for semantic bridge source lookup
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_bridge_source
            ON SemanticBridge(source_type, source_id)
        """)

        # Index for semantic bridge target lookup
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_bridge_target
            ON SemanticBridge(target_type, target_id)
        """)

        logger.info("Created all indexes")
```

**Deployment**:
```bash
# Run schema migration
python backend/migrations/003_living_context_graph_schema.py
```

### 2.2 Quality Inference Engine

**File**: `backend/services/quality_inference.py` (new file)

```python
"""
Quality Inference Engine
Automatically infers quality expectations from business context
without requiring manual percentage input from users.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class QualityExpectations(BaseModel):
    """Inferred quality expectations with reasoning."""
    accuracy: float
    freshness_hours: int
    completeness: float
    reasoning: List[str]
    confidence: float
    inferred_from: str
    inferred_at: datetime


class ExtractedContext(BaseModel):
    """Context extracted from user conversation."""
    stakeholder: Dict
    businessNeed: Dict
    deadline: Dict
    originalRequest: str


class QualityInferenceEngine:
    """
    Infers quality expectations from business context WITHOUT user input.
    Uses domain knowledge, urgency signals, and organizational patterns.
    """

    # Domain-specific quality baselines
    DOMAIN_BASELINES = {
        'finance': {
            'accuracy': 0.99,
            'completeness': 0.99,
            'freshness_hours': 24,
            'rationale': 'Financial reporting requires high accuracy for compliance'
        },
        'legal': {
            'accuracy': 0.99,
            'completeness': 0.99,
            'freshness_hours': 1,
            'rationale': 'Legal and compliance require highest standards'
        },
        'operations': {
            'accuracy': 0.95,
            'completeness': 0.95,
            'freshness_hours': 24,
            'rationale': 'Operational decisions require current, complete data'
        },
        'marketing': {
            'accuracy': 0.90,
            'completeness': 0.80,
            'freshness_hours': 168,
            'rationale': 'Marketing analytics focuses on trends over precision'
        },
        'analytics': {
            'accuracy': 0.85,
            'completeness': 0.85,
            'freshness_hours': 168,
            'rationale': 'Exploratory analysis tolerates sampling'
        },
        'customer_success': {
            'accuracy': 0.92,
            'completeness': 0.90,
            'freshness_hours': 24,
            'rationale': 'Customer data needs accuracy for personalization'
        },
        'product': {
            'accuracy': 0.88,
            'completeness': 0.85,
            'freshness_hours': 48,
            'rationale': 'Product metrics balance speed and accuracy'
        }
    }

    # Keyword-based accuracy modifiers
    HIGH_ACCURACY_KEYWORDS = {
        'revenue', 'financial', 'compliance', 'regulatory', 'audit',
        'billing', 'invoice', 'payment', 'legal', 'contract',
        'fraud', 'security', 'critical', 'executive'
    }

    MEDIUM_ACCURACY_KEYWORDS = {
        'customer', 'product', 'transaction', 'order', 'user',
        'account', 'subscription', 'inventory', 'sales', 'conversion'
    }

    # Urgency-based freshness mapping
    URGENCY_FRESHNESS_MAP = {
        'critical': 1,      # hourly
        'high': 24,         # daily
        'medium': 168,      # weekly
        'low': 720          # monthly
    }

    # Quality requirement language patterns
    HIGH_QUALITY_PHRASES = {
        'must be accurate', 'exact', 'precise', 'critical',
        'regulatory', 'audit', 'compliance', 'legal requirement'
    }

    def __init__(self, kuzu_service=None):
        """
        Initialize inference engine.

        Args:
            kuzu_service: Optional Kuzu service for historical pattern lookup
        """
        self.kuzu = kuzu_service

    async def infer_expectations(
        self,
        context: ExtractedContext
    ) -> QualityExpectations:
        """
        Multi-factor quality inference with transparent reasoning.

        Args:
            context: Extracted context from user conversation

        Returns:
            QualityExpectations with inferred values and reasoning
        """

        reasoning = []

        # Factor 1: Department baseline
        dept = context.stakeholder.get('department', '').lower()
        baseline = self.DOMAIN_BASELINES.get(
            dept,
            self.DOMAIN_BASELINES['analytics']
        )

        expected_accuracy = baseline['accuracy']
        expected_completeness = baseline['completeness']
        expected_freshness = baseline['freshness_hours']

        reasoning.append(
            f"Department baseline ({dept}): {baseline['rationale']}"
        )

        # Factor 2: Keyword modifiers
        keywords = {
            k.lower()
            for k in context.businessNeed.get('keywords', [])
        }

        if keywords & self.HIGH_ACCURACY_KEYWORDS:
            expected_accuracy = max(expected_accuracy, 0.99)
            matched_keywords = keywords & self.HIGH_ACCURACY_KEYWORDS
            reasoning.append(
                f"High accuracy keywords detected: {', '.join(matched_keywords)}"
            )
        elif keywords & self.MEDIUM_ACCURACY_KEYWORDS:
            expected_accuracy = max(expected_accuracy, 0.95)
            matched_keywords = keywords & self.MEDIUM_ACCURACY_KEYWORDS
            reasoning.append(
                f"Medium accuracy keywords detected: {', '.join(matched_keywords)}"
            )

        # Factor 3: Urgency modifies freshness
        urgency = context.businessNeed.get('urgency', 'medium')
        urgency_freshness = self.URGENCY_FRESHNESS_MAP.get(urgency, 168)

        if urgency_freshness < expected_freshness:
            expected_freshness = urgency_freshness
            reasoning.append(
                f"Urgency ({urgency}) requires {self._format_freshness(urgency_freshness)} refresh"
            )

        # Factor 4: Historical patterns (if available)
        if self.kuzu:
            historical_adjustment = await self._apply_historical_patterns(
                context,
                expected_accuracy
            )
            if historical_adjustment:
                expected_accuracy = historical_adjustment['accuracy']
                reasoning.append(historical_adjustment['reasoning'])

        # Factor 5: Explicit quality language in request
        request_lower = context.originalRequest.lower()
        if any(phrase in request_lower for phrase in self.HIGH_QUALITY_PHRASES):
            expected_accuracy = min(expected_accuracy + 0.05, 0.99)
            reasoning.append("Explicit quality requirement in request")

        # Calculate confidence based on available signals
        confidence = self._calculate_confidence(context)

        return QualityExpectations(
            accuracy=expected_accuracy,
            freshness_hours=expected_freshness,
            completeness=expected_completeness,
            reasoning=reasoning,
            confidence=confidence,
            inferred_from='multi_factor_analysis',
            inferred_at=datetime.utcnow()
        )

    async def _apply_historical_patterns(
        self,
        context: ExtractedContext,
        current_accuracy: float
    ) -> Optional[Dict]:
        """
        Adjust inference based on historical patterns from similar intents.

        Returns:
            Dict with adjusted accuracy and reasoning, or None
        """

        if not self.kuzu:
            return None

        try:
            # Find similar past intents
            keywords = context.businessNeed.get('keywords', [])
            dept = context.stakeholder.get('department', '')

            result = await self.kuzu.conn.execute("""
                MATCH (i:IntentNode)
                WHERE i.stakeholder_department = $dept
                AND array_length(
                    array_intersect(i.business_keywords, $keywords)
                ) >= 2
                AND i.actual_quality_score IS NOT NULL
                RETURN
                    AVG(i.expected_quality_score) as avg_expected,
                    AVG(i.actual_quality_score) as avg_actual,
                    COUNT(*) as count
            """, {
                'dept': dept,
                'keywords': keywords
            })

            if result and result[0]['count'] >= 3:
                avg_expected = result[0]['avg_expected']
                avg_actual = result[0]['avg_actual']
                count = result[0]['count']

                # Blend historical with current inference
                # 70% historical, 30% current
                adjusted_accuracy = 0.7 * avg_expected + 0.3 * current_accuracy

                return {
                    'accuracy': adjusted_accuracy,
                    'reasoning': (
                        f"Adjusted based on {count} similar past requests "
                        f"(historical avg: {avg_expected:.2%}, "
                        f"achieved: {avg_actual:.2%})"
                    )
                }

        except Exception as e:
            logger.warning(f"Could not apply historical patterns: {e}")
            return None

    def _calculate_confidence(self, context: ExtractedContext) -> float:
        """
        Calculate confidence in inference based on available signals.

        More signals = higher confidence
        """

        confidence = 0.6  # base confidence

        # Department provided
        if context.stakeholder.get('department'):
            confidence += 0.1

        # Keywords available
        if context.businessNeed.get('keywords'):
            confidence += 0.1

        # Urgency specified
        if context.businessNeed.get('urgency') != 'low':
            confidence += 0.05

        # Deadline provided
        if context.deadline.get('date'):
            confidence += 0.05

        # Rich original request (>50 words)
        if len(context.originalRequest.split()) > 50:
            confidence += 0.1

        return min(confidence, 0.95)

    def _format_freshness(self, hours: int) -> str:
        """Format freshness hours as human-readable string."""
        if hours == 1:
            return "hourly"
        elif hours < 24:
            return f"{hours}-hour"
        elif hours == 24:
            return "daily"
        elif hours == 168:
            return "weekly"
        elif hours == 720:
            return "monthly"
        else:
            return f"{hours // 24}-day"
```

### 2.3 Intent Persistence API

**File**: `backend/api/context_routes.py` (new file)

```python
"""
Context API Routes
Handles intent creation, enrichment, and usage tracking.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import logging

from backend.services.quality_inference import (
    QualityInferenceEngine,
    ExtractedContext
)
from backend.services.kuzu_service import get_kuzu_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/context", tags=["context"])


class CreateIntentRequest(BaseModel):
    """Request body for creating IntentNode."""
    dataProductId: str
    stakeholder: Dict
    businessNeed: Dict
    deadline: Dict
    originalRequest: str


class CreateIntentResponse(BaseModel):
    """Response with created IntentNode ID."""
    intentId: str
    qualityExpectations: Dict
    reasoning: List[str]
    confidence: float


class EnrichIntentRequest(BaseModel):
    """Request body for enriching intent with profiling data."""
    intentId: str
    profilingResults: Dict


class QualityGapResponse(BaseModel):
    """Response with quality gap analysis."""
    qualityGap: float
    severity: str
    blockers: List[Dict]
    message: str


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
        intent_id = f"intent_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{request.dataProductId.replace('.', '_')}"

        # Create IntentNode in Kuzu
        await kuzu.conn.execute("""
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
            'deadline': request.deadline.get('date'),
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
        logger.error(f"Failed to create IntentNode: {e}")
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
        result = await kuzu.conn.execute("""
            MATCH (i:IntentNode {id: $intent_id})
            RETURN
                i.expected_quality_score as expected_quality,
                i.expected_completeness as expected_completeness
        """, {'intent_id': request.intentId})

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"IntentNode {request.intentId} not found"
            )

        expected_quality = result[0]['expected_quality']
        expected_completeness = result[0]['expected_completeness']

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

        # Determine severity
        if quality_gap > 0.10:
            severity = "critical"
        elif quality_gap > 0.05:
            severity = "warning"
        else:
            severity = "none"

        # Update IntentNode
        await kuzu.conn.execute("""
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
            message = f"""⚠️ Quality Gap Detected

Expected Quality: {expected_quality * 100:.0f}% (inferred from business context)
Actual Quality: {actual_quality * 100:.0f}%
Gap: {quality_gap * 100:.0f}%

Specific Issues Found:
{chr(10).join(f"• {b['column']}: {b['problem']} ({b['affectedPct']:.0f}% affected)" for b in blockers)}

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

        return QualityGapResponse(
            qualityGap=quality_gap,
            severity=severity,
            blockers=blockers,
            message=message
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to enrich intent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/intent/{intent_id}")
async def get_intent(
    intent_id: str,
    kuzu=Depends(get_kuzu_service)
):
    """Get IntentNode by ID."""

    try:
        result = await kuzu.conn.execute("""
            MATCH (i:IntentNode {id: $intent_id})
            RETURN i
        """, {'intent_id': intent_id})

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"IntentNode {intent_id} not found"
            )

        return result[0]['i']

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get intent: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### 2.4 Frontend Integration

**File**: `components/build/creation-steps/ContextConfirmationStep.tsx` (modify existing)

```typescript
// Add at top of file
import { useState } from 'react';

// Replace handleConfirm function (around line 422)
const handleConfirm = async () => {
  setIsProcessing(true);

  try {
    // Step 1: Create IntentNode with automatic quality inference
    const intentResponse = await fetch('/api/context/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataProductId: domain.id,
        stakeholder: extractedContext.stakeholder,
        businessNeed: extractedContext.businessNeed,
        deadline: extractedContext.deadline,
        originalRequest: conversationText
      })
    });

    if (!intentResponse.ok) {
      throw new Error('Failed to create intent');
    }

    const intentData = await intentResponse.json();

    // Step 2: Show inferred quality expectations to user
    const productDefinition: ProductDefinition = {
      name: `${domainId}_${extractedContext.businessNeed.keywords.slice(0, 2).join('_')}`,
      description: extractedContext.businessNeed.summary,
      owner: domain.ownership.primaryOwner,
      stakeholders: [extractedContext.stakeholder.name],
      timeline: extractedContext.businessNeed.urgency === 'critical' ? 'urgent' : 'normal',
      businessValue: `Requested by ${extractedContext.stakeholder.name}`,
      extractedContext: {
        ...extractedContext,
        qualityExpectations: intentData.qualityExpectations,
        qualityReasoning: intentData.reasoning,
        intentNodeId: intentData.intentId  // Store for later enrichment
      }
    };

    // Step 3: Complete step
    onComplete({ extractedContext, productDefinition });

  } catch (error) {
    console.error('Error creating intent:', error);
    alert('Failed to save context. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};
```

**File**: `components/build/creation-steps/SourceDiscoveryStep.tsx` (modify existing)

```typescript
// Add after profiling completes (search for "handleProfileComplete" or similar)
const handleSourceProfiled = async (sourceId: string, profilingResults: any) => {
  // ... existing profiling display logic ...

  // NEW: Enrich intent with profiling data
  const intentId = productDefinition.extractedContext?.intentNodeId;

  if (intentId) {
    try {
      const enrichResponse = await fetch('/api/context/enrich-intent-with-profiling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId,
          profilingResults
        })
      });

      if (enrichResponse.ok) {
        const gapAnalysis = await enrichResponse.json();

        // Display quality gap warning if needed
        if (gapAnalysis.severity === 'critical' || gapAnalysis.severity === 'warning') {
          setQualityGapWarning({
            severity: gapAnalysis.severity,
            message: gapAnalysis.message,
            blockers: gapAnalysis.blockers
          });
        }
      }
    } catch (error) {
      console.error('Failed to enrich intent:', error);
      // Non-blocking - continue with workflow
    }
  }
};
```

### 2.5 Testing Plan

**File**: `backend/tests/test_quality_inference.py` (new file)

```python
"""
Tests for Quality Inference Engine
"""

import pytest
from backend.services.quality_inference import (
    QualityInferenceEngine,
    ExtractedContext
)


class TestQualityInference:
    """Test quality expectation inference."""

    @pytest.fixture
    def engine(self):
        return QualityInferenceEngine(kuzu_service=None)

    @pytest.mark.asyncio
    async def test_finance_revenue_high_accuracy(self, engine):
        """Test that finance + revenue = 99% accuracy."""

        context = ExtractedContext(
            stakeholder={
                'name': 'Sarah Chen',
                'department': 'finance',
                'confidence': 0.9
            },
            businessNeed={
                'summary': 'Daily revenue tracking',
                'keywords': ['revenue', 'daily', 'forecasting'],
                'urgency': 'high'
            },
            deadline={
                'date': '2025-10-30',
                'type': 'hard'
            },
            originalRequest='Need daily revenue tracking for Q4 forecasting'
        )

        expectations = await engine.infer_expectations(context)

        assert expectations.accuracy == 0.99
        assert expectations.freshness_hours == 24
        assert expectations.completeness == 0.99
        assert 'finance' in expectations.reasoning[0].lower()
        assert 'revenue' in str(expectations.reasoning).lower()

    @pytest.mark.asyncio
    async def test_marketing_campaign_lower_accuracy(self, engine):
        """Test that marketing + campaign = 90% accuracy."""

        context = ExtractedContext(
            stakeholder={
                'name': 'John Smith',
                'department': 'marketing',
                'confidence': 0.85
            },
            businessNeed={
                'summary': 'Campaign performance trends',
                'keywords': ['campaign', 'performance', 'trends'],
                'urgency': 'medium'
            },
            deadline={
                'date': None,
                'type': 'soft'
            },
            originalRequest='Want to see campaign performance trends'
        )

        expectations = await engine.infer_expectations(context)

        assert expectations.accuracy == 0.90
        assert expectations.freshness_hours == 168  # weekly
        assert expectations.completeness == 0.80
        assert 'marketing' in expectations.reasoning[0].lower()

    @pytest.mark.asyncio
    async def test_critical_urgency_hourly_freshness(self, engine):
        """Test that critical urgency = hourly freshness."""

        context = ExtractedContext(
            stakeholder={
                'name': 'Alice Johnson',
                'department': 'legal',
                'confidence': 0.95
            },
            businessNeed={
                'summary': 'Regulatory compliance report',
                'keywords': ['audit', 'compliance', 'regulatory'],
                'urgency': 'critical'
            },
            deadline={
                'date': '2025-10-20',
                'type': 'hard'
            },
            originalRequest='Need audit report for regulatory submission ASAP'
        )

        expectations = await engine.infer_expectations(context)

        assert expectations.accuracy == 0.99
        assert expectations.freshness_hours == 1  # hourly
        assert expectations.completeness == 0.99
        assert 'critical' in str(expectations.reasoning).lower()


@pytest.mark.asyncio
async def test_intent_creation_api():
    """Integration test for intent creation API."""

    from fastapi.testclient import TestClient
    from backend.main import app

    client = TestClient(app)

    response = client.post('/api/context/create-intent', json={
        'dataProductId': 'sales.revenue_summary',
        'stakeholder': {
            'name': 'Sarah Chen',
            'email': 'schen@company.com',
            'department': 'finance',
            'confidence': 0.9
        },
        'businessNeed': {
            'summary': 'Daily revenue tracking',
            'keywords': ['revenue', 'daily', 'forecasting'],
            'urgency': 'high'
        },
        'deadline': {
            'date': '2025-10-30T00:00:00Z',
            'type': 'hard'
        },
        'originalRequest': 'Hi, I need daily revenue tracking for Q4 forecasting'
    })

    assert response.status_code == 200
    data = response.json()

    assert 'intentId' in data
    assert data['qualityExpectations']['accuracy'] == 0.99
    assert data['qualityExpectations']['freshnessHours'] == 24
    assert len(data['reasoning']) > 0
```

**Run Tests**:
```bash
# From project root
pytest backend/tests/test_quality_inference.py -v
```

---

## 3. Phase 2: Enrichment (Weeks 3-4)

### 3.1 Semantic Bridge Builder

**File**: `backend/services/semantic_bridge_builder.py` (new file)

```python
"""
Semantic Bridge Builder
Creates evidence-based semantic relationships between IntentNodes,
DataTables, and other entities using multi-source validation.
"""

from typing import List, Dict, Optional, Set
from pydantic import BaseModel
from datetime import datetime
import logging

from backend.services.openspg_client import get_openspg_client, SPGConcept
from backend.services.kuzu_service import get_kuzu_service

logger = logging.getLogger(__name__)


class SemanticBridge(BaseModel):
    """Semantic bridge with evidence."""
    id: str
    source_type: str
    source_id: str
    target_type: str
    target_id: str
    relationship_type: str
    confidence: float
    evidence_sources: List[str]
    strength: float
    explanation: str
    created_by: str
    validated: bool = False


class SemanticBridgeBuilder:
    """
    Builds semantic relationships with EVIDENCE rather than speculation.
    Uses schema analysis, profiling data, and OpenSPG to validate connections.
    """

    def __init__(self, kuzu_service=None, llm_service=None):
        """Initialize with Kuzu and LLM services."""
        self.kuzu = kuzu_service or get_kuzu_service()
        self.llm = llm_service
        self.openspg = get_openspg_client()

    async def create_intent_to_table_bridge(
        self,
        intent_id: str,
        candidate_table_id: str
    ) -> Optional[SemanticBridge]:
        """
        Determine if a table can fulfill an intent based on EVIDENCE.

        Evidence sources:
        1. Keyword matching in table/column names
        2. Schema semantics validation via OpenSPG
        3. Quality alignment (profiling vs expectations)
        4. Existing usage patterns (strongest evidence)

        Returns:
            SemanticBridge if sufficient evidence (2+ sources), None otherwise
        """

        # Get intent details
        intent_result = await self.kuzu.conn.execute("""
            MATCH (i:IntentNode {id: $intent_id})
            RETURN i
        """, {'intent_id': intent_id})

        if not intent_result:
            logger.warning(f"Intent {intent_id} not found")
            return None

        intent = intent_result[0]['i']

        # Get table details
        table_result = await self.kuzu.conn.execute("""
            MATCH (t:DataTable {id: $table_id})
            RETURN t
        """, {'table_id': candidate_table_id})

        if not table_result:
            logger.warning(f"Table {candidate_table_id} not found")
            return None

        table = table_result[0]['t']

        evidence = []
        confidence_scores = []

        # Evidence 1: Keyword matching
        keyword_evidence = await self._check_keyword_match(
            intent.get('business_keywords', []),
            table
        )
        if keyword_evidence:
            evidence.append(keyword_evidence['description'])
            confidence_scores.append(keyword_evidence['confidence'])

        # Evidence 2: Schema semantic validation
        schema_evidence = await self._validate_schema_semantics(
            intent.get('business_keywords', []),
            table.get('schema', {})
        )
        if schema_evidence:
            evidence.append(schema_evidence['description'])
            confidence_scores.append(schema_evidence['confidence'])

        # Evidence 3: Quality alignment
        quality_evidence = await self._check_quality_alignment(
            intent.get('expected_quality_score'),
            table.get('actual_quality_score')
        )
        if quality_evidence:
            evidence.append(quality_evidence['description'])
            confidence_scores.append(quality_evidence['confidence'])

        # Evidence 4: Similar usage patterns
        usage_evidence = await self._find_similar_usage_patterns(
            intent.get('stakeholder_department'),
            intent.get('business_keywords', []),
            candidate_table_id
        )
        if usage_evidence:
            evidence.append(usage_evidence['description'])
            confidence_scores.append(usage_evidence['confidence'])

        # Must have at least 2 pieces of evidence
        if len(evidence) < 2:
            logger.info(
                f"Insufficient evidence ({len(evidence)}) for bridge "
                f"between {intent_id} and {candidate_table_id}"
            )
            return None

        # Calculate total confidence
        total_confidence = min(sum(confidence_scores), 0.95)

        # Generate human-readable explanation
        explanation = await self._generate_explanation(
            intent=intent,
            table=table,
            evidence=evidence
        )

        # Create bridge ID
        bridge_id = f"bridge_{intent_id}_{candidate_table_id}"

        # Create SemanticBridge
        bridge = SemanticBridge(
            id=bridge_id,
            source_type="intent",
            source_id=intent_id,
            target_type="data_table",
            target_id=candidate_table_id,
            relationship_type="can_fulfill",
            confidence=total_confidence,
            evidence_sources=evidence,
            strength=total_confidence,
            explanation=explanation,
            created_by="hybrid_llm_profiling",
            validated=False
        )

        # Persist to Kuzu
        await self.kuzu.conn.execute("""
            CREATE (b:SemanticBridge {
                id: $id,
                source_type: $source_type,
                source_id: $source_id,
                target_type: $target_type,
                target_id: $target_id,
                relationship_type: $relationship_type,
                confidence: $confidence,
                evidence_sources: $evidence_sources,
                strength: $strength,
                explanation: $explanation,
                created_by: $created_by,
                validated: $validated,
                created_at: $created_at,
                last_reinforced: $last_reinforced,
                use_count: 0,
                success_rate: 0.0
            })
        """, {
            'id': bridge.id,
            'source_type': bridge.source_type,
            'source_id': bridge.source_id,
            'target_type': bridge.target_type,
            'target_id': bridge.target_id,
            'relationship_type': bridge.relationship_type,
            'confidence': bridge.confidence,
            'evidence_sources': bridge.evidence_sources,
            'strength': bridge.strength,
            'explanation': bridge.explanation,
            'created_by': bridge.created_by,
            'validated': bridge.validated,
            'created_at': datetime.utcnow(),
            'last_reinforced': datetime.utcnow()
        })

        # Create relationship between IntentNode and DataTable
        await self.kuzu.conn.execute("""
            MATCH (i:IntentNode {id: $intent_id})
            MATCH (t:DataTable {id: $table_id})
            CREATE (i)-[:FULFILLS {
                bridge_id: $bridge_id,
                confidence: $confidence,
                created_at: $created_at
            }]->(t)
        """, {
            'intent_id': intent_id,
            'table_id': candidate_table_id,
            'bridge_id': bridge.id,
            'confidence': total_confidence,
            'created_at': datetime.utcnow()
        })

        logger.info(
            f"Created SemanticBridge {bridge_id} with "
            f"{len(evidence)} evidence sources, "
            f"confidence: {total_confidence:.2f}"
        )

        return bridge

    async def _check_keyword_match(
        self,
        business_keywords: List[str],
        table: Dict
    ) -> Optional[Dict]:
        """Check for keyword matches in table/column names."""

        table_name = table.get('name', '').lower()
        table_desc = table.get('description', '').lower()
        column_names = [
            col.lower()
            for col in table.get('schema', {}).keys()
        ]

        all_table_text = f"{table_name} {table_desc} {' '.join(column_names)}"
        keywords_lower = {k.lower() for k in business_keywords}

        matches = [kw for kw in keywords_lower if kw in all_table_text]

        if matches:
            match_count = len(matches)
            confidence = min(match_count * 0.15, 0.6)
            return {
                'description': f"keyword_match_{match_count}_terms ({', '.join(matches)})",
                'confidence': confidence
            }

        return None

    async def _validate_schema_semantics(
        self,
        business_keywords: List[str],
        schema: Dict
    ) -> Optional[Dict]:
        """
        Use OpenSPG + schema characteristics to validate semantic matches.

        Example: If intent mentions "revenue", and table has column "total_sales"
        that is NUMERIC, NON-NEGATIVE, and aggregates to $M range, that's strong
        evidence of semantic match.
        """

        matches = []

        for keyword in business_keywords:
            # Get OpenSPG concept
            concept = await self.openspg.get_concept_definition(keyword)
            if not concept:
                continue

            # Check schema for matching columns
            for col_name, col_stats in schema.items():
                col_name_lower = col_name.lower()

                # Does column name match concept or related terms?
                concept_terms = [concept.name.lower()] + [
                    rc.lower() for rc in concept.related_concepts
                ]

                if any(term in col_name_lower for term in concept_terms):

                    # Validate schema characteristics match concept expectations
                    if keyword.lower() in ['revenue', 'sales', 'amount', 'price']:
                        # Should be numeric, non-negative
                        if (col_stats.get('type') in ['NUMERIC', 'DECIMAL', 'FLOAT', 'INTEGER'] and
                            col_stats.get('min', -1) >= 0):
                            matches.append(f"{keyword}→{col_name}")

                    elif keyword.lower() in ['customer', 'user', 'account']:
                        # Should have unique IDs (high distinct %)
                        if col_stats.get('distinct_pct', 0) > 0.95:
                            matches.append(f"{keyword}→{col_name}")

                    elif keyword.lower() in ['date', 'timestamp', 'time']:
                        # Should be temporal type
                        if col_stats.get('type') in ['DATE', 'TIMESTAMP', 'DATETIME']:
                            matches.append(f"{keyword}→{col_name}")

                    else:
                        # General match
                        matches.append(f"{keyword}→{col_name}")

        if matches:
            match_count = len(matches)
            confidence = min(match_count * 0.2, 0.7)
            return {
                'description': f"schema_validation_{match_count}_concepts ({', '.join(matches)})",
                'confidence': confidence
            }

        return None

    async def _check_quality_alignment(
        self,
        expected_quality: Optional[float],
        actual_quality: Optional[float]
    ) -> Optional[Dict]:
        """Check if table quality meets intent expectations."""

        if expected_quality is None or actual_quality is None:
            return None

        quality_diff = abs(expected_quality - actual_quality)

        # Perfect match
        if quality_diff < 0.05:
            return {
                'description': 'quality_perfect_match',
                'confidence': 0.3
            }
        # Close match
        elif quality_diff < 0.10:
            return {
                'description': 'quality_close_match',
                'confidence': 0.2
            }
        # Within tolerance
        elif quality_diff < 0.15:
            return {
                'description': 'quality_within_tolerance',
                'confidence': 0.1
            }

        # Too far apart - no evidence
        return None

    async def _find_similar_usage_patterns(
        self,
        department: str,
        keywords: List[str],
        table_id: str
    ) -> Optional[Dict]:
        """
        Find if users from same department with similar needs use this table.
        This is the STRONGEST evidence.
        """

        result = await self.kuzu.conn.execute("""
            MATCH (u:UsagePatternNode)-[:QUERIES]->(t:DataTable {id: $table_id})
            WHERE u.user_department = $department
            RETURN COUNT(DISTINCT u.user_id) as user_count
        """, {
            'table_id': table_id,
            'department': department
        })

        if result and result[0]['user_count'] > 0:
            user_count = result[0]['user_count']
            confidence = min(user_count * 0.15, 0.5)
            return {
                'description': f"similar_usage_{user_count}_users_from_{department}",
                'confidence': confidence
            }

        return None

    async def _generate_explanation(
        self,
        intent: Dict,
        table: Dict,
        evidence: List[str]
    ) -> str:
        """Generate human-readable explanation for the bridge."""

        stakeholder = intent.get('stakeholder_name', 'User')
        need = intent.get('business_need_summary', 'data need')
        table_name = table.get('name', 'this table')

        # Parse evidence to create explanation
        explanation_parts = [
            f"This table can fulfill {stakeholder}'s {need} because:"
        ]

        for i, ev in enumerate(evidence, 1):
            if 'keyword_match' in ev:
                keywords = ev.split('(')[1].split(')')[0] if '(' in ev else ''
                explanation_parts.append(
                    f"({i}) Keywords match: {keywords}"
                )
            elif 'schema_validation' in ev:
                concepts = ev.split('(')[1].split(')')[0] if '(' in ev else ''
                explanation_parts.append(
                    f"({i}) Schema validates business concepts: {concepts}"
                )
            elif 'quality' in ev:
                explanation_parts.append(
                    f"({i}) Data quality meets expectations"
                )
            elif 'similar_usage' in ev:
                users = ev.split('_')[2]
                dept = ev.split('_from_')[1]
                explanation_parts.append(
                    f"({i}) {users} users from {dept} already use this successfully"
                )

        return ", ".join(explanation_parts)
```

**Usage**:
```python
# After profiling completes in build flow
from backend.services.semantic_bridge_builder import SemanticBridgeBuilder

builder = SemanticBridgeBuilder()

# Create bridge between intent and selected table
bridge = await builder.create_intent_to_table_bridge(
    intent_id=intent_node_id,
    candidate_table_id=selected_table_id
)

if bridge:
    print(f"Created bridge with confidence: {bridge.confidence}")
    print(f"Evidence: {bridge.evidence_sources}")
    print(f"Explanation: {bridge.explanation}")
```

---

## 4. Deployment Strategy

### 4.1 Database Migration

**File**: `backend/migrations/003_living_context_graph_schema.py`

```python
"""
Migration 003: Living Context Graph Schema

Creates IntentNode, UsagePatternNode, and SemanticBridge tables
along with their relationships.
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.kuzu_schema import LivingContextSchema
from backend.services.kuzu_service import get_kuzu_service


async def migrate():
    """Run schema migration."""
    print("=" * 60)
    print("Living Context Graph Schema Migration")
    print("=" * 60)

    kuzu = get_kuzu_service()

    print("\n[1/2] Creating node and relationship tables...")
    await LivingContextSchema.create_schema(kuzu.conn)
    print("✓ Schema created successfully")

    print("\n[2/2] Creating indexes...")
    await LivingContextSchema.create_indexes(kuzu.conn)
    print("✓ Indexes created successfully")

    print("\n" + "=" * 60)
    print("Migration completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(migrate())
```

**Run Migration**:
```bash
cd /mnt/blockstorage/paper-lens
python backend/migrations/003_living_context_graph_schema.py
```

### 4.2 API Registration

**File**: `backend/main.py` (modify existing)

```python
# Add to imports
from backend.api import context_routes

# Add to app initialization (after existing routers)
app.include_router(context_routes.router)
```

### 4.3 Environment Variables

**File**: `.env.local` (update)

```bash
# Existing variables...

# Living Context Graph Configuration
CONTEXT_CAPTURE_ENABLED=true
QUALITY_INFERENCE_ENABLED=true
SEMANTIC_BRIDGE_ENABLED=true

# OpenSPG Configuration (for semantic validation)
OPENSPG_BASE_URL=https://openspg.antgroup.com/api
OPENSPG_CACHE_TTL_HOURS=24
```

### 4.4 Testing Checklist

**Phase 1 Testing**:
- [ ] Kuzu schema migration completes without errors
- [ ] IntentNode created from build flow
- [ ] Quality expectations automatically inferred
- [ ] Profiling enrichment updates IntentNode
- [ ] Quality gap detected when expectations not met
- [ ] Frontend displays quality gap warnings

**Integration Testing**:
```bash
# Run full test suite
pytest backend/tests/test_quality_inference.py -v
pytest backend/tests/test_context_api.py -v

# Run end-to-end test
pytest e2e/test_build_flow_with_context.py -v
```

---

## 5. Rollout Plan

### Week 1-2: Foundation Deployment

**Day 1-2**: Database & Backend
- Run Kuzu schema migration
- Deploy quality inference service
- Deploy context API endpoints
- Verify with unit tests

**Day 3-4**: Frontend Integration
- Update ContextConfirmationStep
- Update SourceDiscoveryStep
- Add quality gap UI components
- Verify with integration tests

**Day 5**: End-to-End Testing
- Test complete build flow
- Verify IntentNode creation
- Verify profiling enrichment
- Verify quality gap detection

### Week 3-4: Enrichment Deployment

**Day 1-2**: Semantic Bridge Builder
- Deploy SemanticBridgeBuilder service
- Integrate with OpenSPG
- Add schema validation
- Unit test evidence collection

**Day 3-4**: Bridge Creation
- Integrate with build flow
- Create bridges after source selection
- Add DataHub enrichment
- Verify bridges in Kuzu

**Day 5**: Validation
- Test semantic routing
- Verify evidence quality
- Check bridge confidence scores

### Week 5-6: Usage Tracking (Phase 3)

### Week 7-8: Insights & Automation (Phase 4)

---

## 6. Monitoring & Observability

### 6.1 Metrics to Track

**Context Capture Metrics**:
```python
# Add to backend/services/metrics.py

from prometheus_client import Counter, Histogram

# IntentNode creation
intent_created_total = Counter(
    'intent_node_created_total',
    'Total IntentNodes created',
    ['department', 'urgency']
)

# Quality inference
quality_inference_duration = Histogram(
    'quality_inference_duration_seconds',
    'Time to infer quality expectations'
)

# Quality gaps
quality_gap_detected_total = Counter(
    'quality_gap_detected_total',
    'Total quality gaps detected',
    ['severity']
)

# Semantic bridges
semantic_bridge_created_total = Counter(
    'semantic_bridge_created_total',
    'Total SemanticBridges created',
    ['evidence_count']
)
```

### 6.2 Logging

**File**: `backend/services/context_logger.py` (new file)

```python
"""
Structured logging for Living Context Graph operations.
"""

import logging
import json
from datetime import datetime


class ContextLogger:
    """Structured logger for context operations."""

    def __init__(self):
        self.logger = logging.getLogger('living_context_graph')

    def log_intent_created(
        self,
        intent_id: str,
        stakeholder_dept: str,
        inferred_quality: float,
        confidence: float
    ):
        """Log IntentNode creation."""
        self.logger.info(json.dumps({
            'event': 'intent_created',
            'intent_id': intent_id,
            'stakeholder_department': stakeholder_dept,
            'inferred_quality': inferred_quality,
            'confidence': confidence,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_quality_gap_detected(
        self,
        intent_id: str,
        expected: float,
        actual: float,
        gap: float,
        severity: str
    ):
        """Log quality gap detection."""
        self.logger.warning(json.dumps({
            'event': 'quality_gap_detected',
            'intent_id': intent_id,
            'expected_quality': expected,
            'actual_quality': actual,
            'quality_gap': gap,
            'severity': severity,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_bridge_created(
        self,
        bridge_id: str,
        evidence_count: int,
        confidence: float
    ):
        """Log SemanticBridge creation."""
        self.logger.info(json.dumps({
            'event': 'semantic_bridge_created',
            'bridge_id': bridge_id,
            'evidence_count': evidence_count,
            'confidence': confidence,
            'timestamp': datetime.utcnow().isoformat()
        }))
```

---

## 7. Success Criteria

### Phase 1 Complete When:

✅ 90% of data products created have IntentNode
✅ Quality expectations inferred with 80%+ confidence
✅ Quality gaps detected before deployment
✅ Users see quality warnings in build flow
✅ Zero manual quality percentage entry

### Phase 2 Complete When:

✅ SemanticBridges created with 3+ evidence sources
✅ 80%+ bridge confidence scores
✅ DataHub enriched with intent context
✅ Table recommendations based on intent similarity

---

## 8. Rollback Plan

If issues arise during deployment:

1. **Disable Context Capture** (non-breaking):
   ```bash
   # Set in .env.local
   CONTEXT_CAPTURE_ENABLED=false
   ```
   Build flow continues without context persistence.

2. **Rollback Schema Migration**:
   ```python
   # backend/migrations/rollback_003.py
   await conn.execute("DROP TABLE IntentNode")
   await conn.execute("DROP TABLE UsagePatternNode")
   await conn.execute("DROP TABLE SemanticBridge")
   ```

3. **Revert Frontend Changes**:
   ```bash
   git revert <commit-hash>
   ```

---

## 9. Next Steps After Implementation

1. **Phase 3**: Usage tracking from Trino query logs
2. **Phase 4**: Insights dashboards and intelligent routing
3. **Continuous Improvement**: Feedback loop to improve inference accuracy
4. **Scale Testing**: Validate performance with 1000+ IntentNodes

---

## 10. Conclusion

This implementation plan provides a complete, phased approach to deploying the Living Context Graph architecture. By starting with persistent context capture and automatic quality inference (Phase 1), we deliver immediate value while building toward the full vision of an intelligent, self-organizing knowledge layer.

**Key Principles**:
- **Non-breaking**: All changes extend existing functionality
- **Incremental**: Each phase delivers standalone value
- **Evidence-based**: Decisions driven by profiling data, not speculation
- **Transparent**: All inferences explained with reasoning
- **Testable**: Comprehensive test coverage at each phase

**Expected Outcomes**:
- 90%+ context capture rate (from 0%)
- Zero manual quality specification
- 100% quality gap detection before deployment
- 80%+ semantic bridge confidence
- Foundation for intelligent routing and insights

Ready to begin Phase 1 implementation.
