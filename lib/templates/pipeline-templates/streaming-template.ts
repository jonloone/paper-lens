import { PipelineTemplate } from './types';

export const streamingTemplate: PipelineTemplate = {
  id: 'realtime-streaming-etl',
  name: 'Real-time Streaming ETL',
  description: 'Process streaming data in real-time with transformations',
  category: 'streaming',
  tags: ['streaming', 'real-time', 'kafka', 'kinesis', 'event-driven'],
  icon: '⚡',
  
  popularity: 82,
  usageCount: 189,
  lastUsed: new Date('2025-01-09'),
  createdBy: 'Platform Team',
  sharedWith: ['all'],
  
  estimatedBuildTime: '15 minutes',
  estimatedRunTime: 'Continuous',
  
  parameters: [
    {
      id: 'source_stream',
      name: 'Source Stream',
      description: 'Streaming data source',
      type: 'select',
      required: true,
      options: [
        { label: 'Kafka - User Events', value: 'kafka_user_events' },
        { label: 'Kafka - Transactions', value: 'kafka_transactions' },
        { label: 'Kinesis - Clickstream', value: 'kinesis_clickstream' },
        { label: 'EventHub - IoT Data', value: 'eventhub_iot' }
      ]
    },
    {
      id: 'processing_mode',
      name: 'Processing Mode',
      description: 'How to process the stream',
      type: 'select',
      required: true,
      defaultValue: 'exactly_once',
      options: [
        { label: 'Exactly Once', value: 'exactly_once' },
        { label: 'At Least Once', value: 'at_least_once' },
        { label: 'At Most Once', value: 'at_most_once' }
      ]
    },
    {
      id: 'window_type',
      name: 'Window Type',
      description: 'Windowing strategy for aggregations',
      type: 'select',
      required: false,
      options: [
        { label: 'Tumbling (Fixed)', value: 'tumbling' },
        { label: 'Sliding', value: 'sliding' },
        { label: 'Session', value: 'session' },
        { label: 'No Window', value: 'none' }
      ]
    },
    {
      id: 'window_duration',
      name: 'Window Duration',
      description: 'Window size in seconds',
      type: 'number',
      required: false,
      defaultValue: 60,
      validation: {
        min: 1,
        max: 3600
      }
    },
    {
      id: 'transformations',
      name: 'Transformations',
      description: 'Processing to apply',
      type: 'multiselect',
      required: true,
      options: [
        { label: 'Filter', value: 'filter' },
        { label: 'Enrich', value: 'enrich' },
        { label: 'Aggregate', value: 'aggregate' },
        { label: 'Join', value: 'join' },
        { label: 'Deduplicate', value: 'dedup' }
      ]
    },
    {
      id: 'target_sink',
      name: 'Target Sink',
      description: 'Where to write processed data',
      type: 'multiselect',
      required: true,
      options: [
        { label: 'S3/Data Lake', value: 's3' },
        { label: 'Database', value: 'database' },
        { label: 'Another Stream', value: 'stream' },
        { label: 'ElasticSearch', value: 'elasticsearch' },
        { label: 'API Webhook', value: 'webhook' }
      ]
    }
  ],
  
  generates: {
    sparkJob: true,
    nifiFlow: true,
    dataHubMetadata: true
  },
  
  codeTemplates: {
    spark: `from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

spark = SparkSession.builder \\
    .appName("StreamingETL_{{source_stream}}") \\
    .config("spark.streaming.stopGracefullyOnShutdown", "true") \\
    .config("spark.sql.streaming.checkpointLocation", "/checkpoint/{{source_stream}}") \\
    .getOrCreate()

# Define schema
schema = StructType([
    StructField("event_id", StringType(), True),
    StructField("timestamp", TimestampType(), True),
    StructField("user_id", StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("properties", MapType(StringType(), StringType()), True)
])

# Read from stream
source_df = spark \\
    .readStream \\
    .format("kafka") \\
    .option("kafka.bootstrap.servers", "{{kafka_brokers}}") \\
    .option("subscribe", "{{source_stream}}") \\
    .option("startingOffsets", "latest") \\
    .load()

# Parse JSON
parsed_df = source_df \\
    .select(from_json(col("value").cast("string"), schema).alias("data")) \\
    .select("data.*") \\
    .withColumn("processing_time", current_timestamp())

# Apply transformations
{{#if (contains transformations "filter")}}
# Filter events
filtered_df = parsed_df.filter(col("event_type").isin(["purchase", "view", "click"]))
{{/if}}

{{#if (contains transformations "enrich")}}
# Enrich with reference data
user_dim = spark.read.table("user_dimension")
enriched_df = filtered_df.join(
    broadcast(user_dim),
    filtered_df.user_id == user_dim.user_id,
    "left"
)
{{/if}}

{{#if (contains transformations "aggregate")}}
# Windowed aggregation
aggregated_df = enriched_df \\
    .withWatermark("timestamp", "5 minutes") \\
    .groupBy(
        window(col("timestamp"), "{{window_duration}} seconds"),
        col("event_type")
    ) \\
    .agg(
        count("*").alias("event_count"),
        countDistinct("user_id").alias("unique_users"),
        avg("properties.amount").alias("avg_amount")
    )
{{/if}}

{{#if (contains transformations "dedup")}}
# Deduplicate
deduped_df = aggregated_df.dropDuplicates(["event_id"])
{{/if}}

# Write to sinks
{{#if (contains target_sink "s3")}}
# Write to S3
s3_query = deduped_df.writeStream \\
    .outputMode("append") \\
    .format("parquet") \\
    .option("path", "s3://data-lake/streaming/{{source_stream}}") \\
    .option("checkpointLocation", "/checkpoint/s3_{{source_stream}}") \\
    .partitionBy("date") \\
    .trigger(processingTime="10 seconds") \\
    .start()
{{/if}}

{{#if (contains target_sink "database")}}
# Write to database
def write_to_postgres(df, epoch_id):
    df.write \\
        .mode("append") \\
        .format("jdbc") \\
        .option("url", "jdbc:postgresql://localhost:5432/analytics") \\
        .option("dbtable", "streaming_events") \\
        .option("user", "postgres") \\
        .option("password", "password") \\
        .save()

db_query = deduped_df.writeStream \\
    .outputMode("append") \\
    .foreachBatch(write_to_postgres) \\
    .trigger(processingTime="10 seconds") \\
    .start()
{{/if}}

# Await termination
spark.streams.awaitAnyTermination()`,

    python: `import json
import boto3
from kafka import KafkaConsumer, KafkaProducer
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StreamingETLPipeline:
    def __init__(self):
        self.consumer = KafkaConsumer(
            '{{source_stream}}',
            bootstrap_servers=['{{kafka_brokers}}'],
            auto_offset_reset='latest',
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            group_id='etl_{{source_stream}}'
        )
        
        {{#if (contains target_sink "stream")}}
        self.producer = KafkaProducer(
            bootstrap_servers=['{{kafka_brokers}}'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        {{/if}}
        
        {{#if (contains target_sink "s3")}}
        self.s3_client = boto3.client('s3')
        self.buffer = []
        self.buffer_size = 1000
        {{/if}}
    
    def process_message(self, message):
        """Apply transformations to a single message"""
        try:
            # Parse message
            data = message.value
            
            {{#if (contains transformations "filter")}}
            # Filter logic
            if data.get('event_type') not in ['purchase', 'view', 'click']:
                return None
            {{/if}}
            
            {{#if (contains transformations "enrich")}}
            # Enrich with additional data
            data['processed_at'] = datetime.utcnow().isoformat()
            data['processing_node'] = 'etl-node-1'
            {{/if}}
            
            {{#if (contains transformations "dedup")}}
            # Check for duplicates (implement cache/bloom filter)
            if self.is_duplicate(data.get('event_id')):
                return None
            {{/if}}
            
            return data
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return None
    
    def run(self):
        """Main processing loop"""
        logger.info(f"Starting streaming ETL for {{source_stream}}")
        
        for message in self.consumer:
            processed = self.process_message(message)
            
            if processed:
                {{#if (contains target_sink "stream")}}
                # Send to output stream
                self.producer.send('{{output_stream}}', processed)
                {{/if}}
                
                {{#if (contains target_sink "s3")}}
                # Buffer for S3
                self.buffer.append(processed)
                if len(self.buffer) >= self.buffer_size:
                    self.flush_to_s3()
                {{/if}}
                
                {{#if (contains target_sink "webhook")}}
                # Send to webhook
                self.send_to_webhook(processed)
                {{/if}}
        
        logger.info("Streaming ETL stopped")

if __name__ == "__main__":
    pipeline = StreamingETLPipeline()
    pipeline.run()`
  },
  
  sourceRequirements: [
    {
      type: 'stream',
      schema: {
        fields: [
          { name: 'event_id', type: 'string', required: true },
          { name: 'timestamp', type: 'timestamp', required: true },
          { name: 'data', type: 'json', required: true }
        ]
      }
    }
  ],
  
  targetRequirements: [
    {
      type: 'stream',
      format: 'json'
    }
  ],
  
  qualityChecks: [
    {
      name: 'Message Processing Rate',
      type: 'completeness',
      threshold: 99,
      action: 'warn'
    },
    {
      name: 'Processing Latency',
      type: 'validity',
      threshold: 1000, // ms
      action: 'warn'
    },
    {
      name: 'Error Rate',
      type: 'accuracy',
      threshold: 0.1, // 0.1%
      action: 'fail'
    }
  ],
  
  monitoring: {
    metrics: [
      'messages_per_second',
      'processing_latency_p99',
      'error_rate',
      'lag',
      'throughput'
    ],
    alerts: [
      {
        condition: 'lag',
        threshold: 10000,
        action: 'alert'
      },
      {
        condition: 'error_rate',
        threshold: 1,
        action: 'page'
      }
    ],
    sla: {
      completionTime: '< 1 second',
      dataFreshness: 'real-time'
    }
  },
  
  performanceHints: [
    'Use exactly-once semantics for critical data',
    'Implement backpressure to handle traffic spikes',
    'Use micro-batching for better throughput',
    'Enable checkpointing for fault tolerance'
  ],
  
  optimizationSuggestions: [
    'Increase parallelism for higher throughput',
    'Use broadcast joins for small reference data',
    'Implement circuit breakers for downstream services',
    'Consider using Kafka Streams for simpler use cases'
  ]
};