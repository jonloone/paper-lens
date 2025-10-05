/**
 * Build Flow API Client
 * Frontend service for calling backend build flow APIs
 * Phase 1 Week 7-8: Backend Integration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// Type Definitions (matching backend Pydantic models)
// ============================================================================

export interface ProductDefinition {
  name: string;
  displayName: string;
  description: string;
  domain: string;
  owner: string;
  tags: string[];
  schedule: {
    type: 'hourly' | 'daily' | 'weekly' | 'cron';
    time?: string;
    day?: string;
    cron?: string;
  };
  sla: {
    freshnessHours: number;
    qualityThreshold: number;
    availabilityTarget: number;
  };
}

export interface StartWorkflowRequest {
  definition: ProductDefinition;
}

export interface StartWorkflowResponse {
  workflow_id: string;
  contract_draft: string;
  status: string;
}

export interface ColumnMetadata {
  name: string;
  type: string;
  description?: string;
}

export interface Source {
  id: string;  // DataHub URN
  name: string;
  schema: string;
  database: string;
  qualityScore: number;
  rowCount: number;
  columns: ColumnMetadata[];
  lastUpdated: string;
  description?: string;
}

export interface SourcesResponse {
  sources: Source[];
  total: number;
}

export interface ValidateSQLRequest {
  sql: string;
  sources: string[];  // DataHub URNs
}

export interface ValidateSQLResponse {
  valid: boolean;
  plan?: string;
  estimatedRows?: number;
  errors?: string[];
  warnings?: string[];
}

export interface PreviewRequest {
  sql: string;
  limit?: number;
}

export interface PreviewResponse {
  columns: string[];
  rows: any[][];
  executionTimeMs: number;
  rowCount: number;
}

export interface GenerateArtifactsRequest {
  workflow_id: string;
}

export interface Artifact {
  path: string;
  content: string;
}

export interface GenerateArtifactsResponse {
  artifacts: {
    contract: Artifact;
    dbt: Artifact;
    airflow: Artifact;
  };
}

export interface DeployRequest {
  workflow_id: string;
}

export interface DeployResponse {
  branch: string;
  commit_sha: string;
  pr_url: string;
}

// ============================================================================
// API Client Functions
// ============================================================================

/**
 * Start a new build workflow
 */
export async function startWorkflow(
  definition: ProductDefinition
): Promise<StartWorkflowResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/build/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ definition }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to start workflow');
  }

  return response.json();
}

/**
 * Fetch available sources from DataHub
 */
export async function fetchSources(params?: {
  search?: string;
  domain?: string;
  limit?: number;
  offset?: number;
}): Promise<SourcesResponse> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.domain) queryParams.set('domain', params.domain);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());

  const url = `${API_BASE_URL}/api/v1/build/sources${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch sources');
  }

  return response.json();
}

/**
 * Validate SQL query using Trino
 */
export async function validateSQL(
  sql: string,
  sources: string[]
): Promise<ValidateSQLResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/build/validate-sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, sources }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to validate SQL');
  }

  return response.json();
}

/**
 * Execute SQL preview with LIMIT
 */
export async function previewSQL(
  sql: string,
  limit: number = 100
): Promise<PreviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/build/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, limit }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to execute preview');
  }

  return response.json();
}

/**
 * Generate artifacts (ODCS, dbt, Airflow)
 * Note: Frontend currently generates artifacts using TypeScript templates
 * This endpoint is available for future backend-side generation
 */
export async function generateArtifacts(
  workflow_id: string
): Promise<GenerateArtifactsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/build/generate-artifacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workflow_id }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate artifacts');
  }

  return response.json();
}

/**
 * Deploy artifacts (create Git branch, commit, and PR)
 */
export async function deploy(workflow_id: string): Promise<DeployResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/build/deploy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workflow_id }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to deploy');
  }

  return response.json();
}

// ============================================================================
// Export all functions as default client
// ============================================================================

const BuildAPI = {
  startWorkflow,
  fetchSources,
  validateSQL,
  previewSQL,
  generateArtifacts,
  deploy,
};

export default BuildAPI;
