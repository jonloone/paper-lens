'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QualityBreakdown, getQualityIcon, getQualityColor, formatUpdateFrequency, formatTimestamp } from '@/lib/types/source-quality';
import { CheckCircle2, AlertTriangle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualityBreakdownCardProps {
  quality: QualityBreakdown;
  className?: string;
}

export function QualityBreakdownCard({ quality, className }: QualityBreakdownCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quality Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Completeness */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getQualityIcon(quality.completeness.status)}</span>
            <div>
              <p className="text-sm font-medium">Completeness</p>
              {quality.completeness.issues && quality.completeness.issues.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {quality.completeness.issues[0].description}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-sm font-semibold", getQualityColor(quality.completeness.score))}>
              {quality.completeness.score}%
            </p>
            <p className="text-xs text-muted-foreground capitalize">{quality.completeness.status}</p>
          </div>
        </div>

        {/* Uniqueness */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getQualityIcon(quality.uniqueness.status)}</span>
            <div>
              <p className="text-sm font-medium">Uniqueness</p>
              {quality.uniqueness.issues && quality.uniqueness.issues.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {quality.uniqueness.issues[0].description}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-sm font-semibold", getQualityColor(quality.uniqueness.score))}>
              {quality.uniqueness.score}%
            </p>
            <p className="text-xs text-muted-foreground capitalize">{quality.uniqueness.status}</p>
          </div>
        </div>

        {/* Freshness */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getQualityIcon(quality.freshness.status)}</span>
            <div>
              <p className="text-sm font-medium">Freshness</p>
              <p className="text-xs text-muted-foreground">
                {formatTimestamp(quality.freshness.lastUpdated)} · {formatUpdateFrequency(quality.freshness.expectedFrequency)}
              </p>
            </div>
          </div>
          <div className="text-right">
            {quality.freshness.isStale ? (
              <Badge variant="destructive" className="text-xs">Stale</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Fresh</Badge>
            )}
            {quality.freshness.updateHistory && quality.freshness.updateHistory.length > 0 && (
              <div className="mt-1">
                <Sparkline data={quality.freshness.updateHistory} />
              </div>
            )}
          </div>
        </div>

        {/* Validity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getQualityIcon(quality.validity.status)}</span>
            <div>
              <p className="text-sm font-medium">Validity</p>
              {quality.validity.issues && quality.validity.issues.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {quality.validity.issues[0].description}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-sm font-semibold", getQualityColor(quality.validity.score))}>
              {quality.validity.score}%
            </p>
            <p className="text-xs text-muted-foreground capitalize">{quality.validity.status}</p>
          </div>
        </div>
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
