'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  RefreshCw
} from 'lucide-react';

interface IngestionConfig {
  // File Details
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  
  // Database Details
  name?: string;
  schema?: string;
  table?: string;
  
  // Connection Details
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  sslEnabled?: boolean;
  
  // Ingest Details
  mode?: 'overwrite' | 'append' | 'upsert';
  schedule?: string;
  tags?: string[];
  domain?: string;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

export function MultiStepIngestionWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<IngestionConfig>({
    mode: 'append',
    sslEnabled: false,
    tags: []
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'failed' | null>(null);

  const steps: WizardStep[] = [
    {
      id: 'file',
      title: 'File Details',
      description: 'Upload or link to your data file',
      icon: FileText
    },
    {
      id: 'database',
      title: 'Database Details',
      description: 'Configure database and table settings',
      icon: Database
    },
    {
      id: 'connection',
      title: 'Connection Details',
      description: 'Set up database connection parameters',
      icon: Server
    },
    {
      id: 'ingest',
      title: 'Ingest Details',
      description: 'Configure how data will be ingested',
      icon: Settings
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setConnectionTestResult('success');
    setIsTestingConnection(false);
  };

  const handleIngest = () => {
    console.log('Starting ingestion with config:', config);
    // In production, this would trigger the actual ingestion process
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl">Provide details about your data</h2>
          <p className="text-muted-foreground">
            Follow the steps to configure your data ingestion pipeline
          </p>
        </div>
        
        {/* Progress Bar */}
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
              <div
                key={step.id}
                className="flex items-center flex-1"
              >
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
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Details Step */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <Button variant="outline" className="mb-2">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <p className="text-sm text-muted-foreground">
                  or drag and drop your file here
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
                <Label htmlFor="file-url">Public File URL</Label>
                <Input
                  id="file-url"
                  placeholder="https://example.com/data.csv"
                  value={config.fileUrl || ''}
                  onChange={(e) => setConfig({ ...config, fileUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>File Type</Label>
                <Select 
                  value={config.fileType} 
                  onValueChange={(value) => setConfig({ ...config, fileType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="parquet">Parquet</SelectItem>
                    <SelectItem value="avro">Avro</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.fileName && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Selected File</p>
                  <p className="text-sm text-muted-foreground">{config.fileName}</p>
                </div>
              )}
            </div>
          )}

          {/* Database Details Step */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="db-name">Name</Label>
                <Input
                  id="db-name"
                  placeholder="A readable name for the job"
                  value={config.name || ''}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schema">Schema</Label>
                  <Select 
                    value={config.schema} 
                    onValueChange={(value) => setConfig({ ...config, schema: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Search..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">public</SelectItem>
                      <SelectItem value="staging">staging</SelectItem>
                      <SelectItem value="raw">raw</SelectItem>
                      <SelectItem value="processed">processed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="table">Table</Label>
                  <Select 
                    value={config.table} 
                    onValueChange={(value) => setConfig({ ...config, table: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Search..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customers">customers</SelectItem>
                      <SelectItem value="orders">orders</SelectItem>
                      <SelectItem value="products">products</SelectItem>
                      <SelectItem value="transactions">transactions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-600">Schema Information</p>
                    <p className="text-muted-foreground mt-1">
                      The table will be created if it doesn\'t exist, or data will be appended/overwritten based on your mode selection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connection Details Step */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    placeholder="database.example.com"
                    value={config.host || ''}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    placeholder="5432"
                    value={config.port || ''}
                    onChange={(e) => setConfig({ ...config, port: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="db_user"
                  value={config.username || ''}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={config.password || ''}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                />
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

              <div className="pt-4 border-t">
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
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-600 font-medium">
                        Connection successful!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ingest Details Step */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ingest Mode</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'overwrite', label: 'Overwrite', description: 'Replace existing data' },
                    { value: 'append', label: 'Append', description: 'Add to existing data' },
                    { value: 'upsert', label: 'Upsert', description: 'Update or insert' }
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
                <Label htmlFor="schedule">Schedule</Label>
                <Select 
                  value={config.schedule} 
                  onValueChange={(value) => setConfig({ ...config, schedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Run Once</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom Cron</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Select 
                  value={config.domain} 
                  onValueChange={(value) => setConfig({ ...config, domain: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {['production', 'staging', 'test', 'critical', 'daily', 'batch'].map((tag) => (
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
                  <p>• Mode: {config.mode}</p>
                  <p>• Schedule: {config.schedule || 'Not set'}</p>
                  <p>• Target: {config.schema}.{config.table}</p>
                  <p>• Tags: {config.tags?.join(', ') || 'None'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          variant="outline"
          onClick={() => setCurrentStep(0)}
        >
          Change Type
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button onClick={handleIngest}>
            <Database className="h-4 w-4 mr-2" />
            Ingest
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}