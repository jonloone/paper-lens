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
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  AlertCircle,
  Clock,
  Table2,
  Zap,
  FileCode,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import type { DatabaseType, IngestionMethod } from '@/lib/types/source-connections';
import { TableBrowserWithMethodSelection, type TableConfigWithMethod } from '@/components/build/TableBrowserWithMethodSelection';

interface TableConfig extends TableConfigWithMethod {
  // TableConfig now extends TableConfigWithMethod which includes ingestionMethod
}

interface IncrementalSyncData {
  // Step 1: Connection Details
  name: string;
  description: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;

  // Step 2: Table Selection & Configuration
  tables: TableConfig[];

  // Step 3: Global Settings
  targetNamespace: string;
  targetCatalog: string;
  parallelJobs: number;
  retryAttempts: number;
}

export default function IncrementalSyncWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectorType = (searchParams?.get('connector') as DatabaseType) || 'postgresql';

  const [currentStep, setCurrentStep] = useState(1);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isBrowsingTables, setIsBrowsingTables] = useState(false);

  const [data, setData] = useState<IncrementalSyncData>({
    name: '',
    description: '',
    type: connectorType,
    host: '',
    port: connectorType === 'postgresql' ? 5432 : 3306,
    database: '',
    username: '',
    password: '',
    tables: [],
    targetNamespace: 'replicated',
    targetCatalog: 'iceberg',
    parallelJobs: 4,
    retryAttempts: 3,
  });

  const updateData = (updates: Partial<IncrementalSyncData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500));

    setConnectionTestResult({
      success: true,
      message: 'Successfully connected to database',
    });
    setIsTestingConnection(false);
  };

  const handleBrowseTables = async () => {
    setIsBrowsingTables(true);

    // Simulate table discovery with timestamp column detection
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockTables: TableConfig[] = [
      {
        schemaName: 'public',
        tableName: 'customers',
        selected: false,
        timestampColumn: 'updated_at',
        schedule: 'every_6h',
        watermarkOffset: '1 hour',
        detectedTimestampColumns: ['created_at', 'updated_at', 'last_modified'],
        estimatedRowCount: 125000,
        estimatedSizeGB: 0.5,
        ingestionMethod: 'incremental_query', // Default to incremental
        hasPrimaryKey: true,
        primaryKeyColumns: ['customer_id'],
        cdcCompatible: true,
      },
      {
        schemaName: 'public',
        tableName: 'orders',
        selected: false,
        timestampColumn: 'order_date',
        schedule: 'hourly',
        watermarkOffset: '30 minutes',
        detectedTimestampColumns: ['order_date', 'updated_at', 'shipped_at'],
        estimatedRowCount: 450000,
        estimatedSizeGB: 2.1,
        ingestionMethod: 'incremental_query',
        hasPrimaryKey: true,
        primaryKeyColumns: ['order_id'],
        cdcCompatible: true,
      },
      {
        schemaName: 'public',
        tableName: 'products',
        selected: false,
        timestampColumn: 'last_updated',
        schedule: 'daily',
        watermarkOffset: '2 hours',
        detectedTimestampColumns: ['created_at', 'last_updated'],
        estimatedRowCount: 5000,
        estimatedSizeGB: 0.02,
        ingestionMethod: 'incremental_query',
        hasPrimaryKey: true,
        primaryKeyColumns: ['product_id'],
        cdcCompatible: true,
      },
      {
        schemaName: 'analytics',
        tableName: 'user_events',
        selected: false,
        timestampColumn: 'event_timestamp',
        schedule: 'hourly',
        watermarkOffset: '15 minutes',
        detectedTimestampColumns: ['event_timestamp', 'processed_at'],
        estimatedRowCount: 2500000,
        estimatedSizeGB: 15.3,
        ingestionMethod: 'incremental_query',
        hasPrimaryKey: true,
        primaryKeyColumns: ['event_id'],
        cdcCompatible: true,
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

  const updateTableConfig = (index: number, updates: Partial<TableConfig>) => {
    const updatedTables = [...data.tables];
    updatedTables[index] = { ...updatedTables[index], ...updates };
    updateData({ tables: updatedTables });
  };

  const handleBulkMethodOverride = (method: IngestionMethod) => {
    const updatedTables = data.tables.map(table =>
      table.selected ? { ...table, ingestionMethod: method } : table
    );
    updateData({ tables: updatedTables });
  };

  const selectedTables = data.tables.filter(t => t.selected);
  const canProceedToReview = selectedTables.length > 0;

  const getScheduleLabel = (schedule: TableConfig['schedule']) => {
    const labels = {
      hourly: 'Every Hour',
      every_6h: 'Every 6 Hours',
      daily: 'Daily (midnight)',
      weekly: 'Weekly (Sunday)',
    };
    return labels[schedule];
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Incremental Sync Setup</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Configure timestamp-based incremental replication with Spark and Airflow
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4">
          {[
            { num: 1, label: 'Connection' },
            { num: 2, label: 'Tables & Config' },
            { num: 3, label: 'Review & Deploy' },
          ].map((step, idx) => (
            <div key={step.num} className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                    currentStep >= step.num
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {currentStep > step.num ? <CheckCircle2 className="h-5 w-5" /> : step.num}
                </div>
                <span
                  className={`text-sm font-medium ${
                    currentStep >= step.num ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < 2 && (
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
                Connection Details
              </CardTitle>
              <CardDescription>
                Configure connection to your {connectorType} database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Connection Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Production PostgreSQL"
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
                  placeholder="Optional description of this connection"
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
                  <Label htmlFor="username">Username *</Label>
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
                      <Zap className="h-4 w-4 mr-2" />
                      Test Connection
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

        {/* Step 2: Table Selection & Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="h-5 w-5" />
                  Select Tables to Sync
                </CardTitle>
                <CardDescription>
                  Choose tables and configure incremental sync settings for each
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.tables.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      No tables discovered yet. Browse the database to see available tables.
                    </p>
                    <Button onClick={handleBrowseTables} disabled={isBrowsingTables}>
                      {isBrowsingTables ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Browsing Tables...
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-end">
                      <Button onClick={handleBrowseTables} variant="outline" size="sm">
                        Refresh Tables
                      </Button>
                    </div>

                    <TableBrowserWithMethodSelection
                      tables={data.tables}
                      defaultMethod="incremental_query"
                      onTableUpdate={updateTableConfig}
                      onToggleSelection={toggleTableSelection}
                      onBulkMethodOverride={handleBulkMethodOverride}
                      showMethodRecommendations={true}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Review & Deploy */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Review Configuration
                </CardTitle>
                <CardDescription>
                  Review the Spark jobs and Airflow DAGs that will be created
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
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium">{data.type}</span>
                    </div>
                  </div>
                </div>

                {/* Selected Tables Summary */}
                <div>
                  <h3 className="font-semibold mb-3">Tables to Sync ({selectedTables.length})</h3>
                  <div className="space-y-2">
                    {selectedTables.map((table) => (
                      <div
                        key={`${table.schemaName}.${table.tableName}`}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {table.schemaName}.{table.tableName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Column: <span className="font-mono">{table.timestampColumn}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {getScheduleLabel(table.schedule)}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Offset: {table.watermarkOffset}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated Artifacts */}
                <div>
                  <h3 className="font-semibold mb-3">Generated Artifacts</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <FileCode className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-sm">
                          {selectedTables.length} Spark Incremental Job(s)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          PySpark jobs with watermark-based incremental loading
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-sm">Airflow DAG: {data.name.replace(/\s+/g, '_').toLowerCase()}_incremental_sync</div>
                        <div className="text-xs text-muted-foreground">
                          Scheduled orchestration for all tables
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Database className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-sm">
                          Iceberg Tables in {data.targetCatalog}.{data.targetNamespace}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Target tables for replicated data
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

          {currentStep < 3 ? (
            <Button
              onClick={() => {
                if (currentStep === 1 && connectionTestResult?.success) {
                  setCurrentStep(2);
                  if (data.tables.length === 0) {
                    handleBrowseTables();
                  }
                } else if (currentStep === 2 && canProceedToReview) {
                  setCurrentStep(3);
                }
              }}
              disabled={
                (currentStep === 1 && !connectionTestResult?.success) ||
                (currentStep === 2 && !canProceedToReview)
              }
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                // Handle deployment
                alert('Deployment would happen here - creating Spark jobs, Airflow DAG, and Iceberg tables');
                router.push('/manage/connections');
              }}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Deploy Incremental Sync
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
