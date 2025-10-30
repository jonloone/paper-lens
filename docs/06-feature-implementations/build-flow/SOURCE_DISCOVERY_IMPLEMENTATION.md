# Source Discovery & Selection: Strategic Implementation Plan

**Status**: 🎯 Strategic Roadmap
**Created**: 2025-10-27
**Owner**: Product & Engineering
**Priority**: P0 - Critical Path

---

## Executive Summary

This document outlines NexusOne's strategic approach to source discovery and selection in the Build flow, leveraging our unique advantage: **source-aligned data products already productized through the Connect flow**. Unlike competitors who require manual curation or centralized teams, our architecture enables self-service data product creation with built-in quality and governance.

**Key Insight**: We don't need to build elaborate catalog discovery because our engineers have already productized sources with rich metadata. The Build flow simply needs to intelligently match user intent with these existing, trusted sources.

---

## Table of Contents

1. [Persona Analysis](#persona-analysis)
2. [Competitive Landscape](#competitive-landscape)
3. [Our Differentiated Approach](#our-differentiated-approach)
4. [User Workflow Design](#user-workflow-design)
5. [Phased Implementation](#phased-implementation)
6. [Success Metrics](#success-metrics)
7. [Technical Architecture](#technical-architecture)

---

## Persona Analysis

### Primary Persona: Analytics Engineer (40% of Build users)

**Background:**
- 2-5 years experience with SQL and data modeling
- Familiar with dbt, data warehousing concepts
- Business-technical bridge role
- Prefers guided workflows with escape hatches

**Goals for Build Flow:**
- Create reliable data products quickly (< 1 day)
- Understand data quality before using
- See examples of how others use sources
- Avoid "bad source" mistakes

**Pain Points:**
- Don't know which sources exist
- Can't assess source quality
- Uncertain if source fits use case
- Fear of choosing wrong data

**What They Need:**
```
✅ Natural language search ("customer transactions")
✅ AI-suggested sources with explanations
✅ Quality scores and trust signals
✅ Preview sample data before selecting
✅ See who else uses this source
✅ Domain-specific recommendations
```

**Success Scenario:**
> *"I need to build a churn analysis product. I type 'customer purchase behavior and engagement' and immediately see 3 relevant sources with 90%+ quality scores, owned by the Sales and Marketing teams. I can preview the data, see that 45 other people use these sources, and confidently select them in under 5 minutes."*

### Secondary Persona: Data Analyst (30% of Build users)

**Background:**
- Strong SQL skills, limited programming
- Business-focused, understands metrics deeply
- Uses BI tools extensively
- Needs simple, guided interfaces

**Goals for Build Flow:**
- Find the "right" data quickly
- Understand what's in each source
- Trust that data is accurate and fresh
- Create products without engineering help

**Pain Points:**
- Overwhelmed by technical catalogs
- Can't distinguish good vs bad sources
- Needs business-friendly descriptions
- Doesn't understand schemas

**What They Need:**
```
✅ Business-friendly source names and descriptions
✅ "Frequently used together" suggestions
✅ Clear freshness indicators ("Updated daily")
✅ Simple quality indicators (health score)
✅ Saved searches for common patterns
✅ Templates for common use cases
```

**Success Scenario:**
> *"I search for 'sales data' and see sources ranked by relevance. Each shows a human-written description like 'Daily sales transactions from Shopify' with a 95/100 health score. I see that the Marketing team uses this source frequently. I select it and move on."*

### Tertiary Persona: Senior Data Engineer (20% of Build users)

**Background:**
- 5+ years experience, deep technical expertise
- Builds complex data pipelines
- Quality and performance conscious
- Needs full technical control

**Goals for Build Flow:**
- Quickly assess source suitability
- See technical details (schema, size, partitioning)
- Understand lineage and dependencies
- Make informed architecture decisions

**Pain Points:**
- Oversimplified interfaces hide needed details
- Can't see schema until after selection
- Missing performance characteristics
- No lineage visibility

**What They Need:**
```
✅ Advanced filters (schema, size, update frequency)
✅ Full schema preview with statistics
✅ Lineage visualization
✅ Performance metrics (query latency, size)
✅ Direct access to source profiling data
✅ Keyboard shortcuts for efficiency
```

**Success Scenario:**
> *"I filter sources by 'Sales' domain and > 1M rows. I click a source and immediately see the full schema with column statistics, sample data, and lineage showing 12 downstream products. I verify the timestamp column exists for incremental loading and select it confidently."*

### Quaternary Persona: Business Analyst (10% of Build users)

**Background:**
- Limited technical skills, Excel power user
- Consumes data, rarely creates pipelines
- Needs pre-built, approved sources
- Relies on recommendations heavily

**Goals for Build Flow:**
- Use pre-approved, certified sources only
- Minimal technical decisions
- Guided, template-based workflows
- Fast time-to-insight

**Pain Points:**
- Too many technical options
- Can't judge source quality
- Afraid of making mistakes
- Needs hand-holding

**What They Need:**
```
✅ "Recommended for you" based on role
✅ Certified/approved sources only
✅ One-click templates ("Sales Dashboard")
✅ Automatic quality checks
✅ Simple, non-technical language
✅ Support from data team
```

**Success Scenario:**
> *"I click 'Create Sales Analysis' template. The system automatically suggests 3 certified sources used by my team. I review the pre-populated SQL and click 'Create Product.' Done in 10 minutes."*

---

## Competitive Landscape

### Databricks Data Intelligence Platform

**Approach**: AI-powered catalog search + persona-specific UX

**Strengths:**
- Natural language search substantially simplifies discovery
- DatabricksIQ understands organizational language
- Persona-specific views (SQL Editor for analysts, Notebooks for engineers)
- AI-generated documentation and comments
- Unity Catalog provides centralized discovery

**Weaknesses:**
- Requires centralized data team for curation
- Heavy governance overhead for certification
- All-or-nothing platform approach
- Manual documentation burden

**Key UX Patterns:**
- Search bar with natural language: "Show me customer data"
- Discover experience organizes by business domain (Sales, Marketing)
- Certification and deprecation tags signal trust
- Quality signals (usage patterns, certification status) surfaced proactively
- AI Assistant provides contextual answers about datasets

**What We Can Adopt:**
- Natural language intent matching
- Domain-based organization
- Trust signals (certification → health scores)
- Usage patterns ("45 people use this")

**Our Advantage:**
- ✅ Self-service productization (not centralized team)
- ✅ Automatic quality tracking (health scores)
- ✅ Source-agnostic (not platform lock-in)

### Snowflake Data Marketplace

**Approach**: Internal marketplace + privilege-based discovery

**Strengths:**
- Internal Marketplace centralizes data products
- Rich filtering (availability, category, business needs, region)
- Request access workflow integrates governance
- Horizon Universal Search with enhanced capabilities
- Mature search catalog with facets and relevance ranking

**Weaknesses:**
- Requires manual marketplace curation
- No automated quality tracking
- Governance-heavy approval workflows
- Limited AI-powered recommendations

**Key UX Patterns:**
- Browse-and-search interface with detailed filters
- Dataset cards with provider, description, update frequency
- "Request Access" workflow for governed sources
- Privilege-based filtering (only see what you can access)
- Rich metadata display (pricing, legal terms, coverage)

**What We Can Adopt:**
- Filter by domain, update frequency, quality
- Access control integration
- Rich source cards with metadata
- Usage-based popularity signals

**Our Advantage:**
- ✅ AI recommendations (not just search)
- ✅ Automatic metadata from Connect
- ✅ Faster self-service (no approval workflows)

### dbt Cloud Studio IDE

**Approach**: Developer-centric with AI assistance

**Strengths:**
- Sub-second search and intelligent autocomplete
- dbt Copilot generates code from natural language
- Inline chat (/doc, /findTables slash commands)
- Quick Fix auto-resolves errors
- Real-time collaboration and query endorsement
- Documentation preview before deployment

**Weaknesses:**
- Only works with dbt-managed tables
- Requires separate governance layer
- Developer-focused (not analyst-friendly)
- No cross-tool source discovery

**Key UX Patterns:**
- Keyboard shortcuts (Ctrl+i for inline chat)
- Slash commands for common tasks
- Split view for comparing queries
- Side panel execution for testing
- Model generation from sources (one-click)
- Team endorsement for quality signaling

**What We Can Adopt:**
- Keyboard shortcuts for power users
- Slash commands (/suggest, /preview)
- Inline AI assistance in SQL editor
- Collaborative endorsement → health scores

**Our Advantage:**
- ✅ Cross-source discovery (not just dbt)
- ✅ Built-in governance
- ✅ Analyst-friendly (not developer-only)

### Atlan Active Metadata Platform

**Approach**: Catalog-first with AI curation

**Strengths:**
- AI-powered search with NLP
- Smart recommendations based on role and context
- Automated documentation generation
- Playbooks accelerate data product creation
- Lineage visualization and governance workflows
- Early AI investment (first to leverage AI benefits)

**Weaknesses:**
- Requires external catalog population
- Lengthy implementation (reported > 1 year)
- Passive catalog (doesn't drive action)
- Separate from execution platform

**Key UX Patterns:**
- Semantic search using business terms
- AI-suggested datasets based on user role
- Anomaly detection for unusual patterns
- Governance workflows for approval
- Playbook-based asset curation
- Output ports concept for data products

**What We Can Adopt:**
- Role-based recommendations
- Pattern-based anomaly detection
- Playbook/template concept
- Output ports = our sources

**Our Advantage:**
- ✅ Sources already productized (no catalog population)
- ✅ Active platform (create products, not just browse)
- ✅ Faster implementation (weeks not years)

### Witboost Data Mesh Platform

**Approach**: Template-driven with lifecycle automation

**Strengths:**
- Templates and blueprints create guided workflows
- Full lifecycle automation (deploy, undeploy, rollback)
- Computational governance enforced at deploy/runtime
- Witty AI assistant for platform interaction
- LLM Engine for no-code governance policy creation
- Accelerates creation process to minutes

**Weaknesses:**
- Template-dependent (rigid workflows)
- Heavy platform configuration
- Governance-first approach can slow adoption
- Enterprise-only focus

**Key UX Patterns:**
- Visual wizards for initialization
- Template selection for common patterns
- Automated repository setup
- Pre-configured coding standards
- Lifecycle stage transitions (dev → staging → prod)
- Real-time governance policy enforcement

**What We Can Adopt:**
- Template concept for common products
- Lifecycle stage visualization
- AI assistant (Witty → our LLM integration)
- Governance policies at deploy time

**Our Advantage:**
- ✅ Flexible workflows (not template-dependent)
- ✅ Simpler governance (not over-engineered)
- ✅ Faster adoption (not enterprise-only)

### NextData OS

**Approach**: Autonomous data products as software

**Strengths:**
- Multiple interface options (Python DSL, YAML, UI, conversational)
- Nexty copilot enables natural language definition
- Product mindset (versioning, quality, UX)
- Containerization abstracts infrastructure complexity
- Search-based UI for humans, API for agents
- Treats data products as first-class citizens

**Weaknesses:**
- Complex architecture (containerized products)
- Requires platform adoption
- Limited proven enterprise deployments
- Heavy abstraction layer

**Key UX Patterns:**
- Conversational interface (Nexty agent)
- Search-based discovery UI
- Product versioning and lifecycle
- Input/output/experience ports
- API-first for agent access
- Trust built-in by design

**What We Can Adopt:**
- Conversational AI interface
- Product versioning concept
- Port-based architecture (input/output)
- API-first design for agents

**Our Advantage:**
- ✅ Simpler architecture (Trino-based)
- ✅ Proven at scale
- ✅ No containerization complexity

### DataOS (The Modern Data Company)

**Approach**: Composable, workflow-orchestrated products

**Strengths:**
- Input/output/experience ports architecture
- Workflow orchestration with dependencies
- Reusable, composable products across any stack
- Comprehensive lifecycle support
- Resource-based architecture (Workflow, Worker, Service)

**Weaknesses:**
- Complex resource model
- Platform-specific concepts
- Steep learning curve
- Limited mainstream adoption

**Key UX Patterns:**
- Port-based data product architecture
- Workflow resource for orchestration
- Dependency-based execution
- Experience ports for BI/AI integrations
- Resource composition (stack Lego blocks)

**What We Can Adopt:**
- Port concept (sources = output ports)
- Workflow dependency tracking
- Experience ports for consumption
- Composable architecture

**Our Advantage:**
- ✅ Simpler concepts (sources, products)
- ✅ Lower learning curve
- ✅ Proven Trino/Iceberg foundation

---

## Competitive Summary Matrix

| Feature | Databricks | Snowflake | dbt Cloud | Atlan | Witboost | NextData | DataOS | **NexusOne** |
|---------|------------|-----------|-----------|-------|----------|----------|--------|--------------|
| **Natural Language Search** | ✅ Strong | ⚠️ Basic | ⚠️ Limited | ✅ Strong | ⚠️ Limited | ✅ Strong | ❌ No | 🎯 **AI-Powered** |
| **AI Recommendations** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ⚠️ Limited | ✅ Yes | ❌ No | 🎯 **Intent-Based** |
| **Auto Productization** | ❌ Manual | ❌ Manual | ❌ No | ❌ No | ⚠️ Templates | ⚠️ Containers | ⚠️ Complex | 🎯 **Connect Flow** |
| **Quality Tracking** | ⚠️ Manual | ❌ No | ⚠️ Tests | ⚠️ External | ✅ Governance | ✅ Built-in | ⚠️ Limited | 🎯 **Health Scores** |
| **Source Discovery** | ✅ Catalog | ✅ Marketplace | ⚠️ dbt Only | ✅ Catalog | ⚠️ Templates | ✅ Search | ⚠️ Complex | 🎯 **Sources API** |
| **Time to Productivity** | Weeks | Weeks | Days | Months | Weeks | Weeks | Weeks | 🎯 **Minutes** |
| **Governance Overhead** | High | Medium | Low | High | Very High | Medium | High | 🎯 **Automated** |
| **Platform Lock-in** | High | High | Medium | Low | Medium | High | High | 🎯 **Open** |
| **Self-Service** | ⚠️ Limited | ⚠️ Limited | ✅ Yes | ❌ No | ⚠️ Templates | ✅ Yes | ⚠️ Complex | 🎯 **Full** |

**Legend**: ✅ Strong | ⚠️ Partial | ❌ Weak/Missing | 🎯 **Our Advantage**

---

## Our Differentiated Approach

### The Fundamental Insight

**We've already solved the hardest problem**: Source productization happens at Connect time, not Build time.

```
Connect Flow (Engineers)          Build Flow (Analysts)
        ↓                                ↓
  Productize Sources        →      Discover & Compose
  • Capture metadata                • Search by intent
  • Define quality rules            • View trust signals
  • Set refresh schedules           • Preview data
  • Document business context       • Select confidently
```

### What Makes Us Different

#### 1. Source-Aligned Products Already Exist

**Competitors:**
- Require manual catalog curation
- Need centralized data teams
- Heavy governance approval workflows
- Weeks/months to productize sources

**NexusOne:**
- ✅ Engineers productize via Connect
- ✅ Self-service, no central team
- ✅ Automatic quality tracking
- ✅ Minutes to productize sources

#### 2. Rich Metadata Captured by Humans

**Competitors:**
- AI infers meaning from schemas (unreliable)
- Manual documentation (rarely happens)
- External tools for profiling
- Metadata drift over time

**NexusOne:**
- ✅ Human-provided business descriptions
- ✅ Captured at source creation
- ✅ Automatic profiling and quality checks
- ✅ Real-time health monitoring

#### 3. Built-In Quality and Trust Signals

**Competitors:**
- Manual certification processes
- External quality tools
- Static trust indicators
- No real-time health

**NexusOne:**
- ✅ Automatic health scores (0-100)
- ✅ Real-time monitoring
- ✅ Usage tracking (who uses this?)
- ✅ Lineage from DataHub/OpenLineage

#### 4. AI Matches Intent, Doesn't Infer

**Competitors:**
- AI tries to understand raw schemas
- Hallucination risk
- No organizational context
- Generic recommendations

**NexusOne:**
- ✅ AI matches intent to existing metadata
- ✅ Uses human-provided descriptions
- ✅ Learns organizational patterns
- ✅ Domain-aware recommendations

---

## User Workflow Design

### The Ideal Experience

```
Step 1: Express Intent (10 seconds)
┌─────────────────────────────────────────────────────────────┐
│ 🎯 What data do you need for this product?                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ "Customer purchase patterns and engagement activity"    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                 [Find Data] │
└─────────────────────────────────────────────────────────────┘

Step 2: Review Recommendations (2 minutes)
┌─────────────────────────────────────────────────────────────┐
│ ✅ RECOMMENDED DATA SOURCES (3)                             │
│ Matched to your intent and Sales domain                     │
├─────────────────────────────────────────────────────────────┤
│ 🏆 Customer Transactions                  [Health: 98/100]  │
│    Sales • Updated daily at 2am • Owned by data-eng         │
│    "Daily transaction records from Stripe..."               │
│    📊 Used by 45 people • 12 products built from this       │
│    [Preview] [Select] [View Schema]                         │
├─────────────────────────────────────────────────────────────┤
│ ⭐ User Engagement Events                 [Health: 92/100]  │
│    Marketing • Real-time streaming • Owned by analytics     │
│    "Website and app user interactions..."                   │
│    📊 Used by 23 people • 8 products built from this        │
│    [Preview] [Select] [View Schema]                         │
└─────────────────────────────────────────────────────────────┘

Step 3: Explore Source (1 minute - optional)
┌─────────────────────────────────────────────────────────────┐
│ Customer Transactions (crm.customer_transactions)            │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Schema] [Sample Data] [Lineage] [Usage]         │
│                                                               │
│ ✅ Quality Score: 98/100 (Excellent)                         │
│ • 1.25M rows, updated 2 hours ago                           │
│ • Primary key: transaction_id                                │
│ • Completeness: 99.8% • Accuracy: 98.5%                     │
│                                                               │
│ 📋 Schema (12 columns)                                       │
│ • customer_id (INTEGER) - Foreign key to customers          │
│ • amount (DECIMAL) - Transaction amount in USD              │
│ • timestamp (TIMESTAMP) - Transaction time                   │
│ • status (VARCHAR) - Completed, Pending, Refunded           │
│ ...                                                          │
│                                                               │
│ 👥 Used By: Marketing (15), Sales (20), Product (10)        │
│ 📈 12 data products built from this source                   │
└─────────────────────────────────────────────────────────────┘

Step 4: Confirm Selection (10 seconds)
┌─────────────────────────────────────────────────────────────┐
│ ✓ 2 sources selected                                        │
│ • Customer Transactions (Sales, 98/100 health)              │
│ • User Engagement Events (Marketing, 92/100 health)         │
│                                                               │
│                               [Continue to Compose SQL] →    │
└─────────────────────────────────────────────────────────────┘

Total Time: 3-5 minutes (vs 20-30 minutes browsing catalog)
```

### Interaction Patterns

#### Pattern 1: Intent-First Discovery

```typescript
// User types natural language
"Customer purchase patterns and engagement activity for churn analysis"

// System calls LLM
GET /api/sources/recommend?intent="customer purchase..."&domain="Sales"

// LLM Response
{
  "recommendations": [
    {
      "source_id": "uuid-1",
      "relevance_score": 0.95,
      "reasoning": "Primary source for purchase behavior. Contains transaction history needed for churn analysis.",
      "key_columns": ["customer_id", "amount", "timestamp"]
    },
    {
      "source_id": "uuid-2",
      "relevance_score": 0.82,
      "reasoning": "Complementary behavioral data. User engagement patterns indicate churn risk.",
      "key_columns": ["user_id", "event_type", "timestamp"]
    }
  ]
}

// UI displays ranked sources with explanations
```

#### Pattern 2: Trust Signals Everywhere

Every source card displays:
- **Health Score**: 0-100 based on monitoring
- **Owner**: Clear accountability
- **Domain**: Business context
- **Freshness**: "Updated 2 hours ago" / "Daily at 2am"
- **Usage**: "45 people use this"
- **Products**: "12 products built from this"
- **Status**: Active, Paused, Failed

#### Pattern 3: Progressive Disclosure

```
Level 1: Card View (default)
└─ Name, description, domain, health score

Level 2: Expanded Card (hover/click)
└─ + Schema preview, freshness, owner, usage stats

Level 3: Detail Panel (dedicated view)
└─ + Full schema, sample data, lineage, quality metrics

Level 4: Deep Dive (power users)
└─ + Profiling data, partition info, query patterns
```

#### Pattern 4: Collaborative Intelligence

```typescript
// Track selection patterns
trackSourceSelection({
  sources: ["uuid-1", "uuid-2"],
  intent: "churn analysis",
  domain: "Sales",
  user_role: "analytics_engineer"
});

// Learn patterns over time
// "Users who select Customer Transactions also select:"
// - User Engagement Events (85% of time)
// - Support Tickets (62% of time)
// - Customer Profile (58% of time)

// Show in UI
<SuggestionBanner>
  💡 Users building churn analysis products often combine this
  with User Engagement Events and Support Tickets
</SuggestionBanner>
```

---

## Phased Implementation

### Phase 1: MVP - Real Source Discovery (Week 1-2)

**Goal**: Replace mock data with real productized sources from Connect flow

**Backend Tasks**:
1. ✅ Sources API already exists (`/api/sources`)
2. Create `/api/sources/recommend` endpoint
   - Accept: `intent` (string), `domain` (string), `limit` (int)
   - Return: List of sources with relevance scores
3. Basic LLM ranking implementation
   - Use Vultr LLM service
   - Semantic matching on name + description + domain + tags
   - Return top N with confidence scores

**Frontend Tasks**:
1. Update `SourceSelectionInterface.tsx`:
   - Replace `AVAILABLE_SOURCES` mock with API call
   - Add loading states
   - Error handling
2. Create `SourceCard` component:
   - Display: name, description, domain, health score
   - Trust signals: owner, freshness, row count
   - Actions: Select, Preview
3. Add search and filter:
   - Domain filter
   - Health score filter (> 80, > 90)
   - Update frequency filter

**Success Criteria**:
- [ ] Users see real connected sources instead of mock data
- [ ] Sources display with trust signals visible
- [ ] Basic search and filtering works
- [ ] Can select sources and continue to SQL composer
- [ ] No performance degradation (< 2s load time)

**Files to Create/Modify**:
```
NEW:
- backend/api/sources_recommendation_routes.py
- components/build/workspace/SourceCard.tsx

MODIFY:
- components/build/workspace/SourceSelectionInterface.tsx
- backend/main.py (add routes)
- lib/services/vultr-llm.service.ts (add ranking function)
```

### Phase 2: AI-Powered Recommendations (Week 3-4)

**Goal**: Intelligent source matching based on user intent

**Backend Tasks**:
1. Enhanced LLM prompt engineering:
   ```python
   def rank_sources_by_intent(intent: str, sources: List[Source], domain: str):
       prompt = f"""Given user intent: "{intent}"

       Rank these data sources by relevance (return top 5):

       {json.dumps([{
           'id': s.id,
           'name': s.name,
           'description': s.description,
           'domain': s.domain,
           'tags': s.tags,
           'row_count': s.row_count,
           'health_score': s.health_score
       } for s in sources], indent=2)}

       User's product domain: {domain}

       For each relevant source:
       1. Explain WHY it's relevant to the intent
       2. Which columns/data would be most useful
       3. Confidence score (0-1)

       Return JSON: {{
         "recommendations": [{{
           "source_id": "...",
           "relevance_score": 0.95,
           "reasoning": "...",
           "key_columns": ["col1", "col2"],
           "confidence": 0.92
         }}]
       }}"""

       return call_llm(prompt)
   ```

2. Domain context weighting:
   - Sources from same domain get +0.1 boost
   - Sources with matching tags get +0.05 boost
   - Higher health scores get priority

3. Caching layer:
   - Cache LLM responses for common intents
   - Cache for 1 hour, invalidate on new sources

**Frontend Tasks**:
1. Natural language input:
   ```tsx
   <IntentInput
     placeholder="Describe what data you need..."
     onSubmit={handleFindSources}
     examples={[
       "Customer transactions and behavior",
       "Product inventory and sales",
       "Marketing campaign performance"
     ]}
   />
   ```

2. AI recommendation display:
   ```tsx
   <RecommendationCard
     source={source}
     relevanceScore={0.95}
     reasoning="Primary source for purchase behavior..."
     keyColumns={["customer_id", "amount", "timestamp"]}
     confidence={0.92}
   />
   ```

3. Quick actions:
   - "Accept all suggested" button
   - "Show more sources" (expand from 3 to 10)
   - "Why is this recommended?" tooltip

**Success Criteria**:
- [ ] 80%+ users get relevant recommendations
- [ ] Average selection time < 5 minutes (down from 20)
- [ ] Reasoning is clear and actionable
- [ ] Users understand why sources are suggested
- [ ] High confidence sources rank first

**Files to Create/Modify**:
```
NEW:
- components/build/workspace/IntentInput.tsx
- components/build/workspace/RecommendationCard.tsx
- backend/services/recommendation_engine.py

MODIFY:
- backend/api/sources_recommendation_routes.py
- components/build/workspace/SourceSelectionInterface.tsx
```

### Phase 3: Rich Exploration (Week 5-6)

**Goal**: Deep source understanding before selection

**Backend Tasks**:
1. Sample data endpoint:
   ```python
   @router.get("/sources/{source_id}/sample")
   async def get_source_sample(source_id: UUID, limit: int = 200):
       # Query Trino for random sample
       source = await get_source(source_id)
       query = f"""
           SELECT * FROM {source.trino_catalog}.{source.trino_schema}.{source.trino_table}
           ORDER BY RANDOM()
           LIMIT {limit}
       """
       return execute_query(query)
   ```

2. Schema profiling endpoint:
   ```python
   @router.get("/sources/{source_id}/profile")
   async def get_source_profile(source_id: UUID):
       # Return pre-computed profiling data
       # Or trigger on-demand profiling
       return {
           "quality_score": 95,
           "completeness": 98.5,
           "column_stats": [...],
           "null_percentages": {...},
           "distinct_counts": {...}
       }
   ```

3. Usage analytics endpoint:
   ```python
   @router.get("/sources/{source_id}/usage")
   async def get_source_usage(source_id: UUID):
       return {
           "users": ["user1@company.com", ...],
           "teams": {"Marketing": 15, "Sales": 20, "Product": 10},
           "products_built": 12,
           "query_count_30d": 1500,
           "avg_query_latency_ms": 250
       }
   ```

**Frontend Tasks**:
1. Master-detail layout:
   ```tsx
   <div className="grid grid-cols-12 gap-6">
     {/* Left: Source list */}
     <div className="col-span-5">
       <SourceList
         sources={sources}
         onSelect={setInspectedSource}
       />
     </div>

     {/* Right: Detail panel */}
     <div className="col-span-7">
       {inspectedSource ? (
         <SourceDetailPanel source={inspectedSource} />
       ) : (
         <EmptyState />
       )}
     </div>
   </div>
   ```

2. Tabbed detail view:
   ```tsx
   <Tabs>
     <TabsList>
       <TabsTrigger value="overview">Overview</TabsTrigger>
       <TabsTrigger value="schema">Schema</TabsTrigger>
       <TabsTrigger value="sample">Sample Data</TabsTrigger>
       <TabsTrigger value="lineage">Lineage</TabsTrigger>
       <TabsTrigger value="usage">Usage</TabsTrigger>
     </TabsList>

     <TabsContent value="overview">
       <QualityScoreCard score={98} />
       <MetadataGrid metadata={source} />
       <RecommendationSection reasoning={...} />
     </TabsContent>

     <TabsContent value="schema">
       <SchemaTable
         columns={schemaData}
         onColumnClick={showColumnDetails}
       />
     </TabsContent>

     <TabsContent value="sample">
       <DataTable
         data={sampleData}
         rowCount={200}
         totalRows={source.row_count}
       />
     </TabsContent>
   </Tabs>
   ```

3. Column detail modal (like TableBrowser):
   ```tsx
   <ColumnDetailModal
     column={selectedColumn}
     statistics={{
       distinct_count: 1250000,
       null_percentage: 2.5,
       top_values: [...],
       data_type: "VARCHAR(255)",
       sample_values: [...]
     }}
     piiDetection={{
       is_pii: true,
       type: "email",
       confidence: 0.95
     }}
   />
   ```

**Success Criteria**:
- [ ] Users can explore sources without selecting
- [ ] Sample data loads in < 3 seconds
- [ ] Schema displays with quality metrics
- [ ] Lineage shows upstream/downstream
- [ ] Usage stats visible ("used by Marketing team")
- [ ] 50% reduction in "wrong source" selections

**Files to Create/Modify**:
```
NEW:
- components/build/workspace/SourceDetailPanel.tsx
- components/build/workspace/SourceSchemaTable.tsx
- components/build/workspace/SampleDataTable.tsx
- backend/api/sources_profiling_routes.py

MODIFY:
- components/build/workspace/SourceSelectionInterface.tsx (add master-detail)
- backend/services/sources_service.py (add profiling)
```

### Phase 4: Collaborative Intelligence (Week 7-8)

**Goal**: Learn from organizational patterns

**Backend Tasks**:
1. Track selection patterns:
   ```python
   @router.post("/sources/selections")
   async def track_selection(selection: SourceSelection):
       # Store: user, sources, intent, domain, timestamp
       await db.execute("""
           INSERT INTO source_selections
           (user_id, source_ids, intent, domain, created_at)
           VALUES ($1, $2, $3, $4, NOW())
       """, selection.user_id, selection.source_ids,
           selection.intent, selection.domain)
   ```

2. Collaborative filtering:
   ```python
   def get_frequently_combined_sources(source_id: UUID) -> List[Source]:
       # Find sources often selected together
       query = """
           SELECT s2.source_id, COUNT(*) as frequency
           FROM source_selections s1
           JOIN source_selections s2 ON s1.session_id = s2.session_id
           WHERE s1.source_id = $1
             AND s2.source_id != $1
           GROUP BY s2.source_id
           ORDER BY frequency DESC
           LIMIT 5
       """
       return execute_query(query, source_id)
   ```

3. Domain patterns:
   ```python
   def get_popular_sources_by_domain(domain: str) -> List[Source]:
       # Most-used sources in domain
       query = """
           SELECT source_id, COUNT(*) as usage_count
           FROM source_selections
           WHERE domain = $1
             AND created_at > NOW() - INTERVAL '30 days'
           GROUP BY source_id
           ORDER BY usage_count DESC
           LIMIT 10
       """
       return execute_query(query, domain)
   ```

4. Success tracking:
   ```python
   # Track which products get deployed successfully
   # Feed back into recommendation confidence
   await update_source_success_rate(source_ids)
   ```

**Frontend Tasks**:
1. "Frequently used together" suggestions:
   ```tsx
   <SuggestionPanel>
     <h3>💡 Frequently Combined With</h3>
     <p>Users who selected this source also selected:</p>
     <ul>
       <li>User Engagement Events (85% of time)</li>
       <li>Support Tickets (62% of time)</li>
       <li>Customer Profile (58% of time)</li>
     </ul>
     <Button onClick={selectAll}>Add All</Button>
   </SuggestionPanel>
   ```

2. Domain templates:
   ```tsx
   <TemplateSelector domain={productData.domain}>
     <Template name="Churn Analysis">
       Sources: Customer Transactions, User Events, Support Tickets
       Used by: 45 people
       Success rate: 92%
     </Template>
     <Template name="Revenue Dashboard">
       Sources: Sales Data, Product Catalog, Customer Transactions
       Used by: 32 people
       Success rate: 88%
     </Template>
   </TemplateSelector>
   ```

3. Success stories:
   ```tsx
   <UsageStats>
     <Stat icon="📊" label="Products Built">12</Stat>
     <Stat icon="👥" label="Active Users">45</Stat>
     <Stat icon="✅" label="Success Rate">94%</Stat>
   </UsageStats>

   <ProductList title="Products Built from This Source">
     <ProductCard name="Customer Churn Predictor" team="Marketing" />
     <ProductCard name="Sales Performance Dashboard" team="Sales" />
     ...
   </ProductList>
   ```

4. Saved searches:
   ```tsx
   <SavedSearches>
     <Search name="Sales Analytics Sources" count={5} />
     <Search name="Customer Behavior Data" count={3} />
     <Button onClick={saveCurrentSearch}>
       Save Current Search
     </Button>
   </SavedSearches>
   ```

**Success Criteria**:
- [ ] Recommendation accuracy improves over time
- [ ] Common patterns visible ("frequently used together")
- [ ] 90% of users find sources in < 3 minutes
- [ ] Domain templates accelerate common use cases
- [ ] Success rate tracking improves recommendations

**Files to Create/Modify**:
```
NEW:
- backend/api/source_patterns_routes.py
- backend/services/collaborative_filtering.py
- components/build/workspace/FrequentlyUsedPanel.tsx
- components/build/workspace/TemplateSelector.tsx
- components/build/workspace/SavedSearches.tsx

MODIFY:
- components/build/workspace/SourceSelectionInterface.tsx
- backend/services/recommendation_engine.py (incorporate patterns)
```

---

## Success Metrics

### User Experience Metrics

**Primary Metrics:**
- Time to find relevant sources: < 5 min (target), < 3 min (stretch)
- Source selection accuracy: > 80% first attempt
- User confidence score: > 8/10 ("I'm confident this is the right source")
- Abandonment rate: < 10% (users who start search but don't select)

**Engagement Metrics:**
- % users using natural language search: > 70%
- % users exploring source details: > 60%
- % users accepting AI recommendations: > 50%
- Average sources explored before selection: < 5

### Business Impact Metrics

**Efficiency:**
- Reduction in source discovery time: 70% (from 20 min to < 5 min)
- Increase in products created per week: 3x
- Reduction in "wrong source" errors: 60%
- Time savings per product creation: 15 minutes

**Quality:**
- Average health score of selected sources: > 85/100
- % sources with owner contact: 100%
- % sources with recent updates (< 7 days): > 80%
- Data quality issues in deployed products: -50%

**Adoption:**
- % of Build users using source discovery: > 90%
- % of new users completing first product: > 75%
- Net Promoter Score (NPS) for Build flow: > 50
- Feature satisfaction score: > 4/5

### Technical Performance Metrics

**Response Times:**
- Sources API response: < 500ms (p95)
- Recommendation API response: < 2s (p95)
- Sample data loading: < 3s (p95)
- Schema profiling: < 1s (p95)

**Availability:**
- Sources API uptime: > 99.9%
- LLM service availability: > 99%
- Cache hit rate: > 70%
- Error rate: < 0.1%

---

## Technical Architecture

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│                                                               │
│  SourceSelectionInterface → RecommendationEngine → LLM       │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend                             │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/sources                                         │   │
│  │  - GET /sources (list all active)                    │   │
│  │  - GET /sources/{id} (detail)                        │   │
│  │  - GET /sources/recommend (AI-powered)               │   │
│  │  - GET /sources/{id}/sample (sample data)            │   │
│  │  - GET /sources/{id}/profile (quality metrics)       │   │
│  │  - GET /sources/{id}/usage (analytics)               │   │
│  │  - POST /sources/selections (track patterns)         │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services Layer                                       │   │
│  │  - SourcesService (CRUD)                             │   │
│  │  - RecommendationEngine (LLM ranking)                │   │
│  │  - ProfilingService (quality metrics)                │   │
│  │  - CollaborativeFilteringService (patterns)          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
              ↓                    ↓                  ↓
┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐
│   PostgreSQL    │  │   Trino Catalog  │  │  Vultr LLM     │
│   (metadata)    │  │   (data queries) │  │  (rankings)    │
└─────────────────┘  └──────────────────┘  └────────────────┘
```

### Data Flow: Source Discovery

```
1. User enters intent
   ↓
2. Frontend calls /api/sources/recommend
   {
     "intent": "customer purchase behavior",
     "domain": "Sales",
     "limit": 5
   }
   ↓
3. Backend fetches all active sources from PostgreSQL
   ↓
4. Backend calls Vultr LLM with prompt:
   ```
   Given intent: "customer purchase behavior"
   Domain: "Sales"

   Rank these sources:
   [{ name, description, domain, tags, health_score }]

   Return top 5 with reasoning.
   ```
   ↓
5. LLM returns ranked sources with confidence scores
   ↓
6. Backend enhances with metadata:
   - Usage stats (query count, users)
   - Products built from source
   - Frequently combined sources
   ↓
7. Response to frontend:
   {
     "recommendations": [
       {
         "source": { ...full source object... },
         "relevance_score": 0.95,
         "reasoning": "...",
         "confidence": 0.92,
         "usage_stats": { ... },
         "frequently_combined": [ ... ]
       }
     ]
   }
```

### Caching Strategy

```python
# Redis cache for LLM responses
cache_key = f"recommend:{hash(intent)}:{domain}"
if cached := redis.get(cache_key):
    return cached

# Call LLM (expensive)
result = await llm_rank_sources(intent, sources, domain)

# Cache for 1 hour
redis.setex(cache_key, 3600, result)
return result
```

### Database Schema Extensions

```sql
-- Track source selections for collaborative filtering
CREATE TABLE source_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID NOT NULL,
    source_ids UUID[] NOT NULL,
    intent TEXT,
    domain VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Track deployed products from sources
CREATE TABLE source_products (
    source_id UUID NOT NULL,
    product_id UUID NOT NULL,
    deployment_status VARCHAR(50),
    success BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (source_id, product_id)
);

-- Precomputed usage statistics
CREATE TABLE source_usage_stats (
    source_id UUID PRIMARY KEY,
    user_count INTEGER,
    query_count_30d INTEGER,
    product_count INTEGER,
    success_rate FLOAT,
    teams_using JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Appendix: Key Learnings from Competitors

### From Databricks
- **Natural language is king**: Users prefer typing intent over browsing
- **Persona matters**: Show different UX to analysts vs engineers
- **AI Assistant context**: Leverage organizational knowledge

### From Snowflake
- **Privilege-based filtering**: Don't show what users can't access
- **Rich metadata pays off**: Descriptions, categories, tags matter
- **Marketplace model**: Internal sharing accelerates adoption

### From dbt Cloud
- **Speed wins**: Sub-second interactions feel magical
- **Keyboard shortcuts**: Power users love efficiency
- **Inline AI**: Context-aware assistance beats separate chat

### From Atlan
- **Role-based recommendations**: Different roles need different sources
- **Automated documentation**: Generated docs better than none
- **Playbooks**: Templates accelerate common patterns

### From Witboost
- **Lifecycle visibility**: Users want to see deploy/staging/prod
- **Governance automation**: Enforce at runtime, not review time
- **Template-driven**: Guided workflows reduce errors

### From NextData
- **Product mindset**: Treat data as software (versioning, quality, UX)
- **Conversational AI**: Natural language lowers barrier to entry
- **API-first**: Enable both human and agent access

### From DataOS
- **Port architecture**: Clean abstraction (input/output/experience)
- **Composability**: Reusable components across stack
- **Workflow orchestration**: Dependencies matter

### Our Synthesis
**What works across all competitors:**
- Natural language interfaces
- AI-powered recommendations
- Quality/trust signals
- Usage analytics
- Progressive disclosure

**What we do uniquely well:**
- Source productization via Connect (no manual curation)
- Automatic quality tracking (health scores)
- Self-service (no approval workflows)
- Real-time metadata (not stale catalogs)

---

## Next Steps

### Immediate Actions (This Week)
1. [ ] Review and approve this strategic document
2. [ ] Assign engineering resources to phases
3. [ ] Set up project tracking in GitHub
4. [ ] Create API design documents
5. [ ] Design UI mockups for key screens

### Phase 1 Kickoff (Next Week)
1. [ ] Create `/api/sources/recommend` endpoint
2. [ ] Update `SourceSelectionInterface.tsx`
3. [ ] Build `SourceCard` component
4. [ ] Test with real sources from Connect
5. [ ] User testing with 3-5 analysts

### Communication Plan
1. [ ] Share roadmap with engineering team
2. [ ] Demo to stakeholders (product vision)
3. [ ] Gather feedback from early users
4. [ ] Document known limitations
5. [ ] Plan Phase 2 features based on learnings

---

**Document Version**: 1.0
**Last Updated**: 2025-10-27
**Review Date**: 2025-11-03
**Status**: ✅ Approved for Implementation
