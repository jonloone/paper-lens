// Pipeline Templates Library
// Provides reusable templates for common data engineering patterns

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: 'etl' | 'ml' | 'streaming' | 'quality' | 'migration' | 'analytics';
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tags: string[];
  
  // Template configuration
  config: {
    source: SourceConfig;
    transformations: TransformationConfig[];
    destination: DestinationConfig;
    qualityRules: QualityRuleConfig[];
    schedule?: ScheduleConfig;
    notifications?: NotificationConfig;
  };
  
  // Parameters that can be customized
  parameters: TemplateParameter[];
  
  // Best practices and documentation
  bestPractices: string[];
  documentation?: string;
  examples?: Example[];
}

export interface SourceConfig {
  type: string;
  format: string;
  connection?: string;
  schema?: any;
  sampleQuery?: string;
}

export interface TransformationConfig {
  id: string;
  name: string;
  type: 'filter' | 'aggregate' | 'join' | 'pivot' | 'custom';
  config: any;
  order: number;
}

export interface DestinationConfig {
  type: string;
  format: string;
  connection?: string;
  schema?: any;
  partitioning?: string[];
}

export interface QualityRuleConfig {
  dimension: string;
  threshold: number;
  action: 'block' | 'warn' | 'log';
}

export interface ScheduleConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cron?: string;
  timezone?: string;
}

export interface NotificationConfig {
  onSuccess: boolean;
  onFailure: boolean;
  channels: string[];
  recipients: string[];
}

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multi-select';
  label: string;
  description: string;
  required: boolean;
  default?: any;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface Example {
  name: string;
  description: string;
  parameters: Record<string, any>;
  expectedOutput?: any;
}

// Pre-built pipeline templates
export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'template-customer-360',
    name: 'Customer 360 ETL',
    description: 'Unified customer profile from multiple data sources',
    category: 'etl',
    icon: '👥',
    difficulty: 'intermediate',
    estimatedTime: '2-4 hours',
    tags: ['customer', 'profile', 'aggregation', 'master-data'],
    
    config: {
      source: {
        type: 'multi-source',
        format: 'mixed',
        sampleQuery: 'SELECT * FROM customers WHERE updated_at > ${last_run}'
      },
      transformations: [
        {
          id: 'dedup',
          name: 'Deduplicate Records',
          type: 'custom',
          config: {
            keys: ['email', 'customer_id'],
            strategy: 'keep_latest'
          },
          order: 1
        },
        {
          id: 'enrich',
          name: 'Enrich Customer Data',
          type: 'join',
          config: {
            joinType: 'left',
            joinKeys: ['customer_id'],
            tables: ['transactions', 'support_tickets', 'preferences']
          },
          order: 2
        },
        {
          id: 'aggregate',
          name: 'Calculate Metrics',
          type: 'aggregate',
          config: {
            groupBy: ['customer_id'],
            metrics: [
              'lifetime_value',
              'purchase_frequency',
              'average_order_value',
              'churn_risk_score'
            ]
          },
          order: 3
        }
      ],
      destination: {
        type: 'data-warehouse',
        format: 'parquet',
        partitioning: ['created_date', 'segment']
      },
      qualityRules: [
        {
          dimension: 'completeness',
          threshold: 95,
          action: 'block'
        },
        {
          dimension: 'uniqueness',
          threshold: 100,
          action: 'block'
        },
        {
          dimension: 'accuracy',
          threshold: 90,
          action: 'warn'
        }
      ],
      schedule: {
        frequency: 'daily',
        cron: '0 2 * * *',
        timezone: 'UTC'
      },
      notifications: {
        onSuccess: true,
        onFailure: true,
        channels: ['email', 'slack'],
        recipients: ['data-team@company.com']
      }
    },
    
    parameters: [
      {
        name: 'source_database',
        type: 'select',
        label: 'Source Database',
        description: 'Primary database containing customer data',
        required: true,
        options: [
          { value: 'postgres_prod', label: 'Production PostgreSQL' },
          { value: 'mysql_legacy', label: 'Legacy MySQL' },
          { value: 'mongodb_app', label: 'Application MongoDB' }
        ]
      },
      {
        name: 'lookback_days',
        type: 'number',
        label: 'Lookback Period (days)',
        description: 'Number of days of historical data to process',
        required: false,
        default: 30,
        validation: {
          min: 1,
          max: 365
        }
      },
      {
        name: 'include_pii',
        type: 'boolean',
        label: 'Include PII',
        description: 'Include personally identifiable information',
        required: false,
        default: false
      }
    ],
    
    bestPractices: [
      'Always validate email formats before deduplication',
      'Use CDC (Change Data Capture) for real-time updates when possible',
      'Implement PII masking for non-production environments',
      'Monitor data freshness with timeliness quality checks',
      'Set up alerts for sudden changes in customer metrics'
    ],
    
    documentation: '/docs/templates/customer-360',
    
    examples: [
      {
        name: 'E-commerce Customer Profile',
        description: 'Build comprehensive customer profiles for an e-commerce platform',
        parameters: {
          source_database: 'postgres_prod',
          lookback_days: 90,
          include_pii: false
        }
      }
    ]
  },
  
  {
    id: 'template-ml-feature-pipeline',
    name: 'ML Feature Engineering',
    description: 'Create and validate features for machine learning models',
    category: 'ml',
    icon: '🤖',
    difficulty: 'advanced',
    estimatedTime: '3-5 hours',
    tags: ['ml', 'features', 'training', 'validation'],
    
    config: {
      source: {
        type: 'feature-store',
        format: 'parquet',
        schema: {
          entity_id: 'string',
          timestamp: 'timestamp',
          features: 'map<string, double>'
        }
      },
      transformations: [
        {
          id: 'feature-extract',
          name: 'Extract Raw Features',
          type: 'custom',
          config: {
            feature_definitions: 'features.yaml',
            time_windows: ['1h', '24h', '7d', '30d']
          },
          order: 1
        },
        {
          id: 'feature-transform',
          name: 'Feature Transformations',
          type: 'custom',
          config: {
            scaling: 'standard',
            encoding: 'one-hot',
            imputation: 'median'
          },
          order: 2
        },
        {
          id: 'feature-validate',
          name: 'Statistical Validation',
          type: 'custom',
          config: {
            checks: ['distribution', 'correlation', 'drift'],
            baseline: 'last_training'
          },
          order: 3
        }
      ],
      destination: {
        type: 'feature-store',
        format: 'tfrecord',
        partitioning: ['date', 'model_version']
      },
      qualityRules: [
        {
          dimension: 'completeness',
          threshold: 98,
          action: 'block'
        },
        {
          dimension: 'validity',
          threshold: 95,
          action: 'block'
        },
        {
          dimension: 'consistency',
          threshold: 90,
          action: 'warn'
        }
      ]
    },
    
    parameters: [
      {
        name: 'model_type',
        type: 'select',
        label: 'Model Type',
        description: 'Type of ML model these features are for',
        required: true,
        options: [
          { value: 'classification', label: 'Classification' },
          { value: 'regression', label: 'Regression' },
          { value: 'clustering', label: 'Clustering' },
          { value: 'recommendation', label: 'Recommendation' }
        ]
      },
      {
        name: 'feature_version',
        type: 'string',
        label: 'Feature Version',
        description: 'Version identifier for this feature set',
        required: true,
        validation: {
          pattern: '^v\\d+\\.\\d+\\.\\d+$'
        }
      }
    ],
    
    bestPractices: [
      'Version your feature definitions for reproducibility',
      'Monitor feature drift between training and serving',
      'Implement feature importance tracking',
      'Use consistent scaling across training and inference',
      'Document feature lineage and transformations'
    ]
  },
  
  {
    id: 'template-real-time-streaming',
    name: 'Real-time Event Processing',
    description: 'Process streaming data with low latency',
    category: 'streaming',
    icon: '⚡',
    difficulty: 'advanced',
    estimatedTime: '4-6 hours',
    tags: ['streaming', 'real-time', 'events', 'kafka'],
    
    config: {
      source: {
        type: 'kafka',
        format: 'json',
        connection: 'kafka://broker:9092',
        schema: {
          event_id: 'string',
          event_type: 'string',
          timestamp: 'long',
          payload: 'string'
        }
      },
      transformations: [
        {
          id: 'parse',
          name: 'Parse Events',
          type: 'custom',
          config: {
            parser: 'json',
            schema_registry: true
          },
          order: 1
        },
        {
          id: 'filter',
          name: 'Filter Events',
          type: 'filter',
          config: {
            conditions: ['event_type IN ("purchase", "click", "view")'],
            drop_nulls: true
          },
          order: 2
        },
        {
          id: 'window',
          name: 'Window Aggregation',
          type: 'aggregate',
          config: {
            window_type: 'tumbling',
            window_size: '5m',
            aggregations: ['count', 'sum', 'avg']
          },
          order: 3
        }
      ],
      destination: {
        type: 'multi-sink',
        format: 'json',
        partitioning: ['event_type', 'hour']
      },
      qualityRules: [
        {
          dimension: 'timeliness',
          threshold: 99,
          action: 'warn'
        },
        {
          dimension: 'validity',
          threshold: 95,
          action: 'log'
        }
      ]
    },
    
    parameters: [
      {
        name: 'kafka_topic',
        type: 'string',
        label: 'Kafka Topic',
        description: 'Source Kafka topic name',
        required: true
      },
      {
        name: 'processing_guarantee',
        type: 'select',
        label: 'Processing Guarantee',
        description: 'Message processing semantics',
        required: true,
        default: 'exactly-once',
        options: [
          { value: 'at-most-once', label: 'At Most Once' },
          { value: 'at-least-once', label: 'At Least Once' },
          { value: 'exactly-once', label: 'Exactly Once' }
        ]
      }
    ],
    
    bestPractices: [
      'Implement proper error handling and dead letter queues',
      'Monitor consumer lag and processing latency',
      'Use schema registry for schema evolution',
      'Implement backpressure handling',
      'Set up proper checkpointing for fault tolerance'
    ]
  },
  
  {
    id: 'template-data-quality-audit',
    name: 'Data Quality Audit',
    description: 'Comprehensive quality assessment and monitoring',
    category: 'quality',
    icon: '✅',
    difficulty: 'beginner',
    estimatedTime: '1-2 hours',
    tags: ['quality', 'audit', 'validation', 'monitoring'],
    
    config: {
      source: {
        type: 'any',
        format: 'any'
      },
      transformations: [
        {
          id: 'profile',
          name: 'Data Profiling',
          type: 'custom',
          config: {
            compute_statistics: true,
            detect_patterns: true,
            identify_pii: true
          },
          order: 1
        },
        {
          id: 'validate',
          name: 'Quality Validation',
          type: 'custom',
          config: {
            dimensions: ['completeness', 'accuracy', 'consistency', 'validity', 'uniqueness', 'timeliness'],
            custom_rules: []
          },
          order: 2
        },
        {
          id: 'report',
          name: 'Generate Report',
          type: 'custom',
          config: {
            format: 'html',
            include_visualizations: true,
            include_recommendations: true
          },
          order: 3
        }
      ],
      destination: {
        type: 'report',
        format: 'html'
      },
      qualityRules: [
        {
          dimension: 'completeness',
          threshold: 90,
          action: 'warn'
        }
      ],
      notifications: {
        onSuccess: true,
        onFailure: true,
        channels: ['email'],
        recipients: ['quality-team@company.com']
      }
    },
    
    parameters: [
      {
        name: 'audit_depth',
        type: 'select',
        label: 'Audit Depth',
        description: 'Level of detail for quality assessment',
        required: true,
        default: 'standard',
        options: [
          { value: 'basic', label: 'Basic - Quick scan' },
          { value: 'standard', label: 'Standard - Full assessment' },
          { value: 'deep', label: 'Deep - Detailed analysis' }
        ]
      }
    ],
    
    bestPractices: [
      'Run quality audits before any major data migration',
      'Set up regular quality monitoring schedules',
      'Track quality metrics over time to identify trends',
      'Document all quality issues and remediation steps',
      'Involve data owners in quality improvement initiatives'
    ]
  },
  
  {
    id: 'template-cdc-replication',
    name: 'CDC Data Replication',
    description: 'Real-time change data capture and replication',
    category: 'migration',
    icon: '🔄',
    difficulty: 'intermediate',
    estimatedTime: '2-3 hours',
    tags: ['cdc', 'replication', 'real-time', 'sync'],
    
    config: {
      source: {
        type: 'database',
        format: 'cdc-stream',
        connection: 'postgres://source'
      },
      transformations: [
        {
          id: 'capture',
          name: 'Capture Changes',
          type: 'custom',
          config: {
            capture_mode: 'logical',
            include_schema_changes: true,
            snapshot_mode: 'initial'
          },
          order: 1
        },
        {
          id: 'transform',
          name: 'Transform Changes',
          type: 'custom',
          config: {
            apply_mappings: true,
            handle_deletes: true,
            resolve_conflicts: 'latest_wins'
          },
          order: 2
        }
      ],
      destination: {
        type: 'database',
        format: 'sql',
        connection: 'postgres://target'
      },
      qualityRules: [
        {
          dimension: 'consistency',
          threshold: 100,
          action: 'block'
        },
        {
          dimension: 'timeliness',
          threshold: 99,
          action: 'warn'
        }
      ]
    },
    
    parameters: [
      {
        name: 'tables',
        type: 'multi-select',
        label: 'Tables to Replicate',
        description: 'Select tables for CDC replication',
        required: true,
        options: []
      },
      {
        name: 'sync_mode',
        type: 'select',
        label: 'Sync Mode',
        description: 'Synchronization strategy',
        required: true,
        default: 'incremental',
        options: [
          { value: 'full', label: 'Full Sync' },
          { value: 'incremental', label: 'Incremental' },
          { value: 'append-only', label: 'Append Only' }
        ]
      }
    ],
    
    bestPractices: [
      'Test CDC setup in a non-production environment first',
      'Monitor replication lag continuously',
      'Implement proper error handling for network failures',
      'Set up data validation between source and target',
      'Plan for schema evolution and backwards compatibility'
    ]
  }
];

// Template management functions
export class PipelineTemplateService {
  private templates: Map<string, PipelineTemplate>;
  
  constructor() {
    this.templates = new Map();
    PIPELINE_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }
  
  // Get all templates
  getAllTemplates(): PipelineTemplate[] {
    return Array.from(this.templates.values());
  }
  
  // Get template by ID
  getTemplate(id: string): PipelineTemplate | undefined {
    return this.templates.get(id);
  }
  
  // Get templates by category
  getTemplatesByCategory(category: string): PipelineTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.category === category);
  }
  
  // Search templates
  searchTemplates(query: string): PipelineTemplate[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.templates.values())
      .filter(t => 
        t.name.toLowerCase().includes(queryLower) ||
        t.description.toLowerCase().includes(queryLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
  }
  
  // Generate pipeline configuration from template
  generatePipeline(templateId: string, parameters: Record<string, any>): any {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Validate required parameters
    template.parameters.forEach(param => {
      if (param.required && !parameters[param.name]) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }
    });
    
    // Apply parameters to template config
    const config = JSON.parse(JSON.stringify(template.config));
    
    // Replace parameter placeholders in config
    const configStr = JSON.stringify(config);
    const replacedStr = configStr.replace(/\${(\w+)}/g, (match, param) => {
      return parameters[param] || match;
    });
    
    return {
      ...JSON.parse(replacedStr),
      metadata: {
        templateId: template.id,
        templateName: template.name,
        generatedAt: new Date(),
        parameters
      }
    };
  }
  
  // Validate template parameters
  validateParameters(templateId: string, parameters: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const template = this.templates.get(templateId);
    if (!template) {
      return { valid: false, errors: [`Template ${templateId} not found`] };
    }
    
    const errors: string[] = [];
    
    template.parameters.forEach(param => {
      const value = parameters[param.name];
      
      // Check required
      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push(`${param.label} is required`);
        return;
      }
      
      // Skip validation if not provided and not required
      if (!param.required && (value === undefined || value === null)) {
        return;
      }
      
      // Type validation
      if (param.type === 'number' && typeof value !== 'number') {
        errors.push(`${param.label} must be a number`);
      }
      
      // Pattern validation
      if (param.validation?.pattern) {
        const regex = new RegExp(param.validation.pattern);
        if (!regex.test(String(value))) {
          errors.push(`${param.label} format is invalid`);
        }
      }
      
      // Range validation
      if (param.type === 'number') {
        if (param.validation?.min !== undefined && value < param.validation.min) {
          errors.push(`${param.label} must be at least ${param.validation.min}`);
        }
        if (param.validation?.max !== undefined && value > param.validation.max) {
          errors.push(`${param.label} must be at most ${param.validation.max}`);
        }
      }
      
      // Options validation
      if (param.type === 'select' && param.options) {
        const validValues = param.options.map(o => o.value);
        if (!validValues.includes(value)) {
          errors.push(`${param.label} must be one of: ${validValues.join(', ')}`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const templateService = new PipelineTemplateService();