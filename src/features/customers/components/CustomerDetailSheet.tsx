import { Link } from '@tanstack/react-router'
import { ExternalLinkIcon, PencilIcon, PlugZapIcon } from 'lucide-react'
import { useState } from 'react'

import {
  DETAIL_LINKED_ROW_CLASS,
  DetailActionBar,
  DetailMeta,
  DetailMetaGrid,
  DetailSection,
  DetailSectionLabel,
  DetailSheet,
  DetailSheetHeader,
} from '@/components/shared/detail-sheet'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/auth'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { Customer, CustomerStatus } from '@/schemas/customer'
import type { InvoiceStatus } from '@/schemas/invoice'
import type { TicketStatus } from '@/schemas/ticket'

import { useCustomer, useUpdateCustomer } from '../hooks/useCustomers'
import { useCustomerInvoices } from '../hooks/useCustomerInvoices'
import { useCustomerTickets } from '../hooks/useCustomerTickets'
import {
  CustomerMapButton,
  CustomerNavigateButton,
  CustomerStatusAction,
  CustomerWhatsappButton,
} from './customer-actions'
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

type Props = {
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Quick-view drawer for a subscriber. The full 360° page (6 tabs) stays for
// deep work; this is the fast in-context preview opened from the list row.
export function CustomerDetailSheet({ customerId, open, onOpenChange }: Props) {
  return (
    <DetailSheet open={open} onOpenChange={onOpenChange}>
      {customerId ? <SheetBody customerId={customerId} /> : null}
    </DetailSheet>
  )
}

function SheetBody({ customerId }: { customerId: string }) {
  const { data: customer, isLoading, isError, refetch } = useCustomer(customerId)

  return (
    <>
      <DetailSheetHeader
        eyebrow="Pelanggan"
        title={customer?.fullName ?? 'Pelanggan'}
        status={
          customer ? (
            <StatusBadge tone={STATUS_TONE[customer.status]} label={statusLabel(customer.status)} />
          ) : null
        }
        description={
          customer
            ? `${customer.customerNo} · ${customer.areaName ?? 'Tanpa area'}`
            : 'Memuat detail pelanggan…'
        }
      />

      {isLoading ? (
        <div className="space-y-4 p-5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError || !customer ? (
        <ErrorState
          className="py-16"
          title="Pelanggan tidak ditemukan."
          onRetry={() => refetch()}
        />
      ) : (
        <CustomerBody customer={customer} />
      )}
    </>
  )
}

function CustomerBody({ customer }: { customer: Customer }) {
  const conn = customer.connection

  return (
    <div className="divide-y divide-sidebar-border">
      <DetailActionBar>
        <CustomerStatusAction customer={customer} />
        <CustomerWhatsappButton customerId={customer.id} />
        <CustomerMapButton customer={customer} />
        <CustomerNavigateButton customer={customer} />
        <CustomerRowActions customer={customer} />
      </DetailActionBar>

      <DetailSection>
        <CustomerSummary customer={customer} />
      </DetailSection>

      <CustomerContact key={customer.id} customer={customer} />

      <DetailSection title="Koneksi">
        {conn ? (
          <>
            <DetailMetaGrid>
              <DetailMeta label="Tipe">{conn.type.toUpperCase()}</DetailMeta>
              <DetailMeta label="PPPoE">{conn.pppoeUsername}</DetailMeta>
              <DetailMeta label="IP">{conn.ipAddress}</DetailMeta>
              <DetailMeta label="ONU">{conn.onuSerial ?? '—'}</DetailMeta>
              <DetailMeta label="OLT / PON">
                {conn.olt ? `${conn.olt}${conn.ponPort ? ` · ${conn.ponPort}` : ''}` : '—'}
              </DetailMeta>
              <DetailMeta label="Redaman">
                {conn.rxPower != null ? `${formatNumber(conn.rxPower)} dBm` : '—'}
              </DetailMeta>
            </DetailMetaGrid>
            <OnuActions customerId={customer.id} ssid={`WiFi-${conn.pppoeUsername}`} />
          </>
        ) : (
          <p className="flex items-center gap-2 text-muted-foreground text-sm">
            <PlugZapIcon className="size-4" />
            Belum ada koneksi — pelanggan masih tahap prospek/instalasi.
          </p>
        )}
      </DetailSection>

      <RecentInvoices customerId={customer.id} />

      <RecentTickets customerName={customer.fullName} />

      <DetailSection title="Tertaut">
        <Link
          to="/customers/$customerId"
          params={{ customerId: customer.id }}
          className={DETAIL_LINKED_ROW_CLASS}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <ExternalLinkIcon className="size-4" />
          </span>
          <span className="grid min-w-0 flex-1">
            <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
              Pelanggan 360°
            </span>
            <span className="truncate text-sm">Tagihan, tiket, kontrak, privasi</span>
          </span>
          <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </DetailSection>
    </div>
  )
}

// Contact block with in-place edit — toggle to edit phone/email/address right
// in the drawer (gated customers.manage) instead of opening the full dialog.
// Remounted per customer (keyed) so the inputs always seed from fresh data.
function CustomerContact({ customer }: { customer: Customer }) {
  const canManage = useCan('customers.manage')
  const update = useUpdateCustomer(customer.id)
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(customer.phone)
  const [email, setEmail] = useState(customer.email ?? '')
  const [address, setAddress] = useState(customer.address)

  const cancel = () => {
    setPhone(customer.phone)
    setEmail(customer.email ?? '')
    setAddress(customer.address)
    setEditing(false)
  }

  const save = async () => {
    try {
      await update.mutateAsync({
        fullName: customer.fullName,
        planId: customer.planId,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
      })
      setEditing(false)
    } catch {
      // useUpdateCustomer surfaces the error via toast.
    }
  }

  const valid = phone.trim().length >= 6 && address.trim().length > 0

  return (
    <section className="space-y-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <DetailSectionLabel>Kontak</DetailSectionLabel>
        {canManage && !editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
          >
            <PencilIcon className="size-3.5" />
            Edit
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
              Telepon
            </span>
            <Input
              aria-label="Telepon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
              Email
            </span>
            <Input
              aria-label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
              Alamat
            </span>
            <Input
              aria-label="Alamat"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancel} disabled={update.isPending}>
              Batal
            </Button>
            <Button size="sm" onClick={save} disabled={!valid || update.isPending}>
              Simpan
            </Button>
          </div>
        </div>
      ) : (
        <DetailMetaGrid>
          <DetailMeta label="Telepon">{customer.phone}</DetailMeta>
          <DetailMeta label="Email">{customer.email ?? '—'}</DetailMeta>
          <DetailMeta label="Reseller">{customer.resellerName ?? '—'}</DetailMeta>
          <DetailMeta label="Alamat">{customer.address}</DetailMeta>
        </DetailMetaGrid>
      )}
    </section>
  )
}

const INVOICE_TONE: Record<InvoiceStatus, StatusTone> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  draft: 'neutral',
}

const TICKET_TONE: Record<TicketStatus, StatusTone> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  breached: 'danger',
}

// Recent invoices for this subscriber (top 5) — in-context lookup without
// leaving for the 360° page; rows link to the full invoice.
function RecentInvoices({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomerInvoices(customerId)
  return (
    <DetailSection title="Tagihan terbaru">
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : !data || data.length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada tagihan.</p>
      ) : (
        <ul className="divide-y divide-sidebar-border overflow-hidden rounded-lg border border-sidebar-border">
          {data.map((inv) => (
            <li key={inv.id}>
              <Link
                to="/invoices/$invoiceId"
                params={{ invoiceId: inv.id }}
                className="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-sidebar-accent"
              >
                <div className="min-w-0">
                  <p className="font-medium font-mono text-sm">{inv.invoiceNo}</p>
                  <p className="text-muted-foreground text-xs">
                    Jatuh tempo {formatDate(inv.dueDate)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-sm tabular-nums">
                    {formatCurrency(invoiceTotal(inv))}
                  </span>
                  <StatusBadge tone={INVOICE_TONE[inv.status]} label={statusLabel(inv.status)} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  )
}

// Recent tickets for this subscriber (top 8); rows link to the full ticket.
function RecentTickets({ customerName }: { customerName: string }) {
  const { data, isLoading } = useCustomerTickets(customerName)
  return (
    <DetailSection title="Tiket terbaru">
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : !data || data.length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada tiket.</p>
      ) : (
        <ul className="divide-y divide-sidebar-border overflow-hidden rounded-lg border border-sidebar-border">
          {data.map((t) => (
            <li key={t.id}>
              <Link
                to="/tickets/$ticketId"
                params={{ ticketId: t.id }}
                className="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-sidebar-accent"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{t.subject}</p>
                  <p className="font-mono text-muted-foreground text-xs">{t.code}</p>
                </div>
                <StatusBadge tone={TICKET_TONE[t.status]} label={statusLabel(t.status)} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  )
}
