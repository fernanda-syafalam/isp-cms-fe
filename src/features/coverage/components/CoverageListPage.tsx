import type { ColumnDef } from '@tanstack/react-table'
import { statusLabel } from '@/lib/status-label'
import { useMemo } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { formatNumber, formatPercent } from '@/lib/format'
import type { Coverage, CoverageStatus } from '@/schemas/coverage'

import { useCoverageList } from '../hooks/useCoverage'

const STATUS_TONE: Record<CoverageStatus, StatusTone> = {
  operational: 'success',
  maintenance: 'warning',
  down: 'danger',
}

export function CoverageListPage() {
  const { data, isLoading, isError } = useCoverageList()

  const columns = useMemo<ColumnDef<Coverage>[]>(
    () => [
      { accessorKey: 'name', header: 'Nama' },
      {
        accessorKey: 'type',
        header: 'Tipe',
        cell: ({ row }) => <span className="uppercase">{row.original.type}</span>,
      },
      { accessorKey: 'region', header: 'Wilayah' },
      {
        id: 'utilisation',
        header: 'Utilisasi',
        cell: ({ row }) => {
          const { activeConnections, capacity } = row.original
          const ratio = capacity > 0 ? activeConnections / capacity : 0
          return `${formatNumber(activeConnections)} / ${formatNumber(capacity)} (${formatPercent(ratio)})`
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge tone={STATUS_TONE[row.original.status]} label={statusLabel(row.original.status)} />
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Cakupan & POP" description="Area cakupan dan titik POP." />
      <div className="rounded-lg border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada area cakupan."
        />
      </div>
    </div>
  )
}
