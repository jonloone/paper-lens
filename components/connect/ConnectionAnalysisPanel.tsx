/**
 * Connection Analysis Panel Component
 * Integrates with Connection Analysis Crew for intelligent source evaluation
 */

import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Shield,
  Zap,
  Database,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Bot,
  Sparkles
} from 'lucide-react';
import { 
  crewAIService, 
  ConnectionAnalysisResult,
  ConnectionComparisonResult 
} from '@/lib/services/CrewAIService';

interface ConnectionSource {
  name: string;
  connection_type: string;
  connection_details: Record<string, any>;
  target_system?: string;
}

interface ConnectionAnalysisPanelProps {
  sources?: ConnectionSource[];
  onAnalysisComplete?: (result: ConnectionAnalysisResult | ConnectionComparisonResult) => void;
}

export function ConnectionAnalysisPanel({ 
  sources = [], 
  onAnalysisComplete 
}: ConnectionAnalysisPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ConnectionAnalysisResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ConnectionComparisonResult | null>(null);
  const [selectedSource, setSelectedSource] = useState<ConnectionSource | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const analyzeConnection = async (source: ConnectionSource) => {
    setAnalyzing(true);
    setSelectedSource(source);
    try {
      const result = await crewAIService.analyzeConnection({
        connection_type: source.connection_type,
        connection_details: source.connection_details,
        target_system: source.target_system,
        requirements: []
      });
      setAnalysisResult(result);
      setComparisonResult(null);
      if (onAnalysisComplete) onAnalysisComplete(result);
    } catch (error) {
      console.error('Connection analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const compareSources = async () => {
    if (sources.length < 2) return;
    
    setAnalyzing(true);
    try {
      const result = await crewAIService.compareConnections(sources);
      setComparisonResult(result);
      setAnalysisResult(null);
      if (onAnalysisComplete) onAnalysisComplete(result);
    } catch (error) {
      console.error('Connection comparison failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getFeasibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFeasibilityIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (score >= 0.6) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            AI-Powered Connection Analysis
          </CardTitle>
          <CardDescription>
            Let our specialized agents evaluate your data sources for compatibility, security, and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source Selection */}
          {sources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sources.map((source, idx) => (
                <Button
                  key={idx}
                  variant={selectedSource?.name === source.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => analyzeConnection(source)}
                  disabled={analyzing}
                >
                  <Database className="w-4 h-4 mr-1" />
                  {source.name}
                </Button>
              ))}
            </div>
          )}

          {/* Comparison Button */}
          {sources.length > 1 && (
            <Button
              onClick={compareSources}
              disabled={analyzing}
              className="w-full"
              variant="secondary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Compare All Sources
            </Button>
          )}

          {analyzing && (
            <Alert>
              <Bot className="w-4 h-4 animate-pulse" />
              <AlertDescription>
                AI agents are analyzing your connection requirements...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Connection Analysis: {selectedSource?.name}</span>
              <div className="flex items-center gap-2">
                {getFeasibilityIcon(analysisResult.connection_analysis.feasibility_score)}
                <span className={getFeasibilityColor(analysisResult.connection_analysis.feasibility_score)}>
                  {(analysisResult.connection_analysis.feasibility_score * 100).toFixed(0)}% Feasible
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="agents">Agent Analysis</TabsTrigger>
                <TabsTrigger value="recommendations">Actions</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Connection Type</p>
                    <p className="font-medium">{analysisResult.connection_analysis.connection_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Strategy</p>
                    <Badge variant="outline">
                      {analysisResult.connection_analysis.connection_strategy}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Consensus Confidence</p>
                    <Progress 
                      value={analysisResult.connection_analysis.consensus_confidence * 100} 
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="agents" className="space-y-4">
                {analysisResult.connection_analysis.agent_deliberations.map((deliberation, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {deliberation.agent === 'schema_agent' && <Database className="w-4 h-4" />}
                          {deliberation.agent === 'security_agent' && <Shield className="w-4 h-4" />}
                          {deliberation.agent === 'performance_agent' && <Zap className="w-4 h-4" />}
                          {deliberation.agent === 'compatibility_agent' && <CheckCircle className="w-4 h-4" />}
                          {deliberation.role}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {deliberation.model_used}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(deliberation.analysis).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">
                              {typeof value === 'object' ? JSON.stringify(value) : value}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-xs">
                            <span>Confidence: {(deliberation.confidence * 100).toFixed(0)}%</span>
                            <span>Latency: {deliberation.latency_ms}ms</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                {analysisResult.connection_analysis.recommendations.map((rec, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${
                          rec.priority === 'high' ? 'text-red-500' :
                          rec.priority === 'medium' ? 'text-yellow-500' :
                          'text-green-500'
                        }`}>
                          <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              rec.priority === 'high' ? 'destructive' :
                              rec.priority === 'medium' ? 'default' :
                              'secondary'
                            }>
                              {rec.priority}
                            </Badge>
                            <Badge variant="outline">{rec.category}</Badge>
                            <Badge variant="outline">{rec.effort} effort</Badge>
                          </div>
                          <p className="font-medium">{rec.action}</p>
                          <p className="text-sm text-muted-foreground mt-1">{rec.impact}</p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Cost</p>
                          <p className="text-2xl font-bold">
                            ${analysisResult.arbitron_metrics.total_cost.toFixed(4)}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Latency</p>
                          <p className="text-2xl font-bold">
                            {analysisResult.arbitron_metrics.total_latency}ms
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <Card>
          <CardHeader>
            <CardTitle>Source Comparison Results</CardTitle>
            <CardDescription>
              Analyzed {comparisonResult.comparison_results.source_count} sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ranked Sources */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Ranked Sources</h3>
              {comparisonResult.comparison_results.ranked_sources.map((source) => (
                <Card key={source.source_name}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{source.rank}
                        </div>
                        <div>
                          <p className="font-medium">{source.source_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {source.connection_type} • {source.strategy}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          source.recommendation === 'primary' ? 'default' :
                          source.recommendation === 'secondary' ? 'secondary' :
                          'outline'
                        }>
                          {source.recommendation}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getFeasibilityIcon(source.feasibility_score)}
                          <span className={getFeasibilityColor(source.feasibility_score)}>
                            {(source.feasibility_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Integration Effort */}
            <Alert>
              <Users className="w-4 h-4" />
              <AlertDescription>
                <strong>Recommended Approach:</strong> {comparisonResult.comparison_results.recommended_approach}
                <br />
                <strong>Estimated Effort:</strong> {comparisonResult.comparison_results.total_integration_effort.weeks} weeks 
                with {comparisonResult.comparison_results.total_integration_effort.team_size} team members
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}