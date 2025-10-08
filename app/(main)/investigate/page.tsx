'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, Search, Filter, Clock, 
  BarChart3, Target, Brain, CheckCircle,
  XCircle, Activity, Calendar, Users,
  Zap, FileText, Server, Database
} from 'lucide-react';

interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  system: string;
  category: 'performance' | 'data-quality' | 'infrastructure' | 'security';
  status: 'open' | 'investigating' | 'resolved';
  assignee: string;
  created: string;
  lastUpdated: string;
  affectedUsers: number;
  businessImpact: string;
  tags: string[];
  aiSuggestion?: {
    confidence: number;
    recommendation: string;
    estimatedResolution: string;
  };
}

const issues: Issue[] = [
  {
    id: 'ISS-001',
    severity: 'critical',
    title: 'Kafka Consumer Lag Spike',
    description: 'Consumer lag increased to 15,000 messages causing order processing delays',
    system: 'Kafka Cluster',
    category: 'infrastructure',
    status: 'investigating',
    assignee: 'Platform Team',
    created: '2 hours ago',
    lastUpdated: '15 minutes ago',
    affectedUsers: 1247,
    businessImpact: 'Customer order processing delayed by 15+ minutes',
    tags: ['kafka', 'consumer-lag', 'orders', 'real-time'],
    aiSuggestion: {
      confidence: 92,
      recommendation: 'Restart consumer group with increased partition allocation',
      estimatedResolution: '5 minutes'
    }
  },
  {
    id: 'ISS-002',
    severity: 'high',
    title: 'Trino Query Performance Degradation',
    description: 'Analytics queries running 5x slower than baseline performance',
    system: 'Trino Cluster',
    category: 'performance',
    status: 'open',
    assignee: 'Analytics Team',
    created: '4 hours ago',
    lastUpdated: '1 hour ago',
    affectedUsers: 89,
    businessImpact: 'Executive dashboards loading slowly, affecting decision making',
    tags: ['trino', 'performance', 'analytics', 'dashboards'],
    aiSuggestion: {
      confidence: 78,
      recommendation: 'Update table statistics and optimize join strategy',
      estimatedResolution: '20 minutes'
    }
  },
  {
    id: 'ISS-003',
    severity: 'medium',
    title: 'Customer Data Schema Validation Failures',
    description: 'Increasing number of schema validation errors in customer data pipeline',
    system: 'Data Pipeline',
    category: 'data-quality',
    status: 'investigating',
    assignee: 'Data Engineering',
    created: '1 day ago',
    lastUpdated: '3 hours ago',
    affectedUsers: 0,
    businessImpact: 'Potential data quality issues, no immediate customer impact',
    tags: ['schema', 'validation', 'customer-data', 'pipeline']
  },
  {
    id: 'ISS-004',
    severity: 'high',
    title: 'API Rate Limiting Threshold Reached',
    description: 'Marketing Attribution API hitting rate limits, blocking campaigns',
    system: 'API Gateway',
    category: 'infrastructure',
    status: 'open',
    assignee: 'Platform Team',
    created: '6 hours ago',
    lastUpdated: '2 hours ago',
    affectedUsers: 23,
    businessImpact: 'Marketing campaigns unable to track attribution data',
    tags: ['api', 'rate-limiting', 'marketing', 'attribution'],
    aiSuggestion: {
      confidence: 85,
      recommendation: 'Increase rate limits and implement intelligent queuing',
      estimatedResolution: '10 minutes'
    }
  },
  {
    id: 'ISS-005',
    severity: 'low',
    title: 'Data Lake Storage Approaching 80% Capacity',
    description: 'S3 storage utilization reached 78%, need to plan for scaling',
    system: 'Data Lake',
    category: 'infrastructure',
    status: 'open',
    assignee: 'Infrastructure Team',
    created: '2 days ago',
    lastUpdated: '8 hours ago',
    affectedUsers: 0,
    businessImpact: 'No immediate impact, planning required for future growth',
    tags: ['storage', 'capacity', 'planning', 's3']
  }
];

export default function InvestigatePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('active');

  const severityOptions = [
    { id: 'all', label: 'All Severities' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' }
  ];

  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'open', label: 'Open' },
    { id: 'investigating', label: 'Investigating' },
    { id: 'resolved', label: 'Resolved' }
  ];

  const categoryOptions = [
    { id: 'all', label: 'All Categories' },
    { id: 'performance', label: 'Performance' },
    { id: 'data-quality', label: 'Data Quality' },
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'security', label: 'Security' }
  ];

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesTab = activeTab === 'active' ? issue.status !== 'resolved' : 
                      activeTab === 'critical' ? issue.severity === 'critical' :
                      activeTab === 'ai-suggested' ? !!issue.aiSuggestion : true;
    
    return matchesSearch && matchesSeverity && matchesStatus && matchesCategory && matchesTab;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200';
      case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 border-orange-200';
      case 'medium': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200';
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 dark:text-red-400';
      case 'investigating': return 'text-amber-600 dark:text-amber-400';
      case 'resolved': return 'text-green-600 dark:text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <XCircle className="h-4 w-4" />;
      case 'investigating': return <Activity className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <BarChart3 className="h-4 w-4" />;
      case 'data-quality': return <Database className="h-4 w-4" />;
      case 'infrastructure': return <Server className="h-4 w-4" />;
      case 'security': return <Target className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              Active Issues
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and investigate system issues across all platforms
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/investigate/performance')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Analysis
            </Button>
            <Button variant="outline" onClick={() => router.push('/investigate/correlation')}>
              <Target className="h-4 w-4 mr-2" />
              System Correlation
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Create Issue
            </Button>
          </div>
        </div>

        {/* Issue Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">Critical Issues</p>
                  <p className="text-2xl font-semibold text-red-700 dark:text-red-300">
                    {issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Active</p>
                  <p className="text-2xl font-semibold">
                    {issues.filter(i => i.status !== 'resolved').length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Affected Users</p>
                  <p className="text-2xl font-semibold">
                    {issues.filter(i => i.status !== 'resolved').reduce((sum, i) => sum + i.affectedUsers, 0).toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Suggestions</p>
                  <p className="text-2xl font-semibold">
                    {issues.filter(i => i.aiSuggestion && i.status !== 'resolved').length}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-80"
                  />
                </div>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  {severityOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  {statusOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  {categoryOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Issue Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">
              Active Issues ({issues.filter(i => i.status !== 'resolved').length})
            </TabsTrigger>
            <TabsTrigger value="critical">
              Critical ({issues.filter(i => i.severity === 'critical').length})
            </TabsTrigger>
            <TabsTrigger value="ai-suggested">
              AI Suggested ({issues.filter(i => i.aiSuggestion).length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Issues ({issues.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-4">
              {filteredIssues.map(issue => (
                <Card key={issue.id} className={cn(
                  "transition-all duration-200 hover:shadow-md",
                  issue.severity === 'critical' && "border-red-200 bg-red-50/50 dark:bg-red-950/10"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={cn("text-xs px-2", getSeverityColor(issue.severity))}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <div className={cn("flex items-center gap-1", getStatusColor(issue.status))}>
                          {getStatusIcon(issue.status)}
                          <span className="text-xs font-medium capitalize">{issue.status}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {issue.id}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {issue.aiSuggestion && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            <Brain className="h-3 w-3 mr-1" />
                            AI Suggestion
                          </Badge>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {issue.created}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {issue.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Metadata */}
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">System</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Server className="h-3 w-3" />
                            <span className="font-medium">{issue.system}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Category</p>
                          <div className="flex items-center gap-1 mt-1">
                            {getCategoryIcon(issue.category)}
                            <span className="font-medium capitalize">{issue.category}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Assignee</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            <span className="font-medium">{issue.assignee}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Affected Users</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Activity className="h-3 w-3" />
                            <span className="font-medium">{issue.affectedUsers.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Business Impact */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium text-muted-foreground">Business Impact:</span> {issue.businessImpact}
                        </p>
                      </div>

                      {/* AI Suggestion */}
                      {issue.aiSuggestion && (
                        <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-950/20">
                          <div className="flex items-start gap-3">
                            <Brain className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-green-900 dark:text-green-100">
                                  AI Recommendation
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {issue.aiSuggestion.confidence}% confidence
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {issue.aiSuggestion.estimatedResolution}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                                {issue.aiSuggestion.recommendation}
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Apply Solution
                                </Button>
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tags and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {issue.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Investigate
                          </Button>
                          <Button size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredIssues.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No issues found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('');
                    setSelectedSeverity('all');
                    setSelectedStatus('all');
                    setSelectedCategory('all');
                    setActiveTab('active');
                  }}>
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}