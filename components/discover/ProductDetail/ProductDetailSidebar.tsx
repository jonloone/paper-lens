'use client';

import { Clock, Users, CheckCircle, Activity, Mail, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductDetailSidebarProps {
  product: {
    sla: { uptime: number; freshness: string; latency?: string };
    quality: { dataQuality: number; documentation: number; testCoverage: number; productionReadiness: string };
    usage: { deployments: number; uniqueConsumers: number; queriesPerDay?: number };
    owner: { team: string; contact: string };
    tags: string[];
  };
}

export function ProductDetailSidebar({ product }: ProductDetailSidebarProps) {
  const getQualityColor = (score: number) => {
    if (score >= 95) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getQualityBgColor = (score: number) => {
    if (score >= 95) return 'bg-emerald-500/20';
    if (score >= 85) return 'bg-green-500/20';
    if (score >= 70) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  };

  const getFreshnessColor = (freshness: string) => {
    const colors: Record<string, string> = {
      'real-time': 'text-emerald-600 dark:text-emerald-400',
      '5 minutes': 'text-green-600 dark:text-green-400',
      'hourly': 'text-blue-600 dark:text-blue-400',
      'daily': 'text-amber-600 dark:text-amber-400',
    };
    return colors[freshness] || 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* SLA Metrics */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          SLA & Performance
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Uptime</span>
              <span className="text-sm font-semibold">{product.sla.uptime}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full", product.sla.uptime >= 99 ? "bg-emerald-500/50" : "bg-amber-500/50")}
                style={{ width: `${product.sla.uptime}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Data Freshness</span>
            <span className={cn("text-sm font-medium", getFreshnessColor(product.sla.freshness))}>
              {product.sla.freshness}
            </span>
          </div>
          {product.sla.latency && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Latency</span>
              <span className="text-sm font-medium">{product.sla.latency}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Quality Indicators */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
          Quality Metrics
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Data Quality</span>
              <span className={cn("text-sm font-semibold", getQualityColor(product.quality.dataQuality))}>
                Q{product.quality.dataQuality}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full", getQualityBgColor(product.quality.dataQuality))}
                style={{ width: `${product.quality.dataQuality}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Documentation</span>
              <span className={cn("text-sm font-semibold", getQualityColor(product.quality.documentation))}>
                {product.quality.documentation}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full", getQualityBgColor(product.quality.documentation))}
                style={{ width: `${product.quality.documentation}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Test Coverage</span>
              <span className={cn("text-sm font-semibold", getQualityColor(product.quality.testCoverage))}>
                {product.quality.testCoverage}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full", getQualityBgColor(product.quality.testCoverage))}
                style={{ width: `${product.quality.testCoverage}%` }}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <Badge variant={product.quality.productionReadiness === 'Production' ? 'default' : 'secondary'}>
              {product.quality.productionReadiness}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Usage Stats */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Usage Statistics
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Active Deployments</span>
            <span className="text-sm font-semibold">{product.usage.deployments}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Unique Consumers</span>
            <span className="text-sm font-semibold">{product.usage.uniqueConsumers.toLocaleString()}</span>
          </div>
          {product.usage.queriesPerDay && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Queries/Day</span>
              <span className="text-sm font-semibold">{product.usage.queriesPerDay.toLocaleString()}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Owner Contact */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Owner & Contact
        </h3>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Team</span>
            <span className="text-sm font-medium">{product.owner.team}</span>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={`mailto:${product.owner.contact}`}>
              <Mail className="h-3 w-3 mr-2" />
              Contact Team
            </a>
          </Button>
        </div>
      </Card>

      {/* Tags */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
