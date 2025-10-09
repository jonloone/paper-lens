# NexusOne Platform Audit 2025
**Critical Analysis: Capability Gaps & UX Issues**

**Date:** October 8, 2025
**Auditor:** Platform Architecture Team
**Scope:** All 90+ routes, features, and user flows
**Benchmark:** Persona requirements from PERSONA_FEATURE_MAPPING.md

---

## Executive Summary

### Overall Platform Health: 6.5/10 ⚠️

**Critical Finding:** While NexusOne has strong foundational capabilities, significant gaps exist between stated persona needs and actual implementation. The platform suffers from **navigation confusion**, **duplicate/deprecated routes**, and **incomplete user journeys**.

### Top-Level Assessment

| Category | Score | Status | Critical Issues |
|----------|-------|--------|----------------|
| **Core Workflows** | 7/10 | 🟡 Partial | Build flow complete, Operations/Govern incomplete |
| **Navigation & IA** | 4/10 | 🔴 Poor | 90+ routes, unclear hierarchy, no persona-based nav |
| **Persona Alignment** | 6/10 | 🟡 Partial | Data Engineer well-served, others have gaps |
| **Feature Completeness** | 5/10 | 🔴 Poor | Many placeholders, mock data, no backend integration |
| **UX Consistency** | 5/10 | 🔴 Poor | Inconsistent patterns, duplicate functionality |

### Critical Gaps Preventing Jobs-To-Be-Done

#### 🔴 **CRITICAL (Blocks Core Workflows)**

1. **Operations Monitoring Incomplete**
   - **Impact:** Senior Data Engineers cannot perform hourly monitoring (primary workflow)
   - **Gap:** Real-time pipeline status exists but lacks Debug Agent integration, lineage tracing
   - **Affected Personas:** Senior DE (primary), Data Engineer (secondary)
   - **ROI Loss:** 85% MTTR reduction promise blocked

2. **Discover Marketplace Missing Natural Language Search**
   - **Impact:** Data Analysts cannot self-serve (80% self-service promise blocked)
   - **Gap:** Semantic search UI exists but no backend NLP-to-SQL
   - **Affected Personas:** Data Analyst (primary), Data Scientist (secondary)
   - **ROI Loss:** 80% time savings blocked

3. **Governance Dashboard Lacks Policy Management**
   - **Impact:** Product Managers cannot track compliance (daily workflow blocked)
   - **Gap:** `/govern` page shows mock data, no OPA/Ranger integration
   - **Affected Personas:** Product Manager (primary), Senior DE (secondary)
   - **ROI Loss:** 90% governance automation blocked

4. **Source Management Missing Table-Level Configuration**
   - **Impact:** Senior DEs cannot implement unified ingestion strategy
   - **Gap:** Per-table method selection UI missing from connection wizard
   - **Affected Personas:** Senior DE (primary)
   - **ROI Loss:** Cost optimization features blocked

#### 🟡 **HIGH PRIORITY (Degrades Experience)**

5. **No Unified Landing Page (Role-Based)**
   - Two competing overview pages (`/page.tsx`, `/overview/page.tsx`)
   - Neither is persona-optimized
   - New users confused about where to start

6. **Build Flow Missing AI Assistance Integration**
   - tiSQL workstation has AI chat panel, but not connected to CrewAI agents
   - SQL generation exists but no optimization agent
   - Missing pattern library integration

7. **No Cross-Tool Context Preservation**
   - Moving between pages loses context (selected sources, pipelines, etc.)
   - Every page is stateless silo
   - Breaks 60% context switch reduction promise

#### 🟢 **MEDIUM PRIORITY (Polish & Optimization)**

8. **Redundant/Deprecated Routes** - 20+ routes that should be consolidated or removed
9. **Inconsistent Design Patterns** - Mix of old and new component libraries
10. **Missing Mobile Responsiveness** - Platform assumes desktop use

---

## Detailed Route Analysis

### Category 1: CORE WORKFLOWS

---

#### `/build` - Data Product Creation (6-Step Flow)

**Route:** `/app/(main)/build/page.tsx`

**Purpose:** Guided workflow for creating data products from definition to deployment

**Target Personas:**
- 🟢 Data Engineer (Primary - 3-4 hrs/day)
- 🟢 Analytics Engineer (Primary - 2-3 hrs/day)
- 🟡 Senior DE (Secondary - strategic products)

**Completeness:** 🟢 **PRODUCTION READY**

**Alignment Score:** 9/10 ⭐ **EXCELLENT**

**Key Features Present:**
- ✅ 6-step horizontal stepper (Define → Sources → SQL → Quality → Delivery → Deploy)
- ✅ Auto-save every 30 seconds
- ✅ Draft recovery modal
- ✅ Named draft saving/loading
- ✅ Progress tracking
- ✅ Context preservation across steps
- ✅ tiSQL Workstation integration (Step 3)
- ✅ Great Expectations integration (Step 4)
- ✅ Multiple delivery formats (Step 5)
- ✅ PR creation workflow (Step 6)

**Gaps Identified:**

1. **AI Assistance Not Fully Integrated** 🟡
   - tiSQL AI chat exists but not connected to:
     - SQL Optimization Agent (exists in backend)
     - Pattern Library (exists but not surfaced)
     - Smart Defaults (service exists, not used)
   - **Impact:** Missing 40% time savings promise

2. **Quality Rules Need Smarter Defaults** 🟡
   - Step 4 requires manual rule creation
   - Backend recommendation engine exists but not integrated
   - **Impact:** Data Engineers spend 30 mins instead of 5 mins

3. **Missing Lineage Preview** 🟡
   - Step 6 Review should show downstream impact
   - Lineage service exists but not integrated
   - **Impact:** Blind deployment risks

4. **No Cost Estimation** 🟢
   - Users don't see infrastructure cost before deploy
   - Backend cost calculator needed
   - **Impact:** Budget surprises

**UX Issues:**

1. **Step 2 (Source Selection) Overwhelming**
   - Shows all tables from all sources at once
   - No search/filter within step
   - Schema grouping not collapsible
   - **Recommendation:** Add table search, schema collapse, recent sources

2. **Step 3 (SQL) Height Fixed at 600px**
   - Cannot resize tiSQL workspace
   - On small screens, feels cramped
   - **Recommendation:** Make resizable or full-screen option

3. **Step 4 (Quality) Rule UI Not Intuitive**
   - "Add Rule" button not prominent
   - Rule types in dropdown (should be cards with examples)
   - **Recommendation:** Card-based rule picker with previews

4. **Step 6 (Review) Too Verbose**
   - Shows all raw config JSON
   - Non-technical users (AE) intimidated
   - **Recommendation:** High-level summary view with "Show Details" toggle

**Backend Integration Status:**
- ✅ Step 1-3: Frontend only (acceptable for PoC)
- ⏳ Step 4: Great Expectations service exists, not connected
- ⏳ Step 5: Delivery configs frontend-only
- ❌ Step 6: PR creation mocked (critical gap)

**Recommendations:**

**Priority 1 (Critical):**
- Connect Step 6 to backend deployment API
- Implement PR creation to actual Git repo
- Add deployment status tracking

**Priority 2 (High Value):**
- Integrate Optimization Agent into tiSQL (Step 3)
- Connect recommendation engine to Quality step (Step 4)
- Add lineage preview to Review step (Step 6)

**Priority 3 (Polish):**
- Improve Step 2 source selection UX
- Add cost estimation
- Mobile responsive layout

**Success Criteria:**
- Time to first product: <1 day (currently 3-4 days without backend)
- Quality rule setup: <10 minutes (currently 30+ minutes)
- Deployment success rate: >95%

---

#### `/discover` - Data Product Marketplace

**Route:** `/app/(main)/discover/page.tsx`

**Purpose:** Discover existing data products via semantic search and browsing

**Target Personas:**
- 🟢 Data Analyst (Primary - 5-10 searches/day)
- 🟢 Data Scientist (Primary - 3-5 searches/day)
- 🟡 Data Engineer (Secondary - 2-3 searches/day)

**Completeness:** 🟡 **FUNCTIONAL** (Mock data, no backend)

**Alignment Score:** 5/10 ⚠️ **NEEDS IMPROVEMENT**

**Key Features Present:**
- ✅ Product cards with Foundation/Domain/Solution taxonomy
- ✅ Category filters (domain, technical type)
- ✅ Search bar (text-based)
- ✅ Product detail modal
- ✅ Usage analytics display
- ✅ Quality scores
- ✅ Rating/review system

**Gaps Identified:**

1. **Natural Language Search NOT Implemented** 🔴 **CRITICAL**
   - UI has search bar but it's just text filter on title
   - Backend NLP-to-SQL service exists but not connected
   - **Blocks:** Data Analyst self-service (80% promise)
   - **Impact:** High - This is THE key feature for analysts

2. **Data Profiling Integration Missing** 🔴 **CRITICAL**
   - YData profiling service exists (`lib/services/data-profiling.ts`)
   - Product cards show quality scores but no profiling reports
   - **Blocks:** Data Scientist feature discovery workflow
   - **Impact:** High - Can't evaluate feature distributions

3. **Sample Data Preview Missing** 🟡
   - Product detail modal shows metadata only
   - No sample rows
   - **Impact:** Medium - Users request access blind

4. **Lineage Not Shown** 🟡
   - Product cards don't show upstream/downstream
   - Lineage service exists but not integrated
   - **Impact:** Medium - Users don't understand dependencies

5. **Access Request Workflow Incomplete** 🟡
   - "Request Access" button exists but does nothing
   - Backend governance service has approval workflow
   - **Impact:** Medium - Manual access requests slow down

**UX Issues:**

1. **Search Results Not Ranked**
   - Products shown in arbitrary order
   - No relevance scoring
   - **Recommendation:** Implement search ranking (usage, quality, recency)

2. **Filters Too Basic**
   - Can filter by domain, but not:
     - Data freshness (real-time vs batch)
     - Quality threshold (>90%)
     - Owner/team
     - Certification level
   - **Recommendation:** Advanced filter panel

3. **Product Cards Information Dense**
   - Too much info crammed into small card
   - Hard to scan quickly
   - **Recommendation:** Progressive disclosure (expand on hover)

4. **No "Similar Products" Recommendations**
   - Product detail doesn't suggest related products
   - **Recommendation:** Add "Others also used..." section

5. **Mobile Layout Broken**
   - Grid doesn't adapt to small screens
   - Cards truncated
   - **Recommendation:** Stack cards vertically on mobile

**Backend Integration Status:**
- ❌ Natural language search: Service exists, not connected
- ❌ Profiling reports: Service exists, not connected
- ❌ Sample data: No backend endpoint
- ❌ Lineage: Service exists, not connected
- ❌ Access requests: Governance service exists, not connected

**Recommendations:**

**Priority 1 (Critical) - Blocks Analyst Self-Service:**
1. **Connect Natural Language Search**
   - Wire up `SemanticSearchBar` component to backend NLP service
   - Implement query-to-SQL translation
   - Show generated SQL to users ("Here's what I found...")
   - **Effort:** 2-3 days
   - **Impact:** Unlocks 80% analyst self-service

2. **Integrate YData Profiling**
   - Add "View Profile" button to product cards
   - Fetch profiling report from backend
   - Display distributions, correlations, missing values
   - **Effort:** 1-2 days
   - **Impact:** Enables data scientist feature discovery

**Priority 2 (High Value):**
3. **Add Sample Data Preview**
   - Create backend endpoint `/api/v1/products/{id}/sample`
   - Show first 10 rows in product detail modal
   - **Effort:** 1 day
   - **Impact:** Reduces blind access requests

4. **Implement Access Request Workflow**
   - Connect to governance service approval API
   - Email notifications to approvers
   - Track request status
   - **Effort:** 2 days
   - **Impact:** Reduces manual coordination

**Priority 3 (Polish):**
5. Improve search ranking
6. Add advanced filters
7. Optimize product card design
8. Mobile responsive layout

**Success Criteria:**
- Natural language search working: 90% accuracy
- Time to find data: 30 mins → 2 hours (90% reduction)
- Self-service rate: 30% → 80%
- Access request time: 3 days → 4 hours

---

#### `/operations` - Pipeline Monitoring

**Route:** `/app/(main)/operations/page.tsx`

**Purpose:** Real-time pipeline monitoring and incident response

**Target Personas:**
- 🟢 Senior Data Engineer (Primary - checked hourly)
- 🟢 Data Engineer (Secondary - checked 3-5x/day)
- 🟡 Product Manager (Secondary - daily dashboard view)

**Completeness:** 🟡 **FUNCTIONAL** (Mock data, basic features)

**Alignment Score:** 6/10 ⚠️ **NEEDS IMPROVEMENT**

**Key Features Present:**
- ✅ Pipeline status table (running, failed, scheduled, paused)
- ✅ Hierarchical view (domain → pipeline → task)
- ✅ Status indicators with color coding
- ✅ Quick actions (retry, skip, pause)
- ✅ Search and filters
- ✅ Detail sheets (logs, metrics)
- ✅ Alert aggregation concept

**Gaps Identified:**

1. **Debug Agent Integration Missing** 🔴 **CRITICAL**
   - Backend CrewAI Debug Agent service exists
   - No "Analyze with AI" button on failed pipelines
   - **Blocks:** 85% MTTR reduction promise
   - **Impact:** CRITICAL - This is the #1 Sr. DE workflow
   - **Current MTTR:** 2-4 hours (manual)
   - **Target MTTR:** 15 minutes (with agent)

2. **Lineage Tracing Not Integrated** 🔴 **CRITICAL**
   - Cannot trace failure backwards to root cause
   - Lineage service exists but not connected
   - **Blocks:** Impact analysis ("what's downstream?")
   - **Impact:** High - Blind fixes may break other pipelines

3. **No Real-Time Updates** 🟡
   - Page requires manual refresh
   - Should have WebSocket updates or polling
   - **Impact:** Medium - Delayed incident detection

4. **Alert Aggregation Mocked** 🟡
   - Shows "alert aggregation from Airflow, Datadog"
   - Not actually connected to external systems
   - **Impact:** Medium - Manual alert checking required

5. **Historical Analysis Missing** 🟡
   - Cannot view past failures for same pipeline
   - Pattern matching impossible
   - **Impact:** Medium - Repeated debugging of same issues

**UX Issues:**

1. **Detail Sheet Too Generic**
   - Same sheet for all pipeline types
   - Doesn't adapt to failure context
   - **Recommendation:** Context-aware detail panels
     - For Spark failures: Memory/executor details
     - For Trino failures: Query plan
     - For Airflow failures: Task logs

2. **Quick Actions Not Contextual**
   - "Retry" button shows for all failures
   - Some failures shouldn't be retried (config errors)
   - **Recommendation:** Agent suggests best action

3. **No Prioritization**
   - All failures shown equally
   - Should prioritize by:
     - Downstream impact (lineage-based)
     - SLA risk
     - User count affected
   - **Recommendation:** AI-powered prioritization

4. **Filters Hidden**
   - Filter panel not prominent
   - Hard to filter by environment (prod/staging)
   - **Recommendation:** Always-visible filter chips

5. **Mobile Useless**
   - Table doesn't fit mobile screens
   - No mobile-optimized layout
   - **Recommendation:** Card-based mobile view

**Backend Integration Status:**
- ⏳ Pipeline status: Partially mocked (Airflow integration exists but not used)
- ❌ Debug Agent: Service exists, zero integration
- ❌ Lineage tracing: Service exists, zero integration
- ❌ Alert aggregation: Mocked
- ❌ Historical data: No persistence

**Recommendations:**

**Priority 1 (Critical) - Enables Sr. DE Primary Workflow:**

1. **Integrate Debug Agent** ⭐ **HIGHEST ROI**
   - Add "Analyze Failure" button to failed pipeline rows
   - Show loading state while agent runs (1-2 mins)
   - Display agent output:
     - Root cause (with confidence %)
     - Contributing factors
     - Recommended fix
     - Similar past incidents
   - One-click "Apply Fix" action
   - **Effort:** 3-4 days
   - **Impact:** MASSIVE - Unlocks 85% MTTR reduction
   - **Code exists:** `backend/services/crew_intelligence.py` (Debug Agent)

2. **Add Lineage Tracing**
   - "Show Impact" button shows downstream dependencies
   - Highlight affected pipelines/consumers in red
   - Calculate user impact count
   - **Effort:** 2 days
   - **Impact:** High - Prevents cascading failures
   - **Code exists:** `lib/services/lineage-integration.ts`

**Priority 2 (High Value):**

3. **Real-Time Updates**
   - WebSocket connection to backend
   - Toast notifications for new failures
   - Auto-refresh pipeline status
   - **Effort:** 2-3 days
   - **Impact:** Medium - Faster incident detection

4. **Connect to Airflow API**
   - Replace mock data with real Airflow status
   - Fetch logs from Airflow
   - **Effort:** 1-2 days
   - **Impact:** Medium - Production readiness

**Priority 3 (Polish):**
5. Context-aware detail sheets
6. AI-powered prioritization
7. Historical failure analysis
8. Mobile responsive design

**Success Criteria:**
- MTTR: 2 hours → 15 minutes (85% reduction)
- Context switches: 15 → 4 (60% reduction)
- Proactive detection: 40% → 80%
- Agent usage: >90% of failures analyzed by AI first

---

#### `/govern` - Governance Dashboard

**Route:** `/app/(main)/govern/page.tsx`

**Purpose:** Policy compliance, SLO tracking, governance automation

**Target Personas:**
- 🟢 Product Manager (Primary - daily monitoring)
- 🟡 Senior DE (Secondary - weekly review)
- 🟡 Data Engineer (Secondary - per deployment)

**Completeness:** 🔴 **PLACEHOLDER** (Mock data, no backend)

**Alignment Score:** 3/10 🔴 **POOR - Critical Gap**

**Key Features Present:**
- ⚠️ Data product marketplace UI (wrong page!)
- ⚠️ Access request management (wrong focus!)
- ❌ No policy violation dashboard
- ❌ No SLO compliance tracking
- ❌ No OPA/Ranger integration

**THE PROBLEM:** This page is misnamed and misfocused!

Current `/govern/page.tsx` is actually a data product sharing/marketplace page. It should be the **governance control center** for Product Managers.

**What's Missing (Entire Page):**

1. **Policy Violation Dashboard** 🔴 **CRITICAL**
   - OPA policy violations from deployments
   - Severity-ranked list
   - Agent recommendations for remediation
   - Waiver workflow
   - **Backend exists:** `backend/services/opa_policy_engine.py`
   - **Backend exists:** `backend/api/governance_routes.py`
   - **Frontend:** NONE

2. **SLO Compliance Tracking** 🔴 **CRITICAL**
   - Portfolio-wide SLO dashboard
   - Green/yellow/red indicators per product
   - Trend charts (30-day)
   - Alert config
   - **Backend exists:** `backend/models/governance.py` (SLO tables)
   - **Frontend:** NONE

3. **Data Classification Management** 🔴 **CRITICAL**
   - PII field tracking
   - Masking policy status
   - Compliance reports (GDPR, HIPAA)
   - **Backend exists:** Ranger policy generator
   - **Frontend:** NONE

4. **Audit Logs** 🟡
   - Who accessed what data
   - Policy changes
   - Approval history
   - **Backend exists:** Governance service
   - **Frontend:** NONE

5. **Change Impact Analysis** 🟡
   - Pending changes with lineage impact
   - Approval queue
   - Risk scoring
   - **Backend partially exists**
   - **Frontend:** NONE

**UX Issues:**
- **Page Title:** "Govern & Share" is confusing
- **Content:** 80% focused on data product marketplace (belongs in `/discover`)
- **Navigation:** Users looking for governance controls find marketplace instead

**Recommendations:**

**URGENT - Complete Redesign Required:**

This page needs to be **completely rebuilt** to match its stated purpose.

**New `/govern` Structure:**

```
Governance Dashboard
├── Hero: Portfolio Health Score (OPA consensus)
├── Section 1: Active Policy Violations (top 10, severity-ranked)
│   ├── Critical violations (red cards)
│   ├── Warning violations (yellow cards)
│   └── Agent recommendations
├── Section 2: SLO Compliance
│   ├── Portfolio-wide compliance % (gauge chart)
│   ├── Per-product SLO status table
│   └── Trend charts
├── Section 3: Data Classification
│   ├── PII field count
│   ├── Masking coverage %
│   ├── Compliance gaps
├── Section 4: Approval Queue
│   ├── Pending policy waivers
│   ├── Access requests
│   └── Change approvals
└── Section 5: Audit Activity
    ├── Recent policy changes
    ├── Access logs
    └── Deployment history
```

**Move Current Content:**
- Data product marketplace → `/discover` (already exists)
- Access request management → `/govern/access-requests` (new sub-page)

**Effort Estimate:** 5-7 days (full rebuild)

**Priority:** 🔴 **CRITICAL** - Blocks Product Manager daily workflow

**Backend Integration:**
- Connect to `/api/v1/governance/*` endpoints (exist)
- Integrate OPA policy engine
- Show Ranger policy status
- Real-time violation alerts

**Success Criteria:**
- Product Manager can view governance health in <30 seconds
- Policy violations visible immediately
- SLO compliance tracked automatically
- Audit-ready in <1 day (vs. 2 weeks)

---

### Category 2: SOURCE MANAGEMENT

---

#### `/manage/connections` - Source Connections Landing

**Route:** `/app/(main)/manage/connections/page.tsx`

**Purpose:** View and manage all data source connections

**Target Personas:**
- 🟢 Senior DE (Primary - 1-2 new sources/month)
- 🟡 Data Engineer (Secondary - add tables from existing)

**Completeness:** 🟢 **PRODUCTION READY**

**Alignment Score:** 8/10 ⭐ **GOOD**

**Key Features Present:**
- ✅ Connection list table with status
- ✅ Search and filters (status, type, owner)
- ✅ Connection detail panel
- ✅ Quick actions (edit, test, pause, delete)
- ✅ "Add Source" prominent CTA
- ✅ LocalStorage persistence
- ✅ Method badges (federated, CDC, etc.)
- ✅ Table count per connection

**Gaps Identified:**

1. **No Health Monitoring** 🟡
   - Connections show status but no health metrics
   - Should show:
     - Last successful sync
     - Error rate (last 24h)
     - Query volume trends
   - **Impact:** Medium - Proactive issue detection

2. **No Cost Tracking** 🟡
   - Cannot see infrastructure cost per connection
   - Should show monthly cost estimate
   - **Impact:** Medium - Cost optimization blind

3. **Missing Table-Level Details** 🟡
   - Connection detail shows table count but not breakdown
   - Cannot see ingestion method per table
   - **Impact:** Medium - Hard to audit configuration

**UX Issues:**

1. **Filter Panel Too Small**
   - Filters hidden in small panel
   - Should be always-visible chips
   - **Recommendation:** Sticky filter bar

2. **Connection Card Overload**
   - Too much info in table row
   - Hard to scan quickly
   - **Recommendation:** Hide secondary info, show on hover

3. **No Bulk Operations**
   - Cannot select multiple connections
   - Should support bulk pause/delete
   - **Recommendation:** Add checkbox column

**Backend Integration Status:**
- ✅ LocalStorage CRUD (works for demo)
- ⏳ Backend API (`/api/v1/sources/*`) exists but not connected
- ⏳ Health monitoring: Backend service exists
- ❌ Cost tracking: No backend service

**Recommendations:**

**Priority 1 (High Value):**
1. **Add Health Metrics**
   - Show connection health score (0-100)
   - Display last sync time
   - Error rate indicator
   - **Effort:** 1 day

2. **Connect to Backend API**
   - Replace LocalStorage with real API calls
   - Enable multi-user collaboration
   - **Effort:** 2 days

**Priority 2 (Polish):**
3. Improve filter UX
4. Add bulk operations
5. Cost tracking (requires backend service)

**Success Criteria:**
- Connection health visible at a glance
- Proactive issue detection (before failures)
- Multi-user coordination (backend-backed)

---

#### `/manage/connections/new` - Add Source Wizard

**Route:** `/app/(main)/manage/connections/new/page.tsx`

**Purpose:** Select connector type to add new source

**Target Personas:**
- 🟢 Senior DE (Primary - strategic sources)
- 🟡 Data Engineer (Secondary - ad-hoc sources)

**Completeness:** 🟡 **FUNCTIONAL**

**Alignment Score:** 7/10 ⭐ **GOOD**

**Key Features Present:**
- ✅ 18 connector type cards
- ✅ Category filtering (JDBC, Cloud, Lakehouse, Streaming)
- ✅ Connector prerequisites display
- ✅ Search connector by name
- ✅ Routing to connector-specific wizard

**Gaps Identified:**

1. **No Unified Connection Wizard** 🔴 **CRITICAL**
   - Routes to `/federated` or `/lakehouse` (deprecated paths)
   - Should route to `/connect?type={connector}` (unified wizard)
   - **Impact:** High - Breaks unified ingestion strategy
   - **Documented in:** `IMPLEMENTATION_STATUS.md` as incomplete

2. **No Connector Recommendations** 🟡
   - All 18 connectors shown equally
   - Should suggest based on:
     - Team's existing sources
     - Common use cases
   - **Impact:** Medium - Choice paralysis

3. **Prerequisites Too Technical** 🟡
   - Shows technical requirements
   - Should show business value ("Why connect Salesforce?")
   - **Impact:** Low - Clarity

**UX Issues:**

1. **Card Grid Hard to Scan**
   - 18 cards at once
   - No visual hierarchy
   - **Recommendation:** Popular connectors first, "Show More" toggle

2. **Category Filters Not Sticky**
   - Click category → scrolls down → category lost
   - **Recommendation:** Sticky category bar

**Backend Integration Status:**
- ✅ Frontend only (acceptable)
- ⏳ Routing needs fix (point to unified wizard)

**Recommendations:**

**Priority 1 (Critical):**
1. **Fix Routing to Unified Wizard**
   - Update routes from `/federated`, `/lakehouse` to `/connect?type=`
   - **Effort:** 1 hour
   - **Impact:** Unblocks unified flow

**Priority 2 (Polish):**
2. Add connector recommendations
3. Improve card grid UX
4. Business value copy

**Success Criteria:**
- All connectors route to unified wizard
- Users select correct connector in <2 minutes

---

#### `/manage/connections/new/connect` - Unified Connection Wizard

**Route:** `/app/(main)/manage/connections/new/connect/page.tsx`

**Purpose:** 4-step wizard to connect new source with table-level ingestion config

**Target Personas:**
- 🟢 Senior DE (Primary - architecture decisions)

**Completeness:** 🔴 **STUB** (Framework only, steps not built)

**Alignment Score:** 2/10 🔴 **POOR - Critical Gap**

**What Exists:**
- ✅ 4-step framework
- ✅ Query parameter handling (`?type=postgres`)
- ✅ Stepper UI
- ⚠️ No step components built

**What's Missing (Everything):**

**Step 1: Connection Details** ❌
- Database connection form
- Secret reference selector
- Test connection button
- **Component:** `ConnectionStep.tsx` (doesn't exist)

**Step 2: Table Browser** ❌
- Table list with metadata (rows, size, columns)
- Schema grouping
- Multi-select
- **Smart recommendations** per table (key differentiator!)
- **Component:** `TableBrowserStep.tsx` (doesn't exist)

**Step 3: Ingestion Configuration** ❌
- Per-table ingestion method selector:
  - Federated (Trino-only)
  - Incremental Query (timestamp-based)
  - Batch CDC (Debezium, no Kafka)
  - Streaming CDC (full pipeline)
- Method-specific config forms
- **Component:** `IngestionConfigStep.tsx` (doesn't exist)

**Step 4: Deployment Review** ❌
- Infrastructure requirements summary
- Cost estimation
- Deployment artifacts preview
- Deploy button
- **Component:** `DeploymentReviewStep.tsx` (doesn't exist)

**Recommendations:**

**URGENT - Core Feature Incomplete:**

This wizard is **critical infrastructure** for the unified ingestion strategy. It's documented as "Phase 2 in progress" but nothing is built beyond the shell.

**Priority 1 (Blocking):**

Build all 4 step components (documented in `IMPLEMENTATION_STATUS.md` Phase 2):

1. **ConnectionStep.tsx** (2 days)
   - Form with connection params
   - Secret management UI
   - Test connection logic
   - Error handling

2. **TableBrowserStep.tsx** (3 days) ⭐ **Most Complex**
   - Fetch tables from source via backend
   - Display table metadata (rows, columns, size, last updated)
   - Schema grouping UI
   - Multi-select with checkboxes
   - **Smart recommendations** (AI-powered):
     - Analyze table characteristics
     - Suggest optimal ingestion method
     - Show confidence % and reasoning
   - Quick method selector per table

3. **IngestionConfigStep.tsx** (2 days)
   - 4 method-specific forms
   - Validation logic
   - Bulk edit capability

4. **DeploymentReviewStep.tsx** (1 day)
   - Summary view
   - Infrastructure grouping
   - Cost calculator
   - Deploy button → backend API

**Effort Total:** 8-10 days

**Backend Integration:**
- `/api/v1/sources/connect` (test connection)
- `/api/v1/sources/analyze-tables` (table metadata)
- `/api/v1/sources/recommend-method` (AI recommendations)
- `/api/v1/sources/deploy` (final deployment)

Backend services exist but need frontend integration.

**Success Criteria:**
- Full wizard flow working end-to-end
- Table-level ingestion method selection
- Smart recommendations accuracy >80%
- Time to connect source: 4 hours → 1 hour

---

### Category 3: DUPLICATE & DEPRECATED ROUTES

**Problem:** Navigation confusion from route proliferation

---

#### DUPLICATE: Overview Pages (2 versions)

**Routes:**
- `/app/(main)/page.tsx` - Old overview
- `/app/(main)/overview/page.tsx` - New overview with AI consensus

**Problem:**
- Two landing pages with similar content
- `/page.tsx` shows old design (basic metrics)
- `/overview/page.tsx` shows new design (AI consensus, better)
- Users confused which is "home"

**Recommendation:**
- **DELETE:** `/app/(main)/page.tsx`
- **REDIRECT:** `/` → `/overview`
- Make `/overview` the canonical landing page
- Update all nav links

**Effort:** 30 minutes

---

#### DEPRECATED: Old Build Flow Pages (10+ routes)

**Routes Under `/build/*`:**
- `/build/[domainId]/page.tsx`
- `/build/[domainId]/new/page.tsx`
- `/build/customer/page.tsx`
- `/build/domain/context/page.tsx`
- `/build/projects/page.tsx`
- `/build/requests/page.tsx`
- `/build/patterns/page.tsx`
- `/build/composable/*` (4 routes)
- `/build/foundation/*` (4 routes)

**Problem:**
- These were experimental/alternative build flows
- Main `/build/page.tsx` (6-step) is the canonical flow
- Old routes confuse users
- Maintenance burden (need to update 10+ pages for changes)

**Recommendation:**
- **ARCHIVE:** Move to `/archive/build-experiments/`
- **REDIRECT:** All old routes → `/build`
- **KEEP:** Only `/build/page.tsx` and `/build/test-conversation` (for testing)

**Effort:** 1 hour

---

#### DEPRECATED: Old Pipeline Pages (5 routes)

**Routes:**
- `/pipelines/page.tsx`
- `/pipelines/create/page.tsx`
- `/pipelines/remix/page.tsx`
- `/pipelines/templates/page.tsx`
- `/pipelines/library/page.tsx`

**Problem:**
- Duplicate functionality with `/operations` and `/build`
- Old Airflow-centric UI (not aligned with data product focus)
- Confusing overlap

**Recommendation:**
- **DELETE:** All `/pipelines/*` routes
- **REDIRECT:**
  - `/pipelines` → `/operations` (monitoring)
  - `/pipelines/create` → `/build` (creation)
  - `/pipelines/templates` → `/build` with template picker

**Effort:** 1 hour

---

#### DEPRECATED: Old Develop Pages (5 routes)

**Routes:**
- `/develop/page.tsx`
- `/develop/queries/page.tsx`
- `/develop/pipelines/page.tsx`
- `/develop/pipelines/studio/page.tsx`
- `/develop/data-products/page.tsx`
- `/develop/integrations/page.tsx`

**Problem:**
- Early prototype of development environment
- Superseded by `/build` and `/operations`
- No unique value

**Recommendation:**
- **DELETE:** All `/develop/*` routes
- **REDIRECT:** `/develop` → `/build`

**Effort:** 30 minutes

---

#### TEST/DEMO Pages (7 routes)

**Routes:**
- `/test-consensus/page.tsx`
- `/test-crews/page.tsx`
- `/demo-enhanced/page.tsx`
- `/build/test-conversation/page.tsx`
- `/crews/page.tsx`
- `/studio/page.tsx`
- `/workstation/page.tsx`

**Problem:**
- Test pages leaking into production
- Users clicking these in nav

**Recommendation:**
- **MOVE:** To `/dev/*` prefix (only visible in dev mode)
- **OR DELETE:** If no longer needed

**Effort:** 30 minutes

---

#### MONITOR vs OPERATIONS Overlap

**Routes:**
- `/operations/page.tsx` - New monitoring (better)
- `/monitor/page.tsx` - Old monitoring
- `/monitor/pipelines/page.tsx` - Duplicate
- `/monitor/connections/page.tsx` - Belongs in `/manage`

**Problem:**
- Two monitoring interfaces
- Users confused which to use

**Recommendation:**
- **DELETE:** All `/monitor/*` routes
- **REDIRECT:** `/monitor` → `/operations`
- **MOVE:** `/monitor/connections` → `/manage/connections` (health tab)

**Effort:** 1 hour

---

### Category 4: MISSING PAGES

**Critical gaps in user journeys**

---

#### Missing: `/profile` - User Profile & Preferences

**Problem:**
- No user profile page
- Cannot set:
  - Notification preferences
  - Default filters
  - UI theme
  - API keys

**Recommendation:**
- Create `/profile/page.tsx`
- Sections:
  - Personal info
  - Notification settings
  - Preferences (default domain, theme)
  - API key management
  - Activity history

**Effort:** 2 days

---

#### Missing: `/help` - In-App Documentation

**Problem:**
- No help/docs accessible in app
- Users leave platform to read GitHub docs
- Context lost

**Recommendation:**
- Create `/help/page.tsx`
- Sections:
  - Getting started
  - Feature guides (Build, Discover, Operations)
  - Video tutorials
  - Keyboard shortcuts
  - FAQ
  - Support contact

**Effort:** 1-2 days (content creation)

---

#### Missing: `/settings` - System Configuration

**Problem:**
- `/configure` page exists but incomplete
- Cannot configure:
  - Integrations (Airflow, Trino, Ranger URLs)
  - Notification channels
  - Team settings
  - Billing

**Recommendation:**
- Enhance `/configure/page.tsx`
- Add tabs:
  - Integrations
  - Notifications
  - Team
  - Billing
  - Security

**Effort:** 3-4 days

---

#### Missing: `/quality` - Quality Dashboard

**Problem:**
- Quality mentioned everywhere but no central dashboard
- Cannot see:
  - Portfolio-wide quality score
  - Failing quality checks
  - Quality trends

**Note:** `/quality/page.tsx` exists but is placeholder

**Recommendation:**
- Build proper quality dashboard
- Show:
  - Average quality score (gauge)
  - Failing checks (table)
  - Quality by domain (chart)
  - Recent quality incidents
  - Top quality issues

**Effort:** 2-3 days

---

### Category 5: NAVIGATION & INFORMATION ARCHITECTURE

**Current Navigation Problems:**

---

#### Problem 1: No Persona-Based Navigation

**Current Navigation** (in `Navigation.tsx`):
- Build
- Discover
- Operations
- Govern
- Manage
- Tools
- (+ 20 other miscellaneous links)

**Issues:**
- Not optimized for any persona
- Missing key workflows
- Too many low-value links

**Recommendation: Persona-Adaptive Navigation**

**For Data Engineer:**
```
Primary:
- Build (most used)
- Discover (find sources)
- Operations (monitor own pipelines)
- Quality (check own products)

Secondary:
- Manage > Sources
- Help

Hidden: (accessible via search)
- Govern, Tools, Configure
```

**For Senior Data Engineer:**
```
Primary:
- Operations (hourly checks)
- Build (strategic products)
- Manage > Sources (new connections)
- Quality (team oversight)

Secondary:
- Govern > Violations
- Discover
- Help

Hidden:
- Configure, Tools
```

**For Data Analyst:**
```
Primary:
- Discover (main workflow!)
- Query (ad-hoc SQL)
- Dashboards (consume products)

Secondary:
- Help
- Profile

Hidden: (no access needed)
- Build, Operations, Manage, Govern
```

**For Product Manager:**
```
Primary:
- Govern (daily monitoring)
- Quality (portfolio health)
- Operations (SLO tracking)
- Discover (portfolio catalog)

Secondary:
- Manage > Users
- Settings

Hidden:
- Build, Query, Tools
```

**Implementation:**
1. Create `NavigationConfig` per persona
2. Read user role from auth context
3. Render appropriate nav
4. Add "All Pages" search (Cmd+K)

**Effort:** 2-3 days

---

#### Problem 2: Too Many Top-Level Routes

**Current:** 30+ top-level nav items

**Recommendation: Consolidate to 7 Core:**

1. **Overview** - Landing page
2. **Build** - Create data products
3. **Discover** - Find data products
4. **Operations** - Monitor pipelines
5. **Govern** - Compliance & quality
6. **Manage** - Sources, users, settings
7. **Help** - Documentation

**Everything else** → Sub-pages or search

**Effort:** 1 day (update Navigation component)

---

#### Problem 3: No Contextual Navigation

**Issue:**
- All pages have same nav
- Cannot navigate within a context (e.g., drill down on a pipeline)

**Recommendation: Breadcrumb Navigation**

Example: `/operations/customer_churn_pipeline/task/spark_transform`

Breadcrumb:
```
Operations > Customer Domain > customer_churn_pipeline > Task: spark_transform
           ↑ click to see all     ↑ click to see pipeline    ↑ current
```

**Effort:** 1-2 days

---

### Category 6: CROSS-CUTTING ISSUES

---

#### Issue 1: No Global State Management

**Problem:**
- Every page is stateless
- Lose context when navigating
- Example:
  - Select sources in `/discover`
  - Go to `/build`
  - Sources selection lost

**Impact:**
- Breaks 60% context switch reduction promise
- User frustration ("why do I have to re-select everything?")

**Recommendation:**
- Implement Zustand or Context API
- Persist:
  - Selected sources
  - Active pipeline
  - Search queries
  - Filter states
- Store in sessionStorage

**Effort:** 2-3 days

---

#### Issue 2: Inconsistent Design Patterns

**Problems Found:**

1. **Button Variants**
   - Some pages use `variant="default"`
   - Others use `variant="primary"`
   - Inconsistent styling

2. **Card Styles**
   - Mix of shadcn Card and custom Card
   - Different padding/spacing

3. **Table Components**
   - Some use shadcn Table
   - Others use custom tables
   - Inconsistent row heights

4. **Modal/Sheet Usage**
   - Some use Sheet (slide-over)
   - Others use Dialog (centered modal)
   - No clear pattern for when to use which

**Recommendation:**
- Create design system doc
- Standardize on one component library (shadcn/ui)
- Add Storybook for consistency

**Effort:** 1 week (audit + fixes)

---

#### Issue 3: No Loading States

**Problem:**
- Most pages don't show loading indicators
- Appear broken when fetching data
- No skeleton screens

**Recommendation:**
- Add Suspense boundaries
- Skeleton screens for tables/cards
- Loading spinners for actions

**Effort:** 2 days

---

#### Issue 4: No Error Handling

**Problem:**
- API errors not caught
- No user-friendly error messages
- Console errors instead of UI feedback

**Recommendation:**
- Error boundary components
- Toast notifications for errors
- Retry mechanisms

**Effort:** 2 days

---

#### Issue 5: No Keyboard Navigation

**Problem:**
- Entirely mouse-driven
- No keyboard shortcuts
- Poor accessibility

**Recommendation:**
- Implement shortcuts:
  - Cmd+K: Global search
  - Cmd+B: Go to Build
  - Cmd+D: Go to Discover
  - Cmd+O: Go to Operations
  - Cmd+/: Help
  - Esc: Close modals

**Effort:** 1-2 days

---

#### Issue 6: No Mobile Support

**Problem:**
- Platform assumes desktop
- Tables break on mobile
- No responsive layouts

**Recommendation:**
- Decide: Desktop-only or responsive?
- If responsive needed: 2-3 weeks of work
- If desktop-only: Add "Desktop required" message on mobile

**Effort:**
- Desktop-only message: 1 hour
- Full responsive: 2-3 weeks

---

## Prioritized Remediation Roadmap

### Phase 1: CRITICAL FIXES (Unblock Core Workflows)

**Duration:** 2-3 weeks
**Effort:** ~80 hours

**Priority Rank:**

| # | Item | Effort | Impact | Personas Unblocked |
|---|------|--------|--------|--------------------|
| 1 | **Integrate Debug Agent in Operations** | 3 days | MASSIVE | Senior DE (primary workflow) |
| 2 | **Rebuild /govern Page** | 5 days | CRITICAL | Product Manager (daily workflow) |
| 3 | **Connect Natural Language Search in Discover** | 2 days | CRITICAL | Data Analyst (self-service) |
| 4 | **Build Unified Connection Wizard Steps** | 8 days | CRITICAL | Senior DE (source management) |
| 5 | **Fix Backend Deployment in Build Flow** | 2 days | HIGH | Data Engineer (PR creation) |
| 6 | **Add Lineage to Operations** | 2 days | HIGH | Senior DE, Data Engineer |
| 7 | **Integrate Profiling in Discover** | 1 day | HIGH | Data Scientist |

**ROI:**
- MTTR reduction: 85% (2 hrs → 15 min) via Debug Agent
- Analyst self-service: 30% → 80% via NLP search
- Governance visibility: 40% → 95% via /govern rebuild
- Source connection time: 4 hrs → 1 hr via unified wizard

---

### Phase 2: HIGH-VALUE IMPROVEMENTS

**Duration:** 2-3 weeks
**Effort:** ~60 hours

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 8 | Persona-Based Navigation | 2 days | High - Reduces confusion |
| 9 | Global State Management | 2 days | High - Context preservation |
| 10 | Real-Time Updates in Operations | 2 days | Medium - Faster detection |
| 11 | Connect to Airflow API | 1 day | Medium - Real data |
| 12 | Access Request Workflow in Discover | 2 days | Medium - Automation |
| 13 | Health Monitoring in Manage/Sources | 1 day | Medium - Proactive |
| 14 | Quality Dashboard Build-Out | 2 days | Medium - Visibility |
| 15 | Delete Deprecated Routes (10+) | 2 days | Low effort, high clarity |

---

### Phase 3: POLISH & OPTIMIZATION

**Duration:** 2 weeks
**Effort:** ~40 hours

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 16 | Design System Standardization | 3 days | Medium - Consistency |
| 17 | Keyboard Shortcuts | 1 day | Low - Power users |
| 18 | Loading States & Skeletons | 2 days | Low - Polish |
| 19 | Error Handling & Toasts | 2 days | Low - Robustness |
| 20 | Missing Pages (Profile, Help, Settings) | 3 days | Low - Completeness |
| 21 | Mobile Decision & Implementation | 1 day or 3 weeks | Depends on strategy |

---

## Summary: Platform Readiness by Persona

### Senior Data Engineer: 65% Ready 🟡

**Working:**
- ✅ Source management (good)
- ✅ Build flow (can create products)
- ⚠️ Operations monitoring (basic features only)

**Blocked:**
- ❌ Debug Agent not integrated (CRITICAL - blocks 85% MTTR promise)
- ❌ Lineage tracing missing
- ❌ Real-time monitoring missing

**Time to Production-Ready:** 2 weeks (Phase 1 items 1, 6)

---

### Data Engineer: 75% Ready 🟢

**Working:**
- ✅ Build flow complete (excellent!)
- ✅ Source selection works
- ✅ tiSQL workstation integrated

**Blocked:**
- ❌ Backend deployment (PR creation mocked)
- ⚠️ AI assistance not fully connected
- ⚠️ Quality rules need smarter defaults

**Time to Production-Ready:** 1 week (Phase 1 item 5)

---

### Analytics Engineer: 70% Ready 🟡

**Working:**
- ✅ Build flow works well for them
- ✅ tiSQL with dbt patterns
- ⚠️ Quality monitoring basic

**Blocked:**
- ⚠️ Semantic layer management incomplete
- ⚠️ Quality dashboard placeholder

**Time to Production-Ready:** 2 weeks (Phase 2 items 14)

---

### Data Scientist: 45% Ready 🔴

**Working:**
- ⚠️ Discover exists (but search broken)
- ⚠️ tiSQL can extract data

**Blocked:**
- ❌ Natural language search NOT working (CRITICAL)
- ❌ Profiling reports not integrated (CRITICAL)
- ❌ Sample data preview missing
- ❌ MLflow integration placeholder

**Time to Production-Ready:** 2-3 weeks (Phase 1 items 3, 7)

---

### Data Analyst: 35% Ready 🔴

**Working:**
- ⚠️ Discover UI exists

**Blocked:**
- ❌ Natural language search NOT working (BLOCKS ALL self-service)
- ❌ Pre-built dashboards missing
- ❌ Query templates missing
- ❌ Access request workflow manual

**Time to Production-Ready:** 3-4 weeks (Phase 1 item 3 + Phase 2 items)

---

### Product Manager: 25% Ready 🔴

**Working:**
- ⚠️ Overview page shows basic metrics

**Blocked:**
- ❌ /govern page completely wrong (CRITICAL)
- ❌ Policy violations not visible
- ❌ SLO tracking missing
- ❌ Audit logs missing

**Time to Production-Ready:** 1 week (Phase 1 item 2)

---

## Conclusion

### Platform is 55% Ready for Production 🟡

**Strengths:**
1. ✅ Build flow is excellent (9/10)
2. ✅ Source management solid (8/10)
3. ✅ tiSQL workstation integrated well
4. ✅ 18 connector types supported

**Critical Gaps:**
1. 🔴 Operations lacks Debug Agent integration
2. 🔴 Govern page needs complete rebuild
3. 🔴 Discover missing NLP search backend
4. 🔴 Unified connection wizard incomplete

**Biggest Problem:**
**Navigation confusion from 90+ routes with 30% deprecated/duplicate pages.**

### Recommended Action Plan

**Immediate (Next Sprint):**
1. Integrate Debug Agent into Operations (3 days) - **Highest ROI**
2. Connect NLP search to Discover (2 days) - **Unblocks analysts**
3. Delete deprecated routes (1 day) - **Reduces confusion**

**Short-Term (Next Month):**
4. Rebuild /govern page (5 days)
5. Complete unified connection wizard (8 days)
6. Implement persona-based navigation (2 days)

**Medium-Term (Next Quarter):**
7. Polish and optimization (Phase 3)
8. Mobile strategy decision

### Success Metrics

**After Phase 1 (3 weeks):**
- MTTR: 2 hours → 15 minutes (85% reduction) ✅
- Analyst self-service: 30% → 80% ✅
- Navigation clarity: +60% (route consolidation) ✅
- Product Manager governance visibility: 40% → 95% ✅

**After Phase 2 (6 weeks):**
- All personas 70%+ production-ready
- Context preservation working
- Real-time monitoring live

**After Phase 3 (8 weeks):**
- All personas 90%+ production-ready
- Design system consistent
- Polish complete

---

**Document Version:** 1.0
**Last Updated:** October 8, 2025
**Next Review:** November 1, 2025 (post Phase 1)
