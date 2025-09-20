/**
 * PipelineProcessingService
 * 
 * Process query pipelines without making assumptions.
 * Builds SQL transformations as explicit pipeline stages.
 */

import type { QueryPipeline, PipelineStage, Rule } from '@/components/query/QueryPipelineBuilder';

export interface ProcessingResult {
  success: boolean;
  finalSQL: string;
  stageResults: StageResult[];
  errors: string[];
  warnings: string[];
  metadata: {
    estimatedRows?: number;
    estimatedCost?: number;
    processingTime?: number;
  };
}

export interface StageResult {
  stageId: string;
  stageName: string;
  sql: string;
  impact?: {
    rowsBefore?: number;
    rowsAfter?: number;
    fieldsAdded?: string[];
    fieldsRemoved?: string[];
  };
}

export class PipelineProcessingService {
  /**
   * Build final SQL from base query and pipeline stages
   */
  async buildPipelineSQL(pipeline: QueryPipeline): Promise<ProcessingResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const stageResults: StageResult[] = [];
    
    try {
      // Validate base query
      if (!pipeline.baseQuery) {
        errors.push('Base query is required');
        return {
          success: false,
          finalSQL: '',
          stageResults: [],
          errors,
          warnings,
          metadata: {}
        };
      }
      
      // If no stages, return base query
      if (!pipeline.stages || pipeline.stages.length === 0) {
        return {
          success: true,
          finalSQL: pipeline.baseQuery,
          stageResults: [],
          errors,
          warnings,
          metadata: {
            estimatedRows: 1000 // Mock estimate
          }
        };
      }
      
      // Build CTE chain
      const cteParts: string[] = [];
      let previousCte = 'base_data';
      
      // Start with base query
      cteParts.push(`${previousCte} AS (\n  ${this.indentSQL(pipeline.baseQuery)}\n)`);
      
      // Apply each active stage
      const activeStages = pipeline.stages.filter(s => s.isActive);
      
      for (let i = 0; i < activeStages.length; i++) {
        const stage = activeStages[i];
        const stageCte = `stage_${i}_${stage.type}`;
        
        try {
          const stageSql = this.applyStage(previousCte, stage);
          cteParts.push(`${stageCte} AS (\n  ${this.indentSQL(stageSql)}\n)`);
          
          stageResults.push({
            stageId: stage.id,
            stageName: stage.name,
            sql: stageSql,
            impact: this.calculateStageImpact(stage)
          });
          
          previousCte = stageCte;
        } catch (error) {
          errors.push(`Failed to apply stage "${stage.name}": ${error.message}`);
        }
      }
      
      // Build final query
      const finalSQL = cteParts.length > 1
        ? `WITH ${cteParts.join(',\n')}\nSELECT * FROM ${previousCte}`
        : pipeline.baseQuery;
      
      return {
        success: errors.length === 0,
        finalSQL,
        stageResults,
        errors,
        warnings,
        metadata: {
          estimatedRows: this.estimateRows(pipeline),
          estimatedCost: this.estimateCost(pipeline),
          processingTime: Date.now()
        }
      };
    } catch (error) {
      errors.push(`Pipeline processing failed: ${error.message}`);
      return {
        success: false,
        finalSQL: '',
        stageResults,
        errors,
        warnings,
        metadata: {}
      };
    }
  }
  
  /**
   * Apply a single stage transformation
   */
  private applyStage(fromCte: string, stage: PipelineStage): string {
    const rules = stage.rules.filter(r => r.sql);
    
    if (rules.length === 0) {
      return `SELECT * FROM ${fromCte}`;
    }
    
    switch (stage.type) {
      case 'filter':
        return this.applyFilters(fromCte, rules);
      case 'transform':
        return this.applyTransformations(fromCte, rules);
      case 'enrich':
        return this.applyEnrichments(fromCte, rules);
      case 'aggregate':
        return this.applyAggregations(fromCte, rules);
      case 'privacy':
        return this.applyPrivacyRules(fromCte, rules);
      default:
        return `SELECT * FROM ${fromCte}`;
    }
  }
  
  /**
   * Add WHERE clauses
   */
  private applyFilters(fromCte: string, rules: Rule[]): string {
    const conditions = rules.map(r => r.sql).filter(Boolean);
    
    if (conditions.length === 0) {
      return `SELECT * FROM ${fromCte}`;
    }
    
    return `SELECT * FROM ${fromCte}\nWHERE ${conditions.join('\n  AND ')}`;
  }
  
  /**
   * Add calculated fields or modify existing ones
   */
  private applyTransformations(fromCte: string, rules: Rule[]): string {
    const transformations: string[] = [];
    
    for (const rule of rules) {
      if (rule.type === 'calculated_field' && rule.alias) {
        transformations.push(`${rule.sql} AS ${rule.alias}`);
      } else if (rule.type === 'replace_field') {
        transformations.push(rule.sql);
      } else if (rule.alias) {
        transformations.push(`${rule.sql} AS ${rule.alias}`);
      } else {
        transformations.push(rule.sql);
      }
    }
    
    if (transformations.length === 0) {
      return `SELECT * FROM ${fromCte}`;
    }
    
    return `SELECT *,\n       ${transformations.join(',\n       ')}\nFROM ${fromCte}`;
  }
  
  /**
   * Add business logic calculations
   */
  private applyEnrichments(fromCte: string, rules: Rule[]): string {
    const calculations = rules.map(r => {
      if (r.alias) {
        return `${r.sql} AS ${r.alias}`;
      }
      return r.sql;
    }).filter(Boolean);
    
    if (calculations.length === 0) {
      return `SELECT * FROM ${fromCte}`;
    }
    
    return `SELECT *,\n       ${calculations.join(',\n       ')}\nFROM ${fromCte}`;
  }
  
  /**
   * Apply aggregations
   */
  private applyAggregations(fromCte: string, rules: Rule[]): string {
    const aggregates = rules.map(r => r.sql).filter(Boolean);
    
    if (aggregates.length === 0) {
      return `SELECT * FROM ${fromCte}`;
    }
    
    // Check if there's a GROUP BY rule
    const groupByRule = rules.find(r => r.sql.toLowerCase().includes('group by'));
    const groupByClause = groupByRule ? groupByRule.sql : '';
    
    // Filter out the GROUP BY from aggregates
    const selectAggregates = aggregates.filter(a => !a.toLowerCase().includes('group by'));
    
    return `SELECT ${selectAggregates.join(',\n       ')}\nFROM ${fromCte}${groupByClause ? '\n' + groupByClause : ''}`;
  }
  
  /**
   * Apply masking or redaction
   */
  private applyPrivacyRules(fromCte: string, rules: Rule[]): string {
    const maskedFields: string[] = [];
    const fieldsToExclude: string[] = [];
    
    for (const rule of rules) {
      if (rule.field) {
        fieldsToExclude.push(rule.field);
        
        if (rule.allowed_roles && rule.allowed_roles.length > 0) {
          maskedFields.push(`
CASE 
  WHEN current_user() IN (${rule.allowed_roles.map(r => `'${r}'`).join(',')}) 
  THEN ${rule.field}
  ELSE '${rule.mask_value || '***'}'
END AS ${rule.field}`);
        } else {
          maskedFields.push(rule.sql);
        }
      } else if (rule.sql) {
        maskedFields.push(rule.sql);
      }
    }
    
    if (maskedFields.length === 0) {
      return `SELECT * FROM ${fromCte}`;
    }
    
    // Build EXCEPT clause if we have fields to exclude
    const exceptClause = fieldsToExclude.length > 0
      ? ` EXCEPT(${fieldsToExclude.join(', ')})`
      : '';
    
    return `SELECT *${exceptClause},\n       ${maskedFields.join(',\n       ')}\nFROM ${fromCte}`;
  }
  
  /**
   * Calculate impact metrics for a stage
   */
  private calculateStageImpact(stage: PipelineStage) {
    // Mock implementation - in production would analyze actual data
    const impact: any = {};
    
    if (stage.type === 'filter') {
      impact.rowsBefore = 10000;
      impact.rowsAfter = Math.floor(Math.random() * 8000) + 1000;
    }
    
    if (stage.type === 'transform' || stage.type === 'enrich') {
      impact.fieldsAdded = stage.rules
        .filter(r => r.alias)
        .map(r => r.alias!);
    }
    
    if (stage.type === 'privacy') {
      impact.fieldsRemoved = stage.rules
        .filter(r => r.field)
        .map(r => r.field!);
    }
    
    return impact;
  }
  
  /**
   * Estimate row count for pipeline
   */
  private estimateRows(pipeline: QueryPipeline): number {
    // Mock implementation
    let estimate = 10000; // Base estimate
    
    for (const stage of pipeline.stages) {
      if (stage.type === 'filter') {
        estimate = Math.floor(estimate * 0.7); // Filters reduce rows
      }
      if (stage.type === 'aggregate') {
        estimate = Math.floor(estimate * 0.1); // Aggregations reduce rows significantly
      }
    }
    
    return estimate;
  }
  
  /**
   * Estimate processing cost
   */
  private estimateCost(pipeline: QueryPipeline): number {
    // Mock implementation - could integrate with actual cost estimators
    const baseCost = 1;
    const stageCost = pipeline.stages.length * 0.5;
    return baseCost + stageCost;
  }
  
  /**
   * Indent SQL for readability
   */
  private indentSQL(sql: string, spaces = 2): string {
    const indent = ' '.repeat(spaces);
    return sql.split('\n').join('\n' + indent);
  }
  
  /**
   * Validate SQL syntax (basic validation)
   */
  async validateSQL(sql: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Basic validation rules
    if (!sql.toLowerCase().includes('select')) {
      errors.push('SQL must contain a SELECT statement');
    }
    
    if (!sql.toLowerCase().includes('from')) {
      errors.push('SQL must contain a FROM clause');
    }
    
    // Check for balanced parentheses
    const openParens = (sql.match(/\(/g) || []).length;
    const closeParens = (sql.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Unbalanced parentheses in SQL');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get available functions for SQL
   */
  getAvailableFunctions(): Record<string, string[]> {
    return {
      string: ['UPPER', 'LOWER', 'TRIM', 'CONCAT', 'SUBSTRING', 'LENGTH'],
      date: ['DATE_TRUNC', 'DATEADD', 'DATEDIFF', 'CURRENT_DATE', 'EXTRACT'],
      numeric: ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'ROUND', 'ABS'],
      window: ['ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE'],
      conditional: ['CASE', 'COALESCE', 'NULLIF', 'IFF']
    };
  }
}

// Export singleton instance
export const pipelineProcessor = new PipelineProcessingService();