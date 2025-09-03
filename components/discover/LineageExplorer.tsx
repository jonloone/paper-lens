'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GitBranch,
  Search,
  Database,
  Table,
  FileJson,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Filter,
  Eye,
  AlertCircle,
  Info,
} from 'lucide-react';

interface LineageNode {
  id: string;
  name: string;
  type: 'table' | 'view' | 'dashboard' | 'pipeline' | 'product';
  platform: string;
  level: number;
}

interface LineageEdge {
  source: string;
  target: string;
  type: 'transforms' | 'consumes' | 'produces';
}

// Mock lineage data
const mockLineageData = {
  nodes: [
    // Source tables
    { id: '1', name: 'raw.customer_events', type: 'table', platform: 'kafka', level: -2 },
    { id: '2', name: 'crm.customers', type: 'table', platform: 'salesforce', level: -2 },
    { id: '3', name: 'raw.transactions', type: 'table', platform: 's3', level: -2 },
    
    // Intermediate tables
    { id: '4', name: 'staging.customer_clean', type: 'table', platform: 'snowflake', level: -1 },
    { id: '5', name: 'staging.transactions_clean', type: 'table', platform: 'snowflake', level: -1 },
    
    // Central node
    { id: '6', name: 'customer.master_table', type: 'table', platform: 'snowflake', level: 0 },
    
    // Downstream products
    { id: '7', name: 'analytics.customer_360', type: 'product', platform: 'snowflake', level: 1 },
    { id: '8', name: 'ml.churn_features', type: 'table', platform: 'databricks', level: 1 },
    
    // Dashboards
    { id: '9', name: 'Customer Dashboard', type: 'dashboard', platform: 'tableau', level: 2 },
    { id: '10', name: 'Executive KPIs', type: 'dashboard', platform: 'looker', level: 2 },
  ] as LineageNode[],
  
  edges: [
    // Upstream
    { source: '1', target: '4', type: 'transforms' },
    { source: '2', target: '4', type: 'transforms' },
    { source: '3', target: '5', type: 'transforms' },
    { source: '4', target: '6', type: 'transforms' },
    { source: '5', target: '6', type: 'transforms' },
    
    // Downstream
    { source: '6', target: '7', type: 'produces' },
    { source: '6', target: '8', type: 'produces' },
    { source: '7', target: '9', type: 'consumes' },
    { source: '7', target: '10', type: 'consumes' },
    { source: '8', target: '9', type: 'consumes' },
  ] as LineageEdge[],
};

export function LineageExplorer() {
  const [selectedNode, setSelectedNode] = useState<string>('6'); // Default to master_table
  const [depth, setDepth] = useState<string>('2');
  const [direction, setDirection] = useState<'upstream' | 'downstream' | 'both'>('both');
  const [searchQuery, setSearchQuery] = useState('');

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'table': return <Table className="h-4 w-4" />;
      case 'view': return <Eye className="h-4 w-4" />;
      case 'dashboard': return <BarChart3 className="h-4 w-4" />;
      case 'pipeline': return <GitBranch className="h-4 w-4" />;
      case 'product': return <FileJson className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'table': return 'bg-blue-100 border-blue-300';
      case 'view': return 'bg-green-100 border-green-300';
      case 'dashboard': return 'bg-purple-100 border-purple-300';
      case 'pipeline': return 'bg-orange-100 border-orange-300';
      case 'product': return 'bg-indigo-100 border-indigo-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'snowflake': return 'text-blue-600';
      case 'databricks': return 'text-orange-600';
      case 'kafka': return 'text-black';
      case 'tableau': return 'text-purple-600';
      case 'looker': return 'text-green-600';
      case 's3': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Group nodes by level for visualization
  const nodesByLevel = mockLineageData.nodes.reduce((acc, node) => {
    if (!acc[node.level]) acc[node.level] = [];
    acc[node.level].push(node);
    return acc;
  }, {} as Record<number, LineageNode[]>);

  const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Data Lineage Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for table or data product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={direction} onValueChange={(v: any) => setDirection(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upstream">
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Upstream
                  </div>
                </SelectItem>
                <SelectItem value="downstream">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Downstream
                  </div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Both
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={depth} onValueChange={setDepth}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Level</SelectItem>
                <SelectItem value="2">2 Levels</SelectItem>
                <SelectItem value="3">3 Levels</SelectItem>
                <SelectItem value="5">5 Levels</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Maximize2 className="h-4 w-4 mr-2" />
              Full Screen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lineage Visualization */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Level Headers */}
              <div className="flex justify-between mb-4 px-4">
                {levels.map(level => (
                  <div key={level} className="text-sm font-medium text-muted-foreground text-center flex-1">
                    {level < 0 ? `Upstream L${Math.abs(level)}` : 
                     level > 0 ? `Downstream L${level}` : 
                     'Selected Asset'}
                  </div>
                ))}
              </div>
              
              {/* Nodes Grid */}
              <div className="relative">
                <div className="flex justify-between">
                  {levels.map(level => (
                    <div key={level} className="flex-1 px-2">
                      <div className="space-y-2">
                        {nodesByLevel[level]?.map(node => (
                          <button
                            key={node.id}
                            onClick={() => setSelectedNode(node.id)}
                            className={`w-full p-3 rounded-lg border-2 transition-all ${
                              selectedNode === node.id 
                                ? 'ring-2 ring-blue-500 shadow-lg' 
                                : 'hover:shadow-md'
                            } ${getNodeColor(node.type)}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {getNodeIcon(node.type)}
                              <span className={`text-xs font-medium ${getPlatformColor(node.platform)}`}>
                                {node.platform}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-left">
                              {node.name}
                            </div>
                            {node.type === 'product' && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Data Product
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Connection Lines (simplified) */}
                <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
                  {mockLineageData.edges.map((edge, idx) => {
                    const sourceNode = mockLineageData.nodes.find(n => n.id === edge.source);
                    const targetNode = mockLineageData.nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;
                    
                    const sourceLevelIdx = levels.indexOf(sourceNode.level);
                    const targetLevelIdx = levels.indexOf(targetNode.level);
                    
                    // Simplified line drawing
                    const x1 = (sourceLevelIdx + 0.5) * (100 / levels.length) + '%';
                    const x2 = (targetLevelIdx + 0.5) * (100 / levels.length) + '%';
                    
                    return (
                      <line
                        key={idx}
                        x1={x1}
                        y1="50%"
                        x2={x2}
                        y2="50%"
                        stroke="#cbd5e1"
                        strokeWidth="2"
                        strokeDasharray={edge.type === 'transforms' ? '5,5' : ''}
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Node Types:</span>
                <div className="flex gap-3">
                  {['table', 'product', 'dashboard'].map(type => (
                    <div key={type} className="flex items-center gap-1">
                      {getNodeIcon(type)}
                      <span className="text-xs capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Click any node to explore its lineage</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Breaking Change Warning</p>
                <p className="text-xs text-muted-foreground">
                  Modifying customer.master_table would impact 2 data products and 2 dashboards downstream
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">5</p>
                <p className="text-xs text-muted-foreground">Upstream Dependencies</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">4</p>
                <p className="text-xs text-muted-foreground">Downstream Consumers</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-2xl font-bold text-purple-600">2</p>
                <p className="text-xs text-muted-foreground">Critical Dashboards</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}