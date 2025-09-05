'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Database, Warehouse, Info, Sparkles } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef
} from "@tanstack/react-table";

interface DataTable {
  id: string;
  name: string;
  schema: string;
  rows: string;
  quality: number;
  lastUpdated: string;
  status: 'healthy' | 'degraded' | 'offline';
}

interface DataSourceSelectorProps {
  onTablesSelected: (tables: string[]) => void;
}

export function DataSourceSelector({ onTablesSelected }: DataSourceSelectorProps) {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [data] = useState<DataTable[]>([
    {
      id: 'customers',
      name: 'customers',
      schema: 'iceberg.bluechip',
      rows: '2.3M',
      quality: 94,
      lastUpdated: '2 hours ago',
      status: 'healthy'
    },
    {
      id: 'orders',
      name: 'orders',
      schema: 'iceberg.bluechip', 
      rows: '8.7M',
      quality: 89,
      lastUpdated: '1 hour ago',
      status: 'healthy'
    },
    {
      id: 'products',
      name: 'products',
      schema: 'iceberg.bluechip',
      rows: '45K',
      quality: 96,
      lastUpdated: '4 hours ago',
      status: 'degraded'
    }
  ]);

  const columnHelper = createColumnHelper<DataTable>();

  const columns: ColumnDef<DataTable>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    columnHelper.accessor('name', {
      header: 'Table Name',
      cell: info => (
        <div>
          <div className="font-medium">{info.getValue()}</div>
          <div className="text-xs text-muted-foreground">{info.row.original.schema}</div>
        </div>
      )
    }),
    columnHelper.accessor('rows', {
      header: 'Rows',
      cell: info => info.getValue()
    }),
    columnHelper.accessor('quality', {
      header: 'Quality',
      cell: info => (
        <Badge variant={info.getValue() > 90 ? "default" : "secondary"}>
          {info.getValue()}%
        </Badge>
      )
    }),
    columnHelper.accessor('lastUpdated', {
      header: 'Last Updated',
      cell: info => info.getValue()
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            info.getValue() === 'healthy' ? 'bg-green-500' : 
            info.getValue() === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm capitalize">{info.getValue()}</span>
        </div>
      )
    }),
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm">
          <Info className="h-3 w-3" />
        </Button>
      )
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      const newSelection = typeof updater === 'function' 
        ? updater(rowSelection)
        : updater;
      
      const selectedTableIds = Object.keys(newSelection)
        .filter(key => newSelection[key])
        .map(index => data[parseInt(index)]?.name)
        .filter(Boolean);
      
      setSelectedTables(selectedTableIds);
      onTablesSelected(selectedTableIds);
    },
    state: {
      globalFilter: searchQuery,
      rowSelection,
    },
    globalFilterFn: 'includesString',
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Source Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="federated" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="federated" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Federated
            </TabsTrigger>
            <TabsTrigger value="lakehouse" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Lakehouse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="federated" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tables and schemas..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="border-b bg-muted/50">
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="p-3 text-left text-sm font-medium">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="border-b hover:bg-muted/25">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Intelligent Suggestions */}
            {selectedTables.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">Intelligent Analysis</span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Based on your selection, customers and orders tables have a strong relationship 
                  (customer_id foreign key). Both were updated within the last 24 hours.
                </p>
                <Button variant="outline" size="sm" className="text-blue-900 dark:text-blue-400 border-blue-300 dark:border-blue-800">
                  View Relationship Analysis
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="lakehouse">
            <div className="text-center py-12 text-muted-foreground">
              <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Lakehouse table browser implementation...</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Selection Summary */}
        {selectedTables.length > 0 && (
          <div className="mt-6 pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Selected ({selectedTables.length} tables)
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedTables([]);
                  onTablesSelected([]);
                  setRowSelection({});
                }}
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTables.map(table => (
                <Badge key={table} variant="secondary">
                  {table}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}