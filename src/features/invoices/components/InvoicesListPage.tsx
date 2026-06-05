import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { ReceiptTextIcon, TriangleAlertIcon, WalletIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Invoice, InvoiceStatus } from '@/schemas/invoice'

import { useInvoicesList } from '../hooks/useInvoices'

const STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  draft: 'neutral',
}

const STATUS_OPTIONS = ['all', 'paid', 'pending', 'overdue', 'draft'] as const

const invoiceTotal = (inv: Invoice) => inv.amount + inv.lateFee

export function InvoicesListPage() {
  const [status, setStatus] = useState('all')
  // Unfiltered set powers the AR summary so it stays correct under any filter.
  const all = useInvoicesList()
  const { data, isLoading, isError } = useInvoicesList({
    status: status === 'all' ? undefined : status,
  })

  const ar = useMemo(() => {
    const items = all.data?.items ?? []
    const unpaid = items.filter((i) => i.status === 'pending' || i.status === 'overdue')
    const overdue = items.filter((i) => i.status === 'overdue')
    return {
      outstanding: unpaid.reduce((sum, i) => sum + invoiceTotal(i), 0),
      overdue: overdue.reduce((sum, i) => sum + invoiceTotal(i), 0),
      unpaidCount: unpaid.length,
    }
  }, [all.data])

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: 'invoiceNo',
        header: 'No. Tagihan',
        cell: ({ row }) => (
          <Link
            to="/invoices/$invoiceId"
            params={{ invoiceId: row.original.id }}
            className="font-medium font-mono text-sm hover:underline"
          >
            {row.original.invoiceNo}
          </Link>
        ),
      },
      { accessorKey: 'customerName', header: 'Pelanggan' },
      {
        accessorKey: 'amount',
        header: 'Jumlah',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {formatCurrency(invoiceTotal(row.original))}
          </span>
        ),
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
      <PageHeader title="Tagihan" description="Penagihan bulanan & piutang (AR)." />

      <div className="grid gap-4 sm:grid-cols-3">
        {all.isLoading || !all.data ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        ) : (
          <>
            <KpiCard
              label="Total piutang (AR)"
              value={ar.outstanding}
              format={formatCurrency}
              hint={`${formatNumber(ar.unpaidCount)} tagihan belum bayar`}
              accent="amber"
              icon={WalletIcon}
            />
            <KpiCard
              label="Terlambat"
              value={ar.overdue}
              format={formatCurrency}
              hint="jatuh tempo terlewat"
              hintTone="negative"
              icon={TriangleAlertIcon}
            />
            <KpiCard
              label="Total tagihan"
              value={all.data.total}
              hint="periode berjalan"
              icon={ReceiptTextIcon}
            />
          </>
        )}
      </div>

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
