'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Cable, Activity, Database, Settings, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Plus, Eye, Play,
  Zap, Clock, Server, Shield, Users, TrendingUp,
  AlertCircle, Brain, Bot, Sparkles, ArrowRight,
  Edit, Trash2, Download, Upload, Copy, History,
  Terminal, FileText, BarChart3, Loader2, List, Grid,
  LayoutGrid, MoreHorizontal, TestTube, ChevronRight
} from 'lucide-react';
import { crewAIService } from '@/lib/services/CrewAIService';

// Connection health status type
interface ConnectionHealth {
  id: string;
  name: string;
  type: string;
  status: 'healthy' | 'warning' | 'error' | 'checking';
  responseTime: number;
  lastCheck: Date;
  errorRate: number;
  downstream: number;
  priority?: number;
  recommendation?: string;
  // Additional fields for real functionality
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  ssl?: boolean;
  poolSize?: number;
  lastError?: string;
  totalQueries?: number;
  avgQueryTime?: number;
}

interface ConnectionTest {
  status: 'idle' | 'testing' | 'success' | 'failed';
  message?: string;
  latency?: number;
  details?: {
    connectivity: boolean;
    authentication: boolean;
    permissions: boolean;
    performance: number;
  };
}

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams?.get('tab') || 'health';
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'healthy' | 'warning' | 'error'>('all');
  
  const [connections, setConnections] = useState<ConnectionHealth[]>([
    {
      id: 'conn-001',
      name: 'Customer Analytics DB',
      type: 'PostgreSQL',
      status: 'healthy',
      responseTime: 45,
      lastCheck: new Date(),
      errorRate: 0.1,
      downstream: 15,
      host: 'analytics.db.company.com',
      port: 5432,
      database: 'customer_analytics',
      username: 'analytics_user',
      ssl: true,
      poolSize: 20,
      totalQueries: 125847,
      avgQueryTime: 45
    },
    {
      id: 'conn-002',
      name: 'Sales API',
      type: 'REST API',
      status: 'warning',
      responseTime: 850,
      lastCheck: new Date(),
      errorRate: 2.5,
      downstream: 8,
      host: 'api.sales.company.com',
      lastError: 'Timeout on /api/v2/orders endpoint',
      totalQueries: 45123,
      avgQueryTime: 850
    },
    {
      id: 'conn-003',
      name: 'Event Stream',
      type: 'Kafka',
      status: 'error',
      responseTime: 0,
      lastCheck: new Date(),
      errorRate: 100,
      downstream: 23,
      host: 'kafka.events.company.com',
      port: 9092,
      lastError: 'Connection refused - broker unavailable',
      totalQueries: 0,
      avgQueryTime: 0
    },
    {
      id: 'conn-004',
      name: 'Data Warehouse',
      type: 'Snowflake',
      status: 'healthy',
      responseTime: 120,
      lastCheck: new Date(),
      errorRate: 0,
      downstream: 45,
      host: 'company.snowflakecomputing.com',
      database: 'ANALYTICS_WH',
      username: 'ETL_USER',
      totalQueries: 8956,
      avgQueryTime: 120
    }
  ]);

  const [analyzingPriority, setAnalyzingPriority] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionHealth | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ConnectionTest>>({});
  const [editingConnection, setEditingConnection] = useState<ConnectionHealth | null>(null);

  // New connection form state
  const [newConnectionStep, setNewConnectionStep] = useState(1);
  const [newConnection, setNewConnection] = useState({
    type: '',
    name: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    ssl: false,
    poolSize: 10
  });

  // Use Arbitron to prioritize connection issues
  const prioritizeConnectionIssues = async () => {
    setAnalyzingPriority(true);
    
    const issues = connections
      .filter(c => c.status !== 'healthy')
      .map(c => ({
        id: c.id,
        severity: c.status === 'error' ? 'critical' : 'medium' as const,
        type: 'connection_failure',
        message: `${c.name} experiencing ${c.status} status`,
        source: c.type,
        timestamp: new Date().toISOString(),
        metadata: {
          errorRate: c.errorRate,
          downstream: c.downstream,
          responseTime: c.responseTime
        }
      }));

    if (issues.length > 0) {
      try {
        const result = await crewAIService.prioritizeAlerts(issues);
        
        // Update connections with priority recommendations
        const updatedConnections = connections.map(conn => {
          const prioritized = result.prioritized_alerts.find(a => a.id === conn.id);
          if (prioritized) {
            return {
              ...conn,
              priority: prioritized.priority_rank,
              recommendation: prioritized.recommendations[0]?.action
            };
          }
          return conn;
        });
        
        setConnections(updatedConnections);
      } catch (error) {
        console.error('Failed to prioritize issues:', error);
      }
    }
    
    setAnalyzingPriority(false);
  };

  // Test a connection
  const testConnection = async (connectionId: string) => {
    setTestingConnection(connectionId);
    setTestResults(prev => ({
      ...prev,
      [connectionId]: { status: 'testing' }
    }));

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));

    const connection = connections.find(c => c.id === connectionId);
    const isHealthy = connection?.status === 'healthy';
    
    setTestResults(prev => ({
      ...prev,
      [connectionId]: {
        status: isHealthy ? 'success' : 'failed',
        message: isHealthy 
          ? 'Connection test successful' 
          : `Test failed: ${connection?.lastError || 'Unknown error'}`,
        latency: connection?.responseTime || 0,
        details: {
          connectivity: Math.random() > 0.2,
          authentication: Math.random() > 0.1,
          permissions: Math.random() > 0.15,
          performance: Math.random() * 100
        }
      }
    }));
    
    setTestingConnection(null);
  };

  // Handle saving new connection
  const saveNewConnection = async () => {
    const newConn: ConnectionHealth = {
      id: `conn-${Date.now()}`,
      name: newConnection.name,
      type: newConnection.type,
      status: 'checking',
      responseTime: 0,
      lastCheck: new Date(),
      errorRate: 0,
      downstream: 0,
      host: newConnection.host,
      port: parseInt(newConnection.port),
      database: newConnection.database,
      username: newConnection.username,
      ssl: newConnection.ssl,
      poolSize: newConnection.poolSize,
      totalQueries: 0,
      avgQueryTime: 0
    };

    // Add new connection to the beginning for visibility
    setConnections(prev => [{ ...newConn, status: 'healthy' as const }, ...prev]);
    
    // Reset form
    setNewConnection({
      type: '',
      name: '',
      host: '',
      port: '',
      database: '',
      username: '',
      password: '',
      ssl: false,
      poolSize: 10
    });
    setNewConnectionStep(1);
    
    // Navigate to health tab to show the new connection
    router.push('/connections?tab=health');
    
    // Highlight the new connection briefly
    setTimeout(() => {
      const element = document.getElementById(newConn.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-primary', 'transition-all');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-primary');
        }, 3000);
      }
    }, 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />;
    }
  };

  const getConnectionTypeIcon = (type: string, variant: 'standard' | 'inline' | 'large' = 'standard') => {
    // Local tech logo mappings
    const techLogos: Record<string, string> = {
      // Databases
      'PostgreSQL': '/icons/tech/postgresql.svg',
      'MySQL': '/icons/tech/mysql.svg',
      'MongoDB': '/icons/tech/mongodb.svg',
      'Redis': '/icons/tech/redis.svg',
      'Elasticsearch': '/icons/tech/elasticsearch.svg',
      'Cassandra': '/icons/tech/postgresql.svg', // Using PostgreSQL as fallback
      'DynamoDB': '/icons/tech/aws.svg', // Using AWS icon
      'Neo4j': '/icons/tech/mongodb.svg', // Using MongoDB as fallback
      
      // APIs
      'REST API': '/icons/tech/restapi.svg',
      'GraphQL': '/icons/tech/graphql.svg',
      'gRPC': '/icons/tech/graphql.svg', // Using GraphQL as fallback
      'WebSocket': '/icons/tech/restapi.svg', // Using REST API as fallback
      
      // Streaming & Messaging
      'Kafka': '/icons/tech/kafka.svg',
      'Kinesis': '/icons/tech/kinesis.svg',
      'Pulsar': '/icons/tech/kafka.svg', // Using Kafka as fallback
      'RabbitMQ': '/icons/tech/kafka.svg', // Using Kafka as fallback
      'SQS': '/icons/tech/aws.svg',
      'EventBridge': '/icons/tech/aws.svg',
      
      // Cloud Data Warehouses
      'Snowflake': '/icons/tech/snowflake.svg',
      'BigQuery': '/icons/tech/bigquery.svg',
      'Redshift': '/icons/tech/redshift.svg',
      'Databricks': '/icons/tech/python.svg', // Using Python as fallback
      'Azure Synapse': '/icons/tech/azure.svg',
      
      // Storage
      'S3': '/icons/tech/s3.svg',
      'GCS': '/icons/tech/gcs.svg',
      'Azure Blob': '/icons/tech/azure.svg',
      'HDFS': '/icons/tech/docker.svg', // Using Docker as fallback
      'MinIO': '/icons/tech/s3.svg', // Using S3 as fallback
      
      // Processing
      'Spark': '/icons/tech/python.svg', // Using Python as fallback
      'Flink': '/icons/tech/python.svg', // Using Python as fallback
      'Airflow': '/icons/tech/python.svg', // Using Python as fallback
      'Dagster': '/icons/tech/python.svg', // Using Python as fallback
      'Prefect': '/icons/tech/python.svg', // Using Python as fallback
      
      // Analytics & BI
      'Tableau': '/icons/tech/postgresql.svg', // Using PostgreSQL as fallback
      'PowerBI': '/icons/tech/azure.svg', // Using Azure as fallback
      'Looker': '/icons/tech/gcp.svg', // Using GCP as fallback
      'Metabase': '/icons/tech/postgresql.svg', // Using PostgreSQL as fallback
      'Superset': '/icons/tech/python.svg', // Using Python as fallback
      
      // ETL/ELT Tools
      'dbt': '/icons/tech/python.svg', // Using Python as fallback
      'Fivetran': '/icons/tech/python.svg', // Using Python as fallback
      'Airbyte': '/icons/tech/docker.svg', // Using Docker as fallback
      'Stitch': '/icons/tech/python.svg', // Using Python as fallback
      'Matillion': '/icons/tech/python.svg' // Using Python as fallback
    };

    const logoUrl = techLogos[type];
    
    // Determine fallback icon
    const FallbackIcon = (() => {
      if (type.includes('API')) return Zap;
      if (type.includes('Stream') || type.includes('Queue')) return Activity;
      if (type.includes('Database') || type.includes('DB')) return Database;
      if (type.includes('Cloud') || type.includes('Storage')) return Server;
      return Cable;
    })();
    
    // For inline icons (used in text)
    if (variant === 'inline') {
      if (logoUrl) {
        return (
          <span className="inline-flex w-5 h-5 mx-1 align-middle">
            <Image 
              src={logoUrl}
              alt={`${type} logo`}
              width={20}
              height={20}
              className="object-contain"
              unoptimized
            />
          </span>
        );
      }
      return <FallbackIcon className="inline w-4 h-4 mx-1 align-middle" />;
    }
    
    // For large icons (used in selection cards)
    if (variant === 'large') {
      if (logoUrl) {
        return (
          <div className="w-16 h-16 p-2 flex items-center justify-center rounded-lg border border-border/50 bg-background/50 transition-all hover:bg-accent/10 hover:border-accent/30 mx-auto">
            <div className="relative w-full h-full">
              <Image 
                src={logoUrl}
                alt={`${type} logo`}
                fill
                className="object-contain"
                sizes="64px"
                unoptimized
              />
            </div>
          </div>
        );
      }
      return (
        <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-border/50 bg-background/50 transition-all hover:bg-accent/10 hover:border-accent/30 mx-auto">
          <FallbackIcon className="w-8 h-8 text-muted-foreground" />
        </div>
      );
    }
    
    // Standard icon display with border and padding
    if (logoUrl) {
      return (
        <div className="w-8 h-8 p-1.5 flex items-center justify-center rounded border border-border/50 bg-background/50 transition-all hover:bg-accent/10 hover:border-accent/30">
          <div className="relative w-full h-full">
            <Image 
              src={logoUrl}
              alt={`${type} logo`}
              fill
              className="object-contain"
              sizes="32px"
              unoptimized
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-8 h-8 flex items-center justify-center rounded border border-border/50 bg-background/50 transition-all hover:bg-accent/10 hover:border-accent/30">
        <FallbackIcon className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  };

  // Calculate stats
  const healthyCount = connections.filter(c => c.status === 'healthy').length;
  const warningCount = connections.filter(c => c.status === 'warning').length;
  const errorCount = connections.filter(c => c.status === 'error').length;
  
  // Get tab context
  const getTabContext = () => {
    switch (activeTab) {
      case 'health':
        return {
          title: 'Connection Health',
          subtitle: 'Monitor and test your active data sources',
          icon: Activity
        };
      case 'add':
        return {
          title: 'Add New Connection',
          subtitle: 'Configure new data source connections',
          icon: Plus
        };
      case 'troubleshoot':
        return {
          title: 'Troubleshooting',
          subtitle: `${errorCount + warningCount} issues to resolve`,
          icon: AlertTriangle
        };
      default:
        return {
          title: 'Connections',
          subtitle: 'Manage your data sources',
          icon: Cable
        };
    }
  };

  const tabContext = getTabContext();
  const TabIcon = tabContext.icon;

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-4">
      {/* Compact Header with Tab Context */}
      <div className="bg-background border-b sticky top-14 z-30 -mx-4 px-4 pb-3">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <TabIcon className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{tabContext.title}</h1>
              <p className="text-sm text-muted-foreground">{tabContext.subtitle}</p>
            </div>
          </div>
          
          {/* Tab-specific actions and stats */}
          <div className="flex items-center gap-3">
            {/* Compact status indicators - only show on health tab */}
            {activeTab === 'health' && (
              <div className="flex items-center gap-3 text-sm bg-muted/30 rounded-lg px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-medium">{healthyCount}</span>
                </div>
                {warningCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="font-medium">{warningCount}</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-medium">{errorCount}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Tab-specific actions */}
            {activeTab === 'health' && (
              <>
                {/* View Mode Toggle - Segmented Control */}
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
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => connections.forEach(c => testConnection(c.id))}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test All
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={prioritizeConnectionIssues}
                  disabled={analyzingPriority}
                >
                  {analyzingPriority ? (
                    <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Bot className="w-4 h-4 mr-1" /> Prioritize</>
                  )}
                </Button>
              </>
            )}
            
            {activeTab === 'troubleshoot' && (errorCount + warningCount) > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={prioritizeConnectionIssues}
                disabled={analyzingPriority}
              >
                {analyzingPriority ? (
                  <>
                    <Bot className="w-4 h-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Prioritize Issues
                  </>
                )}
              </Button>
            )}
            
            {activeTab !== 'add' && (
              <Button 
                size="sm"
                onClick={() => router.push('/connections?tab=add')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => router.push(`/connections?tab=${value}`)}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health">Connection Health</TabsTrigger>
          <TabsTrigger value="add" id="add-connection-tab">Add New Connection</TabsTrigger>
          <TabsTrigger value="troubleshoot">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          {/* Connection Health Dashboard - List or Card View */}
          {viewMode === 'list' ? (
            /* Dense List View */
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Status</th>
                        <th className="text-left p-3 font-medium text-sm">Connection</th>
                        <th className="text-left p-3 font-medium text-sm">Type</th>
                        <th className="text-left p-3 font-medium text-sm">Response</th>
                        <th className="text-left p-3 font-medium text-sm">Error Rate</th>
                        <th className="text-left p-3 font-medium text-sm">Downstream</th>
                        <th className="text-left p-3 font-medium text-sm">Queries</th>
                        <th className="text-right p-3 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {connections
                        .sort((a, b) => {
                          if (a.priority && b.priority) return a.priority - b.priority;
                          if (a.priority) return -1;
                          if (b.priority) return 1;
                          const statusOrder = { 'error': 0, 'warning': 1, 'healthy': 2, 'checking': 3 };
                          return statusOrder[a.status] - statusOrder[b.status];
                        })
                        .map((connection) => (
                          <tr key={connection.id}>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(connection.status)}
                                {connection.priority && (
                                  <Badge variant="destructive" className="text-xs">
                                    P{connection.priority}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{connection.name}</div>
                              <div className="text-xs text-muted-foreground">{connection.host}</div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                {getConnectionTypeIcon(connection.type, 'inline')}
                                <span className="text-sm">{connection.type}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`text-sm font-medium ${
                                connection.responseTime > 1000 ? 'text-orange-500' : 
                                connection.responseTime > 500 ? 'text-yellow-500' : 
                                'text-green-500'
                              }`}>
                                {connection.responseTime}ms
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`text-sm font-medium ${
                                connection.errorRate > 5 ? 'text-red-500' : 
                                connection.errorRate > 1 ? 'text-yellow-500' : 
                                'text-green-500'
                              }`}>
                                {connection.errorRate}%
                              </span>
                            </td>
                            <td className="p-3 text-sm">
                              {connection.downstream}
                            </td>
                            <td className="p-3 text-sm">
                              {connection.totalQueries?.toLocaleString() || '0'}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => testConnection(connection.id)}
                                  disabled={testingConnection === connection.id}
                                >
                                  {testingConnection === connection.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => setSelectedConnection(connection)}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Connection Details: {connection.name}</DialogTitle>
                                      <DialogDescription>
                                        View and manage connection configuration
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Host</Label>
                                          <p className="text-sm font-mono bg-muted p-2 rounded">
                                            {connection.host || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Port</Label>
                                          <p className="text-sm font-mono bg-muted p-2 rounded">
                                            {connection.port || 'Default'}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Database</Label>
                                          <p className="text-sm font-mono bg-muted p-2 rounded">
                                            {connection.database || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Username</Label>
                                          <p className="text-sm font-mono bg-muted p-2 rounded">
                                            {connection.username || 'N/A'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                >
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections
                .sort((a, b) => {
                  // Sort by priority if available, then by status
                  if (a.priority && b.priority) return a.priority - b.priority;
                  if (a.priority) return -1;
                  if (b.priority) return 1;
                  const statusOrder = { 'error': 0, 'warning': 1, 'healthy': 2, 'checking': 3 };
                  return statusOrder[a.status] - statusOrder[b.status];
                })
                .map((connection) => (
              <Card key={connection.id} className={connection.priority === 1 ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connection.status)}
                      <div>
                        <CardTitle className="text-base">{connection.name}</CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {getConnectionTypeIcon(connection.type, 'inline')}
                          {connection.type}
                        </p>
                      </div>
                    </div>
                    {connection.priority && (
                      <Badge variant="destructive">
                        Priority #{connection.priority}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Response Time</p>
                      <p className="font-medium">{connection.responseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Error Rate</p>
                      <p className="font-medium">{connection.errorRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Downstream</p>
                      <p className="font-medium">{connection.downstream} systems</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Queries</p>
                      <p className="font-medium">{connection.totalQueries?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  
                  {connection.lastError && (
                    <Alert className="py-2" variant="destructive">
                      <AlertTriangle className="w-3 h-3" />
                      <AlertDescription className="text-xs">
                        {connection.lastError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {connection.recommendation && (
                    <Alert className="py-2">
                      <Bot className="w-3 h-3" />
                      <AlertDescription className="text-xs">
                        {connection.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Test results display */}
                  {testResults[connection.id] && testResults[connection.id].status !== 'idle' && (
                    <Alert className="py-2" variant={
                      testResults[connection.id].status === 'success' ? 'default' : 
                      testResults[connection.id].status === 'failed' ? 'destructive' : 
                      'default'
                    }>
                      {testResults[connection.id].status === 'testing' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : testResults[connection.id].status === 'success' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <AlertDescription className="text-xs">
                        {testResults[connection.id].message || 'Testing connection...'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setSelectedConnection(connection)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Connection Details: {connection.name}</DialogTitle>
                          <DialogDescription>
                            View and manage connection configuration
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Host</Label>
                              <p className="text-sm font-mono bg-muted p-2 rounded">
                                {connection.host || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <Label>Port</Label>
                              <p className="text-sm font-mono bg-muted p-2 rounded">
                                {connection.port || 'Default'}
                              </p>
                            </div>
                            <div>
                              <Label>Database</Label>
                              <p className="text-sm font-mono bg-muted p-2 rounded">
                                {connection.database || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <Label>Username</Label>
                              <p className="text-sm font-mono bg-muted p-2 rounded">
                                {connection.username || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <Label>SSL Enabled</Label>
                              <p className="text-sm font-mono bg-muted p-2 rounded">
                                {connection.ssl ? 'Yes' : 'No'}
                              </p>
                            </div>
                            <div>
                              <Label>Pool Size</Label>
                              <p className="text-sm font-mono bg-muted p-2 rounded">
                                {connection.poolSize || 10}
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label>Performance Metrics</Label>
                            <Card>
                              <CardContent className="pt-4">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Avg Query Time</p>
                                    <p className="text-lg font-bold">{connection.avgQueryTime}ms</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Total Queries</p>
                                    <p className="text-lg font-bold">{connection.totalQueries?.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Error Rate</p>
                                    <p className="text-lg font-bold">{connection.errorRate}%</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Configuration
                            </Button>
                            <Button variant="outline" className="flex-1">
                              <History className="w-4 h-4 mr-2" />
                              View Logs
                            </Button>
                            <Button variant="outline" className="flex-1">
                              <Download className="w-4 h-4 mr-2" />
                              Export Config
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => testConnection(connection.id)}
                      disabled={testingConnection === connection.id}
                    >
                      {testingConnection === connection.id ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 mr-1" />
                      )}
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          {/* New Connection Wizard */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Connection</CardTitle>
              <CardDescription>
                Configure a new data source connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step indicators */}
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                      ${newConnectionStep >= step 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'bg-muted text-muted-foreground border border-border'}
                    `}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                        newConnectionStep > step ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Select Type */}
              {newConnectionStep === 1 && (
                <div className="space-y-4">
                  <Label>Select Connection Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['PostgreSQL', 'MySQL', 'MongoDB', 'Snowflake', 'REST API', 'Kafka'].map((type) => (
                      <Card 
                        key={type}
                        className={`cursor-pointer hover:border-primary transition-colors ${
                          newConnection.type === type ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setNewConnection(prev => ({ ...prev, type }))}
                      >
                        <CardContent className="pt-6 pb-4 text-center">
                          {getConnectionTypeIcon(type, 'large')}
                          <p className="mt-3 font-medium text-sm">{type}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setNewConnectionStep(2)}
                      disabled={!newConnection.type}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Connection Details */}
              {newConnectionStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Connection Name</Label>
                      <Input
                        id="name"
                        value={newConnection.name}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Production Database"
                      />
                    </div>
                    <div>
                      <Label htmlFor="host">Host</Label>
                      <Input
                        id="host"
                        value={newConnection.host}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="e.g., db.example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        value={newConnection.port}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, port: e.target.value }))}
                        placeholder="e.g., 5432"
                      />
                    </div>
                    <div>
                      <Label htmlFor="database">Database</Label>
                      <Input
                        id="database"
                        value={newConnection.database}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, database: e.target.value }))}
                        placeholder="e.g., analytics"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newConnection.username}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="e.g., db_user"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newConnection.password}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setNewConnectionStep(1)}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => setNewConnectionStep(3)}
                      disabled={!newConnection.name || !newConnection.host}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Advanced Settings */}
              {newConnectionStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ssl">SSL Encryption</Label>
                      <Select 
                        value={newConnection.ssl ? 'enabled' : 'disabled'}
                        onValueChange={(value) => setNewConnection(prev => ({ ...prev, ssl: value === 'enabled' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="poolSize">Connection Pool Size</Label>
                      <Input
                        id="poolSize"
                        type="number"
                        value={newConnection.poolSize}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, poolSize: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setNewConnectionStep(2)}>
                      Back
                    </Button>
                    <Button onClick={() => setNewConnectionStep(4)}>
                      Test Connection
                      <Play className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Test & Save */}
              {newConnectionStep === 4 && (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium">Connection Test</span>
                        <Badge variant="secondary">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Testing...
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Connectivity</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Authentication</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Permissions</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Response Time</span>
                          <span className="font-mono">45ms</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Connection test successful! You can now save this connection.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setNewConnectionStep(3)}>
                      Back
                    </Button>
                    <Button onClick={saveNewConnection}>
                      Save Connection
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshoot" className="space-y-4">
          {/* Enhanced Troubleshooting Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Troubleshooting</CardTitle>
              <CardDescription>
                Diagnose and resolve connection issues with guided workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connections
                  .filter(c => c.status !== 'healthy')
                  .map(conn => (
                    <Card key={conn.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {getStatusIcon(conn.status)}
                              {conn.name}
                            </CardTitle>
                            <CardDescription>
                              Status: {conn.status} | Error Rate: {conn.errorRate}%
                            </CardDescription>
                          </div>
                          <Badge variant={conn.status === 'error' ? 'destructive' : 'default'}>
                            {conn.downstream} systems affected
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {conn.lastError && (
                          <Alert variant="destructive">
                            <Terminal className="w-4 h-4" />
                            <AlertDescription>
                              <p className="font-mono text-xs">{conn.lastError}</p>
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="space-y-2">
                          <Label>Diagnostic Actions</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button size="sm" variant="outline">
                              <Terminal className="w-3 h-3 mr-1" />
                              View Logs
                            </Button>
                            <Button size="sm" variant="outline">
                              <BarChart3 className="w-3 h-3 mr-1" />
                              Performance Analysis
                            </Button>
                            <Button size="sm" variant="outline">
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Restart Connection
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="w-3 h-3 mr-1" />
                              Check Config
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Suggested Fixes</Label>
                          <div className="space-y-1">
                            <Alert>
                              <Sparkles className="w-4 h-4" />
                              <AlertDescription className="text-sm">
                                {conn.status === 'error' 
                                  ? 'Check network connectivity and ensure the service is running'
                                  : 'Consider increasing connection pool size or optimizing queries'}
                              </AlertDescription>
                            </Alert>
                          </div>
                        </div>
                        
                        <Button className="w-full">
                          <Bot className="w-4 h-4 mr-2" />
                          Start Guided Troubleshooting
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                {connections.filter(c => c.status !== 'healthy').length === 0 && (
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      All connections are healthy! No issues detected.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}