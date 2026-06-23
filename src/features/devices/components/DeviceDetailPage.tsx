import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, NetworkIcon, RotateCwIcon } from 'lucide-react'

import { ErrorState } from '@/components/shared/error-state'
import { PageHeader } from '@/components/shared/page-header'
import { rxTone } from '@/components/shared/optical-health'
import { Sparkline } from '@/components/shared/sparkline'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { deviceStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'

import { useDevice, useRebootDevice } from '../hooks/useDevices'

const RX_TEXT_TONE: Record<StatusTone, string> = {
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  info: 'text-primary',
  neutral: 'text-muted-foreground',
}

type Props = {
  deviceId: string
}

export function DeviceDetailPage({ deviceId }: Props) {
  const { data: device, isLoading, isError, refetch } = useDevice(deviceId)

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
        <ErrorState title="Perangkat tidak ditemukan." onRetry={() => refetch()} />
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

      {device.signalTrend && device.signalTrend.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tren redaman optik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p
                  className={cn(
                    'font-bold font-mono text-2xl tabular-nums',
                    RX_TEXT_TONE[rxTone(device.rxPower)],
                  )}
                >
                  {device.rxPower} dBm
                </p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  12 pembacaan terakhir · sehat di atas −25 dBm, buruk di bawah −27 dBm
                </p>
              </div>
              <Sparkline
                data={device.signalTrend}
                className={cn('h-12 w-40', RX_TEXT_TONE[rxTone(device.rxPower)])}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
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
