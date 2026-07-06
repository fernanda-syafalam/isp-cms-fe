import { AlertTriangleIcon, InfoIcon, RadioIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { cn } from '@/lib/cn'
import type { Announcement, AnnouncementSeverity } from '@/schemas/announcement'

import { usePortalAnnouncements } from '../hooks/usePortal'

type SeverityStyle = {
  container: string
  icon: ComponentType<{ className?: string }>
  live: 'assertive' | 'polite'
}

const SEVERITY_STYLES: Record<AnnouncementSeverity, SeverityStyle> = {
  outage: {
    container: 'border-destructive/40 bg-destructive/10 text-destructive',
    icon: RadioIcon,
    live: 'assertive',
  },
  warning: {
    container: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    icon: AlertTriangleIcon,
    live: 'polite',
  },
  info: {
    container: 'border-border bg-muted text-muted-foreground',
    icon: InfoIcon,
    live: 'polite',
  },
}

// Active operator notices at the top of the portal. Renders nothing when empty.
export function AnnouncementsBanner() {
  const { data } = usePortalAnnouncements()

  if (!data || data.length === 0) return null

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <AnnouncementNotice key={item.id} announcement={item} />
      ))}
    </div>
  )
}

function AnnouncementNotice({ announcement }: { announcement: Announcement }) {
  const style = SEVERITY_STYLES[announcement.severity]
  const Icon = style.icon

  return (
    <div
      role="status"
      aria-live={style.live}
      className={cn('flex gap-3 rounded-lg border p-3 text-sm', style.container)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold">{announcement.title}</p>
        <p className="text-foreground/80">{announcement.body}</p>
      </div>
    </div>
  )
}
