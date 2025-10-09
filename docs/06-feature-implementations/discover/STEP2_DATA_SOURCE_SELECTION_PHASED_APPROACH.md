# Step 2: Data Source Selection - Phased Implementation Strategy

## Executive Summary

The current Step 2 implementation provides basic table browsing and schema viewing, but lacks critical information that data professionals need to make informed decisions about data sources. This document analyzes the current gaps and proposes a phased approach to building a production-ready data source selection experience.

---

## Current State Analysis

### What We Have ✅
- Split-panel layout (browse left, detail right)
- Table search functionality
- Schema preview with column types
- Basic metadata (row count, quality score, update frequency)
- Relationship detection (matching column names)
- Inline column expansion

### Critical Gaps ❌

#### 1. **No Sample Data Preview**
**Problem:** Users can't see actual data values, only schema definitions.

**Why It Matters:**
- Schema doesn't tell you if data is populated or null
- Can't verify data format (e.g., dates as '2024-01-01' vs timestamps)
- Can't assess data cleanliness (malformed values, encoding issues)
- Can't understand value distributions (categorical vs. continuous)

**Real Scenario:**
```
Column: customer_status (string)
Schema says: "string"
Sample data shows: "active", "Active", "ACTIVE", "act", null, ""
→ Reveals data quality issues that schema can't show
```

#### 2. **Insufficient Quality Context**
**Problem:** Quality score is just a number (98%) without explanation.

**Why It Matters:**
- Don't know what "98%" actually measures
- Can't see specific quality issues (nulls, duplicates, outliers)
- Can't assess if quality issues affect their use case
- No trend data (is quality improving or degrading?)

**Real Scenario:**
```
Table: customer_360
Quality: 98%
Hidden issues:
- 15% of rows have null email addresses
- customer_id has 2% duplicates
- last_activity is outdated (90 days+) for 40% of records
→ Looks great at 98%, but has critical issues for some use cases
```

#### 3. **No Data Profiling Overview**
**Problem:** Missing statistical context about the data.

**Why It Matters:**
- Can't assess data volume trends (growing? stable? declining?)
- Don't know column cardinality (how many unique values)
- Can't see value distributions (skewed? balanced?)
- Missing outlier detection
- No freshness trends

**Real Scenario:**
```
Column: customer_country
Without profiling: "string with 125 rows"
With profiling:
- Cardinality: 45 unique countries
- Top 5: US (60%), UK (15%), CA (10%), DE (5%), FR (3%)
- 7% null values
- Last updated: 2 hours ago (usually updates hourly)
→ Rich context for decision-making
```

#### 4. **No Usage/Popularity Signals**
**Problem:** No indication of which tables are commonly used or trusted.

**Why It Matters:**
- Popular tables are typically better documented and maintained
- Usage patterns reveal which tables are production-ready
- Related tables often used together (recommendation engine)
- Trust signals from data team veterans

#### 5. **Limited Relationship Intelligence**
**Problem:** Only detects exact column name matches.

**Why It Matters:**
- Misses semantic relationships (customer_id vs cust_id)
- Doesn't show relationship cardinality (1:1, 1:many, many:many)
- No join path suggestions through intermediate tables
- Can't validate referential integrity

#### 6. **No Business Context**
**Problem:** Technical metadata without business meaning.

**Why It Matters:**
- Table names don't always reveal purpose (what's "dim_c360"?)
- Missing ownership/stewardship information
- No tags or domain classification
- No SLA or support contact information

---

## What Users Actually Need (Priority Order)

### Priority 1: Trust & Confidence 🎯
**"Can I trust this data for my use case?"**

Critical Information:
1. **Sample data preview** (first 10-20 rows)
   - See actual values, not just types
   - Spot format inconsistencies
   - Verify non-null population

2. **Data quality metrics** (detailed, not just score)
   - Null percentage per column
   - Duplicate detection
   - Outlier indicators
   - Referential integrity status

3. **Freshness indicators**
   - Last updated timestamp
   - Update frequency (hourly, daily, batch time)
   - Staleness alerts (data older than expected)
   - Update trend (reliable? sporadic?)

4. **Data lineage preview**
   - Upstream sources (where does this come from?)
   - Downstream consumers (who else uses this?)
   - Transformation applied (raw vs. curated)

### Priority 2: Usability & Fit 🔧
**"Does this table have what I need?"**

Critical Information:
1. **Column-level profiling**
   - Cardinality (unique value count)
   - Distribution preview (top values, histogram)
   - Data type validation (declared vs. actual)
   - Format patterns (dates, IDs, enums)

2. **Smart relationship detection**
   - Semantic matching (not just exact names)
   - Cardinality indicators (1:1, 1:many)
   - Join quality score (% successful joins)
   - Suggested join paths

3. **Schema evolution tracking**
   - Recent changes (columns added/removed)
   - Breaking changes history
   - Deprecation warnings

### Priority 3: Discovery & Context 📚
**"How do I use this effectively?"**

Critical Information:
1. **Business metadata**
   - Plain English description
   - Domain/category tags
   - Data steward/owner
   - Related documentation links

2. **Usage analytics**
   - Query frequency (queries/day)
   - Popular joins
   - Common filters
   - Example queries

3. **Recommendations**
   - "Users who selected X also selected Y"
   - "Missing tables for common use case Z"
   - "Higher quality alternative available"

---

## Phased Implementation Roadmap

### 🚀 Phase 1: Essential Trust Indicators (Week 1-2)
**Goal:** Give users confidence in data quality

**Deliverables:**
1. **Sample Data Preview**
   - Show first 10 rows in detail panel
   - Highlight null values in red
   - Format detection (dates, currencies, IDs)
   - Copy sample data to clipboard

2. **Enhanced Quality Breakdown**
   - Replace single score with component scores:
     - Completeness (% non-null)
     - Uniqueness (duplicate detection)
     - Freshness (update recency)
     - Validity (format conformance)
   - Color-coded indicators (green/yellow/red)
   - Expandable detail view for issues

3. **Freshness Indicators**
   - Last updated timestamp
   - Expected update frequency
   - Staleness warning if overdue
   - Update history sparkline (last 7 days)

**UI Changes:**
```
Right Panel - Table Detail:
┌─────────────────────────────────────────┐
│ customer_360                            │
│ analytics.customer_360                  │
├─────────────────────────────────────────┤
│ Quality Breakdown                       │
│ ✅ Completeness    98% (high)          │
│ ⚠️  Uniqueness     94% (2% duplicates) │
│ ✅ Freshness       2h ago (hourly)     │
│ ✅ Validity        99% (format ok)     │
├─────────────────────────────────────────┤
│ Sample Data (10 rows)                   │
│ ┌──────────────────────────────────────┐│
│ │ customer_id  email           status  ││
│ │ C001        john@...         active  ││
│ │ C002        NULL             active  ││ ← Null highlighted
│ │ C003        sarah@...        ACTIVE  ││ ← Case inconsistency
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Success Metrics:**
- 90% of users view sample data before selection
- 80% confidence score from user surveys
- 50% reduction in "wrong table selected" errors

---

### 🎯 Phase 2: Column-Level Intelligence (Week 3-4)
**Goal:** Enable column-level decision making

**Deliverables:**
1. **Column Profiling Cards**
   - Per-column statistics:
     - Cardinality (unique values)
     - Null percentage
     - Top 5 values with counts
     - Min/max for numeric
     - Distribution histogram for numeric

2. **Interactive Column Filtering**
   - Filter tables by column names
   - Filter by data type
   - Filter by null percentage threshold
   - "Show only tables with email columns"

3. **Enhanced Sample Data**
   - 100 rows instead of 10
   - Pagination/infinite scroll
   - Column sorting
   - Value search within samples

4. **PII Detection Indicators**
   - Auto-detect PII columns (email, SSN, phone)
   - Show masking recommendations
   - Compliance warnings

**UI Changes:**
```
Right Panel - Column Detail (expanded):
┌─────────────────────────────────────────┐
│ Column: customer_id                     │
├─────────────────────────────────────────┤
│ Type: string                            │
│ Cardinality: 2.5M (100% unique) ✅      │
│ Nulls: 0% ✅                            │
│ Is Primary Key: Yes 🔑                  │
├─────────────────────────────────────────┤
│ Sample Values:                          │
│ • C001, C002, C003, C004...             │
│                                         │
│ Format Pattern: [A-Z][0-9]{3}           │
│ Example: C001                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Column: email                           │
├─────────────────────────────────────────┤
│ Type: string                            │
│ Cardinality: 2.4M (96% unique)          │
│ Nulls: 4% ⚠️                            │
│ PII Detected: Yes 🔒                    │
├─────────────────────────────────────────┤
│ Top Values:                             │
│ • NULL (100K, 4%)                       │
│ • john@gmail.com (2)                    │
│ • sarah@yahoo.com (1)                   │
│                                         │
│ Distribution: Long tail                 │
│ Recommendation: Apply masking           │
└─────────────────────────────────────────┘
```

**Success Metrics:**
- 70% of users expand column details
- 60% reduction in "missing required column" errors
- 85% PII detection accuracy

---

### 🔥 Phase 3: Smart Relationships & Recommendations (Week 5-6)
**Goal:** Intelligent join suggestions and usage patterns

**Deliverables:**
1. **Semantic Join Detection**
   - Match similar column names (customer_id vs cust_id)
   - Fuzzy matching with confidence scores
   - Validate join quality by sampling
   - Show cardinality of relationships

2. **Join Path Visualization**
   - Visual graph of selected tables
   - Suggested intermediate tables
   - Join quality indicators
   - One-click add related tables

3. **Smart Recommendations**
   - "Tables commonly used together"
   - "Missing table for complete workflow"
   - "Higher quality alternative available"
   - Usage-based suggestions

4. **Join Preview/Validation**
   - Show sample joined data
   - Estimate result set size
   - Detect potential issues (fan-out, orphans)

**UI Changes:**
```
Right Panel - Relationships (2+ tables selected):
┌─────────────────────────────────────────┐
│ Detected Relationships                  │
├─────────────────────────────────────────┤
│ customer_360 ─────→ support_tickets     │
│   customer_id        customer_id        │
│   Cardinality: 1:N (avg 1.8 tickets)    │
│   Join Quality: 98% (high) ✅           │
│   [Preview Join Results]                │
├─────────────────────────────────────────┤
│ customer_360 ─────→ order_history       │
│   customer_id        customer_id        │
│   Cardinality: 1:N (avg 4.8 orders)     │
│   Join Quality: 99% (high) ✅           │
│   [Preview Join Results]                │
├─────────────────────────────────────────┤
│ 💡 Recommendation                       │
│ Users who selected these tables also    │
│ commonly add:                           │
│ • product_catalog (for order details)   │
│ • customer_segments (for targeting)     │
│   [+ Add Both]                          │
└─────────────────────────────────────────┘
```

**Success Metrics:**
- 80% acceptance rate for join suggestions
- 50% reduction in SQL join errors in next step
- 70% of users add at least one recommended table

---

### 🚀 Phase 4: Advanced Context & Governance (Week 7-8)
**Goal:** Enterprise-grade metadata and compliance

**Deliverables:**
1. **Data Lineage Integration**
   - Show upstream sources (visual graph)
   - Show downstream consumers
   - Transformation history
   - Impact analysis

2. **Business Metadata**
   - Domain/category classification
   - Data steward contact
   - SLA and support information
   - Related documentation links
   - Certified/trusted badges

3. **Usage Analytics Dashboard**
   - Query frequency trends
   - Popular join patterns
   - Performance metrics (avg query time)
   - User adoption (teams using this table)

4. **Governance & Compliance**
   - Data classification (public, internal, confidential)
   - Access control preview
   - Compliance tags (GDPR, HIPAA, SOC2)
   - Retention policies

5. **Schema Evolution Tracker**
   - Recent changes timeline
   - Deprecation warnings
   - Breaking change alerts
   - Migration guides

**UI Changes:**
```
Right Panel - Advanced Tab:
┌─────────────────────────────────────────┐
│ [Schema] [Sample] [Quality] [Lineage]  │
├─────────────────────────────────────────┤
│ Lineage                                 │
│                                         │
│    [Raw CRM DB]                         │
│         ↓                               │
│    [ETL Pipeline]                       │
│         ↓                               │
│ → [customer_360] ← You are here         │
│         ↓                               │
│    [ML Feature Store]                   │
│    [BI Dashboard (12)]                  │
│    [API Endpoints (5)]                  │
├─────────────────────────────────────────┤
│ Governance                              │
│ Classification: Internal 🔒             │
│ PII Fields: email, phone 🚨             │
│ Compliance: GDPR, CCPA ⚖️               │
│ Data Steward: Jane Doe (jane@co.com)   │
│ SLA: 99.9% availability                 │
│                                         │
│ Access: Read ✅ | Write ❌              │
├─────────────────────────────────────────┤
│ Usage Analytics (last 30 days)          │
│ Queries: 12,450 (avg 415/day)           │
│ Teams: 8 teams actively using           │
│ Avg Query Time: 2.3s                    │
│                                         │
│ Popular Joins:                          │
│ • order_history (80% of queries)        │
│ • support_tickets (45% of queries)      │
│                                         │
│ [View Full Analytics →]                 │
└─────────────────────────────────────────┘
```

**Success Metrics:**
- 95% compliance with data classification policies
- 90% users view lineage before selection
- 100% PII fields properly tagged
- Zero governance policy violations

---

## Data Requirements per Phase

### Phase 1 Requirements
**APIs Needed:**
```typescript
GET /api/v1/tables/{urn}/sample?limit=10
→ Returns: { rows: any[], metadata: {...} }

GET /api/v1/tables/{urn}/quality
→ Returns: {
  completeness: 98,
  uniqueness: 94,
  freshness: { lastUpdated: "2024-01-01T10:00:00Z", expectedFrequency: "hourly" },
  validity: 99,
  issues: [{ column: "email", type: "null", count: 100000 }]
}

GET /api/v1/tables/{urn}/freshness
→ Returns: {
  lastUpdated: "2024-01-01T10:00:00Z",
  updateFrequency: "hourly",
  isStale: false,
  history: [...]
}
```

### Phase 2 Requirements
**APIs Needed:**
```typescript
GET /api/v1/tables/{urn}/columns/{columnName}/profile
→ Returns: {
  cardinality: 2500000,
  nullPercentage: 0,
  topValues: [{ value: "C001", count: 1 }, ...],
  distribution: { min: null, max: null, histogram: [...] },
  dataType: "string",
  format: "[A-Z][0-9]{3}",
  isPII: false
}

GET /api/v1/tables/{urn}/sample?limit=100&offset=0
→ Returns: { rows: any[], total: 2500000, hasMore: true }
```

### Phase 3 Requirements
**APIs Needed:**
```typescript
POST /api/v1/tables/relationships
Body: { tableUrns: ["urn1", "urn2"] }
→ Returns: {
  joins: [{
    leftTable: "urn1",
    rightTable: "urn2",
    leftColumn: "customer_id",
    rightColumn: "customer_id",
    cardinality: "1:N",
    quality: 98,
    sampleJoinResult: [...]
  }]
}

GET /api/v1/tables/{urn}/recommendations
→ Returns: {
  commonlyUsedWith: ["urn2", "urn3"],
  alternatives: ["urn4"],
  missingForWorkflow: ["urn5"]
}
```

### Phase 4 Requirements
**APIs Needed:**
```typescript
GET /api/v1/tables/{urn}/lineage?direction=both&depth=2
→ Returns: {
  upstream: [...],
  downstream: [...],
  transformations: [...]
}

GET /api/v1/tables/{urn}/governance
→ Returns: {
  classification: "internal",
  compliance: ["GDPR", "CCPA"],
  steward: { name: "Jane Doe", email: "..." },
  sla: { availability: 99.9 }
}

GET /api/v1/tables/{urn}/usage?days=30
→ Returns: {
  queryCount: 12450,
  activeTeams: 8,
  avgQueryTime: 2.3,
  popularJoins: [...]
}
```

---

## Integration Points

### Backend Services Required

#### Phase 1:
- **DataHub API** - Table metadata, quality scores
- **Query Engine** - Sample data retrieval (Trino/Spark)
- **Quality Service** - Data quality metrics computation

#### Phase 2:
- **Profiling Service** - Column-level statistics (ydata-profiling)
- **PII Detection** - Pattern matching for sensitive data
- **Schema Registry** - Type validation and format patterns

#### Phase 3:
- **Join Analyzer** - Semantic matching and cardinality analysis
- **Usage Tracking** - Query log analysis
- **Recommendation Engine** - Collaborative filtering

#### Phase 4:
- **Lineage Service** - DataHub lineage API
- **Governance Platform** - Apache Ranger, Collibra
- **Analytics Warehouse** - Usage metrics aggregation

---

## UI/UX Principles

### Information Hierarchy
1. **Above the fold:** Trust indicators (quality, freshness, sample)
2. **One scroll:** Column details and relationships
3. **Expandable:** Advanced context (lineage, governance, usage)

### Progressive Disclosure
- Start with essentials (schema + sample)
- Expand on demand (column profiles)
- Advanced users get tabs (lineage, governance)

### Visual Language
- ✅ Green: High quality, fresh, valid
- ⚠️ Yellow: Caution, needs attention
- ❌ Red: Issues, stale, invalid
- 🔑 Key: Primary key, join key
- 🔒 Lock: PII, restricted access
- 📊 Chart: Distribution, trends

### Interaction Patterns
- **Hover:** Preview in detail panel (passive)
- **Click:** Focus and persist (active selection)
- **Expand:** Inline details (progressive disclosure)
- **Right Panel Tabs:** Advanced context (expert mode)

---

## Success Criteria (Overall)

### User Experience
- [ ] Time to first selection: < 2 minutes
- [ ] Selection confidence: 90%+ ("I chose the right tables")
- [ ] Error rate: < 5% (wrong table selected)
- [ ] Completion rate: 95%+ (users proceed to Step 3)

### Data Quality
- [ ] Users can identify quality issues before selection
- [ ] PII detected with 95%+ accuracy
- [ ] Join quality predicted with 90%+ accuracy
- [ ] Freshness alerts prevent stale data usage

### Business Impact
- [ ] 70% reduction in "data not as expected" support tickets
- [ ] 50% faster data discovery process
- [ ] 80% of users trust auto-detected relationships
- [ ] 100% compliance with data governance policies

---

## Technical Debt & Considerations

### Performance
- Sample data queries must be < 500ms
- Profiling should be pre-computed (not on-demand)
- Cache quality metrics (refresh hourly)
- Paginate sample data for large tables

### Scalability
- Support 10,000+ tables in catalog
- Handle 100+ concurrent users browsing
- Background jobs for profiling updates
- CDN for static metadata

### Reliability
- Graceful degradation if profiling unavailable
- Fallback to basic metadata if services down
- Retry logic for intermittent failures
- Clear error messages for users

### Privacy & Security
- Never show raw PII in samples (auto-mask)
- Respect access controls (show only authorized tables)
- Audit log all data access
- Encrypt sensitive metadata in transit

---

## Conclusion

Step 2 is the most critical decision point in the data product creation flow. Users need to:
1. **Trust** the data (quality, freshness, samples)
2. **Understand** the data (profiling, distributions, formats)
3. **Relate** the data (joins, relationships, recommendations)
4. **Govern** the data (compliance, ownership, lineage)

The phased approach ensures we deliver value incrementally while building toward a comprehensive, enterprise-grade solution.

**Phase 1 is the MVP** - sample data and quality breakdown are non-negotiable for users to make informed decisions. Everything else enhances the experience but Phase 1 is the foundation.

Start with Phase 1, validate with users, then iterate into Phases 2-4 based on feedback and usage patterns.
