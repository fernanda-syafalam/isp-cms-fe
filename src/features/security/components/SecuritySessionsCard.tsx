import { LaptopIcon, SmartphoneIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import type { SecurityState } from '@/schemas/security'

import type { useRevokeOtherSessions, useRevokeSession } from '../hooks/useSecurity'

type Props = {
  data: SecurityState | undefined
  isLoading: boolean
  revoke: ReturnType<typeof useRevokeSession>
  revokeOthers: ReturnType<typeof useRevokeOtherSessions>
}

const isMobile = (device: string) =>
  device.toLowerCase().includes('android') || device.toLowerCase().includes('ios')

// Active-session list with per-session and bulk "end other sessions" revoke.
export function SecuritySessionsCard({ data, isLoading, revoke, revokeOthers }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Sesi aktif</CardTitle>
        {data && data.sessions.length > 1 ? (
          <Button
            variant="outline"
            size="sm"
            disabled={revokeOthers.isPending}
            onClick={() => revokeOthers.mutate()}
          >
            Akhiri sesi lain
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <ul className="divide-y divide-border">
            {data.sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  {isMobile(s.device) ? (
                    <SmartphoneIcon className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <LaptopIcon className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {s.device}
                      {s.current ? (
                        <span className="ml-2 text-green-600 text-xs">(sesi ini)</span>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {s.ip} · {formatDateTime(s.lastActiveAt)}
                    </p>
                  </div>
                </div>
                {!s.current ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(s.id)}
                  >
                    Akhiri
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
