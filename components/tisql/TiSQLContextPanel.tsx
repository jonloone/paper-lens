'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Database,
  Table,
  Clock,
  User,
  Tag,
  ChevronDown,
  ChevronRight,
  Key,
  Columns,
  PanelLeftClose
} from 'lucide-react';
import { useState } from 'react';
import type { ProductDefinition } from '../build/steps/Step1DefineProduct';
import type { Source } from '../build/steps/Step2SelectSources';

interface SchemaNode {
  name: string;
  type: 'database' | 'table' | 'column';
  children?: SchemaNode[];
  dataType?: string;
}

interface TiSQLContextPanelProps {
  productDefinition?: ProductDefinition;
  selectedSources: Source[];
  outputSchema?: Array<{ name: string; type: string }>;
  catalog?: string;
  environment?: string;
  onCollapse?: () => void;
}

export function TiSQLContextPanel({
  productDefinition,
  selectedSources,
  outputSchema = [],
  catalog = 'iceberg',
  environment = 'development',
  onCollapse
}: TiSQLContextPanelProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTable = (tableId: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };

  const formatSchedule = (schedule: ProductDefinition['schedule']) => {
    switch (schedule.type) {
      case 'hourly': return 'Every hour';
      case 'daily': return `Daily at ${schedule.time}`;
      case 'weekly': return `Weekly on ${schedule.day}`;
      case 'cron': return schedule.cron;
      default: return schedule.type;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header with Minimize Button */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex-1" />
        {onCollapse && (
          <Button
            onClick={onCollapse}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="Minimize context panel (⌘B)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="context" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted">
          <TabsTrigger value="context" className="gap-2">
            <FileText className="w-4 h-4" />
            Context
          </TabsTrigger>
          <TabsTrigger value="schema" className="gap-2">
            <Database className="w-4 h-4" />
            Schema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="context" className="flex-1 m-0">
          <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            {/* Environment Badge */}
            <Card className="border-2">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Environment</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {environment.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Catalog</span>
                  <Badge variant="outline" className="text-xs">
                    {catalog}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Product Definition */}
            {productDefinition && (
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      Product Definition
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <div className="font-semibold mb-1">{productDefinition.displayName}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {productDefinition.description}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Owner:</span>
                      <span>{productDefinition.owner}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Schedule:</span>
                      <span>{formatSchedule(productDefinition.schedule)}</span>
                    </div>
                    {productDefinition.tags.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Tag className="w-3 h-3 text-muted-foreground mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {productDefinition.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Sources */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      Source Tables
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {selectedSources.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedSources.map(source => {
                    const isExpanded = expandedTables.has(source.id);
                    return (
                      <div key={source.id} className="space-y-1">
                        <button
                          onClick={() => toggleTable(source.id)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Table className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-mono truncate">{source.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {source.columns.length} cols
                            </Badge>
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="pl-5 space-y-1 border-l-2 border-primary/20 ml-2">
                            {source.columns.map(col => (
                              <div
                                key={col.name}
                                className="flex items-center justify-between p-1.5 rounded text-xs hover:bg-muted/30 cursor-pointer"
                                title={col.description || col.name}
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {col.isPrimaryKey && (
                                    <Key className="w-3 h-3 text-primary flex-shrink-0" />
                                  )}
                                  <span className="font-mono truncate">{col.name}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {col.type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Output Schema */}
            {outputSchema.length > 0 && (
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        Output Schema
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {outputSchema.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {outputSchema.map(field => (
                      <div
                        key={field.name}
                        className="flex items-center justify-between p-1.5 rounded text-xs hover:bg-muted/30"
                      >
                        <span className="font-mono">{field.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {field.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="schema" className="flex-1 m-0">
          <ScrollArea className="h-full">
          <div className="p-4">
            {/* Schema Browser - using selected sources as schema */}
            <div className="space-y-2">
              {selectedSources.map(source => (
                <div key={source.id}>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
                    <Database className="w-4 h-4 text-primary" />
                    {catalog}
                  </div>
                  <div className="pl-4">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                      <Table className="w-4 h-4" />
                      {source.name}
                    </div>
                    <div className="pl-4 space-y-0.5">
                      {source.columns.map(col => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between px-2 py-1 text-xs hover:bg-muted/30 rounded cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Columns className="w-3 h-3" />
                            <span className="font-mono">{col.name}</span>
                          </div>
                          <span className="text-muted-foreground">{col.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
