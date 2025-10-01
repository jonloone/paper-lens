'use client';

import * as React from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Play,
  Eye,
  Edit3,
  Trash2,
  Database,
  Brain,
  RefreshCw,
  Settings2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, StatusType } from './StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DataPipeline {
  id: string;
  name: string;
  type: 'etl' | 'ml' | 'sync' | 'transform';
  status: StatusType;
  lastRun: string;
  runtime: string;
  records: number;
  owner: string;
  schedule: string;
  quality: number;
  progress?: number;
}

const data: DataPipeline[] = [
  {
    id: 'pipe-001',
    name: 'Customer Data ETL',
    type: 'etl',
    status: 'running',
    lastRun: '2024-01-26 10:30',
    runtime: '12m 34s',
    records: 1245678,
    owner: 'Sarah Chen',
    schedule: 'Every 30 min',
    quality: 98,
    progress: 67,
  },
  {
    id: 'pipe-002',
    name: 'Product Analytics Pipeline',
    type: 'transform',
    status: 'success',
    lastRun: '2024-01-26 10:15',
    runtime: '8m 12s',
    records: 823456,
    owner: 'Mike Johnson',
    schedule: 'Hourly',
    quality: 95,
  },
  {
    id: 'pipe-003',
    name: 'Financial Reporting',
    type: 'etl',
    status: 'failed',
    lastRun: '2024-01-26 09:45',
    runtime: '3m 45s',
    records: 0,
    owner: 'Lisa Wang',
    schedule: 'Daily',
    quality: 0,
  },
  {
    id: 'pipe-004',
    name: 'Marketing Attribution',
    type: 'ml',
    status: 'success',
    lastRun: '2024-01-26 10:00',
    runtime: '15m 22s',
    records: 2341234,
    owner: 'David Kim',
    schedule: 'Every 15 min',
    quality: 92,
  },
  {
    id: 'pipe-005',
    name: 'Inventory Sync',
    type: 'sync',
    status: 'paused',
    lastRun: '2024-01-25 22:00',
    runtime: '45m 10s',
    records: 543210,
    owner: 'Emma Davis',
    schedule: 'Every 6 hours',
    quality: 88,
  },
  {
    id: 'pipe-006',
    name: 'Real-time Event Processing',
    type: 'transform',
    status: 'running',
    lastRun: '2024-01-26 10:32',
    runtime: '2m 15s',
    records: 98234,
    owner: 'Alex Rivera',
    schedule: 'Continuous',
    quality: 99,
    progress: 23,
  },
];

const columnHelper = createColumnHelper<DataPipeline>();

// Pipeline type icons - clean, using Lucide icons
const getTypeIcon = (type: DataPipeline['type']) => {
  const icons = {
    etl: <Database className="w-4 h-4" />,
    ml: <Brain className="w-4 h-4" />,
    sync: <RefreshCw className="w-4 h-4" />,
    transform: <Settings2 className="w-4 h-4" />,
  };
  return icons[type] || <Database className="w-4 h-4" />;
};

// Row actions component
const RowActions = ({ pipeline }: { pipeline: DataPipeline }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Play className="mr-2 h-4 w-4" />
          Run Now
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Edit3 className="mr-2 h-4 w-4" />
          Edit Pipeline
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const columns = [
  columnHelper.accessor('name', {
    header: 'Pipeline',
    cell: (info) => {
      const pipeline = info.row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {getTypeIcon(pipeline.type)}
          </div>
          <div>
            <div className="font-medium text-foreground">{info.getValue()}</div>
            <div className="text-xs text-muted-foreground uppercase">{pipeline.type}</div>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} size="sm" />,
  }),
  columnHelper.accessor('lastRun', {
    header: 'Last Run',
    cell: (info) => {
      const pipeline = info.row.original;
      return (
        <div className="space-y-1">
          <div className="text-sm text-foreground">{info.getValue()}</div>
          <div className="flex items-center gap-2">
            {pipeline.progress !== undefined && pipeline.status === 'running' ? (
              <>
                <div className="flex-1 max-w-[100px]">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                      style={{ width: `${pipeline.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{pipeline.progress}%</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{pipeline.runtime}</span>
            )}
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor('records', {
    header: 'Records',
    cell: (info) => (
      <div className="text-sm font-mono">
        {info.getValue().toLocaleString()}
      </div>
    ),
  }),
  columnHelper.accessor('quality', {
    header: 'Quality',
    cell: (info) => {
      const value = info.getValue();
      const getQualityColor = (score: number) => {
        if (score >= 95) return 'text-[#00E5C8]';
        if (score >= 85) return 'text-[#FFB366]';
        return 'text-[#FF6B7A]';
      };
      return (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${getQualityColor(value)}`}>
            {value}%
          </span>
          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                value >= 95 ? 'bg-[#00E5C8]' :
                value >= 85 ? 'bg-[#FFB366]' : 'bg-[#FF6B7A]'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor('owner', {
    header: 'Owner',
    cell: (info) => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-medium text-white">
          {info.getValue().split(' ').map(n => n[0]).join('')}
        </div>
        <span className="text-sm">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('schedule', {
    header: 'Schedule',
    cell: (info) => (
      <Badge variant="outline" className="text-xs font-normal">
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: (info) => <RowActions pipeline={info.row.original} />,
  }),
];

export function DataTableExample() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full">
      {/* Clean Table Header */}
      <div className="bg-card border border-border rounded-t-xl p-6 border-b-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-medium text-foreground">
              Pipeline Runs
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {data.length} total pipelines · Last updated 2 min ago
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Pipeline
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search pipelines..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Clean Table */}
      <div className="bg-card border-x border-b border-border rounded-b-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Clean Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              data.length
            )}{' '}
            of {data.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}