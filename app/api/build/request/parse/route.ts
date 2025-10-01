/**
 * Request Parsing API
 *
 * Parses natural language data product requests and extracts:
 * - Business need and use case
 * - Data requirements (schema hints)
 * - SLA requirements (freshness, availability)
 * - Quality requirements
 * - Stakeholders
 */

import { NextRequest, NextResponse } from 'next/server';

interface ParsedRequest {
  success: boolean;
  extracted?: {
    business_need: string;
    use_case: string;
    namespace: string;
    contract_name: string;
    inferred_schema: Array<{
      name: string;
      type: string;
      description: string;
    }>;
    sla: {
      freshness: string;
      availability: number;
      latency: string;
      criticality: 'low' | 'medium' | 'high' | 'critical';
    };
    quality_requirements: Array<{
      metric: string;
      threshold: string;
      description: string;
    }>;
    delivery_hints: string[];
    requester: string;
    stakeholders: string[];
  };
  confidence: 'low' | 'medium' | 'high';
  clarification_needed?: string[];
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { description, requester, context } = await req.json();

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    // Parse the natural language description
    const parsed = await parseNaturalLanguageRequest(description, requester, context);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Request parsing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse request'
      },
      { status: 500 }
    );
  }
}

/**
 * Parse natural language request using pattern matching and NLP
 */
async function parseNaturalLanguageRequest(
  description: string,
  requester?: string,
  context?: any
): Promise<ParsedRequest> {
  const lowercaseDesc = description.toLowerCase();

  // Extract key components using pattern matching
  const extracted = {
    business_need: extractBusinessNeed(lowercaseDesc),
    use_case: extractUseCase(lowercaseDesc),
    namespace: extractNamespace(lowercaseDesc, context),
    contract_name: extractContractName(lowercaseDesc),
    inferred_schema: inferSchema(lowercaseDesc),
    sla: extractSLA(lowercaseDesc),
    quality_requirements: extractQualityRequirements(lowercaseDesc),
    delivery_hints: extractDeliveryHints(lowercaseDesc),
    requester: requester || 'unknown',
    stakeholders: extractStakeholders(lowercaseDesc, context)
  };

  // Determine confidence level
  const confidence = calculateConfidence(extracted);

  // Identify what needs clarification
  const clarification_needed = identifyClarifications(extracted);

  return {
    success: true,
    extracted,
    confidence,
    clarification_needed: clarification_needed.length > 0 ? clarification_needed : undefined
  };
}

function extractBusinessNeed(description: string): string {
  const patterns = {
    churn: /churn|retention|attrition/,
    segmentation: /segment|group|cluster|cohort/,
    scoring: /score|rank|predict|forecast/,
    attribution: /attribution|source|channel/,
    analytics: /analytic|insight|report|dashboard/,
    monitoring: /monitor|track|watch|observe/
  };

  for (const [need, pattern] of Object.entries(patterns)) {
    if (pattern.test(description)) {
      return need;
    }
  }

  return 'general_analytics';
}

function extractUseCase(description: string): string {
  const useCasePatterns = [
    { pattern: /marketing campaign|campaign targeting/i, useCase: 'Marketing campaign targeting' },
    { pattern: /customer analytics|customer insight/i, useCase: 'Customer analytics' },
    { pattern: /revenue|financial|billing/i, useCase: 'Financial reporting' },
    { pattern: /product usage|feature adoption/i, useCase: 'Product analytics' },
    { pattern: /supply chain|inventory/i, useCase: 'Supply chain optimization' }
  ];

  for (const { pattern, useCase } of useCasePatterns) {
    if (pattern.test(description)) {
      return useCase;
    }
  }

  return 'Data analysis and insights';
}

function extractNamespace(description: string, context?: any): string {
  if (context?.namespace) return context.namespace;

  const namespacePatterns = [
    { pattern: /customer|crm/i, namespace: 'customer_analytics' },
    { pattern: /product|feature/i, namespace: 'product_analytics' },
    { pattern: /revenue|financial|sales/i, namespace: 'revenue_analytics' },
    { pattern: /marketing|campaign/i, namespace: 'marketing_analytics' },
    { pattern: /supply|inventory|logistics/i, namespace: 'supply_chain' }
  ];

  for (const { pattern, namespace } of namespacePatterns) {
    if (pattern.test(description)) {
      return namespace;
    }
  }

  return 'general';
}

function extractContractName(description: string): string {
  const namePatterns = [
    { pattern: /churn.*score/i, name: 'customer_churn_score' },
    { pattern: /customer.*segment/i, name: 'customer_segments' },
    { pattern: /revenue|sales/i, name: 'revenue_metrics' },
    { pattern: /product.*usage/i, name: 'product_usage_metrics' }
  ];

  for (const { pattern, name } of namePatterns) {
    if (pattern.test(description)) {
      return name;
    }
  }

  return 'data_product';
}

function inferSchema(description: string): Array<{ name: string; type: string; description: string }> {
  const schema: Array<{ name: string; type: string; description: string }> = [];

  // Common ID field
  if (/customer/i.test(description)) {
    schema.push({ name: 'customer_id', type: 'string', description: 'Unique customer identifier' });
  } else if (/user/i.test(description)) {
    schema.push({ name: 'user_id', type: 'string', description: 'Unique user identifier' });
  }

  // Score/prediction field
  if (/score|predict/i.test(description)) {
    if (/churn/i.test(description)) {
      schema.push({ name: 'churn_risk', type: 'float', description: 'Churn probability score [0,1]' });
    } else {
      schema.push({ name: 'score', type: 'float', description: 'Calculated score' });
    }
  }

  // Timestamp field
  schema.push({ name: 'calculated_at', type: 'timestamp', description: 'Calculation timestamp' });

  // Additional fields based on context
  if (/factor|reason|attribute/i.test(description)) {
    schema.push({ name: 'attributes', type: 'array<string>', description: 'Contributing factors' });
  }

  if (/category|segment|group/i.test(description)) {
    schema.push({ name: 'category', type: 'string', description: 'Classification category' });
  }

  return schema;
}

function extractSLA(description: string): {
  freshness: string;
  availability: number;
  latency: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
} {
  let freshness = '24 hours';
  let latency = '1 hour';
  let criticality: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let availability = 0.99;

  // Freshness detection
  if (/real-time|realtime|streaming/i.test(description)) {
    freshness = '5 minutes';
    criticality = 'high';
  } else if (/hourly|every hour/i.test(description)) {
    freshness = '1 hour';
  } else if (/daily|every day|8 am|morning/i.test(description)) {
    freshness = '24 hours';
  } else if (/weekly/i.test(description)) {
    freshness = '7 days';
  }

  // Criticality detection
  if (/critical|mission.critical|must|require/i.test(description)) {
    criticality = 'high';
    availability = 0.999;
  } else if (/important|priority/i.test(description)) {
    criticality = 'medium';
    availability = 0.99;
  }

  // Latency based on freshness
  if (freshness === '5 minutes') {
    latency = '1 minute';
  } else if (freshness === '1 hour') {
    latency = '15 minutes';
  } else if (freshness === '24 hours') {
    latency = '2 hours';
  }

  return { freshness, availability, latency, criticality };
}

function extractQualityRequirements(description: string): Array<{
  metric: string;
  threshold: string;
  description: string;
}> {
  const requirements: Array<{ metric: string; threshold: string; description: string }> = [];

  // Accuracy requirements
  const accuracyMatch = description.match(/(\d+)%?\s*accuracy/i);
  if (accuracyMatch) {
    requirements.push({
      metric: 'accuracy',
      threshold: `>${accuracyMatch[1]}%`,
      description: `Model accuracy must exceed ${accuracyMatch[1]}%`
    });
  }

  // Completeness requirements
  if (/complete|no missing|required/i.test(description)) {
    requirements.push({
      metric: 'completeness',
      threshold: '>99%',
      description: 'Required fields must have >99% completeness'
    });
  }

  // Uniqueness requirements
  if (/unique|distinct|no duplicate/i.test(description)) {
    requirements.push({
      metric: 'uniqueness',
      threshold: '100%',
      description: 'Key fields must be unique'
    });
  }

  return requirements;
}

function extractDeliveryHints(description: string): string[] {
  const hints: string[] = [];

  if (/sql|table|query/i.test(description)) {
    hints.push('batch_sql');
  }
  if (/api|endpoint|rest/i.test(description)) {
    hints.push('api');
  }
  if (/stream|kafka|real-time/i.test(description)) {
    hints.push('streaming');
  }
  if (/dashboard|report|analytics/i.test(description)) {
    hints.push('batch_sql');
  }

  // Default to batch if no hints
  if (hints.length === 0) {
    hints.push('batch_sql');
  }

  return hints;
}

function extractStakeholders(description: string, context?: any): string[] {
  if (context?.stakeholders) return context.stakeholders;

  const stakeholders: string[] = [];

  if (/marketing/i.test(description)) stakeholders.push('marketing-team@company.com');
  if (/sales/i.test(description)) stakeholders.push('sales-team@company.com');
  if (/product/i.test(description)) stakeholders.push('product-team@company.com');
  if (/finance/i.test(description)) stakeholders.push('finance-team@company.com');

  return stakeholders;
}

function calculateConfidence(extracted: any): 'low' | 'medium' | 'high' {
  let score = 0;

  if (extracted.inferred_schema.length >= 3) score++;
  if (extracted.quality_requirements.length > 0) score++;
  if (extracted.sla.criticality !== 'medium') score++;
  if (extracted.namespace !== 'general') score++;
  if (extracted.contract_name !== 'data_product') score++;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function identifyClarifications(extracted: any): string[] {
  const needed: string[] = [];

  if (extracted.inferred_schema.length < 3) {
    needed.push('schema_details');
  }
  if (extracted.quality_requirements.length === 0) {
    needed.push('quality_requirements');
  }
  if (extracted.namespace === 'general') {
    needed.push('business_domain');
  }

  return needed;
}
