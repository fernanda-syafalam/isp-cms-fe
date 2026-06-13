import { Card, CardContent } from '@/components/ui/card'

import { FIBER_CORES } from '../lib/graph'

// Field reference: the TIA-598-C 12-color fiber code (tube + core use the same
// sequence). A collapsible card so a technician can read colors on-site.
export function FiberReference() {
  return (
    <Card>
      <CardContent className="pt-6">
        <details>
          <summary className="cursor-pointer font-medium text-foreground text-sm">
            Referensi warna fiber (TIA-598)
          </summary>
          <p className="mt-2 text-muted-foreground text-xs">
            Urutan core & tube identik; di atas 12 diulang dengan garis hitam.
          </p>
          <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {FIBER_CORES.map((c, i) => (
              <li key={c.name} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right font-mono text-muted-foreground tabular-nums">
                  {i + 1}
                </span>
                <span
                  className="size-3 shrink-0 rounded-full border border-border"
                  style={{ background: c.hex }}
                />
                <span>{c.name}</span>
              </li>
            ))}
          </ol>
        </details>
      </CardContent>
    </Card>
  )
}
