# Step 2 Discovery UX Redesign: Product Cart & File Browser Interface

## Overview

Redesign the Iceberg catalog discovery interface from a modal-based preview system to a persistent split-pane layout with a "Product Cart" metaphor. This provides better context awareness, schema visibility, and a more intuitive workflow for building data products.

## Current Problems

1. **Backdrop Blur Issue**: Sheet component creates modal overlay that obscures browsing context
2. **Limited Exploration**: Can only preview one table at a time
3. **Weak Multi-Selection Flow**: Checkboxes don't clearly support "add to product" workflow
4. **No Schema Context**: Can't see combined schema of selected tables
5. **Difficult Comparison**: Can't compare multiple tables side-by-side
6. **Lost Progress**: Selections feel temporary without persistent cart

## New Design Vision

### Layout Structure

```
┌───────────────────────────────────────────────────────────────────────┐
│ Breadcrumb: iceberg > sales                [Search...]      [Cart: 3] │
├──────────────┬────────────────────────────────┬──────────────────────┤
│              │  Table Grid View               │  Product Cart        │
│  Catalog     │  ┌──────┐ ┌──────┐ ┌──────┐  │  Building:           │
│  Tree        │  │Table1│ │Table2│ │Table3│  │  Customer 360 View   │
│              │  │95%   │ │88%   │ │92%   │  │                      │
│  📁 iceberg  │  │2.5M  │ │1.2M  │ │5.8M  │  │  Selected Tables:    │
│   📂 sales ✓ │  └──────┘ └──────┘ └──────┘  │  ✓ customers (2.5M)  │
│     customers│                                │  ✓ orders (5.2M)     │
│     orders   │  [Add Selected to Cart →]     │  • transactions      │
│     products │                                │                      │
│   📂 raw     ├────────────────────────────────┤  Schema Context:     │
│   📂 analytics│ Table Details Dashboard       │  Common Columns:     │
│              │ ┌─────────────────────────┐   │  • customer_id (3)   │
│              │ │[Schema][Sample][Profile]│   │  • order_date (2)    │
│              │ │                          │   │                      │
│              │ │ customer_id: bigint      │   │  Suggestions:        │
│              │ │ email: varchar           │   │  Consider adding:    │
│              │ │ created_at: timestamp    │   │  → order_items       │
│              │ │ ...                      │   │                      │
│              │ └─────────────────────────┘   │  [Configure Product] │
└──────────────┴────────────────────────────────┴──────────────────────┘
```

## Key Features

### 1. Persistent Catalog Tree (Left Pane)
- Always visible (no modal/toggle)
- Shows hierarchy: Catalog → Namespace → Tables
- Visual indicators for selected tables
- Collapsible sections
- Width: 250-400px (resizable)

### 2. Table Card Grid (Center Pane)
- Cards instead of table rows
- Key metrics visible: quality score, row count, freshness
- Hover for quick stats
- Multi-select with visual feedback
- Click card → expand dashboard below
- No backdrop blur

### 3. Table Details Dashboard (Bottom Center)
- Slides up when table clicked
- Tabbed interface: Schema | Sample | Profile | Lineage | Recommendations
- Resizable height with drag handle
- Quick "Add to Cart" button
- Compare mode when multiple selected

### 4. Product Cart (Right Sidebar)
- **Persistent state** across page refresh
- Shows all tables selected for data product
- **Schema Context Panel**:
  - Common columns (potential join keys)
  - Relationship detection
  - Type conflict warnings
- **Smart Suggestions**:
  - Recommended related tables
  - Schema alignment validation
  - Missing join key warnings
- **Cart Actions**:
  - Drag to reorder tables
  - Remove individual tables
  - Clear all
  - Export/save cart
- **Metrics Summary**:
  - Total tables, rows, data volume
- **Configure Product** button → full creation flow

### 5. Schema Intelligence
- Automatic join key detection
- Relationship mapping (customers.id → orders.customer_id)
- Type compatibility checking
- Preview join SQL generation

## Implementation Phases

---

## Phase 1: Layout Restructure & Cart Foundation

**Goal**: Establish new layout architecture and basic cart functionality

### Tasks

1. **Create Layout Components**
   - `ProductCart.tsx` - Right sidebar container with cart state
   - `CatalogSidebar.tsx` - Left pane wrapper for tree
   - `TableGridView.tsx` - Center pane for table cards
   - `TableDashboard.tsx` - Bottom expandable details panel

2. **Refactor LakehouseCatalogBrowser.tsx**
   - Remove Sheet component
   - Implement 3-column layout with resizable panes
   - Add cart state management: `const [cart, setCart] = useState<ProductCart>({ tables: [], name: '' })`
   - Wire up cart context provider

3. **Basic Cart Features**
   - Add to cart button on each table
   - Display cart items as list
   - Remove from cart functionality
   - Cart item count badge
   - Basic metrics summary (total tables, rows)

4. **State Management**
   - Create `useProductCart` hook
   - Cart persistence with localStorage
   - Cart sync across components

**Files to Create**:
- `/components/build/ProductCart.tsx`
- `/components/build/CatalogSidebar.tsx`
- `/components/build/TableGridView.tsx`
- `/components/build/TableDashboard.tsx`
- `/hooks/useProductCart.ts`
- `/lib/types/product-cart.ts`

**Files to Modify**:
- `/components/build/LakehouseCatalogBrowser.tsx` - Major refactor
- `/components/build/IcebergCatalogTree.tsx` - Adapt for sidebar

**Success Criteria**:
- [ ] 3-column layout renders correctly
- [ ] Can add tables to cart
- [ ] Can remove tables from cart
- [ ] Cart persists on page refresh
- [ ] Tree shows visual indicators for carted tables

---

## Phase 2: Table Card Grid & Details Dashboard

**Goal**: Replace table rows with rich card interface and expandable dashboard

### Tasks

1. **Create TableCard Component**
   - `TableCard.tsx` - Individual table card with:
     - Table name and description
     - Quality score badge
     - Row count and size
     - Freshness indicator
     - "Add to Cart" button
     - Checkbox for multi-select
     - Hover effects

2. **Implement Card Grid Layout**
   - Responsive grid (3-4 columns on desktop)
   - Virtual scrolling for performance
   - Multi-select state management
   - Bulk actions toolbar

3. **Build Table Dashboard**
   - Repurpose `TablePreviewPanel.tsx` content
   - Tabbed interface:
     - Schema tab
     - Sample Data tab
     - Profile tab (with on-demand profiling)
     - Lineage tab (placeholder)
     - Recommendations tab
   - Resizable with drag handle
   - Smooth slide-up animation (Framer Motion)
   - Close/minimize controls

4. **Dashboard Integration**
   - Click card → expand dashboard
   - Click another card → switch dashboard content
   - Close dashboard → collapse to bottom
   - Quick "Add to Cart" in dashboard

**Files to Create**:
- `/components/build/TableCard.tsx`
- `/components/build/dashboard/SchemaTab.tsx`
- `/components/build/dashboard/SampleDataTab.tsx`
- `/components/build/dashboard/ProfileTab.tsx`
- `/components/build/dashboard/LineageTab.tsx`
- `/components/build/dashboard/RecommendationsTab.tsx`

**Files to Modify**:
- `/components/build/TableGridView.tsx` - Implement grid
- `/components/build/TableDashboard.tsx` - Add tabs
- `/components/build/TablePreviewPanel.tsx` - Extract content to tabs

**Success Criteria**:
- [ ] Tables display as cards in grid
- [ ] Cards show all key metrics
- [ ] Click card opens dashboard below
- [ ] Dashboard is resizable
- [ ] All tabs render correctly
- [ ] Profiling works from dashboard

---

## Phase 3: Schema Intelligence & Cart Context

**Goal**: Add intelligent schema analysis and relationship detection

### Tasks

1. **Schema Analysis Service**
   - `schema-analysis.ts` - Analyze selected tables:
     - Find common column names
     - Detect potential join keys
     - Check type compatibility
     - Calculate combined metrics

2. **Cart Schema Context Panel**
   - `CartSchemaContext.tsx` component showing:
     - Common columns list
     - Detected relationships
     - Type conflicts/warnings
     - Column count by type

3. **Relationship Detection**
   - Pattern matching for join keys (id, *_id, uuid)
   - Foreign key inference from naming conventions
   - Visual relationship diagram
   - Generate preview SQL for joins

4. **Smart Suggestions**
   - `CartSuggestions.tsx` component
   - Integrate with `table-recommendations.ts`
   - Show recommended tables based on cart contents
   - Schema alignment validation
   - Missing join key warnings

5. **Preview Join Feature**
   - Generate SQL showing how tables connect
   - Sample data preview of joined result
   - Performance estimation

**Files to Create**:
- `/lib/services/schema-analysis.ts`
- `/components/build/cart/CartSchemaContext.tsx`
- `/components/build/cart/CartSuggestions.tsx`
- `/components/build/cart/CartRelationshipDiagram.tsx`
- `/components/build/cart/PreviewJoinModal.tsx`

**Files to Modify**:
- `/components/build/ProductCart.tsx` - Add context panels
- `/lib/services/table-recommendations.ts` - Extend for cart context

**Success Criteria**:
- [ ] Common columns detected automatically
- [ ] Relationships visualized
- [ ] Suggestions appear based on cart
- [ ] Preview join generates correct SQL
- [ ] Type conflicts highlighted

---

## Phase 4: Enhanced Cart Features & Workflows

**Goal**: Polish cart UX and complete product creation flow

### Tasks

1. **Cart Item Management**
   - `CartTableItem.tsx` - Enhanced cart item:
     - Drag handle for reordering
     - Role selector (primary/lookup/fact)
     - Quick stats
     - Click to jump to table in main view

2. **Drag & Drop**
   - Reorder tables in cart (execution order)
   - Drag from catalog/grid to cart
   - Visual drop zones
   - Drag preview

3. **Multiple Carts**
   - Cart switcher dropdown
   - Create new cart
   - Rename carts
   - Delete carts
   - Recent carts list

4. **Cart Actions Menu**
   - Export cart as JSON
   - Share cart URL
   - Duplicate cart
   - Clear all items
   - Undo/redo cart changes

5. **Product Creation Flow**
   - "Configure Product" button
   - Opens full creation modal/page
   - Pre-populates with cart tables
   - Maintains cart state
   - Success → clear cart option

6. **Keyboard Shortcuts**
   - Cmd/Ctrl+K → Quick cart switcher
   - Cmd/Ctrl+B → Toggle cart visibility
   - Space → Quick add to cart
   - Esc → Close dashboard

**Files to Create**:
- `/components/build/cart/CartTableItem.tsx`
- `/components/build/cart/CartSwitcher.tsx`
- `/components/build/cart/CartActionsMenu.tsx`
- `/components/build/cart/CartExportModal.tsx`
- `/hooks/useCartDragDrop.ts`
- `/hooks/useCartKeyboardShortcuts.ts`

**Files to Modify**:
- `/components/build/ProductCart.tsx` - Add all new features
- `/hooks/useProductCart.ts` - Extend with multi-cart support

**Success Criteria**:
- [ ] Can drag tables to reorder
- [ ] Can drag from grid to cart
- [ ] Multiple carts supported
- [ ] Cart export/import works
- [ ] Keyboard shortcuts functional
- [ ] Product creation pre-populates from cart

---

## Phase 5: Polish, Performance & Testing

**Goal**: Optimize performance, add animations, comprehensive testing

### Tasks

1. **Performance Optimization**
   - Virtual scrolling for large table lists
   - Lazy load dashboard tabs
   - Debounce schema analysis
   - Memoize expensive computations
   - Code splitting for cart features

2. **Animations & Transitions**
   - Framer Motion for:
     - Dashboard slide-up/down
     - Card hover effects
     - Cart item add/remove
     - Drag & drop feedback
   - Smooth scroll to selected table
   - Loading skeletons

3. **Empty States**
   - Empty cart illustration
   - No tables found in search
   - No common columns detected
   - First-time user guide

4. **Responsive Design**
   - Mobile: Stack layout vertically
   - Tablet: Hide cart by default (toggle)
   - Desktop: Full 3-column layout
   - Collapsible panes

5. **Testing**
   - Unit tests for cart logic
   - Component tests for all new components
   - Integration tests for workflows
   - E2E tests for product creation flow

6. **Documentation**
   - Update user guide
   - Add inline help tooltips
   - Video walkthrough
   - API documentation

**Files to Create**:
- `/__tests__/ProductCart.test.tsx`
- `/__tests__/SchemaAnalysis.test.ts`
- `/__tests__/CartWorkflows.e2e.ts`
- `/components/build/cart/EmptyCart.tsx`
- `/components/build/cart/CartTutorial.tsx`

**Files to Modify**:
- All cart components - Add animations
- `/components/build/LakehouseCatalogBrowser.tsx` - Responsive design
- `/lib/services/schema-analysis.ts` - Performance optimization

**Success Criteria**:
- [ ] Smooth 60fps animations
- [ ] Virtual scrolling works for 1000+ tables
- [ ] All tests passing
- [ ] Responsive on mobile/tablet
- [ ] Empty states look polished
- [ ] Documentation complete

---

## Data Structures

### ProductCart Type
```typescript
interface ProductCart {
  id: string;
  name: string;
  description?: string;
  tables: CartTable[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    totalRows: number;
    totalSize: number;
    totalColumns: number;
  };
}

interface CartTable {
  tableId: string;
  tableName: string;
  fullName: string;
  catalog: string;
  schema: string;
  order: number;  // Execution/join order
  role?: 'primary' | 'lookup' | 'fact' | 'dimension';
  columns: ColumnInfo[];
  rowCount: number;
  sizeGb: number;
  qualityScore: number;
  addedAt: Date;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  description?: string;
}
```

### SchemaAnalysis Type
```typescript
interface SchemaAnalysis {
  commonColumns: CommonColumn[];
  relationships: DetectedRelationship[];
  typeConflicts: TypeConflict[];
  statistics: SchemaStatistics;
  warnings: string[];
}

interface CommonColumn {
  name: string;
  tablesWithColumn: string[];  // Table IDs
  types: string[];  // Data types across tables
  isConsistent: boolean;  // All types match
  isPotentialJoinKey: boolean;
}

interface DetectedRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  confidence: number;  // 0-1
  type: 'foreign_key' | 'inferred' | 'naming_convention';
}

interface TypeConflict {
  columnName: string;
  tables: Array<{
    tableId: string;
    type: string;
  }>;
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}

interface SchemaStatistics {
  totalColumns: number;
  totalRows: number;
  totalSize: number;
  columnsByType: Record<string, number>;
  nullableColumns: number;
  uniqueColumns: number;
}
```

## Migration Strategy

### Backward Compatibility
- Keep existing components functional during transition
- Feature flag for new UX: `ENABLE_CART_UX=true`
- Gradual rollout per user/team
- Old Sheet preview available as fallback

### Data Migration
- No server-side data migration needed
- Client-side localStorage migration for existing selections
- Convert old selection state to cart format

### Rollout Plan
1. **Week 1-2**: Phase 1 (layout + basic cart)
2. **Week 3-4**: Phase 2 (card grid + dashboard)
3. **Week 5-6**: Phase 3 (schema intelligence)
4. **Week 7-8**: Phase 4 (enhanced cart features)
5. **Week 9-10**: Phase 5 (polish + testing)

## Success Metrics

### User Experience
- [ ] 70% reduction in context switching
- [ ] 50% faster product creation
- [ ] 90% user preference for cart UX vs old Sheet
- [ ] 80% adoption of schema suggestions

### Performance
- [ ] <100ms cart add/remove operation
- [ ] <500ms schema analysis for 10 tables
- [ ] <16ms frame time for animations
- [ ] Support 1000+ tables with virtual scrolling

### Quality
- [ ] 95%+ test coverage for cart logic
- [ ] 0 accessibility violations
- [ ] Responsive on all screen sizes
- [ ] <2s initial load time

## Future Enhancements

- **AI-Powered Cart Building**: "Build a customer 360 view" → automatically suggests tables
- **Cart Templates**: Save and reuse common table combinations
- **Collaborative Carts**: Share carts with team members
- **Cart History**: Version control for cart changes
- **Smart Joins**: Automatic join query generation
- **Data Lineage**: Visual lineage graph for carted tables
- **Cost Estimation**: Estimated compute cost for product
- **Quality Prediction**: Predict data quality issues before building

---

## Conclusion

This redesign transforms the discovery experience from a modal-based preview system to an intuitive, context-rich product building workspace. The cart metaphor provides clear intent, the split-pane layout eliminates context switching, and schema intelligence helps users make informed decisions about table selection and relationships.

The phased approach allows for iterative development with clear milestones and success criteria at each stage.
