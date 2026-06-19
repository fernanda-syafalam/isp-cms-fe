import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { PlanFilter } from '@/api/plans'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatCurrency, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Plan, PlanStatus } from '@/schemas/plan'

import { CreatePlanDialog } from './CreatePlanDialog'
import { PlanRowActions } from './PlanRowActions'
import { useExportPlans, usePlansList } from '../hooks/usePlans'

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

// Static column defs (no component state): sortable keys (name/speedMbps/
// priceMonthly/status) match the backend sort whitelist. subscriberCount is
// derived from the customer base (no backing column server-side), so it is not
// a sortable column.
const COLUMNS: ColumnDef<Plan>[] = [
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
      <span className="font-mono tabular-nums">{formatNumber(row.original.speedMbps)} Mbps</span>
    ),
  },
  {
    accessorKey: 'priceMonthly',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Harga / bulan" />,
    meta: { title: 'Harga / bulan', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.priceMonthly)}</span>
    ),
  },
  {
    accessorKey: 'subscriberCount',
    header: 'Pelanggan',
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
]

export function PlansListPage() {
  const canManage = useCan('plans.manage')
  const table = useTableQuery({ pageSize: 20 })
  const exportPlans = useExportPlans()
  const [isExporting, setIsExporting] = useState(false)

  // Search/sort/paging come entirely from the table (no equality filter here).
  const baseFilter: PlanFilter = {
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError, refetch } = usePlansList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportPlans(baseFilter)
      downloadCsv('paket', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Paket Layanan" description="Paket internet untuk pelanggan." />
      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyMessage="Belum ada paket."
        searchPlaceholder="Cari paket…"
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
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!total || isExporting}
              onClick={handleExport}
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
