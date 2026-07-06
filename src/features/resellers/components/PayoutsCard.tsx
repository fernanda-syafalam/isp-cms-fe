import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { PayoutStatus } from '@/schemas/reseller'

import {
  useApprovePayout,
  useDisbursePayout,
  usePayouts,
  useRejectPayout,
} from '../hooks/useResellers'

// Display-boundary maps for the payout lifecycle. Kept local so `paid` reads as
// "Dicairkan" here rather than colliding with the invoice "Lunas" label.
const PAYOUT_LABEL: Record<PayoutStatus, string> = {
  requested: 'Diajukan',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  paid: 'Dicairkan',
}
const PAYOUT_TONE: Record<PayoutStatus, StatusTone> = {
  requested: 'info',
  approved: 'warning',
  rejected: 'danger',
  paid: 'success',
}

type Props = {
  resellerId: string
  canManage: boolean
}

export function PayoutsCard({ resellerId, canManage }: Props) {
  const { data, isLoading, isError, refetch } = usePayouts(resellerId)
  const approve = useApprovePayout(resellerId)
  const reject = useRejectPayout(resellerId)
  const disburse = useDisbursePayout(resellerId)
  const isBusy = approve.isPending || reject.isPending || disburse.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pencairan{data ? ` (${data.total})` : ''}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : isError ? (
          <ErrorState title="Gagal memuat pencairan." onRetry={() => refetch()} />
        ) : !data || data.items.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">Belum ada pencairan.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.items.map((payout) => (
              <li key={payout.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <span className="block font-mono font-medium text-sm tabular-nums">
                    {formatCurrency(payout.amount)}
                  </span>
                  <span className="block truncate text-muted-foreground text-xs">
                    {formatDateTime(payout.createdAt)}
                    {payout.note ? ` · ${payout.note}` : ''}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge
                    tone={PAYOUT_TONE[payout.status]}
                    label={PAYOUT_LABEL[payout.status]}
                  />
                  {canManage ? (
                    <PayoutActions
                      status={payout.status}
                      disabled={isBusy}
                      onApprove={() => approve.mutate(payout.id)}
                      onReject={() => reject.mutate(payout.id)}
                      onDisburse={() => disburse.mutate(payout.id)}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

type ActionsProps = {
  status: PayoutStatus
  disabled: boolean
  onApprove: () => void
  onReject: () => void
  onDisburse: () => void
}

// Per-row next actions gated by the state machine: requested → Setujui/Tolak;
// approved → Cairkan; paid/rejected are terminal (no actions).
function PayoutActions({ status, disabled, onApprove, onReject, onDisburse }: ActionsProps) {
  if (status === 'requested') {
    return (
      <>
        <Button size="sm" variant="outline" disabled={disabled} onClick={onApprove}>
          Setujui
        </Button>
        <Button size="sm" variant="ghost" disabled={disabled} onClick={onReject}>
          Tolak
        </Button>
      </>
    )
  }
  if (status === 'approved') {
    return (
      <Button size="sm" disabled={disabled} onClick={onDisburse}>
        Cairkan
      </Button>
    )
  }
  return null
}
