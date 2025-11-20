'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table2,
  AlertCircle,
  CheckCircle2,
  Info,
  Zap,
  TrendingUp,
  Clock,
} from 'lucide-react';
import type { IngestionMethod } from '@/lib/types/source-connections';

export interface TableConfigWithMethod {
  schemaName: string;
  tableName: string;
  selected: boolean;

  // Method override
  ingestionMethod: IngestionMethod; // Default or overridden method
  recommendedMethod?: IngestionMethod; // AI/rules-based recommendation

  // Incremental-specific config
  timestampColumn?: string;
  detectedTimestampColumns?: string[];
  schedule?: 'hourly' | 'every_6h' | 'daily' | 'weekly';
  watermarkOffset?: string;

  // CDC-specific config
  hasPrimaryKey?: boolean;
  primaryKeyColumns?: string[];
  cdcCompatible?: boolean;
  incompatibilityReason?: string;

  // Common metadata
  estimatedRowCount: number;
  estimatedSizeGB?: number;
}

interface TableBrowserWithMethodSelectionProps {
  tables: TableConfigWithMethod[];
  defaultMethod: IngestionMethod;
  onTableUpdate: (index: number, updates: Partial<TableConfigWithMethod>) => void;
  onToggleSelection: (index: number) => void;
  onBulkMethodOverride?: (method: IngestionMethod) => void;
  showMethodRecommendations?: boolean;
}

const methodLabels: Record<IngestionMethod, string> = {
  federated: 'Federated Query',
  incremental_query: 'Incremental Sync',
  batch_cdc: 'Batch CDC',
  streaming_cdc: 'Streaming CDC',
};

const methodIcons: Record<IngestionMethod, typeof Zap> = {
  federated: Zap,
  incremental_query: Clock,
  batch_cdc: TrendingUp,
  streaming_cdc: TrendingUp,
};

export function TableBrowserWithMethodSelection({
  tables,
  defaultMethod,
  onTableUpdate,
  onToggleSelection,
  onBulkMethodOverride,
  showMethodRecommendations = true,
}: TableBrowserWithMethodSelectionProps) {
  const [bulkMethodSelection, setBulkMethodSelection] = useState<IngestionMethod>(defaultMethod);

  const selectedTables = tables.filter(t => t.selected);

  const getMethodRecommendation = (table: TableConfigWithMethod): {
    recommended: IngestionMethod;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  } | null => {
    if (!showMethodRecommendations) return null;

    // Rule-based recommendations

    // Large tables (>10M rows or >10GB) → CDC or Incremental
    if (table.estimatedRowCount > 10_000_000 || (table.estimatedSizeGB && table.estimatedSizeGB > 10)) {
      if (table.cdcCompatible) {
        return {
          recommended: 'batch_cdc',
          reason: 'Large table with frequent changes - CDC minimizes data transfer',
          confidence: 'high',
        };
      } else if (table.detectedTimestampColumns && table.detectedTimestampColumns.length > 0) {
        return {
          recommended: 'incremental_query',
          reason: 'Large table with timestamp column - incremental sync is efficient',
          confidence: 'high',
        };
      }
    }

    // Small tables (<100k rows or <1GB) → Federated
    if (table.estimatedRowCount < 100_000 || (table.estimatedSizeGB && table.estimatedSizeGB < 1)) {
      return {
        recommended: 'federated',
        reason: 'Small table - federated query is simple and cost-effective',
        confidence: 'medium',
      };
    }

    // Medium tables with timestamps → Incremental
    if (table.detectedTimestampColumns && table.detectedTimestampColumns.length > 0) {
      return {
        recommended: 'incremental_query',
        reason: 'Has timestamp column - good fit for incremental sync',
        confidence: 'medium',
      };
    }

    // Tables without timestamp or PK → Federated (fallback)
    if (!table.hasPrimaryKey && (!table.detectedTimestampColumns || table.detectedTimestampColumns.length === 0)) {
      return {
        recommended: 'federated',
        reason: 'No primary key or timestamp - federated query recommended',
        confidence: 'low',
      };
    }

    return null;
  };

  const handleBulkMethodApply = () => {
    if (onBulkMethodOverride) {
      onBulkMethodOverride(bulkMethodSelection);
    }
  };

  const renderMethodSpecificConfig = (table: TableConfigWithMethod, idx: number) => {
    const method = table.ingestionMethod;

    switch (method) {
      case 'incremental_query':
        return (
          <div className="grid grid-cols-3 gap-4 pt-3 border-t">
            <div className="space-y-2">
              <Label className="text-xs">Timestamp Column</Label>
              {table.detectedTimestampColumns && table.detectedTimestampColumns.length > 0 ? (
                <Select
                  value={table.timestampColumn || table.detectedTimestampColumns[0]}
                  onValueChange={(value) =>
                    onTableUpdate(idx, { timestampColumn: value })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {table.detectedTimestampColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  No timestamp columns detected
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Sync Schedule</Label>
              <Select
                value={table.schedule || 'daily'}
                onValueChange={(value: any) =>
                  onTableUpdate(idx, { schedule: value })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="every_6h">Every 6 Hours</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Watermark Offset</Label>
              <Input
                className="h-9"
                placeholder="e.g., 1 hour"
                value={table.watermarkOffset || ''}
                onChange={(e) =>
                  onTableUpdate(idx, { watermarkOffset: e.target.value })
                }
              />
            </div>
          </div>
        );

      case 'batch_cdc':
      case 'streaming_cdc':
        return (
          <div className="pt-3 border-t">
            {table.cdcCompatible ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                CDC compatible - Primary key: {table.primaryKeyColumns?.join(', ')}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                {table.incompatibilityReason || 'No primary key - CDC not recommended'}
              </div>
            )}
          </div>
        );

      case 'federated':
        return (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Direct query access - no replication needed
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {onBulkMethodOverride && selectedTables.length > 0 && (
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Bulk Method Override</p>
                <p className="text-xs text-muted-foreground">
                  Apply a method to all {selectedTables.length} selected table(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={bulkMethodSelection}
                  onValueChange={(value: IngestionMethod) => setBulkMethodSelection(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="federated">Federated Query</SelectItem>
                    <SelectItem value="incremental_query">Incremental Sync</SelectItem>
                    <SelectItem value="batch_cdc">Batch CDC</SelectItem>
                    <SelectItem value="streaming_cdc">Streaming CDC</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkMethodApply} size="sm">
                  Apply to Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Selection Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {selectedTables.length} of {tables.length} tables selected
        </span>
        <span>
          Default method: <span className="font-medium text-foreground">{methodLabels[defaultMethod]}</span>
        </span>
      </div>

      {/* Table List */}
      <div className="space-y-3">
        {tables.map((table, idx) => {
          const recommendation = getMethodRecommendation(table);
          const isMethodOverridden = table.ingestionMethod !== defaultMethod;
          const MethodIcon = methodIcons[table.ingestionMethod];

          return (
            <Card
              key={`${table.schemaName}.${table.tableName}`}
              className={`transition-all ${
                table.selected ? 'border-primary ring-1 ring-primary/20' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <Checkbox
                    checked={table.selected}
                    onCheckedChange={() => onToggleSelection(idx)}
                    className="mt-1"
                  />

                  <div className="flex-1 space-y-4">
                    {/* Table Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">
                            {table.schemaName}.{table.tableName}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {table.estimatedRowCount.toLocaleString()} rows
                          </Badge>
                          {table.estimatedSizeGB && (
                            <Badge variant="outline" className="text-xs">
                              ~{table.estimatedSizeGB.toFixed(1)} GB
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {table.detectedTimestampColumns && table.detectedTimestampColumns.length > 0 && (
                            <span>{table.detectedTimestampColumns.length} timestamp column(s)</span>
                          )}
                          {table.hasPrimaryKey && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              Has primary key
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Method Selector */}
                      {table.selected && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Ingestion Method</Label>
                          <Select
                            value={table.ingestionMethod}
                            onValueChange={(value: IngestionMethod) =>
                              onTableUpdate(idx, { ingestionMethod: value })
                            }
                          >
                            <SelectTrigger className={`w-[200px] ${isMethodOverridden ? 'border-amber-500 ring-1 ring-amber-500/20' : ''}`}>
                              <div className="flex items-center gap-2">
                                <MethodIcon className="h-4 w-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="federated">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4" />
                                  <span>Federated Query</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="incremental_query">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>Incremental Sync</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="batch_cdc">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  <span>Batch CDC</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="streaming_cdc">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  <span>Streaming CDC</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {isMethodOverridden && (
                            <p className="text-xs text-amber-600">
                              Overridden from default ({methodLabels[defaultMethod]})
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Recommendation Banner */}
                    {table.selected && recommendation && table.ingestionMethod !== recommendation.recommended && (
                      <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                        recommendation.confidence === 'high' ? 'bg-blue-50 text-blue-900 border border-blue-200' :
                        recommendation.confidence === 'medium' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        <Info className="h-4 w-4 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">Recommendation: {methodLabels[recommendation.recommended]}</p>
                          <p className="text-xs mt-1 opacity-90">{recommendation.reason}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onTableUpdate(idx, { ingestionMethod: recommendation.recommended })}
                          className="shrink-0"
                        >
                          Apply
                        </Button>
                      </div>
                    )}

                    {/* Method-Specific Configuration */}
                    {table.selected && renderMethodSpecificConfig(table, idx)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Table2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tables available. Browse the database to see tables.</p>
        </div>
      )}
    </div>
  );
}
