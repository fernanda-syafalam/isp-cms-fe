import { cn } from '@/lib/cn'

// Cross-feature status pill. `tone` maps to a semantic colour; the label is
// free text so each module can pass its own domain status string.
export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400',
  info: 'bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400',
  neutral: 'bg-muted text-muted-foreground ring-border',
}

type Props = {
  tone: StatusTone
  label: string
  /** Show a leading status dot. */
  dot?: boolean
}

export function StatusBadge({ tone, label, dot = true }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-xs capitalize ring-1 ring-inset',
        toneClasses[tone],
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {label}
    </span>
  )
}
