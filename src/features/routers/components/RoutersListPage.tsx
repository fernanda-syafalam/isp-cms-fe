import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Router, RouterStatus } from '@/schemas/router'

import { useRoutersList } from '../hooks/useRouters'

const STATUS_TONE: Record<RouterStatus, StatusTone> = {
  online: 'success',
  offline: 'danger',
}

export function RoutersListPage() {
  const { data, isLoading, isError } = useRoutersList()

  const columns = useMemo<ColumnDef<Router>[]>(
    () => [
      { accessorKey: 'name', header: 'Router' },
      {
        accessorKey: 'address',
        header: 'Alamat',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.address}</span>,
      },
      { accessorKey: 'model', header: 'Model' },
      {
        accessorKey: 'secretCount',
        header: 'Secret PPPoE',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatNumber(row.original.secretCount)}</span>
        ),
      },
      {
        accessorKey: 'lastSyncAt',
        header: 'Sinkron terakhir',
        cell: ({ row }) => formatDateTime(row.original.lastSyncAt),
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
        title="Router (Mikrotik)"
        description="RADIUS terpusat untuk banyak Mikrotik — satu aplikasi, banyak router."
      />
      <div className="rounded-lg border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada router."
        />
      </div>
    </div>
  )
}
