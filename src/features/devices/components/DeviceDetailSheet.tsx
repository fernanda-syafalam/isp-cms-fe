import { Link } from '@tanstack/react-router'
import { ExternalLinkIcon, NetworkIcon, RotateCwIcon } from 'lucide-react'

import {
  DETAIL_LINKED_ROW_CLASS,
  DetailActionBar,
  DetailMeta,
  DetailMetaGrid,
  DetailSection,
  DetailSheet,
  DetailSheetHeader,
} from '@/components/shared/detail-sheet'
import { ErrorState } from '@/components/shared/error-state'
import { Sparkline } from '@/components/shared/sparkline'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { deviceStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Device } from '@/schemas/device'

import { useDevice, useRebootDevice } from '../hooks/useDevices'

// GPON optical health: healthy ≳ −25 dBm, marginal −25…−27, bad < −27.
function rxTone(dbm: number | null): StatusTone {
  if (dbm == null) return 'neutral'
  if (dbm >= -25) return 'success'
  if (dbm >= -27) return 'warning'
  return 'danger'
}

const RX_TEXT_TONE: Record<StatusTone, string> = {
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  info: 'text-primary',
  neutral: 'text-muted-foreground',
}

type Props = {
  deviceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Quick-view drawer for a network device. The full 360° page stays for deep
// links (Monitoring / Topologi); this is the fast in-context preview from the
// list row (drawer-first).
export function DeviceDetailSheet({ deviceId, open, onOpenChange }: Props) {
  return (
    <DetailSheet open={open} onOpenChange={onOpenChange}>
      {deviceId ? <SheetBody deviceId={deviceId} /> : null}
    </DetailSheet>
  )
}

function SheetBody({ deviceId }: { deviceId: string }) {
  const { data: device, isLoading, isError, refetch } = useDevice(deviceId)

  return (
    <>
      <DetailSheetHeader
        eyebrow="Perangkat"
        title={device?.name ?? 'Perangkat'}
        status={
          device ? (
            <StatusBadge tone={STATUS_TONE[device.status]} label={statusLabel(device.status)} />
          ) : null
        }
        description={
          device ? `${device.type.toUpperCase()} · ${device.areaName}` : 'Memuat detail perangkat…'
        }
      />

      {isLoading ? (
        <div className="space-y-4 p-5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError || !device ? (
        <ErrorState
          className="py-16"
          title="Perangkat tidak ditemukan."
          onRetry={() => refetch()}
        />
      ) : (
        <DeviceBody device={device} />
      )}
    </>
  )
}

function DeviceBody({ device }: { device: Device }) {
  return (
    <div className="divide-y divide-sidebar-border">
      <DetailActionBar>
        <RebootButton deviceId={device.id} />
        {device.topologyNodeId ? (
          <Button asChild variant="outline" size="sm">
            <Link to="/network/topology" search={{ focus: device.topologyNodeId }}>
              <NetworkIcon className="size-4" />
              Topologi
            </Link>
          </Button>
        ) : null}
      </DetailActionBar>

      <DetailSection title="Detail">
        <DetailMetaGrid>
          <DetailMeta label="Tipe">{device.type.toUpperCase()}</DetailMeta>
          <DetailMeta label="Alamat IP">{device.ipAddress}</DetailMeta>
          <DetailMeta label="Area">{device.areaName}</DetailMeta>
          <DetailMeta label="Uptime">{formatNumber(Math.round(device.uptimeHours))} jam</DetailMeta>
          <DetailMeta label="Terakhir terlihat">{formatDateTime(device.lastSeenAt)}</DetailMeta>
          <DetailMeta label="Redaman (RX)">
            {device.rxPower == null ? (
              '—'
            ) : (
              <StatusBadge
                tone={rxTone(device.rxPower)}
                label={`${device.rxPower} dBm`}
                dot={false}
              />
            )}
          </DetailMeta>
        </DetailMetaGrid>
      </DetailSection>

      {device.signalTrend && device.signalTrend.length > 1 ? (
        <DetailSection title="Tren redaman optik">
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
              <p className="mt-0.5 text-muted-foreground text-xs">12 pembacaan terakhir</p>
            </div>
            <Sparkline
              data={device.signalTrend}
              className={cn('h-12 w-40', RX_TEXT_TONE[rxTone(device.rxPower)])}
            />
          </div>
        </DetailSection>
      ) : null}

      <DetailSection title="Tertaut">
        <Link
          to="/network/devices/$deviceId"
          params={{ deviceId: device.id }}
          className={DETAIL_LINKED_ROW_CLASS}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <ExternalLinkIcon className="size-4" />
          </span>
          <span className="grid min-w-0 flex-1">
            <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wider">
              Perangkat 360°
            </span>
            <span className="truncate text-sm">Halaman detail lengkap</span>
          </span>
          <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </DetailSection>
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
