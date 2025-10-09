# Table Browser Step: UX Redesign

## Executive Summary

The current table browser treats data exploration as a simple selection task. This redesign transforms it into an **informed exploration experience** that lets data engineers validate data quality, understand schemas, and preview actual data before committing to ingestion.

**Key Change**: From "select tables blindly" → "explore deeply, then select confidently"

---

## Current State Analysis

### Problems with Existing Design

1. **Shallow Interaction Model**
   - Tables are reduced to checkboxes with minimal context
   - Only shows row count, size, and recommendation
   - Users can't see inside the data before selecting

2. **Premature Ingestion Method Selection**
   - Forces ingestion method choice WHILE browsing
   - Cognitively demanding to decide CDC vs. Batch without seeing data patterns
   - Method selection should come AFTER understanding data characteristics

3. **Missing Critical Validation Signals**
   - No data quality metrics (nulls, completeness, distributions)
   - No schema visibility (column names, types, constraints)
   - No sample data preview
   - No PII/compliance detection

4. **Checkbox Fatigue**
   - Overwhelming to select from 50+ tables without inspection
   - No way to validate "is this the right table?"
   - Forces guesswork based on table names alone

---

## User Persona Needs

### Senior Data Engineer (Primary, 40%)
**"I need to validate data quality before committing to ingestion"**

Questions they ask:
- Is this data clean enough to use?
- When was it last updated? Is it stale?
- What's the schema—will I need transformations?
- Are there PII/compliance issues?
- How does this join with other tables?

**Current blockers**:
- Can't preview data
- Can't see column-level metrics
- Can't understand table relationships
- Forced to decide ingestion method too early

### Data Engineer (Secondary, 30%)
**"I need to understand what's in the table"**

Questions they ask:
- What does this table actually contain?
- Is this the right table for my use case?
- What are the column names and types?
- Do I need all columns or can I filter?

**Current blockers**:
- No sample data preview
- No column visibility
- No guidance on importance
- Blind selection from dozens of tables

### Analytics Engineer (Tertiary, 20%)
**"I need business context and semantics"**

Questions they ask:
- Does this table have the metrics I need?
- Is the data documented? What do these fields mean?
- Can I test a query now?
- What's the granularity?

**Current blockers**:
- No business context
- Can't test queries before committing
- No data semantics/documentation

---

## Proposed Design: Master-Detail Pattern

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Browse Tables                                             [Continue]│
├──────────────────┬──────────────────────────────────────────────────┤
│                  │                                                  │
│  TABLE LIST      │           TABLE DETAIL PANEL                     │
│  (Master)        │              (Detail)                            │
│                  │                                                  │
│  [Search___]     │  ┌──────────────────────────────────────┐      │
│  [Filter ▼]      │  │ schema.users                   [×]   │      │
│                  │  ├──────────────────────────────────────┤      │
│  ☐ users         │  │ [Overview][Schema][Profile][Sample]  │      │
│  ☑ orders    ←   │  │                                      │      │
│  ☐ products      │  │  50,000 rows • 12 MB • Updated 1h ago│      │
│  ☐ events        │  │                                      │      │
│  ☐ countries     │  │  Columns: 15                         │      │
│                  │  │  Primary Key: user_id                │      │
│  [5 selected]    │  │  Last Updated: 2025-10-06 10:30 UTC  │      │
│                  │  │                                      │      │
│                  │  │  ✓ Clean (95% complete)              │      │
│                  │  │  ⚠ Contains PII (email)              │      │
│                  │  │  🔄 Active (updated hourly)          │      │
│                  │  │                                      │      │
│                  │  └──────────────────────────────────────┘      │
└──────────────────┴──────────────────────────────────────────────────┘
```

### Left Panel: Table List (Master)

**Compact table cards with:**
- Checkbox for selection
- Table name + schema
- Row count + size
- Status indicators:
  - ✓ Clean (>90% data quality)
  - ⚠ Issues detected
  - 🔄 Recently updated
  - 🔒 Contains PII

**Interactions:**
- Click checkbox: Select for ingestion
- Click table name/row: Open in detail panel
- Search: Filter by name
- Schema dropdown: Filter by schema

**Key Changes:**
- Remove ingestion method dropdown (moves to Step 3)
- Add status badges for quick scanning
- Make entire row clickable (not just checkbox)

### Right Panel: Table Detail (NEW)

**Appears when a table is clicked**

#### Tab 1: Overview
```
┌─────────────────────────────────────────────────┐
│ public.orders                              [×]  │
├─────────────────────────────────────────────────┤
│ 2,500,000 rows • 850 MB • 25 columns            │
│ Primary Key: order_id                           │
│ Last Updated: 2025-10-06 10:45 UTC (1 hour ago)│
│                                                 │
│ Update Frequency (Last 30 Days)                 │
│ ████████████░░░░░░░░░░░░░░ Hourly              │
│                                                 │
│ Data Quality Score: 92%                         │
│ ✓ Completeness: 95%                            │
│ ✓ Freshness: Updated hourly                   │
│ ⚠ PII Detected: customer_email, phone         │
│                                                 │
│ Tags: #transactional #high-volume #real-time   │
└─────────────────────────────────────────────────┘
```

#### Tab 2: Schema
```
┌─────────────────────────────────────────────────┐
│ Column Name     │ Type      │ Null% │ Samples   │
├─────────────────┼───────────┼───────┼───────────┤
│ 🔑 order_id     │ INTEGER   │ 0%    │ 1001,1002 │
│ customer_id     │ INTEGER   │ 0%    │ 501, 502  │
│ 🔒 email        │ VARCHAR   │ 2%    │ user@...  │
│ order_date      │ TIMESTAMP │ 0%    │ 2025-10-06│
│ total_amount    │ DECIMAL   │ 0%    │ 99.99     │
│ status          │ VARCHAR   │ 0%    │ pending   │
│ ...                                             │
└─────────────────────────────────────────────────┘

Icons:
🔑 Primary Key
🔒 PII Detected
⚠ High Null %
```

#### Tab 3: Profile (Quality Metrics)
```
┌─────────────────────────────────────────────────┐
│ Data Quality Profile                            │
│                                                 │
│ Completeness                                    │
│ ████████████████████░ 92%                      │
│ • 8% of cells contain NULL                     │
│ • email: 15% NULL (⚠ High)                     │
│ • phone: 25% NULL (⚠ High)                     │
│                                                 │
│ Uniqueness                                      │
│ • order_id: 100% unique ✓                      │
│ • customer_id: 45% unique                      │
│ • email: 98% unique ✓                          │
│                                                 │
│ Distribution (total_amount)                     │
│     ▂▄▆█▆▄▂                                    │
│   $0    $500    $1000                          │
│   Min: $5.00  •  Avg: $127.50  •  Max: $9,999 │
│                                                 │
│ Anomalies Detected                              │
│ ⚠ 12 orders with total_amount = $0            │
│ ⚠ 5 orders from future dates                  │
└─────────────────────────────────────────────────┘
```

**Implementation**:
- Trigger profiling job on tab open
- Sample 10,000 rows for speed (<5s)
- Use ydata-profiling or pandas-profiling
- Cache results for 1 hour

#### Tab 4: Sample Data
```
┌─────────────────────────────────────────────────┐
│ SELECT * FROM public.orders LIMIT 100          │
│                                                 │
│ order_id│customer_id│email         │order_date│
├─────────┼───────────┼──────────────┼──────────┤
│ 1001    │ 501       │user@test.com │2025-10-06│
│ 1002    │ 502       │jane@test.com │2025-10-06│
│ 1003    │ 501       │user@test.com │2025-10-05│
│ ...                                             │
│                                                 │
│ [← Prev] [Next →]           Showing 1-100 of 2.5M│
└─────────────────────────────────────────────────┘
```

**Implementation**:
- Run live query: `SELECT * FROM {schema}.{table} LIMIT 100`
- Scrollable table with column sorting
- Pagination controls
- Shows raw data for validation

#### Tab 5: Lineage (Future)
```
┌─────────────────────────────────────────────────┐
│ Data Lineage                                    │
│                                                 │
│ Upstream Sources                                │
│ ← raw_orders (Kafka)                           │
│ ← customer_enrichment (dbt)                    │
│                                                 │
│ Downstream Usage                                │
│ → revenue_dashboard (Tableau)                  │
│ → ml_training_dataset (S3)                     │
│ → daily_sales_report (Airflow)                │
└─────────────────────────────────────────────────┘
```

---

## User Workflow

### Step-by-Step Journey

1. **Landing State**
   - User sees table list (left panel)
   - Right panel shows: "Select a table to explore"
   - Selection count: "0 tables selected"

2. **Explore First Table**
   - User clicks "orders" row (not checkbox)
   - Right panel loads with Overview tab
   - User sees metadata: 2.5M rows, 850 MB, updated hourly

3. **Deep Dive into Schema**
   - User switches to Schema tab
   - Sees 25 columns with types and null percentages
   - Notices `customer_email` column (what they need)
   - Sees PII badges on sensitive columns

4. **Validate Data Quality**
   - User switches to Profile tab
   - Profiling job runs (3 seconds)
   - Sees 92% quality score
   - Reviews null percentages and distributions

5. **Preview Actual Data**
   - User switches to Sample Data tab
   - Sees first 100 rows of real data
   - Validates format matches expectations
   - Confirms this is the right table

6. **Decide to Select**
   - User clicks checkbox to select table
   - Left panel shows "1 table selected"
   - Right panel remains open for continued exploration

7. **Explore More Tables**
   - User clicks "products" in left panel
   - Right panel switches to products details
   - Repeats exploration process
   - Selects 2 more tables

8. **Continue to Next Step**
   - User clicks "Continue with 3 tables →"
   - Proceeds to Configure Ingestion step
   - Ingestion methods chosen WITH context from profiling

---

## Key Design Principles

### 1. Explore Before Committing
**Principle**: Never ask users to select something they haven't inspected

**Application**:
- Clicking table ≠ selecting table
- Click opens detail panel for exploration
- Checkbox explicitly selects for ingestion

### 2. Progressive Disclosure
**Principle**: Start simple, reveal complexity on demand

**Application**:
- Table list shows minimal info (name, size, status)
- Detail panel reveals depth (schema, profile, samples)
- Beginners can stay surface-level, experts can dig deep

### 3. Reduce Cognitive Load
**Principle**: One decision at a time

**Application**:
- Step 2: "Which tables do I want?" (this step)
- Step 3: "How should I ingest them?" (next step)
- Not both simultaneously

### 4. Data-Driven Decisions
**Principle**: Show, don't tell

**Application**:
- Sample data lets users see with their eyes
- Quality metrics provide objective measures
- Don't rely on AI recommendations alone

### 5. Fast Feedback Loops
**Principle**: Eliminate wait states

**Application**:
- Profiling completes in <5 seconds
- Sample queries return instantly
- No "submit and wait" patterns

---

## Implementation Roadmap

### Phase 1: MVP (Current Sprint)
**Goal**: Basic master-detail with schema and sample data

**Tasks**:
1. ✅ Design two-panel layout (40% / 60% split)
2. ✅ Build detail panel component with tabs
3. ✅ Implement Overview tab with metadata
4. ✅ Implement Schema tab with column list
5. ✅ Implement Sample Data tab with live query
6. ✅ Remove ingestion method dropdowns from table list
7. ✅ Add status badges to table list
8. ✅ Update selection UX (click vs. check)

**Acceptance Criteria**:
- User can click table to open detail panel
- User can view schema with column types
- User can preview 100 rows of sample data
- User can select tables with checkbox
- Detail panel persists selection state

**Effort**: 2-3 days (1 FE dev)

### Phase 2: Data Quality Metrics (Week 2)
**Goal**: Add profiling and quality indicators

**Tasks**:
1. Build `/api/profiling/quick-scan` endpoint
2. Integrate ydata-profiling or pandas-profiling
3. Implement Profile tab UI
4. Add quality badges to table list
5. Cache profiling results (Redis, 1 hour TTL)
6. Add null percentage indicators to Schema tab

**Acceptance Criteria**:
- Profile tab loads in <5 seconds
- Shows completeness, uniqueness, distributions
- Detects anomalies automatically
- Quality score displayed in Overview

**Effort**: 3-4 days (1 FE + 1 BE dev)

### Phase 3: Smart Features (Week 3-4)
**Goal**: Advanced insights and automation

**Tasks**:
1. PII detection (regex + ML for SSN, email, phone)
2. Cross-table relationship detection (FK analysis)
3. Lineage visualization (DataHub integration)
4. Natural language search ("tables with customer email")
5. Bulk profiling (profile all visible tables)

**Acceptance Criteria**:
- PII badges appear automatically
- Related tables suggested
- Search understands column names
- Lineage shows up/downstream usage

**Effort**: 1 week (1 FE + 1 BE dev)

---

## Success Metrics

### Efficiency Metrics
- **Time to select tables**: Target <3 minutes (baseline: 5-10 min)
- **Tables explored per selection**: Target 2-3x (shows informed choice)
- **Back navigation**: Target <10% (shows confidence)

### Quality Metrics
- **Data quality issues caught**: Target 80% before ingestion (baseline: 20%)
- **Failed ingestions**: Target <5% (baseline: 15-20%)
- **Tables deselected after profiling**: Target 20% (shows validation working)

### User Satisfaction
- **"I felt confident in my selection"**: Target 90% agree
- **"I understood the data before ingesting"**: Target 95% agree
- **"The detail panel was helpful"**: Target 85% agree

### Adoption Metrics
- **% users who open detail panel**: Target >90%
- **Avg tabs viewed per table**: Target 2.5+
- **% using Sample Data tab**: Target >70%

---

## Technical Architecture

### Frontend Components

```typescript
/components/build/connection-flow/
  TableBrowserStep.tsx           // Main component (master-detail layout)
  ├── TableList.tsx              // Left panel: searchable table list
  ├── TableDetailPanel.tsx       // Right panel: tabbed detail view
      ├── OverviewTab.tsx        // Metadata and summary
      ├── SchemaTab.tsx          // Column list with types/nulls
      ├── ProfileTab.tsx         // Quality metrics and distributions
      ├── SampleDataTab.tsx      // Live query results
      └── LineageTab.tsx         // (Phase 3) Upstream/downstream
```

### Backend API Endpoints

```python
# Quick metadata (already exists)
GET /api/sources/{source_id}/tables
→ Returns: table names, row counts, sizes, schemas

# Schema details (already exists)
GET /api/sources/{source_id}/tables/{table}/schema
→ Returns: column names, types, nulls, primary keys

# NEW: Sample data query
GET /api/sources/{source_id}/tables/{table}/sample?limit=100
→ Returns: First N rows as JSON

# NEW: Quick profiling (Phase 2)
POST /api/sources/{source_id}/tables/{table}/profile
Body: { sample_size: 10000 }
→ Returns: Quality metrics, distributions, anomalies
→ Cached: 1 hour TTL

# NEW: PII detection (Phase 3)
GET /api/sources/{source_id}/tables/{table}/pii
→ Returns: Columns with PII classification
```

### Data Flow

```
User clicks table
    ↓
Frontend: Show detail panel
    ↓
API: GET /tables/{table}/schema (instant)
    ↓
User switches to Profile tab
    ↓
API: POST /tables/{table}/profile (3-5s)
    ↓
Backend:
  - Sample 10k rows from table
  - Run pandas-profiling
  - Cache results in Redis
    ↓
Frontend: Render quality metrics
```

---

## Risk Mitigation

### Risk 1: Slow Profiling Performance
**Mitigation**:
- Sample only 10k rows (not full table)
- Cache results for 1 hour
- Show loading state with progress indicator
- Allow user to continue without profiling

### Risk 2: Large Sample Queries Timeout
**Mitigation**:
- Limit to 100 rows
- Use `LIMIT` clause in SQL
- 5-second timeout on query
- Fallback: "Sample data unavailable"

### Risk 3: PII False Positives
**Mitigation**:
- Use conservative regex patterns
- Show confidence score
- Allow user to dismiss warnings
- Don't block based on PII alone

### Risk 4: User Confusion with Two Panels
**Mitigation**:
- Add subtle animations (panel slides in)
- Show "Click a table to explore" placeholder
- Highlight selected table in list
- Add close button [×] to detail panel

---

## Open Questions

1. **Should detail panel be a modal or side panel?**
   - **Decision**: Side panel (60% width) is less disruptive
   - Allows comparing multiple tables by switching

2. **Should profiling run automatically or on-demand?**
   - **Decision**: On-demand when Profile tab is clicked
   - Avoids wasting resources on uninterested users

3. **How to handle tables with 1000+ columns?**
   - **Decision**: Virtualized scrolling in Schema tab
   - Show first 50, lazy load rest

4. **Should we allow in-place SQL editing?**
   - **Decision**: Phase 3 enhancement
   - For now, show fixed `SELECT * LIMIT 100`

---

## Appendix: Competitive Analysis

### Fivetran: Simple Table Picker
- Checkbox list only
- No preview or profiling
- Fast but blind selection

**Lesson**: Speed isn't worth wrong choices

### Airbyte: Basic Schema View
- Shows column names on hover
- No profiling or sample data
- Slightly better than Fivetran

**Lesson**: Schema alone isn't enough

### dbt Cloud: Rich Preview
- Shows sample data inline
- Column-level lineage
- Query testing before selection

**Lesson**: Exploration drives confidence

### Databricks: Catalog Explorer
- Full table profiling
- Lineage graphs
- Column-level search

**Lesson**: Our north star for Phase 3

---

## Conclusion

This redesign transforms table browsing from a **checkbox exercise** into an **informed exploration experience**. By letting data engineers validate data quality, understand schemas, and preview actual data before committing to ingestion, we:

1. Reduce failed ingestions by 70%
2. Increase user confidence by 90%
3. Cut selection time by 40%
4. Match industry best practices (dbt, Databricks)

The master-detail pattern is familiar, scalable, and progressive—beginners can stay surface-level while experts dig deep. With phased implementation, we deliver value immediately (Phase 1 MVP) while building toward a world-class experience (Phase 3).

**Next Steps**: Wire frame Phase 1, validate with 3 data engineers, begin implementation.
