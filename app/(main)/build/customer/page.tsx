'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UnifiedIcon } from '@/components/ui/unified-icon';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

// Mock data based on PRD Customer Domain specifications
const customerDomainData = {
  businessContext: {
    primaryStakeholders: [
      { name: 'Jennifer', role: 'VP Marketing', email: 'jennifer@company.com' },
      { name: 'Tom', role: 'Director Customer Success', email: 'tom@company.com' }
    ],
    keyBusinessMetrics: [
      { name: 'Customer LTV', value: '$2,340', trend: 'up' },
      { name: 'Churn Rate', value: '3.2%', trend: 'down' },
      { name: 'Acquisition Cost', value: '$124', trend: 'neutral' }
    ],
    currentInitiatives: [
      { name: 'Q4 Retention Campaign', status: 'in_progress', description: 'Reduce churn through personalized retention' },
      { name: 'Customer 360 Enhancement', status: 'planning', description: 'Add behavioral insights to customer profiles' }
    ],
    complianceRequirements: ['GDPR', 'CCPA data handling for customer data']
  },
  technicalHealth: {
    activeDataProducts: 12,
    averageQualityScore: 94,
    schemaChanges: 2,
    dailyProcessing: '145 GB',
    downstreamConsumers: 23,
    slaViolations: 1
  },
  activeDevelopment: [
    {
      id: '1',
      name: 'Customer Churn Prediction',
      owner: 'Sarah',
      progress: 60,
      status: 'blocked',
      description: 'Blocked: Waiting for support_tickets schema clarification'
    },
    {
      id: '2',
      name: 'Customer Journey Mapping',
      owner: 'Alex',
      progress: 30,
      status: 'in_progress',
      description: 'In Progress: Feature engineering phase'
    }
  ],
  dataProducts: [
    {
      id: '1',
      name: 'Customer 360 Profile',
      usage: 'high',
      qualityScore: 99,
      freshness: 'real-time',
      status: 'active',
      icon: '✅'
    },
    {
      id: '2',
      name: 'Customer Segmentation',
      usage: 'medium',
      qualityScore: 97,
      freshness: 'daily',
      status: 'active',
      icon: '✅'
    },
    {
      id: '3',
      name: 'Customer Support Metrics',
      usage: 'low',
      qualityScore: 89,
      freshness: 'hourly',
      status: 'warning',
      icon: '⚠️'
    },
    {
      id: '4',
      name: 'Customer Acquisition Cost',
      usage: 'high',
      qualityScore: 96,
      freshness: 'daily',
      status: 'active',
      icon: '✅'
    }
  ],
  domainIntelligence: [
    'Recommended: Integrate new session_duration field from recent schema change',
    'Pattern Opportunity: Support metrics pattern could apply to churn analysis',
    'Cross-Domain: Financial domain requesting customer attribution data'
  ]
};

export default function CustomerDomainPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'products' | 'development'>('overview');

  const getUsageBadge = (usage: string) => {
    switch (usage) {
      case 'high':
        return <Badge variant="default" className="text-xs">High Usage</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Med Usage</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low Usage</Badge>;
      default:
        return null;
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 95) return 'text-green-600 dark:text-green-400';
    if (score >= 90) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'blocked':
        return <UnifiedIcon name="AlertCircle" className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <UnifiedIcon name="Clock" className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <UnifiedIcon name="CheckCircle" className="h-4 w-4 text-green-500" />;
      default:
        return <UnifiedIcon name="Activity" className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="w-full px-8 lg:px-12 xl:px-16 py-6">
      <div className="space-y-6 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <UnifiedIcon name="ArrowLeft" className="h-4 w-4" />
              Back to Domains
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                <UnifiedIcon name="Users" className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-light tracking-tight">Customer Domain</h1>
                <p className="text-sm text-muted-foreground">
                  Business Context + Technical Status
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/build/customer/new/requirements')}
              className="gap-2"
            >
              <UnifiedIcon name="Plus" className="h-4 w-4" />
              New Data Product
            </Button>
            <Button variant="outline" className="gap-2">
              <UnifiedIcon name="Cable" className="h-4 w-4" />
              Connect Customer Source
            </Button>
            <Button variant="outline" className="gap-2">
              <UnifiedIcon name="Package" className="h-4 w-4" />
              Browse Customer Patterns
            </Button>
          </div>
        </div>

        {/* Business Context Section */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UnifiedIcon name="Users" className="h-5 w-5" />
              Business Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Primary Stakeholders */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Primary Stakeholders
                </h4>
                {customerDomainData.businessContext.primaryStakeholders.map((stakeholder, index) => (
                  <div key={index} className="space-y-1">
                    <div className="font-medium text-sm">{stakeholder.name}</div>
                    <div className="text-xs text-muted-foreground">{stakeholder.role}</div>
                  </div>
                ))}
              </div>

              {/* Key Business Metrics */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Key Business Metrics
                </h4>
                {customerDomainData.businessContext.keyBusinessMetrics.map((metric, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{metric.value}</span>
                      <UnifiedIcon
                        name={metric.trend === 'up' ? 'TrendingUp' : metric.trend === 'down' ? 'TrendingDown' : 'Minus'}
                        className={cn(
                          'h-3 w-3',
                          metric.trend === 'up' ? 'text-green-500' :
                          metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">{metric.name}</div>
                  </div>
                ))}
              </div>

              {/* Current Initiatives */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Current Initiatives
                </h4>
                {customerDomainData.businessContext.currentInitiatives.map((initiative, index) => (
                  <div key={index} className="space-y-1">
                    <div className="font-medium text-sm">{initiative.name}</div>
                    <div className="text-xs text-muted-foreground">{initiative.description}</div>
                    <Badge
                      variant={initiative.status === 'in_progress' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {initiative.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Compliance Requirements */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Compliance Requirements
                </h4>
                <div className="space-y-2">
                  {customerDomainData.businessContext.complianceRequirements.map((req, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Health Section */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UnifiedIcon name="Activity" className="h-5 w-5" />
              Technical Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {customerDomainData.technicalHealth.activeDataProducts}
                </div>
                <div className="text-xs text-muted-foreground">Active Data Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {customerDomainData.technicalHealth.averageQualityScore}%
                </div>
                <div className="text-xs text-muted-foreground">Average Quality Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {customerDomainData.technicalHealth.schemaChanges}
                </div>
                <div className="text-xs text-muted-foreground">Schema Changes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {customerDomainData.technicalHealth.dailyProcessing}
                </div>
                <div className="text-xs text-muted-foreground">Daily Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {customerDomainData.technicalHealth.downstreamConsumers}
                </div>
                <div className="text-xs text-muted-foreground">Downstream Consumers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {customerDomainData.technicalHealth.slaViolations}
                </div>
                <div className="text-xs text-muted-foreground">SLA Violations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Development Section */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UnifiedIcon name="Code" className="h-5 w-5" />
              Active Development
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customerDomainData.activeDevelopment.map((project) => (
              <div key={project.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(project.status)}
                    <div>
                      <h4 className="font-medium">{project.name} - {project.owner}</h4>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{project.progress}% complete</div>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data Products in Domain Section */}
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UnifiedIcon name="Database" className="h-5 w-5" />
                Data Products in Domain
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View All 12 Products</Button>
                <Button variant="outline" size="sm">Quality Deep Dive</Button>
                <Button variant="outline" size="sm">Usage Analytics</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {customerDomainData.dataProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-lg">{product.icon}</span>
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      {getUsageBadge(product.usage)}
                      <span className={cn('text-sm font-medium', getQualityColor(product.qualityScore))}>
                        🟢 {product.qualityScore}% Quality
                      </span>
                      <span className="text-sm text-muted-foreground">
                        🕐 {product.freshness}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <UnifiedIcon name="ExternalLink" className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Domain Intelligence Section */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UnifiedIcon name="Brain" className="h-5 w-5" />
              Domain Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customerDomainData.domainIntelligence.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <UnifiedIcon name="Sparkles" className="h-4 w-4 mt-0.5 text-blue-500" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}