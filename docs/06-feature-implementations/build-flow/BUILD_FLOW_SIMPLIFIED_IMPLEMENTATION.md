# Build Flow Simplified Implementation
## Phase 1: Analyst-First, Orchestration-Focused MVP

**Date**: 2025-10-03
**Status**: In Progress
**Based On**: [BUILD_FLOW_CRITICAL_ANALYSIS.md](./BUILD_FLOW_CRITICAL_ANALYSIS.md)

---

## Executive Summary

This document tracks the implementation of the simplified, analyst-first build flow based on the critical analysis of the original PRD. The goal is to create a realistic orchestration platform, not a code generation tool.

### Key Simplifications Made

1. **Reduced from 6 steps to 5 steps** - Merged Transform logic into Deploy step
2. **Analyst-first language** - Changed from technical jargon to business-friendly terms
3. **Keyword-based recommendations** - Replaced ML approach with simple pattern matching for Phase 1
4. **Orchestration focus** - Emphasized coordination of existing tools (dbt, Airflow, Great Expectations)

---

## Flow Comparison

### Before (Original 6-Step Flow)

```
1. Intent & Context → 2. Discover Data → 3. Define Schema →
4. Quality & SLA → 5. Transform Logic → 6. Delivery Options
```

**Problems**:
- Step 5 (Transform) implied code generation
- Technical language ("schema inference", "SLA", "transform logic")
- Assumed users would write SQL themselves

### After (Simplified 5-Step Flow)

```
1. What & Why → 2. Find Data → 3. Define Output →
4. Quality Rules → 5. Deploy
```

**Improvements**:
- Transform orchestration merged into Deploy step
- Plain language throughout ("What do you need?", "Find data", "Deploy")
- Focus on configuration, not code generation

---

## Implementation Changes

### 1. Build Page Structure (`app/(main)/build/page.tsx`)

**Changed**:
```typescript
// Before: 6 steps with separate transform step
const workflowSteps = [
  { id: 'intent', label: 'Intent & Context' },
  { id: 'discover', label: 'Discover Data' },
  { id: 'schema', label: 'Define Schema' },
  { id: 'quality', label: 'Quality & SLA' },
  { id: 'transform', label: 'Transform Logic' },   // ← Removed
  { id: 'deliver', label: 'Delivery Options' }
];

// After: 5 steps, analyst-friendly labels
const workflowSteps = [
  { id: 'intent', label: 'What & Why', description: 'Business need and stakeholders' },
  { id: 'discover', label: 'Find Data', description: 'Search and select sources' },
  { id: 'schema', label: 'Define Output', description: 'What fields you need' },
  { id: 'quality', label: 'Quality Rules', description: 'Data validation checks' },
  { id: 'deploy', label: 'Deploy', description: 'Schedule and activate' }
];
```

**Impact**:
- Removed `Step5Transform` import
- Renamed `deliver` to `deploy` for clarity
- Updated form data structure to 5 steps
- Changed final step comment to emphasize orchestration

### 2. Step 1: Intent (`components/build/steps/Step1Intent.tsx`)

**Language Changes**:
```typescript
// Before
"What do you want to build?"
"Describe the intent of your data product"

// After
"What data product do you need?"
"What are you trying to analyze or report on?"
"Tell us what you're trying to analyze or report on, and we'll help you build it"
```

**Placeholder Updated**:
```typescript
// Before (too technical)
"A unified view of our customers, bringing together orders, behavioral events,
and profile information to enable personalized experiences..."

// After (analyst-focused)
"I need a weekly report showing customer purchase behavior - combining orders,
website activity, and support interactions to understand retention patterns..."
```

**Technical Approach**:
```typescript
// Added comment clarifying Phase 1 approach
// Keyword-based contract suggestion (Phase 1: Simple approach)
// Future: Replace with ML/vector search when pattern library grows

// This queries existing ODCS contracts in our catalog by keywords
const result = await suggestContracts(description);
```

**Impact**:
- More inviting for non-technical analysts
- Sets expectation that the system helps build, not that users build
- Clarifies that recommendations are keyword-based (realistic for Phase 1)

### 3. Step 2: Discover (`components/build/steps/Step2Discover.tsx`)

**Header Changes**:
```typescript
// Before
"Select the data you want to use"
"Explore tables organized by domain and category. Select tables to include in your data product."

// After
"Find your data sources"
"Search and browse available tables. Select the ones that contain the data you need."
```

**Selection Status**:
```typescript
// Before (technical)
"Schema will be auto-inferred from these tables"

// After (plain language)
"We'll automatically figure out what columns you need from these"
```

**Impact**:
- Simpler language reduces intimidation factor
- Emphasizes search/browse (familiar patterns) over "exploration"
- "We'll figure it out" messaging reduces analyst cognitive load

### 4. Step 3: Schema (Already Implemented with Lineage View)

**Current Status**: ✅ Complete from previous phase
- Tab-based interface (Lineage Flow vs Table Editor)
- Visual source → output mapping
- Confidence scoring for transparency
- No inline profiling (will be async as per critical analysis)

**Alignment with Simplified Approach**:
- Lineage view makes inference transparent (builds trust)
- Table editor provides escape hatch for experts
- Confidence scoring helps analysts understand reliability

### 5. Step 4: Quality Rules

**Planned Approach** (not yet modified):
- Simple Great Expectations configuration
- Pre-built rule templates based on data type
- Plain language descriptions ("Check that values are unique", "Make sure dates are recent")
- Defer to Great Expectations for complex validation

### 6. Step 5: Deploy (Previously Step 6: Deliver)

**Planned Changes**:
- Rename from "Delivery Options" to "Deploy"
- Show orchestration summary (what will be configured where)
- Display API calls that will be made:
  ```
  1. Create dbt model (via MCP)
  2. Configure Airflow DAG (via API)
  3. Set up Great Expectations checkpoint (via SDK)
  4. Register in DataHub (via API)
  ```
- Add schedule configuration
- Emphasize coordination, not code generation

---

## Orchestration Architecture

### What We're Building (Orchestration Layer)

```
User Intent (Portal)
  ↓
Portal Backend (FastAPI)
  ↓
┌─────────────────────────────────────┐
│   Orchestration Coordinator         │
│   (MCP + API calls, no code gen)    │
└─────────────────────────────────────┘
  ↓                 ↓                ↓
dbt MCP         Airflow API    Great Expectations
(config only)   (DAG config)   (checkpoint config)
  ↓                 ↓                ↓
Execute in      Schedule in    Validate in
Trino/Iceberg   Airflow        GE runner
  ↓                 ↓                ↓
┌─────────────────────────────────────┐
│        DataHub (Metadata)           │
│    (Contract + Lineage tracking)    │
└─────────────────────────────────────┘
```

### What We're NOT Building (Code Generation)

```
❌ Portal generates SQL code
❌ Portal generates Python code
❌ Portal generates dbt YAML files
❌ Portal manages Git repos directly

✅ Portal COORDINATES existing tools
✅ Portal CONFIGURES via APIs/MCP
✅ Portal TRACKS in DataHub
✅ Portal MONITORS execution
```

---

## Backend API Requirements (Upcoming)

### Orchestration Endpoint

```python
# POST /api/orchestrate/data-product
{
  "intent": {
    "description": "Weekly customer behavior report",
    "domain": "analytics",
    "owner": "analytics-team"
  },
  "sources": ["customers", "orders", "events"],
  "schema": [...],
  "quality_rules": [...],
  "schedule": "0 2 * * 1"  # Weekly Monday 2am
}

# Response
{
  "orchestration_id": "abc-123",
  "status": "initiated",
  "steps": [
    {
      "service": "dbt",
      "action": "create_model",
      "status": "pending",
      "mcp_call": "dbt://models/create"
    },
    {
      "service": "airflow",
      "action": "create_dag",
      "status": "pending",
      "api_endpoint": "http://airflow/api/v1/dags"
    },
    {
      "service": "great_expectations",
      "action": "create_checkpoint",
      "status": "pending",
      "sdk_method": "context.add_checkpoint()"
    },
    {
      "service": "datahub",
      "action": "register_contract",
      "status": "pending",
      "api_endpoint": "http://datahub/api/v2/entity"
    }
  ]
}
```

### Key Backend Services Needed

1. **Contract Serializer** - Convert form data → ODCS v3.0 YAML
2. **dbt MCP Client** - Create models via Model Context Protocol
3. **Airflow API Client** - Create/update DAGs via REST API
4. **Great Expectations SDK** - Configure checkpoints programmatically
5. **DataHub Emitter** - Push metadata and lineage
6. **Orchestration Tracker** - Monitor multi-step execution status

---

## Testing Strategy

### Phase 1 Testing Scope

1. **Unit Tests**:
   - Contract suggestion keyword matching
   - ODCS YAML serialization
   - Each orchestration client (dbt MCP, Airflow API, etc.)

2. **Integration Tests**:
   - End-to-end flow: Intent → Sources → Schema → Quality → Deploy
   - Orchestration sequence validation
   - Error handling and rollback

3. **User Acceptance Testing**:
   - Analyst persona walkthrough
   - Verify language is approachable
   - Confirm no technical jargon confusion

### Out of Scope for Phase 1

- ❌ ML-based recommendations testing
- ❌ Streaming data product creation
- ❌ ML feature store integration
- ❌ Advanced data profiling
- ❌ Multi-product batch creation

---

## Success Criteria

### Phase 1 MVP Complete When:

- ✅ Analyst can describe need in plain language
- ✅ System suggests relevant existing patterns (keyword search)
- ✅ Analyst can find and select source tables
- ✅ Schema is auto-inferred with confidence scores
- ✅ Quality rules can be configured (simple templates)
- ✅ Orchestration creates:
  - dbt model (via MCP)
  - Airflow DAG (via API)
  - GE checkpoint (via SDK)
  - DataHub contract (via API)
- ✅ Data product runs on schedule
- ✅ Lineage appears in DataHub
- ✅ Quality validation executes

### Measured Success Metrics

- **Time to First Data Product**: < 30 minutes for simple batch SQL
- **Analyst Adoption**: 80% of analytics team tries it
- **Success Rate**: 90% of initiated flows complete
- **Language Clarity**: Zero "what does this mean?" questions about UI text

---

## Next Steps

### Immediate (This Session)
- [x] Simplify build page to 5 steps
- [x] Update Step 1 language to analyst-friendly
- [x] Update Step 2 language to plain English
- [ ] Review Step 3 (schema) for alignment
- [ ] Review Step 4 (quality) for simplification
- [ ] Redesign Step 5 (deploy) to show orchestration
- [ ] Create orchestration API endpoint design

### Phase 1 Completion (4-6 weeks)
- [ ] Implement backend orchestration coordinator
- [ ] Build dbt MCP client
- [ ] Build Airflow API client
- [ ] Build Great Expectations SDK wrapper
- [ ] Integrate DataHub contract emitter
- [ ] End-to-end testing
- [ ] Documentation and training materials

### Phase 2+ (Later)
- Pattern learning from successful flows
- Async data profiling integration
- Advanced quality rule builder
- Expert mode with SQL editing
- API/streaming product types

---

## Risks and Mitigation

### Risk: dbt MCP might not support config-based model creation

**Mitigation**:
- Test MCP capabilities early (week 1)
- Fallback: Use dbt CLI with YAML file generation
- Long-term: Contribute MCP enhancement if needed

### Risk: Analysts might still find it too technical

**Mitigation**:
- User testing with real analysts (not just data engineers)
- Iteration based on feedback
- Progressive disclosure of complexity
- Escape hatch to request help from data engineering team

### Risk: Orchestration might be brittle across 4 systems

**Mitigation**:
- Comprehensive error handling
- Rollback capabilities
- Status tracking UI
- Manual intervention options
- Alert data engineering on orchestration failures

---

## Conclusion

This simplified implementation focuses on **realistic orchestration** rather than **ambitious code generation**. By targeting analysts first and using proven UX patterns with plain language, we create a foundation that can grow into the full vision while delivering value immediately.

The 5-step flow is intuitive, the orchestration approach is sound, and the scope is achievable in 4-6 weeks for Phase 1 MVP.
