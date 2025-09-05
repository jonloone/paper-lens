'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Database, 
  FileText, 
  Cloud, 
  GitBranch, 
  Check, 
  ChevronRight,
  AlertCircle,
  Sparkles,
  Play,
  Settings,
  Shield
} from "lucide-react";

interface WorkflowStep {
  id: number;
  name: string;
  status: 'pending' | 'active' | 'completed';
}

export function DataIngestionWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [connectionType, setConnectionType] = useState('database');
  const [connectionConfig, setConnectionConfig] = useState({
    host: '',
    port: '',
    database: '',
    username: '',
    password: ''
  });
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [ingestionSettings, setIngestionSettings] = useState({
    mode: 'incremental',
    schedule: 'daily',
    partitioning: true,
    compression: 'snappy'
  });

  const steps: WorkflowStep[] = [
    { id: 1, name: 'Source Configuration', status: currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'pending' },
    { id: 2, name: 'Schema Selection', status: currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'pending' },
    { id: 3, name: 'Ingestion Settings', status: currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'pending' },
    { id: 4, name: 'Validation & Deploy', status: currentStep === 4 ? 'active' : 'pending' }
  ];

  const connectionTypes = [
    { value: 'database', label: 'Database', icon: Database, description: 'PostgreSQL, MySQL, Oracle' },
    { value: 'file', label: 'File', icon: FileText, description: 'CSV, JSON, Parquet' },
    { value: 'lakehouse', label: 'Lakehouse', icon: Cloud, description: 'Databricks, Snowflake' },
    { value: 'mirror', label: 'Mirror', icon: GitBranch, description: 'CDC, Streaming' }
  ];

  const mockTables = [
    { name: 'customers', rows: '1.2M', size: '450MB', lastUpdated: '2 hours ago' },
    { name: 'transactions', rows: '45.3M', size: '12.3GB', lastUpdated: '5 mins ago' },
    { name: 'products', rows: '125K', size: '89MB', lastUpdated: '1 day ago' },
    { name: 'inventory', rows: '340K', size: '234MB', lastUpdated: '30 mins ago' }
  ];

  const handleTestConnection = () => {
    // Simulate connection test
    console.log('Testing connection...');
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Connection Type Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block text-gray-300">
                Connection Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {connectionTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setConnectionType(type.value)}
                    className={`p-4 rounded-lg border transition-all ${
                      connectionType === type.value 
                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                        : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <type.icon className="h-5 w-5 mb-2" />
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs mt-1 opacity-70">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Connection Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Host</Label>
                  <Input 
                    placeholder="localhost" 
                    className="bg-gray-800 border-gray-700 text-white"
                    value={connectionConfig.host}
                    onChange={(e) => setConnectionConfig({...connectionConfig, host: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input 
                    placeholder="5432" 
                    className="bg-gray-800 border-gray-700 text-white"
                    value={connectionConfig.port}
                    onChange={(e) => setConnectionConfig({...connectionConfig, port: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Database</Label>
                  <Input 
                    placeholder="production_db" 
                    className="bg-gray-800 border-gray-700 text-white"
                    value={connectionConfig.database}
                    onChange={(e) => setConnectionConfig({...connectionConfig, database: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input 
                    placeholder="admin" 
                    className="bg-gray-800 border-gray-700 text-white"
                    value={connectionConfig.username}
                    onChange={(e) => setConnectionConfig({...connectionConfig, username: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="bg-gray-800 border-gray-700 text-white"
                    value={connectionConfig.password}
                    onChange={(e) => setConnectionConfig({...connectionConfig, password: e.target.value})}
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                className="mt-2"
              >
                Test Connection
              </Button>
            </div>

            {/* Intelligent Recommendations */}
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">
                      <strong>Intelligent Recommendation:</strong> Based on your organization's patterns, 
                      we recommend using incremental ingestion with daily updates for this data source.
                    </p>
                    <p className="text-xs text-gray-400">
                      Similar pipelines in your organization achieve 99.8% reliability with this configuration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-3 block text-gray-300">
                Select Tables to Ingest
              </label>
              <div className="space-y-2">
                {mockTables.map((table) => (
                  <div 
                    key={table.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800/70"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-600"
                        checked={selectedTables.includes(table.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTables([...selectedTables, table.name]);
                          } else {
                            setSelectedTables(selectedTables.filter(t => t !== table.name));
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium text-white">{table.name}</div>
                        <div className="text-xs text-gray-400">
                          {table.rows} rows • {table.size}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Updated {table.lastUpdated}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schema Analysis */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">
                  Schema Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Primary Keys Detected</span>
                  <Badge variant="default">4 of 4</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Foreign Key Relationships</span>
                  <Badge variant="secondary">7 found</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Estimated Ingestion Time</span>
                  <Badge variant="outline">~15 minutes</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Ingestion Mode</Label>
                <Select 
                  value={ingestionSettings.mode}
                  onValueChange={(value) => setIngestionSettings({...ingestionSettings, mode: value})}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incremental">Incremental</SelectItem>
                    <SelectItem value="full">Full Refresh</SelectItem>
                    <SelectItem value="append">Append Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Schedule</Label>
                <Select 
                  value={ingestionSettings.schedule}
                  onValueChange={(value) => setIngestionSettings({...ingestionSettings, schedule: value})}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="partitioning">Enable Partitioning</Label>
                <Switch 
                  id="partitioning"
                  checked={ingestionSettings.partitioning}
                  onCheckedChange={(checked) => setIngestionSettings({...ingestionSettings, partitioning: checked})}
                />
              </div>

              <div>
                <Label>Compression</Label>
                <Select 
                  value={ingestionSettings.compression}
                  onValueChange={(value) => setIngestionSettings({...ingestionSettings, compression: value})}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="snappy">Snappy</SelectItem>
                    <SelectItem value="gzip">GZIP</SelectItem>
                    <SelectItem value="lz4">LZ4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Performance Optimization */}
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300 font-medium mb-2">
                      Optimization Applied
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Auto-scaling enabled for high-volume periods</li>
                      <li>• Parallel processing across 4 threads</li>
                      <li>• Smart retry logic for network failures</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Validation Summary */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">
                  Validation Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-300">Connection verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-300">Schema compatibility checked</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-300">Security policies applied</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-300">Optional: Data quality rules pending</span>
                </div>
              </CardContent>
            </Card>

            {/* Deployment Options */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">
                Deployment Options
              </label>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="default">
                  <Play className="h-4 w-4 mr-2" />
                  Deploy to Production
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Deploy to Staging First
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  Save as Template
                </Button>
              </div>
            </div>

            {/* Final Configuration */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pipeline Name</span>
                    <span className="text-white">prod_customer_ingestion</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tables</span>
                    <span className="text-white">{selectedTables.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Schedule</span>
                    <span className="text-white">{ingestionSettings.schedule}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated Cost</span>
                    <span className="text-white">$12.50/day</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-medium
                ${step.status === 'completed' ? 'bg-green-500 text-white' : 
                  step.status === 'active' ? 'bg-blue-500 text-white' : 
                  'bg-gray-700 text-gray-400'}
              `}>
                {step.status === 'completed' ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <span className={`text-sm ${
                step.status === 'active' ? 'text-white' : 'text-gray-400'
              }`}>
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            {steps[currentStep - 1].name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePreviousStep}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        <Button 
          onClick={handleNextStep}
          disabled={currentStep === 4}
        >
          {currentStep === 4 ? 'Deploy' : 'Next'}
        </Button>
      </div>
    </div>
  );
}