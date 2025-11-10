/**
 * Dashboard Visualization Analyzer
 *
 * Analyzes query results and creates comprehensive dashboard layouts
 * with multiple complementary views and summary statistics
 */

import { VisualizationSuggestion, analyzeResultsForVisualization } from './query-visualization-analyzer';

export interface SummaryStatistic {
  label: string;
  value: string | number;
  format?: 'number' | 'currency' | 'percentage' | 'text';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
}

export interface DashboardView {
  id: string;
  title: string;
  description: string;
  visualization: VisualizationSuggestion;
  size: 'full' | 'half' | 'third' | 'quarter';
}

export interface DashboardLayout {
  title: string;
  description: string;
  summaryStats: SummaryStatistic[];
  views: DashboardView[];
  confidence: number;
}

/**
 * Calculate summary statistics from query results
 */
function calculateSummaryStats(
  columns: string[],
  rows: any[][],
  primaryVisualization: VisualizationSuggestion
): SummaryStatistic[] {
  const stats: SummaryStatistic[] = [];

  // Total count
  stats.push({
    label: 'Total Records',
    value: rows.length.toLocaleString(),
    format: 'number'
  });

  // Find numeric columns
  const numericColumns = columns
    .map((col, idx) => ({ name: col, idx }))
    .filter(({ idx }) => {
      const sample = rows.slice(0, 10).map(row => row[idx]);
      return sample.every(v => typeof v === 'number' && !isNaN(v));
    });

  // Add stats for primary numeric column
  if (numericColumns.length > 0 && primaryVisualization.yColumns.length > 0) {
    const primaryYCol = primaryVisualization.yColumns[0];
    const colIdx = columns.indexOf(primaryYCol);

    if (colIdx !== -1) {
      const values = rows.map(row => Number(row[colIdx]) || 0);
      const total = values.reduce((sum, val) => sum + val, 0);
      const avg = total / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);

      // Total
      stats.push({
        label: `Total ${primaryYCol}`,
        value: total.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        format: 'number'
      });

      // Average
      stats.push({
        label: `Average ${primaryYCol}`,
        value: avg.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        format: 'number'
      });

      // Range
      if (max !== min) {
        stats.push({
          label: 'Range',
          value: `${min.toLocaleString()} - ${max.toLocaleString()}`,
          format: 'text'
        });
      }
    }
  }

  return stats.slice(0, 4); // Limit to 4 stats
}

/**
 * Generate complementary views for dashboard
 */
function generateComplementaryViews(
  columns: string[],
  rows: any[][],
  primaryVisualization: VisualizationSuggestion
): DashboardView[] {
  const views: DashboardView[] = [];

  // Primary view
  views.push({
    id: 'primary',
    title: `${primaryVisualization.type.charAt(0).toUpperCase() + primaryVisualization.type.slice(1)} Chart`,
    description: primaryVisualization.reasoning,
    visualization: primaryVisualization,
    size: 'full'
  });

  // If we have enough data, try to create additional views
  if (rows.length >= 5) {
    // Find numeric columns
    const numericColumns = columns
      .map((col, idx) => ({ name: col, idx }))
      .filter(({ idx }) => {
        const sample = rows.slice(0, 10).map(row => row[idx]);
        return sample.every(v => typeof v === 'number' && !isNaN(v));
      });

    // Distribution view (if we have numeric data)
    // TODO: This needs proper data transformation before it can work
    // Currently disabled because it creates fake column names ('range', 'count')
    // that don't exist in the actual data
    /*
    if (numericColumns.length > 0 && primaryVisualization.yColumns.length > 0) {
      const yColIdx = columns.indexOf(primaryVisualization.yColumns[0]);

      if (yColIdx !== -1) {
        // Create histogram-like view by grouping into ranges
        const values = rows.map(row => Number(row[yColIdx]) || 0);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min;

        if (range > 0) {
          const buckets = 5;
          const bucketSize = range / buckets;
          const distribution = new Array(buckets).fill(0);
          const bucketLabels: string[] = [];

          values.forEach(val => {
            const bucketIdx = Math.min(Math.floor((val - min) / bucketSize), buckets - 1);
            distribution[bucketIdx]++;
          });

          for (let i = 0; i < buckets; i++) {
            const start = min + i * bucketSize;
            const end = start + bucketSize;
            bucketLabels.push(`${start.toFixed(0)}-${end.toFixed(0)}`);
          }

          views.push({
            id: 'distribution',
            title: `${primaryVisualization.yColumns[0]} Distribution`,
            description: `Frequency distribution showing how ${primaryVisualization.yColumns[0]} values are spread`,
            visualization: {
              type: 'bar',
              confidence: 0.85,
              xColumn: 'range',
              yColumns: ['count'],
              reasoning: 'Distribution histogram',
              chartConfig: {
                isHorizontal: false,
                showLegend: false
              }
            },
            size: 'half'
          });
        }
      }
    }
    */

    // Top/Bottom comparison view
    if (primaryVisualization.type === 'bar' && rows.length >= 10) {
      const topN = Math.min(5, Math.floor(rows.length / 2));

      views.push({
        id: 'top-bottom',
        title: `Top ${topN} vs Bottom ${topN}`,
        description: `Comparison of highest and lowest values`,
        visualization: {
          type: 'bar',
          confidence: 0.8,
          xColumn: primaryVisualization.xColumn,
          yColumns: primaryVisualization.yColumns,
          reasoning: `Highlights extremes: top ${topN} and bottom ${topN} by ${primaryVisualization.yColumns[0]}`,
          chartConfig: {
            isHorizontal: true,
            showLegend: false
          }
        },
        size: 'half'
      });
    }
  }

  return views;
}

/**
 * Analyze results and create comprehensive dashboard layout
 */
export function analyzeDashboardLayout(
  columns: string[],
  rows: any[][],
  sql?: string
): DashboardLayout | null {
  // Get primary visualization
  const primaryViz = analyzeResultsForVisualization(columns, rows, sql);

  if (!primaryViz || primaryViz.type === 'table') {
    return null;
  }

  // Generate summary statistics
  const summaryStats = calculateSummaryStats(columns, rows, primaryViz);

  // Generate complementary views
  const views = generateComplementaryViews(columns, rows, primaryViz);

  // Create dashboard title
  const title = `${primaryViz.xColumn} Analysis`;
  const description = `Comprehensive view of ${columns.join(', ')} across ${rows.length} records`;

  return {
    title,
    description,
    summaryStats,
    views,
    confidence: primaryViz.confidence
  };
}

/**
 * Check if dashboard layout should be used (vs single chart)
 *
 * With CrewAI intelligence, we're more permissive and let the AI determine
 * the best visualization approach. The AI can handle various data types and
 * create meaningful dashboards even with mixed data.
 */
export function shouldUseDashboard(
  columns: string[],
  rows: any[][]
): boolean {
  // Use CrewAI dashboard intelligence for most queries
  // Let the AI decide what visualizations make sense

  // Minimum: At least 3 rows to have meaningful data
  if (rows.length < 3) {
    return false;
  }

  // Maximum: Keep under 1000 rows for performance
  // (Very large datasets should use pagination or aggregation first)
  if (rows.length > 1000) {
    return false;
  }

  // Minimum: At least 2 columns (one for labels, one for values)
  if (columns.length < 2) {
    return false;
  }

  // If we have enough rows and columns, use AI-powered dashboard
  return true;
}
