'use client';

import React, { useState } from 'react';
import {
  Brain,
  Users,
  Sparkles,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  DollarSign,
  Clock,
  GitBranch,
  Info,
  Play,
  Pause,
  RotateCw,
  ChevronRight,
  MessageSquare,
  Target,
  Shield,
  Cpu,
  Database,
  BarChart3,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Types for consensus visualization
interface AgentDeliberation {
  agent_name: string;
  role: string;
  analysis: string;
  scores: Record<string, number>;
  confidence: number;
  reasoning: string[];
  tools_used: string[];
  model_used: string;
  latency_ms: number;
}

interface ConsensusResult {
  alert_id: string;
  individual_deliberations: AgentDeliberation[];
  consensus_scores: Record<string, number>;
  final_priority: number;
  confidence_level: number;
  disagreement_areas: string[];
  resolution_method: string;
}

interface ArbitronMetrics {
  total_cost: number;
  total_latency_ms: number;
  avg_latency_ms: number;
  cache_hits: number;
  budget_remaining: number;
  models_used: Record<string, number>;
}

export default function TestConsensusPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [deliberations, setDeliberations] = useState<ConsensusResult[]>([]);
  const [arbitronMetrics, setArbitronMetrics] = useState<ArbitronMetrics | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ConsensusResult | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1000); // ms between steps

  // Test alert for demonstration
  const testAlert = {
    id: 'demo-001',
    severity: 'critical',
    type: 'pipeline_failure',
    message: 'Customer ETL pipeline failed - data not refreshing',
    source: 'airflow',
    timestamp: new Date().toISOString(),
    metadata: {
      pipeline_name: 'customer_master_etl',
      last_successful_run: '2 hours ago',
      affected_tables: 5,
      downstream_consumers: 15
    }
  };

  // Simulate the consensus building process
  const runConsensusSimulation = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setDeliberations([]);
    setSelectedAlert(null);

    try {
      // Call the enhanced backend
      const response = await fetch('/api/enhanced-proxy/api/crews/system-health/deliberate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts: [testAlert] })
      });

      const data = await response.json();
      
      if (data.success && data.deliberations) {
        // Animate the deliberation process
        const result = data.deliberations[0];
        
        // Step through each agent's analysis
        for (let i = 0; i < result.individual_deliberations.length; i++) {
          setCurrentStep(i + 1);
          await new Promise(resolve => setTimeout(resolve, simulationSpeed));
        }
        
        // Show consensus building
        setCurrentStep(5);
        await new Promise(resolve => setTimeout(resolve, simulationSpeed));
        
        // Show final result
        setDeliberations([result]);
        setSelectedAlert(result);
        setArbitronMetrics(data.arbitron_metrics);
        setCurrentStep(6);
      }
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Get agent icon
  const getAgentIcon = (agentName: string) => {
    const icons: Record<string, React.ReactNode> = {
      urgency_agent: <Clock className="h-5 w-5" />,
      impact_agent: <TrendingUp className="h-5 w-5" />,
      cascade_agent: <GitBranch className="h-5 w-5" />,
      effort_agent: <Target className="h-5 w-5" />
    };
    return icons[agentName] || <Brain className="h-5 w-5" />;
  };

  // Get model badge color
  const getModelBadgeVariant = (model: string): any => {
    if (model.includes('llama3-405b')) return 'destructive';
    if (model.includes('llama3-70b')) return 'secondary';
    if (model.includes('mixtral')) return 'default';
    if (model.includes('mistral')) return 'outline';
    if (model.includes('cached')) return 'success';
    return 'default';
  };

  // Get tool icon
  const getToolIcon = (tool: string) => {
    const icons: Record<string, React.ReactNode> = {
      airflow: <Activity className="h-4 w-4" />,
      trino: <Database className="h-4 w-4" />,
      spark: <Zap className="h-4 w-4" />,
      datahub: <GitBranch className="h-4 w-4" />
    };
    return icons[tool] || <Cpu className="h-4 w-4" />;
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CrewAI Consensus Visualization</h2>
          <p className="text-muted-foreground">
            Watch how multiple agents deliberate and build consensus with Arbitron routing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimulationSpeed(s => Math.max(100, s - 200))}
            disabled={isRunning}
          >
            Faster
          </Button>
          <Badge variant="outline">{simulationSpeed}ms</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimulationSpeed(s => Math.min(3000, s + 200))}
            disabled={isRunning}
          >
            Slower
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button onClick={runConsensusSimulation} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Simulation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Simulation Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Consensus Building Process</CardTitle>
          <CardDescription>
            Step-by-step visualization of agent deliberation and consensus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {[
                { step: 0, label: 'Alert Received', icon: <AlertTriangle /> },
                { step: 1, label: 'Urgency Analysis', icon: <Clock /> },
                { step: 2, label: 'Impact Analysis', icon: <TrendingUp /> },
                { step: 3, label: 'Cascade Analysis', icon: <GitBranch /> },
                { step: 4, label: 'Effort Analysis', icon: <Target /> },
                { step: 5, label: 'Building Consensus', icon: <Users /> },
                { step: 6, label: 'Result', icon: <CheckCircle /> }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-all",
                    currentStep >= item.step 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {item.icon}
                  </div>
                  <span className="text-xs mt-2 text-center">{item.label}</span>
                </div>
              ))}
            </div>
            <Progress value={(currentStep / 6) * 100} />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-3 gap-6">
        {/* Alert Details */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Badge variant="destructive" className="mb-2">Critical</Badge>
                <p className="font-medium">{testAlert.message}</p>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono">{testAlert.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{testAlert.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source:</span>
                  <span>{testAlert.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pipeline:</span>
                  <span>{testAlert.metadata.pipeline_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Affected Tables:</span>
                  <span>{testAlert.metadata.affected_tables}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Downstream:</span>
                  <span>{testAlert.metadata.downstream_consumers} consumers</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Deliberations */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Agent Deliberations</CardTitle>
            <CardDescription>
              Individual agent analysis and scoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedAlert ? (
              <Tabs defaultValue="agents" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="agents">Agents</TabsTrigger>
                  <TabsTrigger value="consensus">Consensus</TabsTrigger>
                  <TabsTrigger value="arbitron">Arbitron</TabsTrigger>
                </TabsList>

                {/* Agents Tab */}
                <TabsContent value="agents" className="space-y-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {selectedAlert.individual_deliberations.map((delib, idx) => (
                        <Card key={idx} className={cn(
                          "transition-all",
                          currentStep > idx && "border-primary"
                        )}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getAgentIcon(delib.agent_name)}
                                <div>
                                  <p className="font-semibold">{delib.role}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={getModelBadgeVariant(delib.model_used)} className="text-xs">
                                      {delib.model_used}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {delib.latency_ms}ms
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {(delib.confidence * 100).toFixed(0)}% confidence
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm mb-3">{delib.analysis}</p>
                            
                            {/* Scores */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {Object.entries(delib.scores).map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <div className="text-lg font-bold">{value}</div>
                                  <div className="text-xs text-muted-foreground">{key}</div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Reasoning */}
                            <div className="space-y-1 mb-3">
                              {delib.reasoning.map((reason, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <ChevronRight className="h-3 w-3 mt-0.5 text-muted-foreground" />
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Tools Used */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Tools:</span>
                              {delib.tools_used.map(tool => (
                                <Badge key={tool} variant="secondary" className="gap-1">
                                  {getToolIcon(tool)}
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Consensus Tab */}
                <TabsContent value="consensus" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Consensus Scores</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(selectedAlert.consensus_scores).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                              <span className="font-medium">{value}</span>
                            </div>
                            <Progress value={value * 10} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Final Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary">
                            {selectedAlert.final_priority}
                          </div>
                          <p className="text-sm text-muted-foreground">Final Priority Score</p>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Confidence Level:</span>
                            <span className="font-medium">{(selectedAlert.confidence_level * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Resolution Method:</span>
                            <span className="font-medium text-xs">{selectedAlert.resolution_method}</span>
                          </div>
                        </div>
                        {selectedAlert.disagreement_areas.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Disagreement Areas:</p>
                              {selectedAlert.disagreement_areas.map((area, idx) => (
                                <Badge key={idx} variant="outline" className="mr-1 mb-1 text-xs">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Arbitron Tab */}
                <TabsContent value="arbitron" className="space-y-4">
                  {arbitronMetrics && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Model Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(arbitronMetrics.models_used).map(([model, count]) => (
                              <div key={model} className="flex items-center justify-between">
                                <Badge variant={getModelBadgeVariant(model)}>
                                  {model}
                                </Badge>
                                <span className="font-medium">{count} calls</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Performance Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Cost</p>
                              <p className="text-2xl font-bold">${arbitronMetrics.total_cost.toFixed(4)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Avg Latency</p>
                              <p className="text-2xl font-bold">{arbitronMetrics.avg_latency_ms}ms</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Cache Hits</p>
                              <p className="text-2xl font-bold">{arbitronMetrics.cache_hits}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Budget Remaining</p>
                              <p className="text-2xl font-bold">${arbitronMetrics.budget_remaining.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                Click "Run Simulation" to see agent deliberations
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How Consensus Works</AlertTitle>
        <AlertDescription>
          Four specialized agents independently analyze each alert using different LLM models selected by Arbitron 
          based on cost, speed, and accuracy requirements. Their individual scores are then combined using weighted 
          voting to produce a consensus priority score. Disagreements are resolved through the configured consensus 
          method, and the final result includes confidence levels and recommendations.
        </AlertDescription>
      </Alert>
    </div>
  );
}