'use client';

import React, { useMemo } from 'react';
import { RechartsBar, RechartsBarData } from '@/components/Charts/RechartsBar';
import { RechartsPie, RechartsPieData } from '@/components/Charts/RechartsPie';
import { RechartsLine, RechartsLineData } from '@/components/Charts/RechartsLine';
import { RechartsArea, RechartsAreaData } from '@/components/Charts/RechartsArea';
import { VisualizationSuggestion } from '@/lib/services/query-visualization-analyzer';
import { AlertCircle } from 'lucide-react';

interface ChartRendererProps {
  suggestion: VisualizationSuggestion;
  columns: string[];
  rows: any[][];
  width?: number;
  height?: number;
}

/**
 * ChartRenderer - Routes to appropriate chart component and transforms data
 */
export function ChartRenderer({
  suggestion,
  columns,
  rows,
  width = 800,
  height = 400,
}: ChartRendererProps) {
  // Transform SQL results into Recharts format: { name: string, value: number }
  const { chartData, errorMessage } = useMemo(() => {
    try {
      console.log('[ChartRenderer] Received suggestion:', {
        type: suggestion.type,
        xColumn: suggestion.xColumn,
        yColumns: suggestion.yColumns,
        availableColumns: columns,
        rowCount: rows.length
      });

      const xColumnIndex = columns.indexOf(suggestion.xColumn);
      const yColumnIndex = columns.indexOf(suggestion.yColumns[0]);

      if (xColumnIndex === -1 || yColumnIndex === -1) {
        const missingCols = [];
        if (xColumnIndex === -1) missingCols.push(suggestion.xColumn);
        if (yColumnIndex === -1) missingCols.push(suggestion.yColumns[0]);

        console.error('Chart column mapping failed', {
          xColumn: suggestion.xColumn,
          yColumns: suggestion.yColumns,
          columns,
          missingColumns: missingCols,
        });
        return {
          chartData: null,
          errorMessage: `Missing columns: ${missingCols.join(', ')}. Available: ${columns.join(', ')}`
        };
      }

      // Validate data rows exist
      if (!rows || rows.length === 0) {
        return {
          chartData: null,
          errorMessage: 'No data rows available for visualization'
        };
      }

      // Recharts uses simple { name, value } format for all chart types
      const transformed = rows.map((row) => ({
        name: String(row[xColumnIndex] || 'Unknown'),
        value: Number(row[yColumnIndex]) || 0,
      }));

      console.log('[ChartRenderer] Transformed data for Recharts:', {
        chartType: suggestion.type,
        sampleData: transformed.slice(0, 3),
        totalRows: transformed.length
      });

      return { chartData: transformed, errorMessage: null };
    } catch (error) {
      console.error('Error transforming chart data:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      return { chartData: null, errorMessage: `Data transformation failed: ${errorMsg}` };
    }
  }, [suggestion, columns, rows]);

  // Handle error state
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center space-y-3 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive/50" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Unable to render chart
            </p>
            <p className="text-xs text-muted-foreground">
              {errorMessage || 'Data format may not be compatible with this visualization type'}
            </p>
          </div>
          <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
            <p>Expected: {suggestion.type} chart</p>
            <p>X-Axis: {suggestion.xColumn} | Y-Axis: {suggestion.yColumns.join(', ')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate Recharts component
  switch (suggestion.type) {
    case 'bar':
      return (
        <div className="w-full h-full">
          <RechartsBar
            data={chartData as RechartsBarData[]}
            height={height}
            xAxisLabel={suggestion.xColumn}
            yAxisLabel={suggestion.yColumns[0]}
            barColor="#3b82f6"
          />
        </div>
      );

    case 'pie':
      return (
        <div className="w-full h-full">
          <RechartsPie
            data={chartData as RechartsPieData[]}
            height={height}
          />
        </div>
      );

    case 'line':
      return (
        <div className="w-full h-full">
          <RechartsLine
            data={chartData as RechartsLineData[]}
            height={height}
            xAxisLabel={suggestion.xColumn}
            yAxisLabel={suggestion.yColumns[0]}
            lineColor="#10b981"
          />
        </div>
      );

    case 'area':
      return (
        <div className="w-full h-full">
          <RechartsArea
            data={chartData as RechartsAreaData[]}
            height={height}
            xAxisLabel={suggestion.xColumn}
            yAxisLabel={suggestion.yColumns[0]}
            areaColor="#8b5cf6"
          />
        </div>
      );

    case 'table':
    default:
      // Table view is handled by SmartResultsView
      return null;
  }
}
