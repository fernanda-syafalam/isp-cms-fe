import { LaptopIcon, SmartphoneIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { parseUserAgent } from '@/lib/userAgent'
import type { SecurityState } from '@/schemas/security'

import type { useRevokeOtherSessions, useRevokeSession } from '../hooks/useSecurity'

type Props = {
  data: SecurityState | undefined
  isLoading: boolean
  revoke: ReturnType<typeof useRevokeSession>
  revokeOthers: ReturnType<typeof useRevokeOtherSessions>
}

// Active-session list with per-session and bulk "end other sessions" revoke.
// Each session comes from GET /security (real refresh-token store): `device`
// is the raw User-Agent, humanized at the display boundary; `current` marks
// the session making the request (no revoke control, "Sesi ini" badge).
export function SecuritySessionsCard({ data, isLoading, revoke, revokeOthers }: Props) {
  const hasOtherSessions = !!data && data.sessions.some((s) => !s.current)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Sesi aktif</CardTitle>
        {hasOtherSessions ? (
          <Button
            variant="outline"
            size="sm"
            disabled={revokeOthers.isPending}
            onClick={() => revokeOthers.mutate()}
          >
            Akhiri semua sesi lain
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-24 w-full" />
        ) : data.sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada sesi aktif.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.sessions.map((s) => {
              const { label, isMobile } = parseUserAgent(s.device)
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    {isMobile ? (
                      <SmartphoneIcon className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <LaptopIcon className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm">
                        {/* Full UA on hover for transparency; the label is humanized. */}
                        <span className="truncate" title={s.device}>
                          {label}
                        </span>
                        {s.current ? (
                          <Badge variant="secondary" className="shrink-0">
                            Sesi ini
                          </Badge>
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
                      aria-label={`Akhiri sesi ${label}`}
                    >
                      Akhiri sesi
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
