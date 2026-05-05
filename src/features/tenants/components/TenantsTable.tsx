import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, MoreHorizontalIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Tenant } from '@/schemas/tenant'
import type { TenantId } from '@/types/ids'

import { TenantStatusBadge } from './TenantStatusBadge'

type Props = {
  tenants: Tenant[] | undefined
  total: number
  isLoading: boolean
  isError: boolean
  pageIndex: number
  pageSize: number
  onPageChange: (nextPageIndex: number) => void
  onSuspend: (id: TenantId) => void
}

// Sort lives in the table component because it is purely a visual concern over
// the current page. For cross-page sort, lift this state up and pass sortBy /
// sortDir to useTenantsList — the schema already supports it.
export function TenantsTable({
  tenants,
  total,
  isLoading,
  isError,
  pageIndex,
  pageSize,
  onPageChange,
  onSuspend,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Tenant>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <SortableHeader
            label="Name"
            sort={column.getIsSorted()}
            onClick={() => column.toggleSorting()}
          />
        ),
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <SortableHeader
            label="Email"
            sort={column.getIsSorted()}
            onClick={() => column.toggleSorting()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <SortableHeader
            label="Status"
            sort={column.getIsSorted()}
            onClick={() => column.toggleSorting()}
          />
        ),
        cell: ({ row }) => <TenantStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Tenant actions">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                disabled={row.original.status === 'suspended'}
                onSelect={() => onSuspend(row.original.id)}
              >
                Suspend
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
      },
    ],
    [onSuspend],
  )

  const table = useReactTable<Tenant>({
    data: tenants ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Pagination is server-side, so we just declare the page count.
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  })

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const showingFrom = total === 0 ? 0 : pageIndex * pageSize + 1
  const showingTo = Math.min((pageIndex + 1) * pageSize, total)

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id} className={header.column.id === 'actions' ? 'w-12' : ''}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? <LoadingRows /> : null}
          {isError ? <ErrorRow /> : null}
          {!isLoading && !isError && table.getRowModel().rows.length === 0 ? <EmptyRow /> : null}
          {!isLoading && !isError && table.getRowModel().rows.length > 0
            ? table.getRowModel().rows.map((row) => (
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

      <div className="flex flex-col items-center justify-between gap-2 text-sm sm:flex-row">
        <span className="text-muted-foreground">
          {total === 0 ? 'No tenants' : `Showing ${showingFrom}–${showingTo} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0 || isLoading}
          >
            Previous
          </Button>
          <span className="text-muted-foreground">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(pageCount - 1, pageIndex + 1))}
            disabled={pageIndex >= pageCount - 1 || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

type SortIndicator = false | 'asc' | 'desc'

function SortableHeader({
  label,
  sort,
  onClick,
}: {
  label: string
  sort: SortIndicator
  onClick: () => void
}) {
  const Icon = sort === 'asc' ? ArrowUpIcon : sort === 'desc' ? ArrowDownIcon : ArrowUpDownIcon
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 gap-1 px-2"
      onClick={onClick}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <Icon className="size-3 opacity-60" />
    </Button>
  )
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function ErrorRow() {
  return (
    <TableRow>
      <TableCell colSpan={4} className="text-center text-destructive" role="alert">
        Failed to load tenants. Try refreshing the page.
      </TableCell>
    </TableRow>
  )
}

function EmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={4} className="text-center text-muted-foreground">
        No tenants match these filters.
      </TableCell>
    </TableRow>
  )
}
