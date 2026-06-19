import { Link } from '@tanstack/react-router'
import { ExternalLinkIcon } from 'lucide-react'

import {
  DETAIL_LINKED_ROW_CLASS,
  DetailMeta,
  DetailMetaGrid,
  DetailSection,
  DetailSheet,
  DetailSheetHeader,
} from '@/components/shared/detail-sheet'
import { Sparkline } from '@/components/shared/sparkline'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatNumber } from '@/lib/format'
import type { UsageRecord } from '@/schemas/usage'

type Props = {
  record: UsageRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Quick-view drawer for a subscriber's data usage (drawer-first). Renders from
// the row object; surfaces the 7-day daily-usage trend that the table can't show.
export function UsageDetailSheet({ record, open, onOpenChange }: Props) {
  return (
    <DetailSheet open={open} onOpenChange={onOpenChange}>
      {record ? <Body record={record} /> : null}
    </DetailSheet>
  )
}

function Body({ record }: { record: UsageRecord }) {
  const quota = record.quotaGb === 0 ? 'Unlimited' : `${formatNumber(record.quotaGb)} GB`
  const total = record.trend.reduce((s, v) => s + v, 0)
  const avg = record.trend.length ? Math.round(total / record.trend.length) : 0

  return (
    <>
      <DetailSheetHeader
        eyebrow="Pemakaian"
        title={record.customerName}
        status={
          record.fupThrottled ? (
            <StatusBadge tone="warning" label="FUP (dibatasi)" />
          ) : (
            <StatusBadge tone="success" label="Normal" />
          )
        }
        description={record.planName}
      />

      <div className="divide-y divide-sidebar-border">
        <DetailSection title="Ringkasan">
          <DetailMetaGrid>
            <DetailMeta label="Paket">{record.planName}</DetailMeta>
            <DetailMeta label="Kuota">{quota}</DetailMeta>
            <DetailMeta label="Terpakai">{formatNumber(record.usedGb)} GB</DetailMeta>
            <DetailMeta label="Status FUP">
              {record.fupThrottled ? 'Dibatasi' : 'Normal'}
            </DetailMeta>
          </DetailMetaGrid>
        </DetailSection>

        {record.trend.length > 1 ? (
          <DetailSection title="Tren 7 hari">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-bold font-mono text-2xl tabular-nums">
                  {formatNumber(total)} GB
                </p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  rata-rata {formatNumber(avg)} GB / hari
                </p>
              </div>
              <Sparkline data={record.trend} className="h-12 w-40 text-primary" />
            </div>
          </DetailSection>
        ) : null}

        <DetailSection title="Tertaut">
          <Link
            to="/customers/$customerId"
            params={{ customerId: record.customerId }}
            className={DETAIL_LINKED_ROW_CLASS}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <ExternalLinkIcon className="size-4" />
            </span>
            <span className="grid min-w-0 flex-1">
              <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
                Pelanggan 360°
              </span>
              <span className="truncate text-sm">Detail & koneksi pelanggan</span>
            </span>
            <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </DetailSection>
      </div>
    </>
  )
}
