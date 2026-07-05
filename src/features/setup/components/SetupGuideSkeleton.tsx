import { PageHeaderSkeleton } from '@/components/shared/skeletons'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Stable keys for the fixed eight-step placeholder list (mirrors the real steps).
const STEP_ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

// Loading placeholder shaped like {@link SetupGuidePage}: header, a progress
// card, and the eight step rows. Skeleton over spinner so the layout holds while
// the setup-status query settles.
export function SetupGuideSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeaderSkeleton />

      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-9 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </CardContent>
      </Card>

      <ol className="space-y-3">
        {STEP_ROWS.map((key) => (
          <li key={key}>
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full max-w-md" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-24 shrink-0" />
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  )
}
