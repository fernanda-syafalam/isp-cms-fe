import { CreditCardIcon, PackageIcon, WalletIcon, WifiIcon } from 'lucide-react'
import { useState } from 'react'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckoutDialog } from '@/features/invoices'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { Invoice } from '@/schemas/invoice'
import type { Payment } from '@/schemas/payment'
import type { Ticket, TicketStatus } from '@/schemas/ticket'

import { usePortalMe } from '../hooks/usePortal'
import { ReportIssueDialog } from './ReportIssueDialog'

const TICKET_TONE: Record<TicketStatus, StatusTone> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  breached: 'danger',
}

export function CustomerPortalPage() {
  const { data, isLoading, isError } = usePortalMe()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <p className="text-destructive" role="alert">
        Gagal memuat data layanan Anda.
      </p>
    )
  }

  const { customer, invoices, payments, tickets } = data
  const unpaid = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue')
  const outstanding = unpaid.reduce((sum, i) => sum + invoiceTotal(i), 0)
  // Oldest unpaid invoice → the one to settle first (drives the prominent CTA).
  const oldestUnpaid = [...unpaid].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Halo, ${customer.fullName}`}
        description={`${customer.customerNo} · ${customer.planName}`}
        actions={<ReportIssueDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Status layanan"
          value={statusLabel(customer.status)}
          hint={customer.areaName ?? 'Tanpa area'}
          icon={WifiIcon}
        />
        <KpiCard
          label="Paket"
          value={customer.planName}
          hint="langganan aktif"
          icon={PackageIcon}
        />
        <KpiCard
          label="Tagihan belum bayar"
          value={outstanding}
          format={formatCurrency}
          hint={`${unpaid.length} tagihan`}
          accent="amber"
          icon={WalletIcon}
        />
      </div>

      {oldestUnpaid ? (
        <PayNowCard invoice={oldestUnpaid} outstanding={outstanding} count={unpaid.length} />
      ) : null}

      {customer.status === 'isolir' ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          Layanan Anda sedang diisolir karena tagihan belum dibayar. Selesaikan pembayaran untuk
          mengaktifkan kembali secara otomatis.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tagihan saya</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">Belum ada tagihan.</p>
          ) : (
            <ul className="divide-y divide-border">
              {invoices.map((inv) => (
                <PortalInvoiceRow key={inv.id} invoice={inv} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laporan saya</CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                Belum ada laporan gangguan.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {tickets.map((t: Ticket) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0 truncate text-sm">{t.subject}</span>
                    <StatusBadge tone={TICKET_TONE[t.status]} label={statusLabel(t.status)} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                Belum ada pembayaran.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {payments.map((p: Payment) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-mono text-sm">{p.invoiceNo}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(p.paidAt)} · {statusLabel(p.method)}
                      </p>
                    </div>
                    <span className="font-mono text-sm tabular-nums">
                      {formatCurrency(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Prominent "pay now" card — the primary action when there is a balance. Pays
// the oldest unpaid invoice via the shared checkout dialog.
function PayNowCard({
  invoice,
  outstanding,
  count,
}: {
  invoice: Invoice
  outstanding: number
  count: number
}) {
  const [payOpen, setPayOpen] = useState(false)
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div>
          <p className="text-muted-foreground text-sm">Total tagihan belum dibayar</p>
          <p className="font-bold font-mono text-2xl tabular-nums">{formatCurrency(outstanding)}</p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {count} tagihan · jatuh tempo paling awal {formatDate(invoice.dueDate)}
          </p>
        </div>
        <Button onClick={() => setPayOpen(true)}>
          <CreditCardIcon className="size-4" />
          Bayar sekarang
        </Button>
        <CheckoutDialog invoice={invoice} open={payOpen} onOpenChange={setPayOpen} />
      </CardContent>
    </Card>
  )
}

function PortalInvoiceRow({ invoice }: { invoice: Invoice }) {
  const [payOpen, setPayOpen] = useState(false)
  const unpaid = invoice.status === 'pending' || invoice.status === 'overdue'
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-mono font-medium text-sm">{invoice.invoiceNo}</p>
        <p className="text-muted-foreground text-xs">
          Jatuh tempo {formatDate(invoice.dueDate)} · {formatCurrency(invoiceTotal(invoice))}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge
          tone={
            invoice.status === 'paid'
              ? 'success'
              : invoice.status === 'overdue'
                ? 'danger'
                : 'warning'
          }
          label={statusLabel(invoice.status)}
        />
        {unpaid ? (
          <>
            <Button size="sm" onClick={() => setPayOpen(true)}>
              <CreditCardIcon className="size-4" />
              Bayar
            </Button>
            <CheckoutDialog invoice={invoice} open={payOpen} onOpenChange={setPayOpen} />
          </>
        ) : null}
      </div>
    </li>
  )
}
