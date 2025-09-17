'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { crewAIService, type PrioritizedAlert } from '@/lib/services/CrewAIService';
import { cn } from '@/lib/utils';

interface PrioritizedAlertsProps {
  className?: string;
}

export function PrioritizedAlerts({ className }: PrioritizedAlertsProps) {
  const [alerts, setAlerts] = useState<PrioritizedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crewStatus, setCrewStatus] = useState<'active' | 'processing' | 'error'>('active');
  const [arbitronMetrics, setArbitronMetrics] = useState<any>(null);

  // Fetch and prioritize alerts
  const fetchAlerts = async () => {
    setLoading(true);
    setCrewStatus('processing');
    
    try {
      // Mock raw alerts (in production, fetch from your monitoring system)
      const rawAlerts = [
        {
          id: 'alert-001',
          severity: 'critical' as const,
          type: 'pipeline_failure',
          message: 'Customer ETL pipeline failed - data not refreshing',
          source: 'airflow',
          timestamp: new Date().toISOString()
        },
        {
          id: 'alert-002',
          severity: 'high' as const,
          type: 'slow_query',
          message: 'Dashboard query exceeding 30s SLA',
          source: 'trino',
          timestamp: new Date().toISOString()
        },
        {
          id: 'alert-003',
          severity: 'high' as const,
          type: 'resource_exhaustion',
          message: 'Spark cluster memory utilization at 95%',
          source: 'spark',
          timestamp: new Date().toISOString()
        },
        {
          id: 'alert-004',
          severity: 'medium' as const,
          type: 'quality_issue',
          message: 'Data completeness dropped below threshold',
          source: 'great_expectations',
          timestamp: new Date().toISOString()
        },
        {
          id: 'alert-005',
          severity: 'low' as const,
          type: 'maintenance',
          message: 'Scheduled maintenance window approaching',
          source: 'system',
          timestamp: new Date().toISOString()
        }
      ];

      // Prioritize using CrewAI
      const result = await crewAIService.prioritizeAlerts(rawAlerts);
      setAlerts(result.prioritized_alerts);
      setArbitronMetrics(result.arbitron_metrics);
      setCrewStatus('active');
    } catch (err) {
      console.error('Failed to prioritize alerts:', err);
      setError('Failed to connect to CrewAI service');
      setCrewStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <Info className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityBadgeVariant = (score: number): any => {
    if (score >= 8) return 'destructive';
    if (score >= 6) return 'warning';
    if (score >= 4) return 'secondary';
    return 'default';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* CrewAI Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle>AI-Prioritized Alerts</CardTitle>
              {crewStatus === 'processing' && (
                <Badge variant="secondary" className="animate-pulse">
                  Processing...
                </Badge>
              )}
              {crewStatus === 'active' && (
                <Badge variant="default" className="bg-green-500">
                  CrewAI Active
                </Badge>
              )}
              {crewStatus === 'error' && (
                <Badge variant="destructive">
                  Offline
                </Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAlerts}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
          <CardDescription className="mt-2">
            System Health Crew analyzing {alerts.length} alerts with 4 specialized agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quick Metrics */}
          {arbitronMetrics && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {alerts.filter(a => a.priority_score >= 8).length}
                </div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {alerts.filter(a => a.priority_score >= 6 && a.priority_score < 8).length}
                </div>
                <div className="text-xs text-muted-foreground">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {alerts.filter(a => a.priority_score >= 4 && a.priority_score < 6).length}
                </div>
                <div className="text-xs text-muted-foreground">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {alerts.filter(a => a.priority_score < 4).length}
                </div>
                <div className="text-xs text-muted-foreground">Low</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert List */}
      <div className="space-y-3">
        {loading && (
          <Card className="animate-pulse">
            <CardContent className="py-8 text-center text-muted-foreground">
              Analyzing alerts with CrewAI...
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && alerts.map((alert) => (
          <Card 
            key={alert.id} 
            className={cn(
              "transition-all hover:shadow-md",
              alert.priority_rank === 1 && "border-red-500 border-2"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Priority Rank */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "text-2xl font-bold",
                    alert.priority_rank <= 3 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    #{alert.priority_rank}
                  </div>
                  <Badge 
                    variant={getPriorityBadgeVariant(alert.priority_score)}
                    className="mt-1"
                  >
                    {alert.priority_score.toFixed(1)}
                  </Badge>
                </div>

                {/* Alert Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(alert.severity)}
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                    <Badge variant="outline">{alert.source}</Badge>
                    <Badge variant="outline">{alert.type}</Badge>
                    <div className="ml-auto flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        {(alert.consensus_confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </div>

                  <h4 className="font-medium mb-2">{alert.message}</h4>

                  {/* Scores */}
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Urgency</div>
                      <Progress value={alert.urgency_score * 10} className="h-2 mt-1" />
                      <div className="text-xs font-medium mt-1">{alert.urgency_score.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Business Impact</div>
                      <Progress value={alert.business_impact_score * 10} className="h-2 mt-1" />
                      <div className="text-xs font-medium mt-1">{alert.business_impact_score.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Cascade Risk</div>
                      <Progress value={alert.cascade_risk_score * 10} className="h-2 mt-1" />
                      <div className="text-xs font-medium mt-1">{alert.cascade_risk_score.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Resolution Effort</div>
                      <Progress value={alert.resolution_effort_score * 10} className="h-2 mt-1" />
                      <div className="text-xs font-medium mt-1">{alert.resolution_effort_score.toFixed(1)}</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {alert.recommendations.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">AI Recommendations</div>
                        {alert.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="h-3 w-3 mt-0.5 text-muted-foreground" />
                            <div className="flex-1">
                              <span className="font-medium">{rec.action}:</span> {rec.reason}
                              {rec.suggested_team && (
                                <Badge variant="outline" className="ml-2 gap-1">
                                  <Users className="h-3 w-3" />
                                  {rec.suggested_team}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Analysis Metadata */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {alert.crew_analysis.agents_consulted} agents consulted
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Analyzed at {new Date(alert.crew_analysis.analyzed_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="default">
                    Investigate
                  </Button>
                  <Button size="sm" variant="outline">
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}