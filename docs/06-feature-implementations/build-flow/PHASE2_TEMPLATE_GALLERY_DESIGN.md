# Phase 2: Template Gallery Enhancement Design
**Date:** 2025-10-28
**Status:** Design Complete
**Goal:** Reduce template discovery time from 2-3 min to <30 seconds

---

## Executive Summary

The template gallery currently shows all templates in a simple grid with no filtering, search, or preview capabilities. This enhancement adds:
- **Category Filtering:** Filter by domain (Marketing, Sales, Finance, Operations, Analytics)
- **Search:** Full-text search across name, description, and tags
- **Preview Modal:** Detailed template view before selection
- **Popularity Metrics:** Usage count and success rate
- **List/Grid Toggle:** Power users can see more templates at once
- **Smart Sorting:** Sort by relevance, popularity, time-to-value, difficulty

**Key Metric:** 80% of users find the right template in <30 seconds.

---

## Current vs. Proposed Experience

### Current Experience (2-3 minutes)
```
1. User clicks Templates tab
2. Sees all 5 templates in grid (no context)
3. Reads brief descriptions (truncated)
4. Clicks template → immediately goes to workspace
5. Realizes template isn't right → backs out
6. Repeats trial-and-error
Total: 2-3 minutes with uncertainty
```

### Proposed Experience (<30 seconds)
```
1. User clicks Templates tab
2. Sees category filters and search bar
3. Filters by domain (e.g., "Marketing")
4. 2 relevant templates shown
5. Clicks "Preview" to see full details
6. Reviews sources, SQL, quality rules
7. Clicks "Use This Template"
8. Workspace opens with confidence
Total: <30 seconds with certainty
```

---

## UI Architecture

### Component Structure

```
TemplateGallery/
├── TemplateGalleryHeader
│   ├── Search input
│   ├── Category filters
│   ├── Sort dropdown
│   └── View toggle (grid/list)
├── TemplateGalleryGrid (default)
│   └── TemplateCard[]
├── TemplateGalleryList (alternative)
│   └── TemplateListItem[]
└── TemplatePreviewModal
    ├── TemplateHeader
    ├── SourcesSection
    ├── SQLPreviewSection
    ├── QualityRulesSection
    ├── DeploymentConfigSection
    └── ActionButtons
```

---

## Feature 1: Category Filtering

### UI Design

**Location:** Above template grid

```tsx
<div className="flex items-center gap-2 mb-6">
  <label className="text-sm font-medium text-muted-foreground">
    Filter by domain:
  </label>

  <div className="flex items-center gap-2">
    <Button
      variant={selectedCategory === 'all' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setSelectedCategory('all')}
    >
      All ({ALL_TEMPLATES.length})
    </Button>

    {TEMPLATE_CATEGORIES.map((category) => {
      const count = getTemplatesByDomain(category.name).length;
      const Icon = category.icon;

      return (
        <Button
          key={category.name}
          variant={selectedCategory === category.name ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(category.name)}
          className="gap-2"
        >
          <Icon className="w-4 h-4" />
          {category.name} ({count})
        </Button>
      );
    })}
  </div>
</div>
```

### Category Configuration

```typescript
// lib/data/template-categories.ts
import { TrendingUp, ShoppingCart, DollarSign, Settings, BarChart } from 'lucide-react';

export interface TemplateCategory {
  name: string;
  icon: LucideIcon;
  description: string;
  color: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    name: 'Marketing',
    icon: TrendingUp,
    description: 'Customer analytics, campaigns, segmentation, retention',
    color: 'text-purple-500'
  },
  {
    name: 'Sales',
    icon: ShoppingCart,
    description: 'Revenue tracking, pipeline analytics, forecasting',
    color: 'text-green-500'
  },
  {
    name: 'Finance',
    icon: DollarSign,
    description: 'Financial reporting, cost analysis, budgeting',
    color: 'text-yellow-500'
  },
  {
    name: 'Operations',
    icon: Settings,
    description: 'Process monitoring, efficiency metrics, incident tracking',
    color: 'text-blue-500'
  },
  {
    name: 'Analytics',
    icon: BarChart,
    description: 'General analytics, reporting, insights',
    color: 'text-orange-500'
  }
];
```

---

## Feature 2: Search Functionality

### UI Design

```tsx
<div className="relative mb-6">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

  <Input
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search templates by name, description, or tags..."
    className="pl-10 pr-10"
  />

  {searchQuery && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setSearchQuery('')}
      className="absolute right-1 top-1/2 -translate-y-1/2"
    >
      <X className="w-4 h-4" />
    </Button>
  )}

  {/* Search results count */}
  {searchQuery && (
    <p className="text-xs text-muted-foreground mt-2">
      Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
    </p>
  )}
</div>
```

### Search Logic

```typescript
// lib/services/template-search.ts
export function searchTemplates(
  templates: ProductTemplate[],
  query: string
): ProductTemplate[] {
  if (!query.trim()) return templates;

  const lowerQuery = query.toLowerCase();

  return templates.filter((template) => {
    // Search in name
    if (template.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in description
    if (template.description.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in long description
    if (template.longDescription.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in use case
    if (template.useCase.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in tags
    if (template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    // Search in domain
    if (template.domain.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    return false;
  });
}

// Rank search results by relevance
export function rankTemplatesByRelevance(
  templates: ProductTemplate[],
  query: string
): ProductTemplate[] {
  const lowerQuery = query.toLowerCase();

  const scored = templates.map((template) => {
    let score = 0;

    // Exact name match: highest score
    if (template.name.toLowerCase() === lowerQuery) score += 100;

    // Name contains query
    else if (template.name.toLowerCase().includes(lowerQuery)) score += 50;

    // Use case match
    if (template.useCase.toLowerCase().includes(lowerQuery)) score += 30;

    // Description match
    if (template.description.toLowerCase().includes(lowerQuery)) score += 20;

    // Tag exact match
    if (template.tags.some(tag => tag.toLowerCase() === lowerQuery)) score += 40;

    // Tag contains query
    else if (template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) score += 15;

    // Domain match
    if (template.domain.toLowerCase().includes(lowerQuery)) score += 10;

    return { template, score };
  });

  // Sort by score descending
  return scored
    .sort((a, b) => b.score - a.score)
    .map(({ template }) => template);
}
```

---

## Feature 3: Template Preview Modal

### Modal Component

**Location:** `/components/build/TemplatePreviewModal.tsx`

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductTemplate } from '@/lib/data/product-templates';
import {
  Clock, Database, Shield, Rocket, Code, CheckCircle2,
  ArrowRight, Copy, Star, TrendingUp
} from 'lucide-react';

interface TemplatePreviewModalProps {
  template: ProductTemplate;
  open: boolean;
  onClose: () => void;
  onUse: (template: ProductTemplate) => void;
}

export function TemplatePreviewModal({
  template,
  open,
  onClose,
  onUse
}: TemplatePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl mb-2">
                {template.name}
              </DialogTitle>

              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline">{template.domain}</Badge>
                <Badge variant="secondary">{template.useCase}</Badge>
                <Badge
                  variant={
                    template.difficulty === 'beginner' ? 'success' :
                    template.difficulty === 'intermediate' ? 'warning' :
                    'secondary'
                  }
                  className="capitalize"
                >
                  {template.difficulty}
                </Badge>
              </div>

              <p className="text-muted-foreground">
                {template.description}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-elevation-1 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Time to Value</p>
              <p className="text-sm font-medium">{template.estimatedTimeToValue}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Data Sources</p>
              <p className="text-sm font-medium">{template.requiredSources.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Quality Rules</p>
              <p className="text-sm font-medium">{template.qualityRules.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Popularity</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <p className="text-sm font-medium">4.8/5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Business Value Callout */}
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
            💡 Business Value
          </p>
          <p className="text-sm text-green-800 dark:text-green-200">
            {template.businessValue}
          </p>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Full Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {template.longDescription}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {template.parameters.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Customizable Parameters</h4>
                <div className="space-y-2">
                  {template.parameters.map((param) => (
                    <div key={param.name} className="flex items-start gap-2 p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{param.label}</p>
                        <p className="text-xs text-muted-foreground">{param.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {param.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-3">
            <h4 className="text-sm font-semibold">Required Data Sources</h4>

            {template.requiredSources.map((source) => (
              <div key={source.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Database className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono font-semibold">
                        {source.schema}.{source.name}
                      </code>
                      {source.required && (
                        <Badge variant="default" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{source.description}</p>
                  </div>
                </div>

                {/* Column List */}
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Columns:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {source.columns.map((col) => (
                      <div key={col.name} className="flex items-center gap-2 text-xs">
                        <code className="text-foreground">{col.name}</code>
                        <span className="text-muted-foreground">({col.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {template.recommendedSources && template.recommendedSources.length > 0 && (
              <>
                <h4 className="text-sm font-semibold mt-6">Optional Data Sources</h4>
                {template.recommendedSources.map((source) => (
                  <div key={source.id} className="border rounded-lg p-4 opacity-75">
                    <div className="flex items-start gap-3">
                      <Database className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono font-semibold">
                            {source.schema}.{source.name}
                          </code>
                          <Badge variant="outline" className="text-xs">Optional</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{source.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>

          {/* SQL Tab */}
          <TabsContent value="sql">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">SQL Template</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(template.sqlTemplate);
                  }}
                  className="gap-2"
                >
                  <Copy className="w-3 h-3" />
                  Copy SQL
                </Button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-elevation-2 rounded-lg overflow-x-auto text-xs font-mono max-h-96">
                  <code>{template.sqlTemplate}</code>
                </pre>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 This SQL will be pre-populated in the workspace. You can customize it as needed.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality" className="space-y-3">
            <h4 className="text-sm font-semibold">Built-in Quality Rules</h4>

            {template.qualityRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {rule.type}
                      </Badge>
                      {rule.enabled && (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">{rule.description}</p>
                    {rule.column && (
                      <code className="text-xs text-muted-foreground">
                        Column: {rule.column}
                      </code>
                    )}
                  </div>
                  <div className="text-sm font-semibold">{rule.threshold}%</div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Deployment Tab */}
          <TabsContent value="deployment" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Schedule
                </h4>
                <code className="text-sm">{template.deploymentConfig.schedule}</code>
                <p className="text-xs text-muted-foreground mt-2">
                  Runs {formatCronExpression(template.deploymentConfig.schedule)}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Output Format
                </h4>
                <p className="text-sm capitalize">{template.deploymentConfig.outputFormat}</p>
                {template.deploymentConfig.outputLocation && (
                  <code className="text-xs text-muted-foreground mt-2 block">
                    {template.deploymentConfig.outputLocation}
                  </code>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3">Service Level Agreement (SLA)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Freshness</p>
                  <p className="text-sm font-medium">
                    {template.deploymentConfig.sla.freshnessHours} hours
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Completeness</p>
                  <p className="text-sm font-medium">
                    {template.deploymentConfig.sla.completeness}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                  <p className="text-sm font-medium">
                    {template.deploymentConfig.sla.accuracy}%
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex-1" />

          <Button
            onClick={() => onUse(template)}
            size="lg"
            className="gap-2"
          >
            <Rocket className="w-4 h-4" />
            Use This Template
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to format cron expression
function formatCronExpression(cron: string): string {
  // Simple cron parser for common patterns
  if (cron === '0 2 * * *') return 'daily at 2:00 AM';
  if (cron === '0 */4 * * *') return 'every 4 hours';
  if (cron === '*/15 * * * *') return 'every 15 minutes';
  if (cron === '0 0 * * 0') return 'weekly on Sunday';
  if (cron === '0 0 1 * *') return 'monthly on the 1st';
  return cron; // Fallback to raw cron
}
```

---

## Feature 4: Popularity Metrics

### Data Structure

```typescript
// lib/data/template-metrics.ts
export interface TemplateMetrics {
  templateId: string;
  usageCount: number;      // How many times used
  successRate: number;     // % that were successfully deployed
  averageRating: number;   // User ratings 1-5
  lastUsed: string;        // ISO timestamp
}

// Mock data for now (would come from backend later)
export const TEMPLATE_METRICS: Record<string, TemplateMetrics> = {
  'customer-360': {
    templateId: 'customer-360',
    usageCount: 247,
    successRate: 94,
    averageRating: 4.8,
    lastUsed: '2024-10-27T14:30:00Z'
  },
  'sales-pipeline': {
    templateId: 'sales-pipeline',
    usageCount: 189,
    successRate: 91,
    averageRating: 4.6,
    lastUsed: '2024-10-26T10:15:00Z'
  },
  'product-usage': {
    templateId: 'product-usage',
    usageCount: 156,
    successRate: 88,
    averageRating: 4.5,
    lastUsed: '2024-10-25T16:45:00Z'
  },
  'financial-report': {
    templateId: 'financial-report',
    usageCount: 134,
    successRate: 96,
    averageRating: 4.9,
    lastUsed: '2024-10-24T09:20:00Z'
  },
  'operational-health': {
    templateId: 'operational-health',
    usageCount: 98,
    successRate: 85,
    averageRating: 4.3,
    lastUsed: '2024-10-23T11:30:00Z'
  }
};

export function getTemplateMetrics(templateId: string): TemplateMetrics {
  return TEMPLATE_METRICS[templateId] || {
    templateId,
    usageCount: 0,
    successRate: 0,
    averageRating: 0,
    lastUsed: new Date().toISOString()
  };
}
```

### Display in Card

```tsx
{/* Add to template card */}
<div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
  <div className="flex items-center gap-1">
    <TrendingUp className="w-3 h-3" />
    <span>{metrics.usageCount} uses</span>
  </div>

  <div className="flex items-center gap-1">
    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
    <span>{metrics.averageRating}/5</span>
  </div>

  <div className="flex items-center gap-1">
    <CheckCircle2 className="w-3 h-3 text-green-500" />
    <span>{metrics.successRate}% success</span>
  </div>
</div>
```

---

## Feature 5: List/Grid Toggle

### UI Design

```tsx
<div className="flex items-center gap-2">
  <label className="text-sm text-muted-foreground">View:</label>

  <ToggleGroup type="single" value={viewMode} onValueChange={setViewMode}>
    <ToggleGroupItem value="grid" aria-label="Grid view">
      <LayoutGrid className="w-4 h-4" />
    </ToggleGroupItem>
    <ToggleGroupItem value="list" aria-label="List view">
      <List className="w-4 h-4" />
    </ToggleGroupItem>
  </ToggleGroup>
</div>
```

### List View Component

```tsx
function TemplateListItem({ template, onClick }: { template: ProductTemplate, onClick: () => void }) {
  const metrics = getTemplateMetrics(template.id);

  return (
    <div
      className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-elevation-1"
      onClick={onClick}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Database className="w-5 h-5 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 mb-2">
          <div className="flex-1">
            <h4 className="text-base font-semibold line-clamp-1 mb-1">
              {template.name}
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">{template.domain}</Badge>
              <Badge variant="secondary" className="text-xs">{template.useCase}</Badge>
              <Badge
                variant={template.difficulty === 'beginner' ? 'success' : 'secondary'}
                className="text-xs capitalize"
              >
                {template.difficulty}
              </Badge>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              <span>{metrics.averageRating}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{metrics.usageCount}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {template.description}
        </p>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{template.estimatedTimeToValue}</span>
          </div>
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>{template.requiredSources.length} sources</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>{template.qualityRules.length} rules</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span>{metrics.successRate}% success</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Open preview
          }}
        >
          Preview
        </Button>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Use Template
        </Button>
      </div>
    </div>
  );
}
```

---

## Feature 6: Smart Sorting

### UI Design

```tsx
<Select value={sortBy} onValueChange={setSortBy}>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Sort by..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="relevance">Relevance</SelectItem>
    <SelectItem value="popularity">Most Popular</SelectItem>
    <SelectItem value="rating">Highest Rated</SelectItem>
    <SelectItem value="time">Fastest Setup</SelectItem>
    <SelectItem value="difficulty">Easiest First</SelectItem>
    <SelectItem value="recent">Recently Used</SelectItem>
  </SelectContent>
</Select>
```

### Sorting Logic

```typescript
// lib/services/template-sorting.ts
export type TemplateSortOption =
  | 'relevance'
  | 'popularity'
  | 'rating'
  | 'time'
  | 'difficulty'
  | 'recent';

export function sortTemplates(
  templates: ProductTemplate[],
  sortBy: TemplateSortOption,
  searchQuery?: string
): ProductTemplate[] {
  const withMetrics = templates.map(t => ({
    template: t,
    metrics: getTemplateMetrics(t.id)
  }));

  switch (sortBy) {
    case 'relevance':
      // If there's a search query, rank by relevance
      if (searchQuery) {
        return rankTemplatesByRelevance(templates, searchQuery);
      }
      // Otherwise fall through to popularity
      return sortTemplates(templates, 'popularity');

    case 'popularity':
      return withMetrics
        .sort((a, b) => b.metrics.usageCount - a.metrics.usageCount)
        .map(({ template }) => template);

    case 'rating':
      return withMetrics
        .sort((a, b) => b.metrics.averageRating - a.metrics.averageRating)
        .map(({ template }) => template);

    case 'time':
      // Parse time strings like "5-10 minutes" and sort
      return templates.sort((a, b) => {
        const timeA = parseTimeToMinutes(a.estimatedTimeToValue);
        const timeB = parseTimeToMinutes(b.estimatedTimeToValue);
        return timeA - timeB;
      });

    case 'difficulty':
      const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      return templates.sort((a, b) =>
        difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
      );

    case 'recent':
      return withMetrics
        .sort((a, b) =>
          new Date(b.metrics.lastUsed).getTime() - new Date(a.metrics.lastUsed).getTime()
        )
        .map(({ template }) => template);

    default:
      return templates;
  }
}

function parseTimeToMinutes(timeStr: string): number {
  // Parse strings like "5-10 minutes", "1 hour", etc.
  const match = timeStr.match(/(\d+)(?:-(\d+))?\s*(minute|hour)/i);
  if (!match) return 999; // Unknown time goes to end

  const [, min, max, unit] = match;
  const avgValue = max ? (parseInt(min) + parseInt(max)) / 2 : parseInt(min);

  return unit.toLowerCase().startsWith('hour') ? avgValue * 60 : avgValue;
}
```

---

## Complete Implementation

### Updated build/page.tsx (Templates Tab)

```tsx
// Add state
const [selectedCategory, setSelectedCategory] = useState<string>('all');
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState<TemplateSortOption>('relevance');
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
const [previewTemplate, setPreviewTemplate] = useState<ProductTemplate | null>(null);

// Filter and sort templates
const filteredTemplates = useMemo(() => {
  let filtered = ALL_TEMPLATES;

  // Category filter
  if (selectedCategory !== 'all') {
    filtered = getTemplatesByDomain(selectedCategory);
  }

  // Search filter
  if (searchQuery.trim()) {
    filtered = searchTemplates(filtered, searchQuery);
  }

  // Sort
  filtered = sortTemplates(filtered, sortBy, searchQuery);

  return filtered;
}, [selectedCategory, searchQuery, sortBy]);

// Render templates tab
<TabsContent value="templates" className="space-y-6">
  {/* Header */}
  <div className="text-center mb-6">
    <h3 className="text-lg font-semibold text-foreground mb-2">
      Start from a proven template
    </h3>
    <p className="text-sm text-muted-foreground">
      Production-ready SQL, sources, and quality rules included
    </p>
  </div>

  {/* Filters and Controls */}
  <div className="space-y-4">
    {/* Search */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search templates by name, description, or tags..."
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchQuery('')}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>

    {/* Category Filter + Sort + View Toggle */}
    <div className="flex items-center justify-between gap-4">
      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-1">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All ({ALL_TEMPLATES.length})
        </Button>

        {TEMPLATE_CATEGORIES.map((category) => {
          const count = getTemplatesByDomain(category.name).length;
          const Icon = category.icon;

          return (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.name)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              {category.name} ({count})
            </Button>
          );
        })}
      </div>

      {/* Sort */}
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">Relevance</SelectItem>
          <SelectItem value="popularity">Most Popular</SelectItem>
          <SelectItem value="rating">Highest Rated</SelectItem>
          <SelectItem value="time">Fastest Setup</SelectItem>
          <SelectItem value="difficulty">Easiest First</SelectItem>
        </SelectContent>
      </Select>

      {/* View Toggle */}
      <ToggleGroup type="single" value={viewMode} onValueChange={setViewMode}>
        <ToggleGroupItem value="grid">
          <LayoutGrid className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="list">
          <List className="w-4 h-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    {/* Results Count */}
    {searchQuery && (
      <p className="text-sm text-muted-foreground">
        Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
      </p>
    )}
  </div>

  {/* Templates Display */}
  {filteredTemplates.length === 0 ? (
    <Card className="p-12 text-center bg-elevation-1">
      <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
      <p className="text-muted-foreground mb-2">No templates found</p>
      <p className="text-sm text-muted-foreground">
        Try adjusting your filters or search query
      </p>
    </Card>
  ) : viewMode === 'grid' ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTemplates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onPreview={() => setPreviewTemplate(template)}
          onUse={() => handleSelectTemplate(template)}
        />
      ))}
    </div>
  ) : (
    <div className="space-y-3">
      {filteredTemplates.map((template) => (
        <TemplateListItem
          key={template.id}
          template={template}
          onClick={() => handleSelectTemplate(template)}
        />
      ))}
    </div>
  )}

  {/* Preview Modal */}
  <TemplatePreviewModal
    template={previewTemplate}
    open={!!previewTemplate}
    onClose={() => setPreviewTemplate(null)}
    onUse={(template) => {
      setPreviewTemplate(null);
      handleSelectTemplate(template);
    }}
  />
</TabsContent>
```

---

## Success Metrics

### Time Metrics
- **Template Discovery:** 2-3 min → <30 sec (85% reduction)
- **Preview Review:** 20-30 sec per template
- **Total Selection Time:** <1 minute with confidence

### Quality Metrics
- **First Template Success:** 40% → 80% (correct template chosen first time)
- **Preview Usage:** 60% of users preview before selecting
- **Category Filter Usage:** 70% use category filters
- **Search Usage:** 40% use search functionality

### Adoption Metrics
- **Template Usage:** 30% → 50% (more discovery = more usage)
- **List View Usage:** 20% of users (power users)
- **Sort Feature Usage:** 45% change default sort

---

## Implementation Timeline

### Week 1: Core Filtering & Search
- Day 1-2: Category filtering
- Day 3-4: Search implementation
- Day 5: Testing and polish

### Week 2: Preview Modal & Metrics
- Day 1-2: Preview modal UI
- Day 3-4: Popularity metrics
- Day 5: Testing

### Week 3: Views & Sorting
- Day 1-2: List view
- Day 3-4: Smart sorting
- Day 5: Integration testing

---

## Conclusion

The Template Gallery enhancement transforms template discovery from a trial-and-error process into a confident, efficient experience. Users can now:

1. **Filter** by domain to see only relevant templates
2. **Search** across all template metadata
3. **Preview** full details before committing
4. **Compare** using popularity metrics
5. **Switch** between grid/list views
6. **Sort** by relevance, popularity, or other criteria

**Key Benefits:**
- 85% faster template discovery
- 80% first-time success rate
- 60% preview before selection
- 50% increase in template adoption

---

**Status:** ✅ **DESIGN COMPLETE - READY FOR IMPLEMENTATION**
