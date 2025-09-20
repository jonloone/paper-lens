'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Package, Search, Filter, Star, Download, 
  ArrowRight, Clock, Users, Database,
  BarChart3, Calendar, Target, Zap, 
  Globe, Shield, CheckCircle, Eye,
  TrendingUp, Activity, Hash, Play
} from 'lucide-react';

interface DataProduct {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'ml' | 'operations' | 'finance' | 'marketing';
  type: 'dataset' | 'api' | 'dashboard' | 'model';
  owner: string;
  lastUpdated: string;
  rating: number;
  usageCount: number;
  size: string;
  quality: 'high' | 'medium' | 'low';
  tags: string[];
  certified: boolean;
  popular: boolean;
  featured: boolean;
  freshness: 'real-time' | 'daily' | 'weekly' | 'monthly';
  downloads: number;
  views: number;
}

const dataProducts: DataProduct[] = [
  {
    id: 'product-1',
    name: 'Customer 360 Dataset',
    description: 'Unified customer profiles with demographics, transactions, engagement metrics, and behavioral insights',
    category: 'analytics',
    type: 'dataset',
    owner: 'Analytics Team',
    lastUpdated: '2 hours ago',
    rating: 4.8,
    usageCount: 156,
    size: '2.3 TB',
    quality: 'high',
    tags: ['customer', 'unified', 'demographics', 'transactions'],
    certified: true,
    popular: true,
    featured: true,
    freshness: 'real-time',
    downloads: 523,
    views: 2100
  },
  {
    id: 'product-2',
    name: 'Revenue Forecasting Model',
    description: 'ML model for predicting quarterly revenue with 95% accuracy based on historical data and market indicators',
    category: 'finance',
    type: 'model',
    owner: 'Data Science Team',
    lastUpdated: '1 day ago',
    rating: 4.6,
    usageCount: 43,
    size: '150 MB',
    quality: 'high',
    tags: ['revenue', 'forecasting', 'ml', 'financial'],
    certified: true,
    popular: false,
    featured: true,
    freshness: 'weekly',
    downloads: 89,
    views: 450
  },
  {
    id: 'product-3',
    name: 'Marketing Attribution API',
    description: 'Real-time API providing multi-touch attribution analysis across all marketing channels and campaigns',
    category: 'marketing',
    type: 'api',
    owner: 'Marketing Analytics',
    lastUpdated: '3 hours ago',
    rating: 4.7,
    usageCount: 89,
    size: 'API',
    quality: 'high',
    tags: ['attribution', 'marketing', 'multi-touch', 'real-time'],
    certified: true,
    popular: true,
    featured: false,
    freshness: 'real-time',
    downloads: 234,
    views: 890
  },
  {
    id: 'product-4',
    name: 'Operations Dashboard',
    description: 'Executive dashboard showing key operational metrics, SLAs, and performance indicators across all business units',
    category: 'operations',
    type: 'dashboard',
    owner: 'Operations Team',
    lastUpdated: '1 hour ago',
    rating: 4.5,
    usageCount: 67,
    size: 'Dashboard',
    quality: 'medium',
    tags: ['operations', 'sla', 'kpi', 'executive'],
    certified: false,
    popular: false,
    featured: false,
    freshness: 'daily',
    downloads: 156,
    views: 670
  },
  {
    id: 'product-5',
    name: 'Churn Prediction Dataset',
    description: 'Enriched customer dataset with churn indicators, feature engineering, and predictive scores',
    category: 'ml',
    type: 'dataset',
    owner: 'ML Engineering',
    lastUpdated: '2 days ago',
    rating: 4.4,
    usageCount: 34,
    size: '890 GB',
    quality: 'high',
    tags: ['churn', 'prediction', 'features', 'ml'],
    certified: true,
    popular: false,
    featured: false,
    freshness: 'daily',
    downloads: 123,
    views: 520
  },
  {
    id: 'product-6',
    name: 'Financial Risk API',
    description: 'API providing real-time risk assessment and compliance monitoring for financial transactions',
    category: 'finance',
    type: 'api',
    owner: 'Risk Management',
    lastUpdated: '6 hours ago',
    rating: 4.9,
    usageCount: 78,
    size: 'API',
    quality: 'high',
    tags: ['risk', 'compliance', 'financial', 'real-time'],
    certified: true,
    popular: true,
    featured: true,
    freshness: 'real-time',
    downloads: 345,
    views: 1200
  }
];

export default function ProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [activeTab, setActiveTab] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All', count: dataProducts.length },
    { id: 'analytics', label: 'Analytics', count: dataProducts.filter(p => p.category === 'analytics').length },
    { id: 'ml', label: 'ML/AI', count: dataProducts.filter(p => p.category === 'ml').length },
    { id: 'finance', label: 'Finance', count: dataProducts.filter(p => p.category === 'finance').length },
    { id: 'marketing', label: 'Marketing', count: dataProducts.filter(p => p.category === 'marketing').length },
    { id: 'operations', label: 'Operations', count: dataProducts.filter(p => p.category === 'operations').length }
  ];

  const types = [
    { id: 'all', label: 'All Types' },
    { id: 'dataset', label: 'Datasets' },
    { id: 'api', label: 'APIs' },
    { id: 'dashboard', label: 'Dashboards' },
    { id: 'model', label: 'ML Models' }
  ];

  const filteredProducts = dataProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesType = selectedType === 'all' || product.type === selectedType;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'featured' && product.featured) ||
                      (activeTab === 'certified' && product.certified) ||
                      (activeTab === 'popular' && product.popular);
    
    return matchesSearch && matchesCategory && matchesType && matchesTab;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular': return b.usageCount - a.usageCount;
      case 'rating': return b.rating - a.rating;
      case 'recent': return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dataset': return <Database className="h-4 w-4" />;
      case 'api': return <Globe className="h-4 w-4" />;
      case 'dashboard': return <BarChart3 className="h-4 w-4" />;
      case 'model': return <Target className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
      case 'medium': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20';
      case 'low': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20';
      default: return 'text-muted-foreground';
    }
  };

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'real-time': return 'text-green-600 dark:text-green-400';
      case 'daily': return 'text-blue-600 dark:text-blue-400';
      case 'weekly': return 'text-amber-600 dark:text-amber-400';
      case 'monthly': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3 w-3",
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        )}
      />
    ));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              Data Marketplace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover, access, and reuse enterprise data products
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/products/quality')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Quality Analytics
            </Button>
            <Button variant="outline" onClick={() => router.push('/products/usage')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Usage Insights
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-semibold">{dataProducts.length}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Certified</p>
                  <p className="text-2xl font-semibold">{dataProducts.filter(p => p.certified).length}</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Usage</p>
                  <p className="text-2xl font-semibold">{dataProducts.reduce((sum, p) => sum + p.usageCount, 0)}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-semibold">
                    {(dataProducts.reduce((sum, p) => sum + p.rating, 0) / dataProducts.length).toFixed(1)}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search data products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-80"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.count})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  {types.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="recent">Recently Updated</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </CardHeader>
        </Card>

        {/* Product Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Products ({dataProducts.length})</TabsTrigger>
            <TabsTrigger value="featured">Featured ({dataProducts.filter(p => p.featured).length})</TabsTrigger>
            <TabsTrigger value="certified">Certified ({dataProducts.filter(p => p.certified).length})</TabsTrigger>
            <TabsTrigger value="popular">Popular ({dataProducts.filter(p => p.popular).length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <Card key={product.id} className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(product.type)}
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        {product.certified && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Certified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {product.featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardDescription className="text-sm line-clamp-2">
                      {product.description}
                    </CardDescription>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        {renderStars(product.rating)}
                        <span className="text-xs text-muted-foreground ml-1">
                          {product.rating}
                        </span>
                      </div>
                      <Badge className={cn("text-xs px-2", getQualityColor(product.quality))}>
                        {product.quality} quality
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {product.usageCount} users
                        </div>
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {product.size}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {product.lastUpdated}
                        </div>
                        <div className={cn("flex items-center gap-1", getFreshnessColor(product.freshness))}>
                          <Activity className="h-3 w-3" />
                          {product.freshness}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                            #{tag}
                          </Badge>
                        ))}
                        {product.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            +{product.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Owner */}
                      <div className="text-xs text-muted-foreground">
                        Maintained by <span className="font-medium">{product.owner}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">
                          <Play className="h-3 w-3 mr-1" />
                          Access
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or browse different categories
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedType('all');
                  setActiveTab('all');
                }}>
                  Clear filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}