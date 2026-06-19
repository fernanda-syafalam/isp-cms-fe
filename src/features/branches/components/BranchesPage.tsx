import { getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Building2Icon, PlusIcon, UsersIcon, WalletIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { formatCurrency, formatNumber } from '@/lib/format'
import type { Branch } from '@/schemas/branch'

import { useBranches } from '../hooks/useBranches'
import { BranchFormDialog } from './BranchFormDialog'
import { BranchRowActions } from './BranchRowActions'

// Static column defs (no component state). Sortable keys (name/city/
// customerCount/mrr/status) match the backend sort whitelist.
const BASE_COLUMNS: ColumnDef<Branch>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cabang" />,
    meta: { title: 'Cabang' },
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        <span className="font-medium">{row.original.name}</span>
        {row.original.isHeadOffice ? <StatusBadge tone="info" label="Kantor pusat" /> : null}
      </span>
    ),
  },
  {
    accessorKey: 'city',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kota" />,
    meta: { title: 'Kota' },
  },
  {
    accessorKey: 'manager',
    header: 'Penanggung jawab',
    meta: { title: 'Penanggung jawab' },
  },
  {
    accessorKey: 'customerCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
    meta: { title: 'Pelanggan', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatNumber(row.original.customerCount)}</span>
    ),
  },
  {
    accessorKey: 'mrr',
    header: ({ column }) => <DataTableColumnHeader column={column} title="MRR" />,
    meta: { title: 'MRR', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.mrr)}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: 'Status' },
    cell: ({ row }) => (
      <StatusBadge
        tone={row.original.status === 'active' ? 'success' : 'neutral'}
        label={row.original.status === 'active' ? 'Aktif' : 'Nonaktif'}
      />
    ),
  },
]

const ACTIONS_COLUMN: ColumnDef<Branch> = {
  id: 'actions',
  meta: { title: 'Aksi', align: 'right' },
  enableHiding: false,
  cell: ({ row }) => <BranchRowActions branch={row.original} />,
}

const routeApi = getRouteApi('/_auth/branches')

export function BranchesPage() {
  const canManage = useCan('settings.manage')
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const table = useTableQuery({ pageSize: 20 })
  const [addOpen, setAddOpen] = useState(false)

  // Status is a URL filter; changing it rewinds to page 1.
  const setStatus = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
    table.resetPage()
  }

  const { data, isLoading, isError } = useBranches({
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0
  const summary = data?.summary
  const by = summary?.byStatus

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.branches },
    { value: 'active', label: 'Aktif', count: by?.active },
    { value: 'inactive', label: 'Nonaktif', count: by?.inactive },
  ]

  const columns = useMemo<ColumnDef<Branch>[]>(
    () => (canManage ? [...BASE_COLUMNS, ACTIONS_COLUMN] : BASE_COLUMNS),
    [canManage],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cabang"
        description="Cabang / POP operasional dan ringkasan per cabang."
        actions={
          canManage ? (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon className="size-4" />
              Cabang baru
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total cabang"
          value={summary?.branches ?? 0}
          icon={Building2Icon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Total pelanggan"
          value={summary?.customers ?? 0}
          format={formatNumber}
          icon={UsersIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Total MRR"
          value={summary?.mrr ?? 0}
          format={formatCurrency}
          icon={WalletIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <FilterTabs
        ariaLabel="Filter status cabang"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          table.search ? `Tidak ada cabang cocok dengan "${table.search}".` : 'Belum ada cabang.'
        }
        searchPlaceholder="Cari cabang / kota…"
        server={{
          pageIndex: table.pageIndex,
          pageSize: table.pageSize,
          rowCount: total,
          sorting: table.sorting,
          search: table.search,
          onPaginationChange: table.onPaginationChange,
          onSortingChange: table.onSortingChange,
          onSearchChange: table.onSearchChange,
        }}
      />

      {canManage ? <BranchFormDialog open={addOpen} onOpenChange={setAddOpen} /> : null}
    </div>
  )
}
