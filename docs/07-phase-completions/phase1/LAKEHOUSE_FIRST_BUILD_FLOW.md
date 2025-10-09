# Lakehouse-First Build Flow Architecture
**Date**: January 2025
**Status**: In Development
**Paradigm Shift**: From "Connect to Sources" → "Contract-First, Lakehouse-Native"

---

## Executive Summary

This document describes the **NEW lakehouse-first approach** to building data products in NexusOne. This represents a fundamental architectural shift from the previous "unified build flow" which was designed around connecting to external data sources.

### Core Insight
**All data is already in the Iceberg lakehouse.** Users don't "connect" to MySQL or Kafka - they browse, select, and compose from existing lakehouse tables.

### Key Principles
1. **Contract-First**: Define what you WANT before selecting what you HAVE
2. **Lakehouse-Native**: Browse Iceberg tables, not external connectors
3. **Real SQL Tooling**: Use production-grade tools (Superset + Tisql), not toy editors
4. **Saved Query Reuse**: Leverage organizational knowledge from playground
5. **Quality-Driven**: Build quality rules into the contract, not as an afterthought

---

## Architecture Overview

### Flow Structure
```
Entry Point (/build)
├─ Natural language input for intent
├─ Template selection (Customer 360, ML Features, etc.)
└─ Quick actions (Browse Lakehouse, Join Tables, Add Logic)
    ↓
Define: Contract & Intent (/build/new/define)
├─ Output Schema Designer (what columns/types you want)
├─ Quality Rules Builder (Great Expectations presets)
├─ SLA Configuration (refresh frequency, latency)
└─ Business Context (purpose, stakeholders)
    ↓
Source: Browse Lakehouse (/build/new/source)
├─ TanStack Catalog Browser (group by domain/quality/freshness)
├─ DataHub Metadata Panels (schema, lineage, samples)
├─ Table Detail View (click to explore)
└─ Multi-Select Tables (for joins/composition)
    ↓
Transform: SQL Development (/build/new/transform)
├─ Exploration Mode: Superset SqlLab (ad-hoc analysis)
├─ Development Mode: Tisql Editor (production SQL)
├─ Saved Query Library (load from playground)
└─ Context Panels (selected tables, quality rules, contract)
    ↓
Deliver: Deployment & Access (/build/new/deliver)
├─ Materialize as Table
├─ Create Virtual View
├─ Generate REST API
└─ Stream to Kafka Topic
```

---

## Phase 1: Contract Definition (Define Step)

### Philosophy
Users should define **what they want to build** before worrying about where the data comes from. This contract becomes the North Star for the entire workflow.

### Components Implemented

#### 1. **ContractSchemaDesigner** ✅
**File**: `components/build/ContractSchemaDesigner.tsx` (285 lines)

**Purpose**: Visual builder for defining the desired output schema

**Features**:
- Drag-and-drop field reordering
- 8 data types: String, Integer, Float, Boolean, Timestamp, Date, Array, JSON
- Field properties: Name, type, nullable flag, description
- Example templates: Customer, Order, Event schemas
- Visual type indicators with color coding
- Schema summary: Field count, required vs optional breakdown

**User Flow**:
1. Click "Add Field" or "Load Example"
2. Define field name (e.g., `customer_id`, `email`, `total_spend`)
3. Select data type with visual icons
4. Mark as required/optional
5. Add description for documentation
6. Drag to reorder fields
7. See live summary of schema completeness

**Example Schema Output**:
```json
{
  "fields": [
    {
      "name": "customer_id",
      "type": "string",
      "nullable": false,
      "description": "Unique customer identifier"
    },
    {
      "name": "email",
      "type": "string",
      "nullable": false,
      "description": "Customer email address"
    },
    {
      "name": "lifetime_value",
      "type": "float",
      "nullable": true,
      "description": "Total customer spend in USD"
    }
  ]
}
```

#### 2. **QualityRulesBuilder** ✅
**File**: `components/build/QualityRulesBuilder.tsx` (365 lines)

**Purpose**: Configure data quality checks using Great Expectations framework

**Features**:
- 6 rule categories:
  - **Completeness**: No missing/null values
  - **Uniqueness**: No duplicate records
  - **Validity**: Format and range checks
  - **Consistency**: Cross-field relationships
  - **Timeliness**: Freshness monitoring
  - **Accuracy**: Statistical distribution checks
- 16 predefined rules covering common scenarios
- Severity levels: Critical, Warning, Info
- Preset configurations: Minimal, Standard, Strict
- Collapsible categories for focused selection
- Live summary of enabled rules

**User Flow**:
1. Choose preset (Minimal/Standard/Strict) or customize
2. Expand category (e.g., Completeness)
3. Enable/disable specific rules (e.g., "Primary Key Not Null")
4. See severity badges (Critical, Warning, Info)
5. Review summary: X rules enabled, Y critical checks

**Example Rules Output**:
```json
{
  "rules": [
    {
      "id": "not_null_pk",
      "category": "completeness",
      "name": "Primary Key Not Null",
      "severity": "critical",
      "enabled": true
    },
    {
      "id": "unique_pk",
      "category": "uniqueness",
      "name": "Primary Key Unique",
      "severity": "critical",
      "enabled": true
    },
    {
      "id": "freshness_check",
      "category": "timeliness",
      "name": "Data Freshness",
      "severity": "warning",
      "enabled": true
    }
  ]
}
```

#### 3. **SLA Configuration** (Pending)
**To Be Built**: `components/build/SLAConfiguration.tsx`

**Purpose**: Define refresh frequency, latency requirements, uptime SLAs

**Planned Features**:
- Refresh frequency selector (Real-time, 5min, Hourly, Daily, Weekly)
- Latency tolerance (seconds, minutes, hours)
- Uptime SLA (99%, 99.9%, 99.99%)
- Alert configuration (email, Slack, PagerDuty)
- Dependent downstream products (auto-trigger refreshes)

---

## Phase 2: Lakehouse Browsing (Source Step)

### Philosophy
All data is already in Iceberg lakehouse. Users browse existing tables with intelligent grouping and rich metadata, not "connect" to external sources.

### Components Implemented

#### 1. **LakehouseCatalogBrowser** ✅
**File**: `components/build/LakehouseCatalogBrowser.tsx` (410 lines)

**Purpose**: Browse and select Iceberg tables from lakehouse

**Features**:
- **TanStack React Table** for high-performance rendering
- **Smart grouping**: Domain, Schema, Freshness, Quality score
- **Faceted search**: Filter by table name, schema, domain, tags
- **Rich metadata display**:
  - Table full name (catalog.schema.table)
  - Domain badge
  - Quality score (Excellent, Good, Fair, Poor)
  - Freshness indicator (Real-time, Hourly, Daily, Stale)
  - Row count and size (formatted: 2.5M rows, 12.5 GB)
  - Tags (PII, customer, core, etc.)
- **Multi-select support**: Configurable for joins
- **Selection summary**: Shows count with "Clear Selection" action
- **Expandable groups**: Click to show/hide tables in group
- **Visual selection state**: Checkboxes, highlighted rows

**User Flow**:
1. See tables grouped by domain (e.g., "Sales", "Marketing")
2. Use search to filter by name/schema/domain
3. Change grouping (Domain → Freshness → Quality)
4. Click group to expand and see tables
5. Select one or more tables
6. See selection summary at top
7. Click table row for details (opens TableDetailPanel)

**Mock Data Structure**:
```typescript
interface IcebergTable {
  id: string;                    // 'iceberg.sales.customers'
  catalog: string;               // 'iceberg'
  schema: string;                // 'sales'
  name: string;                  // 'customers'
  full_name: string;             // 'iceberg.sales.customers'
  domain: string;                // 'Sales'
  owner: string;                 // 'sales-eng'
  description: string;           // 'Customer master data...'
  row_count: number;             // 2500000
  size_gb: number;               // 12.5
  last_updated: string;          // ISO timestamp
  quality_score: number;         // 95 (0-100)
  freshness: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'stale';
  tags: string[];                // ['pii', 'customer', 'core']
  columns: number;               // 24
  source_system?: string;        // 'Salesforce'
}
```

#### 2. **TableDetailPanel** (Pending)
**To Be Built**: `components/build/TableDetailPanel.tsx`

**Purpose**: Show detailed metadata when user clicks a table

**Planned Features**:
- **Schema viewer**: Column names, types, descriptions
- **Sample data**: First 10 rows preview
- **Quality metrics**: Completeness, uniqueness, validity scores
- **Lineage graph**: Upstream sources, downstream consumers
- **Usage stats**: Query count, top users, access patterns
- **DataHub integration**: Fetch metadata from DataHub API
- **Tags and glossary**: Business terms, data classification

---

## Phase 3: SQL Development (Transform Step)

### Philosophy
Use **real** SQL tools that data engineers already know, not toy editors. Provide dual-mode workflow: explore with Superset, develop with Tisql.

### Components To Build

#### 1. **HybridSQLWorkbench** (Pending)
**To Be Built**: `components/build/HybridSQLWorkbench.tsx`

**Purpose**: Dual-mode SQL environment for exploration and development

**Planned Features**:
- **Mode Toggle**: Switch between Exploration (Superset) and Development (Tisql)
- **Exploration Mode**: Embedded Superset SqlLab iframe
  - Ad-hoc queries
  - Data profiling
  - Quick chart creation
  - Save to query library
- **Development Mode**: Tisql editor (reuse from `/playground`)
  - Monaco editor with SQL syntax
  - Trino autocomplete
  - AI assistance (Ctrl+I)
  - Schema browser
  - Query execution
- **Context Panels**:
  - Selected lakehouse tables (from Source step)
  - Output schema contract (from Define step)
  - Quality rules to implement
- **Query Transfer**: Copy SQL from exploration to development

**User Flow**:
1. Start in Exploration mode (Superset)
2. Write ad-hoc queries to understand data
3. Profile table distributions
4. Once satisfied, switch to Development mode (Tisql)
5. Write production SQL with AI assistance
6. Reference contract schema in context panel
7. Implement quality rules in SQL logic
8. Test query execution
9. Save and continue to Deliver

#### 2. **SavedQueryBrowser** (Pending)
**To Be Built**: `components/build/SavedQueryBrowser.tsx`

**Purpose**: Browse and load saved queries from playground

**Planned Features**:
- **TanStack Table** for query library display
- **Metadata**: Query name, author, created date, tags
- **Search/Filter**: By name, author, tags, tables used
- **Preview**: SQL code snippet with syntax highlighting
- **Load Action**: Insert query into active editor
- **Fork/Clone**: Create new query based on existing
- **Usage Stats**: Times loaded, success rate

---

## Phase 4: Deployment (Deliver Step)

### Philosophy
Simplify deployment to focus on **access patterns**, not product taxonomy. Remove Foundation/Domain/Solution branching.

### Components To Update

#### **Deliver Step Redesign** (Pending)
**File**: `app/(main)/build/new/deliver/page.tsx` (to be updated)

**Purpose**: Configure how users access the data product

**Planned Changes**:
- **Remove**: Product type-specific delivery options
- **Add**: Unified access pattern selection
- **Delivery Options**:
  1. **Materialized Table**: Iceberg table with scheduled refresh
  2. **Virtual View**: On-demand query execution (no storage)
  3. **REST API**: Auto-generated FastAPI endpoint
  4. **Kafka Stream**: Real-time event stream
  5. **dbt Model**: Export as dbt transformation

**Configuration Per Option**:
- **Materialized**: Refresh schedule (from SLA), partitioning, clustering
- **Virtual**: Query timeout, caching strategy
- **API**: Authentication (API key, OAuth), rate limiting
- **Stream**: Topic name, retention, partitioning key
- **dbt**: Model name, materialization type, tests

---

## Implementation Status

### ✅ Completed
1. **Entry page updates**: Removed "Connect to MySQL" language, added lakehouse browsing
2. **LakehouseCatalogBrowser**: TanStack table with smart grouping
3. **ContractSchemaDesigner**: Visual schema builder with drag-drop
4. **QualityRulesBuilder**: Great Expectations rule selector

### 🚧 In Progress
5. **Define step integration**: Wire up schema designer + quality rules

### 📋 Pending
6. **SLAConfiguration**: Refresh frequency, latency, uptime
7. **TableDetailPanel**: DataHub metadata display
8. **HybridSQLWorkbench**: Superset + Tisql dual-mode editor
9. **SavedQueryBrowser**: Query library integration
10. **Deliver step simplification**: Remove product type branching
11. **DataHub API integration**: Real table metadata
12. **Superset integration**: Embed SqlLab iframe
13. **Tisql reuse**: Extract editor from `/playground`

---

## Key Differences from Old Approach

### OLD: Unified Build Flow (External Sources)
```
Define → Source → Transform → Deliver

Define:
- Select product type (Foundation/Domain/Solution)
- Basic contract info
- Type-specific fields

Source:
- Foundation: Select connector (MySQL, Kafka, S3)
- Domain: Select foundation products
- Solution: Compose from products
- Enter connection strings
- Configure sync frequency

Transform:
- Toy SQL editor with example queries
- Type-specific SQL defaults
- Basic quality rule selection

Deliver:
- Type-specific delivery recommendations
- Auto-select based on product type
```

**Problems**:
- ❌ Assumes data is external (wrong - it's in lakehouse!)
- ❌ Forces taxonomy understanding upfront
- ❌ Connection strings don't make sense for lakehouse
- ❌ Toy SQL editor not production-ready
- ❌ Quality rules as afterthought

### NEW: Lakehouse-First Flow (Contract-Driven)
```
Define → Source → Transform → Deliver

Define:
- Output schema designer (visual, drag-drop)
- Quality rules builder (Great Expectations)
- SLA configuration (refresh, latency)
- Business context

Source:
- Browse Iceberg lakehouse tables
- Smart grouping (domain, quality, freshness)
- DataHub metadata panels
- Multi-select for joins

Transform:
- Exploration: Superset SqlLab (ad-hoc)
- Development: Tisql editor (production)
- Saved query library
- Context-aware assistance

Deliver:
- Unified access pattern selection
- No product type branching
- Simple: Table, View, API, Stream, dbt
```

**Benefits**:
- ✅ Reflects lakehouse reality
- ✅ Contract-first thinking
- ✅ Production-grade tooling
- ✅ Quality built-in from start
- ✅ Leverages organizational knowledge

---

## Data Flow & State Management

### Contract Object Structure
```typescript
interface DataProductContract {
  // Basic Info
  name: string;              // 'customer_360'
  description: string;       // 'Unified customer profile...'
  owner: string;             // 'analytics-eng'
  domain: string;            // 'Analytics'

  // Schema (from ContractSchemaDesigner)
  schema: SchemaField[];     // Array of field definitions

  // Quality (from QualityRulesBuilder)
  quality_rules: QualityRule[];  // Array of enabled rules

  // SLA (from SLAConfiguration)
  sla: {
    refresh_frequency: string;   // 'hourly', 'daily', etc.
    latency_tolerance: number;   // minutes
    uptime_target: number;       // 99.9
  };

  // Source (from LakehouseCatalogBrowser)
  source: {
    lakehouse_tables: string[];  // ['iceberg.sales.customers', ...]
  };

  // Transform (from HybridSQLWorkbench)
  transform: {
    sql: string;                 // Production SQL query
    mode: 'materialized' | 'view';
  };

  // Deliver (from Deliver step)
  delivery: {
    access_patterns: ('table' | 'view' | 'api' | 'stream' | 'dbt')[];
    configuration: Record<string, any>;
  };
}
```

### URL State Flow
```
/build
  → Natural language input or template selection
  ↓
/build/new/define?input={description}
  → User defines contract (schema, quality, SLA)
  → contract = { name, description, schema, quality_rules, sla }
  ↓
/build/new/source?contract={JSON.stringify(contract)}
  → User selects lakehouse tables
  → contract.source = { lakehouse_tables: [...] }
  ↓
/build/new/transform?contract={JSON.stringify(contract)}
  → User writes SQL (exploration → development)
  → contract.transform = { sql, mode }
  ↓
/build/new/deliver?contract={JSON.stringify(contract)}
  → User selects access patterns
  → contract.delivery = { access_patterns, configuration }
  ↓
Deploy & Success State
```

---

## Integration Points

### 1. DataHub Integration
**Purpose**: Fetch real lakehouse metadata

**Endpoints Needed**:
- `GET /api/datahub/tables` - List all Iceberg tables
- `GET /api/datahub/table/{id}/schema` - Table schema
- `GET /api/datahub/table/{id}/lineage` - Upstream/downstream
- `GET /api/datahub/table/{id}/profile` - Quality metrics
- `GET /api/datahub/table/{id}/sample` - Sample rows

**Implementation**:
```typescript
// lib/api/datahub-client.ts
export async function getIcebergTables() {
  const response = await fetch('/api/datahub/tables');
  return response.json();
}

export async function getTableMetadata(tableId: string) {
  const response = await fetch(`/api/datahub/table/${tableId}/schema`);
  return response.json();
}
```

### 2. Superset Integration
**Purpose**: Embed SqlLab for exploration

**Approach**: Iframe embed with authentication

**Implementation**:
```typescript
// components/build/SupersetSqlLab.tsx
<iframe
  src={`${SUPERSET_URL}/sqllab?standalone=true&dbid=${dbId}`}
  className="w-full h-full border-0"
  sandbox="allow-same-origin allow-scripts allow-forms"
/>
```

### 3. Tisql Reuse
**Purpose**: Production SQL development

**Approach**: Extract editor from `/playground`

**Files to Reuse**:
- `app/playground/page.tsx` - Tisql setup
- Monaco editor configuration
- AI widget integration
- Schema browser component

### 4. Great Expectations
**Purpose**: Execute quality rules

**Approach**: Generate GE config from selected rules

**Implementation**:
```python
# backend/services/quality.py
def generate_ge_config(quality_rules):
    expectations = []
    for rule in quality_rules:
        if rule['id'] == 'not_null_pk':
            expectations.append({
                'expectation_type': 'expect_column_values_to_not_be_null',
                'kwargs': {'column': 'primary_key'}
            })
    return {'expectations': expectations}
```

---

## Success Metrics

### User Experience
- **Time to first product**: < 10 minutes (vs 20-30 min old way)
- **Configuration errors**: < 5% (vs 30% with connectors)
- **User satisfaction**: > 90% prefer contract-first approach
- **Learning curve**: < 30 minutes for experienced data engineers

### Product Quality
- **Schema accuracy**: 95%+ match between contract and delivered product
- **Quality rule coverage**: 80%+ products have quality checks
- **SLA compliance**: 90%+ products meet defined SLAs
- **Reuse rate**: 40%+ queries loaded from saved library

### Platform Adoption
- **Build flow usage**: 80% of new data products via this flow
- **Tool preference**: 70% use Superset exploration before Tisql development
- **Query reuse**: 50% of transforms based on existing queries
- **Documentation coverage**: 90% products have complete metadata

---

## Next Steps (Prioritized)

### Week 1: Define Step Enhancement
1. ✅ ContractSchemaDesigner built
2. ✅ QualityRulesBuilder built
3. 🚧 Integrate into Define step
4. 📋 Build SLAConfiguration component
5. 📋 Update Define page layout

### Week 2: Source Step Completion
6. ✅ LakehouseCatalogBrowser built
7. ✅ Integrated into Source step
8. 📋 Build TableDetailPanel
9. 📋 DataHub API integration
10. 📋 Add metadata loading

### Week 3: Transform Step Redesign
11. 📋 Build HybridSQLWorkbench
12. 📋 Embed Superset SqlLab
13. 📋 Extract Tisql from playground
14. 📋 Build SavedQueryBrowser
15. 📋 Add context panels

### Week 4: Deliver & Polish
16. 📋 Simplify Deliver step
17. 📋 Remove product type logic
18. 📋 Add deployment automation
19. 📋 End-to-end testing
20. 📋 Documentation and training

---

## Conclusion

This lakehouse-first build flow represents a **fundamental paradigm shift** from "connect to external sources" to "contract-driven composition from lakehouse." By putting the contract (schema, quality, SLAs) first and using production-grade tooling throughout, we create a more intuitive, powerful, and reliable data product development experience.

**Key Takeaway**: Users no longer think "where can I connect?" but instead "what do I want to build?" The lakehouse provides the raw materials, the contract defines the blueprint, and the tools (Superset + Tisql) enable expert craftsmanship.
