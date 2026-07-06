import { ChevronRightIcon, StarIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { StatusBadge } from '@/components/shared/status-badge'
import { ticketStatusToneCustomer as TICKET_TONE } from '@/components/shared/status-tone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { statusLabel } from '@/lib/status-label'
import type { Ticket } from '@/schemas/ticket'

import { CsatDialog } from './CsatDialog'
import { PortalTicketDetailDialog } from './PortalTicketDetailDialog'

// Tickets a resolved/breached ticket still owes a rating on.
function needsCsat(ticket: Ticket): boolean {
  return (ticket.status === 'resolved' || ticket.status === 'breached') && !ticket.csatAt
}

export function PortalTicketsCard({ tickets }: { tickets: Ticket[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [csatId, setCsatId] = useState<string | null>(null)
  // Auto-surface the CSAT prompt for the first unrated resolved ticket, once.
  const promptedRef = useRef(false)
  const pendingCsat = tickets.find(needsCsat)

  useEffect(() => {
    if (!promptedRef.current && pendingCsat) {
      promptedRef.current = true
      setCsatId(pendingCsat.id)
    }
  }, [pendingCsat])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Laporan saya</CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Belum ada laporan gangguan.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{t.subject}</span>
                  {needsCsat(t) ? (
                    <StarIcon
                      className="size-4 shrink-0 text-amber-500"
                      aria-label="Perlu penilaian"
                    />
                  ) : null}
                  <StatusBadge tone={TICKET_TONE[t.status]} label={statusLabel(t.status)} />
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <PortalTicketDetailDialog
        ticketId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        onRate={(id) => {
          setSelectedId(null)
          setCsatId(id)
        }}
      />
      <CsatDialog
        ticketId={csatId}
        open={csatId !== null}
        onOpenChange={(open) => {
          if (!open) setCsatId(null)
        }}
      />
    </Card>
  )
}
