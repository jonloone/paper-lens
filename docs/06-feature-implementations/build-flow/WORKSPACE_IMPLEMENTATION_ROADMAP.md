# Workspace Implementation Roadmap
## Phased Plan to Achieve Complete Workflow Vision

**Date**: October 29, 2025
**Status**: Planning Complete, Ready for Implementation
**Context**: Post-Phase 6A Part 1 (SQL Editor Integration Complete)
**Timeline**: 6-8 weeks total

---

## Executive Summary

This roadmap transforms the UnifiedProductWorkspace from its current state (Chat-centric with new Editor view) into the comprehensive professional IDE envisioned in our analysis documents.

**Current State** (Post-Phase 6A Part 1):
- ✅ View Switcher implemented (Chat | Editor | Results)
- ✅ SQL Editor with TiSQLEditor integration
- ✅ Direct SQL editing capability
- ✅ Results view with export
- ❌ No source management panel (sources hidden after selection)
- ❌ No deployment configuration UI
- ❌ No readiness indicator
- ❌ Limited quality workflow visibility

**Target State** (After Roadmap Completion):
- ✅ 3-panel layout (Left panel, Center canvas, Right panel)
- ✅ Always-visible source management
- ✅ Comprehensive deployment configuration
- ✅ Real-time readiness tracking
- ✅ Enhanced quality workflow
- ✅ Professional IDE experience

**Success Metrics**:
- Senior Engineer NPS: 40 → 90 (target: +50 points)
- Time to deployment: 45 min → 15 min (target: -67%)
- Deploy success rate: 85% → 95% (target: +10%)
- Feature discovery: 60% → 90% (target: +30%)

---

## Implementation Phases

### Phase 6A: Critical Gaps (Weeks 1-2)
**Goal**: Add missing professional features for Senior Data Engineers

**Status**:
- Part 1: ✅ COMPLETE (SQL Editor View)
- Part 2-4: 📋 PLANNED

---

### 📦 Phase 6A Part 2: Source Management Panel
**Time**: 2-3 days | **Priority**: 🔴 CRITICAL | **Status**: NEXT

#### Problem Being Solved
**Critical Gap #2**: After initial selection, users cannot add/remove sources without restarting workflow. This breaks the exploratory nature of data product building.

**User Story**:
> "As a Senior Data Engineer, when I realize mid-composition that I need an additional table (e.g., 'products' table to enrich customer data), I want to add it without losing my current SQL and results, so I can continue iterating quickly."

#### Implementation Details

**Component to Create**: `SourceManagementPanel.tsx`

**Location**: Left side of workspace (new left panel in 3-panel layout)

**Visual Design**:
```
┌─────────────────────────────┐
│ SOURCES (3)            [+]  │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 🗄️  production.customers │ │
│ │ 1.2M rows • 15 columns  │ │
│ │                     [×] │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🗄️  production.orders    │ │
│ │ 5.3M rows • 12 columns  │ │
│ │                     [×] │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🗄️  production.products  │ │
│ │ 50K rows • 20 columns   │ │
│ │                     [×] │ │
│ └─────────────────────────┘ │
│                             │
│ [+ Add Source]              │
│                             │
│ [▼ Show Schema Preview]     │
└─────────────────────────────┘
```

**Core Features**:
1. **Always-Visible Source List**
   - Shows all selected sources with metadata
   - Card-based layout with hover states
   - Remove button (×) on each card
   - Source count in header

2. **Add Source Button**
   - Opens source selector modal (reuses SourceSelectionInterface)
   - Search and filter capabilities
   - Preview schema before adding
   - Multi-select support

3. **Schema Preview (Collapsible)**
   - Click on source card to expand
   - Shows all columns with types
   - Sample values (if available)
   - Statistics (row count, update frequency)

4. **Drag-and-Drop Ordering**
   - Reorder sources by dragging
   - Visual feedback during drag
   - Order persists in productData

**Technical Implementation**:

```typescript
// File: components/build/workspace/SourceManagementPanel.tsx

interface SourceManagementPanelProps {
  sources: ProductData['selectedSources'];
  onAddSource: () => void;
  onRemoveSource: (sourceId: string) => void;
  onReorderSources: (sources: ProductData['selectedSources']) => void;
  onSourceClick: (sourceId: string) => void;
}

export function SourceManagementPanel({
  sources,
  onAddSource,
  onRemoveSource,
  onReorderSources,
  onSourceClick
}: SourceManagementPanelProps) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="w-80 border-r border-border bg-elevation-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Sources</span>
            <Badge variant="secondary">{sources.length}</Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddSource}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Source List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sources.map((source, index) => (
          <SourceCard
            key={source.id}
            source={source}
            index={index}
            isExpanded={expandedSource === source.id}
            onRemove={() => onRemoveSource(source.id)}
            onClick={() => setExpandedSource(
              expandedSource === source.id ? null : source.id
            )}
          />
        ))}

        {sources.length === 0 && (
          <EmptyState
            icon={Database}
            title="No sources selected"
            description="Add data sources to begin building your product"
            action={
              <Button onClick={onAddSource} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            }
          />
        )}
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <SourceSelectorModal
          onClose={() => setShowAddModal(false)}
          onSelect={(newSources) => {
            // Add to existing sources
            onReorderSources([...sources, ...newSources]);
            setShowAddModal(false);
          }}
          excludeIds={sources.map(s => s.id)}
        />
      )}
    </div>
  );
}
```

**Integration with Workspace**:

1. **Layout Changes** (UnifiedProductWorkspace.tsx):
```typescript
// New 3-panel layout
<div className="flex h-full">
  {/* Left Panel: Source Management (only when sources selected) */}
  {showSourcePanel && (
    <SourceManagementPanel
      sources={productData.selectedSources}
      onAddSource={handleAddSource}
      onRemoveSource={handleRemoveSource}
      onReorderSources={handleReorderSources}
      onSourceClick={handleSourceClick}
    />
  )}

  {/* Center Panel: View Switcher + Content */}
  <div className="flex-1 flex flex-col">
    {/* Existing View Switcher + Chat/Editor/Results */}
  </div>

  {/* Right Panel: Business Context + Quality (future) */}
</div>
```

2. **State Management**:
```typescript
// Add handlers for source management
const handleAddSource = useCallback(() => {
  // Open source selector
  setShowSourceSelector(true);
});

const handleRemoveSource = useCallback((sourceId: string) => {
  // Confirmation dialog
  if (confirm('Remove this source? SQL referencing it may break.')) {
    updateSources(productData.selectedSources.filter(s => s.id !== sourceId));
  }
});

const handleReorderSources = useCallback((newOrder: Source[]) => {
  updateSources(newOrder);
});
```

**Testing Checklist**:
- [ ] Add source mid-workflow, appears in list
- [ ] Remove source, SQL validation updates
- [ ] Reorder sources via drag-and-drop
- [ ] Click source card, schema preview expands
- [ ] Add multiple sources at once
- [ ] Empty state shows when no sources
- [ ] Panel collapses/expands smoothly
- [ ] Source count badge updates correctly

**Success Criteria**:
- ✅ 100% of users can add sources mid-workflow
- ✅ 0 workflow restarts due to missing sources
- ✅ 30% of sessions involve mid-workflow source changes
- ✅ Average time to add source: < 10 seconds

---

### 📦 Phase 6A Part 3: Deployment Configuration
**Time**: 3-4 days | **Priority**: 🔴 CRITICAL | **Status**: PLANNED

#### Problem Being Solved
**Critical Gap #4**: No UI for setting schedule, output format, SLA, or ownership. These are required for production deployment but users have no way to configure them.

**User Story**:
> "As a Data Engineer, when I'm ready to deploy my data product, I want to specify when it should run (schedule), where output goes (location), and what SLAs apply (freshness, quality), so the product operates correctly in production."

#### Implementation Details

**Component to Create**: `DeploymentConfigPanel.tsx`

**Location**: Bottom section of left panel (below source management)

**Visual Design**:
```
┌─────────────────────────────┐
│ DEPLOYMENT CONFIG      [▼]  │
├─────────────────────────────┤
│                             │
│ Schedule                    │
│ [Daily at 2 AM        ▼]    │
│ Cron: 0 2 * * *             │
│                             │
│ Output Format               │
│ [Iceberg Table        ▼]    │
│                             │
│ Output Location             │
│ [iceberg.customer.seg...]   │
│                             │
│ SLA - Data Freshness        │
│ [< 24 hours           ▼]    │
│                             │
│ SLA - Completeness          │
│ [≥ 95%                ▼]    │
│                             │
│ Owner                       │
│ [john.doe@company.com ]     │
│                             │
│ Team                        │
│ [Data Platform        ▼]    │
│                             │
└─────────────────────────────┘
```

**Core Features**:

1. **Schedule Configuration**
   - Preset options: Hourly, Daily, Weekly, Monthly
   - Custom cron expression input
   - Visual cron builder (future enhancement)
   - Next run time preview

2. **Output Configuration**
   - Format: Iceberg Table, View, Materialized View, File (Parquet, CSV)
   - Location: Auto-generated with edit capability
   - Partition strategy (future): Date, Hash, Range

3. **SLA Configuration**
   - Freshness: Time since last update (< 1h, < 24h, custom)
   - Completeness: Minimum row count or percentage
   - Accuracy: Custom validation rules
   - Severity: Error (blocks), Warning (alerts)

4. **Ownership Configuration**
   - Owner: Email address (validates against org directory)
   - Team: Dropdown of teams
   - Stakeholders: Multi-select
   - On-call: Rotation schedule (future)

**Technical Implementation**:

```typescript
// File: components/build/workspace/DeploymentConfigPanel.tsx

interface DeploymentConfigPanelProps {
  productName: string;
  domain: string;
  config: DeploymentConfig;
  onConfigChange: (config: Partial<DeploymentConfig>) => void;
}

interface DeploymentConfig {
  schedule: {
    type: 'cron' | 'interval' | 'manual';
    cron?: string;
    intervalMinutes?: number;
    timezone: string;
  };
  output: {
    format: 'iceberg' | 'view' | 'materialized_view' | 'parquet' | 'csv';
    location: string;
    partitionBy?: string[];
  };
  sla: {
    freshness: {
      maxAgeHours: number;
      severity: 'error' | 'warning';
    };
    completeness: {
      minRows?: number;
      minPercentage?: number;
      severity: 'error' | 'warning';
    };
  };
  ownership: {
    owner: string;
    team: string;
    stakeholders: string[];
  };
}

export function DeploymentConfigPanel({
  productName,
  domain,
  config,
  onConfigChange
}: DeploymentConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-generate output location from product name
  useEffect(() => {
    if (!config.output.location) {
      const location = generateOutputLocation(domain, productName);
      onConfigChange({ output: { ...config.output, location } });
    }
  }, [productName, domain]);

  return (
    <div className="border-t border-border">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Deployment Config</span>
          {isConfigComplete(config) ? (
            <Badge variant="default">Ready</Badge>
          ) : (
            <Badge variant="secondary">Incomplete</Badge>
          )}
        </div>
        {isExpanded ? <ChevronDown /> : <ChevronRight />}
      </button>

      {/* Config Form */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-4">
          {/* Schedule */}
          <div>
            <Label>Schedule</Label>
            <Select
              value={config.schedule.type}
              onValueChange={(type) =>
                onConfigChange({
                  schedule: { ...config.schedule, type: type as any }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (on-demand)</SelectItem>
                <SelectItem value="interval">Every N hours</SelectItem>
                <SelectItem value="cron">Custom schedule</SelectItem>
              </SelectContent>
            </Select>

            {config.schedule.type === 'cron' && (
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="0 2 * * *"
                  value={config.schedule.cron}
                  onChange={(e) =>
                    onConfigChange({
                      schedule: { ...config.schedule, cron: e.target.value }
                    })
                  }
                />
                <div className="text-xs text-muted-foreground">
                  Next run: {getNextRunTime(config.schedule.cron)}
                </div>
              </div>
            )}
          </div>

          {/* Output Format */}
          <div>
            <Label>Output Format</Label>
            <Select
              value={config.output.format}
              onValueChange={(format) =>
                onConfigChange({
                  output: { ...config.output, format: format as any }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iceberg">Iceberg Table</SelectItem>
                <SelectItem value="view">View (Virtual)</SelectItem>
                <SelectItem value="materialized_view">Materialized View</SelectItem>
                <SelectItem value="parquet">Parquet Files</SelectItem>
                <SelectItem value="csv">CSV Files</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Output Location */}
          <div>
            <Label>Output Location</Label>
            <Input
              value={config.output.location}
              onChange={(e) =>
                onConfigChange({
                  output: { ...config.output, location: e.target.value }
                })
              }
              placeholder="iceberg.domain.product_name"
            />
          </div>

          {/* SLA - Freshness */}
          <div>
            <Label>SLA - Data Freshness</Label>
            <Select
              value={config.sla.freshness.maxAgeHours.toString()}
              onValueChange={(hours) =>
                onConfigChange({
                  sla: {
                    ...config.sla,
                    freshness: {
                      ...config.sla.freshness,
                      maxAgeHours: parseInt(hours)
                    }
                  }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">< 1 hour</SelectItem>
                <SelectItem value="6">< 6 hours</SelectItem>
                <SelectItem value="24">< 24 hours</SelectItem>
                <SelectItem value="168">< 7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Owner */}
          <div>
            <Label>Owner</Label>
            <Input
              type="email"
              value={config.ownership.owner}
              onChange={(e) =>
                onConfigChange({
                  ownership: { ...config.ownership, owner: e.target.value }
                })
              }
              placeholder="owner@company.com"
            />
          </div>

          {/* Team */}
          <div>
            <Label>Team</Label>
            <Select
              value={config.ownership.team}
              onValueChange={(team) =>
                onConfigChange({
                  ownership: { ...config.ownership, team }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data-platform">Data Platform</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="data-science">Data Science</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function generateOutputLocation(domain: string, productName: string): string {
  const safeName = productName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_');
  return `iceberg.${domain.toLowerCase()}.${safeName}`;
}

function isConfigComplete(config: DeploymentConfig): boolean {
  return !!(
    config.schedule.type &&
    config.output.format &&
    config.output.location &&
    config.ownership.owner &&
    config.ownership.team
  );
}

function getNextRunTime(cron: string | undefined): string {
  if (!cron) return 'N/A';
  // TODO: Use cron-parser library
  return 'Tomorrow at 2:00 AM';
}
```

**Integration with ProductData**:

```typescript
// Update ProductData interface in BuildFlowContext
interface ProductData {
  // ... existing fields
  deploymentConfig?: DeploymentConfig;
}

// Add to UnifiedProductWorkspace
<DeploymentConfigPanel
  productName={productData.name}
  domain={productData.domain}
  config={productData.deploymentConfig || getDefaultConfig()}
  onConfigChange={(updates) => {
    updateDeploymentConfig({
      ...productData.deploymentConfig,
      ...updates
    });
  }}
/>
```

**Validation on Deployment**:

```typescript
// In handleDeploy function
const validateDeploymentConfig = (config: DeploymentConfig): string[] => {
  const errors: string[] = [];

  if (!config.schedule.type) {
    errors.push('Schedule is required');
  }

  if (!config.output.location) {
    errors.push('Output location is required');
  }

  if (!config.ownership.owner) {
    errors.push('Owner is required');
  }

  if (!config.ownership.team) {
    errors.push('Team assignment is required');
  }

  return errors;
};
```

**Testing Checklist**:
- [ ] All schedule types work (manual, interval, cron)
- [ ] Output location auto-generates correctly
- [ ] SLA configuration saves properly
- [ ] Owner email validation works
- [ ] Team dropdown loads from backend
- [ ] Config persists across view switches
- [ ] Validation blocks deployment if incomplete
- [ ] Config appears in stakeholder review modal

**Success Criteria**:
- ✅ 95% of deployments include complete config
- ✅ 0 production failures due to missing config
- ✅ Average config time: < 2 minutes
- ✅ Config reuse rate: 60% (from templates/clones)

---

### 📦 Phase 6A Part 4: Readiness Indicator
**Time**: 1-2 days | **Priority**: 🟡 MODERATE | **Status**: PLANNED

#### Problem Being Solved
**Gap #5**: Users don't know if their product is ready to deploy until they click "Activate" and get an error. This wastes time and creates frustration.

**User Story**:
> "As a Data Engineer, I want to see at a glance what's complete and what's missing before I try to deploy, so I can fix issues early rather than discovering them at deployment time."

#### Implementation Details

**Component to Create**: `ReadinessIndicator.tsx`

**Location**: Header bar, between product name and badges

**Visual Design**:
```
Header:
[← Back] [📦] Customer Segmentation  [●●●○○ 60% Ready]  [Badges...]
                                      └─────┬──────┘
                                            │
                          Hover/Click shows checklist ↓

┌────────────────────────────────────┐
│ Deployment Readiness          60%  │
├────────────────────────────────────┤
│ ✓ Product name set                 │
│ ✓ Domain selected                  │
│ ✓ Sources selected (3)             │
│ ✓ SQL written (67 lines)           │
│ ✓ Results validated (1.2K rows)    │
│ ○ Quality rules configured (click) │
│ ○ Deployment config set (click)    │
│ ○ Business context added (optional)│
└────────────────────────────────────┘
```

**Core Features**:

1. **Progress Indicator**
   - Circular dots showing completion (●●●○○)
   - Percentage score (0-100%)
   - Color-coded: Red (<60%), Yellow (60-89%), Green (90-100%)

2. **Checklist Popover**
   - Shows all requirements with status
   - Checkmarks (✓) for complete items
   - Empty circles (○) for incomplete items
   - Click on incomplete item to navigate to relevant section

3. **Smart Validation**
   - Required fields: Name, Domain, Sources, SQL
   - Recommended fields: Quality rules, Deployment config
   - Optional fields: Business context
   - Real-time updates as user makes changes

4. **Navigation Shortcuts**
   - Click incomplete item → Auto-navigates and focuses
   - Examples:
     - "Quality rules" → Expands Business Context, opens Quality panel
     - "Deployment config" → Scrolls to Deployment Config panel
     - "Business context" → Expands Business Context panel

**Technical Implementation**:

```typescript
// File: components/build/workspace/ReadinessIndicator.tsx

interface ReadinessCheck {
  id: string;
  label: string;
  status: 'complete' | 'incomplete' | 'optional';
  weight: number; // Contribution to overall score
  onNavigate?: () => void; // Function to navigate to this check
}

interface ReadinessIndicatorProps {
  productData: ProductData;
  businessContext: BusinessContext;
  onNavigate: (checkId: string) => void;
}

export function ReadinessIndicator({
  productData,
  businessContext,
  onNavigate
}: ReadinessIndicatorProps) {
  const checks = calculateReadiness(productData, businessContext);
  const score = calculateScore(checks);
  const [showPopover, setShowPopover] = useState(false);

  return (
    <Popover open={showPopover} onOpenChange={setShowPopover}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors",
            "hover:bg-accent/50",
            score < 60 && "text-red-600",
            score >= 60 && score < 90 && "text-yellow-600",
            score >= 90 && "text-green-600"
          )}
        >
          {/* Progress Dots */}
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full",
                  index < Math.floor(score / 20)
                    ? "bg-current"
                    : "bg-current opacity-20"
                )}
              />
            ))}
          </div>

          {/* Percentage */}
          <span className="text-sm font-medium">
            {score}% Ready
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Deployment Readiness</h3>
            <Badge
              variant={
                score >= 90 ? "default" : score >= 60 ? "secondary" : "destructive"
              }
            >
              {score}%
            </Badge>
          </div>

          {/* Progress Bar */}
          <Progress value={score} className="h-2" />

          {/* Checklist */}
          <div className="space-y-2">
            {checks.map((check) => (
              <button
                key={check.id}
                onClick={() => {
                  if (check.status !== 'complete' && check.onNavigate) {
                    check.onNavigate();
                    setShowPopover(false);
                  }
                }}
                className={cn(
                  "w-full flex items-start gap-2 p-2 rounded text-left transition-colors",
                  check.status !== 'complete' && check.onNavigate && "hover:bg-accent/50"
                )}
                disabled={check.status === 'complete' || !check.onNavigate}
              >
                {/* Status Icon */}
                <div className="mt-0.5">
                  {check.status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : check.status === 'optional' ? (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <p className="text-sm">{check.label}</p>
                  {check.status === 'optional' && (
                    <p className="text-xs text-muted-foreground">Optional</p>
                  )}
                </div>

                {/* Navigate Icon */}
                {check.status !== 'complete' && check.onNavigate && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>

          {/* Footer Message */}
          {score < 100 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {score < 60
                  ? "Complete required items to enable deployment"
                  : score < 90
                  ? "Almost ready! Complete recommended items"
                  : "Ready to deploy! Optional items remain"}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Readiness calculation
function calculateReadiness(
  productData: ProductData,
  businessContext: BusinessContext
): ReadinessCheck[] {
  return [
    {
      id: 'name',
      label: 'Product name set',
      status: productData.name.trim().length >= 3 ? 'complete' : 'incomplete',
      weight: 10,
      onNavigate: () => {
        // Focus product name input
        document.querySelector<HTMLInputElement>('input[value="' + productData.name + '"]')?.focus();
      }
    },
    {
      id: 'domain',
      label: 'Domain selected',
      status: productData.domain ? 'complete' : 'incomplete',
      weight: 5
    },
    {
      id: 'sources',
      label: `Sources selected (${productData.selectedSources.length})`,
      status: productData.selectedSources.length > 0 ? 'complete' : 'incomplete',
      weight: 20,
      onNavigate: () => {
        // Open source selector
        // Emit event or call callback
      }
    },
    {
      id: 'sql',
      label: `SQL written (${productData.sql.split('\n').length} lines)`,
      status: productData.sql.trim().length > 0 ? 'complete' : 'incomplete',
      weight: 25,
      onNavigate: () => {
        // Switch to Editor view
      }
    },
    {
      id: 'results',
      label: productData.previewResult
        ? `Results validated (${productData.previewResult.rowCount.toLocaleString()} rows)`
        : 'Results not validated',
      status: productData.previewResult ? 'complete' : 'incomplete',
      weight: 15,
      onNavigate: () => {
        // Run query
      }
    },
    {
      id: 'quality',
      label: 'Quality rules configured',
      status: productData.customQualityRules?.length > 0 ? 'complete' : 'incomplete',
      weight: 10,
      onNavigate: () => {
        // Open quality configuration
      }
    },
    {
      id: 'deployment',
      label: 'Deployment config set',
      status: isDeploymentConfigComplete(productData.deploymentConfig)
        ? 'complete'
        : 'incomplete',
      weight: 10,
      onNavigate: () => {
        // Scroll to deployment config
      }
    },
    {
      id: 'business_context',
      label: 'Business context added',
      status:
        businessContext.objectives.length > 0 ||
        businessContext.metrics.length > 0 ||
        businessContext.questions.length > 0
          ? 'complete'
          : 'optional',
      weight: 5,
      onNavigate: () => {
        // Expand business context
      }
    }
  ];
}

function calculateScore(checks: ReadinessCheck[]): number {
  const completedWeight = checks
    .filter((c) => c.status === 'complete')
    .reduce((sum, c) => sum + c.weight, 0);

  const totalRequiredWeight = checks
    .filter((c) => c.status !== 'optional')
    .reduce((sum, c) => sum + c.weight, 0);

  return Math.round((completedWeight / totalRequiredWeight) * 100);
}
```

**Integration with Workspace**:

```typescript
// In UnifiedProductWorkspace header section
<div className="flex items-center gap-4">
  {/* Product Name */}
  <Input value={productData.name} ... />

  {/* Readiness Indicator */}
  <ReadinessIndicator
    productData={productData}
    businessContext={businessContext}
    onNavigate={handleReadinessNavigate}
  />

  {/* Existing Badges */}
  <Badge variant="outline">...</Badge>
</div>
```

**Testing Checklist**:
- [ ] Score calculates correctly based on completion
- [ ] Dots update in real-time as user makes changes
- [ ] Popover opens on hover/click
- [ ] Checklist shows correct status for each item
- [ ] Clicking incomplete item navigates correctly
- [ ] Color coding works (red/yellow/green)
- [ ] Progress bar animates smoothly
- [ ] Footer message updates based on score

**Success Criteria**:
- ✅ 90% of users check readiness before deploying
- ✅ Deploy failures due to missing fields: 15% → 5%
- ✅ Average time to identify missing field: 30s → 5s
- ✅ User satisfaction with deployment clarity: +40%

---

## Phase 6B: Workflow Optimization (Weeks 3-4)
**Goal**: Polish experience and add advanced features

### 📦 Phase 6B Part 1: Enhanced Quality Panel
**Time**: 2 days | **Priority**: 🟡 MODERATE

**What**: Move quality configuration from hidden cards to always-visible right panel

**Components**:
- `QualityPanel.tsx` (right side of workspace)
- Shows quality score, rules, and validation status
- AI-suggested quality rules based on data types
- One-click test quality before deployment

**Benefits**:
- Quality becomes first-class citizen
- No more hunting for quality config
- Proactive quality awareness

---

### 📦 Phase 6B Part 2: Keyboard Shortcuts
**Time**: 1 day | **Priority**: 🟢 LOW

**Shortcuts to Implement**:
```
Global:
  Cmd/Ctrl + S       Save draft
  Cmd/Ctrl + Enter   Run query (in Editor)
  Cmd/Ctrl + D       Deploy product
  Cmd/Ctrl + B       Toggle business context
  Cmd/Ctrl + /       Show keyboard shortcuts help

View Switching:
  Cmd/Ctrl + 1       Switch to Chat
  Cmd/Ctrl + 2       Switch to Editor
  Cmd/Ctrl + 3       Switch to Results

Editor:
  Cmd/Ctrl + F       Find/replace
  Cmd/Ctrl + /       Comment/uncomment line
  Cmd/Ctrl + Shift+F Format SQL
```

**Implementation**: Use `react-hotkeys-hook` library

---

### 📦 Phase 6B Part 3: Smart Defaults & Suggestions
**Time**: 2-3 days | **Priority**: 🟡 MODERATE

**Features**:
1. **Auto-fill Deployment Config**
   - Schedule based on data refresh patterns
   - Output location from naming convention
   - Owner from current user

2. **AI Quality Suggestions**
   - Analyze column types → suggest appropriate rules
   - Historical quality scores → recommend thresholds
   - Common patterns → pre-configure checks

3. **Template Learning**
   - Track which templates lead to successful deployments
   - Suggest templates based on intent similarity
   - Auto-apply patterns from successful clones

---

## Phase 6C: Polish & Documentation (Week 5)
**Goal**: Production-ready with excellent UX

### 📦 Phase 6C Part 1: Onboarding & Help
**Time**: 2 days | **Priority**: 🟡 MODERATE

**Features**:
1. **First-Time User Tour**
   - Guided walkthrough on first workspace visit
   - Highlights: View Switcher, Source Panel, Quality, Deploy
   - Can skip or replay anytime

2. **Contextual Tooltips**
   - Hover over any UI element for help
   - Examples, keyboard shortcuts, best practices
   - Links to documentation

3. **Help Panel**
   - Cmd+? to open help sidebar
   - Searchable help content
   - Context-aware suggestions

---

### 📦 Phase 6C Part 2: Error Handling & Validation
**Time**: 2 days | **Priority**: 🔴 CRITICAL

**Improvements**:
1. **SQL Validation**
   - Pre-execution syntax check
   - Column existence validation
   - Join condition validation
   - Clear error messages with line numbers

2. **Deployment Pre-checks**
   - Output location conflicts
   - Permission validation
   - Resource availability
   - Cost estimation

3. **Graceful Failures**
   - Better error messages
   - Recovery suggestions
   - Auto-save before errors
   - Rollback on deployment failure

---

### 📦 Phase 6C Part 3: Performance Optimization
**Time**: 1-2 days | **Priority**: 🟡 MODERATE

**Optimizations**:
1. **Lazy Loading**
   - Components load on-demand
   - Defer heavy computations
   - Progressive enhancement

2. **Virtualization**
   - Results table (10K+ rows)
   - Source list (100+ sources)
   - Chat history (100+ messages)

3. **Caching**
   - Source schemas cached
   - Query results cached
   - Template data preloaded

---

## Phase 7: Advanced Features (Week 6+)
**Goal**: Differentiate from competitors

### 📦 Phase 7 Part 1: Collaboration Features
**Time**: 1 week | **Priority**: 🟢 NICE-TO-HAVE

**Features**:
- Real-time co-editing (like Google Docs)
- Comments on SQL lines
- @mentions for stakeholders
- Change history with blame
- Review/approval workflow

---

### 📦 Phase 7 Part 2: Version Control Integration
**Time**: 1 week | **Priority**: 🟡 MODERATE

**Features**:
- Git integration for SQL
- Branch management
- Pull request creation
- Diff visualization
- Rollback to previous versions

---

### 📦 Phase 7 Part 3: AI Enhancements
**Time**: 1 week | **Priority**: 🟢 NICE-TO-HAVE

**Features**:
- SQL explanation (natural language)
- Query optimization suggestions
- Automatic documentation generation
- Anomaly detection in results
- Business impact prediction

---

## Implementation Priority Matrix

### Must Have (Phase 6A - Weeks 1-2)
| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| SQL Editor View | High | Medium | ✅ DONE |
| Source Management Panel | High | Medium | 🔴 NEXT |
| Deployment Configuration | High | Medium | 🔴 CRITICAL |
| Readiness Indicator | Medium | Low | 🟡 IMPORTANT |

### Should Have (Phase 6B - Weeks 3-4)
| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Quality Panel | Medium | Medium | 🟡 MODERATE |
| Keyboard Shortcuts | Low | Low | 🟢 QUICK WIN |
| Smart Defaults | Medium | Medium | 🟡 MODERATE |

### Nice to Have (Phase 6C & 7 - Weeks 5+)
| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Onboarding Tour | Low | Low | 🟢 POLISH |
| Error Handling | Medium | Medium | 🟡 IMPORTANT |
| Performance Opts | Low | Medium | 🟢 POLISH |
| Collaboration | Low | High | ⚪ FUTURE |
| Version Control | Medium | High | ⚪ FUTURE |
| AI Enhancements | Low | High | ⚪ FUTURE |

---

## Success Metrics & Tracking

### Week 1-2 (Phase 6A) Targets:
| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Senior Engineer NPS** | 40 | 70 | Post-session survey |
| **Mid-workflow source changes** | 0% | 30% | Analytics tracking |
| **Deployment config completion** | 60% | 95% | Backend validation logs |
| **Deploy failure rate** | 15% | 8% | Deployment logs |

### Week 3-4 (Phase 6B) Targets:
| Metric | Baseline | Week 2 | Target | Measurement |
|--------|----------|---------|--------|-------------|
| **Feature discovery** | 60% | 75% | 90% | User surveys |
| **Quality config adoption** | 20% | 40% | 80% | Analytics |
| **Keyboard shortcut usage** | 0% | - | 40% | Telemetry |
| **Time to deployment** | 45min | 25min | 15min | Session tracking |

### Week 5+ (Phase 6C) Targets:
| Metric | Previous | Target | Measurement |
|--------|----------|--------|-------------|
| **User satisfaction (NPS)** | 70 | 90 | Survey |
| **First-time success rate** | 60% | 85% | Onboarding funnel |
| **Support tickets** | Baseline | -50% | Support system |
| **Performance (p95 latency)** | Baseline | < 200ms | APM tools |

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Layout complexity** | Medium | Medium | Incremental rollout, feature flags |
| **Performance degradation** | High | Low | Profiling, lazy loading, virtualization |
| **Browser compatibility** | Low | Low | Progressive enhancement, polyfills |
| **State management complexity** | Medium | Medium | Clear separation of concerns, TypeScript |

### User Adoption Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Change resistance** | High | Medium | Gradual rollout, preserve existing flows |
| **Feature overload** | Medium | Medium | Progressive disclosure, defaults |
| **Learning curve** | Medium | Low | Onboarding tour, contextual help |
| **Breaking workflows** | High | Low | Extensive testing, beta program |

### Mitigation Strategies:

1. **Feature Flags**
   - All Phase 6A features behind flags
   - Gradual rollout: 10% → 50% → 100%
   - Instant rollback capability

2. **Beta Testing Program**
   - Recruit 5 Senior Data Engineers
   - Weekly feedback sessions
   - Iterate based on real usage

3. **Backward Compatibility**
   - Old workspace still accessible
   - Gradual migration prompts
   - Data migration scripts

4. **Monitoring & Alerts**
   - Error rate monitoring
   - Performance dashboards
   - User satisfaction tracking
   - Feature usage analytics

---

## Timeline & Milestones

```
Week 1: Phase 6A Part 2
├─ Day 1-2: Source Management Panel UI
├─ Day 3: Integration with workspace layout
├─ Day 4: Testing & bug fixes
└─ Day 5: Documentation & code review

Week 2: Phase 6A Parts 3-4
├─ Day 1-2: Deployment Configuration UI
├─ Day 3: Integration & validation
├─ Day 4: Readiness Indicator
└─ Day 5: End-to-end testing

Week 3: Phase 6B Part 1-2
├─ Day 1-3: Quality Panel redesign
├─ Day 4: Keyboard shortcuts
└─ Day 5: Testing & polish

Week 4: Phase 6B Part 3
├─ Day 1-3: Smart defaults & AI suggestions
├─ Day 4-5: Integration testing
└─ Performance review

Week 5: Phase 6C
├─ Day 1-2: Onboarding & help
├─ Day 2-3: Error handling improvements
├─ Day 4-5: Performance optimization
└─ Final testing & documentation

Week 6+: Phase 7 (Optional)
└─ Advanced features as prioritized
```

---

## Next Steps

### Immediate Actions (This Week):
1. ✅ Review and approve this roadmap
2. 📋 Set up feature flags in backend
3. 📋 Create component stubs for Phase 6A
4. 📋 Schedule weekly stakeholder reviews
5. 📋 Recruit beta testers (5 Senior DEs)

### Development Start (Week 1):
1. Begin Phase 6A Part 2 (Source Management Panel)
2. Set up analytics tracking for new features
3. Create test plan for each component
4. Document APIs and integration points

### Continuous:
- Daily standups on progress
- Weekly demos to stakeholders
- Bi-weekly beta tester feedback
- Monthly metrics review

---

## Conclusion

This roadmap transforms the workspace from a Chat-centric tool with basic editing into a **professional IDE** that serves all personas effectively:

- **Senior Engineers**: Direct control with Editor, Source Panel, Deployment Config
- **Data Engineers**: Guided workflows with AI + manual refinement
- **Analytics Engineers**: Natural language + business context integration
- **Data Analysts**: Templates + simplified interactions

**Timeline**: 5-6 weeks for core features (Phases 6A-6C)
**Budget**: ~200 engineering hours
**Expected ROI**:
- 3x productivity improvement for Senior Engineers
- 67% reduction in time to deployment
- 50-point NPS increase
- 10% improvement in deploy success rate

**Decision Required**: Approve roadmap and authorize Phase 6A implementation start.
