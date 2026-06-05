import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { downloadCsv } from '@/lib/csv'
import { formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { AppUser } from '@/schemas/user'

import { CreateUserDialog } from './CreateUserDialog'
import { UserRoleBadge } from './UserRoleBadge'
import { useUsersList } from '../hooks/useUsers'

const ROLE_OPTIONS = ['all', 'admin', 'staff', 'customer'] as const

const toCsvRow = (u: AppUser) => ({
  Nama: u.fullName,
  Email: u.email,
  Peran: statusLabel(u.role),
  Dibuat: formatDate(u.createdAt),
})

export function UsersListPage() {
  const [role, setRole] = useState('all')
  const { data, isLoading, isError } = useUsersList({ limit: 100 })

  const items = useMemo(
    () => (data?.items ?? []).filter((u) => role === 'all' || u.role === role),
    [data, role],
  )

  const columns = useMemo<ColumnDef<AppUser>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
        meta: { title: 'Nama' },
        cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        meta: { title: 'Email' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Peran" />,
        meta: { title: 'Peran' },
        cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Dibuat" />,
        meta: { title: 'Dibuat' },
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Staf" description="Akun staf dan admin internal." />
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada staf."
        searchPlaceholder="Cari staf…"
        toolbar={
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-8 w-40" aria-label="Filter peran">
              <SelectValue placeholder="Peran" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r === 'all' ? 'Semua peran' : statusLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!items.length}
              onClick={() => downloadCsv('staf', items.map(toCsvRow))}
            >
              <DownloadIcon className="size-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <CreateUserDialog />
          </>
        }
      />
    </div>
  )
}
