/**
 * Living Context Graph Types
 * Type definitions for LCG queries used by the domain-aware chat agent
 */

export interface IntentContext {
  intentId: string;
  stakeholder: {
    name: string;
    department: string;
  };
  businessNeed: string;
  keywords: string[];
  expectedQuality: {
    qualityScore: number;
    freshnessHours: number;
    completeness: number;
  };
  actualQuality?: {
    qualityScore: number;
  };
  qualityGap?: number;
  blockers: string[];
  useCases: string[];
  createdAt: string | null;
}

export interface UsagePattern {
  patternId: string;
  user: {
    id: string;
    department: string;
    role: string;
  };
  queryCount: number;
  firstAccess: string | null;
  lastAccess: string | null;
  typicalFilters: string[];
  typicalAggregations: string[];
  typicalJoins: string[];
  avgRowCount?: number;
  avgExecutionTimeMs?: number;
  inferredUseCase?: string;
  confidence?: number;
  businessImpact?: string;
  downstreamDependencies: string[];
}

export interface SemanticBridge {
  bridgeId: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
  confidence: number;
  evidence: string[];
  strength: number;
  explanation: string;
  useCount: number;
  successRate?: number;
}

export interface DataQualitySummary {
  rowCount?: number;
  completeness?: number;
  qualityScore?: number;
  lastProfiled?: string | null;
}

export interface ChatAgentQueryRequest {
  productId: string;
  domain?: string;
  includeUsagePatterns?: boolean;
  includeIntentContext?: boolean;
  includeSemanticBridges?: boolean;
  limit?: number;
}

export interface DomainKnowledge {
  domain: string;
  keyMetrics: DomainConcept[];
  businessConcepts: DomainConcept[];
  source: string;
  retrievedAt: string;
}

export interface DomainConcept {
  name: string;
  definition: string;
  relatedConcepts: string[];
  confidence: number;
  source: string;
}

export interface ChatAgentQueryResponse {
  productId: string;
  intentContext: IntentContext[];
  usagePatterns: UsagePattern[];
  semanticBridges: SemanticBridge[];
  domainKnowledge: DomainKnowledge | null;
  dataQuality: DataQualitySummary | null;
  metadata: {
    totalIntents: number;
    totalUsagePatterns: number;
    totalSemanticBridges: number;
    totalQueries: number;
    uniqueUsers: number;
    avgConfidence: number;
    estimatedSuccessRate: number;
    hasQualityData: boolean;
    hasDomainKnowledge: boolean;
  };
}

/**
 * Helper function to format usage patterns into human-readable text
 */
export function formatUsagePattern(pattern: UsagePattern): string {
  const parts: string[] = [];

  if (pattern.queryCount > 0) {
    parts.push(`${pattern.queryCount} queries`);
  }

  if (pattern.user.department) {
    parts.push(`from ${pattern.user.department}`);
  }

  if (pattern.inferredUseCase) {
    parts.push(`for ${pattern.inferredUseCase}`);
  }

  return parts.join(' ');
}

/**
 * Helper function to calculate success rate from usage patterns
 */
export function calculateSuccessRate(patterns: UsagePattern[]): number {
  if (patterns.length === 0) return 0;

  const successfulPatterns = patterns.filter(p => p.queryCount > 5);
  return (successfulPatterns.length / patterns.length) * 100;
}

/**
 * Helper function to extract common filters from usage patterns
 */
export function extractCommonFilters(patterns: UsagePattern[]): string[] {
  const filterCount = new Map<string, number>();

  patterns.forEach(pattern => {
    pattern.typicalFilters.forEach(filter => {
      filterCount.set(filter, (filterCount.get(filter) || 0) + 1);
    });
  });

  // Return filters used by at least 30% of patterns
  const threshold = patterns.length * 0.3;
  return Array.from(filterCount.entries())
    .filter(([_, count]) => count >= threshold)
    .map(([filter]) => filter)
    .sort((a, b) => (filterCount.get(b) || 0) - (filterCount.get(a) || 0));
}

/**
 * Helper function to identify quality gaps from intent context
 */
export function identifyQualityGaps(intents: IntentContext[]): {
  hasGaps: boolean;
  avgGap: number;
  criticalGaps: IntentContext[];
} {
  const intentsWithGaps = intents.filter(i => i.qualityGap && i.qualityGap > 0);

  if (intentsWithGaps.length === 0) {
    return {
      hasGaps: false,
      avgGap: 0,
      criticalGaps: []
    };
  }

  const avgGap = intentsWithGaps.reduce((sum, i) => sum + (i.qualityGap || 0), 0) / intentsWithGaps.length;
  const criticalGaps = intentsWithGaps.filter(i => (i.qualityGap || 0) > 0.1);

  return {
    hasGaps: true,
    avgGap,
    criticalGaps
  };
}
