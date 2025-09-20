/**
 * Airflow API Client
 * Provides integration with Apache Airflow REST API
 */

export interface AirflowDAG {
  dag_id: string;
  description: string;
  is_paused: boolean;
  is_active: boolean;
  last_parsed_time: string;
  next_dagrun: string;
  schedule_interval: string;
  tags: string[];
}

export interface AirflowDagRun {
  dag_run_id: string;
  dag_id: string;
  execution_date: string;
  start_date: string;
  end_date: string;
  state: 'success' | 'failed' | 'running' | 'queued';
  conf: Record<string, any>;
}

export interface AirflowTask {
  task_id: string;
  task_type: string;
  state: string;
  start_date: string;
  end_date: string;
  duration: number;
  try_number: number;
}

export class AirflowClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_AIRFLOW_URL || 'http://localhost:8080';
    // In production, use proper authentication
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AIRFLOW_API_TOKEN || ''}`
    };
  }

  /**
   * List all DAGs
   */
  async listDags(): Promise<AirflowDAG[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/dags`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Airflow API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.dags || [];
    } catch (error) {
      console.error('Failed to list DAGs:', error);
      // Return mock data in development
      if (process.env.NODE_ENV === 'development') {
        return this.getMockDags();
      }
      throw error;
    }
  }

  /**
   * Get DAG details
   */
  async getDag(dagId: string): Promise<AirflowDAG> {
    const response = await fetch(`${this.baseUrl}/api/v1/dags/${dagId}`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get DAG: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Trigger a DAG run
   */
  async triggerDag(dagId: string, conf?: Record<string, any>): Promise<AirflowDagRun> {
    const response = await fetch(`${this.baseUrl}/api/v1/dags/${dagId}/dagRuns`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        conf: conf || {},
        dag_run_id: `manual_${Date.now()}`
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger DAG: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Pause or unpause a DAG
   */
  async pauseDag(dagId: string, isPaused: boolean): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/dags/${dagId}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ is_paused: isPaused })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update DAG state: ${response.statusText}`);
    }
  }

  /**
   * Get DAG runs
   */
  async getDagRuns(dagId: string, limit: number = 10): Promise<AirflowDagRun[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/dags/${dagId}/dagRuns?limit=${limit}&order_by=-execution_date`,
      { headers: this.headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get DAG runs: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.dag_runs || [];
  }

  /**
   * Get task instances for a DAG run
   */
  async getTaskInstances(dagId: string, dagRunId: string): Promise<AirflowTask[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/dags/${dagId}/dagRuns/${dagRunId}/taskInstances`,
      { headers: this.headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get task instances: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.task_instances || [];
  }

  /**
   * Get task logs
   */
  async getTaskLogs(dagId: string, dagRunId: string, taskId: string, tryNumber: number = 1): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/dags/${dagId}/dagRuns/${dagRunId}/taskInstances/${taskId}/logs/${tryNumber}`,
      { headers: this.headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get task logs: ${response.statusText}`);
    }
    
    return response.text();
  }

  /**
   * Get DAG file location for Git-based deployment
   * NOTE: DAGs must be deployed via Git or filesystem, not REST API
   */
  async getDagLocation(dagId: string): Promise<{ gitRepo?: string; filePath?: string }> {
    // Return Git repository information for DAG management
    return {
      gitRepo: process.env.AIRFLOW_DAGS_REPO || 'https://github.com/your-org/airflow-dags',
      filePath: `dags/${dagId}.py`
    };
  }

  /**
   * Validate DAG exists before operations
   */
  async validateDagExists(dagId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/dags/${dagId}`, {
        headers: this.headers
      });
      return response.ok;
    } catch (error) {
      console.error(`DAG validation failed for ${dagId}:`, error);
      return false;
    }
  }

  /**
   * Mock data for development
   */
  private getMockDags(): AirflowDAG[] {
    return [
      {
        dag_id: 'customer_etl',
        description: 'Customer data ETL pipeline',
        is_paused: false,
        is_active: true,
        last_parsed_time: new Date().toISOString(),
        next_dagrun: new Date(Date.now() + 3600000).toISOString(),
        schedule_interval: '@daily',
        tags: ['etl', 'customer', 'production']
      },
      {
        dag_id: 'sales_aggregation',
        description: 'Daily sales aggregation',
        is_paused: false,
        is_active: true,
        last_parsed_time: new Date().toISOString(),
        next_dagrun: new Date(Date.now() + 7200000).toISOString(),
        schedule_interval: '@daily',
        tags: ['analytics', 'sales']
      },
      {
        dag_id: 'inventory_sync',
        description: 'Inventory system synchronization',
        is_paused: true,
        is_active: true,
        last_parsed_time: new Date().toISOString(),
        next_dagrun: new Date(Date.now() + 1800000).toISOString(),
        schedule_interval: '@hourly',
        tags: ['sync', 'inventory']
      }
    ];
  }
}

// Export singleton instance
export const airflowClient = new AirflowClient();