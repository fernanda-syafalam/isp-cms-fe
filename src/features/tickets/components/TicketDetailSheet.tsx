import { Link, useNavigate } from '@tanstack/react-router'
import {
  CheckCircle2Icon,
  HandCoinsIcon,
  MessageSquareIcon,
  PlayIcon,
  PlusIcon,
  UserIcon,
} from 'lucide-react'
import { useState } from 'react'

import {
  DETAIL_LINKED_ROW_CLASS,
  DetailActionBar,
  DetailLinkedRow,
  DetailMeta,
  DetailMetaGrid,
  DetailSection,
  DetailSheet,
  DetailSheetHeader,
} from '@/components/shared/detail-sheet'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useCan } from '@/features/auth'
import { formatDateTime } from '@/lib/format'
import { slaState } from '@/lib/sla'
import { statusLabel } from '@/lib/status-label'
import type { Ticket, TicketEvent, TicketStatus } from '@/schemas/ticket'

import {
  useAddComment,
  useCreateWorkOrderFromTicket,
  useTicket,
  useTicketEvents,
  useUpdateTicket,
} from '../hooks/useTickets'

const STATUS_TONE: Record<TicketStatus, StatusTone> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  breached: 'danger',
}

const KIND_LABEL: Record<TicketEvent['kind'], string> = {
  created: 'dibuat',
  comment: 'komentar',
  status: 'status',
  assign: 'assign',
  workorder: 'work order',
}

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
  const canBill = useCan('billing.run')
  const navigate = useNavigate()
  const update = useUpdateTicket(ticket.id)
  const addComment = useAddComment(ticket.id)
  const createWo = useCreateWorkOrderFromTicket(ticket.id)
  const [comment, setComment] = useState('')

  const canStart = ticket.status === 'open'
  const canResolve = ticket.status === 'open' || ticket.status === 'in_progress'

  const submitComment = () => {
    const body = comment.trim()
    if (!body) return
    addComment.mutate({ body }, { onSuccess: () => setComment('') })
  }

  return (
    <div className="divide-y divide-sidebar-border">
      {canManage || canBill ? (
        <DetailActionBar>
          {canManage ? (
            <>
              {canStart ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update.mutate({ status: 'in_progress' })}
                >
                  <PlayIcon className="size-4" />
                  Mulai
                </Button>
              ) : null}
              {canResolve ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update.mutate({ status: 'resolved' })}
                >
                  <CheckCircle2Icon className="size-4" />
                  Selesai
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                disabled={createWo.isPending}
                onClick={() => createWo.mutate()}
              >
                <PlusIcon className="size-4" />
                Work Order
              </Button>
            </>
          ) : null}
          {canBill ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate({
                  to: '/sla-credits',
                  search: {
                    customer: ticket.customerName,
                    ticket: ticket.code,
                  },
                })
              }
            >
              <HandCoinsIcon className="size-4" />
              Kredit SLA
            </Button>
          ) : null}
        </DetailActionBar>
      ) : null}

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
            <TimelineItem key={ev.id} event={ev} />
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

function TimelineItem({ event }: { event: TicketEvent }) {
  const Icon = event.kind === 'comment' ? MessageSquareIcon : UserIcon
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
