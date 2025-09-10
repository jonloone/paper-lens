'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertCircle, 
  Clock, 
  Database,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  XCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  SkipForward,
  Search,
  Phone,
  Activity,
  LineChart,
  FileText,
  Circle,
  Minus,
  Pause,
  MoreVertical,
  ArrowUpDown,
  Filter,
  RefreshCw,
  Keyboard,
  MemoryStick,
  ArrowRight,
  ArrowLeft,
  X,
  MoreHorizontal,
  Info,
  Cpu,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Realistic pipeline data based on confirmed API capabilities
interface Pipeline {
  // Core (from Airflow)
  id: string;
  name: string;
  status: 'running' | 'failed' | 'scheduled' | 'paused' | 'idle';
  schedule: string;
  owner: string;
  environment: 'prod' | 'staging' | 'dev';
  domain?: string; // Business domain for filtering
  lastRun: Date;
  
  // Performance (from Lakehouse aggregates)
  performance?: {
    avgThisWeek: number;  // milliseconds
    avgLastWeek: number;
    percentChange: number;
  };
  
  // Recent runs (from Airflow history)
  recentRuns: {
    timestamp: Date;
    success: boolean;
    duration: number;
    error?: string;
  }[];
  
  // Cost estimates (from Trino EXPLAIN)
  costEstimate?: {
    dailyAvg: number;     // Rough estimate in dollars
    lastRun: number;      // Based on data scanned
    gbScanned: number;    // From EXPLAIN output
    partitions: number;   // Partitions accessed
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  
  // Resources (from DataDog, if available)
  currentResources?: {
    activeTasks: number;
    memoryMB: number;     // Not percentage, actual MB
    cpuCores: number;     // Cores in use
  };
  
  // Lineage (from DataHub, if integrated)
  lineage?: {
    upstream: Array<{ name: string; type: string }>;
    downstream: Array<{ name: string; type: string }>;
  };
  
  // Last error (from logs)
  lastError?: {
    message: string;
    timestamp: Date;
    taskId: string;
  };
}

// Health indicator helper type
interface HealthIndicatorProps {
  runs: Pipeline['recentRuns'];
}

// Mock data representing real API responses with realistic data structure
const mockPipelines: Pipeline[] = [
  // Critical failures
  {
    id: 'customer_360_enrichment',
    name: 'customer_360',
    status: 'failed',
    schedule: 'Every 30 min',
    owner: 'data-team',
    environment: 'prod',
    domain: 'data',
    lastRun: new Date(Date.now() - 2700000),
    performance: {
      avgThisWeek: 1320000, // 22 minutes in ms
      avgLastWeek: 1080000, // 18 minutes
      percentChange: 22.2
    },
    recentRuns: [
      { timestamp: new Date(Date.now() - 2700000), success: false, duration: 1500000, error: 'OutOfMemoryError' },
      { timestamp: new Date(Date.now() - 4500000), success: false, duration: 1400000, error: 'OutOfMemoryError' },
      { timestamp: new Date(Date.now() - 6300000), success: false, duration: 1600000, error: 'OutOfMemoryError' },
      { timestamp: new Date(Date.now() - 8100000), success: true, duration: 1200000 },
      { timestamp: new Date(Date.now() - 9900000), success: true, duration: 1100000 }
    ],
    costEstimate: {
      dailyAvg: 124.50,
      lastRun: 8.20,
      gbScanned: 1640,
      partitions: 245,
      trend: 'increasing'
    },
    currentResources: {
      activeTasks: 0,
      memoryMB: 15360, // 15GB
      cpuCores: 8
    },
    lastError: {
      message: 'java.lang.OutOfMemoryError: Java heap space at CustomerDataProcessor.transform()',
      timestamp: new Date(Date.now() - 2700000),
      taskId: 'transform_customer_data'
    },
    lineage: {
      upstream: [
        { name: 'crm_contacts', type: 'table' },
        { name: 'support_tickets', type: 'table' },
        { name: 'transaction_history', type: 'table' },
        { name: 'user_activity_events', type: 'stream' }
      ],
      downstream: [
        { name: 'customer_segments', type: 'table' },
        { name: 'marketing_campaigns', type: 'view' },
        { name: 'executive_dashboard', type: 'dashboard' }
      ]
    }
  },
  // Degraded performance pipeline
  {
    id: 'payment_processing_v3',
    name: 'payment_processing',
    status: 'running',
    schedule: 'Every 10 min',
    owner: 'finance-team',
    environment: 'prod',
    domain: 'finance',
    lastRun: new Date(Date.now() - 600000),
    performance: {
      avgThisWeek: 480000, // 8 minutes
      avgLastWeek: 360000, // 6 minutes
      percentChange: 33.3
    },
    recentRuns: [
      { timestamp: new Date(Date.now() - 600000), success: true, duration: 520000 },
      { timestamp: new Date(Date.now() - 1200000), success: false, duration: 600000, error: 'ConnectionTimeout' },
      { timestamp: new Date(Date.now() - 1800000), success: true, duration: 450000 },
      { timestamp: new Date(Date.now() - 2400000), success: false, duration: 480000, error: 'ConnectionTimeout' },
      { timestamp: new Date(Date.now() - 3000000), success: true, duration: 410000 }
    ],
    costEstimate: {
      dailyAvg: 28.40,
      lastRun: 2.10,
      gbScanned: 420,
      partitions: 84,
      trend: 'stable'
    },
    currentResources: {
      activeTasks: 3,
      memoryMB: 4096, // 4GB
      cpuCores: 2
    },
    lineage: {
      upstream: [
        { name: 'transactions_raw', type: 'table' },
        { name: 'payment_methods', type: 'table' },
        { name: 'currency_rates_api', type: 'api' }
      ],
      downstream: [
        { name: 'payment_summary', type: 'view' },
        { name: 'finance_report', type: 'dashboard' },
        { name: 'fraud_detection', type: 'pipeline' }
      ]
    }
  },
  // High memory usage pipeline
  {
    id: 'user_metrics_hourly',
    name: 'user_metrics',
    status: 'running',
    schedule: 'Hourly',
    owner: 'data-team',
    environment: 'prod',
    domain: 'analytics',
    lastRun: new Date(Date.now() - 1800000),
    performance: {
      avgThisWeek: 1500000, // 25 minutes
      avgLastWeek: 1440000, // 24 minutes
      percentChange: 4.2
    },
    recentRuns: [
      { timestamp: new Date(Date.now() - 1800000), success: true, duration: 1520000 },
      { timestamp: new Date(Date.now() - 5400000), success: true, duration: 1480000 },
      { timestamp: new Date(Date.now() - 9000000), success: true, duration: 1500000 },
      { timestamp: new Date(Date.now() - 12600000), success: true, duration: 1510000 },
      { timestamp: new Date(Date.now() - 16200000), success: true, duration: 1490000 }
    ],
    costEstimate: {
      dailyAvg: 89.60,
      lastRun: 3.85,
      gbScanned: 770,
      partitions: 192,
      trend: 'stable'
    },
    currentResources: {
      activeTasks: 12,
      memoryMB: 18432, // 18GB - high usage
      cpuCores: 6
    },
    lineage: {
      upstream: [
        { name: 'user_events_raw', type: 'table' },
        { name: 'session_data', type: 'table' }
      ],
      downstream: [
        { name: 'user_analytics_mart', type: 'table' },
        { name: 'engagement_dashboard', type: 'view' }
      ]
    }
  },
  // Healthy pipeline
  {
    id: 'fraud_detection_realtime',
    name: 'fraud_detection',
    status: 'running',
    schedule: 'Every 5 min',
    owner: 'security-team',
    environment: 'prod',
    domain: 'security',
    lastRun: new Date(Date.now() - 180000),
    performance: {
      avgThisWeek: 180000, // 3 minutes
      avgLastWeek: 185000,
      percentChange: -2.7
    },
    recentRuns: [
      { timestamp: new Date(Date.now() - 180000), success: true, duration: 175000 },
      { timestamp: new Date(Date.now() - 480000), success: true, duration: 182000 },
      { timestamp: new Date(Date.now() - 780000), success: true, duration: 178000 },
      { timestamp: new Date(Date.now() - 1080000), success: true, duration: 180000 },
      { timestamp: new Date(Date.now() - 1380000), success: true, duration: 185000 }
    ],
    costEstimate: {
      dailyAvg: 18.20,
      lastRun: 0.85,
      gbScanned: 170,
      partitions: 24,
      trend: 'decreasing'
    },
    currentResources: {
      activeTasks: 2,
      memoryMB: 2048,
      cpuCores: 1
    }
  },
  // Daily pipeline
  {
    id: 'marketing_attribution_daily',
    name: 'marketing_attribution',
    status: 'scheduled',
    schedule: 'Daily at 00:00',
    owner: 'marketing-team',
    environment: 'prod',
    domain: 'marketing',
    lastRun: new Date(Date.now() - 7200000),
    performance: {
      avgThisWeek: 2700000, // 45 minutes
      avgLastWeek: 2640000, // 44 minutes
      percentChange: 2.3
    },
    recentRuns: [
      { timestamp: new Date(Date.now() - 7200000), success: true, duration: 2720000 },
      { timestamp: new Date(Date.now() - 93600000), success: true, duration: 2680000 },
      { timestamp: new Date(Date.now() - 180000000), success: true, duration: 2700000 },
      { timestamp: new Date(Date.now() - 266400000), success: true, duration: 2650000 },
      { timestamp: new Date(Date.now() - 352800000), success: true, duration: 2710000 }
    ],
    costEstimate: {
      dailyAvg: 45.80,
      lastRun: 47.20,
      gbScanned: 9440,
      partitions: 365,
      trend: 'stable'
    }
  }
];

// Add more realistic pipelines for comprehensive view
for (let i = 1; i <= 20; i++) {
  const avgDuration = (10 + Math.floor(Math.random() * 30)) * 60000; // Convert to ms
  const recentRuns = Array.from({ length: 5 }, (_, j) => ({
    timestamp: new Date(Date.now() - (j + 1) * Math.random() * 86400000),
    success: Math.random() > 0.15, // 85% success rate
    duration: avgDuration + (Math.random() - 0.5) * avgDuration * 0.3
  }));

  mockPipelines.push({
    id: `pipeline_${i}_v1`,
    name: `pipeline_${i}`,
    status: i % 4 === 0 ? 'running' : i % 7 === 0 ? 'failed' : 'idle',
    schedule: i % 5 === 0 ? 'Hourly' : 'Daily',
    owner: `team-${Math.floor(i / 5)}`,
    environment: 'prod',
    domain: ['analytics', 'finance', 'marketing', 'operations', 'sales'][i % 5],
    lastRun: new Date(Date.now() - Math.random() * 86400000),
    performance: {
      avgThisWeek: avgDuration,
      avgLastWeek: avgDuration * (0.9 + Math.random() * 0.2),
      percentChange: (Math.random() - 0.5) * 40
    },
    recentRuns,
    costEstimate: {
      dailyAvg: 5 + Math.random() * 50,
      lastRun: 0.5 + Math.random() * 10,
      gbScanned: Math.floor(50 + Math.random() * 1000),
      partitions: Math.floor(10 + Math.random() * 100),
      trend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as 'increasing' | 'stable' | 'decreasing'
    }
  });
}

// Helper components
const StatusBadge: React.FC<{ status: Pipeline['status'] }> = ({ status }) => {
  const getStatusStyles = (status: Pipeline['status']) => {
    switch(status) {
      case 'failed':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'running':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'idle':
        return 'bg-gray-400 text-white hover:bg-gray-500';
      case 'scheduled':
        return 'bg-amber-500 text-white hover:bg-amber-600';
      case 'paused':
        return 'bg-gray-500 text-white hover:bg-gray-600';
      default:
        return 'bg-gray-400 text-white hover:bg-gray-500';
    }
  };

  return (
    <Badge className={getStatusStyles(status)}>
      {status}
    </Badge>
  );
};

const HealthIndicator: React.FC<HealthIndicatorProps> = ({ runs }) => {
  const successCount = runs.filter(run => run.success).length;
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {runs.slice(0, 5).map((run, i) => (
          <Tooltip key={i}>
            <TooltipTrigger>
              <div
                className={cn(
                  "h-4 w-1 rounded-full",
                  run.success ? "bg-green-500" : "bg-red-500"
                )}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{run.success ? 'Success' : 'Failed'}</p>
              <p>{new Date(run.timestamp).toLocaleString()}</p>
              <p>Duration: {Math.round(run.duration / 60000)}m</p>
              {run.error && <p>Error: {run.error}</p>}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {successCount}/{Math.min(runs.length, 5)}
      </span>
    </div>
  );
};

export default function PipelineHealthMonitor() {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('status');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [hoveredPipeline, setHoveredPipeline] = useState<Pipeline | null>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);
  const pipelineRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  // Filter and sort pipelines
  const filteredPipelines = useMemo(() => {
    let filtered = [...mockPipelines];

    // Apply search
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.owner.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply domain filter
    if (domainFilter !== 'all') {
      filtered = filtered.filter(p => p.domain === domainFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'failed') {
        filtered = filtered.filter(p => p.status === 'failed');
      } else if (statusFilter === 'running') {
        filtered = filtered.filter(p => p.status === 'running');
      } else if (statusFilter === 'degraded') {
        filtered = filtered.filter(p => p.performance && p.performance.percentChange > 20);
      } else if (statusFilter === 'attention') {
        filtered = filtered.filter(p => 
          p.status === 'failed' || 
          (p.performance && p.performance.percentChange > 50) ||
          (p.currentResources && p.currentResources.memoryMB > 16384) // > 16GB
        );
      }
    }

    // Sort pipelines
    filtered.sort((a, b) => {
      // Always put failed first
      if (a.status === 'failed' && b.status !== 'failed') return -1;
      if (b.status === 'failed' && a.status !== 'failed') return 1;
      
      switch (sortBy) {
        case 'status':
          return 0; // Already sorted by status above
        case 'lastRun':
          return b.lastRun.getTime() - a.lastRun.getTime();
        case 'duration':
          const aDuration = a.performance?.avgThisWeek || 0;
          const bDuration = b.performance?.avgThisWeek || 0;
          return bDuration - aDuration;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [search, domainFilter, statusFilter, sortBy]);

  // Get unique domains for filter dropdown
  const uniqueDomains = useMemo(() => {
    const domains = new Set<string>();
    mockPipelines.forEach(p => {
      if (p.domain) domains.add(p.domain);
    });
    return Array.from(domains).sort();
  }, []);

  // Count pipelines by status
  const statusCounts = useMemo(() => {
    const counts = {
      critical: filteredPipelines.filter(p => 
        p.status === 'failed' || 
        (p.performance && p.performance.percentChange > 100) ||
        (p.currentResources && p.currentResources.memoryMB > 16384)
      ).length,
      warning: filteredPipelines.filter(p => 
        p.performance && p.performance.percentChange > 20 && p.performance.percentChange <= 100
      ).length,
      healthy: filteredPipelines.filter(p => 
        p.status !== 'failed' && 
        (!p.performance || p.performance.percentChange <= 20)
      ).length,
      total: filteredPipelines.length
    };
    return counts;
  }, [filteredPipelines]);

  // Active filters for visual confirmation
  const activeFilters = useMemo(() => {
    const filters = [];
    if (domainFilter !== 'all') filters.push({ type: 'domain', value: domainFilter });
    if (statusFilter !== 'all') filters.push({ type: 'status', value: statusFilter });
    if (search) filters.push({ type: 'search', value: search });
    return filters;
  }, [domainFilter, statusFilter, search]);

  // Scroll to pipeline when clicking status bar
  const scrollToPipeline = (pipelineName: string) => {
    const element = pipelineRefs.current[pipelineName];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-purple-500/10');
      setTimeout(() => {
        element.classList.remove('bg-purple-500/10');
      }, 2000);
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      window.location.reload();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: Pipeline['status']) => {
    switch (status) {
      case 'running': return 'text-green-500';
      case 'idle': return 'text-gray-400';
      case 'scheduled': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      case 'paused': return 'text-yellow-500';
    }
  };

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ago`;
    }
    const days = Math.floor(minutes / 1440);
    return `${days}d ago`;
  };

  // Performance Section Component
  const PerformanceSection: React.FC<{ pipeline: Pipeline }> = ({ pipeline }) => {
    if (!pipeline.performance) return null;
    
    return (
      <div>
        <h3 className="text-sm font-medium mb-3">Performance Trends</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Avg This Week</span>
              <p className="font-mono text-lg">
                {formatDuration(pipeline.performance.avgThisWeek)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">vs Last Week</span>
              <p className="font-mono text-lg">
                {pipeline.performance.percentChange > 0 ? '+' : ''}
                {pipeline.performance.percentChange.toFixed(1)}%
              </p>
            </div>
          </div>
          
          {/* Recent run visualization */}
          <div className="flex gap-1">
            <TooltipProvider>
              {pipeline.recentRuns.slice(0, 5).map((run, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger>
                    <div
                      className={cn(
                        "h-8 w-8 rounded",
                        run.success ? 'bg-green-500' : 'bg-red-500'
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{new Date(run.timestamp).toLocaleString()}</p>
                    <p>Duration: {formatDuration(run.duration)}</p>
                    {!run.success && run.error && <p>Failed: {run.error}</p>}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  };

  // Cost Estimation Section Component
  const CostSection: React.FC<{ pipeline: Pipeline }> = ({ pipeline }) => {
    if (!pipeline.costEstimate) return null;
    
    return (
      <div>
        <h3 className="text-sm font-medium mb-3">Cost Estimates</h3>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Rough estimates based on data scanned. Actual costs may vary.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
          <div>
            <span className="text-muted-foreground">Daily Average</span>
            <p className="font-mono">${pipeline.costEstimate.dailyAvg.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Last Run</span>
            <p className="font-mono">${pipeline.costEstimate.lastRun.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data Scanned</span>
            <p className="font-mono">{pipeline.costEstimate.gbScanned} GB</p>
          </div>
          <div>
            <span className="text-muted-foreground">Partitions Hit</span>
            <p className="font-mono">{pipeline.costEstimate.partitions}</p>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Lineage Section Component for DataHub integration
  // TODO: In production, implement DataHub API integration:
  // - Fetch lineage via DataHub GraphQL API: /api/v2/graphql
  // - Use pipeline.id to query upstream/downstream entities
  // - Handle authentication with DataHub token
  // - Implement loading states and error handling
  const LineageSection: React.FC<{ pipeline: Pipeline }> = ({ pipeline }) => {
    if (!pipeline.lineage) return null;
    
    // Enhanced mock data with platform information (replace with DataHub API)
    const enhancedLineage = {
      upstream: pipeline.lineage.upstream.map(item => ({
        ...item,
        platform: item.type === 'table' ? 'postgres' : 'external'
      })),
      downstream: pipeline.lineage.downstream.map(item => ({
        ...item,
        platform: item.type === 'table' ? 'trino' : item.type === 'view' ? 'tableau' : 'airflow'
      }))
    };
    
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Data Lineage</h3>
        
        {/* Upstream Dependencies */}
        {enhancedLineage.upstream.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">DEPENDS ON</span>
              <span className="text-xs text-muted-foreground">
                {enhancedLineage.upstream.length} sources
              </span>
            </div>
            <div className="space-y-1">
              {enhancedLineage.upstream.map((item, idx) => (
                <div 
                  key={`${item.name}-${idx}`}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.platform}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.type.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Pipeline Indicator */}
        {enhancedLineage.upstream.length > 0 && enhancedLineage.downstream.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-sm text-muted-foreground">
                Current Pipeline
              </span>
            </div>
          </div>
        )}

        {/* Downstream Dependencies */}
        {enhancedLineage.downstream.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">FEEDS INTO</span>
              <span className="text-xs text-muted-foreground">
                {enhancedLineage.downstream.length} consumers
              </span>
            </div>
            <div className="space-y-1">
              {enhancedLineage.downstream.map((item, idx) => (
                <div 
                  key={`${item.name}-${idx}`}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.platform}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.type.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DataHub Link */}
        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={`http://datahub.internal/dataset/${pipeline.id}`} target="_blank" rel="noopener">
              View Full Lineage in DataHub
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    );
  };

  // Error Section Component  
  const ErrorSection: React.FC<{ pipeline: Pipeline }> = ({ pipeline }) => {
    if (!pipeline.lastError) return null;
    
    return (
      <div>
        <h3 className="text-sm font-medium mb-3">Recent Error</h3>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-mono text-sm">{pipeline.lastError.taskId}</div>
              <div className="text-xs">{pipeline.lastError.message}</div>
              <div className="text-xs text-muted-foreground">
                {formatRelativeTime(pipeline.lastError.timestamp)}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  // Action Section Component
  const ActionSection: React.FC<{ pipeline: Pipeline }> = ({ pipeline }) => {
    return (
      <div>
        <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="justify-start" asChild>
            <a href={`http://airflow.internal/dags/${pipeline.id}`} target="_blank" rel="noopener">
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Airflow
            </a>
          </Button>
          <Button variant="outline" className="justify-start">
            <FileText className="h-4 w-4 mr-2" />
            View Logs
          </Button>
          <Button variant="outline" className="justify-start">
            <LineChart className="h-4 w-4 mr-2" />
            View Metrics
          </Button>
          <Button variant="outline" className="justify-start">
            <Database className="h-4 w-4 mr-2" />
            View in DataHub
          </Button>
        </div>
      </div>
    );
  };

  // Main Detail Panel Component using Sheet
  const PipelineDetailPanel: React.FC<{ pipeline: Pipeline; open: boolean; onClose: () => void }> = ({ 
    pipeline, 
    open, 
    onClose 
  }) => {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{pipeline.name}</SheetTitle>
            <SheetDescription>
              {pipeline.owner} • Last run: {formatRelativeTime(pipeline.lastRun)}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
            {/* Performance Metrics */}
            <PerformanceSection pipeline={pipeline} />
            
            {/* Cost Estimates */}
            <CostSection pipeline={pipeline} />
            
            {/* Data Lineage */}
            <LineageSection pipeline={pipeline} />
            
            {/* Recent Errors */}
            <ErrorSection pipeline={pipeline} />
            
            {/* Actions */}
            <ActionSection pipeline={pipeline} />
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  // Status Bar Component
  const StatusBar: React.FC<{ critical: number; degraded: number; healthy: number }> = ({ critical, degraded, healthy }) => {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-600">{critical} Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-sm font-medium text-amber-600">{degraded} Degraded</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-600">{healthy} Healthy</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl">Pipeline Operations</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {statusCounts.total} pipelines • 
                {statusCounts.critical > 0 && <span className="text-red-500 font-medium"> {statusCounts.critical} critical</span>}
                {statusCounts.warning > 0 && <span className="text-amber-600 font-medium"> • {statusCounts.warning} need attention</span>}
                {statusCounts.healthy > 0 && <span className="text-green-600"> • {statusCounts.healthy} healthy</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "secondary" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
                {autoRefresh && <span className="ml-2">Auto</span>}
              </Button>
            </div>
          </div>

          {/* Status Overview Bar */}
          <div className="mt-4">
            <StatusBar 
              critical={statusCounts.critical}
              degraded={statusCounts.warning}
              healthy={statusCounts.healthy}
            />
          </div>
        </div>
      </div>

      {/* Filters and Active Filter Display */}
      <div className="container mx-auto px-6 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pipelines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>


          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="failed">Failed Only</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="degraded">Degraded</SelectItem>
              <SelectItem value="attention">Need Attention</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="lastRun">Last Run</SelectItem>
              <SelectItem value="nextRun">Next Run</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
            <span className="text-sm font-medium">Filtered:</span>
            {activeFilters.map((filter, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                {filter.type === 'domain' && `Domain: ${filter.value}`}
                {filter.type === 'status' && `Status: ${filter.value}`}
                {filter.type === 'search' && `Search: ${filter.value}`}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => {
                    if (filter.type === 'domain') setDomainFilter('all');
                    if (filter.type === 'status') setStatusFilter('all');
                    if (filter.type === 'search') setSearch('');
                  }}
                />
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setDomainFilter('all');
                setStatusFilter('all');
                setSearch('');
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pipeline Operations</CardTitle>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search pipelines..." 
                  className="w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Domains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Domains</SelectItem>
                    {uniqueDomains.map(domain => (
                      <SelectItem key={domain} value={domain}>
                        {domain.charAt(0).toUpperCase() + domain.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Pipeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Runtime Trend</TableHead>
                  <TableHead>Est. Daily Cost</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TooltipProvider>
                  {filteredPipelines.map(pipeline => {
                    const statusColor = getStatusColor(pipeline.status);
                    
                    return (
                      <TableRow 
                        key={pipeline.id}
                        ref={el => pipelineRefs.current[pipeline.name] = el}
                        className={cn(
                          "hover:bg-muted/50 cursor-pointer transition-all",
                          pipeline.status === 'failed' && "bg-red-500/5",
                          pipeline.performance && pipeline.performance.percentChange > 50 && "bg-amber-500/5"
                        )}
                        onMouseEnter={() => setHoveredPipeline(pipeline)}
                        onMouseLeave={() => setHoveredPipeline(null)}
                        onClick={() => setSelectedPipeline(pipeline)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{pipeline.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {pipeline.owner} • {pipeline.domain} • {pipeline.environment}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <StatusBadge status={pipeline.status} />
                        </TableCell>
                        
                        <TableCell className="text-sm">
                          {pipeline.schedule}
                        </TableCell>
                        
                        <TableCell>
                          {pipeline.performance && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-mono">
                                {formatDuration(pipeline.performance.avgThisWeek)}
                              </span>
                              {pipeline.performance.percentChange > 20 && (
                                <span className="text-amber-600">
                                  +{Math.round(pipeline.performance.percentChange)}%
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {pipeline.costEstimate && (
                            <div className="text-sm text-muted-foreground">
                              ~${pipeline.costEstimate.dailyAvg.toFixed(2)}
                              {pipeline.costEstimate.trend === 'increasing' && (
                                <TrendingUp className="inline h-3 w-3 ml-1 text-amber-600" />
                              )}
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <HealthIndicator runs={pipeline.recentRuns} />
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPipeline(pipeline)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TooltipProvider>
              </TableBody>
            </Table>
            
            {filteredPipelines.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No pipelines match your filters
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Detail Panel */}
      {selectedPipeline && (
        <PipelineDetailPanel 
          pipeline={selectedPipeline}
          open={true}
          onClose={() => setSelectedPipeline(null)}
        />
      )}
    </div>
  );
}