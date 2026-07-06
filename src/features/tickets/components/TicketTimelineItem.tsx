import { MessageSquareIcon, StarIcon, UserIcon } from 'lucide-react'

import { formatDateTime } from '@/lib/format'
import type { TicketEvent } from '@/schemas/ticket'

const KIND_LABEL: Record<TicketEvent['kind'], string> = {
  created: 'dibuat',
  comment: 'komentar',
  status: 'status',
  assign: 'assign',
  workorder: 'work order',
  csat: 'penilaian',
}

// One row of a ticket's activity timeline. Shared by the full detail page and
// the quick-view drawer so the two stay in lockstep.
export function TicketTimelineItem({ event }: { event: TicketEvent }) {
  const Icon =
    event.kind === 'comment' ? MessageSquareIcon : event.kind === 'csat' ? StarIcon : UserIcon
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-3.5 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <p className="text-sm">
          <span className="font-medium">{event.author}</span>{' '}
          <span className="text-muted-foreground text-xs">· {KIND_LABEL[event.kind]}</span>
        </p>
        <p className="text-sm">{event.body}</p>
        <p className="mt-0.5 text-muted-foreground text-xs">{formatDateTime(event.at)}</p>
      </div>
    </li>
  )
}
