'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EnhancedIngestionWizard } from '@/components/data-engineering/EnhancedIngestionWizard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Upload,
  Globe,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Play,
  Pause,
  MoreVertical
} from 'lucide-react';

interface IngestionJob {
  id: string;
  name: string;
  source: string;
  target: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress?: number;
  recordsProcessed?: string;
  startTime: Date;
  nextRun?: Date;
  schedule?: string;
}

function IngestPageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'new';
  
  // Mock data for recent ingestion jobs
  const recentJobs: IngestionJob[] = [
    {
      id: '1',
      name: 'Customer Data Daily Sync',
      source: 'PostgreSQL',
      target: 'Iceberg.customers',
      status: 'running',
      progress: 67,
      recordsProcessed: '1.2M / 1.8M',
      startTime: new Date(Date.now() - 1800000),
      schedule: 'Daily at 2:00 AM'
    },
    {
      id: '2',
      name: 'Product Inventory Update',
      source: 'S3 Bucket',
      target: 'Iceberg.products',
      status: 'completed',
      recordsProcessed: '45.2K',
      startTime: new Date(Date.now() - 7200000),
      nextRun: new Date(Date.now() + 3600000),
      schedule: 'Hourly'
    },
    {
      id: '3',
      name: 'Sales Transaction Stream',
      source: 'Kafka',
      target: 'Iceberg.transactions',
      status: 'running',
      recordsProcessed: '892K',
      startTime: new Date(Date.now() - 43200000),
      schedule: 'Continuous'
    },
    {
      id: '4',
      name: 'Marketing Campaign Data',
      source: 'API',
      target: 'Iceberg.campaigns',
      status: 'failed',
      recordsProcessed: '0',
      startTime: new Date(Date.now() - 3600000),
      schedule: 'Weekly'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      running: 'default',
      completed: 'secondary',
      failed: 'destructive',
      paused: 'outline'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Render different content based on view
  if (view === 'new') {
    return (
      <div className="max-w-7xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl">New Data Ingestion</h1>
            <p className="text-muted-foreground">
              Import data from files, databases, and streaming sources
            </p>
          </div>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open NiFi Canvas
          </Button>
        </div>
        
        <EnhancedIngestionWizard />
      </div>
    );
  }
  
  if (view === 'jobs') {
    return (
      <div className="max-w-7xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl">Active Ingestion Jobs</h1>
            <p className="text-muted-foreground">
              Monitor and manage running data ingestion processes
            </p>
          </div>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {recentJobs.filter(job => job.status === 'running').map((job) => (
              <Card key={job.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <CardTitle className="text-lg">{job.name}</CardTitle>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {job.source} → {job.target}
                      </span>
                      <span className="text-muted-foreground">
                        Started {formatTimeAgo(job.startTime)}
                      </span>
                    </div>
                    
                    {job.progress && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{job.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Records</span>
                      <span className="font-mono">{job.recordsProcessed}</span>
                    </div>

                    {job.schedule && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        {job.schedule}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{recentJobs.filter(j => j.status === 'running').length}</div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">3.4M</div>
                <p className="text-sm text-muted-foreground">Records Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <p className="text-sm text-muted-foreground">Data Sources</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {recentJobs.filter(j => j.status === 'failed').length}
                </div>
                <p className="text-sm text-muted-foreground">Failed Jobs</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (view === 'history') {
    return (
      <div className="max-w-7xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl">Ingestion History</h1>
            <p className="text-muted-foreground">
              View completed and failed ingestion jobs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ingestion History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Job Name</th>
                      <th className="pb-3 px-4 font-medium">Source → Target</th>
                      <th className="pb-3 px-4 font-medium">Status</th>
                      <th className="pb-3 px-4 font-medium">Records</th>
                      <th className="pb-3 px-4 font-medium">Started</th>
                      <th className="pb-3 px-4 font-medium">Schedule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.map((job) => (
                      <tr key={job.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3">
                          <span className="font-medium text-sm">{job.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground">
                            {job.source} → {job.target}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            {getStatusBadge(job.status)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm">{job.recordsProcessed}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(job.startTime)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground">
                            {job.schedule || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Default fallback
  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-2xl">Data Ingest</h1>
    </div>
  );
}

export default function IngestPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    }>
      <IngestPageContent />
    </Suspense>
  );
}