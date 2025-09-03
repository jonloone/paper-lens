'use client';

import '@/styles/workspace.css';
import '@/styles/typography.css';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedQueryBar } from '@/components/query/UnifiedQueryBar';
import { QueryResults } from '@/components/query/QueryResults';
import { QueryActionsBar } from '@/components/query/QueryActionsBar';
import { UnifiedDiscovery } from '@/components/discover/UnifiedDiscovery';
import { SQLGenerationEngine } from '@/components/data-engineering/SQLGenerationEngine';
import { DataSourceSelector } from '@/components/data-engineering/DataSourceSelector';
import { QualityRuleManager } from '@/components/data-engineering/QualityRuleManager';
import { DataIngestionWorkflow } from '@/components/data-engineering/DataIngestionWorkflow';
import { BottomChatBar } from '@/components/chat/BottomChatBar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PerformanceChart } from '@/components/visualization/PerformanceChart';
import { AgentStatusBadge } from '@/components/agents/AgentStatusIndicator';
import { NexusOneLogo } from '@/components/ui/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Sparkles, 
  Shield, 
  Play, 
  Settings, 
  ChevronRight,
  Activity,
  Zap,
  GitBranch,
  Users,
  Terminal,
  Package,
  Search,
  Star,
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';

export default function DataEngineeringWorkspace() {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('unified-query');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <NexusOneLogo className="h-7 text-foreground" />
            <Badge variant="outline" className="text-blue-400 border-blue-400/30">
              Data Engineering Platform
            </Badge>
            <AgentStatusBadge />
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">DE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Pipelines</p>
                  <p className="text-2xl font-bold text-foreground">247</p>
                </div>
                <Activity className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Data Quality</p>
                  <p className="text-2xl font-bold text-foreground">94%</p>
                </div>
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Processing Speed</p>
                  <p className="text-2xl font-bold text-foreground">1.2TB/h</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Team Members</p>
                  <p className="text-2xl font-bold text-foreground">12</p>
                </div>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Workspace Tabs - Lifecycle Flow */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/50 border border-border p-1">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="automate" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automate
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Monitor
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab - Unified Discovery */}
          <TabsContent value="discover" className="space-y-6">
            <UnifiedDiscovery 
              onSelectAsset={(asset) => {
                console.log('Selected asset:', asset);
                setActiveTab('create');
              }}
              onCreateProduct={(table) => {
                console.log('Create product from table:', table);
                setActiveTab('create');
              }}
            />
          </TabsContent>

          {/* Create Tab - Development Environment */}
          <TabsContent value="create" className="space-y-6">
            {/* Unified Query Bar */}
            <UnifiedQueryBar 
              onQueryExecute={setQueryResult}
              onProductCreate={(product) => {
                console.log('Creating product:', product);
              }}
              dataContext={{
                workspaceId: 'workspace-1',
                userId: 'user-1'
              }}
            />
            
            {/* Query Results */}
            {queryResult && (
              <>
                <QueryResults 
                  data={queryResult.data}
                  schema={queryResult.schema}
                  executionTime={queryResult.executionTime}
                  rowCount={queryResult.rowCount}
                  truncated={queryResult.truncated}
                  onExport={(format) => {
                    console.log('Exporting as:', format);
                  }}
                />
                
                {/* Query Actions Bar */}
                <QueryActionsBar 
                  queryResult={queryResult}
                  onProductize={(config) => {
                    console.log('Productizing with config:', config);
                    // Navigate to product creation or show success
                  }}
                  onSaveQuery={(name, description) => {
                    console.log('Saving query:', { name, description });
                  }}
                  onSchedule={(schedule) => {
                    console.log('Scheduling:', schedule);
                  }}
                  onShare={(shareConfig) => {
                    console.log('Sharing:', shareConfig);
                  }}
                  onCreatePipeline={() => {
                    console.log('Creating pipeline');
                    setActiveTab('pipelines');
                  }}
                />
              </>
            )}
          </TabsContent>

          {/* Products Tab - Portfolio Management */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Data Products</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Product portfolio management coming soon...</p>
                <p className="text-sm mt-2">Manage versions, monitor usage, and handle deprecation</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automate Tab - Pipeline Orchestration */}
          <TabsContent value="automate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Hub</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Pipeline orchestration and scheduling coming soon...</p>
                <p className="text-sm mt-2">Create workflows, manage schedules, and monitor execution</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitor Tab - Governance & Observability */}
          <TabsContent value="monitor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Quality metrics and governance dashboard coming soon...</p>
                <p className="text-sm mt-2">Monitor data quality, track compliance, and manage alerts</p>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="w-full max-w-md bg-card rounded-lg border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-gray-400">Choose your preferred theme</p>
                  </div>
                  <ThemeToggle />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-gray-400">Manage alert preferences</p>
                  </div>
                  <button className="text-sm text-blue-400 hover:text-blue-300">Configure</button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">API Keys</p>
                    <p className="text-sm text-gray-400">Manage integration keys</p>
                  </div>
                  <button className="text-sm text-blue-400 hover:text-blue-300">Manage</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom Chat Bar */}
      <BottomChatBar />
    </div>
  );
}