import { InboxIcon } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type EmptyStateProps = {
  /** Headline describing what is missing (Bahasa Indonesia). */
  title: string
  /** Optional supporting line, e.g. how to add the first record. */
  description?: string
  /** Leading glyph; defaults to an inbox. */
  icon?: ComponentType<{ className?: string }>
  /** Optional call-to-action (e.g. a "Tambah" button) rendered below the text. */
  action?: ReactNode
  className?: string
}

/**
 * Centered placeholder for "no data yet" states. Pairs with {@link ErrorState}
 * (failure) and skeletons (loading) so every async surface has all three.
 */
export function EmptyState({
  title,
  description,
  icon: Icon = InboxIcon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-4 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}
