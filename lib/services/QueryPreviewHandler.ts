/**
 * Enterprise-grade query preview and sampling system
 * Handles large-scale data processing with intelligent sampling
 */

export interface QueryPreviewConfig {
  maxPreviewRows: number;
  samplingMethod: 'first' | 'random' | 'stratified' | 'systematic';
  enableProfiling: boolean;
  enableCostEstimation: boolean;
  enableEntityExtraction: boolean;
  enablePIIDetection: boolean;
  rulesEngineEnabled: boolean;
}

export interface QueryStatistics {
  totalRows: number;
  sampledRows: number;
  estimatedSizeBytes: number;
  estimatedCostUSD: number;
  executionTimeMs: number;
  dataSources: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface DataProfile {
  columns: Array<{
    name: string;
    type: string;
    nullCount: number;
    uniqueCount: number;
    min?: any;
    max?: any;
    mean?: number;
    stdDev?: number;
    topValues?: Array<{ value: any; count: number }>;
    dataQuality: {
      completeness: number;
      validity: number;
      consistency: number;
    };
    detectedEntities?: string[];
    hasPII?: boolean;
  }>;
  anomalies: Array<{
    column: string;
    type: 'outlier' | 'missing' | 'invalid' | 'duplicate';
    severity: 'low' | 'medium' | 'high';
    affectedRows: number;
  }>;
}

export interface QueryPreviewResult {
  preview: {
    data: any[];
    schema: any;
    isSampled: boolean;
    samplingRate?: number;
  };
  statistics: QueryStatistics;
  profile?: DataProfile;
  recommendations: Array<{
    type: 'performance' | 'quality' | 'cost' | 'governance';
    message: string;
    action?: string;
  }>;
  fullDataLocation?: string;
  canProceedToFull: boolean;
}

export class QueryPreviewHandler {
  private config: QueryPreviewConfig;

  constructor(config?: Partial<QueryPreviewConfig>) {
    this.config = {
      maxPreviewRows: 1000,
      samplingMethod: 'stratified',
      enableProfiling: true,
      enableCostEstimation: true,
      enableEntityExtraction: true,
      enablePIIDetection: true,
      rulesEngineEnabled: true,
      ...config
    };
  }

  /**
   * Process query with intelligent preview and sampling
   */
  async processQueryWithPreview(
    query: string,
    context: {
      dataSource: string;
      userId: string;
      workspaceId: string;
    }
  ): Promise<QueryPreviewResult> {
    // Step 1: Analyze query complexity and estimate cost
    const queryAnalysis = await this.analyzeQuery(query);
    
    // Step 2: Apply rules engine pre-processing
    const processedQuery = this.config.rulesEngineEnabled 
      ? await this.applyRulesEngine(query, context)
      : query;
    
    // Step 3: Execute with sampling
    const sampledResult = await this.executeSampledQuery(
      processedQuery,
      queryAnalysis
    );
    
    // Step 4: Profile the sampled data
    const profile = this.config.enableProfiling
      ? await this.profileData(sampledResult.data, sampledResult.schema)
      : undefined;
    
    // Step 5: Extract entities if enabled
    if (this.config.enableEntityExtraction && profile) {
      await this.extractEntities(profile);
    }
    
    // Step 6: Detect PII if enabled
    if (this.config.enablePIIDetection && profile) {
      await this.detectPII(profile);
    }
    
    // Step 7: Generate recommendations
    const recommendations = this.generateRecommendations(
      queryAnalysis,
      profile,
      sampledResult
    );
    
    return {
      preview: {
        data: sampledResult.data,
        schema: sampledResult.schema,
        isSampled: sampledResult.totalRows > this.config.maxPreviewRows,
        samplingRate: sampledResult.samplingRate
      },
      statistics: {
        totalRows: sampledResult.totalRows,
        sampledRows: sampledResult.data.length,
        estimatedSizeBytes: queryAnalysis.estimatedSize,
        estimatedCostUSD: queryAnalysis.estimatedCost,
        executionTimeMs: sampledResult.executionTime,
        dataSources: queryAnalysis.dataSources,
        complexity: queryAnalysis.complexity
      },
      profile,
      recommendations,
      fullDataLocation: sampledResult.fullDataLocation,
      canProceedToFull: this.validateForFullExecution(queryAnalysis, profile)
    };
  }

  /**
   * Analyze query for complexity and cost estimation
   */
  private async analyzeQuery(query: string): Promise<any> {
    // Parse query to understand structure
    const tables = this.extractTableNames(query);
    const hasJoins = /JOIN/i.test(query);
    const hasAggregations = /GROUP BY|SUM|COUNT|AVG|MAX|MIN/i.test(query);
    const hasSubqueries = /SELECT.*FROM.*\(.*SELECT/i.test(query);
    
    // Estimate complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (hasSubqueries || (hasJoins && hasAggregations)) {
      complexity = 'complex';
    } else if (hasJoins || hasAggregations) {
      complexity = 'moderate';
    }
    
    // Estimate cost (simplified calculation)
    const estimatedRows = await this.estimateRowCount(tables);
    const estimatedSize = estimatedRows * 1024; // Rough estimate
    const estimatedCost = this.calculateQueryCost(estimatedSize, complexity);
    
    return {
      tables,
      dataSources: tables,
      complexity,
      estimatedSize,
      estimatedCost,
      estimatedRows,
      hasJoins,
      hasAggregations,
      hasSubqueries
    };
  }

  /**
   * Apply rules engine to query
   */
  private async applyRulesEngine(
    query: string,
    context: any
  ): Promise<string> {
    // Apply data governance rules
    let modifiedQuery = query;
    
    // Add row-level security filters
    const securityFilters = await this.getSecurityFilters(context.userId);
    if (securityFilters) {
      modifiedQuery = this.addWhereClause(modifiedQuery, securityFilters);
    }
    
    // Add data quality filters
    const qualityFilters = await this.getQualityFilters();
    if (qualityFilters) {
      modifiedQuery = this.addWhereClause(modifiedQuery, qualityFilters);
    }
    
    return modifiedQuery;
  }

  /**
   * Execute query with sampling
   */
  private async executeSampledQuery(
    query: string,
    analysis: any
  ): Promise<any> {
    let sampledQuery = query;
    let samplingRate = 1.0;
    
    // Apply sampling if data is large
    if (analysis.estimatedRows > this.config.maxPreviewRows) {
      samplingRate = this.config.maxPreviewRows / analysis.estimatedRows;
      
      switch (this.config.samplingMethod) {
        case 'random':
          sampledQuery = this.applyRandomSampling(query, samplingRate);
          break;
        case 'stratified':
          sampledQuery = await this.applyStratifiedSampling(query, samplingRate);
          break;
        case 'systematic':
          sampledQuery = this.applySystematicSampling(query, samplingRate);
          break;
        default:
          sampledQuery = this.applyFirstNRows(query, this.config.maxPreviewRows);
      }
    }
    
    // Execute the sampled query (mock implementation)
    const startTime = Date.now();
    const result = await this.executeQuery(sampledQuery);
    const executionTime = Date.now() - startTime;
    
    return {
      data: result.rows,
      schema: result.schema,
      totalRows: analysis.estimatedRows,
      samplingRate,
      executionTime,
      fullDataLocation: analysis.estimatedRows > this.config.maxPreviewRows 
        ? `s3://data-lake/temp/${Date.now()}/full-results` 
        : undefined
    };
  }

  /**
   * Profile sampled data for quality and statistics
   */
  private async profileData(data: any[], schema: any): Promise<DataProfile> {
    const columns = schema.columns.map((col: any) => {
      const columnData = data.map(row => row[col.name]);
      const nullCount = columnData.filter(v => v === null || v === undefined).length;
      const uniqueValues = new Set(columnData.filter(v => v !== null));
      
      // Calculate statistics based on type
      let stats: any = {};
      if (col.type === 'number' || col.type === 'integer' || col.type === 'float') {
        const numbers = columnData.filter(v => v !== null).map(Number);
        stats = {
          min: Math.min(...numbers),
          max: Math.max(...numbers),
          mean: numbers.reduce((a, b) => a + b, 0) / numbers.length,
          stdDev: this.calculateStdDev(numbers)
        };
      }
      
      // Get top values
      const valueCounts = this.getValueCounts(columnData);
      const topValues = Object.entries(valueCounts)
        .sort((a, b) => b[1] as number - (a[1] as number))
        .slice(0, 5)
        .map(([value, count]) => ({ value, count: count as number }));
      
      return {
        name: col.name,
        type: col.type,
        nullCount,
        uniqueCount: uniqueValues.size,
        ...stats,
        topValues,
        dataQuality: {
          completeness: 1 - (nullCount / data.length),
          validity: this.calculateValidity(columnData, col.type),
          consistency: this.calculateConsistency(columnData)
        }
      };
    });
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(data, schema);
    
    return { columns, anomalies };
  }

  /**
   * Extract entities from profiled data
   */
  private async extractEntities(profile: DataProfile): Promise<void> {
    for (const column of profile.columns) {
      const entities: string[] = [];
      
      // Detect common entity types based on column name and data patterns
      if (/email/i.test(column.name)) entities.push('Email');
      if (/phone|tel|mobile/i.test(column.name)) entities.push('Phone');
      if (/address|street|city|zip/i.test(column.name)) entities.push('Address');
      if (/name|first|last/i.test(column.name)) entities.push('Person');
      if (/company|org|business/i.test(column.name)) entities.push('Organization');
      if (/product|item|sku/i.test(column.name)) entities.push('Product');
      if (/date|time|timestamp/i.test(column.name)) entities.push('DateTime');
      if (/amount|price|cost|revenue/i.test(column.name)) entities.push('Money');
      
      column.detectedEntities = entities;
    }
  }

  /**
   * Detect PII in profiled data
   */
  private async detectPII(profile: DataProfile): Promise<void> {
    const piiPatterns = {
      ssn: /\d{3}-\d{2}-\d{4}/,
      creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      phone: /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/
    };
    
    for (const column of profile.columns) {
      // Check column name for PII indicators
      const nameIndicators = /ssn|social|credit|card|email|phone|mobile|passport|license|birth/i;
      if (nameIndicators.test(column.name)) {
        column.hasPII = true;
        continue;
      }
      
      // Check data patterns (would check actual data in production)
      if (column.topValues) {
        for (const { value } of column.topValues) {
          if (value && typeof value === 'string') {
            for (const pattern of Object.values(piiPatterns)) {
              if (pattern.test(value)) {
                column.hasPII = true;
                break;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    analysis: any,
    profile?: DataProfile,
    sampledResult?: any
  ): any[] {
    const recommendations = [];
    
    // Performance recommendations
    if (analysis.complexity === 'complex') {
      recommendations.push({
        type: 'performance',
        message: 'Complex query detected. Consider creating a materialized view for better performance.',
        action: 'optimize'
      });
    }
    
    // Cost recommendations
    if (analysis.estimatedCost > 10) {
      recommendations.push({
        type: 'cost',
        message: `Estimated query cost: $${analysis.estimatedCost.toFixed(2)}. Consider adding filters to reduce data scanned.`,
        action: 'reduce-scope'
      });
    }
    
    // Quality recommendations
    if (profile) {
      const lowQualityColumns = profile.columns.filter(
        col => col.dataQuality.completeness < 0.8
      );
      if (lowQualityColumns.length > 0) {
        recommendations.push({
          type: 'quality',
          message: `${lowQualityColumns.length} columns have low completeness. Consider data cleaning.`,
          action: 'clean-data'
        });
      }
      
      // PII recommendations
      const piiColumns = profile.columns.filter(col => col.hasPII);
      if (piiColumns.length > 0) {
        recommendations.push({
          type: 'governance',
          message: `PII detected in ${piiColumns.length} columns. Ensure compliance with data privacy regulations.`,
          action: 'apply-masking'
        });
      }
    }
    
    return recommendations;
  }

  // Helper methods
  private extractTableNames(query: string): string[] {
    const matches = query.match(/FROM\s+([\w\.]+)/gi) || [];
    return matches.map(m => m.replace(/FROM\s+/i, ''));
  }

  private async estimateRowCount(tables: string[]): Promise<number> {
    // Mock implementation - would query table statistics in production
    return tables.length * 100000;
  }

  private calculateQueryCost(sizeBytes: number, complexity: string): number {
    const baseRate = 0.00001; // $0.01 per MB
    const complexityMultiplier = 
      complexity === 'complex' ? 3 : 
      complexity === 'moderate' ? 1.5 : 1;
    return (sizeBytes / 1024 / 1024) * baseRate * complexityMultiplier;
  }

  private async getSecurityFilters(userId: string): Promise<string> {
    // Mock implementation - would fetch from security service
    return '';
  }

  private async getQualityFilters(): Promise<string> {
    // Mock implementation - would fetch from quality rules service
    return '';
  }

  private addWhereClause(query: string, clause: string): string {
    if (!clause) return query;
    
    const whereIndex = query.toUpperCase().indexOf('WHERE');
    if (whereIndex > -1) {
      return query.slice(0, whereIndex + 5) + 
             ` (${clause}) AND ` + 
             query.slice(whereIndex + 5);
    } else {
      const fromIndex = query.toUpperCase().indexOf('FROM');
      const nextClause = query.slice(fromIndex).match(/(GROUP BY|ORDER BY|LIMIT)/i);
      if (nextClause) {
        const insertPoint = fromIndex + nextClause.index!;
        return query.slice(0, insertPoint) + 
               ` WHERE ${clause} ` + 
               query.slice(insertPoint);
      }
      return query + ` WHERE ${clause}`;
    }
  }

  private applyRandomSampling(query: string, rate: number): string {
    return `${query} TABLESAMPLE BERNOULLI (${rate * 100})`;
  }

  private async applyStratifiedSampling(query: string, rate: number): Promise<string> {
    // Simplified stratified sampling
    return `${query} TABLESAMPLE SYSTEM (${rate * 100})`;
  }

  private applySystematicSampling(query: string, rate: number): string {
    const nth = Math.floor(1 / rate);
    return `SELECT * FROM (${query}) WHERE MOD(ROW_NUMBER() OVER (), ${nth}) = 0`;
  }

  private applyFirstNRows(query: string, n: number): string {
    return `${query} LIMIT ${n}`;
  }

  private async executeQuery(query: string): Promise<any> {
    // Mock implementation - would execute against actual database
    return {
      rows: Array(100).fill(null).map((_, i) => ({
        id: i + 1,
        customer_name: `Customer ${i + 1}`,
        revenue: Math.random() * 10000,
        churn_risk: Math.random(),
        last_order_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      })),
      schema: {
        columns: [
          { name: 'id', type: 'integer' },
          { name: 'customer_name', type: 'string' },
          { name: 'revenue', type: 'float' },
          { name: 'churn_risk', type: 'float' },
          { name: 'last_order_date', type: 'date' }
        ]
      }
    };
  }

  private calculateStdDev(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length);
  }

  private getValueCounts(data: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    data.forEach(value => {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  private calculateValidity(data: any[], type: string): number {
    // Simplified validity calculation
    return 0.95;
  }

  private calculateConsistency(data: any[]): number {
    // Simplified consistency calculation
    return 0.92;
  }

  private detectAnomalies(data: any[], schema: any): any[] {
    // Simplified anomaly detection
    return [];
  }

  private validateForFullExecution(analysis: any, profile?: DataProfile): boolean {
    // Check if it's safe to run full query
    if (analysis.estimatedCost > 100) return false;
    if (profile?.columns.some(col => col.hasPII && !col.detectedEntities?.includes('masked'))) return false;
    return true;
  }
}