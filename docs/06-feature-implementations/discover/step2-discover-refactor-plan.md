# Step 2 Discover - Incremental Refactor Plan

## Overview
Transform the data discovery experience from a simple table selector to an intelligent, catalog-aware discovery tool with preview and profiling capabilities.

## Current State (Baseline)
- Flat table view with grouping by domain/schema/freshness/quality
- Basic table selection via checkboxes
- Shows: table name, domain, quality score, freshness, row count, size, tags
- No preview or profiling capabilities
- No context about table contents or relationships

## Problems Identified
1. **Information overload without context** - Users see metadata but not actual data
2. **No exploration workflow** - Binary selection without preview
3. **Missing profiling integration** - ydata-profiling exists but unused
4. **Poor Iceberg catalog structure** - Flat namespace instead of catalog hierarchy
5. **Technical vs business balance** - Too much jargon, not enough business context

---

## Incremental Refactor Phases

### Phase 1: Add Preview Panel (PRIORITY)
**Goal**: Let users explore tables before selecting them

#### 1.1 Create TablePreviewPanel Component
**Location**: `/components/build/TablePreviewPanel.tsx`

**Features**:
- Slide-out panel on the right (or modal)
- Triggered by clicking table row (not checkbox)
- Shows:
  - **Business Summary**
    - Table description (from DataHub)
    - Owner & domain tags
    - Usage stats ("12 teams use this", "Used in 8 products")
  - **Quick Stats**
    - Row count (formatted: "2.5M rows")
    - Column count
    - Size (GB)
    - Quality score breakdown
    - Last updated (relative time)
  - **Schema Preview**
    - Column list with types
    - Null percentage per column
    - Sample values (3-5 rows)
  - **Actions**
    - "Select this table" button
    - "Profile this table" button (Phase 2)

**Implementation**:
```tsx
interface TablePreviewPanelProps {
  table: IcebergTable | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tableId: string) => void;
  onProfile?: (tableId: string) => void;
}
```

#### 1.2 Update LakehouseCatalogBrowser
- Add `selectedTableForPreview` state
- Add `onTableClick` handler (separate from selection)
- Wire preview panel to show on row click
- Keep checkbox selection separate from preview

#### 1.3 Update Step2Discover
- Add preview panel to layout
- Pass table click handler through to catalog browser

**Success Criteria**:
- ✅ Click table row → preview opens
- ✅ Preview shows description, stats, schema
- ✅ Can select from preview panel
- ✅ Preview independent of selection state

**Estimated Time**: 2-3 hours

---

### Phase 2: Integrate ydata-profiling (ON-DEMAND)
**Goal**: Show data quality insights and distributions on demand

#### 2.1 Add Profile Button to Preview Panel
- "Profile this table" button in preview panel
- Shows loading state while profiling runs
- Caches results in component state

#### 2.2 Create Profiling Mini-Report
**Location**: `/components/build/ProfilingMiniReport.tsx`

**Shows**:
- **Overview**
  - Total rows, columns
  - Missing data percentage
  - Duplicate rows count
- **Column Distributions** (top 5 columns)
  - Histogram for numeric
  - Bar chart for categorical
  - Null rate indicator
- **Quality Warnings**
  - High null rates
  - High cardinality
  - Skewed distributions
  - Data type mismatches
- **Correlations** (if numeric columns exist)
  - Top 3 correlated pairs

#### 2.3 Wire Up ydata-profiling Service
- Use existing `/lib/services/data-profiling.ts`
- Call `profileDataSources([table])` on button click
- Transform response into mini-report format
- Cache in `Map<tableId, ProfileResult>` at component level

**Success Criteria**:
- ✅ Click "Profile" → loading indicator
- ✅ Profiling completes → show mini-report
- ✅ Cached results load instantly on second view
- ✅ Error handling for profiling failures

**Estimated Time**: 3-4 hours

---

### Phase 3: Smart Table Recommendations
**Goal**: Guide users to related tables based on patterns

#### 3.1 Add Recommendation Engine
**Location**: `/lib/services/table-recommendations.ts`

**Logic**:
- Based on selected table(s), suggest related tables:
  - **Lineage-based**: Tables used in same pipelines
  - **Domain-based**: Tables from same domain
  - **Pattern-based**: Commonly joined tables
  - **Usage-based**: Tables used by same teams

**Mock Implementation** (until DataHub integration):
```ts
const tableRelationships = {
  'iceberg.sales.customers': {
    commonlyJoinedWith: ['iceberg.sales.orders'],
    sameTeam: ['iceberg.sales.accounts'],
    downstreamOf: ['iceberg.raw.salesforce_customers']
  }
}
```

#### 3.2 Add Recommendation Section to Preview Panel
- "Related Tables" section below schema preview
- Shows 3-5 recommended tables
- Each with:
  - Table name
  - Relationship reason ("Often joined with")
  - Quick add button

#### 3.3 Visual Indicators in Table List
- 🔗 Icon for related tables
- ⭐ Badge for recommended tables
- Highlight when hovering related table

**Success Criteria**:
- ✅ Select table → related tables highlighted
- ✅ Preview shows "commonly used with X"
- ✅ Can quick-add related tables

**Estimated Time**: 2-3 hours

---

### Phase 4: Catalog Tree View (OPTIONAL ENHANCEMENT)
**Goal**: Better represent Iceberg catalog hierarchy

**Note**: This is a nice-to-have after Phases 1-3 are complete. Current grouped view works well enough if we have good preview/profiling.

#### 4.1 Restructure Data Model
```ts
interface IcebergCatalog {
  name: string; // 'production', 'staging'
  namespaces: IcebergNamespace[];
}

interface IcebergNamespace {
  name: string; // 'sales', 'analytics'
  catalog: string;
  tables: IcebergTable[];
}

interface IcebergTable {
  // existing fields
  catalog: string;
  namespace: string; // was 'schema'
  name: string;
}
```

#### 4.2 Create Tree View Component
- Collapsible catalog → namespace → table hierarchy
- Icons: 📚 catalog, 📁 namespace, 📊 table
- Selection at table level
- Preview still triggered by click

#### 4.3 Migrate from Grouped Table to Tree
- Replace current grouped table UI
- Keep same preview/profiling functionality
- Maintain backward compatibility with existing selections

**Success Criteria**:
- ✅ Catalog hierarchy clearly visible
- ✅ Expand/collapse navigation
- ✅ Preview and profiling still work
- ✅ No regression in functionality

**Estimated Time**: 4-5 hours

---

## Rollout Strategy

### Week 1: Preview Panel
- Implement TablePreviewPanel component
- Wire up to existing catalog browser
- Show business context and schema

### Week 2: Profiling Integration
- Add profile button and mini-report
- Integrate ydata-profiling service
- Cache profiling results

### Week 3: Smart Recommendations
- Build recommendation engine
- Add related tables section
- Visual indicators in table list

### Week 4: (Optional) Tree View
- Only if Phases 1-3 validate well
- Restructure to catalog hierarchy
- Migrate UI to tree view

---

## Technical Decisions

### Why Incremental?
1. **Validate UX early** - Preview panel is highest value, test before tree refactor
2. **Minimize risk** - Keep existing table view working while adding features
3. **Faster iteration** - Ship preview panel to users in days, not weeks
4. **Flexibility** - Can pivot if tree view doesn't test well

### Why Keep Current Grouping (Initially)?
- Domain/schema grouping already familiar to users
- Tree view is cosmetic improvement, not functional requirement
- Preview panel adds more value than tree restructure
- Can always upgrade to tree view in Phase 4

### Profiling Strategy
- **On-demand** (not automatic) to avoid overwhelming backend
- **Client-side caching** to prevent redundant profiling requests
- **Progressive disclosure** - hide until user clicks "Profile"
- **Graceful degradation** - mock data if profiling service fails

---

## Success Metrics

### Phase 1 (Preview Panel)
- [ ] Users can preview table before selecting
- [ ] Preview shows schema + sample data
- [ ] Preview shows business context (description, owner)
- [ ] Selection rate increases (more informed decisions)

### Phase 2 (Profiling)
- [ ] Users can profile tables on demand
- [ ] Profiling completes in <5 seconds for typical table
- [ ] Quality warnings surfaced before selection
- [ ] Reduces "wrong table selected" errors

### Phase 3 (Recommendations)
- [ ] Related tables suggested automatically
- [ ] Users add 2+ related tables in 40% of sessions
- [ ] Reduces time to find right tables by 50%

### Phase 4 (Tree View)
- [ ] Catalog hierarchy clearly understood
- [ ] Navigation faster than grouped table
- [ ] No increase in selection errors

---

## Files to Create/Modify

### Phase 1
- ✨ NEW: `/components/build/TablePreviewPanel.tsx`
- 📝 EDIT: `/components/build/LakehouseCatalogBrowser.tsx`
- 📝 EDIT: `/components/build/steps/Step2Discover.tsx`

### Phase 2
- ✨ NEW: `/components/build/ProfilingMiniReport.tsx`
- 📝 USE: `/lib/services/data-profiling.ts` (already exists!)
- 📝 EDIT: `/components/build/TablePreviewPanel.tsx`

### Phase 3
- ✨ NEW: `/lib/services/table-recommendations.ts`
- 📝 EDIT: `/components/build/TablePreviewPanel.tsx`
- 📝 EDIT: `/components/build/LakehouseCatalogBrowser.tsx`

### Phase 4 (Optional)
- ✨ NEW: `/components/build/IcebergCatalogTree.tsx`
- 📝 EDIT: `/components/build/LakehouseCatalogBrowser.tsx` (major refactor)

---

## Open Questions

1. **Preview Panel Style**: Slide-out from right, modal, or split-screen?
   - **Recommendation**: Slide-out (like GitHub file preview)

2. **Profiling Trigger**: Automatic on hover, or manual button click?
   - **Recommendation**: Manual button (avoid backend load)

3. **Sample Data**: Real query to Iceberg, or mock for demo?
   - **Recommendation**: Mock for Phase 1, real query in Phase 2

4. **Catalog Tree**: Do we need it if grouping works well?
   - **Recommendation**: Defer to Phase 4, validate preview first

---

## Next Actions

1. ✅ Create this plan document
2. 🔨 Build TablePreviewPanel component
3. 🔌 Wire preview to catalog browser
4. 🧪 Test preview UX with users
5. ➡️ Proceed to Phase 2 if validated
