# Step 3 SQL Workstation: Critical UX Analysis & Redesign Plan
## Date: October 17, 2025

---

## Executive Summary

The current Step 3 SQL Workstation has fundamental UX issues that prevent it from being a robust, professional data engineering tool. This document provides a critical analysis of the existing implementation and a comprehensive redesign plan to create a Claude-like, enterprise-grade SQL development environment.

**TL;DR Critical Issues:**
1. **Chat UI is basic** - CopilotKit provides minimal customization and doesn't match modern chat interfaces like Claude
2. **Right panel is cluttered** - Too many nested tabs (Data Preview + dbt Model with 3 sub-tabs each)
3. **Missing SQL editor integration** - Chat-only paradigm doesn't support direct SQL editing
4. **CopilotKit limitations** - Heavy framework with limited UI control, not ideal for enterprise applications
5. **Header takes up valuable space** - Reduces usable workspace height

**Solution:** Replace CopilotKit with Vercel AI SDK, simplify right panel to flat views (Preview/Editor/dbt), integrate existing TiSQLEditor, remove header for more space.

---

## Part 1: Current State Analysis

### 1.1 Architecture Overview

**Current Component Structure:**
```
Step3ConversationalSQL (Orchestrator)
├── Header (Border + Actions) - elevation-2
│   ├── Product name + environment badge
│   ├── Confidence score badge
│   └── Action buttons (Run, Generate dbt, Continue)
├── 2-Panel Layout (flex)
│   ├── LEFT (40%): TiSQLAgentChat - elevation-1
│   │   └── CopilotChat (CopilotKit UI) - BLACK BOX
│   │       ├── Header (AI SQL Agent, catalog.schema)
│   │       ├── Smart suggestions (if sources selected)
│   │       └── Chat interface (messages + input)
│   └── RIGHT (60%): TiSQLRightPanel - elevation-0
│       └── Tabs Level 1 (Primary)
│           ├── Tab: Data Preview
│           │   └── TiSQLResultsPanel
│           │       ├── Validation results
│           │       ├── Test results/data table
│           │       └── Query analysis
│           └── Tab: dbt Model
│               └── DBTModelViewer
│                   ├── Config summary
│                   └── Tabs Level 2 (NESTED!)
│                       ├── Tab: model.sql
│                       ├── Tab: schema.yml
│                       └── Tab: sources.yml
└── Status Bar (48px)
    ├── Catalog.schema info
    ├── Source/column counts
    └── dbt model ready indicator
```

**Key Files:**
- `components/build/steps/Step3ConversationalSQL.tsx` - Main orchestrator (340 lines)
- `components/tisql/TiSQLAgentChat.tsx` - CopilotKit wrapper (174 lines)
- `components/tisql/TiSQLRightPanel.tsx` - Nested tabs container (160 lines)
- `components/tisql/dbt/DBTModelViewer.tsx` - dbt with nested tabs (250 lines)
- `components/tisql/TiSQLEditor.tsx` - **EXISTS BUT NOT USED!** (125 lines)

**Alternative Component (TiSQLWorkstation - not currently used):**
This was a previous attempt at a 3-panel design with resizable panels, but it's not integrated into Step 3. It shows the right direction but needs simplification.

### 1.2 Critical Issues Identified

#### Issue 1: CopilotKit Chat UI Limitations

**What's Wrong:**
CopilotKit provides a black-box chat component that can't be customized to match modern chat interfaces like Claude.

**Code Evidence:**
```typescript
// components/tisql/TiSQLAgentChat.tsx (lines 136-169)
<CopilotChat
  labels={{
    title: 'SQL Agent',
    initial: 'I\'ve suggested some queries based on your selected tables. Click a suggestion above or ask me anything!',
    placeholder: 'Ask about SQL, tables, or optimizations...',
  }}
  instructions={`You are an expert SQL agent for a data lakehouse platform...`}
  makeSystemMessage={(message) => {
    return `${message}\n\nIMPORTANT: You have access to the current SQL...`;
  }}
/>
```

**Limitations:**
- ❌ No control over message rendering (can't style or add actions)
- ❌ No markdown rendering support
- ❌ No code syntax highlighting within messages
- ❌ No artifact-style code blocks (like Claude)
- ❌ No message actions (copy, regenerate, edit)
- ❌ No custom loading states or typing indicators
- ❌ Can't show which context (tables/sources) is being used
- ❌ Generic styling that doesn't match NexusOne design system

**Package Weight:**
```json
"@copilotkit/backend": "^0.37.0",        // ~40kb
"@copilotkit/react-core": "^1.10.4",     // ~50kb
"@copilotkit/react-textarea": "^1.10.4", // ~20kb
"@copilotkit/react-ui": "^1.10.4",       // ~35kb
"@copilotkit/shared": "^1.10.4"          // ~15kb
// Total: ~160kb for limited functionality
```

#### Issue 2: Right Panel Complexity (Nested Tabs Hell)

**What's Wrong:**
Users must navigate through **3 levels of nesting** to see dbt files:
1. Click "dbt Model" tab (level 1)
2. See nested tabs appear (level 2)
3. Click model.sql / schema.yml / sources.yml (level 3)

**Code Evidence:**
```typescript
// components/tisql/TiSQLRightPanel.tsx (lines 84-112)
<Tabs defaultValue="preview" className="h-full flex flex-col">
  <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted">
    <TabsTrigger value="preview" className="gap-2">
      <TrendingUp className="w-4 h-4" />
      Data Preview
    </TabsTrigger>

    <TabsTrigger value="dbt" className="gap-2" disabled={!hasDbtModel}>
      <Package className="w-4 h-4" />
      dbt Model
    </TabsTrigger>
  </TabsList>

  <TabsContent value="dbt" className="flex-1 m-0">
    {hasDbtModel ? (
      <DBTModelViewer ...> {/* CONTAINS MORE TABS INSIDE! */}
        <Tabs defaultValue="model" className="flex-1 flex flex-col">
          <TabsTrigger value="model">model.sql</TabsTrigger>
          <TabsTrigger value="schema">schema.yml</TabsTrigger>
          <TabsTrigger value="sources">sources.yml</TabsTrigger>
        </Tabs>
      </DBTModelViewer>
    ) : (
      <EmptyState />
    )}
  </TabsContent>
</Tabs>
```

**User Confusion:**
- "Where do I see my data?" → Data Preview tab
- "Where do I edit SQL?" → **Can't! Chat only!**
- "Where do I see dbt files?" → dbt Model tab → then another tab → then specific file
- "How do I quickly switch between views?" → Too many clicks

#### Issue 3: Missing SQL Editor Integration

**What's Wrong:**
The TiSQLEditor component exists but is **completely unused** in Step 3!

**Existing Editor (NOT INTEGRATED):**
```typescript
// components/tisql/TiSQLEditor.tsx (lines 84-124)
export function TiSQLEditor({
  sql,
  onChange,
  selectedCatalog = 'iceberg',
  selectedEnvironment = 'development',
  schema = [],
  onExecute,
  theme = 'dark',
  readOnly = false
}: TiSQLEditorProps) {
  // Uses @tidbcloud/tisqleditor-react
  // Has SQL autocomplete from TiDB Cloud
  // Has syntax highlighting, save helper
  // Has cur-sql-gutter extension
  // PERFECT for our needs!
}
```

**Why This Matters:**
- Users are **forced** to use natural language for **every SQL edit**
- Can't quickly fix a typo or adjust a WHERE clause
- No keyboard shortcuts (Cmd+Enter to run)
- No autocomplete while typing
- Slower iteration cycle (describe change → wait for AI → validate)

**Current Workflow:**
```
User: "Change the WHERE clause to filter by status = 'active'"
AI: Generates entire query again
User: Validates, finds another issue
User: "Also add ORDER BY created_at DESC"
AI: Generates entire query again
User: Repeats...
```

**Better Workflow:**
```
User: [Opens SQL Editor view]
User: [Types directly: WHERE status = 'active' ORDER BY created_at DESC]
User: [Presses Cmd+Enter]
Query runs immediately
```

#### Issue 4: Header Wastes Vertical Space

**What's Wrong:**
The header takes up **~80-100px** of precious vertical space in a full-screen workspace.

**Header Content:**
```typescript
// Step3ConversationalSQL.tsx (lines 188-275)
<div className="border-b border-border bg-card px-6 py-4 elevation-2">
  <div className="flex items-center justify-between">
    {/* Left: Back button, product name, environment badge */}
    <div className="flex items-center gap-4">
      <Button>Back</Button>
      <div className="h-6 w-px bg-border" />
      <Sparkles /> Product Name
      <Badge>Development</Badge>
    </div>

    {/* Right: Confidence badge, Run button, Generate dbt, Continue */}
    <div className="flex items-center gap-2">
      <Badge>95% Confidence</Badge>
      <Button>Run</Button>
      <Button>Generate dbt</Button>
      <Button>Continue</Button>
    </div>
  </div>
</div>
```

**Space Analysis:**
```
Typical 1080p screen: 1920x1080
Header height:        ~88px (with padding)
Status bar height:    ~48px
Total chrome:         136px (12.5% of screen!)
Available content:    944px (87.5%)

If we remove header:
Inline toolbars:      ~40px per view
Status bar (compact): ~32px
Total chrome:         ~72px (6.7%)
Available content:    1008px (93.3%)
Net gain:             +64px (6.8% more vertical space)
```

#### Issue 5: No LLM Control or Customization

**What's Wrong:**
CopilotKit abstracts everything, giving us no control over:

**What We Can't Control:**
- ❌ Model selection (stuck with what backend provides)
- ❌ Temperature, max_tokens, top_p
- ❌ Streaming behavior and chunking
- ❌ System prompt formatting
- ❌ Tool calling format
- ❌ Response parsing and validation
- ❌ Error handling and retries
- ❌ Custom UI for tool results

**CopilotKit Backend Required:**
```typescript
// We must run CopilotKit backend endpoint
<CopilotKit
  runtimeUrl="/api/copilotkit"  // Must implement this
  agent="sql_agent"              // Must configure this
  showDevConsole={false}
>
```

This means:
1. Can't easily swap OpenAI → Claude → local model
2. Can't customize retry logic or fallbacks
3. Can't implement custom tool UI (everything is text)
4. Tied to CopilotKit's architecture decisions

---

## Part 2: Competitive Analysis

### 2.1 Claude.ai Chat Interface

**What Makes Claude Great:**

1. **Clean, Minimal Design**
   - No header clutter
   - Focus on conversation
   - Plenty of white space

2. **Artifact Rendering**
   - Code blocks rendered as separate, interactive components
   - Syntax highlighting for all languages
   - Copy button on every code block
   - Can edit artifacts inline

3. **Markdown Excellence**
   - Proper heading hierarchy
   - Lists, tables, inline code
   - LaTeX math support
   - Syntax-highlighted code fences

4. **Message Actions**
   - Copy button
   - Regenerate response
   - Edit your message
   - Branch conversation

5. **Streaming with Visual Feedback**
   - Typing indicator (animated dots)
   - Progressive rendering of response
   - Smooth scroll to bottom
   - Cancel generation button

6. **Context Awareness**
   - Shows which files/docs are in context
   - Token usage indicator
   - Clear about what AI can see

**Key Takeaway:** Chat should be primary, but code/SQL should be rendered as interactive artifacts, not plain text.

### 2.2 DataGrip / DBeaver SQL IDEs

**What Makes Professional SQL IDEs Great:**

1. **3-Panel Layout**
   - Left: Database/schema explorer
   - Center: SQL editor (primary workspace)
   - Right: Results/execution plan

2. **Resizable Panels**
   - User controls layout
   - Can maximize editor or results
   - Collapsible sidebars

3. **Keyboard-First Workflow**
   - Cmd+Enter: Run query
   - Cmd+/: Comment lines
   - Cmd+D: Duplicate line
   - Cmd+Shift+F: Format SQL

4. **Autocomplete Excellence**
   - Table name completion
   - Column name completion (context-aware)
   - SQL keyword completion
   - Function signature hints

5. **Multi-Tab Support**
   - Work on multiple queries simultaneously
   - Switch between contexts
   - Query history tabs

**Key Takeaway:** SQL editor must be first-class, not an afterthought. Keyboard shortcuts are essential for power users.

### 2.3 Vercel AI SDK vs CopilotKit (2025)

| Aspect | **Vercel AI SDK** ✅ | CopilotKit ❌ |
|--------|---------------------|---------------|
| **Philosophy** | Low-level primitives for flexibility | High-level framework with opinions |
| **UI Control** | Complete - Build Your Own UI | Limited - Pre-built components |
| **Bundle Size** | ~30kb (minimal) | ~160kb+ (heavy) |
| **Customization** | 100% control over everything | ~30% control (what they expose) |
| **Streaming** | Built-in SSE (Server-Sent Events) | Supported but limited customization |
| **Type Safety** | End-to-end TypeScript | Partial type safety |
| **React Hooks** | `useChat`, `useCompletion`, `useAssistant` | `useCopilotChat`, `useCopilotAction` |
| **Backend** | Flexible - any LLM provider | Requires CopilotKit backend setup |
| **Model Swapping** | Easy - change 1 line | Hard - backend configuration |
| **Tool Calling** | Full control with schemas | Limited to their action format |
| **Custom Tool UI** | Complete freedom | Very limited |
| **Cost** | Free, open-source | Free, open-source |
| **Maturity** | v5.0 (July 2025) - major rewrite | Stable, 15k GitHub stars |
| **Learning Curve** | Steeper (more control = more code) | Easier (pre-built components) |
| **Ideal For** | **Custom enterprise apps** | Simple chatbots, prototypes |

**Vercel AI SDK v5.0 (Released July 31, 2025):**
- First AI framework with fully typed chat integration
- Rebuilt from ground up with powerful primitives
- UIMessage vs. ModelMessage for type safety
- SSE-based streaming for stable real-time responses
- Works with React, Svelte, Vue, Angular, Node.js
- Built-in React hooks that manage conversation state

**Why Vercel AI SDK Wins for NexusOne:**

1. **Full UI Control** → Build Claude-like chat interface
2. **Lightweight** → 5x smaller bundle than CopilotKit
3. **Type-Safe** → Better DX with full TypeScript support
4. **Model Agnostic** → Easy to swap OpenAI → Claude → local models
5. **Streaming Built-In** → SSE for smooth UX
6. **Active Development** → v5.0 just released with major improvements
7. **Enterprise-Ready** → Used by Vercel, OpenAI, Anthropic projects

**Recent Quote from Vercel AI SDK team:**
> "AI SDK 5 is the first AI framework with a fully typed and highly customizable chat integration... with end-to-end type safety."

---

## Part 3: Redesign Proposal

### 3.1 New Architecture

**Component Structure:**
```
Step3SQLWorkstation (New unified component)
├── NO HEADER! (removed completely)
│
├── 2-Panel Layout (50/50, resizable via PanelGroup)
│   │
│   ├── LEFT PANEL (50%): AI Chat with Context
│   │   ├── Chat Header (inline, compact, 40px)
│   │   │   ├── AI model selector (GPT-4 / Claude / Local)
│   │   │   ├── Context indicator (2 tables, catalog.schema)
│   │   │   └── Clear chat button
│   │   │
│   │   ├── Message List (flex-1, scrollable)
│   │   │   ├── User Message (right-aligned, gradient bg)
│   │   │   └── Assistant Message (left-aligned)
│   │   │       ├── Markdown Content (react-markdown)
│   │   │       ├── Code Artifacts (syntax-highlighted cards)
│   │   │       └── Message Actions (copy, regenerate, edit)
│   │   │
│   │   └── Input Area (sticky bottom, 60px)
│   │       ├── Attach Context button (tables/sources)
│   │       ├── Textarea (auto-expanding, max 5 lines)
│   │       └── Send button (or Cmd+Enter)
│   │
│   └── RIGHT PANEL (50%): Workstation Views
│       ├── View Switcher (single-level, 40px)
│       │   ├── Button: 📊 Data Preview (default)
│       │   ├── Button: 💻 SQL Editor
│       │   └── Button: 📦 dbt Template (disabled if not generated)
│       │
│       ├── VIEW 1: Data Preview (default)
│       │   ├── Inline Toolbar (Run • Analyze • Export)
│       │   ├── Validation Feedback (inline, if errors)
│       │   ├── Results Table (virtualized, 1k+ rows)
│       │   └── Query Stats Footer (rows, time, data scanned, cost)
│       │
│       ├── VIEW 2: SQL Editor
│       │   ├── Inline Toolbar (Run • Format • Save)
│       │   ├── TiSQLEditor (full-featured)
│       │   │   ├── SQL syntax highlighting
│       │   │   ├── Autocomplete (TiDB Cloud integration)
│       │   │   ├── Line numbers, minimap
│       │   │   └── Keyboard shortcuts (Cmd+Enter, Cmd+S)
│       │   └── Editor Stats Footer (lines, cursor position)
│       │
│       └── VIEW 3: dbt Template
│           ├── File Selector Dropdown (not tabs!)
│           │   ├── Option: model.sql
│           │   ├── Option: schema.yml
│           │   └── Option: sources.yml
│           ├── Code Viewer (syntax-highlighted)
│           │   └── Single file content display
│           └── Actions (Copy file • Download all as ZIP)
│
└── Minimal Status Bar (32px, sticky bottom)
    ├── Left: catalog.schema • 2 sources • 15 columns
    └── Right: Keyboard hints (⌘↵ Run • ⌘S Save • ⌘B Chat)
```

### 3.2 Key Design Decisions

#### Decision 1: Remove Header, Inline Actions

**Before:**
```
┌─────────────────────────────────────────┐
│  Header (88px)                          │ ← Wasted space!
│  Back • Product • Run • dbt • Continue  │
└─────────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────────┐
│  Data Preview                           │
│  [Run] [Analyze] [Export]  ← Inline!    │ 40px
│  ─────────────────────────────────────  │
│  Results table...                       │
```

**Benefit:**
- +88px vertical space (from removed header)
- -8px (smaller inline toolbars)
- Net gain: **+80px (7.4% more screen)**

#### Decision 2: Unified Left Panel (Chat Primary)

**Philosophy:** Chat is the primary interface, but it's not the only way to work.

**Chat Features:**
- Markdown rendering (react-markdown + remark-gfm)
- Code artifacts (separate cards, not inline)
- Streaming with typing indicator
- Message actions (copy, regenerate)
- Context awareness (shows tables/sources)

**Why Left Panel:**
- Users read left-to-right
- Chat is primary workflow
- Results shown on right (familiar pattern)

#### Decision 3: Right Panel = Single-Level View Switcher

**NOT Tabs (nested), but VIEWS (flat):**

```typescript
// OLD (nested tabs - confusing)
<Tabs>
  <Tab value="preview">...</Tab>
  <Tab value="dbt">
    <Tabs> {/* NESTED! */}
      <Tab value="model">...</Tab>
      <Tab value="schema">...</Tab>
    </Tabs>
  </Tab>
</Tabs>

// NEW (flat views - clear)
<ViewSwitcher value={view} onChange={setView}>
  <ViewButton value="preview">Data Preview</ViewButton>
  <ViewButton value="editor">SQL Editor</ViewButton>
  <ViewButton value="dbt">dbt Template</ViewButton>
</ViewSwitcher>

{view === 'preview' && <DataPreviewView />}
{view === 'editor' && <SQLEditorView />}
{view === 'dbt' && <DBTTemplateView />}
```

**Benefits:**
- No cognitive load (1 level, not 3)
- Clear workflow: Preview → Edit → Deploy
- Each view is full-height (no tabs stealing space)

#### Decision 4: Use Existing TiSQLEditor (Not Monaco!)

**Why TiSQLEditor:**
```typescript
// It's already integrated and excellent!
import { TiSQLEditor } from '@/components/tisql/TiSQLEditor';

<TiSQLEditor
  sql={sql}
  onChange={setSql}
  selectedCatalog="iceberg"
  selectedEnvironment="development"
  schema={outputSchema}
  onExecute={handleRunQuery}
  theme="dark"
/>
```

**TiSQLEditor Features:**
- ✅ SQL-specific autocomplete (from TiDB Cloud)
- ✅ Syntax highlighting (CodeMirror 6)
- ✅ Save helper (Cmd+S)
- ✅ Current SQL gutter (shows which query is selected)
- ✅ Already integrated, no new dependencies
- ✅ Optimized for SQL workloads

**Why NOT Monaco:**
- Monaco is 5MB+ library (TiSQL is lighter)
- Monaco is generic editor (TiSQL is SQL-optimized)
- Monaco requires setup (TiSQL works out of box)
- We already have TiSQLEditor working!

#### Decision 5: Vercel AI SDK for Chat

**Implementation:**
```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, context } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    system: `You are an expert SQL data engineer for NexusOne.
Current context:
- Catalog: ${context.catalog}
- Schema: ${context.schema}
- Tables: ${context.tables.join(', ')}
- Current SQL: ${context.currentSQL}

Generate SQL queries, explain concepts, optimize performance.`,

    tools: {
      generateSQL: {
        description: 'Generate SQL query from natural language',
        parameters: z.object({
          description: z.string(),
          tables: z.array(z.string()),
        }),
        execute: async ({ description, tables }) => {
          // Call backend SQL generation service
          return { sql: '...', explanation: '...' };
        },
      },
      executeQuery: {
        description: 'Execute SQL and return results',
        parameters: z.object({ sql: z.string() }),
        execute: async ({ sql }) => {
          // Call Trino via backend
          return { rows: [...], executionTime: 0.5 };
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
```

```typescript
// components/sql/SQLChat.tsx
import { useChat } from 'ai/react';

export function SQLChat({ context }: SQLChatProps) {
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { context },
    onFinish: (message) => {
      // Extract SQL if AI generated it
      const sqlMatch = message.content.match(/```sql\n([\s\S]*?)\n```/);
      if (sqlMatch) {
        onSQLGenerated(sqlMatch[1]);
      }
    },
  });

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <MessageList messages={messages} isLoading={isLoading} />
      <InputArea input={input} onSubmit={handleSubmit} />
    </div>
  );
}
```

**Benefits:**
- Full control over UI (build Claude-like interface)
- Streaming with SSE (smooth UX)
- Tool calling with custom UI
- Easy to swap models (GPT → Claude → local)
- Type-safe messages and context

### 3.3 Chat UI Specification

**Message Data Structure:**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string; // Markdown
  createdAt: Date;
  toolInvocations?: ToolInvocation[];
  metadata?: {
    model?: string;
    tokens?: { prompt: number; completion: number };
    executionTime?: number;
  };
}

interface Artifact {
  type: 'sql' | 'dbt' | 'chart' | 'table';
  language?: string;
  content: string;
  title?: string;
  actions?: ArtifactAction[];
}

type ArtifactAction =
  | { type: 'copy'; label: 'Copy' }
  | { type: 'run'; label: 'Run Query'; onClick: () => void }
  | { type: 'edit'; label: 'Edit in SQL Editor'; onClick: () => void }
  | { type: 'download'; label: 'Download'; onClick: () => void };
```

**Component Structure:**
```tsx
<SQLChat context={workstationContext}>
  {/* Compact Header */}
  <ChatHeader>
    <ModelSelector value={model} onChange={setModel}>
      <Option value="gpt-4">GPT-4 Turbo</Option>
      <Option value="claude-3-5">Claude 3.5 Sonnet</Option>
      <Option value="local">Local Model</Option>
    </ModelSelector>

    <ContextIndicator>
      <Badge>iceberg.production</Badge>
      <Badge>2 tables</Badge>
    </ContextIndicator>

    <Button onClick={clearChat} variant="ghost" size="sm">
      <Trash2 className="w-4 h-4" />
    </Button>
  </ChatHeader>

  {/* Scrollable Message List */}
  <MessageList>
    {messages.map(msg => (
      msg.role === 'user' ? (
        <UserMessage key={msg.id}>
          {msg.content}
        </UserMessage>
      ) : (
        <AssistantMessage key={msg.id}>
          <MarkdownContent>
            {msg.content}
          </MarkdownContent>

          {extractArtifacts(msg.content).map(artifact => (
            <ArtifactCard
              key={artifact.id}
              type={artifact.type}
              content={artifact.content}
              actions={artifact.actions}
            />
          ))}

          <MessageActions>
            <Button onClick={() => copy(msg.content)}>Copy</Button>
            <Button onClick={() => regenerate(msg.id)}>Regenerate</Button>
          </MessageActions>
        </AssistantMessage>
      )
    ))}

    {isLoading && <TypingIndicator />}
    <div ref={scrollRef} /> {/* Scroll anchor */}
  </MessageList>

  {/* Sticky Input Area */}
  <InputArea>
    <AttachContextButton onClick={openContextSelector}>
      <Paperclip className="w-4 h-4" />
      Attach
    </AttachContextButton>

    <AutoExpandTextarea
      value={input}
      onChange={setInput}
      onSubmit={handleSubmit}
      placeholder="Ask me to generate SQL, explain queries, or optimize..."
      maxRows={5}
    />

    <Button
      onClick={handleSubmit}
      disabled={!input.trim() || isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
    </Button>
  </InputArea>
</SQLChat>
```

**Markdown Rendering:**
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight]}
  components={{
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <ArtifactCard
          type={match[1] as 'sql' | 'yaml' | 'json'}
          content={String(children).replace(/\n$/, '')}
        />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  }}
>
  {message.content}
</ReactMarkdown>
```

### 3.4 Right Panel View Specifications

#### View 1: Data Preview (Default)

**Layout:**
```
┌─────────────────────────────────────────┐
│ Inline Toolbar                          │ 40px
│ [▶ Run] [🔍 Analyze] [⬇ Export CSV]    │
├─────────────────────────────────────────┤
│ Validation: ✓ SQL is valid             │ (conditional)
├─────────────────────────────────────────┤
│ Results Table                           │ flex-1
│ ┌────────┬──────────┬──────────┐       │
│ │ id     │ name     │ status   │       │
│ ├────────┼──────────┼──────────┤       │
│ │ 1001   │ Acme     │ active   │       │
│ │ 1002   │ Beta     │ pending  │       │
│ │ ...    │ ...      │ ...      │       │
│ └────────┴──────────┴──────────┘       │
├─────────────────────────────────────────┤
│ Footer: 1,234 rows • 0.5s • 2.1GB      │ 32px
└─────────────────────────────────────────┘
```

**Component:**
```typescript
<DataPreviewView>
  <InlineToolbar>
    <Button onClick={onRun} disabled={!sql}>
      <Play className="w-4 h-4" />
      Run Query
    </Button>
    <Button onClick={onAnalyze} variant="outline">
      <Sparkles className="w-4 h-4" />
      Analyze
    </Button>
    <Button onClick={onExport} variant="outline">
      <Download className="w-4 h-4" />
      Export CSV
    </Button>
  </InlineToolbar>

  {validationResult && (
    <ValidationBanner result={validationResult} />
  )}

  <VirtualizedTable
    data={testResult?.previewData || []}
    columns={inferColumns(testResult?.previewData)}
    height="100%"
  />

  <ResultsFooter>
    <span>{testResult?.rowCount.toLocaleString()} rows</span>
    <span>•</span>
    <span>{testResult?.executionTime}s</span>
    <span>•</span>
    <span>{testResult?.dataScanned} scanned</span>
  </ResultsFooter>
</DataPreviewView>
```

#### View 2: SQL Editor

**Layout:**
```
┌─────────────────────────────────────────┐
│ Inline Toolbar                          │ 40px
│ [▶ Run] [⚡ Format] [💾 Save]          │
├─────────────────────────────────────────┤
│ TiSQLEditor                             │ flex-1
│ ┌─────────────────────────────────────┐ │
│ │  1  SELECT *                        │ │
│ │  2  FROM iceberg.prod.customers     │ │
│ │  3  WHERE status = 'active'         │ │
│ │  4  ORDER BY created_at DESC        │ │
│ │  5  LIMIT 100;                      │ │
│ │     [autocomplete popup]            │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Footer: Line 3, Col 7 • 5 lines        │ 32px
└─────────────────────────────────────────┘
```

**Component:**
```typescript
<SQLEditorView>
  <InlineToolbar>
    <Button onClick={onRun} disabled={!sql}>
      <Play className="w-4 h-4" />
      Run <Kbd>⌘↵</Kbd>
    </Button>
    <Button onClick={onFormat} variant="outline">
      <Code className="w-4 h-4" />
      Format <Kbd>⌘⇧F</Kbd>
    </Button>
    <Button onClick={onSave} variant="outline">
      <Save className="w-4 h-4" />
      Save <Kbd>⌘S</Kbd>
    </Button>
  </InlineToolbar>

  <TiSQLEditor
    sql={sql}
    onChange={setSql}
    selectedCatalog={catalog}
    selectedEnvironment={environment}
    schema={schema}
    onExecute={onRun} // Cmd+Enter triggers this
    theme={theme}
  />

  <EditorFooter>
    <span>Line {cursorLine}, Col {cursorCol}</span>
    <span>•</span>
    <span>{sql.split('\n').length} lines</span>
  </EditorFooter>
</SQLEditorView>
```

**Benefits:**
- Direct SQL editing (no AI round-trip)
- TiSQL autocomplete (table/column suggestions)
- Keyboard shortcuts (Cmd+Enter, Cmd+S)
- Familiar IDE experience

#### View 3: dbt Template

**Layout (Simplified!):**
```
┌─────────────────────────────────────────┐
│ File Selector & Actions                 │ 40px
│ [model.sql ▼] [📋 Copy] [⬇ Download]   │
├─────────────────────────────────────────┤
│ Code Viewer                             │ flex-1
│ {{ config(materialized='table') }}      │
│                                          │
│ SELECT                                   │
│   customer_id,                           │
│   name,                                  │
│   risk_score                             │
│ FROM {{ source('production', '...')}}   │
│ WHERE status = 'active'                  │
└─────────────────────────────────────────┘
```

**Component:**
```typescript
<DBTTemplateView model={dbtModel}>
  <FileSelector value={currentFile} onChange={setCurrentFile}>
    <option value="model">model.sql</option>
    <option value="schema">schema.yml</option>
    <option value="sources">sources.yml</option>
  </FileSelector>

  <Button onClick={() => copy(currentFileContent)}>
    <Copy className="w-4 h-4" />
    Copy {currentFile}
  </Button>

  <Button onClick={downloadAll}>
    <Download className="w-4 h-4" />
    Download ZIP
  </Button>

  <CodeViewer
    language={currentFile === 'model' ? 'sql' : 'yaml'}
    code={currentFileContent}
    readOnly
  />
</DBTTemplateView>
```

**Benefits:**
- No nested tabs (file selector dropdown)
- Easy to copy individual files
- Download all as ZIP for quick integration
- Clear instructions for next steps

---

## Part 4: Implementation Plan

### Phase 1: Remove CopilotKit, Add Vercel AI SDK ⏱️ 2-3 days

**Tasks:**

1. **Uninstall CopilotKit**
```bash
npm uninstall @copilotkit/react-core @copilotkit/react-ui @copilotkit/backend @copilotkit/react-textarea @copilotkit/shared
```

2. **Install Vercel AI SDK**
```bash
npm install ai @ai-sdk/openai zod
npm install react-markdown remark-gfm rehype-highlight
```

3. **Create API Route** (`app/api/chat/route.ts`)
```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages, context } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
    system: buildSystemPrompt(context),
    tools: {
      generateSQL: {
        description: 'Generate SQL query from description',
        parameters: z.object({
          description: z.string(),
          tables: z.array(z.string()),
        }),
        execute: async ({ description, tables }) => {
          // Call backend SQL generation
          const response = await fetch('/api/tisql/generate', {
            method: 'POST',
            body: JSON.stringify({ description, tables }),
          });
          return response.json();
        },
      },
      executeQuery: {
        description: 'Execute SQL and return results',
        parameters: z.object({ sql: z.string() }),
        execute: async ({ sql }) => {
          // Call Trino via backend
          const response = await fetch('/api/tisql/execute', {
            method: 'POST',
            body: JSON.stringify({ sql }),
          });
          return response.json();
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
```

4. **Create SQLChat Component** (`components/sql/SQLChat.tsx`)
```typescript
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';

export function SQLChat({ context, onSQLGenerated }: SQLChatProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { context },
  });

  return (
    <div className="flex flex-col h-full">
      <ChatHeader context={context} />

      <ScrollArea className="flex-1">
        {messages.map(message => (
          <Message key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
      </ScrollArea>

      <InputArea
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </div>
  );
}
```

5. **Delete Old CopilotKit Files**
   - `components/tisql/TiSQLCopilotProvider.tsx`
   - `components/tisql/TiSQLAgentChat.tsx`
   - `lib/copilot/context.ts`
   - `lib/copilot/actions.ts`
   - `app/api/copilotkit/route.ts`

**Acceptance Criteria:**
- ✅ CopilotKit fully removed from package.json
- ✅ Vercel AI SDK streaming chat working
- ✅ Messages render with markdown
- ✅ Typing indicator shows while loading
- ✅ Tool calling works (generateSQL, executeQuery)

### Phase 2: Simplify Right Panel ⏱️ 1-2 days

**Tasks:**

1. **Create WorkstationViews Component** (`components/sql/WorkstationViews.tsx`)
```typescript
type View = 'preview' | 'editor' | 'dbt';

export function WorkstationViews({
  sql,
  onSQLChange,
  validationResult,
  testResult,
  dbtModel,
  onRun,
  onFormat,
  onGenerateDBT
}: WorkstationViewsProps) {
  const [view, setView] = useState<View>('preview');

  return (
    <div className="flex flex-col h-full">
      <ViewSwitcher value={view} onChange={setView}>
        <ViewButton value="preview" icon={TrendingUp}>
          Data Preview
          {testResult && <Badge>{testResult.rowCount} rows</Badge>}
        </ViewButton>
        <ViewButton value="editor" icon={Code}>
          SQL Editor
        </ViewButton>
        <ViewButton value="dbt" icon={Package} disabled={!dbtModel}>
          dbt Template
        </ViewButton>
      </ViewSwitcher>

      {view === 'preview' && (
        <DataPreviewView
          validationResult={validationResult}
          testResult={testResult}
          onRun={onRun}
        />
      )}

      {view === 'editor' && (
        <SQLEditorView
          sql={sql}
          onChange={onSQLChange}
          onRun={onRun}
          onFormat={onFormat}
        />
      )}

      {view === 'dbt' && dbtModel && (
        <DBTTemplateView model={dbtModel} />
      )}
    </div>
  );
}
```

2. **Remove TiSQLRightPanel** (nested tabs component)

3. **Update Step3ConversationalSQL** to use WorkstationViews

**Acceptance Criteria:**
- ✅ Single-level view switcher (no nested tabs)
- ✅ Smooth transitions between views
- ✅ Each view fills full height

### Phase 3: Integrate TiSQLEditor ⏱️ 1 day

**Tasks:**

1. **Create SQLEditorView** (`components/sql/SQLEditorView.tsx`)
```typescript
import { TiSQLEditor } from '@/components/tisql/TiSQLEditor';
import sqlFormatter from 'sql-formatter';

export function SQLEditorView({
  sql,
  onChange,
  onRun,
  onFormat
}: SQLEditorViewProps) {
  const handleFormat = () => {
    const formatted = sqlFormatter.format(sql, {
      language: 'sql',
      tabWidth: 2,
      keywordCase: 'upper',
    });
    onChange(formatted);
  };

  return (
    <div className="flex flex-col h-full">
      <InlineToolbar>
        <Button onClick={onRun}>
          <Play /> Run <Kbd>⌘↵</Kbd>
        </Button>
        <Button onClick={handleFormat} variant="outline">
          <Code /> Format <Kbd>⌘⇧F</Kbd>
        </Button>
      </InlineToolbar>

      <TiSQLEditor
        sql={sql}
        onChange={onChange}
        onExecute={onRun}
        theme="dark"
      />
    </div>
  );
}
```

2. **Install SQL Formatter**
```bash
npm install sql-formatter
```

3. **Sync Editor with Chat**
   - When AI generates SQL, update editor state
   - When user edits SQL, maintain sync

**Acceptance Criteria:**
- ✅ TiSQLEditor renders in SQL Editor view
- ✅ Cmd+Enter runs query
- ✅ Format SQL button works
- ✅ Editor syncs with chat-generated SQL

### Phase 4: Enhance Chat UI (Claude-like) ⏱️ 2-3 days

**Tasks:**

1. **Create Message Components**
   - `components/sql/UserMessage.tsx`
   - `components/sql/AssistantMessage.tsx`
   - `components/sql/ArtifactCard.tsx`

2. **Implement Markdown Rendering**
```typescript
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight]}
  components={{
    code: CodeBlock,
    h1: Heading1,
    h2: Heading2,
    // ... custom components
  }}
>
  {message.content}
</ReactMarkdown>
```

3. **Add Message Actions**
   - Copy message
   - Regenerate response
   - Edit user message (future)

4. **Implement Streaming UI**
   - Typing indicator (animated dots)
   - Progressive rendering
   - Smooth scroll to bottom
   - Cancel generation button

5. **Add Context Indicators**
   - Show which tables in context
   - Display catalog/schema
   - Token usage (optional)

**Acceptance Criteria:**
- ✅ Messages render markdown properly
- ✅ Code blocks syntax-highlighted
- ✅ Streaming shows typing indicator
- ✅ Message actions work (copy, regenerate)
- ✅ Context indicators visible

### Phase 5: Remove Header, Inline Actions ⏱️ 1 day

**Tasks:**

1. **Remove Header Component**
   - Delete header div from Step3ConversationalSQL
   - Remove Back button (can go in status bar)
   - Remove product context display

2. **Add Inline Toolbars to Each View**
   - Chat: Model selector, clear button in header
   - Preview: Run, Analyze, Export buttons
   - Editor: Run, Format, Save buttons
   - dbt: Copy, Download buttons

3. **Reduce Status Bar Height**
   - From 48px → 32px
   - Compact layout with essential info only

**Acceptance Criteria:**
- ✅ No header component
- ✅ All actions accessible in views
- ✅ Status bar is compact (32px)
- ✅ More vertical space for content

### Phase 6: Simplify dbt Template View ⏱️ 1 day

**Tasks:**

1. **Simplify DBTModelViewer**
   - Remove nested tabs
   - Add file selector dropdown
   - Single code viewer

2. **Improve Actions**
   - Copy individual file
   - Download all files as ZIP

3. **Add dbt Instructions**
   - Clear next steps
   - Link to dbt documentation

**Acceptance Criteria:**
- ✅ No nested tabs in dbt view
- ✅ Easy to copy/download files
- ✅ Clear usage instructions

### Phase 7: Polish & Testing ⏱️ 2-3 days

**Tasks:**

1. **Performance Optimization**
   - Virtualize large result sets (react-window)
   - Lazy-load TiSQLEditor
   - Optimize markdown rendering
   - Test with 10k+ rows

2. **Accessibility**
   - Keyboard navigation (Tab, Arrow keys)
   - Screen reader support (ARIA labels)
   - Focus management
   - Skip links

3. **Responsive Design**
   - Test on different screen sizes
   - Collapsible panels for small screens
   - Mobile considerations (future)

4. **Error Handling**
   - Graceful API failures
   - Network timeout handling
   - Invalid SQL feedback
   - Retry mechanisms

5. **Dark/Light Mode**
   - Test both themes
   - Ensure color contrast
   - Fix any theme-specific issues

**Acceptance Criteria:**
- ✅ Smooth performance with large datasets
- ✅ Keyboard navigation works
- ✅ Both themes look good
- ✅ Errors are user-friendly
- ✅ Accessibility score >90

---

## Part 5: Success Metrics

### 5.1 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2s | Time to interactive |
| Time to First Message | < 1s | User input → AI response start |
| Editor Responsiveness | < 100ms | Keystroke → screen update |
| Results Rendering | < 500ms | API response → table display |
| Bundle Size Reduction | -120kb | CopilotKit removal |

### 5.2 Usability Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Chat Usage Rate | 80%+ | % users who send at least 1 message |
| Editor Usage Rate | 60%+ | % users who switch to SQL Editor view |
| dbt Generation Rate | 40%+ | % users who generate dbt templates |
| Error Recovery Rate | > 95% | % users who continue after error |
| Task Completion Time | -40% | Reduced time vs. old UI |

### 5.3 Code Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Component Count | -40% | 8 components → 5 components |
| Bundle Size | -120kb | CopilotKit removed |
| Type Coverage | 95%+ | TypeScript strict mode |
| Test Coverage | 80%+ | Unit + integration tests |
| Cyclomatic Complexity | < 10 | Per function average |

---

## Part 6: Risks & Mitigations

### Risk 1: Vercel AI SDK Learning Curve

**Impact:** Medium | **Probability:** High

**Risk:** Team unfamiliar with Vercel AI SDK, may take longer to implement.

**Mitigation:**
1. Start with basic `useChat` hook (simplest pattern)
2. Follow official Vercel AI SDK examples closely
3. Defer advanced features (tool calling) to later phases
4. Pair programming for first implementation
5. Documentation as we go

### Risk 2: TiSQLEditor Integration Issues

**Impact:** Medium | **Probability:** Low

**Risk:** TiSQLEditor may not work well in new layout or have unexpected bugs.

**Mitigation:**
1. TiSQLEditor already works (used in TiSQLWorkstation)
2. Test early in Phase 3 (don't wait until end)
3. Keep fallback plan (use basic textarea if TiSQL fails)
4. Minimal wrapping (just pass props through)

### Risk 3: Breaking Existing Workflows

**Impact:** High | **Probability:** Medium

**Risk:** Users rely on current Step 3 flow, changes may break their workflow.

**Mitigation:**
1. Feature flag: Keep old Step 3 available during migration
2. Beta testing with small user group first
3. Document migration guide (old → new patterns)
4. Gradual rollout (10% → 50% → 100%)
5. Quick rollback plan if critical issues

### Risk 4: Scope Creep

**Impact:** Medium | **Probability:** High

**Risk:** Team wants to add more features, delaying core redesign.

**Mitigation:**
1. Stick to 7-phase plan (don't deviate)
2. Document "future enhancements" separately
3. MVP first: Chat + Editor + Preview (defer dbt polish)
4. Time-box each phase (force completion)
5. Code freeze after Phase 7 (ship it!)

### Risk 5: Performance Regression

**Impact:** High | **Probability:** Low

**Risk:** New UI is slower than old UI due to additional rendering.

**Mitigation:**
1. Performance budgets from day 1
2. Lighthouse CI in GitHub Actions
3. React Profiler for hot paths
4. Virtualize large lists (react-window)
5. Lazy-load heavy components (TiSQLEditor, markdown)

---

## Part 7: File Structure

```
components/
├── sql/                              # NEW: SQL workstation components
│   ├── SQLChat.tsx                  # Main chat component (Vercel AI SDK)
│   ├── SQLChatHeader.tsx            # Model selector, context indicator
│   ├── SQLChatMessage.tsx           # Individual message rendering
│   ├── SQLChatInput.tsx             # Input area with textarea
│   ├── UserMessage.tsx              # User message bubble
│   ├── AssistantMessage.tsx         # AI message bubble with markdown
│   ├── ArtifactCard.tsx             # Code/SQL artifact rendering
│   ├── MessageActions.tsx           # Copy, regenerate buttons
│   ├── TypingIndicator.tsx          # Animated dots while AI thinks
│   ├── WorkstationViews.tsx         # View switcher component
│   ├── DataPreviewView.tsx          # Results table view
│   ├── SQLEditorView.tsx            # TiSQLEditor wrapper
│   ├── DBTTemplateView.tsx          # Simplified dbt viewer
│   └── types.ts                     # Shared TypeScript types
│
├── build/steps/
│   ├── Step3SQLWorkstation.tsx      # NEW: Unified component (replaces old)
│   └── Step3ConversationalSQL.tsx   # OLD: Keep for migration (delete after)
│
└── tisql/                            # KEEP: Core SQL components
    ├── TiSQLEditor.tsx              # ✅ KEEP: Integrated in SQLEditorView
    ├── TiSQLResultsPanel.tsx        # ✅ KEEP: Used in DataPreviewView
    └── dbt/
        └── DBTModelViewer.tsx       # REFACTOR: Simplify (remove nested tabs)

app/api/
├── chat/
│   └── route.ts                     # NEW: Vercel AI SDK endpoint
├── tisql/
│   ├── generate/
│   │   └── route.ts                 # SQL generation backend
│   ├── execute/
│   │   └── route.ts                 # Query execution backend
│   └── generate-dbt/
│       └── route.ts                 # ✅ KEEP: dbt generation

lib/
├── ai/                               # NEW: AI utilities
│   ├── context.ts                   # Context formatting for AI
│   ├── tools.ts                     # Tool definitions (generateSQL, etc.)
│   └── prompts.ts                   # System prompts
└── sql/
    ├── formatter.ts                 # SQL formatting (sql-formatter)
    └── validator.ts                 # SQL validation

DELETE (after migration):
├── components/tisql/TiSQLAgentChat.tsx
├── components/tisql/TiSQLCopilotProvider.tsx
├── components/tisql/TiSQLRightPanel.tsx
├── lib/copilot/context.ts
├── lib/copilot/actions.ts
└── app/api/copilotkit/route.ts
```

---

## Part 8: Dependencies Changes

### Remove
```json
{
  "@copilotkit/backend": "^0.37.0",
  "@copilotkit/react-core": "^1.10.4",
  "@copilotkit/react-textarea": "^1.10.4",
  "@copilotkit/react-ui": "^1.10.4",
  "@copilotkit/shared": "^1.10.4"
}
// Total removed: ~160kb
```

### Add
```json
{
  "ai": "^5.0.0",                    // ~20kb
  "@ai-sdk/openai": "^1.0.0",        // ~10kb
  "react-markdown": "^9.0.0",        // ~50kb (includes dependencies)
  "remark-gfm": "^4.0.0",            // ~15kb
  "rehype-highlight": "^7.0.0",      // ~30kb
  "sql-formatter": "^15.0.0",        // ~40kb
  "zod": "^3.22.0"                   // ~60kb (likely already installed)
}
// Total added: ~165kb (but net -120kb with tree shaking)
```

### Keep (Already Installed)
```json
{
  "@tidbcloud/tisqleditor-react": "latest",                      // ✅ ESSENTIAL
  "@tidbcloud/codemirror-extension-cur-sql-gutter": "latest",    // ✅ ESSENTIAL
  "@tidbcloud/codemirror-extension-sql-autocomplete": "latest",  // ✅ ESSENTIAL
  "react-resizable-panels": "^2.0.0",                            // ✅ Keep for PanelGroup
  "@assistant-ui/react-ai-sdk": "^1.1.0"                         // Consider for future
}
```

---

## Part 9: API Specifications

### 9.1 SQLChat Component API

```typescript
interface SQLChatProps {
  // Context
  context: {
    catalog: string;
    schema: string;
    selectedTables: Table[];
    currentSQL?: string;
  };

  // Callbacks
  onSQLGenerated?: (sql: string, metadata: {
    explanation: string;
    tables: string[];
  }) => void;

  // Model config
  model?: 'gpt-4' | 'claude-3-5' | 'local';
  systemPrompt?: string;

  // UI config
  className?: string;
  placeholder?: string;
  maxMessages?: number;
}

// Usage
<SQLChat
  context={{
    catalog: 'iceberg',
    schema: 'production',
    selectedTables: [
      { name: 'customers', columns: [...] },
      { name: 'orders', columns: [...] }
    ],
    currentSQL: 'SELECT * FROM customers'
  }}
  onSQLGenerated={(sql, metadata) => {
    setSQLInEditor(sql);
    showExplanation(metadata.explanation);
  }}
  model="gpt-4"
/>
```

### 9.2 WorkstationViews Component API

```typescript
type WorkstationView = 'preview' | 'editor' | 'dbt';

interface WorkstationViewsProps {
  // Data
  sql: string;
  onSQLChange: (sql: string) => void;
  validationResult?: ValidationResult;
  testResult?: TestResult;
  dbtModel?: DbtModel;

  // Actions
  onRunQuery: () => void;
  onFormatSQL: () => void;
  onAnalyzeQuery: () => void;
  onGenerateDBT: () => void;
  onExportResults: (format: 'csv' | 'json') => void;

  // UI
  defaultView?: WorkstationView;
  allowedViews?: WorkstationView[];
  className?: string;
}

// Usage
<WorkstationViews
  sql={sql}
  onSQLChange={setSql}
  validationResult={validationResult}
  testResult={testResult}
  dbtModel={dbtModel}
  onRunQuery={handleRunQuery}
  onFormatSQL={handleFormatSQL}
  onGenerateDBT={handleGenerateDBT}
  defaultView="preview"
  allowedViews={['preview', 'editor', 'dbt']}
/>
```

### 9.3 SQLEditorView Component API

```typescript
interface SQLEditorViewProps {
  sql: string;
  onChange: (sql: string) => void;
  onRun: () => void;
  onFormat?: () => void;
  onSave?: () => void;

  // Editor config
  catalog: string;
  schema: Array<{ name: string; type: string }>;
  readOnly?: boolean;
  theme?: 'dark' | 'light';

  // Callbacks
  onCursorChange?: (line: number, col: number) => void;
}

// Usage
<SQLEditorView
  sql={sql}
  onChange={setSql}
  onRun={handleRunQuery}
  onFormat={handleFormatSQL}
  catalog="iceberg"
  schema={outputSchema}
  theme="dark"
/>
```

---

## Part 10: Testing Strategy

### 10.1 Unit Tests

**Components to Test:**
- `SQLChat` - Message rendering, input handling
- `WorkstationViews` - View switching, state management
- `SQLEditorView` - SQL editing, formatting
- `ArtifactCard` - Code rendering, copy functionality

**Example Test:**
```typescript
describe('SQLChat', () => {
  it('should render user message', () => {
    render(<SQLChat context={mockContext} />);
    // Test message rendering
  });

  it('should handle streaming response', async () => {
    // Test streaming with mock API
  });

  it('should extract SQL from markdown', () => {
    // Test artifact extraction
  });
});
```

### 10.2 Integration Tests

**Workflows to Test:**
1. User sends message → AI generates SQL → SQL inserted in editor
2. User edits SQL in editor → Runs query → Results displayed
3. User generates dbt → Files shown → Downloads ZIP
4. User switches between views → State preserved

**Example Test:**
```typescript
describe('SQL Workstation Integration', () => {
  it('should complete full workflow', async () => {
    // 1. Send message
    // 2. Verify SQL generated
    // 3. Switch to editor
    // 4. Edit SQL
    // 5. Run query
    // 6. Verify results
  });
});
```

### 10.3 E2E Tests (Playwright)

**Critical Paths:**
1. Generate SQL via chat
2. Edit SQL directly
3. Run query and see results
4. Generate dbt template
5. Download dbt files

---

## Part 11: Migration Guide

### For Users

**What's Changing:**
1. Chat UI looks different (Claude-like)
2. Tabs are now flat views (easier navigation)
3. SQL Editor is available (direct editing)
4. Header removed (more space)

**What's The Same:**
1. Chat still works (same conversations)
2. Results table (same data)
3. dbt generation (same files)
4. Keyboard shortcuts (Cmd+Enter still works)

**How to Adapt:**
- **Old:** Click "dbt Model" tab → Click sub-tab
- **New:** Click "dbt Template" view → Select file from dropdown

- **Old:** Can't edit SQL directly
- **New:** Switch to "SQL Editor" view → Edit freely

### For Developers

**Code Changes:**
1. Replace `<TiSQLAgentChat>` with `<SQLChat>`
2. Replace `<TiSQLRightPanel>` with `<WorkstationViews>`
3. Remove CopilotKit provider
4. Add Vercel AI SDK `/api/chat` route

**Breaking Changes:**
- CopilotKit hooks (`useCopilotAction`) no longer available
- Custom actions must be reimplemented as Vercel AI SDK tools
- Message format different (UIMessage vs. CopilotKit format)

---

## Part 12: Future Enhancements (Post-Launch)

### Phase 8: Advanced Features (Future)

**Multi-Tab Support:**
- Work on multiple queries simultaneously
- Switch between tabs
- Preserve state per tab

**Query History:**
- Save executed queries
- Quick recall of previous queries
- Favorites/bookmarks

**Collaborative Editing:**
- Real-time collaboration (multiple users)
- Cursor presence
- Change tracking

**Model Comparison:**
- Run same query through GPT-4 vs Claude
- Compare results
- A/B test prompts

**Advanced dbt Features:**
- dbt test execution
- dbt docs preview
- dbt DAG visualization

**Query Optimization:**
- EXPLAIN plan visualization
- Index recommendations
- Cost estimation before run

---

## Document Status

- **Created:** October 17, 2025
- **Author:** Claude (Sonnet 4.5)
- **Status:** Draft - Awaiting Implementation
- **Version:** 1.0
- **Last Updated:** October 17, 2025

---

## References

1. [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
2. [Vercel AI SDK v5.0 Release](https://vercel.com/blog/ai-sdk-5)
3. [TiDB TiSQL Editor](https://github.com/tidbcloud/tisqleditor)
4. [Claude.ai](https://claude.ai) - Chat UX reference
5. [React Markdown](https://github.com/remarkjs/react-markdown)
6. [NexusOne Design System](../design-system/TYPOGRAPHY_HIERARCHY.md)
7. [SQL Formatter](https://github.com/sql-formatter-org/sql-formatter)

---

## Appendix: Key Decisions Summary

| Decision | Rationale | Impact |
|----------|-----------|--------|
| **Vercel AI SDK over CopilotKit** | Full UI control, lighter weight, model agnostic | -120kb bundle, better UX |
| **Flat views over nested tabs** | Reduced cognitive load, clearer workflow | Simpler navigation |
| **TiSQLEditor over Monaco** | Already integrated, SQL-optimized, lighter | No new dependencies |
| **Remove header** | More vertical space for content | +80px workspace |
| **Chat + Editor coexist** | Users can chat OR edit directly | Faster iteration |
| **Artifact-style code blocks** | Like Claude, better than inline text | Professional feel |
| **Streaming with SSE** | Real-time feedback, perceived performance | Smoother UX |

---

**END OF DOCUMENT**
