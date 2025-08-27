"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Code,
  Play,
  Save,
  Settings,
  Database,
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  FileCode,
  Table,
  Calendar,
  Zap,
  TrendingUp,
  Activity,
  RefreshCw,
  Download,
  Upload,
  Copy,
  Terminal,
  ChevronRight,
  Layers,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import Editor from '@monaco-editor/react';

interface ProcessingConfigurationProps {
  projectId?: string;
  modelId?: string;
}

const mockSQLModels = [
  { id: '1', name: 'customer_360', kind: 'INCREMENTAL', status: 'deployed' },
  { id: '2', name: 'revenue_forecast', kind: 'FULL', status: 'development' },
  { id: '3', name: 'inventory_optimization', kind: 'VIEW', status: 'testing' },
];

const modelKinds = [
  { value: 'FULL', label: 'Full Refresh', description: 'Rebuild entire table' },
  { value: 'INCREMENTAL', label: 'Incremental', description: 'Process only new/changed data' },
  { value: 'VIEW', label: 'View', description: 'Virtual table (no materialization)' },
  { value: 'INCREMENTAL_BY_TIME_RANGE', label: 'Time Range', description: 'Process specific time windows' },
  { value: 'SCD_TYPE_2', label: 'SCD Type 2', description: 'Track historical changes' },
];

const scheduleCrons = [
  { value: '@hourly', label: 'Hourly' },
  { value: '@daily', label: 'Daily' },
  { value: '@weekly', label: 'Weekly' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
  { value: '0 0 * * 1-5', label: 'Weekdays at midnight' },
  { value: 'custom', label: 'Custom cron...' },
];

export function ProcessingConfiguration({ projectId, modelId }: ProcessingConfigurationProps) {
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedModel, setSelectedModel] = useState(mockSQLModels[0]);
  const [modelKind, setModelKind] = useState('INCREMENTAL');
  const [schedule, setSchedule] = useState('@daily');
  const [sqlCode, setSqlCode] = useState(`MODEL (
  name customer_360,
  kind INCREMENTAL,
  owner data_team,
  cron '@daily',
  grain customer_id,
  audits (unique_values(columns := (customer_id)), not_null(columns := (customer_id, last_updated)))
);

-- Customer 360 view combining multiple data sources
SELECT 
  c.customer_id,
  c.customer_name,
  c.registration_date,
  c.customer_segment,
  COALESCE(t.total_transactions, 0) AS total_transactions,
  COALESCE(t.total_revenue, 0) AS total_revenue,
  COALESCE(t.avg_transaction_value, 0) AS avg_transaction_value,
  COALESCE(w.page_views, 0) AS total_page_views,
  COALESCE(w.sessions, 0) AS total_sessions,
  c.last_activity_date,
  CURRENT_TIMESTAMP AS last_updated
FROM {{ ref('staging_customers') }} c
LEFT JOIN {{ ref('customer_transactions_agg') }} t 
  ON c.customer_id = t.customer_id
LEFT JOIN {{ ref('customer_web_activity_agg') }} w 
  ON c.customer_id = w.customer_id
WHERE 1=1
  {% if is_incremental %}
    AND c.last_activity_date >= (SELECT MAX(last_activity_date) FROM {{ this }})
  {% endif %}`);

  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [aiEnabled, setAiEnabled] = useState(true);

  const runModel = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setTestResults({
        success: true,
        rowsProcessed: 15234,
        executionTime: 2.4,
        cost: 0.12
      });
    }, 3000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">SQLMesh Model Development</h2>
            <Select value={selectedModel.id} onValueChange={(id) => setSelectedModel(mockSQLModels.find(m => m.id === id) || mockSQLModels[0])}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockSQLModels.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      <span>{model.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {model.kind}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <GitBranch className="mr-2 h-4 w-4" />
              Version History
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={runModel} disabled={isRunning}>
              {isRunning ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Model
                </>
              )}
            </Button>
            <Button size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-background px-4">
            <TabsTrigger value="editor">SQL Editor</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="lineage">Lineage</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="editor" className="h-full m-0 flex">
              <div className="flex-1 flex flex-col">
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language="sql"
                    theme="vs-dark"
                    value={sqlCode}
                    onChange={(value) => setSqlCode(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
                
                {testResults && (
                  <div className="border-t p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Execution Successful</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{testResults.rowsProcessed.toLocaleString()} rows</span>
                          <span>{testResults.executionTime}s</span>
                          <span>${testResults.cost}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Terminal className="mr-2 h-4 w-4" />
                        View Logs
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {aiEnabled && (
                <div className="w-80 border-l p-4 bg-muted/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        AI Assistant
                      </h3>
                      <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                    </div>
                    
                    <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                      <Info className="h-4 w-4 text-purple-600" />
                      <AlertTitle className="text-purple-900 dark:text-purple-100">
                        Optimization Suggestions
                      </AlertTitle>
                      <AlertDescription className="text-purple-700 dark:text-purple-300 space-y-2 mt-2">
                        <p className="text-sm">• Consider partitioning by date for better performance</p>
                        <p className="text-sm">• Add clustering on customer_id to optimize joins</p>
                        <p className="text-sm">• The WHERE clause can be simplified using QUALIFY</p>
                      </AlertDescription>
                    </Alert>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Query Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Estimated time</span>
                          <span className="font-medium">2.4s</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Cost estimate</span>
                          <span className="font-medium">$0.12</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Data scanned</span>
                          <span className="font-medium">1.2 GB</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Dependencies</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <div className="text-sm py-1">staging_customers</div>
                        <div className="text-sm py-1">customer_transactions_agg</div>
                        <div className="text-sm py-1">customer_web_activity_agg</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="configuration" className="h-full m-0 p-6 overflow-auto">
              <div className="max-w-4xl space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Model Configuration</CardTitle>
                    <CardDescription>
                      Configure SQLMesh model kind, grain, and processing strategy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Model Kind</Label>
                        <Select value={modelKind} onValueChange={setModelKind}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {modelKinds.map(kind => (
                              <SelectItem key={kind.value} value={kind.value}>
                                <div>
                                  <div className="font-medium">{kind.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {kind.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Grain</Label>
                        <Input placeholder="e.g., customer_id, order_date" />
                      </div>
                    </div>

                    {modelKind === 'INCREMENTAL' && (
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-sm font-medium">Incremental Settings</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Unique Key</Label>
                            <Input placeholder="customer_id" />
                          </div>
                          <div className="space-y-2">
                            <Label>On Schema Change</Label>
                            <Select defaultValue="sync_all_columns">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sync_all_columns">Sync All Columns</SelectItem>
                                <SelectItem value="fail">Fail</SelectItem>
                                <SelectItem value="ignore">Ignore</SelectItem>
                                <SelectItem value="append_new_columns">Append New Columns</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Lookback Window</Label>
                          <div className="flex gap-2">
                            <Input type="number" placeholder="7" className="w-20" />
                            <Select defaultValue="days">
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                                <SelectItem value="months">Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="partitioning">Enable Partitioning</Label>
                        <Switch id="partitioning" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="clustering">Enable Clustering</Label>
                        <Switch id="clustering" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="materialized">Materialized</Label>
                        <Switch id="materialized" defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Custom Macros</CardTitle>
                    <CardDescription>
                      Define reusable SQL macros for this model
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Package className="mr-2 h-4 w-4" />
                        Add Organizational Macro Library
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Code className="mr-2 h-4 w-4" />
                        Create Custom Macro
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="scheduling" className="h-full m-0 p-6 overflow-auto">
              <div className="max-w-4xl space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Schedule Configuration</CardTitle>
                    <CardDescription>
                      Configure when and how often this model should run
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Schedule</Label>
                        <Select value={schedule} onValueChange={setSchedule}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {scheduleCrons.map(cron => (
                              <SelectItem key={cron.value} value={cron.value}>
                                {cron.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select defaultValue="UTC">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                            <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {schedule === 'custom' && (
                      <div className="space-y-2">
                        <Label>Custom Cron Expression</Label>
                        <Input placeholder="0 0 * * *" />
                        <p className="text-xs text-muted-foreground">
                          Use standard cron syntax. Example: 0 0 * * * (daily at midnight)
                        </p>
                      </div>
                    )}

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-medium">Execution Settings</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="retries">Enable Retries</Label>
                            <p className="text-xs text-muted-foreground">
                              Automatically retry failed runs
                            </p>
                          </div>
                          <Switch id="retries" defaultChecked />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Max Retries</Label>
                            <Input type="number" defaultValue="3" />
                          </div>
                          <div className="space-y-2">
                            <Label>Retry Delay (minutes)</Label>
                            <Input type="number" defaultValue="5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-medium">Dependencies</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">staging_customers</span>
                          </div>
                          <Badge variant="outline">Upstream</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">customer_dashboard</span>
                          </div>
                          <Badge variant="outline">Downstream</Badge>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Layers className="mr-2 h-4 w-4" />
                        Manage Dependencies
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="lineage" className="h-full m-0 p-6">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Data Lineage</CardTitle>
                  <CardDescription>
                    Visualize upstream and downstream dependencies
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-full">
                  <div className="h-[400px] border rounded-lg bg-muted/30 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <GitBranch className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-muted-foreground">Lineage visualization would appear here</p>
                      <Button variant="outline" size="sm">
                        Open in DataHub
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitoring" className="h-full m-0 p-6 overflow-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">98.5%</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avg Execution Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">2.4s</div>
                      <p className="text-xs text-muted-foreground">15% faster than last week</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Data Freshness</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12m</div>
                      <p className="text-xs text-muted-foreground">Last updated</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Runs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">Run #{1000 + i}</p>
                              <p className="text-xs text-muted-foreground">
                                2024-03-2{i} 10:00:00 UTC
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span>15,234 rows</span>
                            <span>2.{i}s</span>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="h-full m-0 p-6 overflow-auto">
              <div className="space-y-6">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900 dark:text-green-100">
                    Performance Optimized
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    This model is performing 23% better than the baseline. 
                    Current optimizations are saving approximately $42/month in compute costs.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Recommendations</CardTitle>
                    <CardDescription>
                      AI-powered suggestions to improve performance and reduce costs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Add Partitioning</p>
                            <p className="text-xs text-muted-foreground">
                              Partition by date_column to reduce data scanning by ~60%
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Apply</Button>
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <Activity className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Optimize Join Order</p>
                            <p className="text-xs text-muted-foreground">
                              Reorder joins to filter earlier, reducing intermediate result size
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Apply</Button>
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <Database className="h-4 w-4 text-purple-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Use Clustering Keys</p>
                            <p className="text-xs text-muted-foreground">
                              Cluster on customer_id to improve join performance by ~30%
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Apply</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current monthly cost</span>
                        <span className="font-medium">$156.42</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Projected with optimizations</span>
                        <span className="font-medium text-green-600">$114.30</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Potential savings</span>
                        <span className="font-bold text-green-600">$42.12/month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}