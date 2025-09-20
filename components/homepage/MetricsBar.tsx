'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useHomepageStore } from "@/stores/homepageStore";
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  GitBranch,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricsBar() {
  const { metrics } = useHomepageStore();
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };
  
  const metricsData = [
    {
      label: "Total Pipelines",
      value: metrics.totalPipelines,
      icon: <GitBranch className="h-4 w-4" />,
      trend: null,
      color: "text-blue-500"
    },
    {
      label: "Success Rate",
      value: `${metrics.avgSuccessRate}%`,
      icon: metrics.avgSuccessRate >= 95 ? 
        <TrendingUp className="h-4 w-4" /> : 
        <TrendingDown className="h-4 w-4" />,
      trend: metrics.avgSuccessRate >= 95 ? "up" : "down",
      color: metrics.avgSuccessRate >= 95 ? "text-green-500" : 
             metrics.avgSuccessRate >= 80 ? "text-yellow-500" : "text-red-500"
    },
    {
      label: "Monthly Cost",
      value: formatCurrency(metrics.monthlyCostr),
      icon: <DollarSign className="h-4 w-4" />,
      trend: null,
      color: "text-purple-500"
    },
    {
      label: "Active Alerts",
      value: metrics.activeAlerts,
      icon: <AlertCircle className="h-4 w-4" />,
      trend: metrics.activeAlerts > 0 ? "alert" : null,
      color: metrics.activeAlerts > 0 ? "text-red-500" : "text-green-500"
    }
  ];
  
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricsData.map((metric, idx) => (
            <div key={idx} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className={cn(metric.color)}>
                  {metric.icon}
                </div>
                <p className={cn(
                  "text-2xl font-semibold",
                  metric.trend === "alert" && "text-red-500"
                )}>
                  {metric.value}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}