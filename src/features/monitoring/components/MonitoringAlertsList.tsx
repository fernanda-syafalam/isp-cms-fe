import { Link } from '@tanstack/react-router'
import { TicketPlusIcon } from 'lucide-react'

import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import type { Alert } from '@/schemas/monitoring'

import { useAcknowledgeAlert, useCreateTicketFromAlert } from '../hooks/useMonitoring'

// Active (un-acknowledged) alerts with acknowledge / create-ticket actions.
export function MonitoringAlertsList({
  alerts,
  canManage,
}: {
  alerts: Alert[] | undefined
  canManage: boolean
}) {
  const ack = useAcknowledgeAlert()
  const ticket = useCreateTicketFromAlert()

  if (!alerts) return <p className="py-4 text-muted-foreground text-sm">Memuat…</p>
  const active = alerts.filter((a) => !a.acknowledged)
  if (active.length === 0) {
    return (
      <p className="py-4 text-center text-muted-foreground text-sm">
        Tidak ada alert aktif. Jaringan sehat. ✅
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {active.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <StatusBadge
              tone={a.severity === 'critical' ? 'danger' : 'warning'}
              label={a.severity === 'critical' ? 'Kritis' : 'Peringatan'}
            />
            <div className="min-w-0">
              <p className="truncate text-sm">{a.message}</p>
              <p className="text-muted-foreground text-xs">
                <Link
                  to="/network/devices/$deviceId"
                  params={{ deviceId: a.deviceId }}
                  className="hover:underline"
                >
                  {a.deviceName}
                </Link>{' '}
                · {formatDateTime(a.at)}
              </p>
            </div>
          </div>
          {canManage ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={ticket.isPending}
                onClick={() => ticket.mutate(a.id)}
              >
                <TicketPlusIcon className="size-4" />
                Buat tiket
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={ack.isPending}
                onClick={() => ack.mutate(a.id)}
              >
                Tandai ditangani
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
