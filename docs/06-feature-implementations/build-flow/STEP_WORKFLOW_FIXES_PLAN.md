# Build Workflow: Critical UX Fixes
## Moving Policies to Step 4 + Adding dbt to Step 3

**Date**: October 16, 2025
**Status**: 🔧 IN PROGRESS
**Priority**: HIGH - User Experience Issues

---

## Issues Identified

### Issue 1: Policies in Wrong Step ❌

**Current State**:
- **Step 1 (Define Product)**: Shows "Applicable Governance Policies" section
- **Step 4 (Quality Rules)**: Has manual governance configuration

**Problem**:
- Policies are about **quality enforcement**, not product definition
- Users don't need to see compliance requirements while defining basic product info
- Creates cognitive overload in Step 1
- Breaks logical workflow progression

**Expected Flow**:
```
Step 1: Define Product → Basic info (name, description, domain, owner)
Step 2: Select Sources → Choose tables
Step 3: Write SQL → Transformation logic
Step 4: Quality Rules → Validation + POLICIES (what will be enforced)
Step 5: Configure Delivery → Output format
Step 6: Review & Deploy → Final check
```

### Issue 2: No dbt Option in Step 3 ❌

**Current State**:
- Step 3 only shows SQL editor with real Trino validation
- No way to choose dbt project generation
- Missing the "Implementation Strategy Selector" discussed in improvement plan

**Expected Options in Step 3**:
1. **SQL Editor** (current implementation) - For custom SQL queries
2. **dbt Project Generator** (missing) - For standard dbt patterns
3. **SQLMesh Model** (future) - For advanced versioning

---

## Fix Plan

### Fix 1: Move Policies to Step 4

**Step 1 Changes** (`components/build/steps/Step1DefineProduct.tsx`):
- ✅ Remove lines 100-136: Policy fetching logic
- ✅ Remove lines 432-523: Applicable Governance Policies card
- ✅ Simplify to just basic product definition

**Step 4 Changes** (`components/build/steps/Step4Quality.tsx`):
- ✅ Add policy fetching logic (fetch based on Step 1 domain/tags)
- ✅ Add "Applicable Governance Policies" card as **first card** (before quality rules)
- ✅ Show which policies will be enforced and why
- ✅ Link policy violations to specific quality rules they require

**Benefits**:
- Cleaner Step 1 (faster to complete)
- Policies contextualized with quality rules
- Users understand "WHY" certain quality checks are required
- Logical flow: "These are the policies → Here are the required quality rules"

### Fix 2: Add dbt Project Generation to Step 3

**Step 3 Changes** (`components/build/steps/Step3WriteSQL.tsx`):
- ✅ Add "Implementation Strategy" selector at top:
  - Option 1: **Custom SQL** (current SQL editor)
  - Option 2: **dbt Project** (new dbt generator)
  - Option 3: **SQLMesh Model** (future, show as "Coming Soon")
- ✅ For dbt option, show:
  - Template selector (Customer 360, Product Analytics, etc.)
  - Auto-generated staging/intermediate/marts structure
  - TODOs with AI suggestions for business logic
  - Preview of generated files

**dbt Templates to Implement**:
1. **Customer 360 View** - Join customers + orders + support tickets
2. **Product Analytics** - Event tracking + funnel analysis
3. **Financial Reporting** - Revenue + expenses + reconciliation
4. **Marketing Attribution** - Campaign → Conversion tracking
5. **Operational Dashboard** - System metrics + KPIs

---

## Implementation Priority

### Phase 1: Move Policies (1-2 hours)
**Why First**: This is a UX issue affecting every user immediately

**Steps**:
1. Remove policy code from Step 1
2. Add policy fetching to Step 4
3. Position policies card before quality rules
4. Test policy inheritance still works

### Phase 2: Add dbt Strategy Selector (3-4 hours)
**Why Second**: More complex, requires new UI components

**Steps**:
1. Create ImplementationStrategySelector component
2. Add dbt template selection UI
3. Wire up dbt generator (existing `lib/generators/dbt-generator.ts`)
4. Show file preview for generated dbt project
5. Allow "Download dbt Project" or "Continue with SQL"

---

## Detailed Implementation: Move Policies

### Step 1: Remove from Define Product

**Remove this entire section** (lines 100-136, 432-523):

```typescript
// DELETE THIS - Move to Step 4
const [applicablePolicies, setApplicablePolicies] = useState<GovernancePolicy[]>([]);
const [loadingPolicies, setLoadingPolicies] = useState(false);

useEffect(() => {
  // Policy fetching logic - MOVE TO STEP 4
}, [definition.domain, definition.tags]);

// ... and the entire Governance Policies card (lines 432-523)
```

### Step 2: Add to Quality Rules

**Add at top of Step4Quality** (after imports):

```typescript
// Add to imports
import { useState, useEffect } from 'react';
import { Shield, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Add to interface
export interface Step4Data {
  qualityRules: QualityRule[];
  slaConfig: SLAConfig;
  governance?: GovernanceConfig;
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
  applicablePolicies?: GovernancePolicy[];  // NEW
}

interface Step4QualityProps {
  initialData?: Partial<Step4Data>;
  schema: Array<{ name: string; type: string }>;
  productDefinition?: any;  // NEW - from Step 1
  onComplete: (data: Step4Data) => void;
  onBack: () => void;
}

// Add state
const [applicablePolicies, setApplicablePolicies] = useState<GovernancePolicy[]>([]);
const [loadingPolicies, setLoadingPolicies] = useState(false);

// Fetch policies based on domain from Step 1
useEffect(() => {
  if (!productDefinition?.domain) {
    setApplicablePolicies([]);
    return;
  }

  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const response = await fetch(`/api/v1/policies/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productDefinition.name,
          domain: productDefinition.domain,
          tags: productDefinition.tags || []
        })
      });
      const data = await response.json();
      setApplicablePolicies(data.effective_policies || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoadingPolicies(false);
    }
  };

  fetchPolicies();
}, [productDefinition]);
```

**Add Policies Card** (BEFORE Quality Rules card):

```tsx
{/* Applicable Governance Policies - FIRST CARD */}
<Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Applicable Governance Policies
        </CardTitle>
        <CardDescription className="mt-1">
          These policies must be satisfied before deployment
        </CardDescription>
      </div>
      {applicablePolicies.length > 0 && (
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {applicablePolicies.length} {applicablePolicies.length === 1 ? 'policy' : 'policies'}
        </Badge>
      )}
    </div>
  </CardHeader>
  <CardContent>
    {loadingPolicies ? (
      <p className="text-sm text-muted-foreground">Loading policies...</p>
    ) : applicablePolicies.length === 0 ? (
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          No specific policies found. Standard quality checks will apply.
        </AlertDescription>
      </Alert>
    ) : (
      <div className="space-y-3">
        {applicablePolicies.map((policy) => (
          <div key={policy.id} className="p-4 border rounded-lg bg-muted/50">
            {/* Policy display - same as Step 1 */}
          </div>
        ))}

        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 mt-4">
          <Shield className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Quality Rules Below</p>
            <p className="text-sm">
              The quality rules you define below must satisfy these policies.
              <strong> Blocking policies</strong> will prevent deployment if not met.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    )}
  </CardContent>
</Card>

{/* Then Quality Rules card */}
<Card className="shadow-lg border-2">
  <CardHeader>
    <CardTitle className="text-2xl">Validation Checks</CardTitle>
  </CardHeader>
  {/* ... existing quality rules */}
</Card>
```

---

## Detailed Implementation: Add dbt to Step 3

### Add Implementation Strategy Selector

**Create new component** (`components/build/ImplementationStrategySelector.tsx`):

```tsx
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code2, FileCode, Layers } from 'lucide-react';

export type ImplementationStrategy = 'custom_sql' | 'dbt_project' | 'sqlmesh';

interface Props {
  selected: ImplementationStrategy;
  onChange: (strategy: ImplementationStrategy) => void;
}

export function ImplementationStrategySelector({ selected, onChange }: Props) {
  const strategies = [
    {
      id: 'custom_sql' as const,
      name: 'Custom SQL',
      description: 'Write your own SQL with AI assistance',
      icon: Code2,
      recommended: 'For custom logic and advanced queries',
      available: true
    },
    {
      id: 'dbt_project' as const,
      name: 'dbt Project',
      description: 'Generate full dbt project from templates',
      icon: FileCode,
      recommended: 'For standard analytics patterns',
      available: true
    },
    {
      id: 'sqlmesh' as const,
      name: 'SQLMesh Model',
      description: 'Advanced versioning and time-travel',
      icon: Layers,
      recommended: 'For complex data contracts',
      available: false  // Coming soon
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {strategies.map((strategy) => (
        <Card
          key={strategy.id}
          className={`p-4 cursor-pointer transition-all ${
            selected === strategy.id
              ? 'border-2 border-primary bg-primary/5'
              : 'border-2 border-border hover:border-primary/50'
          } ${!strategy.available ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => strategy.available && onChange(strategy.id)}
        >
          <div className="flex items-start justify-between mb-2">
            <strategy.icon className="w-6 h-6" />
            {!strategy.available && (
              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg mb-1">{strategy.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{strategy.description}</p>
          <p className="text-xs text-muted-foreground italic">{strategy.recommended}</p>
        </Card>
      ))}
    </div>
  );
}
```

### Update Step3WriteSQL

**Add strategy selector and conditional rendering**:

```tsx
const [implementationStrategy, setImplementationStrategy] = useState<ImplementationStrategy>('custom_sql');

return (
  <div className="space-y-8">
    {/* Implementation Strategy Selector */}
    <Card>
      <CardHeader>
        <CardTitle>Choose Implementation Approach</CardTitle>
      </CardHeader>
      <CardContent>
        <ImplementationStrategySelector
          selected={implementationStrategy}
          onChange={setImplementationStrategy}
        />
      </CardContent>
    </Card>

    {/* Conditional Rendering */}
    {implementationStrategy === 'custom_sql' && (
      <TiSQLWorkstation {... existing props ...} />
    )}

    {implementationStrategy === 'dbt_project' && (
      <DBTProjectGenerator
        productDefinition={productDefinition}
        selectedSources={selectedSources}
        onComplete={(dbtProject) => {
          // Save generated dbt project
          onComplete({ sql: dbtProject.models[0].sql, dbtProject });
        }}
      />
    )}
  </div>
);
```

---

## Testing Checklist

### Test 1: Policy Movement
- [ ] Step 1 no longer shows policies
- [ ] Step 1 completes faster (under 2 minutes)
- [ ] Step 4 shows policies fetched from Step 1 domain
- [ ] Blocking policies clearly marked
- [ ] Policies appear BEFORE quality rules

### Test 2: dbt Integration
- [ ] Strategy selector appears in Step 3
- [ ] Can switch between Custom SQL and dbt Project
- [ ] dbt templates load correctly
- [ ] Generated dbt project has correct structure
- [ ] Can continue with generated SQL

---

## Success Criteria

**Policy Movement**:
- ✅ Step 1 completion time < 2 minutes (down from 3-4 min)
- ✅ Users understand policy context when defining quality rules
- ✅ 90%+ of users prefer new flow in testing

**dbt Addition**:
- ✅ 40%+ of users choose dbt project over custom SQL
- ✅ dbt project generation < 30 seconds
- ✅ Generated projects pass dbt compile without errors

---

## Implementation Timeline

- **Fix 1 (Policies)**: 1-2 hours
- **Fix 2 (dbt Strategy)**: 3-4 hours
- **Total**: 4-6 hours

**Status**: Ready to implement
