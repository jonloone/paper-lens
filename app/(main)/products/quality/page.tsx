'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  BarChart3, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Calendar, Target,
  Database, FileText, Activity, Zap
} from 'lucide-react';

export default function QualityAnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  const qualityMetrics = [
    { label: 'Overall Quality Score', value: 87, change: 5, trend: 'up', target: 90 },
    { label: 'Data Completeness', value: 94, change: 2, trend: 'up', target: 95 },
    { label: 'Data Accuracy', value: 91, change: -1, trend: 'down', target: 95 },
    { label: 'Data Freshness', value: 82, change: 8, trend: 'up', target: 85 }
  ];

  const qualityIssues = [
    {
      severity: 'high',
      count: 3,
      description: 'Missing required fields in customer data',
      affectedProducts: 2,
      trend: 'up'
    },
    {
      severity: 'medium',
      count: 7,
      description: 'Schema validation failures',
      affectedProducts: 4,
      trend: 'stable'
    },
    {
      severity: 'low',
      count: 12,
      description: 'Format inconsistencies',
      affectedProducts: 6,
      trend: 'down'
    }
  ];

  const productQuality = [
    { name: 'Customer 360 Dataset', score: 95, issues: 0, status: 'excellent' },
    { name: 'Revenue Forecasting Model', score: 89, issues: 2, status: 'good' },
    { name: 'Marketing Attribution API', score: 92, issues: 1, status: 'good' },
    { name: 'Operations Dashboard', score: 78, issues: 5, status: 'needs-attention' },
    { name: 'Churn Prediction Dataset', score: 85, issues: 3, status: 'good' },
    { name: 'Financial Risk API', score: 97, issues: 0, status: 'excellent' }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20';
      case 'medium': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'needs-attention': return 'text-amber-600 dark:text-amber-400';
      case 'poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'needs-attention': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'poor': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              Quality Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and improve data product quality across the marketplace
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Quality Metrics Overview */}
        <div className="grid grid-cols-4 gap-4">
          {qualityMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <div className={cn(
                      "flex items-center text-xs",
                      metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      {metric.trend === 'up' ? 
                        <TrendingUp className="h-3 w-3 mr-1" /> : 
                        <TrendingDown className="h-3 w-3 mr-1" />
                      }
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-semibold">{metric.value}%</p>
                    <p className="text-xs text-muted-foreground">target: {metric.target}%</p>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quality Issues and Product Health */}
        <div className="grid grid-cols-2 gap-6">
          {/* Quality Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Quality Issues
              </CardTitle>
              <CardDescription>Issues requiring attention across data products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {qualityIssues.map((issue, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs px-2", getSeverityColor(issue.severity))}>
                        {issue.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{issue.count} issues</span>
                    </div>
                    <div className={cn(
                      "flex items-center text-xs",
                      issue.trend === 'up' ? 'text-red-600 dark:text-red-400' :
                      issue.trend === 'down' ? 'text-green-600 dark:text-green-400' :
                      'text-muted-foreground'
                    )}>
                      {issue.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                       issue.trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> :
                       <Activity className="h-3 w-3 mr-1" />}
                      {issue.trend}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Affects {issue.affectedProducts} data products
                  </p>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Issues
              </Button>
            </CardContent>
          </Card>

          {/* Product Quality Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Product Quality Scores
              </CardTitle>
              <CardDescription>Quality assessment for each data product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productQuality.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(product.status)}
                          <span className="text-sm font-semibold">{product.score}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Progress value={product.score} className="h-1 flex-1 mr-2" />
                        <span className="text-xs text-muted-foreground">
                          {product.issues} issues
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View Detailed Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quality Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quality Trends
            </CardTitle>
            <CardDescription>Quality metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Quality trend chart would be displayed here</p>
                <p className="text-xs text-muted-foreground mt-1">Integration with monitoring tools required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quality Improvement Recommendations
            </CardTitle>
            <CardDescription>AI-powered suggestions to improve data quality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Implement automated data validation
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Add Great Expectations validation suite to catch data quality issues earlier in the pipeline.
                    Estimated impact: +12% quality score improvement.
                  </p>
                  <Button size="sm" className="mt-2" variant="outline">
                    Implement Suggestion
                  </Button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    Standardize data formats
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Create organization-wide data format standards to reduce inconsistencies across products.
                    Estimated impact: +8% quality score improvement.
                  </p>
                  <Button size="sm" className="mt-2" variant="outline">
                    View Guidelines
                  </Button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Improve monitoring coverage
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    3 data products lack comprehensive quality monitoring. Set up alerts for critical metrics.
                    Estimated impact: +15% faster issue detection.
                  </p>
                  <Button size="sm" className="mt-2" variant="outline">
                    Setup Monitoring
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}