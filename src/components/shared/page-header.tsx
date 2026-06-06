import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  /** Right-aligned actions, e.g. a "New" button or filters. */
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
