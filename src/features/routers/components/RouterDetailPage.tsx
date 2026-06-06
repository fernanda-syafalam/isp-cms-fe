import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, PlugZapIcon, RefreshCwIcon, RotateCwIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCan } from '@/features/auth'
import { formatDateTime, formatNumber } from '@/lib/format'
import type { Router } from '@/schemas/router'

import { useRebootRouter, useRouter, useSyncRouter, useTestRouter } from '../hooks/useMikrotik'
import { PoolsTab } from './PoolsTab'
import { ProfilesTab } from './ProfilesTab'
import { QueuesTab } from './QueuesTab'
import { SecretsTab } from './SecretsTab'
import { SessionsTab } from './SessionsTab'

export function RouterDetailPage({ routerId }: { routerId: string }) {
  const { data: router, isLoading, isError } = useRouter(routerId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !router) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-destructive" role="alert">
          Router tidak ditemukan.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={router.name}
        description={`${router.model} · ${router.address}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              tone={router.status === 'online' ? 'success' : 'danger'}
              label={router.status === 'online' ? 'Online' : 'Offline'}
            />
            <RouterActions routerId={routerId} />
          </div>
        }
      />

      <Tabs defaultValue="secrets">
        <TabsList>
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="secrets">PPPoE Secret</TabsTrigger>
          <TabsTrigger value="profiles">Profil</TabsTrigger>
          <TabsTrigger value="pools">IP Pool</TabsTrigger>
          <TabsTrigger value="sessions">Sesi Aktif</TabsTrigger>
          <TabsTrigger value="queues">Queue</TabsTrigger>
        </TabsList>
        <TabsContent value="ringkasan">
          <OverviewCard router={router} />
        </TabsContent>
        <TabsContent value="secrets">
          <SecretsTab routerId={routerId} />
        </TabsContent>
        <TabsContent value="profiles">
          <ProfilesTab routerId={routerId} />
        </TabsContent>
        <TabsContent value="pools">
          <PoolsTab routerId={routerId} />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsTab routerId={routerId} />
        </TabsContent>
        <TabsContent value="queues">
          <QueuesTab routerId={routerId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RouterActions({ routerId }: { routerId: string }) {
  const canManage = useCan('network.manage')
  const sync = useSyncRouter(routerId)
  const reboot = useRebootRouter(routerId)
  const test = useTestRouter(routerId)
  if (!canManage) return null
  const busy = sync.isPending || reboot.isPending || test.isPending
  return (
    <>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => test.mutate()}>
        <PlugZapIcon className="size-4" />
        Test
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => sync.mutate()}>
        <RefreshCwIcon className="size-4" />
        Sync
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => reboot.mutate()}>
        <RotateCwIcon className="size-4" />
        Reboot
      </Button>
    </>
  )
}

function OverviewCard({ router }: { router: Router }) {
  const fields: Array<{ label: string; value: string }> = [
    { label: 'Model', value: router.model },
    { label: 'IP manajemen', value: router.address },
    { label: 'Secret aktif', value: formatNumber(router.secretCount) },
    { label: 'Sinkron terakhir', value: formatDateTime(router.lastSyncAt) },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informasi router</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between gap-4 border-border border-b pb-2">
              <dt className="text-muted-foreground text-xs">{f.label}</dt>
              <dd className="text-right text-sm">{f.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function BackLink() {
  return (
    <Link
      to="/network/routers"
      className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
    >
      <ArrowLeftIcon className="size-4" />
      Kembali ke Router
    </Link>
  )
}
