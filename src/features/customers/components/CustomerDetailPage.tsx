import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, MessageCircleIcon, PlugZapIcon, PowerOffIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Connection, Customer, CustomerStatus } from '@/schemas/customer'
import type { Invoice, InvoiceStatus } from '@/schemas/invoice'
import type { Ticket, TicketStatus } from '@/schemas/ticket'

import {
  useActivateCustomer,
  useCustomer,
  useIsolateCustomer,
  useNotifyWhatsapp,
} from '../hooks/useCustomers'
import { useCustomerInvoices } from '../hooks/useCustomerInvoices'
import { useCustomerTickets } from '../hooks/useCustomerTickets'
import { CustomerRowActions } from './CustomerRowActions'
import { CustomerSummary } from './CustomerSummary'
import { OnuActions } from './OnuActions'

const STATUS_TONE: Record<CustomerStatus, StatusTone> = {
  prospek: 'neutral',
  instalasi: 'info',
  aktif: 'success',
  isolir: 'danger',
  berhenti: 'neutral',
}

const INVOICE_TONE: Record<InvoiceStatus, StatusTone> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  draft: 'neutral',
}

// GPON optical health: healthy ≳ −25 dBm, marginal −25…−27, bad < −27.
function rxTone(dbm: number | null): StatusTone {
  if (dbm == null) return 'neutral'
  if (dbm >= -25) return 'success'
  if (dbm >= -27) return 'warning'
  return 'danger'
}

type Props = {
  customerId: string
}

export function CustomerDetailPage({ customerId }: Props) {
  const { data: customer, isLoading, isError } = useCustomer(customerId)
  const { data: invoices } = useCustomerInvoices(customerId)
  const { data: tickets } = useCustomerTickets(customer?.fullName)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-destructive" role="alert">
          Pelanggan tidak ditemukan.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={customer.fullName}
        description={`${customer.customerNo} · ${customer.areaName}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={STATUS_TONE[customer.status]} label={statusLabel(customer.status)} />
            <WhatsappButton customerId={customer.id} />
            <CustomerActions customer={customer} />
            <CustomerRowActions customer={customer} />
          </div>
        }
      />

      <CustomerSummary customer={customer} />

      <Tabs defaultValue="ringkasan">
        <TabsList>
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="koneksi">Koneksi</TabsTrigger>
          <TabsTrigger value="tagihan">Tagihan</TabsTrigger>
          <TabsTrigger value="tiket">Tiket</TabsTrigger>
        </TabsList>
        <TabsContent value="ringkasan">
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileCard customer={customer} />
            <SubscriptionCard customer={customer} />
          </div>
        </TabsContent>
        <TabsContent value="koneksi">
          <ConnectionCard customerId={customer.id} connection={customer.connection} />
        </TabsContent>
        <TabsContent value="tagihan">
          <InvoicesCard invoices={invoices} />
        </TabsContent>
        <TabsContent value="tiket">
          <TicketsCard tickets={tickets} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const TICKET_TONE: Record<TicketStatus, StatusTone> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  breached: 'danger',
}

function TicketsCard({ tickets }: { tickets: Ticket[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tiket terkait</CardTitle>
      </CardHeader>
      <CardContent>
        {!tickets ? (
          <Skeleton className="h-20 w-full" />
        ) : tickets.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">Belum ada tiket.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{ticket.subject}</p>
                  <p className="font-mono text-muted-foreground text-xs">{ticket.code}</p>
                </div>
                <StatusBadge tone={TICKET_TONE[ticket.status]} label={statusLabel(ticket.status)} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function CustomerActions({ customer }: { customer: Customer }) {
  const isolate = useIsolateCustomer()
  const activate = useActivateCustomer()
  const busy = isolate.isPending || activate.isPending

  if (customer.status === 'aktif') {
    return (
      <Button
        variant="destructive"
        size="sm"
        disabled={busy}
        onClick={() => isolate.mutate(customer.id)}
      >
        <PowerOffIcon className="size-4" />
        Isolir
      </Button>
    )
  }
  if (customer.status === 'isolir') {
    return (
      <Button size="sm" disabled={busy} onClick={() => activate.mutate(customer.id)}>
        <PlugZapIcon className="size-4" />
        Aktifkan
      </Button>
    )
  }
  return null
}

function WhatsappButton({ customerId }: { customerId: string }) {
  const notify = useNotifyWhatsapp(customerId)
  return (
    <Button variant="outline" size="sm" disabled={notify.isPending} onClick={() => notify.mutate()}>
      <MessageCircleIcon className="size-4" />
      Ingatkan (WA)
    </Button>
  )
}

function ProfileCard({ customer }: { customer: Customer }) {
  const fields: Array<{ label: string; value: string }> = [
    { label: 'Telepon', value: customer.phone },
    { label: 'Email', value: customer.email ?? '—' },
    { label: 'Alamat', value: customer.address },
    { label: 'Area', value: customer.areaName },
    { label: 'Reseller', value: customer.resellerName ?? '—' },
    { label: 'Bergabung', value: formatDate(customer.joinedAt) },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data pelanggan</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground text-xs">{f.label}</dt>
              <dd className="text-right text-sm">{f.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function SubscriptionCard({ customer }: { customer: Customer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Langganan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground text-xs">Paket</span>
          <span className="text-sm">{customer.planName}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-border border-t pt-3">
          <span className="text-muted-foreground text-xs">Piutang</span>
          <span
            className={`font-mono font-semibold text-sm tabular-nums ${
              customer.outstanding > 0 ? 'text-red-600 dark:text-red-400' : ''
            }`}
          >
            {formatCurrency(customer.outstanding)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ConnectionCard({
  customerId,
  connection,
}: {
  customerId: string
  connection: Connection | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Koneksi & Jaringan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipe" value={statusLabel(connection.type)} />
            <Field label="PPPoE" value={connection.pppoeUsername} mono />
            <Field label="Profil" value={connection.profile} />
            <Field label="IP" value={connection.ipAddress} mono />
            <Field label="ONU Serial" value={connection.onuSerial ?? '—'} mono />
            <Field label="OLT" value={connection.olt ?? '—'} />
            <Field label="PON Port" value={connection.ponPort ?? '—'} mono />
            <div>
              <dt className="text-muted-foreground text-xs">Redaman (RX)</dt>
              <dd className="mt-1">
                {connection.rxPower == null ? (
                  <span className="text-sm">—</span>
                ) : (
                  <StatusBadge
                    tone={rxTone(connection.rxPower)}
                    label={`${connection.rxPower} dBm`}
                    dot={false}
                  />
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Belum ada koneksi — pelanggan masih tahap prospek/instalasi.
          </p>
        )}
        {connection?.onuSerial ? (
          <div className="border-border border-t pt-4">
            <OnuActions customerId={customerId} ssid={`WiFi-${connection.pppoeUsername}`} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function InvoicesCard({ invoices }: { invoices: Invoice[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tagihan terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        {!invoices ? (
          <Skeleton className="h-20 w-full" />
        ) : invoices.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">Belum ada tagihan.</p>
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link
                    to="/invoices/$invoiceId"
                    params={{ invoiceId: inv.id }}
                    className="font-medium font-mono text-sm hover:underline"
                  >
                    {inv.invoiceNo}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    Jatuh tempo {formatDate(inv.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tabular-nums">
                    {formatCurrency(inv.amount)}
                  </span>
                  <StatusBadge tone={INVOICE_TONE[inv.status]} label={statusLabel(inv.status)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link to="/customers">
        <ArrowLeftIcon className="size-4" />
        Kembali ke pelanggan
      </Link>
    </Button>
  )
}
