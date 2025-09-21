'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  AlertCircle, Clock, Users, CheckCircle, MessageSquare,
  FileText, TrendingUp, Wrench, BarChart3, Bot,
  ArrowRight, Sparkles, Target, Database, GitBranch,
  Play, Calendar, User, Hash, Star, Rocket,
  AlertTriangle, Timer, Ban, ChevronRight,
  UserX, Activity, Shield, RefreshCw, Info,
  Lightbulb, Zap, FileWarning, Send, CalendarClock,
  Pause, FileSearch, BookOpen
} from 'lucide-react';

// Interfaces for the new priority-based structure
interface BlockingTask {
  id: string;
  title: string;
  requester: string;
  role: string;
  blockedFor: string;
  dueDate: string;
  impact: string;
  stakeholdersWaiting?: number;
  quickContext?: string;
  estimatedTime: string;
  status?: 'blocked' | 'waiting';
}

interface SystemIssue {
  id: string;
  system: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium';
  performance?: string;
  impact: string;
  detectedTime: string;
  affectedUsers?: number;
  aiRecommendation?: {
    action: string;
    confidence: number;
    estimatedTime: string;
    successRate?: number;
  };
}

interface ScheduledWork {
  id: string;
  title: string;
  dueDate: string;
  type: 'review' | 'deployment' | 'analysis' | 'documentation';
  progress?: number;
  nextAction?: string;
  tip?: string;
}

interface OptimizationOpportunity {
  id: string;
  title: string;
  potentialImpact: string;
  confidence: number;
  effort: string;
  category: 'performance' | 'cost' | 'quality' | 'maintenance';
}

export default function WorkQueuePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('urgent');

  // People waiting for you - HIGHEST PRIORITY
  const blockingTasks: BlockingTask[] = [
    {
      id: '1',
      title: 'Review failed customer data quality rules',
      requester: 'Sarah',
      role: 'Data Analyst',
      blockedFor: '2 hours',
      dueDate: 'TODAY',
      impact: 'Dashboard creation halted, 3 stakeholders waiting',
      stakeholdersWaiting: 3,
      quickContext: 'Entity resolution config issue - similar reviews take 15 min avg',
      estimatedTime: '15 min',
      status: 'blocked'
    },
    {
      id: '2',
      title: 'Deploy customer segmentation model v2',
      requester: 'Marketing Team',
      role: 'Business Stakeholder',
      blockedFor: '3 days',
      dueDate: 'This week',
      impact: 'Campaign launch depends on this',
      quickContext: 'Blue-green deployment pattern available - zero downtime, 1 hour avg',
      estimatedTime: '1 hour',
      status: 'waiting'
    },
    {
      id: '3',
      title: 'Technical review for new segmentation rules',
      requester: 'Mike',
      role: 'Junior Data Engineer',
      blockedFor: '5 hours',
      dueDate: 'TODAY',
      impact: 'New team member blocked on first project',
      quickContext: 'ydata-profiling shows 12% null emails in new source',
      estimatedTime: '20 min',
      status: 'blocked'
    }
  ];

  // System issues requiring fix - HIGH PRIORITY
  const systemIssues: SystemIssue[] = [
    {
      id: 's1',
      system: 'Product Analytics Pipeline',
      issue: 'Performance degradation detected',
      severity: 'high',
      performance: '2.3x slower than baseline',
      impact: '3 dashboards loading slowly, user complaints',
      detectedTime: '4 hours ago',
      affectedUsers: 47,
      aiRecommendation: {
        action: 'Add partitioning on date field - improved performance by 65% in similar cases',
        confidence: 88,
        estimatedTime: '30 min',
        successRate: 72
      }
    },
    {
      id: 's2',
      system: 'Kafka Consumer Group',
      issue: 'Lag spike detected',
      severity: 'critical',
      performance: '15 min lag on order_events topic',
      impact: 'Customer order processing delayed',
      detectedTime: '32 minutes ago',
      affectedUsers: 156,
      aiRecommendation: {
        action: 'Restart consumer group with increased partition allocation',
        confidence: 92,
        estimatedTime: '3 min',
        successRate: 88
      }
    }
  ];

  // Committed deliverables - MEDIUM PRIORITY
  const scheduledWork: ScheduledWork[] = [
    {
      id: 'w1',
      title: 'Quarterly Data Quality Review',
      dueDate: 'End of week',
      type: 'review',
      progress: 60,
      nextAction: 'Review entity resolution rules with business team',
      tip: 'Use standard review template (saves 20 min)'
    },
    {
      id: 'w2',
      title: 'Monthly Infrastructure Cost Review',
      dueDate: 'Next Monday',
      type: 'analysis',
      progress: 25,
      nextAction: 'Analyze Trino cluster utilization patterns',
      tip: 'Check for unused resources from last sprint'
    },
    {
      id: 'w3',
      title: 'Pipeline Documentation Update',
      dueDate: 'Next Friday',
      type: 'documentation',
      progress: 10,
      nextAction: 'Document new customer segmentation logic',
      tip: 'Auto-generate from code comments'
    }
  ];

  // Optional optimizations - LOW PRIORITY
  const optimizations: OptimizationOpportunity[] = [
    {
      id: 'o1',
      title: 'Customer lookup query optimization',
      potentialImpact: '40% faster query times',
      confidence: 85,
      effort: '20 minutes',
      category: 'performance'
    },
    {
      id: 'o2',
      title: 'Unused indexes cleanup',
      potentialImpact: '15% storage reduction',
      confidence: 92,
      effort: '10 minutes',
      category: 'cost'
    },
    {
      id: 'o3',
      title: 'Enable query result caching',
      potentialImpact: 'Reduce compute by 30%',
      confidence: 78,
      effort: '15 minutes',
      category: 'performance'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      case 'high': return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      default: return 'border-border';
    }
  };

  const getWorkTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <FileWarning className="h-4 w-4" />;
      case 'deployment': return <Rocket className="h-4 w-4" />;
      case 'analysis': return <BarChart3 className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap className="h-3 w-3" />;
      case 'cost': return <TrendingUp className="h-3 w-3" />;
      case 'quality': return <Shield className="h-3 w-3" />;
      case 'maintenance': return <Wrench className="h-3 w-3" />;
      default: return <Lightbulb className="h-3 w-3" />;
    }
  };

  const totalUrgentTasks = blockingTasks.length;
  const totalSystemIssues = systemIssues.filter(i => i.severity === 'critical' || i.severity === 'high').length;
  const totalTimeToClean = blockingTasks.reduce((acc, task) => {
    const time = parseInt(task.estimatedTime) || 0;
    return acc + time;
  }, 0) + systemIssues.reduce((acc, issue) => {
    const time = parseInt(issue.aiRecommendation?.estimatedTime || '0') || 0;
    return acc + time;
  }, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header with key metrics */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">My Work Queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prioritized by who's waiting and business impact
            </p>
          </div>
          <div className="flex gap-3">
            <Badge variant="destructive" className="px-3 py-1 flex items-center gap-1">
              <UserX className="h-3 w-3" />
              {totalUrgentTasks} people blocked
            </Badge>
            <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {totalSystemIssues} system issues
            </Badge>
            <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{totalTimeToClean} min to clean
            </Badge>
          </div>
        </div>

        {/* Section 1: URGENT - People Waiting */}
        {blockingTasks.length > 0 && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  URGENT - People Waiting for You
                </span>
                <Badge variant="destructive">{blockingTasks.length} blocked</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {blockingTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "border rounded-lg p-4 bg-white dark:bg-card",
                    task.status === 'blocked' ? 'border-red-300 dark:border-red-700' : 'border-amber-300 dark:border-amber-700'
                  )}
                >
                  <div className="space-y-3">
                    {/* Task header with requester info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={task.status === 'blocked' ? 'destructive' : 'secondary'} className="text-xs">
                            {task.status === 'blocked' ? 'BLOCKED' : 'WAITING'}
                          </Badge>
                          <span className="text-sm font-medium">{task.requester} ({task.role})</span>
                          <span className="text-xs text-muted-foreground">
                            - Blocked for {task.blockedFor}
                          </span>
                        </div>
                        <h3 className="font-medium text-base">{task.title}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Due: {task.dueDate}
                          </span>
                          {task.stakeholdersWaiting && (
                            <span className="text-sm text-muted-foreground">
                              {task.stakeholdersWaiting} stakeholders waiting
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-destructive-foreground mt-1">
                          Impact: {task.impact}
                        </p>
                      </div>
                    </div>

                    {/* Quick context helper */}
                    {task.quickContext && (
                      <div className="bg-muted/50 rounded p-2 border border-border/50">
                        <p className="text-xs flex items-start gap-1">
                          <Lightbulb className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <span>Quick context: {task.quickContext}</span>
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="bg-red-600 hover:bg-red-700">
                        <Rocket className="h-4 w-4 mr-1" />
                        Start Review
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message {task.requester}
                      </Button>
                      <Button size="sm" variant="outline">
                        <CalendarClock className="h-4 w-4 mr-1" />
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Section 2: System Issues */}
        {systemIssues.length > 0 && (
          <Card className={cn(
            systemIssues.some(i => i.severity === 'critical')
              ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'
              : 'border-border'
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  SYSTEM ISSUES - Fix Required
                </span>
                <Badge variant="outline" className="border-amber-600 text-amber-600">
                  {systemIssues.length} issues
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {systemIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={cn(
                    "border rounded-lg p-4",
                    getSeverityColor(issue.severity)
                  )}
                >
                  <div className="space-y-3">
                    {/* Issue header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{issue.system}</span>
                        </div>
                        <h3 className="font-medium text-base">{issue.issue}</h3>
                        {issue.performance && (
                          <p className="text-sm text-destructive mt-1">
                            Performance: {issue.performance}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Impact: {issue.impact}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Detected: {issue.detectedTime}</span>
                          {issue.affectedUsers && (
                            <span>{issue.affectedUsers} users affected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    {issue.aiRecommendation && (
                      <div className="bg-primary/5 dark:bg-primary/10 rounded p-3 border border-primary/20">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">AI Recommendation</span>
                            <Badge variant="outline" className="text-xs">
                              {issue.aiRecommendation.confidence}% confidence
                            </Badge>
                          </div>
                          {issue.aiRecommendation.successRate && (
                            <Badge variant="outline" className="text-xs">
                              {issue.aiRecommendation.successRate}% success rate
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{issue.aiRecommendation.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Est. {issue.aiRecommendation.estimatedTime} to resolve
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="default">
                        <Wrench className="h-4 w-4 mr-1" />
                        Apply Fix
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Investigate Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4 mr-1" />
                        Defer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Section 3: Scheduled Work */}
        {scheduledWork.length > 0 && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  SCHEDULED WORK - Committed Deliverables
                </span>
                <Badge variant="outline" className="border-blue-600 text-blue-600">
                  {scheduledWork.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheduledWork.map((work) => (
                <div
                  key={work.id}
                  className="border rounded-lg p-4 bg-white dark:bg-card"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getWorkTypeIcon(work.type)}
                          <span className="font-medium">{work.title}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Due: {work.dueDate}</span>
                          <span className="capitalize">{work.type}</span>
                        </div>
                        {work.progress !== undefined && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{work.progress}% complete</span>
                            </div>
                            <Progress value={work.progress} className="h-2" />
                          </div>
                        )}
                        {work.nextAction && (
                          <p className="text-sm mt-2">
                            Next: {work.nextAction}
                          </p>
                        )}
                        {work.tip && (
                          <div className="bg-muted/50 rounded p-2 mt-2 border border-border/50">
                            <p className="text-xs flex items-start gap-1">
                              <Lightbulb className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5" />
                              <span>{work.tip}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default">
                        <FileSearch className="h-4 w-4 mr-1" />
                        Continue Work
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-4 w-4 mr-1" />
                        View Schedule
                      </Button>
                      <Button size="sm" variant="outline">
                        <Users className="h-4 w-4 mr-1" />
                        Invite Team
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Section 4: Optimization Opportunities */}
        <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                OPTIMIZATION OPPORTUNITIES - When You Have Time
              </span>
              <Badge variant="outline">{optimizations.length} suggestions</Badge>
            </CardTitle>
            <CardDescription>
              AI suggestions based on system analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {optimizations.map((opt) => (
                <div
                  key={opt.id}
                  className="border rounded-lg p-3 bg-white dark:bg-card hover:bg-accent/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(opt.category)}
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{opt.title}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-muted-foreground">
                          Potential impact: {opt.potentialImpact}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {opt.confidence}% confidence
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Effort: {opt.effort}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Learn More
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Clock className="h-3 w-3 mr-1" />
                        Schedule Later
                      </Button>
                    </div>
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