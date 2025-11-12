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
import { useDensitySpacing } from '@/contexts/DensityContext';

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
  // Density-aware spacing
  const spacing = useDensitySpacing();

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
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg" role="radiogroup" aria-label="Editor view mode">
      <Button
        variant={preferredView === 'visual' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setPreferredView('visual')}
        className="h-8 [transition:var(--transition-button)]"
        role="radio"
        aria-checked={preferredView === 'visual'}
        aria-label="Visual editor mode"
      >
        <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
        Visual
      </Button>
      <Button
        variant={preferredView === 'split' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setPreferredView('split')}
        className="h-8 [transition:var(--transition-button)]"
        role="radio"
        aria-checked={preferredView === 'split'}
        aria-label="Split view mode"
      >
        <Split className="h-4 w-4 mr-1" aria-hidden="true" />
        Split
      </Button>
      <Button
        variant={preferredView === 'code' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setPreferredView('code')}
        className="h-8 [transition:var(--transition-button)]"
        role="radio"
        aria-checked={preferredView === 'code'}
        aria-label="Code editor mode"
      >
        <Code className="h-4 w-4 mr-1" aria-hidden="true" />
        Code
      </Button>
    </div>
  );
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-muted/30" role="banner">
        <div className={cn("max-w-7xl mx-auto", spacing.section)}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Develop</h1>
              <p className="text-muted-foreground/85 mt-2">
                Build pipelines, queries, and data products
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground/85">Default view:</span>
              <ViewModeSelector />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Main Content */}
        <main className="flex-1" role="main">
          <div className={cn("max-w-7xl mx-auto", spacing.section, spacing.stackRelaxed)}>
          
          {/* Quick Actions - Featured actions at top */}
          {!selectedPath && (
            <>
              {/* Quick Actions */}
              <Card elevation="base" role="region" aria-labelledby="quick-actions-heading">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" id="quick-actions-heading">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    What engineers do most - keyboard shortcuts available
                  </CardDescription>
                </CardHeader>
                <CardContent className={spacing.card}>
                  <div className={cn("grid grid-cols-3", spacing.grid)} role="list" aria-label="Quick action shortcuts">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Card
                          key={action.id}
                          elevation="base"
                          interactive
                          className={cn(
                            "cursor-pointer border-2",
                            getActionColorClass(action.color)
                          )}
                          onClick={() => router.push(action.action)}
                          tabIndex={0}
                          role="button"
                          aria-label={`${action.title} - ${action.description}. Keyboard shortcut: ${action.hotkey}`}
                        >
                          <CardContent className={spacing.card}>
                            <div className="text-center space-y-3">
                              <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto bg-white [box-shadow:var(--elevation-1)]">
                                <Icon className="h-6 w-6" aria-hidden="true" />
                              </div>
                              <div>
                                <p className="font-semibold">{action.title}</p>
                                <p className="text-sm opacity-85 mt-1">{action.description}</p>
                              </div>
                              <div className="text-xs font-mono bg-white/50 px-2 py-1 rounded" aria-label={`Keyboard shortcut: ${action.hotkey}`}>
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
              <Card elevation="base" role="region" aria-labelledby="recent-work-heading">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2" id="recent-work-heading">
                        <History className="h-5 w-5" aria-hidden="true" />
                        Continue Working On
                      </CardTitle>
                      <CardDescription>Pick up where you left off</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="[transition:var(--transition-button)]" aria-label="View all recent work">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className={spacing.card}>
                  <div className={spacing.stackCompact} role="list" aria-label="Recent work items">
                    {recentWork.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between border rounded-lg hover:bg-muted/50 cursor-pointer [transition:var(--transition-colors)]",
                          spacing.cardCompact
                        )}
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
                        tabIndex={0}
                        role="button"
                        aria-label={`Continue working on ${item.name} ${item.type}, last modified ${formatTimeAgo(item.lastModified)}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center" aria-hidden="true">
                            {getWorkTypeIcon(item.type)}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground/85">
                              <Badge variant="outline" className="text-xs">{item.type}</Badge>
                              <span>•</span>
                              <span>{formatTimeAgo(item.lastModified)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusIcon(item.status)}
                          <ChevronRight className="h-4 w-4 text-muted-foreground/85" aria-hidden="true" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Gallery */}
              <Card elevation="base" role="region" aria-labelledby="pattern-gallery-heading">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" id="pattern-gallery-heading">
                    <Layers className="h-5 w-5" aria-hidden="true" />
                    Start from Pattern
                  </CardTitle>
                  <CardDescription>
                    Proven patterns for common data workflows
                  </CardDescription>
                </CardHeader>
                <CardContent className={spacing.card}>
                  <div className={cn("grid grid-cols-2 md:grid-cols-4", spacing.grid)} role="list" aria-label="Pipeline templates">
                    {templates.map(template => {
                      const Icon = template.icon;
                      return (
                        <Card
                          key={template.id}
                          elevation="base"
                          interactive
                          className="cursor-pointer"
                          onClick={() => handleTemplateSelect(template)}
                          tabIndex={0}
                          role="button"
                          aria-label={`${template.name} template - ${template.description}. ${template.popularity}% popularity`}
                        >
                          <CardContent className={spacing.cardCompact}>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                                <Badge variant="secondary" className="text-xs" aria-label={`${template.popularity}% of users use this template`}>
                                  {template.popularity}%
                                </Badge>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{template.name}</p>
                                <p className="text-xs text-muted-foreground/85 mt-1">
                                  {template.description}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                                <ChevronRight className="h-3 w-3 text-muted-foreground/85" aria-hidden="true" />
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
              <Card elevation="subtle" surface="bordered" className="border-dashed" role="region" aria-labelledby="intent-input-heading">
                <CardHeader>
                  <CardTitle className="text-base" id="intent-input-heading">Or describe what you want to build</CardTitle>
                  <CardDescription>
                    AI will help route you to the right workspace
                  </CardDescription>
                </CardHeader>
                <CardContent className={spacing.card}>
                  <div className={cn("flex", spacing.stack)}>
                    <Input
                      placeholder="e.g., Fix my failed customer ETL pipeline, Build a daily revenue report, Create streaming pipeline..."
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleIntentSubmit()}
                      className="flex-1"
                      aria-label="Describe what you want to build"
                    />
                    <Button
                      onClick={handleIntentSubmit}
                      disabled={!intent.trim()}
                      className="[transition:var(--transition-button)]"
                      aria-label="Get started with AI assistance"
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Fix Failed Pipeline Path */}
          {selectedPath === 'fix' && !selectedPipeline && (
            <Card elevation="base" role="region" aria-labelledby="fix-pipeline-heading">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle id="fix-pipeline-heading">Select Pipeline to Fix</CardTitle>
                    <CardDescription>
                      Choose from your existing pipelines
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPath(null)}
                    className="[transition:var(--transition-button)]"
                    aria-label="Go back to main menu"
                  >
                    ← Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={spacing.card}>
                <div className={spacing.stackCompact} role="list" aria-label="Your pipelines">
                  {yourPipelines.map(pipeline => (
                    <div
                      key={pipeline.id}
                      className={cn(
                        "flex items-center justify-between border rounded-lg hover:bg-muted/50 cursor-pointer [transition:var(--transition-colors)]",
                        spacing.cardCompact,
                        pipeline.status === 'failed' && "border-red-200 bg-red-50/50"
                      )}
                      onClick={() => handlePipelineSelect(pipeline)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${pipeline.name} - ${pipeline.description}. Status: ${pipeline.status}`}
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(pipeline.status)}
                        <div>
                          <p className="font-medium">{pipeline.name}</p>
                          <p className="text-sm text-muted-foreground/85">{pipeline.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground/85">
                          Modified {new Date(pipeline.lastModified).toLocaleDateString()}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/85" aria-hidden="true" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Template Selection Path */}
          {selectedPath === 'template' && !selectedTemplate && (
            <Card elevation="base" role="region" aria-labelledby="template-selection-heading">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle id="template-selection-heading">Choose a Template</CardTitle>
                    <CardDescription>
                      Start with a proven pipeline pattern
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPath(null)}
                    className="[transition:var(--transition-button)]"
                    aria-label="Go back to main menu"
                  >
                    ← Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={spacing.card}>
                <div className={cn("grid grid-cols-1 md:grid-cols-3", spacing.grid)} role="list" aria-label="Pipeline templates">
                  {templates.map(template => {
                    const Icon = template.icon;
                    return (
                      <Card
                        key={template.id}
                        elevation="base"
                        interactive
                        className="cursor-pointer"
                        onClick={() => handleTemplateSelect(template)}
                        tabIndex={0}
                        role="button"
                        aria-label={`${template.name} template - ${template.description}. ${template.popularity}% of users use this`}
                      >
                        <CardContent className={spacing.card}>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
                              <Badge variant="secondary" className="text-xs" aria-label={`${template.popularity}% of users use this template`}>
                                {template.popularity}% use this
                              </Badge>
                            </div>
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-sm text-muted-foreground/85 mt-1">
                                {template.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                              <span className="text-xs text-primary flex items-center">
                                Use Template
                                <ChevronRight className="h-3 w-3 ml-1" aria-hidden="true" />
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
        </main>

        {/* MCP Status Sidebar */}
        <div className="border-l bg-muted/20 p-6">
          <MCPStatusSidebar />
        </div>
      </div>
    </div>
  );
}