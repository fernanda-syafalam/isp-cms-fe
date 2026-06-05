import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { InboxIcon } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/cn'

declare module '@tanstack/react-table' {
  // Per-column display hints consumed by DataTable.
  interface ColumnMeta<TData, TValue> {
    align?: 'right' | 'center'
  }
}

const SKELETON_ROW_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const

const alignClass = (align: 'right' | 'center' | undefined) =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : undefined

type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  data: T[] | undefined
  isLoading: boolean
  isError: boolean
  emptyMessage?: string
  errorMessage?: string
}

// Generic, presentational table over TanStack Table. Pagination/filtering live
// in the owning feature page; this only renders header, rows, and the three
// async states (loading skeleton / error / empty).
export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  emptyMessage = 'Tidak ada data.',
  errorMessage = 'Gagal memuat data. Coba muat ulang halaman.',
}: DataTableProps<T>) {
  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const rows = table.getRowModel().rows
  const colSpan = columns.length

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id} className="hover:bg-transparent">
            {group.headers.map((header) => (
              <TableHead
                key={header.id}
                className={alignClass(header.column.columnDef.meta?.align)}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading
          ? SKELETON_ROW_KEYS.map((key) => (
              <TableRow key={key} className="hover:bg-transparent">
                {columns.map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton cells, never reordered
                  <TableCell key={i}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : null}
        {!isLoading && isError ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={colSpan}
              className="py-10 text-center text-destructive"
              role="alert"
            >
              {errorMessage}
            </TableCell>
          </TableRow>
        ) : null}
        {!isLoading && !isError && rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="py-12 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <InboxIcon className="size-6" />
                <span className="text-sm">{emptyMessage}</span>
              </div>
            </TableCell>
          </TableRow>
        ) : null}
        {!isLoading && !isError
          ? rows.map((row) => (
              <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(alignClass(cell.column.columnDef.meta?.align))}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          : null}
      </TableBody>
    </Table>
  )
}
