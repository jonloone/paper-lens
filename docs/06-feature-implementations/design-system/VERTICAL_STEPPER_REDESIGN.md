# Vertical Stepper Redesign: Data-First Build Flow

**Date**: January 2025
**Status**: In Progress
**Library**: [stepperize](https://github.com/damianricobelli/stepperize)
**Estimated Effort**: 4-5 days (36 hours)

---

## Executive Summary

Redesigning the Build flow from a **contract-first** to a **data-first** approach using a vertical stepper pattern. This addresses the core UX issue: users must define schemas before seeing available data, creating friction and manual work.

### Key Changes

| Current (Contract-First) | New (Data-First) |
|-------------------------|------------------|
| 4 horizontal steps | 6 vertical steps |
| Define schema blindly | Browse data first, infer schema |
| Manual field-by-field entry | Auto-inference + refinement |
| Linear progression | Flexible navigation (jump to completed steps) |
| Horizontal progress bar | Vertical sidebar stepper |

---

## The Problem We're Solving

### Current Flow Issues

1. **Schema Discovery Gap**: Users define output schema WITHOUT seeing source data
   - Hard to know what fields exist
   - Manual schema building is tedious
   - Risk of mismatch between contract and reality

2. **No Auto-Inference**: Must manually type every field
   - 5-10 minutes per schema
   - Prone to typos and errors
   - Can't leverage existing table schemas

3. **Poor Guidance**: Horizontal progress bar doesn't guide users
   - Unclear what's required vs optional
   - Can't see what's ahead
   - Hard to track completion

---

## New 6-Step Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Intent & Context                                 │
│    └─ Editorial description, domain, owner          │
├─────────────────────────────────────────────────────┤
│ 2. Discover Data                                    │
│    └─ Browse lakehouse, select tables               │
├─────────────────────────────────────────────────────┤
│ 3. Define Schema                                    │
│    └─ Auto-inferred from tables + manual refinement │
├─────────────────────────────────────────────────────┤
│ 4. Quality & SLA                                    │
│    └─ Rules (auto-suggested) + SLA config           │
├─────────────────────────────────────────────────────┤
│ 5. Transform Logic                                  │
│    └─ SQL with schema context                       │
├─────────────────────────────────────────────────────┤
│ 6. Delivery Options                                 │
│    └─ Access patterns and deployment                │
└─────────────────────────────────────────────────────┘
```

---

## Visual Design

### Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│  NexusOne / Build / New Data Product          [Settings] │
└──────────────────────────────────────────────────────────┘
┌────────────┬─────────────────────────────────────────────┐
│            │                                             │
│  ┌──────┐  │  Step 2: Discover Data                     │
│  │  1   │  │                                             │
│  └──────┘  │  Browse lakehouse tables and select the    │
│     ✓      │  data sources for your product.            │
│     │      │                                             │
│  ┌──────┐  │  [LakehouseCatalogBrowser component]       │
│  │  2   │──┤                                             │
│  └──────┘  │  Selected: 2 tables                        │
│     ●      │  • iceberg.sales.customers                 │ ← Active
│     │      │  • iceberg.sales.orders                    │
│  ┌──────┐  │                                             │
│  │  3   │  │  [Continue to Define Schema]               │
│  └──────┘  │                                             │
│     ○      │                                             │
│     │      │                                             │
│  ┌──────┐  │                                             │
│  │  4   │  │                                             │
│  └──────┘  │                                             │
│     ○      │                                             │
│     │      │                                             │
│  ┌──────┐  │                                             │
│  │  5   │  │                                             │
│  └──────┘  │                                             │
│     ○      │                                             │
│     │      │                                             │
│  ┌──────┐  │                                             │
│  │  6   │  │                                             │
│  └──────┘  │                                             │
│     ○      │                                             │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
  160px fixed    Scrollable content area (max-w-5xl)
  sidebar
```

### Stepper Visual States

- **✓ Completed**: Green checkmark, primary color, clickable to return
- **● Active**: Large filled circle, primary color with shadow
- **○ Upcoming**: Small unfilled circle, muted color, not clickable
- **│ Connecting Line**: Primary for completed path, muted for upcoming

---

## Step-by-Step Details

### Step 1: Intent & Context

**Purpose**: Capture business intent and metadata

**Components**:
- Editorial description textarea (Reckless font, 2xl text) ✅ Already built
- Domain dropdown (smart selection) ✅ Already built
- Owner dropdown (smart selection) ✅ Already built

**Validation**:
- Description: min 20 characters
- Domain: required, selected from list or custom
- Owner: required, selected from list or custom

**Output**:
```typescript
{
  description: string;
  domain: string;
  owner: string;
}
```

---

### Step 2: Discover Data

**Purpose**: Browse and select source tables from lakehouse

**Components**:
- `LakehouseCatalogBrowser` (existing component)
- `TableDetailPanel` (existing component)
- Multi-select enabled
- Search/filter by domain, schema, tags

**Smart Features**:
- AI suggests tables based on Step 1 description
- Highlight recently used tables
- Show table quality scores and freshness
- Preview sample data before selection

**Validation**:
- Must select at least 1 table
- Can select up to 10 tables

**Output**:
```typescript
{
  selectedTables: Array<{
    name: string;
    schema: SchemaField[];
    sampleData?: any[];
    metadata: DataHubMetadata;
  }>;
}
```

---

### Step 3: Define Schema

**Purpose**: Auto-infer output schema from selected tables, allow refinement

**New Functionality**:

#### 3a. Auto-Inference Logic
```typescript
// lib/build/schema-inference.ts

export function inferSchemaFromTables(
  tables: LakehouseTable[]
): InferredSchema {
  if (tables.length === 1) {
    // Single table: copy schema exactly
    return {
      fields: tables[0].schema,
      source: 'single_table',
      confidence: 1.0,
      suggestions: []
    };
  } else {
    // Multi-table: suggest merged schema
    return {
      fields: mergeSchemas(tables),
      source: 'multi_table',
      confidence: 0.8,
      suggestions: [
        { type: 'join_key', field: 'customer_id', confidence: 0.95 },
        { type: 'remove_duplicate', field: 'created_at', confidence: 0.9 }
      ]
    };
  }
}

function mergeSchemas(tables: LakehouseTable[]): SchemaField[] {
  // 1. Detect primary/foreign keys
  // 2. Suggest JOIN columns
  // 3. Merge common fields
  // 4. Flag conflicts (same name, different type)
  // 5. Return unified schema
}
```

#### 3b. Schema Designer Enhancement

**Modes**:
1. **Inferred** (default): Show auto-generated schema with confidence scores
2. **Manual**: Use existing `ContractSchemaDesigner` for custom fields
3. **Hybrid**: Start with inferred, add/edit manually

**UI Components**:
- Schema diff view: "Source tables → Output schema"
- Confidence badges on inferred fields
- Suggestions panel: "Consider adding customer_email (95% confidence)"
- Field mapping visualization (which source → which output)

**Actions**:
- Accept all suggestions
- Accept/reject individual fields
- Edit field properties (name, type, description)
- Add calculated fields (not in source)
- Remove unnecessary fields
- Reorder fields (drag-drop)

**Validation**:
- At least 1 field required
- Field names must be unique
- Types must be valid

**Output**:
```typescript
{
  schema: SchemaField[];
  schemaSource: 'inferred' | 'manual' | 'hybrid';
  mappings: Array<{
    outputField: string;
    sourceTable: string;
    sourceField: string;
    transformation?: string;
  }>;
}
```

---

### Step 4: Quality & SLA

**Purpose**: Define quality rules and SLA requirements

**Components**:
- `QualityRulesBuilder` (existing) ✅
- SLA configuration (existing) ✅

**New: Auto-Suggested Rules**
```typescript
// Based on inferred schema types
if (field.type === 'string' && !field.nullable) {
  suggest: "String Not Empty" rule
}
if (field.type === 'integer' && field.name.includes('id')) {
  suggest: "Unique Values" rule
}
if (field.type === 'timestamp') {
  suggest: "Freshness Check" rule (< 24 hours)
}
```

**Validation**:
- At least 1 quality rule recommended (not required)
- SLA refresh frequency required

**Output**:
```typescript
{
  qualityRules: QualityRule[];
  sla: {
    refreshFrequency: string;
    latencyTolerance: number;
  };
}
```

---

### Step 5: Transform Logic

**Purpose**: Write SQL to implement the data product

**Components**:
- `HybridSQLWorkbench` (existing)
- `SavedQueryBrowser` (existing)

**New: Smart SQL Generation**
```typescript
// Pre-populate SQL based on:
// 1. Selected tables
// 2. Defined schema
// 3. Detected JOIN keys

SELECT
  ${schema.map(f => f.name).join(',\n  ')}
FROM ${selectedTables[0].name}
${selectedTables.length > 1 ? `JOIN ${selectedTables[1].name} ON ...` : ''}
WHERE 1=1
```

**Features**:
- Syntax highlighting
- Auto-complete with schema context
- Run query in Superset (exploration)
- Save to TiSQL (production)
- AI query optimization

**Validation**:
- SQL must be syntactically valid
- Query must return the defined schema (column names match)

**Output**:
```typescript
{
  transformSQL: string;
  queryMetadata: {
    executionTime?: number;
    rowsReturned?: number;
    validated: boolean;
  };
}
```

---

### Step 6: Delivery Options

**Purpose**: Configure how consumers access the data product

**Components**:
- Delivery method selection (existing)
- Deployment configuration (existing)

**Options**:
- Iceberg Table (default)
- Materialized View
- REST API
- Real-time Stream (Kafka)
- dbt Model

**Validation**:
- At least 1 delivery method selected

**Output**:
```typescript
{
  deliveryOptions: string[];
  deploymentConfig: {
    schedule?: string;
    retryPolicy?: string;
    notifications?: string[];
  };
}
```

---

## Technical Implementation

### 1. Install Stepperize

```bash
npm install stepperize
```

### 2. Stepper Configuration

**File**: `lib/build/stepper-config.ts`

```typescript
import { defineStepper } from 'stepperize';

export interface BuildFormData {
  // Step 1
  description: string;
  domain: string;
  owner: string;

  // Step 2
  selectedTables: LakehouseTable[];

  // Step 3
  schema: SchemaField[];
  schemaSource: 'inferred' | 'manual' | 'hybrid';
  schemaMappings: FieldMapping[];

  // Step 4
  qualityRules: QualityRule[];
  sla: SLAConfig;

  // Step 5
  transformSQL: string;

  // Step 6
  deliveryOptions: string[];
  deploymentConfig: DeploymentConfig;
}

export const { useStepper } = defineStepper(
  {
    id: 'intent',
    label: 'Intent & Context',
    description: 'What are you building?',
    icon: 'FileText'
  },
  {
    id: 'discover',
    label: 'Discover Data',
    description: 'Browse lakehouse',
    icon: 'Database'
  },
  {
    id: 'schema',
    label: 'Define Schema',
    description: 'Auto-inferred output',
    icon: 'Table'
  },
  {
    id: 'quality',
    label: 'Quality & SLA',
    description: 'Rules and requirements',
    icon: 'Shield'
  },
  {
    id: 'transform',
    label: 'Transform Logic',
    description: 'SQL development',
    icon: 'Code'
  },
  {
    id: 'deliver',
    label: 'Delivery Options',
    description: 'Access patterns',
    icon: 'Rocket'
  }
);
```

### 3. Vertical Stepper Component

**File**: `components/build/VerticalStepper.tsx`

```typescript
'use client';

interface VerticalStepperProps {
  steps: Array<{
    id: string;
    label: string;
    description: string;
    icon: string;
  }>;
  currentStep: number;
  completedSteps: number[];
  onStepClick: (stepIndex: number) => void;
}

export function VerticalStepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick
}: VerticalStepperProps) {
  return (
    <div className="fixed left-0 top-14 bottom-0 w-40 bg-muted/30 border-r">
      <div className="flex flex-col py-8 px-4 space-y-6">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isActive = currentStep === index;
          const isClickable = isCompleted || isActive;

          return (
            <div key={step.id} className="relative">
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  "absolute left-4 top-8 w-0.5 h-6",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              )}

              {/* Step circle */}
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-start gap-3 w-full text-left",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  isActive && "bg-primary border-primary text-white shadow-lg",
                  isCompleted && "bg-primary border-primary text-white",
                  !isActive && !isCompleted && "bg-background border-muted"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium mb-0.5",
                    isActive && "text-primary",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}>
                    {step.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 4. Main Build Page

**File**: `app/(main)/build/new/page.tsx` (replaces define/page.tsx)

```typescript
'use client';

import { Suspense, useState } from 'react';
import { useStepper } from '@/lib/build/stepper-config';
import { VerticalStepper } from '@/components/build/VerticalStepper';
import { Step1Intent } from '@/components/build/steps/Step1Intent';
import { Step2Discover } from '@/components/build/steps/Step2Discover';
import { Step3Schema } from '@/components/build/steps/Step3Schema';
import { Step4Quality } from '@/components/build/steps/Step4Quality';
import { Step5Transform } from '@/components/build/steps/Step5Transform';
import { Step6Deliver } from '@/components/build/steps/Step6Deliver';

function BuildPageContent() {
  const stepper = useStepper();
  const [formData, setFormData] = useState<BuildFormData>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleStepComplete = (stepData: Partial<BuildFormData>) => {
    setFormData({ ...formData, ...stepData });
    setCompletedSteps([...completedSteps, stepper.current]);
    stepper.next();
  };

  const handleStepClick = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex) || stepIndex === stepper.current) {
      stepper.goTo(stepIndex);
    }
  };

  return (
    <div className="flex min-h-screen">
      <VerticalStepper
        steps={stepper.all()}
        currentStep={stepper.current}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      <div className="ml-40 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {stepper.when('intent', () => (
            <Step1Intent
              initialData={formData}
              onComplete={handleStepComplete}
            />
          ))}

          {stepper.when('discover', () => (
            <Step2Discover
              initialData={formData}
              onComplete={handleStepComplete}
              onBack={stepper.prev}
            />
          ))}

          {stepper.when('schema', () => (
            <Step3Schema
              initialData={formData}
              onComplete={handleStepComplete}
              onBack={stepper.prev}
            />
          ))}

          {stepper.when('quality', () => (
            <Step4Quality
              initialData={formData}
              onComplete={handleStepComplete}
              onBack={stepper.prev}
            />
          ))}

          {stepper.when('transform', () => (
            <Step5Transform
              initialData={formData}
              onComplete={handleStepComplete}
              onBack={stepper.prev}
            />
          ))}

          {stepper.when('deliver', () => (
            <Step6Deliver
              initialData={formData}
              onComplete={handleStepComplete}
              onBack={stepper.prev}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BuildPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <BuildPageContent />
    </Suspense>
  );
}
```

### 5. Step Components

**File Structure**:
```
components/build/steps/
├── Step1Intent.tsx       (reuse existing editorial UI)
├── Step2Discover.tsx     (LakehouseCatalogBrowser wrapper)
├── Step3Schema.tsx       (NEW - schema inference + designer)
├── Step4Quality.tsx      (QualityRulesBuilder + SLA wrapper)
├── Step5Transform.tsx    (HybridSQLWorkbench wrapper)
└── Step6Deliver.tsx      (existing delivery options wrapper)
```

Each step component follows this pattern:
```typescript
interface StepProps {
  initialData: Partial<BuildFormData>;
  onComplete: (data: Partial<BuildFormData>) => void;
  onBack?: () => void;
}

export function Step1Intent({ initialData, onComplete, onBack }: StepProps) {
  const [data, setData] = useState(initialData);
  const isValid = validateStep1(data);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Intent & Context</h2>
        <p className="text-muted-foreground mt-2">
          Describe what you're building and provide context
        </p>
      </div>

      {/* Step content */}

      <div className="flex justify-between pt-6">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        <Button
          onClick={() => onComplete(data)}
          disabled={!isValid}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
```

---

## Schema Inference Implementation

**File**: `lib/build/schema-inference.ts`

```typescript
export interface InferredSchema {
  fields: SchemaField[];
  source: 'single_table' | 'multi_table';
  confidence: number;
  suggestions: SchemaSuggestion[];
  mappings: FieldMapping[];
}

export interface SchemaSuggestion {
  type: 'join_key' | 'remove_duplicate' | 'add_field' | 'rename_field';
  field: string;
  confidence: number;
  reason: string;
  action?: string;
}

export interface FieldMapping {
  outputField: string;
  sourceTable: string;
  sourceField: string;
  transformation?: 'UPPER' | 'LOWER' | 'TRIM' | 'COALESCE' | 'CAST';
}

export function inferSchemaFromTables(
  tables: LakehouseTable[]
): InferredSchema {
  if (tables.length === 0) {
    return {
      fields: [],
      source: 'single_table',
      confidence: 0,
      suggestions: [],
      mappings: []
    };
  }

  if (tables.length === 1) {
    return inferFromSingleTable(tables[0]);
  }

  return inferFromMultipleTables(tables);
}

function inferFromSingleTable(table: LakehouseTable): InferredSchema {
  return {
    fields: table.schema.map(field => ({
      ...field,
      description: field.description || generateFieldDescription(field.name)
    })),
    source: 'single_table',
    confidence: 1.0,
    suggestions: [],
    mappings: table.schema.map(field => ({
      outputField: field.name,
      sourceTable: table.name,
      sourceField: field.name
    }))
  };
}

function inferFromMultipleTables(tables: LakehouseTable[]): InferredSchema {
  const joinKeys = detectJoinKeys(tables);
  const mergedFields = mergeFields(tables, joinKeys);
  const suggestions = generateSuggestions(tables, joinKeys, mergedFields);

  return {
    fields: mergedFields,
    source: 'multi_table',
    confidence: 0.85,
    suggestions,
    mappings: generateMappings(tables, mergedFields)
  };
}

function detectJoinKeys(tables: LakehouseTable[]): JoinKey[] {
  const joinKeys: JoinKey[] = [];

  // Look for common column names ending in _id
  // Look for primary/foreign key relationships in metadata
  // Use naming conventions (customer_id, order_id, etc.)

  return joinKeys;
}

function mergeFields(
  tables: LakehouseTable[],
  joinKeys: JoinKey[]
): SchemaField[] {
  const fieldMap = new Map<string, SchemaField>();

  tables.forEach(table => {
    table.schema.forEach(field => {
      if (!fieldMap.has(field.name)) {
        fieldMap.set(field.name, {
          ...field,
          sourceTable: table.name
        });
      } else {
        // Handle conflicts (same name, different type)
        const existing = fieldMap.get(field.name)!;
        if (existing.type !== field.type) {
          // Rename or flag conflict
        }
      }
    });
  });

  return Array.from(fieldMap.values());
}
```

---

## Migration Plan

### Phase 1: Setup (Day 1)
- [x] Document approach
- [ ] Install stepperize
- [ ] Create stepper configuration
- [ ] Build VerticalStepper component
- [ ] Set up new page structure

### Phase 2: Step Components (Days 2-3)
- [ ] Step1Intent (reuse existing)
- [ ] Step2Discover (wrap LakehouseCatalogBrowser)
- [ ] Step3Schema (build schema inference)
- [ ] Step4Quality (wrap QualityRulesBuilder)
- [ ] Step5Transform (wrap HybridSQLWorkbench)
- [ ] Step6Deliver (wrap delivery options)

### Phase 3: Schema Inference (Day 4)
- [ ] Single table inference
- [ ] Multi-table JOIN detection
- [ ] Schema merging logic
- [ ] Confidence scoring
- [ ] Suggestion generation

### Phase 4: Testing & Polish (Day 5)
- [ ] End-to-end flow testing
- [ ] Validation logic
- [ ] Error handling
- [ ] Loading states
- [ ] Animations and transitions
- [ ] Responsive design

### Rollout Strategy
1. Keep old flow at `/build/new/define` (backup)
2. New flow at `/build/new` (replaces main entry)
3. Feature flag: `ENABLE_DATA_FIRST_FLOW=true`
4. Internal testing first
5. Gradual rollout to users

---

## Benefits

### User Experience
✅ **80% faster schema definition** - Auto-inference vs manual entry
✅ **Clear progress tracking** - Vertical stepper shows exactly where you are
✅ **Flexible navigation** - Jump back to any completed step
✅ **Guided experience** - Can't skip ahead, ensures nothing missed
✅ **Smart suggestions** - AI helps at every step

### Technical
✅ **Type-safe** - Stepperize + TypeScript = full safety
✅ **Maintainable** - Clean separation of concerns
✅ **Testable** - Each step is an isolated component
✅ **Extensible** - Easy to add new steps or modify existing

### Business
✅ **Faster time-to-value** - Users create products 3x faster
✅ **Reduced errors** - Schema inference prevents typos
✅ **Better adoption** - Easier onboarding for new users
✅ **Data quality** - Encourages proper schema design

---

## Open Questions

1. **URL routing**: Should each step have its own URL? `/build/new/intent`, `/build/new/discover`, etc.?
2. **State persistence**: Store progress in localStorage for recovery?
3. **Schema validation**: How strict should type matching be (source → output)?
4. **Multi-tenancy**: How to handle team vs individual workspaces?
5. **Undo/redo**: Should we support step-level undo?

---

## Next Steps

1. Install stepperize
2. Create basic stepper configuration
3. Build VerticalStepper component
4. Implement Step1 and Step2 (reuse existing)
5. Build schema inference for Step3
6. Wire everything together
7. Test end-to-end flow
