import type { ColumnDef } from '@tanstack/react-table'
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
      { accessorKey: 'name', header: 'Plan' },
      {
        accessorKey: 'speedMbps',
        header: 'Speed',
        cell: ({ row }) => `${formatNumber(row.original.speedMbps)} Mbps`,
      },
      {
        accessorKey: 'priceMonthly',
        header: 'Price / month',
        cell: ({ row }) => formatCurrency(row.original.priceMonthly),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge tone={STATUS_TONE[row.original.status]} label={row.original.status} />
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Plans"
        description="Internet packages offered to subscribers."
        actions={<CreatePlanDialog />}
      />
      <div className="rounded-lg border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No plans yet."
        />
      </div>
    </div>
  )
}
