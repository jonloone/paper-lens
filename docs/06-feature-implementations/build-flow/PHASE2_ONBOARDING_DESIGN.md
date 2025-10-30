# Phase 2: Onboarding System Design
**Date:** 2025-10-28
**Status:** Design Complete
**Goal:** Guide first-time users to success with contextual help and interactive tours

---

## Executive Summary

Create a gentle, contextual onboarding system that helps first-time users understand:
- **What** each entry method is best for
- **How** to use each feature effectively
- **Why** certain choices matter
- **When** to take specific actions

**Approach:** Progressive disclosure + contextual tooltips + interactive tour + dismissible hints

**Key Metric:** 90% onboarding completion, 50% reduction in early abandonment.

---

## Architecture

### Onboarding State Management

**Location:** `/lib/hooks/use-onboarding.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  // Completion tracking
  hasSeenWelcome: boolean;
  hasSeenIntentTour: boolean;
  hasSeenTemplateTour: boolean;
  hasSeenCloneTour: boolean;
  hasSeenWorkspaceTour: boolean;

  // Dismissals
  dismissedHints: Set<string>;

  // Progress
  completedSteps: string[];
  currentStep: string | null;

  // Actions
  markWelcomeSeen: () => void;
  markTourSeen: (tour: string) => void;
  dismissHint: (hintId: string) => void;
  completeStep: (step: string) => void;
  resetOnboarding: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,
      hasSeenIntentTour: false,
      hasSeenTemplateTour: false,
      hasSeenCloneTour: false,
      hasSeenWorkspaceTour: false,
      dismissedHints: new Set(),
      completedSteps: [],
      currentStep: null,

      markWelcomeSeen: () => set({ hasSeenWelcome: true }),

      markTourSeen: (tour: string) =>
        set((state) => ({ ...state, [`hasSeen${tour}Tour`]: true })),

      dismissHint: (hintId: string) =>
        set((state) => ({
          dismissedHints: new Set([...state.dismissedHints, hintId])
        })),

      completeStep: (step: string) =>
        set((state) => ({
          completedSteps: [...state.completedSteps, step]
        })),

      resetOnboarding: () =>
        set({
          hasSeenWelcome: false,
          hasSeenIntentTour: false,
          hasSeenTemplateTour: false,
          hasSeenCloneTour: false,
          hasSeenWorkspaceTour: false,
          dismissedHints: new Set(),
          completedSteps: [],
          currentStep: null
        })
    }),
    {
      name: 'nexusone-onboarding'
    }
  )
);
```

---

## Welcome Modal

**Component:** `/components/build/WelcomeModal.tsx`

```tsx
<Dialog open={!hasSeenWelcome} onOpenChange={markWelcomeSeen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="text-3xl">Welcome to Data Product Builder</DialogTitle>
    </DialogHeader>

    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center">
        <Sparkle className="w-16 h-16 text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          Build production-ready data products in minutes, not hours
        </p>
      </div>

      {/* Entry Method Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <Sparkle className="w-6 h-6 text-purple-500 mb-2" />
          <h4 className="font-semibold mb-1">Intent (AI-Powered)</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Describe what you want in natural language
          </p>
          <Badge variant="success">Fastest</Badge>
        </Card>

        <Card className="p-4">
          <ClipboardText className="w-6 h-6 text-blue-500 mb-2" />
          <h4 className="font-semibold mb-1">Templates</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Start from proven patterns
          </p>
          <Badge variant="outline">Easiest</Badge>
        </Card>

        <Card className="p-4">
          <Copy className="w-6 h-6 text-green-500 mb-2" />
          <h4 className="font-semibold mb-1">Clone</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Modify existing products
          </p>
          <Badge variant="outline">Most Flexible</Badge>
        </Card>

        <Card className="p-4">
          <PencilSimple className="w-6 h-6 text-orange-500 mb-2" />
          <h4 className="font-semibold mb-1">Manual</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Build from scratch
          </p>
          <Badge variant="outline">Most Control</Badge>
        </Card>
      </div>

      {/* Quick Tips */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
        <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
          💡 Quick Tips
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Start with Intent if you're new - AI will guide you</li>
          <li>• Use Templates for common patterns</li>
          <li>• Clone when you need something similar to existing products</li>
          <li>• Your work auto-saves as drafts</li>
        </ul>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox id="dont-show" />
        <label htmlFor="dont-show" className="text-sm">
          Don't show this again
        </label>

        <div className="flex-1" />

        <Button onClick={markWelcomeSeen} size="lg" className="gap-2">
          Get Started
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

## Contextual Tooltips

**Component:** `/components/ui/onboarding-tooltip.tsx`

```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/lib/hooks/use-onboarding';
import { X, Lightbulb } from 'lucide-react';

interface OnboardingTooltipProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function OnboardingTooltip({
  id,
  title,
  description,
  children,
  side = 'bottom'
}: OnboardingTooltipProps) {
  const { dismissedHints, dismissHint } = useOnboarding();

  if (dismissedHints.has(id)) {
    return <>{children}</>;
  }

  return (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent side={side} className="w-80">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismissHint(id)}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => dismissHint(id)}
          className="w-full mt-3"
        >
          Got it
        </Button>
      </PopoverContent>
    </Popover>
  );
}
```

### Usage in Build Page

```tsx
// Intent tab
<OnboardingTooltip
  id="intent-entry"
  title="AI-Powered Intent"
  description="Describe what you want in natural language. The AI will suggest sources, quality rules, and even generate SQL for you."
>
  <Textarea placeholder="I need a customer 360 view..." />
</OnboardingTooltip>

// Template tab
<OnboardingTooltip
  id="template-preview"
  title="Preview Before You Choose"
  description="Click Preview to see full details including SQL, quality rules, and deployment config before selecting a template."
>
  <Button>Preview</Button>
</OnboardingTooltip>

// Clone tab
<OnboardingTooltip
  id="smart-clone"
  title="Smart Cloning"
  description="Cloning copies everything - sources, SQL, quality rules. The AI will suggest intelligent modifications like changing time periods or filters."
>
  <Button>Clone Product</Button>
</OnboardingTooltip>
```

---

## Interactive Tour

**Using react-joyride library**

```bash
npm install react-joyride
```

**Component:** `/components/build/BuildFlowTour.tsx`

```tsx
import Joyride, { Step } from 'react-joyride';
import { useOnboarding } from '@/lib/hooks/use-onboarding';

const INTENT_TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="intent-input"]',
    content: 'Describe what you want to build in natural language. Be specific about the data you need.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="example-intents"]',
    content: 'Not sure what to say? Click these examples to get started.',
  },
  {
    target: '[data-tour="analyze-button"]',
    content: 'The AI will analyze your intent and suggest sources, quality rules, and templates.',
  }
];

const TEMPLATE_TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="category-filters"]',
    content: 'Filter templates by domain to find what you need faster.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="search-box"]',
    content: 'Search across template names, descriptions, and tags.',
  },
  {
    target: '[data-tour="template-card"]',
    content: 'Each template shows time-to-value, sources needed, and quality rules included.',
  },
  {
    target: '[data-tour="preview-button"]',
    content: 'Always preview before selecting to see full details and ensure it meets your needs.',
  }
];

export function BuildFlowTour({ tab }: { tab: string }) {
  const { hasSeenIntentTour, hasSeenTemplateTour, markTourSeen } = useOnboarding();

  const getSteps = () => {
    if (tab === 'intent' && !hasSeenIntentTour) return INTENT_TOUR_STEPS;
    if (tab === 'templates' && !hasSeenTemplateTour) return TEMPLATE_TOUR_STEPS;
    return [];
  };

  const handleTourEnd = () => {
    if (tab === 'intent') markTourSeen('Intent');
    if (tab === 'templates') markTourSeen('Template');
  };

  return (
    <Joyride
      steps={getSteps()}
      continuous
      showProgress
      showSkipButton
      callback={(data) => {
        if (data.status === 'finished' || data.status === 'skipped') {
          handleTourEnd();
        }
      }}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          zIndex: 10000,
        }
      }}
    />
  );
}
```

---

## Contextual Help Hints

**Inline hints that appear at relevant moments**

```tsx
// When user has been on page for 10 seconds without action
{!intent && timeOnPage > 10 && !dismissedHints.has('start-hint') && (
  <Alert className="mb-4">
    <Lightbulb className="w-4 h-4" />
    <AlertTitle>New here?</AlertTitle>
    <AlertDescription>
      Start by describing what data product you want to build, or browse templates to see what's possible.
    </AlertDescription>
    <Button variant="outline" size="sm" onClick={() => dismissHint('start-hint')}>
      Got it
    </Button>
  </Alert>
)}

// When SQL is empty in workspace
{!sql && sources.length > 0 && !dismissedHints.has('sql-hint') && (
  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
    <p className="text-sm text-blue-900 dark:text-blue-100">
      💡 Tip: Use the AI chat to generate SQL based on your selected sources, or write it manually in the editor.
    </p>
    <Button variant="ghost" size="sm" onClick={() => dismissHint('sql-hint')}>
      Dismiss
    </Button>
  </div>
)}

// When user tries to activate without SQL
{attemptedActivateWithoutSQL && (
  <Alert variant="warning">
    <AlertTriangle className="w-4 h-4" />
    <AlertTitle>Missing SQL</AlertTitle>
    <AlertDescription>
      Your data product needs a SQL transformation. Use the AI chat or write SQL in the editor tab.
    </AlertDescription>
  </Alert>
)}
```

---

## Progress Indicators

**Show user's journey through the build process**

```tsx
<div className="fixed bottom-4 right-4 p-4 bg-card border rounded-lg shadow-lg z-40">
  <h4 className="text-sm font-semibold mb-2">Your Progress</h4>

  <div className="space-y-2">
    <ProgressItem
      completed={!!productData.name}
      label="Product named"
    />
    <ProgressItem
      completed={productData.selectedSources.length > 0}
      label="Sources selected"
    />
    <ProgressItem
      completed={!!productData.sql}
      label="SQL written"
    />
    <ProgressItem
      completed={productData.customQualityRules.length > 0}
      label="Quality rules added"
    />
  </div>

  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowProgressHelper(false)}
    className="w-full mt-3"
  >
    Hide
  </Button>
</div>

function ProgressItem({ completed, label }: { completed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {completed ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <Circle className="w-4 h-4 text-muted-foreground" />
      )}
      <span className={completed ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  );
}
```

---

## Help Center Access

**Always-accessible help button**

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => setShowHelpPanel(true)}
  className="fixed bottom-4 left-4 rounded-full shadow-lg z-40"
>
  <HelpCircle className="w-5 h-5" />
  Help
</Button>

{/* Help Panel */}
<Sheet open={showHelpPanel} onOpenChange={setShowHelpPanel}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Help & Resources</SheetTitle>
    </SheetHeader>

    <div className="mt-6 space-y-6">
      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={resetOnboarding}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart Tour
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Book className="w-4 h-4 mr-2" />
            View Documentation
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Play className="w-4 h-4 mr-2" />
            Watch Video Tutorial
          </Button>
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Common Questions</h4>
        <Accordion type="single" collapsible>
          <AccordionItem value="faq-1">
            <AccordionTrigger className="text-sm">
              Which entry method should I use?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Use Intent if you're new (AI-guided), Templates for proven patterns, Clone to modify existing products, or Manual for full control.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2">
            <AccordionTrigger className="text-sm">
              Are my drafts saved automatically?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Yes! Your work is auto-saved every 30 seconds. You can resume from the Drafts tab anytime.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3">
            <AccordionTrigger className="text-sm">
              How do I preview data before activation?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              In the workspace, run your SQL to preview results. The AI will also show sample data from your sources.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Keyboard Shortcuts */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Keyboard Shortcuts</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Save draft</span>
            <kbd className="px-2 py-1 bg-elevation-2 rounded text-xs">Ctrl+S</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Run SQL</span>
            <kbd className="px-2 py-1 bg-elevation-2 rounded text-xs">Ctrl+Enter</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Focus search</span>
            <kbd className="px-2 py-1 bg-elevation-2 rounded text-xs">Ctrl+K</kbd>
          </div>
        </div>
      </div>
    </div>
  </SheetContent>
</Sheet>
```

---

## Success Metrics

### Completion Metrics
- **Welcome Modal:** 90% complete welcome flow
- **Tour Completion:** 70% complete at least one tour
- **Hint Dismissal:** <30% dismiss without reading

### Effectiveness Metrics
- **Early Abandonment:** 50% reduction in first-session abandonment
- **Feature Discovery:** 80% use at least 2 entry methods
- **Success Rate:** 85% successfully create first product

### User Satisfaction
- **Clarity:** 4.5/5 rating for "I understood how to get started"
- **Guidance:** 4.3/5 rating for "I felt supported throughout"
- **Value:** 4.6/5 rating for "Onboarding was helpful"

---

## Implementation Timeline

### Week 1: Core Onboarding
- Day 1-2: Onboarding state management and persistence
- Day 3-4: Welcome modal and entry method comparison
- Day 5: Testing and polish

### Week 2: Tours & Tooltips
- Day 1-2: Interactive tours with react-joyride
- Day 3-4: Contextual tooltips
- Day 5: Help center panel

### Week 3: Polish & Testing
- Day 1-2: Progress indicators and hints
- Day 3-4: User testing and iteration
- Day 5: Final polish and documentation

---

## Conclusion

The Onboarding System provides gentle, contextual guidance that:

1. **Welcomes** users with entry method comparison
2. **Guides** through interactive tours
3. **Supports** with contextual tooltips
4. **Tracks** progress with indicators
5. **Helps** with always-accessible help center

**Key Benefits:**
- 90% onboarding completion
- 50% reduction in early abandonment
- 85% first product success rate
- 4.5/5 user satisfaction

---

**Status:** ✅ **DESIGN COMPLETE - READY FOR IMPLEMENTATION**
