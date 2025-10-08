'use client';

import '@/styles/workspace.css';
import '@/styles/typography.css';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedQueryBar } from '@/components/query/UnifiedQueryBar';
import { QueryResults } from '@/components/query/QueryResults';
import { QueryActionsBar } from '@/components/query/QueryActionsBar';
import { QueryPipelineBuilder } from '@/components/query/QueryPipelineBuilder';
import { AdaptiveQueryInterface } from '@/components/query/AdaptiveQueryInterface';
import { PipelineProductization } from '@/components/productization/PipelineProductization';
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
import { DatadogDashboard } from '@/components/monitoring/DatadogDashboard';
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
  Filter,
  AlertCircle
} from 'lucide-react';

export default function DataEngineeringWorkspace() {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [showPipelineBuilder, setShowPipelineBuilder] = useState(true);
  const [showProductization, setShowProductization] = useState(false);
  const [currentPipeline, setCurrentPipeline] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header with Navigation */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NexusOneLogo className="h-7 text-foreground" />
            <Badge variant="outline" className="text-blue-400 border-blue-400/30 text-xs">
              Data Engineering Platform
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <AgentStatusBadge />
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
        
        {/* Navigation Tabs in Header */}
        <div className="px-6 pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-12 bg-transparent border-0 p-0 rounded-none">
              <TabsTrigger 
                value="explore" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Explore
              </TabsTrigger>
              <TabsTrigger 
                value="build" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Build
              </TabsTrigger>
              <TabsTrigger 
                value="deploy" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Deploy
              </TabsTrigger>
              <TabsTrigger 
                value="monitor" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Monitor
              </TabsTrigger>
              <TabsTrigger 
                value="govern" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Govern
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Workflow Shortcuts Bar */}
      <div className="border-b border-border bg-muted/30">
        <div className="px-6 py-2 flex items-center gap-2 overflow-x-auto">
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => setActiveTab('deploy')}
          >
            <Database className="h-3.5 w-3.5" />
            New Ingestion
            <Badge variant="secondary" className="text-xs">Save 2hr</Badge>
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => setActiveTab('build')}
          >
            <GitBranch className="h-3.5 w-3.5" />
            New Pipeline
            <Badge variant="secondary" className="text-xs">Save 1.5hr</Badge>
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => setActiveTab('monitor')}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Debug Failed Job
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => setActiveTab('explore')}
          >
            <Search className="h-3.5 w-3.5" />
            View Lineage
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => setActiveTab('build')}
          >
            <Play className="h-3.5 w-3.5" />
            Quick Query
            <Badge variant="secondary" className="text-xs">10x faster</Badge>
          </Button>
        </div>
      </div>

      {/* Tool Status Strip */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="font-medium">NiFi:</span>
              <span className="text-muted-foreground">5 flows active</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              <span className="font-medium">Airflow:</span>
              <span className="text-muted-foreground">1 DAG failed</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="font-medium">Trino:</span>
              <span className="text-muted-foreground">Active</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="font-medium">Iceberg:</span>
              <span className="text-muted-foreground">Synced</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="font-medium">DataHub:</span>
              <span className="text-muted-foreground">Online</span>
            </button>
          </div>
          <div className="text-muted-foreground">
            <span className="font-medium">Orchestration Active:</span> Saving ~4hrs/day
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
        {/* Main Workspace Content */}
        <Tabs value={activeTab} className="space-y-6">

          {/* Explore - Data Discovery & Lineage */}
          <TabsContent value="explore" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* System Health Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Data Discovery
                    <Badge variant="outline" className="text-xs">10x faster</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UnifiedDiscovery 
                    onSelectAsset={(asset) => {
                      console.log('Selected asset:', asset);
                      setActiveTab('build');
                    }}
                    onCreateProduct={(table) => {
                      console.log('Create product from table:', table);
                      setActiveTab('build');
                    }}
                  />
                </CardContent>
              </Card>

              {/* Lineage & Tool Handoffs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Lineage Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 border rounded-lg">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Auto-generated lineage maps</p>
                    <p className="text-xs text-muted-foreground mt-2">NiFi → Iceberg → Trino → Consumers</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Complex Analysis (20%):</p>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Open DataHub Lineage
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Terminal className="h-4 w-4 mr-2" />
                      Trino Schema Explorer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Discoveries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Discoveries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">customer.transactions</p>
                      <p className="text-sm text-muted-foreground">350M rows • Updated hourly</p>
                    </div>
                    <Badge variant="secondary">Iceberg</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">product.inventory</p>
                      <p className="text-sm text-muted-foreground">1.2M rows • Real-time</p>
                    </div>
                    <Badge variant="secondary">NiFi Stream</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  💡 Smart suggestions based on your query patterns
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Build - Query & Transform */}
          <TabsContent value="build" className="space-y-6">
            <div className="space-y-6">
              {/* Data Product Creation Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Build & Transform
                    <Badge variant="outline" className="text-xs">75% less boilerplate</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdaptiveQueryInterface
                    onExecute={(sql) => {
                      console.log('Executing SQL:', sql);
                      setQueryResult({
                        data: [],
                        schema: [],
                        executionTime: 1234,
                        rowCount: 0,
                        truncated: false,
                        samplingRate: 0.1,
                        estimatedCost: 2.45,
                        estimatedSize: 1073741824
                      });
                    }}
                    onSaveAsProduct={(product) => {
                      console.log('Saving as product:', product);
                    }}
                  />
                  
                  {/* Query Results */}
                  {queryResult && (
                    <div className="mt-6">
                      <QueryResults 
                        data={queryResult.data}
                        schema={queryResult.schema}
                        executionTime={queryResult.executionTime}
                        rowCount={queryResult.rowCount}
                        truncated={queryResult.truncated}
                        isPreview={true}
                        samplingRate={queryResult.samplingRate || 0.1}
                        estimatedCost={queryResult.estimatedCost || 2.45}
                        estimatedSize={queryResult.estimatedSize || 1073741824}
                        governanceRecommendations={queryResult.governanceRecommendations}
                        onExport={(format) => {
                          console.log('Exporting as:', format);
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Value Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">10x</div>
                    <p className="text-sm text-muted-foreground">Faster query writing</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">Auto</div>
                    <p className="text-sm text-muted-foreground">DAG generation</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">1-click</div>
                    <p className="text-sm text-muted-foreground">Deploy to production</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Deploy - Orchestration & Scheduling */}
          <TabsContent value="deploy" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ingestion (NiFi) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Ingestion (NiFi)
                    <Badge variant="outline" className="text-xs">Real-time</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">80% Common Ingestion Patterns</h4>
                    <p className="text-sm text-muted-foreground mb-3">Pre-built NiFi flow templates • Save 2+ hours</p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Zap className="h-4 w-4 mr-2" />
                        Kafka → Iceberg Consumer
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Database className="h-4 w-4 mr-2" />
                        S3 → Iceberg Watcher
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <GitBranch className="h-4 w-4 mr-2" />
                        API → Iceberg Poller
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 border border-dashed rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Complex Flows (20%):</p>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Terminal className="h-4 w-4 mr-2" />
                      Open NiFi Canvas
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Processing (Airflow) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Processing (Airflow)
                    <Badge variant="outline" className="text-xs">Scheduled</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">80% Common DAG Templates</h4>
                    <p className="text-sm text-muted-foreground mb-3">Auto-generated Airflow DAGs • Save 1.5+ hours</p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Clock className="h-4 w-4 mr-2" />
                        Daily ETL Job
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Incremental Load Pipeline
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Filter className="h-4 w-4 mr-2" />
                        Data Quality Check DAG
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 border border-dashed rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Complex DAGs (20%):</p>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Open Airflow UI
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MCP Agent Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  MCP-Enabled Automation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-green-500 mx-auto mb-2"></div>
                    <p className="font-medium">Data Integration Agent</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-green-500 mx-auto mb-2"></div>
                    <p className="font-medium">Quality Monitoring Agent</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mx-auto mb-2"></div>
                    <p className="font-medium">Pipeline Optimizer Agent</p>
                    <p className="text-sm text-muted-foreground">Optimizing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitor - Unified Observability */}
          <TabsContent value="monitor" className="space-y-6">
            {/* Pipeline Health Matrix */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Pipeline Health Matrix
                  <Badge variant="outline" className="text-xs">Real-time</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">NiFi</span>
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-2xl font-bold">1.2M</p>
                    <p className="text-xs text-muted-foreground">records/min</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Airflow</span>
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    </div>
                    <p className="text-2xl font-bold">47/50</p>
                    <p className="text-xs text-muted-foreground">DAGs successful</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Trino</span>
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-2xl font-bold">89</p>
                    <p className="text-xs text-muted-foreground">queries/hour</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Iceberg</span>
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-2xl font-bold">2.3TB</p>
                    <p className="text-xs text-muted-foreground">stored</p>
                  </div>
                </div>
                
                {/* Proactive Alerts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">NiFi backpressure detected</p>
                      <p className="text-xs text-muted-foreground">customer_events flow - auto-scaling initiated</p>
                    </div>
                    <Button size="sm" variant="outline">Investigate</Button>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Airflow DAG failed</p>
                      <p className="text-xs text-muted-foreground">revenue_calc - retry in 5 min</p>
                    </div>
                    <Button size="sm" variant="outline">Debug</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Integrated Monitoring */}
            <DatadogDashboard />
          </TabsContent>

          {/* Govern - Policy & Compliance Automation */}
          <TabsContent value="govern" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Policy Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Policy Automation
                    <Badge variant="outline" className="text-xs">90% automated</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">PII Data Classification</p>
                        <p className="text-sm text-muted-foreground">Auto-applied • Saves 30min/dataset</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Access Control Sync</p>
                        <p className="text-sm text-muted-foreground">Across all tools • No manual config</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Data Retention</p>
                        <p className="text-sm text-muted-foreground">Auto-cleanup • 100% compliant</p>
                      </div>
                      <Badge variant="secondary">Configured</Badge>
                    </div>
                  </div>
                  <div className="p-3 border border-dashed rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Complex policies (10%):</p>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Open Apache Ranger
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Data Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <QualityRuleManager />
                </CardContent>
              </Card>
            </div>

            {/* Compliance Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Compliance & Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">95%</p>
                    <p className="text-sm text-muted-foreground">Policy Compliance</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">847</p>
                    <p className="text-sm text-muted-foreground">Audit Events Today</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">3</p>
                    <p className="text-sm text-muted-foreground">Policy Violations</p>
                  </div>
                </div>
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
      
      {/* Pipeline Productization Modal */}
      {showProductization && currentPipeline && (
        <PipelineProductization
          pipeline={currentPipeline}
          onSave={(product) => {
            console.log('Saving data product:', product);
            setShowProductization(false);
            setCurrentPipeline(null);
            // Here you would save to backend
          }}
          onClose={() => {
            setShowProductization(false);
            setCurrentPipeline(null);
          }}
        />
      )}
      
      {/* Bottom Chat Bar */}
      <BottomChatBar />
    </div>
  );
}