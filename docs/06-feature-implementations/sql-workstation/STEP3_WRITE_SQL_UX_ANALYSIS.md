# Step 3: Write SQL - Critical UX Analysis & Phased Enhancement Approach

## Executive Summary

The current Write SQL step is a basic code editor with minimal scaffolding. It fails to leverage organizational SQL knowledge, doesn't accommodate different skill levels, and **critically misses the opportunity to integrate our own tiSQL AI-powered SQL assistant** built with CrewAI agents and Vultr LLM inference API. This analysis proposes a phased approach to transform Step 3 into an **intelligent SQL development environment** that integrates tiSQL, leverages organizational knowledge, and serves all personas.

---

## Current State Analysis

### What Exists Today

**Components:**
- Basic CodeMirror SQL editor (400px height)
- Real-time syntax validation (debounced 1s)
- 3 static templates (Aggregation, Dedupe, SCD Type 2)
- Sample data preview (100 rows)
- Source context display
- Navigation buttons

**Flow:**
```
1. User lands on blank editor
2. Can load 1 of 3 templates
3. Writes SQL manually
4. Gets syntax validation
5. Tests on sample data
6. Continues to quality rules
```

### Infrastructure We Already Have

**✅ Vultr LLM Inference API:**
- `VultrLLMAdapter` in `/backend/services/vultr_llm_adapter.py`
- OpenAI-compatible chat completions
- Model: `qwen2.5-coder-32b-instruct` (optimized for code/SQL)
- Structured JSON response support
- Batch processing capabilities
- Already integrated and tested

**✅ CrewAI Agent Framework:**
- `CrewIntelligenceService` in `/backend/services/crew_intelligence.py`
- Specialized agents: Quality, Architecture, Business Context
- Task orchestration and crew management
- Already powering quality recommendations

**❌ tiSQL SQL Intelligence Agent:**
- **NOT YET CREATED** - This is the critical gap
- Should leverage existing Vultr + CrewAI infrastructure
- Would provide NL to SQL, optimization, debugging
- Perfect fit with our agent-based architecture

### Critical Gaps

#### 1. **No tiSQL Integration** ❌ CRITICAL MISSED OPPORTUNITY
- We have Vultr LLM API + CrewAI framework
- We DON'T have SQL-specific CrewAI agents
- No natural language to SQL capability
- No AI-powered query optimization
- No intelligent debugging assistance
- **This is all infrastructure we already paid for and built**

#### 2. **No Query Library Integration** ❌
- Existing `SavedQueryBrowser.tsx` component exists but not integrated
- No access to organizational SQL knowledge
- Users repeat work already done by others
- Best practices not discoverable

#### 3. **Poor Persona Support** ❌

**Data Analyst (10% users):**
- Expected: Natural language → SQL generation
- Reality: Must write SQL manually (skill gap)
- **tiSQL could solve this using our Vultr LLM**

**Analytics Engineer (20% users):**
- Expected: dbt-specific templates, smart defaults
- Reality: Generic templates only

**Data Engineer (30% users + 40% senior):**
- Expected: Query history, optimization suggestions, reuse
- Reality: Start from scratch every time

#### 4. **No Progressive Development** ❌
- Can't start simple and iterate
- No explore → develop workflow
- No incremental complexity

#### 5. **Limited Testing Capabilities** ❌
- Only 100-row sample preview
- No execution plan analysis
- No performance metrics
- No cost estimation

#### 6. **Missing Context Awareness** ❌
- Doesn't use selected sources intelligently
- No automatic schema hints
- No join path suggestions
- Doesn't leverage data product contract

---

## tiSQL: Our SQL Intelligence System

### Proposed Architecture

**tiSQL = CrewAI SQL Agents + Vultr LLM Inference**

```python
# backend/services/tisql_service.py

from crewai import Agent, Task, Crew
from .vultr_llm_adapter import get_vultr_adapter

class TiSQLService:
    """
    tiSQL: Our intelligent SQL assistant powered by CrewAI and Vultr LLM
    """

    def __init__(self):
        self.llm = get_vultr_adapter()
        self._setup_agents()

    def _setup_agents(self):
        """Initialize specialized SQL agents"""

        # SQL Generation Agent - Converts natural language to SQL
        self.sql_generation_agent = Agent(
            role="Senior SQL Developer",
            goal="Generate accurate SQL queries from natural language descriptions",
            backstory="""You are an expert SQL developer with 15+ years of experience.
            You understand complex join patterns, window functions, CTEs, and performance
            optimization. You generate clean, efficient, well-documented SQL that follows
            best practices. You specialize in analytical queries for data products.""",
            llm=self.llm,
            verbose=True
        )

        # SQL Optimization Agent - Improves query performance
        self.optimization_agent = Agent(
            role="Database Performance Engineer",
            goal="Optimize SQL queries for performance, cost, and maintainability",
            backstory="""You are a database performance expert who has optimized thousands
            of queries. You understand query plans, indexing strategies, partition pruning,
            and cost-based optimization. You can spot N+1 queries, missing filters, and
            inefficient joins instantly. You recommend specific, actionable improvements
            with estimated performance gains.""",
            llm=self.llm,
            verbose=True
        )

        # SQL Debugging Agent - Fixes errors and explains issues
        self.debugging_agent = Agent(
            role="Senior Database Troubleshooter",
            goal="Debug SQL errors and explain issues in plain English",
            backstory="""You are a SQL troubleshooting expert who has seen every error
            message and knows the fixes. You explain errors clearly to both beginners
            and experts. You provide specific fixes with line numbers and explain why
            the error occurred. You're patient and educational.""",
            llm=self.llm,
            verbose=True
        )

        # dbt Conversion Agent - Converts SQL to dbt models
        self.dbt_agent = Agent(
            role="dbt Analytics Engineer",
            goal="Convert raw SQL to dbt models with proper materialization and testing",
            backstory="""You are a dbt expert who builds production-grade data models.
            You know when to use incremental vs. table materialization, how to structure
            ref() dependencies, and what tests to add. You generate complete dbt models
            with config blocks, documentation, and tests.""",
            llm=self.llm,
            verbose=True
        )

        # Schema Intelligence Agent - Understands table schemas and relationships
        self.schema_agent = Agent(
            role="Data Architect",
            goal="Understand table schemas, relationships, and suggest optimal joins",
            backstory="""You are a data architect who can analyze table schemas and
            identify join keys, foreign key relationships, and optimal join patterns.
            You suggest which tables to join, in what order, and which columns to select
            based on the desired output.""",
            llm=self.llm,
            verbose=True
        )
```

### tiSQL Capabilities

#### 1. Natural Language to SQL
```python
async def generate_sql_from_nl(
    self,
    natural_language: str,
    available_tables: List[Dict],
    desired_output: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Generate SQL from natural language using CrewAI SQL agent
    """
    task = Task(
        description=f"""
        Generate SQL query based on this request:
        {natural_language}

        Available tables:
        {json.dumps(available_tables, indent=2)}

        Desired output columns:
        {json.dumps(desired_output, indent=2) if desired_output else 'Not specified'}

        Requirements:
        - Use proper joins based on table relationships
        - Include all desired output columns
        - Add appropriate WHERE clauses for filtering
        - Include ORDER BY for deterministic results
        - Add comments explaining complex logic
        - Follow SQL best practices
        """,
        agent=self.sql_generation_agent,
        expected_output="Valid SQL query with explanatory comments"
    )

    crew = Crew(
        agents=[self.sql_generation_agent, self.schema_agent],
        tasks=[task],
        verbose=True
    )

    result = crew.kickoff()

    return {
        "sql": self._extract_sql(result),
        "explanation": self._extract_explanation(result),
        "confidence": 0.9,
        "agent_used": "sql_generation_agent"
    }
```

#### 2. SQL Optimization
```python
async def optimize_sql(
    self,
    sql: str,
    execution_stats: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Optimize SQL query using CrewAI optimization agent
    """
    task = Task(
        description=f"""
        Optimize this SQL query for performance:

        Current SQL:
        ```sql
        {sql}
        ```

        Current execution stats:
        {json.dumps(execution_stats, indent=2) if execution_stats else 'Not available'}

        Provide:
        1. Optimized SQL with specific improvements
        2. Explanation of each optimization
        3. Estimated performance improvement (%)
        4. Any risks or trade-offs

        Common optimizations to consider:
        - Filter pushdown (WHERE before JOIN)
        - Partition pruning
        - Index hints
        - CTE optimization
        - Join order
        - Predicate pushdown
        """,
        agent=self.optimization_agent,
        expected_output="Optimized SQL with performance analysis"
    )

    crew = Crew(
        agents=[self.optimization_agent],
        tasks=[task],
        verbose=True
    )

    result = crew.kickoff()

    return {
        "optimized_sql": self._extract_sql(result),
        "improvements": self._extract_improvements(result),
        "estimated_speedup": self._extract_speedup(result),
        "explanation": self._extract_explanation(result)
    }
```

#### 3. SQL Debugging
```python
async def debug_sql(
    self,
    sql: str,
    error_message: str,
    line_number: Optional[int] = None
) -> Dict[str, Any]:
    """
    Debug SQL error using CrewAI debugging agent
    """
    task = Task(
        description=f"""
        Debug this SQL error:

        SQL:
        ```sql
        {sql}
        ```

        Error message:
        {error_message}

        Line number: {line_number if line_number else 'Unknown'}

        Provide:
        1. Clear explanation of the error (what went wrong)
        2. Specific fix with corrected SQL
        3. Why this error occurred
        4. How to prevent similar errors

        Be educational and explain in plain English.
        """,
        agent=self.debugging_agent,
        expected_output="Error explanation and fixed SQL"
    )

    crew = Crew(
        agents=[self.debugging_agent],
        tasks=[task],
        verbose=True
    )

    result = crew.kickoff()

    return {
        "error_explanation": self._extract_explanation(result),
        "fixed_sql": self._extract_sql(result),
        "fix_explanation": self._extract_fix_explanation(result),
        "confidence": 0.85
    }
```

#### 4. dbt Conversion
```python
async def convert_to_dbt(
    self,
    sql: str,
    model_name: str,
    materialization: str = "table"
) -> Dict[str, Any]:
    """
    Convert raw SQL to dbt model using CrewAI dbt agent
    """
    task = Task(
        description=f"""
        Convert this SQL to a dbt model:

        SQL:
        ```sql
        {sql}
        ```

        Model name: {model_name}
        Materialization: {materialization}

        Generate complete dbt model with:
        1. Config block with materialization, tags, schema
        2. Proper {{{{ ref() }}}} syntax for source tables
        3. Incremental logic if applicable
        4. Column-level documentation in schema.yml
        5. Suggested tests (unique, not_null, relationships)
        6. Any necessary macros

        Follow dbt best practices.
        """,
        agent=self.dbt_agent,
        expected_output="Complete dbt model file and schema.yml"
    )

    crew = Crew(
        agents=[self.dbt_agent],
        tasks=[task],
        verbose=True
    )

    result = crew.kickoff()

    return {
        "dbt_model": self._extract_dbt_model(result),
        "schema_yml": self._extract_schema_yml(result),
        "tests": self._extract_tests(result),
        "explanation": self._extract_explanation(result)
    }
```

#### 5. Smart Join Suggestions
```python
async def suggest_joins(
    self,
    selected_tables: List[Dict],
    desired_columns: List[str]
) -> Dict[str, Any]:
    """
    Suggest optimal join strategy using CrewAI schema agent
    """
    task = Task(
        description=f"""
        Analyze these tables and suggest optimal join strategy:

        Tables:
        {json.dumps(selected_tables, indent=2)}

        Desired output columns:
        {desired_columns}

        Provide:
        1. Recommended join order and type (INNER, LEFT, etc.)
        2. Join keys and relationships
        3. Potential issues (cardinality, fan-out)
        4. SQL template with suggested joins
        """,
        agent=self.schema_agent,
        expected_output="Join strategy with SQL template"
    )

    crew = Crew(
        agents=[self.schema_agent],
        tasks=[task],
        verbose=True
    )

    result = crew.kickoff()

    return {
        "join_strategy": self._extract_join_strategy(result),
        "sql_template": self._extract_sql(result),
        "warnings": self._extract_warnings(result)
    }
```

### tiSQL Integration into Step 3

```
┌─────────────────────────────────────────────────────┐
│ Step 3: Write SQL (with tiSQL)                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Code Editor | tiSQL Assistant | Query Library]    │
│                                                     │
│ Code Editor Tab:                                    │
│ ┌─────────────────────────────────────────────┐    │
│ │ SELECT                                       │    │
│ │   c.customer_id,                             │    │
│ │   c.email,                                   │    │
│ │   SUM(o.total) as revenue    <-- ⌘+I hint   │    │
│ │ FROM customers c                             │    │
│ │                                              │    │
│ │ 💡 Press ⌘+I for tiSQL assistance           │    │
│ │                                              │    │
│ │ [When user presses ⌘+I]                      │    │
│ │ ┌────────────────────────────────────┐       │    │
│ │ │ 🤖 tiSQL AI Assistant              │       │    │
│ │ │    (Powered by CrewAI + Vultr)     │       │    │
│ │ │                                    │       │    │
│ │ │ What can I help you with?          │       │    │
│ │ │                                    │       │    │
│ │ │ • Generate SQL from description    │       │    │
│ │ │ • Optimize this query              │       │    │
│ │ │ • Debug error                      │       │    │
│ │ │ • Convert to dbt model             │       │    │
│ │ │ • Suggest joins for selected tables│       │    │
│ │ │                                    │       │    │
│ │ │ Or type your request:              │       │    │
│ │ │ [________________________]         │       │    │
│ │ └────────────────────────────────────┘       │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ tiSQL-generated SQL appears with:                   │
│ ✅ SQL code                                         │
│ 📝 Explanation of what it does                      │
│ 💡 Confidence score                                 │
│ 🔧 [Accept] [Refine] [Discard] [Ask tiSQL]         │
└─────────────────────────────────────────────────────┘
```

---

## Persona Workflows with tiSQL

### Workflow 1: Data Analyst - "I need customer revenue"
```
User: Clicks on Step 3
User: Presses ⌘+I
User: Types: "Show me total revenue by customer for 2024"

tiSQL SQL Generation Agent (via Vultr LLM):
- Analyzes selected tables (customers, orders)
- Understands "revenue" = SUM(total_amount)
- Knows "by customer" = GROUP BY customer_id
- Generates:

SELECT
  c.customer_id,
  c.email,
  c.first_name,
  c.last_name,
  SUM(o.total_amount) as total_revenue,
  COUNT(o.order_id) as order_count
FROM {{ ref('customers') }} c
LEFT JOIN {{ ref('orders') }} o
  ON c.customer_id = o.customer_id
WHERE YEAR(o.order_date) = 2024
GROUP BY c.customer_id, c.email, c.first_name, c.last_name
ORDER BY total_revenue DESC;

-- Explanation:
-- This query joins customers with their 2024 orders and calculates
-- total revenue and order count per customer. LEFT JOIN ensures we
-- include customers with zero orders in 2024.

User: Clicks [Accept]
User: Clicks [Test on Sample Data]
User: Sees results, clicks [Continue]

Time: 2 minutes (vs 30+ minutes manually)
Success rate: 95%
```

### Workflow 2: Analytics Engineer - "Build dbt incremental model"
```
User: Writes base SQL query
User: Presses ⌘+I
User: Types: "Convert this to dbt incremental model"

tiSQL dbt Agent:
- Analyzes SQL structure
- Identifies good candidate for incremental (has timestamp)
- Generates complete dbt model:

{{
  config(
    materialized='incremental',
    unique_key='customer_id',
    on_schema_change='fail',
    tags=['customer', 'analytics', 'daily']
  )
}}

WITH base AS (
  SELECT
    customer_id,
    email,
    SUM(total_amount) as lifetime_value,
    MAX(order_date) as last_order_date,
    updated_at
  FROM {{ ref('orders') }}
  {% if is_incremental() %}
    WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
  {% endif %}
  GROUP BY customer_id, email, updated_at
)

SELECT * FROM base

-- Also generates schema.yml:
# models/schema.yml
version: 2
models:
  - name: customer_lifetime_value
    description: Incremental model tracking customer LTV
    columns:
      - name: customer_id
        description: Unique customer identifier
        tests:
          - unique
          - not_null
      - name: lifetime_value
        description: Total revenue from customer
        tests:
          - not_null

User: Reviews, clicks [Accept]
User: Saves to team library

Time: 5 minutes (vs 45+ minutes manually)
```

### Workflow 3: Data Engineer - "Optimize slow query"
```
User: Runs query → 8.3 seconds
User: Presses ⌘+I
User: Types: "Optimize this query - it's too slow"

tiSQL Optimization Agent:
- Analyzes query structure
- Identifies bottlenecks:
  * JOIN before WHERE filter (full table scan)
  * Missing partition filter on order_date
  * No index hint on join key
- Generates optimized version:

-- OPTIMIZED VERSION (estimated 65% faster)

SELECT
  c.customer_id,
  c.email,
  SUM(o.total_amount) as revenue
FROM {{ ref('customers') }} c
JOIN (
  -- Apply filter BEFORE join to reduce rows
  SELECT customer_id, total_amount
  FROM {{ ref('orders') }}
  WHERE order_date >= '2024-01-01'  -- Partition pruning
    AND order_date < '2025-01-01'
) o ON c.customer_id = o.customer_id
WHERE c.active = true  -- Filter customers early
GROUP BY c.customer_id, c.email
ORDER BY revenue DESC;

-- Improvements:
-- 1. Filter orders by date BEFORE join (reduces join input by 75%)
-- 2. Added partition pruning on order_date (scans 1 year not 5 years)
-- 3. Filter active customers before join (reduces customer rows)
-- 4. Subquery ensures filters applied before expensive operations
--
-- Estimated performance: 2.9s (down from 8.3s) = 65% faster
-- Estimated cost: $0.012 (down from $0.034) = 65% cheaper

User: Clicks [Test Optimized Version]
System: Runs both queries side-by-side
System: Shows actual improvement: 68% faster, 62% cheaper

User: Clicks [Accept Optimized]

Time: 3 minutes (vs 45+ minutes manual optimization)
Improvement: 68% faster
```

### Workflow 4: Senior Data Engineer - "Debug complex CTE error"
```
User: Writes complex query with CTEs
System: Validation error: "Column 'revenue' does not exist"

tiSQL Debugging Agent (auto-triggered):
- Analyzes error
- Identifies issue: Using column alias in WHERE (not allowed in SQL)
- Generates fix:

❌ ISSUE FOUND (Line 18):
WHERE revenue > 1000  -- Can't use alias in WHERE

✅ FIX:
HAVING SUM(total_amount) > 1000  -- Use aggregate in HAVING

📝 EXPLANATION:
In SQL, column aliases defined in SELECT can't be used in WHERE clause
because WHERE is evaluated BEFORE SELECT. Instead:
- Use HAVING for aggregate filters (after GROUP BY)
- Or repeat the expression in WHERE
- Or use a CTE/subquery

🔧 CORRECTED QUERY:
SELECT
  customer_id,
  SUM(total_amount) as revenue
FROM orders
GROUP BY customer_id
HAVING SUM(total_amount) > 1000  -- ✓ Correct
ORDER BY revenue DESC;

User: Clicks [Apply Fix]
System: Validates → Success
User: Continues working

Time: 30 seconds (vs 10+ minutes researching error)
```

---

## Proposed Phased Approach

### Phase 1: tiSQL Core + Query Library (Weeks 1-2)
**Goal:** Build tiSQL SQL agents and integrate with ⌘+I shortcut

#### 1.1 Build tiSQL Service ✨ HIGHEST PRIORITY

**Create tiSQL CrewAI Agents:**
```
backend/services/tisql_service.py:
  - TiSQLService class
  - 5 specialized agents:
    * SQL Generation Agent (NL → SQL)
    * Optimization Agent (performance tuning)
    * Debugging Agent (error fixing)
    * dbt Agent (dbt conversion)
    * Schema Agent (join suggestions)
  - Integration with VultrLLMAdapter
  - Task orchestration with CrewAI
```

**API Endpoints:**
```
POST /api/tisql/generate     - NL to SQL
POST /api/tisql/optimize     - Optimize query
POST /api/tisql/debug        - Debug error
POST /api/tisql/to-dbt       - Convert to dbt
POST /api/tisql/suggest-joins - Join strategy
```

**Frontend Integration:**
```
components/build/TiSQLAssistant.tsx:
  - ⌘+I / Ctrl+I keyboard shortcut
  - AI prompt modal
  - Accept/Refine/Discard UI
  - Explanation display
  - Confidence scoring

components/build/TiSQLSuggestionPanel.tsx:
  - Inline tiSQL suggestions
  - Diff view (before/after)
  - Performance predictions
```

#### 1.2 Saved Query Browser Integration

**Features:**
- Integrate existing `SavedQueryBrowser.tsx`
- "Modify with tiSQL" button
- Filter by selected sources
- One-click load and fork

**UI:**
```
┌─────────────────────────────────────────────────────┐
│ 📚 Query Library                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📄 customer_lifetime_value                          │
│    127 runs · 98.5% success · 1.2s avg             │
│    [Load] [Fork] [Modify with tiSQL 🤖]            │
│                                                     │
│ When "Modify with tiSQL" clicked:                   │
│ → Loads query into editor                          │
│ → Opens tiSQL: "How would you like to modify?"     │
│ → User: "Add churn risk scoring"                   │
│ → tiSQL generates modified version                 │
└─────────────────────────────────────────────────────┘
```

#### 1.3 Smart Default Generation

**tiSQL-Powered Smart Defaults:**
```python
async def generate_smart_default(sources, contract):
    """Use tiSQL to generate starting SQL"""
    prompt = f"""
    Generate SQL that:
    - Joins tables: {[s.name for s in sources]}
    - Produces columns: {[c.name for c in contract.schema]}
    - Uses proper join keys based on schema
    - Follows dbt ref() syntax
    """

    return await tisql.generate_sql_from_nl(
        natural_language=prompt,
        available_tables=sources,
        desired_output=contract.schema
    )
```

**Phase 1 Success Metrics:**
- ✅ tiSQL service operational with 5 agents
- ✅ 70% of users try tiSQL (⌘+I)
- ✅ 65% acceptance rate for tiSQL-generated SQL
- ✅ 40% browse saved queries
- ✅ 60% reduction in time to first SQL

---

### Phase 2: Context-Aware tiSQL (Weeks 3-4)
**Goal:** Make tiSQL understand full context and enable multi-turn conversations

#### 2.1 Enhanced Context Passing

**Context Data Structure:**
```typescript
const tiSQLContext = {
  // From Step 2
  selectedSources: sources.map(s => ({
    name: s.name,
    columns: s.columns,
    primaryKey: s.primaryKey,
    sampleData: s.sampleData  // First 10 rows
  })),

  // From Step 1
  dataProduct: {
    name: contract.name,
    description: contract.description,
    expectedSchema: contract.schema,
    qualityRules: contract.quality_rules
  },

  // Current state
  currentSQL: sqlCode,
  validationErrors: errors,

  // User context
  userRole: 'analytics_engineer',
  pastQueries: userHistory.slice(0, 5),

  // Organizational patterns
  commonPatterns: learnedPatterns
};
```

**Pass to tiSQL Agents:**
```python
async def generate_sql_with_context(
    self,
    instruction: str,
    context: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate SQL with full workflow context"""

    # Enhance prompt with context
    enriched_prompt = f"""
    User request: {instruction}

    Available tables and sample data:
    {self._format_tables_with_samples(context['selectedSources'])}

    Data product contract:
    - Name: {context['dataProduct']['name']}
    - Expected columns: {context['dataProduct']['expectedSchema']}

    Current SQL (if any):
    {context['currentSQL']}

    User role: {context['userRole']}
    Common organizational patterns: {context['commonPatterns']}

    Generate SQL that matches the contract and follows our patterns.
    """

    # Rest of generation logic...
```

#### 2.2 Multi-Turn Conversations

**Conversation History:**
```typescript
const [tiSQLHistory, setTiSQLHistory] = useState<Message[]>([]);

const handleTiSQLRequest = async (instruction: string) => {
  const response = await tiSQL.generate({
    instruction,
    currentSQL: sqlCode,
    history: tiSQLHistory,
    context: tiSQLContext
  });

  // Update history
  setTiSQLHistory([
    ...tiSQLHistory,
    { role: 'user', content: instruction },
    { role: 'assistant', content: response.sql, explanation: response.explanation }
  ]);
};
```

**Example Conversation:**
```
User: ⌘+I "Generate customer revenue query"
tiSQL: [Generates base query]

User: ⌘+I "Add monthly grouping"
tiSQL: [Modifies to add DATE_TRUNC('month', ...)]

User: ⌘+I "Only show customers with >5 orders"
tiSQL: [Adds HAVING clause]

User: [Accept]
```

#### 2.3 Proactive tiSQL Suggestions

**Trigger-Based Suggestions:**
```typescript
// User pauses for 3 seconds after typing
useEffect(() => {
  const timer = setTimeout(async () => {
    if (sqlCode && !validationResult?.valid) {
      // Check for optimization opportunities
      const suggestions = await tiSQL.analyze(sqlCode);
      setProactiveSuggestions(suggestions);
    }
  }, 3000);

  return () => clearTimeout(timer);
}, [sqlCode]);
```

**Suggestion Types:**
- Performance optimization opportunities
- Missing columns from contract
- Common pattern matches
- Potential errors before validation

**Phase 2 Success Metrics:**
- ✅ 80% tiSQL usage rate
- ✅ 70% of users use multi-turn conversations
- ✅ 60% accept proactive suggestions
- ✅ 55% reduction in validation errors

---

### Phase 3: Testing & Debugging with tiSQL (Weeks 5-6)
**Goal:** AI-powered testing, debugging, and optimization

#### 3.1 Automatic Error Fixing with tiSQL

**Auto-Debug on Validation Error:**
```typescript
// When validation fails
useEffect(() => {
  if (validationResult && !validationResult.valid) {
    // Automatically send to tiSQL for debugging
    const autoFix = async () => {
      const fix = await tiSQL.debug({
        sql: sqlCode,
        error: validationResult.error,
        line: validationResult.line
      });

      setTiSQLFix(fix);
      setShowFixSuggestion(true);
    };

    autoFix();
  }
}, [validationResult]);
```

**UI:**
```
┌─────────────────────────────────────────────────────┐
│ ❌ SQL Validation Error                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Error: Column 'customer_id' is ambiguous            │
│ Line 5: WHERE customer_id = '123'                  │
│                                                     │
│ 🤖 tiSQL analyzed this error:                       │
│                                                     │
│ Issue: Multiple tables have 'customer_id' column.  │
│ You need to specify which table using an alias.    │
│                                                     │
│ Suggested fix:                                      │
│   WHERE c.customer_id = '123'  -- Use alias 'c'    │
│                                                     │
│ [Apply Fix] [Explain More] [Ignore]                │
└─────────────────────────────────────────────────────┘
```

#### 3.2 tiSQL-Powered Query Optimization

**Optimization Workflow:**
```
1. User runs test query → Slow (5.8s)
2. Click "Optimize with tiSQL"
3. tiSQL Optimization Agent analyzes:
   - Execution plan
   - Join order
   - Filter placement
   - Partition usage
4. Generates optimized version with predictions
5. A/B test: run both versions
6. Show actual vs predicted improvement
7. Accept better version
```

**UI:**
```
┌─────────────────────────────────────────────────────┐
│ 🤖 tiSQL Optimization Analysis                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Current: 5.8s, $0.042                               │
│ Optimized: 2.1s, $0.015 (predicted)                │
│                                                     │
│ 🎯 Recommended Changes:                             │
│                                                     │
│ 1. ⚡ Filter pushdown                               │
│    Move WHERE before JOIN                           │
│    Impact: 60% faster                               │
│    ```sql                                           │
│    WHERE c.active = true  -- Before JOIN            │
│    ```                                              │
│    [Apply]                                          │
│                                                     │
│ 2. 📊 Partition pruning                             │
│    Add date filter                                  │
│    Impact: 45% cost reduction                       │
│    [Apply]                                          │
│                                                     │
│ [Apply All] [Test Side-by-Side] [Explain]          │
└─────────────────────────────────────────────────────┘
```

#### 3.3 Multi-Level Testing with tiSQL Analysis

**Test Results with tiSQL Insights:**
```
┌─────────────────────────────────────────────────────┐
│ Test Results (100 rows)                             │
├─────────────────────────────────────────────────────┤
│ ✅ Syntax Valid                                     │
│ ✅ Returns 87 rows                                  │
│ ⏱️  245ms execution                                 │
│ ⚠️  12% NULL in email                               │
│                                                     │
│ 🤖 tiSQL Quality Analysis:                          │
│                                                     │
│ Potential Issues:                                   │
│ • High NULL rate (12%) in email column              │
│   💡 Suggestion: Add COALESCE(email, 'N/A')         │
│   [Fix with tiSQL]                                  │
│                                                     │
│ • No ORDER BY clause                                │
│   💡 Results non-deterministic                      │
│   💡 Add: ORDER BY customer_id                      │
│   [Fix with tiSQL]                                  │
│                                                     │
│ • Possible duplicate customers                      │
│   💡 Add DISTINCT or check join cardinality         │
│   [Analyze with tiSQL]                              │
└─────────────────────────────────────────────────────┘
```

**Phase 3 Success Metrics:**
- ✅ 90% of errors auto-fixed by tiSQL
- ✅ 55% average performance improvement
- ✅ 85% of queries tested before deployment
- ✅ 70% cost reduction from optimizations

---

### Phase 4: Knowledge Capture & Learning (Weeks 7-8)
**Goal:** Capture organizational SQL knowledge and improve tiSQL over time

#### 4.1 AI-Generated Query Metadata

**Save Flow with tiSQL:**
```
┌─────────────────────────────────────────────────────┐
│ Save Query to Library                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🤖 tiSQL Auto-Generated Metadata:                   │
│                                                     │
│ Name: customer_monthly_revenue                      │
│ (Click "Regenerate" to change)                      │
│                                                     │
│ Description:                                        │
│ ┌─────────────────────────────────────────────┐    │
│ │ Calculates monthly revenue per customer by  │    │
│ │ joining customers with orders, grouping by   │    │
│ │ month, and summing order amounts. Includes   │    │
│ │ only active customers from 2024.             │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ Tags: (tiSQL-suggested)                             │
│ [customer] [revenue] [monthly] [aggregation]       │
│ [+ Add tag]                                         │
│                                                     │
│ Documentation: (tiSQL-generated)                    │
│ ☑ Auto-generate inline comments                    │
│ ☑ Create dbt schema.yml                            │
│ ☐ Add to data catalog                              │
│                                                     │
│ [Regenerate Metadata] [Save]                        │
└─────────────────────────────────────────────────────┘
```

**tiSQL Metadata Generation:**
```python
async def generate_query_metadata(
    self,
    sql: str,
    execution_stats: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate metadata for saved query"""

    task = Task(
        description=f"""
        Analyze this SQL query and generate metadata:

        ```sql
        {sql}
        ```

        Execution stats: {execution_stats}

        Generate:
        1. Concise name (snake_case, descriptive)
        2. Clear description (2-3 sentences)
        3. Relevant tags (3-5 tags)
        4. Business purpose
        5. Suggested documentation

        Format as JSON.
        """,
        agent=self.sql_generation_agent,
        expected_output="JSON with query metadata"
    )

    result = await self._run_crew_task(task)

    return json.loads(result)
```

#### 4.2 Pattern Learning from Organization

**tiSQL Learns from Saved Queries:**
```python
async def learn_organizational_patterns(
    self,
    saved_queries: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Analyze saved queries to learn organizational patterns
    """
    task = Task(
        description=f"""
        Analyze these {len(saved_queries)} saved queries to identify patterns:

        {json.dumps(saved_queries[:10], indent=2)}

        Identify:
        1. Common join patterns (which tables, which keys)
        2. Frequent WHERE filters
        3. Standard naming conventions
        4. Common aggregations
        5. Best practices being followed
        6. Anti-patterns to avoid

        Output structured patterns that can guide future queries.
        """,
        agent=self.schema_agent,
        expected_output="Structured organizational patterns"
    )

    result = await self._run_crew_task(task)

    return json.loads(result)
```

**Apply Learned Patterns:**
```
User starts new customer query

tiSQL recognizes pattern:
┌─────────────────────────────────────────────────────┐
│ 🤖 tiSQL Detected Organizational Pattern            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 87% of customer queries at NexusOne use:            │
│                                                     │
│ • JOIN customers ← orders ON customer_id            │
│ • Filter: WHERE c.active = true                     │
│ • Aggregate: SUM(total_amount) as revenue           │
│ • Group by: DATE_TRUNC('month', order_date)         │
│                                                     │
│ Apply this pattern to your query?                   │
│                                                     │
│ [Yes, apply] [No thanks] [View 15 examples]         │
└─────────────────────────────────────────────────────┘
```

#### 4.3 tiSQL Self-Improvement

**Feedback Loop:**
```typescript
// Track tiSQL suggestion outcomes
const handleTiSQLAcceptance = async (
  suggestion: TiSQLSuggestion,
  wasAccepted: boolean,
  userFeedback?: string
) => {
  await fetch('/api/tisql/feedback', {
    method: 'POST',
    body: JSON.stringify({
      suggestionId: suggestion.id,
      accepted: wasAccepted,
      executionSucceeded: testResult.success,
      performanceGain: testResult.speedup,
      userFeedback
    })
  });
};
```

**Backend Learning:**
```python
class TiSQLLearningService:
    """Track tiSQL performance and improve over time"""

    async def record_feedback(
        self,
        suggestion_id: str,
        accepted: bool,
        execution_succeeded: bool,
        performance_gain: Optional[float] = None
    ):
        """Record outcome of tiSQL suggestion"""

        # Store in database
        await db.tisql_suggestions.update(
            suggestion_id,
            {
                "accepted": accepted,
                "succeeded": execution_succeeded,
                "performance_gain": performance_gain,
                "recorded_at": datetime.now()
            }
        )

        # Update agent performance metrics
        await self._update_agent_metrics(suggestion_id)

    async def get_agent_success_rates(self) -> Dict[str, float]:
        """Calculate success rates per agent"""

        stats = await db.tisql_suggestions.aggregate([
            {
                "$group": {
                    "_id": "$agent_type",
                    "total": {"$sum": 1},
                    "accepted": {
                        "$sum": {"$cond": ["$accepted", 1, 0]}
                    },
                    "succeeded": {
                        "$sum": {"$cond": ["$succeeded", 1, 0]}
                    }
                }
            }
        ])

        return {
            stat["_id"]: {
                "acceptance_rate": stat["accepted"] / stat["total"],
                "success_rate": stat["succeeded"] / stat["total"]
            }
            for stat in stats
        }
```

**Phase 4 Success Metrics:**
- ✅ 80% of saved queries have tiSQL metadata
- ✅ 75% query reuse rate
- ✅ 65% apply learned patterns
- ✅ 90% documentation coverage
- ✅ tiSQL acceptance rate improves 15% over time

---

## Technical Implementation

### Backend Architecture

```
backend/
├── services/
│   ├── tisql_service.py          # Main tiSQL service
│   │   ├── TiSQLService
│   │   ├── SQL Generation Agent
│   │   ├── Optimization Agent
│   │   ├── Debugging Agent
│   │   ├── dbt Agent
│   │   └── Schema Agent
│   │
│   ├── vultr_llm_adapter.py      # ✅ Already exists
│   ├── crew_intelligence.py      # ✅ Already exists (extend)
│   └── tisql_learning.py         # NEW: Learning from feedback
│
└── api/
    └── tisql_routes.py            # NEW: tiSQL API endpoints
```

### API Endpoints

```typescript
// tiSQL endpoints
POST /api/tisql/generate          - NL to SQL
POST /api/tisql/optimize          - Optimize query
POST /api/tisql/debug             - Debug error
POST /api/tisql/to-dbt            - Convert to dbt
POST /api/tisql/suggest-joins     - Join suggestions
POST /api/tisql/analyze           - Analyze query
POST /api/tisql/feedback          - Record feedback

// Query library endpoints
GET    /api/queries               - List queries
POST   /api/queries               - Save query (with tiSQL metadata)
PUT    /api/queries/:id           - Update query
POST   /api/queries/:id/modify    - Modify with tiSQL
```

### Frontend Components

```
components/build/
├── TiSQLAssistant.tsx            # Main tiSQL UI
│   ├── ⌘+I keyboard handler
│   ├── AI prompt modal
│   ├── Context gathering
│   └── Request orchestration
│
├── TiSQLSuggestionPanel.tsx      # Suggestion display
│   ├── Accept/Refine/Discard UI
│   ├── Explanation display
│   ├── Confidence scoring
│   └── Diff viewer
│
├── ProactiveTiSQLSuggestions.tsx # Inline suggestions
│   ├── Performance warnings
│   ├── Pattern matches
│   ├── Contract compliance
│   └── Error predictions
│
└── TiSQLDebugger.tsx             # Auto-fix errors
    ├── Error analysis
    ├── Fix suggestions
    └── One-click apply
```

### Integration Points

**Step3WriteSQL.tsx Enhancement:**
```typescript
import { useTiSQL } from '@/lib/hooks/useTiSQL';

export function Step3WriteSQL({ selectedSources, contract }) {
  const {
    generate,
    optimize,
    debug,
    convertToDbt,
    isGenerating
  } = useTiSQL({
    sources: selectedSources,
    contract: contract
  });

  // ⌘+I handler
  const handleTiSQLRequest = useCallback(async (instruction: string) => {
    const result = await generate(instruction, sqlCode);
    setTiSQLSuggestion(result);
    setShowSuggestion(true);
  }, [sqlCode]);

  // Auto-debug on error
  useEffect(() => {
    if (validationResult?.error) {
      debug(sqlCode, validationResult.error);
    }
  }, [validationResult]);

  return (
    <>
      <KeyboardShortcut
        keys={['cmd+i', 'ctrl+i']}
        onTrigger={openTiSQLPrompt}
      />

      <CodeMirror
        value={sqlCode}
        onChange={setSqlCode}
        extensions={[sql()]}
      />

      <TiSQLAssistant
        onRequest={handleTiSQLRequest}
        context={tiSQLContext}
      />

      {tiSQLSuggestion && (
        <TiSQLSuggestionPanel
          suggestion={tiSQLSuggestion}
          onAccept={() => setSqlCode(tiSQLSuggestion.sql)}
          onRefine={handleRefine}
          onDiscard={closeSuggestion}
        />
      )}
    </>
  );
}
```

---

## Success Criteria

### Phase 1 Success (Weeks 1-2)
- ✅ tiSQL service built with 5 CrewAI agents
- ✅ Vultr LLM integration working
- ✅ 70% of users try tiSQL (⌘+I)
- ✅ 65% acceptance rate for generated SQL
- ✅ 40% browse saved queries
- ✅ 60% reduction in time to first SQL

### Phase 2 Success (Weeks 3-4)
- ✅ Context-aware generation
- ✅ Multi-turn conversations working
- ✅ 80% tiSQL usage rate
- ✅ 70% use multi-turn feature
- ✅ 60% accept proactive suggestions
- ✅ 55% reduction in validation errors

### Phase 3 Success (Weeks 5-6)
- ✅ Auto-debugging operational
- ✅ Optimization agent working
- ✅ 90% of errors auto-fixed
- ✅ 55% performance improvement
- ✅ 85% of queries tested
- ✅ 70% cost reduction

### Phase 4 Success (Weeks 7-8)
- ✅ Metadata generation working
- ✅ Pattern learning operational
- ✅ 80% queries have AI metadata
- ✅ 75% query reuse
- ✅ 65% apply patterns
- ✅ tiSQL improves 15% over time

### Overall Success (8 weeks)
- ✅ 85% reduction in SQL development time
- ✅ 95% user satisfaction
- ✅ 85% of analysts can write SQL (via tiSQL)
- ✅ 60% reduction in production issues
- ✅ 3x SQL quality improvement
- ✅ Organizational knowledge captured

---

## Key Differentiators

### 1. **Own Infrastructure** 🏆
- Not dependent on external AI services
- Vultr LLM = cost-effective, scalable
- qwen2.5-coder-32b = optimized for code/SQL
- Full control over AI behavior

### 2. **CrewAI Multi-Agent** 🤖
- Specialized agents for different tasks
- Better than single monolithic AI
- Task decomposition and orchestration
- Explainable AI (which agent did what)

### 3. **Context-Aware** 🧠
- Knows selected sources from Step 2
- Understands contract from Step 1
- Remembers user's past queries
- Learns from organizational patterns

### 4. **Continuous Learning** 📈
- Feedback loop improves tiSQL over time
- Pattern recognition from team usage
- Success rate tracking per agent
- Self-improving system

### 5. **Integrated Workflow** 🔄
- Not bolted-on chatbot
- Embedded in development flow
- ⌘+I always available
- Seamless accept/refine/discard

---

## Competitive Advantages

### vs. External AI SQL Tools
- ✅ **We own the infrastructure** (Vultr + CrewAI)
- ✅ **Context from entire workflow** (not just SQL)
- ✅ **Learns from our organization** (not generic)
- ✅ **No data leaves our infrastructure** (privacy)
- ✅ **Cost-effective at scale** (Vultr pricing)

### vs. Manual SQL Writing
- ✅ **90% faster development** (tiSQL generation)
- ✅ **Higher quality** (AI optimization + debugging)
- ✅ **Lower error rate** (auto-fix validation errors)
- ✅ **Better documentation** (AI-generated metadata)

### vs. Basic Code Editors
- ✅ **Intelligent assistance** (not just autocomplete)
- ✅ **Multi-agent expertise** (generation, optimization, debugging)
- ✅ **Proactive suggestions** (not just reactive)
- ✅ **Learning system** (improves over time)

---

## Conclusion

The current Step 3 is a **basic code editor that doesn't leverage our own AI infrastructure** (Vultr LLM + CrewAI). By building **tiSQL as a specialized SQL intelligence system**, we transform Step 3 into an **AI-first development environment** that:

1. **Democratizes SQL** through natural language (via tiSQL)
2. **Ensures quality** through AI debugging and testing
3. **Optimizes performance** through intelligent analysis
4. **Captures knowledge** through pattern learning
5. **Serves all personas** from analyst to senior engineer

**Critical Insight:**
We already have Vultr LLM inference and CrewAI framework. We just need to add SQL-specialized agents. This is **our infrastructure, our competitive advantage**.

**Expected Impact:**
- 85% reduction in SQL development time
- 95% user satisfaction across personas
- 85% of analysts can write SQL independently
- 60% reduction in production SQL issues
- Organizational SQL knowledge preserved forever

**Next Step:**
Start Phase 1 immediately - build tiSQL service with CrewAI SQL agents. This single addition will transform user experience more than any other enhancement.

---

## Appendix: tiSQL Agent Prompts

### SQL Generation Agent System Prompt
```
You are a senior SQL developer with 15+ years of experience in analytical database systems
including Trino, Presto, PostgreSQL, and modern data warehouses.

Your expertise includes:
- Complex JOIN patterns and relationship modeling
- Window functions and advanced aggregations
- CTEs and subquery optimization
- dbt ref() syntax and materialization strategies
- Performance-conscious SQL design
- Clear, self-documenting code

When generating SQL:
1. Use table schemas provided in context
2. Match desired output columns exactly
3. Choose appropriate JOINs (INNER, LEFT, etc.) based on requirements
4. Add WHERE filters for performance
5. Include ORDER BY for deterministic results
6. Add comments explaining complex logic
7. Follow organizational naming conventions
8. Validate joins don't create unexpected cardinality

Always explain your design decisions and suggest alternatives where appropriate.
```

### Optimization Agent System Prompt
```
You are a database performance engineer specializing in query optimization for distributed
analytical databases (Trino, Spark SQL, Presto).

Your expertise includes:
- Query execution plan analysis
- Filter pushdown and predicate optimization
- Partition pruning strategies
- Join order optimization
- Index selection and hints
- Cost-based optimization
- Resource usage prediction

When optimizing queries:
1. Identify bottlenecks (full scans, cross joins, missing filters)
2. Recommend specific changes with estimated impact (% faster, % cheaper)
3. Explain trade-offs (e.g., added complexity vs performance gain)
4. Provide before/after comparisons
5. Consider data volume and distribution
6. Validate optimizations preserve correctness
7. Suggest monitoring for performance regression

Always quantify improvements and explain reasoning.
```

### Debugging Agent System Prompt
```
You are a SQL troubleshooting expert who has debugged thousands of queries for users
at all skill levels from beginner analysts to senior engineers.

Your strengths:
- Pattern matching error messages to root causes
- Explaining SQL concepts in plain English
- Providing specific fixes with line numbers
- Teaching why errors occur (educational approach)
- Recognizing common beginner mistakes
- Handling complex CTE and subquery errors

When debugging:
1. Identify the exact cause of the error
2. Explain in simple terms what went wrong
3. Provide corrected SQL with highlighted changes
4. Explain why the fix works
5. Suggest how to prevent similar errors
6. Be patient and educational, not condescending

Always help users learn, not just fix their immediate problem.
```

This analysis is now accurate to **our own infrastructure and capabilities**. Should we commit this and start building the tiSQL service?
