'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Trash2,
  RefreshCw,
  Edit3,
  Pause,
  PlayCircle,
  MoreVertical,
  Copy,
  UserX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TechLogo } from '@/components/ui/tech-logo';
import { ConnectionDetailPanelNew as ConnectionDetailPanel } from '@/components/manage/ConnectionDetailPanelNew';
import { getAllConnections, seedMockConnections, clearAllConnections } from '@/lib/services/connection-storage';
import type { UnifiedSourceConnection, IngestionMethod } from '@/lib/types/source-connections';

// Method icons and labels
const methodIcons: Record<IngestionMethod, typeof Database> = {
  federated: Database,
  incremental_query: TrendingUp,
  batch_cdc: Clock,
  streaming_cdc: Zap,
};

const methodLabels: Record<IngestionMethod, string> = {
  federated: 'Federated',
  incremental_query: 'Incremental',
  batch_cdc: 'Batch CDC',
  streaming_cdc: 'Streaming CDC',
};

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
  const [sources, setSources] = useState<UnifiedSourceConnection[]>([]);
  const [showDevTools, setShowDevTools] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<UnifiedSourceConnection | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created' | 'status'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadConnections();
  }, [statusFilter, typeFilter]);

  const loadConnections = () => {
    setLoading(true);
    try {
      const allConnections = getAllConnections();

      // Apply filters
      let filtered = allConnections;
      if (statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === statusFilter);
      }
      if (typeFilter !== 'all') {
        filtered = filtered.filter(c => c.type === typeFilter);
      }

      setSources(filtered);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedMock = () => {
    seedMockConnections();
    loadConnections();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all saved connections? This cannot be undone.')) {
      clearAllConnections();
      loadConnections();
    }
  };

  // Action handlers
  const handleEdit = (connectionId: string) => {
    router.push(`/manage/connections/${connectionId}/edit`);
  };

  const handlePause = (connectionId: string) => {
    // TODO: Implement pause functionality
    console.log('Pause connection:', connectionId);
  };

  const handleTest = (connectionId: string) => {
    // TODO: Implement connection test
    console.log('Test connection:', connectionId);
  };

  const handleClone = (connectionId: string) => {
    // TODO: Implement clone functionality
    console.log('Clone connection:', connectionId);
  };

  const handleDelete = (connectionId: string) => {
    if (confirm('Are you sure you want to delete this connection? This action cannot be undone.')) {
      // TODO: Implement delete functionality
      console.log('Delete connection:', connectionId);
    }
  };

  const toggleSelection = (connectionId: string) => {
    setSelectedConnections(prev =>
      prev.includes(connectionId)
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedConnections.length === filteredAndSortedSources.length) {
      setSelectedConnections([]);
    } else {
      setSelectedConnections(filteredAndSortedSources.map(s => s.id));
    }
  };

  // Get unique teams for filter
  const uniqueTeams = Array.from(new Set(sources.map(s => s.team)));

  // Filter and sort sources
  const filteredAndSortedSources = sources
    .filter(source => {
      // Search filter
      const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.team.toLowerCase().includes(searchQuery.toLowerCase());

      // Owner filter
      const matchesOwner = ownerFilter === 'all' || source.team === ownerFilter;

      return matchesSearch && matchesOwner;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Calculate overview stats from localStorage
  const overview = {
    total: sources.length,
    active: sources.filter(s => s.status === 'active').length,
    failed: sources.filter(s => s.status === 'failed').length,
    uniqueTypes: new Set(sources.map(s => s.type)).size,
  };

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
    <div className="max-w-7xl mx-auto px-8 lg:px-12 xl:px-16 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Connections</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor data source connections across your ecosystem
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDevTools(!showDevTools)}>
            <Activity className="h-4 w-4 mr-2" />
            Dev Tools
          </Button>
          <Button onClick={() => router.push('/manage/connections/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Connect New Source
          </Button>
        </div>
      </div>

      {/* Developer Tools */}
      {showDevTools && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Developer Tools (POC - localStorage)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSeedMock} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Seed Mock Connections
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear All Connections
            </Button>
            <div className="flex-1" />
            <div className="text-xs text-muted-foreground flex items-center">
              {sources.length} connection{sources.length !== 1 ? 's' : ''} in localStorage
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total}</div>
            <p className="text-xs text-muted-foreground">
              {overview.uniqueTypes} database types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.active}</div>
            <p className="text-xs text-muted-foreground">
              {overview.total > 0
                ? `${Math.round((overview.active / overview.total) * 100)}% of total`
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
            <div className="text-2xl font-bold">{overview.failed}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sources.reduce((sum, s) => sum + s.tables.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all sources
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attention Required Section */}
      {overview.failed > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-900 dark:text-red-100">
              <AlertCircle className="h-5 w-5" />
              Attention Required ({overview.failed})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredSources
              .filter(s => s.status === 'failed')
              .map(source => (
                <div
                  key={source.id}
                  className="flex items-start justify-between p-3 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">{source.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {source.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      Connection failed - check configuration
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

      {/* Filters & Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
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

        {/* Status Filter */}
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

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Database Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="postgresql">PostgreSQL</SelectItem>
            <SelectItem value="mysql">MySQL</SelectItem>
            <SelectItem value="mongodb">MongoDB</SelectItem>
            <SelectItem value="mariadb">MariaDB</SelectItem>
            <SelectItem value="oracle">Oracle</SelectItem>
            <SelectItem value="sqlserver">SQL Server</SelectItem>
          </SelectContent>
        </Select>

        {/* Owner/Team Filter */}
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {uniqueTeams.map(team => (
              <SelectItem key={team} value={team}>{team}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('updated')}>
              {sortBy === 'updated' && sortOrder === 'desc' && <ArrowDown className="h-3 w-3 mr-2" />}
              {sortBy === 'updated' && sortOrder === 'asc' && <ArrowUp className="h-3 w-3 mr-2" />}
              Last Updated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('created')}>
              {sortBy === 'created' && sortOrder === 'desc' && <ArrowDown className="h-3 w-3 mr-2" />}
              {sortBy === 'created' && sortOrder === 'asc' && <ArrowUp className="h-3 w-3 mr-2" />}
              Date Created
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('name')}>
              {sortBy === 'name' && sortOrder === 'desc' && <ArrowDown className="h-3 w-3 mr-2" />}
              {sortBy === 'name' && sortOrder === 'asc' && <ArrowUp className="h-3 w-3 mr-2" />}
              Name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('status')}>
              {sortBy === 'status' && sortOrder === 'desc' && <ArrowDown className="h-3 w-3 mr-2" />}
              {sortBy === 'status' && sortOrder === 'asc' && <ArrowUp className="h-3 w-3 mr-2" />}
              Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 mr-2" /> : <ArrowDown className="h-3 w-3 mr-2" />}
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sources Table */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Activity className="h-8 w-8 animate-spin" />
              <p>Loading sources...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredAndSortedSources.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <Database className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-semibold text-xl mb-2">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || ownerFilter !== 'all'
                    ? 'No sources match your filters'
                    : 'No Connections Yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || ownerFilter !== 'all'
                    ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
                    : 'Connect your first data source to start building data products and enabling analytics across your organization.'}
                </p>
              </div>

              {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && ownerFilter === 'all' && sources.length === 0 ? (
                <div className="space-y-6">
                  {/* Quick Start Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => router.push('/manage/connections/new')} size="lg" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Connection
                    </Button>
                    <Button
                      onClick={() => {
                        // Import the seed function
                        const { seedMockConnections } = require('@/lib/services/connection-storage');
                        seedMockConnections();
                        window.location.reload();
                      }}
                      variant="outline"
                      size="lg"
                      className="gap-2"
                    >
                      <Database className="h-4 w-4" />
                      Load Sample Data
                    </Button>
                  </div>

                  {/* Popular Source Types */}
                  <div className="border-t pt-6 max-w-2xl mx-auto">
                    <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                      Popular Data Sources
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { type: 'postgresql', label: 'PostgreSQL', logo: '/tech-icons/postgresql.svg' },
                        { type: 'mysql', label: 'MySQL', logo: '/tech-icons/mysql.svg' },
                        { type: 'mongodb', label: 'MongoDB', logo: '/tech-icons/mongodb.svg' },
                        { type: 'snowflake', label: 'Snowflake', logo: '/tech-icons/snowflake.svg' },
                      ].map((source) => (
                        <Button
                          key={source.type}
                          variant="outline"
                          className="h-auto py-4 flex-col gap-2"
                          onClick={() => router.push(`/manage/connections/new?type=${source.type}`)}
                        >
                          <TechLogo src={source.logo} name={source.label} size="md" />
                          <span className="text-xs">{source.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Help Resources */}
                  <div className="border-t pt-6 max-w-lg mx-auto">
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                      Need Help Getting Started?
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <ExternalLink className="h-3 w-3" />
                        View Documentation
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <ExternalLink className="h-3 w-3" />
                        Watch Tutorial
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <ExternalLink className="h-3 w-3" />
                        Best Practices
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setOwnerFilter('all');
                  }} variant="outline">
                    Clear All Filters
                  </Button>
                  {sources.length > 0 && (
                    <Button onClick={() => router.push('/manage/connections/new')} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Connection
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connection</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tables</TableHead>
                <TableHead>Methods</TableHead>
                <TableHead className="text-right">Health</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSources.map(source => {
                const methodCounts = source.tables.reduce((acc, table) => {
                  acc[table.method] = (acc[table.method] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                const healthScore = source.status === 'active' ? 98 : 0;

                return (
                  <TableRow
                    key={source.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedConnection(source);
                      setIsPanelOpen(true);
                    }}
                  >
                    {/* Connection */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <TechLogo
                          src={`/tech-icons/${source.type}.svg`}
                          name={source.type}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{source.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {source.connection.database} · {source.connection.host}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(source.status)} className="capitalize text-xs">
                        {source.status}
                      </Badge>
                    </TableCell>

                    {/* Tables */}
                    <TableCell className="text-right">
                      <span className="font-medium">{source.tables.length}</span>
                    </TableCell>

                    {/* Methods */}
                    <TableCell>
                      <div className="flex gap-2">
                        {Object.entries(methodCounts).map(([method, count]) => {
                          const Icon = methodIcons[method as IngestionMethod] || Database;
                          return (
                            <div
                              key={method}
                              className="flex items-center gap-1 text-xs text-muted-foreground"
                              title={`${methodLabels[method as IngestionMethod]}: ${count} tables`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span className="font-medium">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>

                    {/* Health */}
                    <TableCell className="text-right">
                      {source.status === 'active' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-sm font-medium">{healthScore}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">--</span>
                      )}
                    </TableCell>

                    {/* Owner */}
                    <TableCell className="text-sm">{source.team}</TableCell>

                    {/* Last Updated */}
                    <TableCell className="text-sm text-muted-foreground">
                      {(() => {
                        const date = new Date(source.updatedAt);
                        const now = new Date();
                        const diffMs = now.getTime() - date.getTime();
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                        if (diffDays === 0) return 'Today';
                        if (diffDays === 1) return 'Yesterday';
                        if (diffDays < 7) return `${diffDays}d ago`;
                        return date.toLocaleDateString();
                      })()}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(source.id);
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePause(source.id)}>
                              <Pause className="h-3 w-3 mr-2" />
                              Pause
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTest(source.id)}>
                              <PlayCircle className="h-3 w-3 mr-2" />
                              Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(source.id)}>
                              <Copy className="h-3 w-3 mr-2" />
                              Clone
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <GitBranch className="h-3 w-3 mr-2" />
                              View Lineage
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserX className="h-3 w-3 mr-2" />
                              Transfer Ownership
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(source.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Connection Detail Panel */}
      <ConnectionDetailPanel
        connection={selectedConnection}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onEdit={handleEdit}
        onPause={handlePause}
        onTest={handleTest}
        onClone={handleClone}
        onDelete={handleDelete}
        onRefresh={loadConnections}
      />
    </div>
  );
}
