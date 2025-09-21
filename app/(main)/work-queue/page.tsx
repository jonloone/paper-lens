'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle, Clock, Users, CheckCircle, MessageSquare,
  FileText, TrendingUp, Wrench, BarChart3, Bot,
  ArrowRight, Sparkles, Target, Database, GitBranch,
  Play, Calendar, User, Hash, Star
} from 'lucide-react';

interface WorkItem {
  id: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'quality' | 'performance' | 'collaboration' | 'development';
  businessImpact: string;
  requester?: string;
  dueDate?: string;
  aiSuggestion?: string;
  estimatedTime?: string;
  similarSuccessRate?: string;
  status: 'new' | 'in-progress' | 'blocked';
}

interface CollaborationRequest {
  id: string;
  requester: string;
  role: string;
  request: string;
  context: string;
  dataQuality?: string;
  suggestedPattern?: string;
  actions: string[];
}

interface CompletedWork {
  id: string;
  title: string;
  completedAt: string;
  impact?: string;
}

export default function WorkQueuePage() {
  const priorityTasks: WorkItem[] = [
    {
      id: '1',
      title: 'Review failed customer data quality rules',
      priority: 'critical',
      type: 'quality',
      businessImpact: 'High - Analyst blocked on dashboard creation',
      requester: 'Sarah (Data Analyst)',
      dueDate: 'Today',
      aiSuggestion: 'Check entity resolution config - similar issues resolved by adjusting Splink thresholds',
      estimatedTime: '15 min',
      similarSuccessRate: '92%',
      status: 'new'
    },
    {
      id: '2',
      title: 'Optimize slow-running product analytics pipeline',
      priority: 'high',
      type: 'performance',
      businessImpact: '2.3x slower than baseline - Affecting 3 dashboards',
      aiSuggestion: 'Add partitioning on date field - similar optimization improved performance by 65%',
      estimatedTime: '30 min',
      similarSuccessRate: '88%',
      status: 'new'
    },
    {
      id: '3',
      title: 'Deploy customer segmentation model v2',
      priority: 'medium',
      type: 'development',
      businessImpact: 'Marketing campaign optimization',
      requester: 'Marketing Team',
      dueDate: 'This week',
      aiSuggestion: 'Use blue-green deployment pattern for zero downtime',
      estimatedTime: '1 hour',
      status: 'in-progress'
    }
  ];

  const collaborationRequests: CollaborationRequest[] = [
    {
      id: 'c1',
      requester: 'Sarah',
      role: 'Data Analyst',
      request: 'Technical review needed for new customer segmentation rules',
      context: 'ydata-profiling shows 12% null emails in new source',
      dataQuality: '88% overall, but email field needs attention',
      suggestedPattern: 'Adapt "Customer Health Score" template',
      actions: ['Review Request', 'View Profiling Results', 'Suggest Fix']
    },
    {
      id: 'c2',
      requester: 'Marketing Team',
      role: 'Business Stakeholder',
      request: 'New data product for customer engagement scoring',
      context: 'Need to optimize campaign targeting based on engagement patterns',
      suggestedPattern: 'Similar to existing "Customer Health Score" - can be adapted',
      actions: ['Explore Pattern', 'Start Data Product', 'Schedule Meeting']
    }
  ];

  const recentlyCompleted: CompletedWork[] = [
    {
      id: 'r1',
      title: 'Fixed Salesforce API rate limiting',
      completedAt: 'Yesterday',
      impact: 'Restored real-time sync for 50K records/hour'
    },
    {
      id: 'r2',
      title: 'Deployed customer 360 pipeline v2.1',
      completedAt: '2 days ago',
      impact: '35% performance improvement, 99.9% accuracy'
    },
    {
      id: 'r3',
      title: 'Collaborated on purchase prediction model',
      completedAt: 'Last week',
      impact: 'Model accuracy improved from 72% to 85%'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟡';
      case 'medium': return '🟢';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quality': return <Database className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'collaboration': return <Users className="h-4 w-4" />;
      case 'development': return <GitBranch className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">My Work Queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-prioritized tasks combining infrastructure work with business requests
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="h-3 w-3 mr-1" />
              3 urgent items
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Users className="h-3 w-3 mr-1" />
              2 collaborations
            </Badge>
          </div>
        </div>

        {/* High Priority Tasks */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              High Priority (AI Recommended)
            </CardTitle>
            <CardDescription>
              Tasks prioritized by business impact and urgency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityTasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/30 dark:bg-card hover:bg-accent/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={getPriorityColor(task.priority)}>
                        {getPriorityIcon(task.priority)}
                      </span>
                      <span className="font-medium">{task.title}</span>
                      {getTypeIcon(task.type)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Business impact: {task.businessImpact}
                    </div>
                    {task.requester && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.requester}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {task.dueDate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {task.status === 'in-progress' && (
                    <Badge variant="secondary">In Progress</Badge>
                  )}
                </div>

                {task.aiSuggestion && (
                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-md p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Bot className="h-4 w-4 text-primary" />
                      <span>AI Suggested Approach</span>
                      {task.similarSuccessRate && (
                        <Badge variant="outline" className="ml-auto">
                          {task.similarSuccessRate} success rate
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.aiSuggestion}
                    </p>
                    {task.estimatedTime && (
                      <p className="text-xs text-muted-foreground">
                        Similar issues resolved in {task.estimatedTime} avg
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {task.type === 'quality' && (
                    <>
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Start Review
                      </Button>
                      <Button size="sm" variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Collaborate with {task.requester?.split(' ')[0]}
                      </Button>
                    </>
                  )}
                  {task.type === 'performance' && (
                    <>
                      <Button size="sm">
                        <Wrench className="h-4 w-4 mr-2" />
                        Apply Optimization
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Performance Details
                      </Button>
                    </>
                  )}
                  {task.type === 'development' && (
                    <>
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Continue Deployment
                      </Button>
                      <Button size="sm" variant="outline">
                        <GitBranch className="h-4 w-4 mr-2" />
                        View Changes
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Collaboration Requests */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Collaboration Requests
            </CardTitle>
            <CardDescription>
              Cross-functional team requests needing your expertise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {collaborationRequests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/30 dark:bg-card hover:bg-accent/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {request.requester} ({request.role})
                      </Badge>
                      <span className="text-sm font-medium">needs technical review</span>
                    </div>
                    <p className="text-sm font-medium">{request.request}</p>
                    <p className="text-sm text-muted-foreground">{request.context}</p>

                    {request.dataQuality && (
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-3 w-3" />
                        <span className="text-muted-foreground">Data Quality:</span>
                        <Badge variant="outline">{request.dataQuality}</Badge>
                      </div>
                    )}
                  </div>
                </div>

                {request.suggestedPattern && (
                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-md p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="font-medium">Similar pattern exists:</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {request.suggestedPattern}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="default">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {request.actions[0]}
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {request.actions[1]}
                  </Button>
                  {request.actions[2] && (
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      {request.actions[2]}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recently Completed */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              Recently Completed
            </CardTitle>
            <CardDescription>
              Track your recent accomplishments and impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {recentlyCompleted.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 rounded-lg border bg-muted/20 dark:bg-muted/10"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.completedAt}</p>
                      {item.impact && (
                        <p className="text-xs text-primary">{item.impact}</p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost">
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}