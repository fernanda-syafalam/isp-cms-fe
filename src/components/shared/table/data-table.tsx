import {
  type ColumnDef,
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

import { DataTableCardList } from './DataTableCardList'
import { DataTableGrid } from './DataTableGrid'
import { DataTablePagination } from './data-table-pagination'
// data-table-shared also carries the @tanstack/react-table ColumnMeta augmentation.
import './data-table-shared'
import { DataTableViewOptions } from './data-table-view-options'

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
              aria-label={searchPlaceholder}
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
          <DataTableCardList rows={rows} isLoading={isLoading} />
          <DataTableGrid
            table={table}
            rows={rows}
            isLoading={isLoading}
            {...(onRowClick ? { onRowClick } : {})}
          />
        </>
      )}

      <DataTablePagination table={table} />
    </div>
  )
}
