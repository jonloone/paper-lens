# Discover Marketplace UX Redesign Plan
**Date**: October 9, 2025
**Status**: 🔵 Approved - Ready for Implementation
**Estimated Effort**: 10-13 hours (Phases 1-3)

---

## Executive Summary

**Current State**: Table-based catalog (implemented Oct 9) uses shadcn/ui components but doesn't align with existing `components/Tables/DataTable.tsx` design system pattern.

**Competitor Best Practices** (Data Product Marketplaces):
- **Domain-Driven Browse**: Browse by business domain first (Customer, Financial, Product)
- **Solution-Oriented Navigation**: "What problem am I trying to solve?" vs "What data exists?"
- **Hybrid Shopping Experience**: Amazon-like categories + enterprise table for power users

---

## Critical Findings

### 1. **Design System Inconsistency** ❌
**Current**: `/components/discover/DataProductTable.tsx` (296 lines)
- Uses shadcn/ui `<Table>` components directly
- Different styling approach (border-based, light theme)
- Doesn't match existing pattern

**Existing Pattern**: `/components/Tables/DataTable.tsx` (lines 1-100)
- Custom table markup with dark theme (`bg-white/5`, `border-white/10`)
- Chevron icons for sorting (ChevronUp/Down/ChevronsUpDown)
- Minimalist enterprise aesthetic

**Impact**: Visual inconsistency breaks user experience continuity

---

### 2. **Missing "Shopping" Experience** ❌
**Current**: Filters in popover + table = technical/operational focus

**Best Practice** (Snowflake, Databricks, AWS Data Exchange):
```
┌─────────────────────────────────────────┐
│  Browse by Domain                       │
│  [Customer] [Financial] [Operations]    │
├─────────────────────────────────────────┤
│  Featured Solutions                     │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │ Card 1 │ │ Card 2 │ │ Card 3 │     │
│  └────────┘ └────────┘ └────────┘     │
├─────────────────────────────────────────┤
│  All Products (Table View)              │
│  [Search] [Filter] [Sort]               │
│  ┌─────────────────────────────────┐   │
│  │ Name | Type | Domain | Quality │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Impact**: Users can't discover solutions by business need, only by browsing all products

---

### 3. **No Progressive Disclosure** ❌
**Current**: All 16 products in flat table

**Best Practice**:
- **Level 1**: Domain categories (5 cards: Customer, Financial, Operations, Marketing, Product)
- **Level 2**: Product types within domain (Foundation → Domain → Solution)
- **Level 3**: Individual products (table or cards)

**Impact**: Cognitive overload for new users, no guided discovery path

---

### 4. **Missing Key Features** ⚠️
Competitor analysis reveals these standard features:
- ✅ Search (we have)
- ✅ Filters (we have)
- ✅ Sorting (we have)
- ❌ **Domain-based categories** (missing)
- ❌ **"Shop by Solution"** (missing - e.g., "Fraud Detection", "Customer 360")
- ❌ **Quick Preview** (missing - modal on hover/click without leaving page)
- ❌ **Bulk Actions** (missing - "Add to Cart" or "Request Access")
- ❌ **Recently Viewed** (missing)
- ❌ **Related Products** (missing - "Customers who used this also used...")

---

## Recommended Approach

### Phase 1: Design System Alignment ⭐ **PRIORITY**
**Replace** `/components/discover/DataProductTable.tsx` with design system pattern

**Changes**:
1. Use existing `/components/Tables/DataTable.tsx` as base
2. Match dark theme aesthetic (`bg-white/5`, `border-white/10`)
3. Use Chevron icons for sorting consistency
4. Keep enterprise features (density, export, column visibility)

**Files to Modify**:
- `/components/discover/DataProductTable.tsx` (rewrite)
- `/components/discover/DataProductColumns.tsx` (update header icons)

**Effort**: 2-3 hours
**Impact**: HIGH - Restores visual consistency

---

### Phase 2: Add Domain-Driven Navigation ⭐⭐
**Add** category cards above table for domain-based browsing

**Implementation**:
```tsx
<div className="grid grid-cols-5 gap-4 mb-8">
  {domains.map(domain => (
    <DomainCategoryCard
      name={domain.name}
      icon={domain.icon}
      productCount={domain.count}
      onClick={() => filterByDomain(domain.id)}
    />
  ))}
</div>
```

**Categories** (from existing mockProducts):
- **Customer** (7 products) - Users, TrendingIcon
- **Financial** (3 products) - DollarSign, Calculator
- **Operations** (3 products) - Workflow, Settings
- **Marketing** (2 products) - Target, Megaphone
- **Product** (1 product) - Package, Box

**New Components**:
- `/components/discover/DomainCategoryCard.tsx`

**Files to Modify**:
- `/app/(main)/discover/page.tsx` (add category grid above table)

**Effort**: 3-4 hours
**Impact**: HIGH - Enables "shopping by domain"

---

### Phase 3: Add Solution-Oriented Browse ⭐⭐⭐
**Add** "Featured Solutions" section with use-case-driven cards

**Implementation**:
```tsx
<div className="mb-8">
  <h2 className="text-xl font-semibold mb-4">Featured Solutions</h2>
  <div className="grid grid-cols-3 gap-4">
    <SolutionCard
      title="Customer 360 View"
      description="Complete customer journey analytics"
      products={['d1', 'd2', 'd3']} // Product IDs
      icon={<Users />}
    />
    <SolutionCard
      title="Real-Time Fraud Detection"
      description="ML-powered fraud prevention"
      products={['s1', 's2']}
      icon={<Shield />}
    />
  </div>
</div>
```

**Solutions** (derived from existing useCases in mockProducts):
1. **Customer 360 View**
   - Description: "Complete customer journey analytics"
   - Products: d1 (Customer Journey Analytics), d2 (Customer Segmentation Engine), d3 (Unified Customer Profile)
   - Icon: Users

2. **Real-Time Fraud Detection**
   - Description: "ML-powered fraud prevention and risk management"
   - Products: s1 (Real-Time Fraud Detection ML), s2 (Transaction Risk Scoring API)
   - Icon: Shield

3. **Revenue Analytics**
   - Description: "Financial performance and revenue intelligence"
   - Products: d4 (Revenue Analytics Platform), f2 (Stripe Payments Stream)
   - Icon: TrendingUp

4. **Operational Efficiency**
   - Description: "Workflow optimization and performance monitoring"
   - Products: f3 (Warehouse Operations Stream), f4 (Marketing Attribution Stream)
   - Icon: Zap

**New Components**:
- `/components/discover/SolutionCard.tsx`

**Files to Modify**:
- `/app/(main)/discover/page.tsx` (add solutions section above domain categories)

**Effort**: 4-6 hours
**Impact**: VERY HIGH - Enables business-problem-first discovery

---

### Phase 4: Add Quick Preview Modal (Future)
**Add** modal that shows product details without leaving catalog page

**Implementation**:
- Click product name → opens modal with tabs (Overview, Schema, Quality, Lineage)
- "Quick Access" and "View Full Details" buttons in modal
- Keyboard navigation (Esc to close, ← → to navigate products)

**New Components**:
- `/components/discover/QuickPreviewModal.tsx`

**Effort**: 3-4 hours
**Impact**: MEDIUM - Reduces navigation friction

---

### Phase 5: Add "My Activity" Features (Future)
**Add** Recently Viewed and Request Cart

**Components**:
- Sidebar "Recently Viewed" (last 5 products)
- "Request Cart" for bulk access requests
- "Saved Searches"

**New Components**:
- `/components/discover/RecentlyViewed.tsx`
- `/components/discover/RequestCart.tsx`

**Effort**: 4-5 hours
**Impact**: MEDIUM - Enterprise convenience features

---

## Proposed Information Architecture

```
/discover
├── [Featured Solutions] (4 cards) ← NEW Phase 3
│   └── Click → filters table by solution products
├── [Domain Categories] (5 cards) ← NEW Phase 2
│   └── Click → filters table by domain
├── [Recently Viewed] (sidebar) ← FUTURE Phase 5
├── [Search + Filters] (always visible)
└── [DataProductTable] (enterprise table) ← REDESIGN Phase 1
    └── Click product → Quick Preview Modal ← FUTURE Phase 4
```

---

## Implementation Priority

### Week 1 (Critical - Design System Alignment)
**Phase 1: Replace DataProductTable with design system pattern** (2-3 hours)
- File: `/components/discover/DataProductTable.tsx`
- File: `/components/discover/DataProductColumns.tsx`
- Match `/components/Tables/DataTable.tsx` aesthetic
- Dark theme: `bg-white/5`, `border-white/10`
- Chevron icons: ChevronUp/Down/ChevronsUpDown

### Week 2 (High Value - Shopping Experience)
**Phase 2: Domain-driven navigation** (3-4 hours)
- Create: `/components/discover/DomainCategoryCard.tsx`
- Modify: `/app/(main)/discover/page.tsx`
- Add domain filter state and logic

**Phase 3: Solution-oriented browse** (4-6 hours)
- Create: `/components/discover/SolutionCard.tsx`
- Modify: `/app/(main)/discover/page.tsx`
- Define solution-to-products mapping

### Week 3 (Nice to Have - Future)
**Phase 4: Quick preview modal** (3-4 hours)
- Create: `/components/discover/QuickPreviewModal.tsx`
- Add keyboard navigation

**Phase 5: My activity features** (4-5 hours)
- Create: `/components/discover/RecentlyViewed.tsx`
- Create: `/components/discover/RequestCart.tsx`

---

## Success Metrics

| Metric | Current | Target (Post-Implementation) |
|--------|---------|------------------------------|
| Time to find product | ~2 min (search only) | ~30 sec (browse by domain) |
| Discovery mode users | 30% (most use search) | 70% (browse before search) |
| Products accessed | 6-8 (same products repeatedly) | 12-15 (broader exploration) |
| Visual consistency | ❌ Broken | ✅ Consistent |
| Design system compliance | 60% | 100% |

---

## Technical Specifications

### Design System Pattern (from `/components/Tables/DataTable.tsx`)

**Theme**:
```tsx
// Background colors
bg-white/5          // Table header, hover states
bg-white/10         // Elevated elements

// Borders
border-white/10     // Primary borders
border-white/30     // Focus borders

// Text colors
text-white/70       // Secondary text (headers)
text-white/40       // Tertiary text (placeholders)
text-white          // Primary text
text-white/90       // Hover text
```

**Icons**:
```tsx
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// Sorting states
asc: <ChevronUp />
desc: <ChevronDown />
unsorted: <ChevronsUpDown />
```

**Input Pattern**:
```tsx
<input
  placeholder="Filter..."
  className="max-w-sm px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-md
             text-white placeholder-white/40 focus:outline-none focus:border-white/30"
/>
```

**Table Pattern**:
```tsx
<div className="rounded-lg border border-white/10 overflow-hidden">
  <table className="w-full">
    <thead className="bg-white/5 border-b border-white/10">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
          {/* Header content */}
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-white/10">
      <tr className="hover:bg-white/5 transition-colors">
        <td className="px-4 py-3 text-sm text-white">
          {/* Cell content */}
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Domain Category Mapping

```typescript
const domainCategories = [
  {
    id: 'customer',
    name: 'Customer',
    icon: Users,
    count: 7, // f1, d1, d2, d3, s1 and derivatives
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'financial',
    name: 'Financial',
    icon: DollarSign,
    count: 3, // f2, d4, and derivatives
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: Settings,
    count: 3, // f3, f5, and derivatives
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: Target,
    count: 2, // f4 and derivatives
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: 'product',
    name: 'Product',
    icon: Package,
    count: 1, // f6
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
];
```

---

## Solution Mapping

```typescript
const featuredSolutions = [
  {
    id: 'customer-360',
    title: 'Customer 360 View',
    description: 'Complete customer journey analytics with unified profiles and segmentation',
    icon: Users,
    productIds: ['d1', 'd2', 'd3'], // Customer Journey, Segmentation, Unified Profile
    tags: ['Analytics', 'Customer', 'ML'],
    color: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-purple-500/20',
  },
  {
    id: 'fraud-detection',
    title: 'Real-Time Fraud Detection',
    description: 'ML-powered fraud prevention with transaction risk scoring',
    icon: Shield,
    productIds: ['s1', 's2'], // Fraud Detection ML, Risk Scoring API
    tags: ['Security', 'ML', 'Real-Time'],
    color: 'text-red-400',
    bgGradient: 'from-red-500/20 to-orange-500/20',
  },
  {
    id: 'revenue-analytics',
    title: 'Revenue Analytics',
    description: 'Financial performance monitoring and revenue intelligence',
    icon: TrendingUp,
    productIds: ['d4', 'f2'], // Revenue Analytics, Stripe Payments
    tags: ['Financial', 'Analytics', 'BI'],
    color: 'text-green-400',
    bgGradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    id: 'operational-efficiency',
    title: 'Operational Efficiency',
    description: 'Workflow optimization and operational performance monitoring',
    icon: Zap,
    productIds: ['f3', 'f5'], // Warehouse Ops, Snowflake CDC
    tags: ['Operations', 'Monitoring', 'Efficiency'],
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
  },
];
```

---

## Key Decisions

1. **Keep table as default view** (not cards) - aligns with enterprise patterns
2. **Add shopping layer above table** - hybrid approach (browse + technical)
3. **Design system first** - must match existing `/components/Tables/DataTable.tsx`
4. **Domain > Solution > Product** - progressive disclosure hierarchy
5. **Use dark theme consistently** - `bg-white/5`, `border-white/10`, `text-white/70`

---

## Files Reference

### Current Implementation
- `/components/discover/DataProductTable.tsx` - TO BE REPLACED
- `/components/discover/DataProductColumns.tsx` - TO BE UPDATED
- `/app/(main)/discover/page.tsx` - TO BE ENHANCED

### Design System Pattern
- `/components/Tables/DataTable.tsx` - REFERENCE IMPLEMENTATION

### New Components (To Create)
- `/components/discover/DomainCategoryCard.tsx` - Phase 2
- `/components/discover/SolutionCard.tsx` - Phase 3
- `/components/discover/QuickPreviewModal.tsx` - Phase 4 (future)
- `/components/discover/RecentlyViewed.tsx` - Phase 5 (future)
- `/components/discover/RequestCart.tsx` - Phase 5 (future)

---

## Next Steps

**Immediate** (Start of new conversation):
1. Update todo list with Phases 1-3 tasks
2. Read `/components/Tables/DataTable.tsx` completely to understand pattern
3. Begin Phase 1: Rewrite DataProductTable to match design system

**Testing After Each Phase**:
- Visual regression: Compare with `/components/Tables/DataTable.tsx`
- Functionality: Verify sorting, filtering, pagination work
- Browser test: http://137.220.61.218:3000/discover

---

## References

- **Current URL**: http://137.220.61.218:3000/discover
- **Design Audit**: `/docs/06-feature-implementations/discover/DISCOVER_UX_CRITICAL_AUDIT.md`
- **Progress Tracker**: `/docs/06-feature-implementations/discover/DISCOVER_REMEDIATION_PROGRESS.md`
- **Design Philosophy**: `/CLAUDE.md` (lines 31-50: "Traditional Interface Patterns Over Innovation")
