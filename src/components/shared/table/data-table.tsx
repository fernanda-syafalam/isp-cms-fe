import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table'
import { InboxIcon, SearchIcon, TriangleAlertIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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

import { DataTablePagination } from './data-table-pagination'
import { DataTableViewOptions } from './data-table-view-options'

declare module '@tanstack/react-table' {
  // Per-column display hints consumed by DataTable.
  interface ColumnMeta<TData, TValue> {
    align?: 'right' | 'center'
    title?: string
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
  searchPlaceholder?: string
  /** Seeds the search box (e.g. from a `?q=` deep-link). */
  initialSearch?: string | undefined
  /** Extra filter controls rendered in the left of the toolbar. */
  toolbar?: ReactNode
  /** Right-aligned actions (e.g. "+ Baru", Export). */
  actions?: ReactNode
  enableSelection?: boolean
  /** Renders a bulk-action bar when rows are selected. */
  bulkActions?: (selected: T[]) => ReactNode
}

const SELECT_COLUMN_ID = '__select__'

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  emptyMessage = 'Tidak ada data.',
  errorMessage = 'Gagal memuat data. Coba muat ulang halaman.',
  searchPlaceholder,
  initialSearch,
  toolbar,
  actions,
  enableSelection = false,
  bulkActions,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState(initialSearch ?? '')

  const selectColumn: ColumnDef<T> = {
    id: SELECT_COLUMN_ID,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Pilih baris"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }

  const table = useReactTable({
    data: data ?? [],
    columns: enableSelection ? [selectColumn, ...columns] : columns,
    state: { sorting, columnVisibility, rowSelection, globalFilter },
    enableRowSelection: enableSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const rows = table.getRowModel().rows
  const headerColSpan = table.getAllLeafColumns().length
  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original)

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {searchPlaceholder ? (
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-9"
            />
          </div>
        ) : null}
        {toolbar}
        <div className="flex items-center gap-2 sm:ml-auto">
          <DataTableViewOptions table={table} />
          {actions}
        </div>
      </div>

      {enableSelection && bulkActions && selectedRows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
          <span className="text-sm">{selectedRows.length} dipilih</span>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {bulkActions(selectedRows)}
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
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
                    {table.getAllLeafColumns().map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
            {!isLoading && isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={headerColSpan} className="py-12 text-center" role="alert">
                  <div className="flex flex-col items-center gap-2 text-destructive">
                    <TriangleAlertIcon className="size-6" />
                    <span className="text-sm">{errorMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !isError && rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={headerColSpan} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <InboxIcon className="size-6" />
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !isError
              ? rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
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
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
