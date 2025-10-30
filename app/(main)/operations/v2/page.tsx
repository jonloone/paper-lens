'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  Clock, 
  AlertTriangle, 
  Search,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Database,
  Zap,
  RefreshCw,
  GitBranch,
  FileSearch,
  PlayCircle,
  PauseCircle,
  XCircle,
  Loader2,
  Sparkles,
  Shield,
  Cpu,
  HardDrive,
  Network,
  RotateCcw,
  FileCode,
  GitCompare,
  PhoneCall,
  Eye,
  Wrench,
  DollarSign,
  Users,
  TrendingDown,
  BarChart3,
  Timer,
  GitCommit,
  Package,
  Gauge,
  CircuitBoard,
  ServerCrash,
  WifiOff,
  MemoryStick,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced types with business impact
interface Issue {
  id: string;
  type: 'failure' | 'performance' | 'resource' | 'quality' | 'connection';
  severity: 'critical' | 'high' | 'medium' | 'low';
  pipeline: string;
  environment: 'PROD' | 'STAGING' | 'DEV';
  description: string;
  impact: {
    technical: string;
    business: string;
    costPerHour?: number;
    affectedUsers?: number;
    slaRisk?: { breachIn: number; sla: string };
  };
  startedAt: Date;
  attempts: number;
  pattern?: string;
  relatedChange?: {
    type: 'deploy' | 'config' | 'schema';
    id: string;
    timestamp: Date;
    author: string;
  };
  suggestedFix?: {
    description: string;
    confidence: number;
    risk: 'low' | 'medium' | 'high';
    estimatedTime: string;
    requiresApproval?: boolean;
  };
  relatedIssues?: string[];
}

interface Pattern {
  id: string;
  name: string;
  description: string;
  issueCount: number;
  issues: Issue[];
  rootCause?: string;
  startedAt: Date;
  suggestedAction: {
    label: string;
    description: string;
    confidence: number;
  };
}

interface SystemHealth {
  status: 'operational' | 'degraded' | 'partial-outage' | 'major-outage';
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  patterns: number;
  costPerHour: number;
  affectedPipelines: number;
  totalPipelines: number;
}

export default function OperationsCenterV2() {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<string[]>(['patterns', 'critical']);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  // Mock data with rich context
  const issues: Issue[] = [
    {
      id: 'issue-1',
      type: 'connection',
      severity: 'critical',
      pipeline: 'realtime_inventory',
      environment: 'PROD',
      description: 'Connection pool exhausted',
      impact: {
        technical: 'Database connections maxed at 100/100',
        business: 'Order fulfillment blocked',
        costPerHour: 12000,
        affectedUsers: 5000,
        slaRisk: { breachIn: 47, sla: '99.9% uptime' }
      },
      startedAt: new Date(Date.now() - 2 * 3600000),
      attempts: 3,
      pattern: 'network-issues',
      relatedChange: {
        type: 'config',
        id: 'PR-447',
        timestamp: new Date(Date.now() - 3 * 3600000),
        author: 'sarah.chen'
      },
      suggestedFix: {
        description: 'Increase connection pool to 200 and implement connection throttling',
        confidence: 92,
        risk: 'low',
        estimatedTime: '5 min',
        requiresApproval: false
      }
    },
    {
      id: 'issue-2',
      type: 'performance',
      severity: 'high',
      pipeline: 'customer_etl',
      environment: 'PROD',
      description: 'Running 5x slower than baseline',
      impact: {
        technical: 'Processing time increased from 15s to 75s',
        business: 'Daily reports delayed',
        slaRisk: { breachIn: 47, sla: 'Reports by 6 AM' }
      },
      startedAt: new Date(Date.now() - 1.5 * 3600000),
      attempts: 1,
      pattern: 'memory-pressure',
      suggestedFix: {
        description: 'Increase Spark executor memory from 4GB to 8GB',
        confidence: 85,
        risk: 'medium',
        estimatedTime: '10 min',
        requiresApproval: true
      }
    },
    {
      id: 'issue-3',
      type: 'connection',
      severity: 'high',
      pipeline: 'marketing_sync',
      environment: 'PROD',
      description: 'Intermittent connection timeouts',
      impact: {
        technical: 'Failed 12 times in last hour',
        business: 'Marketing campaigns not updating',
        affectedUsers: 200
      },
      startedAt: new Date(Date.now() - 2 * 3600000),
      attempts: 12,
      pattern: 'network-issues',
      relatedIssues: ['issue-1', 'issue-4']
    },
    {
      id: 'issue-4',
      type: 'connection',
      severity: 'medium',
      pipeline: 'email_validation',
      environment: 'STAGING',
      description: 'Slow connection establishment',
      impact: {
        technical: 'Connection taking 5s instead of 200ms',
        business: 'Email verification delayed'
      },
      startedAt: new Date(Date.now() - 2.5 * 3600000),
      attempts: 0,
      pattern: 'network-issues'
    },
    {
      id: 'issue-5',
      type: 'resource',
      severity: 'high',
      pipeline: 'revenue_aggregation',
      environment: 'PROD',
      description: 'Memory usage at 87%',
      impact: {
        technical: 'OOM risk with current growth rate',
        business: 'Financial reporting at risk',
        costPerHour: 450
      },
      startedAt: new Date(Date.now() - 45 * 60000),
      attempts: 0,
      pattern: 'memory-pressure',
      suggestedFix: {
        description: 'Optimize window functions and add data partitioning',
        confidence: 78,
        risk: 'medium',
        estimatedTime: '30 min',
        requiresApproval: true
      }
    }
  ];

  // Detect patterns
  const patterns = useMemo<Pattern[]>(() => {
    const patternMap = new Map<string, Issue[]>();
    
    issues.forEach(issue => {
      if (issue.pattern) {
        const existing = patternMap.get(issue.pattern) || [];
        patternMap.set(issue.pattern, [...existing, issue]);
      }
    });

    const detectedPatterns: Pattern[] = [];
    
    patternMap.forEach((patternIssues, patternId) => {
      if (patternIssues.length >= 2) {
        const pattern: Pattern = {
          id: patternId,
          name: patternId === 'network-issues' ? 'Network Connectivity Issues' : 
                patternId === 'memory-pressure' ? 'Memory Resource Constraints' : 
                'Unknown Pattern',
          description: patternId === 'network-issues' 
            ? `${patternIssues.length} pipelines experiencing connection problems after network maintenance`
            : `${patternIssues.length} pipelines facing memory constraints during peak processing`,
          issueCount: patternIssues.length,
          issues: patternIssues,
          rootCause: patternId === 'network-issues' 
            ? 'Network configuration changed during maintenance window'
            : 'Concurrent heavy aggregations exceeding cluster capacity',
          startedAt: new Date(Math.min(...patternIssues.map(i => i.startedAt.getTime()))),
          suggestedAction: {
            label: patternId === 'network-issues' ? 'Investigate Network' : 'Optimize Resources',
            description: patternId === 'network-issues' 
              ? 'Check network topology and connection pool settings'
              : 'Stagger job schedules and optimize memory usage',
            confidence: 88
          }
        };
        detectedPatterns.push(pattern);
      }
    });

    return detectedPatterns.sort((a, b) => {
      const severityA = Math.max(...a.issues.map(i => getSeverityScore(i.severity)));
      const severityB = Math.max(...b.issues.map(i => getSeverityScore(i.severity)));
      return severityB - severityA;
    });
  }, [issues]);

  // System health calculation
  const systemHealth = useMemo<SystemHealth>(() => {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');
    
    const totalCost = issues.reduce((sum, issue) => 
      sum + (issue.impact.costPerHour || 0), 0
    );

    const affectedPipelines = new Set(issues.map(i => i.pipeline)).size;

    let status: SystemHealth['status'] = 'operational';
    if (criticalIssues.length > 0) status = 'major-outage';
    else if (highIssues.length > 2) status = 'partial-outage';
    else if (highIssues.length > 0) status = 'degraded';

    return {
      status,
      criticalCount: criticalIssues.length,
      highCount: highIssues.length,
      mediumCount: mediumIssues.length,
      lowCount: lowIssues.length,
      patterns: patterns.length,
      costPerHour: totalCost,
      affectedPipelines,
      totalPipelines: 167 // Mock total
    };
  }, [issues, patterns]);

  // Group issues by severity
  const issuesBySeverity = useMemo(() => {
    return {
      critical: issues.filter(i => i.severity === 'critical'),
      high: issues.filter(i => i.severity === 'high' && !i.pattern),
      medium: issues.filter(i => i.severity === 'medium' && !i.pattern),
      low: issues.filter(i => i.severity === 'low' && !i.pattern)
    };
  }, [issues]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getSeverityScore = (severity: string): number => {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'major-outage': return <ServerCrash className="h-5 w-5 text-red-500" />;
      case 'partial-outage': return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'operational': return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <div className="min-h-screen">
      {/* System Status Header */}
      <div className={cn(
        "border-b px-6 py-4",
        systemHealth.status === 'major-outage' && "bg-red-50 border-red-200",
        systemHealth.status === 'partial-outage' && "bg-orange-50 border-orange-200",
        systemHealth.status === 'degraded' && "bg-yellow-50 border-yellow-200",
        systemHealth.status === 'operational' && "bg-green-50 border-green-200"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon(systemHealth.status)}
            <div>
              <h1 className="text-xl flex items-center gap-2">
                Operations Center
                <Badge variant="outline" className="font-normal">
                  {systemHealth.affectedPipelines}/{systemHealth.totalPipelines} pipelines affected
                </Badge>
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {systemHealth.criticalCount > 0 && (
                  <span className="text-red-600 font-medium">
                    🔴 {systemHealth.criticalCount} critical
                  </span>
                )}
                {systemHealth.highCount > 0 && (
                  <span className="text-orange-600 font-medium">
                    🟠 {systemHealth.highCount} high
                  </span>
                )}
                {systemHealth.mediumCount > 0 && (
                  <span className="text-yellow-600">
                    🟡 {systemHealth.mediumCount} medium
                  </span>
                )}
                {systemHealth.costPerHour > 0 && (
                  <span className="text-red-600 font-medium">
                    💸 ${systemHealth.costPerHour.toLocaleString()}/hour impact
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4 mr-1" />
              Runbook
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        {/* Pattern Detection Alert */}
        {patterns.length > 0 && (
          <Alert className="border-2 border-purple-200 bg-purple-50">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-purple-900">
                  {patterns.length} Pattern{patterns.length > 1 ? 's' : ''} Detected:
                </span>
                <span className="ml-2 text-purple-700">
                  {patterns.map(p => p.name).join(', ')}
                </span>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
                onClick={() => toggleSection('patterns')}
              >
                <Eye className="h-4 w-4 mr-1" />
                Investigate Patterns
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Detected Patterns Section */}
        {patterns.length > 0 && (
          <Card className="border-2 border-purple-200">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('patterns')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {expandedSections.includes('patterns') ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <CircuitBoard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Detected Patterns
                      <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">
                        AI Analysis
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Systemic issues affecting multiple pipelines
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.includes('patterns') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="space-y-4">
                    {patterns.map((pattern) => (
                      <div
                        key={pattern.id}
                        className={cn(
                          "p-4 border-2 rounded-lg bg-background",
                          selectedPattern === pattern.id && "border-purple-500 bg-purple-50/50"
                        )}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg flex items-center gap-2">
                                {pattern.name}
                                <Badge variant="outline">
                                  {pattern.issueCount} issues
                                </Badge>
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {pattern.description}
                              </p>
                              {pattern.rootCause && (
                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                  <span className="font-medium">Root Cause:</span> {pattern.rootCause}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Started {formatTimeAgo(pattern.startedAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => router.push(`/studio?pattern=${pattern.id}&mode=analyze`)}
                            >
                              <Search className="h-4 w-4 mr-1" />
                              {pattern.suggestedAction.label}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedPattern(
                                selectedPattern === pattern.id ? null : pattern.id
                              )}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View All Issues
                            </Button>
                            <Button size="sm" variant="ghost">
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Bulk Retry
                            </Button>
                            <Badge variant="secondary" className="ml-auto">
                              {pattern.suggestedAction.confidence}% confidence
                            </Badge>
                          </div>

                          {selectedPattern === pattern.id && (
                            <div className="mt-3 pt-3 border-t space-y-2">
                              {pattern.issues.map(issue => (
                                <div key={issue.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("text-xs", getSeverityColor(issue.severity))}>
                                      {issue.severity}
                                    </Badge>
                                    <span className="font-mono text-sm">{issue.pipeline}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {issue.environment}
                                    </span>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => router.push(`/studio?pipeline=${issue.pipeline}&mode=operate`)}
                                  >
                                    Fix
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {/* Critical Failures */}
        {issuesBySeverity.critical.length > 0 && (
          <Card className="border-2 border-red-200 bg-red-50/30">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('critical')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {expandedSections.includes('critical') ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Critical Failures ({issuesBySeverity.critical.length})
                    </CardTitle>
                    <CardDescription>
                      Production pipelines requiring immediate attention
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.includes('critical') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="space-y-4">
                    {issuesBySeverity.critical.map((issue) => (
                      <IssueCard 
                        key={issue.id} 
                        issue={issue} 
                        selected={selectedIssue === issue.id}
                        onSelect={() => setSelectedIssue(
                          selectedIssue === issue.id ? null : issue.id
                        )}
                        onInvestigate={() => router.push(`/studio?pipeline=${issue.pipeline}&mode=operate`)}
                      />
                    ))}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {/* High Priority Issues */}
        {issuesBySeverity.high.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('high')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {expandedSections.includes('high') ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      High Priority ({issuesBySeverity.high.length})
                    </CardTitle>
                    <CardDescription>
                      Performance degradation and SLA risks
                    </CardDescription>
                  </div>
                </div>
                {!expandedSections.includes('high') && (
                  <Badge variant="outline" className="text-xs">
                    Click to expand
                  </Badge>
                )}
              </div>
            </CardHeader>
            {/* Similar content structure for high priority issues */}
          </Card>
        )}

        {/* Optimization Opportunities */}
        {(issuesBySeverity.medium.length > 0 || issuesBySeverity.low.length > 0) && (
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('optimizations')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {expandedSections.includes('optimizations') ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Optimization Opportunities ({issuesBySeverity.medium.length + issuesBySeverity.low.length})
                    </CardTitle>
                    <CardDescription>
                      Non-critical improvements and cost savings
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            {/* Optimization content */}
          </Card>
        )}
      </div>
    </div>
  );
}

// Issue Card Component
function IssueCard({ 
  issue, 
  selected, 
  onSelect, 
  onInvestigate 
}: { 
  issue: Issue; 
  selected: boolean;
  onSelect: () => void;
  onInvestigate: () => void;
}) {
  const router = useRouter();
  
  return (
    <motion.div
      className={cn(
        "p-4 border-2 rounded-lg bg-background",
        selected && "border-primary"
      )}
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-mono font-semibold">{issue.pipeline}</span>
              <Badge variant="outline" className="text-xs">
                {issue.environment}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Failed {issue.attempts}x
              </Badge>
              {issue.relatedChange && (
                <Badge variant="secondary" className="text-xs">
                  After {issue.relatedChange.type} {issue.relatedChange.id}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {issue.description}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Started {formatTimeAgo(issue.startedAt)}
          </span>
        </div>

        {/* Impact */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div>
            <p className="text-xs text-muted-foreground">Business Impact</p>
            <p className="text-sm font-medium text-red-700">{issue.impact.business}</p>
            <div className="flex items-center gap-2 mt-1">
              {issue.impact.costPerHour && (
                <Badge variant="destructive" className="text-xs">
                  <DollarSign className="h-3 w-3" />
                  {issue.impact.costPerHour.toLocaleString()}/hr
                </Badge>
              )}
              {issue.impact.affectedUsers && (
                <Badge variant="destructive" className="text-xs">
                  <Users className="h-3 w-3" />
                  {issue.impact.affectedUsers.toLocaleString()} users
                </Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Technical Impact</p>
            <p className="text-sm font-medium">{issue.impact.technical}</p>
            {issue.impact.slaRisk && (
              <Badge variant="warning" className="text-xs mt-1">
                <Timer className="h-3 w-3" />
                SLA breach in {issue.impact.slaRisk.breachIn} min
              </Badge>
            )}
          </div>
        </div>

        {/* Suggested Fix */}
        {issue.suggestedFix && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">
                  Suggested Fix ({issue.suggestedFix.confidence}% confidence)
                </p>
                <p className="text-sm">{issue.suggestedFix.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Risk: {issue.suggestedFix.risk}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3" />
                    {issue.suggestedFix.estimatedTime}
                  </Badge>
                  {issue.suggestedFix.requiresApproval && (
                    <Badge variant="warning" className="text-xs">
                      Requires approval
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="default" 
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onInvestigate();
              }}
            >
              <Search className="h-3 w-3 mr-1" />
              Investigate
            </Button>
            {issue.suggestedFix && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  // Apply fix logic
                }}
              >
                <Zap className="h-3 w-3 mr-1" />
                Quick Fix
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                // Page on-call logic
              }}
            >
              <PhoneCall className="h-3 w-3 mr-1" />
              Page On-Call
            </Button>
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/studio?pipeline=${issue.pipeline}&mode=operate`);
            }}
          >
            Open in Studio
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}