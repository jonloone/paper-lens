'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MCPOrchestrator } from '@/lib/services/MCPOrchestrator';
import { DataSourceSelector } from '@/components/data-engineering/DataSourceSelector';
import { QualityRuleManager } from '@/components/data-engineering/QualityRuleManager';
import { DataIngestionWorkflow } from '@/components/data-engineering/DataIngestionWorkflow';
import { SQLGenerationEngine } from '@/components/data-engineering/SQLGenerationEngine';
import {
  Database,
  Table,
  ChevronRight,
  ChevronDown,
  Search,
  Zap,
  Server,
  Cloud,
  Play,
  Code,
  Loader2,
  FileCode,
  GitBranch,
  Shield,
  Wrench,
  Plus
} from 'lucide-react';

interface Schema {
  name: string;
  tables: Array<{
    name: string;
    fullName: string;
    urn?: string;
  }>;
}

export default function EngineerPage() {
  const [selectedSource, setSelectedSource] = useState<'federated' | 'lakehouse'>('federated');
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orchestrator] = useState(() => new MCPOrchestrator());
  const [activeTab, setActiveTab] = useState('catalog');

  useEffect(() => {
    loadSchemas();
  }, [selectedSource]);

  const loadSchemas = async () => {
    setLoading(true);
    try {
      // Use MCP to get schemas from DataHub or Trino
      const schemasData = await orchestrator.callTool('datahub', 'getSchemas', {});
      setSchemas(Array.isArray(schemasData) ? schemasData : mockSchemas);
    } catch (error) {
      console.error('Failed to load schemas:', error);
      // Fallback to mock data
      setSchemas(mockSchemas);
    } finally {
      setLoading(false);
    }
  };

  const mockSchemas = [
    {
      name: 'analytics',
      tables: [
        { name: 'customers', fullName: 'analytics.customers' },
        { name: 'orders', fullName: 'analytics.orders' },
        { name: 'products', fullName: 'analytics.products' }
      ]
    },
    {
      name: 'raw',
      tables: [
        { name: 'events', fullName: 'raw.events' },
        { name: 'logs', fullName: 'raw.logs' }
      ]
    },
    {
      name: 'staging',
      tables: [
        { name: 'customer_staging', fullName: 'staging.customer_staging' },
        { name: 'order_staging', fullName: 'staging.order_staging' }
      ]
    }
  ];

  const toggleSchema = (schemaName: string) => {
    const newExpanded = new Set(expandedSchemas);
    if (newExpanded.has(schemaName)) {
      newExpanded.delete(schemaName);
    } else {
      newExpanded.add(schemaName);
    }
    setExpandedSchemas(newExpanded);
  };

  const handleTransform = async () => {
    if (!selectedTable) return;
    
    console.log('Opening transform builder for:', selectedTable);
    
    // Could integrate with dbt, Spark, or other transform tools via MCP
    await orchestrator.callTool('airflow', 'createTransform', {
      source: selectedTable,
      type: 'sql',
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Engineering</h1>
          <p className="text-muted-foreground mt-1">
            Build and manage your data infrastructure
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <GitBranch className="h-4 w-4 mr-2" />
            View Lineage
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Pipeline
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="catalog">
            <Database className="h-4 w-4 mr-2" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="ingestion">
            <Zap className="h-4 w-4 mr-2" />
            Ingestion
          </TabsTrigger>
          <TabsTrigger value="transform">
            <Wrench className="h-4 w-4 mr-2" />
            Transform
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Shield className="h-4 w-4 mr-2" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Code className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          {/* Data Source Selection */}
          <DataSourceSelector
            selectedSource={selectedSource}
            onSourceChange={setSelectedSource}
          />

          {/* Schema and Table Browser */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Schemas</span>
                  <Button variant="ghost" size="sm" onClick={loadSchemas}>
                    <Search className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schemas.map((schema) => (
                      <div key={schema.name} className="border rounded-lg">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleSchema(schema.name)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedSchemas.has(schema.name) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <Database className="h-4 w-4 text-primary" />
                            <span className="font-medium">{schema.name}</span>
                          </div>
                          <Badge variant="outline">{schema.tables.length}</Badge>
                        </div>
                        
                        {expandedSchemas.has(schema.name) && (
                          <div className="border-t">
                            {schema.tables.map((table) => (
                              <div
                                key={table.fullName}
                                className={`flex items-center gap-2 px-8 py-2 cursor-pointer hover:bg-muted/50 ${
                                  selectedTable === table.fullName ? 'bg-muted' : ''
                                }`}
                                onClick={() => setSelectedTable(table.fullName)}
                              >
                                <Table className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{table.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table Details and Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedTable ? `Table: ${selectedTable}` : 'Select a table'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTable ? (
                  <Tabs defaultValue="schema" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="schema">Schema</TabsTrigger>
                      <TabsTrigger value="sample">Sample Data</TabsTrigger>
                      <TabsTrigger value="actions">Actions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="schema" className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3">Columns</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>customer_id</span>
                            <Badge variant="outline">STRING</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>order_date</span>
                            <Badge variant="outline">DATE</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>amount</span>
                            <Badge variant="outline">DECIMAL</Badge>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="sample" className="space-y-4">
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2">customer_id</th>
                              <th className="text-left p-2">order_date</th>
                              <th className="text-left p-2">amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="p-2">CUST001</td>
                              <td className="p-2">2024-01-15</td>
                              <td className="p-2">1,234.56</td>
                            </tr>
                            <tr className="border-t">
                              <td className="p-2">CUST002</td>
                              <td className="p-2">2024-01-16</td>
                              <td className="p-2">567.89</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="actions" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="justify-start">
                          <Zap className="h-4 w-4 mr-2" />
                          Create Ingestion
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={handleTransform}>
                          <Wrench className="h-4 w-4 mr-2" />
                          Build Transform
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Shield className="h-4 w-4 mr-2" />
                          Add Quality Rules
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <FileCode className="h-4 w-4 mr-2" />
                          Generate SQL
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a table from the schema browser to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ingestion" className="space-y-4">
          <DataIngestionWorkflow
            onComplete={(config) => {
              console.log('Ingestion configured:', config);
            }}
          />
        </TabsContent>

        <TabsContent value="transform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transform Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Quick Transforms</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" size="sm">
                      <Zap className="h-4 w-4 mr-2" />
                      Aggregate
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileCode className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Code className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                    <Button variant="outline" size="sm">
                      <Database className="h-4 w-4 mr-2" />
                      Pivot
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">SQL Transform</h3>
                  <textarea
                    className="w-full h-32 p-2 font-mono text-sm bg-background border rounded"
                    placeholder={`SELECT 
  customer_id,
  SUM(amount) as total_amount
FROM ${selectedTable || 'table_name'}
GROUP BY customer_id`}
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline">Test Transform</Button>
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      Apply Transform
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <QualityRuleManager
            datasetId={selectedTable || ''}
            onRuleCreate={(rule) => {
              console.log('Quality rule created:', rule);
            }}
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <SQLGenerationEngine
            context={{
              selectedTable,
              schemas,
              dataSource: selectedSource
            }}
            onGenerate={(sql) => {
              console.log('Generated SQL:', sql);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}