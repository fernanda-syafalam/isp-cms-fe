import { Link } from '@tanstack/react-router'
import { ExternalLinkIcon } from 'lucide-react'

import {
  DETAIL_LINKED_ROW_CLASS,
  DetailActionBar,
  DetailMeta,
  DetailMetaGrid,
  DetailSection,
  DetailSheet,
  DetailSheetHeader,
} from '@/components/shared/detail-sheet'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Reseller, ResellerStatus } from '@/schemas/reseller'

import { ResellerRowActions } from './ResellerRowActions'

const STATUS_TONE: Record<ResellerStatus, StatusTone> = {
  active: 'success',
  inactive: 'neutral',
}

type Props = {
  reseller: Reseller | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Quick-view drawer for a reseller (drawer-first). Renders from the row object
// (no fetch); the deposit/commission ledger lives on the full 360° page.
export function ResellerDetailSheet({ reseller, open, onOpenChange }: Props) {
  return (
    <DetailSheet open={open} onOpenChange={onOpenChange}>
      {reseller ? <Body reseller={reseller} /> : null}
    </DetailSheet>
  )
}

function Body({ reseller }: { reseller: Reseller }) {
  return (
    <>
      <DetailSheetHeader
        eyebrow="Reseller"
        title={reseller.name}
        status={
          <StatusBadge tone={STATUS_TONE[reseller.status]} label={statusLabel(reseller.status)} />
        }
        description={reseller.area}
      />

      <div className="divide-y divide-sidebar-border">
        <DetailActionBar>
          <ResellerRowActions reseller={reseller} />
        </DetailActionBar>

        <DetailSection title="Ringkasan">
          <DetailMetaGrid>
            <DetailMeta label="Area">{reseller.area}</DetailMeta>
            <DetailMeta label="Komisi">{formatPercent(reseller.commissionPct)}</DetailMeta>
            <DetailMeta label="Saldo deposit">{formatCurrency(reseller.balance)}</DetailMeta>
            <DetailMeta label="Pelanggan">{formatNumber(reseller.customerCount)}</DetailMeta>
          </DetailMetaGrid>
        </DetailSection>

        <DetailSection title="Tertaut">
          <Link
            to="/resellers/$resellerId"
            params={{ resellerId: reseller.id }}
            className={DETAIL_LINKED_ROW_CLASS}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <ExternalLinkIcon className="size-4" />
            </span>
            <span className="grid min-w-0 flex-1">
              <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
                Reseller 360°
              </span>
              <span className="truncate text-sm">Buku besar saldo & komisi</span>
            </span>
            <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </DetailSection>
      </div>
    </>
  )
}
