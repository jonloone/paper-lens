'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TechIcon } from '@/components/ui/tech-icon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Search, ShoppingCart, Star, TrendingUp, Clock, Users, Database, Globe, Lock,
  BarChart3, FileText, Link2, Shield, Activity, AlertCircle, CheckCircle,
  Package, Sparkles, ArrowRight, ChevronRight, ExternalLink, Download,
  Mail, MessageSquare, ThumbsUp, Info, GitBranch, Layers, Zap, Server,
  DollarSign, Calendar, RefreshCw, Filter, Grid, List, BookOpen, Key,
  Bell, Share2, Heart, Award, Target, Briefcase, ShoppingBag, Truck,
  PieChart, LineChart, TrendingDown, Hash, Code, Terminal, Cpu, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for DataHub integration
interface DataProduct {
  id: string;
  urn: string; // DataHub URN
  name: string;
  displayName: string;
  description: string;
  category: string;
  businessContext: {
    purpose: string;
    useCases: string[];
    businessValue: string;
  };
  owner: {
    name: string;
    email: string;
    team: string;
  };
  technicalContact: {
    name: string;
    email: string;
  };
  quality: {
    score: number;
    completeness: number;
    accuracy: number;
    freshness: number;
    uniqueness: number;
    lastUpdated: Date;
  };
  freshness: {
    schedule: string;
    lastRefresh: Date;
    nextRefresh: Date;
    sla: string;
  };
  access: {
    methods: AccessMethod[];
    authentication: string;
    permissions: string[];
  };
  usage: {
    dailyQueries: number;
    uniqueUsers: number;
    topConsumers: Consumer[];
    trend: 'up' | 'down' | 'stable';
  };
  lineage: {
    sources: DataSource[];
    transformations: string[];
    outputs: string[];
  };
  sla: {
    uptime: number;
    latency: number;
    errorRate: number;
  };
  tags: string[];
  status: 'active' | 'deprecated' | 'beta' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

interface AccessMethod {
  type: 'api' | 'sql' | 'file' | 'bi' | 'stream';
  name: string;
  endpoint?: string;
  documentation?: string;
  sampleQuery?: string;
  rateLimit?: string;
}

interface Consumer {
  name: string;
  team: string;
  usage: number;
  lastAccessed: Date;
}

interface DataSource {
  name: string;
  type: string;
  freshness: string;
}

// Mock data for demonstration (would come from DataHub GraphQL API)
const mockDataProducts: DataProduct[] = [
  {
    id: 'dp-001',
    urn: 'urn:li:dataProduct:customer-360',
    name: 'customer_360_golden_record',
    displayName: 'Customer 360 Golden Record',
    description: 'Unified customer data with behavioral insights combining CRM, e-commerce, and support interactions',
    category: 'Customer & Marketing',
    businessContext: {
      purpose: 'Single source of truth for customer information',
      useCases: [
        'Customer segmentation for marketing campaigns',
        'Personalization for web and mobile experiences',
        'Customer lifetime value analysis',
        'Support ticket prioritization'
      ],
      businessValue: 'Enables personalized customer experiences and data-driven marketing decisions'
    },
    owner: {
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      team: 'Marketing Analytics'
    },
    technicalContact: {
      name: 'Data Engineering Team',
      email: 'data-eng@company.com'
    },
    quality: {
      score: 96,
      completeness: 99.2,
      accuracy: 96.8,
      freshness: 95.5,
      uniqueness: 97.1,
      lastUpdated: new Date()
    },
    freshness: {
      schedule: 'Every 6 hours',
      lastRefresh: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextRefresh: new Date(Date.now() + 4 * 60 * 60 * 1000),
      sla: '6 hours'
    },
    access: {
      methods: [
        {
          type: 'api',
          name: 'REST API',
          endpoint: 'https://api.company.com/v1/customers',
          documentation: 'https://docs.company.com/api/customers',
          rateLimit: '1000 requests/hour'
        },
        {
          type: 'sql',
          name: 'Trino Query',
          endpoint: 'analytics.customer_360',
          sampleQuery: 'SELECT * FROM analytics.customer_360 WHERE segment = \'high_value\''
        },
        {
          type: 'bi',
          name: 'Tableau',
          endpoint: 'Customer Analytics Workspace'
        }
      ],
      authentication: 'API Key',
      permissions: ['read', 'export']
    },
    usage: {
      dailyQueries: 4248,
      uniqueUsers: 67,
      topConsumers: [
        { name: 'Marketing Automation', team: 'Marketing', usage: 47, lastAccessed: new Date() },
        { name: 'Customer Success Platform', team: 'Support', usage: 23, lastAccessed: new Date() },
        { name: 'Sales Analytics', team: 'Sales', usage: 18, lastAccessed: new Date() }
      ],
      trend: 'up'
    },
    lineage: {
      sources: [
        { name: 'Salesforce CRM', type: 'API', freshness: 'Real-time' },
        { name: 'Shopify Store', type: 'Webhook', freshness: '15 minutes' },
        { name: 'Support System', type: 'Database', freshness: 'Hourly' }
      ],
      transformations: [
        'Entity resolution with 95% confidence',
        'Lifetime value calculation',
        'Segmentation rules application',
        'PII masking for compliance'
      ],
      outputs: ['Data Lake', 'API Gateway', 'BI Tools']
    },
    sla: {
      uptime: 99.7,
      latency: 1200,
      errorRate: 0.3
    },
    tags: ['customer', 'golden-record', 'high-priority', 'gdpr-compliant'],
    status: 'active',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 'dp-002',
    urn: 'urn:li:dataProduct:sales-performance',
    name: 'sales_performance_analytics',
    displayName: 'Sales Performance Analytics',
    description: 'Real-time sales metrics, forecasting, and territory performance analysis',
    category: 'Sales & Revenue',
    businessContext: {
      purpose: 'Track and analyze sales performance across regions and products',
      useCases: [
        'Daily/weekly/monthly sales reporting',
        'Territory and rep performance tracking',
        'Pipeline health monitoring',
        'Revenue forecasting'
      ],
      businessValue: 'Drives sales strategy and enables data-driven territory management'
    },
    owner: {
      name: 'Michael Rodriguez',
      email: 'michael.r@company.com',
      team: 'Sales Operations'
    },
    technicalContact: {
      name: 'Analytics Engineering',
      email: 'analytics@company.com'
    },
    quality: {
      score: 98,
      completeness: 99.8,
      accuracy: 98.2,
      freshness: 97.5,
      uniqueness: 99.9,
      lastUpdated: new Date()
    },
    freshness: {
      schedule: 'Daily at 6 AM',
      lastRefresh: new Date(Date.now() - 8 * 60 * 60 * 1000),
      nextRefresh: new Date(Date.now() + 16 * 60 * 60 * 1000),
      sla: '24 hours'
    },
    access: {
      methods: [
        {
          type: 'api',
          name: 'GraphQL API',
          endpoint: 'https://api.company.com/graphql',
          documentation: 'https://docs.company.com/graphql/sales'
        },
        {
          type: 'sql',
          name: 'SQL Views',
          endpoint: 'marts.sales_daily'
        },
        {
          type: 'bi',
          name: 'PowerBI',
          endpoint: 'Sales Performance Dashboard'
        }
      ],
      authentication: 'OAuth 2.0',
      permissions: ['read', 'subscribe']
    },
    usage: {
      dailyQueries: 2134,
      uniqueUsers: 43,
      topConsumers: [
        { name: 'Sales Dashboard', team: 'Sales Ops', usage: 52, lastAccessed: new Date() },
        { name: 'Executive Reports', team: 'Leadership', usage: 28, lastAccessed: new Date() },
        { name: 'Commission Calculator', team: 'Finance', usage: 20, lastAccessed: new Date() }
      ],
      trend: 'stable'
    },
    lineage: {
      sources: [
        { name: 'Salesforce', type: 'API', freshness: 'Real-time' },
        { name: 'SAP ERP', type: 'Database', freshness: 'Daily' },
        { name: 'Product Catalog', type: 'API', freshness: 'Weekly' }
      ],
      transformations: [
        'Revenue aggregation by territory',
        'Commission calculation',
        'Forecast modeling',
        'YoY comparison metrics'
      ],
      outputs: ['Data Warehouse', 'API', 'Email Reports']
    },
    sla: {
      uptime: 100,
      latency: 800,
      errorRate: 0.1
    },
    tags: ['sales', 'revenue', 'executive-priority', 'financial'],
    status: 'active',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: 'dp-003',
    urn: 'urn:li:dataProduct:inventory-optimization',
    name: 'inventory_optimization_metrics',
    displayName: 'Inventory Optimization Metrics',
    description: 'Real-time inventory levels, supply chain health, and demand forecasting',
    category: 'Operations & Supply Chain',
    businessContext: {
      purpose: 'Optimize inventory levels and prevent stockouts',
      useCases: [
        'Inventory level monitoring',
        'Demand forecasting',
        'Supplier performance tracking',
        'Warehouse optimization'
      ],
      businessValue: 'Reduces carrying costs and improves customer satisfaction through availability'
    },
    owner: {
      name: 'Lisa Wang',
      email: 'lisa.wang@company.com',
      team: 'Supply Chain'
    },
    technicalContact: {
      name: 'Operations Analytics',
      email: 'ops-analytics@company.com'
    },
    quality: {
      score: 94,
      completeness: 97.3,
      accuracy: 95.1,
      freshness: 93.8,
      uniqueness: 98.7,
      lastUpdated: new Date()
    },
    freshness: {
      schedule: 'Every 2 hours',
      lastRefresh: new Date(Date.now() - 1 * 60 * 60 * 1000),
      nextRefresh: new Date(Date.now() + 1 * 60 * 60 * 1000),
      sla: '2 hours'
    },
    access: {
      methods: [
        {
          type: 'stream',
          name: 'Kafka Stream',
          endpoint: 'inventory-events',
          documentation: 'https://docs.company.com/streaming/inventory'
        },
        {
          type: 'api',
          name: 'REST API',
          endpoint: 'https://api.company.com/v1/inventory',
          rateLimit: '500 requests/hour'
        },
        {
          type: 'file',
          name: 'S3 Export',
          endpoint: 's3://data-exports/inventory/'
        }
      ],
      authentication: 'Service Account',
      permissions: ['read', 'stream']
    },
    usage: {
      dailyQueries: 8934,
      uniqueUsers: 89,
      topConsumers: [
        { name: 'WMS Integration', team: 'Warehouse', usage: 45, lastAccessed: new Date() },
        { name: 'Procurement System', team: 'Purchasing', usage: 32, lastAccessed: new Date() },
        { name: 'Store Operations', team: 'Retail', usage: 23, lastAccessed: new Date() }
      ],
      trend: 'up'
    },
    lineage: {
      sources: [
        { name: 'WMS', type: 'Database', freshness: 'Real-time' },
        { name: 'ERP System', type: 'API', freshness: 'Hourly' },
        { name: 'POS Systems', type: 'Stream', freshness: 'Real-time' }
      ],
      transformations: [
        'Inventory level aggregation',
        'Demand forecasting model',
        'Safety stock calculation',
        'Lead time analysis'
      ],
      outputs: ['Stream', 'API', 'Data Lake']
    },
    sla: {
      uptime: 99.5,
      latency: 2500,
      errorRate: 0.5
    },
    tags: ['inventory', 'supply-chain', 'real-time', 'operational'],
    status: 'active',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

export default function DataMarketplace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popularity');
  
  // Categories derived from data products
  const categories = [
    { id: 'all', name: 'All Categories', count: mockDataProducts.length },
    { id: 'customer', name: 'Customer & Marketing', count: 1, icon: Users },
    { id: 'sales', name: 'Sales & Revenue', count: 1, icon: DollarSign },
    { id: 'operations', name: 'Operations & Supply Chain', count: 1, icon: Truck },
    { id: 'finance', name: 'Finance & Accounting', count: 0, icon: Briefcase },
    { id: 'product', name: 'Product & Engineering', count: 0, icon: Package }
  ];
  
  // Filter products based on search and category
  const filteredProducts = mockDataProducts.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      product.category.toLowerCase().includes(selectedCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return b.usage.dailyQueries - a.usage.dailyQueries;
      case 'quality':
        return b.quality.score - a.quality.score;
      case 'recent':
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case 'alphabetical':
        return a.displayName.localeCompare(b.displayName);
      default:
        return 0;
    }
  });
  
  useEffect(() => {
    if (productId) {
      const product = mockDataProducts.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [productId]);
  
  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };
  
  const getQualityColor = (score: number) => {
    if (score >= 95) return 'text-green-500';
    if (score >= 85) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'beta': return 'secondary';
      case 'deprecated': return 'destructive';
      case 'maintenance': return 'outline';
      default: return 'default';
    }
  };
  
  // Product detail view
  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(null);
                    router.push('/marketplace');
                  }}
                >
                  ← Back to Marketplace
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Badge variant={getStatusBadgeVariant(selectedProduct.status)}>
                  {selectedProduct.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFavorite(selectedProduct.id)}
                >
                  {favorites.includes(selectedProduct.id) ? (
                    <Heart className="h-4 w-4 fill-current" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                  Favorite
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Dialog open={showAccessDialog} onValueChange={setShowAccessDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Key className="h-4 w-4 mr-2" />
                      Get Access
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Access to {selectedProduct.displayName}</DialogTitle>
                      <DialogDescription>
                        Fill out this form to request access to this data product. The data owner will review your request.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Business Justification</Label>
                        <textarea 
                          className="w-full mt-2 p-2 border rounded-md"
                          rows={3}
                          placeholder="Explain why you need access to this data..."
                        />
                      </div>
                      <div>
                        <Label>Access Type</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select access type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="api">API Access</SelectItem>
                            <SelectItem value="sql">SQL Access</SelectItem>
                            <SelectItem value="bi">BI Tool Access</SelectItem>
                            <SelectItem value="export">File Export</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAccessDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setShowAccessDialog(false)}>
                        Submit Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Details */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="col-span-8 space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-light mb-2">{selectedProduct.displayName}</h1>
                <p className="text-muted-foreground text-lg">{selectedProduct.description}</p>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedProduct.usage.uniqueUsers} active users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedProduct.usage.dailyQueries.toLocaleString()} queries/day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Updates {selectedProduct.freshness.schedule.toLowerCase()}</span>
                  </div>
                </div>
              </div>
              
              {/* Business Context */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Business Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Purpose</Label>
                    <p className="mt-1">{selectedProduct.businessContext.purpose}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Business Use Cases</Label>
                    <ul className="mt-2 space-y-1">
                      {selectedProduct.businessContext.useCases.map((useCase, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Business Value</Label>
                    <p className="mt-1 text-sm">{selectedProduct.businessContext.businessValue}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Access Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Access Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="api">
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="api">API</TabsTrigger>
                      <TabsTrigger value="sql">SQL</TabsTrigger>
                      <TabsTrigger value="bi">BI Tools</TabsTrigger>
                      <TabsTrigger value="export">Export</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="api" className="space-y-4">
                      {selectedProduct.access.methods
                        .filter(m => m.type === 'api')
                        .map((method, idx) => (
                          <div key={idx} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{method.name}</h4>
                              <Badge variant="outline">{method.rateLimit}</Badge>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-md">
                              <code className="text-xs">
                                {method.endpoint}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                API Documentation
                              </Button>
                              <Button variant="outline" size="sm">
                                <Key className="h-4 w-4 mr-2" />
                                Request API Key
                              </Button>
                              <Button variant="outline" size="sm">
                                <Terminal className="h-4 w-4 mr-2" />
                                Try Interactive
                              </Button>
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                    
                    <TabsContent value="sql" className="space-y-4">
                      {selectedProduct.access.methods
                        .filter(m => m.type === 'sql')
                        .map((method, idx) => (
                          <div key={idx} className="space-y-3">
                            <h4 className="font-medium">{method.name}</h4>
                            <div className="bg-muted/50 p-3 rounded-md">
                              <code className="text-xs whitespace-pre">
                                {method.sampleQuery}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Database className="h-4 w-4 mr-2" />
                                Copy Connection String
                              </Button>
                              <Button variant="outline" size="sm">
                                <Shield className="h-4 w-4 mr-2" />
                                Request Database Access
                              </Button>
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                    
                    <TabsContent value="bi" className="space-y-4">
                      {selectedProduct.access.methods
                        .filter(m => m.type === 'bi')
                        .map((method, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{method.name}</h4>
                              <p className="text-sm text-muted-foreground">{method.endpoint}</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open in {method.name}
                            </Button>
                          </div>
                        ))}
                    </TabsContent>
                    
                    <TabsContent value="export" className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">File Export Options</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Daily exports available in CSV, Parquet, and JSON formats
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Browse Files
                          </Button>
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Export
                          </Button>
                          <Button variant="outline" size="sm">
                            <Bell className="h-4 w-4 mr-2" />
                            Export Notifications
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              {/* Data Lineage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Data Lineage & Transformations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Source Systems</Label>
                    <div className="mt-2 space-y-2">
                      {selectedProduct.lineage.sources.map((source, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <TechIcon technology={source.name} size="xs" variant="branded" />
                            <span className="text-sm font-medium">{source.name}</span>
                            <Badge variant="outline" className="text-xs">{source.type}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{source.freshness}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Key Transformations</Label>
                    <ul className="mt-2 space-y-1">
                      {selectedProduct.lineage.transformations.map((transform, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-sm">{transform}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <GitBranch className="h-4 w-4 mr-2" />
                    View Full Lineage in DataHub
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="col-span-4 space-y-6">
              {/* Quality & Freshness */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Data Quality & Freshness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Quality</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-2xl font-bold", getQualityColor(selectedProduct.quality.score))}>
                        {selectedProduct.quality.score}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Completeness</span>
                      <span>{selectedProduct.quality.completeness}%</span>
                    </div>
                    <Progress value={selectedProduct.quality.completeness} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Accuracy</span>
                      <span>{selectedProduct.quality.accuracy}%</span>
                    </div>
                    <Progress value={selectedProduct.quality.accuracy} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Freshness</span>
                      <span>{selectedProduct.quality.freshness}%</span>
                    </div>
                    <Progress value={selectedProduct.quality.freshness} className="h-2" />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Refresh</span>
                      <span>{new Date(selectedProduct.freshness.lastRefresh).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next Refresh</span>
                      <span>{new Date(selectedProduct.freshness.nextRefresh).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Update Frequency</span>
                      <Badge variant="outline">{selectedProduct.freshness.schedule}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* SLA & Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">SLA & Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Uptime</span>
                    </div>
                    <span className="font-medium">{selectedProduct.sla.uptime}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Avg Latency</span>
                    </div>
                    <span className="font-medium">{selectedProduct.sla.latency}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Error Rate</span>
                    </div>
                    <span className="font-medium">{selectedProduct.sla.errorRate}%</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Ownership */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ownership & Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Business Owner</Label>
                    <div className="mt-1">
                      <p className="text-sm font-medium">{selectedProduct.owner.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedProduct.owner.team}</p>
                    </div>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1">
                      <Mail className="h-3 w-3 mr-1" />
                      {selectedProduct.owner.email}
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Technical Contact</Label>
                    <div className="mt-1">
                      <p className="text-sm font-medium">{selectedProduct.technicalContact.name}</p>
                    </div>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1">
                      <Mail className="h-3 w-3 mr-1" />
                      {selectedProduct.technicalContact.email}
                    </Button>
                  </div>
                  
                  <Button variant="outline" className="w-full" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
              
              {/* Usage Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Daily Queries</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{selectedProduct.usage.dailyQueries.toLocaleString()}</span>
                      {selectedProduct.usage.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {selectedProduct.usage.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unique Users</span>
                    <span className="font-medium">{selectedProduct.usage.uniqueUsers}</span>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Top Consumers</Label>
                    <div className="mt-2 space-y-2">
                      {selectedProduct.usage.topConsumers.map((consumer, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span>{consumer.name}</span>
                          <Badge variant="outline" className="text-xs">{consumer.usage}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main marketplace view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-14 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-light flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-primary" />
                Data Marketplace
              </h1>
              <p className="text-muted-foreground mt-2">
                Discover and access enterprise data products
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Subscribe to Updates
              </Button>
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                API Documentation
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Request Data Product
              </Button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search data products by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="quality">Highest Quality</SelectItem>
                <SelectItem value="recent">Recently Updated</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar - Categories */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {categories.map(category => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/50 transition-colors",
                          selectedCategory === category.id && "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                          <span>{category.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Platform Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Products</span>
                  <span className="font-medium">{mockDataProducts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <span className="font-medium">234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daily Queries</span>
                  <span className="font-medium">15.3K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Quality</span>
                  <span className="font-medium">96%</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Product Grid/List */}
          <div className="col-span-9">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {sortedProducts.length} data products
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
                <Badge variant="outline">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending
                </Badge>
                <Badge variant="outline">
                  <Sparkles className="h-3 w-3 mr-1" />
                  New
                </Badge>
              </div>
            </div>
            
            {/* Products */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-6">
                {sortedProducts.map(product => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{product.displayName}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {product.description}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                        >
                          {favorites.includes(product.id) ? (
                            <Heart className="h-4 w-4 fill-current" />
                          ) : (
                            <Heart className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(product.status)} className="text-xs">
                          {product.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Quality Score */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Quality Score</span>
                          <div className="flex items-center gap-2">
                            <Progress value={product.quality.score} className="w-24 h-2" />
                            <span className={cn("text-sm font-medium", getQualityColor(product.quality.score))}>
                              {product.quality.score}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Key Metrics */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Users</p>
                            <p className="text-sm font-medium">{product.usage.uniqueUsers}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Freshness</p>
                            <p className="text-sm font-medium">{product.freshness.sla}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Uptime</p>
                            <p className="text-sm font-medium">{product.sla.uptime}%</p>
                          </div>
                        </div>
                        
                        {/* Access Methods */}
                        <div className="flex items-center gap-2">
                          {product.access.methods.map((method, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {method.type.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {product.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {product.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedProducts.map(product => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium">{product.displayName}</h3>
                              <Badge variant={getStatusBadgeVariant(product.status)} className="text-xs">
                                {product.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {product.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{product.usage.uniqueUsers} users</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{product.usage.dailyQueries.toLocaleString()} queries/day</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Updates {product.freshness.schedule.toLowerCase()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Quality:</span>
                              <span className={cn("text-sm font-medium", getQualityColor(product.quality.score))}>
                                {product.quality.score}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {product.access.methods.map((method, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {method.type.toUpperCase()}
                              </Badge>
                            ))}
                            <Separator orientation="vertical" className="h-4" />
                            {product.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(product.id);
                            }}
                          >
                            {favorites.includes(product.id) ? (
                              <Heart className="h-4 w-4 fill-current" />
                            ) : (
                              <Heart className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm">
                            Get Access
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}