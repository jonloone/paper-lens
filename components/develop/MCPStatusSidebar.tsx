'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Database,
  Zap,
  Server,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCPServer {
  name: string;
  status: 'connected' | 'degraded' | 'disconnected';
  latency: string;
  lastUpdated: Date;
  capabilities?: string[];
}

interface Resource {
  name: string;
  available: number;
  total: number;
  unit: string;
}

export function MCPStatusSidebar() {
  // Mock data - in production, this would come from MCP server status API
  const mcpServers: MCPServer[] = [
    {
      name: 'Spark MCP',
      status: 'connected',
      latency: '12ms',
      lastUpdated: new Date(Date.now() - 30000),
      capabilities: ['job_submission', 'resource_monitoring', 'performance_metrics']
    },
    {
      name: 'Airflow MCP',
      status: 'connected',
      latency: '8ms',
      lastUpdated: new Date(Date.now() - 45000),
      capabilities: ['dag_validation', 'schedule_conflicts', 'execution_status']
    },
    {
      name: 'Trino MCP',
      status: 'connected',
      latency: '15ms',
      lastUpdated: new Date(Date.now() - 60000),
      capabilities: ['query_cost', 'execution_plans', 'optimization_hints']
    },
    {
      name: 'DataHub MCP',
      status: 'degraded',
      latency: '145ms',
      lastUpdated: new Date(Date.now() - 120000),
      capabilities: ['schema_info', 'lineage', 'quality_metrics']
    }
  ];

  const resources: Resource[] = [
    { name: 'Spark Executors', available: 24, total: 32, unit: '' },
    { name: 'Memory', available: 120, total: 256, unit: 'GB' },
    { name: 'Queue Slots', available: 8, total: 10, unit: '' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'connected':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'disconnected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="w-80 space-y-6">
      {/* MCP Server Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Development Environment
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mcpServers.map((server) => (
            <div key={server.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(server.status)}
                <div>
                  <div className="font-medium text-sm">{server.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {server.latency} • {formatTimeAgo(server.lastUpdated)}
                  </div>
                </div>
              </div>
              <Badge 
                variant={getStatusBadgeVariant(server.status)}
                className="text-xs"
              >
                {server.status}
              </Badge>
            </div>
          ))}
          
          {/* Quick health indicator */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Health</span>
              <span className="font-medium text-green-600">94%</span>
            </div>
            <Progress value={94} className="h-1.5 mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Resource Availability */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            Available Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resources.map((resource) => {
            const percentage = (resource.available / resource.total) * 100;
            const isLow = percentage < 30;
            const isModerate = percentage < 60;
            
            return (
              <div key={resource.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{resource.name}</span>
                  <span className={cn(
                    "font-medium",
                    isLow ? "text-red-600" : isModerate ? "text-amber-600" : "text-green-600"
                  )}>
                    {resource.available}/{resource.total}{resource.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={100 - percentage} 
                    className={cn(
                      "h-1.5 flex-1",
                      isLow ? "[&>div]:bg-red-500" : isModerate ? "[&>div]:bg-amber-500" : "[&>div]:bg-green-500"
                    )} 
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Resource recommendations */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">Recommendations</div>
            <div className="space-y-1">
              <div className="text-xs p-2 bg-amber-50 text-amber-700 rounded flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Memory usage high - consider scaling
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Zap className="h-3 w-3" />
            Scale Resources
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Database className="h-3 w-3" />
            Check Connections
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <RefreshCw className="h-3 w-3" />
            Restart Services
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}