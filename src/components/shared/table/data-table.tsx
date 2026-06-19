import {
  type ColumnDef,
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table'
import { SearchIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
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

// Mirror a column's text alignment onto its fixed-width loading skeleton so the
// placeholder sits under where the real value will land (right/center columns).
const skeletonAlign = (align: 'right' | 'center' | undefined) =>
  align === 'right' ? 'ml-auto' : align === 'center' ? 'mx-auto' : undefined

/**
 * Server-driven table state. When provided, the table delegates paging,
 * sorting, and filtering to the server (manual mode): `data` is the current
 * page only and `rowCount` is the server total. The owning page wires this up
 * with `useTableQuery`. Omit it to keep the default client-side behavior.
 */
export type DataTableServerState = {
  pageIndex: number
  pageSize: number
  /** Total rows on the server (drives the page count, not `data.length`). */
  rowCount: number
  sorting: SortingState
  search: string
  onPaginationChange: (next: { pageIndex: number; pageSize: number }) => void
  onSortingChange: (next: SortingState) => void
  onSearchChange: (next: string) => void
}

type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  data: T[] | undefined
  isLoading: boolean
  isError: boolean
  emptyMessage?: string
  errorMessage?: string
  /** When provided, the error row shows a "Coba lagi" button wired to this. */
  onRetry?: () => void
  /**
   * When provided, clicking a data row (outside its own links/buttons/checkbox)
   * calls this — e.g. to open a detail drawer. Rows get a pointer cursor.
   */
  onRowClick?: (row: T) => void
  searchPlaceholder?: string
  /** Seeds the search box (e.g. from a `?q=` deep-link). Client mode only. */
  initialSearch?: string | undefined
  /** Extra filter controls rendered in the left of the toolbar. */
  toolbar?: ReactNode
  /** Right-aligned actions (e.g. "+ Baru", Export). */
  actions?: ReactNode
  enableSelection?: boolean
  /** Renders a bulk-action bar when rows are selected. */
  bulkActions?: (selected: T[]) => ReactNode
  /** Enables server-side paging/sorting/search (see {@link DataTableServerState}). */
  server?: DataTableServerState
}

const SELECT_COLUMN_ID = '__select__'

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  emptyMessage = 'Tidak ada data.',
  errorMessage = 'Gagal memuat data. Coba muat ulang halaman.',
  onRetry,
  onRowClick,
  searchPlaceholder,
  initialSearch,
  toolbar,
  actions,
  enableSelection = false,
  bulkActions,
  server,
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

  // Shared options for both modes; the mode-specific bits (state, change
  // handlers, manual flags, row models) are merged in below.
  const baseOptions: TableOptions<T> = {
    data: data ?? [],
    columns: enableSelection ? [selectColumn, ...columns] : columns,
    enableRowSelection: enableSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  }

  const table = useReactTable<T>(
    server
      ? {
          ...baseOptions,
          state: {
            columnVisibility,
            rowSelection,
            sorting: server.sorting,
            pagination: {
              pageIndex: server.pageIndex,
              pageSize: server.pageSize,
            },
          },
          manualPagination: true,
          manualSorting: true,
          manualFiltering: true,
          rowCount: server.rowCount,
          onSortingChange: (updater) =>
            server.onSortingChange(functionalUpdate(updater, server.sorting)),
          onPaginationChange: (updater) =>
            server.onPaginationChange(
              functionalUpdate(updater, {
                pageIndex: server.pageIndex,
                pageSize: server.pageSize,
              }),
            ),
        }
      : {
          ...baseOptions,
          state: { sorting, columnVisibility, rowSelection, globalFilter },
          onSortingChange: setSorting,
          onGlobalFilterChange: setGlobalFilter,
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize: 10 } },
        },
  )

  const rows = table.getRowModel().rows
  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original)

  const searchValue = server ? server.search : globalFilter
  const onSearchChange = server ? server.onSearchChange : setGlobalFilter

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {searchPlaceholder ? (
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 pl-9 sm:h-8"
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

      {/* Error / empty render ONCE (shared across the mobile + desktop layouts). */}
      {isError ? (
        <div className="rounded-lg border border-border bg-card">
          <ErrorState title={errorMessage} {...(onRetry ? { onRetry } : {})} />
        </div>
      ) : !isLoading && rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState title={emptyMessage} />
        </div>
      ) : (
        <>
          {/* Mobile: card list — the table is md+ only so phones never horizontal-scroll. */}
          <div className="space-y-2 md:hidden">
            {isLoading
              ? SKELETON_ROW_KEYS.map((key) => (
                  <Skeleton key={key} className="h-24 w-full rounded-lg" />
                ))
              : rows.map((row) => (
                  <div
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className="rounded-lg border border-border bg-card p-3 data-[state=selected]:bg-muted"
                  >
                    <dl className="space-y-1.5">
                      {row.getVisibleCells().map((cell) => {
                        const title = cell.column.columnDef.meta?.title
                        return (
                          <div key={cell.id} className="flex items-start justify-between gap-3">
                            <dt
                              className={cn(
                                'shrink-0 text-muted-foreground text-xs',
                                !title && 'sr-only',
                              )}
                            >
                              {title ?? 'Aksi'}
                            </dt>
                            <dd className="min-w-0 text-right text-sm">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </dd>
                          </div>
                        )
                      })}
                    </dl>
                  </div>
                ))}
          </div>

          {/* Desktop: full table (md+). */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
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
                          <TableCell key={col.id} className={alignClass(col.columnDef.meta?.align)}>
                            <Skeleton
                              className={cn('h-4 w-24', skeletonAlign(col.columnDef.meta?.align))}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() ? 'selected' : undefined}
                        onClick={
                          onRowClick
                            ? (e) => {
                                // Leave the row's own links/buttons/checkbox/menu to
                                // their handlers; only a "blank" row click opens.
                                if (
                                  e.target instanceof HTMLElement &&
                                  e.target.closest(
                                    'a,button,input,[role="menuitem"],[role="checkbox"]',
                                  )
                                )
                                  return
                                onRowClick(row.original)
                              }
                            : undefined
                        }
                        className={cn(
                          'transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
                          onRowClick && 'cursor-pointer',
                        )}
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
                    ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <DataTablePagination table={table} />
    </div>
  )
}
