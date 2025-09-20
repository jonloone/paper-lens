export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: 'etl' | 'streaming' | 'batch' | 'quality' | 'reconciliation' | 'ml' | 'custom';
  tags: string[];
  icon: string;
  
  // Popularity and usage
  popularity: number;
  usageCount: number;
  lastUsed?: Date;
  createdBy: string;
  sharedWith: string[]; // team members
  
  // Time estimates
  estimatedBuildTime: string; // "5 minutes", "2 hours", etc.
  estimatedRunTime: string;
  
  // Template configuration
  parameters: TemplateParameter[];
  
  // Generated outputs
  generates: {
    airflowDag?: boolean;
    sqlQueries?: boolean;
    sparkJob?: boolean;
    nifiFlow?: boolean;
    greatExpectations?: boolean;
    dataHubMetadata?: boolean;
  };
  
  // Code generation
  codeTemplates: {
    airflow?: string;
    sql?: string;
    spark?: string;
    python?: string;
    config?: string;
  };
  
  // Data requirements
  sourceRequirements: DataRequirement[];
  targetRequirements: DataRequirement[];
  
  // Quality and monitoring
  qualityChecks: QualityCheck[];
  monitoring: MonitoringConfig;
  
  // Performance hints
  performanceHints?: string[];
  optimizationSuggestions?: string[];
}

export interface TemplateParameter {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'cron';
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[]; // for select/multiselect
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
}

export interface DataRequirement {
  type: 'database' | 'file' | 'stream' | 'api';
  format?: 'csv' | 'json' | 'parquet' | 'avro' | 'delta';
  schema?: {
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
  };
}

export interface QualityCheck {
  name: string;
  type: 'completeness' | 'uniqueness' | 'validity' | 'consistency' | 'accuracy';
  threshold: number;
  action: 'warn' | 'fail';
}

export interface MonitoringConfig {
  metrics: string[];
  alerts: Array<{
    condition: string;
    threshold: number;
    action: string;
  }>;
  sla?: {
    completionTime: string;
    dataFreshness: string;
  };
}

export interface DiscoveredPattern {
  id: string;
  pattern: string;
  description: string;
  occurrences: number;
  pipelines: string[];
  suggestedTemplate?: Partial<PipelineTemplate>;
  potentialSavings: {
    time: string;
    cost?: string;
  };
  confidence: number; // 0-100
}

export interface PipelineGenerationRequest {
  description: string;
  intent?: string;
  dataSources?: string[];
  targetSystems?: string[];
  processingType?: 'batch' | 'streaming' | 'hybrid';
  schedule?: string;
  qualityRequirements?: QualityCheck[];
}

export interface GeneratedPipeline {
  template: PipelineTemplate;
  code: {
    language: string;
    content: string;
  }[];
  config: Record<string, any>;
  deploymentSteps: string[];
  estimatedCost?: string;
  warnings?: string[];
}