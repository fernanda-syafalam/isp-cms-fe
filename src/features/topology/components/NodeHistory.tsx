import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'

import { useNodeHistory } from '../hooks/useNodeHistory'

type Props = {
  nodeId: string
}

// Recent audit entries for a node — who changed what, when. Accountability for
// infra edits (a moved ODP / deleted node) and a quick "what changed before this
// outage?" before dispatch. Capped at the latest few.
export function NodeHistory({ nodeId }: Props) {
  const { data, isLoading, isError } = useNodeHistory(nodeId)
  const items = (data?.items ?? []).slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Riwayat perubahan</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : isError ? (
          <p className="text-muted-foreground text-xs">Gagal memuat riwayat.</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-xs">Belum ada perubahan tercatat.</p>
        ) : (
          <ol className="space-y-2">
            {items.map((e) => (
              <li key={e.id} className="border-border border-b pb-2 last:border-0 last:pb-0">
                <p className="text-xs">{e.summary}</p>
                <p className="text-muted-foreground text-[11px]">
                  {e.actor} · {formatDateTime(e.at)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
