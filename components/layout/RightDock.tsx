'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { launchPlayground } from '@/lib/utils/playground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Chat, MagnifyingGlass, GridFour } from 'phosphor-react';
import {
  X,
  Send,
  Database,
  Activity,
  Shield,
  Cloud,
  Workflow,
  Table,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  ArrowRight,
  GitBranch,
  Terminal
} from 'lucide-react';

// ============================================================================
// Types & Data
// ============================================================================

interface DataAsset {
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
  logoPath?: string; // Path to logo image in /public
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

// Sample data assets (tools, tables, pipelines, metrics, etc.)
const DATA_ASSETS: DataAsset[] = [
  // Tools
  {
    id: 'datahub',
    name: 'DataHub',
    type: 'tool',
    icon: Database,
    logoPath: '/tech-icons/datahub.svg',
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
    logoPath: '/tech-icons/apache-airflow.svg',
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
    icon: Terminal,
    logoPath: '/tech-icons/trino.svg',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    description: 'Distributed SQL query engine',
    status: 'healthy',
    tags: ['sql', 'analytics'],
    actions: [
      { label: 'Open SQL Editor', link: 'playground:trino' },
      { label: 'Query History', link: '#' }
    ],
    metadata: {
      usageCount: 200,
      lastAccessed: new Date(Date.now() - 1 * 60000),
      updateFrequency: 'On-demand',
      size: 'Connected'
    }
  },
  {
    id: 'datadog',
    name: 'DataDog',
    type: 'tool',
    icon: Activity,
    logoPath: '/tech-icons/datadog.svg',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    description: 'Infrastructure and application monitoring',
    status: 'healthy',
    tags: ['monitoring', 'alerts'],
    metadata: {
      usageCount: 150,
      lastAccessed: new Date(Date.now() - 3 * 60000),
      updateFrequency: 'Real-time',
      size: 'No alerts'
    }
  },
  {
    id: 'ranger',
    name: 'Apache Ranger',
    type: 'tool',
    icon: Shield,
    logoPath: '/tech-icons/ranger.svg',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Access control and audit',
    status: 'healthy',
    tags: ['security', 'governance'],
    metadata: {
      usageCount: 110,
      lastAccessed: new Date(Date.now() - 8 * 60000),
      updateFrequency: 'Continuous',
      size: '2500 policies'
    }
  },
  // Tables
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
  // Metrics
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
  // Pipelines
  {
    id: 'customer_etl_pipeline',
    name: 'Customer ETL Pipeline',
    type: 'pipeline',
    icon: GitBranch,
    color: 'text-indigo-400',
    description: 'Daily customer data aggregation and transformation',
    status: 'running',
    quality: 95,
    tags: ['etl', 'customer', 'daily'],
    metadata: {
      usageCount: 30,
      lastAccessed: new Date(Date.now() - 1 * 60000),
      updateFrequency: 'Daily at 2 AM',
      size: 'Runtime: 45m'
    }
  }
];

type DockMode = 'collapsed' | 'chat' | 'search' | 'tools';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: Array<{ label: string; action: string }>;
}

interface RightDockProps {
  hasPendingInsight?: boolean;
  contextData?: {
    selectedTables?: string[];
    currentStep?: string;
    productIntent?: string;
  };
}

// ============================================================================
// RightDock Component
// ============================================================================

export function RightDock(props?: RightDockProps) {
  const { hasPendingInsight = false, contextData } = props || {};
  const pathname = usePathname();
  const [mode, setMode] = useState<DockMode>('collapsed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'How can I help you with your data workflows?',
      actions: []
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Get context-aware tools based on current page
  const getContextualTools = useCallback(() => {
    const tools = DATA_ASSETS.filter(asset => asset.type === 'tool');

    if (pathname.startsWith('/build')) {
      // Build page: show data ingestion and transformation tools
      return tools.filter(t => ['airflow', 'trino', 'datahub'].includes(t.id));
    } else if (pathname.startsWith('/operations') || pathname.startsWith('/monitor')) {
      // Operations/Monitor: show monitoring and orchestration tools
      return tools.filter(t => ['datadog', 'airflow', 'ranger'].includes(t.id));
    } else if (pathname.startsWith('/discover')) {
      // Discover: show catalog and query tools
      return tools.filter(t => ['datahub', 'trino'].includes(t.id));
    }

    // Default: show all tools
    return tools;
  }, [pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setMode(mode === 'search' ? 'collapsed' : 'search');
      }
      // Cmd/Ctrl + / for chat
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setMode(mode === 'chat' ? 'collapsed' : 'chat');
      }
      // Escape to close
      if (e.key === 'Escape' && mode !== 'collapsed') {
        e.preventDefault();
        setMode('collapsed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  const handleModeClick = (newMode: DockMode) => {
    if (mode === newMode) {
      setMode('collapsed');
    } else {
      setMode(newMode);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');

    // Call the agent orchestration API with context
    try {
      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: chatInput,
          context: {
            workspaceId: 'workspace-1',
            userId: 'user-1',
            sessionId: `session-${Date.now()}`,
            selectedTables: contextData?.selectedTables || [],
            currentStep: contextData?.currentStep || 'unknown',
            productIntent: contextData?.productIntent || ''
          }
        })
      });

      const data = await response.json();

      // Generate contextual quick actions
      const quickActions: Array<{ label: string; action: string }> = [];
      if (contextData?.selectedTables && contextData.selectedTables.length > 0) {
        quickActions.push({
          label: '🔗 Analyze join patterns',
          action: `Analyze common join patterns for ${contextData.selectedTables.join(', ')}`
        });
        quickActions.push({
          label: '📊 Check data quality',
          action: `Review data quality for selected tables`
        });
      }

      // Extract response content
      let responseContent = data.conversationalResponse ||
        (data.success && data.results ? JSON.stringify(data.results) :
          `I can help you with "${chatInput}". Let me analyze that...`);

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: responseContent,
        actions: quickActions.length > 0 ? quickActions : undefined
      }]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    }
  };

  // Filter assets for search mode
  const filteredAssets = searchQuery
    ? DATA_ASSETS.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        asset.schema?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.database?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DATA_ASSETS;

  // Group assets by type for search
  const groupedAssets = React.useMemo(() => {
    const groups: Record<string, DataAsset[]> = {};

    const categoryOrder = [
      'Tables',
      'Metrics',
      'Queries',
      'Pipelines',
      'Views',
      'Schemas',
      'Alerts',
      'Tools',
      'Other'
    ];

    filteredAssets.forEach(asset => {
      const groupName = {
        'table': 'Tables',
        'metric': 'Metrics',
        'query': 'Queries',
        'pipeline': 'Pipelines',
        'view': 'Views',
        'schema': 'Schemas',
        'alert': 'Alerts',
        'tool': 'Tools'
      }[asset.type] || 'Other';

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(asset);
    });

    const sortedGroups: Record<string, DataAsset[]> = {};
    categoryOrder.forEach(category => {
      if (groups[category]) {
        sortedGroups[category] = groups[category];
      }
    });

    return sortedGroups;
  }, [filteredAssets]);

  // Get contextual tools for tools mode
  const contextualTools = getContextualTools();

  // Quality Indicator
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

  // Status Indicator
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

  const isExpanded = mode !== 'collapsed';

  return (
    <div className="right-dock-wrapper">
      {/* Radial Gradient Backdrop */}
      <div
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none"
        style={{
          width: isExpanded ? '500px' : '150px',
          height: isExpanded ? 'calc(65vh)' : '200px',
          background: 'radial-gradient(ellipse 60% 80% at 80% 50%, hsl(var(--primary) / 0.15), transparent 70%)',
          transition: 'height 500ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, width 500ms cubic-bezier(0.23, 1, 0.32, 1) 200ms',
          willChange: 'width, height'
        }}
      />

      {/* Unified Expanding Dock */}
      <div
        className={cn(
          'fixed right-4 top-1/2 -translate-y-1/2 z-50',
          'backdrop-blur-[32px]',
          'border-2 border-blue-400/50',
          'rounded-2xl shadow-2xl',
          'overflow-hidden'
        )}
        style={{
          width: isExpanded ? '484px' : '64px',
          height: isExpanded ? 'calc(65vh)' : '200px',
          backgroundColor: 'hsl(var(--card) / 0.6)',
          transition: 'height 500ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, width 500ms cubic-bezier(0.23, 1, 0.32, 1) 200ms',
          willChange: 'width, height'
        }}
      >
        <div className="flex h-full">
          {/* Launcher Buttons - Always visible on right */}
          <div className={cn(
            "flex flex-col gap-1 p-2 shrink-0",
            isExpanded && "border-l-2 border-blue-400/30"
          )}>
            {/* AI Chat Button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleModeClick('chat')}
              className={cn(
                "relative w-12 h-12 rounded-xl hover:bg-accent/10 transition-all duration-200",
                mode === 'chat' && "bg-gradient-to-br from-primary/15 to-accent/15 border border-accent/40"
              )}
              title="AI Assistant (Cmd+/)"
            >
              <Chat weight="bold" size={20} className="text-foreground" />
              {hasPendingInsight && mode !== 'chat' && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
              )}
            </Button>

            {/* Search Button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleModeClick('search')}
              className={cn(
                "w-12 h-12 rounded-xl hover:bg-accent/10 transition-all duration-200",
                mode === 'search' && "bg-gradient-to-br from-primary/15 to-accent/15 border border-accent/40"
              )}
              title="Search (Cmd+K)"
            >
              <MagnifyingGlass weight="bold" size={20} className="text-foreground" />
            </Button>

            {/* Divider */}
            <div className="w-full h-px bg-white/10 my-1" />

            {/* Tools Button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleModeClick('tools')}
              className={cn(
                "relative w-12 h-12 rounded-xl hover:bg-accent/10 transition-all duration-200",
                mode === 'tools' && "bg-gradient-to-br from-primary/15 to-accent/15 border border-accent/40"
              )}
              title="Contextual Tools"
            >
              <GridFour weight="bold" size={20} className="text-foreground" />
              {contextualTools.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent/20 rounded-full flex items-center justify-center border border-accent/40">
                  <span className="text-xs text-foreground font-medium">{contextualTools.length}</span>
                </span>
              )}
            </Button>
          </div>

          {/* Expanded Content Area */}
          {isExpanded && (
            <div className="flex-1 flex flex-col h-full min-w-0">
              {/* Close Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMode('collapsed')}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-accent/10 z-10"
              >
                <X size={16} className="text-muted-foreground" />
              </Button>

              {/* AI Chat Mode */}
              {mode === 'chat' && (
                <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-4 py-3 bg-white/10 border-b border-white/10 rounded-t-2xl">
                  <p className="text-sm font-medium text-foreground">
                    AI Assistant
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Context-aware help for your workflow
                  </p>
                </div>

                {/* Chat Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <div key={index} className={cn(
                        "flex flex-col gap-2",
                        message.role === 'user' ? 'items-end' : 'items-start'
                      )}>
                        <div className={cn(
                          "max-w-[85%] rounded-xl p-3",
                          message.role === 'user'
                            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                            : "bg-muted/50 border border-border text-foreground"
                        )}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>

                        {/* Quick Action Buttons */}
                        {message.actions && message.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 max-w-[85%]">
                            {message.actions.map((action, i) => (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setChatInput(action.action)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about pipelines, data quality, or workflows..."
                      className="flex-1"
                    />
                    <Button type="submit" size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
              )}

              {/* Search Mode */}
              {mode === 'search' && (
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="px-4 py-3 bg-white/10 border-b border-white/10 rounded-tl-2xl">
                  <p className="text-sm font-medium text-foreground">
                    Search Data Assets
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Find tables, pipelines, metrics, and tools
                  </p>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-white/10">
                  <div className="relative">
                    <MagnifyingGlass size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search data assets..."
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Results */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                    {Object.keys(groupedAssets).map((groupName) => (
                      <div key={groupName} className="space-y-2">
                        {/* Group Header */}
                        <div className="flex items-center gap-2 px-2 mb-3">
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {groupName}
                          </h3>
                          <div className="flex-1 h-px bg-border" />
                          <Badge variant="secondary" className="text-xs">
                            {groupedAssets[groupName].length}
                          </Badge>
                        </div>

                        {/* Group Items */}
                        <div className="space-y-2">
                          {groupedAssets[groupName].map((asset) => {
                            const Icon = asset.icon || Database;
                            return (
                              <button
                                key={asset.id}
                                onClick={() => setSelectedAsset(selectedAsset?.id === asset.id ? null : asset)}
                                className={cn(
                                  "w-full p-3 rounded-lg transition-all duration-200 text-left border",
                                  selectedAsset?.id === asset.id
                                    ? "border-primary bg-accent/10"
                                    : "border-border bg-background hover:bg-accent/5"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", asset.bgColor || "bg-muted/30")}>
                                    <Icon className={cn("w-4 h-4", asset.color || "text-foreground")} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-foreground text-sm truncate">{asset.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{asset.description}</div>
                                    {asset.schema && asset.database && (
                                      <div className="text-xs text-muted-foreground/70 mt-0.5 font-mono">
                                        {asset.database}.{asset.schema}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    {asset.type !== 'tool' && asset.quality && <QualityIndicator value={asset.quality} />}
                                    {asset.status && <StatusIndicator status={asset.status} />}
                                  </div>
                                </div>

                                {/* Expanded details */}
                                {selectedAsset?.id === asset.id && asset.actions && (
                                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                    {asset.actions.map((action, i) => (
                                      <Button
                                        key={i}
                                        size="sm"
                                        variant="outline"
                                        className="w-full justify-start gap-2 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (action.link && action.link !== '#') {
                                            if (action.link.startsWith('playground:')) {
                                              const toolName = action.link.split(':')[1];
                                              launchPlayground({
                                                from: `rightdock-${toolName}`,
                                                title: `${asset.name} SQL Editor`
                                              });
                                            } else {
                                              window.open(action.link, '_blank');
                                            }
                                          }
                                        }}
                                      >
                                        <ArrowRight className="w-3 h-3" />
                                        {action.label}
                                      </Button>
                                    ))}
                                  </div>
                                )}
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
              </div>
              )}

              {/* Tools Mode */}
              {mode === 'tools' && (
            <div className="flex flex-col h-full">
                {/* Tools Grid */}
                <ScrollArea className="flex-1 p-4 scroll-fade-subtle">
                  <div className="space-y-3 py-12">
                    {contextualTools.map((tool) => {
                      const Icon = tool.icon || Database;
                      return (
                        <div
                          key={tool.id}
                          className="p-4 rounded-lg border border-border bg-background"
                        >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", tool.bgColor)}>
                            {tool.logoPath ? (
                              <Image
                                src={tool.logoPath}
                                alt={`${tool.name} logo`}
                                width={24}
                                height={24}
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <Icon className={cn("w-5 h-5", tool.color)} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground text-sm mb-1">{tool.name}</div>
                            <p className="text-sm text-muted-foreground">{tool.description}</p>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {tool.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Actions */}
                        {tool.actions && (
                          <div className="space-y-2">
                            {tool.actions.map((action, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant="outline"
                                className="w-full justify-start gap-2 text-xs"
                                onClick={() => {
                                  if (action.link && action.link !== '#') {
                                    if (action.link.startsWith('playground:')) {
                                      const toolName = action.link.split(':')[1];
                                      launchPlayground({
                                        from: `rightdock-${toolName}`,
                                        title: `${tool.name} SQL Editor`
                                      });
                                    } else {
                                      window.open(action.link, '_blank');
                                    }
                                  }
                                }}
                              >
                                <ArrowRight className="w-3 h-3" />
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
              )}

          </div>
          )}
        </div>
      </div>
    </div>
  );
}
