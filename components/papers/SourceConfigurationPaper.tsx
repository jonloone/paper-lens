'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { mockDataHubService } from '@/lib/services/mock/MockDataHubService';
import { mockRangerService } from '@/lib/services/mock/MockRangerService';

interface SourceConfigurationPaperProps {
  paperId: string;
  state: any;
  workflowState: any;
  adjacentPapers: any;
  onSpawnPaper: (config: any) => void;
  onUpdateState: (updates: any) => void;
  onUpdateWorkflowState?: (state: any) => void;
  onNavigate: (paperId: string) => void;
}

interface ConnectionConfig {
  type: 'postgresql' | 'mysql' | 'snowflake' | 'bigquery' | 's3' | 'kafka';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  sslEnabled?: boolean;
  connectionPool?: {
    minSize: number;
    maxSize: number;
    timeout: number;
  };
  advancedSettings?: Record<string, any>;
}

export function SourceConfigurationPaper({ 
  state, 
  workflowState,
  onSpawnPaper, 
  onUpdateState,
  onUpdateWorkflowState 
}: SourceConfigurationPaperProps) {
  const [activeTab, setActiveTab] = useState<'connection' | 'discovery' | 'testing'>('connection');
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    type: 'postgresql',
    host: 'analytics.prod.company.com',
    port: 5432,
    database: 'customer_data',
    username: 'data_reader',
    password: '',
    sslEnabled: true,
    connectionPool: {
      minSize: 5,
      maxSize: 20,
      timeout: 30000
    }
  });
  
  const [discoveredSchema, setDiscoveredSchema] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'testing' | 'success' | 'failed'>('untested');
  const [testResults, setTestResults] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  
  // Connection templates
  const connectionTemplates = {
    'prod-analytics': {
      name: 'Production Analytics DB',
      type: 'postgresql',
      host: 'analytics.prod.company.com',
      port: 5432,
      database: 'analytics',
      sslEnabled: true
    },
    'dev-testing': {
      name: 'Development Testing',
      type: 'mysql',
      host: 'dev.db.company.local',
      port: 3306,
      database: 'test_db',
      sslEnabled: false
    },
    'cloud-warehouse': {
      name: 'Cloud Data Warehouse',
      type: 'snowflake',
      host: 'company.snowflakecomputing.com',
      database: 'ANALYTICS_WH',
      sslEnabled: true
    }
  };
  
  // Test connection
  const testConnection = async () => {
    setConnectionStatus('testing');
    
    // Simulate connection testing
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      
      if (success) {
        setConnectionStatus('success');
        setTestResults({
          latency: Math.floor(Math.random() * 50) + 10,
          version: 'PostgreSQL 14.5',
          permissions: ['SELECT', 'EXECUTE'],
          tablesFound: 47,
          estimatedSize: '234 GB'
        });
        
        // Discover schema
        discoverSchema();
      } else {
        setConnectionStatus('failed');
        setTestResults({
          error: 'Connection timeout: Unable to reach host',
          suggestion: 'Check firewall rules and VPN connection'
        });
      }
    }, 2000);
  };
  
  // Discover schema
  const discoverSchema = async () => {
    // Simulate schema discovery
    setTimeout(() => {
      setDiscoveredSchema([
        {
          schema: 'public',
          tables: [
            { name: 'customers', rowCount: 1234567, size: '2.3 GB' },
            { name: 'orders', rowCount: 5678901, size: '8.7 GB' },
            { name: 'products', rowCount: 45678, size: '234 MB' }
          ]
        },
        {
          schema: 'analytics',
          tables: [
            { name: 'customer_360', rowCount: 1234567, size: '4.5 GB' },
            { name: 'sales_metrics', rowCount: 890123, size: '1.2 GB' }
          ]
        }
      ]);
      
      // Generate AI suggestions
      setAiSuggestions([
        {
          type: 'optimization',
          title: 'Connection Pool Optimization',
          description: 'Based on usage patterns, increase max pool size to 30 for better performance',
          impact: '23% reduction in connection wait time'
        },
        {
          type: 'security',
          title: 'Enable SSL Certificate Validation',
          description: 'Production connections should use strict SSL validation',
          priority: 'high'
        },
        {
          type: 'performance',
          title: 'Add Read Replica',
          description: 'Consider connecting to read replica for analytics queries',
          impact: 'Reduce load on primary by 40%'
        }
      ]);
    }, 1000);
  };
  
  // Save configuration
  const saveConfiguration = () => {
    if (onUpdateWorkflowState) {
      onUpdateWorkflowState({
        ...workflowState,
        sourceConfiguration: connectionConfig,
        schema: discoveredSchema
      });
    }
    
    // Spawn next paper
    onSpawnPaper({
      type: 'configuration',
      title: 'Processing Configuration',
      componentKey: 'processing-configuration',
      parentId: state.paperId,
      initialState: { 
        sourceConfig: connectionConfig,
        availableSchemas: discoveredSchema
      },
      workflowId: workflowState?.workflowId
    });
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header Section - 10% */}
      <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-medium text-white mb-1">
              Source Configuration Domain
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Configure Data Source Connection</span>
              {connectionStatus === 'success' && (
                <span className="text-green-400 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  Connected
                </span>
              )}
              {connectionStatus === 'failed' && (
                <span className="text-red-400 flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  Failed
                </span>
              )}
            </div>
          </div>
          
          {/* Save/Revert Controls */}
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm">
              Revert
            </button>
            <button 
              onClick={saveConfiguration}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
            >
              Save & Continue
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-4 mt-4">
          {['connection', 'discovery', 'testing'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-3 py-1 text-sm font-medium capitalize transition-colors",
                activeTab === tab 
                  ? "text-white border-b-2 border-blue-500" 
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Configuration Area - 70% */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'connection' && (
          <>
            {/* Connection Type and Discovery Panel - Left 40% */}
            <div className="w-[40%] bg-gray-900/30 border-r border-gray-800 p-6 overflow-y-auto">
              <h2 className="text-sm font-medium text-white mb-4">Connection Type</h2>
              
              <div className="grid grid-cols-2 gap-2 mb-6">
                {['postgresql', 'mysql', 'snowflake', 'bigquery', 's3', 'kafka'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setConnectionConfig({ ...connectionConfig, type: type as any })}
                    className={cn(
                      "px-3 py-2 rounded text-sm transition-colors",
                      connectionConfig.type === type
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    )}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <h2 className="text-sm font-medium text-white mb-4">Recent Connections</h2>
              <div className="space-y-2">
                {Object.entries(connectionTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => setConnectionConfig({ ...connectionConfig, ...template } as any)}
                    className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                  >
                    <div className="text-sm text-white">{template.name}</div>
                    <div className="text-xs text-gray-400">{template.type} • {template.host}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Technical Parameter Configuration - Center 40% */}
            <div className="w-[40%] p-6 overflow-y-auto">
              <h2 className="text-sm font-medium text-white mb-4">Connection Parameters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Host</label>
                  <input
                    type="text"
                    value={connectionConfig.host || ''}
                    onChange={(e) => setConnectionConfig({ ...connectionConfig, host: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Port</label>
                    <input
                      type="number"
                      value={connectionConfig.port || ''}
                      onChange={(e) => setConnectionConfig({ ...connectionConfig, port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Database</label>
                    <input
                      type="text"
                      value={connectionConfig.database || ''}
                      onChange={(e) => setConnectionConfig({ ...connectionConfig, database: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={connectionConfig.username || ''}
                    onChange={(e) => setConnectionConfig({ ...connectionConfig, username: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={connectionConfig.password || ''}
                    onChange={(e) => setConnectionConfig({ ...connectionConfig, password: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={connectionConfig.sslEnabled}
                    onChange={(e) => setConnectionConfig({ ...connectionConfig, sslEnabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-300">Enable SSL/TLS</label>
                </div>
                
                {/* Connection Pooling */}
                <div className="border-t border-gray-800 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-white mb-3">Connection Pooling</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Min Size</label>
                      <input
                        type="number"
                        value={connectionConfig.connectionPool?.minSize || 5}
                        onChange={(e) => setConnectionConfig({
                          ...connectionConfig,
                          connectionPool: {
                            ...connectionConfig.connectionPool!,
                            minSize: parseInt(e.target.value)
                          }
                        })}
                        className="w-full px-2 py-1 bg-gray-900 text-white rounded border border-gray-800 focus:border-blue-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Max Size</label>
                      <input
                        type="number"
                        value={connectionConfig.connectionPool?.maxSize || 20}
                        onChange={(e) => setConnectionConfig({
                          ...connectionConfig,
                          connectionPool: {
                            ...connectionConfig.connectionPool!,
                            maxSize: parseInt(e.target.value)
                          }
                        })}
                        className="w-full px-2 py-1 bg-gray-900 text-white rounded border border-gray-800 focus:border-blue-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Timeout (ms)</label>
                      <input
                        type="number"
                        value={connectionConfig.connectionPool?.timeout || 30000}
                        onChange={(e) => setConnectionConfig({
                          ...connectionConfig,
                          connectionPool: {
                            ...connectionConfig.connectionPool!,
                            timeout: parseInt(e.target.value)
                          }
                        })}
                        className="w-full px-2 py-1 bg-gray-900 text-white rounded border border-gray-800 focus:border-blue-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={testConnection}
                  disabled={connectionStatus === 'testing'}
                  className={cn(
                    "w-full px-4 py-2 rounded font-medium transition-colors",
                    connectionStatus === 'testing' 
                      ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  )}
                >
                  {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
            
            {/* Data Discovery and Profiling - Right 20% */}
            <div className="w-[20%] bg-gray-900/30 border-l border-gray-800 p-6 overflow-y-auto">
              <h2 className="text-sm font-medium text-white mb-4">AI Suggestions</h2>
              
              {aiSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-gray-900 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-xs font-medium text-white">{suggestion.title}</div>
                        {suggestion.priority === 'high' && (
                          <span className="text-xs text-red-400">High</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">{suggestion.description}</div>
                      {suggestion.impact && (
                        <div className="text-xs text-green-400">{suggestion.impact}</div>
                      )}
                      <button className="text-xs text-blue-400 hover:text-blue-300 mt-2">
                        Apply →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Test connection to see optimization suggestions
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'discovery' && (
          <div className="flex-1 p-6">
            {discoveredSchema.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-sm font-medium text-white">Discovered Schema</h2>
                {discoveredSchema.map((schema, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg p-4">
                    <div className="text-sm font-medium text-white mb-3">{schema.schema}</div>
                    <div className="space-y-2">
                      {schema.tables.map((table: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                          <div>
                            <div className="text-sm text-white">{table.name}</div>
                            <div className="text-xs text-gray-400">{table.rowCount.toLocaleString()} rows</div>
                          </div>
                          <div className="text-xs text-gray-500">{table.size}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">No schema discovered yet</div>
                  <button onClick={testConnection} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-sm">
                    Test Connection First
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'testing' && (
          <div className="flex-1 p-6">
            {testResults && (
              <div className="space-y-6">
                {connectionStatus === 'success' ? (
                  <>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="text-sm font-medium text-green-400 mb-2">Connection Successful</div>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div>Latency: {testResults.latency}ms</div>
                        <div>Version: {testResults.version}</div>
                        <div>Permissions: {testResults.permissions.join(', ')}</div>
                        <div>Tables Found: {testResults.tablesFound}</div>
                        <div>Estimated Size: {testResults.estimatedSize}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="text-sm font-medium text-red-400 mb-2">Connection Failed</div>
                    <div className="text-sm text-gray-300 mb-2">{testResults.error}</div>
                    <div className="text-xs text-gray-400">{testResults.suggestion}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Tool Integration Strip - 10% */}
      <div className="h-[10%] px-6 py-3 bg-gray-900/50 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm">
              Query Tester
            </button>
            <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm">
              Schema Browser
            </button>
            <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm">
              Performance Monitor
            </button>
          </div>
          
          {connectionStatus === 'success' && (
            <div className="text-xs text-gray-400">
              Ready to configure processing →
            </div>
          )}
        </div>
      </div>
    </div>
  );
}