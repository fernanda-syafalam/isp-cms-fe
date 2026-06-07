import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  HandCoinsIcon,
  MessageSquareIcon,
  PlayIcon,
  PlusIcon,
  UserIcon,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useCan } from '@/features/auth'
import { formatDateTime } from '@/lib/format'
import { slaState } from '@/lib/sla'
import { statusLabel } from '@/lib/status-label'
import type { TicketEvent, TicketStatus } from '@/schemas/ticket'

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

export function TicketDetailPage({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading, isError } = useTicket(ticketId)
  const { data: events } = useTicketEvents(ticketId)
  const canManage = useCan('tickets.manage')
  const canBill = useCan('billing.run')
  const navigate = useNavigate()
  const update = useUpdateTicket(ticketId)
  const addComment = useAddComment(ticketId)
  const createWo = useCreateWorkOrderFromTicket(ticketId)
  const [comment, setComment] = useState('')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (isError || !ticket) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-destructive" role="alert">
          Tiket tidak ditemukan.
        </p>
      </div>
    )
  }

  const sla = slaState(ticket.status, ticket.slaDueAt, Date.now())
  const canStart = ticket.status === 'open'
  const canResolve = ticket.status === 'open' || ticket.status === 'in_progress'

  const submitComment = () => {
    const body = comment.trim()
    if (!body) return
    addComment.mutate({ body }, { onSuccess: () => setComment('') })
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={ticket.subject}
        description={`${ticket.code} · ${ticket.customerName}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={sla.tone} label={sla.label} dot={!sla.breached} />
            <StatusBadge tone={STATUS_TONE[ticket.status]} label={statusLabel(ticket.status)} />
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
                  Buat Work Order
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
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-4">
              {(events?.items ?? []).map((ev) => (
                <TimelineItem key={ev.id} event={ev} />
              ))}
            </ul>
            {canManage ? (
              <div className="space-y-2 border-border border-t pt-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Row
                label="Pelanggan"
                value={
                  ticket.customerId ? (
                    <Link
                      to="/customers/$customerId"
                      params={{ customerId: ticket.customerId }}
                      className="hover:underline"
                    >
                      {ticket.customerName}
                    </Link>
                  ) : (
                    ticket.customerName
                  )
                }
              />
              <Row label="Prioritas" value={statusLabel(ticket.priority)} />
              <Row label="Teknisi" value={ticket.assignee ?? '—'} />
              <Row label="Dibuat" value={formatDateTime(ticket.createdAt)} />
              <Row label="Batas SLA" value={formatDateTime(ticket.slaDueAt)} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const KIND_LABEL: Record<TicketEvent['kind'], string> = {
  created: 'dibuat',
  comment: 'komentar',
  status: 'status',
  assign: 'assign',
  workorder: 'work order',
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

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/tickets"
      className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
    >
      <ArrowLeftIcon className="size-4" />
      Kembali ke Tiket
    </Link>
  )
}
