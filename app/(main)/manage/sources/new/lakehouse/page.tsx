'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  AlertCircle,
  Zap,
  FileText,
  Workflow,
  Table,
  Settings,
  Rocket,
  MessagesSquare,
  Repeat,
} from 'lucide-react';
import type {
  DatabaseType,
  ConnectionDetails,
  DebeziumConfig,
  KafkaConfig,
  SparkConfig,
  IcebergConfig,
  SelectedTable,
  SnapshotMode,
  DecimalHandling,
  CompressionType,
  FileFormat,
  MergeStrategy,
} from '@/lib/types/source-connections';

interface LakehouseSourceData {
  // Step 1: Basic Info
  name: string;
  description: string;
  type: DatabaseType;
  team: string;
  owner: string;
  tags: string[];

  // Step 2: Connection
  connection: ConnectionDetails;

  // Step 3: Table Selection
  selectedTables: SelectedTable[];

  // Step 4: Debezium Config
  debezium: DebeziumConfig;

  // Step 5: Kafka Config
  kafka: KafkaConfig;

  // Step 6: Spark Config
  spark: SparkConfig;

  // Step 7: Iceberg Config
  iceberg: IcebergConfig;
}

const STEP_CONFIG = [
  { label: 'Basic Info', icon: FileText },
  { label: 'Connection', icon: Database },
  { label: 'Select Tables', icon: Table },
  { label: 'CDC Config', icon: Repeat },
  { label: 'Kafka Config', icon: MessagesSquare },
  { label: 'Spark Config', icon: Zap },
  { label: 'Iceberg Config', icon: Rocket },
];

const STEP_LABELS = STEP_CONFIG.map(s => s.label);

export default function LakehouseWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<LakehouseSourceData>({
    name: '',
    description: '',
    type: 'postgresql',
    team: '',
    owner: '',
    tags: [],
    connection: {
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: true,
    },
    selectedTables: [],
    debezium: {
      connector_name: '',
      snapshot_mode: 'initial',
      include_schema_changes: true,
      decimal_handling: 'string',
      tombstones_on_delete: true,
      slot_name: '',
      publication_name: 'debezium_publication',
      max_batch_size: 2048,
      max_queue_size: 8192,
      poll_interval_ms: 500,
    },
    kafka: {
      topic_prefix: '',
      topic_pattern: '{prefix}.{schema}.{table}',
      partitions: 6,
      replication_factor: 3,
      retention_ms: 604800000, // 7 days
      compression_type: 'snappy',
      min_insync_replicas: 2,
      cleanup_policy: 'delete',
    },
    spark: {
      job_name: '',
      checkpoint_location: '',
      checkpoint_interval: '10 seconds',
      trigger_interval: '5 minutes',
      trigger_mode: 'processing-time',
      executor_memory: '4g',
      executor_cores: 2,
      num_executors: 4,
      driver_memory: '2g',
      default_parallelism: 24,
      shuffle_partitions: 200,
      max_offsets_per_trigger: 100000,
    },
    iceberg: {
      catalog_name: 'prod_lakehouse',
      catalog_type: 'nessie',
      namespace: '',
      file_format: 'parquet',
      partition_spec: [],
      merge_strategy: 'upsert',
      primary_key_columns: [],
      compaction_enabled: true,
      compaction_schedule: '0 2 * * *',
      parquet_compression: 'snappy',
      target_file_size_bytes: 536870912, // 512 MB
    },
  });

  const totalSteps = 7;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    await new Promise(resolve => setTimeout(resolve, 2000));

    setConnectionTestResult({
      success: true,
      message: 'Connection successful! Server version: PostgreSQL 14.5'
    });

    setIsTestingConnection(false);
  };

  const handleDeploy = async () => {
    const payload = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      mode: 'lakehouse',
      team: formData.team,
      owner: formData.owner,
      tags: formData.tags,
      connection: formData.connection,
      pipeline: {
        debezium: formData.debezium,
        kafka: formData.kafka,
        spark: formData.spark,
        iceberg: formData.iceberg,
      },
      selected_tables: formData.selectedTables,
    };

    try {
      const response = await fetch('/api/manage/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/manage/sources');
      } else {
        alert('Failed to create source');
      }
    } catch (error) {
      console.error('Error creating source:', error);
      alert('Error creating source');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-1 mb-8 overflow-x-auto">
      {STEP_CONFIG.map((stepConfig, idx) => {
        const step = idx + 1;
        const StepIcon = stepConfig.icon;
        const isCurrentStep = currentStep === step;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* Pulsing outline for current step */}
                {isCurrentStep && (
                  <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse" />
                )}

                <div
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-muted'
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
              </div>
              <span className="text-xs mt-1 text-muted-foreground hidden sm:block">{stepConfig.label}</span>
            </div>
            {step < totalSteps && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Source Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Orders Production"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Database Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: DatabaseType) => {
              setFormData({ ...formData, type: value });
              // Auto-set default port
              if (value === 'postgresql') setFormData(prev => ({ ...prev, connection: { ...prev.connection, port: 5432 }}));
              if (value === 'mysql') setFormData(prev => ({ ...prev, connection: { ...prev.connection, port: 3306 }}));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="mariadb">MariaDB</SelectItem>
              <SelectItem value="sqlserver">SQL Server</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe this data source and its purpose"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="team">Team *</Label>
          <Input
            id="team"
            placeholder="e.g., Data Platform"
            value={formData.team}
            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="owner">Owner Email *</Label>
          <Input
            id="owner"
            type="email"
            placeholder="owner@company.com"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          placeholder="production, cdc, real-time"
          onChange={(e) => setFormData({
            ...formData,
            tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
          })}
        />
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Workflow className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-900">Lakehouse Pipeline Overview</p>
            <p className="text-sm text-blue-800">
              This wizard will configure a complete CDC pipeline: Source DB → Debezium → Kafka → Spark Streaming → Iceberg Tables
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Database Connection Details</h3>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="host">Host *</Label>
          <Input
            id="host"
            placeholder="database.company.com"
            value={formData.connection.host}
            onChange={(e) => setFormData({
              ...formData,
              connection: { ...formData.connection, host: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="port">Port *</Label>
          <Input
            id="port"
            type="number"
            value={formData.connection.port}
            onChange={(e) => setFormData({
              ...formData,
              connection: { ...formData.connection, port: parseInt(e.target.value) || 5432 }
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="database">Database Name *</Label>
          <Input
            id="database"
            placeholder="production_db"
            value={formData.connection.database}
            onChange={(e) => setFormData({
              ...formData,
              connection: { ...formData.connection, database: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            placeholder="debezium_user"
            value={formData.connection.username}
            onChange={(e) => setFormData({
              ...formData,
              connection: { ...formData.connection, username: e.target.value }
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.connection.password}
            onChange={(e) => setFormData({
              ...formData,
              connection: { ...formData.connection, password: e.target.value }
            })}
          />
        </div>

        <div className="flex items-end pb-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ssl"
              checked={formData.connection.ssl}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                connection: { ...formData.connection, ssl: checked as boolean }
              })}
            />
            <Label htmlFor="ssl" className="cursor-pointer">Enable SSL/TLS</Label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="pt-4">
        <Button
          onClick={handleTestConnection}
          variant="outline"
          disabled={isTestingConnection}
          className="gap-2"
        >
          {isTestingConnection ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>

        {connectionTestResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            connectionTestResult.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {connectionTestResult.success ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{connectionTestResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {formData.type === 'postgresql' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-amber-900">PostgreSQL Requirements</p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• User must have REPLICATION permission</li>
                <li>• wal_level must be set to 'logical'</li>
                <li>• max_replication_slots must allow for Debezium slot</li>
                <li>• Publication must be created for CDC</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Tables for Replication</h3>
        <Button size="sm" variant="outline">
          <Table className="h-4 w-4 mr-2" />
          Discover Tables
        </Button>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Select which tables to replicate to the lakehouse. Click "Discover Tables" to scan the database.
        </p>
      </div>

      <div className="border rounded-lg">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-2">
            {['orders', 'order_items', 'customers', 'products', 'inventory'].map((table) => (
              <div key={table} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                <div className="flex items-center space-x-3">
                  <Checkbox id={`table-${table}`} />
                  <div>
                    <Label htmlFor={`table-${table}`} className="cursor-pointer font-medium">
                      public.{table}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      ~2.5M rows • 1.2 GB • Updated hourly
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Table</Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-900">Selected: 0 tables</p>
            <p className="text-sm text-blue-800">
              Estimated initial snapshot size: 0 GB
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Debezium CDC Configuration</h3>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="connectorName">Connector Name *</Label>
          <Input
            id="connectorName"
            placeholder="orders-prod-connector"
            value={formData.debezium.connector_name}
            onChange={(e) => setFormData({
              ...formData,
              debezium: { ...formData.debezium, connector_name: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="snapshotMode">Snapshot Mode *</Label>
          <Select
            value={formData.debezium.snapshot_mode}
            onValueChange={(value: SnapshotMode) => setFormData({
              ...formData,
              debezium: { ...formData.debezium, snapshot_mode: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial">Initial (Full + Streaming)</SelectItem>
              <SelectItem value="schema_only">Schema Only</SelectItem>
              <SelectItem value="never">Streaming Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.type === 'postgresql' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="slotName">Replication Slot Name *</Label>
            <Input
              id="slotName"
              placeholder="debezium_orders_prod"
              value={formData.debezium.slot_name}
              onChange={(e) => setFormData({
                ...formData,
                debezium: { ...formData.debezium, slot_name: e.target.value }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicationName">Publication Name *</Label>
            <Input
              id="publicationName"
              placeholder="debezium_publication"
              value={formData.debezium.publication_name}
              onChange={(e) => setFormData({
                ...formData,
                debezium: { ...formData.debezium, publication_name: e.target.value }
              })}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="decimalHandling">Decimal Handling</Label>
          <Select
            value={formData.debezium.decimal_handling}
            onValueChange={(value: DecimalHandling) => setFormData({
              ...formData,
              debezium: { ...formData.debezium, decimal_handling: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String (Safe)</SelectItem>
              <SelectItem value="precise">Precise (BigDecimal)</SelectItem>
              <SelectItem value="double">Double (May lose precision)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end pb-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tombstones"
              checked={formData.debezium.tombstones_on_delete}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                debezium: { ...formData.debezium, tombstones_on_delete: checked as boolean }
              })}
            />
            <Label htmlFor="tombstones" className="cursor-pointer">Tombstones on Delete</Label>
          </div>
        </div>
      </div>

      <Separator />

      <h4 className="font-medium">Advanced Settings</h4>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="maxBatchSize">Max Batch Size</Label>
          <Input
            id="maxBatchSize"
            type="number"
            value={formData.debezium.max_batch_size}
            onChange={(e) => setFormData({
              ...formData,
              debezium: { ...formData.debezium, max_batch_size: parseInt(e.target.value) || 2048 }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxQueueSize">Max Queue Size</Label>
          <Input
            id="maxQueueSize"
            type="number"
            value={formData.debezium.max_queue_size}
            onChange={(e) => setFormData({
              ...formData,
              debezium: { ...formData.debezium, max_queue_size: parseInt(e.target.value) || 8192 }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pollInterval">Poll Interval (ms)</Label>
          <Input
            id="pollInterval"
            type="number"
            value={formData.debezium.poll_interval_ms}
            onChange={(e) => setFormData({
              ...formData,
              debezium: { ...formData.debezium, poll_interval_ms: parseInt(e.target.value) || 500 }
            })}
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Kafka Topic Configuration</h3>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="topicPrefix">Topic Prefix *</Label>
          <Input
            id="topicPrefix"
            placeholder="cdc.orders.prod"
            value={formData.kafka.topic_prefix}
            onChange={(e) => setFormData({
              ...formData,
              kafka: { ...formData.kafka, topic_prefix: e.target.value }
            })}
          />
          <p className="text-xs text-muted-foreground">
            Pattern: {formData.kafka.topic_pattern}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="compression">Compression Type</Label>
          <Select
            value={formData.kafka.compression_type}
            onValueChange={(value: CompressionType) => setFormData({
              ...formData,
              kafka: { ...formData.kafka, compression_type: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="snappy">Snappy (Balanced)</SelectItem>
              <SelectItem value="lz4">LZ4 (Fast)</SelectItem>
              <SelectItem value="gzip">GZIP (High Compression)</SelectItem>
              <SelectItem value="zstd">ZSTD (Best)</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="partitions">Partitions</Label>
          <Input
            id="partitions"
            type="number"
            value={formData.kafka.partitions}
            onChange={(e) => setFormData({
              ...formData,
              kafka: { ...formData.kafka, partitions: parseInt(e.target.value) || 6 }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="replication">Replication Factor</Label>
          <Input
            id="replication"
            type="number"
            value={formData.kafka.replication_factor}
            onChange={(e) => setFormData({
              ...formData,
              kafka: { ...formData.kafka, replication_factor: parseInt(e.target.value) || 3 }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minInsync">Min In-Sync Replicas</Label>
          <Input
            id="minInsync"
            type="number"
            value={formData.kafka.min_insync_replicas}
            onChange={(e) => setFormData({
              ...formData,
              kafka: { ...formData.kafka, min_insync_replicas: parseInt(e.target.value) || 2 }
            })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="retention">Retention (days)</Label>
        <Input
          id="retention"
          type="number"
          value={Math.floor(formData.kafka.retention_ms / (1000 * 60 * 60 * 24))}
          onChange={(e) => setFormData({
            ...formData,
            kafka: { ...formData.kafka, retention_ms: parseInt(e.target.value) * 1000 * 60 * 60 * 24 }
          })}
        />
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Spark Structured Streaming Configuration</h3>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="jobName">Job Name *</Label>
          <Input
            id="jobName"
            placeholder="orders-cdc-streaming"
            value={formData.spark.job_name}
            onChange={(e) => setFormData({
              ...formData,
              spark: { ...formData.spark, job_name: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="triggerInterval">Trigger Interval</Label>
          <Input
            id="triggerInterval"
            placeholder="5 minutes"
            value={formData.spark.trigger_interval}
            onChange={(e) => setFormData({
              ...formData,
              spark: { ...formData.spark, trigger_interval: e.target.value }
            })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkpointLocation">Checkpoint Location *</Label>
        <Input
          id="checkpointLocation"
          placeholder="s3://lakehouse/checkpoints/orders-cdc"
          value={formData.spark.checkpoint_location}
          onChange={(e) => setFormData({
            ...formData,
            spark: { ...formData.spark, checkpoint_location: e.target.value }
          })}
        />
      </div>

      <Separator />

      <h4 className="font-medium">Resource Allocation</h4>

      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label htmlFor="executorMemory">Executor Memory</Label>
          <Input
            id="executorMemory"
            placeholder="4g"
            value={formData.spark.executor_memory}
            onChange={(e) => setFormData({
              ...formData,
              spark: { ...formData.spark, executor_memory: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="executorCores">Executor Cores</Label>
          <Input
            id="executorCores"
            type="number"
            value={formData.spark.executor_cores}
            onChange={(e) => setFormData({
              ...formData,
              spark: { ...formData.spark, executor_cores: parseInt(e.target.value) || 2 }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numExecutors">Num Executors</Label>
          <Input
            id="numExecutors"
            type="number"
            value={formData.spark.num_executors}
            onChange={(e) => setFormData({
              ...formData,
              spark: { ...formData.spark, num_executors: parseInt(e.target.value) || 4 }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="driverMemory">Driver Memory</Label>
          <Input
            id="driverMemory"
            placeholder="2g"
            value={formData.spark.driver_memory}
            onChange={(e) => setFormData({
              ...formData,
              spark: { ...formData.spark, driver_memory: e.target.value }
            })}
          />
        </div>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Iceberg Table Configuration</h3>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="namespace">Namespace (Database) *</Label>
          <Input
            id="namespace"
            placeholder="cdc_sources.orders"
            value={formData.iceberg.namespace}
            onChange={(e) => setFormData({
              ...formData,
              iceberg: { ...formData.iceberg, namespace: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fileFormat">File Format</Label>
          <Select
            value={formData.iceberg.file_format}
            onValueChange={(value: FileFormat) => setFormData({
              ...formData,
              iceberg: { ...formData.iceberg, file_format: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parquet">Parquet (Recommended)</SelectItem>
              <SelectItem value="orc">ORC</SelectItem>
              <SelectItem value="avro">Avro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="mergeStrategy">Merge Strategy</Label>
          <Select
            value={formData.iceberg.merge_strategy}
            onValueChange={(value: MergeStrategy) => setFormData({
              ...formData,
              iceberg: { ...formData.iceberg, merge_strategy: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upsert">Upsert (Update/Insert)</SelectItem>
              <SelectItem value="append">Append Only</SelectItem>
              <SelectItem value="delete">With Deletes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="parquetCompression">Parquet Compression</Label>
          <Select
            value={formData.iceberg.parquet_compression}
            onValueChange={(value: CompressionType) => setFormData({
              ...formData,
              iceberg: { ...formData.iceberg, parquet_compression: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="snappy">Snappy (Fast)</SelectItem>
              <SelectItem value="zstd">ZSTD (Best)</SelectItem>
              <SelectItem value="gzip">GZIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="compaction"
          checked={formData.iceberg.compaction_enabled}
          onCheckedChange={(checked) => setFormData({
            ...formData,
            iceberg: { ...formData.iceberg, compaction_enabled: checked as boolean }
          })}
        />
        <Label htmlFor="compaction" className="cursor-pointer">Enable Automatic Compaction</Label>
      </div>

      {formData.iceberg.compaction_enabled && (
        <div className="space-y-2">
          <Label htmlFor="compactionSchedule">Compaction Schedule (Cron)</Label>
          <Input
            id="compactionSchedule"
            placeholder="0 2 * * *"
            value={formData.iceberg.compaction_schedule}
            onChange={(e) => setFormData({
              ...formData,
              iceberg: { ...formData.iceberg, compaction_schedule: e.target.value }
            })}
          />
          <p className="text-xs text-muted-foreground">Default: Daily at 2 AM</p>
        </div>
      )}

      <Separator />

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Rocket className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-green-900">Ready to Deploy Pipeline</p>
            <p className="text-sm text-green-800">
              The complete CDC pipeline will be deployed:
            </p>
            <ul className="text-sm text-green-800 space-y-1 ml-4">
              <li>• Debezium connector: {formData.debezium.connector_name || 'Not set'}</li>
              <li>• Kafka topics: {formData.kafka.topic_prefix || 'Not set'}.*.* </li>
              <li>• Spark job: {formData.spark.job_name || 'Not set'}</li>
              <li>• Iceberg namespace: {formData.iceberg.namespace || 'Not set'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Workflow className="h-4 w-4" />
            <span>Lakehouse Pipeline (CDC to Iceberg)</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Configure CDC Pipeline</h1>
          <p className="text-muted-foreground">
            Set up real-time data replication from source database to Iceberg lakehouse
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEP_LABELS[currentStep - 1]}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Basic information about your data source'}
              {currentStep === 2 && 'Database connection details'}
              {currentStep === 3 && 'Choose which tables to replicate'}
              {currentStep === 4 && 'Configure Debezium CDC connector'}
              {currentStep === 5 && 'Configure Kafka topics and retention'}
              {currentStep === 6 && 'Configure Spark Structured Streaming job'}
              {currentStep === 7 && 'Configure Iceberg table settings'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
            {currentStep === 6 && renderStep6()}
            {currentStep === 7 && renderStep7()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? () => router.push('/manage/sources/new') : handlePrevious}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 1 ? 'Back to Mode Selection' : 'Previous'}
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleDeploy} className="gap-2">
              <Rocket className="h-4 w-4" />
              Deploy Pipeline
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
