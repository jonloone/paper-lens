'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Users, Activity, 
  BarChart3, Calendar, Clock, Download,
  Eye, Star, Target, Zap, FileText
} from 'lucide-react';

export default function UsageInsightsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  const usageMetrics = [
    { label: 'Total Active Users', value: 347, change: 23, trend: 'up' },
    { label: 'Daily API Calls', value: '15.7K', change: 12, trend: 'up' },
    { label: 'Data Downloads', value: 1289, change: -5, trend: 'down' },
    { label: 'Avg Session Duration', value: '28 min', change: 8, trend: 'up' }
  ];

  const topProducts = [
    {
      name: 'Customer 360 Dataset',
      users: 89,
      sessions: 234,
      avgDuration: '45 min',
      growth: 15,
      category: 'analytics'
    },
    {
      name: 'Marketing Attribution API',
      users: 67,
      sessions: 1456,
      avgDuration: '12 min',
      growth: 32,
      category: 'marketing'
    },
    {
      name: 'Financial Risk API',
      users: 52,
      sessions: 892,
      avgDuration: '8 min',
      growth: 8,
      category: 'finance'
    },
    {
      name: 'Revenue Forecasting Model',
      users: 34,
      sessions: 78,
      avgDuration: '67 min',
      growth: -3,
      category: 'finance'
    },
    {
      name: 'Churn Prediction Dataset',
      users: 28,
      sessions: 156,
      avgDuration: '34 min',
      growth: 22,
      category: 'ml'
    }
  ];

  const userSegments = [
    { segment: 'Power Users', count: 42, percentage: 12, description: 'Daily active users with >10 sessions/week' },
    { segment: 'Regular Users', count: 156, percentage: 45, description: 'Weekly active users with 3-10 sessions/week' },
    { segment: 'Casual Users', count: 149, percentage: 43, description: 'Monthly active users with <3 sessions/week' }
  ];

  const departmentUsage = [
    { department: 'Analytics', users: 98, products: 12, growth: 18 },
    { department: 'Marketing', users: 76, products: 8, growth: 25 },
    { department: 'Finance', users: 54, products: 6, growth: 12 },
    { department: 'Operations', users: 67, products: 9, growth: 8 },
    { department: 'Data Science', users: 52, products: 15, growth: 35 }
  ];

  const usagePatterns = [
    {
      pattern: 'Morning Analytics Rush',
      time: '9-11 AM',
      description: 'Peak usage of analytical datasets and dashboards',
      impact: '+67% API calls',
      products: ['Customer 360', 'Operations Dashboard']
    },
    {
      pattern: 'End-of-Month Reporting',
      time: 'Last 3 days',
      description: 'Spike in financial and revenue-related data products',
      impact: '+145% downloads',
      products: ['Revenue Forecasting', 'Financial Risk API']
    },
    {
      pattern: 'ML Model Training Cycles',
      time: 'Weekends',
      description: 'Increased usage of ML datasets and feature stores',
      impact: '+89% compute usage',
      products: ['Churn Prediction', 'ML Feature Pipeline']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              Usage Insights
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze usage patterns and adoption trends across data products
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

        {/* Usage Metrics Overview */}
        <div className="grid grid-cols-4 gap-4">
          {usageMetrics.map((metric, index) => (
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
                  <p className="text-2xl font-semibold">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top Products and User Segments */}
        <div className="grid grid-cols-2 gap-6">
          {/* Top Products by Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Most Used Products
              </CardTitle>
              <CardDescription>Products ranked by user engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                    </div>
                    <div className={cn(
                      "flex items-center text-xs px-2 py-1 rounded",
                      product.growth > 0 ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/20' :
                      'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/20'
                    )}>
                      {product.growth > 0 ? 
                        <TrendingUp className="h-3 w-3 mr-1" /> : 
                        <TrendingDown className="h-3 w-3 mr-1" />
                      }
                      {Math.abs(product.growth)}%
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {product.users} users
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {product.sessions} sessions
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {product.avgDuration}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* User Segments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Segments
              </CardTitle>
              <CardDescription>User engagement patterns and segments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userSegments.map((segment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{segment.segment}</p>
                      <p className="text-xs text-muted-foreground">{segment.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{segment.count} users</p>
                      <p className="text-xs text-muted-foreground">{segment.percentage}%</p>
                    </div>
                  </div>
                  <Progress value={segment.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Department Usage and Usage Patterns */}
        <div className="grid grid-cols-2 gap-6">
          {/* Department Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage by Department
              </CardTitle>
              <CardDescription>Data product adoption across departments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {departmentUsage.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{dept.department}</p>
                      <div className={cn(
                        "text-xs px-2 py-1 rounded",
                        dept.growth > 15 ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/20' :
                        dept.growth > 5 ? 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20' :
                        'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/20'
                      )}>
                        +{dept.growth}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{dept.users} active users</span>
                      <span>{dept.products} products used</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Usage Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Usage Patterns
              </CardTitle>
              <CardDescription>Identified behavioral patterns and trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usagePatterns.map((pattern, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{pattern.pattern}</p>
                      <p className="text-xs text-muted-foreground">{pattern.time}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {pattern.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{pattern.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {pattern.products.map((product, pIndex) => (
                      <Badge key={pIndex} variant="secondary" className="text-xs px-1.5 py-0">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Usage Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Usage Trends Over Time
            </CardTitle>
            <CardDescription>Historical usage patterns and growth trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Usage trend chart would be displayed here</p>
                <p className="text-xs text-muted-foreground mt-1">Integration with analytics tools required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights and Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Usage Insights & Recommendations
            </CardTitle>
            <CardDescription>AI-powered insights to improve adoption and engagement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Marketing team showing strong adoption
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    25% growth in marketing department usage this month. Consider creating more marketing-specific data products to capitalize on this trend.
                  </p>
                  <Button size="sm" className="mt-2" variant="outline">
                    Explore Opportunities
                  </Button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Peak usage during business hours
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    67% of API calls happen between 9-11 AM. Consider optimizing infrastructure scaling and implementing caching for better performance.
                  </p>
                  <Button size="sm" className="mt-2" variant="outline">
                    Optimize Performance
                  </Button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    Customer 360 Dataset exceeding expectations
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    89 active users with 45-minute average sessions. Create similar unified datasets for other business domains to replicate this success.
                  </p>
                  <Button size="sm" className="mt-2" variant="outline">
                    Replicate Success
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