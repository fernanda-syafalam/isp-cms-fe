import { BellRingIcon, CalendarClockIcon, CheckCircle2Icon } from 'lucide-react'

import { DetailSection } from '@/components/shared/detail-sheet'
import { formatDate, formatDateTime } from '@/lib/format'
import type { Invoice } from '@/schemas/invoice'

// A real, chronological timeline built only from timestamps we actually hold.
export function InvoiceTimeline({ invoice }: { invoice: Invoice }) {
  const overdueUnpaid = invoice.status === 'overdue'
  const events = [
    {
      key: 'due',
      icon: CalendarClockIcon,
      label: 'Jatuh tempo',
      at: `${invoice.dueDate}T00:00:00`,
      display: formatDate(invoice.dueDate),
      tone: overdueUnpaid ? 'danger' : 'default',
    },
    invoice.lastRemindedAt
      ? {
          key: 'remind',
          icon: BellRingIcon,
          label: 'Pengingat dikirim',
          at: invoice.lastRemindedAt,
          display: formatDateTime(invoice.lastRemindedAt),
          tone: 'default',
        }
      : null,
    invoice.paidAt
      ? {
          key: 'paid',
          icon: CheckCircle2Icon,
          label: 'Pembayaran diterima',
          at: invoice.paidAt,
          display: formatDateTime(invoice.paidAt),
          tone: 'success',
        }
      : null,
  ]
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => a.at.localeCompare(b.at))

  return (
    <DetailSection title="Lini masa">
      <ul className="space-y-3">
        {events.map((e) => {
          const Icon = e.icon
          return (
            <li key={e.key} className="flex items-start gap-3">
              <span
                className={
                  e.tone === 'danger'
                    ? 'flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive'
                    : e.tone === 'success'
                      ? 'flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
                }
              >
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-sm">{e.label}</p>
                <p className="text-muted-foreground text-xs">{e.display}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </DetailSection>
  )
}
