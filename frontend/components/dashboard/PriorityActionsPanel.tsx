"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Database,
  GitBranch,
  Lightbulb,
  Package,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
  DollarSign,
  Users,
  FileWarning
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Action {
  id: string;
  type: 'issue' | 'opportunity' | 'task' | 'approval';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact?: string;
  category: string;
  icon: any;
  iconColor: string;
  action: string;
  metadata?: Record<string, any>;
  aiSuggested?: boolean;
  estimatedTime?: string;
  potentialSavings?: string;
}

const criticalActions: Action[] = [
  {
    id: '1',
    type: 'issue',
    priority: 'critical',
    title: 'Backup System Failure',
    description: 'Incremental backups failing for Customer360 dataset',
    impact: 'Data loss risk for 48hrs of transactions',
    category: 'Infrastructure',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    action: 'Investigate',
    metadata: { 
      failedJobs: 3,
      lastSuccess: '48 hours ago',
      dataSize: '2.3 TB'
    },
    estimatedTime: '30 min'
  },
  {
    id: '2',
    type: 'issue',
    priority: 'high',
    title: 'Schema Drift Detected',
    description: 'Source system modified 5 columns without notification',
    impact: '12 downstream models affected',
    category: 'Data Quality',
    icon: FileWarning,
    iconColor: 'text-orange-500',
    action: 'Auto-Fix',
    metadata: {
      source: 'ERP_ORDERS',
      changes: ['added: order_priority', 'modified: customer_id type'],
      affected: 12
    },
    aiSuggested: true,
    estimatedTime: '15 min'
  },
  {
    id: '3',
    type: 'approval',
    priority: 'high',
    title: 'Production Deployment Pending',
    description: 'Revenue forecasting model v2.1 ready for production',
    category: 'Deployment',
    icon: GitBranch,
    iconColor: 'text-blue-500',
    action: 'Review',
    metadata: {
      accuracy: '94.2%',
      improvement: '+3.1%',
      testsPassed: 48
    },
    estimatedTime: '10 min'
  }
];

const opportunities: Action[] = [
  {
    id: '4',
    type: 'opportunity',
    priority: 'medium',
    title: 'Cost Optimization Available',
    description: 'Unused compute resources detected in staging environment',
    impact: 'Save $2,400/month',
    category: 'Cost',
    icon: DollarSign,
    iconColor: 'text-green-500',
    action: 'Implement',
    potentialSavings: '$2,400/mo',
    aiSuggested: true,
    estimatedTime: '5 min'
  },
  {
    id: '5',
    type: 'opportunity',
    priority: 'medium',
    title: 'Performance Improvement',
    description: 'Index optimization can reduce query time by 60%',
    impact: 'Improve dashboard load time from 8s to 3s',
    category: 'Performance',
    icon: Zap,
    iconColor: 'text-yellow-500',
    action: 'Optimize',
    metadata: {
      currentTime: '8.2s',
      estimatedTime: '3.1s',
      affectedQueries: 23
    },
    aiSuggested: true,
    estimatedTime: '20 min'
  },
  {
    id: '6',
    type: 'opportunity',
    priority: 'low',
    title: 'New Data Product Suggestion',
    description: 'Combine inventory and sales data for demand forecasting',
    impact: 'Enable predictive restocking for 200+ SKUs',
    category: 'Innovation',
    icon: Lightbulb,
    iconColor: 'text-purple-500',
    action: 'Create Blueprint',
    metadata: {
      dataSources: ['inventory_db', 'sales_transactions'],
      estimatedROI: '15% reduction in stockouts'
    },
    aiSuggested: true,
    estimatedTime: '2 hours'
  }
];

const recentTasks: Action[] = [
  {
    id: '7',
    type: 'task',
    priority: 'medium',
    title: 'Monthly Quality Report',
    description: 'Generate compliance report for data governance',
    category: 'Compliance',
    icon: Shield,
    iconColor: 'text-indigo-500',
    action: 'Generate',
    estimatedTime: '15 min'
  },
  {
    id: '8',
    type: 'task',
    priority: 'low',
    title: 'Team Training Session',
    description: 'SQLMesh best practices workshop scheduled',
    category: 'Team',
    icon: Users,
    iconColor: 'text-blue-500',
    action: 'Join',
    metadata: {
      attendees: 12,
      time: 'Tomorrow 2:00 PM'
    },
    estimatedTime: '1 hour'
  }
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 border-gray-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200'
};

function ActionCard({ action }: { action: Action }) {
  const Icon = action.icon;
  
  return (
    <Card className={cn(
      "hover:shadow-md transition-all cursor-pointer",
      action.priority === 'critical' && "border-red-500/50",
      action.priority === 'high' && "border-orange-500/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg bg-background", action.iconColor.replace('text-', 'bg-').replace('500', '100'))}>
            <Icon className={cn("h-4 w-4", action.iconColor)} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{action.title}</h4>
                  {action.aiSuggested && (
                    <Badge variant="outline" className="text-xs">
                      AI
                    </Badge>
                  )}
                  <Badge className={cn("text-xs", priorityColors[action.priority])}>
                    {action.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{action.description}</p>
                {action.impact && (
                  <p className="text-xs font-medium text-primary">{action.impact}</p>
                )}
              </div>
            </div>
            
            {action.metadata && (
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(action.metadata).slice(0, 3).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value)}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{action.estimatedTime}</span>
                {action.potentialSavings && (
                  <>
                    <span>•</span>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-600 font-medium">{action.potentialSavings}</span>
                  </>
                )}
              </div>
              <Button size="sm" variant={action.priority === 'critical' ? 'destructive' : 'default'}>
                {action.action}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PriorityActionsPanel() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Priority Actions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI-identified issues and opportunities requiring attention
        </p>
      </div>

      <Tabs defaultValue="critical" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="critical" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Critical ({criticalActions.length})
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Opportunities ({opportunities.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Tasks ({recentTasks.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="critical" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {criticalActions.map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="opportunities" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {opportunities.map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {recentTasks.map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}