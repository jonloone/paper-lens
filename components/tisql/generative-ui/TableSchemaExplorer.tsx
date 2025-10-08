'use client';

import React, { useState } from 'react';
import { Table, ChevronDown, ChevronRight, Key, Database, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Column {
  name: string;
  type: string;
  nullable?: boolean;
  isPrimaryKey?: boolean;
  description?: string;
}

export interface TableSchemaExplorerProps {
  catalog: string;
  schema: string;
  table: string;
  columns: Column[];
  rowCount?: number;
  onUseinQuery?: (tableName: string) => void;
  onGetSampleData?: () => void;
}

/**
 * TableSchemaExplorer - Generative UI component for exploring table schemas
 *
 * Rendered by the AI agent when showing table information with expandable
 * column details and interactive actions.
 */
export function TableSchemaExplorer({
  catalog,
  schema,
  table,
  columns,
  rowCount,
  onUseinQuery,
  onGetSampleData,
}: TableSchemaExplorerProps) {
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());
  const fullTableName = `${catalog}.${schema}.${table}`;

  const toggleColumn = (columnName: string) => {
    const newExpanded = new Set(expandedColumns);
    if (newExpanded.has(columnName)) {
      newExpanded.delete(columnName);
    } else {
      newExpanded.add(columnName);
    }
    setExpandedColumns(newExpanded);
  };

  const getTypeColor = (type: string) => {
    const typeUpper = type.toUpperCase();
    if (typeUpper.includes('INT') || typeUpper.includes('NUMERIC') || typeUpper.includes('DECIMAL')) {
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
    if (typeUpper.includes('VARCHAR') || typeUpper.includes('TEXT') || typeUpper.includes('STRING')) {
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
    if (typeUpper.includes('DATE') || typeUpper.includes('TIME')) {
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    }
    if (typeUpper.includes('BOOL')) {
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    }
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Table className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{table}</h4>
            <p className="text-xs text-muted-foreground">
              {catalog}.{schema}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rowCount !== undefined && (
            <Badge variant="outline" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              {rowCount.toLocaleString()} rows
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {columns.length} columns
          </Badge>
        </div>
      </div>

      {/* Columns List */}
      <div className="divide-y">
        {columns.map((column) => {
          const isExpanded = expandedColumns.has(column.name);
          const hasPK = column.isPrimaryKey;

          return (
            <div key={column.name} className="hover:bg-muted/20 transition-colors">
              <button
                onClick={() => toggleColumn(column.name)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    {hasPK && <Key className="w-3 h-3 text-yellow-500" />}
                  </div>
                  <span className="font-mono text-sm font-medium">{column.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${getTypeColor(column.type)}`}>
                    {column.type}
                  </Badge>
                  {!column.nullable && (
                    <Badge variant="outline" className="text-xs">
                      NOT NULL
                    </Badge>
                  )}
                </div>
              </button>

              {isExpanded && column.description && (
                <div className="px-4 pb-3 pl-12 text-xs text-muted-foreground flex items-start gap-2">
                  <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <p>{column.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t bg-muted/10 flex gap-2">
        {onUseinQuery && (
          <Button
            onClick={() => onUseinQuery(fullTableName)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Use in Query
          </Button>
        )}
        {onGetSampleData && (
          <Button onClick={onGetSampleData} size="sm" className="flex-1">
            Get Sample Data
          </Button>
        )}
      </div>
    </div>
  );
}
