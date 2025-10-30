# Step 3 Transformation: Comprehensive Audit & Improvement Plan
## Making SQL/dbt Creation Robust, Adaptive, and AI-Powered with Validated Data

**Version:** 1.0
**Date:** 2025-10-16
**Status:** Strategic Analysis
**Authors:** NexusOne Engineering Team

---

## Executive Summary

This document audits the current Step 3 implementation and proposes enhancements to make it more robust, adaptive, and AI-powered while maintaining confidence through validated data. Our goal is to transform Step 3 from a simple SQL editor into an intelligent transformation assistant that adapts to user needs while providing transparent, validated suggestions.

**Key Findings:**
- ✅ **Strong Foundation**: Good structure with tabs, templates, and validation
- ⚠️ **Limited Intelligence**: Smart defaults exist but lack organizational learning
- ❌ **No Validation**: Preview uses mock data, not real execution
- ❌ **Weak dbt Support**: Templates exist but no full project generation
- ❌ **Missing Confidence**: No metrics to trust AI suggestions

**Recommended Approach:** Enhance existing linear workflow with AI assistance and validated data, NOT notebook-style or visual builder.

---

## Part 1: Current State Audit

### 1.1 What Exists Today

#### Components

1. **Step3WriteSQL.tsx** (868 lines)
   - Main component with 3 tabs (Editor, Library, Templates)
   - CodeMirror SQL editor with syntax highlighting
   - 13 SQL templates (basic, advanced, dbt)
   - Smart default SQL generation with join detection
   - Real-time validation (debounced 1s)
   - Query preview with MockSQLEngine
   - Saved query browser integration

2. **Step3SQLWorkstation.tsx** (220 lines)
   - Wrapper for TiSQLWorkstation
   - Handles state management
   - Generates mock preview data
   - Saves query patterns for org learning
   - Integrates analysis API

3. **TiSQLWorkstation.tsx** (461 lines)
   - Full-screen 3-panel layout
   - tiSQL editor integration
   - Context panel (sources, schema)
   - Results panel (validation, preview, analysis)
   - Keyboard shortcuts (Cmd+B, Cmd+J, Cmd+Enter)

4. **MockSQLEngine.ts** (447 lines)
   - Parses SQL (SELECT, FROM, JOIN, WHERE, GROUP BY, ORDER BY, LIMIT)
   - Executes against mock data
   - Supports aggregations (SUM, COUNT, AVG, MAX, MIN)
   - Generates query plans
   - Realistic execution times

#### Supporting Services

1. **dbt-generator.ts** (413 lines)
   - Generates dbt model SQL
   - Generates schema.yml with tests
   - Generates sources.yml
   - Generates dbt_project.yml config
   - Maps ODCS contracts → dbt artifacts

2. **sql-autocomplete.ts**
   - Builds schema for CodeMirror
   - Provides table/column suggestions
   - Mock data for development

3. **query-pattern-storage.ts**
   - Saves successful queries for org learning
   - Metadata: sources, catalog, schema, user

#### Templates

**13 SQL Templates:**
- **Basic** (4): Simple SELECT, Aggregation, Window Functions, Deduplication
- **Advanced** (4): Join Enrichment, SCD Type 2, Full Outer Reconciliation, Incremental Merge
- **dbt** (5): Incremental Model, Snapshot, Source Freshness, Test Data Generation, More...

### 1.2 What Works Well

✅ **User Experience**
- Clean tabbed interface (Editor/Library/Templates)
- Real-time validation feedback
- Visual preview of results
- Smart defaults pre-populate SQL
- Template categorization is clear

✅ **Code Quality**
- Well-structured components
- TypeScript types throughout
- Proper state management
- Error handling in place

✅ **Template System**
- Good coverage of common patterns
- Metadata (difficulty, required sources)
- Easy to load and customize

✅ **Architecture**
- Separation of concerns (UI vs logic)
- API integration points identified
- Mock data enables development

### 1.3 Critical Gaps

#### Gap 1: No Real Data Validation ⚠️

**Problem:**
```typescript
// In Step3WriteSQL.tsx:452
async function validateSQL(sql: string) {
  try {
    const result = await validateSQLAPI(sql, selectedSources.map(s => s.id));
    // ^^ This calls backend, but backend returns mock
  } catch (error) {
    // Fallback: basic regex validation
    if (sql.toLowerCase().includes('select') && sql.toLowerCase().includes('from')) {
      setValidationResult({ valid: true, estimatedRows: Math.floor(Math.random() * 1000000) });
    }
  }
}
```

**Impact:**
- Users can't trust validation results
- Invalid SQL passes validation
- Can't build confidence in AI suggestions
- Preview data is fake (MockSQLEngine)

**Solution Needed:**
- Real Trino EXPLAIN for validation
- Real LIMIT 100 execution for preview
- Show actual row counts, execution times
- Build trust through real data

#### Gap 2: Smart Defaults Not Smart Enough ⚠️

**Problem:**
```typescript
// In Step3WriteSQL.tsx:321
function generateSmartDefaultSQL(sources, contractSchema) {
  // Detects join keys by exact name matching
  const detectJoinKeys = (source1, source2) => {
    for (const col1 of source1.columns) {
      for (const col2 of source2.columns) {
        if (col1.name.toLowerCase() === col2.name.toLowerCase()) {
          keys.push(col1.name); // ONLY exact matches
        }
      }
    }
  };
}
```

**Current Limitations:**
- Only detects exact column name matches
- No fuzzy matching (customer_id vs customerId)
- No organizational learning (what joins work?)
- No confidence scores
- No explanation for suggestions

**Solution Needed:**
- Query Living Context Graph for successful joins
- Fuzzy column name matching
- Show confidence: "94% - used 8x by marketing team"
- Explain reasoning: "Based on successful patterns"

#### Gap 3: dbt Templates Not Full Projects ❌

**Problem:**
```typescript
// Templates are just SQL strings, not complete dbt projects
{
  id: 'dbt-incremental',
  name: 'dbt Incremental Model',
  sql: `{{ config(...) }} SELECT ... {% if is_incremental() %} ... {% endif %}`
  // ^^ Just SQL, no staging models, no sources.yml, no tests
}
```

**Current State:**
- Templates are single SQL files
- No project structure generation
- No staging → intermediate → marts pattern
- No sources.yml or schema.yml
- User must manually create project

**Solution Needed:**
- Full dbt project templates
- Multi-file generation (staging, marts, config)
- Auto-populated sources.yml from Step 2
- Auto-generated tests from Step 1 schema
- TODO placeholders with AI suggestions

#### Gap 4: No AI Assistance During Editing ❌

**Problem:**
- User types SQL manually
- No inline suggestions
- No context-aware completions
- No pattern recommendations
- No "show me similar queries" feature

**Solution Needed:**
- Inline AI code completion (Copilot-style)
- Context-aware suggestions from org patterns
- "Similar queries" sidebar
- Error fix suggestions
- Performance optimization hints

#### Gap 5: Validation Lacks Context ⚠️

**Problem:**
```typescript
// Validation only checks syntax
{
  valid: true,
  error?: string,
  estimatedRows?: number
}
// No: performance warnings, quality issues, security problems
```

**Missing Validations:**
- Performance: "Full table scan detected"
- Quality: "Missing WHERE clause"
- Security: "No row-level security filter"
- Best practices: "Use CTE instead of subquery"
- Schema drift: "Column X removed from source"

**Solution Needed:**
- Multi-level validation (syntax → performance → quality → security)
- Warning levels (blocker, warning, info)
- Actionable suggestions
- Link to docs/examples

### 1.4 Architecture Assessment

**Current Flow:**
```
Step 1: Define Product
  ↓
Step 2: Select Sources (3 tables)
  ↓
Step 3: Write SQL
  ├─ Tab 1: Editor (CodeMirror)
  │   ├─ Smart default SQL (join detection)
  │   ├─ Real-time validation (mock)
  │   └─ Preview (MockSQLEngine)
  ├─ Tab 2: Query Library (saved queries)
  └─ Tab 3: Templates (13 SQL snippets)
  ↓
Step 4: Quality Rules
```

**Strengths:**
- Linear flow (8 min target)
- Clear progression
- Multiple entry points (manual, library, template)
- Context carried forward

**Weaknesses:**
- No adaptation to user skill level
- No organizational learning integration
- No dbt project option
- Validation not trustworthy

---

## Part 2: Improvement Strategy

### 2.1 Design Principles

**Principle 1: Validated Intelligence**
> "Show AI suggestions with real data proof"

- Every suggestion includes confidence score
- Every confidence score backed by real data
- Show what data was used: "8 successful queries by marketing team"
- Allow user to inspect source patterns

**Principle 2: Progressive Enhancement**
> "Start simple, add complexity as needed"

- Default: SQL-first (current experience)
- Optional: dbt project generation
- Advanced: Full AI assistance
- Expert: Custom configuration

**Principle 3: Trust Through Transparency**
> "Explain why, not just what"

- Show reasoning for every suggestion
- Link to organizational patterns
- Display confidence metrics
- Allow manual override always

**Principle 4: Real Data Validation**
> "Use actual execution results, not mocks"

- Validate with Trino EXPLAIN
- Preview with LIMIT 100
- Show real row counts
- Measure real execution times

### 2.2 Proposed Enhancements (Prioritized)

#### Priority 1: Real Data Validation (Week 1-2)

**Goal:** Build trust through real execution results

**Changes:**

1. **Replace MockSQLEngine with Real Trino**
```typescript
// backend/services/trino_service.py
async def validate_sql(sql: string, catalog: string, schema: string):
    # Execute EXPLAIN
    plan = await trino_client.execute(f"EXPLAIN {sql}")

    return {
        valid: True,
        estimatedRows: extract_row_estimate(plan),
        queryPlan: plan,
        warnings: analyze_plan(plan),  # NEW: performance warnings
        executionCost: estimate_cost(plan)  # NEW: cost estimate
    }

async def preview_sql(sql: string, catalog: string, schema: string):
    # Execute with LIMIT
    result = await trino_client.execute(f"{sql} LIMIT 100")

    return {
        columns: result.columns,
        rows: result.rows,
        actualRowCount: result.stats.processedRows,  # Real data!
        executionTimeMs: result.stats.elapsedTimeMs,  # Real time!
        bytesProcessed: result.stats.bytesProcessed   # Real metrics!
    }
```

2. **Enhanced Validation UI**
```typescript
// Show validation with confidence
<Alert variant={validationResult.warnings.length > 0 ? "warning" : "success"}>
  <CheckCircle className="h-4 w-4" />
  <AlertDescription>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>✅ Syntax valid</span>
        <span className="text-xs">Est. {validationResult.estimatedRows.toLocaleString()} rows</span>
      </div>

      {validationResult.warnings.map(warning => (
        <div key={warning.id} className="flex items-start gap-2 text-xs">
          <AlertCircle className="h-3 w-3 mt-0.5" />
          <div>
            <span className="font-medium">{warning.title}</span>
            <p className="text-muted-foreground">{warning.description}</p>
            <Button variant="link" size="sm">View suggestion</Button>
          </div>
        </div>
      ))}
    </div>
  </AlertDescription>
</Alert>
```

**Success Metrics:**
- ✅ 100% of validations use real Trino
- ✅ Preview shows actual data
- ✅ Users see real row counts/times
- ✅ Performance warnings displayed

#### Priority 2: Living Context Graph Integration (Week 3-4)

**Goal:** AI suggestions backed by organizational patterns

**Changes:**

1. **Query Similar Patterns API**
```python
# backend/api/context_routes.py
@router.post("/api/v1/context/suggest-joins")
async def suggest_joins(request: JoinSuggestionRequest):
    # Query Living Context Graph for successful joins
    patterns = kuzu_graph.query("""
        MATCH (p:Product)-[:USES_SOURCE]->(s1:Source {name: $source1})
        MATCH (p)-[:USES_SOURCE]->(s2:Source {name: $source2})
        MATCH (p)-[:HAS_TRANSFORMATION]->(t:Transformation)
        WHERE t.sql CONTAINS $source1 AND t.sql CONTAINS $source2
        RETURN
            t.sql as sql,
            t.joinKeys as joinKeys,
            t.successRate as successRate,
            count(p) as usageCount,
            collect(p.owner) as usedBy
        ORDER BY successRate DESC, usageCount DESC
        LIMIT 5
    """, source1=request.source1, source2=request.source2)

    suggestions = []
    for pattern in patterns:
        suggestions.append({
            joinCondition: extract_join_condition(pattern.sql),
            confidence: pattern.successRate,
            reasoning: f"Used {pattern.usageCount}x by {', '.join(pattern.usedBy)}",
            successRate: pattern.successRate,
            sourceQuery: pattern.sql  # Allow user to inspect
        })

    return { suggestions }
```

2. **Enhanced Smart Defaults with AI**
```typescript
// lib/services/smart-defaults-ai.ts
export async function generateAISmartDefault(
  sources: Source[],
  contractSchema: SchemaField[]
): Promise<AIGeneratedSQL> {
  // Call backend for AI suggestions
  const response = await fetch('/api/v1/context/generate-sql', {
    method: 'POST',
    body: JSON.stringify({
      sources: sources.map(s => ({ name: s.name, columns: s.columns })),
      outputSchema: contractSchema,
      intent: getUserIntent()  // From Step 1
    })
  });

  const { sql, suggestions, confidence } = await response.json();

  return {
    sql,
    confidence,  // 0.0 - 1.0
    reasoning: suggestions.map(s => s.explanation),
    alternatives: suggestions.slice(1),  // Other options
    sourcesUsed: suggestions[0].organizationalPatterns  // Show evidence
  };
}
```

3. **AI Suggestion UI**
```tsx
// Show AI suggestion with transparency
{aiSuggestion && (
  <Card className="bg-blue-50 border-blue-200">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <CardTitle className="text-sm">AI Suggestion</CardTitle>
        <Badge variant="secondary">{Math.round(aiSuggestion.confidence * 100)}% confidence</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="text-sm">
        <p className="font-medium mb-1">Recommended approach:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          {aiSuggestion.reasoning.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => applySuggestion(aiSuggestion.sql)}>
          Apply Suggestion
        </Button>
        <Button size="sm" variant="outline" onClick={() => showAlternatives()}>
          View {aiSuggestion.alternatives.length} Alternatives
        </Button>
        <Button size="sm" variant="ghost" onClick={() => inspectSources()}>
          Inspect Sources
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

**Success Metrics:**
- ✅ 80% of suggestions have >70% confidence
- ✅ Users can see organizational patterns
- ✅ Suggestions include reasoning
- ✅ Alternatives available

#### Priority 3: Full dbt Project Generation (Week 5-6)

**Goal:** Generate complete dbt projects, not just SQL

**Changes:**

1. **Add "Implementation Strategy" Selector**
```tsx
// components/build/steps/Step3ImplementationStrategy.tsx
export function Step3ImplementationStrategy({
  productDefinition,
  selectedSources,
  schema,
  onComplete
}: Props) {
  const [strategy, setStrategy] = useState<'sql' | 'dbt-project' | 'sqlmesh'>('sql');
  const aiRecommendation = useAIRecommendation(productDefinition, selectedSources);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose Implementation Approach</CardTitle>
          <CardDescription>
            Based on your selections, we recommend a strategy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Recommendation */}
          {aiRecommendation && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Recommended:</span> {aiRecommendation.strategy}
                <br />
                <span className="text-xs text-muted-foreground">
                  {aiRecommendation.reasoning}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Strategy Options */}
          <RadioGroup value={strategy} onValueChange={setStrategy}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sql" />
              <Label className="flex-1">
                <div className="font-medium">Quick SQL</div>
                <div className="text-xs text-muted-foreground">
                  Write SQL, we'll wrap in dbt later (8 min)
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dbt-project" />
              <Label className="flex-1">
                <div className="font-medium">Full dbt Project ⭐ Recommended</div>
                <div className="text-xs text-muted-foreground">
                  Pre-configured dbt project with staging, tests, docs (15 min)
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sqlmesh" />
              <Label className="flex-1">
                <div className="font-medium">SQLMesh Project (Advanced)</div>
                <div className="text-xs text-muted-foreground">
                  Time-travel, versioning, advanced features (20 min)
                </div>
              </Label>
            </div>
          </RadioGroup>

          <Button onClick={() => navigateToStrategy(strategy)}>
            Continue with {strategy}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

2. **dbt Project Template Engine**
```typescript
// lib/templates/dbt-templates.ts
export interface DbtProjectTemplate {
  id: string;
  name: string;  // "Customer 360"
  description: string;
  requiredSources: number;
  patterns: {
    keywords: string[];  // "customer", "360", "unified"
    sourceTypes: string[];  // "dimension", "fact"
  };
  generate: (context: GenerationContext) => DbtProject;
}

export interface DbtProject {
  structure: {
    'models/staging/': Record<string, string>;
    'models/intermediate/': Record<string, string>;
    'models/marts/': Record<string, string>;
    'sources.yml': string;
    'schema.yml': string;
    'dbt_project.yml': string;
  };
  todos: DbtTodo[];  // Placeholders for user completion
  aiSuggestions: Record<string, AISuggestion[]>;  // Per-TODO suggestions
}

export interface DbtTodo {
  id: string;
  file: string;
  line: number;
  description: string;
  aiSuggestions: AISuggestion[];
  required: boolean;
}
```

3. **dbt Project Builder UI**
```tsx
// components/build/steps/Step3DbtProjectBuilder.tsx
// Three-panel layout:
// Left: Project structure tree
// Center: Code editor with TODO highlighting
// Right: TODO list with AI suggestions

<div className="grid grid-cols-[300px,1fr,350px] gap-4 h-[800px]">
  {/* Left: Project Structure */}
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">Project Structure</CardTitle>
    </CardHeader>
    <CardContent>
      <TreeView>
        <TreeNode icon={Folder} label="models">
          <TreeNode icon={Folder} label="staging">
            <TreeNode icon={FileCode} label="stg_customers.sql" status="complete" />
            <TreeNode icon={FileCode} label="stg_orders.sql" status="complete" />
          </TreeNode>
          <TreeNode icon={Folder} label="marts">
            <TreeNode icon={FileCode} label="customer_360.sql" status="incomplete">
              <Badge variant="warning">2 TODOs</Badge>
            </TreeNode>
          </TreeNode>
        </TreeNode>
      </TreeView>
    </CardContent>
  </Card>

  {/* Center: Code Editor */}
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">customer_360.sql</CardTitle>
    </CardHeader>
    <CardContent>
      <CodeMirror
        value={currentFile}
        extensions={[
          sql(),
          todoHighlighter(),  // Highlight TODO comments
          aiSuggestionHints()  // Inline AI hints
        ]}
      />
    </CardContent>
  </Card>

  {/* Right: TODO List */}
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">TODOs: 2 remaining</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {todos.map(todo => (
        <div key={todo.id} className="border rounded-lg p-3">
          <div className="font-medium text-sm mb-1">{todo.description}</div>
          <div className="text-xs text-muted-foreground mb-2">
            {todo.file}:{todo.line}
          </div>

          {todo.aiSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium">AI Suggestions:</div>
              {todo.aiSuggestions.map((suggestion, i) => (
                <div key={i} className="bg-blue-50 p-2 rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span>{Math.round(suggestion.confidence * 100)}% confidence</span>
                    <Button size="sm" variant="ghost" onClick={() => applySuggestion(todo.id, suggestion)}>
                      Apply
                    </Button>
                  </div>
                  <code className="block">{suggestion.code}</code>
                  <div className="text-muted-foreground mt-1">{suggestion.reasoning}</div>
                </div>
              ))}
            </div>
          )}

          <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => jumpToTodo(todo)}>
            Jump to Code
          </Button>
        </div>
      ))}
    </CardContent>
  </Card>
</div>
```

**Success Metrics:**
- ✅ Users can generate full dbt projects
- ✅ 70% complete auto-generation
- ✅ TODOs have AI suggestions
- ✅ 90% of users complete TODOs in <20 min

#### Priority 4: Inline AI Assistance (Week 7-8)

**Goal:** Copilot-style code completion during editing

**Changes:**

1. **CodeMirror AI Extension**
```typescript
// lib/codemirror/ai-completion.ts
export function aiCompletion(options: AICompletionOptions) {
  return autocompletion({
    override: [
      async (context) => {
        const { state, pos } = context;
        const linePrefix = state.doc.lineAt(pos).text.slice(0, pos);

        // Call AI completion API
        const suggestions = await fetch('/api/v1/ai/complete-sql', {
          method: 'POST',
          body: JSON.stringify({
            sql: state.doc.toString(),
            cursorPosition: pos,
            context: {
              sources: options.sources,
              schema: options.schema,
              organizationalPatterns: true  // Include patterns from LCG
            }
          })
        }).then(r => r.json());

        return {
          from: pos,
          options: suggestions.map(s => ({
            label: s.text,
            type: s.type,  // keyword, column, table, function
            detail: s.confidence ? `${Math.round(s.confidence * 100)}% confidence` : undefined,
            info: s.reasoning,  // Show in popup
            apply: s.text
          }))
        };
      }
    ]
  });
}
```

2. **AI Completion Backend**
```python
# backend/services/ai_completion_service.py
class SQLCompletionService:
    def complete(self, sql: str, cursor_pos: int, context: dict) -> List[Completion]:
        # Parse SQL to understand context
        parsed = parse_sql(sql)
        cursor_context = get_cursor_context(parsed, cursor_pos)

        # Query Living Context Graph for patterns
        if cursor_context.type == 'join_condition':
            patterns = self.kuzu.query_join_patterns(
                source1=cursor_context.table1,
                source2=cursor_context.table2
            )

            completions = []
            for pattern in patterns:
                completions.append({
                    text: pattern.joinCondition,
                    confidence: pattern.successRate,
                    reasoning: f"Used {pattern.usageCount}x in your org",
                    type: 'join'
                })

            return completions

        elif cursor_context.type == 'select_column':
            # Suggest columns from organizational patterns
            common_columns = self.kuzu.query_common_columns(
                sources=context['sources'],
                outputSchema=context['schema']
            )

            return [
                {
                    text: col.name,
                    confidence: col.frequency,
                    reasoning: f"Used in {col.productCount} similar products",
                    type: 'column'
                }
                for col in common_columns
            ]
```

**Success Metrics:**
- ✅ AI suggestions appear as user types
- ✅ Suggestions have confidence scores
- ✅ Users can see reasoning
- ✅ 60% acceptance rate for suggestions

#### Priority 5: Multi-Level Validation (Week 9-10)

**Goal:** Beyond syntax - validate performance, quality, security

**Changes:**

1. **Comprehensive Validation Service**
```python
# backend/services/validation_service.py
class ComprehensiveValidator:
    async def validate(self, sql: str, context: dict) -> ValidationResult:
        results = await asyncio.gather(
            self.validate_syntax(sql),
            self.validate_performance(sql),
            self.validate_quality(sql, context),
            self.validate_security(sql, context),
            self.validate_best_practices(sql)
        )

        return {
            syntax: results[0],
            performance: results[1],
            quality: results[2],
            security: results[3],
            bestPractices: results[4],
            overallStatus: calculate_status(results)
        }

    async def validate_performance(self, sql: str) -> PerformanceValidation:
        plan = await self.trino.explain(sql)

        warnings = []

        # Check for full table scans
        if 'TableScan' in plan and 'Filter' not in plan:
            warnings.append({
                level: 'warning',
                title: 'Full table scan detected',
                description: 'Query will scan entire table. Consider adding WHERE clause.',
                suggestion: 'Add: WHERE created_at >= CURRENT_DATE - INTERVAL \'30\' DAY',
                impact: 'High query cost and slow execution'
            })

        # Check for missing indexes
        if self.missing_index_detected(plan):
            warnings.append({
                level: 'info',
                title: 'Index could improve performance',
                description: 'Creating index on join columns would speed up query',
                suggestion: 'Contact platform team to create index'
            })

        return { warnings, estimatedCost: calculate_cost(plan) }

    async def validate_quality(self, sql: str, context: dict) -> QualityValidation:
        warnings = []

        # Check for aggregations without filters
        if has_aggregation(sql) and not has_where_clause(sql):
            warnings.append({
                level: 'warning',
                title: 'Aggregation without time filter',
                description: 'Aggregating entire history may be slow',
                suggestion: 'Add time-based filter for better performance'
            })

        # Check schema alignment
        output_schema = extract_output_schema(sql)
        expected_schema = context['contractSchema']

        missing_columns = set(expected_schema) - set(output_schema)
        if missing_columns:
            warnings.append({
                level: 'error',
                title: 'Missing required columns',
                description: f'Contract requires: {", ".join(missing_columns)}',
                suggestion: 'Add missing columns to SELECT statement'
            })

        return { warnings }

    async def validate_security(self, sql: str, context: dict) -> SecurityValidation:
        warnings = []

        # Check for missing row-level security
        if not has_row_filter(sql, context['userRole']):
            warnings.append({
                level: 'error',
                title: 'Missing row-level security filter',
                description: 'Query must include tenant_id or user_id filter',
                suggestion: 'Add: WHERE tenant_id = current_tenant()'
            })

        return { warnings }
```

2. **Validation UI with Levels**
```tsx
// Show multi-level validation results
<Tabs defaultValue="all">
  <TabsList>
    <TabsTrigger value="all">All ({totalIssues})</TabsTrigger>
    <TabsTrigger value="errors">
      Errors ({errorCount}) {errorCount > 0 && <AlertCircle className="h-3 w-3 text-red-500" />}
    </TabsTrigger>
    <TabsTrigger value="warnings">
      Warnings ({warningCount})
    </TabsTrigger>
    <TabsTrigger value="info">
      Info ({infoCount})
    </TabsTrigger>
  </TabsList>

  <TabsContent value="all">
    {validationResult.syntax.warnings.map(w => <ValidationItem {...w} category="Syntax" />)}
    {validationResult.performance.warnings.map(w => <ValidationItem {...w} category="Performance" />)}
    {validationResult.quality.warnings.map(w => <ValidationItem {...w} category="Quality" />)}
    {validationResult.security.warnings.map(w => <ValidationItem {...w} category="Security" />)}
  </TabsContent>
</Tabs>
```

**Success Metrics:**
- ✅ Multi-level validation implemented
- ✅ Users see performance warnings
- ✅ Security issues caught before deploy
- ✅ 90% of issues have actionable suggestions

---

## Part 3: Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Real data validation

- Week 1: Trino integration for EXPLAIN
- Week 2: Real query preview with LIMIT 100
- Success: 100% validation uses real execution

### Phase 2: Intelligence (Weeks 3-4)
**Goal:** AI suggestions from organizational patterns

- Week 3: Living Context Graph queries
- Week 4: AI-powered smart defaults
- Success: 80% suggestions have >70% confidence

### Phase 3: dbt Projects (Weeks 5-6)
**Goal:** Full project generation

- Week 5: Implementation strategy selector
- Week 6: dbt template engine + builder UI
- Success: Users can generate complete dbt projects

### Phase 4: Inline AI (Weeks 7-8)
**Goal:** Copilot-style assistance

- Week 7: CodeMirror AI completion extension
- Week 8: Backend completion service
- Success: 60% acceptance rate for suggestions

### Phase 5: Comprehensive Validation (Weeks 9-10)
**Goal:** Multi-level validation

- Week 9: Performance + quality validators
- Week 10: Security + best practices
- Success: 90% of issues have suggestions

---

## Part 4: Success Metrics

### User Confidence
- ✅ 90%+ trust in AI suggestions
- ✅ 85%+ find suggestions helpful
- ✅ 70%+ accept AI suggestions

### Speed
- ✅ Maintain 8-15 min completion time
- ✅ 50%+ faster with AI assistance
- ✅ 90%+ reduction in errors

### Quality
- ✅ 95%+ of SQL validated against real data
- ✅ 80%+ of queries optimized
- ✅ 100% security validation

### Adoption
- ✅ 60%+ choose dbt project generation
- ✅ 80%+ use AI suggestions
- ✅ 40%+ use inline completion

---

## Conclusion

Step 3 has a strong foundation but needs enhancement to build user confidence through validated data. By integrating real Trino validation, Living Context Graph patterns, and transparent AI suggestions, we can transform it into an intelligent assistant that accelerates while maintaining trust.

**Key Principles:**
1. Real data validation builds confidence
2. AI suggestions must be transparent
3. Keep linear workflow (no notebooks!)
4. Progressive enhancement for all skill levels

**Next Steps:**
1. Implement Phase 1 (Real validation) - highest priority
2. Add Living Context Graph integration
3. Build dbt project templates
4. Launch with metrics tracking

---

**Document Version:** 1.0
**Last Updated:** 2025-10-16
**Status:** Ready for Implementation
