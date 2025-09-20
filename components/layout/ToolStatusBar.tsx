'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface ToolStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'warning' | 'checking';
  url?: string;
  lastChecked?: Date;
  message?: string;
}

export function ToolStatusBar() {
  const [tools, setTools] = useState<ToolStatus[]>([
    { name: 'DataHub', status: 'checking' },
    { name: 'Airflow', status: 'checking' },
    { name: 'Trino', status: 'checking' },
    { name: 'Spark', status: 'checking' },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkToolStatus();
    const interval = setInterval(checkToolStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkToolStatus = async () => {
    // In production, these would be actual health checks
    const mockStatuses: ToolStatus[] = [
      { 
        name: 'DataHub', 
        status: 'connected', 
        url: 'http://datahub.local:9002',
        lastChecked: new Date(),
        message: 'v0.10.5 - 12 datasets'
      },
      { 
        name: 'Airflow', 
        status: 'connected', 
        url: 'http://airflow.local:8080',
        lastChecked: new Date(),
        message: '24 DAGs active'
      },
      { 
        name: 'Trino', 
        status: 'warning', 
        url: 'http://trino.local:8080',
        lastChecked: new Date(),
        message: 'High query latency detected'
      },
      { 
        name: 'Spark', 
        status: 'connected', 
        url: 'http://spark.local:8080',
        lastChecked: new Date(),
        message: '3 workers available'
      },
    ];
    
    setTools(mockStatuses);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTools(tools.map(t => ({ ...t, status: 'checking' })));
    await new Promise(resolve => setTimeout(resolve, 1000));
    await checkToolStatus();
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: ToolStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'checking':
        return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    }
  };

  const getOverallStatus = () => {
    if (tools.some(t => t.status === 'disconnected')) return 'error';
    if (tools.some(t => t.status === 'warning')) return 'warning';
    if (tools.every(t => t.status === 'connected')) return 'healthy';
    return 'checking';
  };

  const overallStatus = getOverallStatus();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 text-xs font-normal"
        >
          <div className="flex items-center gap-2">
            {overallStatus === 'healthy' && (
              <CheckCircle className="h-3 w-3 text-green-500" />
            )}
            {overallStatus === 'warning' && (
              <AlertCircle className="h-3 w-3 text-yellow-500" />
            )}
            {overallStatus === 'error' && (
              <XCircle className="h-3 w-3 text-red-500" />
            )}
            {overallStatus === 'checking' && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            <span className="text-muted-foreground">
              {overallStatus === 'healthy' && 'All Systems Operational'}
              {overallStatus === 'warning' && 'System Warning'}
              {overallStatus === 'error' && 'System Error'}
              {overallStatus === 'checking' && 'Checking...'}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Tool Status</h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7 px-2"
            >
              <RefreshCw className={cn(
                "h-3 w-3",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          </div>
          
          <div className="space-y-2">
            {tools.map((tool) => (
              <div 
                key={tool.name}
                className="flex items-start justify-between p-2 rounded-lg border bg-card"
              >
                <div className="flex items-start gap-2">
                  {getStatusIcon(tool.status)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{tool.name}</span>
                      {tool.status === 'connected' && (
                        <Badge variant="outline" className="text-xs h-5">
                          Connected
                        </Badge>
                      )}
                      {tool.status === 'warning' && (
                        <Badge variant="outline" className="text-xs h-5 border-yellow-500 text-yellow-600">
                          Warning
                        </Badge>
                      )}
                      {tool.status === 'disconnected' && (
                        <Badge variant="destructive" className="text-xs h-5">
                          Error
                        </Badge>
                      )}
                    </div>
                    {tool.message && (
                      <p className="text-xs text-muted-foreground">
                        {tool.message}
                      </p>
                    )}
                  </div>
                </div>
                {tool.url && tool.status !== 'checking' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1"
                    onClick={() => window.open(tool.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Last checked: {tools[0]?.lastChecked ? 
                new Date(tools[0].lastChecked).toLocaleTimeString() : 
                'Never'
              }
            </p>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}