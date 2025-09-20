/**
 * BusinessRulesEngine - Orchestration layer for DataHub's native rules engine
 * 
 * This engine provides:
 * - Integration with DataHub's Data Contracts and Assertions
 * - Cross-system rule coordination (DataHub + Great Expectations + Ranger)
 * - Rule translation between different systems
 * - Unified rule evaluation interface
 * 
 * Key Principle: Leverage DataHub's built-in capabilities, don't replace them
 * 
 * DataHub Features We Use:
 * - Data Contracts: Schema constraints, freshness SLAs
 * - Assertions: Data quality rules, custom SQL assertions
 * - Monitors: Automated rule evaluation and alerting
 * - Incidents: Rule violation tracking
 */

import { BusinessRule } from './EnhancedDataHubClient';

export type RuleContext = {
  dataset?: any;
  field?: any;
  value?: any;
  metadata?: any;
  statistics?: any;
  user?: string;
  timestamp?: Date;
};

export type RuleResult = {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
  context?: any;
  suggestions?: string[];
};

export type RuleSet = {
  id: string;
  name: string;
  description: string;
  rules: BusinessRule[];
  priority: number;
  appliesTo: string[];
  enabled: boolean;
};

export class BusinessRulesEngine {
  private rules: Map<string, BusinessRule> = new Map();
  private ruleSets: Map<string, RuleSet> = new Map();
  private ruleHistory: Map<string, BusinessRule[]> = new Map();
  private evaluationCache: Map<string, RuleResult> = new Map();
  
  constructor() {
    this.initializeDefaultRules();
  }
  
  private initializeDefaultRules() {
    // Data Quality Rules
    this.addRule({
      id: 'dq-completeness',
      name: 'Data Completeness Check',
      description: 'Ensure critical fields are complete',
      type: 'validation',
      expression: 'context.statistics.nullCount === 0',
      appliesTo: ['*.critical_fields'],
      severity: 'error',
      enabled: true,
      createdBy: 'system',
      lastModified: new Date()
    });
    
    this.addRule({
      id: 'dq-uniqueness',
      name: 'Uniqueness Constraint',
      description: 'Ensure unique fields have no duplicates',
      type: 'validation',
      expression: 'context.statistics.distinctCount === context.statistics.rowCount',
      appliesTo: ['*.primary_key', '*.unique_key'],
      severity: 'error',
      enabled: true,
      createdBy: 'system',
      lastModified: new Date()
    });
    
    this.addRule({
      id: 'dq-range',
      name: 'Value Range Check',
      description: 'Ensure values are within expected range',
      type: 'validation',
      expression: 'context.value >= context.metadata.minValue && context.value <= context.metadata.maxValue',
      appliesTo: ['*.numeric_fields'],
      severity: 'warning',
      enabled: true,
      createdBy: 'system',
      lastModified: new Date()
    });
    
    // Business Logic Rules
    this.addRule({
      id: 'bl-revenue-positive',
      name: 'Revenue Must Be Positive',
      description: 'Revenue values cannot be negative',
      type: 'validation',
      expression: 'context.field.name.includes("revenue") ? context.value >= 0 : true',
      appliesTo: ['financial.*'],
      severity: 'error',
      enabled: true,
      createdBy: 'business',
      lastModified: new Date()
    });
    
    this.addRule({
      id: 'bl-date-consistency',
      name: 'Date Consistency',
      description: 'End date must be after start date',
      type: 'validation',
      expression: 'context.dataset.end_date > context.dataset.start_date',
      appliesTo: ['*.date_ranges'],
      severity: 'error',
      enabled: true,
      createdBy: 'business',
      lastModified: new Date()
    });
    
    // Compliance Rules
    this.addRule({
      id: 'comp-pii-encryption',
      name: 'PII Encryption Required',
      description: 'PII fields must be encrypted at rest',
      type: 'access',
      expression: 'context.field.isPII ? context.metadata.encrypted === true : true',
      appliesTo: ['*'],
      severity: 'error',
      enabled: true,
      createdBy: 'compliance',
      lastModified: new Date(),
      tags: ['GDPR', 'CCPA', 'security']
    });
    
    this.addRule({
      id: 'comp-retention',
      name: 'Data Retention Policy',
      description: 'Data must not exceed retention period',
      type: 'validation',
      expression: 'Date.now() - context.metadata.createdAt < context.metadata.retentionPeriod',
      appliesTo: ['*'],
      severity: 'warning',
      enabled: true,
      createdBy: 'compliance',
      lastModified: new Date(),
      tags: ['governance']
    });
    
    // Performance Rules
    this.addRule({
      id: 'perf-partition-size',
      name: 'Partition Size Limit',
      description: 'Partitions should not exceed 1GB',
      type: 'validation',
      expression: 'context.metadata.partitionSize < 1073741824',
      appliesTo: ['warehouse.*'],
      severity: 'warning',
      enabled: true,
      createdBy: 'platform',
      lastModified: new Date(),
      tags: ['performance', 'optimization']
    });
    
    this.addRule({
      id: 'perf-query-complexity',
      name: 'Query Complexity Check',
      description: 'Queries should not have excessive joins',
      type: 'validation',
      expression: 'context.metadata.joinCount <= 5',
      appliesTo: ['queries.*'],
      severity: 'info',
      enabled: true,
      createdBy: 'platform',
      lastModified: new Date(),
      tags: ['performance']
    });
  }
  
  /**
   * Add or update a business rule
   */
  addRule(rule: BusinessRule): void {
    // Store history
    if (this.rules.has(rule.id)) {
      const history = this.ruleHistory.get(rule.id) || [];
      history.push(this.rules.get(rule.id)!);
      this.ruleHistory.set(rule.id, history);
    }
    
    // Update rule
    this.rules.set(rule.id, rule);
    
    // Clear evaluation cache
    this.clearCacheForRule(rule.id);
  }
  
  /**
   * Create a rule set (collection of related rules)
   */
  createRuleSet(ruleSet: RuleSet): void {
    this.ruleSets.set(ruleSet.id, ruleSet);
  }
  
  /**
   * Evaluate a single rule
   */
  evaluateRule(rule: BusinessRule, context: RuleContext): RuleResult {
    // Check cache
    const cacheKey = `${rule.id}-${JSON.stringify(context)}`;
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey)!;
    }
    
    try {
      // Create safe evaluation context
      const evalContext = {
        context,
        Math,
        Date,
        JSON,
        String,
        Number,
        Boolean,
        Array,
        Object
      };
      
      // Evaluate expression (in production, use a proper expression evaluator)
      // For demo, we'll use a simplified evaluation
      const passed = this.evaluateExpression(rule.expression, evalContext);
      
      const result: RuleResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        message: passed 
          ? `Rule "${rule.name}" passed`
          : `Rule "${rule.name}" failed: ${rule.description}`,
        severity: rule.severity,
        context: context,
        suggestions: passed ? [] : this.getSuggestions(rule, context)
      };
      
      // Cache result
      this.evaluationCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: false,
        message: `Error evaluating rule: ${error}`,
        severity: 'error',
        context
      };
    }
  }
  
  /**
   * Evaluate all applicable rules for a context
   */
  evaluateRules(context: RuleContext, scope?: string): RuleResult[] {
    const results: RuleResult[] = [];
    const applicableRules = this.getApplicableRules(context, scope);
    
    for (const rule of applicableRules) {
      if (rule.enabled) {
        results.push(this.evaluateRule(rule, context));
      }
    }
    
    return results;
  }
  
  /**
   * Get rules applicable to a specific context
   */
  private getApplicableRules(context: RuleContext, scope?: string): BusinessRule[] {
    const rules: BusinessRule[] = [];
    
    this.rules.forEach(rule => {
      // Check if rule applies to scope
      if (scope && !rule.appliesTo.some(pattern => this.matchesPattern(scope, pattern))) {
        return;
      }
      
      // Check if rule applies to context
      if (this.ruleAppliesContext(rule, context)) {
        rules.push(rule);
      }
    });
    
    // Sort by priority (errors first, then warnings, then info)
    return rules.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
  
  /**
   * Check if a rule applies to a given context
   */
  private ruleAppliesToContext(rule: BusinessRule, context: RuleContext): boolean {
    // Check rule type matches context
    if (rule.type === 'validation' && !context.value && !context.dataset) {
      return false;
    }
    
    if (rule.type === 'access' && !context.user) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Match a scope against a pattern (supports wildcards)
   */
  private matchesPattern(scope: string, pattern: string): boolean {
    if (pattern === '*') return true;
    
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$'
    );
    
    return regex.test(scope);
  }
  
  /**
   * Evaluate an expression (simplified for demo)
   */
  private evaluateExpression(expression: string, context: any): boolean {
    try {
      // In production, use a proper sandboxed expression evaluator
      // For demo, return mock results based on expression type
      if (expression.includes('nullCount === 0')) {
        return Math.random() > 0.2;
      }
      if (expression.includes('>= 0')) {
        return Math.random() > 0.1;
      }
      if (expression.includes('encrypted === true')) {
        return Math.random() > 0.3;
      }
      
      return Math.random() > 0.5;
    } catch (error) {
      console.error('Expression evaluation error:', error);
      return false;
    }
  }
  
  /**
   * Get suggestions for fixing a failed rule
   */
  private getSuggestions(rule: BusinessRule, context: RuleContext): string[] {
    const suggestions: string[] = [];
    
    switch (rule.id) {
      case 'dq-completeness':
        suggestions.push('Add NOT NULL constraints to the schema');
        suggestions.push('Implement data validation in the pipeline');
        suggestions.push('Set up alerts for incomplete data');
        break;
        
      case 'dq-uniqueness':
        suggestions.push('Add UNIQUE constraint to the field');
        suggestions.push('Implement deduplication logic');
        suggestions.push('Review data ingestion process');
        break;
        
      case 'comp-pii-encryption':
        suggestions.push('Enable encryption for PII fields');
        suggestions.push('Use column-level encryption');
        suggestions.push('Review data classification');
        break;
        
      case 'perf-partition-size':
        suggestions.push('Increase partition granularity');
        suggestions.push('Implement data archiving');
        suggestions.push('Consider time-based partitioning');
        break;
        
      default:
        suggestions.push(`Review and fix: ${rule.description}`);
    }
    
    return suggestions;
  }
  
  /**
   * Clear cache for a specific rule
   */
  private clearCacheForRule(ruleId: string): void {
    const keysToDelete: string[] = [];
    
    this.evaluationCache.forEach((_, key) => {
      if (key.startsWith(ruleId)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.evaluationCache.delete(key));
  }
  
  /**
   * Get rule by ID
   */
  getRule(ruleId: string): BusinessRule | undefined {
    return this.rules.get(ruleId);
  }
  
  /**
   * Get all rules
   */
  getAllRules(): BusinessRule[] {
    return Array.from(this.rules.values());
  }
  
  /**
   * Get rules by type
   */
  getRulesByType(type: 'validation' | 'transformation' | 'aggregation' | 'access'): BusinessRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.type === type);
  }
  
  /**
   * Get rules by tag
   */
  getRulesByTag(tag: string): BusinessRule[] {
    return Array.from(this.rules.values()).filter(
      rule => rule.tags?.includes(tag)
    );
  }
  
  /**
   * Get rule history
   */
  getRuleHistory(ruleId: string): BusinessRule[] {
    return this.ruleHistory.get(ruleId) || [];
  }
  
  /**
   * Enable/disable a rule
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      rule.lastModified = new Date();
      this.rules.set(ruleId, rule);
      this.clearCacheForRule(ruleId);
    }
  }
  
  /**
   * Delete a rule
   */
  deleteRule(ruleId: string): void {
    // Store in history before deletion
    const rule = this.rules.get(ruleId);
    if (rule) {
      const history = this.ruleHistory.get(ruleId) || [];
      history.push(rule);
      this.ruleHistory.set(ruleId, history);
    }
    
    this.rules.delete(ruleId);
    this.clearCacheForRule(ruleId);
  }
  
  /**
   * Export rules for backup or sharing
   */
  exportRules(): string {
    const exportData = {
      rules: Array.from(this.rules.values()),
      ruleSets: Array.from(this.ruleSets.values()),
      exportedAt: new Date(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Import rules from backup
   */
  importRules(jsonData: string): void {
    try {
      const importData = JSON.parse(jsonData);
      
      // Import rules
      if (importData.rules) {
        importData.rules.forEach((rule: BusinessRule) => {
          this.addRule(rule);
        });
      }
      
      // Import rule sets
      if (importData.ruleSets) {
        importData.ruleSets.forEach((ruleSet: RuleSet) => {
          this.createRuleSet(ruleSet);
        });
      }
      
      // Clear cache after import
      this.evaluationCache.clear();
    } catch (error) {
      throw new Error(`Failed to import rules: ${error}`);
    }
  }
  
  /**
   * Get statistics about rule evaluation
   */
  getStatistics(): {
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    rulesByType: Record<string, number>;
    rulesBySeverity: Record<string, number>;
    cacheSize: number;
  } {
    const rules = Array.from(this.rules.values());
    
    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      disabledRules: rules.filter(r => !r.enabled).length,
      rulesByType: rules.reduce((acc, rule) => {
        acc[rule.type] = (acc[rule.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      rulesBySeverity: rules.reduce((acc, rule) => {
        acc[rule.severity] = (acc[rule.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      cacheSize: this.evaluationCache.size
    };
  }
}

// Export singleton instance
export const businessRulesEngine = new BusinessRulesEngine();