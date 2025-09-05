'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  Code,
  Database,
  FileJson,
  Activity,
  Zap,
  GitBranch,
  Key,
  ChevronRight
} from 'lucide-react';

interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  category: string;
  status: 'stable' | 'beta' | 'deprecated';
  responseTime?: string;
  lastUsed?: Date;
  rateLimit?: string;
}

export function APIEndpointCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mock data matching legacy system
  const endpoints: APIEndpoint[] = [
    {
      id: 'data_lakes',
      path: '/api/v1/data/lakes',
      method: 'GET',
      description: 'List all available data lakes',
      category: 'Data Access',
      status: 'stable',
      responseTime: '~120ms',
      lastUsed: new Date(Date.now() - 3600000)
    },
    {
      id: 'data_lake_sample',
      path: '/api/v1/data/lakes/{lake_id}/sample',
      method: 'GET',
      description: 'Get sample data from specific lake',
      category: 'Data Access',
      status: 'stable',
      responseTime: '~250ms'
    },
    {
      id: 'sales_transform',
      path: '/api/v1/data/sales_data/transform',
      method: 'POST',
      description: 'Transform sales data with custom rules',
      category: 'Data Transformation',
      status: 'stable',
      responseTime: '~1.2s'
    },
    {
      id: 'bank_query',
      path: '/api/v1/data/demo_bank_query',
      method: 'POST',
      description: 'Query bank demo dataset',
      category: 'Data Query',
      status: 'stable',
      responseTime: '~450ms'
    },
    {
      id: 'api_bank',
      path: '/api/v1/data/demo_api_bank',
      method: 'GET',
      description: 'Access bank API demo data',
      category: 'Data Access',
      status: 'stable',
      responseTime: '~200ms'
    },
    {
      id: 'sales_report',
      path: '/api/v1/data/demo_sales_report_board',
      method: 'GET',
      description: 'Generate sales report dashboard data',
      category: 'Reporting',
      status: 'stable',
      responseTime: '~800ms'
    },
    {
      id: 'cody_test',
      path: '/api/v1/data/cody_test',
      method: 'POST',
      description: 'Test endpoint for Cody integration',
      category: 'Testing',
      status: 'beta',
      responseTime: '~150ms'
    },
    {
      id: 'default_cody_test',
      path: '/api/v1/data/cody_test',
      method: 'GET',
      description: 'Default Cody test endpoint',
      category: 'Testing',
      status: 'beta',
      responseTime: '~100ms'
    },
    {
      id: 'admin_api',
      path: '/api/v1/data/admin_api',
      method: 'GET',
      description: 'Administrative API access',
      category: 'Admin',
      status: 'stable',
      responseTime: '~180ms',
      rateLimit: '100 req/min'
    },
    {
      id: 'product_test',
      path: '/api/v1/data/product_test_api_eng_4',
      method: 'POST',
      description: 'Product engineering test API v4',
      category: 'Testing',
      status: 'beta',
      responseTime: '~320ms'
    },
    {
      id: 'product_min',
      path: '/api/v1/data/product_min',
      method: 'GET',
      description: 'Minimal product data endpoint',
      category: 'Data Access',
      status: 'stable',
      responseTime: '~90ms'
    },
    {
      id: 'employee_data',
      path: '/api/v1/data/employees_{n}',
      method: 'GET',
      description: 'Get employee data by batch number',
      category: 'HR Data',
      status: 'stable',
      responseTime: '~200ms',
      rateLimit: '50 req/min'
    },
    {
      id: 'employee_full',
      path: '/api/v1/data/employees_full_api',
      method: 'GET',
      description: 'Full employee dataset API',
      category: 'HR Data',
      status: 'stable',
      responseTime: '~450ms',
      rateLimit: '20 req/min'
    },
    {
      id: 'hotel_employeetest',
      path: '/api/v1/data/hotel_employeetest',
      method: 'POST',
      description: 'Hotel employee test data',
      category: 'Testing',
      status: 'beta',
      responseTime: '~280ms'
    },
    {
      id: 'salaries',
      path: '/api/v1/data/salaries_average_salaries',
      method: 'GET',
      description: 'Get average salary analytics',
      category: 'Analytics',
      status: 'stable',
      responseTime: '~350ms'
    }
  ];

  const categories = Array.from(new Set(endpoints.map(e => e.category)));

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = searchTerm === '' || 
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || endpoint.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleCopyEndpoint = async (endpoint: APIEndpoint) => {
    const baseUrl = 'https://nexus.rapid.nx1.cloud';
    await navigator.clipboard.writeText(`${baseUrl}${endpoint.path}`);
    setCopiedId(endpoint.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'POST': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'PUT': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'DELETE': return 'bg-red-500/10 text-red-600 border-red-500/30';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'stable': return <Badge variant="default" className="text-xs">Stable</Badge>;
      case 'beta': return <Badge variant="secondary" className="text-xs">Beta</Badge>;
      case 'deprecated': return <Badge variant="outline" className="text-xs">Deprecated</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Data APIs</h2>
        <p className="text-muted-foreground">Browse and test available API endpoints</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={!selectedCategory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Endpoints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Available Endpoints ({filteredEndpoints.length})</span>
            <Button size="sm" variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Manage API Keys
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredEndpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className="group flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={`font-mono text-xs ${getMethodColor(endpoint.method)}`}
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono text-primary">{endpoint.path}</code>
                    {getStatusBadge(endpoint.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {endpoint.responseTime && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {endpoint.responseTime}
                      </span>
                    )}
                    {endpoint.rateLimit && (
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {endpoint.rateLimit}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {endpoint.category}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyEndpoint(endpoint)}
                  >
                    {copiedId === endpoint.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{endpoints.length}</div>
            <p className="text-sm text-muted-foreground">Total APIs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {endpoints.filter(e => e.status === 'stable').length}
            </div>
            <p className="text-sm text-muted-foreground">Stable</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {endpoints.filter(e => e.status === 'beta').length}
            </div>
            <p className="text-sm text-muted-foreground">Beta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}