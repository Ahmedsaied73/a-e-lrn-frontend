'use client';

import { flexRender, type ColumnDef, type Table as TanStackTable } from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> {
  table: TanStackTable<TData>;
  columns: ColumnDef<TData>[];
  loading?: boolean;
  emptyLabel?: string;
  rowClassName?: (row: TData) => string | undefined;
}

export function DataTable<TData>({ table, columns, loading, emptyLabel = 'لا توجد بيانات.', rowClassName }: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-slate-700/60 bg-muted/40 hover:bg-muted/40">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="whitespace-nowrap text-slate-300">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={`sk-${i}`} className="border-slate-700/60">
                {columns.map((_, ci) => (
                  <TableCell key={ci} className="py-3">
                    <Skeleton className="h-4 w-full bg-slate-700/50" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="border-slate-700/60 hover:bg-transparent">
              <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-slate-500">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} className={cn('border-slate-700/60', rowClassName?.(row.original))}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap py-3 text-slate-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}