'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { mockDataStore } from '@/lib/services/mock/MockDataStore';
import { mockAirflowService } from '@/lib/services/mock/MockAirflowService';
import { mockDatadogService } from '@/lib/services/mock/MockDatadogService';

interface OverviewDashboardPaperProps {
  paperId: string;
  state: any;
  workflowState: any;
  adjacentPapers: any;
  onSpawnPaper: (config: any) => void;
  onUpdateState: (updates: any) => void;
  onUpdateWorkflowState?: (state: any) => void;
  onNavigate: (paperId: string) => void;
}

export function OverviewDashboardPaper({ 
  state, 
  workflowState,
  onSpawnPaper, 
  onUpdateState,
  onUpdateWorkflowState 
}: OverviewDashboardPaperProps) {
  const [systemStatus, setSystemStatus] = useState<any>({});
  const [activeEnvironment, setActiveEnvironment] = useState<'dev' | 'staging' | 'prod'>('prod');
  const [criticalIssues, setCriticalIssues] = useState<any[]>([]);
  const [activeWork, setActiveWork] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load system status and issues
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Get system health
        const monitors = await mockDatadogService.getMonitors({ status: 'Alert' });
        const upcomingRuns = await mockAirflowService.getUpcomingRuns();
        const pipelines = mockDataStore.getAllPipelines();
        
        setSystemStatus({
          connections: {
            healthy: 4,
            degraded: 1,
            down: 1
          },
          operations: {
            running: pipelines.filter(p => p.status === 'running').length,
            failed: pipelines.filter(p => p.status === 'failed').length,
            success: pipelines.filter(p => p.status === 'success').length
          },
          alerts: monitors.length
        });
        
        // Set critical issues
        setCriticalIssues([
          {
            id: 'issue-001',
            type: 'pipeline_failure',
            title: 'Customer ETL Pipeline Failed',
            severity: 'critical',
            description: 'Schema validation error - field size mismatch',
            pipeline: 'customer_etl_pipeline_v3',
            affectedSystems: 12,
            timestamp: new Date('2024-01-26T14:23:00Z')
          },
          {
            id: 'issue-002',
            type: 'performance',
            title: 'Query Performance Degradation',
            severity: 'high',
            description: 'Product dimension query taking 45s (baseline: 5s)',
            query: 'product_dimension_agg',
            degradation: '900%',
            timestamp: new Date('2024-01-26T10:15:00Z')
          },
          {
            id: 'issue-003',
            type: 'schema_drift',
            title: 'Schema Drift Detected',
            severity: 'medium',
            description: 'Source system schema changed without notification',
            table: 'customer.email_field',
            change: 'VARCHAR(50) → VARCHAR(100)',
            timestamp: new Date('2024-01-26T08:00:00Z')
          }
        ]);
        
        // Set active work
        setActiveWork([
          {
            id: 'work-001',
            type: 'data_product',
            title: 'Customer 360 View',
            status: 'in_progress',
            progress: 73,
            owner: 'Sales Team',
            eta: '3 weeks'
          },
          {
            id: 'work-002',
            type: 'deployment',
            title: 'Risk Model v2.1',
            status: 'pending_deployment',
            environment: 'staging',
            validationStatus: 'passed',
            scheduledFor: new Date('2024-01-27T02:00:00Z')
          },
          {
            id: 'work-003',
            type: 'completed',
            title: 'Financial Reports Suite',
            status: 'completed',
            completedAt: new Date('2024-01-25T18:00:00Z'),
            performance: '99.9% uptime'
          }
        ]);
        
        // Set AI-identified opportunities
        setOpportunities([
          {
            id: 'opp-001',
            type: 'optimization',
            title: 'Index Optimization Opportunity',
            description: 'Adding index on category_id could improve query performance by 67%',
            impact: '$12,000/month cost reduction',
            confidence: 88
          },
          {
            id: 'opp-002',
            type: 'new_product',
            title: 'Suggested Data Product: Inventory Forecast',
            description: 'Based on recent queries, teams would benefit from inventory forecasting',
            potentialUsers: 45,
            confidence: 92
          },
          {
            id: 'opp-003',
            type: 'cost_reduction',
            title: 'Cluster Right-Sizing',
            description: 'Current cluster overprovisioned by 40% during off-peak hours',
            savings: '$8,500/month',
            confidence: 95
          }
        ]);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [activeEnvironment]);
  
  const spawnConfigurationPaper = (type: string, context: any) => {
    const paperConfigs = {
      'source': {
        type: 'configuration',
        title: 'Source Configuration',
        componentKey: 'source-configuration',
        initialState: { ...context, environment: activeEnvironment }
      },
      'processing': {
        type: 'configuration',
        title: 'Processing Configuration',
        componentKey: 'processing-configuration',
        initialState: { ...context, environment: activeEnvironment }
      },
      'quality': {
        type: 'configuration',
        title: 'Quality Configuration',
        componentKey: 'quality-configuration',
        initialState: { ...context, environment: activeEnvironment }
      },
      'operations': {
        type: 'configuration',
        title: 'Operations Configuration',
        componentKey: 'operations-configuration',
        initialState: { ...context, environment: activeEnvironment }
      }
    };
    
    const config = paperConfigs[type as keyof typeof paperConfigs];
    if (config) {
      onSpawnPaper({
        ...config,
        parentId: state.paperId,
        workflowId: `config-${type}-${Date.now()}`
      });
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* System Status Overview - Top 30% */}
      <div className="h-[30%] px-6 py-4 bg-gray-900/50 border-b border-gray-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-medium text-white mb-1">
              Configuration Domain Overview
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Enterprise Data Platform</span>
              <div className="flex gap-2">
                {['dev', 'staging', 'prod'].map((env) => (
                  <button
                    key={env}
                    onClick={() => setActiveEnvironment(env as any)}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs uppercase transition-colors",
                      activeEnvironment === env
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-gray-800 text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* System Health Indicators */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{systemStatus.connections?.healthy || 0}</div>
              <div className="text-xs text-green-400">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{systemStatus.connections?.degraded || 0}</div>
              <div className="text-xs text-gray-400">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{systemStatus.connections?.down || 0}</div>
              <div className="text-xs text-gray-400">Down</div>
            </div>
          </div>
        </div>
        
        {/* Active Operations Monitor */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">SQLMesh Models</div>
            <div className="text-lg font-medium text-white">{systemStatus.operations?.running || 0} Running</div>
            <div className="text-xs text-gray-400 mt-1">
              {systemStatus.operations?.failed || 0} failed, {systemStatus.operations?.success || 0} success
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Airflow DAGs</div>
            <div className="text-lg font-medium text-white">12 Active</div>
            <div className="text-xs text-gray-400 mt-1">5 scheduled today</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Active Alerts</div>
            <div className="text-lg font-medium text-yellow-400">{systemStatus.alerts || 0}</div>
            <div className="text-xs text-gray-400 mt-1">2 critical, 3 warning</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">System Load</div>
            <div className="text-lg font-medium text-white">67%</div>
            <div className="text-xs text-gray-400 mt-1">CPU: 67%, Memory: 82%</div>
          </div>
        </div>
      </div>
      
      {/* Priority Actions Grid - Middle 50% */}
      <div className="flex-1 grid grid-cols-3 gap-6 p-6 overflow-y-auto">
        {/* Critical Issues Column */}
        <div>
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-red-500">⚡</span> Critical Issues
          </h2>
          <div className="space-y-3">
            {criticalIssues.map((issue) => (
              <motion.div
                key={issue.id}
                className="bg-gray-900 rounded-lg p-4 border border-red-500/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{issue.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{issue.description}</div>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs",
                    issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    issue.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  )}>
                    {issue.severity}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">
                    {new Date(issue.timestamp).toLocaleTimeString()}
                  </div>
                  <button
                    onClick={() => {
                      if (issue.type === 'pipeline_failure') {
                        onSpawnPaper({
                          type: 'investigation',
                          title: 'Error Analysis',
                          componentKey: 'error-analysis',
                          parentId: state.paperId,
                          initialState: { issueId: issue.id, pipeline: issue.pipeline },
                          workflowId: `investigate-${issue.id}`
                        });
                      } else if (issue.type === 'performance') {
                        spawnConfigurationPaper('processing', { issue });
                      } else if (issue.type === 'schema_drift') {
                        onSpawnPaper({
                          type: 'investigation',
                          title: 'Schema Investigation',
                          componentKey: 'schema-investigation',
                          parentId: state.paperId,
                          initialState: { issue },
                          workflowId: `schema-${issue.id}`
                        });
                      }
                    }}
                    className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs transition-colors"
                  >
                    Investigate →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Active Work Column */}
        <div>
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-blue-500">📊</span> Active Work
          </h2>
          <div className="space-y-3">
            {activeWork.map((work) => (
              <motion.div
                key={work.id}
                className="bg-gray-900 rounded-lg p-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{work.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {work.type === 'data_product' && `${work.progress}% complete • ETA: ${work.eta}`}
                      {work.type === 'deployment' && `Ready for ${work.environment} deployment`}
                      {work.type === 'completed' && `Completed ${new Date(work.completedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                
                {work.status === 'in_progress' && (
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${work.progress}%` }}
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  {work.status === 'in_progress' && (
                    <button
                      onClick={() => spawnConfigurationPaper('processing', { dataProduct: work })}
                      className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-xs"
                    >
                      Continue →
                    </button>
                  )}
                  {work.status === 'pending_deployment' && (
                    <button
                      onClick={() => spawnConfigurationPaper('operations', { deployment: work })}
                      className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded text-xs"
                    >
                      Monitor →
                    </button>
                  )}
                  {work.status === 'completed' && (
                    <>
                      <button
                        onClick={() => spawnConfigurationPaper('processing', { extend: work })}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs"
                      >
                        Extend →
                      </button>
                      <button
                        onClick={() => spawnConfigurationPaper('processing', { clone: work })}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs"
                      >
                        Clone →
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Opportunities Column */}
        <div>
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-green-500">💡</span> AI-Identified Opportunities
          </h2>
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <motion.div
                key={opp.id}
                className="bg-gray-900 rounded-lg p-4 border border-green-500/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{opp.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{opp.description}</div>
                    <div className="text-xs text-green-400 mt-2 font-medium">
                      Impact: {opp.impact || opp.savings || `${opp.potentialUsers} users`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {opp.confidence}%
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (opp.type === 'optimization') {
                      spawnConfigurationPaper('processing', { optimization: opp });
                    } else if (opp.type === 'new_product') {
                      spawnConfigurationPaper('source', { newProduct: opp });
                    } else if (opp.type === 'cost_reduction') {
                      spawnConfigurationPaper('operations', { costOptimization: opp });
                    }
                  }}
                  className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded text-xs w-full mt-2"
                >
                  Implement →
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Access Panel - Bottom 20% */}
      <div className="h-[20%] px-6 py-4 bg-gray-900/50 border-t border-gray-800">
        <div className="grid grid-cols-4 gap-4">
          {/* Configuration Domain Shortcuts */}
          <motion.button
            onClick={() => spawnConfigurationPaper('source', {})}
            className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-blue-400 text-xl mb-2">🔌</div>
            <div className="text-sm font-medium text-white">Source Configuration</div>
            <div className="text-xs text-gray-400 mt-1">Configure data connections</div>
          </motion.button>
          
          <motion.button
            onClick={() => spawnConfigurationPaper('processing', {})}
            className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-purple-400 text-xl mb-2">⚙️</div>
            <div className="text-sm font-medium text-white">Processing Configuration</div>
            <div className="text-xs text-gray-400 mt-1">Build SQLMesh models</div>
          </motion.button>
          
          <motion.button
            onClick={() => spawnConfigurationPaper('quality', {})}
            className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-yellow-400 text-xl mb-2">✅</div>
            <div className="text-sm font-medium text-white">Quality Configuration</div>
            <div className="text-xs text-gray-400 mt-1">Define quality rules</div>
          </motion.button>
          
          <motion.button
            onClick={() => spawnConfigurationPaper('operations', {})}
            className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-green-400 text-xl mb-2">🚀</div>
            <div className="text-sm font-medium text-white">Operations Configuration</div>
            <div className="text-xs text-gray-400 mt-1">Manage deployments</div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}