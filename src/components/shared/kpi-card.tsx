import { Link } from '@tanstack/react-router'
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { Sparkline } from '@/components/shared/sparkline'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'

type HintTone = 'positive' | 'negative' | 'muted'
type Accent = 'primary' | 'amber'

type Props = {
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
  /** When set, the whole card becomes a link (drill-down to a filtered list). */
  to?: string
  search?: Record<string, string>
}

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

export function KpiCard({
  label,
  value,
  format = formatNumber,
  hint,
  hintTone = 'muted',
  accent = 'primary',
  icon: Icon,
  series,
  to,
  search,
}: Props) {
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

  const card = (
    <Card
      className={cn(
        'relative overflow-hidden transition-colors hover:border-foreground/15',
        to ? 'hover:border-primary/40' : '',
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
            <Icon className="size-4.5" />
          </span>
        </div>
        <p className="truncate font-bold font-mono text-2xl tracking-tight tabular-nums">
          {display}
        </p>
        {hint ? (
          <p className={cn('flex items-center gap-1 text-xs', hintToneClass[hintTone])}>
            {TrendIcon ? <TrendIcon className="size-3" /> : null}
            {hint}
          </p>
        ) : null}
        {series && series.length > 1 ? (
          <Sparkline data={series} className={accentSparkClass[accent]} />
        ) : null}
      </CardContent>
    </Card>
  )

  if (to) {
    return (
      <Link to={to} search={search ?? {}} className="block">
        {card}
      </Link>
    )
  }
  return card
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
