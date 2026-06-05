import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, WalletIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Invoice, InvoiceStatus } from '@/schemas/invoice'
import { PaymentMethodSchema } from '@/schemas/payment'

import { useInvoice, usePayInvoice } from '../hooks/useInvoices'

const STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  draft: 'neutral',
}

type Props = {
  invoiceId: string
}

export function InvoiceDetailPage({ invoiceId }: Props) {
  const { data: invoice, isLoading, isError } = useInvoice(invoiceId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-destructive" role="alert">
          Tagihan tidak ditemukan.
        </p>
      </div>
    )
  }

  const total = invoice.amount + invoice.lateFee
  const fields: Array<{ label: string; value: string }> = [
    { label: 'Pelanggan', value: invoice.customerName },
    {
      label: 'Periode',
      value: `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`,
    },
    { label: 'Jatuh tempo', value: formatDate(invoice.dueDate) },
    {
      label: 'Dibayar pada',
      value: invoice.paidAt ? formatDateTime(invoice.paidAt) : '—',
    },
  ]

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={invoice.invoiceNo}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={STATUS_TONE[invoice.status]} label={statusLabel(invoice.status)} />
            {invoice.status !== 'paid' ? <PayMenu invoice={invoice} /> : null}
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail tagihan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-muted-foreground text-xs">{f.label}</dt>
                <dd className="mt-0.5 text-sm">{f.value}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-2 border-border border-t pt-4 text-sm">
            <Row label="Subtotal" value={formatCurrency(invoice.amount)} />
            {invoice.lateFee > 0 ? (
              <Row label="Denda keterlambatan" value={formatCurrency(invoice.lateFee)} danger />
            ) : null}
            <div className="flex items-center justify-between pt-2">
              <span className="text-muted-foreground">Total tagihan</span>
              <span className="font-bold font-mono text-2xl tabular-nums tracking-tight">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono tabular-nums ${danger ? 'text-red-600 dark:text-red-400' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function PayMenu({ invoice }: { invoice: Invoice }) {
  const pay = usePayInvoice(invoice.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={pay.isPending}>
          <WalletIcon className="size-4" />
          Catat pembayaran
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Metode</DropdownMenuLabel>
        {PaymentMethodSchema.options.map((method) => (
          <DropdownMenuItem key={method} onSelect={() => pay.mutate({ method })}>
            {statusLabel(method)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link to="/invoices">
        <ArrowLeftIcon className="size-4" />
        Kembali ke tagihan
      </Link>
    </Button>
  )
}
