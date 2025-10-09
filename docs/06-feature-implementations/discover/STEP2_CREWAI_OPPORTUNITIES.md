# CrewAI Agent Opportunities: Step 2 Data Discovery

**Date**: 2025-01-15
**Focus**: Intelligent agent assistance for table discovery and selection
**Integration Points**: NexusOne Step 2 "Discover Data" workflow

---

## Executive Summary

Data discovery is cognitively demanding: users must evaluate 50+ tables across multiple dimensions (quality, schema, usage, relationships) while maintaining context about their data product goals. CrewAI agents can transform this from a manual research task into an **intelligent, conversational collaboration** where AI handles complexity while users maintain control.

**Core Insight**: Don't replace the human decision—augment it with intelligence that would be impossible to gather manually.

---

## Agent Architecture Overview

### Multi-Agent System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                       │
│  Coordinates all agents, maintains conversation context    │
│  Understands user intent and delegates to specialist agents│
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌──────────────────┐
│   DISCOVERY   │  │    QUALITY     │  │   RELATIONSHIP   │
│     AGENT     │  │     AGENT      │  │      AGENT       │
└───────────────┘  └────────────────┘  └──────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌──────────────────┐
│  PERFORMANCE  │  │   LINEAGE      │  │   RECOMMENDATION │
│     AGENT     │  │     AGENT      │  │      AGENT       │
└───────────────┘  └────────────────┘  └──────────────────┘
```

### Agent Roles & Capabilities

#### 1. **Orchestrator Agent** (Conversation Manager)
**Role**: Primary user interface, coordinates all specialist agents

**Responsibilities**:
- Parse user intent from natural language
- Maintain conversation context across session
- Delegate tasks to specialist agents
- Synthesize agent findings into coherent recommendations
- Ask clarifying questions when intent is ambiguous

**Example Interactions**:
```
User: "I need customer data for a churn prediction model"

Orchestrator:
├─► Extracts intent: ML model, customer domain, churn use case
├─► Delegates to Discovery Agent: Find customer-related tables
├─► Delegates to Quality Agent: Check ML-readiness (completeness, balance)
├─► Delegates to Relationship Agent: Find tables with churn signals
└─► Synthesizes: "I found 3 customer tables. Based on your ML use case,
    'customer_360' is best because it has pre-engineered features and
    historical churn labels. However, it's updated daily—will that work?"
```

**MCP Integration**:
- **DataHub MCP**: Query metadata, lineage, usage stats
- **Conversation Memory MCP**: Persist user preferences across sessions
- **Analytics MCP**: Track which agent suggestions get accepted (learning)

---

#### 2. **Discovery Agent** (Table Finder)
**Role**: Find tables matching user's described needs

**Intelligence Capabilities**:
- **Semantic Search**: Understand "revenue data" → finds `orders`, `invoices`, `payments`
- **Domain Mapping**: "Customer behavior" → navigates to behavioral events, sessions, clickstream
- **Column-Level Search**: "Tables with email addresses" → searches schema metadata
- **Anti-Pattern Detection**: "I need ALL customer data" → warns about over-selection

**Interaction Patterns**:

```
User: "Show me tables about product performance"

Discovery Agent:
🔍 Searching across 48 tables in catalog...

Found 6 tables matching "product performance":

📊 High Confidence (3):
  1. product_metrics (daily aggregations, 98% quality)
     • Contains: revenue, units_sold, return_rate
     • Used by: product-analytics team (892 queries/mo)

  2. product_events (real-time clickstream, 85% quality)
     • Contains: views, clicks, add_to_cart, purchases
     • High volume: 125M rows, used for behavioral analysis

  3. product_reviews (daily updates, 92% quality)
     • Contains: ratings, sentiment_score, review_text
     • Text data suitable for NLP analysis

🤔 Medium Confidence (2):
  4. sales_by_product (weekly rollup)
     • Might be too aggregated for your needs?
  5. inventory_levels (daily snapshots)
     • More about stock than performance

❌ Low Confidence (1):
  6. product_catalog (reference data)
     • Static product info, no performance metrics

💡 Suggestion: Start with product_metrics for aggregated KPIs,
   add product_events if you need granular behavioral data.

Would you like me to:
  A) Show detailed comparison of top 3 tables
  B) Explain why I ranked these this way
  C) Find related tables (like customer or campaign data)
```

**Advanced Features**:
- **Fuzzy Matching**: "custmer" → "customer" (typo tolerance)
- **Synonym Expansion**: "clients" → searches customer, account, user
- **Negative Filtering**: "customers but NOT test data" → excludes QA tables
- **Temporal Intelligence**: "last 2 years of order data" → checks date coverage

**MCP Tools**:
```python
# Discovery Agent Tool Set
tools = [
    DataHubSchemaSearchTool(),      # Search column names/descriptions
    DataHubLineageTool(),           # Understand table relationships
    SemanticSearchTool(),           # Vector similarity search on descriptions
    ColumnDistributionTool(),       # Check if table has needed data ranges
    UsagePatternTool()              # Find tables similar teams use
]
```

---

#### 3. **Quality Agent** (Data Fitness Evaluator)
**Role**: Assess if tables meet quality standards for intended use case

**Intelligence Capabilities**:
- **Use-Case-Aware Quality**: Different standards for ML vs reporting vs real-time
- **Anomaly Detection**: Spots quality degradation trends
- **Completeness Analysis**: Checks if data covers required time periods
- **Bias Detection**: For ML use cases, checks for data imbalance

**Interaction Patterns**:

```
User: *Adds product_events table to product*

Quality Agent (automatically triggered):
⚠️  Quality Check for product_events

Overall Score: 85% (Good for analytics, may need work for ML)

Detailed Analysis:

✅ Strengths:
  • High completeness (98% of expected records present)
  • Real-time freshness (< 5 min lag)
  • Good coverage: 18 months of historical data
  • Active usage: 1.2K queries/month (well-validated)

⚠️  Concerns:
  • Spike in null values for 'user_id' (15% → 25% in last week)
    └─► Impact: User attribution will be incomplete
    └─► Recommendation: Investigate with data-eng team

  • High cardinality in 'event_type' (10K unique values)
    └─► Impact: May need grouping/standardization for ML
    └─► Recommendation: Create derived event_category column

  • Outlier detection: 0.1% of events have timestamps in future
    └─► Impact: Data quality issue in source system
    └─► Recommendation: Add filter: WHERE timestamp <= NOW()

📊 Quality Trend: Declining (-3% in last 30 days)
    Primary issue: Increasing null rate in user_id field

🎯 For your use case (churn prediction):
  ✅ Sufficient historical depth for training
  ✅ Good event coverage (all critical funnel steps present)
  ⚠️  User attribution issues may affect feature engineering
  ❌ No churn labels present—you'll need to join with customer_segments

Action Items:
  1. [Recommended] Add customer_segments table for churn labels
  2. [Optional] Apply quality filters in transformation step
  3. [Monitor] Track user_id null rate (currently increasing)

Continue with this table?  [Yes] [Investigate Issue] [Choose Alternative]
```

**Advanced Features**:
- **Statistical Profiling**: Distributions, outliers, correlations
- **Schema Evolution Tracking**: "Column 'user_email' was dropped 2 weeks ago"
- **Downstream Impact**: "This quality issue affects 3 production models"
- **Remediation Suggestions**: Concrete SQL/dbt code to fix issues

**MCP Tools**:
```python
# Quality Agent Tool Set
tools = [
    GreatExpectationsTool(),        # Run data quality validations
    ProfilingTool(),                # Statistical analysis (ydata-profiling)
    SchemaEvolutionTool(),          # Detect breaking changes
    DatadogMetricsTool(),           # Query infrastructure health
    AnomalyDetectionTool()          # ML-based quality anomaly detection
]
```

---

#### 4. **Relationship Agent** (Join & Schema Expert)
**Role**: Understand how tables relate to each other, detect optimal joins

**Intelligence Capabilities**:
- **Automatic Join Detection**: Identifies foreign key relationships
- **Cardinality Analysis**: Predicts join results (1:1, 1:M, M:M)
- **Join Recommendation**: Suggests optimal join keys and conditions
- **Schema Alignment**: Detects type mismatches and incompatibilities

**Interaction Patterns**:

```
User: *Adds customers and orders tables*

Relationship Agent (automatically triggered):
🔗 Relationship Analysis: customers ↔ orders

Join Recommendations:

1. ✅ Primary Join (Recommended)
   customers.customer_id = orders.customer_id

   Confidence: 99%
   Evidence:
   • Both columns are VARCHAR, non-null
   • orders.customer_id foreign key to customers.customer_id
   • 100% referential integrity (all order customer_ids exist in customers)
   • Cardinality: 1 customer → avg 3.4 orders

   Expected Result: 8.5M order rows (1 row per order with customer info)

   Performance: ⚡ Fast (both columns indexed)
   Estimated join time: 2.3 seconds for full dataset

2. ⚠️  Alternative Join (Watch Out)
   customers.email = orders.customer_email

   Confidence: 45%
   Issues:
   • orders.customer_email has 15% null values (1.2M orders will drop)
   • Email format inconsistencies detected (lowercase vs mixed case)
   • Not recommended: Use customer_id instead

🔍 Additional Insights:

• Common Join Pattern: 892 teams have joined these tables using customer_id
  └─► SQL Template available (click to copy)

• Related Tables You Might Need:
  └─► payments (join on orders.order_id)
      • 98% of teams who selected orders also need payments
      • Adds: payment_method, transaction_amount, payment_status

  └─► customer_segments (join on customers.customer_id)
      • Adds: ltv_segment, churn_risk, rfm_score
      • Useful for: Customer cohort analysis

📊 Join Quality: 100% (All order customer_ids resolve)
🎯 Data Product Impact: Creates complete customer-order history

Ready to proceed? [Continue] [Preview Join Results] [Add Related Tables]
```

**Advanced Features**:
- **Multi-Table Joins**: Plans optimal 3+ table join sequences
- **Circular Join Detection**: Warns about complex many-to-many relationships
- **Denormalization Recommendations**: "These 4 joins are common—create a materialized view?"
- **Performance Prediction**: Estimates join execution time based on sizes

**MCP Tools**:
```python
# Relationship Agent Tool Set
tools = [
    DataHubLineageTool(),           # Query table lineage graph
    TrinoQueryTool(),               # Test join queries
    SchemaIntrospectionTool(),      # Analyze column metadata
    StatisticalJoinTool(),          # Estimate cardinality
    QueryPatternTool()              # Learn from historical joins
]
```

---

#### 5. **Performance Agent** (Query Optimization Expert)
**Role**: Predict and optimize query performance for selected tables

**Intelligence Capabilities**:
- **Size Estimation**: Predict result set size from table selections
- **Performance Forecasting**: Estimate query execution time
- **Optimization Recommendations**: Suggest filters, partitioning strategies
- **Cost Analysis**: Estimate compute costs for large queries

**Interaction Patterns**:

```
User: *Adds clickstream (125M rows) and customers (2.5M rows)*

Performance Agent (automatically triggered):
⚡ Performance Analysis

Your Current Selection:
  • clickstream: 125M rows, 180 GB
  • customers: 2.5M rows, 12.5 GB
  • Total: 127.5M rows, 192.5 GB

Expected Join Performance:
  ⏱️  Estimated execution time: 45-60 seconds (full scan)
  💰 Estimated cost: $0.18 per query (Trino pricing)
  🔥 Resource usage: High (recommend query optimization)

⚠️  Performance Concerns:

1. Unpartitioned Join on High-Volume Table
   Problem: clickstream has no partition key in join condition
   Impact: Full table scan (125M rows) on every query

   💡 Optimization: Add date filter
   Example:
   WHERE clickstream.event_date >= CURRENT_DATE - INTERVAL '30' DAY

   Result: 3.5M rows instead of 125M (96% reduction)
   New execution time: 4-6 seconds (88% faster)
   New cost: $0.02 per query (90% cheaper)

2. Large String Column Projection
   Problem: Including clickstream.event_payload (JSON, avg 2KB)
   Impact: High memory usage, slow serialization

   💡 Optimization: Project only needed JSON fields
   Example:
   JSON_EXTRACT(event_payload, '$.user_action') as user_action

   Result: 75% memory reduction

3. Cross Join Risk
   Warning: No join key detected between clickstream and customers
   Impact: Potential Cartesian product (312 BILLION rows!)

   ❌ This query will likely fail or timeout

   💡 Fix Required: Add join condition
   ON clickstream.user_id = customers.customer_id

🎯 Recommended Query Pattern:

SELECT
  c.customer_id,
  c.email,
  e.event_type,
  JSON_EXTRACT(e.event_payload, '$.product_id') as product_id
FROM clickstream e
JOIN customers c ON e.user_id = c.customer_id
WHERE e.event_date >= CURRENT_DATE - INTERVAL '30' DAY
  AND c.segment = 'premium'

Performance:
  ⏱️  3-5 seconds (vs 45-60 seconds)
  💰 $0.02 per query (vs $0.18)
  📊 Returns ~2M rows (actionable dataset size)

Auto-apply optimizations? [Yes] [Customize] [Explain More]
```

**Advanced Features**:
- **Partition Pruning Suggestions**: Identifies tables with partition columns
- **Materialized View Recommendations**: "This join pattern runs 50x/day—materialize it?"
- **Index Analysis**: Suggests missing indexes on join columns
- **Query Plan Visualization**: Shows execution plan with bottlenecks highlighted

**MCP Tools**:
```python
# Performance Agent Tool Set
tools = [
    TrinoExplainTool(),             # Get query execution plan
    TableStatsTool(),               # Row counts, sizes, partitions
    QueryHistoryTool(),             # Analyze similar past queries
    DatadogPerformanceTool(),       # Real-time cluster metrics
    CostEstimationTool()            # Calculate query costs
]
```

---

#### 6. **Lineage Agent** (Data Provenance Expert)
**Role**: Trace data origins, transformations, and downstream impacts

**Intelligence Capabilities**:
- **Source Tracing**: Follow data back to raw sources
- **Transformation Chain**: Explain how data is processed
- **Impact Analysis**: Show what breaks if table changes
- **Certification Status**: Identify "blessed" vs experimental tables

**Interaction Patterns**:

```
User: "Where does customer_360 data come from?"

Lineage Agent:
🔍 Tracing data lineage for customer_360...

Data Provenance:

┌─────────────────────────────────────────────────────┐
│                  SOURCES (RAW)                       │
├─────────────────────────────────────────────────────┤
│ 1. raw.salesforce.accounts                          │
│    └─► CRM system (external API)                    │
│    └─► Updated: Every 15 minutes                    │
│                                                      │
│ 2. raw.zendesk.users                                │
│    └─► Support system (external API)                │
│    └─► Updated: Hourly                              │
│                                                      │
│ 3. raw.segment.events                               │
│    └─► Analytics events (Kafka stream)              │
│    └─► Updated: Real-time                           │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│            TRANSFORMATIONS (DBT)                     │
├─────────────────────────────────────────────────────┤
│ Stage 1: Cleaning & Deduplication                   │
│ • stg_salesforce_accounts                           │
│   └─► Standardize email, phone formats             │
│   └─► Remove test accounts                          │
│ • stg_zendesk_users                                 │
│   └─► Parse name fields                             │
│   └─► Enrich with support tier                      │
│                                                      │
│ Stage 2: Merging & Enrichment                       │
│ • int_customers_merged                              │
│   └─► Join Salesforce + Zendesk on email           │
│   └─► Resolve conflicts (Salesforce takes priority)│
│   └─► Add unified customer_id                       │
│                                                      │
│ Stage 3: Feature Engineering                        │
│ • int_customers_enriched                            │
│   └─► Calculate LTV from orders                     │
│   └─► Add behavioral scores from events             │
│   └─► Compute RFM segmentation                      │
│                                                      │
│ Final: Published Table                              │
│ • customer_360                                       │
│   └─► 45 columns, 2.5M rows                        │
│   └─► Certified by: data-governance                 │
│   └─► SLA: Daily refresh by 02:00 UTC              │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│         DOWNSTREAM CONSUMERS (23)                    │
├─────────────────────────────────────────────────────┤
│ Production ML Models (2):                           │
│ • churn_prediction_model_v2                         │
│   └─► Critical: Powers retention campaigns          │
│ • ltv_forecasting_model                             │
│   └─► Critical: Budget planning input               │
│                                                      │
│ Dashboards (15):                                    │
│ • executive_customer_dashboard                      │
│ • sales_pipeline_health                             │
│ • marketing_attribution                             │
│ • ... (12 more)                                     │
│                                                      │
│ Data Products (6):                                  │
│ • customer_segments (derived)                       │
│ • customer_health_score (derived)                   │
│ • ... (4 more)                                      │
└─────────────────────────────────────────────────────┘

⚠️  Impact Assessment:
• 23 downstream consumers depend on this table
• 2 critical ML models (cannot tolerate outages)
• Changes require 48hr notice to data-governance team

✅ Trust Signals:
• Certified by data-governance team
• 98% SLA compliance (last 90 days)
• Actively maintained (5 updates in last 30 days)
• High usage (892 queries/month)

🔒 Data Freshness Contract:
• Source data latency: 15 min (Salesforce) to 1 hour (Zendesk)
• Transformation latency: 30 minutes
• Total latency: 1.5 hours max from source change to customer_360
• Refresh schedule: Daily at 02:00 UTC
• Next refresh: In 6 hours

This table is production-ready and well-maintained.
Safe to use in your data product.

[View Full DAG] [Check Latest Run] [See Sample Transformation Code]
```

**Advanced Features**:
- **Column-Level Lineage**: "Where does customer_360.ltv come from?"
- **Certification Tracking**: Shows governance approval status
- **Breaking Change Alerts**: "This table's schema changed last week"
- **Freshness Monitoring**: Real-time view of data lag

**MCP Tools**:
```python
# Lineage Agent Tool Set
tools = [
    DataHubLineageTool(),           # Full lineage graph
    DBTManifestTool(),              # Transformation logic
    AirflowDagTool(),               # Pipeline schedules
    DataQualityHistoryTool(),       # Quality over time
    GovernanceTool()                # Certification status
]
```

---

#### 7. **Recommendation Agent** (Intelligent Suggester)
**Role**: Proactively suggest tables based on context and patterns

**Intelligence Capabilities**:
- **Collaborative Filtering**: "Teams like yours use these tables"
- **Intent Prediction**: Anticipates next tables user will need
- **Gap Detection**: "You have orders but no customers—add it?"
- **Best Practice Suggestions**: "High-quality version available"

**Interaction Patterns**:

```
User: *Adds orders table*

Recommendation Agent (automatically triggered):
💡 Smart Recommendations

Based on your selection of orders, I recommend:

┌─────────────────────────────────────────────────────────┐
│ 🎯 High Confidence Recommendations                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. customers                                            │
│    Why: 98% of teams join orders with customers         │
│    Adds: Customer profile, email, segment               │
│    Join: orders.customer_id = customers.customer_id     │
│    [Preview] [Add]                                      │
│                                                          │
│ 2. payments                                             │
│    Why: 87% of teams analyzing orders need payment data │
│    Adds: Payment method, amount, status                 │
│    Join: orders.order_id = payments.order_id            │
│    [Preview] [Add]                                      │
│                                                          │
│ 3. products                                             │
│    Why: Orders reference products—you'll need details   │
│    Adds: Product name, category, price                  │
│    Join: order_items.product_id = products.product_id   │
│    [Preview] [Add]                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ⚡ Quick-Add Bundle                                     │
├─────────────────────────────────────────────────────────┤
│ "E-commerce Sales Analysis" (Most Common Pattern)      │
│                                                          │
│ Tables: orders + customers + products + payments        │
│ Used by: 156 teams in your organization                │
│ Avg Quality Score: 94%                                  │
│ Total Size: 85 GB, ~15M rows                           │
│                                                          │
│ [Add All 4 Tables] [See Preview]                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🤔 Consider These Alternatives                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ⚠️  You selected: orders (raw transactional data)      │
│                                                          │
│ Better option available:                                │
│ • orders_enriched (pre-joined with customer & product)  │
│   └─► Same data, already joined for you                │
│   └─► 15% faster queries (pre-aggregated)              │
│   └─► Higher quality (98% vs 92%)                      │
│   └─► Updated: Same frequency (real-time)              │
│                                                          │
│ Trade-off:                                              │
│ • orders: More flexible (you control joins)             │
│ • orders_enriched: Faster & easier (pre-built)         │
│                                                          │
│ [Switch to orders_enriched] [Keep orders] [Compare]    │
└─────────────────────────────────────────────────────────┘

🎓 Learning from Your History:
• Last month you built "sales_dashboard_v2"
• You used: orders, customers, products
• This looks similar—reuse that pattern?

[Load Previous Pattern] [Start Fresh] [Show Other Past Projects]
```

**Advanced Features**:
- **Persona-Based Suggestions**: Different recs for analysts vs engineers
- **Domain Intelligence**: Understands domain-specific patterns (retail, SaaS, etc.)
- **Temporal Awareness**: "Black Friday coming—suggest seasonal data?"
- **Anti-Recommendations**: "DON'T use this deprecated table"

**MCP Tools**:
```python
# Recommendation Agent Tool Set
tools = [
    CollaborativeFilteringTool(),   # Similar user patterns
    GraphEmbeddingTool(),           # Table similarity via embeddings
    UsagePatternTool(),             # Organizational patterns
    PersonalizationTool(),          # User preference learning
    HistoryTool()                   # User's past projects
]
```

---

## Integration Points in UI

### 1. **Chat Interface (Primary)**

**Location**: Persistent panel on right side of screen (30% width)

**Interaction Model**: Conversational, context-aware, proactive

```
┌─────────────────────────────────────────────────────────┐
│ 🤖 AI Assistant                                  [✕]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 💬 You: Show me high-quality customer data              │
│                                                          │
│ 🤖 Assistant:                                           │
│ I found 3 customer tables with 90%+ quality:           │
│                                                          │
│ [Card: customers - 95% quality]                         │
│ [Card: customer_360 - 88% quality]                      │
│ [Card: customer_master - 92% quality]                   │
│                                                          │
│ Based on usage patterns, "customers" is most popular.   │
│ It's updated hourly and used by 3 teams like yours.    │
│                                                          │
│ Would you like me to:                                   │
│ [A] Add customers to your product                       │
│ [B] Compare all 3 options                               │
│ [C] Explain differences                                 │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ [Type a message...]                            [Send]   │
└─────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Natural Language Input**: "Find me tables with customer email addresses"
- **Rich Responses**: Embedded cards, comparison tables, visualizations
- **Action Buttons**: Quick actions (Add, Compare, Explain) from chat
- **Context Retention**: Remembers conversation history within session
- **Proactive Suggestions**: Agent speaks up when it detects issues

### 2. **Inline Suggestions (Secondary)**

**Location**: Contextual tooltips and badges throughout UI

**Examples**:

```
┌─────────────────────────────────────────────────────────┐
│ Table: customers                                [Add ▼] │
├─────────────────────────────────────────────────────────┤
│ 2.5M rows • 95% quality • Hourly refresh               │
│                                                          │
│ 💡 AI Insight: 892 teams joined this with "orders"     │
│    [Show Common Join Pattern]                           │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Warning: Low Quality Detected                       │
├─────────────────────────────────────────────────────────┤
│ marketing_campaigns has dropped to 78% quality          │
│                                                          │
│ Issues:                                                 │
│ • 15% null increase in campaign_id                      │
│ • Data freshness degraded (2 day lag)                   │
│                                                          │
│ Recommendation: Use campaigns_v2 instead (92% quality)  │
│                                                          │
│ [Switch Table] [Investigate Issue] [Continue Anyway]   │
└─────────────────────────────────────────────────────────┘
```

### 3. **Auto-Complete (Tertiary)**

**Location**: Search bar with intelligent suggestions

```
User types: "customer em"

Autocomplete:
┌─────────────────────────────────────────────────────────┐
│ 🔍 customer em                                          │
├─────────────────────────────────────────────────────────┤
│ Tables:                                                 │
│ • customers (contains 'email' column)                   │
│ • customer_360 (contains 'email_domain' column)         │
│                                                          │
│ Columns:                                                │
│ • customers.email                                       │
│ • customers.email_verified                              │
│                                                          │
│ 💡 Did you mean: "customer email validation tables"?   │
└─────────────────────────────────────────────────────────┘
```

### 4. **Workflow Shortcuts (Quaternary)**

**Location**: Quick action buttons in header

```
[🚀 Quick Start] [🎯 Common Patterns] [💡 Suggest Tables]
```

**"Quick Start" Flow**:
```
User clicks: [🚀 Quick Start]

Agent: Hi! I'll help you find tables. What are you building?

Options:
  📊 Dashboard / Report
  🤖 ML Model / Prediction
  📈 Analytics / Insights
  🔄 Data Pipeline / ETL
  💡 Just Exploring

User selects: 🤖 ML Model

Agent: Great! What's your prediction target?

Options:
  👤 Customer Churn
  💰 Revenue Forecast
  📦 Product Recommendation
  ⚠️  Fraud Detection
  ✍️  Custom

User selects: 👤 Customer Churn

Agent: Perfect! For churn prediction, you'll typically need:

  ✅ Customer data (profile, demographics)
  ✅ Behavioral data (engagement, activity)
  ✅ Transaction data (purchase history)
  ✅ Churn labels (historical churn events)

I found these tables that fit:
  1. customer_360 (profiles + behavior)
  2. orders (transaction history)
  3. customer_segments (includes churn labels!)

[Add All 3] [Customize Selection] [Learn More]
```

---

## Conversational Flows

### Flow 1: Discovery from Intent

```
User: "I need to build a customer retention dashboard"

Orchestrator:
├─► Parses intent: dashboard, customer retention
├─► Delegates to Discovery Agent
│   └─► Finds: customers, orders, churn_events, campaigns
├─► Delegates to Recommendation Agent
│   └─► Suggests: Most dashboards use customers + orders + engagement_metrics
└─► Synthesizes response