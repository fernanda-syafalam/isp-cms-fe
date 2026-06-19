import { Link } from '@tanstack/react-router'
import {
  BellRingIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  ExternalLinkIcon,
  PrinterIcon,
  ReceiptTextIcon,
  UserIcon,
  WalletIcon,
} from 'lucide-react'
import { useState } from 'react'

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        {invoiceId ? <SheetBody invoiceId={invoiceId} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function SheetBody({ invoiceId }: { invoiceId: string }) {
  const { data: invoice, isLoading, isError, refetch } = useInvoice(invoiceId)

  return (
    <>
      <SheetHeader className="gap-1 border-sidebar-border border-b px-5 py-4">
        <span className="font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wider">
          Tagihan
        </span>
        <div className="flex items-center gap-2.5">
          <SheetTitle className="font-mono text-xl tracking-tight">
            {invoice?.invoiceNo ?? 'Tagihan'}
          </SheetTitle>
          {invoice ? (
            <StatusBadge tone={STATUS_TONE[invoice.status]} label={statusLabel(invoice.status)} />
          ) : null}
        </div>
        <SheetDescription className="text-xs">
          {invoice
            ? `${invoice.customerName} · jatuh tempo ${formatDate(invoice.dueDate)}`
            : 'Memuat detail tagihan…'}
        </SheetDescription>
      </SheetHeader>

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

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-5 py-4 sm:grid-cols-3">
        <Meta label="Pelanggan">
          <Link
            to="/customers/$customerId"
            params={{ customerId: invoice.customerId }}
            className="hover:underline"
          >
            {invoice.customerName}
          </Link>
        </Meta>
        <Meta label="Periode">
          {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
        </Meta>
        <Meta label="Jatuh tempo">{formatDate(invoice.dueDate)}</Meta>
        <Meta label="No. Faktur Pajak">{invoice.taxInvoiceNo ?? '—'}</Meta>
        <Meta label="Dibayar">{invoice.paidAt ? formatDateTime(invoice.paidAt) : '—'}</Meta>
        <Meta label="Status">{statusLabel(invoice.status)}</Meta>
      </dl>

      <section className="space-y-3 px-5 py-4">
        <SectionLabel>Rincian</SectionLabel>
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
      </section>

      <Timeline invoice={invoice} />

      <section className="space-y-2 px-5 py-4">
        <SectionLabel>Tertaut</SectionLabel>
        <Link
          to="/customers/$customerId"
          params={{ customerId: invoice.customerId }}
          className={LINKED_ROW_CLASS}
        >
          <LinkedRowInner icon={UserIcon} label="Pelanggan" value={invoice.customerName} />
        </Link>
        <Link
          to="/invoices/$invoiceId"
          params={{ invoiceId: invoice.id }}
          className={LINKED_ROW_CLASS}
        >
          <LinkedRowInner
            icon={ReceiptTextIcon}
            label="Halaman tagihan"
            value="Buka detail lengkap"
          />
        </Link>
      </section>
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
    <div className="flex flex-wrap gap-2 px-5 py-3">
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
    </div>
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
    <section className="space-y-3 px-5 py-4">
      <SectionLabel>Lini masa</SectionLabel>
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
    </section>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 truncate text-sm">{children}</dd>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wider">
      {children}
    </p>
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

// Shared chrome for a "linked document" row; the typed <Link> wraps it at each
// call site so TanStack Router keeps its route/param checking (no `as` casts).
const LINKED_ROW_CLASS =
  'flex items-center gap-3 rounded-lg border border-sidebar-border px-3 py-2.5 transition-colors hover:bg-sidebar-accent'

function LinkedRowInner({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="grid min-w-0 flex-1">
        <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="truncate text-sm">{value}</span>
      </span>
      <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
    </>
  )
}
