import { Link } from '@tanstack/react-router'
import { CheckCircle2Icon, ChevronRightIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/cn'

type Tone = 'danger' | 'warning' | 'info'

export type AttentionAlert = {
  key: string
  icon: ComponentType<{ className?: string }>
  label: string
  count: number
  hint?: string
  to: '/invoices' | '/tickets' | '/work-orders' | '/network/devices'
  search?: { status?: string }
  tone: Tone
}

const TONE: Record<Tone, string> = {
  danger: 'bg-destructive/10 text-destructive',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
}

export function AttentionPanel({ alerts }: { alerts: AttentionAlert[] }) {
  const active = alerts.filter((a) => a.count > 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Perlu perhatian</CardTitle>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <div className="flex items-center gap-2 py-1 text-muted-foreground text-sm">
            <CheckCircle2Icon className="size-4 text-emerald-500" />
            Semua aman — tidak ada yang butuh tindakan.
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {active.map((a) => (
              <li key={a.key}>
                <Link
                  to={a.to}
                  search={a.search ?? {}}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-md',
                      TONE[a.tone],
                    )}
                  >
                    <a.icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-lg leading-none tabular-nums">
                      {a.count}
                    </span>
                    <span className="mt-0.5 block truncate text-muted-foreground text-xs">
                      {a.label}
                      {a.hint ? ` · ${a.hint}` : ''}
                    </span>
                  </span>
                  <ChevronRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
