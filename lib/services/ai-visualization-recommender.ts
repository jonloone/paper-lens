/**
 * AI-Powered Visualization Recommender
 * Uses LLM to understand context and recommend optimal visualizations
 */

import { VultrLLMService } from './vultr-llm.service';

export interface VisualizationRecommendation {
  type: ChartType;
  confidence: number;
  reasoning: string;
  xColumn: string;
  yColumns: string[];
  chartConfig?: ChartConfig;
  alternatives?: AlternativeVisualization[];
  insights?: string[];
}

export interface AlternativeVisualization {
  type: ChartType;
  confidence: number;
  reasoning: string;
  useCase: string;
}

export interface ChartConfig {
  isHorizontal?: boolean;
  isStacked?: boolean;
  showLegend?: boolean;
  colorScheme?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  groupBy?: string;
  sortBy?: 'value' | 'label' | 'none';
  sortOrder?: 'asc' | 'desc';
  showTrendline?: boolean;
  showAnomalies?: boolean;
  showGrid?: boolean;
  interactive?: boolean;
}

export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'scatter'
  | 'heatmap'
  | 'treemap'
  | 'timeseries'
  | 'sankey'
  | 'radial'
  | 'table'
  | 'metric';

interface ColumnMetadata {
  name: string;
  type: 'numeric' | 'categorical' | 'temporal' | 'text';
  uniqueCount: number;
  sampleValues: any[];
  hasNulls: boolean;
  distribution?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
  };
}

interface DataCharacteristics {
  rowCount: number;
  columnCount: number;
  columns: ColumnMetadata[];
  hasTemporal: boolean;
  hasNumeric: boolean;
  hasCategorical: boolean;
  isGrouped: boolean;
  isAggregated: boolean;
  isTimeSeries: boolean;
  cardinalityRatio: number;
}

export class AIVisualizationRecommender {
  private llmService: VultrLLMService;
  private userPreferences: Map<string, number> = new Map();

  constructor() {
    this.llmService = new VultrLLMService();
  }

  /**
   * Main recommendation method that combines AI analysis with rule-based logic
   */
  async recommendVisualization(
    columns: string[],
    rows: any[][],
    userQuery?: string,
    sqlQuery?: string,
    context?: {
      domain?: string;
      previousCharts?: string[];
      userRole?: string;
    }
  ): Promise<VisualizationRecommendation> {
    // Step 1: Analyze data characteristics
    const dataCharacteristics = this.analyzeDataCharacteristics(columns, rows);

    // Step 2: Get AI recommendation
    const aiRecommendation = await this.getAIRecommendation(
      dataCharacteristics,
      userQuery,
      sqlQuery,
      context
    );

    // Step 3: Validate and enhance with rule-based logic
    const validatedRecommendation = this.validateAndEnhance(
      aiRecommendation,
      dataCharacteristics
    );

    // Step 4: Add alternative visualizations
    const withAlternatives = await this.addAlternatives(
      validatedRecommendation,
      dataCharacteristics
    );

    // Step 5: Apply user preferences
    const finalRecommendation = this.applyUserPreferences(withAlternatives);

    return finalRecommendation;
  }

  /**
   * Analyze data characteristics to inform recommendation
   */
  private analyzeDataCharacteristics(
    columns: string[],
    rows: any[][]
  ): DataCharacteristics {
    const columnMetadata: ColumnMetadata[] = columns.map((col, idx) => {
      const values = rows.map((row) => row[idx]).filter((v) => v !== null);
      const uniqueValues = new Set(values);

      return {
        name: col,
        type: this.detectColumnType(values),
        uniqueCount: uniqueValues.size,
        sampleValues: values.slice(0, 5),
        hasNulls: values.length < rows.length,
        distribution: this.calculateDistribution(values),
      };
    });

    const numericCols = columnMetadata.filter((c) => c.type === 'numeric');
    const temporalCols = columnMetadata.filter((c) => c.type === 'temporal');
    const categoricalCols = columnMetadata.filter(
      (c) => c.type === 'categorical'
    );

    return {
      rowCount: rows.length,
      columnCount: columns.length,
      columns: columnMetadata,
      hasTemporal: temporalCols.length > 0,
      hasNumeric: numericCols.length > 0,
      hasCategorical: categoricalCols.length > 0,
      isGrouped: this.detectGrouping(rows),
      isAggregated: this.detectAggregation(columns),
      isTimeSeries:
        temporalCols.length > 0 && numericCols.length > 0 && rows.length > 5,
      cardinalityRatio:
        categoricalCols.length > 0
          ? categoricalCols[0].uniqueCount / rows.length
          : 1,
    };
  }

  /**
   * Detect column type from sample values
   */
  private detectColumnType(values: any[]): ColumnMetadata['type'] {
    if (values.length === 0) return 'text';

    // Check if numeric
    const numericCount = values.filter(
      (v) => typeof v === 'number' || !isNaN(Number(v))
    ).length;
    if (numericCount / values.length > 0.8) return 'numeric';

    // Check if temporal
    const temporalPatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
    ];

    const temporalCount = values.filter((v) => {
      const str = String(v);
      return (
        temporalPatterns.some((p) => p.test(str)) ||
        !isNaN(Date.parse(str)) ||
        v instanceof Date
      );
    }).length;

    if (temporalCount / values.length > 0.8) return 'temporal';

    // Check if categorical (limited unique values)
    const uniqueRatio = new Set(values).size / values.length;
    if (uniqueRatio < 0.5) return 'categorical';

    return 'text';
  }

  /**
   * Calculate distribution statistics for numeric columns
   */
  private calculateDistribution(values: any[]): ColumnMetadata['distribution'] {
    const numericValues = values
      .map((v) => Number(v))
      .filter((v) => !isNaN(v));

    if (numericValues.length === 0) return undefined;

    const sorted = numericValues.sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)],
    };
  }

  /**
   * Detect if data appears to be grouped
   */
  private detectGrouping(rows: any[][]): boolean {
    if (rows.length < 2) return false;

    // Check if first column has repeated values (common in grouped data)
    const firstColumnValues = rows.map((r) => r[0]);
    const uniqueCount = new Set(firstColumnValues).size;

    return uniqueCount < rows.length * 0.8;
  }

  /**
   * Detect if query contains aggregation
   */
  private detectAggregation(columns: string[]): boolean {
    const aggregationKeywords = ['count', 'sum', 'avg', 'max', 'min', 'total'];
    return columns.some((col) =>
      aggregationKeywords.some((keyword) =>
        col.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Get AI-powered recommendation using LLM
   */
  private async getAIRecommendation(
    characteristics: DataCharacteristics,
    userQuery?: string,
    sqlQuery?: string,
    context?: any
  ): Promise<VisualizationRecommendation> {
    const prompt = this.buildRecommendationPrompt(
      characteristics,
      userQuery,
      sqlQuery,
      context
    );

    try {
      const response = await this.llmService.chat(prompt, {
        temperature: 0.3, // Lower temperature for more consistent recommendations
        maxTokens: 1000,
      });

      return this.parseAIResponse(response, characteristics);
    } catch (error) {
      console.error('AI recommendation failed, falling back to rules:', error);
      return this.getRuleBasedRecommendation(characteristics);
    }
  }

  /**
   * Build prompt for LLM recommendation
   */
  private buildRecommendationPrompt(
    characteristics: DataCharacteristics,
    userQuery?: string,
    sqlQuery?: string,
    context?: any
  ): string {
    return `You are a data visualization expert. Based on the following information, recommend the best chart type for visualizing this data.

DATA CHARACTERISTICS:
- Row count: ${characteristics.rowCount}
- Column count: ${characteristics.columnCount}
- Columns:
${characteristics.columns
  .map(
    (col) =>
      `  - ${col.name} (${col.type}, ${col.uniqueCount} unique values, ${col.hasNulls ? 'has nulls' : 'no nulls'})`
  )
  .join('\n')}

- Has temporal data: ${characteristics.hasTemporal}
- Has numeric data: ${characteristics.hasNumeric}
- Has categorical data: ${characteristics.hasCategorical}
- Is time series: ${characteristics.isTimeSeries}
- Is grouped/aggregated: ${characteristics.isGrouped || characteristics.isAggregated}

${userQuery ? `USER QUESTION: ${userQuery}` : ''}
${sqlQuery ? `SQL QUERY: ${sqlQuery}` : ''}
${context?.domain ? `DOMAIN CONTEXT: ${context.domain}` : ''}
${context?.userRole ? `USER ROLE: ${context.userRole}` : ''}

AVAILABLE CHART TYPES:
1. bar - For comparing categories or showing rankings
2. line - For trends over time or continuous data
3. area - For cumulative trends or filled areas
4. pie - For part-to-whole relationships (max 8 slices)
5. scatter - For correlations between two numeric variables
6. heatmap - For patterns in 2D categorical or temporal data
7. treemap - For hierarchical data with proportions
8. timeseries - For advanced time series with anomaly detection
9. sankey - For flow between categories
10. table - For detailed data inspection (fallback)
11. metric - For single key performance indicators

RECOMMENDATION RULES:
- If >100 rows or >10 columns, prefer table
- **IMPORTANT**: If monthly/quarterly/yearly aggregations (e.g., "total by month"), ALWAYS prefer bar chart for clear comparison
- If time series with many data points (>24 rows), prefer line or area for trends
- If comparing categories with numeric values, prefer bar
- If showing proportions of a whole (≤8 categories), prefer pie
- If showing correlation between 2 numeric columns, prefer scatter
- If showing patterns over time and categories, prefer heatmap
- If showing hierarchical proportions, prefer treemap
- If showing single KPI, prefer metric card
- Bar charts are better for period comparisons (months, quarters), line charts for continuous trends

Respond ONLY with valid JSON in this format:
{
  "type": "bar|line|area|pie|scatter|heatmap|treemap|timeseries|sankey|table|metric",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this chart is best",
  "xColumn": "column name for x-axis",
  "yColumns": ["column name(s) for y-axis"],
  "chartConfig": {
    "isHorizontal": true/false,
    "isStacked": true/false,
    "showLegend": true/false,
    "colorScheme": "default|primary|secondary|success|warning|danger",
    "sortBy": "value|label|none",
    "sortOrder": "asc|desc"
  },
  "insights": ["insight 1", "insight 2"]
}`;
  }

  /**
   * Parse AI response into recommendation
   */
  private parseAIResponse(
    response: string,
    characteristics: DataCharacteristics
  ): VisualizationRecommendation {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                       response.match(/```\n([\s\S]*?)\n```/) ||
                       [null, response];

      const jsonStr = jsonMatch[1] || response;
      const parsed = JSON.parse(jsonStr.trim());

      return {
        type: parsed.type || 'table',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || 'AI recommended visualization',
        xColumn: parsed.xColumn || characteristics.columns[0]?.name || '',
        yColumns: parsed.yColumns || [characteristics.columns[1]?.name || ''],
        chartConfig: parsed.chartConfig || {},
        insights: parsed.insights || [],
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getRuleBasedRecommendation(characteristics);
    }
  }

  /**
   * Fallback rule-based recommendation
   */
  private getRuleBasedRecommendation(
    characteristics: DataCharacteristics
  ): VisualizationRecommendation {
    // Large dataset - use table
    if (
      characteristics.rowCount > 100 ||
      characteristics.columnCount > 10
    ) {
      return {
        type: 'table',
        confidence: 0.95,
        reasoning: 'Dataset too large for meaningful visualization',
        xColumn: characteristics.columns[0].name,
        yColumns: characteristics.columns.slice(1).map((c) => c.name),
      };
    }

    // Time-based aggregations (monthly/period totals) - PRIORITIZE BAR CHARTS
    if (characteristics.isTimeSeries && characteristics.isAggregated) {
      const temporalCol = characteristics.columns.find(
        (c) => c.type === 'temporal'
      );
      const numericCols = characteristics.columns.filter(
        (c) => c.type === 'numeric'
      );

      // Check if temporal column has month/period aggregation patterns
      const colName = temporalCol?.name.toLowerCase() || '';
      const isMonthlyOrPeriod =
        colName.includes('month') ||
        colName.includes('year') ||
        colName.includes('quarter') ||
        colName.includes('week') ||
        characteristics.rowCount <= 24; // Likely monthly/period data

      if (isMonthlyOrPeriod) {
        return {
          type: 'bar',
          confidence: 0.92,
          reasoning: 'Monthly/period aggregations are best compared with bar charts for clear value comparison',
          xColumn: temporalCol!.name,
          yColumns: numericCols.map((c) => c.name),
          chartConfig: {
            showGrid: true,
            interactive: true,
            sortBy: 'label',
            sortOrder: 'asc',
          },
        };
      }
    }

    // Time series (continuous trends)
    if (characteristics.isTimeSeries) {
      const temporalCol = characteristics.columns.find(
        (c) => c.type === 'temporal'
      );
      const numericCols = characteristics.columns.filter(
        (c) => c.type === 'numeric'
      );

      return {
        type: characteristics.rowCount > 20 ? 'line' : 'area',
        confidence: 0.85,
        reasoning: 'Time series data best shown with line/area chart',
        xColumn: temporalCol!.name,
        yColumns: numericCols.map((c) => c.name),
        chartConfig: {
          showGrid: true,
          interactive: true,
        },
      };
    }

    // Categorical comparison
    if (characteristics.hasCategorical && characteristics.hasNumeric) {
      const categoricalCol = characteristics.columns.find(
        (c) => c.type === 'categorical'
      );
      const numericCols = characteristics.columns.filter(
        (c) => c.type === 'numeric'
      );

      // Pie for small number of categories
      if (categoricalCol!.uniqueCount <= 8 && numericCols.length === 1) {
        return {
          type: 'pie',
          confidence: 0.80,
          reasoning: 'Small number of categories, showing proportions',
          xColumn: categoricalCol!.name,
          yColumns: [numericCols[0].name],
          chartConfig: {
            showLegend: true,
          },
        };
      }

      // Bar for comparisons
      return {
        type: 'bar',
        confidence: 0.85,
        reasoning: 'Comparing categories with numeric values',
        xColumn: categoricalCol!.name,
        yColumns: numericCols.map((c) => c.name),
        chartConfig: {
          isHorizontal: characteristics.rowCount > 10,
          isStacked: numericCols.length > 1,
        },
      };
    }

    // Default to table
    return {
      type: 'table',
      confidence: 0.60,
      reasoning: 'No clear visualization pattern detected',
      xColumn: characteristics.columns[0].name,
      yColumns: characteristics.columns.slice(1).map((c) => c.name),
    };
  }

  /**
   * Validate and enhance AI recommendation
   */
  private validateAndEnhance(
    recommendation: VisualizationRecommendation,
    characteristics: DataCharacteristics
  ): VisualizationRecommendation {
    // Ensure columns exist
    const validXColumn = characteristics.columns.find(
      (c) => c.name === recommendation.xColumn
    );
    if (!validXColumn) {
      recommendation.xColumn = characteristics.columns[0].name;
    }

    // Ensure y columns exist
    recommendation.yColumns = recommendation.yColumns.filter((col) =>
      characteristics.columns.some((c) => c.name === col)
    );

    if (recommendation.yColumns.length === 0) {
      const numericCols = characteristics.columns.filter(
        (c) => c.type === 'numeric'
      );
      recommendation.yColumns =
        numericCols.length > 0
          ? [numericCols[0].name]
          : [characteristics.columns[1]?.name || characteristics.columns[0].name];
    }

    // Apply constraints based on chart type
    if (recommendation.type === 'pie' && characteristics.rowCount > 12) {
      recommendation.type = 'bar';
      recommendation.reasoning +=
        ' (Changed from pie to bar due to too many categories)';
    }

    return recommendation;
  }

  /**
   * Add alternative visualization options
   */
  private async addAlternatives(
    primary: VisualizationRecommendation,
    characteristics: DataCharacteristics
  ): Promise<VisualizationRecommendation> {
    const alternatives: AlternativeVisualization[] = [];

    // Always offer table as alternative
    if (primary.type !== 'table') {
      alternatives.push({
        type: 'table',
        confidence: 0.90,
        reasoning: 'View raw data for detailed inspection',
        useCase: 'Detailed data inspection',
      });
    }

    // Time series alternatives
    if (characteristics.isTimeSeries) {
      if (primary.type !== 'line') {
        alternatives.push({
          type: 'line',
          confidence: 0.75,
          reasoning: 'Emphasize trend over time',
          useCase: 'Trend analysis',
        });
      }
      if (primary.type !== 'area') {
        alternatives.push({
          type: 'area',
          confidence: 0.70,
          reasoning: 'Show cumulative effect',
          useCase: 'Cumulative visualization',
        });
      }
    }

    // Categorical alternatives
    if (characteristics.hasCategorical && characteristics.hasNumeric) {
      if (primary.type !== 'bar') {
        alternatives.push({
          type: 'bar',
          confidence: 0.75,
          reasoning: 'Compare values across categories',
          useCase: 'Category comparison',
        });
      }

      const categoricalCol = characteristics.columns.find(
        (c) => c.type === 'categorical'
      );
      if (
        primary.type !== 'pie' &&
        categoricalCol &&
        categoricalCol.uniqueCount <= 8
      ) {
        alternatives.push({
          type: 'pie',
          confidence: 0.65,
          reasoning: 'Show proportions of the whole',
          useCase: 'Part-to-whole relationship',
        });
      }
    }

    // Numeric correlation alternatives
    const numericCols = characteristics.columns.filter(
      (c) => c.type === 'numeric'
    );
    if (numericCols.length >= 2 && characteristics.rowCount < 100) {
      if (primary.type !== 'scatter') {
        alternatives.push({
          type: 'scatter',
          confidence: 0.60,
          reasoning: 'Explore correlation between variables',
          useCase: 'Correlation analysis',
        });
      }
    }

    primary.alternatives = alternatives.slice(0, 3); // Limit to top 3 alternatives
    return primary;
  }

  /**
   * Apply user preferences to boost confidence of preferred chart types
   */
  private applyUserPreferences(
    recommendation: VisualizationRecommendation
  ): VisualizationRecommendation {
    const prefBoost = this.userPreferences.get(recommendation.type) || 0;
    recommendation.confidence = Math.min(
      1.0,
      recommendation.confidence + prefBoost * 0.1
    );

    return recommendation;
  }

  /**
   * Learn from user's chart selection
   */
  recordUserPreference(chartType: ChartType, wasAccepted: boolean): void {
    const current = this.userPreferences.get(chartType) || 0;
    this.userPreferences.set(chartType, current + (wasAccepted ? 1 : -0.5));
  }

  /**
   * Get recommended chart types for specific analytical goals
   */
  getChartsForAnalyticalGoal(goal: string): ChartType[] {
    const goalToCharts: Record<string, ChartType[]> = {
      comparison: ['bar', 'line', 'scatter'],
      trend: ['line', 'area', 'timeseries'],
      distribution: ['bar', 'pie', 'treemap'],
      correlation: ['scatter', 'heatmap'],
      composition: ['pie', 'treemap', 'sankey'],
      relationship: ['scatter', 'sankey'],
      geographic: ['heatmap'], // Could add map later
      hierarchy: ['treemap'],
      flow: ['sankey'],
      kpi: ['metric'],
    };

    return goalToCharts[goal.toLowerCase()] || ['table'];
  }
}

// Singleton instance
export const aiVisualizationRecommender = new AIVisualizationRecommender();
