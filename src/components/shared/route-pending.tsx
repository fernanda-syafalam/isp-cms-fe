import { PageHeaderSkeleton } from '@/components/shared/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

// Stable, render-independent keys for the fixed-length placeholder blocks.
const CARD_KEYS = ['a', 'b', 'c'] as const
const ROW_KEYS = ['a', 'b', 'c', 'd', 'e', 'f'] as const

/**
 * Generic page loading placeholder used as the router's `defaultPendingComponent`
 * — shown while a route's chunk or loaders resolve. Neutral shape (header + KPI
 * row + list) so it reads sensibly for any page. Announces itself to assistive
 * tech via `aria-busy` + an `aria-live` status line.
 */
export function RoutePending() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only" aria-live="polite">
        Memuat halaman…
      </span>
      <PageHeaderSkeleton withAction />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARD_KEYS.map((key) => (
          <Skeleton key={key} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        {ROW_KEYS.map((key) => (
          <Skeleton key={key} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
