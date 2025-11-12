'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  HardDrive,
  GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDensitySpacing } from '@/contexts/DensityContext';

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
  mounted?: boolean;
}

// Mock data representing real API responses with realistic data structure
const mockPipelines: Pipeline[] = [
  // Critical failures
  {
    id: 'customer_360_enrichment',
    name: 'customer_360',
    status: 'failed',
    schedule: 'Every 30 min',
    team: 'data-team',
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
    team: 'Data Engineering',
    environment: 'prod',
    domain: 'analytics',
    lastRun: new Date(Date.now() - 1800000),
    avgRuntime: '25m',
    trend: 'stable',
    recentRuns: [true, true, false, true, true, true, true, false, true, true],
    queryComplexity: 'High',
    dataScanned: 770,
    partitionsAccessed: 192,
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
    team: 'Security',
    environment: 'prod',
    domain: 'security',
    lastRun: new Date(Date.now() - 180000),
    avgRuntime: '3m',
    trend: 'stable',
    recentRuns: [true, true, true, true, true, true, true, true, true, true],
    queryComplexity: 'Medium',
    dataScanned: 170,
    partitionsAccessed: 24,
    currentResources: {
      activeTasks: 2,
      memoryMB: 2048,
      cpuCores: 1
    },
    lineage: {
      upstream: [
        { name: 'transaction_stream', type: 'stream' },
        { name: 'user_profiles', type: 'table' }
      ],
      downstream: [
        { name: 'fraud_alerts', type: 'table' },
        { name: 'security_dashboard', type: 'view' }
      ]
    }
  },
  // Daily pipeline
  {
    id: 'marketing_attribution_daily',
    name: 'marketing_attribution',
    status: 'scheduled',
    schedule: 'Daily at 00:00',
    team: 'Marketing Analytics',
    environment: 'prod',
    domain: 'marketing',
    lastRun: new Date(Date.now() - 7200000),
    avgRuntime: '45m',
    trend: 'increasing',
    recentRuns: [true, true, true, false, true, true, true, true, false, true],
    queryComplexity: 'Intensive',
    dataScanned: 1250,
    partitionsAccessed: 340,
    lineage: {
      upstream: [
        { name: 'campaign_data', type: 'table' },
        { name: 'user_touchpoints', type: 'table' },
        { name: 'conversion_events', type: 'stream' }
      ],
      downstream: [
        { name: 'attribution_model', type: 'table' },
        { name: 'marketing_dashboard', type: 'view' },
        { name: 'campaign_performance', type: 'dashboard' }
      ]
    }
  }
];

// Add more realistic pipelines for comprehensive view
for (let i = 1; i <= 20; i++) {
  const avgMinutes = 5 + Math.floor(Math.random() * 45); // 5-50 minutes
  const avgRuntime = avgMinutes < 60 ? `${avgMinutes}m` : `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m`;
  const recentRuns = Array.from({ length: 5 }, () => Math.random() > 0.2); // 80% success rate
  const complexities: Array<'Low' | 'Medium' | 'High' | 'Intensive'> = ['Low', 'Medium', 'High', 'Intensive'];

  mockPipelines.push({
    id: `pipeline_${i}_v1`,
    name: `pipeline_${i}`,
    status: i % 4 === 0 ? 'running' : i % 7 === 0 ? 'failed' : 'idle',
    schedule: i % 5 === 0 ? 'Hourly' : 'Daily',
    team: `team-${Math.floor(i / 5)}`,
    environment: 'prod',
    domain: ['analytics', 'finance', 'marketing', 'operations', 'sales'][i % 5],
    lastRun: new Date(Date.now() - Math.random() * 86400000),
    avgRuntime,
    trend: ['stable', 'increasing', 'decreasing'][Math.floor(Math.random() * 3)] as 'stable' | 'increasing' | 'decreasing',
    recentRuns,
    queryComplexity: complexities[Math.floor(Math.random() * complexities.length)],
    dataScanned: Math.floor(50 + Math.random() * 1000),
    partitionsAccessed: Math.floor(10 + Math.random() * 100),
    lineage: {
      upstream: [
        { name: `source_data_${i}`, type: 'table' },
        { name: `raw_events_${Math.floor(i/3)}`, type: i % 3 === 0 ? 'stream' : 'table' }
      ],
      downstream: [
        { name: `processed_${i}`, type: 'table' },
        { name: `dashboard_${Math.floor(i/2)}`, type: i % 2 === 0 ? 'view' : 'dashboard' }
      ]
    }
  });
}

// Helper functions
const getComplexityVariant = (complexity: string) => {
  switch (complexity) {
    case 'Low': return 'secondary';
    case 'Medium': return 'default';
    case 'High': return 'destructive';
    case 'Intensive': return 'destructive';
    default: return 'outline';
  }
};

// Helper components
const StatusBadge: React.FC<{ status: Pipeline['status'] }> = ({ status }) => {
  const getStatusStyles = (status: Pipeline['status']) => {
    switch(status) {
      case 'failed':
        return 'bg-red-500 text-white hover:bg-red-600 [transition:var(--transition-colors)]';
      case 'running':
        return 'bg-blue-500 text-white hover:bg-blue-600 [transition:var(--transition-colors)]';
      case 'idle':
        return 'bg-gray-400 text-white hover:bg-gray-500 [transition:var(--transition-colors)]';
      case 'scheduled':
        return 'bg-amber-500 text-white hover:bg-amber-600 [transition:var(--transition-colors)]';
      case 'paused':
        return 'bg-gray-500 text-white hover:bg-gray-600 [transition:var(--transition-colors)]';
      default:
        return 'bg-gray-400 text-white hover:bg-gray-500 [transition:var(--transition-colors)]';
    }
  };

  return (
    <Badge className={getStatusStyles(status)} aria-label={`Pipeline status: ${status}`}>
      {status}
    </Badge>
  );
};

const HealthIndicator: React.FC<HealthIndicatorProps> = ({ runs, mounted = true }) => {
  const successCount = runs.filter(success => success).length;

  return (
    <div className="flex items-center gap-2" role="status" aria-label={`Pipeline health: ${successCount} of ${runs.length} runs successful`}>
      <div className="flex gap-0.5" role="list" aria-label="Recent run history">
        {runs.map((success, i) => (
          <div
            key={i}
            className={cn(
              "h-4 w-1 [transition:var(--transition-colors)]",
              success ? "bg-green-500" : "bg-red-500"
            )}
            title={success ? 'Success' : 'Failed'}
            role="listitem"
            aria-label={success ? 'Successful run' : 'Failed run'}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground/85">
        {successCount}/{runs.length}
      </span>
    </div>
  );
};

export default function PipelineHealthMonitor() {
  // Density-aware spacing
  const spacing = useDensitySpacing();

  const router = useRouter();
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('status');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [hoveredPipeline, setHoveredPipeline] = useState<Pipeline | null>(null);
  const [mounted, setMounted] = useState(false);
  const statusBarRef = useRef<HTMLDivElement>(null);
  const pipelineRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  // Fix hydration issues by only rendering time-sensitive content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (!mounted) return 'Loading...';
    
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

  // Primary Metrics Section - Key performance indicators with clear hierarchy
  const PrimaryMetricsSection: React.FC<{ pipeline: Pipeline }> = ({ pipeline }) => {
    const successRate = pipeline.recentRuns ? 
      Math.round((pipeline.recentRuns.filter(Boolean).length / pipeline.recentRuns.length) * 100) : 100;
    
    return (
      <div className="border-b pb-4">
        <h3 className="text-sm font-medium mb-4">Key Metrics</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Average Runtime</p>
            <p className="text-3xl font-bold">{pipeline.avgRuntime}</p>
            <div className="flex items-center gap-1 mt-1">
              {pipeline.trend === 'increasing' && <TrendingUp className="h-3 w-3 text-amber-600" />}
              {pipeline.trend === 'decreasing' && <TrendingDown className="h-3 w-3 text-green-600" />}
              {pipeline.trend === 'stable' && <Minus className="h-3 w-3 text-muted-foreground/85" aria-hidden="true" />}
              <span className={cn(
                "text-sm capitalize",
                pipeline.trend === 'increasing' ? "text-amber-600" :
                pipeline.trend === 'decreasing' ? "text-green-600" : "text-muted-foreground/85"
              )}>
                {pipeline.trend || 'stable'} vs last week
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Success Rate (Recent)</p>
            <p className="text-3xl font-bold">{successRate}%</p>
            <p className={cn(
              "text-sm mt-1",
              successRate >= 90 ? "text-green-600" : successRate >= 70 ? "text-amber-600" : "text-red-600"
            )}>
              {pipeline.recentRuns?.filter(Boolean).length || 0}/{pipeline.recentRuns?.length || 0} successful runs
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Query Complexity</p>
            <div className="mt-2">
              <ComplexityBadge complexity={pipeline.queryComplexity || 'Low'} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on Trino analysis
            </p>
          </div>
        </div>
        
        {/* Recent runs timeline */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted-foreground/85">Recent Run Pattern</p>
            <p className="text-xs text-muted-foreground/85">Last run: {mounted ? formatRelativeTime(pipeline.lastRun) : 'Loading...'}</p>
          </div>
          <HealthIndicator runs={pipeline.recentRuns} mounted={mounted} />
        </div>
      </div>
    );
  };

  // Complexity Badge Component for query complexity indication
  const ComplexityBadge: React.FC<{ complexity: 'Low' | 'Medium' | 'High' | 'Intensive' }> = ({ complexity }) => {
    const getComplexityStyles = (complexity: 'Low' | 'Medium' | 'High' | 'Intensive') => {
      switch(complexity) {
        case 'Low': return 'bg-green-100 text-green-800 border-green-200 [transition:var(--transition-colors)]';
        case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-200 [transition:var(--transition-colors)]';
        case 'High': return 'bg-amber-100 text-amber-800 border-amber-200 [transition:var(--transition-colors)]';
        case 'Intensive': return 'bg-red-100 text-red-800 border-red-200 [transition:var(--transition-colors)]';
        default: return 'bg-gray-100 text-gray-800 border-gray-200 [transition:var(--transition-colors)]';
      }
    };

    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border",
          getComplexityStyles(complexity)
        )}
        aria-label={`Query complexity: ${complexity}`}
      >
        {complexity}
      </span>
    );
  };

  // Resource Usage Section - Only show meaningful data with proper grouping
  const ResourceUsageSection: React.FC<{ pipeline: Pipeline }> = ({ pipeline }) => {
    const hasDataMetrics = pipeline.dataScanned && pipeline.dataScanned > 0;
    const hasMemoryData = pipeline.currentResources && pipeline.currentResources.memoryMB > 0;
    
    // Don't show section if no meaningful data
    if (!hasDataMetrics && !hasMemoryData) {
      return (
        <div>
          <h3 className="text-sm font-medium mb-3">Resource Usage</h3>
          <p className="text-sm text-muted-foreground italic">
            Resource metrics will be available after the next pipeline run.
          </p>
        </div>
      );
    }
    
    return (
      <div>
        <h3 className="text-sm font-medium mb-4">Resource Usage</h3>
        
        {hasDataMetrics && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Query Analysis</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground/85">Data Scanned</p>
                <p className="text-lg font-mono">{pipeline.dataScanned?.toLocaleString()} GB</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/85">Partitions Accessed</p>
                <p className="text-lg font-mono">{pipeline.partitionsAccessed?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
        
        {hasMemoryData && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">System Resources</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground/85">Memory Allocated</p>
                <p className="text-lg font-mono">{(pipeline.currentResources.memoryMB / 1024).toFixed(1)} GB</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/85">CPU Cores</p>
                <p className="text-lg font-mono">{pipeline.currentResources.cpuCores}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
          <Info className="h-3 w-3 inline mr-1" />
          Data from Trino EXPLAIN analysis and Airflow resource monitoring.
        </div>
      </div>
    );
  };

  // Enhanced Lineage Section Component with Horizontal Layout
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Data Lineage</h3>
          <Button variant="outline" size="sm" asChild>
            <a href={`http://datahub.internal/dataset/${pipeline.id}`} target="_blank" rel="noopener">
              <ExternalLink className="h-3 w-3 mr-1" />
              DataHub
            </a>
          </Button>
        </div>
        
        {/* Side-by-side upstream and downstream */}
        <div className="grid grid-cols-2 gap-8">
          {/* Upstream Dependencies */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground/85">DEPENDS ON</span>
              <span className="text-xs text-muted-foreground/85">
                {enhancedLineage.upstream.length} sources
              </span>
            </div>
            <div className="space-y-2">
              {enhancedLineage.upstream.length > 0 ? enhancedLineage.upstream.map((item, idx) => (
                <div 
                  key={`${item.name}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground/85">{item.platform}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.type.toUpperCase()}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No upstream dependencies
                </p>
              )}
            </div>
          </div>

          {/* Downstream Dependencies */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground/85">FEEDS INTO</span>
              <span className="text-xs text-muted-foreground/85">
                {enhancedLineage.downstream.length} consumers
              </span>
            </div>
            <div className="space-y-2">
              {enhancedLineage.downstream.length > 0 ? enhancedLineage.downstream.map((item, idx) => (
                <div 
                  key={`${item.name}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground/85">{item.platform}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.type.toUpperCase()}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No downstream consumers
                </p>
              )}
            </div>
          </div>
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
              <div className="text-xs text-muted-foreground/85">
                {formatRelativeTime(pipeline.lastError.timestamp)}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  // Enhanced Action Section Component - Horizontal Layout
  const ActionSection: React.FC<{ pipeline: Pipeline }> = ({ pipeline }) => {
    return (
      <div className="pt-4 border-t">
        <h3 className="text-sm font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-5 gap-3">
          <Button variant="outline" size="sm" className="h-auto flex-col py-3" asChild>
            <Link href={`/develop/pipelines/studio?id=${pipeline.id}&mode=operations`}>
              <GitBranch className="h-4 w-4 mb-1" />
              <span className="text-xs">Studio</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-auto flex-col py-3" asChild>
            <a href={`http://airflow.internal/dags/${pipeline.id}`} target="_blank" rel="noopener">
              <ExternalLink className="h-4 w-4 mb-1" />
              <span className="text-xs">Airflow</span>
            </a>
          </Button>
          <Button variant="outline" size="sm" className="h-auto flex-col py-3">
            <FileText className="h-4 w-4 mb-1" />
            <span className="text-xs">Logs</span>
          </Button>
          <Button variant="outline" size="sm" className="h-auto flex-col py-3">
            <LineChart className="h-4 w-4 mb-1" />
            <span className="text-xs">Metrics</span>
          </Button>
          <Button variant="outline" size="sm" className="h-auto flex-col py-3">
            <Database className="h-4 w-4 mb-1" />
            <span className="text-xs">DataHub</span>
          </Button>
        </div>
        
        {/* Pipeline control actions */}
        <div className="flex gap-2 mt-4">
          <Button size="sm" className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Trigger Run
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Pause className="h-4 w-4 mr-2" />
            Pause Pipeline
          </Button>
        </div>
      </div>
    );
  };

  // Main Detail Panel Component using Sheet - Much Wider for Better Layout
  const PipelineDetailPanel: React.FC<{ pipeline: Pipeline; open: boolean; onClose: () => void }> = ({ 
    pipeline, 
    open, 
    onClose 
  }) => {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-[900px] sm:max-w-[900px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl">{pipeline.name}</SheetTitle>
            <SheetDescription className="text-base">
              {pipeline.team} • Last run: {mounted ? formatRelativeTime(pipeline.lastRun) : 'Loading...'} • {pipeline.environment}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
            {/* Primary: Key metrics with clear hierarchy */}
            <PrimaryMetricsSection pipeline={pipeline} />
            
            {/* Secondary: Resource usage - only if meaningful data */}
            <ResourceUsageSection pipeline={pipeline} />
            
            {/* Secondary: Data Lineage - Full width */}
            <LineageSection pipeline={pipeline} />
            
            {/* Tertiary: Recent Errors - Only if errors exist */}
            <ErrorSection pipeline={pipeline} />
            
            {/* Tertiary: Quick Actions */}
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b" role="banner">
        <div className={cn("max-w-7xl mx-auto", spacing.section)}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Pipeline Operations</h1>
              <p className="text-sm text-muted-foreground/85 mt-2" role="status" aria-live="polite">
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
                className="[transition:var(--transition-button)]"
                aria-label={autoRefresh ? "Auto-refresh enabled" : "Enable auto-refresh"}
                aria-pressed={autoRefresh}
              >
                <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} aria-hidden="true" />
                {autoRefresh && <span className="ml-2">Auto</span>}
              </Button>
            </div>
          </div>

          {/* Status counts shown in header description instead */}
        </div>
      </header>

      {/* Filters and Active Filter Display */}
      <section className={cn("max-w-7xl mx-auto", spacing.section, spacing.stackCompact)} role="search" aria-label="Pipeline filters">
        <div className={cn("flex items-center", spacing.stack)}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/85" aria-hidden="true" />
            <Input
              placeholder="Search pipelines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search pipelines by name or owner"
            />
          </div>

          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[140px]" aria-label="Filter by domain">
              <Database className="h-4 w-4 mr-2" aria-hidden="true" />
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
            <SelectTrigger className="w-[140px]" aria-label="Filter by status">
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
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
            <SelectTrigger className="w-[140px]" aria-label="Sort pipelines by">
              <ArrowUpDown className="h-4 w-4 mr-2" aria-hidden="true" />
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
          <div className={cn("flex items-center flex-wrap bg-muted/50 rounded", spacing.cardCompact)} role="status" aria-label="Active filters">
            <span className="text-sm font-medium text-foreground/85">Filtered:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.map((filter, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1 [transition:var(--transition-colors)]">
                  {filter.type === 'domain' && `Domain: ${filter.value}`}
                  {filter.type === 'status' && `Status: ${filter.value}`}
                  {filter.type === 'search' && `Search: ${filter.value}`}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive [transition:var(--transition-colors)]"
                    onClick={() => {
                      if (filter.type === 'domain') setDomainFilter('all');
                      if (filter.type === 'status') setStatusFilter('all');
                      if (filter.type === 'search') setSearch('');
                    }}
                    aria-label={`Remove ${filter.type} filter: ${filter.value}`}
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
                className="[transition:var(--transition-colors)]"
                aria-label="Clear all active filters"
              >
                Clear all filters
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Main Content - Clean Table without Duplicate Filters */}
      <section className={cn("max-w-7xl mx-auto", spacing.section)} role="region" aria-label="Pipeline list">
        <Card elevation="subtle" className="border-0">

          <CardContent className={spacing.card}>
            <Table role="table" aria-label="Pipeline operations table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Pipeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Avg Runtime</TableHead>
                  <TableHead>Complexity</TableHead>
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
                          "hover:bg-muted/50 cursor-pointer [transition:var(--transition-colors)]",
                          pipeline.status === 'failed' && "bg-red-500/5",
                          pipeline.performance && pipeline.performance.percentChange > 50 && "bg-amber-500/5"
                        )}
                        onMouseEnter={() => setHoveredPipeline(pipeline)}
                        onMouseLeave={() => setHoveredPipeline(null)}
                        onClick={() => setSelectedPipeline(pipeline)}
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${pipeline.name} pipeline`}
                      >
                        <TableCell>
                          <div>
                            <Link
                              href={`/develop/pipelines/studio?id=${pipeline.id}&mode=operations`}
                              className="font-medium hover:underline hover:text-primary [transition:var(--transition-colors)]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {pipeline.name}
                            </Link>
                            <div className="text-xs text-muted-foreground/85">
                              {pipeline.team} • {pipeline.environment}
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
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono">{pipeline.avgRuntime}</span>
                            {pipeline.trend === 'increasing' && (
                              <TrendingUp className="h-3 w-3 text-amber-600" aria-label="Runtime increasing" />
                            )}
                            {pipeline.trend === 'decreasing' && (
                              <TrendingDown className="h-3 w-3 text-green-600" aria-label="Runtime decreasing" />
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {pipeline.queryComplexity && (
                            <Badge variant={getComplexityVariant(pipeline.queryComplexity)}>
                              {pipeline.queryComplexity}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <HealthIndicator runs={pipeline.recentRuns} mounted={mounted} />
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/develop/pipelines/studio?id=${pipeline.id}&mode=operations`);
                              }}
                              className="[transition:var(--transition-button)]"
                              aria-label={`Open ${pipeline.name} in Studio`}
                            >
                              <GitBranch className="h-4 w-4 mr-1" aria-hidden="true" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPipeline(pipeline)}
                              className="[transition:var(--transition-button)]"
                              aria-label={`View details for ${pipeline.name}`}
                            >
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TooltipProvider>
              </TableBody>
            </Table>

            {filteredPipelines.length === 0 && (
              <div className={cn("text-center text-muted-foreground/85", spacing.cardGenerous)} role="status">
                No pipelines match your filters
              </div>
            )}
          </CardContent>
        </Card>
      </section>

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