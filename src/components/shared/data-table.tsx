import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const SKELETON_ROW_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const

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
  emptyMessage = 'No records found.',
  errorMessage = 'Failed to load data. Try refreshing the page.',
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
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead key={header.id}>
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
              <TableRow key={key}>
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
          <TableRow>
            <TableCell colSpan={colSpan} className="text-center text-destructive" role="alert">
              {errorMessage}
            </TableCell>
          </TableRow>
        ) : null}
        {!isLoading && !isError && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : null}
        {!isLoading && !isError
          ? rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
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
