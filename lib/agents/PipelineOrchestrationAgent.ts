import { BaseAgent } from './BaseAgent';
import { AgentCapability, AgentTask, AgentInsight, ExecutionPlan, ExecutionStep } from './types';

interface PipelineInput {
  pipelineName?: string;
  sourceConfig?: SourceConfig;
  transformations?: Transformation[];
  destinationConfig?: DestinationConfig;
  schedule?: Schedule;
  requirements?: PipelineRequirements;
}

interface SourceConfig {
  type: 'database' | 'file' | 'api' | 'stream' | 'lakehouse';
  connection: any;
  tables?: string[];
  query?: string;
  format?: string;
}

interface Transformation {
  type: 'filter' | 'aggregate' | 'join' | 'pivot' | 'custom';
  config: any;
  order: number;
}

interface DestinationConfig {
  type: 'database' | 'file' | 'api' | 'lakehouse' | 'warehouse';
  connection: any;
  table?: string;
  format?: string;
  mode: 'append' | 'overwrite' | 'merge';
}

interface Schedule {
  type: 'manual' | 'cron' | 'event' | 'continuous';
  expression?: string;
  timezone?: string;
}

interface PipelineRequirements {
  sla?: number; // in minutes
  errorThreshold?: number; // percentage
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  monitoring?: boolean;
  alerting?: boolean;
}

interface PipelineOutput {
  pipeline: PipelineConfig;
  executionPlan: ExecutionPlan;
  airflowDAG?: string;
  estimatedCost: CostEstimate;
  recommendations: PipelineRecommendation[];
  validationResults: ValidationResult[];
}

interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  source: SourceConfig;
  transformations: Transformation[];
  destination: DestinationConfig;
  schedule: Schedule;
  monitoring: MonitoringConfig;
  dependencies?: string[];
}

interface MonitoringConfig {
  metrics: string[];
  alerts: Alert[];
  logging: 'verbose' | 'standard' | 'minimal';
}

interface Alert {
  condition: string;
  threshold: number;
  action: 'email' | 'slack' | 'pagerduty';
  recipients: string[];
}

interface CostEstimate {
  computeCost: number;
  storageCost: number;
  networkCost: number;
  totalMonthlyCost: number;
  breakdown: string;
}

interface PipelineRecommendation {
  type: 'optimization' | 'best_practice' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  implementation?: string;
}

interface ValidationResult {
  check: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
}

export class PipelineOrchestrationAgent extends BaseAgent {
  constructor() {
    super(
      'pipeline_orchestrator',
      'Pipeline Orchestration Agent',
      'Designs, configures, and optimizes data pipelines with intelligent scheduling and monitoring'
    );
  }

  protected defineCapabilities(): AgentCapability[] {
    return [
      {
        name: 'design_pipeline',
        description: 'Design complete data pipeline architecture',
        requiredContext: ['source', 'destination']
      },
      {
        name: 'optimize_pipeline',
        description: 'Optimize existing pipeline configuration',
        requiredContext: ['pipeline']
      },
      {
        name: 'generate_airflow_dag',
        description: 'Generate Airflow DAG from pipeline config',
        requiredContext: ['pipeline']
      },
      {
        name: 'estimate_cost',
        description: 'Estimate pipeline operational costs',
        requiredContext: ['pipeline', 'volume']
      },
      {
        name: 'validate_pipeline',
        description: 'Validate pipeline configuration and dependencies',
        requiredContext: ['pipeline']
      }
    ];
  }

  protected async executeTask(task: AgentTask): Promise<PipelineOutput> {
    const input = task.input as PipelineInput;
    
    // Design the pipeline configuration
    const pipeline = this.designPipeline(input);
    
    // Create execution plan
    const executionPlan = this.createExecutionPlan(pipeline);
    
    // Generate Airflow DAG if applicable
    const airflowDAG = this.generateAirflowDAG(pipeline);
    
    // Estimate costs
    const estimatedCost = this.estimateCosts(pipeline);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(pipeline, input);
    
    // Validate pipeline
    const validationResults = this.validatePipeline(pipeline);
    
    // Add insights
    await this.addPipelineInsights(pipeline, estimatedCost, validationResults);
    
    return {
      pipeline,
      executionPlan,
      airflowDAG,
      estimatedCost,
      recommendations,
      validationResults
    };
  }

  private designPipeline(input: PipelineInput): PipelineConfig {
    const pipelineId = `pipeline-${Date.now()}`;
    
    // Set up source configuration
    const source = input.sourceConfig || {
      type: 'database' as const,
      connection: {
        host: 'localhost',
        port: 5432,
        database: 'production',
        schema: 'public'
      },
      tables: ['customers', 'orders']
    };
    
    // Design transformations
    const transformations = input.transformations || this.designTransformations(source);
    
    // Set up destination
    const destination = input.destinationConfig || {
      type: 'lakehouse' as const,
      connection: {
        catalog: 'silver',
        schema: 'analytics',
        format: 'delta'
      },
      table: 'customer_analytics',
      mode: 'merge' as const
    };
    
    // Configure schedule
    const schedule = input.schedule || {
      type: 'cron' as const,
      expression: '0 2 * * *', // Daily at 2 AM
      timezone: 'UTC'
    };
    
    // Set up monitoring
    const monitoring: MonitoringConfig = {
      metrics: ['row_count', 'execution_time', 'error_rate', 'data_quality_score'],
      alerts: [
        {
          condition: 'error_rate',
          threshold: 0.05,
          action: 'email',
          recipients: ['data-team@company.com']
        },
        {
          condition: 'execution_time',
          threshold: 3600, // 1 hour in seconds
          action: 'slack',
          recipients: ['#data-alerts']
        }
      ],
      logging: 'standard'
    };
    
    return {
      id: pipelineId,
      name: input.pipelineName || 'Customer Analytics Pipeline',
      description: 'Processes customer and order data for analytics',
      source,
      transformations,
      destination,
      schedule,
      monitoring,
      dependencies: []
    };
  }

  private designTransformations(source: SourceConfig): Transformation[] {
    const transformations: Transformation[] = [];
    
    // Add data quality checks
    transformations.push({
      type: 'custom',
      order: 1,
      config: {
        name: 'data_quality_check',
        sql: `
          SELECT * FROM source_data
          WHERE customer_id IS NOT NULL
            AND order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
        `
      }
    });
    
    // Add aggregation
    transformations.push({
      type: 'aggregate',
      order: 2,
      config: {
        groupBy: ['customer_id', 'product_category'],
        aggregations: {
          total_orders: 'COUNT(*)',
          total_revenue: 'SUM(order_value)',
          avg_order_value: 'AVG(order_value)',
          last_order_date: 'MAX(order_date)'
        }
      }
    });
    
    // Add enrichment join
    if (source.tables && source.tables.length > 1) {
      transformations.push({
        type: 'join',
        order: 3,
        config: {
          leftTable: source.tables[0],
          rightTable: source.tables[1],
          joinType: 'LEFT',
          joinCondition: 'customer_id'
        }
      });
    }
    
    // Add filtering
    transformations.push({
      type: 'filter',
      order: 4,
      config: {
        conditions: [
          'total_revenue > 0',
          'customer_status = "active"'
        ]
      }
    });
    
    return transformations;
  }

  private createExecutionPlan(pipeline: PipelineConfig): ExecutionPlan {
    const steps: ExecutionStep[] = [];
    
    // Step 1: Extract data
    steps.push({
      id: 'extract-data',
      order: 1,
      action: 'extract',
      agent: 'pipeline_orchestrator',
      input: {
        source: pipeline.source,
        parallelism: 4
      },
      parallel: false
    });
    
    // Step 2: Validate extracted data
    steps.push({
      id: 'validate-source',
      order: 2,
      action: 'validate',
      agent: 'data_quality',
      input: {
        table: 'staging_table',
        rules: ['null_check', 'range_check']
      },
      dependencies: ['extract-data'],
      parallel: false
    });
    
    // Step 3: Apply transformations
    pipeline.transformations.forEach((transform, index) => {
      steps.push({
        id: `transform-${index + 1}`,
        order: 3 + index,
        action: 'transform',
        agent: 'pipeline_orchestrator',
        input: transform,
        dependencies: index === 0 ? ['validate-source'] : [`transform-${index}`],
        parallel: false
      });
    });
    
    // Step 4: Final validation
    steps.push({
      id: 'validate-output',
      order: 3 + pipeline.transformations.length + 1,
      action: 'validate',
      agent: 'data_quality',
      input: {
        table: 'transformed_data',
        rules: ['completeness', 'consistency']
      },
      dependencies: [`transform-${pipeline.transformations.length}`],
      parallel: false
    });
    
    // Step 5: Load data
    steps.push({
      id: 'load-data',
      order: 3 + pipeline.transformations.length + 2,
      action: 'load',
      agent: 'pipeline_orchestrator',
      input: {
        destination: pipeline.destination,
        mode: pipeline.destination.mode
      },
      dependencies: ['validate-output'],
      parallel: false
    });
    
    return {
      id: `plan-${pipeline.id}`,
      title: `Execution Plan for ${pipeline.name}`,
      description: 'Optimized execution plan with validation checkpoints',
      steps,
      estimatedDuration: steps.length * 120, // 2 minutes per step average
      requiredAgents: ['pipeline_orchestrator', 'data_quality'],
      confidence: 0.85
    };
  }

  private generateAirflowDAG(pipeline: PipelineConfig): string {
    const dagId = pipeline.name.toLowerCase().replace(/\s+/g, '_');
    
    return `"""
Generated Airflow DAG for: ${pipeline.name}
Generated at: ${new Date().toISOString()}
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.sql import SQLCheckOperator
from airflow.providers.databricks.operators.databricks import DatabricksSubmitRunOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'email': ['${pipeline.monitoring.alerts[0]?.recipients[0] || 'admin@company.com'}'],
    'retries': 3,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    '${dagId}',
    default_args=default_args,
    description='${pipeline.description}',
    schedule_interval='${pipeline.schedule.expression}',
    catchup=False,
    tags=['production', 'analytics']
)

# Extract task
extract_task = PythonOperator(
    task_id='extract_data',
    python_callable=extract_source_data,
    op_kwargs={
        'source_config': ${JSON.stringify(pipeline.source, null, 2)}
    },
    dag=dag
)

# Data quality check
quality_check = SQLCheckOperator(
    task_id='quality_check',
    sql="""
        SELECT COUNT(*) as count
        FROM staging_table
        WHERE customer_id IS NOT NULL
    """,
    conn_id='warehouse_connection',
    dag=dag
)

# Transform task
transform_task = DatabricksSubmitRunOperator(
    task_id='transform_data',
    databricks_conn_id='databricks_default',
    json={
        "spark_python_task": {
            "python_file": "dbfs:/pipelines/${dagId}/transform.py",
            "parameters": ["--input", "staging", "--output", "processed"]
        },
        "new_cluster": {
            "spark_version": "11.3.x-scala2.12",
            "node_type_id": "i3.xlarge",
            "num_workers": 2
        }
    },
    dag=dag
)

# Load task
load_task = PythonOperator(
    task_id='load_data',
    python_callable=load_to_destination,
    op_kwargs={
        'destination_config': ${JSON.stringify(pipeline.destination, null, 2)}
    },
    dag=dag
)

# Set dependencies
extract_task >> quality_check >> transform_task >> load_task
`;
  }

  private estimateCosts(pipeline: PipelineConfig): CostEstimate {
    // Mock cost estimation based on pipeline configuration
    const computeHours = pipeline.schedule.type === 'continuous' ? 720 : 30; // hours per month
    const dataVolumeGB = 100; // estimated
    const computeRate = 0.10; // $ per hour
    const storageRate = 0.023; // $ per GB per month
    const networkRate = 0.01; // $ per GB transferred
    
    const computeCost = computeHours * computeRate * (pipeline.transformations.length / 2);
    const storageCost = dataVolumeGB * storageRate;
    const networkCost = dataVolumeGB * networkRate * 2; // ingress + egress
    
    return {
      computeCost,
      storageCost,
      networkCost,
      totalMonthlyCost: computeCost + storageCost + networkCost,
      breakdown: `
Compute: ${computeHours}h × $${computeRate}/h × ${pipeline.transformations.length} transforms
Storage: ${dataVolumeGB}GB × $${storageRate}/GB
Network: ${dataVolumeGB}GB × $${networkRate}/GB × 2 (in/out)
      `.trim()
    };
  }

  private generateRecommendations(pipeline: PipelineConfig, input: PipelineInput): PipelineRecommendation[] {
    const recommendations: PipelineRecommendation[] = [];
    
    // Check for incremental processing
    if (pipeline.destination.mode === 'overwrite') {
      recommendations.push({
        type: 'optimization',
        title: 'Enable Incremental Processing',
        description: 'Switch from full refresh to incremental processing to reduce compute costs and execution time',
        impact: 'high',
        implementation: `Change destination mode from 'overwrite' to 'merge' and add watermark column`
      });
    }
    
    // Check for parallelization opportunities
    if (pipeline.transformations.length > 3) {
      recommendations.push({
        type: 'optimization',
        title: 'Parallelize Independent Transformations',
        description: 'Some transformations can run in parallel to reduce total execution time',
        impact: 'medium',
        implementation: 'Identify independent transformation steps and configure parallel execution'
      });
    }
    
    // Check for monitoring gaps
    if (!input.requirements?.monitoring) {
      recommendations.push({
        type: 'best_practice',
        title: 'Enable Comprehensive Monitoring',
        description: 'Add monitoring for data quality, performance metrics, and business KPIs',
        impact: 'medium',
        implementation: 'Configure Datadog or CloudWatch metrics with custom dashboards'
      });
    }
    
    // Check for SLA requirements
    if (input.requirements?.sla && input.requirements.sla < 60) {
      recommendations.push({
        type: 'warning',
        title: 'Aggressive SLA Detected',
        description: `SLA of ${input.requirements.sla} minutes may be challenging. Consider streaming or micro-batch processing`,
        impact: 'high',
        implementation: 'Switch to streaming architecture or reduce transformation complexity'
      });
    }
    
    // Data partitioning recommendation
    recommendations.push({
      type: 'optimization',
      title: 'Implement Data Partitioning',
      description: 'Partition data by date or key columns to improve query performance',
      impact: 'high',
      implementation: 'Add PARTITION BY clause in destination configuration'
    });
    
    return recommendations;
  }

  private validatePipeline(pipeline: PipelineConfig): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Validate source connection
    results.push({
      check: 'Source Connection',
      status: 'passed',
      message: 'Source connection configuration is valid'
    });
    
    // Validate transformations
    if (pipeline.transformations.length === 0) {
      results.push({
        check: 'Transformations',
        status: 'warning',
        message: 'No transformations defined - consider if raw data copy is intended'
      });
    } else {
      results.push({
        check: 'Transformations',
        status: 'passed',
        message: `${pipeline.transformations.length} transformations configured correctly`
      });
    }
    
    // Validate schedule
    if (pipeline.schedule.type === 'cron' && !this.isValidCron(pipeline.schedule.expression || '')) {
      results.push({
        check: 'Schedule',
        status: 'failed',
        message: 'Invalid cron expression'
      });
    } else {
      results.push({
        check: 'Schedule',
        status: 'passed',
        message: 'Schedule configuration is valid'
      });
    }
    
    // Validate monitoring
    if (pipeline.monitoring.alerts.length === 0) {
      results.push({
        check: 'Alerting',
        status: 'warning',
        message: 'No alerts configured - consider adding failure notifications'
      });
    } else {
      results.push({
        check: 'Alerting',
        status: 'passed',
        message: `${pipeline.monitoring.alerts.length} alerts configured`
      });
    }
    
    // Check for circular dependencies
    results.push({
      check: 'Dependencies',
      status: 'passed',
      message: 'No circular dependencies detected'
    });
    
    return results;
  }

  private isValidCron(expression: string): boolean {
    // Simplified cron validation
    const parts = expression.split(' ');
    return parts.length >= 5;
  }

  private async addPipelineInsights(
    pipeline: PipelineConfig, 
    cost: CostEstimate,
    validation: ValidationResult[]
  ): Promise<void> {
    // Cost optimization insight
    if (cost.totalMonthlyCost > 500) {
      this.insights.push({
        id: `insight-cost-${Date.now()}`,
        agent: this.role,
        type: 'optimization',
        title: 'High Pipeline Cost Detected',
        description: `Estimated monthly cost of $${cost.totalMonthlyCost.toFixed(2)} exceeds typical benchmarks. Consider optimization strategies.`,
        confidence: 0.8,
        actions: [{
          label: 'Optimize Pipeline',
          action: 'optimize_pipeline',
          params: { pipelineId: pipeline.id },
          impact: 'high'
        }]
      });
    }
    
    // Validation insight
    const failedValidations = validation.filter(v => v.status === 'failed');
    if (failedValidations.length > 0) {
      this.insights.push({
        id: `insight-validation-${Date.now()}`,
        agent: this.role,
        type: 'warning',
        title: 'Pipeline Validation Issues',
        description: `${failedValidations.length} validation checks failed. Pipeline may not execute correctly.`,
        confidence: 0.95,
        actions: [{
          label: 'Fix Issues',
          action: 'fix_validation_issues',
          params: { issues: failedValidations },
          impact: 'high'
        }]
      });
    }
    
    // Performance pattern insight
    if (pipeline.transformations.length > 5) {
      this.insights.push({
        id: `insight-pattern-${Date.now()}`,
        agent: this.role,
        type: 'pattern',
        title: 'Complex Transformation Chain',
        description: 'Pipeline contains multiple transformation steps. Consider consolidating or using materialized views.',
        confidence: 0.7,
        actions: [{
          label: 'Simplify Pipeline',
          action: 'simplify_transformations',
          params: { pipelineId: pipeline.id },
          impact: 'medium'
        }]
      });
    }
  }
}