/**
 * Dashboard Intelligence API Client
 *
 * Communicates with CrewAI-powered backend service for intelligent
 * dashboard generation from query results.
 */

export interface DashboardGenerationRequest {
  sql: string;
  columns: string[];
  rows: any[][];
  row_count: number;
}

export interface SummaryStatistic {
  label: string;
  value: string | number;
  format: 'number' | 'currency' | 'percentage' | 'text';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
}

export interface DataTransformation {
  type: 'histogram' | 'topN' | 'bottomN' | 'pivot' | 'aggregate' | 'none';
  params: Record<string, any>;
}

export interface DataMapping {
  xColumn: string;
  yColumns: string[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface DashboardView {
  id: string;
  title: string;
  description: string;
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'histogram' | 'metric';
  size: 'full' | 'half' | 'third' | 'quarter';
  dataMapping: DataMapping;
  transformation: DataTransformation;
  reasoning: string;
  confidence: number;
}

export interface IntelligentDashboardLayout {
  title: string;
  description: string;
  summaryStats: SummaryStatistic[];
  views: DashboardView[];
}

export interface ValidationError {
  viewId: string;
  error: string;
  severity: 'error' | 'warning';
  suggestion: string;
}

export interface DashboardGenerationResponse {
  success: boolean;
  valid: boolean;
  validatedDashboard: IntelligentDashboardLayout | null;
  validationErrors: ValidationError[];
  reasoning?: string;
  error?: string;
  generationTime?: number;
  usedCrewAI: boolean;
}

/**
 * Generate intelligent dashboard layout using CrewAI agents
 */
export async function generateIntelligentDashboard(
  request: DashboardGenerationRequest
): Promise<IntelligentDashboardLayout> {
  console.log('[Dashboard Client] 🚀 generateIntelligentDashboard called with:', {
    sql: request.sql.substring(0, 100) + '...',
    columns: request.columns,
    rowCount: request.row_count,
    rowsSample: request.rows.slice(0, 2)
  });

  try {
    console.log('[Dashboard Client] 📡 About to call fetch to /api/dashboard-intelligence/generate-dashboard');

    const response = await fetch('/api/dashboard-intelligence/generate-dashboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('[Dashboard Client] 📥 Fetch completed with status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[Dashboard Client] ❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Dashboard generation failed: ${response.statusText}`);
    }

    console.log('[Dashboard Client] 🔄 Parsing JSON response...');
    const result: DashboardGenerationResponse = await response.json();
    console.log('[Dashboard Client] 📊 Parsed response:', {
      success: result.success,
      valid: result.valid,
      usedCrewAI: result.usedCrewAI,
      hasDashboard: !!result.validatedDashboard,
      dashboardTitle: result.validatedDashboard?.title,
      viewCount: result.validatedDashboard?.views?.length,
      error: result.error
    });

    if (!result.success) {
      console.error('[Dashboard Client] ❌ Result success=false:', result.error);
      throw new Error(result.error || 'Dashboard generation failed');
    }

    if (!result.validatedDashboard) {
      console.error('[Dashboard Client] ❌ No dashboard layout in response');
      throw new Error('No dashboard layout returned');
    }

    console.log('[Dashboard Client] ✅ Returning validated dashboard:', result.validatedDashboard.title);
    return result.validatedDashboard;
  } catch (error) {
    console.error('[Dashboard Client] 💥 Exception in generateIntelligentDashboard:', error);
    console.error('[Dashboard Client] 💥 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack'
    });
    throw error;
  }
}

/**
 * Apply data transformation to rows based on transformation config
 */
export function applyDataTransformation(
  columns: string[],
  rows: any[][],
  transformation: DataTransformation
): { columns: string[]; rows: any[][] } {
  switch (transformation.type) {
    case 'none':
      return { columns, rows };

    case 'topN': {
      const { sortBy, limit = 10, sortOrder = 'desc' } = transformation.params;
      const sortColIdx = columns.indexOf(sortBy);
      if (sortColIdx === -1) return { columns, rows };

      const sorted = [...rows].sort((a, b) => {
        const aVal = a[sortColIdx];
        const bVal = b[sortColIdx];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      return { columns, rows: sorted.slice(0, limit) };
    }

    case 'bottomN': {
      const { sortBy, limit = 10, sortOrder = 'asc' } = transformation.params;
      const sortColIdx = columns.indexOf(sortBy);
      if (sortColIdx === -1) return { columns, rows };

      const sorted = [...rows].sort((a, b) => {
        const aVal = a[sortColIdx];
        const bVal = b[sortColIdx];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      return { columns, rows: sorted.slice(0, limit) };
    }

    case 'histogram': {
      const { column, buckets = 10 } = transformation.params;
      const colIdx = columns.indexOf(column);
      if (colIdx === -1) return { columns, rows };

      // Extract numeric values
      const values = rows.map(row => Number(row[colIdx]) || 0);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;

      if (range === 0) return { columns, rows };

      // Create histogram buckets
      const bucketSize = range / buckets;
      const distribution = new Array(buckets).fill(0);
      const bucketLabels: string[] = [];

      values.forEach(val => {
        const bucketIdx = Math.min(Math.floor((val - min) / bucketSize), buckets - 1);
        distribution[bucketIdx]++;
      });

      for (let i = 0; i < buckets; i++) {
        const start = min + i * bucketSize;
        const end = start + bucketSize;
        bucketLabels.push(`${start.toFixed(1)}-${end.toFixed(1)}`);
      }

      // Return transformed data
      return {
        columns: ['range', 'count'],
        rows: bucketLabels.map((label, idx) => [label, distribution[idx]]),
      };
    }

    case 'aggregate': {
      const { groupBy, aggregations } = transformation.params;
      // Implementation for groupBy aggregations
      // This would require more complex logic
      return { columns, rows };
    }

    case 'pivot': {
      // Implementation for pivot transformations
      return { columns, rows };
    }

    default:
      return { columns, rows };
  }
}

/**
 * Check health of dashboard intelligence service
 */
export async function checkDashboardServiceHealth(): Promise<{
  status: string;
  service: string;
  crewai_available: boolean;
  timestamp: string;
}> {
  try {
    const response = await fetch('/api/dashboard-intelligence/health');
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Dashboard service health check failed:', error);
    throw error;
  }
}

/**
 * Get dashboard intelligence capabilities
 */
export async function getDashboardCapabilities(): Promise<{
  chartTypes: string[];
  transformations: string[];
  agents: Array<{
    name: string;
    role: string;
    capabilities: string[];
  }>;
  crewai_available: boolean;
}> {
  try {
    const response = await fetch('/api/dashboard-intelligence/capabilities');
    if (!response.ok) {
      throw new Error(`Capabilities fetch failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch dashboard capabilities:', error);
    throw error;
  }
}
