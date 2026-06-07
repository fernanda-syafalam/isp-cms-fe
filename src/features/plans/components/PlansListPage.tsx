import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useMemo } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { downloadCsv } from '@/lib/csv'
import { formatCurrency, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Plan, PlanStatus } from '@/schemas/plan'

import { CreatePlanDialog } from './CreatePlanDialog'
import { PlanRowActions } from './PlanRowActions'
import { usePlansList } from '../hooks/usePlans'

const STATUS_TONE: Record<PlanStatus, StatusTone> = {
  active: 'success',
  archived: 'neutral',
}

const toCsvRow = (p: Plan) => ({
  Paket: p.name,
  Kecepatan: `${p.speedMbps} Mbps`,
  Harga: formatCurrency(p.priceMonthly),
  Status: statusLabel(p.status),
})

export function PlansListPage() {
  const { data, isLoading, isError } = usePlansList()
  const canManage = useCan('plans.manage')

  const columns = useMemo<ColumnDef<Plan>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Paket" />,
        meta: { title: 'Paket' },
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'speedMbps',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kecepatan" />,
        meta: { title: 'Kecepatan', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {formatNumber(row.original.speedMbps)} Mbps
          </span>
        ),
      },
      {
        accessorKey: 'priceMonthly',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga / bulan" />,
        meta: { title: 'Harga / bulan', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {formatCurrency(row.original.priceMonthly)}
          </span>
        ),
      },
      {
        accessorKey: 'subscriberCount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
        meta: { title: 'Pelanggan', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {formatNumber(row.original.subscriberCount ?? 0)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <StatusBadge
            tone={STATUS_TONE[row.original.status]}
            label={statusLabel(row.original.status)}
          />
        ),
      },
      {
        id: 'actions',
        meta: { align: 'right' },
        enableHiding: false,
        cell: ({ row }) => <PlanRowActions plan={row.original} />,
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Paket Layanan" description="Paket internet untuk pelanggan." />
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada paket."
        searchPlaceholder="Cari paket…"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!data?.items.length}
              onClick={() => downloadCsv('paket', (data?.items ?? []).map(toCsvRow))}
            >
              <DownloadIcon className="size-4" />
              <span className="hidden sm:inline">Ekspor</span>
            </Button>
            {canManage ? <CreatePlanDialog /> : null}
          </>
        }
      />
    </div>
  )
}
