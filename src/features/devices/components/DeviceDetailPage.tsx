import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, NetworkIcon, RotateCwIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { DeviceStatus } from '@/schemas/device'

import { useDevice, useRebootDevice } from '../hooks/useDevices'

const STATUS_TONE: Record<DeviceStatus, StatusTone> = {
  online: 'success',
  degraded: 'warning',
  offline: 'danger',
}

// GPON optical health: healthy ≳ −25 dBm, marginal −25…−27, bad < −27.
function rxTone(dbm: number | null): StatusTone {
  if (dbm == null) return 'neutral'
  if (dbm >= -25) return 'success'
  if (dbm >= -27) return 'warning'
  return 'danger'
}

type Props = {
  deviceId: string
}

export function DeviceDetailPage({ deviceId }: Props) {
  const { data: device, isLoading, isError } = useDevice(deviceId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !device) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-destructive" role="alert">
          Perangkat tidak ditemukan.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={device.name}
        description={`${device.type.toUpperCase()} · ${device.areaName}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={STATUS_TONE[device.status]} label={statusLabel(device.status)} />
            {device.topologyNodeId ? (
              <Button asChild variant="outline" size="sm" className="h-8">
                <Link to="/network/topology" search={{ focus: device.topologyNodeId }}>
                  <NetworkIcon className="size-4" />
                  <span className="hidden sm:inline">Lihat di topologi</span>
                </Link>
              </Button>
            ) : null}
            <RebootButton deviceId={device.id} />
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail perangkat</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipe" value={device.type.toUpperCase()} />
            <Field label="Alamat IP" value={device.ipAddress} mono />
            <Field label="Area" value={device.areaName} />
            <Field
              label="Uptime"
              value={`${formatNumber(Math.round(device.uptimeHours))} jam`}
              mono
            />
            <Field label="Terakhir terlihat" value={formatDateTime(device.lastSeenAt)} />
            <div>
              <dt className="text-muted-foreground text-xs">Redaman (RX)</dt>
              <dd className="mt-1">
                {device.rxPower == null ? (
                  <span className="text-sm">—</span>
                ) : (
                  <StatusBadge
                    tone={rxTone(device.rxPower)}
                    label={`${device.rxPower} dBm`}
                    dot={false}
                  />
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function RebootButton({ deviceId }: { deviceId: string }) {
  const reboot = useRebootDevice(deviceId)
  return (
    <Button variant="outline" size="sm" disabled={reboot.isPending} onClick={() => reboot.mutate()}>
      <RotateCwIcon className="size-4" />
      Reboot
    </Button>
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

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link to="/network/devices">
        <ArrowLeftIcon className="size-4" />
        Kembali ke perangkat
      </Link>
    </Button>
  )
}
