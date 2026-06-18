import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Stable, render-independent keys for fixed-length skeleton rows. Using a pool
// (instead of the array index) keeps Biome's noArrayIndexKey happy while the
// list is genuinely static. Twelve covers any realistic skeleton row count.
const ROW_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'] as const

function rowKeys(count: number): readonly string[] {
  return ROW_KEYS.slice(0, Math.min(count, ROW_KEYS.length))
}

/**
 * Loading placeholder shaped like {@link PageHeader}: a title line, a
 * description line, and an optional right-aligned action block.
 */
export function PageHeaderSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {withAction ? <Skeleton className="h-9 w-32" /> : null}
    </div>
  )
}

/**
 * Loading placeholder for a definition-list style detail card (label/value
 * rows). Mirrors the Card + `<dl>` layout used by detail panels.
 */
export function DetailCardSkeleton({
  rows = 4,
  withTitle = true,
}: {
  rows?: number
  withTitle?: boolean
}) {
  return (
    <Card>
      {withTitle ? (
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
      ) : null}
      <CardContent className="space-y-3">
        {rowKeys(rows).map((key) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Loading placeholder for a form: stacked label + input field rows and a
 * trailing submit-button block. Matches the React Hook Form layout.
 */
export function FormSkeleton({
  fields = 4,
  withSubmit = true,
}: {
  fields?: number
  withSubmit?: boolean
}) {
  return (
    <div className="space-y-6">
      {rowKeys(fields).map((key) => (
        <div key={key} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      {withSubmit ? (
        <div className="flex justify-end">
          <Skeleton className="h-9 w-32" />
        </div>
      ) : null}
    </div>
  )
}
