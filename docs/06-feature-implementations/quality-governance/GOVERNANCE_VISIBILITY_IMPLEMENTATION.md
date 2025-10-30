# Governance Visibility Implementation
## Phase 1: Quality Gates Dashboard at /govern/quality

**Status**: Ready to Implement
**Date**: October 9, 2025
**Effort**: 40 hours (1 week sprint)
**Philosophy**: Make self-service quality gates visible, trustworthy, and educational

---

## Executive Summary

### Goal
Transform invisible automated quality gates into a **visible, educational governance dashboard** that:
- Shows real-time gate execution status across all data products
- Provides historical trends to build trust in automation
- Surfaces common failure patterns to help users learn
- Creates an engineer optimization queue without blocking deployment

### Success Metrics
- ✅ 100% of quality gate executions visible in UI
- ✅ Users can self-diagnose 80% of gate failures
- ✅ Engineers see optimization opportunities ranked by impact
- ✅ Average time to understand gate failure: < 2 minutes (down from 15+ minutes of Slack back-and-forth)

---

## Current State Assessment

### What Already Exists ✅

**Backend Services** (All Implemented):
```
backend/services/
├── great_expectations_service.py     # Quality rule validation
├── governance_service.py             # Policy compliance checks
├── data_profiling.py                 # YData Profiling integration
├── opa_policy_engine.py              # OPA policy evaluation
├── ranger_policy_generator.py        # Ranger ACL management
└── quality_gates_service.py          # Gate orchestration
```

**API Endpoints** (All Working):
```python
# Quality Gates
POST /api/quality-gates/validate          # Run all gates for a product
GET  /api/quality-gates/history           # Historical gate executions
GET  /api/quality-gates/stats             # Aggregate statistics

# Great Expectations
POST /api/quality/validate                # Run specific validation suite
GET  /api/quality/suites                  # List available suites
POST /api/quality/suites                  # Create new suite

# Data Profiling
POST /api/quality/profile                 # Generate YData profile
GET  /api/quality/profile/{product_id}    # Get existing profile

# Governance
POST /api/governance/validate             # Check OPA policies
GET  /api/governance/policies             # List active policies
GET  /api/governance/violations           # Get policy violations
```

**Data Models** (Defined):
```typescript
interface QualityGateResult {
  gate: string;
  passed: boolean;
  severity: 'blocking' | 'warning' | 'optimization';
  message: string;
  details: any;
  recommendations?: string[];
  executedAt: string;
}

interface QualityGateExecution {
  productId: string;
  executionId: string;
  gates: QualityGateResult[];
  overallStatus: 'passed' | 'warning' | 'blocked';
  executedAt: string;
  duration: number;
}
```

### What's Missing ❌

**Frontend Components**:
- ❌ No `/govern/quality` page to show gate status
- ❌ No real-time gate execution visualization
- ❌ No historical trends dashboard
- ❌ No common failures library
- ❌ No engineer optimization queue

**User Experience Gaps**:
- Users don't see gate results during build flow
- No way to understand why a gate failed
- No historical context for gate decisions
- Engineers have no prioritized optimization list

---

## Phase 1: Implementation Plan

### Week 1, Days 1-2: Core Dashboard Structure (16 hours)

#### Task 1.1: Create Base Layout (4 hours)
**File**: `app/(main)/govern/quality/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function QualityGovernancePage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Quality Gates Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time visibility into automated quality gate executions
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-4 py-2 rounded ${
              timeRange === '24h' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            Last 24h
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded ${
              timeRange === '7d' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded ${
              timeRange === '30d' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            Last 30 days
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="patterns">Common Failures</TabsTrigger>
          <TabsTrigger value="optimize">Optimization Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Overview metrics - implemented in Task 1.2 */}
        </TabsContent>

        <TabsContent value="executions">
          {/* Recent executions table - implemented in Task 1.3 */}
        </TabsContent>

        <TabsContent value="patterns">
          {/* Common failure patterns - implemented in Task 1.4 */}
        </TabsContent>

        <TabsContent value="optimize">
          {/* Engineer optimization queue - implemented in Task 1.5 */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### Task 1.2: Overview Metrics Cards (6 hours)
**Component**: `components/govern/QualityMetricsOverview.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';

interface QualityMetrics {
  totalExecutions: number;
  passedCount: number;
  warningCount: number;
  blockedCount: number;
  passRate: number;
  averageExecutionTime: number;
  topGateFailures: Array<{
    gate: string;
    failureCount: number;
    failureRate: number;
  }>;
  trendsVsPreviousPeriod: {
    passRateChange: number;
    executionsChange: number;
  };
}

async function fetchQualityMetrics(timeRange: string): Promise<QualityMetrics> {
  const res = await fetch(`/api/quality-gates/stats?range=${timeRange}`);
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export function QualityMetricsOverview({ timeRange }: { timeRange: string }) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['quality-metrics', timeRange],
    queryFn: () => fetchQualityMetrics(timeRange),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="h-24 bg-muted" />
          <CardContent className="h-20 bg-muted/50" />
        </Card>
      ))}
    </div>;
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Top-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Executions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Executions
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.trendsVsPreviousPeriod.executionsChange > 0 ? '+' : ''}
              {metrics.trendsVsPreviousPeriod.executionsChange}% vs previous period
            </p>
          </CardContent>
        </Card>

        {/* Pass Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Pass Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.passRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.trendsVsPreviousPeriod.passRateChange > 0 ? '+' : ''}
              {metrics.trendsVsPreviousPeriod.passRateChange.toFixed(1)}% vs previous period
            </p>
          </CardContent>
        </Card>

        {/* Passed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Passed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.passedCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((metrics.passedCount / metrics.totalExecutions) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        {/* Warnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Warnings
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics.warningCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((metrics.warningCount / metrics.totalExecutions) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        {/* Blocked */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Blocked
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.blockedCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((metrics.blockedCount / metrics.totalExecutions) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        {/* Avg Execution Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Execution Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.averageExecutionTime / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per product validation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Gate Failures */}
      <Card>
        <CardHeader>
          <CardTitle>Top Gate Failures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.topGateFailures.map((gate, index) => (
              <div key={gate.gate} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{gate.gate.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                  <div className="text-sm text-muted-foreground">
                    {gate.failureCount} failures ({gate.failureRate.toFixed(1)}% failure rate)
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${gate.failureRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Task 1.3: Recent Executions Table (6 hours)
**Component**: `components/govern/RecentExecutionsTable.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface GateExecution {
  executionId: string;
  productId: string;
  productName: string;
  executedAt: string;
  duration: number;
  overallStatus: 'passed' | 'warning' | 'blocked';
  gates: Array<{
    gate: string;
    passed: boolean;
    severity: 'blocking' | 'warning' | 'optimization';
    message: string;
    recommendations?: string[];
  }>;
}

async function fetchRecentExecutions(timeRange: string): Promise<GateExecution[]> {
  const res = await fetch(`/api/quality-gates/history?range=${timeRange}&limit=50`);
  if (!res.ok) throw new Error('Failed to fetch executions');
  return res.json();
}

export function RecentExecutionsTable({ timeRange }: { timeRange: string }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: executions, isLoading } = useQuery({
    queryKey: ['quality-executions', timeRange],
    queryFn: () => fetchRecentExecutions(timeRange),
    refetchInterval: 30000,
  });

  const toggleRow = (executionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(executionId)) {
      newExpanded.delete(executionId);
    } else {
      newExpanded.add(executionId);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-2">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded" />
      ))}
    </div>;
  }

  if (!executions || executions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No quality gate executions found for this time period.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Executed</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gates</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map((execution) => {
              const isExpanded = expandedRows.has(execution.executionId);
              const passedGates = execution.gates.filter(g => g.passed).length;
              const totalGates = execution.gates.length;

              return (
                <>
                  <TableRow
                    key={execution.executionId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleRow(execution.executionId)}
                  >
                    <TableCell>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/discover/${execution.productId}`}
                        className="hover:underline flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {execution.productName}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(execution.executedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(execution.duration / 1000).toFixed(2)}s
                    </TableCell>
                    <TableCell>
                      {execution.overallStatus === 'passed' && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Passed
                        </Badge>
                      )}
                      {execution.overallStatus === 'warning' && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Warning
                        </Badge>
                      )}
                      {execution.overallStatus === 'blocked' && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {passedGates} / {totalGates} passed
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(execution.executionId);
                        }}
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row - Gate Details */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/30">
                        <div className="py-4 space-y-3">
                          <div className="font-semibold text-sm">Gate Results:</div>
                          {execution.gates.map((gate, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border ${
                                gate.passed
                                  ? 'bg-green-50 border-green-200'
                                  : gate.severity === 'blocking'
                                  ? 'bg-red-50 border-red-200'
                                  : gate.severity === 'warning'
                                  ? 'bg-yellow-50 border-yellow-200'
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {gate.passed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : gate.severity === 'blocking' ? (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  ) : (
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {gate.gate.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {gate.severity}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {gate.message}
                                  </div>
                                  {gate.recommendations && gate.recommendations.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <div className="text-xs font-semibold">Recommendations:</div>
                                      <ul className="text-xs space-y-1 list-disc list-inside">
                                        {gate.recommendations.map((rec, i) => (
                                          <li key={i}>{rec}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

---

### Week 1, Days 3-4: Common Failure Patterns (12 hours)

#### Task 1.4: Failure Pattern Library (8 hours)
**Component**: `components/govern/FailurePatternsLibrary.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  BookOpen,
  ExternalLink,
  TrendingUp,
  Code
} from 'lucide-react';
import { useState } from 'react';

interface FailurePattern {
  pattern: string;
  gate: string;
  frequency: number;
  severity: 'blocking' | 'warning' | 'optimization';
  commonCauses: string[];
  howToFix: string[];
  codeExamples: Array<{
    language: string;
    code: string;
    description: string;
  }>;
  relatedDocumentation: Array<{
    title: string;
    url: string;
  }>;
}

async function fetchFailurePatterns(): Promise<FailurePattern[]> {
  const res = await fetch('/api/quality-gates/patterns');
  if (!res.ok) throw new Error('Failed to fetch patterns');
  return res.json();
}

export function FailurePatternsLibrary() {
  const [selectedPattern, setSelectedPattern] = useState<FailurePattern | null>(null);

  const { data: patterns, isLoading } = useQuery({
    queryKey: ['failure-patterns'],
    queryFn: fetchFailurePatterns,
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="h-20 bg-muted" />
          <CardContent className="h-32 bg-muted/50" />
        </Card>
      ))}
    </div>;
  }

  if (!patterns || patterns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No failure patterns identified yet. As quality gates run, common patterns will appear here.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pattern List */}
      <div className="lg:col-span-1 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Common Failure Patterns</h3>
        </div>
        {patterns
          .sort((a, b) => b.frequency - a.frequency)
          .map((pattern) => (
            <Card
              key={pattern.pattern}
              className={`cursor-pointer transition-colors ${
                selectedPattern?.pattern === pattern.pattern
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedPattern(pattern)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">
                      {pattern.pattern}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pattern.gate.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      pattern.severity === 'blocking'
                        ? 'bg-red-100 text-red-700'
                        : pattern.severity === 'warning'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }
                  >
                    {pattern.severity}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{pattern.frequency} occurrences</span>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Pattern Details */}
      <div className="lg:col-span-2">
        {selectedPattern ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedPattern.pattern}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Gate: {selectedPattern.gate.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    selectedPattern.severity === 'blocking'
                      ? 'bg-red-100 text-red-700'
                      : selectedPattern.severity === 'warning'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }
                >
                  {selectedPattern.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Common Causes */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Common Causes
                </h4>
                <ul className="space-y-2 text-sm">
                  {selectedPattern.commonCauses.map((cause, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How to Fix */}
              <div>
                <h4 className="font-semibold text-sm mb-2">How to Fix</h4>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  {selectedPattern.howToFix.map((step, idx) => (
                    <li key={idx} className="ml-2">{step}</li>
                  ))}
                </ol>
              </div>

              {/* Code Examples */}
              {selectedPattern.codeExamples.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Code Examples
                  </h4>
                  <div className="space-y-4">
                    {selectedPattern.codeExamples.map((example, idx) => (
                      <div key={idx}>
                        <div className="text-xs text-muted-foreground mb-2">
                          {example.description}
                        </div>
                        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Documentation */}
              {selectedPattern.relatedDocumentation.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Related Documentation</h4>
                  <div className="space-y-2">
                    {selectedPattern.relatedDocumentation.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {doc.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
              Select a failure pattern to view details and solutions
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

#### Task 1.5: Backend API for Failure Patterns (4 hours)
**File**: `app/api/quality-gates/patterns/route.ts`

```typescript
import { NextResponse } from 'next/server';

// This would typically query from a database of historical gate failures
// For now, we'll return common patterns based on Great Expectations and governance
export async function GET() {
  // In production, this would aggregate from actual gate execution history
  const patterns = [
    {
      pattern: "Uniqueness Constraint Violation",
      gate: "great_expectations_uniqueness",
      frequency: 45,
      severity: "blocking",
      commonCauses: [
        "Duplicate records in source data",
        "Missing GROUP BY in aggregation query",
        "Incorrect join condition creating cartesian product",
        "Data ingestion running multiple times without deduplication"
      ],
      howToFix: [
        "Add DISTINCT clause to SELECT statement",
        "Implement ROW_NUMBER() with partition to deduplicate",
        "Add unique constraint at source",
        "Use incremental processing with proper watermarking"
      ],
      codeExamples: [
        {
          language: "sql",
          description: "Use DISTINCT to ensure uniqueness",
          code: `SELECT DISTINCT
  customer_id,
  customer_name,
  email
FROM source_table
WHERE date = CURRENT_DATE`
        },
        {
          language: "sql",
          description: "Use ROW_NUMBER() for deduplication",
          code: `WITH deduped AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY updated_at DESC
    ) as rn
  FROM source_table
)
SELECT * FROM deduped WHERE rn = 1`
        }
      ],
      relatedDocumentation: [
        {
          title: "Great Expectations: Uniqueness",
          url: "https://docs.greatexpectations.io/docs/reference/expectations/uniqueness"
        },
        {
          title: "SQL Deduplication Strategies",
          url: "/docs/sql-patterns/deduplication"
        }
      ]
    },
    {
      pattern: "NULL Values in Required Column",
      gate: "great_expectations_not_null",
      frequency: 38,
      severity: "blocking",
      commonCauses: [
        "Incomplete data in source system",
        "Left join creating NULL values",
        "Missing default value in CASE statement",
        "Data type conversion failing"
      ],
      howToFix: [
        "Add COALESCE() to provide default values",
        "Change LEFT JOIN to INNER JOIN if nulls not expected",
        "Add ELSE clause to CASE statements",
        "Validate source data quality before ingestion"
      ],
      codeExamples: [
        {
          language: "sql",
          description: "Use COALESCE for default values",
          code: `SELECT
  customer_id,
  COALESCE(email, 'unknown@example.com') as email,
  COALESCE(phone, 'N/A') as phone
FROM customers`
        }
      ],
      relatedDocumentation: [
        {
          title: "Handling NULL Values in SQL",
          url: "/docs/sql-patterns/null-handling"
        }
      ]
    },
    {
      pattern: "PII Detected Without Masking Policy",
      gate: "ranger_pii_masking",
      frequency: 32,
      severity: "blocking",
      commonCauses: [
        "Email/phone/SSN columns not identified as PII",
        "New PII column added without classification update",
        "Regex pattern not matching all PII formats",
        "Derived column containing PII not flagged"
      ],
      howToFix: [
        "Add data classification tags to schema",
        "Apply Ranger masking policy for PII columns",
        "Use HASH() or MASK() functions in SQL",
        "Request access elevation if PII access is required"
      ],
      codeExamples: [
        {
          language: "sql",
          description: "Hash PII values for analysis",
          code: `SELECT
  SHA256(email) as email_hash,
  SUBSTR(phone, -4) as phone_last4,
  customer_name
FROM customers`
        }
      ],
      relatedDocumentation: [
        {
          title: "PII Detection & Masking",
          url: "/docs/governance/pii-handling"
        }
      ]
    },
    {
      pattern: "Query Performance Exceeds Threshold",
      gate: "performance_check",
      frequency: 28,
      severity: "warning",
      commonCauses: [
        "Full table scan without partitioning",
        "Missing indexes on join columns",
        "Complex aggregations without pre-aggregation",
        "Scanning too much historical data"
      ],
      howToFix: [
        "Add WHERE clause to filter by partition column (e.g., date)",
        "Use incremental processing instead of full refresh",
        "Consider materializing intermediate results",
        "Add appropriate indexes in source database"
      ],
      codeExamples: [
        {
          language: "sql",
          description: "Use partition filters for performance",
          code: `SELECT *
FROM large_table
WHERE date_partition >= CURRENT_DATE - INTERVAL '7' DAY
  AND date_partition < CURRENT_DATE`
        }
      ],
      relatedDocumentation: [
        {
          title: "Query Performance Optimization",
          url: "/docs/optimization/query-performance"
        }
      ]
    },
    {
      pattern: "Missing Documentation",
      gate: "documentation_check",
      frequency: 56,
      severity: "warning",
      commonCauses: [
        "Column descriptions not provided",
        "Business context not documented",
        "Data lineage not explained",
        "Example queries missing"
      ],
      howToFix: [
        "Add description to each column in schema editor",
        "Write business purpose in product definition",
        "Document data sources and transformations",
        "Provide sample queries for common use cases"
      ],
      codeExamples: [],
      relatedDocumentation: [
        {
          title: "Documentation Best Practices",
          url: "/docs/best-practices/documentation"
        }
      ]
    }
  ];

  return NextResponse.json(patterns);
}
```

---

### Week 1, Days 5: Engineer Optimization Queue (8 hours)

#### Task 1.6: Optimization Queue Component (8 hours)
**Component**: `components/govern/OptimizationQueue.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Zap,
  TrendingDown,
  Clock,
  DollarSign,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface OptimizationOpportunity {
  productId: string;
  productName: string;
  priority: 'high' | 'medium' | 'low';
  impactCategory: 'cost' | 'performance' | 'quality';
  recommendation: string;
  estimatedImpact: {
    metric: string;
    current: string;
    improved: string;
    improvement: string;
  };
  effort: 'quick' | 'moderate' | 'significant';
  implementation: {
    steps: string[];
    codeExample?: string;
  };
  createdAt: string;
  acknowledged: boolean;
}

async function fetchOptimizationQueue(): Promise<OptimizationOpportunity[]> {
  const res = await fetch('/api/quality-gates/optimization-queue');
  if (!res.ok) throw new Error('Failed to fetch optimization queue');
  return res.json();
}

async function acknowledgeOptimization(productId: string, recommendation: string) {
  const res = await fetch('/api/quality-gates/optimization-acknowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, recommendation }),
  });
  if (!res.ok) throw new Error('Failed to acknowledge optimization');
  return res.json();
}

export function OptimizationQueue() {
  const { data: opportunities, isLoading, refetch } = useQuery({
    queryKey: ['optimization-queue'],
    queryFn: fetchOptimizationQueue,
    refetchInterval: 60000, // Refresh every minute
  });

  const handleAcknowledge = async (productId: string, recommendation: string) => {
    await acknowledgeOptimization(productId, recommendation);
    refetch();
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="h-32 bg-muted" />
        </Card>
      ))}
    </div>;
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
          <div className="font-semibold text-lg">All Caught Up!</div>
          <div className="text-sm">No optimization opportunities at this time</div>
        </CardContent>
      </Card>
    );
  }

  // Group by priority
  const byPriority = {
    high: opportunities.filter(o => o.priority === 'high' && !o.acknowledged),
    medium: opportunities.filter(o => o.priority === 'medium' && !o.acknowledged),
    low: opportunities.filter(o => o.priority === 'low' && !o.acknowledged),
  };

  const ImpactIcon = ({ category }: { category: string }) => {
    switch (category) {
      case 'cost': return <DollarSign className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'quality': return <TrendingDown className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">
              {byPriority.high.length}
            </div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {byPriority.medium.length}
            </div>
            <div className="text-sm text-muted-foreground">Medium Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {byPriority.low.length}
            </div>
            <div className="text-sm text-muted-foreground">Low Priority</div>
          </CardContent>
        </Card>
      </div>

      {/* High Priority Opportunities */}
      {byPriority.high.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4 text-red-600">
            🔴 High Priority Optimizations
          </h3>
          <div className="space-y-3">
            {byPriority.high.map((opp, idx) => (
              <OpportunityCard
                key={idx}
                opportunity={opp}
                onAcknowledge={handleAcknowledge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Opportunities */}
      {byPriority.medium.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4 text-yellow-600">
            🟡 Medium Priority Optimizations
          </h3>
          <div className="space-y-3">
            {byPriority.medium.map((opp, idx) => (
              <OpportunityCard
                key={idx}
                opportunity={opp}
                onAcknowledge={handleAcknowledge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority Opportunities */}
      {byPriority.low.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4 text-blue-600">
            🔵 Low Priority Optimizations
          </h3>
          <div className="space-y-3">
            {byPriority.low.map((opp, idx) => (
              <OpportunityCard
                key={idx}
                opportunity={opp}
                onAcknowledge={handleAcknowledge}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OpportunityCard({
  opportunity,
  onAcknowledge
}: {
  opportunity: OptimizationOpportunity;
  onAcknowledge: (productId: string, recommendation: string) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link
              href={`/discover/${opportunity.productId}`}
              className="hover:underline flex items-center gap-2 text-lg font-semibold"
            >
              {opportunity.productName}
              <ExternalLink className="h-4 w-4" />
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {opportunity.recommendation}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge
              variant="secondary"
              className={
                opportunity.priority === 'high'
                  ? 'bg-red-100 text-red-700'
                  : opportunity.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-100 text-blue-700'
              }
            >
              {opportunity.priority} priority
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {opportunity.impactCategory === 'cost' && <DollarSign className="h-3 w-3" />}
              {opportunity.impactCategory === 'performance' && <Zap className="h-3 w-3" />}
              {opportunity.impactCategory === 'quality' && <TrendingDown className="h-3 w-3" />}
              {opportunity.impactCategory}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estimated Impact */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-sm font-semibold mb-2">Estimated Impact</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Current</div>
              <div className="font-semibold">{opportunity.estimatedImpact.current}</div>
            </div>
            <div>
              <div className="text-muted-foreground">After Optimization</div>
              <div className="font-semibold text-green-600">
                {opportunity.estimatedImpact.improved}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Improvement</div>
              <div className="font-semibold text-green-600">
                {opportunity.estimatedImpact.improvement}
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Steps */}
        <div>
          <div className="text-sm font-semibold mb-2">Implementation Steps</div>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            {opportunity.implementation.steps.map((step, idx) => (
              <li key={idx} className="ml-2">{step}</li>
            ))}
          </ol>
        </div>

        {/* Code Example */}
        {opportunity.implementation.codeExample && (
          <div>
            <div className="text-sm font-semibold mb-2">Code Example</div>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              <code>{opportunity.implementation.codeExample}</code>
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{opportunity.effort} effort</span>
            </div>
            <div>
              Created {new Date(opportunity.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAcknowledge(opportunity.productId, opportunity.recommendation)}
            >
              Mark as Acknowledged
            </Button>
            <Button variant="default" size="sm">
              Start Optimization
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Week 2: Backend Integration & Polish (40 hours)

### Backend API Implementations

#### API 1: Quality Gate Stats Endpoint
**File**: `app/api/quality-gates/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '7d';

  // In production, this would query from database
  // For now, mock data based on existing gate execution logs

  const stats = {
    totalExecutions: 342,
    passedCount: 298,
    warningCount: 32,
    blockedCount: 12,
    passRate: 87.1,
    averageExecutionTime: 2340, // milliseconds
    topGateFailures: [
      {
        gate: 'great_expectations_uniqueness',
        failureCount: 18,
        failureRate: 5.3
      },
      {
        gate: 'great_expectations_not_null',
        failureCount: 12,
        failureRate: 3.5
      },
      {
        gate: 'ranger_pii_masking',
        failureCount: 8,
        failureRate: 2.3
      },
      {
        gate: 'documentation_check',
        failureCount: 24,
        failureRate: 7.0
      },
      {
        gate: 'performance_check',
        failureCount: 15,
        failureRate: 4.4
      }
    ],
    trendsVsPreviousPeriod: {
      passRateChange: 2.3,
      executionsChange: 15.2
    }
  };

  return NextResponse.json(stats);
}
```

#### API 2: Quality Gate History Endpoint
**File**: `app/api/quality-gates/history/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '7d';
  const limit = parseInt(searchParams.get('limit') || '50');

  // In production, query from execution history database
  // For now, return mock recent executions

  const executions = [
    {
      executionId: 'exec_001',
      productId: 'prod_customer_360',
      productName: 'Customer 360',
      executedAt: new Date().toISOString(),
      duration: 2340,
      overallStatus: 'passed',
      gates: [
        {
          gate: 'great_expectations_uniqueness',
          passed: true,
          severity: 'blocking',
          message: 'All uniqueness constraints satisfied',
          recommendations: []
        },
        {
          gate: 'great_expectations_not_null',
          passed: true,
          severity: 'blocking',
          message: 'No null values in required columns',
          recommendations: []
        },
        {
          gate: 'ranger_pii_masking',
          passed: true,
          severity: 'blocking',
          message: 'All PII columns have masking policies',
          recommendations: []
        },
        {
          gate: 'documentation_check',
          passed: true,
          severity: 'warning',
          message: 'Documentation complete',
          recommendations: []
        },
        {
          gate: 'performance_check',
          passed: false,
          severity: 'optimization',
          message: 'Query could be optimized',
          recommendations: [
            'Consider adding date partition filter',
            'Materialize intermediate aggregations',
            'Add index on customer_id column'
          ]
        }
      ]
    },
    // More executions...
  ];

  return NextResponse.json(executions.slice(0, limit));
}
```

#### API 3: Optimization Queue Endpoint
**File**: `app/api/quality-gates/optimization-queue/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  // In production, this would aggregate all Tier 3 gate failures
  // and rank them by estimated impact

  const opportunities = [
    {
      productId: 'prod_revenue_dashboard',
      productName: 'Revenue Dashboard',
      priority: 'high',
      impactCategory: 'cost',
      recommendation: 'Add date partitioning to reduce query costs',
      estimatedImpact: {
        metric: 'Monthly Query Cost',
        current: '$850/month',
        improved: '$120/month',
        improvement: '86% reduction'
      },
      effort: 'quick',
      implementation: {
        steps: [
          'Add WHERE clause filtering by date_partition column',
          'Update materialization schedule to daily increments',
          'Test query performance with sample data',
          'Deploy and monitor cost reduction'
        ],
        codeExample: `-- Add partition filter
SELECT *
FROM revenue_facts
WHERE date_partition >= CURRENT_DATE - INTERVAL '90' DAY
  AND date_partition < CURRENT_DATE`
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      acknowledged: false
    },
    {
      productId: 'prod_customer_churn',
      productName: 'Customer Churn Predictions',
      priority: 'medium',
      impactCategory: 'performance',
      recommendation: 'Materialize feature aggregations for faster inference',
      estimatedImpact: {
        metric: 'Query Latency',
        current: '45 seconds',
        improved: '3 seconds',
        improvement: '93% faster'
      },
      effort: 'moderate',
      implementation: {
        steps: [
          'Create materialized view for feature aggregations',
          'Schedule nightly refresh of materialized view',
          'Update inference query to read from materialized view',
          'Monitor refresh duration and query performance'
        ],
        codeExample: `CREATE MATERIALIZED VIEW customer_features_mv AS
SELECT
  customer_id,
  COUNT(DISTINCT order_id) as order_count,
  SUM(order_total) as lifetime_value,
  AVG(order_total) as avg_order_value
FROM orders
GROUP BY customer_id`
      },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      acknowledged: false
    },
    // More opportunities...
  ];

  return NextResponse.json(opportunities);
}
```

---

## Success Metrics & Validation

### Week 1 Success Criteria
- ✅ `/govern/quality` page loads with all tabs functional
- ✅ Real-time metrics update every 30 seconds
- ✅ Can expand/collapse execution details
- ✅ Failure patterns library shows top 5 patterns
- ✅ Code examples are properly formatted

### Week 2 Success Criteria
- ✅ All API endpoints return data (mock or real)
- ✅ Optimization queue shows prioritized opportunities
- ✅ Engineers can acknowledge optimizations
- ✅ Historical trends show 7-day, 30-day views
- ✅ Page performance: < 2 second load time

### User Acceptance Criteria
- ✅ User can understand why a gate failed in < 2 minutes
- ✅ Engineer can find highest-impact optimization in < 1 minute
- ✅ Dashboard shows real-time status without refresh
- ✅ Failure patterns library reduces Slack questions by 60%

---

## Next Phase Preview

### Phase 2: Post-Deployment Monitoring (Week 3-4)
- SLA breach detection and alerting
- Quality score degradation monitoring
- Cost spike detection
- Auto-create optimization tickets

### Phase 3: Cost Visibility (Week 5)
- Real-time cost estimation during build
- Product-level cost dashboard
- Team-level cost rollup
- Budget alerts

---

## Technical Dependencies

### Frontend
- ✅ Next.js 14 (already installed)
- ✅ TanStack Query (already installed)
- ✅ shadcn/ui components (already installed)
- ✅ Lucide icons (already installed)

### Backend
- ✅ Great Expectations service (already implemented)
- ✅ Governance service (already implemented)
- ✅ YData Profiling (already implemented)
- ✅ FastAPI backend (already running)

### New Dependencies
- ❌ None! Everything uses existing stack

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Backend APIs not returning expected data | Start with mock data, gradually replace with real queries |
| Performance issues with real-time updates | Use 30-second polling, add caching layer |
| Users overwhelmed by optimization queue | Sort by impact, show only top 20 initially |
| Historical data not available | Start collecting now, backfill if needed |

---

## Deployment Checklist

- [ ] Create `/govern/quality/page.tsx`
- [ ] Implement all 6 components
- [ ] Create 3 API endpoints
- [ ] Test with mock data
- [ ] Connect to real Great Expectations service
- [ ] Test with sample gate executions
- [ ] Performance test with 1000+ executions
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor usage and iterate

---

**End of Phase 1 Implementation Plan**
