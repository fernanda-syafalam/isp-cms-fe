import {
  BanknoteIcon,
  FileTextIcon,
  type LucideIcon,
  LifeBuoyIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from 'lucide-react'
import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import type { Customer } from '@/schemas/customer'
import type { Invoice } from '@/schemas/invoice'
import type { Ticket } from '@/schemas/ticket'

type TimelineTone = 'primary' | 'success' | 'warning' | 'neutral'

type TimelineEvent = {
  id: string
  at: string
  title: string
  icon: LucideIcon
  tone: TimelineTone
}

// Dot styling per tone — reuses the app's status palette so a payment reads
// "good" (emerald) and a ticket reads "needs attention" (amber) at a glance.
const TONE_DOT: Record<TimelineTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  neutral: 'bg-muted text-muted-foreground',
}

// Normalize an ISO date-only value (invoice periodStart) to a comparable
// datetime so it sorts correctly against the datetime fields.
const atTime = (iso: string) => (iso.includes('T') ? iso : `${iso}T00:00:00.000Z`)

type Props = {
  customer: Customer
  invoices: Invoice[] | undefined
  tickets: Ticket[] | undefined
}

// Customer 360° activity timeline (FEATURES.md §customer 360). Derived from the
// records already loaded for the detail page — the customer's lifecycle anchors
// (joined, consent) plus billing and support events — so it needs no extra
// fetch. Newest first.
export function CustomerTimeline({ customer, invoices, tickets }: Props) {
  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [
      {
        id: 'joined',
        at: atTime(customer.joinedAt),
        title: 'Pelanggan bergabung',
        icon: UserPlusIcon,
        tone: 'primary',
      },
    ]
    if (customer.consentAt) {
      list.push({
        id: 'consent',
        at: customer.consentAt,
        title: 'Persetujuan data (PDP) direkam',
        icon: ShieldCheckIcon,
        tone: 'neutral',
      })
    }
    for (const inv of invoices ?? []) {
      list.push({
        id: `inv-${inv.id}`,
        at: atTime(inv.periodStart),
        title: `Tagihan ${inv.invoiceNo} diterbitkan`,
        icon: FileTextIcon,
        tone: 'neutral',
      })
      if (inv.paidAt) {
        list.push({
          id: `pay-${inv.id}`,
          at: inv.paidAt,
          title: `Pembayaran ${inv.invoiceNo} diterima`,
          icon: BanknoteIcon,
          tone: 'success',
        })
      }
    }
    for (const t of tickets ?? []) {
      list.push({
        id: `tic-${t.id}`,
        at: t.createdAt,
        title: `Tiket dibuka: ${t.subject}`,
        icon: LifeBuoyIcon,
        tone: 'warning',
      })
    }
    return list.sort((a, b) => b.at.localeCompare(a.at))
  }, [customer.joinedAt, customer.consentAt, invoices, tickets])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aktivitas</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada aktivitas tercatat.</p>
        ) : (
          <ol className="relative space-y-5 border-border border-l pl-7">
            {events.map((e) => (
              <li key={e.id} className="relative">
                <span
                  className={cn(
                    'absolute top-0 flex size-7 items-center justify-center rounded-full ring-4 ring-card',
                    '-left-[2.6rem]',
                    TONE_DOT[e.tone],
                  )}
                >
                  <e.icon className="size-4" />
                </span>
                <p className="text-sm leading-tight">{e.title}</p>
                <p className="mt-0.5 text-muted-foreground text-xs">{formatDateTime(e.at)}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
