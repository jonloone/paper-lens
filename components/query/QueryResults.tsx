'use client';

import React, { useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  Settings2,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueryResultsProps {
  data: any[];
  schema: {
    columns: Array<{
      name: string;
      type: string;
      nullable?: boolean;
      statistics?: {
        nullCount?: number;
        uniqueCount?: number;
        min?: any;
        max?: any;
        mean?: number;
        median?: number;
      };
      quality?: {
        score: number;
        issues?: string[];
      };
    }>;
  };
  executionTime?: number;
  rowCount?: number;
  truncated?: boolean;
  onExport?: (format: 'csv' | 'json' | 'parquet') => void;
  onColumnAnalyze?: (columnName: string) => void;
}

export function QueryResults({
  data,
  schema,
  executionTime,
  rowCount,
  truncated,
  onExport,
  onColumnAnalyze,
}: QueryResultsProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [showStatistics, setShowStatistics] = useState(false);

  // Generate table columns from schema
  const columns = useMemo<ColumnDef<any>[]>(() => {
    return schema.columns.map((col) => ({
      accessorKey: col.name,
      header: ({ column }) => {
        const stats = col.statistics;
        const quality = col.quality;
        
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{col.name}</span>
                <Badge variant="outline" className="text-xs">
                  {getTypeIcon(col.type)}
                  <span className="ml-1">{col.type}</span>
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="-mr-3 h-8 data-[state=open]:bg-accent"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                <ArrowUpDown className="h-3 w-3" />
              </Button>
            </div>
            
            {showStatistics && stats && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Nulls: {stats.nullCount || 0}</span>
                  <span>Unique: {stats.uniqueCount || 0}</span>
                </div>
                {stats.min !== undefined && (
                  <div className="flex justify-between">
                    <span>Min: {formatValue(stats.min, col.type)}</span>
                    <span>Max: {formatValue(stats.max, col.type)}</span>
                  </div>
                )}
              </div>
            )}
            
            {quality && quality.score < 0.8 && (
              <div className="flex items-center gap-1 text-xs">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <span className="text-yellow-600">Quality: {Math.round(quality.score * 100)}%</span>
              </div>
            )}
          </div>
        );
      },
      cell: ({ row }) => {
        const value = row.getValue(col.name);
        const quality = col.quality;
        
        return (
          <div className="relative">
            {formatCellValue(value, col.type)}
            {quality && quality.score < 0.5 && value && (
              <div className="absolute -top-1 -right-1">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
              </div>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    }));
  }, [schema.columns, showStatistics]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Query Results</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{rowCount || data.length} rows</span>
                {executionTime && (
                  <>
                    <span>•</span>
                    <span>{executionTime}ms</span>
                  </>
                )}
                {truncated && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Truncated
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-8 w-[200px] pl-8"
              />
            </div>
            
            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Columns
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Statistics Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatistics(!showStatistics)}
              className={cn(showStatistics && "bg-accent")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Stats
            </Button>
            
            {/* Export Options */}
            {onExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem onClick={() => onExport('csv')}>
                    Export as CSV
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem onClick={() => onExport('json')}>
                    Export as JSON
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem onClick={() => onExport('parquet')}>
                    Export as Parquet
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              rowCount || data.length
            )}{' '}
            of {rowCount || data.length} rows
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm">Page</span>
              <strong className="text-sm">
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </strong>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'string':
    case 'varchar':
    case 'text':
      return <Type className="h-3 w-3" />;
    case 'integer':
    case 'bigint':
    case 'decimal':
    case 'float':
    case 'double':
      return <Hash className="h-3 w-3" />;
    case 'date':
    case 'timestamp':
    case 'datetime':
      return <Calendar className="h-3 w-3" />;
    case 'boolean':
      return <ToggleLeft className="h-3 w-3" />;
    default:
      return null;
  }
}

function formatValue(value: any, type: string): string {
  if (value === null || value === undefined) return 'null';
  
  switch (type.toLowerCase()) {
    case 'date':
    case 'timestamp':
    case 'datetime':
      return new Date(value).toLocaleDateString();
    case 'decimal':
    case 'float':
    case 'double':
      return Number(value).toFixed(2);
    default:
      return String(value);
  }
}

function formatCellValue(value: any, type: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }
  
  switch (type.toLowerCase()) {
    case 'boolean':
      return value ? (
        <Badge variant="outline" className="text-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          true
        </Badge>
      ) : (
        <Badge variant="outline" className="text-red-600">
          <XCircle className="h-3 w-3 mr-1" />
          false
        </Badge>
      );
    case 'date':
    case 'timestamp':
    case 'datetime':
      return new Date(value).toLocaleString();
    case 'decimal':
    case 'float':
    case 'double':
      const num = Number(value);
      return (
        <span className={cn(
          "font-mono",
          num < 0 && "text-red-600",
          num > 0 && "text-green-600"
        )}>
          {num.toFixed(2)}
        </span>
      );
    default:
      return <span className="font-mono text-sm">{String(value)}</span>;
  }
}