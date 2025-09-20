/**
 * DataHubRulesEngine
 * 
 * A simple rules engine that applies DataHub-powered business rules
 * to SQL queries. Focuses on immediate value through SQL transformation
 * rather than complex execution frameworks.
 */

import { DataHubContext, BusinessRule } from './DataHubContextService';

export interface RuleApplicationResult {
  originalSql: string;
  transformedSql: string;
  appliedRules: AppliedRule[];
  warnings: RuleWarning[];
  preview: boolean;
}

export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  type: 'pii_masking' | 'quality_filter' | 'business_calculation' | 'custom';
  transformation: string;
  impact: 'select' | 'where' | 'join' | 'aggregate';
}

export interface RuleWarning {
  ruleId: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion?: string;
}

export class DataHubRulesEngine {
  /**
   * Apply business rules to a SQL query
   */
  async applyRules(
    sql: string,
    rules: BusinessRule[],
    context: DataHubContext
  ): Promise<RuleApplicationResult> {
    let transformedSql = sql;
    const appliedRules: AppliedRule[] = [];
    const warnings: RuleWarning[] = [];
    
    // Sort rules by type to apply in correct order
    const sortedRules = this.sortRulesByPriority(rules);
    
    for (const rule of sortedRules) {
      switch (rule.type) {
        case 'privacy':
          transformedSql = this.applyPIIRule(transformedSql, rule, context, appliedRules, warnings);
          break;
        case 'quality':
          transformedSql = this.applyQualityRule(transformedSql, rule, context, appliedRules, warnings);
          break;
        case 'business':
          transformedSql = this.applyBusinessRule(transformedSql, rule, context, appliedRules, warnings);
          break;
        case 'custom':
          transformedSql = this.applyCustomRule(transformedSql, rule, context, appliedRules, warnings);
          break;
      }
    }
    
    // Add warning if PII fields detected but no masking applied
    if (context.piiFields.length > 0 && !rules.some(r => r.type === 'privacy')) {
      warnings.push({
        ruleId: 'auto-pii-warning',
        severity: 'high',
        message: `Query includes ${context.piiFields.length} PII fields without masking`,
        suggestion: 'Consider applying PII protection rules'
      });
    }
    
    // Add warning if quality score is low
    if (context.qualityScore < 60 && !rules.some(r => r.type === 'quality')) {
      warnings.push({
        ruleId: 'auto-quality-warning',
        severity: 'medium',
        message: `Data quality score is ${context.qualityScore}%, consider applying quality filters`,
        suggestion: 'Add quality rules to improve data reliability'
      });
    }
    
    return {
      originalSql: sql,
      transformedSql: this.formatSQL(transformedSql),
      appliedRules,
      warnings,
      preview: true // Always preview mode for PoC
    };
  }
  
  /**
   * Sort rules by application priority
   */
  private sortRulesByPriority(rules: BusinessRule[]): BusinessRule[] {
    const priorityMap = {
      'quality': 1,    // Apply filters first
      'privacy': 2,    // Then mask PII
      'business': 3,   // Then business calculations
      'custom': 4      // Finally custom rules
    };
    
    return [...rules].sort((a, b) => {
      const aPriority = priorityMap[a.type] || 99;
      const bPriority = priorityMap[b.type] || 99;
      return aPriority - bPriority;
    });
  }
  
  /**
   * Apply PII masking rules
   */
  private applyPIIRule(
    sql: string,
    rule: BusinessRule,
    context: DataHubContext,
    appliedRules: AppliedRule[],
    warnings: RuleWarning[]
  ): string {
    // Simple implementation: wrap PII fields with masking functions
    let transformedSql = sql;
    
    for (const field of context.piiFields) {
      // Create masking expression based on field type
      const maskExpression = this.getMaskingExpression(field);
      
      // Replace field references in SELECT clause
      const selectPattern = new RegExp(`\\b${field}\\b(?=.*FROM)`, 'gi');
      transformedSql = transformedSql.replace(selectPattern, maskExpression);
    }
    
    appliedRules.push({
      ruleId: rule.id,
      ruleName: rule.name,
      type: 'pii_masking',
      transformation: `Masked ${context.piiFields.length} PII fields`,
      impact: 'select'
    });
    
    return transformedSql;
  }
  
  /**
   * Apply quality filter rules
   */
  private applyQualityRule(
    sql: string,
    rule: BusinessRule,
    context: DataHubContext,
    appliedRules: AppliedRule[],
    warnings: RuleWarning[]
  ): string {
    // Add quality filters to WHERE clause
    const whereClause = rule.sqlTemplate || this.generateQualityFilter(context);
    
    // Simple WHERE clause injection (production would need proper SQL parsing)
    let transformedSql = sql;
    
    if (sql.toLowerCase().includes('where')) {
      // Add to existing WHERE clause
      transformedSql = sql.replace(/where/i, `WHERE ${whereClause} AND`);
    } else if (sql.toLowerCase().includes('from')) {
      // Add new WHERE clause
      const fromIndex = sql.toLowerCase().lastIndexOf('from');
      const afterFrom = sql.substring(fromIndex).match(/from\s+(\S+)/i);
      if (afterFrom) {
        const insertPoint = fromIndex + afterFrom[0].length;
        transformedSql = sql.slice(0, insertPoint) + `\nWHERE ${whereClause}` + sql.slice(insertPoint);
      }
    }
    
    appliedRules.push({
      ruleId: rule.id,
      ruleName: rule.name,
      type: 'quality_filter',
      transformation: whereClause,
      impact: 'where'
    });
    
    return transformedSql;
  }
  
  /**
   * Apply business calculation rules
   */
  private applyBusinessRule(
    sql: string,
    rule: BusinessRule,
    context: DataHubContext,
    appliedRules: AppliedRule[],
    warnings: RuleWarning[]
  ): string {
    if (!rule.sqlTemplate) {
      warnings.push({
        ruleId: rule.id,
        severity: 'low',
        message: `Business rule "${rule.name}" has no SQL template`,
        suggestion: 'Define calculation in DataHub glossary'
      });
      return sql;
    }
    
    // Add business calculation as new column in SELECT
    let transformedSql = sql;
    const calculation = `${rule.sqlTemplate} AS ${rule.name.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Simple SELECT clause injection
    const selectMatch = sql.match(/select\s+(.*?)\s+from/is);
    if (selectMatch) {
      const newSelect = `SELECT ${selectMatch[1]},\n  ${calculation}`;
      transformedSql = sql.replace(/select\s+.*?\s+from/is, `${newSelect} FROM`);
    }
    
    appliedRules.push({
      ruleId: rule.id,
      ruleName: rule.name,
      type: 'business_calculation',
      transformation: calculation,
      impact: 'select'
    });
    
    return transformedSql;
  }
  
  /**
   * Apply custom rules
   */
  private applyCustomRule(
    sql: string,
    rule: BusinessRule,
    context: DataHubContext,
    appliedRules: AppliedRule[],
    warnings: RuleWarning[]
  ): string {
    if (!rule.sqlTemplate) {
      warnings.push({
        ruleId: rule.id,
        severity: 'low',
        message: `Custom rule "${rule.name}" has no SQL template`
      });
      return sql;
    }
    
    // For custom rules, just append as comment for now
    // In production, would parse and apply based on rule parameters
    const transformedSql = sql + `\n-- Custom Rule: ${rule.name}\n-- ${rule.sqlTemplate}`;
    
    appliedRules.push({
      ruleId: rule.id,
      ruleName: rule.name,
      type: 'custom',
      transformation: rule.sqlTemplate,
      impact: 'select'
    });
    
    return transformedSql;
  }
  
  /**
   * Generate masking expression for a field
   */
  private getMaskingExpression(field: string): string {
    // Intelligent masking based on field name
    const fieldLower = field.toLowerCase();
    
    if (fieldLower.includes('email')) {
      return `CONCAT(LEFT(${field}, 2), '***@***.com') AS ${field}`;
    } else if (fieldLower.includes('phone')) {
      return `CONCAT('***-***-', RIGHT(${field}, 4)) AS ${field}`;
    } else if (fieldLower.includes('ssn') || fieldLower.includes('social')) {
      return `CONCAT('***-**-', RIGHT(${field}, 4)) AS ${field}`;
    } else if (fieldLower.includes('card') || fieldLower.includes('credit')) {
      return `CONCAT('****-****-****-', RIGHT(${field}, 4)) AS ${field}`;
    } else if (fieldLower.includes('name')) {
      return `CONCAT(LEFT(${field}, 1), '***') AS ${field}`;
    }
    
    // Default masking
    return `'***MASKED***' AS ${field}`;
  }
  
  /**
   * Generate quality filter based on context
   */
  private generateQualityFilter(context: DataHubContext): string {
    const filters: string[] = [];
    
    // Add null checks for critical fields
    if (context.nullCount && context.nullCount > 0.1) {
      filters.push('customer_id IS NOT NULL');
    }
    
    // Add duplicate removal
    if (context.duplicateCount && context.duplicateCount > 0) {
      filters.push('ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY updated_at DESC) = 1');
    }
    
    // Add freshness check
    filters.push("updated_at >= DATEADD(DAY, -30, CURRENT_DATE)");
    
    return filters.join(' AND ');
  }
  
  /**
   * Format SQL for readability
   */
  private formatSQL(sql: string): string {
    // Simple formatting - in production would use proper SQL formatter
    return sql
      .replace(/select/gi, 'SELECT')
      .replace(/from/gi, '\nFROM')
      .replace(/where/gi, '\nWHERE')
      .replace(/and/gi, '\n  AND')
      .replace(/or/gi, '\n  OR')
      .replace(/group by/gi, '\nGROUP BY')
      .replace(/order by/gi, '\nORDER BY')
      .replace(/limit/gi, '\nLIMIT');
  }
  
  /**
   * Validate rules before application
   */
  async validateRules(rules: BusinessRule[]): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const rule of rules) {
      // Check for rule conflicts
      if (rule.type === 'privacy' && rules.some(r => r.type === 'custom' && r.id.includes('unmask'))) {
        errors.push(`Conflict: Cannot apply unmasking with PII protection enabled`);
      }
      
      // Check for missing templates
      if ((rule.type === 'business' || rule.type === 'custom') && !rule.sqlTemplate) {
        warnings.push(`Rule "${rule.name}" is missing SQL template`);
      }
      
      // Check confidence levels
      if (rule.confidence && rule.confidence < 0.5) {
        warnings.push(`Rule "${rule.name}" has low confidence (${Math.round(rule.confidence * 100)}%)`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get rule recommendations based on query and context
   */
  async getRecommendations(
    sql: string,
    context: DataHubContext
  ): Promise<BusinessRule[]> {
    const recommendations: BusinessRule[] = [];
    
    // Recommend PII masking if PII fields detected
    if (context.piiFields.length > 0) {
      recommendations.push({
        id: 'rec-pii-masking',
        name: 'Apply PII Masking',
        type: 'privacy',
        description: `Mask ${context.piiFields.length} PII fields for privacy compliance`,
        source: 'DataHub Classification',
        confidence: 0.95
      });
    }
    
    // Recommend quality filters if score is low
    if (context.qualityScore < 70) {
      recommendations.push({
        id: 'rec-quality-filter',
        name: 'Apply Quality Filters',
        type: 'quality',
        description: `Filter to improve quality from ${context.qualityScore}% to 85%+`,
        source: 'DataHub Quality Profile',
        confidence: 0.8
      });
    }
    
    // Recommend business calculations from glossary
    if (sql.toLowerCase().includes('customer') && context.glossaryTerms.length > 0) {
      const relevantTerms = context.glossaryTerms.filter(t => 
        t.name.toLowerCase().includes('customer') || 
        t.name.toLowerCase().includes('lifetime') ||
        t.name.toLowerCase().includes('churn')
      );
      
      relevantTerms.forEach(term => {
        if (term.calculation) {
          recommendations.push({
            id: `rec-calc-${term.name}`,
            name: term.name,
            type: 'business',
            description: term.description || `Add ${term.name} calculation`,
            source: 'DataHub Business Glossary',
            sqlTemplate: term.calculation,
            confidence: 0.85
          });
        }
      });
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const rulesEngine = new DataHubRulesEngine();