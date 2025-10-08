'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Rocket, Zap, TrendingUp, Database, GitBranch,
  Play, FileSearch, Wrench, BarChart3, Bot,
  ArrowRight, Sparkles, Target, Globe, Server,
  Clock, Users, CheckCircle, AlertCircle, Shield,
  Activity, Package, Settings, Terminal, Cloud
} from 'lucide-react';

interface RecommendedAction {
  id: string;
  action: string;
  reason: string;
  impact: string;
  confidence: number;
  estimatedTime?: string;
  type: 'optimization' | 'issue' | 'opportunity' | 'maintenance';
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  lastUsed: string;
  usageCount: number;
  category: 'pipeline' | 'quality' | 'investigation' | 'deployment';
  estimatedTime?: string;
}

interface ConnectedSystem {
  id: string;
  name: string;
  icon: any;
  status: 'healthy' | 'warning' | 'error' | 'maintenance';
  stats?: string;
  lastChecked: string;
  quickActions?: string[];
}

interface DataProfile {
  id: string;
  dataset: string;
  profiled: string;
  qualityScore: number;
  rows: string;
  columns: number;
  issues?: number;
  insights?: string[];
}

export default function QuickLaunchPage() {
  const recommendedActions: RecommendedAction[] = [
    {
      id: '1',
      action: 'Optimize slow customer_analytics pipeline',
      reason: 'Running 2.5x slower than baseline for 3 consecutive runs',
      impact: 'Save 45 min daily, reduce compute costs by $1,200/month',
      confidence: 92,
      estimatedTime: '15 min',
      type: 'optimization'
    },
    {
      id: '2',
      action: 'Review and merge 3 data quality rule PRs',
      reason: 'Team members waiting for your expertise on Splink configs',
      impact: 'Unblock 2 analysts, improve match rate by 15%',
      confidence: 88,
      estimatedTime: '30 min',
      type: 'opportunity'
    },
    {
      id: '3',
      action: 'Investigate Kafka lag on order_events topic',
      reason: 'Consumer lag increasing, approaching SLA threshold',
      impact: 'Prevent downstream delays in real-time dashboards',
      confidence: 95,
      estimatedTime: '20 min',
      type: 'issue'
    },
    {
      id: '4',
      action: 'Apply recommended Trino cluster configuration',
      reason: 'New auto-tuning suggestions based on last week\'s workload',
      impact: '30% query performance improvement expected',
      confidence: 85,
      estimatedTime: '10 min',
      type: 'optimization'
    }
  ];

  const frequentWorkflows: Workflow[] = [
    {
      id: 'w1',
      name: 'Debug Failed Pipeline',
      description: 'Investigate → Fix → Test → Deploy',
      lastUsed: '2 hours ago',
      usageCount: 47,
      category: 'investigation',
      estimatedTime: '30-45 min'
    },
    {
      id: 'w2',
      name: 'Create Data Product',
      description: 'Define → Build → Test → Document → Deploy',
      lastUsed: 'Yesterday',
      usageCount: 23,
      category: 'pipeline',
      estimatedTime: '2-3 hours'
    },
    {
      id: 'w3',
      name: 'Quality Rule Setup',
      description: 'Profile → Define Rules → Test → Monitor',
      lastUsed: '3 days ago',
      usageCount: 31,
      category: 'quality',
      estimatedTime: '1 hour'
    },
    {
      id: 'w4',
      name: 'Performance Optimization',
      description: 'Analyze → Optimize → Test → Deploy',
      lastUsed: 'Last week',
      usageCount: 19,
      category: 'optimization',
      estimatedTime: '45-60 min'
    }
  ];

  const connectedSystems: ConnectedSystem[] = [
    {
      id: 's1',
      name: 'Airflow',
      icon: Cloud,
      status: 'healthy',
      stats: '127 DAGs, 98.5% success',
      lastChecked: '1 min ago',
      quickActions: ['View DAGs', 'Recent Failures', 'Deploy']
    },
    {
      id: 's2',
      name: 'Kafka',
      icon: Activity,
      status: 'warning',
      stats: '1.2M msgs/sec, 3 topics lagging',
      lastChecked: '30 sec ago',
      quickActions: ['Topic Monitor', 'Consumer Groups', 'Add Topic']
    },
    {
      id: 's3',
      name: 'Trino',
      icon: Database,
      status: 'healthy',
      stats: '342 queries/hr, 1.2s avg',
      lastChecked: '2 min ago',
      quickActions: ['Query Editor', 'Running Queries', 'Clusters']
    },
    {
      id: 's4',
      name: 'DataHub',
      icon: Globe,
      status: 'healthy',
      stats: '15K entities, 89% documented',
      lastChecked: '5 min ago',
      quickActions: ['Browse', 'Lineage', 'Search']
    },
    {
      id: 's5',
      name: 'MLflow',
      icon: GitBranch,
      status: 'healthy',
      stats: '42 models, 12 in production',
      lastChecked: '10 min ago',
      quickActions: ['Models', 'Experiments', 'Deploy']
    },
    {
      id: 's6',
      name: 'Ranger',
      icon: Shield,
      status: 'maintenance',
      stats: 'Policy sync scheduled',
      lastChecked: '15 min ago',
      quickActions: ['Policies', 'Audit', 'Users']
    }
  ];

  const recentProfiles: DataProfile[] = [
    {
      id: 'p1',
      dataset: 'customer_transactions_v2',
      profiled: '1 hour ago',
      qualityScore: 94,
      rows: '12.3M',
      columns: 42,
      issues: 2,
      insights: [
        '3% increase in null payment_method',
        'New categorical value detected in region field'
      ]
    },
    {
      id: 'p2',
      dataset: 'product_catalog_staging',
      profiled: '3 hours ago',
      qualityScore: 78,
      rows: '845K',
      columns: 38,
      issues: 5,
      insights: [
        '12% duplicate SKUs detected',
        'Price outliers in electronics category'
      ]
    },
    {
      id: 'p3',
      dataset: 'marketing_attribution',
      profiled: 'Yesterday',
      qualityScore: 91,
      rows: '5.7M',
      columns: 27,
      issues: 1,
      insights: [
        'Campaign IDs now properly formatted',
        'Attribution window consistent at 30 days'
      ]
    }
  ];

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'issue': return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getWorkflowIcon = (category: string) => {
    switch (category) {
      case 'pipeline': return <GitBranch className="h-4 w-4" />;
      case 'quality': return <Shield className="h-4 w-4" />;
      case 'investigation': return <FileSearch className="h-4 w-4" />;
      case 'deployment': return <Rocket className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'maintenance': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">Quick Launch</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your personalized command center with AI-powered recommendations
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              4 recommended actions
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="h-3 w-3 mr-1" />
              ~75 min to clear
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Recommended Actions */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Recommended Next Actions
              </CardTitle>
              <CardDescription>
                Personalized based on your patterns and current system state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {recommendedActions.map((action) => (
                    <div
                      key={action.id}
                      className="border rounded-lg p-3 space-y-2 bg-muted/30 dark:bg-card hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          {getActionIcon(action.type)}
                          <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium">{action.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {action.reason}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {action.confidence}% confidence
                              </Badge>
                              {action.estimatedTime && (
                                <span className="text-xs text-muted-foreground">
                                  ~{action.estimatedTime}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-primary/5 dark:bg-primary/10 rounded p-2">
                        <p className="text-xs text-primary">
                          Impact: {action.impact}
                        </p>
                      </div>
                      <Button size="sm" className="w-full">
                        <Play className="h-3 w-3 mr-1" />
                        Start Now
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Frequent Workflows */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Your Most Used Workflows
              </CardTitle>
              <CardDescription>
                Quick access to your frequently used multi-step processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {frequentWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="border rounded-lg p-3 bg-muted/30 dark:bg-card hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getWorkflowIcon(workflow.category)}
                        <span className="font-medium text-sm">{workflow.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Used {workflow.usageCount}x
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {workflow.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Last: {workflow.lastUsed}</span>
                        {workflow.estimatedTime && (
                          <span>~{workflow.estimatedTime}</span>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        Launch
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-3" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage Workflows
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Connected Systems */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Quick Access Tools
            </CardTitle>
            <CardDescription>
              Direct links to your connected systems with current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {connectedSystems.map((system) => {
                const Icon = system.icon;
                return (
                  <div
                    key={system.id}
                    className="border rounded-lg p-3 bg-muted/30 dark:bg-card hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">{system.name}</span>
                      <Badge
                        variant={system.status === 'healthy' ? 'secondary' : 'destructive'}
                        className={cn('text-xs', getStatusColor(system.status))}
                      >
                        {system.status}
                      </Badge>
                      {system.stats && (
                        <p className="text-xs text-center text-muted-foreground">
                          {system.stats}
                        </p>
                      )}
                      <div className="w-full space-y-1 pt-2">
                        {system.quickActions?.slice(0, 2).map((action) => (
                          <Button
                            key={action}
                            size="sm"
                            variant="ghost"
                            className="w-full h-7 text-xs"
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Data Profiles */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              Recent Data Profiles
            </CardTitle>
            <CardDescription>
              Latest ydata-profiling results with quality insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="border rounded-lg p-3 bg-muted/30 dark:bg-card hover:bg-accent/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{profile.dataset}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{profile.rows} rows</span>
                        <span>{profile.columns} columns</span>
                        <span>Profiled {profile.profiled}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Quality Score</span>
                        <Badge
                          variant={profile.qualityScore >= 90 ? 'secondary' : profile.qualityScore >= 70 ? 'outline' : 'destructive'}
                        >
                          {profile.qualityScore}%
                        </Badge>
                      </div>
                      {profile.issues && profile.issues > 0 && (
                        <Badge variant="outline" className="mt-1">
                          {profile.issues} issues
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={profile.qualityScore} className="h-2 mb-2" />
                  {profile.insights && profile.insights.length > 0 && (
                    <div className="bg-primary/5 dark:bg-primary/10 rounded p-2 space-y-1">
                      {profile.insights.map((insight, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-primary mt-0.5" />
                          {insight}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline">
                      <FileSearch className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                    <Button size="sm" variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      Add Quality Rules
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}