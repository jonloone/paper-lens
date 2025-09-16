'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Terminal, FileText, BarChart3, Loader2
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
  const activeTab = searchParams?.get('tab') || 'health';
  
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

    setConnections(prev => [...prev, newConn]);
    
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
    
    // Test the new connection
    setTimeout(() => testConnection(newConn.id), 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />;
    }
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'PostgreSQL':
      case 'MySQL':
      case 'MongoDB':
        return <Database className="w-4 h-4" />;
      case 'REST API':
      case 'GraphQL':
        return <Zap className="w-4 h-4" />;
      case 'Kafka':
      case 'Kinesis':
        return <Activity className="w-4 h-4" />;
      case 'Snowflake':
      case 'BigQuery':
        return <Server className="w-4 h-4" />;
      default:
        return <Cable className="w-4 h-4" />;
    }
  };

  // Calculate overall system health
  const healthyCount = connections.filter(c => c.status === 'healthy').length;
  const healthPercentage = (healthyCount / connections.length) * 100;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cable className="w-8 h-8" />
            Connections & Sources
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your data source connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => connections.forEach(c => testConnection(c.id))}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Test All
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              const element = document.getElementById('add-connection-tab');
              element?.click();
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Connection Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{healthPercentage.toFixed(0)}% Healthy</p>
                <p className="text-sm text-muted-foreground">
                  {healthyCount} of {connections.length} connections operational
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-green-500`} />
                  <span>Healthy: {connections.filter(c => c.status === 'healthy').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-yellow-500`} />
                  <span>Warning: {connections.filter(c => c.status === 'warning').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-red-500`} />
                  <span>Error: {connections.filter(c => c.status === 'error').length}</span>
                </div>
              </div>
            </div>
            <Progress value={healthPercentage} className="h-2" />
            
            {connections.some(c => c.status !== 'healthy') && (
              <Alert>
                <Brain className="w-4 h-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>{connections.filter(c => c.status !== 'healthy').length} connections need attention</span>
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
                          Prioritize with AI
                        </>
                      )}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health">Connection Health</TabsTrigger>
          <TabsTrigger value="add" id="add-connection-tab">Add New Connection</TabsTrigger>
          <TabsTrigger value="troubleshoot">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          {/* Connection Health Dashboard */}
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
                          {getConnectionTypeIcon(connection.type)}
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
                  <div key={step} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${newConnectionStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`w-full h-0.5 mx-2 ${newConnectionStep > step ? 'bg-primary' : 'bg-muted'}`} />
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
                        <CardContent className="pt-6 text-center">
                          {getConnectionTypeIcon(type)}
                          <p className="mt-2 font-medium">{type}</p>
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