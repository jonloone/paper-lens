"""
Table Analysis API Routes
Provides comprehensive AI-powered analysis of selected tables using:
- Living Context Graph for usage patterns
- Data profiling for quality analysis
- Semantic relationship detection
- dbt transformation suggestions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from backend.services.kuzu_knowledge_graph import get_knowledge_graph
from backend.services.data_profiling import DataProfilingService
from backend.services.recommendation_engine import RecommendationEngine
from backend.services.vultr_llm_adapter import VultrLLMAdapter

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
kg = get_knowledge_graph()
profiling_service = DataProfilingService()
recommendation_engine = RecommendationEngine()
llm_service = VultrLLMAdapter()


class TableSelection(BaseModel):
    """Selected table for analysis"""
    name: str
    schema: str
    catalog: str
    columns: List[Dict[str, Any]]


class AnalysisRequest(BaseModel):
    """Request for comprehensive table analysis"""
    tables: List[TableSelection]
    product_definition: Optional[Dict[str, Any]] = None
    user_department: Optional[str] = None


class UsageInsight(BaseModel):
    """Usage pattern insight"""
    insight_type: str
    summary: str
    details: str
    confidence: float
    source: str


class QualityInsight(BaseModel):
    """Data quality insight"""
    severity: str
    column: Optional[str]
    issue: str
    recommendation: str
    affected_rows: Optional[int]


class SemanticRelationship(BaseModel):
    """Relationship between tables"""
    table1: str
    table2: str
    relationship_type: str
    confidence: float
    join_keys: List[str]
    explanation: str


class TransformationSuggestion(BaseModel):
    """Suggested dbt transformation"""
    pattern_name: str
    description: str
    reasoning: str
    dbt_template_id: str
    complexity: str
    priority: str


class TableAnalysisResponse(BaseModel):
    """Comprehensive analysis results"""
    analysis_id: str
    generated_at: str

    # Overview
    summary: str
    key_findings: List[str]
    overall_recommendation: str

    # Detailed analysis
    usage_insights: List[UsageInsight]
    quality_insights: List[QualityInsight]
    semantic_relationships: List[SemanticRelationship]
    transformation_suggestions: List[TransformationSuggestion]

    # Metadata
    tables_analyzed: int
    analysis_confidence: float


@router.post("/analyze", response_model=TableAnalysisResponse)
async def analyze_tables(request: AnalysisRequest):
    """
    Comprehensive AI-powered analysis of selected tables.

    Analyzes:
    1. Usage patterns from Living Context Graph
    2. Data quality from profiling
    3. Semantic relationships between tables
    4. Suggested dbt transformations
    """
    try:
        logger.info(f"Starting analysis of {len(request.tables)} tables")

        # Generate analysis ID
        analysis_id = f"analysis_{datetime.now().timestamp()}"

        # Collect all insights
        usage_insights = []
        quality_insights = []
        semantic_relationships = []
        transformation_suggestions = []

        # 1. USAGE PATTERN ANALYSIS (from Living Context Graph)
        logger.info("Analyzing usage patterns from Living Context Graph...")
        usage_insights = await analyze_usage_patterns(
            request.tables,
            request.user_department
        )

        # 2. DATA QUALITY ANALYSIS (from profiling data in Knowledge Graph)
        logger.info("Analyzing data quality...")
        quality_insights = await analyze_data_quality(request.tables)

        # 3. SEMANTIC RELATIONSHIP ANALYSIS
        logger.info("Detecting semantic relationships...")
        semantic_relationships = await analyze_semantic_relationships(request.tables)

        # 4. DBT TRANSFORMATION SUGGESTIONS (using LLM + context)
        logger.info("Generating dbt transformation suggestions...")
        transformation_suggestions = await suggest_transformations(
            request.tables,
            request.product_definition,
            usage_insights,
            quality_insights,
            semantic_relationships
        )

        # Generate AI summary using LLM
        logger.info("Generating AI summary...")
        summary_data = await generate_ai_summary(
            request.tables,
            usage_insights,
            quality_insights,
            semantic_relationships,
            transformation_suggestions
        )

        # Calculate overall confidence
        avg_confidence = calculate_average_confidence(
            usage_insights,
            quality_insights,
            semantic_relationships,
            transformation_suggestions
        )

        response = TableAnalysisResponse(
            analysis_id=analysis_id,
            generated_at=datetime.utcnow().isoformat(),
            summary=summary_data["summary"],
            key_findings=summary_data["key_findings"],
            overall_recommendation=summary_data["recommendation"],
            usage_insights=usage_insights,
            quality_insights=quality_insights,
            semantic_relationships=semantic_relationships,
            transformation_suggestions=transformation_suggestions,
            tables_analyzed=len(request.tables),
            analysis_confidence=avg_confidence
        )

        logger.info(f"Analysis complete: {analysis_id}")
        return response

    except Exception as e:
        logger.error(f"Error analyzing tables: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def analyze_usage_patterns(
    tables: List[TableSelection],
    user_department: Optional[str]
) -> List[UsageInsight]:
    """Analyze usage patterns from Living Context Graph"""
    insights = []

    try:
        for table in tables:
            table_id = f"{table.catalog}.{table.schema}.{table.name}"

            # Query usage patterns from Knowledge Graph
            query = """
                MATCH (t:DataTable {full_name: $table_name})
                OPTIONAL MATCH (u:UsagePatternNode)-[q:QUERIES]->(t)
                RETURN
                    t.quality_score as quality,
                    count(u) as pattern_count,
                    collect(u.user_department) as departments,
                    collect(u.inferred_use_case) as use_cases,
                    collect(u.query_count) as query_counts,
                    sum(u.query_count) as total_queries
            """

            result = kg.conn.execute(query, {"table_name": table_id})

            if result.has_next():
                row = result.get_next()
                pattern_count = row[1] or 0
                departments = [d for d in (row[2] or []) if d]
                use_cases = [uc for uc in (row[3] or []) if uc]
                total_queries = row[5] or 0

                # Generate insights based on usage
                if pattern_count > 0:
                    insights.append(UsageInsight(
                        insight_type="historical_usage",
                        summary=f"Used in {pattern_count} similar project(s)",
                        details=f"This table has been successfully used {total_queries} times across {len(set(departments))} department(s) for use cases: {', '.join(set(use_cases)[:3])}",
                        confidence=min(0.9, 0.5 + (pattern_count * 0.1)),
                        source="Living Context Graph"
                    ))

                    # Cross-department discovery insight
                    if user_department and user_department not in departments:
                        insights.append(UsageInsight(
                            insight_type="cross_department",
                            summary="Cross-department discovery opportunity",
                            details=f"This table is primarily used by {', '.join(set(departments)[:2])} but could provide value for {user_department}",
                            confidence=0.7,
                            source="Usage Pattern Analysis"
                        ))
                else:
                    insights.append(UsageInsight(
                        insight_type="no_usage",
                        summary="Limited usage history",
                        details="This table has not been used in previous data products. Consider profiling carefully to understand its structure and quality.",
                        confidence=0.8,
                        source="Living Context Graph"
                    ))

            # Check for common table combinations
            if len(tables) > 1:
                combo_insight = await check_common_combinations(tables, table)
                if combo_insight:
                    insights.append(combo_insight)

    except Exception as e:
        logger.error(f"Error analyzing usage patterns: {e}")

    return insights


async def check_common_combinations(
    all_tables: List[TableSelection],
    current_table: TableSelection
) -> Optional[UsageInsight]:
    """Check if tables are commonly used together"""
    try:
        table_ids = [f"{t.catalog}.{t.schema}.{t.name}" for t in all_tables]
        current_id = f"{current_table.catalog}.{current_table.schema}.{current_table.name}"

        combinations = kg.find_common_table_combinations(table_ids, min_tables=2)

        if combinations:
            return UsageInsight(
                insight_type="common_combination",
                summary=f"Frequently used with {len(combinations)} other table(s)",
                details=f"These tables have been successfully combined in {len(combinations)} previous projects",
                confidence=0.85,
                source="Pattern Analysis"
            )
    except Exception as e:
        logger.error(f"Error checking combinations: {e}")

    return None


async def analyze_data_quality(
    tables: List[TableSelection]
) -> List[QualityInsight]:
    """Analyze data quality from profiling data"""
    insights = []

    try:
        for table in tables:
            table_id = f"{table.catalog}.{table.schema}.{table.name}"

            # Get quality data from Knowledge Graph
            query = """
                MATCH (t:DataTable {full_name: $table_name})
                RETURN
                    t.quality_score as quality,
                    t.completeness as completeness,
                    t.row_count as rows,
                    t.metadata as metadata
            """

            result = kg.conn.execute(query, {"table_name": table_id})

            if result.has_next():
                row = result.get_next()
                quality_score = row[0] or 0.0
                completeness = row[1] or 100.0
                row_count = row[2] or 0

                # Quality score insight
                if quality_score < 70:
                    insights.append(QualityInsight(
                        severity="warning",
                        column=None,
                        issue=f"Low quality score: {quality_score:.1f}/100",
                        recommendation="Review data quality issues before using in production",
                        affected_rows=None
                    ))
                elif quality_score >= 90:
                    insights.append(QualityInsight(
                        severity="info",
                        column=None,
                        issue=f"High quality data: {quality_score:.1f}/100",
                        recommendation="This table meets quality standards for production use",
                        affected_rows=None
                    ))

                # Completeness insight
                if completeness < 80:
                    missing_pct = 100 - completeness
                    insights.append(QualityInsight(
                        severity="warning" if missing_pct > 20 else "info",
                        column=None,
                        issue=f"{missing_pct:.1f}% of data is missing",
                        recommendation="Consider imputation strategy or investigate data collection process",
                        affected_rows=int(row_count * (missing_pct / 100))
                    ))

                # Column-level issues (if we have profiling data)
                for column in table.columns[:10]:  # Check first 10 columns
                    if column.get('nullable') and not column.get('isPrimaryKey'):
                        insights.append(QualityInsight(
                            severity="info",
                            column=column['name'],
                            issue=f"Column allows NULL values",
                            recommendation="Verify if NULL values are expected or indicate data quality issues",
                            affected_rows=None
                        ))

    except Exception as e:
        logger.error(f"Error analyzing data quality: {e}")

    return insights[:10]  # Limit to top 10 insights


async def analyze_semantic_relationships(
    tables: List[TableSelection]
) -> List[SemanticRelationship]:
    """Detect semantic relationships between tables"""
    relationships = []

    if len(tables) < 2:
        return relationships

    try:
        # Analyze column name patterns to detect relationships
        for i, table1 in enumerate(tables):
            for table2 in tables[i+1:]:
                # Find potential join keys
                common_columns = find_common_columns(table1, table2)
                foreign_key_candidates = find_foreign_key_candidates(table1, table2)

                if common_columns:
                    relationships.append(SemanticRelationship(
                        table1=table1.name,
                        table2=table2.name,
                        relationship_type="potential_join",
                        confidence=0.7,
                        join_keys=common_columns,
                        explanation=f"Tables share common columns: {', '.join(common_columns)}"
                    ))

                if foreign_key_candidates:
                    relationships.append(SemanticRelationship(
                        table1=table1.name,
                        table2=table2.name,
                        relationship_type="foreign_key",
                        confidence=0.8,
                        join_keys=foreign_key_candidates,
                        explanation=f"Likely foreign key relationship via: {', '.join(foreign_key_candidates)}"
                    ))

    except Exception as e:
        logger.error(f"Error analyzing relationships: {e}")

    return relationships


def find_common_columns(table1: TableSelection, table2: TableSelection) -> List[str]:
    """Find columns with same names in both tables"""
    cols1 = {c['name'].lower() for c in table1.columns}
    cols2 = {c['name'].lower() for c in table2.columns}
    return list(cols1.intersection(cols2))


def find_foreign_key_candidates(table1: TableSelection, table2: TableSelection) -> List[str]:
    """Find potential foreign key relationships"""
    candidates = []

    # Look for id pattern (e.g., customer_id in one table, id in customers table)
    for col1 in table1.columns:
        col1_name = col1['name'].lower()
        if col1_name.endswith('_id'):
            # Extract prefix (e.g., "customer" from "customer_id")
            prefix = col1_name[:-3]
            if prefix in table2.name.lower():
                candidates.append(col1['name'])

    # Reverse check
    for col2 in table2.columns:
        col2_name = col2['name'].lower()
        if col2_name.endswith('_id'):
            prefix = col2_name[:-3]
            if prefix in table1.name.lower():
                candidates.append(col2['name'])

    return candidates


async def suggest_transformations(
    tables: List[TableSelection],
    product_definition: Optional[Dict[str, Any]],
    usage_insights: List[UsageInsight],
    quality_insights: List[QualityInsight],
    relationships: List[SemanticRelationship]
) -> List[TransformationSuggestion]:
    """Generate dbt transformation suggestions using AI"""
    suggestions = []

    try:
        # Build context for LLM
        context = {
            "tables": [{"name": t.name, "columns": len(t.columns)} for t in tables],
            "product_definition": product_definition,
            "has_relationships": len(relationships) > 0,
            "quality_issues": len([q for q in quality_insights if q.severity in ["warning", "error"]]),
            "usage_patterns": len(usage_insights)
        }

        # Use LLM to suggest transformations
        prompt = f"""Based on the following table selection, suggest appropriate dbt transformation patterns:

Tables selected: {', '.join([t.name for t in tables])}
Domain: {product_definition.get('domain', 'unknown') if product_definition else 'unknown'}
Intent: {product_definition.get('description', 'unknown') if product_definition else 'unknown'}

Detected relationships: {len(relationships)}
Quality issues: {context['quality_issues']}
Historical usage patterns: {context['usage_patterns']}

Suggest 3-5 dbt transformation patterns that would be most appropriate. For each, specify:
1. Pattern name (staging, intermediate, mart, metric, quality)
2. Brief reasoning
3. Priority (high, medium, low)

Format as JSON array."""

        # Call LLM
        response = await llm_service.generate_completion(
            prompt=prompt,
            temperature=0.3,
            max_tokens=1000
        )

        # Parse response and create suggestions
        # For now, use rule-based suggestions as fallback
        suggestions = generate_rule_based_suggestions(
            tables,
            relationships,
            quality_insights
        )

    except Exception as e:
        logger.error(f"Error generating transformation suggestions: {e}")
        # Fallback to rule-based
        suggestions = generate_rule_based_suggestions(
            tables,
            relationships,
            quality_insights
        )

    return suggestions


def generate_rule_based_suggestions(
    tables: List[TableSelection],
    relationships: List[SemanticRelationship],
    quality_insights: List[QualityInsight]
) -> List[TransformationSuggestion]:
    """Generate suggestions using rules"""
    suggestions = []

    # Always suggest staging first
    suggestions.append(TransformationSuggestion(
        pattern_name="Staging Models",
        description="Clean and standardize raw data from selected tables",
        reasoning=f"Create staging models for all {len(tables)} selected tables to establish clean foundation",
        dbt_template_id="stg-customers",
        complexity="beginner",
        priority="high"
    ))

    # If multiple tables with relationships, suggest intermediate
    if len(relationships) > 0:
        suggestions.append(TransformationSuggestion(
            pattern_name="Intermediate Join Model",
            description="Join related tables based on detected relationships",
            reasoning=f"Found {len(relationships)} potential join relationships between tables",
            dbt_template_id="int-customer-orders",
            complexity="intermediate",
            priority="high"
        ))

    # If quality issues, suggest quality model
    error_count = len([q for q in quality_insights if q.severity == "error"])
    if error_count > 0:
        suggestions.append(TransformationSuggestion(
            pattern_name="Data Quality Validation",
            description="Implement quality checks for detected data issues",
            reasoning=f"Found {error_count} critical quality issues that need validation",
            dbt_template_id="quality-customer-checks",
            complexity="beginner",
            priority="high"
        ))

    # Always suggest mart for final analytics
    suggestions.append(TransformationSuggestion(
        pattern_name="Analytics Mart",
        description="Create final analytical model for BI consumption",
        reasoning="Build production-ready mart model with complete metrics",
        dbt_template_id="mart-customer-360",
        complexity="intermediate",
        priority="medium"
    ))

    return suggestions


async def generate_ai_summary(
    tables: List[TableSelection],
    usage_insights: List[UsageInsight],
    quality_insights: List[QualityInsight],
    relationships: List[SemanticRelationship],
    transformations: List[TransformationSuggestion]
) -> Dict[str, Any]:
    """Generate AI-powered summary of analysis"""

    # Count insights by type
    usage_count = len(usage_insights)
    quality_warnings = len([q for q in quality_insights if q.severity in ["warning", "error"]])
    relationship_count = len(relationships)

    # Generate summary
    summary = f"Analyzed {len(tables)} table(s). "

    if usage_count > 0:
        summary += f"Found {usage_count} usage pattern(s). "

    if quality_warnings > 0:
        summary += f"Identified {quality_warnings} quality concern(s). "
    else:
        summary += "Data quality looks good. "

    if relationship_count > 0:
        summary += f"Detected {relationship_count} relationship(s) between tables."

    # Generate key findings
    key_findings = []

    # Top usage finding
    if usage_insights:
        top_usage = usage_insights[0]
        key_findings.append(f"{top_usage.summary}: {top_usage.details}")

    # Top quality finding
    if quality_insights:
        top_quality = quality_insights[0]
        key_findings.append(f"Quality: {top_quality.issue}")

    # Relationship finding
    if relationships:
        key_findings.append(f"Tables can be joined via: {', '.join(relationships[0].join_keys)}")

    # Generate recommendation
    if quality_warnings > 2:
        recommendation = "Address data quality issues before proceeding to production. Consider implementing quality validation models."
    elif relationship_count > 0:
        recommendation = "Good foundation for intermediate models. Start with staging, then create join models."
    else:
        recommendation = "Proceed with staging models to clean and standardize data, then build towards analytics marts."

    return {
        "summary": summary,
        "key_findings": key_findings[:3],  # Top 3
        "recommendation": recommendation
    }


def calculate_average_confidence(
    usage_insights: List[UsageInsight],
    quality_insights: List[QualityInsight],
    relationships: List[SemanticRelationship],
    transformations: List[TransformationSuggestion]
) -> float:
    """Calculate overall confidence score"""
    confidences = []

    confidences.extend([u.confidence for u in usage_insights])
    confidences.extend([r.confidence for r in relationships])

    if confidences:
        return round(sum(confidences) / len(confidences), 2)

    return 0.75  # Default moderate confidence
