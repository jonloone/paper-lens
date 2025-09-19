'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataLineageVisualization } from '@/components/DataLineageVisualization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DlgDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Search, Package, Globe, Server, Cloud, Database,
  Zap, CheckCircle, AlertCircle, Clock, TrendingUp,
  Plus, Settings, Eye, ExternalLink, Download,
  Layers, Activity, Shield, Code, FileJson,
  ArrowRight, Filter, Grid, List, Copy,
  Upload, RefreshCw, Play, Star, BookOpen,
  Users, Lock, Key, Info, AlertTriangle, BarChart3,
  Network, Sparkles, Terminal, FileText,
  CheckCheck, TrendingDown, Gauge, GitBranch
} from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'marketplace';
  
  // State
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showLineage, setShowLineage] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/api/products?';
      if (selectedCategory !== 'all') url += `category=${selectedCategory}&`;
      if (selectedStatus !== 'all') url += `status=${selectedStatus}&`;
      if (searchQuery) url += `search=${searchQuery}&`;
      
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to product
  const subscribeToProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const response = await fetch(`/api/products/${selectedProduct.id}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriber: 'demo-user',
          purpose: 'Development and testing'
        })
      });
      
      const data = await response.json();
      setApiKey(data.apiKey);
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  // Category icons
  const categoryIcons: Record<string, any> = {
    dataset: Database,
    api: Zap,
    'ml-feature': Sparkles,
    report: FileText
  };

  // Quality color
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Filtered products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Products</h2>
          <p className="text-muted-foreground">
            Discover, subscribe, and consume quality-validated data products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchProducts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => router.push('/process')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} defaultValue="marketplace" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="api-catalog">API Catalog</TabsTrigger>
          <TabsTrigger value="ml-features">ML Features</TabsTrigger>
          <TabsTrigger value="subscriptions">My Subscriptions</TabsTrigger>
        </TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search data products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="dataset">Datasets</SelectItem>
                <SelectItem value="api">APIs</SelectItem>
                <SelectItem value="ml-feature">ML Features</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">{products.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active APIs</p>
                    <p className="text-2xl font-bold">
                      {products.filter(p => p.category === 'api' && p.status === 'active').length}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Quality</p>
                    <p className="text-2xl font-bold">
                      {products.length > 0 
                        ? Math.round(products.reduce((acc, p) => acc + (p.quality?.score || 0), 0) / products.length)
                        : 0}%
                    </p>
                  </div>
                  <Gauge className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">
                      {products.reduce((acc, p) => acc + (p.usage?.monthlyRequests || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid/List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-sm text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const Icon = categoryIcons[product.category] || Package;
                return (
                  <Card 
                    key={product.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowDetails(true);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-muted rounded-lg">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{product.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{product.owner}</p>
                          </div>
                        </div>
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                          {product.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {product.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Quality Score</span>
                          <div className="flex items-center gap-2">
                            <Progress value={product.quality?.score || 0} className="w-20 h-2" />
                            <span className={cn("text-sm font-medium", getQualityColor(product.quality?.score || 0))}>
                              {product.quality?.score || 0}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Monthly Usage</span>
                          <span className="text-sm font-medium">
                            {(product.usage?.monthlyRequests || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Consumers</span>
                          <span className="text-sm font-medium">
                            {product.usage?.subscribers || 0}
                          </span>
                        </div>
                      </div>

                      <Separator className="my-3" />
                      
                      <div className="flex flex-wrap gap-1">
                        {product.tags?.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => {
                const Icon = categoryIcons[product.category] || Package;
                return (
                  <Card 
                    key={product.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowDetails(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{product.name}</h3>
                            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                              {product.status}
                            </Badge>
                            <Badge variant="outline">{product.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className={cn("font-medium", getQualityColor(product.quality?.score || 0))}>
                              {product.quality?.score || 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">Quality</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">
                              {(product.usage?.monthlyRequests || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Requests</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{product.usage?.subscribers || 0}</p>
                            <p className="text-xs text-muted-foreground">Consumers</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* API Catalog Tab */}
        <TabsContent value="api-catalog" className="space-y-4">
          <div className="grid gap-4">
            {filteredProducts
              .filter(p => p.category === 'api')
              .map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowSubscribe(true);
                        }}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Get API Key
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Endpoints</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">GET</Badge>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {product.technical?.endpoint || '/api/v1/data'}
                            </code>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Performance</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Availability</span>
                            <span>{product.technical?.sla?.availability || 99.9}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Latency</span>
                            <span>{product.technical?.sla?.latency || 100}ms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* ML Features Tab */}
        <TabsContent value="ml-features" className="space-y-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>ML Feature Store</AlertTitle>
            <AlertDescription>
              Access production-ready features for machine learning models
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4">
            {filteredProducts
              .filter(p => p.category === 'ml-feature')
              .map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Feature Count: <span className="font-medium text-foreground">
                            {product.technical?.schema ? Object.keys(product.technical.schema).length : 0}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Update Frequency: <span className="font-medium text-foreground">Hourly</span>
                        </p>
                      </div>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Your Subscriptions</AlertTitle>
            <AlertDescription>
              Manage your active data product subscriptions and API keys
            </AlertDescription>
          </Alert>
          
          <div className="text-center py-12 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active subscriptions</p>
            <p className="text-sm mt-2">Subscribe to data products to see them here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DlgDescription>{selectedProduct?.description}</DlgDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6 mt-4">
              {/* Quality Metrics */}
              <div>
                <h3 className="text-sm font-medium mb-3">Quality Metrics</h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(selectedProduct.quality || {}).map(([key, value]: [string, any]) => {
                    if (key === 'score' || key === 'lastValidated') return null;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground capitalize">
                            {key}
                          </span>
                          <span className={cn(
                            "text-xs font-medium",
                            typeof value === 'number' && value > 90 ? "text-green-600" :
                            typeof value === 'number' && value > 70 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {typeof value === 'number' ? `${value}%` : value}
                          </span>
                        </div>
                        <Progress value={typeof value === 'number' ? value : 0} className="h-1" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technical Details */}
              <div>
                <h3 className="text-sm font-medium mb-3">Technical Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format</span>
                    <span>{selectedProduct.technical?.format?.join(', ') || 'JSON'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Update Frequency</span>
                    <span>Real-time</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Authentication</span>
                    <span>{selectedProduct.access?.authentication || 'API Key'}</span>
                  </div>
                </div>
              </div>

              {/* Lineage */}
              <div>
                <h3 className="text-sm font-medium mb-3">Data Lineage</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Sources</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedProduct.lineage?.sources || []).map((source: string) => (
                        <Badge key={source} variant="secondary" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Transformations</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedProduct.lineage?.transformations || []).map((transform: string) => (
                        <Badge key={transform} variant="outline" className="text-xs">
                          {transform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLineage(true)}>
                  <Network className="h-4 w-4 mr-2" />
                  View Full Lineage
                </Button>
                <Button onClick={() => setShowSubscribe(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscribe Modal */}
      <Dialog open={showSubscribe} onOpenChange={setShowSubscribe}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to {selectedProduct?.name}</DialogTitle>
            <DlgDescription>
              Get access to this data product with an API key
            </DlgDescription>
          </DialogHeader>
          
          {apiKey ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Subscription Successful!</AlertTitle>
                <AlertDescription>
                  Your API key has been generated. Keep it secure.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input value={apiKey} readOnly className="font-mono text-xs" />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(apiKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Example Usage</Label>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`curl -H "Authorization: Bearer ${apiKey}" \\
  https://api.nexusone.com${selectedProduct?.technical?.endpoint || '/api/v1/data'}`}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input 
                  id="purpose" 
                  placeholder="What will you use this data for?"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team">Team/Project</Label>
                <Input 
                  id="team" 
                  placeholder="Your team or project name"
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSubscribe(false)}>
                  Cancel
                </Button>
                <Button onClick={subscribeToProduct}>
                  Generate API Key
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Data Lineage Modal */}
      <Dialog open={showLineage} onOpenChange={setShowLineage}>
        <DialogContent className="max-w-7xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Data Lineage - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <DataLineageVisualization 
              entityId={selectedProduct?.id ? `product-${selectedProduct.id}` : undefined}
              height="calc(70vh - 100px)"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}