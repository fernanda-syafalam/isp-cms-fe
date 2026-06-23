import { Link } from '@tanstack/react-router'

import { rxDiagnosis, rxTone } from '@/components/shared/optical-health'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { statusLabel } from '@/lib/status-label'
import type { Connection } from '@/schemas/customer'

import { OnuActions } from './OnuActions'

export function ConnectionCard({
  customerId,
  connection,
}: {
  customerId: string
  connection: Connection | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Koneksi & Jaringan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection ? (
          <>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipe" value={statusLabel(connection.type)} />
              <Field label="PPPoE" value={connection.pppoeUsername} mono />
              <Field label="Profil" value={connection.profile} />
              <Field label="IP" value={connection.ipAddress} mono />
              <div>
                <dt className="text-muted-foreground text-xs">ONU Serial</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm">
                  <span className="font-mono">{connection.onuSerial ?? '—'}</span>
                  {connection.onuSerial ? (
                    <Link
                      to="/network/acs"
                      search={{ q: connection.onuSerial }}
                      className="text-primary text-xs hover:underline"
                    >
                      Kelola ONU
                    </Link>
                  ) : null}
                </dd>
              </div>
              <Field label="OLT" value={connection.olt ?? '—'} />
              <Field label="PON Port" value={connection.ponPort ?? '—'} mono />
              <div>
                <dt className="text-muted-foreground text-xs">Redaman (RX)</dt>
                <dd className="mt-1">
                  {connection.rxPower == null ? (
                    <span className="text-sm">—</span>
                  ) : (
                    <StatusBadge
                      tone={rxTone(connection.rxPower)}
                      label={`${connection.rxPower} dBm`}
                      dot={false}
                    />
                  )}
                </dd>
              </div>
            </dl>
            {connection.rxPower != null ? (
              <div
                className={`mt-4 rounded-md border px-3 py-2 text-xs ${
                  rxTone(connection.rxPower) === 'danger'
                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                    : rxTone(connection.rxPower) === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-400'
                }`}
              >
                {rxDiagnosis(connection.rxPower)}
              </div>
            ) : null}
          </>
        ) : (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Belum ada koneksi — pelanggan masih tahap prospek/instalasi.
          </p>
        )}
        {connection?.onuSerial ? (
          <div className="border-border border-t pt-4">
            <OnuActions customerId={customerId} ssid={`WiFi-${connection.pppoeUsername}`} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={`mt-0.5 text-sm ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}
