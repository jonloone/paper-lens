/**
 * DataHubRulesOrchestrator - Orchestrates DataHub's native rules with other systems
 * 
 * This orchestrator:
 * - Uses DataHub's Data Contracts and Assertions as the primary rules engine
 * - Translates rules between DataHub, Great Expectations, and Ranger
 * - Provides a unified interface for rule evaluation across systems
 * - Enhances DataHub rules with cross-system context
 * 
 * Architecture:
 * - DataHub: Source of truth for data contracts and quality assertions
 * - Great Expectations: Advanced statistical validations
 * - Ranger: Access control and security policies
 * - This Orchestrator: Coordinates and translates between them
 */

import { MCPOrchestrator } from './MCPOrchestrator';

// DataHub native types
export interface DataHubContract {
  urn: string;
  type: 'DATA_CONTRACT';
  properties: {
    schema: SchemaContract[];
    freshness: FreshnessContract;
    dataQuality: DataQualityContract[];
  };
  status: 'ACTIVE' | 'PENDING' | 'DISABLED';
}

export interface SchemaContract {
  field: string;
  type: string;
  nullable: boolean;
  description?: string;
  tags?: string[];
}

export interface FreshnessContract {
  type: 'SLA' | 'CRON';
  assertion: string;
  schedule?: string;
  granularity?: 'DAILY' | 'HOURLY' | 'PARTITION';
}

export interface DataQualityContract {
  type: 'VOLUME' | 'COLUMN' | 'CUSTOM_SQL';
  assertion: string;
  field?: string;
  operator?: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL_TO' | 'BETWEEN';
  value?: any;
  min?: any;
  max?: any;
}

export interface DataHubAssertion {
  urn: string;
  type: 'DATASET' | 'FIELD' | 'SQL';
  platform: 'DATAHUB';
  info: {
    type: string;
    description: string;
    statement?: string;
    fields?: string[];
    operator?: string;
    parameters?: any;
  };
  runEvents: AssertionRunEvent[];
}

export interface AssertionRunEvent {
  timestampMillis: number;
  status: 'COMPLETE' | 'ERROR' | 'FAILURE';
  result?: {
    type: 'SUCCESS' | 'FAILURE' | 'ERROR';
    nativeResults?: any;
    externalUrl?: string;
  };
}

// Great Expectations types
export interface GreatExpectationsExpectation {
  expectation_type: string;
  kwargs: Record<string, any>;
  meta?: Record<string, any>;
}

// Ranger types
export interface RangerPolicy {
  id: number;
  name: string;
  service: string;
  resources: Record<string, any>;
  policyItems: PolicyItem[];
  isEnabled: boolean;
}

export interface PolicyItem {
  users: string[];
  groups: string[];
  roles: string[];
  accesses: Access[];
  conditions: Condition[];
}

export interface Access {
  type: string;
  isAllowed: boolean;
}

export interface Condition {
  type: string;
  values: string[];
}

// Unified types
export interface UnifiedRule {
  id: string;
  name: string;
  description: string;
  source: 'datahub' | 'great_expectations' | 'ranger' | 'custom';
  category: 'quality' | 'freshness' | 'schema' | 'access' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  nativeRule: DataHubContract | DataHubAssertion | GreatExpectationsExpectation | RangerPolicy;
  evaluationResults?: EvaluationResult[];
  recommendations?: string[];
}

export interface EvaluationResult {
  timestamp: Date;
  status: 'passed' | 'failed' | 'error';
  message: string;
  details?: any;
  affectedRecords?: number;
  suggestion?: string;
}

export class DataHubRulesOrchestrator {
  private mcp: MCPOrchestrator;
  private ruleCache: Map<string, UnifiedRule> = new Map();
  
  constructor() {
    this.mcp = new MCPOrchestrator();
  }
  
  /**
   * Get all rules for a dataset from DataHub and other systems
   */
  async getRulesForDataset(datasetUrn: string): Promise<UnifiedRule[]> {
    const rules: UnifiedRule[] = [];
    
    // Fetch from DataHub
    const [contracts, assertions] = await Promise.all([
      this.getDataHubContracts(datasetUrn),
      this.getDataHubAssertions(datasetUrn)
    ]);
    
    // Convert DataHub contracts to unified rules
    contracts.forEach(contract => {
      // Schema rules
      contract.properties.schema?.forEach(field => {
        rules.push({
          id: `${contract.urn}-schema-${field.field}`,
          name: `Schema: ${field.field}`,
          description: `Field ${field.field} must be ${field.type}${field.nullable ? ' (nullable)' : ''}`,
          source: 'datahub',
          category: 'schema',
          severity: field.nullable ? 'medium' : 'high',
          nativeRule: contract
        });
      });
      
      // Freshness rules
      if (contract.properties.freshness) {
        rules.push({
          id: `${contract.urn}-freshness`,
          name: 'Data Freshness SLA',
          description: contract.properties.freshness.assertion,
          source: 'datahub',
          category: 'freshness',
          severity: 'high',
          nativeRule: contract
        });
      }
      
      // Quality rules
      contract.properties.dataQuality?.forEach((quality, idx) => {
        rules.push({
          id: `${contract.urn}-quality-${idx}`,
          name: `Quality: ${quality.type}`,
          description: quality.assertion,
          source: 'datahub',
          category: 'quality',
          severity: 'high',
          nativeRule: contract
        });
      });
    });
    
    // Convert DataHub assertions to unified rules
    assertions.forEach(assertion => {
      rules.push({
        id: assertion.urn,
        name: assertion.info.description || assertion.info.type,
        description: assertion.info.statement || assertion.info.description,
        source: 'datahub',
        category: this.categorizeAssertion(assertion),
        severity: this.calculateSeverity(assertion),
        nativeRule: assertion,
        evaluationResults: this.mapRunEvents(assertion.runEvents)
      });
    });
    
    // Fetch from Great Expectations if configured
    try {
      const geExpectations = await this.getGreatExpectations(datasetUrn);
      geExpectations.forEach(exp => {
        rules.push({
          id: `ge-${exp.expectation_type}-${datasetUrn}`,
          name: this.humanizeExpectationType(exp.expectation_type),
          description: this.describeExpectation(exp),
          source: 'great_expectations',
          category: 'quality',
          severity: 'medium',
          nativeRule: exp
        });
      });
    } catch (error) {
      console.log('Great Expectations not configured or unavailable');
    }
    
    // Fetch from Ranger if configured
    try {
      const rangerPolicies = await this.getRangerPolicies(datasetUrn);
      rangerPolicies.forEach(policy => {
        rules.push({
          id: `ranger-${policy.id}`,
          name: policy.name,
          description: `Access control policy for ${policy.service}`,
          source: 'ranger',
          category: 'access',
          severity: 'critical',
          nativeRule: policy
        });
      });
    } catch (error) {
      console.log('Ranger not configured or unavailable');
    }
    
    // Cache and return
    rules.forEach(rule => this.ruleCache.set(rule.id, rule));
    return rules;
  }
  
  /**
   * Create a new DataHub contract
   */
  async createDataContract(
    datasetUrn: string,
    contract: Partial<DataHubContract>
  ): Promise<DataHubContract> {
    return await this.mcp.callTool('datahub', 'createDataContract', {
      entityUrn: datasetUrn,
      contract: {
        ...contract,
        type: 'DATA_CONTRACT',
        status: contract.status || 'ACTIVE'
      }
    });
  }
  
  /**
   * Create a new DataHub assertion
   */
  async createAssertion(
    datasetUrn: string,
    assertion: {
      type: string;
      description: string;
      statement?: string;
      field?: string;
      operator?: string;
      value?: any;
    }
  ): Promise<DataHubAssertion> {
    return await this.mcp.callTool('datahub', 'createAssertion', {
      entityUrn: datasetUrn,
      assertion: {
        type: assertion.type,
        info: assertion
      }
    });
  }
  
  /**
   * Translate a Great Expectations expectation to DataHub assertion
   */
  translateGEToDataHub(expectation: GreatExpectationsExpectation): Partial<DataHubAssertion> {
    const typeMap: Record<string, string> = {
      'expect_column_values_to_not_be_null': 'FIELD_VALUES',
      'expect_column_values_to_be_unique': 'UNIQUENESS',
      'expect_column_values_to_be_between': 'FIELD_VALUES',
      'expect_table_row_count_to_be_between': 'VOLUME'
    };
    
    return {
      type: 'FIELD',
      info: {
        type: typeMap[expectation.expectation_type] || 'CUSTOM_SQL',
        description: this.humanizeExpectationType(expectation.expectation_type),
        fields: expectation.kwargs.column ? [expectation.kwargs.column] : [],
        parameters: expectation.kwargs
      }
    };
  }
  
  /**
   * Translate a DataHub assertion to Great Expectations
   */
  translateDataHubToGE(assertion: DataHubAssertion): GreatExpectationsExpectation {
    const expectationMap: Record<string, string> = {
      'FIELD_VALUES': 'expect_column_values_to_not_be_null',
      'UNIQUENESS': 'expect_column_values_to_be_unique',
      'VOLUME': 'expect_table_row_count_to_be_between'
    };
    
    return {
      expectation_type: expectationMap[assertion.info.type] || 'expect_column_values_to_be_in_set',
      kwargs: {
        ...assertion.info.parameters,
        column: assertion.info.fields?.[0]
      },
      meta: {
        source: 'datahub',
        originalUrn: assertion.urn
      }
    };
  }
  
  /**
   * Evaluate all rules for a dataset
   */
  async evaluateRules(datasetUrn: string): Promise<Map<string, EvaluationResult>> {
    const rules = await this.getRulesForDataset(datasetUrn);
    const results = new Map<string, EvaluationResult>();
    
    for (const rule of rules) {
      try {
        const result = await this.evaluateRule(rule, datasetUrn);
        results.set(rule.id, result);
      } catch (error) {
        results.set(rule.id, {
          timestamp: new Date(),
          status: 'error',
          message: `Failed to evaluate rule: ${error}`,
          details: error
        });
      }
    }
    
    return results;
  }
  
  /**
   * Evaluate a single rule
   */
  private async evaluateRule(rule: UnifiedRule, datasetUrn: string): Promise<EvaluationResult> {
    switch (rule.source) {
      case 'datahub':
        // DataHub evaluates assertions automatically
        // We just fetch the latest result
        if ('runEvents' in rule.nativeRule) {
          const latest = (rule.nativeRule as DataHubAssertion).runEvents[0];
          if (latest) {
            return {
              timestamp: new Date(latest.timestampMillis),
              status: latest.status === 'COMPLETE' && latest.result?.type === 'SUCCESS' ? 'passed' : 'failed',
              message: latest.result?.type || latest.status,
              details: latest.result?.nativeResults
            };
          }
        }
        break;
        
      case 'great_expectations':
        // Run expectation through GE
        const geResult = await this.mcp.callTool('great_expectations', 'validate', {
          dataset: datasetUrn,
          expectation: rule.nativeRule
        });
        return {
          timestamp: new Date(),
          status: geResult.success ? 'passed' : 'failed',
          message: geResult.result?.expectation_config?.expectation_type || 'Validation complete',
          details: geResult.result,
          affectedRecords: geResult.result?.unexpected_count
        };
        
      case 'ranger':
        // Check access policy
        const accessResult = await this.mcp.callTool('ranger', 'checkAccess', {
          resource: datasetUrn,
          policy: rule.nativeRule
        });
        return {
          timestamp: new Date(),
          status: accessResult.allowed ? 'passed' : 'failed',
          message: accessResult.reason || 'Access check complete',
          details: accessResult
        };
    }
    
    // Default fallback
    return {
      timestamp: new Date(),
      status: 'error',
      message: 'Unsupported rule source',
      details: { rule }
    };
  }
  
  /**
   * Get recommended rules based on dataset characteristics
   */
  async getRecommendedRules(datasetUrn: string, metadata: any): Promise<UnifiedRule[]> {
    const recommendations: UnifiedRule[] = [];
    
    // Recommend PII checks if sensitive fields detected
    if (metadata.schema?.some((f: any) => f.isPII)) {
      recommendations.push({
        id: 'rec-pii-encryption',
        name: 'PII Encryption Check',
        description: 'Ensure PII fields are encrypted',
        source: 'custom',
        category: 'compliance',
        severity: 'critical',
        nativeRule: {} as any,
        recommendations: ['Enable column-level encryption', 'Add access controls']
      });
    }
    
    // Recommend freshness checks for critical datasets
    if (metadata.business?.usageFrequency === 'critical') {
      recommendations.push({
        id: 'rec-freshness-sla',
        name: 'Freshness SLA',
        description: 'Set up freshness monitoring for critical dataset',
        source: 'custom',
        category: 'freshness',
        severity: 'high',
        nativeRule: {} as any,
        recommendations: ['Define SLA based on business requirements', 'Set up alerting']
      });
    }
    
    // Recommend volume checks for large datasets
    if (metadata.technical?.rowCount > 1000000) {
      recommendations.push({
        id: 'rec-volume-anomaly',
        name: 'Volume Anomaly Detection',
        description: 'Monitor for unusual changes in data volume',
        source: 'custom',
        category: 'quality',
        severity: 'medium',
        nativeRule: {} as any,
        recommendations: ['Set expected volume range', 'Configure anomaly detection']
      });
    }
    
    return recommendations;
  }
  
  // Helper methods
  
  private async getDataHubContracts(datasetUrn: string): Promise<DataHubContract[]> {
    try {
      const result = await this.mcp.callTool('datahub', 'getDataContracts', {
        entityUrn: datasetUrn
      });
      return result.contracts || [];
    } catch (error) {
      return [];
    }
  }
  
  private async getDataHubAssertions(datasetUrn: string): Promise<DataHubAssertion[]> {
    try {
      const result = await this.mcp.callTool('datahub', 'getAssertions', {
        entityUrn: datasetUrn
      });
      return result.assertions || [];
    } catch (error) {
      return [];
    }
  }
  
  private async getGreatExpectations(datasetUrn: string): Promise<GreatExpectationsExpectation[]> {
    const result = await this.mcp.callTool('great_expectations', 'getExpectations', {
      dataset: datasetUrn
    });
    return result.expectations || [];
  }
  
  private async getRangerPolicies(datasetUrn: string): Promise<RangerPolicy[]> {
    const result = await this.mcp.callTool('ranger', 'getPolicies', {
      resource: datasetUrn
    });
    return result.policies || [];
  }
  
  private categorizeAssertion(assertion: DataHubAssertion): UnifiedRule['category'] {
    const typeMap: Record<string, UnifiedRule['category']> = {
      'VOLUME': 'quality',
      'FIELD_VALUES': 'quality',
      'UNIQUENESS': 'quality',
      'SCHEMA': 'schema',
      'FRESHNESS': 'freshness',
      'SQL': 'quality'
    };
    return typeMap[assertion.info.type] || 'quality';
  }
  
  private calculateSeverity(assertion: DataHubAssertion): UnifiedRule['severity'] {
    // Calculate based on recent failures
    const recentRuns = assertion.runEvents.slice(0, 5);
    const failureRate = recentRuns.filter(r => r.status !== 'COMPLETE' || r.result?.type === 'FAILURE').length / recentRuns.length;
    
    if (failureRate > 0.5) return 'critical';
    if (failureRate > 0.2) return 'high';
    if (failureRate > 0.05) return 'medium';
    return 'low';
  }
  
  private mapRunEvents(events: AssertionRunEvent[]): EvaluationResult[] {
    return events.map(event => ({
      timestamp: new Date(event.timestampMillis),
      status: event.status === 'COMPLETE' && event.result?.type === 'SUCCESS' ? 'passed' as const : 'failed' as const,
      message: event.result?.type || event.status,
      details: event.result?.nativeResults
    }));
  }
  
  private humanizeExpectationType(type: string): string {
    return type
      .replace('expect_', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  private describeExpectation(exp: GreatExpectationsExpectation): string {
    const descriptions: Record<string, (kwargs: any) => string> = {
      'expect_column_values_to_not_be_null': (k) => `Column ${k.column} should not contain null values`,
      'expect_column_values_to_be_unique': (k) => `Column ${k.column} should contain unique values`,
      'expect_column_values_to_be_between': (k) => `Column ${k.column} values should be between ${k.min_value} and ${k.max_value}`,
      'expect_table_row_count_to_be_between': (k) => `Table should have between ${k.min_value} and ${k.max_value} rows`
    };
    
    const descFn = descriptions[exp.expectation_type];
    return descFn ? descFn(exp.kwargs) : `Expectation: ${exp.expectation_type}`;
  }
}

// Export singleton instance
export const dataHubRulesOrchestrator = new DataHubRulesOrchestrator();