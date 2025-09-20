import { PipelineDefinition, PipelineNode, PipelineEdge, MCPPipelineStatus, technologyStyles } from '@/lib/types/pipeline';
import { Node, Edge } from 'reactflow';

// Mock pipeline definitions - in production, these would come from APIs
const mockPipelineDefinitions: Record<string, PipelineDefinition> = {
  // Operations page pipelines
  'customer_360_enrichment': {
    id: 'customer_360_enrichment',
    name: 'customer_360_enrichment',
    version: '3.2.1',
    status: 'failed',
    nodes: [
      {
        id: 'postgres_source',
        type: 'source',
        position: { x: 100, y: 200 },
        data: {
          label: 'Customer Database',
          technology: {
            type: 'postgres',
            version: '13.0',
            icon: '🐘',
            color: '#336791'
          },
          config: {
            connection: 'postgres://prod-db:5432/customers',
            query: 'SELECT * FROM customers WHERE updated_at > $1',
            batchSize: 10000
          },
          status: 'success',
          metrics: {
            recordsProcessed: 145231,
            duration: 12200,
            throughput: 11.9
          }
        }
      },
      {
        id: 'spark_enrichment',
        type: 'transform',
        position: { x: 350, y: 200 },
        data: {
          label: '360 Enrichment',
          technology: {
            type: 'spark',
            version: '3.4.0',
            icon: '⚡',
            color: '#E25A1C'
          },
          config: {
            executors: 8,
            memoryPerExecutor: '16g',
            enrichmentSources: ['demographics', 'behavioral', 'transactional']
          },
          status: 'failed',
          metrics: {
            recordsProcessed: 145231,
            duration: 0,
            errorRate: 1.0
          }
        }
      },
      {
        id: 'snowflake_sink',
        type: 'sink',
        position: { x: 600, y: 200 },
        data: {
          label: 'Data Warehouse',
          technology: {
            type: 'snowflake',
            version: '7.0',
            icon: '❄️',
            color: '#29B5E8'
          },
          config: {
            warehouse: 'COMPUTE_XL',
            database: 'ANALYTICS',
            schema: 'CUSTOMER_360',
            table: 'enriched_customers'
          },
          status: 'pending',
          metrics: {
            recordsProcessed: 0,
            duration: 0
          }
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'postgres_source',
        target: 'spark_enrichment',
        data: {
          dataFlow: {
            records: 145231,
            bytes: 892000000,
            latency: 200
          }
        }
      },
      {
        id: 'e2',
        source: 'spark_enrichment',
        target: 'snowflake_sink',
        data: {
          dataFlow: {
            records: 0,
            bytes: 0,
            latency: 0
          }
        }
      }
    ],
    metadata: {
      created: '2024-01-15T10:00:00Z',
      modified: '2024-03-20T14:30:00Z',
      owner: 'data-eng',
      description: 'Customer 360 data enrichment and aggregation',
      tags: ['production', 'daily', 'customer-data'],
      runtime: {
        schedule: '0 6 * * *',
        trigger: 'scheduled',
        resources: {
          cpu: 32,
          memoryGB: 128,
          storageGB: 500
        }
      }
    }
  },
  'payment_processing_v3': {
    id: 'payment_processing_v3',
    name: 'payment_processing_v3',
    version: '1.8.2',
    status: 'active',
    nodes: [
      {
        id: 'kafka_source',
        type: 'source',
        position: { x: 100, y: 200 },
        data: {
          label: 'Payment Events',
          technology: {
            type: 'kafka',
            version: '3.5',
            icon: '📨',
            color: '#231F20'
          },
          config: {
            topic: 'payment.events',
            consumerGroup: 'payment-processor-v3',
            offset: 'latest'
          },
          status: 'running',
          metrics: {
            recordsProcessed: 8923000,
            duration: 86400000,
            throughput: 103.3
          }
        }
      },
      {
        id: 'spark_streaming',
        type: 'transform',
        position: { x: 350, y: 200 },
        data: {
          label: 'Fraud Detection',
          technology: {
            type: 'spark',
            version: '3.4.0',
            icon: '⚡',
            color: '#E25A1C'
          },
          config: {
            streaming: true,
            windowDuration: '10 seconds',
            checkpointLocation: 's3://checkpoints/payment-v3'
          },
          status: 'running',
          metrics: {
            recordsProcessed: 8923000,
            duration: 86400000,
            throughput: 103.3
          }
        }
      },
      {
        id: 'postgres_sink',
        type: 'sink',
        position: { x: 600, y: 200 },
        data: {
          label: 'Transaction Store',
          technology: {
            type: 'postgres',
            version: '14.0',
            icon: '🐘',
            color: '#336791'
          },
          config: {
            table: 'processed_payments',
            writeMode: 'append',
            batchSize: 1000
          },
          status: 'running',
          metrics: {
            recordsProcessed: 8923000,
            duration: 86400000,
            throughput: 103.3
          }
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'kafka_source',
        target: 'spark_streaming',
        data: {
          dataFlow: {
            records: 8923000,
            bytes: 45000000000,
            latency: 50
          }
        }
      },
      {
        id: 'e2',
        source: 'spark_streaming',
        target: 'postgres_sink',
        data: {
          dataFlow: {
            records: 8923000,
            bytes: 45000000000,
            latency: 100
          }
        }
      }
    ],
    metadata: {
      created: '2023-11-01T08:00:00Z',
      modified: '2024-03-20T16:45:00Z',
      owner: 'payments-team',
      description: 'Real-time payment processing and fraud detection',
      tags: ['production', 'streaming', 'payments'],
      runtime: {
        trigger: 'event',
        resources: {
          cpu: 16,
          memoryGB: 64,
          storageGB: 200
        }
      }
    }
  },
  // Original pipeline definition
  'customer-etl-prod': {
    id: 'customer-etl-prod',
    name: 'customer_etl_prod',
    version: '2.1.4',
    status: 'failed',
    nodes: [
      {
        id: 'postgres_source',
        type: 'source',
        position: { x: 100, y: 200 },
        data: {
          label: 'Customer Database',
          technology: {
            type: 'postgres',
            version: '13.0',
            icon: '🐘',
            color: '#336791'
          },
          config: {
            connection: 'postgres://prod-db:5432/customers',
            query: 'SELECT * FROM customers WHERE updated_at > $1',
            batchSize: 10000
          },
          status: 'success',
          metrics: {
            recordsProcessed: 45231,
            duration: 3200,
            throughput: 14.13
          }
        }
      },
      {
        id: 'spark_validation',
        type: 'transform',
        position: { x: 350, y: 150 },
        data: {
          label: 'Data Validation',
          technology: {
            type: 'spark',
            version: '3.4.0',
            icon: '⚡',
            color: '#E25A1C'
          },
          config: {
            validationRules: [
              'email_format',
              'phone_format',
              'not_null_constraints'
            ],
            errorThreshold: 0.05
          },
          status: 'failed',
          metrics: {
            recordsProcessed: 45231,
            duration: 8900,
            errorRate: 0.12
          }
        }
      },
      {
        id: 'spark_transform',
        type: 'transform',
        position: { x: 350, y: 270 },
        data: {
          label: 'Business Logic',
          technology: {
            type: 'spark',
            version: '3.4.0',
            icon: '⚡',
            color: '#E25A1C'
          },
          config: {
            transformations: [
              'calculate_customer_ltv',
              'segment_customers',
              'enrich_geo_data'
            ]
          },
          status: 'pending',
          metrics: {
            recordsProcessed: 0,
            duration: 0
          }
        }
      },
      {
        id: 'snowflake_sink',
        type: 'sink',
        position: { x: 600, y: 200 },
        data: {
          label: 'Data Warehouse',
          technology: {
            type: 'snowflake',
            version: '7.0',
            icon: '❄️',
            color: '#29B5E8'
          },
          config: {
            database: 'ANALYTICS',
            schema: 'CUSTOMER_GOLD',
            table: 'customers',
            writeMode: 'UPSERT'
          },
          status: 'pending',
          metrics: {
            recordsProcessed: 0,
            duration: 0
          }
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'postgres_source',
        target: 'spark_validation',
        data: {
          dataFlow: {
            records: 45231,
            bytes: 12500000,
            latency: 850
          }
        }
      },
      {
        id: 'e2',
        source: 'postgres_source',
        target: 'spark_transform',
        data: {
          dataFlow: {
            records: 45231,
            bytes: 12500000,
            latency: 850
          }
        }
      },
      {
        id: 'e3',
        source: 'spark_validation',
        target: 'snowflake_sink',
        data: {
          dataFlow: {
            records: 39803,
            bytes: 11000000,
            latency: 1200
          }
        }
      },
      {
        id: 'e4',
        source: 'spark_transform',
        target: 'snowflake_sink',
        data: {
          dataFlow: {
            records: 45231,
            bytes: 18200000,
            latency: 1100
          }
        }
      }
    ],
    metadata: {
      created: '2024-01-15T10:30:00Z',
      modified: '2024-01-20T14:22:00Z',
      owner: 'data-eng-team',
      description: 'Daily customer data ETL with validation and enrichment',
      tags: ['production', 'daily', 'customer-data'],
      runtime: {
        schedule: '0 2 * * *',
        trigger: 'scheduled',
        resources: {
          cpu: '4 cores',
          memory: '16GB',
          executors: 8
        }
      }
    }
  },
  
  'payment-stream-prod': {
    id: 'payment-stream-prod',
    name: 'payment_stream_prod',
    version: '1.8.2',
    status: 'active',
    nodes: [
      {
        id: 'kafka_source',
        type: 'source',
        position: { x: 80, y: 200 },
        data: {
          label: 'Payment Events',
          technology: {
            type: 'kafka',
            version: '3.5.0',
            icon: '📨',
            color: '#231F20'
          },
          config: {
            topic: 'payment.events.v2',
            consumerGroup: 'payment-processor-v1',
            autoOffset: 'latest'
          },
          status: 'running',
          metrics: {
            recordsProcessed: 1245,
            duration: 1000,
            throughput: 1.25
          }
        }
      },
      {
        id: 'spark_stream_parser',
        type: 'transform',
        position: { x: 280, y: 200 },
        data: {
          label: 'Event Parser',
          technology: {
            type: 'spark',
            version: '3.4.0',
            icon: '⚡',
            color: '#E25A1C'
          },
          config: {
            schema: 'payment_event_v2',
            validateSchema: true,
            watermark: '10 seconds'
          },
          status: 'running',
          metrics: {
            recordsProcessed: 1245,
            duration: 200,
            throughput: 6.22
          }
        }
      },
      {
        id: 'fraud_detection',
        type: 'transform',
        position: { x: 480, y: 150 },
        data: {
          label: 'Fraud Detection',
          technology: {
            type: 'python',
            version: '3.11',
            icon: '🐍',
            color: '#3776AB'
          },
          config: {
            model: 'fraud_detector_v2.1',
            threshold: 0.85,
            features: ['amount', 'location', 'time', 'merchant']
          },
          status: 'running',
          metrics: {
            recordsProcessed: 1245,
            duration: 450,
            throughput: 2.77
          }
        }
      },
      {
        id: 'trino_enrichment',
        type: 'transform',
        position: { x: 480, y: 250 },
        data: {
          label: 'Customer Enrichment',
          technology: {
            type: 'trino',
            version: '420',
            icon: '🔍',
            color: '#DD00A1'
          },
          config: {
            catalog: 'customer_data',
            schema: 'enriched',
            lookupTable: 'customer_profiles'
          },
          status: 'running',
          metrics: {
            recordsProcessed: 1245,
            duration: 320,
            throughput: 3.89
          }
        }
      },
      {
        id: 'kafka_alerts',
        type: 'sink',
        position: { x: 680, y: 120 },
        data: {
          label: 'Alert Topic',
          technology: {
            type: 'kafka',
            version: '3.5.0',
            icon: '📨',
            color: '#231F20'
          },
          config: {
            topic: 'fraud.alerts',
            partitions: 3,
            replicationFactor: 2
          },
          status: 'running',
          metrics: {
            recordsProcessed: 23,
            duration: 50,
            throughput: 0.46
          }
        }
      },
      {
        id: 's3_sink',
        type: 'sink',
        position: { x: 680, y: 280 },
        data: {
          label: 'Payment Archive',
          technology: {
            type: 's3',
            version: '2.0',
            icon: '📦',
            color: '#FF9900'
          },
          config: {
            bucket: 'payment-data-lake',
            prefix: 'processed/year={year}/month={month}/day={day}',
            format: 'parquet'
          },
          status: 'running',
          metrics: {
            recordsProcessed: 1245,
            duration: 1200,
            throughput: 1.04
          }
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'kafka_source',
        target: 'spark_stream_parser',
        data: {
          dataFlow: {
            records: 1245,
            bytes: 580000,
            latency: 120
          }
        }
      },
      {
        id: 'e2',
        source: 'spark_stream_parser',
        target: 'fraud_detection',
        data: {
          dataFlow: {
            records: 1240,
            bytes: 560000,
            latency: 95
          }
        }
      },
      {
        id: 'e3',
        source: 'spark_stream_parser',
        target: 'trino_enrichment',
        data: {
          dataFlow: {
            records: 1240,
            bytes: 560000,
            latency: 105
          }
        }
      },
      {
        id: 'e4',
        source: 'fraud_detection',
        target: 'kafka_alerts',
        data: {
          condition: 'fraud_score > 0.85',
          dataFlow: {
            records: 23,
            bytes: 12000,
            latency: 200
          }
        }
      },
      {
        id: 'e5',
        source: 'trino_enrichment',
        target: 's3_sink',
        data: {
          dataFlow: {
            records: 1240,
            bytes: 890000,
            latency: 180
          }
        }
      }
    ],
    metadata: {
      created: '2023-11-20T08:15:00Z',
      modified: '2024-01-18T16:45:00Z',
      owner: 'payments-team',
      description: 'Real-time payment processing with fraud detection and enrichment',
      tags: ['production', 'streaming', 'payments', 'fraud-detection'],
      runtime: {
        trigger: 'event',
        resources: {
          cpu: '12 cores',
          memory: '32GB',
          executors: 4
        }
      }
    }
  }
};

// Pipeline Loading Service
export class PipelineLoadingService {
  private static instance: PipelineLoadingService;
  private mcpConnections: Map<string, any> = new Map();
  
  static getInstance(): PipelineLoadingService {
    if (!PipelineLoadingService.instance) {
      PipelineLoadingService.instance = new PipelineLoadingService();
    }
    return PipelineLoadingService.instance;
  }

  // Fetch pipeline definition
  async fetchPipelineDefinition(pipelineId: string): Promise<PipelineDefinition> {
    // Simulate API call
    await this.delay(800);
    
    const pipeline = mockPipelineDefinitions[pipelineId];
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }
    
    return pipeline;
  }

  // Transform pipeline nodes to React Flow format
  transformToReactFlow(pipeline: PipelineDefinition): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = pipeline.nodes.map(node => ({
      id: node.id,
      type: this.getNodeComponent(node.type, node.data.technology.type),
      position: node.position,
      data: {
        ...node.data,
        // Apply technology-specific styling
        style: this.getNodeStyle(node.data.technology.type, node.data.status),
        // Add MCP status (would be real-time in production)
        liveStatus: node.data.status,
        // Add configuration state
        isConfigured: Object.keys(node.data.config).length > 0
      }
    }));

    const edges: Edge[] = pipeline.edges.map(edge => ({
      ...edge,
      type: 'smoothstep',
      animated: edge.data?.dataFlow ? edge.data.dataFlow.records > 0 : false,
      style: this.getEdgeStyle(edge.data?.dataFlow),
      label: edge.data?.dataFlow ? this.formatEdgeLabel(edge.data.dataFlow) : undefined
    }));

    return { nodes, edges };
  }

  // Get appropriate node component based on type and technology
  private getNodeComponent(nodeType: string, techType: string): string {
    return `${nodeType}-${techType}`;
  }

  // Get technology-specific node styling
  private getNodeStyle(techType: string, status?: string) {
    const tech = technologyStyles[techType] || technologyStyles.api;
    let borderColor = tech.backgroundColor;
    
    // Status-based border colors
    switch (status) {
      case 'running':
        borderColor = '#10B981';
        break;
      case 'failed':
        borderColor = '#EF4444';
        break;
      case 'pending':
        borderColor = '#F59E0B';
        break;
      case 'success':
        borderColor = '#10B981';
        break;
    }

    return {
      backgroundColor: tech.backgroundColor,
      borderColor,
      borderStyle: tech.borderStyle,
      borderWidth: 2,
      padding: '10px',
      borderRadius: '8px',
      color: 'white',
      minWidth: '160px',
      fontSize: '12px'
    };
  }

  // Get edge styling based on data flow
  private getEdgeStyle(dataFlow?: { records?: number; latency?: number }) {
    if (!dataFlow) return { strokeWidth: 2, stroke: '#888' };
    
    const thickness = Math.min(8, Math.max(2, Math.log(dataFlow.records || 1) * 0.8));
    const color = this.getLatencyColor(dataFlow.latency);
    
    return {
      strokeWidth: thickness,
      stroke: color
    };
  }

  // Get color based on latency
  private getLatencyColor(latency?: number): string {
    if (!latency) return '#888';
    if (latency < 100) return '#10B981'; // Green - fast
    if (latency < 1000) return '#F59E0B'; // Yellow - moderate
    return '#EF4444'; // Red - slow
  }

  // Format edge label with data flow info
  private formatEdgeLabel(dataFlow: { records?: number; bytes?: number; latency?: number }): string {
    const parts = [];
    if (dataFlow.records) {
      parts.push(`${this.formatNumber(dataFlow.records)} records`);
    }
    if (dataFlow.latency) {
      parts.push(`${dataFlow.latency}ms`);
    }
    return parts.join(' • ');
  }

  // Format numbers with appropriate units
  private formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  // Simulate MCP status updates
  async getMCPStatus(nodeId: string): Promise<MCPPipelineStatus> {
    // Simulate MCP API call
    await this.delay(200);
    
    return {
      nodeId,
      status: 'running',
      metrics: {
        recordsProcessed: Math.floor(Math.random() * 10000),
        duration: Math.floor(Math.random() * 5000),
        throughput: Math.random() * 100
      }
    };
  }

  // Start MCP monitoring (placeholder)
  startMCPMonitoring(pipelineId: string, onUpdate: (status: MCPPipelineStatus) => void) {
    console.log(`Starting MCP monitoring for pipeline: ${pipelineId}`);
    
    // Simulate periodic updates
    const interval = setInterval(() => {
      const pipeline = mockPipelineDefinitions[pipelineId];
      if (pipeline) {
        pipeline.nodes.forEach(async (node) => {
          const status = await this.getMCPStatus(node.id);
          onUpdate(status);
        });
      }
    }, 5000);
    
    // Store interval for cleanup
    this.mcpConnections.set(pipelineId, interval);
  }

  // Stop MCP monitoring
  stopMCPMonitoring(pipelineId: string) {
    const interval = this.mcpConnections.get(pipelineId);
    if (interval) {
      clearInterval(interval);
      this.mcpConnections.delete(pipelineId);
    }
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default PipelineLoadingService;