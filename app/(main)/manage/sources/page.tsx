'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Cable,
  Activity,
  Database,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Eye,
  Play,
  Zap,
  Clock,
  Server,
  Terminal,
  FileText,
  Loader2,
  List,
  LayoutGrid,
  TestTube,
  Bot,
  Code,
  Copy,
  Edit,
  Download,
  Layers,
  GitBranch,
  Box,
  Network,
  Cpu,
} from 'lucide-react';

// Enhanced interfaces for engineering-first approach
interface SourceConnection {
  id: string;
  name: string;
  type: 'CDC' | 'JDBC' | 'REST_API' | 'STREAMING' | 'FILE';
  status: 'healthy' | 'warning' | 'error' | 'configuring';

  // Connection details
  host?: string;
  port?: number;
  database?: string;

  // CDC-specific (Debezium)
  debeziumConfig?: {
    connector: string;
    'database.hostname': string;
    'database.port': string;
    'database.user': string;
    'database.dbname': string;
    'database.server.name': string;
    'table.include.list': string;
    'plugin.name': string;
    'slot.name': string;
    'publication.name': string;
    'snapshot.mode': string;
    'decimal.handling.mode': string;
    'time.precision.mode': string;
  };

  // Kafka configuration
  kafkaConfig?: {
    topicPrefix: string;
    bootstrapServers: string;
    consumerGroup: string;
    partitions: number;
    replicationFactor: number;
    compressionType: string;
    retentionMs: number;
  };

  // Spark/Processing configuration
  sparkConfig?: {
    applicationName: string;
    master: string;
    deployMode: string;
    driverMemory: string;
    executorMemory: string;
    executorCores: number;
    numExecutors: number;
    checkpointLocation: string;
    outputMode: string;
  };

  // Architecture recommendation
  architectureRecommendation?: {
    recommended: 'CDC' | 'BATCH' | 'HYBRID';
    reasoning: string[];
    tradeoffs: {
      latency: string;
      complexity: string;
      cost: string;
      reliability: string;
    };
    alternativeOptions: Array<{
      architecture: string;
      pros: string[];
      cons: string[];
    }>;
  };

  // Deployment plan
  deploymentPlan?: {
    steps: Array<{
      order: number;
      description: string;
      command: string;
      estimatedDuration: string;
    }>;
  };

  // Metrics
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    downstream: number;
    totalRecords: number;
    avgRecordSize: number;
  };
}

export default function EngineeringSourcesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedConnection, setSelectedConnection] = useState<SourceConnection | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editableConfig, setEditableConfig] = useState<string>('');
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [askingAI, setAskingAI] = useState(false);

  // Sample connections with full technical details
  const [connections] = useState<SourceConnection[]>([
    {
      id: 'conn-cdc-001',
      name: 'Orders Database CDC',
      type: 'CDC',
      status: 'healthy',
      host: 'postgres-primary.prod.company.com',
      port: 5432,
      database: 'orders_prod',
      debeziumConfig: {
        connector: 'io.debezium.connector.postgresql.PostgresConnector',
        'database.hostname': 'postgres-primary.prod.company.com',
        'database.port': '5432',
        'database.user': 'debezium_user',
        'database.dbname': 'orders_prod',
        'database.server.name': 'orders_prod_server',
        'table.include.list': 'public.orders,public.order_items,public.customers',
        'plugin.name': 'pgoutput',
        'slot.name': 'debezium_slot_orders',
        'publication.name': 'debezium_publication',
        'snapshot.mode': 'initial',
        'decimal.handling.mode': 'precise',
        'time.precision.mode': 'adaptive',
      },
      kafkaConfig: {
        topicPrefix: 'prod.orders_db',
        bootstrapServers: 'kafka-1.prod:9092,kafka-2.prod:9092,kafka-3.prod:9092',
        consumerGroup: 'orders-cdc-consumer',
        partitions: 6,
        replicationFactor: 3,
        compressionType: 'snappy',
        retentionMs: 604800000, // 7 days
      },
      sparkConfig: {
        applicationName: 'orders-cdc-processor',
        master: 'spark://spark-master:7077',
        deployMode: 'cluster',
        driverMemory: '4g',
        executorMemory: '8g',
        executorCores: 4,
        numExecutors: 3,
        checkpointLocation: 's3://data-lake/checkpoints/orders-cdc',
        outputMode: 'append',
      },
      architectureRecommendation: {
        recommended: 'CDC',
        reasoning: [
          'High data change frequency (5000+ updates/minute) requires real-time capture',
          'Downstream analytics needs sub-minute latency for dashboards',
          'Source database can handle replication slot without performance impact',
          'Existing Kafka infrastructure reduces implementation complexity',
        ],
        tradeoffs: {
          latency: 'Excellent: <5 second end-to-end latency',
          complexity: 'Moderate: Requires Debezium + Kafka + monitoring',
          cost: 'Medium: $2000/month infrastructure + maintenance',
          reliability: 'High: Built-in exactly-once semantics with checkpointing',
        },
        alternativeOptions: [
          {
            architecture: 'Batch ETL (Hourly)',
            pros: ['Simpler to implement', 'Lower operational overhead', 'Familiar patterns'],
            cons: ['60-minute latency unacceptable for real-time dashboards', 'Larger compute spikes'],
          },
          {
            architecture: 'Hybrid (CDC critical tables + Batch for historicals)',
            pros: ['Optimizes cost vs latency tradeoff', 'Reduces CDC complexity'],
            cons: ['Dual pipelines to maintain', 'More complex data reconciliation'],
          },
        ],
      },
      deploymentPlan: {
        steps: [
          {
            order: 1,
            description: 'Create Debezium replication user and slot in PostgreSQL',
            command: `psql -h postgres-primary.prod.company.com -U postgres <<EOF
CREATE USER debezium_user WITH REPLICATION PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO debezium_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO debezium_user;
SELECT * FROM pg_create_logical_replication_slot('debezium_slot_orders', 'pgoutput');
CREATE PUBLICATION debezium_publication FOR TABLE public.orders, public.order_items, public.customers;
EOF`,
            estimatedDuration: '2 minutes',
          },
          {
            order: 2,
            description: 'Create Kafka topics with proper configuration',
            command: `kafka-topics.sh --create --bootstrap-server kafka-1.prod:9092 \\
  --topic prod.orders_db.public.orders \\
  --partitions 6 --replication-factor 3 \\
  --config compression.type=snappy \\
  --config retention.ms=604800000

kafka-topics.sh --create --bootstrap-server kafka-1.prod:9092 \\
  --topic prod.orders_db.public.order_items \\
  --partitions 6 --replication-factor 3

kafka-topics.sh --create --bootstrap-server kafka-1.prod:9092 \\
  --topic prod.orders_db.public.customers \\
  --partitions 6 --replication-factor 3`,
            estimatedDuration: '1 minute',
          },
          {
            order: 3,
            description: 'Deploy Debezium connector configuration',
            command: `curl -X POST http://debezium-connect:8083/connectors -H "Content-Type: application/json" -d '{
  "name": "orders-postgres-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgres-primary.prod.company.com",
    "database.port": "5432",
    "database.user": "debezium_user",
    "database.password": "secure_password",
    "database.dbname": "orders_prod",
    "database.server.name": "orders_prod_server",
    "table.include.list": "public.orders,public.order_items,public.customers",
    "plugin.name": "pgoutput",
    "slot.name": "debezium_slot_orders",
    "publication.name": "debezium_publication"
  }
}'`,
            estimatedDuration: '30 seconds',
          },
          {
            order: 4,
            description: 'Deploy Spark Structured Streaming job to Iceberg',
            command: `spark-submit --master spark://spark-master:7077 \\
  --deploy-mode cluster \\
  --driver-memory 4g \\
  --executor-memory 8g \\
  --executor-cores 4 \\
  --num-executors 3 \\
  --packages org.apache.iceberg:iceberg-spark-runtime-3.3_2.12:1.4.0 \\
  --conf spark.sql.catalog.prod=org.apache.iceberg.spark.SparkCatalog \\
  --conf spark.sql.catalog.prod.type=hadoop \\
  --conf spark.sql.catalog.prod.warehouse=s3://data-lake/warehouse \\
  jobs/orders-cdc-to-iceberg.py`,
            estimatedDuration: '5 minutes (includes job startup)',
          },
          {
            order: 5,
            description: 'Verify end-to-end data flow',
            command: `# Check Debezium connector status
curl http://debezium-connect:8083/connectors/orders-postgres-connector/status

# Monitor Kafka topic lag
kafka-consumer-groups.sh --bootstrap-server kafka-1.prod:9092 \\
  --describe --group orders-cdc-consumer

# Query Iceberg table for latest data
spark-sql --conf spark.sql.catalog.prod=org.apache.iceberg.spark.SparkCatalog \\
  -e "SELECT COUNT(*), MAX(updated_at) FROM prod.orders"`,
            estimatedDuration: '2 minutes',
          },
        ],
      },
      metrics: {
        responseTime: 2300, // ms
        errorRate: 0.05,
        throughput: 5420, // records/sec
        downstream: 8,
        totalRecords: 15847293,
        avgRecordSize: 2048, // bytes
      },
    },
  ]);

  const handleAskAI = (connection: SourceConnection) => {
    setAskingAI(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAskingAI(false);
      setShowArchitectureModal(true);
    }, 2000);
  };

  const handleEditConfig = (connection: SourceConnection) => {
    setSelectedConnection(connection);
    setEditableConfig(JSON.stringify(
      {
        debezium: connection.debeziumConfig,
        kafka: connection.kafkaConfig,
        spark: connection.sparkConfig,
      },
      null,
      2
    ));
    setShowConfigModal(true);
  };

  const handleViewDeployment = (connection: SourceConnection) => {
    setSelectedConnection(connection);
    setShowDeploymentModal(true);
  };

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CDC':
        return <GitBranch className="w-4 h-4" />;
      case 'JDBC':
        return <Database className="w-4 h-4" />;
      case 'REST_API':
        return <Zap className="w-4 h-4" />;
      case 'STREAMING':
        return <Activity className="w-4 h-4" />;
      case 'FILE':
        return <FileText className="w-4 h-4" />;
      default:
        return <Cable className="w-4 h-4" />;
    }
  };

  const healthyCount = connections.filter((c) => c.status === 'healthy').length;
  const totalConnections = connections.length;
  const healthPercentage =
    totalConnections > 0 ? Math.round((healthyCount / totalConnections) * 100) : 0;

  return (
    <div className="w-full px-8 lg:px-12 xl:px-16 py-6 space-y-4">
      {/* Engineering-First Header */}
      <div className="bg-background border-b sticky top-14 z-30 -mx-8 lg:-mx-12 xl:-mx-16 px-8 lg:px-12 xl:px-16 pb-3">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Source Connections</h1>
              <p className="text-sm text-muted-foreground">
                Configure and monitor data source connections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health indicator */}
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5">
              <div
                className={`text-sm font-semibold ${
                  healthPercentage >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : healthPercentage >= 60
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {healthPercentage}% Healthy
              </div>
              <div className="h-4 border-l border-border mx-1" />
              <div className="text-sm font-mono">
                {healthyCount}/{totalConnections}
              </div>
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>

            <Button size="sm" onClick={() => router.push('/build/connections?tab=add')}>
              <Plus className="w-4 h-4 mr-2" />
              New Connection
            </Button>
          </div>
        </div>
      </div>

      {/* Engineering-First Connection List */}
      <div className="space-y-4">
        {connections.map((connection) => (
          <Card key={connection.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(connection.status)}
                    {getTypeIcon(connection.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{connection.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">
                      {connection.host}:{connection.port} → Kafka → Spark → Iceberg
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono">
                  {connection.type}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Real-time Metrics */}
              <div className="grid grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Throughput</p>
                  <p className="text-lg font-bold font-mono">
                    {(connection.metrics.throughput / 1000).toFixed(1)}k<span className="text-xs text-muted-foreground">/s</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Latency (p99)</p>
                  <p className="text-lg font-bold font-mono">
                    {connection.metrics.responseTime}<span className="text-xs text-muted-foreground">ms</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
                  <p className={`text-lg font-bold font-mono ${connection.metrics.errorRate < 0.1 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {connection.metrics.errorRate}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Records</p>
                  <p className="text-lg font-bold font-mono">
                    {(connection.metrics.totalRecords / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg Size</p>
                  <p className="text-lg font-bold font-mono">
                    {(connection.metrics.avgRecordSize / 1024).toFixed(1)}KB
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Downstream</p>
                  <p className="text-lg font-bold font-mono">
                    {connection.metrics.downstream}
                  </p>
                </div>
              </div>

              {/* Technical Stack Visualization */}
              <div className="flex items-center justify-between gap-2 bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  <code className="text-xs">PostgreSQL</code>
                </div>
                <div className="flex-1 border-t border-dashed border-border" />
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-500" />
                  <code className="text-xs">Debezium CDC</code>
                </div>
                <div className="flex-1 border-t border-dashed border-border" />
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <code className="text-xs">Kafka ({connection.kafkaConfig?.partitions}p)</code>
                </div>
                <div className="flex-1 border-t border-dashed border-border" />
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-green-500" />
                  <code className="text-xs">Spark Streaming</code>
                </div>
                <div className="flex-1 border-t border-dashed border-border" />
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-500" />
                  <code className="text-xs">Iceberg</code>
                </div>
              </div>

              {/* Engineering Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedConnection(connection);
                    handleEditConfig(connection);
                  }}
                  className="gap-2"
                >
                  <Code className="w-4 h-4" />
                  View/Edit Config
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedConnection(connection);
                    handleViewDeployment(connection);
                  }}
                  className="gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  Deployment Plan
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedConnection(connection);
                    handleAskAI(connection);
                  }}
                  disabled={askingAI}
                  className="gap-2"
                >
                  {askingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      Architecture Advice
                    </>
                  )}
                </Button>

                <Button size="sm" variant="outline" className="gap-2">
                  <TestTube className="w-4 h-4" />
                  Test Connection
                </Button>

                <Button size="sm" variant="outline" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Metrics Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Config Editor Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Full Configuration: {selectedConnection?.name}</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              All settings editable • Changes applied directly • No hiding technical details
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="debezium" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="debezium">Debezium CDC</TabsTrigger>
              <TabsTrigger value="kafka">Kafka</TabsTrigger>
              <TabsTrigger value="spark">Spark</TabsTrigger>
            </TabsList>

            <TabsContent value="debezium" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono">Full Debezium Configuration</Label>
                <Textarea
                  value={JSON.stringify(selectedConnection?.debeziumConfig, null, 2)}
                  onChange={(e) => setEditableConfig(e.target.value)}
                  className="font-mono text-xs h-96"
                  placeholder="Debezium connector configuration..."
                />
                <p className="text-xs text-muted-foreground">
                  Direct edit of Debezium connector properties. Validates on save.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="kafka" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono">Kafka Topic & Consumer Configuration</Label>
                <Textarea
                  value={JSON.stringify(selectedConnection?.kafkaConfig, null, 2)}
                  onChange={(e) => setEditableConfig(e.target.value)}
                  className="font-mono text-xs h-96"
                  placeholder="Kafka configuration..."
                />
                <p className="text-xs text-muted-foreground">
                  Kafka topic settings, partitions, replication factor, compression, retention.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="spark" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono">Spark Structured Streaming Configuration</Label>
                <Textarea
                  value={JSON.stringify(selectedConnection?.sparkConfig, null, 2)}
                  onChange={(e) => setEditableConfig(e.target.value)}
                  className="font-mono text-xs h-96"
                  placeholder="Spark configuration..."
                />
                <p className="text-xs text-muted-foreground">
                  Spark application settings: memory, cores, executors, checkpointing.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export YAML
              </Button>
              <Button className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Validate & Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Architecture Recommendation Modal */}
      <Dialog open={showArchitectureModal} onOpenChange={setShowArchitectureModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Architecture Recommendation: {selectedConnection?.name}
            </DialogTitle>
            <DialogDescription>
              AI analysis with transparent reasoning • You make the final decision
            </DialogDescription>
          </DialogHeader>

          {selectedConnection?.architectureRecommendation && (
            <div className="space-y-6">
              {/* Recommended Architecture */}
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Recommended: {selectedConnection.architectureRecommendation.recommended}
                </h3>

                <Alert className="mb-4">
                  <Bot className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Why this architecture?</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      {selectedConnection.architectureRecommendation.reasoning.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Tradeoffs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">Latency</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedConnection.architectureRecommendation.tradeoffs.latency}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Complexity</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedConnection.architectureRecommendation.tradeoffs.complexity}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Cost</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedConnection.architectureRecommendation.tradeoffs.cost}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Reliability</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedConnection.architectureRecommendation.tradeoffs.reliability}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternative Options */}
              <div>
                <h3 className="text-md font-semibold mb-3">Alternative Architectures</h3>
                <div className="space-y-3">
                  {selectedConnection.architectureRecommendation.alternativeOptions.map((alt, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{alt.architecture}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-green-600">Pros</Label>
                          <ul className="mt-1 space-y-1">
                            {alt.pros.map((pro, j) => (
                              <li key={j} className="text-xs flex items-start gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <Label className="text-xs text-red-600">Cons</Label>
                          <ul className="mt-1 space-y-1">
                            {alt.cons.map((con, j) => (
                              <li key={j} className="text-xs flex items-start gap-1">
                                <XCircle className="w-3 h-3 text-red-500 mt-0.5" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowArchitectureModal(false)}>
              Close
            </Button>
            <Button className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Accept Recommendation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deployment Plan Modal */}
      <Dialog open={showDeploymentModal} onOpenChange={setShowDeploymentModal}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Deployment Plan: {selectedConnection?.name}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Actual commands that will be executed • Copy, review, run manually or automate
            </DialogDescription>
          </DialogHeader>

          {selectedConnection?.deploymentPlan && (
            <div className="space-y-4">
              {selectedConnection.deploymentPlan.steps.map((step) => (
                <Card key={step.order}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          Step {step.order}
                        </Badge>
                        {step.description}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {step.estimatedDuration}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
                        {step.command}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyCommand(step.command)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowDeploymentModal(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Shell Script
              </Button>
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                Execute Deployment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
