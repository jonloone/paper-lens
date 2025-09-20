'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, ChevronRight, Terminal, RotateCcw } from "lucide-react";
import { useHomepageStore } from "@/stores/homepageStore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SystemStatusCard() {
  const { systemStatus } = useHomepageStore();
  const router = useRouter();
  
  const getTotalPipelines = () => 
    systemStatus.healthy + systemStatus.degraded + systemStatus.failed;
  
  const getHealthPercentage = () => {
    const total = getTotalPipelines();
    return total > 0 ? Math.round((systemStatus.healthy / total) * 100) : 0;
  };
  
  const formatRelativeTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-medium">System Status</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/monitor')}
        >
          View All
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Health</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{systemStatus.healthy}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{systemStatus.degraded}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">{systemStatus.failed}</span>
              </div>
            </div>
          </div>
          
          {/* Health Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Pipeline Health</span>
              <span className={cn(
                "font-medium",
                getHealthPercentage() >= 95 ? "text-green-600" :
                getHealthPercentage() >= 80 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {getHealthPercentage()}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all",
                  getHealthPercentage() >= 95 ? "bg-green-500" :
                  getHealthPercentage() >= 80 ? "bg-yellow-500" :
                  "bg-red-500"
                )}
                style={{ width: `${getHealthPercentage()}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Critical Failures */}
        {systemStatus.criticalFailures.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Critical Issues</h3>
            {systemStatus.criticalFailures.map(failure => (
              <Alert key={failure.id} variant="destructive" className="border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span className="text-sm">{failure.name}</span>
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {failure.severity}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p className="text-sm">{failure.error}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Failed {formatRelativeTime(failure.failedAt)}</span>
                    <span>•</span>
                    <span>Affects: {failure.impact.downstream.length} pipelines</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => router.push(`/investigate?pipeline=${failure.id}`)}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Investigate
                    </Button>
                    <Button size="sm" variant="outline">
                      <Terminal className="h-3 w-3 mr-1" />
                      View Logs
                    </Button>
                    <Button size="sm" variant="outline">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        
        {/* Degraded Summary */}
        {systemStatus.degraded > 0 && (
          <Alert className="border-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm">Performance Degradation</AlertTitle>
            <AlertDescription className="mt-1">
              <span className="text-sm">
                {systemStatus.degraded} pipelines running slower than usual
              </span>
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2 text-sm"
                onClick={() => router.push('/monitor?view=pipelines&filter=degraded')}
              >
                View Details →
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* All Good State */}
        {systemStatus.failed === 0 && systemStatus.degraded === 0 && systemStatus.healthy > 0 && (
          <Alert className="border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-sm">All Systems Operational</AlertTitle>
            <AlertDescription className="text-sm">
              All {systemStatus.healthy} pipelines are running smoothly
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}