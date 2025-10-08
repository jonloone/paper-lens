'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QualityBreakdown, getQualityColor, formatUpdateFrequency, formatTimestamp } from '@/lib/types/source-quality';
import { CheckCircle2, AlertTriangle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Local icon helper - replaces emoji with Lucide icons
function getQualityIconComponent(status: 'high' | 'medium' | 'low') {
  switch (status) {
    case 'high': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case 'low': return <XCircle className="w-4 h-4 text-red-600" />;
  }
}

interface QualityBreakdownCardProps {
  quality: QualityBreakdown;
  className?: string;
}

export function QualityBreakdownCard({ quality, className }: QualityBreakdownCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Quality Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Completeness */}
        <div className="flex items-center justify-between py-2 border-b border-dashed">
          <div className="flex items-center gap-2">
            {getQualityIconComponent(quality.completeness.status)}
            <span className="text-sm font-medium">Completeness</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-semibold", getQualityColor(quality.completeness.score))}>
              {quality.completeness.score}%
            </span>
          </div>
        </div>

        {/* Uniqueness */}
        <div className="flex items-center justify-between py-2 border-b border-dashed">
          <div className="flex items-center gap-2">
            {getQualityIconComponent(quality.uniqueness.status)}
            <span className="text-sm font-medium">Uniqueness</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-semibold", getQualityColor(quality.uniqueness.score))}>
              {quality.uniqueness.score}%
            </span>
          </div>
        </div>

        {/* Freshness */}
        <div className="flex items-center justify-between py-2 border-b border-dashed">
          <div className="flex items-center gap-2">
            <Clock className={cn(
              "w-4 h-4",
              quality.freshness.isStale ? "text-yellow-600" : "text-green-600"
            )} />
            <span className="text-sm font-medium">Freshness</span>
          </div>
          <div className="text-right">
            <div className="text-sm">{formatTimestamp(quality.freshness.lastUpdated)}</div>
            <div className="text-xs text-muted-foreground">{formatUpdateFrequency(quality.freshness.expectedFrequency)}</div>
          </div>
        </div>

        {/* Validity */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            {getQualityIconComponent(quality.validity.status)}
            <span className="text-sm font-medium">Validity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-semibold", getQualityColor(quality.validity.score))}>
              {quality.validity.score}%
            </span>
          </div>
        </div>

        {/* Issues Summary */}
        {(quality.completeness.issues?.length || quality.uniqueness.issues?.length || quality.validity.issues?.length) ? (
          <div className="pt-2 mt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {quality.completeness.issues?.[0]?.description ||
               quality.uniqueness.issues?.[0]?.description ||
               quality.validity.issues?.[0]?.description}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// Simple sparkline component
function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 50;
  const height = 20;
  const step = width / (data.length - 1);

  const points = data.map((value, i) => {
    const x = i * step;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary"
      />
    </svg>
  );
}
