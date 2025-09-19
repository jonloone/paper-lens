'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  BarChart3, 
  TrendingUp,
  Clock,
  Users,
  Zap,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileText,
  Settings,
  Activity,
  Link,
  Database,
  GitBranch,
  Shield,
  Layers,
  Package,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';

interface APIPattern {
  id: string;
  name: string;
  endpoint: string;
  status: 'production' | 'draft' | 'deprecated';
  type: 'api' | 'pipeline' | 'config';
  usage: {
    implementations: number;
    avgSetupTime: string;
    successRate: number;
  };
  basedOn: string[];
  lastUsed: string;
  sourcePattern: string;
  description?: string;
  rating?: number;
  reviews?: number;
}

interface TrinoView {
  name: string;
  schema: string;
  rowCount: number;
  lastUpdated: string;
  columns: string[];
  recommended: boolean;
}

export default function PatternsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationStep, setCreationStep] = useState<'select-pattern' | 'configure' | 'deploy' | 'success'>('select-pattern');
  const [selectedView, setSelectedView] = useState<TrinoView | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<APIPattern | null>(null);
  const [apiConfig, setApiConfig] = useState({
    name: '',
    endpoint: '',
    description: '',
    requireAuth: true,
    rateLimit: 1000,
    enableJson: true,
    enableCsv: true,
    enableParquet: false
  });
  const [deploymentProgress, setDeploymentProgress] = useState(0);

  // Mock data - API Patterns
  const apiPatterns: APIPattern[] = [
    {
      id: '1',
      name: 'Customer API Pattern',
      endpoint: '/api/v1/customer_*',
      status: 'production',
      type: 'api',
      usage: {
        implementations: 12,
        avgSetupTime: '8 minutes',
        successRate: 98.5
      },
      basedOn: ['customer_360', 'user_profile', 'account_details'],
      lastUsed: '2 days ago',
      sourcePattern: 'analytics.customer_template',
      description: 'Reusable pattern for customer data APIs with built-in caching and security',
      rating: 4.8,
      reviews: 8
    },
    {
      id: '2',
      name: 'Analytics API Pattern',
      endpoint: '/api/v1/analytics_*',
      status: 'production',
      type: 'api',
      usage: {
        implementations: 8,
        avgSetupTime: '10 minutes',
        successRate: 96.2
      },
      basedOn: ['revenue_analytics', 'usage_metrics'],
      lastUsed: 'yesterday',
      sourcePattern: 'analytics.metrics_template',
      description: 'Template for creating analytics APIs with aggregation support',
      rating: 4.6,
      reviews: 5
    },
    {
      id: '3',
      name: 'Real-time Stream Pattern',
      endpoint: '/api/v1/stream_*',
      status: 'production',
      type: 'api',
      usage: {
        implementations: 6,
        avgSetupTime: '15 minutes',
        successRate: 97.2
      },
      basedOn: ['user_events', 'transaction_stream', 'log_stream'],
      lastUsed: '6 hours ago',
      sourcePattern: 'events.stream_template',
      description: 'WebSocket-enabled real-time streaming pattern',
      rating: 4.7,
      reviews: 6
    },
    {
      id: '4',
      name: 'ML Feature API Pattern',
      endpoint: '/api/v1/features_*',
      status: 'draft',
      type: 'api',
      usage: {
        implementations: 2,
        avgSetupTime: '12 minutes',
        successRate: 94.0
      },
      basedOn: ['feature_store', 'model_features'],
      lastUsed: '1 week ago',
      sourcePattern: 'ml.feature_template',
      description: 'Pattern for exposing ML features with versioning',
      rating: 4.5,
      reviews: 3
    }
  ];

  // Mock data - Available Patterns/Templates
  const availablePatterns: TrinoView[] = [
    {
      name: 'analytics.customer_360',
      schema: 'analytics',
      rowCount: 2300000,
      lastUpdated: '2h ago',
      columns: ['customer_id', 'email', 'lifetime_value', 'segment'],
      recommended: true
    },
    {
      name: 'analytics.customer_segments',
      schema: 'analytics',
      rowCount: 450000,
      lastUpdated: '6h ago',
      columns: ['segment_id', 'segment_name', 'customer_count'],
      recommended: true
    },
    {
      name: 'raw.customers',
      schema: 'raw',
      rowCount: 12000000,
      lastUpdated: '1h ago',
      columns: ['id', 'email', 'created_at', 'updated_at'],
      recommended: false
    }
  ];

  const recentActivity = [
    { time: '15:23', action: 'customer_360 API created from Customer Pattern', user: 'john.doe', type: 'create' },
    { time: '15:15', action: 'Analytics Pattern updated with new aggregations', user: 'jane.smith', type: 'update' },
    { time: '15:02', action: 'Legacy patterns marked deprecated', user: 'admin', type: 'deprecate' },
    { time: '14:45', action: 'Stream Pattern rate limit optimized', user: 'john.doe', type: 'update' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'production': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'deprecated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'production': return 'default';
      case 'draft': return 'secondary';
      case 'deprecated': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api': return <Layers className="h-3 w-3" />;
      case 'pipeline': return <GitBranch className="h-3 w-3" />;
      case 'config': return <Settings className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  const handleCreateFromPattern = () => {
    setIsCreateModalOpen(true);
    setCreationStep('select-pattern');
  };

  const handleViewSelection = (view: TrinoView) => {
    setSelectedView(view);
    // Auto-fill configuration based on view
    const viewName = view.name.split('.')[1];
    setApiConfig({
      ...apiConfig,
      name: viewName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      endpoint: `/api/v1/${viewName}`,
      description: `API endpoint for ${viewName} data from ${view.schema} schema`
    });
  };

  const handlePatternSelection = (pattern: APIPattern) => {
    setSelectedPattern(pattern);
    setCreationStep('configure');
  };

  const handleDeploy = () => {
    setCreationStep('deploy');
    // Simulate deployment progress
    const interval = setInterval(() => {
      setDeploymentProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setCreationStep('success'), 500);
          return 100;
        }
        return prev + 20;
      });
    }, 600);
  };

  const filteredPatterns = apiPatterns.filter(pattern => {
    const matchesSearch = pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pattern.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || pattern.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light tracking-tight">Patterns</h1>
        <p className="text-muted-foreground mt-2">Discover and create reusable patterns for APIs, pipelines, and configurations</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patterns: customer, analytics, streaming..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patterns</SelectItem>
            <SelectItem value="production">Production Ready</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Button onClick={handleCreateFromPattern} className="gap-2">
              <Plus className="h-4 w-4" />
              Create from Pattern
            </Button>
            <Button variant="outline" className="gap-2">
              <Database className="h-4 w-4" />
              Browse All Patterns
            </Button>
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Pattern Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patterns Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredPatterns.map((pattern) => (
          <Card key={pattern.id} className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(pattern.status)}`} />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(pattern.type)}
                    <CardTitle className="text-base font-medium">{pattern.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs font-mono">{pattern.endpoint}</CardDescription>
                </div>
                <Badge variant={getStatusVariant(pattern.status)} className="text-xs">
                  {pattern.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span>Usage: {pattern.usage.implementations} implementations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  <span>Avg Setup: {pattern.usage.avgSetupTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Last used: {pattern.lastUsed}</span>
                </div>
              </div>

              {/* Success Rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{pattern.usage.successRate}%</span>
                </div>
                <Progress value={pattern.usage.successRate} className="h-2" />
              </div>

              {/* Based On */}
              {pattern.basedOn.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Based on:</p>
                  <div className="flex flex-wrap gap-1">
                    {pattern.basedOn.slice(0, 3).map((base, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {base}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating */}
              {pattern.rating && (
                <div className="flex items-center gap-2 text-xs">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{pattern.rating}/5</span>
                  <span className="text-muted-foreground">({pattern.reviews} reviews)</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="text-xs gap-1 flex-1"
                  onClick={() => handlePatternSelection(pattern)}
                >
                  <Zap className="h-3 w-3" />
                  Use Pattern
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <FileText className="h-3 w-3" />
                  Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground text-xs">{activity.time}</span>
                  {activity.type === 'create' && <Plus className="h-3 w-3 text-green-500" />}
                  {activity.type === 'update' && <Settings className="h-3 w-3 text-blue-500" />}
                  {activity.type === 'deprecate' && <AlertCircle className="h-3 w-3 text-red-500" />}
                  <span>{activity.action} by {activity.user}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Button variant="link" className="mt-2 p-0 h-auto text-xs">
            View All Activity
          </Button>
        </CardContent>
      </Card>

      {/* Pattern Creation Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl">
          {/* Step 1: Select Pattern */}
          {creationStep === 'select-pattern' && (
            <>
              <DialogHeader>
                <DialogTitle>Create from Pattern</DialogTitle>
                <DialogDescription>
                  Select a pattern to use as the foundation for your new API
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Tabs defaultValue="api" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="api">API Patterns</TabsTrigger>
                    <TabsTrigger value="pipeline">Pipeline Patterns</TabsTrigger>
                    <TabsTrigger value="config">Config Patterns</TabsTrigger>
                  </TabsList>
                  <TabsContent value="api" className="space-y-3 mt-4">
                    {apiPatterns.filter(p => p.type === 'api' && p.status !== 'deprecated').map((pattern) => (
                      <Card 
                        key={pattern.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handlePatternSelection(pattern)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{pattern.name}</h4>
                                {pattern.status === 'production' && (
                                  <Badge variant="default" className="text-xs">Production Ready</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{pattern.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>📊 {pattern.usage.implementations} uses</span>
                                <span>⚡ {pattern.usage.avgSetupTime} setup</span>
                                <span>✅ {pattern.usage.successRate}% success</span>
                                {pattern.rating && (
                                  <span>⭐ {pattern.rating}/5</span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                  <TabsContent value="pipeline" className="space-y-3 mt-4">
                    <div className="text-center text-muted-foreground py-8">
                      No pipeline patterns available yet
                    </div>
                  </TabsContent>
                  <TabsContent value="config" className="space-y-3 mt-4">
                    <div className="text-center text-muted-foreground py-8">
                      No configuration patterns available yet
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step 2: Configure */}
          {creationStep === 'configure' && (
            <>
              <DialogHeader>
                <DialogTitle>Configure: {selectedPattern?.name}</DialogTitle>
                <DialogDescription>
                  Customize the pattern for your specific use case
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="api-name">API Name</Label>
                    <Input
                      id="api-name"
                      placeholder="e.g., Customer Analytics API"
                      value={apiConfig.name}
                      onChange={(e) => setApiConfig({...apiConfig, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endpoint">Endpoint</Label>
                    <Input
                      id="endpoint"
                      placeholder="e.g., /api/v1/customer_analytics"
                      value={apiConfig.endpoint}
                      onChange={(e) => setApiConfig({...apiConfig, endpoint: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this API does..."
                      value={apiConfig.description}
                      onChange={(e) => setApiConfig({...apiConfig, description: e.target.value})}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">Pattern Configuration</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auth" className="text-sm">Require authentication</Label>
                      <Switch
                        id="auth"
                        checked={apiConfig.requireAuth}
                        onCheckedChange={(checked) => setApiConfig({...apiConfig, requireAuth: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Rate limiting</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={apiConfig.rateLimit}
                          onChange={(e) => setApiConfig({...apiConfig, rateLimit: parseInt(e.target.value)})}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">req/min</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">Response Format</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="json"
                        checked={apiConfig.enableJson}
                        onCheckedChange={(checked) => setApiConfig({...apiConfig, enableJson: checked as boolean})}
                      />
                      <Label htmlFor="json" className="text-sm">JSON</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="csv"
                        checked={apiConfig.enableCsv}
                        onCheckedChange={(checked) => setApiConfig({...apiConfig, enableCsv: checked as boolean})}
                      />
                      <Label htmlFor="csv" className="text-sm">CSV</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="parquet"
                        checked={apiConfig.enableParquet}
                        onCheckedChange={(checked) => setApiConfig({...apiConfig, enableParquet: checked as boolean})}
                      />
                      <Label htmlFor="parquet" className="text-sm">Parquet</Label>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-muted/30">
                  <h4 className="text-sm font-medium mb-2">Pattern Details</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Base Pattern: {selectedPattern?.sourcePattern}</div>
                    <div>Success Rate: {selectedPattern?.usage.successRate}%</div>
                    <div>Avg Setup Time: {selectedPattern?.usage.avgSetupTime}</div>
                    <div>Previous Implementations: {selectedPattern?.usage.implementations}</div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreationStep('select-pattern')}>
                  Back
                </Button>
                <Button variant="secondary" onClick={handleDeploy}>
                  Create as Draft
                </Button>
                <Button onClick={handleDeploy}>
                  Deploy Pattern
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step 3: Deploy */}
          {creationStep === 'deploy' && (
            <>
              <DialogHeader>
                <DialogTitle>Deploying Pattern: {apiConfig.name}</DialogTitle>
                <DialogDescription>
                  Creating your API from the {selectedPattern?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-8">
                <Progress value={deploymentProgress} className="w-full" />
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 text-sm ${deploymentProgress >= 20 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {deploymentProgress >= 20 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    Loading pattern template
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${deploymentProgress >= 40 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {deploymentProgress >= 40 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    Applying configuration
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${deploymentProgress >= 60 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {deploymentProgress >= 60 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    Setting up API routes
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${deploymentProgress >= 80 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {deploymentProgress >= 80 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    Configuring security policies
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${deploymentProgress >= 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {deploymentProgress >= 100 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    Running validation tests
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Estimated time: {selectedPattern?.usage.avgSetupTime || '10 minutes'}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" disabled>
                  View Deployment Logs
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step 4: Success */}
          {creationStep === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle>✅ Pattern Deployed Successfully!</DialogTitle>
                <DialogDescription>
                  Your API is now live and ready to use
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <h4 className="font-medium mb-2">{apiConfig.name} is now live:</h4>
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm bg-background px-2 py-1 rounded">
                      https://api.company.com{apiConfig.endpoint}
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Quick Test</h4>
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <code className="text-xs">GET {apiConfig.endpoint}?limit=10</code>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">Test Request</Button>
                      <Button size="sm" variant="outline">Copy curl command</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Next Steps</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="h-3 w-3" />
                      View Documentation
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Shield className="h-3 w-3" />
                      Configure Security
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <BarChart3 className="h-3 w-3" />
                      Monitor Performance
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Star className="h-3 w-3" />
                      Rate This Pattern
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreationStep('select-pattern');
                    setDeploymentProgress(0);
                  }}
                >
                  Done
                </Button>
                <Button onClick={() => {
                  setCreationStep('select-pattern');
                  setSelectedPattern(null);
                  setDeploymentProgress(0);
                }}>
                  Create Another
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}