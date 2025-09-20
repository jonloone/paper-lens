import { BaseAgent } from '../BaseAgent';
import { AgentCapability, AgentTask } from '../types';

interface DiagnosisResult {
  rootCause: string;
  confidence: number;
  fix: string;
  evidence: Evidence[];
  investigationSteps: string[];
  timeToResolve: string;
  preventionTips: string[];
}

interface Evidence {
  source: string;
  finding: string;
  timestamp: Date;
  relevance: 'high' | 'medium' | 'low';
}

interface PipelineFailure {
  pipelineId: string;
  pipelineName: string;
  failureTime: Date;
  errorMessage?: string;
  lastSuccessfulRun?: Date;
  affectedStage?: string;
}

/**
 * TroubleshootingAgent - Diagnoses failures so engineers don't have to dig through logs
 * Automatically investigates issues across multiple systems and provides actionable fixes
 */
export class TroubleshootingAgent extends BaseAgent {
  constructor() {
    super(
      'troubleshooting',
      'Troubleshooting Assistant',
      'Diagnoses pipeline failures, identifies root causes, and provides actionable fixes'
    );
  }

  protected defineCapabilities(): AgentCapability[] {
    return [
      {
        name: 'diagnose_pipeline_failure',
        description: 'Investigate pipeline failure and identify root cause',
        requiredContext: ['pipelineId', 'errorMessage']
      },
      {
        name: 'check_schema_drift',
        description: 'Detect schema changes that may cause failures',
        requiredContext: ['sourceTable', 'targetTable']
      },
      {
        name: 'analyze_performance_degradation',
        description: 'Identify causes of slow pipeline execution',
        requiredContext: ['pipelineId', 'metrics']
      },
      {
        name: 'check_data_quality_issues',
        description: 'Identify data quality problems causing failures',
        requiredContext: ['table', 'rules']
      }
    ];
  }

  protected async executeTask(task: AgentTask): Promise<DiagnosisResult> {
    const failure = task.input as PipelineFailure;
    
    // Run comprehensive diagnosis
    const diagnosis = await this.diagnosePipelineFailure(failure);
    
    // Add insight for tracking
    this.insights.push({
      id: `insight-diagnosis-${Date.now()}`,
      agent: this.role,
      type: diagnosis.confidence > 0.8 ? 'solution' : 'recommendation',
      title: `Root Cause: ${diagnosis.rootCause}`,
      description: diagnosis.fix,
      confidence: diagnosis.confidence,
      actions: [{
        label: 'Apply Fix',
        action: 'apply_fix',
        params: { fix: diagnosis.fix },
        impact: 'high'
      }]
    });
    
    return diagnosis;
  }

  /**
   * Comprehensive pipeline failure diagnosis
   */
  private async diagnosePipelineFailure(failure: PipelineFailure): Promise<DiagnosisResult> {
    const investigationSteps: string[] = [];
    const evidence: Evidence[] = [];
    
    // Step 1: Analyze error patterns
    investigationSteps.push('Analyzing error message patterns...');
    const errorPattern = this.analyzeErrorPattern(failure.errorMessage || '');
    if (errorPattern.matched) {
      evidence.push({
        source: 'Error Analysis',
        finding: errorPattern.finding,
        timestamp: new Date(),
        relevance: 'high'
      });
    }
    
    // Step 2: Check for common issues
    investigationSteps.push('Checking for common failure patterns...');
    const commonIssue = this.checkCommonIssues(failure);
    if (commonIssue.found) {
      evidence.push({
        source: 'Pattern Matching',
        finding: commonIssue.issue,
        timestamp: new Date(),
        relevance: commonIssue.relevance
      });
    }
    
    // Step 3: Schema drift detection
    investigationSteps.push('Checking for schema changes...');
    const schemaDrift = this.detectSchemaDrift(failure);
    if (schemaDrift.detected) {
      evidence.push({
        source: 'Schema Analysis',
        finding: schemaDrift.changes,
        timestamp: new Date(),
        relevance: 'high'
      });
      
      return {
        rootCause: `Schema drift detected: ${schemaDrift.changes}`,
        confidence: 0.9,
        fix: schemaDrift.fix,
        evidence,
        investigationSteps,
        timeToResolve: '5 minutes',
        preventionTips: [
          'Implement schema evolution strategy',
          'Add schema validation in pipeline',
          'Set up schema change notifications'
        ]
      };
    }
    
    // Step 4: Resource constraints check
    investigationSteps.push('Checking resource utilization...');
    const resourceIssue = this.checkResourceConstraints(failure);
    if (resourceIssue.found) {
      evidence.push({
        source: 'Resource Monitor',
        finding: resourceIssue.constraint,
        timestamp: new Date(),
        relevance: 'high'
      });
      
      return {
        rootCause: `Resource constraint: ${resourceIssue.constraint}`,
        confidence: 0.85,
        fix: resourceIssue.fix,
        evidence,
        investigationSteps,
        timeToResolve: '10 minutes',
        preventionTips: [
          'Implement auto-scaling',
          'Add resource monitoring alerts',
          'Optimize query performance'
        ]
      };
    }
    
    // Step 5: Permission issues
    investigationSteps.push('Verifying permissions...');
    const permissionIssue = this.checkPermissions(failure);
    if (permissionIssue.found) {
      evidence.push({
        source: 'Permission Check',
        finding: permissionIssue.issue,
        timestamp: new Date(),
        relevance: 'high'
      });
      
      return {
        rootCause: `Permission issue: ${permissionIssue.issue}`,
        confidence: 0.95,
        fix: permissionIssue.fix,
        evidence,
        investigationSteps,
        timeToResolve: '2 minutes',
        preventionTips: [
          'Use service accounts with proper permissions',
          'Implement permission validation in pipeline',
          'Document required permissions'
        ]
      };
    }
    
    // Step 6: Data quality issues
    investigationSteps.push('Analyzing data quality...');
    const dataQualityIssue = this.checkDataQuality(failure);
    if (dataQualityIssue.found) {
      evidence.push({
        source: 'Data Quality Check',
        finding: dataQualityIssue.issue,
        timestamp: new Date(),
        relevance: 'medium'
      });
      
      return {
        rootCause: `Data quality issue: ${dataQualityIssue.issue}`,
        confidence: 0.75,
        fix: dataQualityIssue.fix,
        evidence,
        investigationSteps,
        timeToResolve: '15 minutes',
        preventionTips: [
          'Add data validation rules',
          'Implement data quality monitoring',
          'Set up data profiling'
        ]
      };
    }
    
    // Default diagnosis if no specific issue found
    return {
      rootCause: 'Unable to determine specific root cause',
      confidence: 0.3,
      fix: 'Manual investigation required. Check recent changes and system logs.',
      evidence,
      investigationSteps,
      timeToResolve: '30+ minutes',
      preventionTips: [
        'Improve error logging',
        'Add more monitoring',
        'Implement better error handling'
      ]
    };
  }

  /**
   * Analyze error message patterns
   */
  private analyzeErrorPattern(errorMessage: string): { matched: boolean; finding: string } {
    const patterns = [
      {
        pattern: /column .* does not exist/i,
        finding: 'Missing column in source or target table'
      },
      {
        pattern: /duplicate key value/i,
        finding: 'Duplicate key constraint violation'
      },
      {
        pattern: /out of memory/i,
        finding: 'Memory exhaustion during processing'
      },
      {
        pattern: /connection refused/i,
        finding: 'Unable to connect to data source'
      },
      {
        pattern: /timeout/i,
        finding: 'Operation timed out'
      },
      {
        pattern: /permission denied/i,
        finding: 'Insufficient permissions'
      },
      {
        pattern: /no space left/i,
        finding: 'Disk space exhausted'
      },
      {
        pattern: /invalid.*format/i,
        finding: 'Data format mismatch'
      }
    ];
    
    for (const { pattern, finding } of patterns) {
      if (pattern.test(errorMessage)) {
        return { matched: true, finding };
      }
    }
    
    return { matched: false, finding: '' };
  }

  /**
   * Check for common pipeline issues
   */
  private checkCommonIssues(failure: PipelineFailure): {
    found: boolean;
    issue: string;
    relevance: 'high' | 'medium' | 'low';
  } {
    // Check if failure happened at specific time (maintenance window?)
    const failureHour = failure.failureTime.getHours();
    if (failureHour >= 2 && failureHour <= 4) {
      return {
        found: true,
        issue: 'Failure during typical maintenance window',
        relevance: 'medium'
      };
    }
    
    // Check if it's been failing repeatedly
    if (failure.lastSuccessfulRun) {
      const hoursSinceSuccess = (failure.failureTime.getTime() - failure.lastSuccessfulRun.getTime()) / 3600000;
      if (hoursSinceSuccess > 24) {
        return {
          found: true,
          issue: 'Pipeline has been failing for over 24 hours',
          relevance: 'high'
        };
      }
    }
    
    return { found: false, issue: '', relevance: 'low' };
  }

  /**
   * Detect schema drift between source and target
   */
  private detectSchemaDrift(failure: PipelineFailure): {
    detected: boolean;
    changes: string;
    fix: string;
  } {
    // Mock schema drift detection
    // In production, this would query actual metadata stores
    
    if (failure.errorMessage?.includes('column') || failure.errorMessage?.includes('schema')) {
      return {
        detected: true,
        changes: 'New column "email_verified" added to source table',
        fix: `ALTER TABLE target_table ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Or update your pipeline to handle the new column:
UPDATE pipeline_config 
SET schema_evolution = 'automatic' 
WHERE pipeline_id = '${failure.pipelineId}';`
      };
    }
    
    return { detected: false, changes: '', fix: '' };
  }

  /**
   * Check for resource constraints
   */
  private checkResourceConstraints(failure: PipelineFailure): {
    found: boolean;
    constraint: string;
    fix: string;
  } {
    if (failure.errorMessage?.includes('memory') || failure.errorMessage?.includes('OOM')) {
      return {
        found: true,
        constraint: 'Insufficient memory for data processing',
        fix: `-- Increase memory allocation:
UPDATE cluster_config 
SET executor_memory = '8g',
    driver_memory = '4g'
WHERE cluster_id = 'production';

-- Or optimize the query to use less memory:
-- Add LIMIT clauses, use sampling, or process in smaller batches`
      };
    }
    
    if (failure.errorMessage?.includes('timeout')) {
      return {
        found: true,
        constraint: 'Query timeout exceeded',
        fix: `-- Increase timeout settings:
SET statement_timeout = '30min';
SET query_timeout = '30min';

-- Or optimize the query for better performance:
-- Add indexes, partition pruning, or materialized views`
      };
    }
    
    return { found: false, constraint: '', fix: '' };
  }

  /**
   * Check for permission issues
   */
  private checkPermissions(failure: PipelineFailure): {
    found: boolean;
    issue: string;
    fix: string;
  } {
    if (failure.errorMessage?.includes('permission') || failure.errorMessage?.includes('denied')) {
      return {
        found: true,
        issue: 'Service account lacks required permissions',
        fix: `-- Grant necessary permissions:
GRANT SELECT, INSERT, UPDATE ON TABLE target_table TO service_account;
GRANT USAGE ON SCHEMA analytics TO service_account;

-- For S3/Cloud Storage:
aws iam attach-role-policy \\
  --role-name pipeline-role \\
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess`
      };
    }
    
    return { found: false, issue: '', fix: '' };
  }

  /**
   * Check for data quality issues
   */
  private checkDataQuality(failure: PipelineFailure): {
    found: boolean;
    issue: string;
    fix: string;
  } {
    if (failure.errorMessage?.includes('null') || failure.errorMessage?.includes('constraint')) {
      return {
        found: true,
        issue: 'Null values in non-nullable column',
        fix: `-- Add null handling to your pipeline:
SELECT 
  COALESCE(customer_id, 'UNKNOWN') as customer_id,
  COALESCE(order_value, 0) as order_value
FROM source_table
WHERE customer_id IS NOT NULL 
   OR order_value IS NOT NULL;

-- Or update the constraint:
ALTER TABLE target_table 
ALTER COLUMN customer_id DROP NOT NULL;`
      };
    }
    
    if (failure.errorMessage?.includes('duplicate')) {
      return {
        found: true,
        issue: 'Duplicate key violation',
        fix: `-- Add deduplication to your pipeline:
WITH deduped AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY key_column ORDER BY updated_at DESC) as rn
  FROM source_table
)
SELECT * FROM deduped WHERE rn = 1;

-- Or use MERGE/UPSERT instead of INSERT:
MERGE INTO target_table USING source_table
ON target_table.id = source_table.id
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT ...;`
      };
    }
    
    return { found: false, issue: '', fix: '' };
  }
}