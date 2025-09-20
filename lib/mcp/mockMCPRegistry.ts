export interface MCPCapability {
  action: string;
  resource: string;
}

export interface NodeTypeDefinition {
  type: string;
  label: string;
  icon: string;
  description: string;
  configSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  inputs?: Array<{ name: string; type: string }>;
  outputs?: Array<{ name: string; type: string }>;
}

export interface MockMCPServer {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'processing' | 'storage' | 'streaming' | 'transformation' | 'ml' | 'orchestration';
  capabilities: MCPCapability[];
  nodeTypes: NodeTypeDefinition[];
  status: 'connected' | 'disconnected' | 'error';
}

export const MOCK_MCP_SERVERS: MockMCPServer[] = [
  {
    id: 'nifi-mcp',
    name: 'Apache NiFi',
    description: 'Data flow automation and management',
    icon: '🔄',
    category: 'processing',
    status: 'connected',
    capabilities: [
      { action: 'create', resource: 'processor' },
      { action: 'configure', resource: 'processor' },
      { action: 'execute', resource: 'processor' },
      { action: 'monitor', resource: 'processor' }
    ],
    nodeTypes: [
      {
        type: 'nifi-getfile',
        label: 'Get File',
        icon: '📁',
        description: 'Reads files from a directory',
        configSchema: {
          type: 'object',
          properties: {
            directory: { type: 'string', title: 'Input Directory' },
            fileFilter: { type: 'string', title: 'File Filter', default: '*.*' },
            recursive: { type: 'boolean', title: 'Recursive', default: false },
            keepSourceFile: { type: 'boolean', title: 'Keep Source File', default: true }
          },
          required: ['directory']
        },
        outputs: [{ name: 'success', type: 'flowfile' }]
      },
      {
        type: 'nifi-putfile',
        label: 'Put File',
        icon: '💾',
        description: 'Writes files to a directory',
        configSchema: {
          type: 'object',
          properties: {
            directory: { type: 'string', title: 'Output Directory' },
            conflictResolution: { 
              type: 'string', 
              enum: ['replace', 'ignore', 'fail'],
              title: 'Conflict Resolution',
              default: 'replace'
            },
            createMissingDirectories: { type: 'boolean', title: 'Create Missing Dirs', default: true }
          },
          required: ['directory']
        },
        inputs: [{ name: 'input', type: 'flowfile' }]
      },
      {
        type: 'nifi-executesql',
        label: 'Execute SQL',
        icon: '🗄️',
        description: 'Executes SQL queries',
        configSchema: {
          type: 'object',
          properties: {
            connection: { type: 'string', title: 'Database Connection' },
            query: { type: 'string', title: 'SQL Query', format: 'sql' },
            fetchSize: { type: 'number', title: 'Fetch Size', default: 1000 },
            queryTimeout: { type: 'number', title: 'Query Timeout (seconds)', default: 30 }
          },
          required: ['connection', 'query']
        },
        outputs: [{ name: 'success', type: 'flowfile' }]
      },
      {
        type: 'nifi-invokehttp',
        label: 'Invoke HTTP',
        icon: '🌐',
        description: 'Makes HTTP requests',
        configSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', title: 'URL' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], title: 'Method', default: 'GET' },
            headers: { type: 'object', title: 'Headers' },
            timeout: { type: 'number', title: 'Connection Timeout (seconds)', default: 30 }
          },
          required: ['url', 'method']
        },
        inputs: [{ name: 'input', type: 'flowfile' }],
        outputs: [{ name: 'response', type: 'flowfile' }, { name: 'failure', type: 'flowfile' }]
      }
    ]
  },
  {
    id: 'spark-mcp',
    name: 'Apache Spark',
    description: 'Distributed data processing',
    icon: '⚡',
    category: 'processing',
    status: 'connected',
    capabilities: [
      { action: 'submit', resource: 'job' },
      { action: 'monitor', resource: 'job' },
      { action: 'cancel', resource: 'job' }
    ],
    nodeTypes: [
      {
        type: 'spark-batch',
        label: 'Spark Batch Job',
        icon: '📊',
        description: 'Runs a batch processing job',
        configSchema: {
          type: 'object',
          properties: {
            mainClass: { type: 'string', title: 'Main Class' },
            jarPath: { type: 'string', title: 'JAR Path' },
            executors: { type: 'number', title: 'Number of Executors', default: 2 },
            executorMemory: { type: 'string', title: 'Executor Memory', default: '2g' },
            executorCores: { type: 'number', title: 'Executor Cores', default: 2 },
            driverMemory: { type: 'string', title: 'Driver Memory', default: '1g' }
          },
          required: ['mainClass', 'jarPath']
        },
        inputs: [{ name: 'input', type: 'dataset' }],
        outputs: [{ name: 'output', type: 'dataset' }]
      },
      {
        type: 'spark-streaming',
        label: 'Spark Streaming',
        icon: '〰️',
        description: 'Structured streaming job',
        configSchema: {
          type: 'object',
          properties: {
            checkpointLocation: { type: 'string', title: 'Checkpoint Location' },
            triggerInterval: { type: 'string', title: 'Trigger Interval', default: '10 seconds' },
            watermark: { type: 'string', title: 'Watermark', default: '10 minutes' },
            outputMode: { type: 'string', enum: ['append', 'complete', 'update'], title: 'Output Mode', default: 'append' }
          },
          required: ['checkpointLocation']
        },
        inputs: [{ name: 'stream', type: 'stream' }],
        outputs: [{ name: 'output', type: 'stream' }]
      },
      {
        type: 'spark-sql',
        label: 'Spark SQL',
        icon: '🔍',
        description: 'Execute Spark SQL queries',
        configSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', title: 'SQL Query', format: 'sql' },
            database: { type: 'string', title: 'Database' },
            outputMode: { type: 'string', enum: ['append', 'overwrite', 'ignore'], title: 'Output Mode', default: 'append' }
          },
          required: ['query']
        },
        inputs: [{ name: 'input', type: 'dataset' }],
        outputs: [{ name: 'result', type: 'dataset' }]
      }
    ]
  },
  {
    id: 'kafka-mcp',
    name: 'Apache Kafka',
    description: 'Event streaming platform',
    icon: '📨',
    category: 'streaming',
    status: 'connected',
    nodeTypes: [
      {
        type: 'kafka-consumer',
        label: 'Kafka Consumer',
        icon: '📥',
        description: 'Consumes messages from Kafka topics',
        configSchema: {
          type: 'object',
          properties: {
            topics: { type: 'array', items: { type: 'string' }, title: 'Topics' },
            groupId: { type: 'string', title: 'Consumer Group ID' },
            autoOffsetReset: { type: 'string', enum: ['earliest', 'latest'], title: 'Auto Offset Reset', default: 'latest' },
            enableAutoCommit: { type: 'boolean', title: 'Enable Auto Commit', default: true }
          },
          required: ['topics', 'groupId']
        },
        outputs: [{ name: 'messages', type: 'stream' }]
      },
      {
        type: 'kafka-producer',
        label: 'Kafka Producer',
        icon: '📤',
        description: 'Produces messages to Kafka topics',
        configSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string', title: 'Topic' },
            key: { type: 'string', title: 'Message Key (optional)' },
            compressionType: { type: 'string', enum: ['none', 'gzip', 'snappy', 'lz4'], title: 'Compression', default: 'none' },
            acks: { type: 'string', enum: ['0', '1', 'all'], title: 'Acknowledgments', default: '1' }
          },
          required: ['topic']
        },
        inputs: [{ name: 'messages', type: 'stream' }]
      }
    ]
  },
  {
    id: 'flink-mcp',
    name: 'Apache Flink',
    description: 'Stream processing framework',
    icon: '🌊',
    category: 'streaming',
    status: 'connected',
    nodeTypes: [
      {
        type: 'flink-stream',
        label: 'Flink Stream Job',
        icon: '🏃',
        description: 'Flink streaming application',
        configSchema: {
          type: 'object',
          properties: {
            jarFile: { type: 'string', title: 'JAR File' },
            entryClass: { type: 'string', title: 'Entry Class' },
            parallelism: { type: 'number', title: 'Parallelism', default: 1 },
            checkpointInterval: { type: 'number', title: 'Checkpoint Interval (ms)', default: 60000 },
            restartStrategy: { type: 'string', enum: ['fixed-delay', 'failure-rate', 'no-restart'], title: 'Restart Strategy', default: 'fixed-delay' }
          },
          required: ['jarFile', 'entryClass']
        },
        inputs: [{ name: 'source', type: 'stream' }],
        outputs: [{ name: 'sink', type: 'stream' }]
      },
      {
        type: 'flink-sql',
        label: 'Flink SQL',
        icon: '📝',
        description: 'Execute Flink SQL',
        configSchema: {
          type: 'object',
          properties: {
            sqlScript: { type: 'string', title: 'SQL Script', format: 'sql' },
            tableEnvironment: { type: 'string', enum: ['streaming', 'batch'], title: 'Environment', default: 'streaming' }
          },
          required: ['sqlScript']
        },
        inputs: [{ name: 'table', type: 'table' }],
        outputs: [{ name: 'result', type: 'table' }]
      }
    ]
  },
  {
    id: 'dbt-mcp',
    name: 'dbt',
    description: 'SQL-based transformations',
    icon: '🔧',
    category: 'transformation',
    status: 'connected',
    nodeTypes: [
      {
        type: 'dbt-model',
        label: 'dbt Model',
        icon: '📐',
        description: 'dbt data model',
        configSchema: {
          type: 'object',
          properties: {
            modelName: { type: 'string', title: 'Model Name' },
            materialization: { 
              type: 'string', 
              enum: ['table', 'view', 'incremental', 'ephemeral'],
              title: 'Materialization',
              default: 'table'
            },
            tags: { type: 'array', items: { type: 'string' }, title: 'Tags' },
            freshness: { type: 'string', title: 'Freshness Check', default: '24 hours' }
          },
          required: ['modelName']
        },
        inputs: [{ name: 'source', type: 'table' }],
        outputs: [{ name: 'model', type: 'table' }]
      },
      {
        type: 'dbt-test',
        label: 'dbt Test',
        icon: '✅',
        description: 'Data quality test',
        configSchema: {
          type: 'object',
          properties: {
            testName: { type: 'string', title: 'Test Name' },
            severity: { type: 'string', enum: ['warn', 'error'], title: 'Severity', default: 'error' },
            testType: { type: 'string', enum: ['unique', 'not_null', 'relationships', 'accepted_values', 'custom'], title: 'Test Type' }
          },
          required: ['testName', 'testType']
        },
        inputs: [{ name: 'model', type: 'table' }],
        outputs: [{ name: 'results', type: 'test_results' }]
      },
      {
        type: 'dbt-snapshot',
        label: 'dbt Snapshot',
        icon: '📸',
        description: 'Capture data changes over time',
        configSchema: {
          type: 'object',
          properties: {
            snapshotName: { type: 'string', title: 'Snapshot Name' },
            strategy: { type: 'string', enum: ['timestamp', 'check'], title: 'Strategy', default: 'timestamp' },
            uniqueKey: { type: 'string', title: 'Unique Key' },
            updatedAt: { type: 'string', title: 'Updated At Column' }
          },
          required: ['snapshotName', 'strategy', 'uniqueKey']
        },
        inputs: [{ name: 'source', type: 'table' }],
        outputs: [{ name: 'snapshot', type: 'table' }]
      }
    ]
  },
  {
    id: 'snowflake-mcp',
    name: 'Snowflake',
    description: 'Cloud data warehouse',
    icon: '❄️',
    category: 'storage',
    status: 'connected',
    nodeTypes: [
      {
        type: 'snowflake-query',
        label: 'Snowflake Query',
        icon: '🔍',
        description: 'Execute Snowflake query',
        configSchema: {
          type: 'object',
          properties: {
            warehouse: { type: 'string', title: 'Warehouse' },
            database: { type: 'string', title: 'Database' },
            schema: { type: 'string', title: 'Schema' },
            query: { type: 'string', title: 'Query', format: 'sql' }
          },
          required: ['warehouse', 'database', 'query']
        },
        outputs: [{ name: 'results', type: 'dataset' }]
      },
      {
        type: 'snowflake-load',
        label: 'Snowflake Load',
        icon: '📥',
        description: 'Load data into Snowflake',
        configSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', title: 'Target Table' },
            fileFormat: { type: 'string', enum: ['CSV', 'JSON', 'PARQUET', 'AVRO'], title: 'File Format', default: 'CSV' },
            onError: { type: 'string', enum: ['CONTINUE', 'SKIP_FILE', 'ABORT'], title: 'On Error', default: 'CONTINUE' },
            purge: { type: 'boolean', title: 'Purge Files After Load', default: false }
          },
          required: ['table', 'fileFormat']
        },
        inputs: [{ name: 'data', type: 'file' }]
      }
    ]
  },
  {
    id: 'postgres-mcp',
    name: 'PostgreSQL',
    description: 'Relational database',
    icon: '🐘',
    category: 'storage',
    status: 'connected',
    nodeTypes: [
      {
        type: 'postgres-source',
        label: 'PostgreSQL Source',
        icon: '📤',
        description: 'Read from PostgreSQL',
        configSchema: {
          type: 'object',
          properties: {
            host: { type: 'string', title: 'Host' },
            port: { type: 'number', title: 'Port', default: 5432 },
            database: { type: 'string', title: 'Database' },
            table: { type: 'string', title: 'Table' },
            query: { type: 'string', title: 'Query (optional)', format: 'sql' }
          },
          required: ['host', 'database']
        },
        outputs: [{ name: 'data', type: 'dataset' }]
      },
      {
        type: 'postgres-sink',
        label: 'PostgreSQL Sink',
        icon: '📥',
        description: 'Write to PostgreSQL',
        configSchema: {
          type: 'object',
          properties: {
            host: { type: 'string', title: 'Host' },
            port: { type: 'number', title: 'Port', default: 5432 },
            database: { type: 'string', title: 'Database' },
            table: { type: 'string', title: 'Table' },
            mode: { type: 'string', enum: ['append', 'overwrite', 'upsert'], title: 'Write Mode', default: 'append' }
          },
          required: ['host', 'database', 'table']
        },
        inputs: [{ name: 'data', type: 'dataset' }]
      }
    ]
  },
  {
    id: 's3-mcp',
    name: 'Amazon S3',
    description: 'Object storage',
    icon: '🪣',
    category: 'storage',
    status: 'connected',
    nodeTypes: [
      {
        type: 's3-get',
        label: 'S3 Get Object',
        icon: '⬇️',
        description: 'Download from S3',
        configSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string', title: 'Bucket' },
            key: { type: 'string', title: 'Object Key' },
            region: { type: 'string', title: 'Region', default: 'us-east-1' },
            versionId: { type: 'string', title: 'Version ID (optional)' }
          },
          required: ['bucket', 'key']
        },
        outputs: [{ name: 'file', type: 'file' }]
      },
      {
        type: 's3-put',
        label: 'S3 Put Object',
        icon: '⬆️',
        description: 'Upload to S3',
        configSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string', title: 'Bucket' },
            key: { type: 'string', title: 'Object Key' },
            acl: { type: 'string', enum: ['private', 'public-read', 'public-read-write'], title: 'ACL', default: 'private' },
            storageClass: { type: 'string', enum: ['STANDARD', 'GLACIER', 'DEEP_ARCHIVE'], title: 'Storage Class', default: 'STANDARD' }
          },
          required: ['bucket', 'key']
        },
        inputs: [{ name: 'file', type: 'file' }]
      }
    ]
  },
  {
    id: 'airflow-mcp',
    name: 'Apache Airflow',
    description: 'Workflow orchestration',
    icon: '🌬️',
    category: 'orchestration',
    status: 'connected',
    nodeTypes: [
      {
        type: 'airflow-trigger',
        label: 'Trigger DAG',
        icon: '▶️',
        description: 'Trigger an Airflow DAG',
        configSchema: {
          type: 'object',
          properties: {
            dagId: { type: 'string', title: 'DAG ID' },
            conf: { type: 'object', title: 'Configuration (JSON)' },
            executionDate: { type: 'string', title: 'Execution Date (optional)' }
          },
          required: ['dagId']
        },
        outputs: [{ name: 'run_id', type: 'string' }]
      },
      {
        type: 'airflow-sensor',
        label: 'Airflow Sensor',
        icon: '👁️',
        description: 'Wait for condition',
        configSchema: {
          type: 'object',
          properties: {
            sensorType: { type: 'string', enum: ['file', 'database', 'time', 'external_task'], title: 'Sensor Type' },
            target: { type: 'string', title: 'Target to Monitor' },
            timeout: { type: 'number', title: 'Timeout (seconds)', default: 3600 },
            poke_interval: { type: 'number', title: 'Check Interval (seconds)', default: 60 }
          },
          required: ['sensorType', 'target']
        },
        outputs: [{ name: 'triggered', type: 'signal' }]
      }
    ]
  },
  {
    id: 'mlflow-mcp',
    name: 'MLflow',
    description: 'ML lifecycle management',
    icon: '🤖',
    category: 'ml',
    status: 'connected',
    nodeTypes: [
      {
        type: 'mlflow-train',
        label: 'Train Model',
        icon: '🎯',
        description: 'Train ML model',
        configSchema: {
          type: 'object',
          properties: {
            experimentName: { type: 'string', title: 'Experiment Name' },
            modelType: { type: 'string', enum: ['sklearn', 'tensorflow', 'pytorch', 'xgboost'], title: 'Model Type' },
            parameters: { type: 'object', title: 'Model Parameters (JSON)' },
            metrics: { type: 'array', items: { type: 'string' }, title: 'Metrics to Track' }
          },
          required: ['experimentName', 'modelType']
        },
        inputs: [{ name: 'training_data', type: 'dataset' }],
        outputs: [{ name: 'model', type: 'ml_model' }]
      },
      {
        type: 'mlflow-predict',
        label: 'Model Prediction',
        icon: '🔮',
        description: 'Run model inference',
        configSchema: {
          type: 'object',
          properties: {
            modelUri: { type: 'string', title: 'Model URI' },
            batchSize: { type: 'number', title: 'Batch Size', default: 100 },
            outputFormat: { type: 'string', enum: ['json', 'csv', 'parquet'], title: 'Output Format', default: 'json' }
          },
          required: ['modelUri']
        },
        inputs: [{ name: 'input_data', type: 'dataset' }],
        outputs: [{ name: 'predictions', type: 'dataset' }]
      }
    ]
  }
];