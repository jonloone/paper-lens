'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Activity,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Plus,
  RefreshCw,
  Loader2,
  Terminal,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Settings,
  Search,
  Database,
  GitBranch,
  Shield,
  Zap,
  Brain
} from 'lucide-react';
import { APIGateway } from '@/lib/services/APIGateway';
import { MCPOrchestrator } from '@/lib/services/MCPOrchestrator';

interface CrewTask {
  id: string;
  type: string;
  priority: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  submitted: Date;
  description?: string;
}

interface MCPServer {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: Date;
  toolCount?: number;
}

interface SystemStats {
  totalTools: number;
  mcpServers: number;
  activeCrews: number;
  tasksCompleted: number;
  systemStatus: 'healthy' | 'warning' | 'error';
  uptime: string;
}

export default function CrewsPage() {
  const [tasks, setTasks] = useState<CrewTask[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [gateway] = useState(() => new APIGateway());
  const [orchestrator] = useState(() => new MCPOrchestrator());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load tasks
      const tasksData = await gateway.getCrewTasks();
      setTasks(tasksData || mockTasks);

      // Load MCP servers status
      const serversData = await gateway.getMCPServers();
      setMcpServers(serversData || mockMcpServers);

      // Calculate system stats
      setSystemStats({
        totalTools: serversData?.reduce((acc, s) => acc + (s.details?.toolCount || 0), 0) || 0,
        mcpServers: serversData?.length || 0,
        activeCrews: tasksData?.filter(t => t.status === 'running').length || 0,
        tasksCompleted: tasksData?.filter(t => t.status === 'success').length || 0,
        systemStatus: serversData?.every(s => s.status === 'healthy') ? 'healthy' : 'warning',
        uptime: '99.9%'
      });
    } catch (error) {
      console.error('Failed to load crew data:', error);
      // Use mock data as fallback
      setTasks(mockTasks);
      setMcpServers(mockMcpServers);
      setSystemStats(mockSystemStats);
    } finally {
      setLoading(false);
    }
  };

  const mockTasks: CrewTask[] = [
    {
      id: 'task-1',
      type: 'crew',
      priority: 1,
      status: 'running',
      submitted: new Date(Date.now() - 300000),
      description: 'Analyzing pipeline failure in customer_etl'
    },
    {
      id: 'task-2',
      type: 'crew',
      priority: 2,
      status: 'pending',
      submitted: new Date(Date.now() - 600000),
      description: 'Optimizing query performance for revenue_report'
    },
    {
      id: 'task-3',
      type: 'crew',
      priority: 1,
      status: 'success',
      submitted: new Date(Date.now() - 900000),
      description: 'Data quality check on products table'
    }
  ];

  const mockMcpServers: MCPServer[] = [
    { name: 'datahub', status: 'healthy', latency: 45, lastCheck: new Date(), toolCount: 12 },
    { name: 'airflow', status: 'healthy', latency: 62, lastCheck: new Date(), toolCount: 8 },
    { name: 'trino', status: 'healthy', latency: 38, lastCheck: new Date(), toolCount: 15 },
    { name: 'ranger', status: 'degraded', latency: 150, lastCheck: new Date(), toolCount: 6 },
    { name: 'nifi', status: 'healthy', latency: 55, lastCheck: new Date(), toolCount: 10 }
  ];

  const mockSystemStats: SystemStats = {
    totalTools: 51,
    mcpServers: 5,
    activeCrews: 1,
    tasksCompleted: 142,
    systemStatus: 'warning',
    uptime: '99.9%'
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'degraded':
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return 'text-green-500';
    if (latency < 100) return 'text-yellow-500';
    return 'text-red-500';
  };

  const submitTask = async () => {
    // This would open a modal or form to submit a new task
    console.log('Submitting new crew task');
  };

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Crew Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={submitTask}>
            <Plus className="h-4 w-4 mr-2" />
            Submit Crew Task
          </Button>
        </div>
      </div>

      {/* System Overview */}
      {systemStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{systemStats.totalTools}</div>
              <div className="text-sm text-muted-foreground">Total Tools</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{systemStats.mcpServers}</div>
              <div className="text-sm text-muted-foreground">MCP Servers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{systemStats.activeCrews}</div>
              <div className="text-sm text-muted-foreground">Active Crews</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{systemStats.tasksCompleted}</div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStats.systemStatus)}
                <span className="font-medium">
                  {systemStats.systemStatus === 'healthy' ? 'Healthy' : 'Warning'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">System Status</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{systemStats.uptime}</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">
            <Activity className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="servers">
            <Server className="h-4 w-4 mr-2" />
            MCP Servers
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Terminal className="h-4 w-4 mr-2" />
            Crew Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Tasks</CardTitle>
                <Input
                  placeholder="Filter tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                  prefix={<Search className="h-4 w-4" />}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(task.status)}
                        <div>
                          <div className="font-medium">{task.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {task.description}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {task.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Priority: {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm text-muted-foreground">
                          Submitted: {task.submitted.toLocaleTimeString()}
                        </div>
                        {task.status === 'running' && (
                          <Button variant="ghost" size="sm">
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {task.status === 'pending' && (
                          <Button variant="ghost" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mcpServers.map((server) => (
              <Card key={server.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{server.name}</CardTitle>
                    {getStatusIcon(server.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={server.status === 'healthy' ? 'default' : 'destructive'}>
                        {server.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Latency</span>
                      <span className={getLatencyColor(server.latency)}>
                        {server.latency}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tools</span>
                      <span>{server.toolCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Check</span>
                      <span>{server.lastCheck.toLocaleTimeString()}</span>
                    </div>
                    <div className="pt-3 border-t flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add MCP Server Button */}
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-8">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add MCP Server
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Available Crew Tools</CardTitle>
                <Button variant="outline" size="sm" onClick={loadData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Discover Tools
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mcpServers.filter(s => s.status === 'healthy').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* DataHub Tools */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">DataHub Tools</h3>
                      <Badge variant="outline" className="text-xs">12 tools</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>searchDatasets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>getLineage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>updateMetadata</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>qualityCheck</span>
                      </div>
                    </div>
                  </div>

                  {/* Airflow Tools */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <GitBranch className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Airflow Tools</h3>
                      <Badge variant="outline" className="text-xs">8 tools</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>triggerDAG</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>pauseDAG</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>getDAGStatus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>createDAG</span>
                      </div>
                    </div>
                  </div>

                  {/* Trino Tools */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Trino Tools</h3>
                      <Badge variant="outline" className="text-xs">15 tools</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>executeQuery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>explainQuery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>getSchemas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>optimizeTable</span>
                      </div>
                    </div>
                  </div>

                  {/* Ranger Tools */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Ranger Tools</h3>
                      <Badge variant="outline" className="text-xs">6 tools</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>createPolicy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>auditAccess</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>grantPermission</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>revokeAccess</span>
                      </div>
                    </div>
                  </div>

                  {/* NiFi Tools */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">NiFi Tools</h3>
                      <Badge variant="outline" className="text-xs">10 tools</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>createFlow</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>startProcessor</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>getFlowStatus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>configureProcessor</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Crew Tools */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">AI Crew Tools</h3>
                      <Badge variant="secondary" className="text-xs">Beta</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>analyzeData</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>suggestOptimization</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>detectAnomalies</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3 w-3 text-muted-foreground" />
                        <span>generateInsights</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No healthy MCP servers available</p>
                  <p className="text-sm mt-2">Connect MCP servers to discover available tools</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tool Execution Playground */}
          <Card>
            <CardHeader>
              <CardTitle>Tool Execution Playground</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Select Server</label>
                    <select className="w-full mt-1 p-2 border rounded">
                      <option>DataHub</option>
                      <option>Airflow</option>
                      <option>Trino</option>
                      <option>Ranger</option>
                      <option>NiFi</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Select Tool</label>
                    <select className="w-full mt-1 p-2 border rounded">
                      <option>searchDatasets</option>
                      <option>getLineage</option>
                      <option>executeQuery</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Parameters</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded font-mono text-sm"
                    rows={4}
                    placeholder='{"query": "customers", "limit": 10}'
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Clear</Button>
                  <Button>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Tool
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}