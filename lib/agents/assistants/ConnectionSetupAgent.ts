import { BaseAgent } from '../BaseAgent';
import { AgentCapability, AgentTask } from '../types';

interface ConnectionConfig {
  type: 'kafka' | 'database' | 's3' | 'api';
  basicInfo: {
    [key: string]: any;
  };
}

interface NiFiFlow {
  processors: any[];
  connections: any[];
  controllerServices: any[];
  processGroups: any[];
  parameterContexts: any;
}

/**
 * ConnectionSetupAgent - Handles the tedious connection configuration work
 * Takes minimal connection info and generates complete, production-ready configs
 */
export class ConnectionSetupAgent extends BaseAgent {
  constructor() {
    super(
      'connection_setup',
      'Connection Setup Assistant',
      'Handles the boring connection configurations, SSL setup, retry logic, and monitoring hooks'
    );
  }

  protected defineCapabilities(): AgentCapability[] {
    return [
      {
        name: 'setup_kafka_connection',
        description: 'Configure complete Kafka connection with SSL, consumer groups, and error handling',
        requiredContext: ['broker', 'topic']
      },
      {
        name: 'setup_database_connection',
        description: 'Configure database connections with pooling, SSL, and retry logic',
        requiredContext: ['host', 'database']
      },
      {
        name: 'setup_s3_connection',
        description: 'Configure S3 connections with IAM roles, encryption, and lifecycle policies',
        requiredContext: ['bucket', 'region']
      },
      {
        name: 'diagnose_connection_issues',
        description: 'Troubleshoot connection failures and suggest fixes',
        requiredContext: ['error', 'config']
      }
    ];
  }

  protected async executeTask(task: AgentTask): Promise<any> {
    const config = task.input as ConnectionConfig;
    
    switch (config.type) {
      case 'kafka':
        return this.setupKafkaConnection(config.basicInfo);
      case 'database':
        return this.setupDatabaseConnection(config.basicInfo);
      case 's3':
        return this.setupS3Connection(config.basicInfo);
      case 'api':
        return this.setupAPIConnection(config.basicInfo);
      default:
        throw new Error(`Unsupported connection type: ${config.type}`);
    }
  }

  /**
   * Sets up a complete Kafka connection with all the boring stuff engineers hate configuring
   */
  private async setupKafkaConnection(basicInfo: {
    broker: string;
    topic: string;
    consumerGroup?: string;
  }): Promise<NiFiFlow> {
    const { broker, topic, consumerGroup = `consumer-${Date.now()}` } = basicInfo;
    
    // Generate complete NiFi flow with all the tedious configurations
    const flow: NiFiFlow = {
      processors: [
        {
          id: `kafka-consumer-${Date.now()}`,
          type: 'ConsumeKafka_2_6',
          name: `Consume from ${topic}`,
          config: {
            'bootstrap.servers': broker,
            'topic': topic,
            'topic.type': 'names',
            'group.id': consumerGroup,
            'auto.offset.reset': 'latest',
            
            // SSL Configuration (the boring stuff)
            'security.protocol': 'SSL',
            'ssl.truststore.location': '/opt/nifi/certs/truststore.jks',
            'ssl.truststore.password': '${TRUSTSTORE_PASSWORD}',
            'ssl.keystore.location': '/opt/nifi/certs/keystore.jks',
            'ssl.keystore.password': '${KEYSTORE_PASSWORD}',
            'ssl.key.password': '${KEY_PASSWORD}',
            
            // Consumer optimizations
            'max.poll.records': '1000',
            'fetch.min.bytes': '1024',
            'fetch.max.wait.ms': '500',
            'session.timeout.ms': '30000',
            'heartbeat.interval.ms': '3000',
            
            // Error handling
            'max.poll.interval.ms': '300000',
            'connections.max.idle.ms': '540000',
            'request.timeout.ms': '30000',
            'retry.backoff.ms': '100',
            
            // Monitoring
            'metrics.recording.level': 'INFO',
            'metrics.num.samples': '2',
            'metrics.sample.window.ms': '30000'
          },
          autoTerminatedRelationships: [],
          properties: {
            'Yield Duration': '1 sec',
            'Max Uncommitted Time': '1 secs'
          }
        },
        {
          id: `error-handler-${Date.now()}`,
          type: 'PutFile',
          name: 'Error Handler',
          config: {
            'Directory': '/var/log/nifi/kafka-errors',
            'Conflict Resolution Strategy': 'replace'
          }
        }
      ],
      
      connections: [
        {
          source: `kafka-consumer-${Date.now()}`,
          sourceRelationship: 'parse.failure',
          destination: `error-handler-${Date.now()}`
        }
      ],
      
      controllerServices: [
        {
          type: 'SSLContextService',
          name: 'Kafka SSL Context',
          properties: {
            'Truststore Filename': '/opt/nifi/certs/truststore.jks',
            'Truststore Password': '${TRUSTSTORE_PASSWORD}',
            'Truststore Type': 'JKS',
            'Keystore Filename': '/opt/nifi/certs/keystore.jks',
            'Keystore Password': '${KEYSTORE_PASSWORD}',
            'Keystore Type': 'JKS'
          }
        }
      ],
      
      processGroups: [],
      
      parameterContexts: {
        name: 'Kafka Connection Context',
        parameters: [
          { name: 'KAFKA_BROKER', value: broker },
          { name: 'KAFKA_TOPIC', value: topic },
          { name: 'CONSUMER_GROUP', value: consumerGroup },
          { name: 'TRUSTSTORE_PASSWORD', sensitive: true },
          { name: 'KEYSTORE_PASSWORD', sensitive: true },
          { name: 'KEY_PASSWORD', sensitive: true }
        ]
      }
    };
    
    // Add insights about what we configured
    this.insights.push({
      id: `insight-kafka-${Date.now()}`,
      agent: this.role,
      type: 'info',
      title: 'Kafka Connection Configured',
      description: `Set up secure Kafka consumer with SSL, consumer group "${consumerGroup}", optimized batching (1000 records), and automatic error handling. Includes monitoring hooks and backpressure settings.`,
      confidence: 0.95
    });
    
    return flow;
  }

  /**
   * Sets up a complete database connection with pooling, SSL, and retry logic
   */
  private async setupDatabaseConnection(basicInfo: {
    host: string;
    port?: number;
    database: string;
    username?: string;
    type?: 'postgres' | 'mysql' | 'oracle';
  }): Promise<any> {
    const { 
      host, 
      port = 5432, 
      database, 
      username = 'app_user',
      type = 'postgres' 
    } = basicInfo;
    
    const connectionConfig = {
      connectionString: `jdbc:${type}://${host}:${port}/${database}`,
      
      // Connection pooling (optimized for production)
      poolConfig: {
        minConnections: 5,
        maxConnections: 20,
        connectionTimeout: 30000,
        idleTimeout: 600000,
        maxLifetime: 1800000,
        validationTimeout: 5000,
        leakDetectionThreshold: 60000
      },
      
      // SSL configuration
      sslConfig: {
        sslMode: 'require',
        sslCert: '/opt/certs/client-cert.pem',
        sslKey: '/opt/certs/client-key.pem',
        sslRootCert: '/opt/certs/ca-cert.pem',
        sslCompression: false
      },
      
      // Retry logic
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        maxRetryDelay: 10000
      },
      
      // Query optimizations
      queryConfig: {
        statementTimeout: 30000,
        queryTimeout: 30000,
        fetchSize: 1000,
        preparedStatementCacheSize: 256,
        preparedStatementCacheSqlLimit: 2048
      },
      
      // Monitoring
      monitoringConfig: {
        logSlowQueries: true,
        slowQueryThreshold: 5000,
        collectMetrics: true,
        metricsInterval: 30000
      }
    };
    
    this.insights.push({
      id: `insight-db-${Date.now()}`,
      agent: this.role,
      type: 'info',
      title: 'Database Connection Configured',
      description: `Set up ${type} connection with connection pooling (5-20 connections), SSL encryption, automatic retry logic (3 retries with exponential backoff), and query monitoring for slow queries > 5s.`,
      confidence: 0.95
    });
    
    return connectionConfig;
  }

  /**
   * Sets up S3 connection with IAM roles, encryption, and lifecycle policies
   */
  private async setupS3Connection(basicInfo: {
    bucket: string;
    region?: string;
    prefix?: string;
  }): Promise<any> {
    const { bucket, region = 'us-east-1', prefix = '' } = basicInfo;
    
    const s3Config = {
      bucket,
      region,
      prefix,
      
      // IAM configuration
      authentication: {
        type: 'IAM_ROLE',
        roleArn: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/nifi-s3-access-role`,
        externalId: `nifi-${bucket}-${Date.now()}`,
        sessionDuration: 3600
      },
      
      // Encryption settings
      encryption: {
        type: 'SSE-S3',
        kmsKeyId: process.env.KMS_KEY_ID,
        bucketKeyEnabled: true
      },
      
      // Transfer optimizations
      transferConfig: {
        multipartThreshold: 104857600, // 100MB
        multipartChunkSize: 10485760,  // 10MB
        maxConcurrentRequests: 10,
        transferAcceleration: true
      },
      
      // Retry configuration
      retryConfig: {
        maxErrorRetry: 3,
        retryDelayOptions: {
          base: 300,
          customBackoff: (retryCount: number) => Math.pow(2, retryCount) * 300
        }
      },
      
      // Lifecycle policies
      lifecyclePolicies: [
        {
          id: 'archive-old-data',
          status: 'Enabled',
          transitions: [
            {
              days: 30,
              storageClass: 'STANDARD_IA'
            },
            {
              days: 90,
              storageClass: 'GLACIER'
            }
          ]
        }
      ]
    };
    
    this.insights.push({
      id: `insight-s3-${Date.now()}`,
      agent: this.role,
      type: 'info',
      title: 'S3 Connection Configured',
      description: `Set up S3 connection with IAM role authentication, SSE-S3 encryption, multipart upload optimization (100MB threshold), and lifecycle policies (IA after 30 days, Glacier after 90 days).`,
      confidence: 0.95
    });
    
    return s3Config;
  }

  /**
   * Sets up API connection with auth, rate limiting, and retry logic
   */
  private async setupAPIConnection(basicInfo: {
    url: string;
    authType?: 'bearer' | 'basic' | 'oauth2';
  }): Promise<any> {
    const { url, authType = 'bearer' } = basicInfo;
    
    const apiConfig = {
      baseURL: url,
      
      // Authentication
      auth: this.getAuthConfig(authType),
      
      // Rate limiting
      rateLimiting: {
        maxRequestsPerSecond: 10,
        maxBurst: 20,
        retryAfter: true
      },
      
      // Timeout configuration
      timeouts: {
        connectTimeout: 5000,
        readTimeout: 30000,
        writeTimeout: 30000
      },
      
      // Retry strategy
      retry: {
        maxRetries: 3,
        retryStatusCodes: [429, 500, 502, 503, 504],
        retryDelayMs: 1000,
        backoffMultiplier: 2
      },
      
      // Circuit breaker
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        resetTimeout: 60000,
        halfOpenRequests: 3
      },
      
      // Request/Response handling
      requestConfig: {
        headers: {
          'User-Agent': 'NiFi-API-Client/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        compression: true,
        followRedirects: true,
        maxRedirects: 3
      }
    };
    
    this.insights.push({
      id: `insight-api-${Date.now()}`,
      agent: this.role,
      type: 'info',
      title: 'API Connection Configured',
      description: `Set up API connection with ${authType} authentication, rate limiting (10 req/s), circuit breaker pattern, and retry logic for transient failures.`,
      confidence: 0.95
    });
    
    return apiConfig;
  }

  private getAuthConfig(authType: string): any {
    switch (authType) {
      case 'bearer':
        return {
          type: 'bearer',
          token: '${API_TOKEN}',
          tokenRefresh: {
            enabled: true,
            refreshBeforeExpiry: 300000
          }
        };
      case 'basic':
        return {
          type: 'basic',
          username: '${API_USERNAME}',
          password: '${API_PASSWORD}'
        };
      case 'oauth2':
        return {
          type: 'oauth2',
          clientId: '${OAUTH_CLIENT_ID}',
          clientSecret: '${OAUTH_CLIENT_SECRET}',
          tokenUrl: '${OAUTH_TOKEN_URL}',
          scope: 'read write'
        };
      default:
        return null;
    }
  }
}