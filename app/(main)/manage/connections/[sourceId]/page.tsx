'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Activity,
  Server,
  Database,
  GitBranch,
  Zap,
  TrendingUp,
  Settings,
  FileText,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Play,
  Pause,
} from 'lucide-react';

// Types matching backend models
interface SourceDetail {
  id: string;
  name: string;
  description: string | null;
  type: string;
  connection_mode: 'federated' | 'cdc' | 'batch' | 'streaming';
  domain: string;
  owner_email: string;
  team: string | null;
  tags: string[];
  status: 'active' | 'paused' | 'failed' | 'configuring' | 'deploying';
  health_score: number | null;
  last_health_check: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  deployed_at: string | null;
  connection_details?: {
    host: string;
    port: number;
    database_name?: string;
    schema_name?: string;
    username: string;
    ssl_enabled: boolean;
  };
  configuration?: any;
  tables: Array<{
    schema: string;
    table: string;
    row_count?: number;
    size_mb?: number;
    primary_key_columns: string[];
    column_count?: number;
  }>;
  recent_metrics?: any;
  deployment_history: Array<{
    id: string;
    status: string;
    progress: number;
    created_at: string;
    completed_at: string | null;
    created_by: string | null;
  }>;
}

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  issues: string[];
  last_check: string;
  checks: Record<string, boolean>;
}

export default function SourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sourceId = params.sourceId as string;

  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<SourceDetail | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (sourceId) {
      fetchSourceDetail();
      fetchHealthStatus();
    }
  }, [sourceId]);

  const fetchSourceDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/sources/${sourceId}`);
      if (response.ok) {
        const data = await response.json();
        setSource(data);
      } else if (response.status === 404) {
        router.push('/manage/connections');
      }
    } catch (error) {
      console.error('Failed to fetch source:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/sources/${sourceId}/health`);
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this source? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/sources/${sourceId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/manage/connections');
      }
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'deploying':
      case 'configuring':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'paused':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Server className="h-5 w-5 text-gray-400" />;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'federated':
        return <Database className="h-5 w-5 text-blue-500" />;
      case 'cdc':
        return <GitBranch className="h-5 w-5 text-purple-500" />;
      case 'batch':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'streaming':
        return <Zap className="h-5 w-5 text-green-500" />;
      default:
        return <Server className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="w-full px-8 lg:px-12 xl:px-16 py-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading source details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!source) {
    return (
      <div className="w-full px-8 lg:px-12 xl:px-16 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg">Source not found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              The requested source does not exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/manage/connections')}>
              Back to Sources
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-8 lg:px-12 xl:px-16 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/manage/connections')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              {getStatusIcon(source.status)}
              {getModeIcon(source.connection_mode)}
              <h1 className="text-3xl font-bold">{source.name}</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              {source.description || `${source.type} source in ${source.domain}`}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{source.type}</Badge>
              <Badge variant="outline">{source.connection_mode}</Badge>
              <Badge variant={
                source.status === 'active' ? 'default' :
                source.status === 'failed' ? 'destructive' :
                'secondary'
              }>
                {source.status}
              </Badge>
              {source.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {source.status === 'active' && (
            <Button variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {source.status === 'paused' && (
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Health Status Card */}
      {health && (
        <Card className={`border-2 ${
          health.overall === 'healthy' ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' :
          health.overall === 'degraded' ? 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20' :
          'border-red-200 bg-red-50/50 dark:bg-red-950/20'
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {health.overall === 'healthy' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {health.overall === 'degraded' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                {health.overall === 'unhealthy' && <XCircle className="h-5 w-5 text-red-600" />}
                Health Status: {health.overall}
              </CardTitle>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  health.score >= 80 ? 'text-green-600' :
                  health.score >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {health.score}
                </div>
                <p className="text-xs text-muted-foreground">health score</p>
              </div>
            </div>
          </CardHeader>
          {health.issues.length > 0 && (
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Issues:</p>
                {health.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Tables ({source.tables.length})</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm">{source.owner_email}</p>
                {source.team && (
                  <p className="text-xs text-muted-foreground mt-1">Team: {source.team}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Domain</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{source.domain}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Created</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{new Date(source.created_at).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {new Date(source.updated_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {source.connection_details && (
            <Card>
              <CardHeader>
                <CardTitle>Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Host</p>
                    <p className="font-mono text-sm">{source.connection_details.host}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Port</p>
                    <p className="font-mono text-sm">{source.connection_details.port}</p>
                  </div>
                  {source.connection_details.database_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Database</p>
                      <p className="font-mono text-sm">{source.connection_details.database_name}</p>
                    </div>
                  )}
                  {source.connection_details.schema_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Schema</p>
                      <p className="font-mono text-sm">{source.connection_details.schema_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Username</p>
                    <p className="font-mono text-sm">{source.connection_details.username}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SSL</p>
                    <p className="text-sm">
                      {source.connection_details.ssl_enabled ? (
                        <span className="text-green-600">Enabled</span>
                      ) : (
                        <span className="text-red-600">Disabled</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          {source.tables.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tables discovered yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {source.tables.map((table, idx) => (
                <Card key={idx}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-medium">
                          {table.schema}.{table.table}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {table.row_count !== undefined && (
                            <span>{table.row_count.toLocaleString()} rows</span>
                          )}
                          {table.size_mb !== undefined && (
                            <span>{table.size_mb.toFixed(2)} MB</span>
                          )}
                          {table.column_count !== undefined && (
                            <span>{table.column_count} columns</span>
                          )}
                          {table.primary_key_columns.length > 0 && (
                            <span>PK: {table.primary_key_columns.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Schema
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Connection mode-specific configuration details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
                {JSON.stringify(source.configuration || {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployments Tab */}
        <TabsContent value="deployments" className="space-y-4">
          {source.deployment_history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No deployment history</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {source.deployment_history.map((deployment) => (
                <Card key={deployment.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            deployment.status === 'completed' ? 'default' :
                            deployment.status === 'failed' ? 'destructive' :
                            'secondary'
                          }>
                            {deployment.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {deployment.progress}% complete
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Started {new Date(deployment.created_at).toLocaleString()}
                          {deployment.completed_at && (
                            <> • Completed {new Date(deployment.completed_at).toLocaleString()}</>
                          )}
                          {deployment.created_by && <> • by {deployment.created_by}</>}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Real-time performance and usage metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {source.recent_metrics ? (
                <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
                  {JSON.stringify(source.recent_metrics, null, 2)}
                </pre>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>No metrics available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
