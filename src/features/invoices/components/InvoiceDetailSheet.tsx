import { Link } from '@tanstack/react-router'
import {
  BellRingIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  PrinterIcon,
  ReceiptTextIcon,
  UserIcon,
  WalletIcon,
} from 'lucide-react'
import { useState } from 'react'

import {
  DETAIL_LINKED_ROW_CLASS,
  DetailActionBar,
  DetailLinkedRow,
  DetailMeta,
  DetailMetaGrid,
  DetailSection,
  DetailSheet,
  DetailSheetHeader,
} from '@/components/shared/detail-sheet'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
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
  /** The invoice to show; the sheet is closed when null. */
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Right-side quick-view drawer for an invoice, opened from the list row. The
// body only mounts (and fetches) while an invoice is selected.
export function InvoiceDetailSheet({ invoiceId, open, onOpenChange }: Props) {
  return (
    <DetailSheet open={open} onOpenChange={onOpenChange}>
      {invoiceId ? <SheetBody invoiceId={invoiceId} /> : null}
    </DetailSheet>
  )
}

function SheetBody({ invoiceId }: { invoiceId: string }) {
  const { data: invoice, isLoading, isError, refetch } = useInvoice(invoiceId)

  return (
    <>
      <DetailSheetHeader
        eyebrow="Tagihan"
        title={<span className="font-mono">{invoice?.invoiceNo ?? 'Tagihan'}</span>}
        status={
          invoice ? (
            <StatusBadge tone={STATUS_TONE[invoice.status]} label={statusLabel(invoice.status)} />
          ) : null
        }
        description={
          invoice
            ? `${invoice.customerName} · jatuh tempo ${formatDate(invoice.dueDate)}`
            : 'Memuat detail tagihan…'
        }
      />

      {isLoading ? (
        <div className="space-y-4 p-5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError || !invoice ? (
        <ErrorState className="py-16" title="Tagihan tidak ditemukan." onRetry={() => refetch()} />
      ) : (
        <InvoiceBody invoice={invoice} />
      )}
    </>
  )
}

function InvoiceBody({ invoice }: { invoice: Invoice }) {
  const total = invoiceTotal(invoice)
  const paid = invoice.status === 'paid'

  return (
    <div className="divide-y divide-sidebar-border">
      <Actions invoice={invoice} />

      <DetailSection>
        <DetailMetaGrid>
          <DetailMeta label="Pelanggan">
            <Link
              to="/customers/$customerId"
              params={{ customerId: invoice.customerId }}
              className="hover:underline"
            >
              {invoice.customerName}
            </Link>
          </DetailMeta>
          <DetailMeta label="Periode">
            {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
          </DetailMeta>
          <DetailMeta label="Jatuh tempo">{formatDate(invoice.dueDate)}</DetailMeta>
          <DetailMeta label="No. Faktur Pajak">{invoice.taxInvoiceNo ?? '—'}</DetailMeta>
          <DetailMeta label="Dibayar">
            {invoice.paidAt ? formatDateTime(invoice.paidAt) : '—'}
          </DetailMeta>
          <DetailMeta label="Status">{statusLabel(invoice.status)}</DetailMeta>
        </DetailMetaGrid>
      </DetailSection>

      <DetailSection title="Rincian">
        <div className="space-y-2 rounded-lg border border-sidebar-border p-4 text-sm">
          <TotalRow label="DPP (langganan)" value={formatCurrency(invoice.amount)} />
          {invoice.taxAmount > 0 ? (
            <TotalRow label="PPN" value={formatCurrency(invoice.taxAmount)} />
          ) : null}
          {invoice.lateFee > 0 ? (
            <TotalRow label="Denda keterlambatan" value={formatCurrency(invoice.lateFee)} danger />
          ) : null}
          <div className="flex items-center justify-between border-sidebar-border border-t pt-2">
            <span className="text-muted-foreground">Total tagihan</span>
            <span className="font-bold font-mono tabular-nums">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{paid ? 'Dibayar' : 'Saldo tertagih'}</span>
            <span
              className={
                paid
                  ? 'font-mono text-emerald-600 tabular-nums dark:text-emerald-400'
                  : 'font-mono font-semibold tabular-nums'
              }
            >
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </DetailSection>

      <Timeline invoice={invoice} />

      <DetailSection title="Tertaut">
        <Link
          to="/customers/$customerId"
          params={{ customerId: invoice.customerId }}
          className={DETAIL_LINKED_ROW_CLASS}
        >
          <DetailLinkedRow icon={UserIcon} label="Pelanggan" value={invoice.customerName} />
        </Link>
        <Link
          to="/invoices/$invoiceId"
          params={{ invoiceId: invoice.id }}
          className={DETAIL_LINKED_ROW_CLASS}
        >
          <DetailLinkedRow
            icon={ReceiptTextIcon}
            label="Halaman tagihan"
            value="Buka detail lengkap"
          />
        </Link>
      </DetailSection>
    </div>
  )
}

function Actions({ invoice }: { invoice: Invoice }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const canRemind = useCan('billing.run')
  const remind = useRemindOverdue()
  const pay = usePayInvoice(invoice.id)
  const unpaid = invoice.status !== 'paid'

  return (
    <DetailActionBar>
      {unpaid ? (
        <>
          <Button size="sm" onClick={() => setCheckoutOpen(true)}>
            <CreditCardIcon className="size-4" />
            Bayar online
          </Button>
          <CheckoutDialog invoice={invoice} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={pay.isPending}>
                <WalletIcon className="size-4" />
                Catat manual
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Metode</DropdownMenuLabel>
              {PaymentMethodSchema.options.map((method) => (
                <DropdownMenuItem key={method} onSelect={() => pay.mutate({ method })}>
                  {statusLabel(method)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {canRemind ? (
            <Button
              variant="outline"
              size="sm"
              disabled={remind.isPending}
              onClick={() => remind.mutate([invoice.id])}
            >
              <BellRingIcon className="size-4" />
              Ingatkan
            </Button>
          ) : null}
        </>
      ) : null}
      <Button asChild variant="outline" size="sm">
        <Link to="/invoices/print/$invoiceId" params={{ invoiceId: invoice.id }}>
          <PrinterIcon className="size-4" />
          {invoice.status === 'paid' ? 'Kwitansi' : 'Cetak'}
        </Link>
      </Button>
    </DetailActionBar>
  )
}

// A real, chronological timeline built only from timestamps we actually hold.
function Timeline({ invoice }: { invoice: Invoice }) {
  const overdueUnpaid = invoice.status === 'overdue'
  const events = [
    {
      key: 'due',
      icon: CalendarClockIcon,
      label: 'Jatuh tempo',
      at: `${invoice.dueDate}T00:00:00`,
      display: formatDate(invoice.dueDate),
      tone: overdueUnpaid ? 'danger' : 'default',
    },
    invoice.lastRemindedAt
      ? {
          key: 'remind',
          icon: BellRingIcon,
          label: 'Pengingat dikirim',
          at: invoice.lastRemindedAt,
          display: formatDateTime(invoice.lastRemindedAt),
          tone: 'default',
        }
      : null,
    invoice.paidAt
      ? {
          key: 'paid',
          icon: CheckCircle2Icon,
          label: 'Pembayaran diterima',
          at: invoice.paidAt,
          display: formatDateTime(invoice.paidAt),
          tone: 'success',
        }
      : null,
  ]
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => a.at.localeCompare(b.at))

  return (
    <DetailSection title="Lini masa">
      <ul className="space-y-3">
        {events.map((e) => {
          const Icon = e.icon
          return (
            <li key={e.key} className="flex items-start gap-3">
              <span
                className={
                  e.tone === 'danger'
                    ? 'flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive'
                    : e.tone === 'success'
                      ? 'flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
                }
              >
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-sm">{e.label}</p>
                <p className="text-muted-foreground text-xs">{e.display}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </DetailSection>
  )
}

function TotalRow({
  label,
  value,
  danger = false,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          danger
            ? 'font-mono text-red-600 tabular-nums dark:text-red-400'
            : 'font-mono tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  )
}
