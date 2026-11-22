import { Link } from '@tanstack/react-router'
import { HandCoinsIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { formatNumber } from '@/lib/format'
import type { DashboardSummary } from '@/schemas/analytics'

// "Pusat Komando" — clickable tiles into the modules that need attention.
export function DashboardCommandCenter({ summary }: { summary: DashboardSummary }) {
  const cc = summary.commandCenter
  return (
    <section>
      <h2 className="mb-3 font-semibold text-muted-foreground text-sm">Pusat Komando</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CommandCard
          to="/sla-credits"
          label="Kredit SLA"
          value={formatNumber(cc.slaCreditsPending)}
          hint="menunggu diterapkan"
          icon={HandCoinsIcon}
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
  to: '/sla-credits'
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
        <span className="flex items-center gap-1.5 text-muted-foreground text-xs">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-bold text-xl tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </Link>
  )
}
