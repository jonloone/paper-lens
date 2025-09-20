/**
 * CrewAI Service
 * Integrates with Python CrewAI backend for intelligent agent orchestration
 */

export interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  message: string;
  source: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PrioritizedAlert extends Alert {
  priority_rank: number;
  priority_score: number;
  urgency_score: number;
  business_impact_score: number;
  cascade_risk_score: number;
  resolution_effort_score: number;
  consensus_confidence: number;
  recommendations: Array<{
    action: string;
    reason: string;
    suggested_team?: string;
    affected_systems?: string[];
    estimated_time?: string;
  }>;
  crew_analysis: {
    analyzed_at: string;
    crew: string;
    consensus_method: string;
    agents_consulted: number;
  };
}

export interface PerformanceIssue {
  issue_type: string;
  description: string;
  metrics: Record<string, any>;
  affected_systems: string[];
  context?: Record<string, any>;
}

export interface Optimization {
  id: string;
  type: string;
  description: string;
  expected_impact: string;
  effort: 'low' | 'medium' | 'high';
  confidence: number;
  implementation_steps: string[];
}

export interface ArbitronMetrics {
  total_calls: number;
  cost_today: number;
  cache_hit_rate: number;
  latency_p95: number;
  model_distribution: Record<string, number>;
  recommendations: string[];
  model_used?: string;
  cost?: number;
  latency_ms?: number;
  from_cache?: boolean;
}

export interface CrewMetrics {
  total_executions: number;
  success_rate: number;
  avg_confidence: number;
  recent_executions: any[];
}

export interface CrewInfo {
  name: string;
  strategy: string;
  agents: number;
  description: string;
  metrics: CrewMetrics;
}

// ReAct-specific types
export interface ReActStep {
  type: 'thought' | 'action' | 'observation';
  content: string;
  timestamp: string;
  confidence?: number;
  tool_used?: string;
}

export interface ReActResponse {
  success: boolean;
  sql?: string;
  reasoning_trace: ReActStep[];
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  };
  performance?: {
    estimated_time_ms: number;
    complexity_score: number;
    recommendations: string[];
  };
  pattern: string;
  timestamp: string;
  arbitron_metrics?: ArbitronMetrics;
}

export interface ReActSQLRequest {
  natural_language: string;
  current_sql?: string;
  target_databases?: string[];
  dialect?: string;
  context?: Record<string, any>;
}

export interface ReActOptimizationRequest {
  sql: string;
  context?: Record<string, any>;
  performance_goal?: string;
  data_size?: string;
}

export class CrewAIService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    // Use proxy API route when in browser to avoid CORS issues
    if (typeof window !== 'undefined') {
      this.baseUrl = '/api/crewai-proxy';
    } else {
      this.baseUrl = process.env.NEXT_PUBLIC_CREWAI_API_URL || 'http://137.220.61.218:8001';
    }
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Check health of CrewAI backend
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    crews_available: string[];
    arbitron_status: string;
  }> {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Prioritize alerts using System Health Crew
   */
  async prioritizeAlerts(alerts: Alert[]): Promise<{
    prioritized_alerts: PrioritizedAlert[];
    arbitron_metrics: ArbitronMetrics;
  }> {
    const response = await fetch(
      `${this.baseUrl}/api/crews/system-health/prioritize`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ alerts }),
      }
    );

    if (!response.ok) {
      throw new Error(`Alert prioritization failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Track Arbitron usage
    this.trackArbitronUsage(result.arbitron_metrics);
    
    return {
      prioritized_alerts: result.result,
      arbitron_metrics: result.arbitron_metrics,
    };
  }

  /**
   * Analyze performance issue using Performance Analysis Crew
   */
  async analyzePerformance(issue: PerformanceIssue): Promise<{
    optimizations: Optimization[];
    arbitron_metrics: ArbitronMetrics;
  }> {
    const response = await fetch(
      `${this.baseUrl}/api/crews/performance/analyze`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(issue),
      }
    );

    if (!response.ok) {
      throw new Error(`Performance analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Track Arbitron usage
    this.trackArbitronUsage(result.arbitron_metrics);
    
    return {
      optimizations: result.result,
      arbitron_metrics: result.arbitron_metrics,
    };
  }

  /**
   * Get Arbitron metrics and usage statistics
   */
  async getArbitronMetrics(): Promise<ArbitronMetrics> {
    const response = await fetch(`${this.baseUrl}/api/arbitron/metrics`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get Arbitron metrics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get cost metrics for a specific crew
   */
  async getCrewCost(crewName: string): Promise<{
    total_calls: number;
    total_cost: number;
    total_tokens: number;
    avg_cost_per_call: number;
    avg_tokens_per_call: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/api/arbitron/cost/${crewName}`,
      {
        method: 'GET',
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get crew cost: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  async invalidateCache(pattern: string): Promise<{
    invalidated: number;
    pattern: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/api/arbitron/cache/invalidate`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ pattern }),
      }
    );

    if (!response.ok) {
      throw new Error(`Cache invalidation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List available crews and their capabilities
   */
  async listCrews(): Promise<CrewInfo[]> {
    const response = await fetch(`${this.baseUrl}/api/crews`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to list crews: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Execute a crew's primary task
   */
  async executeCrew(
    crewName: string,
    context: Record<string, any>
  ): Promise<{
    crew: string;
    result: any;
    timestamp: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/api/crews/${crewName}/execute`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(context),
      }
    );

    if (!response.ok) {
      throw new Error(`Crew execution failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get System Health Crew metrics
   */
  async getSystemHealthMetrics(): Promise<CrewMetrics> {
    const response = await fetch(
      `${this.baseUrl}/api/crews/system-health/metrics`,
      {
        method: 'GET',
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get metrics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Track Arbitron usage for monitoring
   */
  private trackArbitronUsage(metrics: ArbitronMetrics) {
    // Log to console for development
    console.log('Arbitron Usage:', {
      model: metrics.model_used,
      cost: metrics.cost,
      latency: metrics.latency_ms,
      cached: metrics.from_cache,
    });

    // In production, send to analytics service
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Arbitron LLM Usage', {
        model: metrics.model_used,
        cost: metrics.cost,
        latency_ms: metrics.latency_ms,
        from_cache: metrics.from_cache,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Format priority score for display
   */
  formatPriorityScore(score: number): string {
    if (score >= 8) return 'Critical';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  }

  /**
   * Get priority color based on score
   */
  getPriorityColor(score: number): string {
    if (score >= 8) return 'destructive';
    if (score >= 6) return 'warning';
    if (score >= 4) return 'secondary';
    return 'default';
  }

  /**
   * Analyze a data source connection using Connection Analysis Crew
   */
  async analyzeConnection(params: {
    connection_type: string;
    connection_details: Record<string, any>;
    target_system?: string;
    requirements?: string[];
  }): Promise<ConnectionAnalysisResult> {
    // Use enhanced proxy for connection analysis
    const baseUrl = typeof window !== 'undefined' 
      ? '/api/enhanced-proxy'
      : 'http://137.220.61.218:8002';
      
    const response = await fetch(
      `${baseUrl}/api/crews/connection-analysis/analyze`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      throw new Error(`Connection analysis failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Compare multiple data source connections
   */
  async compareConnections(sources: Array<{
    name: string;
    connection_type: string;
    connection_details: Record<string, any>;
    target_system?: string;
  }>): Promise<ConnectionComparisonResult> {
    // Use enhanced proxy for connection analysis
    const baseUrl = typeof window !== 'undefined' 
      ? '/api/enhanced-proxy'
      : 'http://137.220.61.218:8002';
      
    const response = await fetch(
      `${baseUrl}/api/crews/connection-analysis/compare`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ sources }),
      }
    );

    if (!response.ok) {
      throw new Error(`Connection comparison failed: ${response.statusText}`);
    }

    return response.json();
  }

  // ReAct-specific methods
  /**
   * Generate SQL using ReAct pattern with iterative reasoning
   */
  async generateSQLWithReAct(request: ReActSQLRequest): Promise<ReActResponse> {
    // Use enhanced proxy for ReAct functionality
    const baseUrl = typeof window !== 'undefined' 
      ? '/api/enhanced-proxy'
      : 'http://137.220.61.218:8002';
      
    const response = await fetch(
      `${baseUrl}/api/crews/react-sql/generate`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`ReAct SQL generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Track Arbitron usage if available
    if (result.arbitron_metrics) {
      this.trackArbitronUsage(result.arbitron_metrics);
    }
    
    return result;
  }

  /**
   * Optimize SQL query using ReAct pattern with iterative improvement
   */
  async optimizeQueryWithReAct(request: ReActOptimizationRequest): Promise<ReActResponse> {
    // Use enhanced proxy for ReAct functionality
    const baseUrl = typeof window !== 'undefined' 
      ? '/api/enhanced-proxy'
      : 'http://137.220.61.218:8002';
      
    const response = await fetch(
      `${baseUrl}/api/crews/react-sql/optimize`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`ReAct SQL optimization failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Track Arbitron usage if available
    if (result.arbitron_metrics) {
      this.trackArbitronUsage(result.arbitron_metrics);
    }
    
    return result;
  }

  /**
   * Validate SQL using ReAct pattern with comprehensive analysis
   */
  async validateSQLWithReAct(params: {
    sql: string;
    context?: Record<string, any>;
    dialect?: string;
    validate_syntax?: boolean;
    check_performance?: boolean;
  }): Promise<ReActResponse> {
    // Use enhanced proxy for ReAct functionality
    const baseUrl = typeof window !== 'undefined' 
      ? '/api/enhanced-proxy'
      : 'http://137.220.61.218:8002';
      
    const response = await fetch(
      `${baseUrl}/api/crews/react-sql/validate`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      throw new Error(`ReAct SQL validation failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Track Arbitron usage if available
    if (result.arbitron_metrics) {
      this.trackArbitronUsage(result.arbitron_metrics);
    }
    
    return result;
  }

  /**
   * Parse ReAct reasoning trace into structured steps
   */
  parseReasoningTrace(trace: string[]): ReActStep[] {
    const steps: ReActStep[] = [];
    let currentType: 'thought' | 'action' | 'observation' = 'thought';
    
    trace.forEach((step, index) => {
      const lowerStep = step.toLowerCase();
      
      if (lowerStep.includes('thought:') || lowerStep.includes('thinking:')) {
        currentType = 'thought';
      } else if (lowerStep.includes('action:') || lowerStep.includes('using tool:')) {
        currentType = 'action';
      } else if (lowerStep.includes('observation:') || lowerStep.includes('result:')) {
        currentType = 'observation';
      }
      
      steps.push({
        type: currentType,
        content: step.replace(/^(thought:|action:|observation:)/i, '').trim(),
        timestamp: new Date().toISOString(),
        confidence: currentType === 'thought' ? Math.random() * 0.3 + 0.7 : undefined, // Mock confidence for thoughts
      });
    });
    
    return steps;
  }

  /**
   * Get formatted reasoning summary from ReAct response
   */
  getReasoningSummary(response: ReActResponse): string {
    if (!response.reasoning_trace || response.reasoning_trace.length === 0) {
      return 'No reasoning trace available';
    }

    const thoughts = response.reasoning_trace.filter(step => step.type === 'thought');
    const actions = response.reasoning_trace.filter(step => step.type === 'action');
    
    return `Applied ${thoughts.length} reasoning steps and ${actions.length} tool actions to generate solution with ${response.pattern} pattern.`;
  }

  /**
   * Check if ReAct crew is available
   */
  async isReActAvailable(): Promise<boolean> {
    try {
      const baseUrl = typeof window !== 'undefined' 
        ? '/api/enhanced-proxy'
        : 'http://137.220.61.218:8002';
        
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        return false;
      }

      const health = await response.json();
      return health.crews_available?.includes('react-sql') || false;
    } catch (error) {
      console.warn('ReAct availability check failed:', error);
      return false;
    }
  }
}

// Additional type definitions for Connection Analysis
export interface ConnectionAnalysisResult {
  success: boolean;
  connection_analysis: {
    connection_type: string;
    feasibility_score: number;
    connection_strategy: string;
    agent_deliberations: Array<{
      agent: string;
      role: string;
      analysis: Record<string, any>;
      confidence: number;
      model_used: string;
      latency_ms: number;
    }>;
    recommendations: Array<{
      priority: string;
      category: string;
      action: string;
      impact: string;
      effort: string;
    }>;
    consensus_confidence: number;
  };
  arbitron_metrics: {
    routing_decisions: any[];
    total_cost: number;
    total_latency: number;
    cache_hits: number;
    model_distribution: Record<string, number>;
  };
  timestamp: string;
}

export interface ConnectionComparisonResult {
  success: boolean;
  comparison_results: {
    source_count: number;
    ranked_sources: Array<{
      source_name: string;
      connection_type: string;
      feasibility_score: number;
      strategy: string;
      rank: number;
      recommendation: string;
    }>;
    recommended_approach: string;
    total_integration_effort: {
      weeks: number;
      team_size: number;
    };
  };
  timestamp: string;
}

// Export singleton instance
export const crewAIService = new CrewAIService();