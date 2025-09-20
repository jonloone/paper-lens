'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronRight,
  Database,
  Zap,
  GitBranch,
  GitCompare,
  Search
} from "lucide-react";
import { useHomepageStore } from "@/stores/homepageStore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function RecentActivityFeed() {
  const { recentActivity } = useHomepageStore();
  const router = useRouter();
  
  const formatRelativeTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  
  const getIcon = (type: string, status: string) => {
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'pipeline': return <GitBranch className="h-3 w-3" />;
      case 'query': return <Database className="h-3 w-3" />;
      case 'ingestion': return <Zap className="h-3 w-3" />;
      case 'schema_change': return <GitCompare className="h-3 w-3" />;
      default: return null;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'pipeline': return 'Pipeline';
      case 'query': return 'Query';
      case 'ingestion': return 'Ingestion';
      case 'schema_change': return 'Schema';
      default: return type;
    }
  };
  
  const handleInvestigate = (item: any) => {
    switch(item.type) {
      case 'pipeline':
        router.push(`/investigate?pipeline=${item.id}`);
        break;
      case 'query':
        router.push(`/query?id=${item.id}`);
        break;
      case 'ingestion':
        router.push(`/ingest?job=${item.id}`);
        break;
      case 'schema_change':
        router.push(`/catalog?change=${item.id}`);
        break;
    }
  };
  
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/monitor?view=pipelines')}
        >
          View All
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            recentActivity.map(item => (
              <div 
                key={item.id}
                className={cn(
                  "flex items-start justify-between p-3 rounded-lg border transition-colors",
                  "hover:bg-muted/50",
                  item.status === 'failed' && "border-red-100 bg-red-50/50 dark:bg-red-950/20",
                  item.status === 'warning' && "border-yellow-100 bg-yellow-50/50 dark:bg-yellow-950/20"
                )}
              >
                <div className="flex items-start gap-3 flex-1">
                  {getIcon(item.type, item.status)}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getTypeIcon(item.type)}
                        <span className="ml-1">{getTypeLabel(item.type)}</span>
                      </Badge>
                    </div>
                    {item.impact && (
                      <p className="text-xs text-muted-foreground">
                        {item.impact}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                </div>
                {item.actionable && (
                  <Button 
                    size="sm" 
                    variant={item.status === 'failed' ? 'destructive' : 'outline'}
                    onClick={() => handleInvestigate(item)}
                  >
                    {item.status === 'failed' ? (
                      <>
                        <Search className="h-3 w-3 mr-1" />
                        Investigate
                      </>
                    ) : (
                      'View'
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}