'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Database, TrendingUp, DollarSign, Activity, Calendar, Globe, AlertCircle } from 'lucide-react';

interface MetadataPanelProps {
  product: any;
}

export function MetadataPanel({ product }: MetadataPanelProps) {
  // Extended metadata that should come from API
  const metadata = {
    freshness: {
      updateCadence: 'Every 4 hours',
      lastRefresh: '2:15 PM',
      nextUpdate: '6:15 PM',
      sla: '< 6 hours',
      historicalDepth: '3 years (Jan 2022 - present)',
    },
    coverage: {
      totalRecords: '2.3M active customers',
      completeness: '99.2% of customer base',
      geographicCoverage: 'Global (47 countries)',
      businessUnits: 'All divisions',
      exclusions: 'Deleted accounts, test customers',
    },
    performance: {
      avgQueryTime: '2.3s',
      p95QueryTime: '8.1s',
      p99QueryTime: '15.2s',
      recommendedUsage: 'Analytics queries only',
    },
    cost: {
      costPerTB: '$0.05',
      avgQueryCost: '$0.12',
      monthlyActive: '147 users',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Data Freshness Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Data Freshness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Update Cadence</div>
              <div className="font-medium">{metadata.freshness.updateCadence}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">SLA</div>
              <div className="font-medium text-emerald-600">{metadata.freshness.sla}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Last Refresh</div>
              <div className="font-medium">{metadata.freshness.lastRefresh}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Next Update</div>
              <div className="font-medium text-muted-foreground">{metadata.freshness.nextUpdate}</div>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Historical Depth: {metadata.freshness.historicalDepth}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage & Completeness Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Coverage & Completeness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Total Records:</span>
              <span className="font-medium text-right">{metadata.coverage.totalRecords}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Completeness:</span>
              <span className="font-medium text-emerald-600">{metadata.coverage.completeness}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Geographic:</span>
              <span className="font-medium text-right">{metadata.coverage.geographicCoverage}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Business Units:</span>
              <span className="font-medium">{metadata.coverage.businessUnits}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-start gap-2 text-xs">
              <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">
                Excludes: {metadata.coverage.exclusions}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Avg Query Time</div>
              <div className="font-mono font-medium text-emerald-600">{metadata.performance.avgQueryTime}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">P95 Latency</div>
              <div className="font-mono font-medium">{metadata.performance.p95QueryTime}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground mb-1">P99 Latency</div>
              <div className="font-mono font-medium text-amber-600">{metadata.performance.p99QueryTime}</div>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">
                {metadata.performance.recommendedUsage}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Cost Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cost per TB scanned:</span>
              <span className="font-mono font-medium">{metadata.cost.costPerTB}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg query cost:</span>
              <span className="font-mono font-medium text-emerald-600">{metadata.cost.avgQueryCost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly active users:</span>
              <span className="font-medium">{metadata.cost.monthlyActive}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              💡 Tip: Use <code className="font-mono bg-muted px-1 py-0.5 rounded">WHERE</code> clauses to reduce scan size
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
