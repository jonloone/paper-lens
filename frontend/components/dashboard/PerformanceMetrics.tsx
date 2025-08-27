"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Database,
  Clock,
  Package,
  Users,
  Zap,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Metric {
  id: string;
  name: string;
  value: string | number;
  unit?: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  category: string;
  sparkline?: number[];
  target?: number;
  description?: string;
}

const keyMetrics: Metric[] = [
  {
    id: '1',
    name: 'Data Products',
    value: 142,
    change: 12,
    trend: 'up',
    icon: Package,
    category: 'Products',
    sparkline: [30, 35, 32, 38, 42, 45, 48, 52, 58, 62, 65, 70],
    description: 'Active ODPS-compliant data products'
  },
  {
    id: '2',
    name: 'Pipeline Success Rate',
    value: '98.2',
    unit: '%',
    change: 2.1,
    trend: 'up',
    icon: Activity,
    category: 'Operations',
    sparkline: [92, 94, 93, 95, 94, 96, 95, 97, 96, 98, 97, 98.2],
    target: 99.5,
    description: 'Last 24 hours'
  },
  {
    id: '3',
    name: 'Average Query Time',
    value: '1.2',
    unit: 's',
    change: -15,
    trend: 'down',
    icon: Clock,
    category: 'Performance',
    sparkline: [2.1, 1.9, 1.8, 1.6, 1.5, 1.4, 1.3, 1.3, 1.2, 1.2, 1.2, 1.2],
    target: 1.0,
    description: '15% improvement this week'
  },
  {
    id: '4',
    name: 'Active Consumers',
    value: 324,
    change: 28,
    trend: 'up',
    icon: Users,
    category: 'Adoption',
    sparkline: [250, 260, 270, 275, 280, 285, 290, 295, 300, 310, 315, 324],
    description: 'Unique users this month'
  },
  {
    id: '5',
    name: 'Data Volume',
    value: '12.4',
    unit: 'TB',
    change: 8,
    trend: 'up',
    icon: Database,
    category: 'Scale',
    sparkline: [10.2, 10.5, 10.8, 11.0, 11.2, 11.4, 11.6, 11.8, 12.0, 12.1, 12.2, 12.4],
    description: 'Total processed this week'
  },
  {
    id: '6',
    name: 'Compute Cost',
    value: '$42.3k',
    change: -12,
    trend: 'down',
    icon: DollarSign,
    category: 'Cost',
    sparkline: [52, 50, 48, 47, 46, 45, 44, 43, 42.8, 42.5, 42.3, 42.3],
    target: 40,
    description: '12% reduction from optimization'
  },
  {
    id: '7',
    name: 'Quality Score',
    value: 94.5,
    unit: '%',
    change: 3.2,
    trend: 'up',
    icon: Zap,
    category: 'Quality',
    sparkline: [88, 89, 90, 90.5, 91, 91.5, 92, 92.5, 93, 93.5, 94, 94.5],
    target: 95,
    description: 'Average across all products'
  },
  {
    id: '8',
    name: 'API Latency',
    value: 45,
    unit: 'ms',
    change: -20,
    trend: 'down',
    icon: Activity,
    category: 'Performance',
    sparkline: [65, 62, 58, 55, 52, 50, 48, 47, 46, 45, 45, 45],
    target: 50,
    description: 'P50 response time'
  }
];

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary opacity-50"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function PerformanceMetrics() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Key Performance Indicators</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time metrics across your data infrastructure
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Activity className="h-3 w-3" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : 
                           metric.trend === 'down' ? TrendingDown : Minus;
          
          const isPositiveTrend = 
            (metric.trend === 'up' && metric.change > 0 && !metric.name.includes('Cost') && !metric.name.includes('Latency') && !metric.name.includes('Time')) ||
            (metric.trend === 'down' && (metric.name.includes('Cost') || metric.name.includes('Latency') || metric.name.includes('Time')));

          return (
            <Card key={metric.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.name}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">
                        {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                      </span>
                      {metric.unit && (
                        <span className="text-sm text-muted-foreground">{metric.unit}</span>
                      )}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      isPositiveTrend ? "text-green-600" : "text-red-600"
                    )}>
                      <TrendIcon className="h-3 w-3" />
                      <span>{Math.abs(metric.change)}%</span>
                    </div>
                  </div>
                  
                  {metric.sparkline && (
                    <div className="h-8 w-full">
                      <MiniSparkline data={metric.sparkline} />
                    </div>
                  )}
                  
                  {metric.target && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">
                        {metric.target}{metric.unit}
                      </span>
                    </div>
                  )}
                  
                  {metric.description && (
                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}