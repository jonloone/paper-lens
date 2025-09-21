'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  AlertCircle, Clock, Users, CheckCircle, MessageSquare,
  FileText, TrendingUp, Wrench, BarChart3, Bot,
  ArrowRight, Sparkles, Target, Database, GitBranch,
  Play, Calendar, User, Hash, Star, Rocket,
  AlertTriangle, Timer, Ban, ChevronRight,
  UserX, Activity, Shield, RefreshCw, Info,
  Lightbulb, Zap, FileWarning, Send, CalendarClock,
  Pause, FileSearch, BookOpen, MoreHorizontal,
  Check, Loader2, TestTube, Clipboard, Eye,
  BookOpenCheck, XCircle, ArrowUpDown
} from 'lucide-react';

// Enhanced interfaces for smart tasks
interface Task {
  id: string;
  type: 'review' | 'deployment' | 'system_issue' | 'analysis' | 'documentation' | 'suggestion';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  requester: string;
  role?: string;
  impact: string;
  dueDate: string;
  estimatedMinutes: number;
  blocking: boolean;
  blockedFor?: string;
  status: 'pending' | 'in_progress' | 'completed';
  stakeholdersWaiting?: number;
  performance?: string;
  affectedUsers?: number;
  confidence?: number;
  successRate?: number;
  progress?: number;
  nextAction?: string;
  aiRecommendation?: {
    action: string;
    confidence: number;
    estimatedTime: string;
    successRate?: number;
  };
  quickContext?: string;
  dueThisWeek?: boolean;
}

// Mock data with all task types
const MOCK_TASKS: Task[] = [
  {
    id: '1',
    type: 'review',
    priority: 'urgent',
    title: 'Review failed customer data quality rules',
    description: 'Entity resolution config causing validation failures',
    requester: 'Sarah',
    role: 'Data Analyst',
    impact: 'Dashboard creation halted, 3 stakeholders waiting',
    dueDate: 'TODAY',
    estimatedMinutes: 15,
    blocking: true,
    blockedFor: '2 hours',
    status: 'pending',
    stakeholdersWaiting: 3,
    quickContext: 'ydata-profiling shows 12% null emails in new source',
    dueThisWeek: true
  },
  {
    id: '2',
    type: 'deployment',
    priority: 'high',
    title: 'Deploy customer segmentation model v2',
    description: 'Marketing campaign depends on new model',
    requester: 'Marketing Team',
    role: 'Business Stakeholder',
    impact: 'Campaign launch blocked until deployment',
    dueDate: 'Tomorrow',
    estimatedMinutes: 60,
    blocking: true,
    blockedFor: '3 days',
    status: 'pending',
    quickContext: 'Blue-green deployment pattern available - zero downtime',
    dueThisWeek: true
  },
  {
    id: '3',
    type: 'system_issue',
    priority: 'high',
    title: 'Optimize slow-running product analytics pipeline',
    description: 'Performance degraded 2.3x from baseline',
    requester: 'System Monitor',
    impact: '3 dashboards loading slowly, user complaints',
    dueDate: 'Today',
    estimatedMinutes: 30,
    blocking: false,
    status: 'pending',
    performance: '2.3x slower than baseline',
    affectedUsers: 47,
    aiRecommendation: {
      action: 'Add partitioning on date field - improved performance by 65% in similar cases',
      confidence: 88,
      estimatedTime: '30 min',
      successRate: 72
    },
    dueThisWeek: true
  },
  {
    id: '4',
    type: 'system_issue',
    priority: 'urgent',
    title: 'Kafka consumer lag spike detected',
    description: 'Order processing delayed',
    requester: 'System Alert',
    impact: 'Customer order processing delayed by 15+ minutes',
    dueDate: 'NOW',
    estimatedMinutes: 5,
    blocking: true,
    status: 'pending',
    performance: '15 min lag on order_events topic',
    affectedUsers: 156,
    aiRecommendation: {
      action: 'Restart consumer group with increased partition allocation',
      confidence: 92,
      estimatedTime: '3 min',
      successRate: 88
    },
    dueThisWeek: true
  },
  {
    id: '5',
    type: 'analysis',
    priority: 'medium',
    title: 'Quarterly Data Quality Review',
    description: 'Regular review of data quality metrics',
    requester: 'Team Process',
    impact: 'Compliance requirement',
    dueDate: 'End of week',
    estimatedMinutes: 120,
    blocking: false,
    status: 'pending',
    progress: 60,
    nextAction: 'Review entity resolution rules with business team',
    quickContext: 'Use standard review template (saves 20 min)',
    dueThisWeek: true
  },
  {
    id: '6',
    type: 'suggestion',
    priority: 'low',
    title: 'Enable query result caching',
    description: 'Reduce compute costs',
    requester: 'AI Assistant',
    impact: 'Potential 30% compute reduction',
    dueDate: 'Anytime',
    estimatedMinutes: 15,
    blocking: false,
    status: 'pending',
    confidence: 78,
    successRate: 85,
    dueThisWeek: false
  },
  {
    id: '7',
    type: 'documentation',
    priority: 'low',
    title: 'Update pipeline documentation',
    description: 'Document new customer segmentation logic',
    requester: 'Tech Lead',
    impact: 'Team knowledge sharing',
    dueDate: 'Next Friday',
    estimatedMinutes: 45,
    blocking: false,
    status: 'pending',
    quickContext: 'Auto-generate from code comments',
    dueThisWeek: false
  },
  {
    id: '8',
    type: 'review',
    priority: 'high',
    title: 'Technical review for new segmentation rules',
    description: 'Junior engineer blocked on first project',
    requester: 'Mike',
    role: 'Junior Data Engineer',
    impact: 'New team member onboarding',
    dueDate: 'TODAY',
    estimatedMinutes: 20,
    blocking: true,
    blockedFor: '5 hours',
    status: 'pending',
    quickContext: 'Simple config review, good learning opportunity',
    dueThisWeek: true
  }
];

export default function WorkQueuePage() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [sortBy, setSortBy] = useState<string>('priority');
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set());

  // Filter tasks for different views
  const urgentTasks = tasks.filter(t => t.blocking || t.priority === 'urgent');
  const systemIssues = tasks.filter(t => t.type === 'system_issue');
  const thisWeekTasks = tasks.filter(t => t.dueThisWeek);
  const suggestions = tasks.filter(t => t.type === 'suggestion');

  // Helper functions
  const priorityWeight = (priority: string) => {
    const weights: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1
    };
    return weights[priority] || 0;
  };

  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      switch(sortBy) {
        case 'priority':
          return priorityWeight(b.priority) - priorityWeight(a.priority);
        case 'due':
          const dateA = a.dueDate === 'NOW' ? 0 : a.dueDate === 'TODAY' ? 1 : a.dueDate === 'Tomorrow' ? 2 : 3;
          const dateB = b.dueDate === 'NOW' ? 0 : b.dueDate === 'TODAY' ? 1 : b.dueDate === 'Tomorrow' ? 2 : 3;
          return dateA - dateB;
        case 'effort':
          return a.estimatedMinutes - b.estimatedMinutes;
        case 'impact':
          return (b.affectedUsers || 0) - (a.affectedUsers || 0);
        default:
          return 0;
      }
    });
  };

  // Get smart actions based on task type
  const getTaskActions = (task: Task) => {
    const actionMap = {
      review: {
        primary: { label: 'Start Review', icon: <FileSearch className="w-3 h-3" />, action: () => handlePrimaryAction(task, 'Starting review...') },
        secondary: { label: `Message ${task.requester}`, icon: <MessageSquare className="w-3 h-3" />, action: () => console.log('Message user') },
        tertiary: { label: 'Schedule Meeting', icon: <Calendar className="w-3 h-3" />, action: () => console.log('Schedule meeting') }
      },
      deployment: {
        primary: { label: 'Deploy Now', icon: <Rocket className="w-3 h-3" />, action: () => handlePrimaryAction(task, 'Initiating deployment...') },
        secondary: { label: 'Run Tests', icon: <TestTube className="w-3 h-3" />, action: () => console.log('Run tests') },
        tertiary: { label: 'View Checklist', icon: <Clipboard className="w-3 h-3" />, action: () => console.log('View checklist') }
      },
      system_issue: {
        primary: { label: 'Apply Fix', icon: <Wrench className="w-3 h-3" />, action: () => handlePrimaryAction(task, 'Applying fix...') },
        secondary: { label: 'Investigate', icon: <FileSearch className="w-3 h-3" />, action: () => console.log('Investigate') },
        tertiary: { label: 'View Logs', icon: <Eye className="w-3 h-3" />, action: () => console.log('View logs') }
      },
      analysis: {
        primary: { label: 'Continue Work', icon: <Play className="w-3 h-3" />, action: () => handlePrimaryAction(task, 'Opening analysis...') },
        secondary: { label: 'View Progress', icon: <BarChart3 className="w-3 h-3" />, action: () => console.log('View progress') },
        tertiary: { label: 'Export Report', icon: <FileText className="w-3 h-3" />, action: () => console.log('Export report') }
      },
      documentation: {
        primary: { label: 'Edit Docs', icon: <FileText className="w-3 h-3" />, action: () => handlePrimaryAction(task, 'Opening editor...') },
        secondary: { label: 'Generate Draft', icon: <Sparkles className="w-3 h-3" />, action: () => console.log('Generate draft') },
        tertiary: { label: 'View Current', icon: <Eye className="w-3 h-3" />, action: () => console.log('View current') }
      },
      suggestion: {
        primary: { label: 'Learn More', icon: <BookOpenCheck className="w-3 h-3" />, action: () => console.log('Learn more') },
        secondary: { label: 'Schedule Later', icon: <Clock className="w-3 h-3" />, action: () => console.log('Schedule') },
        tertiary: { label: 'Dismiss', icon: <XCircle className="w-3 h-3" />, action: () => console.log('Dismiss') }
      }
    };

    return actionMap[task.type] || actionMap.review;
  };

  const handlePrimaryAction = async (task: Task, message: string) => {
    setProcessingTasks(prev => new Set(prev).add(task.id));
    // Simulate async action
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: 'in_progress' } : t
    ));
    setProcessingTasks(prev => {
      const next = new Set(prev);
      next.delete(task.id);
      return next;
    });
  };

  const markComplete = (task: Task) => {
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: 'completed' } : t
    ));
  };

  const deferTask = (task: Task) => {
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, dueDate: 'Tomorrow', priority: 'medium' as const } : t
    ));
  };

  // Priority indicator component
  const PriorityIndicator = ({ priority }: { priority: string }) => (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          priority === 'urgent' && "bg-red-600 animate-pulse",
          priority === 'high' && "bg-orange-500",
          priority === 'medium' && "bg-yellow-500",
          priority === 'low' && "bg-green-500"
        )}
      />
      <span className="text-xs capitalize text-muted-foreground">
        {priority}
      </span>
    </div>
  );

  // Task card component
  const TaskCard = ({ task }: { task: Task }) => {
    const actions = getTaskActions(task);
    const isProcessing = processingTasks.has(task.id);

    return (
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        task.status === 'in_progress' && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
        task.status === 'completed' && "opacity-60",
        task.blocking && task.status === 'pending' && "border-red-200 dark:border-red-800"
      )}>
        <CardContent className="p-4">
          {/* Header with priority and metadata */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <PriorityIndicator priority={task.priority} />
              <Badge variant="outline" className="text-xs capitalize">
                {task.type.replace('_', ' ')}
              </Badge>
              {task.blocking && (
                <Badge variant="destructive" className="text-xs">
                  Blocking
                </Badge>
              )}
              {task.status === 'in_progress' && (
                <Badge variant="default" className="text-xs">
                  In Progress
                </Badge>
              )}
            </div>

            <div className="text-right text-xs text-muted-foreground">
              <div className="font-medium">Due: {task.dueDate}</div>
              <div>~{task.estimatedMinutes} min</div>
            </div>
          </div>

          {/* Task content */}
          <div className="space-y-2 mb-4">
            <h4 className="font-semibold text-foreground">{task.title}</h4>
            <p className="text-sm text-muted-foreground">
              {task.requester && (
                <>
                  <span className="font-medium">{task.requester}</span>
                  {task.role && ` (${task.role})`} •
                </>
              )}
              {' '}{task.description}
            </p>
            <p className="text-xs text-destructive-foreground">
              Impact: {task.impact}
            </p>
            {task.affectedUsers && (
              <p className="text-xs text-muted-foreground">
                {task.affectedUsers} users affected
              </p>
            )}
            {task.blockedFor && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Blocked for {task.blockedFor}
              </p>
            )}
          </div>

          {/* Quick context or AI recommendation */}
          {(task.quickContext || task.aiRecommendation) && (
            <div className="bg-muted/50 rounded p-2 border border-border/50 mb-4">
              {task.aiRecommendation ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bot className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">AI Recommendation</span>
                    <Badge variant="outline" className="text-xs">
                      {task.aiRecommendation.confidence}% confidence
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {task.aiRecommendation.action}
                  </p>
                </div>
              ) : (
                <p className="text-xs flex items-start gap-1">
                  <Lightbulb className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <span>{task.quickContext}</span>
                </p>
              )}
            </div>
          )}

          {/* Progress bar for ongoing work */}
          {task.progress !== undefined && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{task.progress}% complete</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={actions.primary.action}
              disabled={isProcessing || task.status === 'completed'}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Working...
                </>
              ) : (
                <>
                  {actions.primary.icon}
                  <span className="ml-1">{actions.primary.label}</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={actions.secondary.action}
            >
              {actions.secondary.icon}
              <span className="ml-1">{actions.secondary.label}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.tertiary && (
                  <DropdownMenuItem onClick={actions.tertiary.action}>
                    {actions.tertiary.icon}
                    <span className="ml-2">{actions.tertiary.label}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => markComplete(task)}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => deferTask(task)}>
                  <Clock className="w-4 h-4 mr-2" />
                  Defer to Tomorrow
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Reassign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Task list component with sorting
  const TaskList = ({ tasks: taskList, showSort = true }: { tasks: Task[], showSort?: boolean }) => {
    const sortedTasks = sortTasks(taskList);

    return (
      <div className="space-y-4">
        {showSort && taskList.length > 1 && (
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="due">Due Date</SelectItem>
                <SelectItem value="effort">Effort</SelectItem>
                <SelectItem value="impact">Impact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-3">
          {sortedTasks.length > 0 ? (
            sortedTasks.map(task => <TaskCard key={task.id} task={task} />)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No tasks in this view</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate summary stats
  const totalTimeToClean = urgentTasks.reduce((acc, task) => acc + task.estimatedMinutes, 0);
  const blockedCount = tasks.filter(t => t.blocking).length;
  const criticalIssues = systemIssues.filter(i => i.priority === 'urgent' || i.priority === 'high').length;

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
          <div className="flex gap-2">
            {blockedCount > 0 && (
              <Badge variant="destructive" className="px-3 py-1 flex items-center gap-1">
                <UserX className="h-3 w-3" />
                {blockedCount} people blocked
              </Badge>
            )}
            {criticalIssues > 0 && (
              <Badge variant="outline" className="px-3 py-1 flex items-center gap-1 border-amber-600 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {criticalIssues} system issues
              </Badge>
            )}
            <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{totalTimeToClean} min to clear urgent
            </Badge>
          </div>
        </div>

        {/* Filter tabs */}
        <Tabs defaultValue="urgent" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="urgent" className="flex items-center gap-1">
              <span className="text-sm">🚨</span>
              <span>Urgent ({urgentTasks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-1">
              <span className="text-sm">📋</span>
              <span>All ({tasks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-1">
              <span className="text-sm">⚠️</span>
              <span>Issues ({systemIssues.length})</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-1">
              <span className="text-sm">📅</span>
              <span>This Week ({thisWeekTasks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-1">
              <span className="text-sm">💡</span>
              <span>AI Ideas ({suggestions.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="urgent" className="mt-6">
            <TaskList tasks={urgentTasks} />
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <TaskList tasks={tasks} />
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <TaskList tasks={systemIssues} />
          </TabsContent>

          <TabsContent value="week" className="mt-6">
            <TaskList tasks={thisWeekTasks} />
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6">
            <TaskList tasks={suggestions} showSort={false} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}