'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Cable, Activity, Database, Settings, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Plus, Eye, Play,
  Zap, Clock, Server, Shield, Users, TrendingUp,
  AlertCircle, Brain, Bot, Sparkles, ArrowRight
} from 'lucide-react';
import { ConnectionAnalysisPanel } from '@/components/connect/ConnectionAnalysisPanel';
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
      downstream: 15
    },
    {
      id: 'conn-002',
      name: 'Sales API',
      type: 'REST API',
      status: 'warning',
      responseTime: 850,
      lastCheck: new Date(),
      errorRate: 2.5,
      downstream: 8
    },
    {
      id: 'conn-003',
      name: 'Event Stream',
      type: 'Kafka',
      status: 'error',
      responseTime: 0,
      lastCheck: new Date(),
      errorRate: 100,
      downstream: 23
    },
    {
      id: 'conn-004',
      name: 'Data Warehouse',
      type: 'Snowflake',
      status: 'healthy',
      responseTime: 120,
      lastCheck: new Date(),
      errorRate: 0,
      downstream: 45
    }
  ]);

  const [analyzingPriority, setAnalyzingPriority] = useState(false);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
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
            Ensure reliable data access and source health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
          <Button size="sm">
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health">Connection Health</TabsTrigger>
          <TabsTrigger value="sources">Available Sources</TabsTrigger>
          <TabsTrigger value="setup">Setup Wizard</TabsTrigger>
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
                        <p className="text-xs text-muted-foreground">{connection.type}</p>
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
                      <p className="text-muted-foreground">Last Check</p>
                      <p className="font-medium">
                        {new Date(connection.lastCheck).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  {connection.recommendation && (
                    <Alert className="py-2">
                      <Bot className="w-3 h-3" />
                      <AlertDescription className="text-xs">
                        {connection.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Play className="w-3 h-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          {/* Available Sources Browser */}
          <Card>
            <CardHeader>
              <CardTitle>Browse Available Data Sources</CardTitle>
              <CardDescription>
                Discover and connect to available data sources in your environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Source categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="pt-6">
                      <Database className="w-8 h-8 mb-2" />
                      <p className="font-medium">Databases</p>
                      <p className="text-sm text-muted-foreground">12 available</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="pt-6">
                      <Zap className="w-8 h-8 mb-2" />
                      <p className="font-medium">APIs</p>
                      <p className="text-sm text-muted-foreground">8 available</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="pt-6">
                      <Server className="w-8 h-8 mb-2" />
                      <p className="font-medium">File Systems</p>
                      <p className="text-sm text-muted-foreground">4 available</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="pt-6">
                      <Activity className="w-8 h-8 mb-2" />
                      <p className="font-medium">Streams</p>
                      <p className="text-sm text-muted-foreground">3 available</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          {/* Connection Wizard with AI Analysis */}
          <ConnectionAnalysisPanel 
            sources={[
              {
                name: 'New PostgreSQL Database',
                connection_type: 'database',
                connection_details: {
                  host: 'db.example.com',
                  port: 5432,
                  database: 'analytics'
                },
                target_system: 'data_warehouse'
              }
            ]}
          />
        </TabsContent>

        <TabsContent value="troubleshoot" className="space-y-4">
          {/* Troubleshooting Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Troubleshooting</CardTitle>
              <CardDescription>
                Resolve connection issues with AI-powered diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connections
                  .filter(c => c.status !== 'healthy')
                  .map(conn => (
                    <Alert key={conn.id} variant={conn.status === 'error' ? 'destructive' : 'default'}>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{conn.name}</p>
                            <p className="text-sm">Status: {conn.status} | Error Rate: {conn.errorRate}%</p>
                          </div>
                          <Button size="sm" variant="secondary">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Troubleshoot
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}