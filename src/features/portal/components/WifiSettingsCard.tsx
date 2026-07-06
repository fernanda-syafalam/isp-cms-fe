import { WifiIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PortalWifi } from '@/schemas/portal'

import { usePortalWifi } from '../hooks/usePortal'
import { WifiSettingsDialog } from './WifiSettingsDialog'

// Self-care Wi-Fi card: shows SSID (+ CPE serial/model) and hosts the change
// dialog. Loading/error/empty states covered.
export function WifiSettingsCard() {
  const { data, isLoading, isError } = usePortalWifi()

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <WifiIcon className="size-4 text-muted-foreground" />
          Wi-Fi saya
        </CardTitle>
        {data ? <WifiSettingsDialog currentSsid={data.ssid} /> : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        ) : isError || !data ? (
          <p className="py-6 text-center text-muted-foreground text-sm" role="alert">
            Gagal memuat pengaturan Wi-Fi.
          </p>
        ) : (
          <WifiBody wifi={data} />
        )}
      </CardContent>
    </Card>
  )
}

function WifiBody({ wifi }: { wifi: PortalWifi }) {
  return (
    <dl className="space-y-3">
      <div>
        <dt className="text-muted-foreground text-xs">Nama jaringan (SSID)</dt>
        <dd className="font-medium text-lg">
          {wifi.ssid ?? <span className="text-muted-foreground">Belum diatur</span>}
        </dd>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span>{wifi.model}</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono text-xs">{wifi.serial}</span>
      </div>
    </dl>
  )
}
