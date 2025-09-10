import { 
  PipelinePattern, 
  RealPipeline, 
  RealNode, 
  RealEdge, 
  LayoutStrategy,
  PipelineSource,
  IntegrationLevel,
  Environment
} from '@/lib/types/RealNode';
import { LayoutIntelligence } from './LayoutIntelligence';

interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'select' | 'node-type' | 'environment';
  description: string;
  default?: any;
  options?: any[];
  required: boolean;
}

interface ToolAvailability {
  [tool: string]: {
    available: boolean;
    integration: IntegrationLevel;
    endpoint?: string;
    mcpServer?: string;
  };
}

export class PipelineTemplateService {
  private layoutIntelligence: LayoutIntelligence;
  private templates: Map<string, PipelinePattern> = new Map();

  constructor() {
    this.layoutIntelligence = new LayoutIntelligence();
    this.initializeCommonTemplates();
  }

  /**
   * Initialize common pipeline templates
   */
  private initializeCommonTemplates(): void {
    const commonTemplates: PipelinePattern[] = [
      {
        id: 'stream-processing',
        name: 'Real-time Stream Processing',
        category: 'streaming',
        description: 'Kafka → Spark Streaming → Transformation → Data Warehouse',
        template: {
          nodes: [
            {
              id: 'source',
              type: 'kafka.consumer',
              label: '{{sourceName}}',
              position: { x: 100, y: 100 },
              reality: {
                source: 'kafka' as PipelineSource,
                sourceId: '',
                location: {
                  system: '{{kafkaCluster}}',
                  environment: '{{environment}}' as Environment
                },
                integration: {
                  level: 'tool-direct' as IntegrationLevel
                },
                lastSync: {
                  timestamp: '',
                  status: 'unknown' as const,
                  hash: ''
                }
              },
              config: {
                actual: {
                  topic: '{{topicName}}',
                  consumerGroup: '{{consumerGroup}}',
                  autoOffsetReset: 'latest'
                }
              },
              execution: {
                runtime: {
                  engine: 'kafka' as const
                }
              }
            },
            {
              id: 'processor',
              type: 'spark.streaming',
              label: 'Stream Processor',
              position: { x: 400, y: 100 },
              reality: {
                source: 'spark' as PipelineSource,
                sourceId: '',
                location: {
                  system: '{{sparkCluster}}',
                  environment: '{{environment}}' as Environment
                },
                integration: {
                  level: 'mcp-full' as IntegrationLevel,
                  mcpServer: 'spark'
                },
                lastSync: {
                  timestamp: '',
                  status: 'unknown' as const,
                  hash: ''
                }
              },
              config: {
                actual: {
                  batchDuration: '{{batchDuration}}',
                  executorMemory: '{{executorMemory}}',
                  executorCores: '{{executorCores}}'
                }
              },
              execution: {
                runtime: {
                  engine: 'spark' as const
                },
                resources: {
                  memory: '{{executorMemory}}',
                  executors: 2
                }
              }
            },
            {
              id: 'transformer',
              type: 'transformation',
              label: 'Data Transformation',
              position: { x: 700, y: 100 },
              reality: {
                source: 'spark' as PipelineSource,
                sourceId: '',
                location: {
                  system: '{{sparkCluster}}',
                  environment: '{{environment}}' as Environment
                },
                integration: {
                  level: 'mcp-full' as IntegrationLevel,
                  mcpServer: 'spark'
                },
                lastSync: {
                  timestamp: '',
                  status: 'unknown' as const,
                  hash: ''
                }
              },
              config: {
                actual: {
                  transformations: '{{transformations}}'
                }
              },
              execution: {
                runtime: {
                  engine: 'spark' as const
                }
              }
            },
            {
              id: 'sink',
              type: 'warehouse.sink',
              label: '{{warehouseName}}',
              position: { x: 1000, y: 100 },
              reality: {
                source: 'snowflake' as PipelineSource,
                sourceId: '',
                location: {
                  system: '{{warehouseEndpoint}}',
                  environment: '{{environment}}' as Environment
                },
                integration: {
                  level: 'tool-direct' as IntegrationLevel
                },
                lastSync: {
                  timestamp: '',
                  status: 'unknown' as const,
                  hash: ''
                }
              },
              config: {
                actual: {
                  database: '{{database}}',
                  schema: '{{schema}}',
                  table: '{{table}}'
                }
              },
              execution: {
                runtime: {
                  engine: 'snowflake' as const
                }
              }
            }
          ],
          edges: [
            { id: 'source-processor', source: 'source', target: 'processor' },
            { id: 'processor-transformer', source: 'processor', target: 'transformer' },
            { id: 'transformer-sink', source: 'transformer', target: 'sink' }
          ],
          layout: {
            algorithm: 'dagre',
            direction: 'LR',
            spacing: { x: 300, y: 100 }
          }
        },
        parameters: [
          {
            name: 'sourceName',
            type: 'string',
            description: 'Name for the data source',
            default: 'Customer Events',
            required: true
          },
          {
            name: 'topicName',
            type: 'string',
            description: 'Kafka topic to consume from',
            default: 'customer-events',
            required: true
          },
          {
            name: 'consumerGroup',
            type: 'string',
            description: 'Kafka consumer group ID',
            default: 'stream-processor',
            required: true
          },
          {
            name: 'kafkaCluster',
            type: 'string',
            description: 'Kafka cluster endpoint',
            default: 'localhost:9092',
            required: true
          },
          {
            name: 'sparkCluster',
            type: 'string',
            description: 'Spark cluster endpoint',
            default: 'spark://localhost:7077',
            required: true
          },
          {
            name: 'batchDuration',
            type: 'string',
            description: 'Spark streaming batch duration',
            default: '10 seconds',
            required: true
          },
          {
            name: 'executorMemory',
            type: 'string',
            description: 'Memory per executor',
            default: '2g',
            required: true
          },
          {
            name: 'executorCores',
            type: 'number',
            description: 'CPU cores per executor',
            default: 2,
            required: true
          },
          {
            name: 'transformations',
            type: 'string',
            description: 'Data transformation logic',
            default: 'SELECT * FROM input WHERE timestamp > current_timestamp - interval 1 hour',
            required: false
          },
          {
            name: 'warehouseName',
            type: 'string',
            description: 'Data warehouse name',
            default: 'Customer Warehouse',
            required: true
          },
          {
            name: 'warehouseEndpoint',
            type: 'string',
            description: 'Data warehouse endpoint',
            default: 'account.snowflakecomputing.com',
            required: true
          },
          {
            name: 'database',
            type: 'string',
            description: 'Target database',
            default: 'ANALYTICS',
            required: true
          },
          {
            name: 'schema',
            type: 'string',
            description: 'Target schema',
            default: 'STREAMING',
            required: true
          },
          {
            name: 'table',
            type: 'string',
            description: 'Target table',
            default: 'CUSTOMER_EVENTS',
            required: true
          },
          {
            name: 'environment',
            type: 'environment',
            description: 'Deployment environment',
            default: 'dev',
            options: ['dev', 'staging', 'prod'],
            required: true
          }
        ],
        requirements: {
          tools: ['kafka', 'spark', 'snowflake'],
          mcpServers: ['spark'],
          minNodes: 3,
          maxNodes: 6
        },
        usage: {
          count: 0,
          lastUsed: '',
          successRate: 0,
          avgSetupTime: 0
        }
      },
      {
        id: 'batch-etl',
        name: 'Batch ETL Pipeline',
        category: 'etl',
        description: 'Database → Spark Batch → Quality Checks → Data Warehouse',
        template: {
          nodes: [
            {
              id: 'extractor',
              type: 'database.source',
              label: '{{sourceDatabase}}',
              position: { x: 100, y: 100 },
              reality: {
                source: 'manual' as PipelineSource,
                sourceId: '',
                location: {
                  system: '{{sourceEndpoint}}',
                  environment: '{{environment}}' as Environment
                },
                integration: {
                  level: 'config-only' as IntegrationLevel
                },
                lastSync: {
                  timestamp: '',
                  status: 'unknown' as const,
                  hash: ''
                }
              },
              config: {
                actual: {
                  connectionString: '{{sourceConnectionString}}',
                  query: '{{extractQuery}}',
                  incrementalField: '{{incrementalField}}'
                }
              },
              execution: {
                schedule: {
                  cron: '{{schedule}}',
                  trigger: 'scheduled' as const
                }
              }
            },
            {
              id: 'transformer',
              type: 'spark.batch',
              label: 'Data Transformer',
              position: { x: 400, y: 100 },
              reality: {
                source: 'spark' as PipelineSource,
                sourceId: '',
                location: {
                  system: '{{sparkCluster}}',
                  environment: '{{environment}}' as Environment
                },
                integration: {
                  level: 'mcp-full' as IntegrationLevel,
                  mcpServer: 'spark'
                },
                lastSync: {
                  timestamp: '',
                  status: 'unknown' as const,
                  hash: ''
                }
              },
              config: {
                actual: {
                  transformationScript: '{{transformationScript}}',
                  outputFormat: 'parquet'
                }
              },
              execution: {
                runtime: {
                  engine: 'spark' as const
                },
                resources: {
                  memory: '{{executorMemory}}',
                  executors: 4
                }
              }
            },
            {
              id: 'validator',
              type: 'quality.check',
              label: 'Data Quality',
              position: { x: 700, y: 100 },
              reality: {
                source: 'dbt' as PipelineSource,
                sourceId: '',
                location: {
                  system: '{{dbtProject}}',
                  environment: '{{environment}}' as Environment
                },
                integration: {
                  level: 'mcp-full' as IntegrationLevel,
                  mcpServer: 'dbt'
                },
                lastSync: {
                  timestamp: '',
                  status: 'unknown' as const,
                  hash: ''
                }
              },
              config: {
                actual: {
                  tests: '{{qualityTests}}',
                  failureThreshold: 0.05
                }
              },
              execution: {
                runtime: {
                  engine: 'dbt' as const
                }
              }
            },
            {
              id: 'loader',
              type: 'warehouse.sink',
              label: '{{targetWarehouse}}',
              position: { x: 1000, y: 100 },
              reality: {
                source: 'snowflake' as PipelineSource,
                sourceId: '',
                location: {
                  system: '{{warehouseEndpoint}}',
                  environment: '{{environment}}' as Environment
                },
                integration: {
                  level: 'tool-direct' as IntegrationLevel
                },
                lastSync: {
                  timestamp: '',
                  status: 'unknown' as const,
                  hash: ''
                }
              },
              config: {
                actual: {
                  database: '{{targetDatabase}}',
                  schema: '{{targetSchema}}',
                  table: '{{targetTable}}',
                  loadStrategy: 'upsert'
                }
              },
              execution: {
                runtime: {
                  engine: 'snowflake' as const
                }
              }
            }
          ],
          edges: [
            { id: 'extractor-transformer', source: 'extractor', target: 'transformer' },
            { id: 'transformer-validator', source: 'transformer', target: 'validator' },
            { id: 'validator-loader', source: 'validator', target: 'loader' }
          ]
        },
        parameters: [
          {
            name: 'sourceDatabase',
            type: 'string',
            description: 'Source database name',
            default: 'Production Database',
            required: true
          },
          {
            name: 'sourceEndpoint',
            type: 'string',
            description: 'Source database endpoint',
            required: true
          },
          {
            name: 'sourceConnectionString',
            type: 'string',
            description: 'Database connection string',
            required: true
          },
          {
            name: 'extractQuery',
            type: 'string',
            description: 'SQL query to extract data',
            default: 'SELECT * FROM customers WHERE updated_at > ?',
            required: true
          },
          {
            name: 'incrementalField',
            type: 'string',
            description: 'Field for incremental extraction',
            default: 'updated_at',
            required: false
          },
          {
            name: 'schedule',
            type: 'string',
            description: 'Cron schedule for execution',
            default: '0 2 * * *',
            required: true
          },
          {
            name: 'sparkCluster',
            type: 'string',
            description: 'Spark cluster endpoint',
            required: true
          },
          {
            name: 'transformationScript',
            type: 'string',
            description: 'Data transformation logic',
            required: true
          },
          {
            name: 'executorMemory',
            type: 'string',
            description: 'Memory per Spark executor',
            default: '4g',
            required: true
          },
          {
            name: 'dbtProject',
            type: 'string',
            description: 'DBT project location',
            required: true
          },
          {
            name: 'qualityTests',
            type: 'string',
            description: 'Data quality test definitions',
            required: true
          },
          {
            name: 'targetWarehouse',
            type: 'string',
            description: 'Target warehouse name',
            default: 'Analytics Warehouse',
            required: true
          },
          {
            name: 'warehouseEndpoint',
            type: 'string',
            description: 'Warehouse endpoint',
            required: true
          },
          {
            name: 'targetDatabase',
            type: 'string',
            description: 'Target database',
            required: true
          },
          {
            name: 'targetSchema',
            type: 'string',
            description: 'Target schema',
            required: true
          },
          {
            name: 'targetTable',
            type: 'string',
            description: 'Target table',
            required: true
          },
          {
            name: 'environment',
            type: 'environment',
            description: 'Deployment environment',
            default: 'dev',
            options: ['dev', 'staging', 'prod'],
            required: true
          }
        ],
        requirements: {
          tools: ['spark', 'dbt', 'snowflake'],
          mcpServers: ['spark', 'dbt'],
          minNodes: 4,
          maxNodes: 8
        },
        usage: {
          count: 0,
          lastUsed: '',
          successRate: 0,
          avgSetupTime: 0
        }
      },
      {
        id: 'ml-training',
        name: 'ML Model Training Pipeline',
        category: 'ml',
        description: 'Data Prep → Feature Engineering → Model Training → Model Registry',
        template: {
          nodes: [
            {
              id: 'dataprep',
              type: 'data.preparation',
              label: 'Data Preparation',
              position: { x: 100, y: 100 }
            },
            {
              id: 'features',
              type: 'feature.engineering',
              label: 'Feature Engineering',
              position: { x: 400, y: 100 }
            },
            {
              id: 'training',
              type: 'ml.training',
              label: 'Model Training',
              position: { x: 700, y: 100 }
            },
            {
              id: 'registry',
              type: 'ml.registry',
              label: 'Model Registry',
              position: { x: 1000, y: 100 }
            }
          ],
          edges: [
            { id: 'dataprep-features', source: 'dataprep', target: 'features' },
            { id: 'features-training', source: 'features', target: 'training' },
            { id: 'training-registry', source: 'training', target: 'registry' }
          ]
        },
        parameters: [
          {
            name: 'dataSource',
            type: 'string',
            description: 'Training data source',
            required: true
          },
          {
            name: 'modelType',
            type: 'select',
            description: 'Type of ML model',
            options: ['classification', 'regression', 'clustering', 'neural_network'],
            default: 'classification',
            required: true
          },
          {
            name: 'features',
            type: 'string',
            description: 'Feature columns (comma-separated)',
            required: true
          },
          {
            name: 'targetColumn',
            type: 'string',
            description: 'Target column for prediction',
            required: true
          },
          {
            name: 'environment',
            type: 'environment',
            description: 'Environment',
            default: 'dev',
            options: ['dev', 'staging', 'prod'],
            required: true
          }
        ],
        requirements: {
          tools: ['spark', 'mlflow'],
          mcpServers: ['spark', 'mlflow'],
          minNodes: 4,
          maxNodes: 10
        },
        usage: {
          count: 0,
          lastUsed: '',
          successRate: 0,
          avgSetupTime: 0
        }
      }
    ];

    // Register templates
    for (const template of commonTemplates) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * Get all available templates
   */
  getTemplates(): PipelinePattern[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): PipelinePattern[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): PipelinePattern | undefined {
    return this.templates.get(id);
  }

  /**
   * Apply template with parameters to create a real pipeline
   */
  async applyTemplate(
    templateId: string,
    parameters: Record<string, any>,
    toolAvailability: ToolAvailability
  ): Promise<RealPipeline> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate parameters
    this.validateParameters(template, parameters);

    // Clone template structure
    const pipeline = this.cloneTemplate(template);

    // Apply parameter substitution
    const substituted = this.substituteParameters(pipeline, parameters);

    // Map nodes to real implementations based on tool availability
    const realNodes = await this.mapToRealNodes(substituted.nodes, toolAvailability);

    // Apply intelligent layout
    const layout = await this.layoutIntelligence.analyzePipeline(realNodes, substituted.edges);
    const positioned = await this.layoutIntelligence.applyLayout(realNodes, substituted.edges, layout);

    // Update template usage statistics
    this.updateTemplateUsage(templateId);

    return {
      id: this.generatePipelineId(templateId),
      name: parameters.pipelineName || template.name,
      description: template.description,
      nodes: positioned.nodes,
      edges: positioned.edges.map(e => ({
        ...e,
        animated: true,
        reality: {
          source: 'manual' as PipelineSource,
          type: 'data-flow' as const
        }
      })),
      reality: {
        source: 'manual' as PipelineSource,
        sourceId: '',
        location: {
          system: 'nexusone',
          environment: parameters.environment || 'dev'
        },
        lastSync: {
          timestamp: new Date().toISOString(),
          status: 'synced' as const,
          hash: this.generateHash()
        }
      },
      version: {
        current: '1.0.0'
      },
      metadata: {
        fromTemplate: templateId,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        tags: [template.category, 'template-generated']
      }
    };
  }

  /**
   * Validate template parameters
   */
  private validateParameters(template: PipelinePattern, parameters: Record<string, any>): void {
    const errors: string[] = [];

    for (const param of template.parameters) {
      if (param.required && !parameters[param.name]) {
        errors.push(`Missing required parameter: ${param.name}`);
      }

      if (param.type === 'select' && param.options && parameters[param.name]) {
        if (!param.options.includes(parameters[param.name])) {
          errors.push(`Invalid value for ${param.name}. Must be one of: ${param.options.join(', ')}`);
        }
      }

      if (param.type === 'number' && parameters[param.name] && isNaN(Number(parameters[param.name]))) {
        errors.push(`Parameter ${param.name} must be a number`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Parameter validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Clone template structure
   */
  private cloneTemplate(template: PipelinePattern): any {
    return JSON.parse(JSON.stringify(template.template));
  }

  /**
   * Substitute template parameters
   */
  private substituteParameters(pipeline: any, parameters: Record<string, any>): any {
    const jsonString = JSON.stringify(pipeline);
    const substituted = jsonString.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return parameters[key] !== undefined ? parameters[key] : match;
    });
    return JSON.parse(substituted);
  }

  /**
   * Map template nodes to real nodes based on tool availability
   */
  private async mapToRealNodes(templateNodes: any[], toolAvailability: ToolAvailability): Promise<RealNode[]> {
    const realNodes: RealNode[] = [];

    for (const templateNode of templateNodes) {
      const realNode = await this.mapToRealNode(templateNode, toolAvailability);
      realNodes.push(realNode);
    }

    return realNodes;
  }

  /**
   * Map single template node to real node
   */
  private async mapToRealNode(templateNode: any, toolAvailability: ToolAvailability): Promise<RealNode> {
    // Find best available implementation for this node type
    const implementations = this.findNodeImplementations(templateNode.type);
    
    // Prefer MCP > Tool Direct > Config Only
    const selected = implementations.find(impl => 
      toolAvailability[impl.tool]?.available && 
      toolAvailability[impl.tool]?.integration === 'mcp-full'
    ) || implementations.find(impl =>
      toolAvailability[impl.tool]?.available && 
      toolAvailability[impl.tool]?.integration === 'tool-direct'
    ) || implementations[0];

    if (!selected) {
      throw new Error(`No implementation found for node type: ${templateNode.type}`);
    }

    // Build real node with reality reference
    const realNode: RealNode = {
      ...templateNode,
      reality: {
        ...templateNode.reality,
        integration: {
          level: toolAvailability[selected.tool]?.integration || 'config-only',
          mcpServer: toolAvailability[selected.tool]?.integration === 'mcp-full' ? selected.tool : undefined,
          apiEndpoint: toolAvailability[selected.tool]?.endpoint
        },
        lastSync: {
          timestamp: new Date().toISOString(),
          status: 'unknown' as const,
          hash: this.generateHash()
        }
      }
    };

    return realNode;
  }

  /**
   * Find possible implementations for a node type
   */
  private findNodeImplementations(nodeType: string): { tool: string; nodeType: string }[] {
    const implementations: { tool: string; nodeType: string }[] = [];

    // Map node types to possible tool implementations
    const typeMapping: Record<string, string[]> = {
      'kafka.consumer': ['kafka'],
      'kafka.producer': ['kafka'],
      'spark.streaming': ['spark'],
      'spark.batch': ['spark'],
      'transformation': ['spark', 'dbt'],
      'warehouse.sink': ['snowflake', 'postgres'],
      'database.source': ['postgres', 'mysql'],
      'quality.check': ['dbt', 'spark'],
      'ml.training': ['spark', 'mlflow'],
      'ml.registry': ['mlflow'],
      'data.preparation': ['spark'],
      'feature.engineering': ['spark']
    };

    const tools = typeMapping[nodeType] || ['manual'];
    
    for (const tool of tools) {
      implementations.push({
        tool,
        nodeType
      });
    }

    return implementations;
  }

  /**
   * Update template usage statistics
   */
  private updateTemplateUsage(templateId: string): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.usage.count++;
      template.usage.lastUsed = new Date().toISOString();
      // Usage tracking would be persisted in production
    }
  }

  /**
   * Create new custom template
   */
  createTemplate(
    id: string,
    name: string,
    category: 'etl' | 'streaming' | 'ml' | 'orchestration' | 'custom',
    description: string,
    pipeline: RealPipeline,
    parameters: TemplateParameter[]
  ): PipelinePattern {
    const template: PipelinePattern = {
      id,
      name,
      category,
      description,
      template: {
        nodes: pipeline.nodes.map(n => ({ ...n })),
        edges: pipeline.edges.map(e => ({ ...e })),
        layout: {
          algorithm: 'dagre',
          direction: 'LR',
          spacing: { x: 200, y: 100 }
        }
      },
      parameters,
      requirements: {
        tools: [...new Set(pipeline.nodes.map(n => n.reality.source))],
        mcpServers: [...new Set(pipeline.nodes
          .filter(n => n.reality.integration.mcpServer)
          .map(n => n.reality.integration.mcpServer!))],
        minNodes: pipeline.nodes.length,
        maxNodes: pipeline.nodes.length * 2
      },
      usage: {
        count: 0,
        lastUsed: '',
        successRate: 0,
        avgSetupTime: 0
      }
    };

    this.templates.set(id, template);
    return template;
  }

  /**
   * Helper methods
   */
  private generatePipelineId(templateId: string): string {
    return `${templateId}-${Date.now()}`;
  }

  private generateHash(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Get template recommendations based on existing pipeline
   */
  getRecommendations(existingPipeline?: RealPipeline): PipelinePattern[] {
    const allTemplates = this.getTemplates();
    
    if (!existingPipeline) {
      // Return most popular templates
      return allTemplates
        .sort((a, b) => b.usage.count - a.usage.count)
        .slice(0, 5);
    }

    // Return templates similar to existing pipeline
    const existingTools = new Set(existingPipeline.nodes.map(n => n.reality.source));
    
    return allTemplates
      .filter(t => {
        const templateTools = new Set(t.requirements.tools);
        const overlap = [...existingTools].filter(tool => templateTools.has(tool));
        return overlap.length > 0;
      })
      .sort((a, b) => b.usage.successRate - a.usage.successRate)
      .slice(0, 3);
  }
}