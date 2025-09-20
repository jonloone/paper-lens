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
  TrendingUp,
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
    const icons = {
      airflow: <GitBranch className="h-5 w-5" />,
      spark: <Zap className="h-5 w-5" />,
      trino: <Database className="h-5 w-5" />,
      datahub: <Layers className="h-5 w-5" />,
      kafka: <Activity className="h-5 w-5" />,
      s3: <HardDrive className="h-5 w-5" />,
      snowflake: <Snowflake className="h-5 w-5" />,
      dbt: <Package className="h-5 w-5" />
    };
    return icons[data.toolType] || <Database className="h-5 w-5" />;
  };

  const getStatusColor = () => {
    switch (data.metadata?.status) {
      case 'running':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'success':
      case 'active':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'failed':
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
    const style = lineageIntegration.getToolStyle(data.toolType);
    return style.color;
  };

  const renderMetadata = () => {
    const { metadata } = data;
    
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
    
    if (data.toolType === 'datahub' && metadata.qualityScore !== undefined) {
      return (
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">Quality:</div>
          <Badge 
            variant={metadata.qualityScore > 90 ? 'success' : metadata.qualityScore > 70 ? 'warning' : 'destructive'}
            className="text-xs"
          >
            {metadata.qualityScore}%
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

  return (
    <div className={`px-4 py-3 rounded-lg border-2 min-w-[200px] transition-all hover:shadow-lg ${getStatusColor()}`}>
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-start gap-2">
        <div className="mt-1" style={{ color: getToolColor() }}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{data.displayName}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-1 py-0">
              {data.toolType}
            </Badge>
            {data.metadata?.status && (
              <Badge 
                variant={
                  data.metadata.status === 'running' ? 'secondary' :
                  data.metadata.status === 'success' || data.metadata.status === 'active' ? 'success' :
                  data.metadata.status === 'failed' ? 'destructive' : 'outline'
                }
                className="text-xs px-1 py-0"
              >
                {data.metadata.status}
              </Badge>
            )}
          </div>
          
          <div className="mt-2">
            {renderMetadata()}
          </div>
          
          {data.metadata?.owner && (
            <div className="text-xs text-muted-foreground mt-2">
              Owner: {data.metadata.owner}
            </div>
          )}
          
          {data.metadata?.tags && data.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.metadata.tags.slice(0, 3).map((tag: string, index: number) => (
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
      {data.metadata?.status === 'running' && (
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
  tool: ToolNode
};

export function EnhancedDataLineageVisualization({ 
  entityId = 'comprehensive-lineage', 
  height = '700px',
  mode = 'comprehensive'
}: LineageVisualizationProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTool, setFilterTool] = useState('all');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [layoutMode, setLayoutMode] = useState<'dagre' | 'swimlane'>('swimlane');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Swim lanes configuration
  const swimLanes = {
    sources: { x: 100, label: 'Data Sources' },
    orchestration: { x: 350, label: 'Orchestration' },
    processing: { x: 600, label: 'Processing' },
    storage: { x: 850, label: 'Storage' },
    products: { x: 1100, label: 'Data Products' }
  };

  // Fetch and process lineage data
  const fetchLineage = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get lineage from integration service
      const lineageData = await lineageIntegration.getIntegratedLineage(entityId);
      
      // Convert to ReactFlow format
      const flowNodes: Node[] = lineageData.nodes.map((node: ToolSpecificNode) => ({
        id: node.id,
        type: 'tool',
        position: node.position || { x: 0, y: 0 },
        data: {
          ...node,
          label: node.displayName
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
    } catch (error) {
      console.error('Error fetching lineage:', error);
    } finally {
      setLoading(false);
    }
  }, [entityId, layoutMode]);

  // Handle node click
  const onNodeClick = useCallback((event: any, node: any) => {
    setSelectedNode(node);
  }, []);

  // Filter nodes and edges
  const filteredGraph = useMemo(() => {
    let filteredNodes = nodes;
    let filteredEdges = edges;
    
    if (searchTerm) {
      filteredNodes = nodes.map(node => ({
        ...node,
        hidden: !node.data.displayName.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !node.data.name.toLowerCase().includes(searchTerm.toLowerCase())
      }));
    }
    
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
  }, [nodes, edges, searchTerm, filterTool]);

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
              
              <Select value={layoutMode} onValueChange={(value: any) => setLayoutMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="swimlane">Swimlane</SelectItem>
                  <SelectItem value="dagre">Hierarchical</SelectItem>
                </SelectContent>
              </Select>
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
                  setFilterTool('all');
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Lineage View */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Data Lineage Graph</CardTitle>
                <div className="flex gap-2">
                  {layoutMode === 'swimlane' && (
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
                      const style = lineageIntegration.getToolStyle(node.data?.toolType || 'unknown');
                      return style.color;
                    }}
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                  />
                  
                  {/* Swimlane labels */}
                  {layoutMode === 'swimlane' && (
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
          {selectedNode ? (
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
                  <div className="text-sm font-medium">{selectedNode.data.displayName}</div>
                  <Badge variant="outline" className="mt-1">
                    {selectedNode.data.toolType}
                  </Badge>
                </div>
                
                {selectedNode.data.metadata && (
                  <div className="space-y-2 text-sm">
                    {selectedNode.data.metadata.dagId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">DAG ID:</span>
                        <span className="font-mono text-xs">{selectedNode.data.metadata.dagId}</span>
                      </div>
                    )}
                    {selectedNode.data.metadata.applicationId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">App ID:</span>
                        <span className="font-mono text-xs">{selectedNode.data.metadata.applicationId}</span>
                      </div>
                    )}
                    {selectedNode.data.metadata.schedule && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Schedule:</span>
                        <span className="font-mono text-xs">{selectedNode.data.metadata.schedule}</span>
                      </div>
                    )}
                    {selectedNode.data.metadata.rowCount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rows:</span>
                        <span>{(selectedNode.data.metadata.rowCount / 1000000).toFixed(1)}M</span>
                      </div>
                    )}
                    {selectedNode.data.metadata.qualityScore !== undefined && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Quality:</span>
                          <span>{selectedNode.data.metadata.qualityScore}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500"
                            style={{ width: `${selectedNode.data.metadata.qualityScore}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {selectedNode.data.metadata.owner && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Owner:</span>
                        <span>{selectedNode.data.metadata.owner}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <Button className="w-full" size="sm">
                    Open in {selectedNode.data.toolType}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a node to view details
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tool Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['airflow', 'spark', 'trino', 'datahub', 'kafka', 's3', 'snowflake'].map(tool => {
                const style = lineageIntegration.getToolStyle(tool);
                const icons = {
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
                      {icons[tool as keyof typeof icons]}
                    </div>
                    <span className="text-xs capitalize">{tool}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Stats */}
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
                  {nodes.filter(n => n.data.metadata?.status === 'running').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed Jobs:</span>
                <span className="font-medium text-red-600">
                  {nodes.filter(n => n.data.metadata?.status === 'failed').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}