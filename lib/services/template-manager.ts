import { PipelineTemplate, GeneratedPipeline, PipelineGenerationRequest } from '@/lib/templates/pipeline-templates/types';
import { cdcTemplate } from '@/lib/templates/pipeline-templates/cdc-template';
import { aggregationTemplate } from '@/lib/templates/pipeline-templates/aggregation-template';
import { streamingTemplate } from '@/lib/templates/pipeline-templates/streaming-template';

export interface TemplateInstance {
  id: string;
  templateId: string;
  name: string;
  parameters: Record<string, any>;
  createdAt: Date;
  createdBy: string;
  lastModified: Date;
  deploymentStatus: 'draft' | 'deployed' | 'failed';
  runHistory: Array<{
    runId: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'success' | 'failed';
    metrics?: Record<string, any>;
  }>;
}

export class TemplateManager {
  private templates: Map<string, PipelineTemplate> = new Map();
  private instances: Map<string, TemplateInstance> = new Map();
  private sharedTemplates: Map<string, PipelineTemplate> = new Map();
  
  constructor() {
    this.initializeTemplates();
  }
  
  private initializeTemplates() {
    // Register built-in templates
    this.registerTemplate(cdcTemplate);
    this.registerTemplate(aggregationTemplate);
    this.registerTemplate(streamingTemplate);
    
    // Add quality and reconciliation templates
    this.registerTemplate(this.createQualityTemplate());
    this.registerTemplate(this.createReconciliationTemplate());
  }
  
  registerTemplate(template: PipelineTemplate) {
    this.templates.set(template.id, template);
  }
  
  getAllTemplates(): PipelineTemplate[] {
    return Array.from(this.templates.values());
  }
  
  getTemplateById(id: string): PipelineTemplate | undefined {
    return this.templates.get(id);
  }
  
  getTemplatesByCategory(category: string): PipelineTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }
  
  getPopularTemplates(limit: number = 5): PipelineTemplate[] {
    return this.getAllTemplates()
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }
  
  getRecentlyUsedTemplates(limit: number = 5): PipelineTemplate[] {
    return this.getAllTemplates()
      .filter(t => t.lastUsed)
      .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
      .slice(0, limit);
  }
  
  searchTemplates(query: string): PipelineTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  instantiateTemplate(
    templateId: string, 
    parameters: Record<string, any>,
    user: string = 'current_user'
  ): TemplateInstance {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Validate required parameters
    const missingParams = template.parameters
      .filter(p => p.required && !(p.id in parameters))
      .map(p => p.name);
    
    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }
    
    // Create instance
    const instance: TemplateInstance = {
      id: `inst_${Date.now()}`,
      templateId,
      name: parameters.name || `${template.name}_${new Date().toISOString().split('T')[0]}`,
      parameters,
      createdAt: new Date(),
      createdBy: user,
      lastModified: new Date(),
      deploymentStatus: 'draft',
      runHistory: []
    };
    
    this.instances.set(instance.id, instance);
    
    // Update template usage stats
    template.usageCount++;
    template.lastUsed = new Date();
    
    return instance;
  }
  
  generateCode(instanceId: string): GeneratedPipeline {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    
    const template = this.getTemplateById(instance.templateId);
    if (!template) {
      throw new Error(`Template ${instance.templateId} not found`);
    }
    
    const generatedCode = [];
    
    // Generate code for each template type
    if (template.codeTemplates.airflow) {
      generatedCode.push({
        language: 'python',
        content: this.interpolateTemplate(template.codeTemplates.airflow, instance.parameters)
      });
    }
    
    if (template.codeTemplates.sql) {
      generatedCode.push({
        language: 'sql',
        content: this.interpolateTemplate(template.codeTemplates.sql, instance.parameters)
      });
    }
    
    if (template.codeTemplates.spark) {
      generatedCode.push({
        language: 'python',
        content: this.interpolateTemplate(template.codeTemplates.spark, instance.parameters)
      });
    }
    
    return {
      template,
      code: generatedCode,
      config: instance.parameters,
      deploymentSteps: [
        '1. Review generated code',
        '2. Test in development environment',
        '3. Run quality checks',
        '4. Deploy to production',
        '5. Monitor initial runs'
      ],
      estimatedCost: this.estimateCost(template, instance.parameters),
      warnings: this.generateWarnings(template, instance.parameters)
    };
  }
  
  private interpolateTemplate(template: string, params: Record<string, any>): string {
    let result = template;
    
    // Simple template interpolation (in production, use a proper template engine)
    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });
    
    // Handle conditionals (simplified)
    result = result.replace(/{{#if\s+\((.*?)\)}}(.*?){{\/if}}/gs, (match, condition, content) => {
      // Simple evaluation - in production, use safe evaluation
      if (params[condition.trim()]) {
        return content;
      }
      return '';
    });
    
    return result;
  }
  
  private estimateCost(template: PipelineTemplate, params: Record<string, any>): string {
    // Simple cost estimation based on template type
    if (template.category === 'streaming') {
      return '$50-100/month (continuous processing)';
    } else if (template.category === 'batch') {
      const frequency = params.schedule || 'daily';
      if (frequency.includes('hourly')) {
        return '$30-50/month';
      }
      return '$10-20/month';
    }
    return '$5-15/month';
  }
  
  private generateWarnings(template: PipelineTemplate, params: Record<string, any>): string[] {
    const warnings: string[] = [];
    
    // Check for common issues
    if (template.category === 'streaming' && params.processing_mode === 'exactly_once') {
      warnings.push('Exactly-once processing may impact performance');
    }
    
    if (params.lookback_days > 7) {
      warnings.push('Large lookback period may cause long initial run');
    }
    
    if (!params.enable_schema_evolution) {
      warnings.push('Schema evolution disabled - manual intervention needed for schema changes');
    }
    
    return warnings;
  }
  
  shareTemplate(templateId: string, sharedWith: string[]) {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    template.sharedWith = [...new Set([...template.sharedWith, ...sharedWith])];
    this.sharedTemplates.set(templateId, template);
  }
  
  getSharedTemplates(): PipelineTemplate[] {
    return Array.from(this.sharedTemplates.values());
  }
  
  cloneTemplate(templateId: string, newName: string): PipelineTemplate {
    const original = this.getTemplateById(templateId);
    if (!original) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const cloned: PipelineTemplate = {
      ...original,
      id: `${original.id}_clone_${Date.now()}`,
      name: newName,
      createdBy: 'current_user',
      usageCount: 0,
      lastUsed: undefined
    };
    
    this.registerTemplate(cloned);
    return cloned;
  }
  
  private createQualityTemplate(): PipelineTemplate {
    return {
      id: 'data-quality-validation',
      name: 'Data Quality Validation',
      description: 'Automated data quality checks with Great Expectations',
      category: 'quality',
      tags: ['quality', 'validation', 'great-expectations', 'testing'],
      icon: '✅',
      
      popularity: 78,
      usageCount: 145,
      createdBy: 'Platform Team',
      sharedWith: ['all'],
      
      estimatedBuildTime: '20 minutes',
      estimatedRunTime: '10 minutes',
      
      parameters: [
        {
          id: 'target_table',
          name: 'Target Table',
          description: 'Table to validate',
          type: 'string',
          required: true
        },
        {
          id: 'validation_rules',
          name: 'Validation Rules',
          description: 'Quality checks to perform',
          type: 'multiselect',
          required: true,
          options: [
            { label: 'Null checks', value: 'null_check' },
            { label: 'Uniqueness', value: 'unique' },
            { label: 'Range validation', value: 'range' },
            { label: 'Format validation', value: 'format' },
            { label: 'Referential integrity', value: 'ref_integrity' }
          ]
        }
      ],
      
      generates: {
        greatExpectations: true,
        airflowDag: true
      },
      
      codeTemplates: {
        python: `# Data quality validation pipeline
import great_expectations as ge

# Load data
df = ge.read_sql("SELECT * FROM {{target_table}}", connection)

# Apply validation rules
{{#each validation_rules}}
{{#if (eq this "null_check")}}
df.expect_column_values_to_not_be_null("id")
{{/if}}
{{#if (eq this "unique")}}
df.expect_column_values_to_be_unique("id")
{{/if}}
{{/each}}

# Generate report
validation_result = df.validate()
print(validation_result)`
      },
      
      sourceRequirements: [],
      targetRequirements: [],
      qualityChecks: [],
      monitoring: {
        metrics: ['validation_pass_rate', 'rules_evaluated'],
        alerts: []
      }
    };
  }
  
  private createReconciliationTemplate(): PipelineTemplate {
    return {
      id: 'cross-system-reconciliation',
      name: 'Cross-System Reconciliation',
      description: 'Compare and reconcile data between two systems',
      category: 'reconciliation',
      tags: ['reconciliation', 'validation', 'cross-system', 'audit'],
      icon: '🔄',
      
      popularity: 71,
      usageCount: 98,
      createdBy: 'Platform Team',
      sharedWith: ['all'],
      
      estimatedBuildTime: '25 minutes',
      estimatedRunTime: '15 minutes',
      
      parameters: [
        {
          id: 'source_system',
          name: 'Source System',
          description: 'Primary data source',
          type: 'string',
          required: true
        },
        {
          id: 'target_system',
          name: 'Target System',
          description: 'System to reconcile against',
          type: 'string',
          required: true
        },
        {
          id: 'key_columns',
          name: 'Key Columns',
          description: 'Columns to use for matching',
          type: 'string',
          required: true
        }
      ],
      
      generates: {
        airflowDag: true,
        sqlQueries: true
      },
      
      codeTemplates: {
        sql: `-- Cross-system reconciliation
WITH source_data AS (
  SELECT * FROM {{source_system}}
),
target_data AS (
  SELECT * FROM {{target_system}}
),
reconciliation AS (
  SELECT 
    s.*,
    t.*,
    CASE 
      WHEN t.{{key_columns}} IS NULL THEN 'Missing in target'
      WHEN s.{{key_columns}} IS NULL THEN 'Missing in source'
      ELSE 'Matched'
    END as status
  FROM source_data s
  FULL OUTER JOIN target_data t
    ON s.{{key_columns}} = t.{{key_columns}}
)
SELECT * FROM reconciliation WHERE status != 'Matched';`
      },
      
      sourceRequirements: [],
      targetRequirements: [],
      qualityChecks: [],
      monitoring: {
        metrics: ['records_matched', 'discrepancies_found'],
        alerts: []
      }
    };
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();