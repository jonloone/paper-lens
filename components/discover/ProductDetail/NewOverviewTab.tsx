'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, TrendingUp, Sparkles, Code2, BarChart3 } from 'lucide-react';

interface NewOverviewTabProps {
  product: any;
}

export function NewOverviewTab({ product }: NewOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Business Context - Primary Card */}
      <Card className="border-l-4 border-l-primary">
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

      {/* Questions This Answers - Secondary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Questions This Data Answers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm mb-1">Which customers are most valuable?</div>
                <div className="text-sm text-muted-foreground">
                  Query by <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">lifetime_value</code> and{' '}
                  <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">segment</code> to identify VIP customers
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm mb-1">Who is at risk of churning?</div>
                <div className="text-sm text-muted-foreground">
                  Use <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">churn_risk</code> score
                  combined with engagement metrics for proactive retention
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm mb-1">How do customers engage across channels?</div>
                <div className="text-sm text-muted-foreground">
                  Track interactions via <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">last_interaction_date</code>,{' '}
                  <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">total_sessions</code>, and channel data
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Use Cases - Secondary Card */}
      <Card>
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

      {/* Trust Summary - Highlight Card (Tertiary/Special) */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-lg">Trust & Quality Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                {product.quality.dataQuality}%
              </div>
              <div className="text-sm text-muted-foreground">Quality Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">
                {product.lastUpdated}
              </div>
              <div className="text-sm text-muted-foreground">Last Updated</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">
                {product.usage.uniqueConsumers.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">
                {product.sla.uptime}%
              </div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
