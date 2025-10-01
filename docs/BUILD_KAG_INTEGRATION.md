# Build Page: KAG Integration Strategy
**How Phase 1 + Phase 2 Accelerates the Conversation-First Vision**

**Date**: 2025-10-01
**Status**: Integration Ready
**Context**: Combines conversation-first build flow with graph-enhanced intelligence

---

## Executive Summary

We now have **two complementary systems** that, when integrated, deliver the conversation-first build flow with intelligent assistance:

### What We Built

**Phase 1 (Committed: `9663d9c`)**:
- Natural language request parsing → structured requirements
- ODCS v4.0 contract generation
- Intelligent tool routing (dbt vs SQLMesh)
- Profiling-based contract inference
- **Total**: 1,021 lines TypeScript

**Phase 2 (Committed: `debb0da`)**:
- FastAPI KAG intelligence layer
- Graph-based similar contract discovery
- Hybrid reasoning (graph + LLM)
- Pattern discovery and recommendations
- Domain accelerators (retail, financial, healthcare)
- **Total**: 503 lines FastAPI + 3,511 lines KAG services

### How This Accelerates the Roadmap

Our implementation **directly delivers** several weeks of the original roadmap:

| Original Roadmap | Our Implementation | Status |
|------------------|-------------------|--------|
| **Week 1-2: ODCS Schema** | ✅ Complete in Phase 1 | DONE |
| **Week 3-4: Code Generation** | ✅ dbt/SQLMesh generators exist | DONE |
| **Week 9-10: Tool Routing** | ✅ Intelligent router in Phase 1 | DONE |
| **Week 11-12: Pattern Learning** | ✅ Pattern engine + graph in Phase 2 | DONE |
| **Week 1-3: Conversation Entry** | ⏳ Need to integrate with UI | NEXT |
| **Week 4-6: Feedback Loop** | ⏳ Need to wire KAG to DataHub | NEXT |

**Result**: We've completed 8 weeks of work and are ready to integrate the conversation-first UI.

---

## Integration Architecture

### Current State: Two Independent Systems

```
┌─── Phase 1: TypeScript APIs ────────────────────────┐
│                                                      │
│  POST /api/build/request/parse                      │
│  POST /api/build/contract/generate                  │
│  POST /api/build/profile/upload                     │
│                                                      │
│  lib/services/tool-router.ts                        │
│  lib/generators/dbt-generator.ts                    │
│  lib/generators/sqlmesh-generator.ts                │
│                                                      │
└──────────────────────────────────────────────────────┘

┌─── Phase 2: Python KAG Backend ─────────────────────┐
│                                                      │
│  POST /api/kag/parse-request                        │
│  POST /api/kag/contract/suggest                     │
│  POST /api/kag/patterns/find                        │
│  POST /api/kag/impact/analyze                       │
│                                                      │
│  services/kuzu_knowledge_graph.py                   │
│  services/kag_intelligence.py                       │
│  services/contract_assistant.py                     │
│  services/pattern_engine.py                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Target State: Integrated Conversation Flow

```
┌─── User Interface (Conversation-First) ─────────────────────────┐
│                                                                  │
│  "Hey Sarah, Jennifer from Marketing needs customer churn       │
│   data for the Q4 campaign. She needs it by Friday with         │
│   95% accuracy. Can you help?"                                  │
│                                                                  │
│  [Extract Context & Continue] ───────────────────────────────→  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌─── Enhanced Request Parsing ────────────────────────────────────┐
│                                                                  │
│  TypeScript: POST /api/build/request/parse                      │
│       ↓                                                          │
│  Python: POST /api/kag/parse-request                            │
│       ↓                                                          │
│  Returns:                                                        │
│  - Extracted context (stakeholder, deadline, quality)           │
│  - Similar contracts from graph (3-5 matches)                   │
│  - Domain patterns (retail accelerator suggestions)             │
│  - Confidence score with reasoning                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌─── Context Confirmation & Refinement ───────────────────────────┐
│                                                                  │
│  🎯 Business Context (92% confidence)                            │
│  ─────────────────────────────────────────                      │
│                                                                  │
│  Who needs this:                                                 │
│  ✓ Jennifer Chen (Marketing) jennifer.chen@company.com         │
│                                                                  │
│  What they need:                                                 │
│  ✓ Customer churn prediction for Q4 campaign                    │
│                                                                  │
│  When: Friday, Oct 4 (3 days) - Soft deadline                  │
│  Quality: 95% accuracy, Daily updates                           │
│                                                                  │
│  📊 Similar Projects Found (via KAG Graph)                      │
│  ─────────────────────────────────────────                      │
│                                                                  │
│  ✓ customer_churn_q3_2024 (89% similarity)                     │
│    Built by: Tom (Analytics) • 2 months ago                     │
│    Sources: customer_transactions, customer_demographics        │
│    Success: 96% accuracy achieved                               │
│    [Copy This Approach]                                          │
│                                                                  │
│  ✓ marketing_churn_model (84% similarity)                       │
│    Built by: Alice (Data Science) • 4 months ago                │
│    Pattern: churn_prediction_batch                              │
│    [View Pattern Details]                                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌─── Smart Source Recommendations ────────────────────────────────┐
│                                                                  │
│  TypeScript: Existing source selection UI                       │
│       +                                                          │
│  Python: POST /api/kag/patterns/find                            │
│                                                                  │
│  Returns:                                                        │
│  - Sources used in similar projects (from graph)                │
│  - Common patterns for churn prediction (from domain accel)     │
│  - Success rates for each pattern                               │
│  - Estimated effort and timeline                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌─── Contract Generation with Intelligence ───────────────────────┐
│                                                                  │
│  TypeScript: POST /api/build/contract/generate                  │
│       ↓                                                          │
│  Python: POST /api/kag/contract/suggest                         │
│                                                                  │
│  Returns:                                                        │
│  - ODCS v4.0 contract (from Phase 1)                            │
│  - Quality rules (inferred from graph patterns)                 │
│  - Similar contracts (for validation)                           │
│  - Applied patterns (with success rates)                        │
│  - Confidence score and reasoning                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌─── Tool Routing with Pattern History ──────────────────────────┐
│                                                                  │
│  TypeScript: tool-router.ts decision                            │
│       +                                                          │
│  Python: Pattern success metrics from graph                     │
│                                                                  │
│  Decision: SQLMesh                                               │
│  Reason: Similar high-volume projects used SQLMesh (3/3)        │
│  Success Rate: 100% for this pattern                            │
│  Cost Savings: 90% storage vs full refresh                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌─── Code Generation & Deployment ────────────────────────────────┐
│                                                                  │
│  TypeScript: Existing generators                                │
│  - sqlmesh-generator.ts (model generation)                      │
│  - airflow-generator.ts (DAG generation)                        │
│  - great-expectations-generator.ts (quality suite)              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌─── Automatic Metadata Capture (The Virtuous Cycle) ────────────┐
│                                                                  │
│  Python: POST /api/kag/contracts/record-success                 │
│                                                                  │
│  Captures to Kuzu Graph:                                         │
│  - Contract → Product relationship                              │
│  - Sources → Contract usage                                     │
│  - Pattern → Success metrics                                    │
│  - Stakeholder → Domain linkage                                 │
│  - Quality outcomes → Pattern validation                        │
│                                                                  │
│  Next Time: Better recommendations from learned patterns        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Conversation-First UI: Implementation Plan

### Current Build Page State

**File**: `app/(main)/build/page.tsx`

The Build page currently has:
- Mock domain workspace UI
- Placeholder for linear workflow
- No conversation-first entry point

### Integration Tasks

#### Task 1: Add Conversation-First Entry Component

**File**: `components/build/ConversationEntry.tsx` (NEW)

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function ConversationEntry() {
  const [input, setInput] = useState('');
  const [extracting, setExtracting] = useState(false);

  const handleExtract = async () => {
    setExtracting(true);

    // Call Phase 1 parse endpoint
    const basicParse = await fetch('/api/build/request/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: input,
        requester: 'current-user@company.com' // From auth
      })
    });

    // Call Phase 2 KAG enhancement
    const kagEnhancement = await fetch('http://localhost:8000/api/kag/parse-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: input,
        domain: 'retail', // Infer from user context
        requester: 'current-user@company.com'
      })
    });

    const basic = await basicParse.json();
    const enhanced = await kagEnhancement.json();

    // Merge results
    const merged = {
      ...basic.extracted,
      similar_contracts: enhanced.similar_contracts,
      domain_patterns: enhanced.domain_patterns,
      graph_insights: enhanced.understanding,
      confidence: Math.max(basic.confidence, enhanced.confidence)
    };

    // Navigate to context confirmation
    router.push(`/build/confirm?data=${encodeURIComponent(JSON.stringify(merged))}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold mb-2">What are you building?</h2>
        <p className="text-muted-foreground mb-4">
          Paste your request (Slack message, email, or just describe it)
        </p>
      </div>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`Example: "Hey Sarah, Jennifer from Marketing needs customer churn data for the Q4 campaign. She needs it by Friday with 95% accuracy. Can you help?"`}
        className="min-h-[200px]"
      />

      <div className="flex gap-2">
        <Button
          onClick={handleExtract}
          disabled={!input || extracting}
          className="w-full"
        >
          {extracting ? 'Extracting Context...' : 'Extract Context & Continue'}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        Or: <button className="underline">Paste Jira/ServiceNow URL</button> |
        <button className="underline ml-2">Fill form manually</button>
      </div>
    </div>
  );
}
```

#### Task 2: Context Confirmation Component

**File**: `components/build/ContextConfirmation.tsx` (NEW)

```typescript
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ExtractedContext {
  business_need: string;
  stakeholder?: string;
  deadline?: string;
  quality_requirements: any;
  similar_contracts: any[];
  domain_patterns: any[];
  confidence: number;
}

export function ContextConfirmation({ context }: { context: ExtractedContext }) {
  const [confirmed, setConfirmed] = useState<ExtractedContext>(context);

  const handleContinue = () => {
    // Proceed to source selection with confirmed context
    router.push(`/build/sources?context=${encodeURIComponent(JSON.stringify(confirmed))}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">🎯 Business Context</h3>
          <Badge variant={context.confidence > 0.85 ? 'default' : 'secondary'}>
            {Math.round(context.confidence * 100)}% confidence
          </Badge>
        </div>

        <div className="space-y-4">
          {/* What they need */}
          <div>
            <label className="text-sm font-medium">What they need:</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-600">✓</span>
              <input
                type="text"
                value={confirmed.business_need}
                onChange={(e) => setConfirmed({ ...confirmed, business_need: e.target.value })}
                className="flex-1 px-3 py-2 border rounded"
              />
            </div>
          </div>

          {/* Quality requirements */}
          <div>
            <label className="text-sm font-medium">Quality requirements:</label>
            <div className="space-y-2 mt-1">
              {Object.entries(confirmed.quality_requirements || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="capitalize">{key}:</span>
                  <span className="font-mono">{JSON.stringify(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Similar contracts from KAG */}
      {context.similar_contracts?.length > 0 && (
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Similar Projects Found</h3>
          <div className="space-y-3">
            {context.similar_contracts.slice(0, 3).map((contract: any, idx: number) => (
              <div key={idx} className="border rounded p-4 hover:bg-accent cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{contract.name}</span>
                  <Badge>{Math.round(contract.similarity * 100)}% similar</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Built by: {contract.owner}</div>
                  <div>Success: {contract.success_rate}% accuracy achieved</div>
                </div>
                <Button size="sm" variant="outline" className="mt-2">
                  Copy This Approach
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain patterns from accelerators */}
      {context.domain_patterns?.length > 0 && (
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">💡 Recommended Patterns</h3>
          <div className="space-y-2">
            {context.domain_patterns.map((pattern: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{pattern.name}</div>
                  <div className="text-sm text-muted-foreground">{pattern.description}</div>
                </div>
                <Button size="sm" variant="ghost">
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={handleContinue} className="w-full" size="lg">
        Continue with Selected Sources →
      </Button>
    </div>
  );
}
```

#### Task 3: Update Build Page Entry Point

**File**: `app/(main)/build/page.tsx` (MODIFY)

```typescript
// Replace current domain workspace with conversation-first entry
import { ConversationEntry } from '@/components/build/ConversationEntry';

export default function BuildPage() {
  return (
    <div className="container mx-auto py-8">
      <ConversationEntry />
    </div>
  );
}
```

#### Task 4: Add Context Confirmation Route

**File**: `app/(main)/build/confirm/page.tsx` (NEW)

```typescript
import { ContextConfirmation } from '@/components/build/ContextConfirmation';

export default function ConfirmPage({ searchParams }: { searchParams: { data: string } }) {
  const context = JSON.parse(decodeURIComponent(searchParams.data));

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ContextConfirmation context={context} />
    </div>
  );
}
```

---

## The Virtuous Cycle: Automatic Learning

### How It Works

```typescript
// After successful build
async function recordBuildSuccess(build: CompletedBuild) {
  // Store in Kuzu graph
  await fetch('http://localhost:8000/api/kag/contracts/record-success', {
    method: 'POST',
    body: JSON.stringify({
      contract: build.contract,
      sources_used: build.sources,
      tool_selected: build.tool,
      quality_achieved: build.quality_score,
      stakeholder: build.stakeholder,
      pattern: build.pattern,
      success: true,
      duration: build.duration_seconds
    })
  });

  // Now available for next build's recommendations
}
```

### What Gets Learned

1. **Source Combinations**: Which sources are used together for specific use cases
2. **Pattern Success**: Which patterns achieve high quality scores
3. **Tool Effectiveness**: Which tool (dbt vs SQLMesh) works best for each pattern
4. **Quality Baselines**: Typical quality requirements for each domain
5. **Stakeholder Patterns**: Which stakeholders request which types of products

### How It Improves Recommendations

```
Build 1: 70% confidence, manual corrections needed
   ↓ (stores corrected context in graph)
Build 2: 85% confidence, fewer corrections
   ↓ (stores successful pattern)
Build 3: 92% confidence, one-click suggestion available
   ↓ (pattern becomes reusable)
Build 10: 95% confidence, automatic pipeline suggestion
```

---

## Updated Implementation Roadmap

### What's Already Done ✅

| Original Task | Status | Implementation |
|--------------|--------|----------------|
| ODCS Schema (Week 1-2) | ✅ DONE | Phase 1: `lib/schemas/`, contract-serializer.ts |
| Contract Validation | ✅ DONE | Phase 1: ODCS v4.0 validation |
| dbt Generator (Week 3-4) | ✅ DONE | `lib/generators/dbt-generator.ts` |
| SQLMesh Generator | ✅ DONE | `lib/generators/sqlmesh-generator.ts` |
| Airflow Generator | ✅ DONE | `lib/generators/airflow-generator.ts` |
| GE Integration (Week 5-6) | ✅ DONE | `lib/generators/great-expectations-generator.ts` |
| Profiling Service (Week 7-8) | ✅ DONE | `lib/generators/profiling-generator.ts` |
| Tool Routing (Week 9-10) | ✅ DONE | Phase 1: `lib/services/tool-router.ts` |
| Pattern Learning (Week 11-12) | ✅ DONE | Phase 2: `services/pattern_engine.py` |
| Graph Intelligence | ✅ DONE | Phase 2: Kuzu + KAG services |

**Result**: ~10 weeks of work completed

### What's Next ⏳

| Task | Estimated Time | Status |
|------|---------------|--------|
| Conversation Entry UI | 2-3 days | Ready to start |
| Context Confirmation UI | 2-3 days | Ready to start |
| KAG Integration Wiring | 1-2 days | Routes exist, need frontend calls |
| Similar Projects Display | 1 day | Data available from KAG |
| Pattern Application UI | 1-2 days | Patterns available from KAG |
| Success Recording | 1 day | Endpoint needed |
| Testing & Refinement | 3-5 days | End-to-end validation |

**Total**: 2-3 weeks to full conversation-first flow

### Original 16-Week Roadmap → 3-Week Completion

By completing Phase 1 + Phase 2 upfront, we've:
- ✅ Finished all backend infrastructure (10 weeks compressed to 2 weeks)
- ✅ Built intelligent routing and pattern learning
- ⏳ Only need UI integration (3 weeks remaining)

---

## Testing Strategy

### Test 1: Conversation Extraction Accuracy

```bash
# Test basic parsing
curl -X POST http://localhost:3000/api/build/request/parse \
  -d '{"description":"Customer churn for Q4 marketing campaign","requester":"test@co.com"}'

# Test KAG enhancement
curl -X POST http://localhost:8000/api/kag/parse-request \
  -d '{"description":"Customer churn for Q4 marketing campaign","domain":"retail"}'

# Compare: Confidence, extracted fields, suggested sources
```

### Test 2: Similar Contract Discovery

```bash
# Find similar contracts
curl -X POST http://localhost:8000/api/kag/contracts/similar \
  -d '{"description":"Customer churn prediction","domain":"retail","min_similarity":0.7}'

# Expected: 3-5 similar contracts with confidence scores
```

### Test 3: Pattern Recommendations

```bash
# Get domain patterns
curl http://localhost:8000/api/kag/domain/retail/patterns

# Find matching patterns
curl -X POST http://localhost:8000/api/kag/patterns/find \
  -d '{"requirements":{"business_need":"churn"},"domain":"retail"}'

# Expected: Ranked patterns with success rates
```

### Test 4: End-to-End Flow

1. Paste conversation in UI
2. Verify extraction accuracy
3. Confirm context with corrections
4. Check similar projects display
5. Apply recommended pattern
6. Generate contract
7. Verify metadata capture

---

## Success Metrics

### Phase Integration Success

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Context Extraction Time** | <60 seconds | Time from paste to confirmed context |
| **Extraction Accuracy** | >85% | Fields requiring no correction |
| **Similar Contract Relevance** | >75% | User clicks "Copy This Approach" |
| **Pattern Application Rate** | >60% | Builds using recommended patterns |
| **Graph Learning Rate** | Improve 5%/week | Confidence score increase over time |

### Business Impact

| Metric | Baseline | Target | Current |
|--------|----------|--------|---------|
| **Time to Start Build** | 30 min | 2 min | TBD |
| **Build Success Rate** | 60% | 85% | TBD |
| **Pattern Reuse** | 0% | 60% | 0% (no data yet) |
| **DataHub Completeness** | 45% | 85% | 45% (baseline) |

---

## Next Steps

### Immediate (This Week)

1. ✅ Complete KAG integration testing
2. ⏳ Build conversation entry UI component
3. ⏳ Wire TypeScript→Python KAG calls
4. ⏳ Display similar contracts from graph

### Short-Term (Next 2 Weeks)

1. Add context confirmation screen
2. Implement pattern application UI
3. Build success recording endpoint
4. End-to-end flow testing

### Medium-Term (Next Month)

1. Measure accuracy improvements
2. Analyze pattern reuse rates
3. Validate DataHub enrichment
4. Optimize graph queries

---

## Conclusion

**We've accelerated the Build page vision by 10+ weeks** by building Phase 1 (TypeScript APIs) and Phase 2 (KAG intelligence) upfront. Now we just need to:

1. **Wire the UI** - Conversation entry + context confirmation (3 days)
2. **Connect the systems** - TypeScript calls Python for enhancement (2 days)
3. **Display intelligence** - Show similar contracts and patterns (2 days)
4. **Test & refine** - End-to-end validation (5 days)

**Result**: Full conversation-first build flow with graph-enhanced intelligence in **~2-3 weeks** instead of 16 weeks.

The key insight: **Build the intelligence layer first, then add the UI on top** - this ensures recommendations are actually smart from day one, creating immediate value that drives adoption.
