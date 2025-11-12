// Updated: 2025-11-11 17:26 - Fixed Takeaways and Key Insights styling
'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChartRenderer } from './ChartRenderer';
import { DashboardLayout, SummaryStatistic } from '@/lib/services/dashboard-visualization-analyzer';
import { IntelligentDashboardLayout, applyDataTransformation } from '@/lib/services/dashboard-intelligence-client';
import { TrendingUp, TrendingDown, Minus, BarChart3, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardViewProps {
  dashboard: DashboardLayout | IntelligentDashboardLayout;
  columns: string[];
  rows: any[][];
  className?: string;
}

/**
 * Type guard to check if dashboard is an IntelligentDashboardLayout
 */
function isIntelligentDashboard(
  dashboard: DashboardLayout | IntelligentDashboardLayout
): dashboard is IntelligentDashboardLayout {
  return 'views' in dashboard && dashboard.views.length > 0 && 'dataMapping' in dashboard.views[0];
}

/**
 * Summary stat card component
 */
function StatCard({ stat }: { stat: SummaryStatistic }) {
  const TrendIcon = stat.trend
    ? stat.trend.direction === 'up'
      ? TrendingUp
      : stat.trend.direction === 'down'
      ? TrendingDown
      : Minus
    : null;

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {stat.label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-foreground">
            {stat.format === 'currency' && '$'}
            {stat.value}
            {stat.format === 'percentage' && '%'}
          </p>
          {stat.trend && TrendIcon && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                stat.trend.direction === 'up' && 'text-green-500',
                stat.trend.direction === 'down' && 'text-red-500',
                stat.trend.direction === 'neutral' && 'text-muted-foreground'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              <span>{stat.trend.value}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Dashboard view with multiple charts and summary statistics
 */
export function DashboardView({
  dashboard,
  columns,
  rows,
  className
}: DashboardViewProps) {
  // State for dynamic axis selection (per view)
  const [axisSelections, setAxisSelections] = useState<Record<string, { xColumn: string; yColumn: string }>>({});

  // Detect numeric columns for Y-axis selection
  const numericColumns = useMemo(() => {
    if (rows.length === 0) return [];

    return columns.filter((col, idx) => {
      // Check first 10 rows to determine if column is numeric
      const sample = rows.slice(0, 10).map(row => row[idx]);
      return sample.every(val => typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val))));
    });
  }, [columns, rows]);

  // Calculate chart dimensions based on size for 2-column grid
  const getChartDimensions = (size: 'full' | 'half' | 'third' | 'quarter') => {
    const baseWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.45, 600) : 600;
    const baseHeight = 300;

    switch (size) {
      case 'full':
        // Full width spans 2 columns, so use wider dimensions
        return { width: baseWidth * 2, height: baseHeight };
      case 'half':
      case 'third':
      case 'quarter':
        // All other sizes take up one column
        return { width: baseWidth, height: baseHeight };
    }
  };

  return (
    <div className={cn('p-6 space-y-4 bg-background overflow-auto', className)}>
      {/* Dashboard Header - Prose Insight */}
      {'proseInsight' in dashboard && dashboard.proseInsight && (
        <p
          className="text-3xl leading-tight mt-2 mb-4 text-foreground"
          style={{ fontFamily: 'Reckless, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 500 }}
        >
          {dashboard.proseInsight}
        </p>
      )}

      {/* Key Insights Section */}
      {dashboard.summaryStats.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'Roobert, -apple-system, BlinkMacSystemFont, sans-serif' }}>
            Key Insights
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboard.summaryStats.map((stat, idx) => (
              <StatCard key={idx} stat={stat} />
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Views - 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dashboard.views.map((view) => {
          const dimensions = getChartDimensions(view.size);
          const isIntelligent = isIntelligentDashboard(dashboard);

          // Apply data transformation if this is an intelligent dashboard
          let viewColumns = columns;
          let viewRows = rows;
          let transformedMapping: { xColumn: string; yColumns: string[] } | null = null;

          if (isIntelligent && 'transformation' in view && view.transformation && view.transformation.type !== 'none') {
            try {
              const transformed = applyDataTransformation(columns, rows, view.transformation);
              viewColumns = transformed.columns;
              viewRows = transformed.rows;

              // Update dataMapping for transformed data
              if (view.transformation.type === 'histogram') {
                // Histogram always produces 'range' and 'count' columns
                transformedMapping = {
                  xColumn: 'range',
                  yColumns: ['count']
                };
              } else if (view.transformation.type === 'topN' || view.transformation.type === 'bottomN') {
                // Top/Bottom N keeps original columns
                transformedMapping = null; // Use original mapping
              }
            } catch (error) {
              console.error(`Failed to apply transformation for view ${view.id}:`, error);
              // Fall back to original data
            }
          }

          // Get default axes from AI or transformation
          const defaultXColumn = transformedMapping?.xColumn ||
            (isIntelligent && 'dataMapping' in view ? view.dataMapping.xColumn : viewColumns[0]);
          const defaultYColumn = transformedMapping?.yColumns?.[0] ||
            (isIntelligent && 'dataMapping' in view ? view.dataMapping.yColumns[0] : viewColumns[1]);

          // Get or initialize axis selection for this view
          const currentSelection = axisSelections[view.id] || {
            xColumn: defaultXColumn,
            yColumn: defaultYColumn
          };

          // Build visualization suggestion for ChartRenderer (using selected or default axes)
          const visualization = isIntelligent && 'dataMapping' in view
            ? {
                type: view.chartType as any,
                xColumn: currentSelection.xColumn,
                yColumns: [currentSelection.yColumn],
                reasoning: view.reasoning,
                confidence: view.confidence,
                chartConfig: {}
              }
            : 'visualization' in view
            ? view.visualization
            : {
                type: 'bar' as any,
                xColumn: currentSelection.xColumn,
                yColumns: [currentSelection.yColumn],
                reasoning: 'Fallback visualization',
                confidence: 0.5,
                chartConfig: {}
              };

          return (
            <Card
              key={view.id}
              className={cn(
                'border-border bg-card',
                view.size === 'full' && 'md:col-span-2',
                view.size === 'half' && 'md:col-span-1',
                view.size === 'third' && 'md:col-span-1',
                view.size === 'quarter' && 'md:col-span-1'
              )}
            >
              {/* View Header */}
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {view.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {view.description}
                    </p>
                  </div>
                  {isIntelligent && 'confidence' in view && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-2">
                      {(view.confidence * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Chart Content */}
              <div className="p-4 flex items-center justify-center min-h-[300px]">
                <ChartRenderer
                  suggestion={visualization}
                  columns={viewColumns}
                  rows={viewRows}
                  width={dimensions.width}
                  height={dimensions.height}
                />
              </div>

              {/* View Footer - Dynamic Axis Selection */}
              <div className="px-4 py-3 border-t border-border bg-muted/20">
                <div className="flex items-center gap-4">
                  {/* X-Axis Selector */}
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      X-Axis:
                    </label>
                    <Select
                      value={currentSelection.xColumn}
                      onValueChange={(value) => {
                        setAxisSelections(prev => ({
                          ...prev,
                          [view.id]: {
                            ...currentSelection,
                            xColumn: value
                          }
                        }));
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {viewColumns.map((col) => (
                          <SelectItem key={col} value={col} className="text-xs">
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Y-Axis Selector (numeric columns only) */}
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Y-Axis:
                    </label>
                    <Select
                      value={currentSelection.yColumn}
                      onValueChange={(value) => {
                        setAxisSelections(prev => ({
                          ...prev,
                          [view.id]: {
                            ...currentSelection,
                            yColumn: value
                          }
                        }));
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {viewColumns.filter(col => {
                          const colIdx = viewColumns.indexOf(col);
                          const sample = viewRows.slice(0, 10).map(row => row[colIdx]);
                          return sample.every(val => typeof val === 'number' || !isNaN(Number(val)));
                        }).map((col) => (
                          <SelectItem key={col} value={col} className="text-xs">
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data point count */}
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {viewRows.length} points
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
