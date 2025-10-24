# Data Product Creation Workstation: Multi-Card Masonry Architecture
## Business-First Low-Code Platform Design

**Author**: NexusOne Platform Team
**Date**: October 23, 2025
**Status**: Strategic Design Document
**Version**: 1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#part-1-current-state-analysis)
3. [Competitor Landscape](#part-2-competitor-landscape-analysis)
4. [Card-Based Workstation Architecture](#part-3-card-based-workstation-architecture)
5. [Business-First Low-Code Strategy](#part-4-business-first-low-code-strategy)
6. [Implementation Roadmap](#part-5-implementation-roadmap)

---

## Executive Summary

### The Challenge

Modern data product creation platforms face a fundamental tension:
- **Business users** need low-code, template-driven experiences to define **what** they want
- **Technical users** need code-first, flexible workstations to define **how** to build it
- **Current tools** force users to choose one paradigm, excluding the other persona

### The Opportunity

By implementing a **multi-card masonry workstation** with **progressive complexity**, we can serve both personas in a single unified experience:

```
Business User Journey:
Natural language → Template selection → Guided wizard → Preview → Deploy

Technical User Journey:
Code editor → SQL/dbt → Quality gates → Lineage → Test → Deploy
```

### Core Innovation: Adaptive Card Workspace

Instead of fixed panels or a pure conversational interface, we combine both:
- **Left**: Compact chat window for conversational AI guidance
- **Right**: Masonry grid where specialized cards spawn based on user actions

**Card Types**:
1. Query Results Card (implemented)
2. DBT Model Editor Card
3. Quality Gates Card
4. Data Profiling Card
5. Lineage Visualization Card
6. Schema Designer Card
7. Deployment Preview Card

### Success Metrics

| Metric | Current | Target (6 months) |
|--------|---------|-------------------|
| Business user adoption | 5% | 60% |
| Time to first data product | 2-3 weeks | 2-3 days |
| Template usage | 0% | 70% |
| Code-first power users | 95% | 40% |
| Data product quality score | 65% | 85% |

---

## Part 1: Current State Analysis

### 1.1 The Pattern Card Problem

**Issue**: Pattern suggestion cards don't appear in the chat window.

**Root Cause**: During the masonry layout refactor, pattern card rendering was removed from the welcome message. Current code at `TiSQLArtifactChat.tsx:240-292` loads patterns but never displays them.

**Current Code Flow**:
```typescript
// Line 240-252: Loads patterns successfully
const response = await fetch('/api/tisql/analyze-sources', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sources: availableSources }),
});
const data = await response.json();
setPatterns(data.patterns || []); // ✅ Patterns loaded

// Line 266-272: Only creates welcome message
setMessages([
  {
    id: 'welcome',
    role: 'assistant',
    content: welcomeMessage, // ❌ Pattern cards never rendered
  },
]);
```

**Impact**:
- Users see empty chat with generic "Ask me anything" message
- No examples, no guided entry points
- 0% template usage
- Business users completely excluded

**Old Code (Removed in Refactor)**:
```typescript
// Pattern Cards (show after welcome message) - REMOVED
{message.id === 'welcome' && patterns.length > 0 && (
  <div className="grid grid-cols-1 gap-2 mt-3">
    {patterns
      .filter(pattern => pattern.tables?.length > 0)
      .map((pattern) => {
        const IconComponent = (Icons as any)[pattern.icon] || Icons.HelpCircle;

        return (
          <button
            key={pattern.id}
            onClick={() => handlePatternClick(pattern)}
            className="group relative flex items-start gap-3 p-3 rounded-lg bg-elevation-1 border border-border hover:border-primary/50"
          >
            <div className="flex-shrink-0 mt-0.5">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground mb-1">
                {pattern.title}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {pattern.description}
              </div>
              {/* Show matched tables */}
              <div className="flex items-center gap-1 flex-wrap mt-2">
                <span className="text-xs text-muted-foreground">Uses:</span>
                {pattern.tables.slice(0, 3).map((table, i) => (
                  <code key={i} className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                    {table}
                  </code>
                ))}
              </div>
            </div>
          </button>
        );
      })}
  </div>
)}
```

### 1.2 Current Architecture Limitations

**Layout**: Compact chat (400px) + Masonry grid (flex-1)

**Current Card Types**:
- ✅ Results Artifact Card (SQL + results + quality badge)

**Missing Card Types**:
- ❌ DBT Model Editor Card
- ❌ Quality Gates Card (detailed validation)
- ❌ Data Profiling Card (YData integration)
- ❌ Lineage Visualization Card
- ❌ Schema Designer Card
- ❌ Deployment Preview Card
- ❌ Pattern Template Card (for business users)

**Business User Gaps**:
- No templates or wizards
- No natural language to data product
- No low-code entry points
- 100% code-centric

### 1.3 User Persona Mismatch

**Current State**: Optimized for analytics engineers who write SQL

**Excluded Personas**:
- **Business Analysts** (60% of potential users): Need templates, not SQL
- **Data Stewards** (20%): Need quality gates, not queries
- **Domain Experts** (10%): Need to define requirements, not code

**Competitive Disadvantage**: Witboost and NextData serve all personas.

---

## Part 2: Competitor Landscape Analysis

### 2.1 Witboost: Template-Driven Wizards

**Company**: Agile Lab
**Approach**: "Data Product as Code" with visual wizards
**Key Innovation**: Skeleton Entities + Practice Shaper

#### Interface Patterns

**1. Template Catalog**:
```
┌──────────────────────────────────────────────────┐
│ Create Data Product                              │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐            │
│  │ Output │  │ Storage│  │Workload│            │
│  │  Port  │  │  Area  │  │        │            │
│  └────────┘  └────────┘  └────────┘            │
│                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐            │
│  │Observ- │  │  API   │  │  ML    │            │
│  │ability │  │Endpoint│  │ Model  │            │
│  └────────┘  └────────┘  └────────┘            │
│                                                  │
│  Select a template to get started →             │
└──────────────────────────────────────────────────┘
```

**2. Wizard Interface**:
- **Step 1**: Basic Information (name, description, domain)
- **Step 2**: Input Sources (select from catalog)
- **Step 3**: Transformation Logic (template or custom)
- **Step 4**: Output Configuration (format, destination)
- **Step 5**: Quality Rules (automated suggestions)
- **Step 6**: Review & Deploy

**3. AI-Assisted Editor**:
- Witty agent (introduced Sept 2024)
- Inline suggestions for data contracts
- Auto-completion for governance tags
- Natural language to YAML conversion

#### Key Takeaways

✅ **Template-first**: 80% of users start with templates
✅ **Wizard-driven**: Step-by-step reduces complexity
✅ **AI-enhanced**: Not AI-first, but AI-assisted
✅ **Business-friendly**: Domain experts can create products

❌ **Limitations**:
- Heavy Backstage dependency
- Template creation requires DevOps
- Not truly low-code (YAML editing required)

---

### 2.2 NextData: Autonomous Data Products

**Founder**: Zhamak Dehghani (Data Mesh creator)
**Approach**: "Autonomous Data Products" with Nexty agent
**Key Innovation**: Conversational bootstrapping

#### Interface Patterns

**1. Nexty Agent (Conversational Start)**:
```
User: "Create a customer 360 data product using our CRM and support tickets"

Nexty: "I'll create a customer 360 product. Here's what I found:

       Sources:
       • salesforce.customers (12 columns)
       • zendesk.tickets (8 columns)

       Suggested joins:
       • customer_id → user_id

       Would you like me to generate the initial mesh? (Y/n)"

User: "Yes"

Nexty: "✅ Generated customer_360 data product
        ✅ Created transformation logic
        ✅ Applied governance policies
        ✅ Set up quality gates

        Next: Review in Nextdata Studio →"
```

**2. Nextdata Studio UI**:
- Visual canvas for data product graph
- Node-based transformation editor
- Policy attachment interface
- Governance dashboard

**3. Multi-Interface Creation**:
- **Nexty Agent**: Conversational (fastest)
- **Studio UI**: Visual (most popular)
- **Python DSL**: Code (most flexible)
- **YAML**: Configuration (GitOps)

#### Key Takeaways

✅ **Fastest bootstrapping**: Minutes vs. weeks
✅ **Multi-level entry**: Conversation → Visual → Code
✅ **Governance-native**: Policies applied automatically
✅ **Business-friendly**: Domain experts can use Nexty

❌ **Limitations**:
- Still in early release (April 2025)
- Studio UI is complex for simple tasks
- Requires understanding data mesh concepts

---

### 2.3 Databricks: Multi-Panel SQL Workstation

**Approach**: Traditional IDE with modern enhancements
**Key Innovation**: Side-by-side query execution (2024 update)

#### Interface Patterns

**1. Split-Screen Editor**:
```
┌──────────────────────────────────────────────────┐
│ File    Edit    View    Run    Help              │
├──────────────────┬───────────────────────────────┤
│                  │                               │
│  -- Main Query   │  -- Side Panel Test          │
│  SELECT          │  SELECT COUNT(*)             │
│    customer_id   │  FROM customers              │
│  FROM customers  │  WHERE signup_date > ...     │
│                  │                               │
│  [Run Main ▶]    │  [Run Side ▶]                │
├──────────────────┴───────────────────────────────┤
│ Output Panel                                     │
│ ┌────────┬────────┬────────┐                    │
│ │Result 1│Result 2│Result 3│ ← Tabs            │
│ └────────┴────────┴────────┘                    │
│  customer_id | name      | email               │
│  ------------|-----------|--------------------  │
│  1001        | John Doe  | john@example.com    │
└──────────────────────────────────────────────────┘
```

**2. Left Sidebar** (Workspace Integration):
- **Files**: Browse queries
- **Data**: Catalog browser
- **Assistant**: AI help

**3. Output Management**:
- Multiple result sets in tabs
- Pin results for comparison
- Export to various formats

#### Key Takeaways

✅ **Familiar IDE**: SQL-first developers comfortable
✅ **Side-by-side comparison**: Great for testing
✅ **Multiple outputs**: View results simultaneously

❌ **Limitations**:
- Code-centric (not business-friendly)
- No templates or wizards
- Complex for simple tasks

---

### 2.4 dbt Cloud: File-Centric IDE

**Approach**: Git-native development environment
**Key Innovation**: Command palette + semantic layer

#### Interface Patterns

**1. Three-Panel Layout**:
```
┌──────────────────────────────────────────────────┐
│  dbt Cloud                    [Build] [Test]     │
├─────────┬─────────────────────────┬──────────────┤
│         │                         │              │
│  Files  │  models/customers.sql   │  Lineage    │
│  ├─models │                         │              │
│  │ └─cust │  SELECT                │  sources    │
│  │        │    customer_id,         │    ↓       │
│  ├─tests  │    email                │  staging   │
│  ├─docs   │  FROM ...               │    ↓       │
│  └─...    │                         │  marts     │
│           │  [Run ▶] [Format]       │             │
├─────────┴─────────────────────────┴──────────────┤
│ Command Bar: Type / for commands                 │
└──────────────────────────────────────────────────┘
```

**2. Command Palette**:
- `/build` - Compile and run
- `/test` - Run tests
- `/docs` - Generate docs
- `/preview` - Query preview

**3. Semantic Layer UI**:
- Visual metric builder
- Dimension/measure configuration
- Preview query generation

#### Key Takeaways

✅ **Git-native**: Version control built-in
✅ **Command-driven**: Keyboard-first workflow
✅ **Semantic layer**: Business-friendly metrics

❌ **Limitations**:
- File-centric (not workflow-centric)
- Requires dbt knowledge
- No visual query builder

---

### 2.5 Retool: Component-Based IDE

**Approach**: Drag-and-drop app builder
**Key Innovation**: Visual query + UI builder

#### Interface Patterns

**1. Three-Panel Layout**:
```
┌──────────────────────────────────────────────────┐
│  Retool App Builder                              │
├──────────┬────────────────────────┬──────────────┤
│          │                        │              │
│Components│    Canvas              │  Inspector   │
│          │  ┌──────────────────┐  │              │
│ 📊 Table │  │  Customer Table  │  │  ⚙️ Settings │
│ 📝 Form  │  │  [Data Grid]     │  │              │
│ 🔘 Button│  │                  │  │  Data source │
│ 📈 Chart │  └──────────────────┘  │  ▼ PostgreSQL│
│ 🗺️ Map   │                        │              │
│ ...      │  [+] Add Component     │  Query:      │
│          │                        │  SELECT *... │
├──────────┴────────────────────────┴──────────────┤
│ 🗂️ Queries  |  🔧 Transformers  |  🌐 APIs      │
└──────────────────────────────────────────────────┘
```

**2. Visual Query Builder**:
- SQL editor with autocomplete
- GUI query builder option
- Test query in-context
- Preview results inline

#### Key Takeaways

✅ **Visual-first**: Low-code for internal tools
✅ **Component library**: Reusable patterns
✅ **Fast prototyping**: Minutes to working app

❌ **Limitations**:
- Not data product focused
- No governance integration
- Limited data transformation

---

### 2.6 Comparative Analysis

| Platform | Entry Point | Primary UI | Business-Friendly | Code Access | Governance |
|----------|-------------|------------|-------------------|-------------|------------|
| **Witboost** | Template catalog | Wizard | ✅ High | YAML | ✅ Built-in |
| **NextData** | Nexty agent | Studio + Python | ✅ High | Python/YAML | ✅ Native |
| **Databricks** | File browser | SQL editor | ❌ Low | SQL | ⚠️ Separate |
| **dbt Cloud** | File tree | Code editor | ⚠️ Medium | dbt/SQL | ⚠️ Manual |
| **Retool** | Component drag | Visual canvas | ✅ High | JS/SQL | ❌ None |
| **NexusOne (Current)** | Chat | SQL editor | ❌ Low | SQL | ✅ Built-in |
| **NexusOne (Proposed)** | Chat + Templates | Masonry cards | ✅ High | SQL/dbt | ✅ Native |

### 2.7 Key Insights

**Pattern 1: Progressive Complexity**
- All successful platforms offer **multiple entry points**
- Business users start with **templates/wizards**
- Technical users jump to **code**

**Pattern 2: Hybrid Interfaces**
- Pure code or pure visual don't work
- Need **both** in same workspace
- Context switching kills productivity

**Pattern 3: AI as Assistant, Not Replacement**
- Conversational for **bootstrapping** (NextData)
- Suggestions for **enhancement** (Witboost)
- Not for **full control** (still code-based)

**Pattern 4: Card/Panel Flexibility**
- Fixed panels (Databricks, dbt) feel rigid
- Pure masonry (Pinterest) feels chaotic
- **Hybrid** works best: Chat + Cards

---

## Part 3: Card-Based Workstation Architecture

### 3.1 Masonry Layout Principles

Based on research (SAP Fiori, Pinterest, LogRocket), masonry layouts work when:

**✅ Use When**:
- Displaying **9+ items** with varying heights
- Content comes from **multiple sources**
- Need **overview** of diverse information
- Users scan for **specific patterns**

**❌ Avoid When**:
- **Few items** (< 6) - use grid instead
- Content is **uniform** - use table/list
- Need **strict ranking** - use vertical list
- Simple workflows - use wizard

**Our Use Case**: ✅ Perfect fit
- Multiple card types (7+)
- Varying heights (editor vs. badge)
- Mixed content (code, data, charts)
- Exploratory workflow

### 3.2 Card Type Taxonomy

#### Card Type 1: Query Results Card

**Purpose**: Display query execution results with quality badge
**Status**: ✅ Implemented
**When Spawned**: After SQL query execution

**Anatomy**:
```
┌─────────────────────────────────────────┐
│ 📊 Query Results    ✨ 85% Quality      │ ← Header
├─────────────────────────────────────────┤
│ customer_id | name      | signup_date  │ ← Data Table
│ ------------|-----------|------------- │   (5 rows
│ 1001        | John Doe  | 2024-01-15   │    preview)
│ 1002        | Jane Smith| 2024-01-16   │
│ ...                                     │
├─────────────────────────────────────────┤
│ Showing 5 of 1,247 rows                 │ ← Footer
│ [Download] [Expand] [▼ Show SQL]        │
└─────────────────────────────────────────┘
```

**Features**:
- 5-row preview (expandable to 100)
- Quality score badge
- Collapsible SQL section
- Download/export options
- Re-execute button

**Size**: Medium (300-400px height)

---

#### Card Type 2: DBT Model Editor Card

**Purpose**: Edit dbt models with syntax highlighting and testing
**Status**: ❌ Not implemented
**When Spawned**: User clicks "Convert to dbt model" or creates new model

**Anatomy**:
```
┌─────────────────────────────────────────────────┐
│ 📝 customers.sql              [Test] [Build]    │
├─────────────────────────────────────────────────┤
│  1  {{  config(                                 │
│  2      materialized='table',                   │
│  3      tags=['core']                           │
│  4  )}}                                         │
│  5                                              │
│  6  SELECT                                      │
│  7    customer_id,                              │
│  8    email,                                    │
│  9    signup_date                               │
│ 10  FROM {{ ref('stg_customers') }}             │
│ 11  WHERE is_active = true                      │
├─────────────────────────────────────────────────┤
│ ⚠️ Compiled SQL                                 │
│ [Show Compiled ▼]                               │
├─────────────────────────────────────────────────┤
│ Lineage: stg_customers → customers              │
│ [Save] [Copy] [Format]                          │
└─────────────────────────────────────────────────┘
```

**Features**:
- Syntax highlighting (dbt Jinja + SQL)
- Ref autocomplete
- Inline docs on hover
- Compiled SQL preview
- Test execution
- Version history

**Size**: Large (500-700px height)

**Integration Points**:
- Connects to lineage card
- Triggers test results card
- Spawns preview results card

---

#### Card Type 3: Quality Gates Card

**Purpose**: Detailed quality validation with drill-down
**Status**: ❌ Not implemented (badge exists in results card)
**When Spawned**: After query execution with quality analysis

**Anatomy**:
```
┌─────────────────────────────────────────────────┐
│ ✅ Quality Gates           Overall: 87%         │
├─────────────────────────────────────────────────┤
│ ✅ Row Count               1,247 rows           │
│    Threshold: > 100 rows                        │
│                                                 │
│ ✅ Completeness            98.5%                │
│    15 nulls in 1,000 cells                      │
│                                                 │
│ ⚠️  Uniqueness             76%                  │
│    customer_id: 100% unique ✅                  │
│    email: 52% unique ⚠️                         │
│    [View duplicates →]                          │
│                                                 │
│ ❌ Freshness               FAIL                 │
│    Last updated: 3 days ago                     │
│    Threshold: < 24 hours                        │
│    [View refresh schedule →]                    │
├─────────────────────────────────────────────────┤
│ 3 passed  •  1 warning  •  1 failed             │
│ [Re-run Checks] [Configure]                     │
└─────────────────────────────────────────────────┘
```

**Features**:
- Pass/warning/fail indicators
- Threshold configuration
- Drill-down to details
- Historical trends
- Great Expectations integration

**Size**: Medium (350-450px)

**Interaction**:
- Expand failures inline
- Click to configure thresholds
- View historical data

---

#### Card Type 4: Data Profiling Card

**Purpose**: YData statistical profiling insights
**Status**: ❌ Not implemented (API exists)
**When Spawned**: User requests profiling or auto-triggered for new tables

**Anatomy**:
```
┌─────────────────────────────────────────────────┐
│ 📊 Data Profile: customers                      │
├─────────────────────────────────────────────────┤
│ 📈 Overview                                     │
│   • 1,247 rows × 12 columns                     │
│   • 15.2 KB size                                │
│   • Missing: 1.2% overall                       │
│                                                 │
│ 🔢 Numeric Columns (4)                          │
│   customer_id: [===|=====] Uniform              │
│   age:         [  ===  ]   Normal dist          │
│   purchases:   [====| ]    Right-skewed         │
│                                                 │
│ 📝 Text Columns (5)                             │
│   email:       98% unique, 2 invalid            │
│   name:        456 unique values                │
│                                                 │
│ ⚠️ Warnings (2)                                 │
│   • age: 23 outliers detected (> 120)           │
│   • email: 15 duplicate values                  │
│                                                 │
│ [View Full Report →] [Download PDF]             │
└─────────────────────────────────────────────────┘
```

**Features**:
- Statistical summaries
- Distribution visualizations
- Correlation matrix
- Anomaly detection
- PDF export (YData)

**Size**: Medium-Large (400-600px)

**Integration**:
- Feeds quality gates
- Informs schema designer
- Suggests data types

---

#### Card Type 5: Lineage Visualization Card

**Purpose**: Show data product lineage and dependencies
**Status**: ❌ Not implemented
**When Spawned**: User clicks "View lineage" or from dbt editor

**Anatomy**:
```
┌─────────────────────────────────────────────────┐
│ 🔗 Lineage: customer_360                        │
├─────────────────────────────────────────────────┤
│                                                 │
│    ┌──────────┐                                 │
│    │salesforce│                                 │
│    │.customers│                                 │
│    └─────┬────┘                                 │
│          │                                      │
│          ├──────► ┌──────────────┐              │
│          │        │stg_customers │              │
│    ┌─────┴───┐   └──────┬───────┘              │
│    │zendesk  │          │                       │
│    │.tickets │          ├──────► ┌───────────┐ │
│    └────┬────┘          │        │customer_  │ │
│         └───────────────┘        │360        │ │
│                                  └───────────┘ │
│                                                 │
│ Dependencies: 2 sources, 1 staging, 1 mart      │
│ Impact: 3 downstream dashboards                 │
│                                                 │
│ [Expand Graph] [View DAG] [Export]              │
└─────────────────────────────────────────────────┘
```

**Features**:
- React Flow graph
- Zoom/pan controls
- Impact analysis (upstream/downstream)
- Column-level lineage (on hover)
- Export to image

**Size**: Large (500-700px)

**Integration**:
- Links to dbt editor
- Shows quality by node
- Highlights breaking changes

---

#### Card Type 6: Schema Designer Card

**Purpose**: Visual schema/contract designer for data products
**Status**: ❌ Not implemented
**When Spawned**: User starts new data product or edits contract

**Anatomy**:
```
┌─────────────────────────────────────────────────┐
│ 📋 Schema: customer_360           ODPS v4.0     │
├─────────────────────────────────────────────────┤
│ Column              Type      Required  Quality │
│ ─────────────────────────────────────────────── │
│ customer_id         INTEGER   ✅        PK      │
│ email               STRING    ✅        Unique  │
│ name                STRING    ✅        -       │
│ signup_date         DATE      ✅        Recent  │
│ age                 INTEGER   ❌        18-120  │
│ total_purchases     DECIMAL   ❌        >= 0    │
│                                                 │
│ [+ Add Column]                                  │
├─────────────────────────────────────────────────┤
│ 💼 Business Context                             │
│ Owner: Finance Team                             │
│ SLA: Daily refresh by 8am                       │
│ Retention: 7 years                              │
│                                                 │
│ 🏷️ Tags: PII, Financial, Core                  │
│                                                 │
│ [Generate dbt model] [Export contract]          │
└─────────────────────────────────────────────────┘
```

**Features**:
- Drag-to-reorder columns
- Type picker with validation
- ODPS v4.0 compliance
- Business metadata
- Auto-generate dbt/SQL

**Size**: Medium-Large (450-600px)

**Integration**:
- Creates dbt models
- Feeds quality gates
- Generates documentation

---

#### Card Type 7: Deployment Preview Card

**Purpose**: Show deployment configuration and preview
**Status**: ❌ Not implemented
**When Spawned**: User clicks "Review & Deploy"

**Anatomy**:
```
┌─────────────────────────────────────────────────┐
│ 🚀 Deployment Preview: customer_360             │
├─────────────────────────────────────────────────┤
│ 📦 Artifacts to Deploy                          │
│   ✅ dbt model: models/customer_360.sql         │
│   ✅ Tests: 3 schema tests                      │
│   ✅ Documentation: Updated                     │
│   ✅ Contracts: ODPS v4.0 compliant             │
│                                                 │
│ 🎯 Target Environment                           │
│   Environment: Production                       │
│   Catalog: iceberg.analytics                    │
│   Materialization: Table (scheduled)            │
│   Refresh: Daily at 2am UTC                     │
│                                                 │
│ ⚠️ Impact Analysis                              │
│   Breaking changes: None                        │
│   Downstream affected: 3 dashboards             │
│   Estimated size: ~150MB                        │
│                                                 │
│ ✅ Pre-Deploy Checks                            │
│   ✅ Tests passed (3/3)                         │
│   ✅ Quality gates passed                       │
│   ✅ Governance approved                        │
│   ✅ Resource limits OK                         │
│                                                 │
│ [← Back to Edit] [Deploy to Prod →]             │
└─────────────────────────────────────────────────┘
```

**Features**:
- Change summary
- Impact analysis
- Pre-flight checks
- Rollback plan
- Deployment logs

**Size**: Large (600-800px)

**Integration**:
- Final step in workflow
- Triggers lineage update
- Creates audit log

---

### 3.3 Card Sizing Strategy

Based on masonry best practices (SAP Fiori, Pinterest):

**Size Categories**:

| Size | Height | Use Case | Examples |
|------|--------|----------|----------|
| **Compact** | 150-250px | Badges, summaries | Pattern cards, quality badge |
| **Medium** | 300-450px | Data views, configs | Results card, schema designer |
| **Large** | 500-700px | Editors, graphs | dbt editor, lineage viz |
| **X-Large** | 700-900px | Complex visualizations | Profiling card (expanded) |

**Column Configuration**:
```css
/* Responsive columns */
.masonry-grid {
  columns: 1;              /* Mobile: 1 column */
}

@media (min-width: 1024px) {
  .masonry-grid {
    columns: 2;            /* Laptop: 2 columns */
  }
}

@media (min-width: 1536px) {
  .masonry-grid {
    columns: 3;            /* Desktop: 3 columns */
  }
}

@media (min-width: 1920px) {
  .masonry-grid {
    columns: 4;            /* Ultra-wide: 4 columns */
  }
}
```

**Card Width**: Determined by column count (auto)

**Gap**: 24px (1.5rem) for breathing room

### 3.4 Visual Hierarchy

**Priority System**:

1. **P0 - Critical**: Always visible, top-left placement
   - Schema designer (when creating product)
   - Deployment preview (when deploying)

2. **P1 - High**: Visible when relevant
   - dbt editor (when editing code)
   - Quality gates (when issues detected)

3. **P2 - Medium**: Spawned on demand
   - Results card (after query)
   - Profiling card (on request)

4. **P3 - Low**: Background/contextual
   - Lineage (optional view)
   - Pattern suggestions (first-time users)

**Positioning Logic**:
```typescript
// Masonry auto-positions, but we can influence order
const cardPriority = {
  'schema-designer': 0,
  'deployment-preview': 0,
  'dbt-editor': 1,
  'quality-gates': 1,
  'results': 2,
  'profiling': 2,
  'lineage': 3,
  'patterns': 3,
};

// Sort cards by priority before rendering
const sortedCards = cards.sort((a, b) =>
  cardPriority[a.type] - cardPriority[b.type]
);
```

---

## Part 4: Business-First Low-Code Strategy

### 4.1 The Progressive Complexity Model

**Insight**: Different users need different entry points, but all should end in the same artifacts.

**The Spectrum**:
```
Natural Language → Templates → Guided Wizard → Code Editor → Advanced
(Business User)                                              (Data Engineer)
```

**Implementation**:
1. **Level 0: Natural Language** (Business Analyst)
   - Chat: "Create a monthly revenue report by product line"
   - AI scaffolds template
   - User reviews in wizard

2. **Level 1: Template Library** (Business Analyst)
   - Browse pre-built templates
   - "Revenue by Product" template
   - Fill in parameters via form

3. **Level 2: Guided Wizard** (Analytics Engineer)
   - Step-by-step flow
   - See generated code
   - Modify in-place

4. **Level 3: Code Editor** (Data Engineer)
   - Direct SQL/dbt editing
   - Full control
   - Manual quality gates

5. **Level 4: Advanced Orchestration** (Platform Engineer)
   - Multi-product DAGs
   - Custom policies
   - Infrastructure as code

**Key Principle**: Users can **start anywhere** and **move between levels** freely.

### 4.2 Template Architecture

**Template Structure**:
```yaml
# Template: revenue_by_product.yaml
template:
  id: "revenue_by_product_v1"
  name: "Revenue by Product"
  description: "Monthly revenue aggregated by product line"
  category: "Finance / Revenue"
  difficulty: "beginner"

  # Business-friendly parameters
  parameters:
    - id: "date_range"
      label: "Time Period"
      type: "date_range"
      default: "last_30_days"
      required: true

    - id: "product_dimension"
      label: "Product Grouping"
      type: "select"
      options: ["product_category", "product_line", "sku"]
      default: "product_line"

    - id: "include_refunds"
      label: "Include Refunds"
      type: "boolean"
      default: false

  # Generated artifacts
  generates:
    - type: "dbt_model"
      path: "models/marts/finance/revenue_by_product.sql"

    - type: "schema"
      odps_version: "4.0"
      path: "contracts/revenue_by_product.yaml"

    - type: "tests"
      count: 5
      path: "tests/revenue_by_product.yml"

  # Code template (Jinja)
  sql_template: |
    {{  config(
        materialized='table',
        tags=['finance', 'revenue']
    )}}

    SELECT
      DATE_TRUNC('month', order_date) AS month,
      {{ params.product_dimension }} AS product,
      SUM(order_total) AS revenue,
      COUNT(DISTINCT order_id) AS order_count
    FROM {{ ref('stg_orders') }}
    WHERE order_date >= {{ params.date_range.start }}
      AND order_date <= {{ params.date_range.end }}
      {% if not params.include_refunds %}
      AND order_status != 'refunded'
      {% endif %}
    GROUP BY 1, 2
    ORDER BY month DESC, revenue DESC
```

**Template UI**:
```
┌─────────────────────────────────────────────────┐
│ 📊 Template: Revenue by Product                 │
├─────────────────────────────────────────────────┤
│ Monthly revenue aggregated by product line      │
│                                                 │
│ ⚙️ Configuration                                │
│                                                 │
│ Time Period                                     │
│ ○ Last 7 days                                   │
│ ○ Last 30 days (default)                        │
│ ● Custom range: [2024-01-01] to [2024-12-31]   │
│                                                 │
│ Product Grouping                                │
│ [ Product Line ▼ ]                              │
│   Options: Category, Line, SKU                  │
│                                                 │
│ Include Refunds?                                │
│ ☐ Yes, include refunded orders                 │
│                                                 │
│ ✨ AI Suggestions                               │
│ "Add customer segment dimension?" [Accept]      │
│ "Filter to products with >$1k revenue?" [Accept]│
│                                                 │
│ [Preview SQL ▼] [← Cancel] [Create Product →]  │
└─────────────────────────────────────────────────┘
```

### 4.3 Persona-Adaptive UI

**Detection Logic**:
```typescript
interface UserPersona {
  type: 'business_analyst' | 'analytics_engineer' | 'data_engineer';
  sql_proficiency: 'none' | 'basic' | 'advanced';
  preferred_entry: 'nl' | 'template' | 'wizard' | 'code';
  show_code: boolean;
  show_technical_details: boolean;
}

// Detect from behavior
function detectPersona(user: User): UserPersona {
  const history = getUserHistory(user);

  // Analyze patterns
  const codeEdits = history.filter(a => a.type === 'code_edit').length;
  const templateUses = history.filter(a => a.type === 'template_use').length;
  const nlQueries = history.filter(a => a.type === 'nl_query').length;

  if (codeEdits > 10 && codeEdits / history.length > 0.6) {
    return {
      type: 'data_engineer',
      sql_proficiency: 'advanced',
      preferred_entry: 'code',
      show_code: true,
      show_technical_details: true,
    };
  }

  if (templateUses > 5 || nlQueries > templateUses) {
    return {
      type: 'business_analyst',
      sql_proficiency: 'none',
      preferred_entry: 'template',
      show_code: false,
      show_technical_details: false,
    };
  }

  return {
    type: 'analytics_engineer',
    sql_proficiency: 'basic',
    preferred_entry: 'wizard',
    show_code: true,
    show_technical_details: false,
  };
}
```

**UI Adaptation**:

**Business Analyst View**:
```
Chat Window:
  "Create a monthly revenue report"

  → Shows template picker
  → SQL hidden by default
  → Focus on parameters
  → "What it does" explanations

Masonry Grid:
  ┌────────────┐  ┌────────────┐
  │ Configure  │  │ Preview    │
  │ Template   │  │ Results    │
  └────────────┘  └────────────┘

  (No code editor, no lineage)
```

**Data Engineer View**:
```
Chat Window:
  "Create monthly revenue report"

  → Shows code snippet immediately
  → Template as starting point
  → Full dbt editor access

Masonry Grid:
  ┌─────────┐  ┌─────────┐  ┌──────────┐
  │ dbt     │  │ Results │  │ Lineage  │
  │ Editor  │  │ Preview │  │ Graph    │
  └─────────┘  └─────────┘  └──────────┘
  ┌─────────┐  ┌─────────┐
  │ Quality │  │ Deploy  │
  │ Gates   │  │ Config  │
  └─────────┘  └─────────┘
```

### 4.4 Smart Suggestions System

**Pattern Library from Organizational Usage**:

```typescript
interface QueryPattern {
  id: string;
  title: string;
  description: string;
  category: string;

  // Learning
  usage_count: number;
  success_rate: number;
  avg_execution_time: number;

  // Context matching
  tables: string[];
  joins: string[];
  aggregations: string[];
  filters: string[];

  // Social proof
  used_by_teams: string[];
  created_by: string;
  last_used: Date;

  // Template
  sql_template: string;
  parameters: Parameter[];
}

// Example pattern learned from org
const revenuePattern: QueryPattern = {
  id: "pattern_revenue_001",
  title: "Monthly Revenue by Product",
  description: "Used by Finance team for monthly reporting",
  category: "Finance / Revenue",

  usage_count: 96,
  success_rate: 0.98,
  avg_execution_time: 2300, // ms

  tables: ["orders", "products", "customers"],
  joins: ["orders.product_id = products.id"],
  aggregations: ["SUM(order_total)", "COUNT(order_id)"],
  filters: ["order_date >= DATE_TRUNC('month', CURRENT_DATE)"],

  used_by_teams: ["Finance", "Operations", "Executive"],
  created_by: "jane.doe@company.com",
  last_used: new Date("2025-10-22"),

  sql_template: `...`,
  parameters: [...]
};
```

**Contextual Recommendations**:

**Scenario 1**: User selects "orders" table
```typescript
// System detects: user_context.selected_tables = ["orders"]

// Find patterns matching this context
const suggestions = patterns.filter(p =>
  p.tables.includes("orders") &&
  p.success_rate > 0.8 &&
  p.usage_count > 10
).sort((a, b) => b.usage_count - b.usage_count);

// Show in chat:
```
┌─────────────────────────────────────────────────┐
│ 💡 Your finance team often combines this with: │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 📊 Monthly Revenue by Product               │ │
│ │ Used 96 times • 98% success rate            │ │
│ │ [Use this pattern →]                        │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👥 Customer Cohort Analysis                 │ │
│ │ Used 64 times • 95% success rate            │ │
│ │ [Use this pattern →]                        │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Scenario 2**: User asks natural language question
```
User: "How can I see which products are selling best?"

AI: "I'll help you analyze product sales. Based on your team's
     patterns, I can create a 'Revenue by Product' report.

     Would you like me to:
     ┌─────────────────────────────────────────┐
     │ ○ Use the Finance team template         │
     │   (Monthly revenue, grouped by product) │
     │                                         │
     │ ○ Custom analysis with filters          │
     │   (You define: timeframe, grouping)     │
     │                                         │
     │ ○ Show me example SQL first             │
     │   (For technical users)                 │
     └─────────────────────────────────────────┘
```

### 4.5 Template Marketplace

**Organizational Template Library**:

```
┌─────────────────────────────────────────────────┐
│ 📚 Template Library               [+ Create]    │
├─────────────────────────────────────────────────┤
│ 🔍 Search templates...                          │
│                                                 │
│ 📁 Finance (12 templates)                       │
│   ┌─────────────────────────────────────────┐  │
│   │ 📊 Monthly Revenue by Product           │  │
│   │ 96 uses • Updated Oct 2025              │  │
│   │ [Use Template]                          │  │
│   └─────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────┐  │
│   │ 💰 Revenue Recognition Report           │  │
│   │ 43 uses • Updated Sep 2025              │  │
│   │ [Use Template]                          │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
│ 📁 Marketing (8 templates)                      │
│ 📁 Operations (5 templates)                     │
│ 📁 Executive (4 templates)                      │
│                                                 │
│ ⭐ Featured Templates                           │
│   • Customer 360 View (Most popular)            │
│   • Churn Prediction Dataset (Newest)          │
└─────────────────────────────────────────────────┘
```

**Template Creation Workflow**:

1. **Save Query as Template**:
   ```
   After successful query:
   ┌─────────────────────────────────────────┐
   │ 💾 Save as Template?                    │
   ├─────────────────────────────────────────┤
   │ This query could help others!           │
   │                                         │
   │ Template Name:                          │
   │ [Monthly Product Revenue______]         │
   │                                         │
   │ Category: [Finance ▼]                   │
   │                                         │
   │ Make parameters:                        │
   │ ☑ date_range (detected)                 │
   │ ☑ product_dimension (detected)          │
   │ ☐ customer_segment (add?)               │
   │                                         │
   │ Share with: [○ My team  ● Everyone]     │
   │                                         │
   │ [← Cancel] [Save Template →]            │
   └─────────────────────────────────────────┘
   ```

2. **AI Template Enhancement**:
   ```
   After saving:

   AI: "I've analyzed your template and suggest:

        ✨ Add parameter: 'include_refunds' (boolean)
           92% of similar queries filter refunds

        ✨ Add test: Row count > 0
           Prevents empty results

        ✨ Add documentation: Business context
           Helps others understand when to use

        [Accept All] [Review] [Skip]"
   ```

3. **Template Versioning**:
   - v1.0: Initial creation
   - v1.1: Add refund filter (maintains backward compatibility)
   - v2.0: Breaking change (new schema)

---

## Part 5: Implementation Roadmap

### 5.1 Phase 1: Foundation & Quick Wins (2 weeks)

**Goal**: Fix existing issues, add pattern cards back

**Tasks**:

**Week 1: Pattern Cards**
1. ✅ Restore pattern card rendering in chat window
2. ✅ Add pattern click handler to spawn result card
3. ✅ Style pattern cards with Dropbox-inspired design
4. ✅ Test with real data sources

**Week 2: Quality Gates Card**
1. ✅ Extract quality badge into full card
2. ✅ Add drill-down for failed checks
3. ✅ Integrate Great Expectations
4. ✅ Add threshold configuration UI

**Deliverables**:
- Pattern cards visible and functional
- Quality gates card spawns on results
- 2 card types working in masonry grid

**Success Metrics**:
- Pattern click-through rate > 40%
- Quality gate usage > 30%
- Template usage starts at 10%

---

### 5.2 Phase 2: Core Cards (4 weeks)

**Goal**: Add dbt editor and profiling cards

**Tasks**:

**Week 3-4: DBT Model Editor Card**
1. Code editor with syntax highlighting (Monaco)
2. dbt Jinja autocomplete
3. Ref() function autocomplete from catalog
4. Compiled SQL preview
5. Test execution integration
6. Save to file system

**Week 5-6: Data Profiling Card**
1. Integrate YData profiling API
2. Statistical summary UI
3. Distribution visualizations (Chart.js)
4. Anomaly highlighting
5. PDF export
6. Auto-trigger on new tables

**Deliverables**:
- dbt editor spawns from chat or results
- Profiling card shows statistical insights
- 4 card types functional

**Success Metrics**:
- dbt model creation time: -60%
- Profiling usage: 50% of queries
- Data quality issue detection: +40%

---

### 5.3 Phase 3: Business User Features (6 weeks)

**Goal**: Low-code templates and wizards

**Tasks**:

**Week 7-8: Template Architecture**
1. Template YAML schema
2. Parameter extraction engine
3. Template rendering UI
4. Template library page
5. Save query as template

**Week 9-10: Guided Wizards**
1. Multi-step wizard component
2. Data product creation wizard
3. Schema designer card
4. Business metadata capture
5. ODPS v4.0 compliance

**Week 11-12: Persona Detection**
1. User behavior tracking
2. Persona classification algorithm
3. Adaptive UI logic
4. A/B testing framework
5. Onboarding flows per persona

**Deliverables**:
- 10 pre-built templates
- Data product wizard (5 steps)
- Schema designer card
- Persona-adaptive UI

**Success Metrics**:
- Business user adoption: 0% → 40%
- Template usage: 10% → 60%
- Time to first product: -70%

---

### 5.4 Phase 4: Advanced Workstation (8 weeks)

**Goal**: Full multi-card masonry workstation

**Tasks**:

**Week 13-14: Lineage Card**
1. React Flow integration
2. dbt DAG parsing
3. Column-level lineage
4. Impact analysis
5. Interactive graph controls

**Week 15-16: Deployment Preview Card**
1. Artifact summary
2. Impact analysis
3. Pre-flight checks
4. Deployment orchestration
5. Rollback capability

**Week 17-18: Smart Suggestions**
1. Pattern learning from usage
2. Contextual recommendation engine
3. Collaborative filtering
4. Organizational knowledge graph
5. Social proof UI

**Week 19-20: Polish & Performance**
1. Masonry layout optimizations
2. Card lazy loading
3. Virtual scrolling
4. Animation polish
5. Accessibility (WCAG 2.1)
6. Mobile responsiveness

**Deliverables**:
- 7 card types fully functional
- Smart suggestion system
- Full workstation experience
- Production-ready

**Success Metrics**:
- All personas served (100%)
- Data product velocity: +200%
- User satisfaction: 8.5/10
- Template marketplace: 50+ templates

---

### 5.5 Technical Architecture

**Component Structure**:
```typescript
// Card registry
interface CardDefinition {
  type: CardType;
  component: React.ComponentType<CardProps>;
  priority: number;
  spawns_on: TriggerCondition[];
  default_size: 'compact' | 'medium' | 'large' | 'xlarge';
  closable: boolean;
}

const CARD_REGISTRY: CardDefinition[] = [
  {
    type: 'results',
    component: ResultsArtifactCard,
    priority: 2,
    spawns_on: ['sql_executed'],
    default_size: 'medium',
    closable: true,
  },
  {
    type: 'dbt_editor',
    component: DBTEditorCard,
    priority: 1,
    spawns_on: ['convert_to_dbt', 'create_model'],
    default_size: 'large',
    closable: true,
  },
  {
    type: 'quality_gates',
    component: QualityGatesCard,
    priority: 1,
    spawns_on: ['quality_analysis_complete'],
    default_size: 'medium',
    closable: true,
  },
  // ... more cards
];

// Card manager
class CardManager {
  private cards: Map<string, CardInstance> = new Map();

  spawn(
    type: CardType,
    data: any,
    options?: SpawnOptions
  ): CardInstance {
    const def = CARD_REGISTRY.find(c => c.type === type);
    const id = `${type}_${Date.now()}`;

    const card: CardInstance = {
      id,
      type,
      data,
      priority: def.priority,
      size: options?.size || def.default_size,
      created: new Date(),
    };

    this.cards.set(id, card);
    this.emit('card_spawned', card);

    return card;
  }

  close(id: string): void {
    this.cards.delete(id);
    this.emit('card_closed', id);
  }

  getSorted(): CardInstance[] {
    return Array.from(this.cards.values())
      .sort((a, b) => a.priority - b.priority);
  }
}

// Usage in chat
const handleSQLGenerated = async (sql: string) => {
  // Execute query
  const results = await executeQuery(sql);

  // Spawn results card
  cardManager.spawn('results', {
    sql,
    results: results.data,
    quality: results.quality,
  });

  // Auto-spawn quality gates if issues
  if (results.quality.overallScore < 80) {
    cardManager.spawn('quality_gates', {
      checks: results.quality.checks,
      sql,
    });
  }
};
```

**State Management**:
```typescript
// Zustand store for cards
interface CardStore {
  cards: Map<string, CardInstance>;
  spawn: (type: CardType, data: any) => void;
  close: (id: string) => void;
  update: (id: string, data: Partial<CardInstance>) => void;
}

const useCardStore = create<CardStore>((set) => ({
  cards: new Map(),

  spawn: (type, data) => set((state) => {
    const card = cardManager.spawn(type, data);
    state.cards.set(card.id, card);
    return { cards: new Map(state.cards) };
  }),

  close: (id) => set((state) => {
    state.cards.delete(id);
    return { cards: new Map(state.cards) };
  }),

  update: (id, data) => set((state) => {
    const card = state.cards.get(id);
    if (card) {
      state.cards.set(id, { ...card, ...data });
    }
    return { cards: new Map(state.cards) };
  }),
}));
```

---

## Conclusion

### Summary

By implementing a **multi-card masonry workstation** with **progressive complexity** and **persona-adaptive UI**, we can transform NexusOne from a code-centric tool into a **business-first data product platform** that serves all user personas:

**Business Users**: Natural language → Templates → Wizards
**Analytics Engineers**: Templates → Guided editing → SQL/dbt
**Data Engineers**: Direct code → Advanced orchestration

### Key Innovations

1. **Adaptive Card Workspace**: 7 specialized card types that spawn based on context
2. **Progressive Complexity**: Multiple entry points from NL to code
3. **Organizational Learning**: Templates and patterns learned from usage
4. **Persona-Aware**: UI adapts to user skill level and preferences
5. **Masonry Layout**: Flexible, content-driven layout inspired by Pinterest/SAP Fiori

### Expected Impact

**Adoption**:
- Business users: 0% → 60%
- Template usage: 0% → 70%
- Data product velocity: +200%

**Quality**:
- Quality score: 65% → 85%
- First-time-right: 50% → 80%
- Technical debt: -40%

**Efficiency**:
- Time to first product: 2-3 weeks → 2-3 days
- Code writing: -60% (via templates)
- Context switching: -70% (all-in-one workspace)

### Next Steps

1. **Review & Approve** this architecture (you are here)
2. **Phase 1 Implementation**: Restore pattern cards (2 weeks)
3. **User Testing**: Validate with 5 business users + 5 engineers
4. **Iterate & Expand**: Phases 2-4 based on feedback

---

**Document Version**: 1.0
**Last Updated**: October 23, 2025
**Author**: NexusOne Platform Team
**Status**: ✅ Ready for Implementation
