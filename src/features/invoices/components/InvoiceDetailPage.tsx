import { Link } from '@tanstack/react-router'
import { statusLabel } from '@/lib/status-label'
import { ArrowLeftIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import type { InvoiceStatus } from '@/schemas/invoice'

import { useInvoice } from '../hooks/useInvoices'

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
          <StatusBadge tone={STATUS_TONE[invoice.status]} label={statusLabel(invoice.status)} />
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
          <div className="flex items-center justify-between border-border border-t pt-4">
            <span className="text-muted-foreground text-sm">Jumlah tagihan</span>
            <span className="font-bold text-2xl tracking-tight">
              {formatCurrency(invoice.amount)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
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
