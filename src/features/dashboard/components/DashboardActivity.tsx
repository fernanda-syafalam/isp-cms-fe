import { Link } from '@tanstack/react-router'

import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Payment } from '@/schemas/payment'
import type { WorkOrder } from '@/schemas/workorder'

type Props = {
  payments: Payment[] | undefined
  workOrders: WorkOrder[] | undefined
}

// Bottom activity row: latest payments alongside the upcoming installs queue.
export function DashboardActivity({ payments, workOrders }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RecentPaymentsCard payments={payments} />
      <UpcomingInstallsCard workOrders={workOrders} />
    </div>
  )
}

function RecentPaymentsCard({ payments }: { payments: Payment[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pembayaran terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        {!payments ? (
          <Skeleton className="h-24 w-full" />
        ) : payments.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">Belum ada pembayaran.</p>
        ) : (
          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link
                    to="/customers/$customerId"
                    params={{ customerId: p.customerId }}
                    className="block truncate font-medium text-sm hover:underline"
                  >
                    {p.customerName}
                  </Link>
                  <p className="font-mono text-muted-foreground text-xs">
                    {p.invoiceNo} · {statusLabel(p.method)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm tabular-nums">{formatCurrency(p.amount)}</p>
                  <p className="text-muted-foreground text-xs">{formatDateTime(p.paidAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function UpcomingInstallsCard({ workOrders }: { workOrders: WorkOrder[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Instalasi mendatang</CardTitle>
      </CardHeader>
      <CardContent>
        {!workOrders ? (
          <Skeleton className="h-24 w-full" />
        ) : workOrders.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Tidak ada instalasi terjadwal.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {workOrders.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{w.customerName}</p>
                  <p className="font-mono text-muted-foreground text-xs">
                    {w.code} · {w.technician ?? 'Belum ditugaskan'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{formatDate(w.scheduledAt)}</span>
                  <StatusBadge tone="info" label={statusLabel(w.status)} dot={false} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
