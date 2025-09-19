'use client';

import React, { useState } from 'react';
import {
  Zap,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Activity,
  DollarSign,
  Clock,
  Users,
  FileText,
  Code,
  Play,
  RotateCw,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  Cpu
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TestCase {
  id: string;
  name: string;
  crew: string;
  description: string;
  input: any;
  endpoint: string;
  method: 'GET' | 'POST';
}

interface TestResult {
  testId: string;
  success: boolean;
  duration: number;
  response?: any;
  error?: string;
  arbitronMetrics?: {
    model_used: string;
    cost: number;
    latency_ms: number;
    from_cache: boolean;
  };
}

export default function TestCrewsPage() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [customInput, setCustomInput] = useState<string>('');
  const [selectedCrew, setSelectedCrew] = useState<string>('system-health');
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = '/api/crewai-proxy';

  // Define test cases for each crew
  const testCases: TestCase[] = [
    // System Health Crew Tests
    {
      id: 'health-check',
      name: 'Health Check',
      crew: 'system',
      description: 'Verify CrewAI backend is running and healthy',
      endpoint: '/health',
      method: 'GET',
      input: null
    },
    {
      id: 'list-crews',
      name: 'List Available Crews',
      crew: 'system',
      description: 'Get list of all available crews and their status',
      endpoint: '/api/crews',
      method: 'GET',
      input: null
    },
    {
      id: 'arbitron-metrics',
      name: 'Get Arbitron Metrics',
      crew: 'system',
      description: 'Fetch current Arbitron LLM usage metrics',
      endpoint: '/api/arbitron/metrics',
      method: 'GET',
      input: null
    },
    {
      id: 'prioritize-critical',
      name: 'Prioritize Critical Alerts',
      crew: 'system-health',
      description: 'Test alert prioritization with critical pipeline failures',
      endpoint: '/api/crews/system-health/prioritize',
      method: 'POST',
      input: {
        alerts: [
          {
            id: 'crit-001',
            severity: 'critical',
            type: 'pipeline_failure',
            message: 'Customer ETL pipeline failed - data not refreshing',
            source: 'airflow',
            timestamp: new Date().toISOString()
          },
          {
            id: 'crit-002',
            severity: 'critical',
            type: 'resource_exhaustion',
            message: 'Spark cluster out of memory',
            source: 'spark',
            timestamp: new Date().toISOString()
          },
          {
            id: 'high-001',
            severity: 'high',
            type: 'slow_query',
            message: 'Dashboard queries exceeding 30s SLA',
            source: 'trino',
            timestamp: new Date().toISOString()
          }
        ]
      }
    },
    {
      id: 'prioritize-mixed',
      name: 'Prioritize Mixed Severity',
      crew: 'system-health',
      description: 'Test with mixed severity levels to verify ranking algorithm',
      endpoint: '/api/crews/system-health/prioritize',
      method: 'POST',
      input: {
        alerts: [
          {
            id: 'low-001',
            severity: 'low',
            type: 'maintenance',
            message: 'Scheduled maintenance window approaching',
            source: 'system',
            timestamp: new Date().toISOString()
          },
          {
            id: 'med-001',
            severity: 'medium',
            type: 'quality_issue',
            message: 'Data completeness dropped to 89%',
            source: 'great_expectations',
            timestamp: new Date().toISOString()
          },
          {
            id: 'high-002',
            severity: 'high',
            type: 'pipeline_delay',
            message: 'Pipeline running 2 hours behind schedule',
            source: 'airflow',
            timestamp: new Date().toISOString()
          },
          {
            id: 'crit-003',
            severity: 'critical',
            type: 'data_corruption',
            message: 'Data corruption detected in fact table',
            source: 'datahub',
            timestamp: new Date().toISOString()
          }
        ]
      }
    },
    {
      id: 'prioritize-cascade',
      name: 'Test Cascade Risk Analysis',
      crew: 'system-health',
      description: 'Test cascade risk scoring for dependent systems',
      endpoint: '/api/crews/system-health/prioritize',
      method: 'POST',
      input: {
        alerts: [
          {
            id: 'upstream-001',
            severity: 'high',
            type: 'upstream_failure',
            message: 'Master data source unavailable',
            source: 'datahub',
            timestamp: new Date().toISOString(),
            metadata: {
              affected_pipelines: 15,
              downstream_consumers: 30
            }
          },
          {
            id: 'isolated-001',
            severity: 'high',
            type: 'isolated_failure',
            message: 'Single report generation failed',
            source: 'reporting',
            timestamp: new Date().toISOString(),
            metadata: {
              affected_pipelines: 1,
              downstream_consumers: 2
            }
          }
        ]
      }
    },
    {
      id: 'stress-test',
      name: 'Stress Test (100 Alerts)',
      crew: 'system-health',
      description: 'Test system performance with large alert volume',
      endpoint: '/api/crews/system-health/prioritize',
      method: 'POST',
      input: {
        alerts: Array.from({ length: 100 }, (_, i) => ({
          id: `stress-${i}`,
          severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
          type: ['pipeline_failure', 'quality_issue', 'slow_query', 'resource_exhaustion'][Math.floor(Math.random() * 4)],
          message: `Test alert ${i} for stress testing`,
          source: ['airflow', 'trino', 'spark', 'datahub'][Math.floor(Math.random() * 4)],
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
        }))
      }
    }
  ];

  // Run a specific test
  const runTest = async (testCase: TestCase) => {
    setActiveTest(testCase.id);
    const startTime = Date.now();

    try {
      const url = `${baseUrl}${testCase.endpoint}`;
      const options: RequestInit = {
        method: testCase.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (testCase.method === 'POST' && testCase.input) {
        options.body = JSON.stringify(testCase.input);
      }

      const response = await fetch(url, options);
      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract Arbitron metrics if available
      let arbitronMetrics;
      if (data.arbitron_metrics) {
        arbitronMetrics = {
          model_used: data.arbitron_metrics.model_used,
          cost: data.arbitron_metrics.cost,
          latency_ms: data.arbitron_metrics.latency_ms,
          from_cache: data.arbitron_metrics.from_cache
        };
      }

      setTestResults(prev => ({
        ...prev,
        [testCase.id]: {
          testId: testCase.id,
          success: true,
          duration,
          response: data,
          arbitronMetrics
        }
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [testCase.id]: {
          testId: testCase.id,
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setActiveTest(null);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    for (const testCase of testCases) {
      await runTest(testCase);
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // Run custom test
  const runCustomTest = async () => {
    if (!customInput) return;

    try {
      const input = JSON.parse(customInput);
      const customTest: TestCase = {
        id: 'custom-' + Date.now(),
        name: 'Custom Test',
        crew: selectedCrew,
        description: 'User-defined custom test',
        endpoint: `/api/crews/${selectedCrew}/prioritize`,
        method: 'POST',
        input
      };
      await runTest(customTest);
    } catch (error) {
      alert('Invalid JSON input');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Get test status icon
  const getTestStatusIcon = (testId: string) => {
    const result = testResults[testId];
    if (!result) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    if (activeTest === testId) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  // Get overall statistics
  const getStats = () => {
    const results = Object.values(testResults);
    return {
      total: testCases.length,
      ran: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalCost: results.reduce((sum, r) => sum + (r.arbitronMetrics?.cost || 0), 0),
      avgLatency: results.length > 0 
        ? results.reduce((sum, r) => sum + r.duration, 0) / results.length 
        : 0,
      cacheHits: results.filter(r => r.arbitronMetrics?.from_cache).length
    };
  };

  const stats = getStats();

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CrewAI & Arbitron Test Suite</h2>
          <p className="text-muted-foreground">
            Comprehensive testing for all crews and LLM orchestration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            Backend: CrewAI via Proxy
          </Badge>
          <Button onClick={runAllTests} disabled={activeTest !== null}>
            <Play className="h-4 w-4 mr-2" />
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{stats.passed}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{stats.failed}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{Math.round(stats.avgLatency)}ms</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg Latency</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.cacheHits}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cache Hits</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">Test Cases</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="custom">Custom Test</TabsTrigger>
        </TabsList>

        {/* Test Cases Tab */}
        <TabsContent value="tests" className="space-y-4">
          <div className="space-y-4">
            {['system', 'system-health'].map(crewType => (
              <Card key={crewType}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {crewType === 'system' ? 'System Tests' : 'System Health Crew Tests'}
                  </CardTitle>
                  <CardDescription>
                    {crewType === 'system' 
                      ? 'Basic connectivity and health checks'
                      : 'Alert prioritization and consensus ranking tests'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testCases
                      .filter(tc => tc.crew === crewType)
                      .map(testCase => (
                        <div 
                          key={testCase.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getTestStatusIcon(testCase.id)}
                            <div>
                              <p className="font-medium">{testCase.name}</p>
                              <p className="text-sm text-muted-foreground">{testCase.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {testResults[testCase.id] && (
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {testResults[testCase.id].duration}ms
                              </Badge>
                            )}
                            <Button 
                              size="sm" 
                              onClick={() => runTest(testCase)}
                              disabled={activeTest !== null}
                            >
                              {activeTest === testCase.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {Object.values(testResults).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No test results yet. Run some tests to see results here.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.values(testResults).map(result => {
                const testCase = testCases.find(tc => tc.id === result.testId) || {
                  name: 'Custom Test',
                  description: 'User-defined test'
                };
                
                return (
                  <Card key={result.testId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <CardTitle className="text-base">{testCase.name}</CardTitle>
                            <CardDescription>{testCase.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{result.duration}ms</Badge>
                          {result.arbitronMetrics && (
                            <>
                              <Badge variant="outline" className="gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${result.arbitronMetrics.cost.toFixed(4)}
                              </Badge>
                              {result.arbitronMetrics.from_cache && (
                                <Badge variant="secondary">Cached</Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {result.error ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Test Failed</AlertTitle>
                          <AlertDescription>{result.error}</AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-3">
                          {result.arbitronMetrics && (
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Cpu className="h-3 w-3" />
                                <span>{result.arbitronMetrics.model_used}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{result.arbitronMetrics.latency_ms}ms</span>
                              </div>
                            </div>
                          )}
                          <div className="relative">
                            <ScrollArea className="h-64 w-full rounded-md border p-4">
                              <pre className="text-xs">
                                {JSON.stringify(result.response, null, 2)}
                              </pre>
                            </ScrollArea>
                            <Button
                              size="sm"
                              variant="outline"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard(JSON.stringify(result.response, null, 2), result.testId)}
                            >
                              {copied === result.testId ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Custom Test Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Test Runner</CardTitle>
              <CardDescription>
                Create and run custom tests with your own alert data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Crew</label>
                <Select value={selectedCrew} onValueChange={setSelectedCrew}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system-health">System Health Crew</SelectItem>
                    <SelectItem value="performance">Performance Analysis Crew</SelectItem>
                    <SelectItem value="quality">Quality Priority Crew</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Test Input (JSON)</label>
                <Textarea
                  className="font-mono text-sm h-64"
                  placeholder={JSON.stringify({
                    alerts: [
                      {
                        id: "custom-001",
                        severity: "high",
                        type: "pipeline_failure",
                        message: "Your custom alert message",
                        source: "custom",
                        timestamp: new Date().toISOString()
                      }
                    ]
                  }, null, 2)}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={runCustomTest} disabled={!customInput || activeTest !== null}>
                  <Send className="h-4 w-4 mr-2" />
                  Run Custom Test
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setCustomInput(JSON.stringify({
                    alerts: [
                      {
                        id: `custom-${Date.now()}`,
                        severity: "high",
                        type: "pipeline_failure",
                        message: "Sample custom alert for testing",
                        source: "custom",
                        timestamp: new Date().toISOString()
                      }
                    ]
                  }, null, 2))}
                >
                  Load Sample
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}