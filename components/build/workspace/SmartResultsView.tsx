'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DataTable } from '@/components/build/workspace/DataTable';
import { ChartRenderer } from '@/components/build/workspace/ChartRenderer';
import { DashboardView } from '@/components/build/workspace/DashboardView';
import {
  analyzeResultsForVisualization,
  shouldAutoVisualize,
  VisualizationSuggestion,
} from '@/lib/services/query-visualization-analyzer';
import {
  analyzeDashboardLayout,
  shouldUseDashboard,
  DashboardLayout,
} from '@/lib/services/dashboard-visualization-analyzer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Info, ChevronDown, ChevronUp, Layout, Database, Table2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DataSource {
  name: string;
  schema?: string;
  columns?: string[];
  description?: string;
}

interface SmartResultsViewProps {
  result: {
    data: any[];
    columns: { name: string; type: string }[];
    rowCount: number;
    executionTime: number;
  };
  sql?: string;
  rawColumns?: string[];
  rawRows?: any[][];
  onExport: () => void;
  dataSources?: DataSource[]; // Data sources used in the query
}

/**
 * SmartResultsView - Intelligently renders query results as charts or tables
 */
export function SmartResultsView({
  result,
  sql,
  rawColumns,
  rawRows,
  onExport,
  dataSources,
}: SmartResultsViewProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [chartCollapsed, setChartCollapsed] = useState(false);

  // Get columns and rows
  const cols = rawColumns || result.columns.map((c) => c.name);
  const rows = rawRows || result.data.map((row) =>
    result.columns.map((col) => row[col.name])
  );

  // Check if we should use dashboard layout
  const useDashboard = useMemo(() => {
    return shouldUseDashboard(cols, rows);
  }, [cols, rows]);

  // Analyze for dashboard layout
  const dashboardLayout: DashboardLayout | null = useMemo(() => {
    if (!useDashboard) return null;
    return analyzeDashboardLayout(cols, rows, sql);
  }, [cols, rows, sql, useDashboard]);

  // Analyze query results for single visualization (fallback)
  const suggestion: VisualizationSuggestion | null = useMemo(() => {
    if (useDashboard && dashboardLayout) return null;
    return analyzeResultsForVisualization(cols, rows, sql);
  }, [cols, rows, sql, useDashboard, dashboardLayout]);

  // Determine if chart should be shown
  const shouldShowChart = useMemo(() => {
    // If using dashboard, show it
    if (useDashboard && dashboardLayout) return true;

    // Otherwise check single visualization
    if (!suggestion || suggestion.type === 'table') return false;
    return shouldAutoVisualize(suggestion);
  }, [suggestion, useDashboard, dashboardLayout]);

  // Reset reasoning when results change
  useEffect(() => {
    setShowReasoning(false);
    setChartCollapsed(false);
  }, [result]);

  // Calculate container dimensions for chart
  const chartDimensions = useMemo(() => {
    // Responsive sizing based on viewport
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    return {
      width: Math.min(vw * 0.35, 900), // 35% of viewport or max 900px
      height: Math.min(vh * 0.5, 500),  // 50% of viewport or max 500px
    };
  }, []);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Single scrollable container for entire document */}
      <div className="flex-1">
        {/* Data Sources Section */}
        {dataSources && dataSources.length > 0 && (
          <div className="border-b border-border bg-background px-4 py-2 sticky top-0 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Data Sources:</span>
              </div>
              {dataSources.map((source, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs py-0.5 px-2 gap-1.5"
                >
                  <Table2 className="h-3 w-3" />
                  {source.schema ? `${source.schema}.${source.name}` : source.name}
                  {source.columns && (
                    <span className="text-[10px] opacity-60">
                      ({source.columns.length} cols)
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Layout - When applicable */}
        {useDashboard && dashboardLayout && shouldShowChart && !chartCollapsed && (
          <div className="border-b border-border">
            <DashboardView
              dashboard={dashboardLayout}
              columns={cols}
              rows={rows}
            />
          </div>
        )}

      {/* Single Chart Section - Collapsible (when not using dashboard) */}
      {!useDashboard && suggestion && shouldShowChart && !chartCollapsed && (
        <div className="border-b border-border">
          {/* Chart Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip open={showReasoning} onOpenChange={setShowReasoning}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 gap-1.5"
                      onClick={() => setShowReasoning(!showReasoning)}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span className="text-xs text-muted-foreground">
                        {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} Chart
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                        {(suggestion.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                      <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-sm">
                    <div className="space-y-1">
                      <div className="font-semibold text-xs">
                        Visualization: {suggestion.type.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {suggestion.reasoning}
                      </div>
                      <div className="text-[10px] text-muted-foreground pt-1 border-t border-border mt-2">
                        X: {suggestion.xColumn} | Y: {suggestion.yColumns.join(', ')}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setChartCollapsed(true)}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="text-xs ml-1">Collapse</span>
            </Button>
          </div>

          {/* Chart Content */}
          <div className="p-4 flex items-center justify-center bg-background">
            <ChartRenderer
              suggestion={suggestion}
              columns={cols}
              rows={rows}
              width={chartDimensions.width}
              height={chartDimensions.height}
            />
          </div>
        </div>
      )}

      {/* Collapsed Visualization Header - Show expand button */}
      {shouldShowChart && chartCollapsed && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {useDashboard && dashboardLayout ? (
              <>
                <Layout className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Dashboard View
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {dashboardLayout.views.length} views
                </Badge>
              </>
            ) : suggestion ? (
              <>
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} Chart
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {(suggestion.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => setChartCollapsed(false)}
          >
            <ChevronDown className="h-4 w-4" />
            <span className="text-xs ml-1">Expand</span>
          </Button>
        </div>
      )}

        {/* Data Table Section - Always visible at bottom */}
        <div className="border-t border-border">
          {/* Table Header */}
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <Table2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Query Results</h3>
              <Badge variant="secondary" className="text-xs">
                {result.rowCount} rows
              </Badge>
            </div>
          </div>
          {/* Table Content - No separate scroll, part of document flow */}
          <div>
            <DataTable
              columns={cols}
              rows={rows}
              rowCount={result.rowCount}
              onExport={onExport}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
