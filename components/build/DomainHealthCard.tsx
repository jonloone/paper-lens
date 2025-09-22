'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UnifiedIcon } from '@/components/ui/unified-icon';
import { cn } from '@/lib/utils';
import { Domain, DomainActivity } from '@/lib/types/domain';
import { formatDistanceToNow } from 'date-fns';

interface DomainHealthCardProps {
  domain: Domain;
  onEnterDomain: (domainId: string) => void;
  onCreateNew: (domainId: string) => void;
}

export function DomainHealthCard({ domain, onEnterDomain, onCreateNew }: DomainHealthCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getActivityStatusIcon = (activity: DomainActivity) => {
    switch (activity.status) {
      case 'completed':
        return <UnifiedIcon name="CheckCircle" className="h-3 w-3 text-green-500" />;
      case 'in_progress':
        return <UnifiedIcon name="Clock" className="h-3 w-3 text-blue-500" />;
      case 'blocked':
        return <UnifiedIcon name="AlertCircle" className="h-3 w-3 text-red-500" />;
      case 'attention_required':
        return <UnifiedIcon name="AlertTriangle" className="h-3 w-3 text-yellow-500" />;
      default:
        return <UnifiedIcon name="Activity" className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const primaryStakeholder = domain.businessContext.primaryStakeholders[0];
  const keyMetric = domain.businessContext.keyMetrics[0];

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg bg-gradient-to-r',
              domain.color
            )}>
              <UnifiedIcon name={domain.icon} className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{domain.name} Domain</CardTitle>
              <CardDescription className="text-sm">
                Owner: {domain.ownership.team}
              </CardDescription>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(domain.health.status)} className="text-xs">
            {domain.health.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-2xl font-bold">{domain.health.productsCount}</div>
            <div className="text-xs text-muted-foreground">Active Products</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {domain.health.qualityScore}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Quality Score</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {domain.health.activeDevProjects}
            </div>
            <div className="text-xs text-muted-foreground">In Development</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {formatTimeAgo(domain.health.lastActivity)}
            </div>
            <div className="text-xs text-muted-foreground">Last Activity</div>
          </div>
        </div>

        {/* Business Context */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Business Context
          </div>
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground">Stakeholder:</span>{' '}
              <span className="font-medium">{primaryStakeholder?.name} ({primaryStakeholder?.role})</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">{keyMetric?.name}:</span>{' '}
              <span className="font-medium">{keyMetric?.value}</span>
              {keyMetric?.trend && (
                <UnifiedIcon
                  name={keyMetric.trend === 'up' ? 'TrendingUp' : keyMetric.trend === 'down' ? 'TrendingDown' : 'Minus'}
                  className={cn(
                    'h-3 w-3 ml-1 inline',
                    keyMetric.trend === 'up' ? 'text-green-500' :
                    keyMetric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                  )}
                />
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recent Activity
          </div>
          <div className="space-y-2">
            {domain.recentActivity.slice(0, 2).map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 text-xs">
                {getActivityStatusIcon(activity)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{activity.title}</div>
                  {activity.status === 'in_progress' && activity.progress && (
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <Progress value={activity.progress} className="h-1 flex-1" />
                        <span className="text-xs text-muted-foreground">{activity.progress}%</span>
                      </div>
                    </div>
                  )}
                  {activity.status === 'attention_required' && (
                    <div className="text-yellow-600 dark:text-yellow-400 mt-1">
                      Attention Required
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            size="sm"
            onClick={() => onEnterDomain(domain.id)}
          >
            Enter Domain
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateNew(domain.id)}
          >
            <UnifiedIcon name="Plus" className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}