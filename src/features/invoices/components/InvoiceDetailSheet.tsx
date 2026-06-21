import { Link } from '@tanstack/react-router'
import { ReceiptTextIcon, UserIcon } from 'lucide-react'

import {
  DETAIL_LINKED_ROW_CLASS,
  DetailLinkedRow,
  DetailMeta,
  DetailMetaGrid,
  DetailSection,
  DetailSheet,
  DetailSheetHeader,
} from '@/components/shared/detail-sheet'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Invoice, InvoiceStatus } from '@/schemas/invoice'

import { useInvoice } from '../hooks/useInvoices'
import { InvoiceBreakdown } from './InvoiceBreakdown'
import { InvoiceSheetActions } from './InvoiceSheetActions'
import { InvoiceTimeline } from './InvoiceTimeline'

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
  return (
    <div className="divide-y divide-sidebar-border">
      <InvoiceSheetActions invoice={invoice} />

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

      <InvoiceBreakdown invoice={invoice} />

      <InvoiceTimeline invoice={invoice} />

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
