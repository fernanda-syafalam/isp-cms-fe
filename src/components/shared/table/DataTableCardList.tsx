import { flexRender, type Row } from '@tanstack/react-table'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

import { SKELETON_ROW_KEYS } from './data-table-shared'

// Mobile body (below md): each row becomes a definition-list card so phones
// never horizontal-scroll. The desktop <table> is hidden at this breakpoint.
export function DataTableCardList<T>({ rows, isLoading }: { rows: Row<T>[]; isLoading: boolean }) {
  return (
    <div className="space-y-2 md:hidden">
      {isLoading
        ? SKELETON_ROW_KEYS.map((key) => <Skeleton key={key} className="h-24 w-full rounded-lg" />)
        : rows.map((row) => (
            <div
              key={row.id}
              data-state={row.getIsSelected() ? 'selected' : undefined}
              className="rounded-lg border border-border bg-card p-3 data-[state=selected]:bg-muted"
            >
              <dl className="space-y-1.5">
                {row.getVisibleCells().map((cell) => {
                  const title = cell.column.columnDef.meta?.title
                  return (
                    <div key={cell.id} className="flex items-start justify-between gap-3">
                      <dt
                        className={cn(
                          'shrink-0 text-muted-foreground text-xs',
                          !title && 'sr-only',
                        )}
                      >
                        {title ?? 'Aksi'}
                      </dt>
                      <dd className="min-w-0 text-right text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          ))}
    </div>
  )
}
