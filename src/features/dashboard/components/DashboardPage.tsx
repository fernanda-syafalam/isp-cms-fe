import {
  BanknoteIcon,
  LifeBuoyIcon,
  PowerOffIcon,
  RouterIcon,
  TriangleAlertIcon,
  UsersIcon,
  WrenchIcon,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { KpiCard } from '@/components/shared/kpi-card'
import { RevenueChart } from '@/components/shared/revenue-chart'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardSummary } from '@/hooks/useAnalytics'
import { useCurrentUser } from '@/features/auth'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
} from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Payment } from '@/schemas/payment'
import type { WorkOrder } from '@/schemas/workorder'

import { useRecentPayments, useUpcomingInstalls } from '../hooks/useDashboardLists'
import { AttentionPanel, type AttentionAlert } from './AttentionPanel'

const KPI_SKELETON_KEYS = ['k1', 'k2', 'k3', 'k4'] as const

export function DashboardPage() {
  const { data: user } = useCurrentUser()
  const { data: summary, isLoading, isError } = useDashboardSummary()
  const { data: recentPayments } = useRecentPayments()
  const { data: upcomingInstalls } = useUpcomingInstalls()

  const alerts: AttentionAlert[] = summary
    ? [
        {
          key: 'overdue',
          icon: TriangleAlertIcon,
          label: 'Tagihan jatuh tempo',
          count: summary.overdueCount,
          hint: formatCurrency(summary.overdueAmount),
          to: '/invoices',
          search: { status: 'overdue' },
          tone: 'danger',
        },
        {
          key: 'tickets',
          icon: LifeBuoyIcon,
          label: 'Tiket terbuka',
          count: summary.openTickets,
          to: '/tickets',
          search: { status: 'open' },
          tone: 'warning',
        },
        {
          key: 'installs',
          icon: WrenchIcon,
          label: 'Instalasi terjadwal',
          count: upcomingInstalls?.length ?? 0,
          to: '/work-orders',
          search: { status: 'scheduled' },
          tone: 'info',
        },
        {
          key: 'offline',
          icon: RouterIcon,
          label: 'Perangkat offline',
          count: summary.devicesTotal - summary.devicesOnline,
          to: '/network/devices',
          search: { status: 'offline' },
          tone: 'danger',
        },
      ]
    : []

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-bold text-3xl tracking-tight">
          Selamat datang{user ? `, ${user.fullName}` : ''}
        </h1>
        <p className="mt-2 text-muted-foreground">Jaringan, tagihan, dan dukungan sekilas.</p>
      </header>

      {isError ? (
        <p className="text-destructive" role="alert">
          Gagal memuat metrik dasbor.
        </p>
      ) : null}

      {summary ? <AttentionPanel alerts={alerts} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !summary
          ? KPI_SKELETON_KEYS.map((k) => <Skeleton key={k} className="h-28 w-full rounded-xl" />)
          : null}
        {summary ? (
          <>
            <KpiCard
              label="Pelanggan aktif"
              value={summary.activeSubscribers}
              hint={`+${formatNumber(summary.newThisMonth)} bulan ini`}
              hintTone={summary.newThisMonth >= 0 ? 'positive' : 'negative'}
              icon={UsersIcon}
              series={summary.subscriberTrend}
            />
            <KpiCard
              label="Terisolir"
              value={summary.isolatedSubscribers}
              hint="pelanggan diisolir"
              hintTone="negative"
              icon={PowerOffIcon}
              series={summary.isolatedTrend}
            />
            <KpiCard
              label="MRR"
              value={summary.mrr}
              format={formatCurrency}
              hint="Pendapatan bulanan berulang"
              accent="amber"
              icon={BanknoteIcon}
              series={summary.revenueTrend.map((r) => r.revenue)}
            />
            <KpiCard
              label="Piutang (AR)"
              value={summary.arOutstanding}
              format={formatCurrency}
              hint={`${formatNumber(summary.overdueCount)} tagihan telat`}
              hintTone="negative"
              icon={TriangleAlertIcon}
              series={summary.arTrend}
            />
          </>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pendapatan (6 bulan terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <RevenueChart data={summary.revenueTrend} />
            ) : (
              <Skeleton className="h-[280px] w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status jaringan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary ? (
              <NetworkStatus online={summary.devicesOnline} total={summary.devicesTotal} />
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tiket per status</CardTitle>
        </CardHeader>
        <CardContent>
          {summary ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={summary.ticketsByStatus}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={96}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-muted)' }}
                  contentStyle={{
                    background: 'var(--color-popover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    color: 'var(--color-popover-foreground)',
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Tiket"
                  fill="var(--color-chart-1)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-[220px] w-full" />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentPaymentsCard payments={recentPayments} />
        <UpcomingInstallsCard workOrders={upcomingInstalls} />
      </div>
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
                  <p className="truncate font-medium text-sm">{p.customerName}</p>
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

function NetworkStatus({ online, total }: { online: number; total: number }) {
  const offline = Math.max(0, total - online)
  const ratio = total > 0 ? online / total : 0
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RouterIcon className="size-5" />
        </span>
        <div>
          <p className="font-bold text-2xl tracking-tight">{formatPercent(ratio)}</p>
          <p className="text-muted-foreground text-xs">perangkat online</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-muted p-2">
          <dt className="text-muted-foreground text-xs">Online</dt>
          <dd className="font-medium text-emerald-600 dark:text-emerald-400">
            {formatNumber(online)}
          </dd>
        </div>
        <div className="rounded-md bg-muted p-2">
          <dt className="text-muted-foreground text-xs">Offline</dt>
          <dd className="font-medium text-red-600 dark:text-red-400">{formatNumber(offline)}</dd>
        </div>
      </dl>
    </div>
  )
}
