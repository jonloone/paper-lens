'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send,
  Sparkles,
  Database,
  Zap,
  Calendar,
  ArrowRight,
  ChevronRight,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2,
  GitBranch,
  Eye,
  Clock,
  TrendingUp,
  Brain,
  Code,
  Users,
  Lightbulb,
  AlertTriangle,
  PlayCircle,
  FileCode
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import TemplateLibrary from '@/components/pipeline-builder/TemplateLibrary';
import { templateManager } from '@/lib/services/template-manager';
import { patternDetectionService } from '@/lib/services/pattern-detection';
import { codeGenerationService } from '@/lib/services/code-generation';
import { PipelineTemplate, DiscoveredPattern } from '@/lib/templates/pipeline-templates/types';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  options?: Option[];
  data?: any;
  timestamp: Date;
}

interface Option {
  id: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
  value: any;
}

export default function IntelligentPipelineBuilder() {
  const router = useRouter();
  const [mode, setMode] = useState<'engineer' | 'guided' | 'templates' | 'patterns'>('engineer');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'intent' | 'data' | 'approach' | 'config' | 'preview'>('intent');
  const [pipelineConfig, setPipelineConfig] = useState<any>({});
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PipelineTemplate | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get templates and patterns
  const templates = templateManager.getAllTemplates();
  const patterns = patternDetectionService.getDiscoveredPatterns();
  const popularTemplates = templateManager.getPopularTemplates(3);
  
  // Mock data for quick actions
  const failedPipelines = [
    { id: 'p1', name: 'customer_daily_sync', error: 'Connection timeout', time: '5 min ago' },
    { id: 'p2', name: 'sales_aggregation', error: 'Out of memory', time: '2 hours ago' },
    { id: 'p3', name: 'inventory_update', error: 'Schema mismatch', time: 'Yesterday' }
  ];
  
  const performanceIssues = [
    { id: 'perf1', pipeline: 'order_processing', issue: 'Running 3x slower', savings: '2 hours/day' },
    { id: 'perf2', pipeline: 'user_activity_stream', issue: 'High memory usage', savings: '$50/day' }
  ];
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleTemplateSelect = (template: PipelineTemplate) => {
    setSelectedTemplate(template);
    setMode('guided');
    
    // Start guided flow with template
    setMessages([{
      id: Date.now().toString(),
      type: 'assistant',
      content: `Great choice! I'll help you configure the "${template.name}" template.`,
      timestamp: new Date()
    }]);
    
    // Show template parameters as a form
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: 'Please configure the template parameters below.',
        data: { template },
        timestamp: new Date()
      }]);
    }, 500);
  };
  
  const handlePatternConvert = (pattern: DiscoveredPattern) => {
    const template = patternDetectionService.convertPatternToTemplate(pattern.id);
    if (template) {
      setMessages([{
        id: Date.now().toString(),
        type: 'assistant',
        content: `Converting pattern "${pattern.pattern}" to a reusable template...`,
        timestamp: new Date()
      }]);
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'system',
          content: `✅ Template created successfully! You've saved ${pattern.potentialSavings.time} for future pipelines.`,
          timestamp: new Date()
        }]);
      }, 1000);
    }
  };
  
  const handleGenerateFromNL = () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    const result = codeGenerationService.generateFromNaturalLanguage({
      description: input,
      processingType: 'batch'
    });
    
    setTimeout(() => {
      setGeneratedCode(result);
      setMessages([{
        id: Date.now().toString(),
        type: 'assistant',
        content: result.explanation,
        timestamp: new Date()
      }]);
      
      if (result.code.length > 0) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'system',
          content: `Generated ${result.code.length} file(s) with ${result.confidence}% confidence`,
          data: { code: result.code },
          timestamp: new Date()
        }]);
      }
      
      setIsProcessing(false);
      setInput('');
    }, 1500);
  };
  
  const handleQuickDebug = (pipeline: any) => {
    router.push(`/investigate?pipeline=${pipeline.id}&error=${encodeURIComponent(pipeline.error)}`);
  };
  
  const handleOptimize = (issue: any) => {
    setMessages([{
      id: Date.now().toString(),
      type: 'assistant',
      content: `Analyzing ${issue.pipeline} for optimization opportunities...`,
      timestamp: new Date()
    }]);
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: `🚀 Found 3 optimizations that could save ${issue.savings}:
1. Add partitioning on date column
2. Increase batch size from 1000 to 10000
3. Enable adaptive query execution`,
        timestamp: new Date()
      }]);
    }, 2000);
  };
  
  return (
    <div className="max-w-7xl mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl">Intelligent Pipeline Builder</h1>
        <p className="text-muted-foreground">
          Build data pipelines 70% faster with templates, patterns, and AI assistance
        </p>
      </div>
      
      {/* Main Tabs */}
      <Tabs value={mode} onValueChange={setMode as any} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="engineer" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Engineer View
          </TabsTrigger>
          <TabsTrigger value="guided" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Guided Flow
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Patterns
          </TabsTrigger>
        </TabsList>
        
        {/* Engineer View */}
        <TabsContent value="engineer" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-6">
            {/* Failed Pipelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Failed Pipelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {failedPipelines.map(p => (
                  <div 
                    key={p.id}
                    className="p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => handleQuickDebug(p)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-red-500">{p.error}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{p.time}</span>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full" onClick={() => router.push('/investigate')}>
                  View All Issues
                </Button>
              </CardContent>
            </Card>
            
            {/* Performance Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Performance Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {performanceIssues.map(issue => (
                  <div 
                    key={issue.id}
                    className="p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => handleOptimize(issue)}
                  >
                    <div className="font-medium text-sm">{issue.pipeline}</div>
                    <div className="text-xs text-yellow-600">{issue.issue}</div>
                    <div className="text-xs text-green-600">Save {issue.savings}</div>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full">
                  Run Full Analysis
                </Button>
              </CardContent>
            </Card>
            
            {/* Discovered Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                  Discovered Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patterns.slice(0, 2).map(pattern => (
                  <div key={pattern.id} className="p-2 border rounded">
                    <div className="font-medium text-sm">{pattern.pattern}</div>
                    <div className="text-xs text-muted-foreground">
                      {pattern.occurrences} occurrences
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-1"
                      onClick={() => handlePatternConvert(pattern)}
                    >
                      Convert to Template
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          {/* Popular Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Popular Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {popularTemplates.map(template => (
                  <Card 
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {template.estimatedBuildTime}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary">{template.usageCount} uses</Badge>
                        <Badge variant="outline">{template.popularity}% match</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Natural Language Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Generate from Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Describe your pipeline... e.g., 'Sync customer data from Postgres to S3 daily'"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateFromNL()}
                  className="flex-1"
                />
                <Button onClick={handleGenerateFromNL} disabled={isProcessing}>
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Generate
                      <Sparkles className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              
              {generatedCode && (
                <Alert className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Generated {generatedCode.code.length} file(s) with {generatedCode.confidence}% confidence
                    <div className="mt-2 space-y-1">
                      {generatedCode.code.map((file: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <FileCode className="h-3 w-3" />
                          <span className="text-xs font-mono">{file.filename}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="mt-2" onClick={() => router.push('/builder')}>
                      Open in Visual Builder
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Guided Flow */}
        <TabsContent value="guided">
          <div className="grid grid-cols-12 gap-6">
            {/* Chat Interface */}
            <div className="col-span-8">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Pipeline Assistant</CardTitle>
                    <div className="flex items-center gap-2">
                      {['intent', 'data', 'approach', 'config', 'preview'].map((step, idx) => (
                        <React.Fragment key={step}>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                            currentStep === step ? "bg-primary text-primary-foreground" : 
                            idx < ['intent', 'data', 'approach', 'config', 'preview'].indexOf(currentStep) ? 
                            "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                          )}>
                            {idx + 1}
                          </div>
                          {idx < 4 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <Database className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-semibold mb-1">Start Building</h3>
                        <p className="text-sm text-muted-foreground">
                          Select a template or describe what you want to build
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className={cn(
                          "flex",
                          message.type === 'user' ? 'justify-end' : 'justify-start'
                        )}>
                          <div className={cn(
                            "max-w-[80%] rounded-lg p-3",
                            message.type === 'user' ? 'bg-primary text-primary-foreground' :
                            message.type === 'system' ? 'bg-muted' : 'bg-secondary'
                          )}>
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                            
                            {/* Template Configuration */}
                            {message.data?.template && (
                              <div className="mt-3 space-y-3 bg-background rounded p-3">
                                <h4 className="font-medium text-foreground">Configure Template</h4>
                                {message.data.template.parameters.map((param: any) => (
                                  <div key={param.id}>
                                    <label className="text-xs text-muted-foreground">{param.name}</label>
                                    {param.type === 'select' ? (
                                      <select className="w-full p-2 border rounded mt-1">
                                        {param.options?.map((opt: any) => (
                                          <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <Input 
                                        type={param.type === 'number' ? 'number' : 'text'}
                                        defaultValue={param.defaultValue}
                                        className="mt-1"
                                      />
                                    )}
                                  </div>
                                ))}
                                <Button className="w-full mt-3">Generate Pipeline</Button>
                              </div>
                            )}
                            
                            {/* Generated Code Display */}
                            {message.data?.code && (
                              <div className="mt-3 space-y-2">
                                {message.data.code.map((file: any, idx: number) => (
                                  <div key={idx} className="bg-background rounded p-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-mono text-foreground">
                                        {file.filename}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {file.language}
                                      </Badge>
                                    </div>
                                    <pre className="text-xs overflow-x-auto bg-muted p-2 rounded">
                                      <code>{file.content.slice(0, 200)}...</code>
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-secondary rounded-lg p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleGenerateFromNL()}
                        placeholder="Describe what you want to build..."
                        className="flex-1"
                      />
                      <Button onClick={handleGenerateFromNL} disabled={isProcessing}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Side Panel */}
            <div className="col-span-4 space-y-4">
              {/* Pipeline Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pipeline Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTemplate ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Template</div>
                        <div className="text-sm">{selectedTemplate.name}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Category</div>
                        <div className="text-sm capitalize">{selectedTemplate.category}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Build Time</div>
                        <div className="text-sm">{selectedTemplate.estimatedBuildTime}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your pipeline configuration will appear here
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {/* Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {templates.slice(0, 3).map(template => (
                      <button 
                        key={template.id}
                        className="w-full text-left p-2 hover:bg-muted rounded transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{template.icon}</span>
                          <div>
                            <div className="text-sm font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.estimatedBuildTime}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates">
          <TemplateLibrary 
            templates={templates}
            onSelectTemplate={handleTemplateSelect}
            showQuickActions={false}
          />
        </TabsContent>
        
        {/* Patterns Tab */}
        <TabsContent value="patterns">
          <div className="space-y-6">
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                I've analyzed your existing pipelines and found {patterns.length} patterns that could be converted to templates.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              {patterns.map(pattern => (
                <Card key={pattern.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{pattern.pattern}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {pattern.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Occurrences:</span>
                        <Badge>{pattern.occurrences}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Confidence:</span>
                        <Badge variant="outline">{pattern.confidence}%</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Time Savings:</span>
                        <Badge variant="secondary">{pattern.potentialSavings.time}</Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-1">Used in:</div>
                      <div className="flex flex-wrap gap-1">
                        {pattern.pipelines.slice(0, 3).map(p => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                        {pattern.pipelines.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{pattern.pipelines.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handlePatternConvert(pattern)}
                    >
                      Convert to Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}