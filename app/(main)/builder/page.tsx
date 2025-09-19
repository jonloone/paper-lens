'use client';

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database,
  Zap,
  GitBranch,
  Shield,
  Activity,
  Download,
  Upload,
  Play,
  Save,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileJson,
  Code,
  Eye,
  ChevronRight,
  Cloud,
  HardDrive,
  Waves,
  Calendar,
  Lock,
  Sparkles,
  Package,
  ArrowRight
} from 'lucide-react';

import ToolPalette from '@/components/builder/ToolPalette';
import ConfigPanel from '@/components/builder/ConfigPanel';
import DataSourceNode from '@/components/builder/nodes/DataSourceNode';
import TransformNode from '@/components/builder/nodes/TransformNode';
import QualityNode from '@/components/builder/nodes/QualityNode';
import SinkNode from '@/components/builder/nodes/SinkNode';
import ConsumerNode from '@/components/builder/nodes/ConsumerNode';

// Define our custom node types
const nodeTypes = {
  dataSource: DataSourceNode,
  transform: TransformNode,
  quality: QualityNode,
  sink: SinkNode,
  consumer: ConsumerNode,
};

// Initial nodes for demonstration
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'dataSource',
    position: { x: 100, y: 200 },
    data: { 
      label: 'Customer Events',
      sourceType: 'streaming',
      config: {
        system: 'kafka',
        topic: 'customer-events',
        format: 'json'
      }
    },
  },
  {
    id: '2',
    type: 'transform',
    position: { x: 350, y: 200 },
    data: { 
      label: 'Enrich & Aggregate',
      transformType: 'enrichment',
      config: {
        operations: ['deduplicate', 'join', 'aggregate'],
        window: '1 hour'
      }
    },
  },
  {
    id: '3',
    type: 'quality',
    position: { x: 600, y: 200 },
    data: { 
      label: 'Quality Checks',
      rules: ['completeness', 'uniqueness', 'timeliness'],
      config: {
        nullCheck: true,
        schemaValidation: true,
        thresholds: { completeness: 0.95 }
      }
    },
  },
  {
    id: '4',
    type: 'sink',
    position: { x: 850, y: 200 },
    data: { 
      label: 'Analytics Store',
      sinkType: 'lakehouse',
      config: {
        format: 'iceberg',
        path: 's3://data-lake/customer-analytics',
        partitioning: 'daily'
      }
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
];

export default function PipelineBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [viewMode, setViewMode] = useState<'design' | 'config' | 'deploy'>('design');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConfigs, setGeneratedConfigs] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('nodeType');
      const label = event.dataTransfer.getData('label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const newNode: Node = {
        id: `${Date.now()}`,
        type,
        position,
        data: { label, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const generateConfigurations = async () => {
    setIsGenerating(true);
    
    // Simulate MCP translation
    setTimeout(() => {
      const configs = {
        nifi: {
          processors: [
            { type: 'ConsumeKafka', id: 'consume-1', topic: 'customer-events' },
            { type: 'JoltTransformJSON', id: 'transform-1' },
            { type: 'ValidateRecord', id: 'validate-1' },
            { type: 'PutIceberg', id: 'sink-1', table: 'customer_analytics' }
          ],
          connections: [
            { source: 'consume-1', target: 'transform-1' },
            { source: 'transform-1', target: 'validate-1' },
            { source: 'validate-1', target: 'sink-1' }
          ]
        },
        airflow: {
          dag_id: 'customer_analytics_pipeline',
          schedule: '@hourly',
          tasks: [
            { id: 'check_source', operator: 'KafkaSensor' },
            { id: 'transform_data', operator: 'SparkSubmitOperator' },
            { id: 'quality_check', operator: 'GreatExpectationsOperator' },
            { id: 'write_iceberg', operator: 'IcebergOperator' }
          ]
        },
        greatExpectations: {
          suite_name: 'customer_analytics_suite',
          expectations: [
            { type: 'expect_column_values_to_not_be_null', column: 'customer_id' },
            { type: 'expect_column_values_to_be_unique', column: 'event_id' },
            { type: 'expect_table_row_count_to_be_between', min: 1000, max: 1000000 }
          ]
        },
        datahub: {
          dataset: 'customer_analytics',
          upstream: ['kafka.customer-events'],
          downstream: ['superset.customer-dashboard', 'api.customer-metrics'],
          schema: {
            fields: [
              { name: 'customer_id', type: 'string', nullable: false },
              { name: 'total_revenue', type: 'decimal', nullable: false },
              { name: 'event_count', type: 'integer', nullable: false }
            ]
          }
        }
      };
      
      setGeneratedConfigs(configs);
      setIsGenerating(false);
      setViewMode('config');
    }, 2000);
  };

  const deployPipeline = async () => {
    // In production, this would deploy via MCP
    console.log('Deploying pipeline with configs:', generatedConfigs);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-3 flex items-center justify-between bg-background">
        <div>
          <h1 className="text-xl">Visual Pipeline Builder</h1>
          <p className="text-sm text-muted-foreground">
            Design intent-based pipelines that deploy to your enterprise tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            size="sm"
            onClick={generateConfigurations}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Configs
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Tool Palette */}
        <div className="w-64 border-r bg-muted/30 p-4">
          <ToolPalette />
        </div>

        {/* Canvas/Config Area */}
        <div className="flex-1 relative">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="h-full">
            <div className="absolute top-2 left-2 z-10">
              <TabsList>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="config" disabled={!generatedConfigs}>
                  Configuration
                </TabsTrigger>
                <TabsTrigger value="deploy" disabled={!generatedConfigs}>
                  Deploy
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="design" className="h-full m-0">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
              >
                <Background />
                <Controls />
                <Panel position="bottom-center">
                  <Alert className="w-96">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Drag components from the palette to build your pipeline. 
                      Connect nodes to define data flow.
                    </AlertDescription>
                  </Alert>
                </Panel>
              </ReactFlow>
            </TabsContent>

            <TabsContent value="config" className="h-full m-0 p-6 overflow-auto">
              {generatedConfigs && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <h2 className="text-2xl font-semibold mb-4">Generated Configurations</h2>
                  
                  {/* NiFi Config */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Apache NiFi Flow
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(generatedConfigs.nifi, null, 2)}
                      </pre>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export Template
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview in NiFi
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Airflow Config */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Apache Airflow DAG
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(generatedConfigs.airflow, null, 2)}
                      </pre>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline">
                          <Code className="h-4 w-4 mr-2" />
                          View Python Code
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview DAG
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Great Expectations Config */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Great Expectations Suite
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(generatedConfigs.greatExpectations, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>

                  {/* DataHub Lineage */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        DataHub Lineage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(generatedConfigs.datahub, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="deploy" className="h-full m-0 p-6">
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Deployment Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="cursor-pointer hover:border-primary transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Cloud className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Deploy to Dev</h3>
                              <p className="text-sm text-muted-foreground">
                                Test in development environment
                              </p>
                            </div>
                          </div>
                          <Button className="w-full" onClick={deployPipeline}>
                            Deploy to Dev
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="cursor-pointer hover:border-primary transition-colors opacity-50">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Lock className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Deploy to Prod</h3>
                              <p className="text-sm text-muted-foreground">
                                Requires approval workflow
                              </p>
                            </div>
                          </div>
                          <Button className="w-full" disabled>
                            Request Approval
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Pre-deployment Validation:</strong>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                          <li>✓ Schema compatibility verified</li>
                          <li>✓ Resource allocation within limits</li>
                          <li>✓ Security policies applied</li>
                          <li>✓ Cost estimate: ~$45/day</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Config Panel */}
        {selectedNode && viewMode === 'design' && (
          <div className="w-80 border-l bg-background">
            <ConfigPanel node={selectedNode} onUpdate={(updates) => {
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === selectedNode.id
                    ? { ...node, data: { ...node.data, ...updates } }
                    : node
                )
              );
            }} />
          </div>
        )}
      </div>
    </div>
  );
}