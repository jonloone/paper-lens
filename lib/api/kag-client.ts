/**
 * KAG Intelligence API Client
 * Interfaces with backend AI services for unified build flow
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DetectIntentRequest {
  description: string;
  context?: Record<string, any>;
}

export interface DetectIntentResponse {
  success: boolean;
  detected_type: 'source' | 'entity' | 'solution';
  confidence: number;
  reasoning: string[];
  suggested_fields: Record<string, any>;
  timestamp: string;
}

/**
 * Detect product type from natural language description
 */
export async function detectIntent(
  request: DetectIntentRequest
): Promise<DetectIntentResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/kag/detect-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Intent detection failed:', error);

    // Fallback to client-side detection if backend fails
    return fallbackDetection(request.description);
  }
}

/**
 * Fallback client-side detection if backend is unavailable
 */
function fallbackDetection(description: string): DetectIntentResponse {
  const lower = description.toLowerCase();

  const foundationKeywords = ['connect', 'stream', 'database', 'source', 'sync', 'ingest'];
  const domainKeywords = ['customer', 'product', 'order', 'entity', 'profile', 'model'];
  const solutionKeywords = ['predict', 'churn', 'score', 'analytics', 'metric', 'dashboard'];

  const foundationScore = foundationKeywords.filter(k => lower.includes(k)).length;
  const domainScore = domainKeywords.filter(k => lower.includes(k)).length;
  const solutionScore = solutionKeywords.filter(k => lower.includes(k)).length;

  let detected_type: 'source' | 'entity' | 'solution' = 'solution';
  let confidence = 0.65;
  let reasoning: string[] = ['Using client-side fallback detection'];

  if (foundationScore > domainScore && foundationScore > solutionScore) {
    detected_type = 'source';
    confidence = Math.min(0.85, 0.6 + foundationScore * 0.1);
    reasoning.push('Detected foundation-related keywords');
  } else if (domainScore > foundationScore && domainScore > solutionScore) {
    detected_type = 'entity';
    confidence = Math.min(0.85, 0.6 + domainScore * 0.1);
    reasoning.push('Detected domain entity keywords');
  } else {
    reasoning.push('Defaulting to solution product');
  }

  return {
    success: true,
    detected_type,
    confidence,
    reasoning,
    suggested_fields: {},
    timestamp: new Date().toISOString(),
  };
}
