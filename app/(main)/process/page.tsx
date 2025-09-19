'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExecutionMonitor } from '@/components/ExecutionMonitor';
import { DataLineageVisualization } from '@/components/DataLineageVisualization';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  ArrowRight, CheckCircle, AlertCircle, Clock,
  Plus, Settings, Eye, ExternalLink,
  Layers, Package, Activity, Shield,
  Database, GitBranch, Zap, FileText,
  Download, Upload, RefreshCw, Play,
  Info, AlertTriangle, ChevronRight,
  Sparkles, Code, BarChart, Users,
  ArrowDown, Check, X, Loader2,
  Rocket, Target, Cpu, Gauge,
  BookOpen, Lightbulb, Network
} from 'lucide-react';

interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
}

export default function ProcessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceId = searchParams?.get('source') || 'salesforce.contacts';
  const { connected } = useWebSocket();
  
  // State
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateParams, setTemplateParams] = useState<Record<string, any>>({});
  const [qualityThreshold, setQualityThreshold] = useState(85);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<PipelineExecution | null>(null);
  const [showLineage, setShowLineage] = useState(false);
  const [showTemplateParams, setShowTemplateParams] = useState(false);
  const [activeTab, setActiveTab] = useState('template');
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');

  // Fetch templates from API
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/pipelines/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
      if (data.templates?.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data.templates[0].id);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Execute pipeline
  const executePipeline = async () => {
    if (!selectedTemplate) return;
    
    setIsExecuting(true);
    
    try {
      // First create pipeline from template
      const createResponse = await fetch('/api/pipelines/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          parameters: {
            ...templateParams,
            name: pipelineName || `Pipeline from ${selectedTemplate}`,
          }
        })
      });
      
      const pipeline = await createResponse.json();
      
      // Then execute the pipeline
      const execResponse = await fetch('/api/pipelines/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId: pipeline.id,
          mode: 'sample',
          parameters: templateParams
        })
      });
      
      const execution = await execResponse.json();
      
      setCurrentExecution({
        id: execution.executionId,
        pipelineId: pipeline.id,
        status: execution.status,
        progress: 0,
        startTime: new Date(execution.startTime)
      });
      
      // Simulate completion after delay
      setTimeout(() => {
        setIsExecuting(false);
        setActiveTab('monitor');
      }, 5000);
      
    } catch (error) {
      console.error('Error executing pipeline:', error);
      setIsExecuting(false);
    }
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  // Template icons mapping
  const templateIcons: Record<string, any> = {
    'etl': Database,
    'ml': Cpu,
    'streaming': Zap,
    'quality': Shield,
    'migration': RefreshCw,
    'analytics': BarChart
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Process</h2>
          <p className="text-muted-foreground">
            Create quality-first pipelines from proven templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowLineage(true)}
            disabled={!currentTemplate}
          >
            <Network className="h-4 w-4 mr-2" />
            View Lineage
          </Button>
          <Button 
            onClick={executePipeline} 
            disabled={isExecuting || !selectedTemplate || !pipelineName}
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Execute Pipeline
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Pipeline Builder */}
        <div className="col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Pipeline Configuration
              </CardTitle>
              <CardDescription>
                Select a template and configure your data pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="template">Template</TabsTrigger>
                  <TabsTrigger value="configure">Configure</TabsTrigger>
                  <TabsTrigger value="quality">Quality</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                  <TabsTrigger value="monitor">Monitor</TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Select Pipeline Template</h3>
                      <Badge variant="outline">{templates.length} templates</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {templates.map((template) => {
                        const Icon = templateIcons[template.category] || Database;
                        const isSelected = selectedTemplate === template.id;
                        
                        return (
                          <Card 
                            key={template.id}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-md",
                              isSelected && "border-primary ring-2 ring-primary/20"
                            )}
                            onClick={() => {
                              setSelectedTemplate(template.id);
                              setPipelineName(template.name);
                              setPipelineDescription(template.description);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  isSelected ? "bg-primary/10" : "bg-muted"
                                )}>
                                  <Icon className={cn(
                                    "h-5 w-5",
                                    isSelected && "text-primary"
                                  )} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{template.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {template.description}
                                  </p>
                                  <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1">
                                      <Gauge className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {template.difficulty}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {template.estimatedTime}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {template.tags?.slice(0, 3).map((tag: string) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {currentTemplate && (
                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Best Practice:</strong> {currentTemplate.bestPractices?.[0]}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="configure" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pipeline-name">Pipeline Name</Label>
                      <Input
                        id="pipeline-name"
                        value={pipelineName}
                        onChange={(e) => setPipelineName(e.target.value)}
                        placeholder="Enter pipeline name"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pipeline-desc">Description</Label>
                      <Textarea
                        id="pipeline-desc"
                        value={pipelineDescription}
                        onChange={(e) => setPipelineDescription(e.target.value)}
                        placeholder="Describe your pipeline"
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    {currentTemplate?.parameters && (
                      <>
                        <Separator />
                        <h3 className="text-sm font-medium">Template Parameters</h3>
                        {currentTemplate.parameters.map((param: any) => (
                          <div key={param.name}>
                            <Label htmlFor={param.name}>
                              {param.label}
                              {param.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {param.description}
                            </p>
                            
                            {param.type === 'select' ? (
                              <Select
                                value={templateParams[param.name] || param.default}
                                onValueChange={(value) => 
                                  setTemplateParams(prev => ({ ...prev, [param.name]: value }))
                                }
                              >
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {param.options?.map((option: any) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : param.type === 'boolean' ? (
                              <div className="flex items-center space-x-2 mt-2">
                                <Switch
                                  id={param.name}
                                  checked={templateParams[param.name] || param.default || false}
                                  onCheckedChange={(checked) =>
                                    setTemplateParams(prev => ({ ...prev, [param.name]: checked }))
                                  }
                                />
                                <Label htmlFor={param.name} className="text-sm">
                                  {param.label}
                                </Label>
                              </div>
                            ) : param.type === 'number' ? (
                              <Input
                                type="number"
                                id={param.name}
                                value={templateParams[param.name] || param.default || ''}
                                onChange={(e) =>
                                  setTemplateParams(prev => ({ 
                                    ...prev, 
                                    [param.name]: parseInt(e.target.value) 
                                  }))
                                }
                                min={param.validation?.min}
                                max={param.validation?.max}
                                className="mt-2"
                              />
                            ) : (
                              <Input
                                id={param.name}
                                value={templateParams[param.name] || param.default || ''}
                                onChange={(e) =>
                                  setTemplateParams(prev => ({ ...prev, [param.name]: e.target.value }))
                                }
                                className="mt-2"
                              />
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="quality" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="quality-threshold">Global Quality Threshold</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Input
                          id="quality-threshold"
                          type="number"
                          value={qualityThreshold}
                          onChange={(e) => {
                            const value = Math.min(100, Math.max(50, parseInt(e.target.value) || 85));
                            setQualityThreshold(value);
                          }}
                          min={50}
                          max={100}
                          step={5}
                          className="w-24"
                        />
                        <Progress value={qualityThreshold} className="flex-1" />
                        <span className="text-sm text-muted-foreground">{qualityThreshold}%</span>
                      </div>
                    </div>

                    <Separator />

                    {currentTemplate?.config?.qualityRules && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Quality Rules</h3>
                        {currentTemplate.config.qualityRules.map((rule: any, idx: number) => (
                          <Card key={idx}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Shield className={cn(
                                      "h-4 w-4",
                                      rule.action === 'block' ? "text-red-500" :
                                      rule.action === 'warn' ? "text-yellow-500" : "text-blue-500"
                                    )} />
                                    <span className="font-medium text-sm capitalize">
                                      {rule.dimension} Check
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Threshold: {rule.threshold}% • Action: {rule.action}
                                  </p>
                                </div>
                                <Badge variant={
                                  rule.action === 'block' ? 'destructive' :
                                  rule.action === 'warn' ? 'default' : 'secondary'
                                }>
                                  {rule.action}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="review" className="space-y-4 mt-6">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Pipeline configuration is complete and ready for execution.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Pipeline Name</span>
                      <span className="text-sm">{pipelineName || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Template</span>
                      <span className="text-sm">{currentTemplate?.name || 'Not selected'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Quality Threshold</span>
                      <span className="text-sm">{qualityThreshold}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Estimated Time</span>
                      <span className="text-sm">{currentTemplate?.estimatedTime || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Parameters Configured</span>
                      <span className="text-sm">
                        {Object.keys(templateParams).length} of {currentTemplate?.parameters?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1" 
                      onClick={executePipeline}
                      disabled={!pipelineName || !selectedTemplate}
                    >
                      <Rocket className="h-4 w-4 mr-2" />
                      Execute Pipeline
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="monitor" className="mt-6">
                  {currentExecution ? (
                    <ExecutionMonitor 
                      executionId={currentExecution.id}
                      pipelineId={currentExecution.pipelineId}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pipeline execution in progress</p>
                      <p className="text-sm mt-2">Execute a pipeline to see real-time monitoring</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right: Info & Actions */}
        <div className="col-span-4 space-y-6">
          {/* WebSocket Status */}
          {activeTab === 'monitor' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Real-time Updates</span>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      connected ? "bg-green-500" : "bg-red-500"
                    )} />
                    <span className="text-xs text-muted-foreground">
                      {connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Template Info */}
          {currentTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Template Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Category</span>
                  <p className="text-sm font-medium capitalize">{currentTemplate.category}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Difficulty</span>
                  <p className="text-sm font-medium capitalize">{currentTemplate.difficulty}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Estimated Time</span>
                  <p className="text-sm font-medium">{currentTemplate.estimatedTime}</p>
                </div>
                {currentTemplate.tags && (
                  <div>
                    <span className="text-xs text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentTemplate.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Best Practices */}
          {currentTemplate?.bestPractices && currentTemplate.bestPractices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <ul className="space-y-2">
                    {currentTemplate.bestPractices.map((practice: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs">{practice}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setShowLineage(true)}
                disabled={!currentTemplate}
              >
                <Network className="h-4 w-4 mr-2" />
                View Data Lineage
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview Sample Data
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Run Quality Assessment
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push('/monitor')}
              >
                <Activity className="h-4 w-4 mr-2" />
                Go to Monitoring
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Lineage Modal */}
      <Dialog open={showLineage} onOpenChange={setShowLineage}>
        <DialogContent className="max-w-7xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Data Lineage</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <DataLineageVisualization 
              entityId={selectedTemplate ? `pipeline-${selectedTemplate}` : undefined}
              height="calc(70vh - 100px)"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}