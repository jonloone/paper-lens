'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Users, Clock, CheckCircle, TrendingUp, Sparkles, Activity, Database, DollarSign, Package, Settings, Target, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PersonaProvider } from '@/contexts/PersonaContext';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Import tab components
import { QuickStartTab } from '@/components/discover/ProductDetail/QuickStartTab';
import { NewOverviewTab } from '@/components/discover/ProductDetail/NewOverviewTab';
import { SampleDataTab } from '@/components/discover/ProductDetail/SampleDataTab';
import { OverviewTab } from '@/components/discover/ProductDetail/OverviewTab';
import { AccessTab } from '@/components/discover/ProductDetail/AccessTab';
import { SchemaTab } from '@/components/discover/ProductDetail/SchemaTab';
import { QualityTab } from '@/components/discover/ProductDetail/QualityTab';
import { UsageTab } from '@/components/discover/ProductDetail/UsageTab';
import { LineageTab } from '@/components/discover/ProductDetail/LineageTab';
import { GovernanceTab } from '@/components/discover/ProductDetail/GovernanceTab';
import { CompactBusinessContext } from '@/components/discover/ProductDetail/CompactBusinessContext';
import { ProductDetailSkeleton } from '@/components/discover/ProductDetail/ProductDetailSkeleton';
import { ProductChatAgent } from '@/components/discover/ProductDetail/ProductChatAgent';

interface ProductDetailPageProps {
  params: {
    productId: string;
  };
}

// Mock product data
const getProductById = (id: string) => {
  return {
    id,
    name: 'customer_360_view',
    displayName: 'Customer 360 View',
    version: '2.3.1',
    description: 'Complete, unified view of customer data combining demographics, transaction history, support tickets, and engagement metrics. Trusted source for customer analytics and ML models.',
    productType: 'Domain' as const,
    technicalType: 'Dataset',
    domain: 'Customer',
    owner: {
      team: 'Data Engineering Team',
      contact: 'data-eng@company.com'
    },
    sla: {
      uptime: 99.9,
      freshness: 'real-time',
      latency: '< 1 min'
    },
    quality: {
      dataQuality: 98,
      documentation: 95,
      testCoverage: 92,
      productionReadiness: 'Production' as const
    },
    dependencies: {
      upstream: ['salesforce_crm', 'billing_system', 'zendesk', 'app_events'],
      downstream: ['churn_prediction', 'revenue_dashboard', 'marketing_segmentation']
    },
    usage: {
      deployments: 45,
      uniqueConsumers: 2341,
      queriesPerDay: 48567
    },
    rating: 4.8,
    reviews: 127,
    tags: ['Sales', 'Customer', 'Analytics', 'Certified'],
    lastUpdated: '2 hours ago',
    verified: true,
    trending: true,
    featured: true,
    // YData Profiling metrics
    profiling: {
      qualityScore: 85,  // 0-100 from YData profiling
      rowCount: 2341567  // Actual row count from profiling
    },
    // Business context data from DataHub + ODPS
    businessContext: {
      targetConsumers: [
        'Marketing Analytics',
        'Data Science',
        'Customer Success',
        'Product Analytics',
        'Sales Operations'
      ],
      glossaryTerms: [
        {
          urn: 'urn:li:glossaryTerm:customer_lifetime_value',
          name: 'Customer Lifetime Value',
          definition: 'Total revenue expected from a customer over their entire relationship with the company',
          calculation: 'SUM(order_value) OVER (PARTITION BY customer_id ORDER BY order_date)'
        },
        {
          urn: 'urn:li:glossaryTerm:churn_risk_score',
          name: 'Churn Risk Score',
          definition: 'Likelihood of customer discontinuing service within next 90 days',
          calculation: 'CASE WHEN DATEDIFF(day, last_purchase_date, CURRENT_DATE) > 90 THEN 1 ELSE 0 END'
        },
        {
          urn: 'urn:li:glossaryTerm:customer_segment',
          name: 'Customer Segment',
          definition: 'RFM-based segmentation (Recency, Frequency, Monetary) for targeted marketing',
        }
      ],
      useCases: [
        'Customer segmentation for targeted marketing campaigns',
        'Churn prediction and proactive retention workflows',
        'Revenue forecasting and lifetime value analysis',
        'Product recommendation engine training data',
        'Customer health scoring for account management'
      ]
    }
  };
};

// Mock related products
const getRelatedProducts = () => {
  return [
    {
      id: 'product_metrics',
      displayName: 'Product Analytics',
      productType: 'Domain',
      domain: 'Product',
      quality: { dataQuality: 95 }
    },
    {
      id: 'revenue_360',
      displayName: 'Revenue 360',
      productType: 'Solution',
      domain: 'Financial',
      quality: { dataQuality: 97 }
    },
    {
      id: 'marketing_funnel',
      displayName: 'Marketing Funnel',
      productType: 'Solution',
      domain: 'Marketing',
      quality: { dataQuality: 93 }
    },
    {
      id: 'support_insights',
      displayName: 'Support Insights',
      productType: 'Domain',
      domain: 'Operations',
      quality: { dataQuality: 96 }
    }
  ];
};

function ProductDetailContent({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('access');

  // Fetch product data (synchronous for now)
  const product = getProductById(params.productId);
  const relatedProducts = getRelatedProducts();

  // Track tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Track tab view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'tab_view', {
        tab_name: newTab,
        product_id: params.productId
      });
    }
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/discover">Discover</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/discover?domain=${product.domain}`}>
                {product.domain}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.displayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Product Section - Hero + Chat + Tabs Layout */}
        <div className="space-y-6">
          {/* Hero Card with Integrated Chat */}
          <Card className="hero-card-gradient">
            <CardContent className="pt-8 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Product Info */}
                <div className="space-y-6">
                  {/* Title */}
                  <h1 className="text-4xl font-bold tracking-tight">
                    {product.displayName}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-base text-muted-foreground">
                    {product.domain} Domain • {product.productType} Product • v{product.version}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>

                  {/* Compact Business Context */}
                  <div>
                    <CompactBusinessContext
                      qualityScore={product.profiling.qualityScore}
                      rowCount={product.profiling.rowCount}
                      lastUpdated={product.lastUpdated}
                      glossaryTerms={product.businessContext.glossaryTerms}
                      owner={product.owner.team}
                      ownerContact={product.owner.contact}
                      upstreamCount={product.dependencies.upstream.length}
                      downstreamCount={product.dependencies.downstream.length}
                    />
                  </div>
                </div>

                {/* Right: Chat Agent */}
                <div className="h-[600px]">
                  <ProductChatAgent product={product} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Row: Full-width Consolidated Tabs */}
          <Card className="elevation-surface-1">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
              <div className="elevation-surface-1 border-b">
                <TabsList className="h-auto bg-transparent border-0 p-0 w-full grid grid-cols-4 px-6">
                  <TabsTrigger
                    value="access"
                    className="relative border-b-2 border-transparent data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none bg-transparent px-6 py-4 data-[state=active]:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Access
                  </TabsTrigger>
                  <TabsTrigger
                    value="schema"
                    className="relative border-b-2 border-transparent data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none bg-transparent px-6 py-4 data-[state=active]:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Schema
                  </TabsTrigger>
                  <TabsTrigger
                    value="quality"
                    className="relative border-b-2 border-transparent data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none bg-transparent px-6 py-4 data-[state=active]:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Quality
                  </TabsTrigger>
                  <TabsTrigger
                    value="lineage"
                    className="relative border-b-2 border-transparent data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none bg-transparent px-6 py-4 data-[state=active]:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Lineage
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <TabsContent value="access" className="mt-0 h-full">
                  <div className="space-y-8">
                    <UsageTab product={product} />
                    <AccessTab product={product} />
                  </div>
                </TabsContent>

                <TabsContent value="schema" className="mt-0 h-full">
                  <SchemaTab product={product} />
                </TabsContent>

                <TabsContent value="quality" className="mt-0 h-full">
                  <QualityTab product={product} />
                </TabsContent>

                <TabsContent value="lineage" className="mt-0 h-full">
                  <LineageTab productId={params.productId} productName={product.displayName} />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <PersonaProvider>
      <ProductDetailContent params={params} />
    </PersonaProvider>
  );
}
