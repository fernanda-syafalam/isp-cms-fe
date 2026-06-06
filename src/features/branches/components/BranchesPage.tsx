import type { ColumnDef } from '@tanstack/react-table'
import { Building2Icon, PlusIcon, UsersIcon, WalletIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { formatCurrency, formatNumber } from '@/lib/format'
import type { Branch } from '@/schemas/branch'

import { useBranches } from '../hooks/useBranches'
import { BranchFormDialog } from './BranchFormDialog'

export function BranchesPage() {
  const { data, isLoading, isError } = useBranches()
  const canManage = useCan('settings.manage')
  const [addOpen, setAddOpen] = useState(false)

  const summary = useMemo(() => {
    const items = data?.items ?? []
    return {
      branches: items.length,
      customers: items.reduce((s, b) => s + b.customerCount, 0),
      mrr: items.reduce((s, b) => s + b.mrr, 0),
    }
  }, [data])

  const columns = useMemo<ColumnDef<Branch>[]>(
    () => [
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
      { accessorKey: 'city', header: 'Kota', meta: { title: 'Kota' } },
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
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <StatusBadge
            tone={row.original.status === 'active' ? 'success' : 'neutral'}
            label={row.original.status === 'active' ? 'Aktif' : 'Nonaktif'}
          />
        ),
      },
    ],
    [],
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
        <KpiCard label="Total cabang" value={summary.branches} icon={Building2Icon} />
        <KpiCard
          label="Total pelanggan"
          value={summary.customers}
          format={formatNumber}
          icon={UsersIcon}
        />
        <KpiCard label="Total MRR" value={summary.mrr} format={formatCurrency} icon={WalletIcon} />
      </div>

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada cabang."
        searchPlaceholder="Cari cabang / kota…"
      />

      {canManage ? <BranchFormDialog open={addOpen} onOpenChange={setAddOpen} /> : null}
    </div>
  )
}
