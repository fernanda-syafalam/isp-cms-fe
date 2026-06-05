import type { ColumnDef } from '@tanstack/react-table'
import { statusLabel } from '@/lib/status-label'
import { useMemo } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { formatCurrency, formatNumber } from '@/lib/format'
import type { Plan, PlanStatus } from '@/schemas/plan'

import { CreatePlanDialog } from './CreatePlanDialog'
import { usePlansList } from '../hooks/usePlans'

const STATUS_TONE: Record<PlanStatus, StatusTone> = {
  active: 'success',
  archived: 'neutral',
}

export function PlansListPage() {
  const { data, isLoading, isError } = usePlansList()

  const columns = useMemo<ColumnDef<Plan>[]>(
    () => [
      { accessorKey: 'name', header: 'Paket' },
      {
        accessorKey: 'speedMbps',
        header: 'Kecepatan',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {formatNumber(row.original.speedMbps)} Mbps
          </span>
        ),
      },
      {
        accessorKey: 'priceMonthly',
        header: 'Harga / bulan',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {formatCurrency(row.original.priceMonthly)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            tone={STATUS_TONE[row.original.status]}
            label={statusLabel(row.original.status)}
          />
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paket Layanan"
        description="Paket internet untuk pelanggan."
        actions={<CreatePlanDialog />}
      />
      <div className="rounded-lg border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada paket."
        />
      </div>
    </div>
  )
}
