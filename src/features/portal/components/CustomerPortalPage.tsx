import { PackageIcon, WalletIcon, WifiIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { Payment } from '@/schemas/payment'

import { usePortalMe } from '../hooks/usePortal'
import { AnnouncementsBanner } from './AnnouncementsBanner'
import { IsolirWalledGarden } from './IsolirWalledGarden'
import { PayNowCard, PortalInvoiceRow } from './PortalInvoiceList'
import { PortalTicketsCard } from './PortalTicketsCard'
import { ReportIssueDialog } from './ReportIssueDialog'
import { UsageQuotaCard } from './UsageQuotaCard'
import { WifiSettingsCard } from './WifiSettingsCard'

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

  const { customer, invoices, payments, tickets, pendingIntents } = data
  const unpaid = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue')
  const outstanding = unpaid.reduce((sum, i) => sum + invoiceTotal(i), 0)
  // Oldest unpaid invoice → the one to settle first (drives the prominent CTA).
  const oldestUnpaid = [...unpaid].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  // Resume affordance: index the still-pending intents by the invoice they charge.
  const intentByInvoice = new Map(pendingIntents.map((pi) => [pi.invoiceId, pi]))

  // Isolir subscribers get a focused full-screen "walled garden" instead of the
  // normal dashboard chrome (P3.C.1) — punitive overdue isolation vs a voluntary
  // (cuti) pause is decided inside by customer.holdReason.
  if (customer.status === 'isolir') {
    return (
      <IsolirWalledGarden
        customer={customer}
        invoices={invoices}
        outstanding={outstanding}
        oldestUnpaid={oldestUnpaid}
        intentByInvoice={intentByInvoice}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Halo, ${customer.fullName}`}
        description={`${customer.customerNo} · ${customer.planName}`}
        actions={<ReportIssueDialog />}
      />

      <AnnouncementsBanner />

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
        <PayNowCard
          invoice={oldestUnpaid}
          outstanding={outstanding}
          count={unpaid.length}
          pendingIntent={intentByInvoice.get(oldestUnpaid.id)}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <UsageQuotaCard />
        <WifiSettingsCard />
      </div>

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
                <PortalInvoiceRow
                  key={inv.id}
                  invoice={inv}
                  pendingIntent={intentByInvoice.get(inv.id)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PortalTicketsCard tickets={tickets} />

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
