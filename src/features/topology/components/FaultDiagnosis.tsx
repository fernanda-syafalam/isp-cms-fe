import { TriangleAlertIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { ProbableFault } from '../lib/faults'
import { TYPE_LABEL } from '../lib/graph'

type Props = {
  faults: ProbableFault[]
  onSelect: (id: string) => void
}

// "Diagnosa gangguan": probable outage roots correlated from the dark customers,
// so dispatch sees "where to go" instead of scanning a sea of red. Each row
// focuses + flies to the suspect node on the map. Renders nothing when clear.
export function FaultDiagnosis({ faults, onSelect }: Props) {
  if (faults.length === 0) return null
  return (
    <Card className="border-destructive/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-destructive text-sm">
          <TriangleAlertIcon className="size-4 shrink-0" />
          Diagnosa gangguan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {faults.map((f) => (
          <button
            key={f.node.id}
            type="button"
            onClick={() => onSelect(f.node.id)}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors hover:bg-muted"
          >
            <span
              className={`size-2 shrink-0 rounded-full ${f.confidence === 'confirmed' ? 'bg-red-600' : 'bg-amber-500'}`}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-sm">
                {TYPE_LABEL[f.node.type]} · {f.node.name}
              </span>
              <span className="text-muted-foreground text-xs">
                {f.confidence === 'confirmed' ? 'Terkonfirmasi padam' : 'Kemungkinan gangguan'} ·{' '}
                {f.downCount}/{f.totalCount} pelanggan padam
              </span>
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
