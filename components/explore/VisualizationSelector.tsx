"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Grid3x3,
  Table2,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  TrendingUp,
  Layers,
} from 'lucide-react';
import type {
  VisualizationRecommendation,
  ChartType,
} from '@/lib/services/ai-visualization-recommender';

interface VisualizationSelectorProps {
  recommendation: VisualizationRecommendation;
  currentType?: ChartType;
  onSelectVisualization: (type: ChartType) => void;
  className?: string;
  compact?: boolean;
}

const CHART_ICONS: Record<ChartType, React.ReactNode> = {
  bar: <BarChart3 className="h-4 w-4" />,
  line: <LineChart className="h-4 w-4" />,
  area: <Activity className="h-4 w-4" />,
  pie: <PieChart className="h-4 w-4" />,
  scatter: <Grid3x3 className="h-4 w-4" />,
  heatmap: <Layers className="h-4 w-4" />,
  treemap: <Grid3x3 className="h-4 w-4" />,
  timeseries: <TrendingUp className="h-4 w-4" />,
  sankey: <Activity className="h-4 w-4" />,
  radial: <PieChart className="h-4 w-4" />,
  table: <Table2 className="h-4 w-4" />,
  metric: <Sparkles className="h-4 w-4" />,
};

const CHART_LABELS: Record<ChartType, string> = {
  bar: 'Bar Chart',
  line: 'Line Chart',
  area: 'Area Chart',
  pie: 'Pie Chart',
  scatter: 'Scatter Plot',
  heatmap: 'Heatmap',
  treemap: 'Treemap',
  timeseries: 'Time Series',
  sankey: 'Sankey Diagram',
  radial: 'Radial Chart',
  table: 'Data Table',
  metric: 'Metric Card',
};

export function VisualizationSelector({
  recommendation,
  currentType,
  onSelectVisualization,
  className = '',
  compact = false,
}: VisualizationSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedType = currentType || recommendation.type;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {CHART_ICONS[selectedType]}
          <span className="font-medium">{CHART_LABELS[selectedType]}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-7 px-2 text-xs"
        >
          Change
          <ChevronDown
            className={`ml-1 h-3 w-3 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </Button>

        {isExpanded && (
          <div className="absolute z-50 mt-2 w-64 rounded-md border bg-popover p-2 shadow-lg">
            <div className="space-y-1">
              {/* Primary recommendation */}
              <ChartOption
                type={recommendation.type}
                label={CHART_LABELS[recommendation.type]}
                icon={CHART_ICONS[recommendation.type]}
                reasoning={recommendation.reasoning}
                confidence={recommendation.confidence}
                isSelected={selectedType === recommendation.type}
                isPrimary
                onClick={() => {
                  onSelectVisualization(recommendation.type);
                  setIsExpanded(false);
                }}
              />

              {/* Alternatives */}
              {recommendation.alternatives?.map((alt) => (
                <ChartOption
                  key={alt.type}
                  type={alt.type}
                  label={CHART_LABELS[alt.type]}
                  icon={CHART_ICONS[alt.type]}
                  reasoning={alt.useCase}
                  confidence={alt.confidence}
                  isSelected={selectedType === alt.type}
                  onClick={() => {
                    onSelectVisualization(alt.type);
                    setIsExpanded(false);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Visualization Recommendations</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            AI-powered suggestions based on your data
          </p>
        </div>
      </div>

      {/* Primary Recommendation */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">
          Best Match
        </div>
        <ChartOption
          type={recommendation.type}
          label={CHART_LABELS[recommendation.type]}
          icon={CHART_ICONS[recommendation.type]}
          reasoning={recommendation.reasoning}
          confidence={recommendation.confidence}
          isSelected={selectedType === recommendation.type}
          isPrimary
          onClick={() => onSelectVisualization(recommendation.type)}
          showDetails
        />

        {/* Insights */}
        {recommendation.insights && recommendation.insights.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {recommendation.insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs"
              >
                <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                <span className="text-muted-foreground">{insight}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alternative Visualizations */}
      {recommendation.alternatives && recommendation.alternatives.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Other Options
          </div>
          <div className="space-y-2">
            {recommendation.alternatives.map((alt) => (
              <ChartOption
                key={alt.type}
                type={alt.type}
                label={CHART_LABELS[alt.type]}
                icon={CHART_ICONS[alt.type]}
                reasoning={alt.useCase}
                confidence={alt.confidence}
                isSelected={selectedType === alt.type}
                onClick={() => onSelectVisualization(alt.type)}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

interface ChartOptionProps {
  type: ChartType;
  label: string;
  icon: React.ReactNode;
  reasoning: string;
  confidence: number;
  isSelected: boolean;
  isPrimary?: boolean;
  showDetails?: boolean;
  onClick: () => void;
}

function ChartOption({
  type,
  label,
  icon,
  reasoning,
  confidence,
  isSelected,
  isPrimary = false,
  showDetails = false,
  onClick,
}: ChartOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-md border p-3 text-left transition-all hover:border-primary/50 hover:bg-accent/50 ${
        isSelected
          ? 'border-primary bg-accent'
          : 'border-border bg-background'
      } ${isPrimary ? 'border-primary/30' : ''}`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute right-2 top-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Primary badge */}
      {isPrimary && !isSelected && (
        <div className="absolute right-2 top-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Recommended
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
          }`}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <ConfidenceBadge confidence={confidence} />
          </div>

          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {reasoning}
          </p>

          {/* Additional details for primary */}
          {showDetails && (
            <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>Confidence: {Math.round(confidence * 100)}%</span>
              {confidence >= 0.8 && (
                <span className="text-green-600">High confidence</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const level =
    confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';

  const colors = {
    high: 'bg-green-500/10 text-green-600 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    low: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  };

  return (
    <span
      className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${colors[level]}`}
    >
      {percentage}%
    </span>
  );
}
