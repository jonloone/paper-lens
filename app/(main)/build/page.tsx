'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Box,
  Sparkles,
  FileText,
  ArrowRight,
  Search,
  Command,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react';
import { detectIntent } from '@/lib/api/kag-client';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  type: 'source' | 'entity' | 'solution';
  includes: string[];
  estimatedTime: string;
  popularity: number;
}

export default function BuildPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [mode, setMode] = useState<'natural' | 'command' | 'search'>('natural');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const templates: Template[] = [
    {
      id: 'customer-360',
      name: 'Customer 360',
      description: 'Unified customer profile from multiple sources',
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      type: 'entity',
      includes: ['CRM integration', 'Transaction history', 'Entity resolution', 'SCD Type 2'],
      estimatedTime: '~15 min',
      popularity: 95
    },
    {
      id: 'mysql-connector',
      name: 'MySQL Source',
      description: 'Connect to MySQL database with CDC',
      icon: Zap,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      type: 'source',
      includes: ['Connection pooling', 'Incremental sync', 'Schema detection', 'Data validation'],
      estimatedTime: '~5 min',
      popularity: 88
    },
    {
      id: 'churn-model',
      name: 'Churn Prediction',
      description: 'Predict customer churn with ML-ready features',
      icon: Sparkles,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      type: 'solution',
      includes: ['Feature engineering', 'Risk scoring', 'Dashboard integration', 'Alerting'],
      estimatedTime: '~20 min',
      popularity: 82
    },
    {
      id: 'data-quality',
      name: 'Data Quality Suite',
      description: 'Automated quality monitoring and validation',
      icon: CheckCircle2,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      type: 'solution',
      includes: ['Great Expectations', 'Automated tests', 'Anomaly detection', 'Reports'],
      estimatedTime: '~10 min',
      popularity: 79
    }
  ];

  const quickActions = [
    { id: 'source', icon: Zap, title: 'Connect Source', type: 'source' as const },
    { id: 'entity', icon: Box, title: 'Model Entity', type: 'entity' as const },
    { id: 'solution', icon: Sparkles, title: 'Solve Problem', type: 'solution' as const },
    { id: 'template', icon: FileText, title: 'Browse All', type: 'template' as const }
  ];

  const recentActivity = [
    { name: 'customer_events', status: 'draft', time: '2 hours ago' },
    { name: 'order_pipeline', status: 'deployed', time: '1 day ago' },
    { name: 'churn_model', status: 'deployed', time: '3 days ago' }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('command-input')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setSelectedTemplate(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartBuilding = async () => {
    if (selectedTemplate) {
      const params = new URLSearchParams({
        type: selectedTemplate.type,
        template: selectedTemplate.id
      });
      router.push(`/build/new/define?${params.toString()}`);
      return;
    }

    if (!input.trim()) {
      router.push('/build/new/define');
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await detectIntent({
        description: input,
        context: {}
      });

      const params = new URLSearchParams({
        input: input,
        type: result.detected_type,
        confidence: result.confidence.toString(),
        reasoning: JSON.stringify(result.reasoning)
      });
      router.push(`/build/new/define?${params.toString()}`);
    } catch (error) {
      console.error('Failed to detect intent:', error);
      const params = new URLSearchParams({ input: input });
      router.push(`/build/new/define?${params.toString()}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickAction = (type: string) => {
    if (type === 'template') {
      document.getElementById('templates-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const params = new URLSearchParams({ type: type });
    router.push(`/build/new/define?${params.toString()}`);
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setInput(template.name);
  };

  return (
    <div className="flex-1">
      {/* Compact Header */}
      <div className="border-b bg-gradient-to-r from-background to-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Build a Data Product</h1>
              <p className="text-muted-foreground mt-1">One intelligent workflow that adapts to your needs</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)}>
                <Command className="w-4 h-4 mr-2" />
                Shortcuts
              </Button>
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                127 Active
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Command Bar */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {mode === 'command' && <Command className="w-5 h-5" />}
              {mode === 'search' && <Search className="w-5 h-5" />}
              {mode === 'natural' && <Sparkles className="w-5 h-5" />}
            </div>

            <input
              id="command-input"
              type="text"
              value={input}
              onChange={(e) => {
                const value = e.target.value;
                setInput(value);
                if (value.startsWith('/')) setMode('command');
                else if (value.startsWith('@')) setMode('search');
                else setMode('natural');
              }}
              placeholder={
                mode === 'command' ? 'Type a command...' :
                mode === 'search' ? 'Search products...' :
                'Describe what to build, or type / for commands, @ to search'
              }
              className="w-full pl-12 pr-36 py-3 text-base border-2 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              disabled={isAnalyzing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleStartBuilding();
                }
              }}
            />

            <Button
              size="lg"
              onClick={handleStartBuilding}
              disabled={isAnalyzing}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {isAnalyzing ? 'Analyzing...' : selectedTemplate ? 'Use Template' : 'Start Building'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {selectedTemplate && (
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", selectedTemplate.bgColor)}>
                  <selectedTemplate.icon className={cn("w-4 h-4", selectedTemplate.iconColor)} />
                </div>
                <div>
                  <div className="font-medium text-sm">Template selected: {selectedTemplate.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedTemplate.estimatedTime} setup time</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedTemplate(null); setInput(''); }}>
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Start</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.type)}
                  className="p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <Icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-medium text-sm">{action.title}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Templates - Takes 2 columns */}
          <div className="col-span-2 space-y-4" id="templates-section">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Popular Templates</h2>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Most Used
              </Badge>
            </div>

            <div className="grid gap-3">
              {templates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <Card
                    key={template.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all",
                      isSelected ? "border-2 border-primary bg-primary/5 shadow-md" : "hover:border-primary/50 hover:shadow-sm"
                    )}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", template.bgColor)}>
                        <Icon className={cn("w-6 h-6", template.iconColor)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold">{template.name}</h3>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{template.description}</p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {template.estimatedTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {template.popularity}% success
                          </span>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs font-medium mb-2">Includes:</div>
                            <div className="flex flex-wrap gap-1">
                              {template.includes.map((item) => (
                                <Badge key={item} variant="secondary" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recent Activity - Takes 1 column */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</h2>

            <Card className="p-4 space-y-3">
              {recentActivity.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.time}</div>
                  </div>
                  <Badge variant={item.status === 'deployed' ? 'default' : 'outline'} className="text-xs">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </Card>

            <Card className="p-4 bg-muted/30">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">~12 min</div>
                  <div className="text-xs text-muted-foreground">Avg Build Time</div>
                </div>
                <div className="pt-3 border-t text-center">
                  <div className="text-2xl font-bold text-primary">127</div>
                  <div className="text-xs text-muted-foreground">Active Products</div>
                </div>
              </div>
            </Card>
          </div>

        </div>

      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <Card className="max-w-md w-full m-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Focus command bar</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘K</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build immediately</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘↵</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘/</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cancel/close</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
