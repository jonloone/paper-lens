'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Database,
  Settings,
  Check,
  AlertCircle,
  FileText,
  Globe,
  Server,
  Shield,
  Zap,
  Clock,
  Tag,
  RefreshCw,
  Cloud,
  Link,
  Key,
  Hash,
  ArrowLeft
} from 'lucide-react';
import { SourceTypeSelector, type SourceType } from './SourceTypeSelector';

interface IngestionConfig {
  // Source Type
  sourceType?: string;
  sourceCategory?: 'federated' | 'lakehouse';
  
  // Database Connection
  dbType?: string;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  database?: string;
  schema?: string;
  table?: string;
  query?: string;
  sslEnabled?: boolean;
  
  // File Details
  fileName?: string;
  fileUrl?: string;
  fileFormat?: string;
  delimiter?: string;
  hasHeaders?: boolean;
  
  // API Details
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  authType?: string;
  apiKey?: string;
  
  // Streaming Details
  brokerType?: string;
  brokers?: string;
  topic?: string;
  consumerGroup?: string;
  offset?: string;
  
  // S3/Cloud Storage
  bucket?: string;
  prefix?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  
  // Ingest Settings
  targetSchema?: string;
  targetTable?: string;
  mode?: 'overwrite' | 'append' | 'upsert' | 'merge';
  schedule?: string;
  tags?: string[];
  transformations?: string;
}

export function EnhancedIngestionWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSourceType, setSelectedSourceType] = useState<SourceType | null>(null);
  const [config, setConfig] = useState<IngestionConfig>({
    mode: 'append',
    sslEnabled: false,
    hasHeaders: true,
    tags: []
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'failed' | null>(null);

  // Dynamic steps based on source type
  const steps = useMemo(() => {
    if (!selectedSourceType) {
      return [{
        id: 'source',
        title: 'Select Source',
        description: 'Choose your data source type',
        icon: Database
      }];
    }

    const baseSteps = [{
      id: 'source',
      title: 'Select Source',
      description: 'Choose your data source type',
      icon: Database
    }];

    switch (selectedSourceType.id) {
      case 'database':
        return [
          ...baseSteps,
          {
            id: 'connection',
            title: 'Connection Details',
            description: 'Configure database connection',
            icon: Server
          },
          {
            id: 'schema',
            title: 'Select Data',
            description: 'Choose tables or write query',
            icon: Database
          },
          {
            id: 'settings',
            title: 'Ingestion Settings',
            description: 'Configure how data will be ingested',
            icon: Settings
          }
        ];
      
      case 'file':
        return [
          ...baseSteps,
          {
            id: 'upload',
            title: 'File Upload',
            description: 'Upload or link your file',
            icon: Upload
          },
          {
            id: 'preview',
            title: 'Schema Preview',
            description: 'Review detected schema',
            icon: FileText
          },
          {
            id: 'settings',
            title: 'Ingestion Settings',
            description: 'Configure how data will be ingested',
            icon: Settings
          }
        ];
      
      case 'api':
        return [
          ...baseSteps,
          {
            id: 'endpoint',
            title: 'API Configuration',
            description: 'Set up API endpoint',
            icon: Globe
          },
          {
            id: 'mapping',
            title: 'Response Mapping',
            description: 'Map API response to schema',
            icon: Hash
          },
          {
            id: 'settings',
            title: 'Ingestion Settings',
            description: 'Configure how data will be ingested',
            icon: Settings
          }
        ];
      
      case 'streaming':
        return [
          ...baseSteps,
          {
            id: 'stream',
            title: 'Stream Configuration',
            description: 'Configure stream connection',
            icon: Zap
          },
          {
            id: 'schema',
            title: 'Schema Registry',
            description: 'Define or detect schema',
            icon: Database
          },
          {
            id: 'settings',
            title: 'Ingestion Settings',
            description: 'Configure how data will be ingested',
            icon: Settings
          }
        ];
      
      case 's3':
        return [
          ...baseSteps,
          {
            id: 'bucket',
            title: 'Bucket Configuration',
            description: 'Configure S3 access',
            icon: Cloud
          },
          {
            id: 'files',
            title: 'File Selection',
            description: 'Choose files to ingest',
            icon: FileText
          },
          {
            id: 'settings',
            title: 'Ingestion Settings',
            description: 'Configure how data will be ingested',
            icon: Settings
          }
        ];
      
      default:
        return baseSteps;
    }
  }, [selectedSourceType]);

  const handleSourceSelect = (sourceType: SourceType) => {
    setSelectedSourceType(sourceType);
    setConfig({
      ...config,
      sourceType: sourceType.id,
      sourceCategory: sourceType.category
    });
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 1) {
        setSelectedSourceType(null);
      }
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setConnectionTestResult('success');
    setIsTestingConnection(false);
  };

  const handleIngest = () => {
    console.log('Starting ingestion with config:', config);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const renderStepContent = () => {
    // Source Selection Step
    if (currentStep === 0) {
      return (
        <SourceTypeSelector
          onSelect={handleSourceSelect}
          selectedType={selectedSourceType?.id}
        />
      );
    }

    // Dynamic content based on source type and step
    if (!selectedSourceType) return null;

    const stepId = currentStepData.id;

    // Database Steps
    if (selectedSourceType.id === 'database') {
      if (stepId === 'connection') {
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Database Type</Label>
              <Select 
                value={config.dbType} 
                onValueChange={(value) => setConfig({ ...config, dbType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="sqlserver">SQL Server</SelectItem>
                  <SelectItem value="oracle">Oracle</SelectItem>
                  <SelectItem value="mongodb">MongoDB</SelectItem>
                  <SelectItem value="cassandra">Cassandra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Host</Label>
                <Input
                  placeholder="database.example.com"
                  value={config.host || ''}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  placeholder="5432"
                  value={config.port || ''}
                  onChange={(e) => setConfig({ ...config, port: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Database Name</Label>
              <Input
                placeholder="my_database"
                value={config.database || ''}
                onChange={(e) => setConfig({ ...config, database: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  placeholder="db_user"
                  value={config.username || ''}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={config.password || ''}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ssl"
                checked={config.sslEnabled}
                onChange={(e) => setConfig({ ...config, sslEnabled: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="ssl" className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4" />
                Enable SSL/TLS encryption
              </Label>
            </div>

            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              variant="outline"
              className="w-full"
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            {connectionTestResult === 'success' && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600 font-medium">
                    Connection successful! Found 24 tables.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      }

      if (stepId === 'schema') {
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data Selection Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`p-3 rounded-lg border text-left ${
                    config.query ? 'border-muted' : 'border-primary bg-primary/10'
                  }`}
                  onClick={() => setConfig({ ...config, query: undefined })}
                >
                  <p className="font-medium text-sm">Select Table</p>
                  <p className="text-xs text-muted-foreground">Choose from existing tables</p>
                </button>
                <button
                  className={`p-3 rounded-lg border text-left ${
                    config.query ? 'border-primary bg-primary/10' : 'border-muted'
                  }`}
                  onClick={() => setConfig({ ...config, query: 'SELECT * FROM ' })}
                >
                  <p className="font-medium text-sm">Custom Query</p>
                  <p className="text-xs text-muted-foreground">Write SQL query</p>
                </button>
              </div>
            </div>

            {!config.query ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Schema</Label>
                    <Select 
                      value={config.schema} 
                      onValueChange={(value) => setConfig({ ...config, schema: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select schema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">public</SelectItem>
                        <SelectItem value="staging">staging</SelectItem>
                        <SelectItem value="raw">raw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Table</Label>
                    <Select 
                      value={config.table} 
                      onValueChange={(value) => setConfig({ ...config, table: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customers">customers</SelectItem>
                        <SelectItem value="orders">orders</SelectItem>
                        <SelectItem value="products">products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>SQL Query</Label>
                <Textarea
                  placeholder="SELECT * FROM schema.table WHERE ..."
                  value={config.query || ''}
                  onChange={(e) => setConfig({ ...config, query: e.target.value })}
                  className="font-mono text-sm h-32"
                />
              </div>
            )}
          </div>
        );
      }
    }

    // File Upload Steps
    if (selectedSourceType.id === 'file') {
      if (stepId === 'upload') {
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <Button variant="outline" className="mb-2">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <p className="text-sm text-muted-foreground">
                or drag and drop your file here
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports: CSV, JSON, Parquet, Excel, Avro
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or provide a URL
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>File URL</Label>
              <Input
                placeholder="https://example.com/data.csv"
                value={config.fileUrl || ''}
                onChange={(e) => setConfig({ ...config, fileUrl: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>File Format</Label>
                <Select 
                  value={config.fileFormat} 
                  onValueChange={(value) => setConfig({ ...config, fileFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="parquet">Parquet</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="avro">Avro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.fileFormat === 'csv' && (
                <div className="space-y-2">
                  <Label>Delimiter</Label>
                  <Select 
                    value={config.delimiter || ','} 
                    onValueChange={(value) => setConfig({ ...config, delimiter: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Comma (,)</SelectItem>
                      <SelectItem value=";">Semicolon (;)</SelectItem>
                      <SelectItem value="\t">Tab</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="headers"
                checked={config.hasHeaders}
                onChange={(e) => setConfig({ ...config, hasHeaders: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="headers" className="cursor-pointer">
                First row contains headers
              </Label>
            </div>
          </div>
        );
      }

      if (stepId === 'preview') {
        return (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Detected Schema</p>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <span className="text-muted-foreground">customer_id</span>
                  <span>INTEGER</span>
                  <Badge variant="outline" className="text-xs">Primary Key</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <span className="text-muted-foreground">name</span>
                  <span>VARCHAR(255)</span>
                  <Badge variant="outline" className="text-xs">Not Null</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <span className="text-muted-foreground">email</span>
                  <span>VARCHAR(255)</span>
                  <Badge variant="outline" className="text-xs">Unique</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <span className="text-muted-foreground">created_at</span>
                  <span>TIMESTAMP</span>
                  <span></span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-600">Preview Data</p>
                  <p className="text-muted-foreground mt-1">
                    Showing first 5 rows of 12,456 total rows
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">customer_id</th>
                    <th className="text-left pb-2 px-4">name</th>
                    <th className="text-left pb-2 px-4">email</th>
                    <th className="text-left pb-2 px-4">created_at</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className="border-b">
                      <td className="py-2">{1000 + row}</td>
                      <td className="py-2 px-4">Customer {row}</td>
                      <td className="py-2 px-4">customer{row}@example.com</td>
                      <td className="py-2 px-4">2025-01-0{row}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
    }

    // Common Settings Step (appears for all source types)
    if (stepId === 'settings') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Schema</Label>
              <Input
                placeholder="staging"
                value={config.targetSchema || ''}
                onChange={(e) => setConfig({ ...config, targetSchema: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Table</Label>
              <Input
                placeholder="customers_import"
                value={config.targetTable || ''}
                onChange={(e) => setConfig({ ...config, targetTable: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ingestion Mode</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'overwrite', label: 'Overwrite', description: 'Replace all data' },
                { value: 'append', label: 'Append', description: 'Add new rows' },
                { value: 'upsert', label: 'Upsert', description: 'Update or insert' },
                { value: 'merge', label: 'Merge', description: 'CDC merge' }
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setConfig({ ...config, mode: mode.value as any })}
                  className={`
                    p-3 rounded-lg border text-left transition-colors
                    ${config.mode === mode.value 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                    }
                  `}
                >
                  <p className="font-medium text-sm">{mode.label}</p>
                  <p className="text-xs text-muted-foreground">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Schedule</Label>
            <Select 
              value={config.schedule} 
              onValueChange={(value) => setConfig({ ...config, schedule: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Run Once</SelectItem>
                <SelectItem value="@hourly">Hourly</SelectItem>
                <SelectItem value="@daily">Daily</SelectItem>
                <SelectItem value="@weekly">Weekly</SelectItem>
                <SelectItem value="@monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom Cron</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {['production', 'staging', 'test', 'critical', 'daily', 'batch', 'streaming'].map((tag) => (
                <Badge
                  key={tag}
                  variant={config.tags?.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const tags = config.tags || [];
                    if (tags.includes(tag)) {
                      setConfig({ ...config, tags: tags.filter(t => t !== tag) });
                    } else {
                      setConfig({ ...config, tags: [...tags, tag] });
                    }
                  }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Configuration Summary</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Source: {selectedSourceType?.label} ({config.sourceCategory})</p>
              <p>• Target: {config.targetSchema || 'default'}.{config.targetTable || 'new_table'}</p>
              <p>• Mode: {config.mode}</p>
              <p>• Schedule: {config.schedule || 'On-demand'}</p>
              <p>• Tags: {config.tags?.join(', ') || 'None'}</p>
            </div>
          </div>
        </div>
      );
    }

    return <div>Step content not implemented</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress - only show if source is selected */}
      {selectedSourceType && (
        <>
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentStep(0);
                  setSelectedSourceType(null);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Change Source Type
              </Button>
            )}
            <Badge variant="outline">
              {selectedSourceType.label} ({selectedSourceType.category})
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${isActive ? 'bg-primary text-primary-foreground' : ''}
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isActive ? '' : 'text-muted-foreground'}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      flex-1 h-[2px] mx-4
                      ${index < currentStep ? 'bg-green-500' : 'bg-muted'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Step Content */}
      {currentStep === 0 ? (
        renderStepContent()
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{currentStepData.title}</CardTitle>
            <CardDescription>{currentStepData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons - only show if past source selection */}
      {currentStep > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={handleIngest}>
              <Database className="h-4 w-4 mr-2" />
              Start Ingestion
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}