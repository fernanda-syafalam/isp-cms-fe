import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useMemo } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csv'
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Router, RouterStatus } from '@/schemas/router'

import { useRoutersList } from '../hooks/useRouters'

const STATUS_TONE: Record<RouterStatus, StatusTone> = {
  online: 'success',
  offline: 'danger',
}

const toCsvRow = (r: Router) => ({
  Router: r.name,
  Alamat: r.address,
  Model: r.model,
  'Secret PPPoE': r.secretCount,
  'Sinkron terakhir': formatDateTime(r.lastSyncAt),
  Status: statusLabel(r.status),
})

export function RoutersListPage() {
  const { data, isLoading, isError } = useRoutersList()

  const columns = useMemo<ColumnDef<Router>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Router" />,
        meta: { title: 'Router' },
        cell: ({ row }) => (
          <Link
            to="/network/routers/$routerId"
            params={{ routerId: row.original.id }}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Alamat',
        meta: { title: 'Alamat' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.address}</span>,
      },
      { accessorKey: 'model', header: 'Model', meta: { title: 'Model' } },
      {
        accessorKey: 'secretCount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Secret PPPoE" />,
        meta: { title: 'Secret PPPoE', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatNumber(row.original.secretCount)}</span>
        ),
      },
      {
        accessorKey: 'lastSyncAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sinkron terakhir" />,
        meta: { title: 'Sinkron terakhir' },
        cell: ({ row }) => formatDateTime(row.original.lastSyncAt),
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
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Router (Mikrotik)"
        description="RADIUS terpusat untuk banyak Mikrotik — satu aplikasi, banyak router."
      />
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada router."
        searchPlaceholder="Cari router…"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!data?.items.length}
            onClick={() => downloadCsv('router', (data?.items ?? []).map(toCsvRow))}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        }
      />
    </div>
  )
}
