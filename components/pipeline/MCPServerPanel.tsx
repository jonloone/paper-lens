import React, { useState, useEffect } from 'react';
import { Server, CheckCircle, AlertCircle, Loader2, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createMockMCPClient } from '@/lib/mcp/mockMCPClient';
import { cn } from '@/lib/utils';

interface MCPServerInfo {
  name: string;
  url: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  capabilities?: any;
  nodeTypes?: any[];
  error?: string;
  latency?: number;
  version?: string;
}

interface MCPServerPanelProps {
  className?: string;
  onServerStatusChange?: (servers: MCPServerInfo[]) => void;
}

export const MCPServerPanel: React.FC<MCPServerPanelProps> = ({ 
  className, 
  onServerStatusChange 
}) => {
  const [servers, setServers] = useState<MCPServerInfo[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  // Mock server list - in production this would come from configuration
  const availableServers = [
    { name: 'nifi', url: 'mcp://nifi:3000' },
    { name: 'spark', url: 'mcp://spark:3000' },
    { name: 'kafka', url: 'mcp://kafka:3000' },
    { name: 'flink', url: 'mcp://flink:3000' },
    { name: 'dbt', url: 'mcp://dbt:3000' },
    { name: 'snowflake', url: 'mcp://snowflake:3000' },
    { name: 'postgres', url: 'mcp://postgres:3000' },
    { name: 's3', url: 'mcp://s3:3000' },
    { name: 'airflow', url: 'mcp://airflow:3000' },
    { name: 'mlflow', url: 'mcp://mlflow:3000' },
    { name: 'trino', url: 'mcp://trino:3000' }
  ];
  
  const discoverServers = async () => {
    setIsRefreshing(true);
    const newServers: MCPServerInfo[] = [];
    
    // Initialize servers with connecting status
    const initialServers = availableServers.map(server => ({
      ...server,
      status: 'connecting' as const
    }));
    setServers(initialServers);
    
    // Test each server
    for (const serverConfig of availableServers) {
      try {
        const startTime = Date.now();
        const client = createMockMCPClient(serverConfig.url);
        
        await client.connect();
        const capabilities = await client.request('getCapabilities');
        const latency = Date.now() - startTime;
        
        newServers.push({
          name: serverConfig.name,
          url: serverConfig.url,
          status: 'connected',
          capabilities,
          nodeTypes: capabilities.nodeTypes,
          latency,
          version: capabilities.version
        });
        
        await client.disconnect();
      } catch (error: any) {
        newServers.push({
          name: serverConfig.name,
          url: serverConfig.url,
          status: 'error',
          error: error.message
        });
      }
    }
    
    setServers(newServers);
    setIsRefreshing(false);
    
    // Notify parent component
    if (onServerStatusChange) {
      onServerStatusChange(newServers);
    }
  };
  
  // Auto-discover on mount
  useEffect(() => {
    discoverServers();
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'connecting': return 'text-blue-600 bg-blue-50';
      case 'disconnected': return 'text-gray-600 bg-gray-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'disconnected': return <Server className="w-4 h-4 text-gray-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Server className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const connectedServers = servers.filter(s => s.status === 'connected');
  const totalNodeTypes = connectedServers.reduce((sum, s) => sum + (s.nodeTypes?.length || 0), 0);
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Server className="w-5 h-5" />
            MCP Servers
          </h3>
          <p className="text-sm text-muted-foreground">
            {connectedServers.length} connected • {totalNodeTypes} components available
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={discoverServers}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isRefreshing ? 'Discovering...' : 'Refresh'}
        </Button>
      </div>
      
      {/* Summary Stats */}
      {!isRefreshing && servers.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {servers.filter(s => s.status === 'connected').length}
              </div>
              <div className="text-xs text-muted-foreground">Connected</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalNodeTypes}
              </div>
              <div className="text-xs text-muted-foreground">Components</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {servers.filter(s => s.status === 'error').length}
              </div>
              <div className="text-xs text-muted-foreground">Errors</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {connectedServers.length > 0 ? 
                  Math.round(connectedServers.reduce((sum, s) => sum + (s.latency || 0), 0) / connectedServers.length) : 0
                }ms
              </div>
              <div className="text-xs text-muted-foreground">Avg Latency</div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Server List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {servers.map(server => (
          <Card key={server.name} className="transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(server.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{server.name}</span>
                      <Badge className={cn("text-xs", getStatusColor(server.status))}>
                        {server.status}
                      </Badge>
                      {server.version && (
                        <Badge variant="outline" className="text-xs">
                          v{server.version}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {server.url}
                      {server.latency && (
                        <span className="ml-2">• {server.latency}ms</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {server.nodeTypes && (
                    <Badge variant="secondary" className="text-xs">
                      {server.nodeTypes.length} types
                    </Badge>
                  )}
                  {server.status === 'connected' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(showDetails === server.name ? null : server.name)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Error Display */}
              {server.status === 'error' && server.error && (
                <Alert className="mt-3 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {server.error}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Server Details */}
              {showDetails === server.name && server.capabilities && (
                <div className="mt-4 pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">Available Node Types:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {server.nodeTypes?.map(nodeType => (
                      <div key={nodeType.type} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                        <span className="text-lg">{nodeType.icon}</span>
                        <div>
                          <div className="font-medium">{nodeType.label}</div>
                          <div className="text-xs text-muted-foreground">{nodeType.type}</div>
                        </div>
                      </div>
                    )) || []}
                  </div>
                  
                  {server.capabilities.capabilities && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Capabilities:</h4>
                      <div className="flex flex-wrap gap-1">
                        {server.capabilities.capabilities.map((cap: string) => (
                          <Badge key={cap} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Empty State */}
      {!isRefreshing && servers.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No MCP servers found</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={discoverServers}>
              Discover Servers
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};