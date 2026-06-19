import { cn } from '@/lib/cn'

export type FilterTabItem = {
  /** The filter value this tab selects (e.g. a status or "all"). */
  value: string
  label: string
  /** Optional count pill (e.g. how many records match this tab). */
  count?: number | undefined
}

type Props = {
  value: string
  onValueChange: (value: string) => void
  items: FilterTabItem[]
  /** Accessible name for the tablist. */
  ariaLabel: string
  className?: string
}

/**
 * Segmented control for switching a list's primary filter (e.g. status), with
 * an optional count pill per tab — the reference shell's list-filter pattern.
 * Scrolls horizontally on narrow screens rather than wrapping.
 */
export function FilterTabs({ value, onValueChange, items, ariaLabel, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/60 p-1',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(item.value)}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 font-medium text-sm transition-colors sm:h-7',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {item.count != null ? (
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-medium text-xs tabular-nums',
                  active
                    ? 'bg-muted text-foreground'
                    : 'bg-muted-foreground/15 text-muted-foreground',
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
