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
  /**
   * Presentation only (added by the admin restyle).
   * - 'default' -> the pre-migration chrome, kept byte-for-byte so the admin
   *   pages that have not been migrated yet are not touched.
   * - 'brand'   -> the same DOM on the brand-* tokens from app/brand-theme.css.
   * Swapping the default to 'brand' is a one-word change once every caller is
   * migrated; drop the prop then.
   */
  variant?: 'default' | 'brand';
}

export function DataTable<TData>({ table, columns, loading, emptyLabel = 'لا توجد بيانات.', rowClassName, variant = 'default' }: DataTableProps<TData>) {
  const brand = variant === 'brand';
  const rows = table.getRowModel().rows;
  return (
    <div className={cn('overflow-hidden rounded-xl border', brand ? 'border-brand-border bg-brand-surface' : 'border-outline-variant/70 bg-card')}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className={cn(
                brand ? 'border-brand-border hover:bg-brand-surface' : 'border-outline-variant/50 bg-muted/40 hover:bg-muted/40',
              )}
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn('whitespace-nowrap', brand ? 'text-start text-xs text-brand-muted' : 'text-on-surface-variant')}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={`sk-${i}`} className={brand ? 'border-brand-border/70' : 'border-outline-variant/50'}>
                {columns.map((_, ci) => (
                  <TableCell key={ci} className="px-4 py-3">
                    <Skeleton className={cn('h-4 w-full', brand ? 'bg-brand-chip' : 'bg-muted')} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className={cn(brand ? 'border-brand-border/70 hover:bg-transparent' : 'border-outline-variant/50 hover:bg-transparent')}>
              <TableCell colSpan={columns.length} className={cn('py-10 text-center text-sm', brand ? 'text-brand-muted' : 'text-on-surface-variant')}>
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(brand ? 'border-brand-border/70 hover:bg-brand-hover' : 'border-outline-variant/50', rowClassName?.(row.original))}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn('whitespace-nowrap px-4 py-3', brand ? 'text-brand-text' : 'text-on-surface')}>
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