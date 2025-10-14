/**
 * Living Context Graph Client
 * Service for querying LCG data to enhance chat agent responses
 */

import {
  ChatAgentQueryRequest,
  ChatAgentQueryResponse,
  UsagePattern,
  IntentContext,
  extractCommonFilters,
  identifyQualityGaps,
  calculateSuccessRate
} from '@/lib/types/living-context-graph';

/**
 * Query Living Context Graph for product context
 */
export async function queryLivingContextGraph(
  request: ChatAgentQueryRequest
): Promise<ChatAgentQueryResponse> {
  try {
    const response = await fetch('/api/context/chat-agent-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`LCG query failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to query Living Context Graph:', error);
    // Return empty context on failure
    return {
      productId: request.productId,
      intentContext: [],
      usagePatterns: [],
      semanticBridges: [],
      dataQuality: null,
      metadata: {
        totalIntents: 0,
        totalUsagePatterns: 0,
        totalSemanticBridges: 0,
        totalQueries: 0,
        uniqueUsers: 0,
        avgConfidence: 0,
        estimatedSuccessRate: 0,
        hasQualityData: false,
      },
    };
  }
}

/**
 * Enhance chat response with LCG evidence
 */
export interface EnhancedChatContext {
  hasEvidence: boolean;
  usageEvidence: {
    totalUsers: number;
    totalQueries: number;
    successRate: number;
    commonFilters: string[];
    commonUseCases: string[];
  };
  qualityContext: {
    hasGaps: boolean;
    avgGap: number;
    expectedQuality: number;
    actualQuality: number;
    blockers: string[];
  };
  recommendations: {
    alternativeProducts: Array<{
      productId: string;
      confidence: number;
      explanation: string;
    }>;
  };
}

export async function getEnhancedChatContext(
  productId: string,
  domain?: string
): Promise<EnhancedChatContext> {
  const lcgData = await queryLivingContextGraph({
    productId,
    domain,
    includeUsagePatterns: true,
    includeIntentContext: true,
    includeSemanticBridges: true,
    limit: 10,
  });

  // Extract usage evidence
  const commonFilters = extractCommonFilters(lcgData.usagePatterns);
  const successRate = calculateSuccessRate(lcgData.usagePatterns);
  const commonUseCases = extractCommonUseCases(lcgData.usagePatterns);

  // Extract quality context
  const qualityGaps = identifyQualityGaps(lcgData.intentContext);
  const avgExpectedQuality = calculateAvgExpectedQuality(lcgData.intentContext);
  const avgActualQuality = calculateAvgActualQuality(lcgData.intentContext);
  const allBlockers = extractAllBlockers(lcgData.intentContext);

  // Extract alternative product recommendations
  const alternativeProducts = lcgData.semanticBridges
    .filter(bridge => bridge.confidence > 0.7)
    .slice(0, 3)
    .map(bridge => ({
      productId: bridge.sourceId === productId ? bridge.targetId : bridge.sourceId,
      confidence: bridge.confidence,
      explanation: bridge.explanation,
    }));

  return {
    hasEvidence: lcgData.metadata.totalUsagePatterns > 0 || lcgData.metadata.totalIntents > 0,
    usageEvidence: {
      totalUsers: lcgData.metadata.uniqueUsers,
      totalQueries: lcgData.metadata.totalQueries,
      successRate,
      commonFilters,
      commonUseCases,
    },
    qualityContext: {
      hasGaps: qualityGaps.hasGaps,
      avgGap: qualityGaps.avgGap,
      expectedQuality: avgExpectedQuality,
      actualQuality: avgActualQuality,
      blockers: allBlockers,
    },
    recommendations: {
      alternativeProducts,
    },
  };
}

/**
 * Generate evidence-based response enhancement
 */
export function generateEvidenceText(context: EnhancedChatContext): string {
  const parts: string[] = [];

  // Usage evidence
  if (context.usageEvidence.totalQueries > 0) {
    parts.push(
      `📊 **Usage Validation**: Used by ${context.usageEvidence.totalUsers} analysts with ${context.usageEvidence.totalQueries} successful queries (${context.usageEvidence.successRate.toFixed(0)}% success rate)`
    );
  }

  // Common filters
  if (context.usageEvidence.commonFilters.length > 0) {
    parts.push(
      `🔍 **Common Filters** (from real usage patterns):\n${context.usageEvidence.commonFilters.map(f => `  • ${f}`).join('\n')}`
    );
  }

  // Quality gaps
  if (context.qualityContext.hasGaps) {
    parts.push(
      `⚠️ **Quality Gap Detected**: Expected ${(context.qualityContext.expectedQuality * 100).toFixed(0)}%, Actual ${(context.qualityContext.actualQuality * 100).toFixed(0)}% (Gap: ${(context.qualityContext.avgGap * 100).toFixed(0)}%)`
    );

    if (context.qualityContext.blockers.length > 0) {
      parts.push(
        `**Known Issues**:\n${context.qualityContext.blockers.map(b => `  • ${b}`).join('\n')}`
      );
    }
  } else if (context.qualityContext.actualQuality > 0) {
    parts.push(
      `✅ **Quality Validated**: ${(context.qualityContext.actualQuality * 100).toFixed(0)}% meets expectations`
    );
  }

  // Alternative products
  if (context.recommendations.alternativeProducts.length > 0) {
    parts.push(
      `💡 **Alternative Products**:\n${context.recommendations.alternativeProducts.map(
        p => `  • ${p.productId} (${(p.confidence * 100).toFixed(0)}% confidence): ${p.explanation}`
      ).join('\n')}`
    );
  }

  return parts.join('\n\n');
}

// Helper functions

function extractCommonUseCases(patterns: UsagePattern[]): string[] {
  const useCases = patterns
    .map(p => p.inferredUseCase)
    .filter((uc): uc is string => uc !== undefined && uc !== null);

  // Count occurrences
  const useCaseCount = new Map<string, number>();
  useCases.forEach(uc => {
    useCaseCount.set(uc, (useCaseCount.get(uc) || 0) + 1);
  });

  // Return top 3 use cases
  return Array.from(useCaseCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([uc]) => uc);
}

function calculateAvgExpectedQuality(intents: IntentContext[]): number {
  if (intents.length === 0) return 0;

  const sum = intents.reduce(
    (acc, intent) => acc + (intent.expectedQuality?.qualityScore || 0),
    0
  );

  return sum / intents.length;
}

function calculateAvgActualQuality(intents: IntentContext[]): number {
  const intentsWithActual = intents.filter(i => i.actualQuality?.qualityScore);

  if (intentsWithActual.length === 0) return 0;

  const sum = intentsWithActual.reduce(
    (acc, intent) => acc + (intent.actualQuality?.qualityScore || 0),
    0
  );

  return sum / intentsWithActual.length;
}

function extractAllBlockers(intents: IntentContext[]): string[] {
  const allBlockers = new Set<string>();

  intents.forEach(intent => {
    intent.blockers.forEach(blocker => allBlockers.add(blocker));
  });

  return Array.from(allBlockers);
}
