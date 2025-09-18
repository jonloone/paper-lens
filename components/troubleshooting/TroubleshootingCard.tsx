'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  AlertCircle, AlertTriangle, Activity, CheckCircle, XCircle,
  BarChart3, FileText, RefreshCw, Settings, Lightbulb, PlayCircle,
  ChevronDown, ChevronRight, Terminal, Database, Network, Clock,
  TrendingUp, Zap, Shield, Bot, ArrowRight, Info, Loader2
} from 'lucide-react';

interface TroubleshootingIssue {
  id: string;
  name: string;
  severity: 'error' | 'warning' | 'info';
  status: 'active' | 'investigating' | 'resolving';
  errorCode: string;
  errorMessage: string;
  affectedSystems: number;
  errorRate: number;
  duration: string;
  lastOccurrence?: string;
  suggestedFix?: {
    description: string;
    confidence: number;
    estimatedTime: string;
  };
  diagnosticActions?: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    priority: 'recommended' | 'alternative';
    successRate?: number;
  }>;
}

interface TroubleshootingCardProps {
  issue: TroubleshootingIssue;
  expanded?: boolean;
  onToggle?: () => void;
  onStartInvestigation?: () => void;
}

export function TroubleshootingCard({ 
  issue, 
  expanded = false, 
  onToggle,
  onStartInvestigation 
}: TroubleshootingCardProps) {
  const [activeTab, setActiveTab] = useState('diagnostics');
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionProgress, setResolutionProgress] = useState(0);

  // Get severity-based styling
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'error':
        return {
          card: 'bg-gradient-to-br from-red-950/40 to-background border-red-900/50 shadow-red-900/20',
          header: 'border-b-red-900/30',
          badge: 'bg-red-500 text-white border-red-600',
          impact: 'bg-red-950/50 border-red-800/50 text-red-200',
          text: 'text-red-200',
          icon: 'text-red-400',
          button: 'bg-red-950/70 hover:bg-red-900/50 text-red-200 border border-red-800/50 shadow-red-900/20',
          codeBlock: 'bg-black/50 border-red-800/50 text-red-300',
          suggestion: 'bg-blue-950/30 border-blue-800/50'
        };
      case 'warning':
        return {
          card: 'bg-gradient-to-br from-amber-950/30 to-background border-amber-900/50 shadow-amber-900/20',
          header: 'border-b-amber-900/30',
          badge: 'bg-amber-500 text-white border-amber-600',
          impact: 'bg-amber-950/50 border-amber-800/50 text-amber-200',
          text: 'text-amber-200',
          icon: 'text-amber-400',
          button: 'bg-amber-950/70 hover:bg-amber-900/50 text-amber-200 border border-amber-800/50 shadow-amber-900/20',
          codeBlock: 'bg-black/50 border-amber-800/50 text-amber-300',
          suggestion: 'bg-blue-950/30 border-blue-800/50'
        };
      default:
        return {
          card: 'bg-gradient-to-br from-blue-950/20 to-background border-blue-900/50',
          header: 'border-b-border',
          badge: 'bg-blue-500 text-white',
          impact: 'bg-blue-950/50 border-blue-800/50 text-blue-200',
          text: 'text-blue-200',
          icon: 'text-blue-400',
          button: 'bg-blue-950/70 hover:bg-blue-900/50 text-blue-200 border border-blue-800/50',
          codeBlock: 'bg-black/50 border-blue-800/50 text-blue-300',
          suggestion: 'bg-blue-950/30 border-blue-800/50'
        };
    }
  };

  const styles = getSeverityStyles(issue.severity);

  // Get severity icon
  const getSeverityIcon = () => {
    switch (issue.severity) {
      case 'error': return <XCircle className={cn("w-5 h-5 flex-shrink-0", styles.icon)} />;
      case 'warning': return <AlertTriangle className={cn("w-5 h-5 flex-shrink-0", styles.icon)} />;
      default: return <AlertCircle className={cn("w-5 h-5 flex-shrink-0", styles.icon)} />;
    }
  };

  // Prioritize diagnostic actions
  const prioritizedActions = useMemo(() => {
    if (!issue.diagnosticActions) return { recommended: [], alternatives: [] };
    
    return {
      recommended: issue.diagnosticActions.filter(a => a.priority === 'recommended'),
      alternatives: issue.diagnosticActions.filter(a => a.priority === 'alternative')
    };
  }, [issue.diagnosticActions]);

  const handleStartResolution = async () => {
    setIsResolving(true);
    setResolutionProgress(0);
    
    // Simulate resolution progress
    const interval = setInterval(() => {
      setResolutionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsResolving(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <Card className={cn(
      "troubleshooting-card transition-all duration-200",
      styles.card,
      "hover:shadow-lg relative"
    )}>
      {/* Header - Always Visible */}
      <CardHeader 
        className={cn(
          "pb-3 cursor-pointer",
          styles.header
        )}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getSeverityIcon()}
            <div className="flex-1">
              <h3 className={cn("font-semibold text-lg", styles.text)}>
                {issue.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className={styles.badge} variant="default">
                  {issue.severity.toUpperCase()}
                </Badge>
                <Badge className={cn("text-xs font-semibold", styles.impact)}>
                  {issue.affectedSystems} systems affected
                </Badge>
                <Badge variant="outline" className={cn("text-xs", styles.text)}>
                  {issue.errorRate}% error rate
                </Badge>
                <span className={cn("text-xs", styles.text)}>
                  {issue.duration}
                </span>
              </div>
            </div>
          </div>
          
          {/* Primary Action - Always Visible */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              className={cn("font-semibold shadow-lg", styles.button)}
              onClick={(e) => {
                e.stopPropagation();
                onStartInvestigation?.();
              }}
            >
              <Zap className="w-4 h-4 mr-1" />
              Quick Fix
            </Button>
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      
      {/* Error Details - Always Visible but Compact */}
      <CardContent className="pt-0 pb-4">
        <div className={cn(
          "rounded-md p-3 font-mono text-sm border",
          styles.codeBlock
        )}>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-3 h-3" />
            <span className="text-xs opacity-70">Error Details</span>
          </div>
          <code>{issue.errorCode}: {issue.errorMessage}</code>
        </div>

        {/* AI Suggestion - Prominent */}
        {issue.suggestedFix && (
          <div className={cn(
            "mt-3 p-3 rounded-md border",
            styles.suggestion
          )}>
            <div className="flex items-start gap-2">
              <Bot className={cn("w-4 h-4 mt-0.5 flex-shrink-0", "text-blue-400")} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-blue-200">AI Recommended Fix</p>
                  <Badge variant="outline" className="text-xs">
                    {issue.suggestedFix.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-blue-300">{issue.suggestedFix.description}</p>
                <p className="text-xs text-blue-400 mt-1">
                  Estimated time: {issue.suggestedFix.estimatedTime}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Expandable Details */}
      <Collapsible open={expanded}>
        <CollapsibleContent>
          <CardContent className="pt-0 border-t border-border/50">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-black/20">
                <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="diagnostics" className="space-y-3 mt-4">
                {/* Recommended Actions */}
                {prioritizedActions.recommended.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-300 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Recommended Actions
                    </h4>
                    <div className="space-y-2">
                      {prioritizedActions.recommended.map((action) => {
                        const Icon = action.icon;
                        return (
                          <div key={action.id} className="p-3 bg-green-950/20 border border-green-800/50 rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-200">{action.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {action.successRate && (
                                  <Badge variant="outline" className="text-xs">
                                    {action.successRate}% success
                                  </Badge>
                                )}
                                <Button size="sm" variant="outline" className="text-green-300 border-green-700 hover:bg-green-950/50">
                                  Run
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Alternative Actions */}
                {prioritizedActions.alternatives.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Alternative Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {prioritizedActions.alternatives.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={action.id}
                            variant="outline"
                            size="sm"
                            className="justify-start bg-[#161b22] border-[#30363d] hover:bg-[#21262d] text-[#f0f6fc]"
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="logs" className="mt-4">
                <div className="bg-black/50 border border-border/50 rounded-md p-3">
                  <pre className="text-xs text-muted-foreground">
                    {`[2024-01-15 14:23:45] ERROR: Connection timeout
[2024-01-15 14:23:46] WARN: Retry attempt 1/3
[2024-01-15 14:23:47] ERROR: Connection refused
[2024-01-15 14:23:48] INFO: Switching to backup broker
[2024-01-15 14:23:49] ERROR: Backup broker unavailable`}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="flex justify-between text-muted-foreground mb-1">
                      <span>Last occurrence</span>
                      <span>3 days ago</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground mb-1">
                      <span>Total occurrences</span>
                      <span>12 times</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Average resolution time</span>
                      <span>4.5 minutes</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Footer - Guided Troubleshooting */}
      <CardFooter className="bg-gray-100 dark:bg-black/20 border-t border-border/50">
        {!isResolving ? (
          <Button 
            className={cn("w-full font-semibold shadow-lg", styles.button)}
            size="lg"
            onClick={handleStartResolution}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Start Guided Troubleshooting
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        ) : (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Resolving issue...</span>
              <span className="font-medium">{resolutionProgress}%</span>
            </div>
            <Progress value={resolutionProgress} className="h-2" />
            {resolutionProgress === 100 && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" />
                Resolution complete!
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}