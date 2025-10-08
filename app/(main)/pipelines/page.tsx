'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Clock,
  TrendingUp,
  Filter,
  GitBranch,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Calendar,
  Zap
} from 'lucide-react';

interface Pipeline {
  id: string;
  name: string;
  description: string;
  schedule: string;
  status: 'running' | 'success' | 'failed' | 'paused';
  lastRun?: Date;
  nextRun?: Date;
  avgDuration?: number;
  successRate?: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

export default function PipelinesPage() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Mock data - in production, this would come from API
  const templates: Template[] = [
    {
      id: 'daily-etl',
      name: 'Daily ETL',
      description: 'Standard daily extract, transform, load pipeline',
      icon: Clock
    },
    {
      id: 'incremental-load',
      name: 'Incremental Load',
      description: 'Efficiently load only changed data',
      icon: TrendingUp
    },
    {
      id: 'data-quality',
      name: 'Data Quality Check',
      description: 'Automated quality validation pipeline',
      icon: Filter
    },
    {
      id: 'ml-feature',
      name: 'ML Feature Pipeline',
      description: 'Feature engineering for ML models',
      icon: Zap
    }
  ];
  
  const pipelines: Pipeline[] = [
    {
      id: '1',
      name: 'revenue_calc',
      description: 'Calculate daily revenue metrics',
      schedule: '@daily',
      status: 'running',
      lastRun: new Date(Date.now() - 3600000),
      nextRun: new Date(Date.now() + 3600000 * 23),
      avgDuration: 45,
      successRate: 98
    },
    {
      id: '2',
      name: 'customer_etl',
      description: 'Customer data synchronization',
      schedule: '@hourly',
      status: 'failed',
      lastRun: new Date(Date.now() - 1800000),
      nextRun: new Date(Date.now() + 1800000),
      avgDuration: 12,
      successRate: 94
    },
    {
      id: '3',
      name: 'inventory_sync',
      description: 'Sync inventory across systems',
      schedule: '*/15 * * * *',
      status: 'success',
      lastRun: new Date(Date.now() - 900000),
      nextRun: new Date(Date.now() + 900000),
      avgDuration: 5,
      successRate: 99.5
    },
    {
      id: '4',
      name: 'ml_training',
      description: 'Weekly model retraining',
      schedule: '@weekly',
      status: 'paused',
      lastRun: new Date(Date.now() - 86400000 * 3),
      avgDuration: 180,
      successRate: 87
    }
  ];
  
  const getStatusIcon = (status: Pipeline['status']) => {
    switch (status) {
      case 'running':
        return <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getStatusBadge = (status: Pipeline['status']) => {
    const variants = {
      running: 'default' as const,
      success: 'secondary' as const,
      failed: 'destructive' as const,
      paused: 'outline' as const
    };
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };
  
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // In production, this would open a configuration modal
    console.log('Selected template:', templateId);
    
    // Mock creating a pipeline from template
    setTimeout(() => {
      setShowTemplates(false);
      setSelectedTemplate(null);
    }, 1000);
  };
  
  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Pipelines</h1>
          <p className="text-muted-foreground">Manage Airflow DAGs with pre-built templates</p>
        </div>
        <Button onClick={() => setShowTemplates(!showTemplates)}>
          <Plus className="h-4 w-4 mr-2" />
          New Pipeline
        </Button>
      </div>
      
      {/* Template Selection */}
      {showTemplates && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose a Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={cn(
                      "p-4 border rounded-lg text-left transition-all hover:border-primary hover:bg-muted/50",
                      selectedTemplate === template.id && "border-primary bg-muted"
                    )}
                  >
                    <Icon className="h-8 w-8 mb-3 text-primary" />
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* 20% Case - Complex DAGs */}
            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" size="sm" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Airflow UI for Complex DAGs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Active Pipelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Pipelines</span>
            <div className="flex items-center gap-2 text-sm font-normal">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">
                  {pipelines.filter(p => p.status === 'success').length} Healthy
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">
                  {pipelines.filter(p => p.status === 'failed').length} Failed
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelines.map((pipeline) => (
              <div
                key={pipeline.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(pipeline.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pipeline.name}</span>
                      {getStatusBadge(pipeline.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {pipeline.description}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {pipeline.schedule}
                      </span>
                      {pipeline.avgDuration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~{formatDuration(pipeline.avgDuration)}
                        </span>
                      )}
                      {pipeline.successRate && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {pipeline.successRate}% success
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {pipeline.status === 'failed' && (
                    <Button variant="outline" size="sm">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Debug
                    </Button>
                  )}
                  {pipeline.status === 'running' && (
                    <Button variant="outline" size="sm">
                      View Logs
                    </Button>
                  )}
                  {pipeline.status === 'paused' && (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  {pipeline.status === 'success' && (
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">12</div>
            <p className="text-sm text-muted-foreground">Total Pipelines</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">23min</div>
            <p className="text-sm text-muted-foreground">Avg Duration</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}