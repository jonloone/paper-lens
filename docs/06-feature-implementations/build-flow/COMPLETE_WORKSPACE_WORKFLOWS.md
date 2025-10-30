# Complete Workspace Workflows: Building Data Products End-to-End

**Date**: October 29, 2025
**Status**: Comprehensive Guide
**Purpose**: Document every step, action, and decision point for building data products in NexusOne

---

## Table of Contents

1. [Overview](#overview)
2. [Entry Points](#entry-points)
3. [Workspace Anatomy](#workspace-anatomy)
4. [Complete User Journeys](#complete-user-journeys)
5. [Component-by-Component Actions](#component-by-component-actions)
6. [Decision Trees](#decision-trees)
7. [Error States & Recovery](#error-states--recovery)
8. [Success Paths](#success-paths)

---

## Overview

Building a data product in NexusOne involves **5 major phases**:
1. **Entry** → Choose how to start (Intent, Template, Clone, Manual)
2. **Setup** → Select sources and define metadata
3. **Composition** → Write/generate SQL transformations
4. **Quality** → Configure quality gates and validation
5. **Deployment** → Add business context and activate

This document maps **every possible action** a user can take in each phase.

---

## Entry Points

### Entry Point 1: Intent-Based Entry

**Location**: `/build` → "Describe Your Need" tab

**User Action Flow**:
```
Step 1: Navigate to Build Page
  Action: Click "Build" in main navigation
  Result: Build page loads with 4 entry tabs visible

Step 2: Select Intent Entry
  Action: Click "Describe Your Need" tab
  Result: Intent input form appears

Step 3: Enter Business Intent
  Component: Large textarea with placeholder text
  User types: "I need to analyze customer churn patterns by identifying
              customers who haven't made a purchase in 90 days and group
              them by their last product category purchased"
  Helper text: "Describe what you want to accomplish in plain language"
  Character count: "247 / 1000 characters"

Step 4: Select Domain (Optional)
  Component: Domain dropdown
  Options: [Customer, Sales, Product, Operations, Finance, Marketing]
  User selects: "Customer"
  Result: Dropdown shows selected domain with badge

Step 5: Generate Recommendation
  Action: Click "Generate Recommendation" button
  Result:
    - Button shows loading spinner
    - Text changes to "Analyzing..."
    - Processing takes ~3-5 seconds

Step 6: Review AI Analysis
  Component: Intent Analysis Modal appears
  Modal contains:
    ┌─────────────────────────────────────────┐
    │ Intent Analysis                    [×]  │
    ├─────────────────────────────────────────┤
    │                                         │
    │ 📊 Recommended Product Type             │
    │ └─ Aggregate (Customer Segmentation)    │
    │                                         │
    │ 🗄️  Suggested Sources (3)               │
    │ ├─ production.customers                 │
    │ ├─ production.orders                    │
    │ └─ production.products                  │
    │                                         │
    │ 📝 Proposed Product Name                │
    │ └─ "Customer Churn Risk Analysis"       │
    │                                         │
    │ 💡 Key Transformations Detected         │
    │ ├─ Time-based filtering (90 days)      │
    │ ├─ Customer segmentation                │
    │ └─ Product category grouping            │
    │                                         │
    │ [Edit Analysis] [Accept & Continue →]  │
    └─────────────────────────────────────────┘

  User Actions:
    Option A: Click "Accept & Continue"
      → Workspace loads with:
         - Sources pre-selected (3 tables)
         - Product name pre-filled
         - Intent saved in context
         - createdFrom: 'intent'

    Option B: Click "Edit Analysis"
      → Returns to intent form with editable fields

    Option C: Click [×] to close
      → Returns to build page
```

**Data Captured**:
- `intent`: Full user description
- `domain`: Selected domain
- `suggestedSources`: AI-recommended tables
- `suggestedName`: AI-generated product name
- `createdFrom`: 'intent'

---

### Entry Point 2: Template-Based Entry

**Location**: `/build` → "Templates" tab

**User Action Flow**:
```
Step 1: Navigate to Templates Tab
  Action: Click "Templates" tab
  Result: Template gallery displays 12+ templates in grid layout

Step 2: Browse Templates
  Visual Layout: 3 columns × 4+ rows

  Each Template Card Shows:
    ┌────────────────────────┐
    │ [Icon] Template Name   │
    │ Brief description text │
    │ 📊 Use case badge      │
    │ ⏱️  15 min to deploy   │
    │ 🗄️  3 sources          │
    └────────────────────────┘

  Available Templates:
    1. Customer 360 View
       Description: "Complete customer profile with demographics, behavior, and transactions"
       Use case: Customer Analytics
       Sources: customers, orders, interactions

    2. Sales Performance Dashboard
       Description: "Track revenue, quota attainment, and pipeline health"
       Use case: Sales Analytics
       Sources: opportunities, accounts, users

    3. Product Returns Analysis
       Description: "Analyze return rates, reasons, and financial impact"
       Use case: Product Analytics
       Sources: orders, returns, products

    4. Marketing Attribution
       Description: "Multi-touch attribution model for campaign ROI"
       Use case: Marketing Analytics
       Sources: touchpoints, conversions, campaigns

    5. Inventory Optimization
       Description: "Stock levels, turnover rates, and reorder points"
       Use case: Operations
       Sources: inventory, orders, warehouses

    6. Financial Close Metrics
       Description: "Month-end close automation and variance analysis"
       Use case: Finance
       Sources: transactions, ledger, budget

    ... (6+ more templates)

Step 3: Select Template
  User hovers over "Customer 360 View" card
  Result: Card elevates, border highlights

  User clicks card
  Result: Template Preview Modal opens

Step 4: Review Template Preview
  Component: Template Preview Modal (large, detailed)

  Modal Layout:
    ┌──────────────────────────────────────────────────┐
    │ Customer 360 View                           [×]  │
    ├──────────────────────────────────────────────────┤
    │                                                  │
    │ [Tabs: Overview | SQL Preview | Quality Rules]  │
    │                                                  │
    │ ┌─ Overview Tab ─────────────────────────────┐  │
    │ │                                            │  │
    │ │ Description:                               │  │
    │ │ Create a comprehensive customer profile    │  │
    │ │ combining demographic data, purchase       │  │
    │ │ history, and engagement metrics.           │  │
    │ │                                            │  │
    │ │ 📊 What You'll Get:                        │  │
    │ │ ├─ Customer lifetime value (CLV)           │  │
    │ │ ├─ Recency, Frequency, Monetary (RFM)     │  │
    │ │ ├─ Engagement scores                       │  │
    │ │ └─ Demographic segments                    │  │
    │ │                                            │  │
    │ │ 🗄️  Data Sources (3):                      │  │
    │ │ ├─ production.customers                    │  │
    │ │ │  └─ Columns: id, name, email, created_at │  │
    │ │ ├─ production.orders                       │  │
    │ │ │  └─ Columns: id, customer_id, amount,    │  │
    │ │ │               order_date                 │  │
    │ │ └─ production.interactions                 │  │
    │ │    └─ Columns: id, customer_id, type,      │  │
    │ │                 timestamp                   │  │
    │ │                                            │  │
    │ │ ⏱️  Estimated Time: 15 minutes              │  │
    │ │ 📈 Success Rate: 94% (142 deployments)     │  │
    │ │                                            │  │
    │ └────────────────────────────────────────────┘  │
    │                                                  │
    │ [View Similar Templates] [Start Building →]     │
    └──────────────────────────────────────────────────┘

  User Actions:
    - Click "SQL Preview" tab: See template SQL code
    - Click "Quality Rules" tab: See pre-configured quality gates
    - Click "View Similar Templates": Browse related templates
    - Click "Start Building": Proceed to workspace
    - Click [×]: Close modal, return to gallery

Step 5: Start Building
  Action: Click "Start Building" button
  Result:
    - Modal closes with fade animation
    - Loading indicator: "Setting up your workspace..."
    - Workspace loads in ~1-2 seconds
    - Workspace state:
      ├─ Sources: Pre-selected (3 tables)
      ├─ SQL: Template SQL loaded
      ├─ Product name: Template name (editable)
      ├─ Quality rules: Template defaults
      └─ createdFrom: 'template'
```

**Data Captured**:
- `templateId`: Selected template identifier
- `templateName`: Template display name
- `selectedSources`: Template sources (pre-selected)
- `sql`: Template SQL skeleton
- `qualityRules`: Template quality defaults
- `createdFrom`: 'template'

---

### Entry Point 3: Clone Existing Product

**Location**: `/discover` → Product detail page → "Clone" button

**User Action Flow**:
```
Step 1: Navigate to Product Detail
  Starting point: /discover page
  Action: User browses data products
  User clicks: "Customer Lifetime Value" product card
  Result: Product detail page opens at /discover/product-123

Step 2: Review Product Details
  Page shows:
    - Product overview
    - SQL code (collapsible)
    - Quality metrics
    - Usage statistics
    - Business context

Step 3: Initiate Clone
  Location: Product detail header
  Action: Click "Clone" button (with copy icon)
  Result: Clone Analysis Modal appears

Step 4: Review Clone Analysis
  Component: Clone Analysis Modal

  Modal displays:
    ┌──────────────────────────────────────────────┐
    │ Clone: Customer Lifetime Value         [×]  │
    ├──────────────────────────────────────────────┤
    │                                              │
    │ 🔍 Smart Clone Analysis                      │
    │                                              │
    │ What We'll Copy:                             │
    │ ✓ SQL transformation logic (45 lines)       │
    │ ✓ Data sources (2): customers, orders       │
    │ ✓ Quality rules (5 rules)                   │
    │ ✓ Business context (optional)               │
    │                                              │
    │ What You'll Customize:                       │
    │ ├─ Product name (we'll add "Copy of")       │
    │ ├─ Domain assignment                         │
    │ ├─ Output location                           │
    │ └─ Schedule/SLA                              │
    │                                              │
    │ 💡 Suggestions for This Clone:               │
    │ ├─ Consider updating date filters           │
    │ ├─ Review source data freshness             │
    │ └─ Validate quality thresholds for new use  │
    │                                              │
    │ New Product Name:                            │
    │ [Copy of Customer Lifetime Value      ]     │
    │                                              │
    │ Select Domain:                               │
    │ [Customer ▼]                                 │
    │                                              │
    │ [Cancel] [Clone & Customize →]               │
    └──────────────────────────────────────────────┘

Step 5: Customize Clone Settings
  User Actions:
    - Edit product name: "Regional Customer LTV"
    - Select domain: "Sales"
    - Click "Clone & Customize"

  Result:
    - Modal closes
    - Loading: "Preparing your clone..."
    - Workspace loads with:
      ├─ Sources: Cloned (2 tables)
      ├─ SQL: Original SQL (editable)
      ├─ Product name: "Regional Customer LTV"
      ├─ Quality rules: Cloned rules
      ├─ Domain: "Sales"
      ├─ Business context: Optionally cloned
      └─ createdFrom: 'clone'
```

**Data Captured**:
- `clonedFromId`: Original product ID
- `clonedFromName`: Original product name
- `selectedSources`: Cloned sources
- `sql`: Cloned SQL (editable)
- `qualityRules`: Cloned quality rules
- `businessContext`: Optionally cloned
- `createdFrom`: 'clone'

---

### Entry Point 4: Manual Entry

**Location**: `/build` → "Start from Scratch" tab

**User Action Flow**:
```
Step 1: Navigate to Manual Entry
  Action: Click "Start from Scratch" tab
  Result: Manual entry form appears

Step 2: Fill Product Metadata
  Form fields:

    Product Name:
    [                                    ]
    Placeholder: "e.g., Sales Pipeline Analysis"

    Description (Optional):
    [                                    ]
    [                                    ]
    Placeholder: "Brief description of this data product"

    Domain:
    [Select domain ▼]
    Options: Customer, Sales, Product, Operations, Finance, Marketing

Step 3: Submit
  Action: Click "Continue" button
  Validation:
    - Product name required (min 3 characters)
    - Domain required
    - Description optional

  If valid:
    Result: Workspace loads with:
      ├─ Product name: User-entered
      ├─ Description: User-entered (if provided)
      ├─ Domain: User-selected
      ├─ Sources: Empty (user will select)
      ├─ SQL: Empty
      └─ createdFrom: 'manual'
```

**Data Captured**:
- `name`: User-entered product name
- `description`: Optional description
- `domain`: Selected domain
- `selectedSources`: [] (empty, to be selected)
- `sql`: '' (empty, to be written)
- `createdFrom`: 'manual'

---

## Workspace Anatomy

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER (Fixed)                                                      │
│ ┌─────┬─────────────────────────────────────────┬─────────────────┐│
│ │[←]  │ [Icon] Editable Product Name            │ [Badges] [Save] ││
│ └─────┴─────────────────────────────────────────┴─────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│ VIEW SWITCHER (Conditional: when sources selected)                 │
│                    [ Chat | Editor | Results ]                     │
├─────────────────────────────────────────────────────────────────────┤
│ BUSINESS CONTEXT PANEL (Collapsible)                               │
│ ▼ Business Context  [1 objective] [2 metrics] [3 questions]        │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ [Tabs: Objectives | Metrics | Questions]                        ││
│ │ ... context forms ...                                           ││
│ └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│ MAIN CONTENT AREA (Full height, scrollable)                        │
│                                                                     │
│ IF (no sources selected):                                          │
│   → SOURCE SELECTION INTERFACE                                     │
│                                                                     │
│ ELSE IF (sources selected):                                        │
│   CURRENT VIEW === 'chat':                                         │
│     → TiSQL ARTIFACT CHAT                                          │
│   CURRENT VIEW === 'editor':                                       │
│     → SQL EDITOR VIEW                                              │
│   CURRENT VIEW === 'results':                                      │
│     → RESULTS VIEW                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                                        ┌──────────────┐
                                                        │ FLOATING BAR │
                                                        │ [Save Draft] │
                                                        │ [Activate]   │
                                                        └──────────────┘
```

---

## Complete User Journeys

### Journey 1: Senior Data Engineer - Template to Production

**Persona**: Sarah, 8 years experience, expert in SQL

**Scenario**: Create a customer segmentation data product for marketing team

**Complete Action Sequence**:

```
════════════════════════════════════════════════════════════════════
PHASE 1: ENTRY (Template)
════════════════════════════════════════════════════════════════════

[00:00] Navigate to /build
  → Screen: Build page with 4 tabs

[00:02] Click "Templates" tab
  → Screen: Template gallery (12 templates visible)

[00:05] Scroll down to find relevant template
  → Action: Mouse scroll
  → Sees: "Customer Segmentation" template (row 2, column 3)

[00:08] Hover over "Customer Segmentation" card
  → Visual: Card elevates, border highlights blue

[00:09] Click card
  → Screen: Template Preview Modal opens
  → Display time: 200ms fade-in

[00:10] Review modal - "Overview" tab (default)
  → Reads: Description, sources (3 tables), estimated time (15 min)

[00:15] Click "SQL Preview" tab
  → Screen: SQL code block appears (45 lines)
  → Action: Scrolls through SQL
  → Assessment: "Good starting point, will need RFM adjustments"

[00:22] Click "Start Building" button
  → Modal: Closes with fade-out
  → Loading: "Setting up your workspace..." (1.5 seconds)

[00:24] Workspace loads

════════════════════════════════════════════════════════════════════
PHASE 2: WORKSPACE INITIAL STATE
════════════════════════════════════════════════════════════════════

[00:24] Workspace Layout:
  ┌─────────────────────────────────────────────────────────────────┐
  │ HEADER                                                          │
  │ [← Back] [📦] Customer Segmentation [Template] [3 sources]      │
  ├─────────────────────────────────────────────────────────────────┤
  │ VIEW SWITCHER                                                   │
  │           [ Chat (active) | Editor | Results ]                 │
  ├─────────────────────────────────────────────────────────────────┤
  │ BUSINESS CONTEXT (collapsed)                                    │
  │ ▶ Business Context                                              │
  ├─────────────────────────────────────────────────────────────────┤
  │ MAIN CONTENT: TiSQL ARTIFACT CHAT                               │
  │                                                                 │
  │ 💬 Pattern Suggestions (3):                                     │
  │ ┌───────────────────────────────────────────────────────────┐  │
  │ │ 1. RFM Analysis (Recency, Frequency, Monetary)           │  │
  │ │ 2. Customer Lifecycle Stages                             │  │
  │ │ 3. High-Value Customer Identification                    │  │
  │ └───────────────────────────────────────────────────────────┘  │
  │                                                                 │
  │ Template SQL has been loaded. Click a pattern above or ask     │
  │ me to customize the analysis.                                  │
  │                                                                 │
  │ [Type your message...]                               [Send]    │
  └─────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════
PHASE 3: SQL REVIEW & EDITING
════════════════════════════════════════════════════════════════════

[00:26] Sarah's thought: "I want to see the template SQL first"

[00:27] Action: Click "Editor" in View Switcher
  → Screen: Switches to Editor view (instant transition)
  → View: SQL Editor with template SQL loaded

[00:28] Editor View Layout:
  ┌─────────────────────────────────────────────────────────────────┐
  │ TOOLBAR                                                         │
  │ [Code] SQL Editor [Direct Edit]  [3 sources] [Last run: --]    │
  │                              [Format] [Run Query]               │
  ├─────────────────────────────────────────────────────────────────┤
  │ TiSQL EDITOR                                                    │
  │                                                                 │
  │   1  SELECT                                                     │
  │   2    c.customer_id,                                          │
  │   3    c.customer_name,                                        │
  │   4    c.customer_email,                                       │
  │   5    -- Recency: Days since last order                       │
  │   6    DATEDIFF(day, MAX(o.order_date), CURRENT_DATE) as ...  │
  │   7    -- Frequency: Number of orders                          │
  │   8    COUNT(DISTINCT o.order_id) as frequency,                │
  │   9    -- Monetary: Total spent                                │
  │  10    SUM(o.order_amount) as monetary_value,                  │
  │  11    -- Customer tenure                                      │
  │  12    DATEDIFF(day, c.created_at, CURRENT_DATE) as tenure ... │
  │  13  FROM production.customers c                               │
  │  14  LEFT JOIN production.orders o ON c.customer_id = ...     │
  │  15  WHERE c.status = 'active'                                 │
  │  16  GROUP BY c.customer_id, c.customer_name, c.customer_e...  │
  │  17  ORDER BY monetary_value DESC                              │
  │  18  LIMIT 1000                                                │
  │                                                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │ HELPER TEXT                                                     │
  │ 💡 Tip: Cmd+S to save, Cmd+Enter to run      [18 lines, 654ch] │
  └─────────────────────────────────────────────────────────────────┘

[00:30] Sarah reviews SQL
  → Action: Scrolls through code
  → Assessment: "Need to add RFM scoring logic"

[00:35] Sarah makes edits (Direct typing in editor):

  Edit 1: Add RFM Score Calculations
  Position: After line 12
  Types:
    13    -- RFM Scoring (1-5 scale)
    14    CASE
    15      WHEN DATEDIFF(...) <= 30 THEN 5
    16      WHEN DATEDIFF(...) <= 90 THEN 4
    17      WHEN DATEDIFF(...) <= 180 THEN 3
    18      WHEN DATEDIFF(...) <= 365 THEN 2
    19      ELSE 1
    20    END as recency_score,
    21    CASE
    22      WHEN COUNT(DISTINCT o.order_id) >= 20 THEN 5
    23      WHEN COUNT(DISTINCT o.order_id) >= 10 THEN 4
    24      WHEN COUNT(DISTINCT o.order_id) >= 5 THEN 3
    25      WHEN COUNT(DISTINCT o.order_id) >= 2 THEN 2
    26      ELSE 1
    27    END as frequency_score,
    28    CASE
    29      WHEN SUM(o.order_amount) >= 10000 THEN 5
    30      WHEN SUM(o.order_amount) >= 5000 THEN 4
    31      WHEN SUM(o.order_amount) >= 2000 THEN 3
    32      WHEN SUM(o.order_amount) >= 500 THEN 2
    33      ELSE 1
    34    END as monetary_score,

  → Autocomplete activates on typing
  → Syntax highlighting updates in real-time
  → Character count updates: 654 → 1,247 characters

[01:15] Edit 2: Add Segment Classification
  Position: After last CASE block
  Types:
    35    -- Overall RFM Segment
    36    CASE
    37      WHEN (r_score + f_score + m_score) >= 13 THEN 'Champions'
    38      WHEN (r_score + f_score + m_score) >= 10 THEN 'Loyal'
    39      WHEN (r_score + f_score + m_score) >= 7 THEN 'Potential'
    40      WHEN r_score >= 4 THEN 'New Customers'
    41      WHEN m_score >= 4 THEN 'Big Spenders'
    42      ELSE 'At Risk'
    43    END as customer_segment

[01:45] Edit 3: Update WHERE clause for data quality
  Position: Line 15 (original)
  Changes:
    FROM: WHERE c.status = 'active'
    TO:   WHERE c.status = 'active'
          AND c.email IS NOT NULL
          AND c.created_at >= '2022-01-01'

[01:52] Edit 4: Add CTE for cleaner structure
  Position: Beginning of query
  Types:
    WITH customer_metrics AS (
      ... [moves all previous SELECT logic here]
    )
    SELECT
      customer_id,
      customer_name,
      customer_email,
      recency_score,
      frequency_score,
      monetary_score,
      customer_segment,
      monetary_value,
      frequency as order_count
    FROM customer_metrics
    ORDER BY
      CASE customer_segment
        WHEN 'Champions' THEN 1
        WHEN 'Loyal' THEN 2
        WHEN 'Potential' THEN 3
        WHEN 'New Customers' THEN 4
        WHEN 'Big Spenders' THEN 5
        ELSE 6
      END,
      monetary_value DESC

[02:30] Final SQL: 67 lines (up from 18)

[02:32] Action: Click "Format" button
  → Result: SQL auto-formats with consistent indentation
  → Visual feedback: Brief highlight of changed lines

[02:35] Action: Click "Run Query" button
  → Toolbar: "Run Query" button disabled, shows spinner
  → Toolbar text: "Running..." (replaces "Run Query")
  → Status: Backend executing query

════════════════════════════════════════════════════════════════════
PHASE 4: RESULTS VALIDATION
════════════════════════════════════════════════════════════════════

[02:38] Query completes (3 seconds execution)
  → View: Auto-switches to Results view
  → Transition: Smooth fade (200ms)

[02:38] Results View Layout:
  ┌─────────────────────────────────────────────────────────────────┐
  │ RESULTS HEADER                                                  │
  │ [Table] Query Results    [1,247 rows] [423ms]                  │
  │                              [Copy CSV] [Export CSV]            │
  ├─────────────────────────────────────────────────────────────────┤
  │ RESULTS TABLE (scrollable)                                      │
  │                                                                 │
  │ customer_id │ customer_name │ email          │ recency_sc... │ │
  │─────────────┼───────────────┼────────────────┼──────────────...│ │
  │ cust_10231  │ Acme Corp     │ acme@corp.com  │ 5            │ │
  │ cust_89234  │ Widget Inc    │ widget@inc.com │ 5            │ │
  │ cust_45621  │ Global LLC    │ global@llc.com │ 4            │ │
  │ ...         │ ...           │ ...            │ ...          │ │
  │                                                                 │
  │ [Showing 1,247 rows, scroll for more]                          │
  └─────────────────────────────────────────────────────────────────┘

[02:40] Sarah reviews results:
  → Action: Scrolls down through table
  → Checks: customer_segment distribution
  → Validates: RFM scores look correct
  → Spots: A few null email addresses (expected from WHERE clause)

[02:55] Sarah wants to validate segment distribution
  → Thought: "How many customers in each segment?"

[02:57] Action: Switch back to Editor view
  → Clicks: "Editor" in View Switcher
  → Result: Returns to SQL Editor (SQL preserved)

[02:58] Action: Add diagnostic query
  → Scrolls to bottom
  → Adds comment: -- Segment distribution check
  → Wraps main query in CTE
  → Adds:
    SELECT
      customer_segment,
      COUNT(*) as customer_count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
    FROM customer_metrics_final
    GROUP BY customer_segment
    ORDER BY customer_count DESC

[03:15] Action: Click "Run Query"
  → Result: Re-executes with new aggregation
  → Switches to Results view

[03:18] Results show segment distribution:
  ┌───────────────────┬─────────────────┬────────────┐
  │ customer_segment  │ customer_count  │ percentage │
  ├───────────────────┼─────────────────┼────────────┤
  │ Loyal             │ 423             │ 33.92%     │
  │ Potential         │ 312             │ 25.02%     │
  │ Champions         │ 201             │ 16.12%     │
  │ At Risk           │ 156             │ 12.51%     │
  │ New Customers     │ 98              │ 7.86%      │
  │ Big Spenders      │ 57              │ 4.57%      │
  └───────────────────┴─────────────────┴────────────┘

[03:25] Sarah: "Perfect distribution. Ready for quality gates."

[03:28] Action: Click "Export CSV" button
  → Browser downloads: customer_segments_preview.csv
  → Purpose: Share with marketing team for validation

════════════════════════════════════════════════════════════════════
PHASE 5: BUSINESS CONTEXT
════════════════════════════════════════════════════════════════════

[03:35] Sarah scrolls up to Business Context section

[03:37] Action: Click "▶ Business Context" to expand
  → Visual: Section expands with slide-down animation (300ms)
  → Shows: Tabs (Objectives | Metrics | Questions)
  → Default: Objectives tab active

[03:38] Business Context Panel Layout:
  ┌─────────────────────────────────────────────────────────────────┐
  │ ▼ Business Context                                              │
  │                                                                 │
  │ [ Objectives | Metrics | Questions ]                           │
  │                                                                 │
  │ ┌─ Objectives Tab ──────────────────────────────────────────┐  │
  │ │                                                            │  │
  │ │ No objectives added yet.                                  │  │
  │ │                                                            │  │
  │ │ [+ Add Business Objective]                                │  │
  │ └────────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────┘

[03:40] Action: Click "+ Add Business Objective" button
  → Result: Objective form appears inline

[03:41] Objective Form Layout:
  ┌────────────────────────────────────────────────────────────────┐
  │ Add Business Objective                                    [×]  │
  ├────────────────────────────────────────────────────────────────┤
  │                                                                │
  │ Objective Title *                                              │
  │ [                                                          ]   │
  │                                                                │
  │ Description *                                                  │
  │ [                                                          ]   │
  │ [                                                          ]   │
  │ [                                                          ]   │
  │                                                                │
  │ Priority *                                                     │
  │ [ High ▼ ]                                                     │
  │                                                                │
  │ Stakeholders (comma-separated)                                 │
  │ [                                                          ]   │
  │                                                                │
  │ Target Date (optional)                                         │
  │ [Select date ▼]                                                │
  │                                                                │
  │                              [Cancel] [Add Objective]          │
  └────────────────────────────────────────────────────────────────┘

[03:43] Sarah fills form:
  Title: "Increase customer retention through targeted campaigns"
  Description: "Use RFM segmentation to identify high-value customers
                at risk of churn and engage them with personalized
                retention campaigns. Target 15% improvement in
                retention rate for Champions and Loyal segments."
  Priority: High
  Stakeholders: "CMO, VP Marketing, Customer Success Director"
  Target Date: "2025-12-31"

[04:15] Action: Click "Add Objective" button
  → Result: Form closes, objective card appears
  → Visual: Fade-in animation

[04:16] Objective Card Display:
  ┌────────────────────────────────────────────────────────────────┐
  │ 🎯 Increase customer retention through targeted campaigns      │
  │ [High Priority] [Due: Dec 31, 2025]                      [✎][×]│
  ├────────────────────────────────────────────────────────────────┤
  │ Use RFM segmentation to identify high-value customers at      │
  │ risk of churn and engage them with personalized retention...  │
  │                                                     [Read more] │
  │                                                                │
  │ 👥 Stakeholders: CMO, VP Marketing, Customer Success Director │
  └────────────────────────────────────────────────────────────────┘

[04:20] Sarah switches to Metrics tab
  → Action: Click "Metrics" tab
  → Result: Tab content switches

[04:21] Action: Click "+ Add Business Metric"
  → Result: Metric form appears

[04:22] Metric Form Layout:
  ┌────────────────────────────────────────────────────────────────┐
  │ Add Business Metric                                       [×]  │
  ├────────────────────────────────────────────────────────────────┤
  │                                                                │
  │ Metric Name *                                                  │
  │ [                                                          ]   │
  │                                                                │
  │ Definition *                                                   │
  │ [                                                          ]   │
  │ [                                                          ]   │
  │                                                                │
  │ Unit *                                                         │
  │ [%            ] (e.g., %, count, USD, days)                   │
  │                                                                │
  │ Current Value           Target Value                           │
  │ [              ]        [              ]                       │
  │                                                                │
  │ Measurement Frequency                                          │
  │ [ Monthly ▼ ]                                                  │
  │                                                                │
  │ Trend                                                          │
  │ [ On Track ▼ ] (Exceeding, On Track, Needs Improvement, ...)  │
  │                                                                │
  │                               [Cancel] [Add Metric]            │
  └────────────────────────────────────────────────────────────────┘

[04:25] Sarah adds two metrics:

  Metric 1:
    Name: "Customer Retention Rate (Champions)"
    Definition: "Percentage of Champions segment customers who remain
                 active and make at least one purchase in 90 days"
    Unit: "%"
    Current: "78"
    Target: "90"
    Frequency: Monthly
    Trend: Needs Improvement

  Metric 2:
    Name: "At-Risk Customer Recovery Rate"
    Definition: "Percentage of At-Risk segment customers re-engaged
                 through targeted campaigns within 30 days"
    Unit: "%"
    Current: "32"
    Target: "50"
    Frequency: Weekly
    Trend: Needs Improvement

[05:10] Both metrics added, cards visible

[05:12] Sarah switches to Questions tab
  → Action: Click "Questions" tab

[05:13] Action: Click "+ Add Business Question"
  → Result: Question form appears

[05:14] Question Form Layout:
  ┌────────────────────────────────────────────────────────────────┐
  │ Add Business Question                                     [×]  │
  ├────────────────────────────────────────────────────────────────┤
  │                                                                │
  │ Question *                                                     │
  │ [                                                          ]   │
  │ [                                                          ]   │
  │                                                                │
  │ Personas (who needs this answer?)                              │
  │ [                                                          ]   │
  │ (comma-separated: e.g., Data Analyst, CMO, Product Manager)   │
  │                                                                │
  │ Priority                                                       │
  │ [ High ▼ ]                                                     │
  │                                                                │
  │                               [Cancel] [Add Question]          │
  └────────────────────────────────────────────────────────────────┘

[05:16] Sarah adds three questions:

  Question 1:
    Question: "Which customers in the Champions segment are showing
               early signs of churn (declining RFM scores)?"
    Personas: "Customer Success Manager, Retention Team"
    Priority: High

  Question 2:
    Question: "What product categories do At-Risk customers purchase
               most frequently before churning?"
    Personas: "Product Manager, Marketing Analyst"
    Priority: Medium

  Question 3:
    Question: "What is the expected revenue impact if we improve
               retention rate by 15% in Loyal and Champions segments?"
    Personas: "CFO, VP Marketing"
    Priority: High

[06:00] All business context added
  → Summary: 1 objective, 2 metrics, 3 questions

[06:02] Sarah collapses Business Context panel
  → Action: Click "▼ Business Context"
  → Result: Panel collapses with slide-up animation

════════════════════════════════════════════════════════════════════
PHASE 6: QUALITY REVIEW (Optional - in Chat View)
════════════════════════════════════════════════════════════════════

[06:05] Sarah wants to review quality gates
  → Thought: "Let me check quality metrics before deploying"

[06:07] Action: Click "Chat" in View Switcher
  → Result: Returns to Chat view
  → Display: Shows previous conversation + artifact cards

[06:08] Chat View shows:
  ┌─────────────────────────────────────────────────────────────────┐
  │ 💬 CHAT MESSAGES                                                │
  │                                                                 │
  │ You: [Initial template load]                                   │
  │ Assistant: Template SQL loaded. Ready to customize.            │
  │                                                                 │
  │ [SQL executed - switched to Editor view]                       │
  │ [SQL edited]                                                   │
  │ [SQL executed - switched to Results view]                      │
  │                                                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │ 📊 RESULTS ARTIFACT CARD                                        │
  │ ┌───────────────────────────────────────────────────────────┐  │
  │ │ Query Results                                        [▼]  │  │
  │ │ 1,247 rows • 423ms • Last run: 2 minutes ago             │  │
  │ │                                                           │  │
  │ │ [Mini table preview: 5 rows × 6 columns]                 │  │
  │ │                                                           │  │
  │ │ Quality Summary:                                          │  │
  │ │ ✓ Completeness: 98.5% (1,228 / 1,247)                    │  │
  │ │ ✓ Uniqueness: 100% (customer_id)                         │  │
  │ │ ✓ Validity: 99.2% (email format)                         │  │
  │ │ ⚠ Timeliness: No timestamp check                         │  │
  │ │                                                           │  │
  │ │ [View Full Results] [Configure Thresholds]               │  │
  │ └───────────────────────────────────────────────────────────┘  │
  ├─────────────────────────────────────────────────────────────────┤
  │ 🎯 QUALITY GATES CARD                                           │
  │ ┌───────────────────────────────────────────────────────────┐  │
  │ │ Quality Gates                                        [▼]  │  │
  │ │                                                           │  │
  │ │ 5 quality rules configured:                               │  │
  │ │ ✓ Completeness (customer_id): >= 100%                    │  │
  │ │ ✓ Completeness (email): >= 95%                           │  │
  │ │ ✓ Uniqueness (customer_id): >= 100%                      │  │
  │ │ ✓ Validity (email format): >= 95%                        │  │
  │ │ ✓ Range check (RFM scores 1-5): >= 100%                  │  │
  │ │                                                           │  │
  │ │ [Configure Thresholds] [Add Custom Rule]                 │  │
  │ └───────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────┘

[06:10] Sarah reviews quality gates:
  → Reads: 5 rules configured (from template)
  → Assessment: "Looks good, but want to add freshness check"

[06:12] Action: Click "Add Custom Rule" button in Quality Gates Card
  → Result: Custom rule form appears in modal

[06:13] Custom Rule Form:
  ┌────────────────────────────────────────────────────────────────┐
  │ Add Custom Quality Rule                                   [×]  │
  ├────────────────────────────────────────────────────────────────┤
  │                                                                │
  │ Rule Type                                                      │
  │ [ Freshness ▼ ]                                                │
  │ (Completeness, Uniqueness, Validity, Range, Freshness, ...)   │
  │                                                                │
  │ Column / Metric                                                │
  │ [ Select column ▼ ]                                            │
  │                                                                │
  │ Threshold                                                      │
  │ Data must be updated within [ 24 ] [ hours ▼ ]                │
  │                                                                │
  │ Severity                                                       │
  │ [ Warning ▼ ] (Error will block deployment)                    │
  │                                                                │
  │                               [Cancel] [Add Rule]              │
  └────────────────────────────────────────────────────────────────┘

[06:15] Sarah fills form:
  Rule Type: Freshness
  Column: (not applicable for freshness)
  Threshold: "24 hours"
  Severity: Warning

[06:18] Action: Click "Add Rule" button
  → Result: Rule added to Quality Gates Card
  → Display: Now shows 6 quality rules

════════════════════════════════════════════════════════════════════
PHASE 7: DEPLOYMENT
════════════════════════════════════════════════════════════════════

[06:20] Sarah ready to deploy
  → Scrolls down to see floating action bar

[06:22] Floating Action Bar visible (bottom-right):
  ┌──────────────────────────┐
  │ [Save Draft]  [Activate] │
  └──────────────────────────┘

[06:23] Action: Click "Activate Product" button
  → Validation: System checks requirements
    ✓ Product name: "Customer Segmentation" (valid)
    ✓ SQL: 67 lines (valid)
    ✓ Sources: 3 selected (valid)
    ✓ Business context: 1 objective, 2 metrics, 3 questions (exists)

  → Result: Stakeholder Review Modal opens

[06:24] Stakeholder Review Modal:
  ┌──────────────────────────────────────────────────────────────────┐
  │ ✓ Review Business Context                                   [×] │
  ├──────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │ Please review the business context before activating this       │
  │ data product. Confirm that all objectives, metrics, and         │
  │ questions are accurate.                                          │
  │                                                                  │
  │ ┌────────────────────────────────────────────────────────────┐  │
  │ │ 🎯 Business Objectives (1)                                 │  │
  │ │                                                            │  │
  │ │ ┌──────────────────────────────────────────────────────┐  │  │
  │ │ │ Increase customer retention through targeted camp... │  │  │
  │ │ │ [High Priority] [Due: Dec 31, 2025]                 │  │  │
  │ │ │ Use RFM segmentation to identify high-value...      │  │  │
  │ │ │ 👥 CMO, VP Marketing, Customer Success Director     │  │  │
  │ │ └──────────────────────────────────────────────────────┘  │  │
  │ └────────────────────────────────────────────────────────────┘  │
  │                                                                  │
  │ ┌────────────────────────────────────────────────────────────┐  │
  │ │ 📈 Business Metrics (2)                                    │  │
  │ │                                                            │  │
  │ │ ┌──────────────────────────────────────────────────────┐  │  │
  │ │ │ Customer Retention Rate (Champions)                  │  │  │
  │ │ │ Current: 78% → Target: 90%                           │  │  │
  │ │ │ [Needs Improvement] [Monthly]                        │  │  │
  │ │ └──────────────────────────────────────────────────────┘  │  │
  │ │                                                            │  │
  │ │ ┌──────────────────────────────────────────────────────┐  │  │
  │ │ │ At-Risk Customer Recovery Rate                       │  │  │
  │ │ │ Current: 32% → Target: 50%                           │  │  │
  │ │ │ [Needs Improvement] [Weekly]                         │  │  │
  │ │ └──────────────────────────────────────────────────────┘  │  │
  │ └────────────────────────────────────────────────────────────┘  │
  │                                                                  │
  │ ┌────────────────────────────────────────────────────────────┐  │
  │ │ ❓ Business Questions (3)                                  │  │
  │ │                                                            │  │
  │ │ 1. Which customers in the Champions segment are show...  │  │
  │ │    [High] • Customer Success Manager, Retention Team     │  │
  │ │                                                            │  │
  │ │ 2. What product categories do At-Risk customers purc...  │  │
  │ │    [Medium] • Product Manager, Marketing Analyst         │  │
  │ │                                                            │  │
  │ │ 3. What is the expected revenue impact if we impro...    │  │
  │ │    [High] • CFO, VP Marketing                            │  │
  │ └────────────────────────────────────────────────────────────┘  │
  │                                                                  │
  │                        [← Go Back to Edit] [Confirm & Activate] │
  └──────────────────────────────────────────────────────────────────┘

[06:28] Sarah reviews summary:
  → Reads: All objectives, metrics, questions
  → Assessment: "Looks correct"

[06:35] Action: Click "Confirm & Activate" button
  → Result: Modal closes
  → Deployment starts

[06:36] Deployment Progress Overlay:
  ┌──────────────────────────────────────────────────────────────────┐
  │ ████████████████░░░░░░░░░░░░ 65%                                │
  ├──────────────────────────────────────────────────────────────────┤
  │ ⏳ Activating Customer Segmentation...                          │
  │                                                                  │
  │ Setting up data product...                                      │
  └──────────────────────────────────────────────────────────────────┘

  Progress states (auto-updating every 500ms):
  [06:36] 0%   - Checking data quality...
  [06:38] 25%  - Checking data quality...
  [06:40] 45%  - Setting up data product...
  [06:43] 65%  - Setting up data product...
  [06:46] 85%  - Activating product...
  [06:48] 95%  - Activating product...
  [06:50] 100% - Ready to use...

[06:50] Deployment completes
  → Progress bar: 100%
  → Hold at 100% for 1 second
  → Navigate to success page

════════════════════════════════════════════════════════════════════
PHASE 8: SUCCESS STATE
════════════════════════════════════════════════════════════════════

[06:51] Success Page:
  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │                          ✅                                      │
  │                                                                  │
  │              Data Product Activated Successfully!               │
  │                                                                  │
  │              Customer Segmentation is now live                  │
  │                                                                  │
  │  ┌────────────────────────────────────────────────────────────┐ │
  │  │ Product URL:                                               │ │
  │  │ iceberg.customer.customer_segmentation                     │ │
  │  │                                            [Copy] [Query]  │ │
  │  └────────────────────────────────────────────────────────────┘ │
  │                                                                  │
  │  What's Next:                                                   │
  │  • View in Discover: See product details and usage             │
  │  • Query Data: Connect via Trino/dbt                           │
  │  • Monitor: Track quality and usage metrics                    │
  │                                                                  │
  │         [View in Discover]  [Build Another]  [Go Home]         │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘

[06:55] Sarah clicks "View in Discover"
  → Navigate to: /discover/customer_segmentation
  → Product detail page loads

════════════════════════════════════════════════════════════════════
END OF JOURNEY
════════════════════════════════════════════════════════════════════

Total Time: 6 minutes 55 seconds
View Switches: 6 times (Chat → Editor → Results → Editor → Results → Chat → Editor)
Actions: 42 distinct user actions
SQL Iterations: 4 edits
Business Context Items: 6 (1 objective, 2 metrics, 3 questions)
Result: ✅ Production data product deployed
```

---

## Component-by-Component Actions

### Component 1: Header (Always Visible)

**Location**: Top of workspace, fixed position

**Elements**:
1. Back button (←)
2. Product icon (📦)
3. Editable product name
4. Badges (domain, creation method, source count)
5. Auto-save indicator

**Actions Available**:

```
ACTION: Click Back Button
  Trigger: Click [← Back]
  Behavior:
    - If changes exist:
      → Show confirmation dialog:
        "You have unsaved changes. Save draft before leaving?"
        [Don't Save] [Save Draft] [Cancel]
    - If no changes OR user confirms:
      → Navigate to /build
  State Changes: None (unless draft saved)

ACTION: Edit Product Name
  Trigger: Click on product name text
  Behavior:
    - Text field becomes editable (border appears)
    - Pencil icon appears on hover
    - User can type new name
    - Changes auto-save after 2 seconds of inactivity
  Validation:
    - Min 3 characters
    - Max 100 characters
    - No special characters except: - _ ( )
  State Changes:
    - productData.name updates
    - Auto-save triggers
    - Last save time updates

ACTION: View Badge Details
  Trigger: Hover over badge
  Behavior:
    - Tooltip appears with full information
    Examples:
      Domain badge: Shows full domain path
      Source count: Shows source names in tooltip
      Creation method: Shows original template/intent
  State Changes: None (read-only)
```

---

### Component 2: View Switcher

**Location**: Below header, above business context (only visible when sources selected)

**Elements**:
1. Chat button
2. Editor button (disabled until SQL exists)
3. Results button (disabled until results exist)

**Actions Available**:

```
ACTION: Switch to Chat View
  Trigger: Click "Chat" button
  Pre-conditions: None (always available when sources selected)
  Behavior:
    - Button becomes active (highlighted)
    - Other buttons become inactive
    - Main content area switches to TiSQLArtifactChat component
    - Transition: Instant (no animation)
  State Changes:
    - currentView = 'chat'
  Use Cases:
    - Generate SQL via AI
    - Ask questions about data
    - Refine transformations via natural language
    - View quality gates and results artifacts

ACTION: Switch to Editor View
  Trigger: Click "Editor" button
  Pre-conditions: SQL must exist (productData.sql !== '')
  If disabled:
    - Tooltip: "Generate SQL first to enable editor"
    - Click has no effect
  If enabled:
    Behavior:
      - Button becomes active
      - Other buttons become inactive
      - Main content switches to SQLEditorView component
      - SQL loaded into TiSQLEditor
      - Cursor positioned at end of SQL
  State Changes:
    - currentView = 'editor'
  Use Cases:
    - Direct SQL editing
    - Fine-tune AI-generated SQL
    - Add comments or documentation
    - Format SQL code
    - Execute queries

ACTION: Switch to Results View
  Trigger: Click "Results" button
  Pre-conditions: Results must exist (productData.previewResult !== null)
  If disabled:
    - Tooltip: "Execute SQL first to see results"
    - Click has no effect
  If enabled:
    Behavior:
      - Button becomes active
      - Badge shows row count (e.g., "1.2K")
      - Main content switches to ResultsView component
      - Results table rendered
  State Changes:
    - currentView = 'results'
  Use Cases:
    - Validate query results
    - Export data (CSV)
    - Review quality metrics
    - Check data distribution
```

---

### Component 3: Business Context Panel

**Location**: Below view switcher, above main content, collapsible

**Elements**:
1. Collapse/expand button
2. Badge counts (objectives, metrics, questions)
3. Three tabs: Objectives | Metrics | Questions
4. Add buttons for each type

**Actions Available**:

```
ACTION: Expand/Collapse Panel
  Trigger: Click "▶ Business Context" or "▼ Business Context"
  Behavior:
    - If collapsed:
      → Icon changes: ▶ to ▼
      → Panel slides down (300ms animation)
      → Shows tab content
    - If expanded:
      → Icon changes: ▼ to ▶
      → Panel slides up (300ms animation)
      → Hides tab content (only header visible)
  State Changes:
    - showBusinessContext toggles
  Persistence: State saved in session storage

ACTION: Switch Tabs
  Trigger: Click "Objectives" | "Metrics" | "Questions"
  Behavior:
    - Active tab highlighted
    - Tab content switches instantly
    - Scroll position resets to top
  State Changes:
    - activeBusinessContextTab updates

ACTION: Add Business Objective
  Location: Objectives tab
  Trigger: Click "+ Add Business Objective"
  Behavior:
    - Inline form appears with slide-down animation
    - Form fields:
      * Objective Title (required)
      * Description (required, multi-line)
      * Priority (dropdown: High, Medium, Low)
      * Stakeholders (comma-separated text)
      * Target Date (date picker, optional)
  Form Validation:
    - Title: 10-200 characters
    - Description: 50-1000 characters
    - Priority: Must select one
  On Submit:
    - Form closes with fade-out
    - Objective card appears with fade-in
    - Badge count increments
    - Auto-save triggers
  State Changes:
    - businessObjectives array adds new item
    - objective_id generated (UUID)

ACTION: Edit Business Objective
  Location: Objective card
  Trigger: Click [✎] icon on card
  Behavior:
    - Card expands to show edit form
    - All fields editable
    - [Save] [Cancel] buttons appear
  On Save:
    - Card collapses back
    - Updated content displays
    - Auto-save triggers
  State Changes:
    - Objective item in array updates

ACTION: Delete Business Objective
  Location: Objective card
  Trigger: Click [×] icon on card
  Behavior:
    - Confirmation dialog:
      "Remove this objective?"
      [Cancel] [Remove]
    - If confirmed:
      → Card fades out (200ms)
      → Badge count decrements
      → Auto-save triggers
  State Changes:
    - Objective removed from array

ACTION: Add Business Metric
  Location: Metrics tab
  Trigger: Click "+ Add Business Metric"
  Behavior:
    - Inline form appears
    - Form fields:
      * Metric Name (required)
      * Definition (required, multi-line)
      * Unit (required, text: %, count, USD, etc.)
      * Current Value (number)
      * Target Value (number)
      * Measurement Frequency (dropdown)
      * Trend (dropdown)
  Form Validation:
    - Name: 5-100 characters
    - Definition: 20-500 characters
    - Values: Must be numbers
  On Submit:
    - Form closes
    - Metric card appears
    - Badge count increments
  State Changes:
    - businessMetrics array adds new item
    - metric_id generated

ACTION: Add Business Question
  Location: Questions tab
  Trigger: Click "+ Add Business Question"
  Behavior:
    - Inline form appears
    - Form fields:
      * Question (required, multi-line)
      * Personas (comma-separated)
      * Priority (dropdown)
  On Submit:
    - Form closes
    - Question card appears
    - Badge count increments
  State Changes:
    - businessQuestions array adds new item
    - question_id generated
```

---

### Component 4: Chat View (TiSQLArtifactChat)

**Location**: Main content area when currentView === 'chat'

**Elements**:
1. Pattern suggestions (top)
2. Message history (scrollable)
3. Artifact cards (Results, Quality Gates, DBT Model)
4. Chat input field (bottom)

**Actions Available**:

```
ACTION: Click Pattern Suggestion
  Location: Top of chat view
  Trigger: Click on pattern card
  Behavior:
    - Pattern card highlights briefly
    - AI generates SQL based on pattern
    - Message appears: "Generating SQL for [pattern name]..."
    - After 2-3 seconds:
      → SQL appears in collapsible code block
      → Auto-executes query
      → Results appear in ResultsArtifactCard
  State Changes:
    - productData.sql updates
    - productData.previewResult updates
    - Chat history adds AI message
    - Editor button becomes enabled
    - Results button becomes enabled

ACTION: Type Natural Language Query
  Location: Chat input field (bottom)
  Trigger: User types and presses Send or Enter
  Examples:
    "Show me customers who haven't purchased in 90 days"
    "Add a column for customer lifetime value"
    "Filter to only show high-value customers"
  Behavior:
    - Message adds to chat history
    - AI processes request (~3-5 seconds)
    - Response appears with:
      → Explanation of changes
      → Updated SQL in code block
      → Auto-execution of SQL
      → Results in artifact card
  State Changes:
    - Chat history updates
    - productData.sql updates
    - productData.previewResult updates

ACTION: Expand/Collapse SQL Code Block
  Location: Within AI message containing SQL
  Trigger: Click [▼] to expand or [▲] to collapse
  Behavior:
    - Code block expands/collapses with animation
    - When expanded: Shows full SQL with syntax highlighting
    - When collapsed: Shows first 3 lines + "... X more lines"
  State Changes: None (visual only)

ACTION: Copy SQL to Clipboard
  Location: SQL code block
  Trigger: Click [Copy] button in code block header
  Behavior:
    - SQL copied to clipboard
    - Button text changes: "Copy" → "Copied!" (2 seconds)
    - Tooltip: "Copied to clipboard"
  State Changes: None

ACTION: Run SQL from Code Block
  Location: SQL code block
  Trigger: Click [Run] button in code block header
  Behavior:
    - Button shows spinner: "Running..."
    - Backend executes SQL query
    - Results appear/update in ResultsArtifactCard
    - Quality metrics recalculate
  State Changes:
    - productData.previewResult updates
    - productData.validationStatus updates

ACTION: View Full Results
  Location: ResultsArtifactCard
  Trigger: Click [View Full Results] button
  Behavior:
    - View automatically switches to Results view
    - Full table displayed
  State Changes:
    - currentView = 'results'

ACTION: Configure Quality Thresholds
  Location: ResultsArtifactCard or QualityGatesCard
  Trigger: Click [Configure Thresholds] button
  Behavior:
    - Modal opens: "Configure Quality Thresholds"
    - Shows all quality rules with sliders/inputs:
      * Completeness: [_____●_____] 95%
      * Uniqueness: [_________●_] 100%
      * Validity: [______●______] 98%
    - Each rule has:
      → Threshold slider (0-100%)
      → Severity dropdown (Error, Warning, Info)
      → Enable/disable toggle
  On Save:
    - Modal closes
    - Quality rules update
    - Quality Gates Card refreshes
    - Auto-save triggers
  State Changes:
    - productData.customQualityRules updates

ACTION: Generate dbt Model
  Location: DBTModelEditorCard (bottom of chat)
  Trigger: Click [Generate dbt Model] button
  Behavior:
    - Button shows spinner: "Generating..."
    - AI generates dbt model YAML (2-3 seconds)
    - Code block appears with dbt YAML
    - Includes:
      → Model name (from product name)
      → Column documentation
      → Tests (from quality rules)
      → Business context (from objectives)
  State Changes: None (display only)

ACTION: Copy/Download dbt Model
  Location: DBTModelEditorCard
  Triggers:
    - Click [Copy] button: Copies YAML to clipboard
    - Click [Download] button: Downloads as .yml file
  Behavior:
    - Copy: "Copied!" feedback (2 seconds)
    - Download: Browser downloads file: <product_name>.yml
  State Changes: None
```

---

### Component 5: Editor View (SQLEditorView)

**Location**: Main content area when currentView === 'editor'

**Elements**:
1. Toolbar (top)
2. TiSQLEditor (CodeMirror)
3. Helper text (bottom)

**Actions Available**:

```
ACTION: Edit SQL Directly
  Location: TiSQLEditor area
  Trigger: User types in editor
  Behavior:
    - Real-time syntax highlighting
    - Autocomplete suggestions on trigger characters:
      → Period (.): Shows table.column suggestions
      → Space after FROM/JOIN: Shows table suggestions
      → Space after SELECT: Shows column suggestions
    - Line numbers update
    - Character count updates
    - Unsaved indicator appears in toolbar
  Features:
    - Multi-cursor editing (Alt+Click)
    - Find/replace (Cmd+F)
    - Auto-indent on Enter
    - Bracket matching
    - Comment toggle (Cmd+/)
  State Changes:
    - productData.sql updates (debounced 500ms)
    - Auto-save triggers after 2 seconds idle

ACTION: Format SQL
  Location: Toolbar
  Trigger: Click [Format] button
  Behavior:
    - SQL auto-formats with rules:
      → Keywords uppercase
      → Consistent indentation (2 spaces)
      → Commas after each column
      → Line breaks after major clauses
    - Brief highlight animation on changed lines
    - Cursor position preserved (line number)
  State Changes:
    - productData.sql updates (formatted)
  Example:
    Before: SELECT c.id,c.name,c.email FROM customers c WHERE c.status='active'
    After:
      SELECT
        c.id,
        c.name,
        c.email
      FROM customers c
      WHERE c.status = 'active'

ACTION: Run Query
  Location: Toolbar
  Trigger: Click [Run Query] button OR press Cmd+Enter
  Pre-conditions: SQL must not be empty
  Behavior:
    - Button disabled, shows spinner
    - Button text: "Run Query" → "Running..."
    - Backend execution (actual or mock)
    - On success:
      → View auto-switches to Results
      → Execution time displayed in toolbar
      → Last run timestamp updates
    - On error:
      → Error alert appears with SQL error details
      → Stay in Editor view
      → Error line highlighted in editor (if available)
  State Changes:
    - isExecuting = true → false
    - productData.previewResult updates
    - currentView = 'results' (if successful)
    - lastExecutionTime updates

ACTION: Keyboard Shortcut: Save
  Trigger: Press Cmd+S (Mac) or Ctrl+S (Windows)
  Behavior:
    - Saves current SQL to context
    - Triggers auto-save to draft
    - Visual feedback: "Saved" indicator (2 seconds)
  State Changes:
    - Draft storage updates
    - lastAutoSaveTime updates

ACTION: Keyboard Shortcut: Execute
  Trigger: Press Cmd+Enter (Mac) or Ctrl+Enter (Windows)
  Behavior: Same as clicking [Run Query] button

ACTION: View Schema
  Location: Autocomplete dropdown
  Trigger: Type table name + period (e.g., "customers.")
  Behavior:
    - Autocomplete dropdown appears
    - Shows available columns for that table:
      customers.
      ├─ id (bigint)
      ├─ name (varchar)
      ├─ email (varchar)
      ├─ created_at (timestamp)
      └─ status (varchar)
    - Arrow keys to navigate, Enter to select
  State Changes: None (UI helper only)
```

---

### Component 6: Results View

**Location**: Main content area when currentView === 'results'

**Elements**:
1. Results header (metadata)
2. Results table (scrollable)
3. Export buttons
4. Footer (if results limited)

**Actions Available**:

```
ACTION: Scroll Through Results
  Location: Results table body
  Trigger: Mouse scroll or scrollbar
  Behavior:
    - Table body scrolls
    - Header remains sticky (fixed at top)
    - Smooth scrolling
    - Lazy rendering (virtualization for 10K+ rows)
  State Changes: None (visual only)

ACTION: Sort by Column (Future Enhancement)
  Location: Column header
  Trigger: Click on column header
  Behavior:
    - Column header shows sort indicator (▲ or ▼)
    - Table re-sorts by that column
    - Toggle: ascending ↔ descending
  State Changes:
    - sortColumn and sortDirection update
  Note: Not implemented in current version

ACTION: Copy Results as CSV
  Location: Results header
  Trigger: Click [Copy CSV] button
  Behavior:
    - Generates CSV format:
      → Header row: column names
      → Data rows: all values, comma-separated
    - Copies to clipboard
    - Button feedback: "Copy CSV" → "Copied!" (2 seconds)
    - Tooltip: "Copied X rows to clipboard"
  Format Example:
    customer_id,customer_name,email,rfm_score
    cust_001,Acme Corp,acme@corp.com,14
    cust_002,Widget Inc,widget@inc.com,13
  State Changes: None

ACTION: Export Results as CSV File
  Location: Results header
  Trigger: Click [Export CSV] button
  Behavior:
    - Generates CSV file
    - Browser triggers download
    - Filename: <product_name>_results_<timestamp>.csv
    Example: customer_segmentation_results_2025-10-29_14-35.csv
  State Changes: None

ACTION: Export Results as JSON (Future Enhancement)
  Location: Results header
  Trigger: Click [Export ▼] dropdown → "JSON"
  Behavior:
    - Generates JSON array of objects
    - Downloads as .json file
  State Changes: None
  Note: Not implemented in current version

ACTION: Navigate Back to Editor
  Location: View Switcher
  Trigger: Click [Editor] button
  Behavior:
    - Switches back to Editor view
    - SQL preserved (no changes)
    - Results remain in memory
  State Changes:
    - currentView = 'editor'
```

---

### Component 7: Source Selection Interface

**Location**: Main content area (only shown when no sources selected)

**Elements**:
1. Source browser (left panel)
2. Selected sources list (right panel)
3. Search/filter controls

**Actions Available**:

```
ACTION: Search for Sources
  Location: Search bar at top
  Trigger: Type in search field
  Behavior:
    - Real-time filtering of source list
    - Searches by: table name, schema, description, columns
    - Highlights matching text
    - Shows "X results found" count
  State Changes: None (filter only)

ACTION: Select Source
  Location: Source browser (left panel)
  Trigger: Click on table card
  Behavior:
    - Table card highlights
    - "+" icon changes to "✓"
    - Table moves to "Selected Sources" panel (right)
    - Shows column preview
  State Changes:
    - productData.selectedSources adds table object:
      {
        id: "production.customers",
        name: "customers",
        schema: "production",
        columns: [...],
        description: "Customer master table"
      }

ACTION: Deselect Source
  Location: Selected sources panel (right)
  Trigger: Click [×] on selected source card
  Behavior:
    - Card fades out
    - Table returns to available sources list
    - "✓" changes back to "+"
  State Changes:
    - productData.selectedSources removes table

ACTION: View Source Schema
  Location: Source browser
  Trigger: Click on table card (not on + button)
  Behavior:
    - Drawer slides in from right
    - Shows table details:
      → Full column list with types
      → Sample values (if available)
      → Row count estimate
      → Update frequency
      → Data quality scores
  State Changes: None (preview only)

ACTION: Continue with Sources
  Location: Bottom of screen
  Trigger: Click [Continue] button
  Pre-conditions: At least 1 source selected
  Behavior:
    - Source selection interface fades out
    - Chat view loads with selected sources
    - Pattern suggestions generate based on sources
  State Changes:
    - showSourceSelection = false
    - Triggers pattern generation
```

---

### Component 8: Floating Action Bar

**Location**: Fixed bottom-right of screen

**Elements**:
1. Save Draft button
2. Activate Product button

**Actions Available**:

```
ACTION: Save Draft
  Location: Floating action bar
  Trigger: Click [Save Draft] button
  Behavior:
    - Button disabled during save
    - Button shows spinner: "Saving..."
    - Draft saved to localStorage + backend
    - Draft appears in /build → "My Drafts" tab
    - Success feedback: "Saved!" (2 seconds)
  State Changes:
    - Draft object created/updated in storage:
      {
        id: UUID,
        name: productData.name,
        productData: {...},
        businessContext: {...},
        lastSaved: timestamp,
        createdFrom: productData.createdFrom
      }
    - lastAutoSaveTime updates

ACTION: Activate Product (Without Business Context)
  Location: Floating action bar
  Trigger: Click [Activate Product] button
  Pre-conditions:
    - Product name not empty
    - SQL not empty
    - At least 1 source selected
  Validation:
    ✓ All required fields
    ✗ No business context exists
  Behavior:
    - Skip stakeholder review modal
    - Deploy directly
    - Show progress overlay
    - Navigate to success page
  State Changes:
    - isDeploying = true
    - deployProgress: 0% → 100%
    - Product activated in backend

ACTION: Activate Product (With Business Context)
  Location: Floating action bar
  Trigger: Click [Activate Product] button
  Pre-conditions: Same as above
  Validation:
    ✓ All required fields
    ✓ Business context exists (1+ objectives/metrics/questions)
  Behavior:
    - Stakeholder Review Modal opens
    - Shows all business context for review
    - User must confirm before deployment
  State Changes:
    - showReviewModal = true
    - (Deployment happens after confirmation)

ACTION: Confirm Deployment (in Review Modal)
  Location: Stakeholder Review Modal
  Trigger: Click [Confirm & Activate] button
  Behavior:
    - Modal closes
    - Deployment starts
    - Progress overlay shows:
      → 0-30%: "Checking data quality..."
      → 30-60%: "Setting up data product..."
      → 60-90%: "Activating product..."
      → 90-100%: "Ready to use..."
    - Progress updates every 500ms
  State Changes:
    - showReviewModal = false
    - isDeploying = true
    - deployProgress increments
    - On completion: Navigate to success page

ACTION: Edit from Review Modal
  Location: Stakeholder Review Modal
  Trigger: Click [← Go Back to Edit] button
  Behavior:
    - Modal closes
    - Returns to workspace (no navigation)
    - Business Context panel auto-expands
    - Focus on relevant tab (if clicked from specific section)
  State Changes:
    - showReviewModal = false
    - showBusinessContext = true
```

---

## Decision Trees

### Decision Tree 1: Which View to Use?

```
START: User in workspace with sources selected
│
├─ NEED: "Generate SQL from natural language"
│  └─→ USE: Chat View
│      ACTION: Type intent in chat
│      RESULT: AI generates SQL
│
├─ NEED: "Directly edit existing SQL"
│  ├─ IF: SQL exists
│  │  └─→ USE: Editor View
│  │      ACTION: Click Editor, make changes
│  │      RESULT: SQL updated, can re-run
│  └─ ELSE: SQL doesn't exist
│     └─→ BLOCK: Editor button disabled
│         WORKAROUND: Generate SQL in Chat first
│
├─ NEED: "Validate query results"
│  ├─ IF: Results exist
│  │  └─→ USE: Results View
│  │      ACTION: Click Results, review table
│  │      RESULT: See full data, can export
│  └─ ELSE: No results yet
│     └─→ BLOCK: Results button disabled
│         WORKAROUND: Execute SQL in Chat or Editor first
│
├─ NEED: "Iterate quickly on SQL logic"
│  └─→ USE: Editor → Results → Editor loop
│      WORKFLOW:
│      1. Click Editor, make change
│      2. Click Run (auto-switches to Results)
│      3. Validate results
│      4. Click Editor, refine
│      5. Repeat
│
├─ NEED: "Learn SQL patterns from AI"
│  └─→ USE: Chat → Editor loop
│      WORKFLOW:
│      1. Ask question in Chat
│      2. AI generates SQL with explanation
│      3. Click Editor to study generated SQL
│      4. Make adjustments in Editor
│      5. Return to Chat for more questions
│
└─ NEED: "Export results for stakeholders"
   └─→ USE: Results View
       ACTION: Click Export CSV
       RESULT: Download CSV file
```

---

### Decision Tree 2: How to Start Building?

```
START: User on /build page
│
├─ SCENARIO: "I know exactly what I want"
│  ├─ OPTION A: Similar product exists
│  │  └─→ ENTRY: Clone existing product
│  │      STEPS:
│  │      1. Go to /discover
│  │      2. Find similar product
│  │      3. Click "Clone" button
│  │      4. Customize name and domain
│  │      5. Workspace loads with cloned SQL
│  │
│  └─ OPTION B: Starting fresh
│     └─→ ENTRY: Manual entry
│         STEPS:
│         1. Click "Start from Scratch" tab
│         2. Enter product name
│         3. Select domain
│         4. Workspace loads (empty)
│         5. Select sources
│         6. Write SQL in Editor
│
├─ SCENARIO: "I have a business question but not sure how to build it"
│  └─→ ENTRY: Intent-based
│      STEPS:
│      1. Click "Describe Your Need" tab
│      2. Type business requirement in plain language
│      3. Select domain (optional)
│      4. Click "Generate Recommendation"
│      5. Review AI analysis
│      6. Workspace loads with suggested sources
│      7. Refine SQL in Chat or Editor
│
├─ SCENARIO: "I want to use a proven pattern"
│  └─→ ENTRY: Template-based
│      STEPS:
│      1. Click "Templates" tab
│      2. Browse gallery (12+ templates)
│      3. Click template card
│      4. Review preview (Overview, SQL, Quality)
│      5. Click "Start Building"
│      6. Workspace loads with template SQL
│      7. Customize in Editor or Chat
│
└─ SCENARIO: "I'm new and don't know where to start"
   └─→ ENTRY: Template-based (recommended)
       REASON: Templates provide structure and best practices
       STEPS: Same as template entry above
```

---

### Decision Tree 3: When to Add Business Context?

```
START: Building data product
│
├─ QUESTION: "Is this for production use?"
│  │
│  ├─ YES: Production deployment
│  │  └─→ RECOMMENDATION: Add business context (required for review)
│  │      REASON: Stakeholder alignment, documentation, impact tracking
│  │      ACTIONS:
│  │      1. Expand Business Context panel
│  │      2. Add 1+ objectives (what are we trying to achieve?)
│  │      3. Add 1+ metrics (how do we measure success?)
│  │      4. Add 1+ questions (what decisions will this enable?)
│  │      5. On deploy: Stakeholder Review Modal appears
│  │
│  └─ NO: Exploratory/prototype
│     └─→ RECOMMENDATION: Skip business context (optional)
│         REASON: Faster iteration, not yet stakeholder-facing
│         ACTIONS:
│         1. Skip Business Context panel
│         2. Click "Activate Product"
│         3. Deploy directly (no review modal)
│
├─ QUESTION: "Will non-technical stakeholders use this?"
│  │
│  ├─ YES: Stakeholder-facing
│  │  └─→ RECOMMENDATION: Add rich business context
│  │      REASON: Helps non-technical users understand purpose and impact
│  │      PRIORITY:
│  │      1. Questions (HIGH) - What decisions does this enable?
│  │      2. Objectives (HIGH) - What business goals does this support?
│  │      3. Metrics (MEDIUM) - How do we measure success?
│  │
│  └─ NO: Engineer-only
│     └─→ RECOMMENDATION: Minimal context
│         REASON: Technical documentation sufficient
│         OPTIONAL: Add 1 objective for searchability
│
└─ QUESTION: "Is this product part of a larger initiative?"
   │
   ├─ YES: Part of initiative/OKR
   │  └─→ RECOMMENDATION: Link to initiative via objectives
   │      ACTIONS:
   │      1. Add objective with initiative name
   │      2. Add target date matching initiative deadline
   │      3. Add stakeholders from initiative team
   │      4. Add metrics that ladder up to initiative KPIs
   │
   └─ NO: Standalone product
      └─→ RECOMMENDATION: Add context for discoverability
          REASON: Future users can find and understand purpose
          MINIMUM: 1 objective describing "why this exists"
```

---

## Error States & Recovery

### Error 1: SQL Execution Failure

**Trigger**: Query execution returns error from backend

**Error Display**:
```
┌────────────────────────────────────────────────────────┐
│ ⚠️ Query Execution Failed                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Error: Column 'customer_name' does not exist          │
│ Line 5: SELECT customer_name                           │
│                                                        │
│ Suggestions:                                           │
│ • Check column name spelling                           │
│ • Verify table schema in source panel                  │
│ • Use autocomplete (Ctrl+Space) for valid columns      │
│                                                        │
│                                [View SQL] [Close]      │
└────────────────────────────────────────────────────────┘
```

**Recovery Actions**:
1. Click [View SQL]: Switches to Editor view, highlights error line
2. Click [Close]: Stays in current view, can manually navigate
3. User fixes SQL in Editor
4. User clicks Run Query again

**State Changes**:
- isExecuting = false
- Error message stored temporarily
- No navigation (stay in current view)

---

### Error 2: Deployment Validation Failure

**Trigger**: User clicks "Activate Product" but validation fails

**Validation Checks**:
```typescript
// Required fields validation
if (!productData.name.trim()) {
  → ERROR: "Product name is required"
}

if (!productData.sql.trim()) {
  → ERROR: "SQL query is required. Generate or write SQL first."
}

if (productData.selectedSources.length === 0) {
  → ERROR: "At least one data source must be selected"
}

// Optional: Quality gates validation (warnings, not blockers)
if (productData.customQualityRules.length === 0) {
  → WARNING: "No quality rules configured. Continue anyway?"
}
```

**Error Display**:
```
┌────────────────────────────────────────────────────────┐
│ ⚠️ Cannot Activate Product                             │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Please fix the following issues:                       │
│                                                        │
│ ✗ SQL query is required                               │
│   → Generate SQL in Chat or write in Editor           │
│                                                        │
│ ✗ Product name is too short (min 3 characters)        │
│   → Edit product name in header                       │
│                                                        │
│                                      [OK]              │
└────────────────────────────────────────────────────────┘
```

**Recovery Actions**:
1. User clicks [OK] to close dialog
2. Dialog highlights which fields need attention
3. User fixes issues (e.g., edits product name, generates SQL)
4. User clicks "Activate Product" again
5. If valid: Deployment proceeds

---

### Error 3: Auto-Save Failure

**Trigger**: Network error or storage quota exceeded during auto-save

**Error Display** (Non-blocking toast notification):
```
┌────────────────────────────────────────┐
│ ⚠️ Auto-save failed                    │
│ Changes are saved locally.       [×]  │
│ Retry in 30 seconds...                │
└────────────────────────────────────────┘
```

**Recovery Actions**:
- Auto-retry after 30 seconds
- Changes remain in memory (no data loss)
- User can manually click "Save Draft" button
- If persistent: User sees persistent error banner with troubleshooting

---

### Error 4: Source Selection Failure

**Trigger**: Selected source no longer exists or user lacks permissions

**Error Display**:
```
┌────────────────────────────────────────────────────────┐
│ ⚠️ Cannot Access Source                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Source: production.customers                           │
│ Error: Permission denied                               │
│                                                        │
│ Possible reasons:                                      │
│ • You don't have read access to this table             │
│ • The table was deleted or renamed                     │
│ • Network connection issue                             │
│                                                        │
│ Actions:                                               │
│ • Request access from data admin                       │
│ • Select a different source                            │
│ • Contact support if this is unexpected                │
│                                                        │
│                    [Remove Source] [Contact Admin]     │
└────────────────────────────────────────────────────────┘
```

**Recovery Actions**:
1. Click [Remove Source]: Removes problematic source from selection
2. Click [Contact Admin]: Opens support ticket with pre-filled details
3. User selects alternative source
4. User continues building

---

## Success Paths

### Success Path 1: Intent → Deployment (Full Journey)

**Time**: ~10 minutes for experienced user

**Steps**:
1. ✅ Enter intent in natural language (1 min)
2. ✅ Review AI analysis and accept (30 sec)
3. ✅ Workspace loads with suggested sources (instant)
4. ✅ Click pattern suggestion, AI generates SQL (10 sec)
5. ✅ Review results in Chat view (1 min)
6. ✅ Switch to Editor, refine SQL (2 min)
7. ✅ Run query, validate results (30 sec)
8. ✅ Add business context (3 min)
9. ✅ Click Activate, review modal (1 min)
10. ✅ Confirm deployment (instant)
11. ✅ Product live, navigate to Discover (10 sec)

**Key Metrics**:
- View switches: 3 (Chat → Editor → Results → Chat → Deployment)
- SQL iterations: 1 (AI generation + 1 refinement)
- Business context: 1 objective, 1 metric, 1 question
- Result: ✅ Production-ready data product

---

### Success Path 2: Template → Quick Deploy (Speed Run)

**Time**: ~5 minutes for expert user

**Steps**:
1. ✅ Select template from gallery (30 sec)
2. ✅ Review template preview (20 sec)
3. ✅ Start building (instant)
4. ✅ Template SQL loaded in Chat view (instant)
5. ✅ Click "Run" in code block (5 sec)
6. ✅ Results validate in Results view (auto-switch)
7. ✅ Export CSV for stakeholder validation (10 sec)
8. ✅ Skip Business Context (optional for template)
9. ✅ Click Activate (instant)
10. ✅ Deploy directly (no review modal)
11. ✅ Product live (20 sec deployment)

**Key Metrics**:
- View switches: 1 (Chat → Results)
- SQL iterations: 0 (template used as-is)
- Business context: 0 (skipped)
- Result: ✅ Rapid deployment for prototyping

---

### Success Path 3: Clone → Customize → Deploy

**Time**: ~8 minutes

**Steps**:
1. ✅ Navigate to /discover (10 sec)
2. ✅ Find similar product (30 sec)
3. ✅ Click "Clone" button (instant)
4. ✅ Customize clone name and domain (20 sec)
5. ✅ Workspace loads with cloned SQL (instant)
6. ✅ Switch to Editor view (instant)
7. ✅ Make targeted changes to SQL (3 min)
8. ✅ Run query, validate differences (30 sec)
9. ✅ Update business context (2 min)
10. ✅ Deploy with review (1 min)
11. ✅ Product live, different from original

**Key Metrics**:
- View switches: 2 (Chat → Editor → Results)
- SQL iterations: 1 (clone + modifications)
- Business context: Cloned + modified
- Result: ✅ Variant of existing product deployed

---

## Conclusion

This document provides **complete coverage** of:
- ✅ All 4 entry points with detailed action sequences
- ✅ Every component with exhaustive action lists
- ✅ Decision trees for common scenarios
- ✅ Error states with recovery paths
- ✅ Success paths with time estimates

**Use Cases**:
1. **User Training**: Step-by-step guides for each persona
2. **QA Testing**: Complete action checklist for test coverage
3. **Product Documentation**: Reference for all features
4. **UX Review**: Identify workflow gaps and optimization opportunities

**Next Steps**:
- Use this as basis for user training materials
- Create video walkthroughs for each success path
- Build automated E2E tests from action sequences
- Gather user feedback on pain points
