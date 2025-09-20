import { PipelineGenerationRequest, GeneratedPipeline, PipelineTemplate } from '@/lib/templates/pipeline-templates/types';
import { templateManager } from './template-manager';
import { patternDetectionService } from './pattern-detection';

export interface CodeGenerationResult {
  success: boolean;
  code: {
    language: string;
    filename: string;
    content: string;
  }[];
  confidence: number;
  explanation: string;
  warnings?: string[];
  suggestions?: string[];
}

export class CodeGenerationService {
  private nlpPatterns = new Map<string, string[]>([
    ['cdc', ['sync', 'replicate', 'copy', 'transfer', 'migrate', 'cdc', 'change data capture']],
    ['aggregation', ['aggregate', 'rollup', 'summary', 'group', 'calculate', 'sum', 'average']],
    ['streaming', ['stream', 'real-time', 'realtime', 'kafka', 'kinesis', 'event', 'continuous']],
    ['quality', ['quality', 'validate', 'check', 'verify', 'test', 'ensure', 'monitor']],
    ['reconciliation', ['reconcile', 'compare', 'match', 'audit', 'cross-check', 'verify']]
  ]);
  
  generateFromNaturalLanguage(request: PipelineGenerationRequest): CodeGenerationResult {
    // Analyze the request to determine intent
    const intent = this.detectIntent(request.description);
    const template = this.selectBestTemplate(intent, request);
    
    if (!template) {
      return this.generateCustomPipeline(request);
    }
    
    // Generate parameters from request
    const parameters = this.extractParameters(request, template);
    
    // Instantiate template
    const instance = templateManager.instantiateTemplate(template.id, parameters);
    const generated = templateManager.generateCode(instance.id);
    
    // Convert to code generation result
    return {
      success: true,
      code: generated.code.map((c, idx) => ({
        language: c.language,
        filename: this.generateFilename(template, c.language, idx),
        content: c.content
      })),
      confidence: this.calculateConfidence(request, template),
      explanation: this.generateExplanation(request, template, parameters),
      warnings: generated.warnings,
      suggestions: this.generateSuggestions(template, parameters)
    };
  }
  
  private detectIntent(description: string): string {
    const lowerDesc = description.toLowerCase();
    let bestMatch = 'custom';
    let maxScore = 0;
    
    this.nlpPatterns.forEach((keywords, category) => {
      const score = keywords.filter(k => lowerDesc.includes(k)).length;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = category;
      }
    });
    
    return bestMatch;
  }
  
  private selectBestTemplate(intent: string, request: PipelineGenerationRequest): PipelineTemplate | null {
    const templates = templateManager.getTemplatesByCategory(
      intent as any
    );
    
    if (templates.length === 0) {
      // Try to find by tags
      const allTemplates = templateManager.getAllTemplates();
      const matches = allTemplates.filter(t => 
        t.tags.some(tag => request.description.toLowerCase().includes(tag))
      );
      return matches[0] || null;
    }
    
    // Return most popular template in category
    return templates.sort((a, b) => b.popularity - a.popularity)[0];
  }
  
  private extractParameters(request: PipelineGenerationRequest, template: PipelineTemplate): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Set defaults
    template.parameters.forEach(p => {
      if (p.defaultValue !== undefined) {
        params[p.id] = p.defaultValue;
      }
    });
    
    // Extract from request
    if (request.dataSources && request.dataSources.length > 0) {
      params.source_table = request.dataSources[0];
      params.source_database = request.dataSources[0].split('.')[0];
    }
    
    if (request.targetSystems && request.targetSystems.length > 0) {
      params.target_location = request.targetSystems[0];
      params.target_table = request.targetSystems[0];
    }
    
    if (request.processingType) {
      params.processing_mode = request.processingType;
      params.sync_frequency = request.processingType === 'streaming' ? 'realtime' : 'daily';
    }
    
    if (request.schedule) {
      params.schedule = request.schedule;
    }
    
    // Parse specific patterns from description
    const description = request.description.toLowerCase();
    
    // Extract table names
    const tableMatch = description.match(/(?:table|from|sync)\s+(\w+)/);
    if (tableMatch) {
      params.source_table = tableMatch[1];
    }
    
    // Extract schedule patterns
    if (description.includes('daily')) {
      params.schedule = '0 2 * * *';
    } else if (description.includes('hourly')) {
      params.schedule = '0 * * * *';
    } else if (description.includes('every 5 minutes')) {
      params.schedule = '*/5 * * * *';
    }
    
    return params;
  }
  
  private generateCustomPipeline(request: PipelineGenerationRequest): CodeGenerationResult {
    // Generate a basic pipeline when no template matches
    const code = this.generateBasicPipeline(request);
    
    return {
      success: true,
      code: [{
        language: 'python',
        filename: 'custom_pipeline.py',
        content: code
      }],
      confidence: 60,
      explanation: `Generated a custom pipeline based on your description: "${request.description}"`,
      warnings: ['This is a basic implementation. Please review and enhance based on your specific needs.'],
      suggestions: [
        'Consider using a template for better structure',
        'Add error handling and logging',
        'Implement monitoring and alerting'
      ]
    };
  }
  
  private generateBasicPipeline(request: PipelineGenerationRequest): string {
    const description = request.description;
    const sources = request.dataSources || ['source_table'];
    const targets = request.targetSystems || ['target_table'];
    
    return `"""
Pipeline: ${description}
Generated by NexusOne Intelligent Pipeline Builder
"""

import pandas as pd
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CustomPipeline:
    def __init__(self):
        self.source = "${sources[0]}"
        self.target = "${targets[0]}"
        self.processing_type = "${request.processingType || 'batch'}"
    
    def extract(self):
        """Extract data from source"""
        logger.info(f"Extracting data from {self.source}")
        # TODO: Implement extraction logic
        # Example for database:
        # df = pd.read_sql(f"SELECT * FROM {self.source}", connection)
        # Example for file:
        # df = pd.read_csv(self.source)
        
        # Placeholder data
        df = pd.DataFrame()
        return df
    
    def transform(self, df):
        """Transform data"""
        logger.info("Applying transformations")
        
        # TODO: Add your transformation logic here
        # Examples:
        # - Filter: df = df[df['column'] > threshold]
        # - Aggregate: df = df.groupby('key').agg({'value': 'sum'})
        # - Clean: df = df.dropna()
        # - Enrich: df = df.merge(reference_data, on='key')
        
        return df
    
    def load(self, df):
        """Load data to target"""
        logger.info(f"Loading data to {self.target}")
        
        # TODO: Implement loading logic
        # Example for database:
        # df.to_sql(self.target, connection, if_exists='append')
        # Example for file:
        # df.to_parquet(self.target)
        
        logger.info(f"Successfully loaded {len(df)} records")
    
    def run(self):
        """Execute the pipeline"""
        try:
            start_time = datetime.now()
            logger.info(f"Starting pipeline at {start_time}")
            
            # ETL process
            data = self.extract()
            transformed = self.transform(data)
            self.load(transformed)
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.info(f"Pipeline completed in {duration} seconds")
            
        except Exception as e:
            logger.error(f"Pipeline failed: {str(e)}")
            raise

if __name__ == "__main__":
    pipeline = CustomPipeline()
    pipeline.run()
`;
  }
  
  private calculateConfidence(request: PipelineGenerationRequest, template: PipelineTemplate): number {
    let confidence = 70; // Base confidence
    
    // Increase confidence based on matches
    if (request.dataSources && request.dataSources.length > 0) {
      confidence += 10;
    }
    
    if (request.processingType) {
      confidence += 5;
    }
    
    if (request.schedule) {
      confidence += 5;
    }
    
    // Check if template is popular
    if (template.popularity > 80) {
      confidence += 10;
    }
    
    return Math.min(95, confidence);
  }
  
  private generateExplanation(
    request: PipelineGenerationRequest, 
    template: PipelineTemplate,
    parameters: Record<string, any>
  ): string {
    const parts = [
      `I've generated a ${template.name} pipeline based on your request.`,
      `This will ${template.description.toLowerCase()}.`
    ];
    
    if (parameters.source_table) {
      parts.push(`Data source: ${parameters.source_table}`);
    }
    
    if (parameters.target_location || parameters.target_table) {
      parts.push(`Target: ${parameters.target_location || parameters.target_table}`);
    }
    
    if (parameters.schedule) {
      parts.push(`Schedule: ${this.explainSchedule(parameters.schedule)}`);
    }
    
    parts.push(`Estimated build time: ${template.estimatedBuildTime}`);
    
    return parts.join(' ');
  }
  
  private explainSchedule(cron: string): string {
    // Simple cron explanation
    if (cron === '0 2 * * *') return 'Daily at 2 AM';
    if (cron === '0 * * * *') return 'Every hour';
    if (cron === '*/5 * * * *') return 'Every 5 minutes';
    if (cron === '0 0 * * 0') return 'Weekly on Sunday';
    return cron;
  }
  
  private generateSuggestions(template: PipelineTemplate, parameters: Record<string, any>): string[] {
    const suggestions: string[] = [];
    
    // Add template-specific suggestions
    if (template.performanceHints && template.performanceHints.length > 0) {
      suggestions.push(...template.performanceHints.slice(0, 2));
    }
    
    // Add parameter-specific suggestions
    if (!parameters.enable_schema_evolution) {
      suggestions.push('Consider enabling schema evolution for flexibility');
    }
    
    if (parameters.sync_frequency === 'realtime') {
      suggestions.push('Monitor costs closely with real-time processing');
    }
    
    // Add general best practices
    suggestions.push('Add monitoring and alerting for production');
    suggestions.push('Test with sample data before full deployment');
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
  
  private generateFilename(template: PipelineTemplate, language: string, index: number): string {
    const baseName = template.id.replace(/-/g, '_');
    
    const extensions: Record<string, string> = {
      python: 'py',
      sql: 'sql',
      yaml: 'yaml',
      json: 'json',
      scala: 'scala',
      java: 'java'
    };
    
    const ext = extensions[language] || 'txt';
    
    if (language === 'python' && template.generates.airflowDag) {
      return `dag_${baseName}.py`;
    }
    
    if (language === 'sql') {
      return `${baseName}_query.sql`;
    }
    
    return `${baseName}_${index}.${ext}`;
  }
  
  optimizeGeneratedCode(code: string, language: string): {
    optimized: string;
    improvements: string[];
  } {
    const improvements: string[] = [];
    let optimized = code;
    
    if (language === 'sql') {
      // SQL optimizations
      if (code.includes('SELECT *')) {
        improvements.push('Consider selecting specific columns instead of *');
      }
      
      if (!code.includes('LIMIT') && code.includes('SELECT')) {
        improvements.push('Add LIMIT clause for testing');
      }
      
      if (code.includes('JOIN') && !code.includes('INDEX')) {
        improvements.push('Ensure indexes exist on join columns');
      }
    } else if (language === 'python') {
      // Python optimizations
      if (code.includes('for') && code.includes('append')) {
        improvements.push('Consider using list comprehension for better performance');
      }
      
      if (!code.includes('try:')) {
        improvements.push('Add error handling with try-except blocks');
      }
      
      if (!code.includes('logging')) {
        improvements.push('Add logging for better debugging');
      }
    }
    
    return { optimized, improvements };
  }
}

// Export singleton instance
export const codeGenerationService = new CodeGenerationService();