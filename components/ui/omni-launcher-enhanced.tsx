'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Chat, MagnifyingGlass, GridFour, Folder, X as XIcon } from 'phosphor-react';
import {
  X,
  Send,
  Database,
  GitBranch,
  Activity,
  Settings,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Clock,
  TrendingUp,
  Zap,
  Shield,
  Terminal,
  Cloud,
  Workflow,
  Table,
  Eye,
  Play,
  Copy,
  XCircle,
  Loader2
} from 'lucide-react';

// Data Asset type definition
export interface DataAsset {
  id: string;
  name: string;
  type: 'table' | 'view' | 'pipeline' | 'query' | 'metric' | 'alert' | 'schema' | 'tool';
  description: string;
  schema?: string;
  database?: string;
  quality?: number;
  status?: 'healthy' | 'warning' | 'error' | 'running' | 'stopped';
  lastUpdated?: Date;
  rowCount?: number;
  owner?: string;
  tags?: string[];
  icon?: any;
  color?: string;
  bgColor?: string;
  actions?: Array<{ label: string; link: string }>;
  metadata?: {
    usageCount: number;
    lastAccessed: Date;
    updateFrequency: string;
    size: string;
  };
}

// Enhanced TOOLS array as DataAssets
const TOOLS_AS_ASSETS: DataAsset[] = [
  {
    id: 'nifi',
    name: 'Apache NiFi',
    type: 'tool',
    icon: Cloud,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Data flow orchestration and automation',
    status: 'running',
    tags: ['orchestration', 'streaming'],
    actions: [
      { label: 'Open Dashboard', link: '#' },
      { label: 'Recent Flows', link: '#' }
    ],
    metadata: {
      usageCount: 45,
      lastAccessed: new Date(Date.now() - 5 * 60000),
      updateFrequency: 'Real-time',
      size: '3 flows running'
    }
  },
  {
    id: 'datahub',
    name: 'DataHub',
    type: 'tool',
    icon: Database,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    description: 'Metadata management and data discovery',
    status: 'healthy',
    tags: ['metadata', 'catalog'],
    actions: [
      { label: 'Browse Catalog', link: '#' },
      { label: 'View Lineage', link: '#' }
    ],
    metadata: {
      usageCount: 120,
      lastAccessed: new Date(Date.now() - 2 * 60000),
      updateFrequency: 'Continuous',
      size: '12K assets'
    }
  },
  {
    id: 'airflow',
    name: 'Apache Airflow',
    type: 'tool',
    icon: Workflow,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Workflow orchestration and scheduling',
    status: 'running',
    tags: ['scheduling', 'workflows'],
    actions: [
      { label: 'DAG List', link: '#' },
      { label: 'Recent Runs', link: '#' }
    ],
    metadata: {
      usageCount: 80,
      lastAccessed: new Date(Date.now() - 10 * 60000),
      updateFrequency: 'Scheduled',
      size: '2 DAGs active'
    }
  },
  {
    id: 'trino',
    name: 'Trino',
    type: 'tool',
    icon: Database,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    description: 'Distributed SQL query engine',
    status: 'healthy',
    tags: ['sql', 'analytics'],
    actions: [
      { label: 'Query Editor', link: '/playground' },
      { label: 'Saved Queries', link: '/query' }
    ],
    metadata: {
      usageCount: 200,
      lastAccessed: new Date(Date.now() - 1 * 60000),
      updateFrequency: 'On-demand',
      size: 'Connected'
    }
  },
  {
    id: 'greatex',
    name: 'Great Expectations',
    type: 'tool',
    icon: Shield,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Data quality validation and testing',
    status: 'healthy',
    tags: ['quality', 'validation'],
    actions: [
      { label: 'Expectations', link: '#' },
      { label: 'Validation Results', link: '#' }
    ],
    metadata: {
      usageCount: 65,
      lastAccessed: new Date(Date.now() - 15 * 60000),
      updateFrequency: 'Per pipeline run',
      size: '98% pass rate'
    }
  },
  {
    id: 'datadog',
    name: 'DataDog',
    type: 'tool',
    icon: Activity,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    description: 'Infrastructure and application monitoring',
    status: 'healthy',
    tags: ['monitoring', 'alerts'],
    actions: [
      { label: 'Dashboards', link: '#' },
      { label: 'Logs Explorer', link: '#' }
    ],
    metadata: {
      usageCount: 150,
      lastAccessed: new Date(Date.now() - 3 * 60000),
      updateFrequency: 'Real-time',
      size: 'No alerts'
    }
  },
  // Add sample data assets
  {
    id: 'customer_orders',
    name: 'customer_orders',
    type: 'table',
    icon: Table,
    color: 'text-blue-400',
    description: 'Customer order transactions and details',
    schema: 'production',
    database: 'sales',
    quality: 98,
    status: 'healthy',
    lastUpdated: new Date(Date.now() - 5 * 60000),
    rowCount: 1200000,
    owner: 'data-eng-team',
    tags: ['critical', 'pii'],
    metadata: {
      usageCount: 150,
      lastAccessed: new Date(Date.now() - 2 * 60000),
      updateFrequency: 'Hourly',
      size: '2.1 GB'
    }
  },
  {
    id: 'customer_churn_model',
    name: 'Customer Churn Model v2',
    type: 'metric',
    icon: TrendingUp,
    color: 'text-purple-400',
    description: 'ML model predicting customer churn probability',
    quality: 96,
    status: 'running',
    tags: ['ml', 'predictions'],
    metadata: {
      usageCount: 45,
      lastAccessed: new Date(Date.now() - 20 * 60000),
      updateFrequency: 'Daily',
      size: 'v2.1.0'
    }
  },
  // Data Products (ODPS v4.0)
  {
    id: 'customer-360',
    name: 'Customer 360 View',
    type: 'table',
    icon: Database,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    description: 'Unified customer profile with demographics, interactions, and preferences',
    schema: 'analytics',
    database: 'production',
    quality: 98,
    status: 'healthy',
    rowCount: 2500000,
    tags: ['data-product', 'customer', 'verified'],
    metadata: {
      usageCount: 250,
      lastAccessed: new Date(Date.now() - 1 * 60000),
      updateFrequency: 'Real-time',
      size: '8.5 GB'
    }
  },
  {
    id: 'revenue-metrics',
    name: 'Revenue Metrics Dashboard',
    type: 'metric',
    icon: TrendingUp,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Real-time revenue KPIs with daily/weekly/monthly aggregations',
    schema: 'finance',
    database: 'production',
    quality: 96,
    status: 'healthy',
    tags: ['data-product', 'finance', 'kpi'],
    metadata: {
      usageCount: 180,
      lastAccessed: new Date(Date.now() - 2 * 60000),
      updateFrequency: 'Hourly',
      size: '450 MB'
    }
  },
  // Data Contracts
  {
    id: 'contract-orders',
    name: 'Orders Data Contract',
    type: 'schema',
    icon: Shield,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    description: 'Schema definition and SLA for orders table (99.9% uptime, <5min latency)',
    schema: 'contracts',
    database: 'governance',
    quality: 100,
    status: 'healthy',
    tags: ['data-contract', 'orders', 'sla'],
    metadata: {
      usageCount: 85,
      lastAccessed: new Date(Date.now() - 10 * 60000),
      updateFrequency: 'Weekly review',
      size: 'v3.2'
    }
  },
  // Iceberg Tables
  {
    id: 'iceberg-events',
    name: 'events.user_activity',
    type: 'table',
    icon: Table,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    description: 'Partitioned event stream (1.2TB, 50M rows/day)',
    schema: 'events',
    database: 'iceberg',
    quality: 94,
    status: 'healthy',
    rowCount: 15000000000,
    tags: ['iceberg', 'events', 'streaming'],
    metadata: {
      usageCount: 320,
      lastAccessed: new Date(Date.now() - 1 * 60000),
      updateFrequency: 'Streaming',
      size: '1.2 TB'
    }
  },
  {
    id: 'iceberg-transactions',
    name: 'finance.transactions',
    type: 'table',
    icon: Table,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    description: 'Time-travel enabled transaction history (5 years retention)',
    schema: 'finance',
    database: 'iceberg',
    quality: 99,
    status: 'healthy',
    rowCount: 850000000,
    tags: ['iceberg', 'finance', 'time-travel'],
    metadata: {
      usageCount: 150,
      lastAccessed: new Date(Date.now() - 5 * 60000),
      updateFrequency: 'Real-time',
      size: '680 GB'
    }
  },
  // Source Systems
  {
    id: 'source-salesforce',
    name: 'Salesforce CRM',
    type: 'tool',
    icon: Cloud,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    description: 'Primary CRM system - syncs every 15 minutes',
    status: 'healthy',
    quality: 95,
    tags: ['source', 'crm', 'salesforce'],
    metadata: {
      usageCount: 95,
      lastAccessed: new Date(Date.now() - 3 * 60000),
      updateFrequency: 'Every 15 min',
      size: '42 objects'
    }
  },
  {
    id: 'source-postgres-prod',
    name: 'Production PostgreSQL',
    type: 'tool',
    icon: Database,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Main transactional database - 24 schemas, 450 tables',
    status: 'healthy',
    quality: 98,
    tags: ['source', 'database', 'postgres'],
    metadata: {
      usageCount: 280,
      lastAccessed: new Date(Date.now() - 1 * 60000),
      updateFrequency: 'Real-time CDC',
      size: '24 schemas'
    }
  },
  {
    id: 'ranger',
    name: 'Apache Ranger',
    type: 'tool',
    icon: Shield,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Access control and audit - 2500 policies active',
    status: 'healthy',
    quality: 97,
    tags: ['security', 'governance', 'audit'],
    metadata: {
      usageCount: 110,
      lastAccessed: new Date(Date.now() - 8 * 60000),
      updateFrequency: 'Continuous',
      size: '2500 policies'
    }
  }
];

// Mode configuration
type CommandMode = 'tools' | 'search' | 'ai';

const modeConfig = {
  tools: {
    label: 'Tools',
    shortcut: '⌘T',
    placeholder: 'Search enterprise tools and integrations...'
  },
  search: {
    label: 'Search',
    shortcut: '⌘K',
    placeholder: 'Search data assets, pipelines, and tools...'
  },
  ai: {
    label: 'AI',
    shortcut: '⌘I',
    placeholder: 'Ask AI about your data or get suggestions...'
  }
};

interface OmniLauncherEnhancedProps {
  position?: 'left' | 'right';
  currentPage?: string;
  workflowContext?: any;
  dataAssets?: DataAsset[];
}

export function OmniLauncherEnhanced({
  position = 'left',
  currentPage = 'build',
  workflowContext,
  dataAssets = TOOLS_AS_ASSETS
}: OmniLauncherEnhancedProps) {
  const [expandedMode, setExpandedMode] = useState<'collapsed' | 'chat' | CommandMode>('collapsed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; actions?: any[] }>>([
    {
      role: 'assistant',
      content: 'How can I help you with your data workflows?',
      actions: []
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate container width based on expanded mode
  const getContainerWidth = () => {
    if (expandedMode === 'collapsed') return 'w-[90px]'; // 90px to fit 72px buttons + 18px padding
    if (expandedMode === 'chat') return 'w-[720px]'; // 90px icons + 630px content
    if (selectedAsset && expandedMode !== 'chat') return 'w-[1100px]'; // 90px icons + 1010px content (split view)
    return 'w-[720px]'; // 90px icons + 630px content (single column search)
  };

  // Filter and group assets based on mode and search
  const filteredAssets = useMemo(() => {
    let assets = dataAssets;

    // Filter by mode - Tools mode shows ONLY tools
    if (expandedMode === 'tools') {
      assets = assets.filter(a => a.type === 'tool');
    }
    // Search mode shows everything

    // Filter by search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      assets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchLower) ||
        asset.description.toLowerCase().includes(searchLower) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return assets;
  }, [dataAssets, searchQuery, expandedMode]);

  // Group assets
  const groupedAssets = useMemo(() => {
    const groups: Record<string, DataAsset[]> = {};

    if (expandedMode === 'search') {
      // Enterprise data categorization
      groups['Data Products'] = filteredAssets.filter(a => a.tags?.includes('data-product'));
      groups['Data Contracts'] = filteredAssets.filter(a => a.tags?.includes('data-contract'));
      groups['Iceberg Tables'] = filteredAssets.filter(a => a.tags?.includes('iceberg'));
      groups['Source Systems'] = filteredAssets.filter(a => a.tags?.includes('source'));
      groups['Tools & Platforms'] = filteredAssets.filter(a => a.type === 'tool' && !a.tags?.includes('source'));
      groups['Pipelines'] = filteredAssets.filter(a => a.type === 'pipeline');
      groups['Metrics'] = filteredAssets.filter(a => a.type === 'metric');

      // Fallback for any tables not yet tagged
      const categorizedIds = new Set([
        ...groups['Data Products'].map(a => a.id),
        ...groups['Data Contracts'].map(a => a.id),
        ...groups['Iceberg Tables'].map(a => a.id)
      ]);
      const uncategorizedTables = filteredAssets.filter(a =>
        (a.type === 'table' || a.type === 'view') && !categorizedIds.has(a.id)
      );
      if (uncategorizedTables.length > 0) {
        groups['Other Tables'] = uncategorizedTables;
      }
    } else if (expandedMode === 'tools') {
      // Tools mode: single group of ONLY tools
      groups['Tools'] = filteredAssets;
    } else {
      groups['All'] = filteredAssets;
    }

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [filteredAssets, expandedMode]);

  // Get relevant CrewAI agent based on context
  const getAgentContext = () => {
    const agentMap: Record<string, string> = {
      'build': 'Data Product Builder Agent',
      'catalog': 'Metadata Catalog Agent',
      'monitor': 'Pipeline Monitoring Agent',
      'quality': 'Data Quality Agent',
      'explore': 'Data Discovery Agent',
      'design-system': 'Platform Assistant Agent'
    };

    return agentMap[currentPage] || 'General Data Engineering Agent';
  };

  // Handle chat submit with CrewAI agent integration
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages([...chatMessages, { role: 'user', content: chatInput }]);

    // Simulate CrewAI agent response with context awareness
    setTimeout(() => {
      const agent = getAgentContext();
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `[${agent}] I can help you with "${chatInput}". Analyzing ${currentPage} context...`,
        actions: []
      }]);
    }, 1000);

    setChatInput('');
  };

  // Reset state when collapsing
  useEffect(() => {
    if (expandedMode === 'collapsed') {
      setSearchQuery('');
      setSelectedAsset(null);
    }
  }, [expandedMode]);

  // Handle mode button click
  const handleModeClick = (mode: typeof expandedMode) => {
    if (expandedMode === mode) {
      setExpandedMode('collapsed');
    } else {
      setExpandedMode(mode);
    }
  };

  // Quality Indicator Component
  const QualityIndicator = ({ value }: { value: number }) => {
    const getColor = (val: number) => {
      if (val >= 95) return 'text-green-400 bg-green-400';
      if (val >= 85) return 'text-yellow-400 bg-yellow-400';
      return 'text-red-400 bg-red-400';
    };

    return (
      <div className="flex items-center gap-1 text-xs">
        <div className={cn('w-1.5 h-1.5 rounded-full', getColor(value).split(' ')[1])} />
        <span className={getColor(value).split(' ')[0]}>{value}%</span>
      </div>
    );
  };

  // Status Indicator Component
  const StatusIndicator = ({ status }: { status: string }) => {
    const config = {
      healthy: { color: 'bg-green-400', icon: CheckCircle },
      warning: { color: 'bg-yellow-400', icon: AlertCircle },
      error: { color: 'bg-red-400', icon: XCircle },
      running: { color: 'bg-blue-400', icon: Loader2 },
      stopped: { color: 'bg-gray-400', icon: XCircle }
    }[status] || { color: 'bg-gray-400', icon: AlertCircle };

    const Icon = config.icon;

    return (
      <div className="flex items-center gap-1">
        <div className={cn('w-1.5 h-1.5 rounded-full', config.color, status === 'running' && 'animate-pulse')} />
        <Icon className={cn('w-3 h-3', config.color.replace('bg-', 'text-'), status === 'running' && 'animate-spin')} />
      </div>
    );
  };

  const isExpanded = expandedMode !== 'collapsed';
  const isSearchMode = ['search', 'tools'].includes(expandedMode);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed bottom-24 z-50 transition-all duration-300 ease-out elevation-4",
        position === 'right' ? 'right-0 rounded-l-2xl rounded-r-none border-r-6' : 'left-0 rounded-r-2xl rounded-l-none border-l-6',
        "border-primary/30",
        getContainerWidth()
      )}
      style={{
        transitionProperty: 'width, height',
        transitionDuration: isExpanded ? '400ms, 400ms' : '250ms, 250ms',
        transitionDelay: isExpanded ? '0ms, 300ms' : '0ms, 0ms',
        willChange: 'width, height'
      }}
    >
      <div className={cn(
        "bg-card/98 backdrop-blur-2xl border-2 border-primary/20 overflow-hidden relative",
        position === 'right' ? 'rounded-l-2xl rounded-r-none border-r-0' : 'rounded-r-2xl rounded-l-none border-l-0',
        "transition-[width,height]",
        isExpanded ? "duration-300 h-[700px]" : "duration-200 h-[270px]"
      )}>
        {/* Icon Sidebar - Fixed position on left, always visible - CENTERED VERTICALLY */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[90px] flex flex-col gap-3 p-3 z-10 bg-card/50 backdrop-blur-sm">
          {/* AI Chat Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleModeClick('chat')}
            className={cn(
              "w-[72px] h-[72px] rounded-xl hover:bg-accent/10 transition-all duration-200 shrink-0 flex items-center justify-center",
              expandedMode === 'chat' && "bg-gradient-to-br from-primary/15 to-accent/15 border-2 border-accent/40"
            )}
            title="AI Assistant (⌘I)"
          >
            <Chat weight="bold" size={24} className="text-primary !w-6 !h-6" />
          </Button>

          {/* Search Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleModeClick('search')}
            className={cn(
              "w-[72px] h-[72px] rounded-xl hover:bg-accent/10 transition-all duration-200 shrink-0 flex items-center justify-center",
              expandedMode === 'search' && "bg-gradient-to-br from-primary/15 to-accent/15 border-2 border-accent/40"
            )}
            title="Search (⌘K)"
          >
            <MagnifyingGlass weight="bold" size={24} className="text-primary !w-6 !h-6" />
          </Button>

          {/* Tools Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleModeClick('tools')}
            className={cn(
              "w-[72px] h-[72px] rounded-xl hover:bg-accent/10 transition-all duration-200 shrink-0 flex items-center justify-center",
              expandedMode === 'tools' && "bg-gradient-to-br from-primary/15 to-accent/15 border-2 border-accent/40"
            )}
            title="Tools (⌘T)"
          >
            <GridFour weight="bold" size={24} className="text-primary !w-6 !h-6" />
          </Button>
        </div>

        {/* Close button - Positioned in upper right corner of expanded content */}
        {isExpanded && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setExpandedMode('collapsed')}
            style={{ animationDelay: '700ms' }}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-accent/10 flex items-center justify-center z-20 animate-in fade-in duration-200"
          >
            <X size={20} className="text-muted-foreground" />
          </Button>
        )}

        {/* Expanded Content - Slides in from right of icons */}
        {isExpanded && (
          <div className="absolute left-[90px] top-0 bottom-0 right-0 transition-all duration-300 border-l border-border bg-background/60 backdrop-blur-sm">
            {/* AI Chat Mode */}
            {expandedMode === 'chat' && (
              <div className="flex flex-col h-full max-h-[calc(100vh-100px)]">
                {/* Context Bar */}
                <div className="px-4 py-3 bg-primary/5 border-b border-border/50">
                  <p className="text-sm font-medium text-muted-foreground text-body">
                    Context: {currentPage} → AI Assistant
                  </p>
                </div>

                {/* Chat Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <div key={index} className={cn(
                        "flex",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}>
                        <div className={cn(
                          "max-w-[80%] rounded-xl p-3",
                          message.role === 'user'
                            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground elevation-1"
                            : "bg-muted/80 text-foreground elevation-1"
                        )}>
                          <p className="text-sm leading-relaxed text-body">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about pipelines, data quality, or workflows..."
                      className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-accent/50"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-gradient-to-br from-primary to-accent hover:opacity-90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Search/Query/Pipeline Mode */}
            {isSearchMode && (
              <div className="flex flex-col h-full max-h-[calc(100vh-100px)]">
                {/* Context Bar */}
                <div className="px-4 py-3 bg-muted/30 border-b border-border/50">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80 text-body">
                    <Database className="w-4 h-4" />
                    <span>production</span>
                    <span>•</span>
                    <span>{currentPage}</span>
                    <span>•</span>
                    <Clock className="w-4 h-4" />
                    <span>Last query: 2m ago</span>
                  </div>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <MagnifyingGlass size={16} weight="bold" className="text-muted-foreground" />
                    </div>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={modeConfig[expandedMode as keyof typeof modeConfig]?.placeholder || 'Search...'}
                      className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-accent/50"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Results Grid - Split View when asset selected */}
                <div className={cn(
                  "flex-1 overflow-hidden",
                  selectedAsset ? "grid grid-cols-[1fr,320px]" : ""
                )}>
                  {/* Results List */}
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      {Object.entries(groupedAssets).map(([groupName, assets]) => (
                        <div key={groupName}>
                          <h4 className="text-base font-semibold text-muted-foreground mb-3 flex items-center gap-2 text-body">
                            <Folder size={18} weight="bold" className="text-muted-foreground/70" />
                            {groupName}
                            <Badge variant="secondary" className="text-sm ml-auto font-medium">{assets.length}</Badge>
                          </h4>
                          <div className="space-y-2">
                            {assets.map((asset, index) => {
                              const Icon = asset.icon || Database;
                              return (
                                <button
                                  key={asset.id}
                                  onClick={() => setSelectedAsset(selectedAsset?.id === asset.id ? null : asset)}
                                  className={cn(
                                    "w-full p-3 rounded-lg transition-all duration-200 text-left group",
                                    "hover:bg-accent/10 hover:translate-x-1 border border-transparent",
                                    selectedAsset?.id === asset.id && "bg-accent/10 border-primary"
                                  )}
                                  style={{ animationDelay: `${index * 20}ms` }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", asset.bgColor)}>
                                      <Icon className={cn("w-4 h-4", asset.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-foreground text-base truncate text-body">{asset.name}</div>
                                      <div className="text-sm leading-relaxed text-muted-foreground truncate text-body">{asset.description}</div>
                                      {asset.schema && asset.database && (
                                        <div className="text-sm text-muted-foreground/70 mt-1 text-code">
                                          {asset.database}.{asset.schema}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      {asset.type !== 'tool' && asset.quality && <QualityIndicator value={asset.quality} />}
                                      {asset.status && <StatusIndicator status={asset.status} />}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {Object.keys(groupedAssets).length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <MagnifyingGlass size={32} weight="bold" className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No results found</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Preview Panel - Slides in from right */}
                  {selectedAsset && (
                    <div className={cn(
                      "border-l border-border bg-background/40 backdrop-blur-sm elevation-1",
                      "animate-in slide-in-from-right duration-250"
                    )}>
                      <ScrollArea className="h-full">
                        <div className="p-4 space-y-4">
                          {/* Header */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {selectedAsset.icon && <selectedAsset.icon className={cn('w-5 h-5', selectedAsset.color)} />}
                              <h3 className="font-semibold text-foreground text-base text-body">{selectedAsset.name}</h3>
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground text-body">{selectedAsset.description}</p>
                          </div>

                          {/* Metadata */}
                          <div className="space-y-2">
                            {selectedAsset.type !== 'tool' && selectedAsset.quality && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-muted-foreground/70 text-body">Quality</span>
                                <QualityIndicator value={selectedAsset.quality} />
                              </div>
                            )}
                            {selectedAsset.status && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-muted-foreground/70 text-body">Status</span>
                                <StatusIndicator status={selectedAsset.status} />
                              </div>
                            )}
                            {selectedAsset.rowCount && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-muted-foreground/70 text-body">Rows</span>
                                <span className="text-foreground font-semibold text-body">{selectedAsset.rowCount.toLocaleString()}</span>
                              </div>
                            )}
                            {selectedAsset.metadata?.size && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-muted-foreground/70 text-body">Size</span>
                                <span className="text-foreground font-semibold text-body">{selectedAsset.metadata.size}</span>
                              </div>
                            )}
                            {selectedAsset.lastUpdated && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-muted-foreground/70 text-body">Updated</span>
                                <span className="text-foreground font-semibold text-body">
                                  {new Date(selectedAsset.lastUpdated).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-sm font-medium text-muted-foreground/70 text-body">Tags</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedAsset.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="space-y-2 pt-4 border-t border-border">
                            {selectedAsset.actions?.map((action, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant="outline"
                                className="w-full justify-start gap-2 text-xs"
                                onClick={() => {
                                  if (action.link && action.link !== '#') {
                                    if (action.label === 'Query Editor') {
                                      window.open(action.link, '_blank', 'width=1200,height=800');
                                    } else {
                                      window.location.href = action.link;
                                    }
                                  }
                                }}
                              >
                                <ArrowRight className="w-3 h-3" />
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}