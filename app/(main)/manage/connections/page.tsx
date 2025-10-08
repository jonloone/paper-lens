'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Database,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  Server,
  GitBranch,
  Zap,
  FileText,
  Filter,
} from 'lucide-react';

// Types matching backend models
interface SourceSummary {
  id: string;
  name: string;
  type: string;
  connection_mode: 'federated' | 'cdc' | 'batch' | 'streaming';
  domain: string;
  status: 'active' | 'paused' | 'failed' | 'configuring' | 'deploying';
  health_score: number | null;
  owner_email: string;
  created_at: string;
  table_count: number;
  query_count_30d: number | null;
  error_message: string | null;
}

interface SourcesOverview {
  total: number;
  by_status: Record<string, number>;
  by_mode: Record<string, number>;
  by_domain: Record<string, number>;
  issues_count: number;
  recent_deployments: Array<{
    id: string;
    status: string;
    progress: number;
    created_at: string;
    completed_at: string | null;
    created_by: string | null;
  }>;
}

export default function SourcesLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [overview, setOverview] = useState<SourcesOverview | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [statusFilter, modeFilter, domainFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (modeFilter !== 'all') params.append('connection_mode', modeFilter);
      if (domainFilter !== 'all') params.append('domain', domainFilter);

      // Fetch sources and overview in parallel
      const [sourcesRes, overviewRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/sources?${params.toString()}`),
        fetch('http://localhost:8000/api/v1/sources/summary')
      ]);

      if (sourcesRes.ok && overviewRes.ok) {
        const sourcesData = await sourcesRes.json();
        const overviewData = await overviewRes.json();
        setSources(sourcesData);
        setOverview(overviewData);
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sources by search query
  const filteredSources = sources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'deploying':
      case 'configuring':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Server className="h-4 w-4 text-gray-400" />;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'federated':
        return <Database className="h-4 w-4 text-blue-500" />;
      case 'cdc':
        return <GitBranch className="h-4 w-4 text-purple-500" />;
      case 'batch':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'streaming':
        return <Zap className="h-4 w-4 text-green-500" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'deploying':
      case 'configuring':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="w-full px-8 lg:px-12 xl:px-16 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Source Connections</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor data source connections across your ecosystem
          </p>
        </div>
        <Button onClick={() => router.push('/manage/sources/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Connect New Source
        </Button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.total}</div>
              <p className="text-xs text-muted-foreground">
                Across {Object.keys(overview.by_domain).length} domains
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.by_status.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                {overview.total > 0
                  ? `${Math.round((overview.by_status.active || 0) / overview.total * 100)}% of total`
                  : 'No sources yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.issues_count}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Deployments</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.recent_deployments.length}</div>
              <p className="text-xs text-muted-foreground">
                In last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attention Required Section */}
      {overview && overview.issues_count > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-900 dark:text-red-100">
              <AlertCircle className="h-5 w-5" />
              Attention Required ({overview.issues_count})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredSources
              .filter(s => s.status === 'failed')
              .map(source => (
                <div
                  key={source.id}
                  className="flex items-start justify-between p-3 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/manage/sources/${source.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">{source.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {source.connection_mode}
                      </Badge>
                    </div>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      {source.error_message || 'Connection failed'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Investigate
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="deploying">Deploying</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="configuring">Configuring</SelectItem>
          </SelectContent>
        </Select>

        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Connection Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="federated">Federated</SelectItem>
            <SelectItem value="cdc">CDC</SelectItem>
            <SelectItem value="batch">Batch</SelectItem>
            <SelectItem value="streaming">Streaming</SelectItem>
          </SelectContent>
        </Select>

        {overview && Object.keys(overview.by_domain).length > 0 && (
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {Object.keys(overview.by_domain).map(domain => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Sources List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Activity className="h-8 w-8 animate-spin" />
                <p>Loading sources...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredSources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Database className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-medium text-lg">No sources found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || statusFilter !== 'all' || modeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by connecting your first data source'}
                </p>
              </div>
              {!searchQuery && statusFilter === 'all' && modeFilter === 'all' && (
                <Button onClick={() => router.push('/manage/sources/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect New Source
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredSources.map(source => (
            <Card
              key={source.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/manage/sources/${source.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(source.status)}
                      {getModeIcon(source.connection_mode)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{source.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {source.type}
                        </Badge>
                        <Badge
                          variant={getStatusBadgeVariant(source.status)}
                          className="text-xs"
                        >
                          {source.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {source.connection_mode}
                        </span>
                        <span>•</span>
                        <span>{source.domain}</span>
                        <span>•</span>
                        <span>{source.table_count} tables</span>
                        {source.query_count_30d !== null && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {source.query_count_30d.toLocaleString()} queries/30d
                            </span>
                          </>
                        )}
                      </div>
                      {source.error_message && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                          {source.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {source.health_score !== null && (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          source.health_score >= 80 ? 'text-green-600' :
                          source.health_score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {source.health_score}
                        </div>
                        <p className="text-xs text-muted-foreground">health</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(source.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
