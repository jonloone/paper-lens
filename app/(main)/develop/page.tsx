'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  GitBranch,
  FileCode,
  Package,
  Wrench,
  ArrowRight,
  Search,
  Clock,
  Zap,
  Database,
  Filter,
  ChevronRight,
  PlayCircle,
  AlertCircle,
  CheckCircle,
  Edit,
  Copy,
  Plus,
  Code,
  Eye,
  Split,
  Terminal,
  Layers,
  Sparkles,
  History,
  Bookmark
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MCPStatusSidebar } from '@/components/develop/MCPStatusSidebar';

interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'failed' | 'paused' | 'draft';
  lastModified: Date;
  owner: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'etl' | 'streaming' | 'ml' | 'quality';
  popularity: number;
  icon: React.ElementType;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  hotkey: string;
  color: string;
}

interface RecentWorkItem {
  id: string;
  name: string;
  type: 'pipeline' | 'query' | 'data-product';
  lastModified: Date;
  status: string;
}

type ViewMode = 'visual' | 'split' | 'code';

export default function UnifiedDevelopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pipelineId = searchParams.get('pipeline');
  const action = searchParams.get('action');
  
  const [intent, setIntent] = useState('');
  const [selectedPath, setSelectedPath] = useState<'fix' | 'template' | 'scratch' | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [preferredView, setPreferredView] = useState<ViewMode>('split');
  
  // Your existing pipelines (would come from API)
  const yourPipelines: Pipeline[] = [
    {
      id: '1',
      name: 'customer_etl',
      description: 'Daily customer data synchronization',
      status: 'failed',
      lastModified: new Date(Date.now() - 3600000),
      owner: 'You'
    },
    {
      id: '2',
      name: 'revenue_aggregation',
      description: 'Hourly revenue calculations',
      status: 'running',
      lastModified: new Date(Date.now() - 86400000),
      owner: 'You'
    },
    {
      id: '3',
      name: 'inventory_sync',
      description: 'Real-time inventory updates',
      status: 'paused',
      lastModified: new Date(Date.now() - 172800000),
      owner: 'You'
    }
  ];
  
  // Quick Actions - what engineers do most
  const quickActions: QuickAction[] = [
    {
      id: 'new-pipeline',
      title: 'New Pipeline',
      description: 'Create from pattern or blank',
      icon: GitBranch,
      action: '/develop/pipelines/studio?mode=build',
      hotkey: '⌘⇧P',
      color: 'blue'
    },
    {
      id: 'query-editor',
      title: 'Query Editor',
      description: 'Write and optimize SQL',
      icon: Terminal,
      action: '/develop/queries',
      hotkey: '⌘⇧Q',
      color: 'purple'
    },
    {
      id: 'data-product',
      title: 'Data Product',
      description: 'Define new data product',
      icon: Package,
      action: '/develop/data-products',
      hotkey: '⌘⇧D',
      color: 'green'
    }
  ];

  // Recent work for continuity
  const recentWork: RecentWorkItem[] = [
    {
      id: 'rw1',
      name: 'customer_revenue_analysis',
      type: 'query',
      lastModified: new Date(Date.now() - 1800000), // 30 min ago
      status: 'draft'
    },
    {
      id: 'rw2',
      name: 'product_catalog_etl',
      type: 'pipeline',
      lastModified: new Date(Date.now() - 3600000), // 1 hour ago
      status: 'running'
    },
    {
      id: 'rw3',
      name: 'customer_360_view',
      type: 'data-product',
      lastModified: new Date(Date.now() - 7200000), // 2 hours ago
      status: 'published'
    },
    {
      id: 'rw4',
      name: 'inventory_reconciliation',
      type: 'pipeline',
      lastModified: new Date(Date.now() - 86400000), // 1 day ago
      status: 'failed'
    }
  ];

  // Popular templates
  const templates: Template[] = [
    {
      id: 't1',
      name: 'Daily ETL',
      description: 'Standard extract, transform, load pattern',
      category: 'etl',
      popularity: 95,
      icon: Clock
    },
    {
      id: 't2',
      name: 'Stream Processing',
      description: 'Real-time event processing',
      category: 'streaming',
      popularity: 88,
      icon: Zap
    },
    {
      id: 't3',
      name: 'Data Quality Check',
      description: 'Automated validation pipeline',
      category: 'quality',
      popularity: 92,
      icon: Filter
    },
    {
      id: 't4',
      name: 'CDC Pipeline',
      description: 'Change data capture pattern',
      category: 'streaming',
      popularity: 76,
      icon: Database
    }
  ];
  
  useEffect(() => {
    // If coming with a pipeline ID, load it directly
    if (pipelineId) {
      const pipeline = yourPipelines.find(p => p.name === pipelineId);
      if (pipeline) {
        setSelectedPipeline(pipeline);
        setSelectedPath('fix');
        // Go directly to pipeline development with split view
        router.push(`/develop/pipelines/studio?id=${pipelineId}&mode=operations`);
      }
    }
  }, [pipelineId]);
  
  const handleIntentSubmit = () => {
    // Simple intent parsing (in production, would use NLP)
    const lowerIntent = intent.toLowerCase();
    if (lowerIntent.includes('fix') || lowerIntent.includes('broken') || lowerIntent.includes('failed')) {
      setSelectedPath('fix');
    } else if (lowerIntent.includes('template') || lowerIntent.includes('similar')) {
      setSelectedPath('template');
    } else {
      setSelectedPath('scratch');
      // Go directly to pipeline development
      router.push(`/develop/pipelines/studio?mode=build`);
    }
  };
  
  const handlePipelineSelect = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    // Go directly to pipeline development with context
    const mode = pipeline.status === 'failed' ? 'operations' : 'monitor';
    router.push(`/develop/pipelines/studio?id=${pipeline.name}&mode=${mode}`);
  };
  
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    // Go directly to pipeline development with template
    router.push(`/develop/pipelines/studio?template=${template.name}&mode=build`);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'published': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft': return <Edit className="h-4 w-4 text-gray-500" />;
      default: return <Edit className="h-4 w-4 text-gray-500" />;
    }
  };

  const getWorkTypeIcon = (type: string) => {
    switch (type) {
      case 'pipeline': return <GitBranch className="h-4 w-4" />;
      case 'query': return <Terminal className="h-4 w-4" />;
      case 'data-product': return <Package className="h-4 w-4" />;
      default: return <FileCode className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getActionColorClass = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
      purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
      green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };
  
  const ViewModeSelector = () => (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={preferredView === 'visual' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setPreferredView('visual')}
        className="h-8"
      >
        <Eye className="h-4 w-4 mr-1" />
        Visual
      </Button>
      <Button
        variant={preferredView === 'split' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setPreferredView('split')}
        className="h-8"
      >
        <Split className="h-4 w-4 mr-1" />
        Split
      </Button>
      <Button
        variant={preferredView === 'code' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setPreferredView('code')}
        className="h-8"
      >
        <Code className="h-4 w-4 mr-1" />
        Code
      </Button>
    </div>
  );
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light">Develop</h1>
              <p className="text-muted-foreground mt-1">
                Build pipelines, queries, and data products
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Default view:</span>
              <ViewModeSelector />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto p-8 space-y-8">
          
          {/* Quick Actions - Featured actions at top */}
          {!selectedPath && (
            <>
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    What engineers do most - keyboard shortcuts available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Card
                          key={action.id}
                          className={cn(
                            "cursor-pointer transition-colors border-2",
                            getActionColorClass(action.color)
                          )}
                          onClick={() => router.push(action.action)}
                        >
                          <CardContent className="pt-6">
                            <div className="text-center space-y-3">
                              <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto bg-white shadow-sm">
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="font-semibold">{action.title}</p>
                                <p className="text-sm opacity-80 mt-1">{action.description}</p>
                              </div>
                              <div className="text-xs font-mono bg-white/50 px-2 py-1 rounded">
                                {action.hotkey}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Work */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Continue Working On
                      </CardTitle>
                      <CardDescription>Pick up where you left off</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentWork.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (item.type === 'pipeline') {
                            const mode = item.status === 'failed' ? 'operations' : 'monitor';
                            router.push(`/develop/pipelines/studio?id=${item.name}&mode=${mode}`);
                          } else {
                            const routes = {
                              query: '/develop/queries',
                              'data-product': '/develop/data-products'
                            };
                            router.push(`${routes[item.type]}?item=${item.name}`);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            {getWorkTypeIcon(item.type)}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{item.type}</Badge>
                              <span>•</span>
                              <span>{formatTimeAgo(item.lastModified)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusIcon(item.status)}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Start from Pattern
                  </CardTitle>
                  <CardDescription>
                    Proven patterns for common data workflows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {templates.map(template => {
                      const Icon = template.icon;
                      return (
                        <Card
                          key={template.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Icon className="h-6 w-6 text-primary" />
                                <Badge variant="secondary" className="text-xs">
                                  {template.popularity}%
                                </Badge>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{template.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {template.description}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* AI-Powered Intent Input */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Or describe what you want to build</CardTitle>
                  <CardDescription>
                    AI will help route you to the right workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Fix my failed customer ETL pipeline, Build a daily revenue report, Create streaming pipeline..."
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleIntentSubmit()}
                      className="flex-1"
                    />
                    <Button onClick={handleIntentSubmit} disabled={!intent.trim()}>
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Fix Failed Pipeline Path */}
          {selectedPath === 'fix' && !selectedPipeline && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Select Pipeline to Fix</CardTitle>
                    <CardDescription>
                      Choose from your existing pipelines
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedPath(null)}
                  >
                    ← Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {yourPipelines.map(pipeline => (
                    <div
                      key={pipeline.id}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                        pipeline.status === 'failed' && "border-red-200 bg-red-50/50"
                      )}
                      onClick={() => handlePipelineSelect(pipeline)}
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(pipeline.status)}
                        <div>
                          <p className="font-medium">{pipeline.name}</p>
                          <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          Modified {new Date(pipeline.lastModified).toLocaleDateString()}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Template Selection Path */}
          {selectedPath === 'template' && !selectedTemplate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Choose a Template</CardTitle>
                    <CardDescription>
                      Start with a proven pipeline pattern
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedPath(null)}
                  >
                    ← Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {templates.map(template => {
                    const Icon = template.icon;
                    return (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Icon className="h-8 w-8 text-primary" />
                              <Badge variant="secondary" className="text-xs">
                                {template.popularity}% use this
                              </Badge>
                            </div>
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                              <span className="text-xs text-primary flex items-center">
                                Use Template
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
        
        {/* MCP Status Sidebar */}
        <div className="border-l bg-muted/20 p-6">
          <MCPStatusSidebar />
        </div>
      </div>
    </div>
  );
}