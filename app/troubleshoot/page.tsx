'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TroubleshootingCard } from '@/components/troubleshooting/TroubleshootingCard';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, Activity, CheckCircle, XCircle, BarChart3, 
  FileText, RefreshCw, Settings, Lightbulb, ArrowUpDown, 
  ChevronRight, Terminal, Database, Network, Clock, TrendingUp,
  Zap, Shield, Bot, Send, User, AlertCircle, Siren, Filter,
  MessageSquare, Loader2, Info, DollarSign, Users
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

export default function TroubleshootingPage() {
  const [aiInput, setAiInput] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'ai', message: string}>>([]);
  const [isTyping, setIsTyping] = useState(false);

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Mock data - in production, this would come from your monitoring services
  const activeIssues: TroubleshootingIssue[] = [
    {
      id: '1',
      name: 'Kafka Connection Timeout',
      severity: 'error',
      status: 'active',
      errorCode: 'KAFKA_TIMEOUT_001',
      errorMessage: 'Failed to establish connection to broker within timeout period',
      affectedSystems: 3,
      errorRate: 15.2,
      duration: '15 minutes',
      lastOccurrence: '2 minutes ago',
      suggestedFix: {
        description: 'Restart Kafka broker or increase timeout settings. Check network connectivity between services.',
        confidence: 85,
        estimatedTime: '10 minutes'
      },
      diagnosticActions: [
        { id: 'd1', label: 'Check broker health', icon: Activity, priority: 'recommended', successRate: 92 },
        { id: 'd2', label: 'Verify network connectivity', icon: Network, priority: 'recommended', successRate: 88 },
        { id: 'd3', label: 'Analyze logs', icon: Terminal, priority: 'alternative' },
        { id: 'd4', label: 'Check configuration', icon: Settings, priority: 'alternative' }
      ]
    },
    {
      id: '2',
      name: 'High Query Latency',
      severity: 'warning',
      status: 'investigating',
      errorCode: 'PERF_LAT_002',
      errorMessage: 'Query execution time exceeds SLA thresholds',
      affectedSystems: 5,
      errorRate: 8.7,
      duration: '30 minutes',
      lastOccurrence: '5 minutes ago',
      suggestedFix: {
        description: 'Add index on frequently queried columns or optimize query execution plan',
        confidence: 72,
        estimatedTime: '20 minutes'
      },
      diagnosticActions: [
        { id: 'd5', label: 'Analyze query plan', icon: BarChart3, priority: 'recommended', successRate: 85 },
        { id: 'd6', label: 'Check resource utilization', icon: Activity, priority: 'recommended', successRate: 78 },
        { id: 'd7', label: 'Review recent changes', icon: Clock, priority: 'alternative' },
        { id: 'd8', label: 'Run performance test', icon: TrendingUp, priority: 'alternative' }
      ]
    },
    {
      id: '3',
      name: 'Schema Validation Failures',
      severity: 'info',
      status: 'resolving',
      errorCode: 'SCHEMA_VAL_003',
      errorMessage: 'Incoming data does not match expected schema',
      affectedSystems: 2,
      errorRate: 3.2,
      duration: '2 hours',
      lastOccurrence: '20 minutes ago',
      suggestedFix: {
        description: 'Update schema validation rules or fix data format in source system',
        confidence: 90,
        estimatedTime: '15 minutes'
      },
      diagnosticActions: [
        { id: 'd9', label: 'View schema differences', icon: FileText, priority: 'recommended', successRate: 95 },
        { id: 'd10', label: 'Check data samples', icon: Database, priority: 'recommended', successRate: 90 },
        { id: 'd11', label: 'Update validation rules', icon: Settings, priority: 'alternative' },
        { id: 'd12', label: 'Contact data provider', icon: User, priority: 'alternative' }
      ]
    },
    {
      id: '4',
      name: 'Memory Usage Alert',
      severity: 'warning',
      status: 'active',
      errorCode: 'MEM_HIGH_004',
      errorMessage: 'Container memory usage above 85% threshold',
      affectedSystems: 1,
      errorRate: 0,
      duration: '45 minutes',
      lastOccurrence: '1 minute ago',
      suggestedFix: {
        description: 'Scale up container resources or optimize memory-intensive operations',
        confidence: 78,
        estimatedTime: '5 minutes'
      },
      diagnosticActions: [
        { id: 'd13', label: 'View memory profiling', icon: BarChart3, priority: 'recommended', successRate: 88 },
        { id: 'd14', label: 'Scale containers', icon: TrendingUp, priority: 'recommended', successRate: 95 },
        { id: 'd15', label: 'Check for memory leaks', icon: Terminal, priority: 'alternative' },
        { id: 'd16', label: 'Review recent deployments', icon: Clock, priority: 'alternative' }
      ]
    }
  ];

  // Filter issues based on severity and emergency mode
  const filteredIssues = useMemo(() => {
    let issues = activeIssues;
    
    // Apply severity filter
    if (severityFilter !== 'all') {
      issues = issues.filter(issue => issue.severity === severityFilter);
    }
    
    // In emergency mode, only show errors
    if (emergencyMode) {
      issues = issues.filter(issue => issue.severity === 'error');
    }
    
    // Sort by severity (errors first)
    return issues.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [severityFilter, emergencyMode]);

  const sendMessage = () => {
    if (!aiInput.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', message: aiInput }]);
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I've analyzed the pattern. This appears to be a connection pool exhaustion issue. The timeout errors match what we saw during the last traffic spike. Would you like me to guide you through scaling the connection pool?",
        "Based on the error logs, the Kafka broker is rejecting connections due to hitting the max connection limit. I can help you restart the broker with increased capacity or implement connection pooling. Which approach would you prefer?",
        "Looking at the metrics, this started exactly when the new deployment went live. The configuration change might have reduced the timeout values. Shall I show you the diff and help roll back?"
      ];
      
      setChatMessages(prev => [...prev, {
        role: 'ai',
        message: responses[Math.floor(Math.random() * responses.length)]
      }]);
      setIsTyping(false);
    }, 1500);
    
    setAiInput('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Troubleshooting Center</h1>
          <p className="text-muted-foreground mt-2">
            {emergencyMode ? (
              <span className="text-red-400 font-medium">
                Emergency Mode Active - Showing critical issues only
              </span>
            ) : (
              'AI-powered issue detection and resolution with guided troubleshooting'
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="emergency-mode"
              checked={emergencyMode}
              onCheckedChange={setEmergencyMode}
              className="data-[state=checked]:bg-red-600"
            />
            <Label 
              htmlFor="emergency-mode" 
              className={cn(
                "cursor-pointer font-medium",
                emergencyMode && "text-red-400"
              )}
            >
              <Siren className="w-4 h-4 inline mr-1" />
              Emergency Mode
            </Label>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner - Only show when there are errors */}
      {activeIssues.some(issue => issue.severity === 'error') && (
        <Alert className="bg-gradient-to-r from-red-950/50 to-red-950/30 border-red-800/50">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-200 font-semibold">
            {activeIssues.filter(i => i.severity === 'error').length} Critical Issues Detected
          </AlertTitle>
          <AlertDescription className="text-red-300">
            Multiple systems are experiencing issues. AI-assisted resolution available.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      {!emergencyMode && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={severityFilter} onValueChange={(value: any) => setSeverityFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="error">Errors Only</SelectItem>
                <SelectItem value="warning">Warnings Only</SelectItem>
                <SelectItem value="info">Info Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 ml-auto">
            <Badge variant="outline" className="bg-red-950/30 text-red-300 border-red-800/50">
              {activeIssues.filter(i => i.severity === 'error').length} Critical
            </Badge>
            <Badge variant="outline" className="bg-amber-950/30 text-amber-300 border-amber-800/50">
              {activeIssues.filter(i => i.severity === 'warning').length} Warnings
            </Badge>
            <Badge variant="outline" className="bg-blue-950/30 text-blue-300 border-blue-800/50">
              {activeIssues.filter(i => i.severity === 'info').length} Info
            </Badge>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Issues */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {emergencyMode ? 'Critical Issues' : 'Active Issues'}
              {filteredIssues.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredIssues.length})
                </span>
              )}
            </h2>
            {!emergencyMode && (
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>

          {filteredIssues.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">No Issues Found</h3>
              <p className="text-muted-foreground">
                {severityFilter === 'all' 
                  ? 'All systems are operating normally'
                  : `No ${severityFilter} issues detected`}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <TroubleshootingCard
                  key={issue.id}
                  issue={issue}
                  expanded={expandedCards.has(issue.id)}
                  onToggle={() => toggleCard(issue.id)}
                  onStartInvestigation={() => {
                    setSelectedIssue(issue.id);
                    // Could trigger additional actions here
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* AI Assistant Panel */}
        <div className="space-y-4">
          {/* Emergency Actions - Show only in emergency mode */}
          {emergencyMode && (
            <Card className="border-red-800/50 bg-gradient-to-br from-red-950/40 to-background">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-200">
                  <Siren className="w-5 h-5 text-red-400" />
                  Emergency Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start bg-red-600 hover:bg-red-500 text-white" size="lg">
                  <XCircle className="w-4 h-4 mr-2" />
                  Kill All Non-Critical Processes
                </Button>
                <Button className="w-full justify-start bg-amber-600 hover:bg-amber-500 text-white" size="lg">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Rollback to Last Known Good
                </Button>
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-500 text-white" size="lg">
                  <Shield className="w-4 h-4 mr-2" />
                  Enable Safe Mode
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                System Health Check
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Database className="w-4 h-4 mr-2" />
                Database Performance
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Network className="w-4 h-4 mr-2" />
                Network Diagnostics
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Security Scan
              </Button>
            </CardContent>
          </Card>

          {/* AI Chat Assistant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-400" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Ask me about any issue or system behavior
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className={cn(
                        "p-3 rounded-lg text-sm",
                        msg.role === 'ai' 
                          ? "bg-blue-950/30 border border-blue-800/50" 
                          : "bg-muted ml-4"
                      )}>
                        <div className="flex items-center gap-2 mb-1 font-medium">
                          {msg.role === 'ai' ? (
                            <>
                              <Bot className="h-3 w-3" />
                              AI Assistant
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3" />
                              You
                            </>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed">{msg.message}</p>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      AI is typing...
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2">
                <Input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about the issue..."
                  className="flex-1"
                />
                <Button size="sm" onClick={sendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  Data Pipelines
                </span>
                {activeIssues.some(i => i.severity === 'error') ? (
                  <Badge variant="destructive">Affected</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-500 border-green-800/50">Healthy</Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  User Services
                </span>
                {activeIssues.some(i => i.severity === 'warning') ? (
                  <Badge variant="outline" className="text-amber-500 border-amber-800/50">Degraded</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-500 border-green-800/50">Healthy</Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Security Systems
                </span>
                <Badge variant="outline" className="text-green-500 border-green-800/50">Operational</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}