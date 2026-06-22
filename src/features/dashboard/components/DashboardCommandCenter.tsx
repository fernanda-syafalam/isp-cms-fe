import { Link } from '@tanstack/react-router'
import { BellIcon, HandCoinsIcon, SplitIcon, TargetIcon, TrendingDownIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import type { DashboardSummary } from '@/schemas/analytics'

// "Pusat Komando" — five clickable tiles into the modules that need attention.
export function DashboardCommandCenter({ summary }: { summary: DashboardSummary }) {
  const cc = summary.commandCenter
  return (
    <section>
      <h2 className="mb-3 font-semibold text-muted-foreground text-sm">Pusat Komando</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <CommandCard
          to="/leads"
          label="Pipeline aktif"
          value={formatCurrency(cc.pipelineValue)}
          hint={`${formatNumber(cc.activeLeads)} prospek`}
          icon={TargetIcon}
        />
        <CommandCard
          to="/satisfaction"
          label="Risiko churn"
          value={formatPercent(cc.churnRate)}
          hint="pelanggan berisiko"
          icon={TrendingDownIcon}
        />
        <CommandCard
          to="/sla-credits"
          label="Kredit SLA"
          value={formatNumber(cc.slaCreditsPending)}
          hint="menunggu diterapkan"
          icon={HandCoinsIcon}
        />
        <CommandCard
          to="/network/monitoring"
          label="Alert NOC"
          value={formatNumber(cc.devicesAlert)}
          hint="perlu tindakan"
          icon={BellIcon}
        />
        <CommandCard
          to="/network/ftth"
          label="ODP penuh"
          value={formatNumber(cc.odpFull)}
          hint="tanpa slot kosong"
          icon={SplitIcon}
        />
      </div>
    </section>
  )
}

// Compact, clickable stat that links to a module — the command-center tile.
function CommandCard({
  to,
  label,
  value,
  hint,
  icon: Icon,
}: {
  to: '/leads' | '/satisfaction' | '/sla-credits' | '/network/monitoring' | '/network/ftth'
  label: string
  value: string
  hint: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-bold text-xl tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </Link>
  )
}
