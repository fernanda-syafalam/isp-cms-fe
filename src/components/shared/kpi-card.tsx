import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'

type HintTone = 'positive' | 'negative' | 'muted'
type Accent = 'primary' | 'amber'

type Props = {
  label: string
  value: string
  hint?: string
  hintTone?: HintTone
  accent?: Accent
  icon: ComponentType<{ className?: string }>
}

const hintToneClass: Record<HintTone, string> = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-red-600 dark:text-red-400',
  muted: 'text-muted-foreground',
}

const accentClass: Record<Accent, string> = {
  primary: 'bg-primary/10 text-primary',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export function KpiCard({
  label,
  value,
  hint,
  hintTone = 'muted',
  accent = 'primary',
  icon: Icon,
}: Props) {
  const TrendIcon =
    hintTone === 'positive' ? TrendingUpIcon : hintTone === 'negative' ? TrendingDownIcon : null
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-muted-foreground text-sm">{label}</p>
          <p className="truncate font-bold font-mono text-2xl tabular-nums tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className={cn('flex items-center gap-1 text-xs', hintToneClass[hintTone])}>
              {TrendIcon ? <TrendIcon className="size-3" /> : null}
              {hint}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            accentClass[accent],
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )
}
