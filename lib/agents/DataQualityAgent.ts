import { BaseAgent } from './BaseAgent';
import { AgentCapability, AgentTask, AgentInsight } from './types';

interface DataQualityInput {
  table?: string;
  columns?: string[];
  ruleDescription?: string;
  existingRules?: QualityRule[];
  dataProfile?: DataProfile;
}

interface QualityRule {
  id: string;
  name: string;
  description: string;
  sql: string;
  severity: 'critical' | 'warning' | 'info';
  dimension: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'uniqueness' | 'validity';
}

interface DataProfile {
  table: string;
  rowCount: number;
  columns: Array<{
    name: string;
    type: string;
    nullCount: number;
    uniqueCount: number;
    minValue?: any;
    maxValue?: any;
  }>;
}

interface DataQualityOutput {
  rules: QualityRule[];
  validationSQL: string;
  recommendations: QualityRecommendation[];
  qualityScore?: number;
  issues?: QualityIssue[];
}

interface QualityRecommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  autoFixAvailable: boolean;
  sql?: string;
}

interface QualityIssue {
  rule: string;
  violationCount: number;
  sampleRecords?: any[];
  severity: 'critical' | 'warning' | 'info';
}

export class DataQualityAgent extends BaseAgent {
  constructor() {
    super(
      'data_quality',
      'Data Quality Agent',
      'Generates, validates, and monitors data quality rules with intelligent pattern detection'
    );
  }

  protected defineCapabilities(): AgentCapability[] {
    return [
      {
        name: 'generate_quality_rules',
        description: 'Generate data quality rules based on data profile and requirements',
        requiredContext: ['table']
      },
      {
        name: 'validate_data',
        description: 'Validate data against quality rules',
        requiredContext: ['table', 'rules']
      },
      {
        name: 'profile_data',
        description: 'Create comprehensive data profile',
        requiredContext: ['table']
      },
      {
        name: 'suggest_improvements',
        description: 'Suggest data quality improvements',
        requiredContext: ['dataProfile']
      }
    ];
  }

  protected async executeTask(task: AgentTask): Promise<DataQualityOutput> {
    const input = task.input as DataQualityInput;
    
    // Generate quality rules based on input
    const rules = this.generateQualityRules(input);
    
    // Create validation SQL
    const validationSQL = this.createValidationSQL(rules, input.table || 'target_table');
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(input);
    
    // Calculate quality score if we have data profile
    const qualityScore = input.dataProfile ? this.calculateQualityScore(input.dataProfile) : undefined;
    
    // Detect potential issues
    const issues = this.detectIssues(input);
    
    // Add insights
    await this.addQualityInsights(rules, qualityScore);
    
    return {
      rules,
      validationSQL,
      recommendations,
      qualityScore,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  private generateQualityRules(input: DataQualityInput): QualityRule[] {
    const rules: QualityRule[] = [];
    const table = input.table || 'target_table';
    
    // Parse rule description if provided
    if (input.ruleDescription) {
      const customRule = this.parseRuleDescription(input.ruleDescription, table);
      rules.push(customRule);
    }
    
    // Add standard rules based on columns
    if (input.columns) {
      // Email validation rule
      const emailColumns = input.columns.filter(col => 
        col.toLowerCase().includes('email') || col.toLowerCase().includes('mail')
      );
      emailColumns.forEach(col => {
        rules.push({
          id: `rule-email-${col}`,
          name: `Email Format Validation - ${col}`,
          description: `Validates that ${col} contains valid email format`,
          sql: `SELECT COUNT(*) as violations
FROM ${table}
WHERE ${col} IS NOT NULL 
  AND ${col} NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'`,
          severity: 'warning',
          dimension: 'validity'
        });
      });
      
      // Date range validation
      const dateColumns = input.columns.filter(col => 
        col.toLowerCase().includes('date') || col.toLowerCase().includes('time')
      );
      dateColumns.forEach(col => {
        rules.push({
          id: `rule-date-${col}`,
          name: `Date Range Validation - ${col}`,
          description: `Ensures ${col} is within reasonable range`,
          sql: `SELECT COUNT(*) as violations
FROM ${table}
WHERE ${col} IS NOT NULL
  AND (${col} < '2000-01-01' OR ${col} > DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR))`,
          severity: 'warning',
          dimension: 'validity'
        });
      });
      
      // Numeric range validation
      const numericColumns = input.columns.filter(col => 
        col.toLowerCase().includes('amount') || 
        col.toLowerCase().includes('price') || 
        col.toLowerCase().includes('value')
      );
      numericColumns.forEach(col => {
        rules.push({
          id: `rule-numeric-${col}`,
          name: `Positive Value Check - ${col}`,
          description: `Validates ${col} contains positive values`,
          sql: `SELECT COUNT(*) as violations
FROM ${table}
WHERE ${col} IS NOT NULL AND ${col} < 0`,
          severity: 'critical',
          dimension: 'accuracy'
        });
      });
      
      // Null check for critical columns
      const criticalColumns = input.columns.filter(col => 
        col.toLowerCase().includes('id') || 
        col.toLowerCase() === 'customer_id' ||
        col.toLowerCase() === 'order_id'
      );
      criticalColumns.forEach(col => {
        rules.push({
          id: `rule-null-${col}`,
          name: `Null Check - ${col}`,
          description: `Ensures ${col} is not null`,
          sql: `SELECT COUNT(*) as violations
FROM ${table}
WHERE ${col} IS NULL`,
          severity: 'critical',
          dimension: 'completeness'
        });
      });
    }
    
    // Add data freshness rule
    rules.push({
      id: 'rule-freshness',
      name: 'Data Freshness Check',
      description: 'Ensures data is updated regularly',
      sql: `SELECT 
  CASE 
    WHEN MAX(updated_at) < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 HOUR) 
    THEN 1 
    ELSE 0 
  END as violations
FROM ${table}`,
      severity: 'info',
      dimension: 'timeliness'
    });
    
    // Add uniqueness rule for IDs
    if (input.columns?.some(col => col.toLowerCase().includes('id'))) {
      const idColumn = input.columns.find(col => col.toLowerCase().includes('id'));
      rules.push({
        id: 'rule-uniqueness',
        name: `Uniqueness Check - ${idColumn}`,
        description: `Ensures ${idColumn} values are unique`,
        sql: `SELECT COUNT(*) as violations
FROM (
  SELECT ${idColumn}, COUNT(*) as cnt
  FROM ${table}
  GROUP BY ${idColumn}
  HAVING cnt > 1
) duplicates`,
        severity: 'critical',
        dimension: 'uniqueness'
      });
    }
    
    return rules;
  }

  private parseRuleDescription(description: string, table: string): QualityRule {
    const lower = description.toLowerCase();
    
    // Determine rule type based on description
    let sql = '';
    let dimension: QualityRule['dimension'] = 'validity';
    let severity: QualityRule['severity'] = 'warning';
    
    if (lower.includes('null') || lower.includes('empty')) {
      dimension = 'completeness';
      severity = 'critical';
      const column = this.extractColumnName(description) || 'column_name';
      sql = `SELECT COUNT(*) as violations FROM ${table} WHERE ${column} IS NULL OR ${column} = ''`;
    } else if (lower.includes('unique') || lower.includes('duplicate')) {
      dimension = 'uniqueness';
      severity = 'critical';
      const column = this.extractColumnName(description) || 'column_name';
      sql = `SELECT COUNT(*) - COUNT(DISTINCT ${column}) as violations FROM ${table}`;
    } else if (lower.includes('range') || lower.includes('between')) {
      dimension = 'validity';
      severity = 'warning';
      const column = this.extractColumnName(description) || 'column_name';
      sql = `SELECT COUNT(*) as violations FROM ${table} WHERE ${column} NOT BETWEEN 0 AND 1000000`;
    } else if (lower.includes('format') || lower.includes('pattern')) {
      dimension = 'validity';
      severity = 'warning';
      const column = this.extractColumnName(description) || 'column_name';
      sql = `SELECT COUNT(*) as violations FROM ${table} WHERE ${column} NOT REGEXP '^[A-Z0-9]+$'`;
    } else {
      // Generic validation
      sql = `SELECT COUNT(*) as violations FROM ${table} WHERE 1=0 -- Custom rule: ${description}`;
    }
    
    return {
      id: `rule-custom-${Date.now()}`,
      name: description.substring(0, 50),
      description,
      sql,
      severity,
      dimension
    };
  }

  private extractColumnName(description: string): string | null {
    // Simple extraction - look for quoted words or common column patterns
    const match = description.match(/['"`](\w+)['"`]/) || 
                  description.match(/column (\w+)/) ||
                  description.match(/field (\w+)/);
    return match ? match[1] : null;
  }

  private createValidationSQL(rules: QualityRule[], table: string): string {
    let sql = `-- Data Quality Validation Suite for ${table}\n`;
    sql += `-- Generated ${new Date().toISOString()}\n\n`;
    sql += `WITH quality_checks AS (\n`;
    
    rules.forEach((rule, index) => {
      sql += `  -- ${rule.name}\n`;
      sql += `  SELECT '${rule.id}' as rule_id,\n`;
      sql += `         '${rule.name}' as rule_name,\n`;
      sql += `         '${rule.dimension}' as dimension,\n`;
      sql += `         '${rule.severity}' as severity,\n`;
      sql += `         (${rule.sql.replace(/\n/g, '\n         ')}) as violation_count\n`;
      if (index < rules.length - 1) {
        sql += `  UNION ALL\n`;
      }
    });
    
    sql += `)\n`;
    sql += `SELECT \n`;
    sql += `  rule_id,\n`;
    sql += `  rule_name,\n`;
    sql += `  dimension,\n`;
    sql += `  severity,\n`;
    sql += `  violation_count,\n`;
    sql += `  CASE \n`;
    sql += `    WHEN violation_count = 0 THEN 'PASSED'\n`;
    sql += `    WHEN severity = 'critical' AND violation_count > 0 THEN 'FAILED'\n`;
    sql += `    WHEN severity = 'warning' AND violation_count > 0 THEN 'WARNING'\n`;
    sql += `    ELSE 'INFO'\n`;
    sql += `  END as status\n`;
    sql += `FROM quality_checks\n`;
    sql += `ORDER BY \n`;
    sql += `  CASE severity \n`;
    sql += `    WHEN 'critical' THEN 1\n`;
    sql += `    WHEN 'warning' THEN 2\n`;
    sql += `    ELSE 3\n`;
    sql += `  END,\n`;
    sql += `  violation_count DESC;`;
    
    return sql;
  }

  private generateRecommendations(input: DataQualityInput): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];
    
    // Recommendations based on data profile
    if (input.dataProfile) {
      const { columns } = input.dataProfile;
      
      // Check for high null rates
      columns.forEach(col => {
        const nullRate = col.nullCount / input.dataProfile!.rowCount;
        if (nullRate > 0.5) {
          recommendations.push({
            title: `High Null Rate in ${col.name}`,
            description: `Column ${col.name} has ${(nullRate * 100).toFixed(1)}% null values. Consider if this column is necessary or needs default values.`,
            impact: nullRate > 0.8 ? 'high' : 'medium',
            autoFixAvailable: true,
            sql: `UPDATE ${input.table} SET ${col.name} = 'DEFAULT_VALUE' WHERE ${col.name} IS NULL;`
          });
        }
      });
      
      // Check for low cardinality
      columns.forEach(col => {
        const uniqueRate = col.uniqueCount / input.dataProfile!.rowCount;
        if (uniqueRate < 0.01 && col.uniqueCount > 1) {
          recommendations.push({
            title: `Low Cardinality in ${col.name}`,
            description: `Column ${col.name} has only ${col.uniqueCount} unique values. Consider using an ENUM or reference table.`,
            impact: 'low',
            autoFixAvailable: false
          });
        }
      });
    }
    
    // General recommendations
    recommendations.push({
      title: 'Implement Data Lineage Tracking',
      description: 'Track data sources and transformations to improve quality debugging',
      impact: 'medium',
      autoFixAvailable: false
    });
    
    if (!input.existingRules || input.existingRules.length < 5) {
      recommendations.push({
        title: 'Expand Quality Rule Coverage',
        description: 'Current rule coverage is limited. Consider adding rules for all critical data dimensions.',
        impact: 'high',
        autoFixAvailable: true,
        sql: `-- Use automated rule generation to create comprehensive quality checks`
      });
    }
    
    return recommendations;
  }

  private calculateQualityScore(dataProfile: DataProfile): number {
    let score = 100;
    const { columns, rowCount } = dataProfile;
    
    // Deduct points for null values
    columns.forEach(col => {
      const nullRate = col.nullCount / rowCount;
      score -= nullRate * 10; // Max 10 points per column
    });
    
    // Deduct points for low uniqueness in ID columns
    columns.filter(col => col.name.toLowerCase().includes('id')).forEach(col => {
      const uniqueRate = col.uniqueCount / rowCount;
      if (uniqueRate < 0.95) {
        score -= (1 - uniqueRate) * 20; // Heavy penalty for duplicate IDs
      }
    });
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  private detectIssues(input: DataQualityInput): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    // Mock issue detection
    if (input.dataProfile) {
      input.dataProfile.columns.forEach(col => {
        if (col.nullCount > input.dataProfile!.rowCount * 0.3) {
          issues.push({
            rule: `null-check-${col.name}`,
            violationCount: col.nullCount,
            severity: col.name.includes('id') ? 'critical' : 'warning'
          });
        }
      });
    }
    
    return issues;
  }

  private async addQualityInsights(rules: QualityRule[], qualityScore?: number): Promise<void> {
    // Add score insight
    if (qualityScore !== undefined && qualityScore < 70) {
      this.insights.push({
        id: `insight-score-${Date.now()}`,
        agent: this.role,
        type: 'warning',
        title: 'Low Data Quality Score',
        description: `Data quality score is ${qualityScore.toFixed(1)}%. Immediate attention required to prevent downstream issues.`,
        confidence: 0.9,
        actions: [{
          label: 'Run Quality Fix Script',
          action: 'run_quality_fixes',
          params: { auto: true },
          impact: 'high'
        }]
      });
    }
    
    // Add rule coverage insight
    const dimensions = new Set(rules.map(r => r.dimension));
    if (dimensions.size < 4) {
      this.insights.push({
        id: `insight-coverage-${Date.now()}`,
        agent: this.role,
        type: 'recommendation',
        title: 'Incomplete Quality Dimension Coverage',
        description: `Only ${dimensions.size} of 6 quality dimensions are covered. Consider adding rules for missing dimensions.`,
        confidence: 0.8,
        actions: [{
          label: 'Generate Missing Rules',
          action: 'generate_missing_rules',
          params: { dimensions: ['completeness', 'accuracy', 'consistency', 'timeliness', 'uniqueness', 'validity'] },
          impact: 'medium'
        }]
      });
    }
  }
}