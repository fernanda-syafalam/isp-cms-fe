import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useMemo } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csv'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Reseller, ResellerStatus } from '@/schemas/reseller'

import { useResellersList } from '../hooks/useResellers'
import { ResellerRowActions } from './ResellerRowActions'

const STATUS_TONE: Record<ResellerStatus, StatusTone> = {
  active: 'success',
  inactive: 'neutral',
}

const toCsvRow = (r: Reseller) => ({
  Reseller: r.name,
  Area: r.area,
  Pelanggan: r.customerCount,
  Komisi: formatPercent(r.commissionPct),
  Saldo: formatCurrency(r.balance),
  Status: statusLabel(r.status),
})

export function ResellersListPage() {
  const { data, isLoading, isError } = useResellersList()

  const columns = useMemo<ColumnDef<Reseller>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reseller" />,
        meta: { title: 'Reseller' },
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      { accessorKey: 'area', header: 'Area', meta: { title: 'Area' } },
      {
        accessorKey: 'customerCount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
        meta: { title: 'Pelanggan', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatNumber(row.original.customerCount)}</span>
        ),
      },
      {
        accessorKey: 'commissionPct',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Komisi" />,
        meta: { title: 'Komisi', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {formatPercent(row.original.commissionPct)}
          </span>
        ),
      },
      {
        accessorKey: 'balance',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo" />,
        meta: { title: 'Saldo', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatCurrency(row.original.balance)}</span>
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
        cell: ({ row }) => <ResellerRowActions reseller={row.original} />,
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Reseller" description="Mitra loket/agen dan saldo komisinya." />
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada reseller."
        searchPlaceholder="Cari reseller…"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!data?.items.length}
            onClick={() => downloadCsv('reseller', (data?.items ?? []).map(toCsvRow))}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        }
      />
    </div>
  )
}
