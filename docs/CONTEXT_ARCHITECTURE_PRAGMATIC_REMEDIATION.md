# Context Architecture: Pragmatic Enterprise Remediation Plan
## NexusOne Platform - Production-Ready Implementation Roadmap

**Date**: 2025-10-15
**Version**: 1.0
**Status**: Implementation Ready
**Owner**: NexusOne Engineering Team

---

## Executive Summary

This document provides a **pragmatic, enterprise-grade remediation plan** to close critical gaps in NexusOne's Context Architecture while avoiding over-engineering. Based on critical technical review, we've identified **3 phases of work** totaling 24 weeks, with clear ROI at each phase.

**Key Principle**: Implement incrementally, measure impact, scale what works.

### Success Criteria
- **Phase 1** (8 weeks): 40% reduction in table discovery time
- **Phase 2** (8 weeks): 50% faster source selection
- **Phase 3** (8 weeks): System learns from usage, recommendations improve by 20%

### Total Effort
- **Engineering**: 1.5 FTE (Full-Time Engineers) × 24 weeks
- **Infrastructure**: Minimal (uses existing Kuzu, Postgres, Redis)
- **Risk Level**: Low (incremental, backward-compatible changes)

---

## Part 1: Current State Assessment

### What's Working (Keep As-Is)

✅ **Living Context Graph Foundation**
- Kuzu embedded DB operational
- IntentNode, SemanticBridge, DataTable schema solid
- Multi-layer architecture (Physical → Logical → Semantic)
- Status: **Production-ready, no changes needed**

✅ **Quality Gates Automation**
- 3-tier system (blocking/warning/optimization)
- OPA, Great Expectations, Ranger integration
- Async execution, real-time status
- Status: **Production-ready, no changes needed**

✅ **Build Flow Integration**
- Intent capture, context confirmation
- SQLMesh integration for logical layer
- OpenSPG validation for semantic layer
- Status: **Production-ready, enhance with recommendations**

### Critical Gaps (Must Fix)

❌ **Gap 1: Usage Pattern Aggregation**
- Impact: System cannot learn from user behavior
- Risk: High-value patterns lost, no continuous improvement
- Priority: **P0 - Must Have**

❌ **Gap 2: Profile-Based Discovery**
- Impact: Users search by name only, miss statistically similar tables
- Risk: Poor source selection, repeated profiling work
- Priority: **P1 - Should Have**

❌ **Gap 3: Right-to-Left Recommendations**
- Impact: Users start from scratch, ignore existing successful patterns
- Risk: Reinventing wheel, inconsistent quality
- Priority: **P1 - Should Have**

### Over-Engineering to Avoid

🚫 **Real-time graph updates** → Batch hourly instead
🚫 **Individual query tracking** → Aggregate patterns only
🚫 **Exhaustive table comparisons** → Use embedding index
🚫 **Complex ML weighting** → Simple threshold rules
🚫 **Always-on column lineage** → On-demand only

---

## Part 2: Phase 1 - Usage Pattern Foundation (Weeks 1-8)

### Objective
Capture aggregated usage patterns without performance impact, enable basic "others used X" recommendations.

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Trino Query Logs (10M queries/day)                 │
└────────────────────┬────────────────────────────────┘
                     │ Sample 10%
                     ▼
┌─────────────────────────────────────────────────────┐
│  Pattern Aggregator (Hourly Batch Job)             │
│  - Group by: dept + product + query_signature       │
│  - Aggregate: count, avg_time, filters             │
└────────────────────┬────────────────────────────────┘
                     │ Batch write
                     ▼
┌─────────────────────────────────────────────────────┐
│  Kuzu Knowledge Graph                               │
│  + UsagePatternNode (new)                           │
│  + QUERIES relationship (new)                       │
└────────────────────┬────────────────────────────────┘
                     │ Query for recommendations
                     ▼
┌─────────────────────────────────────────────────────┐
│  Build Flow Step 2 (Enhanced)                       │
│  + "Others in your dept used..." panel              │
└─────────────────────────────────────────────────────┘
```

### Implementation Breakdown

#### Week 1-2: Kuzu Schema Enhancement

**File**: `backend/services/kuzu_schema.py`

**New Node Type**: `UsagePatternNode`
```python
CREATE NODE TABLE UsagePatternNode (
    id STRING,
    data_product_id STRING,
    user_department STRING,
    user_role STRING,

    -- Aggregated metrics (not individual queries)
    query_count INT64,
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    access_frequency STRING,  -- 'hourly' | 'daily' | 'weekly'

    -- Pattern characteristics
    typical_filters STRING,  -- JSON array of common WHERE clauses
    typical_aggregations STRING,  -- JSON array of GROUP BY patterns
    avg_row_count INT64,
    avg_duration_ms INT64,

    -- Inferred metadata (from pattern analysis)
    inferred_use_case STRING,  -- 'reporting' | 'analysis' | 'ml_feature'
    business_impact STRING,  -- 'critical' | 'important' | 'exploratory'
    confidence DOUBLE,  -- How confident we are in inference

    -- Metadata
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    metadata STRING,

    PRIMARY KEY (id)
)
```

**New Relationship**: `QUERIES`
```python
CREATE REL TABLE QUERIES (
    FROM UsagePatternNode TO DataTable,
    usage_type STRING,  -- 'source' | 'join' | 'reference'
    first_query TIMESTAMP,
    last_query TIMESTAMP,
    query_count INT64,
    avg_success_rate DOUBLE,
    metadata STRING
)
```

**Migration Script**:
```python
# backend/services/kuzu_schema.py - add to LivingContextSchema

@staticmethod
def create_usage_pattern_schema(conn):
    """Add usage pattern nodes and relationships"""

    # Create UsagePatternNode
    conn.execute("""
        CREATE NODE TABLE IF NOT EXISTS UsagePatternNode (
            id STRING,
            data_product_id STRING,
            user_department STRING,
            user_role STRING,
            query_count INT64,
            first_seen TIMESTAMP,
            last_seen TIMESTAMP,
            access_frequency STRING,
            typical_filters STRING,
            typical_aggregations STRING,
            avg_row_count INT64,
            avg_duration_ms INT64,
            inferred_use_case STRING,
            business_impact STRING,
            confidence DOUBLE,
            created_at TIMESTAMP,
            updated_at TIMESTAMP,
            metadata STRING,
            PRIMARY KEY (id)
        )
    """)

    # Create QUERIES relationship
    conn.execute("""
        CREATE REL TABLE IF NOT EXISTS QUERIES (
            FROM UsagePatternNode TO DataTable,
            usage_type STRING,
            first_query TIMESTAMP,
            last_query TIMESTAMP,
            query_count INT64,
            avg_success_rate DOUBLE,
            metadata STRING
        )
    """)

    logger.info("✅ Usage pattern schema created")
```

**Validation**:
```bash
# Test schema creation
python -c "
from backend.services.kuzu_knowledge_graph import get_knowledge_graph
from backend.services.kuzu_schema import LivingContextSchema

kg = get_knowledge_graph()
LivingContextSchema.create_usage_pattern_schema(kg.conn)

# Verify tables exist
tables = kg._get_existing_tables()
assert 'UsagePatternNode' in tables
assert 'QUERIES' in tables
print('✅ Schema migration successful')
"
```

---

#### Week 3-4: Query Log Sampler

**File**: `backend/services/usage_pattern_service.py` (NEW)

```python
"""
Usage Pattern Service
Samples and aggregates query logs into UsagePatternNodes
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import hashlib
import json
import asyncio

from .kuzu_knowledge_graph import get_knowledge_graph
from .trino_metrics_service import TrinoMetricsService

logger = logging.getLogger(__name__)


class UsagePatternService:
    """
    Aggregate query patterns from Trino logs (batch processing)

    Design Principles:
    1. Sample 10% of queries (not 100%) to avoid performance impact
    2. Aggregate hourly (not real-time) to batch graph writes
    3. Anonymize to dept/role (not individual users) for privacy
    4. Store patterns (not individual queries) to limit storage
    """

    def __init__(self):
        self.kg = get_knowledge_graph()
        self.trino = TrinoMetricsService()

    async def aggregate_patterns_hourly(self):
        """
        Main entry point: Run as hourly cron job

        Process:
        1. Fetch last hour's queries from Trino (10% sample)
        2. Group by pattern signature
        3. Aggregate metrics per pattern
        4. Batch update Kuzu graph
        """
        logger.info("Starting hourly usage pattern aggregation")

        try:
            # Fetch sampled queries
            queries = await self._fetch_sampled_queries(
                timeframe_hours=1,
                sample_percentage=0.10  # 10% sample
            )

            logger.info(f"Fetched {len(queries)} sampled queries")

            # Group by pattern
            patterns = self._group_by_pattern(queries)

            logger.info(f"Identified {len(patterns)} unique patterns")

            # Batch update graph
            updated = await self._batch_update_patterns(patterns)

            logger.info(f"✅ Updated {updated} usage patterns in graph")

            return {
                "queries_sampled": len(queries),
                "patterns_identified": len(patterns),
                "patterns_updated": updated
            }

        except Exception as e:
            logger.error(f"Pattern aggregation failed: {e}")
            return {"error": str(e)}

    async def _fetch_sampled_queries(
        self,
        timeframe_hours: int = 1,
        sample_percentage: float = 0.10
    ) -> List[Dict[str, Any]]:
        """
        Fetch sampled queries from Trino query logs

        Uses TABLESAMPLE for efficient sampling
        """
        cutoff_time = datetime.now() - timedelta(hours=timeframe_hours)

        # Query Trino information_schema.queries (if available)
        # Or query your logging system (Datadog, CloudWatch, etc.)

        # Placeholder: Replace with actual Trino query log fetch
        sample_query = f"""
        SELECT
            query_id,
            user AS user_id,
            query,
            state,
            execution_time_ms,
            total_bytes,
            output_rows,
            created_at
        FROM trino_query_logs
        WHERE created_at >= '{cutoff_time.isoformat()}'
        TABLESAMPLE BERNOULLI ({sample_percentage * 100})
        """

        # For MVP, use mock data or integrate with your actual logging
        queries = await self.trino.fetch_recent_queries(
            since=cutoff_time,
            sample_rate=sample_percentage
        )

        return queries

    def _group_by_pattern(
        self,
        queries: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Group queries by pattern signature

        Pattern signature = (user_dept, data_product, query_structure)
        Where query_structure = normalized SQL (table names, not values)
        """
        patterns = {}

        for query in queries:
            # Extract pattern components
            dept = self._extract_department(query["user_id"])
            product = self._extract_data_product(query["query"])
            signature = self._compute_query_signature(query["query"])

            # Create pattern key
            pattern_key = f"{dept}:{product}:{signature}"

            # Initialize or update pattern
            if pattern_key not in patterns:
                patterns[pattern_key] = {
                    "pattern_id": hashlib.md5(pattern_key.encode()).hexdigest(),
                    "user_department": dept,
                    "data_product_id": product,
                    "query_signature": signature,
                    "query_count": 0,
                    "total_duration_ms": 0,
                    "total_rows": 0,
                    "filters": [],
                    "aggregations": [],
                    "first_seen": query["created_at"],
                    "last_seen": query["created_at"]
                }

            # Aggregate metrics
            pattern = patterns[pattern_key]
            pattern["query_count"] += 1
            pattern["total_duration_ms"] += query.get("execution_time_ms", 0)
            pattern["total_rows"] += query.get("output_rows", 0)
            pattern["last_seen"] = max(pattern["last_seen"], query["created_at"])

            # Extract query patterns
            filters = self._extract_filters(query["query"])
            aggregations = self._extract_aggregations(query["query"])
            pattern["filters"].extend(filters)
            pattern["aggregations"].extend(aggregations)

        return list(patterns.values())

    def _compute_query_signature(self, query: str) -> str:
        """
        Compute normalized query signature (structure, not values)

        Example:
        "SELECT * FROM customers WHERE id = 123"
        → "SELECT * FROM customers WHERE id = ?"
        """
        # Simple approach: Hash of normalized query
        # For production: Use SQL parser to extract structure

        normalized = query.lower()

        # Replace numeric literals
        import re
        normalized = re.sub(r'\b\d+\b', '?', normalized)

        # Replace string literals
        normalized = re.sub(r"'[^']*'", "'?'", normalized)

        # Hash to fixed-length signature
        return hashlib.md5(normalized.encode()).hexdigest()[:16]

    def _extract_department(self, user_id: str) -> str:
        """
        Extract department from user_id

        Options:
        1. Lookup in user directory (LDAP, AD, etc.)
        2. Parse from email domain (eng@company.com → eng)
        3. Default to "unknown"
        """
        # Placeholder: Implement actual lookup
        if "@" in user_id:
            parts = user_id.split("@")[0].split(".")
            if len(parts) > 1:
                return parts[0]  # e.g., "eng.john" → "eng"

        return "unknown"

    def _extract_data_product(self, query: str) -> str:
        """
        Extract data product ID from query

        Heuristic: Primary table in FROM clause
        """
        # Simple regex to find FROM clause
        import re
        match = re.search(r'FROM\s+([a-zA-Z0-9_\.]+)', query, re.IGNORECASE)

        if match:
            table_name = match.group(1)
            # Convert to data product ID (table name or mapped product)
            return table_name

        return "unknown"

    def _extract_filters(self, query: str) -> List[str]:
        """Extract WHERE clause patterns"""
        import re

        # Find WHERE clauses
        where_match = re.search(r'WHERE\s+(.+?)(GROUP|ORDER|LIMIT|$)', query, re.IGNORECASE)

        if where_match:
            where_clause = where_match.group(1)

            # Extract column names (simple heuristic)
            columns = re.findall(r'([a-zA-Z_][a-zA-Z0-9_]*)\s*[=<>]', where_clause)
            return list(set(columns))  # Unique columns

        return []

    def _extract_aggregations(self, query: str) -> List[str]:
        """Extract GROUP BY patterns"""
        import re

        # Find GROUP BY clauses
        group_match = re.search(r'GROUP\s+BY\s+(.+?)(ORDER|LIMIT|$)', query, re.IGNORECASE)

        if group_match:
            group_clause = group_match.group(1)

            # Extract column names
            columns = re.findall(r'([a-zA-Z_][a-zA-Z0-9_]*)', group_clause)
            return list(set(columns))


        return []

    async def _batch_update_patterns(
        self,
        patterns: List[Dict[str, Any]]
    ) -> int:
        """
        Batch update UsagePatternNodes in Kuzu

        Uses MERGE to create or update patterns
        """
        updated_count = 0

        for pattern in patterns:
            try:
                # Infer use case and impact
                use_case = self._infer_use_case(pattern)
                impact = self._infer_impact(pattern)

                # Calculate averages
                avg_duration = (
                    pattern["total_duration_ms"] / pattern["query_count"]
                    if pattern["query_count"] > 0 else 0
                )
                avg_rows = (
                    pattern["total_rows"] / pattern["query_count"]
                    if pattern["query_count"] > 0 else 0
                )

                # Determine access frequency
                time_span = (pattern["last_seen"] - pattern["first_seen"]).total_seconds()
                frequency = self._calculate_frequency(pattern["query_count"], time_span)

                # Create or update UsagePatternNode
                self.kg.conn.execute("""
                    MERGE (u:UsagePatternNode {id: $id})
                    ON CREATE SET
                        u.data_product_id = $product_id,
                        u.user_department = $dept,
                        u.user_role = 'unknown',
                        u.query_count = $count,
                        u.first_seen = $first_seen,
                        u.last_seen = $last_seen,
                        u.access_frequency = $frequency,
                        u.typical_filters = $filters,
                        u.typical_aggregations = $aggs,
                        u.avg_row_count = $avg_rows,
                        u.avg_duration_ms = $avg_duration,
                        u.inferred_use_case = $use_case,
                        u.business_impact = $impact,
                        u.confidence = $confidence,
                        u.created_at = $created_at,
                        u.updated_at = $updated_at,
                        u.metadata = $metadata
                    ON MATCH SET
                        u.query_count = u.query_count + $count,
                        u.last_seen = $last_seen,
                        u.access_frequency = $frequency,
                        u.avg_row_count = $avg_rows,
                        u.avg_duration_ms = $avg_duration,
                        u.updated_at = $updated_at
                """, {
                    "id": pattern["pattern_id"],
                    "product_id": pattern["data_product_id"],
                    "dept": pattern["user_department"],
                    "count": pattern["query_count"],
                    "first_seen": pattern["first_seen"],
                    "last_seen": pattern["last_seen"],
                    "frequency": frequency,
                    "filters": json.dumps(pattern["filters"]),
                    "aggs": json.dumps(pattern["aggregations"]),
                    "avg_rows": int(avg_rows),
                    "avg_duration": int(avg_duration),
                    "use_case": use_case,
                    "impact": impact,
                    "confidence": 0.75,  # Base confidence
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "metadata": json.dumps({})
                })

                # Create QUERIES relationship to DataTable
                self.kg.conn.execute("""
                    MATCH (u:UsagePatternNode {id: $pattern_id})
                    MATCH (t:DataTable {id: $table_id})
                    MERGE (u)-[q:QUERIES]->(t)
                    ON CREATE SET
                        q.usage_type = 'source',
                        q.first_query = $first_seen,
                        q.last_query = $last_seen,
                        q.query_count = $count,
                        q.avg_success_rate = 1.0,
                        q.metadata = '{}'
                    ON MATCH SET
                        q.last_query = $last_seen,
                        q.query_count = q.query_count + $count
                """, {
                    "pattern_id": pattern["pattern_id"],
                    "table_id": pattern["data_product_id"],
                    "first_seen": pattern["first_seen"],
                    "last_seen": pattern["last_seen"],
                    "count": pattern["query_count"]
                })

                updated_count += 1

            except Exception as e:
                logger.error(f"Failed to update pattern {pattern['pattern_id']}: {e}")

        return updated_count

    def _infer_use_case(self, pattern: Dict[str, Any]) -> str:
        """
        Infer use case from query patterns

        Heuristics:
        - Many aggregations → reporting
        - Few aggregations, specific filters → analysis
        - No aggregations, large result sets → data export
        """
        agg_count = len(pattern["aggregations"])
        filter_count = len(pattern["filters"])
        avg_rows = pattern["total_rows"] / max(pattern["query_count"], 1)

        if agg_count > 3:
            return "reporting"
        elif agg_count > 0 and filter_count > 2:
            return "analysis"
        elif avg_rows > 100000:
            return "ml_feature" if filter_count > 0 else "data_export"
        else:
            return "exploratory"

    def _infer_impact(self, pattern: Dict[str, Any]) -> str:
        """
        Infer business impact from usage frequency and department

        Heuristics:
        - finance dept + high frequency → critical
        - multiple depts → important
        - low frequency → exploratory
        """
        dept = pattern["user_department"]
        count = pattern["query_count"]

        if dept in ["finance", "executive", "operations"] and count > 10:
            return "critical"
        elif count > 5:
            return "important"
        else:
            return "exploratory"

    def _calculate_frequency(self, query_count: int, time_span_seconds: float) -> str:
        """Calculate access frequency category"""
        if time_span_seconds == 0:
            return "unknown"

        queries_per_hour = (query_count / time_span_seconds) * 3600

        if queries_per_hour >= 1:
            return "hourly"
        elif queries_per_hour >= 0.1:  # Once every 10 hours
            return "daily"
        else:
            return "weekly"


# Singleton instance
_usage_pattern_service: Optional[UsagePatternService] = None


def get_usage_pattern_service() -> UsagePatternService:
    """Get or create singleton usage pattern service"""
    global _usage_pattern_service
    if _usage_pattern_service is None:
        _usage_pattern_service = UsagePatternService()
    return _usage_pattern_service
```

**Cron Job Configuration**:
```python
# backend/main.py - Add scheduled task

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from backend.services.usage_pattern_service import get_usage_pattern_service

# Initialize scheduler
scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour='*', minute='5')  # Every hour at :05
async def aggregate_usage_patterns():
    """Hourly job to aggregate usage patterns"""
    logger.info("Starting scheduled usage pattern aggregation")

    service = get_usage_pattern_service()
    result = await service.aggregate_patterns_hourly()

    logger.info(f"Pattern aggregation result: {result}")

# Start scheduler on app startup
@app.on_event("startup")
async def start_scheduler():
    scheduler.start()
    logger.info("✅ Scheduler started - usage patterns will aggregate hourly")
```

---

#### Week 5-6: Recommendation Engine

**File**: `backend/services/recommendation_engine.py` (ENHANCE)

```python
"""
Recommendation Engine
Suggests tables based on usage patterns
"""

from typing import List, Dict, Any, Optional
from .kuzu_knowledge_graph import get_knowledge_graph
from .usage_pattern_service import get_usage_pattern_service

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Generate recommendations based on usage patterns

    Simple threshold-based rules (no ML)
    """

    def __init__(self):
        self.kg = get_knowledge_graph()

    async def recommend_tables_for_intent(
        self,
        business_keywords: List[str],
        user_department: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Recommend tables based on similar usage patterns

        Strategy:
        1. Find UsagePatternNodes with overlapping keywords
        2. Filter by same department (or related)
        3. Sort by usage frequency + business impact
        4. Return top N with explanations
        """

        recommendations = []

        # Query 1: Find patterns from same department
        dept_patterns = self.kg.conn.execute("""
            MATCH (u:UsagePatternNode {user_department: $dept})
            -[q:QUERIES]->(t:DataTable)
            WHERE u.query_count >= 5  -- Minimum usage threshold
            RETURN
                t.id as table_id,
                t.full_name as table_name,
                t.quality_score as quality,
                u.inferred_use_case as use_case,
                u.business_impact as impact,
                u.query_count as usage_count,
                u.user_department as dept
            ORDER BY u.query_count DESC, t.quality_score DESC
            LIMIT $limit
        """, {
            "dept": user_department,
            "limit": limit * 2  # Fetch extra, will filter later
        })

        while dept_patterns.has_next():
            row = dept_patterns.get_next()
            recommendations.append({
                "table_id": row[0],
                "table_name": row[1],
                "quality_score": row[2],
                "use_case": row[3],
                "business_impact": row[4],
                "usage_count": row[5],
                "source": "department_patterns",
                "explanation": f"Used {row[5]} times by {row[6]} team",
                "confidence": 0.85
            })

        # Query 2: Find patterns from all departments with high business impact
        if len(recommendations) < limit:
            critical_patterns = self.kg.conn.execute("""
                MATCH (u:UsagePatternNode {business_impact: 'critical'})
                -[q:QUERIES]->(t:DataTable)
                WHERE t.quality_score >= 80
                RETURN
                    t.id as table_id,
                    t.full_name as table_name,
                    t.quality_score as quality,
                    u.inferred_use_case as use_case,
                    u.business_impact as impact,
                    u.query_count as usage_count,
                    u.user_department as dept
                ORDER BY t.quality_score DESC
                LIMIT $limit
            """, {"limit": limit})

            while critical_patterns.has_next():
                row = critical_patterns.get_next()

                # Avoid duplicates
                if not any(r["table_id"] == row[0] for r in recommendations):
                    recommendations.append({
                        "table_id": row[0],
                        "table_name": row[1],
                        "quality_score": row[2],
                        "use_case": row[3],
                        "business_impact": row[4],
                        "usage_count": row[5],
                        "source": "critical_patterns",
                        "explanation": f"Critical table used {row[5]} times across teams",
                        "confidence": 0.75
                    })

        # Limit to requested count
        return recommendations[:limit]

    async def explain_recommendation(
        self,
        table_id: str,
        user_department: str
    ) -> Dict[str, Any]:
        """
        Provide detailed explanation for why table was recommended
        """

        # Query usage patterns for this table
        patterns = self.kg.conn.execute("""
            MATCH (u:UsagePatternNode)-[q:QUERIES]->(t:DataTable {id: $table_id})
            RETURN
                u.user_department as dept,
                u.inferred_use_case as use_case,
                u.query_count as count,
                u.typical_filters as filters
            ORDER BY u.query_count DESC
            LIMIT 5
        """, {"table_id": table_id})

        usage_summary = []
        while patterns.has_next():
            row = patterns.get_next()
            usage_summary.append({
                "department": row[0],
                "use_case": row[1],
                "query_count": row[2],
                "typical_filters": json.loads(row[3]) if row[3] else []
            })

        return {
            "table_id": table_id,
            "usage_summary": usage_summary,
            "total_patterns": len(usage_summary),
            "recommendation": f"This table is actively used by {len(usage_summary)} team(s)"
        }


# Singleton
_recommendation_engine: Optional[RecommendationEngine] = None


def get_recommendation_engine() -> RecommendationEngine:
    """Get or create singleton recommendation engine"""
    global _recommendation_engine
    if _recommendation_engine is None:
        _recommendation_engine = RecommendationEngine()
    return _recommendation_engine
```

**API Endpoint**:
```python
# backend/api/recommendations_routes.py (NEW)

from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel

from ..services.recommendation_engine import get_recommendation_engine

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])
rec_engine = get_recommendation_engine()


class RecommendationRequest(BaseModel):
    business_keywords: List[str]
    user_department: str
    limit: int = 5


@router.post("/tables")
async def get_table_recommendations(request: RecommendationRequest):
    """Get table recommendations based on usage patterns"""

    try:
        recommendations = await rec_engine.recommend_tables_for_intent(
            business_keywords=request.business_keywords,
            user_department=request.user_department,
            limit=request.limit
        )

        return {
            "recommendations": recommendations,
            "count": len(recommendations)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/explain/{table_id}")
async def explain_table_recommendation(
    table_id: str,
    user_department: str
):
    """Explain why a table was recommended"""

    try:
        explanation = await rec_engine.explain_recommendation(
            table_id=table_id,
            user_department=user_department
        )

        return explanation

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

#### Week 7-8: UI Integration

**File**: `components/build/SmartSuggestionsPanel.tsx` (NEW)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Users, Info } from 'lucide-react';

interface Recommendation {
  table_id: string;
  table_name: string;
  quality_score: number;
  use_case: string;
  business_impact: string;
  usage_count: number;
  source: string;
  explanation: string;
  confidence: number;
}

interface SmartSuggestionsPanelProps {
  businessKeywords: string[];
  userDepartment: string;
  onSelectTable: (tableId: string) => void;
}

export function SmartSuggestionsPanel({
  businessKeywords,
  userDepartment,
  onSelectTable
}: SmartSuggestionsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [businessKeywords, userDepartment]);

  async function fetchRecommendations() {
    setLoading(true);

    try {
      const response = await fetch('/api/recommendations/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_keywords: businessKeywords,
          user_department: userDepartment,
          limit: 5
        })
      });

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchExplanation(tableId: string) {
    try {
      const response = await fetch(
        `/api/recommendations/explain/${tableId}?user_department=${userDepartment}`
      );
      const explanation = await response.json();
      // Show explanation in modal or tooltip
      setShowExplanation(explanation);
    } catch (error) {
      console.error('Failed to fetch explanation:', error);
    }
  }

  if (loading) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Suggestions
          </CardTitle>
          <CardDescription>Finding tables used by others in your team...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            Smart Suggestions
          </CardTitle>
          <CardDescription>No usage patterns found yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            As more data products are built, we'll suggest tables based on what others in your team have successfully used.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Suggestions
          <Badge variant="secondary" className="ml-auto">
            Based on usage patterns
          </Badge>
        </CardTitle>
        <CardDescription>
          Tables successfully used by others in your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.table_id}
            className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
            onClick={() => onSelectTable(rec.table_id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-mono text-sm font-medium">
                  {rec.table_name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {rec.usage_count} uses
                  </Badge>
                  <Badge
                    variant={
                      rec.business_impact === 'critical' ? 'destructive' :
                      rec.business_impact === 'important' ? 'default' :
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {rec.business_impact}
                  </Badge>
                  {rec.quality_score >= 90 && (
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {rec.quality_score}% quality
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {rec.explanation}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchExplanation(rec.table_id);
                }}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            💡 These suggestions improve as more data products are built. Confidence varies by usage frequency and business impact.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Integration into Build Flow Step 2**:
```typescript
// components/build/steps/Step2SelectSources.tsx

import { SmartSuggestionsPanel } from '../SmartSuggestionsPanel';

export function Step2SelectSources({ productDefinition, onContinue }: Props) {
  // ... existing code ...

  return (
    <div className="space-y-6">
      {/* Add Smart Suggestions at top */}
      {productDefinition.businessKeywords?.length > 0 && (
        <SmartSuggestionsPanel
          businessKeywords={productDefinition.businessKeywords}
          userDepartment={productDefinition.stakeholder?.department || 'unknown'}
          onSelectTable={(tableId) => {
            // Auto-add suggested table to selection
            handleTableSelect(tableId);
          }}
        />
      )}

      {/* Existing table browser */}
      <TableBrowser {...props} />
    </div>
  );
}
```

---

### Phase 1 Success Metrics

**Measurement**:
```python
# backend/api/metrics_routes.py

@router.get("/metrics/usage-patterns")
async def get_usage_pattern_metrics():
    """
    Track Phase 1 success metrics
    """
    kg = get_knowledge_graph()

    # Metric 1: Total patterns captured
    total_patterns = kg.conn.execute("""
        MATCH (u:UsagePatternNode)
        RETURN COUNT(u) as count
    """).get_next()[0]

    # Metric 2: Departments covered
    depts = kg.conn.execute("""
        MATCH (u:UsagePatternNode)
        RETURN COUNT(DISTINCT u.user_department) as count
    """).get_next()[0]

    # Metric 3: Tables with usage data
    tables_with_usage = kg.conn.execute("""
        MATCH (t:DataTable)<-[:QUERIES]-(u:UsagePatternNode)
        RETURN COUNT(DISTINCT t) as count
    """).get_next()[0]

    # Metric 4: Recommendation acceptance rate
    # (Track in frontend analytics)

    return {
        "total_patterns": total_patterns,
        "departments_covered": depts,
        "tables_with_usage": tables_with_usage,
        "target": {
            "patterns": "1000+",
            "departments": "All major (5+)",
            "tables": "70% of active tables"
        }
    }
```

**Target KPIs (Week 8)**:
- ✅ 1,000+ usage patterns captured
- ✅ 70%+ of active tables have usage data
- ✅ 5+ departments represented
- ✅ 40% reduction in table discovery time (user study)
- ✅ 60%+ recommendation acceptance rate

---

## Part 3: Deployment & Testing

### Testing Strategy

**Unit Tests**:
```python
# backend/tests/test_usage_pattern_service.py

import pytest
from backend.services.usage_pattern_service import UsagePatternService

@pytest.mark.asyncio
async def test_pattern_aggregation():
    """Test pattern aggregation logic"""
    service = UsagePatternService()

    # Mock queries
    queries = [
        {
            "query_id": "1",
            "user_id": "eng.john@company.com",
            "query": "SELECT * FROM customers WHERE active = true",
            "created_at": datetime.now(),
            "execution_time_ms": 150,
            "output_rows": 1000
        },
        # ... more mock queries
    ]

    # Test pattern grouping
    patterns = service._group_by_pattern(queries)

    assert len(patterns) > 0
    assert "user_department" in patterns[0]
    assert patterns[0]["query_count"] > 0

@pytest.mark.asyncio
async def test_recommendation_engine():
    """Test recommendation generation"""
    from backend.services.recommendation_engine import get_recommendation_engine

    engine = get_recommendation_engine()

    recommendations = await engine.recommend_tables_for_intent(
        business_keywords=["customer", "revenue"],
        user_department="finance",
        limit=5
    )

    assert isinstance(recommendations, list)
    assert all("table_id" in r for r in recommendations)
    assert all("explanation" in r for r in recommendations)
```

### Deployment Steps

**Step 1: Schema Migration** (15 min)
```bash
# Run schema migration
python -c "
from backend.services.kuzu_knowledge_graph import get_knowledge_graph
from backend.services.kuzu_schema import LivingContextSchema

kg = get_knowledge_graph()
LivingContextSchema.create_usage_pattern_schema(kg.conn)
print('✅ Schema migration complete')
"
```

**Step 2: Deploy Service** (30 min)
```bash
# Deploy backend with new services
git pull origin main
pip install -r backend/requirements.txt
systemctl restart nexusone-backend

# Verify scheduler started
curl http://localhost:8000/health
# Should show: "scheduler_running": true
```

**Step 3: Initial Pattern Load** (1 hour)
```bash
# Manually trigger first aggregation (don't wait for hourly cron)
python -c "
import asyncio
from backend.services.usage_pattern_service import get_usage_pattern_service

async def run():
    service = get_usage_pattern_service()
    result = await service.aggregate_patterns_hourly()
    print(f'Initial load: {result}')

asyncio.run(run())
"
```

**Step 4: Deploy Frontend** (15 min)
```bash
# Deploy frontend with new components
cd frontend
npm run build
npm run start
```

**Step 5: Smoke Test** (15 min)
```bash
# Test recommendation API
curl -X POST http://localhost:8000/recommendations/tables \
  -H "Content-Type: application/json" \
  -d '{
    "business_keywords": ["customer", "revenue"],
    "user_department": "finance",
    "limit": 5
  }'

# Should return recommendations based on usage patterns
```

---

## Conclusion

This Phase 1 implementation provides:
- ✅ **Enterprise-grade**: Batch processing, anonymization, scalability
- ✅ **Pragmatic**: Simple heuristics, no ML overhead, clear explanations
- ✅ **Measurable**: Clear KPIs, A/B testable, user feedback loops
- ✅ **Incremental**: Backward-compatible, can deploy gradually

**Next**: Phase 2 (Profile Similarity) builds on this foundation, adding embedding-based discovery.

Total implementation time: **8 weeks** | Total cost: **1.5 FTE** | Risk: **Low**
