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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Sparkles,
  Play,
  Plus,
  Filter,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Bell,
  Clock,
  Database,
  GitBranch,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Code,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface QualityRule {
  id: string;
  name: string;
  type: 'completeness' | 'uniqueness' | 'validity' | 'consistency' | 'accuracy' | 'timeliness';
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'active' | 'inactive' | 'testing';
  passRate: number;
  lastRun: string;
  affectedRows: number;
  sqlCondition?: string;
}

const mockQualityRules: QualityRule[] = [
  {
    id: '1',
    name: 'customer_id_not_null',
    type: 'completeness',
    severity: 'critical',
    status: 'active',
    passRate: 99.8,
    lastRun: '2 hours ago',
    affectedRows: 42,
    sqlCondition: 'customer_id IS NOT NULL'
  },
  {
    id: '2',
    name: 'email_format_valid',
    type: 'validity',
    severity: 'warning',
    status: 'active',
    passRate: 97.2,
    lastRun: '2 hours ago',
    affectedRows: 523,
    sqlCondition: "email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'"
  },
  {
    id: '3',
    name: 'transaction_amount_positive',
    type: 'validity',
    severity: 'error',
    status: 'active',
    passRate: 99.99,
    lastRun: '2 hours ago',
    affectedRows: 2,
    sqlCondition: 'transaction_amount > 0'
  },
  {
    id: '4',
    name: 'order_id_unique',
    type: 'uniqueness',
    severity: 'critical',
    status: 'active',
    passRate: 100,
    lastRun: '2 hours ago',
    affectedRows: 0,
    sqlCondition: 'COUNT(order_id) = COUNT(DISTINCT order_id)'
  },
  {
    id: '5',
    name: 'data_freshness_check',
    type: 'timeliness',
    severity: 'warning',
    status: 'testing',
    passRate: 95.5,
    lastRun: '1 hour ago',
    affectedRows: 1250,
    sqlCondition: "last_updated >= CURRENT_DATE - INTERVAL '24 hours'"
  }
];

const qualityTrendData = [
  { date: '2024-03-15', score: 92, issues: 145 },
  { date: '2024-03-16', score: 93, issues: 132 },
  { date: '2024-03-17', score: 94, issues: 128 },
  { date: '2024-03-18', score: 93.5, issues: 135 },
  { date: '2024-03-19', score: 95, issues: 110 },
  { date: '2024-03-20', score: 96.2, issues: 95 },
  { date: '2024-03-21', score: 96.8, issues: 82 },
];

const ruleTypeDistribution = [
  { name: 'Completeness', value: 35, color: '#3b82f6' },
  { name: 'Validity', value: 28, color: '#10b981' },
  { name: 'Uniqueness', value: 20, color: '#f59e0b' },
  { name: 'Consistency', value: 10, color: '#8b5cf6' },
  { name: 'Accuracy', value: 5, color: '#ec4899' },
  { name: 'Timeliness', value: 2, color: '#06b6d4' },
];

const severityColors = {
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-orange-500',
  critical: 'text-red-500'
};

const typeIcons = {
  completeness: Database,
  uniqueness: GitBranch,
  validity: CheckCircle,
  consistency: Layers,
  accuracy: Activity,
  timeliness: Clock
};

export function QualityManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRule, setSelectedRule] = useState<QualityRule | null>(null);
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);

  const overallQualityScore = 96.8;
  const totalRules = mockQualityRules.length;
  const activeRules = mockQualityRules.filter(r => r.status === 'active').length;
  const failingRules = mockQualityRules.filter(r => r.passRate < 95).length;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Quality Management System</h2>
            <p className="text-sm text-muted-foreground mt-1">
              SQLMesh audit rules and data quality monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import Rules
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button size="sm" onClick={() => setShowNewRuleModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-background px-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Quality Rules</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="overview" className="h-full m-0 p-6">
              <div className="space-y-6">
                {/* Quality Score Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="text-5xl font-bold text-green-600">
                          {overallQualityScore}%
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">
                              +2.3% from last week
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Based on {totalRules} active rules
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{activeRules}</div>
                          <div className="text-xs text-muted-foreground">Active Rules</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">{failingRules}</div>
                          <div className="text-xs text-muted-foreground">Need Attention</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">1.2M</div>
                          <div className="text-xs text-muted-foreground">Rows Validated</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Trend</CardTitle>
                    <CardDescription>
                      Quality score and issue count over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={qualityTrendData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis yAxisId="left" className="text-xs" />
                        <YAxis yAxisId="right" orientation="right" className="text-xs" />
                        <Tooltip />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="score"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#colorScore)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="issues"
                          stroke="#ef4444"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Rule Type Distribution */}
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rule Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={ruleTypeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {ruleTypeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Critical Issues</CardTitle>
                      <CardDescription>
                        Rules requiring immediate attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {mockQualityRules
                        .filter(r => r.passRate < 98)
                        .slice(0, 3)
                        .map(rule => (
                          <div key={rule.id} className="flex items-center justify-between p-2 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={cn("h-4 w-4", severityColors[rule.severity])} />
                              <div>
                                <p className="text-sm font-medium">{rule.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {rule.affectedRows} rows affected
                                </p>
                              </div>
                            </div>
                            <Badge variant="destructive">{rule.passRate}%</Badge>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>

                {aiSuggestionsEnabled && (
                  <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <AlertTitle className="text-purple-900 dark:text-purple-100">
                      AI Quality Insights
                    </AlertTitle>
                    <AlertDescription className="text-purple-700 dark:text-purple-300 space-y-2 mt-2">
                      <p className="text-sm">• Email validation failures increased 15% - consider adding domain whitelist</p>
                      <p className="text-sm">• Null values in optional fields could be converted to defaults</p>
                      <p className="text-sm">• Date format inconsistencies detected across 3 tables</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rules" className="h-full m-0 p-6">
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-md">
                    <Input placeholder="Search rules..." className="w-full" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Rule Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="completeness">Completeness</SelectItem>
                      <SelectItem value="validity">Validity</SelectItem>
                      <SelectItem value="uniqueness">Uniqueness</SelectItem>
                      <SelectItem value="consistency">Consistency</SelectItem>
                      <SelectItem value="accuracy">Accuracy</SelectItem>
                      <SelectItem value="timeliness">Timeliness</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    More Filters
                  </Button>
                </div>

                {/* Rules List */}
                <div className="space-y-3">
                  {mockQualityRules.map(rule => {
                    const TypeIcon = typeIcons[rule.type];
                    return (
                      <Card 
                        key={rule.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedRule(rule)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "p-2 rounded-lg",
                                rule.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                              )}>
                                <TypeIcon className={cn(
                                  "h-5 w-5",
                                  rule.status === 'active' ? 'text-green-600' : 'text-gray-600'
                                )} />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{rule.name}</h3>
                                  <Badge className={cn(
                                    "text-xs",
                                    severityColors[rule.severity].replace('text-', 'bg-').replace('500', '100'),
                                    severityColors[rule.severity].replace('text-', 'text-').replace('500', '700')
                                  )}>
                                    {rule.severity}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {rule.type}
                                  </Badge>
                                  {rule.status === 'testing' && (
                                    <Badge variant="secondary" className="text-xs">
                                      Testing
                                    </Badge>
                                  )}
                                </div>
                                {rule.sqlCondition && (
                                  <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    {rule.sqlCondition}
                                  </code>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  {rule.passRate >= 99 ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : rule.passRate >= 95 ? (
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className={cn(
                                    "text-lg font-semibold",
                                    rule.passRate >= 99 ? "text-green-600" :
                                    rule.passRate >= 95 ? "text-yellow-600" : "text-red-600"
                                  )}>
                                    {rule.passRate}%
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {rule.lastRun}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch checked={rule.status === 'active'} />
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Bulk Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Bulk Rule Management</CardTitle>
                    <CardDescription>
                      Apply actions to multiple rules at once
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="mr-2 h-4 w-4" />
                        Run All Rules
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset Statistics
                      </Button>
                      <Button variant="outline" size="sm">
                        <Code className="mr-2 h-4 w-4" />
                        Generate SQLMesh Audits
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="h-full m-0 p-6">
              <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Real-time Quality Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={qualityTrendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Monitors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Data Freshness</span>
                        <Badge variant="outline" className="text-xs">
                          <Activity className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Schema Compliance</span>
                        <Badge variant="outline" className="text-xs">
                          <Activity className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Anomaly Detection</span>
                        <Badge variant="outline" className="text-xs">
                          <Activity className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      </div>
                      <Progress value={88} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="h-full m-0 p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alert Configuration</CardTitle>
                  <CardDescription>
                    Configure notifications for quality rule violations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Critical Rule Failures</p>
                          <p className="text-sm text-muted-foreground">
                            Alert when any critical rule fails
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Quality Score Drop</p>
                          <p className="text-sm text-muted-foreground">
                            Alert when quality score drops below 95%
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Anomaly Detection</p>
                          <p className="text-sm text-muted-foreground">
                            Alert on unusual data patterns
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="h-full m-0 p-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Standards</CardTitle>
                    <CardDescription>
                      Track compliance with data quality standards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">ODPS v4.0 Compliance</p>
                            <p className="text-sm text-muted-foreground">
                              Open Data Product Specification
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-600">Compliant</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="font-medium">GDPR Data Quality</p>
                            <p className="text-sm text-muted-foreground">
                              EU data protection standards
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-yellow-600">3 issues</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">SOC 2 Type II</p>
                            <p className="text-sm text-muted-foreground">
                              Security and availability standards
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-600">Compliant</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Audit Trail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="flex items-center justify-between p-2 border-b">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">Quality rule modified: email_validation</p>
                                <p className="text-xs text-muted-foreground">
                                  By admin@company.com • 2024-03-2{i} 14:30
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="h-full m-0 p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Reports</CardTitle>
                  <CardDescription>
                    Generate and download data quality reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="font-medium">Executive Summary</h4>
                            <p className="text-sm text-muted-foreground">
                              High-level quality metrics and trends
                            </p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Generate Report
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-green-500 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="font-medium">Detailed Analysis</h4>
                            <p className="text-sm text-muted-foreground">
                              Rule-by-rule quality assessment
                            </p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Generate Report
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="font-medium">Compliance Report</h4>
                            <p className="text-sm text-muted-foreground">
                              Regulatory compliance documentation
                            </p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Generate Report
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-orange-500 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="font-medium">Improvement Plan</h4>
                            <p className="text-sm text-muted-foreground">
                              AI-generated quality improvement roadmap
                            </p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Generate Report
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}