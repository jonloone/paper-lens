'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertCircle,
  Heart,
  DollarSign,
  GitCompare,
  TrendingUp,
  Shield,
  Zap,
  Search
} from "lucide-react";
import { useHomepageStore } from "@/stores/homepageStore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function QuickActions() {
  const { systemStatus, metrics } = useHomepageStore();
  const router = useRouter();
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };
  
  const actions = [
    {
      title: "Investigate Failures",
      description: `${systemStatus.failed} ${systemStatus.failed === 1 ? 'issue needs' : 'issues need'} attention`,
      icon: <AlertCircle className="h-5 w-5" />,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-900",
      action: () => router.push('/investigate'),
      show: systemStatus.failed > 0,
      priority: true
    },
    {
      title: "Pipeline Health",
      description: `${metrics.avgSuccessRate}% success rate`,
      icon: <Heart className="h-5 w-5" />,
      color: metrics.avgSuccessRate >= 95 ? "text-green-500" : 
             metrics.avgSuccessRate >= 80 ? "text-yellow-500" : "text-red-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
      action: () => router.push('/pipelines'),
      show: true
    },
    {
      title: "Cost Analysis",
      description: `${formatCurrency(metrics.monthlyCostr)} this month`,
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
      action: () => router.push('/monitor?view=infrastructure'),
      show: true
    },
    {
      title: "Schema Changes",
      description: `${metrics.recentSchemaChanges} recent ${metrics.recentSchemaChanges === 1 ? 'change' : 'changes'}`,
      icon: <GitCompare className="h-5 w-5" />,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-900",
      action: () => router.push('/catalog'),
      show: metrics.recentSchemaChanges > 0
    },
    {
      title: "Active Alerts",
      description: `${metrics.activeAlerts} ${metrics.activeAlerts === 1 ? 'alert' : 'alerts'} active`,
      icon: <Shield className="h-5 w-5" />,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-900",
      action: () => router.push('/monitor?view=quality'),
      show: metrics.activeAlerts > 0
    },
    {
      title: "Performance",
      description: `${systemStatus.degraded} slow pipelines`,
      icon: <Zap className="h-5 w-5" />,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      borderColor: "border-yellow-200 dark:border-yellow-900",
      action: () => router.push('/monitor?view=pipelines&filter=degraded'),
      show: systemStatus.degraded > 0
    },
    {
      title: "Data Quality",
      description: "Check quality rules",
      icon: <Shield className="h-5 w-5" />,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      borderColor: "border-indigo-200 dark:border-indigo-900",
      action: () => router.push('/monitor?view=quality'),
      show: true
    },
    {
      title: "Quick Search",
      description: "Search across all data",
      icon: <Search className="h-5 w-5" />,
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
      borderColor: "border-gray-200 dark:border-gray-900",
      action: () => router.push('/query'),
      show: true
    }
  ];
  
  const visibleActions = actions.filter(a => a.show);
  const priorityActions = visibleActions.filter(a => a.priority);
  const regularActions = visibleActions.filter(a => !a.priority);
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Priority actions first */}
      {priorityActions.map((action, idx) => (
        <Card 
          key={`priority-${idx}`}
          className={cn(
            "border-0 shadow-sm hover:shadow-md transition-all cursor-pointer",
            "hover:scale-105 duration-200",
            action.borderColor,
            action.bgColor
          )}
          onClick={action.action}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <div className={cn(action.color, "ml-2")}>
                {action.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Regular actions */}
      {regularActions.slice(0, 4 - priorityActions.length).map((action, idx) => (
        <Card 
          key={`regular-${idx}`}
          className={cn(
            "border-0 shadow-sm hover:shadow-md transition-all cursor-pointer",
            "hover:scale-105 duration-200"
          )}
          onClick={action.action}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <div className={cn(action.color, "ml-2")}>
                {action.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}