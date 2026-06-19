import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, BellRingIcon, CreditCardIcon, PrinterIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'

import { CopyButton } from '@/components/shared/copy-button'
import { ErrorState } from '@/components/shared/error-state'
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
import { useCan } from '@/features/auth'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { Invoice, InvoiceStatus } from '@/schemas/invoice'
import { PaymentMethodSchema } from '@/schemas/payment'

import { useRemindOverdue } from '../hooks/useBilling'
import { useInvoice, usePayInvoice } from '../hooks/useInvoices'
import { CheckoutDialog } from './CheckoutDialog'

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
  const { data: invoice, isLoading, isError, refetch } = useInvoice(invoiceId)

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
        <ErrorState title="Tagihan tidak ditemukan." onRetry={() => refetch()} />
      </div>
    )
  }

  const total = invoiceTotal(invoice)
  const fields: Array<{ label: string; value: string; copy?: boolean }> = [
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
    {
      label: 'Terakhir diingatkan',
      value: invoice.lastRemindedAt ? formatDateTime(invoice.lastRemindedAt) : 'Belum',
    },
    {
      label: 'No. Faktur Pajak',
      value: invoice.taxInvoiceNo ?? '—',
      copy: true,
    },
  ]

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={invoice.invoiceNo}
        actions={
          <div className="flex items-center gap-2">
            <CopyButton value={invoice.invoiceNo} label="No. tagihan disalin" />
            <StatusBadge tone={STATUS_TONE[invoice.status]} label={statusLabel(invoice.status)} />
            <Button asChild variant="outline" size="sm">
              <Link to="/invoices/print/$invoiceId" params={{ invoiceId: invoice.id }}>
                <PrinterIcon className="size-4" />
                {invoice.status === 'paid' ? 'Kwitansi' : 'Cetak / PDF'}
              </Link>
            </Button>
            {invoice.status !== 'paid' ? <RemindButton invoice={invoice} /> : null}
            {invoice.status !== 'paid' ? <OnlinePayButton invoice={invoice} /> : null}
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
                <dd className="mt-0.5 flex items-center gap-1 text-sm">
                  {f.value}
                  {f.copy && f.value !== '—' ? (
                    <CopyButton value={f.value} label={`${f.label} disalin`} />
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
          <div className="space-y-2 border-border border-t pt-4 text-sm">
            <Row label="DPP (langganan)" value={formatCurrency(invoice.amount)} />
            {invoice.lateFee > 0 ? (
              <Row label="Denda keterlambatan" value={formatCurrency(invoice.lateFee)} danger />
            ) : null}
            {invoice.taxAmount > 0 ? (
              <Row label="PPN" value={formatCurrency(invoice.taxAmount)} />
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

function RemindButton({ invoice }: { invoice: Invoice }) {
  const canRemind = useCan('billing.run')
  const remind = useRemindOverdue()
  if (!canRemind) return null
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={remind.isPending}
      onClick={() => remind.mutate([invoice.id])}
    >
      <BellRingIcon className="size-4" />
      Kirim pengingat
    </Button>
  )
}

function OnlinePayButton({ invoice }: { invoice: Invoice }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CreditCardIcon className="size-4" />
        Bayar online
      </Button>
      <CheckoutDialog invoice={invoice} open={open} onOpenChange={setOpen} />
    </>
  )
}

function PayMenu({ invoice }: { invoice: Invoice }) {
  const pay = usePayInvoice(invoice.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pay.isPending}>
          <WalletIcon className="size-4" />
          Catat manual
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
