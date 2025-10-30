# Domain-Aware Chat Agent Implementation Plan
## Detailed Technical Roadmap

---

## Overview

This document provides the step-by-step implementation plan for integrating the Domain-Aware Chat Agent into the data product discovery experience. The plan is broken into 4 phases over 8 weeks, with clear deliverables, technical tasks, and success criteria for each phase.

---

## Phase 1: Foundation & MVP (Weeks 1-2)

### Goal
Launch a working chat agent on all product detail pages with domain-specific context and core Q&A capabilities.

### Technical Tasks

#### 1.1 Component Integration (Days 1-2)
**File**: `/app/(main)/discover/[productId]/page.tsx`

```typescript
// Add import
import { ProductChatAgent } from '@/components/discover/ProductDetail/ProductChatAgent';

// Insert between hero card and tabs
<ProductChatAgent product={product} />
```

**Changes Required:**
- ✅ Component already created at `/components/discover/ProductDetail/ProductChatAgent.tsx`
- Add import statement to product detail page
- Position component in layout (between hero and tabs)
- Pass product prop with all metadata

**Testing:**
- Component renders on all product detail pages
- Domain context switches correctly for each domain
- Collapse/expand animation works smoothly
- No console errors

---

#### 1.2 Domain Context Refinement (Days 2-3)
**File**: `/components/discover/ProductDetail/ProductChatAgent.tsx`

**Enhance Domain Contexts:**

```typescript
const getDomainContext = (domain: string) => {
  const contexts = {
    Customer: {
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      capabilities: [
        'RFM segmentation analysis',
        'Lifetime value calculations',
        'Churn prediction queries',
        'Cohort retention analysis'
      ],
      welcomeMessage: "I'm your Customer Domain expert with deep knowledge of behavioral analytics, segmentation strategies, and predictive modeling for customer insights.",
      suggestedQuestions: [
        'How do I calculate customer lifetime value?',
        'Show me a query for active customers in last 90 days',
        'What segmentation approaches work best for retail?',
        'Help me analyze churn patterns by cohort',
        'How fresh is this customer data?',
        'What downstream models depend on this dataset?'
      ],
      // Add example queries library
      exampleQueries: {
        ltv: 'SELECT customer_id, SUM(order_value)...',
        active: 'SELECT * FROM {product} WHERE last_activity...',
        segment: 'SELECT customer_id, CASE WHEN...'
      }
    },
    // ... other domains
  };

  return contexts[domain] || contexts.Customer;
};
```

**Add:**
- More detailed capability descriptions (4 per domain)
- Better welcome messages (2-3 sentences)
- 6 high-quality suggested questions per domain
- Example query templates library
- Domain-specific best practices

**Testing:**
- All 5 domains have complete context
- Suggested questions are relevant and actionable
- Capabilities accurately reflect domain expertise
- No missing or placeholder text

---

#### 1.3 Response Generation Enhancement (Days 3-5)
**File**: `/components/discover/ProductDetail/ProductChatAgent.tsx`

**Expand Question Pattern Matching:**

```typescript
const generateDomainResponse = async (question: string, product: any): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1200));

  const qLower = question.toLowerCase();
  const domain = product.domain;

  // Category 1: SQL Query Generation (10 patterns)
  if (qLower.includes('lifetime value') || qLower.includes('ltv')) {
    return generateLTVQuery(product);
  }

  if (qLower.includes('active customer') || qLower.includes('recent customer')) {
    return generateActiveCustomersQuery(product);
  }

  if (qLower.includes('segment') || qLower.includes('cohort')) {
    return generateSegmentationQuery(product);
  }

  // Category 2: Data Quality & Freshness (5 patterns)
  if (qLower.includes('quality') || qLower.includes('reliable')) {
    return generateQualityInfo(product);
  }

  if (qLower.includes('fresh') || qLower.includes('update') || qLower.includes('latest')) {
    return generateFreshnessInfo(product);
  }

  // Category 3: Schema & Structure (5 patterns)
  if (qLower.includes('schema') || qLower.includes('columns') || qLower.includes('fields')) {
    return generateSchemaExplanation(product);
  }

  if (qLower.includes('join') || qLower.includes('relate') || qLower.includes('combine')) {
    return generateJoinGuidance(product);
  }

  // Category 4: Usage & Dependencies (5 patterns)
  if (qLower.includes('downstream') || qLower.includes('who uses') || qLower.includes('consumers')) {
    return generateDownstreamAnalysis(product);
  }

  if (qLower.includes('upstream') || qLower.includes('source') || qLower.includes('where from')) {
    return generateUpstreamAnalysis(product);
  }

  // Category 5: Best Practices (5 patterns)
  if (qLower.includes('best practice') || qLower.includes('how to use') || qLower.includes('getting started')) {
    return generateBestPractices(product);
  }

  // Default fallback with domain context
  return generateDefaultResponse(question, product);
};
```

**Implement 30 Response Generators:**
1. `generateLTVQuery()` - Customer lifetime value SQL
2. `generateActiveCustomersQuery()` - Recent activity filter
3. `generateSegmentationQuery()` - RFM or behavioral segmentation
4. `generateChurnAnalysis()` - Churn risk scoring
5. `generateCohortAnalysis()` - Retention by cohort
6. `generateRevenueQuery()` - Revenue calculations (Financial)
7. `generateMRRQuery()` - Monthly recurring revenue
8. `generateForecastGuidance()` - Forecasting approaches
9. `generateFeatureAdoptionQuery()` - Product feature usage
10. `generateFunnelAnalysis()` - Conversion funnel SQL
11. `generateCampaignROI()` - Marketing ROI calculation
12. `generateAttributionQuery()` - Multi-touch attribution
13. `generateEfficiencyMetrics()` - Operations efficiency
14. `generateSLATracking()` - SLA compliance queries
15. `generateQualityInfo()` - Data quality metrics
16. `generateFreshnessInfo()` - Update schedule & SLA
17. `generateSchemaExplanation()` - Schema walkthrough
18. `generateJoinGuidance()` - How to join with other tables
19. `generateDownstreamAnalysis()` - Consumer systems
20. `generateUpstreamAnalysis()` - Source systems
21. `generateBestPractices()` - Domain best practices
22. `generateOptimizationTips()` - Query performance tips
23. `generateGlossaryExplanation()` - Business term definitions
24. `generateUseCaseExamples()` - Real-world usage examples
25. `generateAccessInstructions()` - How to get access
26. `generateOwnerContact()` - Who to contact for help
27. `generateRelatedProducts()` - Similar or complementary products
28. `generateDataLineage()` - Lineage visualization guidance
29. `generateTestingGuidance()` - How to validate data
30. `generateDefaultResponse()` - Catch-all with helpful context

**Response Template Structure:**

Every response should include:

```markdown
# Direct Answer
{SQL query or explanation}

# Product Context
- Data Quality: {quality}% {emoji}
- Freshness: {freshness}
- Active Users: {users}
- Last Updated: {timestamp}

# Related Information
{Glossary terms, dependencies, or best practices}

# Next Steps
{Follow-up questions or recommendations}
```

**Testing:**
- All 30 question patterns generate appropriate responses
- SQL queries are syntactically valid
- Responses include product-specific context
- Code blocks render with proper formatting
- Response time <2 seconds

---

#### 1.4 Code Syntax Highlighting (Day 5)

**Install Dependency:**
```bash
npm install react-syntax-highlighter @types/react-syntax-highlighter
```

**Update Component:**
```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// In message rendering
const renderMessageContent = (content: string) => {
  const parts = content.split(/(```sql[\s\S]*?```|```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```sql')) {
      const code = part.replace(/```sql\n?/, '').replace(/```$/, '');
      return (
        <SyntaxHighlighter
          key={index}
          language="sql"
          style={vscDarkPlus}
          customStyle={{
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            margin: '1rem 0'
          }}
        >
          {code}
        </SyntaxHighlighter>
      );
    }
    return <span key={index}>{part}</span>;
  });
};
```

**Testing:**
- SQL code blocks render with syntax highlighting
- Colors match dark mode theme
- Copy button works (future enhancement)
- Scrollbar appears for long queries

---

#### 1.5 Animation & Polish (Day 6)

**Enhance Animations:**

```typescript
// Smooth expand/collapse
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
>
  {/* Chat content */}
</motion.div>

// Message fade-in
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  {/* Message bubble */}
</motion.div>

// Loading dots with stagger
{[0, 150, 300].map((delay) => (
  <motion.span
    key={delay}
    className="w-2 h-2 bg-primary rounded-full"
    animate={{ opacity: [0.3, 1, 0.3] }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      delay: delay / 1000
    }}
  />
))}
```

**Add Micro-interactions:**
- Hover effects on suggestion buttons
- Focus states on input
- Smooth scroll to latest message
- Disabled state styling
- Success feedback on send

**Testing:**
- Animations are smooth (60 FPS)
- No layout shift during expand
- Transitions feel natural
- Micro-interactions are responsive

---

#### 1.6 Integration Testing (Days 6-7)

**Test Scenarios:**

1. **Domain Switching**
   - Navigate between products with different domains
   - Verify context updates correctly
   - Check icon and color changes

2. **Question Flow**
   - Ask 5 questions in sequence
   - Verify conversation history preserved
   - Check scroll behavior

3. **Edge Cases**
   - Empty input submission
   - Very long questions (>500 chars)
   - Special characters in questions
   - Rapid clicking of suggestions

4. **Performance**
   - Response time with large product metadata
   - Scroll performance with 20+ messages
   - Memory usage during long conversations

5. **Accessibility**
   - Keyboard navigation (Tab, Enter, Escape)
   - Screen reader announcements
   - Focus management
   - High contrast mode

**Bug Fixes:**
- Document and fix any issues found
- Add error boundaries for graceful failures
- Implement retry logic for failed responses

---

### Phase 1 Deliverables

✅ **Week 1 Deliverables:**
- ProductChatAgent component created
- Domain context system implemented (5 domains)
- Basic question-answer flow working
- Collapse/expand functionality
- Initial response generation (10 patterns)

📋 **Week 2 Deliverables:**
- 30 question patterns with responses
- SQL syntax highlighting
- Smooth animations and transitions
- Full integration with product detail pages
- Comprehensive testing completed

### Phase 1 Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Agent visible on product pages | 100% | 🔄 In Progress |
| Domains configured | 5/5 | ✅ Complete |
| Question patterns supported | 30+ | 🔄 In Progress |
| Response time | <2 seconds | 🔄 To Test |
| Code highlighting working | Yes | 🔄 To Implement |
| Animation smoothness | 60 FPS | 🔄 To Test |
| Zero console errors | Yes | 🔄 To Test |

---

## Phase 2: Intelligence & Learning (Weeks 3-4)

### Goal
Enhance the agent with semantic understanding, query validation, feedback mechanisms, and usage analytics.

### Technical Tasks

#### 2.1 Semantic Question Parsing (Days 8-10)

**Upgrade from Keyword Matching to Semantic Understanding:**

Install NLP library:
```bash
npm install compromise
```

**Implement Intent Detection:**

```typescript
import nlp from 'compromise';

interface QuestionIntent {
  category: 'query_generation' | 'data_info' | 'schema' | 'usage' | 'best_practice';
  entities: string[];
  confidence: number;
}

const parseQuestionIntent = (question: string): QuestionIntent => {
  const doc = nlp(question);

  // Detect SQL generation intent
  if (doc.has('(calculate|compute|find|show|get)') &&
      doc.has('(customer|revenue|user|order)')) {
    return {
      category: 'query_generation',
      entities: doc.nouns().out('array'),
      confidence: 0.9
    };
  }

  // Detect data quality questions
  if (doc.has('(quality|reliable|accurate|fresh|updated)')) {
    return {
      category: 'data_info',
      entities: [],
      confidence: 0.85
    };
  }

  // Detect schema questions
  if (doc.has('(schema|structure|fields|columns|table)')) {
    return {
      category: 'schema',
      entities: doc.nouns().out('array'),
      confidence: 0.8
    };
  }

  // Fallback to keyword matching
  return {
    category: 'best_practice',
    entities: [],
    confidence: 0.5
  };
};
```

**Benefits:**
- Better understanding of user intent
- Handle synonyms and variations
- Extract entities from questions
- Confidence scoring for responses

---

#### 2.2 Query Validation (Days 10-11)

**Integrate with Trino Catalog for Schema Validation:**

```typescript
interface SchemaField {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
}

const validateQueryAgainstSchema = async (
  query: string,
  productName: string
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> => {
  try {
    // Fetch schema from Trino catalog
    const schema = await fetchTrinoSchema(productName);

    // Parse SQL query
    const parsedQuery = parseSQL(query);

    // Validate columns exist
    const columnErrors = [];
    for (const col of parsedQuery.columns) {
      if (!schema.find(f => f.name === col)) {
        columnErrors.push(`Column '${col}' not found in schema`);
      }
    }

    // Check for type mismatches
    const typeWarnings = [];
    // ... type checking logic

    // Check for performance issues
    const perfWarnings = [];
    if (!parsedQuery.hasWhereClause && schema.length > 1000000) {
      perfWarnings.push('Consider adding WHERE clause for large table');
    }

    return {
      valid: columnErrors.length === 0,
      errors: columnErrors,
      warnings: [...typeWarnings, ...perfWarnings]
    };
  } catch (error) {
    return { valid: false, errors: [error.message], warnings: [] };
  }
};
```

**Show Validation Results:**

```typescript
// In response generation
const enhancedResponse = await generateDomainResponse(question, product);

if (enhancedResponse.includes('```sql')) {
  const sqlQuery = extractSQLFromResponse(enhancedResponse);
  const validation = await validateQueryAgainstSchema(sqlQuery, product.name);

  if (!validation.valid) {
    return `${enhancedResponse}\n\n⚠️ **Query Validation Errors:**\n${validation.errors.map(e => `- ${e}`).join('\n')}`;
  }

  if (validation.warnings.length > 0) {
    return `${enhancedResponse}\n\n💡 **Query Optimization Tips:**\n${validation.warnings.map(w => `- ${w}`).join('\n')}`;
  }
}
```

---

#### 2.3 Feedback Mechanism (Days 11-12)

**Add Thumbs Up/Down to Responses:**

```typescript
interface MessageFeedback {
  messageId: string;
  rating: 'positive' | 'negative';
  comment?: string;
  timestamp: Date;
}

const [messageFeedback, setMessageFeedback] = useState<Record<string, 'positive' | 'negative'>>({});

// In message rendering
<div className="flex items-center gap-2 mt-2">
  <button
    onClick={() => handleFeedback(message.id, 'positive')}
    className={cn(
      "p-1 rounded hover:bg-muted transition-colors",
      messageFeedback[message.id] === 'positive' && "text-green-500"
    )}
  >
    <ThumbsUp className="h-4 w-4" />
  </button>
  <button
    onClick={() => handleFeedback(message.id, 'negative')}
    className={cn(
      "p-1 rounded hover:bg-muted transition-colors",
      messageFeedback[message.id] === 'negative' && "text-red-500"
    )}
  >
    <ThumbsDown className="h-4 w-4" />
  </button>
</div>
```

**Track Feedback:**

```typescript
const handleFeedback = async (messageId: string, rating: 'positive' | 'negative') => {
  setMessageFeedback(prev => ({ ...prev, [messageId]: rating }));

  // Send to analytics
  await fetch('/api/chat-agent/feedback', {
    method: 'POST',
    body: JSON.stringify({
      messageId,
      rating,
      question: messages.find(m => m.id === messageId)?.question,
      response: messages.find(m => m.id === messageId)?.content,
      productId: product.id,
      domain: product.domain,
      timestamp: new Date()
    })
  });
};
```

---

#### 2.4 Usage Analytics (Days 12-13)

**Create Analytics API Endpoint:**

```typescript
// app/api/chat-agent/analytics/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const event = await request.json();

  // Log to analytics database
  await logChatEvent({
    eventType: event.type,  // 'question_asked', 'response_generated', 'feedback_given'
    userId: event.userId,
    productId: event.productId,
    domain: event.domain,
    question: event.question,
    responseTime: event.responseTime,
    feedback: event.feedback,
    timestamp: new Date()
  });

  return NextResponse.json({ success: true });
}
```

**Track Key Events:**

```typescript
// On question asked
analytics.track('chat_agent_question', {
  productId: product.id,
  domain: product.domain,
  questionLength: question.length,
  intent: parsedIntent.category,
  timestamp: Date.now()
});

// On response generated
analytics.track('chat_agent_response', {
  productId: product.id,
  domain: product.domain,
  responseTime: Date.now() - startTime,
  responseLength: response.length,
  containsSQL: response.includes('```sql'),
  timestamp: Date.now()
});

// On agent expanded
analytics.track('chat_agent_expanded', {
  productId: product.id,
  domain: product.domain
});
```

---

#### 2.5 Context-Aware Multi-Turn Conversations (Days 13-14)

**Implement Conversation Memory:**

```typescript
interface ConversationContext {
  productName: string;
  domain: string;
  previousQuestions: string[];
  mentionedEntities: string[];
  currentTopic: string;
}

const [conversationContext, setConversationContext] = useState<ConversationContext>({
  productName: product.displayName,
  domain: product.domain,
  previousQuestions: [],
  mentionedEntities: [],
  currentTopic: 'general'
});

const generateContextAwareResponse = async (
  question: string,
  context: ConversationContext,
  product: any
): Promise<string> => {
  // Check for follow-up questions
  if (isFollowUpQuestion(question, context)) {
    return generateFollowUpResponse(question, context, product);
  }

  // Update context with new entities
  const entities = extractEntities(question);
  setConversationContext(prev => ({
    ...prev,
    previousQuestions: [...prev.previousQuestions, question],
    mentionedEntities: [...prev.mentionedEntities, ...entities],
    currentTopic: inferTopic(question, entities)
  }));

  // Generate response with context
  return generateDomainResponse(question, product, context);
};
```

**Handle Follow-Up Questions:**

```typescript
const isFollowUpQuestion = (question: string, context: ConversationContext): boolean => {
  const followUpIndicators = ['also', 'what about', 'how about', 'and', 'but'];
  return followUpIndicators.some(indicator => question.toLowerCase().startsWith(indicator));
};

const generateFollowUpResponse = (
  question: string,
  context: ConversationContext,
  product: any
): string => {
  // If asking "what about X" after discussing Y
  if (question.toLowerCase().includes('what about')) {
    const previousTopic = context.currentTopic;
    return `Compared to ${previousTopic}, ${question}...`;
  }

  // If asking "and" or "also"
  if (question.toLowerCase().startsWith('and') || question.toLowerCase().startsWith('also')) {
    return `Building on the previous query, ${question}...`;
  }

  return generateDomainResponse(question, product, context);
};
```

---

### Phase 2 Deliverables

📋 **Week 3 Deliverables:**
- Semantic question parsing with NLP
- Query validation against Trino schema
- Feedback mechanism (thumbs up/down)
- Analytics event tracking

📋 **Week 4 Deliverables:**
- Context-aware multi-turn conversations
- Usage analytics dashboard
- Improved response quality based on feedback
- Cross-product recommendation engine (basic)

### Phase 2 Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Question understanding accuracy | 80% | 🔄 To Measure |
| Query validation coverage | 90% | 🔄 To Implement |
| Users providing feedback | 50% | 🔄 To Track |
| Average conversation length | 5+ turns | 🔄 To Track |
| Response improvement | 20% better ratings | 🔄 To Measure |

---

## Phase 3: Orchestration & Execution (Weeks 5-6)

### Goal
Connect the chat agent to live execution engines so users can run queries, preview results, and export data directly from conversations.

### Technical Tasks

#### 3.1 Trino Query Execution (Days 15-17)

**Create Query Execution API:**

```typescript
// app/api/chat-agent/execute/route.ts
import { createTrinoClient } from '@/lib/trino-client';

export async function POST(request: Request) {
  const { query, productName, userId } = await request.json();

  // Validate user has access
  const hasAccess = await checkProductAccess(userId, productName);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Execute query (read-only, with limit)
  const trino = createTrinoClient();
  const safeQuery = `SELECT * FROM (${query}) LIMIT 100`;

  try {
    const result = await trino.execute(safeQuery);
    return NextResponse.json({
      success: true,
      data: result.rows,
      columns: result.columns,
      rowCount: result.rows.length,
      executionTime: result.executionTime
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

**Add "Run Query" Button to SQL Code Blocks:**

```typescript
<div className="relative group">
  <SyntaxHighlighter language="sql" style={vscDarkPlus}>
    {sqlQuery}
  </SyntaxHighlighter>

  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <Button
      size="sm"
      onClick={() => handleExecuteQuery(sqlQuery)}
      disabled={isExecuting}
      className="gap-2"
    >
      {isExecuting ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Executing...
        </>
      ) : (
        <>
          <Play className="h-3 w-3" />
          Run Query
        </>
      )}
    </Button>
  </div>
</div>
```

---

#### 3.2 Result Preview UI (Days 17-18)

**Create Result Table Component:**

```typescript
interface QueryResultsProps {
  data: any[];
  columns: string[];
  executionTime: number;
  onExport?: (format: 'csv' | 'parquet') => void;
}

const QueryResults: React.FC<QueryResultsProps> = ({
  data,
  columns,
  executionTime,
  onExport
}) => {
  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">{data.length} rows</span>
          <span className="text-muted-foreground">
            Executed in {executionTime}ms
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onExport?.('csv')}>
            <Download className="h-3 w-3 mr-1" />
            CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onExport?.('parquet')}>
            <Download className="h-3 w-3 mr-1" />
            Parquet
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-t hover:bg-muted/20">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2">
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

#### 3.3 Export Functionality (Days 18-19)

**Implement CSV Export:**

```typescript
const exportToCSV = (data: any[], columns: string[], filename: string) => {
  // Create CSV content
  const headers = columns.join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Implement Parquet Export (Server-Side):**

```typescript
// app/api/chat-agent/export/route.ts
import { writeParquet } from 'parquetjs';

export async function POST(request: Request) {
  const { data, columns, format } = await request.json();

  if (format === 'parquet') {
    const schema = buildParquetSchema(columns, data[0]);
    const writer = await writeParquet(schema, data);
    const buffer = await writer.toBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="query_results.parquet"'
      }
    });
  }
}
```

---

#### 3.4 dbt Model Generation (Days 19-20)

**Generate dbt Model from Conversation:**

```typescript
const generateDbtModel = (
  modelName: string,
  sqlQuery: string,
  product: any
): string => {
  return `
-- models/${modelName}.sql
-- Generated by NexusOne Chat Agent
-- Source Product: ${product.displayName}
-- Domain: ${product.domain}
-- Generated: ${new Date().toISOString()}

{{
  config(
    materialized='table',
    schema='analytics',
    tags=['${product.domain.toLowerCase()}', 'generated']
  )
}}

WITH source AS (
  SELECT *
  FROM {{ source('${product.domain.toLowerCase()}', '${product.name}') }}
),

transformed AS (
${sqlQuery.split('\n').map(line => '  ' + line).join('\n')}
)

SELECT * FROM transformed

-- Model Documentation
-- Quality: ${product.quality.dataQuality}%
-- Freshness: ${product.sla.freshness}
-- Dependencies:
${product.dependencies.upstream.map(dep => `--   - ${dep}`).join('\n')}
`.trim();
};
```

**Add "Generate dbt Model" Button:**

```typescript
<Button
  size="sm"
  variant="outline"
  onClick={() => {
    const model = generateDbtModel('customer_ltv', sqlQuery, product);
    downloadFile(model, 'customer_ltv.sql', 'text/plain');
  }}
  className="gap-2"
>
  <FileCode className="h-3 w-3" />
  Generate dbt Model
</Button>
```

---

#### 3.5 Jupyter Notebook Export (Day 20-21)

**Export Conversation to Notebook:**

```typescript
interface NotebookCell {
  cell_type: 'markdown' | 'code';
  source: string[];
  metadata: Record<string, any>;
  outputs?: any[];
}

const exportToJupyterNotebook = (
  messages: Message[],
  product: any
): object => {
  const cells: NotebookCell[] = [];

  // Add header
  cells.push({
    cell_type: 'markdown',
    source: [
      `# ${product.displayName} Analysis\n`,
      `\n`,
      `**Domain:** ${product.domain}\n`,
      `**Generated:** ${new Date().toISOString()}\n`,
      `**Quality:** ${product.quality.dataQuality}%\n`,
      `\n`,
      `This notebook was generated from a conversation with the NexusOne Chat Agent.\n`
    ],
    metadata: {}
  });

  // Add setup cell
  cells.push({
    cell_type: 'code',
    source: [
      'import pandas as pd\n',
      'from trino.dbapi import connect\n',
      '\n',
      '# Connect to Trino\n',
      'conn = connect(\n',
      '    host="trino.company.com",\n',
      '    port=443,\n',
      '    user="your_username"\n',
      ')\n'
    ],
    metadata: {},
    outputs: []
  });

  // Add each Q&A pair
  messages.forEach((message) => {
    if (message.role === 'user') {
      cells.push({
        cell_type: 'markdown',
        source: [`## ${message.content}\n`],
        metadata: {}
      });
    } else {
      // Extract SQL from response
      const sqlMatch = message.content.match(/```sql\n([\s\S]*?)\n```/);
      if (sqlMatch) {
        const sql = sqlMatch[1];
        cells.push({
          cell_type: 'code',
          source: [
            `query = """\n${sql}\n"""\n`,
            '\n',
            'df = pd.read_sql(query, conn)\n',
            'df.head()\n'
          ],
          metadata: {},
          outputs: []
        });
      }

      // Add explanation as markdown
      const explanation = message.content.replace(/```sql[\s\S]*?```/g, '').trim();
      if (explanation) {
        cells.push({
          cell_type: 'markdown',
          source: [explanation + '\n'],
          metadata: {}
        });
      }
    }
  });

  // Return Jupyter notebook format
  return {
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      },
      language_info: {
        name: 'python',
        version: '3.9'
      }
    },
    nbformat: 4,
    nbformat_minor: 4,
    cells
  };
};
```

**Add Export Button:**

```typescript
<Button
  size="sm"
  variant="outline"
  onClick={() => {
    const notebook = exportToJupyterNotebook(messages, product);
    const blob = new Blob([JSON.stringify(notebook, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.name}_analysis.ipynb`;
    a.click();
    URL.revokeObjectURL(url);
  }}
  className="gap-2"
>
  <FileJson className="h-3 w-3" />
  Export to Notebook
</Button>
```

---

### Phase 3 Deliverables

📋 **Week 5 Deliverables:**
- Live query execution via Trino
- Result preview table with 100-row limit
- CSV/Parquet export functionality
- Query history tracking

📋 **Week 6 Deliverables:**
- dbt model generation from queries
- Jupyter notebook export
- Query favorites system
- Workflow orchestration helpers (basic)

### Phase 3 Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Queries executed successfully | 90% | 🔄 To Measure |
| Users exporting results | 30% | 🔄 To Track |
| dbt models generated | 20% of conversations | 🔄 To Track |
| Notebook exports | 10% of conversations | 🔄 To Track |
| Query execution time | <5 seconds (avg) | 🔄 To Measure |

---

## Phase 4: Learning & Scale (Weeks 7-8)

### Goal
Scale to enterprise with custom RAG, multi-tool orchestration, and proactive recommendations.

### Technical Tasks

#### 4.1 Custom RAG Implementation (Days 22-24)

**Build Vector Database for Organization Docs:**

```bash
npm install @pinecone-database/pinecone openai
```

**Create Document Ingestion Pipeline:**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

const ingestOrganizationDocs = async () => {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Fetch docs from Confluence, Wiki, Notion
  const docs = await fetchOrganizationDocs();

  // Generate embeddings
  for (const doc of docs) {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: doc.content
    });

    // Store in Pinecone
    await pinecone.index('nexusone-knowledge').upsert([{
      id: doc.id,
      values: embedding.data[0].embedding,
      metadata: {
        title: doc.title,
        url: doc.url,
        type: doc.type,
        domain: doc.domain
      }
    }]);
  }
};
```

**Query RAG for Relevant Context:**

```typescript
const getRelevantContext = async (question: string, domain: string): Promise<string[]> => {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Generate question embedding
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: question
  });

  // Query Pinecone
  const results = await pinecone.index('nexusone-knowledge').query({
    vector: embedding.data[0].embedding,
    filter: { domain: { $eq: domain } },
    topK: 3,
    includeMetadata: true
  });

  // Return relevant doc snippets
  return results.matches.map(match => match.metadata.content as string);
};
```

**Enhance Responses with RAG Context:**

```typescript
const generateRAGEnhancedResponse = async (
  question: string,
  product: any
): Promise<string> => {
  // Get relevant org docs
  const context = await getRelevantContext(question, product.domain);

  // Generate response with context
  const baseResponse = await generateDomainResponse(question, product);

  if (context.length > 0) {
    return `${baseResponse}\n\n📚 **Related Internal Documentation:**\n${context.map((doc, i) => `${i + 1}. ${doc}`).join('\n')}`;
  }

  return baseResponse;
};
```

---

#### 4.2 Multi-Tool Orchestration (Days 24-26)

**Query Federation Across Trino, Spark, dbt:**

```typescript
const executeMultiToolQuery = async (
  query: string,
  sources: Array<{ engine: 'trino' | 'spark' | 'dbt'; table: string }>
): Promise<any> => {
  // Analyze query to determine optimal execution plan
  const plan = analyzeQuery(query, sources);

  // Execute on appropriate engines
  const results = await Promise.all(
    plan.steps.map(async (step) => {
      switch (step.engine) {
        case 'trino':
          return await executeTrinoQuery(step.query);
        case 'spark':
          return await executeSparkQuery(step.query);
        case 'dbt':
          return await runDbtModel(step.model);
      }
    })
  );

  // Combine results
  return combineResults(results, plan);
};
```

---

#### 4.3 Proactive Recommendations (Days 26-27)

**Analyze Query Patterns and Suggest Improvements:**

```typescript
const analyzeQueryForOptimization = (query: string, schema: any): string[] => {
  const recommendations = [];

  // Check for missing indexes
  if (!query.toLowerCase().includes('where') && schema.rowCount > 1000000) {
    recommendations.push('Consider adding a WHERE clause to filter large dataset');
  }

  // Check for inefficient joins
  if (query.toLowerCase().includes('join') && !query.includes('on')) {
    recommendations.push('Specify JOIN condition explicitly for better performance');
  }

  // Check for SELECT *
  if (query.toLowerCase().includes('select *')) {
    recommendations.push('Select specific columns instead of * for better performance');
  }

  // Check for aggregations without GROUP BY
  if (query.match(/count|sum|avg/i) && !query.toLowerCase().includes('group by')) {
    recommendations.push('Consider using GROUP BY with aggregation functions');
  }

  return recommendations;
};
```

**Show Proactive Suggestions:**

```typescript
// After showing query result
{optimizationTips.length > 0 && (
  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
    <div className="flex items-start gap-3">
      <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-medium mb-2">💡 Optimization Suggestions</h4>
        <ul className="space-y-1 text-sm">
          {optimizationTips.map((tip, i) => (
            <li key={i}>• {tip}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)}
```

---

#### 4.4 Admin Dashboard (Days 27-28)

**Create Analytics Dashboard for Agent Performance:**

```typescript
// app/(main)/admin/chat-agent-analytics/page.tsx

export default function ChatAgentAnalytics() {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">12,450</p>
            <p className="text-sm text-muted-foreground">+23% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1.8s</p>
            <p className="text-sm text-muted-foreground">-0.3s from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">4.6/5</p>
            <p className="text-sm text-muted-foreground">87% positive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SQL Queries Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">8,234</p>
            <p className="text-sm text-muted-foreground">66% of responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Domain Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Questions by Domain</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Chart showing distribution */}
        </CardContent>
      </Card>

      {/* Top Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Most Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table of popular questions */}
        </CardContent>
      </Card>

      {/* Low-Rated Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Responses Needing Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table of negative feedback */}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Phase 4 Deliverables

📋 **Week 7 Deliverables:**
- Custom RAG trained on org documentation
- Multi-tool query orchestration (Trino + Spark)
- Proactive optimization recommendations
- Enhanced semantic understanding

📋 **Week 8 Deliverables:**
- Admin analytics dashboard
- Team collaboration features (share conversations)
- Content management for suggested questions
- Performance optimization at scale

### Phase 4 Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| RAG question coverage | 90% | 🔄 To Measure |
| Multi-tool query usage | 40% | 🔄 To Track |
| Proactive recommendations accepted | 25% | 🔄 To Track |
| Admin dashboard active users | 10+ | 🔄 To Track |
| Conversation sharing | 60% of teams | 🔄 To Track |

---

## Overall Project Timeline

```
Week 1-2: Foundation & MVP
├─ Component integration
├─ Domain context system
├─ Response generation (30 patterns)
├─ Syntax highlighting
└─ Testing & polish

Week 3-4: Intelligence & Learning
├─ Semantic NLP
├─ Query validation
├─ Feedback mechanism
├─ Usage analytics
└─ Multi-turn conversations

Week 5-6: Orchestration & Execution
├─ Live query execution
├─ Result preview & export
├─ dbt model generation
├─ Jupyter notebook export
└─ Workflow helpers

Week 7-8: Learning & Scale
├─ Custom RAG
├─ Multi-tool orchestration
├─ Proactive recommendations
├─ Admin dashboard
└─ Team collaboration
```

---

## Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Response quality too low | High | Medium | Implement feedback loop early, iterate rapidly |
| Query execution too slow | High | Medium | Add caching, optimize Trino queries, limit result size |
| User adoption low | High | Low | Prominent placement, excellent UX, clear value prop |
| Schema validation errors | Medium | High | Graceful error handling, helpful error messages |
| RAG hallucinations | Medium | Medium | Confidence scoring, human review for low confidence |

---

## Success Measurement

### Weekly Check-ins

Review these metrics every Monday:

1. **Adoption**: % of product page visitors using agent
2. **Engagement**: Average questions per session
3. **Quality**: User satisfaction score (thumbs up/down)
4. **Performance**: Response time & query execution time
5. **Errors**: Error rate & types of failures

### Monthly Reviews

Comprehensive analysis:

1. Domain-specific performance
2. Most common question patterns
3. Feature usage (export, dbt, notebooks)
4. User segments and adoption curves
5. ROI: Time saved vs. development investment

---

## Next Steps

### Immediate (This Week)
1. ✅ Complete component integration into product pages
2. 🔄 Implement 30 question patterns with responses
3. 🔄 Add SQL syntax highlighting
4. 🔄 Test with beta users (5-10 people)
5. 🔄 Gather initial feedback

### Next Week
1. Launch semantic NLP for better understanding
2. Add query validation against Trino
3. Implement feedback mechanism
4. Begin usage analytics tracking
5. Iterate based on beta feedback

### Next Month
1. Launch live query execution
2. Add export functionality
3. Generate dbt models
4. Build admin dashboard
5. Expand to all users

---

## Conclusion

This implementation plan transforms the Domain-Aware Chat Agent from concept to production-ready feature over 8 weeks. By following this structured approach with clear deliverables and success criteria at each phase, we ensure:

- ✅ Iterative development with continuous user feedback
- ✅ Measurable progress and ROI at each phase
- ✅ Risk mitigation through phased rollout
- ✅ Scalable architecture for future enhancements

The result: A best-in-class AI assistant that transforms data product discovery from static documentation into an interactive, intelligent learning experience.
