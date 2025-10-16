'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Rocket,
  Search,
  Activity,
  Code,
  Database,
  BarChart2,
  Shield,
  Settings,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PlayCircle,
  Zap,
  Target,
  ExternalLink,
  Check,
  Radio,
  Package,
  GitBranch,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRecentPages } from '@/hooks/use-recent-pages';

// Role detection - in production, get from auth context
// For now, check environment or use default
const getUserRole = (): 'producer' | 'consumer' => {
  // TODO: Replace with actual auth context
  // return user.role === 'data_engineer' || user.role === 'analytics_engineer' ? 'producer' : 'consumer';
  return 'producer'; // Default for now
};

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  roles: ('producer' | 'consumer')[];
}

// Icon map for dynamic icon rendering
const ICON_MAP: Record<string, any> = {
  Rocket,
  Search,
  Activity,
  Code,
  Database,
  BarChart2,
  Shield,
  Settings,
};

// Pipeline execution interface
interface PipelineExecution {
  executionId: string;
  pipelineId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  metrics?: {
    recordsProcessed: number;
    duration: number;
  };
  pipelineType?: 'ingestion' | 'product';
  ingestionMethod?: 'cdc' | 'batch' | 'stream';
  source?: string;
  destination?: string;
  contract?: string;
}

// View mode type
type ViewMode = 'engineer' | 'consumer' | 'hybrid';

// Product Portfolio interface
interface ProductPortfolio {
  overall: 'healthy' | 'degraded' | 'critical';
  totalContracts: number;
  totalProducts: number;
  healthDistribution: {
    healthy: number;
    atRisk: number;
    critical: number;
  };
  metrics: {
    qualityGatePassRate: number;
    sloCompliance: number;
    avgTimeToDeployHours: number;
  };
  summary: string;
}

// Issue interface
interface Issue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  businessImpact: string;
  timestamp: string;
  source: string;
  affectedDomain?: string;
}

export default function OverviewPage() {
  const userRole = getUserRole();
  const recentPages = useRecentPages();
  const [pipelineRuns, setPipelineRuns] = useState<PipelineExecution[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [portfolio, setPortfolio] = useState<ProductPortfolio | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('engineer'); // Default to engineer view

  // Separate ingestion and product pipelines
  const ingestionPipelines = pipelineRuns.filter(p => p.pipelineType === 'ingestion');
  const productPipelines = pipelineRuns.filter(p => p.pipelineType === 'product');

  // Fetch recent pipeline executions
  useEffect(() => {
    const fetchPipelineRuns = async () => {
      try {
        const response = await fetch('/api/pipelines/execute');
        const data = await response.json();
        // Get last 8 executions
        const recentRuns = Array.isArray(data) ? data.slice(0, 8) : [];

        // If no data from API, use mock data for demo
        if (recentRuns.length === 0) {
          const now = Date.now();
          const mockRuns: PipelineExecution[] = [
            // INGESTION PIPELINES
            {
              executionId: 'exec-ing-1',
              pipelineId: 'salesforce_cdc_sync',
              status: 'completed',
              startTime: new Date(now - 7200000).toISOString(),
              endTime: new Date(now - 7140000).toISOString(),
              metrics: {
                recordsProcessed: 15420,
                duration: 60000
              },
              pipelineType: 'ingestion',
              ingestionMethod: 'cdc',
              source: 'Salesforce CRM',
              destination: 'iceberg.foundation.salesforce_raw'
            },
            {
              executionId: 'exec-ing-2',
              pipelineId: 'mysql_batch_orders',
              status: 'completed',
              startTime: new Date(now - 14400000).toISOString(),
              endTime: new Date(now - 14220000).toISOString(),
              metrics: {
                recordsProcessed: 124850,
                duration: 180000
              },
              pipelineType: 'ingestion',
              ingestionMethod: 'batch',
              source: 'MySQL Production',
              destination: 'iceberg.foundation.orders_raw'
            },
            {
              executionId: 'exec-ing-3',
              pipelineId: 'kafka_events_stream',
              status: 'running',
              startTime: new Date(now - 300000).toISOString(),
              metrics: {
                recordsProcessed: 48750,
                duration: 0
              },
              pipelineType: 'ingestion',
              ingestionMethod: 'stream',
              source: 'Kafka Events Topic',
              destination: 'iceberg.foundation.events_raw'
            },
            // DATA PRODUCT PIPELINES
            {
              executionId: 'exec-prod-1',
              pipelineId: 'customer_360_refresh',
              status: 'completed',
              startTime: new Date(now - 3600000).toISOString(),
              endTime: new Date(now - 3540000).toISOString(),
              metrics: {
                recordsProcessed: 124850,
                duration: 60000
              },
              pipelineType: 'product',
              contract: 'customer_360 v3.0'
            },
            {
              executionId: 'exec-prod-2',
              pipelineId: 'sales_aggregation_daily',
              status: 'completed',
              startTime: new Date(now - 7200000).toISOString(),
              endTime: new Date(now - 7020000).toISOString(),
              metrics: {
                recordsProcessed: 50000,
                duration: 180000
              },
              pipelineType: 'product',
              contract: 'sales_metrics_daily v2.1'
            },
            {
              executionId: 'exec-prod-3',
              pipelineId: 'churn_model_training',
              status: 'failed',
              startTime: new Date(now - 10800000).toISOString(),
              endTime: new Date(now - 10740000).toISOString(),
              metrics: {
                recordsProcessed: 12500,
                duration: 60000
              },
              pipelineType: 'product',
              contract: 'customer_churn_score v2.0'
            }
          ];
          setPipelineRuns(mockRuns);
        } else {
          setPipelineRuns(recentRuns);
        }
      } catch (error) {
        console.error('Failed to fetch pipeline runs:', error);

        // Use mock data as fallback
        const now = Date.now();
        const mockRuns: PipelineExecution[] = [
          // INGESTION PIPELINES
          {
            executionId: 'exec-ing-1',
            pipelineId: 'salesforce_cdc_sync',
            status: 'completed',
            startTime: new Date(now - 7200000).toISOString(),
            endTime: new Date(now - 7140000).toISOString(),
            metrics: {
              recordsProcessed: 15420,
              duration: 60000
            },
            pipelineType: 'ingestion',
            ingestionMethod: 'cdc',
            source: 'Salesforce CRM',
            destination: 'iceberg.foundation.salesforce_raw'
          },
          {
            executionId: 'exec-ing-2',
            pipelineId: 'mysql_batch_orders',
            status: 'completed',
            startTime: new Date(now - 14400000).toISOString(),
            endTime: new Date(now - 14220000).toISOString(),
            metrics: {
              recordsProcessed: 124850,
              duration: 180000
            },
            pipelineType: 'ingestion',
            ingestionMethod: 'batch',
            source: 'MySQL Production',
            destination: 'iceberg.foundation.orders_raw'
          },
          {
            executionId: 'exec-ing-3',
            pipelineId: 'kafka_events_stream',
            status: 'running',
            startTime: new Date(now - 300000).toISOString(),
            metrics: {
              recordsProcessed: 48750,
              duration: 0
            },
            pipelineType: 'ingestion',
            ingestionMethod: 'stream',
            source: 'Kafka Events Topic',
            destination: 'iceberg.foundation.events_raw'
          },
          // DATA PRODUCT PIPELINES
          {
            executionId: 'exec-prod-1',
            pipelineId: 'customer_360_refresh',
            status: 'completed',
            startTime: new Date(now - 3600000).toISOString(),
            endTime: new Date(now - 3540000).toISOString(),
            metrics: {
              recordsProcessed: 124850,
              duration: 60000
            },
            pipelineType: 'product',
            contract: 'customer_360 v3.0'
          },
          {
            executionId: 'exec-prod-2',
            pipelineId: 'sales_aggregation_daily',
            status: 'completed',
            startTime: new Date(now - 7200000).toISOString(),
            endTime: new Date(now - 7020000).toISOString(),
            metrics: {
              recordsProcessed: 50000,
              duration: 180000
            },
            pipelineType: 'product',
            contract: 'sales_metrics_daily v2.1'
          },
          {
            executionId: 'exec-prod-3',
            pipelineId: 'churn_model_training',
            status: 'failed',
            startTime: new Date(now - 10800000).toISOString(),
            endTime: new Date(now - 10740000).toISOString(),
            metrics: {
              recordsProcessed: 12500,
              duration: 60000
            },
            pipelineType: 'product',
            contract: 'customer_churn_score v2.0'
          }
        ];
        setPipelineRuns(mockRuns);
      } finally {
        setLoadingPipelines(false);
      }
    };

    fetchPipelineRuns();
  }, []);

  // Fetch product portfolio health
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('/api/overview');
        const data = await response.json();
        setPortfolio(data.productPortfolio);
      } catch (error) {
        console.error('Failed to fetch product portfolio:', error);
      } finally {
        setLoadingPortfolio(false);
      }
    };

    fetchPortfolio();
  }, []);

  // Fetch active issues
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch('/api/monitor/issues');
        const data = await response.json();
        // Get top 3 critical/warning issues
        const activeIssues = data.issues
          .filter((issue: Issue) => issue.severity === 'critical' || issue.severity === 'warning')
          .slice(0, 3);
        setIssues(activeIssues);
      } catch (error) {
        console.error('Failed to fetch issues:', error);
      } finally {
        setLoadingIssues(false);
      }
    };

    fetchIssues();
  }, []);

  // Quick actions - role-based (Producer vs Consumer)
  const allQuickActions: QuickAction[] = [
    // PRODUCER ACTIONS
    {
      id: 'build',
      title: 'Build Data Product',
      description: 'Create new data product with guided workflow',
      icon: Rocket,
      href: '/build',
      roles: ['producer']
    },
    {
      id: 'operations',
      title: 'Monitor Operations',
      description: 'View pipeline health and system status',
      icon: Activity,
      href: '/operations',
      roles: ['producer']
    },
    {
      id: 'develop',
      title: 'Write SQL',
      description: 'AI-powered SQL workstation',
      icon: Code,
      href: '/develop',
      roles: ['producer']
    },
    {
      id: 'sources',
      title: 'Manage Sources',
      description: 'Configure data source connections',
      icon: Database,
      href: '/operations/connections',
      roles: ['producer']
    },

    // CONSUMER ACTIONS
    {
      id: 'discover',
      title: 'Discover Data',
      description: 'Search and explore data products',
      icon: Search,
      href: '/discover',
      roles: ['consumer', 'producer']
    },
    {
      id: 'query',
      title: 'Run Query',
      description: 'Execute SQL queries on data products',
      icon: Code,
      href: '/develop',
      roles: ['consumer']
    },
    {
      id: 'analyze',
      title: 'Analyze Data',
      description: 'View dashboards and reports',
      icon: BarChart2,
      href: '/discover',
      roles: ['consumer']
    }
  ];

  // Filter actions by role (show top 4)
  const quickActions = allQuickActions
    .filter(action => action.roles.includes(userRole))
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-8">

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.id} href={action.href}>
                  <Card className="p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary/50 h-full group">
                    <div className="space-y-2.5">
                      <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5.5 h-5.5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-0.5">{action.title}</h3>
                        <p className="text-sm text-muted-foreground leading-snug">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <div className="inline-flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setViewMode('engineer')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                viewMode === 'engineer'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Engineer
            </button>
            <button
              onClick={() => setViewMode('consumer')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                viewMode === 'consumer'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Consumer
            </button>
            <button
              onClick={() => setViewMode('hybrid')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                viewMode === 'hybrid'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Hybrid
            </button>
          </div>
        </div>

        {/* Product Portfolio Health */}
        {!loadingPortfolio && portfolio && (
          <Card className={cn(
            "p-4 border-l-4 bg-muted/50",
            portfolio.overall === 'healthy' && "border-l-green-500",
            portfolio.overall === 'degraded' && "border-l-yellow-500",
            portfolio.overall === 'critical' && "border-l-red-500"
          )}>
            <div className="space-y-4">
              {/* Header with Icon and Summary */}
              <div className="flex items-start gap-3">
                {portfolio.overall === 'healthy' && (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                )}
                {portfolio.overall === 'degraded' && (
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                )}
                {portfolio.overall === 'critical' && (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base mb-1">
                    Product Portfolio {portfolio.overall === 'healthy' ? 'Healthy' : portfolio.overall === 'degraded' ? 'Degraded' : 'Critical'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {portfolio.summary}
                  </p>
                </div>
              </div>

              {/* Portfolio Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Total Contracts */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold">{portfolio.totalContracts}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Active Contracts</div>
                </div>

                {/* Total Products */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold">{portfolio.totalProducts}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Data Products</div>
                </div>

                {/* Quality Gate Pass Rate */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold">{portfolio.metrics.qualityGatePassRate}%</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Quality Pass Rate</div>
                </div>

                {/* SLO Compliance */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold">{portfolio.metrics.sloCompliance}%</div>
                  <div className="text-xs text-muted-foreground mt-0.5">SLO Compliance</div>
                </div>
              </div>

              {/* Health Distribution */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium">{portfolio.healthDistribution.healthy}</span>
                  <span className="text-muted-foreground">healthy</span>
                </div>
                {portfolio.healthDistribution.atRisk > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-medium">{portfolio.healthDistribution.atRisk}</span>
                    <span className="text-muted-foreground">at risk</span>
                  </div>
                )}
                {portfolio.healthDistribution.critical > 0 && (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="font-medium">{portfolio.healthDistribution.critical}</span>
                    <span className="text-muted-foreground">critical</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Contracts & Products Requiring Attention */}
        {!loadingIssues && issues.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Contracts Requiring Attention</h2>
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium ml-2",
                issues.filter(i => i.severity === 'critical').length > 0
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              )}>
                {issues.length}
              </span>
            </div>
            <div className="space-y-3">
              {issues.map((issue) => (
                <Card key={issue.id} className={cn(
                  "p-3 hover:shadow-lg transition-all border-l-4 bg-muted/50",
                  issue.severity === 'critical' && "border-l-red-500",
                  issue.severity === 'warning' && "border-l-yellow-500"
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        issue.severity === 'critical' && "bg-red-100 dark:bg-red-900/30",
                        issue.severity === 'warning' && "bg-yellow-100 dark:bg-yellow-900/30"
                      )}>
                        {issue.severity === 'critical' && (
                          <XCircle className="w-4.5 h-4.5 text-red-600 dark:text-red-400" />
                        )}
                        {issue.severity === 'warning' && (
                          <AlertCircle className="w-4.5 h-4.5 text-yellow-600 dark:text-yellow-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium text-sm">{issue.title}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            issue.severity === 'critical' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                            issue.severity === 'warning' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          )}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {issue.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {issue.businessImpact}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{getTimeAgo(new Date(issue.timestamp).getTime())}</span>
                          {issue.affectedDomain && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="px-2 py-0.5 rounded bg-muted/30 text-foreground">
                                {issue.affectedDomain}
                              </span>
                            </>
                          )}
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">Source: {issue.source}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity - Engineer View: Split into Ingestion and Products */}
        {viewMode === 'engineer' && !loadingPipelines && (
          <>
            {/* Data Ingestion Activity */}
            {ingestionPipelines.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Data Ingestion</h2>
                  <span className="text-xs text-muted-foreground ml-1">(Foundation Products)</span>
                </div>
                <div className="space-y-3">
                  {ingestionPipelines.map((run) => {
                    const statusIcon = getStatusIcon(run.status);
                    const statusColor = getStatusColor(run.status);
                    const timeAgo = getTimeAgo(new Date(run.startTime).getTime());
                    const duration = run.metrics?.duration ? formatDuration(run.metrics.duration) : null;

                    return (
                      <Card key={run.executionId} className="p-3 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                              statusColor
                            )}>
                              {run.ingestionMethod === 'cdc' && <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                              {run.ingestionMethod === 'batch' && <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                              {run.ingestionMethod === 'stream' && <Radio className="w-5 h-5 text-green-600 dark:text-green-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{run.source}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground truncate">{run.destination}</span>
                              </div>
                              <div className="flex items-center gap-2.5 text-xs text-muted-foreground mt-0.5">
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded font-medium",
                                  getStatusBadgeColor(run.status)
                                )}>
                                  {run.status}
                                </span>
                                <span>•</span>
                                <span className="uppercase text-xs font-medium">{run.ingestionMethod}</span>
                                <span>•</span>
                                <span>{timeAgo}</span>
                                {duration && <><span>•</span><span>{duration}</span></>}
                                {run.metrics?.recordsProcessed && (
                                  <><span>•</span><span>{run.metrics.recordsProcessed.toLocaleString()} records</span></>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            {statusIcon}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Data Product Activity */}
            {productPipelines.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Data Product Builds</h2>
                  <span className="text-xs text-muted-foreground ml-1">(Domain & Solution Products)</span>
                </div>
                <div className="space-y-3">
                  {productPipelines.map((run) => {
                    const statusIcon = getStatusIcon(run.status);
                    const statusColor = getStatusColor(run.status);
                    const timeAgo = getTimeAgo(new Date(run.startTime).getTime());
                    const duration = run.metrics?.duration ? formatDuration(run.metrics.duration) : null;

                    return (
                      <Card key={run.executionId} className="p-3 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                              statusColor
                            )}>
                              <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-sm truncate">{run.pipelineId}</h3>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-xs font-medium",
                                  getStatusBadgeColor(run.status)
                                )}>
                                  {run.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5 text-xs text-muted-foreground mt-0.5">
                                {run.contract && <span className="font-medium">Contract: {run.contract}</span>}
                                <span>•</span>
                                <span>{timeAgo}</span>
                                {duration && <><span>•</span><span>{duration}</span></>}
                                {run.metrics?.recordsProcessed && (
                                  <><span>•</span><span>{run.metrics.recordsProcessed.toLocaleString()} records</span></>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            {statusIcon}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Recent Activity - Consumer View: Simplified */}
        {viewMode === 'consumer' && !loadingPipelines && pipelineRuns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Recent Data Products</h2>
            </div>
            <div className="space-y-3">
              {productPipelines.slice(0, 4).map((run) => (
                <Card key={run.executionId} className="p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm mb-1">{run.pipelineId}</h3>
                      {run.contract && (
                        <p className="text-xs text-muted-foreground">{run.contract}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {run.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
                      {run.status === 'running' && <PlayCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      {run.status === 'failed' && <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                      <span className="text-xs text-muted-foreground">{getTimeAgo(new Date(run.startTime).getTime())}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity - Hybrid View: Tabbed */}
        {viewMode === 'hybrid' && !loadingPipelines && pipelineRuns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {pipelineRuns.slice(0, 5).map((run) => {
                const statusIcon = getStatusIcon(run.status);
                const statusColor = getStatusColor(run.status);
                const timeAgo = getTimeAgo(new Date(run.startTime).getTime());

                return (
                  <Card key={run.executionId} className="p-3 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                          statusColor
                        )}>
                          {run.pipelineType === 'ingestion' ? <Database className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-muted/30 text-foreground">
                              {run.pipelineType === 'ingestion' ? 'Ingestion' : 'Product'}
                            </span>
                            <h3 className="font-medium text-sm truncate">{run.pipelineId}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{timeAgo}</span>
                            {run.contract && <><span>•</span><span>{run.contract}</span></>}
                            {run.source && <><span>•</span><span>{run.source}</span></>}
                          </div>
                        </div>
                      </div>
                      <div>
                        {statusIcon}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Recently Opened - Only show if there's navigation history */}
        {recentPages.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Recently Opened</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentPages.slice(0, 6).map((page) => {
                const Icon = ICON_MAP[page.icon] || Activity;
                const timeAgo = getTimeAgo(page.timestamp);
                return (
                  <Link key={page.path} href={page.path}>
                    <Card className="p-3 hover:shadow-md transition-all cursor-pointer border hover:border-primary/30 group bg-muted/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{page.title}</h3>
                          <p className="text-xs text-muted-foreground">{timeAgo}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Connect Your Infrastructure CTA */}
        <Card className="p-6 bg-muted/30 border-2 border-dashed">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Connect to NexusOne Ecosystem</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your existing infrastructure and tools to unlock intelligent orchestration, cross-system insights, and automated workflows across your entire data platform.
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  Orchestration
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Catalogs
                </span>
                <span className="flex items-center gap-1">
                  <Code className="w-3.5 h-3.5" />
                  Query Engines
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Governance
                </span>
              </div>
            </div>
            <div>
              <Link href="/manage/connections/new">
                <button className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
                  Connect Tools
                </button>
              </Link>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}

// Helper function to get time ago string
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Helper function to get status icon
function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'running':
      return <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'queued':
      return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    default:
      return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
  }
}

// Helper function to get status background color
function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'running':
      return 'bg-blue-100 dark:bg-blue-900/30';
    case 'failed':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'queued':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    default:
      return 'bg-muted';
  }
}

// Helper function to get status badge color
function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'running':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'queued':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// Helper function to format duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
