import { Link } from '@tanstack/react-router'
import { statusLabel } from '@/lib/status-label'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Invoice, InvoiceStatus } from '@/schemas/invoice'

import { useInvoicesList } from '../hooks/useInvoices'

const STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  draft: 'neutral',
}

const STATUS_OPTIONS = ['all', 'paid', 'pending', 'overdue', 'draft'] as const

export function InvoicesListPage() {
  const [status, setStatus] = useState('all')
  const { data, isLoading, isError } = useInvoicesList({
    status: status === 'all' ? undefined : status,
  })

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: 'invoiceNo',
        header: 'No. Tagihan',
        cell: ({ row }) => (
          <Link
            to="/invoices/$invoiceId"
            params={{ invoiceId: row.original.id }}
            className="font-medium hover:underline"
          >
            {row.original.invoiceNo}
          </Link>
        ),
      },
      { accessorKey: 'customerName', header: 'Pelanggan' },
      {
        accessorKey: 'amount',
        header: 'Jumlah',
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: 'dueDate',
        header: 'Jatuh tempo',
        cell: ({ row }) => formatDate(row.original.dueDate),
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
      <PageHeader title="Tagihan" description="Penagihan bulanan pelanggan." />
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44" aria-label="Filter status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'Semua status' : statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada tagihan."
        />
      </div>
    </div>
  )
}
