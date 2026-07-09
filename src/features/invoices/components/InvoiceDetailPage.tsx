import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react'

import { CopyButton } from '@/components/shared/copy-button'
import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { invoiceStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'

import { useInvoice } from '../hooks/useInvoices'
import { InvoiceBreakdownLines } from './InvoiceBreakdownLines'
import { OnlinePayButton, PayMenu, RemindButton } from './InvoicePageActions'
import { InvoiceTypeBadge } from './InvoiceTypeBadge'

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
            <InvoiceTypeBadge type={invoice.type} />
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
          {invoice.note ? (
            <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3">
              <p className="font-medium text-muted-foreground text-xs">Catatan penyesuaian</p>
              <p className="mt-1 text-sm">{invoice.note}</p>
            </div>
          ) : null}
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
          <InvoiceBreakdownLines invoice={invoice} emphasizeBalanceDue />
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
