'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  X,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  TrendingUp,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ProductCardFactory } from '@/components/discover/ProductCardFactory';
import { RecommendationsSection } from '@/components/discover/RecommendationsSection';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Enhanced DataProduct interface with Foundation/Domain/Solution taxonomy
interface DataProduct {
  // Core Identity
  id: string;
  name: string; // Technical identifier in domain.product_name format
  displayName?: string; // Human-readable name (optional)
  description: string;

  // CRITICAL: Product Type Taxonomy (Foundation → Domain → Solution)
  productType: 'Foundation' | 'Domain' | 'Solution';

  // NEW: Contract reference (ODCS link)
  contractVersion?: string; // e.g., "2.0.0" - semantic version
  contractRef?: string; // e.g., "customer_churn_score/v2.0.0"

  // Optional: Product format descriptor (for display/filtering only)
  productFormat?: 'Stream' | 'Dataset' | 'API' | 'Model' | 'Dashboard' | 'Pipeline' | 'ML Model';

  // Business Context
  domain: string;
  subDomain?: string;
  useCases?: string[]; // What problems does this solve?
  businessQuestions?: string[]; // What questions does this answer?

  // NEW: Production readiness (for card trust signals)
  productionStatus?: 'production' | 'beta' | 'experimental';

  // NEW: Source system identity (for card provenance display)
  sourceSystems?: Array<{
    name: string;
    logo: string; // TechLogo identifier
    tables?: number;
    recordCount?: string;
  }>;

  // NEW: Business context (for Domain/Solution cards)
  businessContext?: {
    useCases: string[];
    businessQuestions: string[];
    sampleQueries?: string[];
  };

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
    deployments?: number; // Foundation products: pipeline deployments
    deploymentCount?: number; // Alias for deployments
    uniqueConsumers: number;
    queriesPerDay?: number;
    activeQueries?: number; // Domain products: queries per day
    notebookReferences?: number; // Solution products: notebook usage
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
    name: 'customer.salesforce_crm_sync',
    displayName: 'Salesforce CRM Sync',
    description: 'Real-time replication of Salesforce production database including contacts, accounts, opportunities, and activities',
    productType: 'Foundation',
    productFormat: 'Stream',
    domain: 'Customer',
    productionStatus: 'production',
    sourceSystems: [
      {
        name: 'Salesforce CRM',
        logo: 'salesforce',
        tables: 23,
        recordCount: '2.3M records'
      }
    ],
    owner: { team: 'Data Platform Team', contact: 'platform@company.com' },
    sla: { uptime: 99.8, freshness: 'real-time', latency: 'p99 <5s' },
    quality: {
      dataQuality: 98,
      documentation: 95,
      testCoverage: 92,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: [], downstream: ['d1', 'd2'] },
    usage: { deployments: 156, deploymentCount: 156, uniqueConsumers: 23, queriesPerDay: 45000 },
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
    name: 'financial.postgres_transactions',
    displayName: 'PostgreSQL Transaction DB',
    description: 'Core transactional database containing orders, payments, and fulfillment data with CDC streaming',
    productType: 'Foundation',
    productFormat: 'Stream',
    domain: 'Financial',
    productionStatus: 'production',
    sourceSystems: [
      {
        name: 'PostgreSQL Production DB',
        logo: 'postgresql',
        tables: 45,
        recordCount: '12.5M records'
      }
    ],
    owner: { team: 'Data Platform Team' },
    sla: { uptime: 99.9, freshness: 'real-time', latency: 'p99 <3s' },
    quality: {
      dataQuality: 99,
      documentation: 98,
      testCoverage: 95,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: [], downstream: ['d3', 'd4', 's1'] },
    usage: { deployments: 203, deploymentCount: 203, uniqueConsumers: 34, queriesPerDay: 120000 },
    rating: 4.8,
    reviews: 18,
    tags: ['postgres', 'transactions', 'cdc', 'real-time'],
    verified: true,
    lastUpdated: '1 minute ago',
    version: '3.0.2'
  },
  {
    id: 'f3',
    name: 'marketing.ga4_events',
    displayName: 'Google Analytics 4 Events',
    description: 'Web and mobile analytics event stream from GA4 including pageviews, conversions, and user interactions',
    productType: 'Foundation',
    productFormat: 'Stream',
    domain: 'Marketing',
    productionStatus: 'production',
    sourceSystems: [
      {
        name: 'Google Analytics 4',
        logo: 'google-analytics',
        recordCount: '450M events/day'
      }
    ],
    owner: { team: 'Marketing Analytics' },
    sla: { uptime: 99.5, freshness: '5 minutes' },
    quality: {
      dataQuality: 94,
      documentation: 90,
      testCoverage: 85,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: [], downstream: ['d5', 's3'] },
    usage: { deployments: 89, deploymentCount: 89, uniqueConsumers: 15, queriesPerDay: 230000 },
    rating: 4.6,
    reviews: 8,
    tags: ['google-analytics', 'web-analytics', 'events'],
    verified: true,
    lastUpdated: '5 minutes ago',
    version: '1.8.0'
  },
  {
    id: 'f4',
    name: 'customer.zendesk_support_tickets',
    displayName: 'Zendesk Support Tickets',
    description: 'Customer support ticket data including ticket details, comments, agent actions, and resolution metrics',
    productType: 'Foundation',
    productFormat: 'Dataset',
    domain: 'Customer',
    productionStatus: 'production',
    sourceSystems: [
      {
        name: 'Zendesk Support',
        logo: 'zendesk',
        tables: 8,
        recordCount: '890K tickets'
      }
    ],
    owner: { team: 'Customer Success Platform' },
    sla: { uptime: 99.2, freshness: 'hourly' },
    quality: {
      dataQuality: 96,
      documentation: 93,
      testCoverage: 88,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: [], downstream: ['d1', 's4'] },
    usage: { deployments: 67, deploymentCount: 67, uniqueConsumers: 12, queriesPerDay: 8500 },
    rating: 4.7,
    reviews: 6,
    tags: ['zendesk', 'support', 'tickets', 'customer-service'],
    verified: true,
    lastUpdated: '45 minutes ago',
    version: '2.3.1'
  },
  {
    id: 'f5',
    name: 'financial.stripe_payment_events',
    displayName: 'Stripe Payment Events',
    description: 'Payment processing events from Stripe including charges, refunds, disputes, and subscription changes',
    productType: 'Foundation',
    productFormat: 'Stream',
    domain: 'Financial',
    productionStatus: 'production',
    sourceSystems: [
      {
        name: 'Stripe Payments',
        logo: 'stripe',
        recordCount: '3.2M transactions/day'
      }
    ],
    owner: { team: 'Finance Engineering' },
    sla: { uptime: 99.95, freshness: 'real-time', latency: 'p99 <2s' },
    quality: {
      dataQuality: 99,
      documentation: 97,
      testCoverage: 94,
      productionReadiness: 'Production'
    },
    dependencies: { upstream: [], downstream: ['d3', 'd4', 's1', 's2'] },
    usage: { deployments: 178, deploymentCount: 178, uniqueConsumers: 28, queriesPerDay: 95000 },
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
    name: 'customer.customer_360',
    displayName: 'Customer 360 Dataset',
    description: 'Unified customer view combining CRM, transactions, support interactions, and behavioral data',
    productType: 'Domain',
    productFormat: 'Dataset',
    contractVersion: '3.2.0',
    contractRef: 'customer_360/v3.2.0',
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
    name: 'product.performance_metrics',
    displayName: 'Product Performance Metrics',
    description: 'Aggregated product-level metrics including sales volume, revenue, inventory levels, and customer ratings',
    productType: 'Domain',
    productFormat: 'Dataset',
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
    name: 'financial.period_aggregations',
    displayName: 'Financial Period Aggregations',
    description: 'Revenue, costs, and profitability metrics rolled up by day, week, month, quarter, and year',
    productType: 'Domain',
    productFormat: 'Dataset',
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
    name: 'financial.transaction_summary',
    displayName: 'Transaction Summary Dataset',
    description: 'Cleaned and enriched transaction data with customer linking, categorization, and fraud flags',
    productType: 'Domain',
    productFormat: 'Dataset',
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
    name: 'marketing.campaign_analytics',
    displayName: 'Marketing Campaign Analytics',
    description: 'Multi-channel campaign performance with attribution, ROI, and conversion metrics',
    productType: 'Domain',
    productFormat: 'Dataset',
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
    name: 'customer.churn_predictor',
    displayName: 'Customer Churn Predictor',
    description: 'ML model predicting customer churn probability in next 30 days with 94% accuracy using behavioral, transactional, and support data',
    productType: 'Solution',
    productFormat: 'ML Model',
    contractVersion: '2.0.0',
    contractRef: 'customer_churn_score/v2.0.0',
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
    name: 'financial.revenue_dashboard',
    displayName: 'Real-time Revenue Dashboard',
    description: 'Executive dashboard with 5-minute data freshness tracking revenue, bookings, and key financial KPIs',
    productType: 'Solution',
    productFormat: 'Dashboard',
    contractVersion: '4.3.0',
    contractRef: 'financial_period_aggregations/v4.3.0',
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
    name: 'marketing.roi_optimizer',
    displayName: 'Marketing ROI Optimizer',
    description: 'Automated campaign optimization using ML to maximize ROI across channels with budget recommendations',
    productType: 'Solution',
    productFormat: 'ML Model',
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
    name: 'customer.sentiment_analysis_api',
    displayName: 'Customer Sentiment Analysis API',
    description: 'Real-time sentiment analysis on customer interactions from support tickets, reviews, and social media',
    productType: 'Solution',
    productFormat: 'API',
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
    name: 'operations.inventory_optimizer',
    displayName: 'Inventory Optimization Engine',
    description: 'ML-powered inventory recommendations balancing stock levels, demand forecasts, and carrying costs',
    productType: 'Solution',
    productFormat: 'ML Model',
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
    name: 'financial.fraud_detection',
    displayName: 'Fraud Detection System',
    description: 'Real-time fraud detection using ensemble ML models and rule-based checks with automated blocking',
    productType: 'Solution',
    productFormat: 'Pipeline',
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
  // Sidebar Filters (3 primary facets for table)
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [selectedProductFormats, setSelectedProductFormats] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedQualityLevel, setSelectedQualityLevel] = useState<string[]>([]);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);

  // Search and sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevance');

  // Collapsible filter sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    productType: true,
    productFormat: true,
    domain: true,
    quality: true,
    freshness: false,
    useCases: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  // Extract unique use cases from all products
  const allUseCases = useMemo(() => {
    const useCases = new Set<string>();
    mockProducts.forEach(product => {
      product.useCases?.forEach(useCase => useCases.add(useCase));
    });
    return Array.from(useCases).sort();
  }, []);

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
    setSelectedProductFormats([]);
    setSelectedDomains([]);
    setSelectedQualityLevel([]);
    setSelectedUseCases([]);
  };

  // Count active filters
  const activeFilterCount =
    selectedProductTypes.length +
    selectedProductFormats.length +
    selectedDomains.length +
    selectedQualityLevel.length +
    selectedUseCases.length;

  // Filter and search products
  const filteredAndSortedProducts = useMemo(() => {
    // First, filter products
    const filtered = mockProducts.filter(product => {
      // Search filter
      const matchesSearch = !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.displayName && product.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        product.domain.toLowerCase().includes(searchQuery.toLowerCase());

      // Multi-select filters
      const matchesProductType = selectedProductTypes.length === 0 || selectedProductTypes.includes(product.productType);
      const matchesProductFormat = selectedProductFormats.length === 0 || (product.productFormat && selectedProductFormats.includes(product.productFormat));
      const matchesDomain = selectedDomains.length === 0 || selectedDomains.includes(product.domain);

      // Quality level filter
      const matchesQuality = selectedQualityLevel.length === 0 || selectedQualityLevel.some(level => {
        if (level === 'high' && product.quality.dataQuality >= 90) return true;
        if (level === 'medium' && product.quality.dataQuality >= 70 && product.quality.dataQuality < 90) return true;
        return false;
      });

      // Use case filter
      const matchesUseCase = selectedUseCases.length === 0 ||
        selectedUseCases.some(useCase => product.useCases?.includes(useCase));

      return matchesSearch && matchesProductType && matchesProductFormat && matchesDomain && matchesQuality && matchesUseCase;
    });

    // Then, sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return b.quality.dataQuality - a.quality.dataQuality;
        case 'popularity':
          return b.usage.uniqueConsumers - a.usage.uniqueConsumers;
        case 'freshness':
          const freshnessOrder: Record<string, number> = {
            'real-time': 0,
            '5 minutes': 1,
            'hourly': 2,
            'daily': 3
          };
          return (freshnessOrder[a.sla.freshness] ?? 99) - (freshnessOrder[b.sla.freshness] ?? 99);
        case 'alphabetical':
          return (a.displayName || a.name).localeCompare(b.displayName || b.name);
        case 'relevance':
        default:
          // Relevance: prioritize verified, featured, trending, then by quality
          const scoreA = (a.verified ? 1000 : 0) + (a.featured ? 500 : 0) + (a.trending ? 250 : 0) + a.quality.dataQuality;
          const scoreB = (b.verified ? 1000 : 0) + (b.featured ? 500 : 0) + (b.trending ? 250 : 0) + b.quality.dataQuality;
          return scoreB - scoreA;
      }
    });

    return sorted;
  }, [searchQuery, selectedProductTypes, selectedDomains, selectedQualityLevel, selectedUseCases, sortBy]);

  // Backward compatibility
  const filteredProducts = filteredAndSortedProducts;

  return (
    <div className="flex-1">
      {/* Marketplace Header */}
      <div className="border-b">
        <div className="px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Data Product Marketplace
              </h1>
              <p className="text-muted-foreground mt-1">
                Discover, share, and deploy production-ready data products
              </p>
            </div>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Publish Product
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search data products by name, description, domain, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] h-11">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="quality">Quality Score</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="freshness">Freshest Data</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Access - Recently Viewed (Subtle) */}
          <div className="flex items-center gap-2 mt-3">
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Recent:</span>
            <div className="flex gap-2 flex-wrap">
              {mockProducts.slice(0, 3).map(product => (
                <Link key={product.id} href={`/discover/${product.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted text-xs h-6">
                    {product.displayName || product.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6 px-8 py-6 max-w-7xl mx-auto">
        {/* Left Sidebar - Filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-6 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {/* Filter Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-0 text-xs">
                  Clear all
                </Button>
              )}
            </div>

            {/* Product Type Filter */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('productType')}
                className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground/80 transition-colors"
              >
                <span>Product Type</span>
                {expandedSections.productType ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.productType && (
                <div className="space-y-2 pl-2">
                  {['Foundation', 'Domain', 'Solution'].map(type => {
                    const count = mockProducts.filter(p => p.productType === type).length;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={selectedProductTypes.includes(type)}
                            onCheckedChange={() => toggleFilter(type, selectedProductTypes, setSelectedProductTypes)}
                          />
                          <label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                            {type}
                          </label>
                        </div>
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Product Format Filter */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('productFormat')}
                className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground/80 transition-colors"
              >
                <span>Format</span>
                {expandedSections.productFormat ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.productFormat && (
                <div className="space-y-2 pl-2">
                  {['Stream', 'Dataset', 'API', 'Model', 'Dashboard', 'Pipeline'].map(format => {
                    const count = mockProducts.filter(p => p.productFormat === format).length;
                    if (count === 0) return null;
                    return (
                      <div key={format} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`format-${format}`}
                            checked={selectedProductFormats.includes(format)}
                            onCheckedChange={() => toggleFilter(format, selectedProductFormats, setSelectedProductFormats)}
                          />
                          <label htmlFor={`format-${format}`} className="text-sm cursor-pointer">
                            {format}
                          </label>
                        </div>
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Domain Filter */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('domain')}
                className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground/80 transition-colors"
              >
                <span>Domain</span>
                {expandedSections.domain ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.domain && (
                <div className="space-y-2 pl-2">
                  {['Customer', 'Financial', 'Operations', 'Marketing', 'Product'].map(domain => {
                    const count = mockProducts.filter(p => p.domain === domain).length;
                    return (
                      <div key={domain} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`domain-${domain}`}
                            checked={selectedDomains.includes(domain)}
                            onCheckedChange={() => toggleFilter(domain, selectedDomains, setSelectedDomains)}
                          />
                          <label htmlFor={`domain-${domain}`} className="text-sm cursor-pointer">
                            {domain}
                          </label>
                        </div>
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Quality Filter */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('quality')}
                className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground/80 transition-colors"
              >
                <span>Quality</span>
                {expandedSections.quality ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.quality && (
                <div className="space-y-2 pl-2">
                  {[
                    { value: 'high', label: 'High (90+)', filter: (p: DataProduct) => p.quality.dataQuality >= 90 },
                    { value: 'medium', label: 'Medium (70-89)', filter: (p: DataProduct) => p.quality.dataQuality >= 70 && p.quality.dataQuality < 90 }
                  ].map(({ value, label, filter }) => {
                    const count = mockProducts.filter(filter).length;
                    return (
                      <div key={value} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`quality-${value}`}
                            checked={selectedQualityLevel.includes(value)}
                            onCheckedChange={() => toggleFilter(value, selectedQualityLevel, setSelectedQualityLevel)}
                          />
                          <label htmlFor={`quality-${value}`} className="text-sm cursor-pointer">
                            {label}
                          </label>
                        </div>
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Freshness Filter */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('freshness')}
                className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground/80 transition-colors"
              >
                <span>Freshness</span>
                {expandedSections.freshness ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.freshness && (
                <div className="space-y-2 pl-2">
                  {['real-time', '5 minutes', 'hourly', 'daily'].map(freshness => {
                    const count = mockProducts.filter(p => p.sla.freshness === freshness).length;
                    return (
                      <div key={freshness} className="flex items-center justify-between">
                        <label className="text-sm cursor-pointer capitalize">
                          {freshness}
                        </label>
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Use Cases Filter */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('useCases')}
                className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground/80 transition-colors"
              >
                <span>Use Cases</span>
                {expandedSections.useCases ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.useCases && (
                <div className="space-y-2 pl-2 max-h-64 overflow-y-auto">
                  {allUseCases.slice(0, 15).map(useCase => {
                    const count = mockProducts.filter(p => p.useCases?.includes(useCase)).length;
                    return (
                      <div key={useCase} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`usecase-${useCase}`}
                            checked={selectedUseCases.includes(useCase)}
                            onCheckedChange={() => toggleFilter(useCase, selectedUseCases, setSelectedUseCases)}
                          />
                          <label htmlFor={`usecase-${useCase}`} className="text-sm cursor-pointer">
                            {useCase}
                          </label>
                        </div>
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                  {allUseCases.length > 15 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{allUseCases.length - 15} more use cases
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Active Filters</div>
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
                    {selectedProductFormats.map(format => (
                      <Badge key={format} variant="secondary" className="gap-1">
                        {format}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => toggleFilter(format, selectedProductFormats, setSelectedProductFormats)}
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
                    {selectedQualityLevel.map(level => (
                      <Badge key={level} variant="secondary" className="gap-1">
                        {level === 'high' ? 'High' : 'Medium'}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => toggleFilter(level, selectedQualityLevel, setSelectedQualityLevel)}
                        />
                      </Badge>
                    ))}
                    {selectedUseCases.map(useCase => (
                      <Badge key={useCase} variant="secondary" className="gap-1 text-xs">
                        {useCase.length > 12 ? useCase.substring(0, 12) + '...' : useCase}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => toggleFilter(useCase, selectedUseCases, setSelectedUseCases)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Recommendations Section - Only show when no active filters */}
          {!searchQuery && activeFilterCount === 0 && (
            <RecommendationsSection
              userId="finance_analysts_1"
              userDepartment="finance"
              businessKeywords={[]}
              limit={5}
            />
          )}

          {/* Results Count with Access Info */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground mb-1">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
                {(searchQuery || activeFilterCount > 0) && (
                  <span className="text-muted-foreground font-normal"> matching your criteria</span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {filteredProducts.filter(p => p.verified).length} you can access • {filteredProducts.filter(p => !p.verified).length} require approval
              </p>
            </div>
          </div>

          {/* Data Product Cards Grid - Optimized 3-column layout */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCardFactory key={product.id} product={product} />
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  No products match your search and filters. Try adjusting your criteria.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    clearAllFilters();
                    setSearchQuery('');
                  }}
                >
                  Clear All Filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
