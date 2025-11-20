'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  AlertCircle,
  Zap,
  Clock,
  Table2,
  MessageSquare,
  Server,
  FileCode,
  GitBranch,
  Activity,
} from 'lucide-react';
import type { DatabaseType } from '@/lib/types/source-connections';

type CDCMode = 'batch' | 'streaming';

interface TableConfig {
  schemaName: string;
  tableName: string;
  selected: boolean;
  hasPrimaryKey: boolean;
  primaryKeyColumns: string[];
  estimatedRowCount: number;
  cdcCompatible: boolean;
  incompatibilityReason?: string;
}

interface CDCWizardData {
  // Mode
  mode: CDCMode;

  // Step 1: Connection Details
  name: string;
  description: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;

  // Step 2: Table Selection
  tables: TableConfig[];

  // Step 3: Kafka Configuration
  kafkaBootstrapServers: string;
  kafkaTopicPrefix: string;
  kafkaPartitions: number;
  kafkaReplicationFactor: number;

  // Step 4: Debezium Configuration
  debeziumSnapshotMode: 'initial' | 'schema_only' | 'never';
  debeziumCaptureDeletes: boolean;
  debeziumBatchInterval?: string; // For batch mode only
  debeziumMaxBatchSize?: number; // For batch mode only

  // Step 5: Target Configuration
  targetNamespace: string;
  targetCatalog: string;
}

export default function CDCWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectorType = (searchParams?.get('connector') as DatabaseType) || 'postgresql';
  const mode = (searchParams?.get('mode') as CDCMode) || 'streaming';

  const [currentStep, setCurrentStep] = useState(1);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isBrowsingTables, setIsBrowsingTables] = useState(false);

  const [data, setData] = useState<CDCWizardData>({
    mode,
    name: '',
    description: '',
    type: connectorType,
    host: '',
    port: connectorType === 'postgresql' ? 5432 : 3306,
    database: '',
    username: '',
    password: '',
    tables: [],
    kafkaBootstrapServers: 'kafka-broker-1:9092,kafka-broker-2:9092,kafka-broker-3:9092',
    kafkaTopicPrefix: 'cdc',
    kafkaPartitions: 3,
    kafkaReplicationFactor: 3,
    debeziumSnapshotMode: 'initial',
    debeziumCaptureDeletes: true,
    debeziumBatchInterval: mode === 'batch' ? '5 minutes' : undefined,
    debeziumMaxBatchSize: mode === 'batch' ? 10000 : undefined,
    targetNamespace: 'cdc_replicated',
    targetCatalog: 'iceberg',
  });

  const updateData = (updates: Partial<CDCWizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500));

    setConnectionTestResult({
      success: true,
      message: 'Successfully connected to database with CDC permissions verified',
    });
    setIsTestingConnection(false);
  };

  const handleBrowseTables = async () => {
    setIsBrowsingTables(true);

    // Simulate table discovery with CDC compatibility check
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockTables: TableConfig[] = [
      {
        schemaName: 'public',
        tableName: 'customers',
        selected: false,
        hasPrimaryKey: true,
        primaryKeyColumns: ['customer_id'],
        estimatedRowCount: 125000,
        cdcCompatible: true,
      },
      {
        schemaName: 'public',
        tableName: 'orders',
        selected: false,
        hasPrimaryKey: true,
        primaryKeyColumns: ['order_id'],
        estimatedRowCount: 450000,
        cdcCompatible: true,
      },
      {
        schemaName: 'public',
        tableName: 'order_items',
        selected: false,
        hasPrimaryKey: true,
        primaryKeyColumns: ['order_id', 'item_id'],
        estimatedRowCount: 850000,
        cdcCompatible: true,
      },
      {
        schemaName: 'public',
        tableName: 'products',
        selected: false,
        hasPrimaryKey: true,
        primaryKeyColumns: ['product_id'],
        estimatedRowCount: 5000,
        cdcCompatible: true,
      },
      {
        schemaName: 'analytics',
        tableName: 'user_events',
        selected: false,
        hasPrimaryKey: false,
        primaryKeyColumns: [],
        estimatedRowCount: 2500000,
        cdcCompatible: false,
        incompatibilityReason: 'No primary key defined',
      },
      {
        schemaName: 'public',
        tableName: 'temp_data',
        selected: false,
        hasPrimaryKey: true,
        primaryKeyColumns: ['id'],
        estimatedRowCount: 100,
        cdcCompatible: false,
        incompatibilityReason: 'Temporary table - not recommended for CDC',
      },
    ];

    updateData({ tables: mockTables });
    setIsBrowsingTables(false);
  };

  const toggleTableSelection = (index: number) => {
    const updatedTables = [...data.tables];
    updatedTables[index].selected = !updatedTables[index].selected;
    updateData({ tables: updatedTables });
  };

  const selectedTables = data.tables.filter(t => t.selected);
  const canProceedFromTables = selectedTables.length > 0 && selectedTables.every(t => t.cdcCompatible);

  const stepLabels = [
    { num: 1, label: 'Connection' },
    { num: 2, label: 'Tables' },
    { num: 3, label: 'Kafka Config' },
    { num: 4, label: 'Debezium Config' },
    { num: 5, label: 'Review & Deploy' },
  ];

  const ModeIcon = mode === 'streaming' ? Zap : Clock;
  const modeLabel = mode === 'streaming' ? 'Streaming CDC' : 'Batch CDC';
  const modeDescription = mode === 'streaming'
    ? 'Real-time change data capture with Kafka and Flink'
    : 'Scheduled change data capture with periodic snapshots';

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ModeIcon className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">{modeLabel} Setup</h1>
          </div>
          <p className="text-muted-foreground text-lg">{modeDescription}</p>
          <Badge variant={mode === 'streaming' ? 'default' : 'secondary'} className="text-xs">
            Mode: {mode === 'streaming' ? 'Real-time Streaming' : 'Scheduled Batch'}
          </Badge>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {stepLabels.map((step, idx) => (
            <div key={step.num} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-semibold ${
                    currentStep >= step.num
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {currentStep > step.num ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                </div>
                <span
                  className={`text-xs font-medium hidden md:inline ${
                    currentStep >= step.num ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < stepLabels.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    currentStep > step.num ? 'bg-primary' : 'bg-muted-foreground/20'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Connection Details */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection
              </CardTitle>
              <CardDescription>
                Connect to your {connectorType} database with CDC permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Connection Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Production PostgreSQL CDC"
                    value={data.name}
                    onChange={(e) => updateData({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="database">Database Name *</Label>
                  <Input
                    id="database"
                    placeholder="e.g., production_db"
                    value={data.database}
                    onChange={(e) => updateData({ database: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description"
                  value={data.description}
                  onChange={(e) => updateData({ description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="host">Host *</Label>
                  <Input
                    id="host"
                    placeholder="e.g., db.company.com"
                    value={data.host}
                    onChange={(e) => updateData({ host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port *</Label>
                  <Input
                    id="port"
                    type="number"
                    value={data.port}
                    onChange={(e) => updateData({ port: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username (with CDC permissions) *</Label>
                  <Input
                    id="username"
                    placeholder="Database username"
                    value={data.username}
                    onChange={(e) => updateData({ username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Database password"
                    value={data.password}
                    onChange={(e) => updateData({ password: e.target.value })}
                  />
                </div>
              </div>

              {/* CDC Requirements Info */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  CDC Requirements for {connectorType}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  {connectorType === 'postgresql' && (
                    <>
                      <li>Logical replication must be enabled (wal_level = logical)</li>
                      <li>User must have REPLICATION permission</li>
                      <li>User must have SELECT permission on tables</li>
                      <li>Tables must have PRIMARY KEY defined</li>
                    </>
                  )}
                  {connectorType === 'mysql' && (
                    <>
                      <li>Binary logging must be enabled (log_bin = ON)</li>
                      <li>Binary log format must be ROW (binlog_format = ROW)</li>
                      <li>User must have REPLICATION SLAVE and REPLICATION CLIENT permissions</li>
                      <li>Tables must have PRIMARY KEY defined</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleTestConnection}
                  disabled={
                    !data.host || !data.database || !data.username || !data.password || isTestingConnection
                  }
                  variant="outline"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Test Connection & Verify CDC
                    </>
                  )}
                </Button>

                {connectionTestResult && (
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      connectionTestResult.success
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-red-500/10 text-red-600'
                    }`}
                  >
                    {connectionTestResult.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{connectionTestResult.message}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Table Selection */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="h-5 w-5" />
                Select Tables for CDC
              </CardTitle>
              <CardDescription>
                Choose tables to replicate via change data capture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.tables.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No tables discovered yet. Browse the database to see CDC-compatible tables.
                  </p>
                  <Button onClick={handleBrowseTables} disabled={isBrowsingTables}>
                    {isBrowsingTables ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking CDC Compatibility...
                      </>
                    ) : (
                      <>
                        <Table2 className="h-4 w-4 mr-2" />
                        Browse Tables
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      {selectedTables.length} of {data.tables.filter(t => t.cdcCompatible).length} CDC-compatible tables selected
                    </div>
                    <Button onClick={handleBrowseTables} variant="outline" size="sm">
                      Refresh Tables
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {data.tables.map((table, idx) => (
                      <Card
                        key={`${table.schemaName}.${table.tableName}`}
                        className={`${
                          table.selected ? 'border-primary ring-1 ring-primary/20' : ''
                        } ${!table.cdcCompatible ? 'opacity-60' : ''}`}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={table.selected}
                              onCheckedChange={() => toggleTableSelection(idx)}
                              disabled={!table.cdcCompatible}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {table.schemaName}.{table.tableName}
                                </h4>
                                {table.cdcCompatible ? (
                                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    CDC Ready
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Not Compatible
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {table.estimatedRowCount.toLocaleString()} rows
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {table.hasPrimaryKey ? (
                                  <>Primary Key: <span className="font-mono text-xs">{table.primaryKeyColumns.join(', ')}</span></>
                                ) : (
                                  <span className="text-amber-600">{table.incompatibilityReason}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Kafka Configuration */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Kafka Configuration
              </CardTitle>
              <CardDescription>
                Configure Kafka broker connection and topic settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="kafkaBootstrapServers">Kafka Bootstrap Servers *</Label>
                <Input
                  id="kafkaBootstrapServers"
                  placeholder="broker1:9092,broker2:9092,broker3:9092"
                  value={data.kafkaBootstrapServers}
                  onChange={(e) => updateData({ kafkaBootstrapServers: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of Kafka broker addresses
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="kafkaTopicPrefix">Topic Prefix *</Label>
                  <Input
                    id="kafkaTopicPrefix"
                    placeholder="cdc"
                    value={data.kafkaTopicPrefix}
                    onChange={(e) => updateData({ kafkaTopicPrefix: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Will create topics like: {data.kafkaTopicPrefix}.schema.table
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kafkaPartitions">Partitions</Label>
                  <Input
                    id="kafkaPartitions"
                    type="number"
                    value={data.kafkaPartitions}
                    onChange={(e) => updateData({ kafkaPartitions: parseInt(e.target.value) || 3 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of partitions per topic
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kafkaReplicationFactor">Replication Factor</Label>
                  <Input
                    id="kafkaReplicationFactor"
                    type="number"
                    value={data.kafkaReplicationFactor}
                    onChange={(e) => updateData({ kafkaReplicationFactor: parseInt(e.target.value) || 3 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Topic replication factor
                  </p>
                </div>
              </div>

              {/* Topic Preview */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Topics to be created:</h4>
                <div className="space-y-1">
                  {selectedTables.slice(0, 3).map((table) => (
                    <div key={`${table.schemaName}.${table.tableName}`} className="text-sm font-mono">
                      {data.kafkaTopicPrefix}.{table.schemaName}.{table.tableName}
                    </div>
                  ))}
                  {selectedTables.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {selectedTables.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Debezium Configuration */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Debezium Configuration
              </CardTitle>
              <CardDescription>
                Configure CDC behavior and snapshot settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Snapshot Mode</Label>
                <RadioGroup
                  value={data.debeziumSnapshotMode}
                  onValueChange={(value: any) => updateData({ debeziumSnapshotMode: value })}
                >
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="initial" className="mt-1" />
                      <div>
                        <div className="font-medium">Initial Snapshot</div>
                        <div className="text-sm text-muted-foreground">
                          Capture full snapshot of existing data, then start CDC
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="schema_only" className="mt-1" />
                      <div>
                        <div className="font-medium">Schema Only</div>
                        <div className="text-sm text-muted-foreground">
                          Only capture schema, skip existing data (changes only from now on)
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="never" className="mt-1" />
                      <div>
                        <div className="font-medium">Never</div>
                        <div className="text-sm text-muted-foreground">
                          Assume schema already exists, only capture new changes
                        </div>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="captureDeletes"
                  checked={data.debeziumCaptureDeletes}
                  onCheckedChange={(checked) => updateData({ debeziumCaptureDeletes: checked as boolean })}
                />
                <Label htmlFor="captureDeletes" className="font-normal cursor-pointer">
                  Capture DELETE operations (recommended for full audit trail)
                </Label>
              </div>

              {/* Batch Mode Specific Settings */}
              {mode === 'batch' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="batchInterval">Batch Interval</Label>
                    <Select
                      value={data.debeziumBatchInterval}
                      onValueChange={(value) => updateData({ debeziumBatchInterval: value })}
                    >
                      <SelectTrigger id="batchInterval">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5 minutes">Every 5 minutes</SelectItem>
                        <SelectItem value="15 minutes">Every 15 minutes</SelectItem>
                        <SelectItem value="30 minutes">Every 30 minutes</SelectItem>
                        <SelectItem value="1 hour">Every hour</SelectItem>
                        <SelectItem value="4 hours">Every 4 hours</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How often to capture and process changes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxBatchSize">Max Batch Size</Label>
                    <Input
                      id="maxBatchSize"
                      type="number"
                      value={data.debeziumMaxBatchSize}
                      onChange={(e) => updateData({ debeziumMaxBatchSize: parseInt(e.target.value) || 10000 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of changes to process in one batch
                    </p>
                  </div>
                </>
              )}

              {/* Streaming Mode Info */}
              {mode === 'streaming' && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    Streaming Mode Configuration
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Changes will be captured and processed in real-time with &lt; 1 second latency.
                    Flink will consume from Kafka topics and write to Iceberg tables continuously.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Review & Deploy */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Review & Deploy
              </CardTitle>
              <CardDescription>
                Review the CDC pipeline configuration before deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection Summary */}
              <div>
                <h3 className="font-semibold mb-3">Connection Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{data.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Database:</span>
                    <span className="ml-2 font-medium">{data.database}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Host:</span>
                    <span className="ml-2 font-medium">{data.host}:{data.port}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mode:</span>
                    <Badge variant={mode === 'streaming' ? 'default' : 'secondary'} className="ml-2">
                      {mode === 'streaming' ? 'Streaming' : 'Batch'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tables Summary */}
              <div>
                <h3 className="font-semibold mb-3">Tables ({selectedTables.length})</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTables.map((table) => (
                    <div
                      key={`${table.schemaName}.${table.tableName}`}
                      className="text-sm p-2 border rounded"
                    >
                      <span className="font-mono">{table.schemaName}.{table.tableName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline Architecture */}
              <div>
                <h3 className="font-semibold mb-3">Pipeline Architecture</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Database className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Source Database ({data.type})</div>
                      <div className="text-xs text-muted-foreground">{data.host}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Debezium Connector</div>
                      <div className="text-xs text-muted-foreground">
                        Mode: {data.debeziumSnapshotMode} snapshot
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Kafka Topics</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedTables.length} topics • {data.kafkaPartitions} partitions
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Activity className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {mode === 'streaming' ? 'Flink Streaming Job' : 'Spark Batch Job'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {mode === 'streaming' ? 'Real-time processing' : `Every ${data.debeziumBatchInterval}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Table2 className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Iceberg Tables</div>
                      <div className="text-xs text-muted-foreground">
                        Catalog: {data.targetCatalog}.{data.targetNamespace}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
              } else {
                router.back();
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? 'Back to Method Selection' : 'Previous Step'}
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={() => {
                if (currentStep === 1 && connectionTestResult?.success) {
                  setCurrentStep(2);
                  if (data.tables.length === 0) {
                    handleBrowseTables();
                  }
                } else if (currentStep === 2 && canProceedFromTables) {
                  setCurrentStep(3);
                } else if (currentStep === 3) {
                  setCurrentStep(4);
                } else if (currentStep === 4) {
                  setCurrentStep(5);
                }
              }}
              disabled={
                (currentStep === 1 && !connectionTestResult?.success) ||
                (currentStep === 2 && !canProceedFromTables)
              }
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                // Handle deployment
                alert(`Deploying ${mode} CDC pipeline with ${selectedTables.length} tables`);
                router.push('/manage/connections');
              }}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Deploy {mode === 'streaming' ? 'Streaming' : 'Batch'} CDC Pipeline
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
