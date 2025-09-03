'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Star,
  TrendingUp,
  Clock,
  Users,
  Database,
  Shield,
  Zap,
  Package,
  Eye,
  Download,
  ChevronRight,
  Grid,
  List,
  Sparkles,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataProduct {
  id: string;
  name: string;
  description: string;
  domain: string;
  owner: string;
  rating: number;
  reviews: number;
  usage: number;
  lastUpdated: string;
  freshness: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  quality: {
    score: number;
    completeness: number;
    accuracy: number;
  };
  cost: {
    type: 'free' | 'usage-based' | 'subscription';
    estimate?: number;
  };
  tags: string[];
  certified: boolean;
  trending: boolean;
}

const mockProducts: DataProduct[] = [
  {
    id: '1',
    name: 'Customer 360 View',
    description: 'Comprehensive customer profile with purchase history, engagement metrics, and predictive scores',
    domain: 'Customer Analytics',
    owner: 'Data Platform Team',
    rating: 4.8,
    reviews: 124,
    usage: 15420,
    lastUpdated: '2 hours ago',
    freshness: 'hourly',
    quality: {
      score: 0.95,
      completeness: 0.98,
      accuracy: 0.92,
    },
    cost: {
      type: 'free',
    },
    tags: ['customer', 'analytics', 'ml-ready', 'certified'],
    certified: true,
    trending: true,
  },
  {
    id: '2',
    name: 'Revenue Attribution Model',
    description: 'Multi-touch attribution model for marketing campaigns with ROI calculations',
    domain: 'Marketing Analytics',
    owner: 'Marketing Analytics Team',
    rating: 4.6,
    reviews: 89,
    usage: 8932,
    lastUpdated: '1 day ago',
    freshness: 'daily',
    quality: {
      score: 0.88,
      completeness: 0.85,
      accuracy: 0.91,
    },
    cost: {
      type: 'usage-based',
      estimate: 0.05,
    },
    tags: ['marketing', 'attribution', 'revenue', 'ml-model'],
    certified: true,
    trending: false,
  },
  {
    id: '3',
    name: 'Product Inventory Real-time',
    description: 'Real-time inventory levels across all warehouses with predictive stockout alerts',
    domain: 'Supply Chain',
    owner: 'Supply Chain Team',
    rating: 4.9,
    reviews: 201,
    usage: 25103,
    lastUpdated: '5 minutes ago',
    freshness: 'real-time',
    quality: {
      score: 0.97,
      completeness: 0.99,
      accuracy: 0.95,
    },
    cost: {
      type: 'usage-based',
      estimate: 0.10,
    },
    tags: ['inventory', 'real-time', 'supply-chain', 'alerts'],
    certified: true,
    trending: true,
  },
  {
    id: '4',
    name: 'Employee Performance Metrics',
    description: 'Comprehensive employee performance data with productivity scores and team analytics',
    domain: 'People Analytics',
    owner: 'HR Analytics Team',
    rating: 4.3,
    reviews: 56,
    usage: 3421,
    lastUpdated: '1 week ago',
    freshness: 'weekly',
    quality: {
      score: 0.82,
      completeness: 0.88,
      accuracy: 0.76,
    },
    cost: {
      type: 'free',
    },
    tags: ['hr', 'performance', 'employee', 'team-analytics'],
    certified: false,
    trending: false,
  },
];

export function DataProductMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedFreshness, setSelectedFreshness] = useState('all');
  const [selectedCost, setSelectedCost] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('trending');

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDomain = selectedDomain === 'all' || product.domain === selectedDomain;
    const matchesFreshness = selectedFreshness === 'all' || product.freshness === selectedFreshness;
    const matchesCost = selectedCost === 'all' || product.cost.type === selectedCost;
    
    return matchesSearch && matchesDomain && matchesFreshness && matchesCost;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'trending':
        return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
      case 'rating':
        return b.rating - a.rating;
      case 'usage':
        return b.usage - a.usage;
      case 'recent':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Product Marketplace</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search data products by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-3">
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectItem value="Customer Analytics">Customer Analytics</SelectItem>
                  <SelectItem value="Marketing Analytics">Marketing Analytics</SelectItem>
                  <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                  <SelectItem value="People Analytics">People Analytics</SelectItem>
                  <SelectItem value="Financial Analytics">Financial Analytics</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedFreshness} onValueChange={setSelectedFreshness}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Freshness" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Freshness</SelectItem>
                  <SelectItem value="real-time">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCost} onValueChange={setSelectedCost}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Cost" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pricing</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="usage-based">Usage-based</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="usage">Most Used</SelectItem>
                  <SelectItem value="recent">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {sortedProducts.length} data products
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Recommended
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedProducts.map(product => (
            <ProductListItem key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: DataProduct }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              {product.certified && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Certified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{product.domain}</p>
          </div>
          {product.trending && (
            <Badge className="bg-orange-100 text-orange-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm line-clamp-2">{product.description}</p>
        
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>{product.rating} ({product.reviews})</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span>{product.usage.toLocaleString()} users</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span>{product.freshness}</span>
          </div>
          <div className="flex items-center gap-2">
            {product.cost.type === 'free' ? (
              <>
                <Badge variant="outline" className="text-green-600">
                  Free
                </Badge>
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span>${product.cost.estimate}/query</span>
              </>
            )}
          </div>
        </div>
        
        {/* Quality Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Quality Score</span>
            <span className="font-semibold">{Math.round(product.quality.score * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                product.quality.score >= 0.9 ? "bg-green-500" :
                product.quality.score >= 0.7 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${product.quality.score * 100}%` }}
            />
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {product.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {product.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{product.tags.length - 3}
            </Badge>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Subscribe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductListItem({ product }: { product: DataProduct }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              {product.certified && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Certified
                </Badge>
              )}
              {product.trending && (
                <Badge className="bg-orange-100 text-orange-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending
                </Badge>
              )}
              <Badge variant="secondary">{product.domain}</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">{product.description}</p>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{product.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span>{product.usage.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-green-500" />
                <span>{product.freshness}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-purple-500" />
                <span>{Math.round(product.quality.score * 100)}%</span>
              </div>
              {product.cost.type === 'free' ? (
                <Badge variant="outline" className="text-green-600">Free</Badge>
              ) : (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${product.cost.estimate}/query</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-1">
              {product.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Subscribe
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}