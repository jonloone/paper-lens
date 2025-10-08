'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Database,
  Zap,
  GitBranch,
  Cloud,
  Globe,
  Activity,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  Server,
  Wifi
} from 'lucide-react';

interface Flow {
  id: string;
  name: string;
  type: 'streaming' | 'batch' | 'polling';
  source: string;
  destination: string;
  status: 'running' | 'backpressure' | 'stopped' | 'error';
  throughput?: string;
  latency?: string;
  lastUpdate?: Date;
}

interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  type: 'streaming' | 'batch' | 'polling';
  icon: React.ElementType;
}

export default function IngestionPage() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Mock data - in production, this would come from API
  const flowTemplates: FlowTemplate[] = [
    {
      id: 'kafka-iceberg',
      name: 'Kafka → Iceberg',
      description: 'Stream data from Kafka topics to Iceberg tables',
      type: 'streaming',
      icon: Zap
    },
    {
      id: 's3-iceberg',
      name: 'S3 → Iceberg',
      description: 'Batch load files from S3 buckets',
      type: 'batch',
      icon: Cloud
    },
    {
      id: 'api-iceberg',
      name: 'API → Iceberg',
      description: 'Poll REST APIs and store in Iceberg',
      type: 'polling',
      icon: Globe
    },
    {
      id: 'database-iceberg',
      name: 'Database → Iceberg',
      description: 'CDC from databases to Iceberg',
      type: 'streaming',
      icon: Database
    }
  ];
  
  const flows: Flow[] = [
    {
      id: '1',
      name: 'customer_events',
      type: 'streaming',
      source: 'Kafka: customer-events-topic',
      destination: 'Iceberg: customer.events',
      status: 'running',
      throughput: '1.2M/min',
      latency: '<100ms',
      lastUpdate: new Date(Date.now() - 60000)
    },
    {
      id: '2',
      name: 'product_updates',
      type: 'streaming',
      source: 'Kafka: product-topic',
      destination: 'Iceberg: product.updates',
      status: 'backpressure',
      throughput: '850K/min',
      latency: '2.3s',
      lastUpdate: new Date(Date.now() - 180000)
    },
    {
      id: '3',
      name: 'daily_inventory',
      type: 'batch',
      source: 'S3: s3://data-lake/inventory/',
      destination: 'Iceberg: inventory.daily',
      status: 'running',
      throughput: '250MB/min',
      lastUpdate: new Date(Date.now() - 900000)
    },
    {
      id: '4',
      name: 'weather_api',
      type: 'polling',
      source: 'API: weather.api.com',
      destination: 'Iceberg: external.weather',
      status: 'stopped',
      lastUpdate: new Date(Date.now() - 3600000)
    }
  ];
  
  const getStatusIndicator = (status: Flow['status']) => {
    switch (status) {
      case 'running':
        return <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />;
      case 'backpressure':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'stopped':
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
      case 'error':
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
    }
  };
  
  const getTypeIcon = (type: Flow['type']) => {
    switch (type) {
      case 'streaming':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'batch':
        return <Database className="h-4 w-4 text-green-500" />;
      case 'polling':
        return <Wifi className="h-4 w-4 text-orange-500" />;
    }
  };
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // In production, this would open a configuration modal
    console.log('Selected template:', templateId);
    
    // Mock creating a flow from template
    setTimeout(() => {
      setShowTemplates(false);
      setSelectedTemplate(null);
    }, 1000);
  };
  
  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Ingestion</h1>
          <p className="text-muted-foreground">Manage NiFi flows for data ingestion</p>
        </div>
        <Button onClick={() => setShowTemplates(!showTemplates)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ingestion
        </Button>
      </div>
      
      {/* Template Selection */}
      {showTemplates && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose an Ingestion Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {flowTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={cn(
                      "p-4 border rounded-lg text-left transition-all hover:border-primary hover:bg-muted/50",
                      selectedTemplate === template.id && "border-primary bg-muted"
                    )}
                  >
                    <Icon className="h-8 w-8 mb-3 text-primary" />
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        {template.type}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* 20% Case - Complex Flows */}
            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" size="sm" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open NiFi Canvas for Complex Flows
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Running Flows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Flows</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">
                  2.3M records/min
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Server className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  4.2GB/hour
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIndicator(flow.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{flow.name}</span>
                      {getTypeIcon(flow.type)}
                      <Badge 
                        variant={flow.status === 'running' ? 'default' : 
                                flow.status === 'backpressure' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {flow.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-mono text-xs">{flow.source}</span>
                      <span className="mx-2">→</span>
                      <span className="font-mono text-xs">{flow.destination}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {flow.throughput && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {flow.throughput}
                        </span>
                      )}
                      {flow.latency && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {flow.latency}
                        </span>
                      )}
                      {flow.lastUpdate && (
                        <span>
                          Updated {Math.round((Date.now() - flow.lastUpdate.getTime()) / 60000)}m ago
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {flow.status === 'backpressure' && (
                    <Button variant="outline" size="sm">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Investigate
                    </Button>
                  )}
                  {flow.status === 'running' && (
                    <Button variant="ghost" size="sm">
                      View Metrics
                    </Button>
                  )}
                  {flow.status === 'stopped' && (
                    <Button variant="outline" size="sm">
                      Start Flow
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Ingestion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">8</div>
            <p className="text-sm text-muted-foreground">Active Flows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">2.3M</div>
            <p className="text-sm text-muted-foreground">Records/min</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">98ms</div>
            <p className="text-sm text-muted-foreground">Avg Latency</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">0</div>
            <p className="text-sm text-muted-foreground">Failed Flows</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}