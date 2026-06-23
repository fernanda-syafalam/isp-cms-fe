import { Link } from '@tanstack/react-router'
import { UserIcon } from 'lucide-react'
import { useState } from 'react'

import {
  DETAIL_LINKED_ROW_CLASS,
  DetailLinkedRow,
  DetailMeta,
  DetailMetaGrid,
  DetailSection,
  DetailSheet,
  DetailSheetHeader,
} from '@/components/shared/detail-sheet'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { ticketStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useCan } from '@/features/auth'
import { formatDateTime } from '@/lib/format'
import { slaState } from '@/lib/sla'
import { statusLabel } from '@/lib/status-label'
import type { Ticket } from '@/schemas/ticket'

import { useAddComment, useTicket, useTicketEvents } from '../hooks/useTickets'
import { TicketSheetActions } from './TicketSheetActions'
import { TicketTimelineItem } from './TicketTimelineItem'

type Props = {
  ticketId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Quick-view drawer for a support ticket — timeline, SLA, and the same actions
// as the full page, opened in-context from the list row.
export function TicketDetailSheet({ ticketId, open, onOpenChange }: Props) {
  return (
    <DetailSheet open={open} onOpenChange={onOpenChange}>
      {ticketId ? <SheetBody ticketId={ticketId} /> : null}
    </DetailSheet>
  )
}

function SheetBody({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading, isError, refetch } = useTicket(ticketId)
  const sla = ticket ? slaState(ticket.status, ticket.slaDueAt, Date.now()) : null

  return (
    <>
      <DetailSheetHeader
        eyebrow="Tiket"
        title={ticket?.subject ?? 'Tiket'}
        status={
          ticket && sla ? (
            <span className="flex items-center gap-1.5">
              <StatusBadge tone={sla.tone} label={sla.label} dot={!sla.breached} />
              <StatusBadge tone={STATUS_TONE[ticket.status]} label={statusLabel(ticket.status)} />
            </span>
          ) : null
        }
        description={ticket ? `${ticket.code} · ${ticket.customerName}` : 'Memuat detail tiket…'}
      />

      {isLoading ? (
        <div className="space-y-4 p-5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError || !ticket ? (
        <ErrorState className="py-16" title="Tiket tidak ditemukan." onRetry={() => refetch()} />
      ) : (
        <TicketBody ticket={ticket} />
      )}
    </>
  )
}

function TicketBody({ ticket }: { ticket: Ticket }) {
  const { data: events } = useTicketEvents(ticket.id)
  const canManage = useCan('tickets.manage')
  const addComment = useAddComment(ticket.id)
  const [comment, setComment] = useState('')

  const submitComment = () => {
    const body = comment.trim()
    if (!body) return
    addComment.mutate({ body }, { onSuccess: () => setComment('') })
  }

  return (
    <div className="divide-y divide-sidebar-border">
      <TicketSheetActions ticket={ticket} />

      <DetailSection>
        <DetailMetaGrid>
          <DetailMeta label="Pelanggan">
            {ticket.customerId ? (
              <Link
                to="/customers/$customerId"
                params={{ customerId: ticket.customerId }}
                className="hover:underline"
              >
                {ticket.customerName}
              </Link>
            ) : (
              ticket.customerName
            )}
          </DetailMeta>
          <DetailMeta label="Prioritas">{statusLabel(ticket.priority)}</DetailMeta>
          <DetailMeta label="Teknisi">{ticket.assignee ?? '—'}</DetailMeta>
          <DetailMeta label="Dibuat">{formatDateTime(ticket.createdAt)}</DetailMeta>
          <DetailMeta label="Batas SLA">{formatDateTime(ticket.slaDueAt)}</DetailMeta>
        </DetailMetaGrid>
      </DetailSection>

      <DetailSection title="Riwayat">
        <ul className="space-y-4">
          {(events?.items ?? []).map((ev) => (
            <TicketTimelineItem key={ev.id} event={ev} />
          ))}
        </ul>
        {canManage ? (
          <div className="space-y-2 border-sidebar-border border-t pt-4">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tulis komentar…"
              aria-label="Komentar"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={addComment.isPending || !comment.trim()}
                onClick={submitComment}
              >
                Kirim
              </Button>
            </div>
          </div>
        ) : null}
      </DetailSection>

      {ticket.customerId ? (
        <DetailSection title="Tertaut">
          <Link
            to="/customers/$customerId"
            params={{ customerId: ticket.customerId }}
            className={DETAIL_LINKED_ROW_CLASS}
          >
            <DetailLinkedRow icon={UserIcon} label="Pelanggan" value={ticket.customerName} />
          </Link>
        </DetailSection>
      ) : null}
    </div>
  )
}
