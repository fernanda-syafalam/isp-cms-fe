import { zodResolver } from '@hookform/resolvers/zod'
import { StarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { StatusBadge } from '@/components/shared/status-badge'
import { ticketStatusToneCustomer as TICKET_TONE } from '@/components/shared/status-tone'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { TicketTimelineItem } from '@/features/tickets/components/TicketTimelineItem'
import { cn } from '@/lib/cn'
import { statusLabel } from '@/lib/status-label'
import { AddCommentSchema, type AddCommentInput } from '@/schemas/ticket'

import { useAddPortalComment, usePortalTicket } from '../hooks/usePortal'
import { TICKET_CATEGORY_LABEL } from '../lib/ticketCategory'

type Props = {
  ticketId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRate: (ticketId: string) => void
}

// Customer-facing ticket thread: header, timeline, comment box, and a CSAT
// prompt once the ticket is resolved/breached. Opened from "Laporan saya".
export function PortalTicketDetailDialog({ ticketId, open, onOpenChange, onRate }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {ticketId ? <DetailBody ticketId={ticketId} onRate={onRate} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function DetailBody({ ticketId, onRate }: { ticketId: string; onRate: (id: string) => void }) {
  const { data: ticket, isLoading, isError } = usePortalTicket(ticketId)

  if (isLoading) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Laporan</DialogTitle>
          <DialogDescription>Memuat detail laporan…</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </>
    )
  }

  if (isError || !ticket) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Laporan</DialogTitle>
          <DialogDescription>Gagal memuat detail laporan.</DialogDescription>
        </DialogHeader>
        <p className="py-6 text-center text-destructive text-sm" role="alert">
          Laporan tidak ditemukan.
        </p>
      </>
    )
  }

  const canRate = (ticket.status === 'resolved' || ticket.status === 'breached') && !ticket.csatAt

  return (
    <>
      <DialogHeader>
        <DialogTitle>{ticket.subject}</DialogTitle>
        <DialogDescription>
          {ticket.code}
          {ticket.category ? ` · ${TICKET_CATEGORY_LABEL[ticket.category]}` : ''}
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-2">
        <StatusBadge tone={TICKET_TONE[ticket.status]} label={statusLabel(ticket.status)} />
      </div>

      {ticket.csatAt && ticket.csatRating ? (
        <CsatSummary rating={ticket.csatRating} comment={ticket.csatComment ?? null} />
      ) : null}

      {canRate ? (
        <Button size="sm" variant="outline" onClick={() => onRate(ticket.id)}>
          <StarIcon className="size-4" />
          Beri penilaian
        </Button>
      ) : null}

      <section className="space-y-3">
        <h3 className="font-medium text-sm">Riwayat</h3>
        {ticket.events.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada aktivitas.</p>
        ) : (
          <ul className="space-y-4">
            {ticket.events.map((ev) => (
              <TicketTimelineItem key={ev.id} event={ev} />
            ))}
          </ul>
        )}
      </section>

      <CommentForm ticketId={ticket.id} />
    </>
  )
}

function CsatSummary({ rating, comment }: { rating: number; comment: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-1" role="img" aria-label={`Penilaian ${rating} dari 5`}>
        {[1, 2, 3, 4, 5].map((v) => (
          <StarIcon
            key={v}
            className={cn(
              'size-4',
              rating >= v ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
            )}
          />
        ))}
      </div>
      {comment ? <p className="mt-1.5 text-muted-foreground text-sm">{comment}</p> : null}
    </div>
  )
}

function CommentForm({ ticketId }: { ticketId: string }) {
  const addComment = useAddPortalComment(ticketId)
  const form = useForm<AddCommentInput>({
    resolver: zodResolver(AddCommentSchema),
    defaultValues: { body: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await addComment.mutateAsync(values)
      form.reset()
    } catch {
      // useAddPortalComment surfaces a toast.
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} noValidate className="space-y-2 border-border border-t pt-4">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea rows={3} placeholder="Tulis balasan…" aria-label="Balasan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Mengirim…' : 'Kirim'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
