'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Package, Shield, Key, Users, Star, Download, Eye, Lock,
  CheckCircle, XCircle, AlertTriangle, TrendingUp, Calendar,
  Share2, Database, Brain, Bot, Sparkles, Search, Filter,
  ShoppingCart, Tag, Award, ArrowRight, Clock, BarChart3,
  FileText, Settings, UserCheck, Globe, Zap, Activity
} from 'lucide-react';

interface DataProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  owner: string;
  version: string;
  quality_score: number;
  usage_count: number;
  rating: number;
  tags: string[];
  access_level: 'public' | 'restricted' | 'private';
  certification: 'gold' | 'silver' | 'bronze' | null;
  last_updated: Date;
  dependencies: string[];
  cost_per_query?: number;
  sla?: string;
  documentation_url?: string;
}

interface AccessRequest {
  id: string;
  product_id: string;
  product_name: string;
  requester: string;
  requested_at: Date;
  status: 'pending' | 'approved' | 'rejected';
  justification: string;
  approver?: string;
  approved_at?: Date;
}

export default function GovernSharePage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'marketplace';
  
  const [dataProducts] = useState<DataProduct[]>([
    {
      id: 'dp-001',
      name: 'Customer 360 View',
      description: 'Unified customer profile with purchase history, interactions, and predictive scores',
      category: 'Customer Analytics',
      owner: 'Marketing Team',
      version: '2.3.1',
      quality_score: 96,
      usage_count: 1247,
      rating: 4.8,
      tags: ['customer', 'profile', 'analytics', 'ml-enriched'],
      access_level: 'restricted',
      certification: 'gold',
      last_updated: new Date(),
      dependencies: ['sales_db', 'crm_system'],
      cost_per_query: 0.05,
      sla: '< 100ms p95',
      documentation_url: '/docs/customer-360'
    },
    {
      id: 'dp-002',
      name: 'Revenue Forecasting Model',
      description: 'ML-powered revenue predictions with confidence intervals and scenario analysis',
      category: 'Financial Analytics',
      owner: 'Finance Team',
      version: '1.5.0',
      quality_score: 92,
      usage_count: 523,
      rating: 4.6,
      tags: ['revenue', 'forecasting', 'ml-model', 'finance'],
      access_level: 'private',
      certification: 'gold',
      last_updated: new Date(Date.now() - 86400000),
      dependencies: ['financial_db', 'market_data'],
      cost_per_query: 0.12,
      sla: '< 500ms p95'
    },
    {
      id: 'dp-003',
      name: 'Product Recommendation API',
      description: 'Real-time product recommendations based on user behavior and preferences',
      category: 'ML Services',
      owner: 'Data Science Team',
      version: '3.1.0',
      quality_score: 88,
      usage_count: 3421,
      rating: 4.5,
      tags: ['recommendations', 'api', 'real-time', 'personalization'],
      access_level: 'public',
      certification: 'silver',
      last_updated: new Date(),
      dependencies: ['user_events', 'product_catalog'],
      cost_per_query: 0.02,
      sla: '< 50ms p99'
    }
  ]);

  const [accessRequests] = useState<AccessRequest[]>([
    {
      id: 'req-001',
      product_id: 'dp-001',
      product_name: 'Customer 360 View',
      requester: 'john.doe@company.com',
      requested_at: new Date(),
      status: 'pending',
      justification: 'Need for Q4 marketing campaign analysis'
    },
    {
      id: 'req-002',
      product_id: 'dp-002',
      product_name: 'Revenue Forecasting Model',
      requester: 'sarah.smith@company.com',
      requested_at: new Date(Date.now() - 3600000),
      status: 'approved',
      justification: 'Board presentation preparation',
      approver: 'cfo@company.com',
      approved_at: new Date(Date.now() - 1800000)
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);

  const getCertificationIcon = (certification: string | null) => {
    switch (certification) {
      case 'gold': return <Award className="w-4 h-4 text-yellow-500" />;
      case 'silver': return <Award className="w-4 h-4 text-gray-400" />;
      case 'bronze': return <Award className="w-4 h-4 text-orange-600" />;
      default: return null;
    }
  };

  const getAccessIcon = (level: string) => {
    switch (level) {
      case 'public': return <Globe className="w-4 h-4 text-green-500" />;
      case 'restricted': return <Lock className="w-4 h-4 text-yellow-500" />;
      case 'private': return <Lock className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const filteredProducts = dataProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Share2 className="w-8 h-8" />
            Govern & Share
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover, share, and govern data products across your organization
          </p>
        </div>
        <Button className="bg-primary">
          <Package className="w-4 h-4 mr-2" />
          Publish Product
        </Button>
      </div>

      {/* Marketplace Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{dataProducts.length}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">342</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Quality</p>
                <p className="text-2xl font-bold">92%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certified</p>
                <p className="text-2xl font-bold">67%</p>
              </div>
              <Award className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplace">Data Marketplace</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="share">Share & Collaborate</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search data products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Customer Analytics">Customer Analytics</SelectItem>
                    <SelectItem value="Financial Analytics">Financial Analytics</SelectItem>
                    <SelectItem value="ML Services">ML Services</SelectItem>
                    <SelectItem value="Operational">Operational</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProduct(product)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {product.name}
                        {getCertificationIcon(product.certification)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        v{product.version} • {product.owner}
                      </p>
                    </div>
                    {getAccessIcon(product.access_level)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {product.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{product.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Quality</p>
                      <p className="font-medium">{product.quality_score}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Usage</p>
                      <p className="font-medium">{product.usage_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rating</p>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span className="font-medium">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          {/* Access Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Access Requests</CardTitle>
              <CardDescription>
                Review and approve access requests for data products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessRequests.filter(r => r.status === 'pending').map(request => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{request.requester}</span>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Requesting access to: <span className="font-medium">{request.product_name}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Justification:</span> {request.justification}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested {new Date(request.requested_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                        <Button size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Access Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Access Policies</CardTitle>
              <CardDescription>
                Manage data product access policies and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Role-based access control is enabled for all data products</span>
                      <Button size="sm" variant="secondary">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="font-medium">Public Products</p>
                        <p className="text-2xl font-bold">12</p>
                        <Progress value={30} className="h-2" />
                        <p className="text-xs text-muted-foreground">Available to all users</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="font-medium">Restricted Products</p>
                        <p className="text-2xl font-bold">28</p>
                        <Progress value={70} className="h-2" />
                        <p className="text-xs text-muted-foreground">Requires approval</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {/* Compliance Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
              <CardDescription>
                Monitor data governance and regulatory compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">GDPR Compliance</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <Progress value={95} className="h-2" />
                  <p className="text-xs">95% compliant</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Data Classification</span>
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </div>
                  <Progress value={78} className="h-2" />
                  <p className="text-xs">78% classified</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Audit Coverage</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs">100% logged</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Lineage */}
          <Card>
            <CardHeader>
              <CardTitle>Data Lineage & Impact Analysis</CardTitle>
              <CardDescription>
                Track data flow and dependencies across products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Activity className="w-4 h-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>23 data products have updated lineage information this week</span>
                    <Button size="sm" variant="secondary">
                      <Eye className="w-4 h-4 mr-2" />
                      View Lineage Graph
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          {/* Collaboration Hub */}
          <Card>
            <CardHeader>
              <CardTitle>Collaboration Hub</CardTitle>
              <CardDescription>
                Share insights and collaborate on data products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Sparkles className="w-4 h-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Collaboration Feature</p>
                        <p className="text-sm">Real-time collaborative query editing now available</p>
                      </div>
                      <Button size="sm">Try Now</Button>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card className="cursor-pointer">
                    <CardContent className="pt-6">
                      <Users className="w-8 h-8 mb-2" />
                      <p className="font-medium">Team Workspaces</p>
                      <p className="text-sm text-muted-foreground">5 active</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer">
                    <CardContent className="pt-6">
                      <FileText className="w-8 h-8 mb-2" />
                      <p className="font-medium">Shared Notebooks</p>
                      <p className="text-sm text-muted-foreground">12 notebooks</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Shares */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Shares</CardTitle>
              <CardDescription>
                Latest data products shared across teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dataProducts.slice(0, 3).map(product => (
                  <div key={product.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Shared by {product.owner} • {new Date(product.last_updated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}