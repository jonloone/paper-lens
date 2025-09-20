/**
 * EnhancedDataHubClient - The Single Source of Truth for All Data Knowledge
 * 
 * This client unifies:
 * - Technical metadata from DataHub
 * - Business context and rules
 * - Quality metrics and monitoring
 * - Organizational patterns and wisdom
 * 
 * Key Principle: Context = Enhanced Metadata, not a separate abstraction
 */

import { MCPOrchestrator } from './MCPOrchestrator';
import { DataHubRulesOrchestrator, UnifiedRule } from './DataHubRulesOrchestrator';

export interface TechnicalMetadata {
  dataset: string;
  schema: SchemaField[];
  platform: string;
  owner: string;
  createdAt: Date;
  lastModified: Date;
  size: string;
  rowCount: number;
  partitioning?: string;
  format?: string;
  location?: string;
  compression?: string;
}

export interface SchemaField {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
  businessName?: string;
  isPII?: boolean;
  isKey?: boolean;
  sampleValues?: any[];
  statistics?: {
    nullCount?: number;
    distinctCount?: number;
    min?: any;
    max?: any;
    mean?: number;
  };
}

export interface BusinessContext {
  businessName: string;
  purpose: string;
  department: string;
  stakeholders: string[];
  dataProduct?: string;
  sla?: {
    freshness: string;
    availability: number;
    quality: number;
  };
  monetaryValue?: number;
  usageFrequency?: 'critical' | 'high' | 'medium' | 'low';
  documentationUrl?: string;
  businessGlossary?: Record<string, string>;
}


export interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  uniqueness: number;
  validity: number;
  lastChecked: Date;
  trend: 'improving' | 'stable' | 'degrading';
  issues: QualityIssue[];
  history: QualitySnapshot[];
}

export interface QualityIssue {
  field: string;
  type: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  affectedRows: number;
  detectedAt: Date;
  status: 'open' | 'investigating' | 'resolved';
}

export interface QualitySnapshot {
  timestamp: Date;
  score: number;
  metrics: Partial<QualityMetrics>;
}

export interface LineageInfo {
  upstream: DatasetReference[];
  downstream: DatasetReference[];
  transformations: Transformation[];
  dataFlow: string;
  refreshSchedule?: string;
  lastRefresh?: Date;
}

export interface DatasetReference {
  dataset: string;
  businessName?: string;
  type: 'source' | 'intermediate' | 'target';
  platform: string;
  criticality?: 'critical' | 'high' | 'medium' | 'low';
}

export interface Transformation {
  name: string;
  type: string;
  description: string;
  sql?: string;
  inputColumns: string[];
  outputColumns: string[];
}

export interface EnhancedDatasetMetadata {
  technical: TechnicalMetadata;
  business: BusinessContext;
  quality: QualityMetrics;
  lineage: LineageInfo;
  rules: UnifiedRule[];
  usage: UsageStatistics;
  recommendations: Recommendation[];
  compliance: ComplianceInfo;
}

export interface UsageStatistics {
  queryCount: number;
  uniqueUsers: number;
  avgQueryTime: number;
  topUsers: string[];
  commonJoins: string[];
  commonFilters: string[];
  accessPatterns: AccessPattern[];
}

export interface AccessPattern {
  pattern: string;
  frequency: number;
  avgResponseTime: number;
  optimizationPotential?: string;
}

export interface Recommendation {
  type: 'optimization' | 'quality' | 'governance' | 'usage';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  automatable: boolean;
  actions?: string[];
}

export interface ComplianceInfo {
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  piiFields: string[];
  retentionPolicy?: string;
  encryptionRequired: boolean;
  auditingEnabled: boolean;
  regulations: string[];
  lastAudit?: Date;
}

export class EnhancedDataHubClient {
  private mcpOrchestrator: MCPOrchestrator;
  private rulesOrchestrator: DataHubRulesOrchestrator;
  private cache: Map<string, EnhancedDatasetMetadata> = new Map();
  
  constructor() {
    this.mcpOrchestrator = new MCPOrchestrator();
    this.rulesOrchestrator = new DataHubRulesOrchestrator();
  }
  
  
  /**
   * Get complete enhanced metadata for a dataset
   * This is the single source of truth for all data knowledge
   */
  async getEnhancedMetadata(datasetId: string): Promise<EnhancedDatasetMetadata> {
    // Check cache first
    if (this.cache.has(datasetId)) {
      const cached = this.cache.get(datasetId)!;
      const cacheAge = Date.now() - cached.technical.lastModified.getTime();
      if (cacheAge < 5 * 60 * 1000) { // 5 minute cache
        return cached;
      }
    }
    
    // Fetch from multiple sources in parallel
    const [technical, business, quality, lineage, usage] = await Promise.all([
      this.fetchTechnicalMetadata(datasetId),
      this.fetchBusinessContext(datasetId),
      this.fetchQualityMetrics(datasetId),
      this.fetchLineage(datasetId),
      this.fetchUsageStatistics(datasetId)
    ]);
    
    // Get rules from DataHub's native engine
    const rules = await this.rulesOrchestrator.getRulesForDataset(datasetId);
    
    // Evaluate rules
    const ruleResults = await this.rulesOrchestrator.evaluateRules(datasetId);
    
    // Generate recommendations based on all metadata
    const recommendations = this.generateRecommendations({
      technical,
      business,
      quality,
      lineage,
      usage,
      rules,
      ruleResults
    });
    
    // Determine compliance requirements
    const compliance = this.determineCompliance(technical, business);
    
    const enhanced: EnhancedDatasetMetadata = {
      technical,
      business,
      quality,
      lineage,
      rules,
      usage,
      recommendations,
      compliance
    };
    
    // Cache the result
    this.cache.set(datasetId, enhanced);
    
    return enhanced;
  }
  
  private async fetchTechnicalMetadata(datasetId: string): Promise<TechnicalMetadata> {
    try {
      // Try to fetch from actual DataHub via MCP
      const result = await this.mcpOrchestrator.callTool('datahub', 'getDataset', {
        urn: datasetId
      });
      
      return this.mapDataHubToTechnical(result);
    } catch (error) {
      // Fallback to mock data for demo
      return this.getMockTechnicalMetadata(datasetId);
    }
  }
  
  private async fetchBusinessContext(datasetId: string): Promise<BusinessContext> {
    // In production, this would fetch from DataHub's business glossary
    // and custom properties
    return this.getMockBusinessContext(datasetId);
  }
  
  private async fetchQualityMetrics(datasetId: string): Promise<QualityMetrics> {
    // In production, integrate with Great Expectations or similar
    return this.getMockQualityMetrics(datasetId);
  }
  
  private async fetchLineage(datasetId: string): Promise<LineageInfo> {
    try {
      // Fetch lineage from DataHub
      const result = await this.mcpOrchestrator.callTool('datahub', 'getLineage', {
        urn: datasetId,
        direction: 'BOTH',
        depth: 2
      });
      
      return this.mapDataHubLineage(result);
    } catch (error) {
      return this.getMockLineage(datasetId);
    }
  }
  
  private async fetchUsageStatistics(datasetId: string): Promise<UsageStatistics> {
    // In production, aggregate from query logs and access patterns
    return this.getMockUsageStatistics(datasetId);
  }
  
  
  private generateRecommendations(metadata: any): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Quality-based recommendations
    if (metadata.quality.completeness < 0.9) {
      recommendations.push({
        type: 'quality',
        title: 'Improve Data Completeness',
        description: `Completeness is at ${(metadata.quality.completeness * 100).toFixed(1)}%. Consider adding validation rules or fixing data sources.`,
        impact: 'high',
        effort: 'medium',
        automatable: true,
        actions: ['Add NOT NULL constraints', 'Implement data validation pipeline']
      });
    }
    
    // Performance recommendations
    if (metadata.usage.avgQueryTime > 5000) {
      recommendations.push({
        type: 'optimization',
        title: 'Optimize Query Performance',
        description: 'Average query time exceeds 5 seconds. Consider adding indexes or materialized views.',
        impact: 'high',
        effort: 'low',
        automatable: true,
        actions: ['Analyze slow queries', 'Add suggested indexes', 'Consider partitioning']
      });
    }
    
    // Governance recommendations
    if (!metadata.business.documentationUrl) {
      recommendations.push({
        type: 'governance',
        title: 'Add Documentation',
        description: 'Dataset lacks business documentation. This impacts discoverability and proper usage.',
        impact: 'medium',
        effort: 'low',
        automatable: false,
        actions: ['Create business documentation', 'Add to data catalog']
      });
    }
    
    return recommendations;
  }
  
  private determineCompliance(technical: TechnicalMetadata, business: BusinessContext): ComplianceInfo {
    const piiFields = technical.schema
      .filter(field => field.isPII)
      .map(field => field.name);
    
    const classification = business.usageFrequency === 'critical' 
      ? 'restricted' 
      : piiFields.length > 0 
        ? 'confidential' 
        : 'internal';
    
    return {
      classification,
      piiFields,
      retentionPolicy: '7 years',
      encryptionRequired: classification === 'restricted' || classification === 'confidential',
      auditingEnabled: true,
      regulations: piiFields.length > 0 ? ['GDPR', 'CCPA'] : [],
      lastAudit: new Date('2024-01-15')
    };
  }
  
  // Mock data methods for demo
  private getMockTechnicalMetadata(datasetId: string): TechnicalMetadata {
    return {
      dataset: datasetId,
      schema: [
        {
          name: 'customer_id',
          type: 'string',
          nullable: false,
          description: 'Unique customer identifier',
          businessName: 'Customer ID',
          isKey: true,
          statistics: {
            nullCount: 0,
            distinctCount: 1000000
          }
        },
        {
          name: 'total_revenue',
          type: 'decimal',
          nullable: false,
          description: 'Total customer revenue',
          businessName: 'Lifetime Value',
          statistics: {
            nullCount: 0,
            min: 0,
            max: 1000000,
            mean: 5000
          }
        },
        {
          name: 'email',
          type: 'string',
          nullable: true,
          description: 'Customer email address',
          businessName: 'Email',
          isPII: true,
          statistics: {
            nullCount: 50000,
            distinctCount: 950000
          }
        }
      ],
      platform: 'snowflake',
      owner: 'data-team',
      createdAt: new Date('2023-01-15'),
      lastModified: new Date('2024-01-20'),
      size: '2.5 GB',
      rowCount: 1000000,
      partitioning: 'month',
      format: 'parquet',
      location: 's3://data-lake/customers/',
      compression: 'snappy'
    };
  }
  
  private getMockBusinessContext(datasetId: string): BusinessContext {
    return {
      businessName: 'Customer Analytics Master',
      purpose: 'Unified customer view for analytics and ML models',
      department: 'Analytics',
      stakeholders: ['Product', 'Marketing', 'Finance'],
      dataProduct: 'Customer 360',
      sla: {
        freshness: '24 hours',
        availability: 99.9,
        quality: 95
      },
      monetaryValue: 500000,
      usageFrequency: 'critical',
      businessGlossary: {
        'lifetime_value': 'Total revenue generated by a customer',
        'churn_risk': 'Probability of customer leaving in next 30 days'
      }
    };
  }
  
  private getMockQualityMetrics(datasetId: string): QualityMetrics {
    return {
      completeness: 0.95,
      accuracy: 0.98,
      consistency: 0.92,
      timeliness: 0.99,
      uniqueness: 1.0,
      validity: 0.97,
      lastChecked: new Date(),
      trend: 'stable',
      issues: [
        {
          field: 'email',
          type: 'completeness',
          severity: 'minor',
          description: '5% of records missing email',
          affectedRows: 50000,
          detectedAt: new Date(),
          status: 'open'
        }
      ],
      history: [
        {
          timestamp: new Date('2024-01-01'),
          score: 0.94,
          metrics: { completeness: 0.93, accuracy: 0.97 }
        },
        {
          timestamp: new Date('2024-01-15'),
          score: 0.96,
          metrics: { completeness: 0.95, accuracy: 0.98 }
        }
      ]
    };
  }
  
  private getMockLineage(datasetId: string): LineageInfo {
    return {
      upstream: [
        {
          dataset: 'raw.customer_events',
          businessName: 'Customer Events',
          type: 'source',
          platform: 'kafka',
          criticality: 'critical'
        },
        {
          dataset: 'staging.customer_profiles',
          businessName: 'Customer Profiles',
          type: 'source',
          platform: 'postgres',
          criticality: 'high'
        }
      ],
      downstream: [
        {
          dataset: 'mart.customer_segments',
          businessName: 'Customer Segments',
          type: 'target',
          platform: 'snowflake',
          criticality: 'high'
        },
        {
          dataset: 'ml.churn_prediction',
          businessName: 'Churn Model',
          type: 'target',
          platform: 'mlflow',
          criticality: 'critical'
        }
      ],
      transformations: [
        {
          name: 'Deduplicate',
          type: 'cleaning',
          description: 'Remove duplicate customer records',
          sql: 'ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY updated_at DESC)',
          inputColumns: ['customer_id', 'updated_at'],
          outputColumns: ['customer_id']
        },
        {
          name: 'Calculate LTV',
          type: 'aggregation',
          description: 'Calculate lifetime value',
          sql: 'SUM(order_value) AS total_revenue',
          inputColumns: ['order_value'],
          outputColumns: ['total_revenue']
        }
      ],
      dataFlow: 'Events → Staging → Aggregation → Analytics',
      refreshSchedule: '0 2 * * *',
      lastRefresh: new Date('2024-01-20T02:00:00')
    };
  }
  
  private getMockUsageStatistics(datasetId: string): UsageStatistics {
    return {
      queryCount: 15420,
      uniqueUsers: 127,
      avgQueryTime: 3200,
      topUsers: ['analyst1', 'ml-pipeline', 'dashboard-service'],
      commonJoins: ['dim_customer', 'fact_orders'],
      commonFilters: ['created_date', 'customer_segment', 'region'],
      accessPatterns: [
        {
          pattern: 'SELECT * WHERE created_date > CURRENT_DATE - 30',
          frequency: 450,
          avgResponseTime: 2100,
          optimizationPotential: 'Add date partition pruning'
        },
        {
          pattern: 'JOIN dim_customer ON customer_id',
          frequency: 380,
          avgResponseTime: 4500,
          optimizationPotential: 'Consider denormalizing frequently joined fields'
        }
      ]
    };
  }
  
  private mapDataHubToTechnical(datahubResult: any): TechnicalMetadata {
    // Map DataHub response to our TechnicalMetadata structure
    // This would be implemented based on actual DataHub API response
    return this.getMockTechnicalMetadata('default');
  }
  
  private mapDataHubLineage(datahubResult: any): LineageInfo {
    // Map DataHub lineage to our LineageInfo structure
    return this.getMockLineage('default');
  }
  
  /**
   * Search for datasets using business or technical terms
   */
  async searchDatasets(query: string, filters?: {
    department?: string;
    dataProduct?: string;
    quality?: number;
    compliance?: string;
  }): Promise<EnhancedDatasetMetadata[]> {
    // In production, this would search across DataHub with enhanced metadata
    const mockResults = [
      await this.getEnhancedMetadata('analytics.customer_360'),
      await this.getEnhancedMetadata('mart.revenue_summary'),
      await this.getEnhancedMetadata('staging.product_catalog')
    ];
    
    // Apply filters
    return mockResults.filter(dataset => {
      if (filters?.department && dataset.business.department !== filters.department) {
        return false;
      }
      if (filters?.quality && dataset.quality.completeness < filters.quality / 100) {
        return false;
      }
      return true;
    });
  }
  
  /**
   * Get context for AI generation - this is what makes our AI "context-aware"
   */
  async getContextForGeneration(datasetIds: string[]): Promise<{
    schemas: Record<string, SchemaField[]>;
    rules: UnifiedRule[];
    quality: Record<string, QualityMetrics>;
    patterns: AccessPattern[];
    recommendations: Recommendation[];
  }> {
    const context = {
      schemas: {} as Record<string, SchemaField[]>,
      rules: [] as UnifiedRule[],
      quality: {} as Record<string, QualityMetrics>,
      patterns: [] as AccessPattern[],
      recommendations: [] as Recommendation[]
    };
    
    for (const id of datasetIds) {
      const metadata = await this.getEnhancedMetadata(id);
      context.schemas[id] = metadata.technical.schema;
      context.rules.push(...metadata.rules);
      context.quality[id] = metadata.quality;
      context.patterns.push(...metadata.usage.accessPatterns);
      context.recommendations.push(...metadata.recommendations);
    }
    
    return context;
  }
  
  /**
   * Update business context for a dataset
   */
  async updateBusinessContext(datasetId: string, updates: Partial<BusinessContext>): Promise<void> {
    // In production, this would update DataHub custom properties
    const current = await this.getEnhancedMetadata(datasetId);
    const updated = {
      ...current,
      business: {
        ...current.business,
        ...updates
      }
    };
    
    this.cache.set(datasetId, updated);
    
    // Trigger MCP update to DataHub
    await this.mcpOrchestrator.callTool('datahub', 'updateDataset', {
      urn: datasetId,
      properties: updates
    });
  }
  
  /**
   * Create a new data contract in DataHub
   */
  async createDataContract(datasetId: string, contract: {
    schema?: Array<{ field: string; type: string; nullable: boolean }>;
    freshness?: { assertion: string; schedule?: string };
    quality?: Array<{ type: string; assertion: string; field?: string }>;
  }): Promise<void> {
    await this.rulesOrchestrator.createDataContract(datasetId, {
      properties: {
        schema: contract.schema || [],
        freshness: contract.freshness || { type: 'SLA', assertion: '24 hours' },
        dataQuality: contract.quality || []
      }
    });
    
    // Clear cache to force re-evaluation
    this.cache.clear();
  }
  
  /**
   * Create a new assertion in DataHub
   */
  async createAssertion(datasetId: string, assertion: {
    type: string;
    description: string;
    statement?: string;
    field?: string;
  }): Promise<void> {
    await this.rulesOrchestrator.createAssertion(datasetId, assertion);
    
    // Clear cache to force re-evaluation
    this.cache.clear();
  }
}

// Export singleton instance
export const enhancedDataHubClient = new EnhancedDataHubClient();