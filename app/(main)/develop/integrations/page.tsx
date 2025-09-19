'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Database,
  Cloud,
  Zap,
  Globe,
  Settings,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  Eye,
  RefreshCw,
  Activity,
  TrendingUp,
  AlertTriangle,
  Server,
  Wifi,
  Shield,
  Key,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Connector {
  id: string;
  name: string;
  type: string;
  category: 'database' | 'cloud' | 'streaming' | 'api';
  status: 'connected' | 'error' | 'disconnected' | 'testing';
  lastSync: Date;
  recordsProcessed: number;
  throughput: string;
  errorRate: number;
  icon: React.ElementType;
  description: string;
  config?: any;
}

const connectorTemplates = {
  databases: [
    { id: 'postgresql', name: 'PostgreSQL', icon: Database, description: 'Connect to PostgreSQL database' },
    { id: 'mysql', name: 'MySQL', icon: Database, description: 'Connect to MySQL database' },
    { id: 'mongodb', name: 'MongoDB', icon: Database, description: 'Connect to MongoDB collection' },
    { id: 'cassandra', name: 'Cassandra', icon: Database, description: 'Connect to Cassandra cluster' }
  ],
  cloud: [
    { id: 's3', name: 'Amazon S3', icon: Cloud, description: 'Connect to S3 buckets' },
    { id: 'gcs', name: 'Google Cloud Storage', icon: Cloud, description: 'Connect to GCS buckets' },
    { id: 'azure-blob', name: 'Azure Blob Storage', icon: Cloud, description: 'Connect to Azure containers' },
    { id: 'snowflake', name: 'Snowflake', icon: Database, description: 'Connect to Snowflake warehouse' }
  ],
  streaming: [
    { id: 'kafka', name: 'Apache Kafka', icon: Zap, description: 'Connect to Kafka topics' },
    { id: 'kinesis', name: 'AWS Kinesis', icon: Zap, description: 'Connect to Kinesis streams' },
    { id: 'pubsub', name: 'Google Pub/Sub', icon: Zap, description: 'Connect to Pub/Sub topics' },
    { id: 'eventhubs', name: 'Azure Event Hubs', icon: Zap, description: 'Connect to Event Hubs' }
  ],
  apis: [
    { id: 'rest', name: 'REST API', icon: Globe, description: 'Connect to REST endpoints' },
    { id: 'graphql', name: 'GraphQL', icon: Globe, description: 'Connect to GraphQL APIs' },
    { id: 'webhook', name: 'Webhook', icon: Globe, description: 'Receive webhook events' },
    { id: 'salesforce', name: 'Salesforce', icon: Globe, description: 'Connect to Salesforce API' }
  ]
};

export default function IntegrationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [showNewConnector, setShowNewConnector] = useState(false);

  // Mock existing connectors
  const connectors: Connector[] = [
    {
      id: 'conn1',
      name: 'Production PostgreSQL',
      type: 'PostgreSQL',
      category: 'database',
      status: 'connected',
      lastSync: new Date(Date.now() - 300000), // 5 min ago
      recordsProcessed: 1234567,
      throughput: '2.3k/sec',
      errorRate: 0.02,
      icon: Database,
      description: 'Main production database with customer and order data'
    },
    {
      id: 'conn2', 
      name: 'Analytics S3 Bucket',
      type: 'Amazon S3',
      category: 'cloud',
      status: 'connected',
      lastSync: new Date(Date.now() - 1800000), // 30 min ago
      recordsProcessed: 892345,
      throughput: '15MB/min',
      errorRate: 0,
      icon: Cloud,
      description: 'S3 bucket containing analytics exports and logs'
    },
    {
      id: 'conn3',
      name: 'Events Kafka Topic',
      type: 'Apache Kafka',
      category: 'streaming', 
      status: 'error',
      lastSync: new Date(Date.now() - 3600000), // 1 hour ago
      recordsProcessed: 2567891,
      throughput: '0/sec',
      errorRate: 15.3,
      icon: Zap,
      description: 'Real-time user events and application logs'
    },
    {
      id: 'conn4',
      name: 'Salesforce API',
      type: 'REST API',
      category: 'api',
      status: 'connected',
      lastSync: new Date(Date.now() - 600000), // 10 min ago
      recordsProcessed: 45789,
      throughput: '120/min',
      errorRate: 1.2,
      icon: Globe,
      description: 'CRM data synchronization with Salesforce'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'testing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'error': return 'destructive';
      case 'disconnected': return 'secondary';
      case 'testing': return 'outline';
      default: return 'outline';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/develop')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Develop
            </Button>
            
            <div className="h-4 w-px bg-border" />
            
            <div>
              <h1 className="text-xl font-semibold">Integrations</h1>
              <p className="text-sm text-muted-foreground">Connection management and MCP setup</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync All
            </Button>
            <Button 
              size="sm" 
              className="gap-2"
              onClick={() => setShowNewConnector(true)}
            >
              <Plus className="h-4 w-4" />
              Add Connection
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="connectors" className="gap-2">
              <Database className="h-4 w-4" />
              Active Connections
              <Badge variant="secondary" className="text-xs">
                {connectors.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 space-y-6">
            {/* System Health */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{connectors.length}</p>
                      <p className="text-xs text-muted-foreground">Total Connections</p>
                    </div>
                    <Database className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {connectors.filter(c => c.status === 'connected').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Healthy</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {connectors.filter(c => c.status === 'error').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Errors</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {formatNumber(connectors.reduce((sum, c) => sum + c.recordsProcessed, 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">Records Today</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest connection events and status changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'error', message: 'Events Kafka Topic connection failed', time: '5m ago', connector: 'Events Kafka Topic' },
                    { type: 'success', message: 'Production PostgreSQL sync completed', time: '12m ago', connector: 'Production PostgreSQL' },
                    { type: 'info', message: 'Salesforce API rate limit reset', time: '25m ago', connector: 'Salesforce API' },
                    { type: 'success', message: 'Analytics S3 Bucket new data detected', time: '1h ago', connector: 'Analytics S3 Bucket' }
                  ].map((event, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-3 border rounded-lg">
                      <div className={cn(
                        "h-2 w-2 rounded-full mt-2",
                        event.type === 'error' ? 'bg-red-500' :
                        event.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.message}</p>
                        <p className="text-xs text-muted-foreground">{event.connector} • {event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connectors" className="flex-1 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {connectors.map((connector) => {
                const Icon = connector.icon;
                return (
                  <Card key={connector.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{connector.name}</CardTitle>
                            <CardDescription className="text-xs">{connector.type}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(connector.status)}
                          <Badge variant={getStatusBadgeVariant(connector.status)} className="text-xs">
                            {connector.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{connector.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Records Processed</p>
                          <p className="text-sm font-medium">{formatNumber(connector.recordsProcessed)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Throughput</p>
                          <p className="text-sm font-medium">{connector.throughput}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Error Rate</p>
                          <p className={cn(
                            "text-sm font-medium",
                            connector.errorRate > 5 ? "text-red-600" : 
                            connector.errorRate > 1 ? "text-amber-600" : "text-green-600"
                          )}>
                            {connector.errorRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Sync</p>
                          <p className="text-sm font-medium">{formatTimeAgo(connector.lastSync)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Settings className="h-3 w-3" />
                          Configure
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Play className="h-3 w-3" />
                          Test
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Logs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {Object.entries(connectorTemplates).map(([category, templates]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center gap-2">
                      {category === 'database' && <Database className="h-5 w-5" />}
                      {category === 'cloud' && <Cloud className="h-5 w-5" />}
                      {category === 'streaming' && <Zap className="h-5 w-5" />}
                      {category === 'apis' && <Globe className="h-5 w-5" />}
                      {category.replace('s', '') + (category === 'apis' ? 's' : 's')}
                    </CardTitle>
                    <CardDescription>
                      Connect to {category === 'database' ? 'databases' : category} services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {templates.map((template) => {
                        const Icon = template.icon;
                        return (
                          <Card 
                            key={template.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors p-4"
                            onClick={() => {
                              // TODO: Open connection configuration for this template
                              console.log('Configure', template.name);
                            }}
                          >
                            <div className="text-center space-y-3">
                              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mx-auto">
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{template.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {template.description}
                                </p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Connection Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Connection Health</CardTitle>
                  <CardDescription>Real-time connection status monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {connectors.map((connector) => (
                      <div key={connector.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(connector.status)}
                          <span className="text-sm font-medium">{connector.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{connector.throughput}</span>
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            connector.errorRate > 5 ? "text-red-600 border-red-200" :
                            connector.errorRate > 1 ? "text-amber-600 border-amber-200" :
                            "text-green-600 border-green-200"
                          )}>
                            {connector.errorRate}% errors
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* MCP Server Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">MCP Server Status</CardTitle>
                  <CardDescription>Connection to MCP servers for intelligence</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'DataHub MCP', status: 'connected', latency: '12ms' },
                      { name: 'Airflow MCP', status: 'connected', latency: '8ms' },
                      { name: 'Kafka MCP', status: 'error', latency: '--' },
                      { name: 'Database MCP', status: 'connected', latency: '15ms' }
                    ].map((server) => (
                      <div key={server.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(server.status)}
                          <span className="text-sm font-medium">{server.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {server.latency}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Metrics</CardTitle>
                <CardDescription>Data throughput and processing statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Performance charts and metrics would be displayed here</p>
                    <p className="text-xs">Connected to monitoring MCP servers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}