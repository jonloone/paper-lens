'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SQLEditor } from '@tidbcloud/tisqleditor-react';
import { oneDark } from '@tidbcloud/codemirror-extension-themes';
import { curSqlGutter } from '@tidbcloud/codemirror-extension-cur-sql-gutter';
import {
  Brain,
  CheckCircle,
  Clock,
  Database,
  Loader2,
  Play,
  Save,
  Sparkles,
  Table,
  Timer,
  X
} from 'lucide-react';
import { trinoClient } from '@/lib/integrations/trinoClient';

interface SQLEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (query: string, metadata: QueryMetadata) => void;
  initialQuery?: string;
  catalog?: string;
  schema?: string;
}

interface QueryMetadata {
  name: string;
  description: string;
  catalog: string;
  schema: string;
  estimatedRows?: number;
  estimatedBytes?: number;
}

interface QueryResult {
  columns: { name: string; type: string }[];
  data: any[][];
  stats: {
    executionTime: number;
    processedRows: number;
    processedBytes: number;
  };
}

export function SQLEditorModal({
  isOpen,
  onClose,
  onSave,
  initialQuery = '',
  catalog: initialCatalog = 'hive',
  schema: initialSchema = 'default'
}: SQLEditorModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [catalog, setCatalog] = useState(initialCatalog);
  const [schema, setSchema] = useState(initialSchema);
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingSQL, setIsGeneratingSQL] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');

  // Execute query against Trino
  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setIsExecuting(true);
    setError(null);
    
    try {
      const result = await trinoClient.executeQuery(query, 100);
      setResults(result);
      setActiveTab('results');
    } catch (err: any) {
      setError(err.message || 'Query execution failed');
      console.error('Query execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate SQL from natural language
  const generateSQL = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGeneratingSQL(true);
    try {
      // In production, call CrewAI service
      // const generatedSQL = await crewAIService.generateSQL(aiPrompt, { catalog, schema });
      
      // Mock response for now
      const generatedSQL = `-- Generated from: "${aiPrompt}"
SELECT 
  c.customer_id,
  c.customer_name,
  COUNT(o.order_id) as total_orders,
  SUM(o.order_amount) as total_spent
FROM ${catalog}.${schema}.customers c
LEFT JOIN ${catalog}.${schema}.orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name
ORDER BY total_spent DESC
LIMIT 100;`;
      
      setQuery(generatedSQL);
      setAiPrompt('');
    } catch (err) {
      console.error('SQL generation failed:', err);
    } finally {
      setIsGeneratingSQL(false);
    }
  };

  // Handle save
  const handleSave = () => {
    const metadata: QueryMetadata = {
      name: queryName || 'Untitled Query',
      description: queryDescription,
      catalog,
      schema,
      estimatedRows: results?.stats.processedRows,
      estimatedBytes: results?.stats.processedBytes
    };
    
    onSave(query, metadata);
    onClose();
  };

  // Format bytes for display
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Format duration for display
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5" />
              <DialogTitle>SQL Query Editor</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={catalog} onValueChange={setCatalog}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hive">hive</SelectItem>
                  <SelectItem value="postgresql">postgresql</SelectItem>
                  <SelectItem value="kafka">kafka</SelectItem>
                </SelectContent>
              </Select>
              <Select value={schema} onValueChange={setSchema}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">default</SelectItem>
                  <SelectItem value="staging">staging</SelectItem>
                  <SelectItem value="analytics">analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogDescription>
            Write and test SQL queries with AI assistance
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-6">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="results" disabled={!results}>
                Results {results && <Badge className="ml-2" variant="secondary">{results.data.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="flex-1 px-6 pb-4">
              <div className="h-full flex gap-4">
                <div className="flex-1 border rounded-lg overflow-hidden">
                  <SQLEditor
                    editorId="pipeline-sql-editor"
                    doc={query}
                    onChange={setQuery}
                    theme={oneDark}
                    basicSetupOptions={{
                      autocompletion: true,
                      lineNumbers: true,
                      highlightSelectionMatches: true,
                      foldGutter: true
                    }}
                    extraExts={[
                      curSqlGutter()
                    ]}
                  />
                </div>
                
                {/* Schema Browser Sidebar */}
                <Card className="w-64">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Schema Explorer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        <Alert>
                          <Database className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {catalog}.{schema}
                          </AlertDescription>
                        </Alert>
                        
                        {/* Mock schema - in production, fetch from Trino */}
                        <div className="space-y-1">
                          <div className="text-xs font-medium">Tables</div>
                          {['customers', 'orders', 'products', 'transactions'].map(table => (
                            <div key={table} className="pl-2 py-1 text-xs hover:bg-muted rounded cursor-pointer">
                              <Table className="h-3 w-3 inline mr-1" />
                              {table}
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="results" className="flex-1 px-6 pb-4">
              {results && (
                <div className="h-full flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        <Timer className="h-3 w-3 mr-1" />
                        {formatDuration(results.stats.executionTime)}
                      </Badge>
                      <Badge variant="outline">
                        <Table className="h-3 w-3 mr-1" />
                        {results.data.length} rows
                      </Badge>
                      <Badge variant="outline">
                        <Database className="h-3 w-3 mr-1" />
                        {formatBytes(results.stats.processedBytes)}
                      </Badge>
                    </div>
                  </div>

                  <Card className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background border-b">
                          <tr>
                            {results.columns.map((col, idx) => (
                              <th key={idx} className="text-left p-2 font-medium">
                                {col.name}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({col.type})
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {results.data.map((row, ridx) => (
                            <tr key={ridx} className="border-b hover:bg-muted/50">
                              {row.map((cell, cidx) => (
                                <td key={cidx} className="p-2">
                                  {cell?.toString() || 'NULL'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="flex-1 px-6 pb-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Natural Language to SQL
                    </CardTitle>
                    <CardDescription>
                      Describe what data you need in plain English
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        placeholder="e.g., Show me top 10 customers by total order value"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && generateSQL()}
                      />
                      <Button
                        onClick={generateSQL}
                        disabled={isGeneratingSQL || !aiPrompt.trim()}
                      >
                        {isGeneratingSQL ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Query Metadata</CardTitle>
                    <CardDescription>
                      Add details for pipeline configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Query Name</label>
                      <input
                        type="text"
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        placeholder="e.g., Customer Revenue Analysis"
                        value={queryName}
                        onChange={(e) => setQueryName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        placeholder="What does this query do?"
                        rows={3}
                        value={queryDescription}
                        onChange={(e) => setQueryDescription(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={executeQuery}
                disabled={isExecuting || !query.trim()}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Query
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!query.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Save to Pipeline
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}