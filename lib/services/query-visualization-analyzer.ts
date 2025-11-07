/**
 * Query Visualization Analyzer
 *
 * Analyzes SQL query results and suggests the most appropriate visualization type
 * based on data structure, column types, and SQL query patterns.
 */

export interface VisualizationSuggestion {
  type: 'bar' | 'line' | 'area' | 'pie' | 'table';
  confidence: number; // 0-1, how confident we are in this suggestion
  xColumn: string; // Column for x-axis
  yColumns: string[]; // Column(s) for y-axis
  reasoning: string; // Human-readable explanation
  chartConfig?: {
    isHorizontal?: boolean;
    isStacked?: boolean;
    showLegend?: boolean;
    colorScheme?: string;
  };
}

interface ColumnMetadata {
  name: string;
  isNumeric: boolean;
  isTemporal: boolean;
  isCategorical: boolean;
  uniqueCount: number;
  sampleValues: any[];
}

/**
 * Detect column type based on sample values
 */
function analyzeColumn(columnName: string, values: any[]): ColumnMetadata {
  const sampleSize = Math.min(values.length, 100);
  const samples = values.slice(0, sampleSize).filter(v => v !== null && v !== undefined);

  let isNumeric = false;
  let isTemporal = false;
  let isCategorical = false;

  if (samples.length === 0) {
    return {
      name: columnName,
      isNumeric: false,
      isTemporal: false,
      isCategorical: false,
      uniqueCount: 0,
      sampleValues: []
    };
  }

  // Check for numeric
  isNumeric = samples.every(v => typeof v === 'number' && !isNaN(v));

  // Check for temporal (date/timestamp)
  const temporalPatterns = [
    /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T/, // ISO 8601
    /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
  ];

  const temporalKeywords = ['date', 'time', 'timestamp', 'created', 'updated', 'year', 'month', 'day'];

  isTemporal = samples.some(v => {
    if (typeof v === 'string') {
      return temporalPatterns.some(pattern => pattern.test(v));
    }
    if (v instanceof Date) return true;
    return false;
  }) || temporalKeywords.some(keyword => columnName.toLowerCase().includes(keyword));

  // Check for categorical
  const uniqueValues = new Set(samples);
  const uniqueCount = uniqueValues.size;
  const categoricalThreshold = Math.min(sampleSize * 0.5, 20); // Max 20 unique values or 50% of samples

  isCategorical = !isNumeric && !isTemporal && uniqueCount <= categoricalThreshold;

  return {
    name: columnName,
    isNumeric,
    isTemporal,
    isCategorical,
    uniqueCount,
    sampleValues: Array.from(uniqueValues).slice(0, 5)
  };
}

/**
 * Analyze SQL query for hints about visualization intent
 */
function analyzeSQLPattern(sql?: string): {
  hasGroupBy: boolean;
  hasAggregate: boolean;
  hasTimeFunction: boolean;
  hasLimit: boolean;
  hasOrderBy: boolean;
  limitValue?: number;
} {
  if (!sql) {
    return {
      hasGroupBy: false,
      hasAggregate: false,
      hasTimeFunction: false,
      hasLimit: false,
      hasOrderBy: false
    };
  }

  const upperSQL = sql.toUpperCase();

  // Check for GROUP BY
  const hasGroupBy = /GROUP\s+BY/i.test(sql);

  // Check for aggregate functions
  const aggregateFunctions = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'STDDEV', 'VARIANCE'];
  const hasAggregate = aggregateFunctions.some(fn => upperSQL.includes(`${fn}(`));

  // Check for time functions
  const timeFunctions = ['DATE_TRUNC', 'EXTRACT', 'DATE_PART', 'TO_CHAR', 'YEAR', 'MONTH', 'DAY'];
  const hasTimeFunction = timeFunctions.some(fn => upperSQL.includes(fn));

  // Check for LIMIT
  const hasLimit = /LIMIT\s+\d+/i.test(sql);
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  const limitValue = limitMatch ? parseInt(limitMatch[1]) : undefined;

  // Check for ORDER BY
  const hasOrderBy = /ORDER\s+BY/i.test(sql);

  return {
    hasGroupBy,
    hasAggregate,
    hasTimeFunction,
    hasLimit,
    hasOrderBy,
    limitValue
  };
}

/**
 * Main function to analyze query results and suggest visualization
 */
export function analyzeResultsForVisualization(
  columns: string[],
  rows: any[][],
  sql?: string
): VisualizationSuggestion | null {
  // Early return for empty results
  if (!columns || columns.length === 0 || !rows || rows.length === 0) {
    return null;
  }

  // Analyze SQL pattern
  const sqlPatterns = analyzeSQLPattern(sql);

  // Analyze each column
  const columnMetadata: ColumnMetadata[] = columns.map((colName, colIdx) => {
    const values = rows.map(row => row[colIdx]);
    return analyzeColumn(colName, values);
  });

  const numericColumns = columnMetadata.filter(c => c.isNumeric);
  const temporalColumns = columnMetadata.filter(c => c.isTemporal);
  const categoricalColumns = columnMetadata.filter(c => c.isCategorical);

  // Rule 1: Too many rows or columns -> Default to table
  if (rows.length > 100 || columns.length > 10) {
    return {
      type: 'table',
      confidence: 0.9,
      xColumn: columns[0],
      yColumns: columns.slice(1),
      reasoning: `Dataset is large (${rows.length} rows, ${columns.length} columns). Table view is best for detailed inspection.`
    };
  }

  // Rule 2: Time series detection (temporal + numeric)
  if (temporalColumns.length > 0 && numericColumns.length > 0) {
    const timeCol = temporalColumns[0];
    const valueCol = numericColumns[0];

    // Check if this is a monthly/period aggregation (prefer BAR chart)
    const colName = timeCol.name.toLowerCase();
    const isMonthlyOrPeriod =
      colName.includes('month') ||
      colName.includes('year') ||
      colName.includes('quarter') ||
      colName.includes('week') ||
      (sqlPatterns.hasGroupBy && sqlPatterns.hasAggregate && rows.length <= 24);

    if (isMonthlyOrPeriod && sqlPatterns.hasGroupBy && sqlPatterns.hasAggregate) {
      return {
        type: 'bar',
        confidence: 0.92,
        xColumn: timeCol.name,
        yColumns: numericColumns.map(c => c.name),
        reasoning: `Monthly/period aggregation detected: ${timeCol.name} grouped by period with ${numericColumns.map(c => c.name).join(', ')}. Bar chart best for comparing period totals.`,
        chartConfig: {
          showLegend: numericColumns.length > 1,
          isHorizontal: false
        }
      };
    }

    // Regular time series - use line/area for trends
    return {
      type: rows.length > 20 ? 'line' : 'area',
      confidence: sqlPatterns.hasTimeFunction ? 0.95 : 0.85,
      xColumn: timeCol.name,
      yColumns: numericColumns.map(c => c.name),
      reasoning: `Time series detected: ${timeCol.name} (temporal) vs ${numericColumns.map(c => c.name).join(', ')} (numeric). ${rows.length > 20 ? 'Line' : 'Area'} chart shows trends over time.`,
      chartConfig: {
        showLegend: numericColumns.length > 1
      }
    };
  }

  // Rule 3: Top N / Rankings (GROUP BY + aggregate + LIMIT + ORDER BY)
  if (sqlPatterns.hasGroupBy && sqlPatterns.hasAggregate &&
      sqlPatterns.hasLimit && sqlPatterns.hasOrderBy) {

    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const catCol = categoricalColumns[0];
      const numCol = numericColumns[0];

      // Use pie chart for small number of categories (< 7)
      if (rows.length <= 6 && numericColumns.length === 1) {
        return {
          type: 'pie',
          confidence: 0.9,
          xColumn: catCol.name,
          yColumns: [numCol.name],
          reasoning: `Top ${rows.length} by ${numCol.name}. Pie chart shows proportional breakdown.`,
          chartConfig: {
            showLegend: true
          }
        };
      }

      // Bar chart for rankings
      return {
        type: 'bar',
        confidence: 0.95,
        xColumn: catCol.name,
        yColumns: numericColumns.map(c => c.name),
        reasoning: `Top ${sqlPatterns.limitValue || rows.length} ranking by ${numCol.name}. Bar chart emphasizes comparison.`,
        chartConfig: {
          isHorizontal: rows.length > 10, // Horizontal bars for many items
          showLegend: numericColumns.length > 1
        }
      };
    }
  }

  // Rule 4: Aggregation / Distribution (GROUP BY + aggregate)
  if (sqlPatterns.hasGroupBy && sqlPatterns.hasAggregate) {
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const catCol = categoricalColumns[0];

      // Pie chart for simple proportional breakdown
      if (rows.length <= 8 && numericColumns.length === 1) {
        return {
          type: 'pie',
          confidence: 0.85,
          xColumn: catCol.name,
          yColumns: numericColumns.map(c => c.name),
          reasoning: `Distribution by ${catCol.name}. Pie chart shows proportions of ${numericColumns[0].name}.`,
          chartConfig: {
            showLegend: true
          }
        };
      }

      // Bar chart for category comparison
      return {
        type: 'bar',
        confidence: 0.9,
        xColumn: catCol.name,
        yColumns: numericColumns.map(c => c.name),
        reasoning: `Grouped aggregation by ${catCol.name}. Bar chart compares ${numericColumns.map(c => c.name).join(', ')} across categories.`,
        chartConfig: {
          isStacked: numericColumns.length > 1,
          showLegend: numericColumns.length > 1
        }
      };
    }
  }

  // Rule 5: Simple comparison (categorical + numeric, no GROUP BY)
  if (categoricalColumns.length > 0 && numericColumns.length > 0 && rows.length <= 50) {
    const catCol = categoricalColumns[0];

    return {
      type: 'bar',
      confidence: 0.75,
      xColumn: catCol.name,
      yColumns: numericColumns.map(c => c.name),
      reasoning: `Comparison across ${catCol.name}. Bar chart visualizes ${numericColumns.map(c => c.name).join(', ')}.`,
      chartConfig: {
        isHorizontal: rows.length > 15,
        showLegend: numericColumns.length > 1
      }
    };
  }

  // Rule 6: Multiple numeric columns (correlation/comparison)
  if (numericColumns.length >= 2 && rows.length <= 50) {
    // First column as x-axis, rest as y-values
    return {
      type: 'line',
      confidence: 0.7,
      xColumn: columns[0],
      yColumns: numericColumns.slice(1).map(c => c.name),
      reasoning: `Multiple numeric values. Line chart shows relationships between ${numericColumns.slice(1).map(c => c.name).join(', ')}.`,
      chartConfig: {
        showLegend: true
      }
    };
  }

  // Default: Fall back to table for unclear cases
  return {
    type: 'table',
    confidence: 0.6,
    xColumn: columns[0],
    yColumns: columns.slice(1),
    reasoning: `No clear visualization pattern detected. Table view preserves all data detail.`
  };
}

/**
 * Get a confidence threshold for auto-visualization
 * Only show charts if confidence is above this threshold
 */
export const AUTO_VISUALIZATION_THRESHOLD = 0.75;

/**
 * Check if visualization should be shown automatically
 */
export function shouldAutoVisualize(suggestion: VisualizationSuggestion | null): boolean {
  if (!suggestion || suggestion.type === 'table') {
    return false;
  }
  return suggestion.confidence >= AUTO_VISUALIZATION_THRESHOLD;
}
