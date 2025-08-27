"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Activity, 
  AlertCircle, 
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemStatus {
  id: string;
  name: string;
  type: 'database' | 'pipeline' | 'service' | 'model';
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  metrics: {
    label: string;
    value: number;
    max: number;
    unit?: string;
  }[];
  lastUpdate: string;
}

const mockSystemStatus: SystemStatus[] = [
  {
    id: '1',
    name: 'Primary Data Lake',
    type: 'database',
    status: 'healthy',
    metrics: [
      { label: 'Throughput', value: 85, max: 100, unit: 'MB/s' },
      { label: 'Storage', value: 72, max: 100, unit: '%' }
    ],
    lastUpdate: '2 min ago'
  },
  {
    id: '2',
    name: 'SQLMesh Orchestrator',
    type: 'pipeline',
    status: 'healthy',
    metrics: [
      { label: 'Active Models', value: 42, max: 50 },
      { label: 'Queue', value: 8, max: 100 }
    ],
    lastUpdate: '1 min ago'
  },
  {
    id: '3',
    name: 'Airflow Scheduler',
    type: 'service',
    status: 'degraded',
    metrics: [
      { label: 'DAGs', value: 156, max: 200 },
      { label: 'Tasks/hr', value: 1250, max: 2000 }
    ],
    lastUpdate: '5 min ago'
  },
  {
    id: '4',
    name: 'Quality Engine',
    type: 'service',
    status: 'healthy',
    metrics: [
      { label: 'Rules', value: 89, max: 100 },
      { label: 'Pass Rate', value: 96, max: 100, unit: '%' }
    ],
    lastUpdate: 'Just now'
  },
  {
    id: '5',
    name: 'Feature Store',
    type: 'model',
    status: 'healthy',
    metrics: [
      { label: 'Features', value: 324, max: 500 },
      { label: 'Latency', value: 12, max: 50, unit: 'ms' }
    ],
    lastUpdate: '3 min ago'
  },
  {
    id: '6',
    name: 'Backup System',
    type: 'service',
    status: 'critical',
    metrics: [
      { label: 'Queue', value: 95, max: 100, unit: '%' },
      { label: 'Failed', value: 3, max: 10 }
    ],
    lastUpdate: '10 min ago'
  }
];

const statusConfig = {
  healthy: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle },
  degraded: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: AlertCircle },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle },
  offline: { color: 'text-gray-500', bg: 'bg-gray-500/10', icon: AlertCircle }
};

const typeIcons = {
  database: Database,
  pipeline: Activity,
  service: Server,
  model: Layers
};

export function SystemStatusGrid() {
  const criticalSystems = mockSystemStatus.filter(s => s.status === 'critical').length;
  const degradedSystems = mockSystemStatus.filter(s => s.status === 'degraded').length;
  const healthySystems = mockSystemStatus.filter(s => s.status === 'healthy').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">System Status</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time health monitoring across all data infrastructure
          </p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="gap-1.5 px-3 py-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            <span>{healthySystems} Healthy</span>
          </Badge>
          {degradedSystems > 0 && (
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
              <span>{degradedSystems} Degraded</span>
            </Badge>
          )}
          {criticalSystems > 0 && (
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              <span>{criticalSystems} Critical</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockSystemStatus.map((system) => {
          const config = statusConfig[system.status];
          const TypeIcon = typeIcons[system.type];
          const StatusIcon = config.icon;

          return (
            <Card 
              key={system.id}
              className={cn(
                "transition-all hover:shadow-lg cursor-pointer",
                system.status === 'critical' && "border-red-500/50",
                system.status === 'degraded' && "border-yellow-500/50"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                      <TypeIcon className={cn("h-4 w-4", config.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{system.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Updated {system.lastUpdate}
                      </p>
                    </div>
                  </div>
                  <StatusIcon className={cn("h-5 w-5", config.color)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {system.metrics.map((metric, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-medium">
                        {metric.value}{metric.unit} / {metric.max}{metric.unit}
                      </span>
                    </div>
                    <Progress 
                      value={(metric.value / metric.max) * 100} 
                      className="h-1.5"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}