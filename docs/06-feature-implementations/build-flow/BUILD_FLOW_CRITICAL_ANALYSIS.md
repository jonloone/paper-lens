# NexusOne /build Flow: Critical Analysis & Recommended Approach

**Date:** October 2025
**Status:** Strategic Review
**Version:** 1.0

---

## Executive Summary

After critical review of the Build Flow PRD against our actual platform architecture and persona needs, we've identified significant **scope creep, technical misalignment, and unrealistic assumptions**. This document provides honest assessment and a **realistic, achievable approach** that respects our orchestration capabilities and user needs.

**Bottom Line:** The PRD describes a **code generation platform** when we're actually an **intelligent orchestration layer**. We need to refocus on what we do best: coordinating existing tools with AI-powered insights, not replacing them.

---

## Critical Findings

### 1. **Fundamental Architectural Misalignment**

**PRD Assumption:** Portal generates dbt/SQLMesh code, Airflow DAGs, and GE configurations
**Reality:** We're an orchestration layer that coordinates tools via APIs/MCPs, not a code generator

**Why This Matters:**
```
PRD Vision (Wrong):
User → Portal → Generated Code → Git → Tools → Execution

Our Actual Architecture (Correct):
User → Portal → API/MCP Orchestration → Tools Execute Natively
                    ↓
                DataHub Metadata ← Learning System
```

**Problem:**
- Code generation creates **maintenance burden** (version conflicts, syntax drift)
- Users **lose direct tool access** and expertise requirements
- Platform becomes **tightly coupled** to specific tool versions
- **Breaks our core principle**: "Orchestrate, Don't Replace"

**Recommendation:**
- **Use tools natively** - dbt via MCP, SQLMesh via API, not code generation
- **Focus on configuration** - send parameters, not write code
- **Preserve direct access** - power users can still work in native tools

---

### 2. **Persona Complexity Overload**

**PRD Assumption:** Different UX flows for 4 personas (Analyst, Analytics Engineer, Data Scientist, Product Manager)
**Reality:** This creates **4x implementation burden** for marginal benefit

**Analysis by Persona:**

| Persona | PRD Flow | Actual Need | Recommendation |
|---------|----------|-------------|----------------|
| **Analyst (Sarah)** | No-code visual builder | Quick filtered views | ✅ Keep simplified - highest value |
| **Analytics Eng (Marcus)** | SQL editor + dbt | **Already uses dbt directly** | ❌ Remove - they bypass portal anyway |
| **Data Scientist (Priya)** | Feature engineering UI | Notebook integration | ⚠️ Simplified version only |
| **Product Manager (Alex)** | Discovery-first | **Rarely creates products** | ❌ Remove - consumption focus |

**Finding:** We're building **3 flows we don't need** because power users prefer native tools.

**Recommended Approach:**
- **Single unified flow** with progressive disclosure
- **Analyst-first UX** (80% of users)
- **"Expert Mode" escape hatch** to native tools for power users
- **Discovery/consumption** separate from creation (different page)

---

### 3. **Template Recommendation Over-Engineering**

**PRD Describes:**
- ML-powered intent analysis with embeddings
- Usage pattern detection across teams
- Automatic source recommendations
- Template generation from successful patterns

**Reality Check:**
```python
# PRD wants this:
def analyze_intent(intent_text: str) -> IntentAnalysis:
    embedding = generate_embedding(intent_text)
    similar_products = vector_search(embedding)
    patterns = ml_pattern_detection(similar_products)
    return complex_recommendation_engine(patterns)

# What we actually need:
def analyze_intent(intent_text: str) -> IntentAnalysis:
    keywords = extract_keywords(intent_text)  # Simple NLP
    matching_products = keyword_search(keywords)  # DataHub search
    return top_3_similar_products(matching_products)  # Simple ranking
```

**Problems:**
- **No training data** for ML model yet (cold start)
- **Premature optimization** - keyword search works fine initially
- **Maintenance complexity** - embeddings require ongoing tuning

**Recommendation:**
- **Phase 1:** Simple keyword-based search using DataHub
- **Phase 2:** Track usage patterns (which products get selected together)
- **Phase 3:** Build ML recommendations ONLY if Phase 2 shows clear patterns

---

### 4. **Data Profiling Integration Timing**

**PRD Assumption:** Run Great Expectations profiling during schema definition step
**Reality:** Profiling 3.2M rows takes **5-15 minutes** - kills workflow momentum

**User Experience Impact:**
```
Ideal Flow (Fast):
Step 1 → Step 2 → Step 3 → Deploy (15 minutes total)

PRD Flow (Slow):
Step 1 → Step 2 → [WAIT 10 MIN FOR PROFILING] → Step 3 → Deploy (30+ minutes)
```

**Better Approach:**
- **Async profiling** - happens AFTER deployment
- **Second-iteration enhancement** - users come back to add quality rules
- **Smart defaults** - infer basic tests from schema types without profiling

**Recommendation:**
```
Step 2: Schema Definition
├─ Auto-infer basic tests (nullability, types)
├─ [Optional] Run profiling in background
└─ Deploy immediately with basic tests

Post-Deployment:
├─ Profiling completes
├─ Portal suggests additional tests
└─ User reviews and applies in second iteration
```

---

### 5. **Multi-Product Generation (ODPS) Complexity**

**PRD Describes:** One contract → multiple products (Batch, API, Stream)
**Reality:** **95% of users only need batch SQL access**

**Cost-Benefit Analysis:**

| Product Type | Users Needing | Implementation Cost | Value |
|-------------|---------------|---------------------|-------|
| **Batch SQL** | 95% | ⚫⚫⚪⚪⚪ Low | ⭐⭐⭐⭐⭐ |
| **REST API** | 10% | ⚫⚫⚫⚫⚪ High | ⭐⭐⚪⚪⚪ |
| **Stream (Kafka)** | 2% | ⚫⚫⚫⚫⚫ Very High | ⭐⚪⚪⚪⚪ |

**Problem:** Spending 60% of effort on features 5% of users need

**Recommendation:**
- **Phase 1:** Batch SQL only (table creation)
- **Phase 2+:** API/Stream as **separate workflows** (not part of build flow)
- **Reality:** Most "API access" can be REST query wrapper, not product regeneration

---

### 6. **Tool Selection Logic Unrealistic**

**PRD Describes:** Automatic routing between dbt and SQLMesh based on complexity
**Reality:** Teams standardize on ONE tool - switching creates chaos

**Why This Fails:**
```python
# PRD wants:
if needs_advanced_incremental:
    use_sqlmesh()
else:
    use_dbt()

# What actually happens:
User: "Why did the portal use SQLMesh? Our team only knows dbt!"
Support: "It detected your use case needed advanced incrementals"
User: "I don't care - we can't maintain SQLMesh models!"
```

**Real World:**
- **Team standards > Tool optimality**
- **Knowledge transfer matters** more than features
- **Consistency beats optimization**

**Recommendation:**
- **Org-wide default** (dbt or SQLMesh) set at platform level
- **Per-team override** if needed
- **No automatic switching** - humans decide, not algorithms

---

## Recommended Approach: Realistic Build Flow

### Core Principles

1. **Orchestrate existing tools** - don't generate code
2. **Analyst-first UX** - 80% of users, 20% of features
3. **Progressive disclosure** - complexity when needed, not by default
4. **Fast feedback loops** - async where possible
5. **Learn before predicting** - simple rules before ML

---

### Revised User Flow (5 Steps)

#### **Step 1: Intent & Discovery** (2-3 minutes)

**What User Sees:**
```
┌────────────────────────────────────────────────────────┐
│ Build a Data Product                                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ What would you like to create?                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ Customer churn analysis for Q4 campaign        │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ 🔍 Recommended data sources (3):                      │
│ ☑ Customer 360 (3.2M customers, 99% quality)          │
│ ☐ Transaction History (850M transactions)             │
│ ☐ Support Tickets (2.1M tickets)                      │
│                                                        │
│ [Browse All Sources] [Continue]                       │
└────────────────────────────────────────────────────────┘
```

**What Portal Does:**
1. **Simple keyword extraction** from intent text
2. **DataHub search** for matching products/tables
3. **Rank by:**
   - Keyword overlap (simple)
   - Usage count (popular = better)
   - Quality score (only use high-quality)
4. **Return top 5** - no ML needed

**Backend Reality:**
```python
# Not this (PRD):
recommendations = ml_intent_analyzer.predict(intent_text)

# This (Realistic):
keywords = extract_keywords(intent_text)  # "customer", "churn"
results = datahub.search(
    keywords=keywords,
    filters={"quality_score__gte": 90},
    sort_by="usage_count_desc"
)[:5]
```

---

#### **Step 2: Schema Review** (1-2 minutes)

**What User Sees:**
```
┌────────────────────────────────────────────────────────┐
│ Review Output Schema                                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ✅ Auto-inferred 47 columns from Customer 360          │
│                                                        │
│ Product name: [customer_churn_q4_analysis     ]       │
│ Table name:   [marketing.churn_q4_analysis    ]       │
│                                                        │
│ [View Full Schema] [Edit Columns]                     │
│                                                        │
│ ⚠️ Issues detected (2):                                │
│ • phone: 12% nulls - may impact contact features      │
│ • email: duplicate column - suggest merge              │
│                                                        │
│ [Continue] [Run Quality Profiling in Background]      │
└────────────────────────────────────────────────────────┘
```

**What Portal Does:**
1. **Read source schema** from DataHub
2. **Simple conflict detection:**
   - Duplicate column names → suggest merge
   - High null % (>10%) → warn user
   - Type mismatches → flag for review
3. **Infer basic quality rules:**
   - PK = unique + not null
   - Numeric = >= 0 (if revenue/count)
   - Timestamps = within reasonable range

**Backend Reality:**
```python
# Schema inference - SIMPLE
schema = []
for source in selected_sources:
    metadata = datahub.get_schema(source)
    for column in metadata.columns:
        # Simple conflict check
        if column.name in existing_columns:
            issues.append(f"Duplicate: {column.name}")
        schema.append(column)

# Basic quality rules - HEURISTICS
tests = []
if column.is_primary_key:
    tests.append(UniqueTest(column.name))
    tests.append(NotNullTest(column.name))
if "revenue" in column.name.lower():
    tests.append(MinValueTest(column.name, min=0))
```

**No Code Generation Yet** - just configuration

---

#### **Step 3: Transformations (Optional)** (2-5 minutes)

**What User Sees (Analyst Mode):**
```
┌────────────────────────────────────────────────────────┐
│ Add Transformations (Optional)                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Your product will use raw Customer 360 data           │
│                                                        │
│ Want to filter or aggregate?                          │
│                                                        │
│ [+ Add Filter]  Keep only specific rows               │
│ [+ Aggregate]   Group by and calculate metrics        │
│ [+ Join]        Combine with another source            │
│                                                        │
│ [Skip Transformations] [Continue]                     │
└────────────────────────────────────────────────────────┘
```

**What User Sees (Expert Mode Toggle):**
```
┌────────────────────────────────────────────────────────┐
│ Transformations                                        │
├────────────────────────────────────────────────────────┤
│ [Visual Builder] [SQL Editor] [Edit in dbt]           │
│                                                        │
│ Write custom SQL or [open in dbt Cloud]               │
│ ┌────────────────────────────────────────────────┐   │
│ │ SELECT                                          │   │
│ │   customer_id,                                  │   │
│ │   email,                                        │   │
│ │   CASE WHEN ...                                 │   │
│ │ FROM {{ ref('customer_360') }}                  │   │
│ │ WHERE customer_tier IN ('Gold', 'Silver')       │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ [Validate SQL] [Continue]                             │
└────────────────────────────────────────────────────────┘
```

**What Portal Does:**

**For Visual Transformations:**
```python
# Build transformation config (JSON)
transformation = {
    "type": "filter",
    "conditions": [
        {"column": "customer_tier", "op": "in", "values": ["Gold", "Silver"]}
    ]
}

# Send to tool via MCP/API
dbt_mcp.create_model(
    name="churn_q4_analysis",
    source_ref="customer_360",
    transformations=[transformation]  # Tool handles SQL generation
)
```

**For SQL Editor:**
```python
# User writes SQL with {{ ref() }} syntax
user_sql = request.body.sql

# Validate via Trino dry-run
validation = trino.explain(user_sql)

# Send to dbt via MCP
dbt_mcp.create_model_from_sql(
    name="churn_q4_analysis",
    sql=user_sql  # Tool owns the code
)
```

**Critical Difference:** We send **configuration** or **user-written SQL**, not **generated code**

---

#### **Step 4: Quality & Governance** (1 minute)

**What User Sees:**
```
┌────────────────────────────────────────────────────────┐
│ Quality Checks                                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ✅ Auto-generated checks (5):                          │
│ • customer_id must be unique                           │
│ • customer_id cannot be null                           │
│ • revenue >= 0                                         │
│ • email must match email format                        │
│ • updated_at within 7 days (freshness)                │
│                                                        │
│ [+ Add Custom Check] [Continue]                       │
│                                                        │
│ 🔬 Quality profiling running in background...          │
│    We'll suggest more checks after deployment          │
└────────────────────────────────────────────────────────┘
```

**What Portal Does:**
```python
# Simple heuristic-based test generation
tests = []

# From schema metadata
if column.is_primary_key:
    tests.append({"type": "unique", "column": column.name})
    tests.append({"type": "not_null", "column": column.name})

# From naming conventions
if "email" in column.name:
    tests.append({"type": "regex", "column": column.name, "pattern": EMAIL_REGEX})

if column.type == "timestamp":
    tests.append({"type": "freshness", "column": column.name, "max_age_days": 7})

# Configure Great Expectations via API
ge_api.create_checkpoint(
    name=product.name,
    expectations=tests
)
```

**Profiling happens async** - doesn't block deployment

---

#### **Step 5: Review & Deploy** (30 seconds + 5-10 min deployment)

**What User Sees:**
```
┌────────────────────────────────────────────────────────┐
│ Review & Deploy                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 📋 Data Contract (ODCS v3.0)                           │
│ ✓ Product: marketing.churn_q4_analysis                │
│ ✓ Sources: Customer 360 (1)                           │
│ ✓ Schema: 47 columns                                  │
│ ✓ Quality: 5 automated checks                         │
│ ✓ Owner: sarah.marketing@company.com                  │
│                                                        │
│ 🚀 Deployment Plan:                                    │
│ • Create Iceberg table                                │
│ • Configure dbt model (via MCP)                       │
│ • Schedule Airflow refresh (daily 2 AM)              │
│ • Register in DataHub catalog                         │
│ • Run quality checks                                  │
│                                                        │
│ Estimated time: 8-12 minutes                          │
│                                                        │
│ [Deploy to Development] [Save Draft]                  │
└────────────────────────────────────────────────────────┘
```

**What Portal Does:**
```python
async def deploy_product(product: ProductConfig):
    # 1. Generate ODCS contract (YAML)
    contract = generate_odcs_contract(product)
    await storage.save(f"contracts/{product.name}_v1.0.0.yaml", contract)

    # 2. Create table in Iceberg via Trino
    await trino.execute(f"""
        CREATE TABLE {product.schema}.{product.name} (
            {generate_ddl(product.schema)}
        )
        WITH (format = 'PARQUET')
    """)

    # 3. Configure dbt via MCP (no code generation!)
    await dbt_mcp.create_model(
        name=product.name,
        config={
            "materialized": "table",
            "schema": product.schema,
        },
        source_refs=[s.name for s in product.sources],
        transformations=product.transformations
    )

    # 4. Configure Airflow DAG via API
    await airflow_api.create_dag(
        dag_id=f"{product.schema}_{product.name}_refresh",
        schedule="0 2 * * *",  # Daily 2 AM
        tasks=[
            {"type": "dbt_run", "model": product.name},
            {"type": "ge_checkpoint", "name": product.name},
            {"type": "datahub_sync", "urn": product.urn}
        ]
    )

    # 5. Register in DataHub
    await datahub.upsert_dataset(
        urn=product.urn,
        schema=product.schema,
        properties={
            "contract": contract,
            "owner": product.owner,
            "quality_score": None  # Set after first run
        }
    )

    # 6. Trigger initial run
    run_id = await airflow_api.trigger_dag(dag_id, wait=False)

    return {"deployment_id": run_id, "status": "in_progress"}
```

**Key Point:** We're **orchestrating tools via APIs**, not generating code files

---

### What We're NOT Building (Scope Cuts)

| Feature | PRD Status | Our Decision | Rationale |
|---------|-----------|--------------|-----------|
| **Multiple persona flows** | Core feature | ❌ Cut | Single flow with progressive disclosure |
| **ML-powered recommendations** | Phase 1 | ⏸️ Defer to Phase 3 | Start with simple keyword search |
| **Inline data profiling** | Core feature | ⏸️ Async only | Blocks workflow (5-15 min wait) |
| **Code generation (dbt/SQLMesh)** | Core feature | ❌ Replace with MCP orchestration | Maintenance nightmare |
| **Automatic tool routing** | Core feature | ❌ Cut | Teams need consistency |
| **API/Stream products** | Phase 3 | ⏸️ Separate workflow | 5% of users need this |
| **Feature engineering UI** | Data scientist flow | ❌ Cut | They use notebooks anyway |
| **Multi-environment promotion** | Phase 3 | ⏸️ Defer to Phase 4 | Manual Git promotion works |

---

## Realistic Implementation Phases

### **Phase 1: Analyst-First MVP** (4-6 weeks)

**Scope:**
- ✅ Intent capture + keyword-based recommendations
- ✅ Source selection from DataHub catalog
- ✅ Auto schema inference with conflict detection
- ✅ Basic visual transformations (filters, aggregations)
- ✅ Heuristic quality test generation
- ✅ Tool orchestration via MCP/APIs (dbt + Airflow)
- ✅ ODCS contract generation
- ✅ Deploy to development

**Success Criteria:**
- 10 analysts create 30 products
- 80% deployment success rate
- <20 min end-to-end time
- 4/5 user satisfaction

**What We're Proving:**
- Orchestration architecture works
- Analysts can self-serve
- Quality defaults are reasonable

---

### **Phase 2: Quality Enhancement** (3-4 weeks)

**Scope:**
- ✅ Async data profiling (Great Expectations)
- ✅ Post-deployment test suggestions
- ✅ Quality dashboard
- ✅ SQL editor for custom transformations
- ✅ DataHub lineage integration

**Success Criteria:**
- 60% of products add profiling-based tests
- Quality score visible in catalog
- Power users can write SQL

**What We're Proving:**
- Async profiling doesn't hurt adoption
- Users come back to enhance quality
- SQL editor handles advanced cases

---

### **Phase 3: Learning & Optimization** (6-8 weeks)

**Scope:**
- ✅ Usage pattern tracking
- ✅ **Simple collaborative filtering** for recommendations
  - "Users who selected Customer 360 also selected Transaction History"
- ✅ Template library (curated, not auto-generated)
- ✅ Production deployment workflow
- ✅ Cost attribution

**Success Criteria:**
- Template adoption >50%
- Recommendations improve selection time by 30%
- Production deployments have SLAs

**What We're Proving:**
- Simple pattern learning works
- Templates capture org knowledge
- Production governance is manageable

---

### **Phase 4: Advanced Orchestration** (8+ weeks)

**Scope:**
- ✅ SQLMesh support (if teams request)
- ✅ Multi-source joins and complex transformations
- ✅ Incremental refresh strategies
- ✅ Impact analysis (downstream dependency tracking)
- ✅ API product generation (separate flow)

**Success Criteria:**
- Support both dbt and SQLMesh teams
- Handle 90% of use cases without SQL
- API products for high-value use cases only

---

## Technical Architecture (Corrected)

### Orchestration-First Approach

```
┌─────────────────────────────────────────────────┐
│           NexusOne Portal (React)               │
│  User configures WHAT, not HOW                  │
└─────────────────────────────────────────────────┘
                    │
                    │ REST APIs
                    ▼
┌─────────────────────────────────────────────────┐
│        Orchestration API (FastAPI)              │
│  • Translates user intent to tool configs       │
│  • Coordinates multi-tool workflows             │
│  • No code generation - sends configs           │
└─────────────────────────────────────────────────┘
          │              │              │
          │ MCP          │ HTTP API     │ Python SDK
          ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ dbt        │  │ Airflow    │  │ Great      │
│ (via MCP)  │  │ (via API)  │  │ Expectations│
│            │  │            │  │ (via SDK)  │
│ Owns code  │  │ Owns DAGs  │  │ Owns tests │
└────────────┘  └────────────┘  └────────────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Trino + Iceberg    │
              │   (Data Execution)   │
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   DataHub            │
              │   (Metadata & Discovery)│
              └──────────────────────┘
```

**Key Principles:**
1. **Tools own artifacts** (dbt owns .sql files, not portal)
2. **Portal owns orchestration** (coordinates, doesn't execute)
3. **APIs > Code generation**
4. **DataHub is source of truth** for metadata

---

## User Personas: Simplified

### Primary Persona (80% of users)

**Data Analyst - Self-Service Builder**
- Needs: Quick filtered views, basic aggregations
- Workflow: Intent → Select sources → Deploy (15 min)
- Success: Can create without asking Data Engineers

### Secondary Persona (15% of users)

**Analytics Engineer - Power User**
- Needs: Custom SQL, quality tests, dbt integration
- Workflow: Portal for setup → **Jump to dbt for advanced work**
- Success: Portal handles boilerplate, they add sophistication

### Edge Case (5% of users)

**Data Scientist - Notebook User**
- Needs: Training datasets with point-in-time correctness
- Workflow: Portal creates base table → **Feature engineering in Python**
- Success: Reproducible datasets, version-controlled

**Key Insight:** We're building for Analysts. Power users use native tools.

---

## ODCS/ODPS Integration: Realistic Scope

### ODCS (Data Contracts) - **Phase 1**

**What We Generate:**
```yaml
# contracts/marketing_churn_q4_v1.0.0.yaml
dataContractSpecification: "3.0.0"
id: "urn:datacontract:marketing:churn_q4_analysis"
info:
  title: "Customer Churn Q4 Analysis"
  version: "1.0.0"
  owner: "sarah.marketing@company.com"
  description: "Customer churn analysis for Q4 campaign"

models:
  churn_q4_analysis:
    type: "table"
    fields:
      customer_id:
        type: "bigint"
        required: true
        unique: true
      email:
        type: "string"
        required: true
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      # ... other fields

quality:
  type: "Great Expectations"
  specification:
    uniqueness:
      customer_id: { threshold: 100 }
    completeness:
      customer_id: { threshold: 100 }
      email: { threshold: 100 }
```

**Storage:** Git repository (`contracts/` directory)
**Consumption:** DataHub reads contracts, displays in UI

---

### ODPS (Data Products) - **Phase 3+**

**Phase 1:** Batch SQL only
```yaml
# products/marketing_churn_q4_batch_v1.yaml
dataProductSpecification: "1.0.0"
id: "urn:dataproduct:marketing:churn_q4_analysis:batch"
info:
  name: "churn_q4_analysis"
  productType: "batch-sql"
  dataContract: "urn:datacontract:marketing:churn_q4_analysis"

delivery:
  protocol: "trino-sql"
  endpoint: "marketing.churn_q4_analysis"
  format: "iceberg"
  schedule:
    cron: "0 2 * * *"
```

**Phase 3:** API products (separate workflow)
- Users request "Create API from table"
- Generates FastAPI endpoint using existing table
- Separate from build flow

---

## Key Metrics (Revised)

### Success Metrics (Phase 1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Deployment success rate** | >80% | % of started flows that deploy successfully |
| **Time to first deployment** | <20 min | p50 time from intent to deployed product |
| **User satisfaction** | >4/5 | Post-deployment survey |
| **Self-service rate** | >70% | % of products created without support tickets |
| **Quality score** | >90% | % of deployed products passing all tests |

### Anti-Metrics (What We Don't Track)

- ❌ **Number of features used** - simplicity > feature coverage
- ❌ **Code lines generated** - we don't generate code
- ❌ **AI recommendation accuracy** - Phase 1 doesn't use ML

---

## Risks & Mitigations

### Risk 1: Users Expect Code Generation

**Risk:** Users want to "see the dbt code"
**Mitigation:**
- MCP allows "open in dbt" - portal configures, user sees code in tool
- Export option: Generate read-only dbt project for auditing

### Risk 2: Tool Version Drift

**Risk:** dbt/SQLMesh/GE update breaks our integrations
**Mitigation:**
- Use stable API versions
- MCP handles version abstraction
- Minimal custom code = less breakage

### Risk 3: Complex Transformations

**Risk:** Users need joins/window functions portal can't handle
**Mitigation:**
- SQL editor for custom logic (Phase 2)
- "Edit in dbt" escape hatch
- Focus on 80% use case (filters/aggregations)

### Risk 4: Recommendation Quality

**Risk:** Keyword search gives poor recommendations
**Mitigation:**
- Start with curated templates (manual curation)
- Track selection patterns for Phase 3 ML
- User feedback loop ("Was this helpful?")

---

## Conclusion & Next Steps

### What We Learned

1. **PRD over-engineers** persona complexity and code generation
2. **Our strength is orchestration**, not replacement
3. **Analysts are primary users** - power users bypass portal
4. **Simple works** - keyword search before ML, async profiling, heuristic tests
5. **Tools own code** - we send configs, not generate files

### What We're Building

**Phase 1 (MVP):**
- Single analyst-friendly flow
- DataHub-powered recommendations
- MCP/API orchestration (no code gen)
- ODCS contracts
- Batch SQL products only

**Success Looks Like:**
- Sarah (Analyst) creates filtered Customer 360 view in 15 minutes
- Portal handles DataHub registration, Airflow scheduling, quality tests
- dbt model exists but Sarah never sees it
- Marcus (Engineer) can still open dbt to customize if needed

### Immediate Actions

1. **Validate architecture** - Confirm dbt MCP can handle our config approach
2. **Prototype Step 1** - Test DataHub search for recommendations
3. **Design schema inference** - Simple conflict detection without profiling
4. **Define ODCS schema** - Finalize contract YAML structure
5. **Plan deployment flow** - Orchestration sequence for tools

---

**This is the realistic path forward.** Simple, orchestration-focused, analyst-first, with room to grow.
