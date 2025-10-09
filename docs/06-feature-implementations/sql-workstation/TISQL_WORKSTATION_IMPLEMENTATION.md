# tiSQL Workstation Integration - Implementation Plan

## Overview
Replace Monaco editor in Step5Transform with integrated tiSQL editor following Starburst/Databricks/Snowflake best practices.

## Current State Analysis

### Existing tiSQL Playground (`/app/playground/page.tsx`)
- ✅ **Already uses `react-resizable-panels`** for 3-panel layout
- ✅ **tiSQL editor** from `@tidbcloud/tisqleditor` package
- ✅ **AI integration** via `/api/tisql-ai` endpoint
- ✅ **Schema browser** with expandable tree
- ✅ **File management** (tabs, new file, save to library)
- ✅ **Execution simulation** with results display
- ✅ **Dark/light theme** support
- ✅ **CrewAI backend** with multi-agent SQL generation

### Current Step5Transform Issues
- ❌ Uses basic Monaco editor (limited features)
- ❌ Vertical scrolling layout (not industry standard)
- ❌ Popup window for "Advanced Editor" (context loss)
- ❌ Inline validation/test results (cluttered)
- ❌ No persistent results panel
- ❌ Context sidebar only sticky (should be permanent panel)

## Target Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Header: Product Context + Actions (Run, Validate, Save)           │
├────────────┬─────────────────────────────────┬─────────────────────┤
│ LEFT       │  CENTER                         │  RIGHT              │
│ (20%)      │  (50%)                          │  (30%)              │
│            │                                 │                     │
│ Context    │  tiSQL Editor                   │  Results Panel      │
│ Panel      │  - Full SQL IDE                 │  (Tabbed)           │
│            │  - AI Assistant (Ctrl+I)        │                     │
│ • Product  │  - Syntax highlight             │  [Results]          │
│ • Sources  │  - Autocomplete                 │  [Validation]       │
│ • Schema   │  - Multi-cursor                 │  [History]          │
│ • Search   │  - Code folding                 │  [AI Chat]          │
│            │                                 │                     │
│ [Collapsible│  Action Bar:                   │  When executed:     │
│  to icon]  │  [▶ Run] [✓ Validate]          │  • Row count        │
│            │  [⚡ Format] [📋 Templates]     │  • Execution time   │
│            │                                 │  • Preview table    │
│            │  Status Bar:                    │  • Export options   │
│            │  ✓ 3 tables • 42 columns       │                     │
└────────────┴─────────────────────────────────┴─────────────────────┘
```

## Implementation Phases

### Phase 1: Extract tiSQL Components (2 hours)

**Goal**: Create reusable tiSQL components from playground

**Tasks**:
1. Create `components/tisql/TiSQLEditor.tsx`
   - Extract tiSQL editor wrapper with extensions
   - Add props: `sql`, `onChange`, `selectedTables`, `schema`, `onExecute`
   - Include AI integration logic
   - Include theme support

2. Create `components/tisql/TiSQLContextPanel.tsx`
   - Combine TransformContextSidebar + Schema Browser
   - Product definition section
   - Selected sources (expandable tables/columns)
   - Output schema preview
   - Search/filter functionality

3. Create `components/tisql/TiSQLResultsPanel.tsx`
   - Tabbed interface: Results | Validation | History | AI
   - Results tab: Table view with row count, execution time
   - Validation tab: Move existing validation UI here
   - History tab: Query version history
   - AI tab: Chat interface for natural language queries

**Files to Create**:
```
components/tisql/
├── TiSQLEditor.tsx          # Main editor wrapper
├── TiSQLContextPanel.tsx    # Left panel
├── TiSQLResultsPanel.tsx    # Right panel with tabs
└── TiSQLWorkspace.tsx       # 3-panel layout container
```

### Phase 2: Build Workspace Layout (1 hour)

**Goal**: Create resizable 3-panel workspace container

**Component**: `components/tisql/TiSQLWorkspace.tsx`

```typescript
interface TiSQLWorkspaceProps {
  // Product context (Step 1)
  productDefinition?: ProductDefinition;

  // Sources (Step 2)
  selectedSources: Source[];

  // Schema (Step 3/4)
  outputSchema: Array<{ name: string; type: string }>;

  // SQL state
  sql: string;
  onSQLChange: (sql: string) => void;

  // Actions
  onRun: () => void;
  onValidate: () => void;
  onSave: () => void;

  // Results
  executionResult?: ExecutionResult;
  validationResult?: ValidationResult;
}
```

**Features**:
- Uses `react-resizable-panels` (already in package.json)
- Collapsible left panel (to icon bar)
- Collapsible right panel (to maximize editor)
- Saved layout preferences (localStorage)
- Keyboard shortcuts (Cmd+B toggle left, Cmd+J toggle right)

### Phase 3: Integrate into Step5Transform (1 hour)

**Goal**: Replace existing editor with tiSQL workspace

**Changes to `Step5Transform.tsx`**:
1. Remove Monaco editor imports
2. Remove popup window logic (`handleOpenAdvancedEditor`)
3. Remove inline validation/test UI
4. Replace with `<TiSQLWorkspace />` component
5. Update state management to work with new layout

**Before**:
```typescript
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-3">
    <TransformContextSidebar ... />
  </div>
  <div className="col-span-9">
    <Editor ... /> {/* Monaco */}
    {/* Inline validation */}
    {/* Inline test results */}
  </div>
</div>
```

**After**:
```typescript
<TiSQLWorkspace
  productDefinition={productDefinition}
  selectedSources={selectedSources}
  outputSchema={schema}
  sql={sql}
  onSQLChange={setSQL}
  onRun={handleRun}
  onValidate={handleValidate}
  onSave={handleSave}
  executionResult={testResult}
  validationResult={validationResult}
/>
```

### Phase 4: Archive Old Playground (30 minutes)

**Goal**: Archive popup window approach, keep standalone playground

**Tasks**:
1. Move `/app/playground/page.tsx` to `/app/playground/page-standalone.tsx`
2. Create new `/app/playground/page.tsx` that uses TiSQLWorkspace
3. Update any links/references
4. Add deprecation notice to standalone version

**Rationale**:
- Keep standalone SQL IDE for power users
- Main build flow uses integrated workspace
- Single source of truth for tiSQL components

### Phase 5: Testing & Polish (1 hour)

**Testing Checklist**:
- [ ] SQL editing works with all tiSQL features
- [ ] AI assistant (Ctrl+I) generates SQL correctly
- [ ] Validation shows errors/warnings in right panel
- [ ] Test execution shows results in right panel
- [ ] Context panel shows product/sources correctly
- [ ] Panel resize/collapse works smoothly
- [ ] Keyboard shortcuts work
- [ ] Layout preferences persist
- [ ] Theme switching works
- [ ] No console errors

**Polish**:
- Smooth collapse/expand animations
- Proper loading states
- Error boundaries
- Accessibility (keyboard nav, screen reader)
- Mobile responsive (stack panels vertically)

## Key Technical Decisions

### 1. Package Dependencies
Already have:
- ✅ `@tidbcloud/tisqleditor` - tiSQL editor component
- ✅ `react-resizable-panels` - Resizable panel layout
- ✅ `@codemirror/state`, `@codemirror/view` - Editor core

No new dependencies needed!

### 2. API Integration
Reuse existing endpoints:
- ✅ `/api/tisql-ai` - AI SQL generation (CrewAI backend)
- ✅ `/api/tisql/generate` - Fallback generator
- Add new: `/api/tisql/validate` - SQL validation
- Add new: `/api/tisql/test` - Query execution with sample data

### 3. State Management
Use existing React state (no Redux needed):
- `sql` - Current SQL content
- `executionResult` - Last execution result
- `validationResult` - Last validation result
- `panelSizes` - Layout preferences (localStorage)

### 4. Theme Consistency
Match existing design system:
- Use Tailwind classes throughout
- Dark mode: `bg-[#1e1e1e]` (tiSQL default)
- Light mode: `bg-background`
- Border: `border-2` for primary containers
- Typography: existing scale (text-sm, text-xs, etc.)

## Migration Strategy

### For Users
1. Existing workflows continue to work
2. No data loss (SQL persists in build flow state)
3. Better UX (no popup windows, persistent results)
4. Gradual adoption (can still use /playground standalone)

### For Developers
1. Remove Monaco editor code (~200 lines)
2. Remove popup window logic (~100 lines)
3. Add TiSQL components (~800 lines, mostly extracted from playground)
4. Net: ~500 lines added, better organized

## Success Metrics

### Functional
- ✅ All tiSQL features available in build flow
- ✅ AI assistant works inline (no popup)
- ✅ Validation/results in persistent panels
- ✅ Context always visible (left panel)

### Performance
- ✅ Initial load < 2s
- ✅ Panel resize smooth (60fps)
- ✅ No memory leaks (extended use)

### UX
- ✅ 80% reduction in scrolling
- ✅ 50% faster edit-validate-test cycle
- ✅ 100% context visibility (no switching)
- ✅ 90%+ user preference vs. old layout

## Rollout Plan

### Week 1: Development
- Day 1-2: Phase 1 (Extract components)
- Day 3: Phase 2 (Workspace layout)
- Day 4: Phase 3 (Integration)
- Day 5: Phase 4-5 (Archive + Polish)

### Week 2: Testing
- Internal testing with data engineers
- Collect feedback
- Fix bugs
- Performance optimization

### Week 3: Rollout
- Deploy to production
- Monitor usage
- Collect analytics
- Iterate based on feedback

## Risk Mitigation

### Risk: tiSQL editor breaks on integration
**Mitigation**: Keep playground as reference, extensive testing

### Risk: Users miss popup editor
**Mitigation**: Keep standalone /playground available, add link

### Risk: Performance issues with large SQL
**Mitigation**: Use tiSQL's built-in virtualization, lazy load panels

### Risk: Layout preferences conflict
**Mitigation**: Use namespaced localStorage keys, provide reset option

## Next Steps

1. Review and approve this implementation plan
2. Create feature branch: `feature/tisql-workspace-integration`
3. Start Phase 1: Extract tiSQL components
4. Daily standups to track progress
5. Code reviews at each phase completion

---

**Status**: Ready for implementation
**Estimated Time**: 5-6 hours total
**Dependencies**: None (all packages already installed)
**Breaking Changes**: None (backward compatible)
