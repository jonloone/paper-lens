'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Search,
  Plus,
  Star,
  CheckCircle,
  Zap,
  Database,
  Sparkles,
  Clock,
  GitBranch,
  Activity,
  BarChart3,
  Brain,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type ProductType = 'Foundation' | 'Domain' | 'Solution';
type Latency = 'Real-time' | 'Near Real-time' | 'Batch';
type Purpose = 'Analytics' | 'Operational' | 'ML/AI' | 'Reporting';
type DeliveryMethod = 'SQL' | 'API' | 'Stream' | 'Feature Store';

interface DataProduct {
  id: string;
  title: string;
  description: string;
  domain: string;
  productType: ProductType;
  technicalType: 'Pipeline' | 'ML Model' | 'Dataset' | 'API';
  author: string;
  rating: number;
  deployments: number;
  lastUpdated: string;
  verified: boolean;
  tags: string[];
  latency: Latency;
  purpose: Purpose;
  composedFrom?: string[];
  usedBy?: number;
  deliveryMethods: DeliveryMethod[];
}

// ============================================================================
// Product Type Configuration
// ============================================================================

const productTypeConfig = {
  Foundation: {
    icon: Zap,
    color: 'amber',
    bgClass: 'bg-amber-50 dark:bg-amber-950/20',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
    tagline: 'Essential data streams'
  },
  Domain: {
    icon: Database,
    color: 'blue',
    bgClass: 'bg-blue-50 dark:bg-blue-950/20',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
    tagline: 'Business building blocks'
  },
  Solution: {
    icon: Sparkles,
    color: 'green',
    bgClass: 'bg-green-50 dark:bg-green-950/20',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800',
    tagline: 'Ready-to-use solutions'
  }
};

// ============================================================================
// Mock Data
// ============================================================================

const mockProducts: DataProduct[] = [
  {
    id: '1',
    title: 'Order Events Stream',
    description: 'Real-time order transactions from e-commerce platform with CDC enabled for immediate downstream processing',
    domain: 'Sales',
    productType: 'Foundation',
    technicalType: 'Pipeline',
    author: 'Platform Engineering',
    rating: 4.8,
    deployments: 234,
    lastUpdated: '2 days ago',
    verified: true,
    tags: ['events', 'real-time', 'cdc'],
    latency: 'Real-time',
    purpose: 'Operational',
    usedBy: 8,
    deliveryMethods: ['Stream', 'API']
  },
  {
    id: '2',
    title: 'Customer Entity',
    description: 'Master customer record with unified profile, preferences, and behavioral attributes across all touchpoints',
    domain: 'Customer',
    productType: 'Domain',
    technicalType: 'Dataset',
    author: 'Customer Domain Team',
    rating: 4.9,
    deployments: 423,
    lastUpdated: '1 day ago',
    verified: true,
    tags: ['customer', 'master-data', 'entity'],
    latency: 'Near Real-time',
    purpose: 'Analytics',
    composedFrom: ['Order Events Stream', 'Support Tickets', 'Web Analytics'],
    usedBy: 12,
    deliveryMethods: ['SQL', 'API', 'Feature Store']
  },
  {
    id: '3',
    title: 'Customer 360 View',
    description: 'Complete customer intelligence combining profile, orders, support, marketing engagement, and predictive scores',
    domain: 'Customer',
    productType: 'Solution',
    technicalType: 'Dataset',
    author: 'Analytics Team',
    rating: 4.7,
    deployments: 156,
    lastUpdated: '3 days ago',
    verified: true,
    tags: ['customer-360', 'analytics', 'intelligence'],
    latency: 'Batch',
    purpose: 'Analytics',
    composedFrom: ['Customer Entity', 'Order Entity', 'Marketing Events'],
    deliveryMethods: ['SQL', 'API']
  },
  {
    id: '4',
    title: 'Churn Prediction Model',
    description: 'ML model predicting customer churn with 94% accuracy using behavioral features, engagement patterns, and transaction history',
    domain: 'Customer',
    productType: 'Solution',
    technicalType: 'ML Model',
    author: 'Data Science Team',
    rating: 4.8,
    deployments: 89,
    lastUpdated: '5 days ago',
    verified: true,
    tags: ['machine-learning', 'churn', 'prediction'],
    latency: 'Batch',
    purpose: 'ML/AI',
    composedFrom: ['Customer Entity', 'Order Entity', 'Support Interactions'],
    deliveryMethods: ['API', 'Feature Store']
  },
  {
    id: '5',
    title: 'Product Catalog',
    description: 'Centralized product information with SKUs, pricing, inventory, and rich metadata for all channels',
    domain: 'Product',
    productType: 'Domain',
    technicalType: 'Dataset',
    author: 'Product Domain Team',
    rating: 4.6,
    deployments: 312,
    lastUpdated: '1 week ago',
    verified: true,
    tags: ['product', 'catalog', 'master-data'],
    latency: 'Near Real-time',
    purpose: 'Operational',
    composedFrom: ['Inventory Events', 'Pricing Updates'],
    usedBy: 15,
    deliveryMethods: ['SQL', 'API']
  },
  {
    id: '6',
    title: 'Clickstream Analytics',
    description: 'Real-time web and app clickstream events with session tracking, user attribution, and conversion funnels',
    domain: 'Product',
    productType: 'Foundation',
    technicalType: 'Pipeline',
    author: 'Analytics Engineering',
    rating: 4.7,
    deployments: 187,
    lastUpdated: '4 days ago',
    verified: true,
    tags: ['clickstream', 'real-time', 'analytics'],
    latency: 'Real-time',
    purpose: 'Analytics',
    usedBy: 6,
    deliveryMethods: ['Stream', 'SQL']
  },
  {
    id: '7',
    title: 'Executive KPI Dashboard',
    description: 'Pre-aggregated metrics for executive reporting: revenue, growth, retention, and operational efficiency',
    domain: 'Financial',
    productType: 'Solution',
    technicalType: 'Dataset',
    author: 'BI Team',
    rating: 4.5,
    deployments: 45,
    lastUpdated: '2 days ago',
    verified: false,
    tags: ['dashboard', 'kpi', 'executive'],
    latency: 'Batch',
    purpose: 'Reporting',
    composedFrom: ['Order Entity', 'Customer Entity', 'Financial Transactions'],
    deliveryMethods: ['SQL', 'API']
  },
  {
    id: '8',
    title: 'Real-time Inventory API',
    description: 'Low-latency inventory availability API for e-commerce with sub-second freshness across all warehouses',
    domain: 'Operations',
    productType: 'Solution',
    technicalType: 'API',
    author: 'Operations Team',
    rating: 4.9,
    deployments: 278,
    lastUpdated: '1 day ago',
    verified: true,
    tags: ['inventory', 'real-time', 'api'],
    latency: 'Real-time',
    purpose: 'Operational',
    composedFrom: ['Inventory Events', 'Warehouse Data'],
    deliveryMethods: ['API']
  }
];

// ============================================================================
// Components
// ============================================================================

function ProductTypeButton({
  type,
  active,
  onClick
}: {
  type: ProductType;
  active: boolean;
  onClick: () => void;
}) {
  const config = productTypeConfig[type];
  const Icon = config.icon;

  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'transition-all',
        active && config.bgClass,
        active && config.textClass
      )}
    >
      <Icon className="mr-2 h-4 w-4" />
      {type}
    </Button>
  );
}

function LatencyBadge({ latency }: { latency: Latency }) {
  const Icon = latency === 'Real-time' ? Zap : latency === 'Near Real-time' ? Activity : Clock;
  const colorClass =
    latency === 'Real-time' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800' :
    latency === 'Near Real-time' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800' :
    'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800';

  return (
    <Badge variant="outline" className={cn('text-xs', colorClass)}>
      <Icon className="mr-1 h-3 w-3" />
      {latency}
    </Badge>
  );
}

function PurposeBadge({ purpose }: { purpose: Purpose }) {
  const Icon =
    purpose === 'Analytics' ? BarChart3 :
    purpose === 'Operational' ? Activity :
    purpose === 'ML/AI' ? Brain :
    FileText;

  return (
    <Badge variant="outline" className="text-xs">
      <Icon className="mr-1 h-3 w-3" />
      {purpose}
    </Badge>
  );
}

function ProductCard({ product, onClick }: { product: DataProduct; onClick: () => void }) {
  const config = productTypeConfig[product.productType];
  const TypeIcon = config.icon;

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header: Badge + Verified */}
      <div className="flex items-center justify-between p-4 pb-3">
        <Badge className={cn('font-medium', config.bgClass, config.textClass, config.borderClass)}>
          <TypeIcon className="mr-1.5 h-3.5 w-3.5" />
          {product.productType}
        </Badge>
        {product.verified && (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </div>

      {/* Title & Subtitle */}
      <div className="px-4 pb-3">
        <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {product.description}
        </p>
      </div>

      {/* Key Metrics Bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/30">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{product.deployments}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{product.rating}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {product.latency === 'Real-time' ? <Zap className="h-3.5 w-3.5 text-green-600" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{product.latency}</span>
        </div>
      </div>

      {/* Last Updated Footer */}
      <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/20">
        Updated {product.lastUpdated}
      </div>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function DiscoverMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedTechnicalType, setSelectedTechnicalType] = useState<string>('all');
  const [selectedProductType, setSelectedProductType] = useState<ProductType | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);

  // Filter products based on search and filters
  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDomain = selectedDomain === 'all' || product.domain === selectedDomain;
    const matchesTechnicalType = selectedTechnicalType === 'all' || product.technicalType === selectedTechnicalType;
    const matchesProductType = selectedProductType === 'all' || product.productType === selectedProductType;

    return matchesSearch && matchesDomain && matchesTechnicalType && matchesProductType;
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-[1584px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Marketplace Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Data Product Marketplace
              </h1>
              <p className="text-muted-foreground mt-1">
                Discover, compose, and deploy production-ready data products
              </p>
            </div>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Publish Product
            </Button>
          </div>

          {/* Product Type Quick Filters */}
          <div className="flex gap-2">
            <ProductTypeButton
              type="Foundation"
              active={selectedProductType === 'Foundation'}
              onClick={() => setSelectedProductType(selectedProductType === 'Foundation' ? 'all' : 'Foundation')}
            />
            <ProductTypeButton
              type="Domain"
              active={selectedProductType === 'Domain'}
              onClick={() => setSelectedProductType(selectedProductType === 'Domain' ? 'all' : 'Domain')}
            />
            <ProductTypeButton
              type="Solution"
              active={selectedProductType === 'Solution'}
              onClick={() => setSelectedProductType(selectedProductType === 'Solution' ? 'all' : 'Solution')}
            />
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products, domains, or use cases..."
              className="pl-12 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Main Content Tabs with Filters */}
        <Tabs defaultValue="featured" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="popular">Most Popular</TabsTrigger>
              <TabsTrigger value="recent">Recently Added</TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTechnicalType} onValueChange={setSelectedTechnicalType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Pipeline">Pipeline</SelectItem>
                  <SelectItem value="ML Model">ML Model</SelectItem>
                  <SelectItem value="Dataset">Dataset</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="featured" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...filteredProducts]
                .sort((a, b) => b.deployments - a.deployments)
                .map((product) => (
                  <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommended" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts
                .filter(p => p.rating >= 4.7)
                .map((product) => (
                  <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Product Detail Sheet */}
        <Sheet open={selectedProduct !== null} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedProduct && (
              <>
                <SheetHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={cn(
                      'font-medium',
                      productTypeConfig[selectedProduct.productType].bgClass,
                      productTypeConfig[selectedProduct.productType].textClass,
                      productTypeConfig[selectedProduct.productType].borderClass
                    )}>
                      {React.createElement(productTypeConfig[selectedProduct.productType].icon, { className: 'mr-1.5 h-3.5 w-3.5' })}
                      {selectedProduct.productType}
                    </Badge>
                    {selectedProduct.verified && (
                      <div className="flex items-center gap-1.5 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                  <SheetTitle className="text-2xl">{selectedProduct.title}</SheetTitle>
                  <SheetDescription className="text-base">
                    {selectedProduct.description}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Key Metrics */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Key Metrics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold">{selectedProduct.deployments}</span>
                        <span className="text-xs text-muted-foreground">Deployments</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-2xl font-bold">{selectedProduct.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Rating</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold">{selectedProduct.latency}</span>
                        <span className="text-xs text-muted-foreground">Latency</span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Domain</span>
                        <span className="font-medium">{selectedProduct.domain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium">{selectedProduct.technicalType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Purpose</span>
                        <span className="font-medium">{selectedProduct.purpose}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Author</span>
                        <span className="font-medium">{selectedProduct.author}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span className="font-medium">{selectedProduct.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  {/* Composition */}
                  {(selectedProduct.composedFrom || selectedProduct.usedBy) && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Composition</h3>
                      <div className="space-y-2">
                        {selectedProduct.composedFrom && selectedProduct.composedFrom.length > 0 && (
                          <div className="flex items-start gap-2">
                            <GitBranch className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="text-sm font-medium">Combines {selectedProduct.composedFrom.length} products</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {selectedProduct.composedFrom.join(', ')}
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedProduct.usedBy && selectedProduct.usedBy > 0 && (
                          <div className="flex items-start gap-2">
                            <GitBranch className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="text-sm font-medium">Used by {selectedProduct.usedBy} products</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Access Methods */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Access Methods</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.deliveryMethods.map((method) => (
                        <Badge key={method} variant="secondary" className="text-sm">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1" size="lg">
                      Deploy Product
                    </Button>
                    <Button variant="outline" size="lg">
                      View Documentation
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
