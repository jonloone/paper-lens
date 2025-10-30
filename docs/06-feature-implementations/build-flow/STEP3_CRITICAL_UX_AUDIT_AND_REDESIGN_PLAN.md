# Step 3 Critical UX Audit & Redesign Plan
## Conversation-Driven SQL Development with AI-First, Validation-First Design

**Date**: October 16, 2025
**Status**: 📋 APPROVED - Ready for Implementation
**Priority**: HIGH - Fundamental UX Transformation
**Timeline**: 8 weeks (4 phases)

---

## Executive Summary

This document presents a comprehensive critical UX audit of Step 3 (Write SQL) in the Build workflow, revealing fundamental design issues that undermine AI assistance and user confidence. The audit identifies **two competing implementations**, a fragmented user experience, and a critical misalignment with modern AI-powered development patterns.

**Key Finding**: Our current Step 3 treats the SQL editor as primary and AI as secondary (hidden behind a toggle), when the optimal pattern is **conversation-driven development** with AI as primary and the editor as a power-user tool.

### The Problem

Current Step 3 forces users to choose between:
- Writing SQL manually (high barrier to entry)
- Using AI assistance (hidden, not prominent)
- Validating results (buried, not proactive)

### The Solution

**"Conversation-Driven SQL Development"** - A new paradigm where:
- AI chat is the **primary interface** (40% of screen, always visible)
- Data validation is **always shown** (60% of screen, live preview)
- SQL editor is **available on demand** (expandable drawer for advanced editing)

### Expected Impact

- **80% Step 3 completion rate** (up from 60%)
- **3x faster SQL generation** (30 min → 10 min average)
- **95% user confidence** in AI-generated SQL
- **40%+ dbt project adoption** (vs 0% currently)

---

## Current State: Comprehensive Analysis

### Two Competing Implementations Discovered

#### Implementation 1: Step3WriteSQL.tsx (868 lines)
**Location**: `components/build/steps/Step3WriteSQL.tsx`
**Type**: Tab-based interface with CodeMirror editor
**Current Usage**: Main Build workflow

**Architecture**:
```
┌────────────────────────────────────────────────────┐
│ Header: "Write Transformation SQL"                │
├────────────────────────────────────────────────────┤
│ Source Context Card (selected sources)            │
├────────────────────────────────────────────────────┤
│ Tabs: [SQL Editor] [Query Library] [Templates]    │
│                                                     │
│ SQL EDITOR TAB (Primary):                          │
│ ┌──────────────────────────────────────────────┐  │
│ │ CodeMirror Editor (400px height)             │  │
│ │ - PostgreSQL syntax highlighting             │  │
│ │ - Basic autocomplete                          │  │
│ │ - Real-time validation (debounced 1s)        │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ Validation Status (below editor)                   │
│                                                     │
│ ↓ SCROLL REQUIRED ↓                                │
│                                                     │
│ Query Results Card (bottom of page):               │
│ - Only shown AFTER clicking "Run Query"            │
│ - Preview table (100 rows)                         │
│ - Execution metrics                                │
│ - No lineage, no optimization insights             │
│                                                     │
│ QUERY LIBRARY TAB:                                 │
│ - SavedQueryBrowser component                      │
│ - Load previous queries                            │
│                                                     │
│ TEMPLATES TAB:                                     │
│ - 13 SQL templates (basic/advanced/dbt)           │
│ - Categories: Basic (4), Advanced (4), dbt (5)    │
│ - NO full dbt project generation                   │
└────────────────────────────────────────────────────┘
```

**Key Features**:
- Smart default SQL generation based on selected sources
- Detects potential join keys automatically
- Real-time validation via `/api/v1/trino/validate` (mock in WriteSQL, real in Workstation wrapper)
- Preview execution with MockSQLEngine
- 13 pre-built templates

**Problems Identified**:
❌ **Editor-first paradigm**: User must write SQL or pick template first
❌ **No AI assistance**: No chat interface, no natural language queries
❌ **Results buried**: Preview only shown after clicking Run Query, requires scroll
❌ **Limited validation**: Basic syntax checking, no optimization insights
❌ **No dbt projects**: Only individual SQL templates, not full project structure
❌ **Cognitive load**: 3 tabs, context switching, important info below fold

#### Implementation 2: TiSQLWorkstation.tsx (461 lines)
**Location**: `components/tisql/TiSQLWorkstation.tsx`
**Type**: Fullscreen 3-panel workspace with portal rendering
**Current Usage**: Wrapped by Step3SQLWorkstation.tsx with real Trino validation

**Architecture**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Compact Header: [Back] Product • ENV • [Editor/Agent Toggle]   │
├──────────────┬──────────────────────────┬──────────────────────┤
│ LEFT PANEL   │ CENTER PANEL             │ RIGHT PANEL          │
│ (20% width)  │ (55% width)              │ (25% width)          │
│              │                           │                      │
│ CONTEXT:     │ ┌─────────────────────┐  │ RESULTS:             │
│ • Product    │ │ MUTUALLY EXCLUSIVE  │  │ Tabs:                │
│   definition │ │                      │  │ • Results            │
│ • Selected   │ │ [Editor] [Agent]    │  │ • Lineage            │
│   sources    │ │      ▲▲▲▲▲           │  │ • Optimization       │
│ • Output     │ │    Toggle Button     │  │ • Validation         │
│   schema     │ │                      │  │ • History            │
│ • Catalog    │ │ OPTION 1: EDITOR     │  │                      │
│ • Env        │ │ TiSQLEditor.tsx      │  │ Real Trino data:     │
│              │ │ • tiSQL extensions   │  │ • Row counts         │
│ [⌘B Hide]    │ │ • Autocomplete       │  │ • Exec time          │
│              │ │ • Syntax highlight   │  │ • Bytes processed    │
│              │ │ • Save helper        │  │ • Cache hits         │
│              │ │                      │  │ • Partitions         │
│              │ │ OR                   │  │ • Data preview       │
│              │ │                      │  │ • EXPLAIN insights   │
│              │ │ OPTION 2: AGENT      │  │                      │
│              │ │ TiSQLAgentChat.tsx   │  │ [⌘J Hide]            │
│              │ │ • CopilotKit chat    │  │                      │
│              │ │ • Smart suggestions  │  │                      │
│              │ │ • SQL generation     │  │                      │
│              │ │ • Optimization tips  │  │                      │
│              │ └─────────────────────┘  │                      │
│              │                           │                      │
└──────────────┴──────────────────────────┴──────────────────────┘
│ Status Bar: 2 tables • 15 columns • iceberg • [⌘↵ Run]         │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Portal-based fullscreen rendering (breaks out of layout constraints)
- Real Trino validation and execution (`/api/v1/trino/validate-and-execute`)
- Professional tiSQL editor with advanced extensions
- CopilotKit-powered AI agent with context awareness
- Comprehensive results panel with 5 tabs
- Keyboard shortcuts (⌘B, ⌘J, ⌘↵, ⌘S)
- Collapsible panels for focus mode

**Problems Identified**:
❌ **Editor/Agent mutually exclusive**: Toggle button forces choice
❌ **Can't use both simultaneously**: Either code OR chat, not both
❌ **Results can be hidden**: Collapsible panel, user might close it
❌ **Context panel takes space**: 20% width when user might not need it
❌ **Fullscreen only**: Can't see other Build workflow context
❌ **Steeper learning curve**: More complex UI, more keyboard shortcuts

### Component Dependency Analysis

**TiSQLEditor.tsx** (125 lines):
- Uses `@tidbcloud/tisqleditor-react` (professional SQL editor)
- Extensions: `curSqlGutter`, `sqlAutoCompletion`, `saveHelper`, `oneDark` theme
- SSR-safe with dynamic import and loading state
- Autocomplete with schema awareness
- Dark/light theme support

**TiSQLAgentChat.tsx** (203 lines):
- CopilotKit-powered conversation interface
- Smart suggestions based on selected sources (generates SQLTemplate[])
- Full context awareness (editor state, sources, product definition)
- 7 frontend actions for SQL operations (insertSQL, executeQuery, getTableSchema, etc.)
- Streaming responses with generative UI support (future)
- AG-UI protocol ready

**TiSQLResultsPanel.tsx** (654 lines):
- 5 tabs: Results, Lineage, Optimization, Validation, History
- **Results Tab**:
  - Execution success/failure cards with metrics
  - Row count, execution time, bytes processed
  - Cache hits, partitions read (simulated)
  - Data preview table with type-specific formatting
- **Lineage Tab**: QueryLineagePanel integration
- **Optimization Tab**:
  - Analysis summary with severity-based coloring
  - FindingCard components showing:
    - Performance insights from Trino EXPLAIN
    - Optimization suggestions
    - Estimated impact (speedup, data savings)
    - Suggested SQL fixes
    - Evidence and confidence basis
- **Validation Tab**: Errors and warnings from Trino validation
- **History Tab**: Placeholder for future query history

**TiSQLContextPanel.tsx** (319 lines):
- 2 tabs: Context, Schema
- **Context Tab**:
  - Environment badge (DEV/STAGING/PROD)
  - Product definition card
  - Source tables with expandable columns
  - Output schema preview
- **Schema Tab**: Catalog → Tables → Columns tree view
- Collapsible with minimize button

### Data Flow: Current vs Ideal

**Current Flow (Step3WriteSQL)**:
```
User enters Step 3
→ Sees blank CodeMirror editor
→ User must write SQL OR pick template
→ Click "Run Query" button
→ Scroll down to see results
→ Iterate manually
→ Continue to Step 4
```
**Pain Points**:
- Blank page anxiety
- High barrier to entry
- Results not visible until explicitly requested
- No AI assistance

**Current Flow (TiSQLWorkstation)**:
```
User enters fullscreen workspace
→ Toggle to Agent view OR stay in Editor
→ If Agent: Chat generates SQL → User copies to Editor
→ If Editor: User writes SQL manually
→ Click "Run" button
→ Check Results panel (might be collapsed)
→ Toggle back to Editor to make changes
→ Continue to Step 4
```
**Pain Points**:
- Mutually exclusive Editor/Agent
- Context switching between views
- Can't see AI suggestions while editing
- Results panel can be hidden

**Ideal Flow (Proposed)**:
```
User enters Step 3
→ Sees AI chat with smart suggestions (left 40%)
→ Sees live results preview (right 60%)
→ User describes in natural language: "Show me customers who churned"
→ AI generates SQL immediately
→ Auto-validates with Trino
→ Results appear in right panel (no click needed)
→ User sees data preview, metrics, confidence score
→ If satisfied: Continue to Step 4
→ If needs refinement: Ask AI OR expand editor drawer
```
**Benefits**:
- Zero blank page anxiety
- AI lowers barrier to entry
- Results always visible (builds confidence)
- Editor available when needed

---

## Modern AI SQL Tool Patterns: Research Findings

### Cursor IDE
**Pattern**: Code editor (left) + AI chat (right sidebar, always visible)
- Chat doesn't replace editor, it augments it
- Results and suggestions appear inline
- User can accept/reject/modify AI suggestions
- **Key Insight**: AI and code are **simultaneously visible**

### GitHub Copilot Chat
**Pattern**: VS Code editor + persistent chat panel
- Chat panel can be docked left/right/bottom
- Inline suggestions in editor
- Chat history preserved
- **Key Insight**: AI is **always accessible**, not hidden

### ChatGPT Code Interpreter
**Pattern**: Conversation (top) + Code execution results (bottom)
- Chat is primary interface
- Code execution happens automatically
- Results shown immediately below conversation
- User can see data visualizations, tables, errors
- **Key Insight**: **Conversation-first**, execution results **always shown**

### Jupyter Notebooks
**Pattern**: Vertical flow of cells (code → results → code → results)
- Immediate feedback after execution
- Results appear directly below code
- No hidden panels or toggles
- **Key Insight**: **Validation-first** - results are first-class citizens

### Common Success Patterns

| Pattern | Example | Why It Works |
|---------|---------|--------------|
| **AI Always Visible** | Cursor, Copilot | No context switching, immediate access |
| **Results Always Shown** | Jupyter, ChatGPT | Builds confidence, enables iteration |
| **Conversation-First** | ChatGPT, Claude | Lowers barrier to entry, natural workflow |
| **Editor as Power Tool** | ChatGPT Advanced | Available for complex edits, not required |

### Anti-Patterns to Avoid

❌ **Toggle between AI and Editor**: Forces choice, prevents simultaneous use
❌ **Hidden results panels**: User can't validate AI output
❌ **Editor-first interface**: High barrier to entry for non-SQL experts
❌ **Modal AI assistance**: Interrupts workflow, not persistent

---

## Proposed Solution: "Conversation-Driven SQL Development"

### New UX Paradigm

**Philosophy**: SQL development should feel like a **conversation with an expert**, not staring at a blank editor. The AI guides the user through data exploration, query creation, and validation, with the editor available when manual precision is needed.

### Visual Design

**Primary Interface** (Step3ConversationalSQL.tsx):
```
┌─────────────────────────────────────────────────────────────────┐
│ Header: Customer Churn Risk • iceberg.production • DEV         │
│ [← Back to Sources]  [▶ Run Query]  [✨ Analyze]  [Continue →] │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                      │
│ LEFT (40%)              │ RIGHT (60%)                          │
│ ══════════════════════  │ ═══════════════════════════════════ │
│                          │                                      │
│ 🤖 AI AGENT CHAT        │ ✓ DATA VALIDATION & RESULTS          │
│ (Always Visible)         │ (Always Visible)                     │
│                          │                                      │
│ ┌──────────────────────┐│ ┌──────────────────────────────────┐│
│ │ Smart Suggestions:   ││ │ 📊 Query Results                  ││
│ │                       ││ │                                   ││
│ │ • Customer 360 View  ││ │ ✅ Query executed successfully     ││
│ │   Join customers +   ││ │                                   ││
│ │   orders + support   ││ │ Rows: 1,247 | Time: 0.34s         ││
│ │   "Suggested for     ││ │ Bytes: 2.1 MB | Confidence: 95%   ││
│ │   Customer Success"  ││ │                                   ││
│ │                       ││ │ ┌──────────────────────────────┐ ││
│ │ • Churn Analysis     ││ │ │ customer_id │ name │ risk_... │ ││
│ │   Identify at-risk   ││ │ ├─────────────┼──────┼─────────┤ ││
│ │   customers          ││ │ │ 1001       │ Acme │ HIGH     │ ││
│ │   "Based on your     ││ │ │ 1002       │ Beta │ MEDIUM   │ ││
│ │   engagement data"   ││ │ │ 1003       │ ...  │ LOW      │ ││
│ │                       ││ │ └──────────────────────────────┘ ││
│ │ [Click to use]       ││ │                                   ││
│ └──────────────────────┘│ │ Tabs:                             ││
│                          │ │ [Results] [Validation]            ││
│ ┌──────────────────────┐│ │ [Optimization] [Lineage]          ││
│ │ Conversation:        ││ │                                   ││
│ │                       ││ └──────────────────────────────────┘││
│ │ You: Show me         ││                                      │
│ │ customers who        ││ No editor visible - it's hidden!    │
│ │ churned last month   ││ User can focus on conversation       │
│ │                       ││ and results validation.             │
│ │ AI: I'll create a    ││                                      │
│ │ query that joins     ││ If user needs manual editing:       │
│ │ customers with       ││ ┌──────────────────────────────────┐│
│ │ subscription         ││ │ [🔧 Expand SQL Editor]            ││
│ │ cancellations.       ││ └──────────────────────────────────┘││
│ │ [SQL generated]      ││                                      │
│ │                       ││                                      │
│ │ You: Can you add     ││                                      │
│ │ their last order     ││                                      │
│ │ date?                ││                                      │
│ │                       ││                                      │
│ │ AI: Updated the      ││                                      │
│ │ query to include...  ││                                      │
│ │                       ││                                      │
│ │ [Type your message]  ││                                      │
│ └──────────────────────┘│                                      │
│                          │                                      │
└──────────────────────────┴──────────────────────────────────────┘
```

**Editor Drawer** (Expandable overlay):
```
┌─────────────────────────────────────────────────────────────────┐
│ SQL Editor • Editing: customer_churn_query                      │
│ [✕ Close]  [▶ Run]  [✨ Analyze]  [💬 Send to Chat]            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1  -- Customer churn analysis with last order date              │
│ 2  SELECT                                                        │
│ 3    c.customer_id,                                             │
│ 4    c.name,                                                    │
│ 5    c.email,                                                   │
│ 6    sc.cancelled_at,                                           │
│ 7    o.last_order_date,                                         │
│ 8    DATEDIFF('day', o.last_order_date, CURRENT_DATE) as ...   │
│ 9  FROM {{ ref('customers') }} c                                │
│ 10 LEFT JOIN {{ ref('subscription_cancellations') }} sc         │
│ 11   ON c.customer_id = sc.customer_id                          │
│ 12 LEFT JOIN (                                                  │
│ 13   SELECT customer_id, MAX(order_date) as last_order_date     │
│ 14   FROM {{ ref('orders') }}                                   │
│ 15   GROUP BY customer_id                                       │
│ 16 ) o ON c.customer_id = o.customer_id                         │
│ 17 WHERE sc.cancelled_at >= CURRENT_DATE - INTERVAL '30' DAY   │
│ 18 ORDER BY sc.cancelled_at DESC;                              │
│                                                                  │
│ ✓ Syntax validated | Est. 1,247 rows | Cost: $0.02            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

**New Components**:
```
Step3ConversationalSQL.tsx (new)
├── Header
│   ├── Product context breadcrumb
│   ├── Run Query button (auto-executes with approval)
│   ├── Analyze button (Trino EXPLAIN)
│   └── Continue button
├── Left Panel (40%)
│   └── TiSQLAgentChat.tsx (existing)
│       ├── Smart suggestions (based on sources)
│       ├── Conversation history
│       ├── Natural language input
│       ├── SQL generation (CopilotKit)
│       ├── dbt project generation (new)
│       └── Expand Editor button
├── Right Panel (60%)
│   └── TiSQLResultsPanel.tsx (existing)
│       ├── Live query results
│       ├── Validation status
│       ├── Optimization findings
│       └── Lineage visualization
└── TiSQLEditorDrawer.tsx (new)
    ├── Slide-out overlay (fullscreen or split-screen)
    ├── TiSQLEditor.tsx (existing)
    ├── State preservation
    ├── Send to Chat button
    └── Close button
```

**Reused Components** (no changes needed):
- `TiSQLAgentChat.tsx` - AI conversation interface
- `TiSQLEditor.tsx` - Professional SQL editor
- `TiSQLResultsPanel.tsx` - Multi-tab results display
- `TiSQLContextPanel.tsx` - Product/source context (optional in drawer)

**New Components** (to build):
- `Step3ConversationalSQL.tsx` - Main container with 2-panel layout
- `TiSQLEditorDrawer.tsx` - Expandable editor overlay with state management

### User Workflows

**Beginner User** (60% of users):
```
1. Enters Step 3
2. Sees smart suggestions based on selected sources
3. Clicks suggestion: "Customer 360 View"
4. AI generates SQL automatically
5. Results appear immediately in right panel
6. Reviews data preview (95% confidence score)
7. Clicks Continue → Step 4
8. NEVER opened the editor
```
**Time**: 2-3 minutes (vs 15-20 minutes currently)

**Intermediate User** (30% of users):
```
1. Enters Step 3
2. Types in chat: "Show me customers who haven't ordered in 90 days"
3. AI generates SQL with LEFT JOIN and date filter
4. Results appear with 847 rows
5. User refines: "Also show their last product category"
6. AI updates SQL with additional JOIN
7. Results refresh with new column
8. Clicks Continue → Step 4
9. MAYBE opened editor once to inspect SQL
```
**Time**: 5-7 minutes (vs 20-30 minutes currently)

**Advanced User** (10% of users):
```
1. Enters Step 3
2. Types in chat: "Create a dbt project for customer analytics"
3. AI suggests dbt template with staging → intermediate → marts
4. User approves
5. AI generates full dbt project structure
6. User reviews file tree preview
7. User expands editor to manually adjust one model
8. Makes precise edits to marts/customer_ltv.sql
9. Closes editor, clicks Continue
10. Downloads dbt project ZIP for version control
```
**Time**: 10-15 minutes (vs 2-3 hours manually creating dbt project)

---

## Phased Implementation Plan

### Phase 1: Hybrid Mode (Weeks 1-2)
**Goal**: Prove conversation-driven approach without breaking existing flow

**Deliverables**:
1. **Step3ConversationalSQL.tsx** (new component)
   - 2-panel layout: AI Chat (left 40%) + Results (right 60%)
   - "Open Editor" button that launches Step3WriteSQL in modal
   - Smart suggestions based on selected sources
   - Auto-validate SQL after AI generation (with user approval)
   - Real Trino integration (existing `/api/v1/trino/*` endpoints)

2. **Update Build Flow** (`app/(main)/build/page.tsx`)
   - Add feature flag: `ENABLE_CONVERSATIONAL_SQL`
   - Render Step3ConversationalSQL if flag enabled
   - Fall back to Step3WriteSQL if disabled
   - Gradual rollout: 10% → 50% → 100%

3. **User Testing**
   - 10 internal users
   - Record sessions (Hotjar or similar)
   - Survey: preference for old vs new
   - Measure: completion time, confidence score

**Success Metrics**:
- 70%+ users start with chat instead of editor
- 50% reduction in "blank page anxiety" (survey)
- User feedback: "Easier to get started"

**Technical Implementation**:
```typescript
// Step3ConversationalSQL.tsx
export function Step3ConversationalSQL({
  productDefinition,
  selectedSources,
  schema,
  initialData,
  onComplete,
  onBack
}: Step3SQLConversationalProps) {
  const [sql, setSQL] = useState(initialData?.sql || '');
  const [showEditor, setShowEditor] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Auto-validate when AI generates SQL
  useEffect(() => {
    if (sql && sql !== initialData?.sql) {
      validateAndExecute();
    }
  }, [sql]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header productDefinition={productDefinition} />

      {/* 2-Panel Layout */}
      <div className="flex-1 flex">
        {/* Left: AI Chat (40%) */}
        <div className="w-2/5 border-r">
          <TiSQLAgentChat
            catalog="iceberg"
            schema="production"
            environment="development"
            selectedSources={selectedSources}
            onInsertSQL={setSQL}
          />
          <Button onClick={() => setShowEditor(true)}>
            🔧 Expand SQL Editor
          </Button>
        </div>

        {/* Right: Results (60%) */}
        <div className="w-3/5">
          <TiSQLResultsPanel
            validationResult={validationResult}
            testResult={testResult}
            theme="dark"
          />
        </div>
      </div>

      {/* Editor Modal (conditional) */}
      {showEditor && (
        <Modal onClose={() => setShowEditor(false)}>
          <Step3WriteSQL
            selectedSources={selectedSources}
            initialData={{ sql }}
            onComplete={(data) => {
              setSQL(data.sql);
              setShowEditor(false);
            }}
            onBack={() => setShowEditor(false)}
          />
        </Modal>
      )}
    </div>
  );
}
```

### Phase 2: Invert Primary (Weeks 3-4)
**Goal**: Make chat primary, editor becomes drawer

**Deliverables**:
1. **TiSQLEditorDrawer.tsx** (new component)
   - Slide-out drawer from right side (not modal)
   - Uses TiSQLEditor.tsx with tiSQL extensions
   - State preservation when minimized/restored
   - Keyboard shortcut: ⌘E to toggle
   - Three modes:
     - Hidden (default)
     - Overlay (fullscreen)
     - Split-screen (Chat 30% + Editor 40% + Results 30%)

2. **Enhanced AI Chat**
   - Add "View SQL" button to show generated query inline
   - Syntax highlighting in chat bubbles
   - "Edit in Editor" button to open drawer with pre-filled SQL
   - Conversation export (save chat history)

3. **Smart Defaults**
   - Generate initial SQL suggestions on component mount
   - Based on: selected sources, product definition, domain knowledge
   - Show in chat as "I noticed you selected X and Y. Would you like me to...?"

**Success Metrics**:
- 60%+ users complete Step 3 without opening editor
- 30% faster SQL generation (chat → validation)
- 80% user preference for new flow (survey)

**Technical Implementation**:
```typescript
// TiSQLEditorDrawer.tsx
export function TiSQLEditorDrawer({
  sql,
  onChange,
  onClose,
  mode = 'overlay'
}: TiSQLEditorDrawerProps) {
  const [localSQL, setLocalSQL] = useState(sql);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(localSQL !== sql);
  }, [localSQL, sql]);

  const handleSave = () => {
    onChange(localSQL);
    setHasChanges(false);
  };

  return (
    <Drawer open onClose={onClose} mode={mode}>
      <DrawerHeader>
        <DrawerTitle>SQL Editor</DrawerTitle>
        <DrawerActions>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DrawerActions>
      </DrawerHeader>
      <DrawerContent>
        <TiSQLEditor
          sql={localSQL}
          onChange={setLocalSQL}
          theme="dark"
        />
      </DrawerContent>
    </Drawer>
  );
}
```

### Phase 3: Enhanced Validation (Weeks 5-6)
**Goal**: Make data validation more prominent and actionable

**Deliverables**:
1. **Auto-Execution with Approval**
   - After AI generates SQL, show approval modal:
     ```
     ┌─────────────────────────────────────────┐
     │ ✨ SQL Generated                        │
     │                                          │
     │ I've created a query to [description].  │
     │ This will scan approximately 1.2M rows. │
     │                                          │
     │ [Preview SQL] [▶ Run Query] [✕ Cancel] │
     └─────────────────────────────────────────┘
     ```
   - User can preview SQL before execution
   - Auto-run with 3-second countdown (cancellable)

2. **Confidence Scoring**
   - Calculate confidence based on:
     - Trino validation success (40%)
     - Schema coverage (30%)
     - Query complexity (20%)
     - User modifications (10%)
   - Display: `95% Confidence - High` (green) or `60% Confidence - Medium` (yellow)
   - Show reasoning: "Based on successful validation and schema match"

3. **Visual SQL Diff**
   - When user modifies AI-suggested SQL
   - Show diff in editor drawer:
     ```
     - Original (AI):  SELECT customer_id, name
     + Your Changes:   SELECT customer_id, name, email
     ```
   - Helps user understand what they changed

4. **Real-Time Preview**
   - As user types in chat, show live table suggestions
   - "Scanning 3 tables that match 'customer'..."
   - Autocomplete for table/column names in natural language

**Success Metrics**:
- 95% user confidence in AI-generated SQL (survey)
- 70% reduction in validation errors
- 90% adoption of auto-run feature

**Technical Implementation**:
```typescript
// Confidence scoring algorithm
function calculateConfidence(
  validationResult: ValidationResult,
  schemaMatch: number,
  complexity: number,
  userModifications: number
): number {
  const weights = {
    validation: 0.4,
    schema: 0.3,
    complexity: 0.2,
    modifications: 0.1
  };

  const validationScore = validationResult.isValid ? 100 : 0;
  const complexityScore = Math.max(0, 100 - complexity * 10);
  const modificationScore = Math.max(0, 100 - userModifications * 5);

  return (
    weights.validation * validationScore +
    weights.schema * schemaMatch +
    weights.complexity * complexityScore +
    weights.modifications * modificationScore
  );
}
```

### Phase 4: dbt Project Generation (Weeks 7-8)
**Goal**: Full dbt project generation from chat interface

**Deliverables**:
1. **dbt Project Generator Service** (`lib/generators/dbt-project-generator.ts`)
   - Input: Product definition, selected sources, use case
   - Output: Full dbt project structure
   - Templates:
     - **Customer 360**: staging (customers, orders, support) → intermediate (enrichment) → marts (customer_ltv)
     - **Product Analytics**: staging (events, users, sessions) → intermediate (funnel) → marts (conversion_metrics)
     - **Financial Reporting**: staging (transactions, accounts) → intermediate (reconciliation) → marts (monthly_revenue)
     - **Marketing Attribution**: staging (campaigns, clicks, conversions) → intermediate (attribution) → marts (roi_analysis)

2. **File Tree Preview Component**
   - Visual representation of generated files
   - Expandable folder structure
   - File content preview on click
   - "Download ZIP" and "Continue with main.sql" options

3. **dbt Integration in Chat**
   - Add to smart suggestions: "Generate dbt project for this use case"
   - AI explains dbt structure before generation
   - User can customize: models to include, naming conventions, materialization strategy
   - Generated files include:
     - `dbt_project.yml`
     - `models/staging/*.sql`
     - `models/intermediate/*.sql`
     - `models/marts/*.sql`
     - `models/schema.yml` (with tests)
     - `README.md` (documentation)

4. **Template Library**
   - Searchable templates by industry, use case, complexity
   - Community-contributed templates (future)
   - Organization-specific templates (saved from past projects)

**Success Metrics**:
- 40%+ users choose dbt project over custom SQL
- dbt projects pass `dbt compile` without errors (98%+)
- 5x faster dbt project creation (2 hours → 25 minutes)

**Technical Implementation**:
```typescript
// lib/generators/dbt-project-generator.ts
export async function generateDBTProject(
  productName: string,
  sources: Source[],
  template: DBTTemplate
): Promise<DBTProject> {
  const project: DBTProject = {
    name: productName,
    version: '1.0.0',
    profile: 'default',
    models: [],
    tests: [],
    docs: []
  };

  // Generate staging models (one per source)
  for (const source of sources) {
    const stagingModel = generateStagingModel(source, template);
    project.models.push(stagingModel);
  }

  // Generate intermediate models (business logic)
  const intermediateModels = generateIntermediateModels(sources, template);
  project.models.push(...intermediateModels);

  // Generate marts (final outputs)
  const martsModels = generateMartsModels(template);
  project.models.push(...martsModels);

  // Generate tests based on template
  project.tests = generateTests(project.models, template);

  // Generate documentation
  project.docs.push(generateREADME(project));
  project.docs.push(generateSchemaYML(project.models));

  return project;
}

function generateStagingModel(source: Source, template: DBTTemplate): DBTModel {
  return {
    name: `stg_${source.name}`,
    sql: `
{{
  config(
    materialized='view',
    tags=['staging', '${template.domain}']
  )
}}

WITH source AS (
  SELECT * FROM {{ source('${source.schema}', '${source.name}') }}
),

renamed AS (
  SELECT
    ${source.columns.map(c => `${c.name}`).join(',\n    ')}
  FROM source
)

SELECT * FROM renamed
    `.trim(),
    description: `Staging model for ${source.name}`,
    columns: source.columns.map(c => ({
      name: c.name,
      type: c.type,
      description: c.description
    }))
  };
}
```

---

## Technical Architecture

### Component Hierarchy
```
Step3ConversationalSQL.tsx (new)
├── Header
│   ├── ProductContextBreadcrumb
│   ├── RunQueryButton (auto-execute with approval)
│   ├── AnalyzeButton (Trino EXPLAIN)
│   └── ContinueButton
├── LeftPanel (40%)
│   ├── TiSQLAgentChat.tsx (existing)
│   │   ├── SmartSuggestions (based on sources)
│   │   ├── ConversationHistory
│   │   ├── NaturalLanguageInput
│   │   ├── SQLGeneration (CopilotKit)
│   │   └── DBTProjectGeneration (new)
│   └── ExpandEditorButton
├── RightPanel (60%)
│   └── TiSQLResultsPanel.tsx (existing)
│       ├── ResultsTab (live query results)
│       ├── ValidationTab (Trino errors/warnings)
│       ├── OptimizationTab (EXPLAIN insights)
│       ├── LineageTab (query dependencies)
│       └── HistoryTab (query versions)
└── TiSQLEditorDrawer.tsx (new, conditional)
    ├── DrawerHeader
    │   ├── Title
    │   ├── SaveButton
    │   └── CloseButton
    ├── DrawerContent
    │   └── TiSQLEditor.tsx (existing)
    │       ├── tiSQL extensions (autocomplete, gutter, save)
    │       ├── Syntax highlighting
    │       └── Real-time validation
    └── DrawerFooter
        ├── SendToChatButton
        └── ModeToggle (overlay/split-screen)
```

### Data Flow Architecture
```
User Input (Chat)
  ↓
CopilotKit Processing
  ↓
SQL Generation
  ↓
Auto-Validation (Trino)
  ↓
Confidence Scoring
  ↓
Approval Modal (if low confidence)
  ↓
User Approves
  ↓
Auto-Execute (Trino)
  ↓
Results Display (right panel)
  ↓
User Validates Data
  ↓
Refinement Loop (if needed):
  - Modify in Chat → Regenerate SQL
  - OR Open Editor → Manual Edit
  ↓
Continue to Step 4
```

### API Endpoints (Existing - Reuse)
All endpoints already implemented in Priority 1:

- **`/api/v1/trino/validate`**
  - Fast EXPLAIN-based validation (~120ms)
  - Returns: `{ valid, errors, warnings, estimated_cost }`

- **`/api/v1/trino/execute`**
  - Query execution with LIMIT safety
  - Returns: `{ success, columns, rows, row_count, execution_time_ms, bytes_processed }`

- **`/api/v1/trino/analyze`**
  - Comprehensive EXPLAIN analysis
  - Returns: `{ valid, performance_insights, optimization_suggestions, execution_plan }`

- **`/api/v1/trino/validate-and-execute`** (Primary)
  - Combined validation + execution
  - Returns: `{ success, validation: {...}, execution: {...} }`

**No backend changes required!**

### State Management
```typescript
// Step3ConversationalSQL state
interface Step3State {
  sql: string;                    // Current SQL query
  conversationHistory: Message[]; // Chat messages
  validationResult: ValidationResult | null;
  testResult: TestResult | null;
  analysisResult: QueryAnalysisResult | null;
  editorOpen: boolean;            // Editor drawer state
  editorMode: 'overlay' | 'split-screen';
  confidence: number;             // 0-100
  dbtProject: DBTProject | null;  // Generated dbt files
}

// Persistence
- Save draft SQL to localStorage on change
- Restore draft on component mount
- Clear draft on Step 4 continue
- Save conversation history for learning
```

---

## Migration Strategy

### Backward Compatibility

**Feature Flag Approach**:
```typescript
// app/(main)/build/page.tsx
const ENABLE_CONVERSATIONAL_SQL = process.env.NEXT_PUBLIC_ENABLE_CONVERSATIONAL_SQL === 'true';

function BuildWorkflow() {
  // ... other steps

  const renderStep3 = () => {
    if (ENABLE_CONVERSATIONAL_SQL) {
      return (
        <Step3ConversationalSQL
          productDefinition={step1Data.definition}
          selectedSources={step2Data.sources}
          schema={step2Data.schema}
          onComplete={(data) => handleStepComplete(3, data)}
          onBack={() => setCurrentStep(2)}
        />
      );
    } else {
      return (
        <Step3WriteSQL
          selectedSources={step2Data.sources}
          contractSchema={step2Data.schema}
          onComplete={(data) => handleStepComplete(3, data)}
          onBack={() => setCurrentStep(2)}
        />
      );
    }
  };

  // ... render steps
}
```

**Gradual Rollout**:
1. **Week 1**: Internal team (10 users)
2. **Week 2**: Beta users (50 users)
3. **Week 3-4**: 25% of production users
4. **Week 5-6**: 50% of production users
5. **Week 7-8**: 100% of production users

**Fallback Mechanism**:
- Add "Switch to Classic Editor" button in header
- Preserves SQL and state when switching
- Logs preference for analytics

### User Onboarding

**First-Time Experience**:
```
┌─────────────────────────────────────────────────────────┐
│ 👋 Welcome to Conversation-Driven SQL Development!     │
│                                                          │
│ Here's how it works:                                    │
│                                                          │
│ 1. Describe what you need in plain English ←──┐        │
│    "Show me customers who churned"              │        │
│                                                 │        │
│ 2. AI generates SQL and validates it           │        │
│                                                 │        │
│ 3. Review results instantly in the preview ────┘        │
│                                                          │
│ 4. Refine in chat or open the editor for manual edits  │
│                                                          │
│ [Start Tutorial] [Skip - I'll explore myself]          │
└─────────────────────────────────────────────────────────┘
```

**Interactive Tutorial** (Phases 1-2):
- Step 1: Type a question in chat
- Step 2: See AI generate SQL
- Step 3: Review results
- Step 4: Try expanding the editor
- Step 5: Continue to next step

**Help Resources**:
- "What can I ask?" examples in chat empty state
- Tooltips on first hover
- Video walkthrough in docs
- In-app help button with context-sensitive content

### Testing Plan

**Unit Tests**:
```typescript
// __tests__/Step3ConversationalSQL.test.tsx
describe('Step3ConversationalSQL', () => {
  it('renders AI chat and results panels', () => {
    render(<Step3ConversationalSQL {...props} />);
    expect(screen.getByText('AI Agent Chat')).toBeInTheDocument();
    expect(screen.getByText('Data Validation & Results')).toBeInTheDocument();
  });

  it('generates SQL when user sends message', async () => {
    const { getByPlaceholderText, getByText } = render(<Step3ConversationalSQL {...props} />);
    const input = getByPlaceholderText('Ask about SQL, tables, or optimizations...');

    fireEvent.change(input, { target: { value: 'Show me all customers' } });
    fireEvent.submit(input);

    await waitFor(() => {
      expect(getByText(/SELECT \* FROM customers/)).toBeInTheDocument();
    });
  });

  it('opens editor drawer when expand button clicked', () => {
    const { getByText } = render(<Step3ConversationalSQL {...props} />);
    fireEvent.click(getByText('🔧 Expand SQL Editor'));

    expect(screen.getByText('SQL Editor')).toBeInTheDocument();
  });

  it('preserves SQL state when switching between chat and editor', () => {
    // Test state preservation
  });

  it('calculates confidence score correctly', () => {
    const confidence = calculateConfidence(
      { isValid: true, errors: [], warnings: [] },
      95, // schema match
      3,  // complexity
      0   // user modifications
    );
    expect(confidence).toBeGreaterThan(90);
  });
});
```

**Integration Tests** (with Trino):
```typescript
// __tests__/integration/Step3TrinoIntegration.test.tsx
describe('Step 3 Trino Integration', () => {
  it('validates SQL with real Trino endpoint', async () => {
    const sql = 'SELECT * FROM customers LIMIT 10';
    const result = await validateSQL(sql);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('executes query and returns results', async () => {
    const sql = 'SELECT customer_id, name FROM customers LIMIT 5';
    const result = await executeQuery(sql);

    expect(result.success).toBe(true);
    expect(result.row_count).toBe(5);
    expect(result.rows).toHaveLength(5);
  });

  it('handles SQL errors gracefully', async () => {
    const sql = 'SELECT * FROM nonexistent_table';
    const result = await executeQuery(sql);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Table not found');
  });
});
```

**User Testing** (10 users, Phases 1-2):
- **Recruitment**: 10 users (5 beginner, 3 intermediate, 2 advanced)
- **Tasks**:
  1. Create a query to find top 10 customers by revenue
  2. Add filtering for last 30 days
  3. Export query to dbt project
- **Metrics**:
  - Task completion time
  - Number of errors
  - Chat vs editor usage ratio
  - Confidence in final SQL (survey)
- **Recording**: Hotjar or FullStory session recording
- **Iteration**: Address top 3 pain points before next phase

**Performance Testing**:
```typescript
// Performance benchmarks
describe('Step 3 Performance', () => {
  it('chat response time < 2 seconds', async () => {
    const start = Date.now();
    await sendMessage('Show me all customers');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
  });

  it('Trino validation < 500ms', async () => {
    const start = Date.now();
    await validateSQL('SELECT * FROM customers');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });

  it('query execution < 5 seconds for 100 rows', async () => {
    const start = Date.now();
    await executeQuery('SELECT * FROM customers LIMIT 100');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });
});
```

---

## Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **AI generates invalid SQL** | Medium | High | • Real Trino validation before showing results<br>• Confidence scoring<br>• Approval modal for low confidence |
| **Performance degradation** | Low | Medium | • Auto-execution with user approval<br>• Cancellable queries<br>• Query timeout (5s default) |
| **Complex queries too hard for AI** | Medium | Medium | • Editor drawer always available<br>• "Send to Editor" button for manual refinement<br>• Templates for common patterns |
| **Loss of existing features** | Low | High | • Maintain feature parity with old Step3WriteSQL<br>• Feature flag for rollback<br>• Backward compatibility testing |
| **State loss when switching views** | Medium | Low | • State preservation in drawer<br>• localStorage draft persistence<br>• Clear "unsaved changes" warnings |

### UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Users miss manual editor** | High | Medium | • Prominent "Expand Editor" button<br>• Split-screen mode for power users<br>• Keyboard shortcut (⌘E) |
| **AI suggestions not helpful** | Medium | High | • Smart suggestions based on context<br>• Template library for common use cases<br>• Fallback to editor |
| **Results panel too cluttered** | Low | Low | • Tabbed interface for results/validation/optimization<br>• Collapsible sections<br>• Clear visual hierarchy |
| **Cognitive overload from 2 panels** | Low | Medium | • Clear separation of concerns (chat vs results)<br>• Progressive disclosure (advanced features hidden)<br>• Onboarding tutorial |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **User resistance to AI** | Medium | High | • Optional AI assistance (editor always available)<br>• Gradual rollout with feedback loops<br>• Clear value proposition (time savings) |
| **Over-reliance on AI** | Low | Medium | • Confidence scoring to indicate uncertainty<br>• Encourage validation of results<br>• Education on AI limitations |
| **Training cost** | Low | Low | • Interactive tutorial<br>• "What can I ask?" examples<br>• Video walkthrough |

---

## Success Criteria

### Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Step 3 Completion Rate** | 60% | 80% | Analytics: users completing Step 3 / entering Step 3 |
| **Average Time in Step 3** | 30 min | 10 min | Analytics: timestamp(step4_start) - timestamp(step3_start) |
| **SQL Generation Time** | 15-20 min | 2-3 min | User testing: time from blank to valid SQL |
| **Validation Errors** | 40% | 12% | Analytics: queries with errors / total queries |
| **Editor Usage** | 100% | 40% | Analytics: users opening editor / total users |
| **User Confidence** | 60% | 95% | Survey: "How confident are you in the generated SQL?" (1-5 scale) |
| **dbt Project Adoption** | 0% | 40% | Analytics: dbt projects generated / total Step 3 completions |

### Qualitative Feedback (Survey)

**Phase 1 (Hybrid Mode)**:
- [ ] "The AI chat made it easier to get started" (80%+ agreement)
- [ ] "I felt less overwhelmed than with the blank editor" (70%+ agreement)
- [ ] "I still want access to the manual editor" (60%+ agreement)

**Phase 2 (Chat-First)**:
- [ ] "I rarely need to open the editor anymore" (60%+ agreement)
- [ ] "Seeing results immediately builds my confidence" (90%+ agreement)
- [ ] "The split-screen mode is helpful for complex queries" (50%+ agreement)

**Phase 3 (Enhanced Validation)**:
- [ ] "I trust the AI because I can validate the results" (95%+ agreement)
- [ ] "The confidence score helps me know when to review manually" (85%+ agreement)
- [ ] "Auto-execution saves me time" (90%+ agreement)

**Phase 4 (dbt Projects)**:
- [ ] "Generating a dbt project saved me hours of work" (95%+ agreement)
- [ ] "The generated dbt structure follows best practices" (90%+ agreement)
- [ ] "I would use this for future dbt projects" (85%+ agreement)

### Technical Success Criteria

**Performance**:
- [ ] Chat response time < 2 seconds (p95)
- [ ] Trino validation < 500ms (p95)
- [ ] Query execution < 5 seconds for 100 rows (p95)
- [ ] Editor drawer opens < 100ms
- [ ] No memory leaks after 1 hour of usage

**Reliability**:
- [ ] 99.5% uptime for Trino endpoints
- [ ] 0 critical bugs in production after 2 weeks
- [ ] < 5% error rate for AI SQL generation
- [ ] 100% feature parity with old Step3WriteSQL

**Accessibility**:
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation (⌘E, ⌘↵, ⌘S, Esc)
- [ ] Screen reader support for chat and results
- [ ] High contrast mode support

---

## Documentation & Training

### User Documentation

**Getting Started Guide** (`docs/user-guide/step3-conversation-sql.md`):
```markdown
# Step 3: Conversation-Driven SQL Development

## Overview
Step 3 has been redesigned to make SQL development feel like a conversation
with an expert. Instead of starting with a blank editor, you describe what
you need in plain English, and the AI generates SQL for you.

## How It Works

1. **Describe Your Need**
   Type in the chat: "Show me customers who haven't ordered in 90 days"

2. **AI Generates SQL**
   The AI creates a query based on your selected sources and validates it
   with Trino.

3. **Review Results Immediately**
   Query results appear in the right panel. No need to click "Run" - it
   happens automatically (with your approval).

4. **Refine or Continue**
   - **Satisfied?** Click "Continue to Quality Rules"
   - **Need changes?** Ask the AI: "Can you add their email addresses?"
   - **Need manual control?** Click "Expand SQL Editor" for full control

## Common Questions

**"I'm an advanced SQL user. Do I have to use the chat?"**
No! Click "Expand SQL Editor" to jump straight to the full SQL editor with
all advanced features (autocomplete, syntax highlighting, etc.).

**"What if the AI generates wrong SQL?"**
Every query is validated with real Trino before execution. You'll see
errors/warnings before any data is processed. Plus, the confidence score
helps you know when to review manually.

**"Can I see the SQL the AI generated?"**
Yes! The SQL is shown in the chat conversation. You can click "View SQL"
to see the full query, or "Edit in Editor" to modify it manually.
```

**Video Walkthrough** (2-3 minutes):
- Introduction to conversation-driven SQL (30s)
- Demo: Create a customer churn query in 60 seconds (1m)
- Advanced features: Editor drawer, dbt projects (1m)
- Tips and tricks (30s)

### Developer Documentation

**Architecture Guide** (`docs/dev/step3-architecture.md`):
```markdown
# Step 3 Architecture: Conversation-Driven SQL

## Component Hierarchy
[Insert diagram from Technical Architecture section]

## Data Flow
[Insert data flow from Technical Architecture section]

## API Integration
- Uses existing Trino endpoints (no backend changes)
- CopilotKit for AI chat (see copilot/context.ts)
- State management via React hooks + localStorage

## Adding New Features

### Adding a New dbt Template
1. Create template in `lib/generators/dbt-templates/`
2. Register in `lib/generators/dbt-project-generator.ts`
3. Add to chat suggestions in `TiSQLAgentChat.tsx`

### Modifying Confidence Scoring
Edit `lib/utils/confidence-scoring.ts` with new weights or factors.
```

---

## Appendix

### Appendix A: Competitive Analysis

| Tool | Pattern | AI Visibility | Results Visibility | Editor | Our Differentiation |
|------|---------|---------------|-------------------|--------|---------------------|
| **Cursor** | Code + Chat | Always (sidebar) | Inline | Primary | We have data preview |
| **GitHub Copilot** | Editor + Chat | Always (panel) | N/A | Primary | We have Trino validation |
| **ChatGPT Code** | Chat + Results | Always (main) | Always | Secondary | Closest match |
| **Mode Analytics** | Editor-first | Hidden | After run | Primary | We have AI chat |
| **Looker** | LookML editor | None | After run | Primary | We have conversation |
| **NexusOne (current)** | Editor-first | Hidden (toggle) | Collapsible | Primary | **NEW: Conversation-first!** |

### Appendix B: User Research Quotes (from previous sessions)

**Pain Points with Current Step 3**:
> "I stare at the blank editor for 10 minutes before I start typing." - Beginner User

> "I wish I could just tell the system what I want instead of figuring out the SQL syntax." - Intermediate User

> "The editor is great, but I rarely use advanced features. I just need simple queries." - 60% of users

> "I don't trust the AI-generated SQL because I can't see the results until I run it manually." - Advanced User

**Desires**:
> "I want to see results immediately so I know if the query is doing what I expect." - 85% of users

> "It would be amazing if I could just describe what I need and the system generates it." - 90% of users

> "I need the editor for complex queries, but for simple stuff, a chat would be faster." - 70% of users

### Appendix C: Design Mockups

**Figma Links** (placeholder):
- [Step3ConversationalSQL - Main Layout](#)
- [TiSQLEditorDrawer - Overlay Mode](#)
- [TiSQLEditorDrawer - Split-Screen Mode](#)
- [dbt Project File Tree Preview](#)
- [Confidence Score Display](#)

### Appendix D: Related Documentation

- **Priority 1 Implementation**: `STEP3_REAL_TRINO_VALIDATION_IMPLEMENTATION.md`
- **Policy Movement**: `STEP_WORKFLOW_FIXES_PLAN.md`
- **Build Flow Overview**: `BUILD_FLOW_CONTEXT_ARCHITECTURE.md`
- **Living Context Graph**: `LIVING_CONTEXT_GRAPH_ARCHITECTURE.md`

---

**Document Version**: 1.0
**Last Updated**: October 16, 2025
**Status**: Approved for Implementation
**Next Review**: After Phase 1 completion (Week 2)
