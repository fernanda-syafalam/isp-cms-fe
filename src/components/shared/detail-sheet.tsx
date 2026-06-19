import { ExternalLinkIcon } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/cn'

/**
 * Standard right-side detail drawer (quick view) shell. We open detail in a
 * drawer instead of a new route wherever the content fits, to keep access fast
 * and the user in context. Each entity composes a body from the primitives
 * below; the shadcn Sheet handles focus trap, Escape, and focus return.
 */
export function DetailSheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[40rem]">
        {children}
      </SheetContent>
    </Sheet>
  )
}

/** Title block: eyebrow + title + optional status badge + supporting line. */
export function DetailSheetHeader({
  eyebrow,
  title,
  status,
  description,
}: {
  eyebrow?: string
  title: ReactNode
  status?: ReactNode
  description?: ReactNode
}) {
  return (
    <SheetHeader className="gap-1 border-sidebar-border border-b px-5 py-4">
      {eyebrow ? (
        <span className="font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wider">
          {eyebrow}
        </span>
      ) : null}
      <div className="flex items-center gap-2.5">
        <SheetTitle className="min-w-0 truncate text-xl tracking-tight">{title}</SheetTitle>
        {status}
      </div>
      {description ? <SheetDescription className="text-xs">{description}</SheetDescription> : null}
    </SheetHeader>
  )
}

/** Wrapper for the action cluster directly under the header. */
export function DetailActionBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2 px-5 py-3">{children}</div>
}

/** A labelled body section. Siblings are separated by the body's `divide-y`. */
export function DetailSection({
  title,
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-3 px-5 py-4', className)}>
      {title ? <DetailSectionLabel>{title}</DetailSectionLabel> : null}
      {children}
    </section>
  )
}

export function DetailSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wider">
      {children}
    </p>
  )
}

/** Responsive key/value grid for compact record metadata. */
export function DetailMetaGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">{children}</dl>
}

export function DetailMeta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 truncate text-sm">{children}</dd>
    </div>
  )
}

/**
 * Chrome for a "linked record" row. The typed <Link> wraps this at the call
 * site (so TanStack Router keeps route/param checking); apply
 * {@link DETAIL_LINKED_ROW_CLASS} to that Link.
 */
export const DETAIL_LINKED_ROW_CLASS =
  'flex items-center gap-3 rounded-lg border border-sidebar-border px-3 py-2.5 transition-colors hover:bg-sidebar-accent'

export function DetailLinkedRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="grid min-w-0 flex-1">
        <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="truncate text-sm">{value}</span>
      </span>
      <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
    </>
  )
}
