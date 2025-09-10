import { DiscoveredPipeline, PipelineSource, IntegrationLevel, RealPipeline, RealNode, RealEdge } from '@/lib/types/RealNode';

interface DiscoverySource {
  name: string;
  type: PipelineSource;
  endpoint: string;
  enabled: boolean;
  credentials?: any;
  healthCheck?: () => Promise<boolean>;
}

interface DiscoveryConfig {
  sources: DiscoverySource[];
  timeout: number;
  concurrentRequests: number;
  cacheTimeout: number;
}

export class PipelineDiscoveryService {
  private config: DiscoveryConfig;
  private cache: Map<string, { data: DiscoveredPipeline[]; timestamp: number }> = new Map();

  constructor(config: DiscoveryConfig) {
    this.config = config;
  }

  /**
   * Discover pipelines from all configured sources
   */
  async discoverAll(): Promise<DiscoveredPipeline[]> {
    const discoveries = await Promise.allSettled(
      this.config.sources
        .filter(source => source.enabled)
        .map(source => this.discoverFromSource(source))
    );

    const results: DiscoveredPipeline[] = [];
    
    for (const result of discoveries) {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      } else {
        console.warn('Discovery failed:', result.reason);
      }
    }

    return results;
  }

  /**
   * Discover pipelines from a specific source
   */
  private async discoverFromSource(source: DiscoverySource): Promise<DiscoveredPipeline[]> {
    // Check cache first
    const cacheKey = `${source.type}:${source.endpoint}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.data;
    }

    try {
      let discovered: DiscoveredPipeline[] = [];

      switch (source.type) {
        case 'airflow':
          discovered = await this.discoverAirflowDAGs(source);
          break;
        case 'nifi':
          discovered = await this.discoverNiFiFlows(source);
          break;
        case 'kubernetes':
          discovered = await this.discoverKubernetesWorkflows(source);
          break;
        case 'jenkins':
          discovered = await this.discoverJenkinsPipelines(source);
          break;
        default:
          console.warn(`Unsupported discovery source: ${source.type}`);
      }

      // Cache results
      this.cache.set(cacheKey, {
        data: discovered,
        timestamp: Date.now()
      });

      return discovered;
    } catch (error) {
      console.error(`Failed to discover from ${source.type}:`, error);
      return [];
    }
  }

  /**
   * Discover Airflow DAGs
   */
  private async discoverAirflowDAGs(source: DiscoverySource): Promise<DiscoveredPipeline[]> {
    const response = await fetch(`${source.endpoint}/api/v1/dags`, {
      headers: {
        'Authorization': source.credentials?.token ? `Bearer ${source.credentials.token}` : undefined,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Airflow API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.dags?.map((dag: any) => ({
      source: 'airflow' as PipelineSource,
      id: dag.dag_id,
      name: dag.description || dag.dag_id,
      description: dag.description,
      nodeCount: dag.task_count || 0,
      lastRun: dag.last_parsed_time,
      status: dag.is_paused ? 'paused' : 'active',
      integration: {
        available: ['tool-direct', 'config-only'] as IntegrationLevel[],
        recommended: 'tool-direct' as IntegrationLevel,
        limitations: ['Read-only via REST API']
      }
    })) || [];
  }

  /**
   * Discover NiFi Process Groups and Flows
   */
  private async discoverNiFiFlows(source: DiscoverySource): Promise<DiscoveredPipeline[]> {
    const response = await fetch(`${source.endpoint}/nifi-api/flow/process-groups/root`, {
      headers: {
        'Authorization': source.credentials?.token ? `Bearer ${source.credentials.token}` : undefined,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`NiFi API error: ${response.status}`);
    }

    const data = await response.json();
    const discovered: DiscoveredPipeline[] = [];

    // Process root group
    if (data.processGroupFlow) {
      discovered.push({
        source: 'nifi' as PipelineSource,
        id: data.processGroupFlow.id,
        name: data.processGroupFlow.breadcrumb?.breadcrumb?.name || 'Root Process Group',
        description: 'NiFi Root Process Group',
        nodeCount: (data.processGroupFlow.flow?.processors?.length || 0) + 
                  (data.processGroupFlow.flow?.processGroups?.length || 0),
        status: 'active',
        integration: {
          available: ['tool-direct', 'config-only'] as IntegrationLevel[],
          recommended: 'tool-direct' as IntegrationLevel,
          limitations: ['Complex nested flows not fully supported']
        }
      });

      // Add child process groups
      if (data.processGroupFlow.flow?.processGroups) {
        for (const processGroup of data.processGroupFlow.flow.processGroups) {
          discovered.push({
            source: 'nifi' as PipelineSource,
            id: processGroup.id,
            name: processGroup.component.name,
            description: processGroup.component.comments,
            nodeCount: processGroup.component.runningCount + processGroup.component.stoppedCount,
            status: processGroup.component.state === 'RUNNING' ? 'active' : 'paused',
            integration: {
              available: ['tool-direct'] as IntegrationLevel[],
              recommended: 'tool-direct' as IntegrationLevel
            }
          });
        }
      }
    }

    return discovered;
  }

  /**
   * Discover Kubernetes Workflows (Argo, CronJobs, etc.)
   */
  private async discoverKubernetesWorkflows(source: DiscoverySource): Promise<DiscoveredPipeline[]> {
    const discovered: DiscoveredPipeline[] = [];

    try {
      // Discover CronJobs
      const cronJobsResponse = await fetch(`${source.endpoint}/apis/batch/v1/cronjobs`, {
        headers: {
          'Authorization': source.credentials?.token ? `Bearer ${source.credentials.token}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      if (cronJobsResponse.ok) {
        const cronJobs = await cronJobsResponse.json();
        
        for (const cronJob of cronJobs.items || []) {
          discovered.push({
            source: 'kubernetes' as PipelineSource,
            id: cronJob.metadata.name,
            name: cronJob.metadata.name,
            description: cronJob.metadata.annotations?.['description'] || 'Kubernetes CronJob',
            nodeCount: 1, // CronJob is typically a single task
            lastRun: cronJob.status?.lastScheduleTime,
            status: cronJob.spec.suspend ? 'paused' : 'active',
            integration: {
              available: ['tool-direct', 'config-only'] as IntegrationLevel[],
              recommended: 'config-only' as IntegrationLevel,
              limitations: ['Limited to basic scheduling and container execution']
            }
          });
        }
      }

      // TODO: Add Argo Workflows discovery
      // const argoResponse = await fetch(`${source.endpoint}/apis/argoproj.io/v1alpha1/workflows`);
      
    } catch (error) {
      console.warn('Failed to discover Kubernetes workflows:', error);
    }

    return discovered;
  }

  /**
   * Discover Jenkins Pipelines
   */
  private async discoverJenkinsPipelines(source: DiscoverySource): Promise<DiscoveredPipeline[]> {
    const response = await fetch(`${source.endpoint}/api/json?tree=jobs[name,description,lastBuild[timestamp,result]]`, {
      headers: {
        'Authorization': source.credentials?.token ? `Basic ${btoa(`${source.credentials.username}:${source.credentials.token}`)}` : undefined,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Jenkins API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.jobs?.map((job: any) => ({
      source: 'jenkins' as PipelineSource,
      id: job.name,
      name: job.name,
      description: job.description,
      nodeCount: 1, // Jenkins jobs are typically single units, though they can have stages
      lastRun: job.lastBuild?.timestamp ? new Date(job.lastBuild.timestamp).toISOString() : undefined,
      status: 'active', // Jenkins doesn't have a direct pause concept
      integration: {
        available: ['tool-direct', 'config-only'] as IntegrationLevel[],
        recommended: 'tool-direct' as IntegrationLevel,
        limitations: ['Pipeline stage details require additional API calls']
      }
    })) || [];
  }

  /**
   * Import a discovered pipeline into a RealPipeline structure
   */
  async importPipeline(discovered: DiscoveredPipeline): Promise<RealPipeline> {
    switch (discovered.source) {
      case 'airflow':
        return this.importAirflowDAG(discovered);
      case 'nifi':
        return this.importNiFiFlow(discovered);
      case 'kubernetes':
        return this.importKubernetesWorkflow(discovered);
      case 'jenkins':
        return this.importJenkinsPipeline(discovered);
      default:
        throw new Error(`Unsupported import source: ${discovered.source}`);
    }
  }

  private async importAirflowDAG(discovered: DiscoveredPipeline): Promise<RealPipeline> {
    // Get detailed DAG information
    const source = this.config.sources.find(s => s.type === 'airflow');
    if (!source) {
      throw new Error('Airflow source not configured');
    }

    const dagResponse = await fetch(`${source.endpoint}/api/v1/dags/${discovered.id}/details`, {
      headers: {
        'Authorization': source.credentials?.token ? `Bearer ${source.credentials.token}` : undefined,
        'Content-Type': 'application/json'
      }
    });

    const tasksResponse = await fetch(`${source.endpoint}/api/v1/dags/${discovered.id}/tasks`, {
      headers: {
        'Authorization': source.credentials?.token ? `Bearer ${source.credentials.token}` : undefined,
        'Content-Type': 'application/json'
      }
    });

    if (!dagResponse.ok || !tasksResponse.ok) {
      throw new Error('Failed to fetch DAG details');
    }

    const dag = await dagResponse.json();
    const tasksData = await tasksResponse.json();

    // Convert tasks to RealNodes
    const nodes: RealNode[] = tasksData.tasks?.map((task: any, index: number) => ({
      id: task.task_id,
      type: this.mapAirflowOperatorToNodeType(task.operator_name),
      label: task.task_id,
      position: { x: index * 200, y: 100 }, // Simple linear layout for now
      reality: {
        source: 'airflow' as PipelineSource,
        sourceId: task.task_id,
        location: {
          system: source.endpoint,
          environment: 'prod' as const, // Assuming production for discovered pipelines
          url: `${source.endpoint.replace('/api/v1', '')}/dags/${discovered.id}/grid?task_id=${task.task_id}`
        },
        integration: {
          level: 'tool-direct' as IntegrationLevel,
          apiEndpoint: `${source.endpoint}/api/v1/dags/${discovered.id}/tasks/${task.task_id}`
        },
        lastSync: {
          timestamp: new Date().toISOString(),
          status: 'synced' as const,
          hash: this.generateConfigHash(task)
        }
      },
      config: {
        actual: task.params || {},
        schema: this.getAirflowOperatorSchema(task.operator_name)
      },
      execution: {
        schedule: dag.schedule_interval ? {
          cron: dag.schedule_interval,
          trigger: 'scheduled' as const
        } : undefined,
        runtime: {
          engine: 'airflow' as const
        },
        dependencies: {
          upstream: task.upstream_task_ids || [],
          downstream: task.downstream_task_ids || []
        }
      }
    })) || [];

    // Generate edges from task dependencies
    const edges: RealEdge[] = [];
    for (const task of tasksData.tasks || []) {
      if (task.downstream_task_ids) {
        for (const downstreamId of task.downstream_task_ids) {
          edges.push({
            id: `${task.task_id}-${downstreamId}`,
            source: task.task_id,
            target: downstreamId,
            reality: {
              source: 'airflow' as PipelineSource,
              type: 'dependency' as const
            },
            animated: true
          });
        }
      }
    }

    return {
      id: discovered.id,
      name: discovered.name,
      description: discovered.description,
      nodes,
      edges,
      reality: {
        source: 'airflow' as PipelineSource,
        sourceId: discovered.id,
        location: {
          system: source.endpoint,
          environment: 'prod' as const,
          url: `${source.endpoint.replace('/api/v1', '')}/dags/${discovered.id}`
        },
        lastSync: {
          timestamp: new Date().toISOString(),
          status: 'synced' as const,
          hash: this.generateConfigHash(dag)
        }
      },
      version: {
        current: '1.0.0' // Default version for imported pipelines
      },
      schedule: dag.schedule_interval ? {
        cron: dag.schedule_interval,
        enabled: !dag.is_paused,
        timezone: dag.timezone
      } : undefined,
      metadata: {
        owner: dag.owners?.join(', '),
        tags: dag.tags?.map((tag: any) => tag.name) || [],
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };
  }

  private async importNiFiFlow(discovered: DiscoveredPipeline): Promise<RealPipeline> {
    // Implementation for NiFi flow import
    // This would fetch the process group details and convert to RealNodes
    throw new Error('NiFi import not yet implemented');
  }

  private async importKubernetesWorkflow(discovered: DiscoveredPipeline): Promise<RealPipeline> {
    // Implementation for Kubernetes workflow import
    throw new Error('Kubernetes import not yet implemented');
  }

  private async importJenkinsPipeline(discovered: DiscoveredPipeline): Promise<RealPipeline> {
    // Implementation for Jenkins pipeline import
    throw new Error('Jenkins import not yet implemented');
  }

  /**
   * Helper methods
   */
  private mapAirflowOperatorToNodeType(operatorName: string): string {
    const mapping: Record<string, string> = {
      'BashOperator': 'bash.command',
      'PythonOperator': 'python.script',
      'SqlOperator': 'sql.query',
      'SparkSubmitOperator': 'spark.submit',
      'KubernetesPodOperator': 'kubernetes.pod',
      'DockerOperator': 'docker.container',
      'EmailOperator': 'notification.email',
      'HttpSensor': 'sensor.http',
      'FileSensor': 'sensor.file',
      'S3FileTransformOperator': 's3.transform',
      'SnowflakeOperator': 'snowflake.query'
    };

    return mapping[operatorName] || 'generic.operator';
  }

  private getAirflowOperatorSchema(operatorName: string): any {
    // Return basic schema based on operator type
    const schemas: Record<string, any> = {
      'BashOperator': {
        type: 'object',
        properties: {
          bash_command: { type: 'string', title: 'Bash Command' },
          env: { type: 'object', title: 'Environment Variables' }
        },
        required: ['bash_command']
      },
      'PythonOperator': {
        type: 'object',
        properties: {
          python_callable: { type: 'string', title: 'Python Function' },
          op_args: { type: 'array', title: 'Arguments' },
          op_kwargs: { type: 'object', title: 'Keyword Arguments' }
        },
        required: ['python_callable']
      }
    };

    return schemas[operatorName] || {
      type: 'object',
      properties: {
        params: { type: 'object', title: 'Parameters' }
      }
    };
  }

  private generateConfigHash(config: any): string {
    // Simple hash generation for change detection
    return btoa(JSON.stringify(config)).slice(0, 8);
  }

  /**
   * Health check for discovery sources
   */
  async checkSourceHealth(source: DiscoverySource): Promise<boolean> {
    try {
      const response = await fetch(`${source.endpoint}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Update discovery configuration
   */
  updateConfig(newConfig: Partial<DiscoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Clear cache when config changes
    this.cache.clear();
  }
}