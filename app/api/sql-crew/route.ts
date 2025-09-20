import { NextRequest, NextResponse } from 'next/server';

// CrewAI backend URL (adjust if different)
const CREW_BACKEND_URL = process.env.CREW_BACKEND_URL || 'http://localhost:8000';

interface QueryOptimizationRequest {
  prompt: string;
  currentSQL?: string;
  databases?: string[];
  dialect?: 'trino' | 'mysql' | 'postgresql' | 'snowflake';
  mode?: 'optimize' | 'validate' | 'alternatives';
}

interface EnhancedSQLResponse {
  sql: string;
  analysis?: {
    performance: string;
    cost: number;
    recommendations: string[];
    complexity_score?: number;
  };
  alternatives?: Array<{
    sql: string;
    description: string;
    pros: string[];
    cons: string[];
  }>;
  validation?: {
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    security_issues: string[];
  };
  metadata: {
    confidence: number;
    source: 'crew' | 'simulation';
    processing_time_ms: number;
    agents_used: string[];
  };
}

/**
 * Call CrewAI backend for SQL optimization
 */
async function callCrewAI(
  endpoint: string, 
  payload: any
): Promise<any> {
  try {
    const response = await fetch(`${CREW_BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`CrewAI error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('CrewAI backend error:', error);
    throw error;
  }
}

/**
 * Main endpoint for CrewAI SQL operations
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const req: QueryOptimizationRequest = await request.json();
    const { prompt, currentSQL, databases, dialect = 'trino', mode = 'optimize' } = req;

    // Prepare CrewAI request
    const crewRequest = {
      natural_language: prompt,
      current_sql: currentSQL,
      target_databases: databases || ['production'],
      dialect: dialect,
      context: {
        user_level: 'expert',
        optimization_goal: 'balanced', // balance between performance and cost
        include_alternatives: mode === 'alternatives',
        validate_syntax: mode === 'validate'
      }
    };

    let result: EnhancedSQLResponse;

    // Route to appropriate CrewAI endpoint based on mode
    switch (mode) {
      case 'validate':
        const validationResult = await callCrewAI(
          '/api/crews/query-optimization/validate',
          crewRequest
        );
        
        result = {
          sql: currentSQL || '',
          validation: {
            is_valid: validationResult.validation?.is_valid || false,
            errors: validationResult.validation?.errors || [],
            warnings: validationResult.validation?.warnings || [],
            security_issues: validationResult.validation?.security_issues || []
          },
          metadata: {
            confidence: validationResult.confidence || 0.8,
            source: validationResult.simulated ? 'simulation' : 'crew',
            processing_time_ms: Date.now() - startTime,
            agents_used: ['Validation Agent', 'Security Analyst']
          }
        };
        break;

      case 'alternatives':
        const alternativesResult = await callCrewAI(
          '/api/crews/query-optimization/alternatives',
          crewRequest
        );
        
        result = {
          sql: alternativesResult.primary_query?.sql || currentSQL || '',
          alternatives: alternativesResult.alternatives || [],
          analysis: {
            performance: alternativesResult.analysis?.performance || 'Standard performance',
            cost: alternativesResult.analysis?.estimated_cost || 0,
            recommendations: alternativesResult.analysis?.recommendations || [],
            complexity_score: alternativesResult.analysis?.complexity_score
          },
          metadata: {
            confidence: alternativesResult.confidence || 0.85,
            source: alternativesResult.simulated ? 'simulation' : 'crew',
            processing_time_ms: Date.now() - startTime,
            agents_used: ['SQL Generation Specialist', 'Performance Tuning Expert']
          }
        };
        break;

      case 'optimize':
      default:
        const optimizationResult = await callCrewAI(
          '/api/crews/query-optimization/optimize',
          crewRequest
        );
        
        // Extract the optimized SQL from CrewAI response
        const optimizedSQL = optimizationResult.optimization_result?.generated_query?.sql || 
                           optimizationResult.generated_sql ||
                           generateFallbackSQL(prompt, databases);
        
        result = {
          sql: optimizedSQL,
          analysis: {
            performance: optimizationResult.optimization_result?.performance_analysis?.optimized_plan || 
                        'Query optimized for performance',
            cost: optimizationResult.optimization_result?.cost_estimation?.optimized_cost || 0,
            recommendations: extractRecommendations(optimizationResult),
            complexity_score: optimizationResult.optimization_result?.generated_query?.complexity_score
          },
          metadata: {
            confidence: optimizationResult.confidence || 0.9,
            source: optimizationResult.success ? 'crew' : 'simulation',
            processing_time_ms: Date.now() - startTime,
            agents_used: [
              'SQL Generation Specialist',
              'Performance Tuning Expert',
              'Cost Estimation Analyst',
              'Documentation Specialist'
            ]
          }
        };
        break;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('SQL CrewAI Error:', error);
    
    // Get request data for error handling
    const requestData = await request.json().catch(() => ({ prompt: 'SELECT * FROM table' }));
    
    // Return a helpful error response with fallback SQL
    const fallbackSQL = generateFallbackSQL(
      requestData.prompt || 'SELECT * FROM table',
      requestData.databases
    );
    
    return NextResponse.json({
      sql: fallbackSQL,
      analysis: {
        performance: 'Fallback mode - basic optimization applied',
        cost: 0,
        recommendations: ['CrewAI backend unavailable - using fallback generator'],
      },
      metadata: {
        confidence: 0.5,
        source: 'simulation' as const,
        processing_time_ms: Date.now() - startTime,
        agents_used: []
      }
    } as EnhancedSQLResponse);
  }
}

/**
 * Extract recommendations from CrewAI response
 */
function extractRecommendations(result: any): string[] {
  const recommendations: string[] = [];
  
  // Extract from performance analysis
  if (result.optimization_result?.performance_analysis?.recommendations) {
    result.optimization_result.performance_analysis.recommendations.forEach((rec: any) => {
      recommendations.push(`${rec.type}: ${rec.description} (Impact: ${rec.impact})`);
    });
  }
  
  // Add cost optimization if significant
  const costSavings = result.optimization_result?.cost_estimation?.optimization_potential?.savings_percentage;
  if (costSavings && costSavings > 20) {
    recommendations.push(`Cost Optimization: Potential ${costSavings}% cost reduction`);
  }
  
  // Add generic recommendations if none found
  if (recommendations.length === 0) {
    recommendations.push('Consider adding appropriate indexes');
    recommendations.push('Review query execution plan');
    recommendations.push('Monitor query performance in production');
  }
  
  return recommendations;
}

/**
 * Fallback SQL generator (reused from tisql-ai)
 */
function generateFallbackSQL(prompt: string, databases?: string[] | null): string {
  const lowerPrompt = prompt.toLowerCase();
  const dbName = databases?.[0] || 'production';
  
  // Complex query patterns for CrewAI fallback
  if (lowerPrompt.includes('optimize') || lowerPrompt.includes('performance')) {
    return `-- Performance-optimized query
WITH indexed_data AS (
  SELECT /*+ INDEX(t1 idx_primary) */
    t1.id,
    t1.name,
    t1.value,
    ROW_NUMBER() OVER (PARTITION BY t1.category ORDER BY t1.created_at DESC) as rn
  FROM ${dbName}.main_table t1
  WHERE t1.status = 'active'
    AND t1.created_at >= CURRENT_DATE - INTERVAL '30' DAY
)
SELECT 
  id,
  name,
  value,
  category
FROM indexed_data
WHERE rn <= 10
ORDER BY value DESC;`;
  }
  
  // Return basic pattern-matched SQL
  return `-- Generated SQL for: ${prompt}
SELECT *
FROM ${dbName}.your_table
WHERE conditions = true
ORDER BY created_at DESC
LIMIT 100;`;
}

// Health check endpoint
export async function GET() {
  try {
    // Check CrewAI backend health
    const response = await fetch(`${CREW_BACKEND_URL}/health`);
    const isHealthy = response.ok;
    
    return NextResponse.json({
      service: 'SQL CrewAI Integration',
      status: isHealthy ? 'operational' : 'degraded',
      backend_url: CREW_BACKEND_URL,
      available_modes: ['optimize', 'validate', 'alternatives'],
      agents: [
        'SQL Generation Specialist',
        'Performance Tuning Expert', 
        'Cost Estimation Analyst',
        'Documentation Specialist'
      ]
    });
  } catch (error) {
    return NextResponse.json({
      service: 'SQL CrewAI Integration',
      status: 'error',
      error: error instanceof Error ? error.message : 'Backend unreachable'
    }, { status: 503 });
  }
}