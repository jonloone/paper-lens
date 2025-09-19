'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Search,
  AlertCircle,
  Bot,
  GitBranch,
  Database,
  Activity,
  Clock,
  TrendingUp,
  ChevronRight,
  Lightbulb,
  Sparkles,
  XCircle,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  FileText,
  Terminal
} from 'lucide-react';
import { AgentOrchestrationService } from '@/lib/services/AgentOrchestrationService';
import { MCPOrchestrator } from '@/lib/services/MCPOrchestrator';
import { cn } from '@/lib/utils';

interface Investigation {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'resolved' | 'investigating';
  severity: 'critical' | 'high' | 'medium' | 'low';
  sources: string[];
  timestamp: Date;
  findings?: string[];
  recommendations?: string[];
}

interface SystemAlert {
  id: string;
  source: 'Airflow' | 'Trino' | 'DataHub' | 'Spark';
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  relatedPipeline?: string;
  actionable: boolean;
}

export default function InvestigatePage() {
  const [activeInvestigation, setActiveInvestigation] = useState<Investigation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [orchestrator] = useState(() => new AgentOrchestrationService());
  const [mcpOrchestrator] = useState(() => new MCPOrchestrator());
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [correlations, setCorrelations] = useState<any[]>([]);

  // Mock alerts that would come from real-time monitoring
  useEffect(() => {
    const mockAlerts: SystemAlert[] = [
      {
        id: '1',
        source: 'Airflow',
        type: 'error',
        message: 'DAG customer_etl failed - Column \'email\' cannot be resolved',
        timestamp: new Date(Date.now() - 5 * 60000),
        relatedPipeline: 'customer_etl',
        actionable: true
      },
      {
        id: '2',
        source: 'Trino',
        type: 'warning',
        message: 'Query latency exceeding threshold (>5s) for analytics.orders',
        timestamp: new Date(Date.now() - 15 * 60000),
        actionable: true
      },
      {
        id: '3',
        source: 'DataHub',
        type: 'info',
        message: 'Schema change detected in hive.default.customers',
        timestamp: new Date(Date.now() - 30 * 60000),
        actionable: false
      },
      {
        id: '4',
        source: 'Spark',
        type: 'warning',
        message: 'Memory usage at 85% for job spark-job-20231208-1200',
        timestamp: new Date(Date.now() - 45 * 60000),
        actionable: true
      }
    ];
    setAlerts(mockAlerts);
  }, []);

  const startInvestigation = async (alert?: SystemAlert) => {
    setIsInvestigating(true);
    
    // Create investigation from alert or search
    const investigation: Investigation = {
      id: Date.now().toString(),
      title: alert ? `Investigating: ${alert.message}` : `Investigating: ${searchQuery}`,
      description: alert ? alert.message : searchQuery,
      status: 'investigating',
      severity: alert?.type === 'error' ? 'critical' : 'medium',
      sources: alert ? [alert.source] : ['Multiple'],
      timestamp: new Date()
    };
    
    setActiveInvestigation(investigation);

    // Use CrewAI agents to investigate across tools
    try {
      // Simulate cross-tool correlation
      const findings = [
        'Schema mismatch detected between DataHub catalog and Trino tables',
        'Recent deployment changed column naming convention',
        'Pipeline customer_etl references old schema version',
        '3 downstream pipelines affected by this schema change'
      ];
      
      const recommendations = [
        'Update customer_etl DAG to use new column names',
        'Run schema validation before pipeline execution',
        'Add automated schema drift detection to CI/CD',
        'Consider implementing schema versioning'
      ];

      // Simulate correlation analysis
      const correlatedEvents = [
        {
          tool: 'DataHub',
          event: 'Schema updated for customers table',
          timestamp: new Date(Date.now() - 2 * 3600000),
          impact: 'high'
        },
        {
          tool: 'Airflow',
          event: 'customer_etl started failing after schema change',
          timestamp: new Date(Date.now() - 1.5 * 3600000),
          impact: 'critical'
        },
        {
          tool: 'Trino',
          event: 'Queries referencing old columns failing',
          timestamp: new Date(Date.now() - 1 * 3600000),
          impact: 'high'
        }
      ];
      
      setCorrelations(correlatedEvents);
      
      // Update investigation with findings
      setTimeout(() => {
        setActiveInvestigation({
          ...investigation,
          status: 'active',
          findings,
          recommendations
        });
        setIsInvestigating(false);
      }, 2000);
      
    } catch (error) {
      console.error('Investigation failed:', error);
      setIsInvestigating(false);
    }
  };

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-status-error" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-status-warning" />;
      case 'info':
        return <AlertCircle className="h-4 w-4 text-status-info" />;
    }
  };

  const getSeverityColor = (severity: Investigation['severity']) => {
    switch (severity) {
      case 'critical': return 'text-severity-critical';
      case 'high': return 'text-severity-high';
      case 'medium': return 'text-severity-medium';
      case 'low': return 'text-severity-low';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investigation Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered cross-tool investigation and root cause analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            CrewAI Enabled
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Investigation Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Describe the issue you're investigating..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    startInvestigation();
                  }
                }}
              />
            </div>
            <Button 
              onClick={() => startInvestigation()}
              disabled={!searchQuery || isInvestigating}
            >
              <Bot className="h-4 w-4 mr-2" />
              Investigate
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Alerts */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Active Alerts
              </CardTitle>
              <CardDescription>
                Real-time issues from all connected tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    "hover:bg-muted/50"
                  )}
                  onClick={() => startInvestigation(alert)}
                >
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {alert.source}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      {alert.actionable && (
                        <div className="flex items-center gap-1 text-xs text-status-info">
                          <Lightbulb className="h-3 w-3" />
                          <span>Click to investigate</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Common Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => {
                  setSearchQuery('Schema drift between DataHub and Trino');
                  startInvestigation();
                }}
              >
                <Database className="h-4 w-4 mr-2" />
                Schema Drift Detection
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => {
                  setSearchQuery('Pipeline failures in last 24 hours');
                  startInvestigation();
                }}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Pipeline Failure Analysis
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => {
                  setSearchQuery('Query performance degradation');
                  startInvestigation();
                }}
              >
                <Activity className="h-4 w-4 mr-2" />
                Performance Issues
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Investigation Results */}
        <div className="lg:col-span-2">
          {activeInvestigation ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {activeInvestigation.title}
                    </CardTitle>
                    <CardDescription>
                      Started {formatTimeAgo(activeInvestigation.timestamp)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(activeInvestigation.severity)}>
                      {activeInvestigation.severity}
                    </Badge>
                    <Badge variant="outline">
                      {activeInvestigation.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isInvestigating ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="relative">
                      <Bot className="h-12 w-12 text-primary animate-pulse" />
                      <div className="absolute inset-0 h-12 w-12 bg-primary/20 rounded-full animate-ping" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      CrewAI agents investigating across tools...
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue="findings" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="findings">Findings</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      <TabsTrigger value="actions">Actions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="findings" className="space-y-4">
                      {activeInvestigation.findings && (
                        <div className="space-y-3">
                          <h3 className="font-medium text-sm">Root Cause Analysis</h3>
                          {activeInvestigation.findings.map((finding, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-status-success mt-0.5" />
                              <p className="text-sm">{finding}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {activeInvestigation.recommendations && (
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="font-medium text-sm">AI Recommendations</h3>
                          {activeInvestigation.recommendations.map((rec, idx) => (
                            <Alert key={idx}>
                              <Lightbulb className="h-4 w-4" />
                              <AlertDescription>{rec}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="timeline" className="space-y-4">
                      <h3 className="font-medium text-sm">Correlated Events</h3>
                      <div className="space-y-3">
                        {correlations.map((event, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                event.impact === 'critical' ? 'bg-status-error' :
                                event.impact === 'high' ? 'bg-status-warning' :
                                'bg-status-info'
                              )} />
                              {idx < correlations.length - 1 && (
                                <div className="w-px h-12 bg-border" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {event.tool}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(event.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm">{event.event}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="actions" className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline">
                          <Terminal className="h-4 w-4 mr-2" />
                          View Logs
                        </Button>
                        <Button variant="outline">
                          <GitBranch className="h-4 w-4 mr-2" />
                          Fix Pipeline
                        </Button>
                        <Button variant="outline">
                          <Database className="h-4 w-4 mr-2" />
                          Update Schema
                        </Button>
                        <Button variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Create Ticket
                        </Button>
                      </div>
                      
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Automated Fix Available</AlertTitle>
                        <AlertDescription>
                          CrewAI can automatically generate and apply a fix for this issue.
                          <Button variant="link" className="p-0 h-auto ml-2">
                            <Play className="h-3 w-3 mr-1" />
                            Run Automated Fix
                          </Button>
                        </AlertDescription>
                      </Alert>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-24">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Start an Investigation</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Click on an alert or describe an issue to start investigating. 
                  CrewAI agents will analyze across all connected tools to find root causes.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}