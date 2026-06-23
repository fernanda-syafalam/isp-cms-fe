import { Link } from '@tanstack/react-router'
import { ExternalLinkIcon, PlugZapIcon } from 'lucide-react'

import {
  DETAIL_LINKED_ROW_CLASS,
  DetailActionBar,
  DetailMeta,
  DetailMetaGrid,
  DetailSection,
  DetailSheet,
  DetailSheetHeader,
} from '@/components/shared/detail-sheet'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { customerStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Customer } from '@/schemas/customer'

import { useCustomer } from '../hooks/useCustomers'
import {
  CustomerMapButton,
  CustomerNavigateButton,
  CustomerStatusAction,
  CustomerWhatsappButton,
} from './customer-actions'
import { CustomerContact } from './CustomerContactSection'
import { CustomerRowActions } from './CustomerRowActions'
import { CustomerSummary } from './CustomerSummary'
import { RecentInvoices, RecentTickets } from './CustomerRecentLists'
import { OnuActions } from './OnuActions'

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
