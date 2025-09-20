'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowRight,
  Clock,
  Cloud,
  Database,
  FileCode,
  GitBranch,
  Layers,
  Package,
  RefreshCw,
  Sparkles,
  Zap
} from 'lucide-react';

const templates = [
  {
    id: 'cdc-pipeline',
    name: 'CDC Pipeline',
    description: 'Real-time change data capture from database to data lake',
    tools: ['Debezium', 'Kafka', 'Spark', 'S3'],
    complexity: 'Advanced',
    estimatedTime: '2 days',
    icon: RefreshCw
  },
  {
    id: 'batch-etl',
    name: 'Batch ETL',
    description: 'Daily batch processing with dbt transformations',
    tools: ['Airflow', 'dbt', 'Trino', 'DataHub'],
    complexity: 'Intermediate',
    estimatedTime: '1 day',
    icon: Clock
  },
  {
    id: 'streaming',
    name: 'Real-time Stream',
    description: 'Kafka streaming with Spark processing',
    tools: ['Kafka', 'Spark Streaming', 'Cassandra'],
    complexity: 'Advanced',
    estimatedTime: '3 days',
    icon: Zap
  },
  {
    id: 'data-quality',
    name: 'Data Quality Pipeline',
    description: 'Automated data quality checks and monitoring',
    tools: ['dbt', 'Great Expectations', 'Airflow'],
    complexity: 'Intermediate',
    estimatedTime: '1 day',
    icon: Database
  },
  {
    id: 'ml-feature',
    name: 'ML Feature Pipeline',
    description: 'Feature engineering for machine learning',
    tools: ['Spark', 'Feature Store', 'MLflow'],
    complexity: 'Advanced',
    estimatedTime: '2 days',
    icon: Sparkles
  },
  {
    id: 'data-ingestion',
    name: 'Data Ingestion',
    description: 'Multi-source data ingestion with NiFi',
    tools: ['NiFi', 'Kafka', 'S3', 'DataHub'],
    complexity: 'Beginner',
    estimatedTime: '4 hours',
    icon: Cloud
  }
];

export function TemplateGallery() {
  const useTemplate = (templateId: string) => {
    console.log('Using template:', templateId);
    // In production, would load template configuration
    // and populate Pipeline Studio with components
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner':
        return 'default';
      case 'Intermediate':
        return 'secondary';
      case 'Advanced':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Layers className="h-4 w-4" />
        <AlertDescription>
          Pre-configured pipeline templates with best practices built in
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  <Badge variant={getComplexityColor(template.complexity) as any}>
                    {template.complexity}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {template.tools.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.estimatedTime}
                  </span>
                  <Button size="sm" onClick={() => useTemplate(template.id)}>
                    Use Template
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            Custom Template
          </CardTitle>
          <CardDescription className="text-center">
            Build your own template from scratch in Pipeline Studio
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button variant="outline">
            <FileCode className="h-4 w-4 mr-2" />
            Create Custom Pipeline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}