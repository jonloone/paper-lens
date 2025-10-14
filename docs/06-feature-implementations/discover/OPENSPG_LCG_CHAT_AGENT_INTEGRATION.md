# OpenSPG + Living Context Graph Chat Agent Integration
## Domain-Aware AI Assistant with Organizational Intelligence

**Status**: ✅ Implemented
**Phase**: Discovery / Product Detail Enhancement
**Last Updated**: 2025-10-14

---

## Executive Summary

The Domain-Aware Chat Agent combines **industry-standard knowledge from OpenSPG** with **organizational context from Living Context Graph** to provide intelligent, evidence-based assistance for data product discovery and usage.

**Key Innovation**: The agent knows both what metrics mean universally (OpenSPG) and how your organization specifically uses them (LCG).

### Value Proposition

- **Faster Onboarding**: New users learn domain concepts and organizational patterns simultaneously
- **Evidence-Based Responses**: Every recommendation backed by real usage data from your organization
- **Consistent Terminology**: Industry-standard definitions from OpenSPG ensure cross-team alignment
- **Organizational Learning**: Captures and propagates successful query patterns and best practices

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Question                             │
│                 "How do I calculate customer LTV?"               │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ProductChatAgent Component                     │
│                      (Frontend - React)                          │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              GET /api/context/chat-agent-query                   │
│                   (Next.js API Route)                            │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│            POST /api/context/chat-agent-query                    │
│                  (FastAPI Backend)                               │
│                                                                  │
│  Queries in Parallel:                                           │
│  ┌──────────────────┬──────────────────┬──────────────────┐   │
│  │ Living Context   │ OpenSPG          │ DataTables       │   │
│  │ Graph (Kuzu)     │ Knowledge Graph  │ (Quality)        │   │
│  ├──────────────────┼──────────────────┼──────────────────┤   │
│  │ • IntentNodes    │ • Key Metrics    │ • Row Counts     │   │
│  │ • UsagePatterns  │ • Concepts       │ • Completeness   │   │
│  │ • SemanticBridge │ • Definitions    │ • Quality Scores │   │
│  └──────────────────┴──────────────────┴──────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Combined Context Response                     │
│                                                                  │
│  {                                                               │
│    intentContext: [...],      // Business expectations          │
│    usagePatterns: [...],      // How org uses it                │
│    semanticBridges: [...],    // Alternative products           │
│    domainKnowledge: {         // Industry knowledge             │
│      keyMetrics: [...],       // From OpenSPG                   │
│      businessConcepts: [...]  // From OpenSPG                   │
│    },                                                            │
│    dataQuality: {...}         // Quality metrics                │
│  }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LLM System Prompt Builder                     │
│                                                                  │
│  Constructs context-aware prompt with:                          │
│  1. Domain expertise (OpenSPG definitions)                       │
│  2. Organizational evidence (LCG usage patterns)                 │
│  3. Quality context (actual vs expected)                         │
│  4. Common patterns (filters, aggregations)                      │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      LLM (Claude/GPT-4)                          │
│                                                                  │
│  Generates evidence-based response:                              │
│  • SQL query with organizational best practices                  │
│  • Explanation using industry-standard terminology              │
│  • Usage validation (5 analysts, 247 queries, 94% success)      │
│  • Quality warnings if gaps exist                                │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      User Receives Answer                        │
│                                                                  │
│  Here's how to calculate Customer Lifetime Value:               │
│                                                                  │
│  ```sql                                                          │
│  SELECT customer_id,                                             │
│    SUM(order_value) OVER (                                       │
│      PARTITION BY customer_id ORDER BY order_date               │
│    ) as lifetime_value                                           │
│  FROM customer_360_view                                          │
│  WHERE order_status = 'completed'                                │
│    AND region_id IS NOT NULL  -- Common filter (4/5 analysts)   │
│  ```                                                             │
│                                                                  │
│  📊 **Usage Validation**: Used by 5 finance analysts            │
│     with 247 successful queries (94% success rate)               │
│                                                                  │
│  🔍 **Common Filters** (from real usage):                       │
│     • region_id IS NOT NULL                                      │
│     • order_date >= CURRENT_DATE - INTERVAL '24 months'         │
│                                                                  │
│  ✅ **Quality**: 87% meets expectations (Financial: 99%)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Backend API Endpoint

**File**: `/mnt/blockstorage/paper-lens/backend/api/context_routes.py`

#### Endpoint: `POST /api/context/chat-agent-query`

**Request Schema**:
```python
class ChatAgentQueryRequest(BaseModel):
    productId: str                    # Required: Data product ID
    domain: Optional[str] = None      # Optional: Domain filter (Customer, Financial, etc.)
    includeUsagePatterns: bool = True
    includeIntentContext: bool = True
    includeSemanticBridges: bool = True
    includeDomainKnowledge: bool = True
    limit: int = 10
```

**Response Schema**:
```python
class ChatAgentQueryResponse(BaseModel):
    productId: str
    intentContext: List[Dict[str, Any]]        # Business expectations, quality gaps
    usagePatterns: List[Dict[str, Any]]        # How data is consumed
    semanticBridges: List[Dict[str, Any]]      # Alternative products
    domainKnowledge: Optional[Dict[str, Any]]  # OpenSPG metrics & concepts
    dataQuality: Optional[Dict[str, Any]]      # Quality metrics
    metadata: Dict[str, Any]                   # Summary statistics
```

#### Query Logic

**Query 1: Intent Context (Living Context Graph)**
```python
MATCH (i:IntentNode)
WHERE i.data_product_id = $product_id
RETURN
    i.stakeholder_name,
    i.business_need_summary,
    i.expected_quality_score,
    i.actual_quality_score,
    i.quality_gap,
    i.quality_blockers
ORDER BY i.created_at DESC
LIMIT $limit
```

**Purpose**: Understand why data product was created and quality expectations

**Query 2: Usage Patterns (Living Context Graph)**
```python
MATCH (u:UsagePatternNode)
WHERE u.data_product_id = $product_id
RETURN
    u.user_department,
    u.query_count,
    u.typical_filters,
    u.typical_aggregations,
    u.inferred_use_case,
    u.business_impact
ORDER BY u.query_count DESC
LIMIT $limit
```

**Purpose**: Capture how data is actually used (queries, filters, joins)

**Query 3: Semantic Bridges (Living Context Graph)**
```python
MATCH (b:SemanticBridge)
WHERE b.source_id = $product_id OR b.target_id = $product_id
RETURN
    b.target_id,
    b.relationship_type,
    b.confidence,
    b.explanation,
    b.use_count,
    b.success_rate
ORDER BY b.confidence DESC, b.use_count DESC
LIMIT $limit
```

**Purpose**: Suggest alternative or related data products

**Query 4: Domain Knowledge (OpenSPG)**
```python
# Get domain-specific concepts from OpenSPG
openspg = get_openspg_client()

# Search for domain concepts
domain_concepts = await openspg.search_concepts(
    query=domain.lower(),
    domain=domain.lower(),
    limit=10
)

# Get specific metrics for domain
domain_terms = {
    'Customer': ['churn', 'ltv', 'cac', 'cohort', 'customer'],
    'Financial': ['revenue', 'arpu', 'mrr', 'arr', 'margin'],
    'Product': ['dau', 'mau', 'retention', 'engagement'],
    'Marketing': ['cac', 'roas', 'conversion', 'attribution'],
    'Operations': ['sla', 'uptime', 'latency', 'throughput']
}

for term in domain_terms[domain]:
    concept = await openspg.get_concept_definition(term, domain)
    # Categorize as metric or concept
    # Add to response
```

**Purpose**: Provide industry-standard definitions and terminology

**Query 5: Data Quality (DataTable)**
```python
MATCH (t:DataTable)
WHERE t.id = $product_id
RETURN
    t.row_count,
    t.completeness,
    t.quality_score,
    t.last_profiled_at
```

**Purpose**: Surface quality metrics for context

---

### 2. Frontend API Route

**File**: `/mnt/blockstorage/paper-lens/app/api/context/chat-agent-query/route.ts`

Simple Next.js proxy to Python backend:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const response = await fetch(`${backendUrl}/api/context/chat-agent-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: body.productId,
      domain: body.domain,
      includeUsagePatterns: body.includeUsagePatterns ?? true,
      includeIntentContext: body.includeIntentContext ?? true,
      includeSemanticBridges: body.includeSemanticBridges ?? true,
      includeDomainKnowledge: body.includeDomainKnowledge ?? true,
      limit: body.limit ?? 10,
    }),
  });

  return NextResponse.json(await response.json());
}
```

---

### 3. TypeScript Type Definitions

**File**: `/mnt/blockstorage/paper-lens/lib/types/living-context-graph.ts`

```typescript
export interface DomainKnowledge {
  domain: string;
  keyMetrics: DomainConcept[];        // Metrics (LTV, CAC, ROAS, etc.)
  businessConcepts: DomainConcept[];  // Concepts (churn, cohort, etc.)
  source: string;                      // "openspg"
  retrievedAt: string;
}

export interface DomainConcept {
  name: string;
  definition: string;                  // Industry-standard definition
  relatedConcepts: string[];           // Semantic relationships
  confidence: number;                  // 0-1 confidence score
  source: string;                      // "openspg"
}

export interface ChatAgentQueryResponse {
  productId: string;
  intentContext: IntentContext[];
  usagePatterns: UsagePattern[];
  semanticBridges: SemanticBridge[];
  domainKnowledge: DomainKnowledge | null;
  dataQuality: DataQualitySummary | null;
  metadata: {
    totalIntents: number;
    totalUsagePatterns: number;
    totalSemanticBridges: number;
    totalQueries: number;
    uniqueUsers: number;
    avgConfidence: number;
    estimatedSuccessRate: number;
    hasQualityData: boolean;
    hasDomainKnowledge: boolean;
  };
}
```

---

### 4. Client Service

**File**: `/mnt/blockstorage/paper-lens/lib/services/living-context-client.ts`

```typescript
/**
 * Query Living Context Graph + OpenSPG for chat agent context
 */
export async function queryLivingContextGraph(
  request: ChatAgentQueryRequest
): Promise<ChatAgentQueryResponse> {
  const response = await fetch('/api/context/chat-agent-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`LCG query failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get enhanced context for chat responses
 */
export async function getEnhancedChatContext(
  productId: string,
  domain?: string
): Promise<EnhancedChatContext> {
  const lcgData = await queryLivingContextGraph({
    productId,
    domain,
    includeUsagePatterns: true,
    includeIntentContext: true,
    includeSemanticBridges: true,
    includeDomainKnowledge: true,
    limit: 10,
  });

  // Process and structure data for LLM consumption
  return {
    hasEvidence: lcgData.metadata.totalUsagePatterns > 0,
    domainExpertise: lcgData.domainKnowledge,
    usageEvidence: extractUsageEvidence(lcgData.usagePatterns),
    qualityContext: extractQualityContext(lcgData.intentContext),
    recommendations: extractRecommendations(lcgData.semanticBridges),
  };
}
```

---

## OpenSPG Integration Details

### What is OpenSPG?

**OpenSPG** (Open Semantic-aware Pre-trained Graph) is an open-source knowledge graph that provides:
- Industry-standard business term definitions
- Semantic relationships between concepts
- Multi-domain coverage (finance, retail, healthcare, etc.)
- Confidence scoring for definitions

### Current Domain Coverage

**Customer Domain**:
- **Metrics**: LTV (Lifetime Value), CAC (Customer Acquisition Cost), Churn Rate
- **Concepts**: Customer, Cohort, Segmentation, Retention

**Financial Domain**:
- **Metrics**: Revenue, ARPU (Average Revenue Per User), MRR, ARR, Gross Margin
- **Concepts**: Profitability, Unit Economics, Cash Flow

**Product Domain**:
- **Metrics**: DAU (Daily Active Users), MAU, DAU/MAU Ratio, NPS
- **Concepts**: Engagement, Activation, Retention, Product-Market Fit

**Marketing Domain**:
- **Metrics**: CAC, ROAS (Return on Ad Spend), Conversion Rate, MQLs
- **Concepts**: Attribution, Funnel, Campaign, Channel

**Operations Domain**:
- **Metrics**: Uptime, MTTR (Mean Time To Resolution), Error Rate
- **Concepts**: SLA, Incident, Performance, Reliability

### OpenSPG Client Usage

**File**: `/mnt/blockstorage/paper-lens/backend/services/openspg_client.py`

```python
from backend.services.openspg_client import get_openspg_client

# Get singleton client
openspg = get_openspg_client()

# Get concept definition
concept = await openspg.get_concept_definition('ltv', domain='finance')
# Returns: SPGConcept(
#   name="LTV",
#   definition="Lifetime Value - total revenue expected from customer...",
#   related_concepts=["customer_value", "cac", "profitability"],
#   confidence=0.92
# )

# Search for concepts
results = await openspg.search_concepts(
    query="customer value",
    domain="finance",
    limit=5
)

# Get related concepts
related = await openspg.get_related_concepts('churn')
# Returns concepts like: retention, attrition, customer_lifecycle
```

### Caching Strategy

- **TTL**: 24 hours (configurable via `OPENSPG_CACHE_TTL_HOURS`)
- **Cache Key**: `{term}:{domain}`
- **Invalidation**: Automatic on TTL expiry
- **Performance**: First query ~200ms, cached ~5ms

---

## Living Context Graph Schema

### IntentNode

```python
CREATE NODE TABLE IntentNode (
    id STRING,
    data_product_id STRING,
    stakeholder_name STRING,
    business_need_summary STRING,
    expected_quality_score DOUBLE,      # Auto-inferred from business context
    actual_quality_score DOUBLE,        # From YData profiling
    quality_gap DOUBLE,                 # expected - actual
    quality_blockers STRING[],          # Specific issues
    primary_use_cases STRING[]
)
```

**Purpose**: Capture why data product was created and quality expectations

### UsagePatternNode

```python
CREATE NODE TABLE UsagePatternNode (
    id STRING,
    data_product_id STRING,
    user_department STRING,
    query_count INT64,
    typical_filters STRING[],           # e.g., ["region_id IS NOT NULL"]
    typical_aggregations STRING[],      # e.g., ["SUM", "AVG", "COUNT"]
    typical_joins STRING[],             # e.g., ["orders", "customers"]
    inferred_use_case STRING,           # e.g., "Revenue forecasting"
    business_impact STRING
)
```

**Purpose**: Track how data is actually consumed

### SemanticBridge

```python
CREATE NODE TABLE SemanticBridge (
    id STRING,
    source_id STRING,                   # Product A
    target_id STRING,                   # Product B
    relationship_type STRING,           # "similar_use_case", "downstream", etc.
    confidence DOUBLE,                  # 0-1
    explanation STRING,                 # Why they're related
    use_count INT64,                    # How many times relationship validated
    success_rate DOUBLE                 # Success rate when using together
)
```

**Purpose**: Recommend alternative or complementary products

---

## System Prompt Construction

### Template Structure

```typescript
function buildSystemPrompt(
  domain: string,
  domainKnowledge: DomainKnowledge,
  usagePatterns: UsagePattern[],
  intentContext: IntentContext[]
): string {
  return `
You are an expert ${domain} Domain Data Analyst with deep knowledge of ${domain.toLowerCase()} analytics and metrics.

# Industry Knowledge (from OpenSPG)

## Key Metrics
${domainKnowledge.keyMetrics.map(m => `
- **${m.name}**: ${m.definition}
  Related: ${m.relatedConcepts.join(', ')}
`).join('\n')}

## Business Concepts
${domainKnowledge.businessConcepts.map(c => `
- **${c.name}**: ${c.definition}
`).join('\n')}

# Organizational Context (from Living Context Graph)

## How Your Organization Uses This Data
${formatUsagePatterns(usagePatterns)}

## Quality Context
${formatQualityContext(intentContext)}

# Your Responsibilities
1. Answer questions using industry-standard terminology (OpenSPG)
2. Incorporate organizational evidence (usage patterns, common filters)
3. Provide SQL examples with best practices from your organization
4. Explain business value and context
5. Warn about quality gaps if they exist

# Response Format
- Direct answer with SQL example
- Business context explanation
- Usage validation (X analysts, Y queries, Z% success rate)
- Quality warnings if applicable
- Suggested related analyses
`;
}
```

### Example Generated Prompt

```
You are an expert Customer Domain Data Analyst with deep knowledge of customer analytics and metrics.

# Industry Knowledge (from OpenSPG)

## Key Metrics

- **LTV (Lifetime Value)**: Total revenue expected from a customer over their entire
  relationship with the company
  Related: customer_value, cac, profitability
  Confidence: 92%

- **Churn**: Rate at which customers stop doing business with an entity
  Related: retention, attrition, customer_lifecycle
  Confidence: 94%

- **CAC (Customer Acquisition Cost)**: Cost to convince a potential customer to buy
  Related: ltv, marketing_spend, roi
  Confidence: 91%

## Business Concepts

- **Cohort**: Group of users who share a common characteristic within a defined time period
  Related: segmentation, user_group, retention_analysis

- **Customer**: Individual or organization that purchases goods/services
  Related: consumer, buyer, account, user

# Organizational Context (from Living Context Graph)

## How Your Organization Uses This Data

📊 **Usage Validation**:
- Used by 5 finance analysts
- 247 successful queries over 45 days
- 94% success rate

🔍 **Common Filters** (used by real users):
- region_id IS NOT NULL (4 of 5 analysts use this)
- order_date >= CURRENT_DATE - INTERVAL '24 months'
- customer_type = 'enterprise'

📈 **Common Use Cases**:
- Q4 revenue forecasting (Finance)
- Customer segmentation (Marketing)
- Churn prediction (Customer Success)

## Quality Context

⚠️ **Quality Gap Detected**:
- Expected Quality: 99% (financial data standard)
- Actual Quality: 87%
- Gap: 12%

**Known Issues**:
- Missing region_id in 8% of records
- Incomplete address data in 5% of records

**Original Intent**: Built for Sarah Chen (Finance) for Q4 forecasting with 99% accuracy requirement

# Your Responsibilities
1. Answer questions using industry-standard terminology (OpenSPG)
2. Incorporate organizational evidence (usage patterns, common filters)
3. Provide SQL examples with best practices from your organization
4. Explain business value and context
5. Warn about quality gaps if they exist

# Response Format
- Direct answer with SQL example
- Business context explanation
- Usage validation (X analysts, Y queries, Z% success rate)
- Quality warnings if applicable
- Suggested related analyses
```

---

## Example Interactions

### Example 1: LTV Calculation

**User Question**: "How do I calculate customer lifetime value?"

**Chat Agent Response**:

```
Here's how to calculate Customer Lifetime Value using **customer_360_view**:

```sql
SELECT
    customer_id,
    SUM(order_value) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as lifetime_value
FROM customer_360_view
WHERE order_status = 'completed'
  AND region_id IS NOT NULL  -- Common filter (used by 4/5 analysts)
ORDER BY lifetime_value DESC;
```

**Industry Definition** (from OpenSPG):
LTV (Lifetime Value) is the total revenue expected from a customer over their entire
relationship with the company. It's a key metric for understanding customer value and
informing acquisition strategies.

📊 **Usage Validation**:
- Used by 5 finance analysts for similar forecasting needs
- 247 successful executions over 45 days
- 94% success rate (3 failures due to missing region_id)

🔍 **Common Filters** (from real usage patterns):
- `region_id IS NOT NULL` (4 of 5 analysts use this)
- `order_date >= CURRENT_DATE - INTERVAL '24 months'`

⚠️ **Quality Note**:
This data has 87% quality (below the expected 99% for financial data). Main issue:
8% missing region_id. Consider filtering on region_id IS NOT NULL or addressing data
quality issues before using for financial reporting.

**Related Analyses**:
- CAC (Customer Acquisition Cost) to calculate LTV:CAC ratio
- Cohort analysis to track LTV trends over time
- Churn prediction using LTV as a feature
```

### Example 2: Data Freshness

**User Question**: "How fresh is this data?"

**Chat Agent Response**:

```
**Data Freshness Status**:

✅ **Current Status**: Updated every 24 hours (last update: 2 hours ago)

📊 **Original Intent** (from stakeholder context):
Sarah Chen (Finance) requested this data for Q4 forecasting with 24-hour freshness requirement.

⚠️ **Gap Detected**:
- **Expected Freshness**: 24 hours
- **Actual Freshness**: 48 hours (last 3 updates)
- **Impact**: May affect real-time decision making

**Blockers**:
- Upstream Salesforce CRM sync delays (avg 18-hour lag)
- Billing system batch processing runs every 48 hours

**Recommendation**:
For time-sensitive forecasting, consider using `last_updated_at` timestamp to filter
only recent data:

```sql
SELECT * FROM customer_360_view
WHERE last_updated_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours';
```

This ensures you're working with data that meets the 24-hour freshness requirement even
if full table refresh is delayed.
```

---

## Implementation Guidelines

### For Frontend Developers

1. **Query LCG + OpenSPG on Component Mount**:
```typescript
useEffect(() => {
  async function loadContext() {
    const context = await getEnhancedChatContext(productId, domain);
    setDomainContext(context);
  }
  loadContext();
}, [productId, domain]);
```

2. **Build System Prompt with Combined Context**:
```typescript
const systemPrompt = buildSystemPrompt(
  domain,
  context.domainExpertise,
  context.usageEvidence,
  context.qualityContext
);
```

3. **Pass to LLM API**:
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userQuestion }
  ]
});
```

### For Backend Developers

1. **Add New Domain to OpenSPG**:
```python
# In backend/services/openspg_client.py, add to knowledge_base:
"new_metric": SPGConcept(
    name="New Metric",
    definition="Industry-standard definition...",
    domain="your_domain",
    related_concepts=["related1", "related2"],
    confidence=0.90,
    source="openspg"
)
```

2. **Track Usage Patterns**:
```python
# After successful query execution:
create_usage_pattern(
    data_product_id=product_id,
    user_id=user_id,
    query_text=sql_query,
    typical_filters=extract_filters(sql_query),
    success=True
)
```

3. **Create Intent Nodes**:
```python
# When data product is created:
create_intent_node(
    data_product_id=product_id,
    stakeholder="Sarah Chen",
    business_need="Q4 revenue forecasting",
    expected_quality=0.99  # Auto-inferred
)
```

---

## Success Metrics

### User Adoption
- **Target**: 60% of data analysts use chat agent within 3 months
- **Measure**: Weekly active users (WAU) of chat feature

### Response Quality
- **Target**: 85% of responses rated helpful by users
- **Measure**: Thumbs up/down feedback on each response

### Time Savings
- **Target**: 50% reduction in time to find relevant queries
- **Measure**: Time from question to successful query execution

### Accuracy
- **Target**: 90% of generated SQL queries execute successfully
- **Measure**: Query success rate without modification

### Knowledge Propagation
- **Target**: 70% of common patterns captured in UsagePatternNodes
- **Measure**: Coverage of query patterns in LCG

---

## Future Enhancements

### Phase 2: Advanced Features

1. **Query Explanation**:
   - User pastes SQL, agent explains what it does using domain knowledge
   - Identifies potential issues or optimization opportunities

2. **Proactive Recommendations**:
   - "Users who analyzed this also looked at..."
   - "Common next step: Calculate CAC to get LTV:CAC ratio"

3. **Custom RAG (Retrieval-Augmented Generation)**:
   - Index organization's documentation, wiki, Slack history
   - Incorporate company-specific best practices

4. **Multi-Tool Orchestration**:
   - "Run this query and create a dashboard in Tableau"
   - "Export results to CSV and email to stakeholders"

### Phase 3: Organizational Learning

1. **Pattern Mining**:
   - Automatically identify successful query patterns
   - Create reusable SQL templates from high-success queries

2. **Quality Improvement Loop**:
   - Track which quality gaps block users most
   - Prioritize data quality fixes based on usage impact

3. **Semantic Search**:
   - "Find all queries that calculate revenue growth"
   - Search across query history using semantic similarity

---

## Appendix

### API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/context/chat-agent-query` | POST | Query LCG + OpenSPG for chat context |
| `/api/context/create-intent` | POST | Create IntentNode for new data product |
| `/api/context/enrich-intent-with-profiling` | POST | Update IntentNode with quality metrics |
| `/api/context/intent/{id}` | GET | Retrieve IntentNode by ID |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENSPG_BASE_URL` | OpenSPG API endpoint | `https://openspg.antgroup.com/api` |
| `OPENSPG_API_KEY` | Authentication key | None (optional) |
| `OPENSPG_CACHE_TTL_HOURS` | Cache duration | `24` |
| `BACKEND_URL` | Python backend URL | `http://localhost:8000` |

### Database Schema Reference

See full schema documentation:
- Living Context Graph: `/docs/03-architecture-backend/LIVING_CONTEXT_GRAPH_ARCHITECTURE.md`
- Kuzu Knowledge Graph: `/backend/services/kuzu_schema.py`
- OpenSPG Integration: `/backend/services/openspg_client.py`

---

**Documentation Version**: 1.0
**Last Reviewed**: 2025-10-14
**Next Review**: 2025-11-14
