'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Users, Clock, CheckCircle, TrendingUp, Sparkles, Activity, Database, DollarSign, Package, Settings, Target, Heart, Share2, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonaProvider, usePersona } from '@/contexts/PersonaContext';
import { getPersonaDisplayName, getPersonaDescription, type ProductDetailPersona } from '@/lib/services/persona-detection';
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
import { FitnessIndicators } from '@/components/discover/ProductDetail/FitnessIndicators';

interface ProductDetailPageProps {
  params: {
    productId: string;
  };
}

// Mock product data (will be replaced with API call)
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
    featured: true
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
  const { persona, setPersona, getDefaultTab } = usePersona();
  const [activeTab, setActiveTab] = useState(getDefaultTab());

  // Update active tab when persona changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [persona, getDefaultTab]);

  // Fetch product data (mock for now)
  const product = getProductById(params.productId);
  const relatedProducts = getRelatedProducts();

  const handlePersonaChange = (newPersona: string) => {
    setPersona(newPersona as ProductDetailPersona);
    // Track persona change
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'persona_change', {
        previous_persona: persona,
        new_persona: newPersona,
        product_id: params.productId
      });
    }
  };

  // Track tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Track tab view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'tab_view', {
        tab_name: newTab,
        persona: persona,
        product_id: params.productId
      });
    }
  };

  // Simulate health status
  const healthStatus = product.sla.uptime >= 99 ? 'Healthy' : product.sla.uptime >= 95 ? 'Degraded' : 'Offline';
  const healthColor = healthStatus === 'Healthy' ? 'bg-emerald-500' : healthStatus === 'Degraded' ? 'bg-amber-500' : 'bg-red-500';

  // Domain icon mapping
  const domainIcons: Record<string, any> = {
    'Customer': Users,
    'Financial': DollarSign,
    'Product': Package,
    'Operations': Settings,
    'Marketing': Target,
  };

  const DomainIcon = domainIcons[product.domain] || Database;

  const getQualityColor = (score: number) => {
    if (score >= 95) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
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

        {/* Product Section - Hero Card with Tabs */}
        <div className="space-y-6">
          {/* Hero Card - Large Title + Quality Indicators */}
          <Card>
            <CardContent className="pt-8 pb-6">
              {/* Header with title and actions */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-6xl font-bold tracking-tight mb-3">
                    {product.displayName}
                  </h1>
                  <p className="text-base text-muted-foreground">
                    {product.domain} Domain • {product.productType} Product • v{product.version}
                  </p>
                </div>
                {/* Actions in top right */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Heart className="h-4 w-4" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                    <Button size="sm" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Request Access
                    </Button>
                  </div>
                  {/* Persona Selector */}
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                    <Select value={persona} onValueChange={handlePersonaChange}>
                      <SelectTrigger className="w-[200px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data_analyst">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{getPersonaDisplayName('data_analyst')}</span>
                            <span className="text-xs text-muted-foreground">{getPersonaDescription('data_analyst')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="data_engineer">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{getPersonaDisplayName('data_engineer')}</span>
                            <span className="text-xs text-muted-foreground">{getPersonaDescription('data_engineer')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="business_stakeholder">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{getPersonaDisplayName('business_stakeholder')}</span>
                            <span className="text-xs text-muted-foreground">{getPersonaDescription('business_stakeholder')}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                {product.description}
              </p>

              {/* Fitness Indicators Section */}
              <div className="border-t pt-6">
                <FitnessIndicators
                  quality={{
                    dataQuality: product.quality.dataQuality
                  }}
                  freshness={{
                    updateFrequency: product.sla.freshness
                  }}
                  usage={{
                    uniqueConsumers: product.usage.uniqueConsumers
                  }}
                  sla={{
                    uptime: product.sla.uptime
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section - Separate Container */}
          <Card>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <div className="bg-muted/20">
                <TabsList className="h-auto bg-transparent border-0 p-0 w-full justify-between px-6">
                  <TabsTrigger
                    value="quickstart"
                    className="relative border-b-2 border-transparent data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none bg-transparent px-8 py-4 data-[state=active]:font-semibold flex-1"
                  >
                    Quick Start
                  </TabsTrigger>
                  <TabsTrigger
                    value="overview"
                    className="relative border-b-2 border-transparent data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none bg-transparent px-8 py-4 data-[state=active]:font-semibold flex-1"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="schema"
                    className="relative border-b-2 border-transparent data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none bg-transparent px-8 py-4 data-[state=active]:font-semibold flex-1"
                  >
                    Schema
                  </TabsTrigger>
                  <TabsTrigger
                    value="quality"
                    className="relative border-b-2 border-transparent data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none bg-transparent px-8 py-4 data-[state=active]:font-semibold flex-1"
                  >
                    Quality
                  </TabsTrigger>
                  <TabsTrigger
                    value="lineage"
                    className="relative border-b-2 border-transparent data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none bg-transparent px-8 py-4 data-[state=active]:font-semibold flex-1"
                  >
                    Lineage
                  </TabsTrigger>
                  <TabsTrigger
                    value="access"
                    className="relative border-b-2 border-transparent data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none bg-transparent px-8 py-4 data-[state=active]:font-semibold flex-1"
                  >
                    Access
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="bg-background px-6 pb-6">
                <TabsContent value="quickstart" className="mt-6">
                  <QuickStartTab product={product} />
                </TabsContent>

                <TabsContent value="overview" className="mt-6">
                  <NewOverviewTab product={product} relatedProducts={relatedProducts} />
                </TabsContent>

                <TabsContent value="schema" className="mt-6">
                  <SchemaTab product={product} />
                  <div className="mt-8">
                    <OverviewTab product={product} />
                  </div>
                </TabsContent>

                <TabsContent value="quality" className="mt-6">
                  <QualityTab product={product} />
                </TabsContent>

                <TabsContent value="lineage" className="mt-6">
                  <LineageTab productId={params.productId} productName={product.displayName} />
                </TabsContent>

                <TabsContent value="access" className="mt-6">
                  <div className="space-y-8">
                    <UsageTab product={product} />
                    <AccessTab product={product} />
                  </div>
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
