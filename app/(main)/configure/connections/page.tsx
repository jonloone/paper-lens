'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Zap,
  Database,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Shield,
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const connections = [
    {
      id: '1',
      name: 'PostgreSQL Production',
      type: 'PostgreSQL',
      host: 'prod-db.example.com',
      status: 'healthy',
      latency: '12ms',
      lastTested: '5 minutes ago',
      usage: {
        pipelines: 23,
        queries: '1.2k/day'
      }
    },
    {
      id: '2',
      name: 'MySQL Analytics',
      type: 'MySQL',
      host: 'analytics.example.com',
      status: 'healthy',
      latency: '8ms',
      lastTested: '10 minutes ago',
      usage: {
        pipelines: 15,
        queries: '800/day'
      }
    },
    {
      id: '3',
      name: 'Snowflake DW',
      type: 'Snowflake',
      host: 'acme.snowflakecomputing.com',
      status: 'warning',
      latency: '145ms',
      lastTested: '2 hours ago',
      usage: {
        pipelines: 8,
        queries: '2.5k/day'
      }
    },
    {
      id: '4',
      name: 'MongoDB Events',
      type: 'MongoDB',
      host: 'events.mongodb.net',
      status: 'healthy',
      latency: '23ms',
      lastTested: '1 hour ago',
      usage: {
        pipelines: 12,
        queries: '5k/day'
      }
    },
    {
      id: '5',
      name: 'S3 Data Lake',
      type: 'AWS S3',
      host: 's3://data-lake-prod',
      status: 'healthy',
      latency: '45ms',
      lastTested: '30 minutes ago',
      usage: {
        pipelines: 34,
        queries: '10k/day'
      }
    }
  ];

  const connectionTypes = [
    { id: 'all', label: 'All Types', count: connections.length },
    { id: 'database', label: 'Databases', count: 4 },
    { id: 'storage', label: 'Storage', count: 1 },
    { id: 'streaming', label: 'Streaming', count: 0 }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-700">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-700">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connections</h1>
        <p className="text-muted-foreground">
          Manage data source connections and test connectivity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connections.length}</div>
            <p className="text-xs text-muted-foreground">
              {connections.filter(c => c.status === 'healthy').length} healthy
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Pipelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92</div>
            <p className="text-xs text-muted-foreground">Using connections</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Daily Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">19.5k</div>
            <p className="text-xs text-muted-foreground">Across all sources</p>
          </CardContent>
        </Card>
        
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">1</div>
            <p className="text-xs text-muted-foreground">High latency detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connections..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Connection
          </Button>
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Test All
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {connectionTypes.map((type) => (
          <Button
            key={type.id}
            variant={filterType === type.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(type.id)}
          >
            {type.label}
            <Badge variant="secondary" className="ml-2">
              {type.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Connections List */}
      <div className="grid grid-cols-1 gap-4">
        {connections.map((connection) => (
          <Card key={connection.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{connection.name}</h3>
                      {getStatusBadge(connection.status)}
                      <Badge variant="outline">{connection.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {connection.host}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <div className="flex items-center gap-1 font-medium">
                          {getStatusIcon(connection.status)}
                          <span>{connection.latency}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Tested</p>
                        <p className="font-medium">{connection.lastTested}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pipelines</p>
                        <p className="font-medium">{connection.usage.pipelines}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Queries</p>
                        <p className="font-medium">{connection.usage.queries}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Test
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}