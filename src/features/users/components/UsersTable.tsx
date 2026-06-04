import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AppUser } from '@/schemas/user'

import { UserRoleBadge } from './UserRoleBadge'

type Props = {
  users: AppUser[] | undefined
  isLoading: boolean
  isError: boolean
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

// Sort is a purely visual concern over the current page (cursor pagination
// fetches one page at a time). For cross-page sort, lift it and pass sort
// params to listUsers — the backend would need to support it.
export function UsersTable({
  users,
  isLoading,
  isError,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<AppUser>[]>(
    () => [
      {
        accessorKey: 'fullName',
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
        accessorKey: 'role',
        header: ({ column }) => (
          <SortableHeader
            label="Role"
            sort={column.getIsSorted()}
            onClick={() => column.toggleSorting()}
          />
        ),
        cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
      },
    ],
    [],
  )

  const table = useReactTable<AppUser>({
    data: users ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  })

  const rows = table.getRowModel().rows

  return (
    <div className="space-y-3">
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
          {isLoading ? <LoadingRows /> : null}
          {isError ? <ErrorRow /> : null}
          {!isLoading && !isError && rows.length === 0 ? <EmptyRow /> : null}
          {!isLoading && !isError && rows.length > 0
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

      <div className="flex items-center justify-end gap-2 text-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious || isLoading}
        >
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext || isLoading}>
          Next
        </Button>
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

const SKELETON_ROW_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const

function LoadingRows() {
  return (
    <>
      {SKELETON_ROW_KEYS.map((key) => (
        <TableRow key={key}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function ErrorRow() {
  return (
    <TableRow>
      <TableCell colSpan={3} className="text-center text-destructive" role="alert">
        Failed to load users. Try refreshing the page.
      </TableCell>
    </TableRow>
  )
}

function EmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={3} className="text-center text-muted-foreground">
        No users yet.
      </TableCell>
    </TableRow>
  )
}
