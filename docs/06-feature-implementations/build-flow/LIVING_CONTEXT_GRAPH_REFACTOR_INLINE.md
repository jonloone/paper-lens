# Living Context Graph - Refactored to Inline Experience

**Status**: ✅ Refactoring Complete
**Date**: October 14, 2025
**Change**: Removed popup dialog, eliminated duplicate fields, auto-populate businessContext from existing Step 1 fields

---

## Summary

Refactored the Living Context Graph implementation based on user feedback to eliminate the popup dialog and field duplication. Instead of interrupting the user after source selection with a dialog asking for duplicate information, we now:

1. **Reuse existing fields from Step 1** (Basic Information card)
2. **Auto-populate businessContext** when completing Step 1
3. **Automatically infer quality expectations** when Step 2 loads
4. **Show quality targets inline** as a small badge in the header

This creates a much smoother, non-interrupting workflow with no redundant data entry.

---

## What Changed

### Before (Popup Approach with Duplicate Fields)
```
Step 1: Define Product
  • Basic Info (name, description, owner, domain, tags)
  • Refresh Schedule (hourly, daily, weekly)
  • SLA Expectations (freshness, quality, availability)
  • Business Context ← DUPLICATE FIELDS!
    - Department (duplicate of domain)
    - Primary Use Case (duplicate of description)
    - Stakeholder (duplicate of owner)
    - Tags (duplicate of tags)
  ↓
Step 2: Select Sources
  ↓
Step 3: Write SQL
```

**Problems**:
- Duplicate fields: Department = Domain, Use Case = Description, Stakeholder = Owner
- User forced to re-enter information already provided
- Confusing UX - why enter the same data twice?

### After (Auto-Population Approach)
```
Step 1: Define Product
  • Basic Info (name, description, owner, domain, tags)
  • Data Freshness & Quality (combined refresh schedule + SLA)
    - Refresh Schedule (hourly, daily, weekly)
    - SLA Expectations (freshness, quality, availability)
  → Auto-populates businessContext behind the scenes:
    - department = domain
    - useCase = description
    - stakeholderName = owner
    - urgency = inferred from schedule.type
  ↓
Step 2: Select Sources
  • Auto-infers quality expectations on page load
  • Shows inline badge: "✨ Quality Targets: 99% accuracy, 24h freshness, 99% complete"
  • User selects tables
  • Continues normally
  ↓
Step 3: Write SQL (context data available for reference)
```

**Benefits**:
- No field duplication - reuse existing data
- No extra user input required
- Natural flow - context captured when defining product
- Quality expectations visible but non-intrusive

---

## Implementation Details

### Step 1 Changes

**File**: `components/build/steps/Step1DefineProduct.tsx`

#### 1. Removed Duplicate "Business Context" Card

The entire "Business Context" card (lines 428-551) has been **removed** because all its fields were duplicates:
- Department → Already captured as "Domain"
- Primary Use Case → Already captured as "Description"
- Stakeholder → Already captured as "Owner"
- Tags → Already captured as "Tags"

#### 2. Combined Cards into "Data Freshness & Quality"

Merged "Refresh Schedule" and "SLA Expectations" cards into single **"Data Freshness & Quality"** card:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Data Freshness & Quality</CardTitle>
    <CardDescription>Define refresh schedule and quality expectations</CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Refresh Schedule Section */}
    <div className="space-y-3">
      <Label className="text-base font-medium">Refresh Schedule</Label>
      {/* Radio buttons for hourly, daily, weekly, cron */}
    </div>

    {/* Divider */}
    <div className="border-t" />

    {/* SLA Expectations Section */}
    <div className="space-y-4">
      <Label className="text-base font-medium">SLA Expectations</Label>
      {/* Freshness, Quality, Availability inputs */}
    </div>
  </CardContent>
</Card>
```

**Rationale**: Schedule and SLA expectations are closely related - the schedule frequency often determines freshness requirements.

#### 3. Added Auto-Population Logic

Added helper function to infer urgency from schedule type:

```typescript
// Helper function to infer urgency from schedule frequency
function inferUrgencyFromSchedule(scheduleType: string): 'critical' | 'high' | 'medium' | 'low' {
  switch (scheduleType) {
    case 'hourly':
      return 'critical'; // Hourly updates indicate critical real-time needs
    case 'daily':
      return 'high';     // Daily updates indicate high priority operational needs
    case 'weekly':
      return 'medium';   // Weekly updates indicate regular reporting needs
    default:
      return 'medium';   // Custom cron defaults to medium
  }
}
```

Updated `handleContinue()` to auto-populate businessContext:

```typescript
function handleContinue() {
  if (isValid) {
    // Auto-populate businessContext from existing fields
    const completedDefinition: ProductDefinition = {
      ...definition,
      businessContext: {
        department: definition.domain,           // Map domain → department
        urgency: inferUrgencyFromSchedule(definition.schedule.type),
        useCase: definition.description,         // Map description → use case
        stakeholderName: definition.owner,       // Map owner → stakeholder
      }
    };
    onComplete({ definition: completedDefinition });
  }
}
```

**Field Mapping**:
- `businessContext.department` = `definition.domain`
- `businessContext.useCase` = `definition.description`
- `businessContext.stakeholderName` = `definition.owner`
- `businessContext.urgency` = inferred from `definition.schedule.type`
- `businessContext.keywords` = `definition.tags` (used by Step 2 when calling API)

#### 4. Updated Validation

Removed businessContext field checks since it's now auto-populated:

```typescript
// Before (required businessContext fields)
const isValid =
  definition.name.trim() !== '' &&
  !nameError &&
  definition.displayName.trim() !== '' &&
  definition.description.trim() !== '' &&
  definition.domain.trim() !== '' &&
  definition.owner.trim() !== '' &&
  definition.businessContext?.department.trim() !== '' &&  // ❌ Removed
  definition.businessContext?.useCase.trim() !== '';       // ❌ Removed

// After (only validate existing fields)
const isValid =
  definition.name.trim() !== '' &&
  !nameError &&
  definition.displayName.trim() !== '' &&
  definition.description.trim() !== '' &&
  definition.domain.trim() !== '' &&
  definition.owner.trim() !== '';
```

#### 5. Removed businessContext from Default State

```typescript
// Before
const [definition, setDefinition] = useState<ProductDefinition>({
  // ... other fields
  businessContext: {
    department: '',
    urgency: 'medium',
    useCase: ''
  }
});

// After (removed - will be auto-populated)
const [definition, setDefinition] = useState<ProductDefinition>({
  // ... other fields
  // businessContext removed from initial state
});
```

### Step 2 Changes

**File**: `components/build/steps/Step2SelectSources.tsx`

**No Changes Required** - The auto-inference useEffect already works correctly with the auto-populated businessContext:

```typescript
useEffect(() => {
  async function inferQualityExpectations() {
    if (productDefinition?.businessContext && !qualityExpectations) {
      setIsInferringQuality(true);
      try {
        const context = {
          stakeholder: {
            name: productDefinition.businessContext.stakeholderName || 'Product Owner',
            email: productDefinition.owner,
            department: productDefinition.businessContext.department,
          },
          businessNeed: {
            summary: productDefinition.businessContext.useCase,
            keywords: productDefinition.tags || [],
            urgency: productDefinition.businessContext.urgency,
          },
          deadline: {
            date: productDefinition.businessContext.deadline || '',
            type: 'soft' as const,
          },
          originalRequest: productDefinition.description,
        };

        const response = await createIntent(productDefinition.name, context);
        setQualityExpectations(response.qualityExpectations);
        // ... rest of the code
      } catch (error) {
        console.error('Failed to infer quality expectations:', error);
      } finally {
        setIsInferringQuality(false);
      }
    }
  }

  inferQualityExpectations();
}, [productDefinition]);
```

The inline quality badge continues to work as expected:

```tsx
{qualityExpectations && (
  <Card className="border-blue-200 bg-blue-50/50 flex-shrink-0">
    <CardContent className="p-3">
      <div className="flex items-center gap-4">
        <span className="text-blue-600 font-medium text-sm">✨ Quality Targets:</span>
        <div className="flex items-center gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Accuracy:</span>{' '}
            <span className="font-semibold">{(qualityExpectations.accuracy * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Freshness:</span>{' '}
            <span className="font-semibold">{qualityExpectations.freshnessHours}h</span>
          </div>
          <div>
            <span className="text-muted-foreground">Complete:</span>{' '}
            <span className="font-semibold">{(qualityExpectations.completeness * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

---

## User Flow (New)

### Complete Workflow

```
1. User navigates to /build

2. Step 1: Define Data Product
   - Enters: customer_churn_risk
   - Display Name: Customer Churn Risk
   - Description: Daily churn scores for Customer Success team
   - Domain: Customer Success ← THIS IS ALSO THE DEPARTMENT
   - Owner: jamie@company.com ← THIS IS ALSO THE STAKEHOLDER
   - Tags: churn, ml, customer ← THESE ARE ALSO KEYWORDS

   [Scroll down to Data Freshness & Quality card]

   Refresh Schedule:
   - Schedule: Daily at 02:00 UTC ← INFERS urgency = "high"

   SLA Expectations:
   - Freshness: 2 hours
   - Quality: 90%
   - Availability: 99.5%

   → Click "Continue to Sources"
   → Behind the scenes, auto-populates:
     businessContext: {
       department: "Customer Success",
       urgency: "high" (inferred from daily schedule),
       useCase: "Daily churn scores for Customer Success team",
       stakeholderName: "jamie@company.com"
     }

3. Step 2: Select Source Data
   [Page loads]

   [Top right shows loading badge]
   ✨ Inferring quality expectations...

   [After 1-2 seconds, badge updates]
   ✨ Quality Targets: 95% accuracy, 24h freshness, 90% complete

   [User browses and selects tables]
   - customer_360 (selected)
   - support_tickets (selected)
   - order_history (selected)

   [Selection badge appears]
   ✓ 3 tables · 15.0M rows

   [Quality badge remains visible]
   ✨ Quality Targets: 95% accuracy, 24h freshness, 90% complete

   → Click "Continue"

4. Step 3: Write SQL
   [Context data available in state for reference]
   [Can show quality targets in sidebar if helpful]

   User writes transformation logic...
```

---

## Benefits of This Approach

### 1. No Field Duplication
User enters each piece of information exactly once. Domain = Department, Description = Use Case, Owner = Stakeholder.

### 2. No Extra Cognitive Load
User doesn't need to think "wait, didn't I already provide this?" Everything flows naturally.

### 3. Intelligent Defaults
Urgency is inferred from schedule frequency - hourly = critical, daily = high, weekly = medium. Makes sense!

### 4. Progressive Disclosure
Business context is captured upfront when user is focused on defining the product, not later when selecting sources.

### 5. Non-Intrusive Quality Feedback
Quality expectations shown as small inline badge - informative but not blocking.

### 6. Simpler Code
Removed entire "Business Context" card (~123 lines) and validation logic for duplicate fields.

### 7. Faster Workflow
No duplicate data entry. No confusion about which field to use. Just continuous forward progress.

---

## Files Changed

### Modified
1. `components/build/steps/Step1DefineProduct.tsx`
   - **Removed**: Entire "Business Context" card (lines 428-551)
   - **Removed**: businessContext initialization in default state
   - **Removed**: businessContext validation checks
   - **Combined**: "Refresh Schedule" + "SLA Expectations" into "Data Freshness & Quality" card
   - **Added**: `inferUrgencyFromSchedule()` helper function
   - **Added**: Auto-population logic in `handleContinue()`

### Unchanged
- `components/build/steps/Step2SelectSources.tsx` - No changes needed, works as-is
- `lib/api/context-api.ts` - No changes needed
- `app/api/context/` routes - No changes needed

---

## Urgency Inference Logic

| Schedule Type | Inferred Urgency | Rationale |
|---------------|------------------|-----------|
| Hourly | Critical | Real-time operational needs, immediate business impact |
| Daily | High | Daily operational reporting, high priority |
| Weekly | Medium | Regular reporting cadence, scheduled reviews |
| Custom Cron | Medium | Default fallback, could be further refined based on cron expression |

**Future Enhancement**: Parse cron expressions to infer more granular urgency (e.g., "every 5 minutes" → critical, "monthly" → low).

---

## Testing

### Manual Testing Checklist
- [x] Step 1 shows combined "Data Freshness & Quality" card
- [x] No duplicate "Business Context" card
- [x] Validation works correctly without businessContext checks
- [x] handleContinue() auto-populates businessContext
- [x] Step 2 receives businessContext and auto-infers quality
- [x] Quality badge shows correct values
- [x] Context data passes to Step 3
- [x] Frontend compiles without errors

### Field Mapping Validation
- [x] domain → businessContext.department
- [x] description → businessContext.useCase
- [x] owner → businessContext.stakeholderName
- [x] schedule.type → businessContext.urgency (inferred)
- [x] tags → used as keywords in API call

### Backward Compatibility
- Existing products without businessContext will work fine (optional field)
- Quality inference only runs if businessContext is present
- Graceful fallback if API fails (just logs error, doesn't block)

---

## Next Steps

### Phase 1 Completion
- [x] Refactor to eliminate field duplication
- [x] Combine related cards for better UX
- [x] Auto-populate businessContext from existing fields
- [ ] Test end-to-end with real backend
- [ ] Update E2E tests to reflect new flow
- [ ] Add quality expectations to Step 3 sidebar for reference
- [ ] Show profiling results in Step 4 (Quality Rules) with gap analysis

### Future Enhancements
1. **Expand Quality Badge** - Click to see full reasoning and confidence
2. **Edit Context** - Add button to go back and edit product definition from Step 2
3. **Smart Defaults** - Pre-fill domain based on user's department
4. **Profiling Integration** - Show quality gap analysis in Step 4 before writing rules
5. **Historical Learning** - Suggest use cases based on similar past products
6. **Cron Expression Parsing** - Infer urgency from cron frequency

---

## Deployment Status

### Servers Running
- **Backend**: http://137.220.61.218:8000 (Python FastAPI)
- **Frontend**: http://137.220.61.218:3000 (Next.js)

### To Test
1. Navigate to http://137.220.61.218:3000/build
2. Fill out Step 1 (Define Product) - notice no duplicate fields
3. Complete Step 1 - businessContext is auto-populated
4. Move to Step 2 (Select Sources) - quality expectations inferred automatically
5. Observe inline quality badge with targets
6. Continue to Step 3 - context data available

---

## Conclusion

This refactoring successfully eliminates the jarring popup dialog experience and removes all field duplication. The result is a smooth, natural workflow where:

- ✅ Users enter each piece of information exactly once
- ✅ No cognitive load from duplicate fields
- ✅ Intelligent defaults inferred from schedule frequency
- ✅ Business context captured when defining product (natural timing)
- ✅ Quality expectations inferred silently and shown non-intrusively
- ✅ Faster workflow with continuous forward progress
- ✅ Simpler code with fewer components and less state management

The Living Context Graph intelligence is still working behind the scenes, but now in a way that feels native to the build flow rather than bolted on.

**Key Insight**: The best AI features are invisible - they enhance the workflow without adding friction.
