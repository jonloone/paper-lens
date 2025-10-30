# Step 3 Redesign - Phase 1 Implementation Plan
## Hybrid Mode: Chat + Editor in Modal

**Date**: October 17, 2025
**Status**: 🚧 IN PROGRESS
**Duration**: 2 weeks (estimated)
**Phase**: 1 of 4

---

## Overview

This document details the implementation plan for Phase 1 of the Step 3 UX redesign based on the comprehensive audit in `STEP3_CRITICAL_UX_AUDIT_AND_REDESIGN_PLAN.md`.

**Core Objective**: Transform Step 3 from a tab-based editor-first interface to a hybrid mode where AI chat and data validation are prominent, with the editor accessible via a right-side drawer.

---

## Design Philosophy

### Key Principles

1. **Conversation-Driven Development**: Natural language as primary input method
2. **Validation-First Design**: Results always visible to build confidence
3. **Progressive Enhancement**: Editor remains accessible but not primary
4. **Context Preservation**: All components share state and context

### Target User Experience

```
User Journey:
1. Land on Step 3 → See chat interface + results panel
2. Describe what they want in natural language
3. AI generates SQL → Results appear immediately
4. Click "Edit SQL" → Drawer slides out with full editor
5. Refine SQL in editor → Close drawer → Results update
6. Continue conversation → AI optimizes → Results update
```

---

## Technical Architecture

### Component Hierarchy

```
Step3WriteSQL (Hybrid Mode)
├── TiSQLAgentChat (Left: Primary Interface)
│   ├── Smart Suggestions
│   ├── Conversation History
│   └── Message Input
├── ValidationResultsPanel (Right: Always Visible)
│   ├── Query Results
│   ├── Validation Status
│   ├── Execution Metrics
│   └── Error Display
└── EditorDrawer (Right Side: On-Demand)
    ├── TiSQLEditor (tiSQL with autocomplete)
    ├── Quick Actions (Run, Format, Save)
    └── Close Button
```

### State Management

```typescript
// Shared state across all components
interface Step3State {
  sql: string;                    // Current SQL code
  validationResult: ValidationResult | null;
  previewData: PreviewData | null;
  isValidating: boolean;
  isExecuting: boolean;
  editorOpen: boolean;            // NEW: Drawer open state
  conversationContext: Message[]; // NEW: Chat history
}
```

---

## Implementation Steps

### Step 1: Update Build Workflow

**File**: `app/(main)/build/page.tsx`

**Changes**:
- Ensure `productDefinition` is passed to Step 3 ✅ (Already done)
- Add CopilotKit provider wrapper if not already present

### Step 2: Create EditorDrawer Component

**File**: `components/build/EditorDrawer.tsx` (NEW)

**Purpose**: Slide-out drawer for SQL editor with overlay

**Features**:
- Right-side slide animation (CSS transform)
- Backdrop with click-to-close
- Keyboard shortcut (Escape to close)
- Embedded TiSQLEditor
- Quick actions toolbar (Run, Format, Close)

**Props**:
```typescript
interface EditorDrawerProps {
  open: boolean;
  sql: string;
  onChange: (sql: string) => void;
  onClose: () => void;
  onRun: () => void;
  isRunning: boolean;
  validationResult?: ValidationResult;
}
```

### Step 3: Create ValidationResultsPanel Component

**File**: `components/build/ValidationResultsPanel.tsx` (NEW)

**Purpose**: Always-visible results and validation display

**Features**:
- Tabbed interface (Results, Validation, Metrics, History)
- Empty state prompting user to chat or click templates
- Loading states with skeletons
- Error display with suggestions
- Success metrics (row count, execution time, data quality)

**Props**:
```typescript
interface ValidationResultsPanelProps {
  previewData: PreviewData | null;
  validationResult: ValidationResult | null;
  isExecuting: boolean;
  isValidating: boolean;
  onRun: () => void;
  onOpenEditor: () => void; // NEW: Trigger editor drawer
}
```

### Step 4: Refactor Step3WriteSQL to Hybrid Layout

**File**: `components/build/steps/Step3WriteSQL.tsx`

**Major Changes**:

1. **Remove tab-based layout** (TabsList with 3 tabs)
2. **Replace with 2-column layout**:
   - Left: TiSQLAgentChat (60% width)
   - Right: ValidationResultsPanel (40% width)
3. **Add EditorDrawer** (overlay, appears on demand)
4. **Add floating "Open Editor" button** (for quick access)

**New Layout Structure**:
```tsx
<div className="grid grid-cols-[60%_40%] gap-4 h-[calc(100vh-200px)]">
  {/* Left: Chat */}
  <Card>
    <TiSQLAgentChat
      selectedSources={selectedSources}
      onInsertSQL={handleInsertSQL}
      catalog="iceberg"
      schema="production"
    />
  </Card>

  {/* Right: Results */}
  <Card>
    <ValidationResultsPanel
      previewData={previewData}
      validationResult={validationResult}
      isExecuting={isPreviewing}
      onRun={handlePreview}
      onOpenEditor={() => setEditorOpen(true)}
    />
  </Card>
</div>

{/* Editor Drawer (overlay) */}
<EditorDrawer
  open={editorOpen}
  sql={sqlCode}
  onChange={setSqlCode}
  onClose={() => setEditorOpen(false)}
  onRun={handlePreview}
  isRunning={isPreviewing}
  validationResult={validationResult}
/>

{/* Floating "Open Editor" Button */}
{!editorOpen && (
  <Button
    className="fixed bottom-6 right-6 shadow-lg"
    size="lg"
    onClick={() => setEditorOpen(true)}
  >
    <Code className="mr-2" />
    Open Editor
  </Button>
)}
```

### Step 5: Wire Up CopilotKit Actions

**File**: `components/build/steps/Step3WriteSQL.tsx`

**New CopilotKit Actions**:

```typescript
// Action 1: Insert SQL from chat
useCopilotAction({
  name: 'insertSQL',
  description: 'Insert SQL code into the editor',
  parameters: [{ name: 'sql', type: 'string' }],
  handler: ({ sql }) => {
    setSqlCode(sql);
    setEditorOpen(true); // Auto-open editor to show result
  }
});

// Action 2: Execute query
useCopilotAction({
  name: 'executeQuery',
  description: 'Execute the current SQL query',
  handler: async () => {
    await handlePreview();
  }
});

// Action 3: Get current SQL
useCopilotReadable({
  description: 'Current SQL in the editor',
  value: sqlCode
});

// Action 4: Get selected sources
useCopilotReadable({
  description: 'Selected data sources',
  value: selectedSources.map(s => ({ name: s.name, schema: s.schema, columns: s.columns }))
});
```

### Step 6: Preserve Template and Query Library Access

**Solution**: Add dropdown menu to chat header

```tsx
// In TiSQLAgentChat header
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="ghost" size="sm">
      <Library className="mr-2" />
      Templates & Library
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => setShowTemplates(true)}>
      Browse Templates
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setShowLibrary(true)}>
      Query Library
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

{/* Templates Modal */}
<Dialog open={showTemplates} onOpenChange={setShowTemplates}>
  {/* Render template grid from current implementation */}
</Dialog>

{/* Query Library Modal */}
<Dialog open={showLibrary} onOpenChange={setShowLibrary}>
  <SavedQueryBrowser />
</Dialog>
```

---

## Data Flow

### Conversation → SQL → Results Flow

```
User types in chat
  ↓
TiSQLAgentChat (CopilotKit)
  ↓
AI generates SQL
  ↓
insertSQL action called
  ↓
setSqlCode(sql) in Step3WriteSQL
  ↓
Auto-trigger validation (useEffect)
  ↓
ValidationResultsPanel shows loading
  ↓
Validation completes
  ↓
Results appear in panel
  ↓
User clicks "Run Query"
  ↓
executeQuery action or handlePreview()
  ↓
PreviewData updates
  ↓
Results table renders
```

### Editor Drawer Flow

```
User clicks "Open Editor" button or AI inserts SQL
  ↓
setEditorOpen(true)
  ↓
EditorDrawer slides in from right
  ↓
TiSQLEditor renders with current SQL
  ↓
User edits SQL
  ↓
onChange callback updates sqlCode in parent
  ↓
Validation re-runs automatically
  ↓
User clicks "Close" or presses Escape
  ↓
setEditorOpen(false)
  ↓
Drawer slides out, chat and results remain
```

---

## UI/UX Specifications

### Layout Dimensions

- **Chat Panel**: 60% width (min 500px)
- **Results Panel**: 40% width (min 400px)
- **Editor Drawer**: 50% viewport width (800px max)
- **Drawer Overlay**: 50% opacity black backdrop
- **Animation Duration**: 300ms ease-in-out

### Color Coding

- **Validation Success**: Green border, CheckCircle icon
- **Validation Error**: Red border, AlertCircle icon
- **Executing**: Blue border, Loader2 spinning icon
- **Empty State**: Dashed border, muted text

### Keyboard Shortcuts

- **Cmd/Ctrl + K**: Open chat input (focus)
- **Cmd/Ctrl + E**: Toggle editor drawer
- **Cmd/Ctrl + Enter**: Execute query
- **Escape**: Close editor drawer

### Responsive Behavior

- **Desktop (>1280px)**: 60/40 split with drawer
- **Tablet (768-1280px)**: 50/50 split, drawer becomes fullscreen modal
- **Mobile (<768px)**: Single column, drawer becomes fullscreen modal

---

## Validation & Testing

### Unit Tests

```typescript
// Test SQL insertion from chat
test('insertSQL action updates sqlCode', async () => {
  const { result } = renderHook(() => useStep3State());
  await act(() => result.current.insertSQL('SELECT * FROM users'));
  expect(result.current.sqlCode).toBe('SELECT * FROM users');
});

// Test editor drawer open/close
test('editor drawer opens and closes', () => {
  const { getByText } = render(<Step3WriteSQL />);
  fireEvent.click(getByText('Open Editor'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.click(getByText('Close'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

### Integration Tests

1. **Chat → SQL → Results Flow**:
   - User types "Show me all customers from last 7 days"
   - Verify SQL is generated
   - Verify validation runs automatically
   - Verify results appear in panel

2. **Editor Drawer Flow**:
   - User clicks "Open Editor"
   - Verify drawer slides in
   - User edits SQL
   - Verify changes propagate to parent
   - User closes drawer
   - Verify state persists

3. **Template Loading**:
   - User opens templates dropdown
   - User selects "Aggregation" template
   - Verify SQL is inserted
   - Verify editor drawer opens
   - Verify validation runs

### User Acceptance Testing

**Test Scenarios**:
1. New user creates first query via chat
2. Experienced user refines query in editor
3. User loads template and customizes
4. User encounters validation error and fixes it
5. User switches between chat and editor multiple times

**Success Metrics**:
- 80% of test users prefer hybrid mode over current tabs
- 60% reduction in time to first successful query
- 90% success rate for chat-to-SQL generation
- Zero confusion about where editor is located

---

## Migration Strategy

### Backwards Compatibility

**Option 1: Feature Flag**
```typescript
const ENABLE_HYBRID_MODE = process.env.NEXT_PUBLIC_ENABLE_HYBRID_STEP3 === 'true';

export default function Step3Container(props) {
  return ENABLE_HYBRID_MODE
    ? <Step3WriteSQLHybrid {...props} />
    : <Step3WriteSQL {...props} />;
}
```

**Option 2: Direct Replacement**
- Rename current `Step3WriteSQL.tsx` → `Step3WriteSQL.old.tsx`
- Deploy new hybrid version
- Monitor for issues
- Remove old version after 2 weeks

**Recommended**: Option 1 with gradual rollout (10% → 50% → 100%)

### Rollback Plan

If critical issues arise:
1. Set `NEXT_PUBLIC_ENABLE_HYBRID_STEP3=false`
2. Redeploy frontend
3. Revert in 5 minutes
4. Investigate issues
5. Fix and re-enable

---

## Dependencies

### New NPM Packages

```json
{
  "@copilotkit/react-core": "^1.0.0",
  "@copilotkit/react-ui": "^1.0.0"
}
```

### Existing Packages (No Changes)

- `@uiw/react-codemirror`
- `@codemirror/lang-sql`
- `@tidbcloud/tisqleditor-react`
- All shadcn/ui components

---

## Timeline

### Week 1: Core Implementation

**Day 1-2**:
- Create EditorDrawer component ✅
- Create ValidationResultsPanel component ✅
- Set up layout structure ✅

**Day 3-4**:
- Refactor Step3WriteSQL to hybrid layout ✅
- Wire up CopilotKit actions ✅
- Add editor drawer animations ✅

**Day 5**:
- Preserve template/library access ✅
- Add keyboard shortcuts ✅
- Polish styling and responsive behavior ✅

### Week 2: Testing & Refinement

**Day 6-7**:
- Write unit tests
- Run integration tests
- Fix bugs

**Day 8-9**:
- User acceptance testing (5 users)
- Gather feedback
- Make adjustments

**Day 10**:
- Final polish
- Documentation updates
- Deploy to staging

---

## Success Criteria

### Technical Success

- ✅ All existing functionality preserved
- ✅ No regression in query execution
- ✅ Real-time validation works
- ✅ CopilotKit actions respond within 2s
- ✅ No console errors
- ✅ 95%+ test coverage

### UX Success

- ✅ 80%+ users prefer hybrid mode
- ✅ 60%+ reduction in time to first query
- ✅ 90%+ chat-to-SQL success rate
- ✅ Zero confusion about editor location
- ✅ Validation results always visible
- ✅ Smooth animations (60fps)

### Business Success

- ✅ 30%+ increase in Step 3 completion rate
- ✅ 50%+ reduction in SQL errors in Step 4
- ✅ 40%+ increase in template usage
- ✅ Positive user feedback (4.5+ stars)

---

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CopilotKit rate limits | High | Low | Add local fallback LLM |
| Editor drawer performance | Medium | Medium | Lazy load TiSQLEditor |
| Users miss editor location | High | Medium | Add onboarding tooltip |
| Chat generates invalid SQL | Medium | High | Add validation before insertion |
| Layout breaks on mobile | Medium | Low | Comprehensive responsive testing |

---

## Next Steps

After Phase 1 completion:

**Phase 2: Invert Primary** (2 weeks)
- Make chat the default landing view
- Editor becomes secondary (but still prominent)
- Add AI-suggested refinements in chat

**Phase 3: Enhanced Validation Views** (2 weeks)
- Real-time data quality metrics
- Visual schema exploration
- Performance optimization suggestions

**Phase 4: dbt Project Generation** (2 weeks)
- One-click dbt project scaffolding
- Staging → Intermediate → Marts pattern
- Automated testing and documentation

---

## Related Documentation

- **Critical UX Audit**: `STEP3_CRITICAL_UX_AUDIT_AND_REDESIGN_PLAN.md`
- **Policy Movement**: `POLICY_MOVEMENT_COMPLETE.md`
- **Original Fix Plan**: `STEP_WORKFLOW_FIXES_PLAN.md`
- **Step 4 Quality Integration**: `STEP4_QUALITY_GATES_PREVIEW.md`

---

## Approval & Sign-Off

**Developed By**: Claude Code
**Reviewed By**: [To be filled]
**Approved By**: [To be filled]
**Start Date**: October 17, 2025
**Target Completion**: October 31, 2025

**Status**: 🚧 **IN PROGRESS - DAY 1**

---

**Next Action**: Begin implementation of EditorDrawer component
