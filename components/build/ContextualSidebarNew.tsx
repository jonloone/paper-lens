'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Rocket,
  CheckCircle,
  Link as LinkIcon,
  Target,
  ChartBar,
  Warning,
  Clock,
  TrendUp,
  MagnifyingGlass,
  Users,
  Package,
  CurrencyDollar,
  ArrowsClockwise,
  Globe,
  Diamond,
  Lightning,
  Wrench,
  Wrench as Hammer
} from 'phosphor-react';

// Helper function to map icon names to components
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    'rocket': Rocket,
    'check': CheckCircle,
    'link': LinkIcon,
    'target': Target,
    'chart': ChartBar,
    'warning': Warning,
    'clock': Clock,
    'trend': TrendUp,
    'search': MagnifyingGlass,
    'users': Users,
    'package': Package,
    'dollar': CurrencyDollar,
    'globe': Globe,
    'diamond': Diamond,
    'lightning': Lightning,
    'wrench': Wrench,
    'hammer': Hammer
  };
  const IconComponent = iconMap[iconName] || Rocket;
  return <IconComponent className="w-5 h-5" weight="duotone" />;
};

interface ContextualSidebarProps {
  currentStep: string;
  workflowData: any;
  agentRecommendations?: any;
  displayMode?: 'intent' | 'browse' | 'search';
  selectedSourcesCount?: number;
}

// Quick start patterns for each step
// Updated quick start patterns for intent-driven approach
const QUICK_START_PATTERNS = {
  'data-discovery': {
    intent: [
      { name: 'Need help getting started?', icon: 'rocket', description: 'Common data analysis patterns' },
      { name: 'Best practices for data selection', icon: 'check', description: 'Quality and governance tips' },
      { name: 'Understanding data relationships', icon: 'link', description: 'How tables connect' }
    ],
    search: [
      { name: 'Refine your search', icon: 'target', description: 'Try more specific terms' },
      { name: 'Browse related domains', icon: 'chart', description: 'Explore connected data' },
      { name: 'Check data quality', icon: 'warning', description: 'Review quality scores' }
    ],
    browse: [
      { name: 'Filter by freshness', icon: 'clock', description: 'Show recently updated data' },
      { name: 'Sort by usage', icon: 'trend', description: 'Most commonly used sources' },
      { name: 'Quality indicators', icon: 'search', description: 'Understanding the scores' }
    ]
  },
  'data-discovery-legacy': [
    { name: 'Customer Analytics', icon: 'users', sources: ['customer_transactions', 'customer_demographics'] },
    { name: 'Product Insights', icon: 'package', sources: ['product_usage', 'feature_adoption'] },
    { name: 'Financial Reporting', icon: 'dollar', sources: ['revenue_transactions', 'cost_attribution'] }
  ],
  'quality-analysis': [
    { name: 'Standard Quality Rules', icon: 'check', action: 'applyStandardRules' },
    { name: 'Marketing Data Rules', icon: 'trend', action: 'applyMarketingRules' },
    { name: 'Financial Data Rules', icon: 'dollar', action: 'applyFinancialRules' }
  ],
  'transform-design': [
    { name: 'Aggregation Pipeline', icon: 'chart', template: 'aggregation' },
    { name: 'Join & Enrich', icon: 'link', template: 'join-enrich' },
    { name: 'Time Series Analysis', icon: 'trend', template: 'time-series' }
  ],
  'api-configuration': [
    { name: 'REST API', icon: 'globe', config: 'rest-standard' },
    { name: 'GraphQL API', icon: 'diamond', config: 'graphql' },
    { name: 'Streaming API', icon: 'lightning', config: 'streaming' }
  ],
  'deployment': [
    { name: 'Production Deploy', icon: 'rocket', env: 'production' },
    { name: 'Staging Deploy', icon: 'wrench', env: 'staging' },
    { name: 'Development Deploy', icon: 'hammer', env: 'development' }
  ]
};

function ContextualHelp({ currentStep, displayMode }: { currentStep: string; displayMode?: string }) {
  const step = currentStep === 'data-discovery' ? currentStep : 'data-discovery-legacy';
  const patterns = QUICK_START_PATTERNS[step as keyof typeof QUICK_START_PATTERNS];

  // For the new intent-driven approach, show different help based on mode
  if (step === 'data-discovery' && typeof patterns === 'object' && !Array.isArray(patterns)) {
    const modePatterns = patterns[displayMode as keyof typeof patterns] || patterns.intent;

    const getTitle = () => {
      switch (displayMode) {
        case 'intent': return 'Getting Started';
        case 'search': return 'Search Tips';
        case 'browse': return 'Browse Help';
        default: return '💡 Help';
      }
    };

    return (
      <div>
        <h4 className="text-sm font-medium mb-3">{getTitle()}</h4>
        <div className="space-y-2">
          {modePatterns.map((pattern: any) => (
            <div
              key={pattern.name}
              className="p-3 rounded-lg bg-muted/30 border"
            >
              <div className="flex items-start space-x-2">
                <div className="mt-0.5">{getIconComponent(pattern.icon)}</div>
                <div>
                  <div className="text-sm font-medium">{pattern.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{pattern.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Legacy fallback for other steps
  if (Array.isArray(patterns) && patterns.length > 0) {
    const applyPattern = (pattern: any) => {
      console.log('Applying pattern:', pattern);
    };

    return (
      <div>
        <h4 className="text-sm font-medium mb-3">🎯 Quick Start</h4>
        <div className="space-y-2">
          {patterns.map((pattern) => (
            <button
              key={pattern.name}
              className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              onClick={() => applyPattern(pattern)}
            >
              <div className="flex items-center space-x-2">
                {getIconComponent(pattern.icon)}
                <span className="text-sm font-medium">{pattern.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function SelectionSummaryPanel({ selectedSources, estimatedTime, qualityScore }: any) {
  return (
    <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
      <h4 className="text-sm font-medium mb-2">📊 Selection Summary</h4>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sources selected:</span>
          <span className="font-medium">{selectedSources.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. processing:</span>
          <span className="font-medium">{estimatedTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg. quality:</span>
          <span className="font-medium">{qualityScore}%</span>
        </div>
      </div>
    </div>
  );
}

function SmartSuggestionsPanel({ suggestions, maxSuggestions = 3 }: any) {
  const topSuggestions = suggestions
    .sort((a: any, b: any) => {
      const priorityOrder: any = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, maxSuggestions);

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">💡 Recommendations</h4>
      <div className="space-y-2">
        {topSuggestions.map((suggestion: any) => (
          <div
            key={suggestion.id}
            className={cn(
              "p-3 rounded-lg text-sm",
              suggestion.priority === 'critical' ? 'bg-destructive/10 border-l-4 border-destructive' :
              suggestion.priority === 'high' ? 'bg-orange-500/10 border-l-4 border-orange-500' :
              'bg-primary/5 border-l-4 border-primary'
            )}
          >
            <div className="font-medium mb-1">{suggestion.title}</div>
            <div className="text-muted-foreground mb-2 text-xs">{suggestion.description}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={suggestion.action}
              className="h-6 px-2 text-xs"
            >
              {suggestion.actionLabel}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressTracker({ selectedCount, displayMode }: { selectedCount?: number; displayMode?: string }) {
  if (!selectedCount) return null;

  return (
    <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
      <h4 className="text-sm font-medium mb-2">📊 Selection Progress</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sources selected:</span>
          <span className="font-medium">{selectedCount}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {selectedCount === 0 && 'Start by selecting data sources'}
          {selectedCount === 1 && 'Good start! Consider adding related sources'}
          {selectedCount >= 2 && selectedCount <= 5 && 'Nice selection. Ready to continue?'}
          {selectedCount > 5 && 'Large selection - consider if all are needed'}
        </div>
        {selectedCount > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">Next steps:</div>
            <div className="text-xs">✓ Review data quality scores</div>
            <div className="text-xs">✓ Check update frequencies</div>
            <div className="text-xs">→ Continue to quality analysis</div>
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessContextPanel({ stakeholder, goal }: any) {
  if (!stakeholder && !goal) return null;

  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <h4 className="text-sm font-medium mb-2">🎯 Business Context</h4>
      <div className="space-y-2 text-sm">
        {stakeholder && (
          <div>
            <span className="text-muted-foreground">Primary stakeholder:</span>
            <div className="font-medium">{stakeholder}</div>
          </div>
        )}
        {goal && (
          <div>
            <span className="text-muted-foreground">Business goal:</span>
            <div>{goal}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ContextualSidebar({
  currentStep,
  workflowData,
  agentRecommendations,
  displayMode = 'intent',
  selectedSourcesCount = 0
}: ContextualSidebarProps) {
  // Only show sidebar content when it provides value
  const hasRecommendations = agentRecommendations?.suggestions?.length > 0;
  const hasBusinessContext = workflowData.primaryStakeholder || workflowData.businessGoal;
  const hasSelectionSummary = workflowData.selectedSources?.length > 0;

  // Calculate selection metrics
  const estimatedTime = workflowData.selectedSources
    ? `${workflowData.selectedSources.length * 5} minutes`
    : '0 minutes';

  const averageQuality = workflowData.selectedSources?.length > 0
    ? Math.round(
        workflowData.selectedSources.reduce((sum: number, s: any) => sum + (s.qualityScore || 85), 0) /
        workflowData.selectedSources.length
      )
    : 0;

  if (!hasRecommendations && !hasBusinessContext && !hasSelectionSummary) {
    // Minimal sidebar when no contextual information is available
    return (
      <div className="w-80 bg-card border-l border-border p-4 space-y-4">
        <ContextualHelp currentStep={currentStep} displayMode={displayMode} />
        {currentStep === 'data-discovery' && (
          <ProgressTracker selectedCount={selectedSourcesCount} displayMode={displayMode} />
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-l border-border p-4 space-y-4 overflow-y-auto">
      {/* Contextual Help - Always visible */}
      <ContextualHelp currentStep={currentStep} displayMode={displayMode} />

      {/* Progress Tracker - For data discovery */}
      {currentStep === 'data-discovery' && (
        <ProgressTracker selectedCount={selectedSourcesCount} displayMode={displayMode} />
      )}

      {/* Selection Summary - Only when sources selected */}
      {hasSelectionSummary && (
        <SelectionSummaryPanel
          selectedSources={workflowData.selectedSources}
          estimatedTime={estimatedTime}
          qualityScore={averageQuality}
        />
      )}

      {/* Smart Suggestions - Only when available */}
      {hasRecommendations && (
        <SmartSuggestionsPanel
          suggestions={agentRecommendations.suggestions}
          maxSuggestions={3}
        />
      )}

      {/* Business Context - Only when available */}
      {hasBusinessContext && (
        <BusinessContextPanel
          stakeholder={workflowData.primaryStakeholder}
          goal={workflowData.businessGoal}
        />
      )}
    </div>
  );
}