'use client';

import React, { useState } from 'react';
import {
  Settings,
  Database,
  Server,
  Users,
  Key,
  Bell,
  Shield,
  Monitor,
  Plus,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Plug,
  UserPlus,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ToolConnection {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'connected' | 'error' | 'disconnected';
  version?: string;
  lastPing?: string;
  logo?: string;
}

interface MCPServer {
  id: string;
  name: string;
  tool: string;
  status: 'active' | 'error' | 'stopped';
  latency: number;
  uptime: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Engineer' | 'Analyst';
  lastActive: string;
  status: 'active' | 'invited';
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('connections');
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolConnection | null>(null);

  // Mock data
  const [toolConnections] = useState<ToolConnection[]>([
    {
      id: '1',
      name: 'NiFi Cluster',
      type: 'Data Processing',
      url: 'nifi.company.com',
      status: 'connected',
      version: '1.23.0',
      lastPing: '30s ago'
    },
    {
      id: '2',
      name: 'Airflow',
      type: 'Orchestration',
      url: 'airflow.company.com',
      status: 'connected',
      version: '2.8.1',
      lastPing: '45s ago'
    },
    {
      id: '3',
      name: 'Kafka Cluster',
      type: 'Streaming',
      url: 'kafka.company.com:9092',
      status: 'error',
      version: '3.5.0',
      lastPing: '2m ago'
    },
    {
      id: '4',
      name: 'Snowflake',
      type: 'Storage',
      url: 'company.snowflakecomputing.com',
      status: 'connected',
      version: 'Enterprise',
      lastPing: '1m ago'
    }
  ]);

  const [mcpServers] = useState<MCPServer[]>([
    {
      id: '1',
      name: 'nifi-mcp',
      tool: 'NiFi',
      status: 'active',
      latency: 45,
      uptime: '7d 14h'
    },
    {
      id: '2',
      name: 'airflow-mcp',
      tool: 'Airflow',
      status: 'active',
      latency: 32,
      uptime: '7d 14h'
    },
    {
      id: '3',
      name: 'spark-mcp',
      tool: 'Spark',
      status: 'active',
      latency: 67,
      uptime: '3d 8h'
    },
    {
      id: '4',
      name: 'kafka-mcp',
      tool: 'Kafka',
      status: 'error',
      latency: 0,
      uptime: '0h'
    },
    {
      id: '5',
      name: 'snowflake-mcp',
      tool: 'Snowflake',
      status: 'active',
      latency: 89,
      uptime: '7d 14h'
    },
    {
      id: '6',
      name: 'dbt-mcp',
      tool: 'dbt',
      status: 'active',
      latency: 23,
      uptime: '7d 14h'
    },
    {
      id: '7',
      name: 'airbyte-mcp',
      tool: 'Airbyte',
      status: 'stopped',
      latency: 0,
      uptime: '0h'
    },
    {
      id: '8',
      name: 'datadog-mcp',
      tool: 'Datadog',
      status: 'active',
      latency: 54,
      uptime: '7d 14h'
    }
  ]);

  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@company.com',
      role: 'Admin',
      lastActive: '5 minutes ago',
      status: 'active'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      role: 'Engineer',
      lastActive: '1 hour ago',
      status: 'active'
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      role: 'Engineer',
      lastActive: '2 days ago',
      status: 'active'
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@company.com',
      role: 'Analyst',
      lastActive: 'Never',
      status: 'invited'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'disconnected':
      case 'stopped':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <Check className="h-3 w-3" />;
      case 'error':
        return <X className="h-3 w-3" />;
      case 'disconnected':
      case 'stopped':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleTestConnection = async (toolId: string) => {
    console.log('Testing connection for:', toolId);
    // Implementation would go here
  };

  const handleRestartMCP = async (serverId: string) => {
    console.log('Restarting MCP server:', serverId);
    // Implementation would go here
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Configure tool connections and platform settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
        </TabsList>

        {/* Tool Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tool Connections</CardTitle>
                  <CardDescription>Manage connections to your data tools and platforms</CardDescription>
                </div>
                <Button onClick={() => setShowAddToolModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Connection
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {toolConnections.map(tool => (
                <Card key={tool.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Database className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{tool.name}</CardTitle>
                          <CardDescription>{tool.url}</CardDescription>
                        </div>
                      </div>
                      <Badge className={cn("gap-1", getStatusColor(tool.status))}>
                        {getStatusIcon(tool.status)}
                        {tool.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground space-x-4">
                        <span>Type: {tool.type}</span>
                        {tool.version && <span>Version: {tool.version}</span>}
                        {tool.lastPing && <span>Last ping: {tool.lastPing}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleTestConnection(tool.id)}
                        >
                          Test Connection
                        </Button>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                        <Button size="sm">
                          Open UI
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Kafka Connection Issue</AlertTitle>
                <AlertDescription>
                  The Kafka cluster is experiencing high consumer lag. This may affect real-time data processing.
                  <div className="mt-2">
                    <Button size="sm">Investigate Issue</Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MCP Servers Tab */}
        <TabsContent value="mcp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MCP Server Status</CardTitle>
              <CardDescription>Model Context Protocol servers providing tool integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">Total Servers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">6</div>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">2</div>
                    <p className="text-xs text-muted-foreground">Issues</p>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Server</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mcpServers.map(server => (
                    <TableRow key={server.id}>
                      <TableCell className="font-medium">{server.name}</TableCell>
                      <TableCell>{server.tool}</TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", getStatusColor(server.status))}>
                          {getStatusIcon(server.status)}
                          {server.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {server.latency > 0 ? `${server.latency}ms` : '-'}
                      </TableCell>
                      <TableCell>{server.uptime}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRestartMCP(server.id)}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Restart
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage user access and permissions</CardDescription>
                </div>
                <Button onClick={() => setShowAddUserModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === 'active' ? 'default' : 'outline'}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.lastActive}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage programmatic access to the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">Production API Key</div>
                    <div className="text-sm text-muted-foreground">Created 3 months ago</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge>Active</Badge>
                    <Button size="sm" variant="outline">Regenerate</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">CI/CD Pipeline Key</div>
                    <div className="text-sm text-muted-foreground">Created 1 month ago</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge>Active</Badge>
                    <Button size="sm" variant="outline">Regenerate</Button>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create New API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Settings Tab */}
        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive critical alerts via email</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Slack Integration</div>
                  <div className="text-sm text-muted-foreground">Send alerts to Slack channels</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">In-app Notifications</div>
                  <div className="text-sm text-muted-foreground">Show notifications in the platform</div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monitoring</CardTitle>
              <CardDescription>Configure system monitoring and alerting thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Health Check Interval</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Every 10 seconds</SelectItem>
                    <SelectItem value="30">Every 30 seconds</SelectItem>
                    <SelectItem value="60">Every minute</SelectItem>
                    <SelectItem value="300">Every 5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alert Threshold</Label>
                <Select defaultValue="3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">After 1 failure</SelectItem>
                    <SelectItem value="3">After 3 failures</SelectItem>
                    <SelectItem value="5">After 5 failures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Platform security and access control settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Require 2FA for all users</div>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Session Timeout</div>
                  <div className="text-sm text-muted-foreground">Auto-logout after 30 minutes of inactivity</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Audit Logging</div>
                  <div className="text-sm text-muted-foreground">Log all configuration changes</div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Tool Connection Modal */}
      <Dialog open={showAddToolModal} onOpenChange={setShowAddToolModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Tool Connection</DialogTitle>
            <DialogDescription>
              Connect a new data tool to the platform
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tool Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select tool type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processing">Data Processing</SelectItem>
                  <SelectItem value="orchestration">Orchestration</SelectItem>
                  <SelectItem value="storage">Storage System</SelectItem>
                  <SelectItem value="analytics">Analytics Platform</SelectItem>
                  <SelectItem value="streaming">Streaming</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tool-name">Tool Name</Label>
              <Input id="tool-name" placeholder="e.g., Production Snowflake" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tool-url">Connection URL</Label>
              <Input id="tool-url" placeholder="https://your-tool.example.com" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tool-key">API Key or Token</Label>
              <Input id="tool-key" type="password" placeholder="Enter authentication credentials" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddToolModal(false)}>
              Cancel
            </Button>
            <Button>Test & Add Connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a new user to the platform
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">Email Address</Label>
              <Input id="user-email" type="email" placeholder="user@company.com" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input id="user-name" placeholder="John Smith" />
            </div>
            
            <div className="space-y-2">
              <Label>Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="engineer">Data Engineer</SelectItem>
                  <SelectItem value="analyst">Data Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
              Cancel
            </Button>
            <Button>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}