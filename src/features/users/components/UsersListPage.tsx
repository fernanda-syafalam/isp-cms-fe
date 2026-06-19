import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon, ShieldCheckIcon, UserCogIcon, UserIcon, UsersIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { downloadCsv } from '@/lib/csv'
import { formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { AppUser } from '@/schemas/user'

import { CreateUserDialog } from './CreateUserDialog'
import { UserRoleBadge } from './UserRoleBadge'
import { UserRowActions } from './UserRowActions'
import { useUsersList } from '../hooks/useUsers'

const toCsvRow = (u: AppUser) => ({
  Nama: u.fullName,
  Email: u.email,
  Peran: statusLabel(u.role),
  Dibuat: formatDate(u.createdAt),
})

export function UsersListPage() {
  const [role, setRole] = useState('all')
  const canManage = useCan('staff.manage')
  // Staff is a small set (real /v1/users); we load it whole and filter by role
  // in-memory, so the KPI cards + role tabs are full-set counts.
  const { data, isLoading, isError } = useUsersList({ limit: 100 })

  const allUsers = data?.items ?? []
  const items = useMemo(
    () => allUsers.filter((u) => role === 'all' || u.role === role),
    [allUsers, role],
  )
  const countByRole = (r: string) => allUsers.filter((u) => u.role === r).length

  const roleTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: data ? allUsers.length : undefined },
    {
      value: 'admin',
      label: statusLabel('admin'),
      count: data ? countByRole('admin') : undefined,
    },
    {
      value: 'staff',
      label: statusLabel('staff'),
      count: data ? countByRole('staff') : undefined,
    },
    {
      value: 'customer',
      label: statusLabel('customer'),
      count: data ? countByRole('customer') : undefined,
    },
  ]

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
      ...(canManage
        ? [
            {
              id: 'actions',
              meta: { title: 'Aksi' },
              cell: ({ row }) => (
                <div className="text-right">
                  <UserRowActions user={row.original} />
                </div>
              ),
            } satisfies ColumnDef<AppUser>,
          ]
        : []),
    ],
    [canManage],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staf"
        description="Akun staf dan admin internal."
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
              <span className="hidden sm:inline">Ekspor</span>
            </Button>
            {canManage ? <CreateUserDialog /> : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total staf"
          value={allUsers.length}
          hint="akun internal"
          icon={UsersIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label={statusLabel('admin')}
          value={countByRole('admin')}
          icon={ShieldCheckIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label={statusLabel('staff')}
          value={countByRole('staff')}
          icon={UserCogIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label={statusLabel('customer')}
          value={countByRole('customer')}
          icon={UserIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <FilterTabs ariaLabel="Filter peran" value={role} onValueChange={setRole} items={roleTabs} />

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada staf."
        searchPlaceholder="Cari staf…"
      />
    </div>
  )
}
