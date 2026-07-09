import { Navigate } from '@tanstack/react-router'
import { LifeBuoyIcon, RouterIcon, TriangleAlertIcon, WrenchIcon } from 'lucide-react'

import { ROLE_HOME } from '@/components/shared/nav'
import { useCurrentUser, useEffectiveRole } from '@/features/auth'
import { useDashboardSummary } from '@/hooks/useAnalytics'
import { formatCurrency } from '@/lib/format'

import { useRecentPayments, useUpcomingInstalls } from '../hooks/useDashboardLists'
import { AttentionPanel, type AttentionAlert } from './AttentionPanel'
import { DashboardActivity } from './DashboardActivity'
import { DashboardCharts } from './DashboardCharts'
import { DashboardCommandCenter } from './DashboardCommandCenter'
import { DashboardKpis } from './DashboardKpis'

export function DashboardPage() {
  const role = useEffectiveRole()
  const { data: user } = useCurrentUser()
  const { data: summary, isLoading, isError } = useDashboardSummary()
  const { data: recentPayments } = useRecentPayments()
  const { data: upcomingInstalls } = useUpcomingInstalls()

  // Restricted roles land on their own home, not the ops dashboard. admin/staff
  // map to '/' (this route itself), so only redirect when home points elsewhere.
  const home = ROLE_HOME[role]
  if (home && home !== '/') return <Navigate to={home} replace />

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

      <DashboardKpis summary={summary} isLoading={isLoading} isError={isError} />

      {summary ? <DashboardCommandCenter summary={summary} /> : null}

      <DashboardCharts summary={summary} />

      <DashboardActivity payments={recentPayments} workOrders={upcomingInstalls} />
    </div>
  )
}
