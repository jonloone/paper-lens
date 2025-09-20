'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  NodeProps,
  ConnectionMode,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  GitBranch, 
  Package, 
  Zap, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Search,
  Filter,
  Activity,
  HardDrive,
  Layers,
  Snowflake,
  Play,
  ExternalLink,
  RefreshCw,
  Clock,
  Server,
  Box
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applyDagreLayout, applySwimlaneLayout, getEdgeStyle } from '@/lib/utils/dagre-layout';
import { lineageIntegration, ToolSpecificNode, ToolSpecificEdge } from '@/lib/services/lineageIntegration';

interface LineageVisualizationProps {
  entityId?: string;
  height?: string;
  mode?: 'tool' | 'data' | 'comprehensive';
}

// Tool-specific node component
const ToolNode = ({ data }: NodeProps) => {
  const getIcon = () => {
    const icons: Record<string, JSX.Element> = {
      airflow: <GitBranch className="h-5 w-5" />,
      spark: <Zap className="h-5 w-5" />,
      trino: <Database className="h-5 w-5" />,
      datahub: <Layers className="h-5 w-5" />,
      kafka: <Activity className="h-5 w-5" />,
      s3: <HardDrive className="h-5 w-5" />,
      snowflake: <Snowflake className="h-5 w-5" />,
      dbt: <Package className="h-5 w-5" />,
      // Legacy node types
      source: <Database className="h-5 w-5" />,
      transformation: <GitBranch className="h-5 w-5" />,
      destination: <Package className="h-5 w-5" />,
      product: <Zap className="h-5 w-5" />,
      pipeline: <GitBranch className="h-5 w-5" />
    };
    return icons[data.toolType || data.nodeType] || <Database className="h-5 w-5" />;
  };

  const getStatusColor = () => {
    switch (data.metadata?.status || data.status) {
      case 'running':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'success':
      case 'active':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'failed':
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'pending':
        return 'border-gray-400 bg-gray-50 dark:bg-gray-950';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      default:
        return 'border-gray-300 bg-white dark:bg-gray-900';
    }
  };

  const getToolColor = () => {
    if (data.toolType) {
      const style = lineageIntegration.getToolStyle(data.toolType);
      return style.color;
    }
    // Legacy color scheme
    const colors: Record<string, string> = {
      source: '#3b82f6',
      transformation: '#10b981',
      destination: '#f59e0b',
      product: '#8b5cf6',
      pipeline: '#6366f1'
    };
    return colors[data.nodeType] || '#6b7280';
  };

  const renderMetadata = () => {
    const metadata = data.metadata || {};
    
    // Tool-specific metadata rendering
    if (data.toolType === 'airflow' && metadata.dagId) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3 w-3" />
            <span>{metadata.schedule}</span>
          </div>
          {metadata.avgDuration && (
            <div className="text-xs text-muted-foreground">
              Avg: {metadata.avgDuration}min
            </div>
          )}
        </div>
      );
    }
    
    if (data.toolType === 'spark' && metadata.stageInfo) {
      return (
        <div className="space-y-1">
          <div className="text-xs">
            Stages: {metadata.stageInfo.completed}/{metadata.stageInfo.completed + metadata.stageInfo.active + (metadata.stageInfo.failed || 0)}
          </div>
          <div className="text-xs text-muted-foreground">
            {metadata.executors} executors
          </div>
        </div>
      );
    }
    
    // Quality score display (both new and legacy)
    if (metadata.qualityScore !== undefined || data.quality !== undefined) {
      const score = metadata.qualityScore || data.quality;
      return (
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">Quality:</div>
          <Badge 
            variant={score > 90 ? 'success' : score > 70 ? 'warning' : 'destructive'}
            className="text-xs"
          >
            {score}%
          </Badge>
        </div>
      );
    }
    
    if (metadata.rowCount) {
      return (
        <div className="text-xs text-muted-foreground">
          {(metadata.rowCount / 1000000).toFixed(1)}M rows
        </div>
      );
    }
    
    return null;
  };

  const displayName = data.displayName || data.label || data.name;
  const category = data.category || data.nodeType || data.toolType;

  return (
    <div className={`px-4 py-3 rounded-lg border-2 min-w-[200px] transition-all hover:shadow-lg ${getStatusColor()}`}>
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-start gap-2">
        <div className="mt-1" style={{ color: getToolColor() }}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{displayName}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            {category && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {category}
              </Badge>
            )}
            {(data.metadata?.status || data.status) && (
              <Badge 
                variant={
                  (data.metadata?.status || data.status) === 'running' ? 'secondary' :
                  (data.metadata?.status || data.status) === 'success' || (data.metadata?.status || data.status) === 'active' ? 'success' :
                  (data.metadata?.status || data.status) === 'failed' || (data.metadata?.status || data.status) === 'error' ? 'destructive' : 'outline'
                }
                className="text-xs px-1 py-0"
              >
                {data.metadata?.status || data.status}
              </Badge>
            )}
          </div>
          
          <div className="mt-2">
            {renderMetadata()}
          </div>
          
          {(data.metadata?.owner || data.owner) && (
            <div className="text-xs text-muted-foreground mt-2">
              Owner: {data.metadata?.owner || data.owner}
            </div>
          )}
          
          {(data.metadata?.tags || data.tags) && (data.metadata?.tags || data.tags).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(data.metadata?.tags || data.tags).slice(0, 3).map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} />
      
      {/* Status indicator for running jobs */}
      {(data.metadata?.status === 'running' || data.status === 'running') && (
        <div className="absolute -top-1 -right-1">
          <div className="relative">
            <div className="animate-ping absolute h-3 w-3 rounded-full bg-blue-400 opacity-75" />
            <div className="relative h-3 w-3 rounded-full bg-blue-500" />
          </div>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  tool: ToolNode,
  custom: ToolNode // Support both node types
};

export function DataLineageVisualization({ 
  entityId = 'pipeline-customer-360', 
  height = '600px',
  mode = 'comprehensive'
}: LineageVisualizationProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTool, setFilterTool] = useState('all');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<any>(null);
  const [layoutMode, setLayoutMode] = useState<'dagre' | 'swimlane'>('swimlane');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [useEnhanced, setUseEnhanced] = useState(true); // Toggle between enhanced and legacy

  // Swim lanes configuration
  const swimLanes = {
    sources: { x: 100, label: 'Data Sources' },
    orchestration: { x: 350, label: 'Orchestration' },
    processing: { x: 600, label: 'Processing' },
    storage: { x: 850, label: 'Storage' },
    products: { x: 1100, label: 'Data Products' }
  };

  // Fetch lineage data
  const fetchLineage = useCallback(async () => {
    if (!entityId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Try enhanced mode first
      if (useEnhanced) {
        try {
          // Get enhanced lineage from integration service
          const lineageData = await lineageIntegration.getIntegratedLineage(entityId);
          
          // Convert to ReactFlow format
          const flowNodes: Node[] = lineageData.nodes.map((node: ToolSpecificNode) => ({
            id: node.id,
            type: 'tool',
            position: node.position || { x: 0, y: 0 },
            data: {
              ...node,
              label: node.displayName || node.name
            }
          }));
          
          const flowEdges: Edge[] = lineageData.edges.map((edge: ToolSpecificEdge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'smoothstep',
            animated: edge.animated || false,
            label: edge.metadata?.transformationType || edge.metadata?.frequency,
            labelStyle: { fontSize: 10 },
            style: edge.style || getEdgeStyle({ 
              id: edge.id, 
              source: edge.source, 
              target: edge.target,
              data: edge 
            }),
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edge.style?.stroke || '#6b7280'
            }
          }));
          
          // Apply layout algorithm
          let layoutedData;
          if (layoutMode === 'dagre') {
            layoutedData = applyDagreLayout(flowNodes, flowEdges, {
              direction: 'LR',
              nodeWidth: 220,
              nodeHeight: 100,
              ranksep: 180
            });
          } else {
            layoutedData = applySwimlaneLayout(flowNodes, flowEdges, swimLanes);
          }
          
          setNodes(layoutedData.nodes);
          setEdges(layoutedData.edges);
          return;
        } catch (error) {
          console.log('Enhanced mode failed, falling back to legacy:', error);
          setUseEnhanced(false);
        }
      }
      
      // Fall back to legacy API
      const response = await fetch(`/api/lineage?entityId=${entityId}&depth=4&direction=both`);
      const data = await response.json();

      if (data.lineage) {
        // Convert legacy lineage data to ReactFlow format
        const flowNodes: Node[] = data.lineage.nodes.map((node: any) => ({
          id: node.id,
          type: 'custom',
          position: node.position || { x: Math.random() * 800, y: Math.random() * 600 },
          data: {
            label: node.name,
            nodeType: node.type,
            category: node.category,
            quality: node.metadata?.quality,
            status: node.metadata?.status || 'active',
            owner: node.metadata?.owner,
            tags: node.metadata?.tags
          }
        }));

        const flowEdges: Edge[] = data.lineage.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: edge.type === 'real-time',
          label: edge.metadata?.transformationType || edge.metadata?.frequency,
          labelStyle: { fontSize: 10 },
          style: {
            stroke: edge.type === 'quality-check' ? '#f59e0b' : 
                   edge.type === 'derived' ? '#8b5cf6' : '#6b7280'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edge.type === 'quality-check' ? '#f59e0b' : 
                   edge.type === 'derived' ? '#8b5cf6' : '#6b7280'
          }
        }));

        // Apply layout
        if (layoutMode === 'dagre') {
          const layoutedData = applyDagreLayout(flowNodes, flowEdges);
          setNodes(layoutedData.nodes);
          setEdges(layoutedData.edges);
        } else {
          setNodes(flowNodes);
          setEdges(flowEdges);
        }
      }
    } catch (error) {
      console.error('Error fetching lineage:', error);
    } finally {
      setLoading(false);
    }
  }, [entityId, layoutMode, useEnhanced]);

  // Analyze impact when node is selected
  const analyzeImpact = async (nodeId: string, changeType: string) => {
    try {
      const response = await fetch('/api/lineage/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: nodeId, changeType })
      });
      const data = await response.json();
      setImpactAnalysis(data);
    } catch (error) {
      console.error('Error analyzing impact:', error);
    }
  };

  // Handle node click
  const onNodeClick = useCallback((event: any, node: any) => {
    setSelectedNode(node);
    analyzeImpact(node.id, 'maintenance');
  }, []);

  // Filter nodes and edges
  const filteredGraph = useMemo(() => {
    let filteredNodes = nodes;
    let filteredEdges = edges;
    
    if (searchTerm) {
      filteredNodes = nodes.map(node => ({
        ...node,
        hidden: !node.data.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !node.data.label?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !node.data.name?.toLowerCase().includes(searchTerm.toLowerCase())
      }));
    }
    
    // Filter by node type
    if (filterType !== 'all') {
      filteredNodes = filteredNodes.map(node => ({
        ...node,
        hidden: node.hidden || node.data.nodeType !== filterType
      }));
    }
    
    // Filter by tool type
    if (filterTool !== 'all') {
      filteredNodes = filteredNodes.map(node => ({
        ...node,
        hidden: node.hidden || node.data.toolType !== filterTool
      }));
    }
    
    // Hide edges connected to hidden nodes
    const hiddenNodeIds = new Set(filteredNodes.filter(n => n.hidden).map(n => n.id));
    filteredEdges = edges.map(edge => ({
      ...edge,
      hidden: hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target)
    }));
    
    return { nodes: filteredNodes, edges: filteredEdges };
  }, [nodes, edges, searchTerm, filterType, filterTool]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLineage, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchLineage]);

  useEffect(() => {
    fetchLineage();
  }, [fetchLineage]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading lineage data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
              
              {/* Show tool filter only in enhanced mode */}
              {useEnhanced ? (
                <Select value={filterTool} onValueChange={setFilterTool}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by tool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tools</SelectItem>
                    <SelectItem value="airflow">Airflow</SelectItem>
                    <SelectItem value="spark">Spark</SelectItem>
                    <SelectItem value="trino">Trino</SelectItem>
                    <SelectItem value="datahub">DataHub</SelectItem>
                    <SelectItem value="kafka">Kafka</SelectItem>
                    <SelectItem value="s3">S3</SelectItem>
                    <SelectItem value="snowflake">Snowflake</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="source">Sources</SelectItem>
                    <SelectItem value="transformation">Transformations</SelectItem>
                    <SelectItem value="destination">Destinations</SelectItem>
                    <SelectItem value="product">Products</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {useEnhanced && (
                <Select value={layoutMode} onValueChange={(value: any) => setLayoutMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="swimlane">Swimlane</SelectItem>
                    <SelectItem value="dagre">Hierarchical</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={autoRefresh ? 'secondary' : 'outline'}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchLineage}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterTool('all');
                  fetchLineage();
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Lineage View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Data Lineage Graph</CardTitle>
                {useEnhanced && layoutMode === 'swimlane' && (
                  <div className="flex gap-4 text-xs">
                    {Object.entries(swimLanes).map(([key, lane]) => (
                      <div key={key} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-muted" />
                        <span className="text-muted-foreground">{lane.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ height }}>
                <ReactFlow
                  nodes={filteredGraph.nodes}
                  edges={filteredGraph.edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  nodeTypes={nodeTypes}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  attributionPosition="top-right"
                >
                  <Background variant="dots" />
                  <Controls />
                  <MiniMap 
                    nodeColor={(node) => {
                      if (node.data?.toolType) {
                        const style = lineageIntegration.getToolStyle(node.data.toolType);
                        return style.color;
                      }
                      // Legacy color mapping
                      switch (node.data?.nodeType) {
                        case 'source': return '#3b82f6';
                        case 'transformation': return '#10b981';
                        case 'destination': return '#f59e0b';
                        case 'product': return '#8b5cf6';
                        default: return '#6b7280';
                      }
                    }}
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                  />
                  
                  {/* Swimlane labels */}
                  {useEnhanced && layoutMode === 'swimlane' && (
                    <Panel position="top-left">
                      <div className="bg-background/90 backdrop-blur p-2 rounded-lg border">
                        <div className="flex flex-col gap-2 text-xs">
                          {Object.entries(swimLanes).map(([key, lane]) => (
                            <div key={key} className="flex items-center gap-2">
                              <Box className="h-3 w-3" />
                              <span className="font-medium">{lane.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Panel>
                  )}
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Selected Node Details */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Node Details
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium">
                    {selectedNode.data.displayName || selectedNode.data.label || selectedNode.data.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedNode.data.toolType || selectedNode.data.nodeType || selectedNode.data.category}
                  </div>
                </div>
                
                {selectedNode.data.quality && (
                  <div>
                    <div className="text-xs text-muted-foreground">Quality Score</div>
                    <div className="flex items-center mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${selectedNode.data.quality}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm font-medium">{selectedNode.data.quality}%</span>
                    </div>
                  </div>
                )}
                
                {(selectedNode.data.metadata?.owner || selectedNode.data.owner) && (
                  <div>
                    <div className="text-xs text-muted-foreground">Owner</div>
                    <div className="text-sm">{selectedNode.data.metadata?.owner || selectedNode.data.owner}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Impact Analysis */}
          {impactAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Impact Level</span>
                  <Badge variant={
                    impactAnalysis.impactLevel === 'critical' ? 'destructive' :
                    impactAnalysis.impactLevel === 'high' ? 'warning' :
                    'secondary'
                  }>
                    {impactAnalysis.impactLevel}
                  </Badge>
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground">Affected Nodes</div>
                  <div className="text-sm font-medium">{impactAnalysis.affectedNodes.length}</div>
                </div>
                
                {impactAnalysis.estimatedDowntime && (
                  <div>
                    <div className="text-xs text-muted-foreground">Est. Downtime</div>
                    <div className="text-sm font-medium">{impactAnalysis.estimatedDowntime} min</div>
                  </div>
                )}
                
                {impactAnalysis.recommendations && impactAnalysis.recommendations.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Recommendations</div>
                    <div className="space-y-1">
                      {impactAnalysis.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start space-x-1">
                          <ArrowRight className="h-3 w-3 mt-0.5 text-muted-foreground" />
                          <span className="text-xs">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {useEnhanced ? (
                // Tool legend for enhanced mode
                ['airflow', 'spark', 'trino', 'datahub', 'kafka', 's3', 'snowflake'].map(tool => {
                  const style = lineageIntegration.getToolStyle(tool);
                  const icons: Record<string, JSX.Element> = {
                    airflow: <GitBranch className="h-4 w-4" />,
                    spark: <Zap className="h-4 w-4" />,
                    trino: <Database className="h-4 w-4" />,
                    datahub: <Layers className="h-4 w-4" />,
                    kafka: <Activity className="h-4 w-4" />,
                    s3: <HardDrive className="h-4 w-4" />,
                    snowflake: <Snowflake className="h-4 w-4" />
                  };
                  
                  return (
                    <div key={tool} className="flex items-center gap-2">
                      <div style={{ color: style.color }}>
                        {icons[tool]}
                      </div>
                      <span className="text-xs capitalize">{tool}</span>
                    </div>
                  );
                })
              ) : (
                // Legacy legend
                <>
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span className="text-xs">Data Source</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GitBranch className="h-4 w-4 text-green-500" />
                    <span className="text-xs">Transformation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs">Destination</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span className="text-xs">Data Product</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          {useEnhanced && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Graph Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Nodes:</span>
                  <span className="font-medium">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Edges:</span>
                  <span className="font-medium">{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Running Jobs:</span>
                  <span className="font-medium text-blue-600">
                    {nodes.filter(n => n.data.metadata?.status === 'running' || n.data.status === 'running').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed Jobs:</span>
                  <span className="font-medium text-red-600">
                    {nodes.filter(n => n.data.metadata?.status === 'failed' || n.data.status === 'failed').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Also export as default for backward compatibility
export default DataLineageVisualization;