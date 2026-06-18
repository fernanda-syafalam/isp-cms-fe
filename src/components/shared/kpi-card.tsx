import { Link } from '@tanstack/react-router'
import { TrendingDownIcon, TrendingUpIcon, TriangleAlertIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { Sparkline } from '@/components/shared/sparkline'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import type { NodeStatus, NodeType } from '@/schemas/topology'

type HintTone = 'positive' | 'negative' | 'muted'
type Accent = 'primary' | 'amber'

// Typed drill-down targets. Each card may link only to a route it actually
// drills into, with that route's exact search shape — a wrong path or filter
// is a compile error (matches the dashboard alert-tile idiom). `/customers`
// has no search params; `/network/topology` filters by node status/type.
type KpiDrill =
  | { to?: undefined; search?: undefined }
  | { to: '/customers'; search?: undefined }
  | { to: '/invoices'; search?: { status?: string } }
  | {
      to: '/network/topology'
      search?: { status?: NodeStatus | 'all'; type?: NodeType | 'all' }
    }

type BaseProps = {
  label: string
  /** Number animates with a count-up; a string is shown verbatim (no format). */
  value: number | string
  format?: (n: number) => string
  hint?: string
  hintTone?: HintTone
  accent?: Accent
  icon: ComponentType<{ className?: string }>
  /** Optional trend series — renders a sparkline tinted by the accent. */
  series?: number[]
  /** Render the loading placeholder instead of a (fake) value. */
  isLoading?: boolean
  /** Render an error placeholder instead of a stale/zero value. */
  isError?: boolean
}

type Props = BaseProps & KpiDrill

const hintToneClass: Record<HintTone, string> = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-red-600 dark:text-red-400',
  muted: 'text-muted-foreground',
}

const accentIconClass: Record<Accent, string> = {
  primary: 'bg-primary/10 text-primary',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

const accentSparkClass: Record<Accent, string> = {
  primary: 'text-primary/70',
  amber: 'text-amber-500/70',
}

// Keyboard focus ring for the whole-card drill-down link.
const drillLinkClass =
  'block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function KpiCard(props: Props) {
  const {
    label,
    value,
    format = formatNumber,
    hint,
    hintTone = 'muted',
    accent = 'primary',
    icon: Icon,
    series,
    isLoading = false,
    isError = false,
  } = props

  const numeric = typeof value === 'number'
  const animated = useCountUp(numeric ? value : 0)
  // Integer targets snap to whole numbers mid-animation; fractional targets
  // (e.g. rates) keep precision so `format` can render them. String values
  // (e.g. a status label) render verbatim.
  const display = numeric
    ? format(Number.isInteger(value) ? Math.round(animated) : animated)
    : value
  const TrendIcon =
    hintTone === 'positive' ? TrendingUpIcon : hintTone === 'negative' ? TrendingDownIcon : null

  // Loading/error own the whole card — never flash a fake 0 / stale value, and
  // never skeleton forever once the query has settled into an error.
  if (isLoading) return <KpiCardSkeleton />
  if (isError) return <KpiCardError label={label} />

  const card = (
    <Card
      className={cn(
        'relative overflow-hidden transition-colors hover:border-foreground/15',
        props.to ? 'hover:border-primary/40' : '',
      )}
    >
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-muted-foreground text-sm">{label}</p>
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl',
              accentIconClass[accent],
            )}
          >
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
        </div>
        <p className="truncate font-bold font-mono text-2xl tracking-tight tabular-nums">
          {display}
        </p>
        {hint ? (
          <p className={cn('flex items-center gap-1 text-xs', hintToneClass[hintTone])}>
            {TrendIcon ? <TrendIcon className="size-3" aria-hidden="true" /> : null}
            {hint}
          </p>
        ) : null}
        {series && series.length > 1 ? (
          <Sparkline data={series} className={accentSparkClass[accent]} />
        ) : null}
      </CardContent>
    </Card>
  )

  // Switch on `props.to` (not a destructured local) so TypeScript narrows the
  // matching `search` shape per route.
  switch (props.to) {
    case '/customers':
      return (
        <Link to="/customers" className={drillLinkClass}>
          {card}
        </Link>
      )
    case '/invoices':
      return (
        <Link to="/invoices" search={props.search ?? {}} className={drillLinkClass}>
          {card}
        </Link>
      )
    case '/network/topology':
      return (
        <Link to="/network/topology" search={props.search ?? {}} className={drillLinkClass}>
          {card}
        </Link>
      )
    default:
      return card
  }
}

/**
 * Loading placeholder shaped like {@link KpiCard} (label + icon, big value,
 * hint) so the grid does not reflow when data arrives. Drop one per card.
 */
export function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-9 shrink-0 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}

/**
 * Error placeholder shaped like {@link KpiCard}. Shown when the metric query
 * fails so the card communicates the failure instead of a misleading 0 or a
 * skeleton that never resolves.
 */
function KpiCardError({ label }: { label: string }) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-muted-foreground text-sm">{label}</p>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <TriangleAlertIcon className="size-4.5" aria-hidden="true" />
          </span>
        </div>
        <p className="font-bold font-mono text-2xl text-muted-foreground tracking-tight">—</p>
        <p className="text-destructive text-xs">Gagal memuat</p>
      </CardContent>
    </Card>
  )
}
