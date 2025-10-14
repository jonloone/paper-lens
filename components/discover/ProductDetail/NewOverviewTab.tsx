'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, TrendingUp, Sparkles, Code2, BarChart3, Mail, FileText, Database, DollarSign, Package, Settings, Target } from 'lucide-react';

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
      {/* Business Context - Primary Card */}
      <Card className="bg-muted/50 border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Business Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h3 className="font-semibold text-base mb-2">What is this?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-2">Who uses this?</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Marketing Teams</Badge>
              <Badge variant="secondary">Sales Operations</Badge>
              <Badge variant="secondary">Customer Success</Badge>
              <Badge variant="secondary">Data Analytics</Badge>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-2">Why does it matter?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This dataset serves as the single source of truth for customer intelligence, enabling data-driven decisions
              across acquisition, retention, and growth initiatives. Used in {product.usage.deployments} production workflows.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Common Use Cases - Secondary Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Common Use Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-sm">Customer Segmentation</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Group customers by value, behavior, and engagement for targeted campaigns
              </p>
              <div className="text-xs text-muted-foreground">
                Marketing, Sales
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-sm">Churn Prevention</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Identify at-risk customers early and trigger retention workflows
              </p>
              <div className="text-xs text-muted-foreground">
                Customer Success
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-sm">Revenue Forecasting</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Predict future revenue using lifetime value and purchase patterns
              </p>
              <div className="text-xs text-muted-foreground">
                Finance, Strategy
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner & Support - New Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Owner & Support</CardTitle>
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
        <Card className="bg-muted/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Related Products</CardTitle>
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
