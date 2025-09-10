'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  Clock,
  ArrowRight,
  Activity,
  GitBranch,
  Database,
  Search,
  PlayCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface FailedPipeline {
  id: string;
  name: string;
  error: string;
  failedAt: Date;
  impact: 'critical' | 'high' | 'medium' | 'low';
}

interface RecentWork {
  id: string;
  type: 'pipeline' | 'investigation' | 'catalog';
  title: string;
  subtitle: string;
  timestamp: Date;
  href: string;
  icon: React.ElementType;
}

export default function HomePage() {
  const router = useRouter();
  
  // These would come from user context/API
  const userName = "Alex";
  const failedPipelines: FailedPipeline[] = [
    {
      id: '1',
      name: 'customer_etl',
      error: 'Schema mismatch in source',
      failedAt: new Date(Date.now() - 1800000),
      impact: 'critical'
    },
    {
      id: '2',
      name: 'revenue_aggregation',
      error: 'Memory limit exceeded',
      failedAt: new Date(Date.now() - 7200000),
      impact: 'high'
    }
  ];
  
  const recentWork: RecentWork[] = [
    {
      id: '1',
      type: 'pipeline',
      title: 'Modified inventory_sync',
      subtitle: 'Added deduplication step',
      timestamp: new Date(Date.now() - 3600000),
      href: '/build?pipeline=inventory_sync',
      icon: GitBranch
    },
    {
      id: '2',
      type: 'investigation',
      title: 'Investigated slow queries',
      subtitle: 'Found missing indexes',
      timestamp: new Date(Date.now() - 14400000),
      href: '/investigate?id=slow-queries-123',
      icon: Search
    },
    {
      id: '3',
      type: 'catalog',
      title: 'Explored customer_360 dataset',
      subtitle: 'Reviewed schema changes',
      timestamp: new Date(Date.now() - 86400000),
      href: '/catalog?dataset=customer_360',
      icon: Database
    }
  ];
  
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };
  
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Personalized Header */}
      <div className="border-b bg-muted/30 px-8 py-6">
        <h1 className="text-2xl font-light">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {failedPipelines.length > 0 
            ? `You have ${failedPipelines.length} pipelines that need attention`
            : 'All systems operational'
          }
        </p>
      </div>
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Primary Action Area - What needs attention? */}
          {failedPipelines.length > 0 ? (
            <Card className="border-2 border-destructive/50 bg-destructive/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <CardTitle>Your Failed Pipelines</CardTitle>
                      <CardDescription>
                        These pipelines failed and may need your attention
                      </CardDescription>
                    </div>
                  </div>
                  <Button onClick={() => router.push('/operations')}>
                    View All Issues
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {failedPipelines.map(pipeline => (
                    <div
                      key={pipeline.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/operations?pipeline=${pipeline.name}`)}
                    >
                      <div className="flex items-center gap-4">
                        <XCircle className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="font-medium font-mono">{pipeline.name}</p>
                          <p className="text-sm text-muted-foreground">{pipeline.error}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={cn("text-xs", getImpactColor(pipeline.impact))}>
                          {pipeline.impact}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(pipeline.failedAt)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-green-500/50 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">All Systems Operational</p>
                      <p className="text-sm text-muted-foreground">
                        No failed pipelines or critical issues
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => router.push('/build')}>
                    Build New Pipeline
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Continue Where You Left Off */}
          {recentWork.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-4">Continue Where You Left Off</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentWork.map(work => {
                  const Icon = work.icon;
                  return (
                    <Card 
                      key={work.id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(work.href)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            work.type === 'pipeline' && "bg-blue-100",
                            work.type === 'investigation' && "bg-purple-100",
                            work.type === 'catalog' && "bg-green-100"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5",
                              work.type === 'pipeline' && "text-blue-600",
                              work.type === 'investigation' && "text-purple-600",
                              work.type === 'catalog' && "text-green-600"
                            )} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{work.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {work.subtitle}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {timeAgo(work.timestamp)}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Quick Actions - Only if no failures */}
          {failedPipelines.length === 0 && (
            <div>
              <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4 hover:bg-muted"
                  onClick={() => router.push('/operations')}
                >
                  <Activity className="h-5 w-5 mb-2" />
                  <span>Check Operations</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4 hover:bg-muted"
                  onClick={() => router.push('/build')}
                >
                  <GitBranch className="h-5 w-5 mb-2" />
                  <span>Build Pipeline</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4 hover:bg-muted"
                  onClick={() => router.push('/catalog')}
                >
                  <Database className="h-5 w-5 mb-2" />
                  <span>Browse Catalog</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4 hover:bg-muted"
                  onClick={() => router.push('/investigate')}
                >
                  <Search className="h-5 w-5 mb-2" />
                  <span>Investigate Issue</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}