# Step 4: Quality Gates Preview & Acknowledgment
## Build Flow Integration - Deploy-First Quality Philosophy

---

## Overview

Step 4 represents the **automated quality validation checkpoint** in the NexusOne build flow. Unlike traditional approval-based systems, Step 4 executes pre-defined quality gates automatically and presents results in a 3-tier framework that enables 80% self-service deployment without manual approval.

**Core Philosophy**: Deploy first, optimize later. Block only on critical issues, warn on quality concerns, suggest optimizations post-deployment.

---

## User Experience Flow

### Transition from Step 3 → Step 4

When the user clicks "Next" from Step 3 (Transformations), the system:

1. **Auto-triggers gate execution** via `/api/build/run-quality-gates` endpoint
2. **Shows loading state** with real-time progress updates for each gate
3. **Displays results** in 3-tier breakdown when complete (5-15 seconds)
4. **Enables decision** based on gate outcomes

```
Step 3: Transformations
  ↓ [User clicks "Next"]
  ↓ [Auto-execute quality gates via QualityGatesService]
  ↓ [Real-time progress: "Running Gate 1/5: Policy Compliance..."]
Step 4: Quality Gates Preview
  ↓ [Display 3-tier results]
  ↓ [User acknowledges warnings or fixes blockers]
Step 5: Delivery Options
```

### Step 4 UI Components

#### 1. Gate Execution Status (Loading State)

```
┌─────────────────────────────────────────────────────────┐
│  Running Quality Gates...                                │
│                                                           │
│  ✓ Gate 1: Policy Compliance          [Passed]          │
│  ✓ Gate 2: Cost Estimation             [Warning]         │
│  ⏳ Gate 3: Schema Validation           [Running...]      │
│  ⏺ Gate 4: Security Scanning            [Pending]        │
│  ⏺ Gate 5: Performance Prediction       [Pending]        │
│                                                           │
│  Estimated time: 10 seconds remaining                    │
└─────────────────────────────────────────────────────────┘
```

#### 2. Results Display (3-Tier Breakdown)

**Tier 1: Blocking Issues (Must Fix to Deploy)**

```
┌─────────────────────────────────────────────────────────┐
│  🚫 BLOCKING ISSUES (1)                                  │
│                                                           │
│  Gate 4: Security Scanning                               │
│  ❌ PII detected in 3 columns without masking           │
│                                                           │
│  Columns: customer_email, ssn, phone_number              │
│                                                           │
│  Action Required:                                         │
│  • Apply data masking in Step 3 transformations          │
│  • Or mark columns for automatic masking via Ranger      │
│                                                           │
│  [Fix in Step 3] [Auto-Apply Masking]                   │
└─────────────────────────────────────────────────────────┘
```

**Tier 2: Warnings (Acknowledge to Proceed)**

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  WARNINGS (2)                                         │
│                                                           │
│  Gate 2: Cost Estimation                                 │
│  ⚠️  Daily cost: $450 (exceeds $100 threshold)          │
│  Expected monthly cost: ~$13,500                         │
│                                                           │
│  Recommendation: Review source table size and filters    │
│                                                           │
│  Gate 5: Performance Prediction                          │
│  ⚠️  Query may take 45+ seconds with current volume     │
│  Consider partitioning by date_column                    │
│                                                           │
│  ☐ I acknowledge these warnings and will optimize       │
│     after deployment                                     │
│                                                           │
│  [Acknowledge & Continue]                                │
└─────────────────────────────────────────────────────────┘
```

**Tier 3: Optimizations (Deploy Now, Improve Later)**

```
┌─────────────────────────────────────────────────────────┐
│  💡 OPTIMIZATION OPPORTUNITIES (3)                        │
│                                                           │
│  These suggestions will be tracked in the governance     │
│  dashboard for post-deployment improvement.              │
│                                                           │
│  • Add secondary index on customer_id (30% speedup)      │
│  • Enable column statistics for query optimization       │
│  • Consider materialized view for frequently accessed    │
│    aggregations                                          │
│                                                           │
│  [View Full Report] [Track in Dashboard]                │
└─────────────────────────────────────────────────────────┘
```

#### 3. Navigation Actions

```
┌─────────────────────────────────────────────────────────┐
│  Gate Results Summary:                                   │
│  ✓ 3 Passed  |  ❌ 1 Blocked  |  ⚠️ 2 Warnings          │
│                                                           │
│  [< Back to Step 3]  [View Governance Dashboard]         │
│                                                           │
│  [Continue to Delivery] ← Disabled until blockers fixed  │
└─────────────────────────────────────────────────────────┘
```

---

## 5 Quality Gates Explained

### Gate 1: Policy Compliance (Tier 1 - Blocking)

**What it checks**: OPA policy validation for data governance rules

**Validates**:
- Data source access permissions
- Data classification requirements (PII, sensitive, public)
- Usage restrictions based on data contracts
- Cross-domain data sharing policies

**Example Failures**:
```json
{
  "gate": "policy_compliance",
  "severity": "blocking",
  "violations": [
    {
      "policy": "cross_domain_sharing",
      "message": "Customer PII data cannot be joined with Marketing domain without approval",
      "sources": ["customers.personal_info", "marketing.campaigns"]
    }
  ]
}
```

**Educational Moment**:
> **Why this matters**: Policy compliance ensures your data product respects organizational governance rules and legal requirements. Violations here could lead to regulatory fines or data breaches.

**User Action**: Remove restricted source or request governance approval

### Gate 2: Cost Estimation (Tier 1 if >$1000/day, Tier 2 if >$100/day)

**What it checks**: Estimated compute and storage costs

**Calculates**:
- Query compute cost based on data volume and complexity
- Storage cost for output data product
- Ongoing refresh costs for scheduled pipelines

**Example Warning**:
```json
{
  "gate": "cost_estimation",
  "severity": "warning",
  "estimated_daily_cost": 450.00,
  "breakdown": {
    "compute": 380.00,
    "storage": 70.00
  },
  "recommendations": [
    "Filter earlier in pipeline to reduce data scanned",
    "Use partitioning to limit full table scans"
  ]
}
```

**Educational Moment**:
> **Cost Control**: Daily costs >$100 warrant review. Consider adding filters, using smaller date ranges, or optimizing joins to reduce costs.

**User Action**: Acknowledge warning or optimize query in Step 3

### Gate 3: Schema Validation (Tier 1 - Blocking)

**What it checks**: Schema compatibility and breaking changes

**Validates**:
- Output schema matches expected contract (if defined)
- No breaking changes to existing data product versions
- Column types are consistent with downstream consumers
- Required columns are present

**Example Failure**:
```json
{
  "gate": "schema_validation",
  "severity": "blocking",
  "violations": [
    {
      "type": "breaking_change",
      "column": "customer_id",
      "issue": "Type changed from STRING to INTEGER",
      "impact": "3 downstream consumers will break"
    }
  ]
}
```

**Educational Moment**:
> **Schema Contracts**: Breaking schema changes can break downstream consumers. Use schema versioning or additive changes only.

**User Action**: Revert breaking change or create new version

### Gate 4: Security Scanning (Tier 1 - Blocking)

**What it checks**: PII detection, secrets, sensitive data exposure

**Scans for**:
- PII patterns (emails, SSNs, phone numbers, addresses)
- Embedded secrets (API keys, passwords, tokens)
- Unmasked sensitive data in output
- Missing encryption for sensitive columns

**Example Failure**:
```json
{
  "gate": "security_scanning",
  "severity": "blocking",
  "findings": [
    {
      "type": "pii_detected",
      "columns": ["email", "ssn", "phone"],
      "confidence": 0.98,
      "recommendation": "Apply masking or request data steward approval"
    }
  ]
}
```

**Educational Moment**:
> **PII Protection**: Personally identifiable information must be masked or encrypted before deployment to prevent data breaches.

**User Action Options**:
1. Apply masking transformation in Step 3
2. Click "Auto-Apply Masking" to generate Ranger policies
3. Request data steward approval for legitimate PII exposure

### Gate 5: Performance Prediction (Tier 2 - Warning)

**What it checks**: Expected query performance and resource usage

**Predicts**:
- Query execution time based on data volume
- Resource utilization (CPU, memory, I/O)
- Potential bottlenecks (large joins, full scans)
- Partitioning opportunities

**Example Warning**:
```json
{
  "gate": "performance_prediction",
  "severity": "warning",
  "predicted_execution_time": "45-60 seconds",
  "bottlenecks": [
    {
      "type": "full_table_scan",
      "table": "orders",
      "size": "500GB",
      "recommendation": "Add partition filter on order_date"
    }
  ]
}
```

**Educational Moment**:
> **Performance Optimization**: Slow queries impact user experience. Post-deployment, visit the governance dashboard to track and optimize performance.

**User Action**: Acknowledge warning, track in optimization queue

---

## Backend Integration

### API Endpoint: `/api/build/run-quality-gates`

**Request**:
```typescript
POST /api/build/run-quality-gates
{
  "data_product_name": "customer_360_view",
  "product_definition": {
    "sources": ["customers", "orders", "interactions"],
    "transformations": [...],
    "output_schema": [...],
    "classification": "PII"
  },
  "sample_data": null // Optional: Pass sample for faster validation
}
```

**Response**:
```typescript
{
  "execution_id": "exec_12345",
  "status": "completed",
  "duration_ms": 8450,
  "results": {
    "tier1_blocking": [
      {
        "gate": "security_scanning",
        "passed": false,
        "severity": "blocking",
        "message": "PII detected without masking",
        "details": {...}
      }
    ],
    "tier2_warnings": [
      {
        "gate": "cost_estimation",
        "passed": false,
        "severity": "warning",
        "message": "Daily cost: $450",
        "details": {...}
      }
    ],
    "tier3_optimizations": [
      {
        "gate": "performance_prediction",
        "passed": true,
        "severity": "info",
        "message": "3 optimization opportunities detected",
        "details": {...}
      }
    ]
  },
  "can_proceed": false, // False if any Tier 1 blockers
  "requires_acknowledgment": true // True if any Tier 2 warnings
}
```

### Real-Time Progress Updates

**WebSocket or Polling Approach**:

```typescript
// Option 1: Polling (simpler, recommended)
const { data, isLoading } = useQuery({
  queryKey: ['gate-execution', executionId],
  queryFn: () => fetch(`/api/build/gate-status/${executionId}`),
  refetchInterval: 1000, // Poll every second
  enabled: !!executionId
});

// Option 2: WebSocket (for real-time)
const ws = new WebSocket(`/api/build/gate-stream/${executionId}`);
ws.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  // Update UI with progress: { gate: 'schema_validation', status: 'running' }
};
```

---

## Frontend Component Architecture

### Component: `QualityGatesPreview.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

interface QualityGatesPreviewProps {
  productDefinition: DataProductDefinition;
  onBack: () => void;
  onContinue: () => void;
}

export function QualityGatesPreview({
  productDefinition,
  onBack,
  onContinue
}: QualityGatesPreviewProps) {
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);

  // Step 1: Trigger gate execution on mount
  useEffect(() => {
    async function runGates() {
      const response = await fetch('/api/build/run-quality-gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_product_name: productDefinition.name,
          product_definition: productDefinition
        })
      });
      const { execution_id } = await response.json();
      setExecutionId(execution_id);
    }
    runGates();
  }, []);

  // Step 2: Poll for results
  const { data: results, isLoading } = useQuery({
    queryKey: ['gate-execution', executionId],
    queryFn: async () => {
      const res = await fetch(`/api/build/gate-status/${executionId}`);
      return res.json();
    },
    enabled: !!executionId,
    refetchInterval: (data) => data?.status === 'completed' ? false : 1000
  });

  // Step 3: Render loading state
  if (isLoading || !results || results.status !== 'completed') {
    return <GateExecutionProgress gates={results?.progress || []} />;
  }

  // Step 4: Render results
  const hasBlockers = results.results.tier1_blocking.some(g => !g.passed);
  const hasWarnings = results.results.tier2_warnings.some(g => !g.passed);
  const canProceed = !hasBlockers && (!hasWarnings || warningsAcknowledged);

  return (
    <div className="space-y-6">
      {/* Tier 1: Blockers */}
      {hasBlockers && (
        <BlockingIssuesCard
          issues={results.results.tier1_blocking.filter(g => !g.passed)}
          onFixClick={(gate) => {
            // Navigate back to Step 3 with gate context
            onBack();
          }}
        />
      )}

      {/* Tier 2: Warnings */}
      {hasWarnings && (
        <WarningsCard
          warnings={results.results.tier2_warnings.filter(g => !g.passed)}
          acknowledged={warningsAcknowledged}
          onAcknowledge={() => setWarningsAcknowledged(true)}
        />
      )}

      {/* Tier 3: Optimizations */}
      <OptimizationsCard
        optimizations={results.results.tier3_optimizations}
      />

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Transformations
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href="/govern/quality" target="_blank">
              View Governance Dashboard
            </a>
          </Button>
          <Button
            onClick={onContinue}
            disabled={!canProceed}
          >
            Continue to Delivery →
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Integration with Governance Dashboard

### Linking to `/govern/quality`

When users click "View Governance Dashboard" from Step 4, they're taken to the full governance visibility dashboard where they can:

1. **Review historical gate executions** for this data product
2. **Track Tier 3 optimization opportunities** in the optimization queue
3. **View post-deployment monitoring** (once deployed)
4. **Access audit logs** for compliance reporting

**Contextual Deep Link**:
```typescript
<Button asChild>
  <a href={`/govern/quality?product=${productDefinition.id}&tab=executions`}>
    View Full Gate History
  </a>
</Button>
```

### Post-Deployment Monitoring

After deployment, Step 4 gate results feed into:
- **Quality Trends Chart**: Track quality score over time
- **Recent Executions Table**: Show gate results for each pipeline run
- **Optimization Queue**: Surface Tier 3 recommendations for improvement
- **Alerts Panel**: Notify on regression or new issues

---

## UX Principles

### 1. Progressive Disclosure

**Start Simple**: Show summary counts first
```
✓ 3 Passed  |  ❌ 1 Blocked  |  ⚠️ 2 Warnings
```

**Expand on Demand**: Click to see detailed gate results

### 2. Educational Moments

Each gate includes:
- **What it checks**: Plain-language explanation
- **Why it matters**: Business/technical rationale
- **What to do**: Clear action items

### 3. Transparency

- Show exact gate execution times
- Display confidence scores for AI-based predictions
- Link to documentation for each gate
- Provide "Learn More" links to governance docs

### 4. Self-Service Actions

Enable users to:
- **Auto-apply fixes**: "Apply Masking" for PII detection
- **Request approvals**: "Request Exception" for policy violations
- **Track improvements**: "Add to Optimization Queue" for Tier 3

### 5. No Dead Ends

Always provide clear next actions:
- Blockers → "Fix in Step 3" or "Request Exception"
- Warnings → "Acknowledge & Continue" or "Optimize Now"
- Optimizations → "Deploy Now" or "Track for Later"

---

## Error Handling

### Gate Execution Failures

**Scenario**: Backend service unavailable or gate execution timeout

```typescript
{
  "execution_id": "exec_12345",
  "status": "failed",
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Great Expectations service is temporarily unavailable",
    "gate": "schema_validation"
  }
}
```

**UI Handling**:
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  Gate Execution Partial Failure                      │
│                                                           │
│  Gate 3 (Schema Validation) failed to execute due to     │
│  service unavailability.                                 │
│                                                           │
│  You can:                                                 │
│  • [Retry] - Attempt gate execution again                │
│  • [Skip & Deploy] - Deploy without this gate (warning)  │
│  • [Contact Support] - Get assistance                    │
└─────────────────────────────────────────────────────────┘
```

### Partial Results

If some gates pass but others fail to execute, show partial results and allow continuation with warnings.

---

## Testing Strategy

### Unit Tests

```typescript
// Test gate result rendering
describe('QualityGatesPreview', () => {
  it('should block deployment with Tier 1 failures', () => {
    const results = {
      tier1_blocking: [{ gate: 'security_scanning', passed: false }],
      tier2_warnings: [],
      tier3_optimizations: []
    };
    render(<QualityGatesPreview results={results} />);
    expect(screen.getByText('Continue to Delivery')).toBeDisabled();
  });

  it('should require acknowledgment for Tier 2 warnings', () => {
    const results = {
      tier1_blocking: [],
      tier2_warnings: [{ gate: 'cost_estimation', passed: false }],
      tier3_optimizations: []
    };
    render(<QualityGatesPreview results={results} />);
    expect(screen.getByText('Continue to Delivery')).toBeDisabled();

    // Acknowledge warnings
    fireEvent.click(screen.getByLabelText(/acknowledge/i));
    expect(screen.getByText('Continue to Delivery')).toBeEnabled();
  });
});
```

### Integration Tests

```typescript
// Test full gate execution flow
describe('Gate Execution Flow', () => {
  it('should execute all gates and display results', async () => {
    render(<BuildFlow currentStep={4} />);

    // Wait for auto-execution
    await waitFor(() => {
      expect(screen.getByText(/Running Gate 1/i)).toBeInTheDocument();
    });

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/Gate Results Summary/i)).toBeInTheDocument();
    }, { timeout: 15000 });

    // Verify all gates displayed
    expect(screen.getByText(/Policy Compliance/i)).toBeInTheDocument();
    expect(screen.getByText(/Cost Estimation/i)).toBeInTheDocument();
    expect(screen.getByText(/Schema Validation/i)).toBeInTheDocument();
  });
});
```

---

## Success Metrics

### User Metrics
- **Gate Execution Time**: <10 seconds for 95% of products
- **Blocker Rate**: <5% of products blocked (most issues caught early)
- **Warning Acknowledgment Rate**: >80% (users understand and accept risks)
- **Optimization Adoption**: >40% of Tier 3 suggestions implemented post-deployment

### System Metrics
- **Gate Reliability**: >99.5% successful execution
- **False Positive Rate**: <2% (gates accurately identify real issues)
- **Performance**: Gate execution time scales linearly with data volume

---

## Future Enhancements

### Phase 2: AI-Powered Fixes

Auto-generate fix suggestions:
- PII masking → Generate SQL transformation
- Performance issues → Suggest query rewrites
- Schema violations → Propose compatible changes

### Phase 3: Custom Gates

Allow organizations to define custom gates:
```typescript
const customGate = {
  name: "Business Logic Validation",
  severity: "blocking",
  check: async (product) => {
    // Custom validation logic
    return validateBusinessRules(product);
  }
};
```

### Phase 4: Historical Intelligence

Learn from past gate results:
- Predict likely issues before execution
- Surface common patterns and fixes
- Recommend best practices based on org history

---

## Conclusion

Step 4 (Quality Gates Preview) embodies the "deploy-first, optimize-later" philosophy by:

1. **Automating validation** - No manual quality configuration required
2. **3-tier framework** - Block critical issues, warn on concerns, suggest optimizations
3. **Self-service approach** - 80% of products deploy without approval
4. **Educational moments** - Users learn governance best practices
5. **Integration with monitoring** - Tier 3 optimizations tracked post-deployment

By making quality gates transparent, fast, and actionable, Step 4 enables rapid deployment while maintaining governance standards.
