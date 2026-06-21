import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'

import { useTicket } from '../hooks/useTickets'
import { TicketHeaderActions } from './TicketHeaderActions'
import { TicketHistoryCard } from './TicketHistoryCard'
import { TicketSlaCard } from './TicketSlaCard'

export function TicketDetailPage({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading, isError, refetch } = useTicket(ticketId)

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
        <ErrorState title="Tiket tidak ditemukan." onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={ticket.subject}
        description={`${ticket.code} · ${ticket.customerName}`}
        actions={<TicketHeaderActions ticket={ticket} />}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <TicketHistoryCard ticketId={ticket.id} />
        <TicketSlaCard ticket={ticket} />
      </div>
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
