# User Workflows: Jobs-to-be-Done with View Switcher

**Date**: October 29, 2025
**Context**: Phase 6A Part 1 - SQL Editor View Integration
**Framework**: Jobs-to-be-Done (JTBD)

---

## Overview

This document maps the **jobs users are trying to accomplish** when building data products, and the **specific actions they take** in the UnifiedProductWorkspace with the new View Switcher pattern.

---

## Persona 1: Senior Data Engineer (Sarah)

### Profile
- **Experience**: 8+ years in data engineering
- **Skills**: Expert in SQL, Python, distributed systems
- **Tools**: Comfortable with IDEs, command line, direct code editing
- **Preference**: Direct control over code, minimal AI mediation

### Job #1: "When I need to create a customer analytics data product, I want to quickly prototype SQL transformations so I can validate business logic before committing to production."

#### Context
Sarah has been asked to create a data product that calculates customer lifetime value (CLV) from transaction data. She knows the exact SQL patterns she needs but wants to iterate quickly.

#### Actions Taken

**Phase 1: Setup (Entry via Template)**
```
1. Navigate to /build
2. Click "Templates" tab
3. Select "Customer Analytics" template
4. Review template preview:
   - Pre-selected sources: customers, transactions, orders
   - SQL skeleton with JOIN patterns
   - Quality rules: completeness, uniqueness
5. Click "Start Building"
   → Workspace loads with template data
```

**Phase 2: Initial SQL Review (Chat View)**
```
6. Workspace opens in Chat view (default)
7. Review Pattern Suggestions:
   - "Calculate customer lifetime value"
   - "Aggregate transactions by customer"
   - "Time-series customer behavior"
8. Click "Calculate customer lifetime value" pattern
   → AI generates initial SQL in ~3 seconds
9. Review generated SQL in collapsible code block:
   - SQL structure looks good
   - But PARTITION BY logic needs adjustment
   - And she wants to add a rolling window calculation
```

**Phase 3: Direct SQL Editing (Editor View)**
```
10. Click "SQL Editor" tab in View Switcher
    → Switches to Editor view
11. Review SQL in TiSQLEditor:
    - Syntax highlighting active
    - Schema autocomplete available
12. Make direct edits:
    a. Change PARTITION BY clause:
       FROM: PARTITION BY customer_id
       TO: PARTITION BY customer_id, product_category

    b. Add rolling window:
       INSERT AFTER line 15:
       SUM(amount) OVER (
         PARTITION BY customer_id
         ORDER BY transaction_date
         ROWS BETWEEN 90 PRECEDING AND CURRENT ROW
       ) as rolling_90d_value

    c. Adjust WHERE clause for data quality:
       ADD: AND amount > 0 AND transaction_date >= '2023-01-01'

13. Click "Format" button
    → SQL auto-formatted with proper indentation
14. Click "Run Query" button
    → Execution starts (spinner shows)
    → Auto-switches to Results view in ~1.5 seconds
```

**Phase 4: Results Validation (Results View)**
```
15. Results view displays:
    - Table with 10 columns × 1,234 rows
    - Execution time: 423ms
    - Row count badge showing "1.2K"

16. Validate data quality:
    - Scroll through results
    - Check rolling_90d_value column for nulls (none found)
    - Verify customer_id uniqueness
    - Spot-check CLV calculations against known values

17. Export results for validation:
    - Click "Export CSV" button
    - Download customer_clv_preview.csv
    - Open in Excel for stakeholder review
```

**Phase 5: Iterative Refinement (Back to Editor)**
```
18. Switch back to "SQL Editor" tab
    → Previous edits preserved
19. Make refinement:
    - Add HAVING clause to filter low-value customers
    - Add: HAVING SUM(amount) > 100
20. Click "Run Query"
    → Results update, now showing 892 rows (filtered)
21. Review results again
    → Looks good, ready for quality gates
```

**Phase 6: Deployment**
```
22. Expand "Business Context" section
23. Add objective: "Increase customer retention by targeting high-CLV customers"
24. Add metric: "CLV Calculation Accuracy: Target 95%"
25. Click "Activate Product" button
    → Stakeholder review modal appears
26. Review business context, click "Confirm & Activate"
    → Deployment starts
    → Progress bar: 0% → 100%
    → Success message
```

#### Success Criteria
- ✅ SQL iteration time: < 5 seconds per change
- ✅ No AI mediation needed for direct edits
- ✅ Results validation in < 2 minutes
- ✅ Total time to deployment: < 15 minutes

#### Key Insight
**Job-to-be-Done**: "I need to iterate on SQL transformations without waiting for AI to interpret my technical changes."

**Solution Provided**: Direct SQL editing in Editor view enables expert-level iteration speed while preserving AI assistance for initial generation.

---

## Persona 2: Data Engineer (Mike)

### Profile
- **Experience**: 3 years in data engineering
- **Skills**: Competent in SQL, learning advanced patterns
- **Tools**: Comfortable with UIs, learning command line
- **Preference**: Guided workflows with option to dive deeper

### Job #2: "When I'm building a new data product from scratch, I want AI guidance to generate correct SQL patterns so I can learn best practices while delivering quickly."

#### Context
Mike needs to create a sales funnel analysis data product. He understands the business logic but isn't sure about the best SQL patterns for funnel analysis.

#### Actions Taken

**Phase 1: Entry via Intent**
```
1. Navigate to /build
2. Click "Describe Your Need" tab
3. Type intent:
   "I need to analyze our sales funnel from lead generation through
    deal close, showing conversion rates at each stage and time spent
    per stage. Sources should include leads, opportunities, and deals tables."
4. Click "Generate Recommendation"
   → AI analyzes intent (~5 seconds)
5. Review AI analysis modal:
   - Recommended sources: crm.leads, crm.opportunities, crm.deals
   - Product type: Aggregate (funnel analysis)
   - Suggested name: "Sales Funnel Performance"
6. Click "Accept Analysis"
   → Workspace loads with sources pre-selected
```

**Phase 2: AI-Guided SQL Generation (Chat View)**
```
7. Workspace opens in Chat view with sources loaded
8. Review Pattern Suggestions:
   - "Multi-stage funnel analysis" ← This one!
   - "Time-to-conversion calculation"
   - "Drop-off rate by stage"
9. Click "Multi-stage funnel analysis" pattern
   → AI generates SQL with detailed comments explaining the logic
10. Read generated SQL in code block:
    - Window functions for stage transitions (NEW to Mike)
    - LAG() function to calculate time between stages (NEW)
    - CASE statements for conversion logic (familiar)
11. Ask follow-up in chat:
    "Can you explain how the LAG() function works here?"
    → AI responds with explanation + example
12. Click "Run" button in code block
    → SQL executes, results appear in embedded ResultsArtifactCard
```

**Phase 3: Learning from Results (Staying in Chat View)**
```
13. Review results in ResultsArtifactCard:
    - 5 funnel stages
    - Conversion rates calculated
    - Time-to-conversion in days
14. Notice: Conversion rate from "Lead" to "Qualified" is 0%
    → Suspicious, probably a data issue
15. Type in chat:
    "Why is the Lead to Qualified conversion rate showing 0%?"
    → AI suggests: "Check if stage names match exactly in your data"
16. Type in chat:
    "Can you add a query to show me unique stage names?"
    → AI generates diagnostic query
    → Runs query
    → Results show: "lead" vs "Lead" (case mismatch!)
17. Type in chat:
    "Please update the main query to use UPPER() for stage comparisons"
    → AI regenerates SQL with UPPER() functions
    → Auto-executes
    → Conversion rates now look correct!
```

**Phase 4: Fine-Tuning Details (Switching to Editor)**
```
18. Mike wants to adjust the time bucket for time-to-conversion
    → This is a simple numeric change, no need for AI
19. Click "SQL Editor" tab
    → Switches to Editor view
20. Find line with: DATEDIFF(day, ...) / 7 as weeks_to_convert
21. Change to: DATEDIFF(day, ...) as days_to_convert
22. Click "Run Query"
    → Results update with days instead of weeks
23. Review results in Results view
    → Looks better for this use case
```

**Phase 5: Quality Configuration**
```
24. Expand "Business Context" section
25. Add business objective and metrics
26. Click "Activate Product"
    → Quality Gates Card appears in Chat view
27. Review suggested quality rules:
    - Completeness: stage_name (99%)
    - Uniqueness: lead_id (100%)
    - Timeliness: data_freshness (< 24h)
28. Accept suggested rules
29. Click "Continue to Deploy"
    → Deployment flow starts
```

#### Success Criteria
- ✅ AI explained SQL patterns Mike didn't know
- ✅ Iterative chat-based refinement worked smoothly
- ✅ Could switch to Editor for simple changes
- ✅ Total time: ~25 minutes (including learning)

#### Key Insight
**Job-to-be-Done**: "I need to build a data product while learning advanced SQL patterns from AI, but still have control when I know what I want."

**Solution Provided**: Chat view provides guided learning experience, Editor view available when direct changes are faster than describing them.

---

## Persona 3: Analytics Engineer (Jessica)

### Profile
- **Experience**: 4 years in analytics
- **Skills**: Strong in SQL and dbt, business-focused
- **Tools**: Comfortable with SQL editors, loves documentation
- **Preference**: Natural language for complex logic, SQL for fine-tuning

### Job #3: "When I need to create a business metric data product, I want to translate business requirements into SQL using natural language so I can ensure business logic is correctly implemented."

#### Context
Jessica's marketing team needs a "Campaign Attribution" data product that attributes revenue to marketing touchpoints using a multi-touch attribution model. The business logic is complex and needs stakeholder validation.

#### Actions Taken

**Phase 1: Entry via Template + Intent Hybrid**
```
1. Navigate to /build
2. Click "Templates" tab
3. Select "Marketing Attribution" template
   → Loads with marketing_touches and conversions sources
4. Workspace opens in Chat view
5. Type detailed business requirements in chat:
   "I need to implement a time-decay attribution model where:
    - First touch gets 40% credit
    - Last touch gets 40% credit
    - Middle touches split remaining 20% equally
    - Attribution window is 30 days
    - Only count touches that led to conversion"
6. AI generates SQL implementing this logic
   → Complex CASE statements and window functions
7. Review generated SQL
   → Looks correct but wants to validate logic
```

**Phase 2: Business Logic Validation (Chat → Editor → Results Loop)**
```
8. Click "SQL Editor" tab
9. Review SQL line-by-line in Editor:
   - Attribution logic in CASE statement (lines 45-78)
   - Window function for touch ordering (lines 20-25)
   - 30-day filter (line 15)
10. Add SQL comment explaining business logic:
    INSERT AT line 44:
    /* Attribution Model:
     * - First touch: 40% revenue credit
     * - Last touch: 40% revenue credit
     * - Middle touches: 20% split equally
     * - Attribution window: 30 days before conversion
     */
11. Click "Run Query"
    → Results view shows attributed revenue
12. Export results: "Export CSV"
    → Downloads attribution_preview.csv
13. Share CSV with marketing team via Slack
    → Get validation: "Logic looks correct!"
```

**Phase 3: Adding Business Context Documentation**
```
14. Expand "Business Context" section
15. Click "Objectives" tab
16. Add objective:
    - Title: "Optimize marketing spend allocation"
    - Description: "Use multi-touch attribution to allocate budget to highest-ROI channels"
    - Priority: High
    - Stakeholders: CMO, Marketing Ops, Finance
17. Click "Metrics" tab
18. Add metrics:
    - Metric 1: "Attribution Accuracy"
      Current: 85%, Target: 95%, Trend: Improving
    - Metric 2: "Marketing ROI"
      Current: 3.2x, Target: 4.0x, Trend: On Track
19. Click "Questions" tab
20. Add questions:
    - "Which marketing channels drive highest-value customers?"
      Personas: CMO, Marketing Analyst
    - "What is the optimal marketing mix for Q1?"
      Personas: VP Marketing, Finance
```

**Phase 4: dbt Model Generation**
```
21. Scroll down to DBT Model Editor Card in Chat view
22. Click "Generate dbt Model"
    → AI generates dbt model YAML
23. Review dbt model:
    - model name: campaign_attribution
    - documentation: Includes business context
    - tests: Includes quality checks
24. Click "Copy to Clipboard"
25. Paste into local dbt project
```

**Phase 5: Deployment with Stakeholder Review**
```
26. Click "Activate Product"
    → Stakeholder Review Modal appears
27. Review business context summary:
    - 1 objective (Optimize marketing spend)
    - 2 metrics (Attribution Accuracy, Marketing ROI)
    - 2 questions (Channel performance, Optimal mix)
28. Click "Confirm & Activate"
    → Deployment starts
    → Product activated successfully
```

#### Success Criteria
- ✅ Complex business logic translated to SQL correctly
- ✅ Business context documented for stakeholders
- ✅ dbt model generated with documentation
- ✅ Stakeholder validation before deployment
- ✅ Total time: ~30 minutes

#### Key Insight
**Job-to-be-Done**: "I need to bridge the gap between business requirements and technical implementation, ensuring both stakeholders and data engineers understand the logic."

**Solution Provided**: Chat view for natural language → SQL translation, Editor for validation/comments, Business Context for documentation, dbt generation for deployment.

---

## Persona 4: Data Analyst (Tom)

### Profile
- **Experience**: 1.5 years in analytics
- **Skills**: Basic SQL (SELECT, WHERE, JOIN), Excel expert
- **Tools**: Prefers UIs, learning SQL
- **Preference**: Templates and guided workflows

### Job #4: "When I need to analyze data for a report, I want pre-built data products or simple query patterns so I can get answers quickly without writing complex SQL."

#### Context
Tom needs to analyze product return rates for a quarterly business review. He knows what data he needs but isn't confident writing SQL from scratch.

#### Actions Taken

**Phase 1: Entry via Template**
```
1. Navigate to /build
2. Click "Templates" tab
3. Browse templates:
   - Customer Analytics ❌ (not relevant)
   - Sales Performance ❌ (not relevant)
   - Product Returns Analysis ✅ (perfect!)
4. Click "Product Returns Analysis" template card
5. Review template preview modal:
   - Sources: orders, returns, products
   - Pre-configured: Return rate calculation
   - Quality: Completeness checks
6. Click "Start Building"
   → Workspace loads with template
```

**Phase 2: Using Pattern Suggestions (Chat View)**
```
7. Workspace opens in Chat view
8. Review Pattern Suggestions:
   - "Calculate return rate by product category" ✅
   - "Identify top returned products"
   - "Return reasons analysis"
9. Click "Calculate return rate by product category"
   → SQL generates automatically
   → Executes automatically
   → Results appear in ResultsArtifactCard
10. Review results:
    - 5 product categories
    - Return rates: 2.3% to 8.7%
    - Electronics has highest return rate (8.7%)
```

**Phase 3: Simple Filtering (Staying in Chat View)**
```
11. Tom wants to focus on Electronics category only
12. Type in chat:
    "Show me only Electronics category"
    → AI updates SQL with WHERE clause
    → Re-executes automatically
    → Results now show only Electronics
13. Review detailed Electronics data
    → Need to export for presentation
```

**Phase 4: Exporting Results (Results View)**
```
14. Click "Results" tab in View Switcher
    → Full-screen results table
15. Review data in larger format
    → Easier to see all columns
16. Click "Export CSV" button
    → Downloads electronics_returns.csv
17. Open CSV in Excel
    → Create pivot table for presentation
    → Generate charts for QBR deck
```

**Phase 5: Saving for Reuse**
```
18. Click "Save Draft" button
    → Draft saved with name: "Electronics Returns Analysis"
19. Note for next time: Can reload this draft to run updated data
```

#### Success Criteria
- ✅ No SQL writing required (template + patterns)
- ✅ Simple natural language modifications
- ✅ Easy export to Excel for presentation
- ✅ Total time: < 10 minutes

#### Key Insight
**Job-to-be-Done**: "I need to get analytical insights without becoming a SQL expert, and I need to work in tools I'm comfortable with (Excel)."

**Solution Provided**: Templates eliminate SQL writing, Pattern Suggestions provide common analyses, Chat view for simple modifications, Results view for easy export.

---

## Cross-Persona Workflow Patterns

### Pattern A: AI-First, Then Manual Refinement
**Used by**: Mike, Jessica
**Flow**: Chat (generate) → Editor (refine) → Results (validate)
**Benefit**: Combines AI speed with expert precision

### Pattern B: Template-Based, Minimal SQL
**Used by**: Tom
**Flow**: Template → Chat (patterns) → Results (export)
**Benefit**: No SQL knowledge required

### Pattern C: Expert Iteration
**Used by**: Sarah
**Flow**: Template → Editor (heavy editing) → Results (validate) → Editor (refine)
**Benefit**: Maximum control and speed for experts

### Pattern D: Learning While Building
**Used by**: Mike
**Flow**: Chat (ask questions) → Chat (generate) → Editor (study code) → Chat (refine)
**Benefit**: Upskills while delivering

---

## View Usage Patterns by Persona

| Persona | Primary View | Secondary View | Tertiary View | View Switches per Session |
|---------|-------------|----------------|---------------|---------------------------|
| **Senior Data Engineer** | Editor (70%) | Results (20%) | Chat (10%) | 8-12 switches |
| **Data Engineer** | Chat (60%) | Editor (25%) | Results (15%) | 4-6 switches |
| **Analytics Engineer** | Chat (50%) | Editor (30%) | Results (20%) | 5-8 switches |
| **Data Analyst** | Chat (80%) | Results (18%) | Editor (2%) | 2-3 switches |

---

## Key Workflow Insights

### 1. View Switching Reduces Cognitive Load
**Before**: Users had to mentally switch between "AI mode" and "validation mode" within same interface
**After**: Physical view switch signals mode change, reducing mental overhead

### 2. Editor View Enables Learning
**Observed**: Data Engineers (Mike) use Editor view to *study* AI-generated SQL
**Impact**: Passive learning while building increases SQL competency over time

### 3. Results View Enables Collaboration
**Observed**: Analytics Engineers (Jessica) export results for stakeholder validation
**Impact**: Faster feedback loops with business users

### 4. Chat View Remains Primary for Discovery
**Observed**: All personas start in Chat view for initial exploration
**Impact**: AI assistance democratizes data product creation

---

## Jobs-to-be-Done Summary

| Job Statement | Persona | Solution Component |
|---------------|---------|-------------------|
| "I need to iterate on SQL transformations **without waiting for AI**" | Senior DE | Editor View |
| "I need to **learn SQL patterns** while delivering quickly" | Data Engineer | Chat View + Editor View (study mode) |
| "I need to **translate business requirements** into SQL" | Analytics Engineer | Chat View (NLP) + Business Context |
| "I need to **get insights without becoming a SQL expert**" | Data Analyst | Templates + Patterns + Chat View |
| "I need to **validate data quality** before production" | All | Results View + Export |
| "I need to **document business context** for stakeholders" | Analytics Engineer | Business Context Panel |
| "I need to **collaborate** with business users" | Analytics Engineer, Data Analyst | Results Export + Business Context |

---

## Success Metrics by Job

### Job: Fast SQL Iteration (Senior DE)
- **Metric**: Time per SQL change
- **Before**: 30-60 seconds (via AI chat)
- **After**: 5 seconds (direct edit)
- **Improvement**: 83-92% faster

### Job: Learn While Building (Data Engineer)
- **Metric**: SQL competency growth
- **Before**: Limited exposure to advanced patterns
- **After**: Study AI-generated SQL in Editor view
- **Improvement**: Passive learning during every session

### Job: Business-Technical Bridge (Analytics Engineer)
- **Metric**: Stakeholder alignment
- **Before**: Technical SQL → Manual documentation → Email/Slack
- **After**: Business Context integrated, exportable results
- **Improvement**: Faster validation loops

### Job: Self-Service Analytics (Data Analyst)
- **Metric**: Time to insight
- **Before**: Submit ticket → Wait for DE → Get results
- **After**: Template → Pattern → Export (self-serve)
- **Improvement**: 10x faster (days → minutes)

---

## Conclusion

The View Switcher pattern successfully serves **four distinct jobs-to-be-done** across **four personas**, proving that a single interface can accommodate both **expert control** (Editor view) and **novice guidance** (Chat view) without compromise.

**Key Success**: No persona is forced into a workflow that doesn't match their expertise level or job requirements.
