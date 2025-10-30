'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, TrendingUp, Clock, Code2, BarChart3, Mail, FileText, Database, DollarSign, Package, Settings, Target, Activity, ArrowUp, ArrowDown, BookOpen, Lightbulb } from 'lucide-react';
import { WhoUsesThisCard } from './WhoUsesThisCard';
import { KeyConceptsCard } from './KeyConceptsCard';
import { UseCasesCard } from './UseCasesCard';
import { ProductAIChat } from './ProductAIChat';

interface NewOverviewTabProps {
  product: any;
  relatedProducts?: any[];
}

export function NewOverviewTab({ product, relatedProducts = [] }: NewOverviewTabProps) {
  // Domain icon mapping
  const domainIcons: Record<string, any> = {
    'Customer': Users,
    'Financial': DollarSign,
    'Product': Package,
    'Operations': Settings,
    'Marketing': Target,
  };

  const getQualityColor = (score: number) => {
    if (score >= 95) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Fitness Indicators - Moved from hero card */}
      <Card className="elevation-surface-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">At a Glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-bold">{product.quality.dataQuality}%</p>
              <p className="text-xs text-muted-foreground mt-1">Data Quality</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold capitalize">{product.sla.freshness}</p>
              <p className="text-xs text-muted-foreground mt-1">Freshness</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold">{product.usage.uniqueConsumers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Active Users</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold">{product.sla.uptime}%</p>
              <p className="text-xs text-muted-foreground mt-1">SLA Uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Context - Component-Based with AI */}
      {product.businessContext && (
        <>
          {/* Description Card */}
          {product.businessContext.description && (
            <Card className="elevation-surface-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  What is this?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {product.businessContext.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 2-Column Grid for Visual Components */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <WhoUsesThisCard
                targetConsumers={product.businessContext.targetConsumers || []}
                maxVisible={5}
              />
              <UseCasesCard
                useCases={product.businessContext.useCases || []}
                maxVisible={3}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <KeyConceptsCard
                glossaryTerms={product.businessContext.glossaryTerms || []}
                maxVisible={3}
                showCalculations={false}
              />
              <ProductAIChat
                productName={product.displayName}
                productType={product.productType}
              />
            </div>
          </div>
        </>
      )}

      {/* Technical Specifications */}
      <Card className="elevation-surface-4 border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            Technical Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                SLA & Uptime
              </h3>
              <p className="text-2xl font-bold">{product.sla.uptime}%</p>
              <p className="text-xs text-muted-foreground mt-1">Guaranteed uptime</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Data Freshness
              </h3>
              <p className="text-2xl font-bold capitalize">{product.sla.freshness}</p>
              <p className="text-xs text-muted-foreground mt-1">Update frequency</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Query Latency
              </h3>
              <p className="text-2xl font-bold">{product.sla.latency}</p>
              <p className="text-xs text-muted-foreground mt-1">Average response time</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-sm mb-3">Production Readiness</h3>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-xs">
                {product.quality.productionReadiness}
              </Badge>
              <span className="text-xs text-muted-foreground">
                v{product.version} • Last updated {product.lastUpdated}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependencies */}
      <Card className="elevation-surface-4">
        <CardHeader>
          <CardTitle>Dependencies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-blue-600" />
              Upstream Sources ({product.dependencies.upstream.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.dependencies.upstream.map((source: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {source}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-green-600" />
              Downstream Consumers ({product.dependencies.downstream.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.dependencies.downstream.map((consumer: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {consumer}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="elevation-surface-4">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{product.usage.deployments}</p>
              <p className="text-xs text-muted-foreground mt-1">Active Deployments</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{product.usage.uniqueConsumers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Unique Consumers</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{product.usage.queriesPerDay.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Queries Per Day</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner & Support - New Card */}
      <Card className="elevation-surface-4">
        <CardHeader>
          <CardTitle>Owner & Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Product Owner</h3>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{product.owner.team}</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${product.owner.contact}`} className="text-sm text-primary hover:underline">
                    {product.owner.contact}
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2">Documentation</h3>
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                View Full Documentation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Products - Moved from page bottom */}
      {relatedProducts.length > 0 && (
        <Card className="elevation-surface-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Related Products</CardTitle>
              <a href="/discover" className="text-sm font-medium text-primary hover:underline whitespace-nowrap">
                View all <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relProduct) => {
                const RelatedIcon = domainIcons[relProduct.domain] || Database;

                return (
                  <div key={relProduct.id} className="group relative">
                    <div className="relative">
                      <Card className="aspect-4/3 w-full rounded-lg bg-gradient-to-br from-muted/20 to-muted/40 overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center p-8">
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm shadow-lg group-hover:scale-105 transition-transform duration-200">
                            <RelatedIcon className="h-10 w-10 text-primary" />
                          </div>
                        </div>
                      </Card>
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <div className="w-full rounded-md bg-background/75 backdrop-blur-sm px-4 py-2 text-center text-sm font-medium">
                          View Product
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-base font-medium">
                      <h3>
                        <a href={`/discover/${relProduct.id}`}>
                          <span aria-hidden="true" className="absolute inset-0"></span>
                          {relProduct.displayName}
                        </a>
                      </h3>
                      <p className={`font-mono ${getQualityColor(relProduct.quality.dataQuality)}`}>
                        Q{relProduct.quality.dataQuality}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{relProduct.productType}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
