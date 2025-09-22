'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnifiedIcon } from '@/components/ui/unified-icon';
import { cn } from '@/lib/utils';
import { OrganizationalActivity, CrossDomainDependency } from '@/lib/types/domain';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityFeedProps {
  organizationalActivity: OrganizationalActivity[];
  crossDomainDependencies: CrossDomainDependency[];
}

export function RecentActivityFeed({
  organizationalActivity,
  crossDomainDependencies
}: RecentActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'pattern_reuse':
        return <UnifiedIcon name="Package" className="h-4 w-4 text-blue-500" />;
      case 'schema_change':
        return <UnifiedIcon name="AlertTriangle" className="h-4 w-4 text-yellow-500" />;
      case 'source_added':
        return <UnifiedIcon name="Cable" className="h-4 w-4 text-green-500" />;
      case 'cross_domain_collaboration':
        return <UnifiedIcon name="Share2" className="h-4 w-4 text-purple-500" />;
      default:
        return <UnifiedIcon name="Activity" className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High Impact</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium Impact</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low Impact</Badge>;
      default:
        return null;
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'customer':
        return 'text-blue-600 dark:text-blue-400';
      case 'financial':
        return 'text-green-600 dark:text-green-400';
      case 'product':
        return 'text-purple-600 dark:text-purple-400';
      case 'operations':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="space-y-6">
      {/* Cross-Domain Dependencies */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <UnifiedIcon name="Share2" className="h-5 w-5" />
            Cross-Domain Activity
          </CardTitle>
          <CardDescription>
            Data flows and dependencies between business domains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {crossDomainDependencies.map((dependency, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 flex-1">
                <span className={cn('font-medium capitalize', getDomainColor(dependency.fromDomain))}>
                  {dependency.fromDomain}
                </span>
                <UnifiedIcon
                  name={dependency.relationship === 'uses' ? 'ArrowLeft' : 'ArrowRight'}
                  className="h-4 w-4 text-muted-foreground"
                />
                <span className={cn('font-medium capitalize', getDomainColor(dependency.toDomain))}>
                  {dependency.toDomain}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {dependency.dataProduct}
              </div>
            </div>
          ))}

          {/* Example cross-domain activities from PRD */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Revenue Attribution using Customer + Financial + Product data
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Multi-domain collaboration for comprehensive revenue analysis
            </div>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Churn Analysis dependencies: Customer events → Product usage → Financial
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              Sequential data pipeline across three domains
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Organizational Activity */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <UnifiedIcon name="Activity" className="h-5 w-5" />
            Recent Organizational Activity
          </CardTitle>
          <CardDescription>
            Platform-wide patterns, changes, and collaboration highlights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizationalActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm leading-tight">{activity.title}</h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getImpactBadge(activity.impact)}
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Affected domains:</span>
                  <div className="flex gap-1">
                    {activity.affectedDomains.map((domain) => (
                      <Badge
                        key={domain}
                        variant="outline"
                        className={cn('text-xs', getDomainColor(domain))}
                      >
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}