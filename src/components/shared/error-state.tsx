import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

type ErrorStateProps = {
  /** Headline shown to the user (Bahasa Indonesia). Defaults to a generic message. */
  title?: string
  /** Optional supporting line, e.g. a friendly next step. */
  description?: string
  /** Leading glyph; defaults to a warning triangle. */
  icon?: ComponentType<{ className?: string }>
  /** When provided, renders a retry button wired to this handler. */
  onRetry?: () => void
  /** Label for the retry button. */
  retryLabel?: string
  /** Extra action(s) rendered next to / instead of retry. */
  action?: ReactNode
  className?: string
}

/**
 * Centered failure placeholder with an optional retry. Announces itself to
 * assistive tech via `role="alert"`. Pairs with {@link EmptyState} and skeletons.
 */
export function ErrorState({
  title = 'Gagal memuat data',
  description,
  icon: Icon = TriangleAlertIcon,
  onRetry,
  retryLabel = 'Coba lagi',
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-4 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {onRetry || action ? (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCwIcon className="size-4" />
              {retryLabel}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  )
}
