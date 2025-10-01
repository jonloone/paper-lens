/**
 * Intelligent Tool Router
 *
 * Automatically selects the optimal data transformation tool (dbt vs SQLMesh)
 * based on contract requirements, workload patterns, and organizational preferences.
 *
 * Key Decision Factors:
 * - High-frequency incrementals with time-based logic → SQLMesh
 * - Analyst self-service workflows → dbt
 * - Critical SLAs with contract enforcement → SQLMesh
 * - Experimental/rapid iteration → dbt
 * - High-volume tables needing virtual environments → SQLMesh
 */

import { ODCSContract } from '../schemas/odcs-contract';

export type Tool = 'dbt' | 'sqlmesh';

export interface ToolDecision {
  tool: Tool;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
  features: string[];
  estimated_savings?: {
    storage_percent?: number;
    runtime_percent?: number;
    cost_dollars?: number;
  };
}

export class IntelligentToolRouter {
  /**
   * Main routing decision logic
   */
  route(contract: ODCSContract, context?: RoutingContext): ToolDecision {
    // Check if user has explicit preference
    if (context?.tool_preference) {
      return {
        tool: context.tool_preference,
        reason: 'user_preference',
        confidence: 'high',
        features: []
      };
    }

    // Run decision matrix
    const scores = this.calculateScores(contract, context);

    // SQLMesh wins if score > 0.6
    if (scores.sqlmesh > 0.6) {
      return {
        tool: 'sqlmesh',
        reason: this.getTopReason(scores.sqlmesh_reasons),
        confidence: this.mapConfidence(scores.sqlmesh),
        features: scores.sqlmesh_features,
        estimated_savings: this.estimateSavings(contract, 'sqlmesh')
      };
    }

    // Default to dbt (familiarity, ecosystem)
    return {
      tool: 'dbt',
      reason: scores.dbt_reasons[0] || 'default_choice',
      confidence: this.mapConfidence(scores.dbt),
      features: scores.dbt_features
    };
  }

  /**
   * Calculate weighted scores for each tool
   */
  private calculateScores(contract: ODCSContract, context?: RoutingContext): DecisionScores {
    const scores: DecisionScores = {
      sqlmesh: 0,
      dbt: 0.3, // Baseline preference for dbt (familiarity)
      sqlmesh_reasons: [],
      dbt_reasons: [],
      sqlmesh_features: [],
      dbt_features: []
    };

    // Factor 1: Time-based incremental requirements (HIGH WEIGHT: 0.3)
    if (this.needsTimeRangeIncremental(contract)) {
      scores.sqlmesh += 0.3;
      scores.sqlmesh_reasons.push('time_range_incremental');
      scores.sqlmesh_features.push('incremental_by_time_range');
    }

    // Factor 2: Critical SLA with contract enforcement (WEIGHT: 0.25)
    if (contract.sla.criticality === 'critical' || contract.sla.criticality === 'high') {
      scores.sqlmesh += 0.25;
      scores.sqlmesh_reasons.push('critical_sla');
      scores.sqlmesh_features.push('built_in_contracts', 'audit_framework');
    }

    // Factor 3: High-volume data (WEIGHT: 0.2)
    if (this.isHighVolumeWorkload(contract, context)) {
      scores.sqlmesh += 0.2;
      scores.sqlmesh_reasons.push('high_volume_optimization');
      scores.sqlmesh_features.push('virtual_environments');
    }

    // Factor 4: Analyst ownership (NEGATIVE WEIGHT for SQLMesh: -0.3)
    if (this.isAnalystWorkflow(contract, context)) {
      scores.dbt += 0.4;
      scores.dbt_reasons.push('analyst_friendly');
      scores.dbt_features.push('familiar_syntax', 'large_ecosystem');
    }

    // Factor 5: Experimental/frequent changes (WEIGHT for dbt: 0.2)
    if (context?.is_experimental || contract.status === 'draft') {
      scores.dbt += 0.2;
      scores.dbt_reasons.push('rapid_iteration');
      scores.dbt_features.push('fast_development');
    }

    // Factor 6: Multiple product delivery methods (WEIGHT: 0.15)
    if (context?.multi_product_delivery) {
      scores.sqlmesh += 0.15;
      scores.sqlmesh_reasons.push('multi_product_support');
      scores.sqlmesh_features.push('flexible_delivery');
    }

    // Factor 7: Graph/lineage requirements (WEIGHT: 0.1)
    if (this.hasGraphRequirements(contract)) {
      scores.sqlmesh += 0.1;
      scores.sqlmesh_reasons.push('graph_metadata');
      scores.sqlmesh_features.push('rich_metadata');
    }

    return scores;
  }

  /**
   * Check if contract needs time-range incremental processing
   */
  private needsTimeRangeIncremental(contract: ODCSContract): boolean {
    // Look for timestamp fields in schema
    const hasTimestampField = contract.schema.fields.some(
      f => f.type === 'timestamp' || f.name.includes('_at') || f.name.includes('_date')
    );

    // Check if freshness is hourly or more frequent
    const freshnessIndicatesIncremental =
      contract.sla.freshness.includes('hour') ||
      contract.sla.freshness.includes('minute') ||
      contract.sla.freshness === '24 hours';

    return hasTimestampField && freshnessIndicatesIncremental;
  }

  /**
   * Check if this is an analyst-driven workflow
   */
  private isAnalystWorkflow(contract: ODCSContract, context?: RoutingContext): boolean {
    // Check owner domain
    const analystDomains = ['analytics', 'marketing', 'finance', 'business'];
    const ownerIsAnalyst = analystDomains.some(domain =>
      contract.metadata.owner.toLowerCase().includes(domain)
    );

    // Check namespace
    const namespaceIsAnalytics = contract.metadata.namespace.includes('analytics');

    // Check context
    const contextIndicatesAnalyst = context?.owner_role === 'analyst';

    return ownerIsAnalyst || namespaceIsAnalytics || contextIndicatesAnalyst;
  }

  /**
   * Check if this is a high-volume workload
   */
  private isHighVolumeWorkload(contract: ODCSContract, context?: RoutingContext): boolean {
    if (context?.estimated_row_count && context.estimated_row_count > 10_000_000) {
      return true;
    }

    // Infer from domain
    const highVolumeDomains = ['events', 'transactions', 'logs', 'telemetry', 'clickstream'];
    return highVolumeDomains.some(domain =>
      contract.metadata.namespace.toLowerCase().includes(domain) ||
      contract.metadata.name.toLowerCase().includes(domain)
    );
  }

  /**
   * Check if contract has graph/knowledge graph requirements
   */
  private hasGraphRequirements(contract: ODCSContract): boolean {
    return (
      contract.metadata.tags?.includes('graph') ||
      contract.metadata.tags?.includes('knowledge_graph') ||
      contract.metadata.name.includes('graph') ||
      false
    );
  }

  /**
   * Get the top reason from the reasons array
   */
  private getTopReason(reasons: string[]): string {
    return reasons[0] || 'optimal_choice';
  }

  /**
   * Map score to confidence level
   */
  private mapConfidence(score: number): 'low' | 'medium' | 'high' {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Estimate cost/performance savings
   */
  private estimateSavings(contract: ODCSContract, tool: Tool): ToolDecision['estimated_savings'] {
    if (tool !== 'sqlmesh') return undefined;

    // SQLMesh virtual environments save ~90% storage for test envs
    const savings: ToolDecision['estimated_savings'] = {
      storage_percent: 90
    };

    // Time-range incrementals are ~30% faster than full refreshes
    if (this.needsTimeRangeIncremental(contract)) {
      savings.runtime_percent = 30;
    }

    return savings;
  }

  /**
   * Get human-readable explanation
   */
  getExplanation(decision: ToolDecision): string {
    const explanations: Record<string, string> = {
      time_range_incremental:
        'Your data requires time-based incremental processing. We'll use advanced incremental strategies to ensure your 8 AM deadline while minimizing compute costs.',
      critical_sla:
        'Your critical SLA requirements benefit from built-in contract enforcement and audit frameworks for reliability.',
      high_volume_optimization:
        'For high-volume datasets, we'll use virtual environments to save 90% storage costs during testing.',
      analyst_friendly: 'This workflow is optimized for rapid iteration and self-service analytics.',
      rapid_iteration: 'For experimental work, we'll use a development-friendly approach.',
      user_preference: 'Using your preferred processing engine.',
      default_choice: 'Using standard processing optimized for your requirements.'
    };

    return explanations[decision.reason] || explanations.default_choice;
  }
}

interface RoutingContext {
  tool_preference?: Tool;
  owner_role?: 'engineer' | 'analyst' | 'data_scientist';
  is_experimental?: boolean;
  estimated_row_count?: number;
  multi_product_delivery?: boolean;
}

interface DecisionScores {
  sqlmesh: number;
  dbt: number;
  sqlmesh_reasons: string[];
  dbt_reasons: string[];
  sqlmesh_features: string[];
  dbt_features: string[];
}

// Export singleton instance
export const toolRouter = new IntelligentToolRouter();
