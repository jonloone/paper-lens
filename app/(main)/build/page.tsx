'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UnifiedIcon } from '@/components/ui/unified-icon';
import { cn } from '@/lib/utils';
import { DomainHealthCard } from '@/components/build/DomainHealthCard';
import { QuickActionsBar } from '@/components/build/QuickActionsBar';
import { RecentActivityFeed } from '@/components/build/RecentActivityFeed';
import { mockDomainConfiguration } from '@/lib/data/domains';
import { useRouter } from 'next/navigation';

export default function DomainDrivenBuildPage() {
  const router = useRouter();
  const [selectedView, setSelectedView] = useState<'overview' | 'analytics'>('overview');

  const { domains, crossDomainDependencies, organizationalActivity } = mockDomainConfiguration;

  const handleEnterDomain = (domainId: string) => {
    // Navigate to domain detail page (future implementation)
    router.push(`/build/${domainId}`);
  };

  const handleCreateNew = (domainId: string) => {
    // Navigate to data product creation workflow
    router.push(`/build/${domainId}/new/requirements`);
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // Implement specific actions based on requirements
  };

  return (
    <div className="w-full px-8 lg:px-12 xl:px-16 py-6">
      <div className="space-y-6 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">Domains</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build data products organized by business domain with stakeholder alignment and cross-team collaboration
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleQuickAction('create-domain')} className="gap-2">
              <UnifiedIcon name="Plus" className="h-4 w-4" />
              New Domain
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/40">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('manage-domains')}
              className="gap-2"
            >
              <UnifiedIcon name="Settings" className="h-4 w-4" />
              Manage Domains
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('domain-analytics')}
              className="gap-2"
            >
              <UnifiedIcon name="BarChart3" className="h-4 w-4" />
              Domain Analytics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('team-assignment')}
              className="gap-2"
            >
              <UnifiedIcon name="Users" className="h-4 w-4" />
              Team Assignment
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedView(selectedView === 'overview' ? 'analytics' : 'overview')}
              className="gap-2"
            >
              <UnifiedIcon name="Filter" className="h-4 w-4" />
              {selectedView === 'overview' ? 'Show Analytics' : 'Show Overview'}
            </Button>
          </div>
        </div>

        {/* Domain Table */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Domain Overview</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Button variant="ghost" size="sm" className="h-7 px-2">All</Button>
                <Button variant="ghost" size="sm" className="h-7 px-2">Needs Attention</Button>
                <Button variant="ghost" size="sm" className="h-7 px-2">High Activity</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Domain</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Owner & Stakeholder</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Products</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Quality</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Development</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Last Activity</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((domain, index) => {
                    const getStatusIcon = () => {
                      switch (domain.health.status) {
                        case 'healthy':
                          return <UnifiedIcon name="CheckCircle" className="h-4 w-4 text-green-500" />;
                        case 'warning':
                          return <UnifiedIcon name="AlertTriangle" className="h-4 w-4 text-yellow-500" />;
                        case 'critical':
                          return <UnifiedIcon name="AlertCircle" className="h-4 w-4 text-red-500" />;
                        default:
                          return <UnifiedIcon name="Circle" className="h-4 w-4 text-muted-foreground" />;
                      }
                    };

                    const primaryStakeholder = domain.businessContext.primaryStakeholders[0];
                    const formatTimeAgo = (date: Date) => {
                      const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
                      if (days === 0) return 'Today';
                      if (days === 1) return '1 day ago';
                      if (days < 7) return `${days} days ago`;
                      if (days < 14) return '1 week ago';
                      return `${Math.floor(days / 7)} weeks ago`;
                    };

                    return (
                      <tr key={domain.id} className={cn(
                        "border-b hover:bg-muted/50 transition-colors",
                        index === domains.length - 1 && "border-b-0"
                      )}>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-muted">
                              <UnifiedIcon name={domain.icon} className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{domain.name}</div>
                              <div className="text-xs text-muted-foreground">{domain.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <div className="font-medium text-sm">{domain.ownership.team}</div>
                            <div className="text-xs text-muted-foreground">
                              {primaryStakeholder?.name} ({primaryStakeholder?.role})
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="font-medium">{domain.health.productsCount}</div>
                        </td>
                        <td className="py-4">
                          <div className={cn(
                            'font-medium',
                            domain.health.qualityScore >= 95 ? 'text-green-600 dark:text-green-400' :
                            domain.health.qualityScore >= 90 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          )}>
                            {domain.health.qualityScore}%
                            {domain.health.status === 'warning' && (
                              <UnifiedIcon name="AlertTriangle" className="h-3 w-3 ml-1 inline" />
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="font-medium">
                            {domain.health.activeDevProjects === 0 ? (
                              <span className="text-muted-foreground">None</span>
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400">
                                {domain.health.activeDevProjects} active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-sm">{formatTimeAgo(domain.health.lastActivity)}</div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEnterDomain(domain.id)}
                              className="h-8 px-2"
                            >
                              <UnifiedIcon name="ExternalLink" className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCreateNew(domain.id)}
                              className="h-8 px-2"
                            >
                              <UnifiedIcon name="Plus" className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity and Cross-Domain Intelligence */}
        <RecentActivityFeed
          organizationalActivity={organizationalActivity}
          crossDomainDependencies={crossDomainDependencies}
        />
      </div>
    </div>
  );
}