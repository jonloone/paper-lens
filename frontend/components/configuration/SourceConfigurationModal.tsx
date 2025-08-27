"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database,
  Server,
  Shield,
  Key,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Play,
  RefreshCw,
  Lock,
  Unlock,
  FileJson,
  Table,
  GitBranch,
  Activity,
  Settings,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceConfigurationModalProps {
  open: boolean;
  onClose: () => void;
  sourceId?: string;
}

const databaseTypes = [
  { id: 'postgresql', name: 'PostgreSQL', port: 5432 },
  { id: 'mysql', name: 'MySQL', port: 3306 },
  { id: 'snowflake', name: 'Snowflake', port: 443 },
  { id: 'redshift', name: 'Amazon Redshift', port: 5439 },
  { id: 'bigquery', name: 'BigQuery', port: 443 },
  { id: 'databricks', name: 'Databricks', port: 443 },
  { id: 'mongodb', name: 'MongoDB', port: 27017 },
  { id: 'oracle', name: 'Oracle', port: 1521 },
  { id: 'sqlserver', name: 'SQL Server', port: 1433 }
];

const authMethods = [
  { id: 'password', name: 'Username & Password' },
  { id: 'key', name: 'API Key' },
  { id: 'oauth', name: 'OAuth 2.0' },
  { id: 'certificate', name: 'Certificate' },
  { id: 'kerberos', name: 'Kerberos' },
  { id: 'ldap', name: 'LDAP' }
];

export function SourceConfigurationModal({ 
  open, 
  onClose, 
  sourceId 
}: SourceConfigurationModalProps) {
  const [activeTab, setActiveTab] = useState('connection');
  const [dbType, setDbType] = useState('postgresql');
  const [authMethod, setAuthMethod] = useState('password');
  const [connectionName, setConnectionName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useSSL, setUseSSL] = useState(true);
  const [connectionPooling, setConnectionPooling] = useState(true);
  const [maxConnections, setMaxConnections] = useState('10');
  const [connectionTimeout, setConnectionTimeout] = useState('30');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [aiAssistEnabled, setAiAssistEnabled] = useState(true);

  const handleDatabaseTypeChange = (type: string) => {
    setDbType(type);
    const dbInfo = databaseTypes.find(db => db.id === type);
    if (dbInfo) {
      setPort(dbInfo.port.toString());
    }
  };

  const testConnection = () => {
    setTestStatus('testing');
    setTimeout(() => {
      setTestStatus(Math.random() > 0.3 ? 'success' : 'failed');
    }, 2000);
  };

  const generateJdbcUrl = () => {
    if (!host || !port || !database) return '';
    
    const urls: Record<string, string> = {
      postgresql: `jdbc:postgresql://${host}:${port}/${database}`,
      mysql: `jdbc:mysql://${host}:${port}/${database}`,
      oracle: `jdbc:oracle:thin:@${host}:${port}:${database}`,
      sqlserver: `jdbc:sqlserver://${host}:${port};databaseName=${database}`,
      snowflake: `jdbc:snowflake://${host}.snowflakecomputing.com/?db=${database}`,
      redshift: `jdbc:redshift://${host}:${port}/${database}`,
      mongodb: `mongodb://${host}:${port}/${database}`
    };
    
    return urls[dbType] || '';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {sourceId ? 'Edit Data Source' : 'Configure New Data Source'}
          </DialogTitle>
          <DialogDescription>
            Set up connection parameters and test connectivity to your data source
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="discovery">Discovery</TabsTrigger>
            <TabsTrigger value="test">Test & Save</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="connection" className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="connection-name">Connection Name</Label>
                <Input 
                  id="connection-name"
                  placeholder="e.g., Production Database"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Database Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {databaseTypes.map((db) => (
                    <div
                      key={db.id}
                      onClick={() => handleDatabaseTypeChange(db.id)}
                      className={cn(
                        "p-3 rounded-lg border-2 cursor-pointer transition-all",
                        dbType === db.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{db.name}</span>
                        <Database className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input 
                    id="host"
                    placeholder="localhost or IP address"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input 
                    id="port"
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="database">Database Name</Label>
                <Input 
                  id="database"
                  placeholder="Database or schema name"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>JDBC URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={generateJdbcUrl()}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {aiAssistEnabled && (
                <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <AlertTitle className="text-purple-900 dark:text-purple-100">
                    AI Configuration Assistant
                  </AlertTitle>
                  <AlertDescription className="text-purple-700 dark:text-purple-300">
                    Based on your selection of {databaseTypes.find(d => d.id === dbType)?.name}, 
                    we recommend enabling connection pooling with 10-20 connections for optimal performance.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="authentication" className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label>Authentication Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  {authMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setAuthMethod(method.id)}
                      className={cn(
                        "p-3 rounded-lg border-2 cursor-pointer transition-all",
                        authMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {method.id === 'password' && <Key className="h-4 w-4" />}
                        {method.id === 'oauth' && <Globe className="h-4 w-4" />}
                        {method.id === 'certificate' && <Shield className="h-4 w-4" />}
                        {method.id === 'kerberos' && <Lock className="h-4 w-4" />}
                        {method.id === 'key' && <Unlock className="h-4 w-4" />}
                        {method.id === 'ldap' && <Server className="h-4 w-4" />}
                        <span className="text-sm font-medium">{method.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {authMethod === 'password' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {authMethod === 'key' && (
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Textarea 
                    id="api-key"
                    placeholder="Paste your API key here"
                    rows={3}
                  />
                </div>
              )}

              {authMethod === 'certificate' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Client Certificate</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PEM, CRT, or P12 files
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div>
                    <Label htmlFor="use-ssl">Use SSL/TLS</Label>
                    <p className="text-xs text-muted-foreground">
                      Encrypt connection to database
                    </p>
                  </div>
                </div>
                <Switch 
                  id="use-ssl"
                  checked={useSSL}
                  onCheckedChange={setUseSSL}
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Connection Pooling</CardTitle>
                  <CardDescription>
                    Manage multiple concurrent database connections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pooling">Enable Connection Pooling</Label>
                    <Switch 
                      id="pooling"
                      checked={connectionPooling}
                      onCheckedChange={setConnectionPooling}
                    />
                  </div>
                  
                  {connectionPooling && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="max-connections">Max Connections</Label>
                          <Input 
                            id="max-connections"
                            type="number"
                            value={maxConnections}
                            onChange={(e) => setMaxConnections(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="min-connections">Min Connections</Label>
                          <Input 
                            id="min-connections"
                            type="number"
                            defaultValue="2"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
                        <Input 
                          id="timeout"
                          type="number"
                          value={connectionTimeout}
                          onChange={(e) => setConnectionTimeout(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Query Settings</CardTitle>
                  <CardDescription>
                    Configure query execution parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="query-timeout">Query Timeout (seconds)</Label>
                    <Input 
                      id="query-timeout"
                      type="number"
                      defaultValue="300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fetch-size">Fetch Size</Label>
                    <Input 
                      id="fetch-size"
                      type="number"
                      defaultValue="1000"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-commit">Auto Commit</Label>
                    <Switch id="auto-commit" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discovery" className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Schema Discovery</CardTitle>
                  <CardDescription>
                    Automatically discover tables and relationships
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Discover Schema
                  </Button>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Tables Found</span>
                      </div>
                      <Badge>24</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Relationships</span>
                      </div>
                      <Badge>18</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Total Columns</span>
                      </div>
                      <Badge>342</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Include Schemas</Label>
                    <Textarea 
                      placeholder="public, analytics, reporting (comma separated)"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Profiling</CardTitle>
                  <CardDescription>
                    Sample data and generate statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    <Activity className="mr-2 h-4 w-4" />
                    Run Data Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Connection Test</CardTitle>
                  <CardDescription>
                    Verify connectivity and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full"
                    onClick={testConnection}
                    disabled={testStatus === 'testing'}
                  >
                    {testStatus === 'testing' ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>

                  {testStatus === 'success' && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-900 dark:text-green-100">
                        Connection Successful
                      </AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        Successfully connected to {dbType} database. 
                        Response time: 142ms
                      </AlertDescription>
                    </Alert>
                  )}

                  {testStatus === 'failed' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Connection Failed</AlertTitle>
                      <AlertDescription>
                        Unable to connect to database. Please check your connection parameters.
                        Error: Connection refused (ECONNREFUSED)
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Test Results</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Network Connectivity</span>
                        {testStatus === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : testStatus === 'failed' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Authentication</span>
                        {testStatus === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : testStatus === 'failed' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Permissions</span>
                        {testStatus === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : testStatus === 'failed' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Save Configuration</CardTitle>
                  <CardDescription>
                    Store connection details securely
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="save-password">Save Password</Label>
                    <Switch id="save-password" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="encrypt">Encrypt Credentials</Label>
                    <Switch id="encrypt" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-6">
          <div className="flex items-center gap-2 mr-auto">
            <Switch 
              id="ai-assist"
              checked={aiAssistEnabled}
              onCheckedChange={setAiAssistEnabled}
            />
            <Label htmlFor="ai-assist" className="text-sm font-normal">
              AI Configuration Assistant
            </Label>
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onClose}
            disabled={!connectionName || !host || !database || testStatus !== 'success'}
          >
            Save Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}