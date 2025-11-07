"use client";

import React, { useState, useEffect } from 'react';
import { BarChart } from '@/components/Charts/BarChart';
import { LineChart } from '@/components/Charts/LineChart';
import { AreaChart } from '@/components/Charts/AreaChart';
import { PieChart } from '@/components/Charts/PieChart';
import { ScatterPlot } from '@/components/Charts/ScatterPlot';
import { Heatmap } from '@/components/Charts/Heatmap';
import { MetricCard, MetricGrid } from '@/components/Charts/MetricCard';
import { TreemapChart } from '@/components/ui/treemap-chart';
import { TimeSeriesChart } from '@/components/ui/time-series-chart';
import { VisualizationSelector } from './VisualizationSelector';
import type {
  VisualizationRecommendation,
  ChartType,
} from '@/lib/services/ai-visualization-recommender';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Eye, EyeOff } from 'lucide-react';

interface EnhancedChartRendererProps {
  columns: string[];
  rows: any[][];
  userQuery?: string;
  sqlQuery?: string;
  context?: {
    domain?: string;
    previousCharts?: string[];
    userRole?: string;
  };
  width?: number;
  height?: number;
  showSelector?: boolean;
  autoVisualize?: boolean;
  onChartTypeChange?: (type: ChartType) => void;
  className?: string;
}

export function EnhancedChartRenderer({
  columns,
  rows,
  userQuery,
  sqlQuery,
  context,
  width = 600,
  height = 400,
  showSelector = true,
  autoVisualize = true,
  onChartTypeChange,
  className = '',
}: EnhancedChartRendererProps) {
  const [recommendation, setRecommendation] =
    useState<VisualizationRecommendation | null>(null);
  const [selectedType, setSelectedType] = useState<ChartType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get recommendation on mount or when data changes
  useEffect(() => {
    const getRecommendation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Call the API endpoint instead of using the service directly
        const response = await fetch('/api/visualizations/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            columns,
            rows,
            userQuery,
            sqlQuery,
            context,
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success || !data.recommendation) {
          throw new Error('Invalid API response');
        }

        const rec = data.recommendation;
        setRecommendation(rec);
        setSelectedType(rec.type);

        // Record that this was auto-selected
        await fetch('/api/visualizations/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chartType: rec.type,
            wasAccepted: true,
          }),
        }).catch((err) => console.warn('Failed to record preference:', err));
      } catch (err) {
        console.error('Failed to get visualization recommendation:', err);
        setError('Failed to analyze data for visualization');
        // Fallback to table
        setRecommendation({
          type: 'table',
          confidence: 0.5,
          reasoning: 'Error occurred, showing table view',
          xColumn: columns[0] || '',
          yColumns: columns.slice(1),
        });
        setSelectedType('table');
      } finally {
        setIsLoading(false);
      }
    };

    if (columns.length > 0 && rows.length > 0) {
      getRecommendation();
    }
  }, [columns, rows, userQuery, sqlQuery, context]);

  const handleSelectVisualization = async (type: ChartType) => {
    if (recommendation) {
      // Record user preference via API
      try {
        await fetch('/api/visualizations/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chartType: type,
            wasAccepted: true,
          }),
        });

        if (selectedType && selectedType !== type) {
          await fetch('/api/visualizations/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chartType: selectedType,
              wasAccepted: false,
            }),
          });
        }
      } catch (err) {
        console.warn('Failed to record preference:', err);
      }
    }

    setSelectedType(type);
    onChartTypeChange?.(type);
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </Card>
    );
  }

  if (error || !recommendation) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-sm text-muted-foreground">
          {error || 'Unable to visualize data'}
        </div>
      </Card>
    );
  }

  const currentType = selectedType || recommendation.type;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Visualization Selector */}
      {showSelector && (
        <VisualizationSelector
          recommendation={recommendation}
          currentType={currentType}
          onSelectVisualization={handleSelectVisualization}
          compact
        />
      )}

      {/* Reasoning Toggle */}
      {recommendation.reasoning && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReasoning(!showReasoning)}
            className="text-xs text-muted-foreground"
          >
            {showReasoning ? (
              <>
                <EyeOff className="mr-1.5 h-3 w-3" />
                Hide reasoning
              </>
            ) : (
              <>
                <Info className="mr-1.5 h-3 w-3" />
                Why this chart?
              </>
            )}
          </Button>

          <span className="text-xs text-muted-foreground">
            {rows.length} rows × {columns.length} columns
          </span>
        </div>
      )}

      {/* Reasoning Card */}
      {showReasoning && (
        <Card className="border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{recommendation.reasoning}</p>
              {recommendation.insights && recommendation.insights.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {recommendation.insights.map((insight, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground">
                      • {insight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Chart Renderer */}
      <Card className="p-4">
        {(userQuery || currentType) && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              {userQuery || 'Query Results'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Showing {currentType} visualization
            </p>
          </div>
        )}
        <div className="w-full overflow-auto">
          {renderChart(currentType, recommendation, columns, rows, width, height)}
        </div>
      </Card>
    </div>
  );
}

/**
 * Render the appropriate chart based on type
 */
function renderChart(
  type: ChartType,
  recommendation: VisualizationRecommendation,
  columns: string[],
  rows: any[][],
  width: number,
  height: number
): React.ReactNode {
  try {
    switch (type) {
      case 'bar':
        return renderBarChart(recommendation, columns, rows, width, height);

      case 'line':
        return renderLineChart(recommendation, columns, rows, width, height);

      case 'area':
        return renderAreaChart(recommendation, columns, rows, width, height);

      case 'pie':
        return renderPieChart(recommendation, columns, rows, width, height);

      case 'scatter':
        return renderScatterPlot(recommendation, columns, rows, width, height);

      case 'heatmap':
        return renderHeatmap(recommendation, columns, rows, width, height);

      case 'treemap':
        return renderTreemap(recommendation, columns, rows, width, height);

      case 'timeseries':
        return renderTimeSeries(recommendation, columns, rows, width, height);

      case 'metric':
        return renderMetric(recommendation, columns, rows);

      case 'table':
      default:
        return renderTable(columns, rows);
    }
  } catch (err) {
    console.error('Error rendering chart:', err);
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Failed to render {type} chart. Showing table instead.
        <div className="mt-4">{renderTable(columns, rows)}</div>
      </div>
    );
  }
}

// Chart-specific renderers

function renderBarChart(
  rec: VisualizationRecommendation,
  columns: string[],
  rows: any[][],
  width: number,
  height: number
) {
  const xIdx = columns.indexOf(rec.xColumn);
  const yIdx = columns.indexOf(rec.yColumns[0]);

  const data = rows.map((row) => ({
    label: String(row[xIdx]),
    value: Number(row[yIdx]),
  }));

  return (
    <BarChart
      data={data}
      width={width}
      height={height}
      isHorizontal={rec.chartConfig?.isHorizontal}
      xAxisLabel={rec.xColumn}
      yAxisLabel={rec.yColumns[0]}
      showGrid={true}
      animate
    />
  );
}

function renderLineChart(
  rec: VisualizationRecommendation,
  columns: string[],
  rows: any[][],
  width: number,
  height: number
) {
  const xIdx = columns.indexOf(rec.xColumn);
  const yIdx = columns.indexOf(rec.yColumns[0]);

  const data = rows.map((row) => ({
    x: new Date(row[xIdx]),
    y: Number(row[yIdx]),
  }));

  return (
    <LineChart
      data={data}
      width={width}
      height={height}
      xAxisLabel={rec.xColumn}
      yAxisLabel={rec.yColumns[0]}
      showGrid={true}
      animate
    />
  );
}

function renderAreaChart(
  rec: VisualizationRecommendation,
  columns: string[],
  rows: any[][],
  width: number,
  height: number
) {
  const xIdx = columns.indexOf(rec.xColumn);
  const yIdx = columns.indexOf(rec.yColumns[0]);

  const data = rows.map((row) => ({
    x: new Date(row[xIdx]),
    y: Number(row[yIdx]),
  }));

  return (
    <AreaChart
      data={data}
      width={width}
      height={height}
      xAxisLabel={rec.xColumn}
      yAxisLabel={rec.yColumns[0]}
      showGrid={true}
      animate
    />
  );
}

function renderPieChart(
  rec: VisualizationRecommendation,
  columns: string[],
  rows: any[][],
  width: number,
  height: number
) {
  const xIdx = columns.indexOf(rec.xColumn);
  const yIdx = columns.indexOf(rec.yColumns[0]);

  const data = rows.slice(0, 12).map((row) => ({
    label: String(row[xIdx]),
    value: Number(row[yIdx]),
  }));

  return <PieChart data={data} width={width} height={height} animate />;
}

function renderScatterPlot(
  rec: VisualizationRecommendation,
  columns: string[],
  rows: any[][],
  width: number,
  height: number
) {
  const xIdx = columns.indexOf(rec.xColumn);
  const yIdx = columns.indexOf(rec.yColumns[0]);

  const data = rows.map((row, idx) => ({
    x: Number(row[xIdx]),
    y: Number(row[yIdx]),
    label: `Point ${idx + 1}`,
  }));

  return (
    <ScatterPlot
      data={data}
      width={width}
      height={height}
      xLabel={rec.xColumn}
      yLabel={rec.yColumns[0]}
      showTrendline={rec.chartConfig?.showTrendline}
      animate
    />
  );
}

function renderHeatmap(
  rec: VisualizationRecommendation,
  columns: string[],
  rows: any[][],
  width: number,
  height: number
) {
  const xIdx = columns.indexOf(rec.xColumn);
  const yIdx = columns.indexOf(rec.yColumns[0]);
  const valueIdx = rec.yColumns.length > 1 ? columns.indexOf(rec.yColumns[1]) : yIdx;

  const data = rows.map((row) => ({
    x: String(row[xIdx]),
    y: String(row[yIdx]),
    value: Number(row[valueIdx]),
  }));

  return (
    <Heatmap
      data={data}
      width={width}
      height={height}
      xLabel={rec.xColumn}
      yLabel={rec.yColumns[0]}
      animate
    />
  );
}

function renderTreemap(
  rec: VisualizationRecommendation,
  columns: string[],
  rows: any[][],
  width: number,
  height: number
) {
  // Simple treemap - group by first column
  const xIdx = columns.indexOf(rec.xColumn);
  const yIdx = columns.indexOf(rec.yColumns[0]);

  const root = {
    id: 'root',
    name: 'Root',
    children: rows.map((row, idx) => ({
      id: `node-${idx}`,
      name: String(row[xIdx]),
      value: Number(row[yIdx]),
    })),
  };

  return <TreemapChart data={root} width={width} height={height} />;
}

function renderTimeSeries(
  rec: VisualizationRecommendation,
  columns: string[],
  rows: any[][],
  width: number,
  height: number
) {
  const xIdx = columns.indexOf(rec.xColumn);
  const yIdx = columns.indexOf(rec.yColumns[0]);

  const data = rows.map((row) => ({
    timestamp: new Date(row[xIdx]),
    value: Number(row[yIdx]),
  }));

  return <TimeSeriesChart data={data} width={width} height={height} />;
}

function renderMetric(
  rec: VisualizationRecommendation,
  columns: string[],
  rows: any[][]
) {
  // If single value, show as metric card
  if (rows.length === 1 && rows[0].length >= 1) {
    const metric = {
      value: Number(rows[0][0]),
      label: columns[0],
      description: rec.reasoning,
    };

    return <MetricCard data={metric} size="lg" />;
  }

  // If multiple rows, show as metric grid
  const metrics = rows.slice(0, 8).map((row, idx) => ({
    value: Number(row[1] || row[0]),
    label: String(row[0] || columns[idx]),
  }));

  return <MetricGrid metrics={metrics} columns={metrics.length > 4 ? 4 : 3} />;
}

function renderTable(columns: string[], rows: any[][]) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="px-4 py-2 text-left font-medium text-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b hover:bg-muted/30">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-2 text-muted-foreground">
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
