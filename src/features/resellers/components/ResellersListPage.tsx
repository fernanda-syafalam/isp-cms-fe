import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Reseller, ResellerStatus } from '@/schemas/reseller'

import { useResellersList } from '../hooks/useResellers'

const STATUS_TONE: Record<ResellerStatus, StatusTone> = {
  active: 'success',
  inactive: 'neutral',
}

export function ResellersListPage() {
  const { data, isLoading, isError } = useResellersList()

  const columns = useMemo<ColumnDef<Reseller>[]>(
    () => [
      { accessorKey: 'name', header: 'Reseller' },
      { accessorKey: 'area', header: 'Area' },
      {
        accessorKey: 'customerCount',
        header: 'Pelanggan',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatNumber(row.original.customerCount)}</span>
        ),
      },
      {
        accessorKey: 'commissionPct',
        header: 'Komisi',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {formatPercent(row.original.commissionPct)}
          </span>
        ),
      },
      {
        accessorKey: 'balance',
        header: 'Saldo',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatCurrency(row.original.balance)}</span>
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
      <PageHeader title="Reseller" description="Mitra loket/agen dan saldo komisinya." />
      <div className="rounded-lg border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada reseller."
        />
      </div>
    </div>
  )
}
