import type { ComponentType } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'

type Props = {
  label: string
  value: string
  hint?: string
  hintTone?: 'positive' | 'negative' | 'muted'
  icon: ComponentType<{ className?: string }>
}

const hintToneClass = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-red-600 dark:text-red-400',
  muted: 'text-muted-foreground',
} as const

export function KpiCard({ label, value, hint, hintTone = 'muted', icon: Icon }: Props) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-muted-foreground text-sm">{label}</p>
          <p className="truncate font-bold text-2xl tracking-tight">{value}</p>
          {hint ? <p className={cn('text-xs', hintToneClass[hintTone])}>{hint}</p> : null}
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )
}
