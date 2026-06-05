import { TriangleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { cn } from '@/lib/cn'
import { formatCurrency, formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Customer, CustomerStatus } from '@/schemas/customer'

const STATUS_TONE: Record<CustomerStatus, StatusTone> = {
  prospek: 'neutral',
  instalasi: 'info',
  aktif: 'success',
  isolir: 'danger',
  berhenti: 'neutral',
}

const LIFECYCLE: CustomerStatus[] = ['prospek', 'instalasi', 'aktif', 'isolir', 'berhenti']

export function CustomerSummary({ customer }: { customer: Customer }) {
  const owes = customer.outstanding > 0

  return (
    <div className="space-y-4">
      {owes ? (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
          <TriangleAlertIcon className="size-5 shrink-0 text-destructive" />
          <div>
            <span className="font-medium text-destructive">
              Tunggakan {formatCurrency(customer.outstanding)}
            </span>
            <span className="ml-1 text-muted-foreground">
              {customer.status === 'isolir'
                ? '· pelanggan diisolir karena menunggak'
                : '· ada tagihan belum lunas'}
            </span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="Status">
          <StatusBadge tone={STATUS_TONE[customer.status]} label={statusLabel(customer.status)} />
        </SummaryTile>
        <SummaryTile label="Paket">
          <span className="font-medium text-sm">{customer.planName}</span>
        </SummaryTile>
        <SummaryTile label="Piutang">
          <span
            className={cn(
              'font-mono font-semibold text-sm tabular-nums',
              owes && 'text-destructive',
            )}
          >
            {formatCurrency(customer.outstanding)}
          </span>
        </SummaryTile>
        <SummaryTile label="Bergabung">
          <span className="text-sm">{formatDate(customer.joinedAt)}</span>
        </SummaryTile>
      </div>

      <ol className="flex flex-wrap items-center gap-1.5">
        {LIFECYCLE.map((stage) => {
          const current = stage === customer.status
          return (
            <li key={stage}>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium text-xs',
                  current
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground',
                )}
              >
                {statusLabel(stage)}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function SummaryTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}
