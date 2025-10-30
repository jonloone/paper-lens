# Stepper Components Consolidation
**Created:** 2025-10-28
**Purpose:** Document stepper consolidation strategy

---

## Current State Analysis

### ✅ Build Flow Status
**Current Implementation:** Phase-based state machine (NO stepper)
- `app/(main)/build/page.tsx`: Uses phase state: `'builder' | 'workspace' | 'success'`
- `UnifiedProductWorkspace`: Card-based interface, no stepper integration
- **Result:** All stepper components are currently UNUSED

### Component Inventory (6 components found)

#### 1. ✅ KEEP: HorizontalStepper.tsx (172 lines)
**Status:** Best-in-class implementation, ready for future use
**Features:**
- React.memo optimizations for performance
- Memoized step items prevent unnecessary re-renders
- Save draft functionality with "last saved" indicator
- Animated progress line with calculated offsets
- Icon support (CheckCircle2 for completed, custom icons, fallback numbers)
- Accessible navigation (disabled state for inaccessible steps)
- Full dark mode support
- Uses `Step` interface from `lib/build/use-stepper`

**Why Keep:**
- Production-ready, most sophisticated implementation
- Performance optimized
- Comprehensive feature set
- Canonical implementation for future stepper needs

**Interface:**
```typescript
interface HorizontalStepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (stepIndex: number) => void;
  className?: string;
  lastSaved?: string | null;
  onSaveDraft?: () => void;
}
```

---

#### 2. ❌ DELETE: VerticalStepper.tsx (105 lines)
**Status:** Alternative layout, not actively used
**Features:**
- Fixed left sidebar layout (w-48, left-0)
- Vertical connecting lines between steps
- Progress indicator at bottom with percentage bar
- Icon support, accessible navigation
- Uses same `Step` interface as HorizontalStepper

**Why Delete:**
- Not used anywhere in codebase
- Horizontal layout is preferred UX pattern
- Different layout doesn't justify keeping duplicate logic

---

#### 3. ❌ DELETE: WorkflowProgressBar.tsx (85 lines)
**Status:** Simpler alternative, not used
**Features:**
- Simpler horizontal progress with large circles
- CheckCircle/Clock/Circle icons for state
- Step name + description display
- Optional click handlers
- Different interface (`WorkflowStep` vs `Step`)

**Why Delete:**
- Not used anywhere in codebase
- Superseded by HorizontalStepper (more sophisticated)
- Interface incompatible with use-stepper hook

**Interface:**
```typescript
interface WorkflowStep {
  id: string;
  name: string;
  description: string;
}
```

---

#### 4. ❌ DELETE: MinimalProgressBar.tsx (64 lines)
**Status:** Compact inline version, not used
**Features:**
- Compact inline progress with chevrons between steps
- Shows description only for current step
- Minimal design for space-constrained UIs
- Different interface (`ProgressStep` vs `Step`)

**Why Delete:**
- Not used anywhere (only referenced by LinearWorkflowNew which is also unused)
- Interface incompatible with use-stepper hook
- Functionality covered by HorizontalStepper

**Interface:**
```typescript
interface ProgressStep {
  id: string;
  name: string;
  description: string;
}
```

---

#### 5. ❌ DELETE: LinearWorkflow.tsx (158 lines)
**Status:** Legacy step-based orchestrator, obsolete
**Features:**
- 5-step workflow: Data Discovery, Quality Analysis, Transform Design, API Configuration, Deployment
- Step-based state machine with workflowData state
- CrewAI recommendations per step
- Progressive complexity integration
- Contextual sidebar

**Why Delete:**
- Orchestrates obsolete step components (DataDiscoveryStepNew, QualityAnalysisStep, etc.)
- Replaced by UnifiedProductWorkspace
- Part of legacy step-based flow being removed
- Not used anywhere in current build flow

---

#### 6. ❌ DELETE: LinearWorkflowNew.tsx (162 lines)
**Status:** Alternative orchestrator, obsolete
**Features:**
- Same 5-step workflow as LinearWorkflow
- Uses MinimalProgressBar instead of custom stepper
- Similar architecture and feature set
- Different step components (DataDiscoveryStep vs DataDiscoveryStepNew)

**Why Delete:**
- Also orchestrates obsolete step components
- Duplicate of LinearWorkflow functionality
- Not used anywhere in current build flow
- Part of legacy step-based flow cleanup

---

## Consolidation Strategy

### Current Build Flow (No Stepper)
```typescript
// build/page.tsx
type BuildPhase = 'builder' | 'workspace' | 'success';

// State machine
'builder'   → Intent/Template/Clone selection
'workspace' → UnifiedProductWorkspace (card-based)
'success'   → DeploymentSuccess

// No stepper component used
```

### Future Stepper Integration (If Needed)
When/if a stepper is needed in the future, use HorizontalStepper:

```typescript
import { HorizontalStepper } from '@/components/build/HorizontalStepper';
import { useStepper } from '@/lib/build/use-stepper';

const STEPS = [
  { id: 'define', label: 'Define', icon: FileText },
  { id: 'sources', label: 'Sources', icon: Database },
  { id: 'transform', label: 'Transform', icon: Code },
  { id: 'quality', label: 'Quality', icon: Shield },
  { id: 'deploy', label: 'Deploy', icon: Rocket }
];

function MyWorkflow() {
  const { currentStep, completedSteps, goToStep } = useStepper(STEPS);

  return (
    <div>
      <HorizontalStepper
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
        lastSaved={lastSavedTime}
        onSaveDraft={handleSaveDraft}
      />
      {/* Workflow content */}
    </div>
  );
}
```

---

## Files to Delete

### ❌ Confirmed Safe to Delete (No Imports)
```bash
# Stepper variants
rm components/build/VerticalStepper.tsx
rm components/build/WorkflowProgressBar.tsx
rm components/build/MinimalProgressBar.tsx

# Legacy workflow orchestrators
rm components/build/LinearWorkflow.tsx
rm components/build/LinearWorkflowNew.tsx
```

### ✅ File to Keep
```bash
# Keep as canonical stepper implementation
components/build/HorizontalStepper.tsx
```

---

## Migration Path

### No Migration Needed
- Current build flow doesn't use any stepper
- No active imports of deprecated components
- HorizontalStepper ready for future use when needed

### If Stepper is Added in Future

**Before (hypothetical):**
```typescript
import { VerticalStepper } from '@/components/build/VerticalStepper';
```

**After:**
```typescript
import { HorizontalStepper } from '@/components/build/HorizontalStepper';
// Horizontal layout is preferred UX pattern
```

**Before:**
```typescript
import { MinimalProgressBar } from '@/components/build/MinimalProgressBar';
```

**After:**
```typescript
import { HorizontalStepper } from '@/components/build/HorizontalStepper';
// Use standard Step interface from use-stepper hook
```

---

## Component Comparison

| Feature | HorizontalStepper | VerticalStepper | WorkflowProgressBar | MinimalProgressBar |
|---------|-------------------|-----------------|---------------------|-------------------|
| **Status** | ✅ Keep | ❌ Delete | ❌ Delete | ❌ Delete |
| **Lines** | 172 | 105 | 85 | 64 |
| **Layout** | Horizontal | Vertical sidebar | Horizontal | Inline |
| **Interface** | Step (use-stepper) | Step (use-stepper) | WorkflowStep | ProgressStep |
| **Save Draft** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Optimized** | React.memo | Basic | Basic | Basic |
| **Progress Line** | Animated | Percentage bar | Static line | Chevrons |
| **Current Use** | None | None | None | None |

---

## Impact Analysis

### Deletions (5 files)
- **VerticalStepper.tsx**: 105 lines
- **WorkflowProgressBar.tsx**: 85 lines
- **MinimalProgressBar.tsx**: 64 lines
- **LinearWorkflow.tsx**: 158 lines
- **LinearWorkflowNew.tsx**: 162 lines
- **Total:** ~574 lines removed

### Keep (1 file)
- **HorizontalStepper.tsx**: 172 lines
- **Net reduction:** ~402 lines
- **Simplification:** Single canonical stepper implementation

---

## Related Components to Delete (Separate Task)

These orchestrator components will be deleted as part of Task 9:

### Step Components (used by LinearWorkflow)
- `components/build/steps/DataDiscoveryStepNew.tsx`
- `components/build/steps/QualityAnalysisStep.tsx`
- `components/build/steps/TransformDesignStep.tsx`
- `components/build/steps/APIConfigurationStep.tsx`
- `components/build/steps/DeploymentStep.tsx`
- `components/build/steps/Step1DefineProduct.tsx`
- `components/build/steps/Step2SelectSources.tsx`
- `components/build/steps/Step3SQLWorkstation.tsx`
- `components/build/steps/Step4Quality.tsx`
- `components/build/steps/Step5DeliveryConfig.tsx`
- `components/build/steps/Step6ReviewDeploy.tsx`

### Contextual Sidebars (used by LinearWorkflow)
- `components/build/ContextualSidebar.tsx`
- `components/build/ContextualSidebarNew.tsx`

---

## Success Criteria

✅ Only HorizontalStepper remains
✅ All duplicate steppers deleted
✅ No broken imports
✅ Build compiles without errors
✅ Future stepper integration uses HorizontalStepper
✅ ~400 lines of duplicate code removed

---

## Next Steps

1. ✅ **Task 6 (this task):** Document stepper consolidation ← **DONE**
2. **Task 7:** Create BuildFlowContext with React Context
3. **Task 8:** Refactor UnifiedProductWorkspace to use BuildFlowContext
4. **Task 9:** Delete legacy components (including these 5 stepper files)
5. **Task 10:** Update build page.tsx
6. **Task 11:** Test consolidated build flow

---

**Estimated Impact:**
- Delete: 5 files (~574 lines)
- Keep: 1 file (172 lines)
- Net reduction: Simpler codebase, single stepper system
- Zero migration needed: No active usage

**Decision:** Clean consolidation with zero risk - all deleted components are unused.
