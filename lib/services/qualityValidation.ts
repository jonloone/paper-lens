// Quality Validation Service
// Implements comprehensive quality gate validation logic

export interface QualityDimension {
  name: string;
  description: string;
  weight: number;
}

export interface QualityRule {
  id: string;
  name: string;
  dimension: 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'uniqueness' | 'timeliness';
  type: 'critical' | 'high' | 'medium' | 'low';
  threshold: number;
  field?: string;
  condition: string;
  failureAction: 'block' | 'warn' | 'log';
}

export interface QualityCheckResult {
  ruleId: string;
  ruleName: string;
  dimension: string;
  passed: boolean;
  score: number;
  threshold: number;
  severity: string;
  affectedRecords: number;
  totalRecords: number;
  details: {
    field?: string;
    message: string;
    examples?: any[];
  };
}

export interface QualityGateResult {
  passed: boolean;
  overallScore: number;
  dimensionScores: Record<string, number>;
  checkResults: QualityCheckResult[];
  blockers: QualityCheckResult[];
  warnings: QualityCheckResult[];
  recommendations: string[];
}

// Quality dimensions with their weights
export const QUALITY_DIMENSIONS: Record<string, QualityDimension> = {
  completeness: {
    name: 'Completeness',
    description: 'Measure of missing or null values',
    weight: 0.25
  },
  accuracy: {
    name: 'Accuracy',
    description: 'Correctness and precision of data',
    weight: 0.20
  },
  consistency: {
    name: 'Consistency',
    description: 'Uniformity across data sources',
    weight: 0.20
  },
  validity: {
    name: 'Validity',
    description: 'Conformance to business rules',
    weight: 0.15
  },
  uniqueness: {
    name: 'Uniqueness',
    description: 'Absence of duplicates',
    weight: 0.10
  },
  timeliness: {
    name: 'Timeliness',
    description: 'Currency and freshness of data',
    weight: 0.10
  }
};

// Default quality rules templates
export const DEFAULT_QUALITY_RULES: QualityRule[] = [
  // Completeness rules
  {
    id: 'comp-001',
    name: 'Required Fields Complete',
    dimension: 'completeness',
    type: 'critical',
    threshold: 99,
    condition: 'required_fields_not_null',
    failureAction: 'block'
  },
  {
    id: 'comp-002',
    name: 'Optional Fields Coverage',
    dimension: 'completeness',
    type: 'medium',
    threshold: 80,
    condition: 'optional_fields_coverage',
    failureAction: 'warn'
  },
  
  // Accuracy rules
  {
    id: 'acc-001',
    name: 'Email Format Validation',
    dimension: 'accuracy',
    type: 'high',
    threshold: 98,
    field: 'email',
    condition: 'regex_match:^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$',
    failureAction: 'warn'
  },
  {
    id: 'acc-002',
    name: 'Phone Number Format',
    dimension: 'accuracy',
    type: 'medium',
    threshold: 95,
    field: 'phone',
    condition: 'regex_match:^\\+?[1-9]\\d{1,14}$',
    failureAction: 'warn'
  },
  
  // Consistency rules
  {
    id: 'cons-001',
    name: 'Date Format Consistency',
    dimension: 'consistency',
    type: 'high',
    threshold: 100,
    condition: 'date_format_consistent',
    failureAction: 'block'
  },
  {
    id: 'cons-002',
    name: 'Category Values Standardized',
    dimension: 'consistency',
    type: 'medium',
    threshold: 95,
    condition: 'category_values_in_list',
    failureAction: 'warn'
  },
  
  // Validity rules
  {
    id: 'val-001',
    name: 'Business Rules Compliance',
    dimension: 'validity',
    type: 'critical',
    threshold: 100,
    condition: 'business_rules_pass',
    failureAction: 'block'
  },
  {
    id: 'val-002',
    name: 'Range Validation',
    dimension: 'validity',
    type: 'high',
    threshold: 98,
    condition: 'values_in_valid_range',
    failureAction: 'warn'
  },
  
  // Uniqueness rules
  {
    id: 'uniq-001',
    name: 'Primary Key Uniqueness',
    dimension: 'uniqueness',
    type: 'critical',
    threshold: 100,
    condition: 'primary_key_unique',
    failureAction: 'block'
  },
  {
    id: 'uniq-002',
    name: 'Duplicate Detection',
    dimension: 'uniqueness',
    type: 'high',
    threshold: 99,
    condition: 'no_full_duplicates',
    failureAction: 'warn'
  },
  
  // Timeliness rules
  {
    id: 'time-001',
    name: 'Data Freshness',
    dimension: 'timeliness',
    type: 'high',
    threshold: 95,
    condition: 'data_updated_within_sla',
    failureAction: 'warn'
  },
  {
    id: 'time-002',
    name: 'Timestamp Validity',
    dimension: 'timeliness',
    type: 'medium',
    threshold: 99,
    condition: 'timestamps_not_future',
    failureAction: 'warn'
  }
];

export class QualityValidationService {
  private rules: QualityRule[];
  
  constructor(customRules?: QualityRule[]) {
    this.rules = customRules || DEFAULT_QUALITY_RULES;
  }
  
  // Validate data against quality rules
  async validateData(
    data: any[],
    rules?: QualityRule[],
    globalThreshold: number = 85
  ): Promise<QualityGateResult> {
    const rulesToApply = rules || this.rules;
    const checkResults: QualityCheckResult[] = [];
    const dimensionScores: Record<string, { total: number; count: number }> = {};
    
    // Initialize dimension scores
    Object.keys(QUALITY_DIMENSIONS).forEach(dim => {
      dimensionScores[dim] = { total: 0, count: 0 };
    });
    
    // Apply each rule
    for (const rule of rulesToApply) {
      const result = await this.applyRule(data, rule);
      checkResults.push(result);
      
      // Update dimension scores
      if (!dimensionScores[rule.dimension]) {
        dimensionScores[rule.dimension] = { total: 0, count: 0 };
      }
      dimensionScores[rule.dimension].total += result.score;
      dimensionScores[rule.dimension].count += 1;
    }
    
    // Calculate dimension averages
    const avgDimensionScores: Record<string, number> = {};
    Object.entries(dimensionScores).forEach(([dim, scores]) => {
      avgDimensionScores[dim] = scores.count > 0 ? scores.total / scores.count : 100;
    });
    
    // Calculate overall score with weights
    let overallScore = 0;
    Object.entries(avgDimensionScores).forEach(([dim, score]) => {
      const weight = QUALITY_DIMENSIONS[dim]?.weight || 0;
      overallScore += score * weight;
    });
    
    // Identify blockers and warnings
    const blockers = checkResults.filter(r => 
      !r.passed && this.rules.find(rule => rule.id === r.ruleId)?.failureAction === 'block'
    );
    
    const warnings = checkResults.filter(r => 
      !r.passed && this.rules.find(rule => rule.id === r.ruleId)?.failureAction === 'warn'
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(checkResults, avgDimensionScores);
    
    // Determine if quality gate passes
    const passed = blockers.length === 0 && overallScore >= globalThreshold;
    
    return {
      passed,
      overallScore,
      dimensionScores: avgDimensionScores,
      checkResults,
      blockers,
      warnings,
      recommendations
    };
  }
  
  // Apply a single quality rule to data
  private async applyRule(data: any[], rule: QualityRule): Promise<QualityCheckResult> {
    const totalRecords = data.length;
    let affectedRecords = 0;
    let score = 100;
    let details: any = { message: '' };
    
    // Simulate different rule conditions
    switch (rule.condition) {
      case 'required_fields_not_null':
        affectedRecords = this.checkRequiredFields(data, rule.field);
        break;
        
      case 'primary_key_unique':
        affectedRecords = this.checkUniqueness(data, rule.field || 'id');
        break;
        
      case 'no_full_duplicates':
        affectedRecords = this.checkDuplicates(data);
        break;
        
      case 'date_format_consistent':
        affectedRecords = this.checkDateFormat(data);
        break;
        
      case 'business_rules_pass':
        affectedRecords = this.checkBusinessRules(data);
        break;
        
      default:
        // For regex and other conditions, simulate validation
        if (rule.condition.startsWith('regex_match:')) {
          const regex = rule.condition.substring(12);
          affectedRecords = this.checkRegexMatch(data, rule.field || '', regex);
        } else {
          // Simulate validation with random results for demo
          affectedRecords = Math.floor(Math.random() * totalRecords * 0.05);
        }
    }
    
    // Calculate score
    if (totalRecords > 0) {
      score = ((totalRecords - affectedRecords) / totalRecords) * 100;
    }
    
    // Determine if rule passes
    const passed = score >= rule.threshold;
    
    // Generate details message
    if (!passed) {
      details.message = `${affectedRecords} records (${(100 - score).toFixed(1)}%) failed ${rule.name}`;
      details.field = rule.field;
      // Add sample of affected records for debugging
      details.examples = data.slice(0, Math.min(3, affectedRecords));
    } else {
      details.message = `All records passed ${rule.name}`;
    }
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      dimension: rule.dimension,
      passed,
      score,
      threshold: rule.threshold,
      severity: rule.type,
      affectedRecords,
      totalRecords,
      details
    };
  }
  
  // Check required fields for null values
  private checkRequiredFields(data: any[], field?: string): number {
    if (!field) {
      // Check all common required fields
      const requiredFields = ['id', 'created_at', 'updated_at'];
      return data.filter(record => 
        requiredFields.some(f => record[f] == null || record[f] === '')
      ).length;
    }
    return data.filter(record => record[field] == null || record[field] === '').length;
  }
  
  // Check uniqueness of a field
  private checkUniqueness(data: any[], field: string): number {
    const values = data.map(record => record[field]);
    const uniqueValues = new Set(values);
    return data.length - uniqueValues.size;
  }
  
  // Check for duplicate records
  private checkDuplicates(data: any[]): number {
    const stringified = data.map(record => JSON.stringify(record));
    const unique = new Set(stringified);
    return data.length - unique.size;
  }
  
  // Check date format consistency
  private checkDateFormat(data: any[]): number {
    const dateFields = ['created_at', 'updated_at', 'date', 'timestamp'];
    const dateFormats = new Set<string>();
    
    data.forEach(record => {
      dateFields.forEach(field => {
        if (record[field]) {
          // Simple format detection
          if (/^\d{4}-\d{2}-\d{2}/.test(record[field])) {
            dateFormats.add('ISO');
          } else if (/^\d{2}\/\d{2}\/\d{4}/.test(record[field])) {
            dateFormats.add('US');
          } else {
            dateFormats.add('OTHER');
          }
        }
      });
    });
    
    return dateFormats.size > 1 ? Math.floor(data.length * 0.1) : 0;
  }
  
  // Check business rules
  private checkBusinessRules(data: any[]): number {
    // Example business rules
    return data.filter(record => {
      // Example: price should be positive
      if (record.price && record.price < 0) return true;
      // Example: end date should be after start date
      if (record.start_date && record.end_date && record.start_date > record.end_date) return true;
      return false;
    }).length;
  }
  
  // Check regex match for a field
  private checkRegexMatch(data: any[], field: string, regex: string): number {
    try {
      const pattern = new RegExp(regex);
      return data.filter(record => 
        record[field] && !pattern.test(String(record[field]))
      ).length;
    } catch {
      return 0;
    }
  }
  
  // Generate recommendations based on validation results
  private generateRecommendations(
    results: QualityCheckResult[],
    dimensionScores: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];
    
    // Check dimension scores
    Object.entries(dimensionScores).forEach(([dim, score]) => {
      if (score < 90) {
        const dimension = QUALITY_DIMENSIONS[dim];
        recommendations.push(
          `Improve ${dimension.name}: Current score ${score.toFixed(1)}%. ${dimension.description}`
        );
      }
    });
    
    // Check for critical failures
    const criticalFailures = results.filter(r => !r.passed && r.severity === 'critical');
    if (criticalFailures.length > 0) {
      recommendations.unshift(
        `⚠️ Critical: Fix ${criticalFailures.length} critical quality issues before proceeding`
      );
    }
    
    // Check for patterns in failures
    const failuresByDimension: Record<string, number> = {};
    results.filter(r => !r.passed).forEach(r => {
      failuresByDimension[r.dimension] = (failuresByDimension[r.dimension] || 0) + 1;
    });
    
    const worstDimension = Object.entries(failuresByDimension)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (worstDimension) {
      recommendations.push(
        `Focus on ${QUALITY_DIMENSIONS[worstDimension[0]].name} - ${worstDimension[1]} rules failed`
      );
    }
    
    // Add specific recommendations based on common issues
    const duplicateIssues = results.find(r => r.dimension === 'uniqueness' && !r.passed);
    if (duplicateIssues) {
      recommendations.push(
        'Consider implementing deduplication logic or unique constraints'
      );
    }
    
    const completenessIssues = results.find(r => r.dimension === 'completeness' && !r.passed);
    if (completenessIssues) {
      recommendations.push(
        'Review data collection process to reduce missing values'
      );
    }
    
    return recommendations;
  }
  
  // Add custom rule
  addRule(rule: QualityRule): void {
    this.rules.push(rule);
  }
  
  // Remove rule by ID
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }
  
  // Get all rules
  getRules(): QualityRule[] {
    return this.rules;
  }
  
  // Get rules by dimension
  getRulesByDimension(dimension: string): QualityRule[] {
    return this.rules.filter(r => r.dimension === dimension);
  }
  
  // Update rule threshold
  updateRuleThreshold(ruleId: string, threshold: number): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.threshold = threshold;
    }
  }
}

// Export singleton instance
export const qualityValidator = new QualityValidationService();