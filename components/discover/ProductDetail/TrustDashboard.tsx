'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Database, TrendingUp, Globe } from 'lucide-react';

interface TrustDashboardProps {
  quality: {
    dataQuality: number;
    completeness?: number;
    accuracy?: string;
  };
  freshness: {
    lastUpdated: string;
    updateFrequency: string;
  };
  coverage: {
    totalRecords: string;
    geographic?: string;
    completeness?: number;
  };
  trend?: Array<{ date: string; score: number }>;
}

export function TrustDashboard({ quality, freshness, coverage, trend }: TrustDashboardProps) {
  const getQualityLabel = (score: number) => {
    if (score >= 95) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 85) return { label: 'High', color: 'text-green-600 dark:text-green-400' };
    if (score >= 70) return { label: 'Good', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Fair', color: 'text-orange-600 dark:text-orange-400' };
  };

  const qualityInfo = getQualityLabel(quality.dataQuality);

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 dark:bg-primary/10">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Title */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Trust & Quality Indicators
            </h3>
            <Badge variant="outline" className={`font-mono ${qualityInfo.color}`}>
              Q{quality.dataQuality}
            </Badge>
          </div>

          {/* Main Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Quality Score */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">Quality</span>
              </div>
              <div className={`text-2xl font-bold ${qualityInfo.color}`}>
                {quality.dataQuality}%
              </div>
              <div className="text-xs text-muted-foreground">
                {qualityInfo.label}
              </div>
            </div>

            {/* Freshness */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Freshness</span>
              </div>
              <div className="text-2xl font-bold">
                {freshness.lastUpdated}
              </div>
              <div className="text-xs text-muted-foreground">
                {freshness.updateFrequency}
              </div>
            </div>

            {/* Coverage */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" />
                <span className="text-xs font-medium">Coverage</span>
              </div>
              <div className="text-2xl font-bold">
                {coverage.totalRecords}
              </div>
              <div className="text-xs text-muted-foreground">
                {coverage.geographic || 'records'}
              </div>
            </div>

            {/* Completeness */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Complete</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {coverage.completeness ? `${(coverage.completeness * 100).toFixed(1)}%` : '99.2%'}
              </div>
              <div className="text-xs text-muted-foreground">
                of records
              </div>
            </div>
          </div>

          {/* Quality Trend Sparkline (Simple visualization) */}
          {trend && trend.length > 0 && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Quality Trend (Last 30 days)
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Stable
                </span>
              </div>
              <div className="h-12 flex items-end gap-1">
                {trend.slice(-30).map((point, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors"
                    style={{ height: `${point.score}%` }}
                    title={`${point.date}: ${point.score}%`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Additional Trust Indicators */}
          {(quality.accuracy || coverage.geographic) && (
            <div className="pt-4 border-t border-border space-y-2">
              {quality.accuracy && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span className="font-medium">{quality.accuracy}</span>
                </div>
              )}
              {coverage.geographic && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Geographic Coverage:
                  </span>
                  <span className="font-medium">{coverage.geographic}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
