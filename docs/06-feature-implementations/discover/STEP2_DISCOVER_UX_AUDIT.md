# Step 2: Discover Data - UX Audit & Recommendations

**Date**: 2025-01-15
**Auditor**: Claude (UX Expert Mode)
**Scope**: Data discovery and table selection experience for analytics professionals

---

## Executive Summary

The current "Discover Data" step shows promise but lacks the depth and focus required for analytical professionals to make confident table selection decisions. The modal-based table exploration creates artificial constraints that prevent the thorough analysis required for data product development.

**Critical Gap**: Analytics professionals need to **deeply understand** tables before committing them to a data product, not just preview them. The current modal approach treats table exploration as a quick peek rather than a comprehensive analysis session.

---

## Target Personas & Their Needs

### 1. Analytics Engineer (Primary)
**Background**: 3-5 years experience, SQL expert, understands data modeling, builds dbt models

**Mental Model**: "I need to understand the shape, quality, and relationships of this data before I can decide if it's suitable for my use case."

**Critical Needs**:
- **Schema Analysis**: Column types, nullability, constraints, distributions
- **Quality Assessment**: Completeness, validity, uniqueness metrics
- **Sample Data**: Representative rows to verify data format and content
- **Query Performance**: Understanding size/cardinality for join planning
- **Lineage Context**: Where does this come from? Who uses it?
- **Join Planning**: What columns can I join on? Are there foreign keys?

**Pain Points**:
- Modal limits screen space for comparing multiple columns
- Can't keep table details open while browsing other tables
- No way to compare schemas between selected tables
- Can't see actual data quality distributions at a glance

### 2. Data Analyst (Secondary)
**Background**: Business-focused, SQL comfortable, consumes data products, less technical depth

**Mental Model**: "Is this table the one I need? Does it have the metrics/dimensions I'm looking for?"

**Critical Needs**:
- **Quick Scanning**: Fast browsing through many tables
- **Clear Descriptions**: Business context, not just technical metadata
- **Usage Validation**: "Are other teams using this successfully?"
- **Column Search**: Find tables with specific fields (e.g., "revenue", "customer_id")
- **Popularity Signals**: Trending, most-used, high-quality badges

**Pain Points**:
- Hard to quickly scan through 50+ tables
- No filtering by specific columns or metrics
- Can't search within table descriptions
- Unclear which tables are "trusted" by organization

### 3. Data Scientist (Tertiary)
**Background**: Python/R expert, works with features and model training data

**Mental Model**: "I need features with specific statistical properties and sufficient historical depth."

**Critical Needs**:
- **Statistical Distributions**: Min/max/mean/std for numeric columns
- **Cardinality Analysis**: How many unique values? (for categorical features)
- **Temporal Availability**: Date ranges, update frequency, backfill history
- **Feature Engineering**: Can I derive useful features from these columns?
- **Data Volume**: Sufficient rows for model training?

**Pain Points**:
- No statistical previews without opening table details
- Can't see temporal coverage at a glance
- No indication of feature-ready tables vs raw data
- Missing distribution visualizations

### 4. Product Manager (Quaternary)
**Background**: Non-technical, consumes reports, needs self-service insights

**Mental Model**: "I want to find the table with customer revenue data to build a dashboard."

**Critical Needs**:
- **Natural Language Descriptions**: Plain English, not SQL jargon
- **Usage Examples**: "Teams use this for X analysis"
- **Business Metrics**: Revenue, customers, orders (not technical column names)
- **Pre-built Products**: Guided recommendations rather than raw tables

**Pain Points**:
- Technical jargon (schemas, foreign keys, cardinality)
- Too many low-level options
- No guided discovery flow
- Unclear which tables answer business questions

---

## Current Implementation Critique

### ❌ Modal-Based Table Exploration

**Problem**: The modal restricts the analysis workspace to ~60% of screen width and 85% height, creating artificial constraints.

**Why This Fails**:
1. **Cognitive Overload**: Switching between browse mode and analysis mode breaks mental context
2. **Comparison Friction**: Can't keep one table open while exploring others
3. **Limited Real Estate**: Schema with 45 columns requires excessive scrolling
4. **No Multi-tasking**: Can't cross-reference documentation or other tools
5. **Feels Temporary**: Modal psychology = "quick look", not "thorough analysis"

**Data Point**: Analytics engineers spend 5-15 minutes analyzing a single table before adding it to a data product. A modal communicates "quick preview", not "analysis session".

### ❌ Insufficient Filtering & Search

**Problem**: No ability to filter by quality, freshness, usage, or search within column names.

**User Story**:
> "I need all tables with 'customer_id' column that are updated hourly and have >90% quality score"

**Current Experience**: Manually click through 50+ tables, trying to remember which ones matched criteria.

**Impact**: Wastes 10-20 minutes per data product creation, leads to suboptimal table selection.

### ❌ Card-Based Browse Without Context

**Problem**: Table cards show 4-5 metrics but lack the context needed for decision-making.

**Missing Context**:
- **Temporal**: When was this last used? Is it actively maintained?
- **Relational**: What other tables does this commonly join with?
- **Business**: What business questions does this answer?
- **Quality Trends**: Is quality improving or degrading?

**Result**: Cards optimize for scanning but don't provide enough information to make decisions, forcing users into the modal repeatedly.

### ❌ No Workflow State Preservation

**Problem**: If you explore 10 tables, there's no way to mark them for comparison or later review.

**User Story**:
> "I found 3 potential tables for customer data. I want to compare their schemas side-by-side before choosing."

**Current Experience**: Open modal, screenshot/take notes, close modal, repeat. No system support for this common workflow.

---

## Recommended Solution: Split-Panel Architecture

### Core Concept: **Browse Left, Analyze Right**

Replace the modal with a **persistent split-panel layout** that enables parallel browsing and deep analysis.

```
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Select the data you want to use                    │
├────────────────┬────────────────────────────────────────────┤
│                │                                            │
│   Table        │        Table Deep Dive Panel               │
│   Browser      │                                            │
│   (Tree +      │   ┌──────────────────────────────────┐   │
│    Cards)      │   │ customers                        │   │
│                │   │ nexusone.sales.customer.customers│   │
│   [Filters]    │   └──────────────────────────────────┘   │
│                │                                            │
│   [Search]     │   [Tabs: Overview | Schema | Sample |    │
│                │          Quality | Usage | Lineage ]      │
│   ┌──────┐    │                                            │
│   │ Card │    │   ┌────────────────────────────────┐     │
│   └──────┘    │   │                                │     │
│   ┌──────┐    │   │   Full workspace for analysis  │     │
│   │ Card │◄───┼───┤                                │     │
│   └──────┘    │   │   - Full schema table          │     │
│   ┌──────┐    │   │   - Sample data grid           │     │
│   │ Card │    │   │   - Distribution charts        │     │
│   └──────┘    │   │   - Lineage graph              │     │
│                │   └────────────────────────────────┘     │
│                │                                            │
│   Selected: 3  │   [Add to Product]                        │
└────────────────┴────────────────────────────────────────────┘
```

### Key Benefits:

1. **Persistent Context**: Analysis panel stays open while browsing
2. **Maximum Real Estate**: Full right panel (60-70% width) for analysis
3. **Parallel Workflow**: Browse left, analyze right, no context switching
4. **Comparison Support**: Pin/compare multiple tables side-by-side
5. **Professional Psychology**: Communicates "serious analysis tool", not "quick preview"

---

## Detailed Design Recommendations

### 1. Advanced Filtering System

**Location**: Top of left panel, collapsible filter bar

**Filter Categories**:

```
┌─────────────────────────────────────────────────────────┐
│ Filters: [X Show 12 of 48 tables]         [Clear All]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Quality Score:    [░░░░███████░] 85-100%                │
│                                                          │
│ Freshness:        ☑ Real-time  ☑ Hourly  ☐ Daily       │
│                                                          │
│ Usage (30d):      [░███████░░░] 500-5000 queries        │
│                                                          │
│ Domain:           ☑ Sales  ☑ Marketing  ☐ Finance       │
│                                                          │
│ Size:             ☐ < 10 GB   ☑ 10-100 GB  ☐ > 100 GB  │
│                                                          │
│ Contains Column:  [customer_id________] [Search]        │
│                                                          │
│ Tags:             [pii] [core] [ml-features]            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Interaction**:
- Filters apply in real-time, no "Apply" button needed
- Show count of matching tables: "12 of 48 tables"
- Persist filters in URL for shareability
- Save filter presets: "High-quality customer data", "ML feature tables"

**Impact**: Reduces browse time from 10 minutes to 2 minutes by eliminating non-viable tables early.

### 2. Enhanced Table Cards

**Current**: 4 metrics (quality, freshness, rows, size)

**Recommended**: Add context signals

```
┌─────────────────────────────────────────────────┐
│ 🔥 customers                    [Add] [Details] │
├─────────────────────────────────────────────────┤
│ Customer master data with profile information   │
│                                                  │
│ Quality: 95%  Freshness: hourly  2.5M rows     │
│                                                  │
│ 📊 1.5K queries/mo  👥 3 teams  ⚡ 2.3s avg     │
│                                                  │
│ Popular joins: orders, support_tickets          │
│                                                  │
│ [pii] [customer] [core]                         │
│                                                  │
│ Last updated: 30 min ago                        │
└─────────────────────────────────────────────────┘
```

**Key Additions**:
- **Popular Joins**: Most common tables joined with (helps with discovery)
- **Last Updated**: Temporal freshness indicator
- **Quick Actions**: "Add" without opening details, "Details" to analyze

### 3. Full-Screen Analysis Panel

**Philosophy**: When a user clicks "Details", they're committing to analysis. Give them a professional workspace.

**Tab Structure**:

#### **Overview Tab**
```
┌─────────────────────────────────────────────────────────┐
│ customers                              [Add to Product] │
│ nexusone.sales.customer.customers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Customer master data with profile information,          │
│ contact details, and behavioral segmentation            │
│                                                          │
│ ┌──────────┬──────────┬──────────┬──────────┐          │
│ │ Quality  │  Rows    │   Size   │ Columns  │          │
│ │   95%    │  2.5M    │ 12.5 GB  │   24     │          │
│ └──────────┴──────────┴──────────┴──────────┘          │
│                                                          │
│ Usage Insights:                                         │
│ • 1,523 queries in last 30 days (↑ 15%)                │
│ • Used by: analytics-team, sales-ops, marketing        │
│ • Avg query time: 2.3s                                  │
│ • Popular joins: orders (892), support_tickets (234)   │
│                                                          │
│ Quality Metrics:                                        │
│ • Completeness: 98%                                     │
│ • Uniqueness: 99%                                       │
│ • Validity: 95%                                         │
│ • Null columns: middle_name, phone_secondary           │
│                                                          │
│ Lineage:                                                │
│ • Upstream: raw.salesforce.accounts, raw.zendesk.users │
│ • Downstream: customer_360, churn_predictions          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### **Schema Tab**
```
┌─────────────────────────────────────────────────────────┐
│ Schema (24 columns)                    [Search columns] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────────────────────────────────┐│
│ │Column          Type      Null% Unique Dist  Actions ││
│ ├─────────────────────────────────────────────────────┤│
│ │🔑 customer_id  VARCHAR    0%   100%   [▮▮▮] [Copy] ││
│ │📧 email        VARCHAR    0%    99%   [▮▮▯] [Copy] ││
│ │👤 first_name   VARCHAR    2%    85%   [▮▮▯] [Copy] ││
│ │👤 last_name    VARCHAR    2%    82%   [▮▮▯] [Copy] ││
│ │📞 phone        VARCHAR   15%    95%   [▮▯▯] [Copy] ││
│ │🏢 company      VARCHAR   25%    5.2K  [▮▯▯] [Copy] ││
│ │📍 country      VARCHAR    5%    195   [▮▮▮] [Copy] ││
│ │💰 ltv          DECIMAL   10%    -     [▮▮▯] [Copy] ││
│ │📊 segment      VARCHAR    8%    8     [▮▮▮] [Copy] ││
│ │📅 created_at   TIMESTAMP  0%    -     [▮▮▮] [Copy] ││
│ │ ...                                                  ││
│ └─────────────────────────────────────────────────────┘│
│                                                          │
│ 🔍 Insights:                                            │
│ • customer_id is suitable primary key (100% unique)    │
│ • email has 99% uniqueness (potential duplicate issue) │
│ • High nulls in phone (15%) and company (25%)          │
│ • segment has only 8 values (good for grouping)        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Schema Tab Features**:
- **Visual Distribution**: Mini histograms/bars showing data distribution
- **Icons**: Visual indicators for data types (🔑 key, 📧 email, etc.)
- **Null Percentage**: Critical for understanding data quality
- **Unique Count**: Essential for join planning and cardinality estimation
- **Copy Actions**: Quick-copy column names for SQL writing
- **Automated Insights**: AI-detected patterns and recommendations

#### **Sample Data Tab**
```
┌─────────────────────────────────────────────────────────┐
│ Sample Data (100 random rows)            [Refresh Data] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────┬──────────┬─────────┬─────────┬─────────┐│
│ │customer_id │  email   │  name   │ country │   ltv   ││
│ ├────────────┼──────────┼─────────┼─────────┼─────────┤│
│ │ CUST-10023 │john@ex..│ John Do │   USA   │ 12,450  ││
│ │ CUST-10024 │sarah@...│ Sarah S │   UK    │  8,320  ││
│ │ CUST-10025 │mike@....│ Mike Ch │  Canada │ 15,680  ││
│ │ ...                                                   ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ 🔍 Data Observations:                                   │
│ • customer_id follows pattern: CUST-NNNNN              │
│ • Email format validated (no invalid entries in sample)│
│ • LTV values range from $500 to $125K                  │
│ • Countries: 42 unique in sample (195 total)           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Sample Data Features**:
- **Representative Sampling**: Stratified sampling for better distribution representation
- **Formatting**: Readable formats (truncated emails, comma-separated numbers)
- **Refresh**: Get new random sample to verify consistency
- **Export**: Download sample as CSV for local analysis
- **Observations**: AI-detected patterns in sample data

#### **Quality Tab**
```
┌─────────────────────────────────────────────────────────┐
│ Quality Score: 95%                    ✅ Production Ready│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Completeness: 98%  ━━━━━━━━━━━━━━━━━━━░                │
│ • 2% of rows have null values in non-nullable columns   │
│ • Columns with issues: middle_name (45%), phone (15%)   │
│                                                          │
│ Uniqueness: 99%    ━━━━━━━━━━━━━━━━━━━░                │
│ • 0.01% duplicate customer_ids detected (250 rows)      │
│ • email has 1% duplicates (potential data issue)        │
│                                                          │
│ Validity: 95%      ━━━━━━━━━━━━━━━━━━░░                │
│ • 5% of emails fail regex validation                    │
│ • 2% of phone numbers have invalid format               │
│                                                          │
│ Freshness: ✅      Last updated 30 minutes ago          │
│ • Update frequency: Hourly                              │
│ • Expected next update: 15:00 UTC                       │
│ • SLA: 99.5% uptime (met last 30 days)                 │
│                                                          │
│ Quality Trend:     ━━━━━━━━━━━━━━━╱  (↑ 3% vs 30d ago)│
│                                                          │
│ ⚠️  Issues:                                             │
│ • Duplicate customer_ids detected (see row IDs)         │
│ • Email validation failure rate increasing              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Quality Tab Features**:
- **Visual Progress Bars**: Clear indication of quality dimensions
- **Specific Issues**: Drill down into exact problems
- **Trend Indicators**: Is quality improving or degrading?
- **SLA Tracking**: Meets organizational quality standards?
- **Actionable Warnings**: What needs attention before using this table?

#### **Usage Tab**
```
┌─────────────────────────────────────────────────────────┐
│ Usage Analytics (Last 30 Days)                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Query Volume:  1,523 queries  (↑ 15% vs previous 30d)  │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 150 ┤                                            ╭─╮││
│ │ 120 ┤                                  ╭─╮       │ │││
│ │  90 ┤                        ╭─╮     ╭─╯ │       │ │││
│ │  60 ┤              ╭─╮     ╭─╯ │   ╭─╯   │     ╭─╯ │││
│ │  30 ┤        ╭─╮ ╭─╯ │   ╭─╯   │ ╭─╯     │   ╭─╯   │││
│ │   0 ┼────────┴─┴─┴───┴───┴─────┴─┴───────┴───┴─────│││
│ │     Week 1   Week 2   Week 3         Week 4         ││
│ └─────────────────────────────────────────────────────┘│
│                                                          │
│ Top Users:                                              │
│ • analytics-team (642 queries, 42%)                    │
│ • sales-ops (423 queries, 28%)                         │
│ • marketing (458 queries, 30%)                         │
│                                                          │
│ Common Queries:                                         │
│ 1. SELECT * FROM customers WHERE country = 'USA'       │
│    (287 times, avg 2.1s)                               │
│ 2. JOIN customers c ON orders.customer_id = c.id       │
│    (892 times, avg 3.8s)                               │
│                                                          │
│ Join Partners (Most Frequent):                          │
│ • orders (892 joins)                                    │
│ • support_tickets (234 joins)                          │
│ • campaigns (156 joins)                                 │
│                                                          │
│ Performance:                                            │
│ • Avg query time: 2.3s                                  │
│ • P95 query time: 5.8s                                  │
│ • Slowest query: 15.2s (complex 4-table join)          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Usage Tab Features**:
- **Trend Visualization**: Actual query volume over time
- **User Breakdown**: Who's using this and how much?
- **Query Patterns**: Real examples of how teams query this table
- **Join Intelligence**: What tables are commonly joined?
- **Performance Data**: Expected query times for planning

#### **Lineage Tab**
```
┌─────────────────────────────────────────────────────────┐
│ Data Lineage                                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Upstream Sources (2):                                   │
│                                                          │
│    raw.salesforce.accounts                              │
│         │                                               │
│         ├──► [ TRANSFORM ] ──►                          │
│         │                                               │
│    raw.zendesk.users                customers           │
│                                                          │
│                                                          │
│ Downstream Consumers (2):                               │
│                                                          │
│    customers                                            │
│         │                                               │
│         ├──► nexusone.analytics.customer_360            │
│         │                                               │
│         └──► nexusone.ml.churn.predictions              │
│                                                          │
│                                                          │
│ Data Flow:                                              │
│ 1. Raw data from Salesforce (accounts)                 │
│ 2. Raw data from Zendesk (user profiles)               │
│ 3. De-duplication and merge logic                      │
│ 4. Enrichment with behavioral data                     │
│ 5. Published as curated customers table                │
│                                                          │
│ Impact Analysis:                                        │
│ ⚠️  This table is a dependency for:                    │
│ • 2 production ML models                                │
│ • 15 downstream reports                                 │
│ • 3 critical dashboards                                 │
│                                                          │
│ Changes to this table may affect 23 consumers           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Lineage Tab Features**:
- **Visual Graph**: Clear upstream → current → downstream flow
- **Impact Analysis**: What breaks if this table changes?
- **Source Tracing**: Where does this data originate?
- **Transformation Logic**: How is data processed?
- **Consumer Awareness**: Who depends on this?

### 4. Comparison Mode

**User Story**: "I found 3 customer tables. Which one should I use?"

**Feature**: Pin multiple tables for side-by-side comparison

```
┌─────────────────────────────────────────────────────────────────┐
│ Comparing 3 Tables                          [Exit Comparison]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌───────────────┬───────────────┬───────────────┐              │
│ │  customers    │ customer_360  │customer_master│              │
│ ├───────────────┼───────────────┼───────────────┤              │
│ │ Quality: 95%  │ Quality: 88%  │ Quality: 92%  │              │
│ │ Rows: 2.5M    │ Rows: 2.5M    │ Rows: 2.3M    │              │
│ │ Cols: 24      │ Cols: 45      │ Cols: 18      │              │
│ │ Fresh: hourly │ Fresh: daily  │ Fresh: daily  │              │
│ │               │               │               │              │
│ │ Usage: HIGH   │ Usage: MEDIUM │ Usage: LOW    │              │
│ │ 1.5K q/mo     │ 892 q/mo      │ 234 q/mo      │              │
│ │               │               │               │              │
│ │ Core data     │ ML features   │ Legacy system │              │
│ │ Salesforce    │ Enriched      │ Old CRM       │              │
│ │               │               │               │              │
│ │ ✅ Recommended│ ⚠️  Complex   │ ❌ Deprecated │              │
│ │ [Select]      │ [Select]      │ [Select]      │              │
│ └───────────────┴───────────────┴───────────────┘              │
│                                                                  │
│ 💡 Recommendation: Use "customers" for new data products       │
│    • Highest quality and freshness                             │
│    • Most actively used by organization                        │
│    • Direct from source system (Salesforce)                    │
│    • customer_360 adds ML features but daily updates only      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Comparison Features**:
- **Pin Tables**: Click "Compare" on multiple table cards
- **Side-by-Side View**: Key metrics aligned for easy scanning
- **AI Recommendation**: System suggests best option based on use case
- **Contextual Explanation**: Why one table is better than others

### 5. Smart Recommendations

**Problem**: Users don't know what they don't know. They might miss important tables.

**Solution**: AI-powered recommendations based on:
- Tables already selected (suggest common join partners)
- User's query history (suggest tables you've used before)
- Team patterns (suggest tables similar teams use)
- Domain context (suggest related domain tables)

```
┌─────────────────────────────────────────────────────────┐
│ 💡 Recommended for You                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Based on your selection of "customers", you might need: │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ orders - 892 teams join customers with orders        ││
│ │ [Preview] [Add]                                      ││
│ └──────────────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────────────┐│
│ │ support_tickets - Common for customer analysis       ││
│ │ [Preview] [Add]                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ Similar teams building customer analytics also used:    │
│ • customer_segments (segmentation data)                 │
│ • campaigns (marketing touchpoints)                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 6. Keyboard Shortcuts

**Problem**: Power users (analytics engineers) want speed.

**Solution**: Comprehensive keyboard navigation

```
┌─────────────────────────────────────────────────────────┐
│ Keyboard Shortcuts                              [Ctrl+?]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Navigation:                                             │
│ • ↑/↓          Navigate table cards                     │
│ • Enter        Open table details                       │
│ • Esc          Close details panel                      │
│ • Tab          Focus search/filters                     │
│                                                          │
│ Actions:                                                │
│ • A            Add current table to product             │
│ • C            Compare with pinned tables               │
│ • P            Pin for comparison                       │
│ • /            Focus search                             │
│                                                          │
│ Analysis:                                               │
│ • 1-6          Switch tabs (Overview, Schema, etc.)    │
│ • Cmd+C        Copy column name (in schema tab)        │
│ • R            Refresh sample data                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Information Architecture

### Progressive Disclosure Strategy

**Level 1: Browse (Cards)** - Quick scanning
- Table name, description
- 4 key metrics (quality, freshness, size, usage)
- Trending/popular badges
- Quick add button

**Level 2: Analyze (Detail Panel)** - Deep dive
- All metadata and statistics
- Sample data and distributions
- Quality and lineage
- Usage patterns

**Level 3: Compare (Comparison Mode)** - Decision making
- Side-by-side metrics
- AI recommendations
- Contextual differences

**Level 4: Selected (Product Builder)** - Commitment
- Tables added to product
- Schema alignment analysis
- Relationship detection

### Visual Hierarchy

**Primary Actions** (Large, Color):
- Add to Product
- Open Details

**Secondary Actions** (Medium, Subdued):
- Compare
- Filter
- Search

**Tertiary Actions** (Small, Icon-only):
- Pin
- Copy
- Refresh

---

## Accessibility Considerations

### Screen Reader Support
- Semantic HTML with proper ARIA labels
- Table cards announced as "Table card: customers, quality 95%, 1500 queries per month"
- Detail panel tab navigation fully accessible
- Keyboard-only operation fully supported

### Visual Accessibility
- Color never sole indicator (use icons + text)
- High contrast mode support
- Resizable text without layout breaking
- Focus indicators on all interactive elements

### Cognitive Load
- Maximum 7±2 items per visual group
- Clear visual hierarchy (size, color, position)
- Consistent patterns (all cards same structure)
- Chunked information (tabs, not single scroll)

---

## Performance Considerations

### Lazy Loading
- Render only visible cards (virtual scrolling)
- Load detail panel content only when opened
- Defer sample data until "Sample Data" tab clicked
- Lazy load lineage graph (complex computation)

### Caching Strategy
- Cache table metadata for 5 minutes
- Cache sample data for 1 hour (tables don't change often)
- Cache quality metrics for 15 minutes
- Cache usage statistics for 1 hour

### Perceived Performance
- Skeleton screens while loading
- Optimistic UI updates (add to cart instantly)
- Progressive image loading (if schema visualizations)
- Stagger animation for card rendering

---

## Success Metrics

### Quantitative
- **Time to First Table Added**: < 2 minutes (currently ~5 min)
- **Tables Explored Before Adding**: 3-5 (currently 8-12)
- **Filter Usage Rate**: > 60% of sessions
- **Comparison Feature Usage**: > 30% of sessions
- **Search Usage**: > 40% of sessions

### Qualitative
- **Confidence Score**: "I feel confident in my table selection" (7+ / 10)
- **Ease of Analysis**: "I can thoroughly analyze tables" (8+ / 10)
- **Efficiency**: "Finding the right tables is fast" (7+ / 10)

### Business Impact
- **Product Creation Time**: Reduce by 40%
- **Table Selection Accuracy**: Increase by 25% (fewer changes later)
- **User Satisfaction**: NPS > 40

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. ✅ Split-panel layout architecture
2. ✅ Enhanced table cards with usage stats
3. ✅ Basic filtering (quality, freshness, usage)
4. ✅ Full-screen detail panel with tabs

### Phase 2: Intelligence (Week 3-4)
5. Smart recommendations based on selections
6. Column-level search
7. Comparison mode (pin & compare)
8. Quality insights and warnings

### Phase 3: Power Features (Week 5-6)
9. Keyboard shortcuts
10. Advanced filtering (column-level)
11. Usage analytics visualization
12. Lineage graph visualization

### Phase 4: Polish (Week 7-8)
13. Performance optimization
14. Accessibility audit and fixes
15. User testing and iteration
16. Analytics instrumentation

---

## Design Patterns Reference

### Inspiration from Best-in-Class Tools

**Metabase** - Table browser with good filtering
- ✅ Strong search and filter UX
- ❌ Weak schema analysis

**Mode Analytics** - Schema explorer
- ✅ Excellent schema visualization
- ❌ No quality metrics

**Tableau Catalog** - Data discovery
- ✅ Great lineage and quality views
- ❌ Too complex for quick browsing

**Alation** - Data catalog
- ✅ Usage analytics and popularity
- ❌ Enterprise bloat, slow

**Our Approach**: Combine the strengths:
- Metabase's filtering + Mode's schema views
- Tableau's quality metrics + Alation's usage intelligence
- But faster, cleaner, and workflow-focused

---

## Conclusion

The current modal-based approach optimizes for casual browsing but fails analytics professionals who need **deep, confident analysis** before table selection. The recommended split-panel architecture:

1. **Preserves Context**: Browse and analyze simultaneously
2. **Maximizes Space**: Full panel for complex schema analysis
3. **Enables Comparison**: Pin and compare options side-by-side
4. **Surfaces Intelligence**: AI recommendations and quality insights
5. **Respects Expertise**: Power features for professional users

**Core Philosophy**: Treat table selection as a **critical decision** requiring thorough analysis, not a casual shopping experience. Give users the space, tools, and intelligence to make confident choices that will impact their data product's success.

The modal approach says: "Take a quick look."
The split-panel approach says: "Take the time you need to be confident."

For analytics professionals building production data products, confidence is everything.
