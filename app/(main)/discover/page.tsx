'use client';

import React, { useState } from 'react';
import {
  Search,
  Package,
  TrendingUp,
  Star,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
  X,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ProductCardFactory } from '@/components/discover/ProductCardFactory';
import { RecommendationsSection } from '@/components/discover/RecommendationsSection';
import { SemanticSearchBar } from '@/components/discover/SemanticSearchBar';

// Enhanced DataProduct interface with Foundation/Domain/Solution taxonomy
interface DataProduct {
  // Core Identity
  id: string;
  name: string;
  description: string;

  // CRITICAL: Product Type Taxonomy (Foundation → Domain → Solution)
  productType: 'Foundation' | 'Domain' | 'Solution';

  // Technical Classification (secondary)
  technicalType: 'Pipeline' | 'ML Model' | 'Dataset' | 'API' | 'Dashboard' | 'Stream';

  // Business Context
  domain: string;
  subDomain?: string;
  useCases?: string[]; // What problems does this solve?
  businessQuestions?: string[]; // What questions does this answer?

  // Ownership & Governance
  owner: {
    team: string;
    contact?: string;
  };
  sla: {
    uptime: number; // percentage (0-100)
    freshness: string; // "real-time" | "5 minutes" | "hourly" | "daily"
    latency?: string; // "p99 <100ms"
  };

  // Quality Metrics
  quality: {
    dataQuality: number; // 0-100
    documentation: number; // 0-100
    testCoverage?: number; // 0-100
    productionReadiness: 'Experimental' | 'Beta' | 'Production' | 'Deprecated';
  };

  // Dependencies & Lineage
  dependencies: {
    upstream: string[]; // IDs of products this depends on
    downstream: string[]; // IDs of products that depend on this
  };

  // Usage Analytics
  usage: {
    deployments: number;
    uniqueConsumers: number;
    queriesPerDay?: number;
  };

  // Discovery & Social
  rating: number;
  reviews?: number;
  tags: string[];
  featured?: boolean;
  trending?: boolean;

  // Metadata
  lastUpdated: string;
  version?: string;
  verified: boolean;
}

// Mock marketplace data with proper Foundation → Domain → Solution taxonomy
const mockProducts: DataProduct[] = [
  // === FOUNDATION PRODUCTS (Raw data ingestion from source systems) ===
  {
    id: 'f1',
    name: 'Salesforce CRM Sync',
    description: 'Real-time replication of Salesforce production database including contacts, accounts, opportunities, and activities',
    productType: 'Foundation',
    technicalType: 'Stream',
    domain: 'Customer',
    owner: { team: 'Data Platform Team', contact: 'platform@company.com' },
    sla: { uptime: 99.8, freshness: 'real-time', latency: 'p99 <5s' },
    quality: {
      dataQuality: 98,
      documentation: 95,
      testCoverage: 92,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: [], downstream: ['d1', 'd2'] },
    usage: { deployments: 156, uniqueConsumers: 23, queriesPerDay: 45000 },
    rating: 4.9,
    reviews: 12,
    tags: ['crm', 'salesforce', 'real-time', 'source-system'],
    verified: true,
    lastUpdated: '2 minutes ago',
    version: '2.1.0',
    featured: true
  },
  {
    id: 'f2',
    name: 'PostgreSQL Transaction DB',
    description: 'Core transactional database containing orders, payments, and fulfillment data with CDC streaming',
    productType: 'Foundation',
    technicalType: 'Stream',
    domain: 'Financial',
    owner: { team: 'Data Platform Team' },
    sla: { uptime: 99.9, freshness: 'real-time', latency: 'p99 <3s' },
    quality: {
      dataQuality: 99,
      documentation: 98,
      testCoverage: 95,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: [], downstream: ['d3', 'd4', 's1'] },
    usage: { deployments: 203, uniqueConsumers: 34, queriesPerDay: 120000 },
    rating: 4.8,
    reviews: 18,
    tags: ['postgres', 'transactions', 'cdc', 'real-time'],
    verified: true,
    lastUpdated: '1 minute ago',
    version: '3.0.2'
  },
  {
    id: 'f3',
    name: 'Google Analytics 4 Events',
    description: 'Web and mobile analytics event stream from GA4 including pageviews, conversions, and user interactions',
    productType: 'Foundation',
    technicalType: 'Stream',
    domain: 'Marketing',
    owner: { team: 'Marketing Analytics' },
    sla: { uptime: 99.5, freshness: '5 minutes' },
    quality: {
      dataQuality: 94,
      documentation: 90,
      testCoverage: 85,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: [], downstream: ['d5', 's3'] },
    usage: { deployments: 89, uniqueConsumers: 15, queriesPerDay: 230000 },
    rating: 4.6,
    reviews: 8,
    tags: ['google-analytics', 'web-analytics', 'events'],
    verified: true,
    lastUpdated: '5 minutes ago',
    version: '1.8.0'
  },
  {
    id: 'f4',
    name: 'Zendesk Support Tickets',
    description: 'Customer support ticket data including ticket details, comments, agent actions, and resolution metrics',
    productType: 'Foundation',
    technicalType: 'Dataset',
    domain: 'Customer',
    owner: { team: 'Customer Success Platform' },
    sla: { uptime: 99.2, freshness: 'hourly' },
    quality: {
      dataQuality: 96,
      documentation: 93,
      testCoverage: 88,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: [], downstream: ['d1', 's4'] },
    usage: { deployments: 67, uniqueConsumers: 12, queriesPerDay: 8500 },
    rating: 4.7,
    reviews: 6,
    tags: ['zendesk', 'support', 'tickets', 'customer-service'],
    verified: true,
    lastUpdated: '45 minutes ago',
    version: '2.3.1'
  },
  {
    id: 'f5',
    name: 'Stripe Payment Events',
    description: 'Payment processing events from Stripe including charges, refunds, disputes, and subscription changes',
    productType: 'Foundation',
    technicalType: 'Stream',
    domain: 'Financial',
    owner: { team: 'Finance Engineering' },
    sla: { uptime: 99.95, freshness: 'real-time', latency: 'p99 <2s' },
    quality: {
      dataQuality: 99,
      documentation: 97,
      testCoverage: 94,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: [], downstream: ['d3', 'd4', 's1', 's2'] },
    usage: { deployments: 178, uniqueConsumers: 28, queriesPerDay: 95000 },
    rating: 4.9,
    reviews: 14,
    tags: ['stripe', 'payments', 'financial', 'real-time'],
    verified: true,
    lastUpdated: '30 seconds ago',
    version: '4.1.0',
    featured: true
  },

  // === DOMAIN PRODUCTS (Business-context aggregations) ===
  {
    id: 'd1',
    name: 'Customer 360 Dataset',
    description: 'Unified customer view combining CRM, transactions, support interactions, and behavioral data',
    productType: 'Domain',
    technicalType: 'Dataset',
    domain: 'Customer',
    useCases: ['Customer analytics', 'Segmentation', 'Personalization', 'Lifetime value analysis'],
    businessQuestions: [
      'What is the complete history of this customer?',
      'Which customers are most valuable?',
      'How do customers interact across channels?'
    ],
    owner: { team: 'Data Platform Team' },
    sla: { uptime: 99.5, freshness: 'daily' },
    quality: {
      dataQuality: 96,
      documentation: 100,
      testCoverage: 92,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: ['f1', 'f2', 'f4'], downstream: ['s1', 's4'] },
    usage: { deployments: 312, uniqueConsumers: 45, queriesPerDay: 12000 },
    rating: 4.5,
    reviews: 28,
    tags: ['customer', 'unified', 'dataset', '360-view'],
    verified: true,
    lastUpdated: '1 day ago',
    version: '3.2.0',
    featured: true
  },
  {
    id: 'd2',
    name: 'Product Performance Metrics',
    description: 'Aggregated product-level metrics including sales volume, revenue, inventory levels, and customer ratings',
    productType: 'Domain',
    technicalType: 'Dataset',
    domain: 'Product',
    useCases: ['Product analytics', 'Inventory planning', 'Pricing optimization'],
    businessQuestions: [
      'Which products are top sellers?',
      'What is the profit margin by product?',
      'Which products need restocking?'
    ],
    owner: { team: 'Product Analytics Team' },
    sla: { uptime: 99.3, freshness: 'hourly' },
    quality: {
      dataQuality: 95,
      documentation: 94,
      testCoverage: 88,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: ['f1', 'f2'], downstream: ['s5'] },
    usage: { deployments: 189, uniqueConsumers: 32, queriesPerDay: 8900 },
    rating: 4.7,
    reviews: 15,
    tags: ['product', 'metrics', 'performance', 'inventory'],
    verified: true,
    lastUpdated: '3 days ago',
    version: '2.0.1',
    featured: true
  },
  {
    id: 'd3',
    name: 'Financial Period Aggregations',
    description: 'Revenue, costs, and profitability metrics rolled up by day, week, month, quarter, and year',
    productType: 'Domain',
    technicalType: 'Dataset',
    domain: 'Financial',
    useCases: ['Financial reporting', 'Board presentations', 'Budget vs actuals'],
    owner: { team: 'Finance Analytics' },
    sla: { uptime: 99.7, freshness: 'daily' },
    quality: {
      dataQuality: 99,
      documentation: 100,
      testCoverage: 96,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: ['f2', 'f5'], downstream: ['s2'] },
    usage: { deployments: 156, uniqueConsumers: 18, queriesPerDay: 3200 },
    rating: 4.8,
    reviews: 11,
    tags: ['financial', 'reporting', 'aggregations', 'revenue'],
    verified: true,
    lastUpdated: '1 day ago',
    version: '4.3.0'
  },
  {
    id: 'd4',
    name: 'Transaction Summary Dataset',
    description: 'Cleaned and enriched transaction data with customer linking, categorization, and fraud flags',
    productType: 'Domain',
    technicalType: 'Dataset',
    domain: 'Financial',
    owner: { team: 'Data Engineering' },
    sla: { uptime: 99.6, freshness: 'real-time' },
    quality: {
      dataQuality: 98,
      documentation: 96,
      testCoverage: 93,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: ['f2', 'f5'], downstream: ['s1', 's6'] },
    usage: { deployments: 245, uniqueConsumers: 41, queriesPerDay: 18500 },
    rating: 4.6,
    reviews: 22,
    tags: ['transactions', 'financial', 'enriched'],
    verified: true,
    lastUpdated: '2 hours ago',
    version: '3.1.2'
  },
  {
    id: 'd5',
    name: 'Marketing Campaign Analytics',
    description: 'Multi-channel campaign performance with attribution, ROI, and conversion metrics',
    productType: 'Domain',
    technicalType: 'Dataset',
    domain: 'Marketing',
    useCases: ['Campaign optimization', 'Budget allocation', 'Channel performance'],
    owner: { team: 'Marketing Analytics' },
    sla: { uptime: 99.1, freshness: 'hourly' },
    quality: {
      dataQuality: 93,
      documentation: 92,
      testCoverage: 85,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: ['f3', 'f5'], downstream: ['s3'] },
    usage: { deployments: 167, uniqueConsumers: 24, queriesPerDay: 7100 },
    rating: 4.4,
    reviews: 10,
    tags: ['marketing', 'campaigns', 'attribution', 'roi'],
    verified: true,
    lastUpdated: '4 days ago',
    version: '2.2.0'
  },

  // === SOLUTION PRODUCTS (Business use cases - compose Domain products) ===
  {
    id: 's1',
    name: 'Customer Churn Predictor',
    description: 'ML model predicting customer churn probability in next 30 days with 94% accuracy using behavioral, transactional, and support data',
    productType: 'Solution',
    technicalType: 'ML Model',
    domain: 'Customer',
    useCases: ['Churn prevention', 'Retention campaigns', 'Customer success prioritization'],
    businessQuestions: [
      'Which customers are at risk of churning?',
      'What factors indicate churn risk?',
      'How can we prevent customer loss?'
    ],
    owner: { team: 'Data Science Team' },
    sla: { uptime: 99.5, freshness: 'daily', latency: 'p99 <100ms' },
    quality: {
      dataQuality: 96,
      documentation: 98,
      testCoverage: 91,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: ['d1', 'd4', 'f2'], downstream: [] },
    usage: { deployments: 234, uniqueConsumers: 18, queriesPerDay: 5600 },
    rating: 4.8,
    reviews: 32,
    tags: ['ml', 'churn', 'customer', 'prediction'],
    verified: true,
    lastUpdated: '2 days ago',
    version: '3.1.0',
    featured: true
  },
  {
    id: 's2',
    name: 'Real-time Revenue Dashboard',
    description: 'Executive dashboard with 5-minute data freshness tracking revenue, bookings, and key financial KPIs',
    productType: 'Solution',
    technicalType: 'Dashboard',
    domain: 'Financial',
    useCases: ['Executive reporting', 'Board meetings', 'Real-time business monitoring'],
    businessQuestions: [
      'What is current revenue vs target?',
      'Are we on track for quarterly goals?',
      'Which segments are growing?'
    ],
    owner: { team: 'Analytics Team' },
    sla: { uptime: 99.8, freshness: '5 minutes' },
    quality: {
      dataQuality: 98,
      documentation: 95,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: ['d3', 'f5'], downstream: [] },
    usage: { deployments: 156, uniqueConsumers: 45, queriesPerDay: 2100 },
    rating: 4.6,
    reviews: 18,
    tags: ['dashboard', 'real-time', 'revenue', 'executive'],
    verified: true,
    lastUpdated: '1 week ago',
    version: '2.4.1',
    featured: true
  },
  {
    id: 's3',
    name: 'Marketing ROI Optimizer',
    description: 'Automated campaign optimization using ML to maximize ROI across channels with budget recommendations',
    productType: 'Solution',
    technicalType: 'ML Model',
    domain: 'Marketing',
    useCases: ['Budget allocation', 'Campaign optimization', 'Channel mix modeling'],
    owner: { team: 'Marketing Science' },
    sla: { uptime: 99.3, freshness: 'daily' },
    quality: {
      dataQuality: 94,
      documentation: 93,
      testCoverage: 87,
      productionReadiness: 'Beta'
    },
    dependencies: { upstream: ['d5', 'f3'], downstream: [] },
    usage: { deployments: 89, uniqueConsumers: 12, queriesPerDay: 1200 },
    rating: 4.5,
    reviews: 9,
    tags: ['marketing', 'ml', 'optimization', 'roi'],
    verified: true,
    lastUpdated: '1 week ago',
    version: '1.2.0'
  },
  {
    id: 's4',
    name: 'Customer Sentiment Analysis API',
    description: 'Real-time sentiment analysis on customer interactions from support tickets, reviews, and social media',
    productType: 'Solution',
    technicalType: 'API',
    domain: 'Customer',
    useCases: ['Support prioritization', 'Brand monitoring', 'Product feedback'],
    owner: { team: 'NLP Team' },
    sla: { uptime: 99.7, freshness: 'real-time', latency: 'p99 <50ms' },
    quality: {
      dataQuality: 95,
      documentation: 97,
      testCoverage: 92,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: ['d1', 'f4'], downstream: [] },
    usage: { deployments: 203, uniqueConsumers: 29, queriesPerDay: 45000 },
    rating: 4.7,
    reviews: 16,
    tags: ['nlp', 'sentiment', 'api', 'real-time'],
    verified: true,
    lastUpdated: '3 days ago',
    version: '2.0.3'
  },
  {
    id: 's5',
    name: 'Inventory Optimization Engine',
    description: 'ML-powered inventory recommendations balancing stock levels, demand forecasts, and carrying costs',
    productType: 'Solution',
    technicalType: 'ML Model',
    domain: 'Operations',
    useCases: ['Inventory planning', 'Stock optimization', 'Supply chain efficiency'],
    owner: { team: 'Supply Chain Analytics' },
    sla: { uptime: 99.2, freshness: 'hourly' },
    quality: {
      dataQuality: 93,
      documentation: 89,
      testCoverage: 84,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: ['d2', 'f2'], downstream: [] },
    usage: { deployments: 98, uniqueConsumers: 15, queriesPerDay: 3400 },
    rating: 4.4,
    reviews: 8,
    tags: ['inventory', 'ml', 'optimization', 'supply-chain'],
    verified: false,
    lastUpdated: '5 days ago',
    version: '1.5.2'
  },
  {
    id: 's6',
    name: 'Fraud Detection System',
    description: 'Real-time fraud detection using ensemble ML models and rule-based checks with automated blocking',
    productType: 'Solution',
    technicalType: 'Pipeline',
    domain: 'Financial',
    useCases: ['Fraud prevention', 'Risk management', 'Transaction monitoring'],
    owner: { team: 'Security Team' },
    sla: { uptime: 99.95, freshness: 'real-time', latency: 'p99 <25ms' },
    quality: {
      dataQuality: 99,
      documentation: 96,
      testCoverage: 95,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: ['d4', 'f5'], downstream: [] },
    usage: { deployments: 276, uniqueConsumers: 8, queriesPerDay: 450000 },
    rating: 4.9,
    reviews: 24,
    tags: ['fraud', 'security', 'ml', 'real-time'],
    verified: true,
    lastUpdated: '1 week ago',
    version: '5.2.1',
    featured: true,
    trending: true
  }
];

// ProductCard has been replaced with ProductCardFactory which routes to type-specific cards
// (FoundationProductCard, DomainProductCard, SolutionProductCard)

export default function DiscoverMarketplace() {
  // Search & Basic Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedTechnicalTypes, setSelectedTechnicalTypes] = useState<string[]>([]);

  // Advanced Filters
  const [selectedMaturity, setSelectedMaturity] = useState<string[]>([]);
  const [selectedQualityLevel, setSelectedQualityLevel] = useState<string[]>([]);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'popularity' | 'recent'>('relevance');

  // Toggle filter selection
  const toggleFilter = (value: string, currentValues: string[], setter: (values: string[]) => void) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter(v => v !== value));
    } else {
      setter([...currentValues, value]);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedProductTypes([]);
    setSelectedDomains([]);
    setSelectedTechnicalTypes([]);
    setSelectedMaturity([]);
    setSelectedQualityLevel([]);
    setShowVerifiedOnly(false);
    setSearchQuery('');
  };

  // Count active filters
  const activeFilterCount =
    selectedProductTypes.length +
    selectedDomains.length +
    selectedTechnicalTypes.length +
    selectedMaturity.length +
    selectedQualityLevel.length +
    (showVerifiedOnly ? 1 : 0);

  // Filter products
  const filteredProducts = mockProducts.filter(product => {
    // Search
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.useCases && product.useCases.some(uc => uc.toLowerCase().includes(searchQuery.toLowerCase())));

    // Multi-select filters
    const matchesProductType = selectedProductTypes.length === 0 || selectedProductTypes.includes(product.productType);
    const matchesDomain = selectedDomains.length === 0 || selectedDomains.includes(product.domain);
    const matchesTechnicalType = selectedTechnicalTypes.length === 0 || selectedTechnicalTypes.includes(product.technicalType);
    const matchesMaturity = selectedMaturity.length === 0 || selectedMaturity.includes(product.quality.productionReadiness);

    // Quality level filter
    const matchesQuality = selectedQualityLevel.length === 0 || selectedQualityLevel.some(level => {
      if (level === 'high' && product.quality.dataQuality >= 90) return true;
      if (level === 'medium' && product.quality.dataQuality >= 70 && product.quality.dataQuality < 90) return true;
      if (level === 'low' && product.quality.dataQuality < 70) return true;
      return false;
    });

    // Verified filter
    const matchesVerified = !showVerifiedOnly || product.verified;

    return matchesSearch && matchesProductType && matchesDomain && matchesTechnicalType &&
           matchesMaturity && matchesQuality && matchesVerified;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'popularity':
        return b.usage.deployments - a.usage.deployments;
      case 'recent':
        return 0; // Already sorted by recent in mock data
      case 'relevance':
      default:
        // Simple relevance: featured first, then by rating
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.rating - a.rating;
    }
  });

  // Get featured products
  const featuredProducts = sortedProducts.filter(p => p.featured);

  // Get popular products
  const popularProducts = [...sortedProducts].sort((a, b) => b.usage.deployments - a.usage.deployments);

  // Get recent products
  const recentProducts = sortedProducts;

  // Recommendations data
  const recommendations = {
    forYou: sortedProducts.filter(p => p.productType === 'Domain').slice(0, 3),
    trending: sortedProducts.filter(p => p.trending).slice(0, 3),
    usedTogether: sortedProducts.filter(p => p.productType === 'Solution').slice(0, 3),
  };

  return (
    <div className="flex-1">
      <div className="flex gap-6 max-w-[1800px] mx-auto">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
        {/* Marketplace Header */}
        <div className="space-y-6 px-8 pt-6">
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Data Product Marketplace
            </h1>
            <p className="text-muted-foreground">
              Discover, share, and deploy production-ready data products
            </p>
          </div>
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Publish Product
          </Button>
        </div>

        {/* Semantic Search Bar */}
        <SemanticSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={sortedProducts.length}
        />

        {/* Recommended Products Section */}
        {searchQuery === '' && activeFilterCount === 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Recommended for You</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              {sortedProducts.filter(p => p.rating >= 4.5).slice(0, 3).map(product => (
                <ProductCardFactory key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Filters and Sorting Bar */}
        <div className="px-8 py-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              {/* Advanced Filters Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Filters</h4>
                      {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                          Clear all
                        </Button>
                      )}
                    </div>

                    <Separator />

                    {/* Product Type */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Product Type</Label>
                      {['Foundation', 'Domain', 'Solution'].map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={selectedProductTypes.includes(type)}
                            onCheckedChange={() => toggleFilter(type, selectedProductTypes, setSelectedProductTypes)}
                          />
                          <label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Domain */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Domain</Label>
                      {['Customer', 'Financial', 'Operations', 'Marketing', 'Product'].map(domain => (
                        <div key={domain} className="flex items-center space-x-2">
                          <Checkbox
                            id={`domain-${domain}`}
                            checked={selectedDomains.includes(domain)}
                            onCheckedChange={() => toggleFilter(domain, selectedDomains, setSelectedDomains)}
                          />
                          <label htmlFor={`domain-${domain}`} className="text-sm cursor-pointer">
                            {domain}
                          </label>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Maturity Level */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Maturity</Label>
                      {['Production', 'Beta', 'Experimental'].map(maturity => (
                        <div key={maturity} className="flex items-center space-x-2">
                          <Checkbox
                            id={`maturity-${maturity}`}
                            checked={selectedMaturity.includes(maturity)}
                            onCheckedChange={() => toggleFilter(maturity, selectedMaturity, setSelectedMaturity)}
                          />
                          <label htmlFor={`maturity-${maturity}`} className="text-sm cursor-pointer">
                            {maturity}
                          </label>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Quality Level */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Quality</Label>
                      {[
                        { value: 'high', label: 'High (90+)' },
                        { value: 'medium', label: 'Medium (70-89)' },
                        { value: 'low', label: 'Low (<70)' }
                      ].map(({ value, label }) => (
                        <div key={value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`quality-${value}`}
                            checked={selectedQualityLevel.includes(value)}
                            onCheckedChange={() => toggleFilter(value, selectedQualityLevel, setSelectedQualityLevel)}
                          />
                          <label htmlFor={`quality-${value}`} className="text-sm cursor-pointer">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Verified Only */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified"
                        checked={showVerifiedOnly}
                        onCheckedChange={(checked) => setShowVerifiedOnly(checked as boolean)}
                      />
                      <label htmlFor="verified" className="text-sm cursor-pointer">
                        Verified products only
                      </label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear Filters Button */}
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              )}
            </div>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[160px] h-9">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedProductTypes.map(type => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {type}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter(type, selectedProductTypes, setSelectedProductTypes)}
                  />
                </Badge>
              ))}
              {selectedDomains.map(domain => (
                <Badge key={domain} variant="secondary" className="gap-1">
                  {domain}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter(domain, selectedDomains, setSelectedDomains)}
                  />
                </Badge>
              ))}
              {selectedTechnicalTypes.map(type => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {type}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter(type, selectedTechnicalTypes, setSelectedTechnicalTypes)}
                  />
                </Badge>
              ))}
              {selectedMaturity.map(maturity => (
                <Badge key={maturity} variant="secondary" className="gap-1">
                  {maturity}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter(maturity, selectedMaturity, setSelectedMaturity)}
                  />
                </Badge>
              ))}
              {selectedQualityLevel.map(level => (
                <Badge key={level} variant="secondary" className="gap-1">
                  Quality: {level}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter(level, selectedQualityLevel, setSelectedQualityLevel)}
                  />
                </Badge>
              ))}
              {showVerifiedOnly && (
                <Badge variant="secondary" className="gap-1">
                  Verified Only
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setShowVerifiedOnly(false)}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
        <div className="border-b px-8">
          <TabsList className="h-auto bg-transparent border-0">
            <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              <Package className="mr-2 h-4 w-4" />
              All Products ({sortedProducts.length})
            </TabsTrigger>
            <TabsTrigger value="featured" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              <Sparkles className="mr-2 h-4 w-4" />
              Featured ({featuredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="popular" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              <TrendingUp className="mr-2 h-4 w-4" />
              Most Popular
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              <Clock className="mr-2 h-4 w-4" />
              Recently Added
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4 px-8 pb-8">
          {sortedProducts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedProducts.map(product => (
                <ProductCardFactory key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No products found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-4 px-8 pb-8">
          {featuredProducts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map(product => (
                <ProductCardFactory key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No featured products found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4 px-8 pb-8">
          {popularProducts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {popularProducts.map(product => (
                <ProductCardFactory key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No products found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4 px-8 pb-8">
          {recentProducts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentProducts.map(product => (
                <ProductCardFactory key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No recent products found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
        </Tabs>
        </div>

        {/* Recommendations Sidebar */}
        <div className="hidden xl:block w-80 shrink-0 pr-8 pt-6">
          <div className="sticky top-6">
            <RecommendationsSection recommendations={recommendations} />
          </div>
        </div>
      </div>
    </div>
  );
}
