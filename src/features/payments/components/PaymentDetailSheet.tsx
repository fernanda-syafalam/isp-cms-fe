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
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Payment } from '@/schemas/payment'

type Props = {
  /** The payment to show; the sheet is closed when null. */
  payment: Payment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Quick-view drawer for a payment record. Payments are immutable and have no
// own page, so the drawer IS the detail — opened in-context from the list row
// with the row's data (no extra fetch). A voucher settlement (P3.D.3) has no
// invoice and (usually) no named customer, so those rows render gracefully.
export function PaymentDetailSheet({ payment, open, onOpenChange }: Props) {
  const isVoucher = payment?.source === 'voucher'
  const customerName = payment?.customerName ?? 'Anonim'

  return (
    <DetailSheet open={open} onOpenChange={onOpenChange}>
      {payment ? (
        <>
          <DetailSheetHeader
            eyebrow={isVoucher ? 'Pembayaran voucher' : 'Pembayaran'}
            title={<span className="font-mono tabular-nums">{formatCurrency(payment.amount)}</span>}
            status={<StatusBadge tone="success" label={statusLabel(payment.method)} />}
            description={`${customerName} · ${formatDateTime(payment.paidAt)}`}
          />

          <div className="divide-y divide-sidebar-border">
            <DetailSection>
              <DetailMetaGrid>
                <DetailMeta label="Pelanggan">
                  {payment.customerId && payment.customerName ? (
                    <Link
                      to="/customers/$customerId"
                      params={{ customerId: payment.customerId }}
                      className="hover:underline"
                    >
                      {payment.customerName}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Anonim</span>
                  )}
                </DetailMeta>
                <DetailMeta label="Tagihan">
                  {payment.invoiceId && payment.invoiceNo ? (
                    <Link
                      to="/invoices/$invoiceId"
                      params={{ invoiceId: payment.invoiceId }}
                      className="font-mono hover:underline"
                    >
                      {payment.invoiceNo}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </DetailMeta>
                <DetailMeta label="Sumber">{isVoucher ? 'Voucher' : 'Tagihan'}</DetailMeta>
                {isVoucher ? (
                  <DetailMeta label="Voucher">
                    <span className="font-mono text-xs">{payment.voucherId ?? '—'}</span>
                  </DetailMeta>
                ) : null}
                <DetailMeta label="Metode">{statusLabel(payment.method)}</DetailMeta>
                <DetailMeta label="Tanggal">{formatDateTime(payment.paidAt)}</DetailMeta>
                <DetailMeta label="ID Pembayaran">
                  <span className="font-mono text-xs">{payment.id}</span>
                </DetailMeta>
              </DetailMetaGrid>
            </DetailSection>

            {isVoucher ? null : (
              <DetailSection title="Tertaut">
                {payment.invoiceId && payment.invoiceNo ? (
                  <Link
                    to="/invoices/$invoiceId"
                    params={{ invoiceId: payment.invoiceId }}
                    className={DETAIL_LINKED_ROW_CLASS}
                  >
                    <DetailLinkedRow
                      icon={ReceiptTextIcon}
                      label="Tagihan"
                      value={payment.invoiceNo}
                    />
                  </Link>
                ) : null}
                {payment.customerId && payment.customerName ? (
                  <Link
                    to="/customers/$customerId"
                    params={{ customerId: payment.customerId }}
                    className={DETAIL_LINKED_ROW_CLASS}
                  >
                    <DetailLinkedRow
                      icon={UserIcon}
                      label="Pelanggan"
                      value={payment.customerName}
                    />
                  </Link>
                ) : null}
              </DetailSection>
            )}
          </div>
        </>
      ) : null}
    </DetailSheet>
  )
}
