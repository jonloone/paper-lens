# Step 2: Source Selection - Critical UX Analysis

## Executive Summary

The current source selection interface requires users to click an eye icon to preview schema details, which creates unnecessary friction in the data discovery and exploration process. This analysis proposes a fundamentally different approach based on how data professionals actually work.

---

## Current State Problems

### 1. **Hidden Information Problem**
- Schema details hidden behind a modal dialog
- Requires explicit action (clicking eye icon) to see column structure
- No ability to compare schemas side-by-side
- Context switching between list view and modal breaks flow

### 2. **Cognitive Load Issues**
- Users must remember what they saw in previous previews
- Can't see schema while considering other tables
- No visual comparison of table structures
- Forces sequential exploration rather than parallel evaluation

### 3. **Wrong Mental Model**
- Current UI suggests "shopping cart" pattern (add/remove items)
- Real workflow is more like "building a puzzle" - need to see all pieces simultaneously
- Data engineers think in terms of joins, relationships, and compatible schemas
- Need to evaluate multiple tables together, not in isolation

### 4. **Missing Critical Context**
- No indication of potential join keys across tables
- No suggestions for commonly joined tables
- No visual representation of relationships
- No indication of schema compatibility

---

## How Data Professionals Actually Work

### Persona 1: Data Engineer (Building Pipelines)
**Mental Process:**
1. "What business entities do I need?" (customers, orders, products)
2. "What tables contain these entities?"
3. "How do these tables relate to each other?" (join keys)
4. "What columns do I need from each table?"
5. "Are the schemas compatible?" (data types, naming conventions)

**Key Needs:**
- Quick schema scanning (not deep diving)
- Relationship visualization
- Join key identification
- Multi-table comparison

### Persona 2: Analytics Engineer (dbt models)
**Mental Process:**
1. "What upstream tables/models exist?"
2. "What's the grain of each table?" (one row per customer? per order?)
3. "What are the foreign keys?"
4. "What transformations have already been applied?"
5. "Can I trust this data?" (quality scores, freshness)

**Key Needs:**
- Lineage visualization
- Grain/uniqueness indicators
- Data quality context
- Documentation snippets visible inline

### Persona 3: Data Analyst (Ad-hoc Analysis)
**Mental Process:**
1. "Where is the data I need?" (search-first)
2. "Does this table have the columns I need?" (quick scan)
3. "Is the data fresh and complete?"
4. "Can I combine these easily?"

**Key Needs:**
- Fast search with preview
- Column-level search
- Sample data preview
- Aggregation/distribution hints

### Persona 4: Data Scientist (Feature Engineering)
**Mental Process:**
1. "What features are available?" (column-level thinking)
2. "What's the distribution/cardinality?"
3. "Are there existing feature stores?"
4. "Can I join this at prediction time?"

**Key Needs:**
- Column-level statistics
- Distribution previews
- Correlation hints
- Performance considerations (row counts)

---

## Progressive Exploration Pattern

Data professionals explore data sources through distinct phases:

### Phase 1: Discovery (Search & Browse)
- **Goal:** Find potentially relevant tables
- **Behavior:** Keyword search, category filtering, tag browsing
- **Need to see:** Table names, brief descriptions, key metadata (size, freshness)
- **Decision:** "Is this worth exploring further?"

### Phase 2: Evaluation (Schema Review)
- **Goal:** Understand table structure and content
- **Behavior:** Scan column names, check data types, read descriptions
- **Need to see:** Full schema, column descriptions, sample values
- **Decision:** "Does this have what I need?"

### Phase 3: Validation (Relationship Analysis)
- **Goal:** Determine how tables relate to each other
- **Behavior:** Look for join keys, check cardinality, verify grain
- **Need to see:** Potential joins, relationship types, key statistics
- **Decision:** "Can I combine these effectively?"

### Phase 4: Selection (Confirmation)
- **Goal:** Commit to using these tables
- **Behavior:** Review selections, check completeness, verify coverage
- **Need to see:** Summary of selections, missing pieces, next steps
- **Decision:** "Do I have everything I need to proceed?"

---

## Proposed Approach: Progressive Disclosure Browser

### Design Philosophy
**"Show more as they get more specific, hide less as they get more interested"**

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Search Bar (with filters)                      [3 tables selected] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Left Panel (40%)              │  Right Panel (60%)           │
│  ─────────────────────────────│──────────────────────────────│
│                                                                 │
│  📁 Categories/Domains        │  MAIN WORKSPACE              │
│    └─ Analytics               │                              │
│    └─ Sales                   │  [Selected tables shown      │
│    └─ Support                 │   with expanded schemas,     │
│                                │   or browse results if       │
│  🔍 Search Results             │   nothing selected yet]      │
│  ┌──────────────────────────┐│                              │
│  │ customer_360         98% ││  When 0 selected:            │
│  │ analytics.customer_360   ││  → Browse view with cards    │
│  │ 2.5M rows · 2h ago       ││                              │
│  │                          ││  When 1+ selected:           │
│  │ [+] [👁]                 ││  → Detailed schema view      │
│  └──────────────────────────┘│     with relationships       │
│  ┌──────────────────────────┐│                              │
│  │ support_tickets      92% ││                              │
│  │ support.tickets          ││                              │
│  │ 450K rows · Hourly       ││                              │
│  │ [+] [👁]                 ││                              │
│  └──────────────────────────┘│                              │
│                                │                              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Innovations

#### 1. **Persistent Schema Panel** (No Modals)
When a user hovers or selects a table, show schema in the right panel:
- Full column list with types
- Column descriptions inline
- Sample values for each column
- Distribution/stats overlays
- **No need to click away** - information persists

#### 2. **Expandable Cards in Browse Mode**
Before any selection:
```
┌────────────────────────────────────┐
│ customer_360                   98% │  ← Click anywhere to expand
├────────────────────────────────────┤
│ analytics.customer_360             │
│ 2.5M rows · 2 hours ago            │
│                                    │
│ Unified customer profile...        │
│                                    │
│ ▼ 12 columns                       │  ← Click to expand inline
└────────────────────────────────────┘

After click:
┌────────────────────────────────────┐
│ customer_360                   98% │
├────────────────────────────────────┤
│ Columns (12):                      │
│ ┌─────────────────────────────────┐│
│ │ customer_id        string   🔑 ││  ← Key indicator
│ │ email              string       ││
│ │ signup_date        date         ││
│ │ total_revenue      decimal      ││
│ │ last_activity      timestamp    ││
│ │ ... 7 more                      ││
│ └─────────────────────────────────┘│
│                                    │
│ [+ Add to Selection]      [View →]│
└────────────────────────────────────┘
```

#### 3. **Smart Relationship Detection**
When tables are selected, automatically show:
- Potential join keys (highlighted in green)
- Relationship type (1:1, 1:many, many:many)
- Join suggestions with confidence scores
- Visual connection lines

```
┌─────────────────────┐      ┌─────────────────────┐
│ customer_360        │      │ support_tickets     │
│ ─────────────────── │      │ ─────────────────── │
│ customer_id    🔑───┼──────┼──→customer_id       │
│ email              │      │   ticket_id    🔑   │
│ signup_date        │      │   created_at        │
│ ...                │      │   ...               │
└─────────────────────┘      └─────────────────────┘
        ↓ 1:many ↓
   "Customers can have
    multiple tickets"
```

#### 4. **Column-Level Search**
Search not just table names, but column names and descriptions:

```
Search: "email"

Results:
📊 customer_360
   └─ email (string) - Customer email address

📊 support_tickets
   └─ customer_email (string) - Email from ticket

📊 marketing_campaigns
   └─ recipient_email (string) - Campaign recipient
```

#### 5. **Contextual Actions Based on State**

**State: Nothing Selected**
- Large browse cards
- "Add to Selection" primary action
- Preview shows in side panel on hover
- Focus: Discovery

**State: 1 Table Selected**
- Show full schema in main area
- Suggest related tables in sidebar
- "Add Related" quick actions
- Focus: Building context

**State: 2+ Tables Selected**
- Show relationship visualization
- Highlight potential join keys
- Show coverage analysis
- Focus: Validation

#### 6. **Quick Stats Always Visible**
Every table card shows at a glance:
- Quality score (color-coded)
- Row count (formatted: 2.5M, 450K)
- Update frequency (Real-time, Hourly, Daily, 2h ago)
- Column count (12 columns)
- Schema namespace (analytics.customer_360)

#### 7. **Smart Suggestions Panel**
When tables are selected, show:
```
💡 Suggested Next Steps

Based on your selections:

✓ You have customer data
✓ You have support tickets
❌ Missing: Order/revenue data

Suggested additions:
📊 order_history (92% match)
   └─ Contains revenue metrics
   └─ Joins on customer_id
```

---

## Specific UI Improvements

### Remove Modal Dialog Entirely
❌ **Don't:**
- Open modal on eye icon click
- Hide schema behind interaction
- Force context switch

✅ **Do:**
- Show schema in persistent right panel
- Allow inline expansion in left panel
- Keep all information accessible without clicks

### Make Cards Expandable/Collapsible
❌ **Don't:**
- Fixed-size cards with truncated info
- Require navigation to see details

✅ **Do:**
- Click card to expand inline
- Show first 5 columns by default, "...X more" to expand
- Smooth animation for expansion

### Show Relationships Visually
❌ **Don't:**
- Force users to mentally map relationships
- Hide join key potential

✅ **Do:**
- Visual connection lines between selected tables
- Highlight matching column names
- Show cardinality indicators
- Suggest join conditions

### Progressive Detail Revelation
```
Hover → Show quick tooltip with column count and key columns
Click → Expand card inline to show all columns
Select → Move to right panel with full schema + relationships
```

### Search Improvements
❌ **Don't:**
- Search only table names
- No filters/facets

✅ **Do:**
- Search table names, descriptions, AND column names
- Filter by: domain, schema, update frequency, quality score
- Sort by: relevance, quality, size, recency
- Show "X tables have columns matching 'email'"

---

## Information Architecture

### Left Panel: Navigation & Discovery
- **Search bar** (prominent, always visible)
- **Filters** (collapsible but defaulted open)
  - Domain/Schema
  - Quality Score slider
  - Update Frequency
  - Size ranges
- **Browse Results** (scrollable list)
  - Expandable cards
  - Quick actions (Add, Preview)
- **Category Tree** (collapsible)
  - Domain-based organization
  - Tag-based grouping

### Right Panel: Detail & Context
**State-Based Content:**

**No Selection:**
- Empty state with instructions
- "Recently used" tables
- "Popular" tables
- "Recommended for you"

**1 Table Selected:**
- Full schema view
- Column descriptions
- Sample data (first 5 rows)
- Statistics/distributions
- Quality metrics
- Related tables suggestions

**2+ Tables Selected:**
- Relationship visualization
- Join key recommendations
- Combined schema view
- Coverage analysis
- Estimated output preview

### Bottom Bar: Selection Summary
```
┌────────────────────────────────────────────────────────────┐
│ 3 tables selected  |  8.4M rows  |  ~450MB input           │
│ [View All] [Clear Selection]          [Continue →]        │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Remove Modal, Add Side Panel (Week 1)
- Replace modal with persistent right panel
- Show schema on card click in right panel
- Keep existing card layout but remove modal

### Phase 2: Inline Expansion (Week 2)
- Make cards expandable/collapsible
- Show columns inline when expanded
- Smooth animations

### Phase 3: Relationship Detection (Week 3)
- Detect potential join keys (matching column names)
- Show visual connections
- Add relationship indicators

### Phase 4: Smart Search (Week 4)
- Add column-level search
- Add filters and facets
- Improve result ranking

### Phase 5: Suggestions & Intelligence (Week 5)
- "Related tables" suggestions
- "Missing data" detection
- Usage-based recommendations

---

## Success Metrics

### Efficiency Metrics
- **Time to first selection:** < 30 seconds (from page load)
- **Average selections per session:** 2-4 tables
- **Schema preview interactions:** Reduce by 70% (no modal needed)
- **Back/forth navigation:** Reduce by 80% (no modal)

### User Satisfaction
- **Confusion points:** Eliminate "how do I see columns?"
- **Perceived complexity:** Reduce from 7/10 to 3/10
- **Task completion confidence:** Increase to 95%+

### Business Impact
- **Completion rate:** Increase from 65% to 90%
- **Time in step:** Reduce from 8min to 3min
- **Support tickets:** Reduce "how to browse tables" by 80%

---

## Key Principles

1. **Show, Don't Hide:** Default to showing more information, not less
2. **Reduce Clicks:** Every click is friction - minimize required interactions
3. **Context Preservation:** Never force users to remember what they saw elsewhere
4. **Progressive Complexity:** Start simple, reveal detail as needed
5. **Parallel Evaluation:** Enable comparing multiple tables simultaneously
6. **Smart Defaults:** Suggest likely next steps based on current selections
7. **Instant Feedback:** Show impact of selections immediately

---

## Conclusion

The current modal-based approach treats schema viewing as a "special action" when it should be the default state. Data professionals need to see and compare schemas constantly - this should be effortless, not hidden behind clicks.

By moving to a persistent side panel with inline expansion, relationship visualization, and smart suggestions, we transform the experience from "hunting for information" to "browsing a well-organized library."

**The goal:** Users should feel like they're exploring a rich, interconnected data landscape, not clicking through a flat list of disconnected tables.
