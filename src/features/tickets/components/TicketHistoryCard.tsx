import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCan } from '@/features/auth'

import { useAddComment, useTicketEvents } from '../hooks/useTickets'
import { TicketTimelineItem } from './TicketTimelineItem'

// "Riwayat" card — the activity timeline plus the comment composer (gated by
// tickets.manage), for the full ticket detail page.
export function TicketHistoryCard({ ticketId }: { ticketId: string }) {
  const { data: events } = useTicketEvents(ticketId)
  const canManage = useCan('tickets.manage')
  const addComment = useAddComment(ticketId)
  const [comment, setComment] = useState('')

  const submitComment = () => {
    const body = comment.trim()
    if (!body) return
    addComment.mutate({ body }, { onSuccess: () => setComment('') })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Riwayat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-4">
          {(events?.items ?? []).map((ev) => (
            <TicketTimelineItem key={ev.id} event={ev} />
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
  )
}
