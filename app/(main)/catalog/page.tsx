'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Table,
  Search,
  Filter,
  ChevronRight,
  Users,
  Shield,
  Clock,
  TrendingUp,
  FileText,
  Plus,
  Star,
  GitBranch,
  Eye,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { MCPOrchestrator } from '@/lib/services/MCPOrchestrator';
import { dataCatalogService } from '@/lib/services/DataCatalogService';
import { cn } from '@/lib/utils';
import { PortalNameDisplay, PortalEntity } from '@/components/portal/PortalNameDisplay';
import { useViewMode } from '@/contexts/ViewModeContext';

interface Dataset {
  id: string;
  name: string;
  fullName: string;
  businessName: string;
  type: 'table' | 'view' | 'stream' | 'file';
  schema: string;
  owner: string;
  description?: string;
  tags: string[];
  lastModified: Date;
  rowCount?: number;
  sizeBytes?: number;
  qualityScore?: number;
  purpose?: string;
  stakeholders?: string[];
  usage?: {
    views: number;
    queries: number;
    users: number;
  };
  governance?: {
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    pii: boolean;
    compliance: string[];
  };
}

interface DataProduct {
  id: string;
  name: string;
  businessName: string;
  technicalName: string;
  description: string;
  owner: string;
  datasets: string[];
  pipelines: string[];
  status: 'active' | 'deprecated' | 'development';
  businessPurpose?: string;
  stakeholders?: string[];
  sla: {
    freshness: string;
    quality: number;
    availability: number;
  };
  consumers: number;
  lastUpdated: Date;
}

export default function CatalogPage() {
  const { viewMode } = useViewMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dataProducts, setDataProducts] = useState<DataProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [orchestrator] = useState(() => new MCPOrchestrator());
  const [activeTab, setActiveTab] = useState('datasets');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      // Load from DataHub via MCP
      const catalogData = await orchestrator.callTool('datahub', 'getCatalog', {});
      
      // Mock data for demonstration
      const mockDatasets: Dataset[] = [
        {
          id: '1',
          name: 'customers',
          fullName: 'analytics.customers',
          businessName: 'Customer Master Data',
          type: 'table',
          schema: 'analytics',
          owner: 'data-team@company.com',
          description: 'Customer master data with profile information and segmentation',
          tags: ['master-data', 'customer', 'pii'],
          lastModified: new Date(Date.now() - 2 * 3600000),
          rowCount: 45678,
          sizeBytes: 12345678,
          qualityScore: 98,
          purpose: 'Single source of truth for customer information',
          stakeholders: ['Sales', 'Marketing', 'Customer Success'],
          usage: {
            views: 1234,
            queries: 567,
            users: 23
          },
          governance: {
            classification: 'confidential',
            pii: true,
            compliance: ['GDPR', 'CCPA']
          }
        },
        {
          id: '2',
          name: 'orders',
          fullName: 'analytics.orders',
          type: 'table',
          schema: 'analytics',
          owner: 'data-team@company.com',
          description: 'Order transactions with line items and fulfillment status',
          tags: ['transactions', 'orders', 'financial'],
          lastModified: new Date(Date.now() - 5 * 3600000),
          rowCount: 1234567,
          sizeBytes: 89123456,
          qualityScore: 95,
          usage: {
            views: 2345,
            queries: 890,
            users: 34
          },
          governance: {
            classification: 'internal',
            pii: false,
            compliance: ['SOC2']
          }
        },
        {
          id: '3',
          name: 'products',
          fullName: 'analytics.products',
          type: 'table',
          schema: 'analytics',
          owner: 'product-team@company.com',
          description: 'Product catalog with pricing and inventory levels',
          tags: ['master-data', 'product', 'catalog'],
          lastModified: new Date(Date.now() - 24 * 3600000),
          rowCount: 8901,
          sizeBytes: 5678901,
          qualityScore: 100,
          usage: {
            views: 890,
            queries: 234,
            users: 12
          },
          governance: {
            classification: 'public',
            pii: false,
            compliance: []
          }
        }
      ];

      const mockDataProducts: DataProduct[] = [
        {
          id: 'dp1',
          name: 'Customer 360',
          description: 'Unified customer view combining profile, orders, and engagement data',
          owner: 'analytics-team@company.com',
          datasets: ['analytics.customers', 'analytics.orders', 'marketing.engagement'],
          pipelines: ['customer_etl', 'segmentation_calc'],
          status: 'active',
          sla: {
            freshness: 'Daily @ 6 AM',
            quality: 99,
            availability: 99.9
          },
          consumers: 45,
          lastUpdated: new Date(Date.now() - 3600000)
        },
        {
          id: 'dp2',
          name: 'Revenue Dashboard',
          description: 'Real-time revenue metrics and forecasting',
          owner: 'finance-team@company.com',
          datasets: ['analytics.orders', 'finance.revenue', 'forecast.predictions'],
          pipelines: ['revenue_calc', 'forecast_ml'],
          status: 'active',
          sla: {
            freshness: 'Every 15 min',
            quality: 98,
            availability: 99.5
          },
          consumers: 23,
          lastUpdated: new Date(Date.now() - 900000)
        }
      ];

      setDatasets(mockDatasets);
      setDataProducts(mockDataProducts);
    } catch (error) {
      console.error('Failed to load catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'public': return 'text-green-600';
      case 'internal': return 'text-blue-600';
      case 'confidential': return 'text-yellow-600';
      case 'restricted': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = !searchQuery || 
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilters = selectedFilters.length === 0 ||
      selectedFilters.every(filter => {
        if (filter === 'pii') return dataset.governance?.pii;
        if (filter === 'high-quality') return (dataset.qualityScore || 0) >= 95;
        if (filter === 'popular') return (dataset.usage?.queries || 0) > 500;
        return dataset.tags.includes(filter);
      });
    
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Browse datasets, data products, and governance information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open DataHub
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register Dataset
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search datasets, products, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge 
              variant={selectedFilters.includes('pii') ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setSelectedFilters(prev => 
                  prev.includes('pii') 
                    ? prev.filter(f => f !== 'pii')
                    : [...prev, 'pii']
                );
              }}
            >
              <Shield className="h-3 w-3 mr-1" />
              Contains PII
            </Badge>
            <Badge 
              variant={selectedFilters.includes('high-quality') ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setSelectedFilters(prev => 
                  prev.includes('high-quality') 
                    ? prev.filter(f => f !== 'high-quality')
                    : [...prev, 'high-quality']
                );
              }}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              High Quality (95%+)
            </Badge>
            <Badge 
              variant={selectedFilters.includes('popular') ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setSelectedFilters(prev => 
                  prev.includes('popular') 
                    ? prev.filter(f => f !== 'popular')
                    : [...prev, 'popular']
                );
              }}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Popular
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Datasets and Data Products */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="datasets">
            <Database className="h-4 w-4 mr-2" />
            Datasets ({datasets.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            <GitBranch className="h-4 w-4 mr-2" />
            Data Products ({dataProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datasets" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">
                  Loading catalog...
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredDatasets.map((dataset) => (
                <Card key={dataset.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Table className="h-4 w-4 text-primary" />
                          <PortalNameDisplay 
                            entity={{
                              businessName: dataset.businessName,
                              technicalName: dataset.fullName,
                              type: dataset.type,
                              owner: dataset.owner,
                              purpose: dataset.purpose,
                              stakeholders: dataset.stakeholders
                            }}
                            viewMode={viewMode}
                            variant="inline"
                            showType={false}
                          />
                        </CardTitle>
                        <CardDescription className="text-xs">
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {dataset.governance?.pii && (
                          <Badge variant="destructive" className="text-xs">
                            PII
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={cn('text-xs', getClassificationColor(dataset.governance?.classification || 'public'))}
                        >
                          {dataset.governance?.classification}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {dataset.description}
                    </p>
                    
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Owner:</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3" />
                          <span className="font-medium">{dataset.owner}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Updated:</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">{formatTimeAgo(dataset.lastModified)}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span>
                        <div className="font-medium">
                          {dataset.rowCount?.toLocaleString()} rows
                          {dataset.sizeBytes && ` • ${formatBytes(dataset.sizeBytes)}`}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quality:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full",
                                dataset.qualityScore && dataset.qualityScore >= 95 ? 'bg-green-500' :
                                dataset.qualityScore && dataset.qualityScore >= 80 ? 'bg-yellow-500' :
                                'bg-red-500'
                              )}
                              style={{ width: `${dataset.qualityScore}%` }}
                            />
                          </div>
                          <span className="font-medium">{dataset.qualityScore}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {dataset.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Usage Stats */}
                    {dataset.usage && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {dataset.usage.views} views
                        </div>
                        <div className="flex items-center gap-1">
                          <Search className="h-3 w-3" />
                          {dataset.usage.queries} queries
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {dataset.usage.users} users
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="h-3 w-3 mr-2" />
                        Lineage
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {dataProducts.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary" />
                        {product.name}
                      </CardTitle>
                      <CardDescription>
                        {product.description}
                      </CardDescription>
                    </div>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Owner</p>
                      <p className="font-medium">{product.owner}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">SLA</p>
                      <div className="space-y-1">
                        <p className="text-sm">{product.sla.freshness}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {product.sla.quality}% quality
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {product.sla.availability}% uptime
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Datasets</p>
                      <p className="font-medium">{product.datasets.length} datasets</p>
                      <p className="font-medium">{product.pipelines.length} pipelines</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Usage</p>
                      <p className="font-medium">{product.consumers} consumers</p>
                      <p className="text-sm text-muted-foreground">
                        Updated {formatTimeAgo(product.lastUpdated)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <GitBranch className="h-3 w-3 mr-2" />
                      View Lineage
                    </Button>
                    <Button variant="outline" size="sm">
                      <Star className="h-3 w-3 mr-2" />
                      Subscribe
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}